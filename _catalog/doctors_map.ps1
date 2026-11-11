# Maps registrar offering rows (since 202210) onto the site's courses: per site key (code, or code::معمل for the lab)
# the instructors in title case, latest term first. Writes doctors_plan.json and prints a summary.
param([string]$Offering, [string]$Courses, [string]$OutFile, [int]$Since = 202210)
$ErrorActionPreference = 'Stop'
$LAB = '::' + [string]::new([char[]](0x645, 0x639, 0x645, 0x644))   # ::معمل
$site = @{}; foreach ($l in [IO.File]::ReadAllLines($Courses)) { $c = $l -split "`t"; if ($c[0]) { $site[$c[0]] = ($c[1] -eq '1') } }
$tc = { param($n) $s = $n.ToLower(); $s = [regex]::Replace($s, "(^|[\s\-'])([a-z])", { param($m) $m.Groups[1].Value + $m.Groups[2].Value.ToUpper() }); [regex]::Replace($s, '\bMc([a-z])', { param($m) 'Mc' + $m.Groups[1].Value.ToUpper() }) }
$norm = { param($code) $c = ($code -replace '\s+', ' ').Trim().ToUpper(); if ($c -match '^([A-Z]+)\s?(\d{3}[A-Z]?)$') { "$($Matches[1]) $($Matches[2])" } else { $c } }
$plan = @{}; $unmatched = @{}; $acts = @{}; $rowsUsed = 0; $tba = 0
foreach ($l in [IO.File]::ReadAllLines($Offering) | Select-Object -Skip 1) {
    $c = $l -split "`t"; if ($c.Count -lt 5) { continue }
    $term = [int]$c[0]; if ($term -lt $Since) { continue }
    $ins = ($c[4] -replace '\s+', ' ').Trim()
    if (-not $ins -or $ins -match '^-?\s*TBA$|^TBA\b|^-$|^STAFF$') { $tba++; continue }
    $cs = $c[2]; $i = $cs.LastIndexOf('-'); $code = & $norm $(if ($i -gt 0) { $cs.Substring(0, $i) } else { $cs })
    if (-not $site.ContainsKey($code)) { $unmatched[$code] = 1 + [int]$unmatched[$code]; continue }
    $act = $c[3]; $acts[$act] = 1 + [int]$acts[$act]
    $key = $(if ($act -eq 'LAB' -and $site[$code]) { $code + $LAB } else { $code })
    foreach ($one in ($ins -split '\s*[,;/]\s*|\s+&\s+')) {
        $one = $one.Trim(); if (-not $one -or $one -match '^TBA$') { continue }
        $n = & $tc $one
        if (-not $plan.ContainsKey($key)) { $plan[$key] = @{} }
        if (-not $plan[$key].ContainsKey($n) -or $plan[$key][$n] -lt $term) { $plan[$key][$n] = $term }
    }
    $rowsUsed++
}
$out = [ordered]@{}
foreach ($k in ($plan.Keys | Sort-Object)) { $out[$k] = @($plan[$k].GetEnumerator() | Sort-Object @{e = { $_.Value }; d = $true }, Name | ForEach-Object { $_.Key }) }
[IO.File]::WriteAllText($OutFile, ($out | ConvertTo-Json -Depth 4 -Compress), (New-Object Text.UTF8Encoding $false))
$labKeys = @($out.Keys | Where-Object { $_.EndsWith($LAB) })
$codesCovered = @($out.Keys | ForEach-Object { $_.Replace($LAB, '') } | Select-Object -Unique)
"rows used: $rowsUsed  TBA/blank skipped: $tba  activities: " + (($acts.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ' ')
"site courses with instructors: $($codesCovered.Count) of $($site.Count)   (lab keys: $($labKeys.Count) of $(@($site.Values | Where-Object { $_ }).Count) labs)"
"instructor entries to consider: $(($out.Values | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum)   distinct people: $(@($out.Values | ForEach-Object { $_ } | Select-Object -Unique).Count)"
"per-course size: max $(($out.Values | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum)  median $(@($out.Values | ForEach-Object { $_.Count } | Sort-Object)[[int]($out.Count/2)])"
"biggest: " + (($out.GetEnumerator() | Sort-Object { $_.Value.Count } -Descending | Select-Object -First 8 | ForEach-Object { "$($_.Key)=$($_.Value.Count)" }) -join ' ')
"site courses NOT in offering since $Since`: $(@($site.Keys | Where-Object { $codesCovered -notcontains $_ }).Count)"
"registrar codes not on the site: $($unmatched.Count) (sections $(($unmatched.Values | Measure-Object -Sum).Sum))"
