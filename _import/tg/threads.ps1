# Builds question threads per tab from the vocabulary: a question message + ALL human replies under it (reply links, any depth).
param([string]$Export, [string]$Vocab, [string]$OutDir, [int]$ChunkBytes = 150000, [switch]$Write)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -Path (Join-Path $here 'TgParse.cs')
[void][TgParse]::Parse($Export); $all = [TgParse]::All; $by = [TgParse]::ById
$voc = [IO.File]::ReadAllText($Vocab, [Text.Encoding]::UTF8) | ConvertFrom-Json
function X($p) { foreach ($k in $voc.macros.PSObject.Properties) { $p = $p.Replace('{' + $k.Name + '}', $k.Value) }; $p }
$norm = { param($s) (($s.ToLower() -replace '[ً-ْـ]', '') -replace '[أإآ]', 'ا' -replace 'ة', 'ه' -replace 'ى', 'ي') }
$botRx = [regex]'^ردود ج|^جَبَل'
$kids = @{}; $botKid = @{}
foreach ($x in $all) {
    $x.bot = $botRx.IsMatch($x.name)
    if ($x.reply -and $by.ContainsKey($x.reply)) {
        if ($x.bot) { $botKid[$x.reply] = 1 } else { if (-not $kids.ContainsKey($x.reply)) { $kids[$x.reply] = New-Object 'System.Collections.Generic.List[int]' }; $kids[$x.reply].Add($x.id) }
    }
}
# a question: has a question mark or opens with an interrogative; and is not a bare bot trigger
$isQ = [regex]'[؟?]|^\s*(?:كيف|وش|ايش|شنو|شلون|هل|كم|مين|منو|من وين|وين|متى|ليش|ليه|احد|حد |في احد|فيه احد|يا شباب|شباب|يا جماعه|ممكن|ابي|ابغى|ابغي|عندكم|عندك|تنصحون|تكفون)'
$drWord = [regex](X '{DR}|تصحيح\w*|شرح\w*|يشرح|يصحح|كريم|شديد|ينصح|تنصحون|انصح|رايكم|عنده|عندها|معه|معها|سكشن|section')
$order = 'doc', 'grade', 'lessons', 'srcP', 'srcU', 'info'      # a question matching several tabs goes to the first
$rx = @{}
foreach ($t in $voc.tabs.PSObject.Properties) { foreach ($q in $t.Value.PSObject.Properties) { $rx["$($t.Name)|$($q.Name)"] = New-Object regex ((X $q.Value), 'IgnoreCase,Compiled') } }
$threads = New-Object 'System.Collections.Generic.List[object]'; $stmts = New-Object 'System.Collections.Generic.List[object]'
$taken = @{}
foreach ($x in $all) {
    if ($x.bot -or -not $x.text.Trim()) { continue }
    $t = & $norm $x.text
    $hit = $null
    foreach ($tab in $order) {
        foreach ($q in $voc.tabs.$tab.PSObject.Properties) {
            if (-not $rx["$tab|$($q.Name)"].IsMatch($t)) { continue }
            $kind = $q.Name.Substring(0, 1)
            if ($kind -eq 'n' -and -not $drWord.IsMatch($t)) { continue }            # an instructor name needs an evaluative word near it
            $hit = [pscustomobject]@{ tab = $tab; q = $q.Name; kind = $kind }; break
        }
        if ($hit) { break }
    }
    if (-not $hit) { continue }
    $hasKids = $kids.ContainsKey($x.id)
    if ($hit.kind -ne 's' -and $isQ.IsMatch($t) -and $hasKids -and $t.Length -ge 8) {
        # gather all human descendants
        $ids = New-Object 'System.Collections.Generic.List[int]'; $st = New-Object 'System.Collections.Generic.Stack[int]'; $st.Push($x.id)
        while ($st.Count) { $c = $st.Pop(); if ($kids.ContainsKey($c)) { foreach ($k in $kids[$c]) { $ids.Add($k); $st.Push($k) } } }
        $threads.Add([pscustomobject]@{ q = $x.id; tab = $hit.tab; query = $hit.q; ans = @($ids | Sort-Object) })
        foreach ($i in $ids) { $taken[$i] = 1 }
    } elseif ($hit.kind -ne 'q' -and $t.Length -ge 60 -and -not $isQ.IsMatch($t.Substring(0, [Math]::Min(25, $t.Length)))) {
        $stmts.Add([pscustomobject]@{ id = $x.id; tab = $hit.tab; query = $hit.q })
    }
}
$stmts = @($stmts | Where-Object { -not $taken[$_.id] })      # a statement that is already an answer in a thread is read there
"threads: $($threads.Count)  answers in them: $(($threads | ForEach-Object { $_.ans.Count } | Measure-Object -Sum).Sum)  standalone statements: $($stmts.Count)"
foreach ($tab in $order) {
    $g = @($threads | Where-Object { $_.tab -eq $tab }); $s = @($stmts | Where-Object { $_.tab -eq $tab })
    "  {0,-8} threads {1,5}  answers {2,6}  statements {3,5}" -f $tab, $g.Count, (($g | ForEach-Object { $_.ans.Count } | Measure-Object -Sum).Sum), $s.Count
}
"by query:"; $threads | Group-Object tab, query | Sort-Object Count -Descending | ForEach-Object { "  {0,5} thr {1,6} ans  {2}" -f $_.Count, (($_.Group | ForEach-Object { $_.ans.Count } | Measure-Object -Sum).Sum), $_.Name }
$chars = 0; foreach ($th in $threads) { $chars += $by[$th.q].text.Length; foreach ($a in $th.ans) { $chars += $by[$a].text.Length + 30 } }; foreach ($s in $stmts) { $chars += $by[$s.id].text.Length }
"total chars to read: $chars"
if (-not $Write) { return }

