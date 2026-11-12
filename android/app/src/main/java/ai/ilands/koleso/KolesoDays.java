package ai.ilands.koleso;

import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;

/**
 * Один и тот же расчёт, что в index.html: восемь саббатов по настоящим дням года
 * и руна дня (Elder Futhark, 24, отсчёт от 1 января 2026).
 */
final class KolesoDays {

    static final String[] S_NAME = {"Имболк", "Остара", "Белтайн", "Лита", "Лугнасад", "Мабон", "Самхейн", "Йоль"};
    static final String[] S_GEN = {"Имболка", "Остары", "Белтайна", "Литы", "Лугнасада", "Мабона", "Самхейна", "Йоля"};
    static final String[] S_NOTE = {
        "первое дыхание весны, свечи и молоко",
        "равноденствие, яйцо и всходы",
        "костры, союз, живой огонь",
        "солнцестояние, полная сила года",
        "первый сноп, жатва и ремесло",
        "равноденствие, счёт и благодарность",
        "тонкая завеса, память, порог",
        "солнце рождается заново"
    };
    static final int[][] S_MD = {{2, 2}, {3, 20}, {5, 1}, {6, 21}, {8, 1}, {9, 22}, {10, 31}, {12, 21}};

    static final String[] RUNE_NAME = {
        "Феху", "Уруз", "Турисаз", "Ансуз", "Райдо", "Кеназ", "Гебо", "Вуньо",
        "Хагалаз", "Наутиз", "Иса", "Йера", "Эйваз", "Перт", "Альгиз", "Соулу",
        "Тейваз", "Беркана", "Эваз", "Манназ", "Лагуз", "Ингуз", "Дагаз", "Отала"
    };
    static final String[] RUNE_GLYPH = {
        "ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ",
        "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ",
        "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"
    };
    static final String[] RUNE_WORD = {
        "что пришло, то и уйдёт, если не считать",
        "сила без упряжи: тело сильнее планов",
        "не лезь в это сегодня, шип острее руки",
        "сказанное слово весит больше сделанного",
        "дорога важнее выбора на этом повороте",
        "смотри в темноту, а не вокруг неё",
        "обмен должен быть равным, иначе это не дар",
        "не отвергай хорошее из подозрительности",
        "снос, а не катастрофа: расчищает место",
        "теснота показывает, что действительно нужно",
        "стоять. Не двигай то, что сковано",
        "срок важнее желания",
        "держит корнями глубже, чем видно снаружи",
        "не всё решается твоей рукой, и это честно",
        "подними руки и отступи, это не отступление",
        "иди по свету, а не по удобству",
        "справедливость выше победы",
        "рост это медленно и вверх",
        "движение вдвоём, а не рывок в одиночку",
        "посмотри, кто рядом, прежде чем решать",
        "поддайся, и не сломаешься",
        "сядь и дай дойти: раньше не откроется",
        "перелом: свет на другой стороне",
        "назад в своё, а не в чужое"
    };

    /* Та же арифметика, что в index.html: синодический месяц от новолуния 6.1.2000 18:14 UTC.
       Точность около суток; у самой границы фазы может разойтись с таблицей. */
    static final double SYN = 29.530588853;
    static final long NEW_EPOCH = 946727640000L; // 2000-01-06T18:14Z
    static final String[] MOON_NAME = {"новолуние", "молодая луна", "первая четверть", "прибывающая луна",
            "полнолуние", "убывающая луна", "последняя четверть", "старая луна"};
    static final String[] MOON_CIRCLE = {
        "Небо укрыло Луну. В этой тишине можно услышать семя нового намерения.",
        "Серебряный серп набирает силу. Пусть и твой замысел тянется к свету.",
        "На пути возник порог. Какой шаг поможет его переступить?",
        "Свет прибывает — укрепи то, что хочешь сохранить и взрастить.",
        "Луна открыла свой полный лик. Время для обряда, созерцания или благодарности.",
        "Свет убывает, унося лишнее. Что можно отпустить вместе с ним?",
        "Старые узлы ослабевают. Развяжи один из них — внутри или снаружи.",
        "За завесой темноты зреет покой. Не всякая тайна требует ответа сегодня."
    };

    static final String[] RITUAL_M = {
        "Пробуждение: день ещё не раскрыл своих тайн. Три спокойных вдоха и одно слово-оберег на сегодня.",
        "Солнечный привет: прикоснись к свету. Что хочешь призвать в этот день?",
        "Капля намерения: налей воды, подержи чашу в ладонях, назови одно намерение и сделай глоток.",
        "Корни и крылья: почувствуй опору под ногами и дыхание, открывающее путь вперёд.",
        "Знак дня: выбери символ, камень или цвет, который будет напоминать о намерении.",
        "Тихая благодарность: вспомни одну вещь, за которую благодарно сердце."
    };
    static final String[] RITUAL_E = {
        "Снятие дня: медленный выдох, оставь за порогом то, что больше не нужно нести.",
        "Три искры: вспомни три мгновения, которые сегодня согрели.",
        "Запись в гримуар: одно чувство, одна мысль и одна загадка от этого дня.",
        "Очищение водой: умойся, представляя, как вода уносит дневной шум.",
        "Лунная пауза: посмотри на небо, а если закрыто — прислушайся к тишине внутри.",
        "Сонное заклинание: ладонь на сердце, назови то, что можно отпустить до утра."
    };

