/* ============================================================
   ‎/api/books‎ — كتبُ المساهمات (مصادرُ PDF) إلى السحابة
   ============================================================
   كان كتابُ المساهمة يُحفظ في متصفّح من أضافه وحده (IndexedDB)، ولا يبلغ الخادمَ إلّا
   اسمُه: غيرُه يرى «1 مصدر · 20 صفحة» ولا يفتحه، وهو لا يجده من جهازٍ آخر، ويضيع إن
   مُسحت بياناتُ المتصفّح. والمبدأ (صاحبُ الموقع): الموقعُ سحابيّ، ولا شيءَ مهمٌّ في المتصفّح وحده.

     POST /api/books   {h, size, type}  ⇐ للمسجَّل: إذنُ رفعٍ مؤقّت، أو «موجود»
     والقراءةُ العامّةُ لا تمرّ ههنا (‎/storage/v1/object/public/books/<h>‎) — إلّا الكتبَ المحميّة:
     تلك في مستودعٍ خاصٍّ لا تُقرأ إلّا بإذن (ROADMAP-PROTECT · أسفل).

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
/* ===== والكتبُ المحميّة (ROADMAP-PROTECT) =====
   مصدرٌ نوعه «كتاب» لا يُنشر: يُحفظ في مستودعٍ **خاصّ** لا رابطَ عامًّا له، ويُقرأ برابطٍ موقَّع ٦٠ ثانية لمن له حقّ.
   والحقّ (‎book_access‎) يُكتسب **برفع الملفّ نفسِه**: الخادمُ ينزّله ويحسب بصمتَه — لا يكفي إرسالُ البصمة (هي مكشوفةٌ في المساهمة).
     POST {h,size,type,priv:1}  ⇐ إذنُ رفعٍ إلى مسارٍ مؤقّت (‎tmp/<uid>/…‎)
     POST {verify:1,h,tmp}      ⇐ يُحسب بصمةُ المؤقّت؛ تطابقت ⇐ يُنقل إلى ‎<h>‎ ويُسجَّل الحقّ وتُحذف أيُّ نسخةٍ عامّةٍ بالبصمة نفسِها
     GET ?h=                    ⇐ له حقّ ⇐ رابطٌ موقَّع ٦٠ ثانية · وإلّا ٤٠٣ (ولا يُقال أموجودٌ هو أم لا)
     POST {pv:1,h}              ⇐ لمن له حقّ: إذنُ رفع المصغّرات العامّة ‎pv/<h>.webp‎ (أشكالُ الصفحات بلا نصٍّ يُقرأ)
     POST {unpriv:1,h}          ⇐ لمن له حقّ: يعود الملفُّ عامًّا (غُيّر نوعُ المصدر عن «كتاب») */
const PRIV = "books-private";
const MAX_VERIFY = 200 * 1024 * 1024;
/* الأنواعُ المقبولة: الكتابُ PDF، والغلافُ صورةٌ أو PDF */
const TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"]);

/* المستودعان يُنشآن مرّةً عند أوّل حاجة — فلا خطوةَ يدويّةَ في لوحة Supabase */
const bucketOK = {};
async function ensureBucket(base, key, id, pub) {
  if (bucketOK[id]) return;
  const h = { authorization: "Bearer " + key, apikey: key, "content-type": "application/json" };
  const g = await fetch(base + "/storage/v1/bucket/" + id, { headers: h });
  if (g.ok) { bucketOK[id] = true; return; }
  const c = await fetch(base + "/storage/v1/bucket", { method: "POST", headers: h,
    body: JSON.stringify({ id, name: id, public: !!pub }) });
  if (!c.ok && c.status !== 409) throw new Error("bucket " + c.status + " " + (await c.text()).slice(0, 120));
  bucketOK[id] = true;
}