$enc = New-Object Text.UTF8Encoding $false
New-Item -ItemType Directory -Force $OutDir | Out-Null; Get-ChildItem $OutDir -Filter 'th_*.txt' | Remove-Item
$n = 0; $sb = New-Object Text.StringBuilder
function Flush() { if ($script:sb.Length) { $script:n++; [IO.File]::WriteAllText((Join-Path $OutDir ("th_{0:d2}.txt" -f $script:n)), $script:sb.ToString(), $enc); [void]$script:sb.Clear() } }
function One($s) { ($s -replace "`r", '') -replace "`n", ' ⏎ ' }
foreach ($th in ($threads | Sort-Object q)) {
    $q = $by[$th.q]
    [void]$sb.AppendLine("=== THREAD $($th.q) | tab guess: $($th.tab) | $($q.dt.Substring(0,10))")
    [void]$sb.AppendLine("Q $($th.q) ($($q.name)): $(One $q.text)")
    foreach ($a in $th.ans) { $m = $by[$a]; $media = $(if ($m.media) { " [$($m.media)$(if ($m.mtitle -and $m.media -eq 'file') { ': ' + $m.mtitle })]" } else { '' })
        [void]$sb.AppendLine("A $a ($($m.name))$(if ($m.reply -ne $th.q) { " ->$($m.reply)" })$media`: $(One $m.text)") }
    [void]$sb.AppendLine('')
    if ($sb.Length -ge $ChunkBytes / 2) { Flush }
}
Flush; $threadChunks = $n
foreach ($s in ($stmts | Sort-Object id)) {
    $m = $by[$s.id]
    [void]$sb.AppendLine("=== STATEMENT $($s.id) | tab guess: $($s.tab) | $($m.dt.Substring(0,10)) | by: $($m.name) | replies it got: $(if ($kids.ContainsKey($s.id)) { $kids[$s.id].Count } else { 0 })")
    if ($m.reply -and $by.ContainsKey($m.reply)) { $pt = $by[$m.reply].text; if ($pt.Length -gt 600) { $pt = $pt.Substring(0, 600) + ' …' }; [void]$sb.AppendLine("PARENT: $(One $pt)") } else { [void]$sb.AppendLine('PARENT: none') }
    $i = 0; foreach ($l in ($m.text -split "`n")) { $i++; [void]$sb.AppendLine("L$i`: $l") }
    [void]$sb.AppendLine('')
    if ($sb.Length -ge $ChunkBytes / 2) { Flush }
}
Flush
"chunks: $n (threads: 1..$threadChunks, statements: $($threadChunks + 1)..$n)"
[IO.File]::WriteAllLines((Join-Path $OutDir 'threads.jsonl'), [string[]]($threads | ForEach-Object { $_ | ConvertTo-Json -Compress }), $enc)
[IO.File]::WriteAllLines((Join-Path $OutDir 'statements.jsonl'), [string[]]($stmts | ForEach-Object { $_ | ConvertTo-Json -Compress }), $enc)
