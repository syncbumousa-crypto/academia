"""Courses of the College of Computing and Mathematics majors.

Plans: the undergraduate bulletin's program pages
(bulletin.kfupm.edu.sa/program?program_id=N, "Degree Plan" tab), both the
internship and summer-training options where a program has two:

  cs 101,102 · swe 119 · coe 99,100 · ise 109,110 · amai 1164
  dse 1157 · sde 1159 · aics 1160,1161     -> data/plans_ccm_bulletin.json

Every course in a plan is linked to its major. Elective slots name a prefix
and (sometimes) a level only; each is filled with the courses of the
Registrar's Course Offering, terms 202520-202630 (data/offering_*.json),
lectures/labs only, no co-op, internship, training, project, thesis or
seminar:

  cs, swe  ICS/SWE xxx  -> ICS, SWE 3xx/4xx
  coe      COE 4xx      ise   ISE 4xx
  amai     MATH xxx     -> MATH 3xx/4xx
  dse      DATA xxx     -> DATA 3xx/4xx (offering + bulletin: new prefix)
  all      IAS xxx      -> IAS 3xx/4xx, and GS xxx -> any GS

"XE xxx" (Technical Elective) and "XXX xxx" (Science/Free/Technical
Elective) are placeholders for any department, so they are not linked.

  python3 _catalog/computing_2026.py <live_catalog.json>
  -> _catalog/out/computing_2026.{json,sql}
"""
import json, os, re, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
D = lambda f: json.load(open(os.path.join(HERE, 'data', f), encoding='utf-8'))
PLANS, OFF, BUL = D('plans_ccm_bulletin.json'), D('offering_202520-202630.json'), D('bulletin_ug.json')
LIVE = {c['code']: c for c in json.load(open(sys.argv[1], encoding='utf-8'))['courses']}

GEN = [('IAS', '34'), ('GS', '1234')]
SLOTS = {
    'cs': [('ICS', '34'), ('SWE', '34')], 'swe': [('ICS', '34'), ('SWE', '34')],
    'coe': [('COE', '4')], 'ise': [('ISE', '4')], 'amai': [('MATH', '34')],
    'dse': [('DATA', '34')], 'sde': [], 'aics': [],
}
FROM_BULLETIN = {'DATA'}
REGULAR = {'LEC', 'LAB', 'LLB'}
NOT_ELECTIVE = re.compile(r'senior|internship|summer training|cooperative|co-op|thesis|seminar|independent|team design', re.I)

DEPT_AR = {'AISC': 'ذكاء وأمن', 'CE': 'مدنية', 'CHEM': 'كيمياء', 'CIE': 'تحكم', 'COE': 'هندسة حاسب',
           'DATA': 'بيانات', 'EE': 'كهربائية', 'ICS': 'حاسب', 'ISE': 'صناعية', 'MATH': 'رياضيات',
           'ME': 'ميكانيكية', 'MSE': 'مواد', 'PHYS': 'فيزياء', 'SDE': 'أشباه موصلات', 'STAT': 'احصاء',
           'SWE': 'برمجيات'}
