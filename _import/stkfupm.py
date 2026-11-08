# -*- coding: utf-8 -*-
r"""
نقلُ مساهماتٍ من مجتمع STKFUPM القديم (Discourse) إلى أكاديميا.

    python _import/stkfupm.py <مجلد مواضيع JSON>   ⇐ يكتب _import/out/<المادة>.json و .sql

===== ما يُنقل وإلى أين =====
كلُّ مشاركةٍ مختارةٍ ⇐ مساهمةٌ في بند «المادة» (‎info‎) باسم كاتبها هناك وصورتِه:
  · الكاتبُ حسابٌ مستورَد ‎uid = stk-<username>‎ لا كلمةَ سرٍّ له (‎pw_hash‎ خاوٍ كحساب الموقع
    ‎u-academia‎: لا يُبلَغ من باب الدخول أبدًا)، وبريدُه ‎<username>@import.stkfupm.invalid‎ — نطاقٌ لا يُرسل إليه.
  · والأصلُ في ‎data.imp‎ ⇐ شارة «from STKFUPM» بجانب الاسم، تفتح المشاركةَ الأصليّة.
  · والتاريخُ تاريخُها هناك (‎ts‎) لا تاريخُ النقل.

والاختيارُ يدويٌّ في ‎PICK‎: ما فيه خبرةٌ أو معلومة. والأسئلةُ بلا جواب، والمكرَّر،
والروابطُ الميّتة (mediafire)، والشتائمُ — لا تُنقل.
"""
import io, os, re, sys, json, base64, hashlib, html as H
from datetime import datetime

BASE = 'https://community.stkfupm.com'
ROOT = os.path.dirname(os.path.abspath(__file__))
MEDIA_URL = 'https://cyuufavrbqyqywhftbjw.supabase.co/functions/v1/api/media/'
INLINE_MAX = 64 * 1024           # ما دونه يسكن المتنَ ‎data:‎، وما فوقه جدولَ الوسائط (يُنزَّل حين يُضغط لا مع كلّ فتحٍ للمادّة)
MIME = {'.pdf': 'application/pdf', '.doc': 'application/msword', '.ppt': 'application/vnd.ms-powerpoint',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
        '.zip': 'application/zip', '.rar': 'application/vnd.rar'}
OUT  = os.path.join(ROOT, 'out')

# code ⇐ [(topic id, post_number, book?)]
# code ⇐ [(topic id, post_number, book, keep)]
# ‏‎keep‎: مشاركةٌ تتكلّم عن موادَّ كثيرة يُؤخذ منها سطرُ هذه المادّة وحدَه، بلفظه:
#   ‎(نمطُ أوّلِ سطر, عددُ الأسطر)‎ — ولا يُضاف إليه حرف.
# ‏‎ACCT 202‎ هي ‎ACCT 210‎ باسمها القديم («210 = 202 سابقا»)، فتُجمع معها.
PICK = {
  'ACCT 210': [
    (120957, 5,  '', None),                                   # وصف المقرّر ومخرجاته من السيلابس
    (120957, 8,  'Managerial Accounting Braun and tietz 3rd Edition', None),  # الكتاب الجديد — بلفظه
    (120957, 9,  '', None),                                   # تجربة ترم 141
    (120957, 11, '', None),                                   # تجربة ترم 142 — أطولها وأنفعها
    (120957, 12, '', None),                                   # تجربة ترم 162
    (120957, 13, '', None),                                   # تجربة ترم 192
    (107923, 1,  '', None),                                   # فاينل 202 (2011): صعبٌ وفيه تريكات
    (114257, 10, '', None),                                   # 9ami (2012): المادّة تحتاج متابعةً ومسائل
    (50950,  2,  '', (r'^acct202', 1)),                       # 2006: سطرُ 202 من ردٍّ عن أربع مواد
    (88402,  10, '', (r'^Acct 202', 2)),                      # 2010: سطرا 202 من ردٍّ عن أربع مواد
  ],
  # ‏‎IAS 111‎ «الإيمان» — اسمُها لم يتغيّر (و‎IAS 101‎ مادّةُ العربي، غيرُها)
  'IAS 111': [
    (120491, 2,  '', None), (120491, 3,  '', None), (120491, 5,  '', None),   # موضوعُ تقييم المقرّر
    (120491, 7,  '', None), (120491, 8,  '', None), (120491, 10, '', None),
    (120491, 11, '', None), (120491, 12, '', None), (120491, 13, '', None),
    (104452, 3,  '', None),                                   # Euler (2011): طريقةُ الأسئلة
    (104452, 4,  '', None),                                   # The_Marvel (2011): «يسألون أحيانا عكس»
    (172733, 1,  '', None),                                   # Rygart (2016): صارت ميدترم وفاينل من 151
    (115213, 8,  '', None),                                   # Brain_Man (2011): الـ A+ من 95
  ],
  # ‏‎ENGL 101‎ «مهارات الخطاب الأكاديمي» — اسمُها لم يتغيّر
  'ENGL 101': [
    (120478, 8,  '', None), (120478, 11, '', None), (120478, 13, '', None),   # موضوعُ تقييم المقرّر
    (120478, 16, '', None), (120478, 18, '', None), (120478, 19, '', None),
    (120478, 21, '', None), (120478, 22, '', None), (120478, 23, '', None),
    (120478, 25, '', None), (120478, 26, '', None), (120478, 27, '', None),
    (120478, 28, '', None),
    (102863, 1,  '', (r'^انجلش 101', 19)),                    # student_NZ (2011): قسمُ 101 من شرحه للكورسات الثلاثة
    (102863, 42, '', (r'^101 عندك', 1)),                      # equal (2011): سطرُ 101 من مقارنته
    (86478,  1,  '', None),                                   # Phenomenon (2010): انطباعُه عن الميدترم
  ],
  # ‏‎FIN 250‎ «الإدارة المالية» — اسمُها القديم ‎FIN 301‎ («fin 301 >> fin 250»)، فتُجمع معها
  'FIN 250': [
    (121018, 3,  '', None),                                   # Practice (2016): مواضيعُ المقرّر، والكتاب «جدا ممتاز»
    (121018, 4,  '', None),                                   # user9840 (2018): انطباعُه وشباترُه
    (154981, 2,  '', None),                                   # FIN_Analyst (2014): فكرةٌ عامّةٌ عن الكورس
    (154981, 4,  '', None),                                   # almax (2014): أخذها مع ACCT 210 بلا مشاكل
    (129942, 2,  '', None),                                   # 9ami (2012): متطلّباتُها من البوّابة
    (167746, 3,  '', (r'^3- نزل الـfin 250', 1)),             # MHM14 (2014): سطرُ 250 من نصائحه
    (112603, 44, '', None),                                   # Anoosh (2011): ‎FIN 301/302‎ تُدمجان في ‎FIN 250‎
    (122149, 184, '', (r'^fin 301 >> fin 250', 1)),           # user4307 (2012): الاسمُ الجديد
    (50803,  7,  '', (r'^هذي ماده في غايه الاهميه', 1)),      # Fin.1000 (2006): سطرُ المادّة (‎FIN 301‎) من ردٍّ عن أربع مواد
  ],
}

