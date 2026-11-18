/* ============================================================
   ‎/api/books‎ — كتبُ المساهمات (مصادرُ PDF) إلى السحابة
   ============================================================
   كان كتابُ المساهمة يُحفظ في متصفّح من أضافه وحده (IndexedDB)، ولا يبلغ الخادمَ إلّا
   اسمُه: غيرُه يرى «1 مصدر · 20 صفحة» ولا يفتحه، وهو لا يجده من جهازٍ آخر، ويضيع إن
   مُسحت بياناتُ المتصفّح. والمبدأ (صاحبُ الموقع): الموقعُ سحابيّ، ولا شيءَ مهمٌّ في المتصفّح وحده.

     POST /api/books   {h, size, type}  ⇐ للمسجَّل: إذنُ رفعٍ مؤقّت، أو «موجود»
     والقراءةُ لا تمرّ ههنا: المستودعُ عامُّ القراءة (قرارُ صاحب الموقع، مؤقّتًا حتى ميزة
     الحجب) — فالرابطُ ‎/storage/v1/object/public/books/<h>‎ يفتح لكلّ أحد.

   ===== والملفُّ يُخزَّن مرّةً باسم بصمته =====
   ‎h‎ = SHA-256 لمحتواه. فالكتابُ المكرّرُ في اثنتي عشرةَ مساهمةً ملفٌّ واحد، والرفعُ
   الثاني يجده «موجودًا» فلا يُرفع. والبصمةُ يحسبها العميل؛ ولو كذب لم يضرّ إلّا نفسَه:
   الاسمُ اسمُه هو، ولا يكتب فوق ملفٍّ قائم (لا ‎upsert‎).

   ===== ولا حدَّ للحجم من عندنا (قرارُ صاحب الموقع) =====
   يبقى حدُّ Supabase نفسِه للملفّ الواحد. وتُضبط الحدودُ لاحقًا. */
import { db } from "../_db.js";

const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const now = () => Math.floor(Date.now() / 1000);
const sha256s = async s => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));

/* ============================================================
   WHICH LOGIN IS THIS REQUEST USING?
   ============================================================
   One website, one cookie jar, but two identities: the admin page acts as
   the site account, the main site acts as the reader who signed in. They
   used to share the cookie `sid`, so opening the admin page **signed the
   reader out of their own site** — every single time.

   So each identity gets its own cookie, and the request says which one it
   means. The admin page sends `x-as: site` and is read from `asid`;
   everyone else is read from `sid`. Neither can touch the other.

   `asid` is only ever issued by POST /api/auth/site, which needs the admin
   password lock — so claiming to be the site is not enough to become it.

   This block is copied byte-for-byte into every endpoint that resolves a
   login. A guard checks the copies still match. */
const SID = req => {
  /* The site and the API no longer share an origin, so the cookie cannot
     ride along. The caller sends the token it holds; which jar it came
     from is the caller's choice, exactly as `x-as` used to decide. */
  const a = req.headers.get('authorization') || '';
  if (a.slice(0, 7).toLowerCase() === 'bearer ') return a.slice(7).trim();
  return ((req.headers.get('cookie') || '').match(
    req.headers.get('x-as') === 'site' ? /(?:^|;\s*)asid=([^;]+)/ : /(?:^|;\s*)sid=([^;]+)/) || [])[1] || '';
};
async function session(db, req) {
  const m = [null, SID(req)];
  if (!m[1]) return null;
  return await db.prepare('SELECT uid FROM sessions WHERE th = ? AND expires > ?')
    .bind(await sha256s(m[1]), now()).first();
}

const BUCKET = "books";
/* الأنواعُ المقبولة: الكتابُ PDF، والغلافُ صورةٌ أو PDF */
const TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"]);

/* المستودعُ يُنشأ مرّةً عند أوّل حاجة — فلا خطوةَ يدويّةَ في لوحة Supabase */
let bucketOK = false;
async function ensureBucket(base, key) {
  if (bucketOK) return;
  const h = { authorization: "Bearer " + key, apikey: key, "content-type": "application/json" };
  const g = await fetch(base + "/storage/v1/bucket/" + BUCKET, { headers: h });
  if (g.ok) { bucketOK = true; return; }
  const c = await fetch(base + "/storage/v1/bucket", { method: "POST", headers: h,
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }) });
  if (!c.ok && c.status !== 409) throw new Error("bucket " + c.status + " " + (await c.text()).slice(0, 120));
  bucketOK = true;
}

export async function onRequest({ request, env }) {
  try {
    const base = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) return J({ error: "storage-env" }, 500);
    const pub = h => base + "/storage/v1/object/public/" + BUCKET + "/" + h;

    if (request.method !== "POST") return J({ error: "method" }, 405);
    const s = await session(db, request);
    if (!s) return J({ error: "auth" }, 401);

    let b = {};
    try { b = await request.json(); } catch (e) { return J({ error: "body" }, 400); }
    const h = String(b.h || "").toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(h)) return J({ error: "hash" }, 400);
    const type = String(b.type || "application/pdf");
    if (!TYPES.has(type)) return J({ error: "type" }, 415);

    await ensureBucket(base, key);
    /* موجودٌ؟ فلا يُرفع ثانيةً */
    const head = await fetch(pub(h), { method: "HEAD" });
    if (head.ok) return J({ h, exists: true, url: pub(h) });

    const r = await fetch(base + "/storage/v1/object/upload/sign/" + BUCKET + "/" + h, {
      method: "POST",
      headers: { authorization: "Bearer " + key, apikey: key, "content-type": "application/json" },
      body: "{}",
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) return J({ error: "sign", detail: String(j.message || j.error || r.status).slice(0, 120) }, 502);
    return J({ h, exists: false, upload: base + "/storage/v1" + j.url, url: pub(h) });
  } catch (e) {
    console.error("books:", e && e.message);
    return J({ error: "server" }, 500);
  }
}
