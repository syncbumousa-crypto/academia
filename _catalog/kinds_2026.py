"""Course type per major ("نوعية المواد") for every catalog link.

A course's type is decided for the course within its college, not for
each major on its own: one major's plan missing a section can no longer
make MGT 210 a college course for Accounting and a major course for MIS.

  common   مواد مشتركة  required by at least two thirds of all majors
                        (ENGL, IAS 111/121/212, MATH 101/102, PE 101, ...)
  college  مواد كلية    a college course: not common, and in the college
                        at least one of
                          · required by at least half the majors of a
                            generation of its plans (majors.COLLEGES)
                          · a 100/200-level math/science course
                          · in the college section ("College Core / Math &
                            Science Requirements / General Engineering
                            Fundamentals") of ANY plan of the college
                        and so a college course for every major of the
                        college whose plan has it
  major    مواد تخصص    the rest of the major's plan, and any plan course of
                        the major's own subject (majors.HOME), even a common
                        or college one (MATH 101 for Mathematics)
  elective مواد اختيارية linked to the major but not in its plan

Hand edits from the admin panel are kept: the database stores, beside each
link's type (kind), the type this script computed (kind_auto); a link
whose kind differs from its kind_auto was set by hand and is left alone.

  python3 _catalog/kinds_2026.py            preview: what would change
  python3 _catalog/kinds_2026.py --apply    write it, then run the checks

The database is read and written through the Supabase Management API
(the proxy adds the credential). out/kinds_2026.{json,sql} record the last
applied run.
"""
import collections, json, os, subprocess, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from majors import COLLEGES, COLLEGE_OF, MAJORS, SCIENCE, is_home   # noqa: E402

J = lambda *p: json.load(open(os.path.join(HERE, *p), encoding='utf-8'))
SECT = J('data', 'plan_sections_bulletin.json')
COLLEGE_SECTIONS = {'College Core Requirements', 'Math & Science Requirements', 'General Engineering Fundamentals'}
DB = 'https://api.supabase.com/v1/projects/cyuufavrbqyqywhftbjw/database/query'


def query(sql):
    req = urllib.request.Request(DB, data=json.dumps({'query': sql}).encode(), method='POST',
                                 headers={'Authorization': 'Bearer proxy-injected', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


# ---------- plans: the required courses of each major ----------
core = collections.defaultdict(set)
for f in ('plans_ccm_bulletin.json', 'plans_colleges_bulletin.json', 'plans_oldbiz_bulletin.json'):
    for tag, plan in J('data', f).items():
        core[tag] |= set(plan['core'])
for code, tags in J('out', 'business_2026.json')['links'].items():
    for tag in tags:
        core[tag].add(code)
core['dsmm'].discard('DSMM 465')          # the one elective the DSMM plan names
core['mis'] |= set(SECT['_mis_core']) | set(J('data', 'plans_mis_bulletin.json')['mis']['core'])
missing = [t for t in MAJORS if not core[t]]
if missing:
    sys.exit('no plan for: ' + ', '.join(missing))

# ---------- common: most of the university ----------
uni = collections.Counter(c for t in MAJORS for c in core[t])
COMMON = {c for c, n in uni.items() if 3 * n >= 2 * len(MAJORS)}

# ---------- college courses: a property of the course within the college ----------
COLLEGE_SET = {}
for college, gens in COLLEGES.items():
    s = set()
    for g in gens:
        n = collections.Counter(c for t in g for c in core[t])
        s |= {c for c, k in n.items() if 2 * k >= len(g)}
        for t in g:
            s |= {c for c in core[t] if c.split()[0] in SCIENCE and c.split()[1][0] in '12'}
            s |= {c for name, codes in SECT.get(t, {}).items() if name in COLLEGE_SECTIONS
                  for c in codes if c in core[t]}
    COLLEGE_SET[college] = s - COMMON


def kind(code, tag):
    if code not in core[tag]:
        return 'elective'
    if is_home(code, tag):
        return 'major'
    if code in COMMON:
        return 'common'
    if code in COLLEGE_SET[COLLEGE_OF[tag]]:
        return 'college'
    return 'major'


# ---------- the database now ----------
query('ALTER TABLE course_tags ADD COLUMN IF NOT EXISTS kind TEXT; '
      'ALTER TABLE course_tags ADD COLUMN IF NOT EXISTS kind_auto TEXT;')
links = query('SELECT code, tag_id, kind, kind_auto FROM course_tags')
unknown = sorted({r['tag_id'] for r in links} - set(MAJORS))
if unknown:
    sys.exit('majors not in majors.py: ' + ', '.join(unknown))

rows, manual, changes = [], [], []
for r in links:
    code, t, now, auto = r['code'], r['tag_id'], r['kind'], r['kind_auto']
    k = kind(code, t)
    if now and auto and now != auto:            # set by hand in the admin panel
        manual.append((code, t, now))
        rows.append((code, t, now, k))
    else:
        rows.append((code, t, k, k))
        if now != k:
            changes.append((code, t, now, k))

print(f'{len(rows)} links · {len(changes)} to change · {len(manual)} hand-set kept')
for c in changes[:40]:
    print('  %-9s %-6s %s -> %s' % c)
if len(changes) > 40:
    print(f'  … {len(changes) - 40} more')
if manual:
    print('kept from the admin panel:', manual)

if '--apply' not in sys.argv:
    print('preview only — run with --apply to write it')
    sys.exit(0)

q = lambda s: "'" + s.replace("'", "''") + "'"
by = collections.defaultdict(list)
for code, t, k, a in rows:
    by[(t, k, a)].append(code)
sql = ['BEGIN;']
for (t, k, a), codes in sorted(by.items()):
    sql.append('UPDATE course_tags SET kind = %s, kind_auto = %s WHERE tag_id = %s AND code IN (%s);'
               % (q(k), q(a), q(t), ', '.join(q(c) for c in codes)))
sql += ["UPDATE meta SET v = '%d' WHERE k = 'catalog_rev';" % (time.time() * 1000), 'COMMIT;']
query('\n'.join(sql))

out = os.path.join(HERE, 'out')
json.dump(sorted([list(r) for r in rows]), open(os.path.join(out, 'kinds_2026.json'), 'w', encoding='utf-8'), ensure_ascii=False)
open(os.path.join(out, 'kinds_2026.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
print('applied; checking the published catalog …')
sys.exit(subprocess.call([sys.executable, os.path.join(HERE, 'check_catalog.py')]))
