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
$DROP = @(141656, 40979, 374978, 145050)   # ‎40979‎: تقييمٌ لا يسمّي الدكتور (اسمُه في الرسالة المردود عليها وحدَها) · ‎141656‎: رابطُ حاسبةٍ يحمل درجاتِ صاحبه
$GRADE = @{
  14292  = @(@('Writing 1', 15), @('Writing 2', 15), @('Writing 3', 15), @('Med', 15), @('Final', 15), @('Final writing', 15), @('Reading portfolio', 5), @('Writing portfolio', 5))
  18020  = @(@('compare and contrast', 15), @('cause and effect', 15), @('argumentative', 15), @('argumentative with a counter argument ( final exam)', 15), @('Final OMR', 15), @('Mid OMR', 15), @('Writing/reading portfolios', 10))
  117134 = @(@('رايت تست', 15), @('رايت تست', 15), @('المد', 25), @('الفاينل: الرايت', 25), @('الفاينل: القرامر و الريد و الفوكاب', 20))
  393721 = @(@('رايتنق ون', 15), @('رايتنق تو', 15), @('ميد', 25), @('فاينل', 45))
}
$GRADE_NOTE = @{ 14292 = '^D 60%' }   # سلّمُ التقديرات الذي أتبعه بالتوزيع
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
Map 'tg-dr-adil' 145115
Map 'tg-dr-taiseer' 215912
Map 'stk-dr-en96633' 359214

