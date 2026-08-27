  /* ===== إطلالةُ الدُّرج في مِلء الشاشة =====
     في الملء ينسحب الدُّرجُ إلى فوق ويغيب (‎styles.css‎)، وهذا ما يردّه: مقاربةُ الحافّة العليا.
     وله **عتبتان لا واحدة**: يُطلّ إن بلغتَ ‎٦px‎ من أعلى الشاشة، ولا ينزوي حتى تنزل تحت
     حافّته السفلى بـ‎٢٦px‎. ولو كان الحدُّ واحدًا لَأفنى ظهورُه نفسَه: يظهر فيزيح المؤشّرَ عن
     شرطه فيغيب فيتحقّق الشرطُ ثانيةً… ارتعاشٌ لا ينقطع عند الحدّ.
     والقياسُ ‎offsetHeight‎ لا ‎getBoundingClientRect‎: الأوّلُ ارتفاعُ التخطيط لا تُزيحه الحركةُ
     الجارية، فيُقرأ صحيحًا وسطَها — والثاني يُقرأ منقوصًا ما دام الدُّرجُ في طريقه نازلًا.
     ويُقاس مرّةً عند الإطلال لا في كلّ حركة: مقاسُه لا يتبدّل ما دام مطويًّا */
  const CD_PEEK_IN = 6, CD_PEEK_OUT = 26;
  let cdPeeking = false, cdPeekBot = 0;
  function cdPeekOff() {
    const dw = document.getElementById('cd-drawer');
    if (dw) dw.classList.remove('is-peek');
    cdPeeking = false;
  }
  function cdPeekAt(y) {
    const modal = document.getElementById('card-modal'), dw = document.getElementById('cd-drawer');
    if (!modal || !dw || modal.hidden) return;
    /* لا إطلالةَ إلّا في الملء وعلى دُرجٍ مطويّ — وما سواهما يُنسي ما كان */
    if (!(modal.classList.contains('snap-full') || modal.classList.contains('is-away'))
      || dw.classList.contains('is-open')) {
      if (cdPeeking) cdPeekOff();
      return;
    }
    if (!cdPeeking) {
      if (y > CD_PEEK_IN) return;
      cdPeeking = true; cdPeekBot = dw.offsetHeight + CD_PEEK_OUT;
      dw.classList.add('is-peek');
    } else if (y > cdPeekBot) cdPeekOff();
  }
  document.addEventListener('pointermove', e => {
    const m = document.getElementById('card-modal');
    if (cardDlg || (m && m.classList.contains('is-away'))) cdPeekAt(e.clientY);
  });
  /* أين ابتدأت الضغطة: الإغلاقُ بالضغط على العتمة يشترط أن تبدأ خارجَ الأسطح **وتنتهي**
     خارجها. ولولا هذا لَأغلقت سحبةٌ بدأت في الترويسة وانتهت فوق العتمة النافذةَ:
     حدثُ النقر يقع على أقرب جدٍّ يجمع المبدأ والمنتهى، وهو العتمةُ نفسُها */
  let cdDownIn = false;
  /* ===== تعليقُ النافذة من المؤشّر =====
     الإزاحةُ تُحسب من موضعها الطبيعيّ حتى تقع حافّتُها حيث أُريد لها — لا حيث اتّفق */
  function cdHang(stage, wantL, wantT) {
    const r = stage.getBoundingClientRect();
    const baseL = r.left - (cardDlg.dx || 0), baseT = r.top - (cardDlg.dy || 0);
    cardDlg.dx = wantL - baseL; cardDlg.dy = wantT - baseT;
    cdApplyPos();
  }
  /* ===== لمسةُ نافذةٍ تُركّزها =====
     في طور **الالتقاط** قصدًا: مستمعو السحب والتوسيع والكتابة كلُّهم يعملون على المركَّزة،
     فيجب أن يقع التركيزُ قبلهم لا بعدهم — وإلّا سُحبت نافذةٌ وكُتب في غيرها.
     ولا إعادةَ رسمٍ هنا: DOM المهجورة سليمٌ كما تركته (لا يُبدَّل إلّا وهي مركَّزة)،
     وإعادةُ الرسم تستبدل العنصرَ تحت إصبعك فتضيع الضغطةُ التي قصدتَها */
  document.addEventListener('pointerdown', e => {
    if (!cdWins.length || !e.target.closest) return;
    const st = e.target.closest('#card-modal .cd-stage');
    if (!st) return;
    const w = cdWins.find(x => x.el === st);
    if (w) cdFocusWin(w);
  }, true);
  document.addEventListener('pointerdown', e => {
    if (e.button) return;
    /* ===== وموضعُ الضغطة يُقيَّد ولو لم تكن نافذةٌ مركَّزة =====
       كان القيدُ بعد سؤال ‎cardDlg‎، فإذا طُويت آخرُ نافذةٍ لم يُحدَّث بعدَها أبدًا — فيبقى
       على قيمته من ضغطة الزرّ ‎−‎ نفسِه، وهي **داخل** المسرح. فتُقرأ كلُّ ضغطةٍ بعدها
       «ابتدأت في النافذة» فتُمنع العتمةُ من الإغلاق: شاشةٌ عاتمةٌ بترويساتٍ لا نافذةَ
       تحتها ولا مخرجَ منها. وهو خبرٌ عن **الصفحة** لا عن نافذةٍ بعينها، فموضعُه قبل السؤال */
    cdDownIn = !!(e.target.closest && e.target.closest('.cd-stage, .cd-bub, .cd-dw'));
    if (!cardDlg) return;
    /* و‎.xt-hd‎ ثالثةٌ: ترويسةُ الاختبار هي ترويسةُ نافذته، فيُسحب منها كما يُسحب من
       شريط البطاقة. و‎CD_NODRAG‎ يحرسها فلا يُسحب من زرٍّ ولا حقلٍ فيها */
    const grip = e.target.closest('#cd-card .cd-bar, #cd-card .cd-meta, #cd-card .xt-hd');
    if (!grip || e.target.closest(CD_NODRAG)) return;
    const stage = cdStage();
    if (!stage) return;
    e.preventDefault();
    /* سحبُ نافذةٍ ملصقة يفكّها أوّلًا فتعود إلى مقاسها ثمّ تتبع اليد — كما في ويندوز.
       ويُفكّ **قبل** القياس، وإلّا قِست حدودَ الملصقة وانتقلت بها المفكوكة.
       وبلا انسياب (‎quiet‎): اليدُ ممسكةٌ بها، فلا تُساق إلى مقاسها متمهّلةً وهي تُسحب */
    if (cardDlg.snap) {
      /* ===== المفكوكةُ تُعلَّق من موضع الإمساك نفسِه =====
         الوديعةُ (موضعُها قبل التكبير) تصلح لزرّ الاستعادة، ولا تصلح هنا: أمسكتَ ترويسةً
         تملأ العرض، فلو ردَدْتُها إلى موضعها القديم لَبقيَ المؤشّرُ حيث أمسك — بعيدًا عنها،
         فوق العتمة. فتفلتُ من يدك، ثمّ تُغلق الضغطةُ النافذةَ وكأنّك قصدتَ خارجَها.
         فيُحفظ الإمساكُ **نسبةً** من عرض الترويسة و**بُعدًا** عن رأسها، ثمّ تُعلَّق
         المفكوكةُ بهما — فتبقى تحت إصبعك من الموضع نفسِه مهما تبدّل العرض. وهي سُنّةُ ويندوز */
      const r0 = stage.getBoundingClientRect();
      const fx = r0.width ? (e.clientX - r0.left) / r0.width : .5;
      const gy = e.clientY - r0.top;
      cdSnapTo(null, true);
      cdHang(stage, e.clientX - fx * stage.getBoundingClientRect().width, e.clientY - gy);
    }
    /* ===== الحدودُ تُقاس مرّةً عند الإمساك لا في كل حركة =====
       كان كلُّ ‎pointermove‎ يستدعي ‎getBoundingClientRect‎ — وهو يُجبر المتصفّح على إعادة
       تخطيطٍ متزامنة قبل أن يجيب، فتتراكم الأعمالُ ويتخلّف الإطارُ عن اليد.
       والمقاسُ لا يتغيّر أثناء السحب أصلًا، فيُؤخذ هنا وتبقى الحركةُ حسابًا خالصًا:
       طرحٌ وحصرٌ وكتابةُ ‎transform‎، بلا قراءةٍ من التخطيط البتّة */
    const r = stage.getBoundingClientRect();
    const ox = cardDlg.dx || 0, oy = cardDlg.dy || 0;
    const baseL = r.left - ox, baseT = r.top - oy;   /* موضعُه لو لم يُنقل */
    const lim = 60;                                  /* يبقى من الترويسة ما يُمسَك به */
    cdDrag = {
      x: e.clientX, y: e.clientY, ox, oy, stage, on: false,
      minX: lim - r.width - baseL, maxX: innerWidth - lim - baseL,
      minY: -baseT, maxY: innerHeight - lim - baseT,
    };
    /* المؤشّر يتبدّل بالإمساك لا بالمرور — والوعدُ بالفعل لا يُقطع قبل أن يُطلَب */
    document.body.classList.add('cd-grip');
  });
  document.addEventListener('pointermove', e => {
    const s = cdDrag;
    if (!s) return;
    if (e.buttons === 0) { cdDragEnd(); return; }   /* شفاءٌ ذاتيّ لو ضاع ‎pointerup‎ */
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.on) {
      if (Math.abs(dx) + Math.abs(dy) < 4) return;    /* عتبة: لا نقلَ بنقرة */
      s.on = true;
      document.body.classList.add('cd-moving');
    }
    e.preventDefault();
    /* الكتابةُ فورًا في المستمع لا في ‎rAF‎: المتصفّح يوحّد أحداثَ المؤشّر إلى واحدٍ لكلّ إطار
       أصلًا، فتأجيلُها إلى الإطار التالي يزيد تأخيرًا ولا يوفّر عملًا */
    const x = s.ox + dx, y = s.oy + dy;
    cardDlg.dx = x < s.minX ? s.minX : x > s.maxX ? s.maxX : x;
    cardDlg.dy = y < s.minY ? s.minY : y > s.maxY ? s.maxY : y;
    /* ‎translate3d‎ لا ‎translate‎: تُرفع الطبقةُ إلى المُركِّب فتنزلق بلا إعادة رسمٍ لظلّها
       ولا لما تحتها من ضبابٍ خلفيّ — وهو أثقلُ ما في المشهد */
    s.stage.style.transform = `translate3d(${cardDlg.dx}px, ${cardDlg.dy}px, 0)`;
    /* المنطقةُ حسابٌ خالص، ولا تُكتب إلا إن **تبدّلت** — فلا لمسَ للـDOM في كل حركة */
    const z = cdZoneAt(e.clientX, e.clientY);
    if (z !== s.zone) { s.zone = z; cdShowZone(z, e.clientX); }
    else if (z === 'full') cdAimZone(e.clientX);   /* مشيٌ على الرأس: يُسدَّد الأصل ولا يُعاد النموّ */
  });
  function cdDragEnd() {
    if (!cdDrag) return;
    const z = cdDrag.zone;
    document.body.classList.remove('cd-moving', 'cd-grip');
    cdShowZone(null);
    cdDrag = null;
    /* الإفلاتُ على منطقة يُلصق — والشبحُ سبق فوعد، فما وقع هو ما وُعد به */
    if (z) cdSnapTo(z);
  }
  document.addEventListener('pointerup', cdDragEnd);
  document.addEventListener('pointercancel', cdDragEnd);
  /* الموضع يعيش في ‎cardDlg‎ فينجو من إعادة الرسم، ويُنسى بإغلاق النافذة */
  /* موضعُ نافذةٍ بعينها — يُكتب على مسرحها هي، فالكومةُ تُزاح كلُّها لا المركَّزةُ وحدها */
  const cdPutPos = w => {
    if (!w || !w.el) return;
    const x = w.dx || 0, y = w.dy || 0;
    w.el.style.transform = (x || y) ? `translate3d(${x}px, ${y}px, 0)` : '';
  };
  const cdApplyPos = () => {
    if (cardDlg && cardDlg.el) { cdPutPos(cardDlg); return; }
    const stage = cdStage();
    if (stage) stage.style.transform = '';
  };
  /* ===== المقاسُ يعيش في ‎cardDlg‎ كالموضع =====
     ويُمحى في الملصقة: الملءُ يحكم بحوافّه الأربع، والمقاسُ المكتوب في النمط يغلبه
     (النمطُ أقوى من الملفّ) فتخرج نافذةٌ بعرض ‎720‎ ملتصقةٌ بحافّةٍ واحدة.
     ويعود بفكّ الإلصاق، فتستردّ ما وسّعتَه لا ما وُلدت به */
  const cdApplySize = () => {
    const stage = cdStage();
    if (!stage) return;
    const free = cardDlg && !cardDlg.snap;
    const w = free && cardDlg.w, h = free && cardDlg.h;
    stage.classList.toggle('is-sized', !!(w || h));
    stage.style.width = w ? w + 'px' : '';
    stage.style.height = h ? h + 'px' : '';
    cdShade(stage.querySelector('.cd-body'));
  };
  /* هل وقع القطعُ فعلًا؟ سؤالٌ لا تجيبه CSS: المستطيلُ يحتضن نصَّه فيتساوى المقاسان،
     فلا حدَّ ثابتًا يُقاس عليه. فتُقارن سعتُه بمحتواه بعد كلّ رسمٍ وعند كلّ تبدّلٍ في العرض */
  function cdPathFit() {
    const p = document.getElementById('cd-path');
    if (p) p.classList.toggle('is-cut', p.scrollWidth - p.clientWidth > 1);
  }
  /* ===== الترويسةُ عند أضيق عرض: تُخلع الصورةُ ويبقى الخبر =====
     الشبكةُ تمنع الركوبَ (كلُّ عمودٍ يقف عند متنه)، والاسمُ يُقصّ بنقاطه — وذلك يكفي في
     العروض كلِّها إلّا أدناها: هناك يبقى في الترويسة ثلاثةُ متونٍ لا تنكمش (الأزرارُ
     الثلاثةُ · الختمُ بكعبه · كومةُ الوجوه ورقمُها) فتتزاحم على عرضٍ لا يسعها.
     **وأولى ما يُخلع كومةُ الوجوه**: هي صورةٌ للرقم الذي إلى جنبها لا خبرٌ زائدٌ عليه —
     فيذهب الرسمُ ويبقى الخبرُ («٥» ومعه ‎title‎ يقول «مَن عندها الآن»). والأزرارُ لا
     تُخلع (لا مخرجَ للنافذة حينئذٍ)، والختمُ لا يُقصّ (رقمُ نسخةٍ مقصوصٌ خبرٌ مكذوب).
     ===== والقياسُ من الصفحة لا عتبةُ عرضٍ تُكتب =====
     عتبةٌ بالبكسل تكذب: طولُ الاسم واللغةُ والخطُّ تبدّل الحاجةَ في العرض الواحد.
     **ولا يصلح قياسُ المسافة بين المجموعات**: أعمدةُ الشبكة تحفظ فجوتَها (‎--h-gap‎) حتى
     في الضيق، فلا تتقارب المجموعاتُ أبدًا — وإنّما **يفيض الشريطُ كلُّه** عن جسم النافذة.
     ولا يصلح ‎scrollWidth‎ كذلك (وهو مِقياسُ ‎cdPathFit‎): إنّما يصدُق على صندوقٍ يقصّ ما
     فاض، وهذا الشريطُ لا يقصّ — فيردّ عرضَ نفسِه ولو خرج ما فيه عنه.
     فالمقياسُ الصادق: **مجموعُ ما تحتاجه المجموعاتُ الثلاثُ بهوامشها وفجوتيها**، يُقابَل
     بجوف الشريط. ويُنزع الوسمُ قبل القياس ليُقاس الحالُ الطبيعيُّ لا أثرُ القياس السابق */
  /* ============================================================
     مركزُ الحضور فوق مركز النازل — قياسًا لا بحسابٍ مكتوب
     ============================================================
     القاعدةُ قائمةٌ من يوم صارت الترويستان شبكتين: ركنُ الحضور فوق وركنُ الأخبار تحت،
     **والمحاذاةُ مركزٌ بمركزٍ لا حدٌّ بحدّ** — فالكتلتان مختلفتا العرض لا يستوي حدّاهما
     إلّا بأن تُمطَّ الأضيقُ من جوفها.
     ولم تكن تُدرَك برقمٍ مكتوب: **كلتا الكتلتين متغيّرةُ العرض**. النازلُ يتّسع بمنازل
     أرقامه (‎7‎ و‎1042‎ لا يستويان)، والحضورُ يتّسع بمن حضر (خاوياتٌ أربعٌ ورقمٌ في الصفر،
     ووجهٌ وشارةٌ في الواحد، وثلاثةٌ وشارةٌ فيما فوق). فأيُّ رقمٍ يُذاق اليومَ يكذب غدًا.
     فيُقاس المركزان ويُكتب فرقُهما.
     ===== والمدى المقيسُ في التذييل هو **الصفُّ الأعلى** =====
     من حافّة رمز التنزيل إلى حافّة رقم التعليقات — وهو أوسعُ الصفّين، وبه يقوم عرضُ
     الركن كلِّه. ولو قيس الوعاءُ لَتبع أوسعَ ما فيه وهو هو، إلّا أن ينقلب فيصير
     السفليُّ أوسعَ — فيُقاس المقصودُ صراحةً لا ما يوافقه اليومَ.
     ===== وقراءةٌ مجموعةٌ ثمّ كتابةٌ مجموعة =====
     ‎getBoundingClientRect‎ يُجبر التخطيط، والنوافذُ قد تكون عدّة — فلو تخالفت القراءةُ
     والكتابةُ لَأُعيد تخطيطُ الصفحة مع كلّ نافذة (وهي علّةُ ألسنة المطويّات نفسُها).
     ===== ولا يُكتب إلّا ما تغيّر =====
     تُستدعى مع كلّ رسمٍ ومع كلّ تحجيمٍ للنافذة، وأكثرُ ذلك لا يبدّل شيئًا — وكتابةُ
     خاصّيّةٍ بقيمتها تُبطل الأنماطَ المحسوبة وإن لم يتغيّر المرسوم */
  function cdHereFit() {
    const stages = [].slice.call(document.querySelectorAll('#card-modal .cd-stage'));
    if (!stages.length) return;
    const jobs = [];
    stages.forEach(st => {
      /* ===== والمحاذاةُ تبلغ نافذةَ الاختبار كذلك =====
         الكتلتان فيها هما هما (كومةُ حضورٍ في ترويسة وصفَّا أخبارٍ في ذيل)، لكنّ
         وعاءيهما غيرُ وعاءي البطاقة: ‎.xt-hd‎ مكانَ ‎.cd-meta‎ و‎.xt-info‎ مكانَ
         ‎.cd-foot‎. فيُزاد المُنتقيان ولا تُنسخ الدالّة — القياسُ واحدٌ والحسابُ واحد،
         فلو أُفردت لَافترق المحوران يومَ يُعدَّل أحدُهما */
      const here = st.querySelector('.cd-meta .cd-here, .xt-hd > .cd-here');
      if (!here) return;
      const row = st.querySelector('.cd-foot .cd-stats .cd-nrow, .xt-info .cd-stats .cd-nrow');
      /* لا نازلَ تحتها (أمٌّ والدةٌ أو بطاقةٌ لم تنزل): لا محورَ تُحاذى إليه، فتعود إلى أساسها */
      if (!row) { jobs.push([here, null]); return; }
      jobs.push([here, here.getBoundingClientRect(), row.getBoundingClientRect()]);
    });
    jobs.forEach(([here, h, r]) => {
      if (!h) { if (here.style.getPropertyValue('--here-fit')) here.style.removeProperty('--here-fit'); return; }
      if (!h.width || !r.width) return;   /* نافذةٌ مطويّةٌ لا تُقاس */
      const cur = parseFloat(here.style.getPropertyValue('--here-fit')) || 0;
      const dx = (r.left + r.width / 2) - (h.left + h.width / 2);
      if (Math.abs(dx) < .5) return;
      here.style.setProperty('--here-fit', (Math.round((cur + dx) * 10) / 10) + 'px');
    });
  }
  const CD_TIGHT = 6;
  function cdBarsFit() {
    const st = cdStage(); if (!st) return;
    const bar = st.querySelector('.cd-meta'); if (!bar) return;
    bar.classList.remove('is-tight');
    const cs = getComputedStyle(bar);
    const avail = bar.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    if (avail <= 0) return;   /* نافذةٌ مطويّةٌ أو لم تُرسم بعد: لا يُحكم على أصفار */
    const kids = ['.cd-bar', '.cd-mid', '.cd-here']
      .map(s => bar.querySelector(s)).filter(el => el && el.offsetWidth);
    if (kids.length < 2) return;
    /* والهامشُ من الحاجة: الأركانُ تُزحزح بهوامشها (‎--bar-off‎ · ‎--here-off‎)،
       فعرضُ الجسم وحدَه يُنقص الحسابَ بقدرها */
    const need = kids.reduce((a, el) => {
      const k = getComputedStyle(el);
      return a + el.offsetWidth + (parseFloat(k.marginInlineStart) || 0) + (parseFloat(k.marginInlineEnd) || 0);
    }, 0) + (parseFloat(cs.columnGap) || 0) * (kids.length - 1);
    if (need > avail - CD_TIGHT) bar.classList.add('is-tight');
  }
  /* ===== ظلُّ ما وراء الحافّة =====
     الشريطُ وحده يقول إنّ ثمّة بقيّةً، وهو خيطٌ باهتٌ في الطرف. فيُضاف ظلٌّ تحت الترويسة
     العليا إن كان فوقك كلامٌ ذهب، وفوق السفلى إن كان تحتك كلامٌ لم يأتِ — كلٌّ يظهر بقدر
     جهته وحدها. ولا يُرسم في الجسم نفسِه: هو المنزلق، فيمضي الظلُّ مع الكلام؛ بل في
     الشريطين المُطبقين عليه، وهما ثابتان.
     ويُقاس لكلّ نافذةٍ لا للمركَّزة وحدها: النوافذ تُكدَّس، ولكلٍّ انزلاقُها */
  function cdShade(body) {
    const list = body ? [body] : [].slice.call(document.querySelectorAll('#card-modal .cd-body'));
    list.forEach(b => {
      const card = b.closest('.mmodal__card');
      if (!card) return;
      /* والعتبةُ بكسلان لا واحد: ‎scrollHeight‎ عددٌ صحيحٌ مُدوَّر و‎scrollTop‎ كسريّ،
         فيبقى في القاع فُتاتٌ يزعم بقيّةً ليست ثمّة، فيعلق الظلُّ وأنت في آخر السطر */
      const rest = b.scrollHeight - b.clientHeight - b.scrollTop;
      card.classList.toggle('has-up', b.scrollTop > 2);
      card.classList.toggle('has-dn', rest > 2);
    });
  }
  /* الالتقاطُ في الهبوط: حدثُ الانزلاق لا يصعد، فلا يُسمع من الوثيقة إلّا هكذا —
     ومستمعٌ واحدٌ يكفي النوافذَ كلَّها، حاضرَها وما يولد بعدُ */
  document.addEventListener('scroll', e => {
    const t = e.target;
    if (t && t.classList && t.classList.contains('cd-body')) cdShade(t);
  }, true);
  /* والكتابةُ تغيّر ارتفاعَ المحتوى، والمقاسُ يغيّر سعتَه — فيُعاد الحسابُ عند كليهما */
  document.addEventListener('input', e => {
    if (e.target && e.target.closest && e.target.closest('#card-modal .cd-body')) cdShade();
  }, true);
  /* ونزولُها تحت السهم مشروطٌ بسعةِ ما تحته: تُقاس منسدلةً — الوسمُ يُنزع أوّلًا وإلّا
     قِست المقلوبةَ فأثبتّ القلبَ على نفسه — فإن تجاوزت قاعَ الشاشة قُلبت فوقه */
  function cdListFit() {
    const l = document.getElementById('cd-folderlist');
    if (!l || l.hidden) return;
    l.classList.remove('is-up');
    if (l.getBoundingClientRect().bottom > innerHeight - 8) l.classList.add('is-up');
  }
  addEventListener('resize', () => { if (cardDlg) { cdPathFit(); cdSetFit(); cdBarsFit(); cdHereFit(); cdCmtFit(); cdShade(); } });
  /* ===== شدُّ الحوافّ =====
     المسرحُ متمركزٌ في محوريه، فكلُّ زيادةٍ في المقاس تُقسم على الطرفين — يخرج الطرفُ
     المقابلُ من مكانه وأنت تشدّ هذا. فيُردّ **نصفُ** الزيادة إزاحةً في جهة الشدّ،
     فيثبت الطرفُ المقابل ويتحرّك الذي في يدك وحدَه، كما تفعل النوافذ.
     والكتابةُ فورًا في المستمع لا في ‎rAF‎: المتصفّح يوحّد أحداثَ المؤشّر إطارًا إطارًا أصلًا */
  const CD_MINW = 380, CD_MINH = 240;
  const cdClamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  let cdSize = null;
  document.addEventListener('pointerdown', e => {
    if (!cardDlg || e.button) return;
    const h = e.target.closest('.cd-rz');
    if (!h) return;
    const stage = cdStage();
    if (!stage) return;
    e.preventDefault();
    cdMorphEnd(stage);                 /* حركةٌ جاريةٌ تُطلَق: اليدُ أولى بالمقاس منها */
    /* ===== الملصقةُ تُشدّ فتنفكّ على مقاسها =====
       كان الشدُّ يُردّ في الملصقة بحجّة أنّ «حدودَها الشاشةُ أو نصفُها»، فبدت النافذةُ
       **مقفلةً** في نصف الشاشة: يدُك على الحافّة والمؤشّرُ يَعِد بالتوسيع ولا يقع شيء.
       والصوابُ ما تفعله نوافذُ المكاتب: شدُّ الحافّة يفكّ الإلصاق ويُبقيها **على مقاسها
       وموضعها الحاليَّين**، فتُشدّ من حيث هي بلا قفزة. ويُقاس صندوقُها قبل الفكّ لأنّ الفكّ
       يردّها إلى مقاسها المفكوك، ثمّ يُثبَّت المقاسُ ويُعلَّق الموضعُ عليه */
    if (cardDlg.snap) {
      const r0 = stage.getBoundingClientRect();
      cdSnapTo(null, true);
      cardDlg.w = r0.width; cardDlg.h = r0.height;
      cdApplySize();
      cdHang(stage, r0.left, r0.top);
    }
    const r = stage.getBoundingClientRect();
    cdSize = {
      x: e.clientX, y: e.clientY, stage,
      w: r.width, h: r.height, dx: cardDlg.dx || 0, dy: cardDlg.dy || 0,
      ex: (h.dataset.ex | 0), ey: (h.dataset.ey | 0),
    };
    /* ===== المقاسُ يُكتب مع الصنف في نَفَسٍ واحد =====
       ‎is-sized‎ يُشعل قواعدَ الملء، ومنها أنّ أساس الحقلين صفرٌ (‎flex-basis:0‎) لا يأخذ
       إلّا من فضاءٍ يُقسم. فلو أُشعلت وارتفاعُ المسرح لا يزال من محتواه، انكمش الجوفُ إلى
       فجوته وحدها فارتدّت النافذةُ ومضةً ثمّ عادت بأوّل حركة — وهو ما رأيتَه.
       فيُثبَّت مقاسُها الحاليّ نفسُه أوّلًا: لا يتبدّل شيءٌ في العين، ويستقرّ الفضاءُ
       المقسومُ قبل أن يُطلب قسمُه */
    cardDlg.w = r.width; cardDlg.h = r.height;
    cdApplySize();
    document.body.classList.add('cd-sizing');
    /* مؤشّرُ المقبض يُلبَس الجسدَ كلَّه، فلا ينقلب سهمًا متى سبقت اليدُ الحدَّ */
    document.body.style.cursor = getComputedStyle(h).cursor;
  });
  document.addEventListener('pointermove', e => {
    const s = cdSize;
    if (!s || !cardDlg) return;
    if (e.buttons === 0) { cdSizeEnd(); return; }
    e.preventDefault();
    let w = s.w, hh = s.h, ox = s.dx, oy = s.dy;
    if (s.ex) {
      w = cdClamp(s.w + s.ex * (e.clientX - s.x), CD_MINW, innerWidth);
      ox = s.dx + s.ex * (w - s.w) / 2;
    }
    if (s.ey) {
      hh = cdClamp(s.h + s.ey * (e.clientY - s.y), CD_MINH, innerHeight);
      oy = s.dy + s.ey * (hh - s.h) / 2;
    }
    cardDlg.w = w; cardDlg.h = hh; cardDlg.dx = ox; cardDlg.dy = oy;
    s.stage.style.width = w + 'px';
    s.stage.style.height = hh + 'px';
    s.stage.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
    /* عرضٌ يتبدّل ⇐ يُراجَع قطعُ المسار ومتّسعُ شريط الترس معًا: كلاهما محسوبٌ من العرض،
       ولو تُرك الحسابُ إلى لحظة الفتح وحدها لَبقي حَشْوُ الترويسة على قياس عرضٍ مضى */
    if (s.ex) { cdPathFit(); cdSetFit(); cdBarsFit(); cdHereFit(); }
    /* والظلُّ مع كلّ حركةٍ لا عند الإفلات: الشدُّ يأكل من سعة الجسم أو يزيدها، فيولد القطعُ
       أو ينتهي وأنت شادٌّ بعدُ. والعرضُ كالطول: ضيقُه يُنزل الكلامَ سطرًا فيفيض */
    cdShade(s.stage.querySelector('.cd-body'));
  });
  function cdSizeEnd() {
    if (!cdSize) return;
    cdSize = null;
    document.body.classList.remove('cd-sizing');
    document.body.style.cursor = '';
  }
  document.addEventListener('pointerup', cdSizeEnd);
  document.addEventListener('pointercancel', cdSizeEnd);
  /* ===== التقريبُ بإصبعين على منطقة الوجهين =====
     مأخوذٌ من أنكي بابه: هو نفسُه يقرّب بخاصّة ‎zoom‎ لا بتكبير الخطّ — يكتب في جلده
     ‎body { zoom: … }‎ (‎aqt/webview.py: standard_css‎)، فيكبر كلُّ ما في الصندوق: الحرفُ
     والصورةُ والفراغُ معًا بنسبةٍ واحدة. وقائمتُه تنقل الرقمَ ‎±0.1‎ وتردّه إلى ‎1‎
     (‎aqt/main.py: setupMenus‎)، وإليه يردّ ‎Ctrl+0‎ هنا.
     والقانونُ ضربيٌّ لا جمعيّ: قرصةُ الإصبعين تُرسل عشراتِ الأحداث الصغيرة، فلو جُمع
     ثابتٌ لكلٍّ لَقفزت.
     وكان المقامُ ‎1050‎ ليطابق خطوةَ أنكي (‎±0.1‎) في النقرة الواحدة — وتلك خطوةُ **قائمةٍ**
     تُنقر بالفأرة مرّةً، لا خطوةَ يدٍ تقرص. ثمّ ‎350‎ فلم تكفِ اليدَ أيضًا. فصار ‎200‎:
     النقرةُ ‎×1.65‎، والقرصةُ الكاملةُ (‎deltaY ≈ 300‎ متفرّقةً) تضاعف المقاسَ أربعَ مرّاتٍ
     أو تردّه إلى رُبعه — قرصةٌ واحدةٌ تكفي، ولا تُكسر الأصابع.
     والمدى ‎0.1–10‎: تجاوزنا مدى ‎Qt‎ (‎0.25–5‎) الذي يعمل فيه أنكي عمدًا — طرفاه عنده
     حدُّ نافذةٍ كاملةٍ تُقرأ، وهذان مربّعان في نافذةٍ صغيرة: طرفٌ للنظرة الشاملة على ما
     كتبتَ، وطرفٌ للحرف الكبير.
     والقرصةُ تصل المتصفّحَ حدثَ عجلةٍ ومعه ‎ctrlKey‎ — فالبابان بابٌ واحد.
     ويقع التقريبُ على ‎.cd-in‎ وحده: اللافتتان (الوجه والظهر) أختاه لا ابنتاه، فتثبتان */
  const CD_ZMIN = .1, CD_ZMAX = 10;
  /* ===== القرصةُ تصغّر ما في النافذة لا النافذةَ =====
     النافذةُ على طبيعتها قامتُها من محتواها، فكان التبعيدُ يقصّر المربّعين فتقصر معهما —
     تهرب من تحت أصابعك وأنت تنظر. وأنكي ليس كذلك: صندوقُه ثابتُ القامة، فإذا صغّرتَ
     ارتفع الوجهُ والظهرُ إلى أعلاه وبقي ما تحتهما فراغًا بلون الجلد.
     فتُثبَّت قامتُها عند **أوّل** قرصةٍ على ما هي عليه ساعتَها، ثمّ لا تتبع المحتوى بعدُ.
     والملصقةُ والمكبَّرةُ مستثنيتان: قامتُهما مفروضةٌ أصلًا من حافّة الشاشة */
  function cdZoomLock(w) {
    if (!w || w.snap || w.h) return;
    w.h = w.el.getBoundingClientRect().height;
    if (w === cardDlg) { cdApplySize(); return; }
    w.el.classList.add('is-sized');
    w.el.style.height = w.h + 'px';
  }
  function cdZoom(w, z) {
    if (!w || !w.el) return;
    cdZoomLock(w);
    w.zoom = Math.min(CD_ZMAX, Math.max(CD_ZMIN, z));
    /* ===== والورقةُ تُقرَّب من بابها هي =====
       التقريبُ في البطاقة صبغةٌ على المسرح (‎--cd-z‎)، وفي الورقة ضربٌ في المُلاءمة
       (‎--sh-sc‎) — فلو صُبغ المسرحُ ههنا لَتقارب الأمران فتضاعف التصغير.
       والمِسطرةُ بعده مشتركةٌ لهما: مصدرُ الرقم واحدٌ فلا يفترق المكتوبُ عن المرئيّ */
    if (w.what === 'sheet') {
      /* ولا يُعاد القياسُ ههنا: المُلاءمةُ خبرٌ عن **النافذة** لا عن التقريب، ولم تتبدّل النافذة.
         فتُضرب المحفوظةُ في التقريب وتُكتب — كتابةٌ واحدةٌ بلا قراءةٍ ولا تخطيط */
      shApply(w.el.querySelector('.mmodal__card'), w);
      w.el.querySelectorAll('.cd-zval').forEach(n => { n.textContent = Math.round(w.zoom * 100) + '%'; });
      return;
    }
    w.el.style.setProperty('--cd-z', w.zoom);
    /* والمِسطرةُ تقرأ الرقمَ من مصدره: مهما جاء التقريبُ — من إصبعين أو من زرٍّ أو من
       ‎Ctrl+0‎ — فمن هنا يمرّ، فيستحيل أن يفترق المكتوبُ عن المرئيّ */
    w.el.querySelectorAll('.cd-zval').forEach(n => { n.textContent = Math.round(w.zoom * 100) + '%'; });
    cdShade(w.el.querySelector('.cd-body'));
  }
  /* والزرّان خطوتُهما خطوةُ قائمة أنكي نفسُها: ‎±0.1‎ جمعًا لا ضربًا — فهذه لليد الهادئة
     تطلب رقمًا مستديرًا (‎100% → 110%‎)، وتلك للأصابع تطلب مسافةً بقرصةٍ واحدة.
     والتقريبُ إلى منزلةٍ واحدة يمنع فُتاتَ العشريّات من أن يجعله ‎0.7000000000000001‎ */
  document.addEventListener('mousedown', e => {
    /* الضغطةُ لا تسلب المؤشّرَ من النصّ: لو ضاع المحدَّدُ لَبطل التنسيقُ بعده */
    if (e.target.closest && e.target.closest('.cd-zb')) e.preventDefault();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.cd-zb');
    if (!b) return;
    const w = cdZoomWin(b);
    if (!w) return;
    cdZoom(w, Math.round(((w.zoom || 1) + (+b.dataset.zs) * .1) * 10) / 10);
  });
  const cdZoomWin = el => {
    const st = el && el.closest && el.closest('.cd-stage');
    return (st && cdWins.find(x => x.el === st)) || cardDlg;
  };
  /* ===== القرصةُ تُجمع وتُنفَّذ مرّةً في الإطار =====
     القرصةُ الواحدة تبعث عشراتِ أحداث العجلة في الثانية، وكلُّ حدثٍ كان يُطبَّق فورًا —
     فيرسم المتصفّحُ عشرَ مرّاتٍ بين إطارٍ وإطار، وتسعةٌ منها لا يراها أحد.
     فتُراكم الدفعاتُ ويُنفَّذ حاصلُها في ‎requestAnimationFrame‎: رسمٌ واحدٌ لكلّ إطارٍ مرئيّ،
     والحركةُ هي هي لأنّ الأسّ يجمع (‎exp(a)·exp(b) = exp(a+b)‎) — لا تُفقد دفعةٌ ولا تُضاعف */
  let cdWhReq = 0, cdWhAcc = 0, cdWhWin = null;
  document.addEventListener('wheel', e => {
    if (!cardDlg || !e.ctrlKey || !e.target.closest) return;
    /* ومسرحُ الورق ‎.sh-body‎ يحمل ‎.cd-body‎ معه، فالقرصةُ تبلغه بهذا الشرط نفسِه */
    /* وجوفُ الاختبار معها: هو جسمُها الممرَّر وإن لم يحمل ‎.cd-body‎ */
    if (!e.target.closest('#card-modal .cd-body, #card-modal .xt-bd')) return;
    e.preventDefault();                       /* وإلّا قرّب المتصفّحُ الصفحةَ كلَّها */
    cdWhWin = cdZoomWin(e.target);
    cdWhAcc += e.deltaY;
    if (cdWhReq) return;
    cdWhReq = requestAnimationFrame(() => {
      cdWhReq = 0;
      const d = cdWhAcc; cdWhAcc = 0;
      if (cdWhWin) cdZoom(cdWhWin, (cdWhWin.zoom || 1) * Math.exp(-d / 200));
    });
  }, { passive: false });                     /* ‎passive‎ افتراضًا في العجلة، ولا منعَ فيها */
  document.addEventListener('keydown', e => {
    if (!cardDlg || !(e.ctrlKey || e.metaKey) || e.key !== '0') return;
    if (!document.getElementById('card-modal') || document.getElementById('card-modal').hidden) return;
    e.preventDefault();
    cdZoom(cdZoomWin(e.target) || cardDlg, 1);
  });
  /* ===== الجدولُ يتبع المؤشّر — أيُّ مربّعٍ يستقبل حرفَك =====
     صنفٌ واحدٌ على المربّع الذي فيه المؤشّر، يُنزع عن إخوته في **جسمه هو** لا في
     النوافذ الأخرى: النوافذُ تتراكب ولكلٍّ مربّعُها الحيّ، فالمدى محصورٌ في ‎.cd-body‎
     التي وقع فيها التركيز.
     و‎focusin‎ لا ‎focus‎: الثانيةُ لا تتصاعد، وخياراتُ «المتعدّد» تُبنى وتُهدم فلا
     يصحّ ربطُ مستمعٍ بكلّ واحدٍ منها.
     والشرطُ ‎.cd-in‎ لا ‎.cd-field‎: لسانُ الخيار زرٌّ داخل المربّع، وضغطُه يجعله الصوابَ
     ولا ينقل الكتابةَ إليه — فلو تبع الجدولُ التركيزَ مطلقًا لَانتقل إلى مربّعٍ ليس
     فيه مؤشّرُك فقال كذبًا.
     ولا مقابلَ له في ‎focusout‎: مغادرةُ التركيز وحدَها لا تُطفئ الجدول — الفقاعةُ والترسُ
     والمسارُ تسلب التركيزَ لحظةً ولا تعني أنّ حرفَك انتقل. وإنّما يُطفئه فعلٌ صريحٌ:
     نقرةٌ في الخلفيّة (‎cdDim‎ أسفلَه). وفتحُ البطاقة يضع المؤشّرَ في الوجه بنفسه،
     فأوّلُ جدولٍ يقع بلا سطرٍ زائد */
  document.addEventListener('focusin', e => {
    const inp = e.target.closest && e.target.closest('.cd-in');
    if (!inp) return;
    cdLive(inp.closest('.cd-field'));
  });
  /* ===== ونقرةٌ في الخلفيّة تُطفئ الجدول =====
     كان الجدولُ يُوقَد ولا يُطفأ: يبقى ذهبيًّا على آخر مربّعٍ كتبتَ فيه ولو تركتَ البطاقة
     كلَّها، فيُقرأ «هنا يقع حرفُك» وليس هناك حرفٌ يقع. فصار له مُطفئ: نقرةٌ على **جلد**
     البطاقة — الفجوةُ بين المربّعات، وما تحت آخرها، وخلاءُ الترويسة والذيل — تُخلي
     الاختيار فلا يبقى مربّعٌ محدَّد. وهي قاعدةٌ واحدةٌ للأنواع الأربعة: الوجهان والفراغ
     والإخفاء والمتعدّد سواءٌ، لأنّ الجدولَ صنفٌ واحدٌ عليها جميعًا.
     ويُستثنى شيئان لا ثالثَ لهما:
       · **المربّع** نفسُه وما فيه (ومنه لسانُه): النقرُ عليه شأنُ صاحبه.
       · **ما يُضغط** (زرٌّ أو مدخلٌ أو تسمية): تلك أدواتٌ تسلب التركيزَ لحظةً ولا تنقل
         الكتابة — ولو أطفأها الجدولُ لَعاد العيبُ الذي من أجله لم يُربط بـ‎focusout‎.
     والتركيزُ يُرفع مع الجدول لا يُترك: لو بقي المؤشّرُ في مربّعٍ لا شارةَ عليه لَكذب
     أحدُهما الآخر — حرفُك ينزل حيث لا ترى.
     و‎pointerdown‎ لا ‎click‎: الطفءُ يقع مع الضغطة، فلا تُرى وميضةُ جدولٍ باقٍ حتى تُرفع اليد */
  const CD_PRESSABLE = 'button, input, select, textarea, label, a, [contenteditable="true"], [role="button"]';
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest) return;
    const card = e.target.closest('#card-modal .mmodal__card');
    if (!card || e.target.closest('.cd-field') || e.target.closest(CD_PRESSABLE)) return;
    const body = card.querySelector('.cd-body');
    if (!body || !body.querySelector('.cd-field.is-live')) return;
    body.querySelectorAll('.cd-field').forEach(x => x.classList.remove('is-live'));
    const a = document.activeElement;
    if (a && a.closest && a.closest('.cd-body') === body) a.blur();
  });

  /* أحداث النافذة على عنصرها هي: المستمع الكبير مربوط بـ‎.cm-panel‎ والنافذة خارجها */
  /* ===== ألسنةُ المطويّات: مستمعٌ على الشريط وحدَه =====
     ولا يُدرج في مستمع الصدَفة: ذاك يبتدئ بسؤال ‎cardDlg‎ ويرجع إن لم تكن، وأحوجُ ما
     يكون اللسانُ إلى الضغط حين لا تكون — إذ طُويت آخرُ نافذةٍ فلم يبقَ إلّا هو */
  $('#cd-mins').addEventListener('click', e => {
    const t = e.target.closest('.cd-mtab');
    if (!t) return;
    const w = cdWins.find(x => x.uid === t.dataset.mid);
    if (!w) return;
    /* مطويّةٌ ⇐ تُنشر · قائمةٌ غيرُ مركَّزةٍ ⇐ تُركَّز · مركَّزةٌ ⇐ لا شيء.
       ولا تُطوى المركَّزةُ بضغطة لسانها كما تفعل أشرطةُ المهامّ: نقرةٌ في غير موضعها
       تُغيّب النافذةَ التي تكتب فيها، وذلك أضرُّ من فعلٍ لا يقع */
    if (w.min) cdMinOpen(w); else cdFocusWin(w);
  });
  $('#card-modal').addEventListener('click', e => {
    /* ===== ولا نافذةَ مركَّزة: كلُّهنّ مطويّاتٌ =====
       فسائرُ فروع هذا المستمع تسأل عن نافذةٍ لا وجودَ لها. ولا يبقى في الصدَفة ما يُضغط
       إلّا ثلاثة: لسانٌ (وله مستمعُه أعلاه)، ودُرجٌ يُفتح فيُؤخذ منه نوعٌ جديد،
       وعتمةٌ تُنهي الجلسة. والدُّرجُ ههنا حالُه في الصفحة لا في سِجلّ نافذة — إذ لا سِجلَّ */
    if (!cardDlg) {
      if (e.target.closest('.cd-mtab')) return;
      const hd = e.target.closest('#cd-handle');
      if (hd) {
        const on = !$('#cd-drawer').classList.contains('is-open');
        $('#cd-drawer').classList.toggle('is-open', on);
        $('#card-modal').classList.toggle('is-tray', on);
        hd.setAttribute('aria-expanded', on ? 'true' : 'false');
        cdHandleIc(on);
        cdTray = on;
        return;
      }
      const k0 = e.target.closest('.cd-kb');
      if (k0) { cdSpawn(k0.dataset.ck); return; }
      if (!cdDownIn && !e.target.closest('.cd-stage') && !e.target.closest('.cd-bub')
        && !e.target.closest('.cd-dw')) cdShellHide();
      return;
    }
    /* الصورةُ تُحدَّد بنقرةٍ عليها، وتُفكّ بنقرةٍ في غيرها — قبل كلّ شيء، فالتحديدُ
       يقع على أيّ صورةٍ في أيّ حقل، ولا يمنعه فرعٌ من فروع هذا المستمع */
    { const im = e.target.closest('.cd-in img');
      if (im) { imSelSet(im); return; }
      imSelClear(); }
    if (e.target.closest('#cd-close')) { cdShutCard(); return; }
    /* جلدُ الورقة: يُقطع عن الموقع ما دامت النافذةُ قائمةً، ويعود إليه بفتحةٍ جديدة.
       ولا يُعاد رسمُ الورق لأجله — التوكناتُ على البطاقة، فسمةٌ واحدةٌ تقلب الورقَ كلَّه.
       وأمّا **الصورُ** فتُعاد صبغتُها في ‎shSkinApply‎: نسختُها تتبع جلدَ الورقة */
    { const sb = e.target.closest('#sh-skin');
      if (sb) { shSkinSes = sb.dataset.to === 'dark' ? 'dark' : 'light'; shSkinApply(); return; } }
    /* التكبير: النافذة تملأ الشاشة تقريبًا وتتمدّد معها الحقول */
    /* زرُّ التكبير هو زرُّ الإلصاق بالشاشة كاملة — ويفكّ أيَّ إلصاقٍ كان (نصفًا أو ملءًا) */
    if (e.target.closest('#cd-max')) { cdSnapTo(cardDlg.snap ? null : 'full'); return; }
    /* الإغلاقُ المؤقّت: النافذةُ تنكمش إلى لسانٍ في حافّة الشاشة ولا تُودَّع */
    if (e.target.closest('#cd-min')) { cdMinWin(cardDlg); return; }
    /* وزرُّ «نافذة مستقلّة» رُفع من الترويسة بطلب صاحب الموقع، وحلّ ترسُ الحفظ مكانَه —
       فلا مستمعَ له. والطريقُ إليها باقٍ بالعنوان (‎#add=cards|…‎) لمن أراده */
    /* ===== الصَّيحة: بلاغُك يُرفع أو يُسحب =====
       ولا يُعاد رسمُ النافذة: ‎renderCardDlg‎ تهدم الكعبَ وتبنيه، فينقطع المرورُ عن الزرّ
       فينطبق النصُّ في اللحظة التي ضُغط فيها — والمؤشّرُ ما زال فوقه. فتُكتب الأرقامُ
       في مواضعها (‎cdWarnPaint‎) ويبقى المفتوحُ مفتوحًا.
       وهو في الاختبار كما هو في التحرير: الكعبُ واحدٌ ومستمعُه واحد */
    if (e.target.closest('#cd-warnb')) { cdWarnToggle(cdNode()); return; }
    /* ===== «الوِردة»: بابان في زرٍّ واحد =====
       القارئُ يفتح نافذةَ اقتراح، وصاحبُها يفتح صندوقَ الوارد. والدورُ يُسأل مرّةً
       (‎prRole‎) فلا يُكتب الحكمُ في موضعين */
    if (e.target.closest('#cd-propsb')) {
      const role = prRole();
      if (role === 'do') { prOpen('new', prTarget(cdNode()), null); return; }
      if (role === 'box') {
        /* ===== ويُفتح بالغرس لا بإعادة الرسم =====
           كان ‎cdRenderFx‎ تُعيد بناءَ الترويسة، وهي تُدخل أبناءَها بحركةٍ فيها
           ‎transform‎ — و‎transform‎ **ينشئ سياقَ تراكبٍ جديدًا**، فتُرسم الفقاعةُ داخله
           فتقع خلف مستطيلات الإدخال، فإذا انتهت الحركةُ وذهب التحويلُ عادت فوقها.
           فيراها المستخدمُ تقفز من خلفٍ إلى أمام. وهو ما بُلِّغ.
           والعلاجُ ألّا تُعاد الترويسةُ أصلًا: تُغرس الفقاعةُ في كعبها وتُنزع منه —
           وهو أخفُّ وأصدق، وحكمُ إطفائها بالنزع نفسُه.
           والمروحةُ والفقاعةُ تُطويان بالنزع كذلك: ثلاثتُهنّ يتدلّين من الشريط نفسِه */
        const box = document.querySelector('.pr-box');
        if (box) { box.remove(); cardDlg.prBox = false; return; }
        cardDlg.vlist = false;
        const fan = document.querySelector('#cd-meta .cd-fan');
        if (fan) fan.remove();
        cdCmtClose();
        cardDlg.prBox = true;
        const stub = document.querySelector('#cd-meta .cd-stub');
        if (stub) stub.insertAdjacentHTML('beforeend', prBoxHTML());
      }
      return;
    }
    { const pr = e.target.closest('.pr-row');
      if (pr) {
        const n = prTarget(cdNode());
        const rec = ((n && n.pr) || []).find(x => x.id === pr.dataset.prid);
        /* ويُنزع الصندوقُ نزعًا كما فُتح غرسًا: إعادةُ الترويسة هي التي كانت تُقفز
           الفقاعةَ من خلف الحقول إلى أمامها */
        if (rec) { const bx = document.querySelector('.pr-box'); if (bx) bx.remove();
          cardDlg.prBox = false; prOpen('review', n, rec); }
        return; } }
    /* ===== الإرسال: يُكتب على الأصل ثمّ تنصرف النافذة =====
       ويُودَع ما في الحقلين أوّلًا (‎cdCommit‎) — النصُّ في المربّعات لا في العقدة حتى
       يُودع، فإرسالٌ بلا إيداعٍ يبعث نصًّا قديمًا. والعقدةُ مؤقّتةٌ فالإيداعُ فيها آمن */
    if (e.target.closest('#pr-send')) {
      const w = cardDlg, tg = prTgOf(w), nd = w && w.pnode;
      if (!tg || !nd) return;
      cdCommit();
      /* واسمُك وصورتُك يُقيَّدان مع الاقتراح لا يُقرآن منك وقتَ العرض: قد تُبدّلهما،
         والاقتراحُ خبرٌ عمّا كان — ولأنّ صاحبَ البطاقة يراه ولا يرى ملفَّك */
      (tg.pr = tg.pr || []).push({ id: newId(),
        who: (state.profile && state.profile.name) || T().cdMe,
        av: (state.profile && state.profile.img) || '', at: Date.now(),
        v: cdPubV(tg) || 1, f: nd.f || '', b: nd.b || '',
        ctype: nd.ctype || 'basic',
        o: Array.isArray(nd.o) ? JSON.parse(JSON.stringify(nd.o)) : undefined,
        ok: nd.ok, st: 0 });
      save();
      toast(T().prSent);
      cdCloseWin(w);
      return;
    }
    /* ===== والاعتماد يقطع **مسوّدة** لا نسخةً منشورة =====
       ‏‎cdFork‎ ترفع ‎n.pend‎، فتبقى المراجعةُ والنشرُ بيد صاحبها بحلقته — ولو نُشر
       الاقتراحُ مباشرةً لَصار قارئٌ يكتب في المنشور بلا مراجعة.
       والخياراتُ تُنقل يدًا: السجلُّ يحفظ الوجهَ والظهر وحدهما، فما سواهما يُكتب في
       العقدة مباشرةً (حدٌّ مكتوبٌ في ‎ROADMAP-PROPOSALS §٩‎) */
    if (e.target.closest('#pr-adopt')) {
      const w = cardDlg, tg = prTgOf(w), nd = w && w.pnode;
      if (!tg || !nd) return;
      cdCommit();
      cdFork(tg, { f: nd.f || '', b: nd.b || '' });
      if (nd.ctype) tg.ctype = nd.ctype;
      if (Array.isArray(nd.o)) tg.o = JSON.parse(JSON.stringify(nd.o));
      if (nd.ok != null) tg.ok = nd.ok;
      const rec = ((tg.pr) || []).find(x => x.id === (w.prop || {}).rid);
      if (rec) rec.st = 1;
      save();
      toast(T().prTaken);
      cdCloseWin(w);
      /* وسائرُ النوافذ تُعاد: العدّادُ نقص والنسخةُ ارتفعت */
      if (cardDlg) renderCardDlg();
      return;
    }

    /* مِقبض النسخ: يبسط المروحة ويطويها */
    if (e.target.closest('#cd-vbtn')) { cardDlg.vlist = !cardDlg.vlist; renderCardDlg(); return; }
    /* ===== فقاعةُ التعليقات: أيقونةُ العدد هي بابُها =====
       والمروحةُ والفقاعةُ لا تجتمعان: كلتاهما تتدلّى من الشريط نفسِه، فاجتماعُهما تراكبٌ
       لا يُقرأ. ففتحُ إحداهما يطوي الأخرى — كما تفعل لوحتا اللون في الفقاعة */
    /* والزرُّ بابٌ ذو مصراعين: الفتحُ يحتاج رسمًا (اللوحُ يُبنى مع الشريط)، والطيُّ نزعٌ
       وقد وقع قبلَنا في ‎pointerdown‎… إلّا على الزرّ نفسِه، فهو داخلُ المِرساة فلا يطويه.
       فيُطوى هنا صراحةً بالنزع لا بالرسم */
    if (cmtClick(e)) return;
    /* صفٌّ في المروحة: **مطالعةٌ لا غير** — لا تُمسّ ‎n.f/n.b‎ ولا ‎n.pend‎.
       وكان التبديل ينسخ النسخة القديمة في يدك ويرفع ‎pend‎ بلا رقمٍ جديد، فينقض المعنى
       («‎n.v‎ مسوّدة») فتُلوَّن منشورةٌ برتقاليًّا لمجرّد أنّك نظرت في غيرها.
       فالنظرُ نظر، والاستعادةُ فعلٌ يُمضى بزرّه في الشريط — وهي وحدها تقطع نسخة */
    const fanr = e.target.closest('.cd-fanr');
    if (fanr) {
      const v = +fanr.dataset.cv;
      /* ===== وفي دفترك: الضغطةُ **تعيين** لا مطالعة =====
         «ولما يفتحها تكون هي اللي معينة عنده». والمطالعةُ حكمُ صاحب البطاقة: هو يكتب
         في نسخةٍ ويطالع أخرى، فالفصلُ بينهما لازم. وأنت لا تكتب — إنّما تختار أيَّ نصٍّ
         تُذاكر، فالنظرُ والاختيارُ عندك شيءٌ واحد.
         وفعلان بحسب الصفّ: صفٌّ عندك ⇐ انتقالٌ بين نسخك (‎cdGoV‎)، وصفُّ الأصل الجديد
         ⇐ أخذٌ يُودع ما كنتَ عليه أوّلًا ثمّ يأخذ (‎impTake‎) — وبلا الإيداع لا رجعة.
         ثمّ تُعاد الشجرةُ: الشارةُ في الصفّ وعددُ المجلّد فوقه يتبعان ما عيَّنت */
      if (cardDlg.road) {
        const n0 = cdNode();
        const done = n0 && (fanr.dataset.nw ? impTake(n0, v) : cdGoV(n0, v));
        if (done) {
          cardDlg.viewV = null;
          save();
          cdFill(n0.f, n0.b);
          cdQBody(true);
          cardDlg.vlist = false;
          cdRenderFx();
          roadRender();
        }
        return;
      }
      const rec = cdVerList().find(x => x.v === v);
      if (rec) {
        cardDlg.viewV = v !== ((cdNode() || {}).v || 1) ? v : null;
        cdFill(rec.f, rec.b);
        cdQBody(true);   /* نسخةٌ تُطالَع: خياراتُها هي التي تُعرض لا التي في يدك */
      }
      /* المطالعةُ تبدّل تركيبَ الشريط: كومةُ «مَن عندها» تتبع أمنشورةٌ ما تطالعه أم مسوّدة */
      cardDlg.vlist = false;
      cdRenderFx();
      return;
    }
    /* العودةُ من الماضي تقع في المروحة نفسها — ضغطُ صفّ النسخة الحاليّة يردّك إلى ما في يدك */
    /* زرّ السحب: يفتح الدُّرج ويطويه — أيقونةٌ واحدة لحالتين */
    if (e.target.closest('#cd-handle')) { cdTray = !cdTray; renderCardDlg(); return; }
    /* منتقي النوع: أوّل ضغطةٍ تفتح البطاقة، وما بعدها يحوّل نوع المفتوحة.
       والاختيار يطوي الدُّرج في الحالين — فُتح ليُؤخذ منه، وقد أُخذ */
    const kb = e.target.closest('.cd-kb');
    if (kb) {
      /* ===== وفي يدك بطاقةٌ ⇐ الدُّرجُ يفتح نافذةً جديدة =====
         كان يُبدّل نوعَ التي تكتب فيها، فتُغلق واحدةٌ لتُفتح أخرى في مكانها. والدُّرجُ
         بابُ **إضافة** لا بابُ تحويل: فما يُؤخذ منه ينزل نافذةً فوق ما قبله */
      if (cardDlg && cardDlg.picked) { cdSpawn(kb.dataset.ck); return; }
      const first = !cardDlg.picked;
      const src = kb.getBoundingClientRect(), k = kb.dataset.ck;
      cdSetWhich(k);
      /* الدُّرج يبقى مبسوطًا وينكمش إلى مقام العمل — لا يُطوى، فقد يُبدَّل النوع بعدُ */
      /* ===== واختيارُ النوع **يطوي** الدُّرج =====
         كان يُبقيه مبسوطًا (‎tray = true‎)، وهي حالُ البوّابة منسوخةً بلا موجب. وأثرُها
         أنّ حالَ النافذة تبقى «دُرجي مبسوط» أبدًا — و‎cdSyncModal‎ و‎cdDrawerSync‎
         كلتاهما تكتبان ‎is-open‎ من هذه الحال في كلّ تركيزٍ وكلّ رسم. فمتى مسّ صاحبُ
         الموقع ترويسةَ البطاقة الجديدة انبسط اللوحُ من جديد بلا أن يطلبه.
         والصوابُ أنّ النوعَ إذا اختير فقد قُضي أمرُ الدُّرج: البطاقةُ تُكتب لا تُختار.
         ومَن أراد نوعًا آخرَ فـ«+» في متناوله */
      /* والدُّرجُ يبقى كما تركه صاحبُه: هو مبسوطٌ الآن **لأنّك تختار منه**، وطيُّه
         في وجهك عند أوّل ضغطةٍ اختطافٌ لِما تحت يدك — وقد تريد نوعًا ثانيًا.
         (جُرّب طيُّه فرُدّ · ٢٢ أغسطس. ولا يُخشى بقاؤه: حالُه متغيّرٌ واحدٌ لا
          تكتبه إعادةُ رسمٍ ولا تركيزُ نافذة، فبقاؤه مفتوحًا لا يعني انفتاحَه تلقائيًّا) */
      cardDlg.picked = true;
      /* ===== ولسانُها يُولد مع اختيار نوعها لا مع نزول نسختها =====
         البوّابةُ لا لسانَ لها (لا نوعَ بعدُ)، فإذا اختير النوعُ صارت نافذةً تامّةً وحقَّ
         لها لسانُها. والمصالحةُ تُدعى ههنا صراحةً: هي تُدعى من تبدّل البؤرة، والبؤرةُ
         لم تتبدّل — النافذةُ هي هي وإنّما تبدّل حالُها. ولولا هذا النداءُ لَظلّت بلا لسانٍ
         حتى تُفتح غيرُها أو تُطوى هي.
         وموضعُه قبل هبوط النسخة (‎cdFly‎) عمدًا: ينفتح اللسانُ والبطاقةُ تنزل، فيلتقيان */
      cdMinsSync();
      if (!first) { cdCommit(); edRender(); }
      const modal = $('#card-modal');
      /* الحالة النهائيّة تُطبَّق بلا حركةٍ إطارًا واحدًا كي يُقاس موضع النافذة ومقاسُها،
         ثمّ يُعاد مقام البوّابة ليبدأ الانكماش والهبوط من حيث كانا فعلًا */
      modal.classList.add('cd-nofx');
      renderCardDlg();
      /* المسرح كلّه ينتظر خافيًا — لا البطاقة وحدها، وإلّا برز الرصيف والمسار قبلها */
      cdStage().classList.add('is-arriving');
      const dst = $('#cd-card').getBoundingClientRect();
      modal.classList.add('is-gate');
      void modal.offsetWidth;
      modal.classList.remove('cd-nofx');
      cdFly(src, dst, k, first);
      return;
    }
    /* حلقة الخيط: تُنزل البطاقة في وجهتها، ثمّ تنشر ما جدّ عليها بعد ذلك */
    if (e.target.closest('#cd-add')) {
      /* النزولُ في الملفّ: ينضمّ «مَن عندها» إلى الترويسة وتظهر السفلى — فينزلق ما كان
         ويذوب ما جدّ، بدل أن يقفز الشريطان دفعةً واحدة.
         و‎refreshEditActs‎ لازمةٌ هنا: ميزانُ «هل بدأت المساهمة؟» يقرأ **الرزمة** لا النافذة،
         والبطاقةُ لم تدخلها إلا بهذه الضغطة. وكان الميزان لا يُعاد حسابه إلا بحرفٍ يُكتب
         بعد النزول — فبطاقةٌ بوجهٍ واحد كُتب قبل إنزالها تبقى شارتُها وزرُّ نشرها مطفأين */
      if (!cardDlg.id) {
        cdMake(); cdCommit(); edRender(); refreshEditActs();
        /* ===== وأوّلُ نزولٍ يُنشئ العُصبةَ كما يُنشئها ما بعده =====
           بطاقةٌ كُتبت في نافذةٍ جديدةٍ بفراغين ثمّ أُنزلت: هذه أوّلُ لحظةٍ يكون لها فيها
           عقدةٌ في الشجرة، وفيها تُولد أوجهُها. وكان الصدى موصولًا بفرع «ما جدّ يُنشر»
           وحدَه، وهذا الفرعُ يرجع قبله — فتنزل البطاقةُ بوجهين ويبقى لسانُها مفردًا.
           والقاعدةُ: كلُّ طريقٍ يُنزل متنًا يمرّ بالصدى، ولا يُستثنى منها أوّلُها */
        cdFacesEcho(cdNode());
        cdMetaFlip(renderCardDlg);
        cdAfterSave();   /* نزلت في ملفّها ⇐ يُسأل الترسُ عمّا بعدها */
        return;
      }
      /* وجهةٌ مهيَّأة: هذه الضغطة هي النقل نفسُه — تنفصل عن الأول وتلتصق بالثاني.
         وإن كان في يدك تعديلٌ لم يُنشر فالضغطةُ تُمضيهما معًا: تنقل ثمّ تنشر —
         فلا يصطفّان في طابور ويُطلب منك ضغطتان لنيّةٍ واحدة.
         والرسمُ يُترك للنشر (‎quiet‎) كي لا يقع مرّتين في ضغطةٍ واحدة */
      if (cdMoving()) {
        const pending = cdPend();
        cdCommit(); cdMove(cardDlg.moveTo, pending);
        if (!pending) return;
      }
      /* ===== الرجوعُ **ردُّ مؤشِّر** لا نسخةٌ جديدة =====
         تُنزل النسخةَ التي تراها فتعود هي القائمة: خضراءُ مستقرّة بسحابتها، بنفس رقمها
         ونفس تاريخها. فلا يُخترع رقمٌ ثالث لمحتوًى نُشر من قبل — الرقمُ اسمُ نصٍّ بعينه،
         ولو ولّدنا له اسمًا كلَّ رجعة لَتضخّم السجلّ بأسماءَ لمسمًّى واحد.
         وما فوقها يبقى في القائمة أبيضَ يُرجَع إليه متى شئت — الرجوعُ لا يمحو */
      if (cardDlg.viewV) {
        const n0 = cdNode();
        /* والسحابةُ البيضاء خبرٌ ساكن كأختها الخضراء: تطالع المنشورةَ الحيّة فلا شيء يُستردّ */
        if (cardDlg.viewV === cdPubV(n0)) return;
        if (cdGoV(n0, cardDlg.viewV)) {
          save(); edRender();
          cdFill(n0.f, n0.b);
          cdQBody(true);   /* والرجعةُ إلى نسخةٍ تُعيد بناءَها كذلك */
          /* والرجعةُ إنزالٌ كإنزال: متنُ البطاقة تبدّل، فأوجهُها تتبع */
          cdFacesEcho(n0);
        }
        cardDlg.viewV = null; cardDlg.vlist = false;
        cdRenderFx();
        return;
      }
      /* والإيداعُ قبل القراءة: الضغطةُ قد تقع على أثر حرفٍ لم يبلغ العقدةَ بعد، فيُنشر
         نصٌّ ويُقاس عليه غيرُه. وهي رخيصةٌ إن لم يجدّ شيء */
      cdCommit();
      const n = cdNode();
      if (n && n.pend) {
        /* الرقم قُطع يوم وُلدت المسوّدة، والنشرُ **يختم** لا يزيد — وإلّا عُدّ التعديلُ الواحد نسختين.
           وسجلُّها قائمٌ سلفًا (كلُّ نسخةٍ لها سجلّ)، فالنشرُ يقلبه إلى منشورٍ ويؤرّخه */
        n.v = n.v || 1; n.pend = false; n.pt = Date.now();
        cardDlg.viewV = null;
        cdStow(n);
        const r = cdRec(n, n.v); if (r) r.ts = n.pt;
        /* النشرُ يُعيد كومةَ «مَن عندها» — فتذوب دخولًا وينزلق ما جاورها */
        save(); edRender(); refreshEditActs(); cdRenderFx();
        /* وههنا يقع الصدى: نزلت النسخةُ الجديدة، فتتبعها نوافذُ أوجهها.
           وقبل ‎cdAfterSave‎ لا بعدها: تلك قد تُغلق النافذةَ وتفتح غيرَها بأمر الترس،
           فيتبدّل المركَّزُ من تحت الصدى وهو يستعير معرّفاته */
        cdFacesEcho(n);
        cdAfterSave();   /* نُشر ما جدّ عليها ⇐ كذلك */
        return;
      }
      /* ===== وضغطةُ الحلقة إنزالٌ في كلّ حال =====
         ولو لم يكن ثَمّ ما يُنشر (نُشر من قبلُ · أو لم يُحسب التعديلُ نسخةً): اليدُ قالت
         «أنزِلْ»، فتُوافَق الأوجهُ على ما استقرّ في العقدة. ولا يبقى وجهٌ مفتوحٌ لفراغٍ
         مُحي لمجرّد أنّ حالَ النشر لم تتبدّل — الحكمُ على الوجه من **المتن** لا من الحال */
      if (n) cdFacesEcho(n);
      return;
    }
    /* اللغة زرّ يتبدّل: عربي ⇄ إنجليزي، والمؤشّر يقف فورًا في جهة الكتابة الجديدة */
    if (e.target.closest('#cd-lang')) {
      cardDlg.lang = cardDlg.lang === 'ar' ? 'en' : 'ar'; renderCardDlg();
      const el = $('#cd-front');
      setTimeout(() => { el.focus(); const s = window.getSelection(), r = document.createRange(); r.selectNodeContents(el); r.collapse(false); s.removeAllRanges(); s.addRange(r); }, 0);
      return;
    }
    /* حالة القائمة في ‎cardDlg‎ لا في الـDOM: ‎cdOutHTML()‎ تعيد بناءها مخفيّةً في كل رسم،
       فلو بقيت الحالة في العنصر لَانطبقت القائمة كلّما اخترتَ وجهةً وأُعيد الرسم */
    /* ===== حذفُ البطاقة من نافذتها =====
       تُنزع عقدتُها من رزمتها ثمّ تُغلق نافذتُها. ولا يُسأل قبلها: الحذفُ في هذا الموقع
       يقع بضغطته (كما في شجرة التحرير)، فلا يُستحدث له عرفٌ ثانٍ في موضعٍ واحد.
       و‎id‎ يُصفَّر **قبل** الإغلاق: الإغلاقُ يستدعي ‎cdCommit‎، ولولا التصفير لَبحثت عن
       عقدةٍ نُزعت للتوّ. وما لم تنزل بعدُ فلا عقدةَ لها، فالحذفُ إلقاءُ ما في يدك وإغلاقُ نافذته */
    /* أذنُ الورقة: تفتح ورقةَ ملخّصِ الملفّ الذي تسكنه هذه البطاقة */
    if (e.target.closest('#cd-sum')) { cdSumOpen(); return; }
    if (e.target.closest('#cd-del')) {
      clearTimeout(cdT);
      if (cardDlg.id) {
        const r = findNode(edPack().deck, cardDlg.id);
        if (r) r.arr.splice(r.i, 1);
      }
      cardDlg.id = null; cardDlg.viewV = null; cardDlg.made = [];
      cdFill('', '');
      save(); cleanupEmptyMine(); edRender();
      cdCloseWin(cardDlg);
      return;
    }
    /* الترسُ يبسط الشريطَ ويطويه — والمفتاحان يكتبان في الحال المحفوظة لا في الجلسة */
    if (e.target.closest('#cd-gear')) {
      cardDlg.set = !cardDlg.set;
      if (cardDlg.set) cardDlg.clip = false;   /* ولا يُفتح درجان معًا: لوحُ الترس يمرّ فوق الجيب */
      cdSetSync(); cdClipDrawer(); return;
    }
    if (e.target.closest('#cd-pk')) {
      cardDlg.clip = !cardDlg.clip;
      if (cardDlg.clip) { cardDlg.set = false; cdSetSync(); }
      cdClipDrawer(); return;
    }
    /* صدَفةُ الحافظة: ثلاثةُ أفعالٍ ببابٍ واحد — والمعطَّلُ لا يبلغ هذا الفرعَ أصلًا */
    const cb = e.target.closest('.cd-cb');
    if (cb) {
      const a = cb.dataset.clip;
      if (a === 'copy') cdClipCopy();
      else if (a === 'paste') cdClipPaste();
      else if (a === 'dup') cdClipDup();
      return;
    }
    /* ===== والمنتقى يقول عقدَه: ‎[data-sw]‎ لا ‎.cd-sw‎ عاريةً =====
       ‏‎.cd-sw‎ هيئةُ مفتاحٍ تُعار في الموقع، وهذا الفرعُ لمفاتيح **هذه النافذة** وحدَها
       (‎cardDlg.sset‎). ولمّا أُعيرت الهيئةُ لترس الاختبار في ذيل الجاري صار الفرعُ
       يلتقط مفاتيحَه أيضًا — ومستمعُ ‎#card-modal‎ أقربُ من مستمع ‎[data-xt]‎ على الوثيقة
       فيسبقه، فيقع ‎sset[undefined]‎ ويرمي قبل أن يبلغ الضغطُ صاحبَه.
       فيُقيَّد بالسمة التي يقرؤها فعلًا: من حمل ‎data-sw‎ فهو له، ومن لم يحملها فليس له.
       والقاعدةُ عامّة: منتقي المستمع يُكتب بما يقرؤه المستمع لا بما يراه شبيهًا */
    const swb = e.target.closest('.cd-sw[data-sw]');
    if (swb) {
      const k = swb.dataset.sw, s = cardDlg.sset;
      s[k] = !s[k];
      /* لا يُسقط أحدُهما الآخر: مستقلّان، فمن أراد واحدًا أخذه وحدَه */
      /* الحالُ لهذه النافذة، والمحفوظُ عادةٌ ترثها التي بعدها */
      state.cdSet.close = s.close; state.cdSet.chain = s.chain;
      save(); cdSetSync();
      return;
    }
    if (e.target.closest('#cd-folder')) { cardDlg.list = !cardDlg.list; renderCardDlg(); return; }
    const fop = e.target.closest('.cd-fopt');
    if (fop) {
      const fid = fop.dataset.fid || '';
      cardDlg.list = false;   /* اختير الملفّ فانقضى غرض القائمة */
      if (!cardDlg.id) {
        /* لم تنزل بعدُ: هذا اختيارُ وجهةٍ لا نقل */
        cardDlg.pid = fid || null; cardDlg.moveTo = null;
      } else if (fid !== (cardDlg.pid || '')) {
        /* ===== نقلُ الموضع يقع بالاختيار، ولا يُنتظر له نشر =====
           كان يُهيَّأ ثمّ يُمضى بضغطة الحلقة، فتصفرّ الحلقةُ «انقل» وتنتظر — وذلك
           يعامل تبديلَ الملفّ معاملةَ تعديلٍ في البطاقة، وليس منه: **الموضعُ ليس محتوًى**.
           فلا نصَّ تبدّل ولا نسخةَ تُقطع ولا شيءَ يُخبَر به الناس — فيقع في حينه،
           وتبقى الحلقةُ على حالها: خضراءَ إن كانت مستقرّة، برتقاليّةً إن كان في يدك تعديل */
        cdMove(fid);
        return;
      }
      renderCardDlg();
      return;
    }
    if (cardDlg.list && !e.target.closest('#cd-folder') && !e.target.closest('#cd-folderlist')) {
      cardDlg.list = false; renderCardDlg();
    }
    if (cardDlg.vlist && !e.target.closest('.cd-vanch')) { cardDlg.vlist = false; renderCardDlg(); }
    /* (طيُّ الفقاعة انتقل إلى مستمعٍ على الوثيقة كلِّها — انظر ‎cdCmtClose‎: هذا الفرعُ
       لا تبلغه ضغطةٌ خارج النافذة أصلًا، ولا ضغطةٌ ابتلعها فرعٌ قبله) */
    /* ===== الجهةُ والمحاذاة: فعلان لا أمرا تنسيقٍ =====
       الجهةُ تُبدَّل بلغة البطاقة نفسِها (‎cardDlg.lang‎) لا بسمةٍ على الحقل: الرسمُ يكتب
       جهةَ الحقلين من اللغة في كلّ مرّة، فسمةٌ تُكتب هنا تُمحى في أوّل رسم.
       والمحاذاةُ تدور على ثلاث: يمينٌ ⟵ وسطٌ ⟵ يسارٌ ⟵ يمين. وتُعاد الفقاعةُ بعدهما
       فتتبدّل أيقونتاهما — وهي تُعاد بلا هدمٍ للتحديد لأنّ الحقلَ نفسَه لا يُمسّ */
    /* ===== لوحةُ الألوان: تُفتح بالزرّ وتنطبق بالاختيار =====
       والزرُّ نفسُه يطويها، وفتحُ إحداهما يطوي الأخرى — لوحةٌ واحدةٌ في وقتٍ واحد */
    const palBtn = e.target.closest('.cd-tool[data-pal]');
    if (palBtn) {
      cdPal = cdPal === palBtn.dataset.pal ? null : palBtn.dataset.pal;
      cdSpec = false;   /* اللوحُ لا يُورَّث بين اللوحتين: كلُّ فتحةٍ تبدأ من الحبّات */
      cdBubble();
      return;
    }
    /* ===== دائرةُ الطيف: تفتح اللوحَ وتطويه =====
       كانت غطاءً شفّافًا على ‎<input type="color">‎ فتفتح نافذةَ **النظام** — لوحًا لا
       نملك جلدَه ولا نعرف أين يقع ولا يتبع ثوبَ البطاقة. فصارت زرًّا يفتح لوحَنا
       في البطاقة نفسِها، وحالُه ‎.on‎ خبرٌ عن كونه مفتوحًا كحال زرَّي اللوحتين */
    const specBtn = e.target.closest('.cd-pal__spec');
    if (specBtn && cdPal) { cdSpec = !cdSpec; cdBubble(); return; }
    /* ===== وحذفُ الحبّة يُسأل قبل انتقائها =====
       الزرّان متجاوران في خليّةٍ واحدة، و‎closest‎ لا تخلط بينهما — لكنّ الترتيبَ
       ههنا عقدٌ يُقرأ: «الحذفُ لا يُلوّن». فيُقدَّم صريحًا ولا يُترك للحظّ */
    const delBtn = e.target.closest('.cd-pal__del');
    if (delBtn && cdPal) { cdMyDel(delBtn.dataset.del); cdBubble(); return; }
    /* ===== النقرُ على اللوح =====
       ولا يُنادى ‎cdExec‎ من ههنا: يُكتب الهكسُ في حقل الكود ثمّ يُطلق حدثاه، فيجري
       عليه ما يجري على ما يُكتب فيه باليد — التلوينُ الحيّ من ‎input‎ ورفعُ الزخارف
       من ‎change‎. ووصلةٌ واحدةٌ خيرٌ من فرعين يفترقان يومًا ولا يُدرى أيُّهما الحقّ */
    const specC = e.target.closest('.cd-spec__c');
    if (specC && cdPal) {
      const hex = cdSpecAt(specC, e);
      cdHexApply(hex);
      /* ===== وما انتقيتَه من الطيف يصير حبّةً =====
       ولا تُطوى اللوحةُ ولا اللوح: تجريبُ لونٍ بعد لونٍ هو الغرضُ منهما، وإنّما
       تُعاد الرسمةُ ليظهر المربّعُ الجديد في مكانه من فوره */
      cdMyAdd(hex);
      cdBubble();
      return;
    }
    const sw = e.target.closest('.cd-pal__sw, .cd-pal__none');
    if (sw && cdPal) {
      /* المسمّاةُ صنفٌ يُلبَس، وحبّتُك لونٌ صريحٌ يُكتب — وكلتاهما تطوي اللوحة
         بعد وقوعها: هي اختيارٌ انتهى، بخلاف اللوح الذي هو تجريبٌ مستمرّ */
      if (sw.dataset.hex) cdHexApply(sw.dataset.hex);
      else if (sw.dataset.tok) cdPaint(cdPal, sw.dataset.tok);
      else cdColorClear(cdPal);
      cdPal = null;
      cdSpec = false;
      cdBubble();
      return;
    }
    const act = e.target.closest('.cd-tool[data-act]');
    if (act) {
      if (act.dataset.act === 'dir') {
        cardDlg.lang = cardDlg.lang === 'en' ? 'ar' : 'en';
        renderCardDlg();
      } else {
        const now = cdAlignNow();
        cdExec(now === 'r' ? 'justifyCenter' : now === 'c' ? 'justifyLeft' : 'justifyRight');
      }
      cdBubble();
      return;
    }
    const tool = e.target.closest('.cd-tool[data-cmd]');
    /* ===== وتُعاد الفقاعةُ بعد الأمر لتُضيء زرَّه =====
       ‏‎execCommand‎ على مدًى **منطوٍ** يُبدّل حالَ الكتابة القادمة ولا يمسّ النصّ، فلا
       يُطلق ‎selectionchange‎ ولا يُعاد الرسمُ من نفسِه — فيبقى الزرُّ مطفأً وقد اشتعل
       أمرُه. فتُعاد ههنا بيدنا، كما تُعاد بعد الجهة والمحاذاة سواءً بسواء.
       وإعادتُها لا تهدم التحديد: الحقلُ نفسُه لا يُمسّ، إنّما يُبنى جوفُ الفقاعة */
    /* والإطفاءُ على الحافّة يُجرَّب أوّلًا: نقلةُ موضعٍ تُغني عن أمرٍ يذوب (‎cdEmph‎) */
    if (tool) { if (!cdEmph(tool.dataset.cmd)) cdExec(tool.dataset.cmd); cdBubble(); return; }
    /* الضغط خارج الأسطح (على العتمة) يغلق — والدُّرج منها، وإلّا أغلقت ضغطةُ سحبه النافذة.
       ويُشترط أن تكون الضغطةُ قد **ابتدأت** خارجها أيضًا (‎cdDownIn‎): سحبةٌ من الترويسة
       تنتهي فوق العتمة ليست قصدًا للخروج، وكانت تُغلق النافذة على صاحبها */
    /* ===== وهي طيٌّ لا إغلاق =====
       من ضغط خارج النوافذ أراد محرّرَه، ولم يقُل شيئًا في مصيرها. فتُطوى كلُّها إلى
       ألسنتها وتنتظر — و✕ وحدَها هي القول في مصير نافذة */
    if (!cdDownIn && !e.target.closest('.cd-stage') && !e.target.closest('.cd-bub')
      && !e.target.closest('.cd-dw')) cdFoldAll();
  });
  /* ===== ومَرْبِطُها الثاني: نقطةُ الزرّ الأيمن =====
     الفقاعةُ لا تُفتح إلّا على مُظلَّل، ومَن وقف بمؤشّره في الحقل ليُشعل «عريضًا» **قبل**
     أن يكتب لم يجد إليها بابًا. فصار الزرُّ الأيمنُ بابَها الثاني.
     وأوامرُها كلُّها تصحّ على مؤشّرٍ منطوٍ بلا سطرٍ يُبنى لها: الجهةُ والمحاذاةُ
     والقائمتان تقعن على الفقرة، وB وI وU واللونان يُشعلان **ما سيُكتب** — وذاك سلوكُ
     ‎execCommand‎ نفسِه على مدًى منطوٍ.
     ويُحفظ معها **الحقلُ** الذي فُتحت فيه: المدى منطوٍ فلا يُسأل عن حاضنه، والحقلُ
     يشهد على نفسِه */
  let cdBubAt = null;   /* ‏‎{x, y, host}‎ نقطةُ الضغطة اليمنى وحقلُها، أو ‎null‎ فالمدى هو الأصل */
  /* ===== فقاعة التنسيق: تأتي إلى النصّ بدل أن يذهب إليها =====
     تظهر فوق ما ظُلِّل في أحد الحقلين، وتختفي بزوال التحديد */
  function cdBubble() {
    const b = $('#cd-bub');
    /* وطيُّها يطرح المسمارَ معه: لولا ذلك لَعادت تُفتح على نقطةٍ ماتت */
    const off = () => { b.hidden = true; cdPal = null; cdSpec = false; cdBubAt = null; };
    /* والحقلُ المحفوظُ يُنزع من الصفحة بأوّل إعادةِ رسم (تبديلُ الجهة مثلًا)، فيُطرح مسمارُه */
    if (cdBubAt && !cdBubAt.host.isConnected) cdBubAt = null;
    /* ولا تُطلّ والإصبعُ نازلٌ يسحب: التحديدُ لم يستقرّ بعد (انظر ‎cdSelDrag‎) */
    if (cdSelDrag) { off(); return; }
    /* وفقاعةُ التنسيق لا تُفتح على مقفلة: أزرارُها تُغيّر ما لا يُغيَّر */
    if (!cardDlg || cardDlg.ro) { off(); return; }
    const s = window.getSelection();
    if (!s || !s.rangeCount || (s.isCollapsed && !cdBubAt)) { off(); return; }
    const node = s.getRangeAt(0).startContainer;
    const el = cdBubAt ? cdBubAt.host : (node.nodeType === 1 ? node : node.parentNode);
    if (!el || !el.closest || !el.closest('.cd-in')) { off(); return; }
    b.innerHTML = cdToolsHTML();
    b.hidden = false;
    /* والقماسُ يُرسم بعد كلّ بناء: الفقاعةُ تُهدم وتُبنى مع كلّ ‎selectionchange‎،
       فالقماسُ الذي رُسم في الرسمة الماضية عنصرٌ ميّتٌ لا صلةَ له بالحيّ */
    cdSpecPaint(b);
    /* ===== واللسانُ حِمًى لا تُداس =====
       كانت الفقاعةُ تتوسّط المحدَّدَ وترتفع عنه، فإن حدّدتَ كلمةً في وسط أوّل سطرٍ وقعت
       على لسان الحقل فحجبت أزرارَه — وهي أزرارٌ لا يُستغنى عنها (الفراغُ وتلميحُه،
       وحَكَما الخيار وسلّتُه، وأدواتُ الأقنعة).
       فصار للألسنة **حِمًى**: مستطيلاتٌ ممنوعةٌ تُحسب من الصفحة لا تُخمَّن، والفقاعةُ
       تُجرَّب في مواضعَ بالترتيب حتى تجد موضعًا لا يمسّها.
       والترتيبُ مقصود: الانزلاقُ يمينًا أو شمالًا **قبل** النزول تحت السطر — لأنّ الجانبين
       فوق السطر فراغٌ غالبًا (ما بين الحقول)، والنزولُ يقع على النصّ الذي تقرأه حول كلمتك.
       وأقربُ الجانبين إلى موضعها الأصليّ أولى، فلا تقفز الفقاعةُ إلى طرفٍ بعيدٍ بلا داعٍ.
       ولا تخرج عن **البطاقة**: حدودُها حدودُ البطاقة لا حدود الشاشة، وإلّا طفت خارج
       سطحها معلّقةً في العتمة */
    const m = $('#card-modal').getBoundingClientRect();
    /* ومَرْبِطُها: مدى التحديد، أو نقطةُ الضغطة اليمنى **مستطيلًا بلا قدّ** — فيقرؤها
       حسابُ المواضع أدناه كما يقرأ المدى سواءً بسواء، ولا يُكتب لها فرعٌ ثانٍ:
       يتوسّطها فوقَها، فإن ضاق ما فوقها انزلق جانبًا ثمّ نزل تحتها */
    const r = cdBubAt
      ? { left: cdBubAt.x, right: cdBubAt.x, top: cdBubAt.y, bottom: cdBubAt.y }
      : s.getRangeAt(0).getBoundingClientRect();
    const card = el.closest('.mmodal__card');
    const cb = card ? card.getBoundingClientRect() : m;
    const bw = b.offsetWidth, bh = b.offsetHeight, GAP = 7, PAD = 6;
    const box = q => ({ l: q.left - m.left, r: q.right - m.left, t: q.top - m.top, b: q.bottom - m.top });
    const c = box(cb), sel = box(r);
    const clampX = x => Math.max(c.l + PAD, Math.min(c.r - bw - PAD, x));
    const want = clampX(sel.l + (sel.r - sel.l) / 2 - bw / 2);
    /* الحِمى: ألسنةُ الحقول الظاهرة في هذه البطاقة (المخفيّةُ لا مكانَ لها فلا تُحسب) */
    const bans = [].slice.call(card ? card.querySelectorAll('.cd-flab') : [])
      .filter(f => f.offsetParent !== null).map(f => box(f.getBoundingClientRect()));
    const clear = (x, y) => !bans.some(z =>
      x < z.r + PAD && x + bw > z.l - PAD && y < z.b + PAD && y + bh > z.t - PAD);
    const up = sel.t - bh - GAP, down = sel.b + GAP;
    /* المواضعُ المجرَّبة: فوقَ وسطًا · فوقَ جانبًا · تحتَ وسطًا · تحتَ جانبًا */
    const sides = [];
    bans.forEach(z => sides.push(clampX(z.l - PAD - bw), clampX(z.r + PAD)));
    sides.sort((a, b2) => Math.abs(a - want) - Math.abs(b2 - want));
    const tries = [];
    if (up >= c.t + PAD) { tries.push([want, up]); sides.forEach(x => tries.push([x, up])); }
    tries.push([want, down]);
    sides.forEach(x => tries.push([x, down]));
    const put = tries.find(p => clear(p[0], p[1])) || [want, up >= c.t + PAD ? up : down];
    b.style.left = put[0] + 'px';
    b.style.top = put[1] + 'px';
  }
  /* ===== الزرُّ الأيمنُ في الحقل: يفتح الفقاعةَ على المؤشّر =====
     وهو **ثالثُ** مستمعي الزرّ الأيمن في هذه النافذة، وترتيبُ الجريان ترتيبُ التسجيل —
     فيجري بعد صاحبَي القناع والصورة. وهما يمنعان الأصلَ حين يأخذان الضغطة، فـ‎defaultPrevented‎
     تقول «قد أُخذت» بلا أن تُعاد شروطُهما ههنا ولا أن تُفتح قائمتان على ضغطةٍ واحدة.

     ===== ولا تُؤخذ الضغطةُ على مُظلَّل =====
     على المُظلَّل الفقاعةُ ظاهرةٌ أصلًا فلا شيءَ يُفتح، ومنعُ الأصليّة حينئذٍ **خسارةٌ
     صافية**: يذهب «نسخ» و«بحث» ولا يجيء شيء. فالفتحُ على المنطوي وحدَه — وهو موضعُ
     الشكوى بعينه: «لا تظهر إلّا لمّا أحدّد نصًّا».
     وتُطوى بضغطةٍ خارجها أو بـ‎Esc‎ — كقائمتَي القناع والصورة سواء */
  document.addEventListener('contextmenu', e => {
    if (e.defaultPrevented || !cardDlg || cardDlg.ro || !e.target.closest) return;
    const host = e.target.closest('#card-modal .cd-in');
    if (!host) return;
    const s = window.getSelection();
    if (s && s.rangeCount && !s.isCollapsed) return;
    e.preventDefault();
    ioMenuClose(); imgMenuClose();   /* قائمةٌ واحدةٌ في وقتٍ واحد */
    cdBubAt = { x: e.clientX, y: e.clientY, host };
    cdBubble();
  });
  /* ===== ضغطةٌ خارجها تطرح مسمارَها، وسحبةٌ في الحقل تُمسكها =====
     مستمعٌ واحدٌ لأمرين يقعان بالضغطة نفسِها:

     ١ · **المسمارُ يُطرح.** و‎pointerdown‎ لا ‎click‎: تسبق الضغطةَ اليمنى التالية فيُطرح
     القديمُ قبل أن يُثبَّت الجديد، ولا تنتظر رفعَ الإصبع. والضغطةُ **في** الفقاعة عملٌ
     فيها لا خروجٌ منها — فتبقى، كما تبقى لوحةُ الألوان بعد اختيار لون.

     ٢ · **والسحبُ يُمسكها حتى يُرفع الإصبع.** ‏‎selectionchange‎ تُطلق مع كلّ بكسلٍ يمرّ
     تحت الإصبع، فكانت الفقاعةُ تولد من أوّل حرفٍ يُظلَّل ثمّ تركض مع المؤشّر وتُعيد
     حسابَ موضعها في كلّ خطوة — تحجب ما تحتها وأنت لم تفرغ بعد، وتُقلق العينَ بحركةٍ
     ليست منك. فتُمسك ما دام الإصبعُ نازلًا في حقل، وتُطلّ حين يُرفع.
     والقيدُ للإصبع وحدَه: تحديدُ لوحة المفاتيح (‎Shift‎ مع الأسهم) لا نهايةَ له تُعرف،
     فيبقى على حاله تُرى الفقاعةُ معه خطوةً خطوة */
  let cdSelDrag = false;
  document.addEventListener('pointerdown', e => {
    if (!e.target.closest || e.target.closest('.cd-bub')) return;
    cdBubAt = null;
    if (e.button === 0 && e.target.closest('#card-modal .cd-in')) cdSelDrag = true;
    cdBubble();
  });
  /* ورفعُ الإصبع يُطلقها — و‎pointercancel‎ معه: سحبةٌ تنقطع (لمسةٌ يبتلعها التمرير مثلًا)
     لا يجيئها ‎pointerup‎، فتبقى ممسوكةً أبدًا لو عُلِّقت عليه وحدَه */
  const cdDragEndBub = () => { if (!cdSelDrag) return; cdSelDrag = false; cdBubble(); };
  document.addEventListener('pointerup', cdDragEndBub);
  document.addEventListener('pointercancel', cdDragEndBub);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && cdBubAt) { cdBubAt = null; cdBubble(); }
  });
  /* ===== لصقُ صورةٍ في الحقل =====
     الحافظةُ قد تحمل صورةً وحدها (لقطةُ شاشة) أو نصًّا وصورةً معًا. فتُلتقط الملفّاتُ
     الصوريّة، ويُمنع اللصقُ الأصليّ فيها وحدها — لأنّ المتصفّح لو تُرك لَأدرج الصورةَ
     ترميزًا ستّينيًّا في الحقل، وهو ما يملأ الدرجَ المشترك.
     وتُدرَج في موضع المؤشّر لا في آخر الحقل: اللصقُ يقع حيث تنظر.
     ثمّ يُرسَل ‎input‎ بيدنا — إدراجُ الشفرة لا يُطلقه، ولولاه ما جرى الحفظ ولا قُطعت نسخة */
  $('#card-modal').addEventListener('paste', async e => {
    if (!cardDlg) return;
    const host = e.target.closest && e.target.closest('.cd-in');
    if (!host) return;
    const dt = e.clipboardData;
    if (!dt) return;
    const imgs = [...(dt.files || [])].filter(f => /^image\//.test(f.type));
    if (!imgs.length) return;
    e.preventDefault();
    for (const file of imgs) {
      /* ===== تُدرَج أوّلًا، ثمّ تُحفظ =====
         الإدراجُ لا يُعلَّق على مخزنٍ قد يبطئ أو لا يجيب: العينُ ترى الصورةَ في مكانها
         من فورها، والحفظُ يجري خلفها */
      const id = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      cdMedUrl[id] = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.dataset.mid = id; img.src = cdMedUrl[id];
      /* واسمُ البطاقة من اسم الملفّ — كما في ‎ioPut‎ سواءً (ROADMAP-CARD-NAMES) */
      img.dataset.fn = file.name || T().cxImgFile;
      flStamp(img);
      const s = window.getSelection();
      if (s && s.rangeCount && host.contains(s.getRangeAt(0).startContainer)) {
        const r = s.getRangeAt(0);
        r.deleteContents(); r.insertNode(img);
        r.setStartAfter(img); r.collapse(true);
        s.removeAllRanges(); s.addRange(r);
      } else host.appendChild(img);
      flPaint(img);   /* بعد أن تسكن الشجرةَ: ‎flSide‎ تسأل موضعَها عن جلده */
      host.dispatchEvent(new Event('input', { bubbles: true }));
      /* ===== وإن أبى المخزنُ فالبطاقةُ تحملها بنفسها =====
         عنوانُ ‎blob:‎ يموت بإغلاق الصفحة، فصورةٌ لم تُحفظ في المخزن تضيع بإعادة التحميل.
         فتُخبَّأ حينئذٍ في نصّ البطاقة ترميزًا ستّينيًّا — وهو ثقيلٌ على الدرج المشترك،
         فلا يُلجأ إليه إلّا عند العجز، ويُخبَر صاحبُه إن كانت كبيرة */
      idbMedia('readwrite', id, file).then(async ok => {
        if (ok) return;
        const data = await cdBlobData(file);
        if (!data) return;
        img.removeAttribute('data-mid');
        img.removeAttribute('data-osrc');   /* عنوانُ ‎blob:‎ مات، فلا يُخبز منه */
        img.src = data;
        flPaint(img);
        host.dispatchEvent(new Event('input', { bubbles: true }));
        if (file.size > 300 * 1024) toast(T().cdImgHeavy);
      });
    }
  });
  /* شريط الأدوات: منع فقد التحديد عند الضغط — الأمر يُنفَّذ على ما كان محدَّدًا في الحقل.
     واللوحةُ كلُّها منه: مربّعاتُها وحقلُ الكود — ولو ضاع التحديدُ بضغطةٍ فيها لَما وجد
     الأمرُ مدًى يقع عليه. ولا استثناءَ فيها اليومَ: كان منتقي الطيف حقلًا أصليًّا
     يحتاج ضغطتَه ليفتح نافذةَ النظام، وقد صار زرًّا ولوحًا من عندنا — وكلاهما
     يعمل بالنقر لا بالضغط، فلا يضرّه منعُ الأصل */
  $('#card-modal').addEventListener('mousedown', e => {
    if (e.target.closest('.cd-tool, .cd-pal')) e.preventDefault();
  });
  /* ===== رقاقةُ التحويم على اللوح =====
     مفوّضةٌ على النافذة لأنّ اللوحَ يُهدم ويُبنى مع كلّ رسمةِ فقاعة، فمستمعٌ يُعلَّق
     عليه يموت معه. وأوّلُ سطرٍ حارسٌ: بلا لوحٍ مفتوحٍ لا عملَ لهذا أصلًا */
  $('#card-modal').addEventListener('mousemove', e => {
    if (!cdSpec || !e.target.closest) return;
    const sp = $('#cd-bub .cd-spec');
    if (!sp) return;
    const on = !!e.target.closest('.cd-spec__c');
    if (on !== sp.classList.contains('is-tip')) sp.classList.toggle('is-tip', on);
    if (on) cdSpecTip(sp, e);
  });
  /* ===== الكودُ والطيف =====
     الكودُ يُطبَّق متى صحّ رسمُه (‎#rgb‎ أو ‎#rrggbb‎) بلا ضغطةِ تأكيد، ولا يطوي اللوحة:
     تجريبُ لونٍ بعد لونٍ هو الغرضُ منه. والطيفُ يمرّ من ههنا كذلك لا من فرعٍ ثانٍ —
     لأنّه يكتب في هذا الحقل بعينه ثمّ يُطلق حدثَه */
  $('#card-modal').addEventListener('input', e => {
    if (!cardDlg || !cdPal) return;
    const hex = e.target.closest('.cd-pal__hex');
    if (hex) {
      const v = hex.value.trim();
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) cdExec(cdPal, v);
      return;
    }
  });
  /* ===== وترتيبُ الخطّ تحت الحبر: عند القرار لا في أثناء السحب =====
     الحبّاتُ المسمّاةُ تمرّ بـ‎cdPaint‎ فيُرفع غلافُها هناك ساعةَ يُصنع. وأمّا هذان فيكتبان
     لونًا صريحًا بـ‎execCommand‎ ولا يردّان ما صنعا، و‎input‎ من القرص يُطلق **مع كلّ
     بكسلٍ يمرّ تحت الإصبع** — فترتيبُ الشجرة عندها شقٌّ وبناءٌ عشراتِ المرّات في السحبة.
     فيُعلَّق على ‎change‎: القرصُ يُطلقها مرّةً حين تُغلق نافذةُ الألوان، والحقلُ حين
     يُغادَر أو يُضغط ‎Enter‎ — وهي لحظةُ القرار. فاللونُ يُرى حيًّا كما كان، ويلحقه الخطُّ
     عند رفع اليد.
     والحقلُ يُسأل من ‎cdRange‎ عند العجز: التركيزُ حينئذٍ في اللوحة لا في البطاقة،
     فـ‎cdField()‎ العارية تعود خاوية.
     ويُرسَل ‎input‎ بيدنا بعده — وبشرطِ أن يكون شيءٌ قد تبدّل: تبديلُ الشجرة بالشفرة
     لا يُطلقه، ولولاه لَما حُفظ الترتيبُ ولا قُطعت نسخة */
  $('#card-modal').addEventListener('change', e => {
    if (!cardDlg || cardDlg.ro || !e.target.closest) return;
    if (!e.target.closest('.cd-pal__hex')) return;
    const host = cdField() || cdField(cdRange);
    if (!host || !host.isConnected) return;
    if (cdDecoLiftAll(host)) host.dispatchEvent(new Event('input', { bubbles: true }));
  });
  /* حفظ التحديد داخل الحقلين: أوامر التنسيق تحتاج مدىً حيًّا بعد الضغط على الشريط */
  document.addEventListener('selectionchange', () => {
    if (!cardDlg) return;
    const s = window.getSelection();
    if (!s || !s.rangeCount) return;
    const host = s.getRangeAt(0).startContainer;
    const el = host.nodeType === 1 ? host : host.parentNode;
    if (el && el.closest && el.closest('.cd-in')) cdRange = s.getRangeAt(0).cloneRange();
    cdBubble();
  });
  /* منتقيا اللون: الأمر يُنفَّذ مع كل تغيّر في المنتقي (لا بالنقر)،
     والكتابة في الحقلين تُحفظ تلقائيًّا بعد سكونٍ قصير — لا زرّ حفظ في النافذة */
  document.addEventListener('input', e => {
    if (!cardDlg) return;
    const ci = e.target.closest && e.target.closest('.cd-tool input[type="color"]');
    if (ci) { cdExec(ci.dataset.cmd, ci.value); return; }
    /* أوّل حرفٍ بعد الاستقرار **يقطع نسخةً** برتقاليّة في الحال: ما عند الناس لم يعد ما عندك،
       والرقم يقولها قبل النشر. والحفظ المحليّ شيءٌ آخر تقوله السحابة — أمّا النشر فبضغطة الحلقة.
       والمنطقُ كلُّه في ‎cdTouch‎ يشترك فيه الحرفُ والقناع */
    if (e.target.closest && e.target.closest('.cd-in')) cdTouch();
  });
  /* ===== وضعُ التنسيق يتبع الأمرَ، ولا يُفرض على الكلّ =====
     كانت ‎styleWithCSS‎ تُشعَل قبل **كلّ** أمر، فتنزل التوكيداتُ الثلاثةُ أنماطًا في سمة
     ‎style‎ على ‎span‎ واحد بدل أن تكون وسومًا. وذاك موضعُ العطب:
     الثِّقلُ والميلُ خاصّيّتان عاديّتان (‎font-weight‎ و‎font-style‎) تمتزجان في السمة
     الواحدة فتجتمعان، وأمّا الخطُّ تحت السطر فليس خاصّيّةً عاديّةً عند المتصفّح —
     يمرّ بطريقٍ مخصوصٍ (‎-webkit-text-decorations-in-effect‎) يُعيد كتابة سمة النمط
     على الغلاف نفسِه، فيدفع أحدُهما الآخر. ولذلك اجتمع العريضُ والمائل ولم يجتمع
     المائلُ والمسطَّر: العلّةُ في **الخطّ تحت السطر** لا في الميل.
     والوسومُ لا تتزاحم أصلًا: ‎<i>‎ و‎<u>‎ يتداخلان فيقع أحدُهما في جوف الآخر، والثلاثةُ
     تجتمع على كلمةٍ واحدة بلا حساب. وهي صيغةُ الموقع منذ بُني — ‎RICH_OK‎ يُجيز
     ‎B‎ و‎I‎ و‎U‎ ولا يُجيز ‎span‎ ذا نمط.
     ويبقى وضعُ CSS لما سواها: اللونان والمحاذاة يُكتبان بلا CSS وسمَ ‎<font>‎ المهجور
     أو سمةَ ‎align‎، فتضيع ألوانُ الحبر والتظليل ويسقط التوسيط */
  function cdExec(cmd, val) {
    const s = window.getSelection();
    /* ===== ولا يُعاد تعيينُ التحديد إن كان قائمًا في حقلٍ أصلًا =====
       ههنا كان الترابطُ بين الأزرار الثلاثة. ‏‎removeAllRanges‎ تُفرغ التحديدَ ثمّ
       تُعيده — والمتصفّحُ **يمحو «نمطَ الكتابة» بكلّ تعيينٍ للتحديد**. وذاك النمطُ هو
       كلُّ أثرِ أمرٍ وقع على مؤشّرٍ منطوٍ.
       فمن أطفأ العريضَ ثمّ ضغط المائل: تُمحى وديعةُ «لا عريض» في صدر النداء الثاني،
       فيعود العريضُ ولم يطلبه — ويُرى ذلك «ترابطًا» بين زرّين لا رابطَ بينهما.
       والاستعادةُ إنّما وُضعت شبكةَ أمانٍ لئلّا يضيع التحديدُ بضغطة الشريط، وضياعُه
       ممنوعٌ أصلًا بـ‎preventDefault‎ على ‎mousedown‎ (انظر مستمعَ ‎#card-modal‎).
       فتبقى الشبكةُ ولا تُنصب إلّا حين تُحتاج: إن لم يكن التحديدُ في حقلٍ أصلًا */
    if (!cdField() && cdRange) { s.removeAllRanges(); s.addRange(cdRange); }
    /* ووضعُ التنسيق يتبع الأمر: التوكيداتُ الثلاثةُ وسومًا، وما سواها بالنمط (‎CD_EMPH‎) */
    try { document.execCommand('styleWithCSS', false, !CD_EMPH[cmd]); } catch (e) { /* متصفّح لا يدعمها */ }
    document.execCommand(cmd, false, val || null);
    if (s.rangeCount) cdRange = s.getRangeAt(0).cloneRange();
  }

  function renderCards() {
    const d = cardData(cmCode);
    const host = $('#cm-cards');
    if (!host) return;
    /* أرحلةٌ هي؟ تُقرأ مرّةً قبل بناء الشجرة، فتصل ‎cxTreeEdit‎ بلا أن تُمرَّر في ثلاث دوالّ */
    cxEdJr = cxJrOn(d);
    /* ‎cx-tree‎ يخصّ شجرةَ البطائق وحدها (شجرةُ «الشروح» أختُها في كلّ شيء إلا التحديد،
       فلا يبلغها حكمُ السلّة) · و‎is-multi‎ حالُ التحديد وقتَ الرسم — يصونها ‎cxSelSync‎ بعده */
    host.innerHTML = `<div class="x3 cx-tree${cxRoots(d.deck).length > 1 ? ' is-multi' : ''}${cxEdJr ? '' : ' cx-nojr'}${jrPeekOn ? ' jr-peek' : ''}">${cxTreeEdit(d.deck, 0)}</div>`;   /* أزرار الإضافة في شريط الأسفل */
    /* والرؤوسُ تُوسم بعد الرسم لا في القالب: حسابُها يحتاج الشجرةَ كلَّها، والقالبُ يرى
       عقدتَه وحدها. ومرجعٌ واحدٌ للوسم خيرٌ من قراءتين قد تفترقان */
    cxPaintSel();
    refreshPackBadges();
    cxNameFit();
    /* والقضيبُ يُقاس ههنا كذلك: ‎renderCmSection‎ ليس الموضعَ الوحيد الذي تُبنى فيه
       الشجرة — إضافةُ بطاقةٍ أو حذفُها أو طيُّ مجلّدٍ تمرّ من هنا وحدها، فلولا القياسُ
       لَبقي طرفا الخيط على مقاسٍ سابقٍ لا يطابق ما تحته */
    cxRailFit();
    /* أوّلُ فتحٍ للمحرّر وحدَه — لا كلُّ إعادةِ رسمٍ للشجرة (إضافةٌ أو حذفٌ أو طيّ) */
    if (jrPeekArm) { jrPeekArm = false; jrPeek(); }
    vtFocusTitle('c');
  }
  /* ===== أيُّ اسمٍ فاض عن عموده؟ =====
     عمودُ الاسم قدُّه واحد (‎--cx-nm-w‎). فما قصُر عنه مُلئ بخيط، وما جاوزه قُصّ وتلاشى
     طرفُه. وحكمُ القصّ لا يقع إلّا على المقصوص: ‎text-overflow‎ يحرس نفسَه، وأمّا القناعُ
     فلا حارسَ له — يقع على كلّ صفٍّ فيبدو القصيرُ مقصوصًا وهو تامّ.
     ===== والفيضُ لا يُعرف بعدّ الحروف =====
     الحرفُ العربيُّ يختلف عرضُه: «الله» أربعةٌ ضيّقة و«مجموعة» سبعٌ عريضة — فاسمٌ من
     عشرين محرفًا قد يفيض وآخرُ من خمسةٍ وعشرين قد يسع. فيُقاس بالبكسل بعد الرسم.
     ===== والقراءةُ مجموعةٌ ثمّ الكتابةُ مجموعة =====
     ‎scrollWidth‎ يُجبر التخطيط، فلو تخالفت القراءةُ والكتابةُ في حلقةٍ لَأُعيد تخطيطُ
     الصفحة مع كلّ صفّ — وشجرةُ رزمةٍ فيها ألفُ بطاقةٍ تجعل ذلك ثانيةً كاملة.
     (وهي علّةُ ألسنة المطويّات نفسُها، والدواءُ دواؤها) */
  /* والقياسُ يشمل الشجرتين: شجرةُ التحرير في ‎#cm-cards‎ وشجرةُ النشر خارجَها،
     والعمودُ واحدٌ فيهما — فلو قيست إحداهما وحدَها بدا القصُّ في صفٍّ وغاب في نظيره */
  /* ===== طرفا كلّ قضيب =====
     لكلّ مستوًى حيٍّ قضيبُه، وطولُه من مركز أوّل محطّةٍ فيه إلى مركز آخرها — **من
     محطّاته هو وحدَها**: ولذلك ‎:scope >‎ في المِنتقى، فلو أُخذت الدوائرُ بالنسب لَامتدّ
     قضيبُ الأب إلى آخر حفيدٍ له في جوف ابنه.
     ويُقاس ولا يُحسب: آخرُ محطّةٍ قد تكون مجلّدًا مفتوحًا لا يُعرف ارتفاعُه إلّا بعد
     التخطيط. والقراءةُ كلُّها أوّلًا ثمّ الكتابةُ كلُّها: كلُّ القضبان بإعادة تخطيطٍ
     واحدة لا بواحدةٍ لكلّ قضيب. ومحطّةٌ واحدةٌ لا قضيبَ لها: الخيطُ يصل بين اثنتين،
     ولا شيءَ يصل الشيءَ بنفسِه — وتبقى دائرتُها ووتدُها، فهي محطّةٌ وإن لم تكن رحلة.
     والصفوفُ ثلاثةُ أشكال: المجلّدُ دائرتُه في ‎.x3-st‎، والبطاقةُ في ‎.x3-ep‎ — وهذه
     تكون صفًّا عاريًا في جوف مجلّد، أو ملفوفةً في ‎.x3-st‎ إن كانت في الدرجة الأولى
     أو كانت أمًّا والدة. فثلاثةُ مساراتٍ لا واحد */
  const CX_RAIL_SEL = ':scope > .x3-st > .x3-dot, :scope > .x3-st > .x3-ep > .x3-dot,'
    + ' :scope > .x3-ep > .x3-dot';
  function cxRailFit() {
    const jobs = [];
    /* ===== كلُّ شجرةٍ وكلُّ جوفٍ حيّ =====
       ‎.x3‎ ثلاثةٌ في المشروع لا رابعَ لها: محرّرُ الشروح · محرّرُ البطائق · شجرةُ النشر.
       فيُقاس الكلُّ بلا تعدادٍ يُنسى واحدٌ منه — ومَن لا محطّتين فيه يُكتب له صفرٌ فينعدم
       قضيبُه من نفسِه. والجوفُ الحيّ للبطائق وحدَها (‎has-rail‎ لا تُوضع في الشروح) */
    document.querySelectorAll('.x3, .x3 .x3-sub.has-rail').forEach(c => {
      const ds = c.querySelectorAll(CX_RAIL_SEL);
      if (ds.length < 2) { jobs.push([c, 0, 0]); return; }
      const b = c.getBoundingClientRect(),
        a = ds[0].getBoundingClientRect(), z = ds[ds.length - 1].getBoundingClientRect(),
        t = a.top - b.top + a.height / 2;
      jobs.push([c, t, Math.max((z.top - b.top + z.height / 2) - t, 0)]);
    });
    jobs.forEach(([c, t, h]) => {
      c.style.setProperty('--jr-t', t + 'px');
      c.style.setProperty('--jr-h', h + 'px');
    });
  }
  function cxNameFit() {
    /* والشجرةُ الثالثة (‎#nk-road‎) معهما: الخيطُ يُرسم بالقياس لا بالتصريح، فمن لم
       يُقَس اسمُه لم يُعرف أطويلٌ هو أم قصير — فيبقى بلا خيطٍ وإن فاض */
    const els = [...document.querySelectorAll('#cm-cards .cx-nm, .cx-ro .cx-nm, #nk-road .cx-nm')];
    if (!els.length) return;
    const over = els.map(el => {
      const t = el.querySelector('.cx-nm__t');
      return !!t && t.scrollWidth > t.clientWidth + 1;
    });
    els.forEach((el, i) => el.classList.toggle('is-long', over[i]));
  }
  /* بطاقة تحرير «البطائق» إنلاين — نظير vidEditCard: ترويسة كترويسة المساهمة النهائية،
     ثم الخطّ، ثم الشجرة، ثم شريط الإضافة والحذف والنشر */
  function cardEditCard(p, i) {
    const d = p.data;
    return `<div class="post pk pk--peek pk--edit pk--pack" data-pi="${i}" data-sub="cards">
      <div class="post-yt">
        <span class="post-av post-av--yt">${avatarHTML(p)}</span>
        <div class="post-ytmain">
          <div class="post-ytmeta">${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b></div>
          <div class="x3-pkhd on">
            ${x3ArtEdit(p, 'c', d.deck)}
            <span class="vt-grow x3-ttlwrap${d.title ? '' : ' is-ph'}" data-v="${esc(d.title || '') || T().pkTitlePh}">
              <input class="x3-ttlin" id="cm-vtitle" size="1" placeholder="${T().pkTitlePh}" value="${esc(d.title || '')}">
            </span>
            <span id="cm-vbadges">${x3Trio(d.deck, 'c')}</span>
            <!-- وخبرُ المساهمة كلِّها: يسارَ شارات الأنواع، وهو مجموعُ الشجرة -->
            <span id="cm-vnews">${cxNewsHTML('solo', cxNwSum(d.deck), { nodes: d.deck, key: 'vnews' })}</span>
          </div>
          <div id="cm-cards"></div>
          ${cxFoot(d)}
        </div>
      </div>
    </div>`;
  }
  /* ============================================================
     مقسومُ الرحلة — «قائمةٌ» أم «رحلة» (‎journey-toggle-lab#d‎ · ‎journey-icon-lab‎)
     ============================================================
     الرمزُ محطّتان: مبدأٌ مصمتٌ أعلى **اليمين** ومنتهًى خاوٍ أسفل اليسار، يصلهما مرفقٌ
     نازلٌ ثمّ منعطف. والجهةُ مقصودةٌ لا مصادفة: قضيبُ الرحلة في الشجرة على اليمين
     (‏`inset-inline-start` في صفحةٍ `rtl`) والمسيرُ ينزل — فالأيقونةُ تقرأ ما تقرؤه الشجرة.
     ولا تُصلحها CSS: لا قاعدةَ تعكس أيقونات هذا الشريط، فالجهةُ تُرسم ولا تُورَّث.

     والحالان يفترقان بـ**وجودِ الوَصل وعدمِه** لا بلونٍ ولا بشدّة: «قائمة» هي المحطّتان
     منفصلتين. وذاك شرطُ المقسوم — الرسمان يُقرآن معًا متجاورين لا واحدًا بعد آخر.

     والسُّمكُ ‎2.6‎ لا ‎1.8‎، ونصفا القطر ‎4.25‎ و‎3.5‎: الرقعةُ ‎18px‎ ههنا، وما رقّ فيها
     ذاب. وسُمكُ الوَصل مصرَّحٌ في مجموعته (‎2.55‎) لأنّه يفترق عن سُمك الدائرتين عمدًا.
     وقيمُها كلُّها معايَرةٌ بيد صاحب الموقع في ‎journey-icon-lab‎، ومنقولةٌ كما خرجت —
     ومنه ‎H11.3‎ في ذيل المرفق: صفرُ طولٍ لأنّ قوسَه ينتهي عند حافّة الدائرة بعينها
     (الانحناءُ عند أقصاه)، تُرك على حاله ليطابق المشحونُ ما أُقرّ حرفًا */
  const JR_IC = {
    on: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'
      + '<g stroke-width="2.55">'
      + '<path d="M16.2 9.8V13.55A4.9 4.9 0 0 1 11.3 18.45H11.3"/>'
      + '</g>'
      + '<circle cx="16.2" cy="5.55" r="4.25" fill="currentColor"/>'
      + '<circle cx="7.8" cy="18.45" r="3.5"/>'
      + '</svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'
      + '<circle cx="16.2" cy="5.55" r="4.25" fill="currentColor"/>'
      + '<circle cx="7.8" cy="18.45" r="3.5"/>'
      + '</svg>'
  };
  /* الغيابُ رحلة: ‎jr‎ لا يُكتب إلّا حين يُطفئه صاحبُه، فلا تُمَسّ الرزمُ القائمة */
  const cxJrOn = d => d.jr !== false;
  const cxJrSeg = d => {
    const on = cxJrOn(d);
    return `<span class="cx-jrseg" role="group" aria-label="${esc(T().cxJrOn)}">
      <button type="button" data-jr="0" class="${on ? '' : 'on'}" title="${esc(T().cxJrOffTip)}"
        aria-pressed="${!on}">${JR_IC.off}${T().cxJrOff}</button>
      <button type="button" data-jr="1" class="${on ? 'on' : ''}" title="${esc(T().cxJrOnTip)}"
        aria-pressed="${on}">${JR_IC.on}${T().cxJrOn}</button>
    </span>`;
  };

  const cxFoot = d => `<div class="edit-acts edit-acts--foot vt-foot">
      ${completeGlyph(completenessOf('cards', d))}
      ${cxAddBtns()}
      <!-- الفاصل نفسه الذي في «الشروح»: يمين ✕، بين أدوات الإضافة وأزرار المساهمة -->
      <span class="src-tools__sep src-tools__sep--solo"></span>
      <!-- مقسومُ الرحلة بين الفاصلين: السميكُ (‎--solo‎ بلون ‎--u-in-line‎) يمينَه لأنّه أوّلُ
           في المرتّب والصفُّ ‎rtl‎، والنحيفُ (‎--u-line‎) يسارَه يفصله عن السلّة. وهما
           صنفان قائمان في المفردات، لا ثالثَ يُخترع -->
      ${cxJrSeg(d)}
      <span class="src-tools__sep"></span>
      <button type="button" class="infoedit-del" title="${T().delPost}" aria-label="${T().delPost}">${TRASH_IC}</button>
      ${pstBadge()}
      <button type="button" class="info-sharebtn${shareOff()}" id="cm-info-share" title="${T().doneBtn}">${T().doneBtn}</button>
    </div>`;

  /* ---------- عرض «البطائق»: سيل كومنتات رزم مطوية (كالشروح) ---------- */
  let cardView = { open: null, fold: {} };   /* الكومنت المفتوح + حالة طي مجلداته (عرض فقط) */

  /* ---------- وضع المذاكرة (م3+م4): قلب البطاقة + جدولة SM-2 مبسّطة (قيم أنكي) ----------
     state.srs شخصي محلي: ease يبدأ 250% ولا ينزل عن 130 · مرة أخرى −20 (تعود بالجلسة) ·
     صعب −15 وفاصل ×1.2 · جيد فاصل ×ease · سهل +15 وفاصل ×ease×1.3 · أول تقييم: 1ي/1ي/4ي */
  let cxStudy = null;   /* {pid, by, cards:[{id,f,b}], i, flipped, again} — لقطة وقت البدء */
  /* ============================================================
     مفتاحُ سجلّك مع البطاقة — الأصلُ لا النسخة
     ============================================================
     السجلُّ (‎state.srs‎ للجدولة و‎state.fa‎ لأوجهها) مفتاحُه **معرّفُ العقدة**. وبطاقةٌ
     تستوردها إلى «رحلتي» نسخةٌ بمعرّفٍ جديد (‎jriClone‎) — فلو تُرك المفتاحُ معرّفَها
     لَصار لك **سجلّان لبطاقةٍ واحدة**: ما أجبتَه في المكتبة لا يُرى في رحلتك، وما
     أجبتَه في رحلتك لا يُرى في المكتبة. وهو نقيضُ ما يُنتظر: البطاقةُ واحدةٌ وأنت واحد.
     فيُحمل على النسخة **أثرُ أصلها** (‎src‎)، ويُقرأ السجلُّ به. والمعرّفُ يبقى جديدًا
     لأنّه هويّةُ **العقدة في الشجرة**: به تُسحب وتُحدَّد وتُحذف — وهويّةُ الموضع غيرُ
     هويّة المحتوى.
     ولا يتسلسل: من استورد نسخةً حملت ‎src‎ أصلِها لا ‎src‎ ما نسخ منه — فالسلسلةُ كلُّها
     تشير إلى المنبع. */
  const recId = n => (n && (n.src || n.id)) || '';
  const flatCards = nodes => (nodes || []).flatMap(n => n.t === 'c' ? [n] : flatCards(n.ch));
  const addDaysISO = (iso, n) => { const t = new Date(iso + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  const srsDue = id => { const r = state.srs[id]; return r && r.d <= todayISO(); };   /* مستحقة اليوم */
  const srsNew = id => !state.srs[id];                                               /* لم تُذاكر بعد */
  /* ===== والغيابُ يُسأل عن الحقل لا عن السجلّ =====
     كان الشرطُ ‎rec ? rec.e : 250‎ — أي «إن وُجد سجلٌّ فخُذ سهولتَه». وكان صحيحًا يومَ
     كان السجلُّ يُكتب كتلةً واحدة: إمّا معدومٌ كلُّه وإمّا تامّ.
     ثمّ فُصل العدُّ عن الجدولة، فصار للبطاقة سجلٌّ فيه عدٌّ **ولمّا تُجدوَل بعد** — فوُجد
     ‎rec‎ ولم يوجد ‎rec.e‎، فأُخذت ‎undefined‎ سهولةً وصار الحسابُ ‎NaN‎ صامتًا يُكتب في
     السجلّ. فيُسأل عن الحقل نفسِه، وهو أصدقُ على كلّ حال */
  function srsNext(rec, g) {
    let e = (rec && rec.e != null) ? rec.e : 250, i = (rec && rec.i != null) ? rec.i : 0;
    if (g === 'again')     { e = Math.max(130, e - 20); i = 0; }
    else if (g === 'hard') { e = Math.max(130, e - 15); i = i > 0 ? Math.max(1, Math.round(i * 1.2)) : 1; }
    else if (g === 'good') { i = i > 0 ? Math.max(1, Math.round(i * e / 100)) : 1; }
    else                   { i = i > 0 ? Math.max(1, Math.round(i * e / 100 * 1.3)) : 4; e += 15; }
    return { e, i };
  }
  /* ===== ويُحصى مع الجدولة: كم أصبتَ وكم أخطأت =====
     الجدولةُ تحفظ **أين أنت الآن** (سهولةٌ وفاصلٌ واستحقاق) ولا تحفظ الطريقَ إليه.
     والصفُّ يريد الطريق: مربّعٌ أخضرُ بعدد ما أصبتَ وأحمرُ بعدد ما أخطأت.
     و«مرّة أخرى» وحدَها خطأ — والثلاثةُ الباقيةُ (صعبٌ · جيّدٌ · سهل) استرجاعٌ وقع.
     والحقلان يُزادان على المحفوظ ولا يُبدّلانه، فسجلُّ من ذاكر قبل اليوم يبقى ويبدأ
     عدُّه من الآن — أصدقُ من أن يُخترع له ماضٍ لم يُسجَّل */
  /* ============================================================
     العدُّ والجدولةُ شيئان لا شيء
     ============================================================
     كانا يُكتبان معًا في ‎srsApply‎، فلمّا احتاج الاختبارُ أن **يجدول مرّةً ويعدّ مرارًا**
     لم يكن له إلى ذلك سبيل. فيُفصلان:
     · ‎srsPlan‎ الجدولةُ وحدَها (‎e‎ و‎i‎ و‎d‎) — متى يعود السؤالُ إليك.
     · ‎srsTally‎ العدُّ وحدَه (‎ok‎ و‎no‎ و‎l‎) — كم أصبتَ وكم أخطأتَ وأيُّهما آخِرُك.
     وكلاهما **يدمج** ولا يستبدل (‎Object.assign‎ على القائم): فكتابةُ أحدهما لا تمحو
     الآخر، وهي التي تجعل «يجدول مرّةً ويعدّ مرارًا» ممكنًا أصلًا.
     و‎srsApply‎ تبقى بعهدها لمن يناديها (وضعُ المذاكرة العاديّ): جدولةٌ وعدٌّ وحفظ */
  const SRS_SCH = ['e', 'i', 'd'];
  function srsPlan(id, g) {
    const today = todayISO();
    const nx = srsNext(state.srs[id], g);
    state.srs[id] = Object.assign({}, state.srs[id] || {},
      { e: nx.e, i: nx.i, d: nx.i > 0 ? addDaysISO(today, nx.i) : today });
  }
  function srsTally(id, right) {
    const p = state.srs[id] || {};
    state.srs[id] = Object.assign({}, p, {
      ok: (p.ok || 0) + (right ? 1 : 0), no: (p.no || 0) + (right ? 0 : 1),
      l: right ? 1 : 0 });
  }
  function srsApply(id, g) {
    const today = todayISO();
    const p = state.srs[id] || {};
    const nx = srsNext(state.srs[id], g);
    /* ===== و‎l‎: **آخرُ** حكمٍ لا مجموعُه =====
       العدّادان يقولان الطريقَ ولا يقولان أين انتهى: بطاقةٌ ‎ok:9 no:1‎ قد يكون آخرُها
       خطأً، وأخرى ‎ok:1 no:9‎ قد يكون آخرُها صوابًا. ودائرةُ المجلد تُلوَّن بالآخِر لا
       بالمجموع — فمن أخطأ عشرًا ثمّ أصاب فقد أتقن، والعكسُ بالعكس.
       وهو **بيانٌ يبدأ من اليوم**: ما ذُوكر قبل هذا السطر لا ‎l‎ له، فلا يُعَدّ مجابًا
       في الدائرة — أصدقُ من أن يُخترع له آخِرٌ لم يُسجَّل */
    state.srs[id] = { e: nx.e, i: nx.i, d: nx.i > 0 ? addDaysISO(today, nx.i) : today,
      ok: (p.ok || 0) + (g === 'again' ? 0 : 1), no: (p.no || 0) + (g === 'again' ? 1 : 0),
      l: g === 'again' ? 0 : 1 };
    save();
  }
  /* تقييم البطاقة الحالية: «مرة أخرى» تعيدها لآخر الجلسة، والبقية تتقدم */
  function cxsGrade(g) {
    const S = cxStudy;
    if (!S || S.i >= S.cards.length) return;
    srsApply(S.cards[S.i].id, g);
    /* ووضعُ المذاكرة العاديُّ يعدّ كالاختبار — المسارُ واحدٌ والحكمُ واحد */
    /* ===== ومخزنان لا واحد =====
       ‏‎srsApply‎ تكتب **سجلَّك أنت** (‎state.srs‎) — ومفتاحُه الأصلُ، فيستوي عندك في
       المكتبة وفي رحلتك.
       و‎cxAns‎ تكتب **عدّادَ الناس** على العقدة نفسِها (‎n.a‎) — وهو خبرٌ عن هذه العقدة
       بعينها، فيُمرَّر لها الجسمُ لا المفتاح. ولو مُرِّر المفتاحُ لَذهب العدُّ إلى الأصل
       بينما يعرض الصفُّ عدَّ النسخة: يُكتب في مكانٍ ويُقرأ من آخر.
       والاختبارُ يفعلها من قبل (‎xtNodeOf(u.cid)‎)، فاستوى البابان */
    cxAns(S.cards[S.i].node || S.cards[S.i].id, null, g !== 'again');
    if (g === 'again') { S.again++; S.cards.push(S.cards.splice(S.i, 1)[0]); }
    else S.i++;
    S.flipped = false;
    renderCmSection();
  }
  function cxStudyHTML() {
    const S = cxStudy;
    const bar = `<div class="cxs-bar">
      <span class="cxs-prog">${Math.min(S.i + 1, S.cards.length)}/${S.cards.length}</span>
      <b class="vp-topic">${esc(S.by)}</b>
      <button type="button" class="cxs-btn cxs-shuffle" title="${T().cxsShuffle}">🔀</button>
      <button type="button" class="cxs-btn cxs-exit">${T().cxsEnd}</button>
    </div>`;
    if (S.i >= S.cards.length) {
      /* ملخص نهاية الجلسة */
      return `<div class="cxs">${bar}
        <div class="cxs-sum">🎉 ${T().cxsDone(S.cards.length)}${S.again ? ` · 🔁 ${S.again}` : ''}</div>
        <div class="cxs-sumbtns">
          <button type="button" class="cxs-btn cxs-restart">${T().cxsAgain}</button>
          <button type="button" class="cxs-btn cxs-exit">${T().cxsEnd}</button>
        </div>
      </div>`;
    }
    const card = S.cards[S.i];
    /* أزرار أنكي الأربعة مع معاينة الفاصل القادم لكل زر */
    const rec = state.srs[card.id];
    const gbtn = (g, label) => {
      const nx = srsNext(rec, g);
      return `<button type="button" class="cxs-g cxs-g--${g}" data-g="${g}">${label}<small>${g === 'again' ? T().cxsNow : T().cxsDays(nx.i)}</small></button>`;
    };
    return `<div class="cxs">${bar}
      <div class="cxs-card" data-cxsflip>
        <div class="cxs-face">${esc(card.f) || '—'}</div>
        ${S.flipped
          ? `<div class="cxs-divider"></div><div class="cxs-backtx">${esc(card.b) || '—'}</div>`
          : `<button type="button" class="cxs-show">${T().cxsShow}</button>`}
      </div>
      ${S.flipped ? `<div class="cxs-grade">
        ${gbtn('again', T().cxsAgainBtn)}${gbtn('hard', T().cxsHard)}${gbtn('good', T().cxsGood)}${gbtn('easy', T().cxsEasy)}
      </div>` : ''}
    </div>`;
  }
  /* لوحة المفاتيح أثناء المذاكرة: مسافة = قلب · ← التالي · → السابق (اتجاه RTL) */
  /* إغلاق قائمة الثلاث نقاط عند النقر خارجها */
  document.addEventListener('click', e => {
    if (!e.target.closest('.post-menu')) document.querySelectorAll('.post-menu.open').forEach(m => m.classList.remove('open'));
  });

  /* ============================================================
     المفتاحُ يُغرَز عند الضغط، ولا يفعل إلّا عند الرفع
     ============================================================
     كان الفعلُ يقع في ‎keydown‎، وفيه أمران:
     · لا حركةَ تُرى إلّا بالفأرة — و‎:active‎ لا يعرف لوحةَ المفاتيح. فالقبّعةُ التي
       رُسمت لتقول «أنا مفتاحٌ يُضغط» لا تنغرز حين يُضغط مفتاحُها حقًّا.
     · ومن أطال الضغطَ مضى الاختبارُ من تحت إصبعه: يُكشف الجوابُ ويُبدى الحكمُ في
       اللحظة التي وضع فيها إصبعَه، فلا فرصةَ للعدول قبل الرفع.
     فصار ‎keydown‎ **يغرز ويحجز** و‎keyup‎ **يرفع ثمّ يفعل**: تُرى الحركةُ من اللوحة
     كما تُرى من الفأرة، ويبقى المفتاحُ مغروزًا ما دام الإصبعُ عليه.
     والمطابقةُ عند الرفع بـ‎code‎ لا ‎key‎: ‎key‎ معنًى يتبدّل مع ‎Shift‎ (فمن رفع ‎Shift‎
     قبل ‎+‎ جاءه الرفعُ باسم ‎=‎ فلا يُطابق، وتبقى القبّعةُ مغروزةً أبدًا)، و‎code‎ هو
     المفتاحُ الماديُّ نفسُه لا يتبدّل. فالمعنى يختار الفعلَ والمادّةُ تُنهيه.
     و‎blur‎ يُلغي المحجوز: من خرج من النافذة وإصبعُه على المفتاح لا يُحكم عليه بغيابه */
  let xtHeld = null;
  /* أيُّ قبّعةٍ تُغرَز وأيُّ فعلٍ يُحجز — أو لا شيء */
  const xtKeyAct = (e, u) => {
    if (e.key === 'Enter') {
      /* والمقصودُ القبّعةُ لا الزرُّ الحاملُ لها: ‎.is-kdown‎ تُلبَس ‎.xt-key‎ */
      if (xtRun.judged || (u.k === 'q' && xtRun.phase === 'show'))
        return ['.xt-rv .xt-key', xtAdvance];
      /* وكلُّ ما دون ‎show‎ يُكشف: درجةً في الأنواع الثلاثة ودرجتين في المتعدّد */
      if (xtRun.phase !== 'show') return ['.xt-rv .xt-key', xtReveal];
      return null;
    }
    /* ويُستثنى المتعدّد: لا حكمَ بيدك فيه، فمفتاحا الحكم لا معنى لهما عنده */
    if (!xtRun.judged && xtRun.phase === 'show' && u.k !== 'q') {
      /* ===== والقبّعةُ لا تُرسم إلّا لمفتاحٍ يعمل =====
         كان الحكمُ بـ‎1‎ و‎2‎ وحدهما. ولمّا رُسمت القبّعتان ‎+‎ و‎−‎ وجب أن يعملا، وإلّا كانت
         الصورةُ كذبًا — وهي الحجّةُ نفسُها التي شُحنت بها قبّعةُ ‎Enter‎.
         و‎=‎ مع ‎+‎: في الصفّ العلويّ من اللوحة الأمّ ‎+‎ لا يُبلغ إلّا بـ‎Shift‎، فيُلتقط
         المفتاحُ نفسُه بلا رفعٍ كذلك. و‎1‎ و‎2‎ باقيان: من تعوّدهما لا يُنقض عليه شيء */
      if (e.key === '1' || e.key === '+' || e.key === '=')
        return ['.xt-jgk--ok .xt-key', () => xtMark(true)];
      if (e.key === '2' || e.key === '-' || e.key === '\u2212')
        return ['.xt-jgk--no .xt-key', () => xtMark(false)];
    }
    return null;
  };
  const xtRelease = () => {
    if (xtHeld && xtHeld.el) xtHeld.el.classList.remove('is-kdown');
    xtHeld = null;
  };
  /* ===== Enter مفتاح واحد: يكشف، ثم بعد حكمك يقدم =====
     ولا يمضي وحده — قرار صاحب الموقع: يقف وتقدمه أنت. وأرقام الخيارات معه */
  document.addEventListener('keydown', e => {
    if (!xtOn || xtMode !== 'run' || !xtRun) return;
    const tg = (document.activeElement || {}).tagName || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tg)) return;
    const u = xtCur();
    if (!u) return;
    const act = xtKeyAct(e, u);
    if (act) {
      e.preventDefault();
      /* والتكرارُ ليس ضغطةً ثانية، ومفتاحٌ محجوزٌ لا يُزاحمه غيرُه */
      if (e.repeat || xtHeld) return;
      const el = document.querySelector('.mmodal__card.is-exam ' + act[0]);
      if (el) el.classList.add('is-kdown');
      xtHeld = { code: e.code || e.key, el, run: act[1] };
      return;
    }
    /* ‎pick‎ وحدَها لا «كلُّ ما ليس ‎ask‎»: ‎show‎ منها، والصوابُ فيها معلَن */
    if (u.k === 'q' && !xtRun.judged && xtRun.phase === 'pick' && /^[1-9]$/.test(e.key)) {
      e.preventDefault(); xtPick(+e.key - 1); return;
    }
    if (u.k === 'q' && !xtRun.judged && xtRun.phase === 'ask' && xtS.kopt.q === 'with' && /^[1-9]$/.test(e.key)) {
      e.preventDefault(); xtPick(+e.key - 1); return;
    }
  });
  document.addEventListener('keyup', e => {
    if (!xtHeld || (e.code || e.key) !== xtHeld.code) return;
    const run = xtHeld.run;
    xtRelease();
    /* وقد تكون النافذةُ أُغلقت والإصبعُ عليه — فلا يُفعل في العدم */
    if (xtOn && xtMode === 'run' && xtRun) run();
  });
  window.addEventListener('blur', xtRelease);

  /* ============================================================
     حِلْيةُ النافذة تغيب حتى تُقصد — والقربُ لا اللمس
     ============================================================
     ثلاثةُ أطرافٍ في النافذة ليست من السؤال في شيء: الختمُ وصاحبُه في الترويسة
     (‎.cd-mid‎)، وأعلامُ السؤال في طرف الذيل (‎.xt-flags‎)، وإحصاءاتُ البطاقة في طرفه
     الآخر (‎.xt-info‎). وهي أخبارٌ **عن** البطاقة لا أدواتٌ للإجابة عنها — ووجودُها
     أمام العين وأنت تُمتحَن يزاحم السؤالَ على انتباهك.
     فتُطفأ حتى تُقصد. و«تُقصد» ههنا **قربٌ لا مرور**: ‎:hover‎ يشترط أن تصيبها الإصبعُ
     أوّلًا — ومن لا يراها لا يصيبها، فيصير الشيءُ مخفيًّا عن كلّ من لا يعرف مكانه.
     أمّا القربُ فيُعلنها قبل أن تبلغها، فتُرى وأنت في طريقك إليها.
     والمسافةُ من **حافّة المستطيل** لا من مركزه: عنصرٌ عريضٌ لا يصحّ أن يُقاس القربُ
     منه بمركزه، وإلّا كان طرفُه أبعدَ من نصفه وهو تحت الإصبع.
     والقياسُ في ‎requestAnimationFrame‎ لا في كلّ حركة: ‎pointermove‎ يقع عشراتِ المرّات
     في الثانية، و‎getBoundingClientRect‎ يُجبر التخطيط — فيُجمع الكلُّ في إطارٍ واحد.
     (وهي قاعدةُ هذا المشروع نفسُها: اقرأ ثمّ اكتب ثمّ أجبِر مرّةً.)
     والظهورُ لكلٍّ على حِدَة: من قصد الأعلامَ لا يُوقَظ له طرفا النافذة الآخران */
  const XT_NEAR = 90;                      /* نصفُ قطر الإيقاظ، بكسلًا من الحافّة */
  let xtChrome = false;                    /* أكانت الحِلْيةُ ظاهرةً في الرسمة السابقة؟ */
  const XT_NEAR_SEL = '.xt-hdc > .cd-mid, .xt-flags, .xt-info';
  let xtNearRaf = 0, xtNearX = 0, xtNearY = 0;
  const xtNearScan = () => {
    xtNearRaf = 0;
    const card = document.querySelector('.mmodal__card.is-exam');
    if (!card) return;
    card.querySelectorAll(XT_NEAR_SEL).forEach(el => {
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - xtNearX, 0, xtNearX - r.right);
      const dy = Math.max(r.top - xtNearY, 0, xtNearY - r.bottom);
      el.classList.toggle('is-near', dx * dx + dy * dy <= XT_NEAR * XT_NEAR);
    });
  };
  document.addEventListener('pointermove', e => {
    if (!xtOn) return;
    xtNearX = e.clientX; xtNearY = e.clientY;
    if (!xtNearRaf) xtNearRaf = requestAnimationFrame(xtNearScan);
  });
  /* ومن خرج مؤشِّرُه من الصفحة وهو فوقها لا تبقى مضاءةً بلا مؤشِّر */
  document.documentElement.addEventListener('mouseleave', () => {
    document.querySelectorAll('.mmodal__card.is-exam .is-near')
      .forEach(el => el.classList.remove('is-near'));
  });

  document.addEventListener('keydown', e => {
    if (!cxStudy || !cmCode || cmTabSel !== 'cards') return;
    const tag = (document.activeElement || {}).tagName || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if (e.key === ' ') {
      e.preventDefault();
      if (cxStudy.i < cxStudy.cards.length) { cxStudy.flipped = !cxStudy.flipped; renderCmSection(); }
    } else if (cxStudy.flipped && ['1', '2', '3', '4'].includes(e.key)) {
      /* كأنكي: 1 مرة أخرى · 2 صعب · 3 جيد · 4 سهل */
      e.preventDefault();
      cxsGrade(['again', 'hard', 'good', 'easy'][+e.key - 1]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (cxStudy.i < cxStudy.cards.length) { cxStudy.i++; cxStudy.flipped = false; renderCmSection(); }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (cxStudy.i > 0) { cxStudy.i--; cxStudy.flipped = false; renderCmSection(); }
    }
  });

  /* عرض «البطائق» صار بهيئة «خ٣» نفسها التي تعرض بها «الشروح» (packCard بـ kind='c') */
  function cardsTabHTML() {
    const editing = cmView.mode === 'edit';
    if (!editing) vtFocused = null;   /* الخروج من التحرير يعيد التركيز التلقائيّ لدخلةٍ قادمة */
    const posts = postsOf(cmCode, 'cards');
    let changed = false;
    posts.forEach(p => { if (!Array.isArray(p.data.deck)) { migPackC(cmCode, p); changed = true; } });
    if (editing) myPost(cmCode, 'cards');   /* ضمان وجود مساهمتي قبل بطاقة التحرير */
    else {   /* مشاركتي الخاوية تمامًا تُنظّف خارج التحرير — وغلافٌ مسمّى يكفي لبقائها */
      const mi = posts.findIndex(x => x.me && !editHasInput('cards', x.data));
      if (mi >= 0) { posts.splice(mi, 1); changed = true; }
    }
    if (changed) save();
    /* نفس ترتيب «الشروح» وشريط فرزها: المثبَّت أولًا ثم الأفضل/الأحدث — والرزم الفارغة لا تُعرض */
    const shown = (cmSort === 'best' ? byBestIdx : byNewest)(posts)
      .filter(({ p }) => (editing && p.me) || editHasInput('cards', p.data));
    if (!shown.length) return `<p class="v-none">${T().noPosts}</p>`;
    return cmSortBar(shown.length) + shown.map(({ p, i }) => (editing && p.me)
      ? cardEditCard(p, i)
      : packCard(p, i, p.data.deck, 'c')).join('');
  }

