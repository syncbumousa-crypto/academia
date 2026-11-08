"""MIS on its official plan.

MIS kept the course list it had at the site's start (_db/seed.sql). This
checks it against its bulletin plan (program 1154 internship, 112 summer
training -> data/plans_mis_bulletin.json) and adds what is missing, with
the same slot rules as every other major:

  plan courses
  MIS 3/4xx            -> the Registrar's Course Offering, lectures/labs
  MGT 311/313          -> both
  IAS 3/4xx, GS xxx    -> as for every major
  XXX 3/4xx Business   -> any 300/400-level Business School course

Nothing is removed: the seed's links stay (they type as electives).

  python3 _catalog/mis_plan.py <live_catalog.json>
  -> _catalog/out/mis_plan.{json,sql}
"""
import json, os, re, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
D = lambda f: json.load(open(os.path.join(HERE, 'data', f), encoding='utf-8'))
PLAN, OFF, BUL = D('plans_mis_bulletin.json')['mis'], D('offering_202520-202630.json'), D('bulletin_ug.json')
LIVE = {c['code']: c for c in json.load(open(sys.argv[1], encoding='utf-8'))['courses']}

SLOTS = [('MIS', '34'), ('IAS', '34'), ('GS', '1234')]
NAMED = ['MGT 311', 'MGT 313']
SCHOOL = {'ACCT', 'FIN', 'MGT', 'MKT', 'MIS', 'OM', 'HRM', 'ECON', 'ENTR', 'BUS',
          'ACF', 'BAI', 'DSMM', 'FFE', 'FNT', 'OSC'}
REGULAR = {'LEC', 'LAB', 'LLB'}
NOT_ELECTIVE = re.compile(r'senior|internship|summer training|cooperative|co-op|thesis|seminar|independent|'
                          r'team design|تدريب|مشروع|رسالة|بحث مستقل|سمنار|ندوة|تعاوني', re.I)
NEW = {'COE 353': ('هندسة حاسب 353', 'أساسيات اتصالات الحاسب')}


def name_of(code):
    return (OFF.get(code) or BUL.get(code) or PLAN['core'].get(code) or {}).get('name', '')


want = set(PLAN['core']) | {c for c in NAMED if c in LIVE or c in OFF}
for code, o in OFF.items():
    p, n = code.split()
    if any(p == sp and n[0] in lv for sp, lv in SLOTS) and set(o['act']) <= REGULAR \
            and not NOT_ELECTIVE.search(o['name']):
        want.add(code)
for code, c in LIVE.items():
    p, n = code.split()
    if p in SCHOOL and n[0] in '34' and not NOT_ELECTIVE.search(' '.join((c['full'], c['ar'], name_of(code)))):
        want.add(code)

new, rows = [], []
for code in sorted(want):
    if code not in LIVE:
        if code not in NEW:
            sys.exit('no Arabic name for ' + code)
        d = PLAN['core'].get(code) or BUL[code]
        ar, full = NEW[code]
        new.append(dict(code=code, ar=ar, full=full, h=d['cr'], lab=int(d['lb'] > 0 and d['lt'] > 0)))
    if 'mis' not in LIVE.get(code, {}).get('tags', []):
        rows.append(code)

q = lambda s: "'" + s.replace("'", "''") + "'"
sql = ['BEGIN;']
sql += ['INSERT INTO courses (code, ar, "full", h, lab) VALUES (%s, %s, %s, %d, %d) ON CONFLICT (code) DO NOTHING;'
        % (q(c['code']), q(c['ar']), q(c['full']), c['h'], c['lab']) for c in new]
sql += ["INSERT INTO course_tags (code, tag_id) VALUES (%s, 'mis') ON CONFLICT DO NOTHING;" % q(c) for c in rows]
sql += ["UPDATE meta SET v = '%d' WHERE k = 'catalog_rev';" % (time.time() * 1000), 'COMMIT;']
out = os.path.join(HERE, 'out')
json.dump({'new': new, 'links': rows}, open(os.path.join(out, 'mis_plan.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(out, 'mis_plan.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
print('plan', len(PLAN['core']), 'new courses', len(new), 'new links', len(rows), rows)
