# -*- coding: utf-8 -*-
r"""
نقلُ مساهماتٍ من مجتمع STKFUPM القديم (Discourse) إلى أكاديميا.

    python _import/stkfupm.py <مجلد مواضيع JSON>   ⇐ يكتب _import/out/<المادة>.json و .sql

===== ما يُنقل وإلى أين =====
كلُّ مشاركةٍ مختارةٍ ⇐ مساهمةٌ في بند «المادة» (‎info‎) باسم كاتبها هناك وصورتِه:
  · الكاتبُ حسابٌ مستورَد ‎uid = stk-<username>‎ لا كلمةَ سرٍّ له (‎pw_hash‎ خاوٍ كحساب الموقع
    ‎u-academia‎: لا يُبلَغ من باب الدخول أبدًا)، وبريدُه ‎<username>@import.stkfupm.invalid‎ — نطاقٌ لا يُرسل إليه.
  · والأصلُ في ‎data.imp‎ ⇐ شارة «from STKFUPM» بجانب الاسم، تفتح المشاركةَ الأصليّة.
  · والتاريخُ تاريخُها هناك (‎ts‎) لا تاريخُ النقل.

والاختيارُ يدويٌّ في ‎PICK‎: ما فيه خبرةٌ أو معلومة. والأسئلةُ بلا جواب، والمكرَّر،
والروابطُ الميّتة (mediafire)، والشتائمُ — لا تُنقل.
"""
import io, os, re, sys, json, html as H
from datetime import datetime

BASE = 'https://community.stkfupm.com'
ROOT = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(ROOT, 'out')

# code ⇐ [(topic id, post_number, book?)]
PICK = {
  'ACCT 210': [
    (120957, 5,  ''),                                         # وصف المقرّر ومخرجاته من السيلابس
    (120957, 8,  'Managerial Accounting Braun and tietz 3rd Edition'),  # الكتاب الجديد — بلفظه
    (120957, 9,  ''),                                         # تجربة ترم 141
    (120957, 11, ''),                                         # تجربة ترم 142 — أطولها وأنفعها
    (120957, 12, ''),                                         # تجربة ترم 162
    (120957, 13, ''),                                         # تجربة ترم 192
  ],
}

# ===== الدكاترة =====
# الدكتورُ نفسُه ليس مساهمةً: يُعرَّف في صفّه (‎n‎ = اسمه) بمعرّفٍ ثابت، فتجتمع تحته
# صفوفُ كلّ من كتب عنه. والاسمُ بصيغة قائمة أكاديميا (‎Dr. …‎).
DOCTORS = {
  'stk-dr-mirghani': 'Dr. Mirghani Ahmed',
  'stk-dr-madani':   'Dr. Haider Husain Madani',
  'stk-dr-alharbi':  'Dr. Abdullah D. Alharbi',
  'stk-dr-amr':      'Dr. M. Amr',
  'stk-dr-alhazmi':  'Dr. Muhammad Alhazmi',
  'stk-dr-nainar':   'Dr. S M Khalid Nainar',
}
# code ⇐ [(topic id, post_number, doctor id)] — تقييماتُ هذه المادّة وحدَها.
# والردُّ الذي لا يقيّم («القريد هذا قريدك؟») لا يُنقل، ولا تقييمُ مادّةٍ أخرى.
PICK_DOC = {
  'ACCT 210': [
    (98438, 12, 'stk-dr-mirghani'), (98438, 22, 'stk-dr-mirghani'), (98438, 23, 'stk-dr-mirghani'),
    (98438, 24, 'stk-dr-mirghani'), (98438, 25, 'stk-dr-mirghani'), (98438, 26, 'stk-dr-mirghani'),
    (98438, 27, 'stk-dr-mirghani'),
    (98443, 11, 'stk-dr-madani'), (98443, 12, 'stk-dr-madani'), (98443, 16, 'stk-dr-madani'),
    (98443, 17, 'stk-dr-madani'), (98443, 18, 'stk-dr-madani'), (98443, 19, 'stk-dr-madani'),
    (98443, 20, 'stk-dr-madani'), (98443, 21, 'stk-dr-madani'), (98443, 22, 'stk-dr-madani'),
    (98443, 25, 'stk-dr-madani'),
    (98423, 13, 'stk-dr-alharbi'), (98423, 14, 'stk-dr-alharbi'), (98423, 17, 'stk-dr-alharbi'),
    (98423, 18, 'stk-dr-alharbi'),
    (98439, 40, 'stk-dr-amr'), (98439, 41, 'stk-dr-amr'),
    (98415, 11, 'stk-dr-alhazmi'),
    (177580, 2, 'stk-dr-nainar'), (177580, 3, 'stk-dr-nainar'), (177580, 5, 'stk-dr-nainar'),
    (177580, 6, 'stk-dr-nainar'), (177580, 7, 'stk-dr-nainar'),
  ],
}

