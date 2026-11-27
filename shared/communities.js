/* ============================================================
   communities.js — سجل مجتمعات أكاديميا (ROADMAP-EXPLORE س١)
   ============================================================
   مصدر واحد لكل ما يعرف عن المجتمع: «استكشاف» تبني منه أوراقها
   وبحثها وفلاترها، و«مجتمعاتي» والركن العام يقرآن منه الاسم واللون.

   قواعد التسمية (طلب صاحب الموقع):
     · العربي بلا حركات تشكيل.
     · الاسم بلغة الواجهة دائما: ما اسمه عربي يكتب بالإنجليزية بحروف لاتينية كما ينطق
       (القدرات = Qudrat)، وما اسمه إنجليزي يكتب بالعربية كما ينطق (SAT = سات).
     · والعلامة المائية الكبيرة (tag) بلغة الواجهة كذلك: «قدرات» بالعربي و«Qudrat» بالإنجليزي.

   الحقول:
     id · ar · en       المعرف والاسمان
     kind               uni جامعة · stage مرحلة دراسية · admit اختبار قبول
                        license رخصة مهنية سعودية · intl شهادة أو لغة دولية
     org                الجهة أو الاسم الكامل (على الورقة وفي البحث)
     country · city     SA · GB · INTL (بلا مدينة)
     aliases            ما قد يكتبه الباحث: الاختصار واللقب والاسم الشائع
     a · b · acc        طرفا التدرج ولون الإبراز
     logo · mark        شعار كامل · رمز للعلامة المائية (assets/brand/: unis/ للجامعات، exams/ للجهات)
     mono               الشعار ملون فيرسم أبيض على الورقة الداكنة
     tag                بلا شعار: كلمة قصيرة ترسم علامة مائية، {ar, en}
     href · soon        رابط الموقع · «قريبا» بلا رابط
   ============================================================ */
