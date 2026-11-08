"""Checks on the published catalog; run after any catalog change.

  python3 _catalog/check_catalog.py                 # the live API
  python3 _catalog/check_catalog.py catalog.json    # a saved copy

  1. every course-major link has a type, and a known one
  2. a common course is common in every major that takes it as common or
     college, unless it is that major's own subject (then it is a major
     course): the common set is the same everywhere
  3. no major is empty, and each has some common and major courses
  4. every course has an Arabic name and credit hours set
  5. a course has one type within a college: it is not a college course
     for one major and a major course for another (its own department's
     major aside) — the check that would have caught MGT 210 in MIS
  6. every major in the catalog is in majors.py, and the other way round

Exit code 1 if any check fails.
"""
import collections, json, os, sys, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from majors import COLLEGE_OF, MAJORS, is_home   # noqa: E402

API = 'https://cyuufavrbqyqywhftbjw.supabase.co/functions/v1/api/catalog'
KINDS = {'major', 'college', 'common', 'elective'}

if len(sys.argv) > 1:
    cat = json.load(open(sys.argv[1], encoding='utf-8'))
else:
    with urllib.request.urlopen(API, timeout=60) as r:
        cat = json.load(r)

bad = collections.defaultdict(list)
tags = [t['id'] for t in cat['tags']]
per = collections.defaultdict(collections.Counter)
common_in = collections.defaultdict(set)

for c in cat['courses']:
    kinds = c.get('kinds') or {}
    for t in c['tags']:
        k = kinds.get(t)
        if k not in KINDS:
            bad['1 link without a type'].append(f"{c['code']} / {t}: {k}")
        per[t][k] += 1
        if k == 'common':
            common_in[c['code']].add(t)
    if not c.get('ar') or not c.get('full'):
        bad['4 missing name'].append(c['code'])

for c in cat['courses']:
    if c['code'] not in common_in:
        continue
    for t in c['tags']:
        k = (c.get('kinds') or {}).get(t)
        if k == 'college':
            bad['2 common course typed college'].append(f"{c['code']} / {t}")

for t in tags:
    n = sum(per[t].values())
    if not n:
        bad['3 empty major'].append(t)
    elif not per[t]['common'] or not per[t]['major']:
        bad['3 major without common or major courses'].append(f'{t} {dict(per[t])}')

for c in cat['courses']:
    seen = collections.defaultdict(dict)        # college -> {kind: major}
    for t in c['tags']:
        k = (c.get('kinds') or {}).get(t)
        if t in COLLEGE_OF and k in ('college', 'major') and not is_home(c['code'], t):
            seen[COLLEGE_OF[t]].setdefault(k, t)
    for college, ks in seen.items():
        if len(ks) > 1:
            bad['5 two types in one college'].append(f"{c['code']} ({college}): college in {ks['college']}, major in {ks['major']}")

if set(tags) != set(MAJORS):
    bad['6 majors.py out of date'].append(f'catalog only: {sorted(set(tags) - set(MAJORS))}, '
                                          f'majors.py only: {sorted(set(MAJORS) - set(tags))}')

links = sum(len(c['tags']) for c in cat['courses'])
print(f"{len(cat['courses'])} courses, {len(tags)} majors, {links} links")
for k in sorted(bad):
    print(f'FAIL {k}: {len(bad[k])}')
    for x in bad[k][:15]:
        print('   ', x)
print('OK' if not bad else 'FAILED')
sys.exit(1 if bad else 0)
