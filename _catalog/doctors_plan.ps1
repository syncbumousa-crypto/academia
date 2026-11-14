# Final per-course instructor plan: merge registrar spellings of one person, drop people already on the site
# (English names by rule, Arabic names by the hand list below). Writes the plan the admin panel will apply.
param([string]$Plan, [string]$OutFile)
$ErrorActionPreference = 'Stop'
$LAB = '::' + [string]::new([char[]](0x645, 0x639, 0x645, 0x644))
$p = [IO.File]::ReadAllText($Plan, [Text.Encoding]::UTF8) | ConvertFrom-Json
function Parts($n) {
    $s = $n.ToLower() -replace '^\s*(dr|mr|mrs|ms|prof)\.?\s+', ''
    $t = @(($s -replace '[^a-z\s\-]', ' ') -split '\s+' | Where-Object { $_ -and $_ -notin 'al', 'el', 'md', 'mr', 'dr' })
    if (-not $t.Count) { return $null }
    $last = ($t[-1] -replace '^(al|el)-', '' -replace '-', '')
    if ($last.Length -le 1 -and $t.Count -ge 2) { $last = ($t[-2] -replace '^(al|el)-', '' -replace '-', '') }
    $first = ($t[0] -replace '-', '')
    @{ first = $first; fk = ($first.Substring(0, 1) + ($first.Substring(1) -replace '[aeiouy]', '')); last = ($last -replace '^(al|el)', '') }
}
function Same($a, $b, $init = $true) {
    $x = Parts $a; $y = Parts $b; if (-not $x -or -not $y) { return $false }
    if ($x.last -ne $y.last) { return $false }
    if ($x.fk -eq $y.fk) { return $true }
    if (-not $init) { return $false }
    ($x.first.Length -eq 1 -and $y.first.StartsWith($x.first)) -or ($y.first.Length -eq 1 -and $x.first.StartsWith($y.first))
}
# people already on the site (server, 2026-11-11) for the courses that have any instructors
$EXIST = @{
  'ENGL 101' = 'Jeffrey Jameson|Thomas Telfer|Christopher Morris|Ahmed Daud Ismail|Ralph Kraft|Anthony Donovan|Roger Horn|Dana Ebbett|Savino Sfregola|John Williams|Paul Nicholas|Kevan Moore|Josh Billam|John Carey|Michael Hartley|Timothy Nelson|Ian Davison|Gordon Blazenko|Lance King|Michael Stowe|Tom Daly|Jonathan Marquis|Anthony Gibson|Keith Pearson'
  'ENGL 102' = 'Ahmed Daud Ismail|Anthony Donovan|Anthony Gibson|Antonio Ellison|Christopher Bartle|Christopher Morris|Dana Ebbett|Gordon Blazenko|Ian Davison|Jeffrey Jameson|John Williams|Jonathan Marquis|Jordan Hicks|Josh Billam|Keith Pearson|Kevan Moore|Lance King|M. Aurelius|Michael Hartley|Michael Stowe|Paul Nicholas|Ralph Kraft|Roger Horn|Savino Sfregola|Thomas Telfer|Timothy Nelson|Tom Daly'
  'ENGL 214' = 'Ahmed Daud Ismail|Anthony Donovan|Anthony Gibson|Dragos Brad|Gordon Blazenko|Jeffrey Jameson|Jonathan Marquis|Josh Billam|Kevan Moore|Lance King|Michael Hartley|Roger Horn|Savino Sfregola|Thomas Telfer|Timothy Nelson|Tom Daly'
  'FIN 250' = 'Ahmed Khalifa|Ali Habib Al-Elg|Hesham Merdad|Ibrahim Al-Naeem|Khaled Al-Otaibi|Khaled M. Albinali|Mohammed Musa|Qi Dong|Mansour Alsahlawi|Jassim Yousif'
}
$mathCommon = 'A Boucherif|Abdeslam Mimouni|Abdulaziz Al-Assaf|Abdulilah Kadri|Abdulmuhsin Alfaraj|Abed-Alhay Elmughrabi|Adel Khalfallah|Adel Moham Al-Mahdi|Ahmad Ahmad|Ahmad Al-Dweik|Ahmad Bonfoh|Ahmed Shawky|Ahmet Tatar|Ali Duman|Assane Lo|Azzam Alfarraj|Bader Al-Humidi|E Echi|Faisal Fairag|Faisal Suwayyid|Halic M|Hattan Tawfiq|I Louhichi|Ibrahim Al-Rasasi|Izhar Ahmad|J Al-Smail|Jaafar Al-Mutawa|K Furati|Khalid Adarbeh|Khalid Al-Anezy|Khalid Al-Shammari|M Al-Shahrani|Mahmoud Sarhan|Mohammad Aboshosha|Mohammad Abu-Sbeih|Mohammad Kafini|Mohsen Alshahrani|Monther Alfuraidan|Muhammad Aslam Chaudhry|Muhammad Bokhari|Muhammad Imran Qureshi|Nadeem Malik|Naseer-Eddine Tatar|R. Anabosi|Rajaie Alassar|S Boubaker|S Kabbaj|Saeed Al-Garni|Shadi Moham Alomari|Slim Belhaiza|Stephen Binns|Taleb Alkurdi|W Al-Khulaifi|Yaqoub Shehadeh|Yassir Khalid'
$EXIST['MATH 101'] = $mathCommon + '|Ali Iftikhar|Audu Johnson|Faez Al-Qarni|Hamza Hroub|Husain Al-Attas|J Abuihlail|Jae-Chean Joo|Jarrar M S|Khairul Saleh|Manal Alotibi|Marwan Al-Momani|Mohammad Algharabli|Mohammad Omar|Mohammed Saleh|Rachid Marsli|Saddam Abbasi|Saeed Salman|Suliman Al-Homaidan|Waleed Al-Sabah|Walid Sharabati'
$EXIST['MATH 102'] = $mathCommon + '|Abd-Ur-Rahim Khan|Bernard Kuowei Yu|Brahim Mezerdi|E. Al-Sawi|Ibrahim Sarumi|Maher Nour|Moenes Mellouli|Mohammed Salem Samman|Muhammad Islam Mustafa|Mustapha Kassem|Nicolas Hadjisavvas|Ryad Ghanam'
# Arabic names on the site, matched by hand to the registrar spelling of the same person
$HAND = @{
  'IAS 111' = 'Khalid Alabri|Muosa Al-Sulami|Saeed Al-Ghahtani'
  'IAS 121' = 'Khalid Al Jurayan|Abdullah Ibrahim'
  'IAS 212' = 'Ahmed Al-Enaizan|Hasan Sendi|Khalid Al-Sulaiman|Rakan Alharbi|Ahmad Al-Omar|Abdulrahman Al-Khaldi|Yahya Al-Zahrani|Khalid Al-Muzeini|Fahad Al-Dossary'
  'MGT 210' = 'Edward Joyner'
  'MGT 301' = 'Omar Al-Zamel'
  'MIS 250' = 'Saleh Al-Wahaishi'
  ('MIS 250' + $LAB) = 'Saleh Al-Wahaishi'
}
$res = [ordered]@{}; $merged = 0; $existSkip = 0; $handSkip = 0; $log = New-Object 'System.Collections.Generic.List[string]'
foreach ($pr in $p.PSObject.Properties) {
    $k = $pr.Name; $kept = New-Object 'System.Collections.Generic.List[string]'
    $ex = @(); if ($EXIST.ContainsKey($k)) { $ex = $EXIST[$k] -split '\|' }
    $hl = @(); if ($HAND.ContainsKey($k)) { $hl = $HAND[$k] -split '\|' }
    foreach ($n in $pr.Value) {
        if ($hl -contains $n) { $handSkip++; continue }
        $e = $ex | Where-Object { Same $_ $n } | Select-Object -First 1
        if ($e -and $log.Count -lt 80) { $log.Add("EXIST $k : '$e' = '$n'") }
        if ($e) { $existSkip++; continue }
        $d = $kept | Where-Object { Same $_ $n $false } | Select-Object -First 1
        if ($d) { $merged++; if ($log.Count -lt 40) { $log.Add("$k : '$d' <= '$n'") }; continue }
        $kept.Add($n)
    }
    if ($kept.Count) { $res[$k] = $kept.ToArray() }
}
[IO.File]::WriteAllText($OutFile, ($res | ConvertTo-Json -Depth 4 -Compress), (New-Object Text.UTF8Encoding $false))
"keys: $($res.Count)  names to add: $(($res.Values | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum)"
"merged registrar spellings: $merged  already on site (rule): $existSkip  hand-matched Arabic: $handSkip"
$log
