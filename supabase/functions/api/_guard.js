/* ============================================================
   الحارس — نقل ‎functions/_middleware.js‎
   ============================================================
   ثلاثة تخص الجميع ولا تخص احدا بعينه: طرد الممنوع، وحد الطلبات،
   وترويسات امان على كل رد.

   ===== ولمَ صار دالة تُنادى بدل وسيط يُمر به؟ =====
   كلاودفلير يمر بالوسيط بحكم موضع الملف في الشجرة. وفيرسل لا شجرة عنده
   ههنا: باب واحد (`[...path].js`) ينادي الحارس اولا. فصار الترتيب صريحا
   في سطر يُقرا، لا ضمنيا في اسم مجلد. وهذا افضل من الاصل: لا يُنسى في
   نقطة تُكتب غدا، لان النقاط كلها تدخل من الباب نفسه.

   ===== والعد نافذة لا سجل =====
   لا صف لكل طلب، بل عد نافذة زمنية لكل فاعل. فالجدول ينمو بعدد الناس
   لا بعدد الطلبات. والقراءة لا تُعد: تصفح المكتبة مفتوح (عهد الزائر). */

import { db } from './_db.js';

/* ============================================================
   ولا حدَّ للطلبات — نُزع بقرار صاحب الموقع
   ============================================================
   كان ههنا جدولُ حدودٍ وعدَّادُ نوافذَ في جدول ‎hits‎: اثنا عشرَ بابًا لكلٍّ
   سقفٌ في ساعةٍ أو ربعِها. ونُزع كلُّه في ٣٠ أغسطس ٢٠٢٦ بطلبٍ صريح.

   وكان آخرُ ما فعل أنّه وقف في وجه صاحبه: نشرُ قائمة الدكاترة عملٌ مشروعٌ
   واحدٌ يبلغ ‎120‎ دفعةً في دقائق، فردَّ الخادمُ ‎429‎ ووقفت البيانات.

   ===== وما بقي بعده =====
   طردُ الممنوع (‎banned‎) باقٍ: ذاك حكمٌ على شخصٍ بعينه لا عدٌّ لأحد.
   وترويساتُ الأمان (‎SEC‎) باقيةٌ على كلّ ردّ.

   ===== وما ذهب معه =====
   بابُ الدخول لم يعد يُعدّ، فتجربةُ كلمات السرّ بلا سقف؛ وبابُ التسجيل كذلك.
   وهذا معلومٌ لصاحب الموقع ومقبولٌ منه. وإعادةُ بابٍ واحدٍ — الدخول مثلًا —
   لا تحتاج أكثرَ من إحياء هذا الجدول لذلك الباب وحدَه.

   وجدولُ ‎hits‎ يبقى في القاعدة ولا يُكتب فيه شيء: لا يُحذف جدولٌ لأنّ كاتبَه
   سكت — والحذفُ لا يُسترجع، والسكوتُ يُسترجع.                                 */

export const SEC = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'x-frame-options': 'SAMEORIGIN',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, authorization, x-as',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-expose-headers': 'content-type',
  'access-control-max-age': '86400',
};

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

const J = (o, s, extra) => new Response(JSON.stringify(o), {
  status: s,
  headers: Object.assign(
    { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    SEC, extra || {}),
});

/** يرد ‎Response‎ اذا وجب المنع، و‎null‎ اذا مر */
export async function guard(request) {
  /* ولا عنوانَ يُقرأ ولا مسارَ يُطابَق: ذاك كان للعدّ، والعدُّ ذهب */
  try {
    /* ---------- ١ · الممنوع لا يمر ---------- */
    const c = (request.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([^;]+)/);
    if (c) {
      const row = await db.prepare(
        `SELECT u.banned FROM sessions s JOIN users u ON u.id = s.uid
          WHERE s.th = ? AND s.expires > ?`).bind(await sha256(c[1]), now()).first();
      /* والقراءة تبقى له: المنع منع مشاركة لا طرد من الموقع */
      if (row && row.banned && request.method !== 'GET') return J({ error: 'banned' }, 403);
    }

    /* ---------- ٢ · ولا حدَّ للطلبات ---------- */
    /* نُزع بقرار صاحب الموقع (٣٠ أغسطس ٢٠٢٦). ولا يُعاد إلّا بطلبه. */
  } catch (e) {
    /* وخلل في الحارس لا يُغلق الموقع: يُسجل ويُمضى.
       فقاعدة متعثرة تمنع الناس من القراءة اسوا من حد لم يُعد */
    console.error('guard:', e && e.message);
  }
  return null;
}