# ===== المصادر =====
# code ⇐ [(sec, topic id, post_number, files[, keep])] — ‏‎srcU‎ مصادرُ الفهم، و‎srcP‎ مصادرُ الممارسة.
# ‏‎keep‎ اختياريّ كما في ‎PICK‎: ‎(نمطُ أوّلِ سطر, عددُ الأسطر)‎ — لمرفقٍ في ردٍّ موضوعُه غيرُه.
# ‏‎files‎: ‎[(اسمُ الملف, مسارُه في _import/files, سطرُ المرفق في النصّ)]‎ — يحلّ الملفُّ
# محلَّ سطرِ مرفقه في ديسكورس، فيبقى حيث وضعه كاتبُه.
PICK_SRC = {
  'ACCT 210': [
    ('srcU', 114257, 6,  []),    # 9ami (2011): توتوريال وايلي بلس شابترًا شابترًا
    ('srcU', 114257, 7,  []),    # Anoosh (2011): الكتاب + وايلي بلس يغنيانك عن مدرّس
    ('srcU', 114257, 8,  []),    # user8337 (2011): اقرأ الكتاب
    ('srcU', 154985, 2,  []),    # FIN_Analyst (2014): ما تحتاجه من الأساسيات قبل المادّة
    ('srcU', 176349, 2,  []),    # HARD-WORKER (2017): السلايدات ثمّ المسائل ثمّ الأونلاين هوموورك
    ('srcP', 172455, 2,  []),    # Practice (2016): مسائل السيلابس واختياراتُ آخر الشابتر
    ('srcP', 89593,  3,  [('final acc.pdf', 'stkfupm-89593-final acc.pdf', r'^final acc\.pdf')]),  # صفحةُ فاينل 202 (2010)
  ],
  'IAS 111': [
    ('srcU', 113042, 1,  [('ias111.doc', 'stkfupm-113042-ias111.doc', r'^ias111\.doc')]),  # سيلابس 121: الوصف والدرجات والمفردات بالصفحات
    ('srcU', 136894, 7,  [('IAS 111.png', 'stkfupm-136894-IAS 111.png', r'^IAS 111\.png')]),  # جدولُ الماتيريال (2012)
    ('srcU', 173230, 5,  [('image.jpg', 'stkfupm-173230-image.jpg', r'^image\.jpg')]),        # جدولُ الماتيريال (2016)
    ('srcU', 96870,  2,  []),    # user3794 (2010): ذاكر من الكتاب، وفيه من بين السطور
    ('srcU', 159664, 3,  []),    # user9202 (2014): اقرأ وكأنك تستفيد، ثمّ الأولد اقزامز
    ('srcU', 165971, 3,  []),    # user10175 (2014): الكتاب ثمّ الأولد اقزام والتأكّد من الكتاب
    ('srcU', 165971, 4,  []),    # abo_yazeed6 (2014): الكتاب ثمّ الأولد اقزامز
    ('srcP', 100900, 6,  [('ias 111 072 first exam.pdf', 'stkfupm-100900-ias 111 072 first exam.pdf', r'^ias 111 072 first exam\.pdf'),
                          ('ias 111 072 second exam.pdf', 'stkfupm-100900-ias 111 072 second exam.pdf', r'^ias 111 072 second exam\.pdf')]),
    ('srcP', 104646, 8,  []),    # user6605 (2011): الفاينل جاء من أولد 072 بنصّه
    ('srcP', 132383, 2,  []),    # KeMoOo (2012): old exams + read the book
    ('srcP', 156412, 5,  []),    # Medoalkebsi (2014): احفظ الأولد اقزامز
  ],
  'ENGL 101': [
    ('srcU', 117681, 1,  [('The Science Behind Diet and Cancer(Tran).doc', 'stkfupm-117681-1-The Science Behind Diet and Cancer(Tran).doc', r'^The Science Behind Diet'), ('Omega Oil(Trans) .doc', 'stkfupm-117681-1-Omega Oil(Trans) .doc', r'Omega Oil\(Trans')]),   # scorbion (2012): قطعُ الريدنق مترجمةَ الكلمات
    ('srcU', 123055, 8,  [('READING Mosquitos.doc', 'stkfupm-123055-8-READING Mosquitos.doc', r'^READING Mosquitos'), ('READING Osteoporosis.doc', 'stkfupm-123055-8-READING Osteoporosis.doc', r'^READING Osteoporosis')]),   # user7909 (2012): قطعتا ريدنق الميدترم
    ('srcU', 113856, 3,  [('Words.doc', 'stkfupm-113856-3-Words.doc', r'^Words\.doc')]),       # Opalmax (2011): AWL Sub-list 1 من أ. جوش بيلام
    ('srcU', 141950, 8,  [('ENGLISH 101 MIDTERM EXAMINATION.doc', 'stkfupm-141950-8-ENGLISH 101 MIDTERM EXAMINATION.doc', r'^ENGLISH 101 MIDTERM EXAMINATION\.doc')]),       # Exuse_Me (2013): قطعةُ الميدترم مترجمة
    ('srcU', 88996,  10, [('PORTFOLIO.doc', 'stkfupm-88996-10-PORTFOLIO.doc', r'^PORTFOLIO\.doc')]),       # Abu_3zzoz (2010): متطلّبات البورتفوليو
    ('srcU', 120478, 5,  [('101 Course Components - Sem 112.doc', 'stkfupm-120478-5-101 Course Components - Sem 112.doc', r'^101 Cours')]),       # ISEngineer210 (2012): مكوّناتُ المقرّر ترم 112 (ودرجاتُه في توزيع الدرجات)
    ('srcU', 117533, 4,  []),         # user7562 (2012): نقاطُ القرامر المطلوبة
    ('srcU', 117533, 9,  []),         # ll_M_ll (2012): مواقعُ تشرح القرامر نفسَه
    ('srcU', 122997, 14, []),         # NASSER_9X (2012): المذاكرةُ للميدترم من واقع تجربة
    ('srcU', 122997, 17, []),         # 3loole (2012): القطعتان والورد لست والوحدات
    ('srcU', 122997, 5,  []),         # Brilliant_Ac (2012): افهم القطعتين كاملتين
    ('srcU', 141950, 2,  []),         # user9537 (2013): كيف أخذ A في الميدترم
    ('srcU', 157782, 3,  []),         # mountine_man (2014): تقسيمُ القطعة ومعلوماتُها المهمّة
    ('srcU', 150792, 9,  []),         # user8581 (2013): ما في الميدترم
    ('srcU', 132327, 5,  []),         # abu_khaled (2012): البريزنتيشن
    ('srcP', 104715, 1,  [('Water Resources Comp 1.doc', 'stkfupm-104715-1-Water Resources Comp 1.doc', r'^Water Resources Comp 1\.doc'), ('Water Resources Comp 2.doc', 'stkfupm-104715-1-Water Resources Comp 2.doc', r'^Water Resources Comp 2\.doc'), ('Water Resources Vocabulary.doc', 'stkfupm-104715-1-Water Resources Vocabulary.doc', r'^Water Resources Vocabulary\.doc'),
                          ('CO2 Capture and Storage - Vocab Quiz.doc', 'stkfupm-104715-16-CO2 Capture and Storage - Vocab Quiz.doc', None),
                          ('Biodiversity Comp 1.doc', 'stkfupm-104715-21-Biodiversity Comp 1.doc', None),
                          ('Facts on Biodiversity Vocab Quiz.doc', 'stkfupm-104715-21-Facts on Biodiversity Vocab Quiz.doc', None),
                          ('Agriculture and Development Vocab Quiz.doc', 'stkfupm-104715-26-Agriculture and Development Vocab Quiz.doc', None)]),
                                      # Ca2oom (2011): حلولُ كويزات الريدنق والفوكاب كلُّها (رفعها على أربع دفعات)
    ('srcP', 104715, 29, [('4th Agriculture and Development Comp 1.doc', 'stkfupm-104715-29-4th Agriculture and Development Comp 1.doc', r'^4th Agriculture and Development Comp 1\.doc')]),       # user4591 (2011): حلُّ 4th Agriculture and Development Comp 1
    ('srcP', 114904, 1,  [('Midterm English 101 term 111.zip', 'stkfupm-114904-3-Midterm English 101 term 111.zip', None)]),
                                      # user7909 (2011): نبذةُ الميدترم وملفُّه
    ('srcP', 141082, 2,  [('101-RQ2txt.pdf', 'stkfupm-141082-2-101-RQ2txt.pdf', r'^101-RQ2txt')]),       # 7_M_o_o_D (2013): نصوصُ Reading Quiz 2
  ],
  'FIN 250': [
    ('srcU', 107073, 17, []),    # abo.saud (2012): الآلةُ الحاسبةُ الماليّة ولمَ تغنيك
    ('srcU', 180463, 3,  [('Fin 250 Syllabus 182 Section 01 - Hesham.docx',
                           'fin250/Fin 250 Syllabus 182 Section 01 - Hesham.docx', None)],
     (r'^FIN250-182', 2)),       # _182 (2019): «مرفق مع الرد منهج المادة» — سطراه وملفُّه، لا تقييمُه للدكتور
    ('srcP', 128803, 8,  []),    # aziz33 (2014): التيست بانك مراجعةٌ لا بديلٌ عن الكتاب
  ],
}

