# -*- coding: utf-8 -*-
r"""
ينشر الموقع على كلاودفلير بيچز — بحرّاسه.

    python _deploy.py            يفحص ويجهّز وينشر
    python _deploy.py --dry      يفحص ويجهّز ولا ينشر
    python _deploy.py --stage    يجهّز ويقف (لتنظر بعينك)

وخمسُ مراحل، وأيُّها سقطت وقف كلُّه:
  ١ · المحرّكُ مدموج    ‎_bundle.py --check‎ — لئلّا يُنشر ‎app.js‎ يخالف أجزاءه
  ٢ · المساراتُ تُحلّ   كلُّ ما تذكره صفحةٌ يُحلّ **من موضعها هي** ويوجد على القرص
  ٣ · التجهيز          روابطُ صلبةٌ لا نسخ — لا تُستهلك مئتا ميجا ولا دقيقةُ نسخ
  ٤ · حارسُ التجهيز     ما لا يُرفع: لا يُرفع
  ٥ · النشر            ‎wrangler pages deploy‎

===== ولمَ قائمةُ سماحٍ وحارسٌ معًا؟ =====
لأنّ قائمة المنع تنسى. يومَ صار المجلّدُ مستودعَ ‎git‎ التقطه المشيُ ورُفع ‎.git‎
كلُّه إلى موقعٍ عامّ — والقائمةُ حينها كانت تستثني ‎admin‎ و‎README.md‎ ولم تكن
تعرف ‎.git‎. فصار **كلُّ ما يبدأ بنقطة يُترك**، ثمّ **حارسٌ يفحص المُجهَّز** فيرفض
إن وجد ما لا يُرفع. القاعدةُ تنسى، والحارسُ لا ينسى.
"""
import io, os, re, sys, shutil, subprocess, posixpath

ROOT  = os.path.dirname(os.path.abspath(__file__))
STAGE = os.path.join(ROOT, '.stage')          # يبدأ بنقطة: يستثنيه ‎git‎ والتجهيز معًا
PROJECT = 'academia-kfupm'
LIVE    = 'https://academia-kfupm.pages.dev'

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ---------- ما لا يُرفع ----------
SKIP_DIRS  = set()                     # (كانت ‎admin‎ — نُشرت ٢٨ أغسطس بقرار صاحب الموقع)
SKIP_FILES = {'README.md',             # وثيقةٌ داخليّة
              'wrangler.toml',         # ضبطُ الربط: يقرؤه wrangler من الجذر ولا يُقدَّم
              'ROADMAP-SERVER.md'}
SKIP_PATHS = {'platform/app'}          # أجزاءُ المحرّك: مدخلُ بناءٍ لا مخرَجه
SKIP_ROOT_PREFIX = '_'                 # ملفّاتُ العُدّة
# وكلُّ ما يبدأ بنقطة، في أيّ عمق (‎.git‎ و‎.stage‎ وما يجيء بعدهما)


def die(msg):
    print('\n✗ ' + msg)
    sys.exit(1)


# ============================================================
# ١ · المحرّكُ مدموج
# ============================================================
def step_bundle():
    r = subprocess.run([sys.executable, os.path.join(ROOT, '_bundle.py'), '--check'],
                       capture_output=True, text=True, encoding='utf-8')
    out = (r.stdout or '').strip()
    print('١ · المحرّك: ' + (out.splitlines()[0] if out else '—'))
    if r.returncode != 0:
        die('المحرّكُ يخالف أجزاءه. شغّل ‎python _bundle.py‎ أوّلًا.')


# ============================================================
# ٢ · المساراتُ تُحلّ من مواضعها
# ============================================================
def step_paths():
    bad = []

    def here(page, href):
        """أين يقع ‎href‎ إذا ذُكر في ‎page‎؟ (‎/‎ = من الجذر)"""
        if href.startswith('/'):
            return os.path.join(ROOT, href.lstrip('/').replace('/', os.sep))
        base = os.path.dirname(os.path.join(ROOT, page.replace('/', os.sep)))
        return os.path.normpath(os.path.join(base, href.replace('/', os.sep)))

    pages = ['index.html', '404.html', 'transfer.html',
             'platform/index.html', 'admin/index.html']
    n = 0
    for p in pages:
        fp = os.path.join(ROOT, p.replace('/', os.sep))
        if not os.path.isfile(fp):
            bad.append('صفحةٌ مفقودة: ' + p); continue
        s = io.open(fp, encoding='utf-8', newline='').read()
        refs = re.findall(r'<script src="([^"]+)"', s) + re.findall(r'<link[^>]+href="([^"]+)"', s)
        for h in refs:
            if h.startswith(('http:', 'https:', 'data:', '#')):
                continue
            n += 1
            if not os.path.isfile(here(p, h)):
                bad.append('%s ⇐ %s' % (p, h))

    # والخطوطُ تُحلّ من ورقة الأنماط لا من الصفحة
    css = os.path.join(ROOT, 'shared', 'styles.css')
    s = io.open(css, encoding='utf-8', newline='').read()
    for u in re.findall(r"url\('([^']+)'", s):
        n += 1
        if not os.path.isfile(os.path.normpath(os.path.join(os.path.dirname(css), u.replace('/', os.sep)))):
            bad.append('styles.css ⇐ ' + u)

    print('٢ · المسارات: %d مرجعًا · مكسور %d' % (n, len(bad)))
    for x in bad[:8]:
        print('     - ' + x)
    if bad:
        die('مراجعُ مكسورة — لا يُنشر')


