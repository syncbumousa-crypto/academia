/* ============================================================
   نبضة فيرسل — بوابة المرحلة ٢
   ============================================================
   لا قاعدة ولا كوكي ولا متغير بيئة: اذا ردت هذه، فالانابيب سليمة —
   المشروع منشور، و api/ تُقرا دوالا لا ملفات ساكنة، والتوجيه يعمل.
   ولا تُنقل نقطة واحدة قبل ان تخضر.

   وهي ايضا تختبر شكل الدالة الذي يقوم عليه النقل كله:
   فيرسل يقبل `export function GET(request)` بالطريقة القياسية
   (نفس Request/Response اللذين تستعملهما دوال كلاودفلير)، وعليها
   يقوم الغلاف في المرحلة ٣.
   وان لم تعمل، فالبديل `export default function (req, res)`
   وحينها يكبر الغلاف — وهذا ما نريد ان نعرفه الان لا بعد ساعتين. */
export function GET() {
  return new Response(JSON.stringify({
    ok: true,
    where: 'vercel',
    node: typeof process !== 'undefined' ? process.version : '?',
    t: Date.now(),
  }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
