/* ============================================================
   المجتمع — درجٌ مستقلٌّ لكلّ موقع (ROADMAP-MUDARRAJ م٢)
   ============================================================
   المحرّكُ واحدٌ للمسلخ والمدرج، ويكتب في درج المتصفّح بمفاتيحَ تبدأ بـ
   ‎academia2:‎ (أربعةٌ وخمسون موضعًا). والموقعان على أصلٍ واحد، فلولا هذا
   الملفُّ لقرأ المدرجُ ركنَ المسلخ وأتراحَه وكتالوجَه.

   فيُحمَّل في صفحة المدرج وحدها، **قبل** ‎api-base.js‎ و‎app.js‎، ويُبدِّل المفاتيحَ
   في الطريق: ‎academia2:x‎ ⇐ ‎academia2:mudarraj:x‎. فلا يُمسّ في المحرّك سطر،
   والمسلخُ لا يُحمّل هذا الملفَّ أصلًا فلا يتغيّر عليه شيء.

   ويُستثنى رمزُ الدخول (‎academia2:tok:‎): الحسابُ واحدٌ للموقعين — من دخل
   أحدَهما دخل الآخر.

   وحدثُ ‎storage‎ (تبويبٌ آخر كتب) يُترجَم كذلك: ما كتبه تبويبُ المسلخ لا يبلغ
   المدرج — وإلّا ظنّ المدرجُ أنّ نسختَه قديمةٌ كلّما فُتح المسلخ. */
(function () {
  'use strict';
  var COM = document.documentElement.getAttribute('data-com') || '';
  if (!/^[a-z]+$/.test(COM) || COM === 'maslakh') return;
  window.AC_COM = COM;

  var P = 'academia2:', MINE = P + COM + ':', SHARED = P + 'tok:';
  /* وثلاثةُ مخابئَ خارجَ ‎academia2:‎ مفاتيحُها رموزُ المواد — والرموزُ تتشابه بين الجامعتين
     (‎MATH 101‎): قائمةُ الأغلفة · أعدادُ المساهمات · آخرُ رسمٍ لمساهمتي. فتُفصل كذلك.
     وما سواها في ‎ac.‎ تفضيلاتُ عرضٍ (الجلد · ألوانُ التظليل) تبقى مشتركة. */
  var AC_DATA = { 'ac.covers1': 1, 'ac.faces1': 1, 'ac.mine1': 1 }, ACP = 'ac.' + COM + '.';
  function map(k) {
    k = String(k);
    if (AC_DATA[k]) return ACP + k.slice(3);
    return (k.indexOf(P) === 0 && k.indexOf(SHARED) !== 0 && k.indexOf(MINE) !== 0) ? MINE + k.slice(P.length) : k;
  }
  function unmap(k) {
    if (k == null) return k;
    if (k.indexOf(ACP) === 0) return 'ac.' + k.slice(ACP.length);
    if (AC_DATA[k]) return null;                                      /* مخبأُ موقعٍ آخر */
    if (k.indexOf(MINE) === 0) return P + k.slice(MINE.length);
    if (k.indexOf(P) === 0 && k.indexOf(SHARED) !== 0) return null;   /* مفتاحُ موقعٍ آخر */
    return k;
  }

  var S = Storage.prototype, g = S.getItem, s = S.setItem, r = S.removeItem;

  /* ===== الجيلُ الثاني: درجُ المدرج يُفرَّغ مرّةً =====
     أوّلُ نسخةٍ نُشرت كان ‎api-base.js‎ فيها بلا رقمِ نسخة، فمن خبّأ متصفّحُه نسخةً
     أقدمَ ذهبت نداءاتُه بلا ‎?com=‎ فجاءه ركنُ المسلخ وكُتب في درج المدرج. فيُمحى درجُ
     المدرج كلُّه مرّةً (لا يُمسّ درجُ المسلخ)، ويُعاد بناؤه من خادم المدرج. */
  var GEN = '2', GK = MINE + 'gen';
  try {
    if (g.call(localStorage, GK) !== GEN) {
      [localStorage, sessionStorage].forEach(function (st) {
        var ks = [];
        for (var i = 0; i < st.length; i++) { var k = st.key(i); if (k && (k.indexOf(MINE) === 0 || k.indexOf(ACP) === 0)) ks.push(k); }
        ks.forEach(function (k) { r.call(st, k); });
      });
      s.call(localStorage, GK, GEN);
    }
  } catch (e) {}
  S.getItem = function (k) { return g.call(this, map(k)); };
  S.setItem = function (k, v) { return s.call(this, map(k), v); };
  S.removeItem = function (k) { return r.call(this, map(k)); };

  /* ===== وكلُّ نداءٍ للخادم يحمل المجتمعَ، وما لم يأتِ من جداول المدرج يُردّ =====
     ‏‎api-base.js‎ يضيف ‎?com=‎ — وهذا حارسٌ ثانٍ لا يتّكل عليه: يُلفّ ‎fetch‎ الأصليّ قبل أن
     يلفّه ‎api-base‎، فيمرّ به كلُّ نداءٍ في آخر طريقه. فإن غاب ‎?com=‎ أُضيف، وإن لم يقل
     الخادمُ في ردّه ‎x-com: mudarraj‎ عُدّ الردُّ ‎503‎ (كانقطاع الشبكة) — فلا يدخل الدرجَ
     شيءٌ من جداول المسلخ ولو خبّأ المتصفّحُ ملفًّا قديمًا. */
  var API_HOST = 'supabase.co/functions/v1/api';
  var nf = window.fetch && window.fetch.bind(window);
  if (nf) window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf(API_HOST) < 0) return nf(input, init);
    if (!/[?&]com=/.test(url)) {
      url += (url.indexOf('?') >= 0 ? '&' : '?') + 'com=' + COM;
      input = typeof input === 'string' ? url : new Request(url, input);
    }
    return nf(input, init).then(function (res) {
      if (res.headers.get('x-com') === COM) return res;
      return new Response('{"error":"com"}', { status: 503, headers: { 'content-type': 'application/json' } });
    });
  };

  var add = window.addEventListener;
  window.addEventListener = function (type, fn, opt) {
    if (type !== 'storage' || typeof fn !== 'function') return add.call(this, type, fn, opt);
    var wrap = function (e) {
      var k = unmap(e.key);
      if (e.key !== null && k === null) return;                 /* ليس لنا */
      if (k === e.key) return fn.call(this, e);
      fn.call(this, { key: k, newValue: e.newValue, oldValue: e.oldValue,
                      storageArea: e.storageArea, url: e.url, type: 'storage' });
    };
    fn.__comWrap = wrap;
    return add.call(this, type, wrap, opt);
  };
  var rem = window.removeEventListener;
  window.removeEventListener = function (type, fn, opt) {
    return rem.call(this, type, (type === 'storage' && fn && fn.__comWrap) || fn, opt);
  };
})();
