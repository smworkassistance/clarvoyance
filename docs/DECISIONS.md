# DECISIONS LOG

Append-only. Every decision the owner and Claude agreed, with date. Newest sections at the bottom.

## 2026-09-24/25 — decisions carried over from TASKS.md v1

1. Build ONLY in `clarvoyance_v246.html` (copied from index.html = v245). index.html / sw.js / older versions untouched. Nothing existing may break (rule 11). UI = Instagram/YouTube/Facebook standard (rule 12).
2. Run order approved: B1 (T-002, T-003) -> B3 (T-009) -> B2 preparation (T-006, no real key yet). Local commit per task, no push, no promote.
3. Nav target (T-005, NOT in this run): 6 tabs Feed / Vibe / Clar AI (raised centre button, still a tab) / Goal / Home / You. Fortune moves into You (You already has usage+status). Self = plate under Non-Negotiables on Home, tap opens whole Self tab as-is. Home NN/quests do NOT go into You. Board + Discover = slim sub-tabs on top of Feed (Following / Discover / Board) without changing feed's look. Community's inner "You" merges into main You.
4. Feed-first start page (T-004) only behind a feature flag, default OFF, gradual rollout. Fortune theme match (T-008) after T-005. Invite + small goal circles (T-007) later; public groups + location discovery deferred until user density; DMs deferred (if ever: Supabase Realtime, not a paid chat SDK).
5. Video: budget-first. Stream has no free tier. Options: R2 free (mp4, 30 s / ~20MB cap) vs Bunny (~$1/mo, auto-transcode). Owner undecided; Claude recommends Bunny; B2 is provider-neutral prep until owner picks + supplies key.
6. Supabase MCP (read-only) not yet connected: owner must run `claude mcp add` in PowerShell (not SQL editor) with a token. Never paste the token in chat.
7. Reels-standard video player spec: vertical, snap scroll, autoplay when visible (muted), tap pause/play with icon, mute toggle, progress bar, double-tap like, app theme.
8. Owner's Vibe-feed video complaint (needs a tap to start, no pause button) = T-009.

## 2026-09-25 — Delivery process (ADK) and responsibility

- **Responsibility moved to Claude (owner's instruction, 2026-09-25):** "ab se saari jimmedari aapki hai… Clar ki success ke liye responsible moves lena." Claude is accountable for outcome, not breaking the system, completeness, records, and for collecting all prerequisites up front. Owner keeps: product decisions, taste, human-only steps, and turning dark-launched features on. (Full text: `docs/PROCESS.md` §0.)
- **Why:** the 2026-09-24 overnight run delivered only the `QUEUED` subset while five decided items were never built and nothing forced the agent to continue (see `docs/INFRA-PLAN.md` §1).
- **Adopted:** `tasks.json` state machine (DONE only with evidence + fresh full verify), frozen batch contracts, Stop hook active only during a declared run, Playwright regression gate (Chromium/Android + WebKit/iPhone), dark launch behind feature flags, promote/rollback scripts with tag `pre-vN` and service-worker cache bump.
- **Rejected/deferred:** Ralph plugin (self-declared completion), Spec Kit installer, claude-task-master, BMAD, worktrees (not needed yet), Superpowers plugin (rule adopted, plugin not installed), scoped Cloudflare/Supabase tokens (Phase 2, owner decides).
- **Rule change:** the old "never promote/push unless told" rule (TASKS v1 rule 7) is replaced by PROCESS §7: after a full verify pass Claude may promote **dark** changes and push, announcing the rollback command; activating a flag for users or promoting a non-dark user-visible change needs the owner's go-ahead.
- **Owner-facing simplification:** one intake per batch (`docs/templates/BRIEF.md`), one clarification round with recommended defaults, then no more questions except genuine blockers.
- **Defaults chosen for the first batch (owner may override):** T-010 via a Supabase function (SQL run by owner ⇒ that part BLOCKED, rest continues); T-004 collapses into flag `nav_v2` (T-005 built behind it, 4 stages); T-008 after T-005(b); T-007 deferred to its own discussion; run time box 3 h.

## 2026-09-25 — Guides: how content is chosen (owner's direction)

- **Principle (owner):** do not whitelist a small set of authors. A guide has a *theme* (relationships, motivation, business…); any genuinely helpful content is welcome; content that goes against the app's philosophy is rejected. Philosophy judgement is **AI's job** (verifier `on_philosophy`), not a script's.
- **Hard rule kept (why):** names, quotes and facts must come from the *sources*, never from the model's memory — the verifier caught a fabricated "Brené Brown" quote. Authors therefore come from real Wikiquote theme pages (speaker read from the attribution line), not from a hand-picked list.
- **A member's own intention is searched live** (Google News RSS, headline+link only) so niche goals are not limited to our fixed feeds; a private guide is never rejected for being specific (only a NOT-ALLOWED list applies).
- **First post must not be withheld:** a user guide with no post retries every ~10 min (cron 15 min) instead of waiting 3 h.
- **Infra rule:** Worker→Worker calls inside one Cloudflare account use service bindings, not workers.dev URLs (404/1042). Every Worker edit bumps `X-Worker-Version` so the deployed code can be verified with curl instead of trusting a paste.

## 2026-09-26 — Batch B8 (v253): video speed/sound, Guides split, fresh feed, leagues, notifications (owner decisions)

- **Devices:** Android app (Capacitor) + Android Chrome/PWA + iPhone Safari. Sound on by default; a real browser refusal falls back to muted with a "Tap for sound" pill (iOS needs a tap).
- **Zero-delay video:** keep YouTube (optimised: true aspect ratio so no black bars, a 2-player pool so the next video starts in ~50 ms) and add **Clar Reels** — free Pexels stock clips re-hosted on our Bunny library with a real quote on top (own files, so overlays are allowed). YouTube files are never re-hosted (ToS).
- **Swipe on the video:** native CSS scroll-snap pages — a cross-origin iframe swallows JS touch events but not native scrolling.
- **Guides:** a post is either text or video, never both; the video post gets its own short caption written from the video's title.
- **Board = weekly leagues** (Duolingo-style): cohorts of up to 20 of the same tier, ranked by XP *gained* this week (IST Monday start); top 5 up, bottom 3 down (cohorts of 10+); recap card, cheers, all-time hall kept. Falls back to the old global board if the SQL is not installed.
- **Feed is always fresh:** unseen posts first, "all caught up" divider, rotating suggestions; pull-to-refresh on Feed/Discover/Guides/Board. **Notifications** are database-trigger rows (likes collapse per post), bell + unread dot, opening marks read.
- **Every new query soft-fails** to the previous behaviour when its table/RPC is missing, so the code can ship before the owner runs `db/schema_v253_b8.sql`.
