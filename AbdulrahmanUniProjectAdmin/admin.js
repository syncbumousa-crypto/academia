/* ============================================================
   أكاديميا أدمن — لوحة تحكّم المكتبة
   البيانات مشتركة مع الموقع: كلاهما يُفتح بـfile:// فيقرآن نفس تخزين المتصفّح
     academia2:catalog:v1 → كتالوج الأدمن  { tags, courses }
     academia2:v1         → حالة الموقع    (cinfo/المساهمات/الصور/الأترام)
   الكتالوج يُبذَر مرّة واحدة من مواد الموقع الحالية (data.js) فتصير كأن الأدمن أضافها
   ============================================================ */
(function () {
  'use strict';

  const LS_CAT = 'academia2:catalog:v1';
  const LS_APP = 'academia2:v1';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* مواد الموقع التي لها معمل (نفس قائمة app.js) — تُستعمل في البذرة الأولى فقط */
  const SEED_LABS = new Set(['ICS 104', 'STAT 214', 'MIS 250', 'MIS 301', 'MIS 311', 'MIS 315', 'MIS 341', 'ACCT 300', 'CGS 392', 'COE 344', 'ICS 108', 'SWE 206']);

  /* ---------- التخزين ---------- */
  const readJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  let cat = readJSON(LS_CAT, null);
  /* ===== وما لم يُنشر يُعلَّم =====
     الكتالوجُ يُحرَّر ههنا ويُنشر بزرٍّ في لوحٍ آخر. فمن أضاف مادّةً ظنّ أنّه
     فرغ، ثمّ فتح الموقعَ فجذب الكتالوجَ من الخادم — **فمحا تعديلَه**، لأنّ
     الدرجَ واحدٌ والخادمُ لا يعرف ما لم يُنشر. وقع مرّتين بصاحب الموقع.
     فيُعلَّم المحرَّرُ ‎dirty‎: يمتنع الموقعُ عن محوه، ويُقال ههنا إنّه ينتظر نشرًا. */
  /* ===== والنشرُ يقع مع التعديل =====
     كان زرًّا في لوحٍ آخر، فمن أضاف مادّةً ظنّ أنّه فرغ ولم تصل الناسَ —
     وهو ظنٌّ في محلّه: لوحةُ الأدمن **هي** موضعُ القرار، فلا يُطلب قرارٌ ثانٍ
     على قرار. فما حُرِّر ههنا يبلغ الخادمَ من نفسِه.

     ===== ويُؤجَّل قليلًا لا يُتبع كلَّ حرف =====
     تحريرُ اسمٍ يقع حرفًا حرفًا، فلو رُفع مع كلٍّ لَبلغ الخادمَ عشرُ نسخٍ لكلمة.
     فثانيةٌ ونصفٌ بعد آخر تبديل — قريبةٌ لا تُحسّ، وكافيةٌ لتجمع الحروف. */
  let catT = 0;
  const saveCat = () => {
    if (cat) cat.dirty = 1;
    try { localStorage.setItem(LS_CAT, JSON.stringify(cat)); }
    catch (e) { toast('تعذّر الحفظ — مساحة التخزين ممتلئة'); }
    clearTimeout(catT);
    catT = setTimeout(catPublish, 1500);
  };

  async function catPublish() {
    if (!cat || !Array.isArray(cat.courses) || !cat.courses.length) return;
    cat.v = Date.now();
    let ok = false;
    try {
      const r = await fetch('/api/catalog', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tags: cat.tags || [], courses: cat.courses, v: cat.v }),
      });
      ok = r.ok;
    } catch (e) { ok = false; }
    /* ===== والعلامةُ لا تُرفع إلّا ببلوغٍ =====
       فإن تعثّر النشرُ بقيت ‎dirty‎، فلا يمحو الموقعُ التعديلَ (حارسُه يقرؤها)
       ويُعاد الرفعُ مع أوّل تبديلٍ بعده. ويُقال للمستخدم — صمتُ التعثّر أسوأُ
       من التعثّر. */
    if (ok) delete cat.dirty; else toast('لم يصل التعديل — سيُعاد مع أوّل تبديل');
    try { localStorage.setItem(LS_CAT, JSON.stringify(cat)); } catch (e) {}
  }
  /* ============================================================
     درجُ الموقع: يُقرأ ويُكتب كلُّه — فالكتابةُ العمياءُ محوٌ
     ============================================================
     اللوحةُ تقرأ ‎academia2:v1‎ لقطةً، ثمّ تكتبها كلَّها. ومحرّكُ الموقع
     يعمل **في هذي الصفحة نفسِها** ويكتب الدرجَ كلَّه كذلك في كلّ ‎save()‎.
     فكاتبان لدرجٍ واحد، ومن كتب أخيرًا محا عملَ الآخر بلا صياح.

     وأخطرُ منه: ‎readJSON(k, {})‎ تردّ ‎{}‎ إن تعثّرت القراءةُ لأيّ سبب — ثمّ
     تُكتب ‎{}‎ فوق الدرج. أترامٌ ومكتبةٌ وتواريخُ في سطرين.

     فثلاثةُ قيود:
       ١ · ‎app()‎ تصيح إن تعثّرت القراءةُ ولا تردّ خواءً صامتًا
       ٢ · و‎saveApp‎ ترفض أن تكتب درجًا بلا أترامٍ فوق درجٍ فيه أترام
       ٣ · وإن كان محرّكُ الموقع حاضرًا في الصفحة فهو صاحبُ الدرج: يُكتب
           بيده (‎acSaveState‎) فلا تُكتب لقطةٌ قديمةٌ فوق ما بنى */
  let appBad = false;
  /* ===== والحالُ الحيّةُ أوّلًا =====
     الدرجُ مُنقًّى: ما بلغ الخادمَ من المساهمات يُسقط منه ويُعاد جذبُه عند الإقلاع.
     فمن قرأه رأى المعلَّقَ من عمله وحدَه — ولم يرَ مساهمةَ غيره ألبتّة، ومنها
     اقتراحاتُ الدكاترة التي تصل من الناس.
     ومحرّكُ الموقع يعمل في هذي الصفحة نفسِها وحالُه هي التامّة، فتُقرأ منه.
     وهو أسلمُ كذلك: كانت اللوحةُ تقرأ اللقطةَ ثمّ تُلبسها الحالَ الحيّة، فتمحو
     من الذاكرة كلَّ ما جُذب حتّى الجذبةِ التالية.
     والدرجُ يبقى بديلًا إن غاب المحرّك — ومعه حارسُه ضدّ الدرج التالف. */
  const app = () => {
    if (typeof window.acState === 'function') { const live = window.acState(); if (live) return live; }
    let raw = null;
    try { raw = localStorage.getItem(LS_APP); } catch (e) { raw = null; }
    if (raw == null || raw === '') return {};
    try { return JSON.parse(raw) || {}; }
    catch (e) {
      appBad = true;
      toast('درج الموقع تالف — أُوقفت الكتابة حمايةً له');
      return null;                       /* لا خواءَ يُكتب فوق عمل */
    }
  };

  const saveApp = s => {
    if (appBad || !s) { toast('لم يُكتب شيء — الدرج غير مقروء'); return false; }
    let cur = null;
    try { cur = JSON.parse(localStorage.getItem(LS_APP) || 'null'); } catch (e) { cur = null; }
    if (cur && (cur.terms || []).length && !(s.terms || []).length) {
      toast('مُنعت كتابة كانت ستمحو الأترام — حدّث الصفحة');
      return false;
    }
    /* ===== والكاتبُ واحدٌ لا اثنان (م٤) =====
       المحرّكُ حاضرٌ في هذي الصفحة دائمًا (‎app.js‎ قبل ‎admin.js‎)، وحالتُه هي
       الحيّة ولقطتُنا قديمة. فيُكتب بيده — ويمرّ بحرّاسه: التجميدِ، ومنعِ
       النقصان، ونسخةِ النواة، ودفعِها إلى الحساب.
       وكان ثمّ طريقٌ احتياطيٌّ يكتب مباشرةً إن غاب المحرّك. ونُزع: غيابُه في
       هذي الصفحة ليس حالًا يُحتاط لها بل عطبٌ — والكتابةُ العمياءُ حينها أسوأُ
       من الوقوف. */
    if (typeof window.acSaveState !== 'function') {
      toast('محرّك الموقع لم يُحمَّل — لم يُكتب شيء');
      return false;
    }
    if (!window.acSaveState(s)) { toast('تعذّر الحفظ — انظر شريط الإنذار'); return false; }
    return true;
  };

  /* الاسم العربي المختصر لمادة الموقع: «احصاء 214» من الكود + جدول الأقسام */
  function arShort(code) {
    const sp = code.indexOf(' ');
    if (sp < 0) return code;
    const dept = code.slice(0, sp);
    return `${(typeof DEPT_AR !== 'undefined' && DEPT_AR[dept]) || dept} ${code.slice(sp + 1)}`;
  }

  /* البذرة الأولى: مواد الموقع الحالية تُستورد كأن الأدمن أضافها، وكلها تحت تخصص «نظم المعلومات» */
  const MIS = { id: 'mis', ar: 'نظم المعلومات', en: 'MIS' };
  function seedCatalog() {
    const courses = (typeof COURSES !== 'undefined' ? COURSES : []).map(c => ({
      code: c.code,               /* الاسم الإنجليزي = مفتاح المادة في كل الموقع */
      ar: arShort(c.code),        /* الاسم العربي المختصر المعروض */
      full: c.ar || '',           /* الاسم الكامل (تلميح وبحث) */
      h: c.h || 0,
      lab: SEED_LABS.has(c.code),
      tags: [MIS.id],
    }));
    cat = { tags: [Object.assign({}, MIS)], courses, v: 2 };
    saveCat();
  }
  if (!cat || !Array.isArray(cat.courses)) seedCatalog();
  cat.tags = cat.tags || [];
  cat.courses = cat.courses || [];
  /* ترقية الكتالوج (٢): وسوم الكليات الثلاث تُستبدل بتخصص واحد «نظم المعلومات» على كل المواد */
  if (cat.v !== 2) {
    cat.tags = [Object.assign({}, MIS)];
    cat.courses.forEach(c => { c.tags = [MIS.id]; });
    cat.v = 2;
    saveCat();
  }

  /* ---------- إشعار ---------- */
  let toastT = 0;
  function toast(msg) {
    const el = $('#a-toast');
    el.textContent = msg;
    clearTimeout(toastT);
    requestAnimationFrame(() => el.classList.add('on'));
    toastT = setTimeout(() => el.classList.remove('on'), 2400);
  }

  /* ---------- التبويبات ---------- */
  const PANELS = ['tags', 'courses', 'docs', 'posts', 'time', 'people'];
  $('#a-tabs').addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    document.querySelectorAll('#a-tabs button').forEach(x => x.classList.toggle('on', x === b));
    PANELS.forEach(p => { $('#a-panel-' + p).hidden = p !== b.dataset.tab; });
    if (b.dataset.tab === 'docs') { renderDocs(); drxSync($('#d-course').value); }
    if (b.dataset.tab === 'time') { fillTlSelects(); renderTimeline(); }
    if (b.dataset.tab === 'people') peopleOpen();
    if (b.dataset.tab === 'posts') whoPaint();   /* ويُعاد الطلاءُ لا الجلسة: whoPaint تعرف */
  });

  /* ============================================================
     المستخدمون — مَن سجّل في الموقع
     ============================================================
     صورةٌ واسمٌ وبريدٌ وما صنعوا. ولا يُعرض ما لا يُحتاج: لا كلمةَ سرٍّ ولا
     تجزئتَها، ولا رمزَ استرجاع، ولا جلساتٍ ولا أجهزة — تلك أسرارُهم لا أخبارُهم.
     والنقطةُ نفسُها لا تردّها أصلًا، فالسترُ في الخادم لا في الشاشة.

     ===== ومن لا صورةَ له يُرسم له حرفُه =====
     مربّعٌ خاوٍ يجعل الصفَّ ناقصًا، والحرفُ الأوّلُ في دائرةٍ يميّز الوجوهَ في
     قائمةٍ طويلةٍ بلا أن يدّعي صورةً ليست له. */
  let people = [];

  const pAv = function (u) {
    if (u.img) return '<img class="p-av" src="' + gEsc(u.img) + '" alt="">';
    var ch = (u.name || u.email || '؟').trim().charAt(0);
    return '<span class="p-av p-av--tx">' + gEsc(ch) + '</span>';
  };
  const pDate = function (ts) {
    if (!ts) return '—';
    var d = new Date(ts * 1000);
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
  };

  async function peopleOpen() {
    const gate = $('#p-gate'), body = $('#p-body');
    gate.hidden = false; body.hidden = true;
    gate.textContent = 'جارٍ السؤال…';
    const r = await gAsk('users');
    if (!r.ok) {
      gate.innerHTML = r.status === 404
        /* ولا تُحال على تابٍ آخر: القفلُ صار حجّةً بنفسه، فمن بلغ اللوحةَ بلغ
           هذا. وإن رُدّ فالكوكيُّ انتهى — والعلاجُ إعادةُ الفتح لا التنقّل */
        ? 'انتهت جلسةُ القفل — حدّث الصفحة واكتب كلمة المرور.'
        : 'تعذّر الوصول إلى الخادم.';
      return;
    }
    gate.hidden = true; body.hidden = false;
    people = r.j.users || [];
    peoplePaint('');
  }

  function peoplePaint(q) {
    q = (q || '').trim().toLowerCase();
    const list = q
      ? people.filter(u => ((u.name || '') + ' ' + (u.email || '')).toLowerCase().indexOf(q) > -1)
      : people;
    $('#p-count').textContent = q
      ? list.length + ' من ' + people.length
      : people.length + (people.length === 1 ? ' مستخدم' : ' مستخدمًا');
    if (!list.length) {
      $('#p-grid').innerHTML = '<p class="g-empty">' + (q ? 'لا أحدَ يطابق البحث.' : 'ما سجّل أحدٌ بعد.') + '</p>';
      return;
    }
    $('#p-grid').innerHTML = list.map(u => `<div class="p-card">
      ${pAv(u)}
      <div class="p-who">
        <b class="p-nm">${gEsc(u.name || '—')}</b>
        ${u.admin ? '<span class="g-chip g-chip--boss">مشرف</span>' : ''}
        ${u.banned ? '<span class="g-chip g-chip--ban">ممنوع</span>' : ''}
        <button type="button" class="p-mail" data-mail="${gEsc(u.email)}" title="انسخ البريد">${gEsc(u.email)}</button>
        <span class="p-meta">${u.posts | 0} مساهمة · ${u.cmts | 0} تعليق · سجّل ${pDate(u.created)}</span>
      </div>
    </div>`).join('');
  }

  $('#a-panel-people').addEventListener('input', e => {
    if (e.target.id === 'p-find') peoplePaint(e.target.value);
  });

  $('#a-panel-people').addEventListener('click', async e => {
    /* والبريدُ يُنسخ بالنقر عليه: هو ما يُبلَّغ به من سجّل */
    const one = e.target.closest('[data-mail]');
    if (one) {
      const was = one.textContent;
      try { await navigator.clipboard.writeText(one.dataset.mail); } catch (er) { /* يُحدَّد بيد */ }
      one.textContent = 'نُسخ ✓';
      setTimeout(() => { one.textContent = was; }, 1200);
      return;
    }
    const all = e.target.closest('#p-copy');
    if (all) {
      /* والمعروضُ لا الكلُّ: من بحث أراد ما بحث عنه */
      const q = ($('#p-find').value || '').trim().toLowerCase();
      const list = q ? people.filter(u => ((u.name || '') + ' ' + (u.email || '')).toLowerCase().indexOf(q) > -1) : people;
      const txt = list.map(u => u.email).filter(Boolean).join(', ');
      try { await navigator.clipboard.writeText(txt); } catch (er) { /* لا حافظة */ }
      all.textContent = 'نُسخ ' + list.length + ' ✓';
      setTimeout(() => { all.textContent = 'انسخ البُرُد'; }, 1600);
      return;
    }
  });

  /* ---------- اللوحةُ تنشر باسم «أكاديميا» — دائمًا ----------
     المكتبةُ المطعَّمةُ هي الموقعُ بعينه، فجلستُك فيها جلستُك في الموقع (الكوكيّ
     واحدٌ والأصلُ واحد). لكنّ شريطَ الموقع الجانبيَّ مطروحٌ ههنا، فلا يُعرف باسمِ
     من تنشر — فيُقال صراحةً في أعلى اللوح.

     ===== ولا تُتَّخذ جلسةٌ قائمةٌ هويّةً =====
     كانت تُسأل ‎‎/me‎‎ أوّلًا، فإن وُجدت جلسةٌ اتُّخذت. والكوكيُّ للأصل كلِّه — فمن
     دخل الموقعَ الأساسيَّ بحسابه ثمّ فتح اللوحةَ وجدها **تنشر باسمه هو**. فصارت
     أغلفةُ الكتب في اللوحة منسوبةً إلى طالب. وهذا ما وقع، وهو ما شكاه صاحبُ
     الموقع: يجدها في اللوحة باسمه ولا يجدها كذلك في الموقع.

     فبابُ «أكاديميا» اللوحةُ وحدَها (‎authSync‎ ترفضه في الموقع)، واللوحةُ
     «أكاديميا» وحدَها. الاتّجاهان معًا يجعلان الحسابَ والمكانَ شيئًا واحدًا.

     ===== وثمنُه أنّ الكوكيَّ واحد =====
     فتحُ اللوحة يُبدّل جلسةَ هذا المتصفّح إلى الموقع، فمن كان داخلًا بحسابه
     خرج منه. ولا مهرب: أصلٌ واحدٌ وكوكيٌّ واحد. */
  const SITE_UID = 'u-academia';

  async function whoPaint() {
    const el = $('#a-who'); if (!el) return;
    el.hidden = false;
    el.innerHTML = '<span class="a-who__t">…</span>';
    let u = null;
    try {
      /* `x-as: site` — read the site's login, not the reader's. The two now
         live in separate cookies, so opening this page no longer signs the
         reader out of the main site. */
      const r = await fetch('/api/auth/me',
        { credentials: 'same-origin', cache: 'no-store', headers: { 'x-as': 'site' } });
      if (r.ok) u = (await r.json()).user;
    } catch (e) { /* لا شبكة */ }

    /* وما لم تكن الجلسةُ جلسةَ الموقع أصلًا، تُفتح جلستُه — كائنًا من كان الداخل */
    if (!u || u.id !== SITE_UID) {
      try {
        const r = await fetch('/api/auth/site',
          { method: 'POST', credentials: 'same-origin', headers: { 'x-as': 'site' } });
        if (r.ok) u = (await r.json()).user;
      } catch (e) { /* لا شبكة: تبقى الجلسةُ القائمة */ }
    }

    /* ويُعلَم المحرّكُ بمن نحن: أخذُ الكوكيّ وحدَه لا يكفي — ‎state.uid‎ فيه هو
       الذي يميّز مساهماتِك من مساهمات غيرك عند الجذب. ولولا هذا لَجُذبت
       مساهماتُك نسخةً ثانيةً بـ‎me:false‎ فلم تُحرَّر. */
    if (u && window.acSessionChanged) window.acSessionChanged(u);

    if (u) {
      el.className = 'a-who is-in';
      el.innerHTML = '<span class="a-who__t">تنشر باسم <b>' + gEsc(u.name || u.email) + '</b>'
        + ' — ما تكتبه في المكتبة يظهر للناس بهذا الاسم.</span>';
    } else {
      el.className = 'a-who is-out';
      el.innerHTML = '<span class="a-who__t">تعذّر فتحُ جلسةِ الموقع — تحقّق من اتصالك.</span>';
    }
  }

  /* ============================================================
     الإشراف — النافذةُ الوحيدةُ على الخادم
     ============================================================
     سائرُ اللوحة تعمل على درجِ فاتحها؛ وهذا البابُ يسأل الخادمَ ويكتب فيه.
     ولا يُفتح إلّا لصاحب الموقع: الخادمُ يردّ ‎404‎ لمن سواه — لا ‎403‎، فالثانيةُ
     تُخبر الغريبَ أنّ ههنا بابًا.

     ===== ولا يُبنى شيءٌ قبل أن يُسأل =====
     اللوحُ يبدأ بسطرٍ «جارٍ السؤال»، فإن رُدَّ قيل ذلك ولم يُرسم جدولٌ خاوٍ
     يُوهم أنّ الموقعَ فارغٌ وإنّما البابُ مغلق.

     ===== وكلُّ فعلٍ يُسأل عنه مرّتين =====
     المحوُ والمنعُ لا رجعةَ لهما، فيُطلبان بضغطتين: الأولى تُحوّل الزرَّ إلى
     «متأكّد؟» والثانية تُمضي. وهو نمطُ «حذف الحساب» في الموقع نفسِه. */
  const API = '/api/admin/';
  let gUsers = [];

  const gAsk = async (path, opt) => {
    const r = await fetch(API + path, Object.assign({ credentials: 'same-origin' }, opt || {}));
    let j = null; try { j = await r.json(); } catch (e) { /* ردٌّ بلا متن */ }
    return { ok: r.ok, status: r.status, j: j || {} };
  };
  const gEsc = t => String(t == null ? '' : t)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const gKb = n => n < 1024 ? n + ' ب' : n < 1048576 ? (n / 1024).toFixed(0) + ' ك' : (n / 1048576).toFixed(1) + ' م';



  /* ============================================================
     ١) التخصصات
     ============================================================ */
  let tagEdit = null;   // معرّف التخصص قيد التعديل

  function renderTags() {
    const host = $('#tag-list');
    host.innerHTML = cat.tags.length
      ? cat.tags.map(t => {
          const used = cat.courses.filter(c => (c.tags || []).includes(t.id)).length;
          return `<div class="a-item" data-tag="${esc(t.id)}">
            <div class="a-item__main">
              <span class="a-item__t">${esc(t.ar)}${t.en ? `<span class="a-en">${esc(t.en)}</span>` : ''}</span>
              <span class="a-item__sub">${used} مادة</span>
            </div>
            <div class="a-acts">
              <button type="button" class="a-btn" data-act="edit">تعديل</button>
              <button type="button" class="a-btn a-btn--del" data-act="del">حذف</button>
            </div>
          </div>`;
        }).join('')
      : `<p class="a-empty">لا تخصصات بعد — أضِف أولها من الأعلى.</p>`;
    renderTagChips();
    renderStats();
  }

  $('#tag-form').addEventListener('submit', e => {
    e.preventDefault();
    const ar = $('#tag-ar').value.trim(), en = $('#tag-en').value.trim();
    if (!ar) return;
    if (tagEdit) {
      const t = cat.tags.find(x => x.id === tagEdit);
      if (t) { t.ar = ar; t.en = en; }
      tagEdit = null;
      $('#tag-save').textContent = 'إضافة التخصص';
      $('#tag-cancel').hidden = true;
      toast('حُدّث التخصص');
    } else {
      if (cat.tags.some(t => t.ar === ar)) { toast('هذا التخصص موجود'); return; }
      cat.tags.push({ id: 't' + Date.now().toString(36), ar, en });
      toast(`أُضيف «${ar}»`);
    }
    saveCat();
    $('#tag-ar').value = ''; $('#tag-en').value = '';
    renderTags();
  });

  $('#tag-cancel').addEventListener('click', () => {
    tagEdit = null;
    $('#tag-ar').value = ''; $('#tag-en').value = '';
    $('#tag-save').textContent = 'إضافة التخصص';
    $('#tag-cancel').hidden = true;
  });

  $('#tag-list').addEventListener('click', e => {
    const row = e.target.closest('[data-tag]'); if (!row) return;
    const id = row.dataset.tag, t = cat.tags.find(x => x.id === id);
    const act = (e.target.closest('[data-act]') || {}).dataset;
    if (!t || !act) return;
    if (act.act === 'edit') {
      tagEdit = id;
      $('#tag-ar').value = t.ar; $('#tag-en').value = t.en || '';
      $('#tag-save').textContent = 'حفظ التعديل';
      $('#tag-cancel').hidden = false;
      $('#tag-ar').focus();
    } else if (act.act === 'del') {
      const used = cat.courses.filter(c => (c.tags || []).includes(id)).length;
      if (!confirm(`حذف «${t.ar}»؟${used ? `\nسيُزال من ${used} مادة.` : ''}`)) return;
      cat.tags = cat.tags.filter(x => x.id !== id);
      cat.courses.forEach(c => { c.tags = (c.tags || []).filter(x => x !== id); });
      saveCat(); renderTags(); renderCourses();
      toast('حُذف التخصص');
    }
  });

  /* وسوم التخصصات داخل نموذج المادة */
  let pickedTags = [];
  function renderTagChips() {
    $('#c-tags').innerHTML = cat.tags.length
      ? cat.tags.map(t => `<button type="button" class="a-chip${pickedTags.includes(t.id) ? ' on' : ''}" data-tid="${esc(t.id)}">${esc(t.ar)}</button>`).join('')
      : `<span class="a-none">لا تخصصات بعد — أضِفها من تبويب «التخصصات».</span>`;
  }
  $('#c-tags').addEventListener('click', e => {
    const b = e.target.closest('[data-tid]'); if (!b) return;
    const id = b.dataset.tid;
    pickedTags = pickedTags.includes(id) ? pickedTags.filter(x => x !== id) : pickedTags.concat(id);
    renderTagChips();
  });

  /* ============================================================
     ٢) المواد
     ============================================================ */
  let courseEdit = null;   // كود المادة قيد التعديل
  let actLab = false;

  $('#c-act').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    actLab = b.dataset.act === 'lab';
    document.querySelectorAll('#c-act .a-seg').forEach(x => x.classList.toggle('on', x === b));
  });

  function resetCourseForm() {
    courseEdit = null; pickedTags = []; actLab = false;
    $('#c-ar').value = ''; $('#c-en').value = ''; $('#c-h').value = 3;
    document.querySelectorAll('#c-act .a-seg').forEach((x, i) => x.classList.toggle('on', i === 0));
    $('#c-save').textContent = 'إضافة المادة';
    $('#c-cancel').hidden = true;
    renderTagChips();
  }
  $('#c-cancel').addEventListener('click', resetCourseForm);

  $('#course-form').addEventListener('submit', e => {
    e.preventDefault();
    const ar = $('#c-ar').value.trim(), code = $('#c-en').value.trim().replace(/\s+/g, ' ');
    const h = Math.max(0, +$('#c-h').value || 0);
    if (!ar || !code) return;
    const dup = cat.courses.find(c => c.code === code);
    if (courseEdit) {
      const c = cat.courses.find(x => x.code === courseEdit);
      if (!c) return;
      if (code !== courseEdit && dup) { toast('الاسم الإنجليزي مستعمل في مادة أخرى'); return; }
      if (code !== courseEdit) migrateCode(courseEdit, code);
      Object.assign(c, { code, ar, h, lab: actLab, tags: pickedTags.slice() });
      toast('حُدّثت المادة');
    } else {
      if (dup) { toast('هذه المادة موجودة'); return; }
      cat.courses.push({ code, ar, full: '', h, lab: actLab, tags: pickedTags.slice() });
      toast(`أُضيفت «${ar}»`);
    }
    saveCat(); resetCourseForm(); renderCourses(); fillCourseSelects();
  });

  /* تغيير الاسم الإنجليزي = تغيير مفتاح المادة: تُنقل معه مساهماتها وصورتها وأترامها */
  function migrateCode(oldC, newC) {
    const s = app();
    if (s.cinfo && s.cinfo[oldC]) { s.cinfo[newC] = s.cinfo[oldC]; delete s.cinfo[oldC]; }
    if (s.imgs && s.imgs[oldC]) { s.imgs[newC] = s.imgs[oldC]; delete s.imgs[oldC]; }
    Object.keys(s.libs || {}).forEach(t => {
      (s.libs[t] || []).forEach(en => { if (en.code === oldC) en.code = newC; });
    });
    saveApp(s);
  }

  function tagName(id) { const t = cat.tags.find(x => x.id === id); return t ? t.ar : id; }

  function renderCourses() {
    const q = ($('#c-search').value || '').trim();
    const list = q
      ? cat.courses.filter(c => (c.ar + ' ' + c.code + ' ' + (c.full || '')).includes(q))
      : cat.courses;
    $('#c-count').textContent = `${list.length} مادة`;
    $('#course-list').innerHTML = list.length
      ? list.map(c => `<div class="a-item" data-code="${esc(c.code)}">
          <div class="a-item__main">
            <span class="a-item__t">${esc(c.ar)}<span class="a-en">${esc(c.code)}</span></span>
            <span class="a-item__sub">
              <span class="a-h">${c.h} س</span>
              ${c.lab ? `<span class="a-lab">معمل</span>` : ''}
              ${(c.tags || []).map(t => `<span class="a-tag">${esc(tagName(t))}</span>`).join('')}
            </span>
          </div>
          <div class="a-acts">
            <button type="button" class="a-btn" data-act="edit">تعديل</button>
            <button type="button" class="a-btn a-btn--del" data-act="del">حذف</button>
          </div>
        </div>`).join('')
      : `<p class="a-empty">${q ? 'لا مادة تطابق البحث.' : 'لا مواد بعد — أضِف أولها من الأعلى.'}</p>`;
    renderStats();
  }
  $('#c-search').addEventListener('input', renderCourses);

  $('#course-list').addEventListener('click', e => {
    const row = e.target.closest('[data-code]'); if (!row) return;
    const code = row.dataset.code, c = cat.courses.find(x => x.code === code);
    const act = (e.target.closest('[data-act]') || {}).dataset;
    if (!c || !act) return;
    if (act.act === 'edit') {
      courseEdit = code; pickedTags = (c.tags || []).slice(); actLab = !!c.lab;
      $('#c-ar').value = c.ar; $('#c-en').value = c.code; $('#c-h').value = c.h;
      document.querySelectorAll('#c-act .a-seg').forEach(x => x.classList.toggle('on', (x.dataset.act === 'lab') === actLab));
      $('#c-save').textContent = 'حفظ التعديل';
      $('#c-cancel').hidden = false;
      renderTagChips();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act.act === 'del') {
      const s = app();
      const posts = countPosts(s, code);
      if (!confirm(`حذف «${c.ar}»؟${posts ? `\nلها ${posts} مساهمة ستبقى في التخزين لكن لن تظهر.` : ''}`)) return;
      cat.courses = cat.courses.filter(x => x.code !== code);
      saveCat(); renderCourses(); fillCourseSelects();
      toast('حُذفت المادة');
    }
  });

  /* ============================================================
     ٣) الدكاترة — وسوم لكل مادة (اسم + صورة) تُكتب في cinfo[code].doctors
     ============================================================ */
  let docImg = '';        // صورة الدكتور (dataURL مصغَّرة)
  let docEdit = null;     // معرّف الدكتور قيد التعديل

  /* ===== والمادةُ المختارةُ تبقى بعد تحديث الصفحة =====
     كان الاختيارُ يُستعاد من قيمة القائمة نفسِها (‎el.value‎) — وهي فارغةٌ عند
     أوّل ملءٍ بعد التحميل، فتقع القائمةُ على **أوّل مادّةٍ في الكتالوج** صامتةً.
     فمن أضاف دكتورًا لمادّةٍ ثمّ حدّث الصفحة لم يجده: الدكتورُ في مادّته، والقائمةُ
     تعرض مادّةً أخرى. وقد وقع، وقيل «انضاف ثمّ اختفى».
     فتُحفظ كما يُحفظ تصفيةُ الخيط الزمنيّ (‎LS_TL‎) — العادةُ نفسُها في هذا الملفّ.
     و‎sessionStorage‎ لا ‎localStorage‎: هي حالُ نظرةٍ لا تفضيلٌ يدوم. */
  const LS_DOC = 'academia2:admin:doc';
  const docCourseSaved = () => { try { return sessionStorage.getItem(LS_DOC) || ''; } catch (e) { return ''; } };
  const docCourseKeep = c => { try { sessionStorage.setItem(LS_DOC, c || ''); } catch (e) {} };

  /* ===== وتصفيةُ القائمة: المواد عشراتٌ والشريطُ مشوار =====
     تُكتب حروفٌ فتقصر القائمة. والمقارنةُ على ما يُعرض وما يُكتب معًا: الاسمُ
     العربيُّ والرمزُ والاسمُ الكامل — كما في بحث تبويب المواد (‎#c-search‎)، عادةٌ
     واحدةٌ لا اثنتان.
     ===== والمختارةُ لا تسقط بالتصفية أبدًا =====
     لو صُفّيت خارجَ القائمة لَاختار المتصفّحُ أوّلَ الباقين صامتًا — وهو عينُ العطب
     الذي أُصلح قبل قليل: «أضفتُ دكتورًا ثمّ لم أجده». فتُلحق دائمًا ولو لم تطابق،
     فلا يتبدّل اختيارُك إلّا بيدك. */
  /* ===== ومادّةٌ لها معملٌ صفّان لا صفٌّ واحد =====
     المحاضرةُ والمعملُ نشاطان مستقلّان في هذا الموقع: مساهماتُهما تُخزَّن تحت
     مفتاحين (‎«ICS 104»‎ و‎«ICS 104::معمل»‎)، ولكلٍّ دكاترتُه — والمعملُ يُدرّسه غيرُ
     من يُدرّس المحاضرة في الغالب. فالقائمةُ تعرضهما بندين، وينفصل عندهما كلُّ شيء:
     الدكاترةُ المضافون، والاقتراحاتُ الواصلة.
     والمفتاحُ يُبنى بالصيغة التي يبنيها بها الموقعُ نفسُه (‎code + '::معمل'‎)، فلا
     صيغتان لمفتاحٍ واحد. */
  const LAB_SUFFIX = '::معمل';
  function courseKeys() {
    const out = [];
    cat.courses.forEach(c => {
      out.push({ key: c.code, c: c });
      if (c.lab) out.push({ key: c.code + LAB_SUFFIX, c: c });
    });
    return out;
  }
  const courseMatch = (c, q) =>
    !q || (c.ar + ' ' + c.code + ' ' + (c.full || '')).toLowerCase().includes(q);

  function fillCourseSelects() {
    const el = $('#d-course'); if (!el) return;
    const q = (($('#d-search') || {}).value || '').trim().toLowerCase();
    const keep = el.value || docCourseSaved();
    const all = courseKeys();
    const hit = all.filter(x => courseMatch(x.c, q));
    const list = (keep && !hit.some(x => x.key === keep))
      ? hit.concat(all.filter(x => x.key === keep))
      : hit;
    el.innerHTML = list
      .map(x => `<option value="${esc(x.key)}">${esc(courseLabel(x.key))} — ${esc(x.c.code)}</option>`)
      .join('');
    if (keep && list.some(x => x.key === keep)) el.value = keep;
    const cnt = $('#d-count');
    if (cnt) cnt.textContent = q ? `${hit.length} من ${all.length}` : '';
  }
  /* ولا يُعاد رسمُ قائمة الدكاترة إلّا إن تبدّلت المادّة — والتصفيةُ لا تبدّلها */
  const dSearch = $('#d-search');
  if (dSearch) dSearch.addEventListener('input', () => {
    const was = $('#d-course').value;
    fillCourseSelects();
    if ($('#d-course').value !== was) renderDocs();
  });

  const drAvatar = d => d.img ? `<img src="${d.img}" alt="">` : esc((d.name || '؟').trim().charAt(0));

  function docsOf(s, code) {
    s.cinfo = s.cinfo || {};
    s.cinfo[code] = s.cinfo[code] || { desc: '', rel: 0, docs: [] };
    s.cinfo[code].doctors = s.cinfo[code].doctors || [];
    return s.cinfo[code].doctors;
  }

  /* ============================================================
     SUGGESTED INSTRUCTORS
     ============================================================
     A reader who cannot find an instructor in a course's filter list sends a
     suggestion from the site. It arrives here as an ordinary contribution in
     the `drx` section of that course -- name in Arabic, name in English, photo,
     and the server's record of who sent it.

     WHAT COUNTS AS PENDING
     A suggestion is pending until an instructor in this course carries its id.
     There is no second list of "handled" ones to keep in step: approving writes
     `fromId` onto the instructor it creates, and that IS the record. Delete the
     instructor and the suggestion comes back -- which is right, it was never
     dealt with.

     WHAT APPROVING DOES
     It adds the instructor to this course exactly as adding one by hand does,
     keeping the photo and both names, plus who suggested it. From that moment
     it is an ordinary instructor with edit and delete beside it. */
  const drxOf = (s, code) => (((s.cinfo || {})[code] || {}).posts || {}).drx || [];

  function drxPending(s, code) {
    const taken = {};
    (((s.cinfo || {})[code] || {}).doctors || []).forEach(d => { if (d.fromId) taken[d.fromId] = 1; });
    return drxOf(s, code).filter(p => p && p.id && !taken[p.id]);
  }

  /* من اقترحه: اسمُه وصورتُه من الخادم (‎u‎ على المساهمة) — ولوحةُ الأدمن لا تخترعهما */
  const drxWho = p => (p.u || {});

  /* ===== ولا تُعرض اقتراحاتٌ لم تُطلب =====
     المساهماتُ تُجذب مادّةً مادّة حين تُفتح المادّة في الموقع — واللوحةُ تعرض مادّةً
     لا تفتحها، فذاكرتُها منها خالية.
     ===== وتُسأل كلَّما نظرتَ، لا مرّةً في الجلسة =====
     كان السؤالُ مرّةً واحدةً لكلّ مادّة، فمن فتح التبويبَ ثمّ وصل اقتراحٌ لم يره
     حتّى يُحدّث الصفحة. فيُسأل عند كلّ فتحٍ للتبويب وكلّ تبديلٍ للمادّة — وهما
     فعلا إنسانٍ لا رسمة، فلا تدور الرسمةُ على نفسها.
     و‎drxBusy‎ يمنع طلبين متلاحقين لمادّةٍ واحدة، لا أكثر. */
  const drxBusy = {};
  function drxSync(code) {
    if (!code || drxBusy[code] || typeof window.acPull !== 'function') return;
    drxBusy[code] = 1;
    Promise.resolve(window.acPull(code, true))
      .catch(() => {})
      .then(() => { delete drxBusy[code]; renderDrx(); });
  }

  /* ===== وأين ينتظر ما ليس في هذه المادّة؟ =====
     العمودُ يعرض اقتراحاتِ المادّة المختارة وحدَها — وهو المطلوب. لكنّ من أرسل
     اقتراحًا لمادّةٍ ثمّ فتح اللوحةَ على غيرها قال «لم يصل»، والاقتراحُ واصلٌ
     ينتظر في مادّته. وقد وقع، وضاع فيه وقت.
     فيُسأل الخادمُ مرّةً واحدةً عن مساهماته (‎/api/admin/posts‎ يردّ المادّةَ والبندَ
     لكلّ واحدة)، فيُقال أين ينتظر الباقي — ويُنقر فيُفتح. ولا يُعدّ ما اعتُمد:
     الدكتورُ يحمل معرّفَ اقتراحه (‎fromId‎)، وهو سجلُّ الاعتماد نفسُه.
     ويحتاج جلسةَ القفل؛ فإن لم تكن سكت ولم يُعطّل شيئًا. */
  let drxMap = null;
  async function drxWhere() {
    if (drxMap) return drxMap;
    let r = null;
    try { r = await gAsk('posts?limit=200'); } catch (e) { r = null; }
    drxMap = (r && r.ok ? (r.j.posts || []) : [])
      .filter(p => p && p.sec === 'drx').map(p => ({ code: p.code, id: p.id }));
    return drxMap;
  }
  function paintDrxWhere() {
    const el = $('#drx-where'); if (!el) return;
    const cur = $('#d-course').value, s = app(), by = {};
    (drxMap || []).forEach(x => {
      if (x.code === cur) return;
      const docs = (((s.cinfo || {})[x.code] || {}).doctors) || [];
      if (docs.some(d => d.fromId === x.id)) return;   /* اعتُمد، فلا ينتظر */
      by[x.code] = (by[x.code] || 0) + 1;
    });
    const keys = Object.keys(by);
    el.innerHTML = keys.length
      ? 'وتنتظر في: ' + keys.map(c =>
          `<button type="button" class="a-jump" data-jump="${esc(c)}">${esc(courseLabel(c))} (${by[c]})</button>`
        ).join(' · ')
      : '';
  }
  /* ===== والقفزةُ واحدةٌ لسطرَي الدليل =====
     «وتنتظر في» و«ولهم دكاترة في» يقولان الشيءَ نفسَه: ثَمّ شيءٌ في مادّةٍ أخرى.
     فمُمسكٌ واحدٌ لهما. والمفتاحُ يُلحق بالقائمة إن لم يكن فيها — فمفتاحٌ خارجَ
     الكتالوج يُبلَغ ولا يبقى خبرًا لا يُنقر، وهو الذي كان يُخفي دكتورًا تسرّب. */
  function jumpTo(key) {
    const sel = $('#d-course');
    if (![].some.call(sel.options, o => o.value === key)) {
      sel.insertAdjacentHTML('beforeend',
        `<option value="${esc(key)}">${esc(courseLabel(key))} — ${esc(key)}</option>`);
    }
    sel.value = key;
    cancelDoc(); renderDocs(); drxSync(key);
  }
  ['#drx-where', '#doc-where'].forEach(q => {
    const host = $(q); if (!host) return;
    host.addEventListener('click', e => {
      const b = e.target.closest('[data-jump]');
      if (b) jumpTo(b.dataset.jump);
    });
  });

  function renderDrx() {
    const code = $('#d-course').value;
    const host = $('#drx-list'); if (!host) return;
    drxWhere().then(paintDrxWhere).catch(() => {});
    const list = code ? drxPending(app(), code) : [];
    const n = $('#drx-n');
    if (n) n.textContent = list.length ? String(list.length) : '';
    host.innerHTML = list.length
      ? list.map(p => {
          const d = p.data || {}, w = drxWho(p);
          return `<div class="a-item a-item--drx" data-drx="${esc(p.id)}">
            <span class="a-av">${d.img ? `<img src="${esc(d.img)}" alt="">` : esc((d.ar || '؟').trim().charAt(0))}</span>
            <div class="a-item__main">
              <span class="a-item__t">${esc(d.ar) || '—'}${d.en ? `<span class="a-en">${esc(d.en)}</span>` : ''}</span>
              <span class="a-item__sub a-by">
                <span class="a-by__av">${w.img ? `<img src="${esc(w.img)}" alt="">` : esc((w.name || '؟').trim().charAt(0))}</span>
                اقترحه ${esc(w.name || 'مساهم')}
              </span>
            </div>
            <div class="a-acts">
              <button type="button" class="a-btn a-btn--gold" data-act="ok">اعتماد</button>
            </div>
          </div>`;
        }).join('')
      : `<p class="a-empty">لا اقتراحات في «${esc(courseLabel(code))}».</p>`;
  }

  $('#drx-list').addEventListener('click', e => {
    const row = e.target.closest('[data-drx]'); if (!row) return;
    if (!e.target.closest('[data-act="ok"]')) return;
    const code = $('#d-course').value, s = app();
    const p = drxOf(s, code).find(x => x && x.id === row.dataset.drx);
    if (!p) return;
    const d = p.data || {}, w = drxWho(p);
    if (!confirm(`اعتماد «${d.ar || '—'}» دكتورًا في «${courseLabel(code)}»؟`)) return;
    docsOf(s, code).push({
      id: 'd' + Date.now().toString(36), name: d.ar || '', en: d.en || '', img: d.img || '',
      /* ‏‎fromId‎ هو سجلُّ الاعتماد نفسُه: به يُعرف أنّ الاقتراحَ عُولج */
      fromId: p.id,
      me: false, u: { name: 'الأدمن' }, by: { name: w.name || '', img: w.img || '' },
      ts: Date.now(), posts: [],
    });
    if (saveApp(s)) { renderDocs(); toast(`اعتُمد «${d.ar || '—'}»`); }
  });

  /* ===== وأين دكاترةُ المواد الأخرى؟ =====
     الدكاترةُ يسكنون الدرجَ تحت مفتاح مادّتهم، والقائمةُ تعرض المفتاحَ المختار
     وحدَه. فمن كان له دكتورٌ تحت مفتاحٍ لا يخطر بباله — معملُ مادّةٍ مثلًا، أو
     مفتاحٌ ليس في الكتالوج أصلًا — لم يجده أبدًا، ولا شيءَ يقول له أين هو.
     ولا يحتاج هذا خادمًا: الدرجُ بين يدي اللوحة، فيُعدُّ ما فيه ويُقال. */
  function paintDocWhere() {
    const el = $('#doc-where'); if (!el) return;
    const cur = $('#d-course').value, s = app(), by = {};
    Object.keys((s.cinfo || {})).forEach(k => {
      if (k === cur) return;
      const n = ((((s.cinfo || {})[k] || {}).doctors) || []).length;
      if (n) by[k] = n;
    });
    const keys = Object.keys(by).sort();
    el.innerHTML = keys.length
      ? 'ولهم دكاترة في: ' + keys.map(c =>
          `<button type="button" class="a-jump" data-jump="${esc(c)}">${esc(courseLabel(c))} (${by[c]})</button>`
        ).join(' · ')
      : '';
  }

  /* ===== ودكاترةُ المواد الأخرى يُنشرون معهم =====
     الرسمُ يعرض مادّةً واحدة، والدكاترةُ في الدرج تحت مفاتيحَ كثيرة — وكلُّهم
     محبوسون في هذا المتصفّح. فلو انتُظر أن تُفتح كلُّ مادّةٍ بيدها لَبقي أكثرُهم
     محبوسًا. فتُمسح المفاتيحُ كلُّها مرّةً عند فتح اللسان: كتابةٌ محلّيّةٌ رخيصة،
     والدفعُ بعدها مؤجَّلٌ يجمعها */
  let docSwept = 0;
  function docPubAll() {
    if (docSwept || typeof window.acDocPub !== 'function') return;
    docSwept = 1;
    const s = app(), C = (s && s.cinfo) || {};
    Object.keys(C).forEach(k => {
      if (!(((C[k] || {}).doctors) || []).length) return;
      try { window.acDocPub(k); } catch (e) {}
    });
  }

  function renderDocs() {
    const code = $('#d-course').value;
    docCourseKeep(code);        /* كلُّ رسمةٍ تُثبّت المادّةَ التي رُسمت، فلا يُنسى الاختيار */
    if (!code) { $('#doc-list').innerHTML = `<p class="a-empty">أضِف مادة أولًا.</p>`; return; }
    /* ===== والقائمةُ تُنشر مع كلّ رسمة =====
       اللوحةُ تكتب الدكاترةَ في الدرج رأسًا، وليست تلك مساهمةً فلا يمشي عليها
       الدفع — فلم يبلغ الخادمَ منهم أحدٌ قطّ، ولم يظهر في متصفّحٍ آخرَ معتمَدٌ
       واحد. فيُنادى بابُ المحرّك: يفتح لكلّ دكتورٍ صفَّه في مساهمة الموقع
       (‎pub‎ ههنا لأنّ هذي اللوحة) ويدفعها.
       وموضعُه الرسمُ لا الحفظ: كلُّ تبديلٍ في القائمة يُعقبه رسمٌ — اعتمادٌ
       وإضافةٌ وتعديلٌ وحذف — فلا يُنسى واحد */
    if (typeof window.acDocPub === 'function') { try { window.acDocPub(code); } catch (e) {} }
    docPubAll();
    const list = docsOf(app(), code);
    $('#doc-list').innerHTML = list.length
      ? list.map((d, i) => `<div class="a-item" data-di="${i}">
          <span class="a-av">${drAvatar(d)}</span>
          <div class="a-item__main">
            <span class="a-item__t">${esc(d.name) || '—'}${d.en ? `<span class="a-en">${esc(d.en)}</span>` : ''}</span>
            <span class="a-item__sub">${(d.posts || []).length} مساهمة عنه${
              d.by && d.by.name ? ` · باقتراح ${esc(d.by.name)}` : ''}</span>
          </div>
          <div class="a-acts">
            <button type="button" class="a-btn" data-act="edit">تعديل</button>
            <button type="button" class="a-btn a-btn--del" data-act="del">حذف</button>
          </div>
        </div>`).join('')
      /* ===== وتُسمّى المادةُ في الحال الصفريّة =====
         «لا دكاترة في هذه المادة» لا تقول **أيّ** مادّة، فتُقرأ على المادّة التي في
         ذهن الناظر لا التي في القائمة. فإن وقعت القائمةُ على غيرِها بدا أنّ عملَه
         ضاع. فيُقال الاسمُ صريحًا — فراغٌ منسوبٌ لا يُلبس. */
      : `<p class="a-empty">لا دكاترة في «${esc(courseLabel(code))}» بعد.</p>`;
    const n = $('#doc-n');
    if (n) n.textContent = list.length ? String(list.length) : '';
    paintDocWhere();
    renderDrx();   /* العمودان يُقرآن معًا: ما اعتُمد يخرج من هذا ويدخل ذاك في رسمةٍ واحدة */
  }
  $('#d-course').addEventListener('change', () => {
    cancelDoc(); renderDocs(); drxSync($('#d-course').value);
  });

  $('#d-pick').addEventListener('click', () => $('#d-img').click());
  $('#d-img').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      /* تصغير إلى ٢٠٠px مربّعة — الصور الكبيرة تملأ حصّة التخزين المشتركة */
      const im = new Image();
      im.onload = () => {
        const S = 200, cv = document.createElement('canvas');
        cv.width = cv.height = S;
        const g = cv.getContext('2d');
        const side = Math.min(im.width, im.height);
        g.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, S, S);
        docImg = cv.toDataURL('image/jpeg', .82);
        $('#d-prev').innerHTML = `<img src="${docImg}" alt="">`;
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(f);
    e.target.value = '';
  });

  function cancelDoc() {
    docEdit = null; docImg = '';
    $('#d-name').value = ''; $('#d-en').value = ''; $('#d-prev').innerHTML = '';
    $('#d-save').textContent = 'إضافة الدكتور';
    $('#d-cancel').hidden = true;
  }
  $('#d-cancel').addEventListener('click', cancelDoc);

  $('#d-save').addEventListener('click', () => {
    const code = $('#d-course').value, name = $('#d-name').value.trim();
    const en = $('#d-en').value.trim();   /* اسمه بالإنجليزي — يُعرض حين يكون الموقع إنجليزيًّا */
    if (!code || !name) { toast('اكتب اسم الدكتور'); return; }
    const s = app(), list = docsOf(s, code);
    if (docEdit != null) {
      const d = list[docEdit];
      if (d) { d.name = name; d.en = en; if (docImg) d.img = docImg; }
      toast('حُدّث الدكتور');
    } else {
      list.push({
        id: 'd' + Date.now().toString(36), name, en, img: docImg,
        me: false, u: { name: 'الأدمن' }, ts: Date.now(), posts: [],
      });
      toast(`أُضيف «${name}»`);
    }
    if (saveApp(s)) { cancelDoc(); renderDocs(); }
  });

  $('#doc-list').addEventListener('click', e => {
    const row = e.target.closest('[data-di]'); if (!row) return;
    const i = +row.dataset.di, code = $('#d-course').value;
    const act = (e.target.closest('[data-act]') || {}).dataset; if (!act) return;
    const s = app(), list = docsOf(s, code), d = list[i];
    if (!d) return;
    if (act.act === 'edit') {
      docEdit = i; docImg = '';
      $('#d-name').value = d.name || '';
      $('#d-en').value = d.en || '';
      $('#d-prev').innerHTML = d.img ? `<img src="${d.img}" alt="">` : '';
      $('#d-save').textContent = 'حفظ التعديل';
      $('#d-cancel').hidden = false;
      $('#d-name').focus();
    } else if (act.act === 'del') {
      const n = (d.posts || []).length;
      if (!confirm(`حذف «${d.name}»؟${n ? `\nستُحذف معه ${n} مساهمة عنه.` : ''}`)) return;
      list.splice(i, 1);
      /* ===== ويُنزع صفُّه من المنشور، وإلّا عاد =====
         صار للدكتور صفٌّ في مساهمة الموقع (به يعرفه المتصفّحُ الآخر)، والقراءةُ
         تبني القائمةَ من الصفوف. فمن حذفه من القائمة وحدَها وجده أمامه في
         الرسمة التالية — حذفٌ يُبطله قارئُه */
      if (typeof window.acDocDrop === 'function') { try { window.acDocDrop(code, d.id); } catch (e2) {} }
      if (saveApp(s)) { cancelDoc(); renderDocs(); toast('حُذف الدكتور'); }
    }
  });

  /* ============================================================
     ٤) المساهمات — المكتبة نفسها معروضة من الموقع داخل إطار (بلا أي فرق في العرض)،
        وفوقها «وضع الحذف»: بتفعيله يصير النقر على أي مساهمة داخل المكتبة حذفًا لها.
        المشروعان على نفس الأصل (file://) فيقرأ الأدمن داخل الإطار ويكتب في التخزين نفسه
     ============================================================ */
  let delMode = false;

  /* كود المادة المعروضة الآن = الكتاب المتمركز في بِكرة المكتبة المزروعة */
  function shownCode() {
    const el = $('#lib-host .reel-slot.is-center [data-info]');
    return el ? el.dataset.info : '';
  }

  /* وضع الحذف: نلتقط النقرة قبل معالجات الموقع (مرحلة الالتقاط) فنمنع فتح/طيّ المساهمة */
  $('#lib-host').addEventListener('click', e => {
    if (!delMode) return;
    const post = e.target.closest('.post'); if (!post) return;
    e.preventDefault(); e.stopPropagation();
    const code = shownCode();
    if (!code) { toast('افتح مادة أولًا'); return; }
    const sub = post.dataset.sub, dr = post.dataset.dr, pi = +post.dataset.pi;
    const who = ((post.querySelector('.post-name') || {}).textContent || '').trim();
    if (!confirm(`حذف مساهمة «${who}» نهائيًّا؟`)) return;
    const s = app();
    if (dr != null && dr !== '') {
      const d = (((s.cinfo || {})[code] || {}).doctors || [])[+dr];
      if (d) d.posts.splice(pi, 1);
    } else {
      postsOf(s, code, sub || 'info').splice(pi, 1);
    }
    if (!saveApp(s)) return;
    toast('حُذفت المساهمة');
    /* الموقع يقرأ حالته عند الإقلاع فقط — نعيد تحميل الصفحة كي يعرض ما بعد الحذف */
    location.reload();
  }, true);

  $('#del-mode').addEventListener('click', e => {
    delMode = !delMode;
    e.target.classList.toggle('on', delMode);
    e.target.textContent = `وضع الحذف: ${delMode ? 'مُشغَّل — انقر أي مساهمة' : 'مُطفأ'}`;
    document.body.classList.toggle('a-delmode', delMode);
    $('#del-hint').textContent = delMode
      ? 'النقر على أي مساهمة يحذفها بعد تأكيد'
      : 'شغّل وضع الحذف ثم انقر أي مساهمة داخل المكتبة';
  });

  /* ============================================================
     ٥) المساهمات بالتاريخ — خيط زمني واحد لكل مساهمات المكتبة
        القراءة من cinfo مباشرةً (لا من الكتالوج) كي تشمل خيوط المعامل «CODE::معمل»
     ============================================================ */
  const SEC_AR = {
    info: 'المادة', doc: 'الدكاترة', abs: 'الغياب والتأخير', grade: 'توزيع الدرجات',
    srcU: 'مصادر الفهم', srcP: 'مصادر الممارسة', videos: 'الشروح', cards: 'البطائق', lessons: 'المواضيع',
  };
  const SITE_NAMES = ['أكاديميا', 'academia'];
  const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const baseOf = c => { const j = c.indexOf('::'); return j < 0 ? c : c.slice(0, j); };
  const isLabKey = c => c.indexOf('::') > -1;

  let tl = { q: '', code: '', sec: '', tag: '', kind: 'all', sort: 'old' };

  function courseLabel(code) {
    const c = cat.courses.find(x => x.code === baseOf(code));
    const nm = c ? c.ar : baseOf(code);
    return isLabKey(code) ? `${nm} — معمل` : nm;
  }
  const authorOf = p => p.me ? 'حسابي (أنا)' : ((p.u && p.u.name) || '—');
  const isSitePost = p => SITE_NAMES.indexOf((p.u || {}).name) > -1;

  /* عدّ عقد شجرة (الشروح/البطائق) بنوع معيّن على أي عمق */
  function nodeCount(deck, t) {
    let n = 0;
    (deck || []).forEach(x => { if (x.t === t) n++; if (x.ch) n += nodeCount(x.ch, t); });
    return n;
  }

  /* سطر واحد يلخّص ما في المساهمة — لكل بند حقوله */
  function summarize(sec, d, drName) {
    d = d || {};
    const bits = [];
    if (sec === 'info') {
      if (d.book) bits.push(`الكتاب: ${d.book}`);
      else if (d.bookImg) bits.push('صورة غلاف');
      if (d.lang) bits.push(d.lang);
      if (d.type) bits.push(d.type);
      if (d.rel) bits.push(`الترابط ${d.rel}%`);
      if (d.desc) bits.push(d.desc);
    } else if (sec === 'doc') {
      if (drName) bits.push(drName);
      if (d.e) bits.push(d.e);
      if ((d.hours || []).length) bits.push(`${d.hours.length} ساعة مكتبية`);
      if (d.teach) bits.push(`الشرح ${d.teach}/10`);
      if (d.grade) bits.push(`التصحيح ${d.grade}/10`);
      if (d.d) bits.push(d.d);
    } else if (sec === 'abs') {
      if (d.free) bits.push(`${d.free} غياب مجاني`);
      if (d.dedAmt) bits.push(`خصم ${d.dedAmt} من ${d.dedFrom}`);
      if (d.dn) bits.push(`DN عند ${d.dn}`);
      if (d.late) bits.push(`${d.late} تأخير = غياب`);
    } else if (sec === 'grade') {
      const it = (d.items || []).filter(x => x && x.name);
      if (it.length) bits.push(it.map(x => `${x.name}${x.pct ? ` ${x.pct}%` : ''}`).join(' · '));
    } else if (sec === 'srcU' || sec === 'srcP') {
      const files = Object.keys(d.files || {}).length;
      if (files) bits.push(`${files} ملف`);
      if (d.html) bits.push(String(d.html).replace(/<[^>]*>/g, ' '));
      if (Array.isArray(d.items) && d.items.length) bits.push(`${d.items.length} مصدر`);
    } else if (sec === 'videos') {
      const v = nodeCount(d.deck, 'v'), f = nodeCount(d.deck, 'f');
      if (v) bits.push(`${v} فيديو`);
      if (f) bits.push(`${f} مجلد`);
    } else if (sec === 'cards') {
      let c = 0, f = 0;
      Object.keys(d.decks || {}).forEach(k => { c += nodeCount(d.decks[k], 'c'); f += nodeCount(d.decks[k], 'f'); });
      if (c) bits.push(`${c} بطاقة`);
      if (f) bits.push(`${f} مجلد`);
    }
    const s = bits.join(' · ').replace(/\s+/g, ' ').trim();
    return s || '—';
  }

  /* كل المساهمات مسطّحة: {p, code, sec, i, di, drName} */
  function allPosts() {
    const s = app(), out = [];
    Object.keys(s.cinfo || {}).forEach(code => {
      const info = s.cinfo[code] || {};
      Object.keys(info.posts || {}).forEach(sec => {
        (info.posts[sec] || []).forEach((p, i) => { if (p) out.push({ p, code, sec, i, di: -1, drName: '' }); });
      });
      (info.doctors || []).forEach((dr, di) => {
        (dr.posts || []).forEach((p, i) => { if (p) out.push({ p, code, sec: 'doc', i, di, drName: dr.name || '' }); });
      });
    });
    return out;
  }

  function fillTlSelects() {
    const codes = Array.from(new Set(allPosts().map(x => x.code))).sort();
    $('#tl-code').innerHTML = `<option value="">كل المواد</option>` +
      codes.map(c => `<option value="${esc(c)}">${esc(courseLabel(c))}</option>`).join('');
    $('#tl-code').value = tl.code;
    $('#tl-sec').innerHTML = `<option value="">كل البنود</option>` +
      Object.keys(SEC_AR).map(k => `<option value="${k}">${SEC_AR[k]}</option>`).join('');
    $('#tl-sec').value = tl.sec;
    $('#tl-tag').innerHTML = `<option value="">كل التخصصات</option>` +
      cat.tags.map(t => `<option value="${esc(t.id)}">${esc(t.ar)}</option>`).join('');
    $('#tl-tag').value = tl.tag;
  }

  const dayKey = ts => { const d = new Date(ts || 0); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  const dayLabel = ts => { const d = new Date(ts || 0); return `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`; };
  const timeLabel = ts => { const d = new Date(ts || 0); const h = d.getHours(), m = d.getMinutes(); return `${h > 12 ? h - 12 : (h || 12)}:${m < 10 ? '0' + m : m} ${h < 12 ? 'ص' : 'م'}`; };

  function renderTimeline() {
    const tagCodes = tl.tag
      ? new Set(cat.courses.filter(c => (c.tags || []).includes(tl.tag)).map(c => c.code))
      : null;
    const q = tl.q.trim();
    let list = allPosts().filter(x => {
      if (tl.code && x.code !== tl.code) return false;
      if (tl.sec && x.sec !== tl.sec) return false;
      if (tagCodes && !tagCodes.has(baseOf(x.code))) return false;
      if (tl.kind === 'pin' && !x.p.pin) return false;
      if (tl.kind === 'site' && !isSitePost(x.p)) return false;
      if (tl.kind === 'stu' && isSitePost(x.p)) return false;
      if (q) {
        const hay = `${authorOf(x.p)} ${courseLabel(x.code)} ${x.code} ${SEC_AR[x.sec] || x.sec} ${summarize(x.sec, x.p.data, x.drName)}`;
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => tl.sort === 'new' ? (b.p.ts || 0) - (a.p.ts || 0) : (a.p.ts || 0) - (b.p.ts || 0));

    $('#tl-count').textContent = `${list.length} مساهمة`;
    if (!list.length) {
      $('#tl-list').innerHTML = `<p class="a-empty">لا مساهمة تطابق التصفية.</p>`;
      return;
    }
    /* تجميع بالأيام: عنوان يوم ثم مساهماته على خيط رأسيّ */
    let html = '', day = '';
    list.forEach(x => {
      const k = dayKey(x.p.ts);
      if (k !== day) {
        if (day) html += '</div>';
        day = k;
        const n = list.filter(y => dayKey(y.p.ts) === k).length;
        html += `<div class="a-tl__day"><span class="a-tl__date">${dayLabel(x.p.ts)}</span><span class="a-tl__n">${n} مساهمة</span></div><div class="a-tl__group">`;
      }
      const av = (x.p.u && x.p.u.img) ? `<img src="${x.p.u.img}" alt="">` : esc(authorOf(x.p).trim().charAt(0));
      html += `<article class="a-tl__row" data-code="${esc(x.code)}" data-sec="${esc(x.sec)}" data-i="${x.i}" data-di="${x.di}">
          <span class="a-tl__dot"></span>
          <span class="a-av a-av--sm">${av}</span>
          <div class="a-tl__main">
            <div class="a-tl__meta">
              <b class="a-tl__who">${esc(authorOf(x.p))}</b>
              ${x.p.pin ? `<span class="a-pin">مثبّتة</span>` : ''}
              <span class="a-tag">${esc(courseLabel(x.code))}</span>
              <span class="a-tag a-tag--sec">${esc(SEC_AR[x.sec] || x.sec)}</span>
              <span class="a-tl__time">${timeLabel(x.p.ts)}</span>
            </div>
            <p class="a-tl__txt">${esc(summarize(x.sec, x.p.data, x.drName))}</p>
          </div>
          <div class="a-acts">
            <button type="button" class="a-btn" data-act="pin">${x.p.pin ? 'إلغاء التثبيت' : 'تثبيت'}</button>
            <button type="button" class="a-btn" data-act="open">في المكتبة ↗</button>
            <button type="button" class="a-btn a-btn--del" data-act="del">حذف</button>
          </div>
        </article>`;
    });
    html += '</div>';
    $('#tl-list').innerHTML = html;
  }

  /* مصفوفة المساهمة الأصلية داخل الحالة — نكتب فيها ثم نحفظ */
  function tlArray(s, code, sec, di) {
    if (di > -1) {
      const dr = (((s.cinfo || {})[code] || {}).doctors || [])[di];
      return dr ? (dr.posts = dr.posts || []) : null;
    }
    return postsOf(s, code, sec);
  }

  $('#tl-q').addEventListener('input', e => { tl.q = e.target.value; renderTimeline(); });
  $('#tl-code').addEventListener('change', e => { tl.code = e.target.value; renderTimeline(); });
  $('#tl-sec').addEventListener('change', e => { tl.sec = e.target.value; renderTimeline(); });
  $('#tl-tag').addEventListener('change', e => { tl.tag = e.target.value; renderTimeline(); });
  $('#tl-kind').addEventListener('click', e => {
    const b = e.target.closest('[data-kind]'); if (!b) return;
    tl.kind = b.dataset.kind;
    document.querySelectorAll('#tl-kind .a-seg').forEach(x => x.classList.toggle('on', x === b));
    renderTimeline();
  });
  $('#tl-sort').addEventListener('click', e => {
    const b = e.target.closest('[data-sort]'); if (!b) return;
    tl.sort = b.dataset.sort;
    document.querySelectorAll('#tl-sort .a-seg').forEach(x => x.classList.toggle('on', x === b));
    renderTimeline();
  });

  $('#tl-list').addEventListener('click', e => {
    const row = e.target.closest('.a-tl__row'); if (!row) return;
    const act = (e.target.closest('[data-act]') || {}).dataset; if (!act) return;
    const code = row.dataset.code, sec = row.dataset.sec, i = +row.dataset.i, di = +row.dataset.di;
    if (act.act === 'open') { openInLibrary(code, sec); return; }
    const s = app(), arr = tlArray(s, code, sec, di);
    const p = arr && arr[i]; if (!p) { toast('لم تعد المساهمة موجودة'); renderTimeline(); return; }
    if (act.act === 'pin') {
      p.pin = !p.pin;
      if (p.pin) p.pinAt = Date.now();   /* الأحدث تثبيتًا هو صاحب غلاف المادة */
      if (saveApp(s)) {
        toast(p.pin ? 'ثُبّتت المساهمة' : 'أُلغي التثبيت');
        /* المكتبة المزروعة تقرأ حالتها عند الإقلاع — نعيد التحميل كي يتبع الغلافُ التثبيتَ
           (وحفظُها لاحقًا فوق تخزيننا يمحو التغيير لولا ذلك). التصفية تُستعاد بعد التحميل */
        reloadKeepTl();
      }
    } else if (act.act === 'del') {
      if (!confirm(`حذف مساهمة «${authorOf(p)}» في «${courseLabel(code)} — ${SEC_AR[sec] || sec}» نهائيًّا؟`)) return;
      arr.splice(i, 1);
      if (saveApp(s)) { toast('حُذفت المساهمة'); reloadKeepTl(); }
    }
  });

  /* إعادة تحميل مع حفظ حال الخيط الزمني (تبويبه وتصفيته) لجلسة واحدة */
  const LS_TL = 'academia2:admin:tl';
  function reloadKeepTl() {
    try { sessionStorage.setItem(LS_TL, JSON.stringify(tl)); } catch (e) {}
    location.reload();
  }
  /* مزامنة عناصر التحكّم مع حالة التصفية المستعادة */
  function applyTlControls() {
    $('#tl-q').value = tl.q;
    document.querySelectorAll('#tl-kind .a-seg').forEach(x => x.classList.toggle('on', x.dataset.kind === tl.kind));
    document.querySelectorAll('#tl-sort .a-seg').forEach(x => x.classList.toggle('on', x.dataset.sort === tl.sort));
  }
  function restoreTl() {
    let raw = null;
    try { raw = sessionStorage.getItem(LS_TL); sessionStorage.removeItem(LS_TL); } catch (e) {}
    if (!raw) return;
    try { tl = Object.assign(tl, JSON.parse(raw)); } catch (e) { return; }
    const b = document.querySelector('#a-tabs button[data-tab="time"]');
    if (b) { b.click(); applyTlControls(); renderTimeline(); }
  }

  /* «في المكتبة»: ننتقل لتبويب المساهمات ونقود المكتبة المزروعة إلى المادة ثم بندها */
  function openInLibrary(code, sec) {
    const tab = document.querySelector('#a-tabs button[data-tab="posts"]');
    if (tab) tab.click();
    const base = baseOf(code);
    const search = $('#lib-host #m-search');
    if (!search) { toast('المكتبة غير جاهزة'); return; }
    search.value = base;
    search.dispatchEvent(new Event('input', { bubbles: true }));
    setTimeout(() => {
      const card = $('#lib-host .reel-slot.is-center [data-info]') || $(`#lib-host [data-info="${base}"]`);
      if (!card) { toast('لم أجد المادة في المكتبة'); return; }
      card.click();
      setTimeout(() => {
        const t = document.querySelector(`#lib-host #cm-tabs button[data-tab="${sec}"]`);
        if (t) t.click();
        const host = $('#a-panel-posts');
        if (host) host.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 420);
    }, 420);
  }

  /* ============================================================
     أدوات مشتركة لقراءة المساهمات (تُستعمل في الإحصاء وحذف المادة)
     ============================================================ */
  const postsOf = (s, code, sec) => {
    s.cinfo = s.cinfo || {};
    s.cinfo[code] = s.cinfo[code] || {};
    s.cinfo[code].posts = s.cinfo[code].posts || {};
    s.cinfo[code].posts[sec] = s.cinfo[code].posts[sec] || [];
    return s.cinfo[code].posts[sec];
  };
  function countPosts(s, code) {
    const info = (s.cinfo || {})[code]; if (!info) return 0;
    let n = Object.values(info.posts || {}).reduce((a, arr) => a + (arr || []).length, 0);
    (info.doctors || []).forEach(d => { n += (d.posts || []).length; });
    return n;
  }

  /* ---------- المظهر: فاتح/داكن (محفوظ للأدمن وحده) ---------- */
  const LS_THEME = 'academia2:admin:theme';
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    document.querySelectorAll('#a-themebar button').forEach(b => b.classList.toggle('on', b.dataset.theme === t));
    try { localStorage.setItem(LS_THEME, t); } catch (e) {}
  }
  $('#a-themebar').addEventListener('click', e => {
    const b = e.target.closest('button[data-theme]'); if (!b) return;
    applyTheme(b.dataset.theme);
  });
  applyTheme(localStorage.getItem(LS_THEME) === 'dark' ? 'dark' : 'light');

  /* ---------- إحصاء جانبي ---------- */
  function renderStats() {
    const s = app();
    const posts = cat.courses.reduce((a, c) => a + countPosts(s, c.code), 0);
    $('#a-stat').innerHTML =
      `<div>التخصصات: <b>${cat.tags.length}</b></div>` +
      `<div>المواد: <b>${cat.courses.length}</b></div>` +
      `<div>المساهمات: <b>${posts}</b></div>`;
  }

  /* ---------- إقلاع ---------- */
  renderTags();
  renderCourses();
  fillCourseSelects();
  renderDocs();
  restoreTl();   /* عودة إلى الخيط الزمني بتصفيته بعد إعادة تحميل تلت تثبيتًا أو حذفًا */

  /* ===== وجلسةُ الموقع تُفتح عند الإقلاع لا عند ضغط التاب =====
     كانت تُفتح في ‎whoPaint‎ وحدَها، وهي لا تُنادى إلّا بضغط «المساهمات». فمن
     فتح اللوحةَ ولم يضغطه بقي المحرّكُ بلا هويّة — وحينئذٍ تُجذب مساهماتُه
     كأنّها لغيره فلا تُحرَّر. وهي العلّةُ التي بقيت بعد إصلاح الجسر. */
  whoPaint();

})();
