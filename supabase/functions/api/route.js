/* ============================================================
   الباب — نداء واحد يدخل منه كل ‎/api/…‎
   ============================================================
   كلاودفلير يوزع النداء بشجرة المجلدات: ‎functions/api/posts/[[path]].js‎
   يصير ‎/api/posts/*‎ من نفسه. وفيرسل عنده ملف واحد يلتقط الكل، فالتوزيع
   يُكتب ههنا صريحا في جدول يُقرا.

   ===== والنقاط تُنقل بشكلها الاول =====
   ملفات كلاودفلير تصدّر ‎onRequestGet‎ و‎onRequestPut‎ … وتنتظر
   ‎{ request, env, params }‎. وفيرسل ينادي ‎GET(request)‎. فيُبنى ههنا
   السياق الذي تنتظره، وتُنادى كما هي — فلا يُعاد كتابة الف وثمانمئة سطر.

   ===== ولمَ تسكن النقاط في ‎_h/‎ ؟ =====
   ما بدا بشرطة سفلية داخل ‎api/‎ يقرؤه فيرسل ملفَ عون لا مسارا. فلا تصير
   ‎/api/_h/auth‎ بابا مفتوحا، وتُحزم مع الباب لانها مستوردة منه.
   ولا تُترك في ‎functions/‎: ما ليس دالةً في فيرسل يُقدَّم **ملفا ساكنا**،
   فتصير شيفرة الخادم كلها قابلة للتنزيل.

   ===== وترتيب النقل =====
   يُنقل الاسهل اولا لتُختبر الانابيب. وكل سطر معلق ههنا نقطة لم تُنقل بعد،
   وهي تبقى تُخدم من كلاودفلير حتى تنتقل. */

import { guard, SEC } from './_guard.js';
import * as catalog  from './_h/catalog.js';
import * as auth     from './_h/auth.js';
import * as lock     from './_h/lock.js';
import * as posts    from './_h/posts.js';
import * as udoc     from './_h/udoc.js';
import * as media    from './_h/media.js';
import * as likes    from './_h/likes.js';
import * as comments from './_h/comments.js';
import * as admin    from './_h/admin.js';

/* المسار ⇐ الوحدة. والاطول اولا حيث تشابهت الرؤوس. */
const ROUTES = [
  ['/api/catalog',  catalog],
  ['/api/auth',     auth],
  ['/api/lock',     lock],
  ['/api/posts',    posts],
  ['/api/udoc',     udoc],
  ['/api/media',    media],
  ['/api/likes',    likes],
  ['/api/comments', comments],
  ['/api/admin',    admin],
  /* و‎/api/nook‎ لم تُنقل: ‎udoc‎ خلفتها، والعميل لا يناديها، وجدولها لم يُنشا.
     وتبقى في كلاودفلير للمتصفح الذي لم يُحدَّث حتى يُطفا الخادم القديم. */
];

const J = (o, s) => new Response(JSON.stringify(o), {
  status: s,
  headers: Object.assign(
    { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, SEC),
});

async function handle(request) {
  /* Preflight never reaches a handler: the browser asks before it sends. */
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: SEC });

  const url = new URL(request.url);
  const hit = ROUTES.find(([p]) => url.pathname === p || url.pathname.startsWith(p + '/'));

  /* ونقطة لم تُنقل بعد تُقال بصراحة: اربعمئة واربعة صامتة اسوا من كلمة.
     (وهي الحال التي اوقعتنا اليوم: خادم لا يرد، وموقع لا يشكو) */
  if (!hit) return J({ error: 'not-found', path: url.pathname }, 404);

  const [prefix, mod] = hit;
  const rest = url.pathname.slice(prefix.length).replace(/^\//, '');

  const stop = await guard(request);
  if (stop) return stop;

  /* السياق الذي تنتظره دوال كلاودفلير — و‎env.DB‎ لا يُستعمل: الجسر
     يمسك ‎DATABASE_URL‎ بنفسه. ويُمرر ‎env‎ ليبقى شكل النداء واحدا. */
  const ctx = {
    request,
    env: Deno.env.toObject(),
    params: { path: rest ? rest.split('/') : [] },
    waitUntil: p => p,        /* لا خلفية ههنا: ما وجب انتظاره يُنتظر في موضعه */
    next: async () => J({ error: 'not-found' }, 404),
  };

  const fn = mod['onRequest' + request.method.charAt(0) + request.method.slice(1).toLowerCase()]
          || mod.onRequest;
  if (!fn) return J({ error: 'method-not-allowed' }, 405);

  const res = await fn(ctx);
  const out = new Response(res.body, res);
  Object.keys(SEC).forEach(k => { if (!out.headers.has(k)) out.headers.set(k, SEC[k]); });
  return out;
}

export const GET     = handle;
export const PUT     = handle;
export const POST    = handle;
export const PATCH   = handle;
export const DELETE  = handle;
export const OPTIONS = handle;
