/* ============================================================
   communities.js — سجلُّ مجتمعات أكاديميا (ROADMAP-EXPLORE س١)
   ============================================================
   مصدرٌ واحدٌ لكلّ ما يُعرف عن المجتمع: «استكشاف» تبني منه أوراقَها
   وبحثَها وفلاترَها، و«مجتمعاتي» والركنُ العامّ يقرآن منه الاسمَ واللون.
   فزيادةُ مجتمعٍ سطرٌ ههنا لا تعديلٌ في ثلاثة مواضع.

   الحقول:
     id · ar · en       المعرّف والاسمان (الجامعاتُ بألقابها، والباقي بأسمائه المعروفة)
     kind               ‎uni‎ جامعة · ‎stage‎ مرحلة دراسيّة · ‎admit‎ اختبار قبول
                        ‎license‎ رخصة مهنيّة سعوديّة · ‎intl‎ شهادة أو لغة دوليّة
     org                الجهةُ أو الاسمُ الكامل بالعربيّة والإنجليزيّة (على الورقة وفي البحث)
     country · city     ‎SA‎ · ‎GB‎ · ‎INTL‎ (لا مدينة) — للفلترين الأوّلين
     aliases            ما قد يكتبه الباحث: الاختصار واللقب والاسم الشائع
     a · b · acc        طرفا التدرّج ولونُ الإبراز
     logo · mark        شعارٌ أبيضُ كامل · رمزٌ أبيضُ للعلامة المائيّة (‎assets/brand/unis/‎)
     tag                بلا شعار: اختصارٌ يُرسم علامةً مائيّة (‎STEP‎ · ‎CFA‎)
     href · soon        رابطُ الموقع · «قريبًا» بلا رابط
   ============================================================ */
