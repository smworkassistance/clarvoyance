# Builds brain/dashboard.html from the brain's own files. No AI calls, so it costs no quota.
# Run it after each brief, or whenever you want an up-to-date page: powershell -File brain\build-dashboard.ps1
# The page is static: the schedule and quota shown are as of the moment this script ran.

$ErrorActionPreference = 'Stop'
$brain = $PSScriptRoot
$out = Join-Path $brain 'dashboard.html'
function Enc($s) { [System.Net.WebUtility]::HtmlEncode([string]$s) }
$now = Get-Date -Format 'dd MMM yyyy, HH:mm'

# Schedule: read live from Task Scheduler at build time.
try {
    $task = Get-ScheduledTask -TaskName 'Clarvoyance CEO Brain Daily'
    $info = Get-ScheduledTaskInfo -TaskName 'Clarvoyance CEO Brain Daily'
    $schedState = [string]$task.State
    $nextRun = if ($info.NextRunTime) { $info.NextRunTime.ToString('ddd dd MMM, HH:mm') } else { 'none' }
    $lastRun = if ($info.LastRunTime -and $info.LastRunTime.Year -gt 2000) { $info.LastRunTime.ToString('ddd dd MMM, HH:mm') } else { 'never' }
    $schedDays = 'Mon and Thu, 06:00'
} catch {
    $schedState = 'not found'; $nextRun = '-'; $lastRun = '-'; $schedDays = '-'
}

# Quota: read from brain/quota-state.txt.
$q = @{}
if (Test-Path (Join-Path $brain 'quota-state.txt')) {
    foreach ($line in Get-Content -Encoding UTF8 (Join-Path $brain 'quota-state.txt')) {
        if ($line -match '^(\w+)=(.*)$') { $q[$Matches[1]] = $Matches[2] }
    }
}
function Gauge($label, $pct, $note) {
    $p = [int]$pct
    $tone = if ($p -ge 80) { 'bad' } elseif ($p -ge 50) { 'warn' } else { 'good' }
    return "<div class='gauge'><div class='gauge-top'><span>$(Enc $label)</span><b>$p%</b></div><div class='bar'><i class='$tone' style='width:$([math]::Min($p,100))%'></i></div><div class='muted small'>$(Enc $note)</div></div>"
}
$weekly = if ($q.weekly_used_pct) { [int]$q.weekly_used_pct } else { 0 }
$session = if ($q.session_used_pct) { [int]$q.session_used_pct } else { 0 }
$brainBudget = if ($q.brain_budget_pct) { [int]$q.brain_budget_pct } else { 0 }
$brainSpent = if ($q.brain_week_spent_pct) { [int]$q.brain_week_spent_pct } else { 0 }
$brainPctOfBudget = if ($brainBudget -gt 0) { [math]::Round(100 * $brainSpent / $brainBudget) } else { 0 }
$quotaHtml = (Gauge 'Weekly quota (whole account)' $weekly 'Reset Tuesday 23:30') +
             (Gauge 'Current session' $session 'Resets at 06:30') +
             (Gauge 'Brain share of this week' $brainPctOfBudget "$brainSpent% of $brainBudget% budget used")

# Latest brief and research files.
$briefFile = Get-ChildItem (Join-Path $brain 'briefs') -Filter '*.md' | Where-Object { $_.Name -ne 'README.md' } | Sort-Object LastWriteTime | Select-Object -Last 1
$briefText = if ($briefFile) { Get-Content -Raw -Encoding UTF8 $briefFile.FullName } else { 'No brief yet.' }
$briefName = if ($briefFile) { $briefFile.Name } else { '-' }
$researchList = Get-ChildItem (Join-Path $brain 'research') -Filter '*.md' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
$researchHtml = if ($researchList) { ($researchList | ForEach-Object { "<li>$(Enc $_.Name)</li>" }) -join '' } else { '<li class="muted">No research pass yet.</li>' }

# Open questions and pending conclusions (raw text, escaped).
$inbox = Get-Content -Raw -Encoding UTF8 (Join-Path $brain 'inbox\questions.md')
$backlog = Get-Content -Raw -Encoding UTF8 (Join-Path $brain 'backlog.md')

