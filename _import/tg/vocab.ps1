# Search vocabulary per tab for ENGL 101, measured against the whole export.
# Text is normalised before matching: lower-case, no tashkeel/tatweel, أإآ→ا, ة→ه, ى→ي.
param([string]$Export, [string]$OutJson)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -Path (Join-Path $here 'TgParse.cs')
[void][TgParse]::Parse($Export); $all = [TgParse]::All; $by = [TgParse]::ById

# ---- concept spellings (from the token frequencies of the group itself)
$MAC = [ordered]@{
  W    = '(?:ال)?(?:رايتنق|رايتينق|رايتنج|رايتينج|رايتنغ|writing|wt ?[12])'
  R    = '(?:ال)?(?:ريدنق|ريدينق|ريدنج|ريدنغ|ريدينغ|reading)'
  V    = '(?:ال)?(?:فوكاب\w*|vocab\w*|awl)'
  G    = '(?:ال)?(?:قرامر|قرمر|جرامر|gramm[ae]r)'
  P    = '(?:ال)?(?:بورتف\w+|برتف\w+|بورتوف\w+|portfolios?)'
  E    = '(?:ال)?(?:ايسي|ايساي|ايسس|essays?|برقراف|براقراف|برجراف|paragraphs?)'
  MID  = '(?:ال)?(?:ميد|مد|ميدتيرم|ميدترم|مدترم|midterm|mte)'
  FIN  = '(?:ال)?(?:فاينل|فاينال|final)'
  QZ   = '(?:ال)?(?:كويز\w*|كوز\w*|quiz\w*)'
  EX   = '(?:ال)?(?:اختبار\w*|امتحان\w*|exams?|تست|tests?)'
  DR   = '(?:ال)?(?:دكتور\w*|دكاتر\w*|مس|مستر|انستركتور|instructors?|تيتشر|teachers?|استاذ\w*)'
  CRS  = '(?:ال)?(?:ماده|كورس|course|انقلش|انجلش|انجليزي|english|engl) ?(?:101|١٠١)?'
  HOW  = '(?:كيف|كيفها|كيفه|شلون|وش|ايش|شنو|وشلون)'
  WHO  = '(?:مين|من|منو|اي|وش|ايش)'
  BEST = '(?:افضل|احسن|ازين|اسهل|اكرم|اشد|اسوا|اسوء)'
  DRN  = '(?:gazdar|قازدار|غازدار|ماهر|mahir|taiseer|تيسير|adil|عادل محمود|megan|ميقن|ميغن|pamela|باميلا|adam khan|ادم خان|owen|اوين|cameron|كاميرون|mclaren|ماكلارن|hampson|تيموثي|timothy|lees|ليز|loftus|لوفتس|harrison|هاريسون|vernon|فيرنون|watts|واتس|saddia|ساديا|سعديه|lance|لانس|james joseph|austin|اوستن|ross|روس|tylor|taylor|تايلور|flores|فلورس|kirkwood|كيرك ?وود|booth|pearson|بيرسون|keith|كيث)'
}
function X($p) { foreach ($k in $MAC.Keys) { $p = $p.Replace("{$k}", $MAC[$k]) }; $p }