EMOJI = {'slight_smile': '🙂', 'smile': '😄', 'smiley': '😃', 'grinning': '😀', 'laughing': '😆',
         'joy': '😂', 'wink': '😉', 'blush': '😊', 'angry': '😠', 'rage': '😡', 'sob': '😭',
         'cry': '😢', 'confused': '😕', 'pensive': '😔', 'disappointed': '😞', 'neutral_face': '😐',
         'sweat_smile': '😅', 'thinking': '🤔', 'heart': '❤️', 'thumbsup': '👍', '+1': '👍',
         'rofl': '🤣', 'roll_eyes': '🙄', 'stuck_out_tongue': '😛', 'sunglasses': '😎',
         'flushed': '😳', 'scream': '😱', 'innocent': '😇', 'unamused': '😒', 'expressionless': '😑',
         'frowning': '😦', 'arrow_down': '⬇️', 'grin': '😁', 'rose': '🌹', 'eyes': '👀',
         'point_up': '☝️', 'crazy_face': '🤪', 'cowboy_hat_face': '🤠'}

def emoji_of(tag):
    m = re.search(r'title=":([^":]+):"', tag)
    if not m: return ''
    return EMOJI.get(m.group(1), ':' + m.group(1) + ':')

def text_of(cooked):
    """HTML ديسكورس ⇐ نصٌّ عاديّ (حقل ‎desc‎ نصٌّ يُهرَّب ويُعرض pre-wrap).

    ===== وبأسلوب كاتبه لا بأسلوبنا =====
    لا يُضاف حرفٌ ليس منه: لا شرطةٌ ولا نقطةٌ ولا تنسيق. فسطرُه (‎<br>‎) سطر،
    وفقرتُه (‎</p>‎) فراغٌ بين فقرتين — كما قسّمها هو. ولا يُحذف إلّا ما ليس
    كلامَه: الاقتباسُ من غيره، وأسطرُ HTML الخام."""
    t = re.sub(r'<aside class="quote[^"]*".*?</aside>', '', cooked, flags=re.S)   # الاقتباسُ ليس كلامَه
    # والوجهُ التعبيريُّ وجهُه: صورةُ ديسكورس تعود حرفَها كما كتبه
    t = re.sub(r'<img[^>]*class="emoji[^"]*"[^>]*>', lambda m: emoji_of(m.group(0)), t)
    t = t.replace('\n', '')                                  # أسطرُ HTML الخام ليست أسطرَه
    t = re.sub(r'<br\s*/?>', '\n', t)
    t = re.sub(r'</(p|div|h\d|blockquote)>', '\n\n', t)
    t = re.sub(r'</li>', '\n', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = H.unescape(t).replace('\u00a0', ' ')
    t = '\n'.join(re.sub(r'[ \t]+', ' ', l).strip() for l in t.split('\n'))
    return re.sub(r'\n{3,}', '\n\n', t).strip()

def avatar(tpl):
    return BASE + tpl.replace('{size}', '144') if tpl.startswith('/') else tpl

def ms(iso):
    return int(datetime.fromisoformat(iso.replace('Z', '+00:00')).timestamp() * 1000)

def q(s):
    return "'" + str(s).replace("'", "''") + "'"

def load_post(src, cache, tid, num):
    if tid not in cache:
        cache[tid] = json.load(open(os.path.join(src, '%d.json' % tid), encoding='utf-8'))
    t = cache[tid]
    return t, next(x for x in t['post_stream']['posts'] if x['post_number'] == num)

def author(users, p):
    un = p['username']
    uid = 'stk-' + un.lower()
    users[uid] = {'id': uid, 'name': p.get('name') or un, 'img': avatar(p['avatar_template']),
                  'email': un.lower() + '@import.stkfupm.invalid', 'user': un}
    return uid

def imp_of(t, p):
    return {'src': 'stkfupm', 'url': '%s/t/%s/%d/%d' % (BASE, t['slug'], t['id'], p['post_number']),
            'user': p['username'], 'ts': ms(p['created_at']), 'tid': t['id'], 'pn': p['post_number']}

def main(src):
    os.makedirs(OUT, exist_ok=True)
    cache = {}
    for code in sorted(set(PICK) | set(PICK_DOC)):
        users, posts = {}, []
        # ---- «المادة»: مساهمةٌ لكلّ مشاركة
        for tid, num, book in PICK.get(code, []):
            t, p = load_post(src, cache, tid, num)
            uid = author(users, p)
            imp = imp_of(t, p)
            data = {'desc': text_of(p['cooked']), 'type': '', 'rel': 0, 'lang': '', 'book': book, 'imp': imp}
            posts.append({'id': 'stk-p%d' % p['id'], 'uid': uid, 'code': code, 'sec': 'info',
                          'ts': imp['ts'], 'st': 'pub', 'data': data})
        # ---- «الدكاترة»: مساهمةٌ واحدةٌ لكلّ كاتب (‎UNIQUE(uid, code, sec)‎)، وصفٌّ لكلّ دكتورٍ قيّمه
        rows = {}
        for tid, num, dr in PICK_DOC.get(code, []):
            t, p = load_post(src, cache, tid, num)
            uid = author(users, p)
            imp = imp_of(t, p)
            have = rows.setdefault(uid, [])
            if any(r['id'] == dr for r in have):
                sys.exit('%s كتب عن %s مرّتين في %s: صفٌّ واحدٌ للدكتور في المساهمة' % (uid, dr, code))
            have.append({'id': dr, 'n': DOCTORS[dr], 'en': '', 'img': '', 'e': '', 'bld': '', 'room': '',
                         'd': text_of(p['cooked']), 'hours': [], 'teach': 0, 'grade': 0,
                         'pid': 'stk-p%d' % p['id'], 'imp': imp})
        for uid, rs in rows.items():
            rs.sort(key=lambda r: r['imp']['ts'])
            posts.append({'id': 'stk-doc-%s-%s' % (uid[4:], code.replace(' ', '').lower()), 'uid': uid,
                          'code': code, 'sec': 'doc', 'ts': rs[0]['imp']['ts'], 'st': 'pub',
                          'data': {'docs': rs}})
        slug = code.replace(' ', '')
        json.dump({'code': code, 'users': list(users.values()), 'posts': posts},
                  io.open(os.path.join(OUT, slug + '.json'), 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=2)
        now = int(datetime.now().timestamp())
        L = ['-- نقلٌ من مجتمع STKFUPM ⇐ أكاديميا · %s · ولَّده _import/stkfupm.py' % code,
             '-- يُعاد تشغيلُه بلا ضرر: ON CONFLICT يحدّث ولا يكرّر.', 'BEGIN;']
        for u in users.values():
            L.append("INSERT INTO users (id, email, name, img, pw_hash, pw_salt, pw_iter, verified, created, seen) "
                     "VALUES (%s, %s, %s, %s, '', '', 0, 0, %d, %d) "
                     "ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, img = EXCLUDED.img;"
                     % (q(u['id']), q(u['email']), q(u['name']), q(u['img']), now, now))
        for p in posts:
            L.append("INSERT INTO posts (id, uid, code, sec, data, ts, updated, st) "
                     "VALUES (%s, %s, %s, %s, %s, %d, %d, 'pub') "
                     "ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, ts = EXCLUDED.ts, updated = EXCLUDED.updated;"
                     % (q(p['id']), q(p['uid']), q(p['code']), q(p['sec']),
                        q(json.dumps(p['data'], ensure_ascii=False)), p['ts'], now))
        L.append('COMMIT;')
        io.open(os.path.join(OUT, slug + '.sql'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
        nd = sum(len(p['data'].get('docs', [])) for p in posts if p['sec'] == 'doc')
        print('%s: %d كاتبًا · %d مساهمة (منها %d تقييمَ دكتور) ⇐ _import/out/%s.{json,sql}'
              % (code, len(users), len(posts), nd, slug))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
