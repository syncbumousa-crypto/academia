# Tightens the thread pass (pass3.jsonl) by rule, no new reading: writes pass3b.jsonl and review3b.md
param([string]$Export, [string]$Dir)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -Path (Join-Path $here 'TgParse.cs')
[void][TgParse]::Parse($Export); $by = [TgParse]::ById
$norm = { param($s) (($s.ToLower() -replace '[ً-ْـ]', '') -replace '[أإآ]', 'ا' -replace 'ة', 'ه' -replace 'ى', 'ي') }
$rows = [IO.File]::ReadAllLines((Join-Path $Dir 'pass3.jsonl'), [Text.Encoding]::UTF8) | ForEach-Object { $_ | ConvertFrom-Json }
$ans = @($rows | Where-Object { $_.PSObject.Properties.Name -contains 'q' }); $sts = @($rows | Where-Object { $_.PSObject.Properties.Name -contains 'verdict' -and $_.verdict -ne 'drop' })

$urlRx = [regex]'https?://\S+|t\.me/\S+|www\.\S+'
$timeRx = [regex]'هاليومين|اليوم|بكره|بكرا|امس|هالاسبوع|الاسبوع الجاي|الاسبوع هذا|الاسبوع الماضي|هالترم|نزلت|نزلو|نزل |ينزل|بينزل|تنزل|متى|موعد|مواعيد|ديدلاين|deadline|الحين|توه|توها|لسا |لسه |اجازه مرضيه|عذر طبي|ميكب|make ?up|القاعه|قاعه|مبنى|بلدنق|سكشن \d|تبديل|ابدل|يبدل|تاجل|تاجيل|اتاجل|الغي|انلغى|كنسل'
$refRx = [regex]'^(?:شوف|شوفي|اكتب|اكتبي|ارجع|ارجعي|فوق|تحت|المثبت|بالمثبت|الردود|ردود|resources|في القروب|بالقروب|في الملفات|بالملفات|ملفات الديبارتمن?ت|اسال|اسالي|كلم|كلمي|راسل|راسلي)\b'
$gradeTok = [regex]'[0-9٠-٩]|%|٪|درج|a\+|ايه بلس|standard|average|افرج|ستاندر|كيرف|curve|سوال|قطع|دقيق|كلم|نقط|بوينت|point'
$docTok = [regex]'ممتاز|رهيب|كويس|زين|سيء|سيئ|شين|شديد|كريم|ينصح|انصح|لا تاخذ|خذه|خذها|حلو|يشرح|شرح|تصحيح|يصحح|ظالم|متساهل|يعطي|فيدباك|يفهم|اسلوب|محترم|لطيف|يحضر|تحضير'
$why = @{}; function Drop($k) { $script:why[$k] = 1 + [int]$script:why[$k] }
$keepA = New-Object 'System.Collections.Generic.List[object]'
foreach ($a in $ans) {
    $m = $by[[int]$a.id]; $q = $by[[int]$a.q]; $t = & $norm $m.text; $qt = & $norm $q.text
    if ($m.name -eq 'Deleted Account') { Drop 'deleted account'; continue }
    if ($timeRx.IsMatch($qt)) { Drop 'time-bound question'; continue }
    if ($timeRx.IsMatch($t)) { Drop 'time-bound answer'; continue }
    $noUrl = $urlRx.Replace($t, '').Trim()
    if ($t -match 't\.me/') { Drop 'internal link'; continue }
    if ($urlRx.IsMatch($t) -and $a.sec -notlike 'src*') { Drop 'link outside sources'; continue }
    if (-not $urlRx.IsMatch($t)) {
        if ($refRx.IsMatch($noUrl) -and $noUrl.Length -lt 60) { Drop 'referral only'; continue }
        if ($noUrl.Length -lt 40) {
            if ($a.sec -eq 'grade' -and $gradeTok.IsMatch($noUrl)) { }
            elseif ($a.sec -eq 'doc' -and $docTok.IsMatch($noUrl)) { }
            else { Drop 'short without substance'; continue }
        }
    }
    $keepA.Add($a)
}
# a question stays with 2+ answers, or one answer of 80+ chars
$final = New-Object 'System.Collections.Generic.List[object]'
foreach ($g in ($keepA | Group-Object q)) {
    if ($g.Count -ge 2 -or $by[[int]$g.Group[0].id].text.Length -ge 80) { foreach ($x in $g.Group) { $final.Add($x) } } else { Drop 'single short answer' }
}
$keepS = @($sts | Where-Object { $nt = & $norm $by[[int]$_.id].text; $by[[int]$_.id].name -ne 'Deleted Account' -and -not $timeRx.IsMatch($nt.Substring(0, [Math]::Min(80, $nt.Length))) })
"answers: $($ans.Count) -> $($final.Count)   questions: $(@($ans | Group-Object q).Count) -> $(@($final | Group-Object q).Count)   statements: $($sts.Count) -> $($keepS.Count)"
"dropped by rule: " + (($why.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ' · ')
$secs = 'info', 'doc', 'grade', 'lessons', 'srcU', 'srcP'
foreach ($s in $secs) { "  {0,-8} answers {1,4}  questions {2,4}  statement segs {3,4}" -f $s, @($final | Where-Object { $_.sec -eq $s }).Count, @($final | Where-Object { $_.sec -eq $s } | Group-Object q).Count, @($keepS | ForEach-Object { $_.segs } | Where-Object { $_.sec -eq $s }).Count }
$ids = @($final | ForEach-Object { [int]$_.id }) + @($keepS | ForEach-Object { [int]$_.id })
$len = $ids | ForEach-Object { $by[$_].text.Length }
"messages: $($ids.Count)  authors (display names): $(@($ids | ForEach-Object { $by[$_].name } | Select-Object -Unique).Count)  <40 chars: $(@($len | Where-Object { $_ -lt 40 }).Count)  40-149: $(@($len | Where-Object { $_ -ge 40 -and $_ -lt 150 }).Count)  150+: $(@($len | Where-Object { $_ -ge 150 }).Count)"
$enc = New-Object Text.UTF8Encoding $false
[IO.File]::WriteAllLines((Join-Path $Dir 'pass3b.jsonl'), [string[]](@($final | ForEach-Object { $_ | ConvertTo-Json -Compress }) + @($keepS | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 6 })), $enc)
$sb = New-Object Text.StringBuilder; [void]$sb.AppendLine("# ENGL 101 (Telegram) - answers by question, tightened`n")
foreach ($s in $secs) {
    $g = @($final | Where-Object { $_.sec -eq $s }); [void]$sb.AppendLine("`n## $s - $($g.Count) answers`n")
    foreach ($qq in ($g | Group-Object q | Sort-Object { [int]$_.Name })) {
        $q = $by[[int]$qq.Name]; $qt = ($q.text -replace '\s+', ' '); if ($qt.Length -gt 300) { $qt = $qt.Substring(0, 300) + ' …' }
        [void]$sb.AppendLine("**Q [$($q.id)](https://t.me/KFUPM_ENG101/$($q.id)) $($q.dt.Substring(6,4)):** $qt`n")
        foreach ($a in $qq.Group) { $m = $by[[int]$a.id]; [void]$sb.AppendLine("- **$($m.name)** ($($a.id)): " + ($m.text -replace "`n", ' ⏎ ')) }
        [void]$sb.AppendLine('')
    }
}
[void]$sb.AppendLine("`n## statements kept ($($keepS.Count))`n")
foreach ($o in $keepS) { $m = $by[[int]$o.id]; [void]$sb.AppendLine("### $($m.id) - $($m.name) - $($o.verdict) - " + ((($o.segs | ForEach-Object { $_.sec }) | Select-Object -Unique) -join ', ')); [void]$sb.AppendLine('```'); [void]$sb.AppendLine($m.text); [void]$sb.AppendLine('```'); [void]$sb.AppendLine('') }
[IO.File]::WriteAllText((Join-Path $Dir 'review3b.md'), $sb.ToString(), $enc)
"review3b.md bytes: $((Get-Item (Join-Path $Dir 'review3b.md')).Length)"
