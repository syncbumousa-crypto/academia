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
