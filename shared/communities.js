/* ============================================================
   communities.js — سجلُّ مجتمعات أكاديميا (ROADMAP-EXPLORE س١)
   ============================================================
   مصدرٌ واحدٌ لكلّ ما يُعرف عن المجتمع: «استكشاف» تبني منه أوراقَها
   وبحثَها وفلاترَها، و«مجتمعاتي» والركنُ العامّ يقرآن منه الاسمَ واللون.
   فزيادةُ مجتمعٍ سطرٌ ههنا لا تعديلٌ في ثلاثة مواضع.

   الحقول:
     id · ar · en       المعرّف والاسمان
     kind               ‎uni‎ جامعة · ‎test‎ اختبار تقييم
     org                اسمُ الجهة بالعربيّة والإنجليزيّة (على الورقة وفي البحث)
     country · city     ‎SA‎ · ‎GB‎ · ‎INTL‎ (لا مدينة) — للفلترين الأوّلين
     aliases            ما قد يكتبه الباحث: الاختصار واللقب والاسم الشائع
     a · b · acc        طرفا التدرّج ولونُ الإبراز
     logo · mark        شعارٌ أبيضُ كامل · رمزٌ أبيضُ للعلامة المائيّة (‎assets/brand/unis/‎)
     href · soon        رابطُ الموقع · «قريبًا» بلا رابط
   ============================================================ */
window.AC_COMS = [
  { id: 'maslakh', ar: 'المسلخ', en: 'Almaslakh', kind: 'uni',
    org: { ar: 'جامعة الملك فهد للبترول والمعادن', en: 'King Fahd University of Petroleum & Minerals' },
    country: 'SA', city: { ar: 'الظهران', en: 'Dhahran' },
    aliases: ['KFUPM', 'البترول', 'جامعة البترول', 'Petroleum', 'فهد'],
    a: '#0e3b41', b: '#1f7a85', acc: '#d0aa68',
    logo: 'kfupm-white.svg', mark: 'kfupm-mark-white.svg', href: '../Almaslakh/' },
  { id: 'mudarraj', ar: 'المدرج', en: 'Almudarraj', kind: 'uni',
    org: { ar: 'جامعة الملك سعود', en: 'King Saud University' },
    country: 'SA', city: { ar: 'الرياض', en: 'Riyadh' },
    aliases: ['KSU', 'سعود', 'جامعة سعود', 'King Saud'],
    a: '#0a4a6c', b: '#1a8abe', acc: '#82c3d8',
    logo: 'ksu-white.svg', mark: 'ksu-shield-white.svg', href: '../Almudarraj/' },
  { id: 'hive', ar: 'الخلية', en: 'The Hive', kind: 'uni',
    org: { ar: 'جامعة مانشستر', en: 'The University of Manchester' },
    country: 'GB', city: { ar: 'مانشستر', en: 'Manchester' },
    aliases: ['UoM', 'Manchester', 'مانشستر', 'Hive'],
    a: '#3d0a5c', b: '#660099', acc: '#ffcc33',
    logo: 'uom-mono-white.svg', mark: 'uom-box-white.svg', href: '../TheHive/' },
  { id: 'qudurat', ar: 'القدرات', en: 'Qudurat', kind: 'test', soon: 1,
    org: { ar: 'اختبار القدرات العامّة', en: 'General Aptitude Test' },
    country: 'SA', city: null, aliases: ['GAT', 'قياس', 'Qiyas'],
    a: '#2a2142', b: '#5d4a95', acc: '#c9b8f0' },
  { id: 'tahsili', ar: 'التحصيلي', en: 'Tahsili', kind: 'test', soon: 1,
    org: { ar: 'الاختبار التحصيليّ', en: 'Achievement Test' },
    country: 'SA', city: null, aliases: ['SAAT', 'قياس', 'Qiyas'],
    a: '#1e3326', b: '#3f7a55', acc: '#a8d8b6' },
  { id: 'ielts', ar: 'الآيلتس', en: 'IELTS', kind: 'test', soon: 1,
    org: { ar: 'اختبار اللغة الإنجليزيّة الدوليّ', en: 'International English Language Testing System' },
    country: 'INTL', city: null, aliases: ['ايلتس', 'English'],
    a: '#3b1f26', b: '#8d4654', acc: '#f0b8c4' }
];
window.AC_COUNTRIES = {
  SA:   { ar: 'السعوديّة', en: 'Saudi Arabia' },
  GB:   { ar: 'بريطانيا', en: 'United Kingdom' },
  INTL: { ar: 'دوليّ', en: 'International' }
};
