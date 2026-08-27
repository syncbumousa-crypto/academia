/* ============================================================
   ‎/api/posts‎ — المساهماتُ المنشورة (م٢ من ROADMAP-SERVER)
   ============================================================
     GET    /api/posts?code=MIS%20301   ⇐ منشوراتُ هذه المادّة (للجميع، بلا جلسة)
     PUT    /api/posts                  ⇐ يَنشُر مساهمتي أو يُحدّثها  {id,code,sec,data}
     DELETE /api/posts?id=…             ⇐ يسحب مساهمتي من النشر

   ===== ولا يُوثَق بشيءٍ ورد =====
   · ‎uid‎ **لا يُقرأ من المتن أبدًا** — يُؤخذ من الجلسة. ولو أُخذ من المتن لَنشر
     كلُّ أحدٍ باسم من شاء.
   · ‎likes‎ و‎me‎ و‎seeded‎ وما شابه: لا تُقبل ولا تُخزَّن. العدّاداتُ تُبنى على
     الخادم في م٣، وما يرسله العميلُ منها زخرفٌ لا حجّة.
   · و‎data‎ يُفحص حجمًا لا شكلًا (انظر ‎schema-posts.sql‎).

   ===== والقراءةُ مفتوحةٌ بلا جلسة =====
   الزائرُ يتصفّح ويذاكر — وهو عهدٌ في الموقع منذ بُنيت بوابةُ الأعضاء. فالقراءةُ
   لا تسأل عن أحد، والكتابةُ وحدَها تسأل. */

const J = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), {
  status,
  headers: Object.assign({ 'content-type': 'application/json; charset=utf-8' }, extra),
});

/* حدُّ المتن: ‎D1‎ يضيق بالصفوف الضخمة، ورزمةُ بطائقَ كبيرةٍ قد تتجاوزه. فيُقال
   للمستخدم «كبيرةٌ على النشر» صراحةً — لا تُقطع ولا تُبتر ولا تسقط في صمت.
   والحلُّ الحقيقيُّ في م٤: الصورُ إلى R2 فيخفّ المتن. */
const MAX_DATA = 400 * 1024;
const SECS = new Set(['info', 'doc', 'grade', 'abs', 'srcU', 'srcP', 'lessons', 'videos', 'cards']);

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);

async function sha256(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }

async function session(db, req) {
  const h = req.headers.get('cookie') || '';
  const m = h.match(/(?:^|;\s*)sid=([^;]+)/);
  if (!m) return null;
  return await db.prepare(
    'SELECT uid FROM sessions WHERE th = ? AND expires > ?').bind(await sha256(m[1]), now()).first();
}

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return J({ error: 'no-db' }, 503);
  const url = new URL(request.url);
  const m = request.method;

  try {
    /* ---------- قراءة: منشوراتُ مادّة ---------- */
    if (m === 'GET') {
      const code = (url.searchParams.get('code') || '').trim();
      if (!code) return J({ error: 'code' }, 400);
      /* والعدُّ يُجمع في الاستعلام نفسِه لا في رحلةٍ ثانية — ومن كان له جلسةٌ
         عرف أيَّها أعجبَ (‎mine‎)، ومن لا جلسةَ له فالعدُّ وحدَه */
      const me = await session(db, request);
      const uid = me ? me.uid : '';
      const rs = await db.prepare(
        `SELECT p.id, p.uid, p.sec, p.data, p.ts, u.name, u.img,
                (SELECT COUNT(*) FROM likes l WHERE l.pid = p.id) likes,
                (SELECT COUNT(*) FROM likes l WHERE l.pid = p.id AND l.uid = ?) mine
           FROM posts p JOIN users u ON u.id = p.uid
          WHERE p.code = ? ORDER BY p.ts`).bind(uid, code).all();
      const posts = (rs.results || []).map(r => {
        let data = null;
        try { data = JSON.parse(r.data); } catch (e) { /* صفٌّ تالف: يُترك بمتنٍ خاوٍ */ }
        return { id: r.id, uid: r.uid, sec: r.sec, ts: r.ts,
                 likes: r.likes | 0, liked: !!r.mine,
                 u: { name: r.name || '', img: r.img || '' }, data: data };
      }).filter(p => p.data);
      return J({ code, posts }, 200, {
        /* ولا خبءٌ مشترك: الردُّ صار يحمل ‎liked‎ — وهو خبرٌ عن **هذا** القارئ.
           فخبءُ الحافّة يُعطي جوابَ أوّلِ سائلٍ لمن بعده، فيرى إعجابَ غيره إعجابَه.
           ‎private‎ يقصره على متصفّح صاحبه، والثوانيُ العشرُ تكفي لكبح التكرار */
        'cache-control': 'private, max-age=10',
      });
    }

    /* ---------- ما بعدها يحتاج جلسة ---------- */
    const s = await session(db, request);
    if (!s) return J({ error: 'auth' }, 401);

    /* ---------- سحبٌ من النشر ---------- */
    if (m === 'DELETE') {
      const id = (url.searchParams.get('id') || '').trim();
      if (!id) return J({ error: 'id' }, 400);
      /* والشرطُ ‎uid‎ في الحذف نفسِه لا في فحصٍ قبله: لا فجوةَ بين السؤال والفعل */
      const r = await db.prepare('DELETE FROM posts WHERE id = ? AND uid = ?').bind(id, s.uid).run();
      return J({ ok: true, removed: (r.meta && r.meta.changes) || 0 });
    }

    /* ---------- نشرٌ أو تحديث ---------- */
    if (m === 'PUT' || m === 'POST') {
      let b = {};
      try { b = await request.json(); } catch (e) { return J({ error: 'body' }, 400); }
      const id = String(b.id || '').trim();
      const code = String(b.code || '').trim();
      const sec = String(b.sec || '').trim();
      if (!id || id.length > 64) return J({ error: 'id' }, 400);
      if (!code || code.length > 40) return J({ error: 'code' }, 400);
      if (!SECS.has(sec)) return J({ error: 'sec' }, 400);
      if (b.data === undefined || b.data === null) return J({ error: 'data' }, 400);

      const data = JSON.stringify(b.data);
      if (data.length > MAX_DATA) return J({ error: 'too-big', max: MAX_DATA, got: data.length }, 413);

      /* ومعرّفٌ يملكه غيري لا يُكتب فوقه: ‎INSERT OR REPLACE‎ وحدَه يسمح بذلك،
         فيُفحص المالكُ أوّلًا ثمّ يُكتب بشرطه */
      const own = await db.prepare('SELECT uid FROM posts WHERE id = ?').bind(id).first();
      if (own && own.uid !== s.uid) return J({ error: 'not-yours' }, 403);

      const ts = Number(b.ts) || now();
      await db.prepare(
        `INSERT INTO posts (id, uid, code, sec, data, ts, updated) VALUES (?,?,?,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated = excluded.updated
           WHERE posts.uid = excluded.uid`)
        .bind(id, s.uid, code, sec, data, ts, now()).run();
      return J({ ok: true, id });
    }

    return J({ error: 'method' }, 405);
  } catch (e) {
    console.error('posts:', m, e && e.message);
    /* وقيدُ «واحدةٌ لكلّ بند» يقع خطأً في القاعدة — يُترجَم إلى ما يفهمه المستخدم */
    if (String(e && e.message).includes('UNIQUE')) return J({ error: 'duplicate' }, 409);
    return J({ error: 'server' }, 500);
  }
}
