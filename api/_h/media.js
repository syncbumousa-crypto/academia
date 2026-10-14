/* منقولة من ‎functions/api/media/[[path]].js‎ — والفرق سطران:
   ‎env.DB‎ صار الجسر، وفحص «لا قاعدة» ذهب لان الجسر يصيح بنفسه.
   وما عداهما حرف بحرف. */
import { db } from '../_db.js';

/* ============================================================
   ‎/api/media‎ — بِتاتُ الصور المنشورة (م٤ من ROADMAP-SERVER)
   ============================================================
     POST /api/media        ⇐ يرفع صورةً (المتنُ بِتاتٌ خام، والنوعُ في الترويسة)
                              يردّ ‎{k, url}‎ — والجلسةُ شرط
     GET  /api/media/<k>    ⇐ يُقدّمها للجميع بلا جلسة

   ===== المفتاحُ هو المحتوى =====
   ‎k = sha256(bytes)‎. فثلاثُ ثمرات:
     · الصورةُ الواحدةُ تُخزَّن مرّةً مهما نشرها من نشر.
     · ورفعُها ثانيةً لا يكتب شيئًا — يُردّ المفتاحُ نفسُه ويُغلق الطلب.
     · والعنوانُ **أبديّ**: محتوًى لا يتغيّر تحت مفتاحٍ لا يتغيّر، فيُخبَّأ سنةً
       بلا خوفٍ من قديمٍ يُقدَّم مكان جديد.

   ===== ولا يُصدَّق النوعُ المرسَل =====
   ‎Content-Type‎ يكتبه المرسِل، فقد يقول «صورة» ويرسل سكربتًا. فتُقرأ **البِتاتُ
   الأولى** ويُستخرج النوعُ منها (توقيعُ الملفّ)، وما لم يُعرف يُردّ. ثمّ يُقدَّم
   بـ‎nosniff‎ فلا يُعيد المتصفّحُ تخمينَه.

   ===== وموضعُ البِتات يُبدَّل ولا يُمسّ العميل =====
   ‎mediaPut‎ و‎mediaGet‎ وحدَهما تعرفان أين تسكن. اليومَ ‎D1‎، وغدًا ‎R2‎ متى
   فُعِّل — والمفتاحُ والعنوانُ والعميلُ لا يتغيّر منها شيء. */

const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const MAX = 1024 * 1024;          /* ميجابايتٌ للصورة — وأكبرُ ما في المجموعة ٣٥٤ك */
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);
const sha256 = async b => hex(await crypto.subtle.digest('SHA-256', b));
const sha256s = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

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
const SID = req => ((req.headers.get('cookie') || '').match(
  req.headers.get('x-as') === 'site' ? /(?:^|;\s*)asid=([^;]+)/ : /(?:^|;\s*)sid=([^;]+)/) || [])[1] || '';
async function session(db, req) {
  const m = [null, SID(req)];
  if (!m[1]) return null;
  return await db.prepare('SELECT uid FROM sessions WHERE th = ? AND expires > ?')
    .bind(await sha256s(m[1]), now()).first();
}

/* ---------- النوعُ من التوقيع لا من الترويسة ---------- */
function sniff(u8) {
  const b = u8;
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'image/gif';
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
      && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'image/webp';
  return null;                    /* SVG لا يُقبل: نصٌّ يُنفَّذ لا صورةٌ تُعرض */
}

/* ---------- والبِتاتُ تعود مصفوفةَ أرقامٍ لا بِتات ----------
   ‎D1‎ تُخزّن ‎BLOB‎ صحيحًا (قِيس: ‎TYPEOF=blob‎ و‎LENGTH=15079‎) لكنّها تردّه إلى
   جافاسكربت **مصفوفةَ أرقام**. و‎new Response(array)‎ متنُه خاوٍ — بلا خطأٍ ولا
   صياح: ترويسةٌ صحيحةٌ وصفرُ بايت. فيُحوَّل صراحةً.
   ويُقبل الشكلان: مصفوفةً كما تردّ ‎D1‎، أو ‎ArrayBuffer‎ كما يردّ ‎R2‎ غدًا. */
