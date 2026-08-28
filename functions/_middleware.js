/* ============================================================
   الوسيط — يمرّ به كلُّ طلبٍ قبل أن يبلغ نقطتَه
   ============================================================
   ثلاثةٌ يقع ههنا لأنّها تخصّ الجميعَ ولا تخصّ أحدًا بعينه:
     ١ · حدُّ الطلبات
     ٢ · طردُ الممنوع
     ٣ · ترويساتُ أمانٍ على كلّ ردّ

   ===== ولمَ وسيطٌ لا فحصٌ في كلّ نقطة؟ =====
   لأنّ الفحصَ في كلّ نقطةٍ يُنسى في النقطة التي تُكتب غدًا. والوسيطُ يمرّ به
   ما لم يُكتب بعد. وهو موضعٌ واحدٌ يُراجَع ويُعدَّل.

   ===== والعدُّ نافذةٌ لا سجلّ =====
   لا يُخزَّن صفٌّ لكلّ طلب — يُخزَّن **عدُّ نافذةٍ زمنيّة** لكلّ فاعل. فالجدولُ
   ينمو بعدد الناس لا بعدد الطلبات. وحدُّ النافذة تقريبيّ: من جاء في آخر ثانيةٍ
   منها استأنف مبكّرًا. وهو ثمنٌ رخيصٌ مقابل صفٍّ واحدٍ بدل ألف.

   ===== والقراءةُ لا تُعدّ =====
   تصفُّح المكتبة وقراءة المساهمات مفتوحان (عهدُ الزائر). والعدُّ للكتابة
   والدخول والرفع — وهي ما يُستغلّ. */

const RULES = [
  /* [المسار، الفعل، الحدّ، النافذةُ بالثواني، المفتاحُ يقوم على…] */
  { p: '/api/auth/join',  m: 'POST',   n: 5,   w: 3600, by: 'ip' },   /* خمسةُ حساباتٍ في الساعة من عنوان */
  { p: '/api/auth/login', m: 'POST',   n: 12,  w: 900,  by: 'ip' },   /* اثنتا عشرة محاولةً في ربع ساعة */
  { p: '/api/auth/recover', m: 'POST', n: 8,  w: 3600, by: 'ip' },   /* ثمانيةٌ في الساعة: الرمزُ لا يُخمَّن */
  { p: '/api/auth/me',    m: 'PATCH',  n: 30,  w: 3600, by: 'ip' },
  { p: '/api/media',      m: 'POST',   n: 60,  w: 3600, by: 'ip' },   /* ستّون صورةً في الساعة */
  { p: '/api/posts',      m: 'PUT',    n: 120, w: 3600, by: 'ip' },
  { p: '/api/posts',      m: 'POST',   n: 120, w: 3600, by: 'ip' },
  { p: '/api/posts',      m: 'DELETE', n: 120, w: 3600, by: 'ip' },
  { p: '/api/likes',      m: 'POST',   n: 300, w: 3600, by: 'ip' },
];

const SEC = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'same-origin',
  'x-frame-options': 'SAMEORIGIN',
};

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

const J = (o, s) => new Response(JSON.stringify(o), {
  status: s,
  headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, SEC),
});

export async function onRequest(ctx) {
  const { request, env, next } = ctx;
  const url = new URL(request.url);

  /* ما ليس ‎/api/‎ ملفٌّ ساكن: يمرّ بلا عدٍّ ولا سؤال */
  if (!url.pathname.startsWith('/api/')) return next();

  const db = env.DB;
  const ip = request.headers.get('cf-connecting-ip') || '0.0.0.0';

  try {
    /* ---------- ١ · الممنوعُ لا يمرّ ---------- */
    if (db) {
      const c = (request.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([^;]+)/);
      if (c) {
        const row = await db.prepare(
          `SELECT u.banned FROM sessions s JOIN users u ON u.id = s.uid
            WHERE s.th = ? AND s.expires > ?`).bind(await sha256(c[1]), now()).first();
        /* والقراءةُ تبقى له: المنعُ منعُ مشاركةٍ لا طردٌ من الموقع */
        if (row && row.banned && request.method !== 'GET') {
          return J({ error: 'banned' }, 403);
        }
      }
    }

    /* ---------- ٢ · حدُّ الطلبات ---------- */
    const rule = RULES.find(r => url.pathname === r.p && request.method === r.m);
    if (rule && db) {
      const win = Math.floor(now() / rule.w);
      const key = rule.m + ':' + rule.p + '|' + ip;
      /* الزيادةُ والقراءةُ في جملةٍ واحدة: لا فجوةَ بين السؤال والعدّ */
      const r = await db.prepare(
        `INSERT INTO hits (k, win, n) VALUES (?,?,1)
           ON CONFLICT(k, win) DO UPDATE SET n = n + 1
         RETURNING n`).bind(key, win).first();
      const n = (r && r.n) || 1;
      if (n > rule.n) {
        return new Response(JSON.stringify({ error: 'too-many', retry: rule.w }), {
          status: 429,
          headers: Object.assign({
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
            'retry-after': String(rule.w),
          }, SEC),
        });
      }
      /* وكنسُ النوافذ الماضية أحيانًا لا في كلّ طلب: عملٌ لا يستحقّ رحلةً دائمة */
      if (n === 1 && Math.random() < 0.02) {
        ctx.waitUntil(db.prepare('DELETE FROM hits WHERE win < ?').bind(win - 2).run());
      }
    }
  } catch (e) {
    /* وخللٌ في الحارس لا يُغلق الموقع: يُسجَّل ويُمضى.
       فقاعدةٌ متعثّرةٌ تمنع الناسَ من القراءة أسوأُ من حدٍّ لم يُعدّ */
    console.error('guard:', e && e.message);
  }

  const res = await next();
  const out = new Response(res.body, res);
  Object.keys(SEC).forEach(k => { if (!out.headers.has(k)) out.headers.set(k, SEC[k]); });
  return out;
}
