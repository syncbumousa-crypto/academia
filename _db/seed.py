# -*- coding: utf-8 -*-
r"""
يولّد  _db\seed.sql  من الكتالوج الذي بنيتَه في لوحة الأدمن.

    python _db\seed.py <ملفّ-الحال.json>
    python _db\seed.py                      ← يبحث عن آخر نسخةٍ في «نسخة أكاديميا»

والمصدرُ ملفُّ نقلٍ (`academia2:catalog:v1` بداخله) لا الدرجُ مباشرةً: الدرجُ لا
يُقرأ من خارج المتصفّح، والملفُّ يُقرأ ويُراجَع ويُودَع في المستودع.

والقيمُ تُهرَّب بمضاعفة الفاصلة العليا لا بالنسج: أسماءُ المواد عربيّةٌ وفيها
أقواسٌ وشرطات، ومنها ما فيه فاصلةٌ عليا — وسطرُ ‎INSERT‎ مكسورٌ يفسد الجدول كلَّه.
"""
import io, json, os, sys, glob

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(HERE, 'seed.sql')


def q(v):
    """قيمةُ سِكوَيْل: نصٌّ مهرَّب، أو رقمٌ، أو 0/1 للبولين."""
    if isinstance(v, bool):  return '1' if v else '0'
    if isinstance(v, (int, float)): return str(v)
    return "'" + str(v if v is not None else '').replace("'", "''") + "'"


def find_src():
    if len(sys.argv) > 1:
        return sys.argv[1]
    pats = [r'C:\Users\thebu\Desktop\نسخة أكاديميا\*.json',
            r'C:\Users\thebu\Downloads\academia-*.json']
    cands = [f for p in pats for f in glob.glob(p)]
    for f in sorted(cands, key=os.path.getmtime, reverse=True):
        try:
            if 'مفاتيح' in json.load(io.open(f, encoding='utf-8')):
                return f
        except Exception:
            pass
    sys.exit('لم أجد ملفَّ حالٍ فيه الكتالوج — مرّر مساره وسيطًا')


src = find_src()
j = json.load(io.open(src, encoding='utf-8'))
raw = j['مفاتيح'].get('academia2:catalog:v1')
if not raw:
    sys.exit('لا كتالوج في هذا الملفّ (academia2:catalog:v1 غائب)')
cat = json.loads(raw)
tags = cat.get('tags') or []
crs  = cat.get('courses') or []

L = ['-- مولَّدٌ آليًّا من ‎_db\\seed.py‎ — لا يُحرَّر بيد',
     '-- المصدر: ' + os.path.basename(src),
     '-- %d مادّة · %d وسمًا' % (len(crs), len(tags)), '']

L.append('DELETE FROM course_tags;')
L.append('DELETE FROM courses;')
L.append('DELETE FROM tags;')
L.append('')

for i, t in enumerate(tags):
    L.append('INSERT INTO tags (id, ar, en, ord) VALUES (%s, %s, %s, %d);'
             % (q(t.get('id')), q(t.get('ar')), q(t.get('en')), i))
L.append('')

pairs = []
for c in crs:
    code = c.get('code')
    if not code:
        continue
    L.append('INSERT INTO courses (code, ar, full, h, lab) VALUES (%s, %s, %s, %s, %s);'
             % (q(code), q(c.get('ar')), q(c.get('full')), q(int(c.get('h') or 0)), q(bool(c.get('lab')))))
    for tg in (c.get('tags') or []):
        pairs.append((code, tg))
L.append('')

known = {t.get('id') for t in tags}
for code, tg in pairs:
    if tg not in known:      # وسمٌ لا تعريفَ له: يُترك ويُقال، ولا يكسر الاستيراد
        print('  ! وسمٌ مجهول على %s: %s — تُرك' % (code, tg))
        continue
    L.append('INSERT INTO course_tags (code, tag_id) VALUES (%s, %s);' % (q(code), q(tg)))

L.append('')
L.append("UPDATE meta SET v = '%s' WHERE k = 'catalog_rev';" % (cat.get('v') or 1))

io.open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')
print('المصدر :', src)
print('المواد :', len(crs), '· الوسوم:', len(tags), '· الأزواج:', len(pairs))
print('الخارج :', OUT, '(%d سطرًا)' % len(L))
