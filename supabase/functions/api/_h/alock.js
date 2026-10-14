/* منقولة من ‎functions/AbdulrahmanUniProjectAdmin/[[path]].js‎ — والفرق سطران:
   ‎env.DB‎ صار الجسر، وفحص «لا قاعدة» ذهب لان الجسر يصيح بنفسه.
   وما عداهما حرف بحرف. */
import { db } from '../_db.js';

/* ============================================================
   حارسُ لوحة الأدمن — يسبق ملفّاتها فلا تُقدَّم لمن لم يفتح القفل
   ============================================================
   ولا يكفي أن تُخفى اللوحةُ خلف نموذجٍ في المتصفّح: من طلب ‎admin.js‎ مباشرةً
   أخذها. فالمنعُ ههنا — قبل أن يُقدَّم ملفٌّ واحد.

   ===== ولا يُعلَن عن الباب =====
   من لم يفتح القفلَ يُقدَّم له **نموذجُ القفل** لا رسالةُ منع: صفحةٌ واحدةٌ
   قائمةٌ بذاتها، لا تحمّل شيئًا من اللوحة ولا تدلّ على ما وراءها.

   ===== وأوّلُ مرّةٍ تُعيَّن =====
   إن لم تُعيَّن كلمةٌ بعد، فالنموذجُ نموذجُ **تعيين**. وهو مفتوحٌ مرّةً واحدةً
   في عمر الموقع: أوّلُ من عيّن أغلقه. فعيّنها الآن قبل أن يعرف المسارَ أحد. */

