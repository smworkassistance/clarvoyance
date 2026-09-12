# Clarvoyance — Voice, Safety & Feature Glossary

> Permanent reference copy of the document also published live at:
> https://claude.ai/code/artifact/1d31f371-d3ad-470f-b448-81eed0847cf1
> (that link stays editable/updatable; this file is the durable repo backup —
> if the two ever disagree, treat the artifact as current and re-sync this file.)

Source content for three things at once: the in-app Help Glossary (`cv-help-glossary`
in `index.html`, shipped v232/v233), the onboarding map carousel (not yet built),
and any future "?" tap-for-help icons. Fix wording here first, then propagate.

---

## Part I — Voice & Tone

**1. Describe the feeling, not the mechanism.** Apple never sold "128GB of flash
storage" — they sold "1,000 songs in your pocket." Say what a feature *does for
the person*, not how it's built or what it's technically called.
- Mechanism-first (avoid): "Chargers use repeated affirmation writing to shift your emotional state."
- Feeling-first (use): "Write your way from a bad mood into a better one."

**2. Meet people where they are.** Clarvoyance is built on manifestation and
vibration principles. But most people opening the app for the first time don't
share that vocabulary yet, and copy that leans on it too hard reads as if it's
not *for* them. Keep "frequency," "vibration," "the universe," "manifest" to a
light touch — describe outcomes in plain, ordinary language instead.
- Jargon-heavy (avoid): "Raise your frequency and align with the higher source where all solutions already exist."
- Plain language (use): "A quick practice that shifts your mood and clears your head."

**3. Suggestive, never definitive.** Feeds directly from Part II below. In
practice: "can help," "many people find," "tends to" — never "will," "always,"
"guaranteed." No exceptions, even when confident something works.
- Definitive (avoid): "This will completely shift your mindset."
- Suggestive (use): "Many people notice a real shift after this."

**4. The old story → new story is the app's real spine.** Everything Clarvoyance
does can be traced to one move: helping someone step out of their **old
story** — today's problems, on repeat — and into a **new story** — the life
they're actually trying to build. Goal and New Story Zone are the most literal
expression of this, but it's the emotional undercurrent of the whole app.
Reach for this framing before inventing a new metaphor.

---

## Part II — Safety & Positioning

The app already carries this discipline inside Clar's own conversation (the
existing chat disclaimer, quoted below). This section extends the same
standard to **everything written about the app** — onboarding copy, feature
descriptions, marketing, help text — not just what Clar says mid-conversation.

> "CLAR is a supportive guide, not a licensed therapist, doctor, or professional
> advisor. For major life decisions — financial, medical, legal, or relationship
> — always consult a qualified professional. CLAR helps you feel better and
> think clearer, but the decisions in your life are always yours to make. Never
> act on CLAR's suggestions alone when the stakes are high."
>
> — the app's existing chat disclaimer (Supabase `ai_context`, key: `disclaimer`)

**1. Support system, not a verdict.** Clar helps someone think — it never
delivers a final answer they should act on unquestioned. Nothing in the app's
copy should read as "Clar decided" or "Clar confirmed." It suggests, reflects,
and supports. The person still decides.

**2. No outcome guarantees, anywhere.** Even when the team is confident a
practice works, written copy never promises a result. This isn't just tone
(Part I) — it's real legal exposure the app can't carry. A promised outcome
that doesn't land for someone is a false-claims problem, not just a
disappointed user, and a small number of people may lean on the app past what
it was ever meant to hold. Every claim gets a "can," "may," or "many find"
attached to it — no bare guarantees survive to app copy.

**3. Real people for high-stakes calls.** Any copy touching a genuinely big
decision — health, money, relationships, legal matters, anything time-sensitive
or irreversible — should point outward: friends, family, a doctor, a licensed
professional. Clar is where you think it through; it is never where the
decision gets made.

**4. Fortune reframed as reflection, not prediction.** The Fortune tab's own
name invites a literal reading — "tell me what will happen." Its copy should
always land as a **mirror** (reflecting your real, current state back at you)
rather than a forecast of the future. This is the one section where the
definitive-language rule (Part I, rule 3) matters most.

---

## Part III — Feature Glossary

Written against Parts I & II above, from the owner's own explanation of what
each feature is actually for. 28 entries, grouped by where they live in the app.

### How to Use Clar

- **Getting the most from Clar** — *"How do I use Clar?"* — Talk to Clar often — the more you show up, the more it can actually help. Many people find real value spending around an hour a day across the app, though even a few minutes counts. Write down a real goal, so Clar can tailor what it shows you. Explore every part of the app at least once — Chargers, Tools, Self, and Fortune each help in a different way. Set your Non-Negotiables and try not to miss them — they're the foundation everything else builds on. Stuck on how something works? Search here, or just ask Clar directly. Need more than that? Write to us. Think of Clar less like an app and more like a companion for the life you're building — one that also knows how to help you unwind, with short videos and quotes built right into your feed.

### Main Sections (bottom navigation)