# ===== الملفّات =====
# ما فُتح وفُحص فلم يكن فيه رقمُ طالبٍ ولا درجةُ أحد. وما دون ‎64KB‎ يسكن المتن، وما فوقه جدولَ ‎media‎ بمفتاحه ‎sha256‎
$FILES_OK = @(21909, 30011, 58951, 58952, 77676, 124398, 161648, 185580, 277949, 312553, 337953)
$MEDIA_URL = 'https://cyuufavrbqyqywhftbjw.supabase.co/functions/v1/api/media/'
$INLINE_MAX = 64 * 1024
$MIME = @{ '.pdf' = 'application/pdf'; '.doc' = 'application/msword'; '.rtf' = 'application/rtf'; '.jpg' = 'image/jpeg'; '.png' = 'image/png'
           '.docx' = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
           '.pptx' = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
           '.xlsx' = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
$filesDir = '\\?\' + (Join-Path $here 'files')
$sha = [Security.Cryptography.SHA256]::Create(); $media = [ordered]@{}

# ===== الكتّاب والرسائل =====
$raw = [IO.File]::ReadAllText((Join-Path $in 'authors.tsv'), [Text.Encoding]::UTF8) -replace "`r", ''
$parts = $raw -split "#USERS`n"
$meta = @{}; foreach ($l in ($parts[0] -split "`n")) { $c = $l -split "`t"; if ($c.Count -ge 4 -and $c[0] -match '^\d+$') { $meta[[int]$c[0]] = @{ from = $c[1]; ts = [long]$c[2] * 1000; fwd = $c[3] -eq '1'; media = $(if ($c.Count -gt 4) { $c[4] } else { '' }) } } }
$U = @{}; foreach ($l in ($parts[1] -split "`n")) { $c = $l -split "`t"; if ($c.Count -ge 4) { $U[$c[0]] = @{ user = $c[1]; del = $c[2] -eq '1'; photo = $c[3] -eq '1'; name = $(if ($c.Count -gt 4) { $c[4] } else { '' }) } } }
$sel = [IO.File]::ReadAllLines((Join-Path $in 'selected.jsonl'), [Text.Encoding]::UTF8) | Where-Object { $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json }

$pass = [IO.File]::ReadAllLines((Join-Path $in 'pass2.jsonl'), [Text.Encoding]::UTF8) | Where-Object { $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json }
$selSec = @{}; foreach ($o in $sel) { $selSec[[int]$o.id] = $o.sec }
# ‏ما اختير ولم يمرّ بالمرور الثاني (مؤجَّلٌ لملفّه، أو صفٌّ ثانٍ دُمج) يدخل بتبويبه الأوّل قطعةً واحدة — فتجري عليه القواعدُ نفسُها
$inPass = @{}; foreach ($o in $pass) { $inPass[[int]$o.id] = 1 }
$pass = @($pass) + @($sel | Where-Object { -not $inPass[[int]$_.id] } | ForEach-Object {
    [pscustomobject]@{ id = [int]$_.id; verdict = 'keep'; segs = @([pscustomobject]@{ sec = $_.sec; from = 1; to = ($by[[int]$_.id].text -split "`n").Count; doctor = $_.doctor }) } })

# ===== من الرسالة إلى قِطَع =====
# ‏‎pass2.jsonl‎ (المرورُ الثاني) يقول لكلّ رسالة: تبقى · تحتاج سؤالَها · تُحذف، ويقسّم **أسطرَها** على التبويبات.
# القصُّ هنا من نصّ التصدير بأرقام الأسطر، فكلُّ قطعةٍ بلفظ كاتبها. ومن احتاجت سؤالَها سبقها سطرُ اقتباس
# بين علامتَي ‎U+2063‎ (غيرُ مرئيّتين) تعرضه الواجهةُ اقتباسًا (‎impQ‎) — وبدونها يُقرأ سطرًا أوّلُه «↩».
$QM = [string][char]0x2063   # (لا ‎$Q‎: أسماءُ المتغيّرات لا تفرّق الحالة، و‎$q‎ اقتباسُ الرسالة في الحلقة)
function Quote($t) { $s = ($t -replace '\s+', ' ').Trim(); if ($s.Length -gt 280) { $s = $s.Substring(0, 280).Trim() + '…' }; $QM + "↩ " + $s + $QM }
$pending = New-Object 'System.Collections.Generic.List[string]'
$skip = [ordered]@{ deleted = 0; anon = 0; fwd = 0; drop = 0; triage = 0 }
$pieces = New-Object 'System.Collections.Generic.List[object]'
foreach ($o in ($pass | Sort-Object { [int]$_.id })) {
    $id = [int]$o.id; $m = $by[$id]; $x = $meta[$id]
    if (-not $x) { throw "no author data for $id" }
    if ($DROP -contains $id) { $skip.drop++; continue }
    if ($x.from -eq 'anon') { $skip.anon++; continue }
    if ($U[$x.from].del) { $skip.deleted++; continue }
    if ($x.fwd -or $m.fwd) { $skip.fwd++; continue }
    # رسالةٌ ملفُّها مُجاز لا تُحذف لقِصَر تعليقها: التعليقُ عنوانُ الملفّ، والوكيلُ لم يرَ الملفّ
    if ($o.verdict -eq 'drop' -and $FILES_OK -contains $id) {
        $o = [pscustomobject]@{ id = $id; verdict = 'keep'; segs = @([pscustomobject]@{ sec = $selSec[$id]; from = 1; to = ($m.text -split "`n").Count }) }
    }
    if ($o.verdict -eq 'drop') { $skip.triage++; continue }
    $file = $null; $osec = $selSec[$id]
    if ($x.media -in 'messageMediaDocument', 'messageMediaPhoto' -or $m.media) {
        # الملفُّ يُنقل في المصادر وحدها، وبعد أن يُفتح ويُفحص (‎$FILES_OK‎) — وهو في ‎_import\files\telegram-<id>-<اسمه>‎
        $hit = @(Get-ChildItem -LiteralPath $filesDir -Filter "telegram-$id-*")
        if ($FILES_OK -contains $id -and $hit.Count -eq 1) { $file = $hit[0] }
        else { $pending.Add("$id`t$osec`tmedia`t$($m.media) $($m.mtitle)"); continue }
    }
    $hidden = @($m.links | Where-Object { $m.text.IndexOf($_.TrimEnd('/')) -lt 0 })
    if ($hidden.Count) { $pending.Add("$id`t$osec`thidden-link`t$(([uri]$hidden[0]).Host)"); continue }
    $q = ''
    if ($o.verdict -eq 'needs_parent') {
        $pt = $(if ($m.reply -and $by.ContainsKey($m.reply)) { $by[$m.reply].text } else { '' })
        if (-not $pt.Trim()) { $pending.Add("$id`t$osec`tno-parent-text`t"); continue }
        $q = Quote $pt
    }
    $ls = $m.text -split "`n"
    $segs = @($o.segs)
    if (-not $m.text.Trim()) {
        if (-not $file -or $osec -notlike 'src*') { $pending.Add("$id`t$osec`tempty`t"); continue }
        $pieces.Add([pscustomobject]@{ id = $id; sec = $osec; from = $x.from; ts = $x.ts; text = ''; q = ''; file = $file; items = $null })
        continue
    }
    $fileUsed = $false
    foreach ($s in $segs) {
        $t = ($ls[([int]$s.from - 1)..([int]$s.to - 1)] -join "`n").Trim("`n", ' ')
        if (-not $t.Trim()) { continue }
        $sec = $s.sec
        if ($sec -eq 'lessons' -and $q) { $sec = 'info' }   # قائمةُ المواضيع بنودٌ لا نصّ: لا موضعَ فيها لسؤال، فتُقرأ في «المادة» مع سؤالها
        $f = $null; if ($file -and -not $fileUsed -and $sec -like 'src*') { $f = $file; $fileUsed = $true }
        $pieces.Add([pscustomobject]@{ id = $id; sec = $sec; from = $x.from; ts = $x.ts; text = $t; q = $q; file = $f; items = $s.items })
    }
    if ($file -and -not $fileUsed) { $pending.Add("$id`t$osec`tfile-without-source-text`t$($m.mtitle)") }
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
function Imp($rs) {
    $r = $rs[0]; $i = [ordered]@{ src = 'telegram'; url = "https://t.me/$Group/$($r.id)"; user = $U[$r.from].user; ts = $r.ts; mid = $r.id }
    $ids = @($rs | ForEach-Object { $_.id } | Select-Object -Unique); if ($ids.Count -gt 1) { $i.mids = $ids }
    $i
}
function Esc($s) { $s.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;') }
function Body($r) { $(if ($r.q) { $r.q + "`n" } else { '' }) + $r.text }
# معرّفُ المساهمة ثابتٌ بكاتبها وتبويبها (‎UNIQUE(uid, code, sec)‎) لا برسالتها الأولى: إعادةُ الفرز لا تبدّله
function Pid($uid, $sec) { "tg-$sec-$($uid.Substring(3))-$lc" }

$posts = New-Object 'System.Collections.Generic.List[object]'
foreach ($g in ($pieces | Group-Object from, sec)) {
    $rs = @($g.Group | Sort-Object id); $sec = $rs[0].sec; $uid = Author $rs[0].from; $imp = Imp $rs; $data = $null
    switch -Wildcard ($sec) {
        'info' { $data = [ordered]@{ desc = (($rs | ForEach-Object { Body $_ }) -join "`n`n"); type = ''; rel = 0; lang = ''; book = ''; imp = $imp } }
        'src*' {
            $fobj = [ordered]@{}; $parts = New-Object 'System.Collections.Generic.List[string]'
            foreach ($r in $rs) {
                $h = @(); if ((Body $r).Trim()) { $h += ((Esc (Body $r)) -split "`n") -join '<br>' }
                if ($r.file) {
                    $fid = "tg-f$($r.id)-0"; $raw = [IO.File]::ReadAllBytes($r.file.FullName)
                    $mt = $MIME[$r.file.Extension.ToLower()]; if (-not $mt) { $mt = 'application/octet-stream' }
                    if ($raw.Length -le $INLINE_MAX) { $v = "data:$mt;base64," + [Convert]::ToBase64String($raw) }
                    else { $k = -join ($sha.ComputeHash($raw) | ForEach-Object { $_.ToString('x2') }); $media[$k] = @{ mime = $mt; raw = $raw }; $v = $MEDIA_URL + $k }
                    $fobj[$fid] = [ordered]@{ name = ($r.file.Name -replace '^telegram-\d+-', ''); v = $v }
                    $h += [char]0x200b + "<span data-fid=`"$fid`" class=`"src-fchip`" contenteditable=`"false`"></span>" + [char]0x200b
                }
                $parts.Add($h -join '<br><br>')
            }
            $data = [ordered]@{ html = ($parts -join '<br><br>'); files = $fobj; imp = $imp }
        }
        'lessons' {
            $names = @($rs | ForEach-Object { $_.text -split "`n" } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
            $data = [ordered]@{ items = @($names | ForEach-Object { [ordered]@{ num = ''; name = $_ } }); imp = $imp }
        }
        'grade' {
            # الجدول: ما كُتب هنا بالعين (‎$GRADE‎) أوّلًا، ثمّ جدولُ المرور الثاني إن بلغ ‎100‎ تمامًا — والناقصُ يبقى كلامًا في الملاحظة.
            # والملاحظة: كلامُه عن الدرجات كما كتبه؛ ومن كُتب جدولُه بالعين فملاحظتُه ما بعد النسب فقط (‎$GRADE_NOTE‎)
            $items = $null; $notes = @()
            foreach ($r in $rs) {
                if ($GRADE.ContainsKey($r.id)) {
                    if (-not $items) { $items = @($GRADE[$r.id] | ForEach-Object { [ordered]@{ name = $_[0]; pct = $_[1] } }) }
                    if ($GRADE_NOTE.ContainsKey($r.id)) {
                        $ls = $r.text -split "`n"; $k = 0; while ($k -lt $ls.Count -and $ls[$k] -notmatch $GRADE_NOTE[$r.id]) { $k++ }
                        if ($k -ge $ls.Count) { throw "grade note pattern not found in $($r.id)" }
                        $notes += ($ls[$k..($ls.Count - 1)] -join "`n").Trim()
                    }
                    continue
                }
                if (-not $items -and $r.items -and (($r.items | ForEach-Object { [double]$_[1] } | Measure-Object -Sum).Sum -eq 100)) {
                    $items = @($r.items | ForEach-Object { [ordered]@{ name = [string]$_[0]; pct = [int]$_[1] } })
                }
                $notes += Body $r
            }
            $data = [ordered]@{ method = 'avg'; items = $(if ($items) { $items } else { @() }); note = ($notes -join "`n`n"); imp = $imp }
        }
        'doc' {
            $rows = New-Object 'System.Collections.Generic.List[object]'
            foreach ($r in $rs) {
                if (-not $DOCOF.ContainsKey($r.id)) { throw "doc $($r.id) has no doctor: add it with Map" }
                $dr = $DOCOF[$r.id]; $have = $rows | Where-Object { $_.id -eq $dr }
                if ($have) { $have.d = $have.d + "`n`n" + (Body $r); continue }
                $rows.Add([ordered]@{ id = $dr; n = $DOCTORS[$dr]; en = ''; img = ''; e = ''; bld = ''; room = ''; d = (Body $r); hours = @(); teach = 0; grade = 0
                    pid = "tg-p$($r.id)-$lc"; imp = (Imp @($r)) })
            }
            $data = [ordered]@{ docs = $rows.ToArray() }
        }
    }
    $posts.Add([ordered]@{ id = (Pid $uid $sec); uid = $uid; code = $Code; sec = $sec; ts = $rs[0].ts; st = 'pub'; data = $data })
}
$seen = @{}
foreach ($p in $posts) { if ($seen[$p.id]) { throw "duplicate post id $($p.id)" }; $seen[$p.id] = 1 }

# ===== الكتابة =====
$enc = New-Object Text.UTF8Encoding $false
$doc = [ordered]@{ code = $Code; users = @($users.Values); posts = $posts.ToArray() }
[IO.File]::WriteAllText((Join-Path $out "$slug-tg.json"), ($doc | ConvertTo-Json -Depth 12), $enc)
function Q($s) { "'" + ([string]$s).Replace("'", "''") + "'" }
$now = [int][double]::Parse((Get-Date -UFormat %s))
$L = New-Object 'System.Collections.Generic.List[string]'
$L.Add("-- نقلٌ من قروب تيليقرام ($Group) ⇐ أكاديميا · $Code · ولَّده _import/telegram.ps1")
$L.Add('-- يُعاد تشغيلُه بلا ضرر: ON CONFLICT يحدّث ولا يكرّر، وما خرج من النقل يُمحى.'); $L.Add('BEGIN;')
foreach ($u in $users.Values) {
    $L.Add("INSERT INTO users (id, email, name, img, pw_hash, pw_salt, pw_iter, verified, created, seen) VALUES ($(Q $u.id), $(Q $u.email), $(Q $u.name), $(Q $u.img), '', '', 0, 0, $now, $now) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, img = EXCLUDED.img;")
}
# ‏ما خرج من النقل يُمحى **قبل** الإدراج وفي المعاملة نفسها: ‎UNIQUE(uid, code, sec)‎ يردّ مساهمةَ الكاتب الجديدة في تبويبٍ
# ما دامت القديمةُ فيه بمعرّفٍ آخر. ثمّ يُمحى من كتّاب هذا المصدر من لم تبقَ له مساهمة
$L.Add("DELETE FROM posts WHERE code = $(Q $Code) AND id LIKE 'tg-%' AND id NOT IN ($((($posts | ForEach-Object { Q $_.id }) -join ', ')));")
foreach ($p in $posts) {
    $L.Add("INSERT INTO posts (id, uid, code, sec, data, ts, updated, st) VALUES ($(Q $p.id), $(Q $p.uid), $(Q $p.code), $(Q $p.sec), $(Q (($p.data | ConvertTo-Json -Depth 10 -Compress).Replace($QM, '\u2063'))), $($p.ts), $now, 'pub') ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, ts = EXCLUDED.ts, updated = EXCLUDED.updated;")
}
$L.Add("DELETE FROM users WHERE id LIKE 'tg-%' AND id NOT IN (SELECT uid FROM posts);")
$L.Add('COMMIT;')
[IO.File]::WriteAllText((Join-Path $out "$slug-tg.sql"), (($L -join "`n") + "`n"), $enc)
[IO.File]::WriteAllLines((Join-Path $in 'pending.tsv'), $pending, $enc)
# ‏والوسائطُ في ملفّاتٍ وحدَها. محرّرُ ‎SQL‎ في لوحة ‎Supabase‎ يردّ ما فوق ‎1MB‎ تقريبًا: فالملفُّ قطعٌ من ‎540KB‎ —
# الأولى تُنشئ الصفّ، وكلُّ تاليةٍ تُلحق بشرط أن يكون طولُ الموجود هو موضعَها بالضبط، فإعادةُ تشغيل قطعةٍ لا تكرّرها
Get-ChildItem $out -Filter "$slug-tg-media-*.sql" | Remove-Item
$i = 0
foreach ($k in $media.Keys) {
    $i++; $x = $media[$k]; $step = 540000; $p = 0
    for ($off = 0; $off -lt $x.raw.Length; $off += $step) {
        $p++; $n = [Math]::Min($step, $x.raw.Length - $off); $b64 = [Convert]::ToBase64String($x.raw, $off, $n)
        $s = $(if ($off -eq 0) { "INSERT INTO media (k, mime, size, bytes, uid, ts) VALUES ($(Q $k), $(Q $x.mime), $($x.raw.Length), decode($(Q $b64), 'base64'), 'u-academia', 0) ON CONFLICT (k) DO NOTHING;" }
               else { "UPDATE media SET bytes = bytes || decode($(Q $b64), 'base64') WHERE k = $(Q $k) AND octet_length(bytes) = $off;" })
        [IO.File]::WriteAllText((Join-Path $out ("$slug-tg-media-{0:d2}-{1:d2}.sql" -f $i, $p)), $s + "`n", $enc)
    }
}

"messages in pass: $($pass.Count)  pieces: $($pieces.Count) from $(($pieces | ForEach-Object { $_.id } | Select-Object -Unique).Count) messages  pending: $($pending.Count)"
"skipped: " + (($skip.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ' ')
"pending by reason: " + (($pending | ForEach-Object { ($_ -split "`t")[2] } | Group-Object | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ' ')
"with quoted question: $(($pieces | Where-Object { $_.q } | ForEach-Object { $_.id } | Select-Object -Unique).Count) messages"
"$Code`: $($users.Count) authors, $($posts.Count) posts, media files: $($media.Count)"
$posts | Group-Object { $_.sec } | Sort-Object Name | ForEach-Object { "  {0,-8} {1}" -f $_.Name, $_.Count }
"  doctor reviews: $(($posts | Where-Object { $_.sec -eq 'doc' } | ForEach-Object { $_.data.docs.Count } | Measure-Object -Sum).Sum)   grade posts with items: $(($posts | Where-Object { $_.sec -eq 'grade' -and $_.data.items.Count }).Count)"
"sql bytes: $((Get-Item (Join-Path $out "$slug-tg.sql")).Length)"
