  /* ============================================================
     الشريطُ من صنعنا — لا من صنع المحرّك
     ============================================================
     (منقولٌ من ‎RE/nook-four‎ · ‎ROADMAP-NOOK-SCROLL.md‎ هناك)
     جُرّب الشريطُ الاصليُّ اربعَ جولاتٍ فلم يُمسَك، واخطرُ ما فيه انّه **ليس عنصرا
     في الشجرة**: لا يراه فاحصٌ ولا يُسأل عنه المتصفّح. فيُبنى عنصرا: مجرًى وابهامٌ،
     قامتُه وموضعُه من الجافا.
     ===== ولا يُرى الّا حين يبقى متن =====
     بصنف ‎is-more‎ يُكتب على الصندوق بعد قياس ‎scrollHeight‎. ومع الاخفاء
     ‎pointer-events: none‎ لئلّا يبتلع نقرا وهو غيرُ مرئيّ */
  const NK_SBQ = '.nkm__scroll, .nk-doc__scroll, .nk-body';
  const NK_SB_MIN = 24, NK_SB_PAD = 3;
  /* موضعُ النظر — حالٌ عابرةٌ لا تُحفظ في التخزين، وتُستأنف بعد اعادة الرسم */
  const NK_SBP = {};
  /* ===== تُجمع القراءاتُ ثمّ تُكتب =====
     قراءةُ ‎scrollHeight‎ تُجبر التخطيط، وكتابةُ الصنف والقامة تُبطله. فلو تناوبا في
     حلقةٍ على اربعة صناديقَ لَاعيد تخطيطُ الصفحة ثماني مرّات — وهي علّةُ «الاجبارُ في
     حلقةٍ يعلّق الموقع» بعينها. فثلاثُ مِشيات: استئنافٌ ثمّ قراءةٌ ثمّ كتابة */
  function nkSbSync(only) {
    const boxes = only ? [only]
      : [].slice.call(document.querySelectorAll('#nook .nk-box[data-m="wide"]'));
    const pairs = [];
    boxes.forEach(b => {
      const j = b.querySelector(NK_SBQ), sb = b.querySelector('.nk-sb');
      if (j && sb) pairs.push([b, sb, j]);
    });
    /* والجوفُ الوليدُ يستأنف موضعَه مرّةً واحدة: الرسمةُ تهدم الجوفَ ولا تهدم النظر */
    pairs.forEach(([b, sb, j]) => {
      if (j.dataset.sbr) return;
      j.dataset.sbr = '1';
      const at = NK_SBP[b.dataset.k];
      if (at) j.scrollTop = at;
    });
    const read = pairs.map(([b, sb, j]) =>
      [b, sb, j.clientHeight, j.scrollHeight, j.scrollTop, sb.clientHeight]);
    read.forEach(([b, sb, ch, sh, st, lane]) => {
      const more = sh > ch + 1;
      b.classList.toggle('is-more', more);
      if (!more) return;
      const th = sb.firstElementChild; if (!th) return;
      const run = Math.max(0, lane - NK_SB_PAD * 2);
      const hh = Math.max(NK_SB_MIN, Math.round(run * ch / sh));
      const y = sh > ch ? Math.round((run - hh) * st / (sh - ch)) : 0;
      th.style.height = hh + 'px';
      th.style.transform = 'translateY(' + (NK_SB_PAD + y) + 'px)';
    });
  }
  /* ===== وجرُّ الابهام: نسبةٌ لا بكسل =====
     ازاحةُ الاصبع في المجرى تُضرب في (متن − جوف) وتُقسم على مدى الابهام — فالجرّةُ
     الواحدةُ تقطع المتنَ كلَّه مهما طال، وهو سلوكُ كلّ شريط. ولا يُقرأ ‎scrollTop‎ في
     اثناء الجرّ: يُحفظ عند بدئه ويُحسب منه، والّا تراكم خطأُ التقريب */
  document.addEventListener('pointerdown', e => {
    const sb = e.target.closest && e.target.closest('.nk-sb'); if (!sb) return;
    const th = e.target.closest('.nk-sb__th');
    const box = sb.closest('.nk-box');
    const j = box && box.querySelector(NK_SBQ); if (!j) return;
    const ch = j.clientHeight, sh = j.scrollHeight, lane = sb.clientHeight;
    const run = Math.max(0, lane - NK_SB_PAD * 2);
    const hh = Math.max(NK_SB_MIN, Math.round(run * ch / sh));
    e.preventDefault();
    /* ونقرةٌ على المجرى خارجَ الابهام تقفز صفحةً نحوَها — والجهةُ تُعرف بمستطيله
       المرسوم لا بحسابٍ من قامته وموضعه: الاوّلُ حقيقةٌ مقروءةٌ والثاني اشتقاقٌ
       قد يفارقها */
    if (!th) {
      const tr = sb.firstElementChild.getBoundingClientRect();
      j.scrollTop += (e.clientY < tr.top ? -ch : ch);
      nkSbSync(box);
      return;
    }
    sb.classList.add('on');
    const y0 = e.clientY, st0 = j.scrollTop, span = run - hh;
    const mv = ev => {
      j.scrollTop = span > 0 ? st0 + (ev.clientY - y0) * (sh - ch) / span : st0;
      nkSbSync(box);
    };
    const up = () => {
      sb.classList.remove('on');
      document.removeEventListener('pointermove', mv);
      document.removeEventListener('pointerup', up);
    };
    document.addEventListener('pointermove', mv);
    document.addEventListener('pointerup', up);
  });
  /* ===== والقياسُ يُعاد عند منتهى الانتقال =====
     قامةُ الصندوق تنتقل في ‎.26s‎ (و‎.46s‎ في المادّة)، والنداءُ يقع بعد قلب الوضع
     مباشرةً — فيقرأ ‎clientHeight‎ الاولى لا الاخيرة، فيخرج الابهامُ بقدٍّ كاذب.
     قِيس: ابهامُ «الدرجة» ‎24‎ (وهو الحدُّ الادنى) وحقُّه ‎132‎.
     وهي علّةُ «القياسُ تحت الحركة» بعينها التي وقعت في ملء المادّة (§١٦) — الّا انّ
     هذه لا تُصلَح بالقامة المقصودة: المقيسُ ‎scrollHeight‎ للجوف، وهو لا يُعرف الّا
     بعد ان يُرسم. فيُعاد النداءُ عند منتهى الانتقال، و‎transitionend‎ يصعد فيكفي
     مستمعٌ واحد */
  document.addEventListener('transitionend', e => {
    if (e.propertyName !== 'height') return;
    const b = e.target && e.target.closest && e.target.closest('.nk-box');
    if (b) nkSbSync(b);
  }, true);
  /* ===== ويتبع الشريطُ العجلةَ واللمس =====
     حدثُ ‎scroll‎ لا يصعد، فيُلتقط في طور القبض — ومستمعٌ واحدٌ على الوثيقة يكفي
     الاربعةَ، ولا يُعلَّق على اجوافٍ تُهدم في كلّ رسمة */
  document.addEventListener('scroll', e => {
    const t = e.target;
    if (!t || !t.closest) return;
    const box = t.closest('.nk-box');
    if (!box) return;
    if (box.dataset.k) NK_SBP[box.dataset.k] = t.scrollTop;
    nkSbSync(box);
  }, true);

  /* مقابضُ المربّع المرن: السحبُ يبدأ من الجوف لا من الجسم كلِّه */
  $('#lib-course').addEventListener('pointerdown', nkiDrag);
  /* والشبكةُ تضيق باتّساع النافذة وضيقها، والعرضُ يبدّل هيئةَ المواضيع — فيُعاد الملءُ
     مرّةً بعد سكون التغيير لا مع كلّ بكسل (إعادةُ التخطيط في حلقةٍ تُعلّق الصفحة) */
  let nkiRT = 0;
  window.addEventListener('resize', () => {
    if (!document.getElementById('nk-info')) return;
    clearTimeout(nkiRT);
    /* والحدودُ تُعاد مع الملء: عرضُ الصفّ تبدّل، فقد يلزم تصغيرُ سطور العناوين أو
       يُرفع عنها التصغيرُ الذي كان */
    nkiRT = setTimeout(() => { nkInfoFill(); nkMinFit(); nkSbSync(); }, 120);
  });

  /* ============================================================
     مساحة انتقاء المساهمة لبند القُمرة — تملأ النافذة كلها وتُقسم عموديًّا نصفين:
       اليمين: مساهمات المادة في ذلك البند (نفس شكل المكتبة)
       اليسار: أعلاه المساهمة المختارة كاملةً، وأسفله معاينة مربّع القُمرة بها
     ============================================================ */
  const nookPicker = document.createElement('div');
  nookPicker.className = 'pick-modal nkwork'; nookPicker.hidden = true;
  nookPicker.innerHTML = `<div class="nkw">
      <div class="nkw__split">
        <section class="nkw__col nkw__col--list">
          <div class="nkw__head" id="pk-head"></div>
          <div class="pk-list" id="pk-list"></div>
        </section>
        <section class="nkw__col nkw__col--side">
          <div class="nkw__pane nkw__pane--sel">
            <div class="nkw__paneb" id="pk-sel"></div>
          </div>
        </section>
      </div>
    </div>`;
  document.body.appendChild(nookPicker);
  let pickSec = null;      // البند الذي يُنتقى له حاليًا
  let pickSort = 'newest'; // فرز قائمة المنتقي (مستقلّ عن فرز المكتبة)
  let pickDraft = null;    // مسوّدة التشكيل: {بند: معرّف المساهمة} — لا تُحفظ إلا بزر «حفظ»
  let pickPub = false;     // مفتاح النشر: عام = التشكيل يصير مساهمتي في بند «المادة»

  /* رأس المنتقي = نفس شريط المساهمات في المكتبة: العدد و«مساهمة» يمينًا وأيقونة الفرز يسارها */
  const pickSortBar = n => `<div class="cm-sortbar">
      <span class="cm-count"><b>${n}</b> ${T().contribUnit}</span>
      <div class="post-menu cm-sort">
        <button type="button" class="post-menubtn cm-sortbtn" id="pk-sortbtn" title="${T().sortBy}" aria-label="${T().sortBy}">${SORT_IC}</button>
        <div class="post-menu__list cm-sort__list">
          <button type="button" class="cm-sortopt pk-sortopt${pickSort === 'best' ? ' on' : ''}" data-psort="best">${T().sortBest}</button>
          <button type="button" class="cm-sortopt pk-sortopt${pickSort === 'newest' ? ' on' : ''}" data-psort="newest">${T().sortNewest}</button>
        </div>
      </div>
    </div>`;

  /* صفّ مساهمة في المنتقي: الهوية فوق (صورة واسم وتاريخ) ثم المحتوى بلا صندوق — نفس شكل المكتبة */
  /* pk--peek: صنف المساهمة المطوية في الموقع — بوجوده تسري عليها قواعد ثيم الشارات نفسها */
  /* صفّ المنتقي يعرض المساهمة كما في المكتبة: تفاعلها (دائرة الاكتمال والإبهامان بأعدادهما)
     معروضٌ للقراءة فقط — الصفّ كلّه هدف نقرة واحدة هي الاختيار، فلا تُزرع فيه أزرار تصويت */
  const pkReact = (sec, p) => `<div class="post-react pk-react">
      ${completeGlyph(completenessOf(sec, p.data || {}))}
      <span class="post-thumb post-thumb--up ${p.liked ? 'on' : ''}" title="${T().thumbUp}">${THUP}<span class="tb-n">${p.likes || 0}</span></span>
      <span class="post-thumb post-thumb--down ${p.disliked ? 'on' : ''}" title="${T().thumbDown}">${THDN}<span class="tb-n">${p.dislikes || 0}</span></span>
    </div>`;
  const pkRowHTML = (p, id, body, long, sec) => `<div class="pkrow pk--peek" data-pkid="${id}" role="button" tabindex="0">
      <div class="post-yt">
        <span class="post-av post-av--yt">${avatarHTML(p)}</span>
        <div class="post-ytmain">
          <div class="post-ytmeta">
            ${pstPostBadge(p)}<b class="post-name">${nameOf(p)}</b>
            <span class="post-date">${agoTxt(p.ts)}</span>${pinBadge(p)}
          </div>
          ${body}
          ${long ? `<button type="button" class="pkrow__tog" title="${T().pkExpand}" aria-label="${T().pkExpand}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>` : ''}
          ${pkReact(sec, p)}
        </div>
      </div>
    </div>`;

  /* النصف الأيسر: مستطيل لكل بند يُسقَط فيه ما يُسحب من اليمين، ثم زرّا حفظ/إلغاء.
     التشكيل يجري على مسوّدة في الذاكرة — لا يُكتب في الحالة إلا بالحفظ */
  /* مستطيل «مواضيع المادة» في التشكيل (خاصّ بالركن): كل موضوع صفٌّ مستقلّ — المستطيل يكبر بعددها
     بلا سهمَي تصفّح، وأزراره بأصناف المكتبة نفسها كي يرث ثيم وضع التحرير */
  function pkTopicsChip(v) {
    const list = v.topics || (v.topics = []);
    const add = `<button type="button" class="pkt-add tp-add" title="${T().addLesson}">+</button>`;
    const rows = list.map((x, i) => `<span class="pkt-row">
        <span class="tp-order">${i + 1}</span>
        <i class="tp-tag">${T().chTag}</i>
        <input class="tp-in tp-in--num pkt-in" data-f="num" data-i="${i}" placeholder="${T().chNumPh}" value="${esc(x.num || '')}">
        <input class="tp-in tp-in--name pkt-in" data-f="name" data-i="${i}" placeholder="${T().chNamePh}" value="${esc(x.name || '')}">
        <button type="button" class="pkt-del tp-del" data-i="${i}" title="✕">✕</button>
      </span>`).join('');
    return `<span class="chipe chipe--topics pkt-chip" data-slot="topics">
        <span class="pkt-top"><i>${T().topicsSec}</i>${add}</span>
        ${rows ? `<span class="pkt-rows">${rows}</span>` : ''}
      </span>`;
  }

  function pkSlotsHTML(entry) {
    const v = pickDraft;
    /* بلا ترويسة: المستطيلات مباشرةً (مفتاح النشر في صفّ الإجراءات أسفلها) */
    /* الحفظ لا يُتاح إلا بتشكيل كامل: البنود كلها مملوءة */
    const filled = filledCount(v);
    const done = filled === INFO_SLOTS.length;
    /* الحقول نفسها التي في محرّر «المادة» بالمكتبة: يكتب فيها المستخدم بنفسه أو يُسقط عليها من المساهمات */
    /* pk--edit: نفس جلد التحرير في المكتبة (سطح رمادي هادئ وحدّ رفيع وتحديد ذهبي تحت القيم) */
    const fields = `<div class="pk-head pkedit pk--edit"><div class="fold-peek fold-peek--edit">
        <span class="chipe chipe--book" data-slot="book">
          <label class="chipe-bookimg" title="${T().bookImgAdd}">${chipBook(v.bookImg)}<input type="file" accept="image/*" class="pkf-img" hidden></label>
          <textarea id="pkf-book" class="chipe-in chipe-in--book" rows="1" placeholder="${T().bookPh}">${esc(v.book || '')}</textarea>
        </span>
        <span class="chipe chipe--lang" data-slot="lang">
          <i>${T().courseLang}</i>
          ${mdropHTML('clang', 'pklang', v.lang || '', [['', '—'], ...Object.entries(T().langs)])}
        </span>
        <span class="chipe chipe--type" data-slot="type">
          <i>${T().courseType}</i>
          ${mdropHTML('ctype', 'pktype', v.type || '', [['', '—'], ...Object.entries(T().ctypes)])}
        </span>
        <span class="chipe chipe--rel" data-slot="rel">
          <i>${T().relLabel}</i>
          <span class="chipe__steps"><button type="button" class="pkf-rel" data-d="5" aria-label="+"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M12 7 18 17 6 17Z"/></svg></button><button type="button" class="pkf-rel" data-d="-5" aria-label="−"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M6 7 18 7 12 17Z"/></svg></button></span>
          <b id="pkf-relv">${v.rel || 0}%</b>
        </span>
        ${pkTopicsChip(v)}
        <textarea id="pkf-desc" class="chipe-in chipe-in--desc" rows="1" data-slot="desc" placeholder="${T().descPh}">${esc(v.desc || '')}</textarea>
      </div></div>`;
    return fields + pkActsHTML(filled, INFO_SLOTS.length, done);
  }

  /* صفّ الإجراءات المشترك بين تشكيلَي «المادة» و«الدكتور» */
  const pkActsHTML = (filled, total, done) => `
      <div class="nkw__acts">
        <span class="nkw__pubs">${pickPub ? T().pubOn : T().pubOff}</span>
        <button type="button" class="sw sw--sm${pickPub ? ' on' : ''}" id="pk-pub" role="switch"
          aria-checked="${pickPub ? 'true' : 'false'}" title="${T().pubTip}"><span class="sw__k"></span></button>
        <button type="button" class="nkw__ic nkw__ic--save" id="pk-save"${done ? '' : ' disabled'}
          title="${done ? T().saveBtn : T().saveNeedAll}" aria-label="${T().saveBtn}">${SAVE_IC}</button>
        <button type="button" class="nkw__ic nkw__ic--cancel" id="pk-cancel" title="${T().cancelBtn}" aria-label="${T().cancelBtn}">✕</button>
        ${completeGlyph({ filled, total })}
      </div>`;

  /* ---------- حقول تشكيل «الدكتور» ----------
     المرحلة الأولى: مستطيل اختيار الدكتور وحده (واللوحة في وسط المنبثقة).
     وبعد اختياره: تنزاح اللوحة يسارًا، وتظهر بقيّة المستطيلات ومساهمات ذلك الدكتور يمينًا */
  function pkDocHTML(entry) {
    const v = pickDraft;
    const code = nookCode(entry);
    const drs = doctorsOf(code);
    const cc = docCompleteness(v);
    const done = !!v.dr && cc.filled === cc.total;
    /* الاسم ومعه التقييم الكلّي — في القائمة وفي المستطيل بعد الاختيار */
    const opts = [['', '—'], ...drs.map(dd => [dd.id, `${esc(dd.name) || T().docName}${drRateTag(dd)}`, drAvatar(dd)])];
    const pickChip = `<span class="chipe chipe--wide chipe--drpick" data-slot="dr">
        <i>${T().docPickLab}</i>${mdropHTML('drpick', 'pkdr', v.dr || '', opts)}
      </span>`;
    /* قبل اختيار الدكتور: المستطيل وحده */
    const rest = !v.dr ? '' : `
        <span class="chipe chipe--mail" data-slot="e">
          <input class="doc-in chipe-in chipe-in--mail pkd-in" data-f="e" type="email" value="${esc(v.e || '')}" placeholder="${T().docEmail}">
        </span>
        <span class="chipe chipe--office" data-slot="office">
          <input class="doc-in office-in pkd-in" data-f="bld" value="${esc(v.bld || '')}" placeholder="${T().bldPh}">
          <span class="office-sep"></span>
          <input class="doc-in office-in pkd-in" data-f="room" value="${esc(v.room || '')}" placeholder="${T().roomPh}">
        </span>
        ${pkHoursChip(v)}
        ${pkRateChip('teach', v)}
        ${pkRateChip('grade', v)}
        <textarea id="pkf-docdesc" class="chipe-in chipe-in--desc" rows="1" data-slot="d" placeholder="${T().docDescPh}">${esc(v.d || '')}</textarea>`;
    const fields = `<div class="pk-head pkedit pk--edit"><div class="fold-peek fold-peek--edit">
        ${pickChip}${rest}
      </div></div>`;
    return fields + pkActsHTML(cc.filled, cc.total, done);
  }
  /* الساعات المكتبية: صفٌّ لكل فترة (يكبر المستطيل بعددها) — يومها ووقتاها وزرّ حذفها */
  function pkHoursChip(v) {
    const list = v.hours || (v.hours = []);
    const dayOpts = T().days.map((nm, i) => [i, nm]);
    const add = `<button type="button" class="pkh-add tp-add" title="${T().addHours}">+</button>`;
    const rows = list.map((h, i) => `<span class="pkh-row" data-hi="${i}">
        ${mdropHTML('day', 'pkday-' + i, h.day || 0, dayOpts)}
        ${pkTimeField(i, 'from', h.from)}
        <span class="dslot-sep">–</span>
        ${pkTimeField(i, 'to', h.to)}
        <button type="button" class="pkh-del tp-del" data-i="${i}" title="✕">✕</button>
      </span>`).join('');
    return `<span class="chipe chipe--wide pkh-chip" data-slot="hours">
        <span class="pkt-top"><i>${T().hoursLab}</i>${add}</span>
        ${rows ? `<span class="pkt-rows">${rows}</span>` : ''}
      </span>`;
  }
  const pkTimeField = (hi, f, val) => {
    const t = normTime(val) || { h: '', m: '', ap: 'am' };
    return `<span class="tfield" data-hi="${hi}" data-f="${f}">
        <span class="thm"><input class="tin tin-h pkh-in" data-p="h" inputmode="numeric" maxlength="2" placeholder="00" value="${t.h}"><span class="tcolon">:</span><input class="tin tin-m pkh-in" data-p="m" inputmode="numeric" maxlength="2" placeholder="00" value="${t.m}"></span>
        ${mdropHTML('ap', 'pkap-' + hi + '-' + f, t.ap, T().ampm)}
      </span>`;
  };
  const pkRateChip = (k, v) => `<span class="chipe chipe--rate" data-slot="${k}">
      <i>${k === 'teach' ? T().teach : T().grade}</i>
      <span class="chipe__steps"><button type="button" class="pkd-rate" data-k="${k}" data-d="1" aria-label="+"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M12 7 18 17 6 17Z"/></svg></button><button type="button" class="pkd-rate" data-k="${k}" data-d="-1" aria-label="−"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M6 7 18 7 12 17Z"/></svg></button></span>
      ${rateVal(+v[k] || 0)}
    </span>`;

  /* حقول تشكيل «الغياب والتأخير»: خمسة عدّادات بنفس مستطيلات محرّر المكتبة */
  function pkAbsHTML() {
    const v = pickDraft;
    const cc = absCompleteness(v);
    const stepBtns = `<button type="button" class="pka-step" data-d="1" aria-label="+"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M12 7 18 17 6 17Z"/></svg></button>` +
      `<button type="button" class="pka-step" data-d="-1" aria-label="−"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><path d="M6 7 18 7 12 17Z"/></svg></button>`;
    /* البنود الأربعة الأولى تصف سياسة الغياب (شريط واحد في العرض) فتتشارك بند السحب «abs» */
    const chip = (f, label, pct) => `<span class="chipe chipe--abs" data-slot="${f === 'late' ? 'late' : 'abs'}">
        <i>${label}</i><span class="chipe__steps" data-ab="${f}">${stepBtns}</span>
        <b>${v[f] || 0}</b>${pct ? '<span class="abs-pct">%</span>' : ''}
      </span>`;
    const fields = `<div class="pk-head pkedit pk--edit"><div class="fold-peek fold-peek--edit">
        ${chip('free', T().absFree)}${chip('dedFrom', T().absDedFrom)}${chip('dedAmt', T().absDedAmt, true)}
        ${chip('dn', T().absDN)}${chip('late', T().absLate)}
      </div></div>`;
    return fields + pkActsHTML(cc.filled, cc.total, cc.filled === cc.total);
  }

  /* حقول تشكيل «الدرجة»: بنود التوزيع (صفٌّ لكل بند) وبارها الحيّ، ومستطيل طريقة التقييم */
  function pkGradeHTML() {
    const v = pickDraft;
    const cc = gradeCompleteness(v);
    const used = (v.items || []).reduce((s, x) => s + (+x.pct || 0), 0);
    const rem = Math.max(0, 100 - used);
    const segs = (v.items || []).map((x, i) =>
      `<span class="gseg" style="width:${x.pct}%;background:${GCOLORS[i % GCOLORS.length]}">${x.pct >= 8 ? x.pct + '%' : ''}</span>`).join('');
    const rows = (v.items || []).map((x, i) => `
      <div class="gitem" data-i="${i}">
        <span class="gdot" style="background:${GCOLORS[i % GCOLORS.length]}"></span>
        <input class="gi-name pkg-name" data-i="${i}" value="${esc(x.name || '')}" placeholder="${T().itemPh}">
        <input class="gi-pct pkg-pct" data-i="${i}" type="range" min="0" max="${(+x.pct || 0) + rem}" value="${+x.pct || 0}">
        <b class="gi-val">${+x.pct || 0}%</b>
        <button type="button" class="gi-del pkg-del" data-i="${i}" title="✕">✕</button>
      </div>`).join('');
    const fields = `<div class="pk-head pkedit pk--edit"><div class="fold-peek fold-peek--edit gedit">
        <div class="gedit__dist" data-slot="items">
          <div class="gdist__head">
            <span class="cm-k">${T().distShort}</span>
            <button type="button" class="cm-adddoc pkg-add" title="${T().addItem}">+</button>
          </div>
          <div class="gbar">${segs}${rem > 0 ? `<span class="gbar__rest" style="width:${rem}%">${T().remaining(rem)}</span>` : ''}</div>
          ${rem === 0 && (v.items || []).length ? `<p class="gfull">${T().complete}</p>` : ''}
          ${rows}
        </div>
        <span class="chipe chipe--gmethod" data-slot="method">
          <i>${T().methodLabel}</i>
          ${mdropHTML('gmethod', 'pkgm', v.method || 'avg', [['avg', 'Average'], ['std', 'Standard']])}
        </span>
      </div></div>`;
    return fields + pkActsHTML(cc.filled, cc.total, cc.filled >= 100);
  }

  /* تحديث النصف الأيسر وحده (بلا إعادة بناء القائمة) */
  function renderPickSide() {
    if (!nookEntry) return;
    $('#pk-sel').innerHTML = pickSec === 'doc' ? pkDocHTML(nookEntry)
      : pickSec === 'abs' ? pkAbsHTML()
      : pickSec === 'grade' ? pkGradeHTML()
      : pkSlotsHTML(nookEntry);
    /* حقول النصّ تنمو بمحتواها كما في محرّر المكتبة (rows=1 لا يكفي للوصف الطويل) */
    nookPicker.querySelectorAll('#pkf-book, #pkf-desc, #pkf-docdesc').forEach(grow);
    /* «الدكتور» قبل اختياره: لا قائمة على اليمين واللوحة في الوسط */
    const split = nookPicker.querySelector('.nkw__split');
    if (split) split.classList.toggle('nkw--solo', pickSec === 'doc' && !pickDraft.dr);
  }

  function openNookPicker(sec) {
    pickSec = sec;
    if (!pickDraft) {
      /* نسخة عمل من القيم المحفوظة (تبقى عبر إعادة الفرز) */
      pickDraft = sec === 'doc' ? docValues(nookEntry)
        : sec === 'abs' ? absValues(nookEntry)
        : sec === 'grade' ? gradeValues(nookEntry)
        : infoValues(nookEntry);
      pickPub = !!(nookPicks(nookEntry) || {})[
        sec === 'doc' ? 'docPub' : sec === 'abs' ? 'absPub' : sec === 'grade' ? 'gradePub' : 'infoPub'];
    }
    nookPicker.hidden = false;   /* قبل الرسم: قياس ارتفاع الحقول يحتاج تخطيطًا حيًّا */
    renderPickList();
    renderPickSide();
  }

  /* قائمة اليمين: مساهمات البند — و«الدكتور» مقصورة على مساهمات الدكتور المختار وحده */
  function renderPickList() {
    const nCode = nookCode(nookEntry);   /* مساهمات النشاط المعروض وحده */
    /* المثبَّتة تتصدّر هنا أيضًا كما في المكتبة، ثم يجري الفرز المختار */
    const byPickSort = (a, b) => (pinRank(b) - pinRank(a)) || (pickSort === 'best'
      ? ((b.likes || 0) - (b.dislikes || 0)) - ((a.likes || 0) - (a.dislikes || 0)) || (b.ts || 0) - (a.ts || 0)
      : (b.ts || 0) - (a.ts || 0));
    if (pickSec === 'doc') {
      const dr = pickDraft.dr ? docOf(nCode, pickDraft.dr) : null;
      const posts = dr ? (dr.posts || []).slice().sort(byPickSort) : [];
      $('#pk-head').innerHTML = pickSortBar(posts.length);
      $('#pk-list').innerHTML = posts.length
        ? posts.map(p => pkRowHTML(
            p, p.id,
            `<div class="pk-head"><div class="fold-peek fold-peek--rich">${postPeek('doc', p.data || {}, p.id, null, false, true, p.id)}</div></div>`,
            ((p.data || {}).d || '').length > 90, 'doc'
          )).join('')
        : `<p class="pk-none">${T().noPosts}</p>`;
      return;
    }
    if (pickSec === 'abs' || pickSec === 'grade') {
      const posts = postsOf(nCode, pickSec).slice().sort(byPickSort);
      $('#pk-head').innerHTML = pickSortBar(posts.length);
      $('#pk-list').innerHTML = posts.length
        ? posts.map(p => pkRowHTML(
            p, p.id,
            `<div class="pk-head"><div class="fold-peek fold-peek--rich">${
              pickSec === 'abs' ? postPeek('abs', p.data || {}, p.id, null, false, true, p.id) : gradePeek(p.data || {}, p.id)
            }</div></div>`,
            false, pickSec
          )).join('')
        : `<p class="pk-none">${T().noPosts}</p>`;
      fitGradeLabels($('#pk-list'));
      return;
    }
    const posts = postsOf(nCode, pickSec).slice().sort(byPickSort);
    $('#pk-head').innerHTML = pickSortBar(posts.length);
    $('#pk-list').innerHTML = posts.length
      ? posts.map(p => {
          const d = p.data || {};
          const body = `<div class="pk-head"><div class="fold-peek">
              ${infoChips(d, p.id)}
              ${d.desc
                ? `<span class="peek-tx" data-drag="field" data-slot="desc" data-src="${p.id}">${esc(d.desc)}</span>`
                : `<span class="peek-tx peek-none">${T().noData}</span>`}
            </div></div>`;
          return pkRowHTML(p, p.id, body, (d.desc || '').length > 90, pickSec);
        }).join('')
      : `<p class="pk-none">${T().noPosts}</p>`;
  }
  /* الإغلاق يطرح المسوّدة ويعيد رسم القُمرة بما هو محفوظ فعلًا */
  const closeNookPicker = () => {
    nookPicker.hidden = true; pickSec = null; pickDraft = null; pickPub = false;
    if (nookEntry) openNook(nookEntry);
  };
  /* الحفظ: المسوّدة تصير الاختيار المعتمد — ومع «عام» يُنشر التشكيل مساهمةً لي في «المادة» */
  const savePicker = () => {
    if (nookEntry && pickDraft) {
      const bag = nookPicks(nookEntry, true);
      if (pickSec === 'doc') {
        bag.docV = Object.assign({}, pickDraft, { hours: (pickDraft.hours || []).map(h => Object.assign({}, h)) });
        publishDocComposition(bag);
      } else if (pickSec === 'abs') {
        bag.absV = Object.assign({}, pickDraft);
        publishAbsComposition(bag);
      } else if (pickSec === 'grade') {
        bag.gradeV = { method: pickDraft.method || 'avg', items: (pickDraft.items || []).map(x => Object.assign({}, x)) };
        publishGradeComposition(bag);
      } else {
        bag.infoV = Object.assign({}, pickDraft);
        delete bag.info;   /* النموذج المرجعي القديم لم يعد مستعملًا */
        publishComposition(bag);
      }
      save();
    }
    closeNookPicker();
  };
  /* النشر: نسخة من التشكيل تُكتب في مساهمتي بالقناة — وإلغاء العموم يسحب ما نُشر منه */
  function publishComposition(bag) {
    const code = nookCode(nookEntry);
    const d = pickDraft || {};
    if (pickPub && filledCount(d)) {
      const mp = myPost(code, 'info');
      mp.data = Object.assign({}, mp.data, {
        book: d.book || '', bookImg: d.bookImg || '',
        type: d.type || '', lang: d.lang || '', rel: d.rel || 0, desc: d.desc || '',
        topics: (d.topics || []).map(x => Object.assign({}, x)),
      });
      mp.ts = Date.now();
      bag.infoPub = 1;
    } else if (bag.infoPub) {
      /* كان منشورًا وصار خاصًّا: تُحذف مساهمتي التي وُلدت من التشكيل */
      const arr = postsOf(code, 'info');
      const mi = arr.findIndex(x => x.me);
      if (mi >= 0) arr.splice(mi, 1);
      bag.infoPub = 0;
    }
  }
  /* نشر تشكيل «الدرجة»: يصير مساهمتي في قناتها */
  function publishGradeComposition(bag) {
    const code = nookCode(nookEntry);
    const v = pickDraft || {};
    if (pickPub && (v.items || []).some(x => x.pct)) {
      const mp = myPost(code, 'grade');
      mp.data = Object.assign({}, mp.data, {
        method: v.method || 'avg',
        items: (v.items || []).map(x => Object.assign({}, x)),
      });
      mp.ts = Date.now();
      bag.gradePub = 1;
    } else if (bag.gradePub) {
      const arr = postsOf(code, 'grade');
      const mi = arr.findIndex(x => x.me);
      if (mi >= 0) arr.splice(mi, 1);
      bag.gradePub = 0;
    }
  }
  /* نشر تشكيل «الغياب والتأخير»: يصير مساهمتي في قناته */
  function publishAbsComposition(bag) {
    const code = nookCode(nookEntry);
    const v = pickDraft || {};
    if (pickPub && absCompleteness(v).filled) {
      const mp = myPost(code, 'abs');
      mp.data = Object.assign({}, mp.data, {
        free: +v.free || 0, dedFrom: +v.dedFrom || 0, dedAmt: +v.dedAmt || 0, dn: +v.dn || 0, late: +v.late || 0,
      });
      mp.ts = Date.now();
      bag.absPub = 1;
    } else if (bag.absPub) {
      const arr = postsOf(code, 'abs');
      const mi = arr.findIndex(x => x.me);
      if (mi >= 0) arr.splice(mi, 1);
      bag.absPub = 0;
    }
  }
  /* نشر تشكيل «الدكتور»: يصير مساهمتي عن ذلك الدكتور بعينه */
  function publishDocComposition(bag) {
    const code = nookCode(nookEntry);
    const v = pickDraft || {};
    const di = doctorsOf(code).findIndex(x => x.id === v.dr);
    if (pickPub && di >= 0 && docCompleteness(v).filled) {
      const mp = myDrPost(code, di);
      mp.data = Object.assign({}, mp.data, {
        e: v.e || '', bld: v.bld || '', room: v.room || '',
        hours: (v.hours || []).map(h => Object.assign({}, h)),
        teach: +v.teach || 0, grade: +v.grade || 0, d: v.d || '',
      });
      mp.ts = Date.now();
      bag.docPub = 1;
    } else if (bag.docPub) {
      doctorsOf(code).forEach(dr => {
        const mi = (dr.posts || []).findIndex(x => x.me);
        if (mi >= 0) dr.posts.splice(mi, 1);
      });
      bag.docPub = 0;
    }
  }

  /* Esc = إلغاء (تملأ المساحة النافذة فلا مكان «خارجها» يُنقر) */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !nookPicker.hidden) closeNookPicker();
  });

  nookPicker.addEventListener('click', e => {
    /* النقر خارج البطاقة = إلغاء (كالمنبثقات الأخرى) */
    if (e.target === nookPicker) { closeNookPicker(); return; }
    if (e.target.closest('#pk-cancel')) { closeNookPicker(); return; }
    if (e.target.closest('#pk-save')) { savePicker(); return; }
    if (e.target.closest('#pk-pub')) { pickPub = !pickPub; renderPickSide(); return; }
    /* قائمة الفرز داخل المنتقي (معالج المكتبة يعيش في ‎.cm-panel‎ فلا يصل هنا) */
    const sb = e.target.closest('#pk-sortbtn');
    if (sb) {
      const m = sb.closest('.post-menu');
      const was = m.classList.contains('open');
      document.querySelectorAll('.post-menu.open').forEach(x => x.classList.remove('open'));
      if (!was) m.classList.add('open');
      return;
    }
    const so = e.target.closest('.pk-sortopt');
    if (so) {
      pickSort = so.dataset.psort === 'best' ? 'best' : 'newest';
      document.querySelectorAll('.post-menu.open').forEach(x => x.classList.remove('open'));
      renderPickList();
      return;
    }
    /* سهم التوسيع يفكّ قصّ الوصف داخل الصفّ ولا يختار المساهمة */
    const tog = e.target.closest('.pkrow__tog');
    if (tog) {
      const r = tog.closest('.pkrow');
      const open = r.classList.toggle('is-open');
      tog.title = open ? T().pkCollapse : T().pkExpand;
      return;
    }
    /* منسدلات التشكيل المخصّصة (اللغة/النوعية) — نفس مكوّن المكتبة بثيمه */
    const mdBtn = e.target.closest('.mdrop-btn');
    if (mdBtn) {
      const list = mdBtn.closest('.mdrop').querySelector('.mdrop-list');
      const was = !list.hidden;
      document.querySelectorAll('.mdrop-list').forEach(l => l.hidden = true);
      list.hidden = was;
      e.stopPropagation();
      return;
    }
    const mdOpt = e.target.closest('.mdrop-opt');
    if (mdOpt && pickDraft) {
      const key = mdOpt.closest('.mdrop').dataset.drop, val = mdOpt.dataset.v;
      if (key === 'pklang') setVals(x => { x.lang = val; });
      else if (key === 'pktype') setVals(x => { x.type = val; });
      else if (key === 'pkgm') setVals(x => { x.method = val; });
      else if (key === 'pkdr') { setVals(x => { x.dr = val; }); renderPickList(); }   /* تغيّر الدكتور ⇐ تتغيّر قائمة اليمين */
      else if (key.indexOf('pkday-') === 0) {
        const i = +key.slice(6);
        setVals(x => { if (x.hours[i]) x.hours[i].day = +val; });
      } else if (key.indexOf('pkap-') === 0) {
        const [, i, f] = key.split('-');
        setVals(x => { const h = x.hours[+i]; if (h) { const t = normTime(h[f]) || { h: '', m: '', ap: 'am' }; t.ap = val; h[f] = t; } });
      }
      return;
    }
    /* مواضيع المادة: إضافة صفٍّ جديد · حذف صفٍّ بعينه */
    if (pickDraft) {
      if (e.target.closest('.pkt-add')) {
        setVals(v => { (v.topics = v.topics || []).push({ num: '', name: '' }); });
        const ins = nookPicker.querySelectorAll('.pkt-row .tp-in--num');
        if (ins.length) ins[ins.length - 1].focus();
        return;
      }
      const tdel = e.target.closest('.pkt-del');
      if (tdel) { setVals(v => { (v.topics || []).splice(+tdel.dataset.i, 1); }); return; }
      /* الساعات المكتبية: إضافة فترة · حذف فترة */
      if (e.target.closest('.pkh-add')) { setVals(v => { (v.hours = v.hours || []).push({ day: 0, from: '', to: '' }); }); return; }
      const hdel = e.target.closest('.pkh-del');
      if (hdel) { setVals(v => { (v.hours || []).splice(+hdel.dataset.i, 1); }); return; }
      /* بنود توزيع الدرجة: إضافة بند · حذف بند */
      if (e.target.closest('.pkg-add')) {
        setVals(v => { (v.items = v.items || []).push({ name: '', pct: 0 }); });
        return;
      }
      const gdel = e.target.closest('.pkg-del');
      if (gdel) { setVals(v => { (v.items || []).splice(+gdel.dataset.i, 1); }); return; }
      /* عدّادات الغياب والتأخير ±١ */
      const ab = e.target.closest('.pka-step');
      if (ab) {
        const f = ab.closest('[data-ab]').dataset.ab;
        setVals(v => { v[f] = Math.max(0, Math.min(60, (+v[f] || 0) + (+ab.dataset.d))); });
        return;
      }
      /* تقييما الشرح والتصحيح ±١ */
      const rt = e.target.closest('.pkd-rate');
      if (rt) {
        const k = rt.dataset.k;
        setVals(v => { v[k] = Math.max(0, Math.min(10, (+v[k] || 0) + (+rt.dataset.d))); });
        return;
      }
    }
    /* خطوتا نسبة الترابط ±٥ */
    const rs = e.target.closest('.pkf-rel');
    if (rs && pickDraft) {
      setVals(v => { v.rel = Math.max(0, Math.min(100, (v.rel || 0) + (+rs.dataset.d || 0))); }, true);
      const b = nookPicker.querySelector('#pkf-relv');
      if (b) b.textContent = `${pickDraft.rel}%`;
      refreshActs();
      return;
    }
  });

  /* الكتابة في حقول التشكيل: تحديث المسوّدة بلا إعادة رسم كي يبقى المؤشّر مكانه */
  /* تكبير حقل النصّ بقدر محتواه — يُتجاهل حين لا يكون للعنصر تخطيط (ارتفاع قياس صفر) */
  const grow = el => {
    el.style.height = 'auto';
    if (el.scrollHeight) el.style.height = el.scrollHeight + 'px';
  };
  nookPicker.addEventListener('input', e => {
    if (!pickDraft) return;
    const t = e.target;
    if (t.id === 'pkf-book') { setVals(v => { v.book = t.value; }, true); grow(t); refreshActs(); }
    else if (t.id === 'pkf-desc') { setVals(v => { v.desc = t.value; }, true); grow(t); refreshActs(); }
    else if (t.classList.contains('pkt-in')) {
      setVals(v => { const x = (v.topics || [])[+t.dataset.i]; if (x) x[t.dataset.f] = t.value; }, true);
      refreshActs();
    }
    /* بنود الدرجة: الاسم بلا إعادة رسم · النسبة تعيد رسم البار والسقوف */
    else if (t.classList.contains('pkg-name')) {
      setVals(v => { const x = (v.items || [])[+t.dataset.i]; if (x) x.name = t.value; }, true);
      refreshActs();
    }
    else if (t.classList.contains('pkg-pct')) {
      setVals(v => { const x = (v.items || [])[+t.dataset.i]; if (x) x.pct = +t.value || 0; });
    }
    /* حقول الدكتور: الإيميل والمبنى والغرفة والانطباع */
    else if (t.id === 'pkf-docdesc') { setVals(v => { v.d = t.value; }, true); grow(t); refreshActs(); }
    else if (t.classList.contains('pkd-in')) { setVals(v => { v[t.dataset.f] = t.value; }, true); refreshActs(); }
    /* خانتا الساعة والدقيقة داخل فترة مكتبية */
    else if (t.classList.contains('pkh-in')) {
      const fld = t.closest('.tfield');
      const i = +fld.dataset.hi, f = fld.dataset.f, part = t.dataset.p;
      setVals(v => {
        const h = v.hours[i]; if (!h) return;
        const cur = normTime(h[f]) || { h: '', m: '', ap: 'am' };
        cur[part] = t.value.replace(/\D/g, '').slice(0, 2);
        h[f] = cur;
      }, true);
      refreshActs();
    }
  });
  /* ============================================================
     غلافُ الكتاب: يُقاس مرّةً بمقاسِ المجموعة
     ============================================================
     كان للغلاف بابان مختلفان: بابُ الركن يُصغّره إلى ٣٢٠، وبابُ المكتبة
     يخزّن **ملفَّ الجهاز كما هو** حتّى ثلاثةِ ميجا. فصورةُ هاتفٍ عاديّةٌ تصير
     في المساهمة أربعةَ ميجا بـ‎base64‎ — وحدُّ المساهمة أربعُ مئةِ كيلو. فيُنشر
     محلّيًّا ثمّ يردّه الخادم، وصاحبُها يظنّها صغيرة. وهي كذلك على القرص.

     والمقاسُ مقيسٌ لا مخترَع: أغلفةُ المجموعة الاثنان والأربعون كلُّها ‎٣٢٠‎
     في ضلعها الأطول، وأثقلُها تسعةٌ وعشرون كيلو. فهذا مقاسُ الغلاف في الموقع،
     وما زاد عليه لا يُرى.

     وبابٌ واحدٌ لهما بعد اليوم: البابان يفترقان أوّلَ تعديل. */
  function coverFit(file, done) {
    if (!file || !/^image\//.test(file.type || '')) return;
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        const MAX = 320, k = Math.min(1, MAX / Math.max(im.width, im.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(im.width * k) || 1; cv.height = Math.round(im.height * k) || 1;
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        done(cv.toDataURL('image/jpeg', .82));
      };
      /* وصورةٌ لا تُفكّ تُترك ولا تُخزَّن: خيرٌ من غلافٍ مكسورٍ في المكتبة */
      im.onerror = () => {};
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  nookPicker.addEventListener('change', e => {
    if (!pickDraft) return;
    const t = e.target;
    /* غلاف الكتاب: صورة من الجهاز تُصغَّر ثم تُخزَّن في المسوّدة */
    if (t.classList.contains('pkf-img')) {
      const f = t.files && t.files[0]; if (!f) return;
      coverFit(f, url => setVals(v => { v.bookImg = url; }));
      t.value = '';
    }
  });

  /* ---------- تعديل مسوّدة قيم «المادة» (بلا حفظ — الحفظ بزرّه) ---------- */
  function setVals(mut, quiet) {
    const v = pickDraft || (pickDraft = infoValues(nookEntry));
    mut(v);
    if (!quiet) renderPickSide();
  }
  /* مساهمة بمعرّفها داخل البند الحالي (قناة المادة · أو مساهمات الدكتور المختار) */
  function pickPostById(pid) {
    const code = nookCode(nookEntry);
    if (pickSec === 'doc') {
      const dr = pickDraft && pickDraft.dr ? docOf(code, pickDraft.dr) : null;
      return dr ? (dr.posts || []).find(x => x.id === pid) : null;
    }
    return postsOf(code, pickSec).find(x => x.id === pid);
  }
  /* نسخ قيمة بندٍ من مساهمة إلى المسوّدة */
  function takeField(k, pid) {
    const p = pickPostById(pid);
    const src = (p && p.data) || {};
    if (pickSec === 'doc') {
      setVals(v => {
        if (k === 'office') { v.bld = src.bld || ''; v.room = src.room || ''; }
        else if (k === 'hours') v.hours = (src.hours || []).map(h => Object.assign({}, h));
        else if (k === 'teach' || k === 'grade') v[k] = +src[k] || 0;
        else v[k] = src[k] || '';
      });
      return;
    }
    if (pickSec === 'abs') {
      /* «abs» = سياسة الغياب الأربعة (شريط واحد في العرض) · «late» = قاعدة التأخير وحدها */
      setVals(v => {
        if (k === 'late') v.late = +src.late || 0;
        else ['free', 'dedFrom', 'dedAmt', 'dn'].forEach(f => { v[f] = +src[f] || 0; });
      });
      return;
    }
    if (pickSec === 'grade') {
      setVals(v => {
        if (k === 'method') v.method = src.method || 'avg';
        else v.items = (src.items || []).map(x => Object.assign({}, x));
      });
      return;
    }
    setVals(v => {
      if (k === 'book') { v.book = src.book || ''; v.bookImg = src.bookImg || ''; }
      else if (k === 'rel') v.rel = src.rel || 0;
      else if (k === 'topics') { v.topics = (src.topics || []).map(x => Object.assign({}, x)); }
      else v[k] = src[k] || '';
    });
  }
  /* تحديث صفّ الإجراءات وحده (دائرة الاكتمال وحالة الحفظ) بلا إعادة بناء الحقول — كي لا ينقطع التركيز */
  function refreshActs() {
    const wrap = nookPicker.querySelector('.nkw__acts'); if (!wrap || !pickDraft) return;
    const cc = pickSec === 'doc' ? docCompleteness(pickDraft)
      : pickSec === 'abs' ? absCompleteness(pickDraft)
      : pickSec === 'grade' ? gradeCompleteness(pickDraft)
      : { filled: filledCount(pickDraft), total: INFO_SLOTS.length };
    const filled = cc.filled, total = cc.total;
    const done = filled >= total && (pickSec !== 'doc' || !!pickDraft.dr);
    const btn = wrap.querySelector('#pk-save');
    if (btn) { btn.disabled = !done; btn.title = done ? T().saveBtn : T().saveNeedAll; }
    const ring = wrap.querySelector('.cc-liquid');
    if (ring) {
      const pct = total ? Math.round(filled / total * 100) : 0;
      ring.innerHTML = pct > 0 ? `<span class="cc-fill" style="height:${pct}%"></span>` : '';
      ring.title = T().completeTip(filled, total);
    }
  }

  /* ---------- السحب والإفلات (فأرة ولمس معًا عبر Pointer Events) ----------
     مصدران: المساهمة كاملةً (‎.pkrow‎) أو بندٌ واحد منها (‎[data-drag="field"]‎).
     الهدف: بندٌ بعينه في «شكل بند المادة» أو لوحة البنود كلّها (للمساهمة الكاملة) */
  let drag = null;
  const dragLabel = el => {
    const c = el.cloneNode(true);
    c.querySelectorAll('.pkrow__tog, .post-react').forEach(x => x.remove());
    return c.outerHTML;
  };
  nookPicker.addEventListener('pointerdown', e => {
    if (e.button != null && e.button !== 0) return;
    const fld = e.target.closest('[data-drag="field"]');
    const row = e.target.closest('.pkrow');
    const src = fld || row;
    if (!src || e.target.closest('.pkrow__tog, #pk-sortbtn, .cm-sortopt')) return;
    drag = {
      kind: fld ? 'field' : 'post',
      slot: fld ? fld.dataset.slot : null,
      pid: fld ? fld.dataset.src : row.dataset.pkid,
      x0: e.clientX, y0: e.clientY, on: false, el: src, id: e.pointerId,
    };
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 8) return;
      drag.on = true;
      drag.ghost = document.createElement('div');
      drag.ghost.className = 'nk-ghost pk--peek';
      drag.ghost.innerHTML = dragLabel(drag.el);
      document.body.appendChild(drag.ghost);
      document.body.classList.add('is-dragging');
      /* إشارة الاستعداد: سحب مساهمة كاملة يُهيّئ كل الحقول · سحب بندٍ يُهيّئ حقله وحده */
      nookPicker.querySelectorAll('#pk-sel [data-slot]').forEach(s =>
        s.classList.toggle('is-ready', drag.kind === 'post' || s.dataset.slot === drag.slot));
    }
    /* الإشارة الوحيدة هي استعداد المستطيلات نفسها — بلا تلوين للوحة كلها */
    drag.ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.on) return;
    d.ghost.remove();
    document.body.classList.remove('is-dragging');
    nookPicker.querySelectorAll('#pk-sel [data-slot]').forEach(x => x.classList.remove('is-ready'));
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    if (!hit || !hit.closest('#pk-sel') || !nookEntry) return;   /* خارج اللوحة = لا شيء */
    if (d.kind === 'field') {
      /* البند يعرف مكانه: تنزل قيمته في حقله أيًّا كان موضع الإفلات داخل اللوحة */
      takeField(d.slot, d.pid);
      return;
    }
    /* مساهمة كاملة: قيمها تملأ كل حقولها أينما أُفلتت — ولا يُمسّ حقلٌ لا بيانات له فيها */
    const p = pickPostById(d.pid);
    const src = (p && p.data) || {};
    if (pickSec === 'abs') {
      setVals(v => { ABS_SLOTS.forEach(f => { if (src[f]) v[f] = +src[f]; }); });
      return;
    }
    if (pickSec === 'grade') {
      setVals(v => {
        if ((src.items || []).length) v.items = src.items.map(x => Object.assign({}, x));
        if (src.method) v.method = src.method;
      });
      return;
    }
    if (pickSec === 'doc') {
      setVals(v => {
        if (src.e) v.e = src.e;
        if (src.bld || src.room) { v.bld = src.bld || ''; v.room = src.room || ''; }
        if ((src.hours || []).length) v.hours = src.hours.map(h => Object.assign({}, h));
        if (src.teach) v.teach = +src.teach;
        if (src.grade) v.grade = +src.grade;
        if (src.d) v.d = src.d;
      });
      return;
    }
    setVals(v => {
      if (src.book || src.bookImg) { v.book = src.book || ''; v.bookImg = src.bookImg || ''; }
      if (src.type) v.type = src.type;
      if (src.lang) v.lang = src.lang;
      if (src.rel) v.rel = src.rel;
      if (liveTopics(src.topics).length) v.topics = src.topics.map(x => Object.assign({}, x));
      if (src.desc) v.desc = src.desc;
    });
  });

  /* يغلق واجهة المادة أيًّا كان مضيفها: النافذة المنبثقة أو المدمج (المكتبة/السوق) */
  const closeCourseModal = () => {
    cleanupEmptyMine();
    courseModal.hidden = true;
    $('#lib-course').hidden = true;
    $('#market-course').hidden = true;
    cmCode = null; cmTabSel = 'info'; cmView = { mode: 'list', pi: 0 };
  };

  /* نقر كتاب في سوق المواد: تُدار داخل بِكرة الكتب نفسها (المتمركز → مساهماته مدمجة، الجانبي → انزلاق) */

  /* نقر مادة داخل إطار الترم بالركن → قُمرة المادة */
  /* (نقر مواد الركن يعالجه nookReel — المتمركز يفتح القُمرة، والجانبي ينزلق للمنتصف) */

  $('#cm-close').addEventListener('click', closeCourseModal);
  courseModal.addEventListener('click', e => { if (e.target === courseModal) closeCourseModal(); });

  /* منبثقة «المادة»: الضغط على مستطيل أصفر يعرض محتوى ذلك المستطيل نفسه كاملًا بثيمه الذهبي
     (لا الوصف) — بلا زر إغلاق؛ النقر خارج المستطيل يغلقها */
  const cmtModal = document.createElement('div');
  cmtModal.className = 'mmodal cmt-modal'; cmtModal.hidden = true;
  cmtModal.innerHTML = `<div class="cmt-body" id="cmt-body"></div>`;
  document.body.appendChild(cmtModal);
  /* أيقونتا زر النسخ (ورقتان · وعلامة صحّ بعد النسخ) */
  const COPY_IC = '<svg class="cc-ic cc-ic--copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const OK_IC = '<svg class="cc-ic cc-ic--ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5l5 5L20 6.5"/></svg>';
  /* نسخ نصّ للحافظة — مع بديل execCommand إن مُنعت واجهة الحافظة */
  function copyText(txt) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).catch(fallback);
    else fallback();
  }
  const openChip = chip => {
    /* «الكتاب» له منبثقة خاصة أكبر: كتاب 3D كبير، وتحته اسمه في مستطيل ويساره زر نسخ الاسم */
    if (chip.classList.contains('peek-book')) {
      const im = chip.querySelector('.pchip-bk img');
      const nm = chip.querySelector('b');
      const name = nm ? nm.textContent.trim() : '';
      const cover = im
        ? `<span class="bk bk--lg"><img src="${im.getAttribute('src')}" alt=""></span>`
        : phBook(cmCode, true);
      $('#cmt-body').innerHTML = `<div class="cmt-book">
          <div class="cmt-book__cover">${cover}</div>
          <!-- زر النسخ أوّل العناصر ⇐ يقع أقصى اليمين، والاسم يساره -->
          <div class="cmt-book__row">
            <button type="button" class="cmt-copy" data-copy="${esc(name)}" data-t="${T().copyName}" title="${T().copyName}" aria-label="${T().copyName}">${COPY_IC}${OK_IC}</button>
            <span class="cmt-book__name">${esc(name) || '—'}</span>
          </div>
        </div>`;
      cmtModal.hidden = false;
      return;
    }
    /* الإيميل: المستطيل مكبَّرًا ويمينه زر نسخ (مثل اسم الكتاب) — العنوان يُنسخ بضغطة بدل كتابته */
    if (chip.classList.contains('peek-mail')) {
      const v = chip.querySelector('.v-val');
      const mail = v ? v.textContent.trim() : '';
      $('#cmt-body').innerHTML = `<div class="cmt-book__row">
          <button type="button" class="cmt-copy" data-copy="${esc(mail)}" data-t="${T().copyEmail}" title="${T().copyEmail}" aria-label="${T().copyEmail}">${COPY_IC}${OK_IC}</button>
          <span class="${chip.className} cmt-chip">${chip.innerHTML}</span>
        </div>`;
      cmtModal.hidden = false;
      return;
    }
    /* المواضيع: الشارة تعرض العدد فقط، فالمنبثقة تُبنى من بيانات المساهمة لا من محتوى الشارة */
    if (chip.classList.contains('peek-topics')) {
      const post = chip.closest('.post');
      const pi = post && post.dataset.pi != null ? +post.dataset.pi : -1;
      const d = (postsOf(cmCode, 'info')[pi] || {}).data || {};
      /* جسم «الشارة المكبَّرة» بترويسة ذهبية صلبة (اتجاها ١+٦ من مختبر التصاميم) */
      const tps = (d.topics || []).filter(x => x && (x.num || x.name));
      $('#cmt-body').innerHTML = `<div class="cmt-topics">
          <div class="cmt-topics__hd">${T().topicsSec}<i>${tps.length}</i></div>
          <div class="cmt-topics__list">${topicRowsHTML(d, true) || `<p class="tp-none">${T().noData}</p>`}</div>
        </div>`;
      cmtModal.hidden = false;
      return;
    }
    /* بقيّة المستطيلات: نفس المستطيل مكبَّرًا بمحتواه الكامل بلا قصّ — يرث أصناف مصدره فيحتفظ بثيمه
       («المادة» .peek-chip الذهبي · «الدكاترة» .v-badge--g وشريط الغياب .chipe--absview) */
    $('#cmt-body').innerHTML = `<span class="${chip.className} cmt-chip">${chip.innerHTML}</span>`;
    cmtModal.hidden = false;
  };
  cmtModal.addEventListener('click', e => {
    const cp = e.target.closest('.cmt-copy');
    if (cp) {
      copyText(cp.dataset.copy || '');
      cp.classList.add('is-copied'); cp.title = T().copied;
      setTimeout(() => { cp.classList.remove('is-copied'); cp.title = cp.dataset.t || T().copyName; }, 1600);
      return;
    }
    if (!e.target.closest('.cmt-chip, .cmt-book, .cmt-topics')) cmtModal.hidden = true;
  });

  /* ---------- بروفايل الحساب: صورة + اسم أسفل الشريط الجانبي · نقره يفتح صفحة الحساب ---------- */
  const profAvatar = () => state.profile.img ? `<img src="${state.profile.img}" alt="">` : FLAT_AVATAR;
  const logoutIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h9"/></svg>';
  function renderProfile() {
    const el = $('#side-profile');
    if (el) el.innerHTML = `<span class="sp-av">${profAvatar()}</span><b class="sp-name">${esc(state.profile.name) || T().acctNamePh}</b>`;
    const lo = $('#side-logout');
    if (lo) { lo.title = T().logout; const tx = lo.querySelector('.side-logout-tx'); if (tx) tx.textContent = T().logout; }
    /* وبابا الزائر يُنطقان ههنا لا في الوسم: نصُّهما في الوسم عربيٌّ ثابت، فلو تُرك
       لَبقيا عربيَّين في الإنجليزيّة — و‎applyLang‎ تمرّ بهذه الدالّة فتصلهما */
    [['#side-join', T().join], ['#side-login', T().login]].forEach(([sel, tx]) => {
      const b = $(sel); if (!b) return;
      b.title = tx;
      const s = b.querySelector('.side-auth-tx'); if (s) s.textContent = tx;
    });
    const sh = $('#side-handle'); if (sh) sh.title = state.sideCollapsed ? T().sideOpen : T().sideClose;
  }
  /* ============================================================
     صفحةُ الباب — تسكن لوحَ الحساب نفسَه
     ============================================================
     ولمَ لا نافذةٌ عائمة؟ لأنّ ما بعد الباب هو صفحةُ الحساب بعينها، فيكون الانتقالُ
     في المكان الذي سيسكنه المستخدم — لا وميضَ نافذةٍ تُفتح وتُغلق. واللوحُ واحدٌ
     يعرض وجهًا من اثنين حسب الجلسة.

     ويُقال للزائر **ما يقدر عليه** لا ما يُمنع منه فقط: من عرف أنّ الاختبارَ مفتوحٌ
     له جرّب قبل أن يقرّر، ومن رأى بابًا وحده انصرف. */
  let authMode = 'join';
  let authRec = '', authRecNew = false;   /* الرمزُ المعروضُ الآن — يُمحى بمغادرة الصفحة */

  function openAuthPage(mode) {
    authMode = mode === 'login' ? 'login' : 'join';
    openAcctPage();
  }

  function renderAuthPage(el) {
    /* ===== وجهٌ ثالثٌ: رمزُك =====
       يُعرض بعد الإنشاء أو الاسترجاع، ولا سبيلَ إلى رؤيته بعدها — فلا يُبنى
       على أنّ المستخدمَ سيرجع إليه. ولا زرَّ «تخطَّ» فيه: الزرُّ الوحيدُ
       «حفظتُه»، فلا تُغادَر الصفحةُ سهوًا */
    if (authMode === 'code') {
      el.innerHTML = `<div class="acct-page auth-page">
        <div class="auth-head">
          <b class="acct-title">${T().recTitle}</b>
          <p class="auth-can">${authRecNew ? T().recNew + ' ' : ''}${T().recWhy}</p>
        </div>
        <div class="rec-code" id="rec-code">${esc(authRec)}</div>
        <div class="acct-btns">
          <button type="button" class="acct-btn" id="rec-copy">${T().recCopy}</button>
          <button type="button" class="acct-btn acct-btn--go" id="rec-done">${T().recSaved}</button>
        </div>
      </div>`;
      return;
    }
    /* ===== ووجهٌ رابع: استرجاعٌ برمز ===== */
    if (authMode === 'recover') {
      el.innerHTML = `<div class="acct-page auth-page">
        <div class="auth-head">
          <b class="acct-title">${T().recFormTitle}</b>
          <p class="auth-can">${T().recFormWhy}</p>
        </div>
        <label class="acct-field"><span>${T().acctEmail}</span>
          <input class="auth-in" data-a="email" type="email" inputmode="email" autocomplete="username" placeholder="${T().acctEmailPh}"></label>
        <label class="acct-field"><span>${T().recCodeLabel}</span>
          <input class="auth-in rec-in" data-a="code" placeholder="${T().recCodePh}" autocomplete="off" autocapitalize="characters" spellcheck="false"></label>
        <label class="acct-field"><span>${T().recNewPass}</span>
          <input class="auth-in" data-a="pass" type="password" autocomplete="new-password" placeholder="${T().acctPasswordPh}"></label>
        <p class="auth-err" id="auth-err" hidden></p>
        <div class="acct-btns">
          <button type="button" class="acct-btn acct-btn--go" id="auth-go">${T().recGo}</button>
        </div>
        <button type="button" class="auth-swap" id="auth-swap">${T().haveAcct}</button>
        <p class="auth-note">${T().recLost}</p>
      </div>`;
      return;
    }
    const join = authMode === 'join';
    const p = state.profile;
    /* ===== ولا يُملأ البابُ بهويّةِ الموقع =====
       المربّعُ يُبذَر من الدرج تسهيلًا على العائد. و‎siteForget‎ تمسحه من الدرج،
       لكنّ الحارسَ ههنا لازمٌ على أيّ حال: الرسمُ لا يُبنى على أنّ مسحًا سبقه.
       ولمّا يُملأ البابُ باسمِ الموقع وبريدِه، يظنّ الزائرُ أنّ هذا حسابُه. */
    const sName = SITE_NAMES.indexOf(p.name) > -1 ? '' : (p.name || '');
    const sMail = p.email === SITE_MAIL ? '' : (p.email || '');
    el.innerHTML = `<div class="acct-page auth-page">
      <div class="auth-head">
        <b class="acct-title">${join ? T().joinTitle : T().loginTitle}</b>
      </div>
      ${join ? `<label class="acct-field"><span>${T().acctName}</span>
        <input class="auth-in" data-a="name" value="${esc(sName)}" autocomplete="name" placeholder="${T().acctNamePh}"></label>` : ''}
      <label class="acct-field"><span>${T().acctEmail}</span>
        <input class="auth-in" data-a="email" type="email" inputmode="email" value="${esc(sMail)}" autocomplete="${join ? 'email' : 'username'}" placeholder="${T().acctEmailPh}"></label>
      <label class="acct-field"><span>${T().acctPassword}</span>
        <input class="auth-in" data-a="pass" type="password" autocomplete="${join ? 'new-password' : 'current-password'}" placeholder="${T().acctPasswordPh}"></label>
      <p class="auth-err" id="auth-err" hidden></p>
      <div class="acct-btns">
        <button type="button" class="acct-btn acct-btn--go" id="auth-go">${join ? T().joinGo : T().loginGo}</button>
      </div>
      <button type="button" class="auth-swap" id="auth-swap">${join ? T().haveAcct : T().noAcct}</button>
      ${join ? '' : `<button type="button" class="auth-swap auth-swap--q" id="auth-forgot">${T().forgot}</button>`}
      ${AUTH_SRV ? '' : `<p class="auth-note">${T().localAcctNote}</p>`}
    </div>`;
  }

  /* صفحة الحساب في منطقة المحتوى — تحل محل السوق/الركن (لا بوب-إن) */
  function renderAcctPage() {
    const el = $('#panel-account'); if (!el) return;
    if (isGuest()) return renderAuthPage(el);   /* الزائرُ يرى البابَ لا الحساب */
    const p = state.profile;
    el.innerHTML = `<div class="acct-page">
      <div class="acct-head">
        <button type="button" class="acct-av" data-pickprofile title="${T().acctPhoto}">${profAvatar()}
          <span class="acct-cam"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.2"/></svg></span></button>
        <b class="acct-title">${T().acctTitle}</b>
      </div>
      <label class="acct-field"><span>${T().acctName}</span>
        <input class="acct-in" data-f="name" value="${esc(p.name)}" placeholder="${T().acctNamePh}"></label>
      <label class="acct-field"><span>${T().acctPhone}</span>
        <input class="acct-in" data-f="phone" type="tel" inputmode="tel" value="${esc(p.phone)}" placeholder="${T().acctPhonePh}"></label>
      <label class="acct-field"><span>${T().acctEmail}</span>
        <input class="acct-in" data-f="email" type="email" inputmode="email" value="${esc(p.email || '')}" placeholder="${T().acctEmailPh}"></label>
      <label class="acct-field"><span>${T().acctPassword}</span>
        <input class="acct-in" data-f="password" type="password" value="${esc(p.password || '')}" placeholder="${T().acctPasswordPh}"></label>
      ${mirrorCardHTML()}
      <div class="acct-btns">
        <button type="button" class="acct-btn acct-btn--logout" id="acct-logout">${logoutIcon}${T().logout}</button>
        <button type="button" class="acct-btn acct-btn--del" id="acct-delete">${T().deleteAcct}</button>
      </div>
    </div>`;
  }
  /* بطاقةُ النسخة على الجهاز — في صفحة الحساب لأنّها من شؤونك لا من شؤون المادة */
  function mirrorCardHTML() {
    const on = !!mirHandle;
    return `<div class="acct-mir${on ? ' on' : ''}">
      <div class="acct-mir__t"><b>${T().mirTitle}</b>
        <span>${on ? T().mirLinked + ' — ' + esc(mirHandle.name) : T().mirWhy}</span></div>
      <div class="acct-mir__b">
        <button type="button" class="acct-btn" id="mir-link">${on ? T().mirChange : T().mirLink}</button>
        ${on ? `<button type="button" class="acct-btn acct-btn--del" id="mir-unlink">${T().mirUnlink}</button>` : ''}
      </div>
    </div>`;
  }
  /* ألواحُ منطقة المحتوى — تُطوى معًا ويُكشف واحدٌ منها */
  const PANELS = ['panel-market', 'panel-library', 'panel-past', 'panel-stats', 'panel-nook-lock'];
  /* تُعاد كتابةُ الصفحة إن كانت مفتوحة — تُستدعى من وصل المرآة وفصلها */
  function renderAcct() {
    const el = document.getElementById('panel-account');
    if (el && !el.hidden) renderAcctPage();
  }
  function openAcctPage() {
    renderAcctPage();
    /* والألواحُ الخمسةُ تُطوى كلُّها: كانت تُطوى المكتبةُ والركنُ وحدَهما، فيبقى
       «الاختبارات» أو «إحصائياتي» تحت صفحة الحساب إن جِيء إليها منهما */
    PANELS.forEach(id => { const p = $('#' + id); if (p) p.hidden = true; });
    $('#panel-account').hidden = false;
    document.querySelectorAll('.tabs button').forEach(x => x.classList.remove('is-active'));
    $('#side-profile').classList.add('on');
  }
  /* العودة لتاب المكتبة (السوق) بعد الخروج / الحذف */
  function goMarket() {
    $('#panel-account').hidden = true;
    $('#side-profile').classList.remove('on');
    const mt = document.querySelector('.tabs [data-tab="market"]');
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('is-active', x === mt));
    PANELS.forEach(id => { const p = $('#' + id); if (p) p.hidden = id !== 'panel-market'; });
  }
  /* حذفُ الحساب: يمحو البروفايلَ ويردُّك زائرًا. وهو غيرُ الخروج — الخروجُ يُبقي
     الحسابَ كي تعود إليه، والحذفُ لا يُبقي. وكانا فعلًا واحدًا قبل أن توجد الجلسة */
  function clearAccount() {
    state.profile = { name: '', phone: '', email: '', password: '', img: '' };
    state.signedIn = false;
    save(); applyAuth(); goMarket();
  }

  /* ============================================================
     البابُ: إنشاءُ حسابٍ · دخولٌ · خروج
     ============================================================
     ولا خادمَ اليومَ، فالحسابُ يسكن ‎state.profile‎ في درج هذا المتصفّح. وهذه
     الدوالُّ الثلاثُ **حدُّ الاستبدال**: يومَ يوجد الخادمُ تُبدَّل أجوافُها وحدَها،
     وتبقى البوابةُ والواجهةُ وما بُني عليهما كما هي. */
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  function applyAuth() {
    document.body.classList.toggle('is-guest', isGuest());
    renderProfile();
    renderAcct();
  }

  /* ============================================================
     الباب — على الخادم إن وُجد، وفي الدرج إن لم يوجد (م١أ)
     ============================================================
     ‎AUTH_SRV‎ يفرّق الحالين: على ‎https‎ ثمّ خادمٌ، وعلى ‎file://‎ لا خادمَ يُسأل.

     ===== ولا يُصنع حسابٌ محلّيٌّ إن كان الخادمُ موجودًا وسقط =====
     كان يُغري أن نسقط إلى الدرج عند كلّ تعثّر. وهو خطأ: من أنشأ حسابًا محلّيًّا
     والخادمُ قائمٌ صار له هويّتان تفترقان، ولا يعرف أيَّهما الحقّ. فإذا انقطعت
     الشبكةُ **يُقال ذلك** ولا يُصنع شيء.

     ===== والخادمُ هو الحقُّ متى نطق =====
     ‎/api/auth/me‎ تُسأل في الإقلاع. فإن قالت «لا أحد» فالمستخدمُ زائرٌ ولو قال
     درجُه غيرَ ذلك — والدرجُ ذاكرةٌ لا حجّة. وإن لم تُجب (لا شبكة) بقي ما في
     الدرج: خارج الشبكة تُصدَّق الذاكرةُ لأنّه لا حَكَمَ سواها.

     ===== وكلمةُ السرّ لا تُحفظ في الدرج بعد اليوم =====
     ‎state.profile.password‎ كان يحملها نصًّا. ومع الخادم لا معنى له — والتجزئةُ
     هناك. فيُمحى عند أوّل دخولٍ ناجح. */
  const AUTH_SRV = /^https?:/.test(location.protocol);
  const authURL = p => (ASSET_BASE ? new URL('api/auth/' + p, ASSET_BASE).href
                                   : location.origin + '/api/auth/' + p);

  async function authCall(p, data) {
    const r = await fetch(authURL(p), {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data || {}),
    });
    let j = {}; try { j = await r.json(); } catch (e) { /* ردٌّ بلا متن */ }
    return { ok: r.ok, status: r.status, j };
  }

  /* ---------- يُلبس البروفايلَ ما ردّه الخادم ----------
     ===== وحسابٌ لا يرث وجهَ من قبله =====
     كانت الصورةُ لا تُبدَّل إلّا إن جاءت من الخادم واحدةٌ — وهو صوابٌ ما دام
     الحسابُ واحدًا: من اختار وجهًا في متصفّحه ولم يبلغ الخادمَ بعد لا يُمحى
     اختيارُه. لكنّه يصير خطأً حين **تتبدّل الهويّةُ نفسُها**: حسابُ «أكاديميا»
     بلا صورة، فلمّا دخلته اللوحةُ بقيت في الدرج صورةُ من كان قبله — فظهر
     الموقعُ بوجه صاحبه. وهو ما وقع.

     فالقاعدة: صورةُ الوافد إن كانت له، وإلّا فبياضٌ **إن كان غيرَ من كان**.
     ومن كان زائرًا (‎uid‎ خاوٍ) ثمّ أنشأ حسابًا يُبقي وجهَه الذي اختاره: تلك
     ليست مبادلةَ حسابٍ بحساب.
     والهاتفُ مثلُها: بيانٌ شخصيٌّ لا يعبر من حسابٍ إلى حساب. */
  function authTake(u) {
    if (!u) return;
    /* و«أكاديميا» في حكم المبادلة أبدًا: الموقعُ لا وجهَ له ولا هاتف، فما وُجد
       منهما في درجه أثرُ من سبقه — ويُمحى في كلّ مرّة، فيُشفى ما وقع قبل اليوم
       بلا ترحيلٍ ولا علَم. */
    const swap = !!(state.uid && u.id && state.uid !== u.id) || u.id === SITE_UID;
    profLast = u.name || '';          /* ما جاء من الخادم لا يُدفع إليه */
    state.profile.name = u.name || (swap ? '' : state.profile.name) || '';
    state.profile.email = u.email || '';
    if (u.img) state.profile.img = u.img;
    else if (swap) state.profile.img = '';
    if (swap) state.profile.phone = '';
    state.profile.password = '';        /* لا سرَّ في الدرج بعد اليوم */
    state.uid = u.id || '';
    state.signedIn = true;
    save(); applyAuth();
    /* ===== ومن دخل ملك ما عليه ختمُه =====
       رزمُ البطائق تنزل مع الموقع بـ‎uid‎ مؤلّفها وبلا ‎me‎ — فتُملَّك عند الدخول
       لا عند الزرع. وكانت هذي تُنادى من اللوحة وحدَها، فيبقى صاحبُ الموقع في
       موقعه لا يملك بطائقَه. */
    srvClaim();
  }

  async function authJoin(name, email, pass) {
    if (!name.trim()) return T().errName;
    if (!EMAIL_RE.test(email.trim())) return T().errEmail;
    if ((pass || '').length < 6) return T().errPass;

    if (AUTH_SRV) {
      let r;
      try { r = await authCall('join', { name: name.trim(), email: email.trim(), password: pass }); }
      catch (e) { return T().errNet; }
      if (r.status === 409) return T().errTaken;
      if (!r.ok) return T().errNet;
      authTake(r.j.user);
      /* والرمزُ يُعرض قبل كلّ شيء: هو الشيءُ الوحيدُ الذي لا يُعاد */
      if (r.j.recovery) { authRec = r.j.recovery; authRecNew = false; authMode = 'code'; }
      return '';
    }
    /* بلا خادم (‎file://‎): حسابٌ في الدرج كما كان */
    state.profile.name = name.trim();
    state.profile.email = email.trim();
    state.profile.password = pass;
    state.signedIn = true;
    save(); applyAuth();
    return '';
  }

  async function authLogin(email, pass) {
    if (AUTH_SRV) {
      let r;
      try { r = await authCall('login', { email: email.trim(), password: pass }); }
      catch (e) { return T().errNet; }
      if (r.status === 401) return T().errBadLogin;
      if (!r.ok) return T().errNet;
      authTake(r.j.user);
      return '';
    }
    if (!hasAcct() || state.profile.email !== email.trim()) return T().errNoAcct;
    if (state.profile.password !== pass) return T().errPassWrong;
    state.signedIn = true;
    save(); applyAuth();
    return '';
  }

  async function authRecover(email, code, pass) {
    if (!AUTH_SRV) return T().errNet;
    if ((pass || '').length < 6) return T().errPass;
    let r;
    try {
      r = await authCall('recover', { email: (email || '').trim(), code: (code || '').trim(), password: pass });
    } catch (e) { return T().errNet; }
    if (r.status === 401) return T().errRecBad;
    if (!r.ok) return T().errNet;
    authTake(r.j.user);
    if (r.j.recovery) { authRec = r.j.recovery; authRecNew = true; authMode = 'code'; }
    return '';
  }

  async function authLogout() {
    /* ويُبطَل على الخادم أوّلًا: علمٌ محلّيٌّ يُطفأ وجلسةٌ باقيةٌ هناك خروجٌ كاذب.
       وإن تعثّر الإبطالُ خرج محلّيًّا على أيّ حال — ولا يُحبس المستخدم في حسابه */
    if (AUTH_SRV) { try { await authCall('logout', {}); } catch (e) { /* يُخرَج على أيّ حال */ } }
    state.signedIn = false;
    state.uid = '';
    save(); applyAuth(); goMarket();
  }

  /* ---------- دفعُ البروفايل إلى الخادم ----------
     ولا يُدفع إلّا ما تغيّر فعلًا: من فتح صفحةَ حسابه ولم يكتب شيئًا لا يُتبعه طلب */
  let profT = 0, profLast = null;
  function profSoon() {
    if (!AUTH_SRV || isGuest()) return;
    clearTimeout(profT);
    profT = setTimeout(async () => {
      const nm = (state.profile.name || '').trim();
      if (!nm || nm === profLast) return;
      try {
        const r = await fetch(authURL('me'), {
          method: 'PATCH', credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: nm }),
        });
        if (r.ok) profLast = nm;
      } catch (e) { /* لا شبكة: يُعاد عند التعديل التالي */ }
    }, 1200);
  }

  /* ---------- صورةُ البروفايل إلى الخادم ----------
     تُرفع إلى المستودع (المعنونِ بالمحتوى) ثمّ يُبعث عنوانُها. ولا تُرسل ‎data:‎:
     نقطةُ البروفايل ترفضها، وصورةٌ خامٌ في جدول المستخدمين تُثقل كلَّ قراءةِ
     مساهمةٍ لأنّ الاسمَ والصورةَ يُقرآن معها. */
  async function profImg(dataUrl) {
    if (!AUTH_SRV || isGuest() || !dataUrl || dataUrl.indexOf('data:') !== 0) return;
    const blob = dataToBlob(dataUrl);
    if (!blob) return;
    try {
      const url = await medUp(blob);
      if (!url) return;
      const r = await fetch(authURL('me'), {
        method: 'PATCH', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ img: url }),
      });
      if (r.status === 413 || r.status === 429) toast(T().srvTooBig);
    } catch (e) { /* لا شبكة: تبقى محلّيّةً حتى يُعاد الاختيار */ }
  }

  /* ---------- جسرٌ للوحة الأدمن ----------
     اللوحةُ تفتح جلسةَ الموقع بنفسها (‎/api/auth/site‎) بعد أن يكون المحرّكُ قد
     أقلع. فلو لم تُعلمه لبقي ‎state.uid‎ خاويًا — وحينئذٍ يفشل شرطُ «مساهمتي لا
     تُحقن نسخةً ثانية» في الجذب، **فتُحقن مساهماتُك بـ‎me:false‎ فلا تُحرَّر**.
     وهي العلّةُ التي شكاها صاحبُ الموقع: ينشر فيعدّل، ثمّ يعود فلا يقدر.
     فتُنادى هذي فتمرّ بـ‎authTake‎ نفسِها، ويُعاد الجذبُ إن كانت مادّةٌ مفتوحة. */
  window.acSessionChanged = function (user) {
    authTake(user);
    srvClaim();                     /* وما نزل قبل أن تُعرف الهويّةُ يُردّ إليها */
    if (cmCode) { srvPulled[cmCode] = 0; srvPull(cmCode, true); }
  };

  /* ---------- ردُّ ما نُسب إلى غيرك وهو لك ----------
     الوافدُ الذي جاء قبل أن تبلغ الهويّةُ المحرّكَ نزل بـ‎me:false‎ — والحارسُ
     الجديدُ يمنع أن يتكرّر ولا يمحو ما وقع. فيُمشى على الحال مرّةً عند كلّ
     تبدُّلِ جلسة: ما كان ‎uid‎ه ‎uid‎ي فهو لي.

     ===== ويُطرح الوافدُ لا يُختم =====
     لو خُتم ‎me:true‎ لصار عندي مساهمتان لبندٍ واحدٍ إن كان أصلي في درجي —
     ونموذجُ الموقع مساهمةٌ واحدةٌ لكلّ بند. فيُطرح الوافدُ إن كان لي أصلٌ،
     ويُختم إن لم يكن (فهو نسختي الوحيدة، جاءت من الخادم). */
  const SITE_NAMES = ['أكاديميا', 'academia'];
  const SITE_UID = 'u-academia';
  const SITE_MAIL = 'site@academia.local';

  /* ---------- وهويّةُ الموقع لا تبقى في بروفايلِ زائر ----------
     ‎authTake‎ تُلبس البروفايلَ ما ردّه الخادم — الاسمَ والبريد. فيومَ اتّخذ
     الموقعُ الأساسيُّ جلسةَ «أكاديميا» (والكوكيُّ للأصل كلِّه) كُتب في درجه
     ‎أكاديميا‎ و‎site@academia.local‎. ثمّ مُنع اللبسُ وبقي المكتوب — فمن جاء
     ينشئ حسابًا وجد المربّعات ممتلئةً بهويّةٍ ليست هويّتَه.

     ولا يُمحى إلّا ما هو للموقع بعينه: البريدُ حجّةٌ قاطعة، والاسمُ يُمحى معه
     إن كان اسمَه — ومن كتب اسمَه بيده قبل أن يقع هذا يبقى اسمُه.
     والصورةُ لا تُمَسّ: حسابُ الموقع بلا صورة، فما في الدرج صورةُ صاحبِه. */
  function siteForget() {
    const p = state.profile;
    if (!p || p.email !== SITE_MAIL) return false;
    p.email = '';
    if (SITE_NAMES.indexOf(p.name) > -1) p.name = '';
    p.password = '';
    profLast = null;
    return true;
  }

  function srvClaim() {
    const me = state.uid;
    if (!me) return;
    /* ===== ومن دخل بحساب الموقع ملك ما يحمل اسمَه =====
       أغلفةُ الكتب وبطائقُ البداية بذورٌ **محلّيّة** كُتبت بـ‎me:false‎ واسمِ
       «أكاديميا» منذ اليومِ الأوّل — لم تبلغ خادمًا قطّ، فلا ‎uid‎ لها ولا ‎srv‎،
       ولم تكن تُحرَّر أبدًا. وذاك كان صوابًا يومَ لم يكن للموقع حساب.
       فلمّا صار له حسابٌ يُدخَل به، صار ما يحمل اسمَه ملكًا لمن دخل به. */
    const isSite = me === SITE_UID;
    let fixed = 0;
    Object.keys(state.cinfo || {}).forEach(code => {
      const ps = (state.cinfo[code] || {}).posts || {};
      Object.keys(ps).forEach(sec => {
        const arr = ps[sec];
        if (!Array.isArray(arr)) return;
        let hasMineNow = arr.some(p => p && p.me);
        for (let i = arr.length - 1; i >= 0; i--) {
          const p = arr[i];
          if (!p || p.me) continue;
          const hasMine = hasMineNow;
          /* وافدٌ من الخادم يحمل ‎uid‎ي */
          const mineSrv = p.srv && p.uid === me;
          /* أو بذرةٌ محلّيّةٌ باسم الموقع، وأنا داخلٌ بحسابه */
          const mineSeed = isSite && !p.srv && p.u && SITE_NAMES.indexOf(p.u.name) > -1;
          /* أو محلّيّةٌ نشرتُها أنا بهذا الحساب وعليها ختمُه — والموقعُ الأساسيُّ
             ينزع عنها ‎me‎ لأنّها ليست له، فتُردّ ههنا إلى صاحبها.
             ولا تُطرح كما يُطرح الوافد: هذي أصلٌ لا نسخةٌ عنه. */
          const mineOwn = !p.srv && p.uid && p.uid === me;
          if (!mineSrv && !mineSeed && !mineOwn) continue;
          /* ===== ولا تصير لي اثنتان في بندٍ واحد =====
             نموذجُ الموقع مساهمةٌ واحدةٌ لكلّ صاحبٍ في كلّ بند، و‎myPost‎ تأخذ
             أوّلَ ما تجد — فلو مُلّكت ثانيةٌ لَحُرِّرت واحدةٌ وأُهملت أختُها بلا
             خبر. فإن كان لي أصلٌ ههنا: يُطرح الوافدُ (نسخةٌ من الخادم لأصلي)،
             وتُترك البذرةُ المحلّيّةُ كما هي (محتوًى آخرُ لا نسخةٌ منّي). */
          if (hasMine) { if (mineSrv) { arr.splice(i, 1); fixed++; } continue; }
          delete p.srv; p.me = true; fixed++;
          hasMineNow = true;
        }
      });
    });
    if (fixed) { save(); if (cmCode && typeof renderCmSection === 'function') renderCmSection(); }
  }

  /* ===== المصالحة في الإقلاع: مَن يقول الخادمُ إنّي؟ ===== */
  function authSync() {
    if (!AUTH_SRV) return;
    fetch(authURL('me'), { credentials: 'same-origin', cache: 'no-store' })
      .then(async r => {
        if (r.status === 401) {                    /* الخادمُ يعرفني: لستُ أحدًا */
          if (state.signedIn) { state.signedIn = false; state.uid = ''; save(); applyAuth(); }
          return;
        }
        if (!r.ok) return;                          /* خللٌ في الخادم: يُترك الدرجُ كما هو */
        const j = await r.json();
        if (!j || !j.user) return;
        /* ===== وحسابُ الموقع لا يُلبَس في الموقع =====
           الكوكيُّ واحدٌ للأصل كلِّه، فمن فتح لوحةَ الأدمن صارت له جلسةُ
           «أكاديميا» — ثمّ يفتح الموقعَ فيجدها، فيصير صاحبَ أغلفة الكتب
           وينشرها ويحرّرها وهو لم يدخل بحساب. وهذا ما وقع.
           فحسابُ الموقع لا يُتَّخذ هويّةً ههنا: بابُه اللوحةُ وحدَها.

           ===== وفي اللوحةِ هو صاحبُ الدار =====
           و‎ADMIN‎ قيدٌ لازم: اللوحةُ تفتح الجلسةَ بنفسها ثمّ تُعلم المحرّكَ
           (‎whoPaint ⇐ acSessionChanged‎)، وهذي تسأل ‎‎/me‎‎ في الإقلاع — طلبان
           متسابقان على نقطةٍ واحدة. فلو تأخّر جوابُ هذي لَمحت ما أثبتته تلك،
           فوجد صاحبُ الموقع نفسَه مخرَجًا من لوحته بعد أن دخلها. */
        if (j.user.id === SITE_UID && !ADMIN) {
          const forgot = siteForget();   /* ولا يبقى أثرُه في بروفايلي */
          if (state.signedIn || forgot) {
            state.signedIn = false; state.uid = ''; save(); applyAuth();
          }
          return;
        }
        authTake(j.user);
      })
      .catch(() => { /* لا شبكة: الذاكرةُ تكفي حتى تعود */ });
  }

  /* ============================================================
     مزامنةُ المساهمات — الدفعُ والجذب (م٢ من ROADMAP-SERVER)
     ============================================================
     العهدُ: **ما نُشر صراحةً وحدَه يبلغ الخادم.** ‎p.st === 'pub'‎ لا غير. وما كان
     «غير مدرج» أو «خاصّ» لا يُرفع ثمّ يُحجب — لا يُرفع أصلًا.

     ===== والوافدُ يلبس ثوبَ البذور =====
     مساهماتُ غيري تُحقن في ‎state.cinfo[code].posts[sec]‎ بالشكل الذي تتوقّعه
     الشاشةُ منذ بُني الموقع (‎{id,me,u,likes,ts,data}‎). فلا يتغيّر سطرٌ واحدٌ في
     الرسم — البذورُ كانت تفعل هذا بعينه، والفرقُ أنّ هؤلاء أناسٌ حقيقيّون.
     وتُوسَم ‎srv:1‎ فتُعرف: تُمحى قبل كلّ جذبٍ وتُستبدل، ولا تُخلط بالمبذور ولا
     بما كتبتَه أنت.

     ===== والختمُ عند الورود =====
     هو العهدُ المكتوب فوق ‎myPost‎: الواردُ يُجرَّد ثمّ يُختم — ‎me‎ يُحسب من
     ‎uid === state.uid‎ ولا يُقرأ ممّا أرسله الخادم، والعدّاداتُ تُصفَّر حتى تُبنى
     في م٣. فمساهمةُ زميلي لا تدّعي أنّها لي ولو حملت ‎me:true‎ في درجه.

     ===== والدفعُ لا يقع مع كلّ حرف =====
     ‎save()‎ تُنادى عشراتِ المرّات في الدقيقة. فيُؤجَّل الدفعُ ويُقاس بتجزئةٍ
     رخيصة: ما لم يتبدّل متنُه لا يُرفع ثانيةً. */
  const SRV_ON = () => /^https?:/.test(location.protocol);
  const postsURL = q => (ASSET_BASE ? new URL('api/posts' + (q || ''), ASSET_BASE).href
                                    : location.origin + '/api/posts' + (q || ''));

  /* تجزئةٌ رخيصة (FNV-1a): تكفي لسؤال «أتبدّل المتن؟» ولا تُستعمل في أمنٍ */
  function srvHash(s) {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h.toString(36) + ':' + s.length;
  }

  /* ============================================================
     تجهيزُ الصور قبل النشر (م٤)
     ============================================================
     صورةُ البطاقة تسكن أحدَ ثلاثة، ولكلٍّ حكمٌ عند النشر:
       ‎data-mid‎          بِتاتُها في ‎IndexedDB‎ عندي وحدي — **لا تسافر**، فيرى
                          القارئُ فراغًا. وهذي كانت علّةً في م٢ لا حدَّ حجم.
       ‎src="data:…"‎      تسافر لكنّها تُضخّم المتنَ حتى يُردّ لتجاوزه الحدّ.
       ‎src="../assets/…"‎ ملفٌّ في الموقع عند الجميع — تُترك كما هي.
     فالأوّلان يُرفعان إلى المستودع ويصيران ‎/api/media/<تجزئة>‎.

     ===== ولا يُمَسّ ما في درجك =====
     التحويلُ يقع على **نسخةٍ** تُرسل، وبطاقتُك عندك تبقى على ‎data-mid‎ — أخفَّ
     وأسرعَ ولا تحتاج شبكةً لتُعرض. فالنشرُ لا يغيّر ما تملك.

     ===== والصورةُ الواحدةُ تُرفع مرّةً =====
     المفتاحُ تجزئةُ البِتات، فرفعُها ثانيةً يردّ المفتاحَ نفسَه بلا كتابة. وتُحفظ
     خارطةُ ‎mid ⇐ مفتاح‎ في الجلسة فلا يُعاد الرفعُ في النشرة الواحدة أصلًا. */
  const medMap = new Map();          /* mid أو data: ⇐ /api/media/… (لهذه الجلسة) */

  /* ===== وتعثّرُ الحجمِ يُميَّز من تعثّرِ الشبكة =====
     كلاهما يردّ ‎null‎، وحكمُهما نقيضان: الشبكةُ تُعاد، والحجمُ لا يُعاد أبدًا
     مهما أُعيد. فلو خُلطا لَبقيت المساهمةُ تُحاول إلى الأبد بلا كلمة. */
  let medBig = false;

  async function medUp(blob) {
    const r = await fetch((ASSET_BASE ? new URL('api/media', ASSET_BASE).href
                                      : location.origin + '/api/media'), {
      method: 'POST', credentials: 'same-origin',
      headers: { 'content-type': blob.type || 'application/octet-stream' }, body: blob,
    });
    if (r.status === 413) { medBig = true; return null; }
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    return j && j.url ? j.url : null;
  }

  const dataToBlob = d => {
    const i = d.indexOf(','); if (i < 0) return null;
    const type = (d.slice(0, i).match(/data:([^;]+)/) || [])[1] || 'image/png';
    const bin = atob(d.slice(i + 1));
    const u = new Uint8Array(bin.length);
    for (let j = 0; j < bin.length; j++) u[j] = bin.charCodeAt(j);
    return new Blob([u], { type: type });
  };

  /* يمشي على متن HTML ويردّه بعد تبديل الصور — أو كما هو إن لم يكن فيه شيء */
  async function medHTML(html) {
    if (typeof html !== 'string' || html.indexOf('<img') < 0) return html;
    const box = document.createElement('div');
    box.innerHTML = html;
    const imgs = [...box.querySelectorAll('img')];
    let hit = false;
    for (const im of imgs) {
      const mid = im.getAttribute('data-mid');
      const src = im.getAttribute('src') || '';
      if (!mid && src.indexOf('data:') !== 0) continue;      /* ملفُّ المشروع: يُترك */
      const key = mid || src;
      let url = medMap.get(key);
      if (!url) {
        let blob = null;
        if (mid) blob = await idbMedia('readonly', mid);      /* بِتاتُها في مخزني */
        else blob = dataToBlob(src);
        if (!blob) continue;                                  /* غابت: تُترك كما هي */
        url = await medUp(blob);
        if (!url) return null;                                /* تعثّر الرفع: يُلغى النشر */
        medMap.set(key, url);
      }
      im.setAttribute('src', url);
      im.removeAttribute('data-mid');
      hit = true;
    }
    return hit ? box.innerHTML : html;
  }

  /* ---------- والصورةُ العاريةُ كالصورةِ في المتن ----------
     ‎medHTML‎ لا ترى إلّا ما كان داخل ‎<img>‎ في نصِّ HTML. وفي المتن حقولٌ تحمل
     الصورةَ **عاريةً**: ‎bookImg‎ غلافُ الكتاب أوّلُها. فكانت تسافر كما هي داخل
     المساهمة — وستّونَ في المئة زيادةٌ من ‎base64‎ فوق حجمها — حتّى تتجاوز حدَّ
     المساهمة (٤٠٠ك) وتُردّ. وهي في المستودع تُخزَّن مرّةً بمفتاحِ محتواها وتُقدَّم
     بذاكرةٍ أبديّة.
     ولا يُحوَّل إلّا ‎;base64,‎: أيقوناتُ ‎svg‎ المرمَّزةُ بالنسبة المئويّة صغيرةٌ
     أصلًا، و‎atob‎ تصيح فيها. */
  const DATA_IMG = /^data:image\/[a-z0-9+.-]+;base64,/i;

  async function medBare(s) {
    if (s.length < 512 || !DATA_IMG.test(s)) return s;
    let url = medMap.get(s);
    if (!url) {
      const blob = dataToBlob(s);
      if (!blob) return s;                       /* غير مقروءة: تُترك كما هي */
      url = await medUp(blob);
      if (!url) return null;                     /* تعثّر الرفع: يُلغى النشر */
      medMap.set(s, url);
    }
    return url;
  }

  /* ويُمشى على المتن كلِّه: كلُّ نصٍّ فيه ‎<img‎ أو كان صورةً عاريةً يُعرض على المحوِّل.
     ونسخةٌ عميقةٌ أوّلًا — فلا يُمَسّ ما في الدرج بحالٍ */
  async function medPrep(data) {
    let clone;
    try { clone = JSON.parse(JSON.stringify(data)); } catch (e) { return data; }
    let failed = false;
    const walk = async v => {
      if (typeof v === 'string') {
        const b = await medBare(v);
        if (b === null) { failed = true; return v; }
        if (b !== v) return b;                   /* كانت عاريةً فصارت عنوانًا */
        const o = await medHTML(v);
        if (o === null) { failed = true; return v; }
        return o;
      }
      if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) v[i] = await walk(v[i]); return v; }
      if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = await walk(v[k]); return v; }
      return v;
    };
    await walk(clone);
    return failed ? null : clone;
  }

  /* ---------- الدفع ---------- */
  async function srvPush(p, code, sec) {
    if (!SRV_ON() || !p || !p.me || isGuest()) return;
    if (p.st !== 'pub') {                      /* سُحبت من النشر — أو لم تُنشر قطّ */
      if (!p.srvH) return;                     /* لم تبلغ الخادمَ أصلًا */
      try {
        await fetch(postsURL('?id=' + encodeURIComponent(p.id)),
                    { method: 'DELETE', credentials: 'same-origin' });
        delete p.srvH; save();
      } catch (e) { /* تُعاد في مزامنةٍ لاحقة */ }
      return;
    }
    /* ===== وما رُدَّ لكِبَرِه لا يُعاد حتى يتبدّل =====
       كان الردُّ ‎413‎ يُصيح ثمّ يرجع بلا أثر — و‎srvPushSoon‎ تُنادى من ‎save()‎،
       و‎save()‎ تُنادى مع كلّ حرف. فصار الإشعارُ لا ينقطع: مساهمةٌ واحدةٌ كبيرةٌ
       تصيح في كلّ ضغطةٍ إلى الأبد. فتُحفظ بصمةُ ما رُدَّ، ولا يُعاد إلّا إن
       تبدّل المتن — والبصمةُ على المتن **الخام** لا المجهَّز، فيُوقَف الرفعُ
       والتجهيزُ كلُّه قبل أن يبدأ. */
    const rawH = srvHash(JSON.stringify({ id: p.id, code: code, sec: sec, data: p.data }));
    if (p.srvBig === rawH) return;
    if (p.srvBig) { delete p.srvBig; }          /* تبدّل المتن: تُعطى فرصةً جديدة */

    /* ===== ولا تُنشر باسمي مساهمةُ غيري =====
       الدرجُ للأصل كلِّه: ما كتبتَه في اللوحة بحساب «أكاديميا» تجده في الموقع
       الأساسيّ، وهو ‎me:true‎ ههنا كذلك. فلولا هذا لَرفعه الموقعُ باسم من دخل
       فيه — تُنسب مساهمةُ الموقع إلى طالبٍ لم يكتبها. ومن نشرها يُكتب عليها. */
    if (p.uid && state.uid && p.uid !== state.uid) return;

    /* والصورُ تُجهَّز أوّلًا: ما لا يسافر يُرفع ويصير عنوانًا */
    medBig = false;
    const prepped = await medPrep(p.data);
    if (prepped === null) {
      /* وصورةٌ أكبرُ من ميجا لا يُصلحها إعادةُ محاولة — تُقال مرّةً وتُقيَّد */
      if (medBig) { p.srvBig = rawH; save(); toast(T().srvTooBig + tooBigWhere(code)); }
      return;                                   /* وإلّا فتعثّرُ شبكةٍ: يُعاد لاحقًا */
    }
    /* ===== وتاريخُها يُثبَّت لا يُولَد في كلّ دفعة =====
       كان ‎ts: p.ts || Date.now()‎ — فمساهمةٌ بلا تاريخ (وهي نادرةٌ لكنّها تقع)
       يختلف متنُها في كلّ مرّة، فلا تطابق بصمتُها بصمةَ ما رُفع، فتُرفع أبدًا مع
       كلّ حفظ. فيُكتب التاريخُ عليها مرّةً ثمّ يثبت. */
    if (!p.ts) p.ts = Date.now();
    const body = JSON.stringify({ id: p.id, code: code, sec: sec, ts: p.ts, data: prepped });
    const h = srvHash(body);
    if (p.srvH === h) return;                  /* لم يتبدّل شيء */
    try {
      const r = await fetch(postsURL(), {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' }, body: body,
      });
      if (r.status === 413) { p.srvBig = rawH; save(); toast(T().srvTooBig + tooBigWhere(code)); return; }
      if (!r.ok) return;
      p.srvH = h;
      if (state.uid) p.uid = state.uid;        /* ومن نشرها يُكتب عليها */
      save();
    } catch (e) { /* لا شبكة: تُعاد لاحقًا */ }
  }

  /* واسمُ المادّة يُلحق بالشكوى: الدرجُ مشتركٌ بين اللوحة والموقع، فمن سمع
     «مساهمةٌ كبيرة» ولا يدري أيَّها لا ينتفع بالخبر */
  const tooBigWhere = code => code ? ' — ' + code : '';

  /* ويُمشى على مساهماتي المنشورة كلِّها — مؤجَّلًا، فلا يُتبع كلَّ حرفٍ طلبٌ */
  let srvT = 0;
  function srvPushSoon() {
    if (!SRV_ON() || isGuest()) return;
    clearTimeout(srvT);
    srvT = setTimeout(() => {
      Object.keys(state.cinfo || {}).forEach(code => {
        const ps = (state.cinfo[code] || {}).posts || {};
        Object.keys(ps).forEach(sec => (ps[sec] || []).forEach(p => {
          if (p && p.me && (p.st === 'pub' || p.srvH)) srvPush(p, code, sec);
        }));
      });
    }, 4000);
  }

  /* يمشي على متن المساهمة فيسم كلَّ عقدةٍ لها معرّف: هذي من الخادم لا منك.
     ===== وتحمل معها معرّفَ مساهمتها =====
     وهذا ما فتح بابَ التعليق (م٣ب). كان الظنُّ أنّ الأمرَ يحتاج تمريرَ المعرّف
     عبر نموذج النوافذ — أعقدِ موضعٍ في المشروع — لأنّ النافذةَ تجد عقدتَها
     بالبحث في الرزمة ولا تعرف من أين جاءت. والحلُّ أبسط: **العقدةُ تحمل أصلَها
     في نفسِها**، فمن أمسك عقدةً عرف مساهمتَها بلا أن يسأل أحدًا. */
  function srvMark(v, pid) {
    if (Array.isArray(v)) { v.forEach(x => srvMark(x, pid)); return; }
    if (!v || typeof v !== 'object') return;
    if (v.id && (v.t === 'c' || v.t === 'f' || v.f !== undefined || v.b !== undefined)) {
      v.srvN = 1;
      if (pid) v.srvP = pid;
    }
    Object.keys(v).forEach(k => { if (k !== 'srvN' && k !== 'srvP') srvMark(v[k], pid); });
  }

  /* ---------- الجذب ---------- */
  const srvPulled = {};        /* آخرُ جذبٍ لكلّ مادّة — لا يُعاد في كلّ فتحة */
  const SRV_FRESH = 60000;

  async function srvPull(code, force) {
    if (!SRV_ON() || !code) return;
    if (!force && Date.now() - (srvPulled[code] || 0) < SRV_FRESH) return;
    srvPulled[code] = Date.now();
    let j;
    try {
      const r = await fetch(postsURL('?code=' + encodeURIComponent(code)), { credentials: 'same-origin' });
      if (!r.ok) return;
      j = await r.json();
    } catch (e) { return; }
    if (!j || !Array.isArray(j.posts)) return;

    const info = state.cinfo[code];
    if (!info || !info.posts) return;
    let n = 0;
    /* ومعرّفاتُ ما أملكه ههنا: تُجمع مرّةً قبل المشي لا تُبحث لكلّ وافد */
    const mineIds = new Set();
    Object.keys(info.posts).forEach(sec =>
      (info.posts[sec] || []).forEach(p => { if (p && p.me && p.id) mineIds.add(p.id); }));

    /* ============================================================
       والخادمُ يعلو على البذرة
       ============================================================
       أغلفةُ الكتب تُزرع في كلّ متصفّحٍ باسم «أكاديميا» (‎seedCoverPosts‎) —
       بذرةٌ تكفي يومَ لا خادم. ثمّ صار للموقع حسابٌ نشرها، فصار الغلافُ الواحدُ
       شيئين: بذرةً في درجي ومساهمةً على الخادم. ولم يظهر ذلك ما دام الموقعُ
       يلبس هويّةَ «أكاديميا» (فيَسقط الوافدُ بشرط ‎r.uid === state.uid‎)؛ فلمّا
       مُنع ذلك — وهو منعٌ صحيح — بان الغلافُ **مرّتين**. وهذا ما وقع.

       فالقاعدة: ما جاء من الخادم أصلٌ، وما عندي منه صورةٌ تنزل له. ويُعرف بحجّتين:

       ١ · **المعرّف** — نسختي تحمل معرّفَ الوافد نفسَه (متصفّحي هو الذي نشرها).
       ٢ · **الشكلُ والاسم** — متصفّحٌ آخرُ زرع بذرتَه بمعرّفٍ من عنده، فلا يجمعهما
           معرّف. فيُنظر إلى ما هما: غلافٌ باسم الموقع في بندٍ جاء فيه غلافُ
           الموقع من الخادم. والقيدُ ضيّقٌ عمدًا (‎bookImg‎ وبندٌ بعينه) لأنّ اسمَ
           الموقع وحدَه يحمله كذلك ما رُدَّ إليه من رزم البطائق — ولا تُمَسّ تلك.

       ولا يُمَسّ ما كتبتُه بيدي (‎me‎): ذاك أصلٌ لا صورة. */
    const srvIds = new Set();
    const siteCoverSec = {};
    /* ===== وحجّةٌ ثالثة: صاحبٌ بعينه في بندٍ بعينه =====
       رزمُ البطائق تنزل في كلّ متصفّحٍ بختم مؤلّفها (‎ankiToOwner‎)، ثمّ صارت
       تُنشر — فيصير للرزمة الواحدة نسختان: بذرةٌ في درجي ومساهمةٌ على الخادم،
       ومعرّفاهما مختلفان (البذرةُ تأخذ معرّفًا من عندها في كلّ متصفّح).
       فيُجمعان بالصاحب: ما جاء من الخادم بختم فلانٍ في بندٍ **يعلو على** كلّ
       نسخةٍ محلّيّةٍ بختمِه في ذلك البند. وهذا يعمّ الرزمَ والأغلفةَ وما يأتي. */
    const srvBy = {};                       /* «uid|sec» ⇐ جاء منه شيءٌ من الخادم */
    j.posts.forEach(r => {
      if (!r || !SECTIONS.includes(r.sec)) return;
      if (r.id) srvIds.add(r.id);
      if (r.uid) srvBy[r.uid + '|' + r.sec] = 1;
      if (r.uid === SITE_UID && r.data && r.data.bookImg) siteCoverSec[r.sec] = 1;
    });
    const isSiteCover = p => p.u && SITE_NAMES.indexOf(p.u.name) > -1
                             && p.data && p.data.bookImg;

    /* أوّلًا: يُرفع الوافدُ القديم — الجذبُ استبدالٌ لا تكديس. ومعه ما نزل له. */
    let cut = 0;
    Object.keys(info.posts).forEach(sec => {
      const arr = info.posts[sec];
      if (!Array.isArray(arr)) return;
      info.posts[sec] = arr.filter(p => {
        if (!p) return true;
        if (p.srv) return false;                              /* وافدٌ من جذبٍ سابق */
        if (p.me) return true;                                /* أصلي: لا يُمَسّ */
        if (p.id && srvIds.has(p.id)) { cut++; return false; }        /* هي هي بعينها */
        if (p.uid && srvBy[p.uid + '|' + sec]) { cut++; return false; }  /* لصاحبها أصلٌ هناك */
        if (siteCoverSec[sec] && isSiteCover(p)) { cut++; return false; } /* بذرةٌ نزلت لأصلها */
        return true;
      });
    });
    j.posts.forEach(r => {
      if (!SECTIONS.includes(r.sec)) return;
      /* ومساهمتي أنا لا تُحقن نسخةً ثانية: عندي أصلُها في درجي.
         ===== ويُعرف بالمعرّف كما يُعرف بالهويّة =====
         شرطُ ‎uid‎ وحدَه يفشل إن لم تكن الهويّةُ قد بلغت المحرّكَ بعد (كما وقع في
         لوحة الأدمن: تفتح الجلسةَ بـ‎fetch‎ فيؤخذ الكوكيُّ ويبقى ‎state.uid‎
         خاويًا) — فتُحقن مساهماتُك نسخةً ثانيةً بـ‎me:false‎ فلا تُحرَّر.
         والمعرّفُ حجّةٌ لا تحتاج جلسة: ما عندي مثلُ معرّفِه فهو هو. */
      if (r.uid && state.uid && r.uid === state.uid) return;
      if (mineIds.has(r.id)) return;
      if (!Array.isArray(info.posts[r.sec])) info.posts[r.sec] = [];
      info.posts[r.sec].push({
        id: r.id, srv: 1, uid: r.uid,
        me: false,                            /* الختمُ: محسوبٌ لا مقروء */
        u: { name: (r.u && r.u.name) || '', img: (r.u && r.u.img) || '' },
        likes: r.likes | 0, liked: !!r.liked,   /* العدُّ من الخادم — يُقرأ ولا يُخترع */
        ts: (r.ts || 0) * 1000 || Date.now(),
        /* ===== والتثبيتُ يُستنتج من الشكل لا يُنقل =====
           ‎pin‎ أخُو ‎data‎ لا ابنُه، والدفعُ لا يرفع إلّا ‎data‎ — فلا يعود من
           الخادم أبدًا. ولو تُرك لَسقط غلافُ الكتاب من صدر بنده يومَ حلّ الوافدُ
           محلَّ البذرة. وهو مثبَّتٌ **لأنّه غلافُ الموقع**، فيُقرأ من ذلك. */
        pin: (r.uid === SITE_UID && r.data && r.data.bookImg) ? 1 : 0,
        data: r.data,
      });
      /* ===== وتُوسَم عقدُ الوافد واحدةً واحدة =====
         التعليقُ يسكن العقدةَ (‎n.cm‎)، والنافذةُ المفتوحةُ تجد عقدتَها بالبحث في
         الرزمة ولا تحمل معرّفَ مساهمتها. فلو لم تُوسَم العقدةُ نفسُها لَما عرف
         مرسِلُ التعليق أنّه يكتب في مساهمةِ غيره — فيكتب في نسخته، ويُمحى كلامُه
         في أوّل جذبٍ بلا أن يعلم. والوسمُ يجعلها تُعرف بنفسها. */
      srvMark(r.data, r.id);
      /* وتعليقاتُها تُجلب في أثرها: رحلةٌ لكلّ مساهمةٍ لا لكلّ بطاقة */
      srvCmtPull(r.id, r.data, true);
      n++;
    });
    save();
    /* وتُعاد الشاشةُ إن كانت هذه المادّةُ مفتوحةً الآن — وإلّا فقد جُذبت لغيرها.
       والطرحُ حدثٌ كالحقن: لو نُظر إلى ‎n‎ وحدَها لَبقيت النسخةُ المطروحةُ على
       الشاشة حتى تُفتح المادّةُ ثانيةً. */
    if ((n || cut) && cmCode === code && typeof renderCmSection === 'function') renderCmSection();
  }

  /* ============================================================
     تعليقاتُ الخادم — تُجلب وتُدمج في العقد (م٣ب)
     ============================================================
     التعليقُ لا يسكن متنَ المساهمة (القارئُ لا يكتب في متن غيره)، بل جدولَه.
     فيُجلب لكلّ مساهمةٍ مرّةً ويُوزَّع على عقدها في ‎n.cm‎ — بالشكل الذي تتوقّعه
     الشاشةُ منذ بُني الموقع، فلا يتغيّر سطرٌ في الرسم.
     ويُوسَم ‎srv:1‎ فيُمحى قبل كلّ دمجٍ ويُستبدل: استبدالٌ لا تكديس، كالمساهمات.
     والردُّ يسكن ‎rp‎ في أصله كما يفعل الموقع، فالخيطُ يُبنى ههنا لا هناك. */
  const cmtPulled = {};
  const CMT_FRESH = 20000;

  const cmtURL = q => (ASSET_BASE ? new URL('api/comments' + (q || ''), ASSET_BASE).href
                                  : location.origin + '/api/comments' + (q || ''));

  /* يجد عقدةً بمعرّفها في متنٍ مهما عمق — والمتونُ أشكالٌ شتّى، فلا يُفترض شكل */
  function cmtFind(v, id, out) {
    if (Array.isArray(v)) { v.forEach(x => cmtFind(x, id, out)); return out; }
    if (!v || typeof v !== 'object') return out;
    if (v.id === id) out.push(v);
    Object.keys(v).forEach(k => cmtFind(v[k], id, out));
    return out;
  }

  async function srvCmtPull(pid, data, force) {
    if (!SRV_ON() || !pid || !data) return;
    if (!force && Date.now() - (cmtPulled[pid] || 0) < CMT_FRESH) return;
    cmtPulled[pid] = Date.now();
    let j;
    try {
      const r = await fetch(cmtURL('?pid=' + encodeURIComponent(pid)), { credentials: 'same-origin' });
      if (!r.ok) return;
      j = await r.json();
    } catch (e) { return; }
    if (!j || !Array.isArray(j.comments)) return;

    /* يُرفع الوافدُ القديم من كلّ عقدة، ثمّ يُبنى من جديد */
    const wipe = v => {
      if (Array.isArray(v)) { v.forEach(wipe); return; }
      if (!v || typeof v !== 'object') return;
      if (Array.isArray(v.cm)) v.cm = v.cm.filter(c => !c || !c.srv);
      Object.keys(v).forEach(k => wipe(v[k]));
    };
    wipe(data);

    const mine = state.uid || '';
    const byId = {};
    const roots = [];
    j.comments.forEach(r => {
      const c = {
        id: r.id, srv: 1, uid: r.uid,
        me: !!(mine && r.uid === mine),      /* الختمُ: محسوبٌ لا مقروء */
        k: r.face || 1,
        u: { name: r.name || '', img: r.img || '' },
        ts: (r.ts || 0) * 1000, x: r.txt || '',
        lk: r.lk | 0, liked: !!r.mine,      /* العدُّ من الخادم — يُقرأ ولا يُخترع */
      };
      byId[r.id] = { c: c, nid: r.nid, parent: r.parent };
      if (!r.parent) roots.push(byId[r.id]);
    });
    /* ثمّ تُعلَّق الردودُ بأصولها — والردُّ الذي ذهب أصلُه يُترك */
    Object.keys(byId).forEach(k => {
      const it = byId[k];
      if (!it.parent) return;
      const up = byId[it.parent];
      if (!up) return;
      (up.c.rp = up.c.rp || []).push(it.c);
    });
    let n = 0;
    roots.forEach(it => {
      const hits = cmtFind(data, it.nid, []);
      if (!hits.length) return;                /* عقدةٌ ذهبت من المتن */
      const node = hits[0];
      (node.cm = node.cm || []).push(it.c);
      n++;
    });
    if (n) save();
    if (n && cardDlg && typeof cdCmtPaint === 'function') { try { cdCmtPaint(true); } catch (e) {} }
  }

  /* والكتابةُ: تذهب إلى الخادم ثمّ تُعرض — ولا تُكتب في المتن أصلًا */
  async function srvCmtSend(node, txt, parentId) {
    if (!node || !node.srvP) return false;
    if (!memberGate(T().needAcctPost)) return true;
    const id = newId();
    let j;
    try {
      const r = await fetch(cmtURL(), {
        method: 'POST', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: id, pid: node.srvP, nid: node.id,
                               face: cdFaceK(), parent: parentId || null, txt: txt }),
      });
      j = await r.json().catch(() => ({}));
      if (!r.ok) { toast(r.status === 401 ? T().needAcctPost : T().errNet); return true; }
    } catch (e) { toast(T().errNet); return true; }

    const c = { id: id, srv: 1, uid: j.uid, me: true, k: cdFaceK(),
                u: { name: j.name || state.profile.name || T().meName, img: j.img || '' },
                ts: (j.ts || 0) * 1000 || Date.now(), x: txt, lk: 0, liked: false };
    if (parentId) {
      const up = (node.cm || []).find(x => x && x.id === parentId);
      if (up) (up.rp = up.rp || []).push(c);
    } else {
      (node.cm = node.cm || []).push(c);
    }
    save();
    return true;
  }

  /* ---------- إعجابُ تعليقٍ وارد ----------
     كإعجاب المساهمات سواءً بسواء: يُقلب في الشاشة فورًا فلا ينتظر المستخدمُ
     الشبكةَ ليرى أثرَ إصبعه، ثمّ يُصحَّح بما يردّه الخادم — وإن سقط رُدَّ ما كان. */
  async function srvCmtLike(c) {
    if (!c || !c.srv || !SRV_ON()) return false;
    if (!memberGate(T().needAcctLike)) return true;
    const was = { liked: !!c.liked, lk: c.lk | 0 };
    c.liked = !was.liked;
    c.lk = Math.max(0, was.lk + (c.liked ? 1 : -1));
    if (cmtBox || cardDlg) cdCmtPaint(true);
    try {
      const r = await fetch(cmtURL('/like'), {
        method: 'POST', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: c.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) { Object.assign(c, was); toast(T().cmtLikeSelf); }
      else if (!r.ok) Object.assign(c, was);
      else { c.lk = j.lk | 0; c.liked = !!j.liked; }
    } catch (e) { Object.assign(c, was); }
    save();
    if (cmtBox || cardDlg) cdCmtPaint(true);
    return true;
  }

  /* ---------- الإعجاب على الخادم (م٣أ) ----------
     ومساهمةُ الخادم (‎srv:1‎) عدُّها هناك لا هنا. فالضغطةُ تُقلب في الشاشة فورًا
     (فلا ينتظر المستخدمُ الشبكةَ ليرى أثرَ إصبعه)، ثمّ يُصحَّح بما يردّه الخادم —
     وإن سقط الطلبُ رُدَّ ما كان. وهذا هو «التفاؤلُ مع الرجوع»: سرعةُ المحلّيّ
     وصدقُ الخادم معًا. */
  async function srvLike(p) {
    if (!p || !p.srv) return false;              /* مبذورةٌ أو لي: الدرجُ يكفيها */
    if (!SRV_ON()) return false;
    if (!memberGate(T().needAcctLike)) return true;   /* حُرست: الضغطةُ لا تمضي */
    const was = { liked: !!p.liked, likes: p.likes | 0 };
    p.liked = !was.liked;
    p.likes = Math.max(0, was.likes + (p.liked ? 1 : -1));
    renderCmSection();
    try {
      const r = await fetch(postsURL().replace('/posts', '/likes'), {
        method: 'POST', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: p.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) { Object.assign(p, was); toast(T().likeSelf); }
      else if (!r.ok) Object.assign(p, was);
      else { p.likes = j.likes | 0; p.liked = !!j.liked; }
    } catch (e) { Object.assign(p, was); }
    save(); renderCmSection();
    return true;
  }

  /* ===== ونداءُ البوابة: يُقال ما فات لا «ممنوع» =====
     ولا تُقذف صفحةُ الباب في وجهه: من ضغط ♥ يريد ♥ لا نموذجًا يبتلع مكانَه.
     فيُقال له ما فاته ويبقى حيث هو، والبابُ في قاع الشريط أمامه متى أراد */
  function authAsk(msg) { toast(msg || T().needAcctPost); }

  $('#side-profile').addEventListener('click', openAcctPage);
  $('#side-logout').addEventListener('click', authLogout);
  $('#side-join').addEventListener('click', () => openAuthPage('join'));
  $('#side-login').addEventListener('click', () => openAuthPage('login'));

  /* ============================================================
     بوابةُ الأعضاء — طبقتان لا واحدة
     ============================================================
     أفعالُ الأعضاء موزّعةٌ على أربعةٍ وستّين معالجَ نقرٍ مفوَّضًا. فزرعُ الحارس في كلٍّ
     منها بابُ نسيانٍ مفتوح: يُضاف زرٌّ غدًا فيمرّ بلا حارس.

     فطبقتان:
       ١ · **النقر** — مستمعٌ واحدٌ في **طور الالتقاط** على ‎document‎: يسبق المعالجاتِ
           كلَّها، فيوقف الفعلَ قبل أن يبدأ ويقول للزائر ما فاته. وهي طبقةُ التجربة:
           لولاها لَبدا الزرُّ يعمل ثمّ لا يقع شيء.
       ٢ · **الكتابة** — حارسٌ في الدوالِّ التي تكتب فعلًا (الإعجاب والمساهمة
           والتعليق). وهي طبقةُ الضمان: ما فات الطبقةَ الأولى لا يفوتها.

     ولا يُحرس ما هو مباحٌ للزائر: التصفّحُ وفتحُ البطاقة والمذاكرةُ والاختبارُ
     وتبديلُ الجلد واللغة. والاختبارُ يُسجَّل له في درجٍ مستقلٍّ (‎academia2:xt:v1‎)
     فلا يمسّه شيءٌ ههنا. */
  /* وكلُّ محدِّدٍ ههنا **مقيسٌ من الشيفرة** لا مخمَّنٌ من اسمه: محدِّدٌ لا وجودَ له
     لا يصيح، ولا يُكتشف إلّا يومَ يمرّ زائرٌ من بابٍ ظنناه محروسًا */
  const MEMBER_ONLY = [
    '[data-like]',      /* إعجابُ مساهمة */
    '[data-clk]',       /* إعجابُ تعليق */
    '.post-like',       /* ♥ في صفّ المساهمة */
    '.post-thumb',      /* إبهامُ الرفع والخفض */
    '.post-pin',        /* تثبيتُ مساهمة */
    '#cd-cmtsend',      /* إرسالُ تعليقٍ في نافذة البطاقة */
    '.cm-face--me',     /* دائرةُ «+» = بابُ المساهمة في البند */
  ].join(',');

  document.addEventListener('click', e => {
    if (!isGuest()) return;
    const b = e.target.closest(MEMBER_ONLY);
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    /* ‎stopImmediatePropagation‎ كذلك: مستمعٌ آخرُ على ‎document‎ نفسِه قد يكون
       سُجّل قبلنا في الطور نفسِه، والوقفُ يجب أن يكون تامًّا */
    e.stopImmediatePropagation();
    authAsk(b.closest('[data-like],[data-clk],.post-like,.post-thumb') ? T().needAcctLike : T().needAcctPost);
  }, true);

  /* حارسُ الكتابة: يُنادى من داخل الدوالّ التي تُغيّر بيانَ الجماعة */
  function memberGate(msg) {
    if (!isGuest()) return true;
    authAsk(msg);
    return false;
  }

  /* ===== ركنُ الزائر =====
     المستمعُ الذي يفتح الألواح يسكن ‎index.html‎ (يُعلَّق قبل أن يُقرأ هذا الملفّ)،
     فيُمدّ إليه جسران: سؤالٌ عن الجلسة، ودالّةٌ تملأ اللوح */
  window.acIsGuest = isGuest;
  window.acNookLock = function () {
    const el = $('#panel-nook-lock'); if (!el) return;
    el.innerHTML = `<div class="nook-lock">
      <svg class="nook-lock__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="10.5" width="16" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>
      <b class="nook-lock__t">${T().needAcctNook}</b>
      <p class="nook-lock__w">${T().needAcctNookWhy}</p>
      <p class="nook-lock__can">${T().guestCan}</p>
      <div class="nook-lock__b">
        <button type="button" class="acct-btn acct-btn--go" id="nook-join">${T().join}</button>
        <button type="button" class="acct-btn" id="nook-login">${T().login}</button>
      </div>
    </div>`;
  };
  $('#panel-nook-lock').addEventListener('click', e => {
    if (e.target.closest('#nook-join'))  openAuthPage('join');
    if (e.target.closest('#nook-login')) openAuthPage('login');
  });
  /* طي/فتح الشريط الجانبي عبر مقبض واحد ملتصق بحافته (كلاس على body) */
  function applySidebar() {
    document.body.classList.toggle('side-closed', !!state.sideCollapsed);
    const sh = $('#side-handle'); if (sh) sh.title = state.sideCollapsed ? T().sideOpen : T().sideClose;
  }
  $('#side-handle').addEventListener('click', () => { state.sideCollapsed = !state.sideCollapsed; save(); applySidebar(); });
  $('#panel-account').addEventListener('input', e => {
    const inp = e.target.closest('.acct-in'); if (!inp) return;
    state.profile[inp.dataset.f] = inp.value; save(); renderProfile();
    /* والاسمُ يُعرض على كلّ مساهمةٍ نشرتَها، وهو في جدول المستخدمين لا في
       نسخة المساهمة — فلو بقي في الدرج لَظهرتَ للناس باسمك القديم، ولَأعاد
       ‎/api/auth/me‎ القديمَ فوق الجديد في أوّل إقلاع. ويُدفع مؤجَّلًا: الحقلُ
       يُكتب حرفًا حرفًا، والطلبُ لا يُتبع كلَّ حرف */
    if (inp.dataset.f === 'name') profSoon();
  });
  $('#panel-account').addEventListener('click', e => {
    /* ===== وجهُ الباب ===== */
    if (e.target.closest('#auth-swap')) { openAuthPage(authMode === 'join' ? 'login' : 'join'); return; }
    if (e.target.closest('#auth-forgot')) { openAuthPage('recover'); return; }
    if (e.target.closest('#rec-copy')) {
      const b = e.target.closest('#rec-copy');
      /* والنسخُ قد يُمنع (سياقٌ غيرُ آمنٍ أو إذنٌ مرفوض) — فيُحدَّد النصُّ ليُنسخ بيد */
      const done = () => { b.textContent = T().recCopied; setTimeout(() => { b.textContent = T().recCopy; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(authRec).then(done, () => {});
      const el = $('#rec-code');
      if (el && window.getSelection) {
        const rg = document.createRange(); rg.selectNodeContents(el);
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(rg);
      }
      if (!navigator.clipboard) done();
      return;
    }
    if (e.target.closest('#rec-done')) {
      authRec = ''; authRecNew = false; authMode = 'login';
      openAcctPage();   /* صار عضوًا، فصفحةُ الحساب هي ما يُعرض */
      return;
    }
    if (e.target.closest('#auth-go')) {
      const v = a => { const i = $(`.auth-in[data-a="${a}"]`); return i ? i.value : ''; };
      /* والزرُّ يُقفل ويقول «لحظة»: الطلبُ يعبر الشبكةَ الآن، وضغطتان تصنعان
         حسابين أو جلستين. ويُفتح في كلّ الأحوال — نجح أم لا */
      const btn = e.target.closest('#auth-go');
      const was = btn.textContent;
      btn.disabled = true; btn.textContent = T().authWait;
      const mode = authMode;
      const p = mode === 'join'   ? authJoin(v('name'), v('email'), v('pass'))
              : mode === 'recover' ? authRecover(v('email'), v('code'), v('pass'))
              : authLogin(v('email'), v('pass'));
      Promise.resolve(p).then(err => {
        btn.disabled = false; btn.textContent = was;
        /* والخطأُ يُكتب في الصفحة لا في شريطٍ يزول: النموذجُ أمامه ويريد أن يُصلحه */
        if (err) { const b = $('#auth-err'); if (b) { b.textContent = err; b.hidden = false; } return; }
        /* ووضعُ «رمزك» يُعرض أوّلًا إن وُلد رمزٌ — ثمّ صفحةُ الحساب بضغطة «حفظته» */
        openAcctPage();
      });
      return;
    }
    /* ===== وجهُ الحساب ===== */
    /* والخروجُ يُبقي الحساب — والحذفُ وحدَه يمحوه. وكانا فعلًا واحدًا قبل الجلسة */
    if (e.target.closest('#acct-logout')) { authLogout(); return; }
    if (e.target.closest('#mir-link')) { mirrorLink(); return; }
    if (e.target.closest('#mir-unlink')) { mirrorUnlink(); return; }
    const del = e.target.closest('#acct-delete');
    if (del) {
      if (del.dataset.confirm) { clearAccount(); return; }
      del.dataset.confirm = '1'; del.classList.add('is-confirm'); del.textContent = T().deleteConfirm;
      setTimeout(() => { const b = $('#acct-delete'); if (b && b.dataset.confirm) { b.dataset.confirm = ''; b.classList.remove('is-confirm'); b.textContent = T().deleteAcct; } }, 3500);
    }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-pickprofile]')) return;
    pickProfile = true; pickCode = null; imgInput.value = ''; imgInput.click();
  });
  /* نقرة خارج المنسدلة المخصّصة تغلق أي قائمة مفتوحة */
  document.addEventListener('click', e => {
    if (!e.target.closest('.mdrop')) document.querySelectorAll('.mdrop-list').forEach(l => l.hidden = true);
  });

  /* أحداث النافذة: كتابة تُحفظ مباشرة في «مشاركتي»، وتفاعلات الهيكل تعيد رسم منطقتها */
  $('.cm-panel').addEventListener('input', e => {
    if (!cmCode) return;
    if (e.target.id === 'cm-desc') { infoData(cmCode).desc = e.target.value; autoGrow(e.target); save(); return; }
    if (e.target.id === 'cm-book') { infoData(cmCode).book = e.target.value; autoGrow(e.target); save(); return; }
    /* مواضيع المادة: الرقم/الاسم يُحفظان مباشرةً بلا إعادة رسم (كي لا ينقطع المؤشّر) */
    if (e.target.classList.contains('tp-in')) {
      const chip = e.target.closest('.chipe--topics');
      const t = topicsOf(infoData(cmCode))[+chip.dataset.ti];
      if (t) { t[e.target.dataset.f] = e.target.value; save(); }
      return;
    }
    if (e.target.id === 'cm-rel') {
      const nd = natureData(cmCode);
      nd.rel = +e.target.value;
      $('#cm-rel-val').textContent = `${nd.rel}%`;
      save(); return;
    }
    /* محرر رأيي عن الدكتور: الإيميل والوصف (الوصف مستطيل ينمو مع النص) */
    const inp = e.target.closest('.doc-in');
    if (inp) {
      myDrPost(cmCode, cmView.di).data[inp.dataset.f] = inp.isContentEditable ? inp.innerText : inp.value;
      if (inp.tagName === 'TEXTAREA') autoGrow(inp);
      save();
      return;
    }
    /* خانتا الوقت المخصّصتان (HH/MM): أرقام فقط، تُحفظ في نموذج {h,m,ap} بلا إعادة رسم */
    if (e.target.classList.contains('tin')) {
      const val = e.target.value.replace(/\D/g, '').slice(0, 2);
      if (val !== e.target.value) e.target.value = val;
      const tf = e.target.closest('.tfield');
      const hi = +tf.dataset.hi, f = tf.dataset.f;
      const slot = docHours(myDrPost(cmCode, cmView.di).data)[hi];
      const t = normTime(slot[f]) || { h: '', m: '', ap: 'am' };
      if (e.target.classList.contains('tin-h')) t.h = val; else t.m = val;
      slot[f] = (t.h || t.m) ? t : '';
      save();
      return;
    }
    /* أوقات الدكتور: من/إلى داخل مربع الوقت */
    if (e.target.classList.contains('dslot-in')) {
      docHours(myDrPost(cmCode, cmView.di).data)[+e.target.closest('[data-hi]').dataset.hi][e.target.dataset.f] = e.target.value;
      save();
      return;
    }
    /* الدروس: كتابة رقم/اسم الشابتر تُحفظ مباشرة */
    if (e.target.classList.contains('l-in')) {
      myPost(cmCode, 'lessons').data.items[+e.target.closest('.lrow').dataset.i][e.target.dataset.f] = e.target.value;
      save();
      return;
    }
    /* المصادر: كتابة الرابط/النص تُحفظ مباشرة */
    if (e.target.classList && e.target.classList.contains('src-in')) {
      /* لا إعادة رسم أثناء الكتابة (يقطع المؤشّر) — يُحفظ HTML منقّى فقط */
      saveSrcHtml(e.target.closest('.src-area').dataset.area, e.target);
      return;
    }
    /* الشروح: كتابة العنوان/الرابط/المدة تُحفظ مباشرة بالهوية (data-f = name|v|dur) */
    if (e.target.classList.contains('vid-in')) {
      const r = findNode(vidData(cmCode).deck, e.target.closest('.vid-row').dataset.id);
      if (r) { r.n[e.target.dataset.f] = e.target.value; save(); refreshPackBadges(); }
      return;
    }
    /* (بابُ نصّ البطاقة من صفّ الشجرة أُغلق: الصفُّ صار يعرض **اسمَها** المشتقَّ لا نصَّها،
       فلا مستمعَ لـ‎.cx-in‎ — والتعديلُ في النافذة وحدها حيث ترى ما تفعل. ROADMAP-CARD-NAMES) */
    /* اسم المجلد — في محرر البطائق أو الشروح */
    if (e.target.classList.contains('cx-fname')) {
      const r = findNode(edPack().deck, e.target.dataset.id);
      if (r) { r.n.name = e.target.value; save(); }
      return;
    }
    /* بنود التقييم: الاسم يُحفظ مباشرة، والسلايدر يحدّث الشريط حيًّا بلا إعادة رسم (حتى لا ينقطع السحب) */
    if (e.target.classList.contains('gi-name')) {
      const g = gradingOf(cmCode);
      g.items[+e.target.closest('.gitem').dataset.i].name = e.target.value;
      save();
      return;
    }
    if (e.target.classList.contains('gi-pct')) {
      const g = gradingOf(cmCode);
      g.items[+e.target.closest('.gitem').dataset.i].pct = +e.target.value;
      save();
      const used = g.items.reduce((s, x) => s + x.pct, 0);
      const rem = Math.max(0, 100 - used);
      e.target.closest('.gitem').querySelector('.gi-val').textContent = e.target.value + '%';
      const segs = document.querySelectorAll('#cm-gbody .gseg');
      g.items.forEach((x, k) => {
        if (!segs[k]) return;
        segs[k].style.width = x.pct + '%';
        segs[k].textContent = x.pct >= 8 ? x.pct + '%' : '';
      });
      const rest = document.querySelector('#cm-gbody .gbar__rest');
      if (rest) { rest.style.width = rem + '%'; rest.textContent = rem > 0 ? T().remaining(rem) : ''; }
      document.querySelectorAll('#cm-gbody .gitem').forEach((row, k) => {
        row.querySelector('.gi-pct').max = g.items[k].pct + rem;   /* سقف كل سلايدر = نسبته + المتبقي */
      });
    }
  });

  /* بعد انتهاء سحب السلايدر: رسمة نظيفة (تظهر «اكتمل التوزيع» وتختفي البقية) */
  $('.cm-panel').addEventListener('change', e => {
    if (!cmCode) return;
    /* «المادة»: رفع صورة غلاف الكتاب — تُقاس بمقاس المجموعة كما في الركن */
    if (e.target.classList.contains('book-imgfile')) {
      const file = e.target.files[0];
      if (!file || file.size > 12 * 1024 * 1024) return;   /* ملفٌّ لا يُفتح أصلًا */
      const code = cmCode;
      coverFit(file, url => { infoData(code).bookImg = url; save(); renderCmSection(); });
      return;
    }
    if (e.target.classList.contains('gi-pct')) { renderGrading(); return; }
    /* اختيار اليوم داخل مربع الوقت */
    if (e.target.classList.contains('dslot-day')) {
      docHours(myDrPost(cmCode, cmView.di).data)[+e.target.closest('[data-hi]').dataset.hi].day = +e.target.value;
      save();
      return;
    }
    /* ملف المصدر: يُقرأ ويُحفظ داخل المتصفح (حد 3MB) */
    if (e.target.classList.contains('src-file')) {
      const box = e.target.closest('.src'), fid = e.target.dataset.fid;
      const chip = fid && box.querySelector(`.src-fchip[data-fid="${fid}"]`);
      readSrcFile(e.target.closest('.src-area').dataset.area, fid, e.target.files[0], chip);
      return;
    }
    /* الشروح: رفع ملف فيديو (حد VID_MAX — للكبير استخدم رابطًا) */
    if (e.target.classList.contains('vid-file')) {
      const r = findNode(vidData(cmCode).deck, e.target.closest('.vid-row').dataset.id);
      const file = e.target.files[0];
      if (!r || !file) return;
      const vd = r.n;
      /* ولا حدَّ لقدّه بعد اليوم: كان الحدُّ حارسَ الحصّة، والحصّةُ لم تعد تُمَسّ */
      const old = vidBlob.get(vd.id);
      if (old) URL.revokeObjectURL(old);   /* ولا يُترك رابطٌ معلّقٌ في الذاكرة */
      vidBlob.set(vd.id, URL.createObjectURL(file));
      {
        vd.fname = file.name; if (!vd.name) vd.name = file.name; vd.v = vidPathOf(vd, file);
        /* المدة تُقرأ من الملف نفسه لا تُكتب يدويًّا — فتصدق ويصدق مجموعها في العدّادات */
        const probe = document.createElement('video');
        probe.preload = 'metadata';
        probe.onloadedmetadata = () => {
          const t = Math.round(probe.duration || 0);
          if (t) vd.dur = fmtDur(t);
          save(); renderVideos();
        };
        probe.onerror = () => { save(); renderVideos(); };
        probe.src = vidBlob.get(vd.id);
      }
      return;
    }
  });

  /* محرر الشجرة المفتوح حاليًا (بطائق أو شروح) — عملياته المشتركة تتوجه للرزمة الصحيحة */
  const edSec = () => cmView.sub || cmTabSel;
  const edPack = () => edSec() === 'videos' ? vidData(cmCode) : cardData(cmCode);
  /* ===== وبعد كلّ إعادةٍ للشجرة: يتيمُها يُغلق =====
     الشريطُ يُشتقّ من ‎cdWins‎، و‎cdWins‎ يشير إلى عقدٍ في الشجرة — لا العكس. فإذا حُذفت
     عقدةٌ من المحرّر بقيت نافذتُها ولسانُها يشيران إلى ما لا وجود له: يُفتحان على خواءٍ
     ويُكتب فيهما ما لا ينزل في شيء.
     والحذفُ له أبوابٌ شتّى (سلّةُ الصفّ · شريطُ التحديد · حذفُ مجلدٍ بما فيه)، فلا
     يُلاحَق بابًا بابًا: كلُّها تنتهي إلى إعادة رسم الشجرة، فالكنسُ ههنا يبلغها جميعًا.
     والمُستثنى اثنان: نافذةٌ لم تنزل بعدُ (‎id‎ خاوٍ فلا عقدةَ لها أصلًا)، ونافذةُ مادّةٍ
     أخرى — شجرتُها ليست هذه، فلا تُحاكَم بها */
  function cdOrphanSweep() {
    if (!cmCode || !cdWins.length) return;
    const deck = edPack().deck;
    cdWins.slice().forEach(w => {
      /* ونافذةُ الاختبار مستثناةٌ ثالثةً: معرّفُها معارٌ من رزمتها هي (‎xtPk‎) لا من
         رزمة المحرّر، فقد لا تجده هذه الشجرةُ وهو قائمٌ — فتُغلق نافذةٌ حيّةٌ ظلمًا */
      if (!w.id || w.what === 'exam' || (w.code || '') !== cmCode) return;
      if (!findNode(deck, w.id)) cdCloseWin(w);
    });
  }
