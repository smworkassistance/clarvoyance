# Clar Landing v4 + supporting pages — BUILD SPEC (for Sonnet execution)

> **STATUS (2026-10-03, built and verified): DONE** — `landing/index.html` + `landing/content.json`
> fully rewritten; `landing/contact.html`, `landing/feedback.html`, `landing/scholarship.html` built;
> `db/schema_v261_landing_pages.sql` written + verified on a real Postgres engine (pglite,
> `qa/sql/schema-v261.test.js`, 14/14 pass) — **owner still needs to run it in the Supabase SQL editor**
> (until then the bot's lead form, Feedback and Scholarship pages soft-fail gracefully instead of saving).
> Live-verified in a real headless browser (desktop 1400px + mobile 390px, 3 random palettes sampled):
> 23/23 checks (palette vars set, slider immediately after the intro section, marquee/wisdom/return
> sections render, About truly merged — pillars+HI+honest+9 FAQ in one section, no separate #faq
> section, footer has Contact/Feedback/Scholarship, bot opens + a premade question gets a real reply
> with the Gemini call mocked, bot FAB does not overlap the mobile sticky CTA, zero console/page errors
> on every page including the 3 new static ones). Screenshots reviewed by Claude across 3 different
> random palettes — Lavender Mist, Sky, Peach-ish — all legible, all genuinely colourful (no near-black
> dark bands). **NOT done this pass, flagged, not silently skipped:** P9's in-app "delete → feedback
> screen" (a clarvoyance_vN.html change to the live app's account-delete flow) — this touches the live
> app's own account/data-deletion path, a different risk class from the isolated landing page, and
> wasn't re-confirmed by the owner in this specific round; ask before building it. The landing is still
> `noindex`, unlinked from the app, exactly as before — nothing here is public yet.
>
> Owner approved 2026-10-03. Opus planned; Sonnet executes.
> Standing rules: app changes go in a NEW `clarvoyance_vN.html` (don't disturb the live app);
> the landing (`landing/`) is a separate static site, edited in place (currently `noindex`, under review, not linked from the app).
> Honesty rule (owner's): no false claims, no fake testimonials/numbers, no competitor/author names implying endorsement,
> outcomes always "can / many find / tends to", never "will". Keep it single-file + lightweight.

---

## 0. THE SPINE (the one connected story — repeat it, don't scatter)
Every section ladders to one idea: **you grow → that growth is your currency → it carries you toward what you want AND lowers your price.**

Locked copy:
- **Hero kicker:** `For us,`
- **Hero headline (locked):** `your growth is your currency.`
- **Spine support (hero sub / reused):**
  `Most apps waste your time. Clar pays you back for it. Here, time isn't spent — it's invested.`
  `Every minute on Clar is a minute invested in your growth and success.`
- **Secondary motif lines (reuse across page):**
  - `The more you grow, the less you pay — because Clar would rather see you grow than see you pay.`
  - `If you've tried everything else, try Clar.`
- **XP label (fixes confusion):** always write **`XP (your growth score)`** on first mention in a section, then "growth score" as the motif. Never bare "XP" without the clarifier the first time.
- **Honesty clarifier (near hero + pricing):**
  `You earn your growth score (XP) only by showing up and doing the work. It lowers your price — never your access — and it's never sold or spent on anything else.`

## 1. THE 5-SECOND RULE (research-backed, non-negotiable)
Above the fold, with no scroll, the hero must answer instantly: **what Clar is · who it's for · why it's powerful.** One focused promise (not many). Benefit headline + one real app screenshot. (5-second test; single value-prop.)

---

## 2. SECTION FLOW (fewer, deeper sections — no shallow tabs)
1. **Hero** — big Clar logo + wordmark; kicker + locked headline; spine support; one real phone screenshot; one CTA (`Start free`).
2. **Showcase slider (high up, auto-slide)** — phone **hero-size** (currently too small — enlarge to match hero). Each feature = *the magic it does for the user* (NOT why we built it). Auto-advance ~6.5s; arrows/dots/swipe/keyboard; pause on interaction; 3D tilt on desktop.
3. **The shift (rooted, not airy)** — `Your feed spends your time. Clar invests it — toward what you actually want.` Tight, concrete.
4. **Wherever life asks more of you, Clar walks with you** — ~120-subject **auto-scroll marquee** (3–4 drifting rows): health, money, love, work, focus, courage, business, study, discipline, confidence, grief, parenting, spirituality, habits, sleep, anxiety, purpose… Grouped loosely.
5. **What you'll get (the return)** — the heart. Aspiration cards: focus that holds · goals actually finished · respect from the people who matter · presence/aura · influence. Plus ONE measured **cost-of-drift (fear)** line (fear motivates) — honest: `The minutes go either way. A year from now they've either compounded — or quietly slipped.` No guarantees.
6. **Wisdom slider** — auto-moving **attributed** quotes. Timeless-first (Bhagavad Gita, Rumi, Marcus Aurelius, Lao Tzu, Emerson, James Allen, Thoreau); a few modern **text-only, attributed, no photos, no implied endorsement**. Each quote chosen to echo Clar's philosophy.
7. **Pricing (one section)** — Free forever + Plus ₹99 + Pro ₹199 + the XP (growth score) → lower-price calculator. This section is the spine's proof: `the more you grow, the less you pay.`
8. **Why Clar / What Clar is NOT / Questions (one consolidated section)** — About + the honest "what Clar is not" + FAQ folded together. No separate "Questions" tab.
9. **Final CTA** (big) + footer with links to Contact · Scholarship · Feedback · Privacy · Instagram.
10. **Floating "Ask Clar" convince-bot** (see §5 below).

---

## 3. GLOBAL MECHANICS
- **Rotating palettes:** 6–8 hand-tuned **light-English + mixed/blended** palettes (e.g. Celadon, Lavender Mist, Peach Dawn, Sky, Rose, Sage, Honey, Mist — each a light base + a complementary mixed accent + a warm/gold pop). One picked at **random on every page load**, same beautiful-shade quality as now (not a wall of saturated colour). No weather API. Define as palette objects; a tiny loader sets CSS vars on `:root` before first paint.
  - The WHOLE theme shifts together each load — accent, gradients, aurora glow, chips AND the dark bands — so it always feels like one designed palette, never random mismatched colours.
  - **Dark sections must NOT be near-black** (the original complaint): each palette supplies its own *deep-but-alive* dark tone (a rich tint of that palette's hue, e.g. deep teal / plum / forest / indigo), never almost-black. Always attractive and clearly coloured.
  - Keep text contrast AA on every palette, light and dark bands both.
- **Images everywhere:** not just phone screens — soft photo-wash backgrounds in section headers using our **licensed Pixabay photos** (already hosted in `photo_library`; a curated set lives in the repo's landing img pipeline). Tasteful, low-opacity, never fighting the text.
- **Live feel (not dead/2D):** gradient + variable-weight display type; scroll-reveal; subtle parallax; 3D-tilt phone; drifting aurora on dark bands; the marquee; floating chips. All CSS/Canvas-level — **no Spline/Three.js** (keep it light, single file).
- **Mobile-first:** everything legible and tappable at 360–430px; marquee + slider + bot all work on touch; no horizontal page scroll.
- **Digestible at a glance:** short lines, one idea per block, benefit-first.

---

## 4. WISDOM / AUTHORS — honest + legally safe (DO NOT skip)
- **No photos of named modern authors** (Abraham Hicks, Bob Proctor, etc.) next to Clar — implies endorsement → real Lanham Act (false endorsement) + right-of-publicity risk. Owner confirmed: attributed **text** quotes are fine; photos are out unless the owner secures written rights.
- Prefer **public-domain / timeless** sources (100% safe, timeless, on-philosophy).
- Modern authors: short attributed text only, sparing, never "they endorse Clar."
- Faces → replace with our royalty-free evocative imagery.

---

## 5. "ASK CLAR" CONVINCE-BOT (real AI)
- Floating launcher (bottom corner) → chat panel. Large Clar logo/name present.
- **2–3 premade questions:** `How can Clar help me?` · `Is the free version enough for me?` · `I feel stuck — where do I start?`
- Real AI via existing **Gemini worker (`cold-frog-d555`)** with a scoped **"landing concierge" prompt**: first understand where the person is in life, then convince — from Clar's philosophy — why starting with the **free** version is right for them. Warm, honest, no guarantees/medical claims.
- **Lead capture:** name / email / contact, **opt-in**, with a consent line + privacy link → `landing_leads` Supabase table (anon insert-only, same lockdown pattern).
- **Guardrails (public + unauthenticated):** landing-origin CORS on the worker; **per-session message cap** (abuse guard); honest-limits in the prompt.

---

## 6. SUPPORTING PAGES / APP CHANGE
- **Contact Us — BUILD (lightweight static, `privacy.html` pattern):** email, phone/WhatsApp (+91 7387400467), Instagram (@beyond._thought).
- **Feedback — BUILD (simple):** rating + reason chips + a free **"what you want to say"** box + optional email → Supabase (`landing_feedback` or reuse). Linked in footer.
- **Scholarship — BUILD (honest, small):** `Clar Growth Scholarship — free Pro for students / those who genuinely can't afford it.` Application form → Supabase. Only promise what can be honored; **no fabricated numbers**. After core landing.
- **Support / Donate — DEFER:** premature at current scale; do a light "Spread Clar / share" now, revisit donate with traction.
- **App: delete → feedback screen (NEW `clarvoyance_vN.html`):** before the `DELETE` confirm (v255 flow), a short, kind feedback screen — reason chips + optional box ("before you go, what was missing?") → Supabase. Skippable. App change only; do NOT touch the landing for this.

---

## 7. BACKEND / HONESTY / LEGAL GUARDRAILS
- New small Supabase tables (`landing_leads`, `landing_feedback`, `scholarship_applications`, plus the app's delete-feedback) — anon insert-only, RLS, service_role read, same lockdown as every table since v178. Consent + privacy link where personal data is taken.
- Bot worker: scoped prompt, CORS for landing origin, per-session cap.
- All outcome/fear copy + quotes: honest, attributed, no fake testimonials/numbers, no implied celebrity endorsement.

---

## 8. EXECUTION PHASES (Sonnet — verify with the landing screenshot harness after each)
- **P0 — Research + copy foundation:** finalize 5-sec hero copy (locked lines in §0), the legal-safe quote set (timeless-first), the ~120 subjects, the outcome + one fear line. Palette set.
- **P1 — Shell:** palette engine + big logo/wordmark + animation polish (variable fonts, reveal, parallax, aurora).
- **P2 — Restructure:** slider moved high, **stage phone enlarged to hero-size**, FAQ→About merge, single Pricing.
- **P3 — Copy rewrite** into `content.json` (honesty-checked; `XP (your growth score)` everywhere).
- **P4 — Imagery everywhere** (photo washes + more screenshots).
- **P5 — 120-subject marquee.**
- **P6 — Wisdom quotes slider.**
- **P7 — Return/outcome section.**
- **P8 — Convince-bot + `landing_leads`.**
- **P9 — Contact + Feedback + Scholarship pages + app delete-feedback (new app version).**
- **P10 — Full mobile/perf pass → owner review → then flip `noindex` off.**

## 9. OWNER OPEN STEPS (carried)
- Run `db/schema_v260_plans.sql` (and the new landing tables once written).
- At plan launch: set Free chat limit to 8 in admin Limits tab.
- Decide public URL / flip `noindex` after review.

## 10. AI PROMO VIDEO (when we reach it)
- Canva MCP is connected here (can design/generate in Canva directly). Free tools: Canva / CapCut.
- Script = spine: identity hook → phone demo → quick feature cuts with growth-score chips → `the more you grow, the less you pay` → `Start free at clar.co.in`. Calm piano, no VO, elegant serif, no stock people. Use real app recording + `landing/img/` for authenticity.

**Research sources:** false endorsement / right of publicity (ott.law, higgslaw.com); 5-second test / single value-prop (wpforms.com, northpeak.io).
