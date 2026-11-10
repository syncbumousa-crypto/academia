# نقلٌ من قروب تيليقرام ⇐ أكاديميا (نظيرُ ‎stkfupm.py‎ لمصدرٍ ثانٍ)
#
#   powershell -ExecutionPolicy Bypass -File _import\telegram.ps1 -Export "<مجلّد تصدير Telegram Desktop (HTML)>"
#
# المدخلات (في ‎_import\tg\ENGL101‎):
#   selected.jsonl  الرسائلُ المختارة: {id, sec, doctor, term, why}
#   authors.tsv     من ‎channels.getMessages‎: قسمُ ‎#MSGS‎ (id, from, date, fwd, media) وقسمُ ‎#USERS‎ (id, username, deleted, photo, name)
# المخرجات: ‎_import\out\ENGL101-tg.json‎ و ‎.sql‎ ، و‎_import\tg\ENGL101\pending.tsv‎ (ما أُجِّل وسببُه)
#
# القواعدُ قواعدُ ‎stkfupm.py‎ نفسُها، ويزيد عليها ما يخصّ المحادثة:
#   · ‎uid = tg-<username>‎ ، ومن لا معرّفَ له ‎tg-u<رقمه>‎ ؛ البريد ‎<…>@import.telegram.invalid‎
#   · ‎data.imp = {src:'telegram', url:'https://t.me/<group>/<msgid>', user, ts}‎
#   · ‎UNIQUE(uid, code, sec)‎: رسائلُ الكاتب في القسم الواحد تُجمع في مساهمةٍ واحدةٍ بترتيبها، كلٌّ بلفظها وبينها سطرٌ فارغ
#   · يُترك: الحسابُ المحذوف، والمُعاد توجيهُه، والمُرسَل باسم القروب
#   · يُؤجَّل: ما فيه ملفٌّ أو صورة (التصديرُ لا يحملها)، وما فيه رابطٌ مخفيٌّ تحت نصّ (النصُّ وحده لا يحمل عنوانَه)
param([Parameter(Mandatory = $true)][string]$Export, [string]$Code = 'ENGL 101', [string]$Group = 'KFUPM_ENG101')
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$slug = $Code.Replace(' ', ''); $lc = $slug.ToLower()
$in = Join-Path $here "tg\$slug"; $out = Join-Path $here 'out'
Add-Type -Path (Join-Path $here 'tg\TgParse.cs')
[void][TgParse]::Parse($Export); $by = [TgParse]::ById

# ===== ما يُقرأ بالعين ويُكتب هنا (لا يُستنتج) =====
$DROP = @(141656, 40979)   # ‎40979‎: تقييمٌ لا يسمّي الدكتور (اسمُه في الرسالة المردود عليها وحدَها) · ‎141656‎: رابطُ حاسبةٍ يحمل درجاتِ صاحبه
# صُنّفت «توزيع درجات» أو «مواضيع» وليست بيانًا يُجدول (سلّمُ تقديرات، بنيةُ اختبار، بيانٌ ناقص) ⇐ «المادة» بنصّها
$TOINFO = @(16663, 50331, 53469, 54602, 76461, 78859, 117221, 131059, 181971, 190212, 230972, 232343, 232837, 233886, 240097,
            295571, 300888, 335772, 337752, 362638, 374226, 387768, 390187,
            15724, 69457, 145122, 151906, 152728, 156508, 169594, 245569)
