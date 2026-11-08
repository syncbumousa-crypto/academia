# -*- coding: utf-8 -*-
r"""
مواد تخصّصات كلّيّة الأعمال الستّة ⇐ كتالوج أكاديميا (خطط 2026 الرسميّة)

    python _catalog/business_2026.py <مجلّد ملفّات PDF>   ⇐ _catalog/out/business_2026.{json,sql}

المصدر: «New Undergraduate Programs Guide 2026» لكلّ تخصّص، من صفحته على kbs.kfupm.edu.sa،
والملفّاتُ لا تُحفظ في المستودع (١٦ ميجا) — تُنزَّل من:
  https://kbs.kfupm.edu.sa/wp-content/uploads/2026/09/<اسمُ الملفّ في MAJORS>
ولكلّ تخصّصٍ مسارا تخرّج (تدريبٌ صيفيّ / تعاونيّ): تُجمع موادُّهما معًا.

===== الإجباريّةُ والاختياريّة =====
الخطط تسمّي الإجباريّةَ برموزها، وتكتب الاختياريّةَ خاناتٍ لا رموزًا (Major / Free / GS /
IAS Elective). فلا تُعرف الاختياريّةُ بأسمائها إلّا ما وصفته الخطّةُ بنفسها وليس في جدولها:
‏‎DSMM 465‎ وحدَها («Management-Elective»).

===== ما في الملفّات من أخطاء — ويُصحَّح ههنا =====
  · ‏‎ACTT 110‎ في خطّتي التسويق الرقميّ والتقنيّة الماليّة ⇐ ‎ACCT 110‎
  · ‏‎BAI 399‎ في مسار التدريب الصيفيّ للتسويق الرقميّ ⇐ تدريبُه ‎DSMM 399‎ (المذكورُ معه)
  · ‏‎DSMM 350‎ في وصف المواد بعنوان ‎DSMM 365‎ نفسِه («Creating Digital Experiences &
    Journeys») ⇐ هي ‎DSMM 365‎ التي في الجدول، فلا تُضاف مادّةً ثانية
"""
import io, os, re, sys, json, subprocess, time

MAJORS = {'acf': 'New-BS-Programs_BS-in-Accounting-Corporate-Finance_2026-1.pdf',
          'ffe': 'New-BS-Programs_BS-in-Finance-Financial-Engineering_2026.pdf',
          'dsmm': 'New-BS-Programs_BS-Digital-and-Social-Media-Marketing_2026.pdf',
          'fte': 'New-BS-Programs_BS-Fintech-and-Entrepreneurship_2026.pdf',
          'baai': 'New-BS-Programs_BS-Business-Analytics-and-AI_2026.pdf',
          'osc': 'New-BS-Programs_BS-Operations-and-Supply-Chain_2026.pdf'}
FIX = {'ACTT 110': 'ACCT 110'}
DROP = {('dsmm', 'BAI 399')}
NAMED_ELECTIVES = {'dsmm': {'DSMM 465': ('E-Tailing & Omni channel Management', 3, 0, 3)}}

# بادئةُ القسم العربيّة (ما لم يكن في الكتالوج قبلُ)
DEPT_AR = {'ACF': 'محاسبة وتمويل', 'BAI': 'تحليلات', 'DSMM': 'تسويق رقمي', 'FFE': 'هندسة مالية',
           'FNT': 'تقنية مالية', 'OSC': 'سلاسل إمداد', 'ENTR': 'ريادة', 'ECON': 'اقتصاد',
           'MATH': 'رياضيات', 'ISE': 'صناعية', 'IAS': 'اسلامي'}
