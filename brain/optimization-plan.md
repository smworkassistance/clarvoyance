# Optimization plan — brain and whole process

> Goal: get the most useful thinking and development out of the weekly Claude quota, without the brain or the development work starving each other.
> Status: plan. Items marked **DONE** are already in the files. Items marked **OWNER** need your approval before anything changes.

## 0. Facts we measured (2026-10-05)

| Fact | Number | Source |
|------|--------|--------|
| Test brain run, context loaded (cache creation) | ~181,000 tokens | `brain/logs/2026-10-05_0349.json` |
| Test brain run, cost (API-equivalent) | $1.62, cap was $1.00 (cap checked after each turn) | same log |
| Test brain run, research done | 0 web searches, 0 brief written | same log |
| `CLAUDE.md` size | 453 KB | file size |
| `docs/` total size | 238 KB | file size |
| Test brain run 2 (after the repo-outside + no-MCP change, forced once) | cost about $0.92, 43 turns, 5m47s, cache read 957,885, cache creation 79,156, output 22,662, web searches 0, one Bash call denied by the prompt rules | `brain/usage-log.csv`, `brain/logs/2026-10-05_0411*.json` |
| Note on run 2 | The brain's own brief said "550K cache creation" for run 1. The real figure for run 1 is 181K (see `brain/logs/2026-10-05_0349.json`). The brief is wrong on this point. | correction by Claude, 2026-10-05 |
| Weekly quota used | 66%, reset Tuesday 23:30 | owner's usage screenshot |
| Session quota used | 29%, reset 06:30 | owner's usage screenshot |
| Usage credits | $0, off | owner's usage screenshot |

**The main finding:** the brain's cost is almost entirely context, not research. The same is true for every development session in this repo, because `CLAUDE.md` is loaded every time.

## 1. Brain runs (scheduled and manual)

| # | Action | Effect | Status |
|---|--------|--------|--------|
| B1 | Run from a folder outside the repo (`clar-brain-runner`), with `--add-dir` for the repo | The repo's `CLAUDE.md` is not auto-loaded | **DONE** (script), needs a real test |
| B2 | `--strict-mcp-config` with no MCP config | No MCP tool schemas sent on each run | **DONE** (script), needs a real test |
| B3 | Quota guard: skip unless the owner records the weekly % within 2 days and it is below 50% | No run spends quota when the week is already heavy | **DONE**, verified: 66% skipped with no spend |
| B4 | Usage log row for every attempt (ran, skipped, parse-failed) | Spend per run is visible without effort | **DONE** |
| B5 | Prompt context rule: read only listed files, search for sections | Fewer tokens read per run | **DONE** |
| B6 | Prompt quota budget: 5 searches, 3 fetches, one pass, follow-up becomes a question | Research stays bounded | **DONE** (soft limit) |
| B7 | Weekly schedule: Mon, Wed, Fri at 06:00, missed runs catch up | 3 runs a week, not daily | **DONE**, task is **disabled** until the first real test |
| B8 | Model choice for brain runs: test Haiku 4.5 for the light pass, keep Sonnet for the weekly deep pass | Cheaper daily pass, same quality on routine checks | Plan (test needed, see §4) |
| B9 | Output discipline: brief ≤ 1 page, top 3 lines for phone, questions ≤ 3 | Less output tokens per run | **DONE** (in `ceo-brain.md`) |
| B10 | Deep research (tree, backcasting) only when the owner approves | Big research is a choice, not a default | **DONE** (in prompt follow-up rule) |

**Expected brain budget after these steps:** a light pass should cost far less than the 181k-token test. The real number is unknown until one measured run (see §4).

## 2. Whole development process (biggest lever)

