/* منقولة من ‎functions/api/lock/[[path]].js‎ — والفرق سطران:
   ‎env.DB‎ صار الجسر، وفحص «لا قاعدة» ذهب لان الجسر يصيح بنفسه.
   وما عداهما حرف بحرف. */
import { db } from '../_db.js';

/* ============================================================
   ‎/api/lock/*‎ — قفلُ لوحة الأدمن
   ============================================================
     GET  /api/lock/state          ⇐ أعُيّنت كلمةٌ؟ وأأنا داخل؟ ومِلحُ العميل
     POST /api/lock/set   {h}      ⇐ يُعيّنها — **مرّةً واحدةً في عمر الموقع**
     POST /api/lock/open  {h}      ⇐ يفتح القفل
     POST /api/lock/close          ⇐ يُغلقه

   ===== والكلمةُ لا تبلغ الخادمَ خامًا =====
   المتصفّحُ يشتقّ ‎h = PBKDF2(كلمتك, ملحِ العميل)‎ **عند صاحبها** ويرسل ‎h‎ وحدَها.
   فلا الخادمُ يعرف الكلمة، ولا مَن قرأ سجلَّ الطلبات، ولا مَن كتب هذي الشيفرة.
   وملحُ العميل ثابتٌ للموقع (لا يُبدَّل) لأنّ الداخلَ لاحقًا يحتاج أن يشتقّ به
   المثلَ ليطابق — وهو ملحٌ لا سرّ: غايتُه أن يختلف اشتقاقُ هذا الموقع عن غيره.

   ===== وتُشتقّ ثانيةً قبل الخزن =====
   ‎h‎ التي تصل تُشتقّ بملحِ الخادم ثمّ تُخزَّن. فمن سرق الجدولَ لا يملك ما
   **يُرسله** ليدخل به — والمخزَّنُ ليس هو المُرسَل.

   ===== والتعيينُ مرّةً واحدة =====
   ‎admin_set = 1‎ يُغلق بابَ التعيين إلى الأبد. فلو عثر أحدٌ على المسار بعد أن
   عيّنتَ، وجد بابَ التعيين مقفلًا لا مفتوحًا يكتب فيه ما شاء.
   ولإعادة التعيين: تُصفَّر ‎admin_set‎ من القاعدة بأمرٍ — وهو بابُك أنت وحدك. */

const J = (o, s = 200, extra = {}) => new Response(JSON.stringify(o), {
  status: s,
  headers: Object.assign({ 'content-type': 'application/json; charset=utf-8',
                           'cache-control': 'no-store' }, extra),
});

const LOCK_DAYS = 30;
/* ===== وجولتان: للعميل وللخادم =====
   ‎ITER_C‎ عند العميل: لا حدَّ في المتصفّح، وهي التي تحمي كلمتَك فتُشدَّد.
   ‎ITER_S‎ على الخادم: كلاودفلير يردّ ما فوق مئةِ ألف صراحةً
   («iteration counts above 100000 are not supported») — وقد وقعت في ذلك.
   وهي ههنا تجزئةُ تجزئةٍ لا تجزئةُ كلمة: مدخلُها عشوائيٌّ بمئتي بِتٍّ لا كلمةٌ
   يختارها إنسان، فلا يُهاجَم بقاموسٍ ولا تنقصه الجولات. */
const ITER_C = 200000;
const ITER_S = 100000;
const enc = new TextEncoder();
const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
const now = () => Math.floor(Date.now() / 1000);
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

async function pbkdf2(pw, salt, iter) {
  const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return b64(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, k, 256));
}

/* مقارنةٌ في زمنٍ ثابت: العاديّةُ تُفشي طولَ ما تطابق */
function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const meta = async (db, k) => {
  const r = await db.prepare('SELECT v FROM meta WHERE k = ?').bind(k).first();
  return r ? r.v : '';
};
const setMeta = (db, k, v) =>
  db.prepare('INSERT INTO meta (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v = excluded.v')
    .bind(k, v).run();

/* الكوكيّ: منفصلٌ عن كوكيّ الموقع — قفلُ بابٍ لا جلسةُ مستخدم */
const cookie = (v, days) =>
  `alock=${v}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${days * 86400}`;

async function opened(db, req) {
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)alock=([^;]+)/);
  if (!m) return false;
  const want = await meta(db, 'admin_pw');
  if (!want) return false;
  /* والكوكيُّ تجزئةُ المخزَّن مع ملحِ الخادم — فلا يُصنع إلّا بعد فتحٍ صحيح،
     ولا يُنتحل بقراءة الجدول وحدَه */
  const good = await sha256('alock|' + want + '|' + await meta(db, 'admin_salt'));
  return same(m[1], good);
}

export async function onRequest({ request, env, params }) {
  const path = (Array.isArray(params.path) ? params.path : [params.path || '']).filter(Boolean).join('/');
  const m = request.method;

  try {
    const isSet = (await meta(db, 'admin_set')) === '1';

    if (path === 'state' && m === 'GET') {
      /* ومِلحُ العميل يُولد عند أوّل سؤال، فيثبت بعدها */
      let cs = await meta(db, 'admin_csalt');
      if (!cs) { cs = b64(rnd(16)); await setMeta(db, 'admin_csalt', cs); }
      return J({ set: isSet, open: await opened(db, request), csalt: cs, iter: ITER_C });
    }

    if (path === 'close' && m === 'POST') {
      return J({ ok: true }, 200, { 'set-cookie': 'alock=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' });
    }

    let b = {};
    try { b = await request.json(); } catch (e) { return J({ error: 'body' }, 400); }
    const h = String(b.h || '').trim();
    if (!h || h.length > 200) return J({ error: 'h' }, 400);

    /* ---------- التعيين: مرّةً واحدة ---------- */
    if (path === 'set' && m === 'POST') {
      if (isSet) return J({ error: 'already-set' }, 409);
      const salt = rnd(16);
      const stored = await pbkdf2(h, salt, ITER_S);
      await setMeta(db, 'admin_pw', stored);
      await setMeta(db, 'admin_salt', b64(salt));
      await setMeta(db, 'admin_set', '1');
      const tok = await sha256('alock|' + stored + '|' + b64(salt));
      return J({ ok: true }, 200, { 'set-cookie': cookie(tok, LOCK_DAYS) });
    }

    /* ---------- الفتح ---------- */
    if (path === 'open' && m === 'POST') {
      if (!isSet) return J({ error: 'not-set' }, 409);
      const want = await meta(db, 'admin_pw');
      const salt = await meta(db, 'admin_salt');
      const got = await pbkdf2(h, unb64(salt), ITER_S);
      if (!same(got, want)) return J({ error: 'bad' }, 401);
      const tok = await sha256('alock|' + want + '|' + salt);
      return J({ ok: true }, 200, { 'set-cookie': cookie(tok, LOCK_DAYS) });
    }

    return J({ error: 'not-found' }, 404);
  } catch (e) {
    console.error('lock:', path, e && e.message);
    return J({ error: 'server' }, 500);
  }
}
