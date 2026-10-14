/* منقولة من ‎functions/api/comments/[[path]].js‎ — والفرق سطران:
   ‎env.DB‎ صار الجسر، وفحص «لا قاعدة» ذهب لان الجسر يصيح بنفسه.
   وما عداهما حرف بحرف. */
import { db } from '../_db.js';

/* ============================================================
   ‎/api/comments‎ — كلامُ القرّاء على مساهمات غيرهم (م٣ب)
   ============================================================
     GET    /api/comments?pid=…   ⇐ تعليقاتُ مساهمةٍ كلُّها (للجميع، بلا جلسة)
     POST   /api/comments         ⇐ يكتب  {pid, nid, face?, parent?, txt}
     DELETE /api/comments?id=…    ⇐ يمحو تعليقَه (والمشرفُ يمحو أيَّ تعليق)

   ===== ولمَ جدولٌ مستقلّ؟ =====
   التعليقُ يسكن عقدةَ البطاقة داخل **متن مساهمة صاحبها**، والقارئُ لا يملك أن
   يكتب في متن غيره. فلو كُتب حيث يُعرض لَاحتاج القارئُ صلاحيةَ الكتابة في
   مساهمةٍ ليست له — وذاك بابٌ لا يُفتح. فيسكن جدولَه ويُدمَج عند العرض.

   ===== والمساهمةُ تُقرأ مرّةً لا لكلّ عقدة =====
   رزمةٌ فيها مئةُ بطاقةٍ لا تُسأل مئةَ مرّة: تُقرأ تعليقاتُ المساهمة كلِّها في
   استعلامٍ واحد، ويُوزَّع في المتصفّح على عقدها.

   ===== ولا يُصدَّق ما يُرسَل =====
   ‎uid‎ من الجلسة، و‎me‎ يُحسب عند العميل، و‎lk‎ لا يُقبل. والمساهمةُ يُتحقّق من
   وجودها: تعليقٌ على مساهمةٍ مُحيت لا يُكتب فيبقى يتيمًا. */

const J = (o, s = 200, extra = {}) => new Response(JSON.stringify(o), {
  status: s,
  headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, extra),
});

const MAX_TXT = 2000;
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
const SID = req => ((req.headers.get('cookie') || '').match(
  req.headers.get('x-as') === 'site' ? /(?:^|;\s*)asid=([^;]+)/ : /(?:^|;\s*)sid=([^;]+)/) || [])[1] || '';
async function session(db, req) {
  const m = [null, SID(req)];
  if (!m[1]) return null;
  return await db.prepare(
    `SELECT u.id uid, u.admin FROM sessions s JOIN users u ON u.id = s.uid
      WHERE s.th = ? AND s.expires > ?`).bind(await sha256(m[1]), now()).first();
}

