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
| PWA | sw.js (cache version clv-v80), manifest.json, beforeinstallprompt — **bump CACHE_VERSION on every release** |

---

## File Versioning Convention
```
clarvoyance_v[MAJOR].[MINOR]_[description]_[STATUS].html
STATUS: TESTING | STABLE
```
- `index.html` = always the latest pushed stable/testing version (what users see on GitHub Pages)
- Never edit old version files — always create a new version

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

*Last updated: 2026-05-30 — v82: Greeting redesign + nav cleanup + goal-row cards + curated quotes hairline*