function asBytes(v) {
  if (!v) return new Uint8Array(0);
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (ArrayBuffer.isView(v)) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  if (Array.isArray(v)) return Uint8Array.from(v);
  return new Uint8Array(0);
}

/* ---------- موضعُ البِتات: هنا وحدَه يُعرف ---------- */
const mediaGet = (db, k) => db.prepare('SELECT mime, bytes FROM media WHERE k = ?').bind(k).first();
const mediaPut = (db, k, mime, u8, uid) =>
  db.prepare('INSERT INTO media (k, mime, size, bytes, uid, ts) VALUES (?,?,?,?,?,?)')
    .bind(k, mime, u8.length, u8.buffer, uid, now()).run();

export async function onRequest({ request, env, params }) {
  const seg = (Array.isArray(params.path) ? params.path : [params.path || '']).filter(Boolean);

  try {
    /* ---------- تقديم ---------- */
    if (request.method === 'GET') {
      const k = (seg[0] || '').toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(k)) return J({ error: 'key' }, 400);
      const row = await mediaGet(db, k);
      if (!row) return J({ error: 'gone' }, 404);
      return new Response(asBytes(row.bytes), {
        headers: {
          'content-type': row.mime,
          /* أبديّ: المفتاحُ هو المحتوى، فلا يتبدّل تحته شيء */
          'cache-control': 'public, max-age=31536000, immutable',
          'x-content-type-options': 'nosniff',
        },
      });
    }

    if (request.method !== 'POST') return J({ error: 'method' }, 405);

    /* ---------- رفع ---------- */
    const s = await session(db, request);
    if (!s) return J({ error: 'auth' }, 401);

    const buf = await request.arrayBuffer();
    if (!buf || !buf.byteLength) return J({ error: 'empty' }, 400);
    if (buf.byteLength > MAX) return J({ error: 'too-big', max: MAX, got: buf.byteLength }, 413);

    const u8 = new Uint8Array(buf);
    const mime = sniff(u8);
    if (!mime) return J({ error: 'type' }, 415);

    /* ===== حصّةُ اليوم =====
       حدُّ الوسيط يمنع **السرعة**، وهذا يمنع **التراكم**: من رفع ستّين صورةً
       في الساعة ستَّ عشرةَ ساعةً بلغ ألفًا. فيُسأل: كم رفعتَ منذ يومٍ؟
       والعدُّ من ‎media‎ نفسِه (‎uid‎ و‎ts‎) فلا جدولَ ثالثَ يُصان.
       ولا يُحاسَب على ما رُفع قبله: المعنونُ بالمحتوى يُخزَّن مرّةً، ورافعُه
       الثاني لا يزيد بايتًا — فلا يُعدّ عليه. */
    const DAY = 86400, Q_N = 300, Q_B = 60 * 1024 * 1024;
    const q = await db.prepare(
      'SELECT COUNT(*) n, COALESCE(SUM(size),0) b FROM media WHERE uid = ? AND ts > ?')
      .bind(s.uid, now() - DAY).first();
    if (q && ((q.n | 0) >= Q_N || (q.b | 0) >= Q_B)) {
      return J({ error: 'quota', perDay: Q_N, bytesPerDay: Q_B }, 429);
    }

    const k = await sha256(buf);
    const had = await db.prepare('SELECT k FROM media WHERE k = ?').bind(k).first();
    if (!had) await mediaPut(db, k, mime, u8, s.uid);
    return J({ k, url: '/api/media/' + k, mime, size: buf.byteLength, fresh: !had });
  } catch (e) {
    console.error('media:', e && e.message);
    return J({ error: 'server' }, 500);
  }
}
