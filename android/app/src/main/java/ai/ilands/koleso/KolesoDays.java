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

    /** Возвращает {индекс саббата, дней до него}. Сегодня = 0 дней. */
    static int[] nextSabbat(Calendar now) {
        int doy = dayOfYear(now);
        int year = now.get(Calendar.YEAR);
        int bestI = 0, bestD = 9999;
        for (int i = 0; i < S_MD.length; i++) {
            GregorianCalendar g = new GregorianCalendar(year, S_MD[i][0] - 1, S_MD[i][1]);
            int d = g.get(Calendar.DAY_OF_YEAR) - doy;
            if (d >= 0 && d < bestD) { bestD = d; bestI = i; }
        }
        if (bestD == 9999) { // после Йоля — до Имболка следующего года
            GregorianCalendar g = new GregorianCalendar(year + 1, S_MD[0][0] - 1, S_MD[0][1]);
            bestD = daysInYear(year) - doy + g.get(Calendar.DAY_OF_YEAR);
            bestI = 0;
        }
        return new int[]{bestI, bestD};
    }

    static String line(Calendar now) {
        int[] n = nextSabbat(now);
        String s;
        if (n[1] == 0) {
            s = "Сегодня " + S_NAME[n[0]] + " · " + S_NOTE[n[0]];
        } else if (n[1] == 1) {
            s = S_NAME[n[0]] + " завтра · " + S_NOTE[n[0]];
        } else {
            s = "До " + S_GEN[n[0]] + " " + n[1] + " дн. · " + S_NOTE[n[0]];
        }
        int r = runeIndex(now);
        return s + "\n" + RUNE_GLYPH[r] + " " + RUNE_NAME[r] + ": " + RUNE_WORD[r];
    }
}
