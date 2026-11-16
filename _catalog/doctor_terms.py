# Builds shared/doctor-terms.js: for every course (and lab key), the terms each of its listed doctors taught it,
# from the Registrar's Course Offering. The site filters the doctor list by these terms (newest term by default).
# usage: python3 _catalog/doctor_terms.py <rows.json from the latest offering fetch> [more rows.json ...]
import json, re, os, sys, csv, subprocess, collections
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
def q(sql):
    p = '/tmp/dt_q.json'; open(p, 'w').write(json.dumps({'query': sql}))
    return json.loads(subprocess.run(['curl', '-sS', '-X', 'POST', 'https://api.supabase.com/v1/projects/cyuufavrbqyqywhftbjw/database/query',
        '-H', 'Authorization: Bearer proxy-injected', '-H', 'Content-Type: application/json', '--data-binary', '@' + p], capture_output=True, text=True).stdout)
LAB = {c['code']: c['lab'] for c in q('select code, lab from courses')}
def norm(cs):
    m = re.match(r'\s*([A-Z]{2,5})\s*(\d{2,3})', cs)
    return m and '%s %s' % (m.group(1), m.group(2).zfill(3))
sec = collections.defaultdict(lambda: collections.defaultdict(set))   # key -> instructor -> terms
seen_terms = collections.defaultdict(set)
def add(term, cs, act, ins):
    c = norm(cs)
    if not c or c not in LAB: return
    key = c + '::معمل' if act == 'LAB' and LAB[c] else c
    seen_terms[key].add(term)
    ins = (ins or '').strip()
    if ins and 'TBA' not in ins.upper() and ins.upper() != 'STAFF': sec[key][ins].add(term)
D = os.path.join(HERE, 'data')
for f in ('offering_instructors_201410-202130.tsv', 'offering_instructors_202210-202630.tsv'):
    for r in csv.DictReader(open(os.path.join(D, f), encoding='utf-8'), delimiter='\t'):
        add(r['term'], r['course_sec'], r['act'], r['instructor'])
for r in csv.DictReader(open(os.path.join(D, 'offering_ELD_instructors_201410-202630.tsv'), encoding='utf-8'), delimiter='\t'):
    add(r['term'], r['course'], r['act'], r['instructor'])
for f in sys.argv[1:]:
    for term, d, cs, act, title, ins in json.load(open(f)):
        add(term, cs, act, ins)
# the site's doctor names per key (rows of every doctors post)
names = collections.defaultdict(set)
for r in q("select code, data from posts where sec='doc'"):
    d = r['data'] if isinstance(r['data'], dict) else json.loads(r['data'])
    for x in d.get('docs', []) or []:
        if x and (x.get('n') or '').strip(): names[r['code']].add(x['n'].strip())
def parts(n):
    s = re.sub(r'^\s*(dr|mr|mrs|ms|prof)\.?\s+', '', n.lower())
    t = [w for w in re.sub(r'[^a-z\s\-]', ' ', s).split() if w not in ('al', 'el', 'md', 'mr', 'dr')]
    if not t: return None
    last = re.sub(r'^(al|el)-', '', t[-1]).replace('-', '')
    if len(last) <= 1 and len(t) >= 2: last = re.sub(r'^(al|el)-', '', t[-2]).replace('-', '')
    first = t[0].replace('-', '')
    return first, first[:1] + re.sub(r'[aeiouy]', '', first[1:]), re.sub(r'^(al|el)', '', last)
def same(a, b):
    x, y = parts(a), parts(b)
    if not x or not y or x[2] != y[2]: return False
    if x[1] == y[1]: return True
    return (len(x[0]) == 1 and y[0].startswith(x[0])) or (len(y[0]) == 1 and x[0].startswith(y[0]))
# the key the site computes (drTermKey in app.js): lower case, no title, letters only
def key(n):
    s = n.lower()
    s = re.sub(r'^\s*(dr|mr|mrs|ms|prof)\.?\s+', '', s); s = re.sub(r'^\s*[دأ]\s*\.\s*', '', s)
    s = re.sub('[ً-ْ]', '', s)
    return re.sub('[^a-z؀-ۿ]+', '', s)
lab = lambda t: t[2:4] + t[4]          # 202620 -> 262
out = {}
for k, inst in sec.items():
    docs = {}
    for n in names.get(k, ()):
        ts = set()
        for i, terms in inst.items():
            if same(n, i): ts |= terms
        if ts: docs[key(n)] = sorted({lab(t) for t in ts}, reverse=True)
    if docs:
        out[k] = {'t': sorted({t for ts in docs.values() for t in ts}, reverse=True), 'd': docs}
body = json.dumps(dict(sorted(out.items())), ensure_ascii=False, separators=(',', ':'))
open(os.path.join(ROOT, 'shared', 'doctor-terms.js'), 'w', encoding='utf-8').write(
    '/* ترماتُ دكاترة كلّ مادّة من جدول الطرح — يولّده _catalog/doctor_terms.py ولا يُحرَّر بيد.\n'
    '   ‏‎{"CODE": {"t": [ترماتُ المادّة الأحدثُ أوّلًا], "d": {"مفتاحُ الاسم": [ترماتُه]}}}‎ — والترمُ ‎262‎ = ‎202620‎ */\n'
    'window.DOCTOR_TERMS = ' + body + ';\n')
print('courses', len(out), '| doctors with terms', sum(len(v['d']) for v in out.values()),
      '| site doctors', sum(len(v) for v in names.values()))