export async function onRequest({ request, env }) {
  try {
    const base = env.SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) return J({ error: "storage-env" }, 500);
    const AH = { authorization: "Bearer " + key, apikey: key };
    const pub = h => base + "/storage/v1/object/public/" + BUCKET + "/" + h;
    const has = async (bucket, path) => (await fetch(base + "/storage/v1/object/authenticated/" + bucket + "/" + path, { method: "HEAD", headers: AH })).ok;
    const del = (bucket, paths) => fetch(base + "/storage/v1/object/" + bucket, { method: "DELETE", headers: Object.assign({ "content-type": "application/json" }, AH), body: JSON.stringify({ prefixes: paths }) });
    const signUp = async (bucket, path, upsert) => {
      const r = await fetch(base + "/storage/v1/object/upload/sign/" + bucket + "/" + path, {
        method: "POST", headers: Object.assign({ "content-type": "application/json" }, AH, upsert ? { "x-upsert": "true" } : {}), body: "{}" });
      const j = await r.json().catch(() => ({}));
      return r.ok && j.url ? base + "/storage/v1" + j.url : null;
    };
    const isPriv = async h => !!(await db.prepare("SELECT 1 AS x FROM book_priv WHERE h = ?").bind(h).first());
    const canRead = async (h, uid) => !!(await db.prepare("SELECT 1 AS x FROM book_access WHERE h = ? AND uid = ?").bind(h, uid).first());

    const s = await session(db, request);
    if (!s) return J({ error: "auth" }, 401);

    /* ===== القراءة: رابطٌ موقَّعٌ قصير لمن له حقّ ===== */
    if (request.method === "GET") {
      const h = String(new URL(request.url).searchParams.get("h") || "").toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(h)) return J({ error: "hash" }, 400);
      if (!(await canRead(h, s.uid))) return J({ error: "forbidden" }, 403);
      await ensureBucket(base, key, PRIV, false);
      const r = await fetch(base + "/storage/v1/object/sign/" + PRIV + "/" + h, {
        method: "POST", headers: Object.assign({ "content-type": "application/json" }, AH), body: JSON.stringify({ expiresIn: 60 }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !(j.signedURL || j.signedUrl)) return J({ error: "sign" }, 502);
      return J({ h, url: base + "/storage/v1" + (j.signedURL || j.signedUrl) });
    }

    if (request.method !== "POST") return J({ error: "method" }, 405);
    let b = {};
    try { b = await request.json(); } catch (e) { return J({ error: "body" }, 400); }
    const h = String(b.h || "").toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(h)) return J({ error: "hash" }, 400);

    /* ===== التحقّق: الخادمُ يحسب بصمةَ ما رُفع بنفسه ===== */
    if (b.verify) {
      const tmp = String(b.tmp || "");
      if (!tmp.startsWith("tmp/" + s.uid + "/") || tmp.includes("..")) return J({ error: "tmp" }, 400);
      await ensureBucket(base, key, PRIV, false);
      const g = await fetch(base + "/storage/v1/object/authenticated/" + PRIV + "/" + tmp, { headers: AH });
      if (!g.ok) return J({ error: "tmp-missing" }, 404);
      const len = +(g.headers.get("content-length") || 0);
      if (len > MAX_VERIFY) { await del(PRIV, [tmp]); return J({ error: "size" }, 413); }
      const got = hex(await crypto.subtle.digest("SHA-256", await g.arrayBuffer()));
      if (got !== h) { await del(PRIV, [tmp]); return J({ error: "mismatch" }, 409); }
      if (await has(PRIV, h)) await del(PRIV, [tmp]);
      else {
        const m = await fetch(base + "/storage/v1/object/move", { method: "POST", headers: Object.assign({ "content-type": "application/json" }, AH),
          body: JSON.stringify({ bucketId: PRIV, sourceKey: tmp, destinationKey: h }) });
        if (!m.ok) return J({ error: "move", detail: (await m.text()).slice(0, 120) }, 502);
      }
      const t = now();
      await db.prepare("INSERT INTO book_priv (h, ts) VALUES (?, ?) ON CONFLICT (h) DO NOTHING").bind(h, t).run();
      await db.prepare("INSERT INTO book_access (h, uid, ts) VALUES (?, ?, ?) ON CONFLICT (h, uid) DO NOTHING").bind(h, s.uid, t).run();
      await del(BUCKET, [h]);   /* ولا تبقى نسخةٌ عامّة بالبصمة نفسِها */
      return J({ h, ok: true });
    }

    /* ===== المصغّراتُ العامّة: لمن له حقّ ===== */
    if (b.pv) {
      if (!(await canRead(h, s.uid))) return J({ error: "forbidden" }, 403);
      await ensureBucket(base, key, BUCKET, true);
      const up = await signUp(BUCKET, "pv/" + h + ".webp", true);
      return up ? J({ h, upload: up, url: pub("pv/" + h + ".webp") }) : J({ error: "sign" }, 502);
    }

    /* ===== العودةُ عامًّا (تغيّر النوع عن «كتاب»): لمن له حقّ ===== */
    if (b.unpriv) {
      if (!(await canRead(h, s.uid))) return J({ error: "forbidden" }, 403);
      await ensureBucket(base, key, BUCKET, true);
      if (!(await has(BUCKET, h))) {
        const c = await fetch(base + "/storage/v1/object/copy", { method: "POST", headers: Object.assign({ "content-type": "application/json" }, AH),
          body: JSON.stringify({ bucketId: PRIV, sourceKey: h, destinationBucket: BUCKET, destinationKey: h }) });
        if (!c.ok) return J({ error: "copy", detail: (await c.text()).slice(0, 120) }, 502);
      }
      await db.prepare("DELETE FROM book_priv WHERE h = ?").bind(h).run();
      return J({ h, ok: true, url: pub(h) });
    }

    const type = String(b.type || "application/pdf");
    if (!TYPES.has(type)) return J({ error: "type" }, 415);

    /* ===== الرفعُ المحميّ: إلى مسارٍ مؤقّتٍ يتحقّق منه الخادمُ بعده ===== */
    if (b.priv) {
      if (type !== "application/pdf") return J({ error: "type" }, 415);
      await ensureBucket(base, key, PRIV, false);
      /* (له حقٌّ أصلًا والملفُّ قائم: لا يُرفع ثانيةً) */
      if (await canRead(h, s.uid) && await has(PRIV, h)) return J({ h, exists: true });
      const tmp = "tmp/" + s.uid + "/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const up = await signUp(PRIV, tmp, false);
      return up ? J({ h, exists: false, upload: up, tmp }) : J({ error: "sign" }, 502);
    }

    /* ===== والعامّ: كما كان — إلّا بصمةً محميّة ===== */
    if (await isPriv(h)) return J({ error: "private" }, 409);
    await ensureBucket(base, key, BUCKET, true);
    /* موجودٌ؟ فلا يُرفع ثانيةً */
    const head = await fetch(pub(h), { method: "HEAD" });
    if (head.ok) return J({ h, exists: true, url: pub(h) });
    const up = await signUp(BUCKET, h, false);
    return up ? J({ h, exists: false, upload: up, url: pub(h) }) : J({ error: "sign" }, 502);
  } catch (e) {
    console.error("books:", e && e.message);
    return J({ error: "server" }, 500);
  }
}
