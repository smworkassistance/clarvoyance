# Clarvoyance — Project Blueprint

> This file is the single source of truth for architecture, data flow, and decisions.
> Update it whenever a significant feature is added, changed, or removed.
> Claude reads this at the start of every session.

---

## What is Clarvoyance?
A self-development app (mobile-first PWA). Core idea: the user opens it daily, chats with Clar AI companion, gets a personalised Vibe Feed of micro-exercises, and builds a streak. Tools, chargers, goals, quotes, and modules are layered on top. Mood is handled naturally through Clar conversation (not a separate UI element).

Hosted on GitHub Pages. Single HTML file. No build system.
Repo: https://github.com/smworkassistance/clarvoyance

### Product Philosophy
> Clarvoyance optimizes for daily micro-action over comprehensive tracking. Every interaction must be completable in under 2 minutes. The app is mood-first, not goal-first — it meets the user where they are emotionally, not where they think they should be. It should feel like a trusted friend checking in, not a productivity coach demanding output. Every new feature must pass this test: does it lower friction or add it?

---

## Tech Stack
| Layer | What |
|-------|------|
| Frontend | Single HTML file (vanilla JS, CSS, no frameworks) |
| Backend / Content | Google Sheets + Apps Script Web App (JSON API) |
| Hosting | GitHub Pages (index.html = latest stable version) |
| Storage | localStorage (all user data) |
| Analytics | GA4 (G-BZZMW9B8SN) + Microsoft Clarity (wydll6jrxn) |
| PWA | sw.js (cache version clv-v155), manifest.json, beforeinstallprompt — **bump CACHE_VERSION on every release** |

---

## File Versioning Convention
```
clarvoyance_v[MAJOR].[MINOR]_[description]_[STATUS].html
STATUS: TESTING | STABLE
```
- `index.html` = always the latest pushed stable/testing version (what users see on GitHub Pages) — currently **v155**
- Never edit old version files — always create a new version
- After pushing a new version, always copy it to index.html and push that too

