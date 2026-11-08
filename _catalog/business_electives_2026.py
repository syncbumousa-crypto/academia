"""Electives of the six KFUPM Business School majors (2026 plans).

The plans give an elective as a slot with a prefix and a level only, e.g.
"ACCT/FIN 3/4xx Major Elective", "BAI 4xx", "OSC/ISE 3/4XX", "IAS 3/4xx",
"GS xxx". This links to each major every course that fills one of its
slots, taken from:

  data/offering_202520-202630.json  the Registrar's Course Offering
      (registrar.kfupm.edu.sa/courses-classes/course-offering1/), terms
      202520, 202530, 202610, 202620 and 202630, departments ACFN, ISOM,
      MGT, GS, IAS and ISE; only lecture/lab courses (no co-op,
      internship, summer training, projects, theses, seminars).
  data/bulletin_ug.json  the undergraduate bulletin
      (bulletin.kfupm.edu.sa/course-details?subject_code=XXX), for credit
      hours and for the new BAI prefix, whose 4xx electives are in the
      bulletin but not offered yet.

Slots with no prefix ("XXX 3/4xx Business/Free Elective") and the FFE
"CXX 3/4xx Computing Elective" name no single prefix, so they are not
linked.

  python3 _catalog/business_electives_2026.py <live_catalog.json>
  -> _catalog/out/business_electives_2026.{json,sql}
"""
import json, os, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
OFF = json.load(open(os.path.join(HERE, 'data/offering_202520-202630.json'), encoding='utf-8'))
BUL = json.load(open(os.path.join(HERE, 'data/bulletin_ug.json'), encoding='utf-8'))
LIVE = {c['code']: c for c in json.load(open(sys.argv[1], encoding='utf-8'))['courses']}

GEN = [('IAS', '34'), ('GS', '1234')]          # in every plan
SLOTS = {
    'acf':  [('ACCT', '34'), ('FIN', '34')] + GEN,   # ACCT/FIN 3/4xx
    'ffe':  [('FIN', '34'), ('ECON', '34')] + GEN,   # FIN 3/4xx, ECON 3/4xx
    'baai': [('BAI', '4')] + GEN,                    # BAI 4xx
    'osc':  [('OSC', '34'), ('ISE', '34')] + GEN,    # OSC/ISE 3/4xx
    'dsmm': GEN,
    'fte':  GEN,
}
REGULAR = {'LEC', 'LAB', 'LLB'}
NOT_ELECTIVE = ('Senior Project', 'Internship', 'Summer Training', 'Cooperative', 'Thesis', 'Seminar')

DEPT_AR = {'GS': 'عام', 'ISE': 'صناعية', 'BAI': 'تحليلات'}
FULL_AR = {
    'GS 357': 'الذكاء الاصطناعي والمجتمع',
    'GS 363': 'مقدّمة في القيادة',
    'GS 372': 'مبادئ إدارة المنظّمات غير الربحية',
    'GS 445': 'إدارة الطاقة وسياساتها',
    'ISE 303': 'بحوث العمليات ١',
    'ISE 307': 'التحليل الاقتصادي الهندسي',
    'ISE 315': 'الإحصاء الهندسي',
    'ISE 320': 'ضبط الجودة والإحصاء الصناعي',
    'ISE 321': 'طرق الأمثلة',
    'ISE 324': 'تحسين العمل والعمليات',
    'ISE 391': 'تصميم الهندسة الصناعية',
    'ISE 405': 'محاكاة الأنظمة العشوائية',
    'ISE 420': 'أساليب تحسين الجودة',
    'ISE 422': 'تخطيط المرافق ومواقعها',
    'ISE 440': 'إدارة المشاريع الهندسية',
    'ISE 447': 'اتّخاذ القرار',
    'ISE 449': 'موضوعات خاصّة في تصميم الهندسة الصناعية',
    'ISE 453': 'أمثلة التصميم',
    'ISE 455': 'نماذج تطبيقية للقرارات المثلى',
    'ISE 460': 'إعادة هندسة العمليات الصناعية',
    'ISE 465': 'السلامة الصناعية',
    'ISE 468': 'مقدّمة في تعلّم الآلة وتحليل البيانات',
    'ISE 472': 'أنظمة الإمداد والنقل',
    'ISE 487': 'تقنيات التحليلات التنبّؤية',
    'ISE 491': 'موضوعات خاصّة في بحوث العمليات',
    'BAI 420': 'حوكمة بيانات الأداء',
    'BAI 422': 'تحليلات أداء المنصّات',
    'BAI 431': 'استراتيجية التحليلات وتحوّل الأداء',
    'BAI 432': 'تحليلات المخاطر والامتثال',
    'BAI 433': 'تحليلات أداء العمليات',
    'BAI 434': 'تصميم التجارب والتحليلات السببية',
}


def fits(code, slots):
    p, n = code.split()
    return any(p == sp and n[0] in lv for sp, lv in slots)


def is_elective(code):
    name = (OFF.get(code) or BUL.get(code) or {}).get('name', '')
    if code in OFF and not set(OFF[code]['act']) <= REGULAR:
        return False
    return not any(w.lower() in name.lower() for w in NOT_ELECTIVE)


links = {}   # code -> [tags]
for tag, slots in SLOTS.items():
    pool = set(OFF) | {c for c in BUL if c.split()[0] == 'BAI'}
    for code in sorted(pool):
        if fits(code, slots) and is_elective(code):
            links.setdefault(code, []).append(tag)

new, rows = [], []
for code, tags in sorted(links.items()):
    if code not in LIVE:
        b = BUL[code]
        p, n = code.split()
        lab = b['lb'] > 0 and b['lt'] > 0
        new.append(dict(code=code, ar=f'{DEPT_AR[p]} {n}', full=FULL_AR[code], h=b['cr'], lab=lab))
    for t in tags:
        if not (code in LIVE and t in LIVE[code]['tags']):
            rows.append((code, t))

q = lambda s: "'" + s.replace("'", "''") + "'"
sql = ['BEGIN;']
for c in new:
    sql.append('INSERT INTO courses (code, ar, "full", h, lab) VALUES (%s, %s, %s, %d, %d) ON CONFLICT (code) DO NOTHING;'
               % (q(c['code']), q(c['ar']), q(c['full']), c['h'], 1 if c['lab'] else 0))
for code, t in rows:
    sql.append('INSERT INTO course_tags (code, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;' % (q(code), q(t)))
sql.append("UPDATE meta SET v = '%d' WHERE k = 'catalog_rev';" % (time.time() * 1000))
sql.append('COMMIT;')

out = os.path.join(HERE, 'out')
os.makedirs(out, exist_ok=True)
json.dump({'new': new, 'links': rows, 'by_course': links}, open(os.path.join(out, 'business_electives_2026.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(out, 'business_electives_2026.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
per = {}
for _, t in rows:
    per[t] = per.get(t, 0) + 1
print('courses', len(links), 'new', len(new), 'new links', len(rows), per)
