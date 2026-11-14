# Merges thr_*.jsonl (thread pass): validates ids, de-duplicates answers, writes pass3.jsonl and review3.md
param([string]$Export, [string]$Dir, [string]$Imported)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -Path (Join-Path $here 'TgParse.cs')
[void][TgParse]::Parse($Export); $by = [TgParse]::ById
$secs = 'info', 'doc', 'grade', 'lessons', 'srcU', 'srcP'
$thr = @{}; [IO.File]::ReadAllLines((Join-Path $Dir 'threads.jsonl')) | ForEach-Object { $o = $_ | ConvertFrom-Json; $thr[[int]$o.q] = $o }
$stm = @{}; [IO.File]::ReadAllLines((Join-Path $Dir 'statements.jsonl')) | ForEach-Object { $o = $_ | ConvertFrom-Json; $stm[[int]$o.id] = $o }
$bad = 0; $badId = 0; $dup = 0; $cover = 0; $tk = 0; $td = 0; $missing = 0
$ans = [ordered]@{}      # answer id -> {id, sec, q, parent}
$sts = New-Object 'System.Collections.Generic.List[object]'; $seenT = @{}; $seenS = @{}
foreach ($f in Get-ChildItem $Dir -Filter 'thr_*.jsonl' | Sort-Object Name) {
    foreach ($line in [IO.File]::ReadAllLines($f.FullName, [Text.Encoding]::UTF8)) {
        if (-not $line.Trim()) { continue }
        try { $o = $line | ConvertFrom-Json } catch { $bad++; continue }
        if ($o.PSObject.Properties.Name -contains 'q') {
            $q = [int]$o.q; if (-not $thr.ContainsKey($q)) { $badId++; continue }; $seenT[$q] = 1
            if ($o.tab -eq 'drop' -or -not @($o.a).Count) { $td++; continue }
            $tk++; $valid = @($thr[$q].ans)
            foreach ($a in $o.a) {
                $id = [int]$a[0]; $sec = [string]$a[1]
                if ($valid -notcontains $id -or $secs -notcontains $sec) { $badId++; continue }
                if ($ans.Contains("$id")) { $dup++; continue }
                $m = $by[$id]; $par = $(if ($m.reply -and $by.ContainsKey($m.reply)) { $m.reply } else { $q })
                $ans["$id"] = [pscustomobject]@{ id = $id; sec = $sec; q = $q; parent = $par }
            }
        } else {
            $id = [int]$o.id; if (-not $stm.ContainsKey($id)) { $badId++; continue }; $seenS[$id] = 1
            if ($o.verdict -ne 'drop') {
                $ls = $by[$id].text -split "`n"; $n = $ls.Count; $seen = New-Object 'int[]' ($n + 2); $ok = $true
                foreach ($s in $o.segs) { if ($secs -notcontains $s.sec -or $s.from -lt 1 -or $s.to -gt $n -or $s.from -gt $s.to) { $ok = $false; break }; for ($i = [int]$s.from; $i -le [int]$s.to; $i++) { $seen[$i]++ } }
                if ($ok) { for ($i = 1; $i -le $n; $i++) { if ($seen[$i] -ne 1 -and $ls[$i - 1].Trim()) { $ok = $false; break } } }
                if (-not $ok) { $cover++; continue }
            }
            $sts.Add($o)
        }
    }
}
$missing = @($thr.Keys | Where-Object { -not $seenT[$_] }).Count + @($stm.Keys | Where-Object { -not $seenS[$_] }).Count
"bad json: $bad  bad ids: $badId  duplicate answers skipped: $dup  statement coverage errors: $cover  blocks with no verdict: $missing"
"threads: kept $tk  dropped $td   answers kept: $($ans.Count) of $(($thr.Values | ForEach-Object { @($_.ans).Count } | Measure-Object -Sum).Sum) replies"
"statements: " + (($sts | Group-Object verdict | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ' ')
$imp = @{}; if ($Imported) { foreach ($l in [IO.File]::ReadAllLines($Imported)) { $o = $l | ConvertFrom-Json; if ($o.verdict -ne 'drop') { $imp[[int]$o.id] = 1 } } }
"per tab (answers / statement segments):"
foreach ($s in $secs) { "  {0,-8} {1,5} / {2,4}" -f $s, @($ans.Values | Where-Object { $_.sec -eq $s }).Count, @($sts | Where-Object { $_.verdict -ne 'drop' } | ForEach-Object { $_.segs } | Where-Object { $_.sec -eq $s }).Count }
$allIds = @($ans.Keys | ForEach-Object { [int]$_ }) + @($sts | Where-Object { $_.verdict -ne 'drop' } | ForEach-Object { [int]$_.id })
"messages selected: $($allIds.Count)  already imported before: $(@($allIds | Where-Object { $imp[$_] }).Count)  by 'Deleted Account': $(@($allIds | Where-Object { $by[$_].name -eq 'Deleted Account' }).Count)  distinct display names: $(@($allIds | ForEach-Object { $by[$_].name } | Select-Object -Unique).Count)"
$len = $allIds | ForEach-Object { $by[$_].text.Length }
"answer length: <40 chars $(@($len | Where-Object { $_ -lt 40 }).Count)   40-149 $(@($len | Where-Object { $_ -ge 40 -and $_ -lt 150 }).Count)   150+ $(@($len | Where-Object { $_ -ge 150 }).Count)   total chars $(($len | Measure-Object -Sum).Sum)"
"with media: $(@($allIds | Where-Object { $by[$_].media }).Count)   years: " + ((($allIds | Group-Object { $by[$_].dt.Substring(6, 4) } | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Count)" })) -join ' ')

$enc = New-Object Text.UTF8Encoding $false
$out = @($ans.Values | ForEach-Object { $_ | ConvertTo-Json -Compress }) + @($sts | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 6 })
[IO.File]::WriteAllLines((Join-Path $Dir 'pass3.jsonl'), [string[]]$out, $enc)
$sb = New-Object Text.StringBuilder; [void]$sb.AppendLine("# ENGL 101 (Telegram) - answers by question`n")
foreach ($s in $secs) {
    $g = @($ans.Values | Where-Object { $_.sec -eq $s }); [void]$sb.AppendLine("`n## $s - $($g.Count) answers`n")
    foreach ($qq in ($g | Group-Object q | Sort-Object { [int]$_.Name })) {
        $q = $by[[int]$qq.Name]; $qt = ($q.text -replace '\s+', ' '); if ($qt.Length -gt 300) { $qt = $qt.Substring(0, 300) + ' …' }
        [void]$sb.AppendLine("**Q [$($q.id)](https://t.me/KFUPM_ENG101/$($q.id)) $($q.dt.Substring(6,4)):** $qt`n")
        foreach ($a in $qq.Group) { $m = $by[$a.id]; [void]$sb.AppendLine("- **$($m.name)** ($($a.id)): " + ($m.text -replace "`n", ' ⏎ ')) }
        [void]$sb.AppendLine('')
    }
}
[void]$sb.AppendLine("`n## statements kept`n")
foreach ($o in ($sts | Where-Object { $_.verdict -ne 'drop' })) { $m = $by[[int]$o.id]; [void]$sb.AppendLine("### $($m.id) - $($m.name) - $($o.verdict) - " + ((($o.segs | ForEach-Object { $_.sec }) | Select-Object -Unique) -join ', ')); [void]$sb.AppendLine('```'); [void]$sb.AppendLine($m.text); [void]$sb.AppendLine('```'); [void]$sb.AppendLine('') }
[IO.File]::WriteAllText((Join-Path $Dir 'review3.md'), $sb.ToString(), $enc)
"review3.md bytes: $((Get-Item (Join-Path $Dir 'review3.md')).Length)"
