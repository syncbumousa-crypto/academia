  /* ===== لوحةُ حشو القناع =====
     ألوانُ الأقنعة تُخزَّن **كودًا صريحًا** لا صنفًا كألوان النصّ: هي في ملفّ أنكي حرفٌ
     يُقرأ هناك، ولأنّها تقع على صورةٍ لا على سطح النافذة فلا تتبدّل بالجلد.
     وأوّلُها حشوُ أنكي نفسُه، وآخرُها الطيفُ لمن أراد ما ليس في السطر */
  const IO_PAL = ['#ffeba2', '#ff8e8e', '#ffc48c', '#a9dfa2', '#9fd3ee', '#c9b6f2', '#f2f2f2', '#2c3542'];
  /* (لوحةُ اللسان ‎ioPalHTML‎ حُذفت: صارت لوحةُ الألوان في الطبقة الثانية من قائمة القناع) */
  /* واللونُ يقع على المختار إن كان، وإلّا صار حشوَ ما يُرسم بعدُ — فالأداةُ تُهيَّأ قبل
     العمل أو تُصحَّح بعده، وكلاهما بابٌ واحد */
  function ioPaintCol(c) {
    if (!/^#[0-9a-fA-F]{3,8}$/.test(c)) return;
    ioFill = c;
    const s = ioSelSh();
    if (s) { s.c = c; ioPaint(); cdTouch(); }
    ioSync();
  }
  /* ===== ما يُوضع يُرفع =====
     المسرحُ **يُعاد استعماله**: تُغلق البطاقة فيبقى عنصرُها في الصفحة، ثمّ تنزل فيه
     التاليةُ أيًّا كان نوعها (‎cdWinEl‎ يردّ ‎cdBase‎ لمن جاء بعد الفراغ). فكلُّ ما يكتبه
     هذا النوعُ على الحقل المشترك دَينٌ عليه يُوفّيه عند الخروج، وإلّا ورثته بطاقةٌ
     لا شأنَ لها به: حقلٌ لا يقبل الكتابة، ولوحُ أقنعةٍ شفّافٌ يبتلع كلّ نقرة.
     وكان الخروجُ ‎return‎ مجرّدًا فبقي الدَّين كلُّه — والقاعدة: من وسم فليمحُ، ومن
     ألحق ابنًا فليأخذه معه */
  function ioShed(fields) {
    const f0 = fields && fields[0];
    if (f0) {
      f0.classList.remove('has-img');
      const pad = f0.querySelector('.cd-iopad'); if (pad) pad.remove();
      const lay = f0.querySelector('.cd-iolay'); if (lay) lay.remove();
    }
    const host = $('#cd-front');
    if (!host) return;
    host.classList.remove('is-empty');
    /* والتحريرُ يُردّ **إن كان مسلوبًا** لا في كلّ رسم: إسنادُه على حقلٍ مركَّزٍ يقفز
       بالمؤشّر إلى أوّله، وهو درسٌ مكتوبٌ في هذا الملفّ من قبل */
    /* ولا يُردّ في المقفلة: هذه تُنادى من ‎renderCardDlg‎ **قبل** ‎cdRoApply‎ فيُعاد
       القفلُ بعدها — وذاك ترتيبٌ يصحّ اليومَ وقد يتبدّل غدًا. والحارسُ في الفعل أوثقُ
       من ترتيبٍ يُصان: ما لا يُحرَّر لا يُردّ إليه تحريرُه من بابٍ آخر */
    if (!cardDlg.ro && host.getAttribute('contenteditable') === 'false') host.contentEditable = 'true';
  }
  /* ===== ولصقُ الصورة بـ‎Ctrl+V‎ لا يمرّ بالحقل =====
     مستمعُ اللصق العامّ في هذا الملفّ يشترط أن تقع اللصقةُ في ‎.cd-in‎ — وحقلُ الإخفاء لم
     يعد يقبل التحرير، فلا يُركَّز فلا تصله لصقةٌ أصلًا؛ تقع على الصفحة فتذهب سُدًى.
     فيُنصَت لها على الصفحة كلِّها ما دامت بطاقةُ إخفاءٍ مفتوحة. وحارسان لا ثالثَ لهما:
       · لا تُلتقط لصقةٌ وقعت في موضعِ كتابةٍ آخر (بحثٌ أو حقلٌ في الصفحة خلفها).
       · ولا يُلتقط إلّا ما كان **صورة**: نصٌّ يُلصق هنا لا محلَّ له فيُترك لصاحبه */
  document.addEventListener('paste', e => {
    if (!ioEdit() || !e.clipboardData) return;
    const t = e.target;
    if (t && t.closest && t.closest('input, textarea, [contenteditable="true"]')) return;
    const dt = e.clipboardData;
    const file = [].slice.call(dt.files || []).find(x => /^image\//.test(x.type))
      || [].slice.call(dt.items || []).filter(i => /^image\//.test(i.type))
        .map(i => i.getAsFile()).filter(Boolean)[0];
    if (!file) return;
    e.preventDefault();
    ioPut(file);
  });
  function ioBody() {
    const st = cdStage();
    if (!st || !cardDlg) return;
    const on = ioOn();
    const body = st.querySelector('.cd-body');
    if (body) body.classList.toggle('is-io', on);
    const fields = body ? body.querySelectorAll(':scope > .cd-field') : [];
    if (fields[0]) fields[0].classList.toggle('is-io', on);
    if (!on) { ioShed(fields); return; }
    if (fields[1]) fields[1].hidden = true;          /* حقلٌ واحدٌ لا حقلان */
    const host = $('#cd-front');
    if (!host) { ioShed(fields); return; }
    const has = !!host.querySelector('img');
    host.classList.toggle('is-empty', !has);
    /* ===== وبمجيء الصورة يكفّ المربّعُ عن كونه مربّعَ نصّ =====
       لا مؤشّرَ كتابةٍ فيه ولا حرفَ يُزاد: الصورةُ متنُه كلُّه، وما يُرسم عليها أقنعةٌ
       لا كلام. ولذلك يُنزع التحريرُ نزعًا — لا يُكتفى بألّا يُكتب فيه */
    if (fields[0]) fields[0].classList.toggle('has-img', has);
    /* ===== ولا يُكتب في هذا الحقل حرفٌ أبدًا =====
       كان التحريرُ يُنزع بمجيء الصورة ويُردّ قبلها — فالحقلُ الخالي يقبل الكتابة، فمن فتح
       بطاقةَ إخفاءٍ وكتب وجد حرفَه ينزل كأنّها بطاقةٌ من نوعٍ آخر. وذاك نوعٌ ثانٍ لا هذا:
       متنُ هذه البطاقة صورةٌ وأقنعةٌ عليها، لا كلام.
       فالنزعُ **دائم**: خاليًا كان الحقلُ أو عامرًا. واللوحُ الخالي زرّان لا مربّعُ كتابة،
       ولصقُ الصورة بـ‎Ctrl+V‎ له بابُه (مستمعُ اللصق أسفلَه) فلا يضيع بنزع التحرير.
       ولا يُسنَد إلّا إن تبدّل: إسنادُ ‎contentEditable‎ على حقلٍ مركَّزٍ يقفز بالمؤشّر إلى أوّله */
    if (host.getAttribute('contenteditable') !== 'false') host.contentEditable = 'false';
    /* اللوحُ الخالي: زرّان فوق بعضهما في وسط الحقل. وهو **أخو** الحقل لا ابنُه،
       فلا يدخل في محتواه المحفوظ ولا تبتلعه الكتابة */
    let pad = fields[0] && fields[0].querySelector('.cd-iopad');
    if (!has && !pad && fields[0]) {
      fields[0].insertAdjacentHTML('beforeend',
        '<div class="cd-iopad">'
        + '<button type="button" class="cd-iob" data-io="pick">' + CD_IC.ioPick + '<span>' + esc(T().ioPick) + '</span></button>'
        + '<button type="button" class="cd-iob" data-io="paste">' + CD_IC.ioPaste + '<span>' + esc(T().ioPaste) + '</span></button>'
        + '</div>');
    } else if (has && pad) pad.remove();
    /* ===== صورةٌ بُدّلت ⇐ أقنعتُها تذهب معها =====
       إحداثيّاتُ القناع منسوبةٌ إلى صورته هي، فلو بقي على صورةٍ ثانيةٍ لَوقع حيث لا شيء
       يُخفيه — نسبةٌ صحيحةٌ حسابًا كاذبةٌ معنًى.
       والحكمُ هنا لا في ‎ioPut‎: للصورة **بابان** — زرّا اللوح الخالي، واللصقُ في الحقل
       رأسًا (‎Ctrl+V‎) لا يمرّ بهما. فيُوضع الحارسُ حيث تُقرأ الحالُ لا حيث يقع الفعل،
       وإلّا نُسي البابُ الثاني كما يُنسى دائمًا */
    const key = ioKeyOf();
    if (key !== cardDlg.ioKey) {
      cardDlg.io = []; cardDlg.ioRaw = []; cardDlg.ioSel = -1; cardDlg.ioKey = key;
      /* وصورةٌ جاءت للتوّ تُحيي مربّعَها: هي أوّلُ ما تفعله هذه البطاقة، فيقع الجدولُ
         عليها كما يقع على مربّعِ أوّلِ حرفٍ في إخوتها.
         وموضعُه هذا الشرطُ لا الرسمُ كلُّه: الرسمُ يُعاد من عشرة أبواب، ولو أُحييَ المربّعُ
         في كلّ مرّةٍ لَعاد الجدولُ بعد أن تُطفئه نقرةُ الخلفيّة. والشرطُ يقع مرّةً واحدة
         لكلّ صورة — وهو نفسُه البابُ الذي يجمع الزرّين واللصقَ المباشر */
      if (key) cdLive(fields[0]);
    }
    /* واللوحُ يُرسم آخرًا: قبله يُوسَم ‎has-img‎ الذي يُخرج المربّعَ إلى مقاس الصورة */
    if (cardDlg.ioSel >= ioSh().length) cardDlg.ioSel = -1;
    ioPaint(); ioSync();
  }
  document.addEventListener('click', e => {
    if (!cardDlg || !e.target.closest) return;
    /* وزرّا الصورة (اختيارٌ ولصق) قبل البوّابة، فيُحرسان بها صراحةً: هما أوّلُ ما
       يغيّر البطاقةَ ولو كانت خاليةً من صورة */
    const b = e.target.closest('.cd-iob');
    if (b) { if (!cardDlg.ro) { if (b.dataset.io === 'pick') ioAskFile(); else ioAskClip(); } return; }
    if (!ioEdit()) return;
    /* ---- سلّةُ الصورة: يُفرَّغ الحقلُ فيرجع اللوحُ الخالي بزرَّيه ---- */
    if (e.target.closest('.cd-ioimgdel')) { ioDropImg(); return; }
    /* ---- زرّا الشكل: يُضيفان في الوسط ولا يُبدّلان يدًا ---- */
    const t = e.target.closest('.cd-iot');
    /* ===== حالُ التوليد: اختيارٌ يُطلى ولا يُعاد به رسمُ النافذة =====
       إعادةُ الرسم تخطف المؤشّرَ من حقلٍ مفتوح، والمطلوبُ طلاءُ زرّين لا غير.
       (وحفظُ الحال مع البطاقة لم يُقرَّر موضعُه بعدُ — فهي حالُ جلسةٍ إلى أن يُقرَّر.) */
    if (t && t.dataset.iomode) {
      cardDlg.ioMode = t.dataset.iomode;
      const trk = t.closest('.cd-iotrk');
      if (trk) trk.querySelectorAll('[data-iomode]').forEach(b => b.classList.toggle('is-on', b === t));
      return;
    }
    if (t && t.dataset.tool) ioAdd(t.dataset.tool);
  });
  /* ===== إضافةُ شكلٍ في وسط الصورة =====
     كان الشكلُ يُرسم بالسحب، فصار يُضاف بضغطةٍ ثمّ يُحرَّك ويُوسَّع باليد — وهو أهدأ:
     من يريد قناعًا على كلمةٍ في الصورة لا يحتاج أن يصيبها من أوّل سحبة.
     والمقاسُ الابتدائيّ نسبةٌ لا بكسلات (‎.28×.18‎) فيستقيم في الصورة العريضة والضيّقة معًا.
     ===== ولا يُكوَّم الشكلُ فوق أخيه =====
     ثلاثةُ أشكالٍ في وسطٍ واحدٍ تصير كتلةً لا يُعرف أعلاها من أسفلها. فيُزاح كلُّ جديدٍ
     إزاحةً صغيرةً عن الذي قبله (كتراصف النوافذ في هذه النافذة نفسِها)، وتُحصر الإزاحةُ
     في الصورة فلا يخرج شكلٌ عن حافّتها */
  function ioAdd(kind) {
    if (!ioEdit() || !ioImgEl()) return;
    const w = .28, h = .18;
    const n = ioSh().length, step = .035;
    const k = n % 6;                                   /* تعود الإزاحةُ إلى الوسط كلَّ ستّة */
    const l = io01(Math.min((1 - w) / 2 + k * step, 1 - w));
    const t = io01(Math.min((1 - h) / 2 + k * step, 1 - h));
    /* ورقمُه فوق الأكبر ولا يملأ فجوةَ محذوف — «الرقمُ اسمٌ لا موضع» كما في الفراغ */
    const nx = ioSh().reduce((m, s) => Math.max(m, s.q === false ? 0 : (+s.n || 1)), 0) + 1;
    ioSh().push({ k: kind === 'ell' ? 'ell' : 'rect', l: l, t: t, w: w, h: h, c: ioFill, q: true, n: nx });
    cardDlg.ioSel = ioSh().length - 1;                 /* المضافُ هو المختار: يُحرَّك في الحال */
    ioPaint(); ioSync(); cdTouch();
    /* وشارةُ العدد تُعاد: قناعٌ زِيد ⇐ سؤالٌ زِيد. و‎cdTouch‎ لا تُعيدها في كلّ حال
       (تُعيدها في فروعِ تبدّلِ الحال وحدَها)، وهذا تبدّلُ **مقدارٍ** لا حال */
    cdPaintRing();
  }
  /* ===== محوُ الصورة: هي ومعها أقنعتُها =====
     الأقنعةُ إحداثيّاتٌ **على هذه الصورة** لا أشكالٌ قائمةٌ بنفسها، فبقاؤها بعدها يضعها
     على صورةٍ لم تُرسم لها. وهو الحكمُ نفسُه الذي يطبّقه حارسُ تبدّل الصورة في هذا الملفّ.
     والطريقُ طريقُ ‎ioPut‎ معكوسًا: يُفرَّغ الحقلُ ثمّ يُوقَظ الرسمُ بحدث ‎input‎ —
     فيسقط اللوحُ (‎ioLay‎ تنزعه بلا ‎has-img‎) ويرجع اللوحُ الخالي بزرَّي الاختيار واللصق */
  function ioDropImg() {
    const host = $('#cd-front');
    if (!host) return;
    ioMenuClose();
    host.innerHTML = '';
    if (cardDlg) { cardDlg.io = []; cardDlg.ioSel = -1; cardDlg.ioRaw = []; cardDlg.ioKey = ''; }
    host.dispatchEvent(new Event('input', { bubbles: true }));
    renderCardDlg();
    cdTouch();
  }
  /* ============================================================
     قائمةُ القناع — الزرُّ الأيمن عليه (‎mask-menu-tiers-lab‎ · الاتّجاه د «الفرعيّة»)
     ============================================================
     طبقتان: الأولى **ثلاثُ أيقوناتٍ بلا كلمة** — لونٌ ونوعٌ وسلّة. والثانيةُ منبثقةٌ
     فرعيّةٌ تُفتح بجانب الأيقونة المضغوطة، فلا تكبر الأولى ولا تُزاح.
     وأيقونتا اللون والنوع **تُنبئان بما فيهما**: قرصُ اللون الحاليّ بين قرصين من اللوحة،
     ومربّعان منقّطٌ ومصمتٌ — وهما حالا القناع نفساهما في ‎.cd-iom‎ لا رمزٌ يُتعلَّم.
     والقائمةُ ابنةُ ‎body‎ بموضعٍ ثابت: مسرحُ البطاقة يُزاح ويُقصّ، فلا تُبنى فيه.
     وهي أختُ قائمةِ وجه المجلد في السطح والتوكنات — لا لغةَ ثالثةً في الموقع.

     والقرارات المختارة: تبقى مفتوحةً بعد كلّ اختيار (اللونُ يُبدَّل مرّتين وثلاثًا حتى
     يستقرّ) · والألوانُ شبكةٌ ‎4×2‎ لا صفًّا · والمرساةُ عند المؤشّر. */
  let ioMenu = null;   /* {el, sub, tier, i} — واحدةٌ في الصفحة */
  const ioColIc = s => {
    const i = IO_PAL.indexOf(s.c), n = IO_PAL.length;
    const a = IO_PAL[((i < 0 ? 0 : i) + 2) % n], b = IO_PAL[((i < 0 ? 0 : i) + 5) % n];
    return `<span class="iom-col" style="--c1:${esc(s.c)};--c2:${a};--c3:${b}"><i></i><i></i><i></i></span>`;
  };
  const IO_KIC = '<span class="iom-kind"><i></i><i></i></span>';
  /* ============================================================
     أيقونتا حالَي الإخفاء — الاتّجاه «ط» من ‎io-mode-icons-lab‎
     ============================================================
     بطاقةُ سؤالٍ كبيرةٌ فوق (وهي **القناعُ المسؤولُ عنه** في الحالين) ورفيقاها تحتها:
     مصمتان ⇐ الكلُّ مستور، ومفرَّغان ⇐ الباقي مكشوف. فلكلّ كلمةٍ في الاسم رسمُها:
     «؟» تقول ‎Guess One‎، وحالُ الرفيقين تقول ‎Hide All‎ أو ‎Hide One‎.
     وقياساتُها مخرَجُ المختبر حرفًا بحرف: البطاقةُ ‎14.6‎ عرضًا والرفيقان ‎8.3×7.2‎ —
     وهو الحدُّ الذي يكبر فيه الرفاقُ حتى يصيروا نظراءَ ولا تفقد «؟» سيادتَها.
     ونقشُ «؟» يتبع لغةَ الواجهة كما تتبعها أيقونةُ السؤال */
  const IO_MODE_IC = all => {
    const co = x => '<rect x="' + x + '" y="14.9" width="8.3" height="7.2" rx="1.6"'
      + (all ? ' fill="currentColor" stroke="none"' : '') + '/>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"'
      + ' stroke-linejoin="round"><g transform="translate(2.05,-2.68) scale(.8295)">'
      + '<path fill-rule="evenodd" fill="currentColor" stroke="none" d="'
      + CD_CARD + (state.lang === 'en' ? CD_QL : CD_QR) + '"/></g>'
      + co(3) + co(12.7) + '</svg>';
  };

  /* ===== أيقونةُ الشكل: أختُ أيقونة اللون في المنطق — «هذا شكلُك، وفيَّ الآخر» =====
     شكلان متراكبان: الحاليُّ مصمتٌ والآخرُ باهت. فلا رمزَ يُتعلَّم، والحالُ تُقرأ منها
     قبل النقر. وهي **قلّابٌ فوريّ** لا بابٌ إلى طبقةٍ ثانية: حالان لا ثالثَ لهما،
     وفتحُ بابٍ لاختيارِ واحدٍ من اثنين نقرةٌ زائدة */
  const IO_SIC = s => `<span class="iom-shape ${s.k === 'ell' ? 'ell' : 'rect'}"><i></i><i></i></span>`;
  const ioMenuHTML = s => `<div class="iom-mn" role="menu">
      <button type="button" class="iom-b" data-ioact="shape" title="${esc(T().ioShape)}">${IO_SIC(s)}</button>
      <button type="button" class="iom-b" data-iot="col" title="${esc(T().ioShCol)}" aria-haspopup="true">${ioColIc(s)}</button>
      <span class="iom-sep"></span>
      <!-- سلّةُ الموقع نفسُها (‎TRASH_IC‎) لا رسمًا خاصًّا بهذه القائمة: المحوُ صورةٌ واحدةٌ
           في الموقع كلِّه — في صفوف الشجرة وفي المساهمات وهنا -->
      <button type="button" class="iom-b iom-b--del" data-ioact="del" title="${esc(T().ioDel)}" aria-label="${esc(T().ioDel)}">${TRASH_IC}</button>
    </div>`;
  const ioSubHTML = (s, tier) => tier === 'col'
    ? `<div class="iom-sub iom-sub--col">${IO_PAL.map(c => `<button type="button" class="iom-sw${c === s.c ? ' on' : ''}"
        data-iocol="${c}" style="--sw:${c}" title="${c}"><i></i></button>`).join('')}
        <label class="iom-spec" title="${esc(T().cdSpectrum)}"><i></i>
          <input type="color" class="iom-pick" value="${esc(s.c || IO_FILL)}"></label></div>`
    : `<div class="iom-sub">
        <button type="button" class="iom-k${s.q !== false ? ' on' : ''}" data-ioq="1"><i class="dash"></i>${esc(T().ioQm.split('—')[0].trim())}</button>
        <button type="button" class="iom-k${s.q === false ? ' on' : ''}" data-ioq="0"><i></i>${esc(T().ioFx.split('—')[0].trim())}</button></div>`;

  /* الإرساءُ محصورٌ في الشاشة: القائمةُ عند المؤشّر، والفرعيّةُ تحت أيقونتها ومتوسّطةً عليها */
  function ioMenuPlace(el, x, y) {
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.max(6, Math.min(x + 6, window.innerWidth - w - 6)) + 'px';
    el.style.top = Math.max(6, Math.min(y + 6, window.innerHeight - h - 6)) + 'px';
  }
  /* والحسابُ واحدٌ لقائمتَي الزرّ الأيمن — قائمةِ القناع وقائمةِ الصورة: كلتاهما
     طبقةٌ أولى فيها أيقونةٌ مضيئة، وطبقةٌ ثانيةٌ تنسدل تحتها. فلو كُتب مرّتين
     لَافترقتا يومًا في موضعٍ أو في انقلابٍ عند حافّة الشاشة */
  function iomSubPlace(menuEl, sub) {
    const btn = menuEl && menuEl.querySelector('.iom-b.on');
    if (!btn || !sub) return;
    const b = btn.getBoundingClientRect(), w = sub.offsetWidth, h = sub.offsetHeight;
    let top = b.bottom + 6;
    if (top + h > window.innerHeight - 6) top = Math.max(6, b.top - 6 - h);   /* لا موضعَ تحته ⇒ فوقه */
    sub.style.top = top + 'px';
    sub.style.left = Math.max(6, Math.min(b.left + b.width / 2 - w / 2, window.innerWidth - w - 6)) + 'px';
  }
  function ioSubPlace() { if (ioMenu) iomSubPlace(ioMenu.el, ioMenu.sub); }
  const ioMenuClose = () => {
    if (!ioMenu) return;
    if (ioMenu.sub) ioMenu.sub.remove();
    if (ioMenu.el) ioMenu.el.remove();
    ioMenu = null;
  };
  function ioMenuSub(tier) {
    if (!ioMenu) return;
    if (ioMenu.sub) { ioMenu.sub.remove(); ioMenu.sub = null; }
    ioMenu.tier = tier;
    ioMenu.el.querySelectorAll('.iom-b[data-iot]').forEach(b => b.classList.toggle('on', b.dataset.iot === tier));
    if (!tier) return;
    const s = ioSelSh(); if (!s) return;
    document.body.insertAdjacentHTML('beforeend', ioSubHTML(s, tier));
    ioMenu.sub = document.body.lastElementChild;
    ioSubPlace();
  }
  /* وتُعاد الطبقةُ الأولى بعد كلّ اختيار: أيقونةُ اللون تحمل اللونَ الجديد وأيقونةُ النوع حالَه */
  function ioMenuSync() {
    if (!ioMenu) return;
    const s = ioSelSh(); if (!s) { ioMenuClose(); return; }
    const b = ioMenu.el.querySelector('.iom-b[data-iot="col"]');
    if (b) b.innerHTML = ioColIc(s);
    const sh = ioMenu.el.querySelector('[data-ioact="shape"]');
    if (sh) sh.innerHTML = IO_SIC(s);
    if (ioMenu.sub) {
      ioMenu.sub.querySelectorAll('.iom-sw').forEach(x => x.classList.toggle('on', x.dataset.iocol === s.c));
      ioMenu.sub.querySelectorAll('.iom-k').forEach(x => x.classList.toggle('on', (x.dataset.ioq === '1') === (s.q !== false)));
    }
  }
  /* الزرُّ الأيمنُ يختار القناعَ أوّلًا ثمّ يفتح عليه: لا تُفتح قائمةٌ على غير مُحدَّد */
  document.addEventListener('contextmenu', e => {
    if (!ioEdit() || !e.target.closest) return;
    const m = e.target.closest('.cd-iom');
    if (!m) return;
    e.preventDefault();
    ioMenuClose();
    cardDlg.ioSel = +m.dataset.i;
    ioPaint(); ioSync();
    const s = ioSelSh(); if (!s) return;
    document.body.insertAdjacentHTML('beforeend', ioMenuHTML(s));
    ioMenu = { el: document.body.lastElementChild, sub: null, tier: null };
    ioMenuPlace(ioMenu.el, e.clientX, e.clientY);
  });
  document.addEventListener('click', e => {
    if (!ioMenu || !e.target.closest) return;
    const inMn = e.target.closest('.iom-mn'), inSub = e.target.closest('.iom-sub');
    if (!inMn && !inSub) { ioMenuClose(); return; }
    const s = ioSelSh(); if (!s) { ioMenuClose(); return; }

    const t = e.target.closest('.iom-b[data-iot]');
    if (t) { ioMenuSub(ioMenu.tier === t.dataset.iot ? null : t.dataset.iot); return; }
    /* الشكلُ يُقلَب في مكانه وتبقى القائمةُ مفتوحة: قد يُقلَب مرّتين حتى يستقرّ الحكم */
    if (e.target.closest('[data-ioact="shape"]')) {
      s.k = s.k === 'ell' ? 'rect' : 'ell';
      ioPaint(); ioSync(); cdTouch(); ioMenuSync(); return;
    }
    if (e.target.closest('[data-ioact="del"]')) { ioMenuClose(); ioDrop(); return; }
    const sw = e.target.closest('.iom-sw');
    if (sw) { ioPaintCol(sw.dataset.iocol); ioMenuSync(); return; }   /* تبقى مفتوحة */
    const q = e.target.closest('.iom-k');
    if (q) { s.q = q.dataset.ioq === '1'; ioPaint(); ioSync(); cdTouch(); ioMenuSync(); return; }
  });
  document.addEventListener('input', e => {
    if (!ioMenu || !e.target.closest || !e.target.closest('.iom-pick')) return;
    ioPaintCol(e.target.value); ioMenuSync();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ioMenu) ioMenuClose(); });
  /* المسرحُ يُزاح ويُمرَّر تحتها وهي ثابتةٌ في الشاشة — فتُغلق بدل أن تُعلَّق على قناعٍ ذهب */
  document.addEventListener('scroll', () => { if (ioMenu) ioMenuClose(); }, true);
  window.addEventListener('resize', () => { if (ioMenu) ioMenuClose(); });

  /* ============================================================
     قائمةُ الصورة: الزرُّ الأيمن على صورةٍ في أيّ حقل
     ============================================================
     تشمل الأنواعَ كلَّها لأنّ الصورةَ فيها شيءٌ واحد: في «الوجهين» و«الفراغ»
     و«المتعدّد» جزءٌ من المتن، وفي «الإخفاء» هي المتنُ نفسُه — وما يُصنع بها
     (فلترٌ واقتصاص) لا يتبدّل بتبدّل النوع. فالمِلاكُ **الصورةُ لا البطاقة**،
     ولذلك مِلاكُ الصيد ‎.cd-in img‎: أيُّ صورةٍ في أيّ حقلٍ في أيّ نافذة.
     ===== ولا سطحَ ثالثٌ يدخل الموقعَ من هذا الباب =====
     تلبس جِلدَ قائمة القناع بعينه (‎.iom-mn‎ و‎.iom-b‎): هما قائمتان بالزرّ الأيمن
     في النافذة نفسِها، فلو افترقتا سطحًا أو انحناءً أو حركةَ دخولٍ لَقُرئتا نظامين.
     وبهذا لا يُكتب لها تنسيقٌ جديدٌ يُصان.
     وأقنعةُ «الإخفاء» تعلو الصورة، فالضغطُ عليها يفتح قائمتَها لا هذه: الهدفُ
     ‎IMG‎ نفسُه لا ما فوقه، فلا يلتبس البابان ولا يُكتب لهما حارس.
     ===== وأبوابُ الفلتر ثلاثةٌ إلى قائمةٍ واحدة =====
     كان بابًا واحدًا يفتح قائمةً تسأل بعدَه «لأيِّ جلد؟» — فصار السؤالان سؤالًا
     واحدًا: تضغط الجهةَ فتنفتح القائمةُ عليها. و«الاقتصاص» بعدُ رسمٌ بلا فعل.
     ============================================================
     محرّكُ التوأمة — **للمعاينة وحدَها**
     ============================================================
     منقولٌ عن ‎Desktop\RE\img-twin-lab/twin.html‎: يُقاس في فضاء ‎OKLab‎ ثمّ يُعاد
     الاستهداف — أرضُ الصورة تُنقل إلى ورقة الجلد وحبرُها إلى حبره، فتندمج الصورةُ
     في الورقة لا تجاورها. ومقبضاه اثنان لا خمسةُ أسماء:
       ‎adopt‎  أتصير الأرضُ ورقتَك أم تبقى لها؟
       ‎chroma‎ أيبقى اللونُ أم يُطرح؟
     والفلاترُ الأربعةُ زوايا هذين المقبضين، و«مُفصِّل» يقرأ الصورةَ فيختار موضعَه بينهما.
     وهذا كلُّه **معاينةٌ لا خبز**: الخبزُ في الصورة المحفوظة وتخزينُ توأمها بابٌ لم
     يُفتح بعد (‎ROADMAP-IMG-TWIN‎ من م٣)، ولذلك لا يُحفظ من هنا شيء */
  const FL_LIN = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const c = i / 255; FL_LIN[i] = c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }
  const flS = v => { v = v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - .055;
    return v < 0 ? 0 : v > 1 ? 255 : Math.round(v * 255); };
  function flOk(r, g, b) {
    const l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b);
    const m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b);
    const s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    return [.2104542553 * l + .7936177850 * m - .0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + .4505937099 * s,
            .0259040371 * l + .7827717662 * m - .8086757660 * s];
  }
  function flRgb(L, a, b) {
    const l_ = L + .3963377774 * a + .2158037573 * b, m_ = L - .1055613458 * a - .0638541728 * b,
          s_ = L - .0894841775 * a - 1.2914855480 * b;
    const l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    return [ 4.0767416621 * l - 3.3077115913 * m + .2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s,
            -.0041960863 * l - .7034186147 * m + 1.7076147010 * s];
  }
  const flIn = o => o.every(v => v >= -.001 && v <= 1.001);
  function flGamut(L, a, b) {
    let o = flRgb(L, a, b); if (flIn(o)) return o;
    let lo = 0, hi = 1;
    for (let i = 0; i < 8; i++) { const t = (lo + hi) / 2, x = flRgb(L, a * t, b * t);
      if (flIn(x)) { lo = t; o = x; } else hi = t; }
    return o;
  }
  const flHex = h => flOk(FL_LIN[parseInt(h.slice(1, 3), 16)], FL_LIN[parseInt(h.slice(3, 5), 16)], FL_LIN[parseInt(h.slice(5, 7), 16)]);
  /* ورقُ الجلدين وحبرُهما: قيمُ الموقع نفسُها (‎--cd-pan‎ و‎--cd-tx‎ في الجلدين) لا تقديرًا —
     فالصورةُ تُستهدف إلى الورقة التي ستقع عليها بعينها */
  /* ===== وورقُ الصورة ورقُ الموضع الذي تسكنه =====
     كانت ‎{ l: '#f7fafa', d: '#1d3036' }‎ — وهما ‎--cd-pan‎ بجلديه، أي لونُ **الترويسة**
     لا لونُ الورق. فكانت الصورةُ المخبوزةُ تنزل في مستطيلٍ من لونٍ آخر، ويُقرأ ذلك
     مستطيلًا في مستطيل. فصار المصدرُ واحدًا: توكنُ ‎--cd-fld-*‎ في ‎styles.css‎ يقرؤه
     الخبزُ كما تقرؤه المستطيلاتُ وورقةُ الملخّص.
     والقراءةُ مرّةً واحدةً تُحفظ: التوكنان على الجذر لا يتبدّلان بجلدٍ ولا بحال،
     وقراءةُ النمط المحسوب في حلقةِ الحبّات (خمسةُ فلاترَ × جانبين) عشرُ قراءاتٍ لا داعي لها.
     والبديلُ مكتوبٌ صراحةً: توكنٌ مفقودٌ أو مكتوبٌ بغير ستّة محارفَ لا يُوقف الخبز */
  const FL_PAP_FB = { l: '#ffffff', d: '#1a2e34' }, FL_INK = { l: '#35455c', d: '#eef5f6' };
  let FL_PAP_M = null;
  function flPap() {
    if (FL_PAP_M) return FL_PAP_M;
    const cs = getComputedStyle(document.documentElement);
    const pick = k => {
      const v = (cs.getPropertyValue('--cd-fld-' + k) || '').trim();
      return /^#[0-9a-f]{6}$/i.test(v) ? v : FL_PAP_FB[k];
    };
    return (FL_PAP_M = { l: pick('l'), d: pick('d') });
  }
  /* المرساتان: الأرضُ وسيطُ إطارٍ عرضُه ٦٪ (لا قمّةُ المدرَّج، فقد تقع في المتن)،
     والحبرُ طبقةُ أوتسو الأبعدُ عن الأرض (لا المتوسّطُ فيتحرّك مع مقاس التصغير) */
  function flMeasure(cv) {
    const w = cv.width, h = cv.height;
    const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    const n = w * h, L = new Float32Array(n), A = new Float32Array(n), B = new Float32Array(n), H = new Float32Array(64);
    let vis = 0, nC = 0;
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      if (d[p + 3] < 16) { L[i] = NaN; continue; }
      vis++;
      const ok = flOk(FL_LIN[d[p]], FL_LIN[d[p + 1]], FL_LIN[d[p + 2]]);
      L[i] = ok[0]; A[i] = ok[1]; B[i] = ok[2];
      if (Math.hypot(ok[1], ok[2]) > .04) nC++;
      let bi = (ok[0] * 64) | 0; if (bi < 0) bi = 0; if (bi > 63) bi = 63; H[bi]++;
    }
    const bx = Math.max(1, Math.round(w * .06)), by = Math.max(1, Math.round(h * .06));
    const rl = [], ra = [], rb = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
      if (x < bx || x >= w - bx || y < by || y >= h - by) {
        const i = y * w + x; if (L[i] === L[i]) { rl.push(L[i]); ra.push(A[i]); rb.push(B[i]); } }
    const med = a => { const s = a.slice().sort((p, q) => p - q); return s.length ? s[s.length >> 1] : .5; };
    const ground = med(rl), gA = med(ra), gB = med(rb);
    let sum = 0; for (let i = 0; i < 64; i++) sum += (i + .5) * H[i];
    let wb = 0, sb = 0, best = -1, lo = 0, hi = 0;
    for (let i = 0; i < 64; i++) {
      wb += H[i]; if (!wb) continue; const wf = vis - wb; if (wf <= 0) break;
      sb += (i + .5) * H[i];
      const mb = sb / wb, mf = (sum - sb) / wf, v = (wb / vis) * (wf / vis) * (mb - mf) * (mb - mf);
      if (v > best) { best = v; lo = mb / 64; hi = mf / 64; } }
    const ink = Math.abs(lo - ground) > Math.abs(hi - ground) ? lo : hi;
    return { ground, gA, gB, ink, bgC: Math.hypot(gA, gB), pC: nC / Math.max(1, vis), sep: Math.abs(ink - ground) };
  }
  function flBakeCv(src, m, papHex, inkHex, o) {
    const w = src.width, h = src.height;
    const a = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    const out = new Uint8ClampedArray(a.length);
    const pap = flHex(papHex), ik = flHex(inkHex);
    const g0 = m.ground, g1 = pap[0], i1 = ik[0], den = (m.ink - g0) || 1e-6, ad = o.adopt, ch = o.chroma;
    for (let p = 0; p < a.length; p += 4) {
      out[p + 3] = a[p + 3]; if (a[p + 3] < 16) continue;
      const ok = flOk(FL_LIN[a[p]], FL_LIN[a[p + 1]], FL_LIN[a[p + 2]]);
      const t = (ok[0] - g0) / den, tc = t < 0 ? 0 : t > 1 ? 1 : t;
      let L = g1 + t * (i1 - g1); if (L < .01) L = .01; if (L > .99) L = .99;
      const bA = pap[1] + (ik[1] - pap[1]) * tc, bB = pap[2] + (ik[2] - pap[2]) * tc;
      const A2 = ok[1] * ch * (1 - ad) + (bA + (ok[1] - m.gA) * ch) * ad;
      const B2 = ok[2] * ch * (1 - ad) + (bB + (ok[2] - m.gB) * ch) * ad;
      const c = flGamut(L, A2, B2);
      out[p] = flS(c[0]); out[p + 1] = flS(c[1]); out[p + 2] = flS(c[2]);
    }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').putImageData(new ImageData(out, w, h), 0, 0);
    return cv;
  }
  /* «مُفصِّل»: أرضٌ مصبوغةٌ تُنظَّف على الأبيض ويُترك منها على الداكن بقدر قوّتها ·
     بقعٌ ملوّنةٌ يُرفع تشبّعُها قليلًا لئلّا يمحوها القلب · فصلٌ ضيّقٌ يُخفَّض */
  function flAuto(side, m) {
    let adopt = 1, chroma = .95;
    if (m.bgC > .015) { chroma = 1; if (side === 'd') adopt = 1 - Math.min(.55, (m.bgC / .06) * .55); }
    else if (m.pC > .04 && m.pC < .28) chroma = 1.15;
    if (m.sep < .25) chroma *= .9;
    return { adopt, chroma: Math.min(1.6, chroma) };
  }
  /* الترتيب: بقاءٌ يمينًا ثمّ مُفصِّل، والمُحبِّران متجاوران (زوجٌ لا يفترق إلّا بملء
     القطرة، فمجاورتُهما تُري الفرقَ في نظرة)، ومِحفاظٌ آخرًا */
  const FL_LIST = [
    { id: 'none',  none: true },
    { id: 'baker', auto: true },
    { id: 'blend', adopt: 1, chroma: .95 },
    { id: 'duo',   adopt: 1, chroma: 0 },
    { id: 'tint',  adopt: 0, chroma: 1 },
  ];
  /* ===== وكلُّ صورةٍ تُدرَج تنزل مُفصَّلةً =====
     «مُفصِّل» ليس ذوقًا يُنتظر اختيارُه، بل **قياس**: يقرأ أرضَ الصورة وحبرَها وينزلهما
     على ورق البطاقة. وأكثرُ ما يُلصق قصاصاتُ كتبٍ أرضُها بيضاء — فتقع على ورقٍ داكنٍ
     رقعةً بيضاءَ تُعمي القارئ. فالأصلُ أن تُفصَّل، والأصلُ يُطبَّق ولا يُستأذن فيه.
     والسمةُ تُكتب **بلا فاصل**: ‎flSel‎ تقسم على ‎|‎ فإن لم تجده ساوت الجانبين —
     فهي للفاتح والداكن معًا. ولا تُفرض على قائمةٍ قائمة: من كان له اختيارٌ بقي له،
     ومن أراد غيرَه بدّله من الزرّ الأيمن — وفيه «بقاء» يردّ الأصل */
  const FL_DEF = 'baker';
  /* ===== وما عجز عنه المتصفّحُ خُبز على القرص =====
     صفحةٌ من ‎file://‎ **لا يُسمح لها بقراءة بكسلات ملفٍّ مجاور**: اللوحُ يُلوَّث فيرمي
     ‎getImageData‎، فتردّ ‎flFacts‎ عدمًا ويسكت ‎flPaint‎. وذلك يُصيب صور ‎../assets/cards/‎ كلَّها
     — وهي بطائقُك المستوردة جميعًا (‎٣١٦٦‎ صورة). فالفلترُ **مخزونٌ ولا يُرى**.
     والعلاجُ أن يُخبز مرّةً واحدةً خارج المتصفّح (‎anki-import-tool/bake-media.py‎ —
     الخوارزميةُ نفسُها منقولةً حرفًا)، وتسكن النسختان ‎../assets/cards/light/‎ و‎../assets/cards/dark/‎
     باسم الأصل. فيصير العرضُ **تبديلَ مسارٍ لا حسابَ بكسلات**: يعمل على ‎file://‎ كما
     يعمل على خادم، وأخفُّ منه في الحالين (لا لوحَ ولا تحويلَ ألوانٍ ولا ‎toDataURL‎).
     وهو لـ«مُفصِّل» وحدَه — وهو الأصلُ في كلّ صورةٍ تُدرَج. وسائرُ الفلاتر تبقى على الخبز
     الحيّ: لكلٍّ أرقامُه، ولا تُخبز كلُّ التوليفات على القرص.
     والقيدُ ضيّقٌ: ‎../assets/cards/‎ المباشرُ وحدَه — لا ما كان في ‎l/‎ أو ‎d/‎ أصلًا، وإلّا
     تداخل المسارُ على نفسه فطلب توأمَ توأم */
  const FL_MED = /^\.\.\/assets\/cards\/original\//;
  const flStamp = img => {
    if (img && !img.getAttribute('data-fl')) img.setAttribute('data-fl', FL_DEF);
    return img;
  };
  /* أيقوناتُ الخمس — كما استقرّت في ‎Desktop\RE\filter-icons-final‎ بعد ستّة مختبرات */
  const flIcon = b => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"'
    + ' stroke-linecap="round" stroke-linejoin="round">' + b + '</svg>';
  const FL_PAGE = '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/>';
  const FL_PEN = '<path d="M20.6 2.2l1.4 1.4-3.2 3.2-2 .6.6-2z"/>';
  const FL_DROP = 'M11 7.74c2.76 3.05 4.5 5.08 4.5 7.26a4.5 4.5 0 0 1 -9 0c0 -2.18 1.74 -4.21 4.5 -7.26z';
  const FL_F = ' fill="currentColor" stroke="none"';
  const FL_IC = {
    none:  flIcon(FL_PAGE + '<path d="M18.6 6.4L5.4 17.6"/>'),
    baker: flIcon('<path d="M10.6 3.4l1.9 4.8 4.8 1.9-4.8 1.9-1.9 4.8-1.9-4.8L3.9 10.1l4.8-1.9z"/>'
                + '<path d="M17.8 14.6l.85 2.15 2.15.85-2.15.85-.85 2.15-.85-2.15L14.8 17.6l2.15-.85z"/>'),
    blend: flIcon(FL_PEN + '<path d="' + FL_DROP + '"' + FL_F + '/>'),
    duo:   flIcon(FL_PEN + '<path d="' + FL_DROP + '"/>'),
    tint:  flIcon('<path d="M12 3.2l6.8 3.4l-6.8 3.4l-6.8 -3.4z"/><path d="M5.2 10.4l6.8 3.4l6.8 -3.4"/>'
                + '<path d="M12 13.2l6.8 3.4l-6.8 3.4l-6.8 -3.4z"' + FL_F + '/>'),
  };
  /* ===== المعايناتُ تُخبز مرّةً لكلّ صورة =====
     ‎132‎ للحبّة و‎300‎ للقياس: القياسُ يحتاج بكسلاتٍ تكفي للمدرَّج، والحبّةُ لا تُعرض
     إلّا في ‎44×34‎ فلا معنى لأكبرَ منها. والحسابُ كلُّه دون العشرين ألف بكسلٍ للحبّة.
     ===== وقد يمتنع الخبزُ ولا عيبَ في الشِّفرة =====
     صفحةٌ من ‎file://‎ لا تُقرأ بكسلاتُ صورةٍ جاءت من ملفٍّ مجاور: اللوحُ يُلوَّث
     فيرمي ‎getImageData‎. فتُعرض القائمةُ حينئذٍ بأيقوناتها وأسمائها بلا حبّات،
     ويُقال السببُ ولا يُترك المستخدمُ أمام مربّعاتٍ فارغةٍ يظنّها عطبًا */
  /* لوحٌ من الصورة بمقاسٍ محدود — للقياس وللحبّات وللصبغ جميعًا */
  function flCv(el, cap) {
    const k = Math.min(1, cap / Math.max(el.naturalWidth, el.naturalHeight, 1));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(el.naturalWidth * k));
    c.height = Math.max(1, Math.round(el.naturalHeight * k));
    const x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high'; x.drawImage(el, 0, 0, c.width, c.height);
    return c;
  }
  /* ===== الأرقامُ الخمسة: حقائقُ الصورة، تُقاس مرّةً وتُكتب عليها فتسافر معها =====
     ‎ground‎ لونُ ورقها · ‎ink‎ لونُ حبرها · ‎gA,gB‎ صبغةُ أرضها · ‎pC‎ نسبةُ ما فيها من لون.
     وهذه **ما قِيس** لا غير. أمّا ‎bgC‎ و‎sep‎ وما يختاره «مُفصِّل» فكلُّها **مستنتَجٌ**
     منها بالشِّفرة، فلا يُخزَّن — ولو خُزّن لَتجمّد على نسخة اليوم ولم ينتفع بتحسينٍ
     بعدها. ومعها رقمُ نسخة الخوارزميّة، فيُعرف متى يستحقّ الاستنتاجُ إعادة.
     ===== ولمَ تُكتب على الصورة في البطاقة لا في مخزنٍ جانبيّ؟ =====
     لأنّها يجب أن **تسافر مع البطاقة** حين تُنشر، فيقرأ زميلُك الحكمَ نفسَه ولا يُعيد
     قراءةَ الصورة بنفسه. ولو أعادها لَاختلف حكمُه عن حكمك اختلافًا يسيرًا (مقاسُ
     التصغير يختلف والنسخةُ تختلف) فرأى البطاقةَ بلونٍ غيرِ الذي رأيتَه.
     وحجمُها نحوُ أربعين حرفًا — لا تُذكر أمام صورةٍ بمئات الكيلوبايت.
     والمخزنُ الجانبيُّ كان يجعل سفرَها رهينةَ نموذج النشر، وهو معلّقٌ بعدُ */
  const FL_ALGO = 1;
  function flFacts(attrEl, pixEl) {
    const r = (attrEl.getAttribute('data-fm') || '').split(',').map(Number);
    if (r.length >= 5 && r.slice(0, 5).every(v => v === v))
      return { ground: r[0], ink: r[1], gA: r[2], gB: r[3], pC: r[4],
               bgC: Math.hypot(r[2], r[3]), sep: Math.abs(r[1] - r[0]) };
    const el = pixEl || attrEl;
    try {
      if (!el.naturalWidth) return null;
      const m = flMeasure(flCv(el, 300));
      attrEl.setAttribute('data-fm',
        [m.ground, m.ink, m.gA, m.gB, m.pC].map(v => +v.toFixed(4)).concat(FL_ALGO).join(','));
      return m;
    } catch (e) { return null; }   /* لوحٌ ملوَّث: لا أرقامَ ولا صبغ */
  }
  /* إعدادُ فلترٍ لجهةٍ: الأربعةُ ثوابت، و«مُفصِّل» يُستنتج من الأرقام */
  function flOpt(id, side, m) {
    const f = FL_LIST.find(x => x.id === id);
    if (!f || f.none) return null;
    return f.auto ? flAuto(side, m) : { adopt: f.adopt, chroma: f.chroma };
  }
  /* الاختيارُ للجلدين معًا أو لكلٍّ حِدَة: ‎"duo"‎ لهما، و‎"blend|duo"‎ إذا افترقا */
  function flSel(img) {
    const v = (img.getAttribute('data-fl') || '').split('|');
    return { l: v[0] || '', d: v[1] || v[0] || '' };
  }

  let flPrev = null;
  function flChips(img) {
    const key = (img.getAttribute('data-osrc') || img.currentSrc || img.src || '')
      + '|' + (img.getAttribute('data-fm') || '');
    if (flPrev && flPrev.key === key) return flPrev;
    flPrev = { key, chips: null };
    /* والحبّاتُ تُخبز بالأرقام المخزَّنة نفسِها التي يُخبز بها العرضُ — فما تراه في
       القائمة هو ما يقع على الصورة، لا تقديرٌ ثانٍ قد يخالفه */
    const base = flBase(img), m = base && flFacts(img, base);
    if (m && base) try {
      const tiny = flCv(base, 132), chips = {};
      FL_LIST.forEach(f => ['l', 'd'].forEach(s => {
        const o = flOpt(f.id, s, m);
        chips[f.id + s] = (o ? flBakeCv(tiny, m, flPap()[s], FL_INK[s], o) : tiny).toDataURL();
      }));
      flPrev.chips = chips;
    } catch (e) { flPrev.chips = null; }
    return flPrev;
  }

  /* ===== البكسلاتُ المصبوغة: ذاكرةُ الجلسة لا مخزن =====
     صارت قابلةً للصنع في أيّ لحظة (عندك الأصلُ والأرقامُ والإعداد)، فتخزينُها تكديسٌ
     لما يُصنع مجّانًا — وخزانةُ الموقع ممتلئةٌ لا تحتمل. فتُحسب أوّلَ ظهورٍ في الجلسة
     وتبقى في الذاكرة حتّى يُغلق الموقع.
     ===== والأصلُ لا يُمَسّ =====
     ما دامت الصبغةُ معروضةً فـ‎src‎ بكسلاتٌ مصنوعةٌ في هذه الجلسة، والأصلُ محفوظٌ في
     ‎data-osrc‎ يردّه ‎cdClean‎ عند كلّ حفظ. ولولا ذلك لَحلّت الصبغةُ محلَّ الأصل في
     البطاقة أوّلَ حفظةٍ وذهب ما وعدنا ألّا يُمَسّ.
     ولا يُخبز من المعروض بل من **الأصل** أبدًا: صورةٌ محمولةٌ مستقلّةٌ تُبنى من
     ‎data-osrc‎ — وإلّا صُبغ المصبوغُ فتراكمت الصبغةُ على نفسها */
  const flCache = new Map();
  /* ===== وجانبُ الصورة من جلد **موضعها** لا من جلد الموقع =====
     الصورةُ لها توأمان: فاتحةٌ وداكنة. وكان الاختيارُ بينهما من ‎html[data-theme]‎ — أي
     من جلد الموقع أبدًا. وورقةُ الملخّص لها جلدٌ يُقطع عن الموقع بزرّه، فكانت الورقةُ
     تصير بيضاءَ وصورُها داكنةً (أو عكسَه): صورةٌ سوداءُ على ورقةٍ بيضاء.
     فالجانبُ يُسأل عنه **العنصرُ نفسُه**: إن سكن ورقةً فجلدُها، وإلّا فجلدُ الموقع.
     ومفتاحُ المخزن يحمله (‎flPaint‎)، فيتعايش التوأمان فيه ولا يطرد أحدُهما الآخر */
  const flSide = el => {
    const sh = el && el.closest && el.closest('.mmodal__card.is-sheet');
    const th = sh ? sh.dataset.sh : document.documentElement.getAttribute('data-theme');
    return th === 'dark' ? 'd' : 'l';
  };
  const flSrc = img => img.getAttribute('data-osrc') || img.getAttribute('src') || '';
  const flBaseEl = new Map();
  function flBase(img) {
    const s = flSrc(img); if (!s) return null;
    if (!img.getAttribute('data-osrc')) return img.complete && img.naturalWidth ? img : null;
    const b = flBaseEl.get(s);
    return b && b.complete && b.naturalWidth ? b : null;
  }
  function flPaint(img) {
    const id = flSel(img)[flSide(img)];
    const orig = img.getAttribute('data-osrc');
    if (!id || id === 'none') {                    /* لا صبغةَ: يُردّ الأصلُ إن كان مبدَّلًا */
      if (orig) { img.setAttribute('src', orig); img.removeAttribute('data-osrc'); }
      return;
    }
    const src = flSrc(img); if (!src) return;
    /* المخبوزُ على القرص أوّلًا — أرخصُ من الخبز الحيّ، ويعمل حيث لا يعمل */
    if (id === FL_DEF && FL_MED.test(src)) {
      const twin = src.replace(FL_MED, '../assets/cards/' + (flSide(img) === 'd' ? 'dark' : 'light') + '/');
      if (!orig) img.setAttribute('data-osrc', src);
      if (img.getAttribute('src') !== twin) {
        /* ===== وإن غاب التوأمُ رُدَّ الأصل =====
           الخبزُ يعمّ المجلّدَ كلَّه، لكنّ ملفًّا يُضاف بعده أو خبزًا يُقطع في وسطه يترك
           فجوة — وصورةٌ مكسورةٌ في بطاقةٍ أسوأُ من صورةٍ بلا فلتر. والمستمعُ لمرّةٍ
           واحدة: لا يُراكَم على الصورة بكلّ رسم */
        img.addEventListener('error', function once() {
          img.removeEventListener('error', once);
          img.setAttribute('src', src);
          img.removeAttribute('data-osrc');
        }, { once: true });
        img.setAttribute('src', twin);
      }
      return;
    }
    /* والأصلُ يُسجَّل صورةً محمولةً من أوّل صبغة: بعدها يصير ‎src‎ المعروضُ مصبوغًا،
       فلولا هذا السجلُّ لَما وُجد الأصلُ حين يُطلب ثانيةً (تبديلُ جلدٍ أو فتحُ القائمة) */
    if (!flBaseEl.has(src)) { const b0 = new Image(); flBaseEl.set(src, b0); b0.src = src; }
    const key = src + '|' + id + '|' + flSide(img) + '|' + (img.getAttribute('data-fm') || '');
    const hit = flCache.get(key);
    if (hit) {
      if (!orig) img.setAttribute('data-osrc', src);
      if (img.getAttribute('src') !== hit) img.setAttribute('src', hit);
      return;
    }
    const bake = base => {
      const m = flFacts(img, base); if (!m) return;
      const o = flOpt(id, flSide(img), m); if (!o) return;
      let url;
      try { const sd = flSide(img);
        url = flBakeCv(flCv(base, 1200), m, flPap()[sd], FL_INK[sd], o).toDataURL(); }
      catch (e) { return; }
      flCache.set(key, url);
      if (!img.getAttribute('data-osrc')) img.setAttribute('data-osrc', src);
      img.setAttribute('src', url);
    };
    const ready = flBase(img);
    if (ready) { bake(ready); return; }
    let b = flBaseEl.get(src);
    if (!b) { b = new Image(); flBaseEl.set(src, b); b.src = src; }
    if (b.complete && b.naturalWidth) bake(b);
    else b.addEventListener('load', () => bake(b), { once: true });
  }
  const flPaintAll = root => (root || document).querySelectorAll('img[data-fl]').forEach(flPaint);
  /* اختيارُ فلترٍ من القائمة: يُكتب على الصورة، وتُقاس أرقامُها إن لم تكن قِيست */
  function flApply(img, id, side) {
    const s = flSel(img);
    if (side === 'both') { s.l = s.d = id; } else s[side === 'd' ? 'd' : 'l'] = id;
    const v = (s.l === s.d) ? s.l : (s.l || 'none') + '|' + (s.d || 'none');
    if (v && v !== 'none') img.setAttribute('data-fl', v); else img.removeAttribute('data-fl');
    const base = flBase(img); if (base) flFacts(img, base);
    flPaint(img);
    cdTouch();
  }

  /* ===== تحديدُ الصورة: هالةٌ وعتمة =====
     نقرةٌ على صورةٍ في أيّ حقلٍ تُحدّدها، ونقرةٌ في غيرها أو «مهرب» تفكّها. والزرُّ
     الأيمنُ يُحدّدها أيضًا قبل أن يفتح قائمتَها — فتُعرف الصورةُ التي تخصّها القائمة.
     والحالُ في الصنف لا في الحال المحفوظة: إعادةُ الرسم تمحوها، وذلك صواب —
     التحديدُ لحظةٌ لا خبرٌ عن البطاقة. ولا يُخزَّن منه شيء: المنقّي يطرح صنفَيه */
  let imSel = null;
  function imSelClear() {
    if (!imSel) return;
    imSel.classList.remove('is-imsel');
    const f = imSel.closest && imSel.closest('.cd-in');
    if (f) f.classList.remove('is-imdim');
    imSel = null;
  }
  function imSelSet(img) {
    if (imSel === img) return;
    imSelClear();
    if (!img) return;
    imSel = img;
    img.classList.add('is-imsel');
    const f = img.closest('.cd-in');
    if (f) f.classList.add('is-imdim');
  }

  let imgMenu = null;
  const imgMenuClose = () => {
    if (!imgMenu) return;
    if (imgMenu.sub) imgMenu.sub.remove();
    if (imgMenu.el) imgMenu.el.remove();
    imgMenu = null;
  };
  document.addEventListener('contextmenu', e => {
    if (!cardDlg || !e.target.closest) return;
    /* ===== وفي «الإخفاء» لا تُصاب الصورةُ بالنقر =====
       فوقها لوحُ الأقنعة (‎.cd-iolay‎) شفّافٌ يبتلع كلَّ نقرةٍ ليُرسم عليه — فالهدفُ
       هو اللوحُ لا الصورةُ التي تحته، و‎closest‎ تصعد فلا تجدها.
       فيُقبل اللوحُ نائبًا عنها، وتُطلب الصورةُ من حقله هو (لا بمعرّفٍ عامّ) كي تصحّ
       في نافذةٍ غيرِ مركَّزةٍ نُقلت معرّفاتُها إلى ‎data-id‎.
       والقناعُ مستثنًى: له قائمتُه، ومستمعُها سابقٌ لهذا — فلولا الاستثناءُ لَفُتحت
       القائمتان معًا على ضغطةٍ واحدة */
    const lay = e.target.closest('#card-modal .cd-iolay');
    if (lay && e.target.closest('.cd-iom')) return;
    const host = lay && lay.closest('.cd-in');
    const img = e.target.closest('#card-modal .cd-in img')
      || (host && host.querySelector('img')) || (lay && ioImgEl());
    if (!img) return;
    e.preventDefault();
    imSelSet(img);                     /* تُحدَّد أوّلًا فتُعرف صاحبةُ القائمة */
    ioMenuClose(); imgMenuClose();
    const sides = [['both', T().imgFlBoth, CD_IC.flBoth], ['l', T().imgFlLight, CD_IC.flSun],
                   ['d', T().imgFlDark, CD_IC.flMoon]];
    document.body.insertAdjacentHTML('beforeend', `<div class="iom-mn imgm-mn">`
      + sides.map(([k, t, ic]) => `<button type="button" class="iom-b" data-imgfl="${k}"`
        + ` title="${esc(t)}" aria-label="${esc(t)}" aria-haspopup="true">${ic}</button>`).join('')
      + `<span class="iom-sep"></span>`
      + `<button type="button" class="iom-b" data-imgact="crop"`
      + ` title="${esc(T().imgCrop)}" aria-label="${esc(T().imgCrop)}">${CD_IC.imgCrop}</button>`
      + `</div>`);
    imgMenu = { el: document.body.lastElementChild, sub: null, side: null, img };
    /* والإرساءُ بدالّة القناع نفسِها: محصورٌ في الشاشة، ولا حسابَ يُكتب مرّتين */
    ioMenuPlace(imgMenu.el, e.clientX, e.clientY);
  });
  /* ===== الطبقةُ الثانية: قائمةُ الفلاتر =====
     تلبس جِلدَ ‎.iom-sub‎ نفسَه (طبقةُ القناع الثانية) فلا سطحَ ثالثٌ يدخل الموقع.
     وعمودُها: معاينةٌ محدودةٌ فوق، وتحتها أيقونةٌ ظاهرةٌ أبدًا واسمٌ **مطويٌّ**
     ينبسط حين تُشار القائمةُ — فهي قصيرةٌ ما لم تُقصَد، وانبساطُها عموديٌّ خالص.
     و«كلا الجلدين» تشطر الحبّةَ قُطرًا: أعلاها الفاتحُ وأسفلُها الداكن، فتُري
     الجوابين في حبّةٍ واحدةٍ بلا أن تسأل عن جهة */
  function imgFlHTML(side) {
    const P = flChips(imgMenu.img), nm = T().flNames;
    const cell = f => {
      const im = P.chips
        ? (side === 'both'
            ? `<img class="im l" src="${P.chips[f.id + 'l']}" alt="">`
              + `<img class="im d" src="${P.chips[f.id + 'd']}" alt=""><span class="diag"></span>`
            : `<img class="im" src="${P.chips[f.id + side]}" alt="">`)
        : '';
      return `<button type="button" class="fcol" data-imgflp="${f.id}" title="${esc(nm[f.id])}">`
        + (P.chips ? `<span class="f-box">${im}</span>` : '')
        + `<span class="f-head">${FL_IC[f.id]}<span class="nm">${esc(nm[f.id])}</span></span></button>`;
    };
    return `<div class="iom-sub imgm-fl${P.chips ? '' : ' is-bare'}">`
      + `<div class="fstrip">${FL_LIST.map(cell).join('')}</div>`
      + (P.chips ? '' : `<p class="fl-warn">${esc(T().flNoPix)}</p>`) + `</div>`;
  }
  function imgFlSub(side) {
    if (!imgMenu) return;
    if (imgMenu.sub) { imgMenu.sub.remove(); imgMenu.sub = null; }
    imgMenu.side = side;
    imgMenu.el.querySelectorAll('[data-imgfl]').forEach(b => b.classList.toggle('on', b.dataset.imgfl === side));
    if (!side) return;
    document.body.insertAdjacentHTML('beforeend', imgFlHTML(side));
    imgMenu.sub = document.body.lastElementChild;
    imgFlMark();
    iomSubPlace(imgMenu.el, imgMenu.sub);
  }
  document.addEventListener('click', e => {
    if (!imgMenu || !e.target.closest) return;
    const b = e.target.closest('.imgm-mn [data-imgfl]');
    if (b) { imgFlSub(imgMenu.side === b.dataset.imgfl ? null : b.dataset.imgfl); return; }
    /* اختيارُ فلتر: يقع على الجهة التي دخلتَ منها، والقائمةُ تبقى مفتوحةً لتقارن */
    const p = e.target.closest('.imgm-fl [data-imgflp]');
    if (p) {
      flApply(imgMenu.img, p.dataset.imgflp, imgMenu.side || 'both');
      imgFlMark();
    }
  });
  /* وسمُ المختار: يُقرأ من الصورة نفسِها لا من حالٍ في الذاكرة — فهو حيث يُحفظ */
  function imgFlMark() {
    if (!imgMenu || !imgMenu.sub) return;
    const s = flSel(imgMenu.img), side = imgMenu.side === 'd' ? 'd' : 'l';
    const cur = imgMenu.side === 'both' ? (s.l === s.d ? s.l : '') : s[side];
    imgMenu.sub.querySelectorAll('[data-imgflp]').forEach(b =>
      b.classList.toggle('on', b.dataset.imgflp === (cur || 'none')));
  }
  /* وتُغلق بما تُغلق به أختُها: ضغطةٌ خارجها · مهرب · تمريرٌ · تغيّرُ مقاس.
     والطبقةُ الثانيةُ من القائمة، فالضغطُ فيها ليس ضغطًا خارجَها */
  document.addEventListener('pointerdown', e => {
    if (imgMenu && (!e.target.closest
      || (!e.target.closest('.imgm-mn') && !e.target.closest('.imgm-fl')))) imgMenuClose();
  }, true);
  /* و«مهرب» يفكّ القائمةَ والتحديدَ معًا: هما شيءٌ واحدٌ في ذهن مَن ضغط */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (imgMenu) imgMenuClose();
    imSelClear();
  });
  document.addEventListener('scroll', () => { if (imgMenu) imgMenuClose(); }, true);
  window.addEventListener('resize', () => { if (imgMenu) imgMenuClose(); });

  /* ===== محوُ القناع: بابان إلى فعلٍ واحدٍ لا يفترقان =====
     سلّةُ اللسان ومفتاحُ الحذف يمرّان من هنا جميعًا */
  function ioDrop() {
    const s = ioSelSh();
    if (!s) return;
    ioSh().splice(cardDlg.ioSel, 1);
    cardDlg.ioSel = -1;
    ioPaint(); ioSync(); cdTouch();
    cdPaintRing();                    /* قناعٌ ذهب ⇐ سؤالٌ ذهب: تُعاد شارةُ العدد */
  }
  document.addEventListener('keydown', e => {
    if (!cdShellOn() || !ioEdit() || (e.key !== 'Delete' && e.key !== 'Backspace')) return;
    if (!cardDlg || cardDlg.ioSel < 0) return;
    /* والكتابةُ أولى بالمفتاح: لو كان المؤشّرُ في حقلٍ يُكتب فيه فالحذفُ حذفُ حرف */
    const a = document.activeElement;
    if (a && a.closest && (a.isContentEditable || a.closest('input, textarea'))) return;
    e.preventDefault();
    ioDrop();
  });
  /* ===== والصورةُ تأتي من بابين =====
     زرّا اللوح الخالي يمرّان بـ‎ioPut‎ فتُعاد الرسمُ من عندها. أمّا اللصقُ في الحقل
     رأسًا (‎Ctrl+V‎) فيمرّ بمستمع اللصق العامّ ولا يعلم به الرسم — فتبقى الصورةُ
     في الحقل واللوحُ الخالي فوقها والأدواتُ غائبة.
     فيُرصد **تبدّلُ الصورة** لا كلُّ حرف: ولو أُعيد الرسمُ مع كلّ إدخالٍ لَثقُلت الكتابة.
     وكان السؤالُ «أحضرت صورةٌ أم غابت؟» فكفى يومًا ولم يكفِ بعدَه: صورةٌ تحلّ محلَّ
     صورةٍ لا تُغيّر الحضورَ فلا يُعاد الرسم، فتبقى أقنعةُ الأولى على الثانية.
     فصار السؤالُ عن **هُويّتها** لا عن حضورها — وهو يجمع الأمرين: الغائبةُ مفتاحُها خالٍ،
     فمجيئُها وذَهابُها وتبدُّلُها ثلاثةٌ يقولها مفتاحٌ واحد */
  document.addEventListener('input', e => {
    if (!ioOn() || !e.target || !e.target.closest) return;
    const host = e.target.closest('#cd-front');
    if (!host) return;
    if (ioKeyOf() !== cardDlg.ioKey) renderCardDlg();
  }, true);
  function czBody() {
    const st = cdStage();
    if (!st || !cardDlg) return;
    const isCz = cardDlg.kind !== 'q' && cardDlg.ctype === 'cloze';
    const body = st.querySelector('.cd-body');
    if (body) body.classList.toggle('is-cz', isCz);
    const fields = body ? body.querySelectorAll(':scope > .cd-field') : [];
    if (fields[0]) fields[0].classList.toggle('is-cz', isCz);
    if (!isCz) return;
    czFields().forEach(el => {
      const now = el.innerHTML, next = czShow(now);
      if (next !== now) el.innerHTML = next;
    });
  }
  /* ===== اللفّ: يُطبَّق على المحدَّد في الحقل الحيّ =====
     والمسافاتُ عند الطرفين تبقى **خارج** الفراغ — دأبُ أنكي نفسِه (‎AV()‎ في محرّره):
     فلو ابتلعها لَظهر الفراغُ أوسعَ ممّا يُخفي، ولَالتصق بما قبله عند العرض */
  /* ===== زرّان لفعلٍ واحدٍ في حالين =====
     · الأوّل: يضمّ المحدَّدَ إلى السؤال الذي تبنيه الآن — وهو الأكبرُ الموجود، أو
       الأوّلُ إن لم يكن في البطاقة فراغٌ بعد. فمن ضغطه مرّتين جمع الكلمتين في سؤال.
     · والثاني (بالزائدة): يستأنف سؤالًا جديدًا فوق الأكبر.
     وهذه قسمةُ أنكي نفسُها، فمن جاء من هناك لم يتعلّم شيئًا */
  function czWrap(fresh) {
    if (!cardDlg) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    const host = r.startContainer.parentElement && r.startContainer.parentElement.closest('.cd-in');
    if (!host || r.collapsed) return;
    /* الوعاءُ يحمل المحدَّد كما هو — بوسومه وصوره، فالتنسيقُ لا يضيع باللفّ */
    const hold = document.createElement('span');
    hold.appendChild(r.extractContents());
    /* والمسافاتُ عند الطرفين تخرج من القوسين — دأبُ أنكي نفسِه (‎AV()‎ في محرّره):
       فلو ابتُلعت لَظهر الفراغُ أوسعَ ممّا يُخفي ولَالتصق بما قبله عند العرض */
    let pre = '', post = '';
    const first = hold.firstChild, last = hold.lastChild;
    if (first && first.nodeType === 3) {
      const m = /^\s+/.exec(first.nodeValue);
      if (m) { pre = m[0]; first.nodeValue = first.nodeValue.slice(pre.length); }
    }
    if (last && last.nodeType === 3) {
      const m = /\s+$/.exec(last.nodeValue);
      if (m) { post = m[0]; last.nodeValue = last.nodeValue.slice(0, -post.length); }
    }
    if (!hold.textContent.trim() && !hold.querySelector('img')) return;   /* محضُ فراغٍ لا يُلَفّ */
    /* والأقواسُ عقدتان نصّيّتان تكتنفان المحدَّد: نصٌّ في المتن كما في أنكي، يُقرأ ويُحرَّر */
    /* والوسمُ عقدةٌ واحدةٌ مع القوس الفاتح: يُكتب معه ويُمحى معه، ولا يُفصل عنه بكتابة */
    const n = fresh ? czMax() + 1 : (czMax() || 1);
    const frag = document.createDocumentFragment();
    if (pre) frag.appendChild(document.createTextNode(pre));
    frag.appendChild(document.createTextNode(czOpenOf(n)));
    while (hold.firstChild) frag.appendChild(hold.firstChild);
    const tail = document.createTextNode('}}' + post);
    frag.appendChild(tail);
    r.insertNode(frag);
    /* والمؤشّرُ يقف بعد القوسين: الكتابةُ تتمّة للجملة لا زيادةٌ في المخفيّ */
    const after = document.createRange();
    after.setStart(tail, tail.nodeValue.length); after.collapse(true);
    sel.removeAllRanges(); sel.addRange(after);
    host.normalize();
    /* ===== ولفُّ الفراغ **تعديلٌ وقع** =====
       كان يُنادي ‎cdSaveSoon‎ وحدَها: تحفظ المتنَ ولا تقطع نسخة. فمن أخذ كلمةً من بطاقةٍ
       مستقرّةٍ ولفَّها بفراغٍ رأى متنَه قد تبدّل وختمَها يقول «مستقرّة» والحلقةَ ساكنة —
       ولا سبيل إلى إنزال ما فعل. والعلّةُ أنّ اليدَ ههنا لا تكتب حرفًا فلا يقع ‎input‎،
       فلا يمرّ الفعلُ بالبابِ الذي يقطع النسخ. فصار يمرّ به صراحةً */
    cdTouch();
    /* والشارةُ تُعاد بعدها: عددُ البطائق تبدّل بهذه الضغطة، و‎cdTouch‎ تحفظ ولا ترسمها */
    cdCntPaint();
  }
  /* ===== أداخلَ القوسين نحن؟ =====
     يُقرأ من النصّ الذي **قبل** المؤشّر: إن كان آخرُ ‎{{‎ فيه بعد آخرِ ‎}}‎ فنحن في جوف
     فراغٍ لم يُغلق بعد. حسابٌ خالصٌ على النصّ، لا بحثٌ في العقد ولا تخمين */
  function czInside() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return false;
    const r = sel.getRangeAt(0);
    const host = r.startContainer.parentElement && r.startContainer.parentElement.closest('.cd-in');
    if (!host) return false;
    const pre = document.createRange();
    pre.setStart(host, 0);
    pre.setEnd(r.startContainer, r.startOffset);
    const txt = pre.toString();
    return txt.lastIndexOf('{{') > txt.lastIndexOf('}}');
  }
  /* ===== زرُّ التلميح: حاضرٌ أبدًا، ويستيقظ في جوف الفراغ =====
     كان ينزلق فيظهر ويختفي، فكان الشريطُ يتبدّل عرضُه تحت اليد ولا يعرف المستخدمُ أنّ
     في النوع زرًّا ثانيًا أصلًا حتى يقع في القوسين مصادفةً. فصار **يُرى دائمًا** بجنب
     أخيه: خافتًا ما دام لا يعمل، ساطعًا إذا صار له معنًى.
     والخفوتُ خبرٌ لا حاجزٌ: الزرُّ يبقى يلتقط المؤشّر ليُقرأ تلميحُه ويُرى مؤشّرُ المنع —
     ولو رُفعت عنه الأحداثُ (‎pointer-events:none‎) لَصمَت عن سبب امتناعه، وذاك أسوأ من
     الامتناع. والضغطُ عليه خارجَ القوسين لا يفعل شيئًا أصلًا (حارسُ ‎czInside‎ في مستمعه)،
     فلا يُحتاج إلى منعٍ ثانٍ يُكتب هنا */
  function czTip() {
    const on = czInside();
    document.querySelectorAll('.cd-czt').forEach(b => {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-disabled', on ? 'false' : 'true');
      b.title = on ? T().czHint : T().czHintOff;
    });
  }
  document.addEventListener('selectionchange', () => { if (cardDlg) czTip(); });
  document.addEventListener('click', e => {
    if (!cardDlg || !e.target.closest) return;
    if (e.target.closest('.cd-czb')) { czWrap(false); czTip(); return; }
    if (e.target.closest('.cd-czn')) { czWrap(true); czTip(); return; }
    /* ‎::‎ يفصل النصَّ عن تلميحه — والتلميحُ يظهر في السؤال مكانَ المخفيّ (صيغةُ أنكي) */
    if (e.target.closest('.cd-czt')) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || !czInside()) return;
      const r = sel.getRangeAt(0);
      r.deleteContents();
      const t = document.createTextNode('::');
      r.insertNode(t);
      const after = document.createRange();
      after.setStart(t, t.nodeValue.length); after.collapse(true);
      sel.removeAllRanges(); sel.addRange(after);
      cdTouch();   /* والتلميحُ متنٌ كسائره: يُقطع له نسخة */
      return;
    }
  });
  /* ومختصرا أنكي نفسُهما، فمن جاء من هناك لم يتعلّم شيئًا جديدًا:
     ‎Ctrl+Shift+C‎ سؤالٌ جديد · ومعها ‎Alt‎ ضمٌّ إلى السؤال نفسِه */
  document.addEventListener('keydown', e => {
    if (!cdShellOn() || !cardDlg || !(e.ctrlKey || e.metaKey) || !e.shiftKey) return;
    if ((e.key || '').toLowerCase() !== 'c') return;
    if (cardDlg.kind === 'q' || cardDlg.ctype !== 'cloze') return;
    e.preventDefault();
    czWrap(!e.altKey); czTip();
  });
  function cdQBody(force) {
    const st = cdStage();
    if (!st || !cardDlg) return;
    const body = st.querySelector('.cd-body');
    if (!body) return;
    const isQ = cardDlg.kind === 'q';
    body.classList.toggle('is-q', isQ);
    const fields = body.querySelectorAll(':scope > .cd-field');
    const back = fields[1];
    /* ===== والظهرُ يغيب لسببين لا لواحد =====
       «المتعدّد» يُخفيه لأنّ جوابَه الخياراتُ، و«الإخفاء» يُخفيه لأنّه **وجهٌ بلا ظهر**
       أصلًا (‎ioBody‎ تُخفيه). وكانت هذه تكتب ‎isQ‎ وحدَه — فتردّه ظاهرًا لغير المتعدّد.
       ولم يظهر ما دامت تُنادى **قبل** ‎ioBody‎ في كلّ رسمة، فتُصلحه تلك بعدها.
       ثمّ نُوديت بعد الرسم (‎cdQBody(true)‎ في ‎openCardDlg‎) فلم يجئ بعدها من يُصلح —
       فطلع لبطاقة الإخفاء مستطيلٌ ثانٍ بترويسته وقفله، ولا ظهرَ لها.
       فتُسأل الحالُ لا يُعوَّل على الترتيب: ما لا ظهرَ له لا ظهرَ له من أيّ بابٍ نُودي */
    if (back) back.hidden = isQ || ioOn();
    let wrap = body.querySelector('.cd-chs');
    if (!isQ) { if (wrap) wrap.remove(); return; }
    const fresh = !wrap;
    if (fresh) {
      wrap = document.createElement('div');
      wrap.className = 'cd-chs';
      body.appendChild(wrap);
    }
    /* ولا تُبنى الخياراتُ من جديدٍ في كلّ رسم: ‎renderCardDlg‎ تُستدعى من عشرة أبواب
       (النشر · المروحة · المسار · الترس)، ولو أُعيد بناءُ الصناديق حينها لَقفز المؤشّرُ
       من تحت يدك في منتصف كلمة. فتُبذر مرّةً عند مولد الوعاء، ثمّ لا تُمسّ إلّا بطلبٍ
       صريح (‎force‎): تحميلُ بطاقةٍ أخرى أو مطالعةُ نسخةٍ مضت */
    if (fresh || force) {
      /* زرُّ الزيادة أيقونةٌ بلا كلمة: هو نتوءٌ جالسٌ على خيط «الرصيف» لا صندوقَ فيه نصّ،
         فاسمُه في ‎title‎/‎aria-label‎ — يبلغه الصوتُ والتلميحُ ولا يزاحم الخيارات حبرًا.
         والأيقونةُ في غلافٍ خاصّ: عليه يقع الحشوُ ولونُ النافذة فيُقطع الخيطُ تحتها */
      wrap.innerHTML = cdOptData().map(cdOptHTML).join('')
        + `<button type="button" class="cd-chadd" title="${esc(T().cdOptAdd)}" aria-label="${esc(T().cdOptAdd)}">`
        + `<span class="cd-chadd__ic">${FX_IC.plus}</span></button>`;
      cdMedPaint(wrap);
      /* وحارسٌ ثانٍ للترتيب: ‎cdOptHTML‎ تكتب القفلَ في مولدها، وهذا يردّه إن جاء البناءُ
         من بابٍ لا يعرف الحال. وهو رخيصٌ: لا يعمل إلّا في المقفلة */
      if (cardDlg.ro) cdRoApply();
    }
    const ar = (cardDlg.lang || 'ar') === 'ar';
    wrap.querySelectorAll('.cd-in').forEach(el => { el.dir = ar ? 'rtl' : 'ltr'; });
    /* وحلقةُ الخيار تتبع اللغةَ كما يتبعها اتّجاهُ الكتابة: النقطةُ حيث **يبدأ** السطر.
       وموضعُ تبديلها هنا لا في ‎cdOptHTML‎: الصناديقُ لا تُبنى في كلّ رسم (‎fresh || force‎
       وحدَهما) كي لا يقفز المؤشّر، فلو تُركت للبناء لَبقيت الحلقةُ على جهتها الأولى
       بعد قلب اللغة. والسِّمةُ ‎data-d‎ تمنع كتابةً لا تغيّر شيئًا في كلّ رسم */
    const optIc = ar ? CD_IC.optRtl : CD_IC.optLtr, optD = ar ? 'rtl' : 'ltr';
    wrap.querySelectorAll('.cd-chic').forEach(b => {
      if (b.dataset.d !== optD) { b.dataset.d = optD; b.innerHTML = optIc; }
    });
  }
  /* الكتابةُ في الخيارات كالكتابة في الحقلين: تمرّ بمستمع ‎.cd-in‎ العامّ فتُحفظ وحدها.
     وهذه لِما لا نصَّ فيه: زيادةُ خيارٍ وتحويلُ الصواب */
  document.addEventListener('click', e => {
    if (!cardDlg || !e.target.closest) return;
    /* والمقفلةُ لا تُزاد فيها خيارًا ولا يُحوَّل صوابُها: الجلدُ يُخفي الأزرار،
       وهذا يحرس ما لا يبلغه الجلد — لوحةُ المفاتيح تُنشّط زرًّا وإن لم يُرَ */
    if (cardDlg.ro) return;
    const add = e.target.closest('.cd-chadd');
    if (add) {
      const wrap = cdOptWrap();
      if (!wrap) return;
      add.insertAdjacentHTML('beforebegin', cdOptHTML({ t: '', ok: false }, cdOptEls().length));
      const last = cdOptEls().pop();
      if (last) {
        const inp = last.querySelector('.cd-in');
        inp.dir = (cardDlg.lang || 'ar') === 'ar' ? 'rtl' : 'ltr';
        inp.focus();
      }
      cdShade(); cdTouch();   /* خيارٌ يُزاد أو يُمحى تعديلٌ في المتن */
      return;
    }
    /* السلّة: تمحو الخيار وحدَه. ولو كان هو الصوابَ لم يخلُفه أحد — ‎n.ok‎ تصير ‎-1‎
       من ‎findIndex‎ نفسِها، فلا حارسَ يُكتب لها. والتركيزُ ينتقل إلى جارٍ فلا يسقط
       الجدولُ الذهبيّ في العدم ولا تُغلق يدُك على مربّعٍ لم يعد قائمًا */
    const del = e.target.closest('.cd-chdel');
    if (del) {
      const me = del.closest('.cd-ch');
      if (!me) return;
      const sibs = cdOptEls(), i = sibs.indexOf(me), nxt = sibs[i + 1] || sibs[i - 1] || null;
      me.remove();
      cdOptSync();
      if (nxt) { const inp = nxt.querySelector('.cd-in'); if (inp) inp.focus(); }
      cdShade(); cdTouch();   /* خيارٌ يُزاد أو يُمحى تعديلٌ في المتن */
      return;
    }
    /* بابٌ واحدٌ إلى الحكم: الشريطُ وحدَه. والحلقةُ لا تُقلب باللمس — كانت تفعل، فنُزعت:
       بابان إلى فعلٍ واحدٍ يفترقان يومًا، ولمسةٌ عابرةٌ على خبرٍ لا ينبغي أن تغيّر حالًا.
       والصوابُ واحدٌ لا غير (كأزرار المذياع)، فيُنزع عن الكلّ ثمّ يُوضع على هذا.
       ونقرةُ الخطأ على المختار ترفعه فيعود السؤالُ بلا حسم: لا يُحبَس المرءُ في اختيارٍ أخطأ فيه */
    const jd = e.target.closest('.cd-chok, .cd-chno');
    if (jd) {
      const me = jd.closest('.cd-ch');
      if (!me) return;
      const want = jd.classList.contains('cd-chok');
      cdOptEls().forEach(x => x.classList.remove('is-ok'));
      me.classList.toggle('is-ok', want);
      cdOptSync();
      cdTouch();   /* وتحويلُ الصواب من خيارٍ إلى خيار تعديلٌ كذلك */
    }
  });
  function cdCommit() {                      /* الحفظ التلقائيّ: ما في الحقلين ينزل في البطاقة */
    /* ===== ولا تُستدعى إلّا على محرّرٍ فيه حقلان =====
       كان الحارسُ ضِمنيًّا: «ورقةُ الملخّص لا عقدةَ لها فـ‎cdNode()‎ تردّ ‎null‎ فتُعطّل
       نفسَها». ثمّ جاءت نافذةُ الاختبار فنقضت الضمنيّ: هي **تكتب** ‎cardDlg.id‎ (في
       ‎renderXtDlg‎) لتُعرف بطاقتُها الجارية — فيُعرف ختمُها وتعليقاتُها ومَن عندها.
       فصار لها عقدةٌ ولا حقولَ لها، فبلغت ‎cdCommit‎ سطرَ ‎$('#cd-front').innerHTML‎
       وهو **‎null‎**، فانفجرت.
       وأثرُ الانفجار أنّ ما بعده لا يقع: ‎cdMinWin‎ تنادي ‎cdCommit‎ في أوّلها، فذهبت
       الطيّةُ كلُّها — فلا يعمل ‎−‎ ولا الضغطُ خارج النافذة **والاختبارُ جارٍ** (وفي
       الإعدادات يعمل، إذ لا بطاقةَ جاريةً فـ‎id‎ خاوٍ فيبقى الحارسُ الضمنيُّ صالحًا).
       فيُصرَّح الحارسُ بجنس النافذة لا بأثرٍ من آثاره: من ليس محرّرَ بطاقةٍ لا يُحفظ منه */
    /* ونافذةُ الاقتراح **محرّرُ بطاقةٍ حقًّا**: فيها الحقلان وتُكتب فيهما، وعقدتُها
       مؤقّتةٌ لا تسكن ديكًا — فالإيداعُ فيها آمنٌ ولازم، وبلا إيداعٍ يُرسَل نصٌّ قديم */
    if (cardDlg && cardDlg.what && cardDlg.what !== 'card' && cardDlg.what !== 'prop') return;
    const n = cdNode();
    if (!n) return;
    /* ===== لا يُكتب شيءٌ وأنت تطالع الماضي =====
       الحقلان حينئذٍ يعرضان نسخةً مضت لا ما في يدك. و‎cdCommit‎ تُستدعى من الإغلاق ومن
       سهمَي التنقّل ومن منتقي النوع ومن الحلقة — فلولا هذا الحارس لَكفى أن تطالع ١
       ثمّ تغلق النافذة حتى تُكتب ١ فوق مسوّدتك وتُحفظ. تذهب ساعةُ كتابةٍ بضغطة إغلاق */
    if (cardDlg.viewV) return;
    /* ===== ونافذةُ الوجه مقفلةٌ في الجذر لا في الواجهة =====
       متنُها **منقوصٌ بقصد**: فراغٌ واحدٌ بقوسيه وسائرُها مكشوف. فلو كُتب ما فيها
       في العقدة لَذهبت الفراغاتُ الأخرى كلُّها بضغطة إغلاق. والقلمُ مرفوعٌ عنها،
       لكنّ ‎cdCommit‎ تُستدعى من الإغلاق والتنقّل والنوع — فالحارسُ ههنا لا هناك */
    if (cardDlg.ro) return;
    /* وتبديلُ النوع أو اللغة تعديلٌ كتعديل النصّ: بطاقةٌ منشورة تصير من نوعٍ آخر
       وختمُها يقول «مستقرّة» — وهي لم تعد ما نُشر. والمقارنةُ بقيم العقدة **بعد التطبيع**
       (‎n.lang‎ قد يغيب في القديمة) وإلّا قطعت نسخةً بلا تعديلٍ وقع */
    /* ولا تُقطع نسخةٌ في عقدةٍ مؤقّتة: هي ليست بطاقةً منشورةً ولا سجلَّ لها، والقطعُ
       فيها يخلق تاريخًا لِما يُطرح بعد لحظات */
    if (cardDlg.what !== 'prop' && ((n.t || 'c') !== cardDlg.kind
      || (n.lang || cardDlg.lang) !== cardDlg.lang
      || (n.ctype || 'basic') !== cardDlg.ctype)) cdBump(n);
    /* و«الفراغ» يُردّ حرفُه إلى ‎c‎ ورقمُه إلى اللاتينيّة قبل الحفظ: المعروضُ ‎{{ف١::…}}‎
       والمخزونُ ‎{{c1::…}}‎ أبدًا — فيُقرأ الملفُّ في أنكي وفي اللغتين معًا */
    const czOn = cardDlg.kind !== 'q' && cardDlg.ctype === 'cloze';
    n.f = cdClean(czOn ? czStore($('#cd-front').innerHTML) : $('#cd-front').innerHTML);
    /* و«الإخفاء» يُلَمّ هنا: الصورةُ من الحقل والأقنعةُ من الحال، فيُكتبان في ‎n.f‎ واحدًا.
       والأقنعةُ لا تُقرأ من اللوح: اللوحُ عرضٌ، والأشكالُ هي المتن — ولو قُرئ العرضُ
       لَتحوّلت النسبةُ إلى بكسلٍ ثمّ إلى نسبةٍ في كلّ حفظةٍ فزحفت بالتقريب */
    if (cardDlg.kind !== 'q' && cardDlg.ctype === 'io') n.f += ioText();
    /* و«المتعدّد» ظهرُه خياراتُه مصفوفةً قائمةً، ورقمُ الصواب على حدة (‎-1‎ إن لم يُختر بعد).
       فالحقلان يبقيان حقلين، ويقرأ الملفُّ البطاقةَ كما كان يقرؤها */
    if (cardDlg.kind === 'q') {
      const opts = cdOptRead();
      n.b = opts.length ? '<ul>' + opts.map(o => `<li>${o.t}</li>`).join('') + '</ul>' : '';
      n.ok = opts.findIndex(o => o.ok);
    } else {
      n.b = cdClean(czOn ? czStore($('#cd-back').innerHTML) : $('#cd-back').innerHTML);
    }
    n.t = cardDlg.kind; n.lang = cardDlg.lang; n.ctype = cardDlg.ctype;
    save();
    /* وههنا موضعُ تجديد الاسم في الحافّة: هذه هي اللحظةُ الوحيدةُ التي يتبدّل فيها متنُ
       البطاقة، فلا يُسأل عنه في غيرها. ولسانٌ واحدٌ يُسأل لا الشريطُ كلُّه */
    cdMinFaceSync(cardDlg);
    /* والورقةُ تتبع الإيداعَ نفسَه لا حدثَ الكتابة: كان الحدثُ ‎input‎ وحدَه، فما لا قلمَ
       له لا يبلغها — قناعٌ يُجرّ في «الإخفاء» أو خيارٌ يُصوَّب في «المتعدّد» يُودَع في
       العقدة ولا يُكتب فيه حرف. وههنا مجتمعُ كلّ ما يُودَع، فههنا موضعُها.
       (وهي مُمهَلةٌ تقارن بصمتَها، فالنداءُ مع كلّ إيداعٍ لا يُكلّف رسمًا إلّا إن تبدّل ما يُرسم) */
    sheetLive();
    /* ولا صدى للأوجه ههنا: الإيداعُ التلقائيّ يقع بعد كلّ سكتةٍ في الكتابة، فلو تبعته
       الأوجهُ لَتبدّلت تحت يدك وأنت تكتب — وهو ما رُفض. موضعُه الحلقةُ لا القلم */
  }
  /* ============================================================
     صدى الأمّ في أوجهها: ما يُودَع في البطاقة ينزل في نوافذ وجوهها
     ============================================================
     نافذةُ الوجه معاينةٌ لعقدةٍ في الأمّ لا نسخةٌ عنها، فحقُّها أن تتبعها. وموضعُ
     الاتّباع **الحلقةُ** لا القلم ولا الإيداعُ التلقائيّ: تكتب في الأمّ فلا يتحرّك شيءٌ
     تحتها مهما طال، فإذا أنزلتَ النسخةَ الجديدة بالحلقة تبدّلت الوجوهُ من فورها.
     (وجُرّب أن يتبع الإيداعَ التلقائيّ — وهو يقع بعد كلّ سكتةٍ في الكتابة — فكانت الأوجهُ
      تتبدّل تحت اليد وأنت تكتب، فرُدّ. والنشرُ فعلٌ يُقصد، والكتابةُ تردّدٌ لا يُذاع)
     وحُكمُ الوجه الذي زال فراغُه: تنصرف نافذتُه. فهو لم يعد وجهًا — والمعاينةُ على
     ما لا وجود له نافذةٌ تعرض عدمًا. **ولا تنصرف إلّا بزوال رقمه**: تعديلُ متنه
     تعديلٌ يُرى فيها لا سببٌ لإغلاقها، وهو الفرقُ الذي طلبه صاحبُ الموقع.
     وإعطاءُ المعرّفات: الرسمُ يسأل بـ‎#cd-front‎ وأخواتِه، وهي على المركَّزة وحدَها.
     فتُنزع منها وتُعارُ لكلّ وجهٍ في دوره ثمّ تُردّ — إعارةٌ لا نسخ، فلا يجتمع
     اثنان على معرّفٍ لحظةً واحدة */
  function cdFacesEcho(n) {
    if (!n) return;
    /* والأمُّ محرِّرةٌ لا كلُّ حاملٍ للمعرّف: الاختبارُ يستعيره ولا يُعدّ أمًّا لأوجهها */
    const mom = cdWins.find(w => w.what === 'card' && !w.ro && w.id === n.id);
    const kids = cdWins.filter(w => w.ro && w.id === n.id);
    if (!mom && !kids.length) return;
    /* والحكمُ من ‎czKin‎: بطاقةٌ رجعت إلى وجهٍ واحد لم تعد عُصبةً، فينصرف وجهاها معًا */
    const live = new Set(czKin(n).map(f => f.k));
    kids.forEach(w => { if (!live.has(w.faceK)) cdCloseWin(w); });
    /* ===== وما جدّ من أوجهٍ ينزل لسانُه ههنا =====
       بطاقةُ فراغٍ نسختُها الأولى بفراغٍ واحد: لسانٌ مفردٌ لا عُصبةَ له. فإذا زدتَ فيها
       فراغًا ثانيًا لم يتبدّل شيءٌ في الحافّة — الكتابةُ ترجّحٌ لا إعلان. فإذا **أنزلتَها**
       صارت عُصبةً بهذه الضغطة: يلتحم لسانُها بلسان وجهها الجديد ويلبس القرصَ والحاجزَ،
       وينفتح إلى جانبه لسانُ الوجه الذي جدّ. وذلك في هذه اللحظة بعينها لا قبلها */
    if (mom) cdKinOpen(n, mom.pid);
    /* والمطويّةُ لا تُرسم: طبقتُها ‎hidden‎ فلا تُقاس، وتلحق ما فاتها عند نشرها */
    const stay = kids.filter(w => live.has(w.faceK) && !w.min && cdWins.indexOf(w) >= 0);
    if (stay.length) {
      const keep = cardDlg;
      if (keep) cdIdMove(keep.el, false);
      stay.forEach(w => {
        cardDlg = w;
        cdIdMove(w.el, true);
        cdFill(n.f, n.b);
        renderCardDlg();
        cdIdMove(w.el, false);
      });
      cardDlg = keep;
      if (keep) cdIdMove(keep.el, true);
    }
    /* والشريطُ يُصالَح آخرًا: ههنا يلتحم الصفُّ ويُوسَم رأسُه — ولا تُدعى المصالحةُ من
       تلقائها إذ لم تتبدّل بؤرةٌ ولا انصرفت نافذة، وإنّما تبدّلت **عضويّةُ عُصبة** */
    cdMinsSync();
  }
  /* ---- شارة الحفظ: مسوّدة (كُتب ولم يُحفظ) ⇐ يُرفع ⇐ محفوظ ثم تهدأ ----
     الحفظ في التخزين المحليّ لحظيّ، فلولا زمنٌ أدنى للعرض لَما رأى أحدٌ السحابة ترتفع */
  let cdT = 0, cdStT = 0, cdQuietT = 0;
  function cdSt(s) {
    if (cardDlg) cardDlg.st = s;   /* تُستعاد عند إعادة الرسم فلا تقفز الشارة إلى «محفوظ» */
    const el = $('#cd-st');
    if (!el) return;
    el.className = 'cd-st is-' + s;
    el.innerHTML = s === 'done' ? CD_IC.cloudOk : CD_IC.cloudUp;
    el.title = s === 'draft' ? T().cdStDraft : s === 'save' ? T().cdStSaving : T().cdStSaved;
    clearTimeout(cdQuietT);
    if (s === 'done') cdQuietT = setTimeout(() => el.classList.add('is-quiet'), 2000);
  }
  const cdSaveSoon = () => {
    cdSt('draft');
    clearTimeout(cdT);
    cdT = setTimeout(() => {
      cdSt('save'); cdCommit();
      clearTimeout(cdStT);
      cdStT = setTimeout(() => cdSt('done'), 450);   /* زمنٌ أدنى ليُرى الرفع */
    }, 400);
  };
  /* ============================================================
     ‎cdTouch‎ — «وقع تعديلٌ على هذه البطاقة»
     ============================================================
     كان هذا المنطقُ مكتوبًا في مستمع الكتابة وحدَه، فكان الحرفُ يقطع نسخةً ويُخرجك من
     المطالعة ويطوي كومةَ «مَن عندها»، بينما **تحريكُ قناعٍ أو تلوينُه أو محوُه** لا يفعل
     شيئًا من ذلك — يُحفظ ولا يُحسب تعديلًا. وهما تعديلان في بطاقةٍ واحدة: القناعُ متنُ
     بطاقة «الإخفاء» كما أنّ الحرفَ متنُ غيرها، فلا يفترقان في الحكم.
     فاستُخرج المنطقُ هنا ليمرّ منه البابان — والفرقُ الوحيدُ بينهما ما يُقرأ من الصفحة،
     وذاك شأنُ ‎cdCommit‎ لا شأنُ هذا.
     ولا يُنادى إلّا على **تعديلٍ وقع فعلًا**: فتحُ قائمةٍ أو اختيارُ قناعٍ ليس تعديلًا،
     ولو عُدّ كذلك لَقطعت نسختين لمن نظر ولم يفعل. */
  function cdTouch() {
    if (!cardDlg) return;
    const n = cdNode();
    /* والتعديلُ في نسخةٍ مضت يُخرجك منها في الحال: صار نصُّها نصَّك، وأنت في نسخةٍ جديدة.
       وتُصفَّر المطالعةُ **قبل** ‎cdBump‎ و‎cdCommit‎، وإلّا حرسَها الحارسُ فيهما فضاع ما فعلتَ */
    if (cardDlg.viewV) {
      const target = cardDlg.viewV, rec = cdRec(n, target);
      cardDlg.viewV = null;
      $('#cd-card').classList.remove('is-past');
      /* منشورةً تُقطع منها مسوّدةٌ جديدة، ومسوّدةً تُستأنف بعينها ولا رقمَ يُقطع */
      if (n && rec && rec.pub === false) { cdStow(n); n.v = target; n.pend = true; }
      else if (n) cdFork(n, rec);
      cdPaintRing(); cdPaintSeal();
    } else if (n && !n.pend) { cdBump(n); cdPaintRing(); cdPaintSeal(); }
    cdMetaShow();   /* أوّلُ تعديلٍ في بطاقةٍ خاوية يُظهر الترويسة */
    cdHereSync();   /* وأوّلُ تعديلٍ على مستقرّةٍ يطوي كومةَ «مَن عندها»: صارت مسوّدة */
    cdSaveSoon();
    /* التعديلُ في البطاقة تعديلٌ في المساهمة: يظهر الوضعُ والنشرُ في محرّرها خلف النافذة */
    cdCommit(); refreshEditActs();
  }
  function cdMake() {                        /* بندٌ فارغ جديد في الوجهة، يصير هو المعروض */
    /* ‎ct‎ ساعةُ ميلادها: نسختها الأولى قائمةٌ منذ هذه اللحظة وإن لم تُنشر بعد،
       فلا تُعرض «—» في مروحةٍ لبطاقةٍ صنعتَها قبل قليل */
    /* ‎v:1‎ — النزولُ في الملفّ هو النسخةُ الأولى، وهو **نشرُها**: ضغطةُ الحلقة أنزلتها
       ووصلت بها، فتستقرّ خضراءَ في الحال ولا تُطلب ضغطةٌ ثانية.
       (جُرّب ‎pend:true‎ فصار النزولُ لا يكفي وتحتاج ضغطتين لفعلٍ واحد — وهو ليس ما أُريد:
        الطلبُ كان لونَ الختم قبل النزول لا تغييرَ ما يفعله النزول) */
    const n = { id: newId(), t: cardDlg.kind || 'c', f: '', b: '', ct: Date.now(), v: 1,
      lang: cardDlg.lang, ctype: cardDlg.ctype };
    cdHost().push(n);
    cardDlg.id = n.id;
    (cardDlg.made = cardDlg.made || []).push(n.id);   /* لتُنظَّف إن بقيت فارغة عند الإغلاق */
    save();
    return n;
  }
  /* ============================================================
     الحافظة: انسخ · الصق · كرّر — صدَفةٌ واحدةٌ يسارَ الترس
     ============================================================
     ===== ما يُنقل متنٌ لا سِجلّ =====
     البطاقةُ عقدةٌ فيها متنُها (‎f/b/ok‎) وهيئتُها (‎t/ctype/lang‎)، وفيها ما ليس منها:
     هويّتُها ورقمُ نسختها وسجلُّها (‎hist‎) وتعليقاتُ قرّائها (‎cm‎) وساعةُ ميلادها.
     فالمنسوخُ الأوّلُ وحدَه: نسختُك الجديدةُ **بطاقةٌ جديدة** تقول ما قالته أختُها،
     لا استنساخًا لتاريخِ غيرها — ولو نُقل السجلُّ لَوجدتَ بطاقةً وُلدت اليومَ ولها
     اثنتا عشرة نسخةً وسبعةُ تعليقاتٍ على كلامٍ لم تقله.
     ===== واسمُها وأوجهُها لا تُنقل لأنّها لا تُخزَّن =====
     ‎cardName‎ تشتقّ الاسمَ من ‎f‎، و‎czKin‎ تشتقّ الأوجهَ من فراغاتها، و‎ioParse‎ تشتقّ
     الأقنعةَ من سطورها. فنقلُ المتن يُعيد البطاقةَ **بالضبط** بلا حقلٍ يُنسى.
     وصورُها كذلك: العنوانُ في المتن (‎data-mid‎ أو ‎../assets/cards/‎ أو ‎data:‎)، والمخزنُ
     مشترَك — فالنسختان تنظران إلى صورةٍ واحدةٍ ولا تُضاعَف بايتٌ واحد */
  function cdCardBody(n) {
    const c = { t: n.t === 'q' ? 'q' : 'c', f: n.f || '', b: n.b || '',
      ctype: n.ctype || 'basic', lang: n.lang || 'ar' };
    if (n.ok != null) c.ok = n.ok;
    return c;
  }
  /* والجديدةُ تنزل **بجنب أختها** لا في ذيل الملفّ: النسخُ فعلٌ موضعيٌّ، ومن كرّر بطاقةً
     في وسط ملفٍّ فيه مئةٌ لا يذهب يفتّش عنها في آخره. فإن لم تكن ثَمّ أختٌ (نافذةٌ لم
     تنزل بعد) فذيلُ الوجهة */
  function cdCardPut(body) {
    const host = cdHost();
    const node = Object.assign({ id: newId(), ct: Date.now(), v: 1 }, body);
    const i = cardDlg && cardDlg.id ? host.findIndex(x => x.id === cardDlg.id) : -1;
    if (i >= 0) host.splice(i + 1, 0, node); else host.push(node);
    save();
    return node;
  }
  /* ===== والحافظةُ في الحال المحفوظة لا في متغيّرٍ يعيش ما عاشت الصفحة =====
     تنسخ بطاقةً في مادّةٍ ثمّ تُغلق الصفحةَ ثمّ تعود لتلصقها في أخرى — وذلك أكثرُ ما
     يُقصد بالنسخ. وثمنُها عقدةٌ واحدةٌ في الدرج، وصورُها ليست فيها (عناوينُ لا بايتات) */
  function cdClipCopy() {
    cdCommit();                     /* آخرُ حرفٍ يُودَع قبل أن يُنسخ */
    const n = cdNode(); if (!n) return;
    state.cdClip = cdCardBody(n);
    save();
    cdClipSync();                   /* و«الصق» تستيقظ في النوافذ كلِّها */
    toast(T().cdCopied);
  }
  function cdClipPaste() {
    if (!state.cdClip) return;
    cdCommit();
    cdShow(cdCardPut(state.cdClip));
    edRender(); refreshEditActs();
    toast(T().cdPasted);
  }
  function cdClipDup() {
    cdCommit();
    const n = cdNode(); if (!n) return;
    cdShow(cdCardPut(cdCardBody(n)));
    edRender(); refreshEditActs();
    toast(T().cdDuped);
  }
  /* ===== و«الصق» تُوقَظ في موضعها لا بإعادة رسم =====
     النسخُ يقع والقلمُ في الحقل، وإعادةُ الرسم تُفقده موضعَه. وهي **في النوافذ كلِّها**
     لا في المركَّزة وحدَها: الحافظةُ واحدةٌ للموقع، فلا يصحّ أن تبقى مطفأةً في نافذةٍ
     أخرى حتى تُركَّز. ولذلك وُسمت بـ‎data-clip‎ لا بمعرّف: المعرّفاتُ تُعار للمركَّزة
     وحدَها (‎cdIdMove‎)، والسمةُ تبقى على كلّ نافذةٍ في مكانها */
  function cdClipSync() {
    const on = !!state.cdClip, lbl = on ? T().cdPaste : T().cdPasteNone;
    document.querySelectorAll('#card-modal .cd-cb[data-clip="paste"]').forEach(b => {
      b.disabled = !on; b.title = lbl; b.setAttribute('aria-label', lbl);
    });
  }
  /* ===== ولا تُعرض في نوافذ الأوجه =====
     نافذةُ الوجه معاينةٌ لفراغٍ في بطاقةٍ أخرى، ومتنُها **منقوصٌ بقصد** (فراغٌ واحدٌ
     مكشوفُ ما سواه). فنسخُها ينسخ ناقصًا، ولصقُها يكتب في بطاقةٍ ليست لها، وتكرارُها
     يُولد وجهًا بلا أمّ. والقلمُ مرفوعٌ عنها أصلًا (‎cardDlg.ro‎)، فهذه الثلاثةُ مثلُه */
  const cdClipHTML = () => {
    if (cardDlg.ro) return '';
    const has = !!cdNode(), clip = !!state.cdClip;
    const b = (act, ic, lbl, off) => `<button type="button" class="cd-cb" data-clip="${act}"${off ? ' disabled' : ''}
        title="${esc(lbl)}" aria-label="${esc(lbl)}">${ic}</button>`;
    /* والثلاثةُ في **جيبٍ** يُفتح بجِلد الترس نفسِه: صنفُ الشريط واحدٌ (‎cd-setw‎) فترثه
       الحبّةُ والانبساطُ والأسطرُ المتتابعة بلا سطرٍ يُكتب. و‎cd-clipw‎ أوّلُ أصنافه ليفترق
       مفتاحُه عن مفتاح الترس في آلة الانزلاق (تُفهرس الأبناءَ بأوّل أصنافها) */
    return `<span class="cd-clipw cd-setw${cardDlg.clip ? ' on' : ''}" id="cd-clipw">
        <button type="button" class="cd-dh cd-pk" id="cd-pk"
          title="${esc(T().cdPocket)}" aria-expanded="${cardDlg.clip ? 'true' : 'false'}">${CD_IC.pocket}</button>
        <span class="cd-setin">
          <span class="cd-setrow" style="--i:0">${b('copy', CD_IC.copy, T().cdCopy, !has)}</span>
          <span class="cd-setrow" style="--i:1">${b('paste', CD_IC.paste, clip ? T().cdPaste : T().cdPasteNone, !clip)}</span>
          <span class="cd-setrow" style="--i:2">${b('dup', CD_IC.dup, T().cdDup, !has)}</span>
        </span></span>`;
  };
  function cdShow(n) {                       /* تحميل بطاقة في الحقلين */
    /* المطالعةُ خاصّةٌ بالبطاقة التي فُتحت لها: لو بقيت عند الانتقال بالسهمين لَنزلت البطاقةُ
       التالية مقفلةَ القلم، وفوقها شريطٌ يذكر رقم نسخةٍ ليست نسختها */
    cardDlg.viewV = null;
    /* والفقاعةُ خبرُ **هذه** البطاقة: تُطوى مع مسوّدة ردّها عند الانتقال إلى غيرها،
       وإلّا بقي في يدك ردٌّ يُكتب في تعليقٍ على بطاقةٍ غادرتَها */
    cardDlg.cmt = false; cardDlg.cmtDraft = '';
    cardDlg.cmtRe = null; cardDlg.cmtReDraft = ''; cardDlg.cmtThread = null;
    cardDlg.id = n.id;
    cardDlg.kind = n.t === 'q' ? 'q' : 'c';
    cardDlg.lang = n.lang || cardDlg.lang;
    cardDlg.ctype = n.ctype || 'basic';
    cdFill(n.f, n.b);
    cdRange = null;
    renderCardDlg();
    cdQBody(true);   /* بطاقةٌ أخرى ⇐ خياراتٌ أخرى: يُطلب البناءُ صراحةً */
    setTimeout(() => $('#cd-front').focus(), 20);
  }
  function cdGo(d) {
    cdCommit();
    const list = cdCards(), p = cdPos(), j = p.i + d;
    if (p.i < 0 || j < 0 || j >= list.length) return;
    cdShow(list[j]);
  }
  function cdNew() { cdCommit(); cdShow(cdMake()); cdEdDraw(); }
  /* شريط التنقّل: [سهم يمين] الموضع [سهم يسار] وتحتها زرّ بطاقة جديدة.
     السهمان يخبوان ما دامت البطاقة وحدها */
  function cdNavHTML() {
    const p = cdPos(), one = p.n < 2;
    const arw = (d, ic, lbl) => `<button type="button" class="cd-arw" data-cdgo="${d}"
        title="${lbl}" aria-label="${lbl}"${(one || p.i + d < 0 || p.i + d >= p.n) ? ' disabled' : ''}>${ic}</button>`;
    return `<span class="cd-navrow">
        ${arw(-1, CD_IC.prev, T().cdPrev)}
        <i class="cd-pos">${Math.max(p.i, 0) + 1} / ${p.n || 1}</i>
        ${arw(1, CD_IC.next, T().cdNext)}
      </span>
      <button type="button" class="cd-add" id="cd-add" title="${T().cdNewCard}" aria-label="${T().cdNewCard}">+</button>`;
  }
  /* ===== منتقي النوع: دُرجٌ علويّ =====
     البطائق الأربع مصفوفةٌ جنبًا إلى جنب في الدُّرج، لكلٍّ أيقونتُها واسمُها.
     ولا حركةَ لها: هي ثابتةٌ في الدُّرج تنزل بنزوله وتصعد بصعوده، لا تُفرَش واحدةً بعد أخرى.
     الصنف ‎cd-kb‎ يبقى عليها: مستمعُ الاختيار يمسك به، و‎data-ck‎ مزدوج المعنى في الموقع
     (يُستعمل أيضًا لفتح الرزم) فالصنفُ هو الفاصل بينهما — لا يُنزع */
  const cdTypesHTML = () => CD_KINDS.map(([k, ic]) => {
    const lb = esc(T().cdKinds[k]);
    return `<button type="button" class="cd-kb cd-tc" data-ck="${k}"
       title="${lb}" aria-label="${lb}">${ic()}<b>${lb}</b></button>`;
  }).join('');
  /* ===== أخبار البطاقة =====
     مصدرٌ واحد لما تعرضه الترويستان. والموقع لا يملك بعدُ نظامَ نسخٍ ولا عدّادَ زيارات،
     فالأرقام أصفارٌ صادقة تُقال بالكلام لا تُعرض أصفارًا — وحين يوجد المصدر يُوصَل هنا وحده */
  /* ============================================================
     مَن عندها الآن — حضورٌ يُقاس لا رقمٌ يُكتب
     ============================================================
     كان ‎live‎ صفرًا مكتوبًا: لا مصدرَ له. وهذا مصدرُه.
     ===== ما الذي يُقاس بصدق في موقعٍ بلا خادم؟ =====
     لا شبكةَ ولا خادمَ ولا مستخدمين آخرين — فادّعاءُ «ثلاثةٌ يقرؤونها في العالم» كذبٌ
     مرسوم. والذي يقع حقًّا ويمكن قياسُه: **نوافذُ القراءة المفتوحةُ على هذه البطاقة**،
     في هذا التبويب وفي كلّ تبويبٍ آخر يفتح الموقع. وذاك حضورٌ صحيحٌ بمعناه: من فتح
     الموقعَ في تبويبين وقرأ البطاقةَ فيهما فهما اتّصالان اثنان.
     والدرجُ مشتركٌ بين تبويبات ‎file://‎ كلِّها، فيصلح مِلتقًى بلا خادم — وحدثُ
     ‎storage‎ يوقظ الآخرين حين يتبدّل.
     ===== ولماذا يُبنى مخزنٌ مستقلّ لا حقلٌ في الحال؟ =====
     ثلاثةٌ: النبضُ يُكتب كلَّ ثوانٍ، والحالُ الكبرى تُكتب كاملةً في كلّ حفظة — فكتابتُها
     ستّين مرّةً في الدقيقة عبثٌ ثقيل. وامتلاءُ الدرج خطرٌ قائمٌ في هذا الأصل المشترك،
     فلا يُزاد على المخزن الكبير ما ينمو بلا سقف. وحضورُ اللحظة **ليس بيانًا يُحفظ**:
     من أغلق متصفّحَه لم يبقَ حاضرًا، فبقاؤه في الحال المحفوظة كذبٌ ينتظر أن يُقرأ.
     ===== والمحرِّرُ لا يُعدّ من القرّاء =====
     من يكتب البطاقةَ ليس «عندها» بمعنى القراءة، فنافذةُ التحرير لا تُسجّل نفسَها —
     ولذلك يصحّ الصفرُ هناك. وأمّا نافذةُ القراءة (معاينةُ وجهٍ أو سؤالُ اختبارٍ جارٍ)
     فتُسجّل، فيستحيل أن تقرأ بطاقةً ويُقال لك «لا أحد» — فأنت أحد */
  const LIVE_KEY = 'academia2:live:v1';
  const LIVE_TTL = 25000;    /* ما مضى على نبضته أكثرُ من ذلك فقد انقطع صاحبُه */
  const LIVE_BEAT = 8000;    /* والنبضةُ أسرعُ من المهلة بثلاث: نبضتان تضيعان ولا يسقط */
  const LIVE_ME = 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  let liveLast = '';
  const liveRead = () => { try { const j = JSON.parse(localStorage.getItem(LIVE_KEY)); return (j && typeof j === 'object') ? j : {}; } catch (e) { return {}; } };
  /* والكنسُ يقع عند كلّ قراءة: لا حارسَ يمرّ على الدرج، فمن قرأ فليُنظّف */
  function livePrune(m) {
    const now = Date.now();
    Object.keys(m).forEach(cid => {
      const t = m[cid] || {};
      Object.keys(t).forEach(k => { if (now - t[k] > LIVE_TTL) delete t[k]; });
      if (!Object.keys(t).length) delete m[cid];
    });
    return m;
  }
  /* والعددُ حقيقةٌ لا زينة: كانت ههنا ‎LIVE_FAKE‎ تزيد خمسةً وهميّين على كلّ بطاقةٍ
     عندها قارئ، لتُجرَّب الكومةُ والشارةُ بعددٍ لا يقع في موقعٍ بلا خادم. ورُفعت قبل
     النشر: رقمٌ يراه الناسُ يجب أن يكون صادقًا */
  const liveCount = cid => cid ? Object.keys(livePrune(liveRead())[cid] || {}).length : 0;
  /* وأهُم أنا فيهم؟ يُعرف بالبادئة لا بالعدد: قد يكون عندها ثلاثةٌ ولستُ منهم */
  const liveHasMe = cid => !!cid && Object.keys(livePrune(liveRead())[cid] || {})
    .some(k => k.indexOf(LIVE_ME + ':') === 0);
  /* نوافذُ القراءة المفتوحةُ عندي الآن — والمطويّةُ ليست قراءةً */
  const liveMine = () => cdWins.filter(w => !w.min && w.id && (w.ro || w.what === 'exam'))
    .map(w => ({ cid: w.id, key: LIVE_ME + ':' + w.uid }));
  function liveSync(force) {
    const mine = liveMine();
    const sig = mine.map(x => x.cid + '|' + x.key).sort().join(',');
    /* ولا يُكتب الدرجُ إلّا إذا تبدّلت العضويّةُ أو حان النبض: الرسمُ يقع كثيرًا */
    if (!force && sig === liveLast) return;
    liveLast = sig;
    const m = livePrune(liveRead()), now = Date.now(), keep = new Set(mine.map(x => x.cid + '|' + x.key));
    Object.keys(m).forEach(cid => {
      Object.keys(m[cid]).forEach(k => {
        if (k.indexOf(LIVE_ME + ':') === 0 && !keep.has(cid + '|' + k)) delete m[cid][k];
      });
      if (!Object.keys(m[cid]).length) delete m[cid];
    });
    mine.forEach(x => { (m[x.cid] = m[x.cid] || {})[x.key] = now; });
    try { localStorage.setItem(LIVE_KEY, JSON.stringify(m)); } catch (e) {}
  }
  /* ===== وما الذي يُطوى قبل جوابك؟ كومةُ المجيبين =====
     الكومةُ في نافذة الاختبار **لا تعدّ الحاضرين وإنّما المجيبين**: كلّ حبّةٍ فيها
     رجلٌ أجاب عن هذا السؤال، والشارةُ عددُ الأجوبة كلِّها. فهي خبرٌ عن السؤال لا
     عن الغرفة (انظر ‎cdHereHTML‎ ووضعَ ‎ans‎).
     وهذا الخبرُ **يُميل يدَك لو قُرئ قبل أن تُجيب** — كثرةُ المجيبين إيحاءٌ لا خبرٌ
     نافع. فيُطوى: لا تبقى إلّا حبّتُك تموج وحدَها. فإذا خرج الجوابُ انكشف الباقون
     من خلفها (‎here-reveal-lab#ن‎).
     ===== و«خرج الجوابُ» حدٌّ واحدٌ لا اثنان =====
     هو الحدُّ الذي تستيقظ عنده حِلْيةُ الترويسة نفسُه: في «المتعدّد» لا يُعرف الصوابُ
     إلّا بالحكم (‎pick‎ خياراتٌ ظهرت والامتحانُ قائم)، وفي غيره يكفي طورُ الكشف.
     فيُكتب مرّةً ويُقرأ في الموضعين، وإلّا افترق ما يجب أن يقع معًا */
  /* ===== وانكشافُ الحِلْية: مِناطُه خروجُ الجواب لا نوعُ البطاقة =====
     كان يُستثنى المتعدّد من فرع ‎show‎ (‎u.k !== 'q'‎) لأنّه لم يكن يبلغها إلّا محكومًا
     له — فيكفيه ‎R.judged‎. ثمّ صار يُكشف بلا اختيار (‎ask/pick ← show‎)، فبقي
     الاستثناءُ يمنع عنه ما لغيره: تبقى الترويسةُ والذيلُ مطفأَين والجوابُ أمامك.
     و‎show‎ في الأنواع كلِّها معناها واحد: **الجوابُ خرج**. فهي المِناط وحدَها */
  const xtOpened = () => {
    const R = xtRun, u = R && xtCur();
    return !!(u && (R.judged || R.phase === 'show'));
  };
  const cdAnsHide = () => !!(cardDlg && cardDlg.what === 'exam' && xtMode === 'run') && !xtOpened();
  /* ===== وأرقامُ الكومة تتبع النافذة =====
     نافذةُ الاختبار ⇐ الأجوبةُ (صوابُها وخطؤها)، وما سواها ⇐ الحضورُ الحيّ.
     فمصدرُ الرقم يُقرَّر ههنا وحدَه، ويُستدعى من الرسم الكامل ومن النبضة جميعًا */
  const cdHereArgs = () => {
    if (cardDlg && cardDlg.what === 'exam') {
      const f = cdFacts();
      return [cxAnsSum(f), { ans: true, rev: !cdAnsHide() }];
    }
    return [liveCount(cardDlg && cardDlg.id), null];
  };
  /* والرسمُ الخفيف: الكومةُ وحدَها تُعاد، فلا يُهدم ما تحت العين */
  function cdPaintHere() {
    const st = cdStage(); if (!st) return;
    const el = st.querySelector('.cd-here');
    if (!el || !cardDlg) return;
    const a = cdHereArgs(), html = cdHereHTML(a[0], a[1]);
    /* ولا يُهدم ما لم يتبدّل: الهدمُ يقطع الموجةَ ويعيدها من أوّلها.
       والبصمةُ تُقرأ من المرسوم نفسِه، فلا يُحسب الحالُ مرّتين بحسابين قد يفترقان */
    const m = /data-sig="([^"]*)"/.exec(html);
    if (m && el.dataset.sig === m[1]) return;
    el.outerHTML = html;
  }
  setInterval(() => { liveSync(true); cdPaintHere(); }, LIVE_BEAT);
  /* وتبويبٌ آخرُ تبدّل حضورُه ⇐ تُعاد كومتي وحدَها */
  window.addEventListener('storage', e => { if (e.key === LIVE_KEY) cdPaintHere(); });
  /* والمغادرةُ تُعلَن: من أغلق التبويب رُفعت نبضاتُه فورًا ولا يُنتظر لها مهلة */
  window.addEventListener('pagehide', () => {
    const m = livePrune(liveRead());
    Object.keys(m).forEach(cid => {
      Object.keys(m[cid]).forEach(k => { if (k.indexOf(LIVE_ME + ':') === 0) delete m[cid][k]; });
      if (!Object.keys(m[cid]).length) delete m[cid];
    });
    try { localStorage.setItem(LIVE_KEY, JSON.stringify(m)); } catch (e) {}
  });

  function cdFacts() {
    const n = cdNode();
    const ans = cxAnsOf(n, cdFaceWin() ? cdFaceK() : null);
    return {
      who: T().cdMe, ini: (T().cdMe || 'أ').trim().charAt(0),
      /* ورقمُ الختم في نافذة القارئ رقمُ **المنشورة** لا رقمُ ما في يد صاحبها:
         كانت تقول «نسخة ٢» عن مسوّدةٍ لم تنزل، فتَعِد بنصٍّ ليس بين يدي قارئها */
      v: cdRoView() ? (cdPubV(n) || 1) : ((n && n.v) || 1),
      newest: (n && n.newest) || (n && n.v) || 1,
      /* «هنا» تعدّ من يذاكرها الآن — والمحرِّر ليس منهم، فهي صفرٌ ما لم يفتحها أحد */
      /* والتعليقاتُ وحدَها لها مصدرٌ اليوم: ‎n.cm‎ على العقدة نفسِها — كما ‎n.hist‎ سواءً بسواء.
         وعددُها **عددُ تعليقات الوجه** لا العقدة: ‎cdCmts‎ تُصفّي بالوسم.
         و‎seen‎ لا مصدرَ له بعدُ (لا عدّادَ زياراتٍ في الموقع)، فهو صفرٌ صادق. ويومَ يُبنى
         فليُعَدَّ **لكلّ وجهٍ على حدة** كما صارت التعليقات — فالنظرُ يقع على وجهٍ بعينه */
      live: liveCount(cardDlg.id), seen: 0, cm: cdCmts(n).length,
      /* ‎warn‎ = كم قارئًا رفع «الصَّيحة» على هذه البطاقة: «هنا معلومةٌ قد تكون خاطئة».
         ووُصل يومَ بُني زرُّها (‎cdWarns‎) — كما قيل ههنا: «يومَ يُبنى الزرُّ يُوصَل هنا
         وحدَه، فتتلوّن الشارةُ من نفسها بلا سطرٍ يُضاف في الرسم». وقد كان.
         وهو عددُ **البطاقة** لا الوجه: الصَّيحةُ تسكن كعبَ الختم، والختمُ خبرٌ عن النسخة */
      warn: cdWarns(n).length,
      /* ‎props‎ = كم اقتراحَ تعديلٍ **وارد**: من نزّل بطاقتك عدّلها عنده وعرضها عليك.
         ووُصل يومَ بُني مخزنُه — كما قيل ههنا: «يومَ تُبنى يُوصَل هنا وحدَه، فيستيقظ
         الزرُّ من نفسه: يُرفع عنه ‎disabled‎ ويتذهّب عددُه بلا سطرٍ يُضاف في الرسم».
         والمخزنُ ‎n.pr‎ على **الأصل** (‎prTarget‎) لا على نسختك في مسارك */
      props: prCount(n),
      /* ‎dl‎ = كم قارئًا أخذ البطاقةَ إلى ركنه. ولا فعلَ «خذها» في الموقع أصلًا (رُفع في
         «تحوّل الرزم»)، فالرقمُ فرعٌ على أصلٍ لم يُبنَ — وصفرٌ صادقٌ حتى يُبنى */
      dl: 0,
      /* ===== وحكمُ الجواب مخزنُه ‎n.a‎ وقارئُه ‎cxAnsOf‎ =====
         كاتبٌ واحدٌ (‎cxAns‎ مع كلّ حكمٍ في الاختبار والمذاكرة، بلا شرط) وقارئٌ واحدٌ
         يقرؤه هنا وفي صفّ الشجرة سواءً. والقسمةُ قسمةُ التعليقات حرفًا: في القراءة
         جيبُ الوجه المعروض، وفي التحرير مجموعُ البطاقة.
         وهو **خبرُ الناس** لا خبرُك: مربّعُ الشجرة (‎cx-me‎ من ‎state.fa‎/‎state.srs‎)
         حكمُك أنت وحدَك، وهذان بدَنان يقولان ما جاء البطاقةَ من الأجوبة كلِّها.
         فافتراقُ الرقمين ليس عطبًا — وقد كانا يفترقان بعمر المخزن قبل «بذرةِ حكم
         الجواب» (‎ansSeed‎ في أوّل الملفّ)، فصارا يفترقان بمعناهما وحدَه */
      ok: ans.ok, no: ans.no,
    };
  }
  /* صندوق النسخة: «الحالية» فوق و«الأحدث» تحتها، ثمّ طوقٌ فيه سهمُ ترقيةٍ إن وُجد أحدث،
     وإلّا صحٌّ رماديٌّ باهت يقول «أنت على الأحدث» — لا سهمًا يَعِد بفعلٍ لا يقع */
  /* ===== «٣ هنا» — منقولٌ عن الاتجاه «هـ · الموجة» في here-count-lab =====
     كومةُ دوائر متراكبة يمرّ بها طورٌ متدرّج فتُقرأ موجةً واحدة لا اهتزازًا عشوائيًّا،
     ودائرتُك أوّلها بطوقٍ ذهبيّ. والحركة تُلغى كلّيًّا لمن يطلب تقليلها */
  const CD_HUES = ['#3f7f86', '#6b8f5e', '#a8724e', '#4a6b96', '#a08a4a', '#7a6392'];
  /* العدد لمن يذاكرها الآن لا لمن يحرّرها: أنت في المحرّر فلا دائرةَ لك في الكومة.
     وإذا لم يكن أحدٌ فلا كومةَ أصلًا — «٠ هنا» رقمٌ وحده، لا صورةَ لغائب */
  /* ===== الكومةُ: وجوهٌ ثمّ شارةٌ تحمل العدد (‎here-place-lab‎) =====
     · **الحاضرون ثلاثةٌ لا أربعة**، وما زاد فليس له وجهٌ يُرسم.
     · **والشارةُ ‎+N‎ جسمٌ دائمٌ تحمل العددَ الكلّيّ**، لا مؤشّرَ فيضٍ يولد حين يجاوز
       العددُ ما رُسم ويموت حين لا يجاوزه. وذاك كان يُفقد الكتلةَ عضوًا فتنكمش، ويجعل
       ما تقوله يتبدّل من عددٍ إلى عدد. وههنا خبرٌ واحدٌ في الأحوال كلِّها.
     · **والرقمُ الخارجُ ذهب من الحاضرين**: الشارةُ تقوله وهي في الكومة، فلا يُقال
       مرّتين. ويبقى في الصفر وحدَه — إذ لا شارةَ هناك ولا وجهَ، فلولاه لم يبقَ خبر.
     · **والصفرُ لا شارةَ له**: ‎+0‎ عددٌ يُعلن العدم، والخاوياتُ المرقّطةُ تقوله صورةً.
     ===== والمقاديرُ في الجِلد والحالُ ههنا =====
     ‎data-hn‎ يقول أيُّ حالٍ هذه (‎0 · 1 · 2 · 3‎ فأكثر) ويقرأ الجِلدُ منها بُعدَ الكتلة
     وقدَّ الخاوية وتراكبَها. فلا يُبثّ رقمُ معايرةٍ في مولّد المرقاة */
  /* ===== وللكومة وجهان: حضورٌ وأجوبة =====
     ‎opt.ans‎ يقلبها من «مَن عندها الآن» إلى «مَن أجاب عنه»: الحبّةُ رجلٌ أجاب،
     والشارةُ عددُ الأجوبة. وحبّتي أوّلُها في الحالين — وهي في وضع الأجوبة **جوابي
     أنا** بعد أن أحكم (‎cxAns‎ تزيده في ‎n.a‎ فيدخل العدَّ من نفسِه).
     ‎opt.rev‎ يقول: أخرج الجوابُ؟ فإن لم يخرج طُويت الحبّاتُ والشارةُ ولم تبقَ إلّا
     حبّتي (‎cdAnsHide‎)، والجِلدُ هو الذي يطويها ويكشفها لا الشِّفرة — فالانكشافُ
     حركةٌ على عنصرٍ قائمٍ لا بناءٌ جديد.
     ===== ولمَ غلافٌ ‎.cd-ccw‎ حول الحبّة؟ =====
     لأنّ الموجةَ على ‎.cd-cc‎ لا نهايةَ لها، وهي آخرُ قائمة ‎animation‎ فتحكم
     ‎transform‎. فلو وُضع الكشفُ عليها بطل في صمت (درسُ ‎here-reveal-lab‎ الأوّل).
     فالموجةُ على الحبّة والكشفُ على غلافها، فلا يتنازعان */
  function cdHereHTML(n, opt) {
    const o = opt || {};
    const AV = 3, PH = 4, out = [];
    /* الطبقةُ تنزل مع كلّ حبّةٍ فتنزلق التاليةُ تحت سابقتها، والطورُ يتدرّج فتُقرأ موجةً */
    let k = 0;
    const lay = () => { const i = k++; return `z-index:${9 - i};--dly:${(i * .22).toFixed(2)}s`; };
    /* ===== وحبّتي أنا صورتي لا لونًا =====
       الحبّاتُ ألوانٌ لأنّ أصحابَها مجهولون: لا صورَ لهم ولا أسماء. وأنا معلومٌ لي —
       فصورتي في الشريط الجانبيّ هي أنا، ولونٌ مكاني يُقرأ «أحدُهم» وأنا لستُ أحدَهم.
       وهي **أوّلُ الكومة** لأنّها الأقربُ إلى القارئ (الطبقاتُ تنزل، فالأولى فوق).
       وإن لم تكن لي صورةٌ بعدُ فحرفُ اسمي على أرضيّة الهويّة — أصدقُ من لونٍ مجهول،
       وأقلُّ ادّعاءً من صورةٍ ليست لي */
    const me = o.ans ? true : liveHasMe(cardDlg && cardDlg.id);
    const meImg = state.profile.img || '';
    const meHTML = () => `<span class="cd-cc cd-cc--me" style="${lay()}">${meImg
      ? `<img src="${esc(meImg)}" alt="">`
      : esc((T().cdMe || 'أ').trim().charAt(0))}</span>`;
    if (o.ans) {
      /* وضعُ الأجوبة: حبّتي ثابتةٌ لا تُطوى، ثمّ أجوبةُ غيري في أغلفةٍ تُكشف.
         و‎--back‎ يحملهم إلى موضع حبّتي فيخرجون من خلفها، بإشارةِ اتّجاه الصفحة —
         فالخروجُ من خلف الأخت يصحّ في اللغتين بقاعدةٍ واحدة */
      const sgn = getComputedStyle(document.documentElement).direction === 'rtl' ? 1 : -1;
      out.push(meHTML());
      /* ===== وعددُ الحبّات لا يتبدّل بين الطورين =====
         الصندوقُ محجوزٌ في الطيّ (‎visibility‎)، فلو اختلف عددُ الحبّات بين طور السؤال
         وطور الكشف لَتبدّل عرضُ الكومة فانتقل محورُها ‎cdHereFit‎ — فقفزت حبّتي، وهي
         المصدرُ الذي يخرجون من خلفه.
         وجوابي أنا يدخل العدَّ **بالحكم لا بالكشف**: ‎cxAns‎ تكتبه عند ‎judged‎، وفي
         «الفراغ» و«الإخفاء» يخرج الجوابُ قبل أن تحكم. فلو قِيس بالكشف لَحُسبتُ مرّتين
         في تلك اللحظة فنقصت حبّةٌ من الصفّ. فيُقاس بالحكم وحدَه.
         والشارةُ تُرسم دائمًا ولو كان العددُ صفرًا: هي في الطيّ خانةٌ محجوزةٌ لا تُرى،
         ولو نشأت عند الكشف لَدفعت الكومةَ عن محورها في اللحظة نفسِها */
      const mine = (xtRun && xtRun.judged) ? 1 : 0;
      const others = Math.max(0, n - mine);
      for (let i = 1; i < Math.min(others + 1, AV); i++) {
        const w = `z-index:${9 - i};--dly2:${(i * .05).toFixed(2)}s;--back:${i * 15 * sgn}px`;
        out.push(`<i class="cd-ccw" style="${w}"><span class="cd-cc" style="background:${
          CD_HUES[i % CD_HUES.length]};--dly:${(i * .22).toFixed(2)}s"></span></i>`);
      }
      out.push(`<span class="cd-cc cd-cc--more">+${n}</span>`);
      return `<span class="cd-here cd-here--ans${o.rev ? ' is-rev' : ''}" data-hn="${
        Math.min(others + 1, 3)}" data-sig="a${n}|${mine}|${o.rev ? 1 : 0}"
        title="${esc(T().cdAnsWho)}"><span class="cd-here__pile">${out.join('')}</span></span>`;
    }
    for (let i = 0; i < Math.min(n, AV); i++) {
      if (i === 0 && me) { out.push(meHTML()); continue; }
      out.push(`<span class="cd-cc" style="background:${CD_HUES[i % CD_HUES.length]};${lay()}"></span>`);
    }
    /* لا أحدَ بعد: خاوياتٌ مرقّطةٌ تموج موجتها — مكانٌ محجوزٌ ينتظر أهله،
       أخفُّ من فراغٍ مطلق وأصدقُ من صورةٍ لغائب */
    if (!n) for (let i = 0; i < PH; i++) {
      out.push(`<span class="cd-cc cd-cc--ph" style="${lay()}"></span>`);
    }
    /* والشارةُ في طرف الكومة من جهة القراءة — بلا طبقةٍ مكتوبة، فتقع تحت الجميع */
    if (n) out.push(`<span class="cd-cc cd-cc--more">+${n}</span>`);
    /* ===== وبصمةُ الحال على الكومة =====
       الموجةُ حركةٌ لا نهاية لها، ومفاتيحُها متّصلةٌ (‎0%‎ و‎100%‎ كلاهما صفر) — فلا تُرى
       لها بدايةٌ ولا منتهى ما دام العنصرُ قائمًا. لكنّ **إعادةَ بنائه تُصفّرها**: العنصرُ
       الجديدُ يبتدئ الحركةَ من أوّلها، فتقفز الحبّاتُ إلى مواضعِ البدء أينما كانت.
       والنبضةُ تُعيد الرسمَ كلَّ ثمانٍ، فتُرى القفزةُ دوريّةً كأنّ الحركةَ لا تُغلق دورتَها.
       فتُكتب بصمةُ الحال (العددُ وأفيهم أنا) ويُقاس عليها قبل الهدم: ما لم يتبدّل
       شيءٌ لا يُهدم شيء، فتمضي الموجةُ متّصلةً ما دامت الحالُ واحدة */
    return `<span class="cd-here" data-hn="${Math.min(n, 3)}" data-sig="${n}|${me ? 1 : 0}" title="${esc(T().cdHereTtl)}">
        <span class="cd-here__pile">${out.join('')}</span>
        ${n ? '' : `<span class="cd-here__n" style="--dly:${(k * .22).toFixed(2)}s"
          ><b>${n}</b><span>${T().cdHere}</span></span>`}
      </span>`;
  }
  /* رقم النسخة بمنزلةٍ عشريّة دائمًا: ‎1.0‎ لا ‎1‎ — فيبقى عرضُه ثابتًا ويُقرأ إصدارًا لا عدًّا */
  const verNum = v => Number(v || 1).toFixed(1);
  /* ختمُ النسخة — منقولٌ عن «د · الختم» في ‎version-signal-lab‎ بمقاساته وألوانه:
     مربّعٌ مزدوج الطوق مائلٌ قليلًا يقول «هذه نسختي»، بخطّ الهويّة وأرقامٍ جدوليّة.
     وحين تصدر نسخةٌ أحدث يبهتُ رماديًّا كورقةٍ قديمة — فالقِدَم يُرى قِدَمًا */
  /* ===== نسخُ البطاقة كما وقعت =====
     كلّ نشرةٍ تُسجَّل لحظةَ وقوعها في ‎n.hist‎. والبطاقة التي نُشرت قبل أن يُسجَّل التاريخ
     لا تُظهر إلا نسختها الحاليّة — لا يُخترع لها ماضٍ لم يُحفظ */