$GRADE = @{
  14292  = @(@('Writing 1', 15), @('Writing 2', 15), @('Writing 3', 15), @('Med', 15), @('Final', 15), @('Final writing', 15), @('Reading portfolio', 5), @('Writing portfolio', 5))
  18020  = @(@('compare and contrast', 15), @('cause and effect', 15), @('argumentative', 15), @('argumentative with a counter argument ( final exam)', 15), @('Final OMR', 15), @('Mid OMR', 15), @('Writing/reading portfolios', 10))
  117134 = @(@('رايت تست', 15), @('رايت تست', 15), @('المد', 25), @('الفاينل: الرايت', 25), @('الفاينل: القرامر و الريد و الفوكاب', 20))
  393721 = @(@('رايتنق ون', 15), @('رايتنق تو', 15), @('ميد', 25), @('فاينل', 45))
}
# ‏‎lessons‎: نمطُ الأسطر التي تُؤخذ من نصّ الكاتب
$LESSONS = @{ 17955 = '^(Compare|Cause|Argumentative)'; 245706 = '^Text \d'; 378010 = '^TEXT \d'; 272771 = '^G\d'; 350074 = '^\d\.' }
$DOCTORS = [ordered]@{
  'tg-dr-gazdar' = 'Mahir Gazdar'; 'tg-dr-taiseer' = 'Taiseer'; 'tg-dr-adil' = 'Adil Mahmood'; 'tg-dr-megan' = 'Megan'
  'tg-dr-pamela' = 'Pamela'; 'tg-dr-adamkhan' = 'Adam Khan'; 'tg-dr-owen' = 'Jonathan Owen'
  'tg-dr-cameron' = 'Joseph Mark Cameron'; 'tg-dr-mclaren' = 'Peter McLaren'; 'tg-dr-hampson' = 'Timothy Hampson'
  'tg-dr-lees' = 'Steven Lees'; 'tg-dr-loftus' = 'John Loftus'; 'tg-dr-harrison' = 'Samuel Harrison'
  'tg-dr-vernon' = 'Sam Douglas Vernon'; 'tg-dr-watts' = 'Stephen Watts'; 'tg-dr-saddia' = 'Saddia'
  'tg-dr-jamesjoseph' = 'James Joseph'; 'tg-dr-cook' = 'Austin Cook'; 'tg-dr-ross' = 'Ross Martin'; 'tg-dr-tylor' = 'Tylor'
  'tg-dr-flores' = 'David Flores'; 'tg-dr-kirkwood' = 'Kristian Kirkwood'; 'tg-dr-abri' = 'العبري'; 'tg-dr-booth' = 'Dawn Booth'
  'stk-dr-en115421' = 'Mr. Keith Pearson'; 'stk-dr-en96633' = 'Mr. Lance King'   # في قائمة المادّة من نقل STKFUPM
}
$DOCOF = @{}
function Map($k, $ids) { foreach ($i in $ids) { $script:DOCOF[$i] = $k } }
Map 'tg-dr-gazdar' 5097, 53119, 55058, 56242, 115898, 215578, 215895
Map 'tg-dr-taiseer' 11948, 15852, 53165, 53181, 112532, 113192
Map 'tg-dr-adil' 15397, 53134, 144852
Map 'tg-dr-megan' 15881, 115554
Map 'tg-dr-pamela' 15888, 16340, 16487, 53157
Map 'tg-dr-adamkhan' 16454, 17347, 92741, 114001, 217347
Map 'tg-dr-owen' 40679, 114416
Map 'tg-dr-cameron' 53122, 109918, 207106, 215111
Map 'tg-dr-mclaren' 53133
Map 'tg-dr-hampson' 53164, 114090
Map 'tg-dr-lees' 84431, 207045
Map 'tg-dr-loftus' 84483, 89972, 114009, 115271
Map 'tg-dr-harrison' 112372
Map 'tg-dr-vernon' 114746
Map 'stk-dr-en115421' 143288
Map 'tg-dr-watts' 144901, 240533, 246837
Map 'tg-dr-saddia' 207091
Map 'stk-dr-en96633' 207162, 384652
Map 'tg-dr-jamesjoseph' 212303
Map 'tg-dr-cook' 214050, 215894
Map 'tg-dr-ross' 301337
Map 'tg-dr-tylor' 323626
Map 'tg-dr-flores' 324791
Map 'tg-dr-kirkwood' 364738, 395341
Map 'tg-dr-abri' 381570
Map 'tg-dr-booth' 384644

# ===== الكتّاب والرسائل =====
$raw = [IO.File]::ReadAllText((Join-Path $in 'authors.tsv'), [Text.Encoding]::UTF8) -replace "`r", ''
$parts = $raw -split "#USERS`n"
$meta = @{}; foreach ($l in ($parts[0] -split "`n")) { $c = $l -split "`t"; if ($c.Count -ge 4 -and $c[0] -match '^\d+$') { $meta[[int]$c[0]] = @{ from = $c[1]; ts = [long]$c[2] * 1000; fwd = $c[3] -eq '1'; media = $(if ($c.Count -gt 4) { $c[4] } else { '' }) } } }
$U = @{}; foreach ($l in ($parts[1] -split "`n")) { $c = $l -split "`t"; if ($c.Count -ge 4) { $U[$c[0]] = @{ user = $c[1]; del = $c[2] -eq '1'; photo = $c[3] -eq '1'; name = $(if ($c.Count -gt 4) { $c[4] } else { '' }) } } }
$sel = [IO.File]::ReadAllLines((Join-Path $in 'selected.jsonl'), [Text.Encoding]::UTF8) | Where-Object { $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json }

