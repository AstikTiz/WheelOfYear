package ai.ilands.koleso;

import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.provider.MediaStore;
import android.util.Base64;
import android.content.pm.PackageManager;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import android.content.Intent;
import android.net.Uri;

public class MainActivity extends Activity {
    private WebView web;
    private Context ctx;
    static final int REQ_BACKUP = 1408;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ctx = this;
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setBackgroundColor(0xFF15110D);
        web.addJavascriptInterface(new Bridge(), "Koleso");
        /* без этого window.confirm() в WebView молча возвращает false: удаление записей не срабатывало */
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton("Хорошо", new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface d, int w) { result.confirm(); }
                        })
                        .setOnCancelListener(new DialogInterface.OnCancelListener() {
                            public void onCancel(DialogInterface d) { result.cancel(); }
                        })
                        .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton("Да", new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface d, int w) { result.confirm(); }
                        })
                        .setNegativeButton("Отмена", new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface d, int w) { result.cancel(); }
                        })
                        .setOnCancelListener(new DialogInterface.OnCancelListener() {
                            public void onCancel(DialogInterface d) { result.cancel(); }
                        })
                        .show();
                return true;
            }
        });
        /* уведомление раз в день: канал + разрешение + будильник */
        Notify.schedule(this);
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 33);
        }
        setContentView(web);
        web.loadUrl("file:///android_asset/www/index.html");
    }

    public class Bridge {
        /** Час, в который приходит уведомление (по умолчанию 9). */
        @JavascriptInterface
        public int wakeHour() {
            return Notify.wakeHour(ctx);
        }

        /** Поставить другой час, 0–23. */
        @JavascriptInterface
        public void setWakeHour(int hour) {
            Notify.setWakeHour(ctx, hour);
        }

        /** Спросить разрешение на уведомления (Android 13+). */
        @JavascriptInterface
        public void askNotifications() {
            if (Build.VERSION.SDK_INT >= 33
                    && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(new Runnable() {
                    public void run() {
                        requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 33);
                    }
                });
            }
        }

        /** Проверить прямо сейчас, что уведомление выглядит как надо. */
        @JavascriptInterface
        public void testNotification() {
            askNotifications();
            Notify.show(ctx, KolesoDays.line(java.util.Calendar.getInstance()));
        }

        /** Сохраняет рисунок руны в Pictures/Koleso. */
        @JavascriptInterface
        public void savePng(final String name, final String base64) {
            saveImage(name, base64, "image/png");
        }

        /** Сохраняет PNG или JPG в Pictures/Koleso (галерея). */
        @JavascriptInterface
        public void saveImage(final String name, final String base64, final String mime) {
            final String type = (mime == null || mime.isEmpty()) ? "image/png" : mime;
            try {
                byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Images.Media.DISPLAY_NAME, name);
                    cv.put(MediaStore.Images.Media.MIME_TYPE, type);
                    cv.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Koleso");
                    Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
                    if (uri == null) throw new Exception("media store");
                    java.io.OutputStream os = getContentResolver().openOutputStream(uri);
                    os.write(bytes);
                    os.close();
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(
                            Environment.DIRECTORY_PICTURES), "Koleso");
                    if (!dir.exists()) dir.mkdirs();
                    File out = new File(dir, name);
                    FileOutputStream fos = new FileOutputStream(out);
                    fos.write(bytes);
                    fos.close();
                }
                toast("Сохранено в галерею: Pictures/Koleso/" + name);
            } catch (Exception e) {
                toast("Не удалось сохранить рисунок");
            }
        }

        /** Полушарие: южное сдвигает колесо на полгода и в уведомлении тоже. */
        @JavascriptInterface
        public void setHemisphere(String hemi) {
            Notify.setSouth(ctx, "south".equals(hemi));
        }

        /** Резервная копия: пишем текстовый файл в Загрузки/Koleso. */
        @JavascriptInterface
        public void saveBackup(final String name, final String text) {
            try {
                byte[] bytes = text.getBytes("UTF-8");
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                    cv.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                    cv.put(MediaStore.Downloads.RELATIVE_PATH, "Download/Koleso");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (uri == null) throw new Exception("media store");
                    java.io.OutputStream os = getContentResolver().openOutputStream(uri);
                    os.write(bytes);
                    os.close();
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(
                            Environment.DIRECTORY_DOWNLOADS), "Koleso");
                    if (!dir.exists()) dir.mkdirs();
                    FileOutputStream fos = new FileOutputStream(new File(dir, name));
                    fos.write(bytes);
                    fos.close();
                }
                toast("Копия сохранена: Загрузки/Koleso/" + name);
            } catch (Exception e) {
                toast("Не удалось сохранить копию");
            }
        }

        /** Выбрать файл копии: результат уходит в window.kolesoLoadBackup(base64). */
        @JavascriptInterface
        public void pickBackup() {
            runOnUiThread(new Runnable() {
                public void run() {
                    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("*/*");
                    startActivityForResult(i, REQ_BACKUP);
                }
            });
        }

        /** Системное окно печати: оттуда «Сохранить как PDF». */
        @JavascriptInterface
        public void printPage() {
            runOnUiThread(new Runnable() {
                public void run() {
                    PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    String job = "koleso-grimoire";
                    PrintDocumentAdapter adapter;
                    if (android.os.Build.VERSION.SDK_INT >= 21) {
                        adapter = web.createPrintDocumentAdapter(job);
                    } else {
                        adapter = web.createPrintDocumentAdapter();
                    }
                    PrintAttributes attrs = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A5)
                            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                            .build();
                    pm.print(job, adapter, attrs);
                }
            });
        }
    }

    private void toast(final String text) {
        runOnUiThread(new Runnable() {
            public void run() {
                Toast.makeText(ctx, text, Toast.LENGTH_LONG).show();
            }
        });
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != REQ_BACKUP || res != RESULT_OK || data == null || data.getData() == null) return;
        try {
            InputStream in = getContentResolver().openInputStream(data.getData());
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
            in.close();
            String b64 = Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP);
            if (web != null) web.evaluateJavascript("window.kolesoLoadBackup('" + b64 + "')", null);
        } catch (Exception e) {
            toast("Не удалось прочитать файл копии");
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }
}