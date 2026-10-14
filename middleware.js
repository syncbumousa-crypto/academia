/* ============================================================
   قفل لوحة الادمن على فيرسل
   ============================================================
   في كلاودفلير تسبق الدالةُ الملفاتِ الساكنة بحكم موضعها في الشجرة
   (‎functions/AbdulrahmanUniProjectAdmin/[[path]].js‎). وفي فيرسل تُقدَّم
   الملفات الساكنة من الحافة مباشرة ولا تراها دالة — فالوسيط هو الموضع
   الوحيد الذي يسبقها.

   ===== ولا يُكتب ههنا قفل ثانٍ =====
   الحارس هو الحارس نفسه، منقولا بـ‎_port.py‎: نموذج كلمة السر، وحال «لم
   تُعيَّن بعد»، وموازنة الزمن الثابت. كتبتُ اول مرة صفحة «مقفل» من عندي
   فذهب النموذج — وهو شيء لم يُطلب، والاصل كان يعمل. فلا يُخترع ما هو قائم.

   ===== والمطابقة مقصورة على مسار اللوحة =====
   بلا ‎matcher‎ يمر **كل** طلب بالوسيط — كل صورة وكل ملف — فيصير كل واحد
   منها نداء يُحسب. وهي بعينها العلة التي اوقفت كلاودفلير: عشرة الاف صورة
   تمر على الخادم بلا داع.

   ===== والخطا يميل الى المنع =====
   الاصل كان يقفل اذا غابت القاعدة. والجسر لا «يغيب» بل يصيح وقت الاستعلام،
   فيُلتقط صياحه ههنا وتُقدَّم صفحة القفل — لئلا يصير الخطا فتحا. */

import * as alock from './api/_h/alock.js';

export const config = {
  matcher: '/AbdulrahmanUniProjectAdmin/:path*',
  runtime: 'nodejs',
};

/* ===== وكيف يقول الوسيط «مرِّرْ»؟ =====
   لا بان يرد لا شيء: جُرّب فردّ فيرسل **٢٠٠ وصفر بايت** لكل ملف — الصفحة
   تُقدَّم ثم ياتي ‎admin.js‎ خاويا، فتموت اللوحة **شاشةً بيضاء بلا خطا**.
   والصمت اخطر من الرفض: ٢٠٠ يقول «نجح».
   فالتمرير رد صريح بترويسة ‎x-middleware-next‎ — وهي ما تُرسله ‎NextResponse.next()‎
   من تحت. */
const PASS = Symbol('pass');
const pass = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

const shut = () => new Response(alock.PAGE, {
  status: 200,
  headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store, must-revalidate' },
});

export default async function middleware(request) {
  try {
    const res = await alock.onRequest({
      request,
      env: process.env,
      params: {},
      next: () => PASS,
    });
    return res === PASS ? pass() : res;
  } catch (e) {
    console.error('alock:', e && e.message);
    return shut();
  }
}
