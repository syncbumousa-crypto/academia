"""Course type per major ("نوعية المواد") for every catalog link.

Counted, not read from the plans' headings (which differ from plan to
plan): how many majors require the course.

  common   مواد مشتركة  required by at least two thirds of all majors
                        (ENGL, IAS 111/121/212, MATH 101/102, PE 101, ...)
  college  مواد كلية    not common, and: required by more than half the
                        majors of the same college; or a 100/200-level
                        math/science course (MATH, STAT, PHYS, CHEM, BIOL);
                        or listed in the plan's own college section
                        ("College Core Requirements", "Math & Science
                        Requirements", "General Engineering Fundamentals")
  major    مواد تخصص    the rest of the major's plan, and any plan course from
                        the major's own subject (HOME), even a common or
                        college one: MKT 250 is a college course, but a major
                        course for Marketing; MATH 101 is common, but a major
                        course for Mathematics
  elective مواد اختيارية linked to the major but not in its plan
  OVERRIDE              decisions taken by hand on the borderline cases

Plans: data/plan_sections_bulletin.json (sections + MIS plan from the
bulletin), data/plans_ccm_bulletin.json, data/plans_colleges_bulletin.json,
data/plans_oldbiz_bulletin.json,
out/business_2026.json.

  python3 _catalog/kinds_2026.py <live_catalog.json>
  -> _catalog/out/kinds_2026.{json,sql}
"""
import json, os, sys, time, collections

HERE = os.path.dirname(os.path.abspath(__file__))
J = lambda *p: json.load(open(os.path.join(HERE, *p), encoding='utf-8'))
SECT = J('data', 'plan_sections_bulletin.json')
LIVE = J(sys.argv[1]) if os.path.isabs(sys.argv[1]) else json.load(open(sys.argv[1], encoding='utf-8'))

COLLEGES = [
    ['mis', 'acf', 'ffe', 'dsmm', 'fte', 'baai', 'osc', 'acct', 'fin', 'mgt', 'mkt', 'hrm'],
    ['cs', 'swe', 'coe', 'ise', 'amai', 'dse', 'sde', 'aics', 'math', 'asfm'],
    ['che', 'mse', 'chem', 'bioe', 'bioepm'],
    ['pete', 'geop', 'geol', 'mine'],
    ['ce', 'are', 'idsn', 'ssc', 'ese'],
    ['ae', 'ee', 'me', 'phys', 'cie', 'eep'],
]
COMMON_SECTIONS = {'General Studies Requirements', 'Digital/Business Foundation'}
COLLEGE_SECTIONS = {'College Core Requirements', 'Math & Science Requirements',
                    'General Engineering Fundamentals'}
ELECTIVE_SECTIONS = {'Electives'}
SCIENCE = {'MATH', 'STAT', 'PHYS', 'CHEM', 'BIOL'}   # math & science, where a plan has no sections

# plan (required) courses per major
core = collections.defaultdict(set)
for f in ('plans_ccm_bulletin.json', 'plans_colleges_bulletin.json', 'plans_oldbiz_bulletin.json'):
    for tag, plan in J('data', f).items():
        core[tag] |= set(plan['core'])
for code, tags in J('out', 'business_2026.json')['links'].items():
    for tag in tags:
        core[tag].add(code)
core['dsmm'].discard('DSMM 465')          # the one elective the DSMM plan names
core['mis'] |= set(SECT['_mis_core']) | set(J('data', 'plans_mis_bulletin.json')['mis']['core'])

college_of = {t: i for i, g in enumerate(COLLEGES) for t in g}
MAJORS = [t for g in COLLEGES for t in g]
uni = collections.Counter(c for t in MAJORS for c in core[t])
share = collections.Counter((college_of[t], c) for t in MAJORS for c in core[t])
COMMON = {c for c, n in uni.items() if 3 * n >= 2 * len(MAJORS)}
OVERRIDE = {}   # (code, tag) -> kind, or (code, '*') for every major
# the major's own subject prefixes: a college course from them is the major's own course
# (MKT 250 is a college course for Business majors, a major course for Marketing)
HOME = {'mis': ['MIS'], 'acf': ['ACF', 'ACCT'], 'ffe': ['FFE', 'FIN'], 'dsmm': ['DSMM', 'MKT'], 'fte': ['FNT', 'ENTR'],
        'baai': ['BAI'], 'osc': ['OSC', 'OM'], 'acct': ['ACCT'], 'fin': ['FIN'], 'mgt': ['MGT'], 'mkt': ['MKT'],
        'hrm': ['HRM'], 'cs': ['ICS'], 'swe': ['SWE'], 'coe': ['COE'], 'ise': ['ISE'], 'amai': ['MATH'],
        'dse': ['DATA'], 'sde': ['SDE'], 'aics': ['AISC'], 'math': ['MATH'], 'asfm': ['AS'], 'che': ['CHE'],
        'mse': ['MSE'], 'chem': ['CHEM'], 'bioe': ['BIOE'], 'bioepm': ['BIOE'], 'pete': ['PETE'], 'geop': ['GEOP'],
        'geol': ['GEOL'], 'mine': ['MINE'], 'ce': ['CE'], 'are': ['ARE'], 'idsn': ['ITD'], 'ssc': ['SSC'],
        'ese': ['ESE'], 'ae': ['AE'], 'ee': ['EE'], 'me': ['ME'], 'phys': ['PHYS'], 'cie': ['CIE'],
        'eep': ['EE', 'PHYS']}


def in_college_section(code, tag):
    return any(name in COLLEGE_SECTIONS and code in codes for name, codes in SECT.get(tag, {}).items())


def kind(code, tag):
    k = OVERRIDE.get((code, tag)) or OVERRIDE.get((code, '*'))
    if k and (k == 'elective' or code in core[tag]):
        return k
    if code not in core[tag]:
        return 'elective'
    g = college_of[tag]
    p, n = code.split()
    if p in HOME[tag]:          # before common: MATH 101 is a major course for Mathematics
        return 'major'
    if code in COMMON:
        return 'common'
    if (share[(g, code)] * 2 > len(COLLEGES[g]) or (p in SCIENCE and n[0] in '12')
            or in_college_section(code, tag)):
        return 'college'
    return 'major'


rows = []
for c in LIVE['courses']:
    for t in c['tags']:
        rows.append((c['code'], t, kind(c['code'], t)))

q = lambda s: "'" + s.replace("'", "''") + "'"
sql = ['BEGIN;', 'ALTER TABLE course_tags ADD COLUMN IF NOT EXISTS kind TEXT;']
by = collections.defaultdict(list)
for code, t, k in rows:
    by[(t, k)].append(code)
for (t, k), codes in sorted(by.items()):
    sql.append('UPDATE course_tags SET kind = %s WHERE tag_id = %s AND code IN (%s);'
               % (q(k), q(t), ', '.join(q(c) for c in codes)))
sql += ["UPDATE meta SET v = '%d' WHERE k = 'catalog_rev';" % (time.time() * 1000), 'COMMIT;']

out = os.path.join(HERE, 'out')
json.dump([list(r) for r in rows], open(os.path.join(out, 'kinds_2026.json'), 'w', encoding='utf-8'), ensure_ascii=False)
open(os.path.join(out, 'kinds_2026.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
tab = collections.defaultdict(collections.Counter)
for _, t, k in rows:
    tab[t][k] += 1
for t in [x for g in COLLEGES for x in g]:
    print(t, dict(tab[t]))
