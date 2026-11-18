/* منقولة من ‎functions/api/udoc.js‎ — والفرق سطران:
   ‎env.DB‎ صار الجسر، وفحص «لا قاعدة» ذهب لان الجسر يصيح بنفسه.
   وما عداهما حرف بحرف. */
import { db } from '../_db.js';

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

/* ===== وكلُّ اختبارٍ وثيقةٌ وحده (ROADMAP-CLOUD-NEXT ٧) =====
   كان السجلُّ كلُّه وثيقةً واحدة (‎exams‎) فبلغ ٨٢٪ من الحدّ بثلاثين اختبارًا،
   والموقعُ يقصّه عند الثلاثين فيمحو الأقدمَ صامتًا. فصار لكلّ اختبارٍ صفُّه
   (‎xt:<معرّفه>‎) — لا حدَّ للسجلّ، والحدُّ للاختبار الواحد (~٧٥ك أثقلُها).
     GET    /api/udoc?list=xt        ⇐ اختباراتي كلُّها خفيفةً: بلا ‎run‎ (طابورُ ما لم يكتمل)، ومعها ‎big‎
     GET    /api/udoc?kind=xt:<id>   ⇐ الاختبارُ كاملًا (حين يُكمَل أو تُفتح إحصاءاتُه)
     PUT    /api/udoc {kind:'xt:<id>', data}
     DELETE /api/udoc?kind=xt:<id>   ⇐ حذفُه من اللوح
   وتبقى ‎exams‎ القديمةُ كما هي: نسخةٌ احتياطيّةٌ لما قبل النقل، لا تُمحى. */
const XT = /^xt:[a-z0-9]{4,40}$/;
/* ===== وسجلُّ النشاط: وثيقةٌ لكلّ جهاز (ROADMAP-CLOUD-NEXT ٣) =====
   ‏‎act:<الجهاز>‎ — كلُّ جهازٍ يكتب أيّامَه هو وحده، والموقعُ يجمعها عند العرض.
   فلا يكتب جهازٌ فوق جهاز، ولا يُعدّ يومٌ مرّتين.
     GET /api/udoc?list=act  ⇐ أجهزتي كلُّها */
const ACT = /^act:[a-z0-9]{4,40}$/;
const okKind = k => KINDS.has(k) || XT.test(k) || ACT.test(k);
const LISTS = new Map([['xt', 'xt:%'], ['act', 'act:%']]);

const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const now = () => Math.floor(Date.now() / 1000);
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

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
const SID = req => {
  /* The site and the API no longer share an origin, so the cookie cannot
     ride along. The caller sends the token it holds; which jar it came
     from is the caller's choice, exactly as `x-as` used to decide. */
  const a = req.headers.get('authorization') || '';
  if (a.slice(0, 7).toLowerCase() === 'bearer ') return a.slice(7).trim();
  return ((req.headers.get('cookie') || '').match(
    req.headers.get('x-as') === 'site' ? /(?:^|;\s*)asid=([^;]+)/ : /(?:^|;\s*)sid=([^;]+)/) || [])[1] || '';
};
async function session(db, req) {
  const m = [null, SID(req)];
  if (!m[1]) return null;
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
  const url = new URL(request.url);
  const m = request.method;

  try {
    const s = await session(db, request);
    if (!s) return J({ error: 'auth' }, 401);

    const listOf = url.searchParams.get('list') || '';
    if (m === 'GET' && LISTS.has(listOf)) {
      const rs = await db.prepare(
        'SELECT kind, data, rev, updated FROM udoc WHERE uid = ? AND kind LIKE ?').bind(s.uid, LISTS.get(listOf)).all();
      const list = [];
      for (const r of (rs && rs.results) || []) {
        let d = null;
        try { d = JSON.parse(r.data); } catch (e) { continue; }   /* صفٌّ تالف: يُتخطّى */
        if (!d || typeof d !== 'object') continue;
        const big = !!d.run;
        if (big) d = Object.assign({}, d, { run: null });
        list.push({ id: String(r.kind).slice(listOf.length + 1), rev: r.rev | 0, updated: r.updated | 0, big, data: d });
      }
      return J({ list });
    }

    if (m === 'DELETE') {
      const kind = (url.searchParams.get('kind') || '').trim();
      if (!XT.test(kind)) return J({ error: 'kind' }, 400);
      await db.prepare('DELETE FROM udoc WHERE uid = ? AND kind = ?').bind(s.uid, kind).run();
      return J({ ok: true, kind });
    }

    if (m === 'GET') {
      const kind = (url.searchParams.get('kind') || '').trim();
      if (!okKind(kind)) return J({ error: 'kind' }, 400);
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
      if (!okKind(kind)) return J({ error: 'kind' }, 400);
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
