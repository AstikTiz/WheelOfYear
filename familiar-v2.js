/* ============================================================
   Фамилияры Колеса года. Версия 2.
   Фамиляры приходят ТОЛЬКО на праздники. Каждый — в свой праздник.
   Можно принять только одного; выбор перманентен (без переустановки
   приложения фамиляра не сменить).

   Подключение (как и раньше):
   1) familiar.js рядом с index.html, <script src="familiar.js"></script> перед </body>
   2) В workflow добавить familiar.js в строку cp
   3) Спрайты: images/familiar-rabbit.png, -cat.png, -snake.png,
      -dreven.png, -raven.png, -owl.png (поправь пути в FAMILIARS)

   Состояние: Koleso.loadFamiliar/saveFamiliar (нативно) или localStorage.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- виды фамиляров ---------- */

  // sabbats: индексы праздников, в которые приходит этот фамиляр.
  // 0 Имболк, 1 Остара, 2 Белтайн, 3 Лита, 4 Лугнасад, 5 Мабон, 6 Самхейн, 7 Йоль.
  // Поменяй при желании — код один на всех, отличаются только спрайт и пара фраз.
  var FAMILIARS = {
    rabbit: { title: 'кролик',  epithet: 'Листвень', sabbats: [0, 1], sprite: 'images/familiar-rabbit.png',
      preview: 'images/familiar-listven-preview.webp',
      own: ['Я сегодня перепрыгнул три пня подряд. Три! Не веришь — проверь мох.',
            'Ушами я слышу, как растёт трава. Хрусть-хрусть. Нетерпеливо.'] },
    cat:    { title: 'кот',     epithet: 'Вечерник', sabbats: [2],    sprite: 'images/familiar-cat.png',
      preview: 'images/familiar-portrait.jpg',
      own: ['Я крался за зайцем. Зачем — не спрашивай. Коты так не объясняют.',
            'Ночью я ходил по краю мира. Край оказался мягким, как мох.'] },
    snake:  { title: 'змея',    epithet: 'Гладкая',  sabbats: [3],    sprite: 'images/familiar-snake.png',
      own: ['Я сбросила кожу у тёплого камня. Старую оставь на алтаре — пригодится.',
            'Языком я пробую не ветер, а сам воздух. Сегодня он сладковатый.'] },
    dreven: { title: 'древень', epithet: 'Корнехват', sabbats: [4, 7], sprite: 'images/familiar-dreven.png',
      own: ['Мой мох сегодня гуще вчерашнего. Это хороший знак для твоих замыслов.',
            'Я стоял неподвижно семь дней. Мимо прошли олень, две сныти и твоя мысль.'] },
    raven:  { title: 'ворон',   epithet: 'Железнокрыл', sabbats: [5],  sprite: 'images/familiar-raven.png',
      preview: 'images/raven/raven-portrait.jpg',
      own: ['Я помню место, где лежит блестящее. Все вороны помнят. Это наше дело.',
            'С высоты дуба твой год выглядит почти круглым. Почти.'] },
    owl:    { title: 'сова',    epithet: 'Полуночница', sabbats: [6], sprite: 'images/familiar-owl.png',
      own: ['Я видела вещие сны. За себя и за тебя — пока ты спала.',
            'Глаз у меня два, а видится семью. Особенно то, что ты откладываешь.'] }
  };

  // Девять имён — личное имя выбирается случайно при принятии.
  var NINE_NAMES = ['Мох', 'Иней', 'Репей', 'Смола', 'Луч', 'Корень', 'Пепел', 'Игла', 'Туман'];

  var S_NAMES = ['Имболк','Остара','Белтайн','Лита','Лугнасад','Мабон','Самхейн','Йоль'];
  var S_MD = [[2,2],[3,20],[5,1],[6,21],[8,1],[9,22],[10,31],[12,21]];
  var GIFTS = ['первую подснежную веточку','каплю первого мёда','ленту цвета пламени',
    'солнечный камешек','колосок с жатвы','виноградину урожая','гребень из воска свечи',
    'веточку омелы','жёлудь из дуба на краю света','перышко, найденное в тумане'];

  // Отлучки: [длительность, вес]. Числа символичные: 3 мин, 3 часа, 3 дня, 9 дней, 7 дней.
  var AWAY = [
    [3 * 60e3,      0.14],
    [3 * 36e5,      0.20],
    [3 * 864e5,     0.22],
    [9 * 864e5,     0.24],
    [7 * 864e5,     0.20]
  ];

  /* ---------- фразы ---------- */

  var PH = {
    mystical: [
      'Три вещи нельзя спешить: тесто, клятву и весну.',
      'Сегодня тень длиннее слова. Пользуйся.',
      'Я нёс камень через поле. Камень нёс меня. Оба правы.',
      'Тихий час — тоже ритуал, только без свечей.',
      'Между «хочу» и «сделаю» живёт маленькое чудовище. Корми его первым шагом.',
      'Ветер сегодня читает мысли вслух. Говори о своих планах тише.'
    ],
    wicca: [
      'Помнишь завет: делай, что хочешь, лишь бы никому не навредило? Сегодня он особенно пригодится.',
      'Круг не держит — круг напоминает. Напомни себе, где границы.',
      'Богиня и Рогатый Бог не проверяют домашку. Но они замечают, когда ты не приходишь к алтарю.',
      'Перед ритуалом — гости, дела и телефон остаются за порогом. За порогом, слышишь?',
      'Это традиция, а не расписание. Но традиции, как сад, поливать надо.',
      'Элементы не служат — они соглашаются помочь. Скажи спасибо. Вслух или мысленно.'
    ],
    remind: [
      'Фаза луны сегодня — {moon}. Есть что-то, что ты откладываешь? Вот с этим и начни.',
      'Ритуал не обязан быть большим. Свеча, слово, выдох — уже обряд.',
      'Ты давно ничего не записывала в гримуар. Страницы скрипят от нетерпения.'
    ],
    weather: {
      winter: ['Снег сегодня пищит под лапой — крепкий мороз. Хороший день для тёплых свечей.'],
      spring: ['Ветер тёплый и глупый, как козлёнок. Пахнет сырой землёй и началом.'],
      summer: ['Воздух гудит, как раскалённый камень. Даже тени сегодня вялые.'],
      autumn: ['Туман стоял до полудня. Я шёл по нему и чуть не ушёл в чужой сон.']
    },
    forest: [
      'В лесу я повстречал {meet}. Очень горжусь. Рассказываю всем. Ты — первая.',
      'Знаешь, кого я видел в чаще? {meet}. И оно меня тоже видело. Мы оба сделали вид, что заняты.',
      'На тропе лежал {meet}. Я обошёл. Можно было и поздороваться, но я не уверен в этикете.'
    ],
    MEET: ['железного жука величиной с орех', 'лису, читающую запахи', 'светлячка, который не соглашался гаснуть',
           'старый пень, похожий на спящего медведя', 'корягу, ужасно похожую на человека', 'оленьи следы, которые обрывались ни с того ни с сего'],
    altar: [
      'Алтарь твой пылится. Я проверял. Протри хотя бы свечи, а?',
      'Я заглянул к алтарю. Там тихо. Слишком тихо. Зажги что-нибудь сегодня.',
      'Алтарь — как сад: неделю не поливал — и он уже не твой, а просто полка.'
    ],
    grumpy: [
      'Я привык к своему имени. Оно мне {name} подошло лучше.',
      'Имя — это тоже договор. Ты его переписала. Я обиделся. Ровно на девять дней.',
      'Ладно. Можешь звать меня {name}. Но три дня я буду делать вид, что не слышу.'
    ],
    offendedPet: [
      '…мур. То есть. Ничего. Ещё.', 'Чуть-чуть оттаял. Ещё одно.', 'Прощаю. Но имя новое я запомню дольше, чем старое.'
    ],
    offer: [
      'С праздником. Я {title} {epithet}, странствую между порогами года. Приютите меня? Я умею приносить вещи и помнить обряды.',
      '{title} {epithet} — меня зовут так. Прихожу только на праздники, ухожу в странствия. Примешь?'
    ],
    accepted: [
      'Тогда я остаюсь. Моё имя среди девяти тайных: {name}. Не переименовывай меня без нужды — имена держат форму.',
      'Принято. Зови меня {name}. Я буду приходить в {sabbats} и иногда исчезать. Не ищи меня — я сам найду.'
    ]
  };

  /* ---------- хранилище ---------- */

  var KEY = 'woy-familiar';

  function storeRead() {
    if (window.Koleso && window.Koleso.loadFamiliar) {
      try { return window.Koleso.loadFamiliar() || ''; } catch (e) {}
    }
    try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }
  function storeWrite(json) {
    if (window.Koleso && window.Koleso.saveFamiliar) {
      try { window.Koleso.saveFamiliar(json); return; } catch (e) {}
    }
    try { localStorage.setItem(KEY, json); } catch (e) {}
  }

  function freshState() {
    return { v: 2, chosen: null, name: null, mood: 'ok', pets: 0,
             awayUntil: 0, items: [], asked: [], offered: null,
             lastAltarWarn: '', visits: 0 };
  }
  function load() {
    var raw = storeRead();
    if (raw) { try { var s = JSON.parse(raw); if (s && s.v === 2) return s; } catch (e) {} }
    return freshState(); // старое состояние версии 1 просто не подходит — начинаем с чистого листа
  }
  function save() { storeWrite(JSON.stringify(state)); }

  /* ---------- даты, сезон, саббат, луна ---------- */

  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function dayOfYearSafe(y, m, d) {
    if (typeof dayOfYear === 'function') return dayOfYear(y, m, d);
    return Math.floor((new Date(y, m - 1, d) - new Date(y, 0, 0)) / 864e5);
  }
  function season() {
    var m = new Date().getMonth() + 1;
    if (typeof hemisphere === 'function' && hemisphere() === 'south') m = ((m + 5) % 12) + 1;
    if (m === 12 || m <= 2) return 'winter';
    if (m <= 5)  return 'spring';
    if (m <= 8)  return 'summer';
    return 'autumn';
  }
  function moonName() {
    var SYN = 29.530588853, EPOCH = 946727640000;
    var days = (new Date().getTime() - EPOCH) / 864e5;
    var names = ['новолуние','молодая луна','первая четверть','прибывающая луна',
                 'полнолуние','убывающая луна','последняя четверть','старая луна'];
    return names[Math.round((((days % SYN) + SYN) % SYN) / SYN * 8) % 8];
  }
  function nextSabbat() {
    var now = new Date(), y = now.getFullYear();
    var south = typeof hemisphere === 'function' && hemisphere() === 'south';
    var doy = dayOfYearSafe(y, now.getMonth() + 1, now.getDate());
    var yl = dayOfYearSafe(y, 12, 31), half = Math.floor(yl / 2);
    function cand(year) {
      var len = dayOfYearSafe(year, 12, 31), out = [];
      for (var i = 0; i < 8; i++) {
        var d = dayOfYearSafe(year, S_MD[i][0], S_MD[i][1]);
        if (south) { d += half; if (d > len) d -= len; }
        out.push(d);
      }
      return out;
    }
    var c = cand(y), best = -1, bd = 1e9;
    for (var i = 0; i < 8; i++) { var diff = c[i] - doy; if (diff >= 0 && diff < bd) { bd = diff; best = i; } }
    if (best < 0) { var cn = cand(y + 1); for (i = 0; i < 8; i++) if (cn[i] < bd) { bd = cn[i]; best = i; } bd = yl - doy + bd; }
    return [best, bd];
  }

  function drawAway(grumpy) {
    var r = Math.random(), acc = 0, dur = AWAY[0][0];
    for (var i = 0; i < AWAY.length; i++) { acc += AWAY[i][1]; if (r <= acc) { dur = AWAY[i][0]; break; } }
    if (grumpy) dur = Math.max(dur, 3 * 864e5); // обиженный уходит минимум на три дня
    return Date.now() + dur;
  }
  function awayText(until) {
    var ms = until - Date.now();
    if (ms <= 0) return '';
    if (ms < 36e5) return 'скоро вернусь';
    if (ms < 864e5) return 'вернусь через несколько часов';
    var d = Math.round(ms / 864e5);
    return d >= 7 ? 'ушёл в странствие. Недели хватит?' : 'вернусь через ' + d + ' ' + (d === 3 ? 'дня' : 'дней');
  }

  /* ---------- заметки гримуара: спрашиваем «сбылось ли?» ---------- */

  function readNotes() {
    try { var v = JSON.parse(localStorage.getItem('woy-grimoire') || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function fmtDay(d) {
    var p = d.split('-').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return d;
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }
  function noteQuestion() {
    var notes = readNotes().filter(function (n) { return n.text && state.asked.indexOf(n.id) === -1; });
    if (!notes.length) return null;
    var n = notes[Math.floor(Math.random() * notes.length)];
    state.asked.push(n.id);
    if (state.asked.length > 200) state.asked = state.asked.slice(-100);
    var snippet = n.text.length > 70 ? n.text.slice(0, 70) + '…' : n.text;
    return 'Помнишь, ты писала ' + fmtDay(n.date || todayKey()) + ': «' + snippet + '» — как последствия? Сбылось?';
  }

  /* ---------- выбор фразы ---------- */

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function fill(t, type) {
    var f = FAMILIARS[type || state.chosen || (state.offered && state.offered.t)] || {};
    return t.replace('{name}', state.name || '')
            .replace('{title}', f.title || '')
            .replace('{epithet}', f.epithet || '')
            .replace('{sabbats}', (f.sabbats || []).map(function (i) { return S_NAMES[i]; }).join(' и '))
            .replace('{moon}', moonName())
            .replace('{meet}', pick(PH.MEET));
  }
  function nextPhrase() {
    if (state.mood === 'grumpy') return fill(pick(PH.grumpy));
    var notes = readNotes();
    var lastNote = notes.length ? notes[notes.length - 1].created || 0 : 0;
    var idleAltar = Date.now() - lastNote > 7 * 864e5;
    var roll = Math.random();
    if (idleAltar && state.lastAltarWarn !== todayKey() && roll < 0.3) {
      state.lastAltarWarn = todayKey(); return fill(pick(PH.altar));
    }
    if (roll < 0.22) return noteQuestion() || fill(pick(PH.mystical));
    if (roll < 0.42) return fill(pick(PH.wicca));
    if (roll < 0.60) return fill(pick(PH.remind));
    if (roll < 0.78) return fill(pick(PH.weather[season()]));
    return fill(pick(PH.forest.concat(fam().own)));
  }

  /* ---------- интерфейс ---------- */

  var ui = null, chainTimer = null;

  function fam() { return FAMILIARS[state.chosen]; }

  function buildUI() {
    if (document.getElementById('fam')) return;
    var style = document.createElement('style');
    style.textContent = [
      '#fam{position:fixed;right:14px;bottom:64px;z-index:60;width:88px;user-select:none;-webkit-user-select:none;touch-action:manipulation}',
      '#fam img{display:block;width:100%;height:auto;cursor:pointer;filter:drop-shadow(0 6px 8px rgba(0,0,0,.45));transform-origin:50% 90%}',
      '#fam.walk img{animation:fam-bob 2.4s ease-in-out infinite}',
      '#fam.wobble img{animation:fam-wobble .45s ease}',
      '#fam-bubble{position:absolute;right:calc(100% + 10px);bottom:70%;width:200px;',
      '  background:rgba(255,250,235,.94);border:1px solid rgba(168,118,43,.45);border-radius:8px;',
      '  padding:9px 11px;font-size:13px;line-height:1.45;color:var(--ink,#33241a);',
      '  box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;transform:translateY(6px);',
      '  transition:opacity .35s ease,transform .35s ease;pointer-events:none}',
      ':root[data-theme="dark"] #fam-bubble{background:rgba(28,40,32,.96);border-color:rgba(180,205,170,.3)}',
      '#fam-bubble.on{opacity:1;transform:none;pointer-events:auto}',
      '#fam-bubble:after{content:"";position:absolute;right:-6px;bottom:14px;width:10px;height:10px;',
      '  background:inherit;border-top:1px solid rgba(168,118,43,.45);border-right:1px solid rgba(168,118,43,.45);transform:rotate(45deg)}',
      '#fam-name{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);white-space:nowrap;',
      '  font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--ochre,#a8762b);cursor:pointer;padding:2px 4px}',
      '#fam-choice{display:flex;gap:8px;margin-top:8px}',
      '#fam-choice button{font:inherit;font-size:12px;padding:6px 12px;border-radius:999px;cursor:pointer;',
      '  border:1px solid rgba(168,118,43,.5);background:transparent;color:inherit}',
      '#fam-choice button:first-child{background:var(--red,#7b2c1d);color:#fdf3dd;border-color:transparent}',
      '#fam-pick{position:fixed;inset:0;z-index:70;display:none;align-items:center;justify-content:center;',
      '  background:rgba(8,12,9,.66);padding:16px}',
      '#fam-pick.on{display:flex}',
      '#fam-pick .card{width:min(92vw,340px);max-height:90vh;overflow:auto;border-radius:14px;',
      '  background:var(--paper,#fdf3dd);border:1px solid rgba(168,118,43,.5);',
      '  box-shadow:0 18px 48px rgba(0,0,0,.55)}',
      '#fam-pick .pic{display:block;width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:13px 13px 0 0}',
      '#fam-pick .txt{padding:12px 14px 14px;font-size:13.5px;line-height:1.5;color:var(--ink,#33241a)}',
      '#fam-pick .who{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ochre,#a8762b);margin-bottom:6px}',
      '#fam-pick .row{display:flex;gap:8px;margin-top:12px}',
      '#fam-pick button{flex:1;font:inherit;font-size:13px;padding:9px 12px;border-radius:999px;cursor:pointer;',
      '  border:1px solid rgba(168,118,43,.5);background:transparent;color:inherit}',
      '#fam-pick button:first-child{background:var(--red,#7b2c1d);color:#fdf3dd;border-color:transparent}',
      ':root[data-theme="dark"] #fam-pick .card{background:#1c2820;border-color:rgba(180,205,170,.3)}',
      ':root[data-theme="dark"] #fam-pick .txt{color:#e6ddcd}',
      '@keyframes fam-bob{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-7px) rotate(1.5deg)}}',
      '@keyframes fam-wobble{0%{transform:rotate(0)}25%{transform:rotate(-9deg)}75%{transform:rotate(7deg)}100%{transform:rotate(0)}}'
    ].join('\n');
    document.head.appendChild(style);

    ui = document.createElement('div');
    ui.id = 'fam';
    ui.innerHTML = '<div id="fam-bubble"></div><img id="fam-img" alt="фамиляр"><div id="fam-name"></div>';
    document.body.appendChild(ui);
    ui.querySelector('img').addEventListener('click', onTap);
    document.getElementById('fam-name').addEventListener('click', rename);
  }

  function say(html, sticky, withChoice) {
    var b = document.getElementById('fam-bubble');
    b.innerHTML = html;
    b.classList.add('on');
    clearTimeout(b._t);
    b._t = setTimeout(function () { b.classList.remove('on'); }, ((sticky || withChoice) ? 30 : 6) * 1000);
    if (withChoice) {
      b.querySelector('[data-yes]').addEventListener('click', function () { accept(); });
      b.querySelector('[data-no]').addEventListener('click', function () { decline(); });
    }
  }
  function hideBubble() { document.getElementById('fam-bubble').classList.remove('on'); }

  /* ---------- карточка выбора фамиляра ---------- */

  function hidePickCard() {
    var el = document.getElementById('fam-pick');
    if (el) { el.classList.remove('on'); el.innerHTML = ''; }
  }

  // Возвращает true, если карточка показана (тогда бабл с кнопками не нужен).
  function showPickCard(type) {
    var f = FAMILIARS[type];
    if (!f || !f.preview) return false;
    var el = document.getElementById('fam-pick');
    if (!el) { el = document.createElement('div'); el.id = 'fam-pick'; document.body.appendChild(el); }
    el.innerHTML = '<div class="card">' +
        '<img class="pic" alt="' + f.title + ' ' + f.epithet + '" src="' + f.preview + '">' +
        '<div class="txt"><div class="who">' + f.title + ' · ' + f.epithet + '</div>' +
        fill(pick(PH.offer), type) +
        '<div class="row"><button data-yes>Приму</button><button data-no>Иди с миром</button></div>' +
      '</div></div>';
    el.querySelector('[data-yes]').onclick = function () { hidePickCard(); accept(); };
    el.querySelector('[data-no]').onclick = function () { hidePickCard(); decline(); };
    el.classList.add('on');
    return true;
  }

  function setNameLabel() {
    document.getElementById('fam-name').textContent =
      state.chosen ? (state.name + ' · ' + fam().title) : '';
  }

  /* ---------- действия ---------- */

  function onTap() {
    ui.classList.remove('wobble'); void ui.offsetWidth; ui.classList.add('wobble');
    if (!state.chosen) return;
    if (state.mood === 'grumpy') {
      state.pets++;
      var line = PH.offendedPet[Math.min(state.pets - 1, PH.offendedPet.length - 1)];
      say(line, true);
      if (state.pets >= 3) { state.mood = 'ok'; state.pets = 0; say('Всё. Забыли. ' + nextPhrase(), true); }
      save(); return;
    }
    // обычный разговор: тап — следующая фраза
    clearTimeout(chainTimer);
    say(nextPhrase());
    save();
  }

  function rename() {
    if (!state.chosen) return;
    var answer;
    try { answer = window.prompt('Переименовать фамиляра? Он к своему имени привязан…', state.name); }
    catch (e) { return; }
    if (answer === null) return;
    answer = answer.trim().slice(0, 24);
    if (!answer || answer === state.name) return;
    state.name = answer;
    state.mood = 'grumpy';   // недоволен
    state.pets = 0;
    state.awayUntil = drawAway(true);
    say(fill(pick(PH.grumpy)) + ' (' + awayText(state.awayUntil) + ')', true);
    setNameLabel();
    save();
  }

  function offer(sIdx) {
    var type = Object.keys(FAMILIARS).filter(function (k) { return FAMILIARS[k].sabbats.indexOf(sIdx) !== -1; })[0];
    if (!type) return;
    state.offered = { t: type, d: todayKey() };
    document.getElementById('fam-img').src = FAMILIARS[type].sprite;
    setNameLabel();
    show();
    if (showPickCard(type)) return;
    say(fill(pick(PH.offer), type) +
      '<div id="fam-choice"><button data-yes>Приму</button><button data-no>Иди с миром</button></div>',
      false, true);
  }

  function accept() {
    var o = state.offered; if (!o) return;
    state.chosen = o.t;
    state.name = NINE_NAMES[Math.floor(Math.random() * NINE_NAMES.length)];
    state.mood = 'ok';
    state.visits = 1;
    state.offered = null;
    setNameLabel();
    say(fill(pick(PH.accepted), state.chosen) + '<br><br>И это тебе, с праздника: <b>' + giveGift(nextSabbat()[0]) + '</b>.', true);
    state.awayUntil = drawAway(false);
    save();
    hideSoon(30);
  }

  function decline() {
    state.offered = null;
    say('Тогда в другой праздник, в другой глухомани. Или к тебе вернусь — колесо круглое.', true);
    save();
    hideSoon(12);
  }

  function giveGift(sIdx) {
    var year = new Date().getFullYear();
    var fresh = GIFTS.filter(function (g) {
      return !state.items.some(function (it) { return it.g === g && it.y === year; });
    });
    var gift = fresh.length ? pick(fresh) : pick(GIFTS);
    state.items.push({ s: sIdx, y: year, g: gift });
    return gift;
  }

  function visit(sIdx) {
    state.visits++;
    document.getElementById('fam-img').src = fam().sprite;
    setNameLabel();
    show();
    var gift = giveGift(sIdx);
    say('С праздником! ' + S_NAMES[sIdx] + '. Принёс тебе <b>' + gift + '</b> из странствий.', true);
    state.awayUntil = drawAway(false);
    // «имитация общения»: сам продолжает разговор дважды, дальше — по тапу
    var chain = 0;
    clearInterval(chainTimer);
    chainTimer = setInterval(function () {
      if (++chain > 2) { clearInterval(chainTimer); return; }
      say(nextPhrase(), true);
      save();
    }, 9000);
    save();
    hideSoon(40);
  }

  function show() {
    ui.classList.add('walk');
    ui.style.display = '';
  }
  function hideSoon(sec) {
    setTimeout(function () {
      ui.style.display = 'none';
      hideBubble();
      hidePickCard();
      save();
    }, sec * 1000);
  }

  /* ---------- запуск ---------- */

  var state;

  function init() {
    buildUI();
    state = load();
    var ns = nextSabbat();
    if (ns[1] !== 0) { ui.style.display = 'none'; return; }  // фамиляры приходят только на праздники

    var sIdx = ns[0];
    if (!state.chosen) {
      // сегодня уже предлагали этого фамиляра?
      if (state.offered && state.offered.d === todayKey()) {
        document.getElementById('fam-img').src = FAMILIARS[state.offered.t].sprite;
        show();
        if (showPickCard(state.offered.t)) return;
        say('Ну так что? Останусь?' +
          '<div id="fam-choice"><button data-yes>Приму</button><button data-no>Иди с миром</button></div>',
          false, true);
        return;
      }
      offer(sIdx);
      save();
      return;
    }

    if (fam().sabbats.indexOf(sIdx) === -1) { ui.style.display = 'none'; return; } // чужой праздник

    if (Date.now() < state.awayUntil) { ui.style.display = 'none'; return; }       // в странствии
    visit(sIdx);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Для будущей нативной части. */
  window.Familiar = {
    state: function () { return state; },
    phrase: function () { return state.chosen ? nextPhrase() : ''; },
    awayText: awayText
  };
})();
