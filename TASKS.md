# TASKS.md — Clarvoyance task queue

> One file, one table, append-only. Claude reads this at the start of a work session.
> Created 2026-09-24 03:55 IST.

## RULES (Claude must follow these exactly)

**What Claude is allowed to execute**
1. Claude executes ONLY rows whose Status is `QUEUED` **and** whose Batch matches the batch the user named in the current message (e.g. "run batch B1"). No batch named → run nothing, ask.
2. `DONE`, `BLOCKED`, `DISCUSS`, `STALE`, `DROPPED` rows are NEVER executed. A `DONE` row is frozen history — never re-run, never edited except its Result note.
3. New work = a NEW row with a NEW ID. IDs are never reused or renumbered. Do not rewrite old rows to "reuse" them.

**Staleness (date + time on every instruction)**
4. Every row has `Added` (date + time, IST). If a `QUEUED` row is **more than 24 hours old** at the moment Claude picks it up, Claude must NOT implement it. It sets the row to `STALE`, and asks the user "still valid? / changed?" first. Only after the user confirms does it go back to `QUEUED` (with a fresh `Added` timestamp and a note).
5. Always prefer fresh instructions: if the user's chat message contradicts a row, the chat message wins and the row is updated/dropped.

**Guardrails**
6. Always build in a NEW version file (`clarvoyance_vNNN.html`). Never edit older version files. Do not disturb anything else.
7. Do not promote to `index.html`/`sw.js`, do not `git push`, unless the user says so for that specific task.
8. Local `git commit` per finished task is allowed (one task = one commit).
9. Auth-gated testing (Google sign-in, Community) uses an isolated Chrome context / disposable account, never the owner's real signed-in profile. Clean up all test rows afterwards.
11. **Nothing that works today may break (owner's top rule).** Every task's version file must pass a regression check before it is called DONE: all inline `<script>` blocks parse; app boots with 0 console errors; every existing bottom-nav tab opens; Clar chat sends and gets a reply; Vibe feed renders a card; Community opens; Goal, Home (NN), You/Profile open. Result column must state what was checked. Any regression = task is not DONE; fix or leave the change out. Feed's current look stays as is; new sub-tabs must not visually disturb it.
12. **UI standard:** anything new looks like Instagram / YouTube / Facebook: clean, borderless, generous spacing, smooth transitions, real icons, no boxy "form-like" cards. Uses the app's own theme colours so light/dark still works. Checked in a mobile-emulated screenshot before DONE.
10. SQL migrations / Worker redeploys need the owner's manual step: mark the task `BLOCKED` with the exact step needed, do not pretend it is done.

**Status values:** `DISCUSS` (idea, not executable) · `QUEUED` (ready, has Done-when) · `IN_PROGRESS` · `DONE` · `BLOCKED` (waiting on owner/manual step) · `STALE` (>24h, needs re-confirm) · `DROPPED`

**A task is not QUEUED until its Done-when column is filled.** No Done-when → it stays `DISCUSS`.

## TASK TABLE

| ID | Added (IST) | Task | Done-when (machine-checkable) | Status | Batch | Version file | Completed (IST) | Result / notes |
|----|-------------|------|-------------------------------|--------|-------|--------------|-----------------|----------------|
| T-001 | 2026-09-24 03:55 | Community redesign: feed as first page, Board/Discover/Groups model, video (Bunny vs alternatives), chat (own vs service), tab layout (Clar AI / Vibe / Fortune placement), ClarZone<->Community blending, faster Community open | Discussion agreed with owner; then split into separate T-rows with their own Done-when | DISCUSS | — | — | — | Research + discussion in progress; nothing to build yet |

| T-002 | 2026-09-24 04:20 | Community opens fast: cache own profile + last feed locally, render instantly on open, refresh in background (stale-while-revalidate); prefetch after auth resolves; drop the serial 1.5s `_isGoogleUser` wait when a cached session flag exists | In real Chrome (isolated context, disposable account): (a) 2nd open shows feed content with no skeleton within 300 ms of tap, measured by performance.now(); (b) cold-open time before vs after recorded in Result; (c) signed-out user still sees the sign-in gate; (d) console errors = 0; (e) after background refresh, new post appears without reopening | DONE | B1 | clarvoyance_v246.html | 2026-09-24 06:05 | Measured in real Chrome (isolated ctx, disposable anon account, Fast 4G throttle, same harness on old v245 vs v246): OLD open-to-content 1288 / 1326 / 1941 ms; NEW warm open 35 / 96 / 35 ms (cache); NEW first-ever open (no cache) 1812 ms. Also verified: signed-out still gets the sign-in gate even with cache present; a different account's cache is NOT used (skeleton then normal load); a new post inserted after the cache was written shows up via background refresh with no reopen (first paint didn't have it, 3.5 s later it did); console errors = 0; all 48 script blocks parse. Cache is per-uid (`clv_soc_cache_v1`), cleared on profile delete, dropped on follow/new post. |
| T-003 | 2026-09-24 04:20 | Feed never empty: an official "Clar" account posts (owner-editable content table) so a brand-new user with zero follows still sees real posts | New account with 0 follows sees >=1 post labelled "Clar" (verified in real Chrome); Clar posts cannot be liked-as-impersonation of a real user; posts editable without code; SQL file written + parse-checked | QUEUED | B1 | clarvoyance_v246.html + db/schema_v246_*.sql | — | Will end BLOCKED: owner must run the SQL (Supabase MCP is read-only) |
| T-004 | 2026-09-24 04:20 | Feed-first start page behind a feature flag (`feed_first`, default OFF, % rollout) so returning users' Clar-AI-first habit is not broken for everyone at once | — | DISCUSS | — | — | — | Needs nav layout decision (T-005) first. Big product bet: Clar AI is the current start tab by design |
| T-005 | 2026-09-24 04:20 | Bottom-nav restructure. Owner decisions 2026-09-24: Vibe stays its own tab; Fortune moves INTO the You tab (You already has usage + status); Home's NN/quests are NOT moved into You. Proposed 6 tabs: Feed / Vibe / Clar AI (raised centre button) / Goal / Home / You. Owner 2026-09-24: Self becomes a plate under Non-Negotiables on Home, tap opens the whole Self tab as-is. Board + Discover become top sub-tabs inside Feed (Following / Discover / Board); Community's inner "You" merges into main You tab | — | DISCUSS | — | — | — | DECIDED 2026-09-24: Clar AI = raised centre nav button (still a real tab, no chat-code refactor). Feed sub-tabs (Following/Discover/Board) must be slim and not change the feed's current look |
| T-006 | 2026-09-24 04:50 | Video in Community posts (30 s cap, size cap ~20MB) on Cloudflare R2 free tier (owner wants FREE; Stream has no free tier, so R2 mp4 first, upgrade to Stream later if needed): upload Worker, DB field, upload UI, Reels-standard vertical player (snap scroll, autoplay when visible, tap pause, double-tap like, mute toggle, progress bar, app theme) | Worker + SQL + client built and syntax-checked; upload/playback flow tested against a mocked Worker in real Chrome (no real key yet); status set BLOCKED with exact steps: (1) Cloudflare Stream enabled, (2) Account ID + API token (Stream:Edit) as Worker secrets, (3) run SQL, (4) deploy Worker | QUEUED | B2 | clarvoyance_v246.html + workers/stream-relay-worker.js + db/schema_v246_video.sql | — | Owner gives key at the end; Claude prepares everything else first |
| T-007 | 2026-09-24 04:20 | Invite friends link + small goal "circles" (3-8 people) for growth loop | — | DISCUSS | — | — | — | Public groups deferred until user density exists |
| T-008 | 2026-09-24 04:20 | Fortune theme match (dark cosmic -> app theme, light+dark) | — | DISCUSS | — | — | — | Depends on T-005 |
| T-009 | 2026-09-24 05:10 | Vibe Feed video card feels like Instagram/YouTube: starts by itself (muted autoplay is what mobile browsers allow), visible tap-to-pause/play icon, mute/unmute button, thin progress bar, swipe still skips, smooth | Mobile-emulated real Chrome: video card starts playing within 2 s with no tap; tap toggles pause/play with a visible icon; mute toggle works; swipe up still advances; 50%-watched XP still unlocks; other card types unchanged; regression rule 11 passes. Real-phone behaviour cannot be proven in emulation - stated in Result | QUEUED | B3 | clarvoyance_v246.html | — | Reported by owner 2026-09-24: video needs a tap to start and has no pause button. Runs after B1 in the same v246 file |

