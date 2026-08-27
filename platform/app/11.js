  /* ============================================================
     دوائر المساهمين على أزرار التبويبات (ROADMAP-FACES)
     صفٌّ تحت نص كل زر: صور المساهمين + عدّاد «+N»، والمختار يكشف دائرة «أنا» بالمنتصف
     ============================================================ */
  const FACE_K = 3;   /* عدد صور العيّنة قبل العدّاد */

  /* استبعاد مشاركتي الفارغة (محرِّر مفتوح بلا كتابة) كي يطابق العدّاد قائمة القسم.
     ومعها مسوّدتي التي لم تُرسَل بعد: لا تصير مساهمةً بمجرّد الكتابة، بل بضغطة الإرسال —
     وهذا يوحّد البنود كلَّها على قاعدة «البطائق» بدل أن ينشر بندُ «المادة» بمجرّد حرف */
  /* ميزانٌ واحد للجميع: ما يُظهر أيقونتَي الوضع والنشر هو نفسه ما يجعل المساهمة قائمةً —
     أيُّ حقلٍ مملوء، حتى غلافُ الرزمة وحده. فلا تُعرض عليك أزرارُ حالةٍ لمساهمةٍ لا تُدرَج */
  const realPosts = (sec, arr) => arr.filter(p => !p.me || editHasInput(sec, p.data));
  /* لا مسوّدات معلّقة: أوّل حقلٍ يُملأ يجعل المساهمة محفوظةً قائمةً — خاصّةً بحكم الوضع الافتراضيّ.
     فالتزامن مباشر ولا شيء ينتظر ضغطةً كي يُحفظ، و«تمّ» إعلانُ فراغٍ لا فعلُ حفظ */
  const draftAware = arr => arr;

  /* مساهمات التبويب مجموعةً حسب خريطة التبويب←الأقسام
     (الغياب والتأخير = abs قناة واحدة · المصادر = srcU+srcP · الدكتور = مساهمات المجتمع تحت الدكاترة) */
  function collectTabPosts(code, tab) {
    switch (tab) {
      case 'info':    return realPosts('info',    postsOf(code, 'info'));
      case 'grade':   return realPosts('grade',   postsOf(code, 'grade'));
      case 'lessons': return realPosts('lessons', postsOf(code, 'lessons'));
      case 'videos':  return realPosts('videos', postsOf(code, 'videos'));
      case 'cards':   return realPosts('cards', postsOf(code, 'cards'));
      case 'abs':     return realPosts('abs', postsOf(code, 'abs'));
      case 'srcU':    return realPosts('srcU', postsOf(code, 'srcU'));
      case 'srcP':    return realPosts('srcP', postsOf(code, 'srcP'));
      case 'doc':     return doctorsOf(code).flatMap(dr => (dr.posts || []).filter(p => !p.me || !isEmptyDocData(p.data)));
      default:        return [];   /* cards: placeholder بلا بيانات */
    }
  }

  /* صفّ دوائر من قائمة مشاركات: [عيّنة صور/مرقّطة] + [أنا بالمنتصف مخفية] + [عدّاد].
     noInvite: بلا دائرة الإضافة «+» (خلايا الشبكة — الإضافة تكون في زر التبويب فقط) */
  function facesHTML(posts, noInvite) {
    const mine   = posts.find(p => p.me);
    const others = posts.filter(p => !p.me);
    const circles = [];
    if (posts.length === 0) {
      for (let k = 0; k < FACE_K; k++) circles.push('<span class="cm-face cm-face--empty"></span>');
    } else {
      /* إن ساهمتُ: صورتي دائرة عادية أول الصف (يمين بالعربي / يسار بالإنجليزي) */
      if (mine) circles.push(`<span class="cm-face cm-face--mine">${avatarHTML(mine)}</span>`);
      others.slice(0, FACE_K - (mine ? 1 : 0)).forEach(p => circles.push(`<span class="cm-face">${avatarHTML(p)}</span>`));
    }
    /* دائرة «+» للدعوة إن لم أساهم فقط — كبيرة بالمنتصف، تظهر مع .on عبر CSS */
    if (!mine && !noInvite) circles.splice(Math.ceil(circles.length / 2), 0, `<span class="cm-face cm-face--me" title="${T().sharePost}">+</span>`);
    /* العدّاد آخر الصف — «+N» (موضعه يمين/يسار حسب اتجاه الصف = اللغة) */
    circles.push(`<span class="cm-face cm-face--count${posts.length === 0 ? ' is-zero' : ''}">+${posts.length}</span>`);
    return circles.join('');
  }
  /* دوائر تبويب واحد — كل تبويب (بما فيه مصادر الفهم/الممارسة) يسمح بالإضافة مباشرةً عبر دائرة «+» */
  const facesRowHTML = (code, tab) => facesHTML(collectTabPosts(code, tab), false);

  /* متوسّط تقييم الدكتور: معدّل كل قيم الشرح وكرم الدرجات الموجودة عبر كل المساهمات عنه */
  /* نجمة التقييم ووسمه — تُعرض مع اسم الدكتور أينما ظهر (فلتر · منسدلات الاختيار) */
  const STAR_IC = '<svg class="star" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5 20.7l1.4-6.8L1.3 9l6.9-.7z"/></svg>';
  function drRateTag(dr) {
    const a = avgDocRating(dr);
    return a == null ? '' : `<span class="dr-rate">${STAR_IC}<b>${a.toFixed(1)}</b></span>`;
  }
  function avgDocRating(dr) {
    const vals = [];
    (dr.posts || []).forEach(p => { const d = p.data || {}; if (d.teach) vals.push(d.teach); if (d.grade) vals.push(d.grade); });
    return vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : null;
  }


  /* نصف اختيار قناة المصادر: العنوان + صور المساهمين (بلا «+») — بالضغط تُفتح مساهمات القناة */
  function srcHalf(k, label) {
    const posts = realPosts(k, postsOf(cmCode, k));
    return `<button type="button" class="srchalf" data-src="${k}">
      <b class="srchalf__t">${label}</b>
      <span class="cm-faces srchalf__faces">${facesHTML(posts, true)}</span>
    </button>`;
  }

  /* طلاء دوائر كل التبويبات — يحدّث span.cm-faces فقط (لا يمسّ الأزرار ولا نصّها) */
  function paintTabFaces(code) {
    if (!code) return;
    document.querySelectorAll('.cm-tabs button[data-tab]').forEach(btn => {   /* يشمل الشريطين */
      const span = btn.querySelector('.cm-faces');
      if (span) span.innerHTML = facesRowHTML(code, btn.dataset.tab);
    });
  }

  /* أيقونات أزرار التبويبات (مختارة من مختبر الأيقونات) — تُرسم فوق التسمية، وترث لون الزرّ
     فتعمل في الفاتح والداكن وفي حالة التبويب المفعّل. لغة موحّدة: مربّع ٢٤ · خطّ ١٫٨ · أطراف دائرية */
  const tabIc = body => `<svg class="cm-tabic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const TAB_IC = {
    info: tabIc('<path d="M12 7.2C10.1 5.6 7.4 5 4 5.3v12.4c3.4-.3 6.1.3 8 1.9 1.9-1.6 4.6-2.2 8-1.9V5.3c-3.4-.3-6.1.3-8 1.9z"/><path d="M12 7.2v12.4"/>'),                                    /* كتاب مفتوح */
    doc: tabIc('<rect x="3.2" y="4.6" width="17.6" height="14.8" rx="2.6"/><circle cx="9" cy="10.6" r="2.3"/><path d="M5.6 16.6a3.6 3.6 0 0 1 6.8 0"/><path d="M14.6 10h4M14.6 14h4"/>'),      /* بطاقة هوية */
    abs: tabIc('<rect x="3" y="4.8" width="18" height="16" rx="2.4"/><path d="M3 9.4h18M8 3.2v3.2M16 3.2v3.2"/><path d="M9.6 14.2l4.8 3.6M14.4 14.2l-4.8 3.6"/>'),                             /* تقويم بعلامة غياب */
    grade: tabIc('<path d="M3.4 20.4h17.2"/><path d="M7 20.4v-6.4M12 20.4V6.2M17 20.4v-9.4"/>'),                                                                                              /* أعمدة */
    srcU: tabIc('<path d="M12 3.2a6.2 6.2 0 0 0-3.6 11.2c.7.5 1.1 1.3 1.1 2.1h5c0-.8.4-1.6 1.1-2.1A6.2 6.2 0 0 0 12 3.2z"/><path d="M9.8 19h4.4M10.6 21.2h2.8"/>'),                            /* مصباح */
    srcP: tabIc('<path d="M19.4 4.6 21 6.2 11.6 15.6l-2.4.8.8-2.4z"/><path d="M18.6 11.4v6.4a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 17.8V8a2.4 2.4 0 0 1 2.4-2.4h6.4"/>'),                  /* قلم وورقة */
    lessons: tabIc('<circle cx="4.8" cy="7" r="1.2"/><circle cx="4.8" cy="12" r="1.2"/><circle cx="4.8" cy="17" r="1.2"/><path d="M8.8 7h10.8M8.8 12h10.8M8.8 17h7.2"/>'),                     /* قائمة */
    videos: tabIc('<rect x="2.5" y="8" width="16" height="12" rx="2.5"/><path d="M6.5 5h11a2.5 2.5 0 0 1 2.5 2.5v9"/><path class="ic-play" d="M9.1 11.4l4.4 2.6-4.4 2.6z" fill="currentColor" stroke="none"/>'),   /* رزمة فيديوهات — نفس رمز الغلاف (PK_IC.vids) */                                                                            /* زرّ تشغيل */
    /* ===== رزمة بطائق مستلقية، وفي وجه أولاها استفهام — فالبطاقة سؤالٌ قبل أن تكون شكلًا =====
       والاستفهامُ هو استفهامُ ‎CD_IC.askRtl/askLtr‎ نفسُه: محرفا ‎IBM Plex Sans Arabic‎
       العريض (‎uni061F‎ و‎question‎) مسارَين مخبوزَين — فسؤالُ الزرّ وسؤالُ لسان الحقل يدٌ واحدة.
       وهو ملءٌ لا خطّ (‎fill/stroke‎ يُصرّحان هنا لأنّ ‎tabIc‎ يضع ‎fill="none"‎ للرزمة).
       ومقاسُه من قاعدة اللسان نفسِها: الحرفُ ‎0.764‎ من **جوف** الحاوية لا من حدّها الخارجيّ —
       وجوفُ الوجه ‎10.2‎ (الرقعة ١٢ ناقصَ سمكِ ١٫٨) فارتفاعُه ‎7.8‎، ومركزُه ‎(11.75, 14)‎
       مركزُ الجوف، فله ‎1.2‎ فسحةً عن حافّة البطاقة من أعلى وأسفل.

       ولمَ خاصّيّةٌ تُقرأ (‎get‎) لا نصٌّ ساكن؟ لأنّ لغة هذا الزرّ لغةُ **الموقع** (‎state.lang‎)
       لا لغةُ البطاقة، و‎TAB_IC‎ يُبنى مرّةً عند تحميل الملفّ — قبل أن تُقرأ الحالُ أصلًا.
       فلو كُتب نصًّا لَتجمّد على لغة أوّل تحميل. والقارئُ يُستدعى عند كلّ رسمٍ من
       ‎TAB_IC[v]‎ بلا تغييرٍ في موضع الاستعمال، و‎applyLang‎ تُعيد بناء الشريط
       (عبر ‎fillCourseUI‎) فينقلب الاستفهامُ مع الموقع */
    /* ===== وصار الوجهُ مقسومًا: «؟» في شطرٍ وسطورٌ في شطر (‎cardsum-split-lab#p5‎) =====
       العلّةُ أنّ الزرَّ اسمُه «البطائق **والملخصات**» ورسمُه لا يقول إلا البطائق. فقُسم وجهُه
       بقطعٍ مائل: «؟» يسارَه وثلاثةُ سطورٍ يمينَه. والقسمةُ في **الحدّ** لا بتراكب شكلين،
       فلا يزيد الحبرُ ولا تتقاطع حدود — وذاك ما يُنجيه في ‎17px‎.

       والمائلُ يبلغ حافّتَي المستطيل ولا يعبرهما: الخطُّ الذي يعبر الشكلَ كلَّه يُقرأ **شطبًا**
       («ممنوع») لا قسمةً، ونجاتُه هنا بأمرين — أنّه ينتهي عند الحدّ، وأنّ شطريه **مأهولان**
       (فالشطبُ يمرّ فوق محتوًى، وهذا يفصل بين محتويين).

       والسطورُ بسُمك ‎1.35‎ لا ‎1.8‎ — وهو الاستثناءُ الوحيد في هذا الشريط، وقرارٌ صريح:
       جوفُ الوجه ‎11.6‎، وثلاثةُ سطورٍ بالسُّمك المعتمد تلتحم فيه كتلةً واحدة.
       وأطوالُها متدرّجةٌ لأنّ طرفَها الداخليَّ يتبع المائلَ عند ارتفاعه (فسحةُ ‎2.5‎).

       ومقاسُ المستطيل ‎17.5×11.6‎ عند ‎(3.25, 6.2)‎ لا ‎(3, 8)‎ كوجه ‎CARD_PACK‎: رُفع وقصُر
       ليُفسح للمائلة فوقه بعد أن كثُر ما في جوفه. ولذلك أُخذت ‎CARD_TILT‎ وحدَها مُزاحةً
       ‎-1.8‎ بدل ‎CARD_PACK‎ كلِّه — فالمائلةُ تبقى مصدرًا واحدًا مع ‎PK_IC.card‎، والوجهُ يفترق.

       و‎cardQPath()‎ لا المسارُ مخبوزًا: هي التي تنقلب مع لغة الموقع (‎؟‎ ⇄ ‎?‎)، والمحرفان
       كلاهما مرسومٌ على المركز ‎(11.75, 14)‎ فيصلح لهما التحويلُ نفسُه.
       والمقاسُ ‎0.78‎ ومركزُه ‎(7.2, 12.1)‎ — معايَرٌ بيد صاحب الموقع في المختبر */
    get cards() {
      return tabIc(
        '<g transform="translate(0 -1.8)">' + CARD_TILT + '</g>'
        + '<rect x="3.25" y="6.2" width="17.5" height="11.6" rx="2.4"/>'
        /* سُمكُ المائل مصرَّحٌ وإن طابق سُمكَ ‎tabIc‎: يُقرأ قرارًا لا وراثةً، فلا يتبع الحدَّ إن عُدِّل */
        + '<g stroke-width="1.8"><path d="M8.9 6.2L15.1 17.8"/></g>'
        + '<g transform="translate(-1.97 1.18) scale(0.78)">' + cardQPath() + '</g>'
        + '<g stroke-width="1.35"><path d="M13.32 9.8H18.45M14.58 12.15H18.45M15.84 14.5H18.45"/></g>'
      );
    },
  };

  /* تعبئة واجهة المادة المشتركة #cm-ui — تُستدعى بعد تركيبها في مضيفها (نافذة أو صفحة) */
  function fillCourseUI(code) {
    if (cmCode && cmCode !== code) cleanupEmptyMine();   /* تبديل مادة ومحرر المادة السابقة مفتوح */
    cxSel.clear();   /* التحديدُ حالُ جلسةٍ في مادّةٍ بعينها — ولا يُورَّث لمادّةٍ أخرى */
    cmCode = code;
    cdMinScope();    /* وألسنةُ المطويّات تتبع المادّة: تظهر ألسنةُ هذه وتُحجب ألسنةُ غيرها */
    const c = CM[code];
    coursePosts(code);   /* ترحيل البيانات القديمة إلى مشاركات إن لزم */
    srvPull(code);       /* ومنشوراتُ غيرك: تُجذب في الخلفيّة وتُحقن ثمّ تُعاد الشاشة */
    const actLbl = c.act ? ` — ${c.act}` : '';   /* نشاط المعمل يظهر في العنوان لتمييز خيطه */
    $('#cm-title').textContent = (state.lang === 'ar' ? `${arShort(c)}${actLbl} (${c.h})` : `${c.code}${actLbl} (${c.h})`);
    /* مربع صورة المادة يمين الاسم بالعنوان */
    $('#cm-timg').innerHTML = imgOf(code)
      ? `<img src="${imgOf(code)}" alt="">`
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 15l-4.5-4.5L7 20"/></svg>';
    /* شريط واحد لكل الأقسام (٧): أُدمج «الغياب والتأخير» داخل «الدكاترة» فحُذف زره */
    /* «المواضيع» حُذف من شريط التبويبات (بيانات القناة lessons باقية في التخزين).
       آخر أربعة = موارد الإتقان (فهم/ممارسة/شروح/بطائق) تُلَفّ في «رفّ الموارد» المرفوع (بلا عنوان) */
    const cmTab = ([v, txt]) => `<button type="button" data-tab="${v}">${TAB_IC[v]}${txt}<span class="cm-faces"></span></button>`;
    $('#cm-tabs').innerHTML =
      [['info', T().infoSec], ['doc', T().docSec], ['abs', T().absSec], ['grade', T().gradeSec]].map(cmTab).join('')
      + `<div class="cm-res">`
      + XT_RES().map(cmTab).join('')
      + `</div>`;
    renderCmSection();   /* يفتح النافذة على القسم النشط */
  }

  /* من السوق: الواجهة داخل النافذة المنبثقة (لم يعد يُستخدم من السوق — مبقى للاستدعاءات الأخرى) */
  function openCourseModal(code) {
    $('#lib-course').hidden = true;
    $('#market-course').hidden = true;
    document.querySelector('#course-modal .mmodal__card').appendChild($('#cm-ui'));
    fillCourseUI(code);
    courseModal.hidden = false;
  }

  /* من السوق: مساهمات المادة المتمركزة مدمجة أسفل السوق — تتبع البِكرة حيًّا (بلا تمرير الصفحة) */
  function showMarketContribs(code) {
    courseModal.hidden = true;
    const host = $('#market-course');
    if ($('#cm-ui').parentElement !== host) host.appendChild($('#cm-ui'));
    host.hidden = false;
    fillCourseUI(code);
  }
  /* نقر الكتاب المتمركز: نفس العرض + تمرير الصفحة إليه لقراءته */
  function openMarketCourse(code) {
    showMarketContribs(code);
    $('#market-course').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ============================================================
     قُمرة المادة في الرَّكن — الهيكل الذي جهّزه المستخدم في مختبر nook-cockpit-lab («على ذوقي»)
     مربّعات فارغة بعناوينها فقط، تُملأ لاحقًا بندًا بندًا
     ============================================================ */
  let nookEntry = null;   // المدخلة المعروضة حاليًا في القُمرة

  /* المساهمة المختارة لبند من بنود القُمرة (تُخزَّن بمعرّفها في مدخلة الترم) — null إن لم تُختَر أو حُذفت.
     «الدكاترة» يُخزَّن بمعرّفين {dr, post} لأن مساهماته تحت الدكتور لا في قناة مستقلّة */
  /* نشاط المادة المعروض في القُمرة: مادة اللاب لها خيطان مستقلّان (محاضرة/معمل)،
     فلكلِّ نشاط مساهماته وصندوق اختياراته — «مربّعات المحاضرة» غير «مربّعات المعمل» */
  const nookIsLab = entry => isLab(entry.code) && selOf(entry.code) === 'معمل';
  const nookCode = entry => nookIsLab(entry) ? labKey(entry.code) : entry.code;
  function nookPicks(entry, create) {
    const k = nookIsLab(entry) ? 'picksLab' : 'picks';
    if (create && !entry[k]) entry[k] = {};
    return entry[k];
  }
  function nookPick(entry, sec) {
    const bag = nookPicks(entry);
    const v = bag && bag[sec];
    if (!v) return null;
    const code = nookCode(entry);
    return postsOf(code, sec).find(x => x.id === v) || null;
  }
  /* دائرة الإضافة: مرقّطة ذهبية شفافة بعلامة + في وسط المربّع الفارغ — نقرتها تفتح مساحة الانتقاء */
  const nkPickBtn = sec =>
    `<button type="button" class="nk-pick" data-nkpick="${sec}" title="${T().nkPickTip}" aria-label="${T().nkPickTip}">+</button>`;
  /* ============================================================
     زرُّ التوسيع والتضييق — يسار الترس في كلّ مربّع
     ============================================================
     الرَّكنُ يُفتح شريطًا (قامةُ الأربعة ‎34‎)، فمن أراد جوفَ مربّعٍ جرَّ ذيلَه. وهذا
     الزرُّ يختصر الجرَّ: نقرةٌ تنشره ونقرةٌ تطويه.
     · والطيُّ يردّه إلى **الأصل** (‎NK_DEF‎) لا إلى رقمٍ ثانٍ يُصان.
     · والنشرُ يردّه إلى ما كان عليه قبل الطيّ (‎o‎) — فمن وسّعه ثمّ طواه ثمّ نشره
       وجده كما تركه، لا كما قرّرنا له.
     · ومن جرَّ مربّعًا بيده فقد خرج عن الطيّ، فيُطفأ ‎c‎ وتنقلب الأيقونةُ في الحال:
       زرٌّ يقول «وسّع» ومربّعٌ موسَّعٌ تحته كذبٌ صريح */
  /* ===== وزاويةٌ مفتوحةٌ لا سهمان قُطريّان =====
     كان السهمان يقولان «كبّر / صغّر» — وهو فعلُ نافذةٍ تُملأ الشاشةَ لا فعلُ درجٍ
     يُفتح. والزاويةُ تقول «ما تحت»: الى اسفلَ حين يكون مطويّا (افتح)، والى اعلى
     حين يكون مبسوطا (اطوِ). وهي المشحونة في ‎RE/nook-four‎ بعد ثلاثة اشكالٍ جُرّبت */
  const NK_FOLD = {
    out: '<svg viewBox="4.75 8.35 14.5 7.3" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.6l6 5.4 6-5.4"/></svg>',
    in:  '<svg viewBox="4.75 8.35 14.5 7.3" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14.4l6-5.4 6 5.4"/></svg>',
  };
  const NK_KEY = { info: 'nkInfo', doc: 'nkDoc', abs: 'nkAbs', grade: 'nkGrade' };
  const nkFoldBtn = sec => {
    const on = !!(state[NK_KEY[sec]] || {}).c;
    const lab = on ? T().nkWiden : T().nkNarrow;
    return `<button type="button" class="nk-fold" data-nkfold="${sec}" title="${esc(lab)}" aria-label="${esc(lab)}">`
      + (on ? NK_FOLD.out : NK_FOLD.in) + `</button>`;
  };
  /* ومقابضُ الجرّ الثلاثةُ: نصٌّ واحدٌ يلبسه كلُّ مربّعٍ من الأربعة — والمربّعُ يُعرف
     من موضعه في الصفّ لا من مفتاحٍ يُكتب في المقبض (‎nkiDrag‎)، فلا اسمَ يُنسى */
  const nkiRZ = () => `<i class="nki-rz nki-rz--w" data-nki="w" title="${esc(T().nkiW)}"></i>`
    + `<i class="nki-rz nki-rz--h" data-nki="h" title="${esc(T().nkiH)}"></i>`
    + `<i class="nki-rz nki-rz--c" data-nki="c" title="${esc(T().nkiWH)}"></i>`;
  /* ===== الشريطُ الجانبيّ: مَجرًى وابهام =====
     ‏‎data-sb‎ للجرّ، و‎nk-sb__th‎ ابهامٌ قامتُه وموضعُه يُكتبان من الجافا.
     ===== ولِمَ يُلحق بالصندوق لا بحاضنة الجوف =====
     كان في المختبر اخا للجوف في حاضنةٍ نسبيّة (‎.nk-sc‎) ليأخذ حدودَها بلا رقمٍ
     مقيس. وذاك صحيحٌ في الثلاثة وخاطئٌ في المادّة: حاضنتُها **داخل** ‎.nkm‎ وحشوتُها
     ‎13px‎، فحافّةُ الحاضنة ليست حافّةَ الصندوق — فوقف شريطُها دون الطرف وبلغه
     اخوتُه. والمطلوبُ ان يكون كجزءٍ من الاطار: من اعلى الصندوق الى اسفله.
     فيُلحق بالصندوق، وحدودُه واحدةٌ في الاربعة.
     والحسابُ لا يتغيّر: ‎nkSbSync‎ يقرأ قامةَ الجوف من الجوف وطولَ المجرى من الشريط */
  const nkSB = () => `<i class="nk-sb" data-sb><i class="nk-sb__th"></i></i>`;

  /* بعد الاختيار: تختفي الدائرة ويحلّ محلّها ترس ذهبي صغير يسار عنوان البند */
  const nkGearBtn = sec =>
    `<button type="button" class="nk-gear nk-pick" data-nkpick="${sec}" title="${T().nkPickTip}" aria-label="${T().nkPickTip}">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>` +
    `</button>`;

  /* ---------- بنود تشكيل «المادة»: قيمٌ يكتبها المستخدم أو يسحبها من المساهمات ---------- */
  const INFO_SLOTS = ['book', 'type', 'lang', 'rel', 'topics', 'desc'];
  const liveTopics = t => (t || []).filter(x => x && (x.num || x.name));
  /* ترحيل النموذج المرجعي القديم (بند → معرّف مساهمة · أو معرّف واحد للكل) إلى قيم */
  function infoComposed(entry) {
    const bag = nookPicks(entry) || {};
    const ref = bag.info;
    const d = {};
    if (!ref) return { d };
    const arr = postsOf(nookCode(entry), 'info');
    const slots = typeof ref === 'string'
      ? INFO_SLOTS.reduce((o, k) => (o[k] = ref, o), {})
      : ref;
    INFO_SLOTS.forEach(k => {
      const p = slots[k] && arr.find(x => x.id === slots[k]);
      const src = p && p.data ? p.data : null;
      if (!src) return;
      if (k === 'book') { if (src.book || src.bookImg) { d.book = src.book; d.bookImg = src.bookImg; } }
      else if (k === 'topics') { if (liveTopics(src.topics).length) d.topics = src.topics.slice(); }
      else if (src[k]) d[k] = src[k];
    });
    return { d };
  }

  /* ============================================================
     جسدُ الوضع الضيّق — منقولٌ من ‎RE/nook-four‎ كما هو
     ============================================================
     (‏‎ROADMAP-NOOK-THEME.md‎ م٢ · واتّجاهُه «ع المِلء»)
     كان الضيّقُ في هذا الموقع **قصَّ الواسع** عند ‎34px‎: سطرُ العنوان وحدَه وما تحته
     مقصوص. وهذا يضيف صندوقا مصمَّما: لفظٌ ورقمٌ يطفوان على **أرضيّةٍ هي المقياس**.
     ===== ولِمَ نُقلت الشيفرةُ كما هي ولم تُعَد كتابتُها؟ =====
     هذه أربعُ مئةِ سطرٍ عُويرت في المختبر جولةً بعد جولة (صيغُ الرقم · قسمةُ محور
     الاسبوع · مناطقُ الغياب · حزامُ الدرجة · موضعُ المؤشّر). واعادةُ كتابتها ههنا
     تُعيد معها اخطاءها الاولى. فتُنقل بحرفها، ويُبنى لها **مُدخَلٌ واحد**: كائنٌ
     اسمُه ‎S‎ يُملأ من بيانات الموقع قبل بناء كلّ مربّع. فما دام المُدخَلُ صادقا
     فالمخرَجُ هو الذي عُويِر عليه.
     ===== وما لا يُنقل =====
     متونُ الواسع (يبنيها الموقعُ من بياناته)، والمقابضُ، والازرار. وازرارُ الترس
     والطيّ **تُنسخ** في شريط الاداتين: مستمعاها مفوَّضان على الوثيقة بـ‎data-nkpick‎
     و‎data-nkfold‎، فالنسخةُ تعمل كالاصل ولا يُمَسّ اصلٌ */
  const NK_NARROW = (function () {
    /* الحالُ التي تقرؤها الشيفرةُ المنقولة — تُملأ لكلّ مربّعٍ قبل بنائه */
    let S = {};
    const DAYS = ['الاحد', 'الاثنين', 'الثلاثاء', 'الاربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const DOC_SOON = 60, DOC_GAPMAX = 180;

    const fmt = m => {
      m = ((Math.round(m) % 1440) + 1440) % 1440;
      const h = Math.floor(m / 60), mi = m % 60;
      const ap = h < 12 ? 'ص' : 'م', h12 = h % 12 === 0 ? 12 : h % 12;
      return h12 + ':' + String(mi).padStart(2, '0') + ' ' + ap;
    };

    const unit = (n, sing) => n + ' ' + sing;

    /* ===== ونوافذُ الساعات قائمةٌ، لا اثنتان =====
       في المختبر كان للدكتور مقبضان (‎h1‎ و‎h2‎) لأنّهما كانا يُعايَران باليد. وفي
       الموقع يكتب المستخدمُ ما شاء من فتراتٍ في نافذة الاعدادات (‎pkHoursChip‎ فيها
       زرُّ «+» بلا حدّ). فلو بقي القارئُ على اثنتين لَسقطت الثالثةُ فما بعدها من
       المحور بلا خبر — وهو قطعٌ بين ما يُدخَل وما يُرى.
       فتُقرأ ‎S.hrs‎ إن وُجدت، ويبقى المقبضان مقروءَين لمن لا قائمةَ له */
    const docWins = () => (S.hrs && S.hrs.length) ? S.hrs
      : [{ on: S.h1on, day: +S.h1day, from: +S.h1from, to: +S.h1to },
         { on: S.h2on, day: +S.h2day, from: +S.h2from, to: +S.h2to }].filter(h => h.on);

    function docNow() {
      const hrs = docWins();
      const ok = hrs.filter(h => h.to > h.from);
      if (!ok.length) return { s: 'none' };
      const d = +S.nowday, m = +S.nowmin;
      const cur = ok.find(h => h.day === d && m >= h.from && m < h.to);
      if (cur) return { s: 'on', cur, left: cur.to - m, span: cur.to - cur.from };
      let best = null;
      for (let k = 0; k < 7; k++) {
        const dd = (d + k) % 7;
        ok.filter(h => h.day === dd).forEach(h => {
          if (k === 0 && h.from <= m) return;
          const at = k * 1440 + h.from;
          if (!best || at < best.at) best = { at, h, k };
        });
      }
      if (!best) return { s: 'none' };
      const gap = best.at - m;
      return { s: (best.k === 0 && gap <= DOC_SOON) ? 'soon' : 'off', best, gap };
    }

    const ABS_ZONE = {
      safe: 'بمنطقة المسموح', last: 'بمنطقة المسموح', spent: 'بمنطقة المسموح',
      ded: 'بمنطقة الخصم', edge: 'قريب الحرمان', dn: 'محروم',
    };

    function absState() {
      const fromLate = S.lateN > 0 ? Math.floor(S.late / S.lateN) : 0;
      const eff = (+S.abs || 0) + fromLate;
      const left = Math.max(0, S.free - eff);
      const lost = (S.dedFrom > 0 && eff >= S.dedFrom) ? (eff - S.dedFrom + 1) * (S.dedAmt || 0) : 0;
      const cap = S.dn > 0 ? S.dn : Math.max(S.free, S.dedFrom, 1);
      let s;
      if (S.dn > 0 && eff >= S.dn) s = 'dn';
      else if (S.dn > 0 && S.dn - eff <= 1) s = 'edge';
      else if (S.dedFrom > 0 && eff >= S.dedFrom) s = 'ded';
      else if (left === 0) s = 'spent';
      else if (left === 1) s = 'last';
      else s = 'safe';
      return { s, eff, left, fromLate, lost: Math.min(100, lost), cap, toDn: Math.max(0, S.dn - eff), p: Math.max(0, Math.min(1, eff / cap)) };
    }

    const GLD = [
      { L: 'F', lo: 0, c: '#c98a8a' }, { L: 'D', lo: 60, c: '#d59a63' }, { L: 'D+', lo: 65, c: '#d8a06a' },
      { L: 'C', lo: 70, c: '#dcb765' }, { L: 'C+', lo: 75, c: '#cfc06a' }, { L: 'B', lo: 80, c: '#a9c07f' },
      { L: 'B+', lo: 85, c: '#8ebd88' }, { L: 'A', lo: 90, c: '#6fb094' }, { L: 'A+', lo: 95, c: '#4f9e86' },
    ];

    const gband = p => { for (let i = GLD.length - 1; i >= 0; i--) if (p >= GLD[i].lo) return GLD[i]; return GLD[0]; };

    const GLD_CUT = 55;

    const gpos = p => Math.max(0, Math.min(100, (p - GLD_CUT) / (100 - GLD_CUT) * 100));

    const frac = (part, whole) => whole + '/' + part;

    function numInfo() {
      const t = Math.max(0, S.topics), d = Math.min(Math.max(0, S.done), t);
      const pct = t ? Math.round(d / t * 100) : 0;
    /* ===== ومربّعُ المادّة بلا لون =====
       الثلاثةُ الأُخَر ألوانُها **خبرٌ**: خُضرةُ الدكتور حضورُه، وحُمرةُ الغياب خطرُه،
       وحزامُ الدرجة حرفُك. وأمّا المادّة فنسبتُها لا حالَ لها: سبعةٌ من أربعةَ عشرَ ليست
       حسنةً ولا سيّئة — إنّما موضعٌ في طريق.
       فالذهبُ فيها كان **زينةً بين ثلاثةِ ألوانٍ تقول**، وذاك أسوأُ من عدمه: العينُ تقرأ
       كلَّ لونٍ في الصفّ خبرًا، فتسأل عن خبر الذهب فلا تجد. فيُنزع اللونُ ويبقى الحبر —
       والمقياسُ يُقرأ بالعتمة كما يُقرأ بالصبغ.
       وأثرُه أنّ الثلاثةَ تشتدّ: لونٌ في صفٍّ محايدٍ أصرحُ من لونٍ في صفٍّ ملوّن */
      const tone = 'var(--nk-ink)';
      if (!t) return { big: '—', sub: 'لا مواضيع', tone: 'var(--nk-ink-soft)' };
      if (S.fInfo === 'b') return { big: pct + '%', sub: unit(t, 'موضوع'), tone };
      if (S.fInfo === 'c') return { big: String(t - d), sub: t - d === 0 ? 'انتهت المادة' : 'باقيا من ' + t, tone };
      if (S.fInfo === 'd') return { big: String(d), sub: 'من ' + t, tone };
      /* ===== ومربّعُ المادّة يقول عددَ مواضيعها لا موضعَك منها =====
         كان الأصلُ كسرا (‎د/ت‎) — وهو تتبُّعُ إنجازٍ، وقد استُقرّ أن لا تتبُّعَ في هذا
         المربّع: سطحٌ واحدٌ بلا لونين ولا مقياس. فبقاءُ الكسر يناقض ما بُني عليه.
         والوحدةُ مفردةٌ أبدا («موضوع» لا «موضوعا»): العددُ يسبقها فيحملها */
      return { big: String(t), sub: 'موضوع', tone };
    }

    const UNIT_W = ['دقيقة', 'ساعة', 'يوم', 'اسبوع'];

    const unitH = tx => esc(tx).replace(
      new RegExp('(' + UNIT_W.join('|') + ')', 'g'), '<i class="fx-unit">$1</i>');

    function numDoc() {
      const c = docNow(), L = docLeft();
      const col = c.s === 'on' ? 'var(--dm-on)' : c.s === 'soon' ? 'var(--dm-soon)' : 'var(--dm-off)';
      const out = (big, sub) => ({ big, bigH: unitH(big), sub, tone: col, st: c });
      if (!L) return { big: '—', sub: 'لم تسجل ساعاته', tone: 'var(--nk-ink-soft)', st: c };
      const T = S.tmode;
      const dayTx = L.tday === +S.nowday ? '' : DAYS[L.tday] + ' ';
      if (T === 'none')  return out('', '');
      if (T === 'state') return out({ on: 'متاح', soon: 'قريبا', off: 'غير متاح', none: '—' }[c.s],
                                    L.in ? 'حتى ' + fmt(L.tmin) : dayTx + fmt(L.tmin));
      if (T === 'clock') return out(fmt(L.tmin), L.in ? 'ينتهي' : 'يبدأ');
      if (T === 'daytime') return out(dayTx + fmt(L.tmin), L.in ? 'ينتهي' : 'يبدأ');
      if (T === 'span')  return out(fmt(L.win.from) + ' – ' + fmt(L.win.to),
                                    L.in ? 'ساعاته الآن' : dayTx + 'ساعاته القادمة');
      if (T === 'both')  return out(leftTx(L.min), (L.in ? 'ينتهي ' : 'يبدأ ') + dayTx + fmt(L.tmin));
      /* والتصاعديُّ لا يقوم خارجَ النافذة: لا شيءَ مضى بعدُ — فيقول متى تبدأ */
      if (T === 'up')    return L.in ? out(leftTx(L.gone), 'مضى من ساعاته')
                                     : out(leftTx(L.min), 'ويتوفر بالمكتب');
      /* ===== والسطرُ الأيسر يُتمّ جملةَ الرقم =====
         الرقمُ يمينا واللفظُ يساره، فيُقرآن سطرا واحدا: «١ ساعة ويتوفر بالمكتب» — وهي
         صيغةُ «دقيقتان ويصل» في العربيّة: مدّةٌ ثمّ واوٌ ثمّ ما يقع بعدها.
         ===== واللفظُ يقول **منتهى** العدّ لا الحالَ الآن =====
         فمن كان في مكتبه فالعدُّ إلى مغادرته، ومن كان خارجَه فالعدُّ إلى توفّره. والحالُ
         الحاضرةُ تُفهم من اللفظ نفسِه بلا أن تُقال، فلا يُكرَّر خبرٌ في سطرين */
      return out(leftTx(L.min), L.in ? 'ويغادر المكتب' : 'ويتوفر بالمكتب');
    }

    function numAbs() {
      const c = absState();
      const col = c.s === 'dn' ? 'var(--as-dead)'
        : (c.s === 'ded' || c.s === 'edge') ? 'var(--as-bad)'
        : (c.s === 'last' || c.s === 'spent') ? 'var(--as-warn)' : 'var(--as-ok)';
      if (absEmpty()) return { big: '—', sub: 'لم تسجل سياسة الغياب', tone: SOFT, st: c };
      const F = {
        /* ===== والكسرُ على قاعدة ‎frac‎: الكلُّ يسارا والجزءُ يمينا =====
           قُلب مرّةً ثمّ رُدّ، والقصّةُ تستحقّ أن تُقيَّد لئلّا يُقلب ثالثةً:
           قرأ صاحبُ الموقع «٥ من ٣» فظنّه مقلوبا — وكان صحيحا، والثلاثةُ مجانيُّه
           والخمسةُ غيابُه، وإنّما تجاوز المسموحَ فبدا الجزءُ أكبرَ من الكلّ.
           ===== ودرسُه في القراءة لا في الكود =====
           سلسلةٌ عدديّةٌ في سطرٍ عربيّ تُرسم كما كُتبت (‎bidi‎ يبتلع ‎/‎ بين رقمين فيبقى
           الترتيبُ لاتينيّا)، لكنّ العينَ العربيّةَ تمسحها من اليمين — فأوّلُ ما يُقرأ
           هو **آخرُ** ما كُتب. فمن وصف ما يرى بدأ بآخر السلسلة، ومن سمع وصفَه وظنّه
           أوّلَها قلبها وهي مستقيمة. فالكسرُ يبقى ‎whole/part‎ ولا يُمَسّ */
        /* ===== واللفظُ يقول **أين أنت** لا ما هو الرقم =====
           كان «غيابك» — وهو تسميةٌ للرقم، والرقمُ يُسمّي نفسَه (كسرٌ من مجانيّك). فيُبدَّل
           بالمنطقة التي بلغتَها: أربعُ مناطقَ تُقرأ من ستّ حالاتٍ في ‎absState‎.
           و«نفد المجاني» (‎spent‎) تُلحق بالمسموح لا بالخصم: المجانيُّ استُهلك تمامًا ولم
           يبدأ الخصمُ بعدُ — فمن ألحقها بالخصم أنذر بعقوبةٍ لم تقع */
        a: () => ({ big: frac(c.eff, S.free), sub: ABS_ZONE[c.s] || ABS_ZONE.safe }),
        b: () => ({ big: String(c.left), sub: c.left === 0 ? 'نفد المجاني' : 'باق لك' }),
        c: () => ({ big: c.lost ? '−' + c.lost + '%' : '0%', sub: 'خصمك' }),
        d: () => ({ big: String(c.toDn), sub: c.toDn === 0 ? 'محروم' : 'إلى الحرمان' }),
        e: () => c.s === 'dn' ? { big: 'محروم', sub: 'بلغت ' + S.dn }
          : c.s === 'edge' ? { big: String(c.toDn), sub: 'إلى الحرمان' }
          : (c.s === 'ded') ? { big: '−' + c.lost + '%', sub: 'خصمك' }
          : { big: String(c.left), sub: c.left === 0 ? 'نفد المجاني' : 'باق لك' },
      };
      return Object.assign((F[S.fAbs] || F.a)(), { tone: col, st: c });
    }

    const absEmpty = () => !(+S.free || +S.dedFrom || +S.dn);

    const SOFT = 'var(--nk-ink-soft)';

    function numGrade() {
      const p = Math.max(0, Math.min(100, +S.gpct || 0)), b = gband(p);
      if (!S.gset) return { big: '—', sub: 'لم ترصد درجة', tone: SOFT, st: { p, b } };
      return S.fGrade === 'b'
        ? { big: (Math.round(p * 10) / 10) + '%', sub: b.L, tone: b.c, st: { p, b } }
        : { big: b.L, sub: (Math.round(p * 10) / 10) + '%', tone: b.c, st: { p, b } };
    }

    function fillInfo() {
      /* سطحٌ واحدٌ موحَّد: لا يقرأ ‎done‎ ولا ‎topics‎ — الثيمُ نسيجٌ لا مقياس */
      return S.itheme === 'a' ? [] : [{ f: 1, cls: 'ith' }];
    }

    const dayA = () => +S.d0, dayB = () => +S.d1;

    const WEEK = [0, 1, 2, 3, 4];

    /* موضعُ لحظةٍ على محور الأسبوع (٪) — أو ‎null‎ إن كانت خارجَه (الجمعةُ والسبت) */
    function wkPos(day, min) {
      const di = WEEK.indexOf(+day);
      if (di < 0) return null;
      const f = Math.max(0, Math.min(1, (min - dayA()) / (dayB() - dayA())));
      return (di + f) / WEEK.length * 100;
    }

    /* شرائحُ الأسبوع: مسيرٌ من صفرٍ إلى مئةٍ يُقطع بنوافذه */
    function weekSegs() {
      const wins = [];
      docWins().forEach(({ day: d, from: a, to: b }) => {
        if (b <= a) return;
        const p1 = wkPos(d, a), p2 = wkPos(d, b);
        if (p1 != null && p2 != null && p2 > p1) wins.push([p1, p2]);
      });
      /* ===== وحدٌّ أدنى لعرض الأخضر =====
         نافذةٌ قصيرةٌ (نصفُ ساعة) تصير خيطًا لا يُقرأ لونًا. فتُوسَّع من مركزها إلى الحدّ
         الأدنى — والتوسيعُ **رسمٌ لا حساب**: الموضعُ والمؤشّرُ على حقّهما، وإنّما يُغلَّظ
         ما يُرى. ومن أراد الصدقَ التامّ صفَّر المقبض */
      const need = +S.wkmin;
      const wide = wins.map(([a, b]) => {
        if (b - a >= need) return [a, b];
        const c = (a + b) / 2;
        return [Math.max(0, Math.min(100 - need, c - need / 2)), Math.min(100, Math.max(need, c + need / 2))];
      });
      wins.length = 0; wide.forEach(w => wins.push(w));
      wins.sort((x, y) => x[0] - y[0]);
      const out = [];
      let at = 0;
      wins.forEach(([a, b]) => {
        if (a > at) out.push({ w: a - at, on: 0 });
        out.push({ w: b - Math.max(a, at), on: 1 });
        at = Math.max(at, b);
      });
      if (at < 100) out.push({ w: 100 - at, on: 0 });
      return out;
    }

    function docLeft() {
      const hrs = docWins().filter(h => h.to > h.from);
      if (!hrs.length) return null;
      const d = +S.nowday, m = +S.nowmin;
      const cur = hrs.find(h => h.day === d && m >= h.from && m < h.to);
      /* ‏‎tday/tmin‎: اللحظةُ التي يُعَدُّ إليها — وبها تستقيم كلُّ طرائق العرض بلا حسابٍ ثانٍ */
      if (cur) return { in: 1, min: cur.to - m, tday: d, tmin: cur.to,
                        span: cur.to - cur.from, gone: m - cur.from, win: cur };
      /* وإلّا فأقربُ بدايةٍ قادمة — يُبحث ثمانيةَ أيّامٍ فيلتفّ الأسبوعُ ولو كانت واحدة */
      let best = null;
      for (let k = 0; k < 8; k++) {
        const dd = (d + k) % 7;
        hrs.filter(h => h.day === dd).forEach(h => {
          const gap = k * 1440 + h.from - m;
          if (gap <= 0) return;
          if (!best || gap < best.min) best = { in: 0, min: gap, tday: dd, tmin: h.from,
                                                span: h.to - h.from, gone: 0, win: h };
        });
      }
      return best;
    }

    function leftTx(min) {
      const M = Math.max(0, Math.round(min));
      const D = Math.floor(M / 1440), H = Math.floor((M % 1440) / 60), MM = M % 60;
      const uD = n => unit(n, 'يوم');
      const uH = n => unit(n, 'ساعة');
      const uM = n => unit(n, 'دقيقة');
      if (S.lfmt === 'm') return uM(M);
      if (S.lfmt === 'h') return M < 60 ? uM(M) : uH(Math.floor(M / 60));
      if (S.lfmt === 'w') {
        const W = Math.floor(M / 10080);
        if (W >= 1) return unit(W, 'اسبوع');
        if (D >= 1) return uD(D);
        if (H >= 1) return uH(H);
        return uM(M);
      }
      const parts = [];
      if (D) parts.push(uD(D));
      if (H) parts.push(uH(H));
      if (MM || !parts.length) parts.push(uM(MM));
      return parts.join(' و');
    }

    function fillDoc() {
      /* ولا يتبع ‎scope‎: الأسبوعُ خريطةٌ لا تقدُّم، فلا معنى لـ«موضعك وحدَه» فيه.
         والعروضُ تُطلب من ‎docSegs‎ لا من ‎weekSegs‎: تلك تقول الأسبوعَ كما هو، وهذه
         تقوله بعد القسمة إن كان مقرَّبا */
      return docSegs().map(x => ({ w: x.w, cls: 'wk-' + (x.on ? 'on' : 'off') + (x.cur ? ' wk-cur' : '') }));
    }

    function fillAbs() {
      /* وبلا سياسةٍ لا مناطقَ تُرسم: الحدودُ هي التي تقسم الشريط */
      if (absEmpty()) return [{ f: 1, c: SOFT, o: 1 }];
      const c = absState(), n = Math.max(1, S.dn || Math.max(S.free, S.dedFrom, 1));
      const col = c.s === 'dn' ? 'var(--as-dead)' : (c.s === 'ded' || c.s === 'edge') ? 'var(--as-bad)'
        : (c.s === 'last' || c.s === 'spent') ? 'var(--as-warn)' : 'var(--as-ok)';
      if (S.scope === 'mine' || n > 24) return [{ f: 1, c: col, o: 1 }];
      /* ===== والمنطقةُ كتلةٌ واحدةٌ لا خليّةٌ لكلّ غياب =====
         كانت تُبنى خليّةٌ لكلّ وحدة، فالمجانيُّ ثلاثُ خلايا متجاوراتٍ بلونٍ واحد. ولا
         فرقَ في العين ما دامت العتمةُ منخفضة، فإذا سطعت ظهرت بينها **خيوطٌ** من تقريب
         المتصفّح للعروض الكسريّة (تسعُ خلايا في مئةٍ لا تنقسم صحيحا).
         والمعنى لا يحتاجها: المربّعُ خريطةُ **مناطق** لا عدّادُ وحدات، والمؤشّرُ وحدَه
         يقول أين أنت. فتُدمج المتجاوراتُ ذواتُ اللون الواحد كتلةً واحدة، فيصير الأخضرُ
         كتلةً والأحمرُ كتلةً ولا خيطَ بينهما */
      const out = [];
      for (let i = 1; i <= n; i++) {
        const zc = (S.dn > 0 && i >= S.dn) ? 'var(--as-dead)'
          : (S.dedFrom > 0 && i >= S.dedFrom) ? 'var(--as-bad)'
          : i <= S.free ? 'var(--as-ok)' : 'var(--nk-ink)';
        const last = out[out.length - 1];
        if (last && last.c === zc) last.f += 1;
        else out.push({ f: 1, c: zc, o: 1 });
      }
      return out;
    }

    function fillGrade() {
      if (!S.gset) return [{ f: 1, c: SOFT, o: 1 }];
      const p = Math.max(0, Math.min(100, +S.gpct || 0)), b = gband(p);
      if (S.scope === 'mine') return [{ f: 1, c: b.c, o: 1 }];
      return GLD.map(x => ({ f: 1, c: x.c, o: 1 }));
    }

    function meAt(k) {
      if (!S.meOn) return null;
      if (k === 'grade') return S.gset ? gpos(Math.max(0, Math.min(100, +S.gpct || 0))) : null;
      if (k === 'abs')   return absEmpty() ? null : absState().p * 100;
      /* والمادّةُ بلا مؤشّر: الثلاثةُ الأُخَر فيها **موضعٌ يهمّ** (حضورٌ وخطرٌ وحرف)،
         وهذه طريقٌ يُقطع — فيكفيها أن تقول كم قُطع، ولا حاجةَ إلى خطٍّ يقف عنده */
      if (k === 'info')  return null;
      /* الدكتور */
      /* ومن كان الآنَ في الجمعة أو السبت فلا موضعَ له على المحور — ولا يُخترع */
      /* ولا مؤشّرَ على أسبوعٍ لم تُسجَّل فيه ساعة: «الآن» موضعٌ في محورٍ صحيح، لكنّ
         الصندوقَ يقول «لم تسجل ساعاته» — فخيطٌ فيه يَعِد بخبرٍ لا يوجد */
      return docNow().s === 'none' ? null : wkPos(+S.nowday, +S.nowmin);
    }

    /* و«للآن» في اثنين: الغيابُ والدرجةُ حصيلتان تتراكمان، فاللفظُ المجرَّد فيهما
       يُقرأ حكما نهائيّا. والمادّةُ والدكتورُ اسما بندين لا حصيلتين، فلا تُلحق بهما */
    const FACE_CLS = { a: '', b: ' fl--soft', c: ' fl--base', d: ' fl--seg',
                       e: ' fl--hatch', f: ' fl--band', g: ' fl--off' };

    function docSegs() {
      const raw = weekSegs();
      const segs = [];
      if (!raw.length || raw[0].on) segs.push({ w: 0, on: 0 });
      raw.forEach(s => segs.push({ w: s.w, on: s.on }));
      if (segs[segs.length - 1].on) segs.push({ w: 0, on: 0 });

      let cur = -1;
      if (S.zoom && docNow().s === 'on') {
        const me = wkPos(+S.nowday, +S.nowmin);
        let at = 0;
        for (let i = 0; i < segs.length; i++) {
          const a = at, b = at + segs[i].w; at = b;
          if (segs[i].on && me != null && me >= a - 1e-9 && me <= b + 1e-9) { cur = i; break; }
        }
      }
      if (cur < 0) return segs.map(s => ({ w: s.w, on: s.on, cur: 0 }));

      const m = Math.max(0, Math.min(40, +S.zmar));
      const pre = segs.slice(0, cur), post = segs.slice(cur + 1);
      const sum = a => a.reduce((t, s) => t + s.w, 0);
      /* والقسمةُ بالتناسب، فإن كانت الزمرةُ كلُّها أصفارا قُسمت بالتساوي — ولا تُقسم
         على صفرٍ أبدا */
      const share = (a, tot) => a.map(s => (tot > 0 ? s.w / tot * m : m / Math.max(1, a.length)));
      const wp = share(pre, sum(pre)), wq = share(post, sum(post));
      /* ===== والشظيّتان تُوحَّدان: ما فيهما ليس خبرا =====
         الأسبوعُ فيه نافذتان، فإذا ضُغط ما عدا الجاريةَ في ثلاثةٍ ونصفٍ في المئة صارت
         الأخرى **خيطا أخضرَ بعرض عُشر بكسل** داخل الشظيّة الحمراء — بحرفين لها يُقرآن
         خطّين. وذاك تشويشٌ لا خبر: لا أحدَ يقرأ ساعةً من عُشر بكسل، وإنّما تُقرأ
         الشظيّةُ «ثمّة أسبوعٌ وراء هذا» فحسبُ.
         فيُنزع الوسمُ عن كلّ ما ليس النافذةَ الجارية: تصير الشظيّتان سطحين مصمتين
         بلون «غير المتاح» — ولا يزيد عددُ الخلايا ولا ينقص، فيبقى الانتقالُ سليما */
      const out = [];
      pre.forEach((s, i) => out.push({ w: wp[i], on: 0, cur: 0 }));
      out.push({ w: 100 - 2 * m, on: 1, cur: 1 });
      post.forEach((s, i) => out.push({ w: wq[i], on: 0, cur: 0 }));
      return out;
    }

    /* أمقرَّبٌ هو؟ — والحدودُ المرسومةُ للنافذة الجارية معه */
    function zoomWin() {
      if (!S.zoom || docNow().s !== 'on') return null;
      const me = wkPos(+S.nowday, +S.nowmin);
      if (me == null) return null;
      let at = 0;
      for (const s of weekSegs()) {
        const a = at, b = at + s.w; at = b;
        if (s.on && me >= a - 1e-9 && me <= b + 1e-9) return [a, b];
      }
      return null;
    }

    function flHTML(k, op) {
      /* و‎--i‎ ترتيبُ الخليّة: به يُؤخَّر كلٌّ عن أختها فتقوم موجةً لا صفّا واحدا */
      const segs = (NKFILL[k] || (() => []))().map((x, i) => {
        /* ===== و‎f‎ عددٌ لا علم =====
           كان يُقرأ «أمرنٌ هو؟» فيأخذ كلُّ مرنٍ نصيبا واحدا. ولمّا صارت مناطقُ الغياب
           تُدمج كتلا احتاجت الكتلةُ أن تأخذ بقدر ما ابتلعت — فيُكتب العددُ نموّا.
           ومن كان واحدا بقي على حاله سواءً بسواء */
        const w = (x.f ? 'flex:' + x.f + ' 1 0' : 'flex:0 0 ' + Math.max(0, Math.min(100, x.w)) + '%')
          + ';--i:' + i;
        /* والصنفُ يُغني عن السطر: النقوشُ تُكتب في الجلد فتُبدَّل بثيمٍ لا بإعادة بناء */
        if (x.cls) return `<i class="${x.cls}" style="${w}"></i>`;
        const bg = x.hollow ? `background:transparent;box-shadow:inset 0 0 0 1.5px ${x.c}`
          : x.grad ? `background:${x.grad}` : `background:${x.c}`;
        const h = x.h != null ? `;align-self:flex-end;height:${x.h}%` : '';
        return `<i style="${w};${bg};opacity:${x.o}${h}"></i>`;
      }).join('');
      /* وأربعةُ خيوطٍ تفصل الأيّامَ الخمسة — للدكتور وحدَه، وهي فوق الشرائح لا بينها */
      const sep = k === 'doc' && S.dsep
        ? [20, 40, 60, 80].map(x => `<i class="wk-sep" style="left:${x}%"></i>`).join('') : '';
      /* ولتايم لاين الأسبوع عتمتُه هو: نقشٌ في ‎22٪‎ لا يُقرأ */
      const o = k === 'doc' ? 1 : op / 100;
      const z = k === 'doc' ? zoomWin() : null;
      return `<span class="fl${FACE_CLS[S.face] || ''}${k === 'doc' ? ' fl--wk dt-' + S.dtheme : ''}`
        + `${z ? ' is-zoom' : ''}" style="--op:${o}">${segs}${sep}</span>`;
    }

    /* أمُطابِقةٌ هذه الحالةُ لما بين يديك الآن؟ — تُقرأ ولا تُحفظ */
    const markGrp = v => { const m = MARKS.find(x => x && x[0] === v); return m ? m[1] : 'in'; };

    /* أفارغٌ هذا المربّع؟ — تُسأل من المنطق لا من النصّ المعروض */
    const isEmpty = k => (k === 'info' ? !(+S.topics)
      : k === 'doc' ? docNow().s === 'none'
      : k === 'abs' ? absEmpty() : !S.gset);

    const MARKS = [
      /* الطائفةُ الأولى: تسكن الأرضيّةَ ولا تبلغ حافّتَي الصندوق */
      ['line',  'in',  'الخط',     'خيط ٢ بطوق ورقي، دون حافتي الصندوق — الاصل'],
      ['wide',  'in',  'العريض',   'اغلظ: ٥ — يُرى من بعيد'],
      ['notch', 'in',  'الفجوة',   'لا حبر: يُقص من الارضية بلون الورق — بياض خالص'],
      ['dot',   'in',  'الحبة',    'دائرة مصمتة في وسط الصندوق'],
      ['ring',  'in',  'الحلقة',   'دائرة جوفها ورق وحدها حبر'],
      ['caret', 'in',  'المثلث',   'يتدلى من السقف رأسه الى اسفل'],
      ['ticks', 'in',  'الشرطتان', 'شرطة فوق وشرطة تحت ووسطه مكشوف'],
      ['soft',  'in',  'الطيف',    'هالة لينة: «هنا تقريبا» لا «هنا بالضبط»'],
      ['none',  'in',  'بلا',      'هل تكفي الارضية بلا موضع؟'],
      /* الطائفةُ الثانية: تقطع الصندوقَ من حافّةٍ إلى حافّة، ولها طرفان يُرَيان */
      ['full',  'out', 'القاطع',   'من السقف الى القاع بلا فرجة ولا طرف'],
      ['pin',   'out', 'الابرة',   'ارق ما يقطع: خيط ١٫٥ من الحافة الى الحافة'],
      ['nail',  'out', 'المسمار',  'يقطع ولرأسه حبة على الحافة العليا'],
      ['dumb',  'out', 'الدبوس',   'يقطع وله حبتان على الحافتين'],
      ['ibeam', 'out', 'الشوكة',   'يقطع وله شرطتان مسطحتان على الحافتين'],
      ['split', 'out', 'الشق',     'حبر عند الحافتين وبياض في عبوره: لا يُقطع النص'],
      ['lance', 'out', 'الرمح',    'رأس مثلث على السقف وذنب يقطع الى القاع'],
      ['jaws',  'out', 'الفكان',   'مثلث من السقف ومثلث من القاع ولا يعبر الوسط'],
      ['brack', 'out', 'القوسان',  'زاويتان تحضنان الموضع من السقف ومن القاع'],
      /* الطائفةُ الثالثة: تتجاوز حافّةَ الصندوق فتخرج فوقه وتحته */
      ['tpin',   'thru', 'الوتد العابر',    'خيط يخرج من الحدين ولا شيء غيره'],
      ['tnail',  'thru', 'المسمار العابر',  'يعبر ورأسه حبة فوق الصندوق لا عليه'],
      ['tdumb',  'thru', 'الدبوس العابر',   'يعبر وله حبتان خارج الحدين'],
      ['tbeam',  'thru', 'الشوكة العابرة',  'يعبر وله شرطتان مسطحتان خارج الحدين'],
      ['tlance', 'thru', 'الرمح العابر',    'رأس فوق الصندوق وذنب يخرج من تحته'],
      ['tjaws',  'thru', 'الفكان الخارجان', 'مثلثان خارج الصندوق يشيران اليه ولا يدخلانه'],
      ['tbrack', 'thru', 'القوسان الخارجان','زاويتان خارج الحدين تحضنان الموضع'],
      ['tticks', 'thru', 'الشرطتان الخارجتان', 'شرطتان خارج الحدين وحدهما — لا يدخل الصندوق شيء']
    ];
    const NKFILL = { info: fillInfo, doc: fillDoc, abs: fillAbs, grade: fillGrade };
    const NUMF = { info: numInfo, doc: numDoc, abs: numAbs, grade: numGrade };
    /* ثوابتُ الثيم — هي قيمُ الاقتراح المعتمَد، لا مقابضَ لها ههنا */
    const THEME = {
      fInfo: 'a', fAbs: 'a', fGrade: 'a', face: 'a', scope: 'full',
      itheme: 'a', dtheme: 'd', dsep: 0, meOn: 1, lfmt: 'w', tmode: 'timer',
      zoom: 1, zmar: 3.5, wkmin: 1.5, d0: 480, d1: 1110,
    };
    function build(k, data, tools) {
      S = Object.assign({}, THEME, data);
      const n = (NUMF[k] || (() => ({ big: '—', sub: '' })))();
      const at = meAt(k);
      const me = at == null ? ''
        : `<i class="fl-me" style="${S.dir === 'ltr' ? 'left' : 'right'}:${at}%"></i>`;
      /* ===== وغلافُ الكتاب يمينَ الرقم — للمادّة وحدَها =====
         حكمُ المختبر: «المادّةُ وحدَها تحمله، هو هويّتُها، والثلاثةُ الأُخَر لا كتابَ
         لها». ويُوضع **اوّلَ** ابناء السطر لانّ الصفَّ عربيٌّ فاوّلُ الابناء يمينُه.
         وههنا **كتابُك انت** لا نموذجُ المختبر (كان فيه «نظم ٢٠١» مكتوبا في الوسم):
         صورتُك ان رفعتَها، والا فالغلافُ البديلُ بكود المادّة. و‎bookMini‎ هي بانيتُه
         في الموقع كلِّه فلا يُستأنف رسمُه — الغلافُ بناءٌ ثلاثيٌّ (وجهٌ وكعبٌ وظهر)
         بجلدٍ مكتوب، ومن اعاد رسمَه خالفه.
         و‎baseOf‎ لا ‎nookCode‎: مفتاحُ المعمل «‎ICS 104::معمل‎» يُقسم على اوّل فراغٍ في
         ‎bookMini‎ فيصير الرقمُ «‎104::معمل‎» على وجه الغلاف — والغلافُ للمادّة لا للنشاط
         (وهو الحكمُ نفسُه في غلاف الواسع ‎nkInfoFill‎، فلا يفترق الوضعان) */
      const bkn = k === 'info'
        ? `<span class="fx-bk">${bookMini(nookEntry ? baseOf(nookCode(nookEntry)) : '',
            assetURL(data.bookImg || ''))}</span>`
        : '';
      const hd = `<div class="fx-hd">${bkn}<b class="fx-val">${n.bigH || esc(n.big)}</b>`
        + `<b class="fx-sub">${esc(n.sub)}</b></div>`;
      return `<span class="fl-clip">${flHTML(k, 22)}</span>${me}`
        + `<div class="fx halo" style="--tone:${n.tone || 'var(--nk-ink)'}">`
        + `<div class="fx-col"><span class="fx-cap">${esc(data.cap || '')}</span>`
        + `<div class="fx-swap">${hd}</div></div>`
        + `<span class="fx-tools">${tools}</span></div>`;
    }
    /* ===== وجملةُ الحال في الواسع تُقال من مصدر الضيّق نفسِه =====
       سطرُ عنوان الواسع يقول «‎3 موضوع‎» كما يقوله المربّعُ مطويّا، فلو حُسبت ههنا
       حسابا ثانيا لَافترق الرقمان يوم يتبدّل احدُ الحسابين — وهو عطبٌ لا يُرى الا
       بالمقارنة. فتُصدَّر الجملةُ من ‎numInfo‎ نفسِها، وصيغتُها صيغةُ المختبر:
       رقمٌ ثمّ وحدتُه، فان لم يكن رقمٌ فاللفظُ وحدَه («لا مواضيع») */
    build.say = function (k, data) {
      S = Object.assign({}, THEME, data);
      const n = (NUMF[k] || (() => ({ big: '—', sub: '' })))();
      return (n.big && n.big !== '—') ? (n.sub ? n.big + ' ' + n.sub : n.big) : (n.sub || '');
    };
    return build;
  })();

  /* ============================================================
     المُدخَل — بياناتُ الموقع تُصاغ على ما تنتظره الوحدة
     ============================================================
     وهذا **كلُّ** ما يخصّ الموقعَ في هذا الباب. وكلُّ حقلٍ ههنا مصدرُه دالّةٌ قائمة
     في ‎app.js‎ لا نموذجٌ جديد.
     ===== وفخُّ اسمٍ يلزم التنبّه له =====
     في سياسة الغياب ‎P.late‎ معناها «كم تأخيرا يُعدّ غيابا» (‎lateN‎ في المختبر)،
     وفي سجلّك ‎M.late‎ معناها «كم تأخيرا وقع». اسمٌ واحدٌ لمعنيين، فيُفرَّق ههنا
     صراحةً — ولو خُلطا لَحُسبت السياسةُ سجلًّا والسجلُّ سياسة */
  function nkNarrowData(k, entry, d) {
    if (k === 'info') {
      /* ‏‎bookImg‎ خامٌ كما يُخزَّن، و‎assetURL‎ تُصرّفه عند الرسم (كما في كلّ موضعٍ
         يُعرض فيه غلاف) */
      return { cap: T().nkCourse, topics: liveTopics((d || {}).topics).length, done: 0,
        bookImg: (d || {}).bookImg || '' };
    }
    if (k === 'doc') {
      /* ‏فتراتُه كلُّها، وقتُها بالدقائق لا كائنَ حقلٍ — و‎docMin‎ يفهم الصيغتين.
         وما لم يكتمل طرفاه ليس فترةً تُرسم */
      const v = docValues(entry);
      const hrs = (v.hours || []).filter(h => h && normTime(h.from) && normTime(h.to))
        .map(h => ({ on: 1, day: +h.day || 0, from: docMin(h.from), to: docMin(h.to) }));
      /* ===== واليومُ يومُ اليوم =====
         محورُ الاسبوع فهرسُه ‎الاحد = 0‎ (‎T().days‎ خمسةٌ تبدا بالاحد)، و‎getDay()‎
         الاحدُ فيه صفرٌ كذلك — فالفهرسُ واحدٌ ولا يُزاد عليه. وكانت تُزاد واحدةٌ فيقف
         مؤشّرُ «الآن» على اليوم الذي يلي يومَك.
         والجمعةُ والسبتُ (‎5‎ و‎6‎) خارجَ المحور: ‎wkPos‎ تردّ ‎null‎ فلا مؤشّرَ يُخترع */
      const now = new Date();
      return { cap: T().nkDoctor, hrs: hrs, h1on: 0, h2on: 0,
        nowday: now.getDay(), nowmin: now.getHours() * 60 + now.getMinutes() };
    }
    if (k === 'abs') {
      const P = absValues(entry), M = absMe(entry) || {};
      return { cap: T().absSec, free: +P.free || 0, dedFrom: +P.dedFrom || 0,
        dedAmt: +P.dedAmt || 0, dn: +P.dn || 0,
        lateN: +P.late || 0,          /* سياسةٌ: كم تأخيرا يُعدّ غيابا */
        abs: +M.abs || 0, late: +M.late || 0 };   /* وسجلُّك انت */
    }
    /* ===== والدرجةُ تبدأ من التمام لا من العدم =====
       كان يُشترط ان تكون **رُصدت درجةٌ** في بندٍ واحدٍ على الاقلّ، فيقول المربّعُ اوّلَ
       الترم «لم ترصد درجة» — والوضعُ الواسعُ فوقه يقول `A+ 100%`. خبران متناقضان في
       شاشةٍ واحدة، ومصدرُهما واحد.
       وحكمُ الموقع مقيَّدٌ في ‎gradeStand‎: **ما لم تُدخَل درجتُه فهو تامّ**، فالحزامُ
       يقول «الى اين تصل ان اتممتَ ما بقي» — وهو سقفُك اليومَ ينزل كلّما رُصدت درجةٌ
       دون التمام. فالطالبُ يبدأ ومعه ‎A+‎ في جيبه ويُعدَّل بما يسجّل.
       فيُرفع شرطُ الرصد ويبقى شرطُ الوجود وحدَه: لا حكمَ بلا **توزيع**. وذاك لا يقع في
       هذا المربّع اصلا (‎nookGradeBox‎ لا يُبنى الّا بتوزيع) — فيبقى حارسا لا اكثر */
    const st = gradeStand(entry);
    return { cap: T().nkGrade, gset: st == null ? 0 : 1,
      gpct: st == null ? 0 : st };
  }
  /* والوسمُ يُبنى مرّةً: أدواتُه نسخةٌ من ازرار الموقع، ومستمعاهما مفوَّضان */
  function nkNarrowHTML(k, entry, d) {
    try {
      return NK_NARROW(k, nkNarrowData(k, entry, d), nkGearBtn(k) + nkFoldBtn(k));
    } catch (e) { return ''; }   /* مادّةٌ ناقصةُ البيانات لا تُسقط الركن */
  }
  const nkMode = k => (state[NK_KEY[k]] || {}).c ? 'narrow' : 'wide';

  /* ============================================================
     جسدُ الضيّق يتبع الحالَ في الحال
     ============================================================
     المربّعُ يحمل جسدَيه معا: جسدَ الضيّق (‎.fl-clip‎ و‎.fl-me‎ و‎.fx‎) ومتنَ الواسع،
     ويُخفي الوضعُ احدَهما. فما بدّل الحالَ **بلا اعادة رسم** — وذاك مقصودٌ: الرسمُ
     ينزع البؤرةَ من تحت اصبعك ويمحو ما في خانات الدرجة — يُبدّل الظاهرَ وحدَه
     ويترك المخفيَّ على اوّل حالٍ، فاذا طُويتَ المربّعَ وجدتَه يقول خبرا مضى.
     ===== ويُعاد بناؤه لا يُبدَّل نصُّه =====
     رقمُه ولفظُه ولونُه وارضيّتُه ومؤشّرُه تتبع الحالَ كلُّها، وبناؤه سطرٌ واحدٌ من
     مصدره. فتبديلُ نصٍّ فيه يُصلح ما يُرى ويترك ما لا يُرى. */
  function nkNarrowRefresh(k) {
    if (!nookEntry) return;
    const box = document.getElementById('nk-' + k);
    const old = box && box.querySelector('.fx');
    if (!old) return;
    const d = nkNarrowData(k, nookEntry, k === 'info' ? infoValues(nookEntry) : null);
    const t = document.createElement('template');
    t.innerHTML = NK_NARROW(k, d, nkGearBtn(k) + nkFoldBtn(k));
    const fl = box.querySelector('.fl-clip'), me = box.querySelector('.fl-me');
    if (fl) fl.remove();
    if (me) me.remove();
    old.remove();
    box.insertBefore(t.content, box.firstChild);
  }

  /* مربّع «المادة»: فارغ فيه دائرة الإضافة · أو بنوده المركّبة بلا هوية كاتبها.
     btn = 'pick' دائرة الإضافة · 'gear' ترس التعديل · '' بلا أزرار (وضع المعاينة) */
  function infoBoxHTML(d, btn) {
    /* والمواضيعُ تُعدّ متنًا كسائره: صارت في المصغّر بندًا يُرى لا عددًا في رقاقة،
       فمادّةٌ لا شيءَ فيها إلّا مواضيعُها لا يجوز أن تُعرض «فارغةً» — وكانت تُعرض
       فارغةً بلا دائرة إضافةٍ أيضًا، لأنّ ‎filledCount‎ يعدّها فيطلب الترس */
    const has = d && (d.book || d.bookImg || d.type || d.lang || d.rel || d.desc || liveTopics(d.topics).length);
    if (!has) return `<div class="nk-box nk-box--empty"><h3 class="nk-t">${T().nkCourse}</h3>${btn === 'pick' ? nkPickBtn('info') : ''}</div>`;
    /* الصدَفةُ وحدَها تُبنى هنا — وجوفُها يملؤه ‎nkInfoFill‎ بعد أن يستقرّ في الصفحة:
       فما يظهر لا يُعرف إلّا بالقياس، والقياسُ لا يكون على متنٍ لم يُلحق بعد */
    return `<div class="nk-box nk-box--mini" id="nk-info" data-k="info" data-m="${nkMode('info')}"
        style="height:${state.nkInfo.h}px">
        <div class="nkm" id="nk-info-body"></div>
        ${nkSB()}
        <span class="fx-tools fx-tools--w">${nkGearBtn('info')}${nkFoldBtn('info')}</span>
        ${nkNarrowHTML('info', null, d)}
        ${nkiRZ()}
      </div>`;
  }

  /* ============================================================
     مربّع «المادة» نافذةٌ مرنة — والمقاسُ هو الذي يقرّر ما يظهر
     ============================================================
     (‏‎ROADMAP-NOOK-INFO-MINI.md‎ §٧ · المختبر ‎RE\nook-info-mini-lab‎)
     ليس في المربّع «عناصرُ تُعرض دائمًا وأخرى تُخفى دائمًا»، بل **سُلَّمُ أولويّة**
     يُملأ بالقياس: كلُّ جزءٍ يُوضع ثمّ يُسأل الجوفُ «هل فِضتَ؟» — فإن فاض رُدّت
     الوضعةُ ووقف السلّم عندها. فالخطوطُ والالتفافُ والفجواتُ داخلةٌ في الحكم بلا تقدير.

       [١+٢] العنوانُ ومعه الكتابُ إلى يساره ← لا يسقط أبدًا (فيه المطلوبُ نفسُه)
       [٣] المواضيع           ← تملأ ما بقي موضوعًا موضوعًا، وتقف عند أوّل فيض
       [٤] «‎+N‎ موضوعًا»       ← تُوضع ولو على حساب آخر موضوع
       [٥] بقيّةُ البنود       ← اللغةُ والنوعُ والاعتماد، صندوقًا صندوقًا بما يسع
       [٦] الوصف              ← إن بقي بعدهنّ فراغٌ يسعه

     ===== والمواضيعُ متنُ المربّع لا حاشيتُه =====
     كان يُحجز للرقاقات والوصف فراغٌ أدنى (‎34‎ و‎48‎ بكسل) **قبل** المواضيع، حِفظًا لهما
     من أن تلتهمَ المواضيعُ كلَّ فراغٍ فلا يظهر غيرُها. ونُقض ذلك بحكم صاحب الموقع:
     المربّعُ مربّعُ المادّة، ومتنُه مواضيعُها — فمن ضيّقه يريد أن يرى المواضيعَ لا
     لغةَ التدريس ولا نسبةَ الاعتماد. فذهب الحجزُ ومعه ‎free()‎ التي لم يبقَ لها قارئ.
     ولم يُبدَّل شيءٌ في **الشجرة**: المواضيعُ كانت ولا تزال تحت الكتاب مباشرةً، وإنّما
     انقلبت **رتبةُ القسمة** — فصار موضعُها ورتبتُها واحدًا، والرقاقاتُ والوصفُ يهبطان
     تحتها في الرسم كما هبطا في الحقّ. */
  const NKI_NARROW = 150, NKI_WIDE = 290;   /* عتبتا العرض: حبّاتٌ بلا أسماء · عمودان */
  function nkInfoFill() {
    const box = document.getElementById('nk-info');
    const mb  = document.getElementById('nk-info-body');
    if (!box || !mb || !nookEntry) return;
    /* ===== ولا يُقاس جوفٌ خارجَ الرسم =====
       في الضيّق ‎.nkm‎ ‎display: none‎ (يُخفيها الوضع)، فكلُّ مستطيلٍ فيها صفرٌ —
       والسلّمُ يُقاس على الاصفار فيقبل كلَّ شيءٍ او يردّ كلَّ شيء. فلا يُملأ حتّى
       يُنشر، والنشرُ يُنادي ‎nkInfoFill‎ في حينه */
    if (box.dataset.m === 'narrow') { mb.innerHTML = ''; return; }
    const v = infoValues(nookEntry);
    mb.innerHTML = '';
    /* ===== القياس: ذيلُ آخر ابنٍ لا ‎scrollHeight‎ =====
       ‏‎scrollHeight‎ لا ينزل عن ‎clientHeight‎ أبدًا، فحسابُ «الفراغ الباقي» به صفرٌ
       دائمًا وتموت العتباتُ صامتةً. فالمقيسُ ذيلُ آخر ابنٍ منسوبًا إلى رأس الجوف */
    const cs = getComputedStyle(mb);
    const padT = parseFloat(cs.paddingTop) || 0, padB = parseFloat(cs.paddingBottom) || 0;
    /* ===== والقياسُ على القامة المقصودة لا على التي تحت الحركة =====
       الصندوقُ ينتقل قامةً في ‎460ms‎ (‎transition: height‎ في جلده)، والملءُ يقع بعد
       قلب الوضع **مباشرةً** — فيقيس الجوفَ ‎42‎ بدل ‎208‎، فلا يسع الا سطرَ العنوان.
       ثمّ تنتهي الحركةُ ولا مُعيدَ للملء، فيبقى المربّعُ سطرا واحدا مهما وُسّع.
       فتُقرأ القامةُ المكتوبةُ في السمة — وهي **منتهى** الانتقال — ويُنقص منها حدُّ
       الصندوق. وبها يُملأ الجوفُ من اوّل اطار، فيُكشف المتنُ بنموّ المقصّ لا بوثبةٍ
       بعد نصف ثانية.
       ودرسٌ: كلُّ قياسٍ يقع في اطار قلبِ الحال يقيس **ما كان** لا ما سيكون، ما دام
       بينهما انتقال */
    const bcs = getComputedStyle(box);
    const chrome = (parseFloat(bcs.borderTopWidth) || 0) + (parseFloat(bcs.borderBottomWidth) || 0);
    const goal = parseFloat(box.style.height);
    const inner = () => goal ? Math.max(0, goal - chrome) : mb.getBoundingClientRect().height;
    const used = () => {
      const last = mb.lastElementChild;
      return last ? last.getBoundingClientRect().bottom - mb.getBoundingClientRect().top + padB : padT + padB;
    };
    /* ===== ثمّ تقاعد السلّمُ وحلّ محلَّه التمرير =====
       كان كلُّ جزءٍ يُوضع ثمّ يُسأل «أفِضتَ؟»، فما لم تبلغه القامةُ **يُمحى** من
       الشاشة ولا سبيلَ اليه الّا باطالة المربّع. والقاعدةُ التي استقرّت في
       ‎RE/nook-four‎ (وتعليقُها منقولٌ في هذه الورقة): **ما لا يسعه المربّعُ يُمرَّر
       اليه لا يُمحى** — فيبقى الشريطُ شاهدا انّ ثَمّ ما لم تره.
       فيُفتح البابُ ههنا سطرا واحدا. و‎inner()‎ و‎used()‎ يبقيان: من اراد ردَّ السلّم
       يوما ردَّ هذا السطرَ وحدَه ولا يُعاد بناءُ شيء */
    const fits = () => true;
    /* ‏‎host‎: الحاضنُ إن كان غيرَ الجوف (سلّةُ المواضيع تبتلع «‎+N‎»). والقياسُ لا
       يتبدّل بذلك: ‎used()‎ يقيس ذيلَ آخر ابنٍ **للجوف**، وذيلُ السلّة يشمل ما فيها
       وحشوتَها السفلى — فوضعُ الزرّ داخلها محسوبٌ كوضعه بعدها سواءً بسواء */
    /* والمضيفُ الافتراضيُّ هو الجوفُ الجاري لا ‎.nkm‎: العنوانُ وحدَه يثبت فوقه */
    let sc = null;
    const put = (html, after, host) => {
      const t = document.createElement('template');
      t.innerHTML = html.trim();
      const el = t.content.firstElementChild;
      if (after) after.parentNode.insertBefore(el, after.nextSibling); else (host || sc || mb).appendChild(el);
      if (!fits()) { el.remove(); return null; }
      return el;
    };

    const cover = (v.book || v.bookImg)
      /* ‏baseOf‎ لا ‎nookCode‎: مفتاحُ المعمل «‎ICS 104::معمل‎» يُقسم على أوّل فراغٍ في
         ‏‎bookMini‎ فيصير الرقمُ «‎104::معمل‎» على وجه الغلاف. والغلافُ للمادّة لا للنشاط */
      /* ولا دائرةَ ههنا: موضعُ دائرةِ الأمّ غلافُ الرفّ الكبير في بِكرة الترم
         (‎statHTML‎)، لا هذا الغلافُ الصغير — وهو موضعٌ صحّحه صاحبُ الموقع */
      ? `<span class="nkm-bk__c">${bookMini(baseOf(nookCode(nookEntry)), assetURL(v.bookImg))}</span>` : '';
    /* ===== [١+٢] العنوانُ والكتابُ صارا شيئًا واحدًا =====
       كان العنوانُ سطرًا وحدَه والكتابُ سطرًا تحته، والعنوانُ أوّلَ ما يسقط. وقد صار
       الكتابُ إلى يساره كما لإخوته الثلاثة مستطيلٌ يسار عناوينها — فاستوت الأربعة.
       ولمّا اجتمعا **لم يعد العنوانُ يسقط**: إسقاطُه اليومَ إسقاطُ الكتاب، والكتابُ هو
       المطلوبُ نفسُه. فيُلحق ولو فاض (كما كان الكتابُ يُلحق)، ويبقى سطرٌ واحدٌ يُرى في
       أقصر قامةٍ يبلغها المربّع — وهو أنفعُ من عنوانٍ يقول «المادة» وحدَه.
       واسمُ العنوان في حامل (‎.nk-ittl‎): كان نصًّا عاريًا، والنصُّ العاري في صفٍّ مرنٍ
       عضوٌ يقبل الانكماشَ ولا يقبل القصَّ — فيُبتر بترًا */
    /* ===== والكتابُ نزل من سطر العنوان الى صفٍّ خاصٍّ به =====
       كان حشوَ السطر يزاحم العنوانَ، فيضيق فيصغر اسمُه الى **سبعةِ بكسلات**
       (‎#nook .nkm .nk-t .nkm-bk__n‎) ويُقصّ الى سطرٍ واحد. فاذا نزل الى صفّه سقط عنه
       ذلك التقييدُ وعاد الى قدّه الاصليّ (‎12.5px‎ في سطرين) **بلا تصريحٍ جديد** —
       القاعدةُ مشروطةٌ بـ‎.nk-t‎ فتسقط بخروجه منها.
       وخلا سطرُ العنوان لجملة الحال («‎3 موضوع‎») كأخوَيه الدكتور والغياب، بالصنف
       نفسِه (‎.nk-hnow‎). وهو حكمُ ‎RE/nook-four‎ بعد ان جُرّب الوجهان.
       وكلاهما لا يسقط ولو فاض: العنوانُ يقول اين انت، والكتابُ هو المطلوبُ نفسُه */
    const say = NK_NARROW.say('info', nkNarrowData('info', null, v));
    const hd = `<h3 class="nk-t"><span class="nk-ittl">${T().nkCourse}</span>`
      + (say ? `<span class="nk-hnow">${esc(say)}</span>` : '') + `</h3>`;
    /* ===== وعنوانُ المادّة يبقى ثابتا كاخوته =====
       هو الوحيدُ الساكنُ **داخل** جوفه (‎.nkm‎)، فلو مُرّر الجوفُ مرّ معه — وثلاثةٌ
       تثبت عناوينُها وواحدٌ يجري، وذاك اضطرابٌ لا اتّساق. فيُلفّ ما بعدَه في جوفٍ
       داخليّ (‎.nkm__scroll‎) يحمل فجوةَ ‎.nkm‎ نفسَها، ويبقى العنوانُ فوقه بجلده
       الذي هو عليه (‎#nook .nkm .nk-t‎ لا يزال ينطبق: العنوانُ لم يخرج من ‎.nkm‎) */
    mb.insertAdjacentHTML('beforeend', hd);
    mb.insertAdjacentHTML('beforeend', '<div class="nk-sc"><div class="nkm__scroll"></div></div>');
    sc = mb.querySelector('.nkm__scroll');
    const bkh = `<div class="nkm-bk">${cover}<b class="nkm-bk__n">${esc(v.book) || '—'}</b></div>`;
    sc.insertAdjacentHTML('beforeend', bkh);
    const bk = sc.lastElementChild;

    /* ===== [٣] المواضيعُ تُملأ قبل غيرها =====
       ولا تُقطع الملّاءةُ إن سقطت (كانت ‎return‎): الرقاقاتُ والوصفُ بعدها في السلّم،
       فإن لم يسع المربّعُ حتّى سلّةَ المواضيع فقد يسع رقاقةً واحدة — والقياسُ وحدَه
       يقول، لا حكمٌ مسبق */
    const tps = liveTopics(v.topics);
    if (tps.length) {
      const w = box.getBoundingClientRect().width;
      const tier = w < NKI_NARROW ? 'dots' : (w >= NKI_WIDE ? 'cols' : 'rows');
      const wrap = document.createElement('div');
      wrap.className = tier === 'dots' ? 'nkm-dots' : tier === 'cols' ? 'nkm-cols' : 'nkm-tps';
      bk.parentNode.insertBefore(wrap, bk.nextSibling);
      if (!fits()) wrap.remove();
      else {
        let n = 0;
        for (let i = 0; i < tps.length; i++) {
          const t = tps[i], nm = esc(t.name || '') || '—';
          const html = tier === 'dots'
            ? `<span class="nkm-o" title="${T().chTag}${esc(t.num || '')} · ${nm}">${i + 1}</span>`
            : `<span class="nkm-tp"><span class="nkm-o">${i + 1}</span><span class="nkm-t">${
                tier === 'cols' ? '' : `<i class="nkm-g">${T().chTag}${esc(t.num || '')}</i>`}${nm}</span></span>`;
          const tp = document.createElement('template');
          tp.innerHTML = html;
          const el = tp.content.firstElementChild;
          wrap.appendChild(el);
          if (!fits()) { el.remove(); break; }
          n++;
        }
        if (!n) wrap.remove();
        else {
          let rest = tps.length - n;
          if (rest > 0) {
            /* «‎+N‎» في ذيل السلّة من داخلها — خبرُ المواضيع مع المواضيع لا تحتها.
               وتُوضع ولو على حساب آخر موضوع: أن تعرف أنّ وراءه بقيّةً أنفعُ من
               موضوعٍ زائدٍ لا تعرف أنّه الأخير */
            const more = k => put(`<button type="button" class="nkm-more">+${k} ${T().topicsWord(k)}</button>`, null, wrap);
            if (!more(rest) && wrap.lastElementChild) {
              wrap.lastElementChild.remove(); n--; rest = tps.length - n;
              more(rest);
            }
          }
        }
      }
    }

    /* ===== [٥][٦] وما فضل عن المواضيع: بقيّةُ البنود صناديقَ =====
       بنودُ «المادة» ستّةٌ (‎INFO_SLOTS‎): كتابٌ ولغةٌ ونوعٌ واعتمادٌ ومواضيعُ ووصف.
       وكان ثلاثةٌ منها رقاقاتٍ (‎.peek-chip‎) والوصفُ فقرةً عاريةً، فتُقرأ حواشيَ لا
       بنودًا — وقد صار للكتاب صندوقٌ وللمواضيع صندوق. فأُلبست الأربعةُ ثوبَهما.
       ===== وتُوضع واحدًا واحدًا لا صفًّا واحدًا =====
       الصفُّ كان عنصرًا واحدًا يُقاس جملةً: إن لم يسع سقطت الثلاثةُ معًا ولو كان في
       المربّع فسحةٌ لواحدٍ منها — وذاك سببُ غيابها. فصار الحاضنُ (‎.nk-chips‎) يُلحق
       فارغًا ثمّ يُملأ صندوقًا صندوقًا ويقف عند أوّل فيض، ويُردّ إن لم يقبل شيئًا.
       وهي تُلحق في ذيل الجوف، فتقع تحت المواضيع رسمًا كما وقعت رتبة */
    const bx = (lab, val) => `<span class="nkm-bx"><i>${esc(lab)}</i><b>${esc(val)}</b></span>`;
    const rest = [];
    if (v.lang) rest.push([T().courseLang, T().langs[v.lang]]);
    if (v.type) rest.push([T().courseType, T().ctypes[v.type]]);
    if (v.rel)  rest.push([T().relLabel, v.rel + '%']);
    if (rest.length) {
      const row = document.createElement('div');
      row.className = 'nk-chips';
      sc.appendChild(row);
      if (!fits()) row.remove();
      else {
        let m = 0;
        for (let i = 0; i < rest.length; i++) {
          if (!put(bx(rest[i][0], rest[i][1]), null, row)) break;
          m++;
        }
        if (!m) row.remove();
      }
    }
    /* ===== والوصفُ يُقصّ بالمقاس لا بثلاثةِ أسطرٍ مكتوبة =====
       كان ‎-webkit-line-clamp: 3‎ ثابتًا، فيقف النصُّ عند ثلاثةٍ ولو أطلتَ المربّعَ
       شبرًا. فصار عددُ الأسطر يُحسب في كلّ ملّاءة:
       · يُلحق الصندوقُ بسطرٍ واحدٍ — أدنى ما يكون — فإن لم يسع رُدّ كسائر البنود.
       · ثمّ يُقسم الفراغُ الباقي على ارتفاع السطر **المقيس** (‎getComputedStyle‎ لا
         رقمٌ مكتوب: من بدّل الخطَّ أو تباعُدَه لا يحتاج أن يبدّل ههنا شيئًا).
       · ثمّ يُصحَّح نزولًا إن أخطأ التقريبُ علوًّا، وصعودًا ما دام في النصّ بقيّةٌ
         مخفيّة وفي المربّع فسحة.
       و‎scrollHeight‎ للفقرة المقصوصة يقول طولَ النصّ كلِّه، فيُعرف به «هل بقي شيء؟»
       بلا عدّ حروفٍ ولا تخمين. والحارسُ ‎g‎ لئلّا تدور الحلقةُ إن كذب القياسُ يومًا */
    if (v.desc) {
      const t = document.createElement('template');
      t.innerHTML = `<div class="nkm-bx nkm-bx--d"><p class="nk-desc nkm-desc">${esc(v.desc)}</p></div>`;
      const el = t.content.firstElementChild, p = el.firstElementChild;
      /* ===== ولا يُقصّ الوصفُ باسطرٍ بعد اليوم =====
         حسابُ الاسطر كان بديلا عن التمرير: يُقاس الفراغُ الباقي فيُقصّ النصُّ عنده.
         ولمّا صار الجوفُ يُمرَّر سقط سببُه — والنصُّ يُعرض كاملا ويُبلغ آخرُه بالشريط */
      p.style.setProperty('-webkit-line-clamp', 'unset');
      sc.appendChild(el);
    }
  }
  /* منبثقةُ المواضيع من المربّع المرن: تُبنى من قيم القُمرة لا من مساهمةٍ في قائمة */
  function nkInfoTopics() {
    if (!nookEntry) return;
    const d = { topics: liveTopics(infoValues(nookEntry).topics) };
    $('#cmt-body').innerHTML = `<div class="cmt-topics">
        <div class="cmt-topics__hd">${T().topicsSec}<i>${d.topics.length}</i></div>
        <div class="cmt-topics__list">${topicRowsHTML(d, true) || `<p class="tp-none">${T().noData}</p>`}</div>
      </div>`;
    document.querySelector('.cmt-modal').hidden = false;   /* المنبثقةُ صنفٌ بلا معرّف — تُبنى في الجافا */
  }
  /* ============================================================
     أربعُ نوافذَ مستقلّة لا شبكةٌ مربوطة
     ============================================================
     كان الصفُّ شبكةً (‎grid‎) بأعمدةٍ كسريّة، وفي الشبكة أمران يربطان الجيران:
     · **القامة**: أبناءُ الصفّ يُمدّون إلى قامة أطولهم (‎align-items: stretch‎)، فمن
       أطال مربّعًا أطال إخوتَه معه.
     · **العرض**: الأعمدةُ تقتسم عرضًا واحدًا، فتوسيعُ عمودٍ **تضييقٌ لغيره** حتمًا.
     فصار الصفُّ مرنًا يلتفّ (‎flex-wrap‎) ورأسُه إلى الأعلى (‎align-items: flex-start‎):
     لكلّ مربّعٍ عرضُه وقامتُه، ومن وسّع مربّعًا لم يمسّ جارَه — وإن ضاق الصفُّ عن
     مجموعهم نزل آخرُهم سطرًا، ولم يُقتطع من أحد.
     ===== والتثبيتُ عند أوّل جرٍّ لا قبله =====
     ما دام لم يُجَرّ عرضٌ قطُّ فالأربعةُ تقتسم الصفَّ بالنِّسب القديمة نفسِها، فتتّسع
     بالشاشة وتضيق بها. فإذا جرَّ صاحبُها عرضَ واحدٍ **ثُبّتت الأربعةُ على أعراضها
     الحاضرة** في تلك اللحظة، ثمّ مضى الجرُّ على المجرور وحدَه. ولولا ذلك لَبقي الثلاثةُ
     كسورًا تقتسم ما تركه المجرور — فيتبعونه، وهو عينُ ما نفرّ منه.
     و‎Math.floor‎ في التثبيت لا ‎round‎: التقريبُ علوًّا في أربعةٍ قد يزيد المجموعَ على
     الصفّ فينزل آخرُهم سطرًا بلا سبب.
     ===== ومقبضٌ واحدٌ يعرف مربّعَه من موضعه =====
     ‏‎[].indexOf‎ في أبناء الصفّ: لا مفتاحَ يُكتب في المقبض ولا معرّفَ يُطابَق، فلا
     يبقى اسمٌ في مكانين يفترقان. وترتيبُ ‎NK_SZ‎ ترتيبُ الرسم نفسُه. */
  const NK_SZ = ['nkInfo', 'nkDoc', 'nkAbs', 'nkGrade'];
  const NK_W = [120, 1000], NK_H = [34, 900];
  const nkFour = () => document.querySelector('#nook .nk-four');
  /* والقامةُ المكتوبةُ تجرّ معها ‎min-height: 0‎: على ‎.nk-box‎ حدٌّ أدنى ‎150‎ يغلبها
     فلا تقصر دونه أبدًا. والخاوي يُمسح فيعود المربّعُ إلى حكم الصفّ */
  function nkSzApply(only) {
    const four = nkFour(); if (!four) return;
    NK_SZ.forEach((k, i) => {
      const el = four.children[i];
      if (!el || (only != null && only !== i)) return;
      const sz = state[k];
      /* ‏‎0 1 W‎ لا ‎0 0 W‎: لا ينمو أبدًا (عرضُه عرضُه)، ويقبل الانكماشَ في شاشةٍ أضيقَ
         من مجموع الأربعة — فيَسَع الصفُّ ما فيه ولا ينزل أحدٌ سطرًا ولا يفيض.
         والرقمُ المحفوظ لا يُمسّ: من ضاقت شاشتُه ثمّ اتّسعت وجد نوافذَه كما تركها */
      el.style.flex = sz.w ? '0 1 ' + sz.w + 'px' : '';
      el.style.height = sz.h ? sz.h + 'px' : '';
      el.style.minHeight = sz.h ? '0' : '';
      /* ===== والوضعُ صفةٌ في الوسم تتبع الحال =====
         الطيُّ في هذا الموقع **لا يُعيد البناء** (بحكمٍ سابق: البناءُ يمحو بؤرةَ
         خانات الدرجة). فلو كُتب ‎data-m‎ عند البناء وحدَه لَبقي على اوّل حالٍ ابدا:
         يُطوى المربّعُ فيقصر، ويبقى الجلدُ يعرض متنَ الواسع.
         فيُكتب ههنا — و‎nkSzApply‎ هي المنادَاةُ في كلّ مسار: البناءُ والطيُّ والجرّ */
      /* وابنُ الصفّ هو المربّعُ نفسُه في هذا الموقع، لا عمودٌ يحمله */
      const box = el.classList.contains('nk-box') ? el : el.querySelector('.nk-box');
      if (box) box.dataset.m = sz.c ? 'narrow' : 'wide';
    });
  }
  /* ============================================================
     أدنى عرضٍ للمربّع: ما لا ينزل عنده سطرُ عنوانه إلى سطرين
     ============================================================
     في سطر عنوان كلّ مربّعٍ مستطيلٌ إلى يسار الاسم (حالُ الدكتور · بابُ الغياب ·
     حزامُ الدرجة)، ومتنُه **متبدّل**: كلمةٌ تطول وتقصر، وحرفٌ ونسبةٌ تظهر وتغيب.
     فلا يصلح رقمٌ مكتوبٌ حدًّا: يُقاس في كلّ رسمةٍ ما يحتاجه السطرُ ليبقى سطرًا.
     ===== والقياسُ على شبحٍ لا على الحيّ =====
     الحيُّ مضغوطٌ أصلًا: أبناؤه انكمشوا وقُصّت نصوصُهم، فقياسُه يعطي ما هو عليه لا
     ما يحتاجه. فيُستنسخ السطرُ في شبحٍ خفيٍّ ‎width: max-content‎ وأبناؤه ممنوعون من
     الانكماش، فيقول الشبحُ العرضَ الذي لا يلتفّ عنده شيء.
     · والترسُ يُقاس **مفتوحًا**: هو مطويٌّ إلى صفرٍ حتى يُقصد المربّع، فلو قِيس
       مطويًّا لَضاق الحدُّ سبعةَ عشرَ بكسلًا ثمّ التفّ السطرُ أوّلَ ما تمرّ بالفأرة.
     · و‎max-width‎ لا يُمسّ في الشبح: مَن قُيّد بها فقيدُه من التصميم، وقياسُه بها هو
       قياسُ الحقيقة.
     ===== وإن لم تسع الأربعةُ الصفَّ صُغِّرت لا فاضت =====
     الصفُّ ‎nowrap‎ بحكمٍ سابق، فلو زاد مجموعُ الحدود على عرضه لَفاض. فيُحسب معاملُ
     تصغيرٍ واحدٌ (‎--nkt-s‎) يُزوى به سطرُ العنوان كلُّه — خطًّا وحشوةً ومستطيلًا معًا
     بـ‎zoom‎، لا بـ‎font-size‎ الذي لا يبلغ حشواتِ ما في السطر. وحدُّه ‎.72‎: ما دون ذلك
     لا يُقرأ، وعندها يُترك الفيضُ لأنّ التصغيرَ صار أضرَّ منه */
  /* ===== قدُّ سطر العنوان: ‎.69‎ أصلًا لا ‎1‎ =====
     المربّعاتُ صارت أضيقَ ممّا يسع سطرَ عنوانها بقدِّه التامّ، وقد اختار صاحبُ الموقع
     في المختبر هذا القدَّ بعينه — فهو الأصلُ المكتوب لا نتيجةَ حسابٍ يُصادف.
     والحسابُ لا يرفعه، وإنّما **ينزل به** إن ضاقت الشاشةُ عن الأربعة حتّى عند ‎.69‎.
     و‎NK_TMIN‎ نزل إلى ‎.55‎: كان ‎.72‎ سقفًا لأنّ الأصلَ كان ‎1‎، فلمّا صار الأصلُ ‎.69‎
     لم يبقَ للحدّ القديم معنًى — يمنع النزولَ قبل أن يبدأ */
  const NK_TS = .69, NK_TMIN = .55;
  function nkTitleMin(box) {
    /* ولا ‎:scope >‎: عنوانُ «المادة» ساكنُ جوفِه (‎.nkm‎) لا ابنٌ مباشرٌ للمربّع،
       فلو طُلب ابنًا مباشرًا لَعاد بصفرٍ ولم يُحفظ له حدٌّ أصلًا */
    const t = box.querySelector('.nk-t');
    if (!t) return 0;
    const gh = t.cloneNode(true);
    gh.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;'
      + 'width:max-content;zoom:1;pointer-events:none';
    gh.querySelectorAll('*').forEach(el => { el.style.flexShrink = '0'; });
    /* والزرّان يُقاسان مفتوحين: كلاهما مطويٌّ إلى صفرٍ حتى يُقصد المربّع */
    gh.querySelectorAll('.nk-gear, .nk-fold').forEach(g => {
      g.style.width = '12px'; g.style.marginInlineEnd = '5px'; g.style.opacity = '1';
    });
    box.appendChild(gh);
    const w = Math.ceil(gh.getBoundingClientRect().width);
    gh.remove();
    return w;
  }
  function nkMinFit() {
    const four = nkFour(), nook = document.getElementById('nook');
    if (!four || !nook) return;
    nook.style.setProperty('--nkt-s', String(NK_TS));
    /* والشبحُ يُقاس بقدٍّ تامّ (‎zoom: 1‎) فيعطي الطبيعيَّ، ثمّ يُضرب في المعامل */
    const nat = NK_SZ.map((k, i) => four.children[i] ? nkTitleMin(four.children[i]) : 0);
    const gap = parseFloat(getComputedStyle(four).columnGap) || 0;
    const need = nat.reduce((a, b) => a + b, 0) * NK_TS + gap * (NK_SZ.length - 1);
    const room = four.clientWidth;
    const sc = (need > room && need > 0) ? Math.max(NK_TMIN, NK_TS * room / need) : NK_TS;
    nook.style.setProperty('--nkt-s', String(Math.round(sc * 1000) / 1000));
    /* ===== ولا يُكتب قاعٌ للعرض =====
       كان يُكتب ‎min-width‎ بقدر ما يحتاجه سطرُ العنوان، وذاك **يبدّل عرضَ المربّع
       بتبدّل وضعه**: في الضيّق لا سطرَ عنوانٍ يُقاس (يُخفيه الوضع) فالقاعُ صفر،
       وفي الواسع يُقاس فيقفز. وقِيس على «الغياب»: ‎182 ← 190‎ بمجرّد النشر.
       والعرضُ ملكُ الحافّة التي يجرُّها صاحبُ الموقع، لا يُنقض عليه بقياسِ عنوان.
       وما كان يحميه القاعُ يحميه اليومَ الثيمُ نفسُه: سطرُ العنوان يلتفّ ويُقصّ
       بنقاطٍ عند الضيق (‎.nk-t { flex-wrap: wrap }‎ و‎[data-m="wide"] * { min-width: 0 }‎)،
       ومعامل ‎--nkt-s‎ باقٍ يُصغّر العناوينَ إن ضاق الصفُّ بها.
       فيُنزع القاعُ ويُمحى ما بقي منه في وسمٍ قديم */
    NK_SZ.forEach((k, i) => {
      const el = four.children[i];
      if (el) el.style.minWidth = '';
    });
  }
  /* السحب: المرساةُ أعلى اليمين — فالجرُّ يسارًا يوسّع، والجرُّ نزولًا يُطيل */
  function nkiDrag(e) {
    const h = e.target.closest('[data-nki]');
    if (!h) return;
    const four = nkFour(), box = h.closest('.nk-box');
    if (!four || !box) return;
    const i = [].indexOf.call(four.children, box);
    if (i < 0 || !NK_SZ[i]) return;
    const sz = state[NK_SZ[i]];
    e.preventDefault();
    h.classList.add('on');
    /* ===== والقامةُ لا تُنتقل وهي تُسحب =====
       للصندوق `transition: height` (‎.26s‎ للاربعة و‎.46s‎ للمادّة) — وهو لِمَورِ
       الضيّق⇄الواسع. فان بقي في اثناء الجرّ سار الصندوقُ **خلف** الاصبع بربع ثانيةٍ
       الى نصف، فيُحَسّ الجرُّ مطّاطا لا ممسوكا.
       والقاعدةُ ‎#nook .nk-box.is-rz { transition: none }‎ منقولةٌ من ‎RE/nook-four‎
       وكانت **ميتةً**: لا كاتبَ لصنفها في هذا الموقع. فيُكتب ههنا ويُنزع عند الترك */
    box.classList.add('is-rz');
    const k = h.dataset.nki, x0 = e.clientX, y0 = e.clientY;
    const r = box.getBoundingClientRect(), w0 = Math.round(r.width), h0 = Math.round(r.height);
    const lim = (v, a) => Math.max(a[0], Math.min(a[1], Math.round(v)));
    if ((k === 'w' || k === 'c') && !NK_SZ.every(x => state[x].w)) {
      NK_SZ.forEach((x, n) => {
        const el = four.children[n];
        if (el && !state[x].w) state[x].w = Math.floor(el.getBoundingClientRect().width);
      });
      nkSzApply();
      nkMinFit();   /* والتثبيتُ يُعطي الأربعةَ أعراضًا، فتُرفع عنها الحدود */
    }
    /* ===== وحدُّ التوسيع: ما تركه الجيران =====
       الالتفافُ ممنوع، فالصفُّ ميزانيّةٌ ثابتة: أوسعُ ما يبلغه المجرور هو عرضُ الصفّ
       ناقصًا أعراضَ إخوته وفجواتِهم. فلا ينزل أحدٌ سطرًا ولا يُقتطع من جارٍ — ومن
       أراد توسيعَ مربّعٍ ضيّق جارَه أوّلًا، فالمساحةُ المحرَّرة تصير حدًّا جديدًا.
       ويُحسب مرّةً عند الإمساك: أعراضُ الإخوة لا تتبدّل أثناء الجرّ.
       والفجوةُ تُقرأ من الجلد لا تُكتب رقمًا: من بدّل ‎gap‎ الصفِّ لا يحتاج أن يبدّل
       ههنا شيئًا */
    let wCap = NK_W;
    if (k === 'w' || k === 'c') {
      const g = parseFloat(getComputedStyle(four).columnGap) || 0;
      const others = NK_SZ.reduce((t, x, n) => t + (n === i ? 0 : (state[x].w || 0)), 0);
      const room = Math.floor(four.clientWidth - others - g * (NK_SZ.length - 1));
      /* وأدنى الجرِّ سبعون: الحدُّ المقيسُ يحكم الأصلَ لا اليد، فمن جرّ فقد اختار —
         ولو غُطّي طرفٌ من عنوانه */
      const lo = NK_W[0];
      wCap = [lo, Math.max(lo, Math.min(NK_W[1], room))];
    }
    /* ومن جرَّ فقد خرج عن الطيّ: تُطفأ ‎c‎ وتنقلب أيقونتُه مرّةً واحدةً عند الإمساك */
    if (sz.c) {
      sz.c = 0;
      const fb = box.querySelector('.nk-fold');
      if (fb) { fb.innerHTML = NK_FOLD.in; fb.title = T().nkNarrow; fb.setAttribute('aria-label', T().nkNarrow); }
    }
    const move = ev => {
      if (k === 'w' || k === 'c') sz.w = lim(w0 + (x0 - ev.clientX), wCap);
      if (k === 'h' || k === 'c') sz.h = lim(h0 + (ev.clientY - y0), NK_H);
      nkSzApply(i);
      /* ولا يُملأ إلّا «المادة»: جوفُ الدكتور يُكشف بـ‎@container‎ في الجلد، والغيابُ
         والدرجةُ متنُهما ثابتٌ يُقصّ بالقامة — فلا قياسَ في الجافا لهما */
      if (i === 0) nkInfoFill();
      nkSbSync(box);   /* والقامةُ تبدّلت، فيتبدّل مدى الابهام وظهورُ الشريط */
    };
    const up = () => {
      h.classList.remove('on');
      box.classList.remove('is-rz');
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      save();
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }
  /* قيم تشكيل «المادة» كما حفظها المستخدم (نموذج القيم) — والنموذج المرجعي القديم يُرحَّل قيمًا */
  function infoValues(entry) {
    const bag = nookPicks(entry) || {};
    const base = { book: '', bookImg: '', type: '', lang: '', rel: 0, topics: [], desc: '' };
    if (bag.infoV) return Object.assign(base, bag.infoV, { topics: (bag.infoV.topics || []).map(x => Object.assign({}, x)) });
    const { d } = infoComposed(entry);
    return Object.assign(base, {
      book: d.book || '', bookImg: d.bookImg || '', type: d.type || '', lang: d.lang || '',
      rel: d.rel || 0, topics: (d.topics || []).map(x => Object.assign({}, x)), desc: d.desc || '',
    });
  }
  const hasVal = (v, k) => k === 'book' ? !!(v.book || v.bookImg)
    : k === 'topics' ? !!liveTopics(v.topics).length : !!v[k];
  const filledCount = v => INFO_SLOTS.filter(k => hasVal(v, k)).length;

  function nookInfoBox(entry) {
    const v = infoValues(entry);
    return infoBoxHTML(v, filledCount(v) ? 'gear' : 'pick');
  }

  /* ---------- تشكيل «الدكتور»: نفس نظام «المادة» — قيمٌ تُكتب أو تُسحب من مساهمات الدكتور المختار ---------- */
  const DOC_SLOTS = ['e', 'office', 'hours', 'teach', 'grade', 'd'];
  const docBase = () => ({ dr: '', e: '', bld: '', room: '', hours: [], teach: 0, grade: 0, d: '' });
  function docValues(entry) {
    const bag = nookPicks(entry) || {};
    const v = Object.assign(docBase(), bag.docV || {});
    v.hours = ((bag.docV || {}).hours || []).map(h => Object.assign({}, h));
    return v;
  }
  const docOf = (code, id) => doctorsOf(code).find(x => x.id === id) || null;
  /* ===== والتقييمُ الكلّيُّ له مصدرٌ واحدٌ في الموقع =====
     ‏‎avgDocRating(dr)‎ يعدّل **كلَّ** قيم الشرح والدرجات عبر **كلّ** المساهمات عن هذا
     الدكتور، و‎drRateTag‎ يرسمها نجمةً ورقمًا — وهما يظهران في الفلتر وفي منسدلات
     الاختيار وفي الإعدادات.
     وكنتُ حسبتُه ههنا حسابًا ثانيًا: متوسّطَ رقمَي **المساهمة المختارة وحدَها**. فكان
     المربّعُ يقول ‎9‎ والإعداداتُ تقول ‎8.7‎ — رقمان لشيءٍ واحد، وكلاهما «صحيحٌ» في
     حسابه. وذاك أسوأُ من خطأ: لا يُعرف أيُّهما يُصدَّق.
     فيُقرأ من مصدره، ويُرسم برسمه — فإن تبدّل يومًا تبدّل الموضعان معًا */

  /* ============================================================
     حالُ الدكتور الآن — تُقاس من ساعاته لا تُكتب
     ============================================================
     أربعُ حالاتٍ لا حالتان، والرابعةُ هي التي تُنسى في التصميم وتقع كثيرًا:
       ‏‎on‎    في ساعاته الآن           ⇐ «متاح الآن» ومعه متى ينتهي
       ‏‎soon‎  تبدأ خلال ساعة           ⇐ «قريبًا» ومعه متى تبدأ
       ‏‎off‎   له ساعاتٌ ولمّا تحن       ⇐ متى أقربُ موعدٍ قادم
       ‏‎none‎  لا ساعاتٍ مسجّلة أصلًا    ⇐ «لم تُسجَّل ساعاته»
     ومن لم تُسجَّل ساعاتُه **ليس «غيرَ متاح»** — وإنّما لا يُعرف. ولو جُمعا في حالٍ
     واحدةٍ لَقال المربّعُ خبرًا لا يملكه.
     ===== وترتيبُ الأيّام يلتقي بلا ترجمة =====
     ‏‎T().days‎ خمسةٌ تبدأ بالأحد (أسبوعُ الجامعة)، و‎getDay()‎ الأحدُ فيه صفرٌ كذلك —
     فالفهرسُ واحدٌ ولا يُبنى جدولُ تحويل. والجمعةُ والسبتُ (‎5‎ و‎6‎) لا مدخلَ لهما
     فلا يُوافقان شيئًا من نفسِهما، وهو الصواب.
     ============================================================ */
  const DOC_SOON = 60;   /* «قريبًا» = تبدأ خلال هذه الدقائق */
  /* ===== والمدّةُ تُقال ما دامت قريبة، فإذا بعُدت قيل الوقت =====
     «بعد 20 دقيقة» أنفعُ من «12:30 م»، و«بعد 9 ساعات و30 د» أسوأُ منها: العدُّ يُطيق
     ساعتين أو ثلاثًا ثمّ يصير حسابًا يُفَكّ لا خبرًا يُقرأ. فما دون ‎DOC_GAPMAX‎ مدّةٌ
     وما فوقه ساعة — وهو حدُّ **اللفظ** وحدَه لا حدُّ الحال: الألوانُ الأربعةُ على حالها،
     و‎DOC_SOON‎ فوقه لا يزاحمه */
  const DOC_GAPMAX = 180;
  /* ===== ودقائقُ اليوم تُقرأ من الصيغة التي يكتبها المنتقي =====
     كانت تُقرأ نصًّا: ‎"10:30".split(':')‎. وحقلُ الوقت لا يكتب نصًّا — يكتب كائنًا
     ‎{h,m,ap}‎ (‎normTime‎ ونظائرُها في ‎pkTimeField‎). فكان ‎String({…})‎ يصير
     ‎"[object Object]"‎ وينهار العددُ إلى **صفر** بحكم ‎|| 0‎ — لا إلى ‎NaN‎ يصيح.
     وأثرُه أنّ ساعاتِ الدكتور كلَّها تُقرأ «من ٠٠:٠٠ إلى ٠٠:٠٠»: فلا يُرى «في مكتبه
     الآن» أبدا، ويُحسب أقربُ موعدٍ من منتصف الليل. والنصُّ يبقى مقبولا للقديم
     (‎"HH:MM"‎ بأربعٍ وعشرين) لأنّ ‎normTime‎ توحّد الصيغتين */
  const docMin = t => {
    const o = normTime(t);
    if (!o) return 0;
    const h = (+o.h || 0) % 12;
    return (h + (o.ap === 'pm' ? 12 : 0)) * 60 + (+o.m || 0);
  };
  /* المفردُ والمثنّى والجمعُ في العربيّة — تُنادى من ‎T()‎ العربيّة وحدَها */
  function drUnit(n, one, two, few, many) {
    if (n === 1) return one;
    if (n === 2) return two;
    if (n >= 3 && n <= 10) return n + ' ' + few;
    return n + ' ' + many;
  }
  function docGap(min) {
    min = Math.max(0, Math.round(min));
    return min < 1 ? T().drLess : T().drGap(Math.floor(min / 60), min % 60);
  }
  function docNow(v) {
    const hrs = (v.hours || []).filter(h => h && h.from && h.to);
    if (!hrs.length) return { s: 'none', t: T().drNoHours, p: T().drNoHours };
    const now = new Date(), d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
    /* (١) أفي ساعاته الآن؟ */
    const cur = hrs.find(h => +h.day === d && m >= docMin(h.from) && m < docMin(h.to));
    if (cur) return { s: 'on', t: T().drUntil + ' ' + fmtTime(cur.to), p: T().drPillOn(fmtTime(cur.to)) };
    /* (٢) وإلّا فأقربُ موعدٍ قادم — يُبحث سبعةَ أيّامٍ إلى الأمام فيلتفّ الأسبوع */
    let best = null;
    for (let k = 0; k < 7; k++) {
      const dd = (d + k) % 7;
      hrs.filter(h => +h.day === dd).forEach(h => {
        const at = k * 1440 + docMin(h.from);
        const from = k === 0 ? m : -1;
        if (k === 0 && docMin(h.from) <= m) return;   /* مضى اليومَ */
        if (best === null || at < best.at) best = { at, h, k, from };
      });
    }
    if (!best) return { s: 'none', t: T().drNoHours, p: T().drNoHours };
    const gap = best.at - (best.k === 0 ? m : m);
    const when = (best.k === 0 ? '' : T().days[+best.h.day] + ' ') + fmtTime(best.h.from);
    /* واللفظُ يتبع القُربَ لا الحال: ما دون ‎DOC_GAPMAX‎ مدّةٌ تُعدّ، وما فوقه وقتٌ
       يُقرأ — اليومَ ساعتُه وحدَها، وفي غيره يومُه وساعتُه.
       وسطرُ «الحال» تحت الصورة يبقى على اختصاره: هو حاشيةٌ والشارةُ متن */
    const pill = gap <= DOC_GAPMAX ? T().drPillIn(docGap(gap))
      : (best.k === 0 ? T().drPillAt(fmtTime(best.h.from)) : T().drPillBack(when));
    if (best.k === 0 && gap <= DOC_SOON) return { s: 'soon', t: T().drIn + ' ' + docGap(gap), p: pill };
    return { s: 'off', t: when, p: pill };
  }

  /* ============================================================
     مربّع «الدكتور» — النسخةُ المصغَّرة (‎doc-mini-lab#k‎ «الجامع»)
     ============================================================
     كان المربّعُ أربعةَ أسطرٍ من الشارات: الاسمُ والبريدُ والمكتبُ والساعاتُ والتدريسُ
     والدرجات. وصار **سطرًا يُقرأ بلمحة**: صورةٌ واسمٌ وحال.
     وثلاثُ علاماتٍ للحال في جسمٍ واحد ولا تكرارَ في اجتماعها — كلٌّ تُقرأ على مسافةٍ
     غيرِ مسافة أختها: **الطوقُ** بلمحة، و**النُّدبةُ** بنظرة، و**اللفظُ** بتدقيق.
     وعند ضيق العمود يذهب اللفظُ وتبقى الأُخريان: اجتماعُهنّ سعةٌ لا شرط.
     ===== وجوفُه يتدرّج بالقامة التي تعطيه =====
     بمقابض السحب نفسِها التي لمربّع «المادة» (‎data-nki‎) وحالٍ محفوظةٍ مثلِها
     (‎state.nkDoc‎) — فلا آلةَ سحبٍ ثانيةٌ تُصان. والطبقاتُ تُكشف بـ‎@container‎:
     الجلدُ يقيس في كلّ إطار، فيتبدّل الجوفُ تحت يدك وأنت تجرّ بلا سطرِ جافا يُنادى.
     ============================================================ */
  function nookDocBox(entry) {
    const v = docValues(entry);
    const dr = v.dr ? docOf(nookCode(entry), v.dr) : null;
    if (!dr) return `<div class="nk-box nk-box--empty"><h3 class="nk-t">${T().nkDoctor}</h3>${nkPickBtn('doc')}</div>`;
    const S = docNow(v);
    const nm = dr.name || '—';
    const face = dr.img
      ? `<img src="${dr.img}" alt="">`
      : `<span>${esc(nm.replace(/^د\.\s*/, '').charAt(0))}</span>`;
    const bg = (k, val, ltr) => `<span class="nk-doc__bg"><i>${esc(k)}</i>`
      + `<b${ltr ? ' class="nk-doc__ltr"' : ''}>${esc(val)}</b></span>`;
    const office = (v.bld || v.room)
      ? bg(T().officeLab, [v.bld && T().bldLab + ' ' + v.bld, v.room].filter(Boolean).join(' · '))
      : '';
    const hours = (v.hours || []).filter(h => h && h.from)
      .map(h => bg(T().days[+h.day] || '', fmtTime(h.from) + ' – ' + fmtTime(h.to), true)).join('');
    return `<div class="nk-box nk-box--mini nk-doc" id="nk-doc" data-s="${S.s}"
        data-k="doc" data-m="${nkMode('doc')}"
        style="height:${state.nkDoc.h}px">
      ${nkNarrowHTML('doc', entry)}
      <span class="fx-tools fx-tools--w">${nkGearBtn('doc')}${nkFoldBtn('doc')}</span>
      ${/* ===== ولا لافتةَ حالٍ في ترويسة الواسع =====
           كانت ‎.nk-doc__pill‎ تُعيد بمصباحٍ ولفظٍ («يعود الاحد ١٠:٠٠ ص») ما يقوله
           المربّعُ الضيّقُ نفسُه فوقها — خبرٌ واحدٌ في موضعين وبثوبين.
           فتُسقط، وتحلّ محلَّها **جملةُ الحال** كما في ‎RE/nook-four‎: «٣٥ دقيقة
           ويغادر المكتب» — نصٌّ عارٍ بلا رقعةٍ ولا مصباحٍ ولا تلوينٍ بالحال،
           المطلوبُ خبرٌ لا شارة. وجلدُها ‎.nk-hnow‎ معايَرٌ على قدّ اللافتة
           التي كانت ههنا (‎10.5px‎).
           ومصدرُها ‎numDoc‎ نفسُها التي يقرؤها الضيّق (‎NK_NARROW.say‎)، فلا يفترق
           الوضعان يوما ولا يُحسب الخبرُ حسابين */''}
      <h3 class="nk-t"><span class="nk-doc__ttl">${T().nkDoctor}</span>${(() => {
        const say = NK_NARROW.say('doc', nkNarrowData('doc', entry));
        return say ? `<span class="nk-hnow">${esc(say)}</span>` : '';
      })()}</h3>
      <div class="nk-sc"><div class="nk-doc__scroll">
      ${/* ===== ومتنُ الدكتور يُلفّ في جوفٍ واحد =====
           كانت طبقاتُه ابناءً مباشرين للصندوق، فلا جوفَ له يُقاس عليه الفيضُ ولا
           يُمرَّر. فتُلفّ ليصير له ما لاخوته (‎.nk-body‎ و‎.nkm‎) — وهو حكمُ المختبر */''}
      <div class="nk-doc__top">
        <span class="nk-doc__idw"><span class="nk-doc__id"><span class="nk-doc__avw"><span class="nk-doc__av">${face}</span></span>
          <i class="nk-doc__dot"></i></span>
        <span class="nk-doc__who"><b class="nk-doc__nm">${esc(nm)}</b>${(() => {
          const a = avgDocRating(dr);
          /* والمقياسُ يذهب من الصورة ويبقى في التلميح: مَن سأل «من كم؟» وجده،
             ومَن لم يسأل لم يُزاحَم به */
          return a == null ? '' : `<span class="nk-doc__all" title="${esc(T().drAll)} — ${a.toFixed(1)} / 10">`
            + drRateTag(dr) + '</span>';
        })()}</span></span>
      </div>
      ${/* (ولا طبقةَ «الحال» تحت البروفايل: لفظُها في سطر العنوان يكفي — ‎S.t‎ تبقى
           في ‎docNow‎ لمن يقرؤها، ولا يُرسم الخبرُ الواحدُ في موضعين) */''}
      ${office ? `<div class="nk-doc__t nk-doc__t--where"><div class="nk-doc__row">${office}</div></div>` : ''}
      ${v.e ? `<div class="nk-doc__t nk-doc__t--mail"><div class="nk-doc__row">${bg(T().emailLab, v.e, true)}</div></div>` : ''}
      ${hours ? `<div class="nk-doc__t nk-doc__t--hrs"><div class="nk-doc__row">${hours}</div></div>` : ''}
      ${(v.teach || v.grade) ? `<div class="nk-doc__t nk-doc__t--rate"><div class="nk-doc__row">
          ${/* ===== والمقياسُ عشرةٌ لا خمسة =====
               ‏‎rateBlocks‎ عشرةُ مكعّبات و‎rateVal‎ يقول ‎/10‎ و‎docBase‎ يخزّنها كذلك.
               وكان يُكتب ههنا ‎/5‎، فبطاقةُ من قُيّم ‎7‎ تقول «‎7/5‎» — كسرٌ أكبرُ من واحد.
               وهو خطأُ نسخٍ لا خلافُ مقياس: لا موضعَ ثانيًا في الملفّ يقيس بخمسة */''}
          ${v.teach ? bg(T().teachLab, xtNum(v.teach) + '/' + xtNum(10)) : ''}
          ${v.grade ? bg(T().gradeLab2, xtNum(v.grade) + '/' + xtNum(10)) : ''}
        </div></div>` : ''}
      ${/* ===== ووصفُ الدكتور آخرُ الطبقات — رسمًا ورتبةً =====
           كان يسبق التقييمَ في السيل وإن تأخّرت عتبتُه، فيقع فوقه في الرسم. والرتبةُ
           والموضعُ ينبغي أن يكونا واحدًا: هو أطولُ ما في البند وأقلُّه إلحاحًا، فيقع
           آخرَ ما يُقرأ كما هو آخرُ ما يُكشف.
           وحاملُه ‎.nk-doc__row‎ نفسُه كإخوته فلا حشوةَ ثانيةٌ تُصان */''}
      ${v.d ? `<div class="nk-doc__t nk-doc__t--desc"><div class="nk-doc__row"><p class="nk-doc__d">${esc(v.d)}</p></div></div>` : ''}
      </div></div>
      ${nkSB()}
      ${nkiRZ()}
    </div>`;
  }

  /* ---------- تشكيل «الغياب والتأخير»: نفس نظام «المادة» و«الدكتور» ---------- */
  const ABS_SLOTS = ['free', 'dedFrom', 'dedAmt', 'dn', 'late'];
  function absValues(entry) {
    const bag = nookPicks(entry) || {};
    return Object.assign({ free: 0, dedFrom: 0, dedAmt: 0, dn: 0, late: 0 }, bag.absV || {});
  }
  function nookAbsBox(entry) {
    const v = absValues(entry);
    const any = ABS_SLOTS.some(k => v[k]);
    if (!any) return `<div class="nk-box nk-box--empty"><h3 class="nk-t">${T().absSec}</h3>${nkPickBtn('abs')}</div>`;
    /* «الغياب» بحروف متباعدة (تطويل) في مربّع الركن وحده */
    const body = postPeek('abs', v, 'nkabs', null, false, true, null, absMe(entry) || {})
      .replace(`<i class="v-lab">${T().absLab}</i>`, `<i class="v-lab">${T().absLabWide}</i>`);
    /* ‏‎nk-abs‎ حاويةٌ مسمّاة: شارةُ الحال تُخفي لفظَها في العمود الضيّق بشرطةٍ في
       الجلد لا بسطرِ جافا — الجلدُ يقيس في كلّ إطار، فيظهر اللفظُ تحت يدك وأنت
       تجرُّ المقبضَ بلا نداء */
    /* والعنوانُ يُلبَس حاملًا (‎.nk-abs__ttl‎): كان نصًّا عاريًا فكان عضوًا مرنًا بلا
       ‎min-width‎ يُملى عليه، فيدفع الشارةَ خارج الصندوق فيقصّها ‎overflow‎ — وهي علّةُ
       اختفائها عند الضيق. وبالحامل يقبل الانكماشَ فيلتفّ سطرين وتبقى هي */
    return `<div class="nk-box nk-abs" id="nk-abs" data-k="abs" data-m="${nkMode('abs')}">`
      + `${nkNarrowHTML('abs', entry)}`
      + `<span class="fx-tools fx-tools--w">${nkGearBtn('abs')}${nkFoldBtn('abs')}</span>`
      + `${/* ===== ولا شارةَ بابٍ في ترويسة الواسع =====
             كانت ‎.nk-abs__st‎ بابا يُوارَب بقدر ما استُهلك ولفظا («متوفّر غيابان»)،
             وفوقها في الضيّق **الجملةُ نفسُها** بمصدرها نفسِه: خبرٌ واحدٌ في موضعين
             وبثوبين. وهو حكمُ لافتة الدكتور بعينه (§١٩).
             فتُسقط، وتحلّ محلَّها جملةُ الحال كما في ‎RE/nook-four‎: «‎3/2‎ بمنطقة
             المسموح» — كسرٌ ثمّ المنطقةُ التي بلغتَها، بلا رقعةٍ ولا رسمٍ ولا تلوين.
             ومصدرُها ‎numAbs‎ التي يقرؤها الضيّق (‎NK_NARROW.say‎) فلا يفترق الوضعان */''}`
      + `<h3 class="nk-t"><span class="nk-abs__ttl">${T().absSec}</span>${(() => {
        const say = NK_NARROW.say('abs', nkNarrowData('abs', entry));
        return say ? `<span class="nk-hnow">${esc(say)}</span>` : '';
      })()}</h3>
        <div class="nk-sc"><div class="nk-body pk--peek fold-peek--rich">${body}</div></div>
        ${nkSB()}
        ${nkiRZ()}
      </div>`;
  }

  /* سجلُّك في الغياب والتأخير — نظيرُ ‎gradeMe‎ بالبَغّ نفسِه (محاضرةٌ ومعملٌ كلٌّ
     على حدة)، ومفتاحاه ‎abs‎ و‎late‎ */
  function absMe(entry, create) {
    const bag = nookPicks(entry, create);
    if (!bag) return null;
    if (create && !bag.absMe) bag.absMe = {};
    return bag.absMe || null;
  }

  /* ============================================================
     حالُ الغياب — الحكمُ بين سياسة المادّة وسجلِّك
     ============================================================
     المربّعُ كان يعرض خبرين ولا يعرض ثالثَهما: **سياسةَ المادّة** (كم مجانيّ ومتى
     الخصم ومتى الحرمان) و**سجلَّك** (كم غِبتَ وكم تأخّرت) — وبينهما حكمٌ لم يكن
     يُقال: أين أنت الآن.

     ===== والتأخيرُ يصير غيابًا =====
     السياسةُ تقول «كل N تأخير = غياب واحد»، فالعددُ المؤثّرُ ليس ما غِبتَه وحدَه.
     وهو خبرٌ لم يكن المربّعُ يقوله: يعرض التأخيرَ رقمًا منفصلًا ولا يُعلم أنّه دخل
     الحساب.

     ===== وسُلَّمُ الحكم يُقرأ من الأشدّ إلى الأهون =====
     أوّلُ ما ينطبق هو الحال. ولو قُرئ من الأهون لَقيل «متوفّر غياب» لمن هو على
     حافّة الحرمان، لأنّ السياسةَ قد تجعل المجانيَّ أكثرَ من حدّ الحرمان.
     ============================================================ */
  function absState(A, me) {
    const P = A || {}, M = me || {};
    const fromLate = P.late > 0 ? Math.floor((+M.late || 0) / P.late) : 0;
    const eff = (+M.abs || 0) + fromLate;
    const left = Math.max(0, (P.free || 0) - eff);
    const toDn = P.dn > 0 ? P.dn - eff : Infinity;
    const toDed = P.dedFrom > 0 ? P.dedFrom - eff : Infinity;
    const lost = (P.dedFrom > 0 && eff >= P.dedFrom) ? (eff - P.dedFrom + 1) * (P.dedAmt || 0) : 0;
    const cap = P.dn > 0 ? P.dn : Math.max(P.free || 0, P.dedFrom || 0, 1);
    let s;
    if (P.dn > 0 && eff >= P.dn)                s = 'dn';
    else if (P.dn > 0 && toDn <= 1)             s = 'edge';
    else if (P.dedFrom > 0 && eff >= P.dedFrom) s = 'ded';
    else if (left === 0)                        s = 'spent';
    else if (left === 1)                        s = 'last';
    else                                        s = 'safe';
    return { s, eff, left, toDn, toDed, lost, fromLate, cap, p: Math.max(0, Math.min(1, eff / cap)) };
  }

  /* ===== وجملةُ الحال تُبدَّل في موضعها بلا اعادة بناء =====
     حياةُ هذا المربّع ليست زمنا يجري بل **فعلا منك**: تضغط السهمَ فتسجّل غيابا،
     فينبغي ان تتبدّل الجملةُ في اللحظة نفسِها. ولا يُعاد بناءُ القُمرة لذلك: البناءُ
     ينزع البؤرةَ من تحت اصبعك ويمحو ما في خانات الدرجة.
     وتُبدَّل في **موضعين**: ترويسةُ الواسع وجسدُ الضيّق — كلاهما مبنيٌّ ابدا (الطيُّ
     قلبُ صفةٍ لا هدمُ شجرة)، فلو بُدّل احدُهما لَقال المربّعُ قولين اذا طُوي */
  function absNowSync(entry) {
    if (!entry) return;
    const box = document.getElementById('nk-abs');
    if (!box) return;
    const hn = box.querySelector('.nk-t .nk-hnow');
    if (hn) hn.textContent = NK_NARROW.say('abs', nkNarrowData('abs', entry));
    nkNarrowRefresh('abs');
    absCutSync(entry, box);
  }

  /* ===== وشطبُ الحبّات يتبع الضغطةَ كذلك =====
     الحبّاتُ تقول السياسةَ (أين المجّانيُّ وأين الخصمُ وأين الحرمان)، والشطبُ يقول
     **أين أنت منها** — وهو خبرُ سجلِّك لا خبرُ المادّة. فلمّا كان يُكتب في البناء
     وحدَه (‎absStripHTML‎ تُنادى من ‎postPeek‎) بقي على حاله حتى تُعاد الصفحة: تضغط
     السهمَ فيزيد الرقمُ وتتبدّل جملةُ الحال ويتحرّك الضيّق — والحبّةُ لا تُشطب.
     ولا يُعاد بناءُ المتن لأجلها: بناءُ القُمرة ينزع البؤرةَ من تحت إصبعك ويمحو ما
     في خانات الدرجة (وهي علّةُ ‎absNowSync‎ نفسِها). فيُطلى الشطبُ طلاءً كما تُطلى
     جملةُ الحال: صنفٌ يُقلب على حبّةٍ قائمة.
     ===== والعدُّ ‎eff‎ لا الخام =====
     ثلاثُ تأخيراتٍ غيابٌ، فالمشطوبُ ‎abs + ⌊late / lateN⌋‎ — وهو عينُ حساب
     ‎absStripHTML‎، فلو حُسب ههنا غيرُه لَاختلف الطلاءُ عن البناء في الصفحة الواحدة.
     ===== والفهرسُ من الشجرة لا من المتن =====
     الحبّةُ تحمل رقمَها متنًا، وهو **رقمُ درجةٍ في السلّم** لا فهرسٌ يُعتمد — فيُقرأ
     موضعُها بين إخوتها، ولا يتعلّق الطلاءُ بما كُتب فيها */
  function absCutSync(entry, host) {
    const box = host || document.getElementById('nk-abs');
    if (!box || !entry) return;
    const A = absValues(entry), me = absMe(entry) || {};
    const used = (+me.abs || 0) + (A.late > 0 ? Math.floor((+me.late || 0) / A.late) : 0);
    box.querySelectorAll('.abs-strip').forEach(st => {
      [].forEach.call(st.children, (c, i) => c.classList.toggle('is-cut', i < used));
    });
  }

  /* ============================================================
     خصمُ الغياب والتأخير — يُحسب ولا يُكتب
     ============================================================
     ثلاثةُ أرقامٍ من مساهمة غيرك (سياسةُ المادّة) ورقمان من سجلّك:
     · ‎late‎: كم تأخيرًا يعدل غيابًا (‎lateNote‎: «كل ‎n‎ تأخير = غياب واحد»)، فتُردّ
       تأخيراتُك غياباتٍ بالقسمة الصحيحة — وما دون النِّصاب لا يُحسب شيئًا.
     · ‎dedFrom‎: أوّلُ غيابٍ يُخصَم عليه. وما قبله مجّانيٌّ أو محايد.
     · ‎dedAmt‎: كم يُخصَم عن كلّ غيابٍ من الغيابات المخصومة — لا عن جميعها مرّةً
       واحدة، وهو ظاهرُ الدلالة في شريط الغياب: كلُّ حبّةٍ حمراءَ خصمٌ قائمٌ بنفسه.
     فالخصمُ = ‎dedAmt × (المجموع − dedFrom + 1)‎، ولا يتجاوز المئة.
     وإن لم تُملأ السياسةُ (‎dedFrom‎ أو ‎dedAmt‎ صفرٌ) فلا خصمَ يُحسب — لا صفرٌ يُخترع
     ولا يُقدَّر تقديرًا */
  function absDed(entry) {
    const A = absValues(entry), me = absMe(entry) || {};
    const per = +A.late || 0;
    const eff = (+me.abs || 0) + (per > 0 ? Math.floor((+me.late || 0) / per) : 0);
    const from = +A.dedFrom || 0, amt = +A.dedAmt || 0;
    if (!(from > 0) || !(amt > 0) || eff < from) return 0;
    return Math.min(100, Math.round(amt * (eff - from + 1) * 10) / 10);
  }

