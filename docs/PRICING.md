# Clar pricing, plans and the landing page — decided spec (2026-10-02)

Owner decisions are in **bold**. Everything numeric lives in `pricing/plans.json` (and, after the SQL is run, the `plans` / `plan_settings` tables) — never in code.

## 1. The ladder (website launch first; same rate chart for any later app/store)

| | Free (forever) | Plus ₹99/mo | Pro ₹199/mo |
|---|---|---|---|
| Vibe, Chargers, Tools, Non-Negotiables, Self, Community | all | all | all |
| Clar AI messages / day | 8 | 20 | 60 (cost-safe cap; worst case ≈ ₹99/mo) |
| Fortune progress charts | 2 | all (no AI) | all + **AI report card and suggestions** |
| Pulse | numbers | numbers | numbers + **weekly AI reflection** |
| Goal vision images | 5 | 8 | 12 |
| Universal guides followed | 2 | 4 | 8 |
| Guides made for you | 0 | 3 | 5 |
| Posts / week per own guide | – | 3 | 3 |
| XP discount cap | – | 50% (= "half a month free") | 25% |
| Coming (not in the rate chart yet) | AI-made chargers + manifestation feed, audio, book library, early access (Pro) |

**No trial.** Free is permanent, so a trial is unnecessary. First value comes from the free plan.

## 2. XP → discount (kept simple, one dashboard)

```
eligible_xp(month)  = Σ over days of min(xp_that_day, daily_cap=250)        # steady days, not one binge
target_xp           = clamp( avg(eligible_xp, last 2 months) × 1.15 , base 5000 , max 7000 )   # rises with the person's own usage
discount            = plan_cap% × price × min(1, eligible_xp / target_xp)
cash due            = price − discount
```
* Worked example (Plus ₹99, cap 50%): 3,000 of 5,000 XP → 60% of the cap → ₹29.7 off → ₹69.3.
* XP is **never spent and never sold**: level and streak are unaffected. Cannot be bought with money.
* Sources that earn XP (all capped per day): Vibe cards, chargers/tools, Non-Negotiables, goal work, Self practices, Clar conversation, **Community support (post, cheer, follow, comment — T-103)**, invites (credited only once the invitee is a real engaged member).
* Why a daily cap and a ratchet: 5,000 XP needs ≥ 20 steady days at 250/day; a heavy user's target rises to 1.15× what they really did, so "almost free" stays earned, not automatic.

## 3. Upgrade prompts at the exact moment of need (built in v260, `window.clvUpsell(featureKey)`)
Every gated feature calls one function. It opens a small sheet in the user's own words:
* title = what they were trying to do ("You've used today's 8 messages with Clar"),
* one line of benefit ("Plus gives you 20 a day and all your progress charts"),
* one button ("See Plus") and an honest "Not now".
Enforcement is behind the master switch `plans_enforced` (feature_flags). **OFF at launch** so nothing existing changes; the sheet and My Plan dashboard are live-ready. Turn on per feature once T-101 (server-side entitlement) is done.

## 4. My Plan dashboard (v260, Profile → top of Profile tab)
One glance: plan badge, and animated bars — **XP this month vs target**, chat today, goal images, universal guides, own guides. Under the first bar one plain line: "3,240 / 5,000 XP → ₹32 off Plus". Tap → all plans.

## 5. Private (own) guides — interaction rule (T-104)
A member's private guide keeps posting **only while they interact with its earlier posts** (any signal: read, like, save, practice, report — good or bad). With no interaction on its latest posts the guide pauses; any interaction resumes it. Saves AI cost and keeps guides relevant. Server-side in `guidesTick` (admin-relay).

## 6. Payments and staff tracking (built to plug in, not wired yet)
* `subscriptions` (one live row per user+product), `payments` (every gateway event, idempotent on provider+payment id), `plans`, `plan_settings`, `plan_waitlist`, `my_plan()` — `db/schema_v260_plans.sql` (29/29 tests on a real Postgres engine). **Owner runs it.**
* Gateway-agnostic: `provider` + `provider_*_id`. Razorpay = a Worker with a webhook (`payment.captured`, `subscription.charged/cancelled`) that writes with the service_role key. Clients can never write a plan.
* Checkout: landing and app read `pricing/plans.json → billing.checkout_url`; when set, paid buttons go there with `?plan=<id>`. Until then they join the waitlist (honest message if the table is missing).
* Staff: `admin_subscription_overview` (member, email, plan, status, renewal, discount) for the admin console; an `admin-relay` action will expose it.
* Another app later = a new `product_id` row + its own `plans.json` + `landing/content.json`.

## 7. Landing page (`landing/`)
Generic renderer (`index.html`) driven by `content.json` (words, brand tokens) and `../pricing/plans.json` (prices). Honest-by-design copy: **no fake testimonials, no invented numbers, no competitor names, no guaranteed outcomes.**
Persuasion used (ethically): StoryBrand (visitor is the hero), awareness-stage entry (start from the feeling they already have), reciprocity (free forever), commitment ("one minute"), unity ("people who cheer"), risk reversal (no card, cancel any time, delete your data), contrast section (design intent: time spent vs time invested), concrete specifics (8 / 12 images), moment-led feature cards ("When you need to talk it out…"), honest "what Clar is not", FAQ objection handling, XP calculator (value made tangible), sticky mobile CTA, every CTA carries `?ref=landing&for=<audience>` so we learn what converts.
Owner's lines used or adapted: "born with more than you remember", "Spend it on purpose", HI beats AI, "clarity is found by getting quieter".

**On the AI / HI / UI idea.** Keep **HI ("Human Intelligence")** — it is a strong, positive reframe and sits next to AI instead of fighting it (one section, not the headline). Keep the "universal intelligence" idea **only as the quiet second paragraph** ("many traditions name it differently; Clar asks you to believe nothing"), spelled out — not the abbreviation "UI", which reads as user interface. Do not name competitors or specific authors (implied endorsement, legal). Do not state "every minute on Clar is an investment" as fact; the page says "a minute you chose".

## 8. Build order
1. v260 (this candidate): plans config + My Plan dashboard + upsell sheet (enforcement OFF) — `clarvoyance_v260.html`.
2. Owner: run `db/schema_v260_plans.sql`; host the landing (`landing/`); decide the public URL (clar.co.in root vs `/landing`).
3. T-100 server-side XP ledger → T-101 entitlements enforced in the Gemini proxy and limits → turn `plans_enforced` on.
4. Razorpay account (KYC) + webhook Worker → paid buttons live → admin subscription tab.
5. T-103 Community XP, T-104 private-guide interaction rule.