# الاسمُ العربيُّ الكامل للمواد الجديدة
FULL_AR = {
 'ACF 398': 'التدريب التعاوني', 'ACF 399': 'التدريب الصيفي', 'ACF 411': 'مشروع التخرّج ١', 'ACF 412': 'مشروع التخرّج ٢',
 'BAI 220': 'نظم معلومات الأعمال والأنظمة الرقمية', 'BAI 221': 'أساسيات تحليلات الأعمال', 'BAI 300': 'الذكاء الاصطناعي التطبيقي في الأعمال',
 'BAI 311': 'تصوير البيانات وسرد القصص بها', 'BAI 312': 'نظم ذكاء الأعمال', 'BAI 321': 'تحليلات الأداء بالذكاء الاصطناعي',
 'BAI 331': 'التخطيط الاستراتيجي للأهداف', 'BAI 332': 'تحليلات القوى العاملة والذكاء الاصطناعي', 'BAI 398': 'التدريب التعاوني',
 'BAI 399': 'التدريب الصيفي', 'BAI 404': 'الأمن السيبراني في الأعمال', 'BAI 411': 'مشروع التخرّج ١', 'BAI 412': 'مشروع التخرّج ٢',
 'BAI 421': 'الذكاء الاصطناعي المسؤول', 'BAI 460': 'دراسات حالة في تحليلات الأعمال',
 'DSMM 302': 'أساسيات التسويق الرقمي وعبر وسائل التواصل', 'DSMM 305': 'سلوك المستهلك في العصر الرقمي',
 'DSMM 310': 'التسويق الفيروسي والتأثير الرقمي', 'DSMM 320': 'إدارة أزمات وسائل التواصل الاجتماعي',
 'DSMM 330': 'تحليلات التسويق واتخاذ القرار الحسابي', 'DSMM 340': 'هندسة المحتوى وإدارة العلامة الرقمية',
 'DSMM 365': 'تصميم التجارب والرحلات الرقمية', 'DSMM 398': 'التدريب التعاوني', 'DSMM 399': 'التدريب الصيفي',
 'DSMM 400': 'استراتيجية التسويق الرقمي وعبر وسائل التواصل', 'DSMM 410': 'دراسات حالة في التسويق الرقمي',
 'DSMM 411': 'مشروع التخرّج ١', 'DSMM 412': 'مشروع التخرّج ٢', 'DSMM 465': 'التجارة الإلكترونية وإدارة القنوات المتعددة',
 'DSMM 475': 'الاتصالات التسويقية المتكاملة وإدارة الأداء',
 'ECON 205': 'أسس الاقتصاد القياسي', 'ENTR 250': 'الشركات الناشئة الرشيقة: التعهيد الجماعي وتصميم نموذج العمل',
 'ENTR 399': 'التدريب الصيفي', 'ENTR 411': 'مشروع التخرّج ١', 'ENTR 412': 'مشروع التخرّج ٢',
 'FFE 320': 'تحليل السلاسل الزمنية والمراجحة الإحصائية', 'FFE 333': 'تعلّم الآلة في المالية', 'FFE 335': 'تحليل الأوراق المالية وتحسين المحافظ',
 'FFE 336': 'نمذجة أسعار الفائدة ومخاطر الائتمان', 'FFE 337': 'دراسات حالة في الاستثمار والتحليل الفني', 'FFE 338': 'إدارة المخاطر الكمية',
 'FFE 398': 'التدريب التعاوني', 'FFE 399': 'التدريب الصيفي', 'FFE 411': 'مشروع التخرّج ١', 'FFE 412': 'مشروع التخرّج ٢',
 'FFE 440': 'البنية الدقيقة للأسواق والتداول الخوارزمي',
 'FNT 230': 'مقدمة في التقنية المالية', 'FNT 330': 'تنظيمات التقنية المالية والامتثال', 'FNT 340': 'النمذجة المالية والمحاكاة',
 'FNT 360': 'التمويل اللامركزي والبلوك تشين ومنصات التقنية المالية', 'FNT 398': 'التدريب التعاوني', 'FNT 430': 'التمويل السلوكي',
 'IAS 121': 'أسس اللغة', 'ISE 402': 'أنظمة الإنتاج ومراقبة المخزون', 'ISE 443': 'هندسة العوامل البشرية', 'ISE 470': 'نمذجة أنظمة سلاسل الإمداد',
 'MATH 101': 'حساب التفاضل والتكامل ١', 'MATH 102': 'حساب التفاضل والتكامل ٢', 'MATH 208': 'المعادلات التفاضلية والجبر الخطي',
 'MATH 210': 'الرياضيات المتقطعة', 'MATH 416': 'العمليات العشوائية في المالية', 'MATH 476': 'الطرق الحسابية في المالية',
 'OSC 210': 'مقدمة في العمليات وسلاسل الإمداد', 'OSC 310': 'الذكاء الاصطناعي للتنبؤ وتخطيط العمليات', 'OSC 320': 'أنظمة المؤسسات الذكية',
 'OSC 331': 'التوريد والمشتريات', 'OSC 340': 'تحليلات القرار والمخاطر', 'OSC 398': 'التدريب التعاوني', 'OSC 399': 'التدريب الصيفي',
 'OSC 410': 'تحليلات التميّز في الأداء', 'OSC 411': 'مشروع التخرّج ١', 'OSC 412': 'مشروع التخرّج ٢', 'OSC 450': 'العمليات المستدامة',
 'OSC 460': 'دراسات حالة في العمليات وسلاسل الإمداد'}