# Owner-written sections (Vision, Mission, Success, First user) for the editor boxes.
$pbRaw = Get-Content -Raw -Encoding UTF8 (Join-Path $brain 'project-brain.md')
function Get-OwnerSection($key) {
    $m = [regex]::Match($pbRaw, "(?s)<!-- OWNER:$key`:START -->\r?\n(.*?)\r?\n<!-- OWNER:$key`:END -->")
    if ($m.Success) { return $m.Groups[1].Value.Trim() } else { return '' }
}
$editorSections = @(
    @{ key = 'VISION';    title = 'Vision';     help = 'Where Clarvoyance should be in 12 months, in your words.' },
    @{ key = 'MISSION';   title = 'Mission';    help = 'What you want to do for people, in your words.' },
    @{ key = 'SUCCESS';   title = 'Success';    help = 'What success means to you.' },
    @{ key = 'FIRSTUSER'; title = 'First user'; help = 'Who the first person is, in your words.' }
)
$editorHtml = ($editorSections | ForEach-Object {
    "<div class='edit-block'><label for='f-$($_.key)'><b>$(Enc $_.title)</b><span class='muted small'> · $(Enc $_.help)</span></label>" +
    "<textarea id='f-$($_.key)' rows='5'>$(Enc (Get-OwnerSection $_.key))</textarea>" +
    "<div class='edit-foot'><button type='button' class='primary save' data-section='$($_.key)'>Save $(Enc $_.title)</button><span class='save-note muted small' data-note='$($_.key)'></span></div></div>"
}) -join ''

# Notifications: short, plain messages built from the brain's own files.
$notes = @()
$inboxOpen = ([regex]::Matches($inbox, '(?m)^\*\*Q-\d+')).Count
if ($inboxOpen -gt 0) { $notes += @{ level = 'info'; text = "$inboxOpen open question(s) waiting for your answer. See 'Open questions'." } }
if ($usageRows.Count -gt 0) {
    $last = $usageRows | Select-Object -Last 1
    if ($last.status -eq 'parse-failed' -or $last.is_error -eq 'True') { $notes += @{ level = 'bad'; text = 'The last brain run did not finish properly. Tell Claude to check the latest log.' } }
    elseif ($last.status -eq 'skipped-quota') { $notes += @{ level = 'info'; text = 'The last scheduled run was skipped to protect your quota. This is expected when usage is high.' } }
}
if ($weekly -ge 80) { $notes += @{ level = 'bad'; text = "Your weekly quota is at $weekly%. Keep development work first." } }
elseif ($weekly -ge 50) { $notes += @{ level = 'warn'; text = "Your weekly quota is at $weekly%. The brain will not run scheduled passes until it resets." } }
if ($brainSpent -ge $brainBudget -and $brainBudget -gt 0) { $notes += @{ level = 'warn'; text = "The brain has used its weekly budget ($brainBudget%). It will wait for the reset." } }
if ($schedState -ne 'Ready') { $notes += @{ level = 'info'; text = 'The scheduled brain run is turned off. Nothing runs on its own.' } }
if ($notes.Count -eq 0) { $notes += @{ level = 'good'; text = 'Nothing needs your attention right now.' } }
$notesHtml = ($notes | ForEach-Object { "<li class='note $($_.level)'>$(Enc $_.text)</li>" }) -join ''

# Everything that waits for the owner, read from the brain's files and the project's tasks.
$projectRoot = Split-Path -Parent $brain

# Open project tasks from tasks.json (DONE and DROPPED are hidden).
$openTasks = @()
$tasksPath = Join-Path $projectRoot 'tasks.json'
if (Test-Path $tasksPath) {
    $tj = Get-Content -Raw -Encoding UTF8 $tasksPath | ConvertFrom-Json
    $openTasks = @($tj.tasks | Where-Object { $_.status -notin @('DONE', 'DROPPED') })
}
$discussCount = @($openTasks | Where-Object { $_.status -eq 'DISCUSS' }).Count

