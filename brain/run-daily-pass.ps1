# Runs one background CEO-brain pass headlessly (Claude Code, print mode).
# Scheduled by Windows Task Scheduler on Mon/Wed/Fri at 06:00; if the PC was off,
# Windows runs it the next time the PC is on (StartWhenAvailable). See brain/README.md.
#
# Optimizations:
#  - Runs from a folder OUTSIDE the repo, so the repo's large CLAUDE.md is not auto-loaded.
#    The repo is attached with --add-dir for reading and writing.
#  - --strict-mcp-config with no --mcp-config: no MCP servers, so no MCP tool schemas are sent.
#  - Quota guard: skips the run unless the owner recorded the weekly usage recently and it is below the limit.
#
# Limits:
#  - Tools: read/search/web plus Write/Edit only (no Bash). Writes are restricted to brain/ by the prompt.
#  - Search and fetch counts are capped in the prompt (soft limit; the CLI has no turn cap in this version).
#  - --max-budget-usd applies to API-billed usage only; on a subscription the quota is shared with development.
#  - Every run appends one line to brain/usage-log.csv.

param(
    # Manual test only: skips the quota guard once. The budget cap and logging still apply.
    [switch]$Force,
    # Passed by Task Scheduler. A late start (PC was off at 06:00) asks the owner first instead of running.
    [switch]$Scheduled
)

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$runnerDir = Join-Path $env:USERPROFILE 'clar-brain-runner'
New-Item -ItemType Directory -Force -Path $runnerDir | Out-Null
Set-Location $runnerDir

$logDir = Join-Path $PSScriptRoot 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmm'
$rawFile = Join-Path $logDir "$stamp.json"
$usageCsv = Join-Path $PSScriptRoot 'usage-log.csv'
$quotaFile = Join-Path $PSScriptRoot 'quota-state.txt'
$quotaLimitPct = 50
$quotaMaxAgeDays = 2

# Writes one usage line per attempt, including skipped ones, so the history stays complete.
function Write-UsageRow($row) {
    if (-not (Test-Path $usageCsv)) {
        'run_at,status,is_error,duration_ms,num_turns,cost_usd,input_tokens,output_tokens,cache_read' | Out-File -Encoding UTF8 $usageCsv
    }
    ($row.Values -join ',') | Out-File -Append -Encoding UTF8 $usageCsv
}

$row = [ordered]@{
    run_at        = (Get-Date -Format 's')
    status        = ''
    is_error      = ''
    duration_ms   = ''
    num_turns     = ''
    cost_usd      = ''
    input_tokens  = ''
    output_tokens = ''
    cache_read    = ''
}

# Catch-up rule: if the PC was off and this scheduled run starts more than 60 minutes after 06:00,
# do not run on its own. Ask the owner first (a question in the inbox), and stop.
$slot = Get-Date -Hour 6 -Minute 0 -Second 0
$lateMinutes = ((Get-Date) - $slot).TotalMinutes
if ($Scheduled -and -not $Force -and $lateMinutes -gt 60) {
    $qFile = Join-Path $PSScriptRoot 'inbox\questions.md'
    $existing = [regex]::Matches((Get-Content -Raw -Encoding UTF8 $qFile), 'Q-(\d+)') | ForEach-Object { [int]$_.Groups[1].Value }
    $nextId = 'Q-{0:D3}' -f (([int](($existing | Measure-Object -Maximum).Maximum)) + 1)
    $question = "**$nextId (schedule missed):** The brain's 06:00 run was missed because the PC was off, and it is now $(Get-Date -Format 'dd MMM, HH:mm'). Should it run now? Answer 'run now' in chat if yes, or 'skip' to leave it for the next scheduled day."
    $text = Get-Content -Raw -Encoding UTF8 $qFile
    $text = $text -replace '(?m)^## Answered', ($question + "`r`n`r`n## Answered")
    Set-Content -Path $qFile -Value $text -Encoding UTF8
    $row.status = 'asked-owner'
    Write-UsageRow $row
    "Asked the owner first (catch-up run): $nextId" | Out-File -Encoding UTF8 (Join-Path $logDir "$stamp.txt")
    return
}

# Quota guard: the owner writes the weekly usage % into quota-state.txt (first line: weekly_used_pct=NN, second line: date=YYYY-MM-DD).
$pct = $null
$stateDate = $null
$brainBudget = $null
$brainSpent = $null
if (Test-Path $quotaFile) {
    foreach ($line in Get-Content -Encoding UTF8 $quotaFile) {
        if ($line -match '^weekly_used_pct=(\d+)') { $pct = [int]$Matches[1] }
        if ($line -match '^date=(\d{4}-\d{2}-\d{2})') { $stateDate = [datetime]$Matches[1] }
        if ($line -match '^brain_budget_pct=(\d+)') { $brainBudget = [int]$Matches[1] }
        if ($line -match '^brain_week_spent_pct=(\d+)') { $brainSpent = [int]$Matches[1] }
    }
}
$stale = (-not $stateDate) -or (((Get-Date).Date - $stateDate).TotalDays -gt $quotaMaxAgeDays)
# Skip if: no recent reading, whole-week quota already heavy, or the brain's own weekly budget is used up.
$overWeekly = ($null -eq $pct) -or ($pct -ge $quotaLimitPct)
$overBrain = ($null -eq $brainBudget) -or ($null -eq $brainSpent) -or ($brainSpent -ge $brainBudget)
if (($stale -or $overWeekly -or $overBrain) -and -not $Force) {
    $row.status = 'skipped-quota'
    Write-UsageRow $row
    "Skipped: quota guard (weekly=$pct%, state date=$stateDate, brain budget=$brainBudget%, brain spent=$brainSpent%)." | Out-File -Encoding UTF8 (Join-Path $logDir "$stamp.txt")
    return
}

# The prompt file holds the rules. Today's date and the repo path are added so paths are absolute.
$prompt = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'prompts\daily-pass.md')
$prompt = $prompt + "`n`nRepository root (all paths in this prompt are relative to it): $repo`nToday's date (use this for file names): " + (Get-Date -Format 'yyyy-MM-dd')

# dontAsk: anything not in --allowedTools is denied instead of waiting for input (there is no one to answer).
& claude -p $prompt `
    --add-dir $repo `
    --strict-mcp-config `
    --permission-mode dontAsk `
    --allowedTools "Read Glob Grep WebSearch WebFetch Write Edit" `
    --max-budget-usd 1.00 `
    --output-format json *> $rawFile

$resultText = ''
try {
    $json = Get-Content -Raw -Encoding UTF8 $rawFile | ConvertFrom-Json
    $row.status        = 'ran'
    $row.is_error      = [string]$json.is_error
    $row.duration_ms   = [string]$json.duration_ms
    $row.num_turns     = [string]$json.num_turns
    $row.cost_usd      = [string]$json.total_cost_usd
    $row.input_tokens  = [string]$json.usage.input_tokens
    $row.output_tokens = [string]$json.usage.output_tokens
    $row.cache_read    = [string]$json.usage.cache_read_input_tokens
    $resultText = [string]$json.result
} catch {
    $row.status = 'parse-failed'
}
Write-UsageRow $row
$resultText | Out-File -Encoding UTF8 (Join-Path $logDir "$stamp.txt")
