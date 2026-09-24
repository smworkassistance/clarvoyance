# PROJECT — Clarvoyance facts (the project-specific companion to docs/PROCESS.md)

> Product blueprint, architecture, version history: `CLAUDE.md` (single source of truth for the app itself).
> This file = what the *delivery process* needs to know about this project.

## Shape of the project
- Single-file PWA (`index.html`, no build), vanilla JS/CSS. Hosted on GitHub Pages at **https://clar.co.in/** (CDN caches ~10 min after a push). Also bundled into a Capacitor Android app (`www/index.html` copy — not part of this delivery process).
- Live entry: `index.html` + `sw.js` (`CACHE_VERSION = 'clv-vN'`, **bump on every release** or installed apps never update) + `manifest.json`.
- Every change is built in a new file `clarvoyance_vN.html`, verified, then promoted with `node ops/promote.js`.
- Version label in the app: `id="prof-app-ver">vN` (Profile → Updates). Must equal the SW cache number — `verify.js` checks it.

## Backends
| What | Where |
|---|---|
| DB/auth/storage | Supabase project `unvwjuceuyruqdnmvxlc` (RLS everywhere; **explicit GRANTs needed** for `authenticated`/`service_role` — recurring gotcha; `db/schema_*.sql`, additive only) |
| Clar AI proxy | Cloudflare Worker `cold-frog-d555` |
| Admin relay | `workers/admin-relay-worker.js` (`clarvoyance-admin-relay`) |
| YouTube / Wikiquote / photo / Bunny relays | `workers/*.js` → `clar-youtube`, `clar-wikiquote`, (photo: not deployed), `clar-bunny` |
| Video | Bunny Stream library `761770`, CDN `vz-07154b7f-e50.b-cdn.net`, allowed domains clar.co.in / *.clar.co.in / smworkassistance.github.io |

## Feature flags
`feature_flags` table (key, enabled) — e.g. `social_layer` (Community, currently ON). URL override for testing: `?social=1`.
New user-visible work ships dark behind a flag (PROCESS §5). Planned: `nav_v2`.

## Known noise (allow-listed in `qa/app-map.json`)
- 403 on `admin_insights` (T-010: dead usage-correlation client read), placeholder photo-worker URL, YouTube thumbnail 404s, analytics/fonts.
Anything else in the console during `verify` fails the run.

## Conventions
- New code carries inline comments explaining what/why. Copy: feeling-first, plain language, never a guaranteed outcome (`docs/voice-tone-and-glossary.md`).
- UI standard: Instagram/YouTube/Facebook-grade, app theme variables (light+dark), no boxy form look.
- Hide-via-UI, don't delete features. Don't touch the owner's local machine outside the repo. Tests use isolated browser contexts; the owner's real account is used only when the owner says so for that task.

## Verification map
- `qa/app-map.json` lists tabs/selectors. When navigation changes, update the map (and re-baseline the visual guard with `node ops/verify.js --update-snapshots` **only after** reviewing the screenshots).
- Real-phone/iOS checks: reported as "not verified" unless the owner tests.