TRAIN = {'398': 'التدريب التعاوني', '399': 'التدريب الصيفي'}
FULL_AR = {
    'AISC 411': 'مشروع التخرّج ١', 'AISC 412': 'مشروع التخرّج ٢',
    'CE 101': 'الرسم الهندسي',
    'CHEM 101': 'مبادئ العلوم الكيميائية ١',
    'CIE 301': 'الطرق العددية', 'CIE 305': 'أنظمة التحكم الخطية',
    'COE 202': 'تصميم المنطق الرقمي', 'COE 203': 'معمل المنطق الرقمي',
    'COE 233': 'المنطق الرقمي وتنظيم الحاسب', 'COE 241': 'اتصالات البيانات والحاسب',
    'COE 301': 'تنظيم الحاسب', 'COE 302': 'تصميم ونمذجة الأنظمة الرقمية',
    'COE 306': 'مقدّمة في الأنظمة المدمجة', 'COE 346': 'أمن الحاسب والشبكات',
    'COE 384': 'أساسيات التصميم في هندسة الحاسب', 'COE 403': 'معمارية الحاسب',
    'COE 407': 'تصميم النظام على شريحة', 'COE 411': 'مشروع التخرّج ١', 'COE 412': 'مشروع التخرّج ٢',
    'COE 413': 'تصنيع النظام على شريحة', 'COE 426': 'خصوصية البيانات',
    'COE 427': 'الحوسبة الموزّعة', 'COE 444': 'تصميم الشبكات', 'COE 446': 'الحوسبة المتنقّلة',
    'COE 449': 'موضوعات خاصّة في اتصالات الحاسب والشبكات', 'COE 450': 'مقدّمة في الأنظمة الذكية',
    'COE 452': 'مبادئ الأنظمة السحابية', 'COE 453': 'الحوسبة السحابية والطرفية',
    'COE 454': 'إنترنت الأشياء', 'COE 461': 'مبادئ تصميم الدوائر المتكاملة (VLSI)',
    'COE 464': 'اختبار الدوائر الرقمية', 'COE 465': 'منهجية تصميم أنظمة VLSI',
    'DATA 201': 'الاحتمالات لعلم البيانات', 'DATA 211': 'مقدّمة في علم البيانات',
    'DATA 301': 'البيانات والاستدلال والقرارات', 'DATA 311': 'هندسة البيانات',
    'DATA 321': 'نظرية المصفوفات لعلم البيانات', 'DATA 322': 'النمذجة الرياضية لعلم البيانات',
    'DATA 341': 'الطرق الإحصائية لعلم البيانات', 'DATA 361': 'أساسيات أنظمة قواعد البيانات',
    'DATA 391': 'السياقات الإنسانية وأخلاقيات البيانات', 'DATA 411': 'مشروع التخرّج ١', 'DATA 412': 'مشروع التخرّج ٢',
    'DATA 421': 'الأمثلة لعلم البيانات', 'DATA 431': 'البلوك تشين والعملات المشفّرة',
    'DATA 441': 'النماذج اللغوية الكبيرة', 'DATA 442': 'الذكاء الاصطناعي التوليدي وتطبيقاته',
    'DATA 471': 'تحليلات البيانات الضخمة',
    'EE 201': 'الدوائر الكهربائية', 'EE 203': 'الإلكترونيات ١', 'EE 207': 'الإشارات والأنظمة',
    'EE 236': 'الدوائر الإلكترونية (لغير طلاب الكهربائية)', 'EE 237': 'معمل الدوائر الإلكترونية (لغير طلاب الكهربائية)',
    'EE 272': 'معمل الإلكترونيات التماثلية والرقمية', 'EE 303': 'الإلكترونيات ٢',
    'EE 315': 'الطرق الاحتمالية في الهندسة الكهربائية', 'EE 425': 'تحليل وتصميم الدوائر المتكاملة',
    'ICS 202': 'هياكل البيانات والخوارزميات', 'ICS 253': 'الهياكل المتقطّعة', 'ICS 321': 'أنظمة قواعد البيانات',
    'ICS 343': 'أساسيات شبكات الحاسب', 'ICS 344': 'أمن المعلومات', 'ICS 353': 'تصميم الخوارزميات وتحليلها',
    'ICS 381': 'مبادئ الذكاء الاصطناعي', 'ICS 410': 'لغات البرمجة', 'ICS 413': 'مشروع التخرّج ١',
    'ICS 414': 'مشروع التخرّج ٢', 'ICS 433': 'أنظمة التشغيل', 'ICS 440': 'التشفير وتطبيقات البلوك تشين',
    'ICS 442': 'اختبار الاختراق والاختراق الأخلاقي', 'ICS 445': 'إدارة الشبكات وأمنها',
    'ICS 467': 'أمن أنظمة الذكاء الاصطناعي', 'ICS 471': 'التعلّم العميق', 'ICS 472': 'معالجة اللغات الطبيعية',
    'ICS 476': 'الذكاء الاصطناعي للأمن السيبراني', 'ICS 480': 'الهندسة العكسية والاستغلال',
    'ICS 483': 'الرؤية الحاسوبية', 'ICS 485': 'تعلّم الآلة',
    'ISE 205': 'الاحتمالات والإحصاء الهندسي', 'ISE 411': 'مشروع التخرّج ١', 'ISE 412': 'مشروع التخرّج ٢',
    'ISE 499': 'السمنارات',
    'MATH 201': 'حساب التفاضل والتكامل ٣', 'MATH 315': 'تطوّر الرياضيات', 'MATH 320': 'الرياضيات لتعلّم الآلة',
    'MATH 323': 'الجبر ١', 'MATH 333': 'طرق الرياضيات التطبيقية', 'MATH 335': 'النمذجة الرياضية',
    'MATH 341': 'التحليل الحقيقي ١', 'MATH 371': 'الحوسبة العددية', 'MATH 373': 'الجبر الخطي العددي',
    'MATH 405': 'التعلّم من البيانات', 'MATH 407': 'نظرية الألعاب التطبيقية', 'MATH 413': 'مشروع التخرّج ١',
    'MATH 414': 'مشروع التخرّج ٢', 'MATH 427': 'نظرية الأعداد', 'MATH 428': 'مقدّمة في التشفير',
    'MATH 429': 'نظرية الترميز', 'MATH 434': 'حساب التغيّرات والتحكم الأمثل', 'MATH 441': 'التحليل الحقيقي ٢',
    'MATH 445': 'مقدّمة في المتغيّرات المركّبة', 'MATH 453': 'الطوبولوجيا الرقمية', 'MATH 463': 'التوافقيات التطبيقية',
    'MATH 475': 'أمثلة التصميم الهندسي', 'MATH 498': 'موضوعات في الرياضيات ١',
    'ME 322': 'عمليات التصنيع', 'ME 323': 'معمل التصنيع',
    'MSE 201': 'مقدّمة في المواد', 'MSE 202': 'معمل المواد',
    'PHYS 101': 'الفيزياء العامة ١', 'PHYS 102': 'الفيزياء العامة ٢', 'PHYS 336': 'فيزياء أجهزة أشباه الموصلات',
    'SDE 411': 'مشروع التخرّج ١', 'SDE 412': 'مشروع التخرّج ٢',
    'STAT 201': 'الاحتمالات والإحصاء للمهندسين والعلماء', 'STAT 460': 'السلاسل الزمنية',
    'SWE 316': 'تصميم البرمجيات وبناؤها', 'SWE 326': 'اختبار البرمجيات', 'SWE 363': 'هندسة وتطوير الويب',
    'SWE 387': 'إدارة مشاريع البرمجيات', 'SWE 402': 'برمجة الألعاب', 'SWE 413': 'مشروع التخرّج ١',
    'SWE 414': 'مشروع التخرّج ٢', 'SWE 439': 'هندسة جودة البرمجيات', 'SWE 445': 'تطوير البرمجيات الآمنة',
    'SWE 455': 'هندسة التطبيقات السحابية',
}
PROJECT_OR_TRAINING = re.compile(r'senior|project|internship|summer training|seminar', re.I)