| # | Action | Effect | Who |
|---|--------|--------|-----|
| P1 | Split `CLAUDE.md` (453 KB) into a lean core (about 15 KB: identity, rules, pointers, current state) and on-demand files (`docs/VERSION-HISTORY.md`, `docs/ARCHITECTURE.md`, and so on). Sessions read the core and grep the rest. | Every dev session loads a fraction of today's context. This is likely the largest saving in the whole project. | **OWNER** (changes the project's source-of-truth file; needs your yes) |
| P2 | Keep `docs/` as an index plus on-demand reads. Do not load `docs/` whole. | Avoids the 238 KB reads | Covered by P1 |
| P3 | Review connected MCP servers. Keep only the ones used this week. Disconnect the rest. The owner has many connected: Canva, Notion, Gmail, Drive, Asana, Wix, Cloudflare, Supabase, Clarity, Chrome DevTools. Each adds tool definitions to context. | Smaller context per session | **OWNER** (you choose which to disconnect) |
| P4 | Session hygiene: one task per session, `/clear` between tasks, reference files by path instead of pasting them | Less accumulated context per session | Owner habit, Claude keeps it short |
| P5 | Keep verification output short: `ops/verify.js` shows failures and a summary, not full logs | Fewer tokens for test output | Claude (code side) |
| P6 | Model routing: Opus only for architecture and hard bugs, Sonnet for routine build and tests, Haiku for mechanical edits | Right model for the job | Owner chooses per session with `/model` |
| P7 | Keep `CLAUDE.md` stable within a session (no mid-session rewrites) | Better prompt-cache hits | Claude |

## 3. Owner time (the scarcest resource)

| # | Action | Effect |
|---|--------|--------|
| O1 | One 20-minute weekly session (Sunday or Monday) to answer all inbox questions and clear the backlog | Fewer back-and-forth turns, fewer tokens per decision |
| O2 | Answer inbox questions in one message, numbered | Brain can record them in one pass |
| O3 | Use the phone for decisions and chat; use the desktop for heavy development | Phone chat is cheap; long builds stay on desktop |

## 4. Measurement and calibration

1. **After Tuesday's reset (weekly 0%):** enter the new % in `brain/quota-state.txt`, then run **one** test pass manually.
2. Read the new row in `brain/usage-log.csv` (cost, cache creation, output tokens).
3. Read the usage page before and after: the % change is the real quota cost. Record it in `brain/decisions.md`.
4. Compare Sonnet and Haiku on the same light pass: check brief quality by reading both. Keep the cheaper one only if quality holds.
5. Repeat the same benchmark after P1 (CLAUDE.md split) to measure the saving for development sessions too.

**Targets (to confirm after the first measurement):**
- Brain uses at most 5% of the weekly quota (owner decision, 2026-10-05).
- A light pass costs well under the 181k-token test.
- Dev sessions load a fraction of today's context after P1.

## 5. Decisions needed from the owner

1. **P1:** approve splitting `CLAUDE.md` into a lean core plus on-demand files? (Biggest saving. Claude will keep every rule; nothing is deleted, only moved.)
2. **P3:** which MCP servers do you use weekly? Disconnect the rest.
3. **Test timing:** DECIDED by owner: test now, once, with the quota guard bypassed by `-Force`. Later tests should run after the weekly reset (Tuesday 23:30) when possible.
4. **Brain weekly budget:** DECIDED by owner: 5% of the weekly quota.
5. **Schedule:** DECIDED by owner: Mon/Wed/Fri at 06:00 on this PC, catch-up enabled.
- **Still open:** item 1 (CLAUDE.md split, P1) and item 2 (which MCP servers to keep).

## 6. Risks and how we handle them

| Risk | Handling |
|------|----------|
| Brain takes quota from development | Quota guard (50% limit), weekly budget target, usage-log |
| Context split loses a rule | Move, do not delete; a checklist confirms every rule still exists |
| Cheaper model gives weaker briefs | Side-by-side read before switching (§4 step 4) |
| PC off at 06:00 | Missed runs catch up when the PC is on (StartWhenAvailable) |
| Runs spend more than expected | `--max-budget-usd` as a backstop (API only), quota guard as the real control on subscription, kill switch: disable the task |

## 7. Kill switch and rollback

- Disable the brain: `Disable-ScheduledTask -TaskName 'Clarvoyance CEO Brain Daily'`.
- Re-enable: `Enable-ScheduledTask -TaskName 'Clarvoyance CEO Brain Daily'`.
- Stop all brain spend immediately: set `weekly_used_pct` in `brain/quota-state.txt` to 100 (the guard then skips every run).
- Revert the context split: restore `CLAUDE.md` from git (`git checkout -- CLAUDE.md`) if P1 is ever rejected after commit.

## 8. Review cadence

- **Weekly (with the clear-out session):** read `usage-log.csv`, update `quota-state.txt`, decide whether the brain stays on.
- **Monthly:** review targets, check MCP list, check whether the lean core still reads well.
