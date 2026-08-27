  /* ===== فتحُ الرابط ===== */
  function xlPaintOpen(o) {
    const el = xlEl(); el.hidden = false;
    el.innerHTML = `<div class="xl-veil" data-xl="x"></div>
      <div class="xl-box xl-box--in" role="dialog" aria-modal="true">
        <div class="xl-hd"><i>${CX_BAR_IC.link}</i><b>${esc(o.t || T().xlNoTitle)}</b></div>
        ${o.d ? `<p class="xl-desc">${esc(o.d)}</p>` : ''}
        <div class="xl-row">
          ${xlWho(o.n || T().meName, FLAT_AVATAR)}
          <span class="xl-acts">
            <button type="button" class="xl-b xl-b--pri" data-xl="sum">${CX_BAR_IC.sum}<em>${esc(T().cxBarSum)}</em></button>
            <button type="button" class="xl-b" data-xl="test">${CX_BAR_IC.test}<em>${esc(T().cxBarTest)}</em></button>
          </span>
        </div>
      </div>`;
  }

  /* ===== «اختبر نفسك»: نافذةُ الإعدادات ثمّ الجلسة =====
     كان يبدأ الجلسةَ على المحدَّد بلا سؤال، فيمشي الطابورُ بترتيب الشجرة على كلّ
     الأنواع بلا وقتٍ ولا نطاق. فصار يفتح نافذةَ الإعدادات (‎xtStart‎)، وهي التي
     تبني الطابورَ وتُسلّمه إلى ‎cxStudy‎ عند «ابدأ» — فالجلسةُ لم تُمَسّ، وإنّما
     دُسّ بينها وبين الزرّ بابٌ يُسأل فيه */
  function cxTestSel() {
    if (!cxSelRo) return;
    /* ===== ورحلتُك رزمةٌ مصنوعة =====
       ‏‎xtStart‎ تطلب «رزمة» تقرأ منها أربعةً لا خامسَ لها: ‎data.deck‎ (طابورُ الأسئلة)
       و‎id‎ (يُقيَّد في سجلّ الاختبارات) و‎u.name‎ (صاحبُها) و‎st‎ (وضعُها — يقرؤه الحضور).
       ودفترُك ليس مساهمةً، فتُركَّب له رزمةٌ تحمل الأربعةَ وحدَها: معرّفٌ ثابتٌ يُعرف به
       سجلُّه، واسمُك، ووضعٌ **خاصّ** فلا يُقال «مَن عندها الآن» في شيءٍ لا يراه أحد.
       ولا تُخزَّن: تُصنع عند الضغطة وتعيش عمرَ الاختبار */
    const pk = cxRoadSel
      ? { id: 'road:' + (nookEntry ? nookCode(nookEntry) : ''), st: 'priv',
          u: { name: T().meName }, data: { deck: roadOf(nookEntry) } }
      : postsOf(cmCode, 'cards').find(x => x.id === cardView.open);
    /* وما لم يُنشر قطُّ لا يدخل طابورَ الاختبار: أُسقط من الشجرة (‎cxRoShow‎)، فلو
       دخل من «حدّد الكلَّ» لَامتُحنتَ في بطاقةٍ لا وجودَ لها عندك — وفي دفترك يبقى
       الجميعُ لأنّه دفترُك */
    const nodes = cxSelLeaves(cxDeck())
      .filter(n => cxRoadSel || !n.pend || cdPubV(n) > 0);
    if (!pk || !nodes.length) return;
    xtStart(nodes, pk);
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('#xl-modal [data-xl]');
    if (!b) return;
    const a = b.dataset.xl;
    if (a === 'x') { xlClose(); return; }
    if (a === 'copy') {
      const u = document.getElementById('xl-u');
      if (u) copyText(u.value);
      b.classList.add('is-ok');
      b.innerHTML = OK_IC + `<em>${esc(T().xlCopied)}</em>`;
      return;
    }
    if (a === 'sum') { xlClose(); cxSumOpen(null, cxDeck()); return; }
    if (a === 'test') { xlClose(); cxTestSel(); return; }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { const el = document.getElementById('xl-modal'); if (el && !el.hidden) xlClose(); }
  });

  /* أفعالُ الشريط — مستمعٌ خاصٌّ به لأنّه خارج ‎.cm-panel‎ فلا يبلغه مستمعُها */
  document.addEventListener('click', e => {
    const b = e.target.closest('#cx-selbar [data-cxbar]');
    if (!b) return;
    const act = b.dataset.cxbar;
    if (act === 'clear') { cxSel.clear(); cxPaintSel(); return; }
    if (act === 'sum') { cxSumOpen(null, cxDeck()); return; }
    /* ===== «اختبر نفسك»: جلسةُ مذاكرةٍ على المحدَّد وحدَه =====
       آلةُ المذاكرة قائمةٌ (‎cxStudy‎ و‎srsApply‎)، وإنّما كان مدخلُها الرزمةَ كلَّها أو
       المستحقَّ منها. وهذا مدخلٌ ثالثٌ: **ما اخترتَه أنت** (‎cxTestSel‎ — ينادِيها
       الشريطُ ونافذةُ الرابط معًا، فلا تُكتب الجلسةُ في موضعين) */
    if (act === 'test') { cxTestSel(); return; }
    if (act === 'link') { xlCompose(); return; }
    if (act === 'del') {
      /* ===== وحذفُ «رحلتي» يفترق عن حذف المحرّر في ثلاثة =====
         الديكُ ‎roadOf(nookEntry)‎ لا ‎edPack().deck‎ (وذاك رزمةُ مساهمةٍ تُحرَّر، فلو
         سُئل ههنا لَطُرح من رزمةٍ أخرى)، والرسمُ ‎roadRender‎ لا ‎edRender‎، و**الفصلُ
         يُفرَّغ ولا يُطرح**. وتحديدُ الفصل تحديدٌ لجوفه كلِّه (‎cxKids‎)، فتفريغُه هو عينُ
         «احذف كلَّ ما حدَّدتُه» — ولا يبقى إلّا الصفُّ الذي لا تملكه أصلًا.
         ولا يُنادى ‎cxBarPaint‎ بعده: ‎roadRender‎ تُنادي ‎cxPaintSel‎ وهي تُزامن الشريطَ
         من نفسها، والتحديدُ خلا فيغيب */
      if (cxRoadSel) {
        const rd = roadOf(nookEntry);
        roadDelPlan(rd).forEach(id => {
          const r = findNode(rd, id);
          if (!r) return;
          if (r.n.tp === 1) r.n.ch = []; else r.arr.splice(r.i, 1);
        });
        cxSel.clear(); save(); roadRender(); return;
      }
      if (cxSelRo) return;   /* حارسٌ ثانٍ: السلّةُ لا تُرسم في النشر، ولا تُنفَّذ ولو نودِيت */
      /* الحذفُ الجمعيّ: الرؤوسُ وحدَها تُطرح — وذرّيّتُها معها بحكم بنية الشجرة.
         و‎findNode‎ تُسأل لكلّ رأسٍ من جديد لأنّ الطرحَ يزحزح فهارسَ إخوته */
      const d = edPack().deck;
      cxRoots(d).forEach(id => { const r = findNode(d, id); if (r) r.arr.splice(r.i, 1); });
      cxSel.clear(); save(); edRender();
    }
  });

  /* ============================================================
     ورقة الملخّص (ROADMAP-SUMMARY-SHEET — الجسمُ اتّجاه ٧، والمحتوى اتّجاه ٤)
     ============================================================
     أوراقُ A4 فيها جداول، تُشتقّ من التحديد ولا تُطلب من المستخدم: هو كتب بطائقه،
     والورقةُ صورتُها حين تُصفّ. وقراراتُ ١٢ أغسطس:
       · **سيلٌ واحدٌ متّصل** — ترقيمٌ متواصلٌ ١…ن، وترويسةُ قسمٍ تفصل بين المجلدات.
       · **كلٌّ على صورته** — لكلّ نوعٍ رسمُه: الخياراتُ مرقّمة، والفراغُ مسطَّرٌ مرقَّم،
         والإخفاءُ صورةٌ مقنّعةٌ ثمّ مكشوفة. (والمسطَّحُ لم يُبنَ — لم يُطلب.)
       · **حيّة** — تتبع ما تكتبه في نوافذ البطائق لحظةً بلحظة.
       · **المتفرّقاتُ أوّلًا** تحت قسمٍ اسمُه «الجذر» ورمزُه **كتابُ المادّة** — كما في
         مسار حفظ البطاقة سواءً بسواء: الجذرُ ليس مجلدًا بل المادةُ نفسُها. */

  /* أقسامُ الورقة: تُقرأ من الشجرة **بترتيبها** لا بترتيب الضغط على الصفوف —
     فالورقةُ صورةُ الرزمة، ولا يصحّ أن يتبدّل ترتيبُها بتبدّل يدِ من حدَّد */
  /* ===== القسمُ يُبنى من البطائق صعودًا، لا من المجلدات نزولًا =====
     أوّلُ بناءٍ أعطى كلَّ مجلدٍ غلافًا، فمجلدٌ في جوف مجلدٍ في جوف مجلدٍ يُخرج **ثلاثَ**
     أوراقٍ متعاقبة، في كلٍّ منها اسمٌ وحدَه لا يقول ما بينه وبين جاره — والقارئُ يقلّب
     أوراقًا فارغةً لا خبرَ فيها.
     والعلّةُ في جهة البناء: المجلدُ الوسيطُ ليس بابًا في الكتاب، إنّما هو **طريقٌ** إلى باب.
     فيُبنى من الأسفل: يُسأل عن كلّ مجلدٍ «أفيه بطائقُ مباشرة؟» — فإن كان فهو بابٌ له
     غلافُه، ويُصعد منه إلى آبائه فيُسرد الطريقُ كلُّه في **غلافٍ واحد**. وإن لم يكن فليس
     بابًا أصلًا فلا ورقةَ له، وإنّما يظهر اسمُه في طريق أبنائه.
     وتكرارُ الأب في أغلفةِ بنيه مقصود: كلُّ غلافٍ يقول أين أنت من الشجرة بتمامه، فلا
     يُحوج القارئَ إلى تذكّر ما قبله ولا إلى الرجوع.
     و‎total‎ عددُ **ما يلي الغلافَ** من بطائقَ مباشرة لا عددُ الشجرة: الرقمُ الذي يلي الاسمَ
     على ورقةٍ تفتتح بنودًا يجب أن يكون عددَ تلك البنود، وإلّا وعد بما لا يفي به */
  /* ===== ومصدرُ «الرؤوس» وسيطٌ لا حالٌ عامّة =====
     كانت تقرأ ‎cxSel‎ (تحديدَ الشجرة) وحدَها، فلا تُفتح الورقةُ إلّا من شريط التحديد.
     ولمّا صار للبطاقة زرُّها في نافذتها احتاجت الدالّةُ أن تُسأل عن **ملفٍّ بعينه**.
     فصار التحديدُ وسيطًا اختياريًّا: من لم يعطِه أُعطي ‎cxSel‎ كما كان. ولم يُلجأ إلى
     حَقْن ‎cxSel‎ مؤقّتًا ثمّ ردِّها — تلك حالُ واجهةٍ حيّة، ومَن كتب فيها ليقرأ منها
     تركَ للعطب بابًا: أيُّ خروجٍ مبكّرٍ بينهما يترك التحديدَ على غير ما تركه المستخدم */
  function sheetSections(deck, sel) {
    const cxs = sel || cxSel;
    const secs = [], loose = [];
    /* ===== إخوةُ القسم: من الرزمة لا من التحديد، **وبترتيبهم فيها** =====
       الغلافُ يقول موضعَ القسم من **الكتاب** لا من اختيارك، فأخٌ لم تحدّده أخٌ على
       كلّ حال. وهم قسمان لا قائمةٌ واحدة: ‎sibA‎ من سبقه في الرزمة و‎sibB‎ من تبعه —
       فيُرسم السابقُ فوقه واللاحقُ تحته. ولو جُمعوا تحته لَانقلب الترتيبُ في الغلاف
       وصار مجلدٌ فوقه في الكتاب تحته في ورقته، فيكذب الغلافُ على قارئه */
    const add = (n, trail, sibA, sibB) => {
      const path = trail.concat(n);
      const direct = (n.ch || []).filter(x => x.t !== 'f');
      if (direct.length) secs.push({ path, sibA, sibB, name: n.name || T().pkTitlePh,
        col: folderColor(n), total: direct.length, cards: direct });
      const kids = (n.ch || []).filter(x => x.t === 'f');
      kids.forEach((x, i) => add(x, path, kids.slice(0, i), kids.slice(i + 1)));
    };
    const walk = ns => {
      const fold = (ns || []).filter(x => x.t === 'f');
      (ns || []).forEach(n => {
        const isRoot = cxs.has(n.id) && !(cxTrail(deck, n.id) || []).some(a => cxs.has(a));
        if (isRoot) {
          if (n.t === 'f') { const j = fold.indexOf(n); add(n, [], fold.slice(0, j), fold.slice(j + 1)); }
          else loose.push(n);
          return;   /* الرأسُ يأخذ ذرّيّتَه كاملةً، فلا يُغاص فيه مرّةً أخرى */
        }
        if (n.t === 'f') walk(n.ch);
      });
    };
    walk(deck);
    /* وجذرُ المادة أخٌ لأبوابها الأولى: هو والمجلداتُ العليا في درجةٍ واحدة. وهو
       أوّلُهم لأنّه محتوى الكتاب المنثور قبل أن يُبوَّب — فكلُّهم بعده */
    if (loose.length) secs.unshift({ root: true, name: T().shRoot, total: loose.length,
      cards: loose, sibA: [], sibB: (deck || []).filter(x => x.t === 'f') });
    return secs;
  }

  /* ===== جلدُ الورقة: يتبع جلدَ الموقع ما لم يُقطع =====
     من قرأ في الليل يريد ورقتَه ليلًا كذلك، فالأصلُ التبعيّة. ولكنّ للورقة حالًا
     ثالثةً لا للموقع — تُطبع — فجاز أن تُقطع بزرٍّ في ترويستها.
     و‎null‎ ليست حالًا ثالثةً في الزرّ بل **غيابُ قرار**: ما دام لم يُضغط فالورقةُ
     تتبع الموقعَ وتنقلب معه، فإذا ضُغط ثبتت على ما اختير */
  /* ===== جلدُ الورقة: حالُ **نظرةٍ** لا تفضيلٌ يُحفظ =====
     كان القطعُ يُكتب في الحال المحفوظة (‎state.shSkin‎) فيبقى أبدًا: من قلب الورقةَ مرّةً
     بقيت مقلوبةً في كلّ فتحةٍ بعدها مهما تبدّل جلدُ الموقع — ورقةٌ بيضاءُ في ليلٍ لا
     يُعرف من أين جاءت، إذ الضغطةُ التي قلبتها قد تكون من أمس.
     فصار القطعُ **في الجلسة** وفي النافذة القائمة وحدَها: تُفتح الورقةُ فتتبع الموقعَ،
     وتُقلب بزرّها ما دامت مفتوحة، فإذا أُغلقت وفُتحت من جديدٍ عادت إلى الموقع.
     و‎state.shSkin‎ المحفوظُ من قبلُ لا يُقرأ بعد اليوم — ولا يُمحى: بياناتُ المستخدم لا
     تُنقَّح لأجل حقلٍ استُغني عنه */
  let shSkinSes = null;
  const shSkin = () => (shSkinSes === 'dark' || shSkinSes === 'light')
    ? shSkinSes : (state.theme === 'dark' ? 'dark' : 'light');
  const SH_SKIN_IC = {
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  };
  /* والزرُّ يحمل رمزَ الحال التي ينقل إليها لا التي هو فيها: هو وعدٌ بفعلٍ لا خبرٌ عن حال */
  const shSkinBtn = () => {
    const to = shSkin() === 'dark' ? 'light' : 'dark';
    const t = esc(to === 'dark' ? T().shToDark : T().shToLight);
    return `<button type="button" class="cd-wb sh-skin" id="sh-skin" data-to="${to}"`
      + ` title="${t}" aria-label="${t}">${SH_SKIN_IC[to]}</button>`;
  };
  /* والقلبُ يبلغ كلَّ نوافذ الورق المفتوحة: الجلدُ حالُ القارئ لا حالُ نافذةٍ بعينها */
  function shSkinApply() {
    const sk = shSkin();
    document.querySelectorAll('.mmodal__card.is-sheet').forEach(c => {
      c.dataset.sh = sk;
      const b = c.querySelector('.sh-skin');
      if (!b) return;
      const to = sk === 'dark' ? 'light' : 'dark';
      const t = to === 'dark' ? T().shToDark : T().shToLight;
      b.dataset.to = to; b.title = t; b.setAttribute('aria-label', t);
      b.innerHTML = SH_SKIN_IC[to];
    });
    /* والصورُ تتبع الورقةَ لا الموقعَ: سمةُ ‎data-sh‎ تقلب الورقَ بالتوكنات، وأمّا نسخةُ
       الصورة فمخبوزةٌ في ‎src‎ — فتُعاد صبغتُها بعد أن تستقرّ السمةُ لا قبلها،
       إذ ‎flSide‎ تقرؤها من العنصر */
    document.querySelectorAll('.mmodal__card.is-sheet').forEach(c => flPaintAll(c));
  }
  /* ---- خياراتُ «المتعدّد» من مخزنها: ‎b‎ قائمةُ ‎<li>‎ و‎ok‎ فهرسُ الصواب ---- */
  const SH_LET = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];
  const shOpts = n => {
    const li = String(n.b || '').match(/<li[^>]*>[\s\S]*?<\/li>/gi);
    return li ? li.map(x => x.replace(/^<li[^>]*>|<\/li>$/gi, '')) : [];
  };
  /* ---- «الإخفاء»: الصورةُ وأقنعتُها. والقناعُ الثابت (‎q === false‎) يبقى في الجواب ---- */
  function shIo(n, open) {
    const p = ioParse(n.f || '');
    /* الإحداثيّاتُ في صيغة أنكي مقيسةٌ من **يسار** الصورة، فتُكتب ‎left‎ مادّيّةً —
       ولو كُتبت ‎inset-inline-start‎ لَانقلبت في الكتابة من اليمين فوقعت الأقنعةُ في غير موضعها */
    const msk = p.shapes.map(s => {
      const off = open && s.q !== false;
      return `<i class="sh-msk${off ? ' is-off' : ''}" style="left:${(s.l * 100).toFixed(3)}%;`
        + `top:${(s.t * 100).toFixed(3)}%;width:${(s.w * 100).toFixed(3)}%;height:${(s.h * 100).toFixed(3)}%;`
        + `background:${esc(s.c)}${s.k === 'ell' ? ';border-radius:50%' : ''}"></i>`;
    }).join('');
    return `<span class="sh-io">${p.html}${msk}</span>`;
  }
  /* ---- «الفراغ»: السؤالُ فراغاتٌ مسطَّرةٌ مرقَّمة، والجوابُ الكلماتُ المنزوعةُ بأرقامها ---- */
  const SH_CZ = /\{\{\s*c\s*[0-9٠-٩]+\s*::([\s\S]*?)\}\}/g;
  function shCloze(n) {
    const words = [];
    const q = String(n.f || '').replace(SH_CZ, (m, inner) => {
      const cut = inner.indexOf('::');                 /* ‎::‎ تلميحٌ يظهر مكان الفراغ */
      const tx = cut >= 0 ? inner.slice(0, cut) : inner;
      const hint = cut >= 0 ? inner.slice(cut + 2) : '';
      words.push(tx);
      return `<span class="sh-blank">${hint || ''}<i>${words.length}</i></span>`;
    });
    return { q, a: words.map((w, j) => `<span class="sh-ans"><i>${j + 1}</i>${w}</span>`).join('') };
  }
  /* ---- صفٌّ واحد: النوعُ يُقرأ من ‎cxKindOf‎ نفسِها لا من نسخةٍ عنها ---- */
  function sheetRow(n) {
    const k = cxKindOf(n);
    if (k === 'q') {
      const o = shOpts(n), ok = typeof n.ok === 'number' ? n.ok : -1;
      return {
        q: (n.f || '') + (o.length ? `<ol class="sh-opts">${o.map((x, j) =>
          `<li><b>${SH_LET[j] || j + 1}</b>${x}</li>`).join('')}</ol>` : ''),
        a: ok >= 0 && o[ok] ? `<b class="sh-ok">${SH_LET[ok] || ok + 1}</b>${o[ok]}` : '',
      };
    }
    if (k === 'cloze') return shCloze(n);
    if (k === 'io') return { q: shIo(n, false), a: shIo(n, true) };
    return { q: n.f || '', a: n.b || '' };
  }

  /* ============================================================
     الترقيم: يُقاس ولا يُخمَّن
     ============================================================
     صفُّ صورةٍ ليس كسطرِ نصّ — وثلثا بطائقك صورٌ. فلا يصحّ عدُّ الصفوف عدًّا: تُبنى
     الصفوفُ في مقياسٍ خفيٍّ **بعرض الورقة الحقيقيّ**، ويُجمع ارتفاعُها حتى تفيض
     المساحةُ المطبوعة فتُفتح ورقة. والمليمترُ يُترجم إلى بكسل من عرض المقياس نفسِه،
     فيصحّ الحسابُ مهما تبدّل تكبيرُ المتصفّح. */
  const SH_PRINT_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="7.5" rx="2"/><path d="M7 14h10v6.5H7z"/></svg>';
  const SH_W = 210, SH_H = 297, SH_PAD = 14;   /* A4 بالمليمتر وحاشيتُها */
  function sheetPaginate(secs, gauge) {
    const px = gauge.getBoundingClientRect().width / (SH_W - SH_PAD * 2);   /* بكسل لكلّ مليمتر */
    /* ولمّا رُفعت الترويسةُ الجارية عادت مساحتُها إلى الصفوف: الحدُّ جوفُ الورقة كلُّه،
       ولا يُطرح منه إلّا فسحةُ أمانٍ صغيرةٌ تحمي من فيضِ كسرٍ عشريّ.
       ويُطرح معها **ترويسةُ الجدول**: هي في رأس كلّ ورقةٍ فيها صفوف، فتُقاس مرّةً
       ويُحجز قدرُها — ولو أُهملت لَفاض آخرُ صفٍّ في كلّ ورقةٍ عن حدّها */
    gauge.innerHTML = shTblHeadHTML();
    const headH = gauge.getBoundingClientRect().height;
    const limit = (SH_H - SH_PAD * 2) * px - 6 - headH;
    const pages = [[]];
    let h = 0, i = 0;
    const put = (item, html) => {
      gauge.innerHTML = html;
      const eh = gauge.getBoundingClientRect().height;
      /* لا تُفتح ورقةٌ جديدةٌ لعنصرٍ أوّلَ ورقة: لو زاد وحدَه عن المساحة فليفضْ ولا يدور */
      if (h + eh > limit && pages[pages.length - 1].length) { pages.push([]); h = 0; }
      pages[pages.length - 1].push(item);
      h += eh;
    };
    /* ===== غلافُ القسم ورقةٌ وحدَه =====
       كان القسمُ يُفتتح بترويسةٍ في متن الورقة، فيلتقي رأسُ الباب بأوّل بنوده في سطرين
       متجاورين. والغلافُ يفصل: ورقةٌ بيضاءُ فيها رمزُه واسمُه وعددُه لا غير — كصفحة الباب
       في الكتاب المطبوع. فيُطوى ما قبله، ويُبدأ ما بعده في ورقةٍ جديدة.
       ولا يُقاس: الغلافُ لا يزاحمه شيءٌ في ورقته، فلا حاجة إلى وزنه */
    secs.forEach(s => {
      if (pages[pages.length - 1].length) pages.push([]);
      pages[pages.length - 1].push({ t: 'cover', s });
      pages.push([]); h = 0;
      s.cards.forEach(n => { i++; const r = sheetRow(n); put({ t: 'row', n, i, r }, shRowHTML(i, r)); });
    });
    gauge.innerHTML = '';
    return pages.filter(p => p.length);   /* مجلدٌ بلا بطائقَ مباشرةٍ يترك ورقةً خاوية */
  }
  /* وجهُ المجلد بلونه — الإيموجي إن اختاره صاحبُه وإلّا فرمزُ المجلد */
  const shFolderIc = f => `<i style="color:${folderColor(f)}">${folderFace(f)}</i>`;
  /* ============================================================
     غلافُ القسم — الشجرةُ المقصوصة (‎sheet-path-lab‎)
     ============================================================
     كان الغلافُ سطرَ آباءٍ صغيرًا فوق اسمٍ كبير، فيقول «أين أنا» و«ما هذا» ولا يقول
     «وما حولي». فصار **شجرةً مقصوصة**: مسارُ المجلد صاعدًا، ومعه إخوتُه وحدَهم —
     بلا أعمامٍ ولا ذرّيّة. فتُقرأ الورقةُ موضعًا في كتابٍ لا عنوانًا معلّقًا.
     والمرساةُ اسمُ القسم لا الكتلة: يُثبَّت في مركز الورقة، ويُعلَّق الآباءُ فوقه
     (‎bottom:100%‎) والإخوةُ تحته (‎top:100%‎) — فلا ينزاح العنوانُ بكثرة الآباء ولا
     بكثرة الإخوة، وهو الشيءُ الوحيد الذي يجب ألّا يتحرّك.
     ===== ولكلّ موقعٍ عدّادُه: كلُّ صفٍّ يجيب السؤالَ الذي يُسأل عنه =====
     · الأبُ المباشر — ظرفُ الورقة، والسؤالُ عنده كامل: أين موضعُ هذا القسم منه؟
       فيُفصَّل «مجلداتُه · كلّ · جذر · تبع».
     · من فوقه — سياقٌ بعيد: مجلداتُه وما في جذره.
     · القسمُ نفسُه — الصفحاتُ التي تليه أسئلتُه هو، فرقمُ جذره وحدَه.
     · إخوتُه — لستَ فيهم، فالمجموع: بابٌ لم تدخله يُقاس بجملة ما تحته. */
  /* وعددُ المجلدات هنا **مباشرٌ لا عميق** بخلاف ‎countFolders‎: الأبُ يقول «كم بابًا
     فيّ» وأبوابُه هي القسمُ وإخوتُه المرسومون تحته — فرقمٌ عميقٌ يكذّبه ما تراه العين */
  const countFoldersOwn = nodes => (nodes || []).filter(n => n.t === 'f').length;
  const shCnt = n => ({ nf: countFoldersOwn(n.ch), a: countLeaf(n.ch), o: countLeafOwn(n.ch) });
  const shPair = (ic, v) => `<span class="sh-ct${v ? '' : ' is-nil'}">`
    + `<i class="sh-ci">${ic}</i><b>${v}</b></span>`;
  const shNum = (v, w) => `<b>${v}<em>${w}</em></b>`;
  /* والتفصيلُ وحدَه يلبس الألفاظ: أرقامُه ثلاثةٌ يُفرَّق بينها، وما عداه رقمٌ لكلّ
     رمزٍ فرمزُه يقول ماذا يَعُدّ. والألفاظُ من ‎cxEqW‎ نفسِها فتنقلب مع لغة الموقع */
  function shCovCnt(kind, c) {
    if (kind === 'cur') return `<span class="sh-cnt">${shPair(PK_IC.card, c.o)}</span>`;
    if (kind === 'sib') return `<span class="sh-cnt">${shPair(PK_IC.card, c.a)}</span>`;
    if (kind !== 'par') return `<span class="sh-cnt">${shPair(PK_IC.folder, c.nf)}${shPair(PK_IC.card, c.o)}</span>`;
    const t = c.a - c.o, bar = '<i class="sh-cb"></i>', W = T().cxEqW;
    const nil = v => (c.a && !v) ? ' class="is-nil"' : '';
    return `<span class="sh-cnt">${shPair(PK_IC.folder, c.nf)}`
      + `<span class="sh-ct${c.a ? '' : ' is-nil'}"><i class="sh-ci">${PK_IC.card}</i>`
        + `${shNum(c.a, W.a)}${bar}<span${nil(c.o)}>${shNum(c.o, W.r)}</span>`
        + `${bar}<span${nil(t)}>${shNum(t, W.f)}</span></span></span>`;
  }
  const shCoverHTML = s => {
    const path = s.path || [];
    const up = path.slice(0, -1), own = path[path.length - 1];
    const sibA = s.sibA || [], sibB = s.sibB || [];
    /* الإزاحاتُ منسوبةٌ إلى المرساة: الأبُ الذي يعلوها بدرجةٍ يزحف إلى جهة البدء
       بدرجةٍ واحدة، والإخوةُ يستوون معها على خطٍّ واحد (ولهم إزاحتُهم الخاصّة) */
    const row = (kind, off, ic, nm, c) =>
      `<div class="sh-lv${kind === 'cur' ? ' is-on' : ''}${kind === 'sib' ? ' is-sib' : ''}"`
      + ` style="margin-inline-start:calc(var(--shk-ind) * ${off}${kind === 'sib' ? ' + var(--shk-soff)' : ''})">`
      + `<span class="sh-fic">${ic}</span><span class="sh-lvnm">${nm}</span>${shCovCnt(kind, c)}</div>`;
    const nmOf = f => esc(f.name || T().pkTitlePh);
    const sib = f => row('sib', 0, shFolderIc(f), nmOf(f), shCnt(f));
    /* والكتلةُ العليا تجمع الآباءَ ثمّ من سبق القسمَ من إخوته — فيقع الأبُ المباشر
       فوق أوّلهم، ويقع القسمُ في موضعه من الصفّ كما هو في الرزمة */
    const above = up.map((f, i) => row(i === up.length - 1 ? 'par' : 'anc',
      -(up.length - i), shFolderIc(f), nmOf(f), shCnt(f))).join('') + sibA.map(sib).join('');
    const below = sibB.map(sib).join('');
    /* والجذرُ رمزُه كتابُ المادة، وعددُه بطائقُه المنثورة: لا مجلداتٍ تحته ولا ذرّيّة */
    const curIc = s.root ? bookMini(cmCode, imgOf(cmCode)) : shFolderIc(own);
    const curC = s.root ? { nf: 0, a: s.total, o: s.total } : shCnt(own);
    return `<div class="sh-cover"><div class="sh-cov">
        ${above ? `<div class="sh-cov__up">${above}</div>` : ''}
        ${row('cur', 0, curIc, esc(s.name), curC)}
        ${below ? `<div class="sh-cov__dn">${below}</div>` : ''}
      </div></div>`;
  };
  /* ===== حارسُ الفيض: لا تخرج الشجرةُ عن الورقة مهما عمقت أو كثر إخوتُها =====
     المرساةُ في مركز الورقة، فما فوقها وما تحتها لا يزيد كلٌّ منهما على نصف الجوف.
     فتُقاس أبعادُ الأطراف الأربعة **عن مركز المرساة**، ويُؤخذ أصغرُ نسبةٍ تُدخلها
     كلَّها ثمّ تُطبَّق تصغيرًا حول المركز نفسِه — فيبقى العنوانُ في مكانه ويتقارب ما
     حوله. والنسبةُ لا تتأثّر بتصغير الورقة (‎--sh-sc‎): البسطُ والمقامُ يُضربان فيه معًا */
  function shCovFit(root) {
    root.querySelectorAll('.sh-cover').forEach(cov => {
      const wrap = cov.querySelector('.sh-cov');
      if (!wrap) return;
      wrap.style.setProperty('--fit', 1);
      const parts = [wrap].concat([...wrap.querySelectorAll('.sh-cov__up,.sh-cov__dn')]);
      const c = cov.getBoundingClientRect(), a = wrap.getBoundingClientRect();
      const cx = a.left + a.width / 2, cy = a.top + a.height / 2;
      let up = 0, dn = 0, st = 0, en = 0;
      parts.forEach(p => { const r = p.getBoundingClientRect();
        up = Math.max(up, cy - r.top); dn = Math.max(dn, r.bottom - cy);
        st = Math.max(st, cx - r.left); en = Math.max(en, r.right - cx); });
      const hH = c.height / 2, hW = c.width / 2;
      const f = Math.min(1, hH / (up || 1), hH / (dn || 1), hW / (st || 1), hW / (en || 1)) * .96;
      wrap.style.setProperty('--fit', (f < 1 ? f : 1).toFixed(3));
    });
  }
  /* الأعمدةُ تُعرَّف مرّةً: الترويسةُ والصفوفُ جداولُ مستقلّة، فلو افترق تعريفُها لَانحرفت
     خاناتُها بعضًا عن بعض */
  const SH_COLS = '<colgroup><col class="n"><col class="q"><col class="a"></colgroup>';
  const shRowHTML = (i, r) => `<table class="sh-tbl">${SH_COLS}
      <tbody><tr><td class="n">${i}</td><td class="q">${r.q}</td><td class="a">${r.a}</td></tr></tbody></table>`;
  const shTblHeadHTML = () => `<table class="sh-tbl sh-tbl--h">${SH_COLS}
      <thead><tr><th class="n">${esc(T().shColN)}</th><th>${esc(T().shColQ)}</th>
      <th>${esc(T().shColA)}</th></tr></thead></table>`;

  /* ============================================================
     جسمُ الورقة داخل نافذة البطائق — لا يُلمس CSS النافذة
     ============================================================ */
  function renderSheetDlg() {
    const st = cdStage();
    if (!st) return;
    const card = st.querySelector('.mmodal__card');
    if (!card) return;
    const secs = cardDlg.secs || [];
    const nc = secs.reduce((a, s) => a + s.cards.length, 0);

    /* الهيكلُ يُبنى مرّةً: إعادةُ بنائه في كلّ تحديثٍ حيٍّ تقطع التمرير من تحت العين */
    if (!card.classList.contains('is-sheet')) {
      card.classList.add('is-sheet');
      card.dataset.sh = shSkin();
      /* ومِسطرةُ التقريب فوق الورق: أصنافُها أصنافُ مِسطرة البطاقة (‎cd-zb‎/‎cd-zval‎) لا
         نظيرةٌ لها — فترث مستمعَها وحسابَها و‎Ctrl+0‎ بلا سطرٍ يُكتب، ويستحيل أن يفترق
         سلوكُ النافذتين. و‎sh-zbar‎ لا يزيد إلّا الموضع: لاصقةٌ في رأس المسرح لا نتوءٌ فوق حقل */
      card.innerHTML = `<div class="cd-meta" id="cd-meta"></div>
        <div class="cd-body sh-body"><div class="sh-gauge" aria-hidden="true"></div>
          <span class="cd-zbar sh-zbar">
            <button type="button" class="cd-zb" data-zs="-1">−</button>
            <b class="cd-zval">100%</b>
            <button type="button" class="cd-zb" data-zs="1">+</button>
          </span>
          <div class="sh-roll"></div></div>
        <div class="cd-foot sh-foot" id="cd-foot"></div>`;
    }
    const meta = card.querySelector('.cd-meta'), roll = card.querySelector('.sh-roll'),
      gauge = card.querySelector('.sh-gauge'), foot = card.querySelector('.cd-foot');

    /* الترويسةُ العليا: اسمُ الورقة وعدّادُها، ثمّ أزرارُ النافذة — تُبنى هنا كما تُبنى
       في البطاقة، فتقع على خطٍّ واحدٍ مع ما فيها */
    card.dataset.sh = shSkin();
    meta.innerHTML = `
      <div class="cd-bar">
        ${cdWinBtns()}
        ${shSkinBtn()}
      </div>
      <div class="cd-mid sh-mid">
        <span class="sh-ttl">${CX_BAR_IC.sum}<b>${esc(T().shTitle)}</b></span>
        <span class="sh-sub">${esc(T().shSub(nc, secs.length))}</span>
      </div>`;

    /* ومقاسُ الورقة يتبع النافذة لا العكس: تُصغَّر النافذةُ فتنكمش الورقةُ لتسعها،
       فلا فيضٌ أفقيّ أبدًا مهما ضاقت. ويُعاد الحسابُ عند كلّ توسيعٍ بمرقابِ مقاس */
    if (!card._shFit) {
      /* ولا يُقاس إلّا إذا تبدّل **إطارُ** المسرح: تصغيرُ الورقة يبدّل جوفَه (يظهر شريطُ
         تمريرٍ أو يغيب) فيوقظ المرقابَ، فيقيس فيصغّر فيوقظ… دورةٌ تلتهم الإطارات.
         والإطارُ (‎borderBoxSize‎) لا يتبدّل إلّا بتوسيع النافذة — وهو وحده ما يعني المُلاءمة */
      card._shFit = new ResizeObserver(es => {
        const b = es[0] && es[0].borderBoxSize && es[0].borderBoxSize[0];
        const key = b ? Math.round(b.inlineSize) + '×' + Math.round(b.blockSize) : '';
        if (key && key === card._shBox) return;
        card._shBox = key;
        shFit(card);
      });
      card._shFit.observe(card.querySelector('.sh-body'));
    }

    const pages = sheetPaginate(secs, gauge);
    /* ===== لا ترويسةَ جاريةً على الورق =====
       كانت كلُّ ورقةٍ تحمل اسمَ المادة و«ملخّص البطائق» ورقمَها من العدد. ورُفعت كلُّها:
       اسمُ المادة مكتوبٌ في ترويسة النافذة فوقها، فذكرُه في كلّ ورقةٍ تكرارٌ لا يُقرأ.
       والترقيمُ خبرٌ عن **الملفّ** لا عن المذاكرة — ومن أراده وجده في شريط النافذة.
       فالورقةُ خلصت لما فيها، وكسبت ما كانت الترويسةُ تأخذه من أعلاها.
       وورقةُ الغلاف تُعرف بصنفها: هي وحدَها التي يتوسّط متنُها ارتفاعَها */
    roll.innerHTML = pages.map(pg => {
      const cover = pg.length === 1 && pg[0].t === 'cover';
      /* وترويسةُ الجدول تُصدَّر في كلّ ورقةٍ فيها صفّ — لا في ورقة الغلاف */
      const head = pg.some(it => it.t === 'row') ? shTblHeadHTML() : '';
      return `<div class="sh-pwrap"><div class="sh-sheet${cover ? ' sh-sheet--cover' : ''}">
        <div class="sh-in">${head}${pg.map(it => it.t === 'cover' ? shCoverHTML(it.s) : shRowHTML(it.i, it.r)).join('')}</div>
      </div></div>`;
    }).join('');
    cdMedPaint(roll);

    foot.innerHTML = `<span class="sh-cnt">${esc(T().shPages(pages.length))}</span>
      <span class="sh-grow"></span>
      <button type="button" class="sh-btn" data-sheet="print">${SH_PRINT_IC}${esc(T().shPrint)}</button>`;
    cardDlg.pages = pages.length;
    shFit(card);
    /* وبعد المُلاءمة: الشجرةُ تُقاس على الورقة بعد أن استقرّ مقاسُها */
    shCovFit(roll);
  }

  /* ===== مقاسُ الورقة من جوف النافذة — **بعديه لا بعدٍ واحد** =====
     الورقةُ ‎210×297mm‎ ثابتةٌ في التخطيط، و‎--sh-sc‎ يُصغّرها بصريًّا. والمليمترُ يُترجَم من
     **المقياس** نفسِه (‎182mm‎) فلا يُخمَّن ولا يتعلّق بتكبير المتصفّح.
     وكان القياسُ بالعرض وحدَه، والورقةُ أطولُ منها عرضًا بنسبة ‎1.41‎ — فتُملأ عرضًا وتفيض
     طولًا، فلا تُرى الورقةُ الأولى كاملةً في نافذةٍ حديثة العهد. فيُؤخذ **أصغرُ**
     المقياسين: ما يسعه العرضُ وما يسعه الطول، فتقع الورقةُ كلُّها في جوفها كما تقع في
     معاينة الطباعة. ومن أراد أكبرَ وسّع النافذة بمقابضها فتكبر معها.
     ===== والمقاسُ حاصلُ ضربين: ما تسعه النافذة × ما طلبته اليد =====
     ‎المُلاءمة‎ (‎_shFitSc‎) حسابُ الآلة، و‎w.zoom‎ إرادةُ المستخدم — و‎100%‎ عنده هو المُلاءمةُ
     نفسُها لا مقاسُ الورق الحقيقيّ: فما يراه أوّلَ ما يفتح هو المئة، وما زاد عليها زيادةٌ
     عمّا رأى. ولو جُعلت المئةُ مقاسَ الورق الحقيقيّ لَفتحت النافذةُ على «‎39%‎» — رقمٌ
     صحيحٌ لا يعني للقارئ شيئًا */
  const shWinOf = card => {
    const st = card && card.closest && card.closest('.cd-stage');
    return st ? cdWins.find(x => x.el === st) : null;
  };
  /* ===== مرساةُ التقريب: ما تحت وسط النافذة يبقى تحته =====
     التقريبُ بلا مرساةٍ يشدّ الورقَ إلى رأس السيل، فتضيع الورقةُ التي كنتَ فيها وتعود
     تبحث عنها بعد كلّ قرصة. فتُقيَّد النقطةُ التي تحت **وسط** النافذة نسبةً من السيل قبل
     التصغير، ثمّ يُزاح التمريرُ بعده حتى تعود تلك النقطةُ إلى الوسط نفسِه.
     ونسبةً لا بكسلًا: البكسلُ يتبدّل بتبدّل المقاس، والنسبةُ لا تتبدّل.
     وقراءتان اثنتان لا غير (قبلُ وبعد) في الإطار الواحد — وقد صار التطبيقُ مرّةً في
     الإطار، فثمنُهما ثابتٌ لا يتضاعف بعدد أحداث العجلة */
  function shAnchor(card, a) {
    const b = card.querySelector('.sh-body'), roll = card.querySelector('.sh-roll');
    if (!b || !roll) return null;
    const bb = b.getBoundingClientRect(), rb = roll.getBoundingClientRect();
    const mx = bb.left + bb.width / 2, my = bb.top + bb.height / 2;
    if (!a) return { x: rb.width ? (mx - rb.left) / rb.width : .5,
                     y: rb.height ? (my - rb.top) / rb.height : 0 };
    b.scrollLeft += (rb.left + a.x * rb.width) - mx;
    b.scrollTop += (rb.top + a.y * rb.height) - my;
    return null;
  }
  /* ===== صنفُ القرصة: طبقةٌ تُستعار ثمّ تُردّ =====
     ‎will-change‎ الدائم يحجز لكلّ ورقةٍ طبقةً في ذاكرة الرسم — ثمنٌ يُدفع في السكون بلا فائدة،
     ويُفسد حدّةَ الحبر. فيُوضع مع أوّل تغيّرٍ ويُرفع بعد سكونٍ قصير: تُركَّب الحركةُ ما دامت
     اليدُ تعمل، ثمّ يُعاد الرسمُ حادًّا حين تكفّ */
  let shZoomT = 0;
  function shBusy(card) {
    card.classList.add('is-zooming');
    clearTimeout(shZoomT);
    shZoomT = setTimeout(() => card.classList.remove('is-zooming'), 220);
  }
  /* ===== الكتابةُ منفصلةٌ عن القياس =====
     ‎shApply‎ تكتب ولا تقيس: تضرب المُلاءمةَ المحفوظة في تقريب اليد وتسطّرها. و‎shFit‎ وحدَها
     تقيس. وبهذا الفصل لا يقرأ التقريبُ تخطيطًا إلّا قراءتَي المرساة — والقراءةُ بين الكتابات
     هي التي تُجبر المتصفّحَ على تخطيطٍ متزامنٍ في كلّ حدث (layout thrashing) */
  function shApply(card, w) {
    if (!card) return;
    const sc = (card._shFitSc || 1) * ((w && w.zoom) || 1);
    if (Math.abs(sc - (card._shSc || 0)) < .002) return;
    const a = shAnchor(card);
    shBusy(card);
    card._shSc = sc;
    card.style.setProperty('--sh-sc', sc.toFixed(3));
    shAnchor(card, a);
  }
  function shFit(card) {
    const body = card && card.querySelector('.sh-body'), g = card && card.querySelector('.sh-gauge');
    if (!body || !g) return;
    const mm = g.getBoundingClientRect().width / (SH_W - SH_PAD * 2);
    /* وحشوةُ المسرح تُقرأ ولا تُقدَّر: ‎clientHeight‎ يشملها، ولها قيمتان مختلفتان
       (‎14‎ أعلى و‎18‎ أسفل) — فطرحُ رقمٍ واحدٍ يجعل الورقةَ تفيض بفارقهما.
       والارتفاعُ من **الإطار** لا من الجوف: التقريبُ يُفيض الورقةَ عرضًا فيظهر شريطُ تمريرٍ
       أفقيٌّ يقضم الجوفَ، فلو قِيس به لَصغُرت المُلاءمةُ فصغُرت الورقةُ فغاب الشريط… دورةٌ لا تقف */
    const cs = getComputedStyle(body);
    const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const availW = body.clientWidth - 26;
    const availH = body.getBoundingClientRect().height - padY - 6;
    if (!mm || availW <= 0 || availH <= 0) return;
    card._shFitSc = Math.max(.28, Math.min(1, availW / (SH_W * mm), availH / (SH_H * mm)));
    shApply(card, shWinOf(card));
  }

  /* ===== الحياة =====
     الورقةُ تقرأ من الشجرة نفسِها لا من نسخةٍ عنها، فما يُكتب في نافذة بطاقةٍ ينزل فيها.
     ولا تُعاد في كلّ ضغطة حرف: الترقيمُ يُقاس بالبكسل وهو ثمنٌ حقيقيّ — فيُمهَل ثمّ
     تُقارَن **بصمةُ** المحدَّد، فإن لم يتبدّل شيءٌ لم يُرسم شيء */
  let shT = null;
  /* ===== والبصمةُ تقول **مَن** في الورقة لا ما في المتون وحدَه =====
     كانت أطوالَ الحقلين والصوابَ — وتلك بصمةُ نصٍّ لا بصمةُ ورقة. وعليها عيبان:
       · بطاقةٌ تنزل في ملفٍّ ورقتُه مفتوحةٌ وهي خاويةُ الحقلين (‎0:0:‎) تُوافق أختًا لها
         في الطول، فيُقرأ الصفُّ الجديدُ كأنّه القديم ولا يُرسم.
       · ومجلدٌ يُسمّى باسمٍ جديدٍ لا يمسّ حرفًا من متن، واسمُه مرسومٌ في غلاف قسمه.
     فيُضاف معرّفُ كلّ بطاقةٍ — فالعضويّةُ خبرٌ كالمتن — واسمُ القسم وطريقُه، وكلاهما
     مكتوبٌ في الغلاف. والثمنُ حروفٌ تُجمع مرّةً كلَّ سكتة، والمقارنةُ كما كانت */
  const shSign = secs => secs.map(s => (s.name || '') + '«'
    + (s.path || []).map(f => f.name || '').join('/') + '»'
    + s.cards.map(n => n.id + ':' + (n.f || '').length + ':' + (n.b || '').length
      + ':' + (n.ok == null ? '' : n.ok)).join('|')).join('#');
  function sheetLive() {
    if (!cdWins.some(w => w.what === 'sheet')) return;
    clearTimeout(shT);
    shT = setTimeout(() => {
      const deck = edPack().deck;
      /* والمطويّةُ لا تُقاس: ‎shFit‎ تقرأ جوفَ نافذةٍ طبقتُها ‎hidden‎ فتخرج بصفرٍ فتنكمش
         الورقةُ إلى لا شيء — وتُرسم عند نشرها فتلحق ما فاتها */
      cdWins.filter(w => w.what === 'sheet' && !w.min).forEach(w => {
        /* ومن مصدر هذه النافذة بعينها: ملفٌّ فُتحت منه، أو تحديدُ الشجرة إن كانت ‎null‎ */
        const secs = sheetSections(deck, w.sel);
        /* ===== وورقةُ الشجرة لا تُفرَّغ بذهاب التحديد =====
           التي فُتحت من شريط التحديد تحمل ‎sel = null‎ فتقرأ ‎cxSel‎ حيّةً، و‎cxSel‎ تُمحى
           لأسبابٍ ليست من شأن الورقة: حذفٌ جمعيٌّ ينتهي بـ‎clear‎، أو تبويبٌ يُبدَّل،
           أو مادّةٌ تُغادَر. فلو رُسمت على خواءٍ لَذهب ما بين يدي القارئ في لحظةٍ لم يطلب
           فيها شيئًا. فالخُلوُّ ههنا خبرٌ عن **ذهاب المصدر** لا عن فراغ الملفّ، فتبقى
           الورقةُ على آخر ما صحّ حتى يُحدَّد شيءٌ ثانيةً.
           وذاتُ التحديد الصريح (‎sel‎ من زرّ البطاقة) تُرسم على خُلوّها: خُلوُّها صدقٌ —
           ملفُّها فرغ من بطائقه */
        if (!secs.length && !w.sel) return;
        const sg = shSign(secs);
        if (sg === w.sign) return;          /* لا شيء تبدّل — فلا قياسَ ولا رسم */
        w.secs = secs; w.sign = sg;
        /* ‎renderSheetDlg‎ تكتب معرّفاتٍ حيّةً (‎#cd-meta‎ · ‎#cd-close‎)، والحيُّ منها
           للمركَّزة وحدَها. فإذا رُسمت نافذةٌ غيرُ مركَّزةٍ رُدَّت معرّفاتُها إلى ‎data-id‎
           بعد الرسم — وإلّا صار في الصفحة ‎#cd-close‎ مرّتين فسبق الميّتُ الحيَّ */
        const keep = cardDlg;
        cardDlg = w; renderSheetDlg(); cardDlg = keep;
        if (w !== keep) cdIdMove(w.el, false);
      });
    }, 260);
  }
  document.addEventListener('input', e => { if (e.target.closest('#card-modal')) sheetLive(); });
  /* الطباعة: الجسمُ يلبس صنفًا فتُخفى الصفحةُ كلُّها إلا أوراقَ الورقة المركَّزة —
     ويُنزع بعد الرجوع من الحوار مهما كان مصيرُه */
  document.addEventListener('click', e => {
    if (!e.target.closest('#card-modal [data-sheet="print"]')) return;
    /* المسرحُ من الزرّ المضغوط لا من المركَّزة: قد تُضغط طباعةُ نافذةٍ ليست في البؤرة */
    const st = e.target.closest('.cd-stage'); if (!st) return;
    st.classList.add('sh-print');
    document.body.classList.add('sh-printing');
    const off = () => { document.body.classList.remove('sh-printing'); st.classList.remove('sh-print'); };
    addEventListener('afterprint', off, { once: true });
    setTimeout(() => { print(); setTimeout(off, 400); }, 30);
  });

  /* ===== مسرحُ الورقة **مستنسَخٌ دائمًا** =====
     ‎cdWinEl‎ تعطي المسرحَ الأصليَّ (‎cdBase‎) لأوّل نافذة، والورقةُ تستبدل ما فيه بجسمها —
     فلو أخذته لَفقد هيكلَ البطاقة (‎#cd-front‎ وأخواته) فلم تُفتح فيه بطاقةٌ بعدها أبدًا.
     والمستنسخُ يُنزع من الصفحة عند الإغلاق (‎cdCloseWin‎/‎closeCardDlg‎) فلا يُخلّف أثرًا */
  function shWinEl(born) {
    /* والمسرحُ الأصليُّ يُطوى إن لم تسكنه نافذة: طبقتُه في الصفحة **ظاهرةٌ ابتداءً** —
       لأنّ ‎openCardDlg‎ تُسكنها أوّلَ نافذةٍ دائمًا فلا تُرى خاوية. فلمّا استُنسخ للورقة
       بقيت الأصليّةُ ظاهرةً ببطاقةٍ خاويةٍ لا حياةَ فيها: نافذةٌ لا تُمسك ولا تُغلق */
    /* ===== ولا تُنزع طبقتُه وحدَها بل **معرّفاتُه** معها =====
       ‎closeCardDlg‎ تردّ المعرّفاتِ الحيّةَ إلى الأصليّ عند آخر إغلاق عمدًا، ليبقى
       ‎$('#cd-front')‎ صادقًا والنافذةُ مغلقة. فإذا استُنسخ مسرحٌ بعد ذلك اجتمع في
       الصفحة ‎#cd-meta‎ مرّتين: في المطويّ وفي الجديد — و‎querySelector‎ تأخذ الأوّلَ
       في ترتيب الصفحة، وهو المطويّ. فيُرسم كلُّ شيءٍ في نافذةٍ لا تُرى، وتبقى المرئيّةُ
       خاويةَ الترويسة والألسنة.
       ولم تكشفه الورقةُ لأنّها لا تسأل بالمعرّفات أصلًا: ‎renderSheetDlg‎ تنطلق من
       مسرحها (‎cdStage()‎) فتصيب مهما تعدّدت المعرّفات — فسلِمت وهي على العلّة نفسِها */
    if (!cdWins.some(w => w.el === cdBase)) { cdIdMove(cdBase, false); cdLayer(cdBase).hidden = true; }
    const lay = CD_PROTO.cloneNode(true);
    const el = lay.querySelector('.cd-stage');
    cdIdMove(el, false);
    /* ===== والمولودةُ مطويّةً تُخفى **قبل** أن تُلحق =====
       كانت تُلحق ظاهرةً ثمّ تُخفى في السطر التالي، فتدخل حسابَ التخطيط ثمّ تخرج منه.
       وفتحةُ عُصبةٍ تلد عشرًا، فعشرُ دخلاتٍ وعشرُ خرجات في مهلةٍ واحدة.
       و‎born‎ تقول ما ستكون عليه ساعةَ ميلادها: ‎'min'‎ مطويّةٌ لا تُبصر */
    lay.hidden = born === 'min';
    document.getElementById('card-modal').appendChild(lay);
    return el;
  }
  /* ============================================================
     نافذةُ الوجه — السؤالُ كما يُرى في المذاكرة لا كما يُحرَّر
     ============================================================
     نوعٌ ثالثٌ في الصدَفة نفسِها (‎what: 'face'‎) كما كانت الورقةُ ثانيًا: يرث المكدَّسَ
     والسحبَ والتكبيرَ والإغلاق بلا سطرٍ من هندستها.
     وهي **معاينةٌ لا محرَّر**: لا حقولَ تُكتب ولا ختمَ نسخةٍ ولا نشرَ ولا حفظ. وذلك
     يقع من نفسِه لا بمنعٍ يُكتب: النافذةُ بلا ‎id‎، فـ‎cdNode()‎ تردّ ‎null‎ و‎cdCommit‎
     تُعطّل نفسَها — فما لا يُرسم لا يُحفظ.
     وواحدةٌ تكفي: ضغطُ وجهٍ آخرَ يبدّل ما فيها ولا يفتح ثانيةً، فلا تتكاثر النوافذُ
     بعدد الفراغات. */
  function czFaceOpen(id, k, pid) {
    const r = findNode(edPack().deck, id);
    if (!r || !r.n) return;
    const n = r.n;
    /* ===== والصدَفةُ تُكشف **قبل** كلّ شيء =====
       كانت تُكشف في آخر سطر، فيجري ما قبلها كلُّه في شجرةٍ ‎display:none‎ — وكلُّ قياسٍ
       فيها صفر. وهذا يمسّ الشريطَ بعينه: المصالحةُ تُدعى في أثنائه، فإن نقص لسانٌ صنعته
       وقاسته صفرًا فثبّتته على عرضٍ معدوم — فلا يظهر. وتمسّ سواه: مُلاءمةُ المسار
       والقائمةُ والظلُّ ومصفوفةُ النشر، كلُّها تسأل الصفحةَ عن مقاسٍ وهي لا تُبصر.
       فالكشفُ أوّلًا ثمّ البناء: لا يُرى منه شيءٌ قبل انتهاء الشوط، فلا وميضَ ولا كلفة */
    document.getElementById('card-modal').hidden = false;
    /* ===== ولكلّ وجهٍ نافذتُه — نُقض «واحدةٌ تكفي» =====
       كانت معاينةٌ واحدةٌ تُبدَّل بمحتواها: تضغط وجهًا فيحلّ محلَّ الذي قبله في النافذة
       نفسِها. وذلك يمنع أمرين أرادهما صاحبُ الموقع: أن تُقارن وجهين جنبًا إلى جنب،
       وأن يكون لكلٍّ لسانُه في الحافّة يُطوى إليه ويُنشر منه — واللسانُ خبرٌ عن **نافذة**،
       فما دامت النوافذُ واحدةً فاللسانُ واحد.
       فصارت هويّةُ المعاينة زوجًا لا صفةً: **البطاقة ورقمُ وجهها**. فالوجهُ الثاني من
       بطاقةٍ أختُ الأوّلِ لا بديلُه، والأمُّ (نافذةُ التحرير) منفصلةٌ عنهما كلتيهما —
       فتجتمع الثلاثُ على الشاشة ولكلٍّ لسانُها.
       وتُفتح مرّةً واحدة: ضغطُ وجهٍ مفتوحٍ يُركّزه ولا يفتح ثانيًا — وإن كان مطويًّا نُشر
       (‎cdFocusWin‎ تتكفّل بذلك) */
    let w = cdWins.find(x => x.ro && x.id === id && x.faceK === k);
    if (!w) {
      /* ===== ومسرحُها مستنسَخٌ دائمًا (‎shWinEl‎ لا ‎cdWinEl‎) =====
         هي تكتب في المسرح الذي تسكنه: تُفرّغ ذيلَه وتزرع فيه أقفالًا وترفع القلمَ عن
         حقوله. والأصليُّ (‎cdBase‎) مسكنُ أوّل نافذةٍ في كلّ فتحةٍ قادمة، فما يُكتب فيه
         يرثه من بعدها.
         وقد ظهر ذلك عيبًا: تُغلق المقفلةُ فيُترك الأصليُّ مجرّدًا **وطبقتُه ظاهرة**،
         فتُفتح الأمُّ في مستنسَخٍ وتبقى فوقها بطاقةٌ خاويةٌ لا رمزَ فيها ولا زرَّ إغلاق.
         و‎shWinEl‎ مكتوبةٌ لهذا بعينه: تطوي الأصليَّ إن لم تسكنه نافذة، وتستنسخ — والمستنسَخُ
         يُنزع من الصفحة عند الإغلاق فلا يُخلّف أثرًا */
      w = cdWinState(pid || '', n, shWinEl());
      w.ro = true;
      w.faceK = k;   /* جزءٌ من هويّتها، فيُكتب مع ولادتها لا بعدها */
      if (cdWins.length) cdCascade();
      cdWins.push(w);
    } else {
      /* والقائمةُ لا تُبدَّل هويّتُها — هي بعينها ما طُلب. ويُجدَّد ما قد يكون تبدّل
         في البطاقة نفسِها منذ فُتحت (لغتُها ومكانُها)، ويُردّ النظرُ إلى نسختها الحاضرة */
      w.pid = pid || w.pid;
      w.lang = n.lang || w.lang;
      w.viewV = null;
    }
    cdKinOpen(n, pid || w.pid);   /* وأمُّها وأخواتُها ينزلن ألسنةً معها */
    cdFocusWin(w);
    /* ===== والمفتوحةُ من صفٍّ منشورٍ تُملأ بنصّ المنشور =====
       ‎w.pub‎ وسمُ «هذه فُتحت من رزمةِ نشر» (يُكتب في ولادتها أعلاه). فإن كانت في يد
       صاحبها مسوّدةٌ فنصُّها ليس نصَّ القارئ — ويُقرأ من سجلّ النسخة المنشورة.
       ويُحلّ ههنا لا بالعَلَم: العَلَمُ يُرفع لبناءِ شجرةٍ متزامنة، وهذه نافذةٌ تبقى
       مفتوحةً بعد بنائها — فلو تُرك مرفوعًا لَبلغ ما يُرسم بعدها */
    const tx = (w.ro && w.pub && n.pend) ? (cdRec(n, cdPubV(n)) || CX_TX0) : n;
    cdFill(tx.f, tx.b);
    cdRange = null;
    renderCardDlg();
    cdApplyPos();
  }
  /* ===== المتنُ بوجهٍ واحد: فراغُ هذا الوجه بقوسيه، وسائرُها نصٌّ عاديّ =====
     المعروضُ لا المخزون: القوسان يبقيان كما يراهما المؤلّفُ في محرّره (‎{{بط2::…}}‎)
     فيرى ما في جوف الفراغ لا فراغًا مسطَّرًا — هذه نافذةُ تحريرٍ مقفلةٌ لا معاينةُ
     مذاكرة. وأمّا سائرُ الفراغات فتُنزع أقواسُها ويبقى نصُّها، فيُقرأ السطرُ جملةً
     تامّةً لا يعترضها إلّا الفراغُ المقصود.
     والتلميحُ يُطرح مع أقواسه: هو عونٌ على المخفيّ، وما كُشف لا يُعان عليه */
  const czOneFace = (html, k) => String(html || '').replace(CZ_FACE, (s, d, body) => {
    if ((+czDig(d) || 1) === k) return czOpenOf(k) + body + '}}';
    const cut = body.indexOf('::');
    return cut >= 0 ? body.slice(0, cut) : body;
  });
  /* ===== ويُرفع القفلُ عمّا ليس بمقفل =====
     المسرحُ الأوّل (‎cdBase‎) يُعاد استعمالُه: تُغلق المقفلةُ فينزل فيه محرَّرٌ بعدها،
     فلو بقي وسمُها وقفلُها لَوَرِثهما مَن لا شأنَ له بهما. والقاعدةُ في هذا الملفّ:
     من وسم فليمحُ، ومن ألحق ابنًا فليأخذه معه */
  function cdRoClear() {
    const st = cdStage(); if (!st) return;
    const card = st.querySelector('.mmodal__card'); if (!card) return;
    if (!card.classList.contains('is-ro')) return;
    card.classList.remove('is-ro');
    card.querySelectorAll('.cd-rolock').forEach(x => x.remove());
    card.querySelectorAll('.cd-field').forEach(x => x.classList.remove('is-locked'));
    card.querySelectorAll('.cd-in').forEach(el => el.setAttribute('contenteditable', 'true'));
    card.querySelectorAll('.cd-iolay .cd-iom').forEach(m => { m.style.display = ''; });
  }
  /* ===== والقفلُ يُطبَّق بعد كلّ رسم =====
     ‎renderCardDlg‎ تُستدعى من عشرة أبواب، فلو طُبّق مرّةً عند الفتح لَعاد القلمُ عند
     أوّل تركيزٍ أو تبديلِ نافذة. وهو رسمٌ لا حفظ: يقرأ من العقدة ولا يكتب فيها */
  function cdRoApply() {
    const st = cdStage(); if (!st) return;
    const card = st.querySelector('.mmodal__card'); if (!card) return;
    card.classList.add('is-ro');
    /* والقفلُ يعمّ مربّعاتها: لا يُكتب في هذه النافذة حرفٌ أصلًا.
       (وجُرّب أن يبقى «الإضافيّ» مفتوحًا فيها ولكلّ وجهٍ إضافيُّه في خزانةٍ خاصّة —
       فرُدّ: مربّعٌ لا يُقرأ منه شيءٌ في السؤال زيادةٌ في نافذةٍ غرضُها النظر) */
    /* ===== ونافذةُ البطاقة كلِّها تُقفل كلَّها =====
       كان القفلُ لأبناء الجوف المباشرين — وهما الوجهان. وذاك يكفي **نافذةَ وجهٍ**،
       فما ثَمّ غيرُهما. وأمّا بطاقةُ «المتعدّد» فخياراتُها ‎.cd-field‎ في ‎.cd-chs‎ —
       حفيدةٌ لا ابنة — فلم يبلغها المنتقي: تُكتب وتُزاد وتُحذف وقد قيل إنّها مقفلة.
       ===== وشارةُ القفل على الخيار كذلك =====
       كُتب أوّلًا أنّ الخيارات تُقفل **بلا شارة** — «صفٌّ من الأقفال يزاحم النصَّ ويقول
       ما قالته أختُها». ورُدَّ بحكم صاحب الموقع، وحجّتُه أقوى: القفلُ خبرٌ عن **هذا
       المستطيل** لا عن النافذة. فمستطيلٌ بلا شارةٍ بجانب مستطيلٍ عليه شارةٌ يُقرأ
       «هذا مفتوحٌ وذاك مقفل» — وهو نقيضُ الحال. فالاستواءُ أصدقُ من الهدوء */
    const roLock = (fd, badge) => {
      fd.classList.add('is-locked');
      const el = fd.querySelector('.cd-in');
      if (el && el.getAttribute('contenteditable') !== 'false') el.setAttribute('contenteditable', 'false');
      if (badge && !fd.querySelector('.cd-rolock')) {
        fd.insertAdjacentHTML('beforeend', `<i class="cd-rolock" aria-hidden="true">${CD_IC.lock}</i>`);
      }
    };
    card.querySelectorAll('.cd-body > .cd-field').forEach(fd => roLock(fd, true));
    card.querySelectorAll('.cd-body .cd-chs > .cd-field').forEach(fd => roLock(fd, true));
    /* والديكُ ديكُ النافذة لا ديكُ المحرّر: المقفلةُ قد تكون منشورةً أو من رحلتك */
    const r = findNode(cdDeck(), cardDlg.id), n = r && r.n;
    /* ===== وما بعدَه قسمةُ الوجوه =====
       عزلُ قناعٍ واحدٍ في «الإخفاء» وفراغٍ واحدٍ في «الفراغ» معناهما «هذا الوجهُ وحدَه».
       ونافذةُ البطاقة المقفلة تعرض البطاقةَ **كلَّها** — فلو جرى عليها لَحُجبت أقنعتُها
       كلُّها إلّا واحدًا (‎faceK‎ معدومٌ فيها، فالمقارنةُ تُخفي الجميع) */
    if (!cdFaceWin()) return;
    /* ===== وكلُّ نوعٍ يُفرد وجهَه بطريقته =====
       «الفراغ» متنٌ يُكتب: تُنزع أقواسُ سائر الفراغات ويبقى قوسا وجهه.
       و«الإخفاء» صورةٌ تُرى: تُطوى أقنعةُ إخوته فتنكشف، ويبقى قناعُه ساترًا — فيُرى
       السؤالُ كما يراه المذاكر. والثابتُ يبقى في الحالين: سترٌ لا سؤال.
       ولا يُمَسّ متنُ «الإخفاء» بتحويل النصّ: سطورُ الأقنعة مخزنٌ لا متن، فلو مُرّت
       على ‎czOneFace‎ لَانفكّت أقواسُها وظهرت إحداثيّاتٌ مكانَ الصورة */
    if (cardDlg.ctype === 'io') {
      card.querySelectorAll('.cd-iolay .cd-iom').forEach(m => {
        const mn = +m.dataset.n || 0;
        m.style.display = (mn === 0 || mn === cardDlg.faceK) ? '' : 'none';
      });
      return;
    }
    const fe = card.querySelector('.cd-field:first-child .cd-in');
    if (fe && n && cardDlg.ctype === 'cloze') {
      const want = czOneFace(czShow(n.f), cardDlg.faceK);
      if (fe.innerHTML !== want) { fe.innerHTML = want; cdMedPaint(fe); }
    }
  }
  /* ===== فتحُ الورقة: نافذةٌ من نوافذ البطائق، تدخل مكدّسَها وترث هندستَها ===== */
  /* و‎deck‎ سطرٌ لا افتراض: الورقةُ تُبنى من شجرة التحرير حين تُطلب من نافذة البطاقة،
     ومن شجرة النشر حين تُطلب من شريط تحديدها — والافتراضُ يبقى للأولى */
  function cxSumOpen(sel, deck) {
    deck = deck || edPack().deck;
    const secs = sheetSections(deck, sel);
    if (!secs.length) return;
    /* ===== تُظهَر النافذةُ **قبل** الرسم =====
       الترقيمُ يُقاس بالبكسل، و‎getBoundingClientRect‎ على ما هو مخفيٌّ تردّ أصفارًا —
       فلو رُسمت وهي مخفيّةٌ لَصار الحدُّ سالبًا فنزلت كلُّ بطاقةٍ في ورقةٍ وحدها */
    const m = document.getElementById('card-modal');
    if (m) { m.hidden = false; m.classList.remove('is-away'); }
    /* ورقةٌ واحدةٌ تكفي: إن كانت مفتوحةً رُكِّزت وحُدّثت بالتحديد الجديد بدل أن تتكاثر */
    const old = cdWins.find(w => w.what === 'sheet');
    if (old) {
      old.secs = secs; old.sign = shSign(secs); old.sel = sel || null;
      /* ‎renderCardDlg‎ لا ‎renderSheetDlg‎: تلك ترسم الورقةَ وحدَها، وهذه تبني الدُّرجَ
         قبلها ثمّ تنادي تلك — فيبقى «+» حيًّا حين تُستدعى ورقةٌ قائمةٌ من جديد */
      cdFocusWin(old); renderCardDlg();
      return;
    }
    /* ===== وفتحةٌ جديدةٌ تصل الجلدَ بالموقع =====
       ولا يقع ذلك إلّا ههنا: الفرعُ الذي فوقُ تركيزُ ورقةٍ قائمةٍ لا فتحُ أخرى، فلا
       يُنتزع جلدُها من تحت عينِ قارئها. والورقةُ واحدةٌ لا تتكاثر، فبلوغُ هذا السطر
       يقين أنّه لا ورقةَ على الشاشة تُقلب */
    shSkinSes = null;
    const el = shWinEl();
    const w = cdWinState(null, null, el, 'c');
    w.what = 'sheet'; w.picked = true;
    w.secs = secs; w.sign = shSign(secs);
    /* ===== ومصدرُ الورقة يُحفظ فيها لا يُستأنف من الشجرة =====
       الورقةُ **حيّةٌ**: ‎sheetLive‎ تعيد بناءَ أقسامها كلّما تبدّل نصّ. فلو بنتها من
       ‎cxSel‎ أبدًا لَانقلبت ورقةُ الملفّ — التي فُتحت من زرّ البطاقة — إلى تحديد الشجرة
       عند أوّل حرفٍ يُكتب، أو خلت إن لم يكن في الشجرة محدَّد.
       فتحمل النافذةُ تحديدَها معها، و‎null‎ تعني «من الشجرة» كما كانت */
    w.sel = sel || null;
    /* مقاسٌ أوّليٌّ **متواضع**: النافذةُ تُفتح صغيرةً وتُوسَّع بمقابضها إن أُريد — والورقةُ
       تتبعها بـ‎shFit‎ فلا تفيض. وكان ‎760‎ بلا ارتفاعٍ فيمتدّ إلى ‎88vh‎ فيملأ الشاشة */
    w.w = Math.min(innerWidth - 120, 560);
    w.h = Math.min(innerHeight - 140, 620);
    if (cdWins.length) cdCascade();
    cdWins.push(w);
    /* ولا ‎is-arriving‎ ههنا: صنفُ مقدَمٍ يُخفي المسرحَ (‎opacity:0‎) وترفعه حركةُ الطيران
       في ‎cdSpawn‎ — ولا طيرانَ للورقة، فلو وُضع لبقيت شفّافةً أبدًا وظهرت العتمةُ وحدَها */
    cdFocusWin(w);
    renderCardDlg();
    cdApplyPos(); cdApplySize();
    /* والمقاسُ يُطبَّق بعد الرسم، فيُعاد ضبطُ الورقة على العرض الحقيقيّ لا على الافتراضيّ */
    shFit(w.el.querySelector('.mmodal__card'));
  }
  /* ===== ورقةُ البطاقة التي بين يديك: تُبنى من **ملفّها** لا من تحديد الشجرة =====
     الزرُّ في الشريط السفليّ يسأل: «أرِني الورقةَ التي أنا فيها». وجوابُه ملفُّ البطاقة
     (‎cardDlg.pid‎)، فإن لم يكن لها ملفٌّ فهي في الجذر — والجذرُ ليس مجلدًا له معرّف،
     فيُجمع بنو الرزمة المباشرون من غير المجلدات، وهم الذين تبني منهم ‎sheetSections‎
     قسمَ «الجذر». وبهذا تُفتح الورقةُ نفسُها التي تُفتح من شريط التحديد لو حدَّدتَ الملفّ */
  function cdSumSel(deck) {
    const pid = cardDlg && cardDlg.pid;
    if (pid) return new Set([pid]);
    return new Set((deck || []).filter(n => n.t !== 'f').map(n => n.id));
  }
  function cdSumOpen() {
    if (!cardDlg) return;
    /* ما في الحقلين ينزل في البطاقة أوّلًا: الورقةُ صورةُ الرزمة، فلا تُصوَّر قبل أن يُحفظ
       آخرُ حرفٍ كتبتَه — وإلّا رأيتَ في الورقة ما تجاوزتَه في النافذة */
    cdCommit();
    const deck = edPack().deck, sel = cdSumSel(deck);
    /* والزرُّ لا يُترك ميّتًا: بطاقةٌ لم تنزل في ملفّها بعدُ لا ورقةَ لها، فيُقال ذلك
       ولا يُضغط في فراغ */
    if (!sheetSections(deck, sel).length) { toast(T().cdSumNone); return; }
    cxSumOpen(sel);
  }
  const VT_IND = 26;   /* إزاحة المستوى في المحرر — موحّدة عمدًا ليصير حساب الدرجة خطّيًّا مقروءًا */
  /* ===== وفي «البطائق» إزاحةٌ أوسع: البنون يبدؤون من **اسم** أبيهم لا من تحت أيقونته =====
     صفُّ المجلد يتقدّمه مثلّثُ الطيّ ثمّ أيقونتُه، فاسمُه يبدأ بعدهما. والبندُ تحته يتقدّمه
     مقبضُه ثمّ أيقونةُ نوعه. فبالإزاحة القديمة كانت أيقونةُ الابن تقع تحت **أيقونة** الأب،
     فيُقرأ الابنُ في عمود الأيقونات لا في عمود الأسماء — والعينُ تتبع الأسماء.
     والمقدارُ مقيسٌ لا مختار: بعد أن خرج سهمُ الطيّ من جريان الصفّ صار اسمُ المجلد يبدأ
     بعد رمزه بـ‎21px‎ (رمزٌ ‎16‎ وفجوةٌ ‎5‎)، وهي المسافةُ التي ينزل بها بنوه.
     و«الشروح» على إزاحتها — لم يُطلب فيها شيء، وإن تشابه الصفّان.
     والسحبُ يقرأ الإزاحةَ نفسَها من شجرته، وإلّا اختلف خطُّ الإدراج عمّا تراه العين */
  const CX_IND = 21;
  const indOf = host => (host && host.closest && host.closest('#cm-cards, #nk-road')) ? CX_IND : VT_IND;
  /* ===== ومحرّكُ السحب صار يخدم شجرتين =====
     كان يقرأ ‎edPack().deck‎ رأسًا — أي «ديكُ المساهمة التي تُحرَّر». ثمّ وُلدت «رحلتي»
     في الرَّكن: شجرةٌ تملكها أنت، بالصفوف نفسِها والمقبض نفسِه، وديكُها ‎entry.road‎.
     فلو بقي المحرّكُ يسأل ‎edPack()‎ لَسحبتَ في رحلتك فانتقلت عقدةٌ في رزمة مساهمةٍ
     أخرى — أو لم ينتقل شيءٌ وبقي الصفُّ يرقص بلا أثر.
     فيُسأل **الحاضنُ** عن مالكه: هذا هو الفرقُ الوحيد بين الشجرتين في المحرّك،
     وما سواه (‎vtFlat‎ · ‎vtProject‎ · الخطُّ والعتبة) واحدٌ لا يُنسخ */
  const vtIsRoad = host => !!(host && host.closest && host.closest('#nk-road'));
  const vtDeckOf = host => vtIsRoad(host) ? roadOf(nookEntry, true) : edPack().deck;
  const vtRedraw = host => { if (vtIsRoad(host)) roadRender(); else edRender(); };
  let vtFocused = null;   /* المادة التي وُضع فيها المؤشّر عند فتح التحرير — تمنع خطف التركيز مرارًا */
  /* تسطيح الشجرة الظاهرة إلى صفوف {id, درجة, أبٌ} — كل الحساب يجري على هذه القائمة لا على DOM */
  function vtFlat(nodes, depth, parentId, out) {
    out = out || [];
    (nodes || []).forEach(n => {
      out.push({ id: n.id, n, depth, parentId });
      if (n.t === 'f' && n.open !== false && (n.ch || []).length) vtFlat(n.ch, depth + 1, n.id, out);
    });
    return out;
  }
  /* موضعُ الخطّ أفقيًّا: إزاحةُ المستوى الذي سيقع فيه البند **كما هو مرسومٌ فعلًا**.
     فإن كان له أخٌ في ذلك المستوى أُخذت إزاحتُه — وهو الغالب. وإن كان مستوًى يُنشأ
     الآن (مجلّدٌ خاوٍ يُفتح له جوف) فإزاحةُ أبيه وزيادةُ درجةٍ واحدة، إذ المستوى
     الجديد يبدأ بمجلّدٍ أو ببطاقةٍ ولا يُعرف بعدُ — والتقديرُ هنا تقديرُ درجة */
  const vtLineX = (s, p, IND) => {
    const i = s.items.findIndex(x => x.parentId === p.parentId);
    if (i >= 0 && s.xs[i] != null) return s.xs[i];
    if (!p.parentId) return 0;
    const pi = s.items.findIndex(x => x.id === p.parentId);
    return (pi >= 0 && s.xs[pi] != null ? s.xs[pi] : 0) + IND;
  };
  /* الإسقاط (خوارزمية dnd-kit للأشجار): الموضع الرأسيّ يحدّد موقع الإدراج،
     والأفقيّ يحدّد الدرجة — ثم تُحصر الدرجة بين ما يسمح به الجاران:
     أقصاها درجةُ ما قبله + ١ (فلا يقفز درجتين)، وأدناها درجةُ ما بعده (فلا يبتر ما تحته) */
  function vtProject(items, overIndex, dragDepth, activeDepth) {
    const prev = items[overIndex - 1], next = items[overIndex];
    /* ===== لا يصير بندٌ ابنًا إلا لمجلد =====
       أقصى الدرجة درجةُ ما قبله **+١ إن كان مجلدًا**، وإلّا فدرجتُه هو. وكانت تُزاد دائمًا،
       فتُقبل البطاقةُ ابنةً لبطاقة وتُدفع في ‎ch‎ لها — والرسمُ لا ينزل إلا في المجلدات
       (‎vtFlat‎ تشترط ‎t==='f'‎)، فتختفي البطاقةُ من الشجرة وهي في البيانات حيّة.
       فالخللُ في الإسقاط لا في الرسم: مُنع من أصله فلا يُعرض خطُّ إدراجٍ لا يصحّ */
    const maxDepth = prev ? (prev.n && prev.n.t === 'f' ? prev.depth + 1 : prev.depth) : 0;
    const minDepth = next ? next.depth : 0;
    let depth = activeDepth + dragDepth;
    if (depth >= maxDepth) depth = maxDepth;
    else if (depth < minDepth) depth = minDepth;
    let parentId = null;
    if (depth && prev) {
      if (depth === prev.depth) parentId = prev.parentId;
      else if (depth > prev.depth) parentId = prev.id;
      else {
        const a = items.slice(0, overIndex).reverse().find(x => x.depth === depth);
        parentId = a ? a.parentId : null;
      }
    }
    return { depth, parentId };
  }

  let vtS = null;   /* حالة السحب الجارية */
  const vtEnd = () => {
    if (!vtS) return;
    if (vtS.ghost) vtS.ghost.remove();
    if (vtS.line) vtS.line.remove();
    (vtS.rows && vtS.rows.length ? vtS.rows : [vtS.row]).forEach(el => {
      if (el) el.classList.remove('vt-dragging');
    });
    document.body.classList.remove('vt-busy');
    vtS = null;
  };
  /* السحب بأحداث المؤشّر لا بـHTML5 DnD: تعمل باللمس، ولا تُخضعنا لصورة السحب الافتراضية،
     ويبقى المؤشّر مقروءًا طوال العملية */
  document.addEventListener('pointerdown', e => {
    if (e.button) return;
    const gr = e.target.closest('.pk--edit .vt-grab');
    if (!gr) return;
    const row = gr.closest('[data-id]');
    const host = gr.closest('.pk--edit .x3');
    if (!row || !host) return;
    e.preventDefault();
    /* بلا setPointerCapture عمدًا: الأحداث تُلتقط على document أصلًا، والالتقاط يعلّق الحالة
       إن أُزيل المقبض من الشجرة أثناء إعادة الرسم — فتبتلع الصفحة كل نقرة بعده */
    vtDragged = false;   /* كلُّ ضغطةٍ تبدأ بريئةً من السحب */
    vtS = { id: row.dataset.id, row, host, x0: e.clientX, y0: e.clientY, on: false, pid: e.pointerId };
  });
  /* ===== ما دون العتبة تحديدٌ لا إهمال =====
     محرّك السحب يفرّق أصلًا بين الضغطة والسحبة بعتبة ‎5px‎، فصُرفت الضغطةُ إلى التحديد
     بلا آلةٍ جديدة ولا عنصرٍ ثانٍ في الصفّ.
     والوصلُ بحدث ‎click‎ لا بـ‎pointerup‎ عمدًا: حالُ السحب ‎vtS‎ تُهدَم في أوّل ‎pointermove‎
     يأتي بـ‎buttons===0‎ (حارسُ الشفاء الذاتيّ من زرٍّ رُفع خارج النافذة) — وهو حدثٌ قد يرد
     والزرُّ مضغوطٌ في بعض البيئات، فتضيع الضغطةُ كلَّها. و‎click‎ يقع بعدهما جميعًا مهما
     هُدمت الحال، فيبقى ‎vtDragged‎ وحدَه هو الفاصل: سُحب فلا تحديد، لم يُسحب فتحديد */
  let vtDragged = false;
  document.addEventListener('click', e => {
    const gr = e.target.closest && e.target.closest('.pk--edit .vt-grab--sel');
    if (!gr || vtDragged) return;
    /* والحارسُ ‎edSec()‎ لشجرة المساهمة وحدَها: هو يسأل «أيُّ لسانٍ مفتوح» — خبرٌ عن
       الشاشة لا عن الشجرة التي تحت إصبعك. وشجرةُ «رحلتي» في الرَّكن ولا لسانَ لها،
       فيُستثنى مقبضُها بحاضنه */
    /* ===== و«الشروح» كأختها =====
       كان الحدُّ ‎edSec() !== 'cards'‎ فيُردّ كلُّ ما ليس بطائق. وعلّتُه أنّ شجرة الشروح
       لم يكن فيها مقبضُ تحديدٍ أصلًا، فالحدُّ كان يحرس من نقرةٍ لا تقع.
       وقد صار فيها، وشجرتُها شجرةُ **تحرير** كأختها (‎edPack()‎ تردّ ديكَها من نفسها)
       — فلا فرقَ يُبقي الحدَّ إلّا العادة */
    const road = !!gr.closest('#nk-road');
    if (!road && edSec() !== 'cards' && edSec() !== 'videos') return;
    const row = gr.closest('[data-id]');
    /* ===== والوسمُ يُمرَّر ولا يُترك للأصل =====
       ‏‎cxToggleSel(id, ro)‎ تمسح التحديدَ إن اختلف ‎ro‎ عن الحال القائمة — «تحديدٌ في
       هذه ليس تحديدًا في تلك». ومستمعُ المحرّر كان يناديها بوسمٍ خاوٍ (‎false‎) لأنّ
       شجرتَه شجرةُ تحرير. وشجرةُ «رحلتي» تُحدَّد تحديدَ **نشر** (‎cxSelRo‎ مرفوعٌ فيها)،
       فلو نودِيت بالخاوي لَمُسح التحديدُ وانقلب الديكُ إلى رزمة المحرّر في أوّل ضغطة */
    if (row) cxToggleSel(row.dataset.id, road, e.shiftKey);
  });
  function vtBegin() {
    const s = vtS, deck = vtDeckOf(s.host);
    const all = vtFlat(deck, 0, null);
    const me = all.find(x => x.id === s.id);
    if (!me) { vtEnd(); return false; }
    /* ============================================================
       والمحدَّدون يُسحبون كتلةً واحدة
       ============================================================
       من حدَّد خمسةً ثمّ جرّ واحدًا منهم لم يقصد أن يُفرده — قصد أن ينقلهم. فتُجمع
       **رؤوسُ التحديد** (‎cxRoots‎: محدَّدٌ لا محدَّدَ فوقه، فالمجلدُ وذرّيتُه وحدةٌ
       واحدة) وتُسحب معًا.
       ‏**وبترتيب الشجرة لا بترتيب الضغط**: ‎all‎ قائمةٌ مسطّحةٌ بترتيب الرسم، فتُقرأ منها
       — «وبنفس الترتيب» بحكم صاحب الموقع.
       ===== وشرطُه أن يكون التحديدُ لهذه الشجرة =====
       ‎cxSel‎ صفٌّ واحدٌ تشترك فيه الأشجار، و‎cxDeck‎ تقول لأيّها هو الآن. فإن كان الديكُ
       غيرَ ديك المضيف فالتحديدُ ليس ههنا — ويُسحب المجرورُ وحدَه.
       ولا يقع البندُ داخل نفسه: تُستبعد الكتلُ كلُّها وذرّيّاتُها من قائمة الإسقاط */
    const mine = (cxSel.size > 1 && cxSel.has(s.id) && cxDeck() === deck)
      ? cxRoots(deck) : [];
    s.pack = (mine.length > 1 && mine.indexOf(s.id) >= 0)
      ? all.filter(x => mine.indexOf(x.id) >= 0).map(x => x.id) : [s.id];
    const drop = new Set();
    s.pack.forEach(id => {
      const r = findNode(deck, id);
      if (r) vtFlat([r.n], 0, null).forEach(x => drop.add(x.id));
    });
    s.items = all.filter(x => !drop.has(x.id));
    s.activeDepth = me.depth;
    s.rects = s.items.map(x => {
      const el = s.host.querySelector(`.x3-hd[data-id="${x.id}"], .x3-ep[data-id="${x.id}"]`);
      return el ? el.getBoundingClientRect() : null;
    });
    /* ===== وإزاحةُ كلّ صفٍّ تُقاس مرّةً هنا =====
       كان خطُّ الإدراج يوضع بـ‎درجة × إزاحة‎ — وذاك يفترض أنّ كلّ درجةٍ تُزيح بمقدارٍ
       واحد. ولم يعد صحيحًا: جوفُ الفصل لا يُزيح أصلًا. (وكان يكذب من قبلُ بمقدار
       حاشية الشجرة نفسِها.) فتُقرأ الإزاحاتُ الحقيقيّةُ في مسحةٍ واحدةٍ مع المستطيلات،
       ثمّ يُقرأ منها موضعُ الخطّ بلا حساب. والقياسُ من صندوق الحدّ للمضيف — وهو مرجعُ
       ‎insetInlineStart‎ للخطّ نفسِه، فلا يفترق المرجعان */
    const hr0 = s.host.getBoundingClientRect();
    const rtl0 = getComputedStyle(s.host).direction === 'rtl';
    s.xs = s.rects.map(r => !r ? null : (rtl0 ? hr0.right - r.right : r.left - hr0.left));
    s.on = true;
    vtDragged = true;   /* سُحب فعلًا — فالضغطةُ التالية ليست تحديدًا */
    document.body.classList.add('vt-busy');
    /* ويخفت المجرورون جميعًا لا المقبوضُ وحدَه: العينُ ترى ما ينتقل */
    s.rows = s.pack.map(id => s.host.querySelector(`.x3-hd[data-id="${id}"], .x3-ep[data-id="${id}"]`))
      .filter(Boolean);
    (s.rows.length ? s.rows : [s.row]).forEach(el => el.classList.add('vt-dragging'));
    /* شبح يتبع المؤشّر: نسخة من الصفّ نفسه فيبقى المسحوب معروفًا طوال الطريق */
    const rr = s.row.getBoundingClientRect();
    const g = s.row.cloneNode(true);
    g.className = 'vt-ghost ' + s.row.className.replace('vt-dragging', '');
    g.style.cssText += `;width:${rr.width}px;left:${rr.left}px;top:${rr.top}px`;
    /* ============================================================
       والشبحُ يخرج من الصندوق الذي يُمرَّر
       ============================================================
       كان يُلحق بالشجرة، وعلّتُه مكتوبةٌ: «ليرث توكنات الجلد فيبقى بلونه». وذلك صوابٌ
       في المحرّر — شجرتُه في ‎#cm-body‎ وتمريرُها تمريرُ الصفحة.
       وأمّا شجرةُ «رحلتي» فتسكن ‎.jr-body‎ وعليها ‎overflow: auto‎. والشبحُ ‎position: fixed‎
       بإحداثيّات **الشاشة** (‎left: rr.left; top: rr.top‎) — فإن حُبس يومًا (سلفٌ فيه
       ‎transform‎ أو ‎filter‎ أو ‎backdrop-filter‎ أو ‎will-change‎ يُنشئ كتلةَ احتواء)
       انقلب محسوبًا من ذلك السلف، فوقع بمئاتِ البكسلات داخل الشجرة — ففاضت ‎.jr-body‎
       وظهر **شريطُ تمريرها**. وهو في ‎rtl‎ على اليسار داخل المربّع، ومضمارُه ثابتٌ
       وإبهامُه يتغيّر حجمًا بتغيّر ارتفاع المحتوى: وذاك ما كان يُرى.
       فيُلحق بـ‎#nook‎: وهو **حاملُ التوكنات** أصلًا (‎--u-*‎ و‎--nk-*‎ معًا) لا الشجرة،
       فالوراثةُ باقيةٌ والفيضُ ذاهب. وخارج ‎.jr-body‎ فلا يبلغه تمريرُها.
       والشجرةُ تبقى مضيفةً في غير الرَّكن، فلا يُمَسّ المحرّر — انظر ‎ROADMAP-JR-DRAGBAR‎ */
    /* وشارةُ العدد على الشبح: شبحٌ واحدٌ وخمسةٌ تنتقل خبرٌ ناقص */
    if (s.pack.length > 1) {
      const b = document.createElement('i');
      b.className = 'vt-ghost__n';
      b.textContent = s.pack.length;
      g.appendChild(b);
    }
    (s.host.closest('#nook') || s.host).appendChild(g);
    s.ghost = g;
    const line = document.createElement('div');
    line.className = 'vt-line';
    s.host.appendChild(line);
    s.line = line;
    return true;
  }
  function vtOver(e) {
    const s = vtS;
    s.ghost.style.transform = `translate(${e.clientX - s.x0}px, ${e.clientY - s.y0}px)`;
    /* موقع الإدراج: أول صفّ يقع منتصفه تحت المؤشّر */
    let over = s.items.length;
    for (let i = 0; i < s.rects.length; i++) {
      const r = s.rects[i];
      if (r && e.clientY < r.top + r.height / 2) { over = i; break; }
    }
    const rtl = getComputedStyle(s.host).direction === 'rtl';
    const dx = rtl ? s.x0 - e.clientX : e.clientX - s.x0;
    const IND = indOf(s.host);   /* إزاحةُ الشجرة التي تُسحب فيها — البطائق أوسع من الشروح */
    const p = vtProject(s.items, over, Math.round(dx / IND), s.activeDepth);
    s.over = over; s.proj = p;
    /* الخطّ يقف عند حدّ الإدراج وإزاحته تقول الدرجة — مؤشّرٌ واحد يحمل المعنيين معًا */
    const hr = s.host.getBoundingClientRect();
    const ref = s.rects[over] || s.rects[s.rects.length - 1];
    const y = !ref ? 0 : (over < s.rects.length ? ref.top : ref.bottom) - hr.top;
    s.line.style.top = y + 'px';
    s.line.style.insetInlineStart = vtLineX(s, p, IND) + 'px';
  }
  document.addEventListener('pointermove', e => {
    if (!vtS) return;
    /* شفاء ذاتيّ: لو رُفع الزرّ خارج النافذة أو ضاع pointerup، تُنهى الحالة عند أول حركة بلا ضغط */
    if (e.buttons === 0) { vtEnd(); return; }
    if (!vtS.on) {
      if (Math.abs(e.clientX - vtS.x0) + Math.abs(e.clientY - vtS.y0) < 5) return;   /* عتبة: لا سحب بنقرة */
      if (!vtBegin()) return;
    }
    e.preventDefault();
    vtOver(e);
  });
  document.addEventListener('pointerup', () => {
    if (!vtS) return;
    const s = vtS;
    if (!s.on || !s.proj) { vtEnd(); return; }   /* نقرة بلا سحب، أو سحب لم يستقرّ على هدف */
    const deck = vtDeckOf(s.host);
    /* والعقدُ تُجمع مراجعَ قبل أن يُنزع منها شيء: النزعُ يزحزح الفهارس، فلو نُزعت
       وأُدخلت واحدةً واحدةً لَتبدّل موضعُ كلّ واحدةٍ بما قبلها */
    const nodes = (s.pack || [s.id]).map(id => findNode(deck, id)).filter(Boolean).map(r => r.n);
    if (nodes.length) {
      const { depth, parentId } = s.proj;
      /* ترتيب البند بين إخوته الجدد: عدد من سبقه منهم في القائمة المسطّحة (بلا الكتلة المسحوبة) */
      const at = s.items.slice(0, s.over).filter(x => x.parentId === parentId).length;
      /* تُنزع كلُّها أوّلًا — و‎findNode‎ تُسأل من جديدٍ لكلّ واحدةٍ لأنّ ما قبلها زحزحها */
      nodes.forEach(n => { const r = findNode(deck, n.id); if (r) r.arr.splice(r.i, 1); });
      const par = parentId ? findNode(deck, parentId) : null;
      /* وحارسٌ أخيرٌ عند الإفلات: لا تُدفع عقدةٌ في غير مجلدٍ مهما قال الإسقاط —
         فلو تسرّب إليه خللٌ يومًا سقط البندُ إلى الجذر ولم يضع في بطنِ ورقة */
      const arr = (par && par.n.t === 'f') ? (par.n.ch = par.n.ch || []) : deck;
      /* و‎at‎ يُقاس على **الباقين**: ‎s.items‎ لا تحوي المجرورين أصلًا، فهو موضعٌ صحيحٌ
         بعد النزع. والإدخالُ دفعةً واحدةً يحفظ ترتيبَهم بينهم */
      arr.splice(Math.min(at, arr.length), 0, ...nodes);
      void depth;
      save();
    }
    vtEnd();
    vtRedraw(s.host);
  });
  document.addEventListener('pointercancel', vtEnd);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && vtS) { vtEnd(); } });

  /* شجرة المحرر بهيئة العرض نفسها (خ٣): الأيقونات والإزاحة والعدّادات كما تظهر بعد النشر —
     إلا خيط الرحلة وعلاماته فلا محلّ لهما هنا، والنصوص حقولُ إدخال بلا إطار */
  /* الترتيب كما هو في البيانات لا «المجلدات أولًا»: الفرز عند الرسم كان يمنع وضع مجلد تحت شرح،
     وكان يفكّ التطابق بين ترتيب الشاشة وترتيب القائمة المسطّحة التي يحسب عليها السحب */
  function vidTreeEdit(nodes, k) {
    k = k || 0;
    /* حكمُ المحطّات ههنا حكمُ نشرِها: **المستوى الأوّل وحدَه** — لا حكمُ البطائق
       (المستوى الحيّ وما فيه مجلّد). فلكلّ بندٍ رحلتُه كما بُنيت له */
    const top = !k;
    return (nodes || []).map(f => f.t !== 'f'
      ? (k ? vidRowEdit(f) : `<div class="x3-st x3-solo" style="--o:0px">${vidRowEdit(f, top)}</div>`)
      : `<div class="x3-st${f.open === false ? '' : ' on'}" style="--o:${X3IND(k)}px">
        ${top ? x3Dot(x3Pct(f.ch)) : ''}
        <div class="x3-hd" data-id="${f.id}">
          ${VT_GRAB(true)}
          <span class="x3-fwrap">
            <span class="x3-fic" style="color:${folderColor(f)}">${PK_IC.folderFill}</span>
            <span class="vt-grow vt-grow--f${f.name ? '' : ' is-ph'}" data-v="${esc(f.name) || T().pkTitlePh}">
              <input class="cx-fname" data-id="${f.id}" size="1" placeholder="${T().pkTitlePh}" value="${esc(f.name)}">
            </span>
          </span>
          <span class="x3-triobox" data-fid="${f.id}">${x3Trio(f.ch)}</span>
          <button type="button" class="cx-fold x3-tg${(f.ch || []).length ? '' : ' is-void'}"${(f.ch || []).length ? ` data-id="${f.id}" title="${f.open === false ? T().pkExpand : T().pkCollapse}"` : ' tabindex="-1" aria-hidden="true"'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <button type="button" class="cx-del" data-id="${f.id}" title="${esc(T().delItem)}" aria-label="${esc(T().delItem)}">${TRASH_IC}</button>
        </div>
        ${(f.open !== false && (f.ch || []).length) ? `<div class="x3-sub" style="--pad:${VT_IND}px">${vidTreeEdit(f.ch, k + 1)}</div>` : ''}
      </div>`).join('');
  }
  /* سهمٌ ينزل إلى خطٍّ — أشهرُ رمزٍ للتنزيل، ولا شبيهَ له في صفّ الشرح */
  const VID_DL_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"'
    + ' stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.4v10.2"/>'
    + '<path d="M8.2 11.2 12 15l3.8-3.8"/><path d="M5 19.2h14"/></svg>';
  const vidRowEdit = (n, top) => {
    const media = n.vt === 'link'
      ? `<input class="vid-in vid-src src-ltr" data-f="v" type="url" placeholder="${T().vidLinkPh}" value="${esc(n.v)}">`
      : `<label class="src-filebtn">${n.fname ? esc(n.fname) : (n.v ? '✓' : T().vidFilePick)}<input type="file" class="vid-file" accept="video/*" hidden></label>`
        /* ===== وبابُ النقل: ينزل الملفُّ **باسم مقصده** =====
           لا تكتب جافا الصفحة على القرص من أصل ‎file://‎، فالنقلُ بيدك. وأثقلُ ما فيه
           أن تُسمّي الملفَّ بيدك (‎p1042.mp4‎) — والخطأُ في حرفٍ يُبطله بلا خبر.
           فيُنزَّل مُسمًّى، ولا يبقى عليك إلّا جرُّه إلى ‎assets/video‎.
           ولا يظهر إلّا ومعه رابطُ الجلسة: بلا ملفٍّ ملتقَطٍ لا شيءَ يُنزَّل */
        + (vidBlob.has(n.id)
          ? `<a class="vid-get" href="${vidBlob.get(n.id)}" download="${esc(String(n.v).split('/').pop())}"
               title="${esc(T().vidPut(String(n.v).split('/').pop()))}"
               aria-label="${esc(T().vidGet)}">${VID_DL_IC}</a>` : '');
    return `<div class="x3-ep vid-row" data-id="${n.id}">
      <!-- محطّةُ الشرح المفرد في المستوى الأوّل — كمحطّة المجلّد سواءً، وكما في ‎x3Ep‎
           بوضع النشر. وكانت ساقطةً: أُخذ المعاملُ ولم يُستعمل في المتن -->
      ${top ? x3Dot(x3Watch(n)) : ''}
      ${VT_GRAB(true)}
      <span class="x3-vic">${n.vt === 'link' ? PK_IC.link : PK_IC.vid}</span>
      <span class="vt-grow vt-grow--v${n.name ? '' : ' is-ph'}" data-v="${esc(n.name || '') || T().pkTitlePh}">
        <input class="vid-in" data-f="name" size="1" placeholder="${T().pkTitlePh}" value="${esc(n.name || '')}">
      </span>
      ${media}
      <span class="vt-grow vt-grow--dur${n.dur ? '' : ' is-ph'}" data-v="${esc(n.dur || '') || T().vidDurPh}">
        <input class="vid-in vid-dur" data-f="dur" size="1" placeholder="${T().vidDurPh}" value="${esc(n.dur || '')}">
      </span>
      <!-- ===== وخبرُ الشرح على صفّه في التحرير كذلك — **قبل السلّة** =====
           وموضعُه من الصفّ موضعُ أخيه في محرّر البطائق حرفًا بحرف (‎cxRowEdit‎): بعد
           المتن وقبل السلّة. فالمحرّران أخوان لا يفترقان في ترتيب صفّهما، ومن عرف
           أحدَهما عرف الآخر.
           ولا يسقط ههنا ما أسقطه محرّرُ البطائق: ذاك رفع **مربّع سجلّك** لأنّه خبرٌ عن
           مذاكرتك لا عن بنائك، وهذه الثلاثةُ خبرُ **الناس** عن شرحك — وهو ممّا يعني
           المؤلّفَ وهو يبني: كم حُفظ وكم رُئي وكم قيل فيه -->
      ${cxNewsHTML('vid', cxNwFacts(n, null), { n })}
      <button type="button" class="cx-del" data-id="${n.id}" title="${esc(T().delItem)}" aria-label="${esc(T().delItem)}">${TRASH_IC}</button>
    </div>`;
  };
  function renderVideos() {
    const d = vidData(cmCode);
    const host = $('#cm-videos');
    if (!host) return;
    cxEdJr = cxJrOn(d);
    host.innerHTML = `<div class="x3${cxEdJr ? '' : ' cx-nojr'}${jrPeekOn ? ' jr-peek' : ''}">${vidTreeEdit(d.deck, 0)}</div>`;   /* أزرار الإضافة انتقلت إلى شريط الأسفل */
    /* والتحديدُ يُطلى بعد البناء كما في محرّر البطائق: الصفوفُ وُلدت من جديدٍ فذهبت
       أصنافُه، والحالُ باقيةٌ في ‎cxSel‎ — فلولا الطِّلاءُ لَبدا التحديدُ ذاهبًا وهو قائم،
       ولَبقيت السلّةُ مخفيّةً على صفٍّ محدَّد */
    cxPaintSel();
    refreshPackBadges();
    cxRailFit();   /* وكذلك ههنا: كلُّ بناءٍ للشجرة يستدعي قياسَ طرفَي خيطها */
    if (jrPeekArm) { jrPeekArm = false; jrPeek(); }
    vtFocusTitle('v');
  }
  /* أول فتح للتحرير: المؤشّر ينتظر في «العنوان» — ومرّةً واحدة فلا يُخطف من يد الكاتب في كل إعادة رسم.
     المفتاح مادةٌ+بند: فلكلٍّ من «الشروح» و«البطائق» دخلته الخاصة */
  function vtFocusTitle(kind) {
    const key = cmCode + ':' + kind;
    if (vtFocused === key) return;
    vtFocused = key;
    const t = $('#cm-vtitle');
    if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
  }
  /* شارات بطاقة التحرير حيّة: العدد والمدة يتبعان الكتابة والإضافة فورًا (بلا إعادة رسم البطاقة) */
  /* العدّادات حيّة: عدّاد الرزمة وعدّاد كل مجلد يتبعان الكتابة والإضافة فورًا بلا إعادة رسم،
     فلا يقفز مؤشّر الكتابة ولا تُفقد حالة الحقول */
  /* عدّادات الرزمة والمجلدات حيّة أثناء التحرير — للبندين معًا (شروح وبطائق) عبر edPack */
  function refreshPackBadges() {
    if (!cmCode) return;
    const kind = edSec() === 'cards' ? 'c' : 'v', d = edPack();
    const b = document.getElementById('cm-vbadges');
    if (b) b.innerHTML = x3Trio(d.deck, kind);
    /* وخبرُ الرأس يُحدَّث معها: شجرةٌ واحدةٌ يقرآنها، فلو تخلّف أحدُهما قالا عددين */
    const nw = document.getElementById('cm-vnews');
    if (nw) nw.innerHTML = cxNewsHTML(kind === 'c' ? 'solo' : 'vid', cxNwSum(d.deck),
      { nodes: d.deck, key: 'vnews' });
    /* والتحديثُ الحيُّ يعدّ كما يعدّ الرسمُ الأوّل: صفُّ مجلدِ البطائق يقول ما تحته
       مباشرةً (‎own‎)، وإلّا اختلف العددُ بين أوّل رسمٍ وأوّل حرفٍ يُكتب. و«الشروح» على عدّها */
    if (kind === 'c') document.querySelectorAll('.pk--edit .cs-fold').forEach(box => {
      const r = findNode(d.deck, box.dataset.fid);
      if (r && r.n.t === 'f') box.innerHTML = cxNewsHTML('solo', cxNwSum(r.n.ch),
        { nodes: r.n.ch, key: r.n.id });
    });
    document.querySelectorAll('.pk--edit .x3-triobox').forEach(box => {
      const r = findNode(d.deck, box.dataset.fid);
      /* والتحديثُ الحيُّ يبني كما يبني الرسمُ الأوّل، وإلّا اختلف الصفُّ بأوّل حرفٍ يُكتب */
      if (r && r.n.t === 'f') box.innerHTML = kind === 'c' ? cxEqStats(r.n.ch) : x3Trio(r.n.ch, kind);
    });
    /* ورمز شريط الغلاف يتبع المحتوى لحظةً بلحظة: بطائق ← «؟» · أسئلة ← الخيارات · خليط أو فارغ ← محايد */
    document.querySelectorAll('.pk--edit .x3-rail').forEach(r => { r.innerHTML = x3Rail(kind, d.deck); });
  }

  /* رفع صورة غلاف الرزمة — نفس مسار صور المواد: تصغير إلى ٣٢٠px ثم JPEG لتخفّ على حصّة التخزين */
  document.addEventListener('change', e => {
    const ci = e.target.closest('.pk-cover');
    if (!ci || !ci.files || !ci.files[0]) return;
    const d = edPack(), rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        const MAX = 320, k = Math.min(1, MAX / Math.max(im.width, im.height));
        const cv = document.createElement('canvas');
        cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
        cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
        d.img = cv.toDataURL('image/jpeg', .82);
        save(); renderCmSection();
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(ci.files[0]);
  });
  /* عنوان الرزمة: يُحفظ مع الكتابة بلا إعادة رسم كي لا يقفز المؤشّر */
  /* كل حقل نامٍ يحدّث نسخته الخفيّة مع الكتابة — فتلتصق الأيقونات بالنصّ وتبتعد بامتداده */
  document.addEventListener('input', e => {
    const w = e.target.closest('.vt-grow');
    if (w) {
      w.dataset.v = e.target.value || e.target.placeholder || ' ';
      w.classList.toggle('is-ph', !e.target.value);
      if (e.target.dataset.f === 'dur') setTimeout(refreshPackBadges, 0);   /* المجموع يتبع المدة فورًا */
    }
    if (!e.target.closest('#cm-vtitle')) return;
    edPack().title = e.target.value;
    save();
  });

  /* ============================================================
     عرض «الشروح» المجمّع (تبويب القائمة): رقاقات القوائم مرتّبة بإعجابات
     مساهمات «المواضيع» (👑 للأولى وهي الافتراضية) ← عدسات (الأفضل/حسب
     الشارح/الكل) ← مشغّل واحد + عمود مواضيع القائمة. القوائم عوالم مستقلة
     — لا دمج بين قائمتين أبدًا. ♥ الشروح ترتّب الفيديوهات داخل كل موضوع.
     ============================================================ */
  let vidView = { open: null, fold: {} };   /* الكومنت المفتوح + حالة طي مجلداته (عرض فقط) */

  const pName = p => (p.me ? state.profile.name : (p.u && p.u.name)) || T().meName;
  /* «12:40» أو «1:02:30» → ثوانٍ · والمجموع يُنسّق للشارة */
  const durSec = s => {
    if (!s) return 0;
    const parts = String(s).trim().split(':').map(x => parseInt(x, 10));
    if (!parts.length || parts.some(isNaN)) return 0;
    return parts.reduce((a, b) => a * 60 + b, 0);
  };
  const fmtDur = t => {
    if (!t) return '';
    const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60, mm = x => String(x).padStart(2, '0');
    return h ? `${h}:${mm(m)}:${mm(s)}` : `${m}:${mm(s)}`;
  };
  /* شارة رزمة: الرقم ويساره أيقونة (بطاقة/مجلد/فيديو/ساعة) — والتسمية الكاملة تلميحًا */
  /* ===== أيقونة «اختيار من متعدّد» =====
     رسمٌ زوّده المستخدم (ملفّ SVG مُتتبَّع). عُدِّل فيه شيءٌ واحد: كان ملأُه أبيضَ ثابتًا
     (‎#ffffff‎) فصار ‎currentColor‎ — وإلّا اختفى في الجلد الفاتح ولم يتذهّب مع إخوته.
     ورقعته ‎1152×986‎ لا ‎24×24‎ كبقيّة الرموز، فيُقاس بالنسبة لا بالوحدات */
  const MCQ_ART = '<svg viewBox="0 0 1152 986" fill="currentColor" fill-rule="evenodd" stroke="none"><path d="M150.50 888.98 C127.51 886.59 102.65 872.86 88.08 854.52 C79.96 844.30 72.74 829.60 69.98 817.64 C68.09 809.44 67.84 806.11 68.26 794.29 C68.55 786.08 69.41 778.07 70.39 774.50 C72.36 767.36 79.65 751.84 84.16 745.23 C98.43 724.27 119.75 710.25 145.50 704.88 C155.64 702.76 175.04 703.24 185.71 705.87 C217.56 713.73 243.53 740.13 252.73 774.00 C255.50 784.18 255.19 808.87 252.16 819.48 C239.27 864.63 196.60 893.80 150.50 888.98 Z M364.50 887.58 C334.82 881.78 310.97 863.17 298.04 835.74 C291.09 820.98 289.50 813.55 289.51 796.00 C289.53 784.08 289.93 780.01 291.79 773.16 C300.31 741.83 323.82 716.89 354.00 707.19 C372.93 701.11 394.71 701.57 413.71 708.47 C430.95 714.73 451.64 732.20 461.14 748.53 C484.41 788.53 475.50 838.25 439.74 867.99 C431.07 875.20 415.52 883.19 404.50 886.09 C394.25 888.79 374.48 889.53 364.50 887.58 Z M577.23 887.92 C573.78 887.39 566.67 885.42 561.43 883.55 C533.66 873.62 512.34 850.77 503.33 821.29 C500.89 813.32 500.64 811.01 500.64 796.50 C500.64 781.99 500.89 779.68 503.33 771.71 C512.64 741.24 535.08 717.70 564.02 708.03 C572.28 705.28 593.07 702.70 596.51 704.00 C597.88 704.52 599.00 705.11 599.00 705.30 C599.00 705.50 594.00 718.00 587.88 733.08 C574.82 765.30 574.11 768.74 578.63 777.66 C585.63 791.51 600.80 797.57 613.58 791.61 C617.71 789.69 622.10 785.48 637.08 769.05 C647.21 757.93 657.23 746.85 659.35 744.42 C661.47 741.99 663.85 740.00 664.62 740.00 C666.68 740.00 674.77 753.00 678.58 762.41 C683.27 773.98 685.25 784.55 685.18 797.50 C684.95 838.74 656.45 875.01 615.50 886.19 C607.23 888.44 586.66 889.37 577.23 887.92 Z M796.83 887.98 C775.65 884.40 753.34 871.18 740.07 854.35 C732.67 844.96 724.84 829.51 721.89 818.50 C718.83 807.06 718.76 787.79 721.72 775.95 C729.99 742.96 754.45 717.52 787.71 707.32 C795.74 704.85 797.97 704.61 813.50 704.56 C828.57 704.51 831.41 704.77 838.50 706.87 C859.76 713.16 877.89 726.66 890.61 745.66 C896.56 754.56 899.78 761.71 903.22 773.71 C906.46 785.00 906.44 806.87 903.18 818.91 C898.74 835.32 887.64 853.92 876.22 864.09 C863.14 875.73 845.93 884.42 829.92 887.46 C821.42 889.07 804.84 889.33 796.83 887.98 Z M179.50 863.54 C199.14 858.30 216.12 844.48 225.03 826.50 C230.37 815.72 232.35 807.51 232.39 796.00 C232.43 784.29 230.49 776.51 224.54 764.50 C214.28 743.77 194.63 729.92 171.22 726.92 C149.18 724.09 126.28 732.42 110.72 748.91 C97.94 762.46 92.11 775.99 91.28 794.00 C90.69 806.93 92.40 815.13 98.10 826.67 C107.91 846.54 125.95 860.10 149.08 864.98 C155.20 866.27 172.27 865.46 179.50 863.54 Z M391.00 864.93 C425.59 859.35 450.97 830.18 450.97 796.00 C450.97 752.64 410.96 719.17 368.96 727.39 C359.09 729.32 344.90 735.89 337.77 741.84 C321.76 755.20 312.00 775.71 312.00 796.00 C312.00 838.22 350.17 871.53 391.00 864.93 Z M834.49 862.17 C846.16 858.15 853.03 853.84 861.93 844.95 C870.70 836.21 875.97 827.76 879.69 816.50 C883.06 806.32 883.49 789.37 880.65 779.00 C873.81 754.03 853.63 734.37 828.83 728.52 C820.55 726.57 804.08 726.57 796.46 728.53 C776.64 733.62 758.46 748.32 749.67 766.35 C739.74 786.72 739.89 806.12 750.14 826.95 C754.42 835.65 756.55 838.66 762.91 844.95 C778.24 860.11 794.25 866.34 815.73 865.51 C823.72 865.20 827.81 864.47 834.49 862.17 Z M122.39 832.58 C122.08 831.76 126.86 818.58 133.03 803.29 C139.20 788.01 145.77 771.71 147.64 767.08 C149.51 762.45 151.53 758.06 152.14 757.33 C153.91 755.20 168.26 755.53 170.70 757.75 C171.75 758.71 174.47 764.23 176.75 770.00 C198.42 825.06 200.41 830.49 199.64 832.50 C199.14 833.80 197.50 834.03 190.27 833.79 L181.51 833.50 L179.22 827.05 C177.95 823.51 176.43 820.02 175.84 819.30 C174.34 817.50 147.49 817.43 146.31 819.23 C145.86 819.90 144.36 823.39 142.96 826.98 L140.41 833.50 L131.69 833.79 C124.68 834.02 122.85 833.78 122.39 832.58 Z M352.74 833.41 C352.33 833.00 352.00 815.89 352.00 795.39 C352.00 767.32 352.30 757.93 353.21 757.37 C353.87 756.96 363.44 756.61 374.46 756.59 C396.85 756.55 401.55 757.36 407.52 762.28 C412.08 766.04 414.00 770.37 414.00 776.90 C414.00 783.20 412.70 786.63 408.69 790.88 C406.53 793.16 405.92 794.41 406.79 794.72 C409.55 795.73 414.34 800.57 415.64 803.67 C419.82 813.69 415.00 825.68 404.50 831.34 C400.79 833.34 398.82 833.52 376.99 833.82 C364.06 834.01 353.15 833.82 352.74 833.41 Z M783.25 832.86 C781.28 830.87 781.46 759.70 783.44 758.05 C784.48 757.18 790.60 756.94 805.69 757.18 C826.16 757.49 826.59 757.55 832.21 760.31 C835.41 761.88 839.68 765.10 841.91 767.64 C848.04 774.59 849.50 780.07 849.50 796.00 C849.50 808.44 849.30 809.93 846.91 815.00 C843.16 822.97 839.73 826.51 832.21 830.22 L825.55 833.50 L805.03 833.81 C789.47 834.05 784.20 833.82 783.25 832.86 Z M393.98 817.25 C400.53 813.95 400.13 805.52 393.30 802.92 C391.86 802.38 386.15 802.06 380.60 802.22 L370.50 802.50 L370.20 809.40 C370.04 813.20 370.13 816.91 370.42 817.65 C371.25 819.81 389.50 819.50 393.98 817.25 Z M819.04 818.00 C823.65 816.73 828.53 811.55 829.90 806.50 C831.28 801.41 831.30 789.63 829.94 784.72 C828.52 779.62 823.61 774.26 819.16 772.95 C817.15 772.35 812.35 772.01 808.50 772.18 L801.50 772.50 L801.23 794.48 C801.08 806.56 801.18 817.03 801.45 817.73 C802.04 819.28 813.78 819.47 819.04 818.00 Z M169.54 801.75 C170.18 800.09 162.70 779.45 161.55 779.69 C160.28 779.95 152.84 800.15 153.44 801.71 C154.12 803.49 168.86 803.52 169.54 801.75 Z M393.73 784.52 C396.85 780.90 396.69 776.68 393.32 774.04 C390.94 772.16 389.55 771.96 380.57 772.22 L370.50 772.50 L370.50 779.45 C370.50 786.00 370.65 786.45 373.00 787.17 C374.38 787.59 379.09 787.76 383.48 787.54 C390.63 787.20 391.71 786.88 393.73 784.52 Z M598.11 776.60 C595.08 774.93 593.08 771.35 593.04 767.53 C593.00 764.30 594.82 759.63 657.70 602.00 C699.89 496.24 743.66 387.32 778.25 302.00 C800.68 246.70 816.14 208.52 832.31 168.50 C839.20 151.45 848.06 129.62 851.99 120.00 C855.92 110.38 864.76 88.33 871.63 71.00 C878.99 52.43 884.96 38.78 886.17 37.75 C891.11 33.54 891.99 33.99 946.83 68.67 C975.25 86.64 1009.75 108.39 1023.50 117.01 C1059.46 139.54 1114.33 174.34 1122.50 179.81 C1129.11 184.24 1129.52 184.73 1129.80 188.66 C1130.10 192.77 1129.88 193.08 1114.37 210.16 C1105.72 219.70 1094.07 232.45 1088.50 238.50 C1079.83 247.91 1053.08 277.54 1036.59 296.00 C1033.89 299.03 1019.04 315.65 1003.59 332.94 C951.33 391.43 914.81 432.43 901.12 447.99 C893.63 456.50 881.42 470.34 874.00 478.73 C866.58 487.12 855.33 499.92 849.00 507.17 C825.34 534.31 759.45 608.59 713.00 660.50 C674.95 703.02 654.98 725.34 636.50 746.01 C607.57 778.37 607.94 778.01 603.88 777.96 C602.02 777.95 599.42 777.33 598.11 776.60 Z M679.16 651.00 C684.35 645.23 694.88 633.37 702.55 624.66 C710.22 615.95 718.75 606.26 721.50 603.14 C724.25 600.02 740.88 581.27 758.46 561.48 C808.97 504.60 812.33 500.79 816.53 495.55 C821.70 489.09 892.59 409.07 944.58 351.00 C951.72 343.02 970.34 322.10 985.95 304.50 C1001.56 286.90 1015.50 271.20 1016.92 269.62 L1019.50 266.74 L1017.00 267.26 C1015.62 267.55 1005.95 271.66 995.50 276.38 C985.05 281.11 975.54 284.98 974.37 284.99 C970.14 285.01 969.55 282.72 968.50 262.12 C967.63 245.13 967.28 242.48 965.84 242.20 C964.92 242.03 955.50 245.51 944.89 249.94 C934.28 254.37 924.64 258.00 923.46 258.00 C918.91 258.00 918.30 255.74 916.55 232.56 C915.63 220.50 914.66 210.26 914.38 209.81 C913.44 208.28 911.16 209.01 895.00 216.00 C878.81 223.01 874.20 224.15 872.15 221.68 C871.47 220.86 870.84 211.86 870.49 197.93 C869.87 173.51 869.26 165.00 868.12 165.00 C867.27 165.00 865.62 168.94 841.99 227.50 C832.22 251.70 819.17 283.88 812.99 299.00 C806.82 314.12 799.84 331.23 797.50 337.00 C795.16 342.77 788.18 359.88 782.00 375.00 C765.47 415.46 749.88 453.96 741.31 475.50 C737.16 485.95 729.03 506.20 723.26 520.50 C717.49 534.80 702.24 572.57 689.38 604.43 C676.52 636.29 666.00 663.06 666.00 663.90 C666.00 665.70 665.52 666.17 679.16 651.00 Z"/></svg>';
  /* ===== استفهامُ البطاقة: محرفٌ حقيقيّ لا رسمٌ يدويّ =====
     وهو استفهامُ ‎IBM Plex Sans Arabic‎ العريض مسارَين مخبوزَين (‎uni061F‎ و‎question‎):
     العربيُّ ‎؟‎ واللاتينيُّ ‎?‎ — يُختار بلغة **الموقع** لا بلغة البطاقة، فهو حرفُ واجهةٍ لا متن.
     ومقاسُه من جوف وجه البطاقة: الحرفُ ‎0.764‎ من الجوف (‎10.2‎ = الرقعة ١٢ ناقصَ سمكِ ١٫٨)
     ومركزُه ‎(11.75, 14)‎ — فيصلح لكلّ رمزٍ وجهُه المستطيلُ نفسُه (‎3,8 → 17.5×12‎):
     رزمةُ زرّ التبويب ورزمةُ العدّاد سواء. ومكتوبٌ **مرّةً واحدة** هنا: كان في زرّ التبويب
     وحده، فلمّا طُلب في العدّاد استُخرج — ولو نُسخ في موضعين لَافترقا يومًا.
     وقارئٌ (‎get‎/دالّة) لا نصٌّ ساكن: الرموزُ تُبنى مرّةً عند تحميل الملفّ قبل أن تُقرأ الحالُ
     أصلًا، فلو كُتب نصًّا لَتجمّد على لغة أوّل تحميل */
  const CARD_Q_RTL = 'M11.21 15.26V14.5Q10.8 14.46 10.43 14.3Q10.06 14.14 9.78 13.86Q9.5 13.59 9.33 13.24'
    + 'Q9.16 12.88 9.16 12.46Q9.16 11.92 9.34 11.48Q9.52 11.04 9.86 10.73Q10.19 10.42 10.65 10.26Q11.11 10.1 11.69 10.1'
    + 'Q12.24 10.1 12.66 10.25Q13.09 10.39 13.41 10.63Q13.73 10.87 13.96 11.17Q14.18 11.46 14.34 11.77L12.85 12.53'
    + 'Q12.8 12.4 12.7 12.27Q12.59 12.14 12.43 12.04Q12.27 11.94 12.05 11.87Q11.84 11.8 11.56 11.8Q11.13 11.8 10.83 11.99'
    + 'Q10.53 12.18 10.53 12.56Q10.53 12.8 10.64 12.99Q10.74 13.18 10.99 13.31Q11.23 13.44 11.62 13.52Q12.01 13.59 12.57 13.61'
    + 'V15.26ZM11.9 17.9Q11.41 17.9 11.18 17.66Q10.95 17.41 10.95 17.03V16.82Q10.95 16.44 11.18 16.2Q11.41 15.95 11.9 15.95'
    + 'Q12.39 15.95 12.62 16.2Q12.85 16.44 12.85 16.82V17.03Q12.85 17.41 12.62 17.66Q12.39 17.9 11.9 17.9Z';
  const CARD_Q_LTR = 'M10.83 15.25V13.6Q11.68 13.57 12.11 13.31Q12.53 13.06 12.53 12.46V12.3Q12.53 11.89 12.29 11.68'
    + 'Q12.05 11.46 11.66 11.46Q11.24 11.46 10.96 11.72Q10.69 11.98 10.59 12.38L9.27 11.83Q9.37 11.5 9.55 11.2'
    + 'Q9.74 10.89 10.03 10.65Q10.33 10.4 10.75 10.25Q11.16 10.1 11.71 10.1Q12.27 10.1 12.74 10.26Q13.2 10.42 13.54 10.72'
    + 'Q13.87 11.01 14.05 11.42Q14.23 11.83 14.23 12.33Q14.23 12.78 14.08 13.15Q13.93 13.51 13.67 13.79Q13.41 14.06 13.06 14.24'
    + 'Q12.72 14.41 12.34 14.48V15.25ZM11.6 17.9Q11.09 17.9 10.86 17.66Q10.64 17.42 10.64 17.08V16.82Q10.64 16.47 10.86 16.24'
    + 'Q11.09 16 11.6 16Q12.12 16 12.34 16.24Q12.57 16.47 12.57 16.82V17.08Q12.57 17.42 12.34 17.66Q12.12 17.9 11.6 17.9Z';
  const cardQPath = () => '<path fill="currentColor" stroke="none" d="'
    + ((state && state.lang === 'en') ? CARD_Q_LTR : CARD_Q_RTL) + '"/>';
  /* ===== وجهُ الرزمة: مستطيلٌ مستلقٍ وخلفه بطاقةٌ مائلة =====
     كان جسمًا واحدًا (‎CARD_PACK‎) يشترك فيه العدّادُ وزرُّ التبويب. ثمّ أخذ الزرُّ وجهًا
     آخرَ (‎TAB_IC.cards‎ — قُطريّةٌ تقسمه) بمقاسٍ آخرَ للمستطيل، فبقيت **المائلةُ** وحدَها
     مشترَكةً بينهما. فيُفصل الجزآن: المائلةُ مصدرٌ واحدٌ لا يفترق، والوجهُ لكلٍّ وجهُه.
     ولا يُلمس ‎CARD_PACK‎ نفسُه — العدّادُ ورمزُ المساهمة على حالهما */
  const CARD_TILT = '<path d="M6.6 6.4l10.6-2.6a2 2 0 0 1 2.42 1.46l1.1 4.5"/>';
  const CARD_FACE = '<rect x="3" y="8" width="17.5" height="12" rx="2.4"/>';
  const CARD_PACK = CARD_FACE + CARD_TILT;

  const PK_IC = {
    /* ---------- أربع أيقونات: بطاقة وسؤال اختيار، ولكلٍّ صيغتا الرزمة والمفرد ----------
       لا وجه فارغ في المساهمات أبدًا: البطاقة تحمل «؟» عربية (مرسومة لاتينيًّا ثم تُعكس
       بمصفوفة المرآة x' = 21 − x، ومُزاحة ليتطابق مركز حبرها مع مركز المستطيل)،
       والسؤال يحمل صفَّي الاختيار. الفارغ محجوز لأيقونة زرّ التبويب وحدها (TAB_IC.cards).
       المفرد والرزمة بمستطيل واحد ١٣×١٤ — والرزمة وحدها تحمل البطاقة المائلة خلفها */
    /* رزمة بطائق — كانت أيقونةَ زرّ «البطائق والملخصات» عينَها، ثمّ **افترقتا** (٢٤ أغسطس):
       أخذ الزرُّ وجهًا مقسومًا بقُطريّةٍ ليقول «الملخصات» أيضًا، وهذه بقيت على حالها لأنّها
       تعدّ **بطائقَ** لا تسمّي قسمًا — فما زِيد للزرّ زيادةٌ لا معنى لها في عدّاد.
       والمشترَكُ بينهما اليومَ ‎CARD_TILT‎ و‎cardQPath‎ لا غير.
       وكان استفهامُها **مرسومًا بخطّين** لاتينيَّي الشكل، فيقف في الصفّ رمزٌ إفرنجيٌّ
       تحت زرٍّ عربيّ — والرمزان لشيءٍ واحد. فصار المحرفَ الحقيقيَّ ينقلب مع لغة الموقع.
       وقارئٌ لا نصّ: يُقرأ عند كلّ رسم فيتبدّل مع اللغة (‎PK_IC.card‎ لا تُقرأ عند التحميل) */
    get card() {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + CARD_PACK + cardQPath() + '</svg>';
    },
    /* بطاقة واحدة */
    card1: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5" width="13" height="14" rx="2.5"/><g transform="translate(4 1.552) scale(0.8) matrix(-1 0 0 1 21 0)" stroke-width="2.3"><path d="M9.1 11.1a1.9 1.9 0 1 1 2.4 1.85c-.45.15-.7.5-.7.95v.3"/><path d="M10.85 16.9h.01"/></g></svg>',
    /* رزمة فارغة الوجه: رمزٌ محايد للبند كله — لا يقول «بطاقة» ولا «سؤال».
       موضعه شريط الغلاف حين تجمع الرزمة النوعين، وأيقونة زرّ التبويب */
    cardE: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + CARD_PACK + '</svg>',
    /* الاختيار من متعدّد — رسمٌ واحد للرزمة وللمفرد (‎MCQ_ART‎ أعلاه) */
    mcq: MCQ_ART,
    mcq1: MCQ_ART,
    /* مجلد الشجرة: ممتلئٌ ذو لسان ووجهٍ أمامي — على هيئة مجلد النظام لا خطًّا محدّدًا.
       اللسان والظهر بشفافيّةٍ ٥٥٪ من اللون نفسه، فيُقرأ جسمًا واحدًا بطبقتين لا لونين */
    folderFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 6.7a2.2 2.2 0 0 1 2.2-2.2h3.62c.6 0 1.17.24 1.59.67l1.2 1.23H18.8A2.2 2.2 0 0 1 21 8.6v9a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.6z" opacity=".5"/><path d="M3 10.6h18v6.9a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.5z"/></svg>',
    /* رمز المجلد واحدٌ في كل موضع: المفتوح — مطويًّا كان أو موسَّعًا، في التحرير والنشر.
       (المغلق حُذف: سهم الطيّ وحده يقول الحالة، وتبديل الرمز معه تكرارٌ يشوّش الصفّ) */
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3.5 8.5V7a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2v1"/><path d="M6 11h15.5l-2.8 8H3.5l2.5-8z"/></svg>',
    vid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path class="ic-play" d="M10.5 9.5l4.5 2.5-4.5 2.5z" fill="currentColor" stroke="none"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    /* رزمة شروح: شاشةٌ بمثلّث تشغيل وخلفها شاشةٌ ثانية تطلّ — نظير رزمة البطائق في البناء،
       فيقول شريط الغلاف «عدّة فيديوهات» لا «قائمة نصّية» (كانت ثلاثة خطوط) */
    vids: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8" width="16" height="12" rx="2.5"/><path d="M6.5 5h11a2.5 2.5 0 0 1 2.5 2.5v9"/><path class="ic-play" d="M9.1 11.4l4.4 2.6-4.4 2.6z" fill="currentColor" stroke="none"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13.5a4 4 0 0 0 5.7.4l3-3a4 4 0 0 0-5.7-5.7l-1.7 1.7"/><path d="M14 10.5a4 4 0 0 0-5.7-.4l-3 3a4 4 0 0 0 5.7 5.7l1.7-1.7"/></svg>',
  };
  /* عدّ أوراق الشجرة (بطائق أو فيديوهات — كل ما ليس مجلدًا) + مجموع مدد الفيديوهات */
  const countLeaf = nodes => (nodes || []).reduce((s, n) => s + (n.t === 'f' ? countLeaf(n.ch) : 1), 0);
  const sumDur = nodes => (nodes || []).reduce((s, n) => s + (n.t === 'f' ? sumDur(n.ch) : durSec(n.dur)), 0);
  const pkBadge = (ic, val, title) => `<span class="v-badge v-badge--g pkb" title="${title}">${PK_IC[ic]}<b class="pkb-n">${val}</b></span>`;
  /* شارتا الرزمة: عدد الشروح ومجموع المدد — تُبنى مرة وتُستعمل في العرض والتحرير الحيّ */
  const packBadgesHTML = deck => {
    const n = countLeaf(deck), tot = fmtDur(sumDur(deck));
    return pkBadge('vid', n, T().pkVids(n)) + (tot ? pkBadge('clock', tot, T().pkDur) : '');
  };
  /* ============================================================
     هيئة «خ٣» لعرض رزمة الشروح في المكتبة (منقولة من مختبر shrooh-comment-lab):
     · خيط رحلة رأسيّ للدرجة الأولى وحدها، وعلاماته دوائر للجميع — مجلدًا كان البند أو شرحًا.
     · وما تحت الدرجة الأولى بلا خيط ولا علامات: الإزاحة وحدها تبني الهرم.
     · كل شرح يحمل مربّع اكتماله يسار مدّته، واسمه ومدّته ذهبيّان تمييزًا له عن المجلد.
     · عدّاد المجلدات لا يظهر أصلًا حين يكون صفرًا.
     · بلا مقبض سحب: المكتبة موضع استعراض فقط، والسحب يأتي لاحقًا في «الركن».
     ============================================================ */
  const X3STEP = k => (k <= 1 ? 28 : 56);          /* إزاحة كل مستوى عن سابقه */
  const X3IND = k => { let o = 0; for (let i = 1; i <= k; i++) o += X3STEP(i); return o; };
  const x3Leaves = ns => (ns || []).flatMap(n => (n.t === 'f' ? x3Leaves(n.ch) : [n]));
  /* نصيب الشرح من المشاهدة ٠…١ — لا مشاهدة في المكتبة بعد، فالمربّع يبقى فارغًا حتى تصل المذاكرة إلى «الركن» */
  const x3Watch = () => 0;
  const x3Pct = ns => { const l = x3Leaves(ns); return l.length ? l.reduce((s, n) => s + x3Watch(n), 0) / l.length : 0; };
  /* ===== أدخلَ القارئُ هذه الرزمة؟ =====
     دائرةُ الاكتمال خبرٌ عن **سعيه هو** لا عن الرزمة. فصفٌّ من دوائرَ خاويةٍ يقول
     «لم تفعل شيئًا» ولا يقول عن الرزمة شيئًا — ويزاحم أسماءَها بثلاثين بكسلًا بلا ثمن.
     فلا تُعرض في النشر إلّا لمن بدأ فيها: أوّلُ بطاقةٍ يذاكرها تفتح له المحطّاتِ كلَّها.
     والمصدرُ سجلُّ مذاكرته ‎state.srs‎ — وهو للبطائق اليوم. و«الشروح» بلا سجلِّ مشاهدةٍ
     بعد (‎x3Watch‎ صفرٌ ثابت كما في تعليقه)، فلا محطّاتِ لها في النشر حتى يصل ذلك السجلّ.
     وأمّا التحريرُ فمحطّاتُه ثابتةٌ أبدًا: صاحبُ الرزمة يبني هيكلَها فيراه، ولا شأنَ له
     بسجلّ مذاكرةِ غيره */
  const packEntered = deck => x3Leaves(deck).some(n => state.srs[recId(n)]);
  /* التعبئة بالسائل — نفس أسلوب .cc-liquid في الموقع */
  const x3Fill = v => (v > 0 && v < 1 ? `<span class="x3-lq" style="height:${Math.round(v * 100)}%"></span>` : '');
  const x3Dot = v => `<span class="x3-dot${v >= 1 ? ' on' : ''}">${x3Fill(v)}</span>`;
  /* ============================================================
     دائرةُ مجلد البطائق — ماءٌ يقول كم أُجيب، وطبقتان تقولان كيف
     ============================================================
     (‏‎dot-liquid-lab#a1 + live‎ بقيمٍ معايَرة). وهي الدائرةُ القائمةُ نفسُها لا رسمٌ
     ثانٍ: كانت فارغةً أبدًا لأنّ ‎x3Watch‎ تُرجع صفرًا في البطائق، فأُعطيت معنًى.

     ‏**بُعدان**: ارتفاعُ الماء = المُجاب من المجلد، وقسمةُ لونه = الصوابُ من المُجاب.
     والصوابُ **أساسٌ يُبنى عليه**: أخضرُ من القاع وأحمرُ فوقه — فالأخضرُ يعلو كلّما أتقنت.

     ===== وآخرُ الحكم كان مسجَّلًا من قبل — في الفاصل =====
     كُتب أوّلَ مرّةٍ يشترط الحقلَ ‎l‎ وحدَه، فكانت الدائرةُ تبقى فارغةً عند من ذاكر قبل
     أن يُزاد الحقل — وسجلُّه قائمٌ يُرى في مربّعَي الصواب والخطأ إلى جانب البطاقة!
     والسببُ أنّ ‎l‎ لم يكن لازمًا أصلًا: ‎srsNext‎ تضع ‎i = 0‎ عند «مرّة أخرى» **وحدَها**،
     وترفعه إلى واحدٍ فأكثرَ في الثلاثة الباقية (صعبٌ · جيّدٌ · سهل). و‎srsApply‎ هي
     الكاتبةُ الوحيدة لـ‎state.srs‎. فـ‎i === 0‎ تعني **بالضبط** أنّ آخر حكمٍ كان خطأً —
     استنتاجٌ قاطعٌ لا تخمين.
     فالقراءةُ صارت: **وجودُ السجلّ** يعني أنّها أُجيبت (فيصحّ المقام على كلّ ما مضى)،
     و‎l‎ إن وُجد يقول الحكمَ، وإلّا فالفاصلُ يقوله. وأُبقي ‎l‎ يُكتب: صريحٌ لا يتغيّر
     معناه لو بُدّلت الجدولةُ يومًا، والفاصلُ احتياطُه للماضي.

     ‏**ولا حركةَ البتّة** (قرارُ صاحب الموقع): موجتان ساكنتان بطولين مختلفين وطَورين
     مختلفين لا تلتقي قمّتاهما، فيبدو السطحُ عَرَضيًّا لا مرسومًا. ولا ‎animation‎ ولا
     ‎transform‎ — والقناعُ يُزاح بـ‎mask-position‎. ومكسبٌ ثالث: لا إعادةَ رسمٍ في كلّ
     إطارٍ لعشرات الدوائر في الشجرة */
  /* ===== سطحُ الماء: مسارٌ واحدٌ يُقصّ به السائلُ كلُّه (‏dome-lab) =====
     كان شريطين مقنَّعين يعلوان كتلةً مسطّحة، فصار **شكلًا واحدًا**: مسارٌ يُبنى من
     معادلةٍ بعددين ويصير قناعًا على الأحمر والأخضر معًا.
         ‏y(x) = t − قبّة·sin(πx) + تموّج·sin(3πx)
     الأولى تعلو مرّةً في الوسط فتكون قبّةً، والثانية تتردّد ثلاثًا فتكون موجًا.
     والمعتمَد ‎dome: 0‎ — لا قبّةَ، سطحٌ يتموّج على استوائه.
     ولا حركةَ ولا ‎transform‎: قناعٌ ساكنٌ لا يُعيد الرسمَ في كلّ إطار */
  /* ===== حكمُ آخر إجابة: الحقلُ الصريحُ إن وُجد، وإلّا فالفاصل =====
     ‏‎srsNext‎ تضع ‎i = 0‎ عند «مرّة أخرى» وحدَها وترفعه فيما سواها، و‎srsApply‎ الكاتبةُ
     الوحيدة — فـ‎i === 0‎ تعني بالضبط أنّ آخرَ حكمٍ كان خطأً. وبه يُقرأ ما ذُوكر قبل
     أن يوجد الحقلُ ‎l‎ */
  const srsLast = r => (r.l != null ? !!r.l : r.i > 0);
  /* ===== البُعدان: كم أُجيب من المجلد، وكم أُصيب ممّا أُجيب =====
     والمقامُ **وحداتُ سؤالٍ** لا بطائق: أمٌّ بثلاثة أوجهٍ ثلاثةُ أسئلةٍ في المجلد،
     فلو عُدَّت واحدةً لَامتلأت الدائرةُ بثلث العمل (‎cxRecsOf‎ تفصّلها) */
  const x3Ans = ns => {
    const all = x3Leaves(ns).flatMap(cxRecsOf);
    const rec = all.filter(Boolean), ok = rec.filter(srsLast).length;
    /* والأعدادُ تُردّ مع النسب: النسبةُ تُرسم والعددُ يُقال في التلميح — ولا يُحسب مرّتين */
    return { lvl: all.length ? rec.length / all.length : 0,
      rat: rec.length ? ok / rec.length : 0, n: all.length, k: rec.length, c: ok };
  };
  const X3W = { dome: 0, wave: 3.5 };
  function x3Surf(lvl) {
    /* والممتلئُ بلا قناع: لا سطحَ لماءٍ بلغ الحافّة */
    if (lvl >= 1) return '';
    if (lvl <= 0) return 'none';   /* ولا شيءَ يُرى: قناعٌ خاوٍ */
    const t = 100 - lvl * 100, d = [];
    for (let i = 0; i <= 40; i++) {
      const x = i * 2.5, u = x / 100;
      const y = t - X3W.dome * Math.sin(Math.PI * u) + X3W.wave * Math.sin(3 * Math.PI * u);
      d.push((i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(2));
    }
    /* سماتُ الرسم بعلامتين مزدوجتين (فترمَّز ‎%22‎) والغلافُ بمفردة — وإلّا قطعت
       العلامةُ سمةَ ‎style‎ وحُمّل القناعُ فارغًا بلا صياح */
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"'
      + ' preserveAspectRatio="none"><path fill="#fff" d="' + d.join('') + 'L100 100L0 100Z"/></svg>';
    return "url('data:image/svg+xml," + encodeURIComponent(svg) + "')";
  }
  function x3DotAns(a) {
    const lvl = a.lvl, rat = a.rat;
    /* والزجاجُ يبقى على الفارغة: قارورةٌ بلا ماءٍ خبرٌ صحيح — «لم يُختبر بعد» */
    const ttl = esc(a.n == null ? '' : (a.k ? T().pkAns(a.k, a.n, a.c) : T().pkAnsNone));
    /* ============================================================
       حدٌّ أدنى يُرى — النسبةُ الخامُ تختفي تحت البكسل
       ============================================================
       جوفُ الدائرة ‎15.2px‎ (قدُّها ‎18‎ ناقصَ حدَّين ‎1.4‎). فمجلدٌ فيه ‎524‎ وحدةً أُجيب
       منه ‎12‎ نسبتُه ‎2.3٪‎ = **‎0.35px‎** من الماء — لا يُرى أصلًا، وعند تصغير الصفحة
       إلى ‎80٪‎ يصير ‎0.28‎. فالدائرةُ تبدو فارغةً وفيها عمل.
       ومثلُه الشريطُ الأقلّ: تسعةُ أعشارٍ صوابٌ تجعل الأحمرَ ‎0.2px‎ — فيغيب الخطأُ كأنّه
       لم يكن.
       فيُفرض حدّان بالبكسل ثمّ يُحوَّلان نسبةً — والحدُّ **يُقرأ من الجوف نفسِه** لا
       يُكتب رقمًا مجرّدًا، فلو تبدّل قدُّ الدائرة يومًا تبعه.
       ولا يكذب هذا على أحد: **التلميحُ يقول الأرقامَ الحقيقيّة**، والدائرةُ رسمٌ يقول
       «بدأتَ وهذا حالُك» لا مسطرةٌ تُقاس بالمليمتر. ولا يُفرض الحدُّ إلّا على من له
       خبرٌ أصلًا: الفارغةُ تبقى فارغة، والخالصُ (كلُّه صوابٌ أو كلُّه خطأ) يبقى خالصًا */
    const IN = 15.2, MINL = 3.4 / IN, MINB = .9 / IN;
    let L = lvl, R = rat;
    if (L > 0) L = Math.max(L, MINL);
    if (R > 0 && R < 1) {
      /* والسقفُ ‎0.3‎ لا ‎0.45‎: لو تُرك أوسعَ لَقلب تسعةَ أعشارٍ صوابًا إلى نصفٍ بنصف —
         فالحدُّ يُظهر الأقلَّ ولا يُساويه بالأكثر. وهو يُلامس ‎0.3‎ عند أرقّ ماءٍ فقط */
      const m = Math.min(MINB / L, .3);
      R = Math.min(Math.max(R, m), 1 - m);
    }
    if (!lvl) return `<span class="x3-dot x3-dot--ans" title="${ttl}"><i class="x3-gls"></i></span>`;
    /* ===== سطحان متوازيان لا سطحٌ ومستطيل =====
       كان الأخضرُ مستطيلًا **مسطّحَ الرأس** يرتفع ‎lvl × rat‎، والسطحُ يتموّج فوقه.
       فإذا رقّ الماءُ صارت سعةُ الموجة أطولَ منه: قممُ الموج تعلو رأسَ الأخضر ويظهر
       تحتها أحمرُ خالص — فمجلدٌ تسعةُ أعشاره صوابٌ يُقرأ أحمرَ. (‏مقيسٌ: عند ‎lvl 2.3٪‎
       ارتفاعُ الماء ‎0.35px‎ وسعةُ الموجة ‎0.53px‎.)
       فصار الأخضرُ **مقنَّعًا بالموجة نفسِها** عند مستوى ‎lvl × rat‎: حدٌّ موازٍ للسطح في
       كلّ نقطة، فتبقى النسبةُ نسبةً مهما رقّ الماءُ أو اشتدّ الموج */
    const mkR = x3Surf(L), mkG = x3Surf(L * R);
    const sty = m => m === 'none' ? '' : (m ? ` style="--mask:${m}"` : '');
    return `<span class="x3-dot x3-dot--ans" title="${ttl}">`
      + `<i class="x3-lqa"${sty(mkR)}></i>`
      + (mkG === 'none' ? '' : `<i class="x3-lqa__g"${sty(mkG)}></i>`)
      + `<i class="x3-dep"></i><i class="x3-gls"></i></span>`;
  }
  /* «خ٣» تخدم البندين: kind='v' شروح (أيقونة فيديو + مدّة) · 'c' بطائق (أيقونة بطاقة، بلا مدّة).
     واسم البند يختلف بينهما: الشرح له عنوانه، والبطاقةُ وجهُها (السؤال) هو اسمها */
  /* وجه البطاقة قد يحمل تنسيقًا (نافذة الإضافة) — فيُجرَّد إلى نصّ للعرض في الصفوف والعدّادات */
  const x3Leaf = (n, kind) => kind === 'c' ? stripRich(cxTx(n).f) : n.name;
  /* أيقونتان للبطائق: الرزمة حين يُعبَّر عن عدّة بطائق (العدّادات)، والمفردة حين يكون البند بطاقة واحدة */
  const x3Ic = kind => kind === 'c' ? PK_IC.card : PK_IC.vid;
  /* أيقونة البند الواحد تتبع نوع عقدته: بطاقة أم سؤال اختيار من متعدّد */
  const x3Ic1 = (kind, n) => kind !== 'c' ? PK_IC.vid : ((n && n.t === 'q') ? PK_IC.mcq1 : PK_IC.card1);
  const x3Cnt = (n, kind) => kind === 'c' ? T().pkCards(n) : T().pkVids(n);
  /* العدّادات بأيقوناتها مباشرة — وما خلا منه البند لا عدّاد له:
     البطائق تُعدّ نوعين (بطائق ثم أسئلة اختيار)، والمدّة للشروح وحدها */
  /* ===== عدّادان لا ثلاثة =====
     كانت البطائق تُعدّ عدّتين: بطاقاتٍ وأسئلةَ اختيار، فيقف في الصفّ عدّادان لشيءٍ واحد.
     وتمييزُ النوع خبرٌ عن **صنعة** البند لا عن حجم العمل، والصفُّ يريد الحجم — فاندمجا
     في عدّادٍ واحد (‎countLeaf‎ يجمع ‎c‎ و‎q‎ معًا فلا حاجة إلى جمعهما يدًا).
     ===== والترتيبُ في البطائق: المجلداتُ أوّلًا ثمّ الأسئلة =====
     كان البنودُ أوّلًا («ما يُذاكَر قبل ما يُنظَّم»)، فصار المجلدُ أوّلَ ما يلي الاسمَ — في
     الغلاف وفي صفوف المجلدات معًا: القراءةُ تنزل من الظرف إلى ما فيه، فيُقال «كم بابًا؟»
     قبل «كم سؤالًا؟». و«الشروح» على ترتيبها الأوّل — لم يُطلب فيها شيء، والبندان
     يشتركان في ‎x3Trio‎ لا في القرار */
  /* (وجُرّب طيُّهما عمودًا في صفّ المجلد فرُدّا صفًّا واحدًا — فالغلافُ وصفُّ المجلد سواء) */
  /* عدُّ ما في المجلد نفسِه لا ما في ذرّيّته — يخدم معادلةَ صفّ المجلد في محرّر البطائق */
  const countLeafOwn = nodes => (nodes || []).reduce((s, n) => s + (n.t === 'f' ? 0 : 1), 0);
  const x3Trio = (ns, kind) => {
    const nc = countLeaf(ns);
    const nf = countFolders(ns), tot = kind === 'c' ? '' : fmtDur(sumDur(ns));
    /* والعدّادان **ثابتان لا يغيبان** ولو كانا صفرًا، وإنّما يخفتان: كان أحدُهما يظهر
       ويختفي مع أوّل بندٍ يُضاف فيقفز الصفُّ ويزيح جيرانه، و«صفرٌ» خبرٌ صحيحٌ لا فراغ.
       فالخفوتُ يقول ما يقوله الغياب — «لا شيءَ هنا» — ويُبقي الصفَّ على قدِّه ويُبقي
       الرمزَ يقول أين يُعَدّ. والخفوتُ على الغلاف كلِّه (‎.x3-stat‎) فيشمل الرمزَ ورقمَه:
       هما خبرٌ واحدٌ فلا يخفت نصفُه */
    const nil = v => v ? '' : ' is-nil';
    const cnt = `<span class="x3-stat${nil(nc)}" title="${x3Cnt(nc, kind)}">${x3Ic(kind)}<b>${nc}</b></span>`;
    const fold = `<span class="x3-stat${nil(nf)}" title="${T().pkFolders(nf)}">${PK_IC.folder}<b>${nf}</b></span>`;
    return `<span class="x3-trio">
      ${kind === 'c' ? fold + cnt : cnt + fold}
      ${tot ? `<span class="x3-stat" title="${T().pkDur}">${PK_IC.clock}<b class="x3-dur">${tot}</b></span>` : ''}
    </span>`;
  };
  /* غلاف الرزمة: شكل ثابت وتدرّج مشتقّ من أول حرف من اسم المساهم — فلكل مساهم لونه أينما حلّت رزمته.
     المضاعِف ٤٧ ضروريّ: حروف العربية متتالية الأكواد فتتجاور ألوانها بدونه */
  const x3Initial = s => (String(s || '').trim()[0] || '؟');
  const x3Hue = s => (x3Initial(s).charCodeAt(0) * 47) % 360;
  /* مصدر صورة البروفايل (نفس منطق avatarHTML) */
  const x3Img = p => ((p.me && state.profile.img) ? state.profile.img : (p.u && p.u.img)) || '';
  /* ألوان البروفايل: كثير من الأفاتارات هنا صور SVG مولَّدة بتدرّج لونيّ (أفاتارات العرض مثلًا)،
     فتُستخرج ألوانها من الصورة نفسها ليخرج الغلاف بلون بروفايل صاحبه حرفيًّا لا بلون قريب منه */
  const x3AvColors = src => {
    if (!src) return null;
    let s = src;
    try { s = decodeURIComponent(src); } catch (e) { /* صورة نقطية لا نصّ — تُترك */ }
    const m = s.match(/stop-color=['"]?(#[0-9a-fA-F]{3,8})/g);
    if (!m || !m.length) return null;
    const c = m.map(x => x.slice(x.indexOf('#')));
    return { a: c[0], b: c[1] || c[0] };
  };
  /* غلاف الرزمة — ثلاث حالات مرتّبة:
     ١) لا صورة بروفايل → لون البروفايل الافتراضي نفسه (--u-av).
     ٢) صورة يمكن قراءة ألوانها → تدرّج البروفايل نفسه بالضبط.
     ٣) صورة حقيقية لا لون يُقرأ منها → تدرّج مشتقّ من أول حرف من اسمه (الحالة العشوائية المأذون بها). */
  const x3ArtHTML = (p, kind, deck) => {
    const src = x3Img(p), av = x3AvColors(src);
    const ini = `<b>${esc(x3Initial(pName(p)))}</b>`;
    /* البندان بغلاف واحد: قسمان مشبوكان — شريط الرزمة ثم مربّع صورة المساهم، ومجموعهما نسبة فيديو.
       ‏--g لون البروفايل يقود القسمين معًا، ولا شيء يعلو الصورة: لا ستارة ولا حرف ولا مثلّث.
       والفرق بين البندين رمز الشريط: خطوط القائمة للشروح، وللبطائق رمزٌ واحد يتبع ما تحويه الرزمة —
       بطائق وحدها فرمز «؟» · أسئلة اختيار وحدها فرمز الخيارات · فإن جمعت النوعين
       فالرمز المحايد الفارغ (رمزان في شريط واحد ازدحام لا يفيد) */
    const img = (p.data && p.data.img) || '';   /* صورة الرزمة إن رفعها صاحبها */
    return `<span class="x3-art${src ? '' : ' x3-art--flat'}${kind === 'c' ? ' x3-art--c' : ''}" style="--g:${x3ArtColor(p)}">
      <span class="x3-rail">${x3Rail(kind, deck)}</span>
      <span class="x3-thumb">${img ? `<img src="${img}" alt="">` : ini}</span>
    </span>`;
  };
  /* رمز شريط الغلاف — واحدٌ للبندين: خطوط القائمة للشروح، وللبطائق يتبع ما تحويه الرزمة.
     القاعدة كما كانت: رزمةٌ خالصةُ النوع تلبس رمزَ نوعها، ومختلطةٌ تلبس المحايد.
     والجديد أنّ الأنواع صارت أربعة لا اثنين — فتُقرأ من ‎cxKindOf‎ نفسِها التي يقرأ بها
     المحرّر وصفوفُه ودُرجُ الأنواع، ويُؤخذ الرمز من ‎CD_KINDS‎ مصدرِ الأربعة الوحيد.
     فلو زيد نوعٌ خامس لحق الغلافَ بلا سطرٍ هنا */
  /* بنود الرزمة كلُّها: بطائقُ وأسئلةُ اختيارٍ معًا.
     ولا تُستعمل ‎flatCards‎ هنا — فهي تُسقط ‎t==='q'‎ عمدًا لأنّها لجلسة المذاكرة،
     ولو استُعملت لَعادت رزمةُ الأسئلة الخالصة فارغةً فلبست الرمز المحايد */
  const x3Leaves2 = ns => (ns || []).flatMap(n =>
    (n.t === 'c' || n.t === 'q') ? [n] : x3Leaves2(n.ch));
  const x3Rail = (kind, deck) => {
    if (kind !== 'c') return PK_IC.vids;
    const kinds = new Set(x3Leaves2(deck).map(cxKindOf));
    if (kinds.size !== 1) return PK_IC.cardE;   /* مختلطةٌ أو فارغة: رمزٌ محايد */
    const only = kinds.values().next().value;
    return (CD_KINDS.find(x => x[0] === only) || CD_KINDS[0])[1]();
  };
  /* غلاف بطاقة التحرير: نفس غلاف العرض حرفيًّا، إلا أنه <label> يبتلع رفع الصورة */
  const x3ArtEdit = (p, kind, deck) => {
    const img = (p.data && p.data.img) || '';
    /* بلا غلاف بعد: مربّع الصورة يلبس شطبًا قطريًّا و＋ ذهبية — فلا يبدو الفارغُ نهائيًّا
       كما كان حين يعرض حرف البروفايل، ولا ينتظر النداءُ مرورَ المؤشّر (ولا مؤشّر في الجوال) */
    return `<label class="x3-art x3-art--edit${img ? '' : ' x3-art--empty'}${x3Img(p) ? '' : ' x3-art--flat'}${kind === 'c' ? ' x3-art--c' : ''}" style="--g:${x3ArtColor(p)}" title="${T().pkCover}">
      <span class="x3-rail">${x3Rail(kind, deck)}</span>
      <span class="x3-thumb">${img ? `<img src="${img}" alt="">` : `<b>${esc(x3Initial(pName(p)))}</b>`}</span>
      <input type="file" class="pk-cover" accept="image/*" hidden>
    </label>`;
  };
  /* لون الغلاف وحده — يُستعمل في العرض وفي بطاقة التحرير معًا فلا يفترقان */
  const x3ArtColor = p => {
    const src = x3Img(p), av = x3AvColors(src), h = x3Hue(pName(p));
    return !src ? 'var(--u-av)'
      : av ? `linear-gradient(150deg,${av.a},${av.b})`
        : `linear-gradient(150deg,hsl(${h} 34% 44%),hsl(${(h + 40) % 360} 30% 24%))`;
  };
  /* عنوان الرزمة الذي يكتبه صاحبها — يظهر بين الغلاف والعدّادات */
  const x3TtlHTML = p => {
    const t = (p.data && p.data.title) || '';
    return t ? `<b class="x3-pkttl">${esc(t)}</b>` : '';
  };
  /* ترويسة الرزمة: غلافها ← عدّاداتها ← سهم التوسيع · ويفصلها خطٌّ عمّا تحتها حين تُفتح.
     هوية المساهم وتاريخه ليسا هنا: مكانهما صفُّ الكومنت بجانب صورته فوق — الغلاف غلاف الرزمة لا صورة صاحبها */
  const x3PkHead = (p, deck, open, kind) => `<div class="x3-pkhd${open ? ' on' : ''}">
      ${x3ArtHTML(p, kind, deck)}
      <!-- ===== «ابدأ» — كلمةٌ على مفتاح، في صدر العنوان =====
           كان في **البطائق وحدَها**، وحجّتُه أنّ «زرًّا يَعِد بفعلٍ لا يقع أسوأُ من زرٍّ
           لا يكون». وقد صار في «الشروح» كذلك بحكم صاحب الموقع — وفعلُه فيهما يفترق:
             · **البطائق**: يفتح الرزمةَ ثمّ يُحدِّد كلَّ ما فيها، فينزل شريطُ التحديد
               وفيه «ذاكر» و«اختبر» — فتقرّر أنت.
             · **الشروح**: يفتح الرزمةَ ولا يزيد. ولا شريطَ تحديدٍ لها ولا مشغّلَ فيديو
               في الموقع بعد (‎vpMedia‎ مكتوبةٌ ولا تُنادى، و‎x3Watch‎ ردٌّ ثابتٌ بصفر) —
               فما دون الفتح وعدٌ لا يقع. ويوم يجيء المشغّلُ يبدأ من أوّل شرح.
           وشرطُه في الاثنين واحد: ‎countLeaf(deck)‎ — رزمةٌ خاويةٌ لا يُبدأ فيها شيء.
           واللفظُ ‎T().pkGo‎ («ابدأ» · «Start») في ‎<span>‎ لأنّ المفتاح **ثلاثُ طبقات**:
           الصندوقُ تنّورةٌ و‎::before‎ سطحٌ عليها، فلو كان الحرفُ نصًّا عاريًا لَغرق تحتهما.
           والتلميحُ ‎pkGoT‎ يبقى شرحَ الفعل كاملًا لأنّ «ابدأ» وحدَها لا تقول مداه.
           و**سقطت ‎aria-label‎**: كانت لازمةً يومَ كان الزرُّ رسمًا بلا حرف، فلمّا صار له
           حرفٌ مرئيٌّ صارت ضارّة — الاسمُ المتاحُ يصير «اختبر هذه الرزمة كلَّها» ولا يحوي
           «ابدأ» التي يراها الناظر، فمن نادى الزرَّ باسمه المرئيّ (تحكُّمًا بالصوت) لم يُصبه.
           فالاسمُ الآنَ متنُ الزرّ، و‎title‎ وصفُه. -->
      ${countLeaf(deck)
        ? `<button type="button" class="cx-pktest" title="${esc(kind === 'c' ? T().pkGoT : T().pkGoV)}"
             ><span>${esc(T().pkGo)}</span></button>` : ''}
      ${x3TtlHTML(p)}
      <!-- ===== ودائرةُ الرزمة كلِّها يسارَ عنوانها =====
           هي دائرةُ المجلد بعينها ونفسُ حسابها (‎x3Ans‎)، لكنّ مداها **الرزمةُ كلُّها**
           لا مجلدًا فيها: ماءٌ يرتفع بقدر ما أُجيب منها، ولونُه بقدر ما أُصيب.
           فيُقرأ من الترويسة وحدَها «أين أنا من هذه الدورة» قبل أن تُفتح.
           وفي البطائق وحدَها وفي الرزمة التي فيها بطائق — كزرّ الاختبار سواء -->
      <!-- ولا تظهر إلّا لمن بدأ رحلتَه فيها: ‎a.k‎ عددُ ما أُجيب من وحدات الرزمة.
           فرزمةٌ لم تُفتح بعدُ لا دائرةَ لها — وقارورةٌ فارغةٌ على كلّ مساهمةٍ في السوق
           صفٌّ من الزجاج لا يقول شيئًا. وفي الشجرة تبقى الفارغةُ: هناك قرأتَ الرزمةَ
           وفتحتَها، فالفراغُ خبرٌ يُنتظر لا حَشْو -->
      ${kind === 'c' && countLeaf(deck)
        ? (a => a.k ? x3DotAns(a) : '')(x3Ans(deck)) : ''}
      ${x3Trio(deck, kind)}
      <!-- وخبرُ الرزمة يسارَ شاراتها — في البطائق وحدَها. و‎head‎ لا ‎solo‎: الرأسُ
           ههنا رأسُ قارئٍ، فيسقط عنه حكمُ الجواب (انظر ‎CX_NW_HAS.head‎) -->
      ${kind === 'c' ? cxNewsHTML('head', cxNwSum(deck), { nodes: deck, key: 'head:' + p.id })
        : cxNewsHTML('vid', cxNwSum(deck), { nodes: deck, key: 'head:' + p.id })}
      <!-- وسهمُ الطيّ رُدَّ إلى زاويته الأولى: جُرّب قوسًا (‏‎chev-match-lab#p8‎) حين كانت
           الحبّةُ تلاصقه في ذيل الصفّ فيُوازن كتلتَها، ثمّ انتقلت الحبّةُ إلى صدر الصفّ
           فذهب سببُ القوس — وبقي السهمُ سهمَ ملاحةٍ بين أرقام، فرُدَّ رسمُه ووزنُه وقدُّه -->
      <button type="button" class="pk-toggle x3-pktg" title="${open ? T().pkCollapse : T().pkExpand}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    </div>`;
  /* صفّ البند: أيقونة ← اسم ← مدة (للشروح وحدها) ← مربّع الاكتمال · وعلامة الخيط للدرجة الأولى وحدها.
     اسم البطاقة هو وجهها — أي السؤال المكتوب فيها */
  const x3Ep = (n, top, kind) => {
    const v = x3Watch(n);
    const sel = jriOn();
    /* ===== وصفُّ الشرح هدفُ نقرةٍ في الموضعين =====
       في **النافذة** تُبدّل المقطعَ الجاري، وفي **شجرة النشر** تفتح النافذةَ عليه —
       فيدخل القارئُ الدورةَ من حيث شاء لا من أوّلها أبدًا. والوسمُ واحدٌ والمعالجُ
       يفرّق بالموضع.
       و‎vw‎ يبقى للوسم الثاني وحدَه (‎is-play‎): «الجاري» لا معنى له خارج النافذة */
    const vw = vwOn();
    return `<div class="x3-ep${kind === 'c' ? ' x3-ep--c' : ''}${vw && vwCur === n.id ? ' is-play' : ''}"${sel ? ` data-roid="${n.id}"` : ''} data-vwp="${n.id}" title="${esc(T().vwPlay)}">
      ${top ? x3Dot(v) : ''}${sel ? RO_GRAB(n.id) : ''}
      <span class="x3-vic">${x3Ic1(kind, n)}</span>
      <b class="x3-vnm">${esc(x3Leaf(n, kind)) || '—'}</b>
      ${(kind !== 'c' && n.dur) ? `<span class="x3-vdur">${esc(n.dur)}</span>` : ''}
      <span class="x3-done${v >= 1 ? ' on' : ''}">${x3Fill(v)}</span>
      <!-- وخبرُ الشرح **يسارَ مربّع اكتماله**: الصفُّ ‎rtl‎ فالمتأخّرُ في الوسم هو الأيسر.
           وترتيبُه مقصود: الاكتمالُ خبرُك أنت عن نفسك، والثلاثةُ خبرُ الناس عنه — فيُقرأ
           الخاصُّ ثمّ العامّ، كما يُقرأ في صفّ البطاقة سواء -->
      ${kind !== 'c' ? cxNewsHTML(vw ? 'path' : 'vid', cxNwFacts(n, null), { n }) : ''}
    </div>`;
  };
  /* في كل مستوى: المجلدات أولًا ثم الشروح · والزرّ وحده يفتح ويطوي (data-fold يلتقطه المستمع العام) */
