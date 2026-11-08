"""Course type per major ("نوعية المواد") for every catalog link.

  common   مواد مشتركة  the university-wide requirements: the bulletin's
                        "General Studies Requirements" and
                        "Digital/Business Foundation" (ENGL, IAS 111/121/212,
                        CGS 392, PE 101, ICS 104, ISE 291, COE 292, BUS 200)
  college  مواد كلية    the plan's college-level sections ("Math & Science
                        Requirements", "General Engineering Fundamentals",
                        ...); for plans without sections (the 2026 Business
                        School PDFs, SSC, BIOE PreMed) a required course that
                        is required by at least half the majors of the same
                        college
  major    مواد تخصص    the rest of the plan's required courses
                        ("Core Requirements", summer training, internship, ...)
  elective مواد اختيارية every course linked to the major that is not in its
                        plan (elective slots, the Business Elective pool, MIS's
                        seed list)

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
COLLEGE_SECTIONS = {'College Core Requirements', 'Math & Science Requirements', 'General Engineering Fundamentals',
                    'Math, Science & Physics', 'Economics & Accounting'}
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
core['mis'] |= set(SECT['_mis_core'])

COMMON = set()
for tag, secs in SECT.items():
    if tag.startswith('_'):
        continue
    for name, codes in secs.items():
        if name in COMMON_SECTIONS:
            COMMON |= set(codes)

college_of = {t: i for i, g in enumerate(COLLEGES) for t in g}
share = collections.Counter()               # (college, code) -> majors requiring it
for tag, codes in core.items():
    for c in codes:
        share[(college_of[tag], c)] += 1


def kind(code, tag):
    if code not in core[tag]:
        return 'elective'
    if code in COMMON:
        return 'common'
    secs = SECT.get(tag, {})
    for name, codes in secs.items():
        if code in codes:
            if name in COLLEGE_SECTIONS:
                return 'college'
            if name in ELECTIVE_SECTIONS:
                return 'elective'
            if name not in COMMON_SECTIONS:
                return 'major'
    if code.split()[0] in SCIENCE:
        return 'college'
    g = college_of[tag]
    return 'college' if share[(g, code)] * 2 >= len(COLLEGES[g]) else 'major'


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
