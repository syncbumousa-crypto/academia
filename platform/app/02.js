  /* ---------- رفع الصور (صورة المادة من السوق + صورة الدكتور من نافذة التفاصيل) ---------- */
  const imgInput = $('#imgpick');
  let pickCode = null;   // كود المادة (رفع من السوق)
  let pickProfile = false;   // رفع صورة البروفايل من نافذة الحساب

  /* مقصور على زرّ غلاف المادة في السوق — لا كل ما يحمل data-pick (تعارض مع صفوف المنتقي سابقًا) */
  document.addEventListener('click', e => {
    const b = e.target.closest('.cimg--book[data-pick]'); if (!b) return;
    pickCode = b.dataset.pick;
    imgInput.value = '';
    imgInput.click();
  });

  imgInput.addEventListener('change', () => {
    const file = imgInput.files[0];
    if (!file || (!pickCode && !pickProfile)) return;
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        const MAX = 320;
        const k = Math.min(1, MAX / Math.max(im.width, im.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        const url = cv.toDataURL('image/jpeg', .82);
        if (pickProfile) { state.profile.img = url; pickProfile = false; save(); renderProfile(); renderAcctPage(); return; }
        state.imgs[pickCode] = url;
        /* الغلاف المعروض مصدره المساهمة المثبَّتة — فترفيع صورة يحدّثها فيها كي يظهر الجديد */
        const cp = coverPost(pickCode);
        if (cp) cp.data.bookImg = url;
        save();
        mkTab.render(); mkModal.render();
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  });

  /* ---------- شريط الأترام: إضافة حرّة + اختيار ترم يُظهر الإطار المرقّط ---------- */
  let selTerm = null;   // الترم المضغوط حاليًا (لا يُحفظ — اختيار جلسة)

  /* «15/8/2026» من قيمة input[type=date] */
  const fmtDate = v => { const [y, m, d] = v.split('-'); return `${+d}/${+m}/${y}`; };

  /* تاريخ اليوم بصيغة ISO على توقيت السعودية (en-CA = YYYY-MM-DD) */
  const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());

  /* خط إكمال الترم: none = لا تواريخ (رمادي كامل) · up = لم يبدأ · run = جارٍ (نسبة) · done = انتهى
     + أيام الترم: total = كامل المدة، done = المُكمل، until = الأيام المتبقية للبداية */
  const DAY = 86400000;
  function progressFor(dt) {
    if (!dt || !dt.s || !dt.e) return { cls: 'none', pct: 0 };
    const today = todayISO();
    const a = Date.parse(dt.s), b = Date.parse(dt.e), n = Date.parse(today);
    const total = Math.round((b - a) / DAY);
    if (today < dt.s) return { cls: 'up', pct: 0, done: 0, total, until: Math.round((a - n) / DAY) };
    if (today > dt.e) return { cls: 'done', pct: 100, done: total, total };
    return { cls: 'run', pct: Math.round(((n - a) / Math.max(b - a, 1)) * 100), done: Math.round((n - a) / DAY), total };
  }

  /* «9/180» طبقةً فوق البار نفسه — والترتيب بالعربية: المُنجز يمينًا ثم «/» ثم الكل يسارًا
     (يتكفّل به اتجاه الصندوق في CSS، فلا نعكس النصّ وتنقلب أرقامه) */
  const fracText = p => p.cls === 'none' ? ''
    : `<span class="tp-frac"><b class="hn-i">${p.done}</b><i class="hn-s">/</i><b class="hn-t">${p.total}</b></span>`;
  /* «سيبدأ بعد 45 يومًا» يسار التاريخ (داخل صفّ التاريخ نفسه) */
  const soonText = p => p.cls === 'up' ? `<span class="tp-soon">${T().startsIn(p.until)}</span>` : '';
  /* أيقونتا البِيل المحدَّد (بلا مربّع): ⚙ الإعدادات يمين الاسم · + إضافة المواد نهاية البار يسارًا */
  const GEAR_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  const PLUS_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

  let termRenaming = null;   // اسم الترم الذي يُكتب اسمه الآن داخل مربّعه
  function renderTerms() {
    $('#term-list').innerHTML = state.terms.map(t => {
      const dt = state.termDates[t];
      /* التاريخ صار عرضًا فقط (لا يفتح شيئًا) — تعديله عبر زر الإعدادات ⚙ أعلى-يسار المربع.
         بلا تواريخ: أيقونة تقويم باهتة (تلميح) · بها تواريخ: المدى نصًّا */
      const sub = dt && dt.s && dt.e
        ? `<span class="tp-dates">${fmtDate(dt.s)} – ${fmtDate(dt.e)}</span>`
        : `<span class="tp-cal">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
               <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>
             </svg>
           </span>`;
      const p = progressFor(dt);
      /* ⚙ لم يعد على المربّع — انتقل إلى الشريط المنسدل تحته (يمين زر «+»)
         أكورديون تلقائي: الترم المفتوح واسع بكل معلوماته، وبقيّة الأترام أسماء فقط.
         بلا ترم مفتوح تبقى كلها واسعة (لا معنى لتضييق الجميع) */
      const slim = selTerm && t !== selTerm ? ' slim' : '';
      /* التاريخ (مربع italic) يمينًا · ثم البار · ثم «سيبدأ» — صفّ واحد */
      /* الترم قيد التسمية: اسمه حقل قابل للكتابة داخل المربّع نفسه (بلا صندوق وسيط) */
      const editing = termRenaming === t;
      const isOn = t === selTerm;
      /* البِيل المحدَّد: ⚙ الإعدادات يمين الاسم · + إضافة المواد نهاية البار يسارًا (أيقونتان بلا مربّع) */
      const gearBtn = isOn ? `<button type="button" class="tp-gear" title="${T().termSettings}" aria-label="${T().termSettings}">${GEAR_IC}</button>` : '';
      const addBtn = isOn ? `<button type="button" class="tp-add" title="${T().addCourse}" aria-label="${T().addCourse}">${PLUS_IC}</button>` : '';
      return `<div class="tpill ${isOn ? 'on' : ''}${slim}${editing ? ' is-naming' : ''}" data-term="${esc(t)}" role="button" tabindex="0">
        ${gearBtn}
        <span class="tp-name"${editing ? ' contenteditable="true" spellcheck="false"' : ''}>${esc(t)}</span>
        <div class="tp-row">
          ${sub}
          <span class="tp-prog tp-prog--${p.cls}"><span class="tp-fill" style="width:${p.pct}%"></span>${fracText(p)}</span>
          ${soonText(p)}
          ${addBtn}
        </div>
      </div>`;
    }).join('');
    /* بلا أترام: زرّ «إضافة ترم» يأخذ موضع مستطيل البحث في المكتبة ويمتدّ يسارًا (حالة أولى فقط) */
    document.querySelector('.termbar').classList.toggle('termbar--empty', !state.terms.length);
    renderDrop();   /* إعادة محاذاة الصندوق المنسدل بعد أي تغيّر في عرض المربعات */
  }

  /* مواد الترم المحدد داخل الإطار — التنقيط يختفي متى ما وُجدت مادة واحدة على الأقل.
     كل بطاقة تحمل دائرة إتقان المادة */
  function renderFrame() {
    const grid = $('#lib-grid');
    /* مواد الترم كبِكرة كتب مثل المكتبة (كانت شبكة) — والمواد ذات المعمل تظهر ككتابين */
    const list = libEntries(selTerm)
      .map(en => { const c = CM[en.code]; return c ? Object.assign({}, c, { __en: en }) : null; })
      .filter(Boolean);
    grid.hidden = !list.length;
    /* البِكرة تفتح على آخر مادة كنت فيها في هذا الترم — والمتمركز يفتح قُمرته تلقائيًّا */
    const L = state.lastNook;
    if (list.length) nookReel.setList(list, L && L.term === selTerm ? L.code : null);
    if (!list.length) { $('#lib-course').hidden = true; nookEntry = null; }
    $('#term-frame').classList.toggle('has-items', list.length > 0);
  }

  /* اللسان المنسدل: صغير، ينزل عموديًا من تحت طبقة مربع الترم نفسه (كأنه ابن له) —
     متمركز تحت منتصف المربع، وأعلاه مدسوس خلف المربع (z-index أدنى) */
  function renderDrop() {
    /* أُلغي اللسان — ⚙ و+ صارا أيقونتين داخل البِيل المحدَّد؛ نُبقي #term-drop مخفيًّا ونُزيل حشوة الشريط */
    const drop = $('#term-drop'); if (drop) drop.hidden = true;
    const bar = document.querySelector('.termbar'); if (bar) bar.style.paddingBottom = '';
  }
  window.addEventListener('resize', renderDrop);

  /* فتح الترم: تحديده وإظهار إطاره ومواده (يُستدعى من نقر المربع ومن الفتح التلقائي) */
  let firstTermOpen = true;   /* أول فتح (تحميل) بلا تحريك */
  function openTerm(term) {
    if (!term) return;
    /* التقاط عرض المربعات قبل التبديل لتحريك التصغّر/التوسّع بسلاسة (FLIP) */
    const prev = {};
    if (!firstTermOpen) $('#term-list').querySelectorAll('.tpill').forEach(p => { prev[p.dataset.term] = p.getBoundingClientRect().width; });
    selTerm = term;
    $('#term-frame').hidden = false;
    renderTerms();
    renderFrame();
    mkModal.render();   /* تحديث علامات «مضافة» لو فُتحت النافذة على ترم آخر */
    if (!firstTermOpen) flipTermWidths(prev);
    firstTermOpen = false;
  }
  /* تحريك عرض مربعات الأترام من قيمها السابقة إلى الجديدة (FLIP على flex-basis): يظهر التصغّر والتوسّع أمام العين */
  function flipTermWidths(prev) {
    if (!prev || !Object.keys(prev).length) return;
    const list = $('#term-list'); if (!list) return;
    const bar = document.querySelector('.termbar');
    const pills = [...list.querySelectorAll('.tpill')]; if (!pills.length) return;
    const target = pills.map(p => p.getBoundingClientRect().width);   /* العرض الطبيعي الجديد */
    /* أثناء التحريك: سطر واحد بلا التفاف + قصّ الفائض المؤقّت (فاصل الترم الجديد)، فلا يقفز زر «إضافة ترم» لسطر ثانٍ */
    if (bar) { bar.style.flexWrap = 'nowrap'; bar.style.overflow = 'hidden'; }
    pills.forEach(p => {
      const from = prev[p.dataset.term];
      p.style.transition = 'none';
      p.style.flexGrow = '0'; p.style.flexShrink = '0';
      p.style.flexBasis = (from != null ? from : 0) + 'px';           /* ترم جديد يبدأ من 0 فينمو */
    });
    void list.offsetWidth;   /* reflow لتثبيت قيمة البداية قبل الانتقال */
    pills.forEach((p, i) => {
      p.style.transition = 'flex-basis .28s ease';
      p.style.flexBasis = target[i] + 'px';
      const done = () => {
        p.style.transition = ''; p.style.flexGrow = ''; p.style.flexShrink = ''; p.style.flexBasis = '';
        p.removeEventListener('transitionend', done);
      };
      p.addEventListener('transitionend', done);
      setTimeout(done, 340);   /* أمان لو لم يُطلَق الحدث */
    });
    if (bar) setTimeout(() => { bar.style.flexWrap = ''; bar.style.overflow = ''; }, 340);
  }

  /* الترم الذي يُفتح عليه تلقائيًّا: الجاري (تاريخ اليوم داخله) · وإلا أقرب ترم قادم (بعد) ·
     وإلا أحدث ترم منصرم · وإلا أول ترم موجود */
  function pickActiveTerm() {
    const today = todayISO();
    const dated = state.terms.map(t => ({ t, dt: state.termDates[t] })).filter(x => x.dt && x.dt.s && x.dt.e);
    const cur = dated.find(x => x.dt.s <= today && today <= x.dt.e);
    if (cur) return cur.t;
    const future = dated.filter(x => x.dt.s > today).sort((a, b) => a.dt.s < b.dt.s ? -1 : 1);
    if (future.length) return future[0].t;   /* «يفتح على اللي بعد دايم» */
    const past = dated.filter(x => x.dt.e < today).sort((a, b) => a.dt.e > b.dt.e ? -1 : 1);
    if (past.length) return past[0].t;
    return state.terms[0] || null;
  }

  $('#term-list').addEventListener('click', e => {
    /* ⚙ إعدادات الترم · + إضافة مواد — أيقونتان داخل البِيل المحدَّد (تُعالَج قبل فتح الترم) */
    if (e.target.closest('.tp-gear')) { if (selTerm) openTermSettings(selTerm); return; }
    if (e.target.closest('.tp-add')) { mkModal.render(); modal.hidden = false; return; }
    const b = e.target.closest('[data-term]'); if (!b) return;   /* نقر المربّع يفتح الترم */
    openTerm(b.dataset.term);
  });

  /* آخر مادة كانت مفتوحة في الرَّكن {term, code} — تُحفظ في التخزين فتُستأنف بعد تحديث الصفحة.
     ترجع null إن حُذف ترمها أو أُخرجت المادة منه */
  function lastNookEntry() {
    const L = state.lastNook;
    if (!L || !L.term || !L.code) return null;
    if (!state.terms.includes(L.term)) return null;
    const entry = libEntries(L.term).find(x => x.code === L.code);
    return entry ? { term: L.term, entry } : null;
  }

  /* عند فتح تبويب «الركن»: يستأنف آخر مادة كنت فيها (بترمها)، وإلا يفتح الترم الجاري/القادم
     بالخوارزمية المعتادة — يعمل بعد إظهار اللوحة (مستمع index.html يبدّل اللوحة قبله) */
  function openNookPanel() {
    /* الاستئناف صار عبر البِكرة: تُفتح على المادة الأخيرة فتتكفّل onCenter بفتح قُمرتها */
    const last = lastNookEntry();
    if (last) { openTerm(last.term); return; }
    const t = pickActiveTerm(); if (t) openTerm(t);
  }
  document.querySelector('.tabs').addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]');
    if (b && b.dataset.tab === 'library') openNookPanel();
  });

  /* ---------- نافذة إعدادات الترم (الاسم + التواريخ + حذف) ---------- */
  const dateModal = $('#date-modal');
  let dateTerm = null;   // الترم الذي تُحرَّر إعداداته

  /* مواد الترم داخل نافذة الإعدادات — تُعرض ويمكن حذف كلٍّ منها */
  function renderDmCourses() {
    const box = $('#dm-courses'); if (!box) return;
    const list = dateTerm ? libEntries(dateTerm) : [];
    $('#dm-courses-n').textContent = list.length;
    box.innerHTML = list.length
      ? list.map(en => {
          const c = CM[en.code] || { code: en.code, ar: en.code, h: 0 };
          const nm = state.lang === 'ar' ? arShort(c) : c.code;
          return `<div class="dmc" data-code="${esc(en.code)}">
            <span class="dmc__n" title="${esc(c.ar)}">${esc(nm)}</span>
            <span class="dmc__h">${c.h}${T().hUnit}</span>
            <button type="button" class="dmc__del" title="${T().delItem}" aria-label="${T().delItem}">✕</button>
          </div>`;
        }).join('')
      : `<p class="dmc-none">${T().noCourses}</p>`;
  }
  function openTermSettings(term) {
    dateTerm = term;
    const dt = state.termDates[term] || {};
    $('#dm-title').textContent = `${T().termSettings} — ${term}`;
    $('#dm-name').value = term;
    $('#dm-start').value = dt.s || '';
    $('#dm-end').value = dt.e || '';
    renderDmCourses();
    dateModal.hidden = false;
  }
  /* حذف مادة من الترم مباشرةً من نافذة الإعدادات */
  $('#dm-courses').addEventListener('click', e => {
    const b = e.target.closest('.dmc__del'); if (!b || !dateTerm) return;
    const code = b.closest('.dmc').dataset.code;
    const list = libEntries(dateTerm);
    const i = list.findIndex(x => x.code === code);
    if (i < 0) return;
    list.splice(i, 1);
    save();
    renderDmCourses();
    if (selTerm === dateTerm) renderFrame();   /* إطار الترم المفتوح يتبع الحذف فورًا */
  });
  const closeDateModal = () => { dateModal.hidden = true; dateTerm = null; };

  /* إعادة تسمية ترم عبر كل المفاتيح مع الحفاظ على ترتيبه */
  function renameTerm(oldN, newN) {
    if (oldN === newN) return true;
    if (!newN || state.terms.includes(newN)) return false;
    state.terms = state.terms.map(t => t === oldN ? newN : t);
    if (state.libs[oldN]) { state.libs[newN] = state.libs[oldN]; delete state.libs[oldN]; }
    if (state.termDates[oldN]) { state.termDates[newN] = state.termDates[oldN]; delete state.termDates[oldN]; }
    if (selTerm === oldN) selTerm = newN;
    return true;
  }

  $('#dm-save').addEventListener('click', () => {
    if (!dateTerm) return;
    const newName = $('#dm-name').value.trim();
    const term = (newName && renameTerm(dateTerm, newName)) ? newName : dateTerm;
    state.termDates[term] = { s: $('#dm-start').value, e: $('#dm-end').value };
    save();
    renderTerms();
    if (selTerm) renderFrame();   /* دوائر حالة المواد تتبع تواريخ الترم */
    mkTab.render(); mkModal.render();   /* وكذلك فلتر «حالة المادة» في السوقين */
    closeDateModal();
  });

  $('#dm-delete').addEventListener('click', () => {
    if (!dateTerm) return;
    const wasSel = selTerm === dateTerm;
    state.terms = state.terms.filter(t => t !== dateTerm);
    delete state.libs[dateTerm];
    delete state.termDates[dateTerm];
    if (state.lastNook && state.lastNook.term === dateTerm) state.lastNook = null;
    save();
    closeDateModal();
    mkTab.render(); mkModal.render();
    if (!wasSel) { renderTerms(); return; }
    /* حُذف الترم المفتوح: لا نترك الشريط بلا ترم مفتوح — ينهار الأكورديون فتتساوى
       المربعات كلها واسعةً وتتزاحم. ننتقل للترم الجاري/الأقرب بالخوارزمية المعتادة */
    selTerm = null;
    $('#lib-course').hidden = true; nookEntry = null;
    const next = pickActiveTerm();
    if (next) { openTerm(next); return; }
    $('#term-frame').hidden = true;
    renderTerms();
  });

  $('#dm-close').addEventListener('click', closeDateModal);
  dateModal.addEventListener('click', e => { if (e.target === dateModal) closeDateModal(); });

  /* ---------- شريط اليوم: تاريخ ميلادي + ساعة بتوقيت السعودية (يتحدّث كل ثانية) ---------- */
  let lastISO = todayISO();
  function renderToday() {
    const now = new Date();
    /* عند منتصف الليل (بتوقيت السعودية) تُعاد رسمة الأترام ليتحدّث خط الإكمال */
    const iso = todayISO();
    if (iso !== lastISO) { lastISO = iso; renderTerms(); }
    const loc = state.lang === 'ar' ? 'ar-u-ca-gregory-nu-latn' : 'en-GB';
    $('#today-date').textContent = new Intl.DateTimeFormat(loc,
      { timeZone: 'Asia/Riyadh', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    $('#today-time').textContent = new Intl.DateTimeFormat(loc,
      { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(now);
  }
  setInterval(renderToday, 1000);

  /* «+ إضافة ترم»: يُنشئ مربّع الترم فورًا في مكانه، واسمه قابل للكتابة بمؤشّر جاهز،
     ويظهر زرّ إضافة مرقّط جديد يساره في اللحظة نفسها (لا صندوق وسيط يسأل عن الاسم) */
  const uniqueTermName = () => {
    const base = T().newTermName;
    if (!state.terms.includes(base)) return base;
    let i = 2; while (state.terms.includes(`${base} ${i}`)) i++;
    return `${base} ${i}`;
  };
  $('#btn-addterm').addEventListener('click', () => {
    const name = uniqueTermName();
    state.terms.push(name);
    save();
    termRenaming = name;    /* يُرسم اسمه حقلًا قابلًا للتحرير */
    openTerm(name);         /* الترم الجديد هو المفتوح */
    focusTermName();
  });

  /* وضع المؤشّر داخل اسم الترم قيد التسمية وتحديد نصّه كاملًا */
  function focusTermName() {
    const el = document.querySelector('.tp-name[contenteditable]');
    if (!el) return;
    el.focus();
    const r = document.createRange(); r.selectNodeContents(el);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* إنهاء التسمية: الاسم الجديد إن صحّ وإلا يبقى القديم — ثم إعادة الرسم بلا تحرير */
  function commitTermName(el) {
    const oldN = termRenaming;
    if (!oldN) return;
    const v = (el.textContent || '').trim();
    termRenaming = null;
    if (v && v !== oldN && renameTerm(oldN, v)) { save(); openTerm(v); }
    else { renderTerms(); renderDrop(); }
  }

  /* نقرتان على اسم أي ترم = إعادة تسميته في مكانه (مخرج دائم لو تعذّر الوصول لإعداداته) */
  $('.termbar').addEventListener('dblclick', e => {
    const nm = e.target.closest('.tp-name'); if (!nm || nm.isContentEditable) return;
    const pill = nm.closest('.tpill'); if (!pill) return;
    termRenaming = pill.dataset.term;
    renderTerms(); renderDrop(); focusTermName();
  });
  $('.termbar').addEventListener('keydown', e => {
    const el = e.target.closest('.tp-name[contenteditable]');
    if (!el) return;
    if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    else if (e.key === 'Escape') { e.preventDefault(); el.textContent = termRenaming || ''; el.blur(); }
  });
  $('.termbar').addEventListener('focusout', e => {
    const el = e.target.closest('.tp-name[contenteditable]');
    if (el) commitTermName(el);
  }, true);

  /* ---------- النافذة المنبثقة (سوق المواد) ---------- */
  const modal = $('#market-modal');
  const closeModal = () => {
    if (typeof wiz !== 'undefined' && wiz) closeWizard();   /* لا يُترك المعالج معلّقًا خلف النافذة */
    modal.hidden = true;
    mkModal.closePanel();
  };

  $('#drop-add').addEventListener('click', () => { mkModal.render(); modal.hidden = false; });
  /* ⚙ في الشريط المنسدل: يفتح إعدادات الترم المفتوح حاليًا */
  $('#drop-gear').addEventListener('click', () => { if (selTerm) openTermSettings(selTerm); });
  $('#mm-close').addEventListener('click', closeModal);

  /* لوحة المفاتيح على بِكرة الكتب: Enter = اختيار المتمركز، الأسهم/Home/End = تحريك البؤرة.
     (النقر يُدار داخل البكرة نفسها: المتمركز يختار، الجانبي ينزلق للمنتصف) */
  document.addEventListener('keydown', e => {
    if (modal.hidden || wiz || bookReel.isEmpty()) return;
    const inField = /^(INPUT|TEXTAREA)$/.test((document.activeElement || {}).tagName || '');
    if (e.key === 'Enter') { e.preventDefault(); bookReel.confirmCenter(); }
    else if (inField) return;                         /* داخل حقل البحث: الأسهم تحرّك المؤشّر */
    /* التخطيط دائمًا rtl: يمين = فهرس أقل، يسار = فهرس أعلى (لا يتبدّل مع اللغة) */
    else if (e.key === 'ArrowRight') { e.preventDefault(); bookReel.step(-1); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); bookReel.step(1); }
    else if (e.key === 'Home') { e.preventDefault(); bookReel.first(); }
    else if (e.key === 'End')  { e.preventDefault(); bookReel.last(); }
  });
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    mkTab.closePanel();
    if (wiz) { closeWizard(); return; }   /* المعالج أولًا — إلغاؤه لا يضيف شيئًا */
    if (!modal.hidden) closeModal();
    if (!dateModal.hidden) closeDateModal();
    if (!courseModal.hidden || !$('#lib-course').hidden || !$('#market-course').hidden) closeCourseModal();
  });

  /* ============================================================
     معالج «جهّز نسختك» (ROADMAP-PICKS م1) — اختيار مساهمة لكل بند قبل الإضافة
     wiz = {code, idx, picks, entry(تحرير), solo(فُتح من المكتبة)}
     picks[sec]: undefined = لم يمرّ · null = تخطّاه · id أو {dr,post} = اختار
     ============================================================ */
  let wiz = null;
  const WIZ_SECS = () => [
    ['info', T().infoSec], ['doc', T().docSec], ['grade', T().gradeSec],
    ['abs', T().absSec],
    ['srcU', T().studySrc], ['srcP', T().practiceSrc], ['lessons', T().lessonsSec],
  ];

  function secHasContent(code, sec) {
    if (sec === 'doc') return doctorsOf(code).some(d => d.posts.length);
    return postsOf(code, sec).length > 0;
  }
  /* الأفضل = الأكثر لايكات، وعند التعادل الأحدث */
  function bestPickOf(code, sec) {
    if (sec === 'doc') {
      let best = null;
      doctorsOf(code).forEach(dr => dr.posts.forEach(p => {
        if (!best || (p.likes || 0) > best.l || ((p.likes || 0) === best.l && (p.ts || 0) > best.t))
          best = { v: { dr: dr.id, post: p.id }, l: p.likes || 0, t: p.ts || 0 };
      }));
      return best && best.v;
    }
    const arr = postsOf(code, sec);
    if (!arr.length) return null;
    let b = arr[0];
    arr.forEach(p => {
      if ((p.likes || 0) > (b.likes || 0) || ((p.likes || 0) === (b.likes || 0) && (p.ts || 0) > (b.ts || 0))) b = p;
    });
    return b.id;
  }

  function openWizard(code, opts = {}) {
    const secs = WIZ_SECS();
    let idx = 0;
    if (opts.startSec) idx = Math.max(0, secs.findIndex(([k]) => k === opts.startSec));
    wiz = {
      code, idx,
      picks: opts.entry && opts.entry.picks ? { ...opts.entry.picks } : {},
      entry: opts.entry || null,
      solo: !!opts.solo,
    };
    modal.hidden = false;
    document.querySelector('#market-modal .mmodal__card').classList.add('wizmode');
    $('#wiz').hidden = false;
    renderWiz();
  }
  function closeWizard() {
    wiz = null;
    document.querySelector('#market-modal .mmodal__card').classList.remove('wizmode');
    $('#wiz').hidden = true;
    /* فُتح من المكتبة (تحرير/تجهيز): إغلاقه يغلق النافذة كلها ويرجع للمكتبة */
    if ($('#wiz').dataset.solo === '1') { $('#wiz').dataset.solo = ''; modal.hidden = true; }
  }

  /* بطاقة مساهمة للاختيار: محتواها كامل + دائرة انتقاء (قراءة فقط، لا لايك ولا تعديل) */
  function wizCard(sec, p, val, checked) {
    return `<label class="wpick ${checked ? 'on' : ''}">
      <input type="radio" name="wp" value="${val}" ${checked ? 'checked' : ''}>
      <span class="wpick__dot"></span>
      <div class="wpick__card">
        <div class="post__body">${postBody(sec, p.data, wiz.code)}</div>
        <div class="post__top">
          <span class="post-av post-av--sm">${avatarHTML(p)}</span>
          <div class="post-meta">
            ${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b>
            <span class="post-date">${agoTxt(p.ts)}</span>
          </div>
          <span class="wlikes">♥ ${p.likes || 0}</span>
        </div>
      </div>
    </label>`;
  }
  const byBest = arr => [...arr].sort((a, b) => ((b.likes || 0) - (a.likes || 0)) || ((b.ts || 0) - (a.ts || 0)));

  function renderWiz() {
    if (!wiz) return;
    const secs = WIZ_SECS();
    const [sec, label] = secs[wiz.idx];
    const c = CM[wiz.code];
    $('#wiz').dataset.solo = wiz.solo ? '1' : '';
    $('#wiz-timg').innerHTML = imgOf(wiz.code) ? `<img src="${imgOf(wiz.code)}" alt="">` : '';
    $('#wiz-title').textContent = `${T().wizTitle} — ${state.lang === 'ar' ? arShort(c) : c.code}`;
    $('#wiz-progress').textContent = T().wizProgress(wiz.idx + 1, secs.length);
    $('#wiz-secname').textContent = label;
    /* الترشيح المسبق: الأفضل محدد ما لم يكن للبند قرار سابق */
    if (wiz.picks[sec] === undefined) {
      const b = bestPickOf(wiz.code, sec);
      if (b) wiz.picks[sec] = b;
    }
    const cur = wiz.picks[sec];
    let body = '';
    if (!secHasContent(wiz.code, sec)) {
      body = `<p class="wiz-empty">${T().wizEmpty}</p>`;
    } else if (sec === 'doc') {
      body = doctorsOf(wiz.code).filter(dr => dr.posts.length).map(dr => `
        <div class="dr">
          <div class="dr__head dr__head--ro">
            <span class="dr-av">${dr.img ? `<img src="${dr.img}" alt="">` : FLAT_AVATAR}</span>
            <b class="dr-name">${esc(dr.name) || '—'}</b>
          </div>
          ${byBest(dr.posts).map(p => {
            const val = `${dr.id}::${p.id}`;
            const checked = cur && cur.dr === dr.id && cur.post === p.id;
            return wizCard('doc', p, val, checked);
          }).join('')}
        </div>`).join('');
    } else {
      body = byBest(postsOf(wiz.code, sec)).map(p => wizCard(sec, p, p.id, cur === p.id)).join('');
    }
    $('#wiz-body').innerHTML = body;
    /* الأزرار */
    const last = wiz.idx === secs.length - 1;
    $('#wiz-prev').textContent = `→ ${T().wizPrev}`;
    $('#wiz-prev').disabled = wiz.idx === 0;
    $('#wiz-skip').textContent = T().wizSkip;
    $('#wiz-skip').hidden = !secHasContent(wiz.code, sec);
    $('#wiz-next').textContent = last
      ? (wiz.entry ? T().wizSave : T().wizAdd(selTerm))
      : `${T().wizNext} ←`;
    updateWizNext();
  }
  /* «التالي» يتفعّل باختيار أو بعد تخطٍّ صريح — البند الفارغ يمرّ مباشرة */
  function updateWizNext() {
    const [sec] = WIZ_SECS()[wiz.idx];
    const has = secHasContent(wiz.code, sec);
    const decided = wiz.picks[sec] !== undefined;   /* اختيار أو null (تخطٍّ) */
    $('#wiz-next').disabled = has && !decided;
  }

  function wizAdvance() {
    const secs = WIZ_SECS();
    if (wiz.idx < secs.length - 1) { wiz.idx++; renderWiz(); return; }
    /* الإنهاء */
    const picks = wiz.picks;
    /* البنود التي لم تُحسم (فارغة) تُثبَّت null */
    secs.forEach(([k]) => { if (picks[k] === undefined) picks[k] = null; });
    let entry = wiz.entry;
    if (entry) {
      entry.picks = picks;
    } else {
      entry = { code: wiz.code, picks };
      libEntries(selTerm).push(entry);
    }
    const solo = wiz.solo;
    save();
    closeWizard();
    mkModal.render();
    mkTab.render();
    renderFrame();
    if (solo) openNook(entry);   /* رجوع لقُمرة المادة بعد التحرير */
  }

  $('#wiz-body').addEventListener('change', e => {
    if (!wiz || e.target.name !== 'wp') return;
    const [sec] = WIZ_SECS()[wiz.idx];
    const v = e.target.value;
    wiz.picks[sec] = sec === 'doc'
      ? { dr: v.split('::')[0], post: v.split('::')[1] }
      : v;
    document.querySelectorAll('#wiz-body .wpick').forEach(l =>
      l.classList.toggle('on', l.querySelector('input').checked));
    updateWizNext();
  });
  $('#wiz-prev').addEventListener('click', () => { if (wiz && wiz.idx > 0) { wiz.idx--; renderWiz(); } });
  $('#wiz-skip').addEventListener('click', () => {
    if (!wiz) return;
    const [sec] = WIZ_SECS()[wiz.idx];
    wiz.picks[sec] = null;   /* تخطٍّ صريح — اللوحة تبقى فارغة وقابلة للتعبئة لاحقًا */
    wizAdvance();
  });
  $('#wiz-next').addEventListener('click', () => { if (wiz) wizAdvance(); });
  $('#wiz-close').addEventListener('click', closeWizard);

  /* ============================================================
     نافذة تفاصيل المادة — تشاركية: كل قسم = مشاركات مجتمع
     (قائمة مشاركات → عرض مشاركة كاملة → أو كتابة رأيك بنفسك)
     ============================================================ */
  const courseModal = $('#course-modal');
  let cmCode = null;                       // كود المادة المفتوحة
  let cmTabSel = 'info';                   // القسم النشط (شريط واحد لكل الأقسام السبعة)
  let cmView = { mode: 'list', pi: 0 };    // list = المشاركات · view = مشاركة كاملة · edit = محرر رأيي
  let cmSort = 'newest';                    // ترتيب مساهمات «المادة»: newest (الأحدث) | best (الأفضل)
  let cmOpen = new Set();                  // كومنتات المادة/الدكاترة الموسّعة (مسفوطة افتراضًا) — مفاتيح «sec:pi» أو «doc:di:pi»
  const hourIdx = {};                      // الفترة المكتبية المعروضة حاليًا في العرض المنشور، لكل مشاركة (بمعرّفها)
  let ehIdx = 0;                           // الفترة المكتبية قيد التحرير حاليًا (مستطيل واحد بعدّاد وسهمين)
  let topicIdx = 0;                        // الموضوع المعروض في مستطيل «مواضيع المادة» بمحرّر «المادة»
  let cmDocSel = null;                     // الدكتور المختار في تبويب الدكاترة (null = شبكة الدكاترة)
  let docCarIdx = 0;                       // شريحة منتقي الدكاترة الأفقي المعروضة (٠ = كل الدكاترة)
  let cmSrcSel = null;                      // القناة المختارة في «المصادر» (null = تقسيم فهم/ممارسة · srcU · srcP)

  function showCmTab(t) {
    cleanupEmptyMine();   /* الخروج من محرر بلا كتابة لا يترك مشاركة فارغة */
    cxRoadSel = false;    /* ومغادرةُ الرَّكن تردّ التحديدَ إلى أشجار المساهمات */
    cmTabSel = t;
    cmView = { mode: 'list', pi: 0, di: 0 };
    cmOpen = new Set();   /* كومنتات المادة/الدكاترة تعود مسفوطة عند تبديل التبويب */
    dtAbs = new Set();    /* ومفاتيح التاريخ تعود إلى الزمن النسبيّ */
    cmDocSel = null;      /* الدكاترة تفتح على الشبكة */
    docCarIdx = 0;        /* والمنتقي يعود إلى «كل الدكاترة» */
    cmSrcSel = null;      /* المصادر تفتح على تقسيم فهم/ممارسة */
    vidView = { open: null, fold: {} };    /* كومنتات «الشروح» تفتح مسفوطة */
    cardView = { open: null, fold: {} };   /* وكومنتات «البطائق» كذلك */
    cxStudy = null;   /* أي جلسة مذاكرة تنتهي بتبديل التبويب */
    cxSel.clear();    /* والتحديدُ حالُ شجرةٍ بعينها — لا يُورَّث لتبويبٍ آخر */
    /* طريقة الإظهار «الأفضل»: دخول مباشر إلى أفضل مشاركة في القسم (إن وُجدت) */
    if (state.viewMode === 'best') {
      if (t === 'doc') {
        let best = null;
        doctorsOf(cmCode).forEach((dr, di) => dr.posts.forEach((p, pi) => {
          if (!best || (p.likes || 0) > best.l || ((p.likes || 0) === best.l && (p.ts || 0) > best.t))
            best = { di, pi, l: p.likes || 0, t: p.ts || 0 };
        }));
        if (best) cmView = { mode: 'view', pi: best.pi, di: best.di };
      } else {
        const bi = bestIdx(postsOf(cmCode, t));
        if (bi >= 0) cmView = { mode: 'view', pi: bi };
      }
    }
    renderCmSection();
  }
  $('.cm-panel').addEventListener('click', e => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    const t = b.dataset.tab;
    /* دائرة «أنا/+» في زر البند = فتح محرر مساهمتي في ذلك البند (بديل كومنت البذرة) */
    if (e.target.closest('.cm-face--me')) {
      if (!memberGate(T().needAcctPost)) return;   /* بابُ المساهمة للأعضاء */
      cleanupEmptyMine();
      cmTabSel = t;
      /* الدكاترة: «+» = مساهمة كومنت عن دكتور (المُصفّى حاليًّا وإلا أوّل دكتور) — لا إدارة دكاترة.
         إن لم يوجد دكاترة (يُوضعون خارجيًّا) نبقى على العرض */
      cmView = t !== 'doc'
        ? { mode: 'edit', pi: 0, sub: undefined }
        : (doctorsOf(cmCode).length ? { mode: 'edit', pi: 0, di: cmDocSel != null ? cmDocSel : 0 } : { mode: 'list', pi: 0 });
      renderCmSection();
      return;
    }
    showCmTab(t);
  });


  /* ألوان شرائح توزيع الدرجة (تتدور) */
  const GCOLORS = ['#6fb094', '#e1c172', '#7ea8d8', '#c98a8a', '#9b8ec4', '#5fb7c0', '#d8a06a', '#8aa0b4'];

  /* ---------- نموذج المشاركات: لكل قسم قائمة مشاركات {me, u:{name,img}, likes, liked, data} ---------- */
  /* abs = الغياب والتأخير (قناة واحدة، المساهمة تحمل الاثنين) · srcU/srcP = مصادر الفهم/الممارسة */
  const SECTIONS = ['info', 'doc', 'grade', 'abs', 'srcU', 'srcP', 'lessons', 'videos', 'cards'];
  function defaultData(sec) {
    switch (sec) {
      case 'info':  return { desc: '', type: '', rel: 0, lang: '', book: '' };   // «المادة»: النوعية + اللغة + الترابط + اسم الكتاب + الوصف
      case 'doc':   return { docs: [] };
      case 'grade': return { method: 'avg', items: [] };
      case 'abs':   return { free: 0, dedFrom: 0, dedAmt: 0, dn: 0, late: 0 };   // الغياب والتأخير معًا
      case 'srcU':  case 'srcP': return { html: '', files: {} };
      case 'lessons': return { items: [] };   // درس: {num: رقم الشابتر, name: اسمه} والترتيب = موقعه
      case 'videos':  return { deck: [] };   // رزمة حرة: شجرة — فيديو {t:'v',vt:'file'|'link',name,v,dur} أو مجلد {t:'f',name,ch}
      case 'cards':   return { deck: [] };   // رزمة حرة: شجرة عقد — بطاقة {t:'c',f,b} أو مجلد {t:'f',name,ch}
    }
  }
  function coursePosts(code) {
    const info = cinfo(code);
    if (!info.posts) {
      /* ترحيل البيانات القديمة (نموذج ما قبل التشاركية) إلى مشاركات باسمي */
      info.posts = {};
      const legacy = {
        info: (info.desc || info.rel || (info.study && info.study.type))
          ? { desc: info.desc || '', type: (info.study && info.study.type) || '', rel: info.rel || 0 } : null,
        doc: (info.docs && info.docs.length) ? { docs: info.docs } : null,
        grade: (info.grading && (info.grading.items.length || info.grading.method !== 'avg')) ? info.grading : null,
        abs: (info.absence && (info.absence.free || info.absence.dedFrom || info.absence.dedAmt || info.absence.dn || info.absence.late))
          ? { free: info.absence.free || 0, dedFrom: info.absence.dedFrom || 0, dedAmt: info.absence.dedAmt || 0, dn: info.absence.dn || 0, late: info.absence.late || 0 } : null,
        srcU: (info.study && info.study.study.length) ? { items: info.study.study } : null,
        srcP: (info.study && info.study.practice.length) ? { items: info.study.practice } : null,
      };
      SECTIONS.forEach(s => {
        info.posts[s] = legacy[s] ? [{ me: true, u: { name: T().meName }, likes: 0, liked: false, ts: Date.now(), data: legacy[s] }] : [];
      });
      save();
    }
    /* دمج «نوعية المادة» في «المادة»: مشاركات nature القديمة تنطوي داخل info */
    if (info.posts.nature) {
      info.posts.nature.forEach(np => {
        if (np.me) {
          const mine = info.posts.info.find(x => x.me);
          if (mine) { mine.data.type = np.data.type || ''; mine.data.rel = np.data.rel || 0; }
          else info.posts.info.push({ ...np, data: { desc: '', type: np.data.type || '', rel: np.data.rel || 0 } });
        } else {
          info.posts.info.push({ ...np, data: { desc: '', type: np.data.type || '', rel: np.data.rel || 0 } });
        }
      });
      delete info.posts.nature;
      save();
    }
    /* دمج «الغياب» و«التأخير» في قناة abs واحدة (عكس الفصل القديم): مساهمتي تُدمج في مشاركة
       واحدة، ومساهمات الآخرين تبقى كل واحدة مشاركة abs مستقلة · «المصادر» تبقى فهم/ممارسة */
    if (info.posts.absA || info.posts.absL) {
      const abs = info.posts.abs = info.posts.abs || [];
      const put = (p, patch) => {
        let t = p.me ? abs.find(x => x.me) : null;
        if (!t) { t = { ...p, data: { free: 0, dedFrom: 0, dedAmt: 0, dn: 0, late: 0 } }; abs.push(t); }
        Object.assign(t.data, patch);
      };
      (info.posts.absA || []).forEach(p => put(p, {
        free: p.data.free || 0, dedFrom: p.data.dedFrom || 0, dedAmt: p.data.dedAmt || 0, dn: p.data.dn || 0,
      }));
      (info.posts.absL || []).forEach(p => put(p, { late: p.data.late || 0 }));
      delete info.posts.absA; delete info.posts.absL;
      save();
    }
    if (info.posts.study) {
      info.posts.srcU = info.posts.srcU || [];
      info.posts.srcP = info.posts.srcP || [];
      info.posts.study.forEach(p => {
        const d = p.data || {};
        if (d.study && d.study.length) info.posts.srcU.push({ ...p, data: { items: d.study } });
        if (d.practice && d.practice.length) info.posts.srcP.push({ ...p, data: { items: d.practice } });
      });
      delete info.posts.study;
      save();
    }
    /* معرفات ثابتة لكل مساهمة (م0) — الاختيارات تُشير إليها فتصمد أمام الحذف والترتيب */
    {
      let tagged = false;
      Object.values(info.posts).forEach(arr => (arr || []).forEach(p => { if (!p.id) { p.id = newId(); tagged = true; } }));
      if (tagged) save();
    }
    return info.posts;
  }
  const postsOf = (code, sec) => { const P = coursePosts(code); return P[sec] || (P[sec] = []); };
  /* ============================================================
     ‎me‎ — عهدٌ يُقرأ قبل أن يُوصل الموقعُ بخادم
     ============================================================
     ‎me: true‎ تعني «هذي لي». وهي حقلٌ **مخزَّنٌ** لا سؤالٌ يُحسب، وتُقرأ في ثمانيةٍ
     وخمسين موضعًا بصيغةٍ واحدة (‎p.me‎ · ‎find(x => x.me)‎ · ‎x.me ? … : …‎).

     وما دام لا خادمَ فهي صادقةٌ دائمًا: ما في درجي فهو لي.

     ===== ويومَ يجيء الخادم =====
     تصير كاذبةً في حالةٍ واحدةٍ خطيرة: مساهمةٌ كتبها زميلي تحمل ‎me: true‎ في
     **درجه هو**، فإذا نزلت إليّ كما هي ادّعت أنّها لي — فأملكُ ما ليس لي، وأحرّره،
     ويُنسب إليّ.

     فالعهد: **كلُّ ما يرد من الخادم يُجرَّد من ‎me‎ ثمّ يُختم من جديد**
     (‎p.me = p.uid === session.uid‎) في **نقطة الورود وحدَها**. ولا يُوثَق بحقلٍ
     ورد من خارج — لا ‎me‎ ولا العدّادات.

     ولا تُلَفّ المواضعُ الثمانيةُ والخمسون في دالّة: اللفُّ لا يغني عن ختم الورود
     (فالختمُ لازمٌ لتجريد سائر الحقول على أيّ حال)، ويشتري ثمانيًا وخمسين فرصةَ
     خطأٍ اليوم بلا مقابل. القياسُ قال هذا، لا الذوق. */
  /* ---------- مساهمةُ الموقع ----------
     ما يشحنه الموقعُ معه (أغلفةُ الكتب، وبطائقُ البداية) ليس مساهمةَ أحد. وكان
     يُكتب بـ‎myPost‎ فيُنسب إلى **كلّ زائر**: يفتح المكتبةَ فيجد ألفًا وسبعمئة
     بطاقةٍ باسمه لم يكتبها، ويقدر أن يحرّرها، وتُحسب في إحصائيّاته.
     فتُنسب إلى «أكاديميا» كما تُنسب الأغلفةُ — وهو النموذجُ الذي استقرّ من قبل.
     وتُوسَم ‎seeded‎ فتُمحى بسطرٍ يوم يجيء المحتوى الحقيقيّ. */
  function sitePost(code, sec) {
    const arr = postsOf(code, sec);
    let p = arr.find(x => x && x.seeded && !x.me && x.u && x.u.name === T().siteName);
    if (!p) {
      p = { id: newId(), me: false, seeded: 1, u: { name: T().siteName },
            likes: 0, liked: false, ts: Date.now(), data: defaultData(sec) };
      arr.push(p);
    }
    return p;
  }

  function myPost(code, sec) {
    const arr = postsOf(code, sec);
    let p = arr.find(x => x.me);
    if (!p) { p = { id: newId(), me: true, u: { name: T().meName }, likes: 0, liked: false, ts: Date.now(), data: defaultData(sec) }; arr.push(p); save(); }
    return p;
  }

  /* بيانات أقسام «مشاركتي» — يكتب فيها محرر الأدمن */
  const infoData    = code => myPost(code, 'info').data;
  const natureData  = code => { const d = infoData(code); d.type = d.type || ''; d.rel = d.rel || 0; d.lang = d.lang || ''; d.book = d.book || ''; d.bookImg = d.bookImg || ''; return d; };   /* النوعية + اللغة + اسم الكتاب + صورته داخل «المادة» */

  /* كتاب 3D صغير جدًا: صورة الغلاف المضافة (إن وُجدت) وإلا غلاف بديل بكود المادة */
  function bookMini(code, img) {
    if (img) return `<span class="bk bk--xs"><span class="bkface bkface--img"><img src="${img}" alt=""></span></span>`;
    const sp = code.indexOf(' '), dept = code.slice(0, sp), num = code.slice(sp + 1);
    const deptLabel = state.lang === 'ar' ? (DEPT_AR[dept] || dept) : dept;
    return `<span class="bk bk--xs bk--ph"><span class="bkface"><b>${deptLabel}</b><i>${num}</i></span></span>`;
  }
  const docsData    = code => { const d = myPost(code, 'doc').data; return d.docs || (d.docs = []); };
  const gradingOf   = code => { const d = myPost(code, 'grade').data; d.items || (d.items = []); d.method || (d.method = 'avg'); return d; };

  /* صورة الحساب الافتراضية (Profile فلات مؤقتًا) */
  const FLAT_AVATAR = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4.2 4.8-6 8-6s6.5 1.8 8 6z"/></svg>';
  /* هوية «أنا» في كل مساهماتي = بروفايل الحساب (الصورة والاسم اللذان ضبطتُهما لنفسي) */
  const avatarHTML = p => {
    const src = (p.me && state.profile.img) ? state.profile.img : (p.u && p.u.img);
    return src ? `<img src="${src}" alt="">` : FLAT_AVATAR;
  };
  const nameOf = p => (p.me ? esc(state.profile.name || '') : esc((p.u && p.u.name) || '')) || T().meName;

  /* تاريخ المشاركة بصيغة هادئة: اليوم/أمس/قبل N أيام، وبعدها التاريخ الكامل */
  const agoTxt = ts => {
    if (!ts) return '';
    const n = Math.max(0, Math.floor((Date.now() - ts) / 86400000));
    const rel = T().ago(n);
    return rel || fmtDate(new Date(ts).toISOString().slice(0, 10));
  };
  /* التاريخ الرقمي المطلق (يوم/شهر/سنة) — يظهر بدل النسبي عند ضغط مفتاح التاريخ */
  const absDateTxt = ts => ts ? fmtDate(new Date(ts).toISOString().slice(0, 10)) : '';

  /* ---------- مفتاح التاريخ: التاريخ نفسه هو الزرّ ----------
     نقطة صغيرة تسبق التاريخ: مجوّفة والزمن نسبيّ («قبل ٣ أيام»)، وتمتلئ ذهبًا
     والتاريخ رقميّ. النقطة حاضرة على كل مساهمة دائمًا — هي وحدها ما يميّز التاريخ
     القابل للضغط عن نصّ ميّت. ومستقلّ تمامًا عن سهم توسيع النصّ: لكلٍّ زرّه ووظيفته.
     dtAbs حالة عرض محليّة لا تُحفظ، تُصفَّر بتبديل التبويب كحال cmOpen */
  let dtAbs = new Set();
  const dtKey = (p, k) => (p && p.id) ? `id:${p.id}` : `${cmCode}:${k}`;
  function dateBtnHTML(p, k) {
    if (!p || !p.ts) return '';
    const key = dtKey(p, k), on = dtAbs.has(key);
    return `<button type="button" class="post-date post-date--sw${on ? ' on' : ''}" data-dsw="${key}"
        title="${on ? T().dateRel : T().dateAbs}"><i class="pd-dot"></i>${on ? absDateTxt(p.ts) : agoTxt(p.ts)}</button>`;
  }

  /* ---------- الدكاترة: هوياتهم (صورة + اسم) يديرها الأدمن، وتحت كل دكتور مشاركات المجتمع عنه ----------
     doctors: [{name, img, posts: [{me, u, likes, liked, data:{e, hours, d, teach, grade}}]}] */
  function doctorsOf(code) {
    const info = cinfo(code);
    if (!info.doctors) {
      info.doctors = [];
      /* ترحيل النموذج السابق: مشاركات القسم كانت تحمل قائمة دكاترة كاملة */
      const P = coursePosts(code);
      (P.doc || []).forEach(post => {
        ((post.data && post.data.docs) || []).forEach(d => {
          info.doctors.push({
            name: d.n || '', img: d.img || '',
            me: !!post.me, u: post.u || { name: T().meName }, ts: post.ts || Date.now(),   /* من أضاف الدكتور */
            posts: [{
              me: !!post.me, u: post.u || { name: T().meName }, likes: 0, liked: false, ts: Date.now(),
              data: { e: d.e || '', hours: d.hours || [], d: d.d || '', teach: d.teach || 0, grade: d.grade || 0 },
            }],
          });
        });
      });
      save();
    }
    /* معرفات ثابتة للدكاترة ومساهماتهم (م0) */
    {
      let tagged = false;
      info.doctors.forEach(dr => {
        if (!dr.id) { dr.id = newId(); tagged = true; }
        if (dr.ts == null) {   /* ترحيل «من أضاف الدكتور»: من أول مساهمة إن وُجدت، وإلا مجهول */
          const f = (dr.posts || [])[0];
          dr.me = dr.me || !!(f && f.me);
          dr.u = dr.u || (f && f.u) || { name: T().docByAnon };
          dr.ts = f ? f.ts : Date.now();
          tagged = true;
        }
        (dr.posts || []).forEach(p => { if (!p.id) { p.id = newId(); tagged = true; } });
      });
      if (tagged) save();
    }
    /* فكّ دمج «الغياب والتأخير» عن مساهمة الدكتور: صار بندًا مستقلًّا على مستوى المادة (قناة abs).
       كل مساهمة دكتور فيها بيانات غياب تُنقل مساهمةً في القناة باسم صاحبها وتاريخها نفسه،
       ثم يُحذف الحقل من مساهمة الدكتور. تعمل مرّة واحدة لكل مساهمة لأن الحقل يُحذف بعدها */
    {
      const abs = coursePosts(code).abs || (coursePosts(code).abs = []);
      let moved = false;
      info.doctors.forEach(dr => (dr.posts || []).forEach(p => {
        const A = p.data && p.data.abs;
        if (!A) return;
        if (A.free || A.dedFrom || A.dedAmt || A.dn || A.late) {
          /* مساهمتي تُدمج في مساهمتي الواحدة بالقناة؛ ومساهمات غيري كلٌّ منها مستقلّة */
          const mine = p.me ? abs.find(x => x.me) : null;
          if (mine) Object.assign(mine.data, {
            free: mine.data.free || A.free || 0, dedFrom: mine.data.dedFrom || A.dedFrom || 0,
            dedAmt: mine.data.dedAmt || A.dedAmt || 0, dn: mine.data.dn || A.dn || 0, late: mine.data.late || A.late || 0,
          });
          else abs.push({
            id: newId(), me: !!p.me, u: p.u || { name: T().meName },
            likes: 0, liked: false, ts: p.ts || Date.now(),
            data: { free: A.free || 0, dedFrom: A.dedFrom || 0, dedAmt: A.dedAmt || 0, dn: A.dn || 0, late: A.late || 0 },
          });
        }
        delete p.data.abs;
        moved = true;
      }));
      if (moved) save();
    }
    return info.doctors;
  }
  function myDrPost(code, di) {
    const dr = doctorsOf(code)[di];
    let p = dr.posts.find(x => x.me);
    if (!p) {
      p = { id: newId(), me: true, u: { name: T().meName }, likes: 0, liked: false, ts: Date.now(), data: { e: '', hours: [], d: '', teach: 0, grade: 0 } };
      dr.posts.push(p);
      save();
    }
    return p;
  }

  /* عشرة مكعبات تفاعلية للتقييم من 10 */
  function rateBlocks(key, val) {
    let s = '';
    for (let i = 1; i <= 10; i++) s += `<span class="rb ${i <= val ? 'on' : ''}" data-r="${i}"></span>`;
    return `<div class="rate">
      <span class="rate__k">${key === 'teach' ? T().teach : T().grade}</span>
      <div class="rate__blocks" data-k="${key}">${s}</div>
      <b class="rate__v">${val || 0}/10</b>
    </div>`;
  }

  /* أوقات الدكتور المكتبية: قائمة مربعات {اليوم، من، إلى} — مع ترحيل الصيغة القديمة (days/from/to) */
  const docHours = d => d.hours || (d.hours = (d.days || []).map(day => ({ day, from: d.from || '', to: d.to || '' })));
  /* سياسة الغياب/التأخير الخاصة بالدكتور (نفس نموذج قناة abs، لكن داخل مساهمة الدكتور) */
  const docAbs = d => d.abs || (d.abs = { free: 0, dedFrom: 0, dedAmt: 0, dn: 0, late: 0 });

  /* اكتمال مساهمة الدكتور: كم بندًا مُعبّأ من ٨ (إيميل/ساعات/مكتب/شرح/كرم/غياب/تأخير/انطباع) */
  /* اكتمال مساهمة «الغياب والتأخير»: خمسة بنود — الغيابات المجانية وبداية الخصم ومقداره وDN والتأخير */
  function absCompleteness(d) {
    const checks = [d.free > 0, d.dedFrom > 0, d.dedAmt > 0, d.dn > 0, d.late > 0];
    return { filled: checks.filter(Boolean).length, total: checks.length };
  }
  function docCompleteness(d) {
    /* ستة بنود بعد فصل «الغياب والتأخير» إلى تبويبه المستقلّ (لهما اكتمالهما هناك) */
    const checks = [
      !!d.e,
      docHours(d).length > 0,
      !!(d.bld || d.room),
      d.teach > 0,
      d.grade > 0,
      !!d.d,
    ];
    return { filled: checks.filter(Boolean).length, total: checks.length };
  }
  /* اكتمال مساهمة «المادة»: كم بندًا مُعبّأ من ٥ (الكتاب/النوعية/اللغة/الترابط/الوصف) */
  function infoCompleteness(d) {
    const checks = [
      !!(d.book || d.bookImg),
      !!d.type,
      !!d.lang,
      d.rel > 0,
      !!d.desc,
    ];
    return { filled: checks.filter(Boolean).length, total: checks.length };
  }
  /* اكتمال «توزيع الدرجات»: نسبة ما وُزّع من الـ100% (لا عدّ بنود — البنود حرّة العدد) */
  function gradeCompleteness(d) {
    const used = (d.items || []).reduce((s, x) => s + (x.pct || 0), 0);
    return { filled: Math.min(100, used), total: 100, pct: true };
  }
  /* اكتمال «المصادر» بعد حذف نوع الملف (أساسي/فرعي): نصٌّ مكتوب (٥٠٪) + ملفٌّ مرفق (٥٠٪) */
  function srcCompleteness(d) {
    const doc = srcDocOf(d);
    const hasFile = Object.keys(doc.files).some(id => {
      const f = doc.files[id];
      return f && (f.v || f.name);
    });
    const checks = [!!stripRich(doc.html), hasFile];
    return { filled: checks.filter(Boolean).length, total: checks.length };
  }
  /* اكتمال المساهمة حسب القسم: الدكتور (٨ بنود) · المادة (٥ بنود) · توزيع الدرجات (٪ من ١٠٠)
     · المصادر (نصّ + ملف) */
  function completenessOf(sec, d) {
    return sec === 'doc' ? docCompleteness(d)
         : sec === 'info' ? infoCompleteness(d)
         : sec === 'abs' ? absCompleteness(d)
         : sec === 'grade' ? gradeCompleteness(d)
         : (sec === 'srcU' || sec === 'srcP') ? srcCompleteness(d)
         : null;
  }
  /* مؤشّر الاكتمال: دائرة صغيرة تمتلئ ذهبًا سائلًا بقدر ما اكتمل (يمين الإبهام، بلا رقم) */
  function completeGlyph(cc) {
    if (!cc) return '';
    const { filled, total } = cc;
    const pct = total ? Math.round(filled / total * 100) : 0;
    const tip = cc.pct ? T().completePct(filled) : T().completeTip(filled, total);
    return `<span class="cc-liquid" title="${tip}" aria-label="${tip}">${pct > 0 ? `<span class="cc-fill" style="height:${pct}%"></span>` : ''}</span>`;
  }
  /* تحديث امتلاء دائرة الاكتمال حيًّا داخل بطاقة التحرير المفتوحة — بلا إعادة رسم كي لا ينقطع التركيز */
  function refreshEditCompleteness() {
    if (!cmCode) return;
    const post = document.querySelector('.post.pk--edit');
    if (!post) return;
    /* قبل أيّ خروجٍ مبكر: «الشروح» و«البطائق» لا دائرةَ اكتمالٍ لهما ولا ‎cc‎،
       فلو تُرك هذا السطر بعد الحارسَين لَما ظهرت أيقونتاهما أبدًا */
    refreshEditActs(post);
    const wrap = post.querySelector('.cc-liquid');
    if (!wrap) return;
    let cc = null;
    if (post.dataset.dr != null) cc = docCompleteness(myDrPost(cmCode, +post.dataset.dr).data);
    else if (post.dataset.sub) cc = completenessOf(post.dataset.sub, myPost(cmCode, post.dataset.sub).data);
    if (!cc) return;
    const pct = cc.total ? Math.round(cc.filled / cc.total * 100) : 0;
    wrap.innerHTML = pct > 0 ? `<span class="cc-fill" style="height:${pct}%"></span>` : '';
    const tip = cc.pct ? T().completePct(cc.filled) : T().completeTip(cc.filled, cc.total);
    wrap.title = tip; wrap.setAttribute('aria-label', tip);
    refreshEditActs(post);
  }
  /* ===== الوضع والنشر لا يظهران قبل أن يُكتب شيء =====
     مساهمةٌ خاوية لا وضعَ لها ولا شيء يُنشر — فأوّل حرفٍ يُظهر الأيقونتين معًا.
     ويُبدَّل صنفٌ فقط لا يُعاد بناء الصفّ، كي لا ينقطع التركيز عن الحقل */
  function editActsData(post) {
    if (post.dataset.dr != null) return { sec: 'doc', d: myDrPost(cmCode, +post.dataset.dr).data };
    const sec = post.dataset.sub || edSec();
    return { sec, d: myPost(cmCode, sec).data };
  }
  function refreshEditActs(post) {
    post = post || document.querySelector('.post.pk--edit');
    if (!post || !cmCode) return;
    const { sec, d } = editActsData(post);
    const off = !editHasInput(sec, d);
    post.querySelectorAll('.pst-badge, .info-sharebtn').forEach(el => el.classList.toggle('is-off', off));
  }
  /* كلّ كتابةٍ داخل بطاقة التحرير تُراجع الأيقونتين — مستمعٌ واحد يكفي البنودَ كلَّها،
     فلا نطارد كلّ حقلٍ في كلّ قسم (المصادر بمربّعها الغنيّ، والشجرتان بحقولهما النامية) */
  document.addEventListener('input', e => {
    if (!e.target.closest || !e.target.closest('.post.pk--edit')) return;
    /* مؤجَّلٌ إلى ما بعد المستمعين الآخرين: هذا المستمع سُجّل أوّلًا، والحقلُ يكتب قيمته
       في مستمعٍ لاحق — فلو قرأنا الآن لقرأنا ما قبل الكتابة لا ما بعدها */
    setTimeout(refreshEditActs, 0);
  });

  /* مربع صورة المادة (عرض فقط — الرفع من سوق المواد): كتاب 3D كبير داخل نافذة المادة */
  function courseImgBox(code) {
    const im = imgOf(code);
    return `<div class="cm-cimg cm-cimg--book">${
      im ? `<span class="bk bk--lg"><img src="${im}" alt=""></span>` : phBook(code, true)
    }</div>`;
  }



  /* شريط الغيابات الملوّن (أخضر مجاني · أصفر خصم · أحمر DN) — يُستخدم في الوضعين.
     طوله = أقصى رقم ذي معنى (المجاني/بداية الخصم/DN)، فتظهر الدوائر الخضراء ولو بلا DN.
     الدلالات تعرض فقط الألوان الموجودة فعلًا */
  /* ===== وما استُهلك من السلّم يُشطب =====
     الحبّاتُ كانت تقول **السياسة** وحدَها (أين المجّانيُّ وأين الخصمُ وأين الحرمان)
     ولا تقول **أين أنت منها**. فيُشطب ما بلغتَه: خطٌّ مائلٌ على كلّ حبّةٍ استُهلكت.
     ===== والعددُ ‎eff‎ لا غيابُك الخام =====
     ثلاثُ تأخيراتٍ غيابٌ (‎A.late‎ هي ‎lateN‎ ههنا)، فالمستهلَكُ
     ‎eff = abs + ⌊late / lateN⌋‎ — وهو الذي تمشي عليه ألوانُ الحبّات (الخصمُ يبدأ
     عند ‎dedFrom‎ من ‎eff‎). فلو شُطب الخامُ لقال السلّمُ غيرَ ما تقوله ألوانُه.
     ===== ولا يُشطب إلّا حيث للسجلّ معنًى =====
     ‏‎me‎ لا يُمرَّر إلّا من قُمرة المادّة. وأمّا معاينةُ مساهمةٍ أو محرّرُها فيعرضان
     **سياسةَ غيرِك** لا وقوفَك منها، فيبقى سلّمُهما بلا شطب */
  function absStripHTML(A, me) {
    const n = Math.max(A.free || 0, A.dedFrom || 0, A.dn || 0);
    if (!(n > 0)) return '';
    const M = me || null;
    const used = M ? (+M.abs || 0)
      + (A.late > 0 ? Math.floor((+M.late || 0) / A.late) : 0) : 0;
    const cells = [];
    for (let i = 1; i <= Math.min(n, 20); i++) {
      const cls = (A.dn > 0 && i >= A.dn) ? 'dn'
                : (A.dedFrom > 0 && i >= A.dedFrom) ? 'ded'
                : (i <= A.free) ? 'ok'
                : 'mid';
      cells.push(`<span class="abc abc--${cls}${i <= used ? ' is-cut' : ''}">${i}</span>`);
    }
    return `<div class="abs-strip">${cells.join('')}</div>`;
  }
  /* دلالات الشريط (مجاني/خصم/DN) — تعرض فقط الألوان الموجودة فعلًا */
  function absLegHTML(A) {
    const items = [];
    if (A.free > 0) items.push(`<span><i class="abc--ok"></i>${T().legFree}</span>`);
    if (A.dedFrom > 0) items.push(`<span><i class="abc--ded"></i>${T().legDed}${A.dedAmt ? ` (−${A.dedAmt}%)` : ''}</span>`);
    if (A.dn > 0) items.push(`<span><i class="abc--dn"></i>${T().legDN}</span>`);
    return items.length ? `<div class="abs-leg">${items.join('')}</div>` : '';
  }

  /* محرر «الغياب والتأخير» موحّد: عدّادات الغياب + الشريط الملوّن، ثم عدّاد التأخير — قناة abs واحدة */
  function renderAbsence() {
    const A = myPost(cmCode, 'abs').data;
    const step = (f, label) => `
      <div class="abs-row">
        <span class="abs-k">${label}</span>
        <div class="abs-step" data-ab="${f}">
          <button type="button" data-d="-1">−</button>
          <b>${A[f] || 0}</b>
          <button type="button" data-d="1">+</button>
        </div>
      </div>`;
    /* التحرير: العدّادات فقط — بلا الشكل التمثيلي (الشريط/الدلالات) */
    $('#cm-abs').innerHTML =
      step('free', T().absFree) + step('dedFrom', T().absDedFrom) + step('dedAmt', T().absDedAmt) +
      step('dn', T().absDN) +
      step('late', T().absLate) +
      (A.late > 0 ? `<p class="abs-late">${T().lateNote(A.late)}</p>` : '');
  }

  /* مصادر المذاكرة/الممارسة: بطاقات أساسي/فرعي، وكل بطاقة ملف أو رابط أو نص */
  /* مربّع مصدر واحد: أعلاه [أساسي/فرعي] + أيقونة ملف + ✕، وجسمه مربّع نصّي يُكتب فيه
     ويقبل إفلات ملف عليه. إرفاق ملف يحوّله لمصدر ملف (يعرض اسمه بدل النصّ) */
  /* ملف لا مشبك: ورقة بركن مطويّ — أقرب إلى المُدرَج (ملفات المصادر) من رمز الإرفاق */
  const SRC_FILE_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 3v5h5"/></svg>';
  const SRC_LIST_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.3" fill="currentColor"/><circle cx="4.5" cy="12" r="1.3" fill="currentColor"/><circle cx="4.5" cy="18" r="1.3" fill="currentColor"/></svg>';
  /* كتل المصدر: نصوص وملفات بالتناوب داخل المربّع نفسه — يكتب قبل الملف وبعده.
     ترحيل الشكل القديم {t,name,v} إلى كتلة واحدة */
  /* تنقية النصّ المنسَّق: قائمة سماح صارمة للوسوم، وكل السمات تُحذف (لصقٌ خارجي لا يكسر الثيم) */
  const RICH_OK = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, UL: 1, OL: 1, LI: 1, BR: 1, DIV: 1, P: 1 };
  const ZWSP = '​';   /* مرساة المؤشّر بعد شريحة الملف */
  function sanitizeRich(html) {
    const box = document.createElement('div');
    box.innerHTML = String(html == null ? '' : html);
    const walk = node => {
      [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 3) return;                       /* نصّ: يُترك */
        if (ch.nodeType !== 1) { ch.remove(); return; }       /* تعليق/غيره: يُحذف */
        /* شريحة ملف: تُبقى مُطبَّعة وتُفرَّغ — محتواها عرضٌ يُبنى وقت الرسم من files */
        if (ch.tagName === 'SPAN' && ch.dataset && ch.dataset.fid) {
          const fid = ch.dataset.fid;
          [...ch.attributes].forEach(a => ch.removeAttribute(a.name));
          ch.setAttribute('data-fid', fid);
          ch.setAttribute('class', 'src-fchip');
          ch.setAttribute('contenteditable', 'false');
          ch.innerHTML = '';
          return;
        }
        if (!RICH_OK[ch.tagName]) {                           /* وسم غير مسموح: يُستبدل بمحتواه */
          const frag = document.createDocumentFragment();
          while (ch.firstChild) frag.appendChild(ch.firstChild);
          ch.replaceWith(frag);
          walk(node);
          return;
        }
        [...ch.attributes].forEach(a => ch.removeAttribute(a.name));
        walk(ch);
      });
    };
    walk(box);
    return box.innerHTML;
  }
  /* تجريد الوسوم والشرائح → نصّ مسطّح (للملخّص المقصوص وقياس الفراغ) */
  /* ===== سطورُ الأقنعة: مخزنٌ لا متن =====
     «الإخفاء» يخزّن أقنعتَه نصًّا في الحقل بصيغة أنكي (‎{{c1::image-occlusion:…}}‎ وأخواتُها
     العارية)، وذلك مقصودٌ في **المخزن**. لكنّ كلَّ من يقرأ البطاقة في الموقع — صفُّ الشجرة
     وعنوانُ الورقة والمعاينةُ والبحث — كان يعرضها حرفًا حرفًا، فيرى المستخدمُ جدارًا من
     الإحداثيّات مكانَ صورته. والعلّةُ أنّ هذه السطور ليست ممّا يُقرأ أصلًا.
     فتُنزع من **باب القراءة الواحد** (‎stripRich‎) لا من كلّ قارئٍ على حدة: من أراد نصَّ
     البطاقة أخذ نصَّها، والأقنعةُ تبقى في الحقل لمن يفكّها (‎ioParse‎) ولأنكي إذا صُدّرت.
     والصيغتان تُقرآن من ‎ioRe‎ وحدها: كاتبُ السطر وقارئُه ونازعُه ثلاثةٌ على تعريفٍ واحد،
     ولو نُسخ الرسمُ في ثلاثة مواضع لَافترقت يومًا */
  function ioRe(wrapped) {
    return wrapped
      ? /\{\{\s*c\s*(\d+)\s*::\s*image-occlusion:([^}]*)\}\}\s*(?:<br\s*\/?>)?/gi
      : /image-occlusion:([^<{}]*)\s*(?:<br\s*\/?>)?/gi;
  }
  /* والملفوفُ أوّلًا ثمّ العاري — وإلّا التقط العاري جوفَ القوسين وترك ‎{{c1::‎ نصًّا يُرى */
  const ioStrip = html => String(html == null ? '' : html)
    .replace(ioRe(true), '').replace(ioRe(false), '');
  /* ===== وللبطاقة متنٌ غيرُ الحرف =====
     ‎stripRich‎ تقول «ما نصُّها؟»، ومن سألها «أفيها شيء؟» أخطأ السؤال: بطاقةُ الإخفاء
     صورةٌ بأقنعتها ولا حرفَ فيها قطّ، فتُقرأ خاويةً وهي ممتلئة — فلا يظهر شريطاها،
     وتُمحى عند الإغلاق. فيُسأل عن الصورة صراحةً حيث يُسأل عن الفراغ */
  const cdHasPic = h => /<img\b/i.test(String(h == null ? '' : h));
  function stripRich(html) {
    const box = document.createElement('div');
    box.innerHTML = ioStrip(html).replace(/<\/(div|p|li|ul|ol)>/gi, ' ').replace(/<br\s*\/?>/gi, ' ');
    box.querySelectorAll('[data-fid]').forEach(n => n.remove());
    return (box.textContent || '').split(ZWSP).join('').replace(/\s+/g, ' ').trim();
  }
  /* مستند المصدر: {html, files} — ترحيل ثلاثي (كتل · حقل مفرد · نصّ صريح) يُنفَّذ مرة واحدة */
  function srcDoc(s) {
    if (typeof s.html === 'string' && s.files) return s;
    const files = {};
    let html = '';
    const chip = (name, v) => { const id = newId(); files[id] = { name: name || '', v: v || '' };
      return `<span class="src-fchip" data-fid="${id}" contenteditable="false"></span>`; };
    const asRich = b => b.rich ? (b.v || '') : esc(b.v || '').replace(/\n/g, '<br>');
    if (Array.isArray(s.blocks)) {
      s.blocks.forEach(b => { html += b.t === 'file' ? chip(b.name, b.v) : asRich(b); });
    } else if (s.t === 'file') {
      html = chip(s.name, s.v);
    } else {
      html = esc(s.v || '').replace(/\n/g, '<br>');
    }
    s.html = sanitizeRich(html);
    s.files = files;
    delete s.blocks; delete s.t; delete s.v; delete s.name;
    return s;
  }
  /* محتوى الشريحة المعروض (يُبنى وقت الرسم، ويتبع اللغة) — بلا نوع (أساسي/فرعي): الملف ملفّ فقط */
  function srcChipInner(f, area, fid) {
    const label = f && (f.v || f.name)
      ? `<b class="fchip-n">${esc(f.name) || '—'}</b>`
      : `<i class="fchip-ph">${T().filePick}</i>`;
    return `${SRC_FILE_IC}${label}<button type="button" class="fchip-del" title="✕">✕</button>`;
  }
  /* مستند المساهمة كاملةً: {html, files} — المساهمة مربّع كتابة واحد،
     والملف ملفٌّ فقط (نوع أساسي/فرعي حُذف). ترحيل من items[] مرة واحدة */
  function srcDocOf(d) {
    if (typeof d.html === 'string' && d.files) return d;
    let html = ''; const files = {};
    (d.items || []).forEach(s => {
      const sd = srcDoc(s);
      Object.keys(sd.files).forEach(id => { files[id] = sd.files[id]; });
      html += sd.html;
    });
    d.html = sanitizeRich(html);
    d.files = files;
    delete d.items;
    return d;
  }
  const srcPostDoc = area => srcDocOf(myPost(cmCode, area).data);
  /* العرض المنشور الموسّع: نفس الـhtml وشرائحه تُستبدل بروابط تنزيل داخل مجرى النصّ */
  function srcViewHTML(data) {
    const d = srcDocOf(data);
    const box = document.createElement('div');
    box.innerHTML = sanitizeRich(d.html);
    box.querySelectorAll('[data-fid]').forEach(n => {
      const f = d.files[n.dataset.fid];
      if (!f || !(f.v || f.name)) { n.remove(); return; }
      /* الملف مستطيل بترولي داخل مجرى النصّ (نفس ثيم مستطيلات «المادة» المنشورة) لا رابطًا عاريًا */
      const a = document.createElement('a');
      a.className = 'v-badge src-badge src-fbadge';
      a.href = f.v || '#'; a.setAttribute('download', f.name || '');
      a.innerHTML = `<b class="v-val">${esc(f.name) || '—'}</b>`;
      n.replaceWith(a);
    });
    return box.innerHTML.split(ZWSP).join('').trim() ? `<div class="v-desc v-rich">${box.innerHTML}</div>` : '';
  }
  /* سهم التوسيع إنلاين — نفس زرّ «الدكاترة» حرفيًّا (يأتي بعد آخر كلمة ظاهرة) */
  const inlineTogHTML = open => `<button type="button" class="pk-toggle pk-toggle--inline" title="${open ? T().pkCollapse : T().pkExpand}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>`;
  /* ملخّص «المصادر» المطويّ: نفس منطق قصّ انطباع «الدكتور» (حدّ حروف + كسر عند مسافة + «…»)،
     لكنه يُنفَّذ على الشجرة لا على نصّ مسطّح — فتبقى المساهمة كما كُتبت ويبقى كل ملف في موضعه.
     المستطيل يزن ‎FW‎ حرفًا في العدّ لأنه يشغل مساحة سطر لا حرفًا واحدًا */
  const SRC_PEEK_LIMIT = 160, FW = 16;
  function srcPeekHTML(data, open, flat) {
    const html = srcViewHTML(data);
    if (!html) return '';
    const box = document.createElement('div');
    box.innerHTML = html;
    const root = box.firstElementChild;
    /* هل المساهمة أطول من حدّ الطيّ أصلًا؟ يُقاس قبل القصّ وبمعزل عن حالة الفتح،
       فلا يُرسم السهم لمساهمة قصيرة، ولا يختفي عن مساهمة موسّعة */
    const measure = node => [...node.childNodes].reduce((s, ch) =>
      s + (ch.nodeType === 3 ? (ch.nodeValue || '').length
        : ch.nodeType !== 1 ? 0
        : (ch.classList && ch.classList.contains('src-badge')) ? FW
        : measure(ch)), 0);
    const isLong = measure(root) > SRC_PEEK_LIMIT;
    let host = root, n = 0, done = false;
    if (!open && !flat) {
      const walk = node => {
        [...node.childNodes].forEach(ch => {
          if (done) { ch.remove(); return; }
          if (ch.nodeType === 3) {                       /* نصّ: يُعدّ ويُقصّ عند تجاوز الحدّ */
            const t = ch.nodeValue || '';
            if (n + t.length <= SRC_PEEK_LIMIT) { n += t.length; return; }
            let cut = t.slice(0, Math.max(0, SRC_PEEK_LIMIT - n));
            const sp = cut.lastIndexOf(' ');
            if (sp > cut.length * 0.6) cut = cut.slice(0, sp);
            cut = cut.trim();
            if (cut) { ch.nodeValue = cut + '… '; host = ch.parentNode; }
            else { host = ch.parentNode; ch.remove(); }
            done = true;
            return;
          }
          if (ch.nodeType !== 1) { ch.remove(); return; }
          if (ch.classList && ch.classList.contains('src-badge')) { n += FW; return; }   /* الملف يبقى كما هو */
          walk(ch);
        });
      };
      walk(root);
    }
    if (!flat && isLong) host.insertAdjacentHTML('beforeend', inlineTogHTML(open));
    return box.innerHTML;
  }
  /* ملء شرائح html من خريطة files — للعرض في المحرّر */
  function srcFillChips(html, files, area) {
    const box = document.createElement('div');
    box.innerHTML = html || '';
    box.querySelectorAll('[data-fid]').forEach(n => {
      const fid = n.dataset.fid, f = files[fid];
      n.className = 'src-fchip' + (f && (f.v || f.name) ? '' : ' src-fchip--empty');
      n.setAttribute('contenteditable', 'false');
      n.innerHTML = srcChipInner(f, area, fid);
    });
    return box.innerHTML;
  }
  /* شريط أدوات الكتابة (B · I · قائمة · ملف) — لم يعد داخل مربّع الكتابة:
     يُركَّب في تذييل بطاقة التحرير يمين زرّ الحذف ✕، فيحمل data-area ليعرف مجاله */
  function srcToolsHTML(area) {
    return `<span class="src-tools" data-area="${area}">
      <button type="button" class="src-tool src-fmt" data-cmd="bold" data-area="${area}" title="${T().fmtBold}"><b>B</b></button>
      <button type="button" class="src-tool src-fmt" data-cmd="italic" data-area="${area}" title="${T().fmtItalic}"><i>I</i></button>
      <button type="button" class="src-tool src-fmt" data-cmd="insertUnorderedList" data-area="${area}" title="${T().fmtList}">${SRC_LIST_IC}</button>
      <button type="button" class="src-tool src-tool--file" data-area="${area}" title="${T().src_file}">${SRC_FILE_IC}</button>
      <!-- الفاصل بعد الملفّ لا قبله: يفصل أدوات الكتابة عن أزرار المساهمة (الحذف والإرسال) -->
      <span class="src-tools__sep"></span>
    </span>`;
  }
  /* مجال المصادر لعنصر: من data-area (أدوات التذييل) أو من الحاوي ‎.src-area‎ (داخل المربّع) */
  const srcAreaOf = el => (el.dataset && el.dataset.area) || (((el.closest('.src-area') || {}).dataset || {}).area);
  const srcBoxOf = area => document.querySelector(`.src-area[data-area="${area}"] .src`);
  const srcInOf = area => document.querySelector(`.src-area[data-area="${area}"] .src-in`);

  /* مساحة كتابة واحدة للمساهمة: بلا إطار ولا ترويسة — الكتابة مباشرةً تحت الاسم */
  function renderSources(area) {
    const d = srcPostDoc(area);
    document.querySelector(`#cm-src-${area}`).innerHTML = `<div class="src">
      <div class="src-in" contenteditable="true" data-ph="${esc(T().textPh)}">${srcFillChips(d.html, d.files, area)}</div>
      <input type="file" class="src-file" hidden>
    </div>`;
  }
  /* حفظ محتوى المحرّر في المستند (بلا إعادة رسم — كي لا ينقطع المؤشّر) */
  function saveSrcHtml(area, el) {
    const d = srcPostDoc(area);
    d.html = sanitizeRich(el.innerHTML);
    /* تنظيف: ملفات لم تعد لها شريحة في النصّ */
    const alive = {};
    const box = document.createElement('div'); box.innerHTML = d.html;
    box.querySelectorAll('[data-fid]').forEach(n => { if (d.files[n.dataset.fid]) alive[n.dataset.fid] = d.files[n.dataset.fid]; });
    d.files = alive;
    save();
  }
  /* تعبئة شريحة ملف موجودة (بالنقر عليها أو بالإفلات) — حد 3MB، وتُحدَّث في مكانها بلا إعادة رسم */
  function readSrcFile(area, fid, file, chipEl) {
    const d = srcPostDoc(area);
    if (!d.files[fid] || !file) return;
    const put = (name, v) => {
      d.files[fid] = { name, v };
      if (chipEl) {
        chipEl.className = 'src-fchip' + ((v || name) ? '' : ' src-fchip--empty');
        chipEl.innerHTML = srcChipInner(d.files[fid], area, fid);
      }
      save();
    };
    if (file.size > 3 * 1024 * 1024) { put(T().fileTooBig, ''); return; }
    const rd = new FileReader();
    rd.onload = () => put(file.name, rd.result);
    rd.readAsDataURL(file);
  }
  /* أداة الملف: تدرج شريحة فارغة **إنلاين في موضع المؤشّر** — إدراجٌ مباشر في DOM بلا إعادة رسم،
     فيبقى المؤشّر حيًّا ويقف بعد الشريحة على السطر نفسه */
  function insertFileChip(area, box) {
    const el = box.querySelector('.src-in');
    if (!el) return;
    const d = srcPostDoc(area);
    const fid = newId();
    d.files[fid] = { name: '', v: '' };
    const chip = document.createElement('span');
    chip.className = 'src-fchip src-fchip--empty';
    chip.setAttribute('data-fid', fid);
    chip.setAttribute('contenteditable', 'false');
    chip.innerHTML = srcChipInner(d.files[fid], area, fid);

    const sel = window.getSelection();
    let r = null;
    if (sel && sel.rangeCount && el.contains(sel.getRangeAt(0).startContainer)) r = sel.getRangeAt(0);
    if (!r) { el.focus(); r = document.createRange(); r.selectNodeContents(el); r.collapse(false); }
    r.deleteContents();
    r.insertNode(chip);
    /* مرساة: بلا عقدة نصّية بعد عنصر contenteditable=false يتعذّر وضع المؤشّر خلفه */
    const pad = document.createTextNode(ZWSP);
    chip.after(pad);
    const nr = document.createRange();
    nr.setStart(pad, 1); nr.collapse(true);
    sel.removeAllRanges(); sel.addRange(nr);
    el.focus();
    saveSrcHtml(area, el);
  }

  /* منطقة التقييم: شريط 100% مقسّم شرائح ملونة + بنود باسم ونسبة (سلايدر) حتى يكتمل التوزيع */
  function renderGrading() {
    const g = gradingOf(cmCode);
    document.querySelectorAll('#cm-gmethod .gm-btn').forEach(b =>
      b.classList.toggle('on', b.dataset.m === g.method));
    const used = g.items.reduce((s, x) => s + x.pct, 0);
    const rem = Math.max(0, 100 - used);
    const segs = g.items.map((x, i) =>
      `<span class="gseg" style="width:${x.pct}%;background:${GCOLORS[i % GCOLORS.length]}">${x.pct >= 8 ? x.pct + '%' : ''}</span>`).join('');
    const rows = g.items.map((x, i) => `
      <div class="gitem" data-i="${i}">
        <span class="gdot" style="background:${GCOLORS[i % GCOLORS.length]}"></span>
        <input class="gi-name" value="${esc(x.name)}" placeholder="${T().itemPh}">
        <input class="gi-pct" type="range" min="0" max="${x.pct + rem}" value="${x.pct}">
        <b class="gi-val">${x.pct}%</b>
        <button type="button" class="gi-del" title="✕">✕</button>
      </div>`).join('');
    $('#cm-gbody').innerHTML = `
      <div class="gbar">${segs}${rem > 0 ? `<span class="gbar__rest" style="width:${rem}%">${T().remaining(rem)}</span>` : ''}</div>
      ${rem === 0 && g.items.length ? `<p class="gfull">${T().complete}</p>` : ''}
      ${rows}`;
  }

  /* شريط توزيع الدرجة + اسم كل بند عند لونه، متناوبًا فوق البار وتحته (يمين→يسار: الأول تحت، الثاني فوق، …)
     لمنع التداخل. صفّا التسميات (علوي/سفلي) يطابقان عرض الشرائح فيحاذي كلٌّ لونه، تصله ساق ملوّنة */
  function gDistHTML(items) {
    const rem = Math.max(0, 100 - items.reduce((s, x) => s + x.pct, 0));
    const segs = items.map((x, i) =>
      `<span class="gseg" style="width:${x.pct}%;background:${GCOLORS[i % GCOLORS.length]}">${x.pct >= 8 ? x.pct + '%' : ''}</span>`).join('');
    const restCell = rem > 0 ? `<span class="glabel glabel--rest" style="width:${rem}%"></span>` : '';
    /* show=true يعرض اسم البند وساقه، وإلا خليّة محاذاة فارغة بعرض الشريحة */
    const cell = (x, i, show) => `<span class="glabel" style="width:${x.pct}%">${show
      ? `<i class="glabel__stem" style="background:${GCOLORS[i % GCOLORS.length]}"></i><span class="glabel__t">${esc(x.name) || '—'}</span>` : ''}</span>`;
    const top = items.map((x, i) => cell(x, i, i % 2 === 1)).join('') + restCell;   /* الثاني/الرابع… فوق البار */
    const bot = items.map((x, i) => cell(x, i, i % 2 === 0)).join('') + restCell;   /* الأول/الثالث… تحت البار */
    return `<div class="glabels glabels--top">${top}</div>
      <div class="gbar gbar--dist">${segs}${rem > 0 ? `<span class="gbar__rest" style="width:${rem}%">${T().remaining(rem)}</span>` : ''}</div>
      <div class="glabels glabels--bot">${bot}</div>`;
  }
  /* بار التوزيع داخل مستطيل «توزيع الدرجة» في كومنت التقييم:
     داخل البار الأرقام فقط بحجم كبير، والتوصيفات نصًّا فوقه تصل كلًّا بشريحته ساقٌ ملوّنة */
  /* دلالات شريط الدرجة: كلٌّ متوسّطة فوق شريحتها، فإن تداخلت المتجاورة في الصفّ نفسه (شريط ضيّق)
     فُرِّقت أفقيًّا وأُبقيت داخل حدّ الشريط. قياسٌ فعليّ بعد الرسم (عرض العربي متغيّر) */
  function fitGradeLabels(root) {
    (root || document).querySelectorAll('.glabels').forEach(row => {
      const box = row.getBoundingClientRect();
      if (!box.width) return;
      const GAP = 4;
      const items = [];
      row.querySelectorAll('.glabel__t').forEach(t => {
        t.style.transform = 'translateX(-50%)';
        const r = t.getBoundingClientRect();
        if (!r.width) return;
        const p = t.parentElement.getBoundingClientRect();
        items.push({ t, center: p.left + p.width / 2, w: r.width });
      });
      if (!items.length) return;
      items.sort((a, b) => a.center - b.center);
      /* تمريرة أمامية: كلٌّ يبدأ بعد نهاية سابقه بفجوة، وإلا أُزيح يمينًا */
      let prevRight = box.left;
      items.forEach((l, i) => {
        let left = l.center - l.w / 2;
        const floor = prevRight + (i ? GAP : 0);
        if (left < floor) left = floor;
        l.left = left;
        prevRight = left + l.w;
      });
      /* تمريرة خلفية عند تجاوز الحدّ الأيسر: ندفع من اليسار داخلًا */
      let limit = box.right;
      for (let i = items.length - 1; i >= 0; i--) {
        const l = items[i];
        const right = Math.min(l.left + l.w, limit);
        l.left = right - l.w;
        limit = l.left - GAP;
      }
      items.forEach(l => {
        const dx = (l.left + l.w / 2) - l.center;
        if (Math.abs(dx) > 0.5) l.t.style.transform = `translateX(calc(-50% + ${Math.round(dx)}px))`;
      });
    });
  }
  function gBarHTML(items) {
    const rem = Math.max(0, 100 - items.reduce((s, x) => s + (x.pct || 0), 0));
    const restCell = rem > 0 ? `<span class="glabel glabel--rest" style="width:${rem}%"></span>` : '';
    /* خلية تسمية: تظهر للبنود المتناوبة فقط (الأول تحت البار · الثاني فوقه · وهكذا) منعًا للتداخل،
       وإلا خليّة محاذاة فارغة بعرض الشريحة كي يبقى كل اسم فوق/تحت لونه تمامًا */
    const cell = (x, i, show) => {
      const nm = esc(x.name) || '—';
      return `<span class="glabel" style="width:${x.pct}%"${show ? ` title="${nm}: ${x.pct}%"` : ''}>${show
        ? `<i class="glabel__stem" style="background:${GCOLORS[i % GCOLORS.length]}"></i><span class="glabel__t">${nm}</span>`
        : ''}</span>`;
    };
    const top = items.map((x, i) => cell(x, i, i % 2 === 1)).join('') + restCell;   /* الثاني/الرابع… فوق */
    const bot = items.map((x, i) => cell(x, i, i % 2 === 0)).join('') + restCell;   /* الأول/الثالث… تحت */
    const segs = items.map((x, i) =>
      `<span class="gseg" title="${esc(x.name) || '—'}: ${x.pct}%" style="width:${x.pct}%;background:${GCOLORS[i % GCOLORS.length]}">${x.pct >= 4 ? x.pct + '%' : ''}</span>`).join('');
    return `<span class="glabels glabels--top gchip-labels">${top}</span>
      <span class="gbar gbar--chip">${segs}${rem > 0 ? `<span class="gbar__rest" style="width:${rem}%"></span>` : ''}</span>
      <span class="glabels glabels--bot gchip-labels">${bot}</span>`;
  }

