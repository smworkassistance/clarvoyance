# Proposal — trim daily-pass context cost

Status: waiting for owner confirmation. Not implemented.

## Problem
A daily-pass test run on 2026-10-05 spent $1.62 against its $1 budget cap and produced **zero** web searches and **zero** brief before being cut off (`brain/logs/2026-10-05_0349.json`: `error_max_budget_usd`, 6 turns, ~550K cache-creation tokens). The spend was almost entirely context loading, not research or writing. This matches the root cause already identified in `brain/optimization-plan.md` §0 ("the brain's cost is almost entirely context, not research").

This pass (2026-10-05, this run) avoided the same failure only by deliberately reading `tasks.json` and `docs/RUNLOG.md` with targeted `Grep`/offset `Read` calls instead of reading them whole — an improvised workaround, not something the prompt currently instructs.

## Evidence
- `brain/logs/2026-10-05_0349.json` — the failed run, cost and token breakdown.
- `brain/optimization-plan.md` §0 — same root cause, already measured by the owner before today's failure.
- `tasks.json` in this repo holds 113+ tasks, several with multi-entry `history` arrays — large enough that a full read is a plausible single cause of the 550K-token cache creation.
- `docs/RUNLOG.md` is append-only and grows every promotion (currently ~90 lines, growing).

## Proposed change
Add one line to `brain/prompts/daily-pass.md`'s "Context rule (cost)" section:
> For `tasks.json` and `docs/RUNLOG.md`: do not read the whole file. Use `Grep` for specific task IDs or `status` values, or read only the last ~30 lines of `RUNLOG.md`, unless a specific earlier entry is needed.

This is a wording change to an existing rule, not a new mechanism — it closes the gap between what the prompt says ("read only what the pass needs") and what actually happened (a full read of a large file).

## Risk
Low. The rule only narrows how two specific files are read; it does not remove any required reading. Risk is that a future pass misses an older RUNLOG entry it needed — mitigated by explicitly allowing a targeted deeper read when a specific entry is named.

## Trial plan (two weeks)
1. Add the line above to `daily-pass.md` (owner confirms first).
2. Run the next scheduled/manual pass and record its cost in `usage-log.csv` as today's run did.
3. Compare cache-creation tokens against today's 550K baseline.
4. After two passes, report back: did cost drop, and did any brief show signs of a missed RUNLOG/tasks.json detail. Keep the change if cost drops and quality holds; revert if either fails.
