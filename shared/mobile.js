/* ============================================================
   الجوال — شريطُ التبويب السفليّ وصفحةُ الإعدادات
   ============================================================
   لا يعمل إلّا على الشاشة الضيّقة (‎max-width: 600px‎)، ويُطفأ وحده إن اتّسعت.
   وأنماطُه في ‎shared/mobile.css‎ — وهي لا تُحمَّل على سطح المكتب.

   **ولا يُعيد بناءَ شيءٍ من المحرّك:** كلُّ زرٍّ هنا ينقر نظيرَه في الشريط
   الجانبيّ المخفيّ (التبويبات · المظهر · اللغة)، فيجري ما كان يجري هناك
   بعينه، ويقرأ حالَه من هناك. فلا يُمسّ ‎app.js‎ ولا يُعاد دمجُه.

   والترتيبُ من اليمين: المكتبة · الركن · الاختبارات · الإعدادات.
   («إحصائياتي» غائبةٌ عن الشريط عمدًا.)

   ===== ولا يراه إلّا مَن طلبه =====
   الواجهةُ قيدُ التجربة، فهي **مطفأةٌ للزوّار** ولو فتحوا من جوال. وتُشعَل
   في متصفّحٍ واحدٍ بـ ‎?mobile=1‎ مرّةً (تُحفظ في ‎localStorage‎)، وتُطفأ بـ
   ‎?mobile=0‎. ومعاينةُ الأجهزة (‎_device.html‎) تُشعلها لمن يفتحها.
   فيُجرَّب على الموقع الحيّ — بالدخول والبيانات والمساهمات — ولا يتغيّر
   على أحدٍ شيء.
   ============================================================ */