# ===== توزيعُ الدرجات و«المواضيع» =====
# بندان بياناتُهما أرقامٌ وقوائمُ لا نصّ، فتُنقل كما ذكرها كاتبُها بألفاظه — لا تُستنتج.
# ‏‎grade‎: ‎[(اسمُ البند, النسبة)]‎ · ‏‎lessons‎: ‎[اسمُ الموضوع]‎ أو ‎(نمطُ أوّلِ سطر, عددُ الأسطر)‎ من نصّه
PICK_DATA = {
  'FIN 250': [
    ('grade',   180463, 3,   [('First Major Exam', 20), ('Second Major Exam', 25), ('Quizzes (6)', 15),
                              ('Homework (MyFinanceLab)', 5), ('Final Examination (Comprehensive)', 35)]),  # سيلابس 182 (ملفُّه في مصادر الفهم)
    ('grade',   98270,  6,   [('10 كويزات وهومورك', 10), ('ميدتيرم', 45), ('فاينل', 45)]),               # HARD-WORKER (161)
    ('lessons', 121018, 4,   (r'^The Role of Managerial Finance', 12)),                                  # user9840 (2018): الشباتر
  ],
  'IAS 111': [
    ('grade',   113042, 1,   [('الامتحان الأول', 20), ('الامتحان الثاني', 25), ('الامتحان النهائي', 35),
                              ('الأعمال الفصلية', 20)]),                     # سيلابس 121 (ملفُّه في مصادر الفهم)
    ('grade',   68638,  108, [('ميدتيرم', 30), ('فاينال', 40), ('بيد الدكتور', 30)]),   # fay16 (151)
    ('lessons', 100900, 2,   (r'^دلائل وجود الله', 12)),                     # AlRoosi (2011): المواضيع بصفحاتها
    ('lessons', 113042, 1,   ['مقدمة حول أهمية المقرر وأهداف تدريسها',
                              'أركان الإيمان: الإيمان بالله - أدلة وجود الله: دليل الفطرة، دليل الهداية، دليل الإتقان، دليل البحث العلمي 15-34',
                              'منهج القرآن في إثبات حقيقة وجود الله - فضائل التوحيد وأهميته 35-46',
                              'أنواع التوحيد ونواقضه 47-68',
                              'الإيمان بالملائكة عليهم السلام 70-78',
                              'الإيمان بالكتب السماوية 80-98',
                              'الإيمان بالرسل 100-122',
                              'الإيمان باليوم الآخر 125-138',
                              'الإيمان بقضاء الله وقدره 140-162',
                              'ثمرات الإيمان الاجتماعية: الإيمان وحماية الأمن والأوطان، الإيمان والوقاية من الخمور والمخدرات 301-353']),
  ],
  'ENGL 101': [
    ('grade',   120478, 5,   [('REFLECTIONS ON ENGLISH LEARNING', 5), ('VOCABULARY QUIZZES', 5), ('READING TESTS', 10),
                              ('WRITING TASKS', 40), ('ORAL PRESENTATIONS', 10), ('MIDTERM EXAMINATION', 15),
                              ('FINAL EXAMINATION', 15)]),                    # ISEngineer210: مكوّناتُ المقرّر ترم 112
  ],
}