(function () {
  var SA = 'SA', INTL = 'INTL';
  /* اختصارٌ لمجتمعٍ قادم: ‎[id, ar, en, kind, country, orgAr, orgEn, tag, aliases, a, b, acc]‎ */
  function soon(r) {
    return { id: r[0], ar: r[1], en: r[2], kind: r[3], country: r[4], city: null,
             org: { ar: r[5], en: r[6] }, tag: r[7], aliases: r[8], a: r[9], b: r[10], acc: r[11], soon: 1 };
  }
  window.AC_COMS = [
    /* ===== الجامعات ===== */
    { id: 'maslakh', ar: 'المسلخ', en: 'Almaslakh', kind: 'uni',
      org: { ar: 'جامعة الملك فهد للبترول والمعادن', en: 'King Fahd University of Petroleum & Minerals' },
      country: SA, city: { ar: 'الظهران', en: 'Dhahran' },
      aliases: ['KFUPM', 'البترول', 'جامعة البترول', 'Petroleum', 'فهد'],
      a: '#0e3b41', b: '#1f7a85', acc: '#d0aa68',
      logo: 'kfupm-white.svg', mark: 'kfupm-mark-white.svg', href: '../Almaslakh/' },
    { id: 'mudarraj', ar: 'المدرج', en: 'Almudarraj', kind: 'uni',
      org: { ar: 'جامعة الملك سعود', en: 'King Saud University' },
      country: SA, city: { ar: 'الرياض', en: 'Riyadh' },
      aliases: ['KSU', 'سعود', 'جامعة سعود', 'King Saud'],
      a: '#0a4a6c', b: '#1a8abe', acc: '#82c3d8',
      logo: 'ksu-white.svg', mark: 'ksu-shield-white.svg', href: '../Almudarraj/' },
    { id: 'hive', ar: 'الخلية', en: 'The Hive', kind: 'uni',
      org: { ar: 'جامعة مانشستر', en: 'The University of Manchester' },
      country: 'GB', city: { ar: 'مانشستر', en: 'Manchester' },
      aliases: ['UoM', 'Manchester', 'مانشستر', 'Hive'],
      a: '#3d0a5c', b: '#660099', acc: '#ffcc33',
      logo: 'uom-mono-white.svg', mark: 'uom-box-white.svg', href: '../TheHive/' }
  ].concat([
    /* ===== المراحل الدراسيّة ===== */
    ['thanawi',  'الثانوية',  'Secondary School', 'stage', SA, 'المرحلة الثانويّة — المسار العامّ والمسارات التخصّصيّة', 'Saudi secondary school (General track and specialised tracks)', 'ثانوي', ['ثانوي', 'ثالث ثانوي', 'المسارات', 'High School'], '#1d4a2e', '#3c8a55', '#cfe9b4'],
    ['mutawasit', 'المتوسطة', 'Intermediate School', 'stage', SA, 'المرحلة المتوسّطة', 'Saudi intermediate school', 'متوسط', ['متوسط', 'Middle School'], '#2c4a1d', '#5e8a3c', '#e4e9b4'],
    ['foundation', 'السنة التحضيرية', 'Foundation Year', 'stage', SA, 'السنة التحضيريّة والسنة الأولى المشتركة', 'Preparatory / Common First Year', 'PYP', ['التحضيرية', 'السنة الأولى المشتركة', 'PYP', 'Prep Year'], '#1d4a45', '#3c8a80', '#b4e9e0'],
    /* ===== اختبارات القبول (قياس) ===== */
    ['qudurat', 'القدرات', 'Qudurat', 'admit', SA, 'اختبار القدرات العامّة — قياس', 'General Aptitude Test (GAT) — Qiyas', 'GAT', ['GAT', 'قياس', 'Qiyas', 'قدرات'], '#2a2142', '#5d4a95', '#c9b8f0'],
    ['tahsili', 'التحصيلي', 'Tahsili', 'admit', SA, 'الاختبار التحصيليّ — العلميّ والنظريّ', 'Scholastic Achievement Admission Test (SAAT)', 'SAAT', ['SAAT', 'قياس', 'Qiyas', 'تحصيلي'], '#2b2550', '#5348a8', '#c4bdf5'],
    ['step', 'STEP', 'STEP', 'admit', SA, 'اختبار كفايات اللغة الإنجليزيّة — قياس', 'Standardized Test of English Proficiency — Qiyas', 'STEP', ['ستيب', 'اختبار اللغة', 'قياس', 'Qiyas'], '#1f2a52', '#3f56a8', '#bccaf5'],
    ['pgat', 'القدرات للجامعيين', 'PGAT', 'admit', SA, 'القدرات العامّة للجامعيّين — للدراسات العليا', 'General Aptitude Test for Graduates', 'PGAT', ['PGAT', 'قدرات الجامعيين', 'ماجستير', 'قياس'], '#33204a', '#6b45a0', '#d6c0f2'],
    /* ===== الرخص المهنيّة السعوديّة ===== */
    ['teacher', 'الرخصة المهنية للمعلمين', 'Teachers Licence', 'license', SA, 'اختبار الرخصة المهنيّة للوظائف التعليميّة — التربويّ العامّ والتخصّصيّ', 'Professional Licence for Educational Jobs', 'رخصة', ['الرخصة المهنية', 'المعلمين', 'التربوي العام', 'قياس', 'Teaching Licence'], '#4a2a1d', '#9a5a3a', '#f2cdb4'],
    ['smle', 'SMLE', 'SMLE', 'license', SA, 'الرخصة الطبّيّة — الهيئة السعوديّة للتخصّصات الصحّيّة', 'Saudi Medical Licensure Exam — SCFHS', 'SMLE', ['الهيئة', 'اختبار الهيئة', 'التخصصات الصحية', 'SCFHS', 'هيئة التخصصات', 'طب', 'Medicine'], '#4a1d24', '#a03a4a', '#f5bcc4'],
    ['sple', 'SPLE', 'SPLE', 'license', SA, 'رخصة الصيدلة — الهيئة السعوديّة للتخصّصات الصحّيّة', 'Saudi Pharmacist Licensure Exam — SCFHS', 'SPLE', ['الهيئة', 'اختبار الهيئة', 'صيدلة', 'SCFHS', 'Pharmacy'], '#4a1d38', '#a03a7a', '#f5bce0'],
    ['sdle', 'SDLE', 'SDLE', 'license', SA, 'رخصة طبّ الأسنان — الهيئة السعوديّة للتخصّصات الصحّيّة', 'Saudi Dental Licensure Exam — SCFHS', 'SDLE', ['الهيئة', 'اختبار الهيئة', 'أسنان', 'SCFHS', 'Dentistry'], '#3a1d4a', '#7a3aa0', '#e0bcf5'],
    ['snle', 'التمريض والتخصصات الصحية', 'Nursing & Allied Health', 'license', SA, 'رخص التمريض والتخصّصات الصحّيّة — الهيئة السعوديّة للتخصّصات الصحّيّة', 'Nursing & allied health licensure — SCFHS', 'SCFHS', ['الهيئة', 'اختبار الهيئة', 'تمريض', 'SNLE', 'SCFHS', 'Nursing'], '#1d3a4a', '#3a7aa0', '#bce0f5'],
    ['socpa', 'زمالة SOCPA', 'SOCPA Fellowship', 'license', SA, 'زمالة الهيئة السعوديّة للمراجعين والمحاسبين', 'Saudi Organization for Chartered and Professional Accountants', 'SOCPA', ['الهيئة', 'اختبار الهيئة', 'سوكبا', 'المحاسبين', 'زمالة', 'محاسب قانوني'], '#1d4a3a', '#3aa07a', '#bcf5e0'],
    ['sce', 'اختبارات المهندسين', 'Engineering Exams', 'license', SA, 'الهيئة السعوديّة للمهندسين — الأساسيّات والمهندس المحترف', 'Saudi Council of Engineers — Fundamentals & Professional Engineer', 'FE · PE', ['الهيئة', 'اختبار الهيئة', 'هيئة المهندسين', 'FE', 'PE', 'Fundamentals', 'مهندس محترف'], '#2a3a4a', '#4a6a8a', '#c4d8ec'],
    /* ===== الشهادات واللغات الدوليّة ===== */
    ['ielts', 'IELTS', 'IELTS', 'intl', INTL, 'اختبار اللغة الإنجليزيّة الدوليّ', 'International English Language Testing System', 'IELTS', ['آيلتس', 'ايلتس', 'الآيلتس', 'English'], '#3b1f26', '#8d4654', '#f0b8c4'],
    ['toefl', 'TOEFL', 'TOEFL', 'intl', INTL, 'اختبار الإنجليزيّة لغةً أجنبيّة — ETS', 'Test of English as a Foreign Language — ETS', 'TOEFL', ['توفل', 'التوفل', 'English', 'ETS'], '#3b261f', '#8d5a46', '#f0ccb8'],
    ['sat', 'SAT', 'SAT', 'intl', INTL, 'اختبار القبول الجامعيّ الأمريكيّ — College Board', 'SAT — College Board', 'SAT', ['سات', 'College Board', 'أمريكا'], '#1f2f3b', '#466a8d', '#b8d4f0'],
    ['gmat', 'GMAT', 'GMAT', 'intl', INTL, 'اختبار القبول لكلّيّات الإدارة', 'Graduate Management Admission Test', 'GMAT', ['جيمات', 'MBA', 'ماجستير إدارة'], '#2f1f3b', '#6a468d', '#d4b8f0'],
    ['gre', 'GRE', 'GRE', 'intl', INTL, 'اختبار الدراسات العليا — ETS', 'Graduate Record Examinations — ETS', 'GRE', ['جي آر إي', 'ماجستير', 'ETS'], '#1f3b33', '#468d7a', '#b8f0e0'],
    ['cfa', 'CFA', 'CFA', 'intl', INTL, 'المحلّل الماليّ المعتمد — CFA Institute', 'Chartered Financial Analyst', 'CFA', ['سي اف اي', 'محلل مالي', 'مالية', 'Finance'], '#1f2a3b', '#2e5c8d', '#b8cff0'],
    ['cma', 'CMA', 'CMA', 'intl', INTL, 'المحاسب الإداريّ المعتمد — IMA', 'Certified Management Accountant — IMA', 'CMA', ['سي ام اي', 'محاسب اداري', 'محاسبة'], '#3b2f1f', '#8d6a2e', '#f0dcb8'],
    ['cpa', 'CPA', 'CPA', 'intl', INTL, 'المحاسب القانونيّ الأمريكيّ', 'Certified Public Accountant (US)', 'CPA', ['سي بي اي', 'محاسب قانوني', 'محاسبة'], '#3b1f2f', '#8d2e6a', '#f0b8dc'],
    ['acca', 'ACCA', 'ACCA', 'intl', INTL, 'جمعيّة المحاسبين القانونيّين المعتمدين — بريطانيا', 'Association of Chartered Certified Accountants', 'ACCA', ['اكا', 'محاسبة', 'بريطانيا'], '#2a1f3b', '#5a2e8d', '#ccb8f0'],
    ['cia', 'CIA', 'CIA', 'intl', INTL, 'المراجع الداخليّ المعتمد — IIA', 'Certified Internal Auditor — IIA', 'CIA', ['مراجع داخلي', 'مراجعة', 'تدقيق'], '#1f3b2a', '#2e8d5a', '#b8f0cc'],
    ['pmp', 'PMP', 'PMP', 'intl', INTL, 'محترف إدارة المشاريع — PMI', 'Project Management Professional — PMI', 'PMP', ['بي ام بي', 'إدارة مشاريع', 'PMI'], '#3b3a1f', '#8d8a2e', '#f0eeb8'],
    ['usmle', 'USMLE', 'USMLE', 'intl', INTL, 'رخصة الطبّ الأمريكيّة', 'United States Medical Licensing Examination', 'USMLE', ['يو اس ام ال اي', 'طب', 'أمريكا', 'Step 1'], '#3b1f1f', '#8d2e2e', '#f0b8b8']
  ].map(soon));
  window.AC_COUNTRIES = {
    SA:   { ar: 'السعوديّة', en: 'Saudi Arabia' },
    GB:   { ar: 'بريطانيا', en: 'United Kingdom' },
    INTL: { ar: 'دوليّ', en: 'International' }
  };
  window.AC_KINDS = [
    ['uni',     { ar: 'جامعات', en: 'Universities' }],
    ['stage',   { ar: 'مراحل دراسية', en: 'School stages' }],
    ['admit',   { ar: 'اختبارات قبول', en: 'Admission tests' }],
    ['license', { ar: 'رخص مهنية', en: 'Professional licences' }],
    ['intl',    { ar: 'شهادات دولية', en: 'International certificates' }]
  ];
})();
