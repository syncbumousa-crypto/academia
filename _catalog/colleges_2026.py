"""Courses of the remaining colleges' majors (engineering, chemicals &
materials, petroleum & geosciences, design & built environment).

Plans: the undergraduate bulletin's program pages (both internship and
summer-training options where a program has two):

  che 88,96 · mse 114 · chem 97 · bioe 94,95 · pete 117 · geop 108
  geol 107 · mine 1132 · ce 89,98 · are 92,93 · idsn 121 · ese 122
  ae 86,87 · ee 90,105 · me 91,116 · phys 118 · cie 103,104 · eep 120

and, for the two majors the bulletin does not list, the department's
published plan image (typed in, see "source" in the data file):

  ssc     acd.kfupm.edu.sa, BSc Smart & Sustainable Cities curriculum
  bioepm  bioe.kfupm.edu.sa, BIOE PreMed option flowchart

-> data/plans_colleges_bulletin.json

Every plan course is linked to its major. Elective slots that name a
prefix are filled from the Registrar's Course Offering, terms
202520-202630 (data/offering_*.json), lectures/labs only, no co-op,
internship, training, project, thesis or seminar; "xxx" is taken as
3xx/4xx. SSC electives also come from the bulletin (new prefix). Slots
naming specific courses link those courses. XE/XXX slots (Free,
Technical, Engineering, Science, CPG, ESE, Business, Computing
Electives) name no department and are not linked.

  python3 _catalog/colleges_2026.py <live_catalog.json>
  -> _catalog/out/colleges_2026.{json,sql}
"""
import json, os, re, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
D = lambda f: json.load(open(os.path.join(HERE, 'data', f), encoding='utf-8'))
PLANS, OFF, BUL = D('plans_colleges_bulletin.json'), D('offering_202520-202630.json'), D('bulletin_ug.json')
LIVE = {c['code']: c for c in json.load(open(sys.argv[1], encoding='utf-8'))['courses']}

GEN = [('IAS', '34'), ('GS', '1234')]
UP = '34'
SLOTS = {
    'che': [('CHE', '4')], 'mse': [('MSE', '4')], 'chem': [('CHEM', UP)], 'bioe': [('BIOE', '4')],
    'pete': [('PETE', '4'), ('GEOL', '3'), ('GEOP', UP)], 'geop': [], 'geol': [], 'mine': [('MINE', '4')],
    'ce': [('CE', UP), ('GEOL', '1234'), ('BIOL', '1234')],   # CE xxx; "GEOL/BIOL xxx Science Elective"
    'are': [('ARE', '4')], 'idsn': [('ITD', UP)], 'ese': [], 'ae': [('AE', UP)],
    'ee': [('EE', UP)], 'me': [('ME', '4')], 'phys': [('PHYS', UP)], 'cie': [('CIE', '4')],
    'eep': [('EE', UP), ('PHYS', UP)], 'ssc': [('SSC', '4')], 'bioepm': [('BIOE', '4')],
}
NAMED = {'ce': ['CE 441', 'CE 444', 'CE 455', 'CE 437', 'CE 471']}   # CE Design Elective I / II
FROM_BULLETIN = {'SSC'}
REGULAR = {'LEC', 'LAB', 'LLB'}
NOT_ELECTIVE = re.compile(r'senior|internship|summer training|cooperative|co-op|thesis|seminar|independent|team design', re.I)
PROJECT_OR_TRAINING = re.compile(r'senior|project|internship|summer training|seminar', re.I)

DEPT_AR = {'AE': 'طيران', 'ARC': 'عمارة', 'ARE': 'معمارية', 'BIOE': 'حيوية', 'BIOL': 'أحياء', 'CE': 'مدنية',
           'CHE': 'كيميائية', 'CHEM': 'كيمياء', 'CIE': 'تحكم', 'CPG': 'بترول وجيو', 'EE': 'كهربائية',
           'ENVS': 'بيئة', 'ESE': 'هندسة بيئة', 'GEO': 'جيو', 'GEOL': 'جيولوجيا', 'GEOP': 'جيوفيزياء',
           'ITD': 'تصميم', 'LS': 'علوم حياة', 'ME': 'ميكانيكية', 'MINE': 'تعدين', 'MSE': 'مواد', 'PETE': 'بترول',
           'PHYS': 'فيزياء', 'SSC': 'مدن ذكية', 'COE': 'هندسة حاسب', 'ICS': 'حاسب', 'MATH': 'رياضيات',
           'STAT': 'احصاء', 'ISE': 'صناعية', 'SWE': 'برمجيات'}
