# DESIGN STANDARD — how every screen we ship should look, feel and behave

> **Purpose.** The owner should never have to say "make it look professional". This is the bar, written down once, so any UI/UX task —
> in Clar or in a completely different app — is delivered at the same standard by default.
> **Reuse in another project:** copy this file, then replace only §2 (the tokens) and §5 (screen→reference table) with that app's own.
> Everything else is universal.
> Related: `docs/PROCESS.md` (Definition of Done includes the UI checklist in §6 and the "inspired by" report in §7).

---

## 1. Principles (universal — apply to every app)

1. **One primary job per screen.** A screen answers one question ("how am I doing?", "who's here?"). Everything else is secondary and quieter.
2. **Private vs public are visibly separate.** What only the user sees is labelled ("Only you") and styled differently from what others see. Sharing is always a per-item choice, never a blanket switch, and the default for sensitive items is private. *(Strava/Instagram: private analytics vs public profile.)*
3. **Bottom bar = 3–5 top-level places** of equal importance, thumb-reachable; the centre may carry the app's core action (raised). Never hide the bar behind full-screen overlays that are meant to be *tabs*. *(NN/g, Material, Apple HIG.)*
4. **Progressive disclosure.** Show a summary card that opens a full page (rank card → leaderboard, Fortune card → Fortune). Don't dump every chart on one scroll.
5. **Every card explains itself in one line** — a title, a plain-language subtitle, a chevron. If a stranger can't tell what tapping it does, rewrite it.
6. **Empty, loading, error and signed-out states are designed, not defaults.** Loading = skeleton shimmer (not a spinner on blank). Empty = one friendly sentence + one action. Signed-out = an *example preview* that shows the value, then the sign-in (never a bare wall).
7. **Feedback within 100 ms.** Press states (scale .97–.985), toggles flip instantly, counts animate. Motion is short (150–300 ms), eased, and never blocks input.
8. **Touch targets ≥ 44 px**, text ≥ 15 px for body (≥ 12 px only for captions/labels), contrast AA in light and dark.
9. **Warm, plain copy** — feeling before mechanism; no jargon; never promise an outcome ("can help", not "will"). See `docs/voice-tone-and-glossary.md`.
10. **Never regress what works.** New UI ships dark behind a flag; the flag-OFF experience must be byte-for-byte what users had. (PROCESS §5.)

## 2. Tokens — Clar (replace this section for another app)

Use the app's CSS variables; never hard-code colours except the two deliberate fixed palettes below.

| Token | Use |
|---|---|
| `--acc` (+ tints via `color-mix`) | accent: active states, primary buttons, links |
| `--bg`, `--su` (surface), `--ca` (card-alt), `--bo` (border) | page / card / chip / hairlines |
| `--tx`, `--lt` | primary text / secondary text |
| `--sh` | card shadow |
| Radius | cards 16–20 px, chips/pills 999 px, tiles 10–14 px |
| Type | system UI stack (`-apple-system, SF Pro Text, Inter`); title 1.1–1.5 rem/800, body .9–1 rem, caption .72–.8 rem/700 uppercase-tracked for labels |
| Spacing | 16 px page gutter, 12 px between cards, 8 px inside chips |
| Fixed palettes | Fortune = dark cosmic (`#1a1233→#0d0a1f`, purple `#c8a0ff`, gold `#f0c987`); status = red `#ff6b6b` / amber `#e0b050` / green `#8de6b0` |
| Motion | `socUp` (enter, 450 ms), press `scale(.985)`, count-up for numbers |

## 3. Patterns we reuse (and where the pattern comes from)