# Owner-facing suggestions and pending conclusions (rows C-xx in backlog.md).
$backlogLines = Get-Content -Encoding UTF8 (Join-Path $brain 'backlog.md')
$conclusions = @($backlogLines | Where-Object { $_ -match '^\|\s*C-\d+' } | ForEach-Object {
    $c = @($_.Split('|') | ForEach-Object { $_.Trim() })
    [pscustomobject]@{ id = $c[1]; text = $c[2]; status = $c[3]; action = $c[4] }
})
$conclusionsOpen = @($conclusions | Where-Object { $_.status -notmatch '^(done|closed)' })

# Open questions and answered ones (inbox/questions.md).
$inboxOpenPart = ($inbox -split '## Answered')[0]
$openQs = @([regex]::Matches($inboxOpenPart, '(?m)^\*\*(Q-\d+)[^*]*\*\*\s*(.+)$') | ForEach-Object {
    [pscustomobject]@{ id = $_.Groups[1].Value; text = $_.Groups[2].Value }
})
$inboxAnsweredPart = if (($inbox -split '## Answered').Count -gt 1) { ($inbox -split '## Answered')[1] } else { '' }
$answeredQs = @($inboxAnsweredPart -split "`r?`n" | Where-Object { $_ -match '^- ' })

# Proposals waiting for approval.
$propFiles = @(Get-ChildItem (Join-Path $brain 'proposals') -Filter '*.md' -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'README.md' } | Sort-Object LastWriteTime -Descending)

# Recent owner decisions (last 8 entries of decisions.md).
$decText = Get-Content -Raw -Encoding UTF8 (Join-Path $brain 'decisions.md')
$decTail = if (($decText -split '## Decisions taken by the owner').Count -gt 1) { ($decText -split '## Decisions taken by the owner')[1] } else { '' }
$recentDecisions = @($decTail -split "`r?`n" | Where-Object { $_ -match '^- ' } | Select-Object -Last 8)

# When each source file last changed, so the owner knows how fresh the page is.
$freshFiles = @(
    @{ name = 'Project brain (vision, mission)'; path = (Join-Path $brain 'project-brain.md') },
    @{ name = 'Backlog and conclusions';        path = (Join-Path $brain 'backlog.md') },
    @{ name = 'Questions';                      path = (Join-Path $brain 'inbox\questions.md') },
    @{ name = 'Decisions';                      path = (Join-Path $brain 'decisions.md') },
    @{ name = 'Quota reading';                  path = (Join-Path $brain 'quota-state.txt') },
    @{ name = 'Run log';                        path = (Join-Path $brain 'usage-log.csv') },
    @{ name = 'Project tasks (tasks.json)';     path = $tasksPath }
)

# Usage log as a table.
$usageRows = @()
if (Test-Path (Join-Path $brain 'usage-log.csv')) { $usageRows = Import-Csv -Encoding UTF8 (Join-Path $brain 'usage-log.csv') }
$usageHtml = if ($usageRows.Count -gt 0) {
    $rows = $usageRows | ForEach-Object { "<tr><td>$(Enc $_.run_at)</td><td>$(Enc $_.status)</td><td>$(Enc $_.num_turns)</td><td>$(Enc $_.cost_usd)</td><td>$(Enc $_.cache_read)</td></tr>" }
    "<table><thead><tr><th>When</th><th>Status</th><th>Turns</th><th>Cost (API-equiv.)</th><th>Cache read</th></tr></thead><tbody>$($rows -join '')</tbody></table>"
} else { "<p class='muted'>No runs logged yet.</p>" }