# ===== الدكاترة =====
# الدكتورُ نفسُه ليس مساهمةً: يُعرَّف في صفّه (‎n‎ = اسمه) بمعرّفٍ ثابت، فتجتمع تحته
# صفوفُ كلّ من كتب عنه. والاسمُ بصيغة قائمة أكاديميا (‎Dr. …‎).
DOCTORS = {
  'stk-dr-mirghani': 'Dr. Mirghani Ahmed',
  'stk-dr-madani':   'Dr. Haider Husain Madani',
  'stk-dr-alharbi':  'Dr. Abdullah D. Alharbi',
  'stk-dr-amr':      'Dr. M. Amr',
  'stk-dr-alhazmi':  'Dr. Muhammad Alhazmi',
  'stk-dr-nainar':   'Dr. S M Khalid Nainar',
  'stk-dr-kurdi':    'Dr. Ammr Kurdi',
  # ‏‎IAS 111‎ — بأسماء قائمة المادّة العربيّة (‎د. …‎)
  'stk-dr-abusaqr':  'د. عبدالعزيز أبو صقر',
  'stk-dr-abri':     'د. خالد العبري',
  'stk-dr-suliman':  'أ. خالد آل سليمان',
  'stk-dr-hawsawi':  'د. عبدالرحمن هوساوي',
  'stk-dr-qahtani':  'د. سعيد القحطاني',
  'stk-dr-dakheel':  'د. سلمان الدخيل',
  'stk-dr-shalhoub': 'د. صلاح الشلهوب',
  'stk-dr-sulami':   'د. موسى السلمي',
  # ‏‎ENGL 101‎ — مدرّسو قسم الإنجليزي بأسماء صفحاتهم (والمعرّفُ رقمُ صفحته في الموقع القديم)
  'stk-dr-en68428': 'Mr. Paul Nicholas',
  'stk-dr-en68435': 'Mr. Ahmed Daud Ismail',
  'stk-dr-en68438': 'Mr. Christopher Morris',
  'stk-dr-en68439': 'Mr. Anthony Donovan',
  'stk-dr-en68440': 'Mr. Roger Horn',
  'stk-dr-en68441': 'Mr. Timothy Nelson',
  'stk-dr-en68442': 'Mr. Kevan Moore',
  'stk-dr-en68443': 'Mr. John Williams',
  'stk-dr-en68444': 'Mr. Jeffrey Jameson',
  'stk-dr-en68447': 'Mr. Thomas Telfer',
  'stk-dr-en68495': 'Mr. Ralph Kraft',
  'stk-dr-en68516': 'Mr. Dana Ebbett',
  'stk-dr-en68556': 'Mr. John Carey',
  'stk-dr-en68614': 'Mr. Ian Davison',
  'stk-dr-en69101': 'Mr. Anthony Gibson',
  'stk-dr-en74185': 'Mr. Savino Sfregola',
  'stk-dr-en76546': 'Mr. Josh Billam',
  'stk-dr-en92113': 'Mr. Michael Hartley',
  'stk-dr-en94806': 'Mr. Jonathan Marquis',
  'stk-dr-en94986': 'Mr. Tom Daly',
  'stk-dr-en96633': 'Mr. Lance King',
  'stk-dr-en118628': 'Mr. Gordon Blazenko',
  'stk-dr-en118979': 'Mr. Michael Stowe',
  # ‏‎FIN 250‎ (و‎FIN 301‎ قبلها) — بأسماء صفحاتهم في الموقع القديم
  'stk-dr-alnaeem':   'Dr. Ibrahim Al-Naeem',
  'stk-dr-khalifa':   'Dr. Ahmed Khalifa',
  'stk-dr-musa':      'Dr. Mohammed Musa',
  'stk-dr-jyousif':   'Mr. Jassim Yousif',
  'stk-dr-qidong':    'Dr. Qi Dong',
  'stk-dr-alelg':     'Dr. Ali Habib Al-Elg',
  'stk-dr-albinali':  'Dr. Khaled M. Albinali',
  'stk-dr-alotaibi':  'Dr. Khaled Al-Otaibi',
  'stk-dr-merdad':    'Dr. Hesham Merdad',
  # ومن كان في قائمة المادّة قبل النقل يُلحَق بصفّه هو (معرّفُه واسمُه هناك) لا يُكرَّر
  'p8mupxfw8a79m':    'Mansour Alsahlawi',
}
# code ⇐ [(topic id, post_number, doctor id)] — تقييماتُ هذه المادّة وحدَها.
# والردُّ الذي لا يقيّم («القريد هذا قريدك؟») لا يُنقل، ولا تقييمُ مادّةٍ أخرى.
PICK_DOC = {
  'FIN 250': [
    # ‏‎FIN 301‎ (2011–2012) — المادّةُ نفسُها باسمها القديم
    (107073, 5, 'stk-dr-alnaeem'), (107073, 7, 'stk-dr-alnaeem'), (107073, 11, 'stk-dr-alnaeem'),
    (107073, 18, 'stk-dr-alnaeem'),                         # يقارنه بالموسى، في صفحته
    (99893, 9, 'stk-dr-khalifa'),
    # ‏‎FIN 250‎
    (142602, 2, 'stk-dr-khalifa'), (142602, 5, 'stk-dr-khalifa'),   # صيف 2012/2013: «خذها مع احمد خليفة»
    (139690, 2, 'stk-dr-musa'),
    (148047, 7, 'stk-dr-jyousif'),
    (172767, 2, 'stk-dr-qidong'),                           # ويذكر العلق في سطرٍ بعده
    (98255, 9, 'stk-dr-alelg'), (98255, 10, 'stk-dr-alelg'), (98255, 11, 'stk-dr-alelg'),
    (98270, 6, 'stk-dr-albinali'), (98270, 9, 'stk-dr-albinali'),
    (178388, 2, 'stk-dr-alotaibi'), (178388, 5, 'stk-dr-alotaibi'), (178388, 6, 'stk-dr-alotaibi'),
    (180463, 2, 'stk-dr-merdad'), (180463, 3, 'stk-dr-merdad'),
    (182901, 5, 'p8mupxfw8a79m'),                          # منصور السهلاوي — صفُّه الموجود في المادّة
  ],
  'ACCT 210': [
    (98438, 12, 'stk-dr-mirghani'), (98438, 22, 'stk-dr-mirghani'), (98438, 23, 'stk-dr-mirghani'),
    (98438, 24, 'stk-dr-mirghani'), (98438, 25, 'stk-dr-mirghani'), (98438, 26, 'stk-dr-mirghani'),
    (98438, 27, 'stk-dr-mirghani'),
    (98443, 11, 'stk-dr-madani'), (98443, 12, 'stk-dr-madani'), (98443, 16, 'stk-dr-madani'),
    (98443, 17, 'stk-dr-madani'), (98443, 18, 'stk-dr-madani'), (98443, 19, 'stk-dr-madani'),
    (98443, 20, 'stk-dr-madani'), (98443, 21, 'stk-dr-madani'), (98443, 22, 'stk-dr-madani'),
    (98443, 25, 'stk-dr-madani'),
    (98423, 13, 'stk-dr-alharbi'), (98423, 14, 'stk-dr-alharbi'), (98423, 17, 'stk-dr-alharbi'),
    (98423, 18, 'stk-dr-alharbi'),
    (98439, 40, 'stk-dr-amr'), (98439, 41, 'stk-dr-amr'),
    (98415, 11, 'stk-dr-alhazmi'),
    (177580, 2, 'stk-dr-nainar'), (177580, 3, 'stk-dr-nainar'), (177580, 5, 'stk-dr-nainar'),
    (177580, 6, 'stk-dr-nainar'), (177580, 7, 'stk-dr-nainar'),
    # موضوعُ «ميرغني ولا حيدر مدني (اكاونتنق 210)»: الجوابان اللذان يقيّمان
    (124547, 2, 'stk-dr-mirghani'), (124547, 6, 'stk-dr-mirghani'),
    # ‏‎ACCT 202‎ — المادّةُ نفسُها باسمها القديم
    (98438, 4, 'stk-dr-mirghani'), (56719, 4, 'stk-dr-mirghani'),
    (98443, 10, 'stk-dr-madani'),
    (99892, 10, 'stk-dr-kurdi'), (99531, 3, 'stk-dr-kurdi'),
  ],
  'IAS 111': [
    # abusaqr
    (34805, 20, 'stk-dr-abusaqr'), (68638, 3, 'stk-dr-abusaqr'), (68638, 7, 'stk-dr-abusaqr'), (68638, 11, 'stk-dr-abusaqr'), (68638, 45, 'stk-dr-abusaqr'), (68638, 76, 'stk-dr-abusaqr'), (68638, 78, 'stk-dr-abusaqr'), (68638, 80, 'stk-dr-abusaqr'), (68638, 83, 'stk-dr-abusaqr'), (68638, 90, 'stk-dr-abusaqr'), (68638, 96, 'stk-dr-abusaqr'), (68638, 101, 'stk-dr-abusaqr'), (68638, 102, 'stk-dr-abusaqr'), (68638, 107, 'stk-dr-abusaqr'), (68638, 108, 'stk-dr-abusaqr'), (68638, 110, 'stk-dr-abusaqr'), (68638, 111, 'stk-dr-abusaqr'), (68638, 112, 'stk-dr-abusaqr'),
    # abri
    (34805, 33, 'stk-dr-abri'), (34805, 128, 'stk-dr-abri'), (68615, 27, 'stk-dr-abri'), (68615, 28, 'stk-dr-abri'), (68615, 31, 'stk-dr-abri'), (68615, 32, 'stk-dr-abri'), (68615, 33, 'stk-dr-abri'), (68615, 37, 'stk-dr-abri'), (68615, 40, 'stk-dr-abri'), (68615, 41, 'stk-dr-abri'), (68615, 42, 'stk-dr-abri'), (68615, 43, 'stk-dr-abri'), (68615, 44, 'stk-dr-abri'), (68615, 45, 'stk-dr-abri'),
    # suliman
    (34805, 167, 'stk-dr-suliman'), (34805, 195, 'stk-dr-suliman'), (68637, 7, 'stk-dr-suliman'), (68637, 48, 'stk-dr-suliman'), (68637, 57, 'stk-dr-suliman'), (96004, 5, 'stk-dr-suliman'), (99182, 2, 'stk-dr-suliman'), (99182, 4, 'stk-dr-suliman'), (99182, 6, 'stk-dr-suliman'), (99182, 8, 'stk-dr-suliman'),
    # hawsawi
    (68626, 25, 'stk-dr-hawsawi'), (68626, 35, 'stk-dr-hawsawi'),
    # qahtani
    (68630, 2, 'stk-dr-qahtani'), (68630, 10, 'stk-dr-qahtani'), (68630, 45, 'stk-dr-qahtani'), (68630, 46, 'stk-dr-qahtani'), (68630, 49, 'stk-dr-qahtani'), (68630, 54, 'stk-dr-qahtani'), (68630, 55, 'stk-dr-qahtani'), (68630, 56, 'stk-dr-qahtani'), (68630, 57, 'stk-dr-qahtani'),
    # dakheel
    (68634, 5, 'stk-dr-dakheel'), (68634, 10, 'stk-dr-dakheel'),
    # shalhoub
    (68635, 3, 'stk-dr-shalhoub'),
    # sulami
    (83818, 13, 'stk-dr-sulami'), (83818, 24, 'stk-dr-sulami'), (83818, 29, 'stk-dr-sulami'), (83818, 30, 'stk-dr-sulami'), (83818, 36, 'stk-dr-sulami'), (83818, 37, 'stk-dr-sulami'), (83818, 38, 'stk-dr-sulami'), (83818, 44, 'stk-dr-sulami'), (83818, 46, 'stk-dr-sulami'), (83818, 47, 'stk-dr-sulami'), (83818, 48, 'stk-dr-sulami'), (83818, 49, 'stk-dr-sulami'), (83818, 50, 'stk-dr-sulami'), (83818, 51, 'stk-dr-sulami'), (83818, 52, 'stk-dr-sulami'), (83818, 54, 'stk-dr-sulami'), (83818, 55, 'stk-dr-sulami'), (83818, 57, 'stk-dr-sulami'), (83818, 58, 'stk-dr-sulami'), (83818, 59, 'stk-dr-sulami'), (83818, 60, 'stk-dr-sulami'), (83818, 65, 'stk-dr-sulami'), (83818, 68, 'stk-dr-sulami'), (83818, 69, 'stk-dr-sulami'), (83818, 70, 'stk-dr-sulami'),
  ],
  'ENGL 101': [
    (68428, 16, 'stk-dr-en68428'), (68428, 50, 'stk-dr-en68428'), (68428, 55, 'stk-dr-en68428'),
    (68435, 4, 'stk-dr-en68435'), (68435, 25, 'stk-dr-en68435'), (68435, 31, 'stk-dr-en68435'), (68435, 35, 'stk-dr-en68435'), (68435, 48, 'stk-dr-en68435'), (68435, 49, 'stk-dr-en68435'), (68435, 51, 'stk-dr-en68435'),
    (68438, 3, 'stk-dr-en68438'), (68438, 13, 'stk-dr-en68438'), (68438, 27, 'stk-dr-en68438'), (68438, 28, 'stk-dr-en68438'), (68438, 38, 'stk-dr-en68438'),
    (68439, 3, 'stk-dr-en68439'), (68439, 9, 'stk-dr-en68439'), (68439, 10, 'stk-dr-en68439'), (68439, 11, 'stk-dr-en68439'), (68439, 13, 'stk-dr-en68439'), (68439, 34, 'stk-dr-en68439'), (68439, 35, 'stk-dr-en68439'), (68439, 36, 'stk-dr-en68439'), (68439, 40, 'stk-dr-en68439'), (68439, 46, 'stk-dr-en68439'), (68439, 47, 'stk-dr-en68439'), (68439, 48, 'stk-dr-en68439'), (68439, 58, 'stk-dr-en68439'),
    (68440, 5, 'stk-dr-en68440'), (68440, 11, 'stk-dr-en68440'), (68440, 17, 'stk-dr-en68440'), (68440, 21, 'stk-dr-en68440'), (68440, 22, 'stk-dr-en68440'), (68440, 24, 'stk-dr-en68440'), (68440, 27, 'stk-dr-en68440'), (68440, 29, 'stk-dr-en68440'), (68440, 47, 'stk-dr-en68440'),
    (68441, 22, 'stk-dr-en68441'), (68441, 28, 'stk-dr-en68441'), (68441, 30, 'stk-dr-en68441'), (68441, 31, 'stk-dr-en68441'), (68441, 38, 'stk-dr-en68441'), (68441, 39, 'stk-dr-en68441'),
    (68442, 11, 'stk-dr-en68442'), (68442, 16, 'stk-dr-en68442'), (68442, 17, 'stk-dr-en68442'), (68442, 23, 'stk-dr-en68442'), (68442, 30, 'stk-dr-en68442'),
    (68443, 11, 'stk-dr-en68443'), (68443, 30, 'stk-dr-en68443'), (68443, 34, 'stk-dr-en68443'), (68443, 35, 'stk-dr-en68443'),
    (68444, 10, 'stk-dr-en68444'), (68444, 46, 'stk-dr-en68444'), (68444, 87, 'stk-dr-en68444'), (68444, 89, 'stk-dr-en68444'),
    (68447, 7, 'stk-dr-en68447'), (68447, 8, 'stk-dr-en68447'), (68447, 25, 'stk-dr-en68447'), (68447, 41, 'stk-dr-en68447'), (68447, 52, 'stk-dr-en68447'), (68447, 53, 'stk-dr-en68447'), (68447, 61, 'stk-dr-en68447'),
    (68495, 4, 'stk-dr-en68495'), (68495, 5, 'stk-dr-en68495'), (68495, 27, 'stk-dr-en68495'), (68495, 35, 'stk-dr-en68495'),
    (68516, 16, 'stk-dr-en68516'), (68516, 18, 'stk-dr-en68516'), (68516, 20, 'stk-dr-en68516'),
    (68556, 23, 'stk-dr-en68556'),
    (68614, 53, 'stk-dr-en68614'), (68614, 59, 'stk-dr-en68614'), (68614, 60, 'stk-dr-en68614'), (68614, 63, 'stk-dr-en68614'), (68614, 64, 'stk-dr-en68614'),
    (69101, 47, 'stk-dr-en69101'), (69101, 50, 'stk-dr-en69101'), (69101, 52, 'stk-dr-en69101'), (69101, 53, 'stk-dr-en69101'),
    (74185, 6, 'stk-dr-en74185'), (74185, 9, 'stk-dr-en74185'), (74185, 49, 'stk-dr-en74185'), (74185, 74, 'stk-dr-en74185'),
    (76546, 24, 'stk-dr-en76546'), (76546, 39, 'stk-dr-en76546'), (76546, 68, 'stk-dr-en76546'), (76546, 97, 'stk-dr-en76546'), (76546, 100, 'stk-dr-en76546'),
    (92113, 10, 'stk-dr-en92113'), (92113, 14, 'stk-dr-en92113'), (92113, 57, 'stk-dr-en92113'), (92113, 68, 'stk-dr-en92113'), (92113, 73, 'stk-dr-en92113'),
    (94806, 23, 'stk-dr-en94806'), (94806, 24, 'stk-dr-en94806'), (94806, 28, 'stk-dr-en94806'), (94806, 29, 'stk-dr-en94806'), (94806, 30, 'stk-dr-en94806'), (94806, 31, 'stk-dr-en94806'), (94806, 34, 'stk-dr-en94806'),
    (94986, 16, 'stk-dr-en94986'), (94986, 27, 'stk-dr-en94986'), (94986, 32, 'stk-dr-en94986'), (94986, 34, 'stk-dr-en94986'), (94986, 37, 'stk-dr-en94986'), (94986, 42, 'stk-dr-en94986'), (94986, 44, 'stk-dr-en94986'), (94986, 46, 'stk-dr-en94986'),
    (96633, 31, 'stk-dr-en96633'), (96633, 41, 'stk-dr-en96633'), (96633, 48, 'stk-dr-en96633'), (96633, 52, 'stk-dr-en96633'), (96633, 59, 'stk-dr-en96633'), (96633, 61, 'stk-dr-en96633'),
    (118628, 14, 'stk-dr-en118628'), (118628, 16, 'stk-dr-en118628'), (118628, 21, 'stk-dr-en118628'), (118628, 28, 'stk-dr-en118628'), (118628, 31, 'stk-dr-en118628'), (118628, 35, 'stk-dr-en118628'), (118628, 38, 'stk-dr-en118628'), (118628, 39, 'stk-dr-en118628'),
    (118979, 14, 'stk-dr-en118979'), (118979, 24, 'stk-dr-en118979'), (118979, 27, 'stk-dr-en118979'), (118979, 28, 'stk-dr-en118979'),
  ],
}

