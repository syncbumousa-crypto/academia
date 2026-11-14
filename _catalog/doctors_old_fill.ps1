# Keep, from the 2014-2021 plan, only the site keys that got no instructor from 2022 on (the empty courses and labs).
# Courses that already have names are left alone: an old list would bury the current instructors.
param([string]$OldPlan, [string]$NewPlan, [string]$OutFile)
$ErrorActionPreference = 'Stop'
$old = [IO.File]::ReadAllText($OldPlan, [Text.Encoding]::UTF8) | ConvertFrom-Json
$new = [IO.File]::ReadAllText($NewPlan, [Text.Encoding]::UTF8) | ConvertFrom-Json
$have = @{}; foreach ($p in $new.PSObject.Properties) { $have[$p.Name] = 1 }
# courses that had instructors on the site before the rollout (not in the plan because nothing new was added)
foreach ($k in 'ENGL 101', 'ENGL 102', 'ENGL 214', 'FIN 250', 'MATH 101', 'MATH 102', 'IAS 111', 'IAS 121', 'IAS 212', 'MGT 210', 'MGT 301', 'MIS 250', 'STAT 214') { $have[$k] = 1 }
$res = [ordered]@{}; $names = 0
foreach ($p in $old.PSObject.Properties) {
  if ($have.ContainsKey($p.Name)) { continue }
  $res[$p.Name] = @($p.Value); $names += @($p.Value).Count
}
[IO.File]::WriteAllText($OutFile, ($res | ConvertTo-Json -Depth 4 -Compress), (New-Object Text.UTF8Encoding $false))
"empty keys filled from 2014-2021: $($res.Count)   names: $names"
"sample: " + (($res.GetEnumerator() | Select-Object -First 12 | ForEach-Object { "$($_.Key)=$(@($_.Value).Count)" }) -join ' ')
