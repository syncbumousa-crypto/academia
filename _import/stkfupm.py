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
    (120957, 8,  'Managerial Accounting — Braun & Tietz, 3rd Ed.'),  # الكتاب الجديد
    (120957, 9,  ''),                                         # تجربة ترم 141
    (120957, 11, ''),                                         # تجربة ترم 142 — أطولها وأنفعها
    (120957, 12, ''),                                         # تجربة ترم 162
    (120957, 13, ''),                                         # تجربة ترم 192
  ],
}

def text_of(cooked):
    """HTML ديسكورس ⇐ نصٌّ عاديّ بأسطره (حقل ‎desc‎ نصٌّ يُهرَّب ويُعرض pre-wrap)."""
    t = re.sub(r'<aside class="quote".*?</aside>', '', cooked, flags=re.S)   # الاقتباسُ ليس كلامَه
    t = re.sub(r'<br\s*/?>', '\n', t)
    t = re.sub(r'</(p|li|h\d|div)>', '\n', t)
    t = re.sub(r'<li[^>]*>', '• ', t)
    t = re.sub(r'<[^>]+>', '', t)
    t = H.unescape(t).replace(' ', ' ')
    t = '\n'.join(re.sub(r'[ \t]+', ' ', l).strip() for l in t.split('\n'))
    return re.sub(r'\n{2,}', '\n', t).strip()   # ديسكورس يجعل كلَّ سطرٍ فقرةً: فراغٌ بين كلّ سطرين

def avatar(tpl):
    return BASE + tpl.replace('{size}', '144') if tpl.startswith('/') else tpl

def ms(iso):
    return int(datetime.fromisoformat(iso.replace('Z', '+00:00')).timestamp() * 1000)

def q(s):
    return "'" + str(s).replace("'", "''") + "'"

def main(src):
    os.makedirs(OUT, exist_ok=True)
    for code, picks in PICK.items():
        users, posts = {}, []
        for tid, num, book in picks:
            t = json.load(open(os.path.join(src, '%d.json' % tid), encoding='utf-8'))
            p = next(x for x in t['post_stream']['posts'] if x['post_number'] == num)
            un = p['username']
            uid = 'stk-' + un.lower()
            users[uid] = {'id': uid, 'name': p.get('name') or un, 'img': avatar(p['avatar_template']),
                          'email': un.lower() + '@import.stkfupm.invalid', 'user': un}
            ts = ms(p['created_at'])
            url = '%s/t/%s/%d/%d' % (BASE, t['slug'], tid, num)
            data = {'desc': text_of(p['cooked']), 'type': '', 'rel': 0, 'lang': '', 'book': book,
                    'imp': {'src': 'stkfupm', 'url': url, 'user': un, 'ts': ts, 'tid': tid, 'pn': num}}
            posts.append({'id': 'stk-p%d' % p['id'], 'uid': uid, 'code': code, 'sec': 'info',
                          'ts': ts, 'st': 'pub', 'data': data})
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
        print('%s: %d كاتبًا · %d مساهمة ⇐ _import/out/%s.{json,sql}' % (code, len(users), len(posts), slug))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