export async function onRequest({ request, env, params }) {
  const url = new URL(request.url);
  const m = request.method;
  /* ‎/api/comments‎ للكلام، و‎/api/comments/like‎ لإعجابه — ملفٌّ ملتقِطٌ واحد */
  const path = (Array.isArray(params.path) ? params.path : [params.path || '']).filter(Boolean).join('/');

  try {
    /* ---------- قراءة ---------- */
    if (m === 'GET') {
      const pid = (url.searchParams.get('pid') || '').trim();
      if (!pid) return J({ error: 'pid' }, 400);
      /* والعدُّ يُجمع في الاستعلام نفسِه لا في رحلةٍ ثانية — ومن كان له جلسةٌ
         عرف أيَّها أعجب (‎mine‎)، ومن لا جلسةَ له فالعدُّ وحدَه */
      const me = await session(db, request);
      const uid = me ? me.uid : '';
      const rs = await db.prepare(
        `SELECT c.id, c.nid, c.parent, c.uid, c.face, c.txt, c.ts, u.name, u.img,
                (SELECT COUNT(*) FROM cmt_likes l WHERE l.cid = c.id) lk,
                (SELECT COUNT(*) FROM cmt_likes l WHERE l.cid = c.id AND l.uid = ?) mine
           FROM comments c JOIN users u ON u.id = c.uid
          WHERE c.pid = ? ORDER BY c.ts`).bind(uid, pid).all();
      return J({ pid, comments: rs.results || [] }, 200, {
        /* ولا خبءٌ مشترك: الكلامُ يتبدّل، والقارئُ يريد ما كُتب الآن */
        'cache-control': 'private, max-age=5',
      });
    }

    const s = await session(db, request);
    if (!s) return J({ error: 'auth' }, 401);

    /* ---------- إعجابُ تعليق ----------
       ‎POST /api/comments/like‎  {id}  ⇐ يقلب حالي عليه ويردّ العدَّ بعده
       وقلبٌ لا فعلان — كإعجاب المساهمات: العميلُ قد يكون حالُه قديمًا فيطلب ما
       هو واقعٌ أصلًا، والقلبُ يصحّ مهما ظنّ.
       ولا يُعجب أحدٌ بكلام نفسِه. */
    if (path === 'like' && m === 'POST') {
      let b = {};
      try { b = await request.json(); } catch (e) { return J({ error: 'body' }, 400); }
      const cid = String(b.id || '').trim();
      if (!cid) return J({ error: 'id' }, 400);
      const c = await db.prepare('SELECT uid FROM comments WHERE id = ?').bind(cid).first();
      if (!c) return J({ error: 'gone' }, 404);
      if (c.uid === s.uid) return J({ error: 'self' }, 409);

      const had = await db.prepare('SELECT 1 FROM cmt_likes WHERE cid = ? AND uid = ?')
        .bind(cid, s.uid).first();
      if (had) await db.prepare('DELETE FROM cmt_likes WHERE cid = ? AND uid = ?').bind(cid, s.uid).run();
      else await db.prepare('INSERT INTO cmt_likes (cid, uid, ts) VALUES (?,?,?)').bind(cid, s.uid, now()).run();
      const n = await db.prepare('SELECT COUNT(*) n FROM cmt_likes WHERE cid = ?').bind(cid).first();
      return J({ id: cid, lk: (n && n.n) || 0, liked: !had });
    }

    /* ---------- محو ---------- */
    if (m === 'DELETE') {
      const id = (url.searchParams.get('id') || '').trim();
      if (!id) return J({ error: 'id' }, 400);
      /* والمشرفُ يمحو أيَّ تعليق، وسواه تعليقَه وحدَه — والشرطُ في جملة الحذف */
      const r = s.admin
        ? await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run()
        : await db.prepare('DELETE FROM comments WHERE id = ? AND uid = ?').bind(id, s.uid).run();
      /* وردودُه تذهب معه: خيطٌ بلا رأسٍ لا يُعرض ولا يُحذف */
      if (r.meta && r.meta.changes) {
        await db.prepare('DELETE FROM comments WHERE parent = ?').bind(id).run();
      }
      return J({ ok: true, removed: (r.meta && r.meta.changes) || 0 });
    }

    /* ---------- كتابة ---------- */
    if (m === 'POST') {
      let b = {};
      try { b = await request.json(); } catch (e) { return J({ error: 'body' }, 400); }
      const id = String(b.id || '').trim();
      const pid = String(b.pid || '').trim();
      const nid = String(b.nid || '').trim();
      const txt = String(b.txt || '').trim().slice(0, MAX_TXT);
      const face = Math.max(1, Math.min(99, parseInt(b.face, 10) || 1));
      const parent = b.parent ? String(b.parent).trim() : null;
      if (!id || id.length > 64) return J({ error: 'id' }, 400);
      if (!pid || !nid) return J({ error: 'ref' }, 400);
      if (!txt) return J({ error: 'empty' }, 400);

      /* والمساهمةُ يُتحقّق من وجودها: كلامٌ على ما مُحي يبقى يتيمًا لا يُعرض */
      const post = await db.prepare('SELECT id FROM posts WHERE id = ?').bind(pid).first();
      if (!post) return J({ error: 'gone' }, 404);
      if (parent) {
        const p = await db.prepare('SELECT id FROM comments WHERE id = ? AND pid = ?')
          .bind(parent, pid).first();
        if (!p) return J({ error: 'parent' }, 404);
      }

      await db.prepare(
        `INSERT INTO comments (id, pid, nid, parent, uid, face, txt, ts) VALUES (?,?,?,?,?,?,?,?)
           ON CONFLICT(id) DO NOTHING`)
        .bind(id, pid, nid, parent, s.uid, face, txt, now()).run();
      const me = await db.prepare('SELECT name, img FROM users WHERE id = ?').bind(s.uid).first();
      return J({ ok: true, id, uid: s.uid, ts: now(), name: (me && me.name) || '', img: (me && me.img) || '' });
    }

    return J({ error: 'method' }, 405);
  } catch (e) {
    console.error('comments:', m, e && e.message);
    return J({ error: 'server' }, 500);
  }
}
