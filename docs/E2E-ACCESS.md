# E2E-ACCESS — what Claude needs enabled to test end-to-end (so the owner is only asked for rare things)

Principle (PROCESS §0.6): Claude does the deep testing. This file lists **what must be switched on once**, and **the exact one-liner** to do it.
If a task needs something not listed here, Claude adds it here and asks for it **in the intake, before starting** — not mid-run.

## A. Standing access (set up once; re-check at the start of every run)
| Need | Why | How to enable (owner, one time) | How Claude checks it |
|---|---|---|---|
| Chrome with remote debugging on port 9222 and the dedicated profile, **signed in to Google** | live read-only pass on the deployed site with a real account; real Community data | `chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\Users\LENOVO\ChromeDebugProfile"` (sign in to Google once in that window) | `curl http://127.0.0.1:9222/json/version` → 200 |
| Playwright browsers in `qa/.browsers` | automated suite | already installed (`cd qa && npm install && npx playwright install chromium`) | `node ops/verify.js` |
| Supabase read access via the public anon key | Claude can read public tables + call RPCs with a throw-away anonymous session (curl) | none — key is public in the app | see `docs/PROJECT.md` |
| GitHub push (`git push origin main --tags`) | publish | approved per release ("publish it" in chat) — the permission system blocks pushes without an explicit go-ahead | — |

## B. Per-feature enablement (Claude lists these in the BRIEF, with the exact line)
- **New DB objects** (tables/functions): owner runs the SQL file once in the Supabase SQL editor. Claude then verifies with a throw-away anonymous session (curl) — owner never has to test it.
- **New Worker / secrets**: owner pastes the Worker and sets secrets; Claude verifies with curl.
- **Feature flags**: Claude reads them; owner flips them only for *dark-launched* features (or Claude ships the default in code).

## C. What Claude never asks the owner to test
Anything visible in a browser, anything reachable by curl, any UI state, any regression. Claude does these itself and reports evidence.

## D. What is genuinely left for the owner (rare)
Real iPhone/Android device feel, paying/creating third-party accounts, secrets, Google consent screens, business/taste decisions.

## E. Safety rules for the live pass
Read-only by default: no posting, no toggling privacy/goals, no follow/unfollow on the owner's real account. If a write is unavoidable, use an isolated
browser context + a disposable account, and clean up. Delete screenshots that show personal data after reviewing them.
