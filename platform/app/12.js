  /* ===== وبونسُك: يُكتب ولا يُحسب =====
     نقيضُ الخصم في المصدر: ذاك يُستخرج من سياسةٍ وسجلّ، وهذا لا مصدرَ له في الموقع
     أصلًا — لا أحدَ يُخبرك كم منحك أستاذُك. فيُكتب بيدك، وله مخزنُه في بَغّ الرَّكن
     (‏‎bag.gbonus‎) لا في ‎gradeV‎: ذاك مساهمةُ غيرك تُكتب من جديدٍ كلّما بدّلتَ
     اختيارَك، فلو سكن فيها لَمُحي.
     ولا يسكن في ‎gradeMe‎ أيضًا وإن كان سجلَّك: مفاتيحُها **أسماءُ البنود**، فمفتاحٌ
     محجوزٌ فيها يصطدم يومَ يُسمّي أستاذٌ بندَه «بونس» */
  const gBonus = entry => { const b = nookPicks(entry); return b ? (+b.gbonus || 0) : 0; };
  function gBonusSet(entry, n) {
    const bag = nookPicks(entry, true);
    if (!bag) return;
    if (n) bag.gbonus = n; else delete bag.gbonus;
  }

  /* ============================================================
     سُلَّمُ الحروف — أين أنت الآن من مئة الدرجة (‎grade-ladder-lab‎: «م» و«ل»)
     ============================================================
     خطٌّ أفقيٌّ في سطر العنوان، يمينَه حرفُك وحدَه. فإذا قرُب منه المؤشّرُ اتّسع وأبان
     ما فيه: كلُّ حزامٍ حرفُه فوق مداه.
     ===== والمحورُ يبدأ من ‎55‎ لا من صفر =====
     مدَياتُ الحروف غيرُ متساوية: ‎F‎ ستّون من مئة وما فوقها تسعُ خمسات. فمن رسم
     المحورَ صادقًا أعطى الرسوبَ ثلثي الخطّ وضغط الحروفَ التي تُهمّ في الثلث الباقي
     حتّى لا تسع أرقامَها. فيُطوى ما دون ‎55‎: تسعُ خلايا سواء، والنِّسَبُ **فوق النجاح
     صادقةٌ كلُّها**، والطيُّ معلنٌ لا مخفيّ — خليّةُ ‎F‎ مكتوبٌ فيها «‎<60‎».
     ===== والهندسةُ لا تتبدّل بالاتّساع =====
     الخلايا هي الخلايا مفتوحةً ومغلقة، فموضعُ المؤشّر واحدٌ في الحالين — لو تبدّل
     النموذجُ عند الاتّساع لَقفز المؤشّرُ تحت الإصبع وكذب أحدُ المنظرين.
     ============================================================ */
  const GLD_CUT = 55;
  const GLD_BANDS = [
    { L: 'F',  lo: 0,  hi: 60,  c: '#c98a8a', t: '<60' },
    { L: 'D',  lo: 60, hi: 65,  c: '#d59a63' },
    { L: 'D+', lo: 65, hi: 70,  c: '#d8a06a' },
    { L: 'C',  lo: 70, hi: 75,  c: '#dcb765' },
    { L: 'C+', lo: 75, hi: 80,  c: '#cfc06a' },
    { L: 'B',  lo: 80, hi: 85,  c: '#a9c07f' },
    { L: 'B+', lo: 85, hi: 90,  c: '#8ebd88' },
    { L: 'A',  lo: 90, hi: 95,  c: '#6fb094' },
    { L: 'A+', lo: 95, hi: 100, c: '#4f9e86' }
  ];
  const gldBand = p => {
    for (let i = GLD_BANDS.length - 1; i >= 0; i--) if (p >= GLD_BANDS[i].lo) return GLD_BANDS[i];
    return GLD_BANDS[0];
  };
  /* والمدى يُكتب كما يُقرأ: ‎85–89‎ لا ‎85–90‎ — الأعلى مفتوحٌ في الحساب مغلقٌ في الكلام */
  const gldRange = b => b.t || (b.lo + '–' + (b.hi >= 100 ? 100 : b.hi - 1));
  const gldPos = p => Math.max(0, Math.min(100, (p - GLD_CUT) / (100 - GLD_CUT) * 100));
  /* ===== وموضعُك يُقاس ممّا رُصد لا من المئة كلِّها =====
     قبل النهائيّ لم يُرصد نصفُ الوزن، فحسابُه من المئة يقول «راسب» عن كلّ أحد. فتُقسم
     درجاتُك على أوزان **البنود المرصودة** وحدَها، ثمّ يقع الخصمُ والبونس على الناتج
     (وهما نقطتان من مئةٍ لا نسبةٌ من وزن). ومن لم يرصد شيئًا فلا حرفَ له: ‎null‎ */
  function gradeStand(entry) {
    const v = gradeValues(entry), me = gradeMe(entry) || {};
    /* ===== وما لم تُدخَل درجتُه فهو تامّ =====
       كان البندُ الخاوي يُطرح من القسمة، فالحزامُ يقول «متوسّطُك فيما رُصد» — ورجلٌ
       رصد اختبارًا واحدًا يُقرأ حالُه كأنّ المادّةَ كلَّها ذاك الاختبار.
       فصار الخاوي يُحسب **كاملًا**: الحزامُ يقول «إلى أين تصل إن أتممتَ ما بقي» —
       وهو سقفُك اليوم، ينزل كلّما رُصدت درجةٌ دون التمام. وهي قاعدةُ التخطيط في
       الموقع نفسُها: ما لم يقع بعدُ يُفترض تامًّا لا معدومًا.
       والوزنُ صار مجموعَ البنود كلِّها لا المرصودةَ منها، فالقسمةُ على الكلّ */
    let got = 0, w = 0;
    (v.items || []).forEach(x => {
      if (!x.pct) return;
      const g = gmOf(me, x.name);
      got += x.pct * ((g && g.g != null) ? g.g : 100) / 100;
      w += x.pct;
    });
    if (!w) return null;
    return Math.max(0, Math.min(100, got / w * 100 - absDed(entry) + gBonus(entry)));
  }
  function gldHTML() {
    const cells = GLD_BANDS.map(b =>
      `<span class="gld-b" data-b="${b.L}" style="--bc:${b.c}"><u>${b.L}</u><s>${gldRange(b)}</s></span>`).join('');
    return `<span class="gld"><b class="gld-let">—</b><b class="gld-pct"></b>` +
      `<span class="gld-slot"><span class="gld-ax">${cells}<i class="gld-me"></i></span></span></span>`;
  }
  /* ولا يُعاد رسمُ القُمرة حين تكتب: يُكتب الحرفُ ويُزاح المؤشّرُ ويُطلى الحزام —
     وهو حكمُ خانة الدرجة نفسِه (البؤرةُ لا تُنزع من تحت الإصبع) */
  function gldPaint() {
    const el = document.querySelector('#nook .gld');
    if (!el || !nookEntry) return;
    const p = gradeStand(nookEntry), has = p != null, b = has ? gldBand(p) : null;
    el.style.setProperty('--gld-c', b ? b.c : 'var(--nk-ink-soft)');
    const L = el.querySelector('.gld-let'); if (L) L.textContent = has ? b.L : '—';
    const P = el.querySelector('.gld-pct'); if (P) P.textContent = has ? (Math.round(p * 10) / 10) + '%' : '';
    const M = el.querySelector('.gld-me');
    if (M) { M.style.left = gldPos(has ? p : 0) + '%'; M.style.opacity = has ? 1 : 0; }
    el.querySelectorAll('.gld-b').forEach(c => c.classList.toggle('on', has && c.dataset.b === b.L));
    /* ===== وجسدُ الضيّق يتبع الحزامَ =====
       ‏‎gldPaint‎ هي مَعبرُ كلّ ما يُبدّل الحصيلةَ: خانةُ درجةٍ تُكتب، وسهمُ غيابٍ
       يُضغط (فالخصمُ يدخل الحساب)، ودرجاتٌ اضافيّة. فتُنادى المِبناةُ من ههنا مرّةً
       واحدةً بدل ان يُنادى من كلّ موضعٍ فيُنسى واحد */
    nkNarrowRefresh('grade');
  }

  /* ---------- تشكيل «الدرجة»: نفس نظام بقيّة المربّعات ---------- */
  function gradeValues(entry) {
    const bag = nookPicks(entry) || {};
    const g = bag.gradeV || {};
    return { method: g.method || 'avg', items: (g.items || []).map(x => Object.assign({}, x)) };
  }
  /* ============================================================
     سجلُّك أنت في مربّع الدرجة — درجتُك في كلّ بندٍ وموعدُه
     ============================================================
     ‏‎gradeV‎ **مساهمةُ غيرِك**: توزيعٌ ركّبتَه من مساهمات المادّة، ويُكتب كلُّه من
     جديدٍ كلّما بدّلتَ اختيارَك (‎bag.gradeV = {…}‎ في حفظ المنتقي). فلو كُتب فيه
     ما أدخلتَه لَمُحي في اللحظة التي تُغيّر فيها مصدرَ التوزيع.
     فمخزنٌ ثانٍ إلى جانبه: ‎bag.gradeMe‎ — والبَغُّ نفسُه (‎picks‎ للمحاضرة و‎picksLab‎
     للمعمل)، فدرجاتُ المعمل غيرُ درجات المحاضرة كما هي مربّعاتُهما.
     ===== ومفتاحُه اسمُ البند لا رقمُه =====
     الرقمُ يقول «الثالث»، فإذا بدّلتَ التوزيعَ صار الثالثُ بندًا آخرَ وورث درجةً
     ليست له. والاسمُ يقول «الاختبار الأول» — فإن وُجد في التوزيع الجديد بندٌ بهذا
     الاسم فهو هو، وإلّا فلا شيءَ يُورَّث. وهو الصوابُ في الحالين */
  function gradeMe(entry, create) {
    const bag = nookPicks(entry, create);
    if (!bag) return null;
    if (create && !bag.gradeMe) bag.gradeMe = {};
    return bag.gradeMe || null;
  }
  const gmOf = (me, name) => (me && me[name]) || null;
  /* حدّا الترم: موعدُ بندٍ خارج ترمه ليس موعدًا. وترمٌ بلا تاريخين لا يُقيَّد */
  function gmBounds() {
    const d = state.termDates[selTerm] || {};
    return (d.s ? ` min="${d.s}"` : '') + (d.e ? ` max="${d.e}"` : '');
  }
  const GM_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';

  /* بار توزيع الدرجة عموديًّا (لمربّعات الركن): أعمدة متراصّة رأسيًّا، ولكل بند خطّ أفقيّ بلونه
     يمتدّ من عموده إلى اسمه على اليسار (بلا نقاط ولا أرقام خارج البار — النسبة داخل عموده).
     و‎me‎ سجلُّك: إن مُرِّر وُلد لكلّ بندٍ **خانةُ درجةٍ يمينَ البار وخارجَه** (فأوّلُ
     الصفّ في العربيّة يمينُه) و**أيقونةُ موعدٍ في طرفه الأيسر**. وبدونه يبقى البارُ
     عارضًا كما كان — فمعاينةُ المنتقي لا تُدخِل شيئًا */
  function gBarVertHTML(items, me, ded, bon) {
    const rem = Math.max(0, 100 - items.reduce((s, x) => s + (+x.pct || 0), 0));
    const seg = (x, i) => `<span class="gvseg" style="flex-grow:${x.pct};background:${GCOLORS[i % GCOLORS.length]}">${x.pct >= 7 ? x.pct + '%' : ''}</span>`;
    const cal = x => {
      if (!me) return '';
      const g = gmOf(me, x.name), due = g && g.d ? g.d : '';
      return `<span class="gcal${due ? ' is-set' : ''}" title="${T().gmDue}${due ? ': ' + esc(due) : ''}">${GM_CAL}` +
        `<input type="date" data-gmd="${esc(x.name)}" value="${esc(due)}"${gmBounds()} aria-label="${T().gmDue}"></span>`;
    };
    /* ===== وموعدُ البند يُرى، لا يبقى في تلميح الأيقونة =====
       كان ما يُختار من التقويم لا يظهر إلّا إذا وُقف على الأيقونة، فالجدولُ كلُّه
       أيقوناتٌ ذهبيّةٌ متشابهةٌ لا تقول متى.
       وصيغتُه ‎ISO‎ كما يخزّنها الحقل: لا تُترجَم ولا تُختصر — ‎2026-09-14‎ يُقرأ سنةً
       وشهرًا ويومًا بلا لبسٍ في لغةٍ ولا التباسٍ بين يومٍ وشهر، وهي التي اختارها
       صاحبُ الموقع من أربع صيغٍ عُرضت في المختبر.
       ويقع بين الاسم وأيقونته: من ملأ الموعدَ يقرؤه، ومن أراد تبديلَه وجد الأيقونةَ
       في مكانها لم تُزَح */
    const dat = x => {
      if (!me) return '';
      const g = gmOf(me, x.name);
      return (g && g.d) ? `<span class="gmd">${esc(g.d)}</span>` : '';
    };
    const row = (x, i) => `<span class="gvrow" style="flex-grow:${x.pct}"><i class="gvrow__line" style="background:${GCOLORS[i % GCOLORS.length]}"></i><b class="gvrow__name">${esc(x.name) || '—'}</b>${dat(x)}${cal(x)}</span>`;
    /* والخانةُ تُبنى بالنسب نفسِها كي تقف بإزاء شريحتها، وللباقي فراغٌ بوزنه وإلّا انزاح العمودان */
    /* ===== ومثلّثان يمينَ الخانة =====
       ‏‎STEP_IC‎ عينُه الذي لعدّاد الغياب: الفعلُ واحدٌ (زِد · انقُص) فليكن المرسومُ
       واحدًا. ويُكتبان **قبل** المدخل في الدوم، فأوّلُ الصفّ في العربيّة يمينُه —
       كما أنّ عمودَ الخانات أوّلُ أبناء ‎.gvert‎ ليقع يمينَ البار.
       ولا مفتاحَ يُحمل فيهما: الخانةُ جارتُهما في الخليّة (‎.gvin‎)، فتُقرأ منها —
       والمفتاحُ اسمُ البند، ونصٌّ عربيٌّ في مُنتقٍ يحتاج هربًا لا داعيَ له */
    const gstp = d => `<button type="button" class="gstp" data-gstp="${d}" tabindex="-1"` +
      ` aria-label="${d > 0 ? '+' : '\u2212'}">${d > 0 ? STEP_IC.up : STEP_IC.dn}</button>`;
    const inp = x => {
      const g = gmOf(me, x.name), got = g && g.g != null ? g.g : '';
      /* ‏‎<input>‎ لا يقبل ولدًا، فالمثلّثان لا يدخلانه. وإنّما يُنقل **الصندوقُ**
         (الحدُّ والاستدارةُ والأرضيّة) من المدخل إلى حاضنٍ ‎.gscw‎ يسعهما معًا،
         ويصير المدخلُ في جوفه شفّافًا بلا حدّ — فيُرى الثلاثةُ صندوقًا واحدًا */
      return `<span class="gvin" style="flex-grow:${x.pct}"><span class="gscw">` +
        `<span class="chipe__steps gsc-stp">${gstp(1)}${gstp(-1)}</span>` +
        `<input type="text" class="gsc${got !== '' ? ' is-set' : ''}"` +
        ` data-gmg="${esc(x.name)}" inputmode="decimal" maxlength="5" placeholder="—" value="${esc(got)}"` +
        ` title="${T().gmPct}" aria-label="${T().gmPct}"></span></span>`;
    };
    const ins = me ? `<span class="gvert__ins">${items.map(inp).join('')}${
      rem > 0 ? `<span class="gvin" style="flex-grow:${rem}"></span>` : ''}</span>` : '';
    const segs = items.map(seg).join('') + (rem > 0 ? `<span class="gvseg gvseg--rest" style="flex-grow:${rem}"></span>` : '');
    const rows = items.map(row).join('') + (rem > 0 ? `<span class="gvrow gvrow--rest" style="flex-grow:${rem}"></span>` : '');
    /* ===== وبندُ الخصم تحت البار لا فيه =====
       بنودُ البار تقتسم مئةً وشرائحُها بأوزانها، والخصمُ ليس منها: هو نقصانٌ يقع على
       المجموع بعد قسمته. فلو أُدخل شريحةً لَاقتطع من أوزان إخوته وكذب البار.
       فيقع صفًّا تحته، ويُبنى بهندسة البار عينِها ليصطفّ معه: خانةٌ بعرض ‎--gm-w‎ ثمّ
       فراغٌ بعرض البار ‎--gm-bar‎ ثمّ الاسم — والفجوتان فجوتا ‎.gvert‎.
       وخانتُه مستطيلٌ بلا مدخلٍ ولا مثلّثين: الرقمُ محسوبٌ، فلا يُعرض مقبضٌ لما لا
       يُملك تغييرُه (‎ded == null‎ يعني «لا رَكن» — فلا يُرسم في معاينةٍ ولا قائمة) */
    const dedRow = ded == null ? '' : `<span class="gvded">` +
      `<span class="gscw gscw--ro"><b class="gvded__v">\u2212${ded}%</b></span>` +
      `<i class="gvded__gap"></i>` +
      `<span class="gvrow gvded__row"><i class="gvrow__line gvded__line"></i>` +
      `<b class="gvrow__name">${T().dedRowLab}</b></span></span>`;
    /* وصفُّ البونس أخوه في الموضع والهندسة، ويفترقان في الخانة وحدَها: تلك مستطيلٌ
       يعرض حسابًا، وهذه مستطيلُ إدخالٍ بمثلّثيه — لأنّ الرقمَ ملكُك أنت */
    const bonRow = bon == null ? '' : `<span class="gvded">` +
      `<span class="gscw"><span class="chipe__steps">${gstp(1)}${gstp(-1)}</span>` +
      `<input type="text" class="gsc${bon ? ' is-set' : ''}" data-gbn="1" inputmode="decimal"` +
      ` maxlength="5" placeholder="—" value="${bon || ''}"` +
      ` title="${T().bonRowLab}" aria-label="${T().bonRowLab}"></span>` +
      `<i class="gvded__gap"></i>` +
      `<span class="gvrow gvded__row"><i class="gvrow__line gvded__line"></i>` +
      `<b class="gvrow__name">${T().bonRowLab}</b></span></span>`;
    return `<span class="gvert">${ins}<span class="gvert__bar">${segs}</span><span class="gvert__rows">${rows}</span></span>` + dedRow + bonRow;
  }
  /* شارتا «الدرجة»: توزيعها (بار) وطريقة التقييم — vert=true يجعل البار عموديًّا (مربّعات الركن)
     و‎me‎ سجلُّك: لا يُمرَّر إلّا من مربّع القُمرة، فلا تُولد الخاناتُ في معاينةٍ ولا في قائمة */
  function gradePeek(d, dragSrc, vert, me, ded, bon) {
    const dg = k => dragSrc ? ` data-drag="field" data-slot="${k}" data-src="${dragSrc}"` : '';
    const items = (d.items || []).filter(x => x && x.pct);
    const bar = vert ? gBarVertHTML(items, me, ded, bon) : gBarHTML(items);
    const dist = `<span class="v-badge v-badge--g grade-chip${vert ? ' grade-chip--v' : ''}"${dg('items')}><i class="v-lab">${T().distShort}</i>${
      items.length ? `<span class="grade-chip__bar">${bar}</span>` : `<b class="v-val">—</b>`}</span>`;
    const meth = d.method ? `<span class="v-badge v-badge--g meth-badge"${dg('method')}><i class="v-lab">${T().methodLabel}</i><b class="v-val">${d.method === 'avg' ? 'Average' : 'Standard'}</b></span>` : '';
    if (!items.length && !d.method) return `<span class="peek-tx peek-none">${T().noData}</span>`;
    return `<div class="peek-badges peek-flow">${dist}${meth}</div>`;
  }
  function nookGradeBox(entry) {
    const v = gradeValues(entry);
    if (!(v.items || []).some(x => x.pct)) return `<div class="nk-box nk-box--empty"><h3 class="nk-t">${T().nkGrade}</h3>${nkPickBtn('grade')}</div>`;
    return `<div class="nk-box" id="nk-grade" data-k="grade" data-m="${nkMode('grade')}">`
      + `${nkNarrowHTML('grade', entry)}`
      + `<span class="fx-tools fx-tools--w">${nkGearBtn('grade')}${nkFoldBtn('grade')}</span>`
      + `<h3 class="nk-t"><span class="nk-gttl">${T().nkGrade}</span>${gldHTML()}</h3>
        <div class="nk-sc"><div class="nk-body pk--peek fold-peek--rich">${gradePeek(v, null, true, gradeMe(entry) || {}, absDed(entry), gBonus(entry))}</div></div>
        ${nkSB()}
        ${nkiRZ()}
      </div>`;
  }

  /* ============================================================
     الكتابةُ في المربّع — ولا يُعاد رسمُ القُمرة
     ============================================================
     ما يُكتب لا يقرؤه اليومَ شيءٌ سوى الخانة نفسِها، فإعادةُ الرسم بعد كلّ محرفٍ
     تنزع البؤرةَ من تحت الإصبع بلا فائدة. فيُكتب في الحال ويُطلى الحدُّ ولا يُبنى شيء.
     ===== والقيمةُ تُخزَّن رقمًا والنصُّ يُترك كما هو =====
     ‏‎'8.'‎ في منتصف الكسر ليست رقمًا بعدُ، فتُحفظ ‎8‎ ويبقى ما تحت الإصبع كما كتبتَه.
     والخاوي يُحذف مدخلُه ولا يُكتب صفرًا: صفرٌ حكمٌ، والخلاءُ سكوت */
  /* ===== معالجاتُ «رحلتي» — مفاتيحُها ‎data-r*‎ لا ‎data-id‎ =====
     ولا يُعاد بناءُ القُمرة في شيءٍ منها: ‎roadRender‎ تكتب في جوف المربّع وحدَه.
     فطيُّ فصلٍ أو تسميتُه لا يهدم المربّعاتِ الأربعةَ ومقاساتِها المحفوظة */
  $('#lib-course').addEventListener('click', e => {
    if (!nookEntry) return;
    const fo = e.target.closest('[data-rfold]');
    if (fo) {
      const r = findNode(roadOf(nookEntry), fo.dataset.rfold);
      /* والخاوي لا يُفتح ولا تُحفظ له حال: يُردّ بحركةٍ ثمّ يبقى كما كان.
         ولا يُقرأ الخواءُ من الصنف بل من العقدة: الصنفُ صورةُ حالٍ قد تشيخ بين رسمتين */
      if (r && !(r.n.ch || []).length) { roadNope(fo); return; }
      if (r) { r.n.open = r.n.open === false; save(); roadRender(); }
      return;
    }
    /* ===== والفصولُ لا تُمَسّ — وما تملكه أنت يُحذف ويُسمّى =====
       التحكّمُ **بالفصول** في مربّع «المادة» وحدَه (لا إضافةَ ولا حذفَ ولا تسمية).
       وأمّا ما تضيفه أنت — بطاقةٌ أو مجلدٌ أو مهمّة — فهو لك، فله سلّتُه وحقلُ اسمه.
       والحارسُ في الفعل لا في الرسم وحدَه: ‎n.tp === 1‎ يُردّ عنه الحذفُ والتسمية،
       فلو تسرّب مفتاحٌ يومًا لم يبلغ فصلًا */
    const dl = e.target.closest('[data-rdel]');
    if (dl) {
      const r = findNode(roadOf(nookEntry), dl.dataset.rdel);
      if (r && r.n.tp !== 1) { r.arr.splice(r.i, 1); save(); roadRender(); }
      return;
    }
    const rv = e.target.closest('[data-rvid]');
    if (rv) { vwOpenOne(rv.dataset.rvid); return; }
    const rc = e.target.closest('[data-rcard]');
    if (rc) {
      const r = findNode(roadOf(nookEntry), rc.dataset.rcard);
      /* ===== والمستوردةُ تُقرأ ولا تُحرَّر =====
         هي **نسخةُ عمل غيرك** نزلت في دفترك (‎jriClone‎ · وسمُها ‎imp‎). وتحريرُها يُفسد
         أمرين: يُبعدها عن أصلها فلا تُقارن به، ويُوهم أنّك تُصلح ما نُشر وأنت لا تُصلح
         إلّا نسختك. وما صنعتَه بيدك يبقى يُحرَّر — الفرقُ في الأصل لا في الموضع */
      if (r) openCardDlg(rc.dataset.rpid || null, r.n, true, { ro: !!r.n.imp });
      return;
    }
    const ck = e.target.closest('[data-rchk]');
    if (ck) {
      const r = findNode(roadOf(nookEntry), ck.dataset.rchk);
      if (r && r.n.t === 'k') { r.n.dn = r.n.dn ? 0 : 1; save(); roadRender(); }
      return;
    }
    /* والاستيرادُ بابُه نافذةٌ لا صفٌّ يُدفع: يُختار المصدرُ ثمّ يُتصفَّح ثمّ يُنتقى */
    if (e.target.closest('.jr-addi')) { jriOpen(); return; }
    /* الإضافةُ في **جذر** رحلتك: الزرُّ واحدٌ في صدر المربّع، فمقصدُه الجذرُ لا فصلًا
       بعينه. ومن أراد بندًا في فصلٍ نقله إليه بالسحب — أو زرٌّ في صفّ الفصل يومًا */
    const ad = e.target.closest('.jr-addc, .jr-addf, .jr-addk');
    if (ad) {
      const arr = roadOf(nookEntry, true);
      /* ===== والبطاقةُ لا تنزل صفًّا: تُفتح لها النافذة =====
         في المكتبة «+ بطاقة» **لا يضيف صفًّا في الشجرة** — ينزل الدُّرجُ من فوق بأنواع
         البطائق الأربعة، فتختار، فتُفتح النافذة وفيها يُضبط كلُّ شيء. وهو الفعلُ نفسُه
         ههنا حرفًا بحرف، ولا يفترقان إلّا في **مخزن البطاقة**: تلك تنزل في رزمة مساهمتك،
         وهذه في ‎entry.road‎ — والوسمُ ‎road‎ على النافذة هو الفرقُ كلُّه.
         والمجلدُ والمهمّةُ يبقيان صفَّين يُدفعان: لا نافذةَ لهما */
      if (ad.classList.contains('jr-addc')) { openCardDlg(null, null, true); return; }
      const n = ad.classList.contains('jr-addf')
        ? { id: newId(), t: 'f', name: '', ci: pickFolderColor(arr), open: true, ch: [] }
        : { id: newId(), t: 'k', f: '', dn: 0 };
      arr.push(n);
      save(); roadRender();
      /* والقلمُ ينزل في الجديد: من ضغط «أضف» يريد أن يسمّيه الآن */
      const box = document.getElementById('nk-road');
      const inp = box && box.querySelector(`.jr-in[data-rid="${CSS.escape(String(n.id))}"]`);
      if (inp) inp.focus();
      return;
    }
  });
  $('#lib-course').addEventListener('input', e => {
    if (!nookEntry || !e.target.classList.contains('jr-in')) return;
    const r = findNode(roadOf(nookEntry), e.target.dataset.rid);
    if (!r || r.n.tp === 1) return;
    if (r.n.t === 'f') r.n.name = e.target.value; else r.n.f = e.target.value;
    /* والغلافُ الذي ينمو يتبع الحرفَ بلا إعادة رسم — وإلّا خُطف القلمُ في كلّ محرف */
    const g = e.target.closest('.vt-grow');
    if (g) {
      const ph = r.n.t === 'k' ? T().jrTaskPh : r.n.t === 'c' ? T().jrCardPh : T().jrFoldPh;
      g.dataset.v = e.target.value || ph;
      g.classList.toggle('is-ph', !e.target.value);
    }
    save();
  });

  $('#lib-course').addEventListener('input', e => {
    /* والبونسُ يُكتب بحكم الدرجة نفسِه: ‎0–100‎، والخاوي يُحذف ولا يُكتب صفرًا */
    const bn = e.target.closest('.gsc[data-gbn]');
    if (bn && nookEntry) {
      const bv = bn.value.replace(/[^\d.]/g, '');
      if (bv !== bn.value) bn.value = bv;
      const bnum = parseFloat(bv);
      gBonusSet(nookEntry, isFinite(bnum) ? Math.max(0, Math.min(100, bnum)) : 0);
      bn.classList.toggle('is-set', bv !== '');
      gldPaint();   /* والبونسُ يرفع الحرفَ كما يخفضه الخصم — فالسُّلَّمُ يقرؤهما */
      save();
      return;
    }
    const el = e.target.closest('.gsc[data-gmg]');
    if (!el || !nookEntry) return;
    const v = el.value.replace(/[^\d.]/g, '');
    if (v !== el.value) el.value = v;
    const n = parseFloat(v);
    const me = gradeMe(nookEntry, true), key = el.dataset.gmg;
    const rec = me[key] || (me[key] = {});
    if (isFinite(n)) rec.g = Math.max(0, Math.min(100, n)); else delete rec.g;
    if (rec.g == null && rec.d == null) delete me[key];
    el.classList.toggle('is-set', v !== '');
    gldPaint();
    save();
  });
  $('#lib-course').addEventListener('change', e => {
    const el = e.target.closest('input[data-gmd]');
    if (!el || !nookEntry) return;
    const me = gradeMe(nookEntry, true), key = el.dataset.gmd;
    const rec = me[key] || (me[key] = {});
    if (el.value) rec.d = el.value; else delete rec.d;
    if (rec.g == null && rec.d == null) delete me[key];
    const cell = el.closest('.gcal');
    if (cell) { cell.classList.toggle('is-set', !!el.value); cell.title = T().gmDue + (el.value ? ': ' + el.value : ''); }
    /* وشارةُ الموعد تُولد وتموت مع القيمة ولا يُعاد رسمُ القُمرة: البناءُ من جديدٍ
       بعد كلّ اختيارٍ يهدم المربّعاتِ الأربعةَ لتاريخٍ تبدّل، وينزع البؤرةَ من تحت
       الإصبع. وتُدرج **قبل الأيقونة** لتقع حيث تُرسم في البناء الأوّل سواءً بسواء */
    const rw = el.closest('.gvrow');
    if (rw && cell) {
      let d = rw.querySelector('.gmd');
      if (el.value) {
        if (!d) { d = document.createElement('span'); d.className = 'gmd'; rw.insertBefore(d, cell); }
        d.textContent = el.value;
      } else if (d) d.remove();
    }
    save();
  });
  /* والنقرُ على الحقل المبسوط يُبئِر خانةً من التاريخ ولا يفتح التقويم — فيُطلب صراحةً،
     ولا يُجاب الطلبُ إلّا داخل لمسةٍ من المستخدم، وههنا نحن في قلبها */
  $('#lib-course').addEventListener('click', e => {
    const g = e.target.closest('.gcal');
    if (!g) return;
    const inp = g.querySelector('input[type="date"]');
    if (!inp) return;
    try { inp.showPicker(); } catch (err) { inp.focus(); }
  });

  /* ============================================================
     رفُّ الموارد في القُمرة — أربعةُ أبوابٍ إلى مساهماتها
     ============================================================
     الأربعةُ هي أقسامُ «الموارد» بعينها في شريط واجهة المادّة، **وتُقرأ من المصدر
     نفسِه** (‎XT_RES‎ يبنيها هناك وههنا): لو زِيد قسمٌ خامسٌ أو بُدّل لفظُ واحدٍ منها
     تبعه الموضعان بلا سطرٍ يُكتب مرّتين. وأيقوناتُها ‎TAB_IC‎ نفسُها.
     وترتيبُها ترتيبُ الكتابة: الفهمُ يمينًا ثمّ الممارسةُ ثمّ الشروحُ ثمّ البطائق.
     والضغطةُ تفتح **واجهةَ المادّة** على ذلك القسم (بحكم صاحب الموقع): هي المبنيّةُ
     لهذه الأربعة — المصادرُ بملفّاتها والرزمُ بشجرتها — فلا يُبنى لها عارضٌ ثانٍ
     يُصان معها ويفترق عنها يومًا.
     ============================================================ */
  const XT_RES = () => [['srcU', T().studySrc], ['srcP', T().practiceSrc],
                        ['videos', T().videosSec], ['cards', T().cardsSec]];
  /* ===== وحالُ الرفّ: أيُّ قسمٍ مفتوحٌ فيه، أو لا شيء =====
     حالُ نظرةٍ لا تفضيلٌ يُحفظ — تُردّ إلى الطيّ كلَّما بُنيت القُمرة، فلا ترث مادّةٌ
     نظرةَ التي قبلها */
  let nkRes = null;
  function nookResBox() {
    const open = nkRes;
    const cur = open ? (XT_RES().find(x => x[0] === open) || [])[1] : '';
    /* والترويسةُ تتبدّل: «الموارد» مطويًّا، واسمُ القسم مفتوحًا ومعه بابُ الرجوع.
       ولا يُبنى الزرُّ مطويًّا: زرُّ رجوعٍ لا موضعَ يُرجع منه خبرٌ كاذب */
    const head = open
      ? `<h3 class="nk-t nk-t--res">`
        + `<button type="button" class="nk-res__bk" id="nk-back" title="${esc(T().nkResources)}"`
        + ` aria-label="${esc(T().nkResources)}">`
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"'
        + ' stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>'
        + `</button><i class="nk-res__ic">${TAB_IC[open]}</i>${esc(cur)}</h3>`
      : `<h3 class="nk-t">${T().nkResources}</h3>`;
    const row = open ? '' : '<div class="nk-res__row">'
      + XT_RES().map(([v, txt]) =>
          `<button type="button" class="nk-res__b" data-nkres="${v}">`
          + `${TAB_IC[v]}<span>${esc(txt)}</span></button>`).join('')
      + '</div>';
    /* والجوفُ يبقى مبنيًّا وإن خلا: إليه تُنقل واجهةُ المادّة، ولو بُني عند الفتح
       وحدَه لَاحتاج النقلُ أن يعرف متى وُلد */
    return `<div class="nk-rect nk-res${open ? ' is-open' : ''}">${head}${row}`
      + '<div class="nk-res__host" id="nk-res-host"></div></div>';
  }
  /* ===== والرجوعُ إلى القُمرة: زرٌّ في الواجهة يُبنى ما دمنا جئنا منها =====
     ‏‎nookEntry‎ باقيةٌ حين نغادر إلى الواجهة، فهي علامةُ «لك قُمرةٌ ترجع إليها».
     وتُمحى حين تُغادر الركنَ حقًّا (تبديلُ ترمٍ أو مادّة) فيذهب الزرُّ معها */
  /* ===== والتوسُّع: واجهةُ المادّة تنتقل إلى **جوف الصندوق** =====
     لا إلى الركن كلِّه (وذاك ما بُني أوّلًا فرُدّ: كان يعرض الشريطَ كاملًا بأقسامه
     السبعة كأنّك في المكتبة، والمقصودُ قسمٌ واحدٌ داخل الرفّ).
     و‎#cm-ui‎ تُعار كما هي — هي المبنيّةُ لهذه الأقسام، ويُخفى منها ما لا يخصّ الرفَّ
     (ترويستُها وشريطُ أقسامها) بصنفٍ على الحاضن. فلا يُبنى عارضٌ ثانٍ ولا تُنسخ
     دالّةُ عرضٍ واحدة.
     ويُبنى الصندوقُ أوّلًا ثمّ يُنقل إليه: ‎nookResBox‎ تُعيد رسمَ القُمرة كلِّها،
     فلو نُقلت الواجهةُ قبلها لَمحاها ذلك الرسم */
  function openNookRes(sec) {
    if (!nookEntry) return;
    nkRes = sec;
    openNook(nookEntry);                  /* يُعيد بناءَ القُمرة والرفُّ مفتوح */
    const host = document.getElementById('nk-res-host');
    if (!host) return;
    host.appendChild($('#cm-ui'));
    fillCourseUI(nookCode(nookEntry));
    showCmTab(sec);
  }
  /* ============================================================
     «رحلتي» — الرزمةُ التي تملكها أنت في هذه المادّة
     ============================================================
     منطقةُ الرَّكن كانت مربّعًا فارغًا إلّا من عنوانه. وصارت **شجرةً على منطق شجرة
     البطائق في وضع التحرير حرفًا بحرف**: المقبضُ والمثلّثُ والاسمُ الذي يُكتب في مكانه
     والسلّةُ والسحبُ والترتيب — كلُّها الآلةُ نفسُها لا نظيرةٌ لها.

     ===== ولمَ ترتدي ‎pk--edit‎؟ =====
     ليست حيلةً في التنسيق: «رحلتي» **رزمةٌ تُحرَّر** بحقّ — لكنّها رزمتُك أنت لا مساهمةُ
     غيرك. فجلدُ الرزمة المحرَّرة يقع عليها بمعناه لا باستعارته، فترث اثنتين وعشرين قاعدةً
     في المثلّث والصفّ والجوف بلا سطرٍ يُنسخ.

     ===== وبذرتُها المواضيع =====
     تُملأ من قناة ‎lessons‎: كلُّ موضوعٍ **مجلدٌ** لا ورقة — الفصلُ ظرفٌ يُوضع فيه، وفيه
     تنزل بطائقُك وملفّاتُك وموادُّك بعدُ. واللفظُ لفظُه في المادّة، والدائرةُ والرقمُ
     ثيمُ ‎.lorder‎ بعينه — فما تراه في «المواضيع» هو ما تراه ههنا.

     ===== وتُبذر مرّةً ولا تُفرض =====
     البذرُ عند أوّل فتحٍ فقط (‎road‎ معدومة). فمن رتّب رحلتَه أو حذف منها لا يُهدم عملُه
     كلَّما فُتح الرَّكن. وما جدّ من مواضيعَ بعدُ يُنزَّل بزرٍّ صريح — ولا يُنزَّل مكرَّرٌ:
     المطابقةُ بالرقم والاسم معًا.

     ===== ومفاتيحُ الصفوف ‎data-r*‎ لا ‎data-id‎ =====
     معالجاتُ محرّر البطائق تلتقط ‎.cx-fname‎ بالصنف وحدَه و‎.cx-del‎ بالصنف وحدَه، ثمّ
     تسأل ‎edPack().deck‎ عن المعرّف. فلو لبس صفُّ الرحلة تلك الأصنافَ لَبلغته أفعالٌ
     تبحث عن عقدته في ديكٍ ليس ديكَها. فالأصنافُ ههنا ‎jr-*‎ ومفاتيحُها ‎data-r*‎،
     ويبقى ‎data-id‎ على الصفّ وحدَه لأنّ محرّكَ السحب يقرؤه (وهو يسأل الحاضنَ عن مالكه).
     وهي قاعدةُ ‎data-roid‎ نفسُها في شجرة النشر */
  const roadKey = entry => nookIsLab(entry) ? 'roadLab' : 'road';
  /* ===== ورحلةُ نشاطٍ بعينه — لا رحلةُ «المعروض الآن» =====
     ‏‎roadOf‎ تسأل ‎selOf‎: أيُّ نشاطٍ مختارٌ **على الشاشة**. وهي صادقةٌ في القُمرة لأنّ
     القُمرةَ تعرض نشاطًا واحدًا. وفي رفّ الترم يقف كتابا المادّة معًا — محاضرةً ومعملًا —
     ولكلٍّ دائرتُه على غلافه، فلو سُئل ‎roadOf‎ لَأجاب الاثنين جوابًا واحدًا: رحلةَ
     المختار. فالنشاطُ يُمرَّر ولا يُستنتج */
  const roadArr = (entry, act) => {
    if (!entry) return [];
    const k = (isLab(entry.code) && act === 'معمل') ? 'roadLab' : 'road';
    return entry[k] || [];
  };
  /* ===== وفي «المكتبة» لا ترمَ يُسأل عنه — فتُجمع الأترامُ كلُّها =====
     رفُّ الترم يعرض **مدخلةً**: مادّةٌ في ترمٍ بعينه فرحلتُها معلومة. والمكتبةُ ونافذةُ
     الإضافة تعرضان **مادّةً**: قد تكون في ترمين (أُعيدت أو قُسّمت)، فأيُّ رحلةٍ تُقال؟
     ولا تُنتقى واحدةٌ وتُهمل أختُها — الدائرةُ خبرٌ عن سعيك في هذه المادّة، وسعيُك فيها
     مجموعُ ما فعلتَه تحتها في كلّ ترمٍ أخذتَها فيه. فتُوصل القوائمُ وصلًا، والحسابُ بعدُ
     حسابٌ واحد: البنودُ بنودٌ لا يعنيها في أيّ ترمٍ كُتبت.
     وفي الغالب الأعمّ — مادّةٌ في ترمٍ واحد — يستوي الجوابان حرفًا بحرف، فما تراه على
     غلافها في المكتبة هو ما تراه على غلافها في الرفّ */
  const roadArrAll = (code, act) => {
    const out = [];
    Object.values(state.libs || {}).forEach(list => (list || []).forEach(e => {
      if (e.code === code) out.push.apply(out, roadArr(e, act));
    }));
    return out;
  };
  const roadOf = (entry, create) => {
    if (!entry) return [];
    const k = roadKey(entry);
    if (!entry[k] && create) entry[k] = [];
    return entry[k] || [];
  };
  /* ============================================================
     مواضيعُ المادّة — من ‎info.topics‎ لا من قناة ‎lessons‎
     ============================================================
     كانت هذه الدالّةُ تقرأ ‎posts.lessons‎، فرجعت خاويةً وفي المادّة تسعةُ مواضيع.
     والعلّةُ أنّ **المواضيعَ انتقلت**: كان لها لسانٌ مستقلٌّ في شريط المادّة فحُذف
     (‎ROADMAP-LIB-TABS-GROUPING‎)، وصارت تُكتب في مستطيل «مواضيع المادة» **داخل مساهمة
     «المادة»** — مخزنُها ‎d.topics‎ (‎topicsOf‎). وقناةُ ‎lessons‎ بقيت في التخزين لبياناتٍ
     قديمةٍ لا تُكتب فيها اليوم.
     فالقراءةُ من حيث يُكتب، والقديمُ يبقى مقروءًا آخرًا لئلّا يضيع على أحد.

     ===== وأيُّ مساهمةٍ تُقرأ؟ لا تُسأل ههنا =====
     القُمرةُ تعرض قيمًا **مركَّبةً**: ما اخترتَه من مساهمات، وما كتبتَه أنت، وما ورثته —
     تجمعها ‎infoValues(entry)‎، وهي مصدرُ مربّع «المادة» ومنبثقةِ مواضيعه (‎nkInfoTopics‎).
     فتُسأل هي بعينها ولا تُبنى سلسلةُ تفضيلٍ ثانيةٌ ههنا: ما تراه في «المادة» هو ما
     ينزل في رحلتك، ولا يفترقان يومَ تتبدّل قواعدُ التركيب.
     و‎liveTopics‎ حكمُ «الموضوع الحيّ» المكتوبُ في الموقع (له رقمٌ أو اسم) — لا يُعاد */
  function roadTopics(entry) {
    const t = liveTopics((infoValues(entry) || {}).topics);
    if (t.length) return t;
    /* والقديمُ آخرًا: قناةُ ‎lessons‎ لمن كتب فيها قبل النقلة */
    const L = lessonsLists(nookCode(entry))
      .find(x => (x.data.items || []).some(i => i.num || i.name));
    return liveTopics((L && L.data.items) || []);
  }
  /* ولا يُنزَّل مكرَّر: المفتاحُ الرقمُ والاسمُ معًا — فموضوعان بالاسم نفسِه ورقمين مختلفين
     بندان، وموضوعٌ أُعيد تنزيلُه بعد أن سمّيتَه باسمك يبقى واحدًا */
  const roadSig = x => String((x && x.num) || '').trim() + '|' + String((x && x.name) || '').trim();
  /* ============================================================
     الفصولُ تُعكَس ولا تُملَك — والمصالحةُ في كلّ رسمة
     ============================================================
     كانت الفصولُ **تُبذر** نسخةً في ‎entry.road‎ ثمّ تُحرَّر ههنا: تُزاد وتُحذف وتُسمّى.
     وقُرّر أن يكون التحكّمُ بها في مربّع «المادة» وحدَه (‎topicsOf‎)، فتُنزع من هذا
     المربّع أدواتُ الإضافة والحذف والتسمية.

     ===== ونزعُها يوجب المرآة، ولا يستقيم بدونها =====
     لو بقيت نسخةً ساكنةً بلا أدوات: موضوعٌ يُحذف من «المادة» يبقى ههنا **ولا سبيلَ إلى
     رفعه**، وموضوعٌ يُسمّى من جديدٍ يبقى باسمه القديم ولا سبيلَ إلى تصحيحه. فيصير
     المربّعُ فخًّا لا مرآة. فالقائمةُ تُقرأ من المصدر في كلّ رسمة، والمخزنُ ‎entry.road‎
     لم يعد يحمل الفصولَ بل **ما تملكه أنت فيها**: أمفتوحٌ هو، وما تضعه في جوفه بعدُ.

     ===== والمطابقةُ على درجتين =====
     ‏(١) بالبصمة (رقمٌ واسم) — وهي الأصل.
     ‏(٢) فإن لم تقع، فبالرقم وحدَه إن كان مذكورًا وغيرَ مكرَّر — فمن **أعاد تسمية**
         فصلٍ في «المادة» لا يفقد ما بناه في جوفه، والبصمةُ وحدَها كانت تفقده.

     ===== واليتيمُ لا يُتلف عملُه =====
     عقدةٌ لم يعد لها موضوعٌ حيّ: تُطرح إن كانت خاويةً (لا شيءَ فيها يُفقد)، وتبقى في
     الذيل إن كان في جوفها شيء — فحذفُ موضوعٍ من «المادة» لا يمحو ما بنيتَه فيه بلا
     أن تُستأذن. (وهو اليومَ فرعٌ لا يقع: لا شيءَ يُوضع في الجوف بعدُ. ويُكتب لغدٍ) */
  /* ===== وما تملكه أنت لا يُصالَح: الوسمُ ‎tp‎ يفرّق =====
     العقدةُ في هذا المخزن جنسان: **فصلٌ مرآةٌ** لموضوعٍ في «المادة» (‎tp: 1‎)، و**بندٌ
     تملكه أنت** (بطاقةٌ أو مجلدٌ أو مهمّة). فلو سُئل الجميعُ عن موضوعٍ حيٍّ يوافقهم
     لَذهب كلُّ ما تضيفه في أوّل رسمة — يُضاف مجلدٌ فيختفي قبل أن تسمّيه.
     فالمصالحةُ لا تبلغ إلّا الفصول، وما سواها يبقى بترتيبه.
     والقديمُ الذي بُذر قبل هذا الوسم يُوسَم عند أوّل مطابقةٍ فيلتحق بأهله */
  /* ============================================================
     تحديثُ البطاقة المستوردة — يصل صامتًا أو يُستأذن
     ============================================================
     البطاقةُ في «تقدمي الذاتي» **نسخةٌ مقطوعة**: أُخذت يومَ أُخذت بنصّها ورقمها
     (‎jriClone‎ يكتب ‎n.src‎ معرّفَ الأصل و‎n.v‎ رقمَ المنشورة يومئذٍ). فإذا نشر صاحبُ
     المساهمة نسخةً أحدثَ لم تبلغك — وذاك عيبٌ: تُذاكر نصًّا صُحّح.

     ===== وأمّا في المساهمة فلا رجعة =====
     المساهمةُ عرضُ صاحبها، وما يعرضه هو الأحدث. فتُقرأ من ‎cdPubV‎ في كلّ رسمة ولا
     يُخزَّن للقارئ شيء (‎cxTx‎ في §٣٠) — فلا نسخةَ سابقةٌ يُرجع إليها هناك أصلًا.

     ===== وفي مسارك أنت حالان =====
     ‏**لم تختبر نفسَك فيها** ⇐ تُبدَّل صامتةً: لا سجلَّ يُبنى على نصٍّ مضى، ولا معنى
       لأن تُستأذن في شيءٍ لم تلمسه.
     ‏**وعندك سجلٌّ معها** ⇐ تُخبَر ولا تُبدَّل: حكمُك «صحّ» وقع على **ذلك النصّ**،
       فتبديلُه من تحتك يجعل سجلَّك يقول عمّا لا يعرف. فتُرفع شارةٌ ويبقى القرارُ لك،
       ولك بعده الرجوعُ إلى ما كنتَ عليه.

     ===== ولا يُسأل الأصلُ في كلّ صفّ =====
     ‎cxNodeById‎ تمشي على مساهمات الموادّ كلِّها، ورحلةٌ فيها مئةُ بطاقةٍ تعني مئةَ
     مِشيات في الرسمة الواحدة. فيُحفظ الجوابُ لطول الرسمة ويُمحى عند مطلعها — وهو
     حكمُ ‎csMemo‎ في فلتر المكتبة سواءً بسواء */
  const impMemo = new Map();
  const impSrc = n => {
    if (!n || !n.imp || !n.src) return null;
    if (impMemo.has(n.src)) return impMemo.get(n.src);
    const s = cxNodeById(n.src);
    impMemo.set(n.src, s || null);
    return s || null;
  };
  /* والأحدثُ **ما نُشر** لا ما في يد صاحبها: مسوّدتُه ليست لك (§٣٠) */
  function impNew(n) {
    const src = impSrc(n);
    if (!src) return 0;
    const pv = cdPubV(src);
    return pv > (n.v || 1) ? pv : 0;
  }
  /* «اختبرتَ نفسَك فيها؟» — ‎x3Ans().k‎ عددُ وحدات السؤال التي أُجيبت. وهو المفتاحُ
     المشترك (‎recId‎): سجلُّك مع المستوردة سجلُّك مع أصلها سواء */
  const impTried = n => x3Ans([n]).k > 0;
  /* والأخذُ يُودع ما كنتَ عليه أوّلًا: بلا إيداعٍ لا رجعةَ — والرجعةُ حقٌّ وُعدتَ به */
  function impTake(n, v) {
    const src = impSrc(n);
    const pv = v || (src ? cdPubV(src) : 0);
    const r = src && cdRec(src, pv);
    if (!r) return false;
    const cur = n.v || 1;
    if (!cdRec(n, cur)) histPush(n, { v: cur, f: n.f, b: n.b, ts: n.ct || 0, pub: true });
    n.f = r.f || ''; n.b = r.b || ''; n.v = pv;
    if (!cdRec(n, pv)) histPush(n, { v: pv, f: n.f, b: n.b, ts: r.ts || Date.now(), pub: true });
    delete n.upd;
    return true;
  }
  /* ومسحةُ الرحلة: تُنادى مع كلّ مصالحةٍ للفصول، فالخبرُ يصل في أوّل فتحة */
  function impSync(list) {
    let ch = false;
    (function walk(arr) {
      (arr || []).forEach(n => {
        if (n.t === 'f') { walk(n.ch); return; }
        if (n.t !== 'c' && n.t !== 'q') return;
        const pv = impNew(n);
        if (!pv) { if (n.upd) { delete n.upd; ch = true; } return; }
        if (!impTried(n)) { if (impTake(n, pv)) ch = true; return; }
        if (n.upd !== pv) { n.upd = pv; ch = true; }
      });
    })(list);
    return ch;
  }
  /* وعدُّ ما تحت المجلّد: الشارةُ على وجهه تقول كم بطاقةً تحته جاءها تحديث */
  const impCnt = ns => (ns || []).reduce((a, n) =>
    a + (n.t === 'f' ? impCnt(n.ch) : (n.upd ? 1 : 0)), 0);
  function roadSync(entry) {
    const store = roadOf(entry, true);
    const live = roadTopics(entry);
    /* والمرشَّحُ للمطابقة: الموسومُ فصلًا، أو القديمُ الذي لا وسمَ له ولا جنسَ بندٍ
       (‎t === 'f'‎ بلا ‎ci‎ ولا ‎tp‎ — تلك بذرةُ ما قبل الوسم) */
    const isCh = n => n.tp === 1 || (n.tp === undefined && n.t === 'f' && n.ci === undefined);
    const bySig = new Map(), byNum = new Map(), dupNum = new Set();
    store.filter(isCh).forEach(n => {
      if (!bySig.has(roadSig(n))) bySig.set(roadSig(n), n);
      const k = String(n.num || '').trim();
      if (!k) return;
      if (byNum.has(k)) dupNum.add(k); else byNum.set(k, n);
    });
    const taken = new Set(), born = [];
    live.forEach((x, xi) => {
      const k = String(x.num || '').trim();
      let n = bySig.get(roadSig(x));
      if (n && taken.has(n)) n = null;
      if (!n && k && !dupNum.has(k)) { const c = byNum.get(k); if (c && !taken.has(c)) n = c; }
      if (!n) { n = { id: newId(), t: 'f', open: true, ch: [] }; born.push(n); }
      taken.add(n);
      n.tp = 1;
      /* والاسمُ والرقمُ يُنسخان في العقدة لتبقى المطابقةُ ممكنةً في الرسمة التالية */
      n.num = String(x.num || '').trim(); n.name = x.name || '';
      /* ===== ورقمُ قرصه: ترتيبُه في «المادة» لا ترتيبُه في صفّك =====
         كان القرصُ يُرسم ‎i + 1‎ — أي **موضعَ الصفّ**. فمن رفع الفصلَ الثانيَ فوق الأوّل
         انقلب قرصُه إلى ‎1‎، فيبدو أنّ الفصلَ نفسَه تبدّل وإنّما تبدّل موضعُه.
         والقرصُ هُويّةٌ لا موضع: هو رقمُ الموضوع في «المادة»، وترتيبُ رحلتك ترتيبُك
         أنت (وهو حكمٌ مكتوبٌ في هذه الدالّة: «وأمّا ترتيبُ رحلتك فترتيبُك أنت»).
         فيُقيَّد من المصدر مع الاسم والرقم — يتبدّل إذا رُتّبت المواضيعُ هناك لا ههنا */
      n.tpi = xi + 1;
    });
    /* ============================================================
       والبناءُ **بترتيب المخزن** لا بترتيب المصدر
       ============================================================
       كان يُبنى على ترتيب المواضيع في «المادة» ثمّ يُلحَق ما تملكه، فكان الجرُّ لا يثبت:
       تُحرّك فصلًا فتردّه الرسمةُ التالية إلى موضعه في المصدر.
       وحكمُ «التحكّمُ بالفصول في مربّع المادة» موضعُه **الوجود والاسم**: لا تُنشئ فصلًا
       ههنا ولا تحذفه ولا تسمّيه. وأمّا **ترتيبُ رحلتك** فترتيبُك أنت — دفترٌ ترتّبه
       كما شئت، وما فيه من فصولٍ يبقى ما بقيت في «المادة».
       فيُقرأ المخزنُ على وجهه، ويُلحَق في الذيل ما استُجدّ من المواضيع (‎born‎) */
    const out = [];
    store.forEach(n => {
      /* فصلٌ ذهب موضوعُه: يُطرح خاويًا ويبقى عامرًا (لا يُتلف عملُك بلا استئذان) */
      if (isCh(n) && !taken.has(n)) { if ((n.ch || []).length) out.push(n); return; }
      out.push(n);
    });
    born.forEach(n => out.push(n));
    const changed = out.length !== store.length || out.some((n, i) => n !== store[i]);
    entry[roadKey(entry)] = out;
    return { list: out, changed };
  }
  /* صفُّ الفصل — أختُ ‎cxTreeEdit‎ لا نسخةٌ منها: البنيةُ والأصنافُ واحدة، والفرقان
     وجهُ الصفّ (دائرةُ الترتيب مكانَ رمز النوع) ومفاتيحُه. وما تبدّل في تلك يُنظر إليه ههنا */
  /* ============================================================
     «استورد من المكتبة» — ‎jr-import-lab#d4‎ «صندوقُ الرفّ» بحكم صاحب الموقع
     ============================================================
     صندوقٌ مفتوحٌ يُرى من أمام، وسهمٌ يخرج من قاعه نازلًا: **تُنزل ما في الصندوق إليك**.
     ===== ولمَ حلَّ محلَّ ‎f1‎ (الكتابُ يمتدّ خطُّه سهمًا) =====
     ‏‎f1‎ كان أبلغَ في المعنى — يقول الطريقَ كلَّه بأيقونة التبويب نفسِها — لكنّه
     **أربعةُ أجسام في خمسةَ عشرَ بكسلًا**: نصفا كتابٍ وخيطٌ منعطفٌ ورأسُ سهم. وعند هذا
     القدّ لا تُقرأ الأربعةُ إلّا بالتحديق، فينحلّ الكتابُ إلى لطخةٍ ويبقى السهمُ وحدَه.
     و‎d4‎ **جسمان**: صندوقٌ وسهم — فيُقرأ من نظرةٍ واحدة، وهي علّةُ اعتماده في المختبر.
     ===== وثلاثُ قيمٍ من لوح المعايرة =====
     · قِمَّتُه شريحةٌ أعرضُ من بدنه (‎4.4→19.6‎ فوق، و‎6→18‎ تحت) — وهي التي تجعله
       **صندوقًا مفتوحًا** لا مستطيلًا؛ ولو تساويا لَقُرئ حقلَ إدخال.
     · وقاعُه قوسان ‎rx = 2‎، فيُقرأ صندوقًا له عمقٌ لا رقعةً مسطّحة.
     · والسهمُ يبدأ من ‎y = 13.6‎ — أي **داخلَ** قاع الصندوق بقدرٍ يسير لا تحته، فيُقرأ
       خارجًا منه لا واقفًا تحته.
     ===== ولا يقول «مكتبة» صراحةً =====
     وهو ثمنُه المقبول: لفظُ الزرّ يقولها (‎jrAddI‎)، والصفُّ الذي هو فيه أزرارُ إضافةٍ
     كلُّها — فالمعنى مقروءٌ من موضعه. وربحُه أنّه **لا شبيهَ له** في الصفّ ولا في
     أيقونات الموقع: لا رزمةٌ ولا كتابٌ ولا مجلّد */
  const JR_IMP_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"'
    + ' stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M4.4 5.2h15.2"/>'
    + '<path d="M6 5.2v4.2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5.2"/>'
    + '<path d="M12 13.6v6"/><path d="M9.6 17.2 12 19.6l2.4-2.4"/></svg>';
  /* ============================================================
     أيقونةُ المهمّة — ‎task-icon-lab#a4‎ «الصحُّ في حلقةٍ مفتوحة» بحكم صاحب الموقع
     ============================================================
     ===== ولمَ رُدَّ سابقُها (مربّعٌ مستديرٌ وصحّ) =====
     كان يُعلَّل بأنّه «أخو ‎.x3-done‎، فلا يُخترع رمزٌ لفعلٍ معروف». والعلّةُ انقلبت
     عليه: **مفتاحُ الشطب في الصفّ الذي يُنشئه** (‎.jr-chk‎) مربّعٌ مستديرٌ يمتلئ أخضرَ
     ويظهر فيه صحٌّ أبيض. فصار الرمزُ الواحدُ يخدم **فعلين متضادّين**:
       · في الحبّة: **أنشئ** مهمّة.   · في الصفّ: **أُنجزت** المهمّة.
     وذاك أشدُّ التباسٍ يقع — لا رمزان يتشابهان، بل رمزٌ واحدٌ لمعنيين متعاكسين.
     ===== وما الذي يُفرّق هذا عنه =====
     **الحلقةُ مفتوحة** (تنقص قوسًا عند الطرف الأعلى الأيسر) والصحُّ **يخرج منها** لا
     يسكنها. فلا مربّعَ يُشبه مربّعًا، ولا حلقةَ مغلقةً تُشبه دائرةَ محطّةٍ تمتلئ.
     والانفتاحُ يقول «قيد الإنجاز» — وهو معنى المهمّة قبل أن تُشطب لا بعدَها.
     وهو من عائلة الصحّ ولا يُنكر: أوضحُ ما يقول «يُنجَز»، وقد فُرِّق بأقلّ ما يُفرَّق به */
  /* ===== شارةُ التحديث: سهمٌ صاعدٌ في حلقة =====
     «صدر أحدثُ ممّا عندك» — والصعودُ يقول «ارتقِ» لا «أعِد» (الحلقةُ الدوّارةُ تقول
     إعادةَ تحميلٍ، وليس ههنا تحميل). ولا تلتبس بحلقة المهمّة: تلك مفتوحةٌ وفيها صحّ */
  const JR_UPD_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"'
    + ' stroke-linecap="round" stroke-linejoin="round">'
    + '<circle cx="12" cy="12" r="8.4"/><path d="M12 16.4V8.2"/>'
    + '<path d="M8.5 11.7L12 8.2l3.5 3.5"/></svg>';
  const JR_TASK_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"'
    + ' stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M20.2 11.2v.8a8.2 8.2 0 1 1-4.9-7.5"/>'
    + '<path d="M9 11.8l3 3 8.4-8.6"/></svg>';
  /* ===== صفُّ البند الذي تملكه — والفصلُ صفٌّ آخر =====
     الفصلُ حبرٌ مقفلٌ (اسمُه من «المادة»)، وهذا **لك**: يُسمّى ويُحذف.
     فيعود إليه ما نُزع من الفصل: حقلُ الاسم الذي ينمو بالحرف، والسلّة.
     والأصنافُ أصنافُ المحرّر نفسِها (‎.vt-grow‎ و‎.cx-del‎) لترث جلدَها، والمفاتيحُ
     ‎jr-*‎ و‎data-r*‎ لئلّا تبلغها معالجاتُ محرّر البطائق (وهي تلتقط بالصنف وحدَه) */
  function roadMine(n, pid) {
    /* ===== وصفُّ البطاقة يعرض **اسمَها المشتقّ** ولا يُكتب فيه =====
       قاعدةُ ‎ROADMAP-CARD-NAMES‎: «بابُ نصّ البطاقة من صفّ الشجرة أُغلق — الصفُّ يعرض
       اسمَها المشتقَّ لا نصَّها، والتعديلُ في النافذة وحدها حيث ترى ما تفعل».
       فيُطبَّق ههنا حرفًا: صفُّ البطاقة حبرٌ يُنقر فتُفتح نافذتُها، وصفّا المجلد والمهمّة
       حقلان يُكتب فيهما (اسمُهما مكتوبٌ لا مشتقّ) */
    if (n.t === 'c' || n.t === 'q') {
      return `<div class="x3-hd jr-row jr-row--c" data-id="${n.id}" data-roid="${n.id}">
      <!-- ===== ومقبضُه نقاطُ المحرّر لا مربّعُ النشر =====
           مربّعُ النشر يقول «يُحدَّد» ولا يقول «يُسحب» — وذاك صوابٌ في رزمةِ غيرك: لا
           سحبَ فيها يُوعَد به. ودفترُك يُرتَّب، فيلبس مقبضَ المحرّر: ستُّ نقاطٍ تُجَرّ،
           وتنقلب صحًّا إذا حُدِّد صفُّها. وفعلاه في آلةٍ واحدة (‎vtS‎): ما دون عتبة
           الخمسة تحديدٌ، وما جاوزها سحب — فلا يُخترع لهما مستمعان -->
        ${VT_GRAB(true)}
        <button type="button" class="cx-fold cx-fold--tri x3-tg is-void" tabindex="-1" aria-hidden="true">${CX_TRI}</button>
        <!-- ===== واسمُه يُبنى بناءَ اسم المكتبة لا بناءً ثانيًا =====
             كان زرًّا واحدًا يقصّه ‎text-overflow: ellipsis‎ بثلاث نقاطٍ ومعناها «بقيّةٌ
             ذهبت». وفي المكتبة بناءٌ آخر: خانتان في صندوقٍ مقيسٍ بـ‎--cx-nm-w‎ — متنٌ
             يأخذ قدرَه ثمّ **حشوٌ يرسم خيطًا** يمدّ إلى آخر العمود، فتستوي رؤوسُ الأخبار
             في عمودٍ واحدٍ مهما اختلفت الأسماء. وذاك أدقُّ من النقاط: يقول «ينتهي ههنا»
             ويصنع عمودًا في آنٍ معًا.
             فيُنقل البناءُ كما هو (‎cx-nm‎ · ‎cx-nm__t‎ · ‎cx-nm__f‎) ومعه ‎dir‎ على المتن
             و‎data-num‎ للأسماء الرقميّة — وهي كلُّها في ‎cxRowView‎ بحروفها.
             و‎cx-open‎ حوضُ الضغط: هو زرُّ فتح البطاقة، فصار وعاءَ الأيقونة والاسم معًا -->
        <button type="button" class="cx-open jr-card" data-rcard="${n.id}"${pid ? ` data-rpid="${pid}"` : ''}>
          <span class="x3-vic">${cxKindIc(n)}</span>
          <span class="cx-nm${cardName(n) ? '' : ' is-ph'}">${cxNmBody(n, T().jrCardPh)}</span>
        </button>
        <!-- ===== وشارةُ التحديث ألصقُ شيءٍ بالاسم =====
             هي خبرٌ عن **هذه البطاقة** لا عن سعيك فيها، فتقف قبل مربّعك وقبل خبر الناس:
             ما يُقرأ أوّلًا يقف أوّلًا. وهي في المسار الذاتي وحدَه — ولا تُبنى إلّا
             للمستوردة، إذ لا أصلَ لغيرها يُقاس عليه -->
        ${n.upd ? `<span class="jr-upd" title="${esc(T().jrUpd1(n.upd))}"
          aria-label="${esc(T().jrUpd1(n.upd))}">${JR_UPD_IC}</span>` : ''}
        <!-- ===== ويسارَه شيئان، وحكمُهما مفترق =====
             · **مربّعُك** (‎cxMeHTML‎) لكلّ بطاقةٍ ههنا: هو حكمُك أنت على نفسك —
               مربّعٌ خاوٍ ما لم تُجب، ثمّ يمتلئ بعددٍ أخضرَ أو أحمر. وهو خبرٌ يصدق على
               ما صنعتَه بيدك كما يصدق على ما استوردتَه، فأنت تُذاكر كليهما.
             · **وخبرُ الناس** (‎cxNewsHTML‎) للمستورَد وحدَه: سبعتُه عن بطاقةٍ **نُشرت**
               — رآها كذا وعلّق كذا. وبطاقةٌ في دفترك لم تُنشر ولم يرها أحدٌ فأرقامُها
               أصفارٌ أبدًا، وسبعةُ أصفارٍ في صفٍّ خبرٌ كاذبٌ لا خبرٌ فارغ.
             والقيمُ تُقرأ من العقدة ومن ‎state.srs‎ بمعرّفها — والمستوردُ معرّفُه جديدٌ
             فيبدأ سجلُّه من الصفر، وهو الصواب: لم تُذاكرها بعد -->
        ${cxMeHTML(n)}
        ${n.imp ? cxNewsHTML('solo', cxNwFacts(n, null), { n }) : ''}
        <button type="button" class="cx-del jr-del" data-rdel="${n.id}"
          title="${esc(T().jrDel)}" aria-label="${esc(T().jrDel)}">${TRASH_IC}</button>
      </div>`;
    }
    /* ===== وصفُّ الفيديو =====
       لم يكن له فرعٌ ههنا، فكان يسقط في فرع المجلّد/المهمّة: حقلٌ خاوٍ عليه وجهُ مجلّدٍ
       واسمٌ نائبٌ يقول «مهمّة» — لأنّ الفيديو لا ‎name‎ يُقرأ له هناك ولا ‎f‎.
       ولم يظهر إلّا يومَ صار الاستيرادُ يُنزل فيديوهات.
       وهو **صفُّ قراءةٍ لا حقل**: اسمُ الفيديو من مصدره، وتحريرُه ههنا يفصله عن أصله
       بلا فائدة. فيلبس بنيةَ صفّ البطاقة نفسَها (‎cx-open--ro‎: لا حوضَ ولا مؤشّرَ يَعِد
       بضغطة)، ويأخذ مُدّتَه في طرفه كما يأخذها في المكتبة */
    if (n.t === 'v') {
      return `<div class="x3-hd jr-row jr-row--v" data-id="${n.id}" data-roid="${n.id}">
        ${VT_GRAB(true)}
        <button type="button" class="cx-fold cx-fold--tri x3-tg is-void" tabindex="-1" aria-hidden="true">${CX_TRI}</button>
        <!-- ===== ويُضغط فيُفتح في نافذته =====
             كان صفَّ قراءةٍ (‎cx-open--ro‎: لا حوضَ ولا مؤشّرَ يَعِد بضغطة) لأنّه لم يكن
             ثَمّ ما يُفتح. ولمّا صار للموقع مُشغّلٌ صار له مقصد، فيُردّ إليه وعدُه:
             ‎cx-open‎ بحوضه ومؤشّره — وهو زرٌّ لا سطر، فتبلغه لوحةُ المفاتيح -->
        <button type="button" class="cx-open jr-vid" data-rvid="${n.id}"
          title="${esc(T().vwPlay)}">
          <span class="x3-vic">${PK_IC.vid}</span>
          <span class="cx-nm${n.name ? '' : ' is-ph'}">${cxNmBody(n, T().cxNoName, n.name || '')}</span>
        </button>
        ${n.dur ? `<span class="x3-vdur">${esc(n.dur)}</span>` : ''}
        <!-- وخبرُه ثلاثةٌ لا سبعة (‎CX_NW_HAS.path‎): حفظوه · رأوه · علّقوا.
             ويسقط ما لا يخصّ الشرحَ ولا يخصُّك: التحذيرُ والاقتراحُ خبرا **إصلاحٍ**
             لصاحب الرزمة ولستَ صاحبَها، وحكمُ الجواب (‎ok/no‎) خبرُ بطاقةٍ لا شرح.
             وهو الصنفُ نفسُه الذي في مسار نافذة الدورة — فالشرحُ يُقرأ قراءةً واحدة -->
        ${n.imp ? cxNewsHTML('path', cxNwFacts(n, null), { n }) : ''}
        <button type="button" class="cx-del jr-del" data-rdel="${n.id}"
          title="${esc(T().jrDel)}" aria-label="${esc(T().jrDel)}">${TRASH_IC}</button>
      </div>`;
    }
    const ph = n.t === 'k' ? T().jrTaskPh : T().jrFoldPh;
    const val = (n.t === 'f' ? n.name : n.f) || '';
    const head = n.t === 'k'
      ? `<button type="button" class="jr-chk${n.dn ? ' on' : ''}" data-rchk="${n.id}"
           title="${esc(T().jrAddK)}" aria-pressed="${n.dn ? 'true' : 'false'}"></button>`
      /* ===== ووجهُ مجلّدك في «رحلتي» زرٌّ كوجهه في المحرّر =====
         الطوقُ المرقَّط عند المرور (‎button.x3-fic::after‎) وقائمةُ اللون والإيموجي
         (‎openFolderMenu‎) كلاهما معلَّقٌ بأن يكون الوجهُ **زرًّا** لا سطرًا: الأوّلُ
         بمنتقي ‎button.x3-fic‎، والثاني بمستمعٍ على ‎document‎ يلتقط ‎.cx-face‎.
         فلا يُنسخ لهما شيء: يُبدَّل الوسمُ فيرثهما معًا.
         والفصلُ لا يلبسه: وجهُه دائرةُ محطّته لا مجلّد، ولونُه من «المادة» لا منك */
      : `<button type="button" class="x3-fic cx-face" data-id="${n.id}" style="color:${folderColor(n)}"
          title="${esc(T().ffTitle)}" aria-label="${esc(T().ffTitle)}"
          aria-haspopup="true">${folderFace(n)}</button>`;
    return `<div class="x3-hd jr-row jr-row--${n.t}${n.dn ? ' is-dn' : ''}" data-id="${n.id}" data-roid="${n.id}">
      ${VT_GRAB(true)}
      <!-- ===== وخانةُ المثلّث تُحجز في الصفوف كلِّها =====
           البطاقةُ والمهمّةُ لا تنفتحان، فلا مثلّثَ لهما. ولو حُذف الزرُّ لَبدأ صفُّهما
           قبل صفّ الفصل بعشرين بكسلًا، فتكسّر عمودُ الرموز في الشجرة الواحدة.
           فيُوسَم ‎is-void‎: خانةٌ محجوزةٌ لا يُرى فيها شيءٌ ولا يُنقر — وهي قاعدةُ
           صفّ البطاقة في محرّر البطائق حرفًا (‎cxCardBlock‎) -->
      <button type="button" class="cx-fold cx-fold--tri x3-tg${n.t === 'f' && (n.ch || []).length ? '' : ' is-void'}"${n.t === 'f' && (n.ch || []).length ? ` data-rfold="${n.id}" title="${n.open === false ? T().pkExpand : T().pkCollapse}"` : ' tabindex="-1" aria-hidden="true"'}>${CX_TRI}</button>
      <span class="x3-fwrap" style="--fc:${n.t === 'f' ? folderColor(n) : 'var(--u-line)'}">
        ${head}
        <span class="vt-grow vt-grow--f${val ? '' : ' is-ph'}" data-v="${esc(val) || ph}">
          <input class="jr-in" data-rid="${n.id}" size="1" placeholder="${esc(ph)}" value="${esc(val)}">
        </span>
      </span>
      <!-- وعلى المجلّد **عددٌ** لا شارةٌ عارية: تحته بطائقُ عدّة، فالمقصودُ كم منها
           جاءها تحديثٌ لا أنّ ثَمّ تحديثًا. والعدُّ يمشي في العمق فيبلغ جوفَ جوفه -->
      ${n.t === 'f' ? (c => c ? `<span class="jr-upd jr-upd--n" title="${esc(T().jrUpdN(c))}"
        aria-label="${esc(T().jrUpdN(c))}">${JR_UPD_IC}<b>${c}</b></span>` : '')(impCnt(n.ch)) : ''}
      <button type="button" class="cx-del jr-del" data-rdel="${n.id}"
        title="${esc(T().jrDel)}" aria-label="${esc(T().jrDel)}">${TRASH_IC}</button>
    </div>`;
  }
  /* ============================================================
     دائرةُ الاكتمال على كلّ صفٍّ في «رحلتي»
     ============================================================
     هي ‎x3DotAns‎ بعينها التي في شجرة النشر: زجاجةٌ يرتفع ماؤها بقدر ما أُجيب من وحداتها،
     ولونُه بقدر ما أُصيب. ولا تُعاد كتابةُ حسابها — ‎x3Ans‎ تمشي على ‎state.srs‎ نفسِه،
     فما تراه في رزمةٍ منشورةٍ هو ما تراه في دفترك.
     · **الفصلُ والمجلد** ⇐ حسابُ ما في جوفهما (‎f.ch‎).
     · **البطاقةُ** ⇐ حسابُ نفسِها (‎[n]‎) — فيُقرأ الصفُّ الواحد كما تُقرأ الرزمة.
     · **والمهمّةُ والملفّ** لا سجلَّ لهما فلا دائرةَ: الزجاجةُ خبرٌ عن مذاكرة، ولا مذاكرةَ
       في مهمّةٍ تُشطب. وخانتُها تبقى محجوزةً فلا يزيغ عمودُ الصفوف */
  /* ============================================================
     دائرةُ المحطّة في «رحلتي» — ومَن يستحقّها
     ============================================================
     · **المجلّدُ والفصلُ** يأخذانها في كلّ مستوًى: هما وعاءٌ، ودائرتُهما مجموعُ ما فيهما.
     · **والبطاقةُ والفيديو** في **المستوى الأوّل وحدَه**: هناك هي محطّةٌ في الطريق،
       وفي جوف مجلّدٍ هي تفصيلٌ من تفاصيله — ودائرةٌ لكلّ تفصيلٍ تُحيل الطريقَ إلى
       سلسلةٍ لا تُقرأ. (وهو حكمُ ‎cxTreeView‎ في المكتبة: «الدرجةُ الأولى محطّة،
       وما تفرّع تحتها فتفصيلُها لا محطّةٌ ثانية»).
     · **والمهمّةُ** لا تأخذها أبدًا: خبرُ إتمامها مربّعُها الذي يُضغط.
     ===== ولا يُبنى عنصرٌ مخفيّ =====
     كان غيرُ المستحقّ يأخذ ‎<span class="x3-dot is-void">‎ — عنصرًا قائمًا بـ‎visibility:
     hidden‎. وذاك **يُبقي الوتدَ**: الخيطُ الأفقيُّ معلَّقٌ بـ‎.x3-st:has(> .x3-dot)‎،
     وهي تسأل عن **الوجود** لا عن الرؤية. فكان الصفُّ بلا دائرةٍ وله خيطٌ يصل إلى لا شيء.
     ولا حاجةَ إلى الحجز أصلًا: الدائرةُ ‎absolute‎ فلا تشغل حيّزًا في الصفّ، وحذفُها
     لا يزحزح شيئًا. فيُردّ نصًّا خاويًا، فيسقط الخيطُ معها بلا قاعدةٍ ثانية */
  /* ============================================================
     دائرةُ الفصل المختلط — لغتان لا لغةٌ واحدة
     ============================================================
     دائرةُ الاكتمال في الأصل **لغةُ بطائق**: ماءٌ يرتفع بقدر ما أُجيب، ولونُه أخضرُ
     بقدر ما أُصيب وأحمرُ بقدر ما أُخطئ. وهي صادقةٌ ما دام الجوفُ بطائقَ كلَّه —
     «صواب/خطأ» معنًى لا يقع إلّا عليها.
     ومجلّدُ «رحلتي» يسع ثلاثةَ أجناس: بطائقُ ومهامٌّ وشروح. والمهمّةُ لا تُصاب ولا
     تُخطأ — تُشطب أو لا تُشطب؛ والشرحُ يُشاهَد أو لا يُشاهَد. فحسابُ الصواب عليهما
     كذبٌ في اللون قبل أن يكون خطأً في العدد.
     ===== فإن اختلط الجوفُ تبدّلت اللغة =====
     لا صوابَ ولا خطأ، بل **إنجازٌ**: كلُّ بندٍ سهمٌ واحدٌ من المئة (فتكون حصّةُ كلّ
     جنسٍ بقدر عدده من نفسِها، بلا وزنٍ يُخترع)، وتمامُه بحسب جنسه:
       · بطاقةٌ  ⇐ أُجيبت كلُّ أوجهها وآخرُ حكمٍ فيها صواب.
       · شرحٌ    ⇐ اكتملت مشاهدتُه.
       · مهمّةٌ  ⇐ شُطبت.
     واللونُ ذهبيٌّ لا أخضرُ ولا أحمر — وهو لونُ **التقدُّم** في هذا الموقع
     (‎.x3-lq‎ سائلُ ‎x3Dot‎)، والأخضر/الأحمر لونا **الحكم**. فاللونُ يقول أيَّ لغةٍ تُقرأ.
     ============================================================ */
  const roadKinds = ns => (ns || []).reduce((a, n) => {
    if (n.t === 'f') { const b = roadKinds(n.ch); a.c += b.c; a.v += b.v; a.k += b.k; return a; }
    if (n.t === 'v') a.v++; else if (n.t === 'k') a.k++; else a.c++;
    return a;
  }, { c: 0, v: 0, k: 0 });
  /* وتمامُ البند يُقاس بآلته هو — والبطاقةُ تُسأل ‎x3Ans‎ نفسَها فتصحّ لذوات الأوجه */
  const roadDone = n => n.t === 'v' ? (x3Watch(n) >= 1)
    : n.t === 'k' ? !!n.dn
    : ((a) => a.n > 0 && a.k >= a.n && a.c >= a.n)(x3Ans([n]));
  const roadPct = ns => {
    const ls = [];
    (function w(a) { (a || []).forEach(x => x.t === 'f' ? w(x.ch) : ls.push(x)); })(ns);
    return ls.length ? ls.filter(roadDone).length / ls.length : 0;
  };
  /* ===== ودائرةُ الأمّ: مجموعُ «تقدمي الذاتي» كلِّه =====
     تسكن غلافَ الكتاب الكبير في بِكرة الترم — حيث يتنقّل الطالبُ بين موادّه — وحسابُها
     حسابُ **فصلٍ مداه الرحلةُ كلُّها**: إن خلا من الشروح والمهامّ فهي حكمٌ (أخضر/أحمر)،
     وإن خالطها شيءٌ منهما فهي تقدُّمٌ ذهبيّ.
     فلا قاعدةَ ثانية تُخترع — هي القاعدةُ نفسُها على الجذر بدل الفرع، فما تراه على
     الغلاف مجموعُ ما تراه تحته حقًّا لا رقمًا يُحسب على حِدة.
     وتُطوى إن خلت الرحلةُ: دائرةٌ لا شيءَ تحتها خبرٌ عن لا شيء — ويبقى غلافُ ‎.cstat‎
     خاويًا كما كان قبل اليوم */
  /* ===== وهل في الدائرة شيءٌ أصلًا؟ =====
     سؤالُ فلترِ «حالة المادة»، وجوابُه **من الدائرة لا من جنبها**: لو حُسب ههنا بقاعدةٍ
     ثانية لَجاء يومٌ تقول فيه الرقاقةُ «متبقية» والغلافُ تحتها فيه ماء.
     فيُسأل ما تسأله الرسمةُ سواءً بسواء: المختلطُ يُسأل ‎roadPct‎ (أتمّ بندًا؟)،
     والبطائقُ تُسأل ‎x3Ans().k‎ (أُجيبت وحدةُ سؤالٍ واحدة؟) — وهي ‎lvl‎ بعينها بسطًا
     ومقامًا، فما يُرى ماءً في الغلاف يُقرأ «بدأت» في الفلتر */
  function roadStarted(arr) {
    const q = roadKinds(arr);
    if (!q.c && !q.v && !q.k) return false;
    return (q.v || q.k) ? roadPct(arr) > 0 : x3Ans(arr).k > 0;
  }
  /* ومادّةُ المعمل خيطان: بدءُ أحدهما بدءٌ للمادّة — ولا يُشترط أن يبدأهما معًا */
  /* ===== ويُحفظ الجوابُ لطول الرسمة الواحدة =====
     الفلترُ يسأل عن **كلّ** مادّة في الكتالوج، والرسمةُ تقع عند كلّ حرفٍ يُكتب في البحث.
     والسؤالُ ليس رخيصًا: يمشي على أوراق الرحلة، و‎cxRecsOf‎ تفصّل أوجهَ البطاقة (والفراغُ
     يُفكّ بمُطابقٍ نصّيّ) — فرحلةٌ فيها ألفٌ وسبعُمئة بطاقةٍ تُمشى مرّةً في كلّ حرف.
     والحالُ لا تتبدّل في أثناء الرسمة الواحدة، فيُحفظ الجوابُ ويُمحى عند مطلع كلّ رسمة.
     ولا يُطال عمرُه أكثر: مذاكرةٌ بين رسمتين يجب أن تُغيّر الرقاقةَ في التي تليها */
  const csMemo = new Map();
  function courseStarted(code) {
    if (csMemo.has(code)) return csMemo.get(code);
    const v = isLab(code)
      ? (roadStarted(roadArrAll(code, 'محاضرة')) || roadStarted(roadArrAll(code, 'معمل')))
      : roadStarted(roadArrAll(code, null));
    csMemo.set(code, v);
    return v;
  }
  /* والرسمةُ مفصولةٌ عن مصدرها: تُعطى قائمةَ بنودٍ ولا تسأل من أين جاءت — فيستوي
     عليها رفُّ الترم (رحلةُ مدخلة) والمكتبةُ (رحلاتُ الأترام موصولةً) بقاعدةٍ واحدة */
  function roadDotOf(arr) {
    const q = roadKinds(arr);
    if (!q.c && !q.v && !q.k) return '';
    return (q.v || q.k) ? x3Dot(roadPct(arr)) : x3DotAns(x3Ans(arr));
  }
  function roadTopDot(entry, act) { return roadDotOf(roadArr(entry, act)); }
  /* ===== وتُعاد وحدَها لا بإعادة بناء الرفّ =====
     الرفُّ بِكرةٌ لها موضعٌ ودورانٌ وكتابٌ متمركز، وإعادةُ بنائه لرقمٍ تبدّل تهدم ذلك
     كلَّه. فتُكتب الدائرةُ في ركنها وحدَها — وهو حكمُ خانةِ الدرجة وعدّادِ الغياب نفسُه.
     ومادّةُ المعمل كتابان في صفٍّ واحد، فيُطلى كلاهما كلٌّ من رحلته */
  /* والرفوفُ ثلاثةٌ لا واحد: رفُّ الترم (‎#lib-grid‎) والمكتبةُ (‎#m-grid‎) ونافذةُ
     الإضافة (‎#mm-grid‎) — والكتابُ واحدٌ فيها كلِّها، فلا يقول غلافُه ثلاثةَ أقوال.
     ومفتاحُ الصفّ يفترق: ‎data-info‎ في الرفّ والمكتبة، و‎data-add‎ في نافذة الإضافة.
     وما لا ‎.cstat‎ فيه (مادّةٌ ليست في أترامك) يُتخطّى من نفسه */
  function nkStatPaint(entry) {
    const en = entry || nookEntry;
    if (!en) return;
    const put = (row, act) => {
      const h = isLab(en.code)
        ? row.querySelector('.cimg--book[data-act="' + act + '"] .cstat')
        : row.querySelector('.cstat');
      if (!h) return;
      /* رفُّ الترم يقول رحلةَ **هذا** الترم، وما سواه يقول مجموعَ الأترام */
      h.innerHTML = row.closest('#lib-grid')
        ? roadTopDot(en, act) : roadDotOf(roadArrAll(en.code, act));
    };
    document.querySelectorAll('.crow[data-info], .crow[data-add]').forEach(row => {
      if ((row.dataset.info || row.dataset.add) !== en.code) return;
      if (isLab(en.code)) { put(row, 'محاضرة'); put(row, 'معمل'); } else put(row, null);
    });
  }
  const roadDot = (n, k) => {
    if (n.t === 'f') {
      const q = roadKinds(n.ch);
      return (q.v || q.k) ? x3Dot(roadPct(n.ch)) : x3DotAns(x3Ans(n.ch || []));
    }
    if ((k || 0) !== 0) return '';
    /* والفيديو يُقاس بمشاهدته لا بإجاباته — وهي قسمةُ ‎x3Ep‎ في المكتبة بعينها.
       و‎x3Watch‎ اليومَ ردٌّ ثابتٌ بصفر، فدائرتُه خاويةٌ ههنا كما هي هناك سواءً:
       فإن بُني التتبّعُ يومًا امتلأتا معًا بلا سطرٍ يُعدَّل في أحدهما */
    if (n.t === 'v') return x3Dot(x3Watch(n));
    return (n.t === 'c' || n.t === 'q') ? x3DotAns(x3Ans([n])) : '';
  };
  /* ===== وقضبانُ الجوف تُوضع حيث تكون دوائر =====
     المستوى الفرعيُّ لا يأخذ قضيبًا إلّا إن كان فيه **مجلّد**: البطاقةُ والفيديو لا
     دائرةَ لهما دون المستوى الأوّل (انظر ‎roadDot‎)، فمستوًى كلُّه بطائقُ لا محطّةَ فيه
     — وقضيبٌ بلا دوائرَ خيطٌ معلَّقٌ في الهواء.
     وهو شرطُ ‎cxTreeView‎ نفسُه في المكتبة (‎kids‎)، و‎cxRailFit‎ تحرسه مرّةً ثانية:
     ما لم تجد فيه محطّتين كتبت له ‎--jr-h: 0‎ فانعدم من نفسِه */
  function roadTree(nodes, k, pid) {
    k = k || 0;
    let ci = 0;   /* ترتيبُ الفصول وحدَها — ما تملكه لا يُرقَّم في الدائرة */
    return (nodes || []).map(f => {
      if (f.tp !== 1) return `<div class="x3-st${f.open === false ? '' : ' on'}" style="--o:${X3IND(k)}px">
        ${roadDot(f, k)}
        ${roadMine(f, pid)}
        ${(f.t === 'f' && f.open !== false && (f.ch || []).length)
          ? (kids => `<div class="x3-sub${kids ? ' has-rail' : ''}"
            style="--pad:${CX_IND}px;--jd:${k + 1}"
            >${roadTree(f.ch, k + 1, f.id)}</div>`)((f.ch || []).some(x => x.t === 'f')) : ''}
      </div>`;
      const i = ci++;
      return `<div class="x3-st${f.open === false ? '' : ' on'}" style="--o:${X3IND(k)}px">
      ${roadDot(f, k)}
      <!-- ولا مقبضَ سحبٍ كذلك: الترتيبُ ترتيبُ «المادة»، تعيده ‎roadSync‎ في كلّ رسمة —
           فمقبضٌ يَعِد بجرٍّ يُمحى بعد لحظةٍ أسوأُ من مقبضٍ لا يكون. ويعود يومَ يُسحب
           ما **في جوف** الفصل (بطائقُ وملفّات) — وآلتُه محفوظةٌ له (‎vtDeckOf‎) -->
      <div class="x3-hd" data-id="${f.id}" data-roid="${f.id}">
        ${VT_GRAB(true)}
        <!-- ===== ومثلّثُ الفصل يبقى ولو خلا — وحدَه من بين الأشجار =====
             حكمُ «الخاوي لا مِفصلَ له» يجري في الأشجار الأربع (محرّرا البطائق والشروح
             وشجرتا نشرهما) ويُستثنى منه هذا الموضع بحكم صاحب الموقع.
             والفرقُ أنّ ما ثَمّ **مجلداتٌ**، والمجلدُ يقول بجسمه إنّه ظرفٌ يُوضع فيه —
             فمثلّثُه إخبارٌ عن حالٍ، وإخفاؤه على الخاوي صدقٌ لا خسارة.
             وهذه **عناوينُ مواضيع**: نصٌّ لا يقول إنّه يُملأ. فالمثلّثُ ههنا ليس إخبارًا
             عن حالٍ بل **دعوةٌ**: «هذا الفصلُ ينفتح، وفيه موضعٌ لِما تبني». ومن لم يره
             لم يعلم أنّ للعنوان جوفًا أصلًا.
             فيبقى ولو خلا، ويدور بالضغط فيُري خلاءه — وذلك أصدقُ من زرٍّ لا يكون -->
        <button type="button" class="cx-fold cx-fold--tri x3-tg${(f.ch || []).length ? '' : ' is-hollow'}"
          data-rfold="${f.id}"
          title="${(f.ch || []).length ? (f.open === false ? T().pkExpand : T().pkCollapse) : T().jrHollow}"
          >${CX_TRI}</button>
        <span class="x3-fwrap${f.em ? ' has-em' : ''}" style="--fc:${folderColor(f)}">
          <!-- ===== ولا مجلدَ في صدر الصفّ: الدائرةُ هي الأيقونة =====
               صفُّ الموضوع في «المادة» ‎① فـ3 اسمُ الموضوع‎ (‎topicRowsHTML‎) — دائرةُ
               ترتيبٍ ثمّ وسمُ الفصل ثمّ الاسم. فيُنسخ ترتيبُه ههنا حرفًا: الدائرةُ
               ‎.tp-order‎ تقوم مقامَ رمز المجلد، والوسمُ ‎.tp-tag‎ يسبق العنوان.
               ولا رمزَ مجلدٍ معها: رمزان في صدر صفٍّ واحدٍ يتنازعان، والدائرةُ أدلُّ —
               تقول «الفصلُ الثالث» ورمزُ المجلد يقول «مجلد»، وذلك ما لا يُسأل عنه.
               والدائرةُ **ترتيبُ الصفّ** والوسمُ **رقمُ الفصل**: هما رقمان لا واحد،
               وهي قسمةُ «المادة» نفسُها (‎idx + 1‎ في القرص و‎num‎ بعد «فـ») -->
          <!-- والقرصُ يقرأ ‎tpi‎: ترتيبَ الفصل في «المادة». والقديمُ الذي لم يُصالَح
               بعدُ يقرأ موضعَه كما كان، فلا يظهر قرصٌ خاوٍ لبطاقةٍ قديمة -->
          <span class="tp-order jr-ord">${f.tpi || (i + 1)}</span>
          <!-- والوسمُ يسقط بلا رقم: «فـ» عاريةً في فصلٍ أضفتَه بيدك ولم ترقّمه بعدُ
               ضجيجٌ لا خبر. فإذا رقّمتَه ظهر -->
          ${String(f.num || '').trim() ? `<i class="tp-tag">${T().chTag}${esc(String(f.num).trim())}</i>` : ''}
          <!-- والاسمُ حبرٌ لا حقل: التحكّمُ بالفصول في مربّع «المادة» وحدَه.
               وحقلٌ يُكتب فيه ثمّ لا يُحفظ أسوأُ من حبرٍ لا يُكتب فيه أصلًا -->
          <b class="jr-nm${f.name ? '' : ' is-ph'}">${esc(f.name) || T().chNamePh}</b>
        </span>
      </div>
      ${(f.open !== false && (f.ch || []).length)
        ? (kids => `<div class="x3-sub${kids ? ' has-rail' : ''}"
            style="--pad:${CX_IND}px;--jd:${k + 1}"
            >${roadTree(f.ch, k + 1, f.id)}</div>`)((f.ch || []).some(x => x.t === 'f')) : ''}
    </div>`;
    }).join('');
  }
  /* ===== والمصالحةُ تُحفظ إن غيّرت =====
     ‏‎roadSync‎ تُنشئ عقدًا بمعرّفاتٍ من ‎newId‎ (وهو يزيد ‎state.pid‎)، وتطرح اليتامى.
     فلو لم تُحفظ لَأُعيد إصدارُ المعرّفات في كلّ إقلاع. والحفظُ **مشروطٌ بالفرق**:
     رسمةٌ لم تُغيّر شيئًا لا تكتب في الدرج — والرسمُ يقع مع كلّ طيّة فصل */
  function roadSyncSave(entry) {
    const r = roadSync(entry);
    /* ومعها مسحةُ التحديث: تُمحى ذاكرةُ الأصول أوّلًا لأنّ صاحبَ المساهمة قد نشر
       بين رسمتين — والذاكرةُ لطول الرسمة لا أكثر */
    impMemo.clear();
    const u = impSync(r.list);
    if (r.changed || u) save();
    return r.list;
  }
  /* ===== وعاد القضيبُ إذ صارت للشجرة محطّات =====
     نُزع يومَ لم يكن فيها دوائرُ (قضيبٌ بلا محطّاتٍ خيطٌ لا معنى له). وقد صار لكلّ صفٍّ
     دائرةُ اكتمال، فالمحطّاتُ قائمةٌ والقضيبُ يصلها — وهي «رحلة» باسمها */
  const roadBodyHTML = list => list.length
    /* ===== وتلبس ‎cx-ro‎ مع ‎cx-tree‎ =====
       جلدُ مقبض التحديد كلُّه مقصورٌ على ‎.x3.cx-ro‎ (خافتٌ ساكنًا، يظهر بمرور المؤشّر
       على الصفّ، ويشتدّ إن قُصد أو حُدِّد). وشجرةُ «رحلتي» تُحدَّد كما تُحدَّد شجرةُ
       النشر سواءً بسواء، فتلبس صنفَها فترث ثماني قواعدَ بلا سطرٍ يُنسخ.
       ثمّ رُدَّ حين صار المقبضُ مقبضَ المحرّر (‎VT_GRAB‎): جلدُ ذاك على ‎.pk--edit‎
       والمربّعُ يلبسها، وقواعدُ الرحلة تجمع الشجرتين أصلًا — فلا يُفقد بردّه شيء */
    ? `<div class="x3 cx-tree jr-peek">${roadTree(list, 0)}</div>`
    : `<p class="jr-none">${esc(T().jrEmpty)}</p>`;
  function nookRoadBox(entry) {
    /* ولا ذيلَ للمربّع: ذهب «أضف فصلًا» و«أنزل المواضيع» معًا — الأوّلُ لأنّ الفصولَ
       لا تُنشأ ههنا، والثاني لأنّ المرآةَ تُغني عن الإنزال */
    /* ===== وحبّةُ الإضافة في صدر المربّع يسارًا =====
     ‏‎addGroup‎ هي بعينها التي في ذيل محرّر البطائق: حبّةٌ تنفرج **أفقيًّا** عن رموزها
     (‎max-width‎ من صفرٍ إلى ‎170‎)، فيستوي موضعُها أعلى الصندوق كما استوى في ذيله —
     ولا تحتاج جهةً ثانيةً للانفتاح. وجلدُها كلُّه مقصورٌ على ‎.pk--edit‎، والمربّعُ
     يلبسه، فلم يُكتب لها سطرُ تنسيقٍ واحد إلّا موضعَها.
     والأصنافُ ‎jr-add*‎ لا ‎cx-add*‎: تلك يلتقطها معالجُ محرّر البطائق **بالصنف وحدَه**
     ثمّ يسأل ‎edPack()‎ — فتنزل بطاقتُك في رزمةِ مساهمةٍ لا في رحلتك */
    return `<div class="nk-sq nk-jr pk--edit" id="nk-road">
      <h3 class="nk-t">${T().nkSelfProgress}</h3>
      ${addGroup([
        /* ورمزُ البطاقة رمزُها في شريط إضافة المحرّر (‎cxAddBtns‎): ‎PK_IC.card‎ لا
           ‎card1‎. والثاني رزمةٌ **مفردة** الوجه — موضعُه الصفُّ حيث يُقال «هذه بطاقةٌ
           واحدة»؛ وزرُّ الإضافة يقول «أضف بطاقة»، فيلبس رمزَ الجنس لا رمزَ المفرد.
           والفعلُ واحدٌ في الموضعين، فلا يفترق رمزُه.
           ولا تعليقَ وسمٍ ههنا: هذه **مصفوفةُ نصوصٍ** لا قالبٌ، و‎<!-- -->‎ فيها نحوٌ فاسد */
        `<button type="button" class="jr-addc" title="${esc(T().jrAddC)}">${PK_IC.card}</button>`,
        `<button type="button" class="jr-addf" title="${esc(T().jrAddF)}">${PK_IC.folder}</button>`,
        `<button type="button" class="jr-addk" title="${esc(T().jrAddK)}">${JR_TASK_IC}</button>`,
        `<button type="button" class="jr-addi" title="${esc(T().jrAddI)}"` +
        ` aria-label="${esc(T().jrAddI)}">${JR_IMP_IC}</button>`,
      ])}
      <div class="jr-body">${roadBodyHTML(roadSyncSave(entry))}</div>
    </div>`;
  }
  /* ورسمُ الرحلة وحدَها: القُمرةُ لا تُهدم لأنّ فصلًا طُوي أو سُمّي — والمقاساتُ المحفوظةُ
     للمربّعات الأربعة تُلبَس في ‎nkSzApply‎، فإعادةُ بنائها لرقمٍ تبدّل هدمٌ بلا ثمن */
  /* ============================================================
     ردُّ المِفصل الخاوي — ‎empty-fold-lab#h1‎ «المركَّب» بحكم صاحب الموقع
     ============================================================
     مثلّثُ الفصل في «رحلتي» يبقى ولو خلا الفصلُ — وحدَه من بين الأشجار — لأنّه **دعوةٌ
     لا إخبارٌ عن حال: «هذا الفصلُ ينفتح، وفيه موضعٌ لِما تبني»** (ROADMAP-NOOK-PROGRESS §١٩).
     وثمنُ الدعوة أنّها تَعِد بما قد لا يكون. فإذا ضُغط وهو خاوٍ **لم يُترك يلفّ كاملًا**:
     يقطع بعضَ التسعين، يقف لحظةً، ثمّ يرتدّ — ويرتجّ الاسمُ معه ويخفت حبرُه.
     ثلاثةُ أصواتٍ لمعنًى واحد: «فُتح، ولم يكن فيه شيء».
     ===== وقبل الضغط: خفوتٌ بدرجة =====
     المثلّثُ الخاوي أخفتُ من العامر أصلًا (‎.is-hollow‎ في الجلد) — فالخبرُ يُقرأ قبل
     اللمس لا بعده، ولا يُضطرّ المستخدمُ إلى ضغطِ كلّ فصلٍ ليعلم أيُّها خاوٍ.
     ===== والحركةُ بـ‎Web Animations‎ لا بـ‎@keyframes‎ =====
     الردّةُ ثلاثُ محطّاتٍ نِسَبُها محسوبةٌ من ثلاثة أزمنة (ذهابٌ ووقفةٌ وردّة)،
     ونِسَبُ ‎@keyframes‎ ساكنةٌ لا تُحسب. وهي حركةٌ عابرةٌ لا حال، فلا أثرَ لها في الجلد.
     ============================================================ */
  const NF = { deg: 45, go: 130, hold: 90, back: 260, amp: 3, n: 3, shake: 300,
    ease: 'cubic-bezier(.34,1.56,.64,1)' };
  function roadNope(btn) {
    const hd = btn.closest('.x3-hd'), nm = hd ? hd.querySelector('.x3-fwrap') : null;
    if (!btn.animate) return;
    /* ومن كره الحركةَ لم تُفرض عليه — والخفوتُ الساكنُ يكفيه خبرًا */
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    /* ولا تتراكم: ضغطتان متتاليتان حركةٌ واحدةٌ تُستأنف لا حركتان تتنازعان الصفّ.
       والإلغاءُ يُقصر على الزرّ والاسم: ‎getAnimations({subtree:true})‎ على الصفّ تجرف
       معها انتقالاتِ CSS الجاريةَ (وتدُ المحطّة وحبرُ المثلّث) فتقطعها في منتصفها */
    [btn, nm].forEach(el => el && el.getAnimations().forEach(a => a.cancel()));
    /* والحدُّ المطويُّ يتبع اللغة: ‎90‎ في العربيّة و‎-90‎ في الإنجليزيّة (‎styles.css‎)،
       والوقوفُ يقطع منه نحو الصفر — فتُقرأ الحركةُ «همَّ بالفتح» في الجهتين سواءً */
    const c = state.lang === 'en' ? -90 : 90;
    const stop = c - Math.sign(c) * NF.deg;
    const T = NF.go + NF.hold + NF.back;
    btn.animate([
      { offset: 0, transform: `rotate(${c}deg)` },
      { offset: NF.go / T, transform: `rotate(${stop}deg)`, easing: 'cubic-bezier(.22,.61,.36,1)' },
      { offset: (NF.go + NF.hold) / T, transform: `rotate(${stop}deg)`, easing: NF.ease },
      { offset: 1, transform: `rotate(${c}deg)` },
    ], { duration: T, fill: 'none' });
    /* ===== والخفوتُ يُقاس من أرضيّته =====
       المثلّثُ الخاوي على ‎.55‎ أصلًا، فحركةٌ تبدأ من ‎1‎ **تُشعله** قبل أن تُخفته —
       ومضةٌ بيضاء عكسُ المراد. فتُقرأ أرضيّتُه من الجلد ويُضرب فيها المقدار، فتصحّ
       الحركةُ للخاوي وللعامر معًا بلا فرعين */
    const op = parseFloat(getComputedStyle(btn).opacity) || 1;
    btn.animate([{ opacity: op }, { offset: .4, opacity: op * .38 }, { opacity: op }],
      { duration: NF.shake, easing: 'ease-in-out', fill: 'none' });
    if (!nm) return;
    /* والرجفةُ تخفت سعتُها في كلّ ذهبةٍ فتنتهي إلى سكون، ولا تقف فجأةً على طرفها */
    const f = [{ offset: 0, transform: 'translateX(0)' }];
    for (let i = 1; i <= NF.n; i++) {
      const a = NF.amp * (1 - (i - 1) / (NF.n + 0.6));
      f.push({ offset: (i - 0.5) / NF.n, transform: `translateX(${i % 2 ? a : -a}px)` });
      f.push({ offset: i / NF.n, transform: 'translateX(0)' });
    }
    nm.animate(f, { duration: NF.shake, easing: 'ease-in-out', fill: 'none' });
  }

  function roadRender() {
    const box = document.getElementById('nk-road');
    if (!box || !nookEntry) return;
    const b = box.querySelector('.jr-body');
    if (b) b.innerHTML = roadBodyHTML(roadSyncSave(nookEntry));
    /* والأسماءُ تُقاس بعد البناء: ‎cxNameFit‎ تقرأ ‎scrollWidth‎ وهو لا يُقرأ قبل الوجود.
       وموضعُها ههنا لا في ‎renderCmSection‎: تلك لا تمرّ على الرَّكن أصلًا */
    cxNameFit();
    /* ===== وقضيبُ الرحلة كذلك — وغيابُه كان عطبًا صامتًا =====
       ‏‎.x3::before‎ يقرأ طرفَيه من ‎--jr-t‎ و‎--jr-h‎، ولا يكتبهما إلّا ‎cxRailFit‎ بعد
       الرسم (من مركز أوّل دائرةٍ إلى مركز آخرها — ولا يُحسبان، لأنّ آخرَ محطّةٍ قد تكون
       في جوف مجلّدٍ مفتوحٍ لا يُعرف ارتفاعُه إلّا بعد التخطيط).
       وكانت تُنادى من ثلاثة مواضع **لا واحدَ منها يمرّ على الرَّكن**: ‎renderCmSection‎
       ومحرّرا الشروح والبطائق. فبقيت القيمتان على الافتراض ‎0px‎ — والقضيبُ **مرسومٌ
       بارتفاع صفرٍ** لا محذوف، فالدوائرُ تقف بلا خيطٍ يجمعها. ولا يصيح شيء */
    cxRailFit();
    nkInfoFill();
    nkSbSync();
    /* ودائرةُ الأمّ في غلاف الرفّ تتبع بنيها: هي مجموعُهم، فلو لم تُعد لَبقيت على
       حسابٍ ماضٍ حتى يُعاد بناءُ الرفّ كلِّه */
    nkStatPaint();
    /* والتحديدُ يُطلى بعد البناء: الصفوفُ وُلدت من جديدٍ فذهبت أصنافُه، والحالُ باقيةٌ
       في ‎cxSel‎ — فلولا الطِّلاءُ لَبدا التحديدُ ذاهبًا وهو قائم (حكمُ شجرة النشر نفسُه) */
    if (cxRoadSel) cxPaintSel();
  }

  /* ============================================================
     نافذةُ «استورد من المكتبة» — بابان ثمّ مساهماتُ القسم
     ============================================================
     ولا يُبنى عارضٌ ثانٍ للمساهمات: ‎#cm-ui‎ يُنقل إلى جوف النافذة كما يُنقل إلى رفّ
     الموارد (‎openNookRes‎)، ثمّ ‎fillCourseUI‎ و‎showCmTab‎ — فما يراه المستخدمُ ههنا
     هو ما يراه في المكتبة حرفًا بحرف: الثيمُ والتنقّلُ والتحديد.
     والمادّةُ مادّةُ القُمرة المفتوحة (‎nookCode(nookEntry)‎) لا مادّةُ الشاشة.
     ===== وبابان لا أربعة =====
     رفُّ الموارد أربعةُ أبواب (مصادرُ الفهم والممارسة والشروح والبطائق)، وما يُستورد
     إلى رحلتك **رزمٌ** لا نصوصٌ حرّة — فالبابان: «الشروح» و«البطائق والملخصات».
     ===== وردُّ ‎#cm-ui‎ إلى بيته لازمٌ عند كلّ خروج =====
     هو عنصرٌ واحدٌ يُعار، فلو تُرك في نافذةٍ مخفيّةٍ لَبقيت المكتبةُ والرَّكنُ بلا واجهة */
  const JRI_DOORS = () => [['videos', T().videosSec], ['cards', T().cardsSec]];
  let jriSec = null;
  const jriHome = () => document.querySelector('#course-modal .mmodal__card');
  function jriDoorsHTML() {
    return `<p class="jri-lead">${esc(T().jriPick)}</p>
      <div class="jri-doors">${JRI_DOORS().map(([k, nm]) =>
        `<button type="button" class="jri-door" data-jri="${k}">
           <i>${TAB_IC[k]}</i><b>${esc(nm)}</b></button>`).join('')}</div>`;
  }
  /* ===== ورأسُ السهم يشير إلى اليمين =====
     المسارُ مرآةُ مسار رفّ الموارد (‎M15 6l-6 6 6 6‎) بتناظرٍ جانبيّ حول ‎x = 12‎:
     ‏‎15→9‎، و‎l-6→l6‎، و‎l6→l-6‎. والعلّةُ أنّ الصفحةَ ‎rtl‎: صدرُ السطر يمينُه،
     فالرجوعُ إلى ما قبلُ رجوعٌ إلى اليمين — وأن يشير يسارًا يقول «تقدَّم» */
  const JRI_BK_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"'
    + ' stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
  function jriPaint() {
    const bk = document.getElementById('jri-back');
    const ti = document.getElementById('jri-title');
    const bd = document.getElementById('jri-body');
    if (!bd) return;
    if (bk) {
      bk.hidden = !jriSec;
      bk.innerHTML = JRI_BK_IC;
      bk.title = bk.ariaLabel = T().jriBack;
    }
    /* والترويسةُ تتبدّل كما تتبدّل ترويسةُ الرفّ: اسمُ الفعل بابَين، واسمُ القسم داخلَه */
    if (ti) ti.textContent = jriSec
      ? ((JRI_DOORS().find(x => x[0] === jriSec) || [])[1] || T().jriTitle)
      : T().jriTitle;
    /* والبابان يُبنيان **بعد** ردّ الواجهة إلى بيتها: ‎innerHTML‎ على الجوف يمحو ما فيه،
       فلو بُنيا قبلَه لَأُتلفت ‎#cm-ui‎ وهي عنصرٌ واحدٌ في الموقع كلِّه لا نسخةَ له */
    if (!jriSec) {
      jriHome().appendChild($('#cm-ui'));
      bd.innerHTML = jriDoorsHTML();
      jriDock();   /* ولا ‎renderCmSection‎ ههنا تبنيه، فيُبنى بنفسه */
      return;
    }
    bd.innerHTML = '';
    bd.appendChild($('#cm-ui'));
    fillCourseUI(nookCode(nookEntry));
    showCmTab(jriSec);   /* وهي تنتهي إلى ‎renderCmSection‎ فيُطلى الرصيفُ من ذيلها */
  }
  /* ============================================================
     سلّةُ الاستيراد — ولمَ لا تركب ‎cxSel‎
     ============================================================
     ‏‎cxSel‎ تحديدُ **ديكٍ واحدٍ في لحظة**: من حدَّد في رزمةٍ ثمّ فتح غيرَها مُحي تحديدُه،
     لأنّ شريطَ الأسفل واحدٌ لا يسع خبرَين ومزجُ عقدٍ من ديكين يجعل العدَّ كذبًا.
     وسلّةُ الاستيراد نقيضُها: تجمع من **رزمٍ شتّى ومن البابين معًا** — «فيديو من شرحٍ،
     وبطائقُ من رزمةٍ أخرى» — ثمّ تُفرَّغ مرّةً واحدة. فلو أُركبت ‎cxSel‎ لَحاربتها في
     كلّ منعطف: ‎fillCourseUI‎ تمسحها، وفتحُ رزمةٍ يمسحها، و‎cxSelSync‎ تمسحها إذا غابت
     شجرتُها، و‎cxBarPaint‎ تُنزل شريطَ الصفحة بأفعالٍ ليست من هذا الباب.
     فهي مِلكُ نفسِها: مفتاحٌ ثلاثيّ (بابٌ · رزمةٌ · عقدة) فلا يلتبس متشابهان، وحياتُها
     حياةُ النافذة — تُفتح خاويةً وتُغلق فتُفرَّغ.
     ============================================================ */
  let jriBag = new Map();     /* `${sub}:${pid}:${id}` ⇦ { sub, pid, id } */
  let jriDest = null;         /* مجلّدُ الوجهة في الرحلة — و‎null‎ الجذر */
  let jriList = false;        /* أمنسدلةٌ قائمةُ الوجهات؟ */
  /* وهي **تصريحُ دالّة** لا ثابتًا: ‎x3Ep‎ و‎x3Tree‎ تناديانها وهما أعلى الملفّ بعشرة
     آلاف سطر. والثابتُ في منطقةٍ ميتة حتى يُنفَّذ سطرُه، فلو جرى رسمٌ قبله لَصاح.
     والتصريحُ يُرفع إلى صدر النطاق فيُقرأ من أيّ موضع */
  function jriOn() { const m = document.getElementById('jri-modal'); return !!m && !m.hidden; }
  /* الرزمةُ المفتوحةُ الآن في النافذة — ومنها يُقرأ الديكُ الذي يقع فيه التحديد */
  const jriPack = () => {
    if (!jriSec || !nookEntry) return null;
    const V = jriSec === 'cards' ? cardView : vidView;
    if (!V.open) return null;
    const p = postsOf(nookCode(nookEntry), jriSec).find(x => x.id === V.open);
    return (p && Array.isArray(p.data.deck)) ? { sub: jriSec, pid: p.id, deck: p.data.deck } : null;
  };
  const jriKey = (pk, id) => pk.sub + ':' + pk.pid + ':' + id;
  /* والتبديلُ يمشي على قاعدة الشجرة نفسِها التي في ‎cxToggleSel‎: المجلّدُ ظرفٌ فتحديدُه
     تحديدٌ لما فيه كلِّه، ورفعُ التحديد عن بندٍ في جوفه يرفعه عن آبائه جميعًا */
  function jriToggle(id) {
    const pk = jriPack(); if (!pk) return;
    const r = findNode(pk.deck, id); if (!r) return;
    const on = !jriBag.has(jriKey(pk, id));
    (r.n.t === 'f' ? cxKids(r.n) : [id]).forEach(x => on
      ? jriBag.set(jriKey(pk, x), { sub: pk.sub, pid: pk.pid, id: x })
      : jriBag.delete(jriKey(pk, x)));
    if (!on) (cxTrail(pk.deck, id) || []).forEach(a => jriBag.delete(jriKey(pk, a)));
    jriPaintSel(); jriDock();
  }
  /* وطلاءُ الصفوف من السلّة لا من ‎cxSel‎ — وهو طلاءٌ لا إعادةُ رسم */
  function jriPaintSel() {
    const bd = document.getElementById('jri-body'); if (!bd) return;
    const pk = jriPack();
    bd.querySelectorAll('[data-roid]').forEach(el => {
      const on = !!pk && jriBag.has(jriKey(pk, el.dataset.roid));
      el.classList.toggle('is-sel', on);
      const b = el.querySelector('.vt-grab--ro');
      if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  /* ===== رؤوسُ السلّة: محدَّدٌ لا محدَّدَ فوقه، في كلّ رزمةٍ على حِدة =====
     المجلّدُ وذرّيتُه وحدةٌ واحدةٌ حُدِّدت بضغطةٍ واحدة، فلو عُدَّت عقدُه لَعُدَّ ما فيه مرّتين */
  function jriRoots() {
    if (!nookEntry) return [];
    const by = new Map();
    jriBag.forEach(v => {
      const k = v.sub + ':' + v.pid;
      if (!by.has(k)) by.set(k, { sub: v.sub, pid: v.pid, ids: [] });
      by.get(k).ids.push(v.id);
    });
    const out = [];
    by.forEach(g => {
      const p = postsOf(nookCode(nookEntry), g.sub).find(x => x.id === g.pid);
      const deck = (p && p.data && p.data.deck) || [];
      const set = new Set(g.ids);
      g.ids.forEach(id => {
        if ((cxTrail(deck, id) || []).some(a => set.has(a))) return;   /* له أبٌ محدَّدٌ فوقه */
        const r = findNode(deck, id);
        if (r) out.push(r.n);
      });
    });
    return out;
  }
  /* والعدُّ في العمق: تحديدُ مجلّدٍ تحديدٌ لما فيه، فلو عُدَّ رأسًا واحدًا لكذب الخبر */
  function jriCount() {
    const c = { v: 0, f: 0, c: 0 };
    const walk = n => {
      if (n.t === 'f') { c.f++; (n.ch || []).forEach(walk); return; }
      if (n.t === 'v') c.v++; else c.c++;
    };
    jriRoots().forEach(walk);
    return c;
  }
  /* وجهاتُ الرحلة: الجذرُ ثمّ كلُّ مجلّدٍ فيها — فصولًا كانت أو مجلّداتِك */
  function jriDests() {
    const out = [{ id: '', name: T().jriRoot, tp: 0 }];
    const arr = roadOf(nookEntry) || [];
    const chs = arr.filter(n => n.tp === 1);
    const walk = ns => (ns || []).forEach(n => {
      if (n.t !== 'f') return;
      out.push({
        id: n.id, name: n.name || T().pkTitlePh,
        tp: n.tp === 1 ? chs.indexOf(n) + 1 : 0, col: folderColor(n),
      });
      walk(n.ch);
    });
    walk(arr);
    return out;
  }
  /* ورمزُ الوجهة رمزُها في الشجرة: قرصُ الفصل بترتيبه، أو مجلّدٌ بلونه، أو كتابُ المادّة
     للجذر — فالجذرُ ليس مجلّدًا بل المادّةُ نفسُها. وهي قسمةُ ‎cdPathHTML‎ حرفًا بحرف */
  function jriDic(d) {
    if (!d.id) {
      const cd = nookCode(nookEntry);
      return '<span class="cd-bk">' + bookMini(cd, imgOf(cd)) + '</span>';
    }
    return d.tp
      ? '<i class="cd-fic cd-fic--tp"><b class="tp-order">' + d.tp + '</b></i>'
      : '<i class="cd-fic" style="color:' + d.col + '">' + PK_IC.folderFill + '</i>';
  }
  function jriDock() {
    const dk = document.getElementById('jri-dock'); if (!dk || !nookEntry) return;
    const c = jriCount(), n = c.v + c.f + c.c;
    /* ===== أيقونةٌ ورقمٌ وبس =====
     ولا لفظَ مع الرقم: الأيقونةُ تقول ما هو والعددُ يقول كم — واللفظُ تكرارٌ لهما،
     وثلاثةُ ألفاظٍ في صفٍّ واحدٍ تُقرأ جملةً لا خبرًا. وهي قاعدةُ شريط التحديد نفسُها
     (‎cxBarPaint‎): «ولا نصَّ مع الرقم… والمعنى يبقى مقروءًا لقارئ الشاشة في
     ‎title/aria-label‎». فيُلفظ ههنا حيث لا يُرى ويُطوى حيث يُزاحم */
    const one = (ic, n, lab) => '<span class="jri-n" title="' + esc(lab) + '" aria-label="'
      + esc(lab) + '"><i>' + ic + '</i><b>' + n + '</b></span>';
    const bits = [];
    if (c.v) bits.push(one(PK_IC.vid, c.v, T().jriNV(c.v)));
    if (c.f) bits.push(one(PK_IC.folder, c.f, T().jriNF(c.f)));
    if (c.c) bits.push(one(PK_IC.card, c.c, T().jriNC(c.c)));
    const ds = jriDests();
    if (jriDest && !ds.some(x => x.id === jriDest)) jriDest = null;   /* مجلّدٌ حُذف من الرحلة */
    const cur = ds.find(x => x.id === (jriDest || '')) || ds[0];
    const menu = jriList ? '<div class="jri-dlist">' + ds.map(d =>
      '<button type="button" class="jri-dopt' + ((jriDest || '') === d.id ? ' on' : '')
      + '" data-jrid="' + d.id + '">' + jriDic(d) + '<span>' + esc(d.name) + '</span></button>').join('')
      + '</div>' : '';
    dk.innerHTML = '<div class="jri-sum">' + (bits.length
      ? bits.join('')
      : '<span class="jri-none2">' + esc(T().jriEmpty) + '</span>') + '</div>'
      + '<div class="jri-path">'
      /* ولا يُبنى للمسار شكلٌ ثانٍ: ‎.cd-seg‎ و‎.cd-sl‎ و‎.cd-bk‎ و‎.cd-fic‎ أصنافٌ عامّةٌ
         (لا مقصورةٌ على ‎#card-modal‎)، وهي مسارُ نافذة البطاقة بعينه. فالوجهةُ تُقرأ
         ههنا كما تُقرأ هناك: الرَّكن / كتابُ المادّة أو المجلّد */
      + '<span class="cd-seg">' + CD_IC.nook + '<span>' + esc(T().cdRootNook) + '</span></span>'
      + '<i class="cd-sl">/</i>'
      + '<button type="button" class="jri-dbtn' + (jriList ? ' is-open' : '') + '" id="jri-dbtn"'
      + ' title="' + esc(T().jriWhere) + '" aria-expanded="' + (jriList ? 'true' : 'false') + '">'
      + '<i class="jri-drop">' + CD_IC.chev + '</i>'
      + '<span class="cd-segl">' + jriDic(cur) + '<span>' + esc(cur.name) + '</span></span>'
      + '</button>' + menu + '</div>'
      + '<button type="button" class="jri-go" id="jri-go"' + (n ? '' : ' disabled') + '>'
      + esc(T().jriDo) + '</button>';
  }
  /* ===== والاستيرادُ نسخٌ لا إشارة =====
     الإشارةُ تتبع تصحيحَ المؤلّف — وتتيتّم إن حذف مساهمتَه، فتنكسر رحلتُك بفعل غيرك.
     والنسخةُ تنفصل، وثمنُها أنّها لا تتبع تصحيحًا. ورجحت النسخةُ لثلاث:
       · رحلتُك **دفترُك**، وما دخله لا يخرج بيد سواك.
       · والنموذجُ لا يحتاج عقدةً خامسة (‎ref‎) ولا رسمًا لليتيم ولا مصدرًا لدائرة اكتمالها.
       · وكلُّ ما بُني للرحلة يمشي على المنسوخ بلا سطر: المذاكرةُ والاختبارُ والسحبُ والدوائر.
     والمعرّفاتُ تُجدَّد في العمق: لو بقيت لَاشتبكت مع مصدرها في ‎state.srs‎ وفي التحديد */
  /* ===== وفخٌّ مقيس: مجلّدٌ مستوردٌ يُقرأ **فصلًا** =====
     ‏‎roadSync‎ تعرف الفصلَ بـ‎isCh‎: موسومٌ ‎tp === 1‎، **أو** مجلّدٌ لا وسمَ له ولا
     لونَ (‎tp === undefined && t === 'f' && ci === undefined‎) — وتلك بذرةُ ما قبل الوسم.
     ومجلّداتُ الرزم تُولد بلونٍ (‎pickFolderColor‎) فتنجو، **إلّا ما وُلد من بذرة**
     (‎deck.push({ id, t:'f', name, open, ch })‎ بلا ‎ci‎). فلو استُورد أحدُها لَقُرئ
     فصلًا: يُنسب إلى موضوعٍ فيلبس اسمَه، أو لا يُنسب فيُطرح إن خلا.
     فيُوسم كلُّ مجلّدٍ منسوخٍ ‎tp: 0‎ — والوسمُ الصريحُ يقطع شقَّي ‎isCh‎ معًا.
     والمعرّفاتُ تُجدَّد في العمق: لو بقيت لَاشتبكت مع مصدرها في ‎state.srs‎ وفي التحديد */
  const jriClone = n => {
    const o = JSON.parse(JSON.stringify(n));
    (function fix(x) {
      /* وأثرُ الأصل يُكتب قبل تجديد المعرّف: بعده يضيع. والمجلّدُ لا سجلَّ له فلا أثرَ */
      const was = x.id;
      x.id = newId();
      if (x.t !== 'f' && !x.src) x.src = was;
      /* ===== وينزل المجلّدُ مطويًّا مهما كان حالُه في المكتبة =====
         حالُ الطيّ في «تقدمي الذاتي» تسكن العقدةَ نفسَها (‎n.open‎)، والصفُّ **مفتوحٌ ما لم
         يُقَل ‎open === false‎**. وشجرةُ النشر لا تكتب ‎open‎ في العقد أصلًا (فَتْحُها في
         سِجلٍّ على حِدة)، فالنسخةُ تنزل بلا حقلٍ فتُقرأ مفتوحة — ومجلّدٌ فيه مجلّداتٌ
         ينزل بجوفه كلِّه مبسوطًا في رسمةٍ واحدة.
         فيُكتب الطيُّ صراحةً في كلّ مجلّدٍ يُنسخ: ما يدخل دفترَك ينزل مطويًّا، ولا يُفتح
         إلّا بيدك — وهي قسمةُ «لا يُفعل عنك ما تملك فعلَه» */
      if (x.t === 'f') { x.tp = 0; x.open = false; }
      /* ===== ووسمُ «مستورَد» على غير المجلّدات =====
         خبرُ الناس (‎cs‎) خبرٌ عن **بطاقةٍ نُشرت**: رآها كذا، وعلّق كذا، وحذّر كذا.
         وبطاقةٌ صنعتَها في دفترك لم تُنشر ولم يرها أحد — فأرقامُها أصفارٌ أبدًا،
         وسبعةُ أصفارٍ في صفٍّ خبرٌ كاذبٌ لا خبرٌ فارغ.
         فيُفرَّق بينهما بوسمٍ يُكتب مرّةً عند النسخ: ما جاء من رزمةٍ يحمل خبرَه معه،
         وما وُلد ههنا لا يُوعَد بخبرٍ لا يجيء.
         والمجلّدُ لا يُوسم: لا خبرَ له من نفسِه أصلًا (هو وعاءٌ) */
      if (x.t !== 'f') x.imp = 1;
      /* ===== وبلاغُك أنت لا يُنسخ معه =====
         ‏‎n.wl‎ قائمةُ مَن نبّه على خطأٍ فيها، و‎me‎ وسمُ بلاغك أنت. والنسخةُ تحمل
         **عددَ** مَن نبّه (خبرٌ عن البطاقة يُنشر معها كالكلام)، ولا تحمل الوسمَ: لو
         حملته لَقال زرُّها في دفترك «تراجع عن التنبيه» عن بلاغٍ لم تُنبّه به —
         ثمّ سحبتَه فنقص العدّادُ واحدًا بلا سبب.
         فالعددُ يُورَث والفعلُ لا يُورَث */
      if (Array.isArray(x.wl)) x.wl = x.wl.map(w => {
        const c = Object.assign({}, w); delete c.me; return c;
      });
      /* ===== ولا تُنقل مسوّدةُ صاحبها =====
         النسخُ عميقٌ فينقل ‎n.f/n.b‎ كما هي — وهي مسوّدةٌ إن كان يعمل فيها، فيأخذ
         القارئُ إلى دفتره نصًّا لم يُنشر ولم يره في الشجرة أصلًا.
         فتُؤخذ النسخةُ **المنشورة**: نصُّها ورقمُها، ويُطرح وسمُ المسوّدة وأثرُها.
         وسجلُّها يُصفّى كذلك: لو بقي فيه سجلُّ المسوّدة (‎pub === false‎) لَفتحها
         القارئُ من مروحته — بابٌ خلفيٌّ إلى ما لم يُنشر */
      if (x.t !== 'f' && x.pend) {
        const pv = cdPubV(x), r = cdRec(x, pv);
        x.f = (r && r.f) || ''; x.b = (r && r.b) || '';
        x.v = pv || 1;
        delete x.pend; delete x.pv; delete x.dt;
        if (Array.isArray(x.hist)) x.hist = x.hist.filter(h => h.pub !== false && h.v <= x.v);
      }
      (x.ch || []).forEach(fix);
    })(o);
    return o;
  };
  function jriGo() {
    const roots = jriRoots();
    if (!roots.length || !nookEntry) return;
    const arr = roadOf(nookEntry, true);
    const h = jriDest ? (findNode(arr, jriDest) || {}).n : null;
    const dest = (h && h.t === 'f') ? (h.ch = h.ch || []) : arr;
    roots.forEach(x => dest.push(jriClone(x)));
    if (h) h.open = true;   /* الوجهةُ تُفتح: ما استوردتَه يُرى حيث وقع لا خلف مثلّثٍ مطويّ */
    save();
    jriBag.clear();
    jriClose();
  }

  /* وتُنادى من ذيل ‎renderCmSection‎: هي مصبُّ كلّ ما يُعيد بناءَ الصفوف */
  function jriAfterRender() { if (!jriOn()) return; jriPaintSel(); jriDock(); }
  /* ============================================================
     نافذةُ الدورة — مُشغّلُ رزمة «الشروح»
     ============================================================
     ترويستُها غلافُ الدورة واسمُه — وهما رسمُ ترويسة الرزمة نفسُه (‎x3ArtHTML‎)، فلا
     يُبنى غلافٌ ثانٍ. وجوفُها نصفان: المستطيلُ الكبير فيه الشرحُ الجاري، ويساره
     **شجرةُ الدورة بعينها** (‎x3Tree‎) مسارًا يُنتقل فيه.
     ولا تُنسخ الشجرة: هي التي في المكتبة حرفًا بحرف — بمجلداتها ودوائرها وقضيبها —
     ويُزاد عليها في هذه النافذة وحدَها هدفُ نقرةٍ ووسمُ الجاري (‎x3Ep‎).
     وطيُّها محليٌّ (‎vwFold‎) لا يمسّ طيَّ المكتبة: ‎[data-fold]‎ معالجُه على
     ‎$('.cm-panel')‎ ولا يبلغ هذه النافذة، فلها معالجُها.
     ============================================================ */
  /* ===== وللنافذة حالان: دورةٌ وشرحٌ مفرد =====
     **الدورة**: رزمةٌ من «الشروح» — ترويستُها غلافُ الرزمة واسمُها، وجوفُها مُشغّلٌ ومسار.
     **والمفرد**: شرحٌ استوردتَه إلى «رحلتي» — لا رزمةَ له (نسخةٌ انفصلت عن أصلها، انظر
     ‎jriClone‎)، فلا مسارَ يُعرض: مسارُ ماذا؟ فيُطوى العمودُ وتبقى الشاشةُ وحدَها.
     وترويستُه **كتابُ المادّة واسمُها**: هو أقربُ ما يُنسب إليه — أنت في رحلتك فيها.
     و‎vwOne‎ يفرّق بينهما، والدوالُّ الأربعُ تسأله بدل أن تُشقّ نسختين */
  let vwPk = null, vwCur = null, vwFold = {}, vwOne = false;
  function vwOn() { const m = document.getElementById('vw-modal'); return !!m && !m.hidden; }
  const vwDeck = () => vwOne
    ? (roadOf(nookEntry) || [])
    : ((vwPk && vwPk.data && Array.isArray(vwPk.data.deck)) ? vwPk.data.deck : []);
  /* أوّلُ شرحٍ في العمق — «ابدأ من أوّلها» */
  function vwFirst(ns) {
    for (const n of ns || []) {
      if (n.t !== 'f') return n;
      const r = vwFirst(n.ch);
      if (r) return r;
    }
    return null;
  }
  function vwPaintMain() {
    const el = document.getElementById('vw-main');
    if (!el) return;
    const r = vwCur ? findNode(vwDeck(), vwCur) : null;
    const n = r && r.n;
    if (!n) {
      el.innerHTML = `<p class="vw-empty">${esc(countLeaf(vwDeck()) ? T().vwPick : T().vwNone)}</p>`;
      return;
    }
    /* ===== وبابٌ إلى يوتيوب تحت المُشغّل =====
       التضمينُ قد يُمنع (صاحبُ المقطع يمنعه)، فيُرى الإطارُ ويقول «غير متاح» ولا مخرجَ.
       فيُوضع بابٌ يفتحه في موضعه — ولا يظهر إلّا لمقطع يوتيوب: الملفُّ يُشغَّل ههنا
       ولا موضعَ له خارجًا */
    const yid = n.vt === 'link' ? ytId(n.v) : '';
    el.innerHTML = `<div class="vw-screen">${vpMedia(n)}</div>
      <div class="vw-cap">
        <b class="vw-nm">${esc(n.name || T().pkTitlePh)}</b>
        ${n.dur ? `<span class="vw-dur">${esc(n.dur)}</span>` : ''}
        ${yid ? `<a class="vw-out" href="${esc(n.v)}" target="_blank" rel="noopener"
          >${esc(T().vwOut)} ↗</a>` : ''}
      </div>`;
  }
  function vwPaintSide() {
    const el = document.getElementById('vw-side');
    if (!el) return;
    if (vwOne) { el.innerHTML = ''; return; }   /* لا مسارَ لشرحٍ مفرد */
    /* والحالان تُضبطان قبل البناء لأنّ ‎x3Tree‎ تقرؤهما في أثناء تقييمه (كما في ‎packCard‎):
       رحلةٌ إن كانت رحلة، والدوائرُ تُعرض أبدًا في الشروح */
    cxRoJr = !(vwPk && vwPk.data && vwPk.data.jr === false);
    cxRoDot = true;
    el.innerHTML = `<p class="vw-cap2">${esc(T().vwPath)}</p>
      <div class="vw-tree"><div class="x3 cx-vo${cxRoJr ? '' : ' cx-nojr'}"
        >${x3Tree(vwDeck(), vwFold, 0, 'v')}</div></div>`;
    cxRailFit();
  }
  function vwPaintHead() {
    const a = document.getElementById('vw-art'), t = document.getElementById('vw-title');
    if (vwOne) {
      /* وكتابُ المادّة لا غلافُ رزمة: المفردُ لا رزمةَ له، وأقربُ ما يُنسب إليه مادّتُه */
      const cd = nookEntry ? nookCode(nookEntry) : '';
      const c = CM[cd] || { code: cd, ar: cd };
      if (a) a.innerHTML = `<span class="cd-bk">${bookMini(cd, imgOf(cd))}</span>`;
      if (t) t.textContent = state.lang === 'ar' ? arShort(c) : c.code;
      return;
    }
    if (a) a.innerHTML = vwPk ? x3ArtHTML(vwPk, 'v', vwDeck()) : '';
    if (t) t.textContent = (vwPk && vwPk.data && vwPk.data.title) || T().pkTitlePh;
  }
  /* شرحٌ مفردٌ من «رحلتي»: لا رزمةَ ولا مسار */
  function vwOpenOne(id) {
    if (!nookEntry || !id || !findNode(roadOf(nookEntry) || [], id)) return;
    vwPk = null; vwOne = true; vwFold = {}; vwCur = id;
    const m = document.getElementById('vw-modal');
    m.hidden = false; m.classList.add('is-one');
    vwPaintHead(); vwPaintMain(); vwPaintSide();
  }
  /* ‎at‎: معرّفُ المقطع الذي يُبدأ منه — وإلّا فأوّلُ الدورة */
  function vwOpen(post, at) {
    if (!post || !Array.isArray(post.data.deck)) return;
    vwPk = post; vwOne = false;
    document.getElementById('vw-modal').classList.remove('is-one');
    /* ===== والمسارُ يُفتح كلُّه =====
       ‏‎x3Tree‎ تقرأ الطيَّ بـ‎fold[id] === true‎، فخريطةٌ خاويةٌ تعني **كلَّ المجلّدات
       مطويّة**. وذاك حكمُ متصفّح المكتبة حيث تُفتح ما تريد؛ وههنا الشجرةُ **مسارُ
       الدورة** — يُفتح ليُرى أين أنت منه، وليَظهر الشرحُ الجاري في موضعه لا خلف مطويّ.
       ومن أراد طيَّه طواه، والطيُّ محليٌّ لا يُحفظ */
    vwFold = {};
    (function all(ns) {
      (ns || []).forEach(n => { if (n.t === 'f') { vwFold[n.id] = true; all(n.ch); } });
    })(post.data.deck);
    const f = vwFirst(post.data.deck);
    /* والمطلوبُ يُتحقَّق منه في الديك: معرّفٌ من رزمةٍ أخرى يُردّ إلى أوّل هذه */
    vwCur = (at && findNode(post.data.deck, at)) ? at : (f ? f.id : null);
    document.getElementById('vw-modal').hidden = false;
    vwPaintHead(); vwPaintMain(); vwPaintSide();
  }
  function vwClose() {
    const m = document.getElementById('vw-modal');
    if (!m || m.hidden) return;
    /* والمشغّلُ يُفرَّغ قبل الإخفاء: ‎<video>‎ مخفيٌّ يبقى يُنزّل ويُشغّل صوتَه */
    const el = document.getElementById('vw-main');
    if (el) el.innerHTML = '';
    m.hidden = true;
    m.classList.remove('is-one');
    vwPk = null; vwCur = null; vwFold = {}; vwOne = false;
  }
  document.addEventListener('click', e => {
    if (!e.target.closest) return;
    if (e.target.closest('#vw-close')) { vwClose(); return; }
    const m = document.getElementById('vw-modal');
    if (m && !m.hidden) {
      if (e.target === m) { vwClose(); return; }
      if (!e.target.closest('#vw-modal')) return;
      /* الطيُّ محليّ: لا يمسّ ‎vidView.fold‎ ولا يُعيد رسمَ المكتبة خلفها */
      const fo = e.target.closest('[data-fold]');
      if (fo) { const k = fo.dataset.fold; vwFold[k] = !(vwFold[k] === true); vwPaintSide(); return; }
      const pl = e.target.closest('.cs') ? null : e.target.closest('[data-vwp]');
      if (pl) {
        if (vwCur === pl.dataset.vwp) return;   /* الجاري لا يُعاد تشغيلُه من أوّله */
        vwCur = pl.dataset.vwp;
        vwPaintMain(); vwPaintSide();
      }
      return;
    }
    /* ===== وخارجَ النافذة: صفُّ شرحٍ في شجرة النشر يفتحها على مقطعه =====
       فيدخل القارئُ الدورةَ من حيث شاء لا من أوّلها أبدًا — و«ابدأ» تبقى لمن أراد أوّلها.
       ورزمتُه تُقرأ من حاضنه (‎data-pk‎ في ‎packCard‎) لا من حالٍ على الشاشة.
       ويُستثنى جوفُ نافذة الاستيراد: الصفُّ هناك يُنتقى لا يُشغَّل، ونافذةٌ تفتح فوق
       نافذةٍ تُضيّع ما جُمع في السلّة */
    /* وضغطةُ خبرٍ في الصفّ ليست ضغطةَ الصفّ: أيقونةُ التعليق تفتح فقاعتَها،
       فلو مضى الصفُّ بفعله لَفُتحت النافذةُ والفقاعةُ فوقها في ضغطةٍ واحدة */
    if (e.target.closest('.cs')) return;
    const out = e.target.closest('[data-vwp]');
    if (!out || out.closest('#jri-body')) return;
    const box = out.closest('.post.pk[data-pk]');
    const post = box && postsOf(cmCode, 'videos').find(x => x.id === box.dataset.pk);
    if (post) vwOpen(post, out.dataset.vwp);
  });

  function jriOpen() {
    if (!nookEntry) return;
    jriSec = null; jriBag.clear(); jriDest = null; jriList = false;
    document.getElementById('jri-modal').hidden = false;
    jriPaint();
  }
  function jriClose() {
    jriSec = null;
    jriHome().appendChild($('#cm-ui'));   /* الواجهةُ تعود إلى بيتها قبل إخفاء النافذة */
    document.getElementById('jri-modal').hidden = true;
    /* ===== والقُمرةُ تُبنى من جديد =====
       ‏‎showCmTab‎ خفضت وسمَ تحديد الرحلة (‎cxRoadSel‎)، و‎openNook‎ ترفعه.
       ===== ورفُّ الموارد إن كان مفتوحًا فهو المُعيرُ الأوّل =====
       ‏‎#cm-ui‎ عنصرٌ واحدٌ يُعار، فلو فُتحت النافذةُ والرفُّ مفتوحٌ لَانتُزعت منه؛
       فتُردُّ إليه بـ‎openNookRes‎ (وهي تُنادي ‎openNook‎ في جوفها) لا بـ‎openNook‎
       وحدَها — وإلّا بقي الرفُّ مفتوحًا على جوفٍ خاوٍ */
    if (!nookEntry) return;
    if (nkRes) openNookRes(nkRes); else openNook(nookEntry);
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#jri-close')) { jriClose(); return; }
    if (e.target.closest('#jri-back')) { jriSec = null; jriPaint(); return; }
    const d = e.target.closest('[data-jri]');
    if (d) { jriSec = d.dataset.jri; jriPaint(); return; }
    /* ===== ورصيفُ الأسفل: الوجهةُ ثمّ الفعل ===== */
    if (e.target.closest('#jri-dbtn')) { jriList = !jriList; jriDock(); return; }
    const dp = e.target.closest('[data-jrid]');
    if (dp) { jriDest = dp.dataset.jrid || null; jriList = false; jriDock(); return; }
    if (e.target.closest('#jri-go')) { jriGo(); return; }
    /* وضغطةٌ خارج القائمة المنسدلة تطويها — وهي **بعد** الثلاثة فلا تسبقها إلى نقرتها */
    if (jriList && jriOn() && !e.target.closest('.jri-dlist')) { jriList = false; jriDock(); }
    /* وضغطةُ العتمة خارج البطاقة تُغلق — كسائر نوافذ الموقع */
    const m = document.getElementById('jri-modal');
    if (m && !m.hidden && e.target === m) jriClose();
  });

  function closeNookRes() {
    nkRes = null;
    if (nookEntry) openNook(nookEntry);   /* وهي تُعيد ‎#cm-ui‎ إلى بيتها أوّلًا */
  }
  function openNook(entry) {
    /* ===== والرفُّ يُطوى إذا تبدّلت المادّة لا إذا أُعيد رسمُها =====
       ‏‎openNookRes‎ تُنادي ‎openNook‎ بالمدخل نفسِه لتُعيد البناءَ والرفُّ مفتوح، فلو
       طُوي في كلّ نداءٍ لَانغلق في اللحظة التي يُفتح فيها. والحدُّ **تبدُّلُ المادّة**:
       من ذهب إلى مادّةٍ أخرى لا يرث نظرةَ التي قبلها */
    if (!nookEntry || nookEntry.code !== entry.code) nkRes = null;
    courseModal.hidden = true;
    /* #cm-ui يعود لبيته في النافذة قبل مسح المضيف */
    document.querySelector('#course-modal .mmodal__card').appendChild($('#cm-ui'));
    nookEntry = entry;
    state.lastNook = { term: selTerm, code: entry.code };   /* تُستأنف عند العودة للركن ولو بعد تحديث الصفحة */
    save();
    coursePosts(nookCode(entry));   /* ترحيل بيانات النشاط المعروض قبل قراءة مساهماته */
    /* ===== ورحلتُك تُبذر عند أوّل فتحٍ لهذه المادّة وحدَه =====
       الشرطُ ‎road‎ **معدومةٌ** لا خاوية: فمن أفرغ رحلتَه بيده لا تُملأ عليه في كلّ
       فتحة — والمعدومُ يفترق عن الخاوي. وما جدّ بعدُ يُنزَّل بزرّ «أنزل مواضيع المادّة».
       والبذرُ **قبل** بناء الجوف لا في أثنائه: بناءُ نصٍّ لا يُغيّر حالًا */
    /* ولا بذرةَ ههنا بعد اليوم: ‎roadSync‎ تُصالح القائمةَ بالمصدر في كلّ رسمة،
       فلا نقلةَ تُرقَّم ولا وسمَ يُحفظ. ومن بُذرت له نسخةٌ قديمة تُصالَح من نفسِها:
       ما وافق موضوعًا حيًّا بقي، وما لم يوافق وكان خاويًا طُرح */
    /* ===== والتحديدُ يصير تحديدَ رحلةٍ عند فتح الرَّكن =====
       ‏‎cxSel‎ صفٌّ واحدٌ تشترك فيه الأشجار الثلاث، فلو دخلتَ الرَّكنَ وفيه تحديدٌ لشجرة
       مساهمةٍ لَطلاه الشريطُ على صفوفٍ ليست له وعمل عليها. فيُمحى ويُرفع الوسم */
    if (!cxRoadSel) { cxSel.clear(); cxRoadSel = true; cxSelRo = true; }
    const host = $('#lib-course');
    const box = (cls, title) => `<div class="${cls}"><h3 class="nk-t">${title}</h3></div>`;
    /* بلا ترويسة: الكتاب المتمركز في البِكرة هو هوية المادة — تحت الخط مباشرةً «التقويم» */
    host.innerHTML = `<div id="nook">
      ${box('nk-cal', T().nkCalendar)}
      <div class="nk-four">
        ${nookInfoBox(entry)}
        ${nookDocBox(entry)}
        ${nookAbsBox(entry)}
        ${nookGradeBox(entry)}
      </div>
      ${nookResBox()}
      <div class="nk-two">${nookRoadBox(entry)}</div>
    </div>`;
    host.hidden = false;
    nkSzApply();            /* مقاساتُ الأربعة تُلبَس بعد أن استقرّ الصفُّ في الصفحة */
    nkMinFit();             /* ثمّ يُقاس أدنى عرضٍ يسع سطرَ كلّ عنوان */
    fitGradeLabels(host);   /* دلالات شريط الدرجة في مربّع القُمرة */
    gldPaint();             /* وسُلَّمُ الحروف: حرفُك وموضعُك يُكتبان بعد أن يُبنى المربّع */
    nkInfoFill();           /* ومربّعُ «المادة» يُملأ بالقياس بعد أن استقرّ في الصفحة */
    nkSbSync();             /* والشريطُ يُقاس بعد ان يستقرّ المتنُ في الاربعة */
    /* ===== والقياسُ آخِرُ ما يقع — وغيابُه ههنا كان العطبَ =====
       ‏‎openNook‎ تبني مربّعَ الرحلة بنفسها (‎nookRoadBox‎ في قالب القُمرة) ولا تمرّ
       بـ‎roadRender‎، فلم يبلغها قياسٌ. فكان أوّلُ دخولٍ يعرض دوائرَ بلا خيطٍ يجمعها،
       ثمّ يُصلحه أوّلُ طيٍّ أو فتحٍ لفصل — لأنّ ذاك يمرّ بـ‎roadRender‎ فيقيس.
       ===== وموضعُه بعد الإظهار والمقاسات لا قبلَهما =====
       ‏‎host.hidden = false‎ فوق: الحاضنُ مخفيٌّ لحظةَ البناء، والمخفيُّ صندوقُه أصفار.
       و‎nkSzApply‎ تُلبس المربّعاتِ مقاساتِها المحفوظة. فلو قِيس قبلهما لَقِيس على
       عرضٍ لا يكون وارتفاعٍ لا يكون */
    cxNameFit();
    cxRailFit();
    /* ودائرةُ الغلاف في الرفّ: القُمرةُ قد فُتحت على رحلةٍ تبدّلت من غير هذا الطريق
       (مذاكرةٌ أو اختبارٌ أو استيراد)، فتُقرأ من جديدٍ عند كلّ فتحة */
    nkStatPaint(entry);
    /* بلا تمرير تلقائي: القُمرة تُبنى مكانها والصفحة تبقى حيث تركها المستخدم */
  }

  $('#lib-course').addEventListener('click', e => {
    /* ===== سهما السجلّ: يُكتب الرقمُ ولا يُعاد رسمُ القُمرة =====
       لا يقرأ العددَ اليومَ شيءٌ سوى خانته، فإعادةُ البناء بعد كلّ نقرةٍ تهدم
       المربّعاتِ الأربعةَ وتُعيدها لرقمٍ تبدّل — والصفرُ يُحذف مدخلُه ولا يُخزَّن:
       صفرٌ حكمٌ، والخلاءُ سكوت (وهو حكمُ ‎gradeMe‎ نفسُه) */
    /* ===== ومثلّثا خانة الدرجة: يُكتب في الخانة ولا يُعاد رسمُ القُمرة =====
       والحكمُ حكمُ الكتابة باليد نفسُه (‎input‎ أدناه): يُقصر على ‎0–100‎، والصفرُ يُحذف
       مدخلُه ولا يُخزَّن — صفرٌ حكمٌ والخلاءُ سكوت. فلو خالف لَاختلف الرقمُ باختلاف
       الطريق التي جاء منها */
    const gs = e.target.closest('[data-gstp]');
    if (gs && nookEntry) {
      /* والحاضنُ ‎.gscw‎ لا ‎.gvin‎: خانةُ البونس ليست في عمود البار فلا ‎.gvin‎ لها،
         و‎.gscw‎ مستطيلُ الإدخال حيثما كان — فمقبضٌ واحدٌ يخدم الاثنين */
      const cell = gs.closest('.gscw'), inp = cell && cell.querySelector('.gsc');
      if (inp) {
        const d = +gs.dataset.gstp || 0;
        if (inp.dataset.gbn) {
          const n = Math.max(0, Math.min(100, Math.round(gBonus(nookEntry) + d)));
          gBonusSet(nookEntry, n);
          inp.value = n || '';
          inp.classList.toggle('is-set', !!n);
        } else {
          const me = gradeMe(nookEntry, true), key = inp.dataset.gmg;
          const rec = me[key] || (me[key] = {});
          const n = Math.max(0, Math.min(100, Math.round((+rec.g || 0) + d)));
          if (n) rec.g = n; else delete rec.g;
          if (rec.g == null && rec.d == null) delete me[key];
          inp.value = rec.g == null ? '' : rec.g;
          inp.classList.toggle('is-set', rec.g != null);
        }
        gldPaint();
        save();
      }
      return;
    }
    const am = e.target.closest('[data-am]');
    if (am && nookEntry) {
      const me = absMe(nookEntry, true), k = am.dataset.am;
      const n = Math.max(0, Math.min(99, (+me[k] || 0) + (+am.dataset.d || 0)));
      if (n) me[k] = n; else delete me[k];
      const out = document.querySelector('#nook [data-amv="' + k + '"]');
      if (out) out.textContent = n;
      /* وخانةُ الخصم في مربّع الدرجة تتبع العدّادَ في الحال: هي قارئةٌ له، فلو تُركت
         حتى إعادة الرسم لَقال المربّعان قولين مختلفين في شاشةٍ واحدة */
      const dv = document.querySelector('#nook .gvded__v');
      if (dv) dv.textContent = '\u2212' + absDed(nookEntry) + '%';
      /* والسُّلَّمُ يقرأ الخصمَ كما تقرؤه خانتُه — فلو تُرك لَقال المربّعان قولين */
      gldPaint();
      /* ===== \u0648\u0627\u0644\u0628\u0627\u0628\u064f \u064a\u062a\u062d\u0631\u0651\u0643 \u0645\u0639 \u0627\u0644\u0636\u063a\u0637\u0629 =====
         \u062d\u064a\u0627\u0629\u064f \u0647\u0630\u0627 \u0627\u0644\u0645\u0631\u0628\u0651\u0639 \u0644\u064a\u0633\u062a \u0632\u0645\u0646\u064b\u0627 \u064a\u062c\u0631\u064a \u0628\u0644 **\u0641\u0639\u0644\u064b\u0627 \u0645\u0646\u0643**: \u062a\u0636\u063a\u0637 \u0627\u0644\u0633\u0647\u0645\u064e \u0641\u062a\u0633\u062c\u0651\u0644
         \u063a\u064a\u0627\u0628\u064b\u0627\u060c \u0641\u064a\u0646\u0628\u063a\u064a \u0623\u0646 \u064a\u0648\u0627\u0631\u0628 \u0627\u0644\u0628\u0627\u0628\u064f \u0641\u064a \u0627\u0644\u0644\u062d\u0638\u0629 \u0646\u0641\u0633\u0650\u0647\u0627. \u0648\u0644\u0627 \u064a\u064f\u0639\u0627\u062f \u0628\u0646\u0627\u0621\u064f \u0627\u0644\u0642\u064f\u0645\u0631\u0629
         \u0644\u0630\u0644\u0643: \u0625\u0639\u0627\u062f\u0629\u064f \u0627\u0644\u0628\u0646\u0627\u0621 \u062a\u0646\u0632\u0639 \u0627\u0644\u0628\u0624\u0631\u0629\u064e \u0645\u0646 \u062a\u062d\u062a \u0625\u0635\u0628\u0639\u0643 \u0648\u062a\u0642\u062a\u0644 \u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644\u060c \u0641\u0627\u0644\u0628\u0627\u0628\u064f
         \u064a\u064f\u0628\u062f\u064e\u0651\u0644 \u200e--shut\u200e \u0639\u0646\u062f\u0647 \u0648\u062d\u062f\u064e\u0647 \u0641\u064a\u0646\u0632\u0644\u0642 \u0625\u0644\u0649 \u0645\u0648\u0636\u0639\u0647 \u0627\u0644\u062c\u062f\u064a\u062f */
      absNowSync(nookEntry);
      save();
      return;
    }
    /* ===== طيُّ المربّع ونشرُه =====
       يُكتب المقاسُ ويُلبَس ولا يُعاد بناءُ القُمرة: البناءُ يهدم الأربعةَ ويُعيدها
       لمقاسٍ تبدّل، ويمحو ما في خانات الدرجة من بؤرة. والأيقونةُ تُقلب في مكانها */
    const fd = e.target.closest('[data-nkfold]');
    if (fd && nookEntry) {
      const k = NK_KEY[fd.dataset.nkfold], sz = k && state[k];
      if (sz) {
        /* ===== والمحورُ عموديٌّ وحدَه: العرضُ لا يمسّه الوضعُ ابدا =====
           كان الطيُّ يكتب ‎sz.w = NK_DEF[k].w‎ ويحفظ العرضَ في ‎o‎، والنشرُ يردُّه.
           فمن جرَّ مربّعا ثمّ طواه ثمّ نشره رآه **يتّسع عرضا وقامة** — وقِيس:
           ‎200 ← 319‎ عرضا مع النشر. وهو مرفوض: الطيُّ فعلُ «أرني ما تحت» لا فعلُ
           تحجيم؛ والعرضُ ملكُ الحافّة التي يجرُّها صاحبُ الموقع بيده، فلا يُنقض
           عليه بزرّ. (وهو حكمُ ‎RE/nook-four‎ نفسُه: «‎w‎ لا يمسّه الوضع ابدا».)
           و‎o‎ يبقى قامةً وحدَها: هي التي تُردّ */
        /* ===== والزرُّ يحكم الاربعةَ لا صندوقَه وحدَه =====
           الرَّكنُ يُقرأ **صفّا**: أربعةٌ على قامةٍ واحدةٍ تُمسح بلمحة. فطيُّ واحدٍ دون
           اخوته يكسر ذلك الصفَّ ويجعل الشاشةَ درجاتٍ. والمقصودُ من الزرّ «أرني ما
           تحت» — وهي حاجةٌ تقع على الرَّكن كلِّه لا على بندٍ منه.
           والمضغوطُ يقرّر الجهةَ وحدَه: ان كان مطويّا فُتح الاربعةُ، وان كان مبسوطا
           طُويت. فلا يُسأل عن حال الباقين ولا يتناوبون — نقرةٌ واحدةٌ وحالٌ واحدة.
           والعرضُ لا يمسّه شيء: المحورُ عموديٌّ وحدَه، و‎o‎ يحفظ قامةً لكلّ صندوقٍ
           على حدة — فمن نشر وجد كلَّ صندوقٍ على قامته التي تركه عليها لا على قامةٍ
           موحَّدة */
        const open = !!sz.c;   /* أكان المضغوطُ مطويّا؟ فالجهةُ نشرٌ */
        NK_SZ.forEach(key => {
          const z = state[key];
          if (!z) return;
          if (open) {
            const o = z.o || {};
            z.h = o.h || 210;   /* من طُوي ولم يُوسَّع قطُّ يُفتح على قامةٍ تُري جوفَه */
            z.c = 0;
          } else {
            z.o = { h: z.h };
            z.h = NK_DEF[key].h; z.c = 1;
          }
        });
        const lab = open ? T().nkNarrow : T().nkWiden;
        /* ===== وازرارُ الطيّ ثمانيةٌ لا زرّان =====
           لكلّ صندوقٍ زرّان (واحدٌ في جسد الضيّق وآخرُ في ادوات الواسع، يُخفى احدُهما
           بالوضع)، والاربعةُ تتبدّل معا — فتُقلب الثمانيةُ كلُّها. ولو قُلبت ازرارُ
           المضغوط وحدَه لَقال الثلاثةُ الباقون «افتح» وهم مفتوحون */
        document.querySelectorAll('#nook [data-nkfold]').forEach(el => {
          el.innerHTML = open ? NK_FOLD.in : NK_FOLD.out;
          el.title = lab; el.setAttribute('aria-label', lab);
        });
        nkSzApply(); nkMinFit(); nkInfoFill(); nkSbSync();
        save();
      }
      return;
    }
    const rs = e.target.closest('[data-nkres]');
    if (rs) { openNookRes(rs.dataset.nkres); return; }
    const bk = e.target.closest('#nk-back');
    if (bk) { closeNookRes(); return; }
    const tp = e.target.closest('.nkm-more');
    if (tp) { nkInfoTopics(); return; }
    const pk = e.target.closest('.nk-pick');
    if (pk && nookEntry) openNookPicker(pk.dataset.nkpick);
  });
