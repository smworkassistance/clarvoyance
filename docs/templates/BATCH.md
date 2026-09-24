# BATCH CONTRACT — Bn   (frozen <date/time IST>, scope hash <first 12 chars>)

> Written by Claude from the approved brief and frozen with `node ops/tasks.js batch freeze Bn`.
> A run executes **exactly** this. Scope cannot change after freeze; new ideas become `PROPOSED` tasks, not work.

**Outcome:** …
**Time box:** … h   **Run mode:** dark launch behind flag `…`   **Rollback point:** tag `pre-vN` created at promote.

## Tasks (in dependency order)
| ID | Task | Done-when | Depends on | Files/areas touched | Risk |
|----|------|-----------|------------|---------------------|------|

## Explicitly NOT in this batch
- …

## Owner actions that may appear as BLOCKED (known in advance)
- …

## Verification plan
- Full `node ops/verify.js` after every task; candidate file: `clarvoyance_vN.html`.
- Extra checks per task: …

## Promote plan
- Dark: flag `…` default OFF. Promote + push after final verify pass; owner turns the flag on.
