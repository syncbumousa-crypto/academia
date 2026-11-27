/* ============================================================
   uom.js — أساسُ الخلية (The Hive · جامعة مانشستر)
   ============================================================
   يقوم في صفحة الخلية مقامَ ‎courses.js‎ في المسلخ و‎ksu.js‎ في المدرج.
     ‎COLLEGES‎ — الـSchools تحت الـFaculties الثلاث (من صفحات البرامج الرسميّة، ‎_catalog/uom/‎)
     ‎DEPT_AR‎  — فارغ: موادُّ مانشستر إنجليزيّةٌ بلا رمزٍ عربيّ، فيُكتب على الكتاب رمزُها كما هو
     ‎COURSES‎  — فارغة عمدًا: الموادُّ من الخادم وحده
     ‎COVERS‎   — فارغة: لا أغلفةَ مبذورة
   و‎AC_CFG‎: كلماتُ جامعةٍ بريطانيّة (‎credits‎ · إجباريّ واختياريّ) وأقسامٌ تُرفع
   (الغياب والتأخير: نظامٌ لجامعة الملك فهد). يقرؤه ‎app.js‎ عند إقلاعه.
   ============================================================ */
const COLLEGES = {
  ambs:  { ar: 'كلية مانشستر للأعمال (Alliance MBS)',            en: 'Alliance Manchester Business School' },
  bmh:   { ar: 'كلية الأحياء والطب والصحة',                       en: 'Faculty of Biology, Medicine and Health' },
  se:    { ar: 'كلية العلوم والهندسة',                            en: 'Faculty of Science and Engineering' },
  hum:   { ar: 'كلية العلوم الإنسانية',                           en: 'Faculty of Humanities' },
};
const DEPT_AR = {};
const COURSES = [];
const COVERS = {};

window.AC_CFG = {
  hide: { abs: 1 },
  i18n: {
    ar: {
      hoursGroup: 'الـcredits', hoursChip: h => h + ' credits', hUnit: 'cr',
      kindGroup: 'نوعية المواد', kindMajor: 'إجبارية', kindElective: 'اختيارية',
      kindCollege: 'مواد كلية', kindCommon: 'مواد مشتركة',
      docSec: 'المحاضرين', docName: 'اسم المحاضر', docEmail: 'إيميل المحاضر',
      gradeSec: 'طريقة التقييم',
    },
    en: {
      hoursGroup: 'Credits', hoursChip: h => h + ' credits', hUnit: 'cr',
      kindGroup: 'Course units', kindMajor: 'Mandatory', kindElective: 'Optional',
      docSec: 'Lecturers', gradeSec: 'Assessment',
    },
  },
};
