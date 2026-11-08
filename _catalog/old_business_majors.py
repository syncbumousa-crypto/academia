"""The Business School's earlier BS programs, added as majors:
Accounting, Finance, Management, Marketing, Human Resource Management.

Plans: the bulletin's program pages, summer-training and internship
options (acct 84,1153 · fin 106,1152 · mgt 111,1150 · mkt 113,1151 ·
hrm 1148,1149) -> data/plans_oldbiz_bulletin.json.

Every plan course is linked to its major, and the slots:
  ACCT/FIN/ECON/MGT/MKT/HRM 3/4xx  -> the Registrar's Course Offering
                                      (202520-202630), lectures only
  MGT 311/313                      -> both
  IAS 3/4xx, GS xxx                -> as for every major
  XXX 3/4xx Business Elective      -> any 300/400-level Business School
                                      course, the rule MIS and the 2026
                                      majors with this slot follow

New majors go after Operations & Supply Chain in the filter.

  python3 _catalog/old_business_majors.py <live_catalog.json>
  -> _catalog/out/old_business_majors.{json,sql}
"""
import json, os, re, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
D = lambda f: json.load(open(os.path.join(HERE, 'data', f), encoding='utf-8'))
PLANS, OFF, BUL = D('plans_oldbiz_bulletin.json'), D('offering_202520-202630.json'), D('bulletin_ug.json')
LIVE = {c['code']: c for c in json.load(open(sys.argv[1], encoding='utf-8'))['courses']}

NEW_TAGS = [('acct', 'المحاسبة', 'Accounting'), ('fin', 'المالية', 'Finance'),
            ('mgt', 'الإدارة', 'Management'), ('mkt', 'التسويق', 'Marketing'),
            ('hrm', 'إدارة الموارد البشرية', 'Human Resource Management')]
GEN = [('IAS', '34'), ('GS', '1234')]
SLOTS = {'acct': [('ACCT', '34')], 'fin': [('FIN', '34'), ('ECON', '34')], 'mgt': [('MGT', '34')],
         'mkt': [('MKT', '34')], 'hrm': [('HRM', '34')]}
NAMED = ['MGT 311', 'MGT 313']
SCHOOL = {'ACCT', 'FIN', 'MGT', 'MKT', 'MIS', 'OM', 'HRM', 'ECON', 'ENTR', 'BUS',
          'ACF', 'BAI', 'DSMM', 'FFE', 'FNT', 'OSC'}
REGULAR = {'LEC', 'LAB', 'LLB'}
NOT_ELECTIVE = re.compile(r'senior|internship|summer training|cooperative|co-op|thesis|seminar|independent|'
                          r'team design|تدريب|مشروع|رسالة|بحث مستقل|سمنار|ندوة|تعاوني', re.I)
PROJECT_OR_TRAINING = re.compile(r'senior|project|internship|summer training|seminar', re.I)

DEPT_AR = {'ACCT': 'محاسبة', 'FIN': 'مالية', 'HRM': 'موارد بشرية', 'MGT': 'إدارة', 'MKT': 'تسويق',
           'MIS': 'نظم', 'OM': 'عمليات', 'STAT': 'احصاء'}
TRAIN = {'398': 'التدريب التعاوني', '399': 'التدريب الصيفي'}
FULL_AR = {
    'ACCT 477': 'مشروع التخرّج ١', 'ACCT 478': 'مشروع التخرّج ٢',
    'FIN 477': 'مشروع التخرّج ١', 'FIN 478': 'مشروع التخرّج ٢',
    'HRM 477': 'مشروع التخرّج ١', 'HRM 478': 'مشروع التخرّج ٢',
    'MIS 101': 'حوسبة الأعمال', 'MIS 215': 'مبادئ نظم المعلومات الإدارية',
    'OM 201': 'الأساليب الإحصائية للإدارة ١',
    'STAT 211': 'الإحصاء للأعمال ١', 'STAT 212': 'الإحصاء للأعمال ٢',
    'MGT 313': 'البيئة القانونية الدولية',
}


def fits(code, slots):
    p, n = code.split()
    return any(p == sp and n[0] in lv for sp, lv in slots)


def name_of(code):
    return (OFF.get(code) or BUL.get(code) or {}).get('name', '')


core_all, links = {}, {}
for tag, plan in PLANS.items():
    for code, d in plan['core'].items():
        core_all.setdefault(code, d)
        links.setdefault(code, set()).add(tag)
    for code in sorted(OFF):
        if code in plan['core'] or not fits(code, SLOTS[tag] + GEN):
            continue
        if not set(OFF[code]['act']) <= REGULAR or NOT_ELECTIVE.search(OFF[code]['name']):
            continue
        links.setdefault(code, set()).add(tag)
    for code in NAMED:
        if code in OFF or code in BUL or code in LIVE:
            links.setdefault(code, set()).add(tag)

# Business Elective pool, from the catalog plus what this script adds
pool = set(LIVE) | set(links)
for code in sorted(pool):
    p, n = code.split()
    if p not in SCHOOL or n[0] not in '34':
        continue
    c = LIVE.get(code, {})
    if NOT_ELECTIVE.search(' '.join((c.get('full', ''), c.get('ar', ''), name_of(code)))):
        continue
    for tag in PLANS:
        links.setdefault(code, set()).add(tag)

new, rows, missing = [], [], []
for code in sorted(links):
    if code not in LIVE:
        d = core_all.get(code) or BUL.get(code)
        p, n = code.split()
        full = FULL_AR.get(code) or TRAIN.get(n)
        if not full or not d:
            missing.append(code)
            continue
        lab = d['lb'] > 0 and d['lt'] > 0 and not PROJECT_OR_TRAINING.search(d['name'])
        new.append(dict(code=code, ar=f'{DEPT_AR[p]} {n}', full=full, h=d['cr'], lab=int(lab)))
    for t in sorted(links[code]):
        rows.append((code, t))
if missing:
    sys.exit('missing name/hours: ' + ', '.join(missing))

q = lambda s: "'" + s.replace("'", "''") + "'"
sql = ['BEGIN;',
       "UPDATE tags SET ord = ord + %d WHERE ord > (SELECT ord FROM tags WHERE id = 'osc') "
       "AND NOT EXISTS (SELECT 1 FROM tags WHERE id = %s);" % (len(NEW_TAGS), q(NEW_TAGS[0][0]))]
for i, (tid, ar, en) in enumerate(NEW_TAGS, 1):
    sql.append("INSERT INTO tags (id, ar, en, ord) SELECT %s, %s, %s, ord + %d FROM tags WHERE id = 'osc' "
               "ON CONFLICT (id) DO NOTHING;" % (q(tid), q(ar), q(en), i))
sql += ['INSERT INTO courses (code, ar, "full", h, lab) VALUES (%s, %s, %s, %d, %d) ON CONFLICT (code) DO NOTHING;'
        % (q(c['code']), q(c['ar']), q(c['full']), c['h'], c['lab']) for c in new]
sql += ['INSERT INTO course_tags (code, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;' % (q(a), q(b)) for a, b in rows]
sql += ["UPDATE meta SET v = '%d' WHERE k = 'catalog_rev';" % (time.time() * 1000), 'COMMIT;']

out = os.path.join(HERE, 'out')
json.dump({'new': new, 'links': rows}, open(os.path.join(out, 'old_business_majors.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
open(os.path.join(out, 'old_business_majors.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
print('courses', len(links), 'new', len(new), 'links', len(rows),
      {t: sum(1 for v in links.values() if t in v) for t in PLANS})
