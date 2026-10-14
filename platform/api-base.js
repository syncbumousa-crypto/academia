/* ============================================================
   جسرُ الخادم — من المسار النسبيّ إلى Supabase
   ============================================================
   الصفحاتُ صارت على GitHub Pages والخادمُ على Supabase، فلم يعودا على أصلٍ
   واحد. وأمران ينكسران بذلك، ويُصلحان ههنا معًا — **بلا مساسٍ بـapp.js**:

   ١ · العنوان: المحرّكُ ينادي ‎/api/…‎ نسبيًّا (ثلاثةُ مواضع في app.js،
       وأربعةٌ في لوحة الأدمن). فيُلتقط النداءُ ويُحوَّل إلى الدالّة.

   ٢ · الجلسة: كانت كوكيًّا ‎HttpOnly; SameSite=Lax‎ يرسله المتصفّحُ وحدَه
       لأنّ الأصلَ واحد. وكوكيُّ الطرف الثالث يُحجب اليوم، فتنتقل الجلسةُ
       إلى رمزٍ يُحفظ في المتصفّح ويُرسَل في ترويسة ‎Authorization‎.
       والخادمُ يقبل الاثنين (كوكيًّا إن وُجد، وإلّا الرمز)، فلا ينكسر شيء.

   ===== والجرّتان تبقيان جرّتين =====
   للموقع هويّتان: الزائرُ (‎sid‎) ولوحةُ الأدمن (‎asid‎)، وتُميَّزان بترويسة
   ‎x-as‎. فيُحفظ رمزان لا رمزٌ واحد، ويُختار بالترويسة نفسِها — وإلّا سجّل
   فتحُ اللوحةِ الزائرَ باسم الموقع، وهي العلّةُ التي يحذّر منها ‎SYNC.md‎.

   ويُحمَّل هذا الملفُّ **قبل** ‎app.js‎ ليكون ‎fetch‎ مُستبدَلًا قبل أوّل نداء. */

(function () {
  'use strict';

  var API  = 'https://cyuufavrbqyqywhftbjw.supabase.co/functions/v1/api';
  var JAR  = { site: 'academia2:tok:site', user: 'academia2:tok:user', lock: 'academia2:tok:lock' };
  /* ثلاثُ صيغٍ تصل إلى الخادم، وكلُّها تُلتقط:
       ‎/api/x‎                        — جذرُ النطاق (ستّةُ مواضع في المحرّك)
       ‎<الموقع>/academia/api/x‎        — نسبيًّا إلى قاعدة الأصول (أربعةُ مواضع)
       ‎<الدالّة>/api/x‎                — مطلقًا، بعد أن صار المحرّك يبنيه بنفسه */
  function apiTail(raw) {
    var u;
    try { u = new URL(raw, location.href); } catch (e) { return null; }
    if (u.href.indexOf(API) === 0) return u.href.slice(API.length);
    if (u.origin !== location.origin) return null;
    var i = u.pathname.indexOf('/api/');
    if (i >= 0) return u.pathname.slice(i + 4) + u.search;
    if (/\/api$/.test(u.pathname)) return u.search;
    return null;
  }

  function get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }

  var native = window.fetch.bind(window);

  window.fetch = function (input, init) {
    var url = (typeof input === 'string') ? input : (input && input.url) || '';
    var tail = apiTail(url);
    if (tail === null) return native(input, init);

    var o = {};
    for (var k in (init || {})) o[k] = init[k];
    var h = new Headers((init && init.headers) || {});

    /* الكوكي لا يعبر الأصول، فلا يُطلب إرسالُه — ومع ‎*‎ في CORS يُرفض الطلبُ لو طُلب */
    o.credentials = 'omit';

    var tok = get(h.get('x-as') === 'site' ? JAR.site : JAR.user);
    if (tok) h.set('authorization', 'Bearer ' + tok);

    /* وقفلُ اللوحة رمزٌ ثالثٌ مستقلّ: لا هو جلسةُ زائرٍ ولا جلسةُ موقع،
       بل إذنُ دخولٍ إلى اللوحة نفسِها. وكان كوكيًّا ‎alock‎. */
    var lk = get(JAR.lock);
    if (lk) h.set('x-alock', lk);
    o.headers = h;

    var p = native(API + tail, o);

    if (/\/api\/lock\/(open|set)(\?|$)/.test(url)) {
      p = p.then(function (r) {
        try {
          r.clone().json().then(function (j) { if (j && j.tok) put(JAR.lock, j.tok); }).catch(function () {});
        } catch (e) {}
        return r;
      });
    }
    if (/\/api\/lock\/close(\?|$)/.test(url)) {
      p = p.then(function (r) { del(JAR.lock); return r; });
    }

    /* والرمزُ يُلتقط من ردّ الدخول مرّةً، ثمّ يُرسَل في كلّ نداءٍ بعده */
    if (/\/api\/auth\/(login|join|site)(\?|$|\/)/.test(url)) {
      var toSite = /\/api\/auth\/site/.test(url);
      p = p.then(function (r) {
        try {
          r.clone().json().then(function (j) {
            if (j && j.tok) put(toSite ? JAR.site : JAR.user, j.tok);
          }).catch(function () {});
        } catch (e) {}
        return r;
      });
    }
    if (/\/api\/auth\/logout/.test(url)) {
      p = p.then(function (r) { del(JAR.user); del(JAR.site); return r; });
    }
    return p;
  };

  /* و‎app.js‎ يقرأ هذين فيبني عناوينه بنفسه — فلا عنوانَ مكتوبٌ داخل المدموج */
  window.AC_API_ORIGIN = API.slice(0, -4);        /* بلا ‎/api‎ في آخره */
  window.AC_API_BASE   = window.AC_API_ORIGIN + '/';
  window.ACADEMIA_API = API;   /* ليُقرأ عند الحاجة، ولا يُخمَّن */
})();
