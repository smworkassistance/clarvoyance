# Backlog

One list for every idea, sub-project, and task that the brain has raised or the owner has named. Each item has an ID, a status, and a date.

Statuses: `new` · `discussing` · `approved` · `parked` · `rejected` · `done`

Limits: at most 3 items with status `approved` that are sub-projects at the same time. Items older than 7 days with status `new` go to the weekly clear-out list.

## Open items from the 2026-10-05 discussion

| ID | Item | Type | Status | Notes |
|----|------|------|--------|-------|
| B-001 | Write `brain/project-brain.md` with the owner (vision, mission, success measures) | sub-project | discussing | Vision and mission are owner-written. The brain only asks questions. |
| B-002 | Fill `brain/owner-model.md` through the interview | sub-project | discussing | Starts with 5-6 questions in `inbox/questions.md`. |
| B-003 | Daily 06:00 background pass on Windows Task Scheduler | task | approved | Owner asked for it. Needs the PC on at 06:00. Job created by the build step. |
| B-004 | Check whether the Claude mobile app can reach this project's files (Claude Code / Remote Control) | task | new | Owner to check in the app. Old sessions visible in the app are not verified to be related. |
| B-005 | Create a read-only data key for business numbers (Supabase) | task | new | Needed before the "Numbers" section of a brief can be filled. Owner creates it; the brain never creates or stores service keys. |
| B-006 | Telegram messenger bot (briefs out, replies into inbox) | sub-project | parked | Needs a BotFather token from the owner. Build after the file-based loop has run for two weeks. |
| B-007 | Private console page (Artifact) for briefs and decisions | sub-project | parked | Consider after the first week of briefs. |
| B-008 | Cloud schedule as a backup when the PC is off | sub-project | parked | Needs the read-only key (B-005) first. |
| B-009 | Weekly clear-out session (proposed Sunday) | task | discussing | Day and time to confirm with the owner. |
| B-010 | Pending: Clarvoyance's own pending work (Google Play, Play Console, owner's own UPI ID for upgrades, T-101 Gemini gate, etc.) | reference | discussing | Tracked in `tasks.json` and `docs/RUNLOG.md`, not duplicated here. The brain reads them as inputs. |
| B-011 | Trim daily-pass context cost: grep large files (`tasks.json`, `docs/RUNLOG.md`) instead of reading them whole; cap per-file read size in the prompt | task | new | Caused a $1.62/$1-cap failure with 0 output on 2026-10-05 (`brain/logs/2026-10-05_0349.json`). See proposal `brain/proposals/2026-10-05-trim-daily-pass-context-cost.md`. |
| B-012 | Set the real UPI ID in `pricing/plans.json` `billing.upi_id` (currently null) | task | new | Zero-cost blocker found 2026-10-05 pass 2: T-109's manual upgrade flow is DONE and live, but no member can complete an upgrade until this field is real. Owner action only. |
| B-013 | Hold Razorpay (T-106) start until real demand is seen via the manual UPI flow (B-012) | task | new | Recommended 2026-10-05 pass 2, matches owner's 2026-10-03 "don't over-engineer before launch" precedent. Needs owner's yes/no (see Q-011). |

## Pending conclusions from the 2026-10-05 session (not yet acted on)

Each row is a conclusion from this session that is still open. "Owner action" is what is needed from you. Nothing here is done unless its status says so.

| ID | Conclusion | Status | Owner action needed |
|----|-----------|--------|---------------------|
| C-01 | Split `CLAUDE.md` (453 KB) into a lean core plus on-demand files (P1) | pending owner yes | Say yes or no. Nothing changes without it. |
| C-02 | Keep only the MCP servers used each week (P3) | pending owner list | Tell me which of Canva, Notion, Gmail, Drive, Asana, Wix, Cloudflare, Supabase, Clarity, Chrome DevTools you use weekly. |
| C-03 | Approve proposal B-011 (grep, not full read, for `tasks.json` and `docs/RUNLOG.md`) | pending owner yes | Say yes or no. Recommended yes. |
| C-04 | Quota ledger: after each brain run, record the usage-page % change in `brain/quota-state.txt` (`brain_week_spent_pct`) | pending owner | After the test run, read the usage page and tell me the new weekly % and brain % change. |
| C-05 | Model routing test: Haiku 4.5 for the light pass vs Sonnet (`optimization-plan.md` B8) | not started | Needs one extra measured run. Decide after C-04. |
| C-06 | Disable or enable the scheduled task (currently DISABLED) | pending owner | Enable only after a test is accepted. |
| C-07 | Interview: owner answers Q-001 to Q-004 (vision, what you enjoy, how you decide, phone access) | pending owner | Answer in chat, a few at a time. |
| C-08 | Read-only Supabase key for the brain (B-005, Q-006) | pending owner | Create it yourself. The brain never handles service keys. |
| C-09 | Check whether Claude mobile app shows Claude Code / Remote Control for this repo (B-004, Q-004) | pending owner | Check in the app and tell me what you see. |
| C-10 | Weekly clear-out day (Sunday proposed) | pending owner | Confirm the day. |
| C-11 | Telegram bot (B-006) and private console page (B-007) | parked | Needs your go-ahead and a BotFather token for Telegram. |
| C-12 | Cloud schedule when the PC is off (B-008) | parked | Needs the read-only key (C-08) first. |
| C-13 | Color psychology: research with evidence strength labels (the example from the discussion) | not started | Ask me to run it. It costs quota, so it waits for the budget. |
| C-14 | Tool comparison for any tool suggestion (four options each) | design only | Applies to every future tool suggestion. No action now. |
| C-15 | Owner-written vision, mission, and success measures in `brain/project-brain.md` | pending owner | The brain will not write these. |
| C-16 | Fix the wrong brief figure (550K vs 181K) | correction recorded in `brain/optimization-plan.md` §0 | None. The brief itself is not edited, to keep the record. |
| C-17 | `docs/CEO-REVIEW-2026-09-28.md` figures (109 users, 62% returning) are 7 days old and unverified | not re-verified | Needs the read-only key (C-08) to refresh. |
| C-18 | Choose the scheduled run time, so it does not eat the session the owner is working in (Q-008) | owner will decide | Asked again around 2026-10-19. |
| C-19 | No web research has been done in the brain or in this session. All market and design claims so far are `[UNVERIFIED]`. | open | Run a bounded research pass after budget allows (C-13, Q-009). |
