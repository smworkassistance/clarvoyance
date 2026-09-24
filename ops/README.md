# ops/ — Agentic Delivery Kit (ADK)

Generic delivery tooling: task state machine, verify gate, promote/rollback, Stop hook. Rules: `../docs/PROCESS.md`. Design: `../docs/INFRA-PLAN.md`.

| File | Job |
|---|---|
| `adk.config.json` | **The only project-specific file in `ops/`** (entry file names, version regexes, protected paths…) |
| `tasks.js` (+`lib.js`, `render.js`, `migrate.js`) | Task engine over `tasks.json`; renders `TASKS.md` |
| `verify.js` | Full regression gate; records `ops/.state/last-verify.json` |
| `promote.js` / `rollback.js` | Release with a tagged rollback point / restore it |
| `../.claude/hooks/stop-guard.js` | Keeps the agent working during a declared run |

## Reusing ADK in another project (≈15 minutes)

1. Copy: `ops/`, `qa/` (without `node_modules`, `.browsers`, `test-results`, `tests/__snapshots__`), `docs/PROCESS.md`, `docs/INFRA-PLAN.md`, `docs/templates/`, `.claude/hooks/stop-guard.js`.
2. Edit `ops/adk.config.json`: `project`, `app.liveEntry` / `serviceWorker` (or remove the SW parts if the project has none), `versionFilePattern`, `versionLabelRegex`, `swCacheRegex/Template`, `protectedPaths`.
3. Edit `qa/app-map.json` (tabs/sections/stable regions/ignored URLs) and rewrite `qa/tests/app.spec.js` for the new app's core flows. Keep `qa/tests/harness.js` (network isolation).
4. `cd qa && npm install && PLAYWRIGHT_BROWSERS_PATH=./.browsers npx playwright install chromium webkit`
5. `node ops/tasks.js init`, add tasks, write the brief, freeze, run.
6. Add the Stop hook to the project's `.claude/settings.json`:
   `"hooks": {"Stop": [{"hooks": [{"type": "command", "command": "node .claude/hooks/stop-guard.js"}]}]}`
7. Add to `.gitignore`: `qa/node_modules/ qa/.browsers/ qa/test-results/ ops/.state/`.
8. Non-web projects: replace `verify.js` step 3 with the project's own test command; the rest (tasks, freeze, DONE gating, hook) is unchanged.

## Safety properties (tested — see docs/RUNLOG.md for the acceptance run)
- Stop hook is inert unless `tasks.json.run.active` is true; caps + errors ⇒ allow stop.
- `set … DONE` refuses without `--evidence` and a fresh, full, passing verify on the *current bytes*.
- `migrate` refuses to read a generated `TASKS.md`; frozen batches reject new tasks; `run start` re-checks the scope hash.