PROJECT = re.compile(r'Senior Project|Internship|Summer Train')

CODE = re.compile(r'^([A-Z]{2,5}) ?(\d{3})\b(.*)$')
NUM = re.compile(r'(.*?)\s*(\d)\s+(\d)\s+(\d)\s*$')

def parse(pdf):
    raw = subprocess.run(['pdftotext', '-raw', pdf, '-'], capture_output=True, text=True).stdout
    i = raw.find('Degree Plan'); j = raw.find('Flowcharts')
    lines = [l.strip() for l in raw[max(0, i - 3000):j].split('\n') if l.strip()]
    rows = {}; k = 0
    while k < len(lines):
        m = CODE.match(lines[k])
        if not m: k += 1; continue
        code = FIX.get(f'{m.group(1)} {m.group(2)}', f'{m.group(1)} {m.group(2)}'); rest = m.group(3).strip()
        if rest.startswith('-'):
            cr = re.search(r'\((\d) ?Cr\)', rest)
            rows.setdefault(code, ('Summer Training', 0, 0, int(cr.group(1)) if cr else 1)); k += 1; continue
        title, got, kk, buf = [], None, k, rest
        while True:
            mm = NUM.match(buf) if buf else None
            if mm: title.append(mm.group(1)); got = tuple(int(mm.group(x)) for x in (2, 3, 4)); break
            if buf: title.append(buf)
            kk += 1
            if kk >= len(lines) or kk - k > 4 or CODE.match(lines[kk]): break
            buf = lines[kk]
        t = ' '.join(x for x in title if x).strip()
        if got and t and not re.match(r'^(TOTAL|Course)', t):
            if code not in rows or len(t) > len(rows[code][0]): rows[code] = (t,) + got
        k = kk + 1 if got else k + 1
    return rows

def q(s): return "'" + str(s).replace("'", "''") + "'"

def main(src, live_json):
    live = {c['code']: c for c in json.load(open(live_json, encoding='utf-8'))}
    courses, links = {}, {}
    for tag, f in MAJORS.items():
        rows = parse(os.path.join(src, f))
        for code, r in list(rows.items()) + list(NAMED_ELECTIVES.get(tag, {}).items()):
            if (tag, code) in DROP: continue
            courses.setdefault(code, r)
            links.setdefault(code, []).append(tag)
    new = {}
    for code, (title, lt, lb, cr) in sorted(courses.items()):
        if code in live: continue
        dept, num = code.split()
        if code not in FULL_AR: sys.exit('لا اسمَ عربيًّا لـ ' + code)
        lab = 1 if lb > 0 and lt > 0 and not PROJECT.search(title) else 0
        new[code] = {'code': code, 'ar': f'{DEPT_AR.get(dept, dept)} {num}', 'full': FULL_AR[code], 'en': title, 'h': cr, 'lab': lab}
    os.makedirs(os.path.join(os.path.dirname(__file__), 'out'), exist_ok=True)
    base = os.path.join(os.path.dirname(__file__), 'out', 'business_2026')
    json.dump({'new': new, 'links': links}, io.open(base + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    L = ['-- مواد تخصّصات كلّيّة الأعمال (خطط 2026) ⇐ الكتالوج · ولَّده _catalog/business_2026.py',
         '-- يُعاد بلا ضرر: ON CONFLICT لا يكرّر ولا يمسّ مادّةً قائمة.', 'BEGIN;']
    for c in new.values():
        L.append('INSERT INTO courses (code, ar, "full", h, lab) VALUES (%s, %s, %s, %d, %d) ON CONFLICT (code) DO NOTHING;'
                 % (q(c['code']), q(c['ar']), q(c['full']), c['h'], c['lab']))
    for code, tags in sorted(links.items()):
        for t in sorted(set(tags)):
            L.append('INSERT INTO course_tags (code, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;' % (q(code), q(t)))
    L.append("UPDATE meta SET v = '%d' WHERE k = 'catalog_rev';" % int(time.time() * 1000))
    L.append('COMMIT;')
    io.open(base + '.sql', 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    n_links = sum(len(set(v)) for v in links.values())
    print('مواد التخصّصات: %d · موجودةٌ في الكتالوج: %d · جديدة: %d · روابط: %d'
          % (len(courses), len(courses) - len(new), len(new), n_links))
    for t in MAJORS: print('  %-5s %d مادّة' % (t, sum(1 for v in links.values() if t in v)))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
