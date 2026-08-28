  /* ============ عرض مشاركة (استعراضي بلا أدوات إدخال) — d = بيانات المشاركة ============ */
  function viewHTML(sec, d) {
    const c = CM[cmCode];
    const none = `<p class="v-none">${T().noData}</p>`;
    const roBlocks = v => { let s = ''; for (let i = 1; i <= 10; i++) s += `<span class="rb ${i <= v ? 'on' : ''}"></span>`; return s; };
    switch (sec) {
      case 'info': return `
        ${d.type ? `<div class="cm-row"><span class="cm-k">${T().courseType}:</span><span class="v-badge v-badge--g" style="margin-inline-start:8px">${T().ctypes[d.type]}</span></div>` : ''}
        ${d.lang ? `<div class="cm-row" style="margin-top:12px"><span class="cm-k">${T().courseLang}:</span><span class="v-badge v-badge--g" style="margin-inline-start:8px">${T().langs[d.lang]}</span></div>` : ''}
        <div class="cm-row" style="margin-top:12px"><span class="cm-k">${T().relLabel}:</span><span class="v-badge v-badge--g" style="margin-inline-start:8px">${d.rel || 0}%</span></div>
        ${d.book ? `<div class="cm-row" style="margin-top:12px"><span class="cm-k">${T().bookName}</span><b class="pb-b">${esc(d.book)}</b></div>` : ''}
        <div class="cm-row" style="margin-top:12px"><span class="cm-k">${T().descLabel}</span></div>
        <p class="v-desc" style="margin-top:2px">${esc(d.desc || '') || '—'}</p>`;
      case 'doc': {
        const docs = d.docs || [];
        return docs.length ? docs.map(x => `
          <div class="vdoc">
            <div class="vdoc__head">
              ${x.img ? `<span class="vdoc-av"><img src="${x.img}" alt=""></span>` : ''}
              <b class="vdoc__n">${esc(x.n) || '—'}</b>
              ${x.e ? `<a class="src-open" href="mailto:${esc(x.e)}">${esc(x.e)}</a>` : ''}
            </div>
            ${docHours(x).length
              ? `<p class="v-line">${T().officeHours}: <b>${docHours(x).map(h => `${T().days[h.day]} ${fmtTime(h.from) || '؟'}–${fmtTime(h.to) || '؟'}`).join(' · ')}</b></p>` : ''}
            ${x.d ? `<p class="v-desc">${esc(x.d)}</p>` : ''}
            <div class="rate rate--ro"><span class="rate__k">${T().teach}</span><div class="rate__blocks">${roBlocks(x.teach)}</div><b class="rate__v">${x.teach || 0}/10</b></div>
            <div class="rate rate--ro"><span class="rate__k">${T().grade}</span><div class="rate__blocks">${roBlocks(x.grade)}</div><b class="rate__v">${x.grade || 0}/10</b></div>
          </div>`).join('') : none;
      }
      case 'grade': {
        const items = d.items || [];
        if (!items.length) return none;
        return gDistHTML(items) + `<div class="cm-row" style="margin-top:12px"><span class="cm-k">${T().methodLabel}:</span><span class="v-badge v-badge--g" style="margin-inline-start:8px">${d.method === 'avg' ? 'Average' : 'Standard'}</span></div>`;
      }
      case 'abs': {
        const A = d;
        if (!(A.free || A.dedFrom || A.dedAmt || A.dn || A.late)) return none;
        return `${absStripHTML(A)}${absLegHTML(A)}
          ${A.late ? `<p class="v-line">${T().subLate}: <b>${T().lateNote(A.late)}</b></p>` : ''}`;
      }
      case 'study': {
        const srcRO = list => list.map(s => `
          <div class="vsrc">
            <span class="src-kind src-kind--${s.kind}">${s.kind === 'p' ? T().primary : T().secondary}</span>
            ${s.t === 'text' ? `<p class="v-desc">${esc(s.v) || '—'}</p>`
              : s.t === 'link' ? (s.v ? `<a class="src-open" href="${esc(s.v)}" target="_blank" rel="noopener">${esc(s.v)} ↗</a>` : '—')
              : (s.v ? `<a class="src-open" href="${s.v}" download="${esc(s.name)}">${esc(s.name)} ⤓</a>` : '—')}
          </div>`).join('');
        return `
          <p class="v-sub">${T().studySrc}</p>${(d.study || []).length ? srcRO(d.study) : none}
          <p class="v-sub">${T().practiceSrc}</p>${(d.practice || []).length ? srcRO(d.practice) : none}`;
      }
    }
  }

  /* معاينة مصغرة للمشاركة داخل بطاقتها */
  function previewHTML(sec, d) {
    const c = CM[cmCode];
    const cname = state.lang === 'ar' ? arShort(c) : c.code;
    switch (sec) {
      case 'info': return `
        ${imgOf(cmCode) ? `<img class="pv-img" src="${imgOf(cmCode)}" alt="">` : ''}
        <div class="pv-tx"><b>${cname}</b><span class="pv-clamp">${esc(d.desc || '') || '—'}</span>
        ${d.type || d.rel ? `<span>${d.type ? T().ctypes[d.type] : ''}${d.type && d.rel ? ' · ' : ''}${d.rel ? `${T().relLabel}: ${d.rel}%` : ''}</span>` : ''}</div>`;
      case 'doc': {
        const docs = d.docs || [];
        const first = docs[0];
        return `<div class="pv-tx"><b>${first ? (esc(first.n) || '—') : '—'}${docs.length > 1 ? ` +${docs.length - 1}` : ''}</b>
          <span>${T().teach}: ${first ? first.teach || 0 : 0}/10 · ${T().grade}: ${first ? first.grade || 0 : 0}/10</span></div>`;
      }
      case 'grade': {
        const items = d.items || [];
        const segs = items.map((x, i) => `<span style="width:${x.pct}%;background:${GCOLORS[i % GCOLORS.length]}"></span>`).join('');
        return `<div class="pv-tx"><b>${d.method === 'avg' ? 'Average' : 'Standard'} · ${items.length}</b><span class="pv-bar">${segs}</span></div>`;
      }
      case 'abs': return `<div class="pv-tx"><b>${T().legDN}: ${d.dn || '—'}</b><span>${T().legFree}: ${d.free || 0} · ${T().legDed}: ${d.dedAmt ? '−' + d.dedAmt : '—'}</span></div>`;
      case 'study': return `<div class="pv-tx"><b>${(d.study || []).length} ${T().studySrc}</b><span>${(d.practice || []).length} ${T().practiceSrc}</span></div>`;
    }
  }

  /* أزرار تعديل/حذف مشاركتي (تظهر على مشاركاتي فقط) */
  const myActs = (p, dr, sub) => p.me
    ? `<span class="post-acts">
         <button type="button" class="post-edit" ${dr != null ? `data-dr="${dr}"` : ''}${sub ? ` data-sub="${sub}"` : ''} title="${T().editPost}">✎</button>
         <button type="button" class="post-del" ${dr != null ? `data-dr="${dr}"` : ''}${sub ? ` data-sub="${sub}"` : ''} title="${T().delPost}">✕</button>
       </span>` : '';

  /* المحتوى الكامل داخل الكومنت نفسه — كل معلومة تسبقها تسميتها المنقوطة */
  function postBody(sec, d, code) {
    code = code || cmCode;   /* المعالج والداشبورد يمرران الكود صراحة (لا نافذة مفتوحة هناك) */
    const none = `<p class="v-none">${T().noData}</p>`;
    const kv = (k, v) => `<p class="pb-row"><span class="cm-k">${k}</span><span class="pb-v">${v}</span></p>`;
    const badge = v => `<span class="v-badge v-badge--g">${v}</span>`;
    switch (sec) {
      case 'info': {
        /* الترتيب: الكتاب (صورة 3D صغيرة + اسمه) ← النوعية ← اللغة ← الترابط ← الوصف */
        const parts = [];
        if (d.bookImg || d.book) {
          parts.push(`<div class="pb-row"><span class="cm-k">${T().bookLabel}</span>
            <span class="pb-book"><span class="pb-book__bk">${bookMini(code, assetURL(d.bookImg))}</span><b class="pb-book__n">${esc(d.book) || '—'}</b></span></div>`);
        }
        if (d.type) parts.push(kv(T().courseType + ':', badge(T().ctypes[d.type])));
        if (d.lang) parts.push(kv(T().courseLang + ':', badge(T().langs[d.lang])));
        parts.push(kv(T().relLabel + ':', badge((d.rel || 0) + '%')));
        {
          const rows = topicRowsHTML(d);
          if (rows) parts.push(`<div class="pb-row"><span class="cm-k">${T().topicsSec}:</span><div class="pb-v tp-list">${rows}</div></div>`);
        }
        if (d.desc) parts.push(kv(T().descLabel, esc(d.desc)));
        return parts.join('');
      }
      case 'doc': {
        /* الترتيب: الإيميل ← الساعات المكتبية ← الشرح ← كرم الدرجات ← وصف الدكتور (أخيرًا)
           كلها شارات صفراء عدا الوصف (نصّ) · الإيميل شارة-رابط */
        const parts = [];
        if (d.e) parts.push(kv(T().docEmail + ':', `<a class="v-badge v-badge--g" style="text-decoration:none" href="mailto:${esc(d.e)}">${esc(d.e)}</a>`));
        if (docHours(d).length) parts.push(kv(T().officeHours + ':',
          `<span class="pb-badges">${docHours(d).map(h => badge(`${T().days[h.day]} ${fmtTime(h.from) || '؟'}–${fmtTime(h.to) || '؟'}`)).join('')}</span>`));
        if (d.bld || d.room) parts.push(kv(T().officeLabel + ':', badge(`${esc(d.bld) || '؟'} · ${esc(d.room) || '؟'}`)));
        if (d.teach) parts.push(kv(T().teach + ':', badge(d.teach + '/10')));
        if (d.grade) parts.push(kv(T().grade + ':', badge(d.grade + '/10')));
        /* سياسة الغياب والتأخير خرجت من هنا: بند مستقلّ له تبويبه ومساهماته (قناة abs) */
        if (d.d) parts.push(kv(T().docDesc + ':', esc(d.d)));
        return parts.join('');
      }
      case 'grade': {
        const items = d.items || [];
        if (!items.length) return none;
        /* توزيع الدرجة أولًا، ثم طريقة التقييم أسفله */
        return `<p class="pb-row"><span class="cm-k">${T().distTitle}:</span></p>` + gDistHTML(items) +
          kv(T().methodLabel + ':', `<span class="v-badge v-badge--g">${d.method === 'avg' ? 'Average' : 'Standard'}</span>`);
      }
      case 'abs': {
        /* سطر «الغياب:» ودلالاته الأصغر يسارًا، ثم دوائر الشريط تحته · «التأخير:» شارة صفراء */
        const A = d;
        if (!(A.free || A.dedFrom || A.dedAmt || A.dn || A.late)) return none;
        const parts = [];
        const strip = absStripHTML(A);
        if (strip) parts.push(`<div class="abs-block">
          <div class="abs-head"><span class="cm-k">${T().subAbsence}:</span>${absLegHTML(A)}</div>
          ${strip}
        </div>`);
        if (A.late) parts.push(kv(T().subLate + ':', badge(T().lateNote(A.late))));
        return parts.join('') || none;
      }
      case 'srcU': case 'srcP':
        /* العرض الكامل: نصّ المساهمة منسَّقًا، وشرائح الملفات روابط تنزيل داخل مجراه */
        return srcViewHTML(d) || none;
      case 'lessons': {
        const items = d.items || [];
        if (!items.length) return none;
        return items.map((x, i) => `
          <div class="lrow lrow--ro">
            <span class="lorder">${i + 1}</span>
            <span class="ltopic">${topicText(x)}</span>
          </div>`).join('');
      }
      case 'videos': {
        /* رزمة شروح حرة: أوراق الشجرة عناوين فقط (عرض مختصر — يُستخدم خارج التبويب إن لزم) */
        const leaves = [];
        const walk = ns => (ns || []).forEach(n => n.t === 'f' ? walk(n.ch) : leaves.push(n));
        walk(Array.isArray(d.deck) ? d.deck : []);
        const vids = leaves.filter(v => v && v.v);
        if (!vids.length) return none;
        return vids.map(v => `
          <div class="pk-vrow pk-vrow--ro">
            <span class="pk-play">▶</span>${esc(v.name) || '—'}
            ${v.dur ? `<span class="pk-dur">${esc(v.dur)}</span>` : ''}
          </div>`).join('');
      }
    }
  }

  /* (كومنت البذرة حُذف — الإضافة الآن عبر دائرة «أنا/+» في زر البند نفسه أو القلم) */

  /* هل بيانات مشاركتي فارغة تمامًا؟ (تُحذف عند الخروج من المحرر بلا كتابة) */
  function isEmptyData(sec, d) {
    switch (sec) {
      case 'info':  return !d.desc && !d.type && !(d.rel > 0) && !d.lang && !d.book;
      case 'grade': return !(d.items && d.items.length);
      case 'abs':   return !(d.free || d.dedFrom || d.dedAmt || d.dn || d.late);
      case 'srcU':  case 'srcP': {
        const doc = srcDocOf(d);
        return !stripRich(doc.html) && !Object.keys(doc.files).length;
      }
      case 'lessons': return !(d.items && d.items.some(x => x.num || x.name));
      case 'videos': {   /* يقبل الأشكال الثلاثة: شجرة deck (الحالي) · مصفوفة · خريطة مواضيع */
        const leaves = [];
        const walk = ns => (ns || []).forEach(n => n.t === 'f' ? walk(n.ch) : leaves.push(n));
        if (Array.isArray(d.deck)) walk(d.deck);
        else if (Array.isArray(d.vids)) leaves.push(...d.vids);
        else Object.values(d.vids || {}).forEach(a => leaves.push(...(a || [])));
        return !leaves.some(v => v && v.v);
      }
      case 'cards': {   /* كالشروح: صفٌّ مضافٌ بلا كتابة لا يجعل الرزمة مساهمةً */
        const ns = Array.isArray(d.deck) ? d.deck : Object.values(d.decks || {}).flat();
        const leaves = [];
        const walk = a => (a || []).forEach(n => n.t === 'f' ? walk(n.ch) : leaves.push(n));
        walk(ns);
        return !leaves.some(n => String(n.f || '').trim() || String(n.b || '').trim());
      }
    }
    return false;
  }
  const isEmptyDocData = d =>
    !d.e && !(d.hours && d.hours.length) && !d.d && !d.teach && !d.grade && !d.bld && !d.room;

  function cleanupEmptyMine() {
    /* نافذة البطاقة مفتوحة: بطائقها تولد فارغةً عمدًا، فلا تُحذف مشاركتي من تحتها —
       هي نفسها تنظّف ما بقي فارغًا عند إغلاقها ثم تستدعي هذا التنظيف */
    if (cardDlg) return;
    if (cmView.mode !== 'edit' || !cmCode) return;
    const sec = cmTabSel;   /* قسم المحرر المفتوح */
    if (sec === 'doc' && cmView.sub !== 'abs') {
      const dr = doctorsOf(cmCode)[cmView.di];
      if (!dr) return;
      const mi = dr.posts.findIndex(x => x.me);
      if (mi >= 0 && isEmptyDocData(dr.posts[mi].data)) { dr.posts.splice(mi, 1); save(); }
    } else {
      const ch = cmView.sub || sec;   /* قناة المحرر: قد تكون فرعية (غياب/فهم/ممارسة) */
      const arr = postsOf(cmCode, ch);
      const mi = arr.findIndex(x => x.me);
      /* بالميزان نفسه الذي يُدرِجها ويُظهر أزرارها: ما فيه حقلٌ مملوء لا يُحذف.
         وكان هنا ‎isEmptyData‎ الأضيق، فتُحذف رزمةٌ عنوانُ غلافها مكتوبٌ بلا بطائق — وهي مساهمةٌ بدأت */
      if (mi >= 0 && !editHasInput(ch, arr[mi].data)) { arr.splice(mi, 1); save(); }
    }
  }

  /* نمو الحقل النصّي تلقائيًا مع الكتابة (اسم الكتاب/الوصف) — أرى كل ما أكتبه دون فقدان نصّ */
  const autoGrow = el => { if (!el) return; el.style.height = 'auto'; el.style.height = (el.scrollHeight + 2) + 'px'; };

  /* غلاف الكتاب داخل المستطيل: كتاب 3D مائل صغير جدًا (بارتفاع ثابت لا يكبّر المستطيل) · وإلا أيقونة كتاب */
  const chipBook = raw => assetURL(raw)
    ? `<span class="pchip-bk"><span class="bk"><span class="bkface bkface--img"><img src="${assetURL(raw)}" alt=""></span></span></span>`
    : `<svg class="peek-bookic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H18a1 1 0 0 1 1 1v14H5.5A1.5 1.5 0 0 1 4 17.5z"/><path d="M8 4v14"/></svg>`;

  /* قيمة التقييم «10/الدرجة» بترتيب LTR ثابت — الدرجة يمين و«/10» يسار (يُستخدم في التحرير والنشر) */
  const rateVal = v => `<span class="rate-v"><span class="rv-tot">10</span><span class="rv-slash">/</span><span class="rv-num">${v || 0}</span></span>`;

  /* ملخّص الكومنت المطوي: «الدكتور» = شارتا التقييم ثم الوصف ·
     «المادة» = مستطيلات صفراء [صورة الكتاب+اسمه] [نوعية المادة+النوعية] [نسبة الترابط+النسبة] ثم الوصف */
  /* flat = عرض خارج واجهة المساهمات (القُمرة/المنتقي): بلا أسهم تنقّل الفترات وبلا سهم توسيع،
     لأن معالجاتها تعيش في ‎.cm-panel‎ فتكون ميتة هناك — والنصّ كاملًا يقصّه CSS */
  /* dragSrc: معرّف المساهمة حين تكون الشارات مصادر سحب في منتقي الركن */
  /* مثلّثا الزيادة والنقصان — مرسومُ منتقي «الترابط» نفسُه، فالفعلُ واحدٌ فليكن
     الشكلُ واحدًا: من عرف السهمين هناك عرفهما ههنا بلا تعلّمٍ ثانٍ */
  const STEP_IC = {
    up: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M12 7 18 17 6 17Z"/></svg>',
    dn: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M6 7 18 7 12 17Z"/></svg>',
  };
  /* ‏‎me‎: سجلُّك أنت في «الغياب والتأخير» — يُمرَّر من الرَّكن وحدَه، فلا يُرى العدّادُ
     في مساهمةٍ بالمكتبة: تلك خبرُ صاحبها عن المادّة، وهذا خبرُك عن نفسك */
  function postPeek(sec, d, pid, dr, open, flat, dragSrc, me) {
    if (sec === 'doc') {
      const dg = k => dragSrc ? ` data-drag="field" data-slot="${k}" data-src="${dragSrc}"` : '';
      /* مضغوط كامل من البداية: كل حقول الدكتور شاراتٍ صغيرة (إيميل/ساعات/مكتب/شرح/تصحيح)
         ثم الانطباع آخرًا (يُقصّ ويُفكّ عند التوسيع مثل «المادة») */
      /* تخطيط الصفوف (flexbox في CSS): كل شارة بعرض محتواها، والشارات في صفّ ممتلئ تنمو بالتساوي
         لتملأ عرضه (justify). لا تُرسم إلا الشارات المعبّأة فعلًا. «الحشوة» تمتصّ فراغ الصفّ الأخير
         فتبقى شاراته بعرض محتواها، والانطباع صفٌّ كامل العرض تحت الشارات */
      const items = [], dash = '—';
      const add = (html) => items.push(html);   /* العرض يتبع المحتوى (flexbox)، لا أعراض ثابتة */
      /* الساعات: مستطيل واحد يعرض فترة واحدة + عدّاد وسهمين (إن تعدّدت الفترات) */
      const hoursArr = docHours(d);
      let hval = dash, nav = '';
      if (hoursArr.length) {
        const total = hoursArr.length;
        let hi = hourIdx[pid] || 0; if (hi >= total) hi = 0;
        const h = hoursArr[hi];
        hval = `${T().days[h.day]} ${fmtTime(h.from) || '؟'}–${fmtTime(h.to) || '؟'}`;
        if (total > 1 && !flat) nav = `<span class="hnav"><span class="hnav-arrows"><button type="button" class="hnav-btn" data-hnav="${pid}" data-hdir="1" data-htotal="${total}" aria-label="+">▲</button>` +
          `<button type="button" class="hnav-btn" data-hnav="${pid}" data-hdir="-1" data-htotal="${total}" aria-label="−">▼</button></span>` +
          /* العدّاد بعناصر منفصلة لا نصًّا واحدًا: مع العربية يأتي الجزء يمينًا ثم «/» ثم الكل يسارًا،
             ويُقلب كاملًا مع الإنجليزية عبر html[data-lang]. لا يُعكَس النصّ بالـbidi لأن ذلك يقلب أرقام «12/10» نفسها */
          `<span class="hnav-num"><b class="hn-i">${hi + 1}</b><i class="hn-s">/</i><b class="hn-t">${total}</b></span></span>`;
      }
      /* الدكتور أولًا (قبل الإيميل) — نصف العرض، صورته الدائرية الصغيرة يمين اسمه داخل المستطيل */
      if (dr) add(`<span class="v-badge v-badge--g dr-badge"><span class="dr-badge__av">${drAvatar(dr)}</span><b class="v-val dr-badge__nm">${esc(dr.name) || dash}</b></span>`, 3);
      /* الإيميل ثم الساعات — ولا يظهران إلا إذا عبّأهما المساهم */
      /* الإيميل مستطيل عادي لا رابط mailto: نقره يفتح المنبثقة بمحتواه كاملًا مثل بقيّة المستطيلات
         (الرابط كان يستدعي تطبيق البريد في الجهاز) */
      if (d.e) add(`<span class="v-badge v-badge--g peek-mail"${dg('e')}><i class="v-lab">${T().emailLab}</i><b class="v-val v-val--ltr">${esc(d.e)}</b></span>`, 5);
      if (hoursArr.length) add(`<span class="v-badge v-badge--g hbadge"${dg('hours')}><i class="v-lab">${T().hoursLab}</i>${nav}<b class="v-val">${hval}</b></span>`, 7);
      /* المكتب: المبنى والغرفة معًا إن وُجدا، وإلا الموجود منهما وحده (لا «؟» مكان الناقص) */
      if (d.bld || d.room) {
        const off = [d.bld, d.room].filter(Boolean).map(esc).join(' · ');
        add(`<span class="v-badge v-badge--g"${dg('office')}><i class="v-lab">${T().officeLab}</i><b class="v-val">${off}</b></span>`, 3);
      }
      /* الشرح/الكرم: الصيغة الكاملة «الدرجة/١٠» — والصفر يعني «لم يُقيَّم» فلا يُرسم */
      if (d.teach) add(`<span class="v-badge v-badge--g"${dg('teach')}><i class="v-lab">${T().teach}</i><b class="v-val">${rateVal(d.teach)}</b></span>`, 3);
      if (d.grade) add(`<span class="v-badge v-badge--g"${dg('grade')}><i class="v-lab">${T().gradeS}</i><b class="v-val">${rateVal(d.grade)}</b></span>`, 3);
      /* الغياب والتأخير لم يعودا هنا: بند مستقلّ بتبويبه (قناة abs) */
      /* انطباع الكاتب: سطره الأول يتدفّق بجانب «التأخير/الغياب» (بقيّة الصفّ الثاني)،
         وما زاد ينزل سطرًا كامل العرض يبدأ من أقصى اليمين (الصفّ الثالث) — لا يكمل في عمود ضيّق.
         التنفيذ في CSS: ‎.peek-descflow::first-line‎ بارتفاع صفّ الشارات فينتهي التفافه بعد سطر واحد */
      const fullDesc = d.d || '';
      const LIMIT = 160;
      const isLong = fullDesc.length > LIMIT;
      let shownDesc = fullDesc;   /* القصّ نصيًّا (لا CSS) كي يتدفّق حول العائمات؛ السهم يفكّه */
      if (isLong && !open && !flat) {
        let c = fullDesc.slice(0, LIMIT); const sp = c.lastIndexOf(' ');
        if (sp > LIMIT * 0.6) c = c.slice(0, sp);
        shownDesc = c.trim() + '… ';
      }
      /* سهم التوسيع إنلاين آخر النص (مثل «المادة») — لا يُرسم إلا حين يكون الانطباع مقصوصًا فعلًا */
      const inlineTog = (flat || !isLong) ? '' : inlineTogHTML(open);
      const descHTML = `<span class="peek-tx peek-descflow"${fullDesc ? dg('d') : ''}>${fullDesc ? esc(shownDesc) : ''}${inlineTog}</span>`;
      if (!items.length && !fullDesc) return `<span class="peek-tx peek-none">${T().noData}</span>`;
      /* الشارات = عناصر flex بعرض محتواها؛ تنمو بالتساوي لملء صفّها (justify).
         «الحشوة» تمتصّ فراغ الصفّ الأخير فلا يتمدّد، والانطباع صفّ كامل العرض تحته */
      return `<div class="peek-badges peek-flow">${items.join('')}${descHTML}</div>`;
    }
    /* «الغياب والتأخير»: بنوده شاراتٍ مضغوطة (لا يُرسم منها إلا المعبّأ)، ثم شريط الغياب المرقّم
       بدلالاته — بنفس نظام شارات الدكتور (flex) فيتّسق التبويبان بصريًّا */
    if (sec === 'abs') {
      const A = d || {};
      const items = [];
      const dgA = k => dragSrc ? ` data-drag="field" data-slot="${k}" data-src="${dragSrc}"` : '';
      /* العرض: الشكل التمثيلي (الشريط) فقط، ويساره مستطيل التأخير — بلا شارات القيم (مجاني/بداية الخصم/مقداره/DN) */
      const strip = absStripHTML(A, me), leg = absLegHTML(A);
      /* ===== سجلُّك: سهمان ورقمٌ إلى يسار العنوان =====
         ما في المربّع خبرُ **غيرِك** عن المادّة: كم غيابًا يُسمح وكم يُخصم ومتى ‎DN‎.
         وهذا خبرُك أنت: كم غِبتَ وكم تأخّرت. فمخزنٌ ثانٍ إلى جانبه (‎bag.absMe‎) كما
         لسجلّ الدرجة (‎bag.gradeMe‎) — ولو كُتب في ‎absV‎ لَمُحي في اللحظة التي تبدّل
         فيها مصدرَ التوزيع، لأنّ ‎absV‎ يُكتب كلُّه من جديدٍ عند كلّ اختيار.
         والعنوانُ وعدّادُه في صفٍّ واحد (‎.abs-hd‎): المربّعان عمودان، فبدون الصفّ
         ينزل السهمان سطرًا تحت العنوان ولا يكونان «يساره» */
      /* والمثلّثان ورقمُهما في ‎.gscw‎ — مستطيلُ خانة الدرجة نفسُه لا نظيرٌ له:
         الفعلُ واحدٌ (رقمٌ تزيده وتنقصه) فليكن المستطيلُ واحدًا، وإن عُدّل عُدّلا معًا */
      const hd = (k, lab) => `<span class="abs-hd"><i class="v-lab">${lab}</i>` + (me
        ? `<span class="gscw"><span class="chipe__steps">`
          + `<button type="button" class="abs-stp" data-am="${k}" data-d="1" aria-label="+">${STEP_IC.up}</button>`
          + `<button type="button" class="abs-stp" data-am="${k}" data-d="-1" aria-label="\u2212">${STEP_IC.dn}</button></span>`
          + `<b class="abs-me" data-amv="${k}">${+me[k] || 0}</b></span>`
        : '') + `</span>`;
      if (strip) items.push(`<span class="chipe chipe--absview"${dgA('abs')}>${hd('abs', T().absLab)}${strip}${leg ? `<span class="abs-legbox">${leg}</span>` : ''}</span>`);
      if (A.late) items.push(`<span class="v-badge v-badge--g late-badge"${dgA('late')}>${hd('late', T().lateLab)}<b class="v-val">${T().lateNote(A.late)}</b></span>`);
      return items.length
        ? `<div class="peek-badges peek-flow">${items.join('')}</div>`
        : `<span class="peek-tx peek-none">${T().noData}</span>`;
    }
    if (sec === 'info') {
      const tx = d.desc ? `<span class="peek-tx">${esc(d.desc)}</span>` : `<span class="peek-tx peek-none">${T().noData}</span>`;
      return infoChips(d) + tx;
    }
    /* «المصادر» (فهم/ممارسة): المساهمة تُعرض كما كُتبت تمامًا — الكتابة الحرّة نصٌّ متدفّق،
       وكل ملف مستطيلٌ في موضعه من السطر (أوّلَ سطرٍ كان أو آخره). لا تلخيص ولا إعادة ترتيب،
       والطيّ/التوسيع بنفس طريقة «الدكاترة»: قصٌّ عند حدّ حروف ثم سهم إنلاين بعد آخر كلمة */
    if (sec === 'srcU' || sec === 'srcP') {
      return srcPeekHTML(d, open, flat) || `<span class="peek-tx peek-none">${T().noData}</span>`;
    }
    return d.desc ? `<span class="peek-tx">${esc(d.desc)}</span>` : `<span class="peek-tx peek-none">${T().noData}</span>`;
  }

  /* مستطيلات «المادة» الصفراء: [غلاف الكتاب+اسمه] [نوعية المادة] [نسبة الترابط] — تُستخدم في الملخّص والـPopup */
  /* pid: حين يُمرَّر، تصير المستطيلات قابلة للسحب إلى مربّع القُمرة (كلٌّ يحمل بنده ومصدره) */
  function infoChips(d, pid) {
    const chips = [];
    const dg = k => pid ? ` data-drag="field" data-slot="${k}" data-src="${pid}"` : '';
    /* الكتاب: الغلاف وحده كافٍ — لا يُرسم «—» مكان اسم غير مكتوب */
    if (d.bookImg || d.book) chips.push(`<span class="peek-chip peek-book"${dg('book')}>${chipBook(d.bookImg)}${d.book ? `<b>${esc(d.book)}</b>` : ''}</span>`);
    if (d.lang) chips.push(`<span class="peek-chip"${dg('lang')}><i>${T().courseLang}</i><b>${T().langs[d.lang]}</b></span>`);
    if (d.type) chips.push(`<span class="peek-chip"${dg('type')}><i>${T().courseType}</i><b>${T().ctypes[d.type]}</b></span>`);
    if (d.rel) chips.push(`<span class="peek-chip"${dg('rel')}><i>${T().relLabel}</i><b>${d.rel}%</b></span>`);   /* صفر = لم يُقدَّر بعد فلا يُرسم */
    /* المواضيع: العدد فقط — والضغط يفتح المنبثقة بكل المواضيع */
    const tps = (d.topics || []).filter(x => x && (x.num || x.name));
    if (tps.length) chips.push(`<span class="peek-chip peek-topics"${dg('topics')}><i>${T().topicsSec}</i><b><span class="tp-order">${tps.length}</span> ${T().topicsWord(tps.length)}</b></span>`);
    return chips.join('');
  }
  /* صفوف المواضيع: ① فـ3 اسم الموضوع — مع زر نسخ صغير أقصى اليسار في المنبثقة */
  function topicRowsHTML(d, withCopy) {
    return (d.topics || []).filter(x => x && (x.num || x.name)).map((x, i) => {
      const nm = x.name || '';
      const cp = (withCopy && nm)
        ? `<button type="button" class="cmt-copy cmt-copy--sm" data-copy="${esc(nm)}" data-t="${T().copyTopic}" title="${T().copyTopic}" aria-label="${T().copyTopic}">${COPY_IC}${OK_IC}</button>`
        : '';
      return `<div class="tp-row">
        <span class="tp-order">${i + 1}</span>
        <span class="tp-txt"><i class="tp-tag">${T().chTag}${esc(x.num || '')}</i>${esc(nm) || '—'}</span>
        ${cp}
      </div>`;
    }).join('');
  }

  /* قائمة النقاط الثلاث — واحدة لكل كومنتات الموقع (كومنتات المادة/الدكتور ورزم الشروح):
     مشاركتي = تعديل/حذف · مشاركة غيري = إبلاغ · وبنود الأدمن (تثبيت/حذف) داخل اللوحة فقط */
  function postMenuHTML(p, likeAttr, editDelAttr) {
    const pinItem = ADMIN
      ? `<button type="button" class="post-pin" ${likeAttr}>${p.pin ? T().unpinItem : T().pinItem}</button>`
      : '';
    const admDelItem = (ADMIN && !p.me)
      ? `<button type="button" class="post-admdel a-danger" ${likeAttr}>${T().delItem}</button>`
      : '';
    const menuItems = pinItem + admDelItem + (p.me
      ? `<button type="button" class="post-edit" ${editDelAttr}>${T().editItem}</button>
          <button type="button" class="post-del" ${editDelAttr}>${T().delItem}</button>`
      : `<button type="button" class="post-report" ${likeAttr}${p.reported ? ' disabled' : ''}>${p.reported ? T().reportedItem : T().reportItem}</button>`);
    return `<div class="post-menu">
        <button type="button" class="post-menubtn" title="${T().optionsBtn}" aria-label="${T().optionsBtn}"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg></button>
        <div class="post-menu__list">
          ${menuItems}
        </div>
      </div>`;
  }
  /* صفّ الإبهامين (مفيد/غير مفيد) — مشترك بين كومنتات المادة ورزم الشروح */
  const reactRowHTML = (p, likeAttr, ccGlyph) => `<div class="post-react">
      ${ccGlyph || ''}
      <button type="button" class="post-thumb post-thumb--up ${p.liked ? 'on' : ''}" ${likeAttr} data-react="up" title="${T().thumbUp}" aria-label="${T().thumbUp}">${THUP}<span class="tb-n">${p.likes || 0}</span></button>
      <button type="button" class="post-thumb post-thumb--down ${p.disliked ? 'on' : ''}" ${likeAttr} data-react="down" title="${T().thumbDown}" aria-label="${T().thumbDown}">${THDN}<span class="tb-n">${p.dislikes || 0}</span></button>
    </div>`;

  /* كومنت قابل للطي بنفس نمط رزم «الشروح/البطائق»: المحتوى فوق (ملخّص مطوي · أو الجسم كاملًا)
     وزر التوسيع/التضييق (نفس زر .pk-toggle) يسارًا فوق الخط، ثم خط، ثم الهوية واللايك تحته */
  function foldPost(sec, p, pi, ref) {
    const isDr = ref && ref.dr != null;
    const key = isDr ? `doc:${ref.dr}:${pi}` : `${sec}:${pi}`;
    const open = cmOpen.has(key);
    /* data-dkey: مفتاح تاريخ هذه المساهمة — يقرؤه سهم التوسيع ليبدّل التاريخ معه (ربط باتجاه واحد) */
    const dataAttr = (isDr ? `data-pi="${pi}" data-dr="${ref.dr}"` : `data-pi="${pi}" data-sub="${sec}"`)
      + ` data-dkey="${dtKey(p, key)}"`;
    const likeAttr = isDr ? `data-like="${pi}" data-dr="${ref.dr}"` : `data-like="${pi}" data-sub="${sec}"`;
    /* أزرار مشاركتي: قائمة ثلاث نقاط (تعديل/حذف) بدل زرَّي القلم والحذف */
    const editDelAttr = isDr ? `data-dr="${ref.dr}"` : `data-sub="${sec}"`;
    /* القائمة تظهر على كل الكومنتات: مشاركتي = تعديل/حذف · مشاركة غيري = إبلاغ
       (وبنود الأدمن تُضاف داخل اللوحة وحدها — postMenuHTML مشتركة مع رزم الشروح) */
    const menu = postMenuHTML(p, likeAttr, editDelAttr);
    /* الملخّص المضغوط الكامل هو العرض دائمًا (info + doc)؛ التوسيع يفكّ قصّ الوصف فقط لا يغيّر الشكل.
       «الدكتور» ملخّص غني (شارات كل الحقول) فيأخذ تخطيط fold-peek--rich */
    const isSrc = sec === 'srcU' || sec === 'srcP';
    const peekOnly = sec === 'info' || sec === 'doc' || sec === 'abs' || isSrc;
    const richPeek = sec === 'doc' || sec === 'abs' || isSrc;   /* المصادر والغياب ملخّص شارات مثل الدكتور */
    /* هوية الدكتور (صورته واسمه) أول الملخّص: تُخفى إذا كان الفلتر مقصورًا على دكتور —
       اسمه ظاهر أصلًا في مستطيل الفلتر فوق القائمة، فلا داعي لتكراره في كل كومنت */
    const peekDr = (isDr && cmDocSel == null) ? doctorsOf(cmCode)[ref.dr] : null;
    const head = `<div class="pk-head">
        <div class="fold-peek${richPeek ? ' fold-peek--rich' : ''}">${(open && !peekOnly) ? '' : postPeek(sec, p.data, p.id || key, peekDr, open)}</div>
        <button type="button" class="pk-toggle" title="${open ? T().pkCollapse : T().pkExpand}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>`;
    const body = (open && !peekOnly) ? `<div class="post__full">${postBody(sec, p.data)}</div>` : '';
    /* الهوية: الاسم ثم التاريخ ثم القلب والعدد بجانبه مباشرةً (بلا مستطيل) · وقائمة النقاط أقصى اليسار */
    const foot = `<div class="post__top">
        <span class="post-av post-av--sm">${avatarHTML(p)}</span>
        <div class="post-meta">
          ${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b>
          ${dateBtnHTML(p, key)}
          <button type="button" class="post-like post-like--bare ${p.liked ? 'on' : ''}" ${likeAttr}><span class="lk-h">♥</span><span class="lk-n">${p.likes || 0}</span></button>
        </div>
        ${menu}
      </div>`;
    /* «المادة» و«الدكتور» و«التقييم» بأسلوب يوتيوب: الصورة عمود جانبي يمين الكومنت كامل (أعلاه)،
       وعلى يسارها عمود = [اسم · تاريخ · قائمة النقاط] ثم المحتوى ثم إبهاما مفيد/غير مفيد */
    if (sec === 'info' || sec === 'doc' || sec === 'abs' || sec === 'grade' || isSrc) {
      const meta = `<div class="post-ytmeta">
          ${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b>
          ${dateBtnHTML(p, key)}${pinBadge(p)}
        </div>`;
      /* مؤشّر اكتمال المساهمة (المادة والدكتور): يمين الإبهام = أول عنصر في صفّ التفاعل RTL
         — «المصادر» بلا مؤشّر اكتمال (لا بنود تُقاس عليها بعد حذف أساسي/فرعي) */
      const ccGlyph = isSrc ? '' : completeGlyph(completenessOf(sec, p.data || {}));
      const react = reactRowHTML(p, likeAttr, ccGlyph);
      /* الوصف يُقصّ في JS (لا CSS) فيبقى سهم التوسيع ظاهرًا إنلاين بعد النص مباشرةً كأنه جزء منه */
      let content;
      if (sec === 'info') {
        const dd = p.data || {};
        const fullDesc = dd.desc || '';
        const LIMIT = 150;
        const isLong = fullDesc.length > LIMIT;
        let shownDesc = fullDesc;
        if (isLong && !open) {
          let cut = fullDesc.slice(0, LIMIT);
          const sp = cut.lastIndexOf(' ');
          if (sp > LIMIT * 0.6) cut = cut.slice(0, sp);
          shownDesc = cut.trim() + '… ';
        }
        /* «لا توجد معلومات» تظهر فقط إذا خلَت المساهمة من كل شيء — لا مع مساهمة فيها شارات (كغلاف كتاب) */
        const chipsHTML = infoChips(dd);
        const txHTML = fullDesc
          ? `<span class="peek-tx">${esc(shownDesc)}</span>`
          : (chipsHTML ? '' : `<span class="peek-tx peek-none">${T().noData}</span>`);
        /* السهم للنصّ وحده: لا يُرسم إلا حين يوجد نصٌّ مقصوص فعلًا (وإلا فلا شيء يوسّعه) */
        const inlineTog = isLong ? inlineTogHTML(open) : '';
        content = `<div class="pk-head"><div class="fold-peek">${chipsHTML}${txHTML}${inlineTog}</div></div>`;
      } else if (sec === 'doc') {
        /* «الدكتور»: الملخّص الغني (الشارات + الانطباع) بلا زر جانبي —
           سهم التوسيع يخرج من postPeek إنلاين آخر الانطباع تمامًا مثل «المادة» */
        content = `<div class="pk-head"><div class="fold-peek fold-peek--rich">${postPeek(sec, p.data, p.id || key, peekDr, open)}</div></div>`;
      } else if (sec === 'abs') {
        /* «الغياب والتأخير»: شارات البنود + شريط الغياب — بلا نصّ، فلا حاجة لسهم توسيع */
        content = `<div class="pk-head"><div class="fold-peek fold-peek--rich">${postPeek(sec, p.data, p.id || key, null, open)}</div></div>`;
      } else if (isSrc) {
        /* «المصادر»: المساهمة كما كُتبت — والسهم يخرج إنلاين من postPeek بعد آخر كلمة
           تمامًا مثل «الدكتور» (لا زرّ منفصل بعد المحتوى) */
        content = `<div class="pk-head"><div class="fold-peek fold-peek--rich">${postPeek(sec, p.data, p.id || key, null, open)}</div></div>`;
      } else {
        /* «التقييم»: مستطيلان بتروليان مثل المادة/الدكتور — [توزيع الدرجة + بار خطّي] و[طريقة التقييم] */
        const gd = p.data || {}, gItems = gd.items || [];
        const distChip = `<span class="v-badge v-badge--g grade-chip"><i class="v-lab">${T().distShort}</i>${gItems.length ? `<span class="grade-chip__bar">${gBarHTML(gItems)}</span>` : `<b class="v-val">—</b>`}</span>`;
        const methodChip = gd.method ? `<span class="v-badge v-badge--g"><i class="v-lab">${T().methodLabel}</i><b class="v-val">${gd.method === 'avg' ? 'Average' : 'Standard'}</b></span>` : '';
        /* بلا سهم: المستطيلان يعرضان كل ما في المساهمة، فلا نصّ وراءهما يُوسَّع */
        content = `<div class="pk-head"><div class="fold-peek pk-gradebody">${distChip}${methodChip}</div></div>`;
      }
      return `<div class="post pk pk--fold pk--info${open ? ' pk--open' : ''} pk--peek" ${dataAttr}>
        <div class="post-yt">
          <span class="post-av post-av--yt">${avatarHTML(p)}</span>
          <div class="post-ytmain">${meta}${content}${react}</div>
          ${menu}
        </div>
      </div>`;
    }
    return `<div class="post pk pk--fold${open ? ' pk--open' : ''}${peekOnly ? ' pk--peek' : ''}" ${dataAttr}>${head}${body}${foot}</div>`;
  }

  /* ============================================================
     وضع المساهمة: غير مدرجة (افتراض) · عامّة · خاصّة
     كل مساهمةٍ تبدأ **غير مدرجة**: مكتوبةٌ ومحفوظةٌ ويراها صاحبها، ولا تدخل قوائم الناس.
     والنشر قرارٌ صريح يُسأل عنه عند الإرسال — لا أثرٌ جانبيّ للكتابة.
     ============================================================ */
  const PST = () => ({
    unlist: { n: T().pstUnlist, d: T().pstUnlistD, ic: PST_IC.unlist },
    pub: { n: T().pstPub, d: T().pstPubD, ic: PST_IC.pub },
    priv: { n: T().pstPriv, d: T().pstPrivD, ic: PST_IC.priv },
  });
  const PST_IC = {
    unlist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.4 6"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7L12.6 18"/></svg>',
    pub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c4 4.5 4 12.5 0 17M12 3.5c-4 4.5-4 12.5 0 17"/></svg>',
    priv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
  };
  /* المساهمة المفتوحة في المحرّر الآن — وحالتها تُخزَّن فيها لا في الواجهة */
  /* المحرَّر دائمًا مشاركتي أنا (‎me‎) لا البند رقم ‎pi‎ — والفهرس يتبدّل بالترتيب فيكذب.
     ولا يُستدعى ‎myPost‎ هنا لأنه يُنشئ عند الغياب، والرسم لا يجوز أن يُنشئ شيئًا */
  const editingPost = () => {
    const arr = (cmTabSel === 'doc' && cmView.di != null)
      ? (doctorsOf(cmCode)[cmView.di] || {}).posts
      : postsOf(cmCode, cmView.sub || cmTabSel);
    return (arr || []).find(x => x.me) || null;
  };
  /* الافتراض «خاصّة»: ما لم يُقرّر صاحبها شيئًا فهي له وحده — لا مُدرَجةً ولا منشورة */
  const pstOf = p => (p && p.st) || 'priv';
  /* شارة الوضع بين الاسم والتاريخ — لصاحب المساهمة وحده، خبرًا يُقرأ لا زرًّا يُضغط.
     وهي تقرأ من المساهمة نفسها، فهي عين ما تعرضه شارةُ المحرّر لا نسخةً منفصلة عنها */
  function pstPostBadge(p) {
    if (!p || !p.me) return '';
    /* في التحرير للشارة موضعٌ واحد: زرُّها في تذييل المحرّر — فلا تُكرَّر عند الاسم */
    if (cmView && cmView.mode === 'edit' && p === editingPost()) return '';
    const k = pstOf(p), o = PST()[k];
    return `<span class="pst-badge pst-badge--post is-${k}"
        title="${esc(o.n)} — ${esc(o.d)}" aria-label="${esc(o.n)}">${o.ic}</span>`;
  }
  /* شارة الوضع يمين زرّ الإرسال: تُقرأ دائمًا، وتُضغط ليُبدَّل الوضع من القائمة نفسها */
  /* المساهمة المفتوحة خاويةٌ؟ فلا وضعَ يُعلن ولا شيءَ يُنشر — الأيقونتان تُخفيان معًا */
  /* «هل كُتب شيء؟» أوسع من «هل تستحقّ الحفظ؟»:
     ‎isEmptyData‎ تحكم على بقاء المساهمة، فلا تعدّ اسمَ مجلّدٍ وحده مساهمةً — وهذا صحيح.
     أمّا إظهار الوضع والنشر فيكفيه أن يُملأ **أيّ حقل بأيّ شيء**، فله ميزانه هذا */
  function editHasInput(sec, d) {
    if (!d) return false;
    if (sec === 'cards' || sec === 'videos') {
      /* الغلاف جزءٌ من الرزمة كبنودها: صورتُه أو عنوانُه وحدهما يكفيان */
      if (String(d.title || '').trim() || String(d.img || '').trim()) return true;
      const ns = Array.isArray(d.deck) ? d.deck
        : Object.values(d.decks || d.vids || {}).flat();
      let found = false;
      const val = x => String(x || '').trim();
      const walk = a => (a || []).forEach(n => {
        if (found || !n) return;
        if (n.t === 'f') { if (val(n.name)) found = true; else walk(n.ch); return; }
        if (val(n.f) || val(n.b) || val(n.name) || val(n.v)) found = true;
      });
      walk(ns);
      return found;
    }
    return !isEmptyData(sec, d);
  }
  const editEmpty = () => {
    const p = editingPost();
    return !p || !editHasInput(cmView.sub || cmTabSel, p.data);
  };
  const shareOff = () => editEmpty() ? ' is-off' : '';
  function pstBadge() {
    const s = pstOf(editingPost()), o = PST()[s];
    return `<button type="button" class="pst-badge is-${s}${shareOff()}" id="cm-pst"
        title="${esc(o.n)} — ${esc(o.d)}" aria-label="${esc(o.n)}">${o.ic}</button>`;
  }
  /* سؤال النشر: يُفتح عند الإرسال (‎send=true‎) فيُخرج من التحرير بعد الجواب،
     أو من الشارة وحدها فيبدّل الوضع ويبقى المحرّر مفتوحًا */
  let pstAsk = null;
  function openPstAsk(send) {
    pstAsk = { send: !!send };
    const cur = pstOf(editingPost()), P = PST();
    /* الخيارات الثلاثة صفٌّ واحد في مستوًى واحد: لا سطورًا نصّيّةً متراكمة.
       والوصف في التلميح لا تحت كل اسم، وإلّا صار الصفُّ فقراتٍ تُقرأ لا أزرارًا تُضغط.
       ولا سطرَ «أبقِها غير مدرجة» أسفل: هو خيارٌ من الثلاثة أصلًا، وتكرارُه بلبلة */
    $('#pst-modal .pst-opts').innerHTML = Object.keys(P).map(k => {
      const o = P[k];
      return `<button type="button" class="pst-opt is-${k}${k === cur ? ' on' : ''}" data-pst="${k}"
          title="${esc(o.d)}"><span class="pst-opt__ic">${o.ic}</span><b>${esc(o.n)}</b></button>`;
    }).join('');
    const q = $('#pst-modal .pst-q');
    q.textContent = send ? T().pstAskSend : T().pstAskOnly;
    q.classList.toggle('pst-q--sm', !send);          /* التبديل وحده: عنوانٌ خافتٌ لا سؤال */
    $('#pst-modal .pst-hint').textContent = P[cur].d;
    $('#pst-modal').hidden = false;
  }
  function closePstAsk(chosen) {
    const wasSend = pstAsk && pstAsk.send;
    pstAsk = null;
    $('#pst-modal').hidden = true;
    const p = editingPost();
    if (chosen && p) {
      p.st = chosen;
      /* ===== ومن نشرها يُكتب عليها عند النشر لا عند النجاح =====
         كان الختمُ يقع في ‎srvPush‎ بعد أن يقبلها الخادم. وبين النشر والقبول
         فجوةٌ: لو رُدّت (كِبَرًا أو انقطاعَ شبكة) بقيت بلا ختم — ثمّ يفتح صاحبُها
         الموقعَ الأساسيَّ بحسابه (والدرجُ واحدٌ للأصل كلِّه) فيرفعها الموقعُ
         باسمِه هو. وهكذا صارت أغلفةُ الموقع مساهماتٍ لطالبٍ لم يرفعها. */
      if (state.uid && !p.uid) p.uid = state.uid;
      save();
      /* والنشرُ فعلٌ صريح، فيبلغ الخادمَ في حينه لا بعد تأجيل — ‎srvPush‎ ترفع
         إن صارت «عامّة» وتسحب إن غادرتها */
      srvPush(p, cmCode, cmView.sub || cmTabSel);
    }
    /* «تمّ» تُنهي التحرير لا تحفظ: المحفوظ محفوظٌ منذ أوّل حرف */
    if (wasSend) { cleanupEmptyMine(); cmView = { mode: 'list', pi: 0 }; }
    renderCmSection();
    /* ونافذةُ البطاقة إن كانت مفتوحة تتبع الوضعَ الجديد: كومةُ «مَن عندها» تغيب في الخاصّة
       وتعود في غيرها، ومقطعُ الوضع في المسار يتبدّل — فلا تبقى تعرض حالًا انقضى */
    if (cardDlg && !wasSend) cdRenderFx();
  }
  $('#pst-modal').addEventListener('click', e => {
    const o = e.target.closest('.pst-opt');
    if (o) { closePstAsk(o.dataset.pst); return; }
    if (!e.target.closest('.mmodal__card')) closePstAsk(null);
  });
  /* أيقونةُ الحذف سلّةٌ لا «✕»: الصليبُ في هذا الموقع معناه «أغلِق» أو «انزع بندًا» —
     وهو مستعملٌ بذلك في صفوف الشجرة والمواضيع والأوقات. أمّا هذا فيمحو **المساهمة كلَّها**،
     ففعلٌ من جنسٍ آخر يستحقّ صورةً من جنسٍ آخر. والسلّةُ تُقرأ محوًا بلا تعلّم */
  const TRASH_IC = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 7h16"/>
      <path d="M9.5 7V5.4A1.4 1.4 0 0 1 10.9 4h2.2a1.4 1.4 0 0 1 1.4 1.4V7"/>
      <path d="M6.6 7l.75 11.2A1.9 1.9 0 0 0 9.25 20h5.5a1.9 1.9 0 0 0 1.9-1.8L17.4 7"/>
      <path d="M10.4 11v5M13.6 11v5"/>
    </svg>`;
  /* تذييل تحرير المساهمة: يمينًا دائرة الاكتمال (أقصى اليمين) ثم زر الإرسال،
     وزر الحذف مدفوع لأقصى اليسار بعيدًا عنهما (تمتلئ الدائرة لحظيًا عبر refreshEditCompleteness)
     وفي بندَي المصادر يسبق زرَّ الحذف شريطُ أدوات الكتابة (B · I · قائمة · ملف) */
  const editActsFoot = (sec, d) => `<div class="edit-acts edit-acts--foot">
      ${(sec === 'srcU' || sec === 'srcP') ? '' : completeGlyph(completenessOf(sec, d))}
      ${(sec === 'srcU' || sec === 'srcP') ? srcToolsHTML(sec) : ''}
      <button type="button" class="infoedit-del" title="${T().delPost}" aria-label="${T().delPost}">${TRASH_IC}</button>
      ${pstBadge()}
      <button type="button" class="info-sharebtn${shareOff()}" id="cm-info-share" title="${T().doneBtn}">${T().doneBtn}</button>
    </div>`;

  /* مواضيع المادة داخل مساهمة «المادة»: [مواضيع المادة ▲▼ ① فـ (رقم) (اسم) +]
     يُعرض موضوع واحد في كل مرّة (نمط مستطيل الساعات المكتبية) — الحقول بلا إطار
     كي لا يصير مربّع داخل مربّع */
  const topicsOf = d => d.topics || (d.topics = []);
  function topicsChipHTML(d) {
    const list = topicsOf(d);
    const n = list.length;
    const add = `<button type="button" class="tp-add" title="${T().addLesson}">+</button>`;
    if (!n) return `<span class="chipe chipe--topics"><i>${T().topicsSec}</i>${add}</span>`;
    let idx = topicIdx; if (idx >= n) idx = n - 1; if (idx < 0) idx = 0;
    const x = list[idx];
    const nav = n > 1
      ? `<span class="chipe__steps tp-step"><button type="button" data-d="1" aria-label="+"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M12 7 18 17 6 17Z"/></svg></button><button type="button" data-d="-1" aria-label="−"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M6 7 18 7 12 17Z"/></svg></button></span>`
      : '';
    return `<span class="chipe chipe--topics" data-ti="${idx}">
        <i>${T().topicsSec}</i>
        ${nav}
        <span class="tp-order">${idx + 1}</span>
        <i class="tp-tag">${T().chTag}</i>
        <input class="tp-in tp-in--num" data-f="num" placeholder="${T().chNumPh}" value="${esc(x.num || '')}">
        <input class="tp-in tp-in--name" data-f="name" placeholder="${T().chNamePh}" value="${esc(x.name || '')}">
        <button type="button" class="tp-del" title="✕">✕</button>
        ${add}
      </span>`;
  }
  /* بطاقة تحرير «المادة» إنلاين — نفس هوية الكومنت المنشور: الصورة عمود يمين والاسم فوق (بلا تاريخ
     وبلا خط فاصل)، ثم الحقول القابلة للتحرير، وأسفلها يمينًا زرّا الإرسال والحذف */
  function infoEditCard(p, i) {
    const d = p.data;
    const fields = `<div class="pk-head">
        <div class="fold-peek fold-peek--edit">
          <span class="chipe chipe--book">
            <label class="chipe-bookimg" title="${T().bookImgAdd}">${chipBook(d.bookImg)}<input type="file" accept="image/*" class="book-imgfile" hidden></label>
            <textarea id="cm-book" class="chipe-in chipe-in--book" rows="1" placeholder="${T().bookPh}">${esc(d.book || '')}</textarea>
          </span>
          <span class="chipe chipe--lang">
            <i>${T().courseLang}</i>
            ${mdropHTML('clang', 'clang', d.lang || '', [['', '—'], ...Object.entries(T().langs)])}
          </span>
          <span class="chipe chipe--type">
            <i>${T().courseType}</i>
            ${mdropHTML('ctype', 'ctype', d.type || '', [['', '—'], ...Object.entries(T().ctypes)])}
          </span>
          <span class="chipe chipe--rel">
            <i>${T().relLabel}</i>
            <span class="chipe__steps"><button type="button" class="rel-step" data-d="5" aria-label="+"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M12 7 18 17 6 17Z"/></svg></button><button type="button" class="rel-step" data-d="-5" aria-label="−"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M6 7 18 7 12 17Z"/></svg></button></span>
            <b id="cm-rel-val">${d.rel || 0}%</b>
          </span>
          ${topicsChipHTML(d)}
          <textarea id="cm-desc" class="chipe-in chipe-in--desc" rows="1" placeholder="${T().descPh}">${esc(d.desc || '')}</textarea>
        </div>
      </div>`;
    return `<div class="post pk pk--peek pk--edit" data-pi="${i}" data-sub="info">
      <div class="post-yt">
        <span class="post-av post-av--yt">${avatarHTML(p)}</span>
        <div class="post-ytmain">
          <div class="post-ytmeta">${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b></div>
          ${fields}
          ${editActsFoot('info', d)}
        </div>
      </div>
    </div>`;
  }

  /* بطاقة تحرير «توزيع الدرجات» إنلاين — نفس هوية الكومنت المنشور (الصورة عمود يمين والاسم فوق،
     بلا تاريخ ولا خط فاصل)، وأدواتها داخلها: طريقة التقييم + البار الحيّ + بنود التوزيع.
     تُبقي المعرّفين ‎#cm-gmethod‎ و‎#cm-gbody‎ ليملأهما renderGrading كما هو */
  function gradeEditCard(p, i) {
    const g = gradingOf(cmCode);
    /* الترتيب في RTL: أول عنصر يمينًا — كتلة «توزيع الدرجة» يمينًا و«طريقة التقييم» يسارها */
    const fields = `<div class="pk-head">
        <div class="fold-peek fold-peek--edit gedit">
          <div class="gedit__dist">
            <div class="gdist__head">
              <span class="cm-k">${T().distShort}</span>
              <button type="button" class="cm-adddoc" id="cm-additem" title="${T().addItem}">+</button>
            </div>
            <div id="cm-gbody"></div>
          </div>
          <span class="chipe chipe--gmethod">
            <i>${T().methodLabel}</i>
            ${mdropHTML('gmethod', 'gmethod', g.method || 'avg', [['avg', 'Average'], ['std', 'Standard']])}
          </span>
        </div>
      </div>`;
    return `<div class="post pk pk--peek pk--edit" data-pi="${i}" data-sub="grade">
      <div class="post-yt">
        <span class="post-av post-av--yt">${avatarHTML(p)}</span>
        <div class="post-ytmain">
          <div class="post-ytmeta">${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b></div>
          ${fields}
          ${editActsFoot('grade', p.data)}
        </div>
      </div>
    </div>`;
  }

  /* بطاقة تحرير «الغياب والتأخير» إنلاين — نفس هوية الكومنت المنشور:
     خمسة عدّادات (مجاني · بداية الخصم · مقداره · DN · التأخير) ثم شريط الغياب الحيّ تحتها.
     العدّادات تستعمل نفس ‎.dabs-step‎ فيخدمها المعالج الموجود */
  function absEditCard(p, i) {
    const A = p.data;
    const stepBtns = `<button type="button" data-d="1" aria-label="+"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M12 7 18 17 6 17Z"/></svg></button>` +
      `<button type="button" data-d="-1" aria-label="−"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M6 7 18 7 12 17Z"/></svg></button>`;
    const chip = (f, label, pct) => `<span class="chipe chipe--abs"><i>${label}</i>` +
      `<span class="chipe__steps dabs-step" data-ab="${f}">${stepBtns}</span>` +
      `<b>${A[f] || 0}</b>${pct ? '<span class="abs-pct">%</span>' : ''}</span>`;
    /* التحرير: العدّادات فقط — بلا الشكل التمثيلي (الشريط) */
    const fields = `<div class="pk-head">
        <div class="fold-peek fold-peek--rich fold-peek--edit">
          <div class="peek-badges absedit">
            ${chip('free', T().absFree)}${chip('dedFrom', T().absDedFrom)}${chip('dedAmt', T().absDedAmt, true)}
            ${chip('dn', T().absDN)}${chip('late', T().absLate)}
          </div>
        </div>
      </div>`;
    return `<div class="post pk pk--peek pk--edit" data-pi="${i}" data-sub="abs">
      <div class="post-yt">
        <span class="post-av post-av--yt">${avatarHTML(p)}</span>
        <div class="post-ytmain">
          <div class="post-ytmeta">${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b></div>
          ${fields}
          ${editActsFoot('abs', p.data)}
        </div>
      </div>
    </div>`;
  }

  /* بطاقة تحرير «المصادر» (فهم/ممارسة) إنلاين — نفس هوية الكومنت المنشور، وأدواتها بداخلها:
     زرّا «+ أساسي / + فرعي» وقائمة المصادر. يبقى ‎.src-area[data-area]‎ و‎#cm-src-{area}‎
     كما هما ليعمل renderSources ومعالجات الإدخال/الملفات بلا تعديل */
  function srcEditCard(p, i, area) {
    /* بلا صندوق حاوٍ وبلا عنوان القسم: مربّعات المصادر، وآخرها دائمًا مربّع «+» */
    const fields = `<div class="pk-head">
        <div class="fold-peek fold-peek--edit sedit">
          <div class="src-area" data-area="${area}">
            <div id="cm-src-${area}"></div>
          </div>
        </div>
      </div>`;
    return `<div class="post pk pk--peek pk--edit" data-pi="${i}" data-sub="${area}">
      <div class="post-yt">
        <span class="post-av post-av--yt">${avatarHTML(p)}</span>
        <div class="post-ytmain">
          <div class="post-ytmeta">${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b></div>
          ${fields}
          ${editActsFoot(area, p.data)}
        </div>
      </div>
    </div>`;
  }

  function postCard(sec, p, i) {
    if (sec === 'info') return foldPost(sec, p, i, null);   /* «المادة» كومنتات مطوية */
    return `<div class="post" data-pi="${i}" data-sub="${sec}">
      <div class="post__body">${postBody(sec, p.data)}</div>
      <div class="post__top">
        <span class="post-av post-av--sm">${avatarHTML(p)}</span>
        <div class="post-meta">
          ${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b>
          ${dateBtnHTML(p, `${sec}:${i}`)}
        </div>
        <div class="post-side">
          <button type="button" class="post-like ${p.liked ? 'on' : ''}" data-like="${i}" data-sub="${sec}">♥ ${p.likes || 0}</button>
          ${myActs(p, null, sec)}
        </div>
      </div>
    </div>`;
  }

  /* ترتيب العرض: الأحدث أولًا دائمًا (مع حفظ الفهرس الأصلي للأحداث) */
  /* المثبَّتة (تثبيت الأدمن) تتصدّر أي ترتيب — ثم يسري الفرز المختار داخل كل مجموعة */
  const pinRank = p => (p && p.pin ? 1 : 0);
  /* أيقونة الحفظ: قرص الحفظ المعروف (بدل كلمة «حفظ») */
  const SAVE_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5.2 3.6h9.9l4.9 4.9v10.9a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V5.2a1.6 1.6 0 0 1 1.6-1.6z"/><path d="M8 3.6v5h6.4v-5"/><path d="M7.2 13.2h9.6v7.8H7.2z"/></svg>';
  /* إبهاما «مفيد/غير مفيد» — على مستوى الوحدة كي يستعملهما عرض المكتبة ومنتقي الركن معًا */
  const THUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
  const THDN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>';
  /* شارة صغيرة تُعلم القارئ أن الأدمن ثبّت هذه المساهمة */
  const pinBadge = p => p && p.pin ? `<span class="post-pinned" title="${T().pinnedTag}">${PIN_IC}${T().pinnedTag}</span>` : '';
  const PIN_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6l-1 5 3.5 3.5H6.5L10 8z"/><path d="M12 11.5V21"/></svg>';
  const byNewest = arr => arr.map((p, i) => ({ p, i })).sort((a, b) =>
    (pinRank(b.p) - pinRank(a.p)) || ((b.p.ts || 0) - (a.p.ts || 0)));
  /* «الأفضل»: صافي التقييم (مفيد − غير مفيد) تنازليًّا، وعند التعادل الأحدث — مع حفظ الفهرس الأصلي */
  const byBestIdx = arr => arr.map((p, i) => ({ p, i })).sort((a, b) =>
    (pinRank(b.p) - pinRank(a.p)) ||
    (((b.p.likes || 0) - (b.p.dislikes || 0)) - ((a.p.likes || 0) - (a.p.dislikes || 0))) || ((b.p.ts || 0) - (a.p.ts || 0)));
  /* شريط الترتيب: زر همبرغر صغير بلا نص يفتح قائمة (الأفضل/الأحدث) — يعيد استخدام بنية .post-menu */
  /* أيقونة الفرز «sort by»: سهم تنازلي يسارًا + أعمدة متناقصة يمينًا (أوضح من الهمبرغر) */
  const SORT_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4v14"/><path d="M2.5 16.5 5 19l2.5-2.5"/><path d="M11 6h9M11 12h6M11 18h3"/></svg>';
  function cmSortBar(n) {
    /* العدّاد «عدد المساهمات + مساهمة» يمينًا، والأيقونة يساره */
    const count = n != null ? `<span class="cm-count"><b>${n}</b> ${T().contribUnit}</span>` : '';
    return `<div class="cm-sortbar">
      ${count}
      <div class="post-menu cm-sort">
        <button type="button" class="post-menubtn cm-sortbtn" title="${T().sortBy}" aria-label="${T().sortBy}">${SORT_IC}</button>
        <div class="post-menu__list cm-sort__list">
          <button type="button" class="cm-sortopt${cmSort === 'best' ? ' on' : ''}" data-sort="best">${T().sortBest}</button>
          <button type="button" class="cm-sortopt${cmSort === 'newest' ? ' on' : ''}" data-sort="newest">${T().sortNewest}</button>
        </div>
      </div>
    </div>`;
  }
  /* صافي تقييم مساهمة (للفرز «الأفضل») */
  const docNet = p => (p.likes || 0) - (p.dislikes || 0);
  /* شرائح منتقي الدكاترة: «كل الدكاترة» أوّلًا، ثم الدكاترة مرتّبين بتقييمهم تنازليًّا (بلا تقييم = الأخير) */
  function drCarSlides(doctors) {
    const rank = a => (a.avg == null ? -1 : a.avg);
    const order = doctors.map((dr, di) => ({ dr, di, avg: avgDocRating(dr) }))
      .sort((a, b) => rank(b) - rank(a));
    return [{ di: null }, ...order];
  }
  /* بطاقة الشريحة الواحدة: صورة الدكتور، تحتها اسمه، تحته تقييمه — ونقرها يطبّق التصفية */
  function drCarCardHTML(s, ci) {
    const STAR = '<svg class="star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5 20.7l1.4-6.8L1.3 9l6.9-.7z"/></svg>';
    const ALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16.5 5.5a3 3 0 0 1 0 5.4"/><path d="M18 19a5.5 5.5 0 0 0-2-4.3"/></svg>';
    if (s.di == null) {
      return `<button type="button" class="drcar__card drfilter${cmDocSel == null ? ' on' : ''}" data-drfilter="all" data-ci="${ci}">
          <span class="drcar__av drcar__av--all">${ALL}</span>
          <b class="drcar__name">${T().allDoctors}</b>
          <span class="drcar__rate drcar__rate--none">—</span>
        </button>`;
    }
    return `<button type="button" class="drcar__card drfilter${cmDocSel === s.di ? ' on' : ''}" data-drfilter="${s.di}" data-ci="${ci}">
        <span class="drcar__av">${drAvatar(s.dr)}</span>
        <b class="drcar__name">${esc(s.dr.name) || '—'}</b>
        <span class="drcar__rate">${s.avg != null ? `${STAR}${s.avg.toFixed(1)}` : '—'}</span>
      </button>`;
  }
  /* عدّاد «الجزء من الكل» بنفس نمط عدّاد الفترات: عناصر منفصلة يرتّبها اتجاه الصندوق */
  const drCarNumHTML = (i, n) => `<b class="hn-i">${i}</b><i class="hn-s">/</i><b class="hn-t">${n}</b>`;
  /* شريط ترتيب تبويب الدكاترة: نفس زر الهمبرغر — قائمته = فرز (الأفضل/الأحدث) + منتقي الدكاترة الأفقي */
  function cmDocBar(doctors, n) {
    const ARW = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${d > 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}"/></svg>`;
    /* المنتقي الأفقي: سهم يمين (السابق) · البطاقة · سهم يسار (التالي) — ثم العدّاد تحتهم */
    const slides = drCarSlides(doctors);
    if (docCarIdx >= slides.length) docCarIdx = 0;
    const rows = `<div class="drcar" data-total="${slides.length}">
        <div class="drcar__row">
          <button type="button" class="drcar-nav" data-d="-1" aria-label="${T().prevDoctor}">${ARW(-1)}</button>
          <div class="drcar__body">${drCarCardHTML(slides[docCarIdx], docCarIdx)}</div>
          <button type="button" class="drcar-nav" data-d="1" aria-label="${T().nextDoctor}">${ARW(1)}</button>
        </div>
        <div class="drcar__num">${drCarNumHTML(docCarIdx + 1, slides.length)}</div>
      </div>`;
    /* دكتور محدَّد في الفلتر: مستطيل يسار زر الفلتر بصورته واسمه — إشارة أن هناك تصفية فعّالة */
    const selDr = cmDocSel != null ? doctors[cmDocSel] : null;
    const activeChip = selDr
      ? `<span class="v-badge v-badge--g dr-badge cm-docactive" title="${T().filterByDoctor}">
           <span class="dr-badge__av">${drAvatar(selDr)}</span>
           <b class="dr-badge__nm">${esc(selDr.name) || '—'}</b>
           ${drRateTag(selDr)}
         </span>`
      : '';
    return `<div class="cm-sortbar">
      ${n != null ? `<span class="cm-count"><b>${n}</b> ${T().contribUnit}</span>` : ''}
      <div class="post-menu cm-sort">
        <button type="button" class="post-menubtn cm-sortbtn" title="${T().sortBy}" aria-label="${T().sortBy}">${SORT_IC}</button>
        <div class="post-menu__list cm-sort__list cm-docmenu">
          <div class="cm-sortgrp">
            <button type="button" class="cm-sortopt${cmSort === 'best' ? ' on' : ''}" data-sort="best">${T().sortBest}</button>
            <button type="button" class="cm-sortopt${cmSort === 'newest' ? ' on' : ''}" data-sort="newest">${T().sortNewest}</button>
          </div>
          <div class="cm-docmenu__t">${T().filterByDoctor}</div>
          ${rows}
        </div>
      </div>${activeChip}
    </div>`;
  }

  /* أفضل مشاركة: الأكثر لايكات، وعند التعادل الأحدث */
  function bestIdx(arr) {
    let bi = -1;
    arr.forEach((p, i) => {
      if (bi < 0 || (p.likes || 0) > (arr[bi].likes || 0) ||
          ((p.likes || 0) === (arr[bi].likes || 0) && (p.ts || 0) > (arr[bi].ts || 0))) bi = i;
    });
    return bi;
  }

  /* ---------- وقت الساعة المكتبية: نموذج {h,m,ap} (ap: am|pm)، يقبل النص القديم "HH:MM" (٢٤س) للتوافق ---------- */
  function normTime(v) {
    if (!v) return null;
    if (typeof v === 'object') return (v.h || v.m) ? { h: v.h || '', m: v.m || '', ap: v.ap || 'am' } : null;
    const mt = /^(\d{1,2}):(\d{2})/.exec(String(v));
    if (!mt) return null;
    const H = +mt[1]; let h12 = H % 12; if (h12 === 0) h12 = 12;
    return { h: String(h12), m: mt[2], ap: H >= 12 ? 'pm' : 'am' };
  }
  function fmtTime(v) {
    const t = normTime(v);
    if (!t) return '';
    return `${t.h || '12'}:${t.m || '00'} ${T().ampmS[t.ap] || ''}`;
  }
  /* قائمة منسدلة مخصّصة بثيم الموقع (بديل <select> الأصلي غير القابل للتنسيق) */
  function mdropHTML(kind, key, curVal, options) {
    const cur = options.find(o => String(o[0]) === String(curVal)) || options[0];
    return `<span class="mdrop mdrop--${kind}" data-drop="${key}">
      <button type="button" class="mdrop-btn"><svg class="mdrop-arw" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>${cur && cur[2] ? `<span class="mdrop-av">${cur[2]}</span>` : ''}<span class="mdrop-val">${cur ? cur[1] : ''}</span></button>
      <div class="mdrop-list" hidden>${options.filter(o => String(o[0]) !== '').map(o => `<button type="button" class="mdrop-opt${String(o[0]) === String(curVal) ? ' on' : ''}" data-v="${o[0]}">${o[2] ? `<span class="mdrop-av">${o[2]}</span>` : ''}<span class="mdrop-optnm">${o[1]}</span></button>`).join('')}</div>
    </span>`;
  }
  /* حقل وقت مخصّص: خانتا HH:MM قابلتان للكتابة (تلميح 00 باهت، بلا تظليل أزرق) + منسدلة ص/م */
  function timeFieldHTML(hi, f, v) {
    const t = normTime(v) || { h: '', m: '', ap: 'am' };
    return `<span class="tfield" data-hi="${hi}" data-f="${f}">
      <span class="thm"><input class="tin tin-h" inputmode="numeric" maxlength="2" placeholder="00" value="${t.h}"><span class="tcolon">:</span><input class="tin tin-m" inputmode="numeric" maxlength="2" placeholder="00" value="${t.m}"></span>
      ${mdropHTML('ap', 'ap-' + hi + '-' + f, t.ap, T().ampm)}
    </span>`;
  }
  /* تطبيق اختيار المنسدلة المخصّصة (اليوم أو ص/م) على مساهمتي عن الدكتور */
  function applyMdrop(key, val) {
    /* منتقي الدكتور: نقل مساهمتي من دكتورها الحالي إلى الدكتور المختار (مساهمة واحدة لكل دكتور) */
    if (key === 'drpick') {
      const newDi = +val;
      const from = doctorsOf(cmCode)[cmView.di], to = doctorsOf(cmCode)[newDi];
      if (from && to && newDi !== cmView.di) {
        const mi = from.posts.findIndex(x => x.me);
        if (mi >= 0) {
          const [post] = from.posts.splice(mi, 1);
          to.posts = to.posts.filter(x => !x.me);   /* لا تكرار: تُستبدل مساهمتي السابقة عن الهدف */
          to.posts.push(post);
          /* المحرّر وحده ينتقل للدكتور المختار — فلتر العرض (cmDocSel) شأن مستقلّ لا يُمسّ:
             اختيار «عمّن أكتب» ليس تصفيةً لما أقرأ */
          cmView = { mode: 'edit', pi: 0, di: newDi };
        }
      }
      save(); renderCmSection();
      return;
    }
    /* «المادة»: اختيار لغة المادة / نوعيتها من المنسدلة المخصّصة (بديل <select> الأصلي) */
    if (key === 'clang') { natureData(cmCode).lang = val; save(); renderCmSection(); return; }
    if (key === 'ctype') { natureData(cmCode).type = val; save(); renderCmSection(); return; }
    /* «توزيع الدرجات»: اختيار طريقة التقييم (Average / Standard) من المنسدلة */
    if (key === 'gmethod') { gradingOf(cmCode).method = val; save(); renderCmSection(); return; }
    const hours = docHours(myDrPost(cmCode, cmView.di).data);
    if (key.indexOf('day-') === 0) {
      const hi = +key.slice(4);
      if (hours[hi]) hours[hi].day = +val;
    } else if (key.indexOf('ap-') === 0) {
      const rest = key.slice(3), dash = rest.indexOf('-');
      const hi = +rest.slice(0, dash), f = rest.slice(dash + 1);
      if (hours[hi]) { const t = normTime(hours[hi][f]) || { h: '', m: '', ap: 'am' }; t.ap = val; hours[hi][f] = t; }
    }
    save(); renderCmSection();
  }

  /* الواجهة المشتركة: قائمة المشاركات ← مشاركة كاملة ← أو محرر رأيي */
  /* ---------- قسم الدكتور: كتل الدكاترة ومشاركات المجتمع تحتهم ---------- */
  const drAvatar = dr => dr.img ? `<img src="${dr.img}" alt="">` : FLAT_AVATAR;

  /* بطاقة تحرير مساهمة الدكتور إنلاين (نفس شكل الكومنت المنشور): الحقول قابلة للتحرير داخل
     نفس بطاقة .post.pk، وزر إرسال صغير + حذف يسارًا، وهويتي أسفل الخط — لا صفحة/محرّر منفصل */
  function drEditCard(dr, di, p, pi) {
    const d = p.data;   /* بلا حقل غياب: صار بندًا مستقلًّا بتبويبه (قناة abs) */
    /* مستطيل ساعة مكتبية واحد (بعرض عمودين): X حذف · عدّاد وسهمان للتنقّل بين الفترات · يوم · من/إلى · + إضافة */
    const dayOpts = T().daysShort.map((n, dd) => [dd, n]);
    const hours = docHours(d);
    const total = hours.length;
    let idx = ehIdx; if (idx >= total) idx = total - 1; if (idx < 0) idx = 0;
    const ehnav = total > 1
      ? `<span class="ehnav"><span class="ehnav-arrows"><button type="button" class="ehnav-btn" data-ehdir="1" aria-label="+">▲</button>` +
        `<button type="button" class="ehnav-btn" data-ehdir="-1" aria-label="−">▼</button></span>` +
        /* نفس عدّاد النشر: عناصر منفصلة يرتّبها اتجاه الصندوق (الجزء يمينًا مع العربية) */
        `<span class="ehnav-num"><b class="hn-i">${idx + 1}</b><i class="hn-s">/</i><b class="hn-t">${total}</b></span></span>`
      : '';
    const hourChips = total
      ? `<span class="chipe chipe--wide chipe--hour" data-hi="${idx}">
          <button type="button" class="hr-btn hr-del" title="✕">✕</button>
          ${ehnav}
          ${mdropHTML('day', 'day-' + idx, hours[idx].day, dayOpts)}
          ${timeFieldHTML(idx, 'from', hours[idx].from)}
          <span class="dslot-sep">–</span>
          ${timeFieldHTML(idx, 'to', hours[idx].to)}
          <button type="button" class="hr-btn hr-add" title="+">+</button>
        </span>`
      : `<button type="button" class="chipe chipe--wide chipe--add hr-add">+ ${T().addHours}</button>`;
    /* مكتب الدكتور: مستطيل مقسوم — المبنى (يمين) · رقم المكتب (يسار) */
    const officeChip = `<span class="chipe chipe--office">` +
      `<input class="doc-in office-in" data-f="bld" value="${esc(d.bld || '')}" placeholder="${T().bldPh}">` +
      `<span class="office-sep"></span>` +
      `<input class="doc-in office-in" data-f="room" value="${esc(d.room || '')}" placeholder="${T().roomPh}"></span>`;
    /* مثلّثا الزيادة/النقصان — نفس أيقونتَي «نسبة الترابط» (rel-step) لتوحيد الثيم */
    const stepBtns = `<button type="button" data-d="1" aria-label="+"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M12 7 18 17 6 17Z"/></svg></button>` +
      `<button type="button" data-d="-1" aria-label="−"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M6 7 18 7 12 17Z"/></svg></button>`;
    /* تقييم مضغوط: المثلّثان ثم القيمة — الدرجة يمين · «/» في الوسط · «10» يسار بالعربي (والعكس بالإنجليزي) */
    const rateChip = k => `<span class="chipe chipe--rate"><i>${k === 'teach' ? T().teach : T().grade}</i>` +
      `<span class="chipe__steps drate-step" data-k="${k}">${stepBtns}</span>` +
      `<b class="rate-v"><span class="rv-tot">10</span><span class="rv-slash">/</span><span class="rv-num">${+d[k] || 0}</span></b></span>`;
    /* منتقي الدكتور: قائمة منسدلة (مثل قائمة الأيام) بكل الدكاترة — اختياره ينقل مساهمتي لذلك الدكتور */
    /* اسم الدكتور ومعه تقييمه الكلّي داخل القائمة وفي المستطيل بعد الاختيار */
    const docOpts = doctorsOf(cmCode).map((dd, i) =>
      [i, `${esc(dd.name) || `${T().docName} ${i + 1}`}${drRateTag(dd)}`, drAvatar(dd)]);
    const docPickChip = `<span class="chipe chipe--wide chipe--drpick"><i>${T().docPickLab}</i>${mdropHTML('drpick', 'drpick', di, docOpts)}</span>`;
    const head = `<div class="pk-head">
        <div class="fold-peek fold-peek--rich fold-peek--edit">
          <div class="peek-badges">
            ${docPickChip}
            <span class="chipe chipe--mail"><input class="doc-in chipe-in chipe-in--mail" data-f="e" type="email" value="${esc(d.e)}" placeholder="${T().docEmail}"></span>
            ${officeChip}
            ${hourChips}
            ${rateChip('teach')}${rateChip('grade')}
          </div>
          <!-- الصفّ الثالث: مستطيل الانطباع وحده بعرض البطاقة كاملًا (التأخير انتقل آخر الصفّ الثاني) -->
          <div class="doc-descwrap">
            <div class="doc-in chipe-in chipe-in--desc doc-desc-ce" data-f="d" contenteditable="true" data-ph="${esc(T().docDescPh)}">${esc(d.d)}</div>
          </div>
        </div>
      </div>`;
    return `<div class="post pk pk--peek pk--edit" data-pi="${pi}" data-dr="${di}">
      <div class="post-yt">
        <span class="post-av post-av--yt">${avatarHTML(p)}</span>
        <div class="post-ytmain">
          <div class="post-ytmeta">${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b></div>
          ${head}
          ${editActsFoot('doc', d)}
        </div>
      </div>
    </div>`;
  }

  /* (drTakeHTML حُذف: كان يعرض مساهمة الدكتور المختارة في الداشبورد المحذوف) */

  /* محرر سياسة الغياب/التأخير داخل محرر الدكتور (عدّادات تكتب في d.abs) */
  function docAbsEditorHTML(d) {
    const A = docAbs(d);
    const step = (f, label) => `
      <div class="abs-row">
        <span class="abs-k">${label}</span>
        <div class="abs-step abs-step--doc" data-ab="${f}">
          <button type="button" data-d="-1">−</button>
          <b>${A[f] || 0}</b>
          <button type="button" data-d="1">+</button>
        </div>
      </div>`;
    return `<div class="doc__abs">
      <p class="cm-k doc__abs-t">${T().absPolicy}</p>
      ${step('free', T().absFree) + step('dedFrom', T().absDedFrom) + step('dedAmt', T().absDedAmt) + step('dn', T().absDN)}
      ${absStripHTML(A)}${absLegHTML(A)}
      ${step('late', T().absLate)}
      ${A.late > 0 ? `<p class="abs-late">${T().lateNote(A.late)}</p>` : ''}
    </div>`;
  }

  /* محرر رأيي عن دكتور معيّن (الإيميل/الساعات/التقييم/سياسة الغياب/الوصف — لا اسم ولا صورة) */
  function drEditorHTML(di) {
    const dr = doctorsOf(cmCode)[di];
    const d = myDrPost(cmCode, di).data;
    const slots = docHours(d).map((h, hi) => `
      <div class="dslot" data-hi="${hi}">
        <select class="dslot-day">
          ${T().days.map((n, dd) => `<option value="${dd}" ${+h.day === dd ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
        <input type="time" class="dslot-in" data-f="from" value="${h.from}">
        <span class="dslot-sep">–</span>
        <input type="time" class="dslot-in" data-f="to" value="${h.to}">
        <button type="button" class="dslot-del" title="✕">✕</button>
      </div>`).join('');
    return `
      <div class="dr__head">
        <span class="dr-av">${drAvatar(dr)}</span>
        <b class="dr-name">${esc(dr.name) || '—'}</b>
      </div>
      <div class="doc">
        <label class="cm-field">${T().docEmail}<input class="doc-in doc-in--ltr" data-f="e" type="email" value="${esc(d.e)}"></label>
        <div class="doc__hours">
          <div class="doc__hours-head">
            <span class="cm-k">${T().officeHours}</span>
            <button type="button" class="doc-addtime">+ ${T().addTime}</button>
          </div>
          ${slots}
        </div>
        <div class="doc__rates">${rateBlocks('teach', d.teach)}${rateBlocks('grade', d.grade)}</div>
        ${docAbsEditorHTML(d)}
        <label class="cm-field">${T().docDesc}<textarea class="doc-in" data-f="d" rows="2" placeholder="${T().docDescPh}">${esc(d.d)}</textarea></label>
      </div>`;
  }

  /* نقطة إعادة الرسم الوحيدة: القسم النشط في نافذة واحدة أسفل الشريط الواحد */
  function renderCmSection() {
    /* وأوّلُ ما يُسأل: أبقيتَ في نطاقك أم غادرتَه؟ — ‎cdScopeSync‎ تحرس نفسَها بمقارنةٍ
       واحدة، وهذه الدالّة تُنادى في كلّ نقرةٍ فلا تُحمَّل ما يثقلها */
    cdScopeSync();
    /* دخولُ المحرّر يُسلّح اللمحة، ويستهلكها أوّلُ بناءٍ للشجرة بعده */
    jrPeekArm = cmView.mode === 'edit';
    const sec = cmTabSel;
    const back = `<div class="cm-back"><button type="button" class="cm-backbtn" id="cm-back">← ${T().backToList}</button></div>`;
    let inner = '';
    if (sec === 'cards') {
      /* «البطائق»: عرض مجمّع كالشروح — متصفح شجرة المجلدات والبطائق (ROADMAP-CARDS م2) */
      inner = cardsTabHTML();
    } else if (sec === 'doc') {
      /* الدكتور: كل المساهمات عن كل الدكاترة في نافذة واحدة؛ زر الترتيب = فرز + جدول تصفية الدكاترة.
         الدكاترة يُوضعون خارجيًّا (لا إدارة/إضافة/حذف داخل الموقع) */
      const doctors = doctorsOf(cmCode);
      {
        const editing = cmView.mode === 'edit';
        /* التحرير لا يُقصّر العرض: تبقى كل الكومنتات ظاهرة ومساهمتي وحدها تُستبدل ببطاقة تحرير
           إنلاين — نفس إحساس «المادة» (كأنك في الصفحة نفسها). الفلتر وحده هو ما يُقصّر. */
        const filterDi = cmDocSel;
        if (editing && cmView.di != null && doctors[cmView.di]) myDrPost(cmCode, cmView.di);   /* ضمان وجود مساهمتي */
        const items = [];
        doctors.forEach((dr, di) => {
          const editDr = editing && di === cmView.di;          /* الدكتور الذي أحرّر مساهمتي عنه */
          const hidden = filterDi != null && di !== filterDi;   /* خارج الفلتر الحالي */
          /* الفلتر لا يحجب بطاقة التحرير أبدًا: لو اخترت دكتورًا غير المُصفّى عليه تبقى مساهمتي ظاهرة
             (لكن بقيّة مساهمات ذلك الدكتور تظلّ محجوبة — الفلتر يخصّ القراءة لا الكتابة) */
          if (hidden && !editDr) return;
          (dr.posts || []).forEach((p, pi) => {
            if (hidden && !p.me) return;
            /* أخفِ مساهمتي الفارغة إلا أثناء تحريرها */
            if (p.me && isEmptyDocData(p.data) && !editDr) return;
            items.push({ p, di, pi, dr });
          });
        });
        items.sort((a, b) => cmSort === 'best'
          ? (docNet(b.p) - docNet(a.p)) || ((b.p.ts || 0) - (a.p.ts || 0))
          : (b.p.ts || 0) - (a.p.ts || 0));
        inner = cmDocBar(doctors, items.length) + (items.length
          ? items.map(({ p, di, pi, dr }) =>
              (editing && p.me && di === cmView.di) ? drEditCard(dr, di, p, pi) : foldPost('doc', p, pi, { dr: di })
            ).join('')
          : `<p class="v-none">${doctors.length ? T().noPosts : T().noDoctors}</p>`);
      }
    } else if (sec === 'videos') {
      /* «الشروح»: سيل كومنتات الرزم — والتحرير إنلاين داخله (مساهمتي بطاقة في موضعها) */
      inner = videosTabHTML();
    } else if (sec === 'info') {
      /* «المادة» كتعليقات يوتيوب: التحرير إنلاين داخل القائمة — مشاركتي تظهر بطاقةً قابلةً للتحرير
         بنفس شكل المنشور (لا صفحة/محرر منفصل)، وزر مشاركة صغير يسارًا */
      const editing = cmView.mode === 'edit';
      if (editing) myPost(cmCode, 'info');   /* ضمان وجود مشاركتي */
      const posts = (cmSort === 'best' ? byBestIdx : byNewest)(draftAware(postsOf(cmCode, 'info'), editing));
      inner = posts.length
        ? cmSortBar(posts.length) + posts.map(({ p, i }) => (editing && p.me) ? infoEditCard(p, i) : foldPost('info', p, i, null)).join('')
        : `<p class="v-none">${T().noPosts}</p>`;
    } else if (sec === 'abs') {
      /* «الغياب والتأخير» بند مستقلّ عن الدكاترة: قناة على مستوى المادة بنفس آلية «التقييم» */
      const editing = cmView.mode === 'edit';
      if (editing) myPost(cmCode, 'abs');   /* ضمان وجود مساهمتي */
      const posts = (cmSort === 'best' ? byBestIdx : byNewest)(draftAware(postsOf(cmCode, 'abs'), editing));
      inner = posts.length
        ? cmSortBar(posts.length) + posts.map(({ p, i }) => (editing && p.me) ? absEditCard(p, i) : foldPost('abs', p, i, null)).join('')
        : `<p class="v-none">${T().noPosts}</p>`;
    } else if (sec === 'grade') {
      /* «توزيع الدرجات» بنفس آلية «المادة»: التحرير إنلاين داخل القائمة — مساهمتي تتحوّل بطاقةً
         قابلة للتحرير في موضعها، وبقيّة الكومنتات تبقى ظاهرة (لا صفحة محرّر منفصلة) */
      const editing = cmView.mode === 'edit';
      if (editing) myPost(cmCode, 'grade');   /* ضمان وجود مشاركتي */
      const posts = (cmSort === 'best' ? byBestIdx : byNewest)(draftAware(postsOf(cmCode, 'grade'), editing));
      inner = posts.length
        ? cmSortBar(posts.length) + posts.map(({ p, i }) => (editing && p.me) ? gradeEditCard(p, i) : foldPost('grade', p, i, null)).join('')
        : `<p class="v-none">${T().noPosts}</p>`;
    } else if (sec === 'srcU' || sec === 'srcP') {
      /* «المصادر» (فهم/ممارسة) بنفس آلية «المادة»: التحرير إنلاين داخل القائمة */
      const editing = cmView.mode === 'edit';
      if (editing) myPost(cmCode, sec);   /* ضمان وجود مشاركتي */
      const posts = (cmSort === 'best' ? byBestIdx : byNewest)(draftAware(postsOf(cmCode, sec), editing));
      inner = posts.length
        ? cmSortBar(posts.length) + posts.map(({ p, i }) => (editing && p.me) ? srcEditCard(p, i, sec) : foldPost(sec, p, i, null)).join('')
        : `<p class="v-none">${T().noPosts}</p>`;
    } else if (cmView.mode === 'edit') {
      myPost(cmCode, cmView.sub || sec);   /* ضمان وجود مشاركتي قبل المحرر */
      inner = back + editorHTML(cmView.sub || sec);
    } else if (cmView.mode === 'view') {
      const p = postsOf(cmCode, sec)[cmView.pi];
      if (!p) { cmView = { mode: 'list', pi: 0 }; return renderCmSection(); }
      inner = `<div class="cm-back">
          <button type="button" class="cm-backbtn" id="cm-back">← ${T().backToList}</button>
          <span class="post-av post-av--sm">${avatarHTML(p)}</span>
          ${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b>
          ${dateBtnHTML(p, `${sec}:${cmView.pi}`)}
          <button type="button" class="post-like ${p.liked ? 'on' : ''}" data-like="${cmView.pi}">♥ ${p.likes || 0}</button>
        </div>` + viewHTML(sec, p.data);
    } else {
      const posts = postsOf(cmCode, sec);
      inner = posts.length
        ? byNewest(posts).map(({ p, i }) => postCard(sec, p, i)).join('')
        : `<p class="v-none">${T().noPosts}</p>`;
    }
    /* المحتوى مباشرة بلا صندوق حاوٍ — النافذة نفسها هي الإطار (تسطيح بطاقة-داخل-بطاقة) */
    $('#cm-body').innerHTML = inner;
    if (cmView.mode === 'edit') {
      if (sec === 'doc') { if (cmView.sub === 'abs') editorMount('abs'); }   /* الدكتور المحرر ذاتي الترتيب عدا الغياب */
      else editorMount(cmView.sub || sec);
    }
    document.querySelectorAll('#cm-body textarea.chipe-in').forEach(autoGrow);   /* ارتفاع حقول تحرير المادة يتبع محتواها */
    fitGradeLabels($('#cm-body'));   /* دلالات شريط الدرجة داخل الحدود */
    /* حالة أزرار الشريط الواحد: المفعّل فقط */
    document.querySelectorAll('.cm-panel .cm-tabs button[data-tab]').forEach(b =>
      b.classList.toggle('on', b.dataset.tab === cmTabSel));
    paintTabFaces(cmCode);   /* تحديث دوائر المساهمين بعد كل رسم قسم (ROADMAP-FACES) */
    /* وشريطُ التحديد ابنُ الجسم لا ابنُ ‎#cm-body‎، فلا يمحوه هذا الرسم — فيُسأل بعده:
       مغادرةُ التحرير أو التبويب تُخفيه، و‎renderCards‎ يعيد إظهاره بـ‎cxPaintSel‎ */
    if (!(cmTabSel === 'cards' && cmView.mode === 'edit')) {
      /* وصفوفُ النشر تُطلى مع الشريط: الشجرةُ بُنيت من جديد فذهبت أصنافُ التحديد معها،
         والحالُ باقيةٌ في ‎cxSel‎ — فلولا الطِّلاءُ لَبدا التحديدُ ذاهبًا وهو قائم.
         (وفي وضع التحرير يكفيه ‎renderCards‎: تُنادي ‎cxPaintSel‎ فتطلي الشجرتين) */
      if (cxSelRo) cxPaintSel(); else cxBarPaint();
    }
    /* وأسماءُ شجرة النشر تُقاس ههنا: القصُّ يُعلن عن نفسه فيها كما في شجرة التحرير،
       ولا موضعَ آخرَ تُبنى فيه (طيُّ مجلّدٍ أو وجهٍ يمرّ من هذه الدالّة نفسِها) */
    cxNameFit();
    cxRailFit();   /* وقضيبُ الرحلة يُقاس معها: طيُّ مجلّدٍ يزحزح آخرَ محطّةٍ فيطول أو يقصر */
    /* ونافذةُ الاستيراد آخِرُ من يُطلى: الصفوفُ وُلدت من جديدٍ فوسمُ التحديد ذهب معها،
       وسلّتُها باقيةٌ — فتُعاد قراءتُها عليها ويُعاد بناءُ رصيفها */
    jriAfterRender();
  }

  /* محرر رأيي لكل قسم (نفس أدوات الإدخال السابقة، تكتب في مشاركتي) */
  function editorHTML(sec) {
    const c = CM[cmCode];
    switch (sec) {
      /* («المادة» لا تمرّ من هنا: تحريرها إنلاين عبر infoEditCard — وحُذف محرّرها القديم) */
      case 'grade': return `
        <p class="cm-sec__t">${T().gradeSec}
          <span class="gmethod" id="cm-gmethod" title="${T().methodLabel}">
            <button type="button" class="gm-btn" data-m="avg">Average</button>
            <button type="button" class="gm-btn" data-m="std">Standard</button>
          </span>
        </p>
        <div class="gdist__head">
          <span class="cm-k">${T().distTitle}</span>
          <button type="button" class="cm-adddoc" id="cm-additem" title="${T().addItem}">+</button>
        </div>
        <div id="cm-gbody"></div>`;
      case 'abs': return `
        <p class="cm-sec__t">${T().absSec}</p>
        <div id="cm-abs"></div>`;
      case 'srcU': case 'srcP': {
        const label = sec === 'srcU' ? T().studySrc : T().practiceSrc;
        return `
        <p class="cm-sec__t">${label}</p>
        <div class="src-area" data-area="${sec}">
          <div class="src-head">
            <span class="cm-k">${label}</span>
            <button type="button" class="src-add src-add--p" data-area="${sec}" data-kind="p">+ ${T().primary}</button>
            <button type="button" class="src-add" data-area="${sec}" data-kind="s">+ ${T().secondary}</button>
          </div>
          <div id="cm-src-${sec}"></div>
        </div>`;
      }
      case 'lessons': return `
        <p class="cm-sec__t">${T().lessonsSec}
          <button type="button" class="cm-adddoc" id="cm-addlesson" title="${T().addLesson}">+</button>
        </p>
        <div id="cm-lessons"></div>`;
      /* «الشروح» و«البطائق» لا لوحة محرِّرٍ لهما: التحرير إنلاين داخل قائمة المساهمات
         (vidEditCard / cardEditCard) — واللوحة القديمة حُذفت */
    }
  }
  function editorMount(sec) {
    if (sec === 'grade') renderGrading();
    if (sec === 'abs') renderAbsence();
    if (sec === 'srcU' || sec === 'srcP') renderSources(sec);
    if (sec === 'videos') renderVideos();
    if (sec === 'cards') renderCards();
    if (sec === 'lessons') renderLessons();
  }

  /* محرر الدروس: صفوف — الترتيب تلقائي (1، 2، …) + مربع رقم الشابتر + مربع اسمه */
  function renderLessons() {
    const items = myPost(cmCode, 'lessons').data.items;
    $('#cm-lessons').innerHTML = items.map((x, i) => `
      <div class="lrow" data-i="${i}">
        <span class="lorder">${i + 1}</span>
        <span class="ch-group">
          <span class="ch-tag">${T().chTag}</span>
          <input class="l-in l-num" data-f="num" placeholder="${T().chNumPh}" value="${esc(x.num)}">
        </span>
        <input class="l-in l-name" data-f="name" placeholder="${T().chNamePh}" value="${esc(x.name)}">
        <button type="button" class="l-del" title="✕">✕</button>
      </div>`).join('');
  }

  /* ============================================================
     «الشروح» و«البطائق» = رزم حرة (تحول الرزم): المساهمة كومنت جسمه رزمة
     كاملة من صاحبها — بلا ربط بقوائم المواضيع. الترتيب في السوق بالأعلى ♥.
     videos.data = {vids:[{t,name,v,dur}]} · cards.data = {deck:[عقد]}
     الترحيل من نموذج المواضيع: كل موضوع يصير مجلدًا باسمه (بطائق) أو
     تتسطح فيديوهاته بترتيبها مع اسم الموضوع كعنوان احتياطي (شروح).
     ============================================================ */
  /* ============================================================
     الفيديو يسكن القرصَ لا الحال
     ============================================================
     كان الملفُّ المُلتقَط يُقرأ ‎data URL‎ ويُخزَّن في متن العقدة — أي في ‎localStorage‎.
     وحصّةُ أصل ‎file://‎ عشرةُ ميغابايتات **مشتركةٌ بين كلّ مشاريعك المحليّة**، فمقطعٌ
     مدّتُه ‎0:45‎ ابتلع ‎6.5‎ منها وحدَه وأوقف كلَّ ‎save()‎ في الموقع (انظر ‎vidToFile‎).
     وقد عولج ذلك **نقلةً** لِما كان مخزَّنًا، ولم يُعالَج **البابُ** الذي أدخله.
     فيُعالَج ههنا: الملتقَطُ لا يُقرأ متنًا أصلًا — يُكتب له **مسارٌ** على قاعدة النقلة
     نفسِها (‎assets/video/<معرّف العقدة>.<امتداد>‎)، ومعرّفُ العقدة لا اسمُ الملفّ: فلا
     تصادُمَ بين ملفّين متشابهَي الاسم، ولا اعتمادٌ على اسمٍ عربيٍّ يتبدّل ترميزُه.
     ===== ورابطُ جلسةٍ ليُجرَّب في حينه =====
     ولا سبيلَ لجافا الصفحة أن تكتب ملفًّا على القرص من أصل ‎file://‎ — فالنقلُ بيدك.
     فيُصنع للملتقَط ‎blob:‎ يعيش ما عاشت الصفحة: يُشتغّل فورًا فتُجرّب، ويُنسى عند
     الإغلاق فلا يُخزَّن منه حرف. ومتى وُضع الملفُّ في مكانه عمل المسارُ بعد ذلك أبدًا.
     ============================================================ */
  const vidBlob = new Map();   /* معرّفُ العقدة ⇦ ‎blob:‎ — حالُ جلسةٍ لا تُحفظ */
  const VID_EXT = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv',
    'video/quicktime': 'mov', 'video/x-matroska': 'mkv' };
  const vidExtOf = f => (VID_EXT[(f.type || '').toLowerCase()]
    || (f.name.split('.').pop() || 'mp4')).toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const vidPathOf = (n, f) => 'assets/video/' + n.id + '.' + vidExtOf(f);
  /* ومصدرُ التشغيل: رابطُ الجلسة إن وُجد (الملفُّ لم يُنقل بعدُ)، وإلّا المسارُ على القرص */
  const vidSrc = n => vidBlob.get(n && n.id) || assetURL(n && n.v);
  const VID_MAX = 3 * 1024 * 1024;   /* لم يعد حدًّا للخزن — الملفُّ لا يُخزَّن. باقٍ لمن يقرأ التاريخ */
  /* اسم الموضوع نصًا خامًا (غير مهرّب — للتخزين وقت الترحيل) */
  const topicPlain = x => `${T().chTag}${(x && x.num) || ''}${x && x.name ? `. ${x.name}` : ''}`;
  /* ترحيل مساهمة شروح إلى شجرة الرزمة (يمر بكل الأشكال القديمة حتى deck) */
  function migPackV(code, p) {
    const d = p.data;
    if (Array.isArray(d.deck)) { delete d.listId; delete d.vids; return d; }
    if (!Array.isArray(d.vids)) {
      if (!d.vids) {   /* الأقدم: {videos, lessonIdx} */
        d.vids = {};
        if (Array.isArray(d.videos) && d.videos.length) d.vids[d.lessonIdx || 0] = d.videos;
      }
      delete d.videos; delete d.lessonIdx;
      const list = postsOf(code, 'lessons').find(x => x.id === d.listId);
      const items = (list && list.data.items) || [];
      const flat = [];
      Object.keys(d.vids).map(Number).sort((a, b) => a - b).forEach(ti => {
        (d.vids[ti] || []).forEach(v => {
          if (!v) return;
          if (!v.name && items[ti]) v.name = topicPlain(items[ti]);
          flat.push(v);
        });
      });
      d.vids = flat;
    }
    /* مصفوفة مسطحة → عقد فيديو في شجرة */
    d.deck = (d.vids || []).filter(Boolean).map(v => ({
      id: newId(), t: 'v', vt: v.t || 'link', name: v.name || '', v: v.v || '', dur: v.dur || '', fname: v.fname || '',
    }));
    delete d.vids; delete d.listId;
    save();
    return d;
  }
  /* ترحيل مساهمة بطائق: كل موضوع كان له شجرة → مجلد باسم الموضوع */
  function migPackC(code, p) {
    const d = p.data;
    if (Array.isArray(d.deck)) { delete d.listId; return d; }
    const list = postsOf(code, 'lessons').find(x => x.id === d.listId);
    const items = (list && list.data.items) || [];
    const deck = [];
    Object.keys(d.decks || {}).map(Number).sort((a, b) => a - b).forEach(ti => {
      const ns = d.decks[ti] || [];
      if (!ns.length) return;
      deck.push({ id: newId(), t: 'f', name: items[ti] ? topicPlain(items[ti]) : `${T().chTag}${ti + 1}`, open: true, ch: ns });
    });
    d.deck = deck; delete d.decks; delete d.listId;
    save();
    return d;
  }
  const vidData = code => migPackV(code, myPost(code, 'videos'));
  /* قوائم الدروس المتاحة: مساهمات «الدروس» التي فيها دروس فعلًا + قائمتي أنا دائمًا */
  const lessonsLists = code => postsOf(code, 'lessons').filter(p => p.me || (p.data.items || []).some(x => x.num || x.name));
  const lessonLabel = (x, i) => `${x.num ? x.num + '. ' : (i + 1) + '. '}${x.name || '—'}`;
  /* نص الموضوع كسطر واحد متلاصق: «فـ12. …» عربيًا · «Ch12. …» إنجليزيًا */
  const topicText = x => `${T().chTag}${esc((x && x.num) || '')}${x && x.name ? `. ${esc(x.name)}` : ''}`;
  /* عنوان الموضوع مع «فـ» ذهبية (لمشغّل الشروح) */
  const topicHTML = x => `<span class="vp-topic"><span class="vp-fx">${T().chTag}${esc((x && x.num) || '')}.</span> ${esc((x && x.name) || '') || '—'}</span>`;
  /* شاشة تشغيل الشرح المختار: فيديو (ملف) أو زر يفتح الرابط */
  /* ============================================================
     يوتيوب داخل الموقع — إطارُ التضمين لا واجهةُ البرمجة
     ============================================================
     رابطُ يوتيوب أشكالٌ: ‎watch?v=ID‎ · ‎youtu.be/ID‎ · ‎/embed/ID‎ · ‎/shorts/ID‎ ·
     ‎/live/ID‎. والمعرّفُ فيها كلِّها أحدَ عشرَ محرفًا من ‎[A-Za-z0-9_-]‎ — فيُلتقط بواحدةٍ.
     وما ليس بيوتيوب (درايف · رابطٌ عامّ) يبقى على شاشة الرابط كما كان.
     ===== ولمَ إطارُ تضمينٍ لا ‎IFrame Player API‎ =====
     الواجهةُ تُنزَّل سكربتًا من الشبكة (‎youtube.com/iframe_api‎)، والموقعُ يعمل على
     ‎file://‎ وقد يُفتح بلا شبكةٍ سليمة — فيصير التشغيلُ رهينةَ سكربتٍ قد لا يجيء.
     والإطارُ وحدَه يُشغّل بلا سكربت. وإنّما تلزم الواجهةُ ليومَ يُبنى **سجلُّ المشاهدة**
     (‎x3Watch‎): هناك يُحتاج إلى قراءة الزمن الجاري، ولا سبيلَ إليه إلّا بها.
     ===== و‎rel=0‎ و‎modestbranding‎ =====
     الأولُ يقصر المقترحاتِ في آخر المقطع على القناة نفسِها، والثاني يُخفّف شعارَ يوتيوب.
     ولا ‎autoplay‎: المتصفّحُ يمنعه بلا تفاعل، ويُقحم صوتًا لم يُطلب.
     ============================================================ */
  const YT_RE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const ytId = u => { const m = YT_RE.exec(String(u || '')); return m ? m[1] : ''; };
  const vpMedia = v => {
    if (!v || !v.v) return `<div class="vp-empty">—</div>`;
    const yid = v.vt === 'link' ? ytId(v.v) : '';
    if (yid) return `<iframe class="vp-yt" src="https://www.youtube.com/embed/${yid}?rel=0&modestbranding=1"
      title="${esc(v.name || '')}" frameborder="0" referrerpolicy="strict-origin-when-cross-origin"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen></iframe>`;
    /* و‎assetURL‎ ههنا كما في الأغلفة: تُصحّح المسارَ النسبيّ (‎assets/video/…‎) نسبةً إلى
       مجلد الموقع لا إلى الصفحة المضيفة، ولا تمسّ ‎data:‎ ولا ‎http:‎ ولا المطلق */
    /* ===== وجنسُ الشرح في ‎vt‎ لا في ‎t‎ =====
       ‏‎t‎ جنسُ **العقدة** في الشجرة (‎'v'‎ للشرح · ‎'f'‎ للمجلّد)، و‎vt‎ جنسُ الشرح نفسِه
       (ملفٌّ أو رابط). وكانت تسأل ‎t === 'file'‎ — وهو لا يصدق أبدًا، فكلُّ شرحٍ يقع في
       فرع الرابط ولو كان ملفًّا. ولم يظهر لأنّ الدالّةَ لم تُنادَ من موضعٍ واحدٍ حتى اليوم */
    return v.vt !== 'link'
      ? `<video class="vp-video" src="${vidSrc(v)}" controls preload="metadata"></video>`
      : `<a class="vp-linkscreen" href="${esc(v.v)}" target="_blank" rel="noopener"><span class="vp-bigplay">▶</span><span>${T().openLink} ↗</span></a>`;
  };
  const listLabel = p => { const n = (p.data.items || []).length; return `${(p.me ? state.profile.name : (p.u && p.u.name)) || T().meName}${n ? ` (${n})` : ''}`; };

  /* محرر «الشروح» (شجرة رزمة): فيديوهات ومجلدات متداخلة — كمحرر البطائق */
  /* ---------- مجموعة الإضافة: «الحبّة النامية» ----------
     مِقبضٌ واحد (＋) في الشريط، فإن ضُغط تمدّدت الحبّة يمينًا وكشفت أنواع الإضافة، ويصير المقبض (−).
     ولمَ (−) لا (✕)؟ لأن ✕ حذف المساهمة ملاصقٌ للمجموعة، وشكلان متطابقان لمعنيين متضادّين لبس.
     في RTL أوّلُ ابنٍ هو الأيمن: فالأنواع تسبق المقبض في الترتيب، ينمو الصندوق يمينًا والمقبض لا يتزحزح */
  const FX_IC = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  };
  const addGroup = (btns, pid) => `<div class="cx-add"${pid ? ` data-pid="${pid}"` : ''}>
    <span class="cx-items">${btns.map((b, i) => b.replace('<button', `<button style="--i:${i}"`)).join('')}</span>
    <button type="button" class="cx-tg" title="${T().fxOpen}">
      <span class="g g-plus">${FX_IC.plus}</span><span class="g g-min">${FX_IC.minus}</span>
    </button>
  </div>`;
  /* ============================================================
     مِقبضُ الحبّة النامية: يفتح أنواعَ الإضافة ويطويها
     ============================================================
     بلا إعادة رسمٍ كي لا تنقطع الحركة. وتبقى مفتوحةً بعد الإضافة عمدًا: إضافةُ عدّة
     بنودٍ تباعًا هي الحال الغالبة.

     ===== وكان مربوطًا بـ‎.cm-panel‎ فلم يبلغ الرَّكن =====
     مسكنُه الأوّلُ مستمعُ ‎$('.cm-panel')‎ — لوحةُ نافذة المادّة. ولمّا وُضعت حبّةٌ في
     «رحلتي» (‎#nook‎ داخل ‎#lib-course‎، وهو خارج تلك اللوحة) لم تصل الضغطةُ إليه أصلًا:
     الحبّةُ تُضغط ولا شيءَ يقع، ورموزُها باقيةٌ على ‎max-width: 0‎ فلا تُرى ولا تُنقر.
     ولا يصيح لهذا فاحص: مستمعٌ صحيحٌ في حاضنٍ لا يشمل الجديد.

     فنُقل إلى ‎document‎ حيث تسكن **أختُه** (الطيُّ بنقرةٍ خارجها) — تعريفٌ واحدٌ يخدم
     الحبّتين، ولا ثانيةَ تُكتب في الرَّكن. والترتيبُ لازم: المِقبضُ أوّلًا ثمّ حارسُ
     «النقرةُ داخل الحبّة لا تطويها» — إذ المِقبضُ نفسُه داخلها، فلو سبقه الحارسُ
     لَابتلع ضغطتَه */
  document.addEventListener('click', e => {
    const fxt = e.target.closest('.cx-tg');
    if (fxt) {
      const g = fxt.closest('.cx-add'), open = !g.classList.contains('on');
      document.querySelectorAll('.cx-add.on').forEach(x => x.classList.remove('on'));
      g.classList.toggle('on', open);
      fxt.title = open ? T().fxClose : T().fxOpen;
      return;
    }
    /* الحبّة تنطوي بنقرةٍ خارجها — كسائر اللوحات المؤقّتة في الموقع */
    if (e.target.closest('.cx-add')) return;
    document.querySelectorAll('.cx-add.on').forEach(x => x.classList.remove('on'));
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.cx-add.on').forEach(x => x.classList.remove('on'));
  });
  const vtAddBtns = pid => addGroup([
    `<button type="button" class="vt-addv" data-kind="file" title="${T().vidAddFile}">${PK_IC.vid}</button>`,
    `<button type="button" class="vt-addv" data-kind="link" title="${T().vidAddLink}">${PK_IC.link}</button>`,
    `<button type="button" class="cx-addf" title="${T().cxAddFolder}">${PK_IC.folder}</button>`,
  ], pid);
  /* ============================================================
     ترتيب شجرة التحرير بالسحب — مبنيّ على خوارزمية أشجار dnd-kit وقواعد السحب المستقرّة:
     · أحداث المؤشّر لا HTML5 DnD (تعمل باللمس، وشبحُ السحب تحت أيدينا لا صورة المتصفح).
     · عتبة ٥px قبل بدء السحب فلا تتحوّل النقرة سحبًا.
     · الحساب على قائمة مسطّحة لا على DOM: الرأسيّ يحدّد موقع الإدراج والأفقيّ يحدّد الدرجة.
     · مؤشّر واحد لا ثلاثة: خطٌّ موضعه يقول «أين» وإزاحته تقول «في أي مستوى».
     · الدرجة محصورة بين ما يسمح به الجاران، فلا تنشأ حالة مستحيلة أصلًا.
     ============================================================ */
  /* ===== المقبض: نقاطٌ تُسحب، وصحٌّ حين تُحدَّد =====
     كان حرفًا نصّيًّا (‎⠿‎) — والحرفُ لا يُمسخ صحًّا، فصار رسمين في غلافٍ واحد يتبادلان
     بالصنف. ورسمُ النقاط بقياس الحرف نفسِه فلا يتزحزح صفٌّ واحد.
     و‎sel‎ يميّز مقبضَ «البطائق»: هو وحدَه يحمل الفعل الثاني، فتبقى شجرةُ «الشروح» كما كانت */
  const GRAB_DOTS = '<svg class="vg-off" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">'
    + '<circle cx="5.6" cy="3.7" r="1.35"/><circle cx="10.4" cy="3.7" r="1.35"/>'
    + '<circle cx="5.6" cy="8" r="1.35"/><circle cx="10.4" cy="8" r="1.35"/>'
    + '<circle cx="5.6" cy="12.3" r="1.35"/><circle cx="10.4" cy="12.3" r="1.35"/></svg>';
  const GRAB_CHECK = '<svg class="vg-on" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.7 8.3 6.6 11.2 12.3 4.9"/></svg>';
  /* دالة لا ثابت: التلميح يتبع اللغة الحالية، ولو حُسب مرّة لتجمّد على لغة التحميل */
  const VT_GRAB = sel => sel
    ? `<span class="vt-grab vt-grab--sel" title="${esc(T().vtDragSel)}">${GRAB_DOTS}${GRAB_CHECK}</span>`
    : `<span class="vt-grab" title="${esc(T().vtDrag)}">${GRAB_DOTS}</span>`;
  /* ===== وحبّةُ النشر مربّعٌ لا نقاط =====
     نقاطُ التحرير مِقبضُ سحبٍ قبل أن تكون حبّةَ تحديد، وليس في النشر سحبٌ يُوعَد به —
     فرسمُها ههنا **مربّعٌ خاوٍ** يقول «يُحدَّد» ولا يقول «يُسحب»، ويمتلئ صحًّا إذا حُدِّد.
     وهي ‎button‎ لا ‎span‎: ليس لها في النشر إلّا فعلٌ واحدٌ يُضغط، فتبلغها لوحةُ المفاتيح
     ويُقرأ حالُها في ‎aria-pressed‎. وقدُّها قدُّ أختها (‎15px‎) فتقع في عمودها سواءً */
  /* والصحُّ مرسومٌ في المربّع قبل أن يُضغط — شبحٌ يقول ما سيقع، لا مربّعٌ خاوٍ يسكت.
     وهو مسارٌ ثانٍ في الرسم نفسِه (‎vg-tick‎) لا رسمٌ ثالثٌ يُبدَّل: حبرُه وحدَه يشتدّ */
  const RO_BOX = '<svg class="vg-off" viewBox="0 0 16 16" fill="none" stroke="currentColor"'
    + ' stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<rect x="2.7" y="2.7" width="10.6" height="10.6" rx="3.2"/>'
    + '<path class="vg-tick" d="M5.6 8.15 7.4 9.95 10.5 6.15"/></svg>';
  const RO_GRAB = id => `<button type="button" class="vt-grab vt-grab--sel vt-grab--ro"`
    + ` data-rosel="${id}" title="${esc(T().vtSelRo)}" aria-label="${esc(T().vtSelRo)}"`
    + ` aria-pressed="${cxSelRo && cxSel.has(id) ? 'true' : 'false'}">${RO_BOX}${GRAB_CHECK}</button>`;
  /* ===== التحديد: حالُ جلسةٍ لا حالٌ محفوظة =====
     من حدّد ثلاثًا فإنّما يريد فعلًا الآن (نقلًا أو حذفًا)، ولا معنى لأن يجد تحديدَه
     بعد إغلاق المادة وفتحها غدًا. فهو ‎Set‎ في الذاكرة يُمسح مع تبديل المادة */
  const cxSel = new Set();
  /* ===== وأين يقع التحديد: في شجرة التحرير أم في شجرة النشر؟ =====
     الشجرتان تُعرضان معًا (مساهمتي مفتوحةً للتحرير، ورزمةُ زميلي مفتوحةً للقراءة)،
     والتحديدُ **واحدٌ لا اثنان**: من حدَّد في إحداهما رُفع تحديدُه من الأخرى — إذ الشريطُ
     في أسفل الشاشة واحدٌ لا يسع خبرين، ومزجُ عقدٍ من ديكين يجعل العدَّ كذبًا.
     و‎cxSelRo‎ يقول أيَّهما يملكه الآن، ومنه يُعرف الديكُ الذي تُقرأ عليه الأنسابُ
     والأوراقُ والمجلدات — فلو قُرئت على غير ديكها لَعُدَّ ما ليس فيها */
  let cxSelRo = false;
  /* ===== وشجرةُ «رحلتي» ديكٌ ثالثٌ للتحديد =====
     كان التحديدُ يقع في شجرتين: شجرةِ التحرير (‎edPack().deck‎) وشجرةِ النشر
     (‎cardView.open‎ في مساهمات المادّة). وصارت «رحلتي» ثالثةً — وتحديدُها تحديدُ
     **نشرٍ** لا تحرير (مقبضٌ يُضغط ولا يُسحب، ولا سلّةَ جمعيّةَ فيه)، فتلبس ‎cxSelRo‎
     وتُفرَّق عن أختها بوسمٍ واحد. فلا حالَ ثالثةٌ تُصان، والسؤالُ ههنا وحدَه */
  let cxRoadSel = false;
  const cxRoDeck = () => {
    if (cxRoadSel) return roadOf(nookEntry);
    if (!cardView.open) return null;
    const p = postsOf(cmCode, 'cards').find(x => x.id === cardView.open);
    return p && Array.isArray(p.data.deck) ? p.data.deck : null;
  };
  const cxDeck = () => (cxSelRo ? cxRoDeck() : edPack().deck) || [];
  /* والتبديلُ يقع على الصفّ وحدَه لا بإعادة رسم الشجرة: الشجرةُ فيها حقولٌ مفتوحةٌ
     تحت يد الكاتب، وإعادةُ رسمها تخطف المؤشّرَ من كلمةٍ لم تتمّ */
  /* ===== والتحديدُ يجري في الشجرة لا في الصفّ =====
     المجلدُ ظرفٌ لا بندٌ بجانب بنوده: تحديدُه تحديدٌ لما فيه كلِّه — وإن كان مطويًّا،
     فالمطويُّ موجودٌ وإن لم يُرَ. ورفعُ التحديد عن بندٍ في جوفه يرفعه عن **آبائه** جميعًا
     (لم يعودوا محدَّدين بتمامهم) ويُبقي إخوتَه على حالهم: «كلُّ ما في المجلد» خبرٌ صار كذبًا،
     أمّا الإخوةُ فما مسّهم شيء.
     وثمرةُ ذلك أنّ ‎cxSel‎ لم يعد صفًّا مستقلًّا بل صورةٌ من الشجرة، فلا يُطلى صفٌّ واحدٌ
     بعد التبديل بل تُعاد قراءةُ الصفوف كلِّها (‎cxPaintSel‎) — وهو طلاءٌ لا إعادةَ رسم،
     فالحقولُ المفتوحةُ تحت يد الكاتب لا تُمَسّ */
  const cxKids = n => [n.id].concat((n.ch || []).flatMap(cxKids));
  /* سلسلةُ آباء العقدة من الجذر إليها — تُقرأ منها «أمحدَّدٌ أبوه؟» */
  function cxTrail(nodes, id, up) {
    up = up || [];
    for (const n of nodes || []) {
      if (n.id === id) return up;
      if (n.t === 'f') { const r = cxTrail(n.ch, id, up.concat(n.id)); if (r) return r; }
    }
    return null;
  }
  /* «رأسُ تحديد»: محدَّدٌ لا محدَّدَ فوقه — فالمجلدُ وذرّيتُه وحدةٌ واحدةٌ تُعدّ مرّة */
  const cxIsRoot = (deck, id) => !(cxTrail(deck, id) || []).some(a => cxSel.has(a));
  const cxRoots = deck => [...cxSel].filter(id => cxIsRoot(deck, id));
  /* ===== ومِرساةُ المدى: آخرُ ما حُدِّد بيدك =====
     ‏‎shift‎ لا معنى له بلا طرفٍ أوّل، فيُقيَّد كلُّ تحديدٍ **مُثبِت** ليكون مِرساةَ الذي
     بعده. ورفعُ التحديد يمحوها: من نزع لم يُثبت طرفًا.
     وتُمحى كذلك عند الانتقال بين الشجرتين — كما يُمحى التحديدُ نفسُه */
  let cxAnchor = '';
  function cxToggleSel(id, ro, shift) {
    /* والانتقالُ بين الشجرتين يمسح: تحديدٌ في هذه ليس تحديدًا في تلك */
    if (!!ro !== cxSelRo) { cxSel.clear(); cxSelRo = !!ro; cxAnchor = ''; }
    const deck = cxDeck(), r = findNode(deck, id);
    /* ===== مدًى بين طرفين — وشرطُه أن يكونا إخوة =====
       «بنفس مستواه» بحكم صاحب الموقع. و‎findNode‎ تردّ ‎{arr, i, n}‎، فالأخوّةُ تُقاس
       بالمصفوفة نفسِها (‎a.arr === b.arr‎) لا بعمقٍ يُحسب — عمقان متساويان في مجلّدين
       مختلفين ليسا مدًى.
       وما بينهما **يُضاف ولا يُقلَب**: المدى فعلُ جمعٍ لا فعلُ تبديل، فمن كان محدَّدًا
       يبقى. والمجلّدُ في المدى يدخل بذرّيته (‎cxKids‎) كما يدخل بالضغطة المفردة.
       وإن لم يكونا إخوةً فالضغطةُ ضغطةٌ عاديّةٌ تُبدّل — لا تُردّ في وجه صاحبها */
    if (shift && cxAnchor && cxAnchor !== id && r) {
      const a = findNode(deck, cxAnchor);
      if (a && a.arr === r.arr) {
        const lo = Math.min(a.i, r.i), hi = Math.max(a.i, r.i);
        for (let i = lo; i <= hi; i++) {
          const n = a.arr[i];
          (n.t === 'f' ? cxKids(n) : [n.id]).forEach(x => cxSel.add(x));
        }
        cxAnchor = id;
        cxPaintSel();
        return;
      }
    }
    const on = !cxSel.has(id);
    (r && r.n.t === 'f' ? cxKids(r.n) : [id]).forEach(x => on ? cxSel.add(x) : cxSel.delete(x));
    if (!on) (cxTrail(deck, id) || []).forEach(a => cxSel.delete(a));
    cxAnchor = on ? id : '';
    cxPaintSel();
  }
  function cxPaintSel() {
    const deck = cxDeck();
    /* وشجرتا التحرير تُطليان معًا: ‎#cm-cards‎ و‎#cm-videos‎ — والمعروضُ منهما واحدةٌ
       في كلّ لحظة (لسانٌ واحدٌ مفتوح)، فالسؤالُ عن الأخرى يردّ لا شيء بلا كلفة */
    const host = document.getElementById('cm-cards') || document.getElementById('cm-videos');
    if (host) host.querySelectorAll('.cx-row[data-id], .x3-hd[data-id], .vid-row[data-id]').forEach(el => {
      const on = !cxSelRo && cxSel.has(el.dataset.id);
      el.classList.toggle('is-sel', on);
      el.classList.toggle('is-selroot', on && cxIsRoot(deck, el.dataset.id));
    });
    /* وصفوفُ النشر تُطلى كذلك — وبلا ‎is-selroot‎: تلك تكشف سلّةَ الصفّ، ولا حذفَ ههنا.
       ومِفتاحُها ‎data-roid‎ لا ‎data-id‎: هذا الأخيرُ تلتقطه معالجاتُ المحرّر (الاسمُ
       والوجهُ والسلّة) فلو أُعير للنشر لَبلغته أفعالٌ ليست له */
    /* وصفوفُ «رحلتي» تُطلى مع صفوف النشر: المفتاحُ واحدٌ (‎data-roid‎) والحكمُ واحد */
    document.querySelectorAll('.x3.cx-ro [data-roid], #nk-road [data-roid]').forEach(el => {
      if (el.closest('#jri-body')) return;   /* صفوفُ نافذة الاستيراد سلّتُها ‎jriBag‎ */
      const on = cxSelRo && cxSel.has(el.dataset.roid);
      el.classList.toggle('is-sel', on);
      /* ===== ورأسُ التحديد يُوسم في «رحلتي» =====
         كان ‎is-selroot‎ لفرع المحرّر وحدَه، وحجّتُه: «صفوفُ النشر تُطلى ‎is-sel‎ فقط —
         تلك تكشف سلّةَ الصفّ ولا حذفَ في النشر». وهي صادقةٌ في النشر، وشجرةُ «رحلتي»
         **دفترُك يُحذف منه** — فتحتاج ما تحتاجه شجرةُ المحرّر.
         وبه تُصلح السلّةُ عطبَين معًا:
           · تحديدُ مجلّدٍ كان يُظهر سلّةً على **كلّ** بندٍ في جوفه (‎cxKids‎ تُحدّدهم
             جميعًا) — وهي سلالٌ لا تُقصد، والمقصودُ رأسُها وحدَه.
           · ورفعُها عند التعدّد (‎is-multi‎) كان يُخفيها عن الجميع، فيبقى المحدَّدون
             بلا سلّةٍ في الصفّ. والعلّةُ كانت «سلّةٌ على أحدهم تكذب» — وهي تسقط متى
             وقعت السلّةُ على **رأسٍ**: رأسٌ واحدٌ سلّتُه له وحدَه، فلا لبس. */
      el.classList.toggle('is-selroot', on && cxIsRoot(deck, el.dataset.roid));
      const b = el.querySelector('.vt-grab--ro');
      if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    cxSelSync(deck);
  }
  /* ===== السلّةُ لا تظهر إلا على المحدَّد وحدَه =====
     الحذفُ فعلٌ على **بندٍ بعينه**، فسلّتُه تظهر حين يُقصد هو: يُحدَّد فتظهر عليه وحده.
     فإذا صار المحدَّدون اثنين فأكثر رُفعت عن الجميع — لأنّ سلّةً على أحدهم حينئذٍ تكذب:
     لا يُدرى أتحذفه وحدَه أم تحذف المحدَّدين كلَّهم، والفعلُ الجمعيّ لم يُبنَ بعد.
     والعدُّ **عدُّ رؤوسٍ لا عدُّ عقد**: المجلدُ وذرّيتُه شيءٌ واحدٌ حُدِّد بضغطةٍ واحدة،
     فلو عُدَّت عقدُه لَغاب حذفُ المجلد أبدًا — يُحدَّد فيصير المحدَّدون ستّةً فتُرفع السلّة.
     والعدُّ لا يُقرأ في CSS، فيُعلَّق على الشجرة صنفٌ يقول «الرؤوس أكثر من واحد»،
     والسلّةُ تُشترط على الرأس (‎is-selroot‎) لا على كلّ محدَّد — وإلّا ظهرت على كلّ ورقةٍ
     في المجلد المحدَّد. ولمَ لا يُعاد الرسم؟ في الشجرة حقولٌ تحت يد الكاتب */
  function cxSelSync(deck) {
    /* والشجرةُ المسؤولةُ هي التي يملكها التحديد: إن غابت فقد غاب موضعُه —
       فيُمسح ولا يُترك شريطٌ معلّقٌ يخبر عن شجرةٍ ليست على الشاشة */
    /* ===== وشجرةُ التحرير اثنتان لا واحدة =====
       ‏‎#cm-cards .cx-tree‎ للبطائق، و‎#cm-videos .x3‎ للشروح (ولا ‎cx-tree‎ فيها: ذاك
       صنفُ حكم السلّة في البطائق). ولو لم تُذكر الثانيةُ لَقيل «غابت الشجرة» فمُحي
       التحديدُ في أوّل مزامنة — أي في أوّل ضغطةٍ على مقبض */
    const tree = cxSelRo
      ? document.querySelector(cxRoadSel ? '#nk-road .x3' : '.x3.cx-ro')
      : (document.querySelector('#cm-cards .cx-tree') || document.querySelector('#cm-videos .x3'));
    /* ===== وغيابُ الشجرة غيابان: مغادرةٌ وعارض =====
       الحكمُ القديم: «إن غابت الشجرةُ فقد غاب موضعُ التحديد فيُمسح». وهو صوابٌ لمن
       **غادر** — تبديلُ تبويبٍ أو خروجٌ من الرزمة.
       وخطؤه أنّ الشجرةَ تغيب **عارضًا** كذلك: كلُّ إجابةٍ في الاختبار تُعيد رسمَ القسم
       (‎xtLive‎)، ويجيء بعده رسمٌ مؤجَّلٌ (‎cdEdSoon‎) فيسأل عن الشجرة في لحظةٍ لم تُبنَ
       فيها بعد — فيُمحى التحديدُ ويُخفى الشريط، ثمّ يعود مع الرسم التالي. وهو الوميضُ
       الذي يُرى: «تختفي وترجع».
       فيُفرَّق بينهما بما **لا يتبدّل بالرسم**: أما زلتَ في لسان البطائق وعلى رزمةٍ
       مفتوحة (أو في محرّرها)؟ فإن كان فالغيابُ عارضٌ ولا يُمَسّ شيء — لا التحديدُ
       يُمحى ولا الشريطُ يُخفى — ويصحّح نفسَه في الرسمة التالية */
    if (!tree) {
      /* وغيابُ شجرة الرحلة كغياب أختها: ما دام الرَّكنُ مفتوحًا فالغيابُ عارضٌ */
      const still = cxRoadSel ? !!nookEntry
        : (cmTabSel === 'videos' ? cmView.mode === 'edit'
          : (cmTabSel === 'cards'
            && (cxSelRo ? !!(cardView && cardView.open) : cmView.mode === 'edit')));
      if (still) return;
      cxSel.clear(); cxSelRo = false; cxBarPaint(); return;
    }
    const d = deck || cxDeck();
    tree.classList.toggle('is-multi', cxRoots(d).length > 1);
    cxBarPaint(d);
  }

  /* ============================================================
     شريط التحديد (ROADMAP-SELBAR — اتّجاه أ «الحبّة»)
     ============================================================
     ما دام في الشجرة محدَّدٌ ظهر شريطٌ سفليٌّ ثابت: عددُ البطائق، ثمّ ملخّصُها، ثمّ حذفُها،
     ثمّ رفعُ التحديد. وهو موضعُ **الفعل الجمعيّ** الذي كان ناقصًا: كانت السلّةُ تُرفع عند
     تعدّد الرؤوس (‎is-multi‎) لأنّ سلّةً على أحدهم تكذب — فصار للجمع أداتُه، وبقيت سلّةُ
     الصفّ للواحد المحدَّد وحده كما هي.
     والعدُّ **عدُّ أوراقٍ لا عدُّ رؤوس**: «٤٢ بطاقة» هو ما سُئل عنه، لا «٣ عناصر».
     والمجلداتُ تُذكر معه لأنّ الفرق بينهما هو الفرقُ بين ما يُحذف وما يُعدّ. */
  const cxLeaves = n => n.t === 'f' ? (n.ch || []).flatMap(cxLeaves) : [n];
  /* أوراقُ التحديد: تُجمع من الرؤوس فلا تُعدّ ورقةٌ مرّتين وإن حُدِّد أبوها وهي */
  const cxSelLeaves = deck => cxRoots(deck)
    .map(id => findNode(deck, id)).filter(Boolean)
    .flatMap(r => cxLeaves(r.n));
  /* ومجلداتُ التحديد تُعدّ في العمق كما تُعدّ الأوراق: تحديدُ مجلدٍ تحديدٌ لما فيه،
     فلو عُدَّ رأسًا واحدًا لقال الشريطُ «مجلدٌ واحد» عمّن حدَّد مجلدًا في جوفه خمسة —
     وهو خبرٌ يكذب عمّا سيقع بالحذف. فالمجلدُ يُعدّ هو وذرّيّتُه من المجلدات */
  const cxFolders = n => n.t === 'f' ? [n].concat((n.ch || []).flatMap(cxFolders)) : [];
  const cxSelFolders = deck => cxRoots(deck)
    .map(id => findNode(deck, id)).filter(Boolean)
    .flatMap(r => cxFolders(r.n)).length;
  /* ===== وما يُحذف من تحديد «رحلتي»: رؤوسٌ لا عقد =====
     رأسٌ تملكه يُطرح، والفصلُ (‎tp: 1‎) يُفرَّغ ولا يُطرح — فهو مرآةُ موضوعٍ في «المادة»
     تُعيده ‎roadSync‎ في الرسمة التالية، وحذفُه كذبةٌ تدوم لحظة. فإن كان خاويًا فليس
     فيه ما يُحذف أصلًا فيسقط من الخطّة.
     وتُردُّ **معرّفاتٌ لا عقد**: الطرحُ يزحزح فهارسَ الإخوة، فتُسأل ‎findNode‎ لكلّ رأسٍ
     من جديدٍ عند التنفيذ — وهو حكمُ الحذف الجمعيّ في المحرّر نفسُه */
  const roadDelPlan = deck => cxRoots(deck).filter(id => {
    const r = findNode(deck, id);
    return !!r && (r.n.tp !== 1 || (r.n.ch || []).length > 0);
  });

  const CX_BAR_IC = {
    sum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3.5" width="16" height="17" rx="2.4"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
    /* «اختبر نفسك» — المختارُ من ‎exam-icon-lab#f4‎: قطاعُ العدّ. ورُدّ مثلّثُ البدء لأنّه
       لغةُ **المشاهدة**: يقول «شغِّل» ولا يقول «سيُسألُ عنك». والقطاعُ يقول «تقدُّمٌ يُقاس» */
    test: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.2"/><path d="M12 12V3.6a8.4 8.4 0 0 1 7.3 12.6z" fill="currentColor" stroke="none"/></svg>',
    /* ===== «اختبر هذه الرزمة» — رُفع رسمُه، وصار كلمةً على مفتاح =====
       كان مثلّثَ تشغيلٍ مصمتًا ذهبيًّا. وعلّتُه أنّه وقع في شجرةٍ **معجمُها مقرَّر**:
       ‏‎CX_TRI‎ مثلّثُ الطيّ يقف في صدر كلّ صفٍّ تحته، مصمتًا مستديرَ الوصل، **ذهبيًّا**
       على البطاقة ذات الأوجه، قدُّه ‎13.5‎ وقدُّ الزرّ ‎13‎ — والفرقُ **الجهةُ وحدَها**،
       وهي تنقلب مع اللسان فيلتقيان. فكانا صورتين في مرآة.
       وقاعدةُ الشجرة مكتوبةٌ في ‎styles.css‎ عند ‎.cx-fold--tri‎: «**المثلّثُ مِفصلٌ لا فعل**».
       فزرُّ الاختبار فعلٌ، فلا يجوز أن يكون مثلّثًا ههنا مهما اختلفت جهتُه.
       والعلاجُ حرفٌ لا رسم — والحرفُ لا يُقرأ مِفصلًا أبدًا. ثمّ لُبِّس مفتاحًا لأنّه في
       السكون كان يُقرأ عنوانًا صغيرًا لا شيئًا يُنقر.
       فلا رسمَ ههنا بعد اليوم: البناءُ في ‎x3PkHead‎ واللفظُ ‎T().pkGo‎ والجلدُ
       ‎.x3-pkhd > .cx-pktest‎. والسجلُّ في ‎ROADMAP-PKTEST-ICON.md‎ */
    /* «شارك الرابط» — حلقتا سلسلة: أشهرُ رمزٍ للرابط ولا يلتبس بشيءٍ في الشريط */
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.4 13.6a4.6 4.6 0 0 0 6.9.5l2.8-2.8a4.6 4.6 0 0 0-6.5-6.5l-1.6 1.6"/><path d="M13.6 10.4a4.6 4.6 0 0 0-6.9-.5l-2.8 2.8a4.6 4.6 0 0 0 6.5 6.5l1.6-1.6"/></svg>',
  };
  /* ===== وبصمةُ الشريط تُحفظ عندنا لا تُقرأ من الصفحة =====
     جُرّبت المقارنةُ بـ‎bar.innerHTML‎ فلم تُصب أبدًا: ما يُقرأ من العنصر ليس نصَّك بل
     **سَردَ المتصفّح للشجرة** — يُعيد ترتيبَ السمات ويُطبّع الفراغَ ويفكّ الكيانات.
     فالنصّان لا يتطابقان وإن كان الشيءُ واحدًا، فيُعاد البناءُ في كلّ مرّة.
     فتُحفظ البصمةُ في متغيّرٍ عندنا: نصُّنا يُقارن بنصِّنا */
  let cxBarSig = '';
  function cxBarPaint(deck) {
    const bar = $('#cx-selbar');
    if (!bar) return;
    const live = cxRoadSel
      ? document.querySelector('#nk-road .x3')
      : (cmTabSel === 'cards' && (cxSelRo
        ? document.querySelector('.x3.cx-ro')
        : cmView.mode === 'edit' && document.querySelector('#cm-cards .cx-tree')));
    const off = () => { if (!bar.hidden) { bar.hidden = true; bar.innerHTML = ''; cxBarSig = ''; } };
    if (!live || !cxSel.size) { off(); return; }
    const d = deck || cxDeck();
    const nc = cxSelLeaves(d).length, nf = cxSelFolders(d);
    if (!nc && !nf) { off(); return; }
    bar.hidden = false;
    /* عدّادان بأيقونتيهما ثمّ الفعلان، يفصل بينهما خيط. والأيقونتان أيقونتا الموقع نفسِه
       (‎PK_IC‎) لا رسمًا خاصًّا بالشريط — فالمجلدُ مجلدٌ والرزمةُ رزمةٌ أينما وقعت.
       ولا نصَّ مع الرقم: الأيقونةُ تقول ما هو، والعددُ يقول كم — واللفظُ تكرارٌ لهما.
       والمعنى يبقى مقروءًا لقارئ الشاشة في ‎title/aria-label‎ */
    const cnt = (ic, n, lab) => `<span class="cx-selbar__c" title="${esc(lab)}" aria-label="${esc(lab)}">
      <i>${ic}</i><b>${n}</b></span>`;
    /* و«إلغاء التحديد» **كلمةٌ لا زرّ**: بين الخبر والفعل، ذهبيّةً بلا مستطيلٍ يحويها.
       ولمَ الكلمةُ دون ✕؟ لأنّ الشريط يغيب إذا خلا التحديد، فـ✕ ههنا تُقرأ «أغلق الشريط»
       لا «ألغِ التحديد» — واللفظُ يقطع اللبس. ولمَ في الوسط؟ ليبعُد عن السلّة:
       تلك تُتلف وهذه تُلغي، ومجاورتُهما تجعل خطأَ إصبعٍ واحدٍ يفصل بينهما */
    /* ===== ثلاثةُ أجناسٍ وفواصلُها (‎selbar-action-lab#s4‎) =====
       كانت الأفعالُ أيقوناتٍ عاريةً بحبر «إلغاء التحديد» نفسِه — فلا يُعرف من نظرةٍ ما
       الفعلُ الذي يُراد بك. فلبس كلُّ فعلٍ اسمَه، والبنيةُ صارت **بالخيوط لا بالأوعية**:
       خبرٌ ǀ رفعُ الحال ǀ ما لك (ذاكر · اختبر) ǀ ما لغيرك (شارك) ǀ إتلافٌ (السلّة).
       و«شارك الرابط» يخرج من عنقود الأفعال بخيطٍ خاصّ: هو فعلٌ **لغيرك** والاثنان قبله
       فعلان **عليك**، والقسمةُ بالجنس لا تصحّ وهي في وعاءٍ واحد.

       ===== وأفعالُ كلّ وضعٍ بحسب مالكه =====
       في **التحرير** أنت صاحبُ الرزمة: تُلخّص وتحذف — ولا اختبارَ ولا مشاركة.
       وفي **النشر** أنت قارئُها: تُلخّص وتختبر وتشارك — ولا حذفَ لعمل غيرك.
       فالوضعان لا يشتركان في فعلٍ إلّا الملخّص، ولا يُرسم فعلٌ لا يملكه صاحبُه */
    const act = (k, ic, lab, cls, soon) => `<button type="button" class="cx-selbar__b${cls || ''}"${soon
      ? ` disabled title="${esc(soon)}" aria-label="${esc(soon)}"`
      : ` data-cxbar="${k}" title="${esc(lab)}" aria-label="${esc(lab)}"`}>${ic}<em>${esc(lab)}</em></button>`;
    /* ===== ولا يُعاد بناؤه إلّا إذا تبدّل خبرُه =====
       ‏‎.cx-selbar__body‎ عليها حركةُ دخول (‎cxbar-in‎)، والحركةُ تُعاد **بميلاد العنصر**
       لا بتبدّل قيمة. فكلُّ كتابةٍ لـ‎innerHTML‎ تلد جسمًا جديدًا فتُعاد الحركة — والشريطُ
       يومض «يختفي ثمّ يرجع» وإن لم يتبدّل فيه حرف.
       وهذا يقع في كلّ إجابةٍ في الاختبار: الحكمُ يكتب في السجلّ ثمّ يُعيد رسمَ القسم
       (‎xtLive‎) ليظهر مربّعُ الإجابة في الشجرة خلفه — والشريطُ يُطلى مع كلّ رسم.
       فيُقارَن المبنيُّ بالقائم، ولا يُكتب إلّا عند الفرق: يُولد مرّةً حين يظهر التحديد،
       ثمّ يبقى حيًّا ما بقي على حاله */
    const html = `<div class="cx-selbar__body">
      ${cnt(PK_IC.folder, nf, T().cxBarNF(nf))}
      ${cnt(PK_IC.card, nc, T().cxBarNC(nc))}
      <span class="cx-selbar__sep"></span>
      <button type="button" class="cx-selbar__clear" data-cxbar="clear">${esc(T().cxBarClear)}</button>
      <span class="cx-selbar__sep"></span>
      <span class="cx-selbar__acts">
        ${act('sum', CX_BAR_IC.sum, T().cxBarSum, ' cx-selbar__b--act cx-selbar__b--pri')}
        ${cxSelRo ? act('test', CX_BAR_IC.test, T().cxBarTest, ' cx-selbar__b--act cx-selbar__b--pri') : ''}
      </span>
      <!-- و«شارك الرابط» يسقط في «رحلتي»: الرابطُ يطوي **معرّفَ مساهمةٍ** ورؤوسَ
           تحديدٍ فيها (‎xlCompose‎)، ودفترُك ليس مساهمةً — فيصير رابطًا لا يفتح شيئًا -->
      ${(cxSelRo && !cxRoadSel) ? `<span class="cx-selbar__sep"></span>
      ${act('link', CX_BAR_IC.link, T().cxBarLink, ' cx-selbar__b--act')}` : ''}
      <!-- ===== والسلّةُ تسقط في النشر وحدَه — و«رحلتي» دفترُك =====
           الرزمةُ المنشورةُ ليست رزمتَك: العدُّ والملخّصُ قراءةٌ، أمّا الحذفُ فإتلافُ عملِ
           غيرك. و«رحلتي» تلبس ‎cxSelRo‎ لأنّ مقبضَها مقبضُ **تحديدٍ لا سحبٍ** — لا لأنّها
           لغيرك، فهي دفترُك تبنيه بيدك. فكان الحكمُ معلَّقًا على وسم التحديد فأصاب النشرَ
           وأصابها معه، وصار معلَّقًا على **المِلك**: تسقط في النشر (‎cxSelRo && !cxRoadSel‎)
           وتبقى في المحرّر وفي رحلتك.
           وههنا كان النقصُ يُرى: صفوفٌ كثيرةٌ تُحدَّد، وسلّةُ الصفّ ترتفع عند التعدّد
           (‎is-multi‎ — «سلّةٌ على أحدهم والمحدَّدون ثلاثةٌ تكذب») ولا أداةَ للجمع تخلفها.
           ===== وتخفت حين لا يكون في التحديد ما يُحذف =====
           وذلك أن يكون كلُّ ما حدَّدتَه فصولًا **خاويةً**: الفصلُ لا يُحذف من ههنا وجوفُه
           فارغٌ فلا شيءَ يُطرح — فزرٌّ يُضغط ولا يقع به شيءٌ أسوأُ من زرٍّ يقول لِمَ لا يقع.
           ولا تخفت لِمُخالطةِ فصلٍ ما دام في التحديد ما يُحذف: الفصلُ يُفرَّغ، وسائرُ
           المحدَّدين يُطرحون — وذلك هو «احذف كلَّ ما حدَّدتُه» على وجهه -->
      ${(cxSelRo && !cxRoadSel) ? '' : `<span class="cx-selbar__sep"></span>
      ${act('del', TRASH_IC, T().cxBarDel, ' cx-selbar__b--del',
        (cxRoadSel && !roadDelPlan(d).length) ? T().cxBarDelCh : '')}`}
    </div>`;
    if (cxBarSig !== html) { cxBarSig = html; bar.innerHTML = html; }
  }

  /* ============================================================
     رابطُ الاختبار — تحديدٌ يُطوى في عنوانٍ ثمّ يُنشر منه
     ============================================================
     لا خادمَ للموقع، فالرابطُ **يحمل نفسَه**: العنوانُ هو المخزن. ويحمل خمسةً لا أكثر
     — نسخةً ورمزَ المادّة ومعرّفَ الرزمة و**رؤوسَ التحديد** وعنوانًا ووصفًا.
     والرؤوسُ لا الأوراق: من حدّد مجلّدًا فيه أربعون بطاقةً يُطوى في معرّفٍ واحدٍ لا في
     أربعين — والذرّيّةُ تُستخرج عند الفتح من الشجرة نفسِها (‎cxKids‎)، وهي عينُ ما
     يفعله ‎cxToggleSel‎ حين تُحدَّد بيدك. فالرابطُ يبقى قصيرًا مهما كبر التحديد.
     و‎JSON‎ في ‎encodeURIComponent‎ لا صيغةً بفواصلَ: العنوانُ والوصفُ نصٌّ حرٌّ عربيٌّ
     قد يحمل أيَّ محرفٍ اخترناه فاصلًا.
     ===== وما لا يحمله الرابطُ لا يُختلق =====
     البطائقُ نفسُها لا تُطوى فيه: هي عند صاحبها في جهازه. فإن فُتح الرابطُ عند من لا
     رزمةَ له بهذا المعرّف قيل له ذلك صراحةً ولم يُفتح له شيءٌ فارغ. */
  const XL_V = 1;
  /* و‎n‎ اسمُ صاحب الرابط: بروفايلُ نافذة الفتح يقول **من أرسل**، ولا سبيلَ إلى
     معرفته من الرزمة (هي لصاحبها لا لمن شاركها). والصورةُ لا تُطوى في عنوان —
     فيُرسم للفاتح وجهُ الموقع الافتراضيّ (‎FLAT_AVATAR‎) كما يُرسم لكلّ من لا صورةَ له */
  const xlURL = o => location.href.split('#')[0] + '#exam='
    + encodeURIComponent(JSON.stringify({ v: XL_V, c: o.code, p: o.pid, s: o.roots,
      t: o.t || '', d: o.d || '', n: o.n || '' }));
  let xlDraft = null;
  /* ‎xlPend‎ رابطٌ ينتظر أن تسكن البِكرةُ على مادّته — تقرؤه ‎onCenter‎ في رفّ السوق */
  let xlPend = null;

  function xlEl() {
    let el = document.getElementById('xl-modal');
    if (!el) { el = document.createElement('div'); el.id = 'xl-modal'; document.body.appendChild(el); }
    return el;
  }
  function xlClose() {
    const el = document.getElementById('xl-modal');
    if (el) { el.hidden = true; el.innerHTML = ''; }
    xlDraft = null;
  }
  const xlCnt = d => `<span class="xl-cnt">${PK_IC.card}<b>${cxSelLeaves(d).length}</b>`
    + `${PK_IC.folder}<b>${cxSelFolders(d)}</b></span>`;
  /* ===== بروفايلُ الاختبار (‎xl-profile-lab#h‎) =====
     كان العدّادان مرميّين في رأس النافذة بعيدين عمّا يعنيان. فاجتمعا في بروفايلٍ
     **جنبًا إلى جنب مع الفعل**: من أنت وما جمعتَ في يمينٍ، وما تفعل به في يسارٍ،
     يفصلهما خيط. وهو في الوجهين: صاحبُ الرابط في نافذة الإنشاء، ومرسِلُه في نافذة
     الفتح — بنيةٌ واحدةٌ لأنّ السؤال واحد: **من هذا وماذا معه؟** */
  const xlWho = (nm, av) => `<span class="xl-who"><span class="xl-av">${av}</span>
      <span class="xl-who__b"><b>${esc(nm)}</b>${xlCnt(cxDeck())}</span></span>`;

  /* ===== إنشاءُ الرابط ===== */
  function xlCompose() {
    if (!cxSelRo) return;
    const d = cxDeck(), roots = cxRoots(d);
    const pk = postsOf(cmCode, 'cards').find(x => x.id === cardView.open);
    if (!roots.length || !pk) return;
    xlDraft = { code: cmCode, pid: pk.id, roots, t: '', d: '',
      n: state.profile.name || T().meName };
    xlPaintNew();
  }
  function xlPaintNew() {
    const el = xlEl(); el.hidden = false;
    el.innerHTML = `<div class="xl-veil" data-xl="x"></div>
      <div class="xl-box" role="dialog" aria-modal="true" aria-label="${esc(T().xlNew)}">
        <div class="xl-hd"><i>${CX_BAR_IC.link}</i><b>${esc(T().xlNew)}</b></div>
        <label class="xl-f"><span>${esc(T().xlTitle)}</span>
          <input id="xl-t" type="text" value="${esc(xlDraft.t)}" placeholder="${esc(T().xlTitlePh)}"></label>
        <label class="xl-f"><span>${esc(T().xlDesc)}</span>
          <textarea id="xl-d" rows="2" placeholder="${esc(T().xlDescPh)}">${esc(xlDraft.d)}</textarea></label>
        <div class="xl-row">
          ${xlWho(xlDraft.n, avatarHTML({ me: true }))}
          <span class="xl-url"><input id="xl-u" type="text" readonly value="${esc(xlURL(xlDraft))}">
            <button type="button" class="xl-copy" data-xl="copy">${COPY_IC}<em>${esc(T().xlCopy)}</em></button></span>
        </div>
        <p class="xl-hint">${esc(T().xlHint)}</p>
      </div>`;
    const t = document.getElementById('xl-t'), dd = document.getElementById('xl-d'),
      u = document.getElementById('xl-u');
    /* والعنوانُ يُحدَّث في مكانه لا بإعادة رسم: إعادةُ الرسم تخطف المؤشّرَ من كلمةٍ لم تتمّ */
    const live = () => { xlDraft.t = t.value; xlDraft.d = dd.value; u.value = xlURL(xlDraft); };
    t.addEventListener('input', live); dd.addEventListener('input', live);
    t.focus();
  }