# ---- questions per tab: what people ask (q) and how answers / statements are phrased (s)
$V = [ordered]@{
 info = [ordered]@{
  'q كيف المادة'            = '{HOW} .{0,12}{CRS}(?: |$|\?|؟)'
  'q صعبة / سهلة'           = '{CRS}.{0,25}(?:صعب|سهل|ثقيل|خفيف|متعب|تخوف|يخوف|تحتاج|يحتاج|يبيله|يبغاله)'
  'q وش ندرس فيها'          = '(?:وش|ايش) (?:فيها|فيه|ندرس|ناخذ|بناخذ|ياخذون|نسوي) .{0,15}{CRS}|عن (?:وش|ايش) {CRS}|{CRS} عن (?:وش|ايش)'
  'q الفرق عن غيرها'        = '(?:الفرق|فرق|تفرق|يفرق|مقارنه|زي|مثل|نفس) .{0,20}(?:102|١٠٢|تحضيري|اوريا|orya|eng ?0[1-4]|انقلش ?[1-4])'
  's تجربتي مع المادة'      = '(?:تجربه|تجربتي|تجربتنا) .{0,40}{CRS}|{CRS} .{0,20}(?:تجربه|تجربتي)'
  's المادة عبارة عن'       = '{CRS} (?:عباره|تعتمد|معتمده|كلها|كله|اغلبها|اغلبه|اساسها|مبنيه)'
 }
 doc = [ordered]@{
  'q وش رايكم ب'            = '(?:وش|ايش|كيف|شلون) (?:رايكم|رايك|تقييمكم) .{0,40}|(?:رايكم|رايك) (?:ب|في)(?:ال)?{DR}'
  'q مين أفضل دكتور'        = '{WHO} {BEST} .{0,12}{DR}|{BEST} {DR}|{DR} {BEST}'
  'q تنصحون ب'              = '(?:تنصحون\w*|تنصحوني|ينصح فيه|ينصح به|انصحكم|انصحك|انصح) .{0,30}{DR}|{DR} .{0,30}(?:تنصحون\w*|ينصح|انصح)'
  'q أحد أخذ عند'           = '(?:احد|حد|مين|في احد|فيه احد) .{0,12}(?:اخذ|ياخذ|درس|يدرس|جرب|يعرف|عنده) .{0,20}(?:عند|مع|{DR})'
  'q كيف تصحيحه / شرحه'    = '(?:كيف|شلون|وش) (?:تصحيح|شرح|تعامل|تحضير|فيدباك|اسلوب)(?:ه|ها)?(?: |$|\?|؟)'
  's كريم / شديد'           = '(?:كريم|كريمه|شديد|شديده|ظالم|يظلم|متساهل|يتساهل|يعطي|ما يعطي|بخيل) .{0,15}(?:بالدرجات|بالتصحيح|في التصحيح|بالقريد|القريد|درجات)'
  's قالب التقييم'          = '(?:اسم الدكتور|instructor ?:|اسلوب ?:|الشرح ?:|فيدباك ?:|التحضير ?:)'
  'n اسم دكتور'             = '{DRN}'
 }
 grade = [ordered]@{
  'q توزيع الدرجات'         = '(?:توزيع|تقسيم|تقسيمه|تقسيمة) (?:ال)?(?:درجات|درجه|قريد\w*|ماده|كورس)'
  'q كم على'                = 'كم (?:على|عليه|عليها|درجه|درجات|نسبه|بالميه|بالمئه|%)? ?.{0,12}(?:{MID}|{FIN}|{W}|{R}|{P}|{QZ})|(?:{MID}|{FIN}|{W}|{P}|{QZ}) (?:عليه|عليها|من) كم'
  'q كم سؤال / قطعة'        = '(?:كم) (?:سوال|سؤال|قطعه|قطعة|نص|تكست|برقراف|كلمه|كلمة|دقيقه|ساعه)|(?:عدد) (?:الاسئله|الكلمات|القطع)'
  'q شكل الاختبار'          = '(?:كيف|وش|ايش|شلون) (?:طريقه|نظام|شكل|اسئله|صيغه|نمط|يجي|تجي|بيجي|بتجي) .{0,12}(?:{MID}|{FIN}|{EX}|{V}|{G}|{R})'
  'q روبرك التصحيح'         = 'rubrics?|روبرك\w*|معايير (?:ال)?تصحيح|criteria|كيف (?:يصححون|يصحح|التصحيح)'
  'q سلّم التقديرات'        = '(?:من كم|كم|متى) .{0,8}(?:a\+|ايه بلس|ا\+|ايه|بي بلس|b\+)|(?:سلم|جدول|حدود) (?:ال)?(?:قريد\w*|تقدير\w*|درجات)|\b(?:curve|كيرف|ستاندر|standard|افرج|average)\b'
  's كل سؤال ب'             = '(?:كل سوال|كل سؤال|السوال|السؤال) (?:ب|عليه|بكم|عليه كم)|(?:نقطه|نقطتين|بوينت|points?) (?:لكل|على كل|each)|each'
  's النسب'                 = '\d{1,2} ?(?:%|٪|بالميه|بالمئه) .{0,30}\d{1,2} ?(?:%|٪|بالميه|بالمئه)'
 }
 srcU = [ordered]@{
  'q كيف أذاكر'             = '{HOW} (?:اذاكر\w*|نذاكر\w*|تذاكرون\w*|ذاكرتو\w*|ذاكرت\w*|استعد|نستعد|اتحسن|اطور|اتعلم|ابدا|احسن)'
  'q من وين أذاكر'          = '(?:من وين|وين|منين|من ايش|من وش) (?:اذاكر\w*|نذاكر\w*|افهم|اتعلم|ابدا)'
  'q ملخص / شرح'            = '(?:ملخص\w*|تلخيص\w*|تلاخيص|summar\w+|شرح|شروحات|سلايدات|slides?) .{0,15}(?:{G}|{W}|{R}|{V}|structure|ستركتشر|ستركشر|{E})'
  'q قناة / موقع'           = '(?:قناه|قناة|قنوات|يوتيوب|youtube|موقع|مواقع|مصدر|مصادر) .{0,25}(?:يشرح|تشرح|شرح|مفيد|كويس|زين|{G}|{W}|{R}|{V})'
  's نصيحة'                 = '(?:نصيحه|نصيحة|نصايح|نصائح|انصحكم|نصيحتي|tips|advice)'
  'q كيف أكتب'              = '(?:كيف|طريقه|طريقة) (?:اكتب|كتابه|كتابة|تكتب|نكتب) .{0,15}(?:{E}|intro\w*|انترو|thesis|ثيسس|كونكلوجن|conclusion|body|بودي|كاونتر)|(?:structure|ستركتشر|ستركشر) .{0,25}(?:compare|cause|argument|{E})'
  's ذاكرت كذا'             = '(?:ذاكرت|ذاكرته|كنت اذاكر|طريقتي|اللي سويته|سويت كذا) .{0,40}(?:{G}|{W}|{R}|{V}|{MID}|{FIN})'
 }
 srcP = [ordered]@{
  'q اختبارات قديمة'        = '(?:اولد|اولدات|old) ?(?:اكزام\w*|exams?|{MID}|{FIN})?|(?:اختبارات|نماذج|نموذج) (?:قديمه|سابقه|قديمة|سابقة)|نماذج (?:{MID}|{FIN}|اختبار\w*)'
  'q براكتس / تدريب'        = '(?:براكتس|practice) ?(?:تست|tests?|اكزام|exams?|{QZ})?|تدريب\w*|تمارين|تمرين'
  'q كويزلت / فورمز'        = 'كويزل?يت|كويزلت|quizlet|فلاش ?كارد\w*|flash ?cards?|كاهوت|kahoot|forms|فورمز'
  'q تجميعات / بنك'         = '(?:تجميع\w*|بنك|بنوك) .{0,10}(?:اسئله|اسئلة|{V}|{G}|{R})?'
  'q سامبل إيسي'            = '(?:سامبل\w*|samples?|مثال|امثله|نموذج) .{0,12}(?:{E}|{W})'
  'q مواضيع الرايتنق'       = '(?:مواضيع|توبك\w*|topics?) .{0,10}(?:{W}|تاسك|task|{E})|(?:وش|ايش) (?:جا|جاء|جاكم|جاب|جابو\w*) .{0,12}(?:{W}|تاسك|task)'
  'q وين أتدرب'             = '(?:من وين|وين|منين) (?:اتدرب|احل|نحل|القى|الاقي|احصل)|{V} (?:list|لست|ليست|مترجم\w*|مع الترجمه)'
 }
 lessons = [ordered]@{
  'q وش داخل معنا'          = '(?:وش|ايش) (?:داخل|يدخل|معنا|المطلوب|المقرر|علينا|المحذوف) .{0,12}(?:{MID}|{FIN}|{EX})?|(?:{MID}|{FIN}) (?:من وين|لين وين|الى وين|وش فيه)'
  's أنواع الإيسي'          = 'compare and contrast|cause and effect|argumentative|(?:انواع|مواضيع) (?:ال)?(?:{E}|{W})'
  's قوائم المحتوى'         = '\bg ?[1-8]\b|grammar [1-8]|(?:text|تكست) ?[1-8]\b|awl ?[1-6] ?[-–] ?[1-6]|sublists?'
 }
}