    /** Возраст луны в днях на полдень указанной даты. */
    static double moonAge(Calendar when) {
        Calendar c = (Calendar) when.clone();
        c.set(Calendar.HOUR_OF_DAY, 12);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        double days = (c.getTimeInMillis() - NEW_EPOCH) / 86400000.0;
        double age = days % SYN;
        if (age < 0) age += SYN;
        return age;
    }

    static int moonIndex(Calendar when) {
        return (int) Math.round(moonAge(when) / SYN * 8) % 8;
    }

    private KolesoDays() {}

    static int dayOfYear(Calendar c) {
        return c.get(Calendar.DAY_OF_YEAR);
    }

    static int daysInYear(int y) {
        GregorianCalendar g = new GregorianCalendar(y, Calendar.DECEMBER, 31);
        return g.get(Calendar.DAY_OF_YEAR);
    }

    static int runeIndex(Calendar now) {
        GregorianCalendar a = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
        a.clear();
        a.set(now.get(Calendar.YEAR), now.get(Calendar.MONTH), now.get(Calendar.DAY_OF_MONTH));
        GregorianCalendar b = new GregorianCalendar(TimeZone.getTimeZone("UTC"));
        b.clear();
        b.set(2026, Calendar.JANUARY, 1);
        long days = Math.round((a.getTimeInMillis() - b.getTimeInMillis()) / 86400000.0);
        int n = (int) (days % 24);
        if (n < 0) n += 24;
        return n;
    }

    /** Возвращает {индекс саббата, дней до него}. Сегодня = 0 дней.
        south = true: колесо сдвинуто на полгода (Южное полушарие). */
    static int[] nextSabbat(Calendar now) {
        return nextSabbat(now, false);
    }

    static int[] nextSabbat(Calendar now, boolean south) {
        int doy = dayOfYear(now);
        int year = now.get(Calendar.YEAR);
        int yl = daysInYear(year);
        int[] cand = new int[S_MD.length];
        int[] shifted = new int[S_MD.length];
        for (int i = 0; i < S_MD.length; i++) {
            GregorianCalendar g = new GregorianCalendar(year, S_MD[i][0] - 1, S_MD[i][1]);
            int d = g.get(Calendar.DAY_OF_YEAR);
            cand[i] = d;
            shifted[i] = d;
            if (south) {
                shifted[i] = d + 182;
                if (shifted[i] > yl) shifted[i] -= yl;
            }
        }
        int bestI = 0, bestD = 9999;
        for (int i = 0; i < shifted.length; i++) {
            int d = shifted[i] - doy;
            if (d >= 0 && d < bestD) { bestD = d; bestI = i; }
        }
        if (bestD == 9999) { // после последнего порога — до ближайшего в следующем году
            int bestNext = 9999, idx = 0;
            for (int i = 0; i < shifted.length; i++) {
                if (shifted[i] < bestNext) { bestNext = shifted[i]; idx = i; }
            }
            bestD = yl - doy + bestNext;
            bestI = idx;
        }
        return new int[]{bestI, bestD};
    }

    static String line(Calendar now) {
        return line(now, false);
    }

    static String line(Calendar now, boolean south) {
        int[] n = nextSabbat(now, south);
        String s;
        if (n[1] == 0) {
            s = "Сегодня " + S_NAME[n[0]] + " · " + S_NOTE[n[0]];
        } else if (n[1] == 1) {
            s = S_NAME[n[0]] + " завтра · " + S_NOTE[n[0]];
        } else {
            s = "До " + S_GEN[n[0]] + " " + n[1] + " дн. · " + S_NOTE[n[0]];
        }
        int r = runeIndex(now);
        double age = moonAge(now);
        int mi = moonIndex(now);
        String grow = age < SYN / 2 ? "растёт" : "убывает";
        String moon = MOON_NAME[mi] + ", " + grow + "\n" + MOON_CIRCLE[mi];
        String ritual = age < SYN / 2
                ? "\n" + RITUAL_M[now.get(Calendar.DAY_OF_YEAR) % RITUAL_M.length]
                : "\n" + RITUAL_E[now.get(Calendar.DAY_OF_YEAR) % RITUAL_E.length];
        return s + "\n" + RUNE_GLYPH[r] + " " + RUNE_NAME[r] + ": " + RUNE_WORD[r]
                + "\n" + moon + ritual;
    }
}
