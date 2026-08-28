# ============================================================
#  ‎_addcourses.py‎ — يضيف موادَّ صناديق الاختياريّ الناقصة
# ============================================================
#  المصدر: ‎RE/academic-comeback-sim/js/plan-embed.js‎ ⇐ ‎POOLS‎ (صناديق الخطة
#  كما قرأها صاحبُ الموقع من دليل ٢٠٢٣). والناقصُ ما ليس في ‎shared/courses.js‎.
#
#  ويكتب ثلاثةَ أشياء:
#    ١ · ‎shared/courses.js‎  — لمن لا كتالوجَ عنده (السقوطُ الآمن)
#    ٢ · ‎_backup/courses-insert.sql‎ — جدولا ‎courses‎ و‎course_tags‎ في القاعدة
#    ٣ · ويزيد ‎catalog_rev‎ — وإلّا لم يعلم متصفّحٌ أنّ عليه أن يقرأ
#
#  ===== والساعاتُ ثلاثٌ وهو مقولٌ لا مخفيّ =====
#  صناديقُ ‎acsim‎ لا تحمل ساعات: خانةُ الاختياريّ فيها ‎cr:3‎ لأنّ اختياريَّ
#  الأعمال ثلاثُ ساعاتٍ في الدليل. فما نُقل ههنا ثلاثٌ، ومن وجد خلافَ ذلك
#  بدّله من لوحة الأدمن — وهي مالكةُ الكتالوج.

import io, json, os, re, sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACSIM = os.path.join(ROOT, '..', 'RE', 'academic-comeback-sim', 'js', 'plan-embed.js')
CJS = os.path.join(ROOT, 'shared', 'courses.js')
SQL = os.path.join(ROOT, '_backup', 'courses-insert.sql')
TAG = 'mis'
HOURS = 3


def q(s):
    return "'" + str(s).replace("'", "''") + "'"


def pools():
    s = io.open(ACSIM, encoding='utf-8').read()
    a = s.index('const POOLS = {')
    i = s.index('{', a)
    d = 0
    for j in range(i, len(s)):
        if s[j] == '{':
            d += 1
        elif s[j] == '}':
            d -= 1
            if not d:
                break
    out = {}
    for c, n in re.findall(r"\['([A-Z]{2,4} \d{3})'\s*,\s*'([^']*)'\]", s[i:j + 1]):
        out.setdefault(c, n)
    return out


def main():
    cjs = io.open(CJS, encoding='utf-8').read()
    have = set(re.findall(r"code: '([^']+)'", cjs))
    deptar = dict(re.findall(r"(\w+):\s*'([^']+)'", cjs[cjs.index('const DEPT_AR'):cjs.index('};', cjs.index('const DEPT_AR'))]))

    miss = {c: n for c, n in sorted(pools().items()) if c not in have}
    if not miss:
        print('لا ناقصَ — الكتالوج كامل')
        return 0

    depts = sorted({c.split()[0] for c in miss})
    unknown = [d for d in depts if d not in deptar]
    print('الناقص: {} مادّة في {} قسمًا'.format(len(miss), len(depts)))
    if unknown:
        print('  ⚠ أقسامٌ بلا اسمٍ عربيّ في DEPT_AR: ' + ' · '.join(unknown))

    # ١ · سطورُ ‎courses.js‎ — بأسلوب الاختياريّات القائمة (الاسمُ الإنجليزيّ في ar)
    w = max(len(c) for c in miss)
    lines = []
    for c, n in miss.items():
        lines.append("  {{ code: '{}',{} ar: '{}', h: {}, col: 'biz' }},"
                     .format(c, ' ' * (w - len(c)), n.replace("'", "\\'"), HOURS))
    print('  · {} سطرًا لـcourses.js'.format(len(lines)))

    # ٢ · القاعدة — والوسمُ ‎mis‎ هو «مربوطةٌ بالتخصّص»
    sql = ['-- موادُّ صناديق الاختياريّ الناقصة. مولَّد بـ_addcourses.py، لا يُحرَّر بيد.']
    for c, n in miss.items():
        d, num = c.split()
        ar = (deptar.get(d, d) + ' ' + num)
        sql.append("INSERT INTO courses (code, ar, full, h, lab) VALUES ({},{},{},{},0)\n"
                   "  ON CONFLICT(code) DO NOTHING;".format(q(c), q(ar), q(n), HOURS))
        sql.append("INSERT INTO course_tags (code, tag_id) VALUES ({},{})\n"
                   "  ON CONFLICT(code, tag_id) DO NOTHING;".format(q(c), q(TAG)))
    sql.append("UPDATE meta SET v = CAST(CAST(v AS INTEGER) + 1 AS TEXT) WHERE k = 'catalog_rev';")
    io.open(SQL, 'w', encoding='utf-8', newline='\n').write('\n'.join(sql) + '\n')
    print('  · {} عبارةً ⇐ courses-insert.sql'.format(len(sql) - 1))

    io.open(os.path.join(ROOT, '_backup', 'courses-lines.txt'), 'w',
            encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
    return 0


if __name__ == '__main__':
    sys.exit(main())
