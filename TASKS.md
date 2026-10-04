# TASKS — clarvoyance task queue

> **Generated file — do not edit by hand.** Source of truth: `tasks.json` (changed only through `node ops/tasks.js …`).
> Process, rules, Definition of Done, rollback: **`docs/PROCESS.md`**. Decisions: **`docs/DECISIONS.md`**. Run history: **`docs/RUNLOG.md`**.
> Rendered 04/10/2026 17:48:42 IST.

## Run status
No run active.

## What the OWNER must do (all BLOCKED items, exact action)
- **T-110** — Owner must: (1) redeploy workers/admin-relay-worker.js into the 'clarvoyance-admin-relay' Cloudflare Worker (same one T-076/T-109 already use), verify via curl -I https://clarvoyance-admin-relay.smworkassistance.workers.dev/ shows X-Worker-Version: v262-r2; (2) confirm RESEND_API_KEY + ADMIN_ALERT_EMAIL secrets are set on that same Worker (Settings -> Variables and Secrets) -- same 2 secrets T-076 needed, may already be set from then.

## Batches
- **B1** — frozen 24/09/2026 04:20:00 IST — 2/2 done: T-002(DONE), T-003(DONE)
- **B2** — frozen 24/09/2026 04:50:00 IST — 1/1 done: T-006(DONE)
- **B3** — frozen 24/09/2026 05:10:00 IST — 1/1 done: T-009(DONE)
- **B4** — not frozen — 1/1 done: T-020(DONE)
- **B5** — frozen 25/09/2026 04:58:07 IST — 9/9 done: T-010(DONE), T-011(DONE), T-012(DONE), T-005a(DONE), T-005b(DONE), T-005c(DONE), T-005d(DONE), T-013(DONE), T-014(DONE)
- **B6** — frozen 25/09/2026 13:45:58 IST — 6/6 done: T-030(DONE), T-031(DONE), T-032(DONE), T-033(DONE), T-034(DONE), T-035(DONE)
- **B7** — frozen 25/09/2026 19:00:11 IST — 0/16 done: T-040(DISCUSS), T-041(DISCUSS), T-042(DISCUSS), T-043(DISCUSS), T-044(DISCUSS), T-045(DISCUSS), T-046(DISCUSS), T-050(DISCUSS), T-051(DISCUSS), T-052(DISCUSS), T-053(DISCUSS), T-054(DISCUSS), T-055(DISCUSS), T-056(DISCUSS), T-057(DISCUSS), T-058(DISCUSS)
- **B8** — frozen 26/09/2026 09:13:10 IST — 12/12 done: T-060(DONE), T-061(DONE), T-062(DONE), T-063(DONE), T-064(DONE), T-065(DONE), T-066(DONE), T-067(DONE), T-068(DONE), T-069(DONE), T-070(DONE), T-071(DONE)
- **B9** — frozen 28/09/2026 09:55:40 IST — 1/3 done: T-072(DONE), T-073(IN_PROGRESS), T-074(DISCUSS)

## Task table