EMOJI = {'slight_smile': '🙂', 'smile': '😄', 'smiley': '😃', 'grinning': '😀', 'laughing': '😆',
         'joy': '😂', 'wink': '😉', 'blush': '😊', 'angry': '😠', 'rage': '😡', 'sob': '😭',
         'cry': '😢', 'confused': '😕', 'pensive': '😔', 'disappointed': '😞', 'neutral_face': '😐',
         'sweat_smile': '😅', 'thinking': '🤔', 'heart': '❤️', 'thumbsup': '👍', '+1': '👍',
         'rofl': '🤣', 'roll_eyes': '🙄', 'stuck_out_tongue': '😛', 'sunglasses': '😎',
         'flushed': '😳', 'scream': '😱', 'innocent': '😇', 'unamused': '😒', 'expressionless': '😑',
         'frowning': '😦', 'arrow_down': '⬇️', 'grin': '😁', 'rose': '🌹', 'eyes': '👀',
         'point_up': '☝️', 'crazy_face': '🤪', 'cowboy_hat_face': '🤠',
         'person_with_crown': '🤴', 'hibiscus': '🌺', 'smiling_face_with_three_hearts': '🥰',
         'astonished': '😲', 'thumbsdown': '👎', '-1': '👎', 'clap': '👏',
         'boxing_glove': '🥊', 'nerd_face': '🤓', 'face_with_rolling_eyes': '🙄', 'smoking': '🚬',
         'smirk': '😏', 'heart_eyes': '😍', 'wave': '👋',
         'confused-11': '😕'}   # ‏‎confused-11‎ رمزُ منتدى vBulletin القديم، بقي نصًّا في ديسكورس

