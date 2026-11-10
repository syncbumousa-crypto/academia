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
  # ‏‎ENGL 102‎ «مدخلٌ إلى كتابة التقارير» — اسمُها لم يتغيّر
  'ENGL 102': [
    (120479, 12, '', None), (120479, 13, '', None), (120479, 16, '', None),   # موضوعُ تقييم المقرّر
    (120479, 17, '', None), (120479, 19, '', None), (120479, 20, '', None),
    (120479, 21, '', None), (120479, 23, '', None), (120479, 24, '', None),
    (120479, 25, '', None), (120479, 26, '', None), (120479, 27, '', None),
    (120479, 28, '', None), (120479, 29, '', None),
    (120479, 10, '', None), (120479, 18, '', None), (120479, 22, '', None),   # ودرجاتُها في توزيع الدرجات
    (102863, 1,  '', (r'^انجلش 102', 31)),                    # student_NZ (2011): قسمُ 102 من شرحه للكورسات الثلاثة
    (152978, 1,  '', None),                                   # user9292 (2013): شرطُ أخذها في الصيف من البلاك بورد
    (144371, 7,  '', None),                                   # abdullah.d (2013): شكلُ الفاينل
  ],
  # ‏‎ENGL 214‎ «التواصل الأكاديمي والمهني» — اسمُها لم يتغيّر
  'ENGL 214': [
    (120480, 6,  '', None), (120480, 13, '', None), (120480, 14, '', None),   # موضوعُ تقييم المقرّر
    (120480, 15, '', None), (120480, 19, '', None), (120480, 20, '', None),
    (120480, 22, '', None), (120480, 23, '', None), (120480, 26, '', None),
    (102863, 1,  '', (r'^انجلش 214', 36)),                    # student_NZ (2011): قسمُ 214 من شرحه للكورسات الثلاثة
    (91933,  1,  '', None),                                   # user5216 (2010): شرطُ B في 102 لأخذها في الصيف
    (168904, 2,  '', None),                                   # Mahdi_Sahel (2015): شروطُ الصيف بعدها
    (162380, 5,  '', None),                                   # RockWentz (2014): الصيف، والموضوعُ وعلاقتُه بالتخصّص
    (173018, 11, '', None),                                   # salehmm (2016): أقسامُ الفاينل الكتابيّ الأربعة
    (136825, 2,  '', None),                                   # asem007 (2012): الفاينل 45 سؤالًا خيارات
    (154392, 2,  '', None),                                   # 3boody830 (2013): الفاينل ومواضيعه
    (117655, 3,  '', None),                                   # mu7md (2012): أنواعُ الرسائل في الفاينل
    (100996, 2,  '', None),                                   # AFLATOON (2011): رسالةُ شكوى وردُّها
  ],
  # ‏‎IAS 212‎ «الأخلاق المهنيّة» — بالرقم نفسه منذ 2008 (و‎IAS 211‎ في الخطط القديمة هي هي: «211 المفروض 212»)
  'IAS 212': [
    (120494, 3,  '', None), (120494, 7,  '', None), (120494, 8,  '', None),   # موضوعُ تقييم المقرّر
    (120494, 9,  '', None), (120494, 12, '', None), (120494, 14, '', None),
    (120494, 16, '', None), (120494, 18, '', None), (120494, 22, '', None),
    (120494, 23, '', None),
    (110802, 4,  '', None),                                   # mr-3b0d (2011): الفاينل أصعب من المياجر
    (89385,  4,  '', None),                                   # the_champion (2010): القريدات ستاندرد في مواد IAS
    (107153, 2,  '', None),                                   # The_Marvel (2011): ‏‎IAS 211‎ في الخطّة هي ‎IAS 212‎
  ],
  # ‏‎MATH 101‎ — من موضوع تقييم المقرّر: كلُّ ردٍّ فيه تجربة (لكلّ كاتبٍ أطولُ ردوده)
  'MATH 101': [
    (120611, 2, '', None), (120611, 3, '', None), (120611, 4, '', None), (120611, 5, '', None), (120611, 6, '', None), (120611, 7, '', None),
    (120611, 8, '', None), (120611, 10, '', None), (120611, 11, '', None), (120611, 13, '', None), (120611, 16, '', None), (120611, 17, '', None),
    (120611, 18, '', None), (120611, 26, '', None), (120611, 30, '', None), (120611, 33, '', None), (120611, 34, '', None), (120611, 38, '', None),
    (120611, 39, '', None), (120611, 40, '', None), (120611, 41, '', None), (120611, 42, '', None),
  ],
  # ‏‎MATH 102‎ — من موضوع تقييم المقرّر: كلُّ ردٍّ فيه تجربة (لكلّ كاتبٍ أطولُ ردوده)
  'MATH 102': [
    (120612, 2, '', None), (120612, 3, '', None), (120612, 4, '', None), (120612, 5, '', None), (120612, 6, '', None), (120612, 8, '', None),
    (120612, 9, '', None), (120612, 11, '', None), (120612, 12, '', None), (120612, 13, '', None), (120612, 20, '', None), (120612, 26, '', None),
    (120612, 28, '', None), (120612, 29, '', None), (120612, 30, '', None), (120612, 31, '', None), (120612, 32, '', None), (120612, 33, '', None),
    (120612, 34, '', None), (120612, 39, '', None), (120612, 40, '', None), (120612, 41, '', None), (120612, 43, '', None), (120612, 44, '', None),
    (120612, 45, '', None), (120612, 48, '', None), (120612, 49, '', None), (120612, 50, '', None), (120612, 52, '', None), (120612, 53, '', None),
    (120612, 54, '', None), (120612, 55, '', None), (120612, 56, '', None), (120612, 57, '', None), (120612, 58, '', None),
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
  'ENGL 102': [
    ('srcU', 102863, 2,  []),    # student_NZ (2011): كيف تكتب الفيرست درافت للريبورت
    ('srcU', 117638, 3,  []),    # user5571 (2012): وصفُ الفاينل من القسم (بارافريز وسمري)
    ('srcU', 108227, 3,  []),    # Abu_3zzoz (2011): وصفُ فاينل ترم 102
    ('srcU', 126436, 1,  []),    # sooonah (2012): خطواتُ السمري والبارافريز
    ('srcU', 128226, 8,  []),    # _SpEcIaL_OnE (2012): السورسات من مكتبة الجامعة أونلاين
    ('srcU', 172092, 3,  []),    # user10207 (2016): اختر موضوعًا يعجبك وابدأ بدري
    ('srcU', 172092, 5,  []),    # user9248 (2016): موضوعٌ له علاقةٌ بتخصّصك
    ('srcU', 123053, 4,  [('298667394001.doc', 'stkfupm-123053-4-298667394001.doc', r'^298667394001')]),   # user8554 (2012): مثالُ سورس إيفاليويشن كتبه
    ('srcU', 136288, 21, [('102-S.Eval.Sheet by typing.doc', 'stkfupm-136288-21-102-S.Eval.Sheet by typing.doc', r'^102-S\.Eval')]),   # user4492 (2012): ورقةُ السورس إيفاليويشن
    ('srcP', 108227, 2,  [('A Problem With Wind Power - summary practice.doc', 'stkfupm-108227-2-A Problem With Wind Power - summary practice.doc', r'^A%20Problem')]),   # user6095 (2011): تدريبُ سمري وبارافريز بنموذج حلّه (من كيفن مور)
    ('srcP', 108227, 6,  [('Final Exam.zip', 'stkfupm-108227-6-Final Exam.zip', r'^Final Exam\.zip')]),   # AlRoosi (2011): سلايدُ الفاينل من سكشن جوش بيلام
  ],
  'ENGL 214': [
    ('srcU', 123720, 2,  []),    # METALLIC (2012): اكتب الريبورت بنفسك، والبرنامجُ يكشف النقل
    ('srcU', 123720, 11, []),    # M_O_H_A_M_E_D (2012): كيف يعمل Turnitin في الويب سي تي
    ('srcU', 140186, 3,  []),    # Big_H (2013): اختر الموضوعَ مع مدرّسك في ساعاته المكتبيّة
    ('srcU', 128602, 2,  []),    # stu2009 (2012): أين تجد سورسات يقبلها المدرّس
    ('srcU', 117655, 19, []),    # user4325 (2012): موقعٌ يعلّمك أنواعَ الرسائل
    ('srcU', 173018, 4,  []),    # abo-da7m (2016): الكتاب وأمثلةُ أسئلة الفاينل
    ('srcP', 162403, 15, [('ENGL214 Final T133 FINAL VERSION NEW (3).docx', 'stkfupm-162403-15-ENGL214 Final T133 FINAL VERSION NEW (3).docx', r'^ENGL214 Final T133')]),   # CS_Scientist (2017): فاينل صيف 133
  ],
  'IAS 212': [
    ('srcU', 69958,  9,  [('الأخلاق المذمومة.doc', 'stkfupm-69958-9-الأخلاق المذمومة.doc', r'^الأخلاق المذمومة\.doc'),
                          ('الأخلاق المهنية في الأنظمة السعودية.doc', 'stkfupm-69958-9-الأخلاق المهنية في الأنظمة السعودية.doc', r'^الأخلاق المهنية في الأنظمة'),
                          ('المخالفات المهنية ووسائل التغلب عليها.doc', 'stkfupm-69958-9-المخالفات المهنية ووسائل التغلب عليها.doc', r'^المخالفات المهنية')]),   # user3270 (2009): ملخّصاتٌ أعطاه إيّاها الدكتور
    ('srcU', 104553, 1,  []),    # AFLATOON (2011): نوتةُ الميجر الأوّل وما فيها
    ('srcP', 118021, 1,  []),    # 27Mansour (2012): أسئلةُ الفاينلات السابقة بأجوبتها
    ('srcP', 146339, 2,  []),    # Guest (2013): أسئلةُ مراجعةٍ بأجوبتها
    ('srcP', 170592, 3,  []),    # F.TORRES (2015): الاختبارُ النصفيّ ترم 131
    ('srcP', 100780, 4,  []),    # user6441 (2011): فاينل 93 بأجوبته
    ('srcP', 100780, 22, [('فاينل 93.doc', 'stkfupm-100780-22-فاينل 93.doc', r'^فاينل 93\.doc')]),   # EvErEst (2011): فاينل 93 في ملفّ
    ('srcP', 100780, 35, [('ias 212 old exams.zip', 'stkfupm-100780-35-ias 212 old exams.zip', r'ias 212 old exams\.zip')]),   # equal (2011): اختباراتٌ قديمة من 072 إلى 093
    ('srcP', 100780, 51, [('أسئلة الاختبار النهائي.docx', 'stkfupm-100780-51-أسئلة الاختبار النهائي.docx', r'^أسئلة الاختبار النهائي')]),   # ME_I10 (2012): فاينل 103
    ('srcP', 97134,  5,  [('نموذج الاختبار.doc', 'stkfupm-97134-5-نموذج الاختبار ال.doc', r'^%d9%86')]),   # user6801 (2010): نموذجُ اختبار
  ],
  'MATH 101': [
    ('srcP', 117309, 5,  [('MATH101_092_FINAL_ANSERS.PDF', 'stkfupm-117309-5-MATH101_092_FINAL_ANSERS.PDF', r'^MATH101_092'),
                          ('Math101_093_Final _Solution.pdf', 'stkfupm-117309-5-Math101_093_Final _Solution.pdf', r'^Math101_093'),
                          ('MATH101_101_ FINAL_AnswerKey.pdf', 'stkfupm-117309-5-MATH101_101_ FINAL_AnswerKey.pdf', r'^MATH101_101'),
                          ('Math101_102_FINAL_Master.pdf', 'stkfupm-117309-5-Math101_102_FINAL_Master.pdf', r'^Math101_102')]),   # user7529 (2012): أربعةُ فاينلات بحلولها
    ('srcP', 87404,  2,  [('MATH 101Exam 2 (091) Solutions .pdf', 'stkfupm-87404-2-MATH 101Exam 2 (091) Solutions .pdf', r'\(091\)'),
                          ('MATH 101Exam 2 (083) Solutions .pdf', 'stkfupm-87404-2-MATH 101Exam 2 (083) Solutions .pdf', r'\(083\)'),
                          ('Math 101Exam 2(082) Solutions.pdf', 'stkfupm-87404-2-Math 101Exam 2(082) Solutions.pdf', r'\(082\)'),
                          ('MATH 101Exam 2 (081) Solutions .pdf', 'stkfupm-87404-2-MATH 101Exam 2 (081) Solutions .pdf', r'\(081\)')]),   # F5M (2010): الميجر الثاني من أربعة أترام بحلوله
    ('srcP', 86178,  3,  [('Math101_091_E1_Solution.pdf', 'stkfupm-86178-3-Math101_091_E1_Solution.pdf', r'^Math101_091')]),   # mr.wswas (2010): حلُّ الميجر الأوّل 091
    ('srcP', 128946, 1,  [('RelativeResourceManager.pdf', 'stkfupm-128946-1-RelativeResourceManager.pdf', r'^RelativeResourceManager')]),   # _j_h (2012): حلُّ الميجر الثاني
  ],
  'MATH 102': [
    ('srcU', 84623,  6,  [('Math102(092) Syllabus.pdf', 'stkfupm-84623-6-Math102(092) Syllabus.pdf', r'^Math102\(092\)')]),   # user4917 (2010): سيلابس 092
    ('srcP', 105713, 11, [('Math102_102_E1_Solution.pdf', 'stkfupm-105713-11-Math102_102_E1_Solution.pdf', r'^Math102_102')]),   # AlRoosi (2011): حلُّ الميجر الأوّل 102
    ('srcP', 107905, 4,  [('math 102 solved finals.zip', 'stkfupm-107905-4-math 102 solved finals.zip', r'^math 102 solved')]),   # equal (2011): فاينلات 071–073 محلولة
    ('srcP', 109590, 2,  [('math exam 1.zip', 'stkfupm-109590-2-math exam 1.zip', r'^math exam 1')]),   # Lord (2011): الميجر الأوّل من 081 إلى 101
    ('srcP', 126012, 1,  [('MATH102_112_Final_Master.pdf', 'stkfupm-126012-1-MATH102_112_Final_Master.pdf', r'^MATH102_112')]),   # Freezyknight (2012): فاينل 112
    ('srcP', 142854, 1,  [('RelativeResourceManager.pdf', 'stkfupm-142854-1-RelativeResourceManager.pdf', r'^RelativeResourceManager')]),   # Mysterious (2013): حلُّ الميجر الثاني
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
  'ENGL 102': [
    ('grade',   120479, 10,  [('ثلاثة ريدنق كوز', 15), ('ثلاثة رايتنق تاسك', 25), ('مدترم', 15), ('فاينل', 15),
                              ('شغل الريبورت توتال', 20), ('برزنتيشن', 10)]),             # alhakem (122)
    ('grade',   120479, 18,  [('3 كوزات ريدنق', 15), ('3 كوزات رايتنق', 30), ('ميدترم(ريدنق)', 10),
                              ('الريبورت', 20), ('برزنتيشن', 10), ('فاينل.(ريدنق)', 15)]),  # Medoalkebsi (2014)
    ('grade',   120479, 22,  [('Report', 20), ('Writing Tasks', 20), ('Midterm Exam', 15), ('RQs', 10),
                              ('Presentation', 10), ('FE', 25)]),                           # osamah56 (152)
  ],
  'ENGL 214': [
    ('grade',   120480, 13,  [('MAJOR REPORT', 30), ('RECRUITMENT', 15), ('CORRESPONDENCE', 10), ('PRESENTATIONS', 10),
                              ('MIDTERM EXAM', 15), ('FINAL EXAM', 10), ('Quizzes', 10)]),          # Medoalkebsi (132)
    ('grade',   120480, 20,  [('الريبورت', 35), ('المدترم', 15), ('المقابلات', 15), ('برزنتيشن', 10),
                              ('Correspondence letter', 10), ('فاينل', 15)]),                     # M_nd_m (161)
    ('grade',   120480, 26,  [('CV وApplication letter والمقابلة', 20), ('الريبورت', 35), ('برزنتيشن', 15),
                              ('المد', 15), ('الفاينل', 15)]),                                    # user11724 (201)
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
  # ‏‎ENGL 102‎ — ومن لم يكن في ‎ENGL 101‎ بأسماء صفحاتهم في الموقع القديم
  'stk-dr-en68613':  'Mr. Antonio Ellison',
  'stk-dr-en115421': 'Mr. Keith Pearson',
  'stk-dr-en179113': 'Mr. Jordan Hicks',
  'stk-dr-en182475': 'Mr. Christopher Bartle',
  'stk-dr-en183514': 'Mr. M. Aurelius',
  'stk-dr-en184166': 'Mr. Dragos Brad',
  # ‏‎IAS 212‎ و‎IAS 121‎ — بأسماء صفحاتهم، بصيغة قائمة المادّة العربيّة
  'stk-dr-mashookhi': 'د. عبدالله المشوخي',
  'stk-dr-sendi':     'د. حسن سندي',
  'stk-dr-humaidan':  'د. عصام الحميدان',
  'stk-dr-muzeini':   'د. خالد المزيني',
  'stk-dr-afzal':     'د. حافظ أفضل',
  'stk-dr-yzahrani':  'أ. يحيى الزهراني',
  'stk-dr-enaizan':   'د. أحمد العنيزان',
  'stk-dr-khushaim':  'د. فهد الخشيم الدوسري',
  'stk-dr-khaldi':    'د. عبدالرحمن الخالدي',
  'stk-dr-rharbi':    'د. راكان الحربي',
  'stk-dr-shebl':     'د. رامي الشبل',
  'stk-dr-aomar':     'د. أحمد العمر',
  'stk-dr-aibrahim':  'د. عبدالله إبراهيم',
  'stk-dr-jurayan':   'د. خالد الجريان',
  # ‏‎MATH 101‎ و‎MATH 102‎ — مدرّسو الماث بأسماء صفحاتهم (والمعرّفُ رقمُ صفحته)
  'stk-dr-m68361': 'Dr. Faisal Fairag',
  'stk-dr-m68367': 'Dr. A Boucherif',
  'stk-dr-m68372': 'Dr. Hattan Tawfiq',
  'stk-dr-m68373': 'Dr. Abdeslam Mimouni',
  'stk-dr-m68375': 'Dr. Abd-Ur-Rahim Khan',
  'stk-dr-m68381': 'Dr. Jaafar Al-Mutawa',
  'stk-dr-m68383': 'Dr. Khairul Saleh',
  'stk-dr-m68385': 'Dr. K Furati',
  'stk-dr-m68389': 'Dr. Marwan Al-Momani',
  'stk-dr-m68390': 'Dr. Ahmad Al-Dweik',
  'stk-dr-m68391': 'Dr. Halic M',
  'stk-dr-m68395': 'Dr. Mohammad Abu-Sbeih',
  'stk-dr-m68396': 'Dr. Suliman Al-Homaidan',
  'stk-dr-m68398': 'Dr. Mohammed Saleh',
  'stk-dr-m68400': 'Dr. Mohammed Salem Samman',
  'stk-dr-m68403': 'Dr. Mustapha Kassem',
  'stk-dr-m68405': 'Dr. Assane Lo',
  'stk-dr-m68406': 'Dr. Bader Al-Humidi',
  'stk-dr-m68408': 'Dr. Saeed Al-Garni',
  'stk-dr-m68411': 'Dr. Muhammad Bokhari',
  'stk-dr-m68412': 'Dr. Ahmed Shawky',
  'stk-dr-m68413': 'Dr. Naseer-Eddine Tatar',
  'stk-dr-m68419': 'Dr. E. Al-Sawi',
  'stk-dr-m68463': 'Dr. R. Anabosi',
  'stk-dr-m68467': 'Dr. Mahmoud Sarhan',
  'stk-dr-m68471': 'Dr. Yaqoub Shehadeh',
  'stk-dr-m68472': 'Dr. Stephen Binns',
  'stk-dr-m68474': 'Dr. Waleed Al-Sabah',
  'stk-dr-m68557': 'Dr. Bernard Kuowei Yu',
  'stk-dr-m68561': 'Dr. Abdulaziz Al-Assaf',
  'stk-dr-m68565': 'Dr. Muhammad Aslam Chaudhry',
  'stk-dr-m68568': 'Dr. Husain Al-Attas',
  'stk-dr-m68569': 'Dr. Ibrahim Al-Rasasi',
  'stk-dr-m68571': 'Dr. J Abuihlail',
  'stk-dr-m68577': 'Dr. Mohammad Omar',
  'stk-dr-m68579': 'Dr. Monther Alfuraidan',
  'stk-dr-m68582': 'Dr. Rajaie Alassar',
  'stk-dr-m68586': 'Dr. S Kabbaj',
  'stk-dr-m68677': 'Dr. M Al-Shahrani',
  'stk-dr-m68928': 'Dr. Izhar Ahmad',
  'stk-dr-m69347': 'Dr. I Louhichi',
  'stk-dr-m69876': 'Dr. Khalid Al-Shammari',
  'stk-dr-m70511': 'Dr. Ahmad Bonfoh',
  'stk-dr-m70785': 'Dr. S Boubaker',
  'stk-dr-m77387': 'Dr. Jarrar M S',
  'stk-dr-m78126': 'Dr. E Echi',
  'stk-dr-m78226': 'د. بارسا باختاري',
  'stk-dr-m81621': 'Dr. Slim Belhaiza',
  'stk-dr-m83632': 'Dr. Khalid Al-Anezy',
  'stk-dr-m83633': 'أ. أبالارا تيجاني',
  'stk-dr-m83634': 'Dr. Khalid Adarbeh',
  'stk-dr-m92906': 'Dr. Mohammad Kafini',
  'stk-dr-m94260': 'Dr. Ahmet Tatar',
  'stk-dr-m94261': 'Dr. Muhammad Islam Mustafa',
  'stk-dr-m94262': 'Dr. Ryad Ghanam',
  'stk-dr-m94443': 'Dr. Nadeem Malik',
  'stk-dr-m118561': 'Dr. Mohammad Algharabli',
  'stk-dr-m118562': 'Dr. Faez Al-Qarni',
  'stk-dr-m118563': 'Dr. Adel Khalfallah',
  'stk-dr-m118565': 'Dr. Abdulilah Kadri',
  'stk-dr-m118567': 'Dr. Hamza Hroub',
  'stk-dr-m118568': 'Dr. Ali Iftikhar',
  'stk-dr-m118569': 'Dr. Ahmad Ahmad',
  'stk-dr-m118571': 'Dr. Walid Sharabati',
  'stk-dr-m118572': 'Dr. Adel Moham Al-Mahdi',
  'stk-dr-m118573': 'Dr. Maher Nour',
  'stk-dr-m118577': 'Dr. Mohammad Aboshosha',
  'stk-dr-m118579': 'Dr. W Al-Khulaifi',
  'stk-dr-m118581': 'Dr. Saeed Salman',
  'stk-dr-m152151': 'Dr. J Al-Smail',
  'stk-dr-m152152': 'Dr. Saddam Abbasi',
  'stk-dr-m172442': 'Dr. Nicolas Hadjisavvas',
  'stk-dr-m172443': 'Dr. Rachid Marsli',
  'stk-dr-m172444': 'Dr. Audu Johnson',
  'stk-dr-m172446': 'Dr. Azzam Alfarraj',
  'stk-dr-m172447': 'Dr. Ali Duman',
  'stk-dr-m172448': 'Dr. Shadi Moham Alomari',
  'stk-dr-m172449': 'Dr. Yassir Khalid',
  'stk-dr-m172450': 'Dr. Moenes Mellouli',
  'stk-dr-m175316': 'Dr. Mohsen Alshahrani',
  'stk-dr-m175799': 'Dr. Taleb Alkurdi',
  'stk-dr-m176963': 'Dr. Abdulmuhsin Alfaraj',
  'stk-dr-m176965': 'Dr. Jae-Chean Joo',
  'stk-dr-m176969': 'Dr. Abed-Alhay Elmughrabi',
  'stk-dr-m181955': 'Dr. Brahim Mezerdi',
  'stk-dr-m182895': 'Dr. Faisal Suwayyid',
  'stk-dr-m182904': 'Dr. Muhammad Imran Qureshi',
  'stk-dr-m183422': 'Dr. Ibrahim Sarumi',
  'stk-dr-m185072': 'Dr. Manal Alotibi',
}
# code ⇐ [(topic id, post_number, doctor id)] — تقييماتُ هذه المادّة وحدَها.
# والردُّ الذي لا يقيّم («القريد هذا قريدك؟») لا يُنقل، ولا تقييمُ مادّةٍ أخرى.
PICK_DOC = {
  # ‏‎MATH 101/102‎ — من صفحات المدرّسين، اختيارٌ بقاعدة: ردٌّ فيه بنودُ تقييم ويصرّح بالمادّة (ماث 101 / 102)،
  # ولا يذكر مادّةً أخرى قبلها، ولا سبَّ فيه ولا دعاءَ على أحد؛ ولكلّ كاتبٍ أطولُ ردوده عن الدكتور
  'MATH 101': [
    (68361, 37, 'stk-dr-m68361'), (68361, 44, 'stk-dr-m68361'), (68361, 45, 'stk-dr-m68361'), (68361, 49, 'stk-dr-m68361'), (68361, 50, 'stk-dr-m68361'), (68361, 72, 'stk-dr-m68361'),
    (68367, 14, 'stk-dr-m68367'), (68367, 17, 'stk-dr-m68367'), (68367, 19, 'stk-dr-m68367'),
    (68372, 22, 'stk-dr-m68372'),
    (68373, 21, 'stk-dr-m68373'), (68373, 42, 'stk-dr-m68373'), (68373, 45, 'stk-dr-m68373'), (68373, 47, 'stk-dr-m68373'),
    (68381, 18, 'stk-dr-m68381'), (68381, 37, 'stk-dr-m68381'), (68381, 41, 'stk-dr-m68381'), (68381, 45, 'stk-dr-m68381'), (68381, 46, 'stk-dr-m68381'), (68381, 48, 'stk-dr-m68381'), (68381, 49, 'stk-dr-m68381'), (68381, 50, 'stk-dr-m68381'),
    (68381, 51, 'stk-dr-m68381'), (68381, 52, 'stk-dr-m68381'), (68381, 54, 'stk-dr-m68381'), (68381, 56, 'stk-dr-m68381'), (68381, 57, 'stk-dr-m68381'), (68381, 58, 'stk-dr-m68381'), (68381, 59, 'stk-dr-m68381'),
    (68383, 16, 'stk-dr-m68383'),
    (68385, 16, 'stk-dr-m68385'), (68385, 25, 'stk-dr-m68385'), (68385, 26, 'stk-dr-m68385'), (68385, 27, 'stk-dr-m68385'), (68385, 28, 'stk-dr-m68385'), (68385, 29, 'stk-dr-m68385'), (68385, 31, 'stk-dr-m68385'),
    (68389, 11, 'stk-dr-m68389'), (68389, 12, 'stk-dr-m68389'), (68389, 17, 'stk-dr-m68389'), (68389, 18, 'stk-dr-m68389'), (68389, 19, 'stk-dr-m68389'),
    (68390, 39, 'stk-dr-m68390'), (68390, 47, 'stk-dr-m68390'),
    (68391, 6, 'stk-dr-m68391'), (68391, 11, 'stk-dr-m68391'), (68391, 12, 'stk-dr-m68391'), (68391, 17, 'stk-dr-m68391'),
    (68395, 4, 'stk-dr-m68395'), (68395, 21, 'stk-dr-m68395'), (68395, 43, 'stk-dr-m68395'), (68395, 44, 'stk-dr-m68395'), (68395, 47, 'stk-dr-m68395'), (68395, 51, 'stk-dr-m68395'), (68395, 52, 'stk-dr-m68395'), (68395, 56, 'stk-dr-m68395'),
    (68395, 57, 'stk-dr-m68395'),
    (68396, 14, 'stk-dr-m68396'), (68396, 19, 'stk-dr-m68396'),
    (68398, 3, 'stk-dr-m68398'), (68398, 40, 'stk-dr-m68398'),
    (68405, 45, 'stk-dr-m68405'),
    (68406, 57, 'stk-dr-m68406'), (68406, 59, 'stk-dr-m68406'), (68406, 65, 'stk-dr-m68406'), (68406, 70, 'stk-dr-m68406'), (68406, 77, 'stk-dr-m68406'), (68406, 87, 'stk-dr-m68406'), (68406, 88, 'stk-dr-m68406'), (68406, 89, 'stk-dr-m68406'),
    (68406, 93, 'stk-dr-m68406'),
    (68408, 7, 'stk-dr-m68408'), (68408, 8, 'stk-dr-m68408'), (68408, 15, 'stk-dr-m68408'), (68408, 21, 'stk-dr-m68408'), (68408, 27, 'stk-dr-m68408'), (68408, 28, 'stk-dr-m68408'), (68408, 29, 'stk-dr-m68408'), (68408, 30, 'stk-dr-m68408'),
    (68408, 31, 'stk-dr-m68408'), (68408, 33, 'stk-dr-m68408'), (68408, 35, 'stk-dr-m68408'), (68408, 37, 'stk-dr-m68408'), (68408, 38, 'stk-dr-m68408'), (68408, 40, 'stk-dr-m68408'), (68408, 41, 'stk-dr-m68408'),
    (68411, 26, 'stk-dr-m68411'),
    (68412, 32, 'stk-dr-m68412'), (68412, 49, 'stk-dr-m68412'),
    (68413, 23, 'stk-dr-m68413'), (68413, 41, 'stk-dr-m68413'), (68413, 43, 'stk-dr-m68413'), (68413, 45, 'stk-dr-m68413'),
    (68463, 2, 'stk-dr-m68463'), (68463, 14, 'stk-dr-m68463'), (68463, 18, 'stk-dr-m68463'), (68463, 19, 'stk-dr-m68463'), (68463, 55, 'stk-dr-m68463'), (68463, 60, 'stk-dr-m68463'),
    (68467, 2, 'stk-dr-m68467'), (68467, 27, 'stk-dr-m68467'), (68467, 49, 'stk-dr-m68467'), (68467, 57, 'stk-dr-m68467'), (68467, 68, 'stk-dr-m68467'), (68467, 69, 'stk-dr-m68467'), (68467, 72, 'stk-dr-m68467'), (68467, 73, 'stk-dr-m68467'),
    (68467, 74, 'stk-dr-m68467'), (68467, 75, 'stk-dr-m68467'), (68467, 76, 'stk-dr-m68467'),
    (68471, 9, 'stk-dr-m68471'), (68471, 16, 'stk-dr-m68471'), (68471, 18, 'stk-dr-m68471'), (68471, 19, 'stk-dr-m68471'), (68471, 39, 'stk-dr-m68471'), (68471, 40, 'stk-dr-m68471'), (68471, 41, 'stk-dr-m68471'), (68471, 43, 'stk-dr-m68471'),
    (68472, 51, 'stk-dr-m68472'),
    (68474, 22, 'stk-dr-m68474'), (68474, 24, 'stk-dr-m68474'), (68474, 25, 'stk-dr-m68474'), (68474, 26, 'stk-dr-m68474'),
    (68561, 3, 'stk-dr-m68561'),
    (68565, 12, 'stk-dr-m68565'), (68565, 35, 'stk-dr-m68565'), (68565, 43, 'stk-dr-m68565'), (68565, 46, 'stk-dr-m68565'), (68565, 51, 'stk-dr-m68565'), (68565, 53, 'stk-dr-m68565'), (68565, 55, 'stk-dr-m68565'), (68565, 62, 'stk-dr-m68565'),
    (68565, 71, 'stk-dr-m68565'),
    (68568, 20, 'stk-dr-m68568'), (68568, 22, 'stk-dr-m68568'), (68568, 33, 'stk-dr-m68568'), (68568, 34, 'stk-dr-m68568'), (68568, 36, 'stk-dr-m68568'), (68568, 37, 'stk-dr-m68568'), (68568, 38, 'stk-dr-m68568'),
    (68569, 22, 'stk-dr-m68569'), (68569, 27, 'stk-dr-m68569'), (68569, 39, 'stk-dr-m68569'),
    (68571, 35, 'stk-dr-m68571'),
    (68577, 24, 'stk-dr-m68577'), (68577, 25, 'stk-dr-m68577'),
    (68579, 58, 'stk-dr-m68579'), (68579, 62, 'stk-dr-m68579'), (68579, 63, 'stk-dr-m68579'), (68579, 64, 'stk-dr-m68579'), (68579, 65, 'stk-dr-m68579'), (68579, 66, 'stk-dr-m68579'),
    (68582, 15, 'stk-dr-m68582'), (68582, 17, 'stk-dr-m68582'), (68582, 22, 'stk-dr-m68582'), (68582, 31, 'stk-dr-m68582'), (68582, 33, 'stk-dr-m68582'), (68582, 49, 'stk-dr-m68582'), (68582, 50, 'stk-dr-m68582'), (68582, 71, 'stk-dr-m68582'),
    (68582, 80, 'stk-dr-m68582'), (68582, 84, 'stk-dr-m68582'),
    (68586, 15, 'stk-dr-m68586'), (68586, 16, 'stk-dr-m68586'), (68586, 23, 'stk-dr-m68586'), (68586, 27, 'stk-dr-m68586'), (68586, 31, 'stk-dr-m68586'), (68586, 32, 'stk-dr-m68586'), (68586, 33, 'stk-dr-m68586'),
    (68677, 19, 'stk-dr-m68677'), (68677, 57, 'stk-dr-m68677'),
    (68928, 70, 'stk-dr-m68928'), (68928, 75, 'stk-dr-m68928'), (68928, 76, 'stk-dr-m68928'),
    (69347, 49, 'stk-dr-m69347'),
    (69876, 35, 'stk-dr-m69876'), (69876, 36, 'stk-dr-m69876'), (69876, 37, 'stk-dr-m69876'), (69876, 40, 'stk-dr-m69876'), (69876, 45, 'stk-dr-m69876'), (69876, 46, 'stk-dr-m69876'), (69876, 48, 'stk-dr-m69876'), (69876, 49, 'stk-dr-m69876'),
    (69876, 50, 'stk-dr-m69876'), (69876, 51, 'stk-dr-m69876'), (69876, 53, 'stk-dr-m69876'), (69876, 56, 'stk-dr-m69876'), (69876, 64, 'stk-dr-m69876'), (69876, 70, 'stk-dr-m69876'), (69876, 75, 'stk-dr-m69876'), (69876, 77, 'stk-dr-m69876'),
    (69876, 79, 'stk-dr-m69876'), (69876, 80, 'stk-dr-m69876'),
    (70511, 35, 'stk-dr-m70511'),
    (70785, 37, 'stk-dr-m70785'), (70785, 42, 'stk-dr-m70785'),
    (77387, 27, 'stk-dr-m77387'), (77387, 32, 'stk-dr-m77387'),
    (78126, 28, 'stk-dr-m78126'), (78126, 30, 'stk-dr-m78126'), (78126, 33, 'stk-dr-m78126'),
    (78226, 13, 'stk-dr-m78226'),
    (81621, 17, 'stk-dr-m81621'), (81621, 32, 'stk-dr-m81621'), (81621, 40, 'stk-dr-m81621'), (81621, 42, 'stk-dr-m81621'), (81621, 45, 'stk-dr-m81621'),
    (83632, 10, 'stk-dr-m83632'), (83632, 25, 'stk-dr-m83632'), (83632, 27, 'stk-dr-m83632'), (83632, 29, 'stk-dr-m83632'), (83632, 31, 'stk-dr-m83632'),
    (83633, 2, 'stk-dr-m83633'), (83633, 16, 'stk-dr-m83633'), (83633, 19, 'stk-dr-m83633'), (83633, 20, 'stk-dr-m83633'),
    (83634, 8, 'stk-dr-m83634'), (83634, 13, 'stk-dr-m83634'), (83634, 15, 'stk-dr-m83634'),
    (92906, 2, 'stk-dr-m92906'), (92906, 10, 'stk-dr-m92906'), (92906, 23, 'stk-dr-m92906'), (92906, 32, 'stk-dr-m92906'),
    (94260, 38, 'stk-dr-m94260'), (94260, 56, 'stk-dr-m94260'),
    (94443, 14, 'stk-dr-m94443'), (94443, 18, 'stk-dr-m94443'),
    (118561, 9, 'stk-dr-m118561'), (118561, 10, 'stk-dr-m118561'), (118561, 11, 'stk-dr-m118561'),
    (118562, 6, 'stk-dr-m118562'),
    (118563, 32, 'stk-dr-m118563'),
    (118565, 16, 'stk-dr-m118565'), (118565, 21, 'stk-dr-m118565'),
    (118567, 3, 'stk-dr-m118567'),
    (118568, 7, 'stk-dr-m118568'), (118568, 12, 'stk-dr-m118568'), (118568, 14, 'stk-dr-m118568'), (118568, 17, 'stk-dr-m118568'),
    (118569, 14, 'stk-dr-m118569'),
    (118571, 6, 'stk-dr-m118571'),
    (118572, 2, 'stk-dr-m118572'), (118572, 4, 'stk-dr-m118572'), (118572, 5, 'stk-dr-m118572'), (118572, 15, 'stk-dr-m118572'),
    (118577, 7, 'stk-dr-m118577'), (118577, 11, 'stk-dr-m118577'), (118577, 13, 'stk-dr-m118577'), (118577, 23, 'stk-dr-m118577'), (118577, 30, 'stk-dr-m118577'), (118577, 31, 'stk-dr-m118577'), (118577, 32, 'stk-dr-m118577'), (118577, 35, 'stk-dr-m118577'),
    (118577, 36, 'stk-dr-m118577'), (118577, 37, 'stk-dr-m118577'), (118577, 42, 'stk-dr-m118577'),
    (118579, 3, 'stk-dr-m118579'), (118579, 27, 'stk-dr-m118579'), (118579, 28, 'stk-dr-m118579'), (118579, 29, 'stk-dr-m118579'), (118579, 32, 'stk-dr-m118579'),
    (118581, 6, 'stk-dr-m118581'),
    (152151, 10, 'stk-dr-m152151'), (152151, 16, 'stk-dr-m152151'), (152151, 18, 'stk-dr-m152151'),
    (152152, 13, 'stk-dr-m152152'),
    (172443, 16, 'stk-dr-m172443'), (172443, 17, 'stk-dr-m172443'), (172443, 18, 'stk-dr-m172443'),
    (172444, 6, 'stk-dr-m172444'),
    (172446, 4, 'stk-dr-m172446'),
    (172447, 6, 'stk-dr-m172447'),
    (172448, 3, 'stk-dr-m172448'),
    (172449, 4, 'stk-dr-m172449'),
    (175316, 14, 'stk-dr-m175316'), (175316, 15, 'stk-dr-m175316'), (175316, 16, 'stk-dr-m175316'), (175316, 17, 'stk-dr-m175316'), (175316, 18, 'stk-dr-m175316'), (175316, 19, 'stk-dr-m175316'), (175316, 20, 'stk-dr-m175316'), (175316, 23, 'stk-dr-m175316'),
    (175316, 24, 'stk-dr-m175316'),
    (175799, 6, 'stk-dr-m175799'), (175799, 7, 'stk-dr-m175799'),
    (176963, 4, 'stk-dr-m176963'), (176963, 6, 'stk-dr-m176963'),
    (176965, 2, 'stk-dr-m176965'),
    (176969, 3, 'stk-dr-m176969'), (176969, 5, 'stk-dr-m176969'), (176969, 9, 'stk-dr-m176969'),
    (182895, 5, 'stk-dr-m182895'), (182895, 8, 'stk-dr-m182895'), (182895, 9, 'stk-dr-m182895'), (182895, 10, 'stk-dr-m182895'), (182895, 11, 'stk-dr-m182895'),
    (182904, 5, 'stk-dr-m182904'), (182904, 10, 'stk-dr-m182904'), (182904, 11, 'stk-dr-m182904'),
    (185072, 2, 'stk-dr-m185072'),
  ],
  'MATH 102': [
    (68361, 49, 'stk-dr-m68361'), (68361, 64, 'stk-dr-m68361'), (68361, 69, 'stk-dr-m68361'), (68361, 76, 'stk-dr-m68361'), (68361, 77, 'stk-dr-m68361'),
    (68367, 20, 'stk-dr-m68367'),
    (68372, 10, 'stk-dr-m68372'), (68372, 18, 'stk-dr-m68372'),
    (68373, 32, 'stk-dr-m68373'), (68373, 33, 'stk-dr-m68373'), (68373, 34, 'stk-dr-m68373'), (68373, 35, 'stk-dr-m68373'), (68373, 36, 'stk-dr-m68373'), (68373, 37, 'stk-dr-m68373'),
    (68375, 34, 'stk-dr-m68375'),
    (68381, 48, 'stk-dr-m68381'), (68381, 53, 'stk-dr-m68381'), (68381, 59, 'stk-dr-m68381'),
    (68385, 32, 'stk-dr-m68385'),
    (68390, 11, 'stk-dr-m68390'), (68390, 33, 'stk-dr-m68390'), (68390, 41, 'stk-dr-m68390'),
    (68391, 16, 'stk-dr-m68391'),
    (68395, 9, 'stk-dr-m68395'), (68395, 27, 'stk-dr-m68395'), (68395, 57, 'stk-dr-m68395'),
    (68400, 18, 'stk-dr-m68400'),
    (68403, 17, 'stk-dr-m68403'), (68403, 22, 'stk-dr-m68403'), (68403, 28, 'stk-dr-m68403'), (68403, 32, 'stk-dr-m68403'), (68403, 33, 'stk-dr-m68403'), (68403, 34, 'stk-dr-m68403'), (68403, 36, 'stk-dr-m68403'), (68403, 37, 'stk-dr-m68403'),
    (68403, 38, 'stk-dr-m68403'),
    (68405, 42, 'stk-dr-m68405'),
    (68406, 61, 'stk-dr-m68406'), (68406, 62, 'stk-dr-m68406'), (68406, 67, 'stk-dr-m68406'), (68406, 79, 'stk-dr-m68406'), (68406, 92, 'stk-dr-m68406'),
    (68408, 8, 'stk-dr-m68408'), (68408, 13, 'stk-dr-m68408'), (68408, 22, 'stk-dr-m68408'), (68408, 24, 'stk-dr-m68408'), (68408, 25, 'stk-dr-m68408'), (68408, 28, 'stk-dr-m68408'), (68408, 32, 'stk-dr-m68408'), (68408, 33, 'stk-dr-m68408'),
    (68411, 22, 'stk-dr-m68411'), (68411, 24, 'stk-dr-m68411'), (68411, 29, 'stk-dr-m68411'), (68411, 30, 'stk-dr-m68411'), (68411, 36, 'stk-dr-m68411'),
    (68412, 29, 'stk-dr-m68412'), (68412, 32, 'stk-dr-m68412'), (68412, 51, 'stk-dr-m68412'), (68412, 54, 'stk-dr-m68412'),
    (68413, 16, 'stk-dr-m68413'),
    (68419, 44, 'stk-dr-m68419'),
    (68463, 39, 'stk-dr-m68463'), (68463, 41, 'stk-dr-m68463'), (68463, 46, 'stk-dr-m68463'), (68463, 51, 'stk-dr-m68463'), (68463, 52, 'stk-dr-m68463'), (68463, 56, 'stk-dr-m68463'), (68463, 58, 'stk-dr-m68463'), (68463, 60, 'stk-dr-m68463'),
    (68463, 61, 'stk-dr-m68463'), (68463, 62, 'stk-dr-m68463'), (68463, 63, 'stk-dr-m68463'), (68463, 64, 'stk-dr-m68463'),
    (68467, 27, 'stk-dr-m68467'), (68467, 44, 'stk-dr-m68467'), (68467, 50, 'stk-dr-m68467'), (68467, 51, 'stk-dr-m68467'), (68467, 57, 'stk-dr-m68467'),
    (68471, 23, 'stk-dr-m68471'), (68471, 45, 'stk-dr-m68471'), (68471, 46, 'stk-dr-m68471'), (68471, 50, 'stk-dr-m68471'), (68471, 51, 'stk-dr-m68471'),
    (68472, 26, 'stk-dr-m68472'), (68472, 46, 'stk-dr-m68472'), (68472, 47, 'stk-dr-m68472'), (68472, 48, 'stk-dr-m68472'),
    (68557, 5, 'stk-dr-m68557'),
    (68561, 15, 'stk-dr-m68561'), (68561, 22, 'stk-dr-m68561'), (68561, 24, 'stk-dr-m68561'),
    (68565, 62, 'stk-dr-m68565'),
    (68569, 17, 'stk-dr-m68569'), (68569, 29, 'stk-dr-m68569'), (68569, 39, 'stk-dr-m68569'), (68569, 40, 'stk-dr-m68569'), (68569, 56, 'stk-dr-m68569'),
    (68579, 15, 'stk-dr-m68579'), (68579, 52, 'stk-dr-m68579'), (68579, 59, 'stk-dr-m68579'), (68579, 69, 'stk-dr-m68579'), (68579, 71, 'stk-dr-m68579'),
    (68582, 27, 'stk-dr-m68582'), (68582, 33, 'stk-dr-m68582'), (68582, 35, 'stk-dr-m68582'), (68582, 36, 'stk-dr-m68582'), (68582, 45, 'stk-dr-m68582'), (68582, 50, 'stk-dr-m68582'), (68582, 62, 'stk-dr-m68582'), (68582, 63, 'stk-dr-m68582'),
    (68582, 69, 'stk-dr-m68582'), (68582, 74, 'stk-dr-m68582'), (68582, 78, 'stk-dr-m68582'), (68582, 79, 'stk-dr-m68582'), (68582, 83, 'stk-dr-m68582'),
    (68586, 12, 'stk-dr-m68586'),
    (68677, 14, 'stk-dr-m68677'), (68677, 15, 'stk-dr-m68677'), (68677, 30, 'stk-dr-m68677'), (68677, 53, 'stk-dr-m68677'), (68677, 55, 'stk-dr-m68677'), (68677, 56, 'stk-dr-m68677'), (68677, 57, 'stk-dr-m68677'), (68677, 58, 'stk-dr-m68677'),
    (68677, 62, 'stk-dr-m68677'), (68677, 66, 'stk-dr-m68677'),
    (68928, 71, 'stk-dr-m68928'),
    (69347, 54, 'stk-dr-m69347'),
    (69876, 40, 'stk-dr-m69876'), (69876, 42, 'stk-dr-m69876'), (69876, 43, 'stk-dr-m69876'), (69876, 44, 'stk-dr-m69876'), (69876, 46, 'stk-dr-m69876'), (69876, 51, 'stk-dr-m69876'), (69876, 52, 'stk-dr-m69876'), (69876, 55, 'stk-dr-m69876'),
    (69876, 72, 'stk-dr-m69876'), (69876, 73, 'stk-dr-m69876'), (69876, 74, 'stk-dr-m69876'),
    (70511, 30, 'stk-dr-m70511'),
    (70785, 33, 'stk-dr-m70785'), (70785, 39, 'stk-dr-m70785'), (70785, 40, 'stk-dr-m70785'), (70785, 41, 'stk-dr-m70785'), (70785, 42, 'stk-dr-m70785'), (70785, 48, 'stk-dr-m70785'), (70785, 49, 'stk-dr-m70785'), (70785, 50, 'stk-dr-m70785'),
    (70785, 51, 'stk-dr-m70785'), (70785, 52, 'stk-dr-m70785'), (70785, 53, 'stk-dr-m70785'), (70785, 54, 'stk-dr-m70785'), (70785, 55, 'stk-dr-m70785'),
    (78126, 26, 'stk-dr-m78126'), (78126, 34, 'stk-dr-m78126'), (78126, 35, 'stk-dr-m78126'),
    (78226, 13, 'stk-dr-m78226'), (78226, 26, 'stk-dr-m78226'), (78226, 33, 'stk-dr-m78226'), (78226, 36, 'stk-dr-m78226'), (78226, 48, 'stk-dr-m78226'),
    (81621, 46, 'stk-dr-m81621'), (81621, 47, 'stk-dr-m81621'), (81621, 48, 'stk-dr-m81621'), (81621, 49, 'stk-dr-m81621'), (81621, 51, 'stk-dr-m81621'),
    (83632, 29, 'stk-dr-m83632'),
    (83634, 9, 'stk-dr-m83634'), (83634, 12, 'stk-dr-m83634'),
    (92906, 6, 'stk-dr-m92906'), (92906, 7, 'stk-dr-m92906'),
    (94260, 27, 'stk-dr-m94260'), (94260, 30, 'stk-dr-m94260'), (94260, 32, 'stk-dr-m94260'), (94260, 37, 'stk-dr-m94260'), (94260, 48, 'stk-dr-m94260'), (94260, 49, 'stk-dr-m94260'), (94260, 51, 'stk-dr-m94260'), (94260, 52, 'stk-dr-m94260'),
    (94261, 29, 'stk-dr-m94261'),
    (94262, 22, 'stk-dr-m94262'),
    (94443, 18, 'stk-dr-m94443'), (94443, 19, 'stk-dr-m94443'),
    (118563, 12, 'stk-dr-m118563'),
    (118565, 2, 'stk-dr-m118565'), (118565, 7, 'stk-dr-m118565'), (118565, 9, 'stk-dr-m118565'), (118565, 10, 'stk-dr-m118565'), (118565, 12, 'stk-dr-m118565'), (118565, 14, 'stk-dr-m118565'), (118565, 16, 'stk-dr-m118565'), (118565, 19, 'stk-dr-m118565'),
    (118565, 20, 'stk-dr-m118565'), (118565, 21, 'stk-dr-m118565'), (118565, 22, 'stk-dr-m118565'), (118565, 23, 'stk-dr-m118565'),
    (118569, 7, 'stk-dr-m118569'), (118569, 12, 'stk-dr-m118569'),
    (118572, 4, 'stk-dr-m118572'),
    (118573, 11, 'stk-dr-m118573'), (118573, 14, 'stk-dr-m118573'), (118573, 16, 'stk-dr-m118573'),
    (118577, 2, 'stk-dr-m118577'), (118577, 3, 'stk-dr-m118577'), (118577, 4, 'stk-dr-m118577'), (118577, 8, 'stk-dr-m118577'), (118577, 10, 'stk-dr-m118577'), (118577, 12, 'stk-dr-m118577'), (118577, 17, 'stk-dr-m118577'), (118577, 22, 'stk-dr-m118577'),
    (118577, 23, 'stk-dr-m118577'), (118577, 25, 'stk-dr-m118577'), (118577, 29, 'stk-dr-m118577'), (118577, 33, 'stk-dr-m118577'), (118577, 34, 'stk-dr-m118577'), (118577, 42, 'stk-dr-m118577'),
    (118579, 12, 'stk-dr-m118579'), (118579, 18, 'stk-dr-m118579'), (118579, 19, 'stk-dr-m118579'), (118579, 20, 'stk-dr-m118579'), (118579, 23, 'stk-dr-m118579'), (118579, 24, 'stk-dr-m118579'), (118579, 32, 'stk-dr-m118579'),
    (152151, 19, 'stk-dr-m152151'), (152151, 21, 'stk-dr-m152151'), (152151, 23, 'stk-dr-m152151'),
    (172442, 3, 'stk-dr-m172442'), (172442, 4, 'stk-dr-m172442'),
    (172446, 5, 'stk-dr-m172446'), (172446, 6, 'stk-dr-m172446'), (172446, 7, 'stk-dr-m172446'),
    (172447, 4, 'stk-dr-m172447'), (172447, 5, 'stk-dr-m172447'),
    (172448, 4, 'stk-dr-m172448'),
    (172449, 3, 'stk-dr-m172449'), (172449, 8, 'stk-dr-m172449'),
    (172450, 2, 'stk-dr-m172450'),
    (175316, 2, 'stk-dr-m175316'), (175316, 4, 'stk-dr-m175316'), (175316, 7, 'stk-dr-m175316'), (175316, 9, 'stk-dr-m175316'), (175316, 10, 'stk-dr-m175316'), (175316, 11, 'stk-dr-m175316'), (175316, 12, 'stk-dr-m175316'), (175316, 20, 'stk-dr-m175316'),
    (175316, 22, 'stk-dr-m175316'), (175316, 30, 'stk-dr-m175316'),
    (175799, 5, 'stk-dr-m175799'), (175799, 17, 'stk-dr-m175799'), (175799, 20, 'stk-dr-m175799'), (175799, 21, 'stk-dr-m175799'), (175799, 22, 'stk-dr-m175799'),
    (176963, 6, 'stk-dr-m176963'),
    (176969, 3, 'stk-dr-m176969'), (176969, 4, 'stk-dr-m176969'), (176969, 6, 'stk-dr-m176969'), (176969, 7, 'stk-dr-m176969'), (176969, 8, 'stk-dr-m176969'), (176969, 10, 'stk-dr-m176969'), (176969, 12, 'stk-dr-m176969'), (176969, 16, 'stk-dr-m176969'),
    (181955, 7, 'stk-dr-m181955'), (181955, 8, 'stk-dr-m181955'),
    (182895, 14, 'stk-dr-m182895'),
    (182904, 3, 'stk-dr-m182904'), (182904, 6, 'stk-dr-m182904'),
    (183422, 3, 'stk-dr-m183422'), (183422, 4, 'stk-dr-m183422'), (183422, 7, 'stk-dr-m183422'), (183422, 8, 'stk-dr-m183422'), (183422, 9, 'stk-dr-m183422'), (183422, 10, 'stk-dr-m183422'), (183422, 11, 'stk-dr-m183422'),
  ],
  # ‏‎IAS 212‎ — من صفحات المدرّسين: ما صرّح كاتبُه أنّه عن 212
  'IAS 212': [
    (68621, 21, 'stk-dr-mashookhi'), (68621, 24, 'stk-dr-mashookhi'), (68621, 57, 'stk-dr-mashookhi'), (68621, 58, 'stk-dr-mashookhi'), (68621, 64, 'stk-dr-mashookhi'), (68621, 68, 'stk-dr-mashookhi'),
    (68622, 25, 'stk-dr-sendi'), (68622, 27, 'stk-dr-sendi'), (68622, 28, 'stk-dr-sendi'), (68622, 35, 'stk-dr-sendi'), (68622, 36, 'stk-dr-sendi'), (68622, 45, 'stk-dr-sendi'), (68622, 46, 'stk-dr-sendi'), (68622, 47, 'stk-dr-sendi'), (68622, 48, 'stk-dr-sendi'), (68622, 61, 'stk-dr-sendi'),
    (68628, 39, 'stk-dr-humaidan'), (68628, 56, 'stk-dr-humaidan'), (68628, 60, 'stk-dr-humaidan'), (68628, 61, 'stk-dr-humaidan'), (68628, 64, 'stk-dr-humaidan'), (68628, 66, 'stk-dr-humaidan'), (68628, 80, 'stk-dr-humaidan'), (68628, 81, 'stk-dr-humaidan'), (68628, 83, 'stk-dr-humaidan'), (68628, 84, 'stk-dr-humaidan'), (68628, 86, 'stk-dr-humaidan'),
    (68633, 27, 'stk-dr-muzeini'), (68633, 30, 'stk-dr-muzeini'), (68633, 32, 'stk-dr-muzeini'), (68633, 33, 'stk-dr-muzeini'), (68633, 34, 'stk-dr-muzeini'), (68633, 36, 'stk-dr-muzeini'),
    (68637, 71, 'stk-dr-suliman'), (68637, 72, 'stk-dr-suliman'),
    (68639, 34, 'stk-dr-afzal'), (68639, 52, 'stk-dr-afzal'),
    (148170, 5, 'stk-dr-yzahrani'), (148170, 6, 'stk-dr-yzahrani'), (148170, 9, 'stk-dr-yzahrani'), (148170, 10, 'stk-dr-yzahrani'), (148170, 11, 'stk-dr-yzahrani'), (148170, 12, 'stk-dr-yzahrani'), (148170, 13, 'stk-dr-yzahrani'),
    (148171, 11, 'stk-dr-enaizan'),
    (148173, 2, 'stk-dr-khushaim'), (148173, 3, 'stk-dr-khushaim'), (148173, 9, 'stk-dr-khushaim'), (148173, 10, 'stk-dr-khushaim'),
    (148174, 19, 'stk-dr-khaldi'), (148174, 21, 'stk-dr-khaldi'), (148174, 22, 'stk-dr-khaldi'), (148174, 23, 'stk-dr-khaldi'), (148174, 24, 'stk-dr-khaldi'), (148174, 25, 'stk-dr-khaldi'), (148174, 26, 'stk-dr-khaldi'), (148174, 28, 'stk-dr-khaldi'), (148174, 31, 'stk-dr-khaldi'), (148174, 32, 'stk-dr-khaldi'), (148174, 34, 'stk-dr-khaldi'), (148174, 37, 'stk-dr-khaldi'), (148174, 38, 'stk-dr-khaldi'), (148174, 39, 'stk-dr-khaldi'),
    (179107, 3, 'stk-dr-rharbi'), (179107, 4, 'stk-dr-rharbi'), (179107, 9, 'stk-dr-rharbi'), (179107, 13, 'stk-dr-rharbi'), (179107, 14, 'stk-dr-rharbi'),
    (180680, 2, 'stk-dr-shebl'), (180680, 5, 'stk-dr-shebl'),
    (183545, 6, 'stk-dr-aomar'), (183545, 7, 'stk-dr-aomar'), (183545, 8, 'stk-dr-aomar'), (183545, 9, 'stk-dr-aomar'), (183545, 10, 'stk-dr-aomar'), (183545, 11, 'stk-dr-aomar'), (183545, 12, 'stk-dr-aomar'), (183545, 13, 'stk-dr-aomar'), (183545, 14, 'stk-dr-aomar'),
  ],
  # ‏‎IAS 121‎ «أسس اللغة» — جديدة (منذ 2019)، وما في المنتدى عنها إلّا تقييماتُ مدرّسيها
  'IAS 121': [
    (68612, 88, 'stk-dr-aibrahim'), (68612, 89, 'stk-dr-aibrahim'), (68612, 90, 'stk-dr-aibrahim'),
    (172426, 34, 'stk-dr-jurayan'),
  ],
  # ‏‎ENGL 214‎ — من صفحات المدرّسين: ما صرّح كاتبُه أنّه عن 214
  'ENGL 214': [
    (68435, 13, 'stk-dr-en68435'),
    (68439, 19, 'stk-dr-en68439'),
    (68440, 20, 'stk-dr-en68440'), (68440, 29, 'stk-dr-en68440'), (68440, 32, 'stk-dr-en68440'), (68440, 36, 'stk-dr-en68440'), (68440, 37, 'stk-dr-en68440'), (68440, 39, 'stk-dr-en68440'), (68440, 43, 'stk-dr-en68440'), (68440, 44, 'stk-dr-en68440'), (68440, 45, 'stk-dr-en68440'), (68440, 46, 'stk-dr-en68440'),
    (68441, 12, 'stk-dr-en68441'), (68441, 15, 'stk-dr-en68441'), (68441, 19, 'stk-dr-en68441'), (68441, 37, 'stk-dr-en68441'),
    (68442, 32, 'stk-dr-en68442'), (68442, 46, 'stk-dr-en68442'), (68442, 55, 'stk-dr-en68442'),
    (68444, 2, 'stk-dr-en68444'), (68444, 11, 'stk-dr-en68444'), (68444, 14, 'stk-dr-en68444'), (68444, 30, 'stk-dr-en68444'), (68444, 36, 'stk-dr-en68444'), (68444, 68, 'stk-dr-en68444'), (68444, 76, 'stk-dr-en68444'), (68444, 83, 'stk-dr-en68444'), (68444, 86, 'stk-dr-en68444'), (68444, 90, 'stk-dr-en68444'), (68444, 91, 'stk-dr-en68444'), (68444, 94, 'stk-dr-en68444'),
    (68447, 40, 'stk-dr-en68447'), (68447, 48, 'stk-dr-en68447'), (68447, 59, 'stk-dr-en68447'), (68447, 67, 'stk-dr-en68447'), (68447, 68, 'stk-dr-en68447'),
    (69101, 23, 'stk-dr-en69101'), (69101, 31, 'stk-dr-en69101'), (69101, 38, 'stk-dr-en69101'), (69101, 43, 'stk-dr-en69101'),
    (74185, 40, 'stk-dr-en74185'), (74185, 61, 'stk-dr-en74185'), (74185, 63, 'stk-dr-en74185'), (74185, 73, 'stk-dr-en74185'),
    (76546, 57, 'stk-dr-en76546'), (76546, 68, 'stk-dr-en76546'), (76546, 82, 'stk-dr-en76546'), (76546, 83, 'stk-dr-en76546'), (76546, 88, 'stk-dr-en76546'), (76546, 93, 'stk-dr-en76546'), (76546, 95, 'stk-dr-en76546'), (76546, 101, 'stk-dr-en76546'), (76546, 102, 'stk-dr-en76546'), (76546, 109, 'stk-dr-en76546'), (76546, 110, 'stk-dr-en76546'),
    (92113, 43, 'stk-dr-en92113'), (92113, 47, 'stk-dr-en92113'), (92113, 60, 'stk-dr-en92113'), (92113, 61, 'stk-dr-en92113'), (92113, 64, 'stk-dr-en92113'), (92113, 69, 'stk-dr-en92113'), (92113, 71, 'stk-dr-en92113'),
    (94806, 31, 'stk-dr-en94806'), (94806, 34, 'stk-dr-en94806'), (94806, 36, 'stk-dr-en94806'),
    (94986, 31, 'stk-dr-en94986'),
    (96633, 57, 'stk-dr-en96633'), (96633, 62, 'stk-dr-en96633'), (96633, 65, 'stk-dr-en96633'), (96633, 67, 'stk-dr-en96633'), (96633, 69, 'stk-dr-en96633'), (96633, 70, 'stk-dr-en96633'), (96633, 71, 'stk-dr-en96633'), (96633, 72, 'stk-dr-en96633'), (96633, 73, 'stk-dr-en96633'),
    (118628, 33, 'stk-dr-en118628'), (118628, 36, 'stk-dr-en118628'), (118628, 40, 'stk-dr-en118628'), (118628, 42, 'stk-dr-en118628'),
    (184166, 2, 'stk-dr-en184166'),
  ],
  # ‏‎ENGL 102‎ — من صفحات المدرّسين: ما صرّح كاتبُه أنّه عن 102 (لا «ترم 102» في مادّةٍ أخرى)
  'ENGL 102': [
    (68428, 29, 'stk-dr-en68428'), (68428, 41, 'stk-dr-en68428'), (68428, 42, 'stk-dr-en68428'), (68428, 44, 'stk-dr-en68428'), (68428, 45, 'stk-dr-en68428'), (68428, 51, 'stk-dr-en68428'), (68428, 52, 'stk-dr-en68428'), (68428, 59, 'stk-dr-en68428'),
    (68435, 4, 'stk-dr-en68435'), (68435, 13, 'stk-dr-en68435'), (68435, 27, 'stk-dr-en68435'), (68435, 28, 'stk-dr-en68435'), (68435, 29, 'stk-dr-en68435'), (68435, 42, 'stk-dr-en68435'), (68435, 45, 'stk-dr-en68435'), (68435, 47, 'stk-dr-en68435'),
    (68438, 6, 'stk-dr-en68438'), (68438, 22, 'stk-dr-en68438'),
    (68439, 2, 'stk-dr-en68439'), (68439, 5, 'stk-dr-en68439'), (68439, 7, 'stk-dr-en68439'), (68439, 20, 'stk-dr-en68439'), (68439, 21, 'stk-dr-en68439'), (68439, 36, 'stk-dr-en68439'), (68439, 42, 'stk-dr-en68439'), (68439, 43, 'stk-dr-en68439'),
    (68440, 20, 'stk-dr-en68440'), (68440, 24, 'stk-dr-en68440'), (68440, 26, 'stk-dr-en68440'), (68440, 27, 'stk-dr-en68440'), (68440, 29, 'stk-dr-en68440'), (68440, 47, 'stk-dr-en68440'),
    (68441, 3, 'stk-dr-en68441'), (68441, 5, 'stk-dr-en68441'), (68441, 6, 'stk-dr-en68441'), (68441, 37, 'stk-dr-en68441'),
    (68442, 39, 'stk-dr-en68442'),
    (68443, 5, 'stk-dr-en68443'), (68443, 15, 'stk-dr-en68443'), (68443, 17, 'stk-dr-en68443'), (68443, 32, 'stk-dr-en68443'), (68443, 39, 'stk-dr-en68443'),
    (68444, 61, 'stk-dr-en68444'), (68444, 69, 'stk-dr-en68444'), (68444, 71, 'stk-dr-en68444'), (68444, 89, 'stk-dr-en68444'), (68444, 90, 'stk-dr-en68444'), (68444, 92, 'stk-dr-en68444'),
    (68447, 5, 'stk-dr-en68447'), (68447, 14, 'stk-dr-en68447'), (68447, 24, 'stk-dr-en68447'), (68447, 36, 'stk-dr-en68447'), (68447, 37, 'stk-dr-en68447'),
    (68495, 2, 'stk-dr-en68495'), (68495, 33, 'stk-dr-en68495'),
    (68516, 12, 'stk-dr-en68516'), (68516, 26, 'stk-dr-en68516'), (68516, 27, 'stk-dr-en68516'),
    (68613, 28, 'stk-dr-en68613'), (68613, 37, 'stk-dr-en68613'), (68613, 53, 'stk-dr-en68613'),
    (68614, 34, 'stk-dr-en68614'), (68614, 38, 'stk-dr-en68614'), (68614, 49, 'stk-dr-en68614'), (68614, 61, 'stk-dr-en68614'), (68614, 62, 'stk-dr-en68614'),
    (69101, 44, 'stk-dr-en69101'), (69101, 51, 'stk-dr-en69101'),
    (74185, 76, 'stk-dr-en74185'),
    (76546, 84, 'stk-dr-en76546'), (76546, 85, 'stk-dr-en76546'), (76546, 100, 'stk-dr-en76546'), (76546, 112, 'stk-dr-en76546'), (76546, 113, 'stk-dr-en76546'),
    (92113, 41, 'stk-dr-en92113'), (92113, 60, 'stk-dr-en92113'), (92113, 75, 'stk-dr-en92113'), (92113, 76, 'stk-dr-en92113'),
    (94806, 31, 'stk-dr-en94806'), (94806, 34, 'stk-dr-en94806'),
    (94986, 24, 'stk-dr-en94986'), (94986, 30, 'stk-dr-en94986'), (94986, 33, 'stk-dr-en94986'), (94986, 35, 'stk-dr-en94986'), (94986, 41, 'stk-dr-en94986'),
    (96633, 16, 'stk-dr-en96633'), (96633, 29, 'stk-dr-en96633'), (96633, 33, 'stk-dr-en96633'), (96633, 63, 'stk-dr-en96633'), (96633, 68, 'stk-dr-en96633'),
    (115421, 2, 'stk-dr-en115421'), (115421, 8, 'stk-dr-en115421'), (115421, 9, 'stk-dr-en115421'), (115421, 14, 'stk-dr-en115421'), (115421, 19, 'stk-dr-en115421'), (115421, 23, 'stk-dr-en115421'), (115421, 24, 'stk-dr-en115421'), (115421, 30, 'stk-dr-en115421'), (115421, 34, 'stk-dr-en115421'), (115421, 35, 'stk-dr-en115421'), (115421, 36, 'stk-dr-en115421'), (115421, 39, 'stk-dr-en115421'), (115421, 40, 'stk-dr-en115421'), (115421, 41, 'stk-dr-en115421'),
    (118628, 20, 'stk-dr-en118628'), (118628, 32, 'stk-dr-en118628'), (118628, 36, 'stk-dr-en118628'), (118628, 37, 'stk-dr-en118628'),
    (118979, 19, 'stk-dr-en118979'), (118979, 23, 'stk-dr-en118979'), (118979, 28, 'stk-dr-en118979'),
    (179113, 2, 'stk-dr-en179113'), (179113, 3, 'stk-dr-en179113'), (179113, 4, 'stk-dr-en179113'), (179113, 6, 'stk-dr-en179113'), (179113, 8, 'stk-dr-en179113'), (179113, 13, 'stk-dr-en179113'), (179113, 15, 'stk-dr-en179113'), (179113, 16, 'stk-dr-en179113'),
    (182475, 2, 'stk-dr-en182475'), (182475, 3, 'stk-dr-en182475'), (182475, 10, 'stk-dr-en182475'),
    (183514, 6, 'stk-dr-en183514'),
  ],
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

# ===== معرّفُ المساهمة =====
# مشاركةٌ تتكلّم عن موادَّ كثيرة قد تُنقل إلى أكثر من مادّة (ردُّ student_NZ عن 101 و102 و214)،
# و‎ON CONFLICT (id)‎ يكتب فوق الأولى ولا يُنشئ الثانية. فالموادُّ التي نُقلت قبل هذا تبقى بمعرّفاتها
# (‎stk-p<id>‎)، وما بعدها يحمل رمزَ مادّته (‎stk-p<id>-engl102‎).
LEGACY = {'ACCT 210', 'IAS 111', 'ENGL 101', 'FIN 250'}

def pid_of(code, p, pre='stk-p'):
    return pre + str(p['id']) + ('' if code in LEGACY else '-' + code.replace(' ', '').lower())

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
            posts.append({'id': pid_of(code, p), 'uid': uid, 'code': code, 'sec': 'info',
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
            posts.append({'id': pid_of(code, p), 'uid': uid, 'code': code, 'sec': sec,
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
            posts.append({'id': pid_of(code, p, 'stk-%s-p' % sec), 'uid': uid, 'code': code, 'sec': sec,
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
                         'pid': pid_of(code, p), 'imp': imp})
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
