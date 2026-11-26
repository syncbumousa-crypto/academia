/* ============================================================
   الخطأ يُكتب حيث نراه (ROADMAP-DATA-INTEGRITY م٢-٣)
   ============================================================
   سجلّاتُ Supabase ردّت خواءً حين احتجناها، فبقي رفعُ الصور يفشل عشرةَ أيّامٍ
   بـ«‎server‎» ولا يُعرف لماذا. فكلُّ ‎500‎ يُكتب سطرًا في ‎errlog‎ بمعرّفٍ قصير،
   ويُردّ المعرّفُ نفسُه للعميل فيكتبه في دفتر الإقلاع — فيُطابَق السطرُ بالسطر.

   ===== ولا يُفشل الكتابةُ الطلب =====
   إن غاب الجدولُ أو تعثّرت القاعدة يُبتلع خطأُ التسجيل ويمضي الردّ. فنشرُ هذا
   قبل إنشاء الجدول آمن.

   ===== وله سقف =====
   ألفُ سطر. والتنظيفُ في طلبٍ من كلّ عشرين، لا في كلّ طلب. */
import { db } from './_db.js';

const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

export async function oops(where, e, extra) {
  const ref = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  const msg = String((e && (e.stack || e.message)) || e || '').slice(0, 1000);
  const code = String((e && (e.code || e.name)) || '').slice(0, 40);
  console.error(where, ref, msg);
  try {
    await db.prepare('INSERT INTO errlog (ts, ref, route, code, msg) VALUES (?,?,?,?,?)')
      .bind(Date.now(), ref, String(where + (extra ? ' ' + extra : '')).slice(0, 120), code, msg).run();
    if (Math.random() < 0.05) {
      await db.prepare('DELETE FROM errlog WHERE id <= (SELECT MAX(id) - 1000 FROM errlog)').run();
    }
  } catch (e2) { console.error('errlog:', e2 && e2.message); }
  return new Response(JSON.stringify({ error: 'server', ref }), { status: 500, headers: H });
}
