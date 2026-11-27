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
  /* جامعة قادمة: [id, ar, en, orgAr, orgEn, cityAr, cityEn, aliases, a, b, acc, logo, mark, mono, wide, private, country(SA)]
     الشعار من موقع الجامعة أو ويكيميديا (المصادر في assets/brand/unis/sa/README.md)، والرمز قص viewBox منه.
     وبلا شعار: اسمها المختصر علامة مائية */
  function uni(r) {
    var short = r[1].replace(/^(الجامعة|جامعة)\s+/, '');
    var c = { id: r[0], ar: r[1], en: r[2], kind: 'uni', country: r[16] || SA, city: { ar: r[5], en: r[6] },
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
    ["kku", "جامعة الملك خالد", "King Khalid University", "جامعة الملك خالد", "King Khalid University", "أبها", "Abha", ["KKU", "جامعة خالد", "جامعة الملك خالد بابها", "جامعة ابها"], "#033d24", "#08754a", "#7fcf9f", "unis/sa/kku.svg", "unis/sa/kku-mark.svg", 1, 0, 0],
    ["kfu", "جامعة الملك فيصل", "King Faisal University", "جامعة الملك فيصل", "King Faisal University", "الأحساء", "Al-Ahsa", ["KFU", "جامعة فيصل", "جامعة الملك فيصل بالاحساء", "جامعة الاحساء"], "#0f3d2e", "#1d6b4f", "#c9a54a", "unis/sa/kfu.svg", "unis/sa/kfu-mark.svg", 1, 0, 0],
    ["bu", "جامعة الباحة", "Al-Baha University", "جامعة الباحة", "Al-Baha University", "الباحة", "Al-Baha", ["BU", "Albaha University", "جامعة الباحه"], "#0f3a3a", "#1d6f6a", "#7fd1c4", "", "", 1, 0, 0],
    ["sru", "جامعة سليمان الراجحي", "Sulaiman Al Rajhi University", "جامعة سليمان الراجحي", "Sulaiman Al Rajhi University", "البكيرية", "Al Bukayriyah", ["SRU", "Sulaiman Al Rajhi", "Alrajhi University", "Rajhi University", "الراجحي", "جامعة الراجحي", "سليمان الراجحي"], "#2e1460", "#552a94", "#b9a0e6", "", "", 1, 0, 1],
    ["pmu", "جامعة الأمير محمد بن فهد", "Prince Mohammad bin Fahd University", "جامعة الأمير محمد بن فهد", "Prince Mohammad bin Fahd University", "الخبر", "Al Khobar", ["PMU", "جامعة الامير محمد", "جامعة الأمير محمد بن فهد الأهلية"], "#0d2f4f", "#1b5a8a", "#7bc4e8", "", "", 1, 0, 1],
    ["psau", "جامعة الأمير سطام", "PSAU", "جامعة الأمير سطام بن عبدالعزيز", "Prince Sattam bin Abdulaziz University", "الخرج", "Al-Kharj", ["PSAU", "Prince Sattam", "Sattam University", "جامعة سطام", "سطام", "جامعة الخرج", "الخرج", "جامعة الامير سطام"], "#173a37", "#3d7570", "#75c6bb", "unis/sa/psau.svg", "unis/sa/psau-mark.svg", 1, 0, 0],
    ["iau", "جامعة الإمام عبدالرحمن بن فيصل", "Imam Abdulrahman Bin Faisal University", "جامعة الإمام عبدالرحمن بن فيصل", "Imam Abdulrahman Bin Faisal University", "الدمام", "Dammam", ["IAU", "جامعة الدمام", "جامعة الامام عبدالرحمن", "University of Dammam", "UOD", "الامام عبدالرحمن"], "#1c2840", "#2e3e5f", "#8599b6", "unis/sa/iau.svg", "unis/sa/iau-mark.svg", 1, 0, 0],
    ["aou", "الجامعة العربية المفتوحة", "AOU", "الجامعة العربية المفتوحة", "Arab Open University – Saudi Arabia", "الرياض", "Riyadh", ["AOU", "Arab Open University", "Arabou", "العربية المفتوحة", "المفتوحة", "الجامعة المفتوحة"], "#002d58", "#134a80", "#7fb2e0", "", "", 1, 0, 1],
    ["psu", "جامعة الأمير سلطان", "PSU", "جامعة الأمير سلطان", "Prince Sultan University", "الرياض", "Riyadh", ["PSU", "Prince Sultan", "Prince Sultan Uni", "جامعة سلطان", "الأمير سلطان", "جامعة الامير سلطان"], "#0c2350", "#16426f", "#0090c3", "", "", 1, 0, 1],
    ["seu", "جامعة الأمير مساعد", "Prince Musaid University", "جامعة الأمير مساعد بن عبدالرحمن (الجامعة السعودية الإلكترونية سابقا)", "Prince Musaid Bin Abdulrahman University (formerly Saudi Electronic University)", "الرياض", "Riyadh", ["SEU", "Saudi Electronic University", "الجامعة السعودية الالكترونية", "السعودية الإلكترونية", "الإلكترونية", "الالكترونية", "جامعة الأمير مساعد", "جامعة الامير مساعد بن عبدالرحمن", "السعودية الالكترونية", "الأمير مساعد"], "#0c1a4d", "#2a3d8f", "#11cec8", "unis/sa/seu.svg", "unis/sa/seu-mark.svg", 1, 0, 0],
    ["pnu", "جامعة الأميرة نورة", "PNU", "جامعة الأميرة نورة بنت عبدالرحمن", "Princess Nourah bint Abdulrahman University", "الرياض", "Riyadh", ["PNU", "Nourah", "Noura", "Princess Nora University", "جامعة نورة", "نورة", "جامعة الاميرة نورة", "الأميرة نورة"], "#05363b", "#0b6c75", "#5fc4cc", "unis/sa/pnu.svg", "unis/sa/pnu-mark.svg", 1, 0, 0],
    ["imam", "جامعة الإمام", "Imam University", "جامعة الإمام محمد بن سعود الإسلامية", "Imam Mohammad Ibn Saud Islamic University", "الرياض", "Riyadh", ["IMSIU", "Imam", "Imamu", "Al-Imam University", "جامعة الامام", "الإمام", "الامام", "جامعة الإمام محمد بن سعود", "جامعة محمد بن سعود"], "#0c3b2e", "#1a6b4f", "#c9a45c", "unis/sa/imam.svg", "unis/sa/imam-mark.svg", 0, 0, 0],
    ["alfaisal", "جامعة الفيصل", "Alfaisal University", "جامعة الفيصل", "Alfaisal University", "الرياض", "Riyadh", ["Alfaisal", "AU", "Al Faisal", "الفيصل", "جامعه الفيصل"], "#0a1a3f", "#1c3a78", "#8ed28a", "", "", 1, 0, 1],
    ["um", "جامعة المعرفة", "AlMaarefa University", "جامعة المعرفة", "AlMaarefa University", "الرياض", "Riyadh", ["UM", "Maarefa", "AlMaarefa", "Al Maarefa", "Almaarefa Colleges", "المعرفة", "كليات المعرفة", "جامعة المعرفه"], "#06323d", "#0a6f85", "#00adca", "unis/sa/um.svg", "unis/sa/um-mark.svg", 0, 0, 1],
    ["ksau", "جامعة الملك سعود للعلوم الصحية", "KSAU-HS", "جامعة الملك سعود بن عبدالعزيز للعلوم الصحية", "King Saud bin Abdulaziz University for Health Sciences", "الرياض", "Riyadh", ["KSAU-HS", "KSAU", "KSAUHS", "جامعة العلوم الصحية", "العلوم الصحية", "جامعة الملك سعود الصحية", "الحرس الوطني"], "#0d2b4a", "#1d5a8a", "#7fb8e6", "", "", 1, 0, 0],
    ["yu", "جامعة اليمامة", "Al Yamamah University", "جامعة اليمامة", "Al Yamamah University", "الرياض", "Riyadh", ["YU", "Yamamah", "Al Yamamah", "Alyamamah", "اليمامة", "جامعة اليمامه"], "#2a1a0e", "#8a4a1a", "#f68938", "unis/sa/yu.svg", "unis/sa/yu-mark.svg", 1, 0, 1],
    ["dau", "جامعة دار العلوم", "Dar Al Uloom University", "جامعة دار العلوم", "Dar Al Uloom University", "الرياض", "Riyadh", ["DAU", "Dar Al Uloom", "Dar Aloloom", "دار العلوم"], "#0f2f30", "#1f5e60", "#8fd0c8", "", "", 1, 0, 1],
    ["reu", "جامعة رياض العلم", "Riyadh Elm University", "جامعة رياض العلم", "Riyadh Elm University", "الرياض", "Riyadh", ["REU", "Riyadh Elm", "Riyadh Colleges of Dentistry and Pharmacy", "كليات الرياض لطب الأسنان والصيدلة", "رياض العلم", "كليات الرياض"], "#0b3d26", "#0e5c35", "#7cc49a", "", "", 1, 0, 1],
    ["tu", "جامعة الطائف", "Taif University", "جامعة الطائف", "Taif University", "الطائف", "Taif", ["TU", "الطائف", "جامعة الطايف", "Taif University", "Taif Uni"], "#123f4a", "#1f6f7d", "#8fd0c8", "", "", 1, 0, 0],
    ["mu", "جامعة المجمعة", "Majmaah University", "جامعة المجمعة", "Majmaah University", "المجمعة", "Majmaah", ["MU", "Majmaah", "Majmaah Uni", "المجمعة", "جامعة المجمعه"], "#0e2f4f", "#1f5f8f", "#8cc0e8", "", "", 1, 0, 0],
    ["iu", "الجامعة الإسلامية", "Islamic University of Madinah", "الجامعة الإسلامية بالمدينة المنورة", "Islamic University of Madinah", "المدينة المنورة", "Madinah", ["IU", "IUM", "الجامعة الاسلامية", "الإسلامية", "الجامعة الإسلامية بالمدينة", "Islamic University", "Islamic University of Medina"], "#073a5a", "#0d6a9a", "#dabc7e", "unis/sa/iu.svg", "unis/sa/iu-mark.svg", 1, 0, 0],
    ["pmu_madinah", "جامعة الأمير مقرن", "University of Prince Mugrin", "جامعة الأمير مقرن بن عبدالعزيز", "University of Prince Mugrin", "المدينة المنورة", "Madinah", ["UPM", "جامعة مقرن", "جامعة الأمير مقرن", "Prince Mugrin University", "Prince Muqrin University", "University of Prince Mugrin"], "#10304a", "#1d5a80", "#8cc4e0", "", "", 1, 0, 1],
    ["taibah", "جامعة طيبة", "Taibah University", "جامعة طيبة", "Taibah University", "المدينة المنورة", "Madinah", ["TaibahU", "Taibah", "طيبة", "جامعة طيبه", "Taibah University"], "#1b2470", "#3546b8", "#6fd3e6", "unis/sa/taibah.svg", "unis/sa/taibah-mark.svg", 1, 0, 0],
    ["qu", "جامعة القصيم", "Qassim University", "جامعة القصيم", "Qassim University", "بريدة", "Buraydah", ["QU", "Qassim", "Qassim Uni", "القصيم", "جامعة القصيم بريدة", "MyQU"], "#0b2a52", "#145a9c", "#00a8aa", "unis/sa/qu.svg", "unis/sa/qu-mark.svg", 0, 0, 0],
    ["mustaqbal", "جامعة المستقبل", "Mustaqbal University", "جامعة المستقبل", "Mustaqbal University", "بريدة", "Buraydah", ["Mustaqbal", "UoM", "Al-Mustaqbal", "المستقبل", "جامعة المستقبل بالقصيم", "جامعة المستقبل بريدة"], "#3a2a2d", "#6e5558", "#c4b795", "unis/sa/mustaqbal.svg", "unis/sa/mustaqbal-mark.svg", 1, 0, 1],
    ["ub", "جامعة بيشة", "University of Bisha", "جامعة بيشة", "University of Bisha", "بيشة", "Bisha", ["UB", "UOB", "جامعة بيشه"], "#14304f", "#2a5c8f", "#8db8e3", "", "", 1, 0, 0],
    ["ut", "جامعة تبوك", "University of Tabuk", "جامعة تبوك", "University of Tabuk", "تبوك", "Tabuk", ["UT", "UOT", "Tabuk University"], "#0f3b33", "#1e6e5f", "#86d1bf", "", "", 1, 0, 0],
    ["kaust", "كاوست", "KAUST", "جامعة الملك عبدالله للعلوم والتقنية", "King Abdullah University of Science and Technology", "ثول", "Thuwal", ["KAUST", "كاوست", "جامعة كاوست", "جامعة الملك عبدالله", "King Abdullah University", "جامعة الملك عبدالله للعلوم والتقنية"], "#0b3f41", "#127f82", "#efb61d", "unis/sa/kaust.svg", "unis/sa/kaust-mark.svg", 1, 0, 0],
    ["jazan", "جامعة جازان", "Jazan University", "جامعة جازان", "Jazan University", "جازان", "Jazan", ["JU", "JazanU", "جامعة جيزان", "Jizan University"], "#0b3a5c", "#11709a", "#f2c94c", "", "", 1, 0, 0],
    ["ubt", "جامعة الأعمال والتكنولوجيا", "University of Business and Technology", "جامعة الأعمال والتكنولوجيا", "University of Business and Technology", "جدة", "Jeddah", ["UBT", "جامعة الاعمال والتكنولوجيا", "جامعة الأعمال", "University of Business & Technology", "UBT Jeddah"], "#0f2a44", "#1e4f7a", "#f0a04b", "", "", 1, 0, 1],
    ["kau", "جامعة الملك عبدالعزيز", "King Abdulaziz University", "جامعة الملك عبدالعزيز", "King Abdulaziz University", "جدة", "Jeddah", ["KAU", "جامعة المؤسس", "المؤسس", "جامعة الملك عبد العزيز", "الملك عبدالعزيز", "King Abdulaziz", "King Abdul Aziz University"], "#0b3d2c", "#17704f", "#d9b45a", "", "", 1, 0, 0],
    ["uj", "جامعة جدة", "University of Jeddah", "جامعة جدة", "University of Jeddah", "جدة", "Jeddah", ["UJ", "جامعة جده", "University of Jeddah", "Jeddah University", "يو جي"], "#0b3447", "#1a5f80", "#80cded", "unis/sa/uj.svg", "unis/sa/uj-mark.svg", 1, 0, 0],
    ["dah", "جامعة دار الحكمة", "Dar Al-Hekma University", "جامعة دار الحكمة", "Dar Al-Hekma University", "جدة", "Jeddah", ["DAH", "DAHU", "دار الحكمة", "Dar Al Hekma", "Dar AlHekma", "Dar Al-Hekma"], "#3a1631", "#6b2a5a", "#d9a6c8", "", "", 1, 0, 1],
    ["effat", "جامعة عفت", "Effat University", "جامعة عفت", "Effat University", "جدة", "Jeddah", ["Effat", "عفت", "Effat Uni", "Effat University"], "#13294b", "#24508a", "#c9a96e", "", "", 1, 0, 1],
    ["uoh", "جامعة حائل", "University of Hail", "جامعة حائل", "University of Hail", "حائل", "Hail", ["UOH", "UoH", "جامعة حايل", "University of Ha'il"], "#0e3b41", "#1f7a85", "#7fd0d8", "", "", 1, 0, 0],
    ["uhb", "جامعة حفر الباطن", "University of Hafr Al Batin", "جامعة حفر الباطن", "University of Hafr Al Batin", "حفر الباطن", "Hafr Al-Batin", ["UHB", "جامعة الحفر", "حفر الباطن"], "#0f3550", "#1d5f86", "#6fc2c9", "", "", 1, 0, 0],
    ["ju", "جامعة الجوف", "Jouf University", "جامعة الجوف", "Jouf University", "سكاكا", "Sakaka", ["JU", "Al-Jouf University", "Aljouf University", "جامعة سكاكا"], "#17263d", "#2b4a76", "#9db8dd", "unis/sa/ju.svg", "unis/sa/ju-mark.svg", 0, 0, 0],
    ["su", "جامعة شقراء", "Shaqra University", "جامعة شقراء", "Shaqra University", "شقراء", "Shaqra", ["SU", "Shaqra", "Shaqraa", "شقراء", "جامعة شقرا"], "#0d3b30", "#1d6b55", "#c8a46a", "", "", 1, 0, 0],
    ["nbu", "جامعة الحدود الشمالية", "Northern Border University", "جامعة الحدود الشمالية", "Northern Border University", "عرعر", "Arar", ["NBU", "جامعة الحدود", "جامعة عرعر", "الحدود الشمالية"], "#13294b", "#24508a", "#d6b25e", "", "", 1, 0, 0],
    ["uqu", "جامعة أم القرى", "Umm Al-Qura University", "جامعة أم القرى", "Umm Al-Qura University", "مكة المكرمة", "Makkah", ["UQU", "أم القرى", "ام القرى", "جامعة ام القرى", "Umm Al-Qura", "Umm Al Qura", "UQU Makkah"], "#3b3020", "#6e5c35", "#d8c08a", "unis/sa/uqu.svg", "unis/sa/uqu-mark.svg", 1, 0, 0],
    ["nu", "جامعة نجران", "Najran University", "جامعة نجران", "Najran University", "نجران", "Najran", ["NU", "جامعة نجران"], "#3b2a1a", "#7a5530", "#d9b36c", "", "", 1, 0, 0]
    /* UNIS-SA:END */
  ].map(uni)).concat([
    /* ===== جامعات مصر (حكومية وأهلية وخاصة) — قائمة ويكيبيديا للجامعات المصرية، وما ينقصها من الحكومية ===== */
    /* UNIS-EG:BEGIN */
    ["aswu", "جامعة أسوان", "Aswan University", "جامعة أسوان", "Aswan University", "أسوان", "Aswan", ["ASWU", "اسوان"], "#142f36", "#2a6c7a", "#b8e2ea", "", "", 0, 0, 0, "EG"],
    ["aun", "جامعة أسيوط", "Assiut University", "جامعة أسيوط", "Assiut University", "أسيوط", "Assiut", ["AUN", "اسيوط"], "#3a2c14", "#86652a", "#f0dcb0", "", "", 0, 0, 0, "EG"],
    ["luxor", "جامعة الأقصر", "Luxor University", "جامعة الأقصر", "Luxor University", "الأقصر", "Luxor", ["الاقصر"], "#142f36", "#2a6c7a", "#b8e2ea", "", "", 0, 0, 0, "EG"],
    ["aast", "الأكاديمية العربية للعلوم والتكنولوجيا", "AASTMT", "الأكاديمية العربية للعلوم والتكنولوجيا والنقل البحري", "Arab Academy for Science, Technology and Maritime Transport", "الإسكندرية", "Alexandria", ["AASTMT", "الاكاديمية البحرية", "الاكاديمية العربية"], "#1a3326", "#2f7550", "#bfe8cf", "", "", 0, 0, 1, "EG"],
    ["alexu", "جامعة الإسكندرية", "Alexandria University", "جامعة الإسكندرية", "Alexandria University", "الإسكندرية", "Alexandria", ["ALEXU", "اسكندرية"], "#2e2238", "#614a86", "#d6c6f0", "", "", 0, 0, 0, "EG"],
    ["anu", "جامعة الإسكندرية الأهلية", "Alexandria National University", "جامعة الإسكندرية الأهلية", "Alexandria National University", "الإسكندرية", "Alexandria", ["ANU", "اهلية"], "#3a2c14", "#86652a", "#f0dcb0", "", "", 0, 0, 0, "EG"],
    ["pua", "جامعة فاروس", "Pharos University", "جامعة فاروس بالإسكندرية", "Pharos University in Alexandria", "الإسكندرية", "Alexandria", ["PUA", "فاروس"], "#33162a", "#7a2f62", "#f0bfe0", "", "", 0, 0, 1, "EG"],
    ["scu", "جامعة قناة السويس", "Suez Canal University", "جامعة قناة السويس", "Suez Canal University", "الإسماعيلية", "Ismailia", ["SCU", "قناة السويس"], "#142f36", "#2a6c7a", "#b8e2ea", "", "", 0, 0, 0, "EG"],
    ["galala", "جامعة الجلالة", "Galala University", "جامعة الجلالة", "Galala University", "الجلالة", "Galala", ["GU", "الجلالة", "اهلية"], "#262b30", "#4c5866", "#d0d8e0", "", "", 0, 0, 0, "EG"],
    ["eelu", "الجامعة المصرية للتعلم الإلكتروني", "Egyptian E-Learning University", "الجامعة المصرية للتعلم الإلكتروني الأهلية", "Egyptian E-Learning University", "الجيزة", "Giza", ["EELU", "التعلم الالكتروني"], "#2e2238", "#614a86", "#d6c6f0", "", "", 0, 0, 0, "EG"],
    ["cu", "جامعة القاهرة", "Cairo University", "جامعة القاهرة", "Cairo University", "الجيزة", "Giza", ["CU", "القاهرة", "Cairo"], "#14233d", "#2d4f86", "#b8cdf0", "", "", 0, 0, 0, "EG"],
    ["ngu", "جامعة نيو جيزة", "Newgiza University", "جامعة نيو جيزة", "Newgiza University", "الجيزة", "Giza", ["NGU", "نيوجيزة"], "#142f36", "#2a6c7a", "#b8e2ea", "", "", 0, 0, 1, "EG"],
    ["nvu", "جامعة الوادي الجديد", "New Valley University", "جامعة الوادي الجديد", "New Valley University", "الخارجة", "Kharga", ["NVU", "الوادي الجديد"], "#3b1a1a", "#8a3434", "#f0c0b8", "", "", 0, 0, 0, "EG"],
    ["zu", "جامعة الزقازيق", "Zagazig University", "جامعة الزقازيق", "Zagazig University", "الزقازيق", "Zagazig", ["ZU", "الزقازيق"], "#3b1a1a", "#8a3434", "#f0c0b8", "", "", 0, 0, 0, "EG"],
    ["o6u", "جامعة 6 أكتوبر", "October 6 University", "جامعة 6 أكتوبر", "October 6 University", "السادس من أكتوبر", "6th of October", ["O6U", "ستة اكتوبر", "سته اكتوبر"], "#2e2238", "#614a86", "#d6c6f0", "", "", 0, 0, 1, "EG"],
    ["msa", "جامعة أكتوبر للعلوم الحديثة والآداب", "MSA University", "جامعة أكتوبر للعلوم الحديثة والآداب", "October University for Modern Sciences and Arts", "السادس من أكتوبر", "6th of October", ["MSA", "ام اس ايه"], "#1a3326", "#2f7550", "#bfe8cf", "", "", 0, 0, 1, "EG"],
    ["acu", "جامعة الأهرام الكندية", "Ahram Canadian University", "جامعة الأهرام الكندية", "Ahram Canadian University", "السادس من أكتوبر", "6th of October", ["ACU", "الاهرام الكندية"], "#3a2c14", "#86652a", "#f0dcb0", "", "", 0, 0, 1, "EG"],
    ["must", "جامعة مصر للعلوم والتكنولوجيا", "MUST", "جامعة مصر للعلوم والتكنولوجيا", "Misr University for Science and Technology", "السادس من أكتوبر", "6th of October", ["MUST"], "#3b1a1a", "#8a3434", "#f0c0b8", "unis/eg/must.svg", "unis/eg/must-mark.svg", 0, 0, 1, "EG"],
    ["zewail", "مدينة زويل", "Zewail City", "مدينة زويل للعلوم والتكنولوجيا والابتكار", "Zewail City of Science, Technology and Innovation", "السادس من أكتوبر", "6th of October", ["زويل", "Zewail"], "#3a2c14", "#86652a", "#f0dcb0", "", "", 0, 0, 0, "EG"],
    ["suezu", "جامعة السويس", "Suez University", "جامعة السويس", "Suez University", "السويس", "Suez", ["السويس"], "#33162a", "#7a2f62", "#f0bfe0", "", "", 0, 0, 0, "EG"],
    ["bue", "الجامعة البريطانية في مصر", "British University in Egypt", "الجامعة البريطانية في مصر", "The British University in Egypt", "الشروق", "El Shorouk", ["BUE", "البريطانية"], "#262b30", "#4c5866", "#d0d8e0", "", "", 0, 0, 1, "EG"],
    ["ufe", "الجامعة الفرنسية في مصر", "French University of Egypt", "الجامعة الفرنسية في مصر", "Université Française d'Égypte", "الشروق", "El Shorouk", ["UFE", "الفرنسية"], "#3b1a1a", "#8a3434", "#f0c0b8", "", "", 0, 0, 1, "EG"],
    ["nileu", "جامعة النيل", "Nile University", "جامعة النيل الأهلية", "Nile University", "الشيخ زايد", "Sheikh Zayed", ["NU", "النيل"], "#1a3326", "#2f7550", "#bfe8cf", "", "", 0, 0, 0, "EG"],
    ["arish", "جامعة العريش", "Arish University", "جامعة العريش", "Arish University", "العريش", "Arish", ["العريش"], "#1a3326", "#2f7550", "#bfe8cf", "", "", 0, 0, 0, "EG"],
    ["sinai", "جامعة سيناء", "Sinai University", "جامعة سيناء", "Sinai University", "العريش", "Arish", ["سيناء"], "#262b30", "#4c5866", "#d0d8e0", "", "", 0, 0, 1, "EG"],
    ["aiu", "جامعة العلمين الدولية", "Alamein International University", "جامعة العلمين الدولية للعلوم والتكنولوجيا", "Alamein International University", "العلمين", "El Alamein", ["AIU", "العلمين", "اهلية"], "#142f36", "#2a6c7a", "#b8e2ea", "", "", 0, 0, 0, "EG"],
    ["fu_eg", "جامعة الفيوم", "Fayoum University", "جامعة الفيوم", "Fayoum University", "الفيوم", "Faiyum", ["FU", "الفيوم", "Faiyum"], "#2e2238", "#614a86", "#d6c6f0", "", "", 0, 0, 0, "EG"],
    ["aou_eg", "الجامعة العربية المفتوحة", "Arab Open University", "الجامعة العربية المفتوحة (فرع مصر)", "Arab Open University – Egypt", "القاهرة", "Cairo", ["AOU"], "#2e2238", "#614a86", "#d6c6f0", "", "", 0, 0, 1, "EG"],
    ["azhar", "جامعة الأزهر", "Al-Azhar University", "جامعة الأزهر الشريف", "Al-Azhar University", "القاهرة", "Cairo", ["AZU", "الأزهر", "Azhar"], "#1a3326", "#2f7550", "#bfe8cf", "unis/eg/azhar.svg", "unis/eg/azhar-mark.svg", 1, 0, 0, "EG"],
    ["capu", "جامعة العاصمة", "Capital University", "جامعة العاصمة (جامعة حلوان سابقا)", "Capital University (formerly Helwan University)", "القاهرة", "Cairo", ["حلوان", "جامعة حلوان", "Helwan", "Helwan University", "العاصمة"], "#14233d", "#2d4f86", "#b8cdf0", "", "", 0, 0, 0, "EG"],
    ["asu", "جامعة عين شمس", "Ain Shams University", "جامعة عين شمس", "Ain Shams University", "القاهرة", "Cairo", ["ASU", "عين شمس"], "#3b1a1a", "#8a3434", "#f0c0b8", "", "", 0, 0, 0, "EG"],
    ["miu", "جامعة مصر الدولية", "Misr International University", "جامعة مصر الدولية", "Misr International University", "القاهرة", "Cairo", ["MIU"], "#14233d", "#2d4f86", "#b8cdf0", "", "", 0, 0, 1, "EG"],
    ["heliopolis", "جامعة هليوبوليس", "Heliopolis University", "جامعة هليوبوليس للتنمية المستدامة", "Heliopolis University for Sustainable Development", "القاهرة", "Cairo", ["HU", "هليوبوليس"], "#262b30", "#4c5866", "#d0d8e0", "", "", 0, 0, 1, "EG"],
    ["guc", "الجامعة الألمانية بالقاهرة", "German University in Cairo", "الجامعة الألمانية بالقاهرة", "German University in Cairo", "القاهرة الجديدة", "New Cairo", ["GUC", "الالمانية"], "#33162a", "#7a2f62", "#f0bfe0", "", "", 0, 0, 1, "EG"],
    ["auc", "الجامعة الأمريكية بالقاهرة", "The American University in Cairo", "الجامعة الأمريكية بالقاهرة", "The American University in Cairo", "القاهرة الجديدة", "New Cairo", ["AUC", "الامريكية"], "#142f36", "#2a6c7a", "#b8e2ea", "", "", 0, 0, 1, "EG"],
    ["fue", "جامعة المستقبل في مصر", "Future University in Egypt", "جامعة المستقبل في مصر", "Future University in Egypt", "القاهرة الجديدة", "New Cairo", ["FUE", "المستقبل"], "#14233d", "#2d4f86", "#b8cdf0", "", "", 0, 0, 1, "EG"],
    ["mans", "جامعة المنصورة", "Mansoura University", "جامعة المنصورة", "Mansoura University", "المنصورة", "Mansoura", ["MANS", "المنصورة"], "#33162a", "#7a2f62", "#f0bfe0", "", "", 0, 0, 0, "EG"],
    ["nmu", "جامعة المنصورة الجديدة", "New Mansoura University", "جامعة المنصورة الجديدة", "New Mansoura University", "المنصورة الجديدة", "New Mansoura", ["NMU", "اهلية"], "#3b1a1a", "#8a3434", "#f0c0b8", "", "", 0, 0, 0, "EG"],
    ["lotus", "جامعة اللوتس", "Lotus University", "جامعة اللوتس بالمنيا", "Lotus University in Minya", "المنيا", "Minya", ["اللوتس"], "#14233d", "#2d4f86", "#b8cdf0", "", "", 0, 0, 1, "EG"],
    ["minia", "جامعة المنيا", "Minia University", "جامعة المنيا", "Minia University", "المنيا", "Minya", ["المنيا", "Minya"], "#262b30", "#4c5866", "#d0d8e0", "", "", 0, 0, 0, "EG"],
    ["ejust", "الجامعة المصرية اليابانية", "E-JUST", "الجامعة المصرية اليابانية للعلوم والتكنولوجيا", "Egypt-Japan University of Science and Technology", "برج العرب", "Borg El Arab", ["EJUST", "E-JUST", "اليابانية"], "#33162a", "#7a2f62", "#f0bfe0", "", "", 0, 0, 0, "EG"],
    ["benha", "جامعة بنها", "Benha University", "جامعة بنها", "Benha University", "بنها", "Benha", ["BU", "بنها", "Banha"], "#33162a", "#7a2f62", "#f0bfe0", "", "", 0, 0, 0, "EG"],
    ["nub", "جامعة النهضة", "Nahda University", "جامعة النهضة", "Nahda University in Beni Suef", "بني سويف", "Beni Suef", ["NUB", "النهضة"], "#3a2c14", "#86652a", "#f0dcb0", "", "", 0, 0, 1, "EG"],
    ["bsu", "جامعة بني سويف", "Beni-Suef University", "جامعة بني سويف", "Beni-Suef University", "بني سويف", "Beni Suef", ["BSU", "بني سويف"], "#262b30", "#4c5866", "#d0d8e0", "", "", 0, 0, 0, "EG"],
    ["psu_eg", "جامعة بورسعيد", "Port Said University", "جامعة بورسعيد", "Port Said University", "بورسعيد", "Port Said", ["PSU", "بورسعيد", "بور سعيد"], "#1a3326", "#2f7550", "#bfe8cf", "", "", 0, 0, 0, "EG"],
    ["dust", "جامعة الدلتا", "Delta University", "جامعة الدلتا للعلوم والتكنولوجيا", "Delta University for Science and Technology", "جمصة", "Gamasa", ["DUST", "الدلتا"], "#142f36", "#2a6c7a", "#b8e2ea", "", "", 0, 0, 1, "EG"],
    ["dmu", "جامعة دمنهور", "Damanhour University", "جامعة دمنهور", "Damanhour University", "دمنهور", "Damanhour", ["DMU", "دمنهور"], "#3b1a1a", "#8a3434", "#f0c0b8", "", "", 0, 0, 0, "EG"],
    ["du", "جامعة دمياط", "Damietta University", "جامعة دمياط", "Damietta University", "دمياط", "Damietta", ["دمياط"], "#1a3326", "#2f7550", "#bfe8cf", "", "", 0, 0, 0, "EG"],
    ["sohag", "جامعة سوهاج", "Sohag University", "جامعة سوهاج", "Sohag University", "سوهاج", "Sohag", ["سوهاج"], "#2e2238", "#614a86", "#d6c6f0", "", "", 0, 0, 0, "EG"],
    ["menofia", "جامعة المنوفية", "Menoufia University", "جامعة المنوفية", "Menoufia University", "شبين الكوم", "Shibin El Kom", ["المنوفية", "Menofia"], "#14233d", "#2d4f86", "#b8cdf0", "", "", 0, 0, 0, "EG"],
    ["ksiu", "جامعة الملك سلمان الدولية", "King Salman International University", "جامعة الملك سلمان الدولية", "King Salman International University", "شرم الشيخ", "Sharm El Sheikh", ["KSIU", "الملك سلمان", "اهلية"], "#14233d", "#2d4f86", "#b8cdf0", "", "", 0, 0, 0, "EG"],
    ["tanta", "جامعة طنطا", "Tanta University", "جامعة طنطا", "Tanta University", "طنطا", "Tanta", ["TU", "طنطا"], "#262b30", "#4c5866", "#d0d8e0", "", "", 0, 0, 0, "EG"],
    ["svu", "جامعة جنوب الوادي", "South Valley University", "جامعة جنوب الوادي", "South Valley University", "قنا", "Qena", ["SVU", "جنوب الوادي", "قنا"], "#3a2c14", "#86652a", "#f0dcb0", "", "", 0, 0, 0, "EG"],
    ["kfs", "جامعة كفر الشيخ", "Kafrelsheikh University", "جامعة كفر الشيخ", "Kafrelsheikh University", "كفر الشيخ", "Kafr El Sheikh", ["KFS", "كفر الشيخ"], "#3a2c14", "#86652a", "#f0dcb0", "", "", 0, 0, 0, "EG"],
    ["usc", "جامعة مدينة السادات", "University of Sadat City", "جامعة مدينة السادات", "University of Sadat City", "مدينة السادات", "Sadat City", ["USC", "السادات"], "#14233d", "#2d4f86", "#b8cdf0", "", "", 0, 0, 0, "EG"],
    ["eru", "الجامعة المصرية الروسية", "Egyptian Russian University", "الجامعة المصرية الروسية", "Egyptian Russian University", "مدينة بدر", "Badr City", ["ERU", "الروسية"], "#33162a", "#7a2f62", "#f0bfe0", "", "", 0, 0, 1, "EG"],
    ["matrouh", "جامعة مطروح", "Matrouh University", "جامعة مطروح", "Matrouh University", "مرسى مطروح", "Marsa Matruh", ["مطروح"], "#2e2238", "#614a86", "#d6c6f0", "", "", 0, 0, 0, "EG"]
    /* UNIS-EG:END */
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
    EG:   { ar: 'مصر', en: 'Egypt' },
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
