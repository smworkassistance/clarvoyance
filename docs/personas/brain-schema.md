# Brain schema (same for every project)

Use this exact layout in every project, so that the owner learns one system and each project's brain works the same way. Clarvoyance is the first project that uses it. The universal rules are in `ceo-brain.md`. This file describes the files and their fields.

## Folder layout

```
brain/
  Open CEO Brain.bat      double-click: refreshes and opens the page
  build-dashboard.ps1     builds the page from the files below (no AI cost)
  serve-dashboard.ps1     saving service for the page (only owner-marked sections change)
  run-daily-pass.ps1      scheduled run (quota-guarded, logs usage)
  dashboard.html          generated page (do not edit by hand)
  project-brain.md        this project's vision, mission, success, facts, open questions
  owner-model.md          what we know about the owner, with confidence and evidence
  decisions.md            settled decisions, with the owner's words
  backlog.md              all ideas, tasks, and pending conclusions, with status
  quota-state.txt         weekly and session quota, brain budget (entered by the owner)
  usage-log.csv           one line per scheduled attempt (ran, skipped, failed)
  inbox/questions.md      questions for the owner, with answers
  briefs/YYYY-MM-DD.md    one brief per pass
  research/YYYY-MM-DD-*.md  one file per research round, with search and fetch counts
  proposals/YYYY-MM-DD-*.md self-improvement and new-tool proposals, waiting for approval
  prompts/daily-pass.md   scheduled run instructions
  prompts/research-mode.md research round instructions (owner-triggered only)
  history/                backups made before every owner edit
  logs/                   raw output of each run
```

## Owner-written sections (the only ones the page may change)

In `project-brain.md`, each owner-written section sits between two markers:

```
<!-- OWNER:VISION:START -->
...the owner's own words...
<!-- OWNER:VISION:END -->
```

The same pattern is used for `MISSION`, `SUCCESS`, and `FIRSTUSER`. Nothing outside these markers is changed by the page. Every change keeps a backup in `history/`.

## Required fields

**`quota-state.txt`** (one value per line)
- `weekly_used_pct`: whole-account weekly usage, from the usage page.
- `session_used_pct`: current session usage.
- `date`: date of the reading (YYYY-MM-DD). A reading older than 2 days stops scheduled runs.
- `brain_budget_pct`: the brain's share of the week (owner decides).
- `brain_week_spent_pct`: the brain's share used so far this week (owner enters after each run).

**`usage-log.csv`** (written by the script)
- `run_at, status, is_error, duration_ms, num_turns, cost_usd, input_tokens, output_tokens, cache_read`
- `status` is one of: `ran`, `skipped-quota`, `parse-failed`.

**`backlog.md`** (table)
- `ID | Item | Type | Status | Notes`
- Status: `new`, `discussing`, `approved`, `parked`, `rejected`, `done`.

**Briefs** (`briefs/YYYY-MM-DD.md`)
- First three lines: what matters today, readable on a phone.
- Then: vision check, numbers (with source and time), bottleneck, at most 3 questions, research used with labels, parked items.

**Research files** (`research/YYYY-MM-DD-<slug>.md`)
- Question, searches and fetches used (count against the limit), each claim with a label (`[FACT]`, `[INFERENCE]`, `[UNVERIFIED]`, `[SPECULATION]`) and a source with date.

## Notifications (shown on the page, built from the files)

The page's Notifications card is generated from these files. It never sends messages anywhere.
- Open questions waiting for an answer (from `inbox/questions.md`).
- The last run failed, or was skipped to protect quota (from `usage-log.csv`).
- Weekly quota at 50% or more (warning), or 80% or more (alert).
- The brain's own budget is used up.
- The scheduled run is turned off.

## Rules that do not change between projects

- The brain never changes the owner-written sections, the constitution, or the owner's decisions.
- Scheduled runs write only inside `brain/`.
- Research runs only when the owner asks. Each round stays inside its limit.
- Every big decision waits for the owner. Clear-outs are suggested, never done alone.

## Starting a new project

1. Copy the `brain/` folder from Clarvoyance, and empty the project-specific content (`project-brain.md`, `owner-model.md`, `decisions.md`, `backlog.md`, `inbox/`, `briefs/`, `research/`, `proposals/`, `history/`, `logs/`, `usage-log.csv`).
2. Keep the scripts and prompts as they are.
3. Write the owner's vision and mission in the project's `project-brain.md`, between the markers.
4. Double-click `Open CEO Brain.bat`.