export const PAGE = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>قفل</title>
<style>
  :root { --pet:#2c5e65; --ink:#14233f; --soft:#5d6b82; --bg:#f4f1ea; --card:#fff; --line:#d7dee8; --bad:#c0453e; }
  @media (prefers-color-scheme:dark){:root{--pet:#6aa9b0;--ink:#e7eef0;--soft:#9fb2b5;--bg:#0f1c21;--card:#16252b;--line:#2a4249;--bad:#e2756d;}}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);
       font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;padding:24px;line-height:1.8}
  .box{width:100%;max-width:380px;background:var(--card);border:1px solid var(--line);
       border-radius:18px;padding:32px 26px;box-shadow:0 12px 40px rgba(20,35,63,.08)}
  .ic{width:38px;height:38px;color:var(--pet);opacity:.8;display:block;margin:0 auto}
  h1{font-size:18px;font-weight:800;margin:14px 0 6px;text-align:center}
  p.w{margin:0 0 20px;font-size:12.5px;color:var(--soft);text-align:center;line-height:1.75}
  label{display:block;font-size:12px;font-weight:700;color:var(--soft);margin-bottom:5px}
  input{width:100%;font:inherit;font-size:15px;padding:11px 13px;border-radius:11px;
        border:1px solid var(--line);background:transparent;color:var(--ink);margin-bottom:12px}
  input:focus{outline:2px solid var(--pet);outline-offset:1px;border-color:var(--pet)}
  button{width:100%;font:inherit;font-size:14px;font-weight:700;cursor:pointer;padding:12px;
         border:0;border-radius:11px;background:var(--pet);color:#fff}
  button:disabled{opacity:.5;cursor:not-allowed}
  .err{margin:10px 0 0;padding:9px 11px;border-radius:9px;font-size:12.5px;font-weight:700;
       color:var(--bad);background:color-mix(in srgb,var(--bad) 10%,transparent);
       border:1px solid color-mix(in srgb,var(--bad) 30%,transparent)}
  .err[hidden]{display:none}
  .note{margin:16px 0 0;font-size:11.5px;color:var(--soft);text-align:center;opacity:.9}
</style>
</head>
<body>
<div class="box">
  <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="10.5" width="16" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>
  <h1 id="ttl">…</h1>
  <p class="w" id="why"></p>
  <form id="f">
    <label for="pw" id="lb">كلمة المرور</label>
    <input type="password" id="pw" autocomplete="current-password" autofocus>
    <div id="c2wrap" hidden>
      <label for="pw2">أعِدها</label>
      <input type="password" id="pw2" autocomplete="new-password">
    </div>
    <button type="submit" id="go">ادخل</button>
    <p class="err" id="err" hidden></p>
  </form>
  <p class="note" id="note"></p>
</div>
<script>
(function(){
  'use strict';
  var $ = function(s){ return document.querySelector(s); };
  var st = null;

  /* ===== الاشتقاقُ يقع ههنا، عند صاحب الكلمة =====
     فلا تغادر كلمتُك هذا المتصفّحَ أبدًا — يُرسل أثرُها لا هي. */
  function derive(pw, csalt, iter){
    var enc = new TextEncoder();
    var salt = Uint8Array.from(atob(csalt), function(c){ return c.charCodeAt(0); });
    return crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
      .then(function(k){
        return crypto.subtle.deriveBits({name:'PBKDF2', salt:salt, iterations:iter, hash:'SHA-256'}, k, 256);
      })
      .then(function(bits){
        return btoa(String.fromCharCode.apply(null, new Uint8Array(bits)));
      });
  }

  fetch('/api/lock/state', {cache:'no-store'}).then(function(r){ return r.json(); }).then(function(j){
    st = j;
    if (j.open) { location.reload(); return; }
    if (j.set) {
      $('#ttl').textContent = 'لوحة الأدمن';
      $('#why').textContent = 'اكتب كلمة المرور للدخول.';
      $('#go').textContent = 'ادخل';
      $('#note').textContent = '';
    } else {
      $('#ttl').textContent = 'عيّن كلمة المرور';
      $('#why').textContent = 'أول مرة — اختر كلمة تفتح بها اللوحة بعد اليوم.';
      $('#lb').textContent = 'كلمة المرور الجديدة';
      $('#pw').setAttribute('autocomplete','new-password');
      $('#c2wrap').hidden = false;
      $('#go').textContent = 'عيّنها';
      $('#note').textContent = 'تُعيَّن مرة واحدة — واحفظها، فلا أحد يقدر أن يقرأها بعدها.';
    }
  });

  $('#f').addEventListener('submit', function(e){
    e.preventDefault();
    if (!st) return;
    var pw = $('#pw').value;
    var err = $('#err');
    err.hidden = true;
    if (pw.length < 8) { err.textContent = 'كلمة المرور ٨ أحرف فأكثر'; err.hidden = false; return; }
    if (!st.set && pw !== $('#pw2').value) { err.textContent = 'الكلمتان غير متطابقتين'; err.hidden = false; return; }
    var b = $('#go'); b.disabled = true; b.textContent = 'لحظة…';
    derive(pw, st.csalt, st.iter).then(function(h){
      return fetch('/api/lock/' + (st.set ? 'open' : 'set'), {
        method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({h:h})
      });
    }).then(function(r){
      if (r.ok) { location.reload(); return; }
      return r.json().catch(function(){ return {}; }).then(function(j){
        b.disabled = false; b.textContent = st.set ? 'ادخل' : 'عيّنها';
        err.textContent = j.error === 'already-set' ? 'عُيّنت من قبل — حدّث الصفحة'
                        : j.error === 'bad' ? 'كلمة المرور غير صحيحة'
                        : 'تعذّر الوصول إلى الخادم';
        err.hidden = false;
      });
    }).catch(function(){
      b.disabled = false; b.textContent = st.set ? 'ادخل' : 'عيّنها';
      err.textContent = 'تعذّر الوصول إلى الخادم'; err.hidden = false;
    });
  });
})();
</script>
</body>
</html>`;

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function onRequest(ctx) {
  const { request, env, next } = ctx;

  /* وقاعدةٌ غائبةٌ لا تفتح البابَ: تُقفل ولا تُمرّر */

  const g = async k => {
    const r = await db.prepare('SELECT v FROM meta WHERE k = ?').bind(k).first();
    return r ? r.v : '';
  };
  /* The admin page is served from GitHub Pages and the API from Supabase, so
   the alock cookie cannot ride along. The page holds the token and sends
   it in `x-alock`; the cookie still works where the origins do match. */
  const m = (request.headers.get('x-alock') ? [0, request.headers.get('x-alock')]
    : (request.headers.get('cookie') || '').match(/(?:^|;\s*)alock=([^;]+)/));
  let ok = false;
  if (m) {
    const pw = await g('admin_pw');
    if (pw) ok = same(m[1], await sha256('alock|' + pw + '|' + await g('admin_salt')));
  }
  if (ok) return next();

  /* ونموذجُ القفل يُقدَّم بنفس رمز النجاح: صفحةٌ تُعرض لا خطأٌ يُعالَج.
     و‎no-store‎ لئلّا تُخبَّأ فتُقدَّم لمن فتح القفل بعدها */
  return new Response(PAGE, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store, must-revalidate' },
  });
}
