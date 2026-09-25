# BRIEF — <batch name>   (copy to docs/batches/Bn-brief.md and fill in)

> Purpose: give Claude **everything needed to deliver end-to-end without coming back with questions**.
> Claude fills in what it can find in the repo, proposes a **default** for every open item, and asks the owner ONCE.
> Anything left unanswered = the default applies. After the contract freeze there are no more clarification loops.

## 1. Outcome (one paragraph, in the owner's words)
_What should be true when this batch is finished? Who benefits and how do we know it worked?_

## 2. Tasks (one row each)
| ID | Task | Done-when (how to check, ideally measurable) | Depends on | Must be dark-launched? |
|----|------|-----------------------------------------------|------------|------------------------|
|    |      |                                               |            |                        |

## 3. Must NOT change (protected behaviour)
_Screens/flows/data that must stay exactly as-is. Default: everything not listed in Tasks._

## 4. Design / taste
_References (apps/screens), tone, things you dislike. Default: Instagram/YouTube/Facebook-grade, app theme colours, light+dark._

## 5. Decisions Claude needs (each with a recommended default)
| # | Question | Recommended default | Owner's answer |
|---|----------|---------------------|----------------|
|   |          |                     |                |

## 6. Resources & access
| Need | Why | Who provides | Status |
|------|-----|--------------|--------|
| e.g. Supabase SQL run | new table | owner runs file X | BLOCKED-if-missing (rest continues) |
| **E2E testing access** (see `docs/E2E-ACCESS.md`) | Claude tests end-to-end itself; list here anything that must be enabled for THIS batch, with the exact one-line action | owner, only if not already standing | check at intake, not mid-run |

## 7. Constraints
Budget / cost ceiling: ____   Time box for the run: ____ h   Devices/browsers that matter: ____
Data/privacy rules: ____

## 8. Rollout
Dark launch flag name: ____   Who turns it on and when: ____   Rollback trigger: ____

## 9. Sign-off
Owner: "approved" (or edits) on ____.   → Claude freezes the contract and starts the run.