$html = @"
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Clarvoyance — CEO Brain</title>
<style>
  :root {
    --bg: #f6f5f1; --card: #ffffff; --ink: #1d1d1f; --muted: #5f6368; --line: #e3e1da;
    --accent: #6b4fbb; --accent-ink: #ffffff; --good: #2e7d4f; --warn: #b26a00; --bad: #b3261e;
    --focus: #1a73e8; --bar-bg: #ece9e1;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #121214; --card: #1c1c20; --ink: #ececf1; --muted: #a3a3ad; --line: #2c2c33;
      --accent: #b8a4f0; --accent-ink: #121214; --good: #6fcf97; --warn: #f2c26b; --bad: #ff8a80;
      --focus: #8ab4f8; --bar-bg: #2a2a31;
    }
  }
  :root[data-theme="dark"] {
    --bg: #121214; --card: #1c1c20; --ink: #ececf1; --muted: #a3a3ad; --line: #2c2c33;
    --accent: #b8a4f0; --accent-ink: #121214; --good: #6fcf97; --warn: #f2c26b; --bad: #ff8a80;
    --focus: #8ab4f8; --bar-bg: #2a2a31;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font: 15px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  a, button { font: inherit; }
  :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 6px; }
  header {
    display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;
    padding: 20px clamp(16px, 4vw, 40px); border-bottom: 1px solid var(--line);
    position: sticky; top: 0; background: var(--bg); z-index: 2;
  }
  h1 { font-size: 1.25rem; margin: 0; letter-spacing: -0.01em; }
  h2 { font-size: 1rem; margin: 0 0 12px; letter-spacing: 0.01em; }
  .sub { color: var(--muted); font-size: .85rem; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; }
  button {
    border: 1px solid var(--line); background: var(--card); color: var(--ink);
    padding: 8px 14px; border-radius: 999px; cursor: pointer; min-height: 40px;
  }
  button.primary { background: var(--accent); color: var(--accent-ink); border-color: transparent; font-weight: 600; }
  main {
    padding: clamp(16px, 4vw, 40px); display: grid; gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  }
  .card {
    background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 20px;
    min-width: 0;
  }
  .wide { grid-column: 1 / -1; }
  .status { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .pill { border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px; font-size: .85rem; }
  .pill.on { color: var(--good); border-color: var(--good); }
  .pill.off { color: var(--warn); border-color: var(--warn); }
  .gauge { margin-bottom: 14px; }
  .gauge-top { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 6px; }
  .bar { height: 10px; background: var(--bar-bg); border-radius: 999px; overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: 999px; }
  .bar i.good { background: var(--good); }
  .bar i.warn { background: var(--warn); }
  .bar i.bad { background: var(--bad); }
  .muted { color: var(--muted); }
  .small { font-size: .82rem; }
  pre {
    white-space: pre-wrap; word-break: break-word; margin: 0; font: 13px/1.6 ui-monospace, SFMono-Regular, Consolas, monospace;
    max-height: 420px; overflow: auto; color: var(--ink);
  }
  details { border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px; }
  summary { cursor: pointer; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: .9rem; }
  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid var(--line); }
  th { color: var(--muted); font-weight: 600; font-size: .8rem; }
  ul { margin: 0; padding-left: 18px; }
  .wait { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .wait div { border: 1px solid var(--line); border-radius: 14px; padding: 14px; display: grid; gap: 2px; }
  .wait b { font-size: 1.6rem; color: var(--accent); }
  .wait span { color: var(--muted); font-size: .85rem; }
  .item { border-top: 1px solid var(--line); padding: 10px 0; display: grid; gap: 4px; }
  .item:first-of-type { border-top: 0; }
  .item-top { display: flex; gap: 10px; align-items: center; justify-content: space-between; }
  ul.plain { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
  .scroll { overflow-x: auto; }
  .edit-block { border-top: 1px solid var(--line); padding: 14px 0; }
  .edit-block:first-of-type { border-top: 0; padding-top: 0; }
  .edit-block label { display: block; margin-bottom: 8px; }
  textarea {
    width: 100%; font: inherit; color: var(--ink); background: var(--bg); border: 1px solid var(--line);
    border-radius: 12px; padding: 12px; resize: vertical; min-height: 110px;
  }
  .edit-foot { display: flex; gap: 12px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
  .notes { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
  .note { padding: 10px 14px; border-radius: 12px; border: 1px solid var(--line); }
  .note.good { border-color: var(--good); color: var(--good); }
  .note.info { border-color: var(--focus); }
  .note.warn { border-color: var(--warn); color: var(--warn); }
  .note.bad { border-color: var(--bad); color: var(--bad); }
  .toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); background: var(--ink); color: var(--bg);
    padding: 10px 16px; border-radius: 999px; opacity: 0; transition: opacity .2s; pointer-events: none; }
  .toast.show { opacity: 1; }
  footer { padding: 0 clamp(16px, 4vw, 40px) 32px; color: var(--muted); font-size: .8rem; }
</style>
</head>
<body>
<header>
  <div>
    <h1>Clarvoyance · CEO Brain</h1>
    <div class="sub">Last updated $(Enc $now). To refresh, double-click <b>Open CEO Brain</b>.</div>
  </div>
  <div class="actions">
    <button id="theme" type="button" aria-label="Switch dark and light mode">Dark / light</button>
    <button id="research" class="primary" type="button">Fresh research</button>
  </div>
</header>

<main>
  <section class="card wide">
    <h2>Waiting for you</h2>
    <div class="wait">
      <div><b>$($openQs.Count)</b><span>open questions</span></div>
      <div><b>$($conclusionsOpen.Count)</b><span>suggestions to decide</span></div>
      <div><b>$($propFiles.Count)</b><span>proposals to approve</span></div>
      <div><b>$discussCount</b><span>project tasks to discuss</span></div>
    </div>
  </section>

  <section class="card wide">
    <h2>Notifications</h2>
    <ul class="notes">$notesHtml</ul>
  </section>

  <section class="card">
    <h2>Schedule</h2>
    <div class="status">
      <span class="pill $(if ($schedState -eq 'Ready') { 'on' } else { 'off' })">$(Enc $schedState)</span>
      <span class="pill">$(Enc $schedDays)</span>
    </div>
    <p class="small muted" style="margin:12px 0 0">Next run: <b style="color:var(--ink)">$(Enc $nextRun)</b><br>Last run: $(Enc $lastRun)</p>
    <p class="small muted">A missed run catches up when the PC is on. Schedule changes are made by the owner.</p>
  </section>

  <section class="card">
    <h2>Quota</h2>
    $quotaHtml
  </section>

  <section class="card wide">
    <h2>Your vision and mission</h2>
    <p class="muted" style="margin-top:0">Write these in your own words. Change them whenever you like. The brain reads them but never changes them. Each Save keeps a backup.</p>
    $editorHtml
    <p class="small muted" id="editor-help" hidden>The saving service is not running. Close this page, double-click <b>Open CEO Brain</b>, and try again.</p>
  </section>

  <section class="card wide">
    <h2>Fresh research</h2>
    <p class="muted" style="margin-top:0">Click the button. It copies one short sentence. Paste it into a Claude chat and the research starts. One research round uses a small, fixed amount of your quota.</p>
    <p class="small muted">The sentence it copies: <b>research chalao</b></p>
    <details>
      <summary>Research files ($(@($researchList).Count))</summary>
      <ul style="margin-top:10px">$researchHtml</ul>
    </details>
  </section>

  <section class="card wide">
    <h2>Latest brief <span class="muted small">($(Enc $briefName))</span></h2>
    <pre>$(Enc $briefText)</pre>
  </section>

  <section class="card">
    <h2>Open questions for you</h2>
    <details open><summary>Show inbox</summary><pre>$(Enc $inbox)</pre></details>
  </section>

  <section class="card">
    <h2>Backlog and pending conclusions</h2>
    <details open><summary>Show backlog</summary><pre>$(Enc $backlog)</pre></details>
  </section>

  <section class="card">
    <h2>Suggestions waiting for your decision</h2>
    $(if ($conclusionsOpen.Count -gt 0) { ($conclusionsOpen | ForEach-Object { "<div class='item'><div class='item-top'><b>$(Enc $_.id)</b><span class='pill'>$(Enc $_.status)</span></div><div>$(Enc $_.text)</div><div class='small muted'>Your action: $(Enc $_.action)</div></div>" }) -join '' } else { "<p class='muted'>Nothing waiting.</p>" })
  </section>

  <section class="card">
    <h2>Questions for you</h2>
    $(if ($openQs.Count -gt 0) { ($openQs | ForEach-Object { "<div class='item'><div class='item-top'><b>$(Enc $_.id)</b></div><div>$(Enc $_.text)</div></div>" }) -join '' } else { "<p class='muted'>No open questions.</p>" })
    <details><summary>Answered earlier ($($answeredQs.Count))</summary><ul class="plain">$(($answeredQs | ForEach-Object { "<li>$(Enc ($_ -replace '^- ',''))</li>" }) -join '')</ul></details>
  </section>

  <section class="card">
    <h2>Proposals waiting for approval</h2>
    $(if ($propFiles.Count -gt 0) { '<ul class="plain">' + (($propFiles | ForEach-Object { $first = Get-Content -Encoding UTF8 $_.FullName | Where-Object { $_ -match '^Status' } | Select-Object -First 1; "<li><b>$(Enc $_.BaseName)</b><div class='small muted'>$(Enc $first)</div></li>" }) -join '') + '</ul>' } else { "<p class='muted'>No proposals waiting.</p>" })
  </section>

  <section class="card">
    <h2>Recent decisions</h2>
    $(if ($recentDecisions.Count -gt 0) { '<ul class="plain">' + (($recentDecisions | ForEach-Object { "<li>$(Enc ($_ -replace '^- ',''))</li>" }) -join '') + '</ul>' } else { "<p class='muted'>No decisions logged yet.</p>" })
  </section>

  <section class="card wide">
    <h2>Project tasks still open ($($openTasks.Count))</h2>
    $(if ($openTasks.Count -gt 0) { $rows = ($openTasks | ForEach-Object { $t = [string]$_.title; if ($t.Length -gt 140) { $t = $t.Substring(0, 140) + '…' }; "<tr><td>$(Enc $_.id)</td><td>$(Enc $t)</td><td><span class='pill'>$(Enc $_.status)</span></td></tr>" }) -join ''; "<div class='scroll'><table><thead><tr><th>ID</th><th>Task</th><th>Status</th></tr></thead><tbody>$rows</tbody></table></div>" } else { "<p class='muted'>No open tasks.</p>" })
    <p class="small muted">Read from tasks.json. Only the owner's decisions move a task to the next status.</p>
  </section>

  <section class="card">
    <h2>How fresh this page is</h2>
    <ul class="plain">$(($freshFiles | ForEach-Object { $f = Get-Item $_.path -ErrorAction SilentlyContinue; $when = if ($f) { $f.LastWriteTime.ToString('dd MMM, HH:mm') } else { 'missing' }; "<li>$(Enc $_.name) <span class='muted small'>· changed $when</span></li>" }) -join '')</ul>
  </section>

  <section class="card wide">
    <h2>Run history and cost</h2>
    $usageHtml
    <p class="small muted">Cost is the API-equivalent figure from the CLI. Subscription quota is shown in the Quota card, from the usage page you enter.</p>
  </section>
</main>

<footer>Local file. Nothing here is sent anywhere. Facts only: labels and sources are in each brief and research file.</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
  // Theme: follow the system by default, remember a manual choice on this device only.
  (function () {
    var root = document.documentElement;
    try { var saved = localStorage.getItem('brain-theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}
    document.getElementById('theme').addEventListener('click', function () {
      var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var current = root.getAttribute('data-theme') || (dark ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('brain-theme', next); } catch (e) {}
    });
  })();

  // Save an owner-written section through the local saving service (only works when the brain window is open).
  document.querySelectorAll('button.save').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-section');
      var note = document.querySelector('[data-note="' + key + '"]');
      var help = document.getElementById('editor-help');
      var text = document.getElementById('f-' + key).value;
      note.textContent = 'Saving…';
      fetch('/save-owner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: key, text: text }) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.ok, msg: j.message }; }); })
        .then(function (res) {
          note.textContent = res.ok ? 'Saved. A backup was kept.' : ('Not saved: ' + res.msg);
          help.hidden = true;
        })
        .catch(function () {
          note.textContent = '';
          help.hidden = false;
        });
    });
  });

  // Fresh research: copy the trigger text, then tell the owner what to do.
  document.getElementById('research').addEventListener('click', function () {
    var text = 'research chalao';
    var toast = document.getElementById('toast');
    var done = function () { toast.textContent = 'Copied. Paste it into a Claude chat to start the research.'; toast.classList.add('show'); setTimeout(function () { toast.classList.remove('show'); }, 3500); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, done); } else { done(); }
  });
</script>
</body>
</html>
"@

Set-Content -Path $out -Value $html -Encoding UTF8
"Wrote $out"
