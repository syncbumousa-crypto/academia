/* ============================================================
   ‎GET /api/catalog‎ — الكتالوج من الخادم (م٠ من ROADMAP-SERVER)
   ============================================================
   أوّلُ خيطٍ يصل الموقعَ بخادم. وعمدًا **قراءةٌ لا كتابة، وبلا توثيق**: لا يكتب
   أحدٌ بعدُ، فلا كاتبَ يُوثَق به. غرضُها اختبارُ العُدّة كلِّها — القاعدةُ والربطُ
   والنشرُ والقراءةُ من الموقع — بلا خطرٍ على بيانِ أحد.

   ===== والصيغةُ صيغةُ الدرج نفسِها =====
   ‎{ v, tags, courses }‎ كما تكتبها لوحةُ الأدمن في ‎academia2:catalog:v1‎. فلا
   يتعلّم الموقعُ شكلًا ثانيًا، ولا يُكتب مترجمٌ بين اثنين — تُبدَّل **مصدرُ** القراءة
   وحدَه (‎CAT‎ في ‎app.js‎)، وما بُني عليها لا يُمسّ.

   ===== والوسومُ تُجمع في استعلامٍ واحد =====
   لا استعلامَ لكلّ مادّة (مئةٌ وثمانيةُ ذهابٍ وإياب)، بل جدولان يُقرآن ثمّ يُوصلان
   في الذاكرة. ‎D1‎ يُحاسب على الصفوف المقروءة، والرحلةُ الواحدة أرخصُ من مئة.

   ===== والخطأُ لا يُسكت عنه ولا يُفشي =====
   إن سقط الاستعلامُ رُدّ ‎503‎ ونصٌّ عامّ — والتفصيلُ في سجلّ الخادم. والموقعُ
   يقرأ الرمزَ فيسقط إلى كتالوج الدرج ولا يقف. */

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  /* دقيقةٌ في متصفّح القارئ، وخمسٌ في حافّة كلاودفلير مع السماح بالقديم ساعةً
     بينما يُجدَّد في الخلفية: الكتالوجُ يتبدّل مرّاتٍ في الفصل، لا مرّاتٍ في الدقيقة */
  'cache-control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
};

/* ============================================================
   ‎PUT /api/catalog‎ — يَنشر الكتالوج (صاحبُ الموقع وحدَه)
   ============================================================
   ولوحةُ الأدمن تكتب في درجها أوّلًا كما كانت، ثمّ **تنشر بضغطةٍ صريحة**.
   ولا يُدفع مع كلّ تعديل: الكتالوجُ ما يراه الناسُ كلُّهم، وحرفٌ يُكتب سهوًا
   يبلغهم في الحال. فالنشرُ قرارٌ كالنشر في الموقع سواءً بسواء.

   ===== ويُكتب دفعةً واحدة =====
   ‎batch‎ يجعل المحوَ والكتابةَ صفقةً: فلا تقع لحظةٌ يكون فيها الكتالوجُ
   نصفَ ممحوٍّ ونصفَ مكتوب — وهي لحظةٌ يقرأ فيها قارئٌ موقعًا بلا مواد.

   ===== والنسخةُ تُزاد فيعرف الموقعُ أنّ عليه أن يقرأ =====
   ‎catalog_rev‎ هو ما يقارنه ‎catSync‎ في المتصفّح. فلولا زيادتُه لَبقي الناسُ
   على القديم حتى يُفرَّغ خبءُ متصفّحهم. */
async function boss(db, req) {
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([^;]+)/);
  if (!m) return null;
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(m[1]));
  const th = [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
  const r = await db.prepare(
    `SELECT u.id, u.admin FROM sessions s JOIN users u ON u.id = s.uid
      WHERE s.th = ? AND s.expires > ?`).bind(th, Math.floor(Date.now() / 1000)).first();
  return (r && r.admin) ? r : null;
}

