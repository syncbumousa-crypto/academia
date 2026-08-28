/* ============================================================
   ‎/api/auth/*‎ — المستخدمون والجلسات (م١أ من ROADMAP-SERVER)
   ============================================================
     POST /api/auth/join    {name,email,password}  ⇐ يُنشئ ويُدخل
     POST /api/auth/login   {email,password}       ⇐ يُدخل
     POST /api/auth/logout                         ⇐ يُخرج (يُبطل الجلسة)
     GET  /api/auth/me                             ⇐ مَن أنا؟

   ===== ملفٌّ واحدٌ ملتقِط، لا أربعة =====
   الشيفرةُ المشتركة (التجزئةُ والكوكيّ وقراءةُ الجلسة) تُستدعى من الأربعة. ووضعُها
   في ملفٍّ مجاورٍ داخل ‎functions/‎ يوقعنا في سؤال التوجيه: أيُّ ملفٍّ يصير مسارًا
   وأيُّه لا. فالملتقِطُ ‎[[path]]‎ يُغني عن السؤال — نقطةُ دخولٍ واحدةٌ وشيفرةٌ محلّيّة.

   ===== ولا يُخزَّن سرٌّ خامًا =====
   · كلمةُ السرّ: ‎PBKDF2-SHA256‎ بملحٍ لكلّ مستخدمٍ وعددِ جولاتٍ يُخزَّن معها — فيُرفع
     العددُ غدًا بلا كسرِ حسابٍ قديم.
   · رمزُ الجلسة: يُرسل إلى المتصفّح كاملًا، ويُخزَّن في القاعدة **مجزَّأً**. فمن قرأ
     جدولَ الجلسات لا ينتحل أحدًا.
   · والمقارنةُ في زمنٍ ثابت: مقارنةُ نصٍّ عاديّةٌ تُفشي طولَ ما تطابق.

   ===== والكوكيّ لا يُقرأ من جافاسكربت =====
   ‎HttpOnly‎ فلا يبلغه سكربتٌ حُقن في الصفحة · ‎Secure‎ فلا يمشي على غير ‎https‎ ·
   ‎SameSite=Lax‎ فلا يُرسَل مع طلبٍ من موقعٍ آخر (وهو ما يمنع ‎CSRF‎ في الكتابة).

   ===== ولا قصرَ على نطاقٍ — لا اليومَ ولا غدًا =====
   قرارُ صاحب الموقع (٢٨ أغسطس): هذا اجتهادٌ شخصيٌّ لا صلةَ له بالجامعة، فلا يُطلب
   بريدٌ جامعيٌّ ولا يُفحص نطاقٌ ولا يُرسل إليه شيء. أيُّ بريدٍ يصحّ. */

const J = (o, status = 200, extra = {}) => new Response(JSON.stringify(o), {
  status,
  headers: Object.assign({ 'content-type': 'application/json; charset=utf-8',
                           'cache-control': 'no-store' }, extra),
});

const SESSION_DAYS = 60;
const PW_ITER = 100000;
const PW_MIN = 6;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/* ---------- عُدّةٌ صغيرة ---------- */
const enc = new TextEncoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
const now = () => Math.floor(Date.now() / 1000);

async function sha256(s) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
}

async function pbkdf2(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256);
  return b64(bits);
}

/* مقارنةٌ لا تُفشي أين وقع الاختلاف: تمشي على الطول كلِّه دائمًا */
function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const cookie = (tok, days) =>
  `sid=${tok}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${days * 86400}`;

function readCookie(req) {
  const h = req.headers.get('cookie') || '';
  const m = h.match(/(?:^|;\s*)sid=([^;]+)/);
  return m ? m[1] : null;
}

const publicUser = u => ({ id: u.id, name: u.name || '', email: u.email, img: u.img || '' });