$norm = { param($s) (($s.ToLower() -replace '[ً-ْـ]', '') -replace '[أإآ]', 'ا' -replace 'ة', 'ه' -replace 'ى', 'ي') }
$botRx = [regex]'^ردود ج'
foreach ($m in $all) { $m.bot = $botRx.IsMatch($m.name) }
foreach ($m in $all) { if (-not $m.bot -and $m.reply -and $by.ContainsKey($m.reply)) { $by[$m.reply].nrep++ } }
$texts = New-Object 'string[]' $all.Count
for ($i = 0; $i -lt $all.Count; $i++) { $texts[$i] = & $norm $all[$i].text }

$json = [ordered]@{ macros = $MAC; tabs = [ordered]@{} }
"{0,-8} {1,-26} {2,7} {3,7} {4,7}" -f 'tab', 'query', 'msgs', 'threads', 'replies'
foreach ($tab in $V.Keys) {
    $json.tabs[$tab] = [ordered]@{}; $union = New-Object 'System.Collections.Generic.HashSet[int]'
    foreach ($q in $V[$tab].Keys) {
        $pat = X $V[$tab][$q]; $rx = New-Object regex ($pat, 'IgnoreCase,Compiled')
        $json.tabs[$tab][$q] = $V[$tab][$q]
        $n = 0; $th = 0; $rep = 0
        for ($i = 0; $i -lt $all.Count; $i++) {
            $m = $all[$i]; if ($m.bot -or -not $texts[$i]) { continue }
            if ($rx.IsMatch($texts[$i])) { $n++; [void]$union.Add($m.id); if ($m.nrep) { $th++; $rep += $m.nrep } }
        }
        "{0,-8} {1,-26} {2,7} {3,7} {4,7}" -f $tab, $q, $n, $th, $rep
    }
    "{0,-8} {1,-26} {2,7}" -f $tab, '= union', $union.Count
}
if ($OutJson) { [IO.File]::WriteAllText($OutJson, ($json | ConvertTo-Json -Depth 5), (New-Object Text.UTF8Encoding $false)) }

"--- what students type to trigger the bot (the group's own index), top 45"
$trig = @{}
foreach ($m in $all) { if ($m.bot -and $m.reply -and $by.ContainsKey($m.reply)) { $t = (& $norm $by[$m.reply].text).Trim(); if ($t -and $t.Length -le 28) { $trig[$t] = 1 + [int]$trig[$t] } } }
($trig.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 45 | ForEach-Object { "$($_.Key)($($_.Value))" }) -join ' · '
