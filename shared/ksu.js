/* ============================================================
   ksu.js — أساسُ المدرج (جامعة الملك سعود)
   ============================================================
   يقوم في صفحة المدرج مقامَ ‎courses.js‎ و‎covers.js‎ في المسلخ، ولا يُحمَّل
   معهما. والمحرّكُ يقرأ منه ثلاثة أسماء:
     ‎COLLEGES‎ — الكلّيّات (من دليل القبول ١٤٤٧هـ، ‎_catalog/ksu/‎)
     ‎DEPT_AR‎  — اختصاراتُ الأقسام بالعربي (تُملأ مع الكتالوج)
     ‎COURSES‎  — فارغة عمدًا: موادُّ المدرج من الخادم وحده، فلا تظهر
                  موادُّ المسلخ الاحتياطيّة لزائرٍ لم يصله الكتالوجُ بعد.
     ‎COVERS‎   — فارغة: لا أغلفةَ مبذورة.
   ============================================================ */
const COLLEGES = {
  med:   { ar: 'كلية الطب',                                   en: 'College of Medicine' },
  dent:  { ar: 'كلية طب الأسنان',                             en: 'College of Dentistry' },
  phar:  { ar: 'كلية الصيدلة',                                en: 'College of Pharmacy' },
  ems:   { ar: 'كلية الأمير سلطان للخدمات الطبية الطارئة',     en: 'Prince Sultan College of EMS' },
  nurs:  { ar: 'كلية التمريض',                                en: 'College of Nursing' },
  ams:   { ar: 'كلية العلوم الطبية التطبيقية',                en: 'College of Applied Medical Sciences' },
  ccis:  { ar: 'كلية علوم الحاسب والمعلومات',                 en: 'College of Computer & Information Sciences' },
  eng:   { ar: 'كلية الهندسة',                                en: 'College of Engineering' },
  sci:   { ar: 'كلية العلوم',                                 en: 'College of Science' },
  arch:  { ar: 'كلية العمارة والتخطيط',                       en: 'College of Architecture & Planning' },
  agri:  { ar: 'كلية علوم الأغذية والزراعة',                  en: 'College of Food & Agriculture Sciences' },
  cba:   { ar: 'كلية إدارة الأعمال',                          en: 'College of Business Administration' },
  hss:   { ar: 'كلية العلوم الإنسانية والاجتماعية',           en: 'College of Humanities & Social Sciences' },
  lang:  { ar: 'كلية اللغات وعلومها',                         en: 'College of Languages & Linguistics' },
  edu:   { ar: 'كلية التربية',                                en: 'College of Education' },
  tour:  { ar: 'كلية السياحة والآثار',                        en: 'College of Tourism & Archaeology' },
  law:   { ar: 'كلية الحقوق والعلوم السياسية',                en: 'College of Law & Political Science' },
  arts:  { ar: 'كلية الفنون',                                 en: 'College of Arts' },
  sport: { ar: 'كلية علوم الرياضة والنشاط البدني',            en: 'College of Sport Sciences & Physical Activity' },
  cfy:   { ar: 'السنة الأولى المشتركة',                       en: 'Common First Year' },
  muz:   { ar: 'كليات المزاحمية',                             en: 'Al-Muzahimiyah Colleges' },
};
const DEPT_AR = {};
const COURSES = [];
const COVERS = {};
