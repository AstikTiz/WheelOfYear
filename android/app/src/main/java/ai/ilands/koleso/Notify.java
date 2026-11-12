package ai.ilands.koleso;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import java.util.Calendar;

/** Одно уведомление в день: ближайший саббат и руна дня. Без интернета и без сервера. */
public class Notify extends BroadcastReceiver {

    static final String CHANNEL = "koleso_day";
    static final String PREFS = "koleso";
    static final String KEY_HOUR = "wake_hour";
    static final String KEY_LAST = "last_sent_doy";
    static final int REQUEST = 1407;
    static final int DEFAULT_HOUR = 9;

    @Override
    public void onReceive(Context c, Intent intent) {
        boolean boot = intent != null && Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction());
        if (boot) {
            schedule(c);
            return;
        }
        Calendar now = Calendar.getInstance();
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int doy = now.get(Calendar.DAY_OF_YEAR) * 10000 + now.get(Calendar.YEAR) % 100;
        if (p.getInt(KEY_LAST, -1) == doy) return; // уже было сегодня
        p.edit().putInt(KEY_LAST, doy).apply();
        show(c, KolesoDays.line(now));
        schedule(c); // после неточного срабатывания будильник ставим заново на завтра
    }

    static void show(Context c, String text) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Колесо года", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Саббат и руна дня");
            nm.createNotificationChannel(ch);
        }
        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0;
        PendingIntent pi = PendingIntent.getActivity(c, REQUEST, open, flags);

        Calendar now = Calendar.getInstance();
        int[] nb = KolesoDays.nextSabbat(now);
        String title = nb[1] == 0 ? "Сегодня " + KolesoDays.S_NAME[nb[0]] : "Колесо года";

        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(c, CHANNEL)
                : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.icon)
         .setContentTitle(title)
         .setContentText(text.split("\n")[0])
         .setStyle(new Notification.BigTextStyle().bigText(text))
         .setContentIntent(pi)
         .setAutoCancel(true);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(Notification.PRIORITY_DEFAULT);
        nm.notify(REQUEST, b.build());
    }

    static int wakeHour(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(KEY_HOUR, DEFAULT_HOUR);
    }

    static void setWakeHour(Context c, int hour) {
        if (hour < 0 || hour > 23) return;
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putInt(KEY_HOUR, hour).apply();
        schedule(c);
    }

    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        int flags = Build.VERSION.SDK_INT >= 23
                ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pi = PendingIntent.getBroadcast(c, REQUEST, new Intent(c, Notify.class), flags);
        am.cancel(pi);

        Calendar at = Calendar.getInstance();
        at.set(Calendar.HOUR_OF_DAY, wakeHour(c));
        at.set(Calendar.MINUTE, 0);
        at.set(Calendar.SECOND, 0);
        at.set(Calendar.MILLISECOND, 0);
        if (at.getTimeInMillis() <= System.currentTimeMillis()) at.add(Calendar.DAY_OF_YEAR, 1);
        am.setInexactRepeating(AlarmManager.RTC_WAKEUP, at.getTimeInMillis(), AlarmManager.INTERVAL_DAY, pi);
    }
}
