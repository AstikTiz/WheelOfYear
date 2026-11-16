/* ============================================================
   Фамилияр — зверёк-компаньон Колеса года.
   Состояние, спрайты, появления, вылупление, подарки.

   Как подключить:
   1) Положи familiar.js рядом с index.html (в корень репозитория).
   2) Перед </body> в index.html добавь:  <script src="familiar.js"></script>
   3) В .github/workflows/android-apk.yml добавь familiar.js в строку копирования:
        cp index.html bg.png familiar.js android/app/src/main/assets/www/
   4) Переименуй свои спрайты под SPRITES ниже (или поправь пути в SPRITES).

   Состояние хранится в JSON. Если в мосте Koleso есть loadFamiliar/saveFamiliar
   (их стоит добавить в MainActivity — см. наш разговор), состояние живёт в
   SharedPreferences и доступно нативной части, иначе — в localStorage.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- настройки ---------- */

  // Имена файлов спрайтов. Сезон: winter/spring/summer/autumn.
  var SPRITES = {
    egg:      'images/familiar-egg.png',
    young:    'images/familiar-young-SEASON.png',   // SEASON заменяется кодом
    adult:    'images/familiar-SEASON.png',
    // Кадры вылупления, по порядку. Если кадров нет — оставь пустым [],
    // будет просто покачивание яйца.
    hatch: [],
    hatchVideo: 'images/familiar-hatch.webm',
    giftBag:    'images/gift-bag.png',
    w: 84   // ширина зверька на экране, px
  };

  // Шанс появиться при обычном открытии приложения (0..1).
  // В праздник появление гарантировано, этот шанс для будней.
  var APPEAR_CHANCE = 0.4;
  var SHOW_SECONDS = 14;      // сколько секунд зверёк гуляет
  var ADULT_AFTER_DAYS = 10;  // столько активных дней до взросления

  var S_NAMES = ['Имболк','Остара','Белтайн','Лита','Лугнасад','Мабон','Самхейн','Йоль'];
  var S_MD = [[2,2],[3,20],[5,1],[6,21],[8,1],[9,22],[10,31],[12,21]];

  // Что фамилияр приносит в каждый праздник.
  var GIFTS = ['первую подснежную веточку','каплю первого мёда','ленту цвета пламени',
    'солнечный камешек','колосок с жатвы','виноградину урожая','гребень из воска свечи',
    'веточку омелы'];

  // Фразы по сезонам. {gift} — подставляется принесённая вещь.
  var PHRASES = {
    winter: ['Зима держит землю, но не нас, да?', 'Погладь — лапы замёрзли.', 'Сегодня хорошо помолчать у огня. Вместе.',
      'Я принюхался: весна где-то уже заварилась.', 'Не гоняйся за мной по снегу, догоню сам.'],
    spring: ['Трава пробивается — значит, и твои планы пробьются.', 'Понюхай ветер. Пахнет началом.', 'Я выкопал тебе место под новое намерение.',
      'Клевер сегодня особенно честный.', 'Беги со мной до той яблони. Ну или просто допиши заметку.'],
    summer: ['День длинный — успеется всё.', 'Я весь день лежал на тёплом камне. Советую.', 'Солнце не спрашивает разрешения. И ты не спрашивай.',
      'Трава по колено — пора делать шаг.', 'Сегодня лень — это тоже ритуал.'],
    autumn: ['Лист падает не потому что слабый, а потому что пора.', 'Я спрятал жёлудь. Найдёшь — загадаешь желание.',
      'Ветер перебирает страницы гримуара сам.', 'Урожай снимают медленно. И день заканчивай медленно.', 'Собери сегодня что-то одно. Одно — уже урожай.'],
    lonely: ['Ты меня совсем бросила. Ладно, я всё равно скучал.', 'Сколько дней! Я тут один грел яйцо… то есть камни.',
      'Вернись почаще — я от этого расту, правда.'],
    gift: ['Держи, принёс: {gift}. С праздником!', 'Это тебе. {gift} — я сам нашёл.', 'Праздник же! Лови: {gift}.']
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
    return { v: 1, stage: 'egg', born: todayKey(), opens: 0, activeDays: 0,
             taps: 0, lastVisit: '', items: [], lastPhrase: -1 };
  }
  function load() {
    var raw = storeRead();
    if (raw) { try { var s = JSON.parse(raw); if (s && s.v === 1) return s; } catch (e) {} }
    return freshState();
  }
  function save() { storeWrite(JSON.stringify(state)); }

  /* ---------- даты, сезон, саббат, луна ---------- */

  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // Детерминированный генератор на день: один и тот же «случай» внутри суток.
  function rng(seedStr) {
    var h = 2166136261;
    for (var i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  function season() {
    var m = new Date().getMonth() + 1;
    if (typeof hemisphere === 'function' && hemisphere() === 'south') m = ((m + 5) % 12) + 1;
    if (m === 12 || m <= 2) return 'winter';
    if (m <= 5)  return 'spring';
    if (m <= 8)  return 'summer';
    return 'autumn';
  }

  // Та же арифметика, что и в KolesoDays.java: дни до ближайшего саббата.
  function dayOfYearSafe(y, m, d) {
    if (typeof dayOfYear === 'function') return dayOfYear(y, m, d);
    return Math.floor((new Date(y, m - 1, d) - new Date(y, 0, 0)) / 864e5);
  }
  function nextSabbat() {
    var now = new Date(), y = now.getFullYear();
    var south = typeof hemisphere === 'function' && hemisphere() === 'south';
    var doy = dayOfYearSafe(y, now.getMonth() + 1, now.getDate());
    var yl = dayOfYearSafe(y, 12, 31);
    var half = Math.floor(yl / 2);
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
    if (best < 0) {
      var cn = cand(y + 1);
      for (i = 0; i < 8; i++) if (cn[i] < bd) { bd = cn[i]; best = i; }
      bd = yl - doy + bd;
    }
    return [best, bd]; // [индекс саббата, дней до него; 0 = сегодня]
  }

  function moonPhase() {
    var SYN = 29.530588853, EPOCH = 946727640000;
    var days = (new Date().getTime() - EPOCH) / 864e5;
    var age = ((days % SYN) + SYN) % SYN;
    return age / SYN; // 0..1
  }

  /* ---------- интерфейс ---------- */

  var ui = null, hideTimer = null;

  function spriteUrl() {
    if (state.stage === 'egg') return SPRITES.egg;
    var tpl = state.stage === 'young' ? SPRITES.young : SPRITES.adult;
    return tpl.replace(/SEASON/g, season());
  }

  function buildUI() {
    if (document.getElementById('fam')) return;
    var style = document.createElement('style');
    style.textContent = [
      '#fam{position:fixed;right:14px;bottom:64px;z-index:60;width:' + SPRITES.w + 'px;',
      '  user-select:none;-webkit-user-select:none;touch-action:manipulation}',
      '#fam img{display:block;width:100%;height:auto;cursor:pointer;',
      '#fam video{display:block;width:100%;height:auto;pointer-events:none;',
      '  filter:drop-shadow(0 6px 8px rgba(0,0,0,.45))}',
      '  filter:drop-shadow(0 6px 8px rgba(0,0,0,.45));transform-origin:50% 90%}',
      '#fam.walk img{animation:fam-bob 2.2s ease-in-out infinite}',
      '#fam.wobble img{animation:fam-wobble .45s ease}',
      '#fam.hatch img{animation:fam-hatch .9s ease-in-out infinite}',
      '#fam-bubble{position:absolute;right:calc(100% + 10px);bottom:70%;width:190px;',
      '  background:rgba(255,250,235,.94);border:1px solid rgba(168,118,43,.45);border-radius:8px;',
      '  padding:9px 11px;font-size:13px;line-height:1.45;color:var(--ink,#33241a);',
      '  box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;transform:translateY(6px);',
      '  transition:opacity .35s ease,transform .35s ease;pointer-events:none}',
      ':root[data-theme="dark"] #fam-bubble{background:rgba(28,40,32,.96);border-color:rgba(180,205,170,.3)}',
      '#fam-bubble.on{opacity:1;transform:none}',
      '#fam-bubble:after{content:"";position:absolute;right:-6px;bottom:14px;width:10px;height:10px;',
      '  background:inherit;border-top:1px solid rgba(168,118,43,.45);border-right:1px solid rgba(168,118,43,.45);',
      '  transform:rotate(45deg)}',
      '#fam-in{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);',
      '  font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(80,55,25,.0);',
      '  transition:color .3s;white-space:nowrap}',
      '#fam:hover #fam-in{color:var(--ochre,#a8762b)}',
      '@keyframes fam-bob{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-7px) rotate(1.5deg)}}',
      '@keyframes fam-wobble{0%{transform:rotate(0)}25%{transform:rotate(-9deg)}75%{transform:rotate(7deg)}100%{transform:rotate(0)}}',
      '@keyframes fam-hatch{0%,100%{transform:rotate(-4deg) scale(1)}50%{transform:rotate(4deg) scale(1.04)}}'
    ].join('\n');
    document.head.appendChild(style);

    ui = document.createElement('div');
    ui.id = 'fam';
    ui.innerHTML = '<div id="fam-bubble"></div><img id="fam-img" alt="фамилияр"><div id="fam-in"></div>';
    document.body.appendChild(ui);
    ui.querySelector('img').addEventListener('click', onTap);
  }

  function show() {
    ui.classList.add('walk');
    ui.style.display = '';
  }
  function hideSoon(sec) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      ui.style.display = 'none';
      save();
    }, (sec || SHOW_SECONDS) * 1000);
  }

  function say(text, sticky) {
    var b = document.getElementById('fam-bubble');
    b.textContent = text;
    b.classList.add('on');
    clearTimeout(b._t);
    b._t = setTimeout(function () { b.classList.remove('on'); }, (sticky ? 8 : 6) * 1000);
  }

  /* ---------- фразы ---------- */

  function pickPhrase(giftText) {
    var pool;
    if (giftText) pool = PHRASES.gift;
    else if (state.lastVisit && daysBetween(state.lastVisit, todayKey()) >= 3) pool = PHRASES.lonely;
    else pool = PHRASES[season()];

    var r = rng(todayKey() + '|' + state.opens);
    var i = Math.floor(r() * pool.length);
    if (pool.length > 1 && i === state.lastPhrase) i = (i + 1) % pool.length;
    state.lastPhrase = i;
    return pool[i].replace('{gift}', giftText || '');
  }

  function daysBetween(a, b) {
    return Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  }

  /* ---------- подарки ---------- */

  function maybeGift(sabbatIdx) {
    if (sabbatIdx < 0) return null;
    var year = new Date().getFullYear();
    var already = state.items.some(function (g) { return g.s === sabbatIdx && g.y === year; });
    if (already) return null;
    var gift = { s: sabbatIdx, y: year, name: GIFTS[sabbatIdx] };
    state.items.push(gift);
    return gift.name;
  }

  /* ---------- яйцо и вылупление ---------- */

  function onTap() {
    if (state.stage === 'egg') {
      state.taps++;
      ui.classList.remove('wobble'); void ui.offsetWidth; ui.classList.add('wobble');
      var hints = ['…', 'стук', 'еще чуть-чуть', 'скоро, скоро'];
      say(hints[Math.min(state.taps - 1, hints.length - 1)], true);
      // Вылупление — в ближайший праздник: зверёк рождается к порогу.
      if (nextSabbat()[1] === 0) hatch();
      save();
      return;
    }
    // Взрослый: погладить — случайная фраза сезона.
    say(pickPhrase(null));
    save();
  }

  function hatch() {
    var host = document.getElementById('fam');
    var img = document.getElementById('fam-img');
    ui.classList.add('hatch');

    function done() {
      ui.classList.remove('hatch');
      var v = document.getElementById('fam-vid');
      if (v && v.parentNode) v.parentNode.removeChild(v);
      if (img) { img.style.display = ''; }
      state.stage = 'young';
      state.born = todayKey();
      if (img) img.src = spriteUrl();
      say('Привет! Я теперь живу тут. Заглядывай почаще — я от этого расту.', true);
      save();
    }

    if (SPRITES.hatchVideo && host) {
      var v = document.createElement('video');
      v.id = 'fam-vid';
      v.src = SPRITES.hatchVideo;
      v.muted = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      if (img) img.style.display = 'none';
      host.appendChild(v);
      var finished = false;
      function once() { if (finished) return; finished = true; done(); }
      v.addEventListener('ended', once);
      v.addEventListener('error', once);
      setTimeout(once, 7000);
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
      return;
    }

    var frames = SPRITES.hatch;
    if (frames && frames.length) {
      var i = 0;
      var iv = setInterval(function () {
        if (i < frames.length) { img.src = frames[i++]; }
        else { clearInterval(iv); done(); }
      }, 420);
    } else { done(); }
  }


  /* ---------- запуск ---------- */

  var state;

  function init() {
    buildUI();
    state = load();
    var today = todayKey();

    // счётчики использования: открытия и активные дни
    state.opens++;
    if (state.lastVisit !== today) { state.activeDays++; state.lastVisit = today; }
    if (state.stage === 'young' && state.activeDays >= ADULT_AFTER_DAYS) state.stage = 'adult';

    var ns = nextSabbat();          // [индекс, дней до]
    var isSabbat = ns[1] === 0;

    // Яйцо, дождавшееся праздника, вылупляется само — даже без тапа.
    if (state.stage === 'egg' && isSabbat) hatch();

    // Решаем, выходить ли на экран
    var chance = rng(today + '|fam').call ? rng(today + '|fam')() : 0;
    var appears = isSabbat || chance < APPEAR_CHANCE;

    document.getElementById('fam-img').src = spriteUrl();
    document.getElementById('fam-in').textContent =
      state.stage === 'egg' ? 'яйцо' :
      state.items.length ? 'принёс ' + state.items.length : '';

    if (appears) {
      show();
      var gift = isSabbat ? maybeGift(ns[0]) : null;
      say(pickPhrase(gift), !!gift);
      if (isSabbat) say('Сегодня ' + S_NAMES[ns[0]] + '!', true);
      hideSoon(isSabbat ? 25 : SHOW_SECONDS);
    } else {
      ui.style.display = 'none';
    }
    save();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Для будущей нативной части: уведомление может спросить фразу дня. */
  window.Familiar = {
    state: function () { return state; },
    phrase: function () { return pickPhrase(null); }
  };
})();
