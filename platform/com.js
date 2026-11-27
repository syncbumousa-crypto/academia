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
  function map(k) {
    k = String(k);
    return (k.indexOf(P) === 0 && k.indexOf(SHARED) !== 0 && k.indexOf(MINE) !== 0) ? MINE + k.slice(P.length) : k;
  }
  function unmap(k) {
    if (k == null) return k;
    if (k.indexOf(MINE) === 0) return P + k.slice(MINE.length);
    if (k.indexOf(P) === 0 && k.indexOf(SHARED) !== 0) return null;   /* مفتاحُ موقعٍ آخر */
    return k;
  }

  var S = Storage.prototype, g = S.getItem, s = S.setItem, r = S.removeItem;
  S.getItem = function (k) { return g.call(this, map(k)); };
  S.setItem = function (k, v) { return s.call(this, map(k), v); };
  S.removeItem = function (k) { return r.call(this, map(k)); };

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
