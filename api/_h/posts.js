/* منقولة من ‎functions/api/posts/[[path]].js‎ — والفرق سطران:
   ‎env.DB‎ صار الجسر، وفحص «لا قاعدة» ذهب لان الجسر يصيح بنفسه.
   وما عداهما حرف بحرف. */
import { db } from '../_db.js';

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
/* ‏‎drx‎: اقتراحُ دكتورٍ ليس في القائمة — يسافر مساهمةً كسائرها، فلا أنبوبَ ثانٍ */
const SECS = new Set(['info', 'doc', 'grade', 'abs', 'srcU', 'srcP', 'lessons', 'videos', 'cards', 'drx']);
/* ===== وحالُ النشر تُحفظ مع المساهمة =====
   «المتصفّحُ لا يخزّن شيئًا» يقتضي أن تسكن مسوّدتُك حسابَك كذلك. فتُرفع كلُّها
   بحالها، ولا يُقرأ منها لغير صاحبها إلّا المنشور. */
const STS = new Set(['pub', 'priv', 'unlist']);

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);

async function sha256(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }

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
    'SELECT uid FROM sessions WHERE th = ? AND expires > ?').bind(await sha256(m[1]), now()).first();
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const m = request.method;

  try {
    /* ---------- قراءة: منشوراتُ مادّة ---------- */
    if (m === 'GET') {
      /* ---------- «مساهماتي» ----------
         ‎GET /api/posts?mine=1‎ — ما نشرتَه في المواد كلِّها، لتراه وتسحبه من
         موضعٍ واحدٍ بلا أن تفتح كلَّ مادّةٍ تبحث فيها. والجدولُ مفهرسٌ بـ‎uid‎.
         ولا يُردّ المتنُ ههنا: قائمةُ عناوينَ لا محتوى — فرزمةٌ فيها ألفُ بطاقةٍ
         لا تُنقل لتُعرض في سطر. */
      const mine = url.searchParams.get('mine');
      if (mine) {
        const me = await session(db, request);
        if (!me) return J({ error: 'auth' }, 401);
        const rs = await db.prepare(
          `SELECT p.id, p.code, p.sec, p.ts, p.updated, LENGTH(p.data) size,
                  (SELECT COUNT(*) FROM likes l WHERE l.pid = p.id) likes,
                  (SELECT COUNT(*) FROM comments c WHERE c.pid = p.id) cmts
             FROM posts p WHERE p.uid = ? ORDER BY p.updated DESC`).bind(me.uid).all();
        return J({ posts: rs.results || [] }, 200, { 'cache-control': 'no-store' });
      }

      /* ---------- «الأغلفة كلُّها» ----------
         ‎GET /api/posts?covers=1‎ — كلُّ مساهمةٍ **مثبَّتةٍ** في بند «المادة» تحمل
         صورةَ كتاب، في المواد كلِّها، في رحلةٍ واحدة.

         ===== ولمَ صارت نقطةً؟ =====
         الغلافُ يُقرأ من الدرج، والدرجُ لا يعلم بما على الخادم إلّا حين تُفتح
         المادّةُ نفسُها (‎srvPull‎ لواحدةٍ لا لكلّ). والمكتبةُ تعرض ستّةً وستّين
         كتابًا دفعةً واحدة — فكانت تعرض **البذرةَ الساكنة** أبدًا: ما ثُبّت في
         اللوحة لا يظهر، وما سُحب تثبيتُه لا يذهب، حتّى تُفتح تلك المادّة بعينها.
         وستّةٌ وستّون طلبًا لا تُطلب. فرحلةٌ واحدةٌ تقول: هؤلاء لهم أغلفة.

         ولا متنَ كاملًا ههنا: العنوانُ وحدَه وما يلزم لعرضه. */
      if (url.searchParams.get('covers')) {
        const rs = await db.prepare(
          `SELECT p.id, p.uid, p.code, p.sec, p.ts, p.st, p.pin, p.data, u.name, u.img
             FROM posts p JOIN users u ON u.id = p.uid
            WHERE p.pin = 1 AND p.sec = 'info' AND p.st = 'pub'
            ORDER BY p.ts`).all();
        const covers = [];
        for (const r of (rs.results || [])) {
          let d = null;
          try { d = JSON.parse(r.data); } catch (e) { continue; }
          if (!d || !d.bookImg) continue;
          covers.push({ id: r.id, uid: r.uid, code: r.code, ts: r.ts, st: r.st || 'pub', pin: 1,
                        u: { name: r.name || '', img: r.img || '' },
                        data: { book: d.book || '', bookImg: d.bookImg } });
        }
        return J({ covers }, 200, { 'cache-control': 'private, max-age=10' });
      }

      /* ============================================================
         ‏‎?codes=a,b,c‎ — مادّةٌ واحدةٌ في الرحلة، أو ترمٌ كامل
         ============================================================
         كانت رحلةٌ لكلّ مادّة، ولا تبدأ إلّا حين تُفتح المادّة. والرحلةُ الواحدة
         قِيست: مئةٌ وستّون مللي شبكةً ومئتان وأربعون خادمًا — فمن فتح مادّةً
         انتظر أربعَ مئةٍ قبل أن يرى مساهماتِ غيره.
         فترمٌ من ستّ موادَّ = ستُّ رحلاتٍ متتابعةٍ على قدر ما يتنقّل. وهي رحلةٌ
         واحدةٌ ههنا: استعلامٌ واحدٌ بشرط ‎IN‎، وردٌّ مقسومٌ بالمادّة. فيُدفأ الترمُ
         كلُّه وهو يُفتح، ثمّ تُفتح كلُّ مادّةٍ فيه بلا انتظار.
         والحدُّ أربعون: ترمٌ لا يبلغها، وطلبٌ يبلغها ليس ترمًا. */
      const many = (url.searchParams.get('codes') || '').split(',')
        .map(x => x.trim()).filter(Boolean).slice(0, 40);
      if (many.length) {
        const me2 = await session(db, request);
        const uid2 = me2 ? me2.uid : '';
        const ph = many.map(() => '?').join(',');
        const rs2 = await db.prepare(
          `SELECT p.id, p.uid, p.code, p.sec, p.data, p.ts, p.st, p.pin, u.name, u.img,
                  (SELECT COUNT(*) FROM likes l WHERE l.pid = p.id) likes,
                  (SELECT COUNT(*) FROM likes l WHERE l.pid = p.id AND l.uid = ?) mine
             FROM posts p JOIN users u ON u.id = p.uid
            WHERE p.code IN (${ph}) AND (p.st = 'pub' OR p.uid = ?) ORDER BY p.ts`)
          .bind(uid2, ...many, uid2 || '-').all();
        const byCode = {};
        /* وكلُّ مادّةٍ سُئل عنها تُردّ ولو خاويةً: الخواءُ جوابٌ، وغيابُ المفتاح لا */
        many.forEach(c => { byCode[c] = []; });
        (rs2.results || []).forEach(r => {
          let data = null;
          try { data = JSON.parse(r.data); } catch (e) { return; }
          if (!data || !byCode[r.code]) return;
          byCode[r.code].push({ id: r.id, uid: r.uid, sec: r.sec, ts: r.ts,
            st: r.st || 'pub', pin: r.pin ? 1 : 0, likes: r.likes | 0, liked: !!r.mine,
            u: { name: r.name || '', img: r.img || '' }, data: data });
        });
        return J({ byCode }, 200, { 'cache-control': 'private, max-age=10' });
      }

      const code = (url.searchParams.get('code') || '').trim();
      if (!code) return J({ error: 'code' }, 400);
      /* والعدُّ يُجمع في الاستعلام نفسِه لا في رحلةٍ ثانية — ومن كان له جلسةٌ
         عرف أيَّها أعجبَ (‎mine‎)، ومن لا جلسةَ له فالعدُّ وحدَه */
      const me = await session(db, request);
      const uid = me ? me.uid : '';
      /* ===== ولا يُطَّلع على مسوّدة أحد =====
         المسوّدةُ تُرفع لتُحفظ لصاحبها لا لتُقرأ. فيُقرأ من غيري ‎pub‎ وحدَه،
         ويُقرأ لي كلُّ ما لي — والشرطُ في الاستعلام نفسِه لا في تصفيةٍ بعده. */
      const rs = await db.prepare(
        `SELECT p.id, p.uid, p.sec, p.data, p.ts, p.st, p.pin, u.name, u.img,
                (SELECT COUNT(*) FROM likes l WHERE l.pid = p.id) likes,
                (SELECT COUNT(*) FROM likes l WHERE l.pid = p.id AND l.uid = ?) mine
           FROM posts p JOIN users u ON u.id = p.uid
          WHERE p.code = ? AND (p.st = 'pub' OR p.uid = ?) ORDER BY p.ts`)
        /* ===== وعلامةُ «لا أحد» حرفٌ يُرى =====
           كانت بايتًا صفريًّا (‎NUL‎) داخل النصّ: سِكوَيْل يقبله وبوستجرس
           **يرفضه رفضًا تامًّا** — لا يُخزَّن ولا يُمرَّر معاملًا. والمعرِّفات
           كلُّها تبدأ بـ‎u‎، فالشرطةُ لا تصادف واحدًا منها أبدًا. */
        .bind(uid, code, uid || '-').all();
      const posts = (rs.results || []).map(r => {
        let data = null;
        try { data = JSON.parse(r.data); } catch (e) { /* صفٌّ تالف: يُترك بمتنٍ خاوٍ */ }
        return { id: r.id, uid: r.uid, sec: r.sec, ts: r.ts, st: r.st || 'pub', pin: r.pin ? 1 : 0,
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
      const st = STS.has(String(b.st || '')) ? String(b.st) : 'pub';
      /* ===== والتثبيتُ يسافر =====
         كان علامةً في متصفّحٍ واحدٍ لا تبلغ أحدًا، وتُشتقّ بترحيلٍ يعمل مرّةً —
         فما ثُبّت بعده لم يُثبَّت أبدًا، فلم يصر غلافًا أبدًا. وهو خبرٌ عن
         المساهمة كحالها، فيسكن معها ويُقرأ معها. */
      /* ===== والملكيّةُ تُصرَّح وتُطابَق، ولا تُستنتج من الكوكيّ =====
         الكوكيُّ واحدٌ للأصل: لوحةُ الأدمن تفتح جلسةَ الموقع، والموقعُ الأساسيُّ
         يفتح جلسةَ الطالب — من دخل آخِرًا بدّله. والدفعُ مؤجَّلٌ يمشي على الدرج
         المشترَك كلِّه، فكان صاحبُ المساهمة **من كان داخلًا لحظةَ الرفع** لا من
         كتبها. فوقع: مساهمةٌ كُتبت في اللوحة باسم الموقع رُفعت باسم الحساب
         الشخصيّ، وذهب تثبيتُها معها.
         فيقول العميلُ من يظنّه صاحبَها، ويُطابَق بالجلسة. فإن اختلفا رُدَّ الدفعُ
         ولم يُكتب شيء — ويُعاد حين تعود جلستُه. والصمتُ ههنا أخطرُ من الردّ.

         و**‎403‎ لا ‎409‎**: التسعُ محجوزةٌ للمصالحة (معرّفٌ آخرُ لنفس البند) وجوابُها
         «اجذب ثمّ أعِد الدفع» — ولو رُدَّ اختلافُ المالك بها لَدارت الحلقةُ أبدًا:
         يجذب فلا يتبدّل شيء، فيدفع فيُردّ، إلى غير نهاية. */
      if (b.uid && String(b.uid) !== s.uid) return J({ error: 'owner', uid: s.uid }, 403);
      const pin = b.pin ? 1 : 0;
      await db.prepare(
        `INSERT INTO posts (id, uid, code, sec, data, ts, updated, st, pin) VALUES (?,?,?,?,?,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated = excluded.updated,
                                         st = excluded.st, pin = excluded.pin
           WHERE posts.uid = excluded.uid`)
        .bind(id, s.uid, code, sec, data, ts, now(), st, pin).run();
      /* ===== ويُردّ صاحبُها معها =====
         العميلُ كان يكتب المالكَ من **ذاكرته** (‎if (state.uid) p.uid = …‎)، وفي
         لوحة الأدمن تُفتح الجلسةُ بـ‎fetch‎ فيؤخذ الكوكيُّ وتبقى الذاكرةُ خاويةً
         لحظاتٍ — فتُرفع المساهمةُ **بلا مالكٍ في الدرج**. ثمّ لا يعرفها الموقعُ
         الأساسيُّ مساهمةَ موقعٍ فيبقى ختمُ «لي» عليها، فتحجب ما على الخادم.
         والخادمُ يعرف صاحبَها يقينًا (الجلسة)، فيقوله — والدرجُ يُصدّقه. */
      return J({ ok: true, id, uid: s.uid });
    }

    return J({ error: 'method' }, 405);
  } catch (e) {
    console.error('posts:', m, e && e.message);
    /* وقيدُ «واحدةٌ لكلّ بند» يقع خطأً في القاعدة — يُترجَم إلى ما يفهمه المستخدم */
    if (String(e && e.message).includes('UNIQUE')) return J({ error: 'duplicate' }, 409);
    return J({ error: 'server' }, 500);
  }
}
