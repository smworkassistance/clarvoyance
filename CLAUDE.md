# Clarvoyance — Project Blueprint

> This file is the single source of truth for architecture, data flow, and decisions.
> Update it whenever a significant feature is added, changed, or removed.
> Claude reads this at the start of every session.

---

## What is Clarvoyance?
A mood-based self-development app (mobile-first PWA). Core idea: the user opens it daily, logs their mood, gets a personalised Vibe Feed of micro-exercises, and builds a streak. Tools, chargers, goals, quotes, and modules are layered on top.

Hosted on GitHub Pages. Single HTML file. No build system.
Repo: https://github.com/smworkassistance/clarvoyance

---

## Tech Stack
| Layer | What |
|-------|------|
| Frontend | Single HTML file (vanilla JS, CSS, no frameworks) |
| Backend / Content | Google Sheets + Apps Script Web App (JSON API) |
| Hosting | GitHub Pages (index.html = latest stable version) |
| Storage | localStorage (all user data) |

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

---

## Google Sheets Backend

**Apps Script URL:**
```
https://script.google.com/macros/s/AKfycbxJi8chmSSoLOMDKGnKjK6yNhrKM0Uh4C3-j1pjjPSFmZ3_V25TXvVUV9YA5kHFGxlNBw/exec
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

## App Architecture

### Onboarding Flow (first launch only)
```
Language select → Nickname input → Daily mood select → App opens
Keys: clar_lang | clv_nick | clar_mood_date
```

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

*Last updated: 2026-05-16 — v46 session*
