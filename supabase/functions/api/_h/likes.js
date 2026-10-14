/* منقولة من ‎functions/api/likes/[[path]].js‎ — والفرق سطران:
   ‎env.DB‎ صار الجسر، وفحص «لا قاعدة» ذهب لان الجسر يصيح بنفسه.
   وما عداهما حرف بحرف. */
import { db } from '../_db.js';

/* ============================================================
   ‎POST /api/likes‎ — يُعجب أو يرجع (م٣أ من ROADMAP-SERVER)
   ============================================================
     POST /api/likes  {id}  ⇐ يقلب حالي على هذه المساهمة، ويردّ العدَّ بعده

   ===== وقلبٌ لا «أعجِب» و«ارجع» =====
   نقطةٌ واحدةٌ تقلب الحال، لا اثنتان. فلو كانتا اثنتين لَاحتاج العميلُ أن يعرف
   حالَه قبل أن يطلب، وحالُه قد يكون قديمًا (لسانان مفتوحان) — فيطلب «أعجِب» وهو
   معجَبٌ فيقع خطأٌ لا معنى له. والقلبُ يصحّ مهما كان ما يظنّه العميل.

   ===== ولا يُعجَب أحدٌ بنفسه =====
   ‎uid‎ من الجلسة، فإن كان صاحبَ المساهمة رُدَّ ‎409‎. والعدُّ الذي يُبنى عليه
   الترتيبُ لا يُزكّيه صاحبُه.

   ===== والعدُّ يُحسب ولا يُخزَّن =====
   ‎COUNT(*)‎ على الصفوف — انظر ‎schema-likes.sql‎: العدّادُ يكذب ولا يُصلَح،
   والصفوفُ لا تكذب. */

const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

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
    .bind(await sha256(m[1]), now()).first();
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return J({ error: 'method' }, 405);

  try {
    const s = await session(db, request);
    if (!s) return J({ error: 'auth' }, 401);

    let b = {};
    try { b = await request.json(); } catch (e) { return J({ error: 'body' }, 400); }
    const pid = String(b.id || '').trim();
    if (!pid) return J({ error: 'id' }, 400);

    const post = await db.prepare('SELECT uid FROM posts WHERE id = ?').bind(pid).first();
    if (!post) return J({ error: 'gone' }, 404);
    if (post.uid === s.uid) return J({ error: 'self' }, 409);

    const had = await db.prepare('SELECT 1 FROM likes WHERE pid = ? AND uid = ?')
      .bind(pid, s.uid).first();
    if (had) {
      await db.prepare('DELETE FROM likes WHERE pid = ? AND uid = ?').bind(pid, s.uid).run();
    } else {
      await db.prepare('INSERT INTO likes (pid, uid, ts) VALUES (?,?,?)').bind(pid, s.uid, now()).run();
    }
    const c = await db.prepare('SELECT COUNT(*) n FROM likes WHERE pid = ?').bind(pid).first();
    return J({ id: pid, likes: (c && c.n) || 0, liked: !had });
  } catch (e) {
    console.error('likes:', e && e.message);
    return J({ error: 'server' }, 500);
  }
}
