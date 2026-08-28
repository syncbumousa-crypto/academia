/* ============================================================
   app.js — اللغة + سوق المواد (نسختان: التاب والنافذة المنبثقة) + أترام المكتبة
   localStorage «academia2:v1» = { lang, imgs: {code: dataURL}, terms: [أسماء] }
   عربي: الصورة يمين والاسم العربي يسارها · English: الصورة يسار والكود (الساعات) يمينها
   (الانعكاس عبر dir على <html> — ترتيب DOM ثابت: الصورة أولًا ثم الاسم)
   ============================================================ */
(function () {
  'use strict';

  const LS_KEY = 'academia2:v1';
  /* واجهة الموقع مزروعة داخل لوحة الأدمن؟ (تُضبط قبل تحميل app.js) — تُظهر أدوات إدارية كالتثبيت */
  const ADMIN = !!window.ACADEMIA_ADMIN;
  const $ = s => document.querySelector(s);

  let state;
  try { state = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { state = {}; }
  state.imgs = state.imgs || {};
  state.lang = state.lang === 'en' ? 'en' : 'ar';
  state.terms = Array.isArray(state.terms) ? state.terms : [];
  state.libs = state.libs || {};             // { اسم الترم: [{code, picks}] } — picks = اختيارات «نسختي» (ROADMAP-PICKS)
  state.termDates = state.termDates || {};   // { اسم الترم: { s: 'YYYY-MM-DD', e: 'YYYY-MM-DD' } }
  state.pid = state.pid || 0;                // عدّاد معرفات المساهمات الثابتة
  /* ============================================================
     المعرّف: فريدٌ في هذا المتصفّح، وفريدٌ في الدنيا
     ============================================================
     كان ‎'p' + (++state.pid)‎ — عدّادٌ يبدأ من الصفر **عند كلّ متصفّح**. فمساهمتي
     السابعة ‎p7‎ ومساهمتُك السابعة ‎p7‎، وهما شيئان. وما دامت المساهماتُ لا تخرج
     من الدرج فلا ضرر؛ فإذا جُمعت في خادمٍ واحد حلّ أحدُهما محلّ الآخر — وذلك
     ضياعُ عملِ إنسانٍ بلا صياح.

     فتُزاد **بذرةٌ لهذا المتصفّح**: تُولد مرّةً وتُحفظ في الحال، فتفترق معرّفاتُه
     عن معرّفات كلّ متصفّحٍ آخر. والعدّادُ يبقى معها لا يُطرح — هو الذي يضمن ألّا
     يتصادم معرّفان **عندي أنا** ولو وُلدا في الجزء نفسِه من الثانية، والبذرةُ
     تضمن ألّا يتصادما بيني وبين غيري. فاجتمع الضمانان.

     ===== وما وُلد قبل اليوم لا يُمسّ =====
     ‎p7‎ القديمةُ تبقى ‎p7‎: معرّفاتُ العقد مبثوثةٌ في سجلّ التكرار ‎state.srs‎ وفي
     ‎n.src‎ وفي خيوط التعليقات وفي مسارات المقاطع — وإعادةُ كتابتها كلِّها ترحيلٌ
     عميقٌ لا يشتري أمانًا يستحقّه. والقديمُ يُنسَب إلى صاحبه يومَ يُرفع (‎uid:p7‎)،
     فيُحلّ التصادمُ عند الحدّ لا في البيت. */
  state.idSeed = state.idSeed
    || Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  const newId = () => 'p' + state.idSeed + (++state.pid).toString(36);
  state.profile = state.profile || { name: '', phone: '', email: '', password: '', img: '' };   // بروفايل الحساب (الشريط الجانبي + صفحة الحساب)
  /* ============================================================
     الجلسة: عضوٌ أم زائر
     ============================================================
     لم يكن في الموقع مفهومُ جلسةٍ أصلًا: ‎state.profile‎ حقولٌ تُملأ، و«تسجيل الخروج»
     يمسحها. فلمّا صار الموقعُ يُفتح لمن لا يعرفه احتاج البابَ: من دخل بلا حساب **زائر**
     يتصفّح ويذاكر ويختبر، ولا يُعجب ولا يساهم ولا يبني ركنًا.

     ===== والترحيلُ لا يجعل صاحبَ الموقع زائرًا في موقعه =====
     العلمُ يُولد اليومَ، وفي الأدراج حالٌ عمرُها شهران بلا علم. فيُقرأ الغيابُ من
     البروفايل نفسِه: من له اسمٌ أو إيميلٌ فقد كان عضوًا قبل أن يوجد الاسمُ للعضويّة.
     وأمّا الزائرُ الجديد فبروفايلُه خاوٍ، فيقع على الزيارة صحيحًا.

     ===== والحسابُ في الدرج، وهذا يُقال لا يُخفى =====
     لا خادمَ اليومَ، فالحسابُ يسكن هذا المتصفّح وحدَه ولا يعبر إلى جهازٍ آخر. وهو
     صَدَفةٌ صادقةٌ لِما يجيء: يومَ يوجد الخادمُ تُبدَّل ‎authJoin‎ و‎authLogin‎ وحدَهما،
     والبوابةُ والواجهةُ وما بُني عليهما لا يُمسّ. */
  if (state.signedIn === undefined)
    state.signedIn = !!(state.profile.name || state.profile.email);
  const isGuest = () => !state.signedIn;
  const hasAcct = () => !!(state.profile.email && state.profile.password);
  state.sideCollapsed = !!state.sideCollapsed;   // طي الشريط الجانبي (محفوظ)
  /* مقاسُ مربّع «المادة» في القُمرة: نافذةٌ مرنة يسحبها صاحبُها، والمحتوى يتبع المقاس.
     ‏‎w = 0‎ يعني «اترك العرضَ للشبكة» (‎.75fr‎)، وما فوقه عرضٌ صريحٌ يقود عمودَه.
     ولمَ في الحال المحفوظة لا في الجلسة؟ لأنّه تفضيلٌ لا حالُ نظرة: من ضيّقه مرّةً
     لا يريد أن يعود طويلًا كلّما فُتحت المادّةُ من جديد */
  /* ============================================================
     مقاسُ المربّعات الأربعة الأصل — من مختبر ‎RE\nk-four-lab‎ بحكم صاحب الموقع
     ============================================================
     كانت الأربعةُ تبدأ بلا عرضٍ (‎w: 0‎) فتقتسم الصفَّ بنِسَبٍ تتّسع بالشاشة، وبقاماتٍ
     مختلفة. وقد عُويرت في المختبر على جلد الموقع الحيّ وآلةِ جرِّه، فاستقرّت على
     أعراضٍ بالبكسل وقامةٍ **واحدةٍ** للأربعة — وهي أدنى القامات (‎34‎): سطرُ العنوان
     وحدَه، ومن أراد جوفًا أطاله بيده. فالرَّكنُ يُفتح شريطًا لا جدارًا.
     ===== ولمَ يُرقَّم؟ =====
     من فتح الموقعَ قبل اليوم ثبّتت له أعراضٌ في حاله المحفوظة، فلن يرى الأصلَ الجديد
     أبدًا ما دامت. فيُردّ الجميعُ إليه **مرّةً واحدة** بترقيم نسخةٍ (كما في ‎cdSetV‎)،
     ثمّ يبقى ما يجرّه بعد ذلك. وهو الموضعُ الوحيدُ الذي يمحو تثبيتًا قديمًا */
  const NK_DEF = {
    nkInfo:  { w: 200, h: 44, c: 1 },
    nkDoc:   { w: 254, h: 44, c: 1 },
    nkAbs:   { w: 182, h: 44, c: 1 },
    nkGrade: { w: 303, h: 44, c: 1 },
  };
  /* ===== والقامةُ ٣٤ ← ٤٤ لانّ الضيّقَ لم يعد قصًّا =====
     كانت ‎34‎ ادنى القامات: سطرُ العنوان وحدَه وما تحته مقصوص. وقد صار للضيّق
     **جسدٌ مصمَّم** (‎NK_NARROW‎): لفظٌ ورقمٌ يطفوان على ارضيّةٍ هي المقياس، وهو
     معايَرٌ على ‎44‎ — دونها يُخنق ولا يُقرأ.
     والاعراضُ الاربعةُ من سحبِ صاحب الموقع في ‎RE/nook-four‎ حتّى رضي */
  /* ‏‎c‎: مطويٌّ على الأصل · ‎o‎: المقاسُ الذي كان قبل الطيّ، يُردّ إليه عند النشر */
  Object.keys(NK_DEF).forEach(k => { state[k] = Object.assign({}, NK_DEF[k], state[k]); });
  if (state.nkSzV !== 2) {
    state.nkSzV = 2;
    Object.keys(NK_DEF).forEach(k => { state[k] = Object.assign({}, NK_DEF[k]); });
  }
  /* ما يقع عند حفظ البطاقة — يعيش في الحال المحفوظة لا في الجلسة، فعادةُ الإضافة لا تُستأنف كلَّ مرّة.
     والمفتاحان مطفآن ابتداءً: الحفظُ حفظٌ ولا يُزاد عليه فعلٌ لم يُطلب.
     و‎cdSetV‎ ترقيمُ معنًى لا ترقيمُ بنية: كان المفتاحان يحكمان ✕ و‎close‎ مشتعلٌ ابتداءً،
     فصارا يحكمان الحلقة — والقيمةُ القديمة تحت المعنى الجديد تُغلق النافذةَ على صاحبها
     أوّلَ حفظٍ بلا أن يطلب. فتُردّ إلى الإطفاء مرّةً واحدةً عند أوّل تحميل بعد التبديل */
  state.cdSet = state.cdSet || {};
  if (state.cdSetV !== 2) { state.cdSet = { close: false, chain: false }; state.cdSetV = 2; }
  state.cdSet.close = !!state.cdSet.close;
  state.cdSet.chain = !!state.cdSet.chain;

  /* إصلاح ذاتي لأسماء الأترام: الترم بلا اسم (أو مسافات فقط) لا يمكن فتحه — فلا لسان له
     ولا زرّ إعدادات، فيبقى «معلَّقًا» لا يُسمّى ولا يُحذف. كذلك الاسم المكرّر يضيع مواده.
     الفارغ بلا مواد يُحذف · والفارغ ذو مواد يُعطى اسمًا مؤقّتًا كي تصله الإعدادات فتتحكّم به */
  {
    let fixed = false;
    const seen = new Set(), out = [];
    let n = 0;
    state.terms.forEach(t => {
      const name = typeof t === 'string' ? t.trim() : '';
      const has = (state.libs[t] || []).length > 0;
      if (!name || seen.has(name)) {
        fixed = true;
        if (!has) { delete state.libs[t]; delete state.termDates[t]; return; }   /* فارغ ⇐ يُحذف */
        let alt = 'ترم ' + (++n);
        while (seen.has(alt)) alt = 'ترم ' + (++n);
        if (state.libs[t]) { state.libs[alt] = state.libs[t]; delete state.libs[t]; }
        if (state.termDates[t]) { state.termDates[alt] = state.termDates[t]; delete state.termDates[t]; }
        seen.add(alt); out.push(alt);
        return;
      }
      if (name !== t) {   /* مسافات زائدة حول الاسم */
        fixed = true;
        if (state.libs[t]) { state.libs[name] = state.libs[t]; delete state.libs[t]; }
        if (state.termDates[t]) { state.termDates[name] = state.termDates[t]; delete state.termDates[t]; }
      }
      seen.add(name); out.push(name);
    });
    if (fixed) {
      state.terms = out;
      if (state.lastNook && !out.includes(state.lastNook.term)) state.lastNook = null;
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    }
  }

  /* ترقية المكتبة (م0): أكواد نصية → مدخلات {code, picks} — picks=null تعني إضافة قديمة تحتاج تجهيزًا */
  {
    let migrated = false;
    Object.keys(state.libs).forEach(t => {
      state.libs[t] = state.libs[t].map(x => {
        if (typeof x === 'string') { migrated = true; return { code: x, picks: null }; }
        return x;
      });
    });
    if (migrated) { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }
  }
  const libEntries = term => state.libs[term] || (state.libs[term] = []);
  const libCodes = term => libEntries(term).map(e => e.code);
  const libEntry = (term, code) => libEntries(term).find(e => e.code === code);
  state.cinfo = state.cinfo || {};           // تفاصيل المادة: { code: { desc, rel, docs: [{n,e,days,from,to,d,teach,grade}] } }
  state.viewMode = 'all';   // شريط كل/أفضل أُزيل — القوائم دائمًا كاملة
  state.srs = state.srs || {};   // جدولة التكرار المتباعد الشخصية للبطائق: { cardId: {e: ease%, i: فاصل بالأيام, d: تاريخ الاستحقاق} }
  /* أعلامُ السؤال: وسمٌ لونيٌّ يضعه القارئُ في جلسة الاختبار — { cardId: 1..6 }.
     وعلى **البطاقة** لا على الوجه، كسجلّ المذاكرة سواءً: الوسمُ حكمٌ على السؤال نفسِه
     لا على وجهٍ منه، فبطاقةٌ لها أوجهٌ يكفيها علمٌ واحد */
  state.flags = state.flags || {};
  /* ===== وسجلُّ الأوجه: مخزنٌ ثانٍ لأنّ الجدولةَ للبطاقة والسؤالَ للوجه =====
     ‏‎state.srs‎ مفتاحُه **البطاقة** — وهو الصحيح: الجدولةُ تقول متى تعود إليها.
     لكنّ الاختبار وحدتُه **وجهٌ**: بطاقةُ فراغٍ فيها ثلاثةُ فراغاتٍ ثلاثةُ أسئلة، وقد
     تصيب في اثنين وتخطئ في واحد. فلو كُتب ذلك كلُّه على البطاقة ضاع التفصيل ولم يُعرف
     أيُّ وجهٍ الذي أخطأتَ فيه.
     فههنا مخزنٌ **للعرض لا للجدولة**: ‎{ 'cardId#faceKey': {ok, no, l} }‎.
     ولا يُخلط بـ‎state.srs‎: ذاك تقرؤه ‎srsDue‎ و‎srsNew‎ وتنظّفه المكنسةُ بمعرّفات
     البطائق — ومفتاحٌ فيه علامةُ ‎#‎ لا تعرفه فيُمحى */
  state.fa = state.fa || {};
  const cinfo = code => state.cinfo[code] || (state.cinfo[code] = { desc: '', rel: 0, docs: [] });

  /* ============================================================
     ترحيلٌ واحد: وسمُ الصورة كُتب مقلوبًا في أنكي فيُردّ إلى صيغته
     ============================================================
     صاحبُ الرزمة كتب أسماءَ صورها مقلوبةً **عمدًا** («‎الاسم - الرقم‎») لأنّ أنكي كان
     يعرضها معكوسةً، فيستقيم عنده المقلوبُ ويعوجّ المستقيم. وموقعُنا يعرض ما خُزِّن كما
     خُزِّن — فظهر المقلوبُ مقلوبًا. فتُردّ الصيغةُ إلى ما أرادها: **الرقمُ أوّلًا ثمّ
     ‎-‎ ثمّ البقيّة**.
     ===== والقاعدةُ عامّةٌ لأنّ العادةَ كانت عامّة =====
     مُسحت الحمولةُ كلُّها: ‎1661‎ اسمًا في ‎29‎ عائلة، **كلُّها** تنتهي بـ«‎- رقم‎» بلا
     استثناءٍ واحد. فلا تُستثنى عائلةٌ بالظنّ، ولا تُعدّ العائلاتُ في القاعدة فتُنسى
     واحدةٌ يوم تُزاد رزمة.
     · وآخرُ فاصلٍ هو الفاصل: «‎11.1 - 11.2 - 5‎» رقمُها ‎5‎ وبقيّتُها ‎11.1 - 11.2‎.
       ولذلك ‎[^"]*?‎ كسولٌ ثمّ يُشترط ما بعده — فيقع القطعُ عند آخر موضعٍ يصحّ.
     · والصيغةُ (‎.jpg‎) تبقى في الذيل: هي من الملفّ لا من الاسم، و‎cxImgBase‎ تقصّها
       عند العرض. فنقلُها إلى الصدر يكسر المعروضَ والمخزونَ معًا.
     ===== وفخٌّ مقيسٌ: عائلةٌ اسمُها رقم =====
     ثَمّ عائلةٌ اسمُها «‎1‎» وصورُها ‎1..13‎ — فوسمُها «‎1 - 10‎»، وطرفاه رقمان. فالقلبُ
     يُعطي «‎10 - 1‎» وهو الصواب، لكنّ قلبَه ثانيةً يردّه إلى عوجه: القاعدةُ **ليست
     مُنعكسةً على نفسها** في هذه العائلة وحدَها.
     فالحارسُ ليس في التعبير بل في المرّة: ‎fnFix‎ رقمُ نسخةٍ لا رايةُ صحّ — يُرفع مع كلّ
     تعميمٍ للقاعدة، ويُكتب **قبل** الحفظ. ومن رُحِّل بالقاعدة الضيّقة (‎1‎) لا يُقلب
     مرّتين: ما رُدَّ صار «‎رقم - بقيّة‎» فلا يطابق التعبيرَ أصلًا */
  if (state.fnFix !== 2) {
    const FN_RX = /data-fn="([^"]*?) - (\d+)(\.[A-Za-z0-9]{1,5})?"/g;
    let fnHits = 0;
    const fnWalk = o => {
      if (!o || typeof o !== 'object') return;
      Object.keys(o).forEach(k => {
        const v = o[k];
        if (typeof v === 'string') {
          const nv = v.replace(FN_RX, (m, rest, num, ext) => {
            fnHits++; return 'data-fn="' + num + ' - ' + rest + (ext || '') + '"';
          });
          if (nv !== v) o[k] = nv;
        } else if (v && typeof v === 'object') fnWalk(v);
      });
    };
    fnWalk(state.cinfo);
    state.fnFix = 2;
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    if (fnHits) console.log('وسمُ صورةٍ رُدَّ إلى صيغته:', fnHits);
  }

  /* ============================================================
     بذرةُ حكم الجواب — سجلٌّ قديمٌ يُنقل إلى مخزنٍ وُلد متأخّرًا
     ============================================================
     في الموقع ثلاثةُ مخازنَ تكتب «كم مرّةً أُجيبت هذه البطاقة»، ولكلٍّ عملُه:

       · ‎state.srs[cid]‎  ⇐ **جدولتُك**: متى تعود إليك وكم أصبتَ فيها. تُكتب في
         المذاكرة دائمًا وفي الاختبار إن كان مفتاحُ «السجل» مفتوحًا، ووحدتُها
         **بطاقةٌ في كلّ جولة** لا وجه (قاعدةٌ مبسوطةٌ عند ‎xtRec‎).
       · ‎state.fa[cid#k]‎ ⇐ **مربّعُ الوجه** في الشجرة: حكمُك أنت على وجهٍ بعينه.
       · ‎n.a‎           ⇐ **حكمُ الناس على البطاقة**: بدَنا الذيل وكومةُ المجيبين في
         نافذة الاختبار. يُكتب بكلّ حكمٍ بلا شرط (‎cxAns‎)، ووحدتُه **وجهٌ**.

     والثالثُ **وُصل متأخّرًا**، فبطاقةٌ أُجيبت سبعَ عشرةَ مرّةً قبل أن يوجد لا يحمل
     عنها إلّا ما جاء بعده — فيُقرأ في النافذة رقمٌ يناقض ما في الشجرة، ولا عطبَ في
     الرسم وإنّما في عمر المخزن. فتُنقل الحصيلةُ القديمةُ إليه مرّةً واحدة.

     ===== ولمَ ‎Math.max‎ لا الجمع؟ =====
     المخزنان **متداخلان** في الفترة الأخيرة: ما أُجيب بعد وصل ‎n.a‎ مكتوبٌ فيهما معًا.
     فالجمعُ يُضاعف تلك الفترة، والأخذُ بالأكبر لا يُنقص شيئًا ولا يخترع شيئًا —
     يرفع الجديدَ إلى القديم حيث كان القديمُ أوفى، ويتركه حيث سبقه.
     وفي ذوات الأوجه يبقى الرقمُ **حدًّا أدنى** لا مطابقةً، لاختلاف الوحدة: جولةٌ
     واحدةٌ على بطاقةِ فراغٍ بخمسة أوجهٍ تقول ‎1‎ في القديم و‎5‎ في الجديد */
  if (state.ansSeed !== 1) {
    const srs = state.srs || {}, fa = state.fa || {};
    /* سجلاتُ الأوجه مفهرسةٌ بمفتاحٍ مركّب (‎id#k‎)، فتُقلب إلى خريطةٍ بالبطاقة مرّةً
       واحدةً ولا يُمشى على الدرج مع كلّ عقدة. و‎#*‎ سجلٌّ عامٌّ لا وجهَ له فيدخل في
       المجموع لا في جيب */
    const byCard = {}, star = {};
    Object.keys(fa).forEach(key => {
      const j = key.lastIndexOf('#'); if (j < 0) return;
      const id = key.slice(0, j), k = key.slice(j + 1);
      if (k === '*') { star[id] = fa[key]; return; }
      (byCard[id] = byCard[id] || {})[k] = fa[key];
    });
    let seeded = 0;
    const walk = o => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      /* عقدةُ بطاقةٍ: لها معرّفٌ وليست مجلّدًا (‎t === 'f'‎). والمساهماتُ لها معرّفاتٌ
         كذلك، لكنّها لا تقع في السجلّ القديم فلا يُكتب لها شيء */
      if (typeof o.id === 'string' && o.t !== 'f' && (srs[o.id] || byCard[o.id] || star[o.id])) {
        const r = srs[o.id] || {}, fs = byCard[o.id], st = star[o.id] || {};
        const a = o.a || (o.a = { ok: 0, no: 0 });
        let sok = 0, sno = 0;
        if (fs) {
          const F = a.f || (a.f = {});
          Object.keys(fs).forEach(k => {
            const b = F[k] || (F[k] = { ok: 0, no: 0 });
            b.ok = Math.max(b.ok || 0, fs[k].ok || 0);
            b.no = Math.max(b.no || 0, fs[k].no || 0);
            sok += b.ok; sno += b.no;
          });
        }
        /* ومجموعُ البطاقة لا ينقص عن أيٍّ من الأربعة: ما فيه، وسجلُّك، والعامّ، وجموعُ أوجهه */
        a.ok = Math.max(a.ok || 0, r.ok || 0, st.ok || 0, sok);
        a.no = Math.max(a.no || 0, r.no || 0, st.no || 0, sno);
        seeded++;
      }
      Object.keys(o).forEach(k => { if (k !== 'a') walk(o[k]); });
    };
    walk(state.cinfo);
    state.ansSeed = 1;
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
    if (seeded) console.log('بذرةُ حكم الجواب: بطائقُ نُقل إليها سجلُّها القديم:', seeded);
  }

  /* ---------- مواد المختبر (LEC + LAB): نشاطان لنفس المادة، مصدرها سجل العروض في acsim ---------- */
  const LAB_COURSES = new Set(['ICS 104', 'STAT 214', 'MIS 250', 'MIS 301', 'MIS 311', 'MIS 315', 'MIS 341', 'ACCT 300', 'CGS 392', 'COE 344', 'ICS 108', 'SWE 206']);
  const baseOf = code => { const j = code.indexOf('::'); return j < 0 ? code : code.slice(0, j); };   // «ICS 104::معمل» → «ICS 104»
  const labKey = code => code + '::معمل';                                                            // مفتاح مساهمات نشاط المعمل (خيط منفصل)
  const isLab = code => LAB_COURSES.has(baseOf(code));
  const labSel = {};                                                                                 // النشاط المحدَّد لكل مادة لاب (افتراضيًا «محاضرة»)
  const selOf = code => labSel[code] || 'محاضرة';

  /* صورة المادة: المرفوعة يدويًا أولًا، ثم غلاف الكتاب الافتراضي من covers/ (نشاط المعمل يرث غلاف مادته) */
  /* مسار الأصول (covers/…) نسبةً إلى مجلد الموقع لا إلى الصفحة المضيفة — فتظهر الأغلفة
     أيضًا حين يُزرع ترميز الموقع في صفحة أخرى (لوحة الأدمن) */
  const ASSET_BASE = (() => {
    const s = document.currentScript && document.currentScript.src;
    return s ? s.replace(/platform\/app\.js.*$/, '') : '';
  })();
  const assetURL = p => (!p || /^(data:|blob:|https?:|\/)/.test(p)) ? p : ASSET_BASE + p;
  /* ---------- غلاف المادة = مساهمة مثبَّتة في بند «المادة» تحمل صورة كتاب ----------
     الغلاف ليس إعدادًا مستقلًّا: هو نتيجة تثبيت مساهمة. وإذا ثُبِّتت مساهمة أخرى فيها غلاف
     صار الغلافُ غلافَها (الأحدث تثبيتًا يفوز عبر pinAt). قراءة مباشرة من الحالة بلا ترحيل
     كي تبقى رخيصة — فهي تُستدعى لكل بطاقة في كل رسم */
  function coverPost(code) {
    const arr = (((state.cinfo || {})[code] || {}).posts || {}).info || [];
    let best = null;
    for (const p of arr) {
      if (!p || !p.pin || !p.data || !p.data.bookImg) continue;
      if (!best || (p.pinAt || p.ts || 0) > (best.pinAt || best.ts || 0)) best = p;
    }
    return best;
  }
  const imgOf = code => {
    const cp = coverPost(code) || coverPost(baseOf(code));
    /* assetURL: مسار مستودع مخزَّن نسبيًّا («covers/…») يُصحَّح حسب الصفحة (الموقع أو لوحة الأدمن)،
       ولا يمسّ data:‎ ولا http:‎ */
    return (cp && assetURL(cp.data.bookImg))
      || state.imgs[code] || state.imgs[baseOf(code)]
      || (typeof COVERS !== 'undefined' && assetURL(COVERS[code] || COVERS[baseOf(code)])) || '';
  };

  /* ---------- كتالوج الأدمن ----------
     مصدر المواد والتخصصات هو لوحة «أكاديميا أدمن» (مفتاح مستقلّ في نفس التخزين).
     إن لم تُفتح اللوحة بعد، يعمل الموقع على مواد data.js كما كان (بلا تخصصات) */
  const CAT_KEY = 'academia2:catalog:v1';
  const CAT = (() => { try { return JSON.parse(localStorage.getItem(CAT_KEY)); } catch (e) { return null; } })();
  const CAT_ON = !!(CAT && Array.isArray(CAT.courses) && CAT.courses.length);
  const TAGS = (CAT && Array.isArray(CAT.tags)) ? CAT.tags : [];

  /* ============================================================
     الكتالوجُ من الخادم — م٠ من ‎ROADMAP-SERVER.md‎
     ============================================================
     أوّلُ خيطٍ يصل الموقعَ بخادم. ولا يُقلب المعمارُ لأجله: الإقلاعُ يقرأ **الدرجَ**
     كما كان — متزامنًا، بلا انتظار شبكة — فتفتح الصفحةُ في اللحظة نفسها وتعمل
     بلا إنترنت. ثمّ يُسأل الخادمُ **بعد** أن يستقرّ كلُّ شيء.

     ===== ولمَ لا يُنتظر الخادمُ في الإقلاع؟ =====
     لأنّ ‎CAT‎ يُبنى عليها ‎CLIST‎ و‎CM‎ وما بعدهما في السطر الذي يليها. فانتظارُ
     الشبكة ههنا يعني صفحةً بيضاءَ بقدر بُعد الخادم، وموقعًا لا يفتح إن انقطع
     الإنترنت. والسرعةُ التي في الموقع منشؤها أنّه لا ينتظر أحدًا — ولا تُباع
     لأجل مئةٍ وثمانِ مادّةٍ تتبدّل مرّاتٍ في الفصل.

     ===== وكيف يُطبَّق ما وصل؟ =====
     ‎CAT‎ و‎CLIST‎ ثوابتُ بُنيت، فلا تُبدَّل تحت الرسم. فالوارد يُحفظ في الدرج،
     ثمّ:
       · إن لم يكن في الدرج كتالوجٌ أصلًا (زائرٌ لأوّل مرّة) — تُعاد الصفحةُ **مرّةً
         واحدةً في الجلسة** فيُقلع بالكتالوج كاملًا. ولم يفعل شيئًا بعدُ، والإعادةُ
         من الخبء لحظيّة.
       · وإن كان عنده كتالوجٌ فتبدّل — يُعرض شريطٌ هادئٌ فيه زرُّ تحديث، ولا تُقطع
         عليه صفحةٌ يعمل فيها.
     والحارسُ في ‎sessionStorage‎ لا في ‎state‎: يزول بإغلاق اللسان، فلا يعلق علمٌ
     يمنع التحديثَ أبدًا، ويستحيل أن تدور الإعادةُ أكثر من مرّة.

     ===== ولا يُوثَق بما يرد =====
     يُفحص شكلُه (مصفوفةٌ فيها أكوادٌ) قبل أن يُكتب. وردٌّ مكسورٌ أو صفحةُ خطأٍ
     تُقرأ JSON فتُسقط الكتالوجَ كلَّه — والموقعُ يبقى على ما في درجه. */
  const CAT_URL = 'api/catalog';
  function catSync() {
    if (!/^https?:/.test(location.protocol)) return;   /* على ‎file://‎ لا خادمَ يُسأل */
    /* والأساسُ ‎ASSET_BASE‎ (جذرُ المشروع، يُقتطع من ‎src‎ الخاصّ بالمحرّك) لا
       ‎location.href‎: الصفحةُ في ‎platform/‎ فيصير النسبيُّ ‎platform/api/…‎.
       وإن غاب الأساسُ فجذرُ الأصل — لا الصفحةُ التي نحن فيها */
    const url = ASSET_BASE ? new URL(CAT_URL, ASSET_BASE).href : location.origin + '/' + CAT_URL;
    fetch(url, { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j || !Array.isArray(j.courses) || !j.courses.length || !j.courses[0].code) return;
        const had = CAT_ON;
        if (CAT && String(CAT.v) === String(j.v) && had) return;   /* لم يتبدّل */
        try { localStorage.setItem(CAT_KEY, JSON.stringify(j)); } catch (e) { return; }
        if (!had) {
          if (sessionStorage.getItem('academia2:catReload')) return;
          sessionStorage.setItem('academia2:catReload', '1');
          location.reload();
          return;
        }
        catBar();
      })
      .catch(() => { /* لا شبكةَ أو لا خادم: الدرجُ يكفي */ });
  }
  /* شريطُ التحديث: يُقال ولا يُقاطَع */
  function catBar() {
    if (document.getElementById('cat-new')) return;
    const ar = (state.lang || 'ar') === 'ar';
    const b = document.createElement('div');
    b.id = 'cat-new';
    b.innerHTML = (ar
      ? '<span>تحدّثت قائمة المواد.</span><button type="button">حدِّث الصفحة</button>'
      : '<span>The course list was updated.</span><button type="button">Refresh</button>');
    b.querySelector('button').onclick = () => location.reload();
    document.body.appendChild(b);
  }
  const ORIG = {}; COURSES.forEach(c => ORIG[c.code] = c);   /* الأصل: لون الغلاف البديل يتبع كليّتها */
  /* شكل المادة الموحّد: code · ar (الاسم الكامل) · arName (المختصر المعروض) · h · col · tags · lab */
  const CLIST = CAT_ON
    ? CAT.courses.map(c => ({
        code: c.code,
        ar: c.full || c.ar || c.code,
        arName: c.ar || '',
        h: +c.h || 0,
        col: (ORIG[c.code] || {}).col || 'biz',
        tags: c.tags || [],
        lab: !!c.lab,
      }))
    : COURSES.map(c => Object.assign({}, c, { tags: [], lab: LAB_COURSES.has(c.code) }));
  if (CAT_ON) { LAB_COURSES.clear(); CLIST.forEach(c => { if (c.lab) LAB_COURSES.add(c.code); }); }

  const CM = {};
  CLIST.forEach(c => CM[c.code] = c);
  /* قيد هوية لكل نشاط معمل (نفس كود/اسم/كلية المادة + وسم act) — مساهماته تُخزَّن تحت labKey منفصلًا */
  LAB_COURSES.forEach(code => { if (CM[code]) CM[labKey(code)] = Object.assign({}, CM[code], { act: 'معمل' }); });
  /* ===== الحفظ لا يفشل في صمت =====
     كان الامتلاءُ يُبتلع في ‎console.warn‎: تكتب، وترى كتابتك أمامك، ولا تُحفظ، ولا يقول أحدٌ شيئًا —
     فلا تكتشفه إلا بعد إعادة تحميلٍ وقد ذهب العمل. والدرجُ مشتركٌ بين كلّ مشاريع ‎file://‎
     فامتلاؤه ليس فرضًا بعيدًا. فصار الفشلُ **شريطًا أحمر لا يزول** حتى ينجح حفظٌ بعده */
  let saveBad = false;
  const save = () => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      if (saveBad) { saveBad = false; const b = document.getElementById('sv-alarm'); if (b) b.remove(); }
      mirrorSoon();                    /* ونسخةٌ إلى ملفٍّ على الجهاز إن كان موصولًا */
      /* وما نُشر يتبدّل بعد نشره: يُدفَع مؤجَّلًا فلا يُتبع كلَّ حرفٍ طلبُ شبكة.
         و‎srvPushSoon‎ تُعرَّف في جزءٍ لاحق — فتُسأل بالاسم لا تُنادى عمًى */
      if (typeof srvPushSoon === 'function') srvPushSoon();
    } catch (e) { saveBad = true; saveAlarm(e); }
  };
  /* الشريط بلغتيه بلا ‎T()‎: قد يُستدعى قبل أن تُبنى النصوص، والإنذارُ لا يُؤجَّل */
  function saveAlarm(e) {
    let b = document.getElementById('sv-alarm');
    if (!b) {
      b = document.createElement('div');
      b.id = 'sv-alarm';
      document.body.appendChild(b);
    }
    const ar = (state.lang || 'ar') === 'ar';
    b.innerHTML = ar
      ? `<b>لم يُحفظ ما كتبتَه.</b> مساحةُ التخزين في المتصفّح امتلأت — وهي مشتركةٌ بين كل مشاريعك المحليّة.
         افتح <a href="../backup.html" target="_blank">الخزنة</a> وصدّر نسختك ثمّ نظّف، ولا تُغلق هذه الصفحة قبلها.`
      : `<b>Your changes were not saved.</b> Browser storage is full — it is shared across all your local projects.
         Open <a href="../backup.html" target="_blank">the Vault</a>, export a copy, then clean up. Do not close this page first.`;
    console.warn('تعذّر الحفظ (الحصة ممتلئة؟)', e);
  }

  /* ============================================================
     مرآةُ الملفّ — بياناتُك تعيش على جهازك لا في المتصفّح وحده
     ============================================================
     المتصفّح يمنح الصفحة المحليّة مِقبضًا على ملفٍّ تختاره بنفسك (‎showSaveFilePicker‎)،
     ويبقى المِقبض محفوظًا في ‎IndexedDB‎ فيُستعاد بعد إغلاق المتصفّح. فتصير كلّ حفظةٍ
     في الدرج حفظةً في ملفٍّ على سطح مكتبك — ولو فُرّغ المتصفّح كلُّه بقي الملفّ.
     والإذنُ لا يُورَّث بين الجلسات: أوّلُ محاولةٍ بعد فتح المتصفّح تحتاج ضغطةً واحدة،
     فيُعرض شريطٌ هادئ يطلبها ولا يُلحّ. ولا يُبنى على المرآة شيءٌ في المنطق —
     هي نسخةٌ صامتة، إن غابت فالموقع كما كان */
  const MIR_DB = 'academia2-mirror';
  let mirHandle = null, mirT = 0, mirAsked = false;
  const idbHandle = (mode, val) => new Promise(res => {
    let rq;
    try { rq = indexedDB.open(MIR_DB, 1); } catch (e) { return res(null); }
    rq.onupgradeneeded = () => rq.result.createObjectStore('h');
    rq.onerror = () => res(null);
    rq.onsuccess = () => {
      const db = rq.result;
      let tx;
      try { tx = db.transaction('h', mode); } catch (e) { return res(null); }
      const st = tx.objectStore('h');
      /* ‎put‎ ترمي مباشرةً (لا عبر ‎onerror‎) إن كانت القيمة غير قابلة للنسخ.
         ولا يجوز أن يُسقط عجزُ **تذكُّر** المِقبض عمليّةَ الوصل نفسَها: أسوأُ ما يقع
         حينئذٍ أن تُعيد اختيار الملفّ بعد إغلاق المتصفّح — لا أن تبقى بلا نسخة */
      let op;
      try { op = mode === 'readwrite' ? st.put(val, 'file') : st.get('file'); }
      catch (e) { return res(null); }
      op.onsuccess = () => res(op.result || null);
      op.onerror = () => res(null);
    };
  });
  /* الكتابة مؤجَّلة: الحالةُ تُحفظ عشرات المرّات في الدقيقة، والملفُّ لا يحتمل ذلك */
  function mirrorSoon() {
    if (!mirHandle) return;
    clearTimeout(mirT);
    mirT = setTimeout(mirrorNow, 4000);
  }
  async function mirrorNow() {
    if (!mirHandle) return;
    try {
      const p = await mirHandle.queryPermission({ mode: 'readwrite' });
      if (p !== 'granted') { mirrorAsk(); return; }
      const w = await mirHandle.createWritable();
      await w.write(JSON.stringify({ _وقت: new Date().toISOString(), مفتاح: LS_KEY, بيانات: state }, null, 1));
      await w.close();
    } catch (e) { mirrorAsk(); }
  }
  /* طلبُ الإذن مرّةً في الجلسة: شريطٌ فيه زرّ — لأنّ المتصفّح لا يمنح الكتابة إلا بلمسةٍ منك */
  function mirrorAsk() {
    if (mirAsked || document.getElementById('mir-ask')) return;
    mirAsked = true;
    const ar = (state.lang || 'ar') === 'ar';
    const b = document.createElement('div');
    b.id = 'mir-ask';
    b.innerHTML = (ar
      ? '<span>نسختك على الجهاز متوقّفة — المتصفّح يطلب إذنًا بعد كل فتحة.</span><button type="button">استأنف</button>'
      : '<span>Your on-disk copy is paused — the browser asks again each session.</span><button type="button">Resume</button>');
    b.querySelector('button').onclick = async () => {
      try {
        const p = await mirHandle.requestPermission({ mode: 'readwrite' });
        if (p === 'granted') { b.remove(); mirAsked = false; mirrorNow(); }
      } catch (e) { /* رُفض: يبقى الشريط */ }
    };
    document.body.appendChild(b);
  }
  /* الوصل: يُختار الملفّ مرّةً واحدة ثمّ يُحفظ مِقبضُه */
  async function mirrorLink() {
    if (!window.showSaveFilePicker) { toast(T().mirNoApi); return; }
    try {
      const h = await window.showSaveFilePicker({
        suggestedName: 'academia2-نسختي.json',
        types: [{ description: 'نسخة أكاديميا', accept: { 'application/json': ['.json'] } }]
      });
      mirHandle = h;
      await idbHandle('readwrite', h);
      mirAsked = false;
      const el = document.getElementById('mir-ask'); if (el) el.remove();
      await mirrorNow();
      toast(T().mirOn);
      renderAcct();
    } catch (e) { /* أُلغي الاختيار */ }
  }
  async function mirrorUnlink() {
    mirHandle = null;
    await idbHandle('readwrite', null);
    renderAcct();
    toast(T().mirOff);
  }
  idbHandle('readonly').then(h => { if (h) { mirHandle = h; renderAcct(); } });

  /* ---------- نصوص الواجهة باللغتين ---------- */
  const I18N = {
    ar: {
      title: 'أكاديميا',
      tabMarket: 'المكتبة', tabLibrary: 'الركن',
      search: 'ابحث عن مادة…', filters: 'تصنيفات',
      hoursGroup: 'عدد الساعات', collegeGroup: 'التخصص',
      hoursChip: h => `${h} ساعات`, hUnit: 'س',
      statGroup: 'حالة المادة', statTodo: 'متبقية — لم تبدأ بعد', statProg: 'قيد التقدم',
      statDone: 'مكتملة ✓',
      actGroup: 'النشاط', lecChip: 'محاضرة', labChip: 'معمل',
      none: 'لا توجد مواد تطابق البحث.', img: 'صورة',
      addTerm: 'إضافة ترم', termPh: 'اسم الترم…', newTermName: 'ترم جديد', addCourse: 'إضافة مادة',
      datesTitle: 'تواريخ الترم', startDate: 'تاريخ البداية', endDate: 'تاريخ النهاية', saveBtn: 'حفظ',
      termSettings: 'إعدادات الترم', termNameLabel: 'اسم الترم', delTermBtn: 'حذف الترم',
      termCourses: 'مواد الترم', noCourses: 'لا مواد في هذا الترم بعد',
      infoSec: 'المادة', shortName: 'الاسم المختصر:', fullName: 'الاسم التفصيلي:',
      descLabel: 'الوصف:', descPh: 'اكتب وصف المادة…', relLabel: 'نسبة الترابط بالمنهج',
      bookName: 'اسم الكتاب:', bookPh: 'اسم الكتاب', bookLabel: 'الكتاب:', bookImgAdd: 'صورة الكتاب',
      copyName: 'نسخ اسم الكتاب', copyEmail: 'نسخ الإيميل', copied: 'تم النسخ ✓',
      docSec: 'الدكاترة', docName: 'اسم الدكتور', docEmail: 'إيميل الدكتور',
      officeHours: 'الساعات المكتبية', addTime: 'إضافة وقت', addHours: 'إضافة ساعات مكتبية', fromT: 'من', toT: 'إلى',
      ampmS: { am: 'ص', pm: 'م' }, ampm: [['am', 'ص'], ['pm', 'م']],
      bldPh: 'المبنى', roomPh: 'المكتب', officeLabel: 'المكتب',
      /* ===== حالُ الدكتور في المربّع المصغَّر — أربعةٌ لا اثنتان (‎docNow‎) =====
         وكانت أربعَ كلماتٍ جامدة (‎drState‎): «قريبا» لا تقول كم، و«غير متاح» لا تقول
         متى. فصارت صيغًا تقول الحالَ ومعها **رقمَها**: «متاح حتى 3:30 م» و«يبدأ بعد
         ساعة و20 د». وذهبت الكلماتُ الأربعُ لأنّه لم يبقَ لها قارئ — والموضعُ الذي
         كان يقرؤها واحد.
         والمثنّى مجرورٌ أبدًا («بعد ساعتين» لا «بعد ساعتان»): لا يقع في هذه الصيغة
         إلّا بعد «بعد» */
      drPillOn: t => 'متاح حتى ' + t, drPillIn: g => 'يبدأ بعد ' + g,
      drPillAt: t => 'يبدأ ' + t, drPillBack: w => 'يعود ' + w,
      drLess: 'أقل من دقيقة',
      drGap: (h, m) => h
        ? drUnit(h, 'ساعة', 'ساعتين', 'ساعات', 'ساعة') + (m ? ' و' + m + ' د' : '')
        : drUnit(m, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة'),
      drNoHours: 'لم تسجل ساعاته', drUntil: 'حتى', drIn: 'بعد', drMin: 'دقيقة',
      nkWiden: 'وسّع', nkNarrow: 'ضيّق', drWhenLab: 'الحال', bldLab: 'مبنى', gradeLab2: 'سخاء وعدل تصحيحه', drAll: 'التقييم الكلّي',
      emailLab: 'الإيميل', officeLab: 'المكتب', hoursLab: 'الساعات المكتبية', teachLab: 'تقييم الشرح', absLab: 'الغياب', absLabWide: 'الــغـــيـــاب', lateLab: 'التأخير',
      docDesc: 'وصف الدكتور', docDescPh: 'انطباعك عن الدكتور…',
      teach: 'الشرح', grade: 'سخاء وعدل تصحيحه', gradeS: 'سخاء وعدل تصحيحه',
      days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      daysShort: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس'],
      gradeSec: 'توزيع الدرجات', methodLabel: 'طريقة التقييم',
      distTitle: 'توزيع الدرجة (100%)', distShort: 'توزيع الدرجة', addItem: 'إضافة بند', itemPh: 'اسم البند…',
      remaining: n => `المتبقي ${n}%`, complete: 'اكتمل التوزيع ✓',
      absSec: 'الغياب والتأخير', subAbsence: 'الغياب', subLate: 'التأخير', absPolicy: 'سياسة الغياب والتأخير', expandPost: 'توسيع', collapsePost: 'طيّ',
      /* ألفاظُ حال الغياب — ولكلّ حالٍ لفظُها. والعددُ يُصرَّف: «2 غياب» ليست عربيّة */
      absCount: n => n === 1 ? 'غياب واحد' : n === 2 ? 'غيابان' : n <= 10 ? n + ' غيابات' : n + ' غياب',
      absSay: {
        safe:  c => 'متوفر ' + T().absCount(c.left),
        last:  () => 'اخر غياب مجاني',
        spent: () => 'لا يتوفر غياب',
        ded:   c => 'خصم ' + c.lost + '% بالغياب',
        edge:  () => 'غياب واحد ويقع الحرمان',
        dn:    () => 'وقع الحرمان',
      },
      lessonsSec: 'المواضيع', cardsSec: 'البطائق والملخصات', videosSec: 'الشروح', addLesson: 'إضافة موضوع', resLabel: 'الموارد',
      vidList: 'قائمة المواضيع التي تشرحها:', vidPickList: '— اختر قائمة —', vidNewList: '➕ أنشئ قائمتك',
      vidBuildList: 'مواضيع قائمتك:', vidLesson: 'الموضوع الذي يشرحه هذا الشرح:', vidVideos: 'الشروح',
      vidAddFile: 'ملف', vidAddLink: 'رابط', vidLinkPh: 'رابط الفيديو (يوتيوب/درايف…)', vidFilePick: 'اختر ملف فيديو…',
      vidExplains: 'يشرح', vidFromList: 'بناء على قائمة مواضيع', vidNoList: 'لا توجد قوائم مواضيع بعد — أنشئ قائمتك',
      vidBig: '(الفيديو أكبر من الحد — استخدم رابطًا)',
      vidPut: n => `ضعه في assets/video باسم ${n}`,
      vidGet: 'نزّله باسمه',
      vidMyList: 'قائمتي', vidLessonsHead: 'مواضيع القائمة — أضف شرحًا أمام ما تشرحه:',
      vxBest: '⭐ الأفضل', vxByExp: '👤 حسب الشارح', vxAll: '📚 الكل',
      vxListOf: n => `قائمة ${n}`, vxNone: 'لا شروح بعد', vxNoExp: n => `لا شرح من ${n}`,
      cxListHead: 'قائمة المواضيع التي تبني عليها بطائقك:', cxTopicsHead: 'مواضيع القائمة — أضف بطائق ومجلدات تحت ما تريد:',
      cxAddCard: 'بطاقة', cxAddMcq: 'سؤال اختيار من متعدّد', cxAddFolder: 'مجلد', cxBack: 'الجواب…',
      cxJrOn: 'رحلة', cxJrOff: 'قائمة',
      cxJrOnTip: 'اجعلها رحلة: قضيب ومحطات ترشد القارئ إلى ترتيب السير',
      cxJrOffTip: 'اجعلها قائمة: بلا محطات، والاسماء تكسب عرض الحاشية',
      /* اسم البطاقة (ROADMAP-CARD-NAMES): نائبُ الخاوية، واسمُ ملفٍّ للصور التي أُدرجت قبل هذا الباب */
      cxNoName: 'بطاقة فارغة', cxImgFile: 'صورة',
      cxMeNone: 'لم تُجرّبها بعد',
      cxMeOk: n => `أصبتَها ${n} ${n === 1 ? 'مرّة' : n === 2 ? 'مرّتين' : 'مرّات'}`,
      cxMeNo: n => `أخطأتَها ${n} ${n === 1 ? 'مرّة' : n === 2 ? 'مرّتين' : 'مرّات'}`,
      /* نافذة إضافة البطاقة */
      cdTitle: 'إضافة بطاقة', cdEditTitle: 'تعديل البطاقة',
      cdLang: 'لغة البطاقة', cdLangAr: 'عربي', cdLangEn: 'إنجليزي',
      cdType: 'نوع البطاقة',
      cdRootLib: 'المكتبة', cdRootNook: 'الركن', cdRootFolder: 'الجذر', cdWhere: 'مكان الحفظ — اضغط لاختيار مجلد',
      cdPrev: 'البطاقة السابقة', cdNext: 'البطاقة التالية', cdNewCard: 'بطاقة جديدة',
      cdToDest: 'أنزِلها في وجهتها', cdInDest: 'استقرّت في وجهتها',
      cdContrib: 'مساهمة', cdInWord: 'في',
      cdHereFolder: 'ملفّها — لا تكون البطاقة إلا في ملفٍّ واحد',
      cdMoveHere: 'انقلها إلى الملفّ المختار — تنفصل عن ملفّها الحاليّ',
      cdMovePub: 'انقلها إلى الملفّ المختار وانشر تعديلك — بضغطةٍ واحدة',
      pstUnlist: 'غير مدرجة', pstUnlistD: 'تراها أنت وحدك — لا تظهر في قوائم المادة',
      pstPub: 'عامّة', pstPubD: 'تظهر لكل من يفتح المادة',
      pstPriv: 'خاصّة', pstPrivD: 'لك وحدك — ولا رابط لها',
      doneBtn: 'تمّ',
      pstAskSend: 'من يرى مساهمتك؟',
      pstAskOnly: 'وضع المساهمة',
      cdDrawer: 'دُرج البطائق — اسحبه لتختار نوعًا', cdDrawerShut: 'اطوِ الدُّرج',
      cxOpenCard: 'افتح البطاقة',
      cdPublish: 'عندك تعديلٌ لم يصل أحدًا — اضغط لتنشره نسخةً جديدة',
      cdMe: 'أنت', cdOwnerLbl: 'صاحبها', cdNow: 'الآن', cdHere: 'هنا', cdHereTtl: 'من عندها الآن',
      cdAnsWho: 'من أجاب عنه',
      cdSeen: 'زارها', cdComments: 'تعليقات',
      /* «الصَّيحة»: بلاغُ قارئٍ بأنّ في البطاقة معلومةً قد تكون خاطئة — والصيغةُ تتبع العدد،
         والصفرُ يُقال بالكلام لا يُقرأ رقمًا («لم ينبّه أحد») */
      cdWarn: n => n === 1 ? 'قارئٌ واحدٌ يرى أنّ فيها معلومةً خاطئة'
        : n === 2 ? 'قارئان يريان أنّ فيها معلومةً خاطئة'
        : n <= 10 ? `${n} قرّاءٍ يرون أنّ فيها معلومةً خاطئة`
        : `${n} قارئًا يرون أنّ فيها معلومةً خاطئة`,
      cdWarnNone: 'لم ينبّه أحدٌ على خطأٍ فيها',
      /* ونصُّ الزرّ بلا تشكيل: حركاتُ الملفّ لتعليقاته لا لنصوص الواجهة */
      cdWarnDo: 'نبه بوجود خطأ', cdWarnUndo: 'تراجع عن التنبيه',
      /* شارةُ التحديث في المسار الذاتي — والصفرُ لا يُقال، فلا صيغةَ له */
      jrUpd1: v => `تحدثت — صدرت نسخة ${v}`,
      jrUpdN: c => c === 1 ? 'بطاقة واحدة تحتها تحدثت'
        : c === 2 ? 'بطاقتان تحتها تحدثتا' : `${c} بطاقات تحتها تحدثت`,
      jrUpdTake: v => `خذ النسخة ${v}`,
      /* «الوِردة» — بابان: القارئُ يقترح، وصاحبُها ينظر في الوارد */
      prDo: 'اقترح تحديث', prBox: 'اقتراحات واردة',
      prNewT: 'اقتراحك للتحديث', prOneT: 'اقتراح',
      prSend: 'ارسال', prAdopt: v => `اعتماد كنسخة ${v}`,
      prNth: i => `اقتراح ${i}`,
      prSent: 'وصل اقتراحك', prTaken: 'اعتُمد الاقتراح',
      /* «الوِردة»: تعديلٌ عرضه عليك من نزّل البطاقة — والصفرُ يُقال بالكلام كأختِه */
      cdProps: n => n === 1 ? 'اقتراحُ تعديلٍ واحدٌ ينتظر نظرَك'
        : n === 2 ? 'اقتراحا تعديلٍ ينتظران نظرَك'
        : n <= 10 ? `${n} اقتراحاتِ تعديلٍ تنتظر نظرَك`
        : `${n} اقتراحَ تعديلٍ تنتظر نظرَك`,
      cdPropsNone: 'لم يعرض أحدٌ عليك تعديلًا',
      cdCmtNone: 'لم يُكتب في هذه البطاقة شيءٌ بعد.',   /* (رُفعت ترويسةُ الفقاعة فذهب عنوانُها معها) */
      /* ===== أخبارٌ ثلاثةٌ جديدة — والصفرُ يُقال بالكلام لا يُقرأ رقمًا =====
         كأختيها (الصَّيحة والوِردة): الصيغةُ تتبع العدد، فلا يقف في الشريط رقمٌ لا مسمّى له */
      cdDl: n => n === 0 ? 'لم يأخذها أحدٌ بعد'
        : n === 1 ? 'أخذها واحدٌ في ركنه'
        : n === 2 ? 'أخذاها اثنان في ركنيهما'
        : n <= 10 ? `أخذها ${n} في أركانهم`
        : `أخذها ${n} قارئًا في أركانهم`,
      cdAnsOk: n => n === 0 ? 'لم تُجَب صوابًا بعد'
        : n === 1 ? 'أُجيبت صوابًا مرّةً واحدة'
        : n === 2 ? 'أُجيبت صوابًا مرّتين'
        : n <= 10 ? `أُجيبت صوابًا ${n} مرّات`
        : `أُجيبت صوابًا ${n} مرّة`,
      cdAnsNo: n => n === 0 ? 'لم تُجَب خطأً بعد'
        : n === 1 ? 'أُجيبت خطأً مرّةً واحدة'
        : n === 2 ? 'أُجيبت خطأً مرّتين'
        : n <= 10 ? `أُجيبت خطأً ${n} مرّات`
        : `أُجيبت خطأً ${n} مرّة`,
      /* «اكتب» لا «ردُّك عليهم»: الحقلُ في قاع الفقاعة يُكتب فيه ابتداءً كما يُردّ به،
         والأمرُ القصيرُ أصدقُ من الجملة — وحقلُ الردّ تحت التعليق يلبسه هو نفسُه */
      cdCmtPh: 'اكتب', cdCmtSend: 'إرسال', cdCmtLike: 'مفيد', cdCmtOpen: 'التعليقات',
      /* ===== الحافظة: انسخ · الصق · كرّر =====
         و«كرّر» تقول ما تفعله بلا واسطة: نسخٌ ولصقٌ في ضغطةٍ واحدة */
      cdCopy: 'انسخ البطاقة', cdPaste: 'الصق بطاقةً', cdDup: 'كرّر البطاقة',
      cdPocket: 'حافظةُ البطاقة',
      cdPasteNone: 'لا بطاقةَ في الحافظة',
      cdCopied: 'نُسخت البطاقة', cdPasted: 'لُصقت البطاقة', cdDuped: 'كُرّرت البطاقة',
      cdCmtReply: 'ردّ', cdCmtBack: 'رجوع',
      cdCmtReplies: n => n === 1 ? 'ردٌّ واحد' : n === 2 ? 'ردّان'
        : n <= 10 ? `${n} ردود` : `${n} ردًّا`,
      cdNoneYet: 'لم يزرها أحدٌ بعد', cdVerWord: 'نسخة', cdVerCur: 'الحالية', cdVerNew: 'الأحدث',
      cdVerUp: 'حدِّث إلى الأحدث', cdVerLatest: 'أنت على أحدث نسخة',
      cdVerAll: 'نسخُ هذه البطاقة', cdVerPast: 'تطالع نسخةً مضت — للقراءة لا للكتابة',
      cdVerBack: 'العودة إلى', cdVerTake: 'استعادة هذه النسخة',
      cdRingPub: 'هذه هي النسخة المنشورة عند الناس',
      /* المفرد والمثنّى ثمّ جمعُ القلّة (٣–١٠) ثمّ جمعُ الكثرة (١١+) — العربيّة تفرّق بينها */
      cdAgoU: {
        now: 'الآن', pre: 'قبل',
        min: ['قبل دقيقة', 'قبل دقيقتين', 'دقائق', 'دقيقة'],
        hour: ['قبل ساعة', 'قبل ساعتين', 'ساعات', 'ساعة'],
        day: ['أمس', 'قبل يومين', 'أيام', 'يومًا'],
        month: ['قبل شهر', 'قبل شهرين', 'أشهر', 'شهرًا'],
        year: ['قبل سنة', 'قبل سنتين', 'سنوات', 'سنة'],
      },
      /* شريط الأنواع الأربعة: الاسم وحده في التلميح — الأيقونة هي الواجهة */
      cdKinds: { c: 'الوجهين', cloze: 'الفراغ', io: 'الإخفاء', q: 'المتعدّد' },
      cdStDraft: 'كُتب ولم يُحفظ بعد', cdStSaving: 'يجري الحفظ…', cdStSaved: 'محفوظ',
      cdFront: 'الوجه', cdBack2: 'الظهر', cdSave: 'إضافة', cdSaveEdit: 'حفظ', cdCancel: 'إغلاق',
      vtDragSel: 'اسحب لترتيبها · أو اضغط لتحديدها',
      vtSelRo: 'اضغط لتحديدها',
      cdQ: 'السؤال', cdOpt: 'خيار', cdOptAdd: 'إضافة خيار', cdOptOk: 'اجعله الإجابة الصحيحة',
      cdOptIsOk: 'الإجابة الصحيحة',
      /* «الفراغ»: لسانا الحقلين، وزرُّ اللفّ، وزرُّ التلميح ‎::‎ */
      czText: 'النصّ',
      czBlank: 'اجعله فراغًا في السؤال نفسِه', czBlankNew: 'اجعله فراغًا في سؤالٍ جديد',
      /* وسمُ الفراغ في المحرّر — يُنتقى **باتّجاه كتابة البطاقة** لا بلغة الواجهة */
      czTag: 'بط',
      czHint: 'تلميحٌ يظهر مكان الفراغ في السؤال',
      /* والزرُّ خافتًا يقول لِمَ لا يُضغط، لا «لا تضغطني» وحسب */
      czHintOff: 'التلميح: ضع المؤشّر داخل قوسَي الفراغ ‎{{ }}‎ ليعمل',
      /* «الإخفاء»: الحالُ الخالية ثمّ أدواتُ الأقنعة */
      ioImg: 'الصورة', ioPick: 'تحديد صورة', ioPaste: 'لصق صورة',
      ioRect: 'قناعٌ مستطيل', ioEll: 'قناعٌ بيضويّ', ioSel: 'التحديد والتحريك', ioCol: 'لون القناع',
      /* ===== لسانُ الإخفاء صار زرًّا واحدًا، والشكلُ حكمٌ على المرسوم =====
         كان في اللسان زرّان يضيفان (مستطيلٌ وبيضويّ)، فكان الشكلُ يُختار **قبل** الرسم
         ولا يُبدَّل بعده إلّا بمحوٍ وإعادة. فصار الإضافةُ فعلًا واحدًا (+) يضع مستطيلًا،
         والشكلُ صفةً تُبدَّل في قائمة الشكل نفسِه — حيث تُبدَّل سائرُ صفاته */
      ioAddSh: 'إضافةُ شكل', ioShape: 'الشكل — مستطيلٌ أو بيضويّ', ioShCol: 'لون الشكل',
      ioHideAll: 'إخفاءُ الكلّ — تُسدَل الأقنعةُ كلُّها ويُسأل عن واحد',
      ioHideOne: 'إخفاءُ واحدٍ — يُسدَل المسؤولُ عنه وحدَه والباقي مكشوف',
      ioNoClip: 'لم أجد صورةً في الحافظة — انسخ صورةً ثمّ أعد المحاولة',
      /* حالُ القناع المختار: أهو سؤالٌ يُرفع أم سترٌ يبقى؟ وحدُّه في المحرّر يقولها */
      ioImgDel: 'حذف الصورة — وتُوضع غيرُها',
      /* قائمةُ الصورة: الزرُّ الأيمن على أيّ صورةٍ في الحقول.
         وأبوابُ الفلتر ثلاثةٌ إلى قائمةٍ واحدة — الجهةُ تُقرَّر بالباب الذي تدخل منه،
         فلا تُسأل بعد فتحها «لأيِّ جلد؟» */
      imgFlBoth: 'فلتر الصورة — كلا الجلدين',
      imgFlLight: 'فلتر الصورة — الفاتح وحدَه',
      imgFlDark: 'فلتر الصورة — الداكن وحدَه',
      imgCrop: 'اقتصاص الصورة',
      flNames: { none: 'بقاء', baker: 'مُفصِّل', blend: 'مُحبِّر ملوّن', duo: 'مُحبِّر مُفرَّغ', tint: 'مِحفاظ' },
      flNoPix: 'تعذّرت قراءةُ بكسلات الصورة — افتح الموقعَ من خادمٍ محلّيّ لترى المعاينات',
      /* نافذةُ الوجه: معاينةُ سؤالٍ واحدٍ من بطاقة الفراغ */
      czFaceOpen: 'اعرض سؤالَه', czFaceTitle: k => `الفراغ ${k}`,
      czFaceSub: 'معاينةٌ — لا تُحرَّر',
      /* واسمُ وجه «الإخفاء» عددُ أقنعته: لا حرفَ في الصورة يُقتبس */
      ioFace: c => c === 1 ? 'قناع' : c === 2 ? 'قناعان' : `${c} أقنعة`,
      ioKind: 'حالُ القناع', ioQm: 'قناعُ سؤالٍ — يُرفع عند الجواب (حدُّه منقّط)',
      ioFx: 'قناعٌ ثابت — يبقى بعد الجواب (حدُّه مصمت)', ioDel: 'حذف القناع',
      /* منتقي وجه المجلد */
      ffTitle: 'لون المجلد ووجهه', ffFolder: 'مجلد', ffEmoji: 'إيموجي',
      ffSearch: 'ابحث', ffAll: 'الكل', ffNone: 'لا نتيجة', cdOptNo: 'اجعله خاطئًا', cdOptDel: 'حذف الخيار',
      cdBold: 'غامق', cdItalic: 'مائل', cdUnder: 'تحته خطّ', cdHilite: 'تظليل',
      cdColor: 'لون النصّ', cdBullets: 'تنقيط', cdNumbers: 'ترقيم',
      cdEmpty: 'اكتب وجه البطاقة أولًا', cdPopBlocked: 'المتصفّح منع فتح النافذة المستقلّة',
      cdMax: 'تكبير', cdRestore: 'استعادة', cdPop: 'فتح في نافذة مستقلّة',
      cdMin: 'إغلاق مؤقّت', cdMinBack: 'ردُّ النافذة', cdMinHere: 'الانتقال إليها',
      cdSetTtl: 'ما يقع مع الحفظ', cdOnSave: 'مع الحفظ:',
      cdSetClose: 'تُغلق البطاقة', cdSetChain: 'تُفتح جديدة كنوعها',
      cdDelCard: 'حذف البطاقة',
      cdSumTtl: 'ورقةُ الملخّص لهذا الملفّ', cdSumNone: 'لا بطائقَ في هذا الملفّ بعدُ',
      cdDirBtn: 'جهة الكتابة: عربيّ ⇄ إنجليزيّ', cdAlignBtn: 'المحاذاة: يمين · وسط · يسار',
      cdNoColor: 'بلا لون', cdSpectrum: 'من الطيف', cdHexPh: '#كود',
      cdPalLock: 'تباينه ضعيف عليه', cdMyDel: 'احذف هذا اللون',
      cdImgHeavy: 'الصورة كبيرة وحُفظت داخل البطاقة — يُنصح بلقطة أصغر',
      cxCount: n => `${n} بطاقة`, cxByExp: '👤 حسب المساهم',
      cxNone: 'لا بطائق بعد', cxNoExp: n => `لا بطائق من ${n}`,
      cxStudy: 'ذاكِر', cxStudySoon: 'وضع المذاكرة يأتي لاحقًا',
      /* شريط التحديد: العدّادان بلا لفظٍ في الشريط، واللفظُ في التلميح — والعدُّ عربيٌّ
         فيتبع صيغَه: مفردٌ ومثنًّى وجمعُ قلّةٍ وجمعُ كثرة */
      cxBarNC: n => `${n} ${n === 1 ? 'بطاقة محدَّدة' : n === 2 ? 'بطاقتان محدَّدتان' : (n <= 10 ? 'بطائق محدَّدة' : 'بطاقة محدَّدة')}`,
      cxBarNF: n => `${n} ${n === 1 ? 'مجلد محدَّد' : n === 2 ? 'مجلدان محدَّدان' : (n <= 10 ? 'مجلدات محدَّدة' : 'مجلدًا محدَّدًا')}`,
      cxBarSum: 'ذاكر الملخّص', cxBarDel: 'حذف المحدَّد', cxBarClear: 'إلغاء التحديد',
      cxBarTest: 'اختبر نفسك', cxBarLink: 'شارك الرابط',
      /* ولفظٌ للسلّة حين تخفت في «رحلتي»: الفصلُ مرآةُ موضوعٍ في «المادة» لا يُحذف
         من ههنا — فيُقال ذلك ولا يُترك زرٌّ خافتٌ بلا علّة */
      cxBarDelCh: 'الفصول لا تحذف من هنا',
      /* تلميحُ زرّ «ابدأ» — ويصف **ما يقع فعلًا**: لا يختبر بل يحدّد ويُسلّم إلى الشريط.
         وسُمّي ‎pkGoT‎ لا ‎pkTestT‎ بعد أن ذهب الاختبارُ من الفعل: اسمٌ يَعِد بما لا يفعل
         يُضلّ من يقرأ الكود بعد سنة */
      pkGoT: 'حدد الرزمة كلها — ثم ذاكر أو اختبر',
      pkGoV: 'افتح الدورة وابدأ من أولها',
      vwNone: 'لا شرح في هذه الدورة', vwPick: 'اختر شرحا من المسار',
      vwPath: 'المسار', vwPlay: 'شغل هذا الشرح', vwOut: 'افتح في يوتيوب',
      cdOpenRo: 'افتح البطاقة — للقراءة',
      /* لفظُ الزرّ نفسِه — والتلميحُ فوقُ يبقى شرحَه. وهو **قارئٌ للسان**: كان رسمًا
         واحدًا في اللسانين فلم يقرأ لغة، فلمّا صار حرفًا وجب أن يقرأ */
      pkGo: 'ابدأ',
      pkAnsNone: 'لم تُختبر بعد',
      pkAns: (k, n, c) => `أجبتَ ${k} من ${n} · أصبتَ ${c}`,
      xlNew: 'شارك رابطَ اختبار', xlTitle: 'العنوان', xlDesc: 'الوصف',
      xlTitlePh: 'مثلًا: مراجعةُ الفصل الأوّل', xlDescPh: 'ما الذي يجده من فتح الرابط؟',
      xlCopy: 'انسخ الرابط', xlCopied: 'نُسخ الرابط',
      xlHint: 'من فتح هذا الرابط وجد البطائقَ نفسَها محدَّدةً عنده.',
      xlNoTitle: 'اختبارٌ مشترك', xlGone: 'الرزمةُ التي يشير إليها الرابط ليست عندك',
      xlOf: n => `${n} بطاقة`,
      /* تلميحُ معادلة عدّاد المجلد — ما لا يُكتب في الصفّ يُقال هنا */
      cxEqTip: (a, o, f) => `${a} بطاقة تحته · ${o} في المجلد نفسه · ${f} في مجلداته`,
      /* ألفاظُ أطراف المعادلة — يُعرض حرفُها الأوّل، ويُبسط باقيها عند المرور على الصفّ */
      cxEqW: { a: 'كل', r: 'جذر', f: 'تبع' },
      /* ورقة الملخّص */
      shTitle: 'ورقة الملخّص', shRoot: 'الجذر', shPrint: 'طباعة',
      shColN: 'رقم', shColQ: 'السؤال', shColA: 'الإجابة',
      shToDark: 'ورقةٌ داكنة', shToLight: 'ورقةٌ فاتحة',
      /* شارةُ الزرّ: كم بطاقةً تُولَد من هذه — تُقرأ صوتًا ولا تُرى نصًّا */
      cdFaces: n => n === 1 ? 'بطاقةٌ واحدة' : n === 2 ? 'بطاقتان'
        : n <= 10 ? `${n} بطائق` : `${n} بطاقة`,
      shSub: (c, s) => `${c} ${c === 1 ? 'بطاقة' : c === 2 ? 'بطاقتان' : (c <= 10 ? 'بطائق' : 'بطاقة')}`
        + ` · ${s === 1 ? 'قسم واحد' : s === 2 ? 'قسمان' : (s <= 10 ? `${s} أقسام` : `${s} قسمًا`)}`,
      shPages: n => `${n} ${n === 1 ? 'ورقة' : n === 2 ? 'ورقتان' : (n <= 10 ? 'أوراق' : 'ورقة')} · A4`,
      cxsShow: 'أظهر الإجابة',
      cxsEnd: 'إنهاء ↩', cxsAgain: 'أعدها 🔁', cxsShuffle: 'خلط',
      cxsAgainBtn: 'مرة أخرى', cxsHard: 'صعب', cxsGood: 'جيد', cxsEasy: 'سهل',
      cxsNow: 'الآن', cxsDays: n => n === 1 ? 'يوم' : n === 2 ? 'يومان' : n <= 10 ? `${n} أيام` : `${n} يوم`,
      pkCards: n => `${n} بطاقة`, pkMcq: n => `${n} سؤال اختيار من متعدّد`, pkFolders: n => `${n} مجلد`, pkVids: n => `${n} فيديو`,
      pkExpand: 'توسيع', pkCollapse: 'تضييق', pkDur: 'المدة الإجمالية',
      vidTitlePh: 'عنوان الفيديو…', vidDurPh: 'المدة 12:40',
      pkTitlePh: 'العنوان', pkCover: 'صورة الغلاف — اضغط للرفع', pkFolderN: 'مجلد',
      vtDrag: 'اسحب لترتيبه أو نقله إلى مجلد',
      fxOpen: 'إضافة', fxClose: 'إخفاء أنواع الإضافة',
      cxsDone: n => `أنهيت ${n} بطاقة`,
      cxDueBtn: 'المستحق', cxbNew: 'بطائق جديدة لم تُذاكر', cxbDue: 'بطائق مستحقة للمراجعة اليوم',
      wizTitle: 'جهّز نسختك', wizProgress: (i, n) => `البند ${i} من ${n}`,
      wizPrev: 'السابق', wizSkip: 'تخطٍّ', wizNext: 'التالي',
      wizAdd: t => `أضِف لمكتبة ${t} ✓`, wizSave: 'حفظ الاختيارات ✓',
      wizEmpty: 'لا مساهمات بعد في هذا البند — سيبقى فارغًا في نسختك وتقدر تعبّيه لاحقًا',
      prepBadge: 'جهّزها',
      addedToLib: n => `تمت إضافة «${n}» إلى مكتبك`,
      masteryDot: 'إتقان المادة',
      /* قُمرة المادة في الرَّكن (هيكل «على ذوقي») */
      hoursShort: 'ساعات', closeBtn: 'إغلاق',
      nkPickTip: 'اختر مساهمة', contribsTitle: 'المساهمات',
      cancelBtn: 'إلغاء',
      pubTitle: 'تشكيلك للمادة', pubTitleDoc: 'تشكيلك للدكتور', pubOn: 'عام', pubOff: 'خاص',
      pubTip: 'بجعله عامًّا يصير تشكيلك مساهمةً في بند «المادة»',
      saveNeedAll: 'أكمل بنود التشكيل الخمسة أولًا',
      pkDragTip: 'اسحب المساهمة أو أحد بنودها إلى اليسار',
      nkCalendar: 'التقويم', nkCourse: 'المادة', nkDoctor: 'الدكتور',
      nkGrade: 'الدرجة', nkResources: 'الموارد', nkSelfProgress: 'تقدمي الذاتي',
      jrEmpty: 'لا مواضيع لهذه المادة بعد — تُكتب في مربع «المادة»، وتظهر هنا',
      jrAddC: 'بطاقة', jrAddF: 'مجلد', jrAddK: 'مهمة', jrDel: 'حذف',
      jrAddI: 'استورد من المكتبة',
      jriTitle: 'استورد من المكتبة', jriPick: 'اختر ما تستورد منه',
      jriBack: 'رجوع إلى البابين',
      jrHollow: 'لا شيء في هذا الفصل بعد',
      jriEmpty: 'حدد ما تريد استيراده', jriTo: 'إلى', jriDo: 'استيراد',
      jriRoot: 'جذر الرحلة', jriWhere: 'إلى أي مجلد يذهب المستورد',
      jriNV: n => `${n} ${n === 1 ? 'فيديو' : n === 2 ? 'فيديوهان' : (n <= 10 ? 'فيديوهات' : 'فيديو')}`,
      jriNF: n => `${n} ${n === 1 ? 'مجلد' : n === 2 ? 'مجلدان' : (n <= 10 ? 'مجلدات' : 'مجلدا')}`,
      jriNC: n => `${n} ${n === 1 ? 'بطاقة' : n === 2 ? 'بطاقتان' : (n <= 10 ? 'بطائق' : 'بطاقة')}`,
      jrTaskPh: 'اكتب المهمة…', jrCardPh: 'وجه البطاقة…', jrFoldPh: 'اسم المجلد…',
      /* مقابض مربع المادة المرن */
      nkiW: 'اسحب: عرض المربع', nkiH: 'اسحب: طول المربع', nkiWH: 'اسحب: العرض والطول',
      gmPct: 'درجتك في هذا البند بالمئة', gmDue: 'موعد البند',
      chNumPh: 'رقم', chNamePh: 'اسم الموضوع', chTag: 'فـ',
      topicsSec: 'مواضيع المادة', topicsCount: n => `${n} موضوع`, topicsWord: n => 'موضوع',
      copyTopic: 'نسخ عنوان الفصل',
      absFree: 'غيابات مجانية', absDedFrom: 'الخصم يبدأ في الغياب',
      absDedAmt: 'الخصم لكل غياب', absDN: 'DN عند الغياب رقم', absLate: 'كم تأخير يعادل غيابًا',
      legFree: 'مجاني', legDed: 'خصم', legDN: 'DN', dedRowLab: 'خصم الغياب/التأخير', bonRowLab: 'درجات اضافية',
      lateNote: n => `كل ${n} تأخير = غياب واحد`,
      studySec: 'المصادر والملفات', natureSec: 'نوعية المادة', courseType: 'نوعية المادة',
      courseLang: 'لغة المادة', langs: { ar: 'عربي', en: 'إنجليزي' },
      noData: 'لا توجد معلومات بعد',
      communityTitle: 'المساهمات', sharePost: 'شارك علمك', shareBtn: 'مشاركة', typePick: 'نوعية المادة', meName: 'أنا',
      acctTitle: 'الحساب', acctName: 'الاسم', acctNamePh: 'اسمك', acctPhone: 'رقم الجوال', acctPhonePh: '05xxxxxxxx', acctPhoto: 'غيّر الصورة',
      acctEmail: 'الإيميل', acctEmailPh: 'name@example.com', acctPassword: 'كلمة المرور', acctPasswordPh: '••••••••', logout: 'تسجيل الخروج', deleteAcct: 'حذف الحساب', deleteConfirm: 'اضغط مرة أخرى للتأكيد', siteName: 'أكاديميا', sideClose: 'إغلاق الشريط', sideOpen: 'فتح الشريط',
      /* ===== الزائر ===== */
      guest: 'زائر', join: 'إنشاء حساب', login: 'تسجيل الدخول',
      joinTitle: 'أنشئ حسابك', loginTitle: 'سجّل دخولك',
      joinGo: 'أنشئ الحساب', loginGo: 'ادخل',
      haveAcct: 'عندك حساب؟ سجّل دخولك', noAcct: 'ما عندك حساب؟ أنشئ واحدًا',
      /* ورسائلُ المنع تقول **ما مُنع** لا «ممنوع»: الزائرُ يعرف ما يفوته فيختار */
      needAcctLike: 'الإعجاب للأعضاء — أنشئ حسابك',
      needAcctPost: 'المشاركة في المساهمات للأعضاء — أنشئ حسابك',
      needAcctNook: 'الركن للأعضاء',
      needAcctNookWhy: 'هنا تبني ترمك: تضيف موادك وتتابع درجاتك وتقدّمك. ويحتاج حسابًا كي يبقى لك.',
      guestCan: 'وأنت زائر تقدر تتصفّح المكتبة وتذاكر البطائق وتختبر — واختباراتك تُسجَّل لك.',
      /* وأخطاءُ النموذج تقول أيَّ حقلٍ بالضبط: «تحقّق من بياناتك» تُبقي المستخدم يخمّن */
      errName: 'اكتب اسمك', errEmail: 'اكتب إيميلًا صحيحًا', errPass: 'كلمة المرور ٦ أحرف فأكثر',
      /* ولا تُذكر «هذا المتصفّح» بعد اليوم: الحسابُ صار على الخادم يعبر الأجهزة.
         وهذان النصّان لا يُريان إلّا على ‎file://‎ حيث لا خادمَ ولا عبور — لكنّ
         نصًّا كاذبًا لا يُترك لأنّ موضعَه نادر */
      errNoAcct: 'ما فيه حساب بهذا الإيميل', errPassWrong: 'كلمة المرور غير صحيحة',
      /* ورسائلُ الخادم: تقول ما وقع بلا أن تُفشي. «لا حساب» و«كلمةٌ خاطئة» رسالةٌ
         واحدةٌ عمدًا — التفريقُ يُخبر المهاجمَ أيُّ العناوين مسجَّلٌ عندنا */
      errBadLogin: 'الإيميل أو كلمة المرور غير صحيحة',
      errTaken: 'هذا الإيميل مسجَّل — سجّل دخولك',
      errNet: 'تعذّر الوصول إلى الخادم — تحقّق من اتصالك',
      srvTooBig: 'المساهمة كبيرة على النشر — خفّف صورها أو قسّمها',
      /* ولا وعظَ في رسالةِ منع: كانت «لا تُعجب بمساهمتك — والعدّ الذي يُرتَّب به
         لا يُزكّيه صاحبُه». والسببُ صحيحٌ ومكانُه التعليقُ في الشيفرة لا شريطٌ
         يُقرأ في ثانية. فيُقال ما وقع وحدَه */
      likeSelf: 'الإعجاب لمساهمات غيرك',
      /* ونصّان بعد أن شُحن التعليق: الأوّلُ لإعجاب تعليقٍ وارد (لم يُبنَ بعد)،
         والثاني لعقدةٍ من جذبٍ قديمٍ لا تحمل أصلَها — تُشفى بفتح المادّة */
      cmtLikeSelf: 'الإعجاب لكلام غيرك',
      cmtStale: 'حدِّث الصفحة ليصل كلامُك',
      authWait: 'لحظة…',
      /* والصدقُ في مكانه: حسابٌ في الدرج ليس حسابًا على خادم، فيُقال ولا يُخفى */
      localAcctNote: 'حسابك محفوظ في هذا المتصفّح وحده — لا يعبر إلى جهاز آخر بعد.',
      noResetNote: 'وبعد الإنشاء يظهر لك رمز استرجاع — احفظه، فهو طريقك الوحيد لو نسيت كلمة المرور.',
      recTitle: 'رمز الاسترجاع',
      recWhy: 'هذا رمزك. يُعرض مرة واحدة ولن يُعرض ثانية. احفظه في مكان آمن — بدونه لا سبيل لاسترجاع حسابك لو نسيت كلمة المرور.',
      recCopy: 'انسخ الرمز', recCopied: 'نُسخ ✓', recSaved: 'حفظته',
      recNew: 'وهذا رمزك الجديد — القديم لم يعد يعمل.',
      forgot: 'نسيت كلمة المرور؟',
      recFormTitle: 'استرجع حسابك', recFormWhy: 'اكتب إيميلك ورمز الاسترجاع الذي حفظته، واختر كلمة مرور جديدة.',
      recCodeLabel: 'رمز الاسترجاع', recCodePh: 'XXXXX-XXXXX-XXXXX-XXXXX',
      recNewPass: 'كلمة المرور الجديدة', recGo: 'استرجع',
      errRecBad: 'الإيميل أو رمز الاسترجاع غير صحيح',
      recLost: 'ضاع منك الرمز؟ راجع صاحب الموقع يُصدر لك واحدًا جديدًا.',
      /* المرآة: نصوصٌ تقول ما يقع بالضبط — «نسخة حيّة» لا «نسخة احتياطية»، فالفرق أنّها تُكتب بلا طلبك */
      mirTitle: 'نسختي على الجهاز',
      mirWhy: 'اربطها بملفٍّ على سطح مكتبك، فتُكتب فيه كلّ حفظة. ولو فُرّغ المتصفّح بالكامل بقي عندك كل شيء.',
      mirLinked: 'موصولة بـ', mirLink: 'اربط ملفًّا', mirChange: 'غيّر الملفّ', mirUnlink: 'افصل',
      mirOn: 'وُصلت — بياناتك تُكتب في الملفّ مع كل حفظة',
      mirOff: 'فُصلت — لا تُكتب نسخةٌ على الجهاز بعد الآن',
      mirNoApi: 'هذا المتصفّح لا يسمح بالكتابة في ملفّ — استعمل «الخزنة» للتصدير اليدويّ',
      backToList: 'المشاركات', backToDoctors: 'الدكاترة', docAvg: 'متوسط التقييم', docByAnon: 'أحد الأعضاء', noPosts: 'لا مشاركات بعد — كن أول من يشارك علمه',
      editPost: 'تعديل مشاركتي', delPost: 'حذف مشاركتي', pinItem: 'تثبيت', unpinItem: 'إلغاء التثبيت', pinnedTag: 'مثبّتة', editItem: 'تعديل', delItem: 'حذف', optionsBtn: 'خيارات',
      thumbUp: 'مفيد', thumbDown: 'غير مفيد', reportItem: 'إبلاغ', reportedItem: 'تم الإبلاغ ✓',
      completeTip: (f, n) => `اكتمال المساهمة: ${f} من ${n} بنود`,
      completePct: n => `اكتمال التوزيع: ${n}% من 100%`,
      sortBy: 'ترتيب', sortBest: 'الأفضل', sortNewest: 'الأحدث', contribUnit: 'مساهمة',
      filterByDoctor: 'تصفية حسب الدكتور', allDoctors: 'كل الدكاترة', docPickLab: 'الدكتور',
      prevDoctor: 'السابق', nextDoctor: 'التالي',
      dispTitle: 'طريقة الإظهار', dispBest: 'أفضل', dispAll: 'كل', aboutLabel: 'المساهمات عن',
      ago: n => {
        if (n === 0) return 'اليوم';
        if (n === 1) return 'أمس';
        if (n === 2) return 'قبل يومين';
        if (n <= 10) return `قبل ${n} أيام`;
        if (n < 30) { const w = Math.round(n / 7); return w === 2 ? 'قبل أسبوعين' : `قبل ${w} أسابيع`; }
        if (n < 365) { const m = Math.round(n / 30); return m === 1 ? 'قبل شهر' : m === 2 ? 'قبل شهرين' : m <= 10 ? `قبل ${m} أشهر` : `قبل ${m} شهرًا`; }
        const y = Math.round(n / 365); return y === 1 ? 'قبل سنة' : y === 2 ? 'قبل سنتين' : y <= 10 ? `قبل ${y} سنوات` : `قبل ${y} سنة`;
      },
      dateAbs: 'إظهار التاريخ الرقميّ', dateRel: 'العودة إلى الزمن النسبيّ',
      noDoctors: 'لا يوجد دكاترة بعد',
      ctypes: { none: 'لا تحتاج مذاكرة', theory: 'نظرية فقط', practical: 'عملية فقط', both: 'نظرية وعملية' },
      studySrc: 'مصادر الفهم', practiceSrc: 'مصادر الممارسة', backToSrc: 'المصادر',
      primary: 'أساسي', secondary: 'فرعي',
      src_file: 'ملف', src_link: 'رابط', src_text: 'نص',
      textPh: 'اكتب هنا…', openLink: 'فتح', download: 'تنزيل', filePick: 'اختر ملفًا…',
      fmtBold: 'عريض', fmtItalic: 'مائل', fmtList: 'قائمة نقطية',
      fileTooBig: '(الملف أكبر من 3MB)',
      startsIn: n => `سيبدأ بعد ${n === 1 ? 'يوم واحد' : n === 2 ? 'يومين' : n <= 10 ? `${n} أيام` : `${n} يوم`}`,
    },
    en: {
      title: 'Academia',
      tabMarket: 'Library', tabLibrary: 'Nook',
      search: 'Search for a course…', filters: 'Filters',
      hoursGroup: 'Credit hours', collegeGroup: 'Specialization',
      hoursChip: h => h === 1 ? '1 hour' : `${h} hours`, hUnit: 'h',
      statGroup: 'Course status', statTodo: 'Remaining — not started', statProg: 'In progress',
      statDone: 'Done ✓',
      actGroup: 'Activity', lecChip: 'Lecture', labChip: 'Lab',
      none: 'No courses match your search.', img: 'Photo',
      addTerm: 'Add term', termPh: 'Term name…', newTermName: 'New term', addCourse: 'Add course',
      datesTitle: 'Term dates', startDate: 'Start date', endDate: 'End date', saveBtn: 'Save',
      termSettings: 'Term settings', termNameLabel: 'Term name', delTermBtn: 'Delete term',
      termCourses: 'Term courses', noCourses: 'No courses in this term yet',
      infoSec: 'Course', shortName: 'Short name:', fullName: 'Detailed name:',
      descLabel: 'Description:', descPh: 'Write a course description…', relLabel: 'Curriculum connection',
      bookName: 'Book name:', bookPh: 'Book name', bookLabel: 'Book:', bookImgAdd: 'Book cover',
      copyName: 'Copy book name', copyEmail: 'Copy email', copied: 'Copied ✓',
      docSec: 'Instructors', docName: 'Name', docEmail: 'Email',
      officeHours: 'Office hours', addTime: 'Add time', addHours: 'Add office hours', fromT: 'From', toT: 'To',
      ampmS: { am: 'AM', pm: 'PM' }, ampm: [['am', 'AM'], ['pm', 'PM']],
      bldPh: 'Building', roomPh: 'Office', officeLabel: 'Office',
      drPillOn: t => 'In office until ' + t, drPillIn: g => 'Starts in ' + g,
      drPillAt: t => 'Starts ' + t, drPillBack: w => 'Back ' + w,
      drLess: 'less than a minute',
      drGap: (h, m) => h ? (h + ' h' + (m ? ' ' + m + ' m' : '')) : (m + ' min'),
      drNoHours: 'No hours listed', drUntil: 'Until', drIn: 'In', drMin: 'min',
      nkWiden: 'Expand', nkNarrow: 'Collapse', drWhenLab: 'Status', bldLab: 'Bldg', gradeLab2: 'Grading fairness', drAll: 'Overall',
      emailLab: 'Email', officeLab: 'Office', hoursLab: 'Office hours', teachLab: 'Teaching rating', absLab: 'Absence', absLabWide: 'Absence', lateLab: 'Lateness',
      docDesc: 'About the instructor', docDescPh: 'Your impression of the instructor…',
      teach: 'Teaching', grade: 'Grading generosity & fairness', gradeS: 'Grading generosity & fairness',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      gradeSec: 'Grade breakdown', methodLabel: 'Grading method',
      distTitle: 'Grade breakdown (100%)', distShort: 'Grade breakdown', addItem: 'Add item', itemPh: 'Item name…',
      remaining: n => `${n}% left`, complete: 'Fully allocated ✓',
      absSec: 'Absence & lates', subAbsence: 'Absence', subLate: 'Lates', absPolicy: 'Absence & lateness policy', expandPost: 'Expand', collapsePost: 'Collapse',
      absCount: n => n === 1 ? '1 absence' : n + ' absences',
      absSay: {
        safe:  c => T().absCount(c.left) + ' left',
        last:  () => 'Last free absence',
        spent: () => 'No free absence left',
        ded:   c => c.lost + '% deducted',
        edge:  () => 'One absence before DN',
        dn:    () => 'Denied (DN)',
      },
      lessonsSec: 'Topics', cardsSec: 'Cards & summaries', videosSec: 'Explanations', addLesson: 'Add topic', resLabel: 'Resources',
      vidList: 'Topics list you explain:', vidPickList: '— pick a list —', vidNewList: '➕ Create your list',
      vidBuildList: "Your list's topics:", vidLesson: 'The topic this explains:', vidVideos: 'Explanations',
      vidAddFile: 'File', vidAddLink: 'Link', vidLinkPh: 'Video link (YouTube/Drive…)', vidFilePick: 'Choose a video file…',
      vidExplains: 'explains', vidFromList: 'based on a topics list', vidNoList: 'No topic lists yet — create yours',
      vidBig: '(video exceeds the limit — use a link)',
      vidPut: n => `Put it in assets/video as ${n}`,
      vidGet: 'Download it renamed',
      vidMyList: 'My list', vidLessonsHead: 'List topics — add an explanation next to what you explain:',
      vxBest: '⭐ Best', vxByExp: '👤 By explainer', vxAll: '📚 All',
      vxListOf: n => `${n}'s list`, vxNone: 'No explanations yet', vxNoExp: n => `No explanation by ${n}`,
      cxListHead: 'Topics list your cards build on:', cxTopicsHead: 'List topics — add cards & folders under any:',
      cxAddCard: 'Card', cxAddMcq: 'Multiple-choice question', cxAddFolder: 'Folder', cxBack: 'Answer…',
      cxJrOn: 'Journey', cxJrOff: 'List',
      cxJrOnTip: 'Make it a journey: a rail and stops that guide the reader through the order',
      cxJrOffTip: 'Make it a list: no stops, and names gain the gutter width',
      cxNoName: 'Empty card', cxImgFile: 'image',
      cxMeNone: 'Not attempted yet',
      cxMeOk: n => `You got it right ${n === 1 ? 'once' : n + ' times'}`,
      cxMeNo: n => `You got it wrong ${n === 1 ? 'once' : n + ' times'}`,
      cdTitle: 'Add card', cdEditTitle: 'Edit card',
      cdLang: 'Card language', cdLangAr: 'Arabic', cdLangEn: 'English',
      cdType: 'Card type',
      cdRootLib: 'Library', cdRootNook: 'Nook', cdRootFolder: 'Top level', cdWhere: 'Where it is saved — click to pick a folder',
      cdPrev: 'Previous card', cdNext: 'Next card', cdNewCard: 'New card',
      cdToDest: 'Drop it in its destination', cdInDest: 'Settled in its destination',
      cdContrib: 'Contribution', cdInWord: 'in',
      cdHereFolder: 'Its folder — a card lives in exactly one',
      cdMoveHere: 'Move it to the selected folder — it leaves its current one',
      cdMovePub: 'Move it to the selected folder and publish your edit — in one click',
      pstUnlist: 'Unlisted', pstUnlistD: 'Only you see it — it stays out of the course lists',
      pstPub: 'Public', pstPubD: 'Everyone who opens the course sees it',
      pstPriv: 'Private', pstPrivD: 'Yours alone — no link to it',
      doneBtn: 'Done',
      pstAskSend: 'Who sees your contribution?',
      pstAskOnly: 'Contribution status',
      cdDrawer: 'Card drawer — pull it down to pick a type', cdDrawerShut: 'Collapse the drawer',
      cxOpenCard: 'Open the card',
      cdPublish: 'You have an unpublished edit — click to publish it as a new version',
      cdMe: 'You', cdOwnerLbl: 'owner', cdNow: 'now', cdHere: 'here', cdHereTtl: 'Who has it right now',
      cdAnsWho: 'Who answered it',
      cdSeen: 'Seen by', cdComments: 'comments',
      cdWarn: n => n === 1
        ? '1 reader thinks something here may be wrong'
        : `${n} readers think something here may be wrong`,
      cdWarnNone: 'No one has flagged anything wrong here',
      cdWarnDo: 'Report an error', cdWarnUndo: 'Withdraw report',
      jrUpd1: v => `Updated — version ${v} is out`,
      jrUpdN: c => c === 1 ? '1 card below was updated' : `${c} cards below were updated`,
      jrUpdTake: v => `Take version ${v}`,
      prDo: 'Suggest an update', prBox: 'Incoming suggestions',
      prNewT: 'Your update suggestion', prOneT: 'Suggestion',
      prSend: 'Send', prAdopt: v => `Adopt as version ${v}`,
      prNth: i => `Suggestion ${i}`,
      prSent: 'Your suggestion was sent', prTaken: 'Suggestion adopted',
      cdProps: n => n === 1
        ? '1 suggested edit is waiting for you'
        : `${n} suggested edits are waiting for you`,
      cdPropsNone: 'No one has suggested an edit',
      cdCmtNone: 'Nothing has been written about this card yet.',
      cdDl: n => n === 0 ? 'No one has taken it yet'
        : n === 1 ? 'Taken into 1 nook' : `Taken into ${n} nooks`,
      cdAnsOk: n => n === 0 ? 'Never answered right yet'
        : n === 1 ? 'Answered right once' : `Answered right ${n} times`,
      cdAnsNo: n => n === 0 ? 'Never answered wrong yet'
        : n === 1 ? 'Answered wrong once' : `Answered wrong ${n} times`,
      cdCmtPh: 'Write', cdCmtSend: 'Send', cdCmtLike: 'Helpful', cdCmtOpen: 'Comments',
      cdCopy: 'Copy card', cdPaste: 'Paste card', cdDup: 'Duplicate card',
      cdPocket: 'Card clipboard',
      cdPasteNone: 'Clipboard is empty',
      cdCopied: 'Card copied', cdPasted: 'Card pasted', cdDuped: 'Card duplicated',
      cdCmtReply: 'Reply', cdCmtBack: 'Back',
      cdCmtReplies: n => n === 1 ? '1 reply' : `${n} replies`,
      cdNoneYet: 'No one has seen it yet', cdVerWord: 'ver', cdVerCur: 'Current', cdVerNew: 'Latest',
      cdVerUp: 'Update to the latest', cdVerLatest: 'You are on the latest version',
      cdVerAll: 'Versions of this card', cdVerPast: 'Viewing a past version — read only',
      cdVerBack: 'Back to', cdVerTake: 'Restore this version',
      cdRingPub: 'This is the version people have',
      cdAgoU: {
        now: 'just now', pre: '',
        min: ['a minute ago', '2 minutes ago', 'minutes ago', 'minutes ago'],
        hour: ['an hour ago', '2 hours ago', 'hours ago', 'hours ago'],
        day: ['yesterday', '2 days ago', 'days ago', 'days ago'],
        month: ['a month ago', '2 months ago', 'months ago', 'months ago'],
        year: ['a year ago', '2 years ago', 'years ago', 'years ago'],
      },
      /* بالجمع كما طُلبت: ‎Choices · Sides · Blanks · Occlusions‎ — و«الإخفاء» تُكتب
         بحرفَي ‎c‎ في الإنجليزيّة (‎Occlusions‎)، وهو رسمُها الصحيح */
      cdKinds: { c: 'Sides', cloze: 'Blanks', io: 'Occlusions', q: 'Choices' },
      cdStDraft: 'Typed, not saved yet', cdStSaving: 'Saving…', cdStSaved: 'Saved',
      cdFront: 'Front', cdBack2: 'Back', cdSave: 'Add', cdSaveEdit: 'Save', cdCancel: 'Close',
      vtDragSel: 'Drag to reorder · or click to select',
      vtSelRo: 'Click to select',
      cdQ: 'Question', cdOpt: 'Choice', cdOptAdd: 'Add choice', cdOptOk: 'Mark as the correct answer',
      cdOptIsOk: 'Correct answer',
      czText: 'Text',
      czBlank: 'Blank in the same card', czBlankNew: 'Blank in a new card',
      czTag: 'Ca',
      czHint: 'Hint shown in place of the blank',
      czHintOff: 'Hint: put the caret inside the blank’s ‎{{ }}‎ to use it',
      ioImg: 'Image', ioPick: 'Choose an image', ioPaste: 'Paste an image',
      ioRect: 'Rectangle mask', ioEll: 'Ellipse mask', ioSel: 'Select and move', ioCol: 'Mask colour',
      ioAddSh: 'Add shape', ioShape: 'Shape — rectangle or ellipse', ioShCol: 'Shape colour',
      ioHideAll: 'Hide all, guess one', ioHideOne: 'Hide one, guess one',
      ioNoClip: 'No image in the clipboard — copy one and try again',
      ioImgDel: 'Delete image — then add another',
      imgFlBoth: 'Image filter — both skins',
      imgFlLight: 'Image filter — light only',
      imgFlDark: 'Image filter — dark only',
      imgCrop: 'Crop image',
      flNames: { none: 'Original', baker: 'Auto', blend: 'Ink · colour', duo: 'Ink · mono', tint: 'Keep tint' },
      flNoPix: 'Cannot read the image pixels — open the site from a local server to see previews',
      czFaceOpen: 'Show its question', czFaceTitle: k => `Blank ${k}`,
      czFaceSub: 'Preview — not editable',
      ioFace: c => `${c} mask${c === 1 ? '' : 's'}`,
      ioKind: 'Mask kind', ioQm: 'Question mask — lifts on the answer (dashed border)',
      ioFx: 'Permanent mask — stays after the answer (solid border)', ioDel: 'Delete mask',
      /* Folder face picker */
      ffTitle: 'Folder colour and face', ffFolder: 'Folder', ffEmoji: 'Emoji',
      ffSearch: 'Search', ffAll: 'All', ffNone: 'No match', cdOptNo: 'Mark as wrong', cdOptDel: 'Delete choice',
      cdBold: 'Bold', cdItalic: 'Italic', cdUnder: 'Underline', cdHilite: 'Highlight',
      cdColor: 'Text colour', cdBullets: 'Bullets', cdNumbers: 'Numbering',
      cdEmpty: 'Write the front of the card first', cdPopBlocked: 'The browser blocked the separate window',
      cdMax: 'Maximise', cdRestore: 'Restore', cdPop: 'Open in a separate window',
      cdMin: 'Temporary close', cdMinBack: 'Bring the window back', cdMinHere: 'Go to it',
      cdSetTtl: 'What happens with save', cdOnSave: 'With save:',
      cdSetClose: 'close the card', cdSetChain: 'open a new one of its type',
      cdDelCard: 'Delete card',
      cdSumTtl: 'Summary sheet for this folder', cdSumNone: 'No cards in this folder yet',
      cdDirBtn: 'Writing direction: Arabic ⇄ English', cdAlignBtn: 'Alignment: right · centre · left',
      cdNoColor: 'No colour', cdSpectrum: 'From the spectrum', cdHexPh: '#hex',
      cdPalLock: 'low contrast on it', cdMyDel: 'Remove this colour',
      cdImgHeavy: 'Large image stored inside the card — a smaller shot is better',
      cxCount: n => `${n} cards`, cxByExp: '👤 By contributor',
      cxNone: 'No cards yet', cxNoExp: n => `No cards by ${n}`,
      cxStudy: 'Study', cxStudySoon: 'Study mode coming soon',
      cxBarNC: n => `${n} card${n === 1 ? '' : 's'} selected`,
      cxBarNF: n => `${n} folder${n === 1 ? '' : 's'} selected`,
      cxBarSum: 'Study the summary', cxBarDel: 'Delete selection', cxBarClear: 'Clear selection',
      cxBarTest: 'Test yourself', cxBarLink: 'Share a link',
      cxBarDelCh: 'Chapters cannot be deleted here',
      pkGoT: 'Select the whole pack — then study or test',
      pkGoV: 'Open the course and start from its first',
      vwNone: 'No explanation in this course', vwPick: 'Pick one from the path',
      vwPath: 'The path', vwPlay: 'Play this explanation', vwOut: 'Open on YouTube',
      cdOpenRo: 'Open the card — read only',
      pkGo: 'Start',
      pkAnsNone: 'Not tested yet',
      pkAns: (k, n, c) => `${k} of ${n} answered · ${c} right`,
      xlNew: 'Share a test link', xlTitle: 'Title', xlDesc: 'Description',
      xlTitlePh: 'e.g. Chapter one review', xlDescPh: 'What will they find?',
      xlCopy: 'Copy link', xlCopied: 'Link copied',
      xlHint: 'Whoever opens this link finds the same cards selected.',
      xlNoTitle: 'Shared test', xlGone: 'The pack this link points to is not on your device',
      xlOf: n => `${n} cards`,
      cxEqTip: (a, o, f) => `${a} cards below · ${o} in this folder · ${f} in its subfolders`,
      cxEqW: { a: 'All', r: 'Root', f: 'Follow' },
      shTitle: 'Summary sheet', shRoot: 'Root', shPrint: 'Print',
      shColN: 'No.', shColQ: 'Question', shColA: 'Answer',
      shToDark: 'Dark sheet', shToLight: 'Light sheet',
      cdFaces: n => `${n} card${n === 1 ? '' : 's'}`,
      shSub: (c, s) => `${c} card${c === 1 ? '' : 's'} · ${s} section${s === 1 ? '' : 's'}`,
      shPages: n => `${n} page${n === 1 ? '' : 's'} · A4`,
      cxsShow: 'Show answer',
      cxsEnd: 'End ↩', cxsAgain: 'Again 🔁', cxsShuffle: 'Shuffle',
      cxsAgainBtn: 'Again', cxsHard: 'Hard', cxsGood: 'Good', cxsEasy: 'Easy',
      cxsNow: 'now', cxsDays: n => `${n}d`,
      pkCards: n => `${n} cards`, pkMcq: n => `${n} multiple-choice questions`, pkFolders: n => `${n} folders`, pkVids: n => `${n} videos`,
      pkExpand: 'Expand', pkCollapse: 'Collapse', pkDur: 'Total duration',
      vidTitlePh: 'Video title…', vidDurPh: 'Duration 12:40',
      pkTitlePh: 'Title', pkCover: 'Cover image — click to upload', pkFolderN: 'Folder',
      vtDrag: 'Drag to reorder or move into a folder',
      fxOpen: 'Add', fxClose: 'Hide add types',
      cxsDone: n => `Finished ${n} cards`,
      cxDueBtn: 'Due', cxbNew: 'New cards not studied yet', cxbDue: 'Cards due for review today',
      wizTitle: 'Build your version', wizProgress: (i, n) => `Item ${i} of ${n}`,
      wizPrev: 'Back', wizSkip: 'Skip', wizNext: 'Next',
      wizAdd: t => `Add to ${t} ✓`, wizSave: 'Save picks ✓',
      wizEmpty: 'No contributions here yet — it stays empty in your version, fill it later',
      prepBadge: 'Set up',
      addedToLib: n => `“${n}” was added to your library`,
      masteryDot: 'Course mastery',
      /* Course cockpit in the Nook */
      hoursShort: 'hours', closeBtn: 'Close',
      nkPickTip: 'Pick a contribution', contribsTitle: 'Contributions',
      cancelBtn: 'Cancel',
      pubTitle: 'Your course composition', pubTitleDoc: 'Your instructor composition', pubOn: 'Public', pubOff: 'Private',
      pubTip: 'Making it public turns your composition into a “Course” contribution',
      saveNeedAll: 'Fill all five fields first',
      pkDragTip: 'Drag a contribution — or one of its fields — to the left',
      nkCalendar: 'Calendar', nkCourse: 'Course', nkDoctor: 'Instructor',
      nkGrade: 'Grade', nkResources: 'Resources', nkSelfProgress: 'My progress',
      jrEmpty: 'No topics for this course yet — write them in the «Course» box and they appear here',
      jrAddC: 'Card', jrAddF: 'Folder', jrAddK: 'Task', jrDel: 'Delete',
      jrAddI: 'Import from library',
      jriTitle: 'Import from library', jriPick: 'Pick what to import from',
      jriBack: 'Back to the two doors',
      jrHollow: 'Nothing in this chapter yet',
      jriEmpty: 'Select what you want to import', jriTo: 'to', jriDo: 'Import',
      jriRoot: 'Journey root', jriWhere: 'Which folder the import lands in',
      jriNV: n => `${n} video${n === 1 ? '' : 's'}`,
      jriNF: n => `${n} folder${n === 1 ? '' : 's'}`,
      jriNC: n => `${n} card${n === 1 ? '' : 's'}`,
      jrTaskPh: 'Write the task…', jrCardPh: 'Card front…', jrFoldPh: 'Folder name…',
      nkiW: 'Drag: box width', nkiH: 'Drag: box height', nkiWH: 'Drag: width and height',
      gmPct: 'Your score on this item (%)', gmDue: 'Item date',
      chNumPh: 'No.', chNamePh: 'Topic name', chTag: 'Ch',
      topicsSec: 'Course topics', topicsCount: n => n === 1 ? '1 topic' : `${n} topics`, topicsWord: n => n === 1 ? 'topic' : 'topics',
      copyTopic: 'Copy topic title',
      absFree: 'Free absences', absDedFrom: 'Deduction starts at absence #',
      absDedAmt: 'Deduction per absence', absDN: 'DN at absence #', absLate: 'Lates equal to one absence',
      legFree: 'Free', legDed: 'Deduct', legDN: 'DN', dedRowLab: 'Absence/late penalty', bonRowLab: 'Bonus',
      lateNote: n => `${n} lates = 1 absence`,
      studySec: 'Sources & Files', natureSec: 'Course type', courseType: 'Course type',
      courseLang: 'Course language', langs: { ar: 'Arabic', en: 'English' },
      noData: 'Nothing here yet',
      communityTitle: 'Contributions', sharePost: 'Share your knowledge', shareBtn: 'Share', typePick: 'Course type', meName: 'Me',
      acctTitle: 'Account', acctName: 'Name', acctNamePh: 'Your name', acctPhone: 'Phone number', acctPhonePh: '05xxxxxxxx', acctPhoto: 'Change photo',
      acctEmail: 'Email', acctEmailPh: 'name@example.com', acctPassword: 'Password', acctPasswordPh: '••••••••', logout: 'Log out', deleteAcct: 'Delete account', deleteConfirm: 'Click again to confirm', siteName: 'academia', sideClose: 'Hide sidebar', sideOpen: 'Show sidebar',
      /* ===== Guest ===== */
      guest: 'Guest', join: 'Create account', login: 'Log in',
      joinTitle: 'Create your account', loginTitle: 'Log in',
      joinGo: 'Create account', loginGo: 'Log in',
      haveAcct: 'Have an account? Log in', noAcct: 'No account? Create one',
      needAcctLike: 'Likes are for members — create your account',
      needAcctPost: 'Contributing is for members — create your account',
      needAcctNook: 'The Nook is for members',
      needAcctNookWhy: 'This is where you build your term: add your courses and follow your grades and progress. It needs an account so it stays yours.',
      guestCan: 'As a guest you can browse the library, study cards, and take exams — and your exams are recorded for you.',
      errName: 'Enter your name', errEmail: 'Enter a valid email', errPass: 'Password must be 6 characters or more',
      errNoAcct: 'No account with this email', errPassWrong: 'Wrong password',
      errBadLogin: 'Wrong email or password',
      errTaken: 'This email is registered — log in instead',
      errNet: 'Could not reach the server — check your connection',
      srvTooBig: 'This contribution is too large to publish — lighten its images or split it',
      likeSelf: 'You cannot like your own contribution',
      cmtLikeSelf: 'You cannot like your own comment',
      cmtStale: 'Refresh the page so your comment reaches its author',
      authWait: 'One moment…',
      localAcctNote: 'Your account is stored in this browser only — it does not travel to another device yet.',
      noResetNote: 'After signing up you get a recovery code — save it. It is your only way back if you forget your password.',
      recTitle: 'Recovery code',
      recWhy: 'This is your code. It is shown once and never again. Save it somewhere safe — without it there is no way back into your account if you forget your password.',
      recCopy: 'Copy code', recCopied: 'Copied ✓', recSaved: 'Saved it',
      recNew: 'This is your new code — the old one no longer works.',
      forgot: 'Forgot your password?',
      recFormTitle: 'Recover your account', recFormWhy: 'Enter your email and the recovery code you saved, then choose a new password.',
      recCodeLabel: 'Recovery code', recCodePh: 'XXXXX-XXXXX-XXXXX-XXXXX',
      recNewPass: 'New password', recGo: 'Recover',
      errRecBad: 'Wrong email or recovery code',
      recLost: 'Lost your code? Ask the site owner to issue a new one.',
      mirTitle: 'My copy on this device',
      mirWhy: 'Link a file on your desktop and every save is written to it. Wipe the browser entirely and you still have everything.',
      mirLinked: 'Linked to', mirLink: 'Link a file', mirChange: 'Change file', mirUnlink: 'Unlink',
      mirOn: 'Linked — your data is written to the file on every save',
      mirOff: 'Unlinked — no on-device copy is being written',
      mirNoApi: 'This browser cannot write to a file — use the Vault to export manually',
      backToList: 'Posts', backToDoctors: 'Instructors', docAvg: 'Avg rating', docByAnon: 'A member', noPosts: 'No posts yet — be the first to share',
      editPost: 'Edit my post', delPost: 'Delete my post', pinItem: 'Pin', unpinItem: 'Unpin', pinnedTag: 'Pinned', editItem: 'Edit', delItem: 'Delete', optionsBtn: 'Options',
      thumbUp: 'Helpful', thumbDown: 'Not helpful', reportItem: 'Report', reportedItem: 'Reported ✓',
      completeTip: (f, n) => `Completeness: ${f} of ${n} fields`,
      completePct: n => `Allocated: ${n}% of 100%`,
      sortBy: 'Sort', sortBest: 'Top', sortNewest: 'Newest', contribUnit: 'contributions',
      filterByDoctor: 'Filter by instructor', allDoctors: 'All instructors', docPickLab: 'Instructor',
      prevDoctor: 'Previous', nextDoctor: 'Next',
      dispTitle: 'Display mode', dispBest: 'Best', dispAll: 'All', aboutLabel: 'contributions about',
      ago: n => {
        if (n === 0) return 'today';
        if (n === 1) return 'yesterday';
        if (n <= 10) return `${n}d ago`;
        if (n < 30) return `${Math.round(n / 7)}w ago`;
        if (n < 365) return `${Math.round(n / 30)}mo ago`;
        return `${Math.round(n / 365)}y ago`;
      },
      dateAbs: 'Show exact date', dateRel: 'Back to relative time',
      noDoctors: 'No instructors yet',
      ctypes: { none: 'No studying needed', theory: 'Theory only', practical: 'Practical only', both: 'Theory & practical' },
      studySrc: 'Understanding sources', practiceSrc: 'Practice sources', backToSrc: 'Sources',
      primary: 'Primary', secondary: 'Secondary',
      src_file: 'File', src_link: 'Link', src_text: 'Text',
      textPh: 'Write here…', openLink: 'Open', download: 'Download', filePick: 'Choose a file…',
      fmtBold: 'Bold', fmtItalic: 'Italic', fmtList: 'Bullet list',
      fileTooBig: '(file exceeds 3MB)',
      startsIn: n => `starts in ${n} ${n === 1 ? 'day' : 'days'}`,
    },
  };
  const T = () => I18N[state.lang];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  /* ---------- بطاقة مادة ----------
     mode = 'upload' سوق التاب (نقر الصورة يرفعها) · 'pick' النافذة (نقر البطاقة يضيفها،
     لا رفع صور — التغيير من السوق الرئيسي فقط) · 'plain' عرض داخل إطار الترم
     بطاقة الترم تحمل دائرة إتقان المادة في الطرف المقابل للصورة (فكرة الدائرة الزمنية أُلغيت) */
  /* «اسلامي 111» — الاسم العربي المختصر على طريقة الكود الإنجليزي */
  function arShort(c) {
    if (c.arName) return c.arName;   /* اسم المادة العربي كما كتبه الأدمن في الكتالوج */
    const sp = c.code.indexOf(' ');
    const dept = c.code.slice(0, sp);
    return `${DEPT_AR[dept] || dept} ${c.code.slice(sp + 1)}`;
  }

  /* الغلاف البديل (مادة بلا صورة): كتاب ملوّن بالكود مثل موقع الاقتراحات — يميل 3D كبقية الكتب.
     اللون موحّد (bk--ph) بترولي الهوية · big = نسخة نافذة التفاصيل الكبيرة */
  /* و‎side‎ ضيفٌ يسكن ‎.bk‎ خارجَ وجهه: دائرةُ الاكتمال تُعلَّق على حافّة الغلاف، ولا
     تُوضع في ‎.bkface‎ لأنّ الوجهَ مقصوص. فتُمرَّر ههنا لتُغرس في الموضع الصحيح، ولا
     تُلصق بالنصّ من خارجٍ بجراحةٍ على السلسلة */
  function phBook(code, big, side) {
    const sp = code.indexOf(' ');
    const dept = code.slice(0, sp), num = code.slice(sp + 1);
    /* الاسم على الغلاف يتبع اللغة: عربي = القسم بالعربي المختصر · إنجليزي = الكود اللاتيني */
    const deptLabel = state.lang === 'ar' ? (DEPT_AR[dept] || dept) : dept;
    return `<span class="bk ${big ? 'bk--lg ' : ''}bk--ph"><span class="bkface"><b>${deptLabel}</b><i>${num}</i></span>${side || ''}</span>`;
  }

  /* أيقونتا النشاط + كتاب داخل حزمة اللاب (نشاط: «محاضرة» أو «معمل») */
  const LEC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8.5 20h7M12 16.5v3.5"/></svg>';
  const LAB_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 3h5M10.5 3v5l-4 8.4A1.4 1.4 0 0 0 7.8 18.5h8.4a1.4 1.4 0 0 0 1.3-2.1L13.5 8V3"/><path d="M8 13.5h8"/></svg>';
  /* دائرة إتقان: شارة واحدة تُعاد استعمالها للبطاقة المفردة ولكلّ كتاب في حزمة اللاب */
  /* ============================================================
     ودائرةُ الإتقان صارت دائرةَ «تقدمي الذاتي» — أمًّا لدوائره
     ============================================================
     كانت قوقعةً مرسومةً لا تمتلئ أبدًا («يُربط بإنجاز المادة لاحقًا» في ورقة الجلد)،
     وهذا هو الربط: ما يجري في رحلتك تحت المادّة يُقرأ من غلافها في الرفّ قبل أن تدخلها.

     ===== وهي الرسمةُ نفسُها لا رسمٌ ثانٍ =====
     تُبنى بـ‎roadTopDot‎ — الدالّةِ التي تبني دوائرَ الرحلة عينِها على الجذر بدل الفرع.
     فلو بُنيت ههنا بحسابٍ مستقلٍّ لَافترق الغلافُ عن جوفه يومَ تتبدّل قاعدةُ الحساب.
     ‏‎.cstat‎ تبقى **الحلقةَ والزجاجَ** (حدُّها الذهبيُّ ومسحتُها البتروليّة مبنيّان لسطح
     المكتبة، وثيمُها الليليُّ مكتوبٌ من قبل)، والدائرةُ تسكنها جوفًا فتُعطي الماءَ.

     ===== وتُملأ في الرفوف الثلاثة =====
     ‏‎entry‎ مدخلةُ ترمٍ بعينه ولا توجد إلّا في ‎plain‎، فيُقال في رفّ الترم رحلةُ ذلك
     الترم. وفي المكتبة ونافذة الإضافة تظهر المادّةُ بلا ترم — فيُجمع سعيُك فيها في
     أترامها كلِّها (‎roadArrAll‎)، وهو نفسُه في الغالب الأعمّ.
     ولا تُملأ لمادّةٍ ليست في أترامك أصلًا: القوقعةُ لا تُرسم لها من قبلُ (‎inAnyTerm‎)،
     فالحكمُ محروسٌ في موضعٍ واحد */
  const statHTML = (entry, act, code) => {
    const dot = entry ? roadTopDot(entry, act) : (code ? roadDotOf(roadArrAll(code, act)) : '');
    return `<span class="cstat cstat--mastery" title="${T().masteryDot}"`
      + ` aria-label="${T().masteryDot}">${dot}</span>`;
  };

  function bundleBookHTML(c, act, stat) {
    const isL = act === 'معمل';
    const img = imgOf(c.code);
    /* نصّ الشريط يتبع اللغة (محاضرة/معمل · Lecture/Lab) — و«act» يبقى بالعربي لأنه مفتاح الحالة */
    /* ===== وأيقونةُ النشاط تعود إلى شريطه =====
       كانت في مختبر المفاهيم (‎lab-bundle-concepts.html‎) شارةً على وجه الغلاف:
       أيقونةٌ وكلمة. فلمّا صارت شريطًا ركنيًّا سقطت الأيقونةُ وبقيت الكلمة، وبقي
       ‎LEC_ICON‎ و‎LAB_ICON‎ معرَّفَين لا يناديهما شيء. والشريطُ يسع الاثنتين
       (‎78px‎ عرضًا والكلمةُ نصفُه)، والقارورةُ تُقرأ حيث لا تُقرأ الحروفُ الصغيرة:
       من مرّ ببصره عرف المعملَ من صورته قبل أن يفكّ ‎8px‎. */
    const rib = `<span class="ribbon"><i class="rtxt">${isL ? LAB_ICON : LEC_ICON}${isL ? T().labChip : T().lecChip}</i></span>`;   /* شريط ركني داخل الغلاف المقصوص */
    /* دائرة الإتقان لكلّ كتابٍ لا للحزمة: نشاطان مستقلّان ⇐ لكلٍّ دائرته، تميل وتنزلق
       مع كتابها عند تفتّح الحزمة.
       ===== وموضعُها ابنةَ ‎.bk‎ لا ابنةَ ‎.bkface‎ =====
       كانت في جوف الوجه فكانت **داخل إطار الغلاف**، والمطلوبُ أن تقف خارجَه إلى يساره.
       و‎.bkface‎ مقصوصٌ (‎overflow: hidden‎ — وهو الذي يحبس شريطَ النشاط في ركنه)، فما
       خرج عنه لا يُرى أصلًا. فرُفعت درجةً إلى ‎.bk‎: أختًا للوجه لا بنتًا له.
       و‎.bk‎ هو المقياسُ الصحيح: ‎width: fit-content‎ — يلبس الغلافَ مهما كان عرضُه
       (والأغلفةُ تختلف: الصورةُ ‎width: auto‎ بنسبتها، والبديلُ ‎aspect-ratio: .7‎).
       فتُعلَّق على **حافّته** لا على إحداثيّ: ‎right: 100%‎ ثمّ فُرجةٌ مشتقّةٌ من سُمك
       الكتاب نفسِه — لا رقمَ يُكتب ويُنسى يومَ يتبدّل عرضُ غلاف */
    const st = stat || '';
    let bk;
    if (img) {
      bk = `<span class="bk"><span class="bkface bkface--img"><img src="${img}" alt="">${rib}</span>${st}</span>`;
    } else {
      const sp = c.code.indexOf(' ');
      const dept = c.code.slice(0, sp), num = c.code.slice(sp + 1);
      const deptLabel = state.lang === 'ar' ? (DEPT_AR[dept] || dept) : dept;
      bk = `<span class="bk bk--ph"><span class="bkface"><b>${deptLabel}</b><i>${num}</i>${rib}</span>${st}</span>`;
    }
    const sel = act === selOf(c.code) ? ' sel' : '';   /* المحدَّد (افتراضيًا المحاضرة) — الآخر يبهت عند الفتح */
    return `<span class="cimg cimg--book${img ? ' has-img' : ' cimg--ph'} ${isL ? 'lab' : 'lec'}${sel}" data-act="${act}">${bk}</span>`;
  }

  /* هل المادة مضافة في أيّ من أترامي؟ (دائرة الإتقان في المكتبة تخصّ موادي وحدها) */
  const inAnyTerm = code => Object.values(state.libs).some(list => list.some(e => e.code === code));

  function cardHTML(c, mode, termCls, entry) {
    const img = imgOf(c.code);
    const name = state.lang === 'ar' ? arShort(c) : c.code;
    /* مادة لها لاب: حزمة «التفتّح» — كتابا المحاضرة والمعمل. تظهر في السوق ونافذة الإضافة
       وإطار الترم على السواء (كانت في السوق الرئيسي وحده) */
    if (isLab(c.code) && (mode === 'market' || mode === 'pick' || mode === 'plain')) {
      const bAdded = mode === 'pick' && selTerm && libCodes(selTerm).includes(c.code);
      const bAttrs = mode === 'pick' ? ` data-add="${c.code}"` : ` data-info="${c.code}"`;
      /* المحاضرة والمعمل نشاطان مستقلّان: لكلٍّ دائرة إتقانه على كتابه، لا دائرة واحدة للحزمة */
      /* وكانت شارةً **واحدةً** تُنسخ على الكتابين، فلمّا صارت تمتلئ افترقتا: لكلّ نشاطٍ
         رحلتُه (‎road‎ و‎roadLab‎) فلكلٍّ ماؤه — ولا يُسأل ‎selOf‎ عن أيّهما، بل يُقال */
      const bStat = a => (mode === 'plain' || inAnyTerm(c.code)) ? statHTML(entry, a, c.code) : '';
      const bPrep = mode === 'plain' && entry && entry.picks === null
        ? `<span class="prep">${T().prepBadge}</span>` : '';
      return `<div class="crow bundle ${bAdded ? 'is-added' : ''}"${bAttrs}>
        <span class="bundle-books">${bundleBookHTML(c, 'محاضرة', bStat('محاضرة'))}${bundleBookHTML(c, 'معمل', bStat('معمل'))}</span>
        <span class="cname" title="${esc(c.ar)}">${name}</span>
        <span class="chours">${c.h}<span class="hu">${T().hUnit}</span></span>
        ${bPrep}
      </div>`;
    }
    /* دائرة إتقان المادة: في إطار الترم دائمًا، وفي المكتبة ونافذة الإضافة للمواد المضافة
       في أحد أترامي فقط */
    /* ===== وموضعُها صار في الكتاب لا في البطاقة =====
       كانت آخِرَ أبناء ‎.crow‎ معلَّقةً على ركن **البطاقة** (‎top: 2px‎ و‎inset-inline-end‎)،
       فكان بُعدُها عن الغلاف يتبدّل بتبدّل عرض الغلاف: بطاقةٌ عرضُها ثابتٌ وغلافٌ عرضُه
       يتبع نسبةَ صورته — فالفجوةُ بينهما تضيق وتتّسع بلا قاعدة.
       فصارت ابنةَ ‎.bk‎ كأختها في حزمة المعمل، ونظامُهما واحد: تُعلَّق على حافّة الغلاف
       اليسرى بفُرجةٍ واحدةٍ مشتقّةٍ من سُمك الكتاب. وبه استوى الكتابُ المفردُ والحزمة.
       ولذلك تُحسب ههنا قبل بناء الكتاب — لا في ذيل القالب كما كانت */
    const stat = (mode === 'plain' || ((mode === 'market' || mode === 'pick') && inAnyTerm(c.code)))
      ? statHTML(entry, null, c.code) : '';
    /* مع صورة: كتاب 3D بغلافها · بلا صورة: كتاب بديل ملوّن بالكود (يعتدل عند مرور الماوس) */
    const bookInner = img
      ? `<span class="bk"><img src="${img}" alt="">${stat}</span>`
      : phBook(c.code, false, stat);
    /* في السوق الرئيسي فقط: تلميح كاميرا يظهر عند المرور فوق الكتاب البديل (النقر يرفع صورة) */
    const phCam = (!img && mode === 'upload')
      ? `<span class="ph-cam"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.2"/></svg></span>`
      : '';
    const imgBox = mode === 'upload'
      ? `<button class="cimg cimg--book${img ? ' has-img' : ' cimg--ph'}" data-pick="${c.code}" title="${T().img}">${bookInner}${phCam}</button>`
      : `<span class="cimg cimg--book${img ? ' has-img' : ' cimg--ph'}">${bookInner}</span>`;
    const added = mode === 'pick' && selTerm && libCodes(selTerm).includes(c.code);
    const attrs = mode === 'pick' ? ` data-add="${c.code}"`
                : ` data-info="${c.code}"`;   /* نقر البطاقة (سوق أو مكتبة) يفتح تفاصيلها */
    /* شارة «جهّزها»: مدخلة قديمة بلا اختيارات — نقرتها تفتح المعالج بدل الداشبورد */
    const prep = mode === 'plain' && entry && entry.picks === null
      ? `<span class="prep">${T().prepBadge}</span>` : '';
    return `<div class="crow ${added ? 'is-added' : ''}"${attrs}>
      ${imgBox}
      <span class="cname" title="${esc(c.ar)}">${name}</span>
      <span class="chours">${c.h}<span class="hu">${T().hUnit}</span></span>
      ${prep}
    </div>`;
  }

  /* ============================================================
     حالةُ المادّة — ثلاثٌ لا اثنتان، ووسطاها تُقرأ من الدائرة
     ============================================================
     كانت حالتين: ‎done‎ (في ترمٍ منتهٍ) و‎todo‎ (كلُّ ما سواها). وكان ‎todo‎ يقول «لم
     تؤخذ بعد» وهو يجمع تحته مادّةً لم تُلمس ومادّةً أنت في وسطها اليوم — فلا يُفرَز
     ما بقي ممّا بدأ.
     ولمّا امتلأت دائرةُ الغلاف صار في الموقع خبرٌ يقول الفرق، فيُقرأ منه لا من الأترام:
       · ‎done‎ — في ترمٍ منتهٍ. حكمُ التقويم أعلى من حكم الدائرة: مادّةٌ مضت مضت.
       · ‎prog‎ — دائرتُها فيها شيء: بدأتَها ولم تُنهها.
       · ‎todo‎ — دائرتُها خاويةٌ حقًّا. وهو ما طُلب: «اللي لسى ما فيها دائرة اكتمال بجد».
     والثلاثةُ يُقصي بعضُها بعضًا لأنّ ‎fStat.has(courseStatus(code))‎ تسأل عن حالةٍ
     واحدة، والسُّلَّمُ يقرأ من أعلى إلى أدنى فلا تقع مادّةٌ في اثنتين */
  function courseStatus(code) {
    for (const [term, entries] of Object.entries(state.libs)) {
      if (entries.some(e => e.code === code) && progressFor(state.termDates[term]).cls === 'done') return 'done';
    }
    return courseStarted(code) ? 'prog' : 'todo';
  }

  /* وتسميةُ الحالة تُكتب مرّةً: كانت ثنائيّةً في موضعين (‎v === 'todo' ? … : …‎)،
     وثلاثةٌ لا تحتملها الثنائيّة — ولا يُكتب اسمُ الحالة في مكانين فيفترقا */
  const STAT_KEYS = ['todo', 'prog', 'done'];
  const statTx = v => v === 'todo' ? T().statTodo : v === 'prog' ? T().statProg : T().statDone;

  /* ---------- مصنع عرض السوق: بحث + تصنيفات + شبكة (p = بادئة المعرّفات m/mm) ---------- */
  function marketView(p, mode, onList) {
    const el = id => document.getElementById(`${p}-${id}`);
    const panel = el('fpanel');
    const wrap = panel.closest('.filterwrap');
    let query = '';
    const fHours = new Set();          // فارغة = الكل
    const fCols  = new Set();
    const fStat  = new Set(['todo']);  // «متبقية» مطبق افتراضيًا دائمًا — ويُحذف بالنقر على رقاقته
    const fAct   = new Set();           // النشاط: lec (محاضرة فقط) · lab (لها معمل) — فارغة = الكل

    function render() {
      csMemo.clear();   /* حالُ المواد تُقرأ من جديد: ما حُفظ كان لرسمةٍ مضت */
      const q = query.trim().toLowerCase();
      const list = CLIST.filter(c =>
        (!q || c.code.toLowerCase().includes(q) || c.ar.includes(query.trim()) || arShort(c).includes(query.trim())) &&
        (!fHours.size || fHours.has(c.h)) &&
        (!fCols.size  || (c.tags || []).some(t => fCols.has(t))) &&
        (!fStat.size  || fStat.has(courseStatus(c.code))) &&
        (!fAct.size   || fAct.has(isLab(c.code) ? 'lab' : 'lec'))
      );
      /* onList (نافذة المكتبة): يغذّي بِكرة الكتب بدل شبكة مسطّحة — نفس منطق البحث/التصنيفات */
      if (onList) { onList(list); return; }
      el('grid').innerHTML = list.map(c => cardHTML(c, mode)).join('') || `<p class="m-none">${T().none}</p>`;
    }

    function chip(v, txt, on) { return `<button class="fchip ${on ? 'on' : ''}" data-v="${v}">${txt}</button>`; }
    function renderPanel() {
      const hoursVals = [...new Set(CLIST.map(c => c.h))].sort((a, b) => a - b);
      el('f-hours').innerHTML = hoursVals.map(h => chip(h, T().hoursChip(h), fHours.has(h))).join('');
      /* التخصصات: من كتالوج الأدمن — أي تخصص يضيفه هناك يظهر هنا تلقائيًّا */
      el('f-col').innerHTML = TAGS.map(t => chip(t.id, (state.lang === 'en' && t.en) ? t.en : t.ar, fCols.has(t.id))).join('');
      /* والترتيبُ سُلَّمٌ: ما لم يبدأ، فما هو فيه، فما انتهى */
      el('f-stat').innerHTML = STAT_KEYS.map(v => chip(v, statTx(v), fStat.has(v))).join('');
      el('f-act').innerHTML = [['lec', T().lecChip], ['lab', T().labChip]]
        .map(([v, txt]) => chip(v, txt, fAct.has(v))).join('');
      const n = fHours.size + fCols.size + fStat.size + fAct.size;
      const badge = el('fbadge');
      badge.hidden = !n;
      badge.textContent = n;
      renderActive();
    }

    /* الفلاتر المفعّلة بعد زر التصنيفات — النقر على الرقاقة يحذف فلترها */
    function renderActive() {
      const items = [];
      fHours.forEach(h => items.push(['h', h, T().hoursChip(h)]));
      fCols.forEach(k => { const t = TAGS.find(x => x.id === k); items.push(['c', k, t ? ((state.lang === 'en' && t.en) ? t.en : t.ar) : k]); });
      fStat.forEach(v => items.push(['s', v, statTx(v)]));
      fAct.forEach(v => items.push(['a', v, v === 'lec' ? T().lecChip : T().labChip]));
      el('factive').innerHTML = items.map(([k, v, txt]) =>
        `<button type="button" class="fact" data-k="${k}" data-v="${v}">${txt}<span class="fact-x">✕</span></button>`
      ).join('');
    }
    el('factive').addEventListener('click', e => {
      const b = e.target.closest('.fact'); if (!b) return;
      const { k, v } = b.dataset;
      if (k === 'h') fHours.delete(Number(v));
      else if (k === 'c') fCols.delete(v);
      else if (k === 's') fStat.delete(v);
      else fAct.delete(v);
      renderPanel(); render();
    });

    el('search').addEventListener('input', e => { query = e.target.value; render(); });
    el('btn-filter').addEventListener('click', () => { panel.hidden = !panel.hidden; });
    document.addEventListener('click', e => {
      if (!panel.hidden && !wrap.contains(e.target)) panel.hidden = true;
    });
    el('f-hours').addEventListener('click', e => {
      const b = e.target.closest('.fchip'); if (!b) return;
      const v = Number(b.dataset.v);
      fHours.has(v) ? fHours.delete(v) : fHours.add(v);
      renderPanel(); render();
    });
    el('f-col').addEventListener('click', e => {
      const b = e.target.closest('.fchip'); if (!b) return;
      const v = b.dataset.v;
      fCols.has(v) ? fCols.delete(v) : fCols.add(v);
      renderPanel(); render();
    });
    el('f-stat').addEventListener('click', e => {
      const b = e.target.closest('.fchip'); if (!b) return;
      const v = b.dataset.v;
      fStat.has(v) ? fStat.delete(v) : fStat.add(v);
      renderPanel(); render();
    });
    el('f-act').addEventListener('click', e => {
      const b = e.target.closest('.fchip'); if (!b) return;
      const v = b.dataset.v;
      fAct.has(v) ? fAct.delete(v) : fAct.add(v);
      renderPanel(); render();
    });

    function applyTexts() {
      el('search').placeholder = T().search;
      el('f-label').textContent = T().filters;
      el('fg-hours').textContent = T().hoursGroup;
      el('fg-col').textContent = T().collegeGroup;
      el('fg-stat').textContent = T().statGroup;
      el('fg-act').textContent = T().actGroup;
      renderPanel();
      render();
    }

    return { render, applyTexts, closePanel: () => { panel.hidden = true; } };
  }

  /* إشعار سفليّ خفيف: عنصر واحد يُعاد استعماله — يظهر ثم ينزوي بعد ثانيتين ونصف */
  let toastEl = null, toastT = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    clearTimeout(toastT);
    requestAnimationFrame(() => toastEl.classList.add('on'));
    toastT = setTimeout(() => toastEl.classList.remove('on'), 2500);
  }

  /* ============================================================
     شريط الكتب المتمركز — نفس بطاقات السوق السابقة (كتاب 3D + الاسم + الساعات)
     لكن بتمرير يلتقط دائمًا كتابًا في المنتصف. لا دوران Cover Flow ولا لوحة معلومات:
     الكتب تحتفظ بميلها الطبيعي، والمتمركز فقط يعتدل قليلًا ويكبر لطفًا («محطوط عليه»).
     opts = { cardMode: 'market'|'pick', confirm(code), onCenter(code)|null }
     ============================================================ */
  function makeReel(hostSel, opts) {
    const host = $(hostSel);
    const GAP = 160, WIN = 5, SENS = 0.6, IDLE = 130, SNAP_MS = 300;   // GAP أوسع قليلًا ليتّسع للمتمركز المُكبَّر
    let stage, track, countEl;
    let items = [];
    let pos = 0;            // موقع مستمر بالبكسل (0 = أول كتاب متمركز)
    let centerIdx = 0, lastCenter = -1;
    let curLo = -1, curHi = -1, lastSig = '';
    let raf = 0, idleT = 0, centerT = 0;
    let drag = null;

    const dir = () => -1;   // التخطيط دائمًا rtl: الفهرس الأعلى ينساب لليسار — الكتب لا تنعكس مع تغيّر اللغة
    const maxPos = () => Math.max(0, (items.length - 1) * GAP);
    const clampPos = v => Math.max(0, Math.min(maxPos(), v));
    const clampIdx = i => Math.max(0, Math.min(items.length - 1, i));

    function build() {
      host.classList.add('book-reel');
      /* عدّاد «الجزء من الكل» تحت منتصف الشريط: ترتيب الكتاب المتمركز / عدد الكتب المعروضة
         (الكل يتبع الفلاتر والبحث لأنه طول القائمة الممرَّرة لا طول المواد كلها) */
      host.innerHTML = `<div class="reel-stage"><div class="reel-track"></div></div>` +
        (opts.counter ? `<div class="reel-count" aria-live="polite"></div>` : '');
      stage = host.querySelector('.reel-stage');
      track = host.querySelector('.reel-track');
      countEl = host.querySelector('.reel-count');
      bindEvents();
    }
    /* الجزء يمينًا ثم «/» ثم الكل يسارًا مع العربية — يقلبها اتجاه الصندوق في CSS مع الإنجليزية */
    function paintCount() {
      if (!countEl) return;
      countEl.innerHTML = items.length
        ? `<b class="hn-i">${centerIdx + 1}</b><i class="hn-s">/</i><b class="hn-t">${items.length}</b>`
        : '';
    }

    function setList(list, centerCode) {
      items = list;
      if (!stage) build();
      const sig = list.length + '|' + (list[0] ? list[0].code : '') + '|' + (list.length ? list[list.length - 1].code : '');
      if (sig !== lastSig) { lastSig = sig; pos = 0; }        // البحث/الفلترة تعيد البؤرة لأول عنصر
      else pos = clampPos(pos);
      /* بؤرة مطلوبة سلفًا (الركن يستأنف آخر مادة) — بلا وميض: نبدأ عندها مباشرة */
      if (centerCode) {
        const wi = items.findIndex(x => x.code === centerCode);
        if (wi >= 0) pos = wi * GAP;
      }
      curLo = curHi = -1;                                     // إجبار إعادة بناء النافذة (علامات «مضافة»/الأغلفة)
      lastCenter = -1;
      if (!items.length) { track.innerHTML = `<p class="reel-empty m-none">${T().none}</p>`; paintCount(); return; }
      layout(true);
    }

    /* نافذة مرئية فقط (~١١ بطاقة) — والبطاقة نفسها بطاقة السوق المعتادة (cardHTML) */
    function renderWindow(force) {
      const lo = clampIdx(centerIdx - WIN), hi = clampIdx(centerIdx + WIN);
      if (!force && lo === curLo && hi === curHi) return;
      curLo = lo; curHi = hi;
      let html = '';
      for (let i = lo; i <= hi; i++) {
        /* __en = مدخلة الترم (للركن) — تُمرَّر لتظهر شارة «جهّزها» ودائرة الإتقان */
        html += `<div class="reel-slot" data-i="${i}">${cardHTML(items[i], opts.cardMode, null, items[i].__en)}</div>`;
      }
      track.innerHTML = html;
    }

    /* توزيع البطاقات أفقيًا + تكبير لطيف للمتمركز (بلا دوران — الكتب على ميلها الطبيعي) */
    function position() {
      const c = pos / GAP;                        // مركز كسري
      /* دفع الجيران: حزمة اللاب القريبة من المنتصف تحجز هامشًا يتدرّج مع القرب (o) */
      const PUSH = 96, pushes = [];
      for (let bi = 0; bi < items.length; bi++) {
        if (!isLab(items[bi].code)) continue;
        const o = Math.max(0, 1 - Math.abs(bi - c));
        if (o > 0) pushes.push({ bi, amt: PUSH * o });
      }
      track.querySelectorAll('.reel-slot').forEach(slot => {
        const i = +slot.dataset.i;
        const d = i - c;
        const ad = Math.min(Math.abs(d), 2);   /* أرضية التصغير: الأبعد يستقرّ عند مقياس ثابت */
        let shift = 0;
        pushes.forEach(p => { if (i > p.bi) shift += p.amt; else if (i < p.bi) shift -= p.amt; });
        slot.style.setProperty('--x', ((d * GAP) + shift) * dir() + 'px');
        slot.style.setProperty('--ad', ad.toFixed(3));
        /* --o = تفتّح حزمة اللاب نفسها (٠ مغلقة ← ١ مفتوحة) يتدرّج مع القرب فتنفصل بسلاسة */
        if (isLab(items[i].code)) slot.style.setProperty('--o', Math.max(0, 1 - Math.abs(d)).toFixed(3));
        slot.style.zIndex = 100 - Math.round(ad * 10);
        slot.classList.toggle('is-center', Math.round(c) === i);
      });
    }

    function layout(force) {
      centerIdx = clampIdx(Math.round(pos / GAP));
      renderWindow(force);
      position();
      if (centerIdx !== lastCenter) {
        lastCenter = centerIdx;
        paintCount();
        /* المتمركز تغيّر → أخبر المستمع (مساهمات السوق تتبع البؤرة) بعد سكون قصير */
        if (opts.onCenter && items[centerIdx]) {
          const code = items[centerIdx].code;
          clearTimeout(centerT);
          centerT = setTimeout(() => opts.onCenter(code), 90);
        }
      }
    }

    /* حركة ناعمة إلى موقع هدف (التقاط/انزلاق للكتاب المنقور) */
    function glideTo(target) {
      cancelAnimationFrame(raf);
      /* احترام «تقليل الحركة»: انتقال فوري بلا انزلاق */
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        pos = target; layout(false); return;
      }
      const from = pos, t0 = performance.now();
      const stepFn = now => {
        const k = Math.min(1, (now - t0) / SNAP_MS);
        const e = 1 - Math.pow(1 - k, 3);         // easeOutCubic
        pos = from + (target - from) * e;
        layout(false);
        if (k < 1) raf = requestAnimationFrame(stepFn);
        else { pos = target; layout(false); }
      };
      raf = requestAnimationFrame(stepFn);
    }
    function snap() { glideTo(clampIdx(Math.round(pos / GAP)) * GAP); }
    function scheduleSnap() { clearTimeout(idleT); idleT = setTimeout(snap, IDLE); }

    function focusIdx(i) { glideTo(clampIdx(i) * GAP); }

    function confirmCenter(hit) {
      if (!items.length) return;
      /* لحزمة اللاب: حدِّد النشاط المنقور (محاضرة/معمل) من الكتاب تحت المؤشّر */
      let act = null;
      if (hit) {
        const bk = hit.closest && hit.closest('.cimg--book[data-act]');
        if (bk) {
          act = bk.dataset.act;
          /* نقل مؤشّر «المحدَّد» فورًا على نفس عناصر DOM (لينساب التعتيم بالانتقال، لا بإعادة بناء) */
          const bb = bk.closest('.bundle-books');
          if (bb) { bb.querySelectorAll('.cimg--book').forEach(x => x.classList.toggle('sel', x === bk)); labSel[items[centerIdx].code] = act; }
        }
      }
      opts.confirm(items[centerIdx].code, act);
    }

    function bindEvents() {
      /* العجلة: فقط التمرير الأفقي (إصبعان يمين/يسار) يسبح بين الكتب؛
         التمرير العمودي (فوق/تحت) يُترَك لصفحة الموقع كي تمرّر طبيعيًّا */
      stage.addEventListener('wheel', e => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;   /* عمودي → لا نلمسه، تمرّر الصفحة */
        e.preventDefault();
        cancelAnimationFrame(raf);
        pos = clampPos(pos + e.deltaX * SENS * dir());   /* اتجاه معكوس ليتوافق مع السحب */
        layout(false);
        scheduleSnap();
      }, { passive: false });

      /* السحب (ماوس/لمس): متابعة حيّة ثم التقاط عند الإفلات */
      stage.addEventListener('pointerdown', e => {
        cancelAnimationFrame(raf); clearTimeout(idleT);
        drag = { x: e.clientX, pos, moved: false, id: e.pointerId };
        stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointermove', e => {
        if (!drag) return;
        const dx = e.clientX - drag.x;
        if (Math.abs(dx) > 3) drag.moved = true;
        pos = clampPos(drag.pos - dx * dir());
        layout(false);
      });
      const endDrag = e => {
        if (!drag) return;
        const wasClick = !drag.moved;
        try { stage.releasePointerCapture(drag.id); } catch (_) {}
        drag = null;
        if (wasClick) {
          /* بعد setPointerCapture يصير e.target = stage، فنحدّد الكتاب المنقور فعليًا
             عبر أعلى عنصر تحت المؤشّر — يشمل الغلاف والاسم والساعات، ويحترم التراكب/الأبعد */
          const hit = document.elementFromPoint(e.clientX, e.clientY);
          const slot = (hit && hit.closest('.reel-slot')) || e.target.closest('.reel-slot');
          if (slot) {
            const i = +slot.dataset.i;
            if (i === centerIdx) confirmCenter(hit);   // نقر المتمركز = تأكيد (نشاط اللاب المنقور إن وُجد)
            else focusIdx(i);                          // نقر أي كتاب آخر = المسطرة تتوجّه له ويتمركز
          }
        } else snap();
      };
      stage.addEventListener('pointerup', endDrag);
      stage.addEventListener('pointercancel', endDrag);
    }

    return {
      setList,
      confirmCenter,
      step: n => focusIdx(centerIdx + n),
      first: () => focusIdx(0),
      last: () => focusIdx(items.length - 1),
      isEmpty: () => !items.length,
      centerCode: () => (items[centerIdx] ? items[centerIdx].code : null),
      /* ===== سَوقٌ بالرمز لا بالخطوات =====
         ‎step/first/last‎ تحرّك البِكرةَ عدًّا، ومن جاء من رابطٍ يعرف **رمزَ المادّة**
         لا موضعَها. والرجعُ ثلاثيّ: ‎0‎ ليست في القائمة · ‎1‎ سِيقت (‎onCenter‎ آتٍ) ·
         ‎2‎ متمركزةٌ أصلًا (لا حدثَ يقع، فمن ينتظره ينتظر أبدًا) */
      focusCode: c => {
        const i = items.findIndex(x => x.code === c);
        if (i < 0) return 0;
        if (i === centerIdx) return 2;
        focusIdx(i); return 1;
      },
    };
  }

  /* شريط نافذة إضافة المواد: نقر/Enter على المتمركز = إضافة فورية للترم — بلا خطوات إعداد.
     تُضاف بـpicks:null فتحمل بطاقتها شارة «جهّزها»، والنافذة تبقى مفتوحة لإضافة غيرها (المُضاف يُتجاهَل) */
  const bookReel = makeReel('#mm-grid', {
    cardMode: 'pick',
    confirm: code => {
      if (!selTerm || libCodes(selTerm).includes(code)) return;
      libEntries(selTerm).push({ code, picks: null });
      save();
      mkModal.render();   /* اسم المادة المُضافة يصير ذهبيًّا داخل النافذة */
      mkTab.render();
      renderFrame();      /* تظهر فورًا في إطار الترم */
      const c = CM[code];
      toast(T().addedToLib(state.lang === 'ar' ? arShort(c) : c.code));
    },
  });
  /* شريط السوق الرئيسي: المتمركز تُعرَض مساهماته حيًّا أسفل السوق، ونقره يمرّر الصفحة إليها.
     لمادة اللاب: نقر كتاب «معمل» يفتح مساهمات نشاط المعمل (خيط منفصل)، وغيره يفتح المحاضرة. */
  const marketReel = makeReel('#m-grid', {
    cardMode: 'market',
    counter: true,   /* عدّاد «الجزء من الكل» تحت الشريط — يتبع نتائج البحث والفلاتر */
    confirm: (code, act) => openMarketCourse(act === 'معمل' ? labKey(code) : code),
    /* المتمركز: مساهمات النشاط المحدَّد (افتراضيًا المحاضرة، أو المعمل إن سبق اختياره) */
    /* ===== ورابطُ الاختبار يقود البِكرةَ إلى مادّته =====
       هذه الدالّةُ هي التي كانت تُبطل الرابط: البِكرةُ تستقرّ على أوّل كتابٍ في الرفّ
       بعد ‎90ms‎ فتفتح مساهماتِه، فتمحو المادّةَ التي فتحها الرابطُ قبلها بلحظة —
       فيرى الفاتحُ مادّةً أخرى في رأس السوق ويظنّ الرابطَ معطَّلًا.
       فما دام ‎xlPend‎ معلَّقًا **فالمركزُ ليس حرًّا**: إن استقرّت على غير مادّته
       أُعيد سَوقُها ولم يُفتح شيء، وإن استقرّت عليها فُتحت ثمّ نزل التحديدُ فوقها.
       وبهذا يمرّ الرابطُ من **طريق الموقع نفسِه** لا من طريقٍ يوازيه ثمّ يتنازعان */
    onCenter: code => {
      if (xlPend) {
        if (code !== xlPend.c) { marketReel.focusCode(xlPend.c); return; }
        const q = xlPend; xlPend = null;
        showMarketContribs(q.c); xlApply(q); return;
      }
      if (!$('#panel-market').hidden) showMarketContribs(selOf(code) === 'معمل' ? labKey(code) : code);
    },
  });

  /* بِكرة الركن: مواد الترم المفتوح — الكتاب المتمركز هو الذي تعرض القُمرةُ تحته مربّعاته،
     ولمادة اللاب: نقر كتاب «معمل» يقلب القُمرة لمربّعات المعمل (خيط مستقلّ عن المحاضرة) */
  const nookReel = makeReel('#lib-grid', {
    cardMode: 'plain',
    confirm: code => { const en = libEntry(selTerm, code); if (en) openNook(en); },
    onCenter: code => {
      if ($('#panel-library').hidden) return;
      const en = libEntry(selTerm, code);
      if (en) openNook(en);
    },
  });

  const mkTab   = marketView('m', 'market', list => marketReel.setList(list));   // السوق الرئيسي: شريط → مساهمات حيّة
  const mkModal = marketView('mm', 'pick', list => bookReel.setList(list));       // نافذة المكتبة: شريط → معالج التجهيز

  /* العودة لتاب السوق: استرجع مساهمات المادة المتمركزة أسفله (قد تكون الواجهة انتقلت للمكتبة) */
  document.querySelector('.tabs').addEventListener('click', e => {
    if (!e.target.closest('[data-tab="market"]')) return;
    const code = marketReel.centerCode();
    if (code) showMarketContribs(code);
  });

