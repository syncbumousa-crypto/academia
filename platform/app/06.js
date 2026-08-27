  /* ===== لوحةُ الألوان: من هويّة الموقع، وتصلح في الجلدين =====
     ألوانُ **التظليل** شفّافةٌ عمدًا (‎alpha‎): الشفّافُ يمتزج بما تحته، فيبقى الحبرُ
     مقروءًا على الورقة البيضاء وعلى السطح الداكن معًا — ولونٌ صلبٌ يُكتب هنا يصلح
     لأحد الجلدين ويُعمي الآخر.
     وألوانُ **الحبر** درجاتٌ وسطى: تُقرأ على الأبيض وعلى الداكن جميعًا، وهي أعيانُ
     ألوان الموقع (الذهبيُّ والبتروليُّ وأخضرُ الاستقرار وبرتقاليُّ التعديل وأحمرُ الحذف) */
  /* ===== أسماءٌ لا قيم =====
     المحفوظُ في نصّ البطاقة صنفٌ (‎cdh-y‎)، وقيمتُه في ‎styles.css‎ بنسختين — واحدةٌ لكلّ
     جلد. فمن ظلّل بالأصفر في الظلام يجده أصفرَ في الضياء، لكن بالدرجة التي تُقرأ هناك.
     والتظليلُ خمسةٌ كما طُلب (أصفرُ · سماويٌّ · برتقاليٌّ · ورديٌّ · أحمر)، والحبرُ ستّةٌ من
     أعيان الموقع — فعلاهما مختلفان: ذاك يُشير وهذا يُقرأ */
  /* ===== واثنتا عشرةَ نغمةً للبابين معًا (‎RE\ink-pal-lab#d‎) =====
     كان البابان يفترقان في العدد والاسم (خمسةٌ للتظليل وستّةٌ للحبر، و«أصفرُ» ههنا
     و«ذهبيٌّ» هناك)، فلا يُعرف أنّهما بابٌ واحد. فصارا نغماتٍ واحدةً باثني عشرَ اسمًا،
     وإنّما يفترقان في الدرجة — فمن ظلّل بالكهرمانيّ وكتب به عرف أنّه لونٌ واحد.
     والأسماءُ حروفٌ خالصةٌ بلا رقم: منظِّفُ البطاقة يقبل ‎/^cd[hi]-[a-z]+$/‎، فمفتاحٌ
     فيه رقمٌ يسقط صنفُه عند الحفظ ويعود اللونُ عاديًّا بلا صياح.
     ومفاتيحُ اللوحة الأولى (‎y‎ · ‎s‎ · ‎o‎ · ‎p‎ · ‎r‎ · ‎gry‎) مرفوعةٌ من ههنا وقواعدُها
     باقيةٌ في ‎styles.css‎: ما لُوّن بها قبل اليوم يُقرأ، ولا تُعرض لتُختار من جديد */
  const CD_PAL = {
    hiliteColor: [['red', 'أحمر'], ['orn', 'برتقاليّ'], ['amb', 'كهرمانيّ'], ['gold', 'ذهبيّ'],
      ['grn', 'أخضر'], ['emr', 'زمرديّ'], ['teal', 'فيروزيّ'], ['pet', 'بتروليّ'],
      ['blu', 'أزرق'], ['ind', 'نيليّ'], ['viol', 'بنفسجيّ'], ['pnk', 'ورديّ']],
    foreColor: [['red', 'أحمر'], ['orn', 'برتقاليّ'], ['amb', 'كهرمانيّ'], ['gold', 'ذهبيّ'],
      ['grn', 'أخضر'], ['emr', 'زمرديّ'], ['teal', 'فيروزيّ'], ['pet', 'بتروليّ'],
      ['blu', 'أزرق'], ['ind', 'نيليّ'], ['viol', 'بنفسجيّ'], ['pnk', 'ورديّ']],
  };
  const cdPalCls = (kind, tok) => (kind === 'hiliteColor' ? 'cdh-' : 'cdi-') + tok;
  /* الأصنافُ المسموحة في نصّ البطاقة — يقرؤها المنظِّف فيُبقيها وحدها */
  const CD_CLS_OK = /^cd[hi]-[a-z]+$/;
  let cdPal = null;   /* أيُّ لوحةٍ منسدلة الآن: تظليلٌ أم حبر؟ */
  const cdUnwrap = el => { const p = el.parentNode; if (!p) return;
    while (el.firstChild) p.insertBefore(el.firstChild, el); p.remove ? el.remove() : 0; };
  /* الحقلُ الذي فيه التحديد — وإليه يُرسَل خبرُ التبديل.
     و‎r‎ اختياريّ: يُسأل به عن حقلِ مدًى بعينه لا عن حقلِ التحديد القائم — يُحتاج حين
     يكون التركيزُ في حقلٍ من حقول اللوحة (الكودُ أو قرصُ الطيف) والتحديدُ قد غادر،
     فيُسأل ‎cdRange‎ عن بيته */
  function cdField(r) {
    const s = window.getSelection();
    const rg = r || ((s && s.rangeCount) ? s.getRangeAt(0) : null);
    if (!rg) return null;
    const n = rg.startContainer;
    const el = n.nodeType === 1 ? n : n.parentNode;
    return (el && el.closest) ? el.closest('.cd-in') : null;
  }
  /* ============================================================
     الحبرُ يجرّ الخطَّ الذي تحته
     ============================================================
     الخطُّ تحت السطر يرسمه **العنصرُ الذي أنشأه** بلونِ نفسِه، ولا يملك من تحته أن
     يُبدّله: قاعدةٌ في CSS لا حيلةَ فيها (‎text-decoration-color‎ للمُنشئ وحدَه، ولا
     يُورَّث من ابنٍ إلى أب). فـ‎<u><span class="cdi-gold">متن</span></u>‎ حبرُه ذهبيٌّ
     وخطُّه بلون الحقل — وهو ما رآه صاحبُ الموقع.
     ولا يُعالَج بكتابة لونٍ صريحٍ على ‎<u>‎: قاعدةُ الملفّ «أسماءٌ لا قيم» — المحفوظُ
     صنفٌ تُقرأ قيمتُه من الجلد، فلونٌ يُكتب ههنا يجمُد على درجةٍ واحدة ولا ينقلب مع
     الفاتح والداكن.
     فالعلاجُ **ترتيبٌ لا لون**: يُرفع غلافُ الحبر فوق غلاف الخطّ، فيرث الخطُّ لونَه
     من أبيه ويصير الأمرُ من نفسِه — ‎<span class="cdi-gold"><u>متن</u></span>‎.
     وما لم يكن الحبرُ يعمّ الخطَّ كلَّه شُقّ الخطُّ حوله أوّلًا: ما قبله في نسخةٍ وما
     بعده في نسخة، فيبقى المرئيُّ كما هو ويصير الملوَّنُ وحدَه في غلافٍ يُرفع */
  /* يشقّ سلفًا حول ابنه فيصير حاويًا له وحدَه — ولا يتبدّل شيءٌ ممّا يُرى */
  function cdSplitAround(node) {
    const p = node.parentNode;
    if (!p || p.nodeType !== 1) return false;
    if (p.firstChild !== node) {
      const pre = p.cloneNode(false);
      while (p.firstChild !== node) pre.appendChild(p.firstChild);
      p.parentNode.insertBefore(pre, p);
    }
    if (p.lastChild !== node) {
      const post = p.cloneNode(false);
      while (p.lastChild !== node) post.insertBefore(p.lastChild, post.firstChild);
      p.parentNode.insertBefore(post, p.nextSibling);
    }
    return true;
  }
  const cdHasDeco = el => {
    const cs = getComputedStyle(el);
    const l = String(cs.textDecorationLine || cs.textDecoration || '');
    return !!l && l.indexOf('none') !== 0;
  };
  /* يرفع غلافَ الحبر فوق **أبعد** سلفٍ يرسم خطًّا دون الحقل — وأبعدُ لا أقرب، وإلّا
     بقي فوقه ثانٍ يرسم بلونه هو */
  function cdDecoLift(span, host) {
    let target = null;
    for (let p = span.parentNode; p && p !== host && p.nodeType === 1; p = p.parentNode) {
      if (cdHasDeco(p)) target = p;
    }
    if (!target || !target.parentNode) return;
    const stop = target.parentNode;
    let guard = 0;
    while (span.parentNode && span.parentNode !== stop && ++guard < 24) {
      const p = span.parentNode;
      if (!p.parentNode || !cdSplitAround(span)) break;
      const kids = [...span.childNodes];
      p.parentNode.insertBefore(span, p);
      kids.forEach(k => p.appendChild(k));
      span.appendChild(p);
    }
  }
  /* ومسحٌ للحقل كلِّه: يُرفع كلُّ غلافِ حبرٍ وقع تحت خطّ — صنفًا كان أو نمطًا صريحًا.
     يُحتاج حيث لا يُعرف الغلافُ بعينه (قرصُ الطيف وحقلُ الكود يكتبان بـ‎execCommand‎
     فلا يردّان ما صنعا)، وهو **مأمونُ التكرار**: ما رُفع مرّةً لا سلفَ له يرسم خطًّا
     فلا يُمسّ ثانية. ويردّ ‎true‎ إن تبدّل شيءٌ — فلا يُرسَل خبرُ حفظٍ على شجرةٍ لم تتغيّر */
  function cdDecoLiftAll(host) {
    if (!host) return false;
    let did = false;
    [...host.querySelectorAll('span')].forEach(el => {
      const mine = (el.style && el.style.color)
        || [...el.classList].some(c => c.indexOf('cdi-') === 0);
      if (!mine || !host.contains(el)) return;
      const before = el.parentNode;
      cdDecoLift(el, host);
      if (el.parentNode !== before) did = true;
    });
    return did;
  }
  /* ===== تلوينٌ بالصنف لا بالنمط =====
     ‎execCommand‎ لا يكتب إلّا أنماطًا صريحة، والمطلوبُ اسمٌ تُقرأ قيمتُه من الجلد —
     فيُلَفُّ المدى بيدنا. و‎surroundContents‎ تكفي في المدى المستقيم، فإن عبر التحديدُ
     حدودَ العناصر رمت خطأً — فيُستخرج المحتوى ويُلَفّ، وهو ما يفعله المتصفّح نفسُه.
     ثمّ يُرسَل ‎input‎ بيدنا: تبديلُ الـDOM بالشفرة لا يُطلقه، ولولاه لَما جرى الحفظُ
     التلقائيُّ ولا قُطعت نسخةٌ للتعديل — يُلوَّن النصُّ ثمّ يضيع اللونُ بإغلاق النافذة */
  function cdPaint(kind, tok) {
    const s = window.getSelection();
    if (cdRange) { s.removeAllRanges(); s.addRange(cdRange); }
    if (!s.rangeCount || s.isCollapsed) return;
    const host = cdField();
    if (!host) return;
    const r = s.getRangeAt(0);
    const span = document.createElement('span');
    span.className = cdPalCls(kind, tok);
    try { r.surroundContents(span); }
    catch (e) { span.appendChild(r.extractContents()); r.insertNode(span); }
    /* ولا تتراكب طبقتان من جنسٍ واحد: ما كان داخلَه من صنفه يُفكّ، وكذلك نمطٌ صريحٌ قديم */
    const pre = kind === 'hiliteColor' ? 'cdh-' : 'cdi-';
    span.querySelectorAll('span[class]').forEach(el => {
      if ([...el.classList].some(c => c.indexOf(pre) === 0)) cdUnwrap(el);
    });
    /* ===== حبرٌ فوق تظليل =====
       التظليلُ يفرض حبرَه ليُقرأ، فلو لُفّ بحبرٍ مختارٍ من خارجه لَغلبه الابنُ على أبيه
       وضاع اختيارُك. فيُنسخ صنفُ الحبر إلى أشرطة التظليل التي تحته: يجتمع الصنفان على
       عنصرٍ واحد، والحبرُ متأخّرٌ في الملفّ فيغلب */
    if (kind === 'foreColor') {
      span.querySelectorAll('span[class*="cdh-"]').forEach(el => {
        [...el.classList].forEach(c => { if (c.indexOf('cdi-') === 0) el.classList.remove(c); });
        el.classList.add(span.className);
      });
    }
    span.querySelectorAll('[style]').forEach(el => {
      if (kind === 'hiliteColor') el.style.backgroundColor = ''; else el.style.color = '';
      if (!el.getAttribute('style')) el.removeAttribute('style');
    });
    /* والحبرُ وحدَه يُرفع فوق الخطّ: التظليلُ خلفيّةٌ لا يعنيها لونُ الخطّ، ورفعُه عبثٌ
       يُبدّل الشجرةَ بلا أثرٍ يُرى. وموضعُه بعد التنظيف كلِّه وقبل ردّ التحديد: ما فوق
       يمشي في الشجرة الأولى، والتحديدُ يُبنى على الشجرة الأخيرة */
    if (kind === 'foreColor') cdDecoLift(span, host);
    const nr = document.createRange(); nr.selectNodeContents(span);
    s.removeAllRanges(); s.addRange(nr); cdRange = nr.cloneRange();
    host.dispatchEvent(new Event('input', { bubbles: true }));
  }
  /* «بلا لون»: تُفكّ أصنافُنا ويُمحى النمطُ الصريح — فيعود إلى لون النافذة، وهو وحده
     الذي يتبدّل بالجلد. ولو كتبنا مكانه لونًا صريحًا لَجمَد على درجةٍ واحدة */
  function cdColorClear(kind) {
    const s = window.getSelection();
    if (cdRange) { s.removeAllRanges(); s.addRange(cdRange); }
    if (!s.rangeCount) return;
    const host = cdField();
    if (!host) return;
    const r = s.getRangeAt(0), pre = kind === 'hiliteColor' ? 'cdh-' : 'cdi-';
    [...host.querySelectorAll('span[class]')].forEach(el => {
      if (!r.intersectsNode(el)) return;
      if ([...el.classList].some(c => c.indexOf(pre) === 0)) cdUnwrap(el);
    });
    [...host.querySelectorAll('[style]')].forEach(el => {
      if (!r.intersectsNode(el)) return;
      if (kind === 'hiliteColor') el.style.backgroundColor = ''; else el.style.color = '';
      if (!el.getAttribute('style')) el.removeAttribute('style');
    });
    host.dispatchEvent(new Event('input', { bubbles: true }));
  }
  /* ============================================================
     قفلُ الخلطة — لونٌ يُخفي النصّ لا يُعرض ليُختار
     ============================================================
     الحبّةُ في اللوحة تَعِد بلون، فإن وقع غيرُه نُقض الوعدُ في صمت. فلا يُبدَّل حبرٌ
     ولا يُصحَّح: ما لا يصلح **يُمنع**، والمنعُ يُرى قبل الضغط لا يُكتشف بعده.
     وحكمُ البابين واحدٌ متقابل: أيقرأ هذا الحبرُ على ذاك التظليل؟ — يُسأل من باب
     الحبر وقد وقع التحديدُ على تظليل، ومن باب التظليل وقد كان للتحديد حبرٌ مختار.

     ولا يُبنى على جدولٍ مكتوب: يُسأل عن **القيم كما هي في الجلد الجاري**، فيصحّ في
     الفاتح والداكن وعلى اللوحة القديمة وعلى ما يكتبه الطيفُ والكود، ولا يكذب يومَ
     تُبدَّل قيمةُ لونٍ ولا يُبدَّل معها جدولٌ منسوخ.

     ===== وأن يعمّ المنعُ حسابٌ لا اختيار =====
     في الجلد الداكن: ليقرأ الحبرُ على ورق البطاقة تلزم إضاءةٌ نسبيّةٌ ‎≥ 0.292‎، وليقرأ
     على التظليل تلزم ‎≤ 0.072‎ — والشرطان متناقضان. فما دام التظليلُ فاتحًا والورقُ
     داكنًا فلا حبرَ يجمعهما، وتُقفل الاثنتا عشرةَ جميعًا متى وقع التحديدُ على تظليل.
     وهي القاعدةُ الباقية: **تظليلٌ أو حبرٌ ملوّن، لا هما معًا** — ومن ظلّل كُتبت كلمتُه
     بحبر التظليل الداكن (‎--cdh-*-tx‎)، وهو مقيسٌ فوق ‎6.7:1‎ في الجلدين */
  const CD_MIN_R = 4.5;              /* عتبةُ الوضوح — ‎AA‎ للنصّ العاديّ */
  /* لونٌ كما رسمه المتصفّح → إضاءةٌ نسبيّة. و‎rgb()‎ و‎rgba()‎ سواء: الأرقامُ الثلاثةُ الأولى */
  function cdLum(css) {
    const m = String(css).match(/-?[\d.]+/g);
    if (!m || m.length < 3) return null;
    const c = m.slice(0, 3).map(v => { const x = +v / 255;
      return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  const cdRatio = (a, b) => { const x = cdLum(a), y = cdLum(b);
    return (x == null || y == null) ? 99
      : (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  /* ===== ولونُ صنفٍ يُقاس بالرسم لا يُقرأ من التوكن =====
     كان يُقرأ ‎getPropertyValue('--cdi-amb')‎، وهو يعود بالنصّ **كما أُلّف** (‎#e39500‎)
     لا بلونٍ محسوب. فسقط تحليلُ الهكس في قارئٍ بُني لصيغة ‎rgb()‎، فعاد الحكمُ
     «لا أدري» في كلّ حبّة — والفشلُ يُفتح لا يُقفل، فلم تُقفل واحدةٌ قطّ وبدا القفلُ
     كأنّه لم يُبنَ. وهو عطبٌ صامتٌ تامّ: لا صياحَ ولا أثر.
     فلا يُسأل التوكنُ بعد اليوم: يُلحق مسبارٌ بالنافذة يلبس الصنفَ نفسَه، ويُقرأ منه
     ما **يرسمه المتصفّح**. فيصحّ أيًّا كانت الصيغةُ المكتوبة، وأيًّا كان الجلد، ولو
     بُدّل اسمُ التوكن أو حُسبت قيمتُه من غيره.
     والذاكرةُ بمفتاح الجلد: اثنتا عشرةَ حبّةً تُقاس مرّةً عند فتح اللوحة لا في كلّ رسم */
  const cdColMemo = {};
  function cdClsColor(cls, prop) {
    const host = $('#card-modal'); if (!host) return null;
    const key = document.documentElement.dataset.theme + '|' + cls + '|' + prop;
    if (cdColMemo[key]) return cdColMemo[key];
    const p = document.createElement('span');
    p.className = cls;
    p.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px';
    host.appendChild(p);
    const v = getComputedStyle(p)[prop];
    p.remove();
    return (cdColMemo[key] = v);
  }
  /* أيُّ تظليلٍ يقع عليه التحديدُ الآن؟ وأيُّ حبرٍ يحمله؟ — يُسألان من الشجرة لا من حالٍ نحفظها */
  function cdAtSel(pre) {
    const r = cdRange; if (!r) return null;
    const n = r.startContainer, el = n.nodeType === 1 ? n : n.parentNode;
    if (!el || !el.closest) return null;
    const host = el.closest('.cd-in'); if (!host) return null;
    for (let p = el; p && p !== host; p = p.parentElement)
      if ([...p.classList].some(c => c.indexOf(pre) === 0)) return p;
    return null;
  }
  /* ===== حبرُ التحديد **المختار** — لا اللونُ المرسوم =====
     وهذا موضعُ زلَلٍ لولا التنبّه: لو سُئل عن اللون المرسوم لَقيل «أبيضُ» على كلّ نصٍّ
     عاديّ (حبرُ الحقل في الجلد الداكن)، فيُقاس الأبيضُ على التظليل فيسقط — فيُقفل
     التظليلُ كلُّه على كلّ نصٍّ لم يُلوَّن، وهو نقيضُ المراد.
     والحقيقةُ أنّ ‎.cdh-*‎ يكتب حبرَه الداكن (‎--cdh-*-tx‎) على ما لا حبرَ **مختارٌ** له،
     فلا خلطةَ هناك أصلًا. فيُسأل عن الاختيار: صنفٌ من اللوحة (‎cdi-*‎) أو لونٌ صريحٌ
     كتبه الطيفُ أو الكود. وما سواهما فلا حبرَ لك فيه */
  function cdInkSel() {
    const r = cdRange; if (!r) return null;
    const n = r.startContainer, el = n.nodeType === 1 ? n : n.parentNode;
    if (!el || !el.closest) return null;
    const host = el.closest('.cd-in'); if (!host) return null;
    for (let p = el; p && p !== host; p = p.parentElement) {
      if ((p.style && p.style.color)
        || [...p.classList].some(c => c.indexOf('cdi-') === 0)) return getComputedStyle(p).color;
    }
    return null;
  }
  /* ===== والبابان تنبيهٌ لا قفل =====
     الحكمُ واحدٌ في الجهتين: أيقرأ هذا الحبرُ على ذاك التظليل؟ وكان جوابُه يُعطّل
     الحبّة (‎disabled‎) — فقيست الحالُ كلُّها فخرج العددُ قاطعا: **صفرٌ من اثنَي عشرَ**
     حبرًا يبلغ ‎4.5‎ على كلٍّ من التظليلات الاثنَي عشرَ، في الثوبين معًا. وأعلى ما
     بلغه حبرٌ في الثوب الفاتح ‎3.23‎ وفي الغامق ‎1.37‎.
     وليس ذاك صدفةً: التظليلاتُ ألوانٌ مشبعةٌ متوسّطةُ الإضاءة (وإلّا لم تُرَ على
     الورق الأبيض)، والأحبارُ كذلك — فلا يبلغ مشبعٌ على مشبعٍ عتبةَ النصّ العاديّ
     أبدًا. ولا يبلغها إلّا حبرُ التظليل نفسِه (‎--cdh-*-tx‎: ‎7.07‎–‎7.85‎).
     فالقاعدةُ كانت تقول عمليًّا: «إذا ظلّلتَ فلا تُبدّل الحبرَ أبدًا» — بابٌ مرسومٌ
     لا يُفتح. فيبقى **الخبرُ** ويسقط **المنع**: تُخفت الحبّةُ ويُقال في تلميحها إنّ
     تباينَه ضعيف، ويبقى الاختيارُ لصاحب النصّ. */
  function cdPalLock(tok) {
    if (cdPal === 'foreColor') {
      const hi = cdAtSel('cdh-'); if (!hi) return false;   /* لا تظليلَ فلا خلطة */
      return cdRatio(cdClsColor('cdi-' + tok, 'color'),
                     getComputedStyle(hi).backgroundColor) < CD_MIN_R;
    }
    const ink = cdInkSel(); if (!ink) return false;        /* لا حبرَ لك فالتظليلُ يكتب حبرَه */
    return cdRatio(ink, cdClsColor('cdh-' + tok, 'backgroundColor')) < CD_MIN_R;
  }
  /* ============================================================
     منتقي الطيف: لوحٌ واحدٌ يُحسب لونُه من موضعه
     الصبغةُ من ‎x‎ والإضاءةُ من ‎y‎ والتشبّعُ تامّ. ولا يُقرأ بكسلٌ من القماس:
     النقرُ يُعيد الحسابَ بالمعادلة نفسِها، فما يقع هو ما رُسم تحت إصبعك.
     وأصلُه مشروعُ ‎spectrum-board‎ حيث بُني وقيس: مطابقتُه لصيغة HSL القياسيّة
     صفرُ فرقٍ على ٩٦٠ ألف بكسل، وأكبرُ قفزةٍ بين بكسلين متجاورين ١ من ٢٥٥.
     ============================================================ */
  let cdSpec = false;                    /* أمفتوحٌ اللوحُ الآن؟ — يُطوى مع اللوحة */
  /* مثلّثُ الصبغة: ثلاثةُ أعدادٍ في [0,1] لا تعتمد إلّا على الصبغة.
     وتحويلُ HSL→RGB ينفكّ شقّين: ‎C = 1-|2L-1|‎ و‎m = L-C/2‎ من الإضاءة وحدَها،
     والمثلّثُ من الصبغة وحدَها، ثمّ ‎RGB = (r,g,b)·C + m‎ — فيُحسب المثلّثُ مرّةً
     لكلّ عمودٍ لا لكلّ بكسل، وتصير الحلقةُ الداخليّةُ ضربتين وجمعة */
  function cdSpecTri(h6, out) {
    const k = Math.floor(h6), x = 1 - Math.abs((h6 % 2) - 1);
    if      (k === 0) { out[0] = 1; out[1] = x; out[2] = 0; }
    else if (k === 1) { out[0] = x; out[1] = 1; out[2] = 0; }
    else if (k === 2) { out[0] = 0; out[1] = 1; out[2] = x; }
    else if (k === 3) { out[0] = 0; out[1] = x; out[2] = 1; }
    else if (k === 4) { out[0] = x; out[1] = 0; out[2] = 1; }
    else              { out[0] = 1; out[1] = 0; out[2] = x; }
    return out;
  }
  const cdSpecH2 = n => { const h = n.toString(16).toUpperCase(); return h.length < 2 ? '0' + h : h; };
  /* لونُ نقطةٍ بنسبتَي موضعها في اللوح ‎(0..1)‎ */
  function cdSpecHex(fx, fy) {
    const t = cdSpecTri(((fx * 360) / 60) % 6, [0, 0, 0]);
    const L = 1 - fy, C = 1 - Math.abs(2 * L - 1), m = L - C / 2;
    return '#' + cdSpecH2(Math.round((t[0] * C + m) * 255))
               + cdSpecH2(Math.round((t[1] * C + m) * 255))
               + cdSpecH2(Math.round((t[2] * C + m) * 255));
  }
  /* لونُ الموضع الذي وقعت عليه الضغطةُ أو مرّ به المؤشّر */
  function cdSpecAt(cv, e) {
    const r = cv.getBoundingClientRect();
    /* القصُّ داخلَ اللوح: الحافّةُ اليمنى تمامًا تُخرج ‎h = 360‎ وهي حافّةٌ مفتوحة */
    const cl = v => v < 0 ? 0 : v > 0.999999 ? 0.999999 : v;
    return cdSpecHex(cl((e.clientX - r.left) / r.width),
                     cl((e.clientY - r.top) / r.height));
  }
  /* ===== الرسم =====
     يُعاد مع كلّ رسمةٍ للفقاعة (وهي تُعاد مع كلّ ‎selectionchange‎)، وهو رخيصٌ يُحتمل:
     ‎320×180‎ عند كثافةِ ٢ نحوُ ٢٣٠ ألف بكسل — كسرُ ملّي ثانية.
     و‎putImageData‎ لا تمرّ بمصفوفة التحويل، فلا ‎scale‎ ههنا: يُكتب البكسلُ الفيزيائيّ خامًا */
  function cdSpecPaint(root) {
    const cv = root.querySelector('.cd-spec__c');
    if (!cv) return;
    /* ===== والقدُّ يُقاس ولا يُكتب رقمًا ههنا =====
       عرضُ اللوح عرضُ اللوحة التي فوقه، وهي ليست قدًّا واحدًا: لوحةُ التظليل خمسُ
       حبّاتٍ ولوحةُ الحبر ستّ. فرقمٌ ثابتٌ في الجافا يوافق إحداهما ويخالف الأخرى،
       ويكذب في اليوم الذي تُزاد فيه حبّة. فالورقةُ تقول والجافا يقيس */
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr));
    const h = Math.max(1, Math.round(r.height * dpr));
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { alpha: false });
    const img = ctx.createImageData(w, h), d = img.data;
    const rn = new Float32Array(w), gn = new Float32Array(w), bn = new Float32Array(w), t = [0, 0, 0];
    /* مركزُ البكسل ‎(i + 0.5)‎ لا حافّتُه: فما يحسبه النقرُ هو عينُ ما رُسم تحته */
    for (let i = 0; i < w; i++) { cdSpecTri(((i + 0.5) / w) * 6, t); rn[i] = t[0]; gn[i] = t[1]; bn[i] = t[2]; }
    let p = 0;
    for (let j = 0; j < h; j++) {
      const L = 1 - (j + 0.5) / h, C = 1 - Math.abs(2 * L - 1);
      const c255 = C * 255, m255 = (L - C / 2) * 255;
      for (let i = 0; i < w; i++) {
        /* ‎Uint8ClampedArray‎ يقرّب لأقربِ صحيحٍ ويقصّ الطرفين، فلا ‎Math.round‎ في الحلقة */
        d[p] = rn[i] * c255 + m255; d[p + 1] = gn[i] * c255 + m255;
        d[p + 2] = bn[i] * c255 + m255; d[p + 3] = 255; p += 4;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  /* ===== وموضعُه لا يُحسب =====
     كان يطفو بجانب اللوحة، فلزمه حسابُ ثلاثةِ مواضعَ وحدٌّ من البطاقة لئلّا يخرج
     عن سطحها. وقد صار **تحتها** فسقط الحسابُ كلُّه إلى سطرين في الورقة: تحتَها
     بفجوةٍ، وبعرضها. ولا جافا في الأمر — وهو أقلُّ ما يمكن أن يُكتب */
  /* رقاقةُ التحويم: مربّعُ اللون وهكسُه، تتبع المؤشّر داخل اللوح وتنقلب عند حافّته */
  function cdSpecTip(sp, e) {
    const cv = sp.querySelector('.cd-spec__c'), tip = sp.querySelector('.cd-spec__tip');
    if (!cv || !tip) return;
    const hex = cdSpecAt(cv, e);
    tip.querySelector('i').style.background = hex;
    tip.querySelector('b').textContent = hex;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    /* والفجوةُ عشرةٌ لا أربعَ عشرةَ: اللوحُ نصفُ ما كان، فالفجوةُ الواسعةُ تدفع
       الرقاقةَ إلى الانقلاب في وسطه لا عند حافّته */
    const tw = tip.offsetWidth, th = tip.offsetHeight, G = 10;
    let tx = x + G, ty = y + G;
    if (tx + tw > r.width)  tx = x - G - tw;
    if (ty + th > r.height) ty = y - G - th;
    if (tx < 0) tx = 0;
    if (ty < 0) ty = 0;
    tip.style.transform = 'translate(' + Math.round(tx) + 'px,' + Math.round(ty) + 'px)';
  }

  /* ============================================================
     حبّاتُك أنت: ما انتقيتَه من الطيف يبقى مربّعًا في اللوحة
     ============================================================ */
  const CD_MY_MAX = 12;                  /* صفّان زيادةً على المسمّاة، لا تطول اللوحةُ بلا حدّ */
  /* ولوحتان لا لوحةٌ واحدة: لونُ التظليل ليس لونَ الحبر، فلا يزاحم أحدُهما الآخر.
     والقراءةُ متساهلةٌ عمدًا: حالةٌ محفوظةٌ من قبلِ هذه الميزة لا تحمل المفتاحَ أصلًا */
  function cdMyList(kind) {
    const k = kind || cdPal || 'hiliteColor';
    if (!state.cdMy || typeof state.cdMy !== 'object') state.cdMy = {};
    if (!Array.isArray(state.cdMy[k])) state.cdMy[k] = [];
    return state.cdMy[k];
  }
  function cdMyAdd(hex) {
    const list = cdMyList(), up = String(hex).toUpperCase();
    /* اللونُ الواحدُ خانةٌ واحدة: إعادةُ انتقائه ترفعه إلى المقدّمة ولا تُكرّره */
    const at = list.indexOf(up);
    if (at !== -1) list.splice(at, 1);
    list.unshift(up);
    if (list.length > CD_MY_MAX) list.length = CD_MY_MAX;
    save();
  }
  function cdMyDel(hex) {
    const list = cdMyList(), at = list.indexOf(String(hex).toUpperCase());
    if (at !== -1) { list.splice(at, 1); save(); }
  }
  /* ===== والهكسُ يُترجَم قبل أن يُسأل عن تباينه =====
     ‎cdLum‎ بُني لما يرسمه المتصفّح — أي لصيغة ‎rgb()‎ — وهو يلتقط الأرقامَ من النصّ.
     و‎#7EC8A9‎ فيه ثلاثةُ أرقامٍ (٧ و٨ و٩) فيقرؤها لونًا **ويسكت**: حكمٌ كاذبٌ لا يصيح.
     وهو العطبُ نفسُه الذي وقع في ‎cdClsColor‎ من قبل ومكتوبٌ شرحُه فوقها — فلا يُعاد */
  const cdHexRgb = h => {
    const n = String(h).replace('#', '');
    const f = n.length === 3 ? n[0] + n[0] + n[1] + n[1] + n[2] + n[2] : n;
    return 'rgb(' + parseInt(f.slice(0, 2), 16) + ', ' + parseInt(f.slice(2, 4), 16)
         + ', ' + parseInt(f.slice(4, 6), 16) + ')';
  };
  /* حكمُ ‎cdPalLock‎ نفسُه، لكنّ الحبّةَ لونٌ صريحٌ لا صنفٌ يُسأل عنه المتصفّح */
  function cdPalLockHex(hex) {
    const css = cdHexRgb(hex);
    if (cdPal === 'foreColor') {
      const hi = cdAtSel('cdh-'); if (!hi) return false;
      return cdRatio(css, getComputedStyle(hi).backgroundColor) < CD_MIN_R;
    }
    const ink = cdInkSel(); if (!ink) return false;
    return cdRatio(ink, css) < CD_MIN_R;
  }
  /* ===== تطبيقُ لونٍ صريح: من الطيف أو من حبّةٍ خاصّة =====
     يُكتب في حقل الكود ثمّ يُطلق حدثاه، فيجري عليه ما يجري على ما يُكتب فيه باليد:
     التلوينُ الحيُّ من ‎input‎ ورفعُ الزخارف من ‎change‎. ولا فرعَ ثانيًا للتلوين */
  function cdHexApply(hex) {
    const hx = $('#cd-bub .cd-pal__hex');
    if (!hx) return;
    hx.value = hex;
    hx.dispatchEvent(new Event('input', { bubbles: true }));
    hx.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function cdPalHTML() {
    if (!cdPal) return '';
    const list = CD_PAL[cdPal] || [];
    const mine = cdMyList();
    /* أعلى التحديدِ تظليلٌ؟ — يُسأل مرّةً لا مرّةً لكلّ حبّة */
    const onHi = cdPal === 'foreColor' && !!cdAtSel('cdh-');
    /* ===== وصفٌّ واحدٌ لا يسع اثنتي عشرة =====
       اللوحةُ منسدلةٌ تحت زرٍّ في فقاعةٍ صغيرة، واثنتا عشرةَ حبّةً في صفٍّ تُخرجها عن
       عرض البطاقة. فالسقفُ ستّةٌ في الصفّ: الخمسُ والستُّ تبقيان صفًّا كما كانتا،
       والاثنتا عشرةَ تنزل صفّين — والحسابُ من العدد فلا رقمَ ثابتٌ يكسر حالًا */
    return `<div class="cd-pal">
      <div class="cd-pal__grid" style="--n:${Math.min(list.length + mine.length, 6)}">${list.map(([tok, n]) => {
        /* اسمُ متغيّر التظليل ينتهي بـ‎-bg‎ (لأنّ له حبرًا كذلك)، والحبرُ لا لاحقةَ له —
           فيُبنى الاسمُ من الجنس لا يُخمَّن، وإلّا خرج ‎var()‎ فارغًا فبدت المربّعاتُ بيضاء */
        /* ===== والحبّةُ تعرض ما سيقع لا ما هو مكتوبٌ في اللوحة =====
           التحديدُ على تظليل؟ فالحبرُ سيلبس درجتَه الداكنة (‎--cdo-*‎) لا لونَه الفاتح —
           فتعرض الحبّةُ **تلك الدرجة**. وبها يُحلّ ما رُدّ مرّتين معًا: لا وعدَ يُنقض
           (ما تراه هو ما يقع)، ولا بابَ يُقفل (الاثنتا عشرةَ متاحةٌ كلُّها) */
        const v = (cdPal === 'foreColor' && onHi) ? 'cdo-' + tok
          : cdPalCls(cdPal, tok) + (cdPal === 'hiliteColor' ? '-bg' : '');
        /* وضعيفُ التباين يُخفت ويُخبَر بعلّته، ولا يُعطَّل: المنعُ كان يعمّ الجميع */
        const lo = cdPalLock(tok);
        return `<button type="button" class="cd-pal__sw${lo ? ' is-lo' : ''}" data-tok="${tok}"
           title="${esc(n)}${lo ? ' — ' + T().cdPalLock : ''}"
           style="--sw:var(--${v})"><i></i></button>`;
      }).join('')}${mine.map(hex => {
        /* ===== حبّتُك أنت: لونٌ صريحٌ لا توكن =====
           والزرّان أخوان لا أبٌ وابن: ‎<button>‎ داخل ‎<button>‎ وسمٌ باطلٌ يُصلحه
           المتصفّح بأن يقذف الداخلَ خارجَ أخيه، فينهار الركن. فالخليّةُ تحملهما معًا */
        const lo = cdPalLockHex(hex);
        return `<span class="cd-pal__cell">
          <button type="button" class="cd-pal__sw${lo ? ' is-lo' : ''}" data-hex="${esc(hex)}"
            title="${esc(hex)}${lo ? ' — ' + T().cdPalLock : ''}"
            style="--sw:${esc(hex)}"><i></i></button>
          <button type="button" class="cd-pal__del" data-del="${esc(hex)}"
            title="${esc(T().cdMyDel)}" aria-label="${esc(T().cdMyDel)}">&times;</button>
        </span>`;
      }).join('')}</div>
      <div class="cd-pal__row">
        <button type="button" class="cd-pal__none">${esc(T().cdNoColor)}</button>
        <button type="button" class="cd-pal__spec${cdSpec ? ' on' : ''}"
          aria-pressed="${cdSpec}" title="${esc(T().cdSpectrum)}"><i></i></button>
        <input type="text" class="cd-pal__hex" maxlength="7" spellcheck="false"
          placeholder="${esc(T().cdHexPh)}" aria-label="${esc(T().cdHexPh)}">
      </div>${cdSpec ? `<div class="cd-spec"><div class="cd-spec__box">
        <canvas class="cd-spec__c"></canvas>
        <div class="cd-spec__tip"><i></i><b></b></div>
      </div></div>` : ''}</div>`;
  }
  const cdToolsHTML = () => `
    <button type="button" class="cd-tool" data-act="dir" title="${esc(T().cdDirBtn)}"
      aria-label="${esc(T().cdDirBtn)}">${(cardDlg && cardDlg.lang === 'en') ? CD_IC.dirLtr : CD_IC.dirRtl}</button>
    <button type="button" class="cd-tool" data-act="align" title="${esc(T().cdAlignBtn)}"
      aria-label="${esc(T().cdAlignBtn)}">${
        cdAlignNow() === 'c' ? CD_IC.alC : cdAlignNow() === 'l' ? CD_IC.alL : CD_IC.alR}</button>
    <span class="cd-sep"></span>
    <!-- ===== والمشتعلُ يُذهَّب: ‎.on‎ خبرٌ عن النصّ لا عن الزرّ =====
         و‎cdCmdOn‎ تُسأل عند كلّ رسمٍ للفقاعة (ومرجعُها ‎selectionchange‎)، فالإضاءةُ تتبع
         ما تحت المؤشّر لا حالًا تُحفظ — فلا تفترق عمّا في النصّ أبدًا. وهو حكمُ أيقونة
         المحاذاة نفسُه، بلغة الإضاءة بدل تبدُّل الرسم.
         ولوحتا اللون لا تُسألان بهذا: ‎.on‎ فيهما «مفتوحةٌ» لا «مشتعلة» — وهما خبران -->
    <button type="button" class="cd-tool${cdCmdOn('bold') ? ' on' : ''}" data-cmd="bold" title="${T().cdBold}"><b>B</b></button>
    <button type="button" class="cd-tool${cdCmdOn('italic') ? ' on' : ''}" data-cmd="italic" title="${T().cdItalic}"><i>I</i></button>
    <button type="button" class="cd-tool${cdCmdOn('underline') ? ' on' : ''}" data-cmd="underline" title="${T().cdUnder}"><u>U</u></button>
    <span class="cd-sep"></span>
    <button type="button" class="cd-tool${cdPal === 'hiliteColor' ? ' on' : ''}" data-pal="hiliteColor"
      title="${T().cdHilite}">${CD_IC.hi}</button>
    <button type="button" class="cd-tool${cdPal === 'foreColor' ? ' on' : ''}" data-pal="foreColor"
      title="${T().cdColor}">${CD_IC.col}</button>
    <span class="cd-sep"></span>
    <!-- والقائمتان منهنّ: حالُهما حالُ تشغيلٍ يقوله ‎queryCommandState‎ سواءً بسواء،
         فلو استُثنيتا لَأضاء بعضُ الصفّ وسكن بعضُه على شرطٍ لا يُرى -->
    <button type="button" class="cd-tool${cdCmdOn('insertUnorderedList') ? ' on' : ''}" data-cmd="insertUnorderedList" title="${T().cdBullets}">${SRC_LIST_IC}</button>
    <button type="button" class="cd-tool${cdCmdOn('insertOrderedList') ? ' on' : ''}" data-cmd="insertOrderedList" title="${T().cdNumbers}">${CD_IC.ol}</button>
    ${cdPalHTML()}`;
  /* شريط النوع: الأربعة ظاهرةٌ معًا والمختار وحده مضاء — أوضح من زرٍّ يتبدّل بالدور فلا يُرى ما بعده.
     والأحجام مُعايَرة بالحبر لا بالإطار: قياسات الأيقونات (‎16‎ و‎24‎ و‎1254‎) مختلفة،
     وقياسٌ واحدٌ لها يجعل «إكمال الجملة» أثخن من أخواتها */
  /* والترتيبُ هنا هو ترتيبُ الدُّرج والشريط معًا — مصدرٌ واحدٌ لا يُعاد في موضعين.
     و«المتعدّد» أوّلُها بطلب صاحب الموقع. أمّا ‎CD_KINDS[0]‎ حيث وردت فهي **احتياطُ
     أيقونةٍ** لا نوعٌ افتراضيّ: النوعُ الافتراضيّ مكتوبٌ صراحةً ‎'c'‎ في ‎cdWinState‎،
     فلا يتبدّل بتبدّل الترتيب */
  const CD_KINDS = [
    ['q', () => PK_IC.mcq1],
    ['c', () => CD_IC.front],       /* وجهٌ وظهر — أيقونة مستطيل النصّ نفسها */
    ['cloze', () => CD_IC.tText],
    ['io', () => CD_IC.tIo],
  ];
  const cdKindsHTML = () => {
    const cur = cdWhich();
    return CD_KINDS.map(([k, ic]) => {
      const lb = esc(T().cdKinds[k]), on = k === cur;
      return `<button type="button" class="cd-kb${on ? ' on' : ''}" data-ck="${k}" role="radio"
        aria-checked="${on}" title="${lb}" aria-label="${lb}">${ic()}</button>`;
    }).join('');
  };
  /* وجهة الحفظ: الجذر والمادة يحسمهما السياق فيُعرضان تأكيدًا لا سؤالًا.
     والجذر يتبع الحقيقة: المساهمة العامّة في «المكتبة» أو المساحة الخاصّة في «الركن» */
  /* ===== الجذرُ يتبع النافذةَ لا الشاشةَ خلفها =====
     كان يُسأل: «أين ‎#cm-ui‎ الآن؟» — وهو خبرٌ عن الشاشة. وبطاقةُ «رحلتي» تُفتح والقُمرةُ
     معروضةٌ و‎#cm-ui‎ راجعٌ إلى نافذة المادّة (‎openNook‎ تردّه إلى بيته)، فيُقرأ الجذرُ
     «المكتبة» وهي في الرَّكن يقينًا. فتُسأل النافذةُ أوّلًا: من كانت وجهتُه رحلتَك فجذرُه
     الرَّكن، وما سواه يبقى على سؤال الشاشة */
  const cdInNook = () => {
    if (cardDlg && cardDlg.road) return true;
    const ui = $('#cm-ui'); return !!(ui && ui.closest('#lib-course'));
  };
  /* ومادّةُ النافذة كذلك: ‎cmCode‎ مادّةُ **الشاشة**، وقد تكون مادّةً أخرى فُتحت قبلُ —
     والقُمرةُ لا تكتبها (‎fillCourseUI‎ وحدها تفعل، ولا تُنادى إلّا لفتح مورد) */
  const cdCourse = () => (cardDlg && cardDlg.road && cardDlg.roadE)
    ? nookCode(cardDlg.roadE)
    : ((cardDlg && cardDlg.pub && cardDlg.pub.code) || cmCode);
  const cdRootLbl = () => cdInNook() ? T().cdRootNook : T().cdRootLib;
  /* سلسلة المجلدات من الجذر إلى الوجهة — لاسمٍ على طريقة أنكي: مادة::مجلد::مجلد */
  function cdChain(fid) {
    const out = [];
    const walk = (ns, trail) => {
      for (const n of ns || []) {
        if (n.t !== 'f') continue;
        const t = trail.concat(n.name || T().pkTitlePh);
        if (n.id === fid) { out.push.apply(out, t); return true; }
        if (walk(n.ch, t)) return true;
      }
      return false;
    };
    if (fid) walk(cdDeck(), []);
    return out;
  }
  /* ===== ألوان المجلدات =====
     ثمانيةٌ من أسرة الهوية: بترولي · زيتوني · ذهبيّ محروق · طوبيّ · نيليّ · خزاميّ · توتيّ · يشميّ.
     وكلّها **متوسّطة الإضاءة** عمدًا — الفاتح منها يذوب في الجلد الفاتح والداكن يغرق في الداكن،
     فالوسطُ وحده يُقرأ في الجلدين بلا نسختين تُصانان */
  const FOLDER_COLORS = ['#2f7d86', '#5f8f4a', '#c0912f', '#b3634a',
    '#4a6fa5', '#8367a6', '#a8536e', '#3f9a92'];
  /* اللون يُختار عشوائيًّا **ممّا لم يُستعمل في الرزمة بعد** — فتتنوّع الألوان قبل أن تتكرّر،
     وهو أقربُ إلى ما يُنتظر من العشوائيّة من عشوائيّةٍ صِرفة قد تُعطي لونين متجاورين */
  function pickFolderColor(deck) {
    const used = new Set();
    const walk = ns => (ns || []).forEach(n => {
      if (n.t !== 'f') return;
      if (n.ci != null) used.add(n.ci);
      walk(n.ch);
    });
    walk(deck);
    const free = FOLDER_COLORS.map((_, i) => i).filter(i => !used.has(i));
    const pool = free.length ? free : FOLDER_COLORS.map((_, i) => i);
    return pool[Math.floor(Math.random() * pool.length)];
  }
  /* ===== وجه المجلد: إيموجي يحلّ محلّ رمز المجلد =====
     المختار من ‎folder-face-lab‎ (الاتّجاه ك · المَجْمَع). والعلاقة المعتمدة **الحلول محلّه**:
     الإيموجي يصير هو الأيقونة، واللونُ ينتقل إلى خطّ الاسم — فلا يضيع اللون ولا يتزاحمان.
     وسببُ ذلك أنّ المرساة ‎16px‎: إيموجي **على** مجلدٍ في هذا الحجم يصير ٩px فلا يُقرأ.
     والمخزَّن في العقدة ‎n.em‎ = الشريحة (‎open-book‎) لا اسم الملفّ: أدلُّ على المعنى،
     ويبقى صحيحًا لو أُعيد توليدُ الرزمة بأرقامٍ أخرى */
  const EM_LIST = (typeof ACADEMIA_EMOJI !== 'undefined' && Array.isArray(ACADEMIA_EMOJI)) ? ACADEMIA_EMOJI : [];
  const emIdx  = n => parseInt(String(n).slice(0, 4), 10);
  const emSlug = n => String(n).split('_')[1] || '';
  /* خريطة الشريحة ⇦ اسم الملفّ تُبنى مرّةً: الرسمُ يسأل عنها في كلّ صفّ، والمسحُ في كلّ مرّة ١٨٠٧ */
  const EM_BY = (() => { const m = {}; EM_LIST.forEach(n => { m[emSlug(n)] = n; }); return m; })();
  const emURL = slug => EM_BY[slug] ? assetURL('assets/emoji/' + EM_BY[slug] + '.png') : '';
  /* ===== الأسماء العربيّة =====
     مصدرها ‎Unicode CLDR‎ (‎annotations/ar.xml‎ + المشتقّة) — الاسمُ أوّلًا ثمّ كلماتُه بـ‎|‎،
     وتغطيتُها ١٨٠٢ من ١٨٠٢. وهي في مصفوفةٍ **موازيةٍ** لا مدموجةٍ بالأسماء: الفصلُ يُبقي
     كلَّ قارئٍ للفهرس عاملًا بلا تعديل، ولا يُكرَّر اسمُ الملفّ مفتاحًا فيُضاعَف حجمُ الملفّ */
  const EM_AR = (() => {
    const a = (typeof ACADEMIA_EMOJI_AR !== 'undefined' && Array.isArray(ACADEMIA_EMOJI_AR)) ? ACADEMIA_EMOJI_AR : [];
    const m = {}; EM_LIST.forEach((n, i) => { m[n] = a[i] || ''; }); return m;
  })();
  /* تطبيعُ البحث: العربيّةُ تُكتب بألفٍ وهمزةٍ وتاءٍ مربوطةٍ على وجوه، ومن يبحث «كتاب»
     لا ينبغي أن يُحرَم لأنّ المكتوب «كتابٌ» أو «إناء» وهو كتب «اناء». فتُسوّى الحروفُ
     المتقاربةُ ويُنزع التشكيلُ والتطويل — في المخزون مرّةً وفي السؤال كلَّ مرّة */
  const arNorm = s => String(s).toLowerCase()
    .replace(/[ً-ْـٰ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه').replace(/[ىئ]/g, 'ي').replace(/ؤ/g, 'و');
  /* فهرسُ البحث: الشريحةُ الإنجليزيّة والأسماءُ العربيّة في نصٍّ واحدٍ مطبَّع — فالبحثُ
     باللغتين يقع على الحقل نفسِه، ولا يُسأل عن لغة الكاتب */
  const EM_Q = (() => {
    const m = {};
    EM_LIST.forEach(n => { m[n] = arNorm(emSlug(n).replace(/-/g, ' ') + ' ' + (EM_AR[n] || '').replace(/\|/g, ' ')); });
    return m;
  })();
  /* اسمُ الإيموجي في التلميح: بلغة الواجهة — العربيُّ أوّلُ ما في ‎EM_AR‎، والإنجليزيُّ شريحتُه */
  const emName = n => state.lang === 'ar'
    ? ((EM_AR[n] || '').split('|')[0] || emSlug(n).replace(/-/g, ' '))
    : emSlug(n).replace(/-/g, ' ');
  /* حدود التصنيفات برقم الملفّ: ترتيبُ الرزمة ترتيبُ يونيكود، فالتصنيفُ يُشتقّ من الرقم
     ولا يحتاج جدولًا لكلّ بند. ورأسُ كلّ باب إيموجيُّه الأوّل — يُعرَّف بأشهر ما فيه */
  /* ===== رموز الأبواب: خطّيّةٌ بلون الجلد لا إيموجي =====
     كانت رأسُ كلّ بابٍ إيموجيَّه الأوّل، فاجتمع في القائمة صفٌّ ملوّنٌ فوق شبكةٍ ملوّنة
     لا يفرّق بينهما إلّا الحجم — والرأسُ يجب أن يُقرأ **رأسًا** لا بندًا من بنوده.
     ودلالاتُها من عُرف ‎Material Symbols‎ (‎mood‎ · ‎emoji_nature‎ · ‎emoji_objects‎ …) وهو
     العرف الذي تمشي عليه منتقياتُ الإيموجي، لكنّ الرسمَ من عندنا: ‎24×24‎ بحدٍّ ‎1.9‎
     و‎currentColor‎ — أخواتٌ لـ‎PK_IC‎ و‎CD_IC‎، فلا تدخل عائلةُ أيقوناتٍ ثانيةٌ على الموقع */
  const EMC = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const EM_CATS = [
    { to: 150,  ar: 'وجوه',         en: 'Smileys',
      svg: EMC('<circle cx="12" cy="12" r="8.6"/><path d="M8.6 14.4a4.3 4.3 0 0 0 6.8 0"/><path d="M9.3 9.6h.01M14.7 9.6h.01" stroke-width="2.4"/>') },
    { to: 1986, ar: 'أشخاص',        en: 'People',
      svg: EMC('<circle cx="12" cy="7.4" r="3.3"/><path d="M5.6 20.2a6.4 6.4 0 0 1 12.8 0"/>') },
    { to: 2132, ar: 'حيوان وطبيعة', en: 'Nature',
      svg: EMC('<path d="M12 20.5v-8.7"/><path d="M12 11.8c0-4 2.9-6.4 6.9-6.4 0 4-2.9 6.4-6.9 6.4z"/><path d="M12 15c-3.1 0-5.4-1.9-5.4-4.9 3.1 0 5.4 1.9 5.4 4.9z"/>') },
    { to: 2255, ar: 'طعام',         en: 'Food',
      svg: EMC('<path d="M4.6 8.6h11.8v5.6a4.2 4.2 0 0 1-4.2 4.2H8.8a4.2 4.2 0 0 1-4.2-4.2z"/><path d="M16.4 10.1h1.7a2.3 2.3 0 0 1 0 4.6h-1.7"/><path d="M7.6 3.6v1.8M11 3.3v2.1M14.4 3.6v1.8"/>') },
    { to: 2470, ar: 'سفر وأماكن',   en: 'Travel',
      svg: EMC('<circle cx="12" cy="12" r="8.6"/><path d="M3.5 12h17"/><path d="M12 3.4c2.2 2.4 3.3 5.3 3.3 8.6S14.2 18.2 12 20.6c-2.2-2.4-3.3-5.3-3.3-8.6S9.8 5.8 12 3.4z"/>') },
    { to: 2554, ar: 'أنشطة',        en: 'Activity',
      svg: EMC('<path d="M7.6 4.4h8.8v4.2a4.4 4.4 0 0 1-8.8 0z"/><path d="M7.6 6H5.1v1.1a3.1 3.1 0 0 0 3.1 3.1"/><path d="M16.4 6h2.5v1.1a3.1 3.1 0 0 1-3.1 3.1"/><path d="M12 13v3.6"/><path d="M8.9 19.6h6.2"/>') },
    { to: 2805, ar: 'أشياء',        en: 'Objects',
      svg: EMC('<path d="M12 3.6a5.6 5.6 0 0 0-3.3 10.1 2.4 2.4 0 0 1 1 1.9h4.6a2.4 2.4 0 0 1 1-1.9A5.6 5.6 0 0 0 12 3.6z"/><path d="M9.7 18.3h4.6"/><path d="M10.4 20.6h3.2"/>') },
    { to: 3022, ar: 'رموز',         en: 'Symbols',
      svg: EMC('<path d="M9.4 4L7.3 20"/><path d="M16.7 4l-2.1 16"/><path d="M4.6 9.2h15"/><path d="M3.7 14.8h15"/>') },
    { to: 1e9,  ar: 'أعلام',        en: 'Flags',
      svg: EMC('<path d="M5.6 20.6V3.9"/><path d="M5.6 5h11.2l-2.1 3.6 2.1 3.6H5.6"/>') },
  ];
  const emCat = n => { const i = emIdx(n); for (let c = 0; c < EM_CATS.length; c++) if (i <= EM_CATS[c].to) return c; return 0; };
  /* وجهُ المجلد في كلّ موضعٍ يُرسم فيه: الإيموجي إن كان، وإلّا رمزُ المجلد.
     دالّةٌ واحدة تخدم شجرةَ التحرير وشجرةَ العرض معًا — فلا يفترق ما يراه المحرّر عمّا يُنشر */
  const folderFace = f => (f && f.em && emURL(f.em))
    ? `<img class="x3-fem" src="${emURL(f.em)}" alt="">`
    : PK_IC.folderFill;
  /* المجلدات التي أُنشئت قبل الألوان: يُشتقّ لونها من معرّفها فيثبت ولا يتبدّل مع كل رسم */
  const folderColor = n => {
    if (n && n.ci != null) return FOLDER_COLORS[n.ci % FOLDER_COLORS.length];
    let h = 0; const s = String((n && n.id) || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return FOLDER_COLORS[h % FOLDER_COLORS.length];
  };
  /* ============================================================
     منتقي وجه المجلد — «المَجْمَع» (‎folder-face-lab‎ · الاتّجاه ك)
     شريحتان «لون · وجه»، وجانبُ الوجه يحمل بحثًا ورفَّ تصنيفاتٍ أفقيًّا فوق الشبكة.
     (والمعاينةُ التي كانت فوق الشريحتين رُفعت: الصفُّ الحقيقيّ على بُعد عشرين بكسلًا،
      فرسمُ مجلدٍ ثانٍ فوقه تكرارٌ يأكل من الشبكة — وهي المقصودة.)

     والقائمةُ ابنةُ ‎body‎ بموضعٍ ثابت (‎fixed‎) لا ابنةُ الصفّ: الشجرةُ تعيش في صندوقٍ
     يُمرَّر (‎.cm-pane‎)، فقائمةٌ مطلقةٌ داخله يقصّها فيضُه. ولأنّها خرجت من ‎#cm-ui‎
     لا تبلغها توكناتُ الجلد، فلها توكناتُها في ‎styles.css‎ بقيم ‎.mdrop-list‎ نفسِها.
     ============================================================ */
  let fmn = null;   /* {id, el, tab} — واحدةٌ في الصفحة، كسائر المنبثقات */

  const fmnSwHTML = (f) => FOLDER_COLORS.map((c, i) => `<button type="button" class="fmn-sw${i === f.ci ? ' on' : ''}"
      data-ci="${i}" style="--sw:${c}" aria-label="${i + 1}"><i></i></button>`).join('');

  const fmnEmHTML = (n, cur) => `<button type="button" class="fmn-em${emSlug(n) === cur ? ' on' : ''}"
      data-em="${emSlug(n)}" title="${esc(emName(n))}" aria-label="${esc(emName(n))}"><img src="${assetURL('assets/emoji/' + n + '.png')}" alt="" loading="lazy" decoding="async"></button>`;

  /* ===== الشبكة تُرسم دفعاتٍ لا دفعةً =====
     المجموعة ١٨٠٧ صورة. وبناؤها كلِّها في نبضةٍ واحدة يُجمّد الصفحة ثوانيَ — جرّبتُها فتلعثمت،
     ولا يكفي فيها ‎loading="lazy"‎: الكسلُ يمنع **الجلب** لا **بناء العقد**. فتُرسم أوّلُ دفعةٍ
     ثمّ تلحقها أخواتُها كلّما بلغ التمريرُ قاعَ الصندوق — وهو ما تفعله المنتقياتُ الكبيرة
     (سلاك تُحضّرها افتراضيًّا). والأبوابُ والبحثُ يجعلان النزولَ إلى القاع نادرًا أصلًا */
  const FMN_STEP = 240;
  let fmnGrid = null;   /* {list, cats, at} — ما بقي من القائمة وأين وقف الرسم */
  /* عنوانُ الباب يُقرَّر بمقارنة البند بسابقه في **القائمة** لا بحالٍ محفوظة، فتصحّ الدفعةُ
     الثانيةُ كما تصحّ الأولى ولا يتكرّر عنوانٌ على حدّ الدفعتين */
  function fmnRows(f, list, cats, from, to) {
    let out = '';
    for (let i = from; i < to && i < list.length; i++) {
      if (cats && (i === 0 || emCat(list[i]) !== emCat(list[i - 1]))) {
        out += `<p class="fmn-cat">${EM_CATS[emCat(list[i])][state.lang]}</p>`;
      }
      out += fmnEmHTML(list[i], f.em);
    }
    return out;
  }
  /* الشبكة: بعناوين الأبواب حين تُعرض المجموعة كلُّها، وبلا عناوين حين رُشِّحت بباب أو ببحث */
  function fmnGridHTML(f, list, cats) {
    fmnGrid = { list, cats, at: Math.min(FMN_STEP, list.length) };
    const out = fmnRows(f, list, cats, 0, fmnGrid.at);
    return `<div class="fmn-grid">${out || `<p class="fmn-cat">${esc(T().ffNone)}</p>`}</div>`;
  }
  /* الرفُّ أفقيّ لا رأسيّ: يوفّر العرضَ فتبقى القائمةُ ضيّقةً تنبت من أيقونةٍ ‎16px‎.
     و«الكلّ» كلمةٌ لا صورة — لو رُسم إيموجيًّا لَصار عاشرَ بابٍ لا مخرجًا منها */
  const fmnRailHTML = () => `<div class="fmn-rail">
      <button type="button" class="fmn-cb is-all on" data-cat="-1">${esc(T().ffAll)}</button>
      ${EM_CATS.map((c, i) => `<button type="button" class="fmn-cb" data-cat="${i}"
        title="${esc(c[state.lang])}" aria-label="${esc(c[state.lang])}">${c.svg}</button>`).join('')}
    </div>`;

  const fmnFaceHTML = f => `<input type="text" class="fmn-search" placeholder="${esc(T().ffSearch)}" aria-label="${esc(T().ffSearch)}">
      ${fmnRailHTML()}${fmnGridHTML(f, EM_LIST, true)}`;

  /* ===== بنيةُ القائمة =====
     اللونُ **ثابتٌ فوق الشطرين** لا خلف شريحة: هو أكثرُ ما يُبدَّل، وإخفاؤه خلف تبويبٍ
     كان أثقلَ ما في التركيب. والشريحتان بعده لم تعودا ملاحةً بل **حالًا**:
     «مجلد» = وجهُ هذا المجلد أيقونتُه (فتُنزع الإيموجي، ولا يُفتح تحتها شيء —
     وهي تقوم مقام زرّ التصفير فسقط)، و«إيموجي» = يُفتح المنتقي.
     ولا قدمَ للقائمة: «تمّ» لا معنى لها في منبثقةٍ تُغلق بالضغط في الخارج، وكلُّ اختيارٍ
     يقع ويُحفظ في لحظته — فلا شيءَ ينتظر تأكيدًا.
     والشريحةُ المضيئةُ عند الفتح تتبع الحالَ لا العادة: مجلدٌ له وجهٌ يفتح على «إيموجي» */
  function fmnHTML(f) {
    return `<div class="fmn" role="dialog" aria-label="${esc(T().ffTitle)}">
      <div class="fmn-cols">${fmnSwHTML(f)}</div>
      <div class="fmn-seg">
        <button type="button" class="fmn-sgf${f.em ? '' : ' on'}" data-tab="folder">${PK_IC.folderFill}<span>${esc(T().ffFolder)}</span></button>
        <button type="button"${f.em ? ' class="on"' : ''} data-tab="face">${esc(T().ffEmoji)}</button>
      </div>
      <div class="fmn-body">${f.em ? fmnFaceHTML(f) : ''}</div>
    </div>`;
  }
  /* ===== الإرساء: الرأسُ تحت الأيقونة دائمًا =====
     ولا انقلابَ فوقها ولو ضاق ما دونها. والسببُ ليس ذوقًا: القائمةُ المنقلبةُ يُحسب رأسُها
     من **قاعدتها** (‎top = anchor.top − h‎)، فيصير موضعُ الرأس تابعًا لارتفاعها — وارتفاعُها
     يتبدّل بتبدّل ما فيها (شبكةٌ تُفتح · جسمٌ يُطوى)، فيقفز الرأسُ صعودًا وهبوطًا تحت يدك.
     وبالإرساء من الأسفل يصير الرأسُ **ثابتًا** والطولُ وحدَه ما ينمو نازلًا.
     والعرضُ ثابتٌ كذلك (‎--fmn-w‎)، فلا يزحف الجانبُ الأفقيّ بتبدّل المحتوى */
  /* ===== وإن ضاق ما دون الأيقونة: تتّسع الصفحةُ لا تُرفع القائمة =====
     العطبُ المبلَّغ: مجلّدٌ آخرُ ما في الصفحة، فتنزل قائمتُه تحت حافّة الشاشة — وهي
     ‎position: fixed‎ فلا يبلغها تمريرٌ، ولا صفحةَ باقيةٌ تُمرَّر. فتقف خارج المتناول.
     ===== وجُرّب الرفعُ فرُدّ بحكم صاحب الموقع =====
     «انه يكون تحت مو مشكلة، بس وسّع الصفحة من تحت — أفضل من انه يغطي المجلدات كلها».
     وهو الصواب: الرفعُ يُقحم القائمةَ على ما فوقها — وهو **الشجرةُ التي جئتَ منها**،
     فتُحجب المجلداتُ التي تُقارن بينها وأنت تختار لونًا. والتوسعةُ لا تُخفي شيئًا:
     تدفع الصفحةَ تحتها فيصعد الصفُّ ومعه قائمتُه، ويبقى ما فوقه على حاله.
     ===== وثلاثةُ أسطرٍ لا أكثر =====
     ١ · يُقاس ما يفيض تحت الحافّة.
     ٢ · ويُمدّ ذيلُ الصفحة بقدره (‎fmnPad‎ — والـ‎body‎ هو حاوي التمرير ههنا).
     ٣ · وتُمرَّر الصفحةُ بقدره، فيصعد الصفُّ فترتفع القائمةُ معه إلى داخل الشاشة.
     والذيلُ يُطوى عند الإغلاق فتعود الصفحةُ إلى قامتها.
     ===== والإرساءُ يبقى تحت الأيقونة أبدًا =====
     فتصحّ الحجّةُ المكتوبة على حالها: «الرأسُ ثابتٌ والطولُ وحدَه ما ينمو نازلًا» —
     ولا يقفز تحت يدك إذا فُتحت شبكةٌ أو طُوي جسم. ويبقى السقفُ حارسًا أخيرًا: شاشةٌ
     أقصرُ من القائمة كلِّها لا تُصلحها توسعة */
  function fmnPlace(el, anchor) {
    const r = anchor.getBoundingClientRect(), gap = 7, pad = 8;
    el.style.maxHeight = (window.innerHeight - pad * 2) + 'px';
    const w = el.offsetWidth;
    el.style.top = (r.bottom + gap) + 'px';
    const x = document.documentElement.dir === 'rtl' ? r.right - w : r.left;
    el.style.left = Math.max(pad, Math.min(x, window.innerWidth - w - pad)) + 'px';
  }
  /* ذيلُ الصفحة: عنصرٌ واحدٌ يُولد مرّةً ويُطوى إلى صفرٍ حين لا يُحتاج */
  let fmnPad = null;
  function fmnRoom(px) {
    if (!fmnPad) {
      if (!px) return;
      fmnPad = document.createElement('div');
      fmnPad.className = 'fmn-room';
      fmnPad.setAttribute('aria-hidden', 'true');
      document.body.appendChild(fmnPad);
    }
    fmnPad.style.height = Math.max(0, px) + 'px';
  }
  /* ===== وفسحةٌ تحت القائمة لا حاشيةُ حدّ =====
     كانت ‎8px‎ — أي «تلتصق بالحافّة ولا تخرج». وذاك يكفي حسابًا ولا يكفي عينًا: قائمةٌ
     ملاصقةٌ لقاع الشاشة تُقرأ مقصوصةً وإن لم تُقصّ، ولا يبقى تحتها ما يُطمئن أنّها تمّت.
     فصارت ‎56‎ — فسحةٌ تُرى فتُقرأ القائمةُ قائمةً بنفسها */
  const FMN_AIR = 56;
  /* ===== والذيلُ يُراكَم ولا يُستبدل =====
     العطبُ المقيس: يُفتح المنتقي فيُوسَّع ويُمرَّر، ثمّ تُضغط «إيموجي» فيطول الجسمُ —
     فيُقاس المطلوبُ من جديد. وهو يُقاس من موضع المرساة **بعد** التمرير الأوّل، فيخرج
     رقمًا صغيرًا (ما بقي من الفيض لا الفيضَ كلَّه). وكان يُكتب مكانَ الذيل القائم:
     فيمضي الذيلُ من ‎163‎ إلى ‎170‎ — سبعةُ بكسلات — ثمّ يُطلب تمريرٌ بمئةٍ وسبعين،
     فيُقصّ إلى سبعة. فتبقى القائمةُ تحت الحافّة وقد «وُسِّع» لها.
     والصوابُ أنّ الرقمين جنسان: المقيسُ **زيادةٌ** على القائم لا بديلٌ عنه.
     فيُجمعان، ويُمرَّر بالزيادة وحدَها — فيستوي الحسابُ في كلّ مرّة.
     وينفع الجمعُ في النقصان كذلك: من ردّ الشريحةَ إلى «مجلد» قصُر جسمُها فخرج المقيسُ
     سالبًا، فينكمش الذيلُ بقدره وتُردّ الفسحةُ إلى الصفحة */
  function fmnFit(el, anchor) {
    const gap = 7;
    const cur = fmnPad ? (parseFloat(fmnPad.style.height) || 0) : 0;
    const need = (anchor.getBoundingClientRect().bottom + gap + el.offsetHeight + FMN_AIR)
      - window.innerHeight;
    if (need <= 0 && !cur) return;
    fmnRoom(Math.max(0, cur + need));
    /* ===== والتخطيطُ يُجبَر قبل التمرير =====
       ‏‎scrollTop‎ يُقصّ إلى ‎scrollHeight − clientHeight‎ القائمِ وقتَ الإسناد. وكتابةُ
       ارتفاعِ الذيل تبديلُ نمطٍ لا تخطيطٌ — فقد يُسند التمريرُ على القامة **القديمة**
       فيُقصّ دون ما طُلب، فتتوسّع الصفحةُ ولا تُمرَّر إليها. وقراءةُ ‎scrollHeight‎
       تُجبر التخطيطَ مرّةً واحدة (لا في حلقة) فيُقصّ على القامة الجديدة */
    void document.body.scrollHeight;
    /* والـ‎body‎ هو حاوي التمرير في هذا الموقع (‎html‎ عليها ‎overflow: hidden‎).
       والنقصانُ لا يُمرَّر: انكماشُ الذيل يقُصّ ‎scrollTop‎ من نفسِه */
    if (need > 0) document.body.scrollTop += need;
    /* ثمّ يُعاد الإرساءُ فورًا: المرساةُ صعدت، ولا يُنتظر حدثُ التمرير — هو غيرُ متزامن */
    const a2 = ffbOf(fmn && fmn.id) || anchor;
    fmnPlace(el, a2);
  }
  /* أقربُ سلفٍ يمرّر — الصندوقُ الذي **يقصّ** المرساة. والقائمةُ تعيش خارجه (ابنةَ ‎body‎)
     فلا يقصّها هو، ولذلك يجب أن تُسأل عنه صراحةً: المرساةُ قد تغيب في فيضه وهي باقيةٌ
     في الشاشة، فتبقى القائمةُ معلَّقةً على صفٍّ لم يعد يُرى وتطفو على ما ليس لها */
  function fmnBoxOf(el) {
    let p = el && el.parentElement;
    while (p && p !== document.body && p !== document.documentElement) {
      const oy = getComputedStyle(p).overflowY;
      if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
      p = p.parentElement;
    }
    return null;
  }
  const closeFolderMenu = () => {
    if (!fmn) return;
    if (fmn.el && fmn.el.parentNode) fmn.el.parentNode.removeChild(fmn.el);
    fmn = null;
    fmnRoom(0);   /* والذيلُ يُطوى: توسعةٌ بلا قائمةٍ فراغٌ في قاع الصفحة */
  };
  /* ============================================================
     ديكُ القائمة — «القائمةُ تسأل الشاشةَ خلفها» في صورتها السادسة
     ============================================================
     كانت خمسةُ مواضعَ تقرأ ‎edPack().deck‎ — أي **رزمةَ المساهمة المحرَّرة في المكتبة**.
     وهو صوابٌ ما دامت القائمةُ لا تُفتح إلّا من شجرة المحرّر. فلمّا صار مجلّدُ «رحلتي»
     يفتحها، صار السؤالُ يقع على ديكٍ ليس ديكَه: ‎findNode‎ لا تجد المعرّف، فالقائمةُ
     تُغلق فورَ فتحها ولا يُصاح.
     فيُكتب الديكُ **في القائمة عند ولادتها** (من موضع زرّها) لا يُستنتج عند كلّ قراءة:
     الشاشةُ قد تتبدّل تحتها، والوسمُ لا يتبدّل.
     ============================================================ */
  const fmnDeck = () => (fmn && fmn.road) ? roadOf(nookEntry, true) : edPack().deck;
  function openFolderMenu(id, anchor) {
    closeFolderMenu();
    /* والوسمُ يُقرأ من الزرّ قبل أن تُبنى القائمة — فتُقرأ به هي نفسُها */
    const road = !!(anchor && anchor.closest && anchor.closest('#nk-road'));
    const r = findNode(road ? roadOf(nookEntry, true) : edPack().deck, id);
    if (!r) return;
    document.body.insertAdjacentHTML('beforeend', fmnHTML(r.n));
    const el = document.body.lastElementChild;
    fmn = { id, el, road, tab: 'col', box: fmnBoxOf(anchor) };
    fmnPlace(el, anchor);
    fmnFit(el, anchor);
    fmnClip();
  }
  /* الحفظ يقع فورًا على العقدة ثمّ يُعاد رسمُ الصفّ وحدَه — لا الشجرةِ كلِّها:
     إعادةُ رسمها تُغلق القائمةَ وتُفقد موضعَ الحقول المفتوحة تحت يدك */
  const ffbOf = id => document.querySelector(`.cx-face[data-id="${CSS.escape(String(id))}"]`);
  function fmnPaint(id) {
    const r = findNode(fmnDeck(), id);
    if (!r) return;
    const btn = ffbOf(id);
    if (!btn) return;
    const col = folderColor(r.n);
    btn.style.color = col;
    btn.innerHTML = folderFace(r.n);
    const wrap = btn.closest('.x3-fwrap');
    if (wrap) { wrap.style.setProperty('--fc', col); wrap.classList.toggle('has-em', !!r.n.em); }
  }
  /* ===== معالجةُ القائمة على ‎document‎ لا على ‎.cm-panel‎ =====
     ومعها زرُّ الفتح: القائمةُ ابنةُ ‎body‎ (وإلّا قصّها فيضُ صندوق الشجرة)، ومعالجُ الشجرة
     مربوطٌ بـ‎.cm-panel‎ — فحدثُ القائمة لا يبلغه أصلًا. فيجتمع البابان هنا في مستمعٍ واحد */
  document.addEventListener('click', e => {
    if (!e.target.closest) return;
    const ffb = e.target.closest('.cx-face');
    if (ffb) {
      if (fmn && fmn.id === ffb.dataset.id) closeFolderMenu();
      else openFolderMenu(ffb.dataset.id, ffb);
      return;
    }
    const box = e.target.closest('.fmn');
    if (!box) { if (fmn) closeFolderMenu(); return; }
    if (!fmn) return;
    const r = findNode(fmnDeck(), fmn.id);
    if (!r) { closeFolderMenu(); return; }

    const seg = e.target.closest('.fmn-seg button');
    if (seg) {
      box.querySelectorAll('.fmn-seg button').forEach(x => x.classList.toggle('on', x === seg));
      fmn.tab = seg.dataset.tab;
      if (seg.dataset.tab === 'folder') {
        /* «مجلد» قرارٌ لا تبويب: ينزع الوجهَ ويطوي ما تحته */
        delete r.n.em;
        save(); fmnPaint(fmn.id);
        box.querySelector('.fmn-body').innerHTML = '';
      } else {
        box.querySelector('.fmn-body').innerHTML = fmnFaceHTML(r.n);
      }
      /* ===== ويُعاد الإرساء =====
         كان لا يُعاد، وحجّتُه أنّ الرأسَ معقودٌ بالأيقونة لا بالارتفاع. وقد صار يتبع
         الارتفاعَ **في المرفوعة وحدَها** (‎fmnPlace‎)، فجسمٌ ينمو بلا إرساءٍ ثانٍ يفيض
         تحت الحافّة من جديد. وفي غير المرفوعة لا يقع شيء: الحسابُ يردّ الموضعَ نفسَه */
      fmnFollow();
      /* والجسمُ إذا نما احتاج ذيلًا أطول — فيُعاد القياسُ لا الإرساءُ وحدَه */
      { const a = ffbOf(fmn.id); if (a) fmnFit(box, a); }
      /* ولا يُعاد الإرساءُ هنا: الرأسُ معقودٌ بالأيقونة لا بالارتفاع، فتبدُّلُ الجسم
         لا يمسّه. وإعادةُ الحساب عند كلّ تبديلٍ هي بابُ القفز الذي أُغلق.
         ويُعاد القناعُ وحده: الطولُ تبدّل فقد يتجاوز حافّةَ اللوحة السفلى */
      fmnClip();
      return;
    }
    const sw = e.target.closest('.fmn-sw');
    if (sw) {
      r.n.ci = +sw.dataset.ci;
      box.querySelectorAll('.fmn-sw').forEach(x => x.classList.toggle('on', x === sw));
      save(); fmnPaint(fmn.id);
      return;
    }
    const emb = e.target.closest('.fmn-em');
    if (emb) {
      /* الضغطةُ على المختار ترفعه: لا يُحبس المرءُ في وجهٍ أخطأ فيه — كلسان الخيار الصواب */
      r.n.em = (r.n.em === emb.dataset.em) ? null : emb.dataset.em;
      if (!r.n.em) delete r.n.em;
      box.querySelectorAll('.fmn-em').forEach(x => x.classList.toggle('on', x.dataset.em === r.n.em));
      save(); fmnPaint(fmn.id);
      return;
    }
    const cb = e.target.closest('.fmn-cb');
    if (cb) {
      /* بابُ التصنيف يُفرِّغ حقل البحث: ملاحتان على القائمة نفسِها لا تجتمعان،
         وإلّا رأيتَ بابًا مختارًا ونتيجةً لا تخصّه */
      const c = +cb.dataset.cat, s = box.querySelector('.fmn-search');
      if (s) s.value = '';
      box.querySelectorAll('.fmn-cb').forEach(x => x.classList.toggle('on', x === cb));
      const list = c < 0 ? EM_LIST : EM_LIST.filter(n => emCat(n) === c);
      box.querySelector('.fmn-grid').outerHTML = fmnGridHTML(r.n, list, c < 0);
    }
  });
  /* البحث: ترشيحٌ حيٌّ على الشرائح الإنجليزيّة (أسماءُ الرزمة إنجليزيّة، ولا جدولَ عربيًّا لها بعد).
     والكتابةُ تردّ الرفَّ إلى «الكلّ»: البحثُ يجري في المجموعة كلِّها لا في بابٍ منها */
  document.addEventListener('input', e => {
    const s = e.target.closest && e.target.closest('.fmn-search');
    if (!s || !fmn) return;
    const r = findNode(fmnDeck(), fmn.id);
    if (!r) return;
    /* السؤالُ يُطبَّع كما طُبِّع المخزون، فيلتقي العربيُّ بالعربيّ والإنجليزيُّ بالإنجليزيّ
       في حقلٍ واحد — «كتاب» و‎book‎ كلاهما يصيب 📖 */
    const q = arNorm(s.value.trim());
    const list = q ? EM_LIST.filter(n => EM_Q[n].indexOf(q) > -1) : EM_LIST;
    fmn.el.querySelectorAll('.fmn-cb').forEach(x => x.classList.toggle('on', x.dataset.cat === '-1'));
    fmn.el.querySelector('.fmn-grid').outerHTML = fmnGridHTML(r.n, list, !q);
  });
  /* ===== التمرير: تتبعٌ لا اختفاء =====
     القائمةُ ابنةُ ‎body‎ بموضعٍ ثابت، فلا تتحرّك مع ما تحتها. وكانت **تُغلق** عند أيّ تمرير،
     فتختفي تحت يد من يتصفّحها — وهي عِلّةٌ لا ميزة. فصارت **تُعاد إلى مرساتها**،
     ولا تُغلق إلّا إن غابت المرساةُ عن الشاشة: لا تبقى قائمةٌ معلَّقةٌ على ما لا يُرى.
     والحدثُ يُلتقط في مرحلة القنص (‎true‎) لأنّ صندوق الشجرة يمرّر ولا يُصعّد حدثَه */
  /* ===== القصُّ بالإطار: تنزلق تحته ولا تخرج عليه ولا تُغلق =====
     القائمةُ ابنةُ ‎body‎ بموضعٍ ثابت، فلا يبلغها فيضُ اللوحة التي تسكنها المرساة —
     فكانت تصعد فوق حافّة «البطائق» وتطفو على ما ليس لها. والعلاجُ ليس إغلاقها
     (فتختفي تحت اليد) ولا نقلَها إلى داخل اللوحة (فيقصّها فيضُها الأفقيُّ أيضًا)،
     بل **قناعٌ** بحدود اللوحة يُحسب مع كلّ تمرير: فما تجاوز الحافّةَ اختفى تحتها
     وما دونها بقي — تمامًا كورقةٍ تنزلق تحت مسطرة. والقصُّ بلا انحناء: القطعُ المستقيمُ
     هو الذي يُقرأ «تحت الحافّة»، والمنحني يُقرأ بطاقةً مقصوصة.
     و‎clip-path‎ يقصّ الالتقاطَ كما يقصّ الرسم، فلا يُضغط ما لا يُرى */
  function fmnClip() {
    if (!fmn || !fmn.el) return;
    const el = fmn.el;
    el.style.visibility = '';
    if (!fmn.box) { el.style.clipPath = ''; return; }
    const b = fmn.box.getBoundingClientRect(), r = el.getBoundingClientRect();
    /* ===== ولا قناعَ إن كان اللوحُ أقصرَ من القائمة =====
       القناعُ مبنيٌّ على صورةٍ واحدة: **ورقةٌ تنزلق تحت مسطرة** — ولوحُ «البطائق» أطولُ
       من القائمة أضعافًا، فلا يبيت منها تحت الحافّة إلّا طرف.
       ومربّعُ «رحلتي» لوحٌ صغير: قد يكون **أقصرَ من القائمة كلِّها**، فيبتلعها القناعُ
       فلا يبقى منها ما يُرى — وهي موجودةٌ تُحسب ولا تُدرَك. وذاك نصفُ العطب المبلَّغ.
       والحدُّ ليس ذوقًا: قناعٌ لا يُبقي من الشيء ما يُستعمل ليس قناعًا بل حذف.
       فإن ضاق اللوحُ تُترك تطفو — وهو حكمُ المنبثقات في الأصل — ويبقى الحارسُ الآخر:
       إن غابت مرساتُها عن اللوح غابت معها، فلا تُشير إلى ما ليس على الشاشة */
    const ar = (a => a ? a.getBoundingClientRect() : null)(ffbOf(fmn.id));
    if (b.height < r.height + 16) {
      el.style.clipPath = '';
      if (ar && (ar.bottom <= b.top || ar.top >= b.bottom)) el.style.visibility = 'hidden';
      return;
    }
    const top = Math.max(0, b.top - r.top), bot = Math.max(0, r.bottom - b.bottom);
    el.style.clipPath = (top || bot) ? `inset(${top}px 0px ${bot}px 0px)` : '';
  }
  /* ولا توسعةَ في المتابعة: هذه تجري مع كلّ تمريرٍ باليد، وتوسعةٌ فيها تُطيل الصفحةَ
     تحت إصبع المستخدم فلا يبلغ قاعَها أبدًا. التوسعةُ عند الفتح وعند نموّ الجسم وحدهما */
  const fmnFollow = () => {
    if (!fmn) return;
    const a = ffbOf(fmn.id);
    if (!a) { closeFolderMenu(); return; }   /* ذهب الصفُّ نفسُه (إعادةُ رسمٍ للشجرة) */
    fmnPlace(fmn.el, a);
    fmnClip();
  };
  document.addEventListener('scroll', e => {
    if (!fmn) return;
    const t = e.target;
    /* تمريرُ الشبكة ملاحةٌ داخل القائمة: عنده تلحق الدفعةُ التالية ولا يُمَسّ الموضع */
    if (t && t.nodeType === 1 && t.classList && t.classList.contains('fmn-grid')) {
      if (!fmnGrid || fmnGrid.at >= fmnGrid.list.length) return;
      if (t.scrollTop + t.clientHeight < t.scrollHeight - 140) return;
      const r = findNode(fmnDeck(), fmn.id);
      if (!r) return;
      const to = Math.min(fmnGrid.at + FMN_STEP, fmnGrid.list.length);
      t.insertAdjacentHTML('beforeend', fmnRows(r.n, fmnGrid.list, fmnGrid.cats, fmnGrid.at, to));
      fmnGrid.at = to;
      return;
    }
    if (t && t.nodeType === 1 && t.closest && t.closest('.fmn')) return;
    fmnFollow();
  }, true);
  window.addEventListener('resize', fmnFollow);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && fmn) closeFolderMenu(); });

  /* ===== اسم المجلد الجديد: «مجلد ١» ثمّ «مجلد ٢» ثمّ… =====
     يُبنى على **أعلى رقمٍ مستعمل في الرزمة كلّها** لا على عدد المجلدات: لو حُذف «مجلد ٢»
     من بين ثلاثة، لَأعطى العدُّ «مجلد ٣» وهو قائمٌ فيتكرّر اسمان. والأسماء تظهر في قائمة
     الوجهات سلسلةً بـ‎::‎، والمكرّر فيها لا يُفرَّق.
     ويُمسح الشجرة كلّها لا الإخوةَ وحدهم — لأنّ القائمة تعرض مجلدات الرزمة جميعًا في مستوًى واحد */
  function nextFolderName(deck) {
    const base = T().pkFolderN;
    const rx = new RegExp('^' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+(\\d+)$');
    let max = 0;
    const walk = ns => (ns || []).forEach(n => {
      if (n.t !== 'f') return;
      const m = rx.exec(String(n.name || '').trim());
      if (m) max = Math.max(max, +m[1]);
      walk(n.ch);
    });
    walk(deck);
    return base + ' ' + (max + 1);
  }
  /* عدد بنود وجهةٍ بعينها — لا وجهةِ البطاقة الحاليّة وحدها،
     فالمسار قد يعرض وجهةَ نقلٍ مهيَّأة لم تنتقل إليها بعد */
  function cdDestCount(fid) {
    const deck = cdDeck();
    const r = fid ? findNode(deck, fid) : null;
    const arr = r ? (r.n.ch || []) : (fid ? [] : deck);
    return arr.filter(n => n.t === 'c' || n.t === 'q').length;
  }
  /* مسار الوجهة: [أيقونة الجذر] المكتبة / [كتاب المادة] المادة::المجلد (عدد بطائقها).
     اسم الوجهة على طريقة أنكي — سلسلةٌ بـ‎::‎ لا أيقونات مجلدات.
     والرقم على الوجهة لا على المادة: هو نفسه ما يمشي عليه المؤشّر «١/١»، فيتّفق الرقمان */
  function cdPathHTML() {
    const code = cdCourse();
    const c = CM[code] || { code: code, ar: code };
    const nm = state.lang === 'ar' ? arShort(c) : c.code;
    /* الوجهة المعروضة: وجهةُ النقل المهيَّأة إن وُجدت، وإلّا ملفُّها الحاليّ.
       ولمّا صارت القائمة تنطبق بالاختيار، لم يبقَ ما يسمّي الوجهة المهيَّأة غيرُ هذا السطر —
       فلولا عرضُها لضغط المستخدمُ «+» ولا يدري إلى أين */
    const eff = cdMoving() ? cardDlg.moveTo : (cardDlg.pid || '');
    /* الزرّ يحمل اسم الملفّ وحده — والمادةُ مقطعٌ قبله كمقطع «المكتبة»: أيقونةٌ واسم.
       فيصير المسار ثلاثة مقاطع متساوية البنية، والمضغوطُ منها آخرُها وحده */
    const chain = (eff ? cdChain(eff) : [T().cdRootFolder])
      .map(x => esc(x)).join('<i class="cd-dc">::</i>');
    const seg = (ic, tx) => `<span class="cd-seg">${ic}<span>${esc(tx)}</span></span>`;
    const sl = '<i class="cd-sl">/</i>';
    /* كتاب المادة نفسه ثلاثيّ الأبعاد بغلافه، لا أيقونة كتاب عامّة */
    const bk = `<span class="cd-bk">${bookMini(code, imgOf(code))}</span>`;
    /* رمز الوجهة كرموز الشجرة والقائمة: مجلدٌ ممتلئٌ **بلونه هو**، وكتابُ المادة للجذر —
       فالجذر ليس مجلدًا بل المادةُ نفسُها، ولا يصحّ أن يلبس رمزَ ما ليس منه.
       واللون يجعل الوجهة تُعرف من طرف العين قبل قراءة اسمها */
    const effN = eff ? (findNode(cdDeck(), eff) || {}).n : null;
    /* ===== وفصلُ الرحلة يلبس دائرتَه لا مجلدًا ملوّنًا =====
       رمزُ الفصل في «رحلتي» ‎.tp-order‎ — قرصٌ فيه ترتيبُه، وهو رمزُ الموضوع في «المادة»
       بعينه. فلو لبس في المسار مجلدًا ملوّنًا لَافترق الشيءُ عن نفسِه بين موضعين.
       ورقمُه ترتيبُه بين الفصول لا بين البنود: ما تملكه أنت في الجذر لا يُرقَّم */
    const chTP = effN && effN.tp === 1;
    const chNo = chTP ? cdDeck().filter(n => n.tp === 1).indexOf(effN) + 1 : 0;
    const dic = !eff ? bk
      : chTP ? `<i class="cd-fic cd-fic--tp"><b class="tp-order">${chNo}</b></i>`
        : `<i class="cd-fic" style="color:${folderColor(effN || { id: eff })}">${PK_IC.folderFill}</i>`;
    /* سهمُ الانسدال قبل رمز الملفّ: يقول إنّ للوجهة قائمةً تُفتح — والتسطيرُ المنقّط وحده
       كان يقول «يُضغط» ولا يقول «ينسدل». وهو **داخل الزرّ** فيكفيه مستمعُه، ولا يُحدث
       له فعلٌ ثانٍ يفترق عنه. وخارج ‎.cd-segl‎ عمدًا: التسطيرُ للاسم لا للسهم */
    /* ===== والوجهةُ تُنقل حيث تُملَك =====
       الوجهةُ زرٌّ ينسدل فتُنقل البطاقةُ إلى مجلّدٍ آخر. وذاك فعلٌ على **مكانها في
       الرزمة** — فلا يقع في نافذةٍ مقفلة: لا في وجهٍ من أوجه بطاقةٍ (الوجهُ ليس بندًا
       يُنقل، هو جزءٌ من أمّه)، ولا في بطاقةٍ منشورةٍ (رزمةُ غيرك لا تُرتَّب بيدك).
       **ويُستثنى دفترُك**: بطاقةٌ استوردتَها إلى «رحلتي» مقفلةُ **المتن** — نسخةُ عمل
       غيرك لا تُحرَّر — وأمّا **مكانُها** فمكانُك أنت، ترتّبه كما شئت.
       فالحدُّ: مقفلةٌ وليست من رحلتك ⇐ خبرٌ لا باب. ويسقط معه السهمُ: هو الذي يقول
       «ههنا قائمةٌ تنسدل»، فبقاؤه بلا قائمةٍ وعدٌ لا يقع. ويسقط المعرّفُ (‎id‎) كذلك
       فلا يبلغه معالجُه أصلًا — والحارسُ في الوسم أوثقُ من حارسٍ في الجلد */
    const canMove = !cardDlg.ro || !!cardDlg.road;
    const segl = `<span class="cd-segl">${dic}<span>${chain}</span><i class="cd-cnt">(${cdDestCount(eff)})</i></span>`;
    const dest = canMove
      ? `<button type="button" class="cd-fbtn${cdMoving() ? ' is-move' : ''}${cardDlg.list ? ' is-open' : ''}" id="cd-folder"
         title="${esc(cdMoving() ? T().cdMoveHere : T().cdWhere)}"
         aria-expanded="${cardDlg.list ? 'true' : 'false'}">
         <i class="cd-fdrop">${CD_IC.chev}</i>
         ${segl}</button>`
      : `<span class="cd-fbtn cd-fbtn--fix">${segl}</span>`;
    /* مقطع المادة يُصدَّر بوصفٍ للمساهمة: «مساهمة [وضعها] في [كتاب] المادة».
       والوضع أيقونةٌ من ‎PST_IC‎ نفسِها التي في نافذة السؤال — تُقرأ من المساهمة المحرَّرة
       لا من نسخةٍ عنها، فلا يفترق ما يراه المسار عمّا تعرضه شارةُ الوضع */
    /* ===== و«مساهمة» تسقط عن بطاقة الرحلة =====
       المقطعُ يقول «مساهمةٌ [وضعُها] في [كتاب] المادّة» — وهو صدقٌ لبطاقةٍ في رزمةٍ تُنشر.
       وبطاقةُ «رحلتي» ليست مساهمةً ولا تُنشر ولا وضعَ لها، فالمقطعُ فيها **خبرٌ كاذب**
       ورمزُ وضعٍ لا مرجعَ له (‎editingPost()‎ تردّ ‎null‎ في الرَّكن أصلًا).
       فيسقط، ويبقى الكتابُ — فيصير المسارُ: الرَّكن / كتابُ المادّة / الفصل */
    const road = !!(cardDlg && cardDlg.road);
    const ep = road ? null : editingPost();
    const st = pstOf(ep), po = PST()[st] || PST().priv;
    const mine = road ? '' : `<span class="cd-seg cd-seg--pst" title="${esc(po.n + ' — ' + po.d)}">
        <span>${esc(T().cdContrib)}</span><i class="cd-pst is-${st}">${po.ic}</i>
        <span>${esc(T().cdInWord)}</span></span>`;
    /* لا جملةَ في المسار: مقاطعُ وفواصلُ فقط — الجذر / المادة / الملفّ */
    return seg(cdInNook() ? CD_IC.nook : CD_IC.lib, cdRootLbl()) + sl
      + mine + seg(bk, nm) + sl + dest;
  }
  /* وجهات الرزمة للمنتقي: **اسم الملفّ وحده** لا سلسلةَ آبائه.
     القائمة منتقًى لا مسار — والسلسلةُ بـ‎::‎ مكانُها سطرُ المسار فوقها، حيث تُفيد «أين هي».
     وهنا لا تفيد: تُطيل السطور وتُدخل بينها ما يتشابه، فيصعب التقاطُ الاسم المطلوب */
  function cdDestList() {
    const deck = cdDeck();
    const cnt = arr => (arr || []).filter(n => n.t === 'c' || n.t === 'q').length;
    const out = [{ id: '', name: T().cdRootFolder, n: cnt(deck) }];
    const walk = (ns, trail) => (ns || []).forEach(n => {
      if (n.t !== 'f') return;
      const t = trail.concat(n.name || T().pkTitlePh);
      out.push({ id: n.id, name: n.name || T().pkTitlePh, n: cnt(n.ch), col: folderColor(n) });
      walk(n.ch, t);
    });
    walk(deck, []);
    return out;
  }
  /* ============================================================
     ديكُ النافذة — أين تكتب هذه النافذة، ولا تُسأل الشاشةُ خلفها
     ============================================================
     كان الجوابُ ‎edPack().deck‎ أبدًا: «رزمةُ المادّة المعروضة واللسان المفتوح». وهو
     صوابٌ لنافذةٍ وُلدت في المحرّر، وخطأٌ لكلّ نافذةٍ سواها. وقد نُقض مرّتين:
       · **نافذةُ الاختبار** تحمل رزمتَها (‎xtPk‎) والشاشةُ خلفها تتنقّل.
       · و**نافذةُ بطاقةٍ في «رحلتي»**: مخزنُها ‎entry.road‎ لا رزمةَ مساهمةٍ أصلًا.
     فيُجمع الجوابُ في دالّةٍ واحدةٍ تسأل النافذةَ عن نفسِها، وتقرؤها ‎cdNode‎ و‎cdHost‎
     و‎cdFolderName‎ — فلا يفترق موضعُ القراءة عن موضع الكتابة يومًا */
  const cdDeck = () => {
    /* ونافذةُ الاقتراح ديكُها عقدتُها وحدَها: لا تسكن رزمةً ولا رحلة، فما يُكتب فيها
       لا يبلغ شيئًا حتى يُرسَل أو يُعتمد */
    if (cardDlg && cardDlg.what === 'prop' && cardDlg.pnode) return [cardDlg.pnode];
    if (cardDlg && cardDlg.what === 'exam' && xtPk && xtPk.data) return xtPk.data.deck || [];
    if (cardDlg && cardDlg.road) return roadOf(cardDlg.roadE || nookEntry, true);
    /* ===== وديكُ المنشور رابعٌ =====
       البطاقةُ المنشورةُ ليست في رزمتك (‎edPack‎) ولا في رحلتك ولا في اختبار — هي في
       **مساهمة غيرك**. فتُقيَّد هويّتُها في النافذة عند ولادتها (المادّةُ والبند
       والمعرّف) وتُقرأ منها: الشاشةُ تتنقّل والوسمُ لا يتنقّل.
       وهي خامسةُ «النافذةُ تسأل الشاشةَ خلفها» */
    if (cardDlg && cardDlg.pub) {
      const q = cardDlg.pub;
      const p = (postsOf(q.code, q.sub) || []).find(x => x.id === q.id);
      return (p && p.data && Array.isArray(p.data.deck)) ? p.data.deck : [];
    }
    return edPack().deck;
  };
  const cdFolderName = () => {
    /* وجذرُ «رحلتي» اسمُه اسمُها: «الجذر» لفظُ رزمةٍ، وهذه رحلةٌ */
    if (!cardDlg || !cardDlg.pid) return (cardDlg && cardDlg.road) ? T().nkSelfProgress : T().cdRootFolder;
    const r = findNode(cdDeck(), cardDlg.pid);
    return (r && r.n.name) || T().pkTitlePh;
  };
  /* ---- جلسة الإضافة: البطاقة تُخلق فور فتح النافذة فتُحسب ولو كانت فارغة،
         وما يُكتب فيها يُحفظ تلقائيًّا — لا زرّ حفظ. والتنقّل بين بطائق الوجهة بسهمين ---- */
  const cdHost = () => {                     /* الحاوية التي تنزل فيها البطاقة */
    const deck = cdDeck();
    if (!cardDlg || !cardDlg.pid) return deck;
    const r = findNode(deck, cardDlg.pid);
    return r ? (r.n.ch = r.n.ch || []) : deck;
  };
  /* بنود الوجهة: البطائق وأسئلة الاختيار معًا — مكانٌ واحد ورقمٌ واحد ومؤشّرٌ واحد */
  const cdCards = () => cdHost().filter(n => n.t === 'c' || n.t === 'q');
  /* ===== ونافذةُ الاختبار تُنقّب في رزمتها هي =====
     ‏‎edPack()‎ رزمةُ **المادّة المعروضة واللسان المفتوح** — وهي الصوابُ لنافذة التحرير،
     إذ هي في تلك الرزمة بعينها. وأمّا الاختبارُ فنافذةٌ مستقلّةٌ تحمل رزمتَها (‎xtPk‎)،
     والشاشةُ خلفها تتنقّل: تُغادر إلى مادّةٍ أخرى أو إلى لسانٍ آخر — فيُنقَّب عن بطاقةِ
     الاختبار في رزمةٍ لا تحويها فتُردّ ‎null‎، ويُغلق معها بابٌ بعد باب: لا حضورَ يُقال
     (‎cdHereOn‎ أوّلُ ما تسأل عن العقدة)، ولا ختمَ نسخةٍ ولا تعليقات — والاختبارُ جارٍ
     على بطاقةٍ موجودةٍ يراها أمامه.
     فيُسأل عن رزمته هو. وهي قاعدةُ ‎xtSumSel‎ نفسُها: النافذةُ تتبع نفسَها لا الشاشةَ خلفها */
  const cdNode = () => {
    const r = (cardDlg && cardDlg.id) ? findNode(cdDeck(), cardDlg.id) : null;
    return r ? r.n : null;
  };
  const cdPos = () => {
    const list = cdCards(), i = list.findIndex(n => cardDlg && n.id === cardDlg.id);
    return { i: i, n: list.length };
  };
  /* ============================================================
     «المتعدّد»: سؤالٌ وخياراتٌ تُزاد
     ============================================================
     شكلُه شكلُ «الوجهين» نفسُه — المربّعُ والحشوُ واللسانُ والمِسطرة — ويفترق في ثلاث:
       · لسانُ الأوّل استفهامٌ لا وجه، فهو السؤال.
       · وما تحته خياراتٌ لا ظهرٌ واحد، لسانُ كلٍّ حلقةٌ **تُضغط**: التي تخضرّ هي الصواب،
         وواحدةٌ لا غير (كأزرار المذياع: اختيارُ هذه نزعٌ لتلك).
       · وتحتها زرٌّ يزيد خيارًا.
     والحفظُ في الحقلين نفسِهما لا في نموذجٍ ثالث: ‎n.f‎ السؤال، وسطورُ الخيارات تُصفّ في
     ‎n.b‎ قائمةً — فيبقى كلُّ ما في الملفّ يقرأ البطاقةَ كما كان (السجلّ والشجرة والمعاينة
     والبحث)، ويبقى الصوابُ محفوظًا في ‎n.ok‎ رقمًا وحدَه.
     والمربّعُ الظهرُ يُخفى في هذا النوع ولا يُنزع: أشياءُ كثيرةٌ في الملفّ تسأل عن
     ‎#cd-back‎، فنزعُه يكسرها */
  const cdOptWrap = () => { const st = cdStage(); return st && st.querySelector('.cd-chs'); };
  const cdOptEls = () => { const w = cdOptWrap(); return w ? [].slice.call(w.querySelectorAll('.cd-ch')) : []; };
  /* قراءةُ ما في الصفحة: نصُّ كلّ خيارٍ وأيُّها الصواب */
  function cdOptRead() {
    return cdOptEls().map(el => ({
      t: cdClean(el.querySelector('.cd-in').innerHTML),
      ok: el.classList.contains('is-ok'),
    }));
  }
  /* ===== لسانُ الخيار: حلقةٌ ساكنةً، فإذا حَيِيَ المربّعُ انفرج عن شريطِ حُكم =====
     ما دام المربّعُ خامدًا فاللسانُ حلقةٌ وحدها تقول «هذا خيار» ولونُها يقول أصوابٌ هو أم لا.
     فإذا نقرتَ المربّع (‎is-live‎ — الجدولُ الذهبيُّ نفسُه، لا حالٌ ثانيةٌ تُخترع) انطوت
     الحلقةُ وانفرج اللسانُ عن ثلاثةٍ: صحٌّ أخضر · خطأٌ أحمر · ثمّ خيطٌ فاصل وسلّةٌ تمحو الخيار.
     والسلّةُ وراء الخيط لأنّها من جنسٍ آخر: الحَكَمان يبدّلان صفةَ الخيار، والسلّةُ تمحوه.
     واللسانُ وعاءٌ (‎span‎) لا زرّ: زرٌّ داخل زرٍّ باطلٌ في HTML، والحلقةُ تبقى زرًّا فيه
     كما كانت — فمن تعوّد ضغطَها لم يفقد شيئًا */
  const cdOptHTML = (o, i) => `<div class="cd-field cd-ch${o.ok ? ' is-ok' : ''}">
      <span class="cd-flab cd-chlab" role="group" aria-label="${esc(T().cdOpt)} ${i + 1}">
        <span class="cd-chic" aria-hidden="true">${(cardDlg && cardDlg.lang === 'en') ? CD_IC.optLtr : CD_IC.optRtl}</span>
        <span class="cd-chbar"><span class="cd-chbar__in">
          <span class="cd-chseg" role="radiogroup" aria-label="${esc(T().cdOpt)}">
            <button type="button" class="cd-chok" role="radio" title="${esc(T().cdOptOk)}"
              aria-checked="${!!o.ok}">${CD_IC.tick}</button>
            <button type="button" class="cd-chno" role="radio" title="${esc(T().cdOptNo)}"
              aria-checked="${!o.ok}">${CD_IC.cross}</button>
          </span>
          <i class="cd-chsep"></i>
          <button type="button" class="cd-chdel" title="${esc(T().cdOptDel)}">${TRASH_IC}</button>
        </span></span>
      </span>
      <!-- والقفلُ يُكتب في مولد الصندوق لا يُلحق به: ‎cdQBody(true)‎ تُعيد بناء الخيارات
           **بعد** ‎renderCardDlg‎ (وهي التي تقفل)، فما يُلحق بعد الرسم يمحوه أوّلُ بناء.
           فالمصدرُ هو الحال: من وُلد في نافذةٍ مقفلةٍ وُلد مقفلًا -->
      <div class="cd-in" contenteditable="${(cardDlg && cardDlg.ro) ? 'false' : 'true'}">${o.t || ''}</div>
    </div>`;
  /* ترقيمُ الخيارات وتلميحُ حلقاتها يُعادان من الصفحة بعد كلّ تبديلٍ أو حذف:
     الرقمُ في ‎aria-label‎ يبطُل بحذف ما قبله، والتلميحُ يبطُل بانتقال الصواب */
  function cdOptSync() {
    cdOptEls().forEach((x, i) => {
      const ok = x.classList.contains('is-ok');
      const g = x.querySelector('.cd-chlab');
      if (g) g.setAttribute('aria-label', T().cdOpt + ' ' + (i + 1));
      /* والقرصان زوجُ مذياعٍ لا زرّان: أحدُهما مختارٌ أبدًا، فيُكتب الاختيارُ عليهما معًا.
         والحلقةُ لا تُذكر هنا: صارت خبرًا مرئيًّا لا زرًّا، وحالُها في القرصين */
      const yes = x.querySelector('.cd-chok'), no = x.querySelector('.cd-chno');
      if (yes) yes.setAttribute('aria-checked', ok);
      if (no) no.setAttribute('aria-checked', !ok);
    });
  }
  /* ورقُ الخيارات يُقرأ من **المربّع الظهر المخفيّ** لا من العقدة رأسًا: كلُّ بابٍ يملأ
     البطاقةَ في هذا الملفّ (فتحةٌ · نافذةٌ جديدة · نسخةٌ تُطالَع · رجعةٌ إلى نسخة) يكتب
     فيه ما يريد إظهاره، فيصير هو المَورد الواحد فلا يُلاحق كلُّ بابٍ على حدة.
     وأمّا رقمُ الصواب فلا موضعَ له إلّا العقدة */
  function cdOptData() {
    const n = cdNode(), bk = $('#cd-back');
    const src = String((bk && bk.innerHTML) || (n && n.b) || '');
    /* السطورُ من قائمة ‎<li>‎ إن كانت، وإلّا فالنصُّ كلُّه خيارٌ أوّل (بطاقةٌ قديمة تُحوَّل) */
    const li = src.match(/<li[^>]*>[\s\S]*?<\/li>/gi);
    const parts = li ? li.map(x => x.replace(/^<li[^>]*>|<\/li>$/gi, '')) : (stripRich(src) ? [src] : ['']);
    const ok = n && typeof n.ok === 'number' ? n.ok : -1;
    return parts.map((t, i) => ({ t: t, ok: i === ok }));
  }
  /* ============================================================
     «الفراغ» — رقاقةٌ في المحرّر، وقوسان في المخزن
     ============================================================
     المخزونُ صيغةُ أنكي حرفيًّا: ‎{{c1::النصّ}}‎ — فالملفُّ يُقرأ هناك ويُقرأ هنا، ويصمد
     التصديرُ والاستيراد. أمّا في المحرّر فلا أقواسَ في المتن أصلًا: يُلَفُّ المحدَّدُ في
     **رقاقة** ‎<span class="cd-cz" data-c="1">‎.
     ولهذا سببان لا سببٌ واحد:
       · الرقمُ يُعرض بحرف اللغة (‎ف١‎ عربيًّا و‎c1‎ لاتينيًّا) من غير أن يُمَسّ المخزون.
       · والأقواسُ ‎{{ }}‎ و‎::‎ محايدةُ الاتّجاه، فلو كُتبت في متنٍ عربيٍّ لَقلبها التحكّمُ
         الثنائيّ ورأيتَها في غير موضعها — والرقاقةُ تُخرجها من النصّ فتزول العلّة أصلًا.
     والتحويلُ في طرفين اثنين لا غير: ‎czChips‎ عند الرسم، و‎czText‎ عند الحفظ */
  /* ===== الرقمُ يعود، ووسمُه خارجَ القوسين =====
     كان الرقمُ مرفوعًا من الواجهة وثابتًا في المخزن (‎c1‎ أبدًا)، فكلُّ ما في البطاقة
     يختفي معًا في سؤالٍ واحد. وعاد اليومَ لأنّ الحاجةَ التي رُفع لأجلها زالت: السطرُ
     الواحد يُسأل عن كلمتين سؤالين، وتتبّعُ السجلّ حُلّ بتوسيع البطاقة في الشجرة.
     ===== والوسمُ في موضع حرف أنكي: ‎c‎ ⇄ ‎بط‎ =====
     صيغةُ المحرّر هي صيغةُ المخزن بعينها، لا يفترقان إلّا في الحرف: ‎{{بط1::النصّ}}‎
     هنا و‎{{c1::النصّ}}‎ هناك. فالمستخدمُ يرى بناءً واحدًا لا بناءين، والفاصلُ ‎::‎ باقٍ
     في موضعه فيُقرأ الوسمُ جزءًا من الفراغ لا لاحقةً معلّقةً به.
     وعلّةُ رفع الرقم قديمًا كانت الاتّجاه: ‎c1::‎ حرفٌ لاتينيٌّ ورقمٌ ونقطتان في متنٍ
     عربيّ، فيقلبها التحكّمُ الثنائيّ. و**تعريبُ الحرف يحلّ ذلك من أصله**: ‎بط‎ عربيّةٌ
     فالجوارُ كلُّه من اليمين، فلا محايدَ يتردّد بين اتّجاهين.
     (وجُرّب الوسمُ خارج القوسين — ‎{{النصّ}}بط1‎ — فرُدّ: يُقرأ لاحقةً غريبةً عن الفراغ،
     ويحتاج مطابقةَ القوس المغلق فيهنُ عند التحرير.)
     ===== والرقمُ اسمٌ لا موضع =====
     الجديدُ يأخذ ما فوق الأكبر ولا يملأ فجوةَ محذوف. ولو مُلئت الفجوةُ لَورث الفراغُ
     الجديدُ سجلَّ فراغٍ حُذف قبله — فيُقال لك «راسخة» عن كلمةٍ لم ترها قطّ، وهو فسادٌ
     يبدو سليمًا. وأنكي لا يشترط تتابعَ الأرقام، فالفجوةُ لا تكلّف الملفَّ شيئًا.
     والتلميحُ ‎::‎ بعد النصّ — صيغةُ أنكي نفسُها: ‎{{c1::النصّ::التلميح}}‎ */
  /* ===== حرفان في المحرّر وحرفٌ في المخزن =====
     الوسمُ الذي يراه المؤلّفُ اثنان لا غير: ‎بط‎ في الكتابة من اليمين و‎Ca‎ في اليسار.
     و‎c‎ ليس ثالثًا لهما، بل هو حرفُ **المخزن** (صيغةُ أنكي) — يُقرأ حين يُفتح الملفّ
     ويُكتب حين يُحفظ، ولا يُعرض للمؤلّف قطّ.
     فالمطابقةُ تسع الثلاثةَ لأنّها تخدم الطريقين: ‎czShow‎ تقرأ المخزونَ لتعرضه وتقرأ
     المعروضَ لتقلبَ حرفَه عند تبديل الاتّجاه، فلو قُصرت على المخزن لَما انقلب الوسم.
     (وكان معها ‎ف‎ من صيغةٍ سابقةٍ لم تُشحن قطّ — فرُفعت: مطابقةٌ تحرس ماضيًا لم يقع
     تكلفةٌ بلا مقابل، وتُوهم قارئَ الشيفرة أنّ في الملفّات صيغةً رابعة) */
  const CZ_ANY = /\{\{\s*(?:c|بط|Ca)\s*([0-9٠-٩]+)\s*::/g;
  const CZ_OPEN = /\{\{(?!\s*(?:c|بط|Ca)\s*[0-9٠-٩]+\s*::)/g;   /* قوسٌ بلا وسم */
  /* ===== وحقولُ الفراغ تُطلب من مسرحها لا بالمعرّف =====
     المعرّفُ للمركَّزة وحدَها، وفي الصفحة مسارحُ أخرى (مطويّةٌ أو مهجورة) قد تحمل
     معرّفاتٍ حيّة — فتسبقُ في ‎querySelector‎ فيُقرأ حقلٌ ليس الذي تكتب فيه.
     وقد وقع نظيرُ هذا مرّتين: نافذةٌ رُسمت في مطويّة، وعدّادٌ قرأ متنًا مضى فلم يتبدّل
     بحرفك. والمسرحُ (‎cdStage()‎) يصيب أبدًا: هو نافذتُك بعينها لا ما يشبهها */
  const czFields = () => {
    const st = cdStage();
    return st ? [...st.querySelectorAll('.cd-body > .cd-field > .cd-in')] : [];
  };
  /* الأرقامُ الهنديّة تُردّ لاتينيّةً: المخزونُ يُقرأ في أنكي، وهو لا يعرف إلّا اللاتينيّة */
  const czDig = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  /* ===== والوسمُ يتبع اتّجاهَ كتابة البطاقة لا لغةَ الموقع =====
     هو حرفٌ **في متنها**، فحكمُه حكمُ ما حوله: من قلب اتّجاهَ البطاقة قلبه معها.
     ورُبط أوّلًا بلغة الواجهة فكان خطأً ظاهرُه صواب — يكتب في بطاقةٍ عربيّةٍ حرفًا
     لاتينيًّا لأنّ الموقعَ إنجليزيّ، ويُبقي ‎بط‎ في بطاقةٍ قُلبت إلى اليسار.
     ولا يحتاج قلبُه بابًا خاصًّا: زرّا الاتّجاه يستدعيان ‎renderCardDlg‎، وهي تمرّ
     بـ‎czBody‎ ⇐ ‎czShow‎ — فالوسمُ ينقلب في المسار القائم بلا سطرٍ يُضاف */
  const czTagOf = () => (I18N[(cardDlg && cardDlg.lang) || 'ar'] || I18N.ar).czTag;
  const czOpenOf = n => '{{' + czTagOf() + n + '::';
  /* المعروضُ ⇐ المخزون: يُعرَّب الحرفُ ولا يُمَسّ سواه */
  const czStore = html => String(html == null ? '' : html)
    .replace(CZ_ANY, (_, n) => '{{c' + czDig(n) + '::')
    .replace(CZ_OPEN, '{{c1::');   /* فراغٌ بلا وسم: بطاقةٌ قديمة أو وسمٌ مُحي بالخطأ */
  /* المخزونُ ⇐ المعروض: وهي أيضًا التي تقلب الوسمَ إذا قُلبت لغةُ الواجهة */
  const czShow = html => String(html == null ? '' : html)
    .replace(CZ_ANY, (_, n) => czOpenOf(czDig(n)));
  /* ===== أكبرُ رقمٍ في الحقلين =====
     يُقرأ من **المعروض** لأنّه هو الحيّ تحت اليد. والحقلان معًا: «الإضافيّ» متنٌ ثانٍ
     للبطاقة نفسِها، فلو عُدّ وحدَه لَتصادم رقمُه برقم أخيه */
  const czMax = () => {
    let m = 0;
    czFields().forEach(el => String(el.innerHTML || '')
      .replace(CZ_ANY, (s, d) => { m = Math.max(m, +czDig(d) || 0); return s; }));
    return m;
  };
  /* جسمُ «الفراغ»: الحقلان يبقيان حقلين — الأوّلُ نصٌّ والثاني إضافيّ. ولا يُنزع شيء.
     والعرضُ يُعاد ضبطُه هنا: فتحُ بطاقةٍ من المخزن، وقلبُ لغتها — كلاهما يمرّ بالرسم */
  /* ===== مدخلٌ واحدٌ إلى الحقلين =====
     كلُّ بابٍ يملأ البطاقةَ يمرّ من هنا: الفتحُ · نافذةٌ جديدة · نسخةٌ تُطالَع · رجعةٌ إلى
     نسخة · التفريغ. وكان كلٌّ منها يكتب في الحقل رأسًا، فمن لم يُعِد الرسمَ بعده بقي
     ‎{{c1::…}}‎ ظاهرًا في متنٍ عربيّ. والعلّةُ ليست في النسيان بل في تعدّد المداخل،
     فدواؤها مدخلٌ واحدٌ لا حارسٌ يُضاف في كلّ باب */
  function cdFill(f, b) {
    const cz = cardDlg && cardDlg.kind !== 'q' && cardDlg.ctype === 'cloze';
    const fe = $('#cd-front'), be = $('#cd-back');
    /* و«الإخفاء» يُفكُّ هنا كما يُفكّ «الفراغ»: سطورُ الأقنعة تُنزع من متن الحقل وتصير
       أشكالًا في حال النافذة، فلا يُرى في المربّع إلّا الصورة. وهو الطرفُ الأوّل من
       طرفين لا ثالث لهما: ‎cdFill‎ عند الفتح و‎cdCommit‎ عند الحفظ */
    const io = cardDlg && cardDlg.kind !== 'q' && cardDlg.ctype === 'io';
    if (cardDlg) {
      const r = ioParse(f);
      cardDlg.io = r.shapes; cardDlg.ioRaw = r.raw; cardDlg.ioSel = -1;
      if (io && fe) fe.innerHTML = r.html;
    }
    if (fe && !io) fe.innerHTML = cz ? czShow(f || '') : (f || '');
    if (be) be.innerHTML = cz ? czShow(b || '') : (b || '');
    /* وهُويّةُ صورتها تُقيَّد بعد الملء: بها يُعرف لاحقًا أنّ الصورةَ **بُدّلت** */
    if (cardDlg) cardDlg.ioKey = ioKeyOf();
  }
  /* ============================================================
     «الإخفاء» — المرحلة الأولى: الصورةُ تُستدعى، واللسانُ ينفرج عن أدواته
     ============================================================
     حقلٌ واحدٌ لا حقلان: الظهرُ يُخفى ولا يُنزع (أشياءُ كثيرةٌ في الملفّ تسأل عن ‎#cd-back‎).
     وما دامت الصورةُ لم تأتِ فالحقلُ لوحٌ خالٍ فيه زرّان؛ فإذا جاءت ملأت الحقلَ
     وانفرج اللسانُ عن أدوات الأقنعة — بالآليّة نفسِها التي في «المتعدّد» و«الفراغ».
     والصورةُ تُخزَّن كما تُخزَّن كلُّ صور البطاقة: بِتاتُها في ‎IndexedDB‎ ومفتاحُها
     ‎data-mid‎ في الحقل — فلا مخزنَ ثانٍ يُخترع لهذا النوع */
  /* ===== كاتبٌ واحدٌ للجدول الذهبيّ =====
     كان يُكتب في ‎focusin‎ وحدَه، وذاك يكفي ما دامت المربّعاتُ كلُّها تُكتب فيها. ومربّعُ
     الصورة لا يُكتب فيه (‎contenteditable=false‎) فلا يُركَّز فلا يحيا أبدًا — فكان إطارُه
     مشدودًا إليه شدًّا لا يُفكّ.
     فصار للحياة بابان يمرّان من هنا: التركيزُ لمن يُكتب فيه، والضغطةُ لمن لا يُكتب فيه.
     والإطفاءُ واحدٌ لهما جميعًا: نقرةُ الخلفيّة */
  const cdLive = f => {
    const body = f && f.closest && f.closest('.cd-body');
    if (body) body.querySelectorAll('.cd-field').forEach(x => x.classList.toggle('is-live', x === f));
  };
  const ioOn = () => !!cardDlg && cardDlg.kind !== 'q' && cardDlg.ctype === 'io';
  /* ===== وبوّابتان لا واحدة: بوّابةُ العرض وبوّابةُ اليد =====
     ‎ioOn‎ تقول «هذه بطاقةُ إخفاء» فيُبنى لوحُها وتُرسم أقنعتُها — وهي لازمةٌ في المقفلة
     كما في المحرَّرة، وإلّا ذهبت الصورةُ والأقنعةُ من المعاينة.
     و‎ioEdit‎ تقول «ويدُك مطلقةٌ فيها» — فيُعلَّق عليها كلُّ ما **يغيّر**: السحبُ والرسمُ
     واللصقُ والحذفُ وقائمةُ القناع.
     وكانتا واحدةً، فكان القفلُ يرفع القلمَ عن الحقول ولا يمسّ اللوحَ: تُفتح المعاينةُ
     فتُسحب أقنعتُها وتُحفظ — وهي التي لا تُحفظ */
  const ioEdit = () => ioOn() && !cardDlg.ro;
  const ioImgEl = () => { const f = $('#cd-front'); return f && f.querySelector('img'); };
  /* ===== هُويّةُ الصورة: مفتاحُها إن كان لها مخزن، وإلّا طولُ بِتاتها وذَنَبُها =====
     ولا يُؤخذ صدرُ ‎data:‎ وحدَه: صورتان بمقاسٍ واحدٍ تتّفقان في عشرات الحروف الأولى
     (ترويسةُ ‎PNG‎ نفسُها)، فيُظنّ أنّهما واحدة */
  const ioKeyOf = () => {
    const img = ioImgEl();
    if (!img) return '';
    /* ===== والمفتاحُ من **الأصل** لا من المعروض =====
       الصبغُ يكتب في ‎src‎ بكسلاتٍ مخبوزةً ويُخبّئ الأصلَ في ‎data-osrc‎. فلو قُرئ المعروضُ
       لَتبدّل المفتاحُ بتبدّل الفلتر أو الجلد — فيُقرأ ذلك «صورةٌ أخرى» فتُمحى الأقنعةُ
       المرسومةُ عليها. والحقيقةُ أنّها هي هي، وإنّما تبدّل عرضُها.
       ولا يقع ذلك ما دام لها ‎data-mid‎ (وهو أوّلُ المقروء)، وإنّما يقع حين يأبى المخزنُ
       فتحمل البطاقةُ بِتاتِها بنفسها — وهو طريقٌ نادرٌ لا يجوز أن يكون فاتكًا */
    const src = img.getAttribute('data-osrc') || img.getAttribute('src') || '';
    return img.getAttribute('data-mid') || (src.length + '|' + src.slice(-64));
  };
  /* تُدرَج أوّلًا ثمّ تُحفظ — دأبُ اللصق في هذا الملفّ: العينُ ترى الصورةَ من فورها */
  function ioPut(file) {
    const host = $('#cd-front');
    if (!host || !file) return;
    const id = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    cdMedUrl[id] = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.dataset.mid = id; img.src = cdMedUrl[id];
    /* اسمُ البطاقة يُقرأ من اسم الملفّ — يُقيَّد مرّةً هنا ويسير مع الصورة حيث ذهبت
       (ROADMAP-CARD-NAMES) */
    img.dataset.fn = file.name || T().cxImgFile;
    flStamp(img);
    host.innerHTML = '';
    host.appendChild(img);
    flPaint(img);   /* بعد أن تسكن الشجرةَ: ‎flSide‎ تسأل موضعَها عن جلده */
    host.dispatchEvent(new Event('input', { bubbles: true }));
    renderCardDlg();
    idbMedia('readwrite', id, file).then(async ok => {
      if (ok) return;
      const data = await cdBlobData(file);
      if (!data) return;
      img.removeAttribute('data-mid');
      /* والأصلُ المخبوءُ يُطرح معه: عنوانُ ‎blob:‎ مات، فلو بقي في ‎data-osrc‎ لَخبز الفلترُ
         من ميّت. فتُردّ الصورةُ إلى بِتاتها ثمّ تُصبغ من جديد */
      img.removeAttribute('data-osrc');
      img.src = data;
      flPaint(img);
      /* ===== وهذا تبدُّلُ **مسكنٍ** لا تبدُّلُ صورة =====
         أبى المخزنُ حفظَها فحملتها البطاقةُ في بِتاتها، فتغيّر مفتاحُها من ‎data-mid‎ إلى
         طول البِتات. ولو تُرك لَقرأه حارسُ الأقنعة تبديلًا للصورة فمحا ما رُسم عليها —
         والصورةُ هي هي. فيُقيَّد المفتاحُ الجديدُ **قبل** أن يُوقَظ الرسم */
      if (cardDlg) cardDlg.ioKey = ioKeyOf();
      host.dispatchEvent(new Event('input', { bubbles: true }));
      if (file.size > 300 * 1024) toast(T().cdImgHeavy);
    });
  }
  /* ومنتقي الملفّ يُصنع لهذه النافذة وحدها: ‎#imgpick‎ في الصفحة مشغولٌ بصور المواد،
     ولو تشاركاه لَاختلط ما يُنتظر منه */
  function ioAskFile() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.addEventListener('change', () => { if (inp.files && inp.files[0]) ioPut(inp.files[0]); });
    inp.click();
  }
  async function ioAskClip() {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find(t => /^image\//.test(t));
        if (type) { ioPut(await it.getType(type)); return; }
      }
    } catch (e) { /* المتصفّحُ منع القراءة — يُقال للمستخدم ما يفعل */ }
    toast(T().ioNoClip);
  }
  /* ============================================================
     الأقنعة: صيغةُ أنكي في المخزن، ونِسَبٌ مئويّةٌ على الشاشة
     ============================================================
     المخزونُ نصُّ أنكي حرفيًّا — سطرٌ لكلّ قناع بعد الصورة في الحقل نفسِه:
       ‎{{c1::image-occlusion:rect:left=.12:top=.30:width=.24:height=.11}}<br>‎
     ولا رقمَ يتبدّل: ‎c1‎ ثابتٌ كما في «الفراغ» — أقنعةُ الصورة كلُّها سؤالٌ واحد.
     · والإحداثيّاتُ **منسوبةٌ لا بالبكسل** (‎toNormal‎ في محرّر أنكي): كسرٌ من عرض الصورة
       وقامتِها. فلو عُرضت الصورةُ في نافذةٍ ضيّقةٍ أو مكبَّرةٍ أو مُقرَّبةٍ بالإصبعين بقي
       القناعُ على ما يُخفيه بالضبط. ولو خُزّنت بكسلاتٍ لَزحفت الأقنعةُ كلّما تبدّل العرض.
     · والبيضويُّ يُخزَّن بنصفَي قطريه (‎rx‎/‎ry‎) و‎left/top‎ ركنُ صندوقه لا مركزُه —
       هكذا يقرؤها أنكي في مراجعته (‎ellipse(left+rx, top+ry, rx, ry)‎)، فتُحفظ عندنا
       صناديقَ ويُقسَم القطرُ عند الكتابة وحدَها.
     · والحشوُ يُكتب إن خالف حشوَ أنكي الأصليّ (‎#ffeba2‎) ويُطوى إن وافقه — دأبُه نفسُه،
       فلا نزيد في ملفّه حرفًا لا يكتبه.
     ===== وقناعان لا قناعٌ واحد =====
     «قناعُ سؤالٍ» يُلَفّ في القوسين فيُرفع عند الجواب، و«قناعٌ ثابت» يُكتب **خارجهما**
     سطرًا عاريًا فيبقى ساترًا بعد الجواب. وهذا الثاني من عندنا لا من أنكي: يقرؤه ملفُّنا
     ولا يعرفه هو (يراه نصًّا في الحقل) — وذاك ثمنُه المعلوم.
     ويُفرَّقان في المحرّر **بالحدّ**: منقّطٌ للسؤال ومصمتٌ للثابت — لا باللون، فاللونُ
     مِلكُ صاحب البطاقة يختاره لما يُخفي، ولا يصحّ أن يُسلَب منه ليقول خبرًا عن الحال */
  const IO_FILL = '#ffeba2';   /* حشوُ أنكي الأصليّ (‎var oi‎ في محرّره) */
  const IO_MIN = 5;            /* حارسُ أنكي: ما دقّ عن خمسة بكسلاتٍ لا يُخفي شيئًا */
  /* (‎ioTool‎ زالت: لا أداةَ في اليد بعدُ — التحديدُ حالٌ دائمة، والشكلُ يُضاف بضغطة) */
  let ioFill = IO_FILL;        /* حشوُ ما يُرسم بعدُ — واليدُ عادةٌ لا صفةُ بطاقة */
  /* (‎ioPalOn‎ ولوحةُ اللسان زالتا مع زوال زرّ اللون من الترويسة — واللوحةُ الآن في قائمة القناع) */
  /* رقمٌ بصيغة ‎Wo()‎ في أنكي: أربعُ خاناتٍ ثمّ تُقصّ الأصفارُ من الطرفين */
  const ioNum = v => (!isFinite(v) || v <= 0) ? '.0000' : v.toFixed(4).replace(/^0+|0+$/g, '');
  const ioPc = v => (Math.max(0, Math.min(1, v)) * 100).toFixed(4) + '%';
  const io01 = v => Math.max(0, Math.min(1, v));
  /* والمصفوفةُ تُصلَح إن غابت: نوافذُ صُنعت قبل هذا الباب لا تحمل الحقل، ولو أُعيد
     ‎[]‎ جديدةً في كلّ نداءٍ لَضاع ما يُدفع فيها */
  const ioSh = () => {
    if (!cardDlg) return [];
    if (!Array.isArray(cardDlg.io)) cardDlg.io = [];
    return cardDlg.io;
  };
  const ioSelSh = () => ioSh()[cardDlg ? cardDlg.ioSel : -1] || null;
  /* والنقطتان تُهرَّبان في القيم كما يفعل أنكي — ولا قيمةَ عندنا فيها نقطتان،
     لكنّ الكاتبَ والقارئَ يتقابلان فلا يُترك أحدُهما بلا مقابل */
  const ioEsc = v => String(v).replace(/:/g, '\\:');
  const ioSplit = s => String(s).replace(/\\:/g, ' ').split(':').map(x => x.replace(/ /g, ':'));
  /* ---- شكلٌ واحدٌ ⇐ سطرُه في المخزن ---- */
  function ioLine(s) {
    const p = ['left=' + ioNum(s.l), 'top=' + ioNum(s.t)];
    if (s.k === 'ell') p.push('rx=' + ioNum(s.w / 2), 'ry=' + ioNum(s.h / 2));
    else p.push('width=' + ioNum(s.w), 'height=' + ioNum(s.h));
    if ((s.c || IO_FILL).toLowerCase() !== IO_FILL) p.push('fill=' + ioEsc(s.c));
    const body = 'image-occlusion:' + (s.k === 'ell' ? 'ellipse' : 'rect') + ':' + p.join(':');
    /* ورقمُ القناع يُكتب كما قُرئ: كلُّ قناعِ سؤالٍ سؤالٌ وحدَه كما في أنكي، وكان ‎c1‎
       ثابتًا يجمعها في واحد. والقديمُ لا يُمَسّ: ما جاء بلا رقمٍ يعود بـ‎1‎ كما كان */
    return (s.q === false ? body : '{{c' + (+s.n || 1) + '::' + body + '}}') + '<br>';
  }
  /* ---- الأشكالُ كلُّها ⇐ ذيلُ الحقل ----
     والمجهولُ يُعاد كما جاء (‎ioRaw‎): مضلَّعٌ أو نصٌّ من أنكي لا نرسمه هنا، فلا نمحوه
     كذلك — ما لا نفهمه لا نُتلفه */
  function ioText() {
    const raw = (cardDlg && cardDlg.ioRaw) || [];
    return ioSh().filter(s => s.w > 0 && s.h > 0 && s.c !== 'transparent').map(ioLine).join('') + raw.join('');
  }
  /* ---- المخزونُ ⇐ أشكالٌ ومتنٌ صافٍ ---- */
  /* و‎cn‎ لا ‎num‎: في جوفها ‎num‎ قارئُ الأعداد سلفًا، واسمان في نطاقٍ واحدٍ يتصادمان */
  function ioShape(body, q, cn) {
    const parts = ioSplit(body);
    const kind = String(parts.shift() || '').trim().toLowerCase();
    if (kind !== 'rect' && kind !== 'ellipse') return null;
    const p = {};
    parts.forEach(x => { const i = x.indexOf('='); if (i > 0) p[x.slice(0, i).trim()] = x.slice(i + 1).trim(); });
    const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
    const ell = kind === 'ellipse';
    const s = {
      k: ell ? 'ell' : 'rect', l: io01(num(p.left)), t: io01(num(p.top)),
      w: ell ? num(p.rx) * 2 : num(p.width), h: ell ? num(p.ry) * 2 : num(p.height),
      c: /^#[0-9a-fA-F]{3,8}$/.test(p.fill || '') ? p.fill : IO_FILL, q: !!q,
      /* ‎n‎ رقمُ سؤاله — و‎c‎ لونُ حشوه: حرفان متجاوران لمعنيين متباعدين، فيُذكر الفرقُ
         ههنا كي لا يُخلط بينهما. والثابتُ لا رقمَ له: ليس سؤالًا حتى يُعدّ */
      n: q ? (+cn || 1) : 0,
    };
    return (s.w > 0 && s.h > 0) ? s : null;
  }
  function ioParse(html) {
    let rest = String(html == null ? '' : html);
    const shapes = [], raw = [];
    /* والملفوفُ مجموعتان (الرقمُ ثمّ الجوف) والعاري واحدةٌ — فيُقرأ كلٌّ بحسابه */
    const grab = (re, q) => {
      rest = rest.replace(re, function (m) {
        const body = q ? arguments[2] : arguments[1];
        const s = ioShape(body, q, q ? arguments[1] : 0);
        if (s) shapes.push(s); else raw.push(m);
        return '';
      });
    };
    /* الملفوفُ أوّلًا ثمّ العاري: لو عُكس لَالتقط العاري جوفَ القوسين وترك ‎{{c1::‎ نصًّا.
       والرسمان من ‎ioRe‎ لا من نسخةٍ هنا — فما يُنزع للقراءة هو نفسُه ما يُفكّ للتحرير */
    grab(ioRe(true), true);
    grab(ioRe(false), false);
    return { html: rest, shapes: shapes, raw: raw };
  }
  /* ============================================================
     لوحُ الرسم: أخو الحقل لا ابنُه
     ============================================================
     طبقةٌ مطلقةٌ ‎inset:0‎ داخل ‎.cd-field‎ — والمربّعُ في هذا النوع يأخذ مقاسَ الصورة
     بالضبط (‎fit-content‎ وحشوٌ صفر ولسانٌ خارجَ الجريان)، فحدودُ الطبقة حدودُ الصورة.
     وهي أختُ ‎#cd-front‎ لا ابنتُه — كاللوح الخالي: فلا تدخل في محفوظ الحقل ولا يمسّها
     ‎cdClean‎، والمحفوظُ يُكتب من الأشكال نفسِها لا من هذا الرسم */
  function ioLay(make) {
    const st = cdStage();
    if (!st) return null;
    const fld = st.querySelector('.cd-body > .cd-field.is-io');
    if (!fld) return null;
    let lay = fld.querySelector(':scope > .cd-iolay');
    if (!fld.classList.contains('has-img')) { if (lay) lay.remove(); return null; }
    if (!lay && make) { lay = document.createElement('div'); lay.className = 'cd-iolay'; fld.appendChild(lay); }
    return lay || null;
  }
  /* ===== مقابضُ التوسيع: لغةُ النوافذ نفسُها =====
     ثمانيةٌ كمقابض النافذة (‎.cd-rz‎) وبالمفردات نفسِها: ‎ex/ey‎ الطرفُ المشدود — ‎-1‎ يسارٌ
     أو أعلى، و‎+1‎ يمينٌ أو أسفل، و‎0‎ محورٌ لا يُمسّ. فمن عرف توسيعَ النافذة عرف توسيعَ القناع.
     ولا تُرسم إلّا للمختار: ثمانيةٌ لكلّ قناعٍ على صورةٍ فيها عشرةُ أقنعةٍ ثمانون نتوءًا
     تحجب ما تحتها وتزاحم الرسم */
  const IO_RZ = [['t', 0, -1], ['b', 0, 1], ['l', -1, 0], ['r', 1, 0],
    ['tl', -1, -1], ['tr', 1, -1], ['bl', -1, 1], ['br', 1, 1]];
  const ioRzHTML = () => IO_RZ.map(h => '<i class="cd-iorz cd-iorz--' + h[0]
    + '" data-ex="' + h[1] + '" data-ey="' + h[2] + '"></i>').join('');
  const ioMarkup = (s, i, sel) => '<b class="cd-iom' + (s.k === 'ell' ? ' is-ell' : '')
    + (s.q === false ? ' is-fix' : '') + (i === sel ? ' is-on' : '') + '" data-i="' + i + '"'
    + ' data-n="' + (s.q === false ? 0 : (+s.n || 1)) + '"'
    + ' style="left:' + ioPc(s.l) + ';top:' + ioPc(s.t) + ';width:' + ioPc(s.w) + ';height:' + ioPc(s.h)
    + ';--iom:' + esc(s.c || IO_FILL) + '">' + (i === sel ? ioRzHTML() : '') + '</b>';
  function ioPaint() {
    const lay = ioLay(true);
    if (!lay || !cardDlg) return;
    /* واللوحُ على حالٍ واحدة: لا أداةَ تُبدَّل، فمؤشّرُه سهمٌ أبدًا لا صليبُ رسم */
    lay.dataset.tool = 'sel';
    lay.innerHTML = ioSh().map((s, i) => ioMarkup(s, i, cardDlg.ioSel)).join('');
  }
  /* ولم يبقَ في اللسان زرٌّ ذو حال: زرّا الشكل فعلان يقعان ولا يبقيان مضيئين، وحكمُ القناع
     انتقل إلى قائمته. فبقيت الدالّةُ اسمًا تُنادى من مواضعَ كثيرة ولا عملَ لها — تُترك
     فارغةً ولا تُنزع نداءاتُها: نزعُها من عشرة مواضعَ خطرٌ لا يشتري شيئًا */
  function ioSync() { /* لا حالَ تُزامَن بعدُ */ }
  /* ============================================================
     اليد: نقرةٌ وسحبةٌ ورفعة
     ============================================================
     ثلاثةُ أفعالٍ لا غير — والأداةُ هي التي تقول أيَّها يقع:
       · مستطيلٌ أو بيضويٌّ: السحبُ **يُنشئ**، والرفعُ يَحكم أبقي أم سقط.
       · تحديدٌ: النقرُ على قناعٍ يختاره ثمّ يحرّكه، وعلى الفراغ يفكّ الاختيار.
     والالتقاطُ على الطبقة نفسِها (‎setPointerCapture‎) فلا يُفلت المؤشّرُ إن خرج
     عن الصورة أثناء السحب — وحدودُ الشكل تُقصّ إلى الصورة لا إلى موضع الإصبع */
  let ioDrag = null;
  document.addEventListener('pointerdown', e => {
    if (!ioEdit() || !e.target || !e.target.closest) return;
    const lay = e.target.closest('.cd-iolay');
    if (!lay) return;
    /* نافذةٌ غير مركَّزة: النقرةُ تركّزها ولا ترسم فيها — وإلّا رسمتَ في بطاقةٍ لا تنظر إليها */
    if (lay.closest('.cd-stage') !== cdStage()) return;
    e.preventDefault();
    /* والضغطةُ تُحيي المربّعَ كما يُحييه التركيزُ في إخوته: هذا بابُه إلى الجدول الذهبيّ */
    cdLive(lay.closest('.cd-field'));
    const r = lay.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = ev => ({ x: io01((ev.clientX - r.left) / r.width), y: io01((ev.clientY - r.top) / r.height) });
    const p0 = px(e);
    /* ===== والمقبضُ يُسأل قبل الأداة =====
       مقابضُ التوسيع أبناءُ القناع المختار، فهي داخلَ ‎.cd-iom‎ وتحت أيّ أداةٍ كانت في اليد.
       ولو سُئلت الأداةُ أوّلًا لَرسمت مستطيلًا جديدًا فوق المقبض بدل أن توسّع صاحبَه —
       ومن رسم قناعًا للتوّ فأراد ضبطَ حدّه لا يبدّل أداتَه لأجل ذلك */
    const rz = e.target.closest('.cd-iorz');
    if (rz) {
      const own = rz.closest('.cd-iom');
      const i = own ? +own.dataset.i : -1;
      const s0 = ioSh()[i];
      if (!s0) return;
      cardDlg.ioSel = i;
      ioDrag = { lay: lay, r: r, mode: 'size', i: i,
        ex: +rz.dataset.ex, ey: +rz.dataset.ey,
        l0: s0.l, t0: s0.t, w0: s0.w, h0: s0.h };
      ioDrag.px = px; ioDrag.pid = e.pointerId;
      try { lay.setPointerCapture(e.pointerId); } catch (err) { /* لا التقاطَ: المستمعُ العامّ يكفي */ }
      return;
    }
    /* ===== لا أداةَ تُختار: اليدُ تحديدٌ دائمًا =====
       كان الرسمُ بالسحب على الصورة، فكان لا بدّ من أداةٍ في اليد تقول أيقعُ رسمٌ أم تحديد.
       وقد صار الشكلُ يُضاف بضغطةٍ من اللسان في وسط الصورة، فلم يبقَ للسحب إلّا معنًى واحد:
       تحريكُ ما رُسم وتوسيعُه. فسقطت الأداةُ من أصلها ومعها زرُّها — واليدُ حالٌ واحدة.
       والسحبُ على الفراغ يفكّ الاختيار كما كان */
    const hit = e.target.closest('.cd-iom');
    const i = hit ? +hit.dataset.i : -1;
    cardDlg.ioSel = i;
    ioPaint(); ioSync();
    if (i < 0) return;                       /* نقرةٌ على الفراغ: فكُّ اختيارٍ لا أكثر */
    const s = ioSh()[i];
    ioDrag = { lay: lay, r: r, mode: 'move', i: i, ox: p0.x - s.l, oy: p0.y - s.t };
    ioDrag.px = px; ioDrag.pid = e.pointerId;
    try { lay.setPointerCapture(e.pointerId); } catch (err) { /* لا التقاطَ: المستمعُ العامّ يكفي */ }
  });
  document.addEventListener('pointermove', e => {
    if (!ioDrag || e.pointerId !== ioDrag.pid) return;
    const s = ioSh()[ioDrag.i];
    const el = ioDrag.lay.querySelector('.cd-iom[data-i="' + ioDrag.i + '"]');
    if (!s || !el) return;
    const p = ioDrag.px(e);
    if (ioDrag.mode === 'draw') {
      s.l = Math.min(p.x, ioDrag.x0); s.t = Math.min(p.y, ioDrag.y0);
      s.w = Math.abs(p.x - ioDrag.x0); s.h = Math.abs(p.y - ioDrag.y0);
    } else if (ioDrag.mode === 'size') {
      /* ===== الطرفُ المقابل ثابتٌ لا يتحرّك =====
         هذا هو التوسيعُ في كلّ نافذةٍ ومحرّر: تشدّ حدًّا فيبقى الذي يقابله في مكانه.
         والحدُّ الأدنى يُفرض هنا **أثناء** السحب لا عند الرفع: لو تُرك حتى الرفع لَاختفى
         القناعُ من تحت يدك ثمّ رجع، أو سقط وقد أردتَ ضبطَه لا محوَه. وهو خمسةُ بكسلاتٍ
         محوّلةٌ إلى نسبةٍ — حارسُ أنكي نفسُه بالمقياس نفسِه */
      const mw = IO_MIN / ioDrag.r.width, mh = IO_MIN / ioDrag.r.height;
      const R = ioDrag.l0 + ioDrag.w0, B = ioDrag.t0 + ioDrag.h0;
      if (ioDrag.ex < 0) { s.l = Math.max(0, Math.min(p.x, R - mw)); s.w = R - s.l; }
      else if (ioDrag.ex > 0) { s.l = ioDrag.l0; s.w = Math.max(mw, Math.min(p.x, 1) - ioDrag.l0); }
      if (ioDrag.ey < 0) { s.t = Math.max(0, Math.min(p.y, B - mh)); s.h = B - s.t; }
      else if (ioDrag.ey > 0) { s.t = ioDrag.t0; s.h = Math.max(mh, Math.min(p.y, 1) - ioDrag.t0); }
    } else {
      s.l = io01(Math.min(p.x - ioDrag.ox, 1 - s.w));
      s.t = io01(Math.min(p.y - ioDrag.oy, 1 - s.h));
    }
    ioDrag.moved = true;   /* وقعت حركةٌ فعلًا — يُسأل عنها عند الرفع */
    /* الأسلوبُ يُكتب على العنصر رأسًا ولا يُعاد بناءُ اللوح: السحبةُ الواحدة عشراتُ
       الرسائل، ولو هُدم اللوحُ وبُني في كلٍّ منها لَتلعثم السحب */
    el.style.left = ioPc(s.l); el.style.top = ioPc(s.t);
    el.style.width = ioPc(s.w); el.style.height = ioPc(s.h);
  });
  function ioUp(e) {
    if (!ioDrag || (e && e.pointerId !== ioDrag.pid)) return;
    const d = ioDrag; ioDrag = null;
    /* نافذةٌ أُغلقت واليدُ ما تزال مضمومة: يُفكّ السحبُ ولا يُكتب في عدم */
    if (!cardDlg) return;
    try { d.lay.releasePointerCapture(d.pid); } catch (err) { /* لم يُلتقط أصلًا */ }
    const s = ioSh()[d.i];
    /* ===== حارسُ أنكي عند الرفع =====
       ما دقّ عن خمسة بكسلاتٍ في أحد بعديه ليس قناعًا بل نقرةٌ عابرة — يُسقط ولا يُحفظ.
       والقياسُ بالبكسل المعروض لا بالنسبة: خمسةٌ في صورةٍ عريضةٍ نسبةٌ غير خمسةٍ في ضيّقة */
    /* والنقرةُ العابرةُ ليست تعديلًا: نقرةٌ بأداة التحديد تختار قناعًا ولا تمسّه، والقناعُ
       الذي سقط لحارس الخمسة لم يُضَف أصلًا. فلا تُقطع نسخةٌ لمن نقر ولم يفعل.
       والرسمُ إضافةٌ بذاته، وأمّا التحريكُ والتوسيعُ فلا يُحسبان إلّا إن تحرّكت اليد */
    let did = d.mode === 'draw' || !!d.moved;
    if (d.mode === 'draw' && s && (s.w * d.r.width < IO_MIN || s.h * d.r.height < IO_MIN)) {
      ioSh().splice(d.i, 1);
      cardDlg.ioSel = -1;
      did = false;
    }
    ioPaint(); ioSync();
    if (did) cdTouch(); else cdSaveSoon();
  }
  document.addEventListener('pointerup', ioUp);
  document.addEventListener('pointercancel', ioUp);
