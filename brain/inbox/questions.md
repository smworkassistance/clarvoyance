# Inbox — questions for the owner

The brain writes questions here. The owner answers in chat. The next run records the answer in `decisions.md` or `owner-model.md`, then marks the question answered.

Rule: at most 3 new questions per brief. Each question says why it matters.

## Open

**Q-001 (owner model, interview):** When you think about the future of Clarvoyance, what does success look like to you in 12 months — in your own words, not in numbers?
*Why:* the vision section stays empty until the owner writes it.

**Q-002 (owner model):** Which part of building the app do you enjoy most, and which part drains you?
*Why:* decides which work the brain takes off your plate first.

**Q-003 (owner model):** When you decide something big, what do you need to feel sure — data, a trusted person's opinion, or your own gut check after sleeping on it?
*Why:* sets how the brain should present options.

**Q-004 (interface):** Can you open the project from your phone's Claude app and see this repo's files? Open the app and check whether you see a Code option or Remote Control, and tell me what you see.
*Why:* decides whether the phone chat works without extra setup.

**Q-005 (schedule):** The daily run at 06:00 needs this PC switched on. Is your PC normally on at 06:00?
*Why:* if not, the first option becomes the cloud schedule, which needs a read-only data key.

**Q-006 (data):** Are you willing to create a read-only key for the Supabase project for the brain only? It should not be the service key.
*Why:* the brain's business numbers must come from machine data.

**Q-007 (brain cost/process, new 2026-10-05):** `brain/optimization-plan.md` §5 lists 5 concrete decisions (split `CLAUDE.md`, which MCP servers to drop, when to run the first calibration test, the brain's weekly quota budget %, and the schedule days). Can you answer these in one sitting?
*Why:* a test pass today already spent $1.62 against its $1 cap and produced zero output (`brain/logs/2026-10-05_0349.json`), purely from context loading. These 5 decisions are the already-designed fix; nothing new needs researching.

**Q-008 (schedule time, ask on or after 2026-10-19):** The brain's scheduled run is set for 06:00 (Mon/Wed/Fri). The owner will name a better time, one when the session quota is not needed for development. Ask once more around 2026-10-19 and record the answer. Reason: a run uses about 14% of the 5-hour session window, which resets at 06:30, so the run should not eat the session the owner is working in.

**Q-009 (research status):** The 2026-10-05 test run did no web research (0 searches, 0 fetches). Ask whether to run a bounded research pass (for example, color psychology and world-class apps, C-13 in backlog) once the quota budget allows it.

**Q-010 (revenue, new 2026-10-05 pass 2):** Will you share your real UPI ID now, so it can go into `pricing/plans.json` `billing.upi_id`? The manual upgrade flow (T-109) is built and live but cannot complete any upgrade without it.
*Why:* this is the only thing stopping already-finished, already-deployed work from producing real revenue.

**Q-011 (revenue, new 2026-10-05 pass 2):** Should Razorpay (T-106) start now, or wait until real upgrade requests are coming in through the manual flow (after Q-010 is answered)? Recommendation: wait 2-4 weeks and watch `upgrade_requests` first.
*Why:* avoids spending engineering effort on gateway KYC/integration before there is evidence of real paid demand, consistent with your 2026-10-03 call not to over-engineer before launch.

## Answered

- **Q-005 (schedule), answered in part, 2026-10-05:** schedule set to Mon/Wed/Fri 06:00 with catch-up when the PC is on. Still unknown: whether the PC is normally on at 06:00. Not needed now, because missed runs catch up.
- **Q-007 (5 decisions), answered in part, 2026-10-05:** the owner decided item 3 (test now, once), item 4 (brain budget 5%), and item 5 (schedule Mon/Wed/Fri). Items 1 (split CLAUDE.md) and 2 (which MCP servers stay) are still open. See `brain/backlog.md` C-01 and C-02.