def fits(code, slots):
    p, n = code.split()
    return any(p == sp and n[0] in lv for sp, lv in slots)


core_all = {}
links = {}
for tag, plan in PLANS.items():
    for code, d in plan['core'].items():
        core_all.setdefault(code, d)
        links.setdefault(code, set()).add(tag)
    pool = set(OFF) | {c for c in BUL if c.split()[0] in FROM_BULLETIN}
    for code in sorted(pool):
        if code in plan['core'] or not fits(code, SLOTS[tag] + GEN):
            continue
        if code in OFF and not set(OFF[code]['act']) <= REGULAR:
            continue
        if NOT_ELECTIVE.search((OFF.get(code) or BUL.get(code))['name']):
            continue
        links.setdefault(code, set()).add(tag)

new, rows, missing = [], [], []
for code in sorted(links):
    if code not in LIVE:
        d = core_all.get(code) or BUL.get(code)
        p, n = code.split()
        full = FULL_AR.get(code) or TRAIN.get(n)
        if not full or not d:
            missing.append(code)
            continue
        lab = d['lb'] > 0 and d['lt'] > 0 and not PROJECT_OR_TRAINING.search(d['name'])
        new.append(dict(code=code, ar=f'{DEPT_AR[p]} {n}', full=full, h=d['cr'], lab=int(lab)))
    for t in sorted(links[code]):
        if not (code in LIVE and t in LIVE[code]['tags']):
            rows.append((code, t))
if missing:
    sys.exit('missing name/hours: ' + ', '.join(missing))

q = lambda s: "'" + s.replace("'", "''") + "'"
sql = ['BEGIN;']
sql += ['INSERT INTO courses (code, ar, "full", h, lab) VALUES (%s, %s, %s, %d, %d) ON CONFLICT (code) DO NOTHING;'
        % (q(c['code']), q(c['ar']), q(c['full']), c['h'], c['lab']) for c in new]
sql += ['INSERT INTO course_tags (code, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;' % (q(a), q(b)) for a, b in rows]
sql += ["UPDATE meta SET v = '%d' WHERE k = 'catalog_rev';" % (time.time() * 1000), 'COMMIT;']

out = os.path.join(HERE, 'out')
os.makedirs(out, exist_ok=True)
json.dump({'new': new, 'links': rows, 'by_course': {k: sorted(v) for k, v in links.items()}},
          open(os.path.join(out, 'computing_2026.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(out, 'computing_2026.sql'), 'w', encoding='utf-8').write('\n'.join(sql) + '\n')
tot = {t: sum(1 for v in links.values() if t in v) for t in PLANS}
print('courses', len(links), 'new', len(new), 'new links', len(rows), 'per major', tot)
