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

async function session(db, req) {
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([^;]+)/);
  if (!m) return null;
  return await db.prepare(
    `SELECT u.id uid, u.admin FROM sessions s JOIN users u ON u.id = s.uid
      WHERE s.th = ? AND s.expires > ?`).bind(await sha256(m[1]), now()).first();
}

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return J({ error: 'no-db' }, 503);
  const url = new URL(request.url);
  const m = request.method;

  try {
    /* ---------- قراءة ---------- */
    if (m === 'GET') {
      const pid = (url.searchParams.get('pid') || '').trim();
      if (!pid) return J({ error: 'pid' }, 400);
      const rs = await db.prepare(
        `SELECT c.id, c.nid, c.parent, c.uid, c.face, c.txt, c.ts, u.name, u.img
           FROM comments c JOIN users u ON u.id = c.uid
          WHERE c.pid = ? ORDER BY c.ts`).bind(pid).all();
      return J({ pid, comments: rs.results || [] }, 200, {
        /* ولا خبءٌ مشترك: الكلامُ يتبدّل، والقارئُ يريد ما كُتب الآن */
        'cache-control': 'private, max-age=5',
      });
    }

    const s = await session(db, request);
    if (!s) return J({ error: 'auth' }, 401);

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