# ============================================================
# ٣ · التجهيز
# ============================================================
def step_stage():
    if os.path.exists(STAGE):
        for r, ds, fs in os.walk(STAGE):        # ‎git‎ يترك ملفّاتٍ للقراءة فقط
            for x in fs:
                try: os.chmod(os.path.join(r, x), 0o666)
                except OSError: pass
        shutil.rmtree(STAGE, ignore_errors=True)
    n = 0
    for root, dirs, files in os.walk(ROOT):
        rel = os.path.relpath(root, ROOT)
        rel = '' if rel == '.' else rel
        here_p = rel.replace(os.sep, '/')
        # وبادئةُ العُدّة تُستثنى مجلّداتٍ كما تُستثنى ملفّات: ‎__pycache__‎ يُولد في
        # الجذر كلّما استُورد سكربتٌ من هنا، فلولا هذا لَدخل الرفعَ ثمّ صاح الحارس.
        # والمنعُ أولى من الإمساك — والحارسُ يبقى لِما لم يُتوقّع.
        dirs[:] = [d for d in dirs
                   if not d.startswith('.')
                   and not (not rel and (d in SKIP_DIRS or d.startswith(SKIP_ROOT_PREFIX)))
                   and posixpath.join(here_p, d).lstrip('/') not in SKIP_PATHS]
        out = os.path.join(STAGE, rel) if rel else STAGE
        os.makedirs(out, exist_ok=True)
        for f in files:
            if f.startswith('.'):
                continue
            if not rel and (f in SKIP_FILES or f.startswith(SKIP_ROOT_PREFIX)):
                continue
            s, d = os.path.join(root, f), os.path.join(out, f)
            try: os.link(s, d)
            except OSError: shutil.copy2(s, d)
            n += 1
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(STAGE) for f in fs)
    print('٣ · التجهيز: %d ملفًّا · %.1f ميجا' % (n, size / 1048576))
    return n, size


# ============================================================
# ٤ · حارسُ التجهيز — يفحص ما جُهّز، لا ما نوينا
# ============================================================
def step_guard(n, size):
    bad = []
    dots = [os.path.relpath(os.path.join(r, x), STAGE)
            for r, ds, fs in os.walk(STAGE) for x in (ds + fs) if x.startswith('.')]
    if dots:                    bad.append('أسماءٌ بنقطة: %s' % dots[:4])
    for p in SKIP_PATHS:
        if os.path.exists(os.path.join(STAGE, p.replace('/', os.sep))):
            bad.append('مدخلُ بناءٍ تسرّب: ' + p)
    for d in SKIP_DIRS:
        if os.path.isdir(os.path.join(STAGE, d)): bad.append('مجلّدٌ مستثنًى تسرّب: ' + d)
    for f in os.listdir(STAGE):
        if f.startswith(SKIP_ROOT_PREFIX) or f in SKIP_FILES:
            bad.append('ملفٌّ مستثنًى تسرّب: ' + f)
    if not os.path.isfile(os.path.join(STAGE, 'index.html')): bad.append('لا بابَ في الجذر')
    if not os.path.isfile(os.path.join(STAGE, '404.html')):   bad.append('لا صفحةَ ٤٠٤')
    if n > 20000:               bad.append('فوق حدّ كلاودفلير: ٢٠٠٠٠ ملفّ')
    big = [os.path.relpath(os.path.join(r, f), STAGE)
           for r, _, fs in os.walk(STAGE) for f in fs
           if os.path.getsize(os.path.join(r, f)) > 25 * 1024 * 1024]
    if big:                     bad.append('فوق ٢٥ ميجا للملفّ: %s' % big[:3])

    print('٤ · الحارس: ' + ('✓ نظيف' if not bad else '✗ %d' % len(bad)))
    for x in bad: print('     - ' + str(x))
    if bad: die('لا يُرفع')


# ============================================================
# ٥ · النشر
# ============================================================
def step_deploy():
    cmd = ['npx', '--yes', 'wrangler@latest', 'pages', 'deploy', STAGE,
           '--project-name=' + PROJECT, '--branch=main', '--commit-dirty=true']
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8',
                       errors='replace', shell=(os.name == 'nt'))
    out = (r.stdout or '') + (r.stderr or '')
    for l in out.splitlines():
        if any(k in l for k in ('Uploaded', 'Deployment complete', 'Success', '✘', 'Error')):
            print('     ' + l.strip())
    if r.returncode != 0:
        die('فشل النشر')
    print('\n✓ منشور: ' + LIVE)


if __name__ == '__main__':
    dry   = '--dry' in sys.argv
    stage = '--stage' in sys.argv
    step_bundle()
    step_paths()
    n, size = step_stage()
    step_guard(n, size)
    if stage:
        print('\nالمُجهَّز في: ' + STAGE); sys.exit(0)
    if dry:
        print('\n✓ كلُّ الحرّاس مرّت — ولم يُنشر (‎--dry‎)'); sys.exit(0)
    print('٥ · النشر…')
    step_deploy()