| ID | Added (IST) | Task | Status | Batch | Depends on | Completed (IST) |
|----|-------------|------|--------|-------|------------|-----------------|
| T-001 | 24/09/2026 03:55:00 | Community redesign: feed as first page, Board/Discover/Groups model, video (Bunny vs alternatives), chat (own… | DISCUSS | — | — | — |
| T-002 | 24/09/2026 04:20:00 | Community opens fast: cache own profile + last feed locally, render instantly on open, refresh in background … | DONE | B1 | — | 24/09/2026 05:25:00 |
| T-003 | 24/09/2026 04:20:00 | Feed never empty: an official "Clar" account posts (owner-editable content table) so a brand-new user with ze… | DONE | B1 | — | 24/09/2026 05:31:00 |
| T-004 | 24/09/2026 04:20:00 | Feed-first start page behind a feature flag (`feed_first`, default OFF, % rollout) so returning users' Clar-A… | DISCUSS | — | T-005 ⛔ blocked-by T-005 | — |
| T-005 | 24/09/2026 04:20:00 | Bottom-nav restructure. Owner decisions 2026-09-24: Vibe stays its own tab; Fortune moves INTO the You tab (Y… | DISCUSS | — | — | — |
| T-006 | 24/09/2026 04:50:00 | Video in Community posts (30 s cap) — built on Bunny Stream (originally planned on R2/Stream; owner chose Bun… | DONE | B2 | — | 05:48 (code done) |
| T-007 | 24/09/2026 04:20:00 | Invite friends link + small goal "circles" (3-8 people) for growth loop | DISCUSS | — | — | — |
| T-008 | 24/09/2026 04:20:00 | Fortune theme match (dark cosmic -> app theme, light+dark) | DISCUSS | — | T-005 ⛔ blocked-by T-005 | — |
| T-010 | 24/09/2026 05:52:00 | Fix the dead usage-vs-state correlation: compute it server-side (Supabase function usage_correlation_me) and … | DONE | B5 | — | 25/09/2026 07:21:06 |
| T-009 | 24/09/2026 05:10:00 | Vibe Feed video card feels like Instagram/YouTube: starts by itself (muted autoplay is what mobile browsers a… | DONE | B3 | — | 24/09/2026 05:38:00 |
| T-020 | 25/09/2026 04:49:13 | Infra: get the WebKit (iPhone) lane of the QA gate working, or replace it with a documented equivalent | DONE | B4 | — | 25/09/2026 04:57:46 |
| T-011 | 25/09/2026 04:54:31 | Video upload no longer looks stuck: chunked upload with real progress, background chip (sheet closes at once)… | DONE | B5 | — | 25/09/2026 07:21:05 |
| T-012 | 25/09/2026 04:54:32 | OWNER STEP: run db/schema_v247_usage_correlation_rpc.sql in the Supabase SQL editor (activates T-010) | DONE | B5 | T-010 | 25/09/2026 11:12:31 |
| T-005a | 25/09/2026 04:54:32 | nav_v2 shell behind a flag (default OFF): new 6-button bottom nav (Feed, Vibe, Clar AI raised centre, Goal, H… | DONE | B5 | — | 25/09/2026 07:44:53 |
| T-005b | 25/09/2026 04:54:33 | nav_v2: Feed tab hosts Community as a real tab (nav stays visible) with slim Following / Discover / Board sub… | DONE | B5 | T-005a | 25/09/2026 07:44:53 |
| T-005c | 25/09/2026 04:54:34 | nav_v2: You tab = Profile + entries for Fortune and My Community profile | DONE | B5 | T-005a | 25/09/2026 07:44:54 |
| T-005d | 25/09/2026 04:54:34 | nav_v2: Self becomes a plate under Non-Negotiables on Home (opens the whole Self tab as-is) | DONE | B5 | T-005a | 25/09/2026 07:44:54 |
| T-013 | 25/09/2026 04:54:35 | Promote v247 (dark: nav_v2 OFF by default) with rollback tag and push; confirm the live site serves it | DONE | B5 | T-011, T-010, T-005b, T-005c, T-005d | 25/09/2026 19:00:08 |
| T-014 | 25/09/2026 04:54:35 | Documentation of the release: CLAUDE.md v247 entry, PROJECT.md, RUNLOG, TASKS render, memory | DONE | B5 | T-013 | 25/09/2026 19:00:08 |
| T-030 | 25/09/2026 13:45:57 | You tab hosts the Community me-dashboard (old You), gear opens App Profile, private Fortune card | DONE | B6 | — | 25/09/2026 14:01:26 |
| T-031 | 25/09/2026 13:45:57 | Goal plates split Achievements / Actively working on with per-goal share choice | DONE | B6 | — | 25/09/2026 14:01:27 |
| T-032 | 25/09/2026 13:45:57 | Board card in You opens full Board page | DONE | B6 | — | 25/09/2026 14:01:27 |
| T-033 | 25/09/2026 13:45:57 | Signed-out preview instead of bare gate | DONE | B6 | — | 25/09/2026 14:01:27 |
| T-034 | 25/09/2026 13:45:57 | Reusable design standard doc | DONE | B6 | — | 25/09/2026 14:01:27 |
| T-035 | 25/09/2026 13:45:58 | Final regression on v248 | DONE | B6 | — | 25/09/2026 14:01:27 |
| T-040 | 25/09/2026 19:00:09 | Video card rebuilt policy-compliant and fast | DISCUSS | B7 | — | — |
| T-041 | 25/09/2026 19:00:09 | Video XP each 50% pass with daily cap | DISCUSS | B7 | — | — |
| T-042 | 25/09/2026 19:00:09 | Video like/save/share + signals + topic preference score | DISCUSS | B7 | — | — |
| T-043 | 25/09/2026 19:00:09 | Share a video to feed (inline player) and WhatsApp/native invite | DISCUSS | B7 | — | — |
| T-044 | 25/09/2026 19:00:09 | Referral system | DISCUSS | B7 | — | — |
| T-045 | 25/09/2026 19:00:09 | Admin Clar Posts tab | DISCUSS | B7 | — | — |
| T-046 | 25/09/2026 19:00:09 | Disclaimers | DISCUSS | B7 | — | — |
| T-050 | 25/09/2026 19:00:10 | DB schema for guides and video signals | DISCUSS | B7 | — | — |
| T-051 | 25/09/2026 19:00:10 | Guides pipeline in admin-relay-worker | DISCUSS | B7 | — | — |
| T-052 | 25/09/2026 19:00:10 | Client: create-a-guide, shelf, subscribe, de-dup | DISCUSS | B7 | — | — |
| T-053 | 25/09/2026 19:00:10 | Guide post card in Feed | DISCUSS | B7 | — | — |
| T-054 | 25/09/2026 19:00:10 | Languages | DISCUSS | B7 | — | — |
| T-055 | 25/09/2026 19:00:10 | Signals -> guide suggestions | DISCUSS | B7 | — | — |
| T-056 | 25/09/2026 19:00:10 | Admin guide moderation | DISCUSS | B7 | — | — |
| T-057 | 25/09/2026 19:00:10 | End-to-end verification and docs | DISCUSS | B7 | — | — |
| T-058 | 25/09/2026 19:00:10 | Promote v250 | DISCUSS | B7 | — | — |
| T-060 | 26/09/2026 09:13:08 | Video upload fixed with real Bunny proof, background upload | DONE | B8 | — | 26/09/2026 11:28:25 |
| T-061 | 26/09/2026 09:13:08 | Sound on all three devices (Android WebView, Chrome, iPhone tap-for-sound pill) | DONE | B8 | — | 26/09/2026 11:28:25 |
| T-062 | 26/09/2026 09:13:09 | YouTube: true aspect, no black borders, 2-player pool for fast start | DONE | B8 | — | 26/09/2026 11:28:25 |
| T-063 | 26/09/2026 09:13:09 | Clar Reels: instant own-hosted stock clips with real quote | DONE | B8 | — | 26/09/2026 11:28:25 |
| T-064 | 26/09/2026 09:13:09 | Swipe on the video itself (scroll-snap players) | DONE | B8 | — | 26/09/2026 11:28:26 |
| T-065 | 26/09/2026 09:13:09 | Feed Bunny videos start fast (MP4 first, prefetch, poster until playing) | DONE | B8 | — | 26/09/2026 11:28:26 |
| T-066 | 26/09/2026 09:13:09 | Guides: text posts and video posts separated | DONE | B8 | — | 26/09/2026 11:28:26 |
| T-067 | 26/09/2026 09:13:09 | Post time on every post | DONE | B8 | — | 26/09/2026 11:28:26 |
| T-068 | 26/09/2026 09:13:09 | Feed always fresh + pull-to-refresh | DONE | B8 | — | 26/09/2026 11:28:26 |
| T-069 | 26/09/2026 09:13:10 | Board becomes weekly leagues | DONE | B8 | — | 26/09/2026 11:28:26 |
| T-070 | 26/09/2026 09:13:10 | Notifications (activity) screen | DONE | B8 | — | 26/09/2026 11:28:26 |
| T-071 | 26/09/2026 09:13:10 | Verify, document, publish v253 | DONE | B8 | T-060, T-061, T-062, T-063, T-064, T-065, T-066, T-067, T-0… | 26/09/2026 11:28:43 |
| T-072 | 28/09/2026 09:55:39 | Machine-setup & dependency audit | DONE | B9 | — | — |
| T-073 | 28/09/2026 09:55:39 | ADK Starter Kit (day-1 ready framework for new projects) | IN_PROGRESS | B9 | — | — |
| T-074 | 28/09/2026 09:55:39 | First CEO-Review pass + recurring-cadence template | DISCUSS | B9 | — | — |
| T-075 | 28/09/2026 17:04:25 | Full account-delete flow (not just Community 'delete profile') | DONE | — | — | 01/10/2026 21:55:29 |
| T-076 | 01/10/2026 01:04:11 | Admin email alert on AI (Gemini) failure via Resend - covers Guides (server-side) and Chat/Fortune/Pulse (cli… | DONE | — | — | 01/10/2026 21:55:29 |
| T-077 | 01/10/2026 01:04:18 | Guides retry-storm fix: on run failure, back off (3h -> 6h -> 12h -> 24h cap) instead of the current fixed 3h… | DONE | — | T-076 | 01/10/2026 21:55:30 |
| T-078 | 01/10/2026 01:04:26 | Resolve BusyChat vs Default Gemini Project key confusion: confirm which Google AI Studio project's API key co… | DROPPED | — | — | — |
| T-079 | 01/10/2026 01:04:33 | Guides monetization split: universal/starter guides free (unlimited browse+follow), personal/private guides (… | DISCUSS | — | — | — |
| T-080 | 01/10/2026 01:04:41 | World-class UX/UI pass (Apple/Meta-standard): glassmorphism over boxy cards, proper elevation/blur, WCAG-safe… | DISCUSS | — | — | — |
| T-081 | 01/10/2026 01:39:49 | Pricing/monetization strategy research (XP-gated mid tier + real-payment top tier + institutions/B2B angle) -… | DISCUSS | — | — | — |
| T-082 | 01/10/2026 01:39:49 | Ad-supported / creator-guide monetization research (Google ads in feed/Vibe/Shorts, hundreds of guides as con… | DISCUSS | — | — | — |
| T-085 | 01/10/2026 03:03:24 | Build the chosen pricing/monetization model (AdSense-style ads OR direct monetization/subscription, whichever… | DISCUSS | — | T-081, T-082 ⛔ blocked-by T-081,T-082 | — |
| T-084 | 01/10/2026 03:03:35 | Implement the world-class UX/UI redesign once the research (docs/PLANNER.md #2) is complete and precise - the… | DISCUSS | — | T-080 ⛔ blocked-by T-080 | — |
| T-086 | 01/10/2026 18:11:56 | UX/UI wave 4: Vibe Feed, Fortune, and remaining Community (Board/Discover/plain posts) glass/visual pass | DONE | — | T-084 ⛔ blocked-by T-084 | 01/10/2026 19:07:05 |
| T-087 | 01/10/2026 18:11:56 | Run full ops/verify.js Playwright regression suite against v255/v256/v257 candidates before any promotion dec… | DONE | — | — | 01/10/2026 18:26:25 |
| T-088 | 02/10/2026 00:43:27 | Real AI cost model: log every Gemini call site (chat, Fortune, Pulse, video-topic writer, desire extraction, … | DISCUSS | — | — | — |
| T-089 | 02/10/2026 00:43:28 | Gemini cost cuts: explicit prompt caching of the shared system prompt, route cheap background jobs to a Flash… | DONE | — | — | 02/10/2026 03:26:47 |
| T-090 | 02/10/2026 00:43:28 | Target + paying audience plan: country/language priorities from real data (Clarity country, per-country fake-… | DISCUSS | — | — | — |
| T-091 | 02/10/2026 00:43:28 | Any-language support: Clar replies in user's language (already partly), UI i18n for top languages, Guides laz… | DISCUSS | — | — | — |
| T-092 | 02/10/2026 00:43:28 | Free content-source stack (beyond Pixabay/Pexels/Wikiquote): Openverse, Wikimedia Commons, Pexels video, Free… | DISCUSS | — | — | — |
| T-093 | 02/10/2026 00:43:28 | Never-empty app: infinite personalised content from labelled AI/Clar sources (Guides, official Clar posts, qu… | DISCUSS | — | — | — |
| T-094 | 02/10/2026 00:43:28 | AI-generated personal chargers + manifestation furnace: per-user generated affirmation/charger variants from … | DISCUSS | — | — | — |
| T-095 | 02/10/2026 00:56:37 | Audio layer: LibriVox/Internet Archive public-domain self-development audiobooks, podcast discovery (Podcast … | DISCUSS | — | — | — |
| T-096 | 02/10/2026 00:56:38 | Personal library: NO unofficial Audible/Kindle access (no public API, ToS/account/store risk); instead user-e… | DISCUSS | — | — | — |
| T-097 | 02/10/2026 00:56:38 | YouTube quota hardening: curated channel RSS feeds per topic (0 quota), search only for discovery, per-user c… | DISCUSS | — | — | — |
| T-098 | 02/10/2026 02:11:58 | YouTube quota ceiling: find a real solution before growth (central theme of the app). Leads: playlistItems.li… | DISCUSS | — | — | — |
| T-099 | 02/10/2026 02:11:58 | AI model mixing: tier A/B/C routing per call site (docs/AI-MODELS.md), eval harness on real-style inputs acro… | DISCUSS | — | — | — |
| T-100 | 02/10/2026 03:38:00 | XP economy made trustworthy before it is money: server-side XP ledger (earn caps/day, anti-farming, spend led… | DISCUSS | — | — | — |
| T-101 | 02/10/2026 03:38:01 | Entitlements + enforcement: plans table (config-driven), entitlement checked server-side; Gemini proxy must v… | DISCUSS | — | — | — |
| T-102 | 02/10/2026 03:38:01 | Plan test before charging: onboarding XP grant / 7-14 day reverse trial, Plus Rs99 + Pro Rs199 fake-door per … | DISCUSS | — | — | — |
| T-103 | 02/10/2026 05:28:40 | Community XP: capped daily XP for post, cheer, follow, comment, supporting others (counts toward the XP disco… | DISCUSS | — | — | — |
| T-104 | 02/10/2026 05:28:40 | Private guide interaction rule: an own guide keeps posting only while the member interacts (read/like/save/pr… | DONE | — | — | 04/10/2026 17:48:41 |
| T-105 | 02/10/2026 05:28:40 | Landing page rollout: owner reviews landing/ (copy + design), decide public URL (clar.co.in root vs /landing)… | DISCUSS | — | — | — |
| T-106 | 02/10/2026 05:28:40 | Razorpay: account + KYC (owner), webhook Worker writing subscriptions/payments with service_role, checkout_ur… | DISCUSS | — | — | — |
| T-107 | 03/10/2026 04:43:21 | In-app delete-account feedback screen: before the DELETE confirm (v255 flow), a short kind feedback screen (r… | DONE | — | — | 03/10/2026 16:36:16 |
| T-108 | 03/10/2026 05:13:09 | Admin notifications for landing submissions: email (and/or push) to the owner the moment a new Ask-Clar lead,… | DISCUSS | — | — | — |
| T-109 | 04/10/2026 01:46:25 | Manual UPI upgrade-request flow (no payment gateway yet): member submits plan+UTR+note in-app, owner approves… | DONE | — | — | 04/10/2026 17:01:48 |
| T-110 | 04/10/2026 17:21:55 | Admin email alerts for new upgrade requests, feedback (landing + account-delete), leads, and scholarship appl… | BLOCKED | — | — | 04/10/2026 17:21:55 |

## Task details (acceptance + result evidence)

### T-001 — Community redesign: feed as first page, Board/Discover/Groups model, video (Bunny vs alternatives), chat (own vs service), tab layout (Clar AI / Vibe / Fortune placement), ClarZone<->Community blending, faster Community open
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: Discussion agreed with owner; then split into separate T-rows with their own Done-when
- Result / evidence: Research + discussion in progress; nothing to build yet

### T-002 — Community opens fast: cache own profile + last feed locally, render instantly on open, refresh in background (stale-while-revalidate); prefetch after auth resolves; drop the serial 1.5s `_isGoogleUser` wait when a cached session flag exists
- Status: **DONE**  · Batch: B1  · Depends on: —
- Done-when: In real Chrome (isolated context, disposable account): (a) 2nd open shows feed content with no skeleton within 300 ms of tap, measured by performance.now(); (b) cold-open time before vs after recorded in Result; (c) signed-out user still sees the sign-in gate; (d) console errors = 0; (e) after background refresh, new post appears without reopening
- Result / evidence: Measured in real Chrome (isolated ctx, disposable anon account, Fast 4G throttle, same harness on old v245 vs v246): OLD open-to-content 1288 / 1326 / 1941 ms; NEW warm open 35 / 96 / 35 ms (cache); NEW first-ever open (no cache) 1812 ms. Also verified: signed-out still gets the sign-in gate even with cache present; a different account's cache is NOT used (skeleton then normal load); a new post inserted after the cache was written shows up via background refresh with no reopen (first paint didn't have it, 3.5 s later it did); console errors = 0; all 48 script blocks parse. Cache is per-uid (`clv_soc_cache_v1`), cleared on profile delete, dropped on follow/new post.

### T-003 — Feed never empty: an official "Clar" account posts (owner-editable content table) so a brand-new user with zero follows still sees real posts
- Status: **DONE**  · Batch: B1  · Depends on: —
- Done-when: New account with 0 follows sees >=1 post labelled "Clar" (verified in real Chrome); Clar posts cannot be liked-as-impersonation of a real user; posts editable without code; SQL file written + parse-checked
- Result / evidence: CODE DONE + tested. Verified in real Chrome (390x844): (a) with the table NOT yet migrated (today's real production state) the feed works, 0 Clar cards, no error; (b) with the table mocked (7 posts) a user with 2 real posts sees 2 real + 4 Clar cards (fills to 6), newest Clar post on top, "Official" chip on each, NO Like/Comment on Clar cards, CTA buttons correct (chat/vibe/goal), HTML/script in a post title is escaped (no injected img); (c) tapping "Talk to Clar" closes Community and lands on the Clar AI tab, "Try a Vibe card" lands on Vibe; SQL parsed OK by the real Postgres parser (libpg-query, 10 statements) but NOT executed. Also fixed a pre-existing layout bug: the "What's on your mind?" pill overflowed the right edge (width:100% + 16px margins). OWNER STEP: run db/schema_v246_clar_posts.sql in the Supabase SQL editor (creates table + RLS + grants + 7 starter posts; idempotent). Then Clar posts appear by themselves, editable in Table Editor (title/message/active).

### T-004 — Feed-first start page behind a feature flag (`feed_first`, default OFF, % rollout) so returning users' Clar-AI-first habit is not broken for everyone at once
- Status: **DISCUSS**  · Batch: —  · Depends on: T-005
- Result / evidence: Needs nav layout decision (T-005) first. Big product bet: Clar AI is the current start tab by design

### T-005 — Bottom-nav restructure. Owner decisions 2026-09-24: Vibe stays its own tab; Fortune moves INTO the You tab (You already has usage + status); Home's NN/quests are NOT moved into You. Proposed 6 tabs: Feed / Vibe / Clar AI (raised centre button) / Goal / Home / You. Owner 2026-09-24: Self becomes a plate under Non-Negotiables on Home, tap opens the whole Self tab as-is. Board + Discover become top sub-tabs inside Feed (Following / Discover / Board); Community's inner "You" merges into main You tab
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Result / evidence: DECIDED 2026-09-24: Clar AI = raised centre nav button (still a real tab, no chat-code refactor). Feed sub-tabs (Following/Discover/Board) must be slim and not change the feed's current look

### T-006 — Video in Community posts (30 s cap) — built on Bunny Stream (originally planned on R2/Stream; owner chose Bunny 2026-09-25)
- Status: **DONE**  · Batch: B2  · Depends on: —
- Done-when: Worker + SQL + client built and syntax-checked; upload/playback flow tested against a mocked Worker in real Chrome (no real key yet); status set BLOCKED with exact steps: (1) Cloudflare Stream enabled, (2) Account ID + API token (Stream:Edit) as Worker secrets, (3) run SQL, (4) deploy Worker
- Result / evidence: BUILT FOR BUNNY STREAM (Claude's recommendation; owner had not chosen — R2 would need a different Worker, client unchanged except the upload step). ALL PREPARED + TESTED WITHOUT REAL KEYS: (1) Worker `workers/bunny-relay-worker.js`: 20/20 isolated tests with every outside call mocked — no token 401, anonymous session 403, >100MB 413, >35s 400, unknown action 400, no side effects on rejected calls, signature = sha256(lib+key+expire+guid) verified, API key never in a response, ledger row per member, CORS only for allowed origins, 11th upload/24h -> 429, OPTIONS 204, GET 405. (2) SQL `db/schema_v246_video.sql` parsed OK by the real Postgres parser (21 statements) — NOT executed. (3) Client in real Chrome (390x844) against local mocks of Worker+TUS+CDN: video button hidden while unconfigured (nothing changes for anyone until the owner configures it); with mocks: pick file -> preview with duration; too-long video refused with message; non-video refused; Post -> Worker called with Bearer, real tus-js-client uploaded 1128375/1128375 bytes with the signed headers, insert payload = {message, images:[], video:{guid,duration}} (no `video` key at all on ordinary posts, so unmigrated projects keep working); feed shows a poster card with play badge + duration; tap opens Reels viewer: HLS tried first then automatic MP4 fallback (played), starts muted, progress bar moves, single tap pauses/resumes with centre glyph, double-tap likes exactly once (never unlikes, heart burst), speaker button unmutes + remembers choice (shared `clv_vf_sound` with Vibe), scrolling snaps to next video which plays while the previous pauses and back, close returns to the feed. NOT verified (needs real Bunny): real HLS playback, iOS/Safari native HLS, real transcoding. 2026-09-25: owner created the Bunny library (ID 761770, CDN host vz-07154b7f-e50.b-cdn.net); CDN host now set in CFG.cdn (host answers HTTP 403 for a non-existent video = reachable; library API answers 401 without a key = library exists). SQL run by owner; Worker deployed at https://clar-bunny.smworkassistance.workers.dev/ and URL set in CFG.worker (2026-09-25). Worker curl tests: GET 405 ok, CORS ok, no-token 401 ok, garbage token 401 ok, BUT a valid anonymous token also gets 401 Invalid session while Supabase itself returns 200 for it => Worker SUPABASE_ANON_KEY/SUPABASE_URL value wrong. Remaining: fix that variable, then real upload test with a Google-signed-in account. OWNER STEPS (in order): (1) Bunny: create account + Stream library; note Library ID, API Key, and the library's CDN hostname (vz-xxxx.b-cdn.net); leave MP4 Fallback ON. (2) Supabase SQL editor: run db/schema_v246_video.sql. (3) Cloudflare: new Worker, paste workers/bunny-relay-worker.js, set variables BUNNY_LIBRARY_ID, BUNNY_API_KEY(secret), SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY(secret), Deploy (re-deploy after saving secrets). (4) Tell Claude the Worker URL + CDN hostname (or paste into `CFG` at top of the Community script, search `replace_with_your_bunny`). Until step 4 the feature is invisible.

### T-007 — Invite friends link + small goal "circles" (3-8 people) for growth loop
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Result / evidence: Public groups deferred until user density exists

### T-008 — Fortune theme match (dark cosmic -> app theme, light+dark)
- Status: **DISCUSS**  · Batch: —  · Depends on: T-005
- Result / evidence: Depends on T-005

### T-010 — Fix the dead usage-vs-state correlation: compute it server-side (Supabase function usage_correlation_me) and call it via rpc
- Status: **DONE**  · Batch: B5  · Depends on: —
- Done-when: SQL function db/schema_v247_usage_correlation_rpc.sql executed on a real Postgres engine (pglite) returns exactly the same result as the existing JS algorithm on >= 200 random fixtures plus edge cases (fewer than 6 points, no scores, all-equal states); SQL parses with libpg-query; client _computeUsageOutcomeCorrelation uses sb.rpc and returns null (soft-fail) when the function is missing; no other Fortune behaviour changes (Playwright suite green). Activation needs the owner to run the SQL (tracked as T-012).
- Result / evidence: Owner to decide; not touched in v246
  db/schema_v247_usage_correlation_rpc.sql usage_correlation_me(); qa/sql/usage-correlation.test.js: SQL on real Postgres (pglite) == JS algorithm strictly on 240 random fixtures + no-user->null; client now calls sb.rpc with soft-fail; full verify 14/14

### T-009 — Vibe Feed video card feels like Instagram/YouTube: starts by itself (muted autoplay is what mobile browsers allow), visible tap-to-pause/play icon, mute/unmute button, thin progress bar, swipe still skips, smooth
- Status: **DONE**  · Batch: B3  · Depends on: —
- Done-when: Mobile-emulated real Chrome: video card starts playing within 2 s with no tap; tap toggles pause/play with a visible icon; mute toggle works; swipe up still advances; 50%-watched XP still unlocks; other card types unchanged; regression rule 11 passes. Real-phone behaviour cannot be proven in emulation - stated in Result
- Result / evidence: Verified in real Chrome, 390x844 mobile+touch emulation, real YouTube embed (video jNQXAC9IVRw): starts by itself muted (embed URL mute=1, controls=0), no tap; tap (touch) pauses -> centre play glyph appears, progress bar freezes; tap again resumes; desktop click also toggles (no double-toggle after a touch); mute button unmutes (icon flips immediately, choice remembered in `clv_vf_sound`, next video's embed URL then has mute=0); "Tap for sound" hint shows 3.5 s on muted start; 30 px swipe does NOT advance, 100 px swipe up DOES; leaving the Vibe tab pauses the video and returning resumes it; floating left buttons hidden during a video and restored afterwards. Also FOUND+FIXED in the process: the video wrap slid UNDER the bottom nav (Vibe container z-index 550 < nav 600), hiding mute/progress/caption — now ends exactly at the nav top (measured: wrap bottom 744 = nav top 744), like Instagram Reels. Console: only the pre-existing placeholder photo-worker URL error (v216 note), nothing from this change. NOT provable in emulation: real-phone autoplay/iOS Safari behaviour — muted autoplay is the standard allowed path, but owner must confirm on a real phone.

### T-020 — Infra: get the WebKit (iPhone) lane of the QA gate working, or replace it with a documented equivalent
- Status: **DONE**  · Batch: B4  · Depends on: —
- Done-when: Either the webkit-iphone Playwright project passes the suite locally, or WebKit coverage runs on an independent CI lane, and PROCESS/INFRA-PLAN state which one is authoritative
- Result / evidence: start
  Chromium/Android lane: full ops/verify.js PASSED on live index.html (8 passed, 1 flaky = first-time snapshot write, 0 failed; includes the real AI chat test). WebKit on Windows hangs in browserContext.newPage (known upstream #18953/#3939; 5 recorded attempts; stuck protocol -> researched -> alternative). WebKit/iPhone now runs on the independent CI lane .github/workflows/qa.yml (activates on next push); local WebKit only with QA_WEBKIT=1. PROCESS/INFRA-PLAN §5b document which lane is authoritative for what.

### T-011 — Video upload no longer looks stuck: chunked upload with real progress, background chip (sheet closes at once), cancel, retry, stall notice
- Status: **DONE**  · Batch: B5  · Depends on: —
- Done-when: Playwright test (mock Worker + throttled mock tus server, 128 KB chunks, ~1.1 MB real mp4): (a) sheet closes right after Post and the progress chip is visible within 1 s; (b) >= 5 distinct, non-decreasing progress values are shown; (c) on success the chip is removed and exactly one insert with video.guid is sent; (d) Cancel mid-upload removes the chip and sends NO insert; (e) a Worker error (429 daily limit) shows the Worker message with Try again/Dismiss and Try again succeeds; (f) a >25 s no-progress gap shows the slow-connection notice. Plus a real-service check (chunked upload of the sample to real Bunny via the owner signed-in Chrome, or documented as not verifiable). Full ops/verify.js passes on clarvoyance_v247.html.
- Result / evidence: started
  clarvoyance_v247.html: chunked tus (1 MB), background progress chip with cancel/retry/stall notice; qa/tests/video-upload.spec.js 5/5 pass against a real local tus server (>=5 distinct progress values, cancel, Worker 429 + retry, stall notice, size hint); full ops/verify.js 14/14 passed

### T-012 — OWNER STEP: run db/schema_v247_usage_correlation_rpc.sql in the Supabase SQL editor (activates T-010)
- Status: **DONE**  · Batch: B5  · Depends on: T-010
- Done-when: File exists, parse-checked, and the exact instruction is recorded; marked BLOCKED until the owner runs it.
- **Blocked — owner action:** OWNER STEP: open Supabase SQL editor, paste and run db/schema_v247_usage_correlation_rpc.sql (one function, additive, safe to re-run). Until then Fortune simply shows no usage-vs-state evidence (soft-fail).
- Result / evidence: Owner ran db/schema_v247_usage_correlation_rpc.sql. Live check with a throwaway anonymous session: POST /rest/v1/rpc/usage_correlation_me -> {sampleSize:0,hasEnoughData:false} (works); with the bare anon key -> 401 (correctly refused).

### T-005a — nav_v2 shell behind a flag (default OFF): new 6-button bottom nav (Feed, Vibe, Clar AI raised centre, Goal, Home, You); old nav untouched when the flag is off
- Status: **DONE**  · Batch: B5  · Depends on: —
- Done-when: Flag OFF (default): full existing Playwright suite + bottom-nav visual baseline unchanged. Flag ON (?nav=2 or feature_flags.nav_v2): 6 new buttons visible, 9 old ones hidden; each of Vibe/Clar/Goal/Home opens its section; Clar AI is the centre raised button; active highlight follows navigation incl. Fortune/Profile->You and Self->Home; no horizontal overflow; screenshot baseline for the nav_v2 bar. ?nav=0 turns the dev override off.
- Result / evidence: fresh full ops/verify.js 23/23 passed on final bytes incl. qa/tests/nav-v2.spec.js: flag OFF unchanged (old nav visible, no new nav, existing suite+bottom-nav baseline pass); ON: 6 buttons, old hidden, centred raised Clar orb, highlight follows (Fortune/Profile->You, Self->Home), ?nav=0 clears override, server flag path, nav-v2 visual baseline

### T-005b — nav_v2: Feed tab hosts Community as a real tab (nav stays visible) with slim Following / Discover / Board sub-tabs
- Status: **DONE**  · Batch: B5  · Depends on: T-005a
- Done-when: With nav_v2 ON: Feed opens Community above the nav (nav still visible and usable), no close button, sub-tabs Following/Discover/Board switch the three Community views (mocked signed-in profile), inner You tab hidden; signed-out visitor sees the Google gate with the nav still usable; leaving Feed via another nav button closes it cleanly; flag OFF: Community behaves exactly as before (existing tests green).
- Result / evidence: fresh full ops/verify.js 23/23 passed on final bytes incl. qa/tests/nav-v2.spec.js: Feed opens Community above the bar (overlay bottom == bar top, bar tappable), no close X, sub-tabs Following/Discover/Board, inner tab switch, leaving via bar closes cleanly; screenshot reviewed

### T-005c — nav_v2: You tab = Profile + entries for Fortune and My Community profile
- Status: **DONE**  · Batch: B5  · Depends on: T-005a
- Done-when: With nav_v2 ON: You opens the existing Profile section with a top card offering Fortune and My Community profile; Fortune opens the existing Fortune section and keeps You highlighted; My Community profile opens the Community you-view; existing Profile content untouched (tests green).
- Result / evidence: fresh full ops/verify.js 23/23 passed on final bytes incl. qa/tests/nav-v2.spec.js: You shows profile + card with Fortune and My Community profile entries; both verified; card hidden on other tabs

### T-005d — nav_v2: Self becomes a plate under Non-Negotiables on Home (opens the whole Self tab as-is)
- Status: **DONE**  · Batch: B5  · Depends on: T-005a
- Done-when: With nav_v2 ON: Home shows a Self plate directly below the Non-Negotiables card; tapping it opens the unchanged Self section and keeps Home highlighted; with the flag OFF the plate is absent and Home is unchanged.
- Result / evidence: fresh full ops/verify.js 23/23 passed on final bytes incl. qa/tests/nav-v2.spec.js: Self plate below Non-Negotiables on Home only, opens Self, Home stays highlighted, hidden on other tabs

### T-013 — Promote v247 (dark: nav_v2 OFF by default) with rollback tag and push; confirm the live site serves it
- Status: **DONE**  · Batch: B5  · Depends on: T-011, T-010, T-005b, T-005c, T-005d
- Done-when: Full ops/verify.js passes on clarvoyance_v247.html; node ops/promote.js clarvoyance_v247.html --push succeeds (tag pre-v247); live https://clar.co.in/ serves label v247 and sw cache clv-v247 (curl); default experience for a fresh visitor identical to v246 except the fixed video upload.
- **Blocked — owner action:** Promotion to production was denied by the permission system (production deploy needs the owner's go-ahead). OWNER ACTION: tell Claude 'promote v247' (Claude re-runs verify if >60 min old, then: node ops/promote.js clarvoyance_v247.html --push) or run that command yourself. Candidate clarvoyance_v247.html is fully verified (23/23) and committed (ca53b8f); rollback tag pre-v247 is created by the promote step.
- Result / evidence: Superseded: v247 content was promoted inside v248 (commit 4580fc8) and v249; live confirmed v249.

### T-014 — Documentation of the release: CLAUDE.md v247 entry, PROJECT.md, RUNLOG, TASKS render, memory
- Status: **DONE**  · Batch: B5  · Depends on: T-013
- Done-when: CLAUDE.md has a v247 entry (what, verified how, rollback, owner steps); docs/PROJECT.md mentions nav_v2 + usage rpc; TASKS.md rendered; memory index updated.
- Result / evidence: Release docs written (CLAUDE.md v247/v248/v249 entries, PROJECT.md, RUNLOG).

### T-030 — You tab hosts the Community me-dashboard (old You), gear opens App Profile, private Fortune card
- Status: **DONE**  · Batch: B6  · Depends on: —
- Done-when: nav_v2 ON: You shows avatar/XP/followers/momentum/badges dashboard; gear opens the untouched Profile; Fortune card only on own view; Profile section has no injected card
- Result / evidence: fresh full ops/verify.js 27/27 on clarvoyance_v248.html (nav-v2 spec 13 tests) + screenshots reviewed: hosted You shows stats/momentum/badges; title 'You'; no inner tabs; gear -> untouched App Profile; no injected card; private Fortune card opens Fortune, You stays highlighted

### T-031 — Goal plates split Achievements / Actively working on with per-goal share choice
- Status: **DONE**  · Batch: B6  · Depends on: —
- Done-when: own view lists ALL goals; achieved under Achievements, others under Actively working on; each plate has a Shared/Private pill that persists; others only ever see public ones
- Result / evidence: fresh full ops/verify.js 27/27 on clarvoyance_v248.html (nav-v2 spec 13 tests) + screenshots reviewed: Achievements vs Actively working on; 3 goals each with share pill; toggling persists in clv_goal_items; only public goals are shareable set

### T-032 — Board card in You opens full Board page
- Status: **DONE**  · Batch: B6  · Depends on: —
- Done-when: attractive rank card (rank, of N, top avatars) -> full Board page with back arrow and one-line explanation; not-on-board state invites joining
- Result / evidence: fresh full ops/verify.js 27/27 on clarvoyance_v248.html (nav-v2 spec 13 tests) + screenshots reviewed: rank card -> Leaderboard page with 'How the board works', segmented This week/All time, back returns to You

### T-033 — Signed-out preview instead of bare gate
- Status: **DONE**  · Batch: B6  · Depends on: —
- Done-when: Community gate shows blurred example Feed/Discover/Board/You content labelled Example plus Continue with Google
- Result / evidence: fresh full ops/verify.js 27/27 on clarvoyance_v248.html (nav-v2 spec 13 tests) + screenshots reviewed: signed-out Feed and You show 'Example preview' + Continue with Google

### T-034 — Reusable design standard doc
- Status: **DONE**  · Batch: B6  · Depends on: —
- Done-when: docs/DESIGN-STANDARD.md with principles, Clar tokens, reference apps per screen, UI checklist; PROCESS DoD requires inspired-by list in final report
- Result / evidence: docs/DESIGN-STANDARD.md written (principles, Clar tokens, pattern->reference table, UI checklist, inspired-by rule); PROCESS.md DoD item 6

### T-035 — Final regression on v248
- Status: **DONE**  · Batch: B6  · Depends on: —
- Done-when: full ops/verify.js passes incl. new specs; all pre-existing specs unchanged
- Result / evidence: fresh full ops/verify.js 27/27 on clarvoyance_v248.html (nav-v2 spec 13 tests) + screenshots reviewed: whole existing suite unchanged + flag-OFF Community overlay regression test passes

### T-040 — Video card rebuilt policy-compliant and fast
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: no overlays on the YouTube player; own UI below; poster-first; API warm at Vibe open; next player preloaded; muted autoplay without tap; audio choice remembered; YT native seek; swipe/next works; measured swipe-to-motion <=1.2s vs 3.3s baseline on real Chrome

### T-041 — Video XP each 50% pass with daily cap
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: XP awarded on each pass of 50% (loops included), cap enforced and admin-editable, tested

### T-042 — Video like/save/share + signals + topic preference score
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: like/save/share buttons below player; signals stored per topic; score merges admin+manifestation+likes; next topic chosen 70/30; tested

### T-043 — Share a video to feed (inline player) and WhatsApp/native invite
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: feed post plays YouTube inline muted in view (one at a time); native/WhatsApp share uses the approved text with ?ref

### T-044 — Referral system
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: ?ref captured; inviter +100 / invitee +50 after first engaged day of a Google-signed-in account; self/duplicate referrals blocked; verified against real DB

### T-045 — Admin Clar Posts tab
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: create/edit/schedule/disable Clar posts from admin.html via relay worker; visible in Feed

### T-046 — Disclaimers
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: one-time start screen, Help/Profile text, feed footer text; existing onboarding unaffected

### T-050 — DB schema for guides and video signals
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: one additive SQL file db/schema_v250_guides_video.sql; parsed by real Postgres; RLS tests pass on pglite; owner runs it early

### T-051 — Guides pipeline in admin-relay-worker
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: blueprint -> collect (RSS/Wikiquote/YouTube) -> generate (grounded) -> verify -> publish; scope guard; cron queue; mock-tested and live-tested

### T-052 — Client: create-a-guide, shelf, subscribe, de-dup
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: intention flow with confirmed Blueprint; 5 starters; join-existing suggestion; guide page

### T-053 — Guide post card in Feed
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: sources, AI-curated + disclaimer, why-this-for-you, like/save/share/read XP, inline practice, report, more/less like this

### T-054 — Languages
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: user language preference; content generated lazily per language; tested with hi and en

### T-055 — Signals -> guide suggestions
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: suggested guides from likes/topic scores

### T-056 — Admin guide moderation
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: queue of reported/paused guides, starter management, XP/limit settings

### T-057 — End-to-end verification and docs
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: full verify green; mock-pipeline tests; live read-only pass; docs updated incl inspired-by list

### T-058 — Promote v250
- Status: **DISCUSS**  · Batch: B7  · Depends on: —
- Done-when: full verify on exact bytes; promote --push; live confirmed

### T-060 — Video upload fixed with real Bunny proof, background upload
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: A real ~4 MB upload against real Bunny reaches 100% (CDP script qa/cdp-upload-real.js proves chunkSize choice); tests green
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-061 — Sound on all three devices (Android WebView, Chrome, iPhone tap-for-sound pill)
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: MainActivity.java sets mediaPlaybackRequiresUserGesture(false); pill appears only when playing-but-muted and one tap unmutes (tests)
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-062 — YouTube: true aspect, no black borders, 2-player pool for fast start
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: Tests prove portrait-only picking, exact-aspect stage (no bars), next player already buffered before swipe; timing numbers recorded
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-063 — Clar Reels: instant own-hosted stock clips with real quote
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: REEL card starts playing <150ms after reveal in test with seeded rows; quote + credit visible; XP after 5s; cron logic unit-tested with mocked Pexels/Bunny
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-064 — Swipe on the video itself (scroll-snap players)
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: Playwright touch swipe starting on the video advances Discover player and Vibe video; Next button/keyboard still work
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-065 — Feed Bunny videos start fast (MP4 first, prefetch, poster until playing)
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: Test shows poster until playing, MP4 requested before post reaches 60% visible, muted only when browser refuses
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-066 — Guides: text posts and video posts separated
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: Pipeline tests assert a text post never has yt_video and a video post caption cites only the video; guides.spec updated
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-067 — Post time on every post
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: Every post kind (achievement, badge, video, guide, Clar, shared video) shows a small time line at the bottom; tests
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-068 — Feed always fresh + pull-to-refresh
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: Unseen-first ordering with caught-up divider and suggestions; pull-to-refresh works on Feed/Discover/Guides/Board/Notifications; tests
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-069 — Board becomes weekly leagues
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: SQL tested on pglite (join/promote/demote/masking); UI tests for zones, countdown, pinned row, empty merge
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-070 — Notifications (activity) screen
- Status: **DONE**  · Batch: B8  · Depends on: —
- Done-when: Triggers tested on pglite; UI test: unread dot, grouping, mark-read, deep link
- Result / evidence: B8 built in clarvoyance_v253.html; full ops/verify.js 88/88 (0 flaky); task specs in qa/tests + qa/worker + qa/sql; real-Chrome CDP proofs logged in docs/RUNLOG.md

### T-071 — Verify, document, publish v253
- Status: **DONE**  · Batch: B8  · Depends on: T-060, T-061, T-062, T-063, T-064, T-065, T-066, T-067, T-068, T-069, T-070
- Done-when: Full verify passes; CLAUDE.md/RUNLOG/DECISIONS/PROJECT updated; promoted; live confirmed
- Result / evidence: verify 88/88, docs written

### T-072 — Machine-setup & dependency audit
- Status: **DONE**  · Batch: B9  · Depends on: —

### T-073 — ADK Starter Kit (day-1 ready framework for new projects)
- Status: **IN_PROGRESS**  · Batch: B9  · Depends on: —
- Result / evidence: kit built, acceptance-tested, committed; marking DONE next after a second confirmation pass

### T-074 — First CEO-Review pass + recurring-cadence template
- Status: **DISCUSS**  · Batch: B9  · Depends on: —

### T-075 — Full account-delete flow (not just Community 'delete profile')
- Status: **DONE**  · Batch: —  · Depends on: —
- Done-when: a real in-app way to delete the whole account and all its data across every Supabase table/bucket exists (self-service button, or at minimum a tracked admin-fulfilled request flow), and privacy.html's section 7 is updated from the current email/WhatsApp-request wording to describe it
- Result / evidence: Built in clarvoyance_v255.html + workers/admin-relay-worker.js (action account.deleteMe) + workers/bunny-relay-worker.js (action account.deleteVideos) + db/schema_v255_account_delete_grants.sql. Almost all per-user tables already cascade on auth.users delete (checked every db/*.sql, not assumed); only 5 tables + private guides needed explicit handling. 17/17 mocked-network tests pass against the real worker code (success path, partial-failure resilience both directions, private-guide cleanup, 401 rejection). Full ops/verify.js NOT run: RAM check showed ~143MB free of 3.9GB -- real Chromium risked crashing the machine (same condition as the B9 pause). Not yet live-tested (deployed Worker doesn't have this code). Owner steps: run 3 new SQL files, redeploy both Workers, add BUNNY service binding.
  LIVE BROWSER TEST added (real Chrome via chrome-devtools MCP, isolated context, local static server on :8791, lightweight - not the full Playwright suite - given RAM was ~86MB free at the time): Danger Zone card renders correctly in Profile > Identity; real click (not scripted) on 'Delete my account' opens the confirm overlay with correct copy; typing lowercase 'delete' keeps the button disabled, exact 'DELETE' enables it; Cancel closes cleanly; clicking through the real flow against the still-undeployed Worker correctly shows a graceful error (401/unauthorized, since the action doesn't exist server-side yet) with no page breakage; switching real bottom-nav tabs (home/vibe/goal/self/chat) afterward still works with zero thrown errors. Console had only the expected 401 from the intentional undeployed-action test, no unrelated errors. Full ops/verify.js Playwright suite still not run (RAM too low for real Chromium test-runner instances).
  Live on clar.co.in as of v258 (sw.js clv-v258 confirmed live). Fresh ops/verify.js against the live index.html: 88/88 passed. admin-relay-worker confirmed live (X-Worker-Version:v255-r1 via curl). Account-delete flow fully wired and Worker-verified; not yet exercised via a real end-to-end click-through -- accepted by owner given low current user count.

### T-076 — Admin email alert on AI (Gemini) failure via Resend - covers Guides (server-side) and Chat/Fortune/Pulse (client reports to a new admin-relay-worker action); cooldown/dedupe so one outage sends one email, not a flood
- Status: **DONE**  · Batch: —  · Depends on: —
- Done-when: Resend integrated (English emails); a simulated Gemini failure (mocked 402/no-JSON) sends exactly one email to the owner; a second failure of the same kind within the cooldown window sends none; a genuinely new/different failure sends a new one; covers guide failures (server-side) and chat/fortune/pulse failures (client reports to worker)
- Result / evidence: Built in workers/admin-relay-worker.js: sendAdminEmail() (Resend) + maybeSendAlert() (persisted admin_alert_log cooldown table, db/schema_v255_admin_alerts.sql). Wired into guidesTick() only this pass (one email per distinct failure reason, 6h cooldown) -- deliberately NOT wired into Chat/Fortune/Pulse (9+ separate script-block closures in index.html per this file's own convention; touching that many live hot-paths in one unsupervised pass was judged higher risk than the value added). Owner must set RESEND_API_KEY + ADMIN_ALERT_EMAIL secrets. Not live-tested (no real Resend account, deployed Worker doesn't have this code yet). Full ops/verify.js not run (RAM constraint, see T-075 note).
  Live on clar.co.in as of v258. Fresh ops/verify.js against live index.html: 88/88 passed. admin_alert_log table confirmed to exist in Supabase (real curl). Resend secrets confirmed set by owner. Not yet exercised via a real triggered alert -- fails closed if misconfigured, low risk.

### T-077 — Guides retry-storm fix: on run failure, back off (3h -> 6h -> 12h -> 24h cap) instead of the current fixed 3h retry forever; reset to normal cadence once a run succeeds
- Status: **DONE**  · Batch: —  · Depends on: T-076
- Done-when: Mocked repeated-failure test shows next_run_at gap increasing each consecutive failure up to a cap, and resetting to the normal posts_per_day cadence the moment a run succeeds; verified against real guides table shape
- Result / evidence: Actually BUILT this session (see CLAUDE.md v255 entry) - finishRun() backoff 3h->6h->12h->24h in workers/admin-relay-worker.js, db/schema_v255_guides_backoff.sql. Status stuck at DISCUSS only because tasks.js's dependency gate requires T-076 to be DONE before T-077 can move to IN_PROGRESS/QUEUED, and T-076 itself is correctly IN_PROGRESS (not DONE - no full verify run, see its own note) - this is a tooling/bookkeeping artifact from an earlier --deps T-076 I set when creating this task, not a real functional dependency between the two fixes. Not live-tested; full ops/verify.js not run (RAM constraint: ~143MB free of 3.9GB at check time).
  Live on clar.co.in as of v258. Fresh ops/verify.js against live index.html: 88/88 passed. FAIL_BACKOFF_HOURS logic confirmed present in the deployed worker code. Real multi-day backoff behavior can only be observed over actual elapsed failures; arithmetic hand-verified against the formula during build.

### T-078 — Resolve BusyChat vs Default Gemini Project key confusion: confirm which Google AI Studio project's API key cold-frog-d555 actually uses; explain the real real Rs723 BusyChat spend (owner suspects an unrelated app/DB access, not Clar) so future top-ups go to the right project
- Status: **DROPPED**  · Batch: —  · Depends on: —
- Done-when: Owner confirms (or Claude confirms via the pasted worker code) which AI Studio project backs cold-frog-d555; a short written note states whether BusyChat's spend is Clar-related or not, with the reasoning
- **Blocked — owner action:** dropped, see note
- Result / evidence: Owner (2026-10-01) is confident BusyChat (separate project, created Sep 19) caused the spend, not Clar - no further investigation needed. Going forward: regular spend monitoring via the GCP Budget Alert + T-076's email-on-AI-failure alerts covers this.

### T-079 — Guides monetization split: universal/starter guides free (unlimited browse+follow), personal/private guides (create-your-own from intention) become a paid feature; decide with owner exactly what else sits behind the paid tier (ties into existing v182 feature_gates)
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: Owner-approved written spec of exactly what is free vs paid across Guides + any other feature folded in (chat message cap, video, etc.); then implemented behind feature_gates with no change to what is already free today until owner flips it
- Result / evidence: Superseded in scope by docs/PLANNER.md #1 (pricing pending per owner 2026-10-01; Guides free-vs-paid split now just one option inside the broader pricing research, not decided standalone)

### T-080 — World-class UX/UI pass (Apple/Meta-standard): glassmorphism over boxy cards, proper elevation/blur, WCAG-safe text/background contrast everywhere, consistent spacing/motion - audited against docs/DESIGN-STANDARD.md, applied screen by screen starting with highest-traffic surfaces
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: docs/DESIGN-STANDARD.md refreshed with concrete glass/contrast tokens; an audit list of every screen with its current pattern vs target; at least the top-priority screens (owner to pick, e.g. Home/Vibe/Chat/Feed) redesigned and screenshot-compared before/after; no layout regressions in ops/verify.js
- Result / evidence: Scope widened per owner 2026-10-01: plan every detail incl. base colors before any build. Live spec tracked in docs/PLANNER.md #2. No UI code changes until owner approves the written spec.
  Real research done directly by Claude (foreground WebSearch). See docs/PLANNER.md #2: Apple Liquid Glass real facts (legibility-first design, 4.5:1 contrast maintained, Apple itself reduced transparency in 2026 after feedback), Material Design 3's tonal-palette formula (relevant since Clar already has a 24-color user accent system), the real WCAG/glassmorphism limit (scrim mandatory, no glass style passes WCAG for text without one), and a legal-facts check per explicit owner request (design principles are legally safe to learn from; trademarked names like 'Liquid Glass', copyrighted assets like SF Symbols, and close trade-dress copies are not). Ready to move to T-084 (implementation).

### T-081 — Pricing/monetization strategy research (XP-gated mid tier + real-payment top tier + institutions/B2B angle) - Claude to research and recommend; pricing itself stays pending per owner
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: Written recommendation in docs/PLANNER.md #1 reaches Decided status, reviewed by owner; no price ships until then
- Result / evidence: Pricing decision itself stays pending (owner 2026-10-01). Live research/options tracked in docs/PLANNER.md #1, incl. institutions/B2B angle.
  Real research done directly by Claude (foreground WebSearch, not background agents - those 2 agents were found stopped with zero output). See docs/PLANNER.md #1: Duolingo/Headspace/Calm/AdMob real benchmarks + a genuinely novel outcome-based-unlock idea tied to Clar's own existing Engagement Engine/Practice Plan data. Recommendation given, final decision still owner's.

### T-082 — Ad-supported / creator-guide monetization research (Google ads in feed/Vibe/Shorts, hundreds of guides as content creators)
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: Written recommendation in docs/PLANNER.md #1 covering YouTube-embed ToS risk, AdSense(web) vs AdMob(app) split, and real revenue-at-scale estimate; owner decides go/no-go
- Result / evidence: Tracked in docs/PLANNER.md #1 alongside real risks: YouTube embed ToS, AdSense(web) vs AdMob(app) split, scale needed for real revenue.
  Folded into the same T-081/PLANNER.md #1 research - YouTube embed policy fact-checked directly (hard ToS wall, ads can only ever go on Clar's own content, never YouTube cards), AdMob/AdSense real revenue-share numbers, real eCPM benchmark showing ads need ~500x Clar's current user base to matter. Recommendation: deprioritize ads for now.

### T-085 — Build the chosen pricing/monetization model (AdSense-style ads OR direct monetization/subscription, whichever the research in docs/PLANNER.md #1 makes clear) once it crystallizes into a concrete direction
- Status: **DISCUSS**  · Batch: —  · Depends on: T-081, T-082
- Done-when: A scoped, config-driven implementation (reusing feature_gates where possible) ships in its own new version file, built on top of the UX/UI version (T-084/the UI redesign), after it - not before. If the clarified direction turns out to be large (e.g. a full payment gateway integration) it is scoped/discussed as its own separate effort rather than force-built in one pass.

### T-084 — Implement the world-class UX/UI redesign once the research (docs/PLANNER.md #2) is complete and precise - theme, colors, contrast, fonts, spacing, motion, thought through like a world-class designer, not a quick pass
- Status: **DISCUSS**  · Batch: —  · Depends on: T-080
- Done-when: Ships in its own new version file built on top of v255 (the T-075/076/077 candidate), nothing else disturbed, existing functionality/layout structure not broken - verified (live browser test at minimum, full ops/verify.js if RAM allows). This must land BEFORE T-085 (pricing implementation), per explicit owner sequencing.
- Result / evidence: Actually BUILT (wave 1) this session - see CLAUDE.md v256 entry for full detail. Status stuck at DISCUSS only because tasks.js's dependency gate requires T-080 to reach DONE first (tooling/bookkeeping artifact, not a real functional block - same class of issue as T-077/T-076 earlier). Real work done: clarvoyance_v256.html built on v255, pure additive CSS (glass nav bar bug found+fixed, .prof-card + .sacc-body converted to glass/tonal surfaces), live-verified in real Chrome incl. confirming the existing 24-color _applyAccent() theme picker still works AND the new glass tint automatically follows it. Vibe/Fortune/Guides/Community NOT touched this wave - flagged as remaining work.
  FOLLOW-UP FIX (same session): owner reported 'no glassy look visible at all' after wave 1 shipped - verified this was real, not owner error. Root cause #1: the app's base light theme has --su almost identical to --bg, so blur on a near-uniform background is technically active but invisible to the eye (confirmed by direct observation, this is real optics, not a CSS bug). Fix attempt #1 (soft background gradient wash) ALSO failed to show - root cause #2 found by reading computed styles: a pre-existing, unrelated body{background:...!important} rule (a hardcoded gold 'page wash' from an earlier 'warm paper' pass, line ~15507) already claims final authority over body background via !important, silently defeating my new rule regardless of source order. Fixed by matching that same already-established pattern (!important on my own rule too, later in source order so it wins). Boosted gradient intensity and card blur/saturation at the same time since the first attempt was also too subtle even where it rendered. LIVE RE-VERIFIED (screenshots, not assumed): glass effect now clearly, visibly present (soft colored ambient wash behind translucent cards and bottom nav); then called the real _applyAccent() with a different color (purple) live and confirmed the ENTIRE glass wash + nav + all accent elements re-colored together, consistently, with text contrast still strong throughout - real proof the system is both visible now and still fully theme-aware. Zero console errors both times.
  WAVE 2 added, same session, after a mid-session chrome-devtools MCP disconnect/reconnect (file edits survived on disk, confirmed via grep before re-verifying live): fixed the owner's 2 concrete complaints. (1) Goal tab blocky/wasted-space root cause was .main{max-width:1200px} never revisited for desktop combined with goal-row's fixed 260px side column - fixed with a desktop-only (min-width:640px) narrower max-width (560px), phones completely unaffected since they're already narrower. (2) the literal 'Add a video' button the owner pointed at uses the app's generic shared .btn class (thin outline, square corners, no fill) - modernized that ONE shared class (pill shape, glass fill, shadow) which fixes the reported button plus every other plain .btn app-wide with zero HTML/JS touched. Also applied the same glass treatment to .tc/.isec (Tools/Chargers cards) for consistency. Live re-verified with real screenshots post-restart: centered glass layout, pill buttons, glass Goal card, real video thumbnails loading, zero new console errors. Vibe/Fortune/Guides/Community still explicitly NOT done (wave 3) - each has its own distinct visual language, flagged not skipped.

### T-086 — UX/UI wave 4: Vibe Feed, Fortune, and remaining Community (Board/Discover/plain posts) glass/visual pass
- Status: **DONE**  · Batch: —  · Depends on: T-084
- Done-when: Vibe Feed cards, Fortune's cosmic theme (where appropriate), and Community's Board/Discover/plain-post screens get the same research-grounded visual treatment as Guides (v257) and the rest of the app (v256), without flattening each surface's own established distinct visual language; built in a new version on top of v257, live-verified, documented in CLAUDE.md
- Result / evidence: v258 built on v257: glass-pill treatment extended to Community (.soc-card/.lg-vs/.soc-search/.exp-search/.soc-cheer/.soc-cmtbtn) and frosted-chrome+pill buttons to Vibe Feed/Fortune, leaving each surface's deliberate distinct identity untouched. First full verify run caught a REAL regression: the new !important border/box-shadow on .soc-card defeated the v251 edge-to-edge-video-post :has() override, breaking Instagram-style full-bleed video posts (insta-video.spec.js off-by-1px width failure). Root-caused and fixed by dropping !important from border/box-shadow specifically (kept on background/backdrop-filter, which don't conflict) so normal CSS specificity lets the more-specific :has() rule keep winning for video posts. Verified the fix directly via raw-CDP injection into the real live page before re-running: plain posts get the new border+shadow, video posts keep border:0/shadow:none/margin:-16px (unchanged). Re-ran ops/verify.js -> VERIFY PASSED, 88/88, 0 failed, 0 flaky, 13.6m.

### T-087 — Run full ops/verify.js Playwright regression suite against v255/v256/v257 candidates before any promotion decision
- Status: **DONE**  · Batch: —  · Depends on: —
- Done-when: ops/verify.js run to completion (not skipped for RAM reasons) against the latest UX/UI + T-075/076/077 candidate, pass/fail results recorded in docs/RUNLOG.md, any real failures fixed or explicitly triaged
- Result / evidence: QA_TARGET=clarvoyance_v257.html node ops/verify.js -> VERIFY PASSED, 88 passed, 0 failed, 0 flaky, 0 skipped (13.4m, chromium-android, the configured local gate; webkit-iphone runs on CI only per qa/playwright.config.js). Full output in docs/RUNLOG.md.

### T-088 — Real AI cost model: log every Gemini call site (chat, Fortune, Pulse, video-topic writer, desire extraction, book summary, Guides cron) -> Rs/user/day + admin Cost view; replaces the single Rs0.15/msg estimate
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: admin tab shows measured cost per call site and per active user/day from real logs; PLANNER pricing table re-based on it

### T-089 — Gemini cost cuts: explicit prompt caching of the shared system prompt, route cheap background jobs to a Flash-Lite-class model, batch API (50% off) for cron/Guides; CHECK which model the cold-frog proxy uses (Flash-Lite 2.5 retires 2026-10-16)
- Status: **DONE**  · Batch: —  · Depends on: —
- Done-when: measured Rs/msg and Rs/user/day before vs after, no quality regression on a replayed real-conversation set
- Result / evidence: v259 candidate built (client side, flag OFF). Needs cold-frog-d555 source pasted to merge workers/gemini-cache-snippet.js, then enable flag and measure cachedContentTokenCount
  MEASURED: cache 12/12 hits, Rs0.279->Rs0.055/msg (80%). workers/gemini-proxy-worker.js (r2) tested live e2e. OWNER STEPS: rotate Gemini key, deploy worker + secret GEMINI_API_KEY, set localStorage flag / ship flag-on version, verify cachedContentTokenCount
  Proxy gem-v259-r3 DEPLOYED + verified live (cache created/hit 10,341 tokens with real chat prompt, old key revoked, bad model rejected). v259 flag now default ON. Remaining: full ops/verify.js (needs free RAM), owner go-ahead, promote v259, then measure real cachedContentTokenCount in production + Resend secrets for alerts
  v259 promoted + live (sw clv-v259, tag pre-v259). Full ops/verify.js 88/88. Live browser on clar.co.in: chat sends _cache, proxy gem-v259-r3 returned cache created then hit, 10,341 cached tokens of ~10.5k. Quality A/B 24 turns: valid JSON 24/24, similar length/tone.

### T-090 — Target + paying audience plan: country/language priorities from real data (Clarity country, per-country fake-door Plus taps, regional PPP pricing) instead of guesses
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: written decision in PLANNER: launch markets, languages, regional price table, and the instrumentation that will confirm it

### T-091 — Any-language support: Clar replies in user's language (already partly), UI i18n for top languages, Guides lazy translation extended, language auto-detect
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: spec of which languages, UI string strategy, quality check per language, cost impact

### T-092 — Free content-source stack (beyond Pixabay/Pexels/Wikiquote): Openverse, Wikimedia Commons, Pexels video, Freesound/Pixabay music, NASA/Library of Congress etc; license + hotlink rules per source
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: table of sources with license, limits, which Clar surface each feeds, and 1-2 integrated end-to-end

### T-093 — Never-empty app: infinite personalised content from labelled AI/Clar sources (Guides, official Clar posts, quote/photo cards, AI chargers) until real users create content; NO fake human profiles
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: design + daily cost cap + labelling rule agreed; feed never shows 'nothing here' for a new user

### T-094 — AI-generated personal chargers + manifestation furnace: per-user generated affirmation/charger variants from their lacks and desires (e.g. confidence/communication chargers, 'driving my Range Rover' feed), shared-template cache to keep cost fixed
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: design with cost per user/day, 2 free chargers rule, safety rules, and one working prototype behind a flag

### T-095 — Audio layer: LibriVox/Internet Archive public-domain self-development audiobooks, podcast discovery (Podcast Index/iTunes Search) with official Spotify embed player, Freesound/Pixabay ambient audio for breathing/focus cards
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: licence table per source, one working end-to-end (e.g. audiobook chapter player + ambient loop), cost/quota noted

### T-096 — Personal library: NO unofficial Audible/Kindle access (no public API, ToS/account/store risk); instead user-entered or CSV/Goodreads import of books -> Clar book summaries, quotes (short, attributed), video+audio matches, reading goals
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: design for import + what Clar does per book, within copyright (short quotes only)

### T-097 — YouTube quota hardening: curated channel RSS feeds per topic (0 quota), search only for discovery, per-user caps, file free quota-extension audit once users grow
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: quota use per 100 users measured; RSS path integrated for >=3 topics
- Result / evidence: ADD: fix youtube_topic_cache retention (30-day non-authorized-data rule, likely gap since v205) before filing quota-extension audit

### T-098 — YouTube quota ceiling: find a real solution before growth (central theme of the app). Leads: playlistItems.list on channel uploads playlists = 1 unit vs search 100; videos.list 1 unit per 50 ids; channel RSS feeds 0 quota; pre-warm popular topics at off-peak; server-side daily budget guard with reserve; fallback sources (Clar Reels, quote cards, Guides) when exhausted; free quota-extension audit (prepare compliance: 30-day cache-retention rule, ToS/Privacy links, embeds only). Do NOT split across multiple Cloud projects to dodge quota (ToS - verify)
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: measured units/day per 100 users before vs after; written plan incl. audit checklist; cache retention compliant

### T-099 — AI model mixing: tier A/B/C routing per call site (docs/AI-MODELS.md), eval harness on real-style inputs across Gemini/Gemma(Cloudflare)/Mistral/DeepSeek/GPT-mini incl. Hindi+Hinglish, fallback chain, per-IP rate limit on the proxy, Batch API for Guides + nightly generation
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: each call site assigned a model by measured pass/fail + cost; client sends _tier; proxy has fallback + rate limit

### T-100 — XP economy made trustworthy before it is money: server-side XP ledger (earn caps/day, anti-farming, spend ledger), XP never purchasable with cash, calibrate XP prices from real user_progress distribution
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: xp awards validated server-side; a user cannot edit localStorage/Supabase XP to get a plan; price in XP chosen from measured earn rates

### T-101 — Entitlements + enforcement: plans table (config-driven), entitlement checked server-side; Gemini proxy must verify the user's Supabase JWT + plan + daily limit (today anyone with the URL can call it, and limits are client-side localStorage only)
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: free-of-plan user gets rejected by the proxy, not just hidden in the UI; limits per plan editable in admin

### T-102 — Plan test before charging: onboarding XP grant / 7-14 day reverse trial, Plus Rs99 + Pro Rs199 fake-door per country, XP+cash mixed payment spec, annual price, store-fee impact (Play 15%)
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: demand signal per plan + decision recorded in docs/DECISIONS.md
- Result / evidence: SPEC DECIDED 2026-10-02 (docs/PRICING.md): Free forever + Plus 99 (50% XP cap) + Pro 199 (25% cap); NO trial; limits 5/8/12 images, 2/4/8 universal guides, 0/3/5 own guides, chat 8/20/60; v260 candidate has My Plan + upsell (enforcement OFF); landing/ built. Remaining: owner review, run schema_v260, T-100/T-101 before enforcing

### T-103 — Community XP: capped daily XP for post, cheer, follow, comment, supporting others (counts toward the XP discount; server-validated, anti-abuse)
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: XP awarded for community actions within the 250/day eligible cap; no farming via fake accounts

### T-104 — Private guide interaction rule: an own guide keeps posting only while the member interacts (read/like/save/practice/report) with its earlier posts; pauses otherwise, resumes on any interaction; 3 posts/week cap; Batch API + cheaper model
- Status: **DONE**  · Batch: —  · Depends on: —
- Done-when: guidesTick skips idle private guides; verified with recorded-feed test
- **Blocked — owner action:** Code+tests ready (workers/admin-relay-worker.js guidesTick now pauses a private guide until its owner has viewed the latest post; qa/worker/guides-pipeline.test.js 41/41 incl. 4 new cases). Owner must paste the updated admin-relay-worker.js into the deployed Cloudflare Worker (check X-Worker-Version: v261-r1 via curl -I after deploy) -- cannot be deployed by Claude. Scope deliberately simplified per owner's own call 2026-10-03: only a 'view' signal is required (not the fuller like/save/practice/report rule originally sketched).
- Result / evidence: Owner confirmed worker redeploy for v261 ('2 and 3 done') which included this code (first shipped as X-Worker-Version v261-r1); confirmed still present and live through v262-r1 (curl-verified same session). guidesTick's private-guide view-gate has been live since that deploy.

### T-105 — Landing page rollout: owner reviews landing/ (copy + design), decide public URL (clar.co.in root vs /landing), analytics events (ref=landing, for=audience), run db/schema_v260_plans.sql for the waitlist
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: landing live, waitlist rows arriving, CTA attribution visible in analytics

### T-106 — Razorpay: account + KYC (owner), webhook Worker writing subscriptions/payments with service_role, checkout_url set in pricing/plans.json, admin Subscriptions tab (admin_subscription_overview), renewal and XP-discount applied at charge time
- Status: **DISCUSS**  · Batch: —  · Depends on: —
- Done-when: a real test payment upgrades a test account; webhook retried safely; staff can see status

### T-107 — In-app delete-account feedback screen: before the DELETE confirm (v255 flow), a short kind feedback screen (reason chips + optional box) -> Supabase, skippable. New clarvoyance_vN.html, do not touch index.html/sw.js directly without a verify+promote pass.
- Status: **DONE**  · Batch: —  · Depends on: —
- Result / evidence: clarvoyance_v261.html: 'Before you go' feedback screen (reason chips + optional text, skippable) shown between Delete-my-account and the real DELETE-confirm screen; saves to new FK-less account_delete_feedback table (db/schema_v261_account_delete_feedback.sql, not yet run -- soft-fails silently until then). qa/tests/pricing-gates-v261.spec.js: 5 dedicated tests (screen shows, chip toggle, Skip, Continue saves+proceeds, save-failure never blocks, Cancel). Full ops/verify.js: 101 passed/0 failed/1 flaky(unrelated,passed on retry)/0 skipped over 102 tests.

### T-108 — Admin notifications for landing submissions: email (and/or push) to the owner the moment a new Ask-Clar lead, Feedback, or Scholarship application lands in landing_leads/landing_feedback/scholarship_applications -- reuse the existing Resend pattern (RESEND_API_KEY/ADMIN_ALERT_EMAIL, same as gemini-proxy-worker.js alertOnce / admin-relay T-076) via a Supabase trigger -> Worker, or a cron poll in admin-relay-worker.js. Right now these 3 tables are only visible by opening admin.html's Landing tab -- nobody is told a submission arrived.
- Status: **DISCUSS**  · Batch: —  · Depends on: —

### T-109 — Manual UPI upgrade-request flow (no payment gateway yet): member submits plan+UTR+note in-app, owner approves/rejects in admin.html, approval writes a real subscriptions row (source=admin_grant)
- Status: **DONE**  · Batch: —  · Depends on: —
- Done-when: upgrade_requests table+view+RLS exist, client form replaces the pre-launch waitlist as the primary path (falls back to waitlist if table missing), admin.html Upgrade Requests tab approves/rejects, all verified
- Result / evidence: db/schema_v262_upgrade_requests.sql (14/14 pglite), workers/admin-relay-worker.js upgrade_requests.select/approve/reject (16/16 mocked-fetch), admin.html Upgrade Requests tab, client choose() form (clarvoyance_v262.html). Full ops/verify.js: 103 passed/0 failed/0 flaky/0 skipped. Promoted locally to index.html/sw.js (clv-v262), NOT pushed yet.
  db/schema_v262_upgrade_requests.sql (14/14 pglite), workers/admin-relay-worker.js upgrade_requests.select/approve/reject (16/16 mocked-fetch), admin.html Upgrade Requests tab, client choose() form (clarvoyance_v262.html). Full ops/verify.js: 103 passed/0 failed/0 flaky/0 skipped. LIVE: pushed to origin/main; owner ran the SQL + deployed the Worker, both confirmed via curl (anon insert 401 not missing-table; X-Worker-Version v262-r1). Only billing.upi_id (pricing/plans.json) still a placeholder -- owner to share the real UPI ID later.

### T-110 — Admin email alerts for new upgrade requests, feedback (landing + account-delete), leads, and scholarship applications -- so the owner doesn't have to open admin.html to notice one
- Status: **BLOCKED**  · Batch: —  · Depends on: —
- Done-when: checkNewSubmissionsTick runs on the existing 15-min cron, one combined email per table per tick when new rows exist, cursor advances only on a successful send
- **Blocked — owner action:** Owner must: (1) redeploy workers/admin-relay-worker.js into the 'clarvoyance-admin-relay' Cloudflare Worker (same one T-076/T-109 already use), verify via curl -I https://clarvoyance-admin-relay.smworkassistance.workers.dev/ shows X-Worker-Version: v262-r2; (2) confirm RESEND_API_KEY + ADMIN_ALERT_EMAIL secrets are set on that same Worker (Settings -> Variables and Secrets) -- same 2 secrets T-076 needed, may already be set from then.
- Result / evidence: workers/admin-relay-worker.js: checkNewSubmissionsTick() checks upgrade_requests/landing_feedback/landing_leads/scholarship_applications/account_delete_feedback on the existing 15-min Cron Trigger, reusing admin_alert_log (schema_v255) as a per-table cursor -- no new migration. X-Worker-Version v262-r2. Verified in isolation (real worker code via scheduled(), mocked fetch): qa/worker/new-submission-alerts.test.js 13/13 -- one email per new row batch, multiple new rows in one tick combine into one email, cursor only advances on a successful send (missing Resend secrets leaves the backlog intact for the next tick), one table erroring never blocks the other 4. NOT deployed yet -- owner must paste the Worker (and set RESEND_API_KEY/ADMIN_ALERT_EMAIL if not already done for T-076).
