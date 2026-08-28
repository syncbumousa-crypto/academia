  /* ===== وورقةُ الملخّص تتبع **الشجرةَ** لا لوحةَ المفاتيح =====
     كانت حياتُها موصولةً بحدث الكتابة وحدَه (‎input‎ في نافذة البطاقة)، وذلك يكفي للمتن
     ولا يكفي للعضويّة: تُنزل بطاقةً في ملفٍّ ورقتُه مفتوحةٌ إلى جانبك — بضغطة الحلقة —
     فلا يقع بعدها حرفٌ يُكتب، فتبقى الورقةُ على ما كانت حتى تُغلق وتُفتح. وهو عطبٌ في
     **المِحور** لا في الحياة: الورقةُ صورةُ الرزمة، فيجب أن تتبع ما يبدّل الرزمةَ لا ما
     يبدّل الحقل.
     والنزولُ والنقلُ والحذفُ وتسميةُ المجلد أبوابٌ شتّى، وكلُّها تنتهي إلى إعادة رسم
     الشجرة — فالنداءُ ههنا يبلغها جميعًا كما بلغها كنسُ اليتيم فوقُ، ولا تُلاحَق بابًا بابًا.
     وهو نداءٌ بلا ثمنٍ إن لم تكن ثَمّ ورقة: ‎sheetLive‎ ترجع من أوّلها إن لم يكن في
     ‎cdWins‎ ورقةٌ مفتوحة، ثمّ تُمهَل، ثمّ تقارن بصمتَها فلا تقيس ولا ترسم إلّا إن تبدّل
     ما يُرسم فعلًا */
  const edRender = () => {
    (edSec() === 'videos' ? renderVideos : renderCards)();
    cdOrphanSweep();
    sheetLive();
  };

  $('.cm-panel').addEventListener('click', e => {
    if (!cmCode) return;
    if (!e.target.closest('#cm-body')) return;   /* نقرات الشريط نفسه يعالجها مستمع cm-panel المخصّص أعلاه */
    /* تنقّل فترات الساعات المكتبية في العرض المنشور (سهمان ▲▼) */
    const hnav = e.target.closest('.hnav-btn');
    if (hnav) {
      const pid = hnav.dataset.hnav, total = +hnav.dataset.htotal;
      hourIdx[pid] = (((hourIdx[pid] || 0) + (+hnav.dataset.hdir)) % total + total) % total;
      renderCmSection();
      return;
    }
    /* المنسدلة المخصّصة (اليوم/ص‑م): فتح/طيّ القائمة · واختيار عنصر */
    const mdBtn = e.target.closest('.mdrop-btn');
    if (mdBtn) {
      const list = mdBtn.closest('.mdrop').querySelector('.mdrop-list');
      const wasOpen = !list.hidden;
      document.querySelectorAll('.mdrop-list').forEach(l => l.hidden = true);
      list.hidden = wasOpen;
      e.stopPropagation();
      return;
    }
    const mdOpt = e.target.closest('.mdrop-opt');
    if (mdOpt) {
      applyMdrop(mdOpt.closest('.mdrop').dataset.drop, mdOpt.dataset.v);
      return;
    }
    /* قائمة الثلاث نقاط: فتح/إغلاق (تعديل/حذف) — التعديل والحذف يعالجهما مستمعاهما أدناه */
    /* اختيار ترتيب المساهمات (الأفضل/الأحدث) من قائمة الهمبرغر */
    const sortOpt = e.target.closest('.cm-sortopt');
    if (sortOpt) {
      cmSort = sortOpt.dataset.sort === 'best' ? 'best' : 'newest';
      document.querySelectorAll('.post-menu.open').forEach(x => x.classList.remove('open'));
      renderCmSection();
      return;
    }
    /* تصفية مساهمات الدكاترة حسب دكتور (أو الكل) من جدول قائمة الهمبرغر */
    /* أسهم المنتقي الأفقي: تبديل الشريحة في مكانها (بلا إعادة رسم) فتبقى القائمة مفتوحة */
    const dcn = e.target.closest('.drcar-nav');
    if (dcn) {
      const car = dcn.closest('.drcar'), n = +car.dataset.total || 1;
      docCarIdx = ((docCarIdx + (+dcn.dataset.d)) % n + n) % n;
      const slides = drCarSlides(doctorsOf(cmCode));
      car.querySelector('.drcar__body').innerHTML = drCarCardHTML(slides[docCarIdx], docCarIdx);
      car.querySelector('.drcar__num').innerHTML = drCarNumHTML(docCarIdx + 1, n);
      return;
    }
    const drf = e.target.closest('.drfilter');
    if (drf) {
      docCarIdx = +drf.dataset.ci || 0;   /* المنتقي يفتح لاحقًا على المختار */
      cmDocSel = drf.dataset.drfilter === 'all' ? null : +drf.dataset.drfilter;
      cmView = { mode: 'list', pi: 0 };   /* خروج من أي تحرير عند تغيير الفلتر */
      cmOpen = new Set();
      document.querySelectorAll('.post-menu.open').forEach(x => x.classList.remove('open'));
      renderCmSection();
      return;
    }
    const mbtn = e.target.closest('.post-menubtn');
    if (mbtn) {
      const m = mbtn.closest('.post-menu');
      const wasOpen = m.classList.contains('open');
      document.querySelectorAll('.post-menu.open').forEach(x => x.classList.remove('open'));
      if (!wasOpen) m.classList.add('open');
      return;
    }
    /* ===== محررا الشجرة (البطائق والشروح): إضافة عقدة · حذف · طي مجلد ===== */
    /* «+ بطاقة» لا يضيف صفًّا في الكومنت: يفتح نافذة الإضافة (كأنكي) وفيها يُضبط كل شيء */
    /* أيقونة نوع البطاقة في صفّها: تُضغط فتفتح النافذة على البطاقة نفسها في مجلدها */
    /* ===== ومفتاحُه ‎[data-cxopen]‎ لا الصنفُ وحدَه =====
       كان يلتقط ‎.cx-open‎ كلَّها — والصنفُ **جلدٌ** لا هويّة: حوضُ ضغطٍ يلبسه كلُّ ما
       يُفتح. فلمّا لبسه صفُّ البطاقة **المنشورة** ابتلع الفرعُ نقرتَه: يسأل ‎edPack()‎
       عن ‎data-cxopen‎ وليست فيه، فيردّ ‎null‎ ثمّ **يقطع بـ‎return‎** — فلا يبلغ
       صاحبَه ولا يقع شيء، ولا يُصاح.
       وهي العلّةُ التي تكرّرت في هذا المشروع: صنفٌ يُستعار للهيئة فيُورَّث معه فعلٌ.
       فيُشترط مفتاحُه: من حمل ‎data-cxopen‎ فهو صفُّ المحرّر، وما سواه يمضي إلى فرعه */
    const cxo = e.target.closest('.cx-open[data-cxopen]');
    if (cxo && edSec() === 'cards') {
      const r = findNode(edPack().deck, cxo.dataset.cxopen);
      if (r) openCardDlg(cxo.dataset.pid || null, r.n);
      return;
    }
    /* ===== مقسومُ الرحلة: صفةٌ في المساهمة لا تفضيلُ جهاز — فتُنشر معها ويراها القارئ =====
       ويُوسَم في مكانه ولا يُستدعى ‎edRender‎: ذاك ينتهي إلى ‎renderCards‎، و‎renderCards‎
       يكتب في ‎#cm-cards‎ وحدَه — أي الشجرة — والتذييلُ **خارجَه**. فكان المفتاحُ يكتب
       الحالَ ويحفظها ولا تنتقل الحبّةُ عن مكانها، فيُرى كأنّه لا يعمل.
       ثمّ إنّ إعادةَ الرسم هنا ضررٌ لا نفع: تهدم الشجرةَ وتطوي حبّةَ الإضافة إن كانت
       مفتوحةً وتقطع التركيز — من أجل صنفٍ واحدٍ يتبدّل. وهي طريقةُ ‎refreshEditCompleteness‎
       نفسُها: ما يتبدّل وحدَه يُحدَّث في موضعه.
       وشجرةُ النشر لا تُمَسّ ههنا: مساهمتي وأنا أحرّرها تُرسم ‎cardEditCard‎ لا ‎packCard‎،
       فالرحلةُ تظهر حين أخرج من التحرير — وهي تُقرأ من ‎d.jr‎ المحفوظة */
    const jrb = e.target.closest('.cx-jrseg [data-jr]');
    if (jrb && (edSec() === 'cards' || edSec() === 'videos')) {
      const d = edPack();
      const want = jrb.dataset.jr === '1';
      if (cxJrOn(d) !== want) {
        d.jr = want;
        save();
        /* الشجرةُ تُعاد لأنّ قضيبَها يظهر ويغيب معه (‎edRender‎ يبني ‎#cm-cards‎)... */
        edRender();
        /* ...وتُلمَح الرحلةُ ثلاثًا ونصفًا ليُرى أثرُ التبديل حيث وقع */
        jrPeek();
        /* ...والتذييلُ خارجَه فلا يبلغه، فيُوسَم المقسومُ في مكانه */
        jrb.closest('.cx-jrseg').querySelectorAll('[data-jr]').forEach(b => {
          const on = (b.dataset.jr === '1') === want;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', on);
        });
      }
      return;
    }
    const cxc = e.target.closest('.cx-addc');
    if (cxc && edSec() === 'cards') { openCardDlg((cxc.closest('.cx-add') || {}).dataset.pid || null, null); return; }
    const cxa = e.target.closest('.cx-addc, .cx-addq, .cx-addf');
    if (cxa) {
      const d = edPack(), wrap = cxa.closest('.cx-add');
      const holder = wrap.dataset.pid ? findNode(d.deck, wrap.dataset.pid) : null;
      const arr = holder ? (holder.n.ch = holder.n.ch || []) : d.deck;
      /* سؤال الاختيار من متعدّد عقدة 'q' في الشجرة نفسها — نصّه في f كالبطاقة، وخياراته تأتي لاحقًا */
      arr.push(cxa.classList.contains('cx-addf')
        ? { id: newId(), t: 'f', name: nextFolderName(d.deck), ci: pickFolderColor(d.deck), open: true, ch: [] }
        : cxa.classList.contains('cx-addq')
          ? { id: newId(), t: 'q', f: '', b: '' }
          : { id: newId(), t: 'c', f: '', b: '' });
      save(); edRender(); return;
    }
    const vta = e.target.closest('.vt-addv');
    if (vta) {
      const d = vidData(cmCode), wrap = vta.closest('.cx-add');
      const holder = wrap.dataset.pid ? findNode(d.deck, wrap.dataset.pid) : null;
      const arr = holder ? (holder.n.ch = holder.n.ch || []) : d.deck;
      arr.push({ id: newId(), t: 'v', vt: vta.dataset.kind, name: '', v: '', dur: '', fname: '' });
      save(); renderVideos(); return;
    }
    const cxd = e.target.closest('.cx-del');
    if (cxd) {
      const r = findNode(edPack().deck, cxd.dataset.id);
      /* والمحذوفُ يخرج من التحديد كذلك — وذرّيتُه معه، وإلّا بقي في الصندوق معرّفٌ
         لا صفَّ له فيُحسب في العدد ولا يُرى */
      if (r) {
        vtFlat([r.n], 0, null).forEach(x => cxSel.delete(x.id));
        r.arr.splice(r.i, 1); save(); edRender();
      }
      return;
    }
    /* أوجهُ البطاقة قبل مجلداتها: المِفصلُ واحدٌ في الشكل ومفتاحُه غيرُه في الحال —
       ‎fopen‎ يبدأ مطويًّا، و‎open‎ يبدأ مفتوحًا. ولو تُرك للعامّ لَقلب مفتاحَ المجلدات */
    /* وصفُّ الوجه يفتح سؤالَه: معاينةٌ لا تحرير — ولذلك لا يفتح نافذةَ البطاقة */
    const cfo = e.target.closest('.cx-face[data-face]');
    if (cfo) { czFaceOpen(cfo.dataset.face, +cfo.dataset.k, cfo.dataset.pid); return; }
    /* و‎[data-id]‎ شرطٌ ههنا كما هو تحته: شجرةُ النشر لبست ‎data-faces‎ يومَ ذُهِّب
       مثلّثُ بطاقتها (هي مِعلاقُ اللون في ‎styles.css‎)، فصار هذا المستمعُ — وهو
       يسبق مستمعَ النشر — يلتقط مثلّثَها ثمّ لا يجد له عقدةً في رزمة التحرير فيرجع
       صامتًا: يبتلع الضغطةَ ولا يطوي وجهًا. فيُشترط المفتاحُ الذي لا تحمله إلّا
       شجرةُ التحرير — واللونُ يبقى معلَّقًا بالسمة وحدَها فلا يُخترع صنفٌ ثانٍ */
    const cxff = e.target.closest('.cx-fold[data-faces][data-id]');
    if (cxff) {
      const r = findNode(edPack().deck, cxff.dataset.id);
      if (r) { r.n.fopen = !r.n.fopen; save(); edRender(); }
      return;
    }
    /* ===== و‎[data-id]‎ شرطٌ لا زينة =====
       شجرةُ النشر تلبس المثلّثَ نفسَه (‎.cx-fold‎) ليكون الرسمُ واحدًا، لكنّها تطوي
       بمفتاحٍ آخر (‎data-fold‎ في حال العارض) لا بـ‎data-id‎ (في عقدة المالك).
       وهذا المستمعُ **يسبق** مستمعَ النشر في الملفّ، فكان يلتقط مثلّثَ النشر ثمّ لا
       يجد له عقدةً في رزمة التحرير فيرجع صامتًا — **فيبتلع الضغطةَ ولا يطوي شيئًا**،
       ولا تبلغ مستمعَها أبدًا. فيُشترط المفتاحُ الذي لا تحمله إلّا شجرةُ التحرير */
    const cxf = e.target.closest('.cx-fold[data-id]');
    if (cxf) {
      const r = findNode(edPack().deck, cxf.dataset.id);
      /* ‎r.n.open‎ بعد القلب: ‎true‎ يعني أنّه فُتح الآن. والإمساكُ **قبل** الرسم */
      if (r) {
        r.n.open = r.n.open === false;
        cxHold(r.n.id, r.n.open);
        save(); edRender();
      }
      return;
    }
    /* ===== «البطائق» — وضع المذاكرة ===== */
    const cst = e.target.closest('.cx-study');
    if (cst) {
      const p = postsOf(cmCode, 'cards')[+cst.dataset.pi];
      if (!p) return;
      /* ومعرّفُ بطاقةِ المذاكرة **مفتاحُ سجلّها** لا معرّفُ عقدتها: هي لا تُستعمل إلّا
         للجدولة والحكم (‎srsApply‎ · ‎cxAns‎ · ‎srsNew/srsDue‎)، فتُبنى بالمفتاح مرّةً
         واحدةً ههنا بدل أن يُترجَم في خمسة مواضع */
      let cards = flatCards(p.data.deck || []).map(n => ({ id: recId(n), node: n, f: n.f, b: n.b }));
      if (cst.dataset.due) cards = cards.filter(cd => srsNew(cd.id) || srsDue(cd.id));   /* «المستحق»: الجديد + المستحق فقط */
      if (!cards.length) return;
      cxStudy = { pid: p.id, by: pName(p), cards, i: 0, flipped: false, again: 0 };
      renderCmSection(); return;
    }
    if (e.target.closest('.cxs-show') || (e.target.closest('[data-cxsflip]') && cxStudy && !e.target.closest('button'))) {
      if (cxStudy && cxStudy.i < cxStudy.cards.length) { cxStudy.flipped = !cxStudy.flipped; renderCmSection(); }
      return;
    }
    const csg = e.target.closest('.cxs-g');
    if (csg && cxStudy) { cxsGrade(csg.dataset.g); return; }
    if (e.target.closest('.cxs-shuffle') && cxStudy) {
      const a = cxStudy.cards;
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      cxStudy.i = 0; cxStudy.flipped = false; cxStudy.again = 0;
      renderCmSection(); return;
    }
    if (e.target.closest('.cxs-restart') && cxStudy) { cxStudy.i = 0; cxStudy.flipped = false; cxStudy.again = 0; renderCmSection(); return; }
    if (e.target.closest('.cxs-exit')) { cxStudy = null; renderCmSection(); return; }
    /* ===== حبّةُ التحديد في شجرة النشر — تُسأل قبل الطيّ: كلاهما في صفٍّ واحد ===== */
    /* ===== وبطاقةُ النشر تُفتح مقفلةً =====
       هويّةُ رزمتها تُقرأ من **حاضنها** (‎data-ck‎ في ‎packCard‎) لا من حالٍ على الشاشة،
       فتُقيَّد في النافذة وتُقرأ منها بعد ذلك (‎cdDeck‎ · فرعُ ‎pub‎).
       وأبوها يُقاس من الشجرة لا يُمرَّر: المسارُ يحتاجه، و‎cxTrail‎ تعرفه.
       ويُستثنى جوفُ نافذة الاستيراد: الصفُّ هناك يُنتقى لا يُقرأ، ونافذةٌ فوق نافذةٍ
       تُضيّع ما جُمع في السلّة */
    const cro = e.target.closest('[data-cro]');
    if (cro && !cro.closest('#jri-body')) {
      const box = cro.closest('.post.pk[data-ck]');
      const post = box && postsOf(cmCode, 'cards').find(x => x.id === box.dataset.ck);
      const r = post && findNode(post.data.deck, cro.dataset.cro);
      if (r) {
        const tr = cxTrail(post.data.deck, r.n.id) || [];
        openCardDlg(tr.length ? tr[tr.length - 1] : null, r.n, false,
          { ro: true, pub: { code: cmCode, sub: 'cards', id: post.id } });
      }
      return;
    }
    const rsel = e.target.closest('[data-rosel]');
    /* وفي نافذة الاستيراد للتحديد سلّتُه هو: ‎cxSel‎ ديكٌ واحدٌ في لحظة، والسلّةُ تجمع
       من رزمٍ وبابَين. فيُقطع الطريقُ ههنا قبل أن تبلغه — والمربّعُ والطلاءُ واحدٌ */
    if (rsel && rsel.closest('#jri-body')) { jriToggle(rsel.dataset.rosel); return; }
    if (rsel) { cxToggleSel(rsel.dataset.rosel, true, e.shiftKey); return; }
    /* ===== طي/فتح مجلد في متصفح الرزم (بطائق أو شروح — محلي لا يمس مساهمة صاحبها) ===== */
    const cvf = e.target.closest('[data-fold]');
    if (cvf) {
      const M = cmTabSel === 'videos' ? vidView.fold : cardView.fold;
      const fid = cvf.dataset.fold;
      M[fid] = !(M[fid] === true);
      /* والمفتاحُ ‎data-fold‎ يحمله في النشر رأسُ المجلد ومثلّثُ البطاقة الوالدة معًا،
         وشجرةُ الفيديوهات كذلك. والإمساكُ لا يضرّ فيهنّ: ‎cxHot‎ اسمٌ لا يجده رأسُ مجلدٍ
         فلا يُلبس أحدٌ شيئًا، ويُطلق كما يُطلق سواه */
      cxHold(fid, M[fid]);
      renderCmSection();
      return;
    }
    /* ===== المستطيل الأصفر في «المادة»: الضغط عليه يفتح Popup بالنص الكامل فقط ===== */
    const pchip = e.target.closest('.peek-chip');
    if (pchip) {
      const pk = pchip.closest('.post.pk');
      if (pk && pk.dataset.sub === 'info') { openChip(pchip); return; }
    }
    /* ===== شارات «الدكاترة» المنشورة: نفس السلوك — الضغط يفتح Popup بمحتوى الشارة كاملًا
       (الإيميل ضمنها: لا رابط mailto). وأسهم تنقّل الفترات يعالجها مستمعها أعلاه ===== */
    const dchip = e.target.closest('.peek-flow > .v-badge, .peek-flow > .chipe--absview');
    if (dchip) { openChip(dchip); return; }
    /* ===== مفتاح التاريخ: تبديل الزمن النسبيّ ⇄ التاريخ الرقميّ — مستقلّ عن توسيع النصّ ===== */
    const dsw = e.target.closest('[data-dsw]');
    if (dsw) {
      const k = dsw.dataset.dsw;
      if (dtAbs.has(k)) dtAbs.delete(k); else dtAbs.add(k);
      renderCmSection(); return;
    }
    /* ===== «ابدأ»: تُفتح الرزمةُ وتُحدَّد كلُّها — ويقف الفعلُ ههنا =====
       كان يمضي إلى نافذة الإعدادات (‎xtStart‎) فيقفز بك من ضغطةٍ واحدةٍ إلى امتحان.
       وذلك يفترض عنك قرارًا لم تتّخذه: **أتُذاكر أم تُختبر؟** فرُدّ الفعلُ إلى حدّه:
       يفتح ويحدّد ثمّ يُسلّمك إلى **شريط التحديد** (‎.cx-selbar‎) — وفيه في وضع النشر
       «ذاكر الملخّص» و«اختبر نفسك» و«شارك الرابط». فالزرُّ يُهيّئ، والقرارُ لك.

       ===== وترتيبُ الاثنين ملزم =====
       الفتحُ أوّلًا كي تكون الشجرةُ على الشاشة فيجد ‎cxPaintSel‎ صفوفًا يطليها،
       والتحديدُ ثانيًا. ثمّ يجيء الشريطُ من ‎renderCmSection‎ نفسِها: تُنادي ‎cxPaintSel‎
       (لأنّ ‎cxSelRo‎ مرفوع) وهي تُنادي ‎cxSelSync‎ وهي تُنادي ‎cxBarPaint‎. فلا يُستدعى
       الشريطُ بيدٍ ههنا — ولو استُدعي قبل الرسم لَسأل عن ‎.x3.cx-ro‎ ولمّا تُبنَ بعد.
       ويسبق مستمعَ ‎.pk-toggle‎: الزرّان جاران في الترويسة، وهذا ليس زرَّ طيّ */
    const pkt = e.target.closest('.cx-pktest');
    if (pkt) {
      const box = pkt.closest('.post.pk');
      /* ورزمةُ الشروح تُعرف بمفتاحها: ‎data-pk‎ لها و‎data-ck‎ للبطائق (‎packCard‎) */
      const vid = box && box.dataset.pk != null;
      const id = box && (vid ? box.dataset.pk : box.dataset.ck);
      const post = id && postsOf(cmCode, vid ? 'videos' : 'cards').find(x => x.id === id);
      if (!post || !Array.isArray(post.data.deck) || !countLeaf(post.data.deck)) return;
      if (vid) {
        /* ولا تحديدَ ههنا: شجرةُ نشر الشروح بلا مقابضِ تحديد، وشريطُ الأسفل للبطائق.
           و«ابدأ» تفتح **نافذةَ الدورة**: مُشغّلٌ وشجرةٌ مسارًا — وهي فعلُ البدء حقًّا،
           فلا يبقى الزرُّ صنوًا لمثلّث التوسيع بجانبه */
        vwOpen(post);
        return;
      }
      if (cardView.open !== id) {
        cardView = { open: id, fold: {} };
        const dk = box.dataset.dkey; if (dk) dtAbs.add(dk);
      }
      /* وتحديدُ الكلّ: كلُّ عقدةٍ في الشجرة — مجلداتٍ وأوراقًا، كما لو ضُغط كلُّ صفٍّ بيدك.
         و‎cxSelRo‎ يُرفع لأنّ الديك ديكُ **النشر** لا ديكُ التحرير */
      cxSel.clear(); cxSelRo = true;
      (function all(a) { (a || []).forEach(n => { cxSel.add(n.id); if (n.t === 'f') all(n.ch); }); })(post.data.deck);
      renderCmSection();
      return;
    }
    /* ===== زر التوسيع/التضييق (.pk-toggle) — للرزم (شروح/بطائق) ولكومنتات المادة/الدكتور المطوية ===== */
    const pt = e.target.closest('.pk-toggle');
    if (pt) {
      const pk = pt.closest('.post.pk');
      let nowOpen;
      if (pk.classList.contains('pk--fold')) {   /* المادة/الدكتور: توسيع/تضييق إنلاين، حالة الطي في cmOpen */
        const key = pk.dataset.dr != null
          ? `doc:${pk.dataset.dr}:${pk.dataset.pi}`
          : `${pk.dataset.sub}:${pk.dataset.pi}`;
        if (cmOpen.has(key)) cmOpen.delete(key); else cmOpen.add(key);
        nowOpen = cmOpen.has(key);
      } else if (pk.dataset.pk != null) {
        vidView = { open: vidView.open === pk.dataset.pk ? null : pk.dataset.pk, fold: {} };
        nowOpen = vidView.open === pk.dataset.pk;
      } else {
        const id = pk.dataset.ck;
        /* وتحديدُ رزمةٍ يذهب بذهابها: عقدُه من ديكها، فلو بقي لَعُدَّ على ديكٍ آخر */
        if (cxSelRo) { cxSel.clear(); cxSelRo = false; }
        cardView = { open: cardView.open === id ? null : id, fold: {} };
        nowOpen = cardView.open === id;
      }
      /* الربط باتجاه واحد: توسيع المساهمة يضغط مفتاح التاريخ معه (فيمتلئ ويصير رقميًّا)
         وتضييقها يرجعه — أما ضغط التاريخ وحده فلا يمسّ النصّ */
      const dk = pk.dataset.dkey;
      if (dk) { if (nowOpen) dtAbs.add(dk); else dtAbs.delete(dk); }
      renderCmSection(); return;
    }
    /* المصادر: اختيار قناة فهم/ممارسة → مساهماتها · رجوع → التقسيم */
    const shalf = e.target.closest('.srchalf');
    if (shalf) { cmSrcSel = shalf.dataset.src; renderCmSection(); return; }
    if (e.target.closest('#cm-srcback')) { cleanupEmptyMine(); cmSrcSel = null; renderCmSection(); return; }
    /* الواجهة المشتركة: رجوع · لايك (البذرة حُذفت — الإضافة عبر دائرة «+» في زر البند) */
    if (e.target.closest('#cm-back')) {
      cleanupEmptyMine();
      cmView = { mode: 'list', pi: 0, di: 0 };
      renderCmSection(); return;
    }
    /* نقر رأس الكتلة (دكتور أو قناة فرعية) = المساهمة فيها */
    const dh = e.target.closest('.dr__head');
    if (dh && !e.target.closest('button')) {
      const wrap = dh.closest('.dr');
      cmView = wrap.dataset.dr != null
        ? { mode: 'edit', pi: 0, di: +wrap.dataset.dr }
        : { mode: 'edit', pi: 0, sub: wrap.dataset.sub };
      renderCmSection(); return;
    }
    /* تعديل/حذف مشاركتي */
    const pe = e.target.closest('.post-edit');
    if (pe) {
      cmView = pe.dataset.dr != null
        ? { mode: 'edit', pi: 0, di: +pe.dataset.dr }
        : { mode: 'edit', pi: 0, sub: pe.dataset.sub };
      renderCmSection(); return;
    }
    const pd = e.target.closest('.post-del');
    if (pd) {
      const arr = pd.dataset.dr != null
        ? doctorsOf(cmCode)[+pd.dataset.dr].posts
        : postsOf(cmCode, pd.dataset.sub || cmTabSel);
      const mi = arr.findIndex(x => x.me);
      if (mi >= 0) { arr.splice(mi, 1); save(); renderCmSection(); }
      return;
    }
    /* حذف إداري لأي مساهمة (لوحة الأدمن) — بتأكيد، والفهرس فهرس المصفوفة الأصلية */
    const admDel = e.target.closest('.post-admdel');
    if (admDel) {
      const arr = admDel.dataset.dr != null
        ? doctorsOf(cmCode)[+admDel.dataset.dr].posts
        : postsOf(cmCode, admDel.dataset.sub || cmTabSel);
      const i = +admDel.dataset.like;
      const who = arr[i] ? nameOf(arr[i]) : '';
      if (arr[i] && confirm(`${T().delItem}: «${who}»؟`)) { arr.splice(i, 1); save(); renderCmSection(); }
      document.querySelectorAll('.post-menu.open').forEach(x => x.classList.remove('open'));
      return;
    }
    /* إبلاغ عن مساهمة غيري (علم محلي فقط، بلا خادم) */
    const prep = e.target.closest('.post-report');
    if (prep) {
      const p = prep.dataset.dr != null
        ? doctorsOf(cmCode)[+prep.dataset.dr].posts[+prep.dataset.like]
        : postsOf(cmCode, prep.dataset.sub || cmTabSel)[+prep.dataset.like];
      if (p && !p.reported) { p.reported = true; save(); renderCmSection(); }
      return;
    }
    /* إبهام مفيد/غير مفيد («المادة») — لايك وديسلايك متعارضان (يُلغي أحدهما الآخر) */
    const thumbBtn = e.target.closest('.post-thumb');
    if (thumbBtn) {
      if (!memberGate(T().needAcctLike)) return;   /* طبقةُ الضمان تحت طبقة النقر */
      const p = thumbBtn.dataset.dr != null
        ? doctorsOf(cmCode)[+thumbBtn.dataset.dr].posts[+thumbBtn.dataset.like]
        : postsOf(cmCode, thumbBtn.dataset.sub || cmTabSel)[+thumbBtn.dataset.like];
      /* ومساهمةُ الخادم عدُّها هناك: تُصرَف إلى ‎srvLike‎ ولا تُمسّ محلّيًّا.
         والخفضُ لا خادمَ له بعد — فيبقى محلّيًّا حتى يُبنى (م٣ب) */
      if (p && p.srv && thumbBtn.dataset.react === 'up') { srvLike(p); return; }
      if (p) {
        if (thumbBtn.dataset.react === 'up') {
          p.liked = !p.liked;
          p.likes = Math.max(0, (p.likes || 0) + (p.liked ? 1 : -1));
          if (p.liked && p.disliked) { p.disliked = false; p.dislikes = Math.max(0, (p.dislikes || 0) - 1); }
        } else {
          p.disliked = !p.disliked;
          p.dislikes = Math.max(0, (p.dislikes || 0) + (p.disliked ? 1 : -1));
          if (p.disliked && p.liked) { p.liked = false; p.likes = Math.max(0, (p.likes || 0) - 1); }
        }
        save(); renderCmSection();
      }
      return;
    }
    /* تثبيت/إلغاء تثبيت مساهمة (أدمن): المثبَّتة تتصدّر القائمة في أي ترتيب */
    const pinBtn = e.target.closest('.post-pin');
    if (pinBtn) {
      const p = pinBtn.dataset.dr != null
        ? doctorsOf(cmCode)[+pinBtn.dataset.dr].posts[+pinBtn.dataset.like]
        : postsOf(cmCode, pinBtn.dataset.sub || cmTabSel)[+pinBtn.dataset.like];
      if (p) {
        p.pin = !p.pin;
        if (p.pin) p.pinAt = Date.now();   /* الأحدث تثبيتًا هو صاحب الغلاف */
        save();
        /* الغلاف تابع للتثبيت: نعيد بناء واجهة المادة (فيها صورة العنوان) وبِكَر الكتب كي يتغيّر فورًا */
        if (cmCode) fillCourseUI(cmCode); else renderCmSection();
        mkTab.render(); mkModal.render();
        if (selTerm) renderFrame();
      }
      document.querySelectorAll('.post-menu.open').forEach(x => x.classList.remove('open'));
      return;
    }
    const likeBtn = e.target.closest('.post-like');
    if (likeBtn) {
      if (!memberGate(T().needAcctLike)) return;
      const p = likeBtn.dataset.dr != null
        ? doctorsOf(cmCode)[+likeBtn.dataset.dr].posts[+likeBtn.dataset.like]
        : postsOf(cmCode, likeBtn.dataset.sub || cmTabSel)[+likeBtn.dataset.like];
      if (p && p.srv) { srvLike(p); return; }   /* واردةٌ: عدُّها على الخادم */
      if (p) {
        p.liked = !p.liked;
        p.likes = Math.max(0, (p.likes || 0) + (p.liked ? 1 : -1));
        save(); renderCmSection();
      }
      return;
    }
    /* (أُلغي فتح الكومنت — كامل المعلومات معروضة داخله مباشرة) */
    /* ===== محرر رأيي عن الدكتور المحدد (cmView.di) ===== */
    const at = e.target.closest('.doc-addtime, .hr-add');
    if (at) {
      const hrs = docHours(myDrPost(cmCode, cmView.di).data);
      hrs.push({ day: 0, from: '', to: '' });
      ehIdx = hrs.length - 1;   /* الانتقال للفترة الجديدة مباشرةً */
      save(); renderCmSection(); return;
    }
    /* تنقّل بين فترات الساعات في التحرير (سهمان ▲▼) */
    const ehb = e.target.closest('.ehnav-btn');
    if (ehb) {
      const total = docHours(myDrPost(cmCode, cmView.di).data).length;
      if (total) ehIdx = ((ehIdx + (+ehb.dataset.ehdir)) % total + total) % total;
      renderCmSection(); return;
    }
    const sdel = e.target.closest('.dslot-del, .hr-del');
    if (sdel) {
      const hrs = docHours(myDrPost(cmCode, cmView.di).data);
      hrs.splice(+sdel.closest('[data-hi]').dataset.hi, 1);
      ehIdx = Math.max(0, Math.min(ehIdx, hrs.length - 1));   /* تصحيح المؤشّر بعد الحذف */
      save(); renderCmSection(); return;
    }
    const rb = e.target.closest('.rb');
    if (rb && rb.closest('.doc')) {   /* مكعبات العرض (خارج .doc) للقراءة فقط */
      const wrap = rb.closest('.rate__blocks');
      const d = myDrPost(cmCode, cmView.di).data;
      d[wrap.dataset.k] = +rb.dataset.r;
      save();
      wrap.querySelectorAll('.rb').forEach(x => x.classList.toggle('on', +x.dataset.r <= +rb.dataset.r));
      wrap.closest('.rate').querySelector('.rate__v').textContent = `${rb.dataset.r}/10`;
      return;
    }
    /* منطقة التقييم: طريقة التقييم + إضافة/حذف البنود */
    const gm = e.target.closest('.gm-btn');
    if (gm) {
      gradingOf(cmCode).method = gm.dataset.m;
      save();
      document.querySelectorAll('#cm-gmethod .gm-btn').forEach(b => b.classList.toggle('on', b === gm));
      return;
    }
    if (e.target.closest('#cm-additem')) {
      const g = gradingOf(cmCode);
      const rem = Math.max(0, 100 - g.items.reduce((s, x) => s + x.pct, 0));
      g.items.push({ name: '', pct: Math.min(10, rem) });
      save(); renderGrading(); return;
    }
    const gdel = e.target.closest('.gi-del');
    if (gdel) {
      gradingOf(cmCode).items.splice(+gdel.closest('.gitem').dataset.i, 1);
      save(); renderGrading();
      return;
    }
    /* الغياب/التأخير: عدّادات ± في القناة المستقلة (لم تعد داخل محرر الدكتور) */
    const ab = e.target.closest('.abs-step button');
    if (ab) {
      const stepEl = ab.closest('.abs-step');
      const A = myPost(cmCode, 'abs').data;
      A[stepEl.dataset.ab] = Math.max(0, (A[stepEl.dataset.ab] || 0) + (+ab.dataset.d));
      save(); renderAbsence();
      return;
    }
    /* عدّادات «الغياب والتأخير» المضغوطة (▲▼) داخل بطاقة تحرير البند — القناة abs على مستوى المادة،
       ويُعاد الرسم فيتحدّث الشريط المرقّم تحتها */
    const dab = e.target.closest('.dabs-step button');
    if (dab) {
      const stepEl = dab.closest('.dabs-step');
      const A = myPost(cmCode, 'abs').data;
      A[stepEl.dataset.ab] = Math.max(0, (A[stepEl.dataset.ab] || 0) + (+dab.dataset.d));
      save(); renderCmSection();
      return;
    }
    /* عدّادا تقييم الشرح/كرم الدرجات (▲▼) — القيمة ٠..١٠، تُحدَّث في مكانها بلا إعادة رسم */
    const drate = e.target.closest('.drate-step button');
    if (drate) {
      const stepEl = drate.closest('.drate-step');
      const k = stepEl.dataset.k;
      const d = myDrPost(cmCode, cmView.di).data;
      d[k] = Math.max(0, Math.min(10, (+d[k] || 0) + (+drate.dataset.d)));
      save();
      const numEl = stepEl.parentElement.querySelector('.rv-num');
      if (numEl) numEl.textContent = d[k];
      return;
    }
    /* «المادة» — مواضيع المادة: إضافة · تنقّل ▲▼ · حذف المعروض */
    if (e.target.closest('.tp-add')) {
      const list = topicsOf(infoData(cmCode));
      list.push({ num: '', name: '' });
      topicIdx = list.length - 1;
      save(); renderCmSection();
      return;
    }
    const tpNav = e.target.closest('.tp-step button');
    if (tpNav) {
      const n = topicsOf(infoData(cmCode)).length;
      if (n) topicIdx = ((topicIdx + (+tpNav.dataset.d)) % n + n) % n;
      renderCmSection();
      return;
    }
    if (e.target.closest('.tp-del')) {
      const list = topicsOf(infoData(cmCode));
      if (list.length) {
        list.splice(Math.min(topicIdx, list.length - 1), 1);
        topicIdx = Math.max(0, Math.min(topicIdx, list.length - 1));
        save(); renderCmSection();
      }
      return;
    }
    /* «المادة»: عدّادا نسبة الترابط بالمنهج (سهم فوق يزيد ٥٪ · تحت ينقص) */
    const rs = e.target.closest('.rel-step');
    if (rs) {
      const nd = natureData(cmCode);
      nd.rel = Math.max(0, Math.min(100, (nd.rel || 0) + (+rs.dataset.d)));
      save();
      const rv = document.getElementById('cm-rel-val');
      if (rv) rv.textContent = nd.rel + '%';
      return;
    }
    /* شارة الوضع: تفتح لوحة التبديل وحدها، والمحرّر يبقى مفتوحًا */
    if (e.target.closest('#cm-pst')) { openPstAsk(false); return; }
    /* «تمّ»: إعلانُ انتهاءٍ لا حفظ — والمساهمة محفوظةٌ منذ أوّل حرف.
       وقبل الخروج يُسأل عمّن يراها، ما دامت لم تُنشر بعد */
    if (e.target.closest('#cm-info-share')) {
      const p = editingPost();
      if (p && pstOf(p) !== 'pub') { openPstAsk(true); return; }
      cleanupEmptyMine();
      cmView = { mode: 'list', pi: 0 };
      renderCmSection();
      return;
    }
    /* ✕ في بطاقة التحرير الإنلاين: تجاهل مساهمتي والخروج من التحرير (المادة أو الدكتور) */
    if (e.target.closest('.infoedit-del')) {
      const arr = (cmTabSel === 'doc' && cmView.di != null)
        ? doctorsOf(cmCode)[cmView.di].posts
        : postsOf(cmCode, cmView.sub || cmTabSel);   /* لا 'info' ثابتًا: التذييل يُستخدم في «توزيع الدرجات» أيضًا */
      const mi = arr.findIndex(x => x.me);
      if (mi >= 0) { arr.splice(mi, 1); save(); }
      cmView = { mode: 'list', pi: 0 };
      renderCmSection();
      return;
    }
    /* الدروس: إضافة صف · حذف صف */
    if (e.target.closest('#cm-addlesson')) {
      myPost(cmCode, 'lessons').data.items.push({ num: '', name: '' });
      save(); renderLessons(); return;
    }
    const ld = e.target.closest('.l-del');
    if (ld) {
      myPost(cmCode, 'lessons').data.items.splice(+ld.closest('.lrow').dataset.i, 1);
      save(); renderLessons(); return;
    }
    /* (أُزيلت معالجات ‎.vid-add‎ و‎.vid-del‎: كانتا لقائمة ‎d.vids‎ المسطّحة قبل شجرة الرزمة —
       الإضافة والحذف اليوم عبر ‎.vt-addv‎ و‎.cx-addc‎ و‎.cx-addf‎ و‎.cx-del‎ على ‎deck‎ بالهوية الثابتة) */
    /* المصادر: إضافة أساسي/فرعي · حذف · تبديل نوع المحتوى */
    /* أزرار التنسيق: تُنفَّذ على التحديد القائم (التركيز محفوظ عبر mousedown preventDefault) */
    const sfmt = e.target.closest('.src-fmt');
    if (sfmt) {
      const area = srcAreaOf(sfmt), el = srcInOf(area);
      if (!el) return;
      /* ===== و«المصادر» تُصرّح بوضعها ولا ترثه =====
         ‏‎styleWithCSS‎ حالُ **الوثيقة** كلِّها لا حالُ نداءٍ: من أشعلها بقيت مشتعلةً على
         كلّ محرّرٍ بعده. وكانت فقاعةُ البطاقة تُشعلها في كلّ أمر، فيرث هذا المحرّرُ
         الاشتعالَ فيُنزل تثقيلَه ‎<span style="font-weight:…">‎ — و‎sanitizeRich‎ لا تُجيز
         ‎span‎ ولا تُبقي سمةً، فتفكّه عند الحفظ. فيُثقَّل النصُّ أمام عينك ويعود عاديًّا
         بعد الحفظ، بلا صياح: ضياعُ عملٍ صامتٌ مربوطٌ بأنّك نسّقتَ بطاقةً قبله.
         فيُطفأ ههنا صراحةً: هذا المحرّرُ يحفظ **وسومًا** لا أنماطًا، فلا يُترك حالُه
         لآخر من عبث بالوثيقة */
      try { document.execCommand('styleWithCSS', false, false); } catch (er) { /* متصفّح لا يدعمها */ }
      try { document.execCommand(sfmt.dataset.cmd, false, null); } catch (er) {}
      saveSrcHtml(area, el);
      syncFmtState(area);
      return;
    }
    /* أداة الملف: تدرج شريحة فارغة إنلاين في موضع المؤشّر */
    const stool = e.target.closest('.src-tool--file');
    if (stool) {
      const area = srcAreaOf(stool), box = srcBoxOf(area);
      if (box) insertFileChip(area, box);
      return;
    }
    /* حذف شريحة ملف من داخل النصّ */
    const fdel = e.target.closest('.fchip-del');
    if (fdel) {
      const box = fdel.closest('.src'), chip = fdel.closest('.src-fchip'), el = box.querySelector('.src-in');
      if (chip) { chip.remove(); saveSrcHtml(box.closest('.src-area').dataset.area, el); }
      return;
    }
    /* نقر الشريحة (عدا منسدلة النوع والحذف) يفتح منتقي الملفات لها */
    const fchip = e.target.closest('.src-fchip');
    if (fchip && !e.target.closest('.mdrop')) {
      const box = fchip.closest('.src'), inp = box.querySelector('.src-file');
      if (inp) { inp.dataset.fid = fchip.dataset.fid; inp.value = ''; inp.click(); }
      return;
    }
  });

  /* أزرار الشريط لا تسرق التركيز من النصّ — وإلا ضاع التحديد قبل تنفيذ الأمر */
  $('.cm-panel').addEventListener('mousedown', e => {
    if (e.target.closest('.src-tool')) e.preventDefault();
  });
  /* إبراز الأزرار النشطة حسب حالة التحديد (عريض/مائل/قائمة) — الأدوات في التذييل */
  function syncFmtState(area) {
    const tools = area && document.querySelector(`.src-tools[data-area="${area}"]`);
    if (!tools) return;
    tools.querySelectorAll('.src-fmt').forEach(b => {
      let on = false;
      try { on = document.queryCommandState(b.dataset.cmd); } catch (er) {}
      b.classList.toggle('on', !!on);
    });
  }
  ['keyup', 'mouseup'].forEach(ev => $('.cm-panel').addEventListener(ev, e => {
    const el = e.target.closest && e.target.closest('.src-in');
    if (el) syncFmtState(srcAreaOf(el));
  }));

  /* إفلات ملف على خانة ملف داخل المربّع (dragover/drop يتصاعدان فينفع التفويض) */
  $('.cm-panel').addEventListener('dragover', e => {
    const chip = e.target.closest('.src-fchip'); if (!chip) return;
    e.preventDefault(); chip.classList.add('is-drop');
  });
  $('.cm-panel').addEventListener('dragleave', e => {
    const chip = e.target.closest('.src-fchip'); if (chip) chip.classList.remove('is-drop');
  });
  $('.cm-panel').addEventListener('drop', e => {
    const chip = e.target.closest('.src-fchip'); if (!chip) return;
    e.preventDefault(); chip.classList.remove('is-drop');
    const box = chip.closest('.src'), wrap = chip.closest('.src-area');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (wrap && box && file) readSrcFile(wrap.dataset.area, +box.dataset.i, chip.dataset.fid, file, chip);
  });

  /* تحديث دائرة الاكتمال حيًّا بعد أي تعديل داخل بطاقة التحرير (مسجّلة بعد المعالجات أعلاه كي تعمل بعد كتابة البيانات) */
  $('.cm-panel').addEventListener('input', refreshEditCompleteness);
  $('.cm-panel').addEventListener('change', refreshEditCompleteness);
  $('.cm-panel').addEventListener('click', refreshEditCompleteness);

  /* ---------- تطبيق اللغة على الموقع كاملًا ---------- */
  function applyLang() {
    const t = T();
    document.documentElement.lang = state.lang;
    document.documentElement.dataset.lang = state.lang;
    /* التخطيط ثابت دائمًا (dir=rtl لا يتغيّر): تغيير اللغة يبدّل النصوص فقط.
       الاستثناء الوحيد: اتجاه بطاقة المادة (الصورة يمين/يسار) عبر CSS على data-lang. */
    document.title = t.title;
    { const lg = $('.side-logo'); if (lg) lg.textContent = t.siteName; }   /* الشعار: أكاديميا · academia */
    document.querySelector('.tabs [data-tab="market"] .tab-tx').textContent = t.tabMarket;
    document.querySelector('.tabs [data-tab="library"] .tab-tx').textContent = t.tabLibrary;
    $('#btn-addterm').textContent = `+ ${t.addTerm}`;
    $('#term-input').placeholder = t.termPh;
    $('#drop-add').title = t.addCourse;
    { const g = $('#drop-gear'); if (g) { g.title = t.termSettings; g.setAttribute('aria-label', t.termSettings); } }
    $('#mm-title').textContent = t.tabMarket;
    $('#dm-name-label').textContent = t.termNameLabel;
    /* والدليلُ في الإطار الخالي يتبع اللغة كسائر النصوص */
    { const h = document.getElementById('term-hint'); if (h) h.textContent = t.termHint; }
    $('#dm-start-label').textContent = t.startDate;
    $('#dm-end-label').textContent = t.endDate;
    $('#dm-save').textContent = t.saveBtn;
    $('#dm-delete').textContent = t.delTermBtn;
    { const cl = $('#dm-courses-label'); if (cl) cl.textContent = t.termCourses; }
    if (dateTerm) renderDmCourses();   /* أسماء المواد تتبع اللغة */
    renderToday();
    renderTerms();   /* عنوان أيقونة التاريخ يتبع اللغة */
    document.querySelectorAll('.langbar button').forEach(b =>
      b.classList.toggle('is-active', b.dataset.lang === state.lang));
    renderProfile();
    /* ولوحا الجلسة يتبعان اللغة كسائر المكتوب: صفحةُ الباب (أو الحساب) إن كانت
       مفتوحة، ولوحُ الركن المقفل إن كان معروضًا — وكلاهما مبنيٌّ من ‎T()‎ */
    renderAcct();
    { const nl = $('#panel-nook-lock'); if (nl && !nl.hidden && window.acNookLock) window.acNookLock(); }
    mkTab.applyTexts();
    mkModal.applyTexts();
    if (selTerm) renderFrame();   /* أسماء مواد الإطار تتبع اللغة أيضًا */
    if (cmCode) fillCourseUI(cmCode);   /* واجهة المادة المفتوحة (نافذة أو مدمجة) تتبع اللغة دون تبديل مضيفها */
    if (wiz) renderWiz();                                             /* المعالج المفتوح يتبع اللغة */
    if (nookEntry && !$('#lib-course').hidden) openNook(nookEntry);   /* وقُمرة المادة كذلك */
    /* ونافذةُ الاستيراد آخِرُ من يُعاد رسمُه: ‎openNook‎ قبلَها تسحب ‎#cm-ui‎ إلى بيتها
       (لأنّها لا تعلم بمُستعيرٍ)، فلو لم تُعِدها ‎jriPaint‎ لَبقيت النافذةُ على جوفٍ خاوٍ */
    { const jm = document.getElementById('jri-modal'); if (jm && !jm.hidden) jriPaint(); }
    /* وألسنةُ النوافذ: أسماؤها تُشتقّ من البطاقة فتتبع لغتها، وتسمياتُها من ‎T()‎ فتتبع
       لغةَ الموقع. وهذا الموضعُ الثالثُ الذي يُجدَّد فيه الاسمُ — ولا رابعَ له */
    cdWins.forEach(w => cdMinFaceSync(w));
    cdMinsSync();
  }

  $('#langbar').addEventListener('click', e => {
    const b = e.target.closest('button[data-lang]'); if (!b) return;
    state.lang = b.dataset.lang;
    save();
    applyLang();
  });

  /* ---------- الثيم: فاتح · داكن (شريط فوق اللغة) ---------- */
  function applyTheme() {
    const th = state.theme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = th;
    document.querySelectorAll('#themebar button').forEach(x =>
      x.classList.toggle('is-active', x.dataset.theme === th));
    /* والنسخةُ تتبع الورقة: تبديلُ الجلد يُعيد صبغَ كلّ صورةٍ لها إعداد */
    flPaintAll(document);
  }
  $('#themebar').addEventListener('click', e => {
    const b = e.target.closest('button[data-theme]'); if (!b) return;
    state.theme = b.dataset.theme;
    save();
    applyTheme();
    /* وتتبعه الورقةُ ما لم تُقطع عنه بزرّها */
    shSkinApply();
  });

  /* ---------- بذرة استعراض: مشاركات مجتمع وهمية لمادة FIN 250 ----------
     تُزرع مرة واحدة (علم seedFin250 في الحالة) — إضافة فقط، لا تمسّ أي بيانات موجودة */
  function seedFin250() {
    if (state.seedFin250) return;
    const code = 'FIN 250';
    const D = 86400000, now = Date.now();
    const mk = (name, days, likes, data) => ({ me: false, u: { name }, likes, liked: false, ts: now - days * D, data });

    postsOf(code, 'info').push(
      mk('محمد العتيبي', 2, 9, {
        desc: 'مادة تأسيس التمويل: القيمة الزمنية للنقود، تقييم الأسهم والسندات، والموازنة الرأسمالية. الفهم فيها أهم من الحفظ — مذاكرتها الفعلية هي حل المسائل.',
        type: 'both', rel: 85,
      }),
      mk('فهد الدوسري', 6, 3, {
        desc: 'تعتمد كثير على الآلة المالية. إذا ضبطت شابتري القيمة الزمنية (5 و6) الباقي يمشي معك.',
        type: 'theory', rel: 70,
      }),
    );

    doctorsOf(code).push(
      {
        name: 'د. خالد باعشن', img: '', posts: [
          mk('عبدالعزيز الغامدي', 1, 11, {
            e: 'kbaeshen@kfupm.edu.sa',
            hours: [{ day: 0, from: '10:00', to: '11:00' }, { day: 2, from: '10:00', to: '11:00' }],
            d: 'شرحه مرتب ويحل أمثلة كثيرة بالمحاضرة، ويرفع ملخصاته قبل الاختبار بأسبوع.',
            teach: 9, grade: 8,
          }),
          mk('ناصر الشمري', 8, 4, {
            e: '', hours: [],
            d: 'اختباراته من السلايدات مباشرة، بس يحسب الحضور بدقة.',
            teach: 8, grade: 9,
          }),
        ],
      },
      {
        name: 'د. سامي الحربي', img: '', posts: [
          mk('يوسف القحطاني', 3, 6, {
            e: 'sharbi@kfupm.edu.sa',
            hours: [{ day: 1, from: '13:00', to: '14:00' }],
            d: 'شرحه سريع شوي — احضر وأنت قارئ الشابتر مسبقًا وبتستفيد.',
            teach: 7, grade: 6,
          }),
        ],
      },
    );

    postsOf(code, 'grade').push(
      mk('تركي المالكي', 4, 14, {
        method: 'std',
        items: [
          { name: 'الاختبار الأول', pct: 20 }, { name: 'الاختبار الثاني', pct: 20 },
          { name: 'النهائي', pct: 35 }, { name: 'الكويزات', pct: 15 },
          { name: 'الواجبات والمشاركة', pct: 10 },
        ],
      }),
      mk('سلطان العنزي', 12, 2, {
        method: 'avg',
        items: [{ name: 'أعمال الفصل', pct: 40 }, { name: 'النهائي', pct: 35 }, { name: 'المشروع', pct: 25 }],
      }),
    );

    postsOf(code, 'abs').push(
      mk('ريان الزهراني', 5, 7, { free: 3, dedFrom: 4, dedAmt: 1, dn: 9, late: 3 }),
      mk('بدر الجهني', 9, 1, { free: 2, dedFrom: 3, dedAmt: 1, dn: 6, late: 4 }),
    );

    postsOf(code, 'srcU').push(
      mk('إبراهيم الحكمي', 2, 10, {
        items: [
          { kind: 'p', t: 'link', name: '', v: 'https://www.youtube.com/results?search_query=FIN+250+time+value+of+money' },
          { kind: 's', t: 'text', name: '', v: 'ملخص الدكتور للشابترات 5–8 يغنيك عن الكتاب — ركّز على جداول القيمة الزمنية.' },
        ],
      }),
    );
    postsOf(code, 'srcP').push(
      mk('ماجد السبيعي', 7, 8, {
        items: [
          { kind: 'p', t: 'text', name: '', v: 'حل آخر ثلاث فاينلات من قروب المادة — الأسئلة تتكرر بصيغ قريبة.' },
          { kind: 's', t: 'link', name: '', v: 'https://quizlet.com/subject/fin-250' },
        ],
      }),
    );

    postsOf(code, 'lessons').push(
      mk('عمر باوزير', 10, 5, {
        items: [
          { num: '1', name: 'مقدمة في الإدارة المالية' },
          { num: '2', name: 'القوائم المالية والتدفق النقدي' },
          { num: '5', name: 'القيمة الزمنية للنقود' },
          { num: '6', name: 'التدفقات النقدية المخصومة' },
          { num: '7', name: 'تقييم السندات' },
          { num: '8', name: 'تقييم الأسهم' },
          { num: '9', name: 'صافي القيمة الحالية ومعايير الاستثمار' },
        ],
      }),
    );

    state.seedFin250 = 1;
    save();
  }

  /* ---------- بذرة استعراض: مادة إحصاء 214 بمساهمات وهمية بصور حسابات (بطلب المستخدم) ----------
     تُزرع مرة واحدة (علم seedStat214) — إضافة فقط، تغطي كل البنود، وكل مساهم له صورة أفاتار */
  function seedStat214() {
    if (state.seedStat214) return;
    const code = 'STAT 214';
    const D = 86400000, now = Date.now();
    /* أفاتار متدرّج بالحرف الأول — يظهر كصورة حساب داخل الدائرة (data URI مستقل) */
    const av = (ini, c1, c2) => 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
      `<rect width='80' height='80' fill='url(#g)'/>` +
      `<text x='40' y='53' font-family='Segoe UI, Tahoma, sans-serif' font-size='34' font-weight='700' fill='#fff' text-anchor='middle'>${ini}</text></svg>`);
    const mk = (name, img, days, likes, data) => ({ me: false, u: { name, img }, likes, liked: false, ts: now - days * D, data });

    postsOf(code, 'info').push(
      mk('سعود المطيري', av('س', '#c0392b', '#e74c3c'), 2, 12, {
        book: 'Business Statistics — Anderson', bookImg: av('BS', '#2e5f34', '#4a8f52'),
        desc: 'مادة الأساليب الإحصائية للأعمال: الإحصاء الوصفي، الاحتمالات، التوزيعات، فترات الثقة، اختبار الفرضيات، والانحدار. تعتمد على Excel وSPSS — الفهم بالتطبيق أهم من الحفظ.',
        type: 'both', rel: 82,
      }),
      mk('عبدالله الشهري', av('ع', '#2980b9', '#3498db'), 5, 6, {
        book: 'الإحصاء التطبيقي للأعمال',
        desc: 'أثقل جزء فيها اختبار الفرضيات والتوزيع الطبيعي — ذاكرها بحل مسائل كثيرة لا بالحفظ.',
        type: 'theory', rel: 68,
      }),
      mk('ريان الحربي', av('ر', '#27ae60', '#2ecc71'), 9, 3, {
        desc: 'خذها مع دكتور يهتم بالتطبيق العملي — الجزء النظري يصير أسهل لما تشوفه على بيانات حقيقية.',
        type: 'practical', rel: 75,
      }),
    );

    doctorsOf(code).push(
      {
        name: 'د. فيصل الرشيد', img: av('ف', '#8e44ad', '#9b59b6'),
        me: true, u: { name: 'أنا' }, ts: now - 9 * D,   /* أنا أضفت هذا الدكتور */
        posts: [
          mk('تركي الغامدي', av('ت', '#d35400', '#e67e22'), 1, 15, {
            e: 'frashid@kfupm.edu.sa',
            hours: [{ day: 0, from: '11:00', to: '12:00' }, { day: 2, from: '11:00', to: '12:00' }],
            teach: 9, grade: 8,
            abs: { free: 2, dedFrom: 3, dedAmt: 1, dn: 6, late: 3 },
            d: 'يشرح بالأمثلة على Excel مباشرة، ويعطي شيتات تدريب أسبوعية — التزم فيها وتضمن الدرجة.',
          }),
          mk('نواف العتيبي', av('ن', '#16a085', '#1abc9c'), 6, 5, {
            e: '', hours: [],
            d: 'اختباراته أطول من الوقت شوي — تمرّن على السرعة بحل الكويزات السابقة.',
            teach: 8, grade: 7,
          }),
        ],
      },
      {
        name: 'د. عبدالرحمن باوزير', img: av('ع', '#2c3e50', '#34495e'),
        me: false, u: { name: 'خالد الشهري', img: av('خ', '#3949ab', '#5c6bc0') }, ts: now - 6 * D,
        posts: [
          mk('ماجد السبيعي', av('م', '#c9a25c', '#d4b673'), 3, 8, {
            e: 'abawazir@kfupm.edu.sa',
            hours: [{ day: 1, from: '09:00', to: '10:30' }],
            teach: 8, grade: 6,
            abs: { free: 3, dedFrom: 0, dedAmt: 0, dn: 5, late: 0 },
            d: 'دقيق في التصحيح، بس شرحه واضح ومنظّم — ملخصاته كافية للاختبار.',
          }),
        ],
      },
    );

    postsOf(code, 'grade').push(
      mk('خالد الزهراني', av('خ', '#d81b60', '#ec407a'), 4, 11, {
        method: 'std',
        items: [
          { name: 'الاختبار الأول', pct: 20 }, { name: 'الاختبار الثاني', pct: 20 },
          { name: 'النهائي', pct: 35 }, { name: 'مشروع SPSS', pct: 15 }, { name: 'الكويزات', pct: 10 },
        ],
      }),
      mk('وليد القحطاني', av('و', '#00897b', '#26a69a'), 11, 2, {
        method: 'avg',
        items: [{ name: 'أعمال الفصل', pct: 45 }, { name: 'النهائي', pct: 35 }, { name: 'المشروع', pct: 20 }],
      }),
    );

    postsOf(code, 'absA').push(
      mk('بندر العنزي', av('ب', '#3949ab', '#5c6bc0'), 5, 7, { free: 3, dedFrom: 4, dedAmt: 1, dn: 9 }),
    );
    postsOf(code, 'absL').push(
      mk('راكان الدوسري', av('ر', '#5d4037', '#795548'), 6, 4, { late: 3 }),
      mk('ياسر الحارثي', av('ي', '#00838f', '#0097a7'), 12, 1, { late: 5 }),
    );

    postsOf(code, 'srcU').push(
      mk('عبدالعزيز المالكي', av('ع', '#6d4c41', '#8d6e63'), 2, 9, {
        items: [
          { kind: 'p', t: 'link', name: '', v: 'https://www.youtube.com/results?search_query=business+statistics+hypothesis+testing' },
          { kind: 's', t: 'text', name: '', v: 'ملخص التوزيع الطبيعي وجدول Z من قروب المادة — احفظ طريقة قراءة الجدول.' },
        ],
      }),
      mk('فهد الشمري', av('ف', '#ad1457', '#d81b60'), 8, 4, {
        items: [{ kind: 'p', t: 'text', name: '', v: 'شاهد سلسلة StatQuest على يوتيوب للانحدار والارتباط — تبسّط المفاهيم بشكل ممتاز.' }],
      }),
    );
    postsOf(code, 'srcP').push(
      mk('سلطان البقمي', av('س', '#00695c', '#00897b'), 7, 6, {
        items: [
          { kind: 'p', t: 'text', name: '', v: 'حل فاينلات آخر ثلاث ترمات — الأسئلة تتكرر بصيغ قريبة خصوصًا فترات الثقة.' },
          { kind: 's', t: 'link', name: '', v: 'https://quizlet.com/subject/business-statistics' },
        ],
      }),
    );

    postsOf(code, 'lessons').push(
      mk('عمر باعشن', av('ع', '#283593', '#3949ab'), 10, 5, {
        items: [
          { num: '1', name: 'مقدمة في الإحصاء والبيانات' },
          { num: '2', name: 'الإحصاء الوصفي ومقاييس النزعة المركزية' },
          { num: '3', name: 'الاحتمالات' },
          { num: '4', name: 'التوزيعات الاحتمالية المنفصلة' },
          { num: '5', name: 'التوزيع الطبيعي' },
          { num: '6', name: 'توزيعات المعاينة' },
          { num: '7', name: 'فترات الثقة' },
          { num: '8', name: 'اختبار الفرضيات' },
          { num: '9', name: 'الانحدار والارتباط' },
        ],
      }),
    );

    state.seedStat214 = 1;
    save();
  }

  /* ---------- عيّنات كومنتات إضافية لمادة STAT 214 (طويلة وقصيرة) لتقييم شكل المساهمة ----------
     تُزرع مرة واحدة بعلَم مستقل — إضافة فقط، لا تمسّ الموجود */
  function seedStat214Demo2() {
    if (state.seedStat214Demo2) return;
    const code = 'STAT 214';
    const D = 86400000, now = Date.now();
    const av = (ini, c1, c2) => 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
      `<rect width='80' height='80' fill='url(#g)'/>` +
      `<text x='40' y='53' font-family='Segoe UI, Tahoma, sans-serif' font-size='34' font-weight='700' fill='#fff' text-anchor='middle'>${ini}</text></svg>`);
    const mk = (name, img, days, likes, dislikes, data) => ({ me: false, u: { name, img }, likes, liked: false, dislikes, disliked: false, ts: now - days * D, data });

    postsOf(code, 'info').push(
      /* ===== كومنتات طويلة (تُقصّ ويظهر لها سهم التوسيع) ===== */
      mk('منيرة القحطاني', av('م', '#6a1b9a', '#8e24aa'), 1, 24, 2, {
        book: 'Statistics for Business and Economics', bookImg: av('SBE', '#1565c0', '#42a5f5'),
        lang: 'en', type: 'both', rel: 88,
        desc: 'من أهم المواد اللي بتفيدك في التخصص والحياة العملية إذا فهمتها صح. الكورس يبدأ سهل مع الإحصاء الوصفي (المتوسط والوسيط والانحراف المعياري) وبعدها يتدرّج للاحتمالات والتوزيعات. أصعب جزء عند أغلب الطلاب هو اختبار الفرضيات وفترات الثقة لأنها تحتاج فهمًا لا حفظًا. نصيحتي: لا تؤجّل الفهم لأن كل موضوع يبني على اللي قبله، وحل مسائل كثيرة من الكتاب ومن الفاينلات السابقة، وتأكد إنك عارف متى تستخدم Z ومتى تستخدم t. المشروع العملي على SPSS ممتع وسهل الدرجة إذا التزمت بالخطوات فلا تفرّط فيه. بالتوفيق للجميع.',
      }),
      mk('طلال العمري', av('ط', '#00695c', '#26a69a'), 3, 18, 1, {
        book: 'الإحصاء في إدارة الأعمال', lang: 'ar', type: 'theory', rel: 79,
        desc: 'خذيت المادة الترم الماضي وكانت من أمتع المواد لو دخلتها بعقلية صحيحة. الغلط اللي يسويه أغلب الطلاب إنهم يتعاملون معها كمادة حفظ، وهي بالعكس مادة فهم وتطبيق. الاختبارات تركّز على تحليل المسائل: يعطونك موقفًا وأنت تحدد أي أسلوب إحصائي يناسبه، ولو ضبطت هالمهارة تضمن الدرجة. ركّز على التوزيع الطبيعي وتوزيع t لأنهما أساس نصف المنهج وخصوصًا كيف تقرأ الجداول. والدكتور يفرق كثيرًا فدوّر على واحد يشرح بأمثلة واقعية.',
      }),
      /* ===== كومنتات قصيرة (بلا سهم توسيع) ===== */
      mk('حسن الزهراني', av('ح', '#c62828', '#ef5350'), 2, 9, 0, {
        type: 'practical', rel: 72,
        desc: 'مادة حلوة وعملية، أهم شي تحضر المحاضرات وتحل الواجبات بنفسك.',
      }),
      mk('نورة الدوسري', av('ن', '#00838f', '#26c6da'), 4, 5, 0, {
        book: 'OpenIntro Statistics', bookImg: av('OI', '#37474f', '#607d8b'), lang: 'en', rel: 64,
        desc: 'الكتاب مجاني وممتاز، حمّله من موقع OpenIntro.',
      }),
      mk('فارس الشمراني', av('ف', '#f9a825', '#fbc02d'), 7, 3, 1, {
        type: 'both', rel: 55,
        desc: 'صعبة شوي بالبداية بس تسهل مع الوقت.',
      }),
    );

    state.seedStat214Demo2 = 1;
    save();
  }

  /* ---------- عيّنات كومنتات «الدكاترة» لمادة STAT 214 — نصوص طويلة وحالات ناقصة ----------
     غرضها اختبار شكل المساهمة المنشورة: القصّ وسهم التوسيع الإنلاين، ورصّ الصفوف
     حين تنقص شارات (لا تُرسم الفارغة). تُزرع مرة واحدة بعلَم مستقل — إضافة فقط */
  function seedStat214DocLong() {
    if (state.seedStat214DocLong) return;
    const code = 'STAT 214';
    const D = 86400000, now = Date.now();
    const av = (ini, c1, c2) => 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
      `<rect width='80' height='80' fill='url(#g)'/>` +
      `<text x='40' y='53' font-family='Segoe UI, Tahoma, sans-serif' font-size='34' font-weight='700' fill='#fff' text-anchor='middle'>${ini}</text></svg>`);
    const mk = (name, img, days, likes, dislikes, data) => ({ me: false, u: { name, img }, likes, liked: false, dislikes, disliked: false, ts: now - days * D, data });

    const drs = doctorsOf(code);
    const byName = n => drs.find(x => x.name === n);
    const faisal = byName('د. فيصل الرشيد'), bawazir = byName('د. عبدالرحمن باوزير');

    /* ١) مساهمة كاملة الحقول + نصّ طويل جدًّا — صفّان من الشارات ثم أسطر كاملة العرض */
    if (faisal) faisal.posts.push(
      mk('بندر الشهراني', av('ب', '#1e88e5', '#42a5f5'), 2, 21, 1, {
        e: 'frashid@kfupm.edu.sa',
        hours: [{ day: 0, from: '10:00', to: '11:30' }, { day: 2, from: '13:00', to: '14:00' }, { day: 4, from: '09:00', to: '10:00' }],
        bld: '24', room: '112',
        teach: 9, grade: 8,
        abs: { free: 3, dedFrom: 4, dedAmt: 2, dn: 6, late: 3 },
        d: 'أخذته ترمين متتاليين وأقدر أقول إنه من أفضل من يشرح هذي المادة في القسم. يبدأ المحاضرة بمراجعة سريعة للي قبلها ثم يدخل في مثال واقعي من بيانات شركة حقيقية، وهذا يخلّي الفكرة تثبت بدل ما تكون مجرد قانون تحفظه. ساعاته المكتبية فعليّة ويجلس معك لين تفهم، ولو ما لحقت عليها يرد على الإيميل خلال يوم. الاختبارات متوسطة الصعوبة وتشبه أمثلة المحاضرة لكنه يغيّر السياق، فلا تحفظ الحل احفظ الطريقة. ينبّه على الغياب من أول أسبوع ويلتزم بالخصم حرفيًّا فلا تجرّب حظك. أنصح بأخذه لو تبي تفهم المادة فعلًا لا تعديها فقط.',
      }),
      /* ٢) ناقصة عمدًا (بلا إيميل ولا ساعات ولا مكتب) + نصّ طويل — لاختبار رصّ الصفوف */
      mk('عمر الحارثي', av('ع', '#6d4c41', '#8d6e63'), 5, 12, 0, {
        teach: 7, grade: 9,
        abs: { free: 2, dedFrom: 0, dedAmt: 0, dn: 5, late: 0 },
        d: 'ما تعاملت معه خارج المحاضرة فما أقدر أحكم على ساعاته المكتبية، لكن من ناحية الدرجات هو من أكرم الدكاترة اللي مرّوا عليّ: يعطي درجات مشاركة وحضور وبونص على الواجبات المسلّمة قبل موعدها. شرحه سريع شوي في الأسابيع الأخيرة لأنه يحاول يلحق المنهج، فلا تعتمد عليه وحده في آخر فصلين واقرأ الكتاب معه. الفاينل عنده طويل ويحتاج إدارة وقت.',
      }),
    );

    /* ٣) نصّ طويل بلا أي شارة — لاختبار المساهمة النصّية البحتة */
    if (bawazir) bawazir.posts.push(
      mk('سلطان القرني', av('س', '#455a64', '#607d8b'), 8, 7, 2, {
        d: 'انطباعي عنه مختلط: من ناحية التنظيم ممتاز، الشرائح مرتّبة والملخصات كافية والاختبارات واضحة الصياغة بلا ألغاز. لكنه يمشي على وتيرة واحدة سواء فهم الطلاب أو لا، وإذا سألته سؤالًا خارج الشريحة يأجّله للساعات المكتبية. لو أنت طالب يذاكر أولًا بأول بيناسبك جدًا، أما لو تعتمد على الشرح داخل القاعة فقط فبتتعب معه في نصف المنهج الثاني تحديدًا في الانحدار وتحليل التباين.',
      }),
      /* ٤) قصيرة بشارات كاملة — للمقارنة (بلا سهم توسيع) */
      mk('فهد المالكي', av('ف', '#00695c', '#26a69a'), 10, 4, 0, {
        e: 'abawazir@kfupm.edu.sa',
        hours: [{ day: 1, from: '12:00', to: '13:00' }],
        bld: '24', room: '208',
        teach: 8, grade: 7,
        abs: { free: 3, dedFrom: 5, dedAmt: 1, dn: 6, late: 4 },
        d: 'منظّم وواضح، وملخصاته تكفي للاختبار.',
      }),
    );

    state.seedStat214DocLong = 1;
    save();
  }

  /* ---------- بذرة عرض «البطائق» (ROADMAP-CARDS): مساهمات وهمية بشجرة مجلدات متداخلة ----------
     تُبنى على قوائم المواضيع المزروعة (إحصاء 214 + مالية 250) وتُزرع مرة واحدة — إضافة فقط */
  function seedCardsDemo() {
    if (state.seedCardsDemo) return;
    const D = 86400000, now = Date.now();
    const av = (ini, c1, c2) => 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
      `<rect width='80' height='80' fill='url(#g)'/>` +
      `<text x='40' y='53' font-family='Segoe UI, Tahoma, sans-serif' font-size='34' font-weight='700' fill='#fff' text-anchor='middle'>${ini}</text></svg>`);
    const c = (f, b) => ({ id: newId(), t: 'c', f, b });
    const fl = (name, ch) => ({ id: newId(), t: 'f', name, open: true, ch });
    const mk = (name, img, days, likes, data) => ({ id: newId(), me: false, u: img ? { name, img } : { name }, likes, liked: false, ts: now - days * D, data });
    const listOf = code => postsOf(code, 'lessons').find(p => (p.data.items || []).length);

    /* إحصاء 214: مساهمان على قائمة عمر باعشن — يُظهران العدسات الثلاث والعدّادات والتداخل */
    const sL = listOf('STAT 214');
    if (sL) postsOf('STAT 214', 'cards').push(
      mk('هشام العمري', av('هـ', '#1565c0', '#1e88e5'), 3, 14, { listId: sL.id, decks: {
        0: [
          c('عرّف الإحصاء الوصفي', 'تلخيص البيانات وعرضها بجداول ومقاييس ورسوم، دون تعميم النتائج على المجتمع.'),
          c('ما الفرق بين المجتمع والعينة؟', 'المجتمع: كل المفردات محل الدراسة. العينة: جزء يُختار لتمثيله وتُعمَّم نتائجه عليه.'),
        ],
        1: [
          fl('مقاييس النزعة المركزية', [
            c('الوسط الحسابي؟', 'مجموع القيم ÷ عددها — يتأثر بالقيم المتطرفة.'),
            c('الوسيط؟', 'القيمة الوسطى بعد الترتيب — لا يتأثر بالقيم المتطرفة.'),
            c('المنوال؟', 'أكثر قيمة تكرارًا — قد يتعدد أو لا يوجد.'),
          ]),
          fl('مقاييس التشتت', [
            c('الانحراف المعياري؟', 'الجذر التربيعي للتباين — متوسط بُعد القيم عن وسطها.'),
            c('المدى؟', 'أكبر قيمة − أصغر قيمة. أبسط المقاييس وأكثرها تأثرًا بالتطرف.'),
            fl('تمارين', [
              c('بيانات: 2، 4، 4، 6 — احسب الوسط والانحراف المعياري', 'الوسط = 4 · الانحراف المعياري (مجتمع) = √2 ≈ 1.41'),
            ]),
          ]),
        ],
        4: [
          c('خصائص التوزيع الطبيعي؟', 'جرسي متماثل حول المتوسط، المتوسط = الوسيط = المنوال، والمساحة الكلية تحته = 1.'),
          c('قاعدة 68-95-99.7؟', '68% من القيم ضمن انحراف معياري واحد، 95% ضمن اثنين، 99.7% ضمن ثلاثة.'),
        ],
      } }),
      mk('سامي الجهني', av('س', '#6a1b9a', '#8e24aa'), 8, 6, { listId: sL.id, decks: {
        1: [c('متى نفضّل الوسيط على الوسط الحسابي؟', 'عند وجود قيم متطرفة أو التواء واضح في التوزيع.')],
        7: [
          fl('مفاهيم أساسية', [
            c('ما الفرضية الصفرية H0؟', 'الفرضية المفترض صحتها ابتداءً، ولا تُرفض إلا بدليل إحصائي كافٍ.'),
            c('الخطأ من النوع الأول والثاني؟', 'الأول: رفض H0 وهي صحيحة (α). الثاني: عدم رفض H0 وهي خاطئة (β).'),
            c('قيمة p؟', 'احتمال نتيجة بحدة العينة أو أشد بافتراض صحة H0 — إن قلّت عن α نرفض H0.'),
          ]),
        ],
      } }),
    );

    /* مالية 250: مساهم واحد على قائمة عمر باوزير (بلا صورة — كنمط بذرة المادة) */
    const fL = listOf('FIN 250');
    if (fL) postsOf('FIN 250', 'cards').push(
      mk('ناصر الحقباني', null, 5, 10, { listId: fL.id, decks: {
        0: [
          c('ما الهدف الأساسي للإدارة المالية؟', 'تعظيم ثروة الملاك (القيمة السوقية للسهم) لا مجرد تعظيم الربح.'),
          c('قرارات المدير المالي الثلاثة؟', 'الاستثمار (الموازنة الرأسمالية) · التمويل (هيكل رأس المال) · إدارة رأس المال العامل.'),
        ],
        1: [
          fl('القوائم الأساسية', [
            c('الميزانية العمومية؟', 'لقطة لأصول المنشأة والتزاماتها وحقوق ملكيتها عند تاريخ محدد.'),
            c('قائمة الدخل؟', 'الإيرادات والمصروفات ونتيجة النشاط خلال فترة.'),
            c('قائمة التدفقات النقدية؟', 'حركة النقد تشغيليًا واستثماريًا وتمويليًا خلال الفترة.'),
          ]),
        ],
      } }),
    );

    state.seedCardsDemo = 1;
    save();
  }

  /* ---------- بذرة عرض «الشروح» (تحول الرزم): مجموعات فيديو حرة بعناوين ومدد ----------
     روابط يوتيوب (النموذج العملي — الملفات محدودة بالسعة) · تُزرع مرة واحدة، إضافة فقط */
  function seedVidsDemo() {
    if (state.seedVidsDemo) return;
    const D = 86400000, now = Date.now();
    const av = (ini, c1, c2) => 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
      `<rect width='80' height='80' fill='url(#g)'/>` +
      `<text x='40' y='53' font-family='Segoe UI, Tahoma, sans-serif' font-size='34' font-weight='700' fill='#fff' text-anchor='middle'>${ini}</text></svg>`);
    const mkv = (name, img, days, likes, vids) =>
      ({ id: newId(), me: false, u: img ? { name, img } : { name }, likes, liked: false, ts: now - days * D, data: { vids } });
    const L = (name, v, dur) => ({ t: 'link', name, v, dur });

    postsOf('STAT 214', 'videos').push(
      mkv('طارق الشهراني', av('ط', '#00695c', '#00897b'), 2, 18, [
        L('1. مقدمة وأنواع البيانات', 'https://www.youtube.com/results?search_query=introduction+to+statistics+data+types', '12:40'),
        L('2. مقاييس النزعة المركزية', 'https://www.youtube.com/results?search_query=mean+median+mode+explained', '18:05'),
        L('3. مقاييس التشتت والانحراف المعياري', 'https://www.youtube.com/results?search_query=standard+deviation+variance', '15:30'),
        L('4. التوزيع الطبيعي وقاعدة Z', 'https://www.youtube.com/results?search_query=normal+distribution+z+score', '21:12'),
        L('5. اختبار الفرضيات خطوة بخطوة', 'https://www.youtube.com/results?search_query=hypothesis+testing+step+by+step', '24:45'),
      ]),
      mkv('يوسف الغامدي', av('ي', '#8e44ad', '#9b59b6'), 7, 7, [
        L('حل فاينل 231 كامل', 'https://www.youtube.com/results?search_query=business+statistics+final+exam+solutions', '41:20'),
        L('حل فاينل 232 كامل', 'https://www.youtube.com/results?search_query=statistics+final+exam+review', '38:05'),
      ]),
    );
    postsOf('FIN 250', 'videos').push(
      mkv('إبراهيم الحكمي', null, 4, 12, [
        L('القيمة الزمنية للنقود — شرح شامل', 'https://www.youtube.com/results?search_query=time+value+of+money+explained', '19:30'),
        L('حل مسائل TVM من الكتاب', 'https://www.youtube.com/results?search_query=time+value+of+money+problems', '16:10'),
      ]),
    );

    state.seedVidsDemo = 1;
    save();
  }

  /* تنظيف مرة واحدة (بطلب المستخدم): حذف الصور المرفوعة يدويًا لمواد الإنجليزي و«اسلامي 212»
     لتظهر بالغلاف البديل الملوّن. يعمل مرة على متصفح المستخدم ثم يُقفل بعلمٍ في الحالة. */
  function clearUploads261() {
    if (state.clearUploads261) return;
    ['ENGL 101', 'ENGL 102', 'ENGL 214', 'IAS 212'].forEach(code => { delete state.imgs[code]; });
    state.clearUploads261 = 1;
    save();
  }

  /* ---------- تنظيف لمرة واحدة: حذف كل المساهمات القائمة (بطلب الأدمن) ----------
     يشمل كل قنوات كل المواد ومساهمات الدكاترة — وتبقى هويات الدكاترة (وسوم الأدمن) كما هي.
     وبذور العرض القديمة أُوقفت أدناه فلا تعود */
  if (!state.wipePosts1) {
    Object.keys(state.cinfo || {}).forEach(code => {
      const info = state.cinfo[code] || {};
      if (info.posts) Object.keys(info.posts).forEach(sec => { info.posts[sec] = []; });
      (info.doctors || []).forEach(dr => { dr.posts = []; });
    });
    state.wipePosts1 = 1;
    save();
  }

  /* ---------- بذرة «أكاديميا»: مساهمة في بند «المادة» تحمل غلاف الكتاب ----------
     لكل مادة لها غلاف — سواء غلاف المستودع في covers/ أو غلاف رفعته يدويًّا (state.imgs) —
     المساهمة صورة الغلاف فقط بلا نصّ ولا تقييم. تُزرع مرّة واحدة ولا تتكرّر لمادة زُرعت */
  function seedCoverPosts() {
    if (state.seedCovers3) return;
    const now = Date.now();
    const codes = new Set([
      ...Object.keys(typeof COVERS !== 'undefined' ? COVERS : {}),
      ...Object.keys(state.imgs || {}).map(baseOf),   /* المرفوعة يدويًّا */
    ]);
    /* مادة اللاب خيطان منفصلان (محاضرة · معمل)، ولكلٍّ مساهماته — فيأخذ كلٌّ نسخته بغلاف المادة */
    const targets = [];
    codes.forEach(code => {
      if (!CM[code]) return;                       /* مادة غير موجودة في الكتالوج */
      targets.push(code);
      if (isLab(code) && CM[labKey(code)]) targets.push(labKey(code));
    });
    /* المسار يُخزَّن خامًا («covers/…») لا محلولًا بحسب الصفحة — والحلّ يقع وقت العرض في imgOf */
    const rawCover = k => state.imgs[k] || state.imgs[baseOf(k)]
      || (typeof COVERS !== 'undefined' && (COVERS[k] || COVERS[baseOf(k)])) || '';
    targets.forEach(key => {
      const img = rawCover(key); if (!img) return;
      const arr = coursePosts(key).info;
      if (arr.some(p => p.u && p.u.name === T().siteName)) return;   /* لا تكرار */
      arr.push({
        id: newId(), me: false, u: { name: T().siteName },
        likes: 0, liked: false, dislikes: 0, disliked: false, ts: now,
        pin: 1,                                     /* غلاف «أكاديميا» مثبَّت فيتصدّر بنده */
        /* ===== ومنشورةٌ لا مضمرة =====
           غلافُ الكتاب خبرٌ عن المادّة يراه الناسُ كلُّهم، لا شيءٌ يخصّ متصفّحًا
           واحدًا. وكان يُكتب بلا حالِ نشرٍ فيبقى في الدرج ولا يبلغ الخادمَ أبدًا
           (والدفعُ لا يرفع إلّا ما ‎st === 'pub'‎). فيُولد منشورًا. */
        st: 'pub',
        data: { book: '', bookImg: img },
      });
    });
    state.seedCovers1 = state.seedCovers2 = state.seedCovers3 = 1;
    save();
  }

  /* تثبيت أغلفة «أكاديميا» المزروعة سابقًا (قبل أن يصير التثبيت جزءًا من البذرة).
     الاسم يُطابَق باللغتين لأن البذرة تحمل اسم الموقع بلغة وقت الزرع */
  function pinCoverPosts() {
    if (state.pinCovers1) return;
    const SITE = ['أكاديميا', 'academia'];
    Object.keys(state.cinfo || {}).forEach(code => {
      const arr = ((state.cinfo[code] || {}).posts || {}).info || [];
      arr.forEach(p => {
        if (p && p.u && SITE.indexOf(p.u.name) > -1 && p.data && p.data.bookImg) p.pin = 1;
      });
    });
    state.pinCovers1 = 1;
    save();
  }

  /* ---------- عيّنات عرض لمادة «اسلامي 111» (العقيدة وأثرها) ----------
     عشر مساهمات في كل بند، متفاوتة الكثافة: منها الغنيّة المكتملة ومنها السطر الواحد،
     كي يُختبر شكل البطاقة في كل الحالات. تُزرع مرة واحدة بعلَم مستقل — إضافة فقط */
  function seedIAS111Demo() {
    if (state.seedIAS111) return;
    const code = 'IAS 111';
    if (!CM[code]) return;   /* المادة غير موجودة في الكتالوج */
    const D = 86400000, now = Date.now();
    const av = (ini, c1, c2) => 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
      `<rect width='80' height='80' fill='url(#g)'/>` +
      `<text x='40' y='53' font-family='Segoe UI, Tahoma, sans-serif' font-size='34' font-weight='700' fill='#fff' text-anchor='middle'>${ini}</text></svg>`);
    /* مساهِمو العيّنة: الاسم وصورته ثابتان لكل شخص فتتكرّر هويته عبر البنود */
    const U = {
      a: ['عبدالرحمن الغامدي', av('ع', '#2e7d32', '#66bb6a')],
      b: ['سلمان الحربي', av('س', '#1565c0', '#42a5f5')],
      c: ['نواف العتيبي', av('ن', '#6a1b9a', '#ab47bc')],
      d: ['ريان الشهري', av('ر', '#00695c', '#26a69a')],
      e: ['خالد الدوسري', av('خ', '#c62828', '#ef5350')],
      f: ['ماجد القرني', av('م', '#f9a825', '#fdd835')],
      g: ['يزيد المطيري', av('ي', '#37474f', '#78909c')],
      h: ['تركي الزهراني', av('ت', '#00838f', '#26c6da')],
      i: ['فيصل السبيعي', av('ف', '#4527a0', '#7e57c2')],
      j: ['بندر العنزي', av('ب', '#ad1457', '#ec407a')],
    };
    const mk = (k, days, likes, dislikes, data) =>
      ({ id: newId(), me: false, u: { name: U[k][0], img: U[k][1] }, likes, liked: false, dislikes, disliked: false, ts: now - days * D, data });
    const nd = o => Object.assign({ id: newId() }, o);   /* عقدة شجرة بمعرّف */

    /* ===== ١) المادة ===== */
    postsOf(code, 'info').push(
      mk('a', 1, 26, 1, {
        book: 'العقيدة الإسلامية وأثرها في بناء الفرد والمجتمع', lang: 'ar', type: 'theory', rel: 45,
        desc: 'مادة متطلب جامعة لكنها من أنفع ما أخذت. المنهج يبدأ بتعريف العقيدة ومصادرها ثم أركان الإيمان الستة بالتفصيل، وينتهي بأثر العقيدة في سلوك الفرد وبناء المجتمع. الاختبارات مقالية غالبًا: يطلب منك تعريفًا ثم تعليلًا ثم مثالًا تطبيقيًّا، فالحفظ وحده لا يكفي — لازم تفهم الفكرة وتقدر تصوغها بأسلوبك. أنصحك تلخّص كل محاضرة في صفحة واحدة أول بأول لأن المادة تراكمية والملزمة تكبر بسرعة. ومن يقرأ الملزمة قراءة فاهمة مرتين قبل الاختبار يضمن الدرجة بإذن الله.',
      }),
      mk('b', 3, 17, 0, {
        book: 'ملزمة القسم — العقيدة وأثرها', lang: 'ar', type: 'theory', rel: 30,
        desc: 'المصدر المعتمد في الاختبار هو ملزمة القسم لا غير، وأي كتاب خارجي للاستزادة فقط. المادة سهلة إذا نظّمت وقتك: خصّص لها ساعة أسبوعيًّا فقط ولا تتركها للأسبوع الأخير لأن الأسئلة تفصيلية وتحتاج استحضارًا للأدلة.',
      }),
      mk('c', 5, 12, 2, {
        lang: 'ar', type: 'theory', rel: 20,
        desc: 'ما تحتاج تشتري شيئًا، الملزمة كافية وموجودة PDF في قروب الدفعة. ركّز على أركان الإيمان ونواقض التوحيد فهي محور أغلب الأسئلة.',
      }),
      mk('d', 6, 9, 0, {
        book: 'العقيدة وأثرها', bookImg: '', lang: 'ar', rel: 25,
        desc: 'مادة هادئة تعوّض بها معدلك، بس لا تستهين فيها لأن أسئلتها تفصيلية.',
      }),
      mk('e', 8, 7, 1, { type: 'theory', rel: 35, desc: 'حفظ وفهم أكثر منها حسابات — من يحضر المحاضرات يرتاح.' }),
      mk('f', 10, 5, 0, { lang: 'ar', desc: 'الملزمة ٩ فصول، وكل فصل ورقتين تقريبًا.' }),
      mk('g', 12, 4, 0, { desc: 'مادتين ساعة، والحضور مهم.' }),
      mk('h', 15, 3, 1, { book: 'شرح الأصول الثلاثة (مرجع إثرائي)', lang: 'ar' }),
      mk('i', 18, 2, 0, { type: 'theory', rel: 15 }),
      mk('j', 22, 1, 0, { desc: 'سهلة.' }),
    );

    /* ===== ٢) الدكاترة: أربعة دكاترة وعشر مساهمات موزّعة عليهم ===== */
    const dr = (name, img, posts) => ({ id: newId(), name, img, me: false, u: { name: T().siteName }, ts: now - 30 * D, posts });
    doctorsOf(code).push(
      dr('د. عبدالله المطيري', av('ع', '#1b5e20', '#43a047'), [
        mk('a', 2, 21, 0, {
          e: 'amutairi@kfupm.edu.sa', bld: '19', room: '206',
          hours: [{ day: 0, from: '10:00', to: '11:00' }, { day: 2, from: '12:00', to: '13:00' }],
          teach: 9, grade: 9,
          d: 'من أفضل من درّس لي في الجامعة. يشرح بأمثلة من الواقع ولا يقرأ من السلايد، ويفتح باب النقاش في المحاضرة بأدب واحترام. أسئلته في الاختبار من المحاضرة نفسها ولا يخرج عن الملزمة أبدًا، ويعطي أسئلة مراجعة قبل كل اختبار. تصحيحه كريم جدًّا: يعطيك درجة على الفكرة حتى لو صياغتك ناقصة، ولا يدقّق على الشكل. لو تقدر تسجّل عنده لا تفوّت الفرصة.',
        }),
        mk('c', 7, 13, 1, {
          e: 'amutairi@kfupm.edu.sa', hours: [{ day: 1, from: '11:00', to: '12:00' }], teach: 8, grade: 9,
          d: 'يهتم بالحضور ويناديك باسمك من الأسبوع الثاني. مشاركتك في المحاضرة تنفعك في درجة الأعمال.',
        }),
        mk('g', 14, 6, 0, { teach: 9, grade: 8, d: 'محترم ويحترم وقت الطالب، ينهي المحاضرة في وقتها.' }),
      ]),
      dr('د. سعود الشمري', av('س', '#0d47a1', '#1e88e5'), [
        mk('b', 4, 15, 2, {
          e: 'sshamri@kfupm.edu.sa', bld: '19', room: '114',
          hours: [{ day: 3, from: '09:00', to: '10:00' }],
          teach: 7, grade: 6,
          d: 'شرحه جيد لكنه سريع، ويعتمد على أنك قرأت الفصل قبل المحاضرة. تصحيحه دقيق ويحاسب على الصياغة، فاكتب إجابتك بنقاط مرتبة وبأسلوب المنهج لا بأسلوبك العامي.',
        }),
        mk('d', 9, 8, 1, { hours: [{ day: 0, from: '13:00', to: '14:00' }, { day: 4, from: '13:00', to: '14:00' }], teach: 7, grade: 6 }),
        mk('h', 16, 4, 0, { d: 'يحب الأمثلة المعاصرة، وأسئلته تربط العقيدة بالواقع.' }),
      ]),
      dr('د. ماجد العمري', av('م', '#4e342e', '#8d6e63'), [
        mk('e', 6, 11, 0, {
          e: 'malamri@kfupm.edu.sa', bld: '19', room: '301', teach: 8, grade: 7,
          d: 'هادئ وواضح، يعطي ملخصًا مكتوبًا آخر كل فصل. لا يقبل التأخير عن المحاضرة إطلاقًا.',
        }),
        mk('i', 20, 3, 0, { e: 'malamri@kfupm.edu.sa', teach: 8 }),
      ]),
      dr('د. فهد القحطاني', av('ف', '#880e4f', '#d81b60'), [
        mk('f', 11, 6, 1, { hours: [{ day: 2, from: '10:00', to: '11:30' }], teach: 6, grade: 8, d: 'تصحيحه كريم لكن شرحه يحتاج تركيزًا.' }),
        mk('j', 25, 2, 0, { teach: 6 }),
      ]),
    );

    /* ===== ٣) الغياب والتأخير ===== */
    postsOf(code, 'abs').push(
      mk('a', 2, 19, 0, { free: 3, dedFrom: 4, dedAmt: 1, dn: 6, late: 3 }),
      mk('b', 4, 14, 1, { free: 2, dedFrom: 3, dedAmt: 1, dn: 6, late: 3 }),
      mk('c', 5, 11, 0, { free: 3, dedFrom: 4, dedAmt: 2, dn: 7, late: 2 }),
      mk('d', 7, 9, 1, { free: 2, dedFrom: 3, dedAmt: 1, dn: 6, late: 4 }),
      mk('e', 9, 7, 0, { free: 3, dn: 6, late: 3 }),
      mk('f', 11, 5, 0, { free: 2, dedFrom: 3, dedAmt: 1 }),
      mk('g', 13, 4, 1, { free: 3, dn: 6 }),
      mk('h', 17, 3, 0, { late: 3 }),
      mk('i', 21, 2, 0, { free: 2 }),
      mk('j', 26, 1, 0, { dn: 6 }),
    );

    /* ===== ٤) توزيع الدرجات ===== */
    postsOf(code, 'grade').push(
      mk('a', 1, 23, 0, { method: 'std', items: [
        { name: 'الاختبار الأول', pct: 20 }, { name: 'الاختبار الثاني', pct: 20 },
        { name: 'النهائي', pct: 40 }, { name: 'البحث القصير', pct: 10 }, { name: 'الحضور والمشاركة', pct: 10 },
      ] }),
      mk('b', 3, 16, 1, { method: 'std', items: [
        { name: 'أعمال الفصل', pct: 30 }, { name: 'الواجبات', pct: 10 }, { name: 'النهائي', pct: 40 }, { name: 'البحث', pct: 20 },
      ] }),
      mk('c', 5, 12, 0, { method: 'avg', items: [
        { name: 'اختبارات دورية', pct: 40 }, { name: 'النهائي', pct: 40 }, { name: 'المشاركة', pct: 20 },
      ] }),
      mk('d', 6, 10, 1, { method: 'std', items: [
        { name: 'الاختبار الأول', pct: 25 }, { name: 'الاختبار الثاني', pct: 25 }, { name: 'النهائي', pct: 50 },
      ] }),
      mk('e', 8, 8, 0, { method: 'avg', items: [{ name: 'أعمال الفصل', pct: 60 }, { name: 'النهائي', pct: 40 }] }),
      mk('f', 10, 6, 0, { method: 'std', items: [{ name: 'النهائي', pct: 40 }, { name: 'البحث', pct: 20 }, { name: 'اختبار منتصف', pct: 40 }] }),
      mk('g', 12, 5, 1, { method: 'avg', items: [{ name: 'اختبارات', pct: 50 }, { name: 'النهائي', pct: 50 }] }),
      mk('h', 16, 3, 0, { method: 'avg', items: [{ name: 'النهائي', pct: 40 }] }),
      mk('i', 19, 2, 0, { method: 'std', items: [{ name: 'أعمال الفصل', pct: 60 }] }),
      mk('j', 24, 1, 0, { method: 'avg', items: [] }),
    );

    /* ===== ٥) مصادر الفهم ===== */
    const fid1 = newId(), fid2 = newId(), fid3 = newId();
    postsOf(code, 'srcU').push(
      mk('a', 2, 20, 0, {
        html: 'أفضل ترتيب للمذاكرة: اقرأ الملزمة قراءة سريعة أولًا، ثم شاهد شرح الفصل، ثم ارجع للملزمة بقلم التظليل.<br>هذي ملخصاتي المكتوبة لكل الفصول التسعة، وفيها الأدلة مرتّبة تحت كل مسألة:' +
              `<span class="src-fchip" data-fid="${fid1}" contenteditable="false"></span>`,
        files: { [fid1]: { name: 'ملخص-العقيدة-كامل.txt', v: 'data:text/plain;charset=utf-8,' + encodeURIComponent('ملخص مادة العقيدة وأثرها — عيّنة عرض'), kind: 'p' } },
      }),
      mk('b', 4, 15, 1, {
        html: 'قناة الدكتور على يوتيوب فيها شرح الفصول الأربعة الأولى بأسلوب مبسّط جدًّا، وتغنيك عن حضور المراجعة.<br>ابحث عن: «شرح مقرر العقيدة وأثرها — جامعة الملك فهد».',
        files: {},
      }),
      mk('c', 6, 11, 0, {
        html: 'خرائط ذهنية لأركان الإيمان الستة — صفحة واحدة لكل ركن:' +
              `<span class="src-fchip" data-fid="${fid2}" contenteditable="false"></span>`,
        files: { [fid2]: { name: 'خرائط-أركان-الإيمان.txt', v: 'data:text/plain;charset=utf-8,' + encodeURIComponent('خرائط ذهنية — عيّنة عرض'), kind: 'p' } },
      }),
      mk('d', 7, 9, 1, { html: 'كتاب «الأصول الثلاثة» بشرح مبسّط يفيدك في الفصل الثاني والثالث، وهو صغير تقرأه في جلسة.', files: {} }),
      mk('e', 9, 7, 0, { html: 'سجّل المحاضرة صوتيًّا واسمعها في الطريق — المادة كلامية وتنفع للسمع أكثر من القراءة.', files: {} }),
      mk('f', 11, 6, 0, { html: 'ملخّص الأسبوع الأخير في قروب الدفعة ممتاز، خمس صفحات تغطي المنهج كله.', files: {} }),
      mk('g', 13, 4, 1, { html: 'اقرأ الملزمة بصوت مسموع، تثبت أسرع.', files: {} }),
      mk('h', 15, 3, 0, {
        html: 'أسئلة مراجعة جمعتها من ثلاثة أترام:' + `<span class="src-fchip" data-fid="${fid3}" contenteditable="false"></span>`,
        files: { [fid3]: { name: 'أسئلة-مراجعة.txt', v: 'data:text/plain;charset=utf-8,' + encodeURIComponent('أسئلة مراجعة — عيّنة عرض'), kind: 's' } },
      }),
      mk('i', 20, 2, 0, { html: 'الملزمة فقط. لا تشتّت نفسك.', files: {} }),
      mk('j', 27, 1, 0, { html: 'شرح الأستاذ في المراجعة الأخيرة كافٍ.', files: {} }),
    );

    /* ===== ٦) مصادر الممارسة ===== */
    postsOf(code, 'srcP').push(
      mk('b', 2, 18, 0, {
        html: 'أفضل تمرين لهذي المادة: اكتب الإجابة بيدك كأنك في الاختبار ثم قارنها بالملزمة.<br>حللت آخر أربعة اختبارات نهائية وكتبت الإجابات النموذجية بأسلوب المنهج — كرّرها مرتين وبتلاحظ أن الأسئلة تدور حول ستة محاور فقط.',
        files: {},
      }),
      mk('a', 3, 14, 1, { html: 'اختبر نفسك: غطِّ التعريف واذكره بأسلوبك، ثم افتح وقارن. هذي أسرع طريقة تكشف الحفظ الوهمي.', files: {} }),
      mk('c', 5, 12, 0, { html: 'قروب الدفعة فيه بنك أسئلة صح/خطأ على كل فصل — حلّه بعد كل محاضرة مباشرة.', files: {} }),
      mk('e', 8, 9, 0, { html: 'اكتب لكل ركن من أركان الإيمان: التعريف، الدليل، الأثر السلوكي. هذا شكل السؤال المقالي غالبًا.', files: {} }),
      mk('d', 10, 7, 1, { html: 'راجع مع زميل بطريقة السؤال والجواب، تكشفون ثغرات بعض.', files: {} }),
      mk('f', 12, 5, 0, { html: 'حل أسئلة الفصل في نهاية كل وحدة من الملزمة، فيها نصف أسئلة الاختبار.', files: {} }),
      mk('g', 14, 4, 0, { html: 'كتابة الأدلة بخط اليد ثلاث مرات ثبّتتها عندي أكثر من القراءة عشر مرات.', files: {} }),
      mk('h', 18, 3, 1, { html: 'جرّب تشرح الفصل لأحد أهلك — إذا شرحته فهو محفوظ.', files: {} }),
      mk('i', 23, 2, 0, { html: 'حل نموذج الاختبار المعلن قبل النهائي بيوم.', files: {} }),
      mk('j', 28, 1, 0, { html: 'ما تحتاج تمارين كثيرة، المذاكرة الفاهمة تكفي.', files: {} }),
    );

    /* ===== ٧) الشروح (رزم فيديو حرّة) ===== */
    const yt = 'https://www.youtube.com/watch?v=';
    postsOf(code, 'videos').push(
      mk('a', 1, 22, 0, { deck: [
        nd({ t: 'f', name: 'الوحدة الأولى — مفهوم العقيدة', open: true, ch: [
          nd({ t: 'v', vt: 'link', name: 'تعريف العقيدة ومصادرها', v: yt + 'demo01', dur: '14:20', fname: '' }),
          nd({ t: 'v', vt: 'link', name: 'أهمية العقيدة في حياة المسلم', v: yt + 'demo02', dur: '11:05', fname: '' }),
        ] }),
        nd({ t: 'f', name: 'الوحدة الثانية — أركان الإيمان', open: false, ch: [
          nd({ t: 'v', vt: 'link', name: 'الإيمان بالله', v: yt + 'demo03', dur: '18:40', fname: '' }),
          nd({ t: 'v', vt: 'link', name: 'الإيمان بالملائكة', v: yt + 'demo04', dur: '9:55', fname: '' }),
          nd({ t: 'v', vt: 'link', name: 'الإيمان بالكتب والرسل', v: yt + 'demo05', dur: '16:30', fname: '' }),
          nd({ t: 'v', vt: 'link', name: 'الإيمان باليوم الآخر والقدر', v: yt + 'demo06', dur: '21:10', fname: '' }),
        ] }),
        nd({ t: 'v', vt: 'link', name: 'مراجعة شاملة قبل النهائي', v: yt + 'demo07', dur: '46:00', fname: '' }),
      ] }),
      mk('b', 3, 16, 1, { deck: [
        nd({ t: 'f', name: 'شرح الملزمة فصلًا فصلًا', open: true, ch: [
          nd({ t: 'v', vt: 'link', name: 'الفصل الأول', v: yt + 'demo11', dur: '12:00', fname: '' }),
          nd({ t: 'v', vt: 'link', name: 'الفصل الثاني', v: yt + 'demo12', dur: '13:25', fname: '' }),
          nd({ t: 'v', vt: 'link', name: 'الفصل الثالث', v: yt + 'demo13', dur: '10:45', fname: '' }),
        ] }),
      ] }),
      mk('c', 5, 12, 0, { deck: [
        nd({ t: 'v', vt: 'link', name: 'نواقض التوحيد — مبسّط', v: yt + 'demo21', dur: '8:30', fname: '' }),
        nd({ t: 'v', vt: 'link', name: 'أثر العقيدة في السلوك', v: yt + 'demo22', dur: '15:15', fname: '' }),
      ] }),
      mk('d', 7, 10, 1, { deck: [
        nd({ t: 'f', name: 'مقاطع قصيرة للمراجعة السريعة', open: false, ch: [
          nd({ t: 'v', vt: 'link', name: 'تعريفات في دقيقتين', v: yt + 'demo31', dur: '2:10', fname: '' }),
          nd({ t: 'v', vt: 'link', name: 'الأدلة الشرعية باختصار', v: yt + 'demo32', dur: '3:05', fname: '' }),
        ] }),
      ] }),
      mk('e', 9, 8, 0, { deck: [nd({ t: 'v', vt: 'link', name: 'محاضرة الدكتور المسجّلة — الوحدة الرابعة', v: yt + 'demo41', dur: '52:00', fname: '' })] }),
      mk('f', 11, 6, 0, { deck: [
        nd({ t: 'v', vt: 'link', name: 'الفرق بين التوحيد وأقسامه', v: yt + 'demo51', dur: '19:40', fname: '' }),
      ] }),
      mk('g', 13, 5, 1, { deck: [
        nd({ t: 'v', vt: 'link', name: 'مراجعة الاختبار الأول', v: yt + 'demo61', dur: '27:30', fname: '' }),
        nd({ t: 'v', vt: 'link', name: 'مراجعة الاختبار الثاني', v: yt + 'demo62', dur: '24:15', fname: '' }),
      ] }),
      mk('h', 17, 3, 0, { deck: [nd({ t: 'v', vt: 'link', name: 'ملخص المنهج في ٢٠ دقيقة', v: yt + 'demo71', dur: '20:00', fname: '' })] }),
      mk('i', 21, 2, 0, { deck: [nd({ t: 'v', vt: 'link', name: 'شرح مبسّط للفصل الأخير', v: yt + 'demo81', dur: '7:45', fname: '' })] }),
      mk('j', 29, 1, 0, { deck: [] }),
    );

    /* ===== ٨) البطائق (رزم بطاقات حرّة) ===== */
    const card = (f, b) => nd({ t: 'c', f, b });
    postsOf(code, 'cards').push(
      mk('a', 2, 25, 0, { deck: [
        nd({ t: 'f', name: 'تعريفات أساسية', open: true, ch: [
          card('ما تعريف العقيدة لغةً؟', 'من العقد وهو الربط والإحكام والشدّ بقوة.'),
          card('ما تعريف العقيدة اصطلاحًا؟', 'ما يعقد عليه القلب عقدًا جازمًا لا يخالطه شكّ.'),
          card('ما مصادر العقيدة الإسلامية؟', 'الكتاب والسنة وإجماع سلف الأمة.'),
          card('ما معنى التوحيد؟', 'إفراد الله سبحانه بما يختصّ به من الربوبية والألوهية والأسماء والصفات.'),
        ] }),
        nd({ t: 'f', name: 'أركان الإيمان', open: false, ch: [
          card('كم عدد أركان الإيمان؟', 'ستة.'),
          card('ما الركن الأول؟', 'الإيمان بالله.'),
          card('ما الدليل على أركان الإيمان؟', 'حديث جبريل عليه السلام في الصحيحين.'),
          nd({ t: 'f', name: 'تفصيل الإيمان بالله', open: false, ch: [
            card('كم أقسام التوحيد؟', 'ثلاثة: الربوبية والألوهية والأسماء والصفات.'),
            card('ما توحيد الربوبية؟', 'إفراد الله بأفعاله كالخلق والرزق والتدبير.'),
          ] }),
        ] }),
        card('ما أثر العقيدة في سلوك الفرد؟', 'تثمر المراقبة والإخلاص والصبر وتضبط السلوك ظاهرًا وباطنًا.'),
      ] }),
      mk('b', 4, 18, 1, { deck: [
        nd({ t: 'f', name: 'الفصل الأول', open: true, ch: [
          card('ما موضوع الفصل الأول؟', 'مفهوم العقيدة وأهميتها ومصادرها.'),
          card('لماذا سُمّيت العقيدة بهذا الاسم؟', 'لأن صاحبها يعقد عليها قلبه.'),
          card('ما حكم تعلّم العقيدة؟', 'فرض عين على كل مكلّف بقدر ما يصحّ به إيمانه.'),
        ] }),
        nd({ t: 'f', name: 'الفصل الثاني', open: false, ch: [
          card('ما نواقض التوحيد؟', 'الشرك والكفر والنفاق والردّة.'),
          card('ما أنواع الشرك؟', 'أكبر مخرج من الملّة، وأصغر لا يخرج منها.'),
        ] }),
      ] }),
      mk('c', 6, 14, 0, { deck: [
        card('ما الفرق بين الإيمان والإسلام؟', 'إذا اجتمعا افترقا وإذا افترقا اجتمعا؛ الإسلام عمل ظاهر والإيمان عمل باطن.'),
        card('هل يزيد الإيمان وينقص؟', 'نعم، يزيد بالطاعة وينقص بالمعصية.'),
        card('ما معنى الإحسان؟', 'أن تعبد الله كأنك تراه، فإن لم تكن تراه فإنه يراك.'),
        card('ما دليل زيادة الإيمان؟', 'قوله تعالى: «ويزداد الذين آمنوا إيمانًا».'),
        card('ما معنى القضاء والقدر؟', 'علم الله بالأشياء وكتابته لها ومشيئته وخلقه لها.'),
      ] }),
      mk('d', 8, 11, 1, { deck: [
        nd({ t: 'f', name: 'أسئلة الاختبار الأول', open: true, ch: [
          card('عرّف الإيمان بالملائكة.', 'التصديق الجازم بوجودهم وأنهم عباد مكرمون لا يعصون الله ما أمرهم.'),
          card('اذكر ثلاثة من أسماء الملائكة.', 'جبريل وميكائيل وإسرافيل.'),
        ] }),
      ] }),
      mk('e', 10, 9, 0, { deck: [
        card('ما الكتب السماوية المذكورة في القرآن؟', 'التوراة والإنجيل والزبور والصحف والقرآن.'),
        card('من هم أولو العزم من الرسل؟', 'نوح وإبراهيم وموسى وعيسى ومحمد عليهم السلام.'),
        card('ما معنى الإيمان باليوم الآخر؟', 'التصديق بكل ما أخبر الله به مما يكون بعد الموت.'),
      ] }),
      mk('f', 12, 7, 0, { deck: [
        card('ما آثار الإيمان بالقدر؟', 'الطمأنينة والرضا وترك الحسد والاعتماد على الله مع الأخذ بالأسباب.'),
        card('ما مراتب القدر؟', 'العلم والكتابة والمشيئة والخلق.'),
      ] }),
      mk('g', 15, 5, 1, { deck: [
        nd({ t: 'f', name: 'مصطلحات', open: false, ch: [
          card('ما معنى «السلف»؟', 'القرون الثلاثة المفضّلة: الصحابة والتابعون وتابعوهم.'),
        ] }),
        card('ما معنى «البدعة»؟', 'إحداث في الدين ما ليس منه.'),
      ] }),
      mk('h', 19, 3, 0, { deck: [
        card('ما أعظم آية في القرآن؟', 'آية الكرسي.'),
        card('ما أعظم واجب؟', 'التوحيد.'),
      ] }),
      mk('i', 24, 2, 0, { deck: [card('ما أول واجب على المكلّف؟', 'توحيد الله عز وجل.')] }),
      mk('j', 30, 1, 0, { deck: [] }),
    );

    state.seedIAS111 = 1;
    save();
  }

  /* ---------- عيّنات «مصادر الفهم» الغنيّة في «اسلامي 111» ----------
     العيّنات الأولى كانت ملفًّا واحدًا في آخر السطر، فلا تُظهر حرّية الكتابة: نصٌّ قبل الملف
     وبعده، وتعداد، وعدّة ملفات بصيغ مختلفة في المساهمة الواحدة. تُزرع مرّة واحدة بعلَم مستقلّ */
  function seedIAS111SrcRich() {
    if (state.seedIAS111SrcRich) return;
    const code = 'IAS 111';
    if (!CM[code]) return;
    const D = 86400000, now = Date.now();
    const av = (ini, c1, c2) => 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>` +
      `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
      `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
      `<rect width='80' height='80' fill='url(#g)'/>` +
      `<text x='40' y='53' font-family='Segoe UI, Tahoma, sans-serif' font-size='34' font-weight='700' fill='#fff' text-anchor='middle'>${ini}</text></svg>`);
    /* نفس مساهمي العيّنة الأصلية (اسم وصورة) كي تتّسق الهوية عبر البنود */
    const U = {
      a: ['عبدالرحمن الغامدي', av('ع', '#2e7d32', '#66bb6a')],
      d: ['ريان الشهري', av('ر', '#00695c', '#26a69a')],
      h: ['تركي الزهراني', av('ت', '#00838f', '#26c6da')],
    };
    const post = (k, days, likes, dislikes, html, files) =>
      ({ id: newId(), me: false, u: { name: U[k][0], img: U[k][1] }, likes, liked: false, dislikes, disliked: false,
         ts: now - Math.round(days * D), data: { html, files } });
    /* ملفّ عيّنة: الاسم بامتداده الحقيقي، والمحتوى ملاحظة نصّية صغيرة (عرضٌ لا ملفّ حقيقي).
       ‎bag‎ يُبدَّل قبل كل مساهمة كي تحمل كلُّ واحدة ملفاتِها وحدها لا ملفات غيرها */
    let bag = {};
    const F = (name, note) => {
      const id = newId();
      bag[id] = { name, v: 'data:text/plain;charset=utf-8,' + encodeURIComponent(note + ' — عيّنة عرض في أكاديميا') };
      return `<span class="src-fchip" data-fid="${id}" contenteditable="false"></span>`;
    };

    /* ===== المساهمة الشاملة: أحد عشر ملفًّا بصيغ مختلفة، ونصٌّ قبل كل ملف وبعده ===== */
    bag = {};
    const big =
      'جمعت لكم كل ما استفدت منه في المادة بعد ترمين: الترم الأول ذاكرت عشوائيًّا وطلعت بـB+، والثاني رتّبت المصادر بالترتيب اللي تحت وطلعت بـA+. رتّبتها بترتيب <b>ما تحتاجه فعلًا</b> لا بترتيب ما وصلني.<br><br>' +
      '<b>١) خريطة المادة قبل أول محاضرة.</b> اقرأ هذا الملخّص قراءة سريعة (تسع صفحات، فصل لكل صفحة) عشان تدخل المحاضرة وأنت عارف وين أنت من المنهج:' +
      F('ملخص-العقيدة-الشامل.pdf', 'ملخص شامل لمقرر العقيدة وأثرها') +
      ' ولا تعتمد عليه في الاختبار — هو خريطة لا مرجع، والأسئلة التفصيلية ما تجي إلا من الملزمة نفسها.<br><br>' +
      '<b>٢) أركان الإيمان بالصورة.</b> أكثر شيء ثبّت المعلومة عندي الخرائط الذهنية، صفحة واحدة لكل ركن:' +
      F('خرائط-أركان-الإيمان.png', 'خرائط ذهنية لأركان الإيمان الستة') +
      ' علّقها قدام مكتبك وامسحها بعينك خمس دقائق يوميًّا، وبعد أسبوع بتسترجع الركن بأدلته بلا ما تفتح شيئًا.<br><br>' +
      '<b>٣) المقارنات هي مفتاح الأسئلة المقالية.</b> أغلب أسئلة الدكتور «قارن بين…»، فسويت جدولًا يجمع الفروق كلها في ورقة:' +
      F('جدول-مقارنة-المذاهب.xlsx', 'جدول مقارنة بين المذاهب والفرق') +
      ' الجدول فيه عمود أخير اسمه «الدليل» — لا تتجاهله، الدرجة الكاملة ما تجي إلا بدليل.<br><br>' +
      '<b>٤) لو فاتتك محاضرة.</b> هذي شرائح الوحدة الأولى مع تعليقاتي مكتوبة تحت كل شريحة:' +
      F('عرض-المحاضرة-الأولى.pptx', 'شرائح الوحدة الأولى مع التعليقات') +
      ' وهذا تفريغ كامل لشرح الدكتور بالكلمة تقريبًا:' +
      F('تفريغ-شرح-الدكتور.docx', 'تفريغ نصّي لشرح المحاضرات') +
      ' التفريغ طويل، فلا تقرأه كله — استعمل البحث فيه عن المصطلح اللي وقفت عنده وبس.<br><br>' +
      '<b>٥) وقت الطريق ما يضيع.</b> ثلاثة ملفات للأسبوع الأخير:' +
      '<ul>' +
      '<li>تسجيل المراجعة النهائية كاملة (ساعة و٤٠ دقيقة): ' + F('تسجيل-مراجعة-نهائية.mp3', 'تسجيل صوتي للمراجعة النهائية') + ' اسمعه مرّتين في الطريق للجامعة، أنفع من قراءة ساعة.</li>' +
      '<li>مقطع مركّز في نواقض التوحيد: ' + F('مقطع-شرح-نواقض-التوحيد.mp4', 'مقطع مرئي — نواقض التوحيد') + ' عشر دقائق غنّتني عن فصل كامل.</li>' +
      '<li>بطاقات الأدلة جاهزة للاستيراد في Anki: ' + F('بطاقات-حفظ-الأدلة.csv', 'بطاقات حفظ الأدلة — صيغة CSV') + ' الملف بعمودين فقط: وجه وظهر.</li>' +
      '</ul>' +
      'وأخيرًا الملزمة كاملة مضغوطة مع ملحقاتها:' +
      F('ملزمة-القسم-كاملة.zip', 'ملزمة القسم كاملة') +
      ' ومعها مخطّط المنهج التفصيلي اللي يوريك ترابط الفصول ببعض:' +
      F('مخطط-المنهج-التفصيلي.svg', 'مخطط تفصيلي لترابط فصول المنهج') +
      ' وقائمة روابط إضافية (كتب وقنوات) لمن حبّ يتوسّع بعد النهائي لا قبله:' +
      F('روابط-ومصادر-إضافية.txt', 'روابط ومصادر إضافية للاستزادة') +
      '<br><br>ملاحظة أخيرة: لا تفتح هذا كله من أول يوم فتتشتّت. الأول والثاني يكفيانك أول ستة أسابيع، والباقي وقته قبل النهائي بأسبوعين. بالتوفيق للجميع.';
    const bigFiles = bag;

    /* ===== مساهمتان متوسّطتان: نصّ ثم ملف ثم نصّ ثم ملف ===== */
    bag = {};
    const mid =
      'أنا ما أحب الملخّصات الطويلة، فسويت لنفسي ورقة واحدة لكل فصل وكتبت فيها ثلاثة أشياء فقط: التعريف، الدليل، الأثر السلوكي. هذي أوراق الفصول التسعة:' +
      F('ورقة-لكل-فصل.pdf', 'ورقة واحدة لكل فصل — تسع أوراق') +
      ' جرّبها أسبوعًا وبتعرف إن المادة أصغر مما تبدو.<br><br>' +
      'وهذا ملف صوتي سجّلته لنفسي أقرأ فيه الأدلة بصوتي:' +
      F('أدلة-بصوتي.mp3', 'تسجيل صوتي للأدلة') +
      ' سماع صوتك أنت تحديدًا يثبّت أسرع من أي شرح، جرّبها ولا تستهين بها.';
    const midFiles = bag;

    bag = {};
    const mid2 =
      'ثلاث ملاحظات قبل ما تبدأ:<br>' +
      '<ol><li>الملزمة هي المرجع الوحيد المعتمد.</li><li>لا تقرأ فصلين في جلسة واحدة، المادة تراكمية وتحتاج تخمير.</li><li>اكتب بيدك، القراءة وحدها تخدعك.</li></ol>' +
      'وعلى ذكر الكتابة، هذا نموذج تلخيص فاضي أستعمله لكل فصل:' +
      F('نموذج-تلخيص-فاضي.docx', 'نموذج تلخيص جاهز للتعبئة') +
      ' عبّئه بيدك بعد كل محاضرة مباشرة، وبعد تسع مرات تكون خلّصت المنهج بلا ما تحس.';
    const mid2Files = bag;

    postsOf(code, 'srcU').push(
      post('a', 0.4, 41, 0, big, bigFiles),
      post('d', 1.5, 18, 1, mid, midFiles),
      post('h', 3.2, 12, 0, mid2, mid2Files),
    );

    state.seedIAS111SrcRich = 1;
    save();
  }

  /* ---------- مواضيع المادة في عيّنات «اسلامي 111» ----------
     البند كان منسيًّا في البذرة الأولى، فتُملأ مواضيعُ بعض العيّنات (بكثافة متفاوتة) مرّة واحدة */
  function seedIAS111Topics() {
    if (state.seedIAS111T) return;
    const arr = ((((state.cinfo || {})['IAS 111'] || {}).posts) || {}).info || [];
    const CH = [
      { num: '1', name: 'مفهوم العقيدة وأهميتها' }, { num: '2', name: 'مصادر العقيدة' },
      { num: '3', name: 'توحيد الربوبية' }, { num: '4', name: 'توحيد الألوهية' },
      { num: '5', name: 'الأسماء والصفات' }, { num: '6', name: 'الإيمان بالملائكة' },
      { num: '7', name: 'الإيمان بالكتب والرسل' }, { num: '8', name: 'الإيمان باليوم الآخر' },
      { num: '9', name: 'الإيمان بالقضاء والقدر' },
    ];
    const byName = {
      'عبدالرحمن الغامدي': CH.slice(0, 9),
      'سلمان الحربي': CH.slice(0, 4),
      'نواف العتيبي': [CH[2], CH[3], CH[8]],
      'خالد الدوسري': CH.slice(0, 6),
      'ماجد القرني': [CH[0], CH[1]],
      'تركي الزهراني': [CH[5], CH[6], CH[7], CH[8]],
    };
    let hit = 0;
    arr.forEach(p => {
      const t = byName[(p.u || {}).name];
      if (!t || !p.data || (p.data.topics || []).length) return;
      p.data.topics = t.map(x => Object.assign({}, x));
      hit++;
    });
    state.seedIAS111T = 1;
    save();
  }

  /* ============================================================
     ترحيلٌ لمرّةٍ واحدة: روابطُ شروح «اسلامي ١١١» تصير مقاطعَ حقيقيّة
     ============================================================
     بذرةُ العرض وُضعت بمعرّفاتٍ وهميّة (‎demo01‎ …) — تُرى قائمةً ولا تُشغَّل. ولمّا صار
     في الموقع مُشغّلُ يوتيوب، صار الوهميُّ إطارًا يقول «الفيديو غير متاح».
     والبذرةُ لا تُعاد (‎state.seedIAS111‎ مرفوع عند من فتح الموقعَ قبلُ)، فالتصحيحُ
     ترحيلٌ يمشي على ما في الحال — كما فُعل بـ‎mediaPathFix‎ و‎vidToFile‎.
     ولا يُمَسّ إلّا ما وُضع بذرةً: الشرطُ أن يكون الرابطُ من ‎demo‎، فما بدّلتَه بيدك
     يبقى كما بدّلتَه. */
  /* ===== وجولةٌ ثانيةٌ: مقاطعُ تُشغَّل لا مقاطعُ تُوجد =====
     الأولى وضعت مقاطعَ حقيقيّةً وجدها البحث، فلم تُشغَّل: **الوجودُ غيرُ الإتاحة** —
     صاحبُ المقطع قد يمنع التضمينَ خارج يوتيوب، فيُرى الإطارُ ويقول «غير متاح».
     ولا سبيلَ إلى فحص ذلك من هنا (يُعرف بالتشغيل وحدَه). فأُخذت المقاطعُ من قائمةٍ
     ناولَها صاحبُ الموقع — وهو أعلمُ بما يعمل عنده.
     ===== والخريطةُ تقبل الحالين =====
     مَن لم يمرّ بالجولة الأولى فروابطُه ‎demo##‎، ومن مرّ بها فروابطُه معرّفاتُ الجولة
     الأولى. فتُقرأ المفتاحُ من الاثنين: معرّفُ يوتيوب إن وُجد، وإلّا لاحقةُ ‎demo##‎ */
  function iasYtFix() {
    if (state.iasYt2) return;
    /* قائمةُ «شرح كتاب أصول الإيمان — الشيخ عبد الرزاق البدر» وما حولها */
    const V = ['__Nx-pWpMf8', 'y7kWAr9Pp_o', '5sWQUN-PNv8', 'W8jUmcVav28',
      'CJ4NqHhYXVY', 'ZWFw5omoToc', 'bgDsRB80uJk'];
    const MAP = {};
    /* مفاتيحُ الجولة الأولى ومفاتيحُ البذرة كلاهما يُشير إلى الموضع نفسِه */
    ['demo01', 'demo02', 'demo03', 'demo04', 'demo05', 'demo06', 'demo07']
      .forEach((k, i) => { MAP[k] = V[i]; });
    ['5hRFx29AABs', 'asBt_l5mAOc', 'nb5ESAef6PQ', 'JiND2EJQqQk',
      'U6-PD0qyqS8', 'mm9Vs6yeY5E', '0uCIXFdqq2Y']
      .forEach((k, i) => { MAP[k] = V[i]; });
    let n = 0;
    const walk = ns => (ns || []).forEach(x => {
      if (x.t === 'f') return walk(x.ch);
      const cur = String(x.v || '');
      const m = /demo(\d\d)$/.exec(cur);
      const key = m ? 'demo' + m[1] : ytId(cur);
      if (!key || !MAP[key]) return;
      x.v = 'https://www.youtube.com/watch?v=' + MAP[key];
      n++;
    });
    const arr = (((state.cinfo || {})['IAS 111'] || {}).posts || {}).videos || [];
    arr.forEach(p => walk(p.data && p.data.deck));
    state.iasYt2 = 1;
    save();
  }

  /* ============================================================
     بذرةُ تعليقاتٍ على مساهمتَيّ في «اسلامي ١١١»
     ============================================================
     ‏‎seedCmtMine111‎ بذرت على بطائقي وقتَ كُتبت، ولم تبلغ **الشروح** أصلًا — ولا ما
     استُجدّ من بطائقَ بعدها (هي تعمل مرّةً واحدة).
     وهذه تُكمِل الاثنين: تمرّ على أوراق مساهمتَيّ (‎p.me‎) فمن لم يكن عليه تعليقٌ
     بُذر له. **ولا تمسّ ما عليه تعليق** — فما كتبه أحدٌ لا يُزاد عليه بذرةٌ من عندنا.
     والمتونُ تُختار بلا حسابٍ للمحتوى: هي عيّناتُ عرضٍ لتُرى الفقاعةُ عامرةً */
  function seedCmtMineBoth111() {
    if (state.seedCmtMineB1) return;
    const code = 'IAS 111';
    if (!CM[code]) return;
    const D = 86400000, now = Date.now();
    const av = (ini, c1, c2) => 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>`
      + `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>`
      + `<stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>`
      + `<rect width='80' height='80' fill='url(#g)'/>`
      + `<text x='40' y='53' font-family='Segoe UI, Tahoma, sans-serif' font-size='34'`
      + ` font-weight='700' fill='#fff' text-anchor='middle'>${ini}</text></svg>`);
    const WHO = [
      { name: 'عبدالرحمن الغامدي', img: av('ع', '#00695c', '#00897b') },
      { name: 'سلمان الحربي' },
      { name: 'نواف العتيبي', img: av('ن', '#4527a0', '#7e57c2') },
      { name: 'ريان الشهري', img: av('ر', '#ad1457', '#ec407a') },
      { name: 'خالد الدوسري' },
      { name: 'ماجد القرني', img: av('م', '#f9a825', '#f57f17') },
      { name: 'تركي الزهراني' },
      { name: 'يزيد المطيري', img: av('ي', '#37474f', '#78909c') },
    ];
    const VTX = [
      'الصوت واطي شوي في أول خمس دقايق، بعدها يضبط.',
      'المقطع هذا اللي فهّمني الفرق — كنت خربط بينهم من زمان.',
      'من الدقيقة ٧ يبدأ المهم، اللي قبلها مقدمة.',
      'شكرًا، حطيته في رحلتي ورجعت له قبل الميدتيرم.',
      'لو تحط توقيتات في الوصف يصير أسهل للمراجعة السريعة.',
      'أفضل شرح لهالباب صراحة، أوصي فيه.',
      'جزاك الله خير، مختصر ووافي.',
      'أعدته مرتين وثبتت المعلومة. ما احتجت الملزمة.',
    ];
    const CTX = [
      'هذي مرّت علينا في الاختبار بنفس الصيغة تقريبًا.',
      'واضحة، بس ينقصها مثال يثبّتها.',
      'أخذتها لرزمتي، شكرًا.',
      'الجواب مختصر شوي — يستاهل سطر زيادة.',
      'ثبّتها فضلًا، كثير يسأل عنها.',
      'من أنفع اللي مرّت عليّ في الباب.',
      'راجعتها ثلاث مرات وثبتت.',
      'لو تضيف الدليل تحتها تصير كاملة.',
    ];
    let r = 7, n = 0;
    const rnd = () => (r = (r * 1103515245 + 12345) & 0x7fffffff);
    const leaves = ns => (ns || []).reduce((a, x) =>
      a.concat(x.t === 'f' ? leaves(x.ch) : [x]), []);
    const seed = (sub, TX) => (postsOf(code, sub) || []).forEach(p => {
      if (!p.me || !p.data || !Array.isArray(p.data.deck)) return;
      leaves(p.data.deck).forEach(x => {
        if (Array.isArray(x.cm) && x.cm.length) return;   /* ما عليه تعليقٌ لا يُمَسّ */
        const k = 1 + (rnd() % 3);   /* واحدٌ إلى ثلاثة */
        x.cm = [];
        for (let i = 0; i < k; i++) {
          const w = WHO[rnd() % WHO.length];
          x.cm.push(Object.assign({}, w, {
            x: TX[rnd() % TX.length],
            ts: now - (1 + (rnd() % 21)) * D,
            likes: rnd() % 6, liked: false, rp: [],
          }));
          n++;
        }
        x.cm.sort((a, b) => b.ts - a.ts);
      });
    });
    seed('videos', VTX);
    seed('cards', CTX);
    state.seedCmtMineB1 = 1;
    save();
  }

