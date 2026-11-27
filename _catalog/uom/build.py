"""The Hive (University of Manchester) catalog -> SQL for the `hive` schema.

Input: raw/ug_<year>.json from scrape_ug.py (official course profiles).
  python3 _catalog/uom/build.py 2027  -> _catalog/uom/out/hive_catalog.{json,sql}

Mapping:
  unit code  BMAN10501 -> "BMAN 10501" (the engine splits department and number on the space;
             a trailing letter stays with the number: BMAN10522M -> "BMAN 10522M")
  credits    -> h (the site shows "10 cr")
  ar         -> the code itself: Manchester units have no Arabic code, and nothing is translated
  programme  -> one tag (id from the profile URL slug, name in English as the University writes it)
  kind       Mandatory -> major · Optional -> elective, and by title in year 3+:
             project/dissertation -> project · placement/industrial experience -> training
The SQL replaces the whole hive catalog in one transaction and bumps catalog_rev:hive.
It never touches public.* (Almaslakh) or mudarraj.* (Almudarraj).
"""
import json, os, re, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
YEAR = sys.argv[1] if len(sys.argv) > 1 else '2027'
D = json.load(open(os.path.join(HERE, 'raw', 'ug_%s.json' % YEAR), encoding='utf-8'))

def norm(code):
    m = re.match(r'^([A-Z]{2,5})\s*(\d{4,5}[A-Z]?)$', code.strip().upper())
    return (m.group(1) + ' ' + m.group(2)) if m else None

def kind_of(u, year):
    t = u['title'].lower()
    if year >= 2 and re.search(r'placement|industrial experience|year in industry|work experience', t):
        return 'training'
    if year >= 3 and re.search(r'\bproject\b|dissertation', t):
        return 'project'
    return 'major' if u['kind'].lower().startswith('mandatory') else 'elective'

courses, tags, links, empty, bad = {}, [], {}, [], []
seen_tag = set()
for p in D['programmes']:
    slug = p['url'].rstrip('/').split('/')[-1] if p['url'].count('/') > 7 else ''
    tid = (re.sub(r'[^a-z0-9-]', '', slug)[:40] or 'p' + p['id'])
    if tid in seen_tag:
        tid = (tid[:33] + '-' + p['id'])[:40]
    units = [(y['year'], u) for y in p['years'] for u in y['units']]
    if not units:
        empty.append(p['title']); continue
    seen_tag.add(tid)
    tags.append({'id': tid, 'ar': p['title'], 'en': p['title'], 'school': p['school']})
    for year, u in units:
        c = norm(u['code'])
        if not c:
            bad.append(u['code']); continue
        cur = courses.setdefault(c, {'code': c, 'ar': c, 'full': u['title'], 'h': 0, 'lab': 0})
        try:
            cur['h'] = cur['h'] or int(float(u['credits']))
        except ValueError:
            pass
        k = kind_of(u, year)
        prev = links.get((c, tid))
        # a unit listed as mandatory in any year of the programme stays mandatory
        if prev is None or (prev == 'elective' and k != 'elective'):
            links[(c, tid)] = k

rev = str(int(time.time() * 1000))
q = lambda s: "'" + str(s).replace("'", "''") + "'"
sql = ['BEGIN;', 'DELETE FROM hive.course_tags;', 'DELETE FROM hive.courses;', 'DELETE FROM hive.tags;']
for i, t in enumerate(tags):
    sql.append('INSERT INTO hive.tags (id, ar, en, ord) VALUES (%s, %s, %s, %d);' % (q(t['id']), q(t['ar']), q(t['en']), i))
for c in sorted(courses.values(), key=lambda c: c['code']):
    sql.append('INSERT INTO hive.courses (code, ar, "full", h, lab) VALUES (%s, %s, %s, %d, %d);'
               % (q(c['code']), q(c['ar']), q(c['full']), c['h'], c['lab']))
for (code, tid), k in sorted(links.items()):
    sql.append('INSERT INTO hive.course_tags (code, tag_id, kind, kind_auto) VALUES (%s, %s, %s, %s);'
               % (q(code), q(tid), q(k), q(k)))
sql.append("UPDATE public.meta SET v = %s WHERE k = 'catalog_rev:hive';" % q(rev))
sql.append('COMMIT;')

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
open(os.path.join(HERE, 'out', 'hive_catalog.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
json.dump({'v': rev, 'source': D['source'], 'tags': tags, 'courses': sorted(courses.values(), key=lambda c: c['code']),
           'links': [[a, b, k] for (a, b), k in sorted(links.items())], 'no_units': empty, 'bad_codes': sorted(set(bad))},
          open(os.path.join(HERE, 'out', 'hive_catalog.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
print('programmes %d · courses %d · links %d · programmes without unit tables %d · bad codes %d'
      % (len(tags), len(courses), len(links), len(empty), len(set(bad))))
print('kinds', Counter(links.values()))
print('schools', Counter(t['school'] for t in tags).most_common())