<!-- Append new rows above this line (inside the table). Never edit rows above except Status/Completed/Result. -->
<!-- B3 = T-009 (created 2026-09-24 05:10; STALE after 2026-09-25 05:10). Run after B1. -->
<!-- NEXT ID: T-010 -->
<!-- BATCHES: B1 = T-002, T-003 (created 2026-09-24 04:20; goes STALE after 2026-09-25 04:20 if not started) -->
<!-- B2 = T-006 (created 2026-09-24 04:35; STALE after 2026-09-25 04:35). Run B2 only after B1 is DONE, same v246 file. -->

## DECISIONS LOG (everything agreed with the owner, 2026-09-24 session — do not lose)
1. Build ONLY in `clarvoyance_v246.html` (copied from index.html = v245). index.html / sw.js / older versions untouched. Nothing existing may break (rule 11). UI = Instagram/YouTube/Facebook standard (rule 12).
2. Run order approved: B1 (T-002, T-003) -> B3 (T-009) -> B2 preparation (T-006, no real key yet). Local commit per task, no push, no promote.
3. Nav target (T-005, NOT in this run): 6 tabs Feed / Vibe / Clar AI (raised centre button, still a tab) / Goal / Home / You. Fortune moves into You (You already has usage+status). Self = plate under Non-Negotiables on Home, tap opens whole Self tab as-is. Home NN/quests do NOT go into You. Board + Discover = slim sub-tabs on top of Feed (Following / Discover / Board) without changing feed's look. Community's inner "You" merges into main You.
4. Feed-first start page (T-004) only behind a feature flag, default OFF, gradual rollout. Fortune theme match (T-008) after T-005. Invite + small goal circles (T-007) later; public groups + location discovery deferred until user density; DMs deferred (if ever: Supabase Realtime, not a paid chat SDK).
5. Video: budget-first. Stream has no free tier. Options: R2 free (mp4, 30 s / ~20MB cap) vs Bunny (~$1/mo, auto-transcode). Owner undecided; Claude recommends Bunny; B2 is provider-neutral prep until owner picks + supplies key.
6. Supabase MCP (read-only) not yet connected: owner must run `claude mcp add` in PowerShell (not SQL editor) with a token. Never paste the token in chat.
7. Reels-standard video player spec: vertical, snap scroll, autoplay when visible (muted), tap pause/play with icon, mute toggle, progress bar, double-tap like, app theme.
8. Owner's Vibe-feed video complaint (needs a tap to start, no pause button) = T-009.

## RUN LOG (Claude appends here as it works, so an interrupted run is always resumable)
- 2026-09-24 05:16 run started. clarvoyance_v246.html created from index.html (hash identical to v245).

## SUPABASE ACCESS
Read-only Supabase MCP NOT yet connected (needs owner to create a token and run the `claude mcp add ...` command in a normal terminal, not the SQL editor). Until then Claude verifies with anon-key curl as before.
