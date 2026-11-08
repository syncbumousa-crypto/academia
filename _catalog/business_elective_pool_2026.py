"""The "XXX 3/4xx Business Elective" slot of the 2026 Business School plans.

The MIS major has had every Business School course since the seed
(_db/seed.sql), i.e. its business electives are any 300/400-level course
of the school. This applies the same rule to the 2026 majors whose plan
has a Business Elective slot: Business Analytics & AI (baai), Digital &
Social Media Marketing (dsmm) and Fintech & Entrepreneurship (fte).
ACF, FFE and OSC have no such slot (only Major and Free electives).

Pool: catalog courses with a Business School prefix at level 3xx/4xx,
less co-op, internship, summer training, senior projects, theses,
seminars and independent research (names checked in the catalog, the
Registrar's offering and the bulletin, see data/).

  python3 _catalog/business_elective_pool_2026.py <live_catalog.json>
  -> _catalog/out/business_elective_pool_2026.{json,sql}
"""
import json, os, re, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
OFF = json.load(open(os.path.join(HERE, 'data/offering_202520-202630.json'), encoding='utf-8'))
BUL = json.load(open(os.path.join(HERE, 'data/bulletin_ug.json'), encoding='utf-8'))
LIVE = json.load(open(sys.argv[1], encoding='utf-8'))['courses']

TAGS = ['baai', 'dsmm', 'fte']
SCHOOL = {'ACCT', 'FIN', 'MGT', 'MKT', 'MIS', 'OM', 'HRM', 'ECON', 'ENTR', 'BUS',
          'ACF', 'BAI', 'DSMM', 'FFE', 'FNT', 'OSC'}
NOT_ELECTIVE = re.compile(r'senior|internship|summer training|cooperative|co-op|thesis|seminar|'
                          r'independent|team design|تدريب|مشروع|رسالة|بحث مستقل|سمنار|ندوة|تعاوني', re.I)

rows, pool = [], []
for c in LIVE:
    p, n = c['code'].split()
    if p not in SCHOOL or n[0] not in '34':
        continue
    en = (OFF.get(c['code']) or BUL.get(c['code']) or {}).get('name', '')
    if NOT_ELECTIVE.search(' '.join((c['full'], c['ar'], en))):
        continue
    pool.append(c['code'])
    rows += [(c['code'], t) for t in TAGS if t not in c['tags']]

q = lambda s: "'" + s.replace("'", "''") + "'"
sql = ['BEGIN;']
sql += ['INSERT INTO course_tags (code, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;' % (q(a), q(b)) for a, b in rows]
sql += ["UPDATE meta SET v = '%d' WHERE k = 'catalog_rev';" % (time.time() * 1000), 'COMMIT;']

out = os.path.join(HERE, 'out')
os.makedirs(out, exist_ok=True)
json.dump({'pool': sorted(pool), 'links': rows}, open(os.path.join(out, 'business_elective_pool_2026.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(out, 'business_elective_pool_2026.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
print('pool', len(pool), 'new links', len(rows), {t: sum(1 for _, x in rows if x == t) for t in TAGS})
