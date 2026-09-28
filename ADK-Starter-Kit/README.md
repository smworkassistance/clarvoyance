# ADK Starter Kit

The delivery discipline that ships Clarvoyance (brief → frozen batch contract → build → verify
gate → promote with a rollback tag → append-only log, with a Stop hook that keeps the agent
working through a multi-hour run instead of stopping early) — extracted so a brand-new project
starts at the same standard on day one, without re-explaining any of it.

Source of truth for *why* it's built this way: Clarvoyance's own `docs/INFRA-PLAN.md` and
`ops/README.md`. This kit is the same `ops/` engine, generic by construction (every project-
specific value lives in one file, `ops/adk.config.json` — nothing else should need editing).

## Use it

1. Copy this whole folder's contents into the new project's root (merge, don't nest).
2. Rename `CLAUDE.md.template` → `CLAUDE.md`.
3. Open the new project in Claude Code and say what the project is. The first session reads
   `CLAUDE.md`'s bootstrap section, asks a short fixed set of questions, and fills in
   `## Project Facts` + `ops/adk.config.json`'s placeholders from the answers — you don't fill
   those in by hand.
4. `node ops/tasks.js init`
5. Add `.claude/settings.json` with the Stop hook (see below) if the project doesn't already have
   one, or merge the `hooks.Stop` block into an existing one.
6. `cd qa && npm install && npx playwright install chromium` — only if this project is a web app
   with a browser-testable UI; skip `qa/` entirely otherwise (delete the folder) and adapt
   `ops/verify.js`'s step 3 to run this project's own test command instead.
7. Add to `.gitignore`: `qa/node_modules/`, `qa/.browsers/`, `qa/test-results/`, `ops/.state/`.

From here on: brief → freeze → run → verify → (promote, if applicable) → log, same as Clarvoyance.

## Stop hook — `.claude/settings.json`
```json
{
  "hooks": {
    "Stop": [
      { "hooks": [ { "type": "command", "command": "node .claude/hooks/stop-guard.js" } ] }
    ]
  }
}
```
Inert unless `tasks.json`'s `run.active` is true — a normal (non-batch) conversation is never
affected by it.

## What's genuinely reusable as-is vs. what needs adapting
| Reusable unchanged | Needs the new project's own shape |
|---|---|
| `ops/tasks.js`, `ops/lib.js`, `ops/migrate.js`, `ops/render.js` (task engine) | `ops/adk.config.json` (fill placeholders) |
| `ops/promote.js`, `ops/rollback.js` (IF the project has a "promote a build to live" step at all — a backend service or library might not; delete these two and the corresponding `docs/PROCESS.md` section if so) | `ops/verify.js` steps 1-2 (assume a single-HTML-file-with-service-worker app, Clarvoyance's own shape) — replace or drop for a different architecture; step 3 (run the real test suite) is the part every project needs, just pointed at its own test command |
| `.claude/hooks/stop-guard.js` | `qa/` (delete if not a browser-testable web app; otherwise its `app-map.json`/`tests/app.spec.js` equivalent is inherently project-specific and gets written fresh) |
| `docs/PROCESS.md`, `docs/templates/BRIEF.md`, `docs/templates/BATCH.md` | `docs/DECISIONS.md`/`docs/RUNLOG.md` (start empty, same header) |
| The four-hat protocol + communication rules in `CLAUDE.md.template` | `## Project Facts` (bootstrap answers) |

## Not yet built (known gap, honest)
An automated "copy this into an empty folder → single command finishes setup" installer. Right
now step 1-7 above is a short manual checklist (~10-15 min), not a script. Worth automating once
this kit has been used on a second real project and the manual steps have proven themselves
stable enough to be worth scripting.