$pending = New-Object 'System.Collections.Generic.List[string]'
$skip = @{ deleted = 0; anon = 0; fwd = 0; drop = 0 }
$keep = @()
foreach ($o in ($sel | Sort-Object { [int]$_.id })) {
    $id = [int]$o.id; $m = $by[$id]; $x = $meta[$id]
    if (-not $x) { throw "no author data for $id" }
    if ($DROP -contains $id) { $skip.drop++; continue }
    if ($x.from -eq 'anon') { $skip.anon++; continue }
    if ($U[$x.from].del) { $skip.deleted++; continue }
    if ($x.fwd -or $m.fwd) { $skip.fwd++; continue }
    $sec = $(if ($TOINFO -contains $id) { 'info' } else { $o.sec })
    if ($x.media -in 'messageMediaDocument', 'messageMediaPhoto' -or $m.media) { $pending.Add("$id`t$sec`tmedia`t$($m.media) $($m.mtitle)"); continue }
    $hidden = @($m.links | Where-Object { $m.text.IndexOf($_.TrimEnd('/')) -lt 0 })
    if ($hidden.Count) { $pending.Add("$id`t$sec`thidden-link`t$(([uri]$hidden[0]).Host)"); continue }
    if (-not $m.text.Trim()) { $pending.Add("$id`t$sec`tempty`t"); continue }
    $keep += [pscustomobject]@{ id = $id; sec = $sec; from = $x.from; ts = $x.ts; text = $m.text }
}

