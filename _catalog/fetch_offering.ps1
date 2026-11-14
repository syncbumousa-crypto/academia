# Registrar Course Offering -> TSV (term, dept, course_sec, act, instructor). One POST per term x department,
# sequential and paced. The form accepts terms older than the ones its dropdown lists (back to 201410).
param([int]$FromYear = 2014, [int]$ToYear = 2021, [string]$OutFile, [string]$LogFile)
$ErrorActionPreference = 'Stop'
$u = 'https://registrar.kfupm.edu.sa/courses-classes/course-offering1/'
$s = $null
$r = Invoke-WebRequest $u -UseBasicParsing -SessionVariable s -TimeoutSec 60
$depts = [regex]::Matches($r.Content, '<option value="([A-Z]{2,5})"') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
$terms = foreach ($y in $FromYear..$ToYear) { foreach ($t in 10, 20, 30) { "$y$t" } }
$enc = New-Object Text.UTF8Encoding $false
$out = New-Object 'System.Collections.Generic.List[string]'; $out.Add("term`tdept`tcourse_sec`tact`tinstructor")
$rowRe = [regex]'(?s)<tr>\s*<td>\s*([^<]*?)\s*</td>\s*<td>\s*([^<]*?)\s*</td>\s*<td>\s*([^<]*?)\s*</td>\s*<td>\s*([^<]*?)\s*</td>\s*<td>\s*([^<]*?)\s*</td>'
$n = 0
foreach ($term in $terms) {
  foreach ($d in $depts) {
    $n++
    for ($try = 1; $try -le 3; $try++) {
      try {
        $page = Invoke-WebRequest $u -UseBasicParsing -WebSession $s -TimeoutSec 60
        $tok = [regex]::Match($page.Content, 'name="csrfmiddlewaretoken" value="([^"]+)"').Groups[1].Value
        $p = Invoke-WebRequest 'https://registrar.kfupm.edu.sa/course-offerings' -Method Post -UseBasicParsing -WebSession $s `
          -Headers @{ Referer = $u } -Body @{ csrfmiddlewaretoken = $tok; term_code = $term; dept_code = $d; page_choice = 'CO' } -TimeoutSec 90
        $rows = $rowRe.Matches($p.Content)
        foreach ($m in $rows) {
          $cs = $m.Groups[1].Value.Trim(); if ($cs -notmatch '-') { continue }
          $out.Add(($term, $d, $cs, $m.Groups[2].Value.Trim(), ([Net.WebUtility]::HtmlDecode($m.Groups[5].Value.Trim()))) -join "`t")
        }
        [IO.File]::AppendAllText($LogFile, "$n $term $d rows=$($rows.Count)`n", $enc)
        break
      } catch {
        [IO.File]::AppendAllText($LogFile, "$n $term $d try$try ERR $($_.Exception.Message)`n", $enc)
        Start-Sleep -Seconds (5 * $try)
      }
    }
    Start-Sleep -Milliseconds 400
  }
  [IO.File]::WriteAllLines($OutFile, $out, $enc)
}
[IO.File]::WriteAllLines($OutFile, $out, $enc)
[IO.File]::AppendAllText($LogFile, "DONE rows=$($out.Count - 1)`n", $enc)
