"""The Hive (University of Manchester): undergraduate programmes -> JSON.

Source: the official course profiles, www.manchester.ac.uk/study/undergraduate/courses/<year>/.
The course search exposes json/?level=ug (the list of programme ids); each profile has, per
year of study, a table of course units (title, code, credit rating, mandatory/optional) and
the owning School under "Contact details".

  python3 _catalog/uom/scrape_ug.py 2027     -> _catalog/uom/raw/ug_<year>.json
One request a second; pages are cached in raw/html/ so a rerun resumes.
"""
import html, json, os, re, sys, time, urllib.request

YEAR = sys.argv[1] if len(sys.argv) > 1 else '2027'
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'raw', 'html'); os.makedirs(CACHE, exist_ok=True)
BASE = 'https://www.manchester.ac.uk/study/undergraduate/courses/%s/' % YEAR
UA = {'User-Agent': 'Mozilla/5.0 (academia catalog builder)'}

def get(url, key):
    p = os.path.join(CACHE, key)
    if os.path.exists(p):
        return open(p, encoding='utf-8').read()
    for k in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                s = r.read().decode('utf-8', 'replace'); final = r.geturl()
            open(p, 'w', encoding='utf-8').write(s)
            time.sleep(1)
            return s
        except Exception as e:
            print('retry', url, e, file=sys.stderr); time.sleep(5 * (k + 1))
    return ''

txt = lambda s: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()

ids = []
for i in json.loads(get(BASE + 'json/?level=ug', 'list_%s.json' % YEAR))['i']:
    if i not in ids: ids.append(i)

out = []
for n, cid in enumerate(ids):
    s = get(BASE + cid + '/', '%s_%s.html' % (YEAR, cid))
    if not s:
        print('MISS', cid); continue
    title = txt((re.search(r'<title>(.*?)\(', s) or re.search(r'<title>(.*?)\|', s)).group(1))
    m = re.search(r'School/Faculty</[^>]+>\s*<[^>]+>(.*?)</', s, re.S)
    school = txt(m.group(1)) if m else ''
    years = []
    # each table sits under a heading "Course units for year N"
    for h in re.finditer(r'Course units for year (\d)', s):
        t0 = s.find('<table class="course-units"', h.end())
        nxt = re.search(r'Course units for year \d', s[h.end():])
        if t0 < 0 or (nxt and t0 > h.end() + nxt.start()):
            continue
        t = s[t0:s.find('</table>', t0)]
        units = []
        for row in re.findall(r'<tr>(.*?)</tr>', t, re.S):
            td = re.findall(r'<td[^>]*>(.*?)</td>', row, re.S)
            if len(td) < 4:
                continue
            up = re.search(r'data-unitpath="([^"]+)"', td[0])
            units.append({'title': txt(td[0]), 'code': txt(td[1]), 'credits': txt(td[2]),
                          'kind': txt(td[3]), 'xml': up.group(1) if up else ''})
        years.append({'year': int(h.group(1)), 'units': units})
    out.append({'id': cid, 'title': title, 'school': school, 'url': BASE + cid + '/', 'years': years})
    if n % 20 == 0:
        print(n, len(ids), title, school, sum(len(y['units']) for y in years), flush=True)

json.dump({'year': YEAR, 'source': BASE, 'programmes': out},
          open(os.path.join(HERE, 'raw', 'ug_%s.json' % YEAR), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('done', len(out))