$users = [ordered]@{}
function Author($k) {
    $u = $U[$k]; $un = $u.user
    $tail = $(if ($un) { $un.ToLower() } else { 'u' + $k }); $uid = 'tg-' + $tail
    if (-not $users.Contains($uid)) {
        $users[$uid] = [ordered]@{ id = $uid; name = $(if ($u.name) { $u.name } elseif ($un) { $un } else { 'Telegram' })
            img = $(if ($un -and $u.photo) { "https://t.me/i/userpic/320/$un.jpg" } else { '' })
            email = "$tail@import.telegram.invalid"; user = $un }
    }
    $uid
}
function Imp($r) { [ordered]@{ src = 'telegram'; url = "https://t.me/$Group/$($r.id)"; user = $U[$r.from].user; ts = $r.ts; mid = $r.id } }
function Esc($s) { $s.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;') }

$posts = New-Object 'System.Collections.Generic.List[object]'
# ---- «المادة» والمصادر: مساهمةٌ لكلّ كاتبٍ في القسم، ورسائلُه فيها بترتيبها
foreach ($sec in 'info', 'srcU', 'srcP') {
    foreach ($g in ($keep | Where-Object { $_.sec -eq $sec } | Group-Object from)) {
        $rs = @($g.Group | Sort-Object id); $uid = Author $g.Name; $imp = Imp $rs[0]
        if ($rs.Count -gt 1) { $imp.mids = @($rs | ForEach-Object { $_.id }) }
        $text = ($rs | ForEach-Object { $_.text }) -join "`n`n"
        $data = $(if ($sec -eq 'info') { [ordered]@{ desc = $text; type = ''; rel = 0; lang = ''; book = ''; imp = $imp } }
                  else { [ordered]@{ html = ((Esc $text) -split "`n") -join '<br>'; files = @{}; imp = $imp } })
        $posts.Add([ordered]@{ id = "tg-p$($rs[0].id)-$lc"; uid = $uid; code = $Code; sec = $sec; ts = $rs[0].ts; st = 'pub'; data = $data })
    }
}
# ---- «توزيع الدرجات» و«المواضيع»: بيانُ الكاتب بألفاظه
foreach ($r in ($keep | Where-Object { $_.sec -in 'grade', 'lessons' })) {
    $uid = Author $r.from; $imp = Imp $r
    if ($r.sec -eq 'grade') {
        if (-not $GRADE.ContainsKey($r.id)) { throw "grade $($r.id) has no spec: add it to `$GRADE or `$TOINFO" }
        $data = [ordered]@{ method = 'avg'; items = @($GRADE[$r.id] | ForEach-Object { [ordered]@{ name = $_[0]; pct = $_[1] } }); imp = $imp }
    } else {
        if (-not $LESSONS.ContainsKey($r.id)) { throw "lessons $($r.id) has no spec: add it to `$LESSONS or `$TOINFO" }
        $names = New-Object 'System.Collections.Generic.List[string]'
        foreach ($l in ($r.text -split "`n")) {
            if ($l -match $LESSONS[$r.id]) { $names.Add($l.Trim()) }
            elseif ($r.id -eq 350074 -and $l.Trim() -and $names.Count) { $names[$names.Count - 1] = $names[$names.Count - 1] + ' ' + $l.Trim() }   # سطرٌ انكسر في المصدر
        }
        $data = [ordered]@{ items = @($names | ForEach-Object { [ordered]@{ num = ''; name = $_ } }); imp = $imp }
    }
    $posts.Add([ordered]@{ id = "tg-$($r.sec)-p$($r.id)-$lc"; uid = $uid; code = $Code; sec = $r.sec; ts = $r.ts; st = 'pub'; data = $data })
}
# ---- «الدكاترة»: مساهمةٌ واحدةٌ لكلّ كاتب، وصفٌّ لكلّ دكتورٍ قيّمه (وتقييماه للدكتور نفسه يجتمعان في صفّه)
foreach ($g in ($keep | Where-Object { $_.sec -eq 'doc' } | Group-Object from)) {
    $uid = Author $g.Name; $rows = New-Object 'System.Collections.Generic.List[object]'
    foreach ($r in ($g.Group | Sort-Object id)) {
        if (-not $DOCOF.ContainsKey($r.id)) { throw "doc $($r.id) has no doctor: add it with Map" }
        $dr = $DOCOF[$r.id]; $have = $rows | Where-Object { $_.id -eq $dr }
        if ($have) { $have.d = $have.d + "`n`n" + $r.text; continue }
        $rows.Add([ordered]@{ id = $dr; n = $DOCTORS[$dr]; en = ''; img = ''; e = ''; bld = ''; room = ''; d = $r.text; hours = @(); teach = 0; grade = 0
            pid = "tg-p$($r.id)-$lc"; imp = (Imp $r) })
    }
    $posts.Add([ordered]@{ id = "tg-doc-$($uid.Substring(3))-$lc"; uid = $uid; code = $Code; sec = 'doc'; ts = $rows[0].imp.ts; st = 'pub'; data = [ordered]@{ docs = $rows.ToArray() } })
}
$seen = @{}
foreach ($p in $posts) { $k = "$($p.uid)|$($p.sec)"; if ($seen[$k]) { throw "$($p.uid) has two posts in $($p.sec): $($seen[$k]) and $($p.id)" }; $seen[$k] = $p.id }

# ===== الكتابة =====
$enc = New-Object Text.UTF8Encoding $false
$doc = [ordered]@{ code = $Code; users = @($users.Values); posts = $posts.ToArray() }
[IO.File]::WriteAllText((Join-Path $out "$slug-tg.json"), ($doc | ConvertTo-Json -Depth 12), $enc)
function Q($s) { "'" + ([string]$s).Replace("'", "''") + "'" }
$now = [int][double]::Parse((Get-Date -UFormat %s))
$L = New-Object 'System.Collections.Generic.List[string]'
$L.Add("-- نقلٌ من قروب تيليقرام ($Group) ⇐ أكاديميا · $Code · ولَّده _import/telegram.ps1")
$L.Add('-- يُعاد تشغيلُه بلا ضرر: ON CONFLICT يحدّث ولا يكرّر.'); $L.Add('BEGIN;')
foreach ($u in $users.Values) {
    $L.Add("INSERT INTO users (id, email, name, img, pw_hash, pw_salt, pw_iter, verified, created, seen) VALUES ($(Q $u.id), $(Q $u.email), $(Q $u.name), $(Q $u.img), '', '', 0, 0, $now, $now) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, img = EXCLUDED.img;")
}
foreach ($p in $posts) {
    $L.Add("INSERT INTO posts (id, uid, code, sec, data, ts, updated, st) VALUES ($(Q $p.id), $(Q $p.uid), $(Q $p.code), $(Q $p.sec), $(Q ($p.data | ConvertTo-Json -Depth 10 -Compress)), $($p.ts), $now, 'pub') ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, ts = EXCLUDED.ts, updated = EXCLUDED.updated;")
}
$L.Add('COMMIT;')
[IO.File]::WriteAllText((Join-Path $out "$slug-tg.sql"), (($L -join "`n") + "`n"), $enc)
[IO.File]::WriteAllLines((Join-Path $in 'pending.tsv'), $pending, $enc)

"selected: $($sel.Count)  kept: $($keep.Count)  pending: $($pending.Count)  skipped: deleted=$($skip.deleted) anon=$($skip.anon) fwd=$($skip.fwd) drop=$($skip.drop)"
"pending by reason: " + (($pending | ForEach-Object { ($_ -split "`t")[2] } | Group-Object | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ' ')
"$Code`: $($users.Count) authors, $($posts.Count) posts ($(($posts | Where-Object { $_.sec -eq 'doc' } | ForEach-Object { $_.data.docs.Count } | Measure-Object -Sum).Sum) doctor reviews)"
$posts | Group-Object { $_.sec } | Sort-Object Name | ForEach-Object { "  {0,-8} {1}" -f $_.Name, $_.Count }
"sql bytes: $((Get-Item (Join-Path $out "$slug-tg.sql")).Length)"
