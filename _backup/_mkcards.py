# ============================================================
#  ‎_mkcards.py‎ — يكتب رزمَ البطائق في القاعدة باسم صاحبها
# ============================================================
#  الرزمُ تنزل مع الموقع في كلّ متصفّحٍ ولا تبلغ الخادمَ أبدًا، فلوحُ
#  «المستخدمون» يقرأ صفرًا — وهو صادق: الجدولُ لا يعرفها.
#
#  ورفعُها من المتصفّح يقتضي رقصةً: يفتح صاحبُها الموقعَ الأساسيَّ داخلًا
#  بحسابه، وتُستردّ الرزمُ، ثمّ يُنتظر الدفع. والبياناتُ عندي على القرص
#  (‎platform/seed-cards.js‎) فتُكتب مرّةً بيقين.
#
#  ===== والمعرّفُ يُشتقّ لا يُختلق =====
#  ‎p-<uid8>-cards-<code>‎: ثابتٌ لو أُعيد التشغيل، فلا تنشأ نسخةٌ ثانية.
#  ولو دفع المتصفّحُ نسختَه بمعرّفٍ آخرَ لَردّه قيدُ ‎(uid, code, sec)‎ الفريد —
#  ولن يفعل: الجذبُ يطرح البذرةَ ويضع مكانَها الوافدَ بمعرّفه (قاعدةُ «صاحبٌ
#  بعينه في بندٍ بعينه»)، ثمّ تُستردّ فتحمل معرّفَ الخادم.
#
#  ===== ولا يُكتب فوق شيء =====
#  ‎INSERT ... WHERE NOT EXISTS‎: إن كان للصاحب رزمةٌ في المادّة تُرك ما فيها.

import io, json, os, re, subprocess, sys

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'platform', 'seed-cards.js')
OUT = os.path.join(ROOT, '_backup', 'cards-insert.sql')

OWNER = 'udbf4a46c9534b8183ddf8400'
MAX_DATA = 400 * 1024


def q(s):
    return "'" + s.replace("'", "''") + "'"


# ===== ورزمةٌ واحدةٌ لا تسع عبارةً واحدة =====
#  قاعدةُ ‎D1‎ تردّ ‎SQLITE_TOOBIG‎ على عبارةٍ طويلة (وأكبرُ رزمةٍ ٢٩٢ك). فتُكتب
#  الرزمةُ خاويةً ثمّ يُلحَق متنُها قطعةً قطعةً بـ‎data = data || '…'‎.
#
#  ===== والإلحاقُ مشروطٌ بالمعرّف لا بالمادّة =====
#  لو خُطّئ فأُعيد التشغيلُ ورزمةٌ موجودةٌ بمعرّفٍ آخر: يُتخطّى الإدخال (شرطُ
#  ‎NOT EXISTS‎)، فلا يوجد صفٌّ بمعرّفنا، فلا تصيب الإلحاقاتُ شيئًا. ولا يُلحَق
#  متنٌ فوق متنٍ قائم — وهو أخطرُ ما في هذي الطريقة.
CHUNK = 40000        # حرفًا — دون حدّ العبارة بمراحل


def main():
    src = io.open(SEED, encoding='utf-8').read()
    body = src[src.index('=') + 1:].strip().rstrip(';')
    decks = json.loads(body).get('decks', {})
    if not decks:
        print('لا رزمَ في البذرة')
        return 1

    import time
    now = int(time.time())
    out = ['-- رزمُ البطائق ⇐ حساب صاحب الموقع. مولَّد بـ_mkcards.py، لا يُحرَّر بيد.']
    total, packs = 0, 0
    for code in sorted(decks):
        data = json.dumps({'title': '', 'deck': decks[code]},
                          ensure_ascii=False, separators=(',', ':'))
        b = len(data.encode('utf-8'))
        if b > MAX_DATA:
            print('  ✗ {} أكبرُ من حدّ المساهمة ({}ك) — تُترك'.format(code, round(b / 1024, 1)))
            continue
        pid = 'p-' + OWNER[:8] + '-cards-' + re.sub(r'[^A-Za-z0-9]+', '_', code)
        # والقطعُ بالحروف لا بالبايتات: قطعٌ بالبايتات يشطر حرفًا عربيًّا نصفين
        parts = [data[i:i + CHUNK] for i in range(0, len(data), CHUNK)]
        out.append(
            "INSERT INTO posts (id, uid, code, sec, data, ts, updated)\n"
            "SELECT {id}, {uid}, {code}, 'cards', '', {now}, {now}\n"
            " WHERE NOT EXISTS (SELECT 1 FROM posts WHERE uid = {uid} AND code = {code} AND sec = 'cards');"
            .format(id=q(pid), uid=q(OWNER), code=q(code), now=now))
        for part in parts:
            out.append("UPDATE posts SET data = data || {p} WHERE id = {id};"
                       .format(p=q(part), id=q(pid)))
        total += b
        packs += 1
        print('  · {:<12} {:>7}ك  ({} قطعة)'.format(code, round(b / 1024, 1), len(parts)))

    io.open(OUT, 'w', encoding='utf-8', newline='\n').write('\n\n'.join(out) + '\n')
    print('✓ {} رزمٍ في {} عبارةً ⇐ cards-insert.sql ({}ك)'
          .format(packs, len(out) - 1, round(total / 1024, 1)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