TRAIN = {'398': 'التدريب التعاوني', '399': 'التدريب الصيفي'}
FULL_AR = json.load(open(os.path.join(HERE, 'data', 'names_ar_colleges.json'), encoding='utf-8')) \
    if os.path.exists(os.path.join(HERE, 'data', 'names_ar_colleges.json')) else {}


def fits(code, slots):
    p, n = code.split()
    return any(p == sp and n[0] in lv for sp, lv in slots)


core_all, links = {}, {}
for tag, plan in PLANS.items():
    for code, d in plan['core'].items():
        core_all.setdefault(code, d)
        links.setdefault(code, set()).add(tag)
    pool = set(OFF) | {c for c in BUL if c.split()[0] in FROM_BULLETIN}
    for code in sorted(pool):
        if code in plan['core'] or not fits(code, SLOTS[tag] + GEN):
            continue
        if code in OFF and not set(OFF[code]['act']) <= REGULAR:
            continue
        if NOT_ELECTIVE.search((OFF.get(code) or BUL.get(code))['name']):
            continue
        links.setdefault(code, set()).add(tag)
    for code in NAMED.get(tag, []):
        links.setdefault(code, set()).add(tag)

new, rows, missing = [], [], {}
for code in sorted(links):
    if code not in LIVE:
        d = core_all.get(code) or BUL.get(code)
        p, n = code.split()
        nm = (d or {}).get('name', '')
        sp = re.search(r'senior (design )?project (I{1,2})\s*$', nm, re.I)
        full = FULL_AR.get(code) or TRAIN.get(n) or (sp and 'مشروع التخرّج ' + ('١' if sp[2].upper() == 'I' else '٢'))
        if not full or not d or d.get('name') == '?':
            missing[code] = (d or OFF.get(code) or {}).get('name', '?')
            continue
        lab = d['lb'] > 0 and d['lt'] > 0 and not PROJECT_OR_TRAINING.search(d['name'])
        new.append(dict(code=code, ar=f'{DEPT_AR[p]} {n}', full=full, h=d['cr'], lab=int(lab)))
    for t in sorted(links[code]):
        if not (code in LIVE and t in LIVE[code]['tags']):
            rows.append((code, t))
if missing:
    json.dump(missing, open(os.path.join(HERE, 'out', 'colleges_2026_missing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    sys.exit('missing Arabic name/hours: %d (out/colleges_2026_missing.json)' % len(missing))

q = lambda s: "'" + s.replace("'", "''") + "'"
sql = ['BEGIN;']
sql += ['INSERT INTO courses (code, ar, "full", h, lab) VALUES (%s, %s, %s, %d, %d) ON CONFLICT (code) DO NOTHING;'
        % (q(c['code']), q(c['ar']), q(c['full']), c['h'], c['lab']) for c in new]
sql += ['INSERT INTO course_tags (code, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;' % (q(a), q(b)) for a, b in rows]
sql += ["UPDATE meta SET v = '%d' WHERE k = 'catalog_rev';" % (time.time() * 1000), 'COMMIT;']

out = os.path.join(HERE, 'out')
os.makedirs(out, exist_ok=True)
json.dump({'new': new, 'links': rows, 'by_course': {k: sorted(v) for k, v in links.items()}},
          open(os.path.join(out, 'colleges_2026.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(out, 'colleges_2026.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
tot = {t: sum(1 for v in links.values() if t in v) for t in PLANS}
print('courses', len(links), 'new', len(new), 'new links', len(rows), 'per major', tot)
