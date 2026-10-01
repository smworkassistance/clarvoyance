# CEO Review — 2026-09-28

One page, grounded in real pulled data, ending in one recommended next action — not a menu.
Template for future reviews; see `docs/batches/B9.md` (T-074).

## Dev status (from `tasks.json`/`docs/RUNLOG.md` — mechanical, no new work)
- **v253 is live**: weekly leagues, notifications, fast video (player pool, MP4-first, native swipe), fresh feed, Guides content pipeline. 250+ shipped versions with a real batch → verify → promote → rollback discipline.
- Dev process itself is mature and durable (this session closed the last real gaps: `docs/MACHINE-SETUP.md`, `ADK-Starter-Kit/`).

## Real usage signal (Microsoft Clarity, last 30 real days — pulled live, not assumed)
- **109 unique users, 331 sessions** (~3 sessions/user over 30 days)
- **62% of sessions are from RETURNING users** (192 mobile + 14 desktop of 331) — with **zero marketing spend**. This is a genuine, organic retention signal — the product holds people on its own.
- Avg engagement 3.9 min/session, 1.5 pages/session — matches the app's own "under 2 minutes, daily check-in" design intent; not a red flag, it's working as designed.
- 125 of 331 sessions (38%) are new — **acquisition, not retention, is the current bottleneck.**

## Monetization — the real gap
- `feature_gates` is live and correctly enforced: free = 20 msgs/day, premium = 500/day, real cost ≈ ₹0.15/message (confirmed v182).
- `user_profile.subscription_tier` exists, defaults `'free'` — but **no payment integration exists anywhere in the codebase.** Nobody can become a paying user even if they want to, today.
- Given the 62% organic retention above, this is the single highest-leverage missing piece: real people are already coming back on their own, and there is currently no way to turn that into revenue.

## Market scan (2026, AI companion / self-development apps)
- Industry-standard price point: **~$9.99/month** single tier is the norm; tiered setups run Pro $9-15 / Premium $25-30. ([Track360](https://track360.io/blog/ai-companion-app-monetization-models-subscription-vs-token-2026), [Thrad](https://www.thrad.ai/content/ai-app-monetization-case-studies-2026))
- **Companion apps convert far better than generic freemium**: ~25% free→paid among *engaged* users, vs. 2-5% for freemium generally — and Clar's own 62% returning-session rate is exactly the "engaged" segment this stat is about. ([Coherent Lab](https://www.coherentlab.com/blog/ai-app-monetization-strategies))
- Cheap solo-founder acquisition (organic content/community/ASO) runs **<$50 CAC** but compounds over 6-12 months; paid ads (the HeyGen/Meta idea discussed earlier) are a real lever, but the CAC math only works once there's a monetization path to recover that spend. ([ScreenFast](https://screenfast.app/blog/indie-ios-app-marketing-strategy-2026), [ApsteQ](https://apsteq.com/blog/indie-app-marketing/))

**Reading the two together**: Clar already has the retention a companion app needs to hit that 25% conversion number. Spending on paid acquisition *before* a way to charge exists means paying to grow a free product.

## Process friction found this cycle
1. Local machine setup (MCP servers, Chrome debug profile, tokens) had no durable record — fixed (`docs/MACHINE-SETUP.md`).
2. The ADK's own "reuse this in another project" path existed only as a manual checklist in `ops/README.md`, not a ready-to-copy folder — fixed (`ADK-Starter-Kit/`).
3. A test script silently overwrote a committed file when a `cd` into a scratch folder failed under memory pressure (bash doesn't stop on a failed `cd` by default) — caught and fixed same session; going forward, scripts of mine should `cd X || exit 1`, not continue blind.


## New tools/MCPs worth knowing about
- **Supabase MCP** (official, read-only mode via `read_only=true`) — registered, but still holds the literal placeholder text as its token; needs your real Supabase Personal Access Token swapped in (`docs/MACHINE-SETUP.md` has the safe staged-variable command).
- **Cloudflare Observability MCP** (official) — registered, needs a one-time `/mcp` login (OAuth, can't be done from this non-interactive session).
- No compelling case yet for a heavier multi-agent framework (CrewAI/AutoGen/etc.) — the existing batch/verify/promote discipline already covers what those add, with far less complexity for a one-owner project.

## Recommendation (one, not a menu)
**Build the payment path (Razorpay or similar) before spending anything on paid user acquisition.** Real data supports this order: 62% organic retention already proves the product holds people; nothing currently converts that into revenue; and companion apps convert unusually well (25% among engaged users) once a real price point exists. Concrete next batch: Razorpay checkout → webhook → set `subscription_tier` via the existing `admin-relay-worker.js` pattern → the usage gate is already built (`feature_gates`). Everything else (HeyGen ads, growth pushes) makes more sense once this exists.

**Owner steps this needs**: a Razorpay (or equivalent) account, and a price-point decision — the market data above points to a single ~$9.99/mo-equivalent tier (≈₹800-900/mo) as the simplest v1.