def emoji_of(tag):
    m = re.search(r'title=":([^":]+):"', tag)
    if not m: return ''
    return EMOJI.get(m.group(1), ':' + m.group(1) + ':')

def text_of(cooked):
    """HTML ديسكورس ⇐ نصٌّ عاديّ (حقل ‎desc‎ نصٌّ يُهرَّب ويُعرض pre-wrap).

    ===== وبأسلوب كاتبه لا بأسلوبنا =====
    لا يُضاف حرفٌ ليس منه: لا شرطةٌ ولا نقطةٌ ولا تنسيق. فسطرُه (‎<br>‎) سطر،
    وفقرتُه (‎</p>‎) فراغٌ بين فقرتين — كما قسّمها هو. ولا يُحذف إلّا ما ليس
    كلامَه: الاقتباسُ من غيره، وأسطرُ HTML الخام."""
    t = re.sub(r'<aside class="quote[^"]*".*?</aside>', '', cooked, flags=re.S)   # الاقتباسُ ليس كلامَه
    # والوجهُ التعبيريُّ وجهُه: صورةُ ديسكورس تعود حرفَها كما كتبه
    t = re.sub(r'<img[^>]*class="emoji[^"]*"[^>]*>', lambda m: emoji_of(m.group(0)), t)
    t = t.replace('\n', '')                                  # أسطرُ HTML الخام ليست أسطرَه
    t = re.sub(r'<br\s*/?>', '\n', t)
    t = re.sub(r'</(p|div|h\d|blockquote)>', '\n\n', t)
    t = re.sub(r'</li>', '\n', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = re.sub(r'\[attach\][^\[]*\[/attach\]', '', t)      # مرفقُ vBulletin الميّت: وسمٌ لا كلام
    t = H.unescape(t).replace('\u00a0', ' ')
    # ورمزٌ بقي نصًّا (‎:clap:‎) هو وجهٌ لم يُرسم — يُرسم إن عُرف، ويبقى كما هو إن لم يُعرف
    t = re.sub(r':([a-z_+\-0-9]+):', lambda m: EMOJI.get(m.group(1), m.group(0)), t)
    t = '\n'.join(re.sub(r'[ \t]+', ' ', l).strip() for l in t.split('\n'))
    return re.sub(r'\n{3,}', '\n\n', t).strip()

# سطرُ مرفقٍ في ديسكورس: «اسمُ الملف (12 KB)» أو «صورة.png589×515 13.7 KB»
ATT_LINE = re.compile(r'^\S.*\.(zip|rar|xls|xlsx|doc|docx|pdf|ppt|pptx|pps|png|jpe?g|gif)(\s*\([\d.]+\s*[KM]B\)|\d+×\d+\s+[\d.]+\s*[KM]B)$', re.I)

def strip_att(t):
    """في نصٍّ لا ملفَّ معه (التجربة والتقييم) يُحذف سطرُ المرفق: يُشير إلى ملفٍّ لم يُنقل —
    وقد يكون ملفَّ درجاتٍ تُرك عمدًا. وفي المصادر يحلّ الملفُّ نفسُه محلَّ سطره."""
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(l for l in t.split('\n') if not ATT_LINE.match(l.strip()))).strip()