**Version history:**
| Version | What was added |
|---------|---------------|
| v38 | Language selection onboarding |
| v39 | Mood onboarding |
| v40 | XP system |
| v41 | Tool registry system (dynamic file-based loader) |
| v42 | Google Sheets integration + Mind Chargers tab |
| v43 | Full Sheets integration (tools, modules, quotes, revise) |
| v44 | Vibe feed redesign foundation |
| v45 | Nickname onboarding, full vibe feed rebuild (7 card types), tools from Sheets |
| v46 | Vibe feed cards moved from hardcode → Google Sheets |
| v47 | Daily quest home-only, NN on home screen, NN edit + subpoints, tab swap |
| v48 | UI polish — tools grid, XP display size, tray layout, skip hint, next btn removed |
| v51 | Full visual redesign — Unified Material Design style (Claude Design output) |
| v52 | Clar AI companion chat — Gemini 2.5 Flash via Cloudflare Worker proxy |
| v53 | Intelligent Clar AI — full context system prompt, user profile, daily summaries, auto-profile update |
| v56 | Clar persona selection — 4 styles (Best Friend, Wise Guide, Coach, Nurturer) in onboarding + profile |
| v57 | Clar conversation flow — 3-phase model, Talk/Act session intent chips, card reason rendering |
| v58 | Search fix (no-results msg, reset on tab switch & back), My Quotes collapsible with count badge, language screen removed from onboarding, charger click bug fix (always opened topmost) |
| v59 | Chargers redesign — two-level inline accordion (categories + chargers expand in-place), icon in each row, auto-XP on word count, fullscreen button, no separate writer screen, no "I'm Charged" button, hairline list layout, Apple-style sticky search |
| v60 | Tools tab same accordion layout as chargers — categories from `category` column in tools sheet (no new Sheets tab), fullscreen heading highlight (gold), old grid/writer/toolSearch removed |
| v61 | Physical practice tools — read-only steps, duration chips (30s/1m/2m/3m/5m/10m), countdown timer, XP on completion. Default start tab → Clar AI |
| v62 | Sheets fetch: 30s timeout + retry button + SHEETS_FAILED flag + sheetsDataFailed event. New Apps Script URL (CORS fix via redeploy) |
| v63 | Fix blank vibe feed on start (vfInit re-run after sheetsDataReady), enforce Clar AI as start tab, updNNBadge null check |
| v64 | Mood UI removed — feeling chip, XP chip, emotion ribbon, mood start screen all gone. Clar AI handles mood naturally in conversation |
| v65 | Type scale fix — charger/tool category and item names use Inter Tight (matching daily quest font) instead of Cormorant Garamond |
| v66 | PWA install prompt + service worker auto-update (sw.js v66 → v67 isGenuineUpdate fix) |
| v67 | PWA UX — Later button replaces ✕ dismiss, persistent Install row in Profile tab, CSS fix (#pwa-prompt → #pwa-card), pwaInstallFromProfile() |
| v68 | PWA UX polish — pwa-card display:none on load (no flash), update toast removed, Profile App section: Install row + Updates row (Check / Up to date / Tap to update) |
| v69 | PWA fixes — how-to sheet proper UI (handle, numbered steps, styled), install card only on home/chat tab, red dot on profile chip when update ready |
| v70 | PWA clean — manual Check button removed, prof-update-row appears only on SW_UPDATED, app section auto-hides when installed+no-update |
| v71 | Analytics — GA4 (G-BZZMW9B8SN) + Microsoft Clarity (wydll6jrxn). Events: app_open, tab_view, vibe_card_complete/skip, xp_gained, clar_session_start, clar_message_sent, tool_open, charger_open, pwa_install_tapped/later |
| v72 | Offline support — sw.js v68 caches Sheets Worker response; 3-layer fallback: localStorage → SW cache → retry button; offline bar shown when serving stale data |
| v73 | Offline notifications — bar slides in on network loss, hides on reconnect + Sheets auto-refresh; Clar shows inline offline message instead of failed API call |
| v74 | Offline bar UI — Clar gold theme (var(--acc)), minimal "✦ Offline" text, uppercase
| v75 | Profile App section — always shows version (v75) + status + Check/Reload button; _setUpdateStatus() exposed globally |
| v76 | Transparent offline bar (frosted glass, gold tint) + Connect card in Profile (WhatsApp +917387400467, Instagram @beyond._thought) with official SVG brand icons |
| v77 | Profile redesigned with 4 tabs: Identity (photo upload via file picker → base64 localStorage, name/gender/age/city), Clar (persona + context merged), Updates (v77 version + check), Contact Us (WhatsApp/Instagram) |
| v78 | Profile tab labels: Identity→Profile, Clar→Clar AI; Tools category names (Mental Reset/Physical Reset) text color changed from gold to ink (matching charger rows) |
| v79 | Fix update detection — sw.js CACHE_VERSION clv-v68→clv-v79 (root cause: browser never saw a changed sw.js so SW_UPDATED was never sent); pwaCheckForUpdate now checks reg.waiting first, listens to updatefound event, 5s timeout |
| v80 | Home redesign: mood chips + goal prompt removed; Clar Commitment card (expandable, 200 words=+100XP); Chargers/Tools/Revise embedded on home via CSS flex ordering; quest moved to bottom; bottom nav → 4 tabs (Home/Vibe/Goal/Clar AI); Goal tab: Short Term Goals + Issues & Resolutions sections |
| v81 | Home fix: Chargers/Tools/Revise shown as nav card shortcuts on home (not full content); NN progress bar removed from home-widget (XP only); visibility leak fixes — clv-commitment/home-nav-cards/short-goals/issues-section added to bnavSwitch all[] array; Chargers/Tools/Revise restored as proper bottom nav tabs (7 tabs); sw.js CACHE_VERSION bumped every release |
| v82 | Greeting redesign — two-line layout (✦ LABEL small-caps + Name 2.4rem Cormorant serif, solid ink color, no invisible gradient clip); Chargers/Tools/Revise removed from bottom nav (display:none + removed from MODULE_TAB_MAP so applyModules can't un-hide them); NN section removed from home tab; Short Term Goals + Issues use goal-row card style; Curated Quotes in Revise = single container with hairline separators |
| v83 | Home reorder — Vibration Score widget removed from home; Clar Commitment → top (order:2 below greeting); Non-Negotiables → bottom of home (nnTabSec added to map.home, order:10); Greeting → single line inline ("✦ QUIET HOURS, Videh" flex-row align-items:baseline, name 1.9rem serif italic) |
| v84 | Chat UI redesign — WhatsApp-inspired: persona avatar header (✦ circle + "Clar" serif italic + persona label e.g. "your best friend"), warm-tinted message area, borderless assistant bubbles (white + micro-shadow), pill input + circular send button, tight 4px gap with auto 10px gap on sender switch, typing dots match bubble style |
| v85 | Chat full-screen (global header hidden on chat tab); Persona color system — Sienna Coral/bestfriend, Viridian/guide, Cobalt/coach, Amethyst/nurturer — applied to avatar gradient + user bubbles + persona chip active colors; Clar header tappable → opens Clar AI settings pane with ← Back to Clar button; body[data-persona] attribute updated on persona select + initChat |
| v86 | Chat fixes — (1) blank white space removed (padding-top:60px→0 since header hidden); (2) persona color moved to Clar's bubble (light tint + left accent stripe), user bubble back to consistent gold; (3) keyboard fix — on chat input focus: bottom nav hidden + chat extends to bottom:0, restores on blur |
| v87 | Bubble color swap (user=white+shadow, Clar=full persona color+white text); input box border-radius:24px forced on :focus so shape stays pill after keyboard opens; profile-section made position:fixed full-screen overlay (z-index:200) so it covers any tab cleanly |
| v88 | Send button white (background:var(--su), persona-colored icon); Clar AI nav tab icon changed from 💬 → ✦ serif; profile tab bar fixed to 4 equal 25% tabs (flex:0 0 25%, font-size:.72rem, "Contact Us" → "Contact") |
| v89 | Profile overlay z-index fix — bumped from 200 → 1000 so it correctly covers the global header (z-index:500) when opened from Home/Goal/any non-chat tab |
| v90 | Profile section redesigned as normal tab — removed position:fixed overlay; header + bnav stay visible when profile is open; content scrolls naturally between them |
| v91 | Profile added to bnavSwitch system — openProfileTab() routes through bnavSwitch(fakeEl); _doOpenProfile() handles data loading; map.profile=[profSec] ensures only profile content shows, no stray home/goal elements |
| v92 | One-time user registration form in onboarding (after nickname, before persona) — fields: name, email*, purpose* (chips), gender, age group, phone. Saves to clv_user_identity so profile auto-fills. clv_registered flag prevents re-showing. Fire-and-forget POST to Sheets Worker. |
| v93 | Reg form fixes — proper email regex (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/), country code dropdown (16 countries, +91 default) + phone input side by side, country text field added; all saved to clv_user_identity |
| v105 | Fix Clar AI snapping back — removed _enforceStartTab 600ms/1500ms timers that kicked users back to chat tab after navigating away |
| v106 | Peak State card added to Self tab (first accordion item) — "I Am That I Am" tagline, rampage textarea, 68-second hold timer with SVG ring, +15 XP on completion (once/day) |
| v107 | Clar AI context expanded — Self tab practices with full WHY+WHEN descriptions injected into system prompt; manifestation_steps sheet injected (title+why per step); new MANIFEST card type Clar can suggest that opens the Manifestation Protocol overlay |
| v112 | My Foundation overlay — "✦ Foundation" button next to Manifest in Goal header; bottom-sheet overlay with "Why I Started" textarea + "My Tribe" multi-entry inspirations (name, category, @handle, link); saved to clv_my_why + clv_my_tribe in localStorage |
| v113 | My Personal Space — free-flow writing accordion at top of Self tab (above Peak State); charger-style layout with fullscreen button; text persists to clv_myspace_text in localStorage |
| v114 | True View Chart — perspective shifter / thought mold in Self tab; two colored zones (Story 1 pink=Illusion, Story 2 green=Pure Abundance) with annotation chips; vertical frequency bar animates as Story 2 fills; 68-second Truth Lock (+20 XP); saves to clv_tv_story1 + clv_tv_story2 |
| v115 | Pure Abundance — full-screen overlay in Self tab (opens with Back button, not accordion); two concentric zones: Cerulean outer (Infinite Intelligence — I Am the Infinite) + Silver Grey inner ring (Resistance, 50% smaller via 22% margin); English named colors with emotional associations as color tags; 68-sec absorption lock (+20 XP once/day); saves to clv_pa_field + clv_pa_ring |
| v116 | Visual skin overhaul — Apple-inspired design (SF Pro system font stack, bigger font sizes, frosted glass bottom nav); full English colour palette: 24 named colours (Racing Green → Stone) + Classic & Dark presets; accent selection auto-generates tint variants via JS colour math (_applyAccent); XP/streak elements use var(--acc) not hardcoded amber; all italic/Cormorant fonts removed from card content; theme saved to clv_theme in localStorage |
| v117 | "Where are you right now?" check-in moved from Self tab → Profile Updates tab (above Contact); Goal tab dark-canvas colors replaced with theme-consistent surface (color-mix acc+su); dark preset still restores immersive dark look for goal-row |
| v118 | "Where are you right now?" removed entirely; Goal tab: 3 sections (Major Definite Goal, Issues & Resolutions, General Manifestation) converted to single self-acc accordion with hairline separators + click-to-expand; issue/GM list items changed to hairline-separated rows (no card boxes); Add Link removed from Major Definite Goal; goalToggle() function added |
| v119 | PWA mobile overflow fixes — html+body overflow-x:hidden prevents horizontal page scroll; bnav overflow:hidden stops nav from being scrollable/pannable; header timer (tmr) scaled down so profile chip stays visible; vibe feed topbar score-wrap margin-left:auto so XP number always stays on right |
| v120 | Supabase data layer — Supabase JS CDN + anon auth; `_fetchFromSupabase()` queries all 11 content tables in parallel; `_fetchContentData()` single entry point (Supabase primary → Sheets Worker fallback, isolated for easy removal); `db/schema_v120.sql` contains full CREATE TABLE + RLS + INSERT for all 11 tables |
| v121 | User data sync — 6 Supabase user tables (user_profile, user_progress, user_goals, user_nn, user_clar, user_revise); anonymous auth; pull on load, push on every save; hooks into xpAdd, sv(), issSave, gmSave, profile save, chat save, persona + theme change; `db/schema_v121.sql` |
| v122 | Google OAuth — "Continue with Google" button in Profile Identity tab; anonymous → Google upgrade via linkIdentity (preserves user_id, no migration); auth state listener updates UI; one-time nudge after first Clar exchange; sign-out; Google name + photo shown when signed in |
| v123 | Profile account section redesign — standard app-style (iOS Settings pattern) at top of Identity pane: avatar circle + name + green sync dot when signed in, person icon + "Continue with Google" button when signed out; old sync-card removed; profile tab overflow-x fixed (screen no longer pans horizontally in PWA) |
| v124 | Sign-out data race fix — `_pullUserData()` snapshots uid before await and discards results if user signed out mid-flight (prevents 30-second slow clear); sign-out now calls `_doOpenProfile()` + `xpRefreshAll(0)` immediately so form empties instantly; sign-in calls `_doOpenProfile()` after pull so new user's data appears without navigating away |
| v125 | Streak upgrade — `clar_streak` (int, hard-reset) replaced by `clv_momentum` (float, 5%/day decay); 1 weekly freeze (user-prompt toast on miss); Clar time ≥20 min = no decay, ≥10 min = half decay; 7/14/21-day MILESTONE vibe cards (+20 XP, injected once per threshold); Clar daily usage tracked per-tab via focus events in `clv_clar_times`; time label shown in chat header; `#xp-streak-num` fixed (was always showing 0 in v124); `db/schema_v125.sql` adds `momentum`, `freeze_week`, `freeze_used`, `clar_daily_min` to `user_progress` |
| v126 | Mirror section on Home — weekly AI reflection via Gemini (same Cloudflare Worker); shows after ≥2 Clar summaries; collapsible card with personal reflection, two-path prediction (keep going / pause), auto-cached per day in `clv_mirror_cache`; ✦ Share your journey: Canvas 540×540 achievement card (streak, XP level, AI achievement line, watermark) with Save Image + native share sheet; daily log: `user_daily_log` Supabase table (`db/schema_v126.sql`) inserted once/day on app open |
| v127 | Mirror renamed → **Pulse** (AI Progress Tracker); fixes: Gemini `systemInstruction` format corrected, `responseMimeType` removed, robust JSON extraction (handles markdown fences + raw JSON), threshold lowered to ≥1 summary; new features: instant mood chip (Thriving/Building/Steady/Check in) computed from Clar time + momentum trend + quest done — no AI needed; 3 metric cards (Clar min, Streak, NN Done) with 7-day sparkline graphs (bar + line canvas); AI response expanded to include `recommendation` field → "💡 Right now" card; momentum history stored in `clv_momentum_history` (30-day rolling) for trend graphs; error message changed to "Tap ↺ to retry" |
| v138 | PWA + startup fixes (clean rewrite from v136) — (1) overscroll-behavior:none on html+body prevents rubber-band/page-pan without touching layout; (2) vibe-feed hidden in HTML + bnavSwitch(chat) runs before await load() so Clar AI appears immediately with no vibe-feed flash; (3) Fortuneteller full-screen fixed: position:fixed;inset:0 0 65px 0;overflow-y:auto like vibe feed; header+xp-bar hidden via body.fortune-tab; fortune-tab class toggled in bnavSwitch; canvas height uses sec.offsetHeight; (4) Header: overflow:hidden + logo-wrap min-width:0 keeps profile chip in bounds; @380px breakpoint hides profile name text |
| v139 | Startup speed — (1) `supabase-js@2` CDN script made `defer` so it no longer blocks HTML rendering (was causing blank white screen while ~200KB SDK downloaded synchronously); (2) `registry.js` also made `defer`; (3) main boot moved from `window.load` → `DOMContentLoaded` so Clar AI tab appears at earliest possible moment |
| v140 | Zero-flash startup — added `display:none` to 9 tab sections that were visible by default in HTML (`#dq-card`, `#home-widget`, `#clv-commitment`, `#home-nav-cards`, `#goal-row`, `#rr-quotes-section`, `.rr-row`, `#tl-main`, `#chargers-section`); these flashed on screen before `bnavSwitch(chat)` ran; now the page starts blank and only chat section appears |
| v141 | UI polish batch — (1) dark/light toggle removed from header bar (still accessible in Profile); (2) red NN dot hidden permanently from header; (3) tagline "clarity for the becoming" font-size reduced .76rem→.60rem; (4) Fortune tab gets eye SVG icon in NAV_ICONS; (5) Fortune section `overflow-x:hidden` stops sideways drift; (6) Fortune card text Apple typography (.ft-card-text system font stack, 1.08rem, .ft-card-lbl .72rem, notice text .88rem); (7) Fortune page title "Clairvoyance"→"Oracle", energy label "energy reading"→"field signal"; (8) Clar AI `body.chat-tab` class now set on `_hookNav` initial load so keyboard-focus handler correctly hides bottom nav; (9) Vibe feed multicolor/gold toggle removed — multicolor hardcoded forever (`vfSetStyleMode` init always writes 'multi'); (10) `.vf-score-wrap` gets `flex-shrink:0;margin-left:auto` so XP stays visible; (11) Pulse fix — `card.classList.add('open')` moved before `_renderMetrics()` so `.pulse-body` is visible when canvas draws; setTimeout 50ms→150ms |
| v142 | Fix 3 items from v141 that didn't land — (1) tagline: two more `!important` overrides at skin layer (cv-v50 style block + inline rule after `</body>`) changed to `.60rem!important`; (2) chat input: `padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))` on `.chat-input-wrap` handles iPhone X home indicator; `overflow:hidden` on chat section cssText prevents content spilling past `bottom:65px`; (3) Pulse clarMin fix: clar timer hook now calls `_stop()` BEFORE `orig.apply()` so time is committed to localStorage before `pulseLoad()→_renderMetrics()` reads it; `Object.values` replaced with `Object.keys` loop in both NN done calculations for older Android compat |
| v143 | Startup flash fix — root causes: (1) home bnav button had `class="active"` hardcoded in HTML so it appeared highlighted before JS ran; (2) `bnavSwitch(chat)` only fired at DOMContentLoaded which is blocked by `defer` supabase-js download (2-3s on mobile). Fix: chat button now has `active` in HTML; chat-section starts with full `position:fixed` CSS (not display:none) so it's visible from first paint; synchronous inline script at end of `<body>` calls `bnavSwitch(chat)` immediately (before defer scripts) to activate chat tab and deactivate home button |
| v144 | Icon/wordmark flash fix — `swapNavIcons()` and `swapWordmark()` only ran at DOMContentLoaded so emoji icons (🏠🎯etc.) flashed before SVG icons replaced them. Fix: both calls added to the end-of-body early script (v143) so icons render correctly from first paint; colour theme was already handled by existing early IIFE |
| v146 | Supabase sync for Pulse data — `clv_clar_times` (7-day session array) + `clv_momentum_history` (30-day) added to `user_progress` as JSONB; `clv_monthly_summaries` (Fortune 6-month AI meta) added to `user_clar`; push hooks: `_syncPushProgress()` called from `_saveMomentum()`, `_syncPushClar()` called when monthly summary saved; pull restores all three; `_clearUserLocalStorage()` now correctly clears them (restorable); `db/schema_v146.sql` has the 3 ALTER TABLE statements |
| v147 | Vision image cross-device sync — uploaded photos go to Supabase Storage bucket `vision-images` (`{uid}/{timestamp}.jpg`), URL replaces base64; pasted URLs stored directly; `vis_images` JSONB column in `user_goals` stores `[{src, note}]`; pull merges remote images not already on device; delete removes from Storage too; migration auto-runs on first launch (uploads any existing base64 photos); `db/schema_v147.sql` has ALTER TABLE + bucket + RLS |
| v148 | Destiny/Free Will onboarding screen — new first screen shown before nickname (once ever, key `clv_destiny_seen`): "Destiny or Free Will?" with two choices. Free Will → commitment text ("practice religiously... no shortcuts") + "I'm in" → saves `clv_life_choice=freewill`. Destiny → "That's fine, most people do" + two options: "I change my mind" (switches to Free Will commitment panel) or "I'll come back later" (saves `clv_life_choice=destiny`, continues normally). Daily re-engagement ritual added: first app-open of each day (tracked via `clv_ritual_date`) shows a full-screen swipe visual — dark "struggle/confusion/doubt/stuck" layer swipes away (drag gesture) to reveal a golden "clarity/flow/ease/power" layer with "Which one are you living today?"; every re-open later the same day instead shows a one-line tap-to-dismiss jhatka: "Has destiny grasped you, or have you grasped your destiny?" No push notifications involved — purely triggered by organic app opens. Hooks added in `_checkPersona()`/`selectPersona()` only; no other onboarding/init logic touched |
| v149 | Ritual polish + testing mode — (1) jhatka line now ends with "Be religious in your practices — all else will be taken care."; (2) swipe screen richer: 6 floating words per layer (was 4), pulsing glow orb + breathing "OR" behind center content, vignette on the struggle layer, and a drag-progress fill bar under the swipe arrow; (3) golden reveal screen now has an explicit "Continue ✦" button (`ritualDismissSwipe()`) instead of relying on invisible tap-anywhere; (4) **TESTING ONLY** — `_checkDailyRitual()` moved from the onboarding-gated call sites (`_checkPersona()`/`selectPersona()`, now just comments) to fire directly in `langInit()` on every app start, so the ritual can be reviewed without completing the full onboarding flow each time — revert before general release |
| v150 | Fix cross-device data loss on Google sign-in — root cause: `_signInWithGoogle` called plain `signInWithOAuth()`, which does not preserve the current anonymous `user_id`; it either creates a brand-new Supabase user (orphaning everything saved anonymously, e.g. goal vision images) or switches to a different existing row, so two devices signing into the *same* Google account ended up as different, disconnected accounts (confirmed via Supabase Table Editor showing 5 separate `user_id` rows in `user_goals`, several with their own independent `vis_images`). Fixed by using `sb.auth.linkIdentity()` first, which attaches the Google identity to the current session's user_id instead of starting a fresh sign-in; falls back to `signInWithOAuth()` only when that Google account is already linked to a different user (e.g. a second device), so it correctly joins that existing account instead of staying orphaned. New `_handleAuthRedirectError()` catches the "already linked" conflict on the post-redirect return URL and retries with plain sign-in. Note: the 5 pre-existing orphaned rows in `user_goals` are not auto-merged — only sign-ins going forward are fixed |
| v151 | Revise & Repeat tab reorder — the `.rr-row` images/media block (upload, image URL, doc links, image grid) moved above `#rr-quotes-section` (My Quotes & Thoughts) and `#sheets-revise-section` (Philosophy/curated quotes/learning channels), so images now show first. Pure DOM reorder — no CSS/JS logic touched, `map.revise` membership unchanged |
| v152 | Revise & Repeat image cross-device sync — mirrors the v147 vision-image pattern exactly: new `revise-images` Supabase Storage bucket (`{uid}/{timestamp}.jpg` per-user folders, same RLS as vision-images); new `rr_images` JSONB column on `user_revise`; `_uploadRRToStorage`/`_syncRRImagesToStorage`/`_deleteRRFromStorage` added alongside the existing vision equivalents; `sv('rr')` now pushes via `_syncPushRevise()`, `delRRItem()` deletes from Storage, `handleUpload()`'s rr branch triggers the base64→Storage upload, `_buildRevisePayload()` includes `rr_images`, and `_pullUserData()` merges remote `rr_images` into `S.rrItems` on load; migration for pre-existing base64 RR images runs the same way as vision images (2s after pull). `db/schema_v152.sql` has the ALTER TABLE + bucket + RLS — **must be run in the Supabase SQL editor for this to work** |
| v153 | Fix Goal-tab vision image strip (`_renderStrip`) — (1) delete button was only shown via `mouseenter`/`mouseleave`, which never fires on touch, so it never appeared on mobile; now always visible; (2) the continuous-loop scroll (`_wireEndlessScroll`, already fully written) was never actually called and the strip only rendered each image once, so there was nothing to loop between — now renders 3 back-to-back copies (when count>1) and wires up the endless-scroll reset so it loops seamlessly in both directions |
| v154 | Fix loop animation + cross-device delete sync for vision/RR images — (1) `.goal-row .vis-grid` has `scroll-behavior:smooth` in CSS, so the v153 loop-reset jumps animated visibly instead of snapping instantly; new `_jumpScroll()` forces `scroll-behavior:auto` for just the corrective jump; (2) `_buildGoalsPayload()`/`_buildRevisePayload()` only sent `vis_images`/`rr_images` to Supabase when at least one image remained, so deleting the last image never told Supabase anything changed — now always sent, even as `[]`; (3) the pull-merge in `_pullUserData()` was additive-only (only ever added remote images, never removed ones missing remotely), so deletions never propagated to other devices even when the push worked — now remote is treated as authoritative for already-synced (URL) images, while local base64 images not yet uploaded are preserved. **Requires `db/schema_v152.sql` to have been run** — until then, `user_revise` pushes (now always including `rr_images`) will fail if the column doesn't exist |
| v155 | Fix vision image strip still not looping — root cause found: the strip lives inside the "Major Definite Goal" accordion body (`#goal-body-major`), which starts `display:none`; the strip is built once at load time while hidden, so `offsetWidth` reads 0 and all of `_wireEndlessScroll`'s distance math (added in v153/v154) was permanently miscalibrated since `goalToggle()` never re-rendered on open. Fix: `goalToggle('major')` now calls `renderVisGrid()` when opening, rebuilding the strip with correct, visible measurements |
| v145 | Pulse clarMin + NN done fixes — (1) `_stop()` changed `Math.floor`→`Math.round` so sessions of 30+ seconds save as 1 min instead of 0 (was the main reason clarMin always showed 0 after short sessions); (2) NN done now counts only numeric main-item keys (`/^\d+$/.test(k) && val===true`), not subpoint keys like `s0_1` — fixes overcounting and inconsistency with nnTotal; (3) `clv_clar_times` removed from `_clearUserLocalStorage()` — Supabase only stores the scalar `clar_daily_min` so the full date-keyed array cannot be restored after clearing, making retention safer |
| v136 | Fortuneteller redesign — (1) notice above orb fills gap: "Every session with Clar purifies your field…"; (2) prediction cards redesigned: open oracle style, no boxy glass cards, hairline separator between sections, larger flowing italic text; (3) orb enhanced: richer gradient + inner rotating nebula (::before conic-gradient mix-blend-mode:screen + ftNebula keyframe); (4) energy field tap tooltip: explains why constellation looks like it does (Clar time, momentum, field density description) |
| v134 | Fortuneteller energy field redesign — replaced faint floating dots with: (1) aurora blobs: 5 large slow-drifting radialGradient colour clouds (purple/gold/teal) that breathe and shift; (2) constellation network: particles connected by fading lines when < 75-130px apart (distance based on energy state), constantly reforming as particles drift; (3) particle glow done via large dim halo + bright core (no expensive shadowBlur); energy state controls speed/density/link-distance/brightness |
| v133 | Fortuneteller energy animations — particles dramatically more vivid: larger sizes (up to 5.5px), higher alpha (0.28–0.95), shadowBlur glow per particle scales with energy state, gentle twinkle pulse on each particle; rings boosted from ghost opacity (5–18%) to visible (16–40%) with glow box-shadow |
| v132 | Fortuneteller fix — spinner hung forever because: (1) monthly summary fetch blocked main call with no timeout; (2) system prompt too large (4 full ai_context texts = 8k+ chars) causing Gemini to time out. Fix: monthly summary is now fire-and-forget (never blocks); ai_context values truncated to 800/600 chars each; summaries back to last 7 (not 30); 20s AbortController timeout on main fetch; Object.values replaced with Object.keys loop for compat |
| v131 | Particle field fix — ctx.scale(dpr,dpr) so draw calls use CSS px (not physical px); old canvas removed on each init so energy state refreshes; alpha floor raised (Seeking: 0.20–0.40, Steady: 0.28–0.55, Active: 0.35–0.72, High: 0.45–0.92); size floor 1.2–1.8px so particles never sub-pixel; clearRect now clears CSS-px area not physical-px area |
| v130 | Phase 3 base — (1) Flowing particle field replaces static stars in Fortuneteller: canvas-based, energy-reactive (speed/count/brightness scale with High/Active/Steady/Seeking energy state, particles drift upward, stop when tab hidden); (2) Radar/spider chart after prediction cards: 5 dimensions (Goal Clarity, Belief Alignment, Daily Action, Clar Investment, Resistance Level) computed from localStorage, animated ease-out on reveal; (3) Practice log: `user_practice_log` Supabase table (type, name, completed_at); `window.logPractice(type,name)` fire-and-forget; hooks into tool open, charger open, vibe card completion |
| v129 | Fortuneteller deep upgrade — 4 new `ai_context` rows in Supabase (`fortuneteller_philosophy`, `emotional_guidance_system`, `manifestation_signals`, `prediction_language`); feelings-as-primary-signal philosophy; full emotional guidance scale (20 levels, powerlessness→joy); safety disclaimer embedded in AI prompt; goal staleness detection at 2-day threshold; goal_last_visited tracked on bnavSwitch goal tab open + synced to Supabase; NN completion rate injected into Fortuneteller prompt; monthly meta-summary generation (compresses 30 daily→1 paragraph, stored `clv_monthly_summaries`, max 6 months); concern card ("🌀 Clar notices") shows only when AI raises a concern; chat summary cap extended 7→30 days; Pulse slice updated to 30 days; `db/schema_v129.sql` adds goal_last_visited + goal_created_at to user_goals, monthly_summaries to user_clar, admin_insights table stub (Phase 2) |
| v128 | **Fortuneteller** — "Clairvoyance" oracle in its own 🔮 Fortune bottom-nav tab; cosmic dark UI (animated floating crystal orb with radial gradient + glow, 3 concentric rotating rings, 60 JS-generated twinkling star particles, glassmorphism prediction cards); instant behavioural energy reading — no AI wait (reads Clar time + momentum + trend → e.g. "High, rising energy detected"); Gemini oracle call: injects Clar's `ai_context.philosophy` from Sheets, predicts near future (7-14 days) + far future (30-90 days) + `watch_for` (specific real-life manifestation sign); staggered card reveal animation (opacity+blur+translateY, 0/120/260ms delays); daily cache `clv_fortune_cache`; `fortuneLoad`/`fortuneRefresh` exposed globally; bnav "Vibe Feed" → "Vibe" for 6-tab layout |

---

## Google Sheets Backend

**Apps Script URL (direct — do not use in app, CORS blocked from GitHub Pages):**
```
https://script.google.com/macros/s/AKfycbw8CsadkFYEPFccU2YZ5JDnYKlF6DiP_bHLDWaGf3PUNHELjY61ZE7F2E6huc4oKaUjYw/exec
```

**Sheets Cloudflare Worker (use this in app — proxies Apps Script + adds CORS headers):**
```
https://clarvoyance-sheets.smworkassistance.workers.dev/
```

**Active sheets (SHEET_NAMES in Apps Script):**
| Sheet | Purpose |
|-------|---------|
| `modules` | Which app tabs are active (active=false → tab hidden) |
| `charger_categories` | Categories for Mind Chargers |
| `chargers` | Mind Charger content items |
| `charger_rules` | Rules applied to chargers |
| `tools` | Tool definitions (name, emoji, description, placeholder) |
| `vibe_cards` | ALL vibe feed card content (BREATHING, MOVEMENT, AFFIRMATION, WRITING, QUOTE, CHARGER) |
| `quotes` | Curated quotes (injected into Revise tab + vibe feed) |
| `revise_repeat` | Revise & Repeat section content |
| `learning_channels` | Learning channel links |
| `ai_context` | Key-value pairs driving Clar AI system prompt (evolvable without code changes) |

**`ai_context` sheet columns:** `key | value`
Keys used: `identity` `philosophy` `conversation_flow` `disclaimer`

**AI-context columns on `tools`, `chargers`, `vibe_cards`:** `ai_why | ai_best_for | ai_how_to_use`
These are optional — when filled, they make Clar's suggestions more precise and contextual.

**Caching:** Apps Script server cache = 60s. Client localStorage cache = 60s (key: `clv_sheets_cache`).

**`vibe_cards` sheet columns:**
```
id | type | title | content | placeholder | timer | xp | icon | category | active
```
- `type` values: `BREATHING` `MOVEMENT` `AFFIRMATION` `WRITING` `QUOTE` `CHARGER` `TOOL`
- `timer`: seconds for countdown (BREATHING/MOVEMENT/AFFIRMATION/QUOTE use this)
- `placeholder`: for WRITING cards (textarea hint text)
- `icon`: emoji for MOVEMENT cards
- `category`: for CHARGER cards
- `active`: FALSE = row ignored by Apps Script

---

## Analytics

### GA4 — G-BZZMW9B8SN
Account: Clar | Property: Clar App | Stream: Clar PWA
Custom dimensions registered (Event scope): `tab_name`, `card_type`, `streak`, `amount`, `persona`, `intent`, `tool_name`, `charger_name`, `is_pwa`

**Custom events tracked (v71+):**
| Event | Parameters | When |
|-------|-----------|------|
| `app_open` | `is_pwa` | Every app load |
| `tab_view` | `tab_name` | Every tab switch |
| `vibe_card_complete` | `card_type`, `streak` | Card XP unlocked |
| `vibe_card_skip` | `card_type` | Next tapped before complete |
| `xp_gained` | `amount` | Any XP award |
| `clar_session_start` | `persona`, `intent` | initChat() called |
| `clar_message_sent` | — | User sends message |
| `tool_open` | `tool_name` | Tool row expanded |
| `charger_open` | `charger_name` | Charger row expanded |
| `pwa_install_tapped` | — | Install button tapped |
| `pwa_install_later` | — | Later button tapped |

### Microsoft Clarity — wydll6jrxn
Project: Clar | URL: smworkassistance.github.io/clarvoyance
Auto-captures: session recordings, heatmaps, rage clicks, dead clicks, scroll depth.
Data appears 24-48h after first traffic.

---

## App Architecture

### Onboarding Flow (first launch only)
```
Language select → Nickname input → Daily mood select → Clar persona select → App opens
Keys: clar_lang | clv_nick | clar_mood_date | clv_clar_persona
```
**Persona options:** `bestfriend` | `guide` | `coach` | `nurturer`
Changeable anytime from Profile (👤 button in chat header).

### Tab Structure (bottom nav)
| Tab key | What | Module ID in Sheets |
|---------|------|---------------------|
| `home` | Home widget, NN progress, XP | always on |
| `vibe` | Vibe Feed | `vibe_feed` |
| `tools` | Tools grid + inline sections | `tools` |
| `chargers` | Mind Chargers | `chargers` |
| `revise` | Revise & Repeat + curated quotes | `revise_repeat` |
| `nn` | Non-Negotiables checklist | `non_negotiables` |
| `goal` | Goals + vision images | `goals` |

Tabs are shown/hidden by `applyModules()` based on `modules` sheet data.

### Key localStorage Keys
```javascript
K = {
  e:  'c9_emo',      // current mood index
  v:  'c9_vis',      // vision images (goal tab) — array of {src, note}
  n:  'c9_nn',       // non-negotiables list
  nh: 'c9_nnhist',   // NN completion history by date
  g:  'c9_goal',     // goal text
  gl: 'c9_goallinks',
  q:  'c9_quotes',   // user's custom quotes
  rr: 'c9_rr',       // revise & repeat images
  rd: 'c9_rrdocs',
  rl: 'c9_rrlinks',
}
// Other important keys:
// clv_sheets_cache  — Sheets JSON cache (60s TTL)
// clar_lang         — selected language (en/hi/hinglish)
// clv_nick          — user's nickname
// clar_mood_date    — date of last mood log
// clar_xp           — total XP / vibration score
// clarQuotes        — user's My Quotes (shown in vibe feed)
// clv_chat_session  — {date, history[], intent} today's Clar AI conversation
//   intent: 'talk' | 'act' | null — set by session intent tap at start of session
// clv_user_profile  — {present_challenge, permanent_challenge, goal, intention}
// clv_chat_summaries — [{date, summary}] last 7 days of conversation digests
// clv_clar_persona  — 'bestfriend' | 'guide' | 'coach' | 'nurturer'
```

---

## Vibe Feed Architecture

### Card Sources (priority order)
1. **Google Sheets `vibe_cards`** — ALL card types (primary source, loaded via sheetsDataReady)
2. **Google Sheets `chargers`** — injected as CHARGER type cards
3. **localStorage `c9_vis`** — vision images → GOAL_VISION cards (dynamic)
4. **localStorage `clarQuotes`** — user's My Quotes → QUOTE cards (dynamic)

### Card Types & XP
| Type | XP | Completion trigger |
|------|----|--------------------|
| BREATHING | 10 | Timer (from sheet `timer` col) |
| MOVEMENT | 8 | Timer (from sheet `timer` col) |
| AFFIRMATION | 4 | Timer (15s default) — "Say it 3 times" |
| WRITING | 7 | Auto when ≥ minChars typed |
| GOAL_VISION | 6 | Auto when ≥ 20 chars typed |
| CHARGER | 5 | Tap "I'm Charged" button |
| QUOTE | 3 | Timer (20s) — "Read it 5 times" |
| TOOL | 8 | Auto when ≥ 10 chars typed |

### Skip Mechanic
Next button before task complete = −5 XP + buzzer + streak reset.
Next button after task complete = clean advance (green "Continue ↑").

### Streak System
- 3 consecutive completions → 1.5× XP multiplier
- 5 consecutive completions → 2× XP multiplier
- Any skip → streak resets to 0

### Anti-repeat
`vfLastType` tracks previous card. Same type never shown twice in a row.

---

## Tools Architecture

### Tool cards in Tools tab
- Rendered from Sheets `tools` data via `sheetsDataReady` event
- Grid card (`.tc`) + inline section (`.isec`) both built dynamically
- Fallback: `registry.js` + HTML file fetch (for rich tool content)

### Tools in Vibe Feed
- `VF_TOOLS` array populated from Sheets `tools` data
- Generic card: shows tool name + description + textarea (≥10 chars → XP)

---

## Key Functions Reference
| Function | Where | What it does |
|----------|-------|-------------|
| `langInit()` | onboarding script | Entry point on DOMContentLoaded |
| `bnavSwitch(el)` | bottom nav | Switches visible tab, triggers renders |
| `applyModules(modules)` | sheets loader | Shows/hides tabs based on Sheets data |
| `vfInit()` | vibe feed | Shuffles deck, starts feed |
| `vfRender()` | vibe feed | Renders current card |
| `vfPickCard()` | vibe feed | Selects next card (anti-repeat + pool logic) |
| `vfNext()` | vibe feed | Advance or skip (checks vfXpUnlocked) |
| `vfUnlockXP()` | vibe feed | Awards XP, flips button green |
| `renderChargers()` | chargers tab | Renders charger categories from Sheets |
| `renderSheetTools()` | tools tab | Renders tools from Sheets data |
| `xpAdd(pts)` | XP system | Adds XP, checks level up |
| `xpRefreshAll(score)` | XP system | Updates all XP display elements |

---

## Clar AI Architecture

### Overview
Clar is an AI companion tab powered by Gemini 2.5 Flash (free tier) via a Cloudflare Worker proxy. The API key lives server-side in the worker — never in the browser or GitHub.

**Cloudflare Worker URL:** `https://cold-frog-d555.smworkassistance.workers.dev/`
(Passes the request body directly to Gemini; adds API key server-side; returns raw Gemini response)

### System Prompt (`_buildSystemPrompt`)
Built fresh on each API call from:
1. `SHEETS_DATA.ai_context` — identity, philosophy, conversation_flow, disclaimer rows
2. `localStorage clv_nick` — user's nickname
3. `localStorage c9_emo` — mood index → label
4. `localStorage clv_user_profile` — present_challenge, permanent_challenge, goal, intention
5. `localStorage clv_chat_summaries` — last 7 days of conversation digests
6. `SHEETS_DATA.tools` + `SHEETS_DATA.chargers` — with ai_why / ai_best_for / ai_how_to_use columns if filled

### AI Response JSON Format
```json
{"message":"...","cards":[{"type":"tool","id":"t1","reason":"short personal reason why this card right now"}],"profile_update":{"present_challenge":"..."}}
```
- `cards`: empty array or 1 card (tool or charger by id) — rendered inline as tappable card
- `cards[].reason`: optional short string — personal reason why this specific card for this moment, shown below the card chip
- `profile_update`: if Clar infers user's challenge from conversation, auto-saved to `clv_user_profile`

### Clar Conversation Philosophy (core — do not compromise)

**The fundamental principle: Earn the right to suggest.**
Clar's first job is not to help. It is to make the person feel *completely heard*. The moment you suggest something, you signal "I've heard enough." That closes people down. A suggestion only lands when the person is open — and they only open when they feel safe.

**The trust loop:**
```
Person feels heard → opens up more → trust builds → becomes open to suggestion → suggestion lands → person acts → feels better → trusts Clar more
```
Without the trust loop, cards are just interruptions.

**Three-phase conversation model:**

| Phase | Name | What Clar does | Cards |
|-------|------|----------------|-------|
| Phase 1 | Hear | Reflect back what was shared. Ask ONE deeper follow-up. No agenda. | `[]` always |
| Phase 2 | Understand | Keep listening. Build a genuine picture of their emotional state. Watch for the "exhale" — when their tone shifts from heavy to lighter/clearer. | `[]` always |
| Phase 3 | Sense the moment | When the exhale comes: suggest one action confidently, with a personal reason. Not a question — a statement. | 1 card max |

**The "exhale" signal** — what to watch for:
- Person has said what they needed to say (topic naturally closes)
- Tone shifts: less urgent, more reflective, or slight positivity emerges
- They use words like "haan", "theek hai", "samjha", "ab kya karun"
- Minimum 2-3 exchanges have happened regardless

**How to suggest in Phase 3 (critical):**
- Confident statement, NOT a submissive question ("kya tum try karna chahoge?" is WRONG)
- Frame it around the rising momentum: "Ab jo positivity aa rahi hai — isko pakad le"
- The reason must be personal — reference something specific from *this* conversation
- Short reason: why THIS card for THIS person RIGHT NOW
- If resistance (short reply, redirect, silence): acknowledge, continue conversation, try again after 2+ more exchanges
- Goal is upliftment, not compliance — if the person isn't ready, keep building trust

**Session intent (v57+):**
At session start, user can tap: "💬 Bas baat karte hain" OR "⚡ Kuch try karna hai"
- `talk` intent → Phase 1+2 extended, Phase 3 still happens but patience is higher
- `act` intent → Phase 1 shortened (1 exchange), move to Phase 3 faster
- No tap → default to full 3-phase flow
Stored in `clv_chat_session.intent`

**What Clar must never do:**
- Suggest a card in the first 2 exchanges (regardless of intent)
- Ask permission to suggest ("do you want to try something?")
- Suggest more than 1 card per session unless user explicitly asks
- Break conversation flow — suggestion should feel like a natural next sentence
- Be generically warm — every message must feel personal to this person's situation

---

### Daily Summaries
On each new day's first `initChat`, yesterday's last 4 messages are compressed into a one-line summary and saved to `clv_chat_summaries` (max 7 entries). Injected into every system prompt for continuity.

### User Profile Modal
Accessible via 👤 button in chat header. 4 fields: present_challenge, permanent_challenge, goal, intention. Also auto-updated by Clar when it infers context from the conversation.

### Key Chat Functions
| Function | What |
|----------|------|
| `initChat()` | Entry point — restores today's session or starts fresh |
| `chatSend()` | User message → history → AI |
| `_buildSystemPrompt()` | Assembles full context from sheets + localStorage |
| `_sendToAI()` | Calls Cloudflare Worker with payload |
| `_addCardEl(card)` | Renders inline tappable tool/charger card |
| `chatProfileOpen/Close/Save()` | Profile modal controls |

---

## Deliberately Deferred (not built yet)
- Challenges sheet (40 research-backed challenges) — Apps Script SHEET_NAMES needs `challenges` added
- Quest system linked to challenges sheet
- Mood-based card filtering (charger_rules sheet)
- Remove legacy tool HTML files (`tools/clarity.html` etc.) — keep until confirmed stable

---

## How to Add New Content (no code needed)
| Want to add | Just do this |
|-------------|-------------|
| New vibe card | Add row to `vibe_cards` sheet |
| New charger | Add row to `chargers` sheet |
| New tool | Add row to `tools` sheet |
| Turn off a tab | Set `active=FALSE` in `modules` sheet |
| New quote | Add row to `quotes` sheet |

---

*Last updated: 2026-07-11 — v155 saved. index.html = v155. Always copy new version to index.html after pushing.*
