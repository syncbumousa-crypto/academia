"""Almudarraj (King Saud University) catalog -> SQL for the `mudarraj` schema.

Input: one JSON per college, extracted from the official study plans
(college websites, see "sources" in each file):

  {"college", "sources":[...], "courses":[{code, ar_code, en, ar, h, lab}],
   "programs":[{id, ar, en, courses:[{code, kind, level}]}]}

kind: major | college | common | elective | training | project
(training/project mark the Experiences tab, see badgeKind in app.js).

  python3 _catalog/ksu/build.py data/cfy.json data/ccis.json data/cba.json
  -> _catalog/ksu/out/mudarraj_catalog.{json,sql}

The SQL replaces the whole mudarraj catalog in one transaction and bumps
catalog_rev:mudarraj, so browsers pull the new list. It never touches
public.* (Almaslakh).
"""
import json, os, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
KINDS = {'major', 'college', 'common', 'elective', 'training', 'project'}

courses, tags, links = {}, [], {}
for path in sys.argv[1:]:
    d = json.load(open(path, encoding='utf-8'))
    for c in d['courses']:
        code = ' '.join(str(c['code']).split()).upper()
        cur = courses.setdefault(code, {'code': code, 'ar': '', 'full': '', 'en': '', 'h': 0, 'lab': 0})
        cur['ar'] = cur['ar'] or (c.get('ar_code') or '').strip()
        cur['full'] = cur['full'] or (c.get('ar') or '').strip()
        cur['en'] = cur['en'] or (c.get('en') or '').strip()
        cur['h'] = cur['h'] or int(c.get('h') or 0)
        cur['lab'] = cur['lab'] or (1 if c.get('lab') else 0)
    for p in d['programs']:
        if p['id'] in [t['id'] for t in tags]:
            sys.exit('duplicate program id ' + p['id'])
        tags.append({'id': p['id'], 'ar': p['ar'], 'en': p.get('en', '')})
        for x in p['courses']:
            code = ' '.join(str(x['code']).split()).upper()
            if code not in courses:
                sys.exit('program %s lists unknown course %s' % (p['id'], code))
            k = x.get('kind') or 'major'
            if k not in KINDS:
                sys.exit('bad kind %s for %s' % (k, code))
            links[(code, p['id'])] = k

for c in courses.values():
    if not c['ar']:
        c['ar'] = c['code']
    if not c['full']:
        c['full'] = c['en'] or c['code']

orphans = [c for c in courses if not any(k[0] == c for k in links)]
rev = str(int(time.time() * 1000))
q = lambda s: "'" + str(s).replace("'", "''") + "'"

sql = ['BEGIN;',
       'DELETE FROM mudarraj.course_tags;', 'DELETE FROM mudarraj.courses;', 'DELETE FROM mudarraj.tags;']
for i, t in enumerate(tags):
    sql.append('INSERT INTO mudarraj.tags (id, ar, en, ord) VALUES (%s, %s, %s, %d);' % (q(t['id']), q(t['ar']), q(t['en']), i))
for c in sorted(courses.values(), key=lambda c: c['code']):
    sql.append('INSERT INTO mudarraj.courses (code, ar, "full", h, lab) VALUES (%s, %s, %s, %d, %d);'
               % (q(c['code']), q(c['ar']), q(c['full']), c['h'], c['lab']))
for (code, tid), k in sorted(links.items()):
    sql.append('INSERT INTO mudarraj.course_tags (code, tag_id, kind, kind_auto) VALUES (%s, %s, %s, %s);'
               % (q(code), q(tid), q(k), q(k)))
sql.append("UPDATE public.meta SET v = %s WHERE k = 'catalog_rev:mudarraj';" % q(rev))
sql.append('COMMIT;')

os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
open(os.path.join(HERE, 'out', 'mudarraj_catalog.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
json.dump({'v': rev, 'tags': tags, 'courses': sorted(courses.values(), key=lambda c: c['code']),
           'links': [[a, b, k] for (a, b), k in sorted(links.items())]},
          open(os.path.join(HERE, 'out', 'mudarraj_catalog.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('programs %d · courses %d · links %d · orphans %d' % (len(tags), len(courses), len(links), len(orphans)))
if orphans:
    print('orphans:', ', '.join(orphans[:20]))
