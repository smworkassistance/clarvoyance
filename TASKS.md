# TASKS — Clarvoyance task queue

> **Generated file — do not edit by hand.** Source of truth: `tasks.json` (changed only through `node ops/tasks.js …`).
> Process, rules, Definition of Done, rollback: **`docs/PROCESS.md`**. Decisions: **`docs/DECISIONS.md`**. Run history: **`docs/RUNLOG.md`**.
> Rendered 25/09/2026 04:57:47 IST.

## Run status
No run active.

## What the OWNER must do (all BLOCKED items, exact action)
_Nothing — no blocked tasks._

## Batches
- **B1** — frozen 24/09/2026 04:20:00 IST — 2/2 done: T-002(DONE), T-003(DONE)
- **B2** — frozen 24/09/2026 04:50:00 IST — 1/1 done: T-006(DONE)
- **B3** — frozen 24/09/2026 05:10:00 IST — 1/1 done: T-009(DONE)
- **B4** — not frozen — 1/1 done: T-020(DONE)
- **B5** — not frozen — 0/9 done: T-010(QUEUED), T-011(QUEUED), T-012(QUEUED), T-005a(QUEUED), T-005b(QUEUED), T-005c(QUEUED), T-005d(QUEUED), T-013(QUEUED), T-014(QUEUED)

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
| T-010 | 24/09/2026 05:52:00 | Fix the dead usage-vs-state correlation: compute it server-side (Supabase function usage_correlation_me) and … | QUEUED | B5 | — | — |
| T-009 | 24/09/2026 05:10:00 | Vibe Feed video card feels like Instagram/YouTube: starts by itself (muted autoplay is what mobile browsers a… | DONE | B3 | — | 24/09/2026 05:38:00 |
| T-020 | 25/09/2026 04:49:13 | Infra: get the WebKit (iPhone) lane of the QA gate working, or replace it with a documented equivalent | DONE | B4 | — | 25/09/2026 04:57:46 |
| T-011 | 25/09/2026 04:54:31 | Video upload no longer looks stuck: chunked upload with real progress, background chip (sheet closes at once)… | QUEUED | B5 | — | — |
| T-012 | 25/09/2026 04:54:32 | OWNER STEP: run db/schema_v247_usage_correlation_rpc.sql in the Supabase SQL editor (activates T-010) | QUEUED | B5 | T-010 | — |
| T-005a | 25/09/2026 04:54:32 | nav_v2 shell behind a flag (default OFF): new 6-button bottom nav (Feed, Vibe, Clar AI raised centre, Goal, H… | QUEUED | B5 | — | — |
| T-005b | 25/09/2026 04:54:33 | nav_v2: Feed tab hosts Community as a real tab (nav stays visible) with slim Following / Discover / Board sub… | QUEUED | B5 | T-005a | — |
| T-005c | 25/09/2026 04:54:34 | nav_v2: You tab = Profile + entries for Fortune and My Community profile | QUEUED | B5 | T-005a | — |
| T-005d | 25/09/2026 04:54:34 | nav_v2: Self becomes a plate under Non-Negotiables on Home (opens the whole Self tab as-is) | QUEUED | B5 | T-005a | — |
| T-013 | 25/09/2026 04:54:35 | Promote v247 (dark: nav_v2 OFF by default) with rollback tag and push; confirm the live site serves it | QUEUED | B5 | T-011, T-010, T-005b, T-005c, T-005d | — |
| T-014 | 25/09/2026 04:54:35 | Documentation of the release: CLAUDE.md v247 entry, PROJECT.md, RUNLOG, TASKS render, memory | QUEUED | B5 | T-013 | — |

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
- Status: **QUEUED**  · Batch: B5  · Depends on: —
- Done-when: SQL function db/schema_v247_usage_correlation_rpc.sql executed on a real Postgres engine (pglite) returns exactly the same result as the existing JS algorithm on >= 200 random fixtures plus edge cases (fewer than 6 points, no scores, all-equal states); SQL parses with libpg-query; client _computeUsageOutcomeCorrelation uses sb.rpc and returns null (soft-fail) when the function is missing; no other Fortune behaviour changes (Playwright suite green). Activation needs the owner to run the SQL (tracked as T-012).
- Result / evidence: Owner to decide; not touched in v246

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
- Status: **QUEUED**  · Batch: B5  · Depends on: —
- Done-when: Playwright test (mock Worker + throttled mock tus server, 128 KB chunks, ~1.1 MB real mp4): (a) sheet closes right after Post and the progress chip is visible within 1 s; (b) >= 5 distinct, non-decreasing progress values are shown; (c) on success the chip is removed and exactly one insert with video.guid is sent; (d) Cancel mid-upload removes the chip and sends NO insert; (e) a Worker error (429 daily limit) shows the Worker message with Try again/Dismiss and Try again succeeds; (f) a >25 s no-progress gap shows the slow-connection notice. Plus a real-service check (chunked upload of the sample to real Bunny via the owner signed-in Chrome, or documented as not verifiable). Full ops/verify.js passes on clarvoyance_v247.html.

### T-012 — OWNER STEP: run db/schema_v247_usage_correlation_rpc.sql in the Supabase SQL editor (activates T-010)
- Status: **QUEUED**  · Batch: B5  · Depends on: T-010
- Done-when: File exists, parse-checked, and the exact instruction is recorded; marked BLOCKED until the owner runs it.

### T-005a — nav_v2 shell behind a flag (default OFF): new 6-button bottom nav (Feed, Vibe, Clar AI raised centre, Goal, Home, You); old nav untouched when the flag is off
- Status: **QUEUED**  · Batch: B5  · Depends on: —
- Done-when: Flag OFF (default): full existing Playwright suite + bottom-nav visual baseline unchanged. Flag ON (?nav=2 or feature_flags.nav_v2): 6 new buttons visible, 9 old ones hidden; each of Vibe/Clar/Goal/Home opens its section; Clar AI is the centre raised button; active highlight follows navigation incl. Fortune/Profile->You and Self->Home; no horizontal overflow; screenshot baseline for the nav_v2 bar. ?nav=0 turns the dev override off.

### T-005b — nav_v2: Feed tab hosts Community as a real tab (nav stays visible) with slim Following / Discover / Board sub-tabs
- Status: **QUEUED**  · Batch: B5  · Depends on: T-005a
- Done-when: With nav_v2 ON: Feed opens Community above the nav (nav still visible and usable), no close button, sub-tabs Following/Discover/Board switch the three Community views (mocked signed-in profile), inner You tab hidden; signed-out visitor sees the Google gate with the nav still usable; leaving Feed via another nav button closes it cleanly; flag OFF: Community behaves exactly as before (existing tests green).

### T-005c — nav_v2: You tab = Profile + entries for Fortune and My Community profile
- Status: **QUEUED**  · Batch: B5  · Depends on: T-005a
- Done-when: With nav_v2 ON: You opens the existing Profile section with a top card offering Fortune and My Community profile; Fortune opens the existing Fortune section and keeps You highlighted; My Community profile opens the Community you-view; existing Profile content untouched (tests green).

### T-005d — nav_v2: Self becomes a plate under Non-Negotiables on Home (opens the whole Self tab as-is)
- Status: **QUEUED**  · Batch: B5  · Depends on: T-005a
- Done-when: With nav_v2 ON: Home shows a Self plate directly below the Non-Negotiables card; tapping it opens the unchanged Self section and keeps Home highlighted; with the flag OFF the plate is absent and Home is unchanged.

### T-013 — Promote v247 (dark: nav_v2 OFF by default) with rollback tag and push; confirm the live site serves it
- Status: **QUEUED**  · Batch: B5  · Depends on: T-011, T-010, T-005b, T-005c, T-005d
- Done-when: Full ops/verify.js passes on clarvoyance_v247.html; node ops/promote.js clarvoyance_v247.html --push succeeds (tag pre-v247); live https://clar.co.in/ serves label v247 and sw cache clv-v247 (curl); default experience for a fresh visitor identical to v246 except the fixed video upload.

### T-014 — Documentation of the release: CLAUDE.md v247 entry, PROJECT.md, RUNLOG, TASKS render, memory
- Status: **QUEUED**  · Batch: B5  · Depends on: T-013
- Done-when: CLAUDE.md has a v247 entry (what, verified how, rollback, owner steps); docs/PROJECT.md mentions nav_v2 + usage rpc; TASKS.md rendered; memory index updated.
