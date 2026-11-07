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
INLINE_MAX = 200 * 1024          # ما دونه يسكن المتنَ ‎data:‎، وما فوقه جدولَ الوسائط
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
}

# ===== المصادر =====
# code ⇐ [(sec, topic id, post_number, files)] — ‏‎srcU‎ مصادرُ الفهم، و‎srcP‎ مصادرُ الممارسة.
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
}

# ===== توزيعُ الدرجات و«المواضيع» =====
# بندان بياناتُهما أرقامٌ وقوائمُ لا نصّ، فتُنقل كما ذكرها كاتبُها بألفاظه — لا تُستنتج.
# ‏‎grade‎: ‎[(اسمُ البند, النسبة)]‎ · ‏‎lessons‎: ‎[اسمُ الموضوع]‎ أو ‎(نمطُ أوّلِ سطر, عددُ الأسطر)‎ من نصّه
PICK_DATA = {
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
}
# code ⇐ [(topic id, post_number, doctor id)] — تقييماتُ هذه المادّة وحدَها.
# والردُّ الذي لا يقيّم («القريد هذا قريدك؟») لا يُنقل، ولا تقييمُ مادّةٍ أخرى.
PICK_DOC = {
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
         'boxing_glove': '🥊', 'nerd_face': '🤓',
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
            desc = text_of(p['cooked'])
            if keep:
                ls = desc.split('\n')
                i = next(k for k, l in enumerate(ls) if re.search(keep[0], l, re.I))
                desc = '\n'.join(ls[i:i + keep[1]])
            data = {'desc': desc, 'type': '', 'rel': 0, 'lang': '', 'book': book, 'imp': imp}
            posts.append({'id': 'stk-p%d' % p['id'], 'uid': uid, 'code': code, 'sec': 'info',
                          'ts': imp['ts'], 'st': 'pub', 'data': data})
        # ---- «المصادر»: نصُّ الكاتب أسطرًا، وملفُّه في موضع مرفقه
        for sec, tid, num, files in PICK_SRC.get(code, []):
            t, p = load_post(src, cache, tid, num)
            uid = author(users, p)
            imp = imp_of(t, p)
            lines = text_of(p['cooked']).split('\n')
            html, fobj = [], {}
            for line in lines:
                hit = next((f for f in files if re.search(f[2], line)), None)
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
                         'd': text_of(p['cooked']), 'hours': [], 'teach': 0, 'grade': 0,
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