async function sessionUser(db, req) {
  const tok = readCookie(req);
  if (!tok) return null;
  const row = await db.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.uid
      WHERE s.th = ? AND s.expires > ?`).bind(await sha256(tok), now()).first();
  return row || null;
}

async function startSession(db, uid, ua) {
  const tok = hex(rnd(32));
  const exp = now() + SESSION_DAYS * 86400;
  await db.prepare('INSERT INTO sessions (th, uid, created, expires, ua) VALUES (?,?,?,?,?)')
    .bind(await sha256(tok), uid, now(), exp, (ua || '').slice(0, 120)).run();
  /* وكنسُ المنتهيات عند كلّ دخول: لا حارسَ دوريّ في هذا المعمار، فمن دخل فليُنظّف */
  await db.prepare('DELETE FROM sessions WHERE expires <= ?').bind(now()).run();
  return tok;
}

async function body(req) {
  try { return await req.json(); } catch (e) { return {}; }
}

/* ============================================================ */
export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  const db = env.DB;
  if (!db) return J({ error: 'no-db' }, 503);

  const path = (Array.isArray(params.path) ? params.path : [params.path || '']).join('/');
  const m = request.method;

  try {
    /* ---------- مَن أنا؟ ---------- */
    if (path === 'me' && m === 'GET') {
      const u = await sessionUser(db, request);
      return u ? J({ user: publicUser(u) }) : J({ user: null }, 401);
    }

    /* ---------- خروج ---------- */
    if (path === 'logout' && m === 'POST') {
      const tok = readCookie(request);
      if (tok) await db.prepare('DELETE FROM sessions WHERE th = ?').bind(await sha256(tok)).run();
      /* والكوكيّ يُمحى بمهلةٍ صفر — ولا يكفي حذفُ الصفّ: المتصفّحُ يبقى يرسله */
      return J({ ok: true }, 200, { 'set-cookie': 'sid=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0' });
    }

    /* ---------- تعديلُ البروفايل وكلمةِ السرّ ----------
       ‎PATCH /api/auth/me‎  {name?, img?, password?, current?}

       ===== ولمَ نقطةٌ لهذا أصلًا؟ =====
       الاسمُ والصورةُ يُعرضان على **كلّ مساهمةٍ نشرتَها**، وهما في جدول
       ‎users‎ لا في نسخة المساهمة. فلو بقي تعديلُهما في الدرج لَظهرتَ للناس
       باسمك القديم أبدًا، ولَأعاد ‎/api/auth/me‎ القديمَ فوق الجديد في أوّل
       إقلاع — تعديلٌ يُمحى بلا أن يُقال.

       ===== وتبديلُ كلمة السرّ يسأل عن القديمة =====
       والجلسةُ وحدَها لا تكفي: حاسوبٌ تُرك مفتوحًا يُغيَّر سرُّه فيُطرد صاحبُه.
       فمن عرف القديمةَ فهو صاحبُها.

       ===== وتبديلُها يُنهي الجلساتِ الأخرى =====
       من بدّل سرَّه فقد أراد قطعَ ما لا يعرف — جهازٌ منسيٌّ أو جلسةٌ مسروقة.
       فتُمحى الجلساتُ كلُّها إلّا هذه. */
    if (path === 'me' && m === 'PATCH') {
      const u = await sessionUser(db, request);
      if (!u) return J({ error: 'auth' }, 401);
      const b = await body(request);
      const set = [], val = [];

      if (b.name !== undefined) {
        const nm = String(b.name).trim().slice(0, 60);
        if (!nm) return J({ error: 'name' }, 400);
        set.push('name = ?'); val.push(nm);
      }
      if (b.img !== undefined) {
        const im = String(b.img || '');
        /* والصورةُ عنوانٌ لا بِتات: ‎data:‎ ضخمةٌ تُثقل كلَّ قراءةِ مساهمة.
           فيُقبل مسارُ المستودع وحدَه (م٤) أو الخلوّ */
        if (im && !/^\/api\/media\/[a-f0-9]{64}$/.test(im)) return J({ error: 'img' }, 400);
        set.push('img = ?'); val.push(im);
      }

      let killOthers = false;
      if (b.password !== undefined) {
        const pw = String(b.password);
        if (pw.length < PW_MIN) return J({ error: 'pass' }, 400);
        const cur = String(b.current || '');
        const got = await pbkdf2(cur, unb64(u.pw_salt), u.pw_iter || PW_ITER);
        if (!same(got, u.pw_hash)) return J({ error: 'current' }, 403);
        const salt = rnd(16);
        set.push('pw_hash = ?', 'pw_salt = ?', 'pw_iter = ?');
        val.push(await pbkdf2(pw, salt, PW_ITER), b64(salt), PW_ITER);
        killOthers = true;
      }

      if (!set.length) return J({ error: 'nothing' }, 400);
      val.push(u.id);
      await db.prepare('UPDATE users SET ' + set.join(', ') + ' WHERE id = ?').bind(...val).run();

      if (killOthers) {
        const tok = readCookie(request);
        await db.prepare('DELETE FROM sessions WHERE uid = ? AND th <> ?')
          .bind(u.id, tok ? await sha256(tok) : '').run();
      }
      const fresh = await db.prepare('SELECT * FROM users WHERE id = ?').bind(u.id).first();
      return J({ user: publicUser(fresh) });
    }

    /* ---------- إنشاء ---------- */
    if (path === 'join' && m === 'POST') {
      const b = await body(request);
      const name = String(b.name || '').trim().slice(0, 60);
      const email = String(b.email || '').trim().toLowerCase();
      const pw = String(b.password || '');
      if (!name) return J({ error: 'name' }, 400);
      if (!EMAIL_RE.test(email)) return J({ error: 'email' }, 400);
      if (pw.length < PW_MIN) return J({ error: 'pass' }, 400);

      const taken = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
      if (taken) return J({ error: 'taken' }, 409);

      const salt = rnd(16);
      const id = 'u' + hex(rnd(12));
      await db.prepare(
        `INSERT INTO users (id,email,name,img,pw_hash,pw_salt,pw_iter,verified,created,seen)
         VALUES (?,?,?,'',?,?,?,0,?,?)`)
        .bind(id, email, name, await pbkdf2(pw, salt, PW_ITER), b64(salt), PW_ITER, now(), now()).run();

      const tok = await startSession(db, id, request.headers.get('user-agent'));
      return J({ user: { id, name, email, img: '' } }, 200, { 'set-cookie': cookie(tok, SESSION_DAYS) });
    }

    /* ---------- دخول ---------- */
    if (path === 'login' && m === 'POST') {
      const b = await body(request);
      const email = String(b.email || '').trim().toLowerCase();
      const pw = String(b.password || '');
      const u = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      /* ورسالةٌ واحدةٌ لِلاثنين: «لا حسابَ» و«كلمةٌ خاطئة» تُفرِّق للمهاجم أيُّ
         العناوين مسجَّلٌ عندنا. والواجهةُ تقول للمستخدم ما يكفيه */
      if (!u) return J({ error: 'bad' }, 401);
      const got = await pbkdf2(pw, unb64(u.pw_salt), u.pw_iter || PW_ITER);
      if (!same(got, u.pw_hash)) return J({ error: 'bad' }, 401);

      await db.prepare('UPDATE users SET seen = ? WHERE id = ?').bind(now(), u.id).run();
      const tok = await startSession(db, u.id, request.headers.get('user-agent'));
      return J({ user: publicUser(u) }, 200, { 'set-cookie': cookie(tok, SESSION_DAYS) });
    }

    return J({ error: 'not-found' }, 404);
  } catch (e) {
    console.error('auth:', path, e && e.message);
    return J({ error: 'server' }, 500);
  }
}