def avatar(tpl):
    return BASE + tpl.replace('{size}', '144') if tpl.startswith('/') else tpl

def ms(iso):
    return int(datetime.fromisoformat(iso.replace('Z', '+00:00')).timestamp() * 1000)

def q(s):
    return "'" + str(s).replace("'", "''") + "'"

def load_post(src, cache, tid, num):
    """‏‎src‎ مجلّدٌ أو أكثر بينها ‎os.pathsep‎ — يُؤخذ الموضوعُ من أوّل مجلّدٍ فيه."""
    if tid not in cache:
        for d in src.split(os.pathsep):
            f = os.path.join(d, '%d.json' % tid)
            if os.path.exists(f):
                cache[tid] = json.load(open(f, encoding='utf-8'))
                break
        else:
            sys.exit('الموضوع %d ليس في %s' % (tid, src))
    t = cache[tid]
    return t, next(x for x in t['post_stream']['posts'] if x['post_number'] == num)

def author(users, p):
    un = p['username']
    uid = 'stk-' + un.lower()
    users[uid] = {'id': uid, 'name': p.get('name') or un, 'img': avatar(p['avatar_template']),
                  'email': un.lower() + '@import.stkfupm.invalid', 'user': un}
    return uid

def imp_of(t, p):
    return {'src': 'stkfupm', 'url': '%s/t/%s/%d/%d' % (BASE, t['slug'], t['id'], p['post_number']),
            'user': p['username'], 'ts': ms(p['created_at']), 'tid': t['id'], 'pn': p['post_number']}