| Pattern | How we do it | Inspired by |
|---|---|---|
| **You tab** = my dashboard: identity + numbers + momentum + private cards + my content, settings behind a ⚙ | hosted Community "me" view | Instagram / Strava "You", Google account page |
| **Private card on top** (Fortune, "Only you") | dark, labelled "Private · only you can see this" | Strava Progress / Apple Health summaries |
| **Rank card → full leaderboard** | trophy tile, big `#N`, "of X this week", top-3 avatars, chevron; page has a one-paragraph "how it works" | Duolingo Leagues, Strava clubs |
| **Per-item share switch** | pill on each goal plate: "✦ Shared on your profile" / "🔒 Only you" + helper text; private plates have a dashed border | Instagram close-friends / Google Photos sharing |
| **Achievements vs In-progress split** | "🏆 Achievements" and "🎯 Actively working on" sections | Strava trophy case / Google Fit goals |
| **Stories row, composer pill, Like heart + double-tap** | Following feed | Instagram / Facebook |
| **Raised centre action** | Clar AI orb in the bar | Instagram Reels-era bars, Google Pixel bars |
| **Hosted overlay as a tab** | overlay ends where the bar begins, no close ✕, bar stays tappable | Instagram web/Threads shell |
| **Signed-out example preview** | blurred, labelled "Example preview" sample content + the sign-in button | Spotify/Duolingo pre-signup previews, Google "see what you get" landing |
| **Skeleton loading, designed empty states** | shimmer blocks; one sentence + one button | Material / Google apps |

## 4. How to decide when a pattern isn't listed
1. Ask: *which 2–3 well-known apps solve this exact problem?* (research, don't guess — record links.)
2. Take the **structure** from them, the **look** from our tokens (§2). Never copy their branding/assets.
3. If two references disagree, prefer the one that keeps **fewer taps** and **keeps private things private**.
4. Write the choice in §5 so the next screen stays consistent.

## 5. Screen → reference table (Clar; keep updated)

| Screen | Structure borrowed from | Notes |
|---|---|---|
| Bottom bar (nav_v2) | Instagram, Google/Material bottom nav, NN/g | 6 buttons, Clar orb raised & centred; Fortune/Profile highlight "You"; Self highlights "Home" |
| Feed | Instagram feed, Facebook composer | Following + Discover sub-tabs; Board moved to You |
| Discover | Instagram Explore / people suggestions | search (handle/name) + "people you might vibe with" (shared interests) |
| You | Instagram profile header, Strava You, Google account | ⚙ → App Profile (settings), Fortune private card, Board card, badges, goal plates |
| Leaderboard | Duolingo Leagues | podium top-3, "You're #N", explains itself |
| Goal plates | Instagram/Google sharing controls | per-goal share pill; achieved vs active |
| Signed-out gate | Duolingo/Spotify previews | example preview, then Google sign-in |

## 6. UI checklist — a UI task is not DONE until every box is true
- [ ] Looks native to the app's tokens in **light and dark**, at 360 px and 390 px width, no horizontal scroll.
- [ ] Every tappable thing ≥ 44 px, has a pressed state, and does what its label says.
- [ ] Loading, empty, error, **signed-out** states exist and look intentional.
- [ ] Private vs shared is unmistakable; nothing private can leak through the UI (verified in a test).
- [ ] Existing screens are unchanged with the flag OFF (visual guard + full suite pass).
- [ ] New behaviour has an automated test that fails if it breaks; screenshots were **looked at**, not only compared.
- [ ] Copy is plain, warm, and promises no outcome.
- [ ] Not verified on real devices/iOS is stated in the report, not hidden.

## 7. "Inspired by" — every delivery report must end with this
A short list: **screen → apps whose structure it follows → what we took / what we deliberately did differently.**
Example (v248 You): *Instagram profile header (identity + counts), Strava "You" (private progress separate from public profile), Duolingo Leagues (rank card → league page); we kept Clar's own colours, radius and copy, and made every goal's sharing an explicit per-goal choice.*

---
*Sources consulted for the v247/v248 decisions:* NN/g "Basic Patterns for Mobile Navigation"; UXPin/Justinmind mobile-navigation guides (3–5 tabs, thumb zone); BikeRadar on Strava's You tab; Strava Help (profile & activity privacy); Duolingo Help (leagues/leaderboards).
