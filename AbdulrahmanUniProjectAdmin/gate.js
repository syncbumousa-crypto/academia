/* ============================================================
   بوّابةُ اللوحة — كلمةُ السرّ قبل أن تُرسم صفحةٌ واحدة
   ============================================================
   على فيرسل كان ‎middleware.js‎ يقف قبل الملفّ الساكن فيقدّم نموذجَ القفل
   بدلًا من اللوحة. وGitHub Pages ليس فيه وسيط: الملفُّ يُقدَّم كما هو.
   فالبوّابةُ تنتقل إلى الصفحة نفسِها.

   ===== وما الذي تحرسه فعلًا؟ =====
   لا تحرس **نصَّ** الصفحة: المستودعُ عامّ، ومن أراد قراءةَ الوسم قرأه من
   هناك. تحرس **الدخول**: لا تُرسم اللوحةُ ولا يُنادى الخادمُ حتّى تُتحقَّق
   كلمةُ السرّ عند الخادم (PBKDF2 على القاعدة، لا موازنةً في المتصفّح).
   والحارسُ الحقيقيُّ لبياناتك يبقى حيث كان: الخادمُ يرفض كلَّ فعلٍ لمن
   ليس أدمن، ولو فتح الصفحةَ ألفُ فضوليّ.

   ===== ولمَ يُخفى الجسمُ بـ‎visibility‎ لا بـ‎display‎؟ =====
   ‎display:none‎ يجعل قياساتِ العناصر أصفارًا، واللوحةُ تقيس عند الإقلاع.
   و‎visibility‎ يُبقي التخطيطَ قائمًا ويمنع الرؤية. */

(function () {
  'use strict';

  var KEY = 'academia2:tok:lock';
  var root = document.documentElement;
  root.style.visibility = 'hidden';

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '#acgate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;' +
      'background:#0e1b1f;color:#e6edf0;font-family:"IBM Plex Sans Arabic","Segoe UI",Tahoma,sans-serif;visibility:visible}' +
      '#acgate .b{width:100%;max-width:360px;background:#15262c;border:1px solid #27424a;border-radius:16px;padding:26px 24px;text-align:center}' +
      '#acgate h1{margin:0 0 6px;font-size:18px;font-weight:700}' +
      '#acgate p{margin:0 0 18px;font-size:13px;color:#8fa6ad;line-height:1.7}' +
      '#acgate input{width:100%;font:inherit;font-size:15px;padding:11px 13px;border-radius:11px;' +
      'border:1px solid #27424a;background:#0e1b1f;color:#e6edf0;text-align:center;margin-bottom:10px}' +
      '#acgate input:focus{outline:0;border-color:#79b8bd}' +
      '#acgate button{width:100%;font:inherit;font-size:14px;font-weight:700;cursor:pointer;padding:12px;' +
      'border-radius:11px;border:0;background:#2c5e65;color:#fff}' +
      '#acgate button:disabled{opacity:.5;cursor:default}' +
      '#acgate .m{min-height:18px;margin-top:10px;font-size:12.5px;color:#d08a6a}';
    document.head.appendChild(s);
  }

  function gate(isSet, csalt, iter) {
    css();
    var d = document.createElement('div');
    d.id = 'acgate';
    d.innerHTML =
      '<div class="b"><h1>' + (isSet ? 'لوحة أكاديميا' : 'عيّن كلمة سرّ اللوحة') + '</h1>' +
      '<p>' + (isSet ? 'هذي اللوحةُ مقفلة. أدخل كلمةَ السرّ للمتابعة.'
                     : 'لم تُعيَّن كلمةُ سرٍّ بعد. اكتب واحدةً الآن، وتُطلب في كلّ دخولٍ بعدها.') + '</p>' +
      '<form id="acf"><input id="acp" type="password" autocomplete="current-password" placeholder="كلمة السرّ" autofocus>' +
      '<button id="acb" type="submit">' + (isSet ? 'افتح' : 'عيّن') + '</button></form>' +
      '<div class="m" id="acm"></div></div>';
    document.body.appendChild(d);
    root.style.visibility = 'visible';
    document.body.style.visibility = 'hidden';
    d.style.visibility = 'visible';
    try { document.getElementById('acp').focus(); } catch (e) {}

    document.getElementById('acf').addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = document.getElementById('acp').value;
      var btn = document.getElementById('acb'), msg = document.getElementById('acm');
      if (!pw) return;
      btn.disabled = true; msg.textContent = '…';

      derive(pw, csalt, iter).then(function (h) {
        return fetch('/api/lock/' + (isSet ? 'open' : 'set'), {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ h: h }),
        });
      }).then(function (r) {
        if (r.ok) { d.remove(); document.body.style.visibility = 'visible'; return; }
        btn.disabled = false;
        msg.textContent = r.status === 401 ? 'كلمةُ السرّ خاطئة' : 'تعذّر الفتح (' + r.status + ')';
      }).catch(function () {
        btn.disabled = false; msg.textContent = 'تعذّر الوصولُ إلى الخادم';
      });
    });
  }

  /* نفسُ اشتقاق صفحة القفل الأصلية: الكلمةُ لا تُرسل خامًا أبدًا */
  function derive(pw, csalt, iter) {
    var enc = new TextEncoder();
    var salt = Uint8Array.from(atob(csalt), function (c) { return c.charCodeAt(0); });
    return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) {
        return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, k, 256);
      })
      .then(function (b) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(b)));
      });
  }

  function start() {
    fetch('/api/lock/state', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.open) { root.style.visibility = 'visible'; return; }   /* الرمزُ المحفوظ ما زال صالحًا */
        gate(!!(j && j.set), j && j.csalt, (j && j.iter) || 100000);
      })
      .catch(function () {
        /* خادمٌ لا يُجيب لا يفتح البابَ — يُقفل ويُقال، كما كان الأصل */
        css();
        var d = document.createElement('div');
        d.id = 'acgate';
        d.innerHTML = '<div class="b"><h1>تعذّر الوصولُ إلى الخادم</h1>' +
          '<p>لم يُعرف أمقفلةٌ هي أم مفتوحة، فبقيت مقفلة. أعِد التحميل.</p></div>';
        document.body.appendChild(d);
        root.style.visibility = 'visible';
        document.body.style.visibility = 'hidden';
        d.style.visibility = 'visible';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