(function () {
  'use strict';

  var MQ   = window.matchMedia('(max-width: 600px)');
  var FLAG = 'academia:mobile-ui';

  function flagOn() {
    try {
      var q = new URLSearchParams(location.search).get('mobile');
      if (q === '1') localStorage.setItem(FLAG, '1');
      if (q === '0') localStorage.removeItem(FLAG);
      return localStorage.getItem(FLAG) === '1';
    } catch (e) { return false; }
  }
  var TABS = ['market', 'library', 'past'];
  var root = document.documentElement;

  var TX = {
    ar: { settings: 'الإعدادات', look: 'المظهر', theme: 'الإضاءة', light: 'فاتح', dark: 'داكن',
          langGroup: 'اللغة', lang: 'لغة الموقع' },
    en: { settings: 'Settings', look: 'Appearance', theme: 'Lighting', light: 'Light', dark: 'Dark',
          langGroup: 'Language', lang: 'Site language' },
  };

  // احتياطٌ إن لم يُترجم المحرّكُ اسمَ التبويب (‎«الاختبارات»‎ يبقى عربيًّا في الإنجليزيّة)
  var TAB_EN = { market: 'Library', library: 'Nook', past: 'Exams' };

  var ICON = {
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
  };

  var bar = null, page = null, onSettings = false, watchers = [];
  var lens = null, lensLbl = null, lensObs = null;

  function lang() { return root.getAttribute('data-lang') === 'en' ? 'en' : 'ar'; }
  function src(tab) { return document.querySelector('.sidebar .tabs [data-tab="' + tab + '"]'); }

  /* ---------- البناء ---------- */
  function build() {
    bar = document.createElement('nav');
    bar.className = 'm-tabbar';
    bar.setAttribute('aria-label', 'التنقّل');

    TABS.forEach(function (tab) {
      var s = src(tab);
      if (!s) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'm-tab';
      b.dataset.tab = tab;
      var ic = s.querySelector('svg');
      if (ic) b.appendChild(ic.cloneNode(true));
      b.appendChild(document.createElement('span'));
      b.addEventListener('click', function () {
        showSettings(false);
        s.click();
        window.scrollTo(0, 0);
      });
      bar.appendChild(b);
    });

    var g = document.createElement('button');
    g.type = 'button';
    g.className = 'm-tab';
    g.dataset.tab = 'settings';
    g.innerHTML = ICON.gear + '<span></span>';
    g.addEventListener('click', function () { showSettings(true); });
    bar.appendChild(g);

    page = document.createElement('section');
    page.className = 'm-settings';
    page.hidden = true;
    page.innerHTML =
      '<h1 data-t="settings"></h1>' +
      '<div class="m-group-title" data-t="look"></div>' +
      '<div class="m-group"><div class="m-row">' +
        '<span class="m-row-lbl"><span class="m-row-ic" style="background:#ff9f0a">' + ICON.sun + '</span><span data-t="theme"></span></span>' +
        '<span class="m-seg" data-seg="theme"><button type="button" data-v="light" data-t="light"></button><button type="button" data-v="dark" data-t="dark"></button></span>' +
      '</div></div>' +
      '<div class="m-group-title" data-t="langGroup"></div>' +
      '<div class="m-group"><div class="m-row">' +
        '<span class="m-row-lbl"><span class="m-row-ic" style="background:#0a84ff">' + ICON.globe + '</span><span data-t="lang"></span></span>' +
        '<span class="m-seg" data-seg="lang"><button type="button" data-v="ar">عربي</button><button type="button" data-v="en">English</button></span>' +
      '</div></div>';

    // الأزرارُ تنقر نظائرَها في الشريط الجانبيّ: ‎#themebar‎ و‎#langbar‎
    page.querySelectorAll('[data-seg="theme"] button').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = document.querySelector('#themebar [data-theme="' + b.dataset.v + '"]');
        if (t) t.click();
      });
    });
    page.querySelectorAll('[data-seg="lang"] button').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = document.querySelector('#langbar [data-lang="' + b.dataset.v + '"]');
        if (t) t.click();
      });
    });

    document.body.appendChild(page);
    document.body.appendChild(bar);
  }

  function showSettings(on) {
    onSettings = on;
    if (page) page.hidden = !on;
    if (on) page.scrollTop = 0;
    sync();
  }

  /* ---------- المزامنة: كلُّ حالٍ يُقرأ من مصدره ---------- */
  function sync() {
    if (!bar) return;
    var t = TX[lang()];
    bar.querySelectorAll('.m-tab').forEach(function (b) {
      var tab = b.dataset.tab, label = b.querySelector('span');
      if (tab === 'settings') {
        label.textContent = t.settings;
        b.classList.toggle('is-on', onSettings);
      } else {
        var s = src(tab);
        var tx = s && s.querySelector('.tab-tx');
        var name = tx ? tx.textContent : '';
        if (lang() === 'en' && /[\u0600-\u06FF]/.test(name)) name = TAB_EN[tab];
        label.textContent = name;
        b.classList.toggle('is-on', !onSettings && !!s && s.classList.contains('is-active'));
      }
    });
    page.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t[el.dataset.t]; });
    var theme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    page.querySelectorAll('[data-seg="theme"] button').forEach(function (b) { b.classList.toggle('is-on', b.dataset.v === theme); });
    page.querySelectorAll('[data-seg="lang"] button').forEach(function (b) { b.classList.toggle('is-on', b.dataset.v === lang()); });
  }

  function watch() {
    var mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-lang'] });
    var tabs = document.querySelectorAll('.sidebar .tabs button');
    var mo2 = new MutationObserver(sync);
    tabs.forEach(function (b) { mo2.observe(b, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true }); });
    watchers = [mo, mo2];
  }

  /* ---------- عدسةُ تبويبات المادّة ----------
     العدسةُ والسطرُ أخوان لـ‎#cm-tabs‎ في ‎.cm-panel‎ — لا أبناؤه، فالمحرّكُ
     يكتب جوفَه من جديد عند كلّ تبديل. ويُعاد وضعُهما كلّما تغيّر الجوف أو نُقلت
     النافذة (‎#cm-ui‎ تُنقل بين السوق والمكتبة). */
  var TX_LENS = { ar: { add: 'ساهِم', none: 'لا مساهمات بعد', one: 'مساهمة واحدة', many: ' مساهمات' },
                  en: { add: 'Add', none: 'No contributions yet', one: '1 contribution', many: ' contributions' } };

  function placeLens() {
    var tabs = document.getElementById('cm-tabs');
    if (!tabs) return;
    var panel = tabs.parentElement;
    if (!lens) {
      lens = document.createElement('div'); lens.className = 'm-lens';
      lensLbl = document.createElement('div'); lensLbl.className = 'm-lens-label';
      lensLbl.addEventListener('click', function (e) {
        if (!e.target.closest('.m-add')) return;
        var me = document.querySelector('#cm-tabs button.on .cm-face--me');
        if (me) me.click();   // يمرّ إلى مستمع المحرّك على ‎.cm-panel‎ كما لو ضُغطت «+»
      });
    }
    if (lens.parentElement !== panel) panel.insertBefore(lens, tabs);
    if (lensLbl.previousElementSibling !== tabs) tabs.after(lensLbl);

    var on = tabs.querySelector('button.on');
    if (!on || !tabs.offsetWidth) { lens.style.opacity = 0; if (lensLbl.innerHTML) lensLbl.innerHTML = ''; return; }
    var pr = panel.getBoundingClientRect(), br = on.getBoundingClientRect();
    var x = br.left - pr.left + br.width / 2 - 30, y = br.top - pr.top + br.height / 2 - 30;
    lens.style.opacity = 1;
    lens.style.transform = 'translate(' + x + 'px,' + y + 'px)';

    var t = TX_LENS[lang()];
    var nm = on.querySelector('.cm-tabnm');
    var cnt = on.querySelector('.cm-face--count');
    var n = cnt ? parseInt(cnt.textContent.replace(/\D/g, ''), 10) || 0 : 0;
    var count = n === 0 ? t.none : n === 1 ? t.one : n + t.many;
    var canAdd = !!on.querySelector('.cm-face--me');
    var html = '<span>' + (nm ? nm.textContent : '') + '</span><span class="m-cnt">· ' + count + '</span>' +
      (canAdd ? '<button type="button" class="m-add">+ ' + t.add + '</button>' : '');
    if (lensLbl.innerHTML !== html) lensLbl.innerHTML = html;
  }

  function startLens() {
    if (lensObs) return;
    var raf = 0;
    var kick = function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(placeLens); };
    lensObs = new MutationObserver(function (recs) {
      // ما تكتبه العدسةُ في نفسها لا يُعيد تشغيلها
      for (var i = 0; i < recs.length; i++) {
        var t = recs[i].target;
        if (lens && (t === lens || (lensLbl && lensLbl.contains(t)))) continue;
        kick(); return;
      }
    });
    lensObs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    window.addEventListener('resize', kick);
    kick();
  }
  function stopLens() {
    if (lensObs) { lensObs.disconnect(); lensObs = null; }
    if (lens) { lens.remove(); lensLbl.remove(); lens = lensLbl = null; }
  }

  /* ---------- التشغيل والإطفاء مع عرض الشاشة ---------- */
  function apply() {
    if (MQ.matches && flagOn()) {
      if (!bar) { build(); watch(); }
      root.classList.add('m-app');
      sync();
      startLens();
    } else if (bar) {
      root.classList.remove('m-app');
      stopLens();
      watchers.forEach(function (w) { w.disconnect(); });
      watchers = [];
      bar.remove(); page.remove();
      bar = page = null;
      onSettings = false;
    }
  }

  // المعاينةُ تُبدّل المفتاحَ وهي على الأصل نفسه: يُلتقط هنا بلا إعادة تحميل
  window.addEventListener('storage', function (e) { if (e.key === FLAG) apply(); });
  if (MQ.addEventListener) MQ.addEventListener('change', apply);
  else MQ.addListener(apply);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