(function () {
  var SA = 'SA', INTL = 'INTL';
  /* مجتمع قادم: [id, ar, en, kind, country, orgAr, orgEn, tagAr, tagEn, aliases, a, b, acc] */
  function soon(r) {
    return { id: r[0], ar: r[1], en: r[2], kind: r[3], country: r[4], city: null,
             org: { ar: r[5], en: r[6] }, tag: { ar: r[7], en: r[8] }, aliases: r[9],
             a: r[10], b: r[11], acc: r[12], soon: 1 };
  }
  /* جامعة قادمة: [id, ar, en, orgAr, orgEn, cityAr, cityEn, aliases, a, b, acc, logo, mark, mono, wide, private]
     الشعار من موقع الجامعة أو ويكيميديا (المصادر في assets/brand/unis/sa/README.md)، والرمز قص viewBox منه.
     وبلا شعار: اسمها المختصر علامة مائية */
  function uni(r) {
    var short = r[1].replace(/^(الجامعة|جامعة)\s+/, '');
    var c = { id: r[0], ar: r[1], en: r[2], kind: 'uni', country: SA, city: { ar: r[5], en: r[6] },
              org: { ar: r[3], en: r[4] }, aliases: r[7], a: r[8], b: r[9], acc: r[10], soon: 1,
              tag: { ar: short, en: r[2] } };
    if (r[11]) c.logo = r[11];
    if (r[12]) { c.mark = r[12]; if (r[14]) { c.wmWide = 1; c.badgeWide = 1; c.wm = r[12]; } }
    if (r[13]) c.mono = 1;
    if (r[15]) c.aliases = c.aliases.concat(['اهلية', 'خاصة', 'Private']);
    return c;
  }
  window.AC_COMS = [
    /* ===== الجامعات ===== */
    { id: 'maslakh', ar: 'المسلخ', en: 'Almaslakh', kind: 'uni',
      org: { ar: 'جامعة الملك فهد للبترول والمعادن', en: 'King Fahd University of Petroleum & Minerals' },
      country: SA, city: { ar: 'الظهران', en: 'Dhahran' },
      aliases: ['KFUPM', 'البترول', 'جامعة البترول', 'Petroleum', 'فهد'],
      a: '#0e3b41', b: '#1f7a85', acc: '#d0aa68',
      logo: 'unis/kfupm-white.svg', mark: 'unis/kfupm-mark-white.svg', href: '../Almaslakh/' },
    { id: 'mudarraj', ar: 'المدرج', en: 'Almudarraj', kind: 'uni',
      org: { ar: 'جامعة الملك سعود', en: 'King Saud University' },
      country: SA, city: { ar: 'الرياض', en: 'Riyadh' },
      aliases: ['KSU', 'سعود', 'جامعة سعود', 'King Saud'],
      a: '#0a4a6c', b: '#1a8abe', acc: '#82c3d8',
      logo: 'unis/ksu-white.svg', mark: 'unis/ksu-shield-white.svg', href: '../Almudarraj/' },
    { id: 'hive', ar: 'الخلية', en: 'The Hive', kind: 'uni',   /* اسمها الإنجليزي اختاره صاحب الموقع */
      org: { ar: 'جامعة مانشستر', en: 'The University of Manchester' },
      country: 'GB', city: { ar: 'مانشستر', en: 'Manchester' },
      aliases: ['UoM', 'Manchester', 'مانشستر', 'Hive', 'The Hive'],
      a: '#3d0a5c', b: '#660099', acc: '#ffcc33',
      logo: 'unis/uom-mono-white.svg', mark: 'unis/uom-box-white.svg', wm: 'unis/uom-mono-white.svg', wmWide: 1, badgeWide: 1, href: '../TheHive/' }
  ].concat([
    /* ===== جامعات السعودية القادمة (حكومية وأهلية): الصفوف بين العلامتين مولدة من بيان بحث الشعارات ===== */
    /* UNIS-SA:BEGIN */
    /* UNIS-SA:END */
  ].map(uni)).concat([
    /* ===== المراحل الدراسية ===== */
    ['thanawi', 'الثانوية', 'Thanawi', 'stage', SA, 'المرحلة الثانوية: المسار العام والمسارات التخصصية', 'Saudi secondary school (General and specialised tracks)', 'ثانوي', 'Thanawi', ['ثانوي', 'ثالث ثانوي', 'المسارات', 'High School', 'Secondary'], '#1d4a2e', '#3c8a55', '#cfe9b4'],
    ['mutawasit', 'المتوسطة', 'Mutawasit', 'stage', SA, 'المرحلة المتوسطة', 'Saudi intermediate school', 'متوسط', 'Mutawasit', ['متوسط', 'Middle School', 'Intermediate'], '#2c4a1d', '#5e8a3c', '#e4e9b4'],
    ['foundation', 'السنة التحضيرية', 'Tahdiri', 'stage', SA, 'السنة التحضيرية والسنة الأولى المشتركة', 'Preparatory year / Common first year', 'تحضيري', 'Tahdiri', ['التحضيرية', 'تحضيري', 'السنة الأولى المشتركة', 'PYP', 'Prep Year', 'Foundation'], '#1d4a45', '#3c8a80', '#b4e9e0'],
    /* ===== اختبارات القبول (قياس) ===== */
    ['qudurat', 'القدرات', 'Qudrat', 'admit', SA, 'اختبار القدرات العامة من قياس', 'General Aptitude Test (GAT) by Qiyas', 'قدرات', 'Qudrat', ['GAT', 'قياس', 'Qiyas', 'قدرات', 'Qudurat'], '#2a2142', '#5d4a95', '#c9b8f0'],
    ['tahsili', 'التحصيلي', 'Tahsili', 'admit', SA, 'الاختبار التحصيلي العلمي والنظري', 'Scholastic Achievement Admission Test (SAAT)', 'تحصيلي', 'Tahsili', ['SAAT', 'قياس', 'Qiyas', 'تحصيلي'], '#2b2550', '#5348a8', '#c4bdf5'],
    ['step', 'ستيب', 'STEP', 'admit', SA, 'اختبار كفايات اللغة الإنجليزية من قياس', 'Standardized Test of English Proficiency by Qiyas', 'ستيب', 'STEP', ['STEP', 'اختبار اللغة', 'قياس', 'Qiyas'], '#1f2a52', '#3f56a8', '#bccaf5'],
    ['pgat', 'القدرات للجامعيين', 'Qudrat Aljamieen', 'admit', SA, 'القدرات العامة للجامعيين للدراسات العليا', 'General Aptitude Test for Graduates (PGAT)', 'جامعيين', 'Jamieen', ['PGAT', 'قدرات الجامعيين', 'ماجستير', 'قياس'], '#33204a', '#6b45a0', '#d6c0f2'],
    /* ===== الرخص المهنية السعودية ===== */
    ['teacher', 'الرخصة المهنية للمعلمين', 'Rukhsat Almuallimeen', 'license', SA, 'اختبار الرخصة المهنية للوظائف التعليمية: التربوي العام والتخصصي', 'Professional Licence for Educational Jobs', 'رخصة', 'Rukhsa', ['الرخصة المهنية', 'المعلمين', 'التربوي العام', 'قياس', 'Teaching Licence'], '#4a2a1d', '#9a5a3a', '#f2cdb4'],
    ['smle', 'إس إم إل إي', 'SMLE', 'license', SA, 'الرخصة الطبية من الهيئة السعودية للتخصصات الصحية', 'Saudi Medical Licensure Exam by SCFHS', 'طب', 'SMLE', ['SMLE', 'الهيئة', 'اختبار الهيئة', 'التخصصات الصحية', 'SCFHS', 'هيئة التخصصات', 'طب', 'Medicine'], '#4a1d24', '#a03a4a', '#f5bcc4'],
    ['sple', 'إس بي إل إي', 'SPLE', 'license', SA, 'رخصة الصيدلة من الهيئة السعودية للتخصصات الصحية', 'Saudi Pharmacist Licensure Exam by SCFHS', 'صيدلة', 'SPLE', ['SPLE', 'الهيئة', 'اختبار الهيئة', 'صيدلة', 'SCFHS', 'Pharmacy'], '#4a1d38', '#a03a7a', '#f5bce0'],
    ['sdle', 'إس دي إل إي', 'SDLE', 'license', SA, 'رخصة طب الأسنان من الهيئة السعودية للتخصصات الصحية', 'Saudi Dental Licensure Exam by SCFHS', 'أسنان', 'SDLE', ['SDLE', 'الهيئة', 'اختبار الهيئة', 'أسنان', 'SCFHS', 'Dentistry'], '#3a1d4a', '#7a3aa0', '#e0bcf5'],
    ['snle', 'التمريض والتخصصات الصحية', 'Altamreedh', 'license', SA, 'رخص التمريض والتخصصات الصحية من الهيئة السعودية للتخصصات الصحية', 'Nursing and allied health licensure by SCFHS', 'تمريض', 'Tamreedh', ['الهيئة', 'اختبار الهيئة', 'تمريض', 'SNLE', 'SCFHS', 'Nursing'], '#1d3a4a', '#3a7aa0', '#bce0f5'],
    ['socpa', 'زمالة سوكبا', 'Zamalat SOCPA', 'license', SA, 'زمالة الهيئة السعودية للمراجعين والمحاسبين', 'Saudi Organization for Chartered and Professional Accountants', 'زمالة', 'SOCPA', ['SOCPA', 'الهيئة', 'اختبار الهيئة', 'سوكبا', 'المحاسبين', 'زمالة', 'محاسب قانوني'], '#1d4a3a', '#3aa07a', '#bcf5e0'],
    ['sce', 'اختبارات المهندسين', 'Almuhandiseen', 'license', SA, 'الهيئة السعودية للمهندسين: الأساسيات والمهندس المحترف', 'Saudi Council of Engineers: Fundamentals and Professional Engineer', 'هندسة', 'FE PE', ['الهيئة', 'اختبار الهيئة', 'هيئة المهندسين', 'FE', 'PE', 'Fundamentals', 'مهندس محترف'], '#2a3a4a', '#4a6a8a', '#c4d8ec'],
    /* ===== الشهادات واللغات الدولية ===== */
    ['ielts', 'آيلتس', 'IELTS', 'intl', INTL, 'اختبار اللغة الإنجليزية الدولي', 'International English Language Testing System', 'آيلتس', 'IELTS', ['IELTS', 'ايلتس', 'الآيلتس', 'English'], '#3b1f26', '#8d4654', '#f0b8c4'],
    ['toefl', 'توفل', 'TOEFL', 'intl', INTL, 'اختبار الإنجليزية لغة أجنبية من ETS', 'Test of English as a Foreign Language by ETS', 'توفل', 'TOEFL', ['TOEFL', 'التوفل', 'English', 'ETS'], '#3b261f', '#8d5a46', '#f0ccb8'],
    ['sat', 'سات', 'SAT', 'intl', INTL, 'اختبار القبول الجامعي الأمريكي من College Board', 'SAT by College Board', 'سات', 'SAT', ['SAT', 'College Board', 'أمريكا'], '#1f2f3b', '#466a8d', '#b8d4f0'],
    ['gmat', 'جيمات', 'GMAT', 'intl', INTL, 'اختبار القبول لكليات الإدارة', 'Graduate Management Admission Test', 'جيمات', 'GMAT', ['GMAT', 'MBA', 'ماجستير إدارة'], '#2f1f3b', '#6a468d', '#d4b8f0'],
    ['gre', 'جي آر إي', 'GRE', 'intl', INTL, 'اختبار الدراسات العليا من ETS', 'Graduate Record Examinations by ETS', 'جي آر إي', 'GRE', ['GRE', 'ماجستير', 'ETS'], '#1f3b33', '#468d7a', '#b8f0e0'],
    ['cfa', 'سي إف إيه', 'CFA', 'intl', INTL, 'المحلل المالي المعتمد من CFA Institute', 'Chartered Financial Analyst', 'سي إف إيه', 'CFA', ['CFA', 'محلل مالي', 'مالية', 'Finance'], '#1f2a3b', '#2e5c8d', '#b8cff0'],
    ['cma', 'سي إم إيه', 'CMA', 'intl', INTL, 'المحاسب الإداري المعتمد من IMA', 'Certified Management Accountant by IMA', 'سي إم إيه', 'CMA', ['CMA', 'محاسب اداري', 'محاسبة'], '#3b2f1f', '#8d6a2e', '#f0dcb8'],
    ['cpa', 'سي بي إيه', 'CPA', 'intl', INTL, 'المحاسب القانوني الأمريكي', 'Certified Public Accountant (US)', 'سي بي إيه', 'CPA', ['CPA', 'محاسب قانوني', 'محاسبة'], '#3b1f2f', '#8d2e6a', '#f0b8dc'],
    ['acca', 'أكا', 'ACCA', 'intl', INTL, 'جمعية المحاسبين القانونيين المعتمدين في بريطانيا', 'Association of Chartered Certified Accountants', 'أكا', 'ACCA', ['ACCA', 'اكا', 'محاسبة', 'بريطانيا'], '#2a1f3b', '#5a2e8d', '#ccb8f0'],
    ['cia', 'سي آي إيه', 'CIA', 'intl', INTL, 'المراجع الداخلي المعتمد من IIA', 'Certified Internal Auditor by IIA', 'سي آي إيه', 'CIA', ['CIA', 'مراجع داخلي', 'مراجعة', 'تدقيق'], '#1f3b2a', '#2e8d5a', '#b8f0cc'],
    ['pmp', 'بي إم بي', 'PMP', 'intl', INTL, 'محترف إدارة المشاريع من PMI', 'Project Management Professional by PMI', 'بي إم بي', 'PMP', ['PMP', 'إدارة مشاريع', 'PMI'], '#3b3a1f', '#8d8a2e', '#f0eeb8'],
    ['usmle', 'يو إس إم إل إي', 'USMLE', 'intl', INTL, 'رخصة الطب الأمريكية', 'United States Medical Licensing Examination', 'يو إس', 'USMLE', ['USMLE', 'طب', 'أمريكا', 'Step 1'], '#3b1f1f', '#8d2e2e', '#f0b8b8']
  ].map(soon));

  /* ===== شعارات الجهات (assets/brand/exams/) =====
     من مواقع الجهات الرسمية إلا ما ذكر: [الشعار، الرمز، ملون؟]. والجهة الواحدة تخدم أكثر من مجتمع:
     قياس (هيئة تقويم التعليم والتدريب) للقدرات والتحصيلي وستيب والجامعيين ورخصة المعلمين،
     والهيئة السعودية للتخصصات الصحية لاختباراتها الأربعة، وETS للتوفل وجي آر إي.
     ولا شعار بعد لزمالة سوكبا واختبارات المهندسين والسنة التحضيرية: موقعا الهيئتين يقطعان الاتصال
     من خارج السعودية، والتحضيرية لا جهة واحدة لها. */
  /* [الشعار الكامل على الورقة، رمزه وحده للعلامة المائية، ملون؟، الرمز عريض؟]
     الرمز بلا نصوص (قص viewBox من الملف الرسمي نفسه) إلا ما كان شعاره نصا كله: آيلتس وAICPA وACCA */
  var E = 'exams/', LOGOS = {
    thanawi: ['moe-white.svg', 'moe-mark.svg', 0, 1, 'moe-mark.svg', 1], mutawasit: ['moe-white.svg', 'moe-mark.svg', 0, 1, 'moe-mark.svg', 1],
    qudurat: ['etec.svg', 'etec-mark.svg', 1], tahsili: ['etec.svg', 'etec-mark.svg', 1], step: ['etec.svg', 'etec-mark.svg', 1],
    pgat: ['etec.svg', 'etec-mark.svg', 1], teacher: ['etec.svg', 'etec-mark.svg', 1],
    smle: ['scfhs.svg', 'scfhs-mark.svg', 1], sple: ['scfhs.svg', 'scfhs-mark.svg', 1],
    sdle: ['scfhs.svg', 'scfhs-mark.svg', 1], snle: ['scfhs.svg', 'scfhs-mark.svg', 1],
    ielts: ['ielts-white.svg', 'ielts-white.svg', 0, 1, 'ielts-white.svg', 1],
    toefl: ['toefl.svg', 'ets-mark.svg', 1], gre: ['gre.svg', 'ets-mark.svg', 1],      /* نجمة ETS */
    sat: ['collegeboard.svg', 'collegeboard-mark.svg', 1],  /* College Board: ويكيبيديا، فموقعها يرسمه بخط أيقونات */
    gmat: ['gmac.svg', 'gmac-mark.svg', 1], cfa: ['cfa.svg', 'cfa-mark.svg', 1],
    cma: ['ima.svg', 'ima-mark.svg', 1], cpa: ['aicpa.svg', 'aicpa-mark.svg', 0, 1, 'aicpa-mark.svg'], pmp: ['pmi.svg', 'pmi-mark.svg', 1],   /* هذه الثلاثة من worldvectorlogo؛ وAICPA مقلوب الألوان (حروفه محفورة في المربع) */
    acca: ['acca-white.svg', 'acca-white.svg', 0, 1, 'acca-white.svg'], cia: ['iia-white.svg', 'iia-mark.svg', 1],
    usmle: ['usmle-white.svg', 'usmle-mark.svg', 0]
  };
  window.AC_COMS.forEach(function (c) {
    var l = LOGOS[c.id]; if (!l) return;
    c.logo = E + l[0]; c.mark = l[1] ? E + l[1] : ''; if (l[2]) c.mono = 1; if (l[3]) c.wmWide = 1; if (l.length > 4) c.wm = l[4] ? E + l[4] : ''; if (l[5]) c.badgeWide = 1;   /* علامة الخلفية إن اختلفت عن الرمز (فارغ = كلمة) */
  });
  window.AC_COUNTRIES = {
    SA:   { ar: 'السعودية', en: 'Saudi Arabia' },
    GB:   { ar: 'بريطانيا', en: 'United Kingdom' },
    INTL: { ar: 'دولي', en: 'International' }
  };
  window.AC_KINDS = [
    ['uni',     { ar: 'جامعات', en: 'Universities' }],
    ['stage',   { ar: 'مراحل دراسية', en: 'School stages' }],
    ['admit',   { ar: 'اختبارات قبول', en: 'Admission tests' }],
    ['license', { ar: 'رخص مهنية', en: 'Professional licences' }],
    ['intl',    { ar: 'شهادات دولية', en: 'International certificates' }]
  ];
})();
