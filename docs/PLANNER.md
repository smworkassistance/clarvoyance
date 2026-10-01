# PLANNER — long-term strategic ideas (planning phase, not execution)

This file is different from `tasks.json`/`TASKS.md`: those track *buildable* work with a
concrete `done_when`. This file tracks ideas that are still being shaped — pricing,
monetization, brand/design direction — where the "done" of the planning phase is a
**written, owner-reviewed decision**, not a shipped feature. Once an idea here reaches
**Decided**, it spawns real task(s) in `tasks.json` for execution; this entry then just
links to those task IDs instead of holding the live discussion.

Status values: **Researching** (Claude gathering facts/options) → **Discussing** (options
on the table, owner input needed) → **Decided** (spec frozen, tasks.json owns it now) →
**Parked** (deliberately shelved, revisit later).

Append-only in spirit — edit an entry's own status/content as it evolves rather than
duplicating it lower down.

**Standing research rule (owner, 2026-10-01):** every entry in this file must be
**world-class** — learned from the best real apps/companies in the world, in real detail
(real numbers, real design decisions, real sources), not generic reasoning or a copy of
what a competitor merely *looks* like. "Researching" status means real web research
happened (via WebSearch/WebFetch), not assumption.

---

## 1. Pricing & monetization strategy

**Status:** Discussing (real research done 2026-10-01 via WebSearch, options below are
concrete now — owner's actual pricing/timing decision is still open). Note: an earlier
attempt to do this research via two background subagents produced nothing (both were
silently stopped with zero output ~90 minutes in — a real limitation of long-running
background agents in this environment, not a research gap) — this research was redone
directly, in the foreground, by Claude itself.

### Owner's raw ideas, as given (not yet evaluated against each other)
1. Keep price at ₹0 for now; price only once real user growth creates real need.
2. Layered model: most features free forever → a mid tier unlocked by **earned XP**
   (in-app currency, no real money) → an advanced/"genuinely more useful" tier unlocked
   by **real payment**, yearly (e.g. a ₹100/yr eventual price, ₹25/yr intro offer).
   Explicit warning: build this *config-driven*, not hardcoded around today's specific
   features — a future niche (e.g. institutions) may need its own pricing shape.
3. **Institutions as a market**: if Clar's social features prove Clar can genuinely
   connect with people (as they now believe happened once social/Community shipped),
   a direct B2B/institutional pitch (schools, colleges, corporates, therapy/wellness
   orgs) could be a real distinct revenue line — not just a straight consumer-app tier.
4. **Ad-supported / creator-guide model**: hundreds of "guides" acting like content
   creators, ads (Google AdSense/AdMob, or problem-targeted ads) placed between their
   posts/feeds and inside Vibe/Shorts-style surfaces — could make the *consumer app*
   free forever, monetizing attention/creators instead of subscriptions.

### Real benchmarks from world-class apps (WebSearch, 2026-10-01 — sources below)

**Duolingo** — the closest real comparable (gamified habit app, streak/XP mechanics
already very similar to Clar's own). Free tier is ad-supported (deliberately light ad
load, "doesn't want ads to drive churn before the upgrade prompt"). Two paid tiers:
Super ($13.99/mo or $83.99/yr — removes ads, unlimited hearts; Family $119.99/yr for 6)
and Max ($29.99/mo or $167.99/yr — AI features: roleplay practice, "Explain My Answer").
The mechanic most relevant to Clar: **Duolingo monetizes loss aversion directly** — the
"Streak Freeze" is a paid/earnable item that protects a streak the user would otherwise
lose, and "hearts" (limited mistakes) create soft friction that nudges upgrade without
ad spend. Clar already has an equivalent real asset (the engagement-engine streak, v186)
that nothing is built on top of monetization-wise yet. **2026 strategic shift**: Duolingo
itself just pivoted from "monetize aggressively" to "reduce friction in the free
experience, grow to 100M DAU first" — a real, current signal from the market leader that
over-monetizing early can work against the exact growth the CEO review recommended
before paid acquisition. [Source: fourweekmba.com/how-does-duolingo-make-money,
classcentral.com/report/duolingo-q2-2026]

**Headspace & Calm** — Individual: Headspace $12.99/mo or $69.99/yr (student $9.99/yr,
family $19.99/mo); Calm $14.99/mo or ~$69.99/yr. **Real B2B numbers** (directly answers
the institutions question): for a 500-employee org, list pricing is $18–28/employee/yr
(Headspace) vs $15–25/employee/yr (Calm), negotiated multi-year down to $12–22/employee/yr
— both still require a sales call for a real quote, no self-serve B2B checkout exists for
either. This is a real, working precedent for Idea #3 (institutions) — but it is a sales-
led motion, not a config flag; it needs a real person doing outreach, not just a feature
built. [Source: vendr.com/marketplace/headspace, lifestack.ai/blog/headspace-pricing,
lifestack.ai/blog/calm-pricing]

**Ad economics — checked, not assumed, and the numbers argue against ads as a near-term
plan:** AdMob's standard revenue share is ~60% to the developer (Google keeps ~40%); an
AdSense-backfill fill gets the developer ~68%. A real cited example: a new app needs
**~50,000 daily active users**, well-optimized, to gross $5,000–7,000/month from AdMob.
Clar is at ~109 users/**30 days**, several orders of magnitude below the scale where ad
revenue becomes real money — this confirms the earlier assessment, now with a real
number attached instead of a general sense of "too early." [Source: monetizemore.com/
blog/admob-monetization, playwire.com/blog/admob-ecpm-benchmarks]

**YouTube embed policy — fact-checked directly (not assumed), and it's a hard rule, not
a guideline:** YouTube's own developer terms explicitly forbid *any* overlay on or
around an embedded player that obscures or conflicts with the player, and there is no
way to disable or replace YouTube's own ads on an embedded video (they run their own
pre-roll/mid-roll regardless of what the embedding site does). This is a **hard legal/
ToS wall, not a design choice** — confirms and hardens what CLAUDE.md's v250/v251
entries already independently concluded from a different angle ("nothing of ours sits on
the YouTube player"). Practical consequence for the ad-model idea: **ads can only ever
go on Clar's own content** (Guides text/photo posts, Bunny-hosted Clar Reels, quote
cards) — never attached to or wrapping a YouTube-sourced video card. [Source: support.
google.com/youtube/answer/3364658, developers.google.com/youtube/terms/
developer-policies-guide]

**A genuinely different, 2026-emerging model worth naming — outcome-based pricing:**
rather than charging for *access* (a flat subscription) or *volume* (a message cap),
some 2026 AI products now charge only when a defined, measurable outcome actually
happens — the cited real example is Intercom Fin charging **$0.99 per resolved support
ticket**, which reportedly generated tens of millions in revenue in its first year.
[Source: getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models]
**This maps unusually well onto Clar specifically**, because Clar already computes a
real, per-user "did something genuinely good happen" signal nobody else in this
category has built: the Engagement Engine's `daily_score` (v186) and Practice Plan
completion (v180) are *already* a working definition of "outcome," not something that
would need inventing. A speculative but genuinely novel angle (not copied from anyone,
flagged as an idea to discuss, not a recommendation): a **completion-based unlock**
instead of a time-based subscription — e.g. finishing a full Practice Plan, or holding a
streak through a real milestone, unlocks a real benefit (an advanced Guide, deeper
Fortune insight, a physical/print reward) — this is different from both Duolingo's
"loss aversion" streak-freeze (which sells removing a bad outcome) and a flat sub
(which sells time-boxed access) — it sells a *good* outcome the app can already prove
happened. Needs real discussion before treating as more than an idea.

### Claude's recommendation (a synthesis, not a unilateral decision — owner still decides)
1. **Near-term (matches the CEO review's own "not yet" on paid acquisition):** ship the
   XP-gated mid-tier (Idea #2's first half) using the *already-built* `feature_gates`
   infra — zero payment-gateway dependency, testable in days, and it directly measures
   real demand before any money changes hands.
2. **Medium-term, only once demand is confirmed:** the real-payment tier, gated behind
   getting Razorpay (or similar) actually integrated — a distinct, separate project, not
   a side effect of the pricing *shape* decision (this was flagged as an open question
   below and the Duolingo/Headspace numbers above are useful anchors for what "real"
   pricing could look like once that infra exists).
3. **Institutions:** worth pursuing, but it is a sales motion (a real person doing
   outreach with a quote-only offer, exactly like Headspace/Calm), not a feature to
   build — track as its own initiative once there is real retention data to pitch with.
4. **Ads:** deprioritize for now — the real numbers above show it needs an audience
   ~500x Clar's current size to matter, and it can only ever touch Clar's *own* content
   (never YouTube-sourced cards), which shrinks the inventory it could even run on today.
5. **Outcome-based unlock** — worth a real discussion as a genuinely different third
   lever alongside subscription and institutions, not a replacement for either.

### Open questions for the owner (not blocking research, blocking the *decision*)
- Is real payment infra (Razorpay etc., mentioned as a TODO since v182/privacy.html) a
  near-term project on its own, independent of which pricing *shape* gets picked?
- Institutions is a sales-led motion in every real comparable found — is there appetite
  to actually do that outreach, or should it stay parked until there's a stronger pitch?
- Worth discussing the outcome-based-unlock idea above as a real third option, or park it?

### DESIGN v1 — what is free, what is paid, what price (Claude's proposal, 2026-10-02, owner decides)

**Principle:** the daily loop is the product, so it is never paywalled. Only what costs
real money per use (Gemini calls) or is genuine "depth" is limited. Free must feel
complete, not crippled (Duolingo's own 2026 pivot: reduce free-tier friction first).

**Cost anchors (measured, CLAUDE.md v182):** ~₹0.15 per Clar chat message today
(uncached); explicit caching of the ~5k-token system prompt is the known ~90% lever
(~₹0.03/msg), not built yet. Fortune = 1 cached AI call/day, Pulse = weekly, Guide
posts = cron, ~2 Gemini calls per post.

| Surface | Free | Earned (XP/streak) | Plus (paid) |
|---|---|---|---|
| Vibe Feed, videos, quote cards, Chargers, Tools, Non-Negotiables, Revise, Goal + Goal Items, streak, Insights charts, Help | all, unlimited | — | — |
| Community (feed, board, follow, post, comment) | all | — | — |
| Clar chat | 20 msgs/day (as is) | +5/day at each 7/14/21-day streak milestone, max 40 | 100/day (soft cap, not "unlimited") |
| Fortune | 1 reading/day | — | on-demand refresh + saved reading history |
| Pulse | weekly | — | — |
| Guides | follow up to 3, 1 private guide | — | 5 private guides, higher posts/day |
| Practice Plans | 1 active | — | 3 active |
| Early access / badge | — | — | Plus badge, new features first |

Why this split: everything that creates the habit (and the streak/XP that the Engagement
Engine measures) stays free; Plus is only "more Clar", which is exactly where our cost is,
so price tracks cost. The **Earned** column needs no payment infra: it is new rows in
`feature_gates` keyed to streak milestones, and it rewards the behaviour we want (outcome
unlock, not a time subscription).

**Price (proposal, India-first, UPI autopay):**
- **Plus ₹99/month or ₹799/year** (~₹67/mo). First-year intro ₹399 (owner's ₹25/₹100
  idea is below cost: ₹100/yr ≈ 670 uncached messages for the whole year).
- Unit economics check: avg paying user ~8 msgs/day -> ₹36/mo uncached (₹99 minus
  store/gateway fees ~3-15% still leaves ~₹50 margin), ₹7/mo cached. A 100 msg/day heavy
  user = ₹450/mo uncached, so the 100/day soft cap and the caching task must land
  BEFORE charging. Do not sell Plus until caching is built.
- Do not pick the number by thought: when Razorpay exists, A/B ₹79 / ₹99 / ₹149 monthly
  via admin-config (no redeploy).

**Sequence (matches the CEO review's "not yet" on paid acquisition; ~109 users/30 days
means revenue is not the goal now, learning willingness-to-pay is):**
1. Now: ship the Earned tier via `feature_gates` (no payment dependency).
2. Now: "Plus" fake-door — Upgrade screen with the table above + "Notify me"; count taps
   and emails. Real demand signal for free.
3. Build Gemini explicit caching (cuts cost ~90%, makes Plus margin real).
4. Only then: Razorpay + real Plus. Institutions stay a separate sales-led motion.

**Config rule (owner's warning):** tiers, limits, prices and earn-rules live in tables
(`feature_gates`, a new `plans` table), never in client code, so a future institutional
plan is a new row.

**Open decisions for the owner:** (a) keep free at 20 msgs/day or drop to 10 until
caching lands? (b) ok with Plus at ₹99/mo vs your ₹100/yr idea? (c) is "1 private guide
free" right, given each guide costs cron AI calls?

**Sources (WebSearch, 2026-10-01):** [Duolingo business model](https://fourweekmba.com/how-does-duolingo-make-money/) · [Duolingo Q2 2026 strategy shift](https://www.classcentral.com/report/duolingo-q2-2026/) · [Headspace pricing](https://lifestack.ai/blog/headspace-pricing) · [Calm pricing](https://lifestack.ai/blog/calm-pricing) · [Headspace on Vendr (B2B)](https://www.vendr.com/marketplace/headspace) · [AdMob monetization playbook](https://www.monetizemore.com/blog/admob-monetization/) · [AdMob eCPM benchmarks](https://www.playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect) · [YouTube embedded ads/overlay policy](https://support.google.com/youtube/answer/3364658) · [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies-guide) · [2026 SaaS/AI/agentic pricing guide (outcome-based)](https://www.getmonetizely.com/blogs/the-2026-guide-to-saas-ai-and-agentic-pricing-models)

---

## 2. World-class UX/UI — planning only, nothing built yet

**Status:** Discussing (real research done 2026-10-01 via WebSearch — findings and a
legal check below; owner's framing: plan down to the smallest detail — "simple se
simple colors tak" — before any pixel changes. Reference points given: Apple-standard,
Meta-standard, "glassy", no boxy patterns, explicit text/background contrast care.)

### What "done" for this planning phase looks like
A written design spec (extends `docs/DESIGN-STANDARD.md`, doesn't replace it) covering,
per surface, before any of it is built:
- Color system: base palette, accent, semantic colors (success/warn/danger), light+dark
  pairs, and a documented **contrast check** (WCAG AA, 4.5:1 body text) for every
  color-on-color combination actually used — not assumed safe.
- Glass/elevation system: what counts as a "glass" surface (blur radius, fill opacity,
  border treatment) vs a flat one, and the rule for when text sits on glass (a scrim/
  overlay is mandatory there, not optional) so contrast never silently breaks.
- Typography: confirm current SF Pro/system-font stack (since v116) still matches the
  target, type scale, line-height, readability at real phone sizes.
- Motion: transition/easing standard (spring vs linear), what animates vs what shouldn't.
- Spacing/grid: one consistent unit (e.g. 8px) applied everywhere, replacing ad hoc
  per-screen values accumulated over 250+ versions.
- A **screen-by-screen audit**: current pattern vs target, ranked by how often a real
  user sees that screen first (Chat, Vibe, Home, bottom nav, Feed/Community likely rank
  highest — to be confirmed against real usage, not assumed).

### Real findings from world-class design systems (WebSearch, 2026-10-01 — sources below)

**Apple's Liquid Glass (iOS 26, WWDC25)** — Apple's own current material design
language, and directly relevant since the owner named "Apple-standard" explicitly.
Two facts matter more than the visual style itself: (1) **legibility was named a
central design consideration, not an afterthought** — small elements like nav/tab bars
continuously adapt and *flip their own tint between light and dark based on what's
behind them*, specifically to maximize contrast against a moving background, and a
documented minimum contrast ratio of **4.5:1** is maintained. (2) **Apple itself walked
back its own transparency** at WWDC 2026, after real user feedback — reducing default
transparency, and adding a user-facing slider between "clearer" and "more tinted" glass.
**This is the single most important fact for this whole redesign**: even the company
that invented this look concluded a purely transparent, decorative version of it hurt
real usability and had to be tempered. Apple also ships a system-level "Reduced
Transparency" accessibility mode that makes glass frostier/more opaque on request —
i.e. their own answer to "glass vs readability" is *make it adjustable, don't force
maximum transparency everywhere*. [Source: developer.apple.com/videos/play/wwdc2025/219,
letsdev.de/en/blog/ios-26-in-detail-liquid-glass-ui-between-usability-and-accessibility]

**Glassmorphism + WCAG — the honest, fact-checked limit, not a workaround to hide:**
a direct, blunt finding from real accessibility-focused design writing: **"there is no
version of glassmorphism — as it's aesthetically defined — that reliably passes WCAG
2.2 for text over a dynamic background, without eliminating the transparency that
defines the effect."** The real, working fix used by every credible implementation is
a **scrim** — a deliberate semi-opaque fill or gradient placed between the blur and the
text, sized and darkened/lightened until the contrast ratio is verified, not assumed.
Practical rule this sets for Clar: **any text on a glass surface needs its own scrim,
checked against the worst-case background it can appear over (busy photo, bright accent
color, etc.), not the average case.** [Source: codexical.com/posts/
2026-04-24-glassmorphism-accessibility, axesslab.com/glassmorphism-meets-accessibility]

**Material Design 3 (Google)** — useful for a different reason: Clar already has a
24-color, user-selectable accent system (v116), which is structurally similar to what
M3 solves with **Dynamic Color** — one source color programmatically generates an
entire tonal palette (13 tones per role: Primary/Secondary/Tertiary/Neutral/Neutral
Variant) in a perceptually-accurate color space (HCT), rather than someone hand-picking
every shade. This is the *reasoning* worth borrowing (a formula that guarantees
contrast-safe tints for *any* of the 24 existing accents automatically) — not M3's
specific colors or Google's visual identity. M3 also favors **tonal elevation**
(surfaces distinguished by a shift in color tone) **over heavy drop-shadows** — a
concrete, checkable alternative to "boxy card with a shadow." [Source: m3.material.io/
styles/color/system/how-the-system-works, developer.android.com/develop/ui/compose/
designsystems/material3]

### Legal facts, checked directly — not assumed (owner's explicit ask, 2026-10-01)
Learning from Apple/Meta/Material Design's *design reasoning* (contrast rules, elevation
logic, spacing systems) is legally safe — these are unprotectable functional/aesthetic
principles, confirmed by real case law research: **copyright protects specific creative
expression, not general ideas or "basic UI patterns, standard layouts, and functional
elements," which courts treat as industry standards.** What is NOT safe, and must be
avoided regardless of how good it looks: (1) **using the trademarked name "Liquid
Glass"** as Clar's own marketing/internal term for its visual style (it's Apple's
product name, not a generic design term); (2) **literally copying specific copyrighted
assets** — Apple's own SF Symbols icon set, exact icon artwork, or exact custom
illustrations from any app, none of which are "just a look," they're specific
copyrighted files; (3) **cloning a distinctive, recognizable trade dress closely enough
to cause real user confusion** — a real, if narrower, risk than copyright, since courts
do recognize trade dress claims for UI when a design has "acquired secondary meaning"
and the copy is close enough to confuse users about the source (an actual precedent
exists: *Facebook, Inc. v. StudiVZ*). **Conclusion for this redesign**: build Clar's own
color/spacing/motion tokens from the *principles* above (not copied files or exact
palettes), never call the result "Liquid Glass" in the app or in docs, and don't
generate custom icons that are near-duplicates of Apple's own SF Symbols set — use an
open/licensed icon set or Clar's own original glyphs instead. [Source: terms.law/forum/
thread/competitor-copying-ui, ijlra.com/details/laws-protecting-ui-ux-design,
en.wikipedia.org/wiki/Facebook,_Inc._v._StudiVZ_Ltd.]

### Research plan → execution plan
1. ~~Study reference apps' actual design systems~~ — done above, with sources.
2. Turn the *reasoning* above into Clar's own tokens (not a copy of anyone else's exact
   palette or name) — respecting the app's existing accent-color system (24 named
   colors + presets, v116) since users may already have a chosen theme; auto-generate
   contrast-safe tint variants per accent the way M3's tonal-palette formula does,
   rather than hand-checking 24 palettes one at a time.
3. Mandatory scrim rule (from the WCAG finding above) applied everywhere text sits on
   a translucent/glass surface — verified against the worst real background, not the
   average one.
4. Build it — per the owner's 2026-10-01 go-ahead, this becomes a real `tasks.json`
   execution task (T-084) once this research is solid, shipped in its own new version
   file on top of the T-075/076/077 candidate, nothing else disturbed.

### Explicit constraint carried over from the app's own philosophy
Per `CLAUDE.md`'s Product Philosophy: *"Every new feature must pass this test: does it
lower friction or add it?"* — a "world-class" visual pass must not slow load times,
break existing muscle memory (nav positions, gestures), or reduce contrast/readability
in the name of aesthetics. Visual polish is in service of the existing philosophy, not
a separate goal. Apple's own 2026 walk-back on transparency (above) is direct, real
evidence for this same principle from the company that started the trend.

**Sources (WebSearch, 2026-10-01):** [Apple Liquid Glass WWDC25](https://developer.apple.com/videos/play/wwdc2025/219/) · [Liquid Glass usability/accessibility](https://letsdev.de/en/blog/ios-26-in-detail-liquid-glass-ui-between-usability-and-accessibility.php) · [Glassmorphism accessibility limits](https://www.codexical.com/posts/2026-04-24-glassmorphism-accessibility) · [Glassmorphism meets accessibility](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/) · [Material 3 color system](https://m3.material.io/styles/color/system/how-the-system-works) · [Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3) · [UI copying — legal](https://terms.law/forum/thread/competitor-copying-ui.html) · [Laws protecting UI/UX design](https://www.ijlra.com/details/laws-protecting-ui-ux-design-by-jakka-kuswanth-yasaswi) · [Facebook v. StudiVZ](https://en.wikipedia.org/wiki/Facebook,_Inc._v._StudiVZ_Ltd.)

---

## How this file gets used

- New long-term/strategic ideas raised in conversation get added here first, under the
  right section (or a new one), status **Researching** or **Discussing**.
- Claude updates the "research notes" as real work happens (web research, code checks,
  data pulls) — same evidence-based standard as `docs/DECISIONS.md` and the CEO review.
- When the owner says an idea is decided, Claude moves it to `docs/DECISIONS.md` (the
  permanent record) and opens concrete `tasks.json` task(s) for the actual build — this
  file's entry then just points at those, instead of holding the live discussion.

---

## 3. Audience, cost reality, free content stack, AI-generated personal content (2026-10-02)

**Status:** Discussing. Tasks: T-088 .. T-094 (all DISCUSS). Real data pulled today.

### 3.1 Who is actually using Clar (Microsoft Clarity, 30 days to 2026-10-02, non-bot)
- India 44 users / 238 sessions; United States 30 users / 30 sessions (1 session each, so
  likely one-off visits, not a retained audience); Netherlands 9, Poland 6, Canada 5,
  France 4. Returning-user sessions 181 vs new 119, ~3.4 min active each.
- Device: iOS 213 sessions, Windows 44, Linux 29, Android 7. CAUTION: this is almost
  certainly dominated by the owner's own testing devices (iPhone + PCs) - the sample is
  ~100 people, so it cannot choose a launch country. Treat it as "India is the only
  real repeat audience so far", nothing more.

### 3.2 Paying-audience facts (RevenueCat State of Subscription Apps 2026, 115k apps)
- Median download-to-paid: North America 2.6%, India/SE Asia 1.4% (lowest).
- Year-1 revenue per payer: India/SEA $14, North America $32, W. Europe $25, global $23.
- Prices in India/SEA run at 46-54% of top-tier markets.
- So: India = volume + low price; US/W.Europe = ~2x payer value, but needs paid
  acquisition and English/UX parity. No tool/MCP can *predict* Clar's paying audience
  before launch. What is accurate: (a) Clarity (already connected) for who visits,
  (b) the Plus fake-door tapped per country (T-090) for who wants to pay, (c) Play
  Console / App Store Connect country reports once the app is in stores. Paid tools
  (Sensor Tower, data.ai) give category-level numbers, not Clar's own conversion.
- Proposed plan: India-first (UPI, regional price ~Rs99/mo), English+Hinglish+Hindi,
  with the same product opened to US/EU later via regional price table (T-090).

### 3.3 Real AI cost (estimate from token maths, to be replaced by T-088 measurements)
Gemini 2.5 Flash = $0.30 in / $2.50 out per 1M tokens; Flash-Lite $0.10/$0.40; batch =
50% off; cached input is ~90% cheaper. Rs88/$.
- Chat: ~5k-token system prompt dominates -> ~Rs0.13-0.15/msg (matches v182).
- **Silent per-user cost even if the user never chats**: Fortune (big prompt, once/day,
  ~Rs0.25), video-topic writer (~Rs0.05), desire extraction (only when goal text
  changes), Pulse (weekly ~Rs0.3). Roughly Rs0.3-0.4 per ACTIVE user per day = Rs10/month
  baseline, before a single chat message.
- YouTube pulling: the relay worker makes NO Gemini calls; its cost is YouTube quota
  (10,000 units/day shared, 101 per new search), not money. Discover/Feed grids read
  our cache = 0 units. Gemini only writes the topic/search words (above).
- Guides: ~2 Gemini calls per post (generate + verify), ~Rs0.5/post; SHARED by all
  followers. Cost scales with number of guides x posts/day x languages, NOT users.
- KEY DESIGN RULE: shared content (universal Guides, quote cards, photo library, cached
  video pools, shared charger templates) = fixed cost for any number of users; per-user
  generation = variable cost. Make most "infinite content" shared + lightly personalised.
- Immediate checks: Gemini 2.5 Flash-Lite is announced to retire 2026-10-16 - verify
  which model the cold-frog proxy calls (T-089). Cheapest levers: explicit caching of the
  shared prompt (~90% of chat cost), Flash-Lite-class for background jobs, Batch API
  for cron/Guides.
- Rs100/year is below cost for any real user (base Rs10/month before chat), so Plus
  stays ~Rs99/month or Rs799/year as in Design v1; revisit after T-088.

### 3.4 Any language, anywhere?
Gemini is pretrained on 400+ languages; replying in the user's language already mostly
works, so "any language" is mainly a UI-string + quality + moderation question (T-091).
Do it in tiers: Tier 1 English/Hinglish/Hindi (now); Tier 2 Spanish, Portuguese,
Indonesian, Arabic, Bengali (AI-translated UI + per-language spot checks); the long
tail = Clar replies in whatever language the user writes, UI stays English. Guides
already translate lazily per member language (v250). Cost rises only with Guides x
languages, so cap languages per guide.

### 3.5 Free content services like Pixabay (T-092)
Already used: Pixabay (photos, re-hosted), Pexels (video, Clar Reels), Wikiquote,
YouTube (embeds only), Bunny. Candidates (all free, verify license per item):
Openverse (800M CC/public-domain images+audio, API, no key; filter CC0), Wikimedia
Commons (images, check per-file license), Pexels API video (200/h, 20k/mo, attribution
if raising limits), Unsplash API (50/h, strong quality, hotlink rules), Freesound
(730k sounds, ~half CC0) and Pixabay Music (no attribution) for background audio in
breathing/meditation/focus cards, NASA/Library of Congress public-domain imagery.
Rule: prefer CC0/Pixabay licence; re-host when terms forbid hotlinking; store source +
licence on every row.

### 3.6 "Never feels empty" (T-093) - with one hard rule
Shared AI/Clar sources keep Feed/Discover/Vibe alive: universal Guides (4-5, already
5 starters), official Clar posts, photo+quote cards, cached video pools, AI chargers.
HARD RULE: no fake human profiles posing as members. Label the sources honestly
("Clar", "Guide: ..."); fake users are a trust and store-policy risk and would poison
the real community when it arrives. Daily cost cap per surface in admin.

### 3.7 AI-generated personal chargers and manifestation furnace (T-094)
Good idea, fits the product: it turns existing features into infinite, personal content.
- AI chargers: from the user's stated lacks (profile weaknesses, Clar chat themes) the
  model writes fresh affirmation patterns each day ("I am confident, I am stronger than
  stone..."), in a fixed house style with rules set in admin (length, tone, no promises
  of guaranteed outcomes - the existing voice rules). Free tier: 2 charger themes
  (e.g. confidence + communication), Plus: more themes and daily refresh.
- Manifestation furnace: for each named desire (already extracted in v211) generate
  visual+text cards ("I am driving my beautiful white Range Rover...") with the matching
  photo/video, in Vibe Feed.
- Cost control: generate in BATCH per (theme x language x tone), cache and reuse across
  users with only small personalisation (name, desire noun) swapped in by code. 1 batch
  call serves thousands; per-user cost ~0.
- Safety: affirmations only, no health/financial guarantees; keep the v232 voice rules.

### 3.8 Follow-ups (2026-10-02, owner questions)
- YouTube quota has NO rupee cost and cannot be bought: 10,000 units/day default; the
  only way up is Google's free quota-extension audit (weeks, manual, not guaranteed).
  So it is a ceiling, not a bill. Fixes: shared per-topic cache (done), channel RSS feeds
  (no quota), file the audit before it binds (T-097).
- Private/personal Guides ARE per-user cost (~Rs0.5/post x posts/day x languages, ~Rs15/mo
  per 1 post/day guide). Keep universal guides free (shared), private guides Plus-only,
  generate via Batch API (cron is async, 50% off), and reuse public twins by canonical_key.
- Cheaper models for translation/relevance: yes (Flash-Lite class, explicitly positioned
  for translation, MMMLU 88.9). Caveats: 2.5 Flash-Lite retires 2026-10-16; its successor
  3.1 Flash-Lite is $0.25/$1.50 so the saving vs 2.5 Flash ($0.30/$2.50) is ~17% input /
  ~40% output, NOT the "6x" in vendor blogs - measure in T-088/T-089. Keep Chat on Flash;
  test the Guides verifier on the cheaper model before switching it.
- Audible/Kindle: no official public API; only reverse-engineered libraries. Do not build
  on them (ToS, account-ban and store-policy risk). Use user-entered/CSV book lists (T-096).
- Audio (T-095): LibriVox = public-domain audiobooks, free for any use; Spotify iFrame embed
  needs no key; Podcast Index / iTunes Search = discovery, no key.

### 3.9 Measured corrections + YouTube-at-scale + charger design (2026-10-02, T-089 work)

**Measured through the live proxy (not estimated):**
- The chat system prompt is ~10.5k tokens, not ~5k (12 chat-tagged frameworks alone = 6.3k;
  tail rules/tools/chargers/format ~3.5k; per-user part only ~150 tokens). Real cost today is
  therefore ~Rs0.30/msg (10.5k x $0.30/1M + ~100 out tokens), double the Rs0.15 used above.
  => at 8 msgs/day a paying user costs ~Rs72/month uncached: the Plus price in Design v1
  (Rs99/mo) is only safe AFTER caching. Caching is the prerequisite, as the owner said.
- 97% of the prompt is identical for every user and persona. Automatic (implicit) Gemini
  caching hit only 2 of 8 calls on the current order and 4 of 8 on a reordered one (random,
  best-effort), so it cannot be relied on. Explicit caching: cached input ~90% cheaper
  -> ~Rs0.07/msg (~75% cut). Cache storage is ~$1 per 1M tokens per hour (~Rs0.9/h for 10k
  tokens), so with a 10-minute TTL it pays whenever >=2 messages land in a window - shared
  by all users, so it gets better as users grow.
- Built: clarvoyance_v259.html (candidate, NOT promoted) = prompt split into static + per-user
  parts, flag-gated cached payload (default OFF, auto-falls-back), old path byte-identical to
  v258. Behaviour check old vs new payload shape on 8 live turns (2 personas): all valid JSON
  with every required field; total words 86 vs 77 (coach), 92 vs 95 (nurturer). Putting the
  per-user block in the FIRST turn instead made replies noticeably longer (31 vs 21 words),
  so it rides on the LAST user turn. Needs proxy change: workers/gemini-cache-snippet.js
  (proxy source is not in this repo - owner to paste cold-frog-d555 code so it can be merged
  and tested; cannot be tested without the proxy's Gemini key).

**YouTube when users grow:** quota is a ceiling (10,000 units/day, new search = 101), not a
bill. Shared cache reads cost 0. Worst case per heavy user ~1,010 units, so ~10 heavy
searchers/day can exhaust it; effect = new searches/pool-growth stop, cached topics keep
working (degrades, does not break). Order of fixes: (1) file the free quota-extension audit
early (weeks, manual, not guaranteed) - prepare for it: embeds only (done), no overlays
(done), YouTube ToS + Google Privacy links in app/privacy.html (privacy.html mentions YouTube
once - check it is enough), and CACHE RETENTION: YouTube's developer policy limits how long
non-authorized API data may be stored (30-day rule, and videos must be re-verified); our
youtube_topic_cache since v205 never ages out rows -> likely a compliance gap to fix BEFORE
filing (verify against the official policy page; T-097). (2) channel RSS feeds (no quota),
(3) server-side daily budget guard that keeps a reserve for core topics, (4) fallback sources
when quota is out: own Reels, quote/photo cards, Guides.

**T-094 design (AI chargers + manifestation furnace):**
- Data: `generated_chargers(theme, lang, tone, variants jsonb, version, created_at)` shared
  templates; per-user only stores which themes are active + a small rolling seen-list.
- Pipeline: nightly BATCH job (Batch API, cheap model) writes N fresh variants per
  (theme x language x tone) from admin-set rules (house style, length, no outcome promises);
  a cheap second pass checks the rules; client swaps {name}/{desire} locally. Cost is fixed per
  theme, independent of user count.
- Which themes a user gets: derived from profile weaknesses + recurring Clar state_read, not
  a new AI call per user. Free = 2 themes (e.g. confidence, communication), Plus = more themes
  + daily refresh + custom theme text.
- Furnace: each extracted desire (v211) -> daily batch of "already true" lines + matching
  photo/video from the existing pools (Pexels/Pixabay/YouTube), rendered as Vibe cards.
- Guardrails: affirmations only; admin "kill row"; every generated line stored with its
  prompt version for audit.
- See docs/AI-MODELS.md for the measured caching results, per-call-site model tiers and the proxy rollout (T-089/T-099).

### 3.10 Owner's pricing model v2 (2026-10-02) — XP-funded Plus, cash Pro
Owner idea: no permanent free tier; new users get starting XP; two plans — Plus Rs99/mo (almost all
features) that XP can fully pay for, and Pro Rs199/mo (advanced features) that needs cash (idea: 50% XP /
50% cash). Engaged users get Plus "almost free" and keep earning XP; Pro is the real revenue.
Assessment: strong fit with the product philosophy (engagement is the payment) but needs, in order:
(1) server-trusted XP (today XP is client-computed and pushed - editable) = T-100; (2) enforcement: the
Gemini proxy is unauthenticated and limits live in localStorage, so a paywall is only cosmetic until
the proxy checks JWT + plan = T-101; (3) a soft landing instead of a hard zero: starting XP = 7-14 day
reverse trial, then a thin Basic (streak, NN, a few chargers, Community read) rather than nothing,
because the feed/Community need people and conversion in India is low (RevenueCat 1.4%); (4) Pro must
be clearly different or all revenue vanishes into XP-paid Plus; (5) never sell XP for cash; (6) test
Rs199 vs Rs149 and an annual price; Rs199 is high for India for a young app = T-102.
Illustrative economics (assumptions, not data): 1000 active users, avg AI+silent cost Rs30/user/mo =
Rs30k. 60% XP-paid Plus (Rs0), 25% cash Plus, 10% Pro at ~Rs199 -> revenue ~Rs44.6k, margin ~Rs13k.
If only 3% reach Pro -> revenue ~Rs30.7k = break-even. The whole model hangs on Pro conversion.
