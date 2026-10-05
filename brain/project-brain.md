# Project brain — Clarvoyance (level 2)

> Owner-written sections are marked **OWNER'S WORDS** and sit between `OWNER:...:START` and `OWNER:...:END` markers. The dashboard's editor (`brain/serve-dashboard.ps1`) changes only what is between those markers, and only when the owner saves. The brain must not edit or reword them. Other sections are facts, questions, or brain suggestions, and are labelled as such.

## Project identity
- Project name: Clarvoyance (also "Clar")
- Type: own product (mobile-first PWA, plus a native Android app through Capacitor)
- Owner (decision-maker): the user
- Client: none (own product)
- Facts (not vision): single HTML file app, GitHub Pages hosting at clar.co.in, Supabase backend, Cloudflare Workers for API proxies. Source of truth for technical facts: `CLAUDE.md`.

## Vision (OWNER'S WORDS, 2026-10-05)
<!-- OWNER:VISION:START -->
> "Clar mujhe 12 months me monetised chahiye: achha revenue generate karta ho, at least 1 lakh per month net profit."
>
> "Clar real me logo ki life ko transform kar de. Unki Clar ko use karne se pahle aur baad ki life me miraculous antar ho. Stuck, pareshan, ya jo life me apni koi bhi desire, vision, goal, ya problem ka solution pura karne ka rasta dhundh rahe hain, Clar unhe wo rasta dene ka best help tool ban jae."
>
> "Clar wo door hai jo shayad wo hamesha se dhundh rahe the."
<!-- OWNER:VISION:END -->

## Mission (OWNER'S WORDS, 2026-10-05)
<!-- OWNER:MISSION:START -->
> "Me logo ke liye sach me kuch karna chahta hu, aur Clar wo jariya hai, medium hai, hazaro logo ki life ko transform karne ka, unko stuck point se aage badhane ka, unke self-elevation ka."
>
> "Me Clar se logo ki life me positive, beautiful aur wo changes lana chahta hu jo wo kabhi nahi kar pae, wo kar sake. Unki life ki suffering wipe off ho jae, sabse achcha yahi hai."
>
> "Is point pe me kabhi compromise nahi kar sakta."
<!-- OWNER:MISSION:END -->

## Success (OWNER'S WORDS, 2026-10-05)
<!-- OWNER:SUCCESS:START -->
> "Safal ka matlab hai: real lives transformed, real users ka positive feedback, aur huge wealth generation, yani mass transformation of people."
<!-- OWNER:SUCCESS:END -->

## Who this is for (OWNER'S WORDS, 2026-10-05)
<!-- OWNER:FIRSTUSER:START -->
- First user (owner's words): "wo person jo apni life me kuch changes dekhna chahta hai, magar kahi na kahi ek support system dhundh raha hai."
<!-- OWNER:FIRSTUSER:END -->
- Detailed audience profile: still open (see Q-012 in `brain/inbox/questions.md`).

## Constraints
- Time, budget, team size, technical skill available: owner has limited technical time; the project is built with AI tools. Owner's weekly quota is shared with development.
- Things we will not do: TO BE CONFIRMED BY OWNER. The owner said they will never compromise on the transformation goal (see Mission).
- Legal, privacy, or brand rules: copy rules in `docs/voice-tone-and-glossary.md`. No guaranteed outcomes in any user-facing text. A transformation promise must be phrased as "can help" and "many find", never as "will".

## How the owner thinks
See `brain/owner-model.md`. Summary: strong vision and talent, technical load should be removed by the brain, decides big things personally. Wants out-of-the-box and conventional options together, each with real examples.

## Client intake
Not applicable (own product).

## Open questions still to ask the owner
1. Q-012: Who exactly is the first user? Describe one real person you have in mind, in your words.
2. Q-013: Which 3 real problems do they bring to Clar most often? (The owner's own experience counts.)
3. Q-014: What is the one thing you would never change about the app?

## Current tools and connections
- Connected and working: GitHub (repo), Supabase (project data), Cloudflare Workers (Gemini proxy, admin relay, YouTube relay, Bunny relay, photo relay), Chrome DevTools (browser testing, when available), Playwright (regression suite `ops/verify.js`).
- Missing (and the bottleneck it causes): read-only data key for the brain's numbers (B-005); PC-independent scheduling (B-008); phone access to the project (B-004).

## Change log for this file
- 2026-10-05: created from the template, with technical facts only.
- 2026-10-05: owner's words recorded for Vision, Mission, Success, and First user (verbatim, Hinglish kept as spoken). No brain wording added.
- 2026-10-05: owner-written sections wrapped in OWNER markers so the dashboard editor can update them safely.