def main(src):
    os.makedirs(OUT, exist_ok=True)
    cache = {}
    for code in sorted(set(PICK) | set(PICK_DOC) | set(PICK_SRC) | set(PICK_DATA)):
        users, posts, media = {}, [], {}
        # ---- «المادة»: مساهمةٌ لكلّ مشاركة
        for tid, num, book, keep in PICK.get(code, []):
            t, p = load_post(src, cache, tid, num)
            uid = author(users, p)
            imp = imp_of(t, p)
            desc = strip_att(text_of(p['cooked']))
            if keep:
                ls = desc.split('\n')
                i = next(k for k, l in enumerate(ls) if re.search(keep[0], l, re.I))
                desc = '\n'.join(ls[i:i + keep[1]])
            data = {'desc': desc, 'type': '', 'rel': 0, 'lang': '', 'book': book, 'imp': imp}
            posts.append({'id': 'stk-p%d' % p['id'], 'uid': uid, 'code': code, 'sec': 'info',
                          'ts': imp['ts'], 'st': 'pub', 'data': data})
        # ---- «المصادر»: نصُّ الكاتب أسطرًا، وملفُّه في موضع مرفقه
        for ent in PICK_SRC.get(code, []):
            sec, tid, num, files = ent[:4]
            keep = ent[4] if len(ent) > 4 else None
            t, p = load_post(src, cache, tid, num)
            uid = author(users, p)
            imp = imp_of(t, p)
            lines = text_of(p['cooked']).split('\n')
            if keep:
                i = next(k for k, l in enumerate(lines) if re.search(keep[0], l, re.I))
                lines = lines[i:i + keep[1]]
            html, fobj = [], {}
            for line in lines:
                # ‏وكلُّ ملفٍّ يحلّ محلَّ سطرٍ واحد: سطرُ نصٍّ يشبه اسمَه لا يأخذه مرّةً ثانية
                used = {v['name'] for v in fobj.values()}
                hit = next((f for f in files if f[2] and f[0] not in used and re.search(f[2], line)), None)
                if hit:
                    fid = 'stk-f%d-%d' % (p['id'], len(fobj))
                    raw = open(os.path.join(ROOT, 'files', hit[1]), 'rb').read()
                    mime = MIME.get(os.path.splitext(hit[0])[1].lower(), 'application/octet-stream')
                    if len(raw) <= INLINE_MAX:
                        v = 'data:%s;base64,%s' % (mime, base64.b64encode(raw).decode())
                    else:
                        # ===== والكبيرُ إلى جدول الوسائط =====
                        # متنُ المساهمة يُجذب مع كلّ فتحٍ للمادّة، فملفٌّ بمئات الكيلوهات فيه يُثقل
                        # على كلّ قارئ. فيُكتب في ‎media‎ بمفتاحه ‎sha256‎ (كما يرفع الموقعُ صورَه)،
                        # ويحمل المتنُ عنوانَه وحدَه
                        k = hashlib.sha256(raw).hexdigest()
                        media[k] = (mime, raw, uid)
                        v = MEDIA_URL + k
                    fobj[fid] = {'name': hit[0], 'v': v}
                    html.append('\u200b<span data-fid="%s" class="src-fchip" contenteditable="false"></span>\u200b' % fid)
                else:
                    html.append(H.escape(line, quote=False))
            # ‏ملفٌّ رفعه الكاتبُ نفسُه في ردٍّ آخر من الموضوع (نمطُه ‎None‎): يُلحق بآخر مساهمته
            for hit in [f for f in files if f[2] is None]:
                fid = 'stk-f%d-%d' % (p['id'], len(fobj))
                raw = open(os.path.join(ROOT, 'files', hit[1]), 'rb').read()
                mime = MIME.get(os.path.splitext(hit[0])[1].lower(), 'application/octet-stream')
                if len(raw) <= INLINE_MAX:
                    v = 'data:%s;base64,%s' % (mime, base64.b64encode(raw).decode())
                else:
                    k = hashlib.sha256(raw).hexdigest(); media[k] = (mime, raw, uid); v = MEDIA_URL + k
                fobj[fid] = {'name': hit[0], 'v': v}
                html.append('\u200b<span data-fid="%s" class="src-fchip" contenteditable="false"></span>\u200b' % fid)
            missing = [f[0] for f in files if not any(f[0] == v['name'] for v in fobj.values())]
            if missing: sys.exit('لم يُعثر على سطر المرفق %s في %d#%d' % (missing, tid, num))
            posts.append({'id': 'stk-p%d' % p['id'], 'uid': uid, 'code': code, 'sec': sec,
                          'ts': imp['ts'], 'st': 'pub',
                          'data': {'html': '<br>'.join(html), 'files': fobj, 'imp': imp}})
        # ---- «توزيع الدرجات» و«المواضيع»: بيانُ الكاتب بألفاظه
        for sec, tid, num, spec in PICK_DATA.get(code, []):
            t, p = load_post(src, cache, tid, num)
            uid = author(users, p)
            imp = imp_of(t, p)
            if sec == 'grade':
                data = {'method': 'avg', 'items': [{'name': n, 'pct': v} for n, v in spec], 'imp': imp}
            else:
                if isinstance(spec, tuple):
                    ls = text_of(p['cooked']).split('\n')
                    i = next(k for k, l in enumerate(ls) if re.search(spec[0], l))
                    names = [l for l in ls[i:i + spec[1]] if l.strip()]
                else:
                    names = spec
                data = {'items': [{'num': '', 'name': n} for n in names], 'imp': imp}
            posts.append({'id': 'stk-%s-p%d' % (sec, p['id']), 'uid': uid, 'code': code, 'sec': sec,
                          'ts': imp['ts'], 'st': 'pub', 'data': data})
        # ---- «الدكاترة»: مساهمةٌ واحدةٌ لكلّ كاتب (‎UNIQUE(uid, code, sec)‎)، وصفٌّ لكلّ دكتورٍ قيّمه
        rows = {}
        for tid, num, dr in PICK_DOC.get(code, []):
            t, p = load_post(src, cache, tid, num)
            uid = author(users, p)
            imp = imp_of(t, p)
            have = rows.setdefault(uid, [])
            if any(r['id'] == dr for r in have):
                sys.exit('%s كتب عن %s مرّتين في %s: صفٌّ واحدٌ للدكتور في المساهمة' % (uid, dr, code))
            have.append({'id': dr, 'n': DOCTORS[dr], 'en': '', 'img': '', 'e': '', 'bld': '', 'room': '',
                         'd': strip_att(text_of(p['cooked'])), 'hours': [], 'teach': 0, 'grade': 0,
                         'pid': 'stk-p%d' % p['id'], 'imp': imp})
        for uid, rs in rows.items():
            rs.sort(key=lambda r: r['imp']['ts'])
            posts.append({'id': 'stk-doc-%s-%s' % (uid[4:], code.replace(' ', '').lower()), 'uid': uid,
                          'code': code, 'sec': 'doc', 'ts': rs[0]['imp']['ts'], 'st': 'pub',
                          'data': {'docs': rs}})
        seen = {}
        for p in posts:
            k = (p['uid'], p['sec'])
            if k in seen: sys.exit('%s له مساهمتان في %s · %s: ‎UNIQUE(uid, code, sec)‎ يردّ الثانية (%s و %s)'
                                   % (p['uid'], code, p['sec'], seen[k], p['id']))
            seen[k] = p['id']
        slug = code.replace(' ', '')
        json.dump({'code': code, 'users': list(users.values()), 'posts': posts},
                  io.open(os.path.join(OUT, slug + '.json'), 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=2)
        now = int(datetime.now().timestamp())
        L = ['-- نقلٌ من مجتمع STKFUPM ⇐ أكاديميا · %s · ولَّده _import/stkfupm.py' % code,
             '-- يُعاد تشغيلُه بلا ضرر: ON CONFLICT يحدّث ولا يكرّر.', 'BEGIN;']
        for k, (mime, raw, uid) in media.items():
            L.append("INSERT INTO media (k, mime, size, bytes, uid, ts) VALUES (%s, %s, %d, decode(%s, 'base64'), 'u-academia', %d) "
                     "ON CONFLICT (k) DO NOTHING;" % (q(k), q(mime), len(raw), q(base64.b64encode(raw).decode()), now))
        for u in users.values():
            L.append("INSERT INTO users (id, email, name, img, pw_hash, pw_salt, pw_iter, verified, created, seen) "
                     "VALUES (%s, %s, %s, %s, '', '', 0, 0, %d, %d) "
                     "ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, img = EXCLUDED.img;"
                     % (q(u['id']), q(u['email']), q(u['name']), q(u['img']), now, now))
        for p in posts:
            L.append("INSERT INTO posts (id, uid, code, sec, data, ts, updated, st) "
                     "VALUES (%s, %s, %s, %s, %s, %d, %d, 'pub') "
                     "ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, ts = EXCLUDED.ts, updated = EXCLUDED.updated;"
                     % (q(p['id']), q(p['uid']), q(p['code']), q(p['sec']),
                        q(json.dumps(p['data'], ensure_ascii=False)), p['ts'], now))
        L.append('COMMIT;')
        io.open(os.path.join(OUT, slug + '.sql'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
        nd = sum(len(p['data'].get('docs', [])) for p in posts if p['sec'] == 'doc')
        print('%s: %d كاتبًا · %d مساهمة (منها %d تقييمَ دكتور) ⇐ _import/out/%s.{json,sql}'
              % (code, len(users), len(posts), nd, slug))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
