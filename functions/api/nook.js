/* ============================================================
   ‎/api/nook‎ — نواةُ الركن في حسابك (م٢)
   ============================================================
     GET  /api/nook            ⇐ نواتي كما على الخادم  {data, rev, updated}
     PUT  /api/nook  {data}    ⇐ تكتبها وتزيد ‎rev‎

   ===== ولا نواةَ لزائر =====
   هذي حالُ صاحبها لا محتوًى يُتصفَّح، فلا قراءةَ بلا جلسة. و‎uid‎ من الجلسة
   لا من المتن — كما في كلّ نقطةٍ في هذا الخادم.

   ===== والخادمُ يحفظ ولا يفسّر =====
   المتنُ ‎JSON‎ خامٌ كما يرسله العميل. يُفحص أنّه كائنٌ صالحٌ وأنّه دون الحدّ،
   ولا يُفحص شكلُه: النواةُ تنمو في العميل، ولو فُسّرت ههنا لاحتاج كلُّ حقلٍ
   جديدٍ هجرةً في القاعدة.

   ===== والدمجُ في العميل لا ههنا =====
   قاعدةُ «الأحدثُ يعلو، والحذفُ صريحٌ لا استنتاج» تحتاج أن تُقابَل نسختان
   وتُقرأ شواهدُ كلٍّ منهما (‎termAt‎ و‎termsGone‎). وذاك عملُ العميل: هو الذي
   يملك الحاضرَ ويعرف ما فعل صاحبُه. فالخادمُ صندوقٌ أمينٌ لا حَكَم.

   ===== ولا تُكتب نواةٌ خاوية =====
   حارسُ العميل يمنع محوَ الأترام في الدرج، وههنا مثلُه: صفٌّ فيه أترامٌ لا
   يُكتب فوقه صفٌّ بلا أترام. فلو أفلت من الحارس الأوّلِ خطأٌ، وقف عند الثاني —
   والنسخةُ البعيدةُ هي آخرُ ما يبقى. */

const J = (o, status = 200) => new Response(JSON.stringify(o), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

/* حدُّ النواة: أترامٌ ومكتبةٌ وتواريخُ ودرجات — كيلوباتاتٌ لا ميجا. ومئتان
   سعةٌ واسعةٌ لعشرات الأترام، وسقفٌ يمنع أن يُدسّ فيها متنٌ ثقيلٌ يومًا. */
const MAX_DATA = 200 * 1024;

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

async function session(db, req) {
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([^;]+)/);
  if (!m) return null;
  return await db.prepare(
    'SELECT uid FROM sessions WHERE th = ? AND expires > ?').bind(await sha256(m[1]), now()).first();
}

const nTerms = v => (v && Array.isArray(v.terms)) ? v.terms.length : 0;

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return J({ error: 'no-db' }, 503);
  const m = request.method;

  try {
    const s = await session(db, request);
    if (!s) return J({ error: 'auth' }, 401);

    if (m === 'GET') {
      const r = await db.prepare('SELECT data, rev, updated FROM nook WHERE uid = ?')
        .bind(s.uid).first();
      if (!r) return J({ data: null, rev: 0, updated: 0 });
      let data = null;
      try { data = JSON.parse(r.data); } catch (e) { /* صفٌّ تالف: يُردّ خاويًا ولا يُسقط الطلب */ }
      return J({ data, rev: r.rev | 0, updated: r.updated | 0 });
    }

    if (m === 'PUT' || m === 'POST') {
      let b = {};
      try { b = await request.json(); } catch (e) { return J({ error: 'body' }, 400); }
      const d = b.data;
      if (!d || typeof d !== 'object' || Array.isArray(d)) return J({ error: 'data' }, 400);
      const txt = JSON.stringify(d);
      if (txt.length > MAX_DATA) return J({ error: 'too-big', max: MAX_DATA, got: txt.length }, 413);

      /* ولا يُكتب خواءٌ فوق عمل — إلّا أن يقول صاحبُه إنّه يقصد (‎force‎) */
      const cur = await db.prepare('SELECT data, rev FROM nook WHERE uid = ?').bind(s.uid).first();
      if (cur && !b.force) {
        let old = null;
        try { old = JSON.parse(cur.data); } catch (e) { old = null; }
        if (nTerms(old) && !nTerms(d)) return J({ error: 'would-wipe', had: nTerms(old) }, 409);
      }

      const rev = (cur ? (cur.rev | 0) : 0) + 1;
      await db.prepare(
        `INSERT INTO nook (uid, data, rev, updated) VALUES (?,?,?,?)
           ON CONFLICT(uid) DO UPDATE SET data = excluded.data, rev = excluded.rev,
                                          updated = excluded.updated`)
        .bind(s.uid, txt, rev, now()).run();
      return J({ ok: true, rev, updated: now() });
    }

    return J({ error: 'method' }, 405);
  } catch (e) {
    console.error('nook:', m, e && e.message);
    return J({ error: 'server' }, 500);
  }
}