- **Clar AI** — *"How do I use Clar?"* — Your daily companion. Talk through what's on your mind — a problem, a decision, anything — the way you would with a close friend: no judgment, real suggestions, and help finding a lighter way to see it.
- **Home** — *"What's on Home?"* — Your dashboard — XP, streak, Non-Negotiables, your active Practice Plan, and quick shortcuts to Chargers, Tools, and your Foundation.
- **Vibe** — *"What is Vibe?"* — An endless, swipeable feed — like Reels, but built for your mind. Short videos, quick practices, and small challenges mixed in, so whenever you need to reset in the moment, it's right here.
- **Goal** — *"What's the Goal tab for?"* — Where you write the life you're building toward, in vivid detail, with images that help you actually picture it. This is your new story — the one you're writing on purpose, instead of the one that's just been happening to you. Clar pulls real content that matches the specific things you name here.
- **Self** — *"What's in the Self tab?"* — The deeper practices — the ones that connect you to a steadier, stronger version of yourself the more you return to them. Worth making time for, even though (or because) they ask a little more than a quick exercise does.
- **Fortune** — *"What is Fortune?"* — Your mirror. A space for honest self-reflection — an AI reading of where you really are right now, a Pattern Map of your balance, and real charts of your own progress. Worth visiting often — not to see the future, but to see your present more clearly.

### Home — Extras (dashboard cards)

- **Non-Negotiables** — *"What are Non-Negotiables?"* — The handful of things in your day that don't move — sleep, your time with Clar, whatever your routine actually depends on. Build consistency here first, and everything else gets easier to build on top of.
- **Practice Plan** — *"What is a Practice Plan?"* — A short, Clar-suggested practice tied to something specific — a goal or a problem you've talked about — time-boxed with a real target, and checked in on by Clar.
- **Mind Chargers** — *"What do Chargers do?"* — Short writing practices for the mind you want to be in. Write out how you want to feel — confident, calm, powerful — for a few focused minutes, and many people notice a real shift in state by the end.
- **Tools** — *"What are Tools?"* — Quick mental and physical practices, matched to how your mood is running — low, mid, or high. Done with real focus, most people feel a noticeable shift within minutes.
- **My Foundation** — *"What is My Foundation?"* — Your why. The people who inspire you, or the moment that pushed you to start — kept in one place so you can come back to it whenever you need reminding.

### Self Tab — Practices (in on-screen order)

- **True View Chart** — *"What is the True View Chart?"* — A perspective-shifting exercise — write the same situation two ways, then hold onto the truer, more empowering version for 68 seconds.
- **Pure Abundance** — *"What is Pure Abundance?"* — A full-screen absorption practice — sit with a feeling of real abundance against whatever's resisting it, held for 68 seconds.
- **My Personal Space** — *"What is My Personal Space?"* — A place to dump everything in your head — no filter, no structure. Getting it out and onto the page tends to make things feel lighter, and easier to think through clearly.
- **Peak State** *(also a floating button)* — *"What is Peak State?"* — "I Am That I Am" — write and hold onto the most powerful version of how you want to feel: unstoppable, capable, in control. Many people find that even a short session here noticeably shifts their state.
- **Slow, Soft & Swift** — *"What is Slow, Soft & Swift?"* — A daily way of moving through life: slow and deliberate, gentle in how you speak and hold things, and fully decisive the moment action is actually needed. Slow is smooth, and smooth is fast.
- **Non-Doing Timer** — *"What is the Non-Doing Timer?"* — A timer for doing absolutely nothing — no phone, no people, not even sleep. Just you, sitting with yourself. Many find real stillness here, and sometimes real answers too.
- **Walk & Talk** — *"What is Walk & Talk?"* — Go for a walk and talk through what's on your mind — out loud, to yourself. A lot of people find real relief, and sometimes real resolution, by the end of the walk.
- **Protect Yourself** — *"What is Protect Yourself?"* — Guard your energy — name the distractions to cut, the habits to rein in, and let go of opinions about your life that were never yours to carry.
- **Revise & Repeat** *(shortcut)* — *"What is Revise & Repeat?"* — Curated philosophy, quotes, and your own saved images and thoughts — for revisiting the things worth repeating until they stick.

### Fortune Tab (four collapsible sections)

- **Reading** — *"What is the Fortune Reading?"* — A reflection on where things seem to be heading for you right now, grounded in your real streak, mood, and recent conversations — a mirror on your present, not a promise about your future.
- **Pattern Map** — *"What is the Pattern Map?"* — A 5-dimension view of your current state — goal clarity, belief alignment, daily action, and more — built from your real activity, not a guess.
- **Pulse** — *"What is Pulse?"* — A weekly reflection on how your week actually went, plus a shareable card for your streak and progress.
- **Your Insights** — *"What are the Insights charts?"* — Real charts of your own history — momentum over time, a section-balance radar, a Non-Negotiables heatmap, and daily performance bars.

### Floating Buttons (visible on every tab)

- **New Story Zone** — *"What is New Story Zone?"* — This is the idea behind the whole app in one place: you're not stuck in your old story — today's problems, on repeat. You're writing a new one, on purpose. Nothing typed here is saved; it's for the writing itself, not for keeping a record.
- **Quick Capture** — *"What is the pencil button?"* — Write a quick thought on the go, with zero setup. Also never saved — it's for catching a thought, not keeping one.
- **Peak State talk** *(floating button)* — *"What's the lightning bolt button?"* — A quick space to write empowering self-talk on the go — courage, confidence, unshakeable belief in yourself. Not saved, same as the other two floating buttons.

---

*v1 — captured 2026-09-12, after the owner reviewed and corrected the original
draft over several rounds of voice notes. Shipped into the app as the Help
Glossary in v232, fidelity-corrected in v233 (3 entries had drifted during
transcription — see CLAUDE.md v233 entry). "How to Use Clar" added as the
Glossary's first section in v234, alongside the new one-time Life Quiz
(3 reflection questions at the end of onboarding, answers saved straight
into `present_challenge`/`permanent_challenge`/`goal` — the same fields
Clar's own conversation already reads — see CLAUDE.md v234 entry for the
full mechanics). Edit this file and the live artifact together; they
should never diverge.*
