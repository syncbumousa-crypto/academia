# -*- coding: utf-8 -*-
"""حارسُ المعرّفات: كلُّ ‎#id‎ تناديه ‎admin.js‎ يجب أن يوجد في ‎index.html‎.

    لِمَ وُجد: حُذف لوحُ «الإشراف» فذهب معه لوحُ «المستخدمون» — كانا متجاورين —
    فصار ‎$('#a-panel-people')‎ يردّ ‎null‎، فألقى سطرٌ في صدرِ الملفّ، فمات كلُّ
    ما بعده: المواد والوسوم والدكاترة، كلُّها خاوية. والصفحةُ لا تصيح.
    والنحوُ سليم، فلا ‎node --check‎ يراه ولا العين.

    القاعدةُ: القصُّ باليد يجاور غيرَه؛ فليُقس بعدَه لا قبلَه.
"""
import re
import sys
import pathlib

sys.stdout.reconfigure(encoding='utf-8')

HERE = pathlib.Path(__file__).parent
JS = (HERE / 'admin.js').read_text(encoding='utf-8')
HTML = (HERE / 'index.html').read_text(encoding='utf-8')

# تُنزع تعليقاتُ الجافا أوّلًا: مثالٌ في تعليقٍ ليس نداءً (وقعت مرّتين قبلُ)
JS = re.sub(r'/\*.*?\*/', ' ', JS, flags=re.S)
JS = re.sub(r'(?m)^\s*//.*$', ' ', JS)

have = set(re.findall(r'id="([^"]+)"', HTML))
# وما يُصنع في الجافا بالترميز ليس على الصفحة ابتداءً
have |= set(re.findall(r"id=[\"'\\]*([a-zA-Z][\w-]*)", JS))

want = {}
for m in re.finditer(r"""\$\(\s*['"]#([\w-]+)['"]\s*\)""", JS):
    want.setdefault(m.group(1), JS[:m.start()].count('\n') + 1)

# والملصوقُ باليد: ‎$('#a-panel-' + p)‎ لكلِّ لسانٍ في ‎PANELS‎ — وهو موضعُ العطب
m = re.search(r"const PANELS = \[([^\]]+)\]", JS)
if m:
    ln = JS[:m.start()].count('\n') + 1
    for p in re.findall(r"'([^']+)'", m.group(1)):
        want.setdefault('a-panel-' + p, ln)

# ============================================================
# ٣ · ولا يزيد المكرَّر
# ============================================================
#   اللوحةُ تحمل جسدَ الموقع مطعَّمًا في ‎#lib-host‎، **وتحمل بعده نسخةً يدويّةً
#   راكدةً** من نوافذ الموقع — فتكرَّرت معرّفاتٌ كثيرة. و‎$('#id')‎ يردّ الأوّلَ
#   (المطعَّم، وهو الصحيح) فيعمل الأمرُ بالحظّ لا بالتصميم.
#
#   وحُذفت النسخةُ الراكدةُ (١٥٢ سطرًا) في ٢٩ أغسطس، فنزل المكرَّرُ من ستّين إلى
#   **صفر**. والسقفُ ينزل معه: لا يُترك واسعًا يُتسلَّل تحته.
#
#   ===== وحدُّ الحذف يُحسب من علامة التطعيم لا من أوّل ما يوافق =====
#   بحثتُ عن نصٍّ فوجد أوّلَ نسخة — وهي **المطعَّمةُ الحيّة** — فحُذفت. ونجت
#   لأنّ الأصلَ قُرئ في متغيّرٍ قبل الكتابة ([[feedback_never_open_target_before_backup]]).
import collections

DUP_MAX = 0

_dup = [k for k, n in collections.Counter(re.findall(r'id="([^"]+)"', HTML)).items() if n > 1]
if len(_dup) > DUP_MAX:
    print('✗ معرّفاتٌ مكرَّرةٌ زادت: %d (السقف %d)' % (len(_dup), DUP_MAX))
    print('   الجديدُ منها يُنظر في: %s' % ', '.join(sorted(_dup)[:8]))
    sys.exit(1)

miss = sorted((n, ln) for n, ln in want.items() if n not in have)
if miss:
    print('✗ معرّفاتٌ تُنادى ولا وجود لها في الصفحة:')
    for n, ln in miss:
        print('   admin.js:%d   #%s' % (ln, n))
    sys.exit(1)

print('✓ %d معرّفًا يُنادى، كلُّها موجودة' % len(want))
