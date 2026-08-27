# -*- coding: utf-8 -*-
r"""
يدمج  platform\app\*.js  في  platform\app.js

    python _bundle.py          يدمج
    python _bundle.py --check   يفحص ولا يكتب (للحارس)

===== لماذا أجزاءٌ تُدمج، لا وحداتٌ تُستورد؟ =====
المحرّكُ مغلَّفٌ واحد (‎IIFE‎) فيه ‎١٤٦٣‎ رابطًا تتقاسم نطاقًا مغلقًا، وعائلاتُه
مشتبكةٌ عبر الملفّ كلِّه لا متجاورة (‎cd‎ وحدَها ‎٢٦٢‎ تعريفًا على ‎١٩‎ ألف سطر).
فجمعُ المتفرّق يعني نقلَ تعريفاتٍ، و‎const‎ في المستوى الأعلى لا يُرفع — فتعريفٌ
يُنقل إلى ما بعد أوّل استعمالٍ له يقتل الصفحةَ وقتَ التشغيل، و‎node --check‎ لا
يمسكه: النحوُ سليمٌ والنطاقُ مكسور.

فالقطعُ **بمدى الأسطر**: الترتيبُ كما هو حرفًا بحرف، والدمجُ لصقٌ لا غير.

===== والأجزاءُ ليست ملفّاتٍ صالحةً وحدَها =====
‎01.js‎ يفتح المغلَّف و‎16.js‎ يغلقه، وما بينهما جوفٌ متّصل. فلا تُحمَّل بوسمٍ
ولا تُفحص بـ‎node --check‎ منفردة — الصالحُ هو المدموج، وهو وحدَه ما يُنشر.

===== ولا يُكتب فوق تعديلٍ لم يمرّ بالأجزاء =====
إن كان ‎app.js‎ على القرص يخالف الأجزاءَ **ويخالف آخرَ مدموجٍ خرج من هنا**، فقد
حُرِّر مباشرةً — والكتابةُ فوقه تمحو عملًا. فيُوقَف ويُقال، ولا يُمحى شيءٌ إلّا
بـ‎--force‎. والبصمةُ تُحفظ في ‎platform\app\.stamp‎ بعد كلّ دمج.
"""
import io, os, sys, hashlib

ROOT  = os.path.dirname(os.path.abspath(__file__))
PART  = os.path.join(ROOT, 'platform', 'app')
APP   = os.path.join(ROOT, 'platform', 'app.js')
STAMP = os.path.join(PART, '.stamp')

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sha = lambda s: hashlib.sha256(s.encode('utf-8')).hexdigest()


def parts():
    fs = sorted(f for f in os.listdir(PART) if f.endswith('.js'))
    if not fs:
        sys.exit('لا أجزاء في ' + PART)
    return fs


def merge():
    return ''.join(
        io.open(os.path.join(PART, f), encoding='utf-8', newline='').read()
        for f in parts())


def main():
    check = '--check' in sys.argv
    force = '--force' in sys.argv

    out = merge()
    cur = io.open(APP, encoding='utf-8', newline='').read() if os.path.isfile(APP) else ''
    last = io.open(STAMP, encoding='utf-8').read().strip() if os.path.isfile(STAMP) else ''

    if sha(out) == sha(cur):
        print('✓ %s مدموجٌ ومطابق (%d جزءًا · %d سطرًا)'
              % (os.path.basename(APP), len(parts()), out.count('\n') + 1))
        if not check:
            io.open(STAMP, 'w', encoding='utf-8').write(sha(out))
        return 0

    # اختلف — أهو تعديلٌ في الأجزاء، أم تحريرٌ مباشرٌ لـ app.js؟
    if cur and last and sha(cur) != last and not force:
        print('!! ‎app.js‎ حُرِّر مباشرةً — لا يُكتب فوقه')
        print('   بصمتُه الآن :', sha(cur)[:32])
        print('   آخرُ مدموج :', last[:32])
        print('   انقل تعديلك إلى الجزء الذي يخصّه ثمّ أعِد الدمج،')
        print('   أو ‎python _bundle.py --force‎ إن كنت تريد محوَه.')
        return 2

    if check:
        print('!! المدموج يخالف ‎app.js‎ — أعِد الدمج')
        return 1

    io.open(APP, 'w', encoding='utf-8', newline='').write(out)
    io.open(STAMP, 'w', encoding='utf-8').write(sha(out))
    print('✓ دُمج %d جزءًا ⇐ %s (%d سطرًا)'
          % (len(parts()), os.path.basename(APP), out.count('\n') + 1))
    return 0


if __name__ == '__main__':
    sys.exit(main())
