/* ============================================================
   ksu.js — أساسُ المدرج (جامعة الملك سعود)
   ============================================================
   يقوم في صفحة المدرج مقامَ ‎courses.js‎ و‎covers.js‎ في المسلخ، ولا يُحمَّل
   معهما. والمحرّكُ يقرأ منه ثلاثة أسماء:
     ‎COLLEGES‎ — الكلّيّات (من دليل القبول ١٤٤٧هـ، ‎_catalog/ksu/‎)
     ‎DEPT_AR‎  — اختصاراتُ الأقسام بالعربي (من عمود ‎ar‎ في الكتالوج)
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
/* ===== اختصاراتُ الأقسام بالعربي تُستخرج من الكتالوج =====
   موادُّ جامعة الملك سعود لها رمزٌ عربيٌّ رسميّ (‎CSC 111‎ = «عال 111»)، وهو في
   عمود ‎ar‎ من كتالوج الخادم. فيُبنى منه ‎DEPT_AR‎ ليقرأ الكتابُ في العربيّة اسمَه
   العربيَّ المختصر كما يُكتب في الجامعة. والدرجُ ههنا درجُ المدرج (‎com.js‎ قبلنا).
   وأوّلُ زيارةٍ بلا كتالوج: المحرّكُ يُعيد الصفحةَ مرّةً حين يصل، فيُبنى حينها. */
const DEPT_AR = (function () {
  var out = {}, n = {};
  try {
    var C = JSON.parse(localStorage.getItem('academia2:catalog:v1') || 'null');
    ((C && C.courses) || []).forEach(function (c) {
      var e = /^([A-Z]+)\s/.exec(c.code || ''), a = /^([\u0600-\u06ff]+)\s/.exec(c.ar || '');
      if (!e || !a) return;
      var k = e[1], m = n[k] || (n[k] = {});
      m[a[1]] = (m[a[1]] || 0) + 1;
    });
    Object.keys(n).forEach(function (k) {
      var best = '', b = 0;
      Object.keys(n[k]).forEach(function (a) { if (n[k][a] > b) { b = n[k][a]; best = a; } });
      out[k] = best;
    });
  } catch (e) {}
  return out;
})();
const COURSES = [];
const COVERS = {};