export async function onRequestPut({ request, env }) {
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'no-db' }), { status: 503, headers: JSON_HEADERS });
  const J = (o, s) => new Response(JSON.stringify(o), {
    status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
  /* ‎404‎ لغير المشرف — كما في ‎/api/admin‎: لا يُعلَن عن بابٍ لا يُفتح */
  if (!await boss(db, request)) return J({ error: 'not-found' }, 404);

  let b = {};
  try { b = await request.json(); } catch (e) { return J({ error: 'body' }, 400); }
  const tags = Array.isArray(b.tags) ? b.tags : [];
  const courses = Array.isArray(b.courses) ? b.courses : [];
  /* ولا يُقبل كتالوجٌ خاوٍ: خطأٌ في اللوحة يمحو مواد الناس كلَّها بضغطة */
  if (!courses.length) return J({ error: 'empty' }, 400);
  if (courses.length > 2000 || tags.length > 200) return J({ error: 'too-many' }, 413);

  const seen = new Set();
  const rows = [];
  for (const c of courses) {
    const code = String((c && c.code) || '').trim();
    if (!code || code.length > 40 || seen.has(code)) continue;   /* المكرّرُ يُترك لا يُرفض */
    seen.add(code);
    rows.push({
      code,
      ar: String(c.ar || '').slice(0, 120),
      full: String(c.full || '').slice(0, 200),
      h: Math.max(0, Math.min(30, parseInt(c.h, 10) || 0)),
      lab: c.lab ? 1 : 0,
      tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
    });
  }
  if (!rows.length) return J({ error: 'empty' }, 400);

  const tagIds = new Set();
  const tagRows = [];
  tags.forEach((t, i) => {
    const id = String((t && t.id) || '').trim();
    if (!id || id.length > 40 || tagIds.has(id)) return;
    tagIds.add(id);
    tagRows.push([id, String(t.ar || '').slice(0, 80), String(t.en || '').slice(0, 80), i]);
  });

  const rev = String(b.v || Date.now());
  const st = [];
  st.push(db.prepare('DELETE FROM course_tags'));
  st.push(db.prepare('DELETE FROM courses'));
  st.push(db.prepare('DELETE FROM tags'));
  tagRows.forEach(t => st.push(
    db.prepare('INSERT INTO tags (id, ar, en, ord) VALUES (?,?,?,?)').bind(...t)));
  rows.forEach(r => st.push(
    db.prepare('INSERT INTO courses (code, ar, full, h, lab) VALUES (?,?,?,?,?)')
      .bind(r.code, r.ar, r.full, r.h, r.lab)));
  let links = 0;
  rows.forEach(r => r.tags.forEach(tg => {
    if (!tagIds.has(tg)) return;                 /* وسمٌ لا تعريفَ له يُترك */
    links++;
    st.push(db.prepare('INSERT INTO course_tags (code, tag_id) VALUES (?,?)').bind(r.code, tg));
  }));
  st.push(db.prepare("UPDATE meta SET v = ? WHERE k = 'catalog_rev'").bind(rev));

  await db.batch(st);
  return J({ ok: true, courses: rows.length, tags: tagRows.length, links, v: rev });
}

export async function onRequestGet({ env }) {
  const db = env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'no-db' }), { status: 503, headers: JSON_HEADERS });
  }
  try {
    const [cs, tg, mt] = await Promise.all([
      db.prepare('SELECT code, ar, full, h, lab FROM courses ORDER BY code').all(),
      db.prepare('SELECT id, ar, en FROM tags ORDER BY ord, id').all(),
      db.prepare("SELECT v FROM meta WHERE k = 'catalog_rev'").first(),
    ]);
    /* والوصلُ يُقرأ مرّةً ويُوزَّع — لا استعلامَ لكلّ مادّة */
    const link = await db.prepare('SELECT code, tag_id FROM course_tags').all();
    const byCode = new Map();
    for (const r of (link.results || [])) {
      if (!byCode.has(r.code)) byCode.set(r.code, []);
      byCode.get(r.code).push(r.tag_id);
    }

    const body = {
      v: (mt && mt.v) || '0',
      tags: (tg.results || []).map(t => ({ id: t.id, ar: t.ar, en: t.en || '' })),
      courses: (cs.results || []).map(c => ({
        code: c.code,
        ar: c.ar,
        full: c.full || '',
        h: c.h | 0,
        lab: !!c.lab,                 /* سِكوَيْل يردّ 0/1 والموقعُ ينتظر بولين */
        tags: byCode.get(c.code) || [],
      })),
    };
    return new Response(JSON.stringify(body), { headers: JSON_HEADERS });
  } catch (e) {
    console.error('catalog:', e && e.message);
    return new Response(JSON.stringify({ error: 'query-failed' }), { status: 503, headers: JSON_HEADERS });
  }
}
