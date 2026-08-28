/* ============================================================
   ‎/api/admin/*‎ — الإشراف (تركب على لوحة الأدمن القائمة)
   ============================================================
     GET    /api/admin/overview          ⇐ أرقامُ الموقع
     GET    /api/admin/posts?q=&limit=   ⇐ المنشوراتُ كلُّها مع أصحابها
     GET    /api/admin/users             ⇐ الحسابات
     DELETE /api/admin/post?id=…         ⇐ يمحو أيَّ مساهمة
     POST   /api/admin/ban   {uid, on}   ⇐ يمنع حسابًا أو يرفع المنع
     DELETE /api/admin/media?k=…         ⇐ يمحو صورةً من المستودع

   ===== والصلاحيةُ تُمنح بيدٍ ولا تُطلب =====
   لا نقطةَ ههنا تجعل أحدًا مشرفًا، ولا أوّلَ مسجِّلٍ يرثها — ذاك سباقٌ يكسبه
   الغريبُ إن سبق. تُكتب على القاعدة بأمرٍ من صاحب الموقع، وهذا وحدَه بابُها.

   ===== والمنعُ لا يمحو =====
   ‎ban‎ يقطع الكتابةَ ويُبقي ما كُتب. والمحوُ فعلٌ ثانٍ يُقصد بعينه — فلا
   يذهب عملُ إنسانٍ في ضغطةٍ واحدةٍ على غضب.

   ===== ولا يُمحى ما لا يُرى =====
   كلُّ محوٍ يردّ ما مُحي (‎removed‎)، فيُعرف أوقع الفعلُ أم أصاب لا شيء. */

const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

/* لا يمرّ إلّا صاحبُ الموقع */
async function boss(db, req) {
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([^;]+)/);
  if (!m) return null;
  const r = await db.prepare(
    `SELECT u.id, u.name, u.admin FROM sessions s JOIN users u ON u.id = s.uid
      WHERE s.th = ? AND s.expires > ?`).bind(await sha256(m[1]), now()).first();
  return (r && r.admin) ? r : null;
}

export async function onRequest({ request, env, params }) {
  const db = env.DB;
  if (!db) return J({ error: 'no-db' }, 503);

  const who = await boss(db, request);
  /* و‎404‎ لا ‎403‎ لغير المشرف: ‎403‎ تُخبر الغريبَ أنّ ههنا بابًا */
  if (!who) return J({ error: 'not-found' }, 404);

  const seg = (Array.isArray(params.path) ? params.path : [params.path || '']).filter(Boolean);
  const path = seg.join('/');
  const url = new URL(request.url);
  const m = request.method;

  try {
    /* ---------- الأرقام ---------- */
    if (path === 'overview' && m === 'GET') {
      const q = s => db.prepare(s).first();
      const [u, p, l, md, se] = await Promise.all([
        q('SELECT COUNT(*) n, SUM(banned) b FROM users'),
        q('SELECT COUNT(*) n FROM posts'),
        q('SELECT COUNT(*) n FROM likes'),
        q('SELECT COUNT(*) n, COALESCE(SUM(size),0) b FROM media'),
        q('SELECT COUNT(*) n FROM sessions WHERE expires > ' + now()),
      ]);
      return J({
        me: { id: who.id, name: who.name },
        users: u.n | 0, banned: u.b | 0,
        posts: p.n | 0, likes: l.n | 0,
        media: md.n | 0, mediaBytes: md.b | 0,
        sessions: se.n | 0,
      });
    }

    /* ---------- المنشورات ---------- */
    if (path === 'posts' && m === 'GET') {
      const lim = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '60', 10)));
      const rs = await db.prepare(
        `SELECT p.id, p.code, p.sec, p.ts, p.updated, LENGTH(p.data) size,
                u.id uid, u.name, u.banned,
                (SELECT COUNT(*) FROM likes l WHERE l.pid = p.id) likes
           FROM posts p JOIN users u ON u.id = p.uid
          ORDER BY p.updated DESC LIMIT ?`).bind(lim).all();
      return J({ posts: rs.results || [] });
    }

    /* ---------- الحسابات ---------- */
    if (path === 'users' && m === 'GET') {
      const rs = await db.prepare(
        `SELECT id, email, name, admin, banned, created, seen,
                (SELECT COUNT(*) FROM posts p WHERE p.uid = users.id) posts
           FROM users ORDER BY created DESC LIMIT 200`).all();
      return J({ users: rs.results || [] });
    }

    /* ---------- محوُ مساهمة ---------- */
    if (path === 'post' && m === 'DELETE') {
      const id = (url.searchParams.get('id') || '').trim();
      if (!id) return J({ error: 'id' }, 400);
      const r = await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
      return J({ ok: true, removed: (r.meta && r.meta.changes) || 0 });
    }

    /* ---------- محوُ صورة ---------- */
    if (path === 'media' && m === 'DELETE') {
      const k = (url.searchParams.get('k') || '').toLowerCase();
      if (!/^[a-f0-9]{64}$/.test(k)) return J({ error: 'key' }, 400);
      const r = await db.prepare('DELETE FROM media WHERE k = ?').bind(k).run();
      return J({ ok: true, removed: (r.meta && r.meta.changes) || 0 });
    }

    /* ---------- منعُ حسابٍ أو رفعُ المنع ---------- */
    if (path === 'ban' && m === 'POST') {
      let b = {};
      try { b = await request.json(); } catch (e) { return J({ error: 'body' }, 400); }
      const uid = String(b.uid || '').trim();
      const on = b.on ? 1 : 0;
      if (!uid) return J({ error: 'uid' }, 400);
      /* ولا يمنع المشرفُ نفسَه: بابٌ يُغلق على صاحبه لا يُفتح ثانيةً إلّا من القاعدة */
      if (uid === who.id) return J({ error: 'self' }, 409);
      const t = await db.prepare('SELECT admin FROM users WHERE id = ?').bind(uid).first();
      if (!t) return J({ error: 'gone' }, 404);
      if (t.admin) return J({ error: 'admin' }, 409);
      await db.prepare('UPDATE users SET banned = ? WHERE id = ?').bind(on, uid).run();
      /* ويُقطع ما هو قائمٌ من جلساته: منعٌ يبدأ بعد ستّين يومًا ليس منعًا */
      if (on) await db.prepare('DELETE FROM sessions WHERE uid = ?').bind(uid).run();
      return J({ ok: true, uid, banned: !!on });
    }

    return J({ error: 'not-found' }, 404);
  } catch (e) {
    console.error('admin:', path, e && e.message);
    return J({ error: 'server' }, 500);
  }
}
