/* ============================================================
   ‎/api/udoc‎ — وثائقُ المستخدم في حسابه (م٢)
   ============================================================
     GET  /api/udoc?kind=exams          ⇐ وثيقتي من هذا النوع
     PUT  /api/udoc  {kind, data}       ⇐ تكتبها وتزيد ‎rev‎

   حكمُ صاحب الموقع: المتصفّحُ لا يخزّن شيئًا إلّا أنّك مسجَّل، وما سواه في
   الحساب. فهذي النقطةُ بابُ كلّ ما يخصُّك: سجلُّ الاختبارات، وجدولةُ المذاكرة،
   وما يأتي بعدهما — بلا نقطةٍ جديدةٍ لكلّ نوع.

   ===== ولا وثيقةَ لزائر =====
   ‎uid‎ من الجلسة لا من المتن، كما في كلّ نقطةٍ ههنا.

   ===== والخادمُ يحفظ ولا يفسّر =====
   المتنُ خامٌ. فينمو شكلُ الوثيقة في العميل بلا هجرةٍ في القاعدة.

   ===== ولا يُكتب خواءٌ فوق عمل =====
   وثيقةٌ فيها بنودٌ لا يُكتب فوقها وثيقةٌ خاوية. وهو الحارسُ نفسُه الذي في
   الدرج وفي النواة: النسخةُ البعيدةُ آخرُ ما يبقى، فلا تُمحى بغلطةٍ صامتة. */

const J = (o, status = 200) => new Response(JSON.stringify(o), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

/* والحدُّ قيسَ ولم يُقدَّر: سجلُّ اختبارات صاحب الموقع ٢٩٦ك اليوم وينمو مع كلّ
   اختبار. فميجا سعةٌ لسنواتٍ، وسقفٌ يمنع أن يُدسّ في الوثيقة متنٌ ثقيل. */
const MAX_DATA = 1024 * 1024;
const KINDS = new Set(['nook', 'exams', 'srs', 'prefs']);

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

/* «كم فيها من بنود» — به يُعرف الخواءُ من العامر، أيًّا كان شكلُ الوثيقة */
const count = v => {
  if (Array.isArray(v)) return v.length;
  if (v && typeof v === 'object') return Object.keys(v).length;
  return 0;
};

export async function onRequest({ request, env }) {
  const db = env.DB;
  if (!db) return J({ error: 'no-db' }, 503);
  const url = new URL(request.url);
  const m = request.method;

  try {
    const s = await session(db, request);
    if (!s) return J({ error: 'auth' }, 401);

    if (m === 'GET') {
      const kind = (url.searchParams.get('kind') || '').trim();
      if (!KINDS.has(kind)) return J({ error: 'kind' }, 400);
      const r = await db.prepare('SELECT data, rev, updated FROM udoc WHERE uid = ? AND kind = ?')
        .bind(s.uid, kind).first();
      if (!r) return J({ kind, data: null, rev: 0, updated: 0 });
      let data = null;
      try { data = JSON.parse(r.data); } catch (e) { /* صفٌّ تالف: يُردّ خاويًا */ }
      return J({ kind, data, rev: r.rev | 0, updated: r.updated | 0 });
    }

    if (m === 'PUT' || m === 'POST') {
      let b = {};
      try { b = await request.json(); } catch (e) { return J({ error: 'body' }, 400); }
      const kind = String(b.kind || '').trim();
      if (!KINDS.has(kind)) return J({ error: 'kind' }, 400);
      const d = b.data;
      if (d === undefined || d === null || typeof d !== 'object') return J({ error: 'data' }, 400);
      const txt = JSON.stringify(d);
      if (txt.length > MAX_DATA) return J({ error: 'too-big', max: MAX_DATA, got: txt.length }, 413);

      const cur = await db.prepare('SELECT data, rev FROM udoc WHERE uid = ? AND kind = ?')
        .bind(s.uid, kind).first();
      if (cur && !b.force) {
        let old = null;
        try { old = JSON.parse(cur.data); } catch (e) { old = null; }
        if (count(old) && !count(d)) return J({ error: 'would-wipe', had: count(old) }, 409);
      }

      const rev = (cur ? (cur.rev | 0) : 0) + 1;
      await db.prepare(
        `INSERT INTO udoc (uid, kind, data, rev, updated) VALUES (?,?,?,?,?)
           ON CONFLICT(uid, kind) DO UPDATE SET data = excluded.data, rev = excluded.rev,
                                                updated = excluded.updated`)
        .bind(s.uid, kind, txt, rev, now()).run();
      return J({ ok: true, kind, rev, updated: now() });
    }

    return J({ error: 'method' }, 405);
  } catch (e) {
    console.error('udoc:', m, e && e.message);
    return J({ error: 'server' }, 500);
  }
}
