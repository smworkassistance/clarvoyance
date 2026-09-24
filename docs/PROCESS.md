# PROCESS — Agentic Delivery Kit (ADK)

> The permanent rulebook for how work is delivered here. Project-agnostic on purpose: to reuse it on another project,
> copy `ops/`, `qa/`, `docs/PROCESS.md`, `docs/templates/`, `.claude/hooks/` and edit only `ops/adk.config.json` + `qa/app-map.json`
> (details: `ops/README.md`). Clarvoyance-specific facts live in `docs/PROJECT.md`. Why it is built this way: `docs/INFRA-PLAN.md`.

## 0. Responsibility (decided 2026-09-25, owner's instruction)

**Claude is responsible for the outcome** — that what was asked is delivered completely, that nothing that works today breaks, that
everything is recorded, and that the product succeeds. The owner is **not** the safety net and should never have to discover a
problem. Concretely, Claude owns:

1. **Getting the requirements right, once.** All prerequisites are collected up front in one intake (`docs/templates/BRIEF.md`).
   After the batch contract is frozen there are no more clarification loops — only genuine blockers (section 6).
2. **Finishing.** A run ends only when every task in the batch is `DONE` or `BLOCKED` with an exact reason. A stuck task never stops the rest.
3. **Not breaking the existing system** (section 5: dark launch, verify gate, additive DB, rollback).
4. **Record keeping** (section 8): if it is not in the repo, it did not happen.
5. **Honest reporting.** What was verified, how, and what could not be verified (e.g. real iPhone). Never "should work".

The owner owns: business/product decisions, taste, real-world steps only a human can do (accounts, payments, real-phone checks),
turning a dark-launched feature on for real users, and anything irreversible or costly.

## 1. Lifecycle of every piece of work

```
BRIEF (owner fills / Claude asks once) -> CLARIFY (one round, defaults proposed) -> CONTRACT FREEZE (batch)
   -> RUN (autonomous, task by task) -> VERIFY GATE (per task) -> PROMOTE (dark) -> REPORT -> owner activates
```

| Step | What happens | Artifact |
|---|---|---|
| Brief | Goal, tasks, acceptance, constraints, what must not change, resources/keys, budget, deadline | `docs/templates/BRIEF.md` (copy per batch) |
| Clarify | Claude lists **every** open question **once**, each with a recommended default. Unanswered = default applies. | in the brief |
| Contract freeze | Scope + acceptance per task + dependencies are frozen with a hash. Scope cannot change during the run. | `docs/batches/Bn.md` + `node ops/tasks.js batch freeze Bn` |
| Run | `node ops/tasks.js run start Bn`. The Stop hook keeps the agent working while runnable tasks remain. | `tasks.json`, `docs/RUNLOG.md` |
| Verify gate | `node ops/verify.js` (scripts parse + version consistency + browser suite on Chromium/Android and WebKit/iPhone) | `ops/.state/last-verify.json` |
| Promote | `node ops/promote.js <candidate>` — tags a rollback point, updates the live entry + service worker | git tag `pre-vN` |
| Report | Done / Blocked (with the exact owner action) / not verifiable | final message + `TASKS.md` |

## 2. Definition of Done (enforced by code, not by trust)

A task may be marked `DONE` only if **all** hold — `node ops/tasks.js set <id> DONE --evidence "…"` refuses otherwise:

1. Its **Done-when** criteria were actually exercised, and the evidence (numbers, screenshots, outputs) is written in `--evidence`.
2. A **full** `node ops/verify.js` passed for the *current bytes* of the files (any later edit invalidates it; `--quick` does not count).
3. Its dependencies are `DONE`.
4. It is committed (one task = one commit).
5. Anything the change touched that has documentation (CLAUDE.md version entry, PROJECT.md) is updated.

Evidence before claims: if the check was not run in this session, it cannot be claimed.

## 3. Task states

`PROPOSED` (idea captured, not in any contract) · `DISCUSS` (needs decisions) · `QUEUED` (has Done-when, ready) ·
`IN_PROGRESS` · `DONE` · `BLOCKED` (needs the owner/external step — **must carry the exact action**) · `STALE` · `DROPPED`.

Rules enforced by `ops/tasks.js`:
- No Done-when ⇒ cannot be `QUEUED`.
- A **frozen** batch cannot gain tasks or change acceptance text. New ideas go in as `PROPOSED` (no batch) and are **not built**.
- A `QUEUED` task older than 24 h since freeze/re-confirm cannot start a run until the owner re-confirms (`--reconfirm`).
- A task starts only when every `depends_on` is `DONE`. Tasks behind a `BLOCKED` one are reported *blocked-by*; independent tasks continue.
- `tasks.json` is the source of truth. `TASKS.md` is generated (`node ops/tasks.js render`) — never hand-edited.

## 4. Scope discipline (why "asked for X, got Y" cannot happen)

- The frozen contract is the only thing built. Anything else is a `PROPOSED` note in the report.
- Every change is built in a **new version file** (`clarvoyance_vN.html`); the live entry is only touched by `promote.js`.
- A run that discovers a bug outside its scope records it as a new task (`PROPOSED`/`DISCUSS`) and continues — it does not fix it silently
  unless the bug makes a contracted task impossible (then the fix is logged in the task's evidence).

## 5. Not breaking the existing system (industry practice, applied)

| Practice | Here |
|---|---|
| **Dark launch behind a feature flag** | Every user-visible change ships OFF (`feature_flags` table / URL override). The old behaviour stays byte-identical until the owner flips it. Turning a flag ON for real users = owner's decision. |
| **Automated regression gate** | `ops/verify.js` (local: Chromium/Android). Nothing is `DONE` or promoted without a passing full run. A second, independent gate runs on CI (Chromium + WebKit/iPhone) — see `docs/INFRA-PLAN.md` §5b. |
| **Ratchet** | Every bug fixed gets a test in `qa/tests/`. The suite only grows. |
| **Visual regression on stable regions** | Pixel-diff (3 % tolerance) of regions that never change (bottom nav …). Dynamic content is never compared. |
| **Additive-only database changes** | New tables/columns/views only; never drop/rename/rewrite. So an app rollback never needs a DB rollback. Destructive SQL needs explicit owner approval. |
| **Rollback point** | `promote.js` tags `pre-vN` first. `node ops/rollback.js pre-vN` restores the previous live files **and bumps the service-worker cache to a brand-new name** (installed apps only update if the name changes). |
| **Test isolation** | Tests block analytics and answer every Supabase/Storage *write* with a fake success — production data and analytics are never polluted. |
| **Small commits** | One task = one commit; bisectable. |

## 6. When something blocks

Try, in order: (1) an alternative that needs nothing from the owner; (2) build everything around it, leaving one clearly marked seam;
(3) `BLOCKED` with the exact action ("owner runs `db/schema_v247.sql` in Supabase SQL editor"). Then **continue with independent tasks**.
Questions to the owner during a run are only for: irreversible actions, spending money, secrets, or a product decision the brief did not cover
and no default can safely cover. Everything else: decide, record in `docs/DECISIONS.md`, move on.

## 6b. Anti-stuck rule (owner's instruction, 2026-09-25)

Never burn tokens hammering one approach. If the same problem resists **3 attempts** (each failed approach is recorded with `node ops/tasks.js attempt <id> "what was tried"`), the tool prints the mandatory **STUCK PROTOCOL**:

1. **Stop** repeating the approach.
2. **Research online** how others solve exactly this (docs, issues, libraries, alternative techniques).
3. **Change the approach** — two genuinely different alternatives, try the cheapest; consider a smaller slice or mocking the blocked part so the rest can ship.
4. **Ask for external help** only after 1–3: mark the task `BLOCKED` with the exact help needed from the owner (what/where/why), and move to the next task.
5. Also applies to tooling problems (e.g. a browser that will not start, a test that hangs): switch method (different runner, isolate with a tiny repro, check known issues, run in CI instead) rather than retrying the same command.

Commands must also be short-lived and observable: long jobs run in the background with a log file and are polled, never as one silent multi-minute foreground call.

## 7. Permissions policy (least privilege, researched)

| Class | Policy |
|---|---|
| Allowed without asking | Read/edit/write inside the repo; `node`; `git status/diff/log/add/commit/tag`; Chrome DevTools MCP; Playwright (installed in `qa/`, browsers in `qa/.browsers`); read-only `curl`/GET; test servers on local ports (only processes this session started). |
| Ask first | `git push` **of anything not covered by an approved promote**; any SQL that writes/alters production; Worker deploys; installing anything outside the repo; anything that spends money or sends messages/posts on the owner's behalf. |
| Processes | Stop only processes identified by **port + exact command line** (`serve.js`, my own test servers). Never pattern-kill by folder name — that once also matched the agent's own shell processes. |
| Never | Force-push, `reset --hard`, `clean -f`, `branch -D`, `rm -rf` (also denied in settings); committing secrets; using the owner's real account for a *write* without the owner saying so for that task. |
| Secrets | Never in chat, never in git. Tokens (if the owner ever provides them) live in an untracked local env file. |
| Promote/push | After a full verify pass, Claude may `promote` **dark** changes and push, announcing the rollback command. Activating a flag for users, or promoting a non-dark user-visible change, needs the owner's go-ahead. |

## 8. Where everything is recorded

| What | File | Written by |
|---|---|---|
| Rules (this file), Definition of Done | `docs/PROCESS.md` | Claude, with owner approval |
| Why the infrastructure is built this way | `docs/INFRA-PLAN.md` | Claude |
| Project facts (URLs, workers, DB, conventions) | `docs/PROJECT.md` | Claude |
| Task queue + status + evidence (machine) | `tasks.json` | `ops/tasks.js` only |
| Task queue (human view) | `TASKS.md` | generated |
| Frozen contract per batch | `docs/batches/Bn.md` | Claude at freeze |
| Decisions, dated | `docs/DECISIONS.md` | Claude |
| What happened, chronologically | `docs/RUNLOG.md` | `ops/tasks.js log`, promote/rollback |
| Version history (what shipped) | `CLAUDE.md` | Claude at each promote |
| Cross-session memory | Claude's memory dir | Claude |

## 9. Standard commands

```
node ops/tasks.js list | show <id> | next | render | log "text"
node ops/tasks.js add --id T-011 --title "…" --done-when "…" --batch B5 [--deps T-010] [--status QUEUED]
node ops/tasks.js batch freeze B5 | check B5 | report B5
node ops/tasks.js run start B5 [--hours 3] | status | finish
node ops/tasks.js set T-011 IN_PROGRESS | DONE --evidence "…" | BLOCKED --note "exact owner action"
QA_TARGET=clarvoyance_v247.html node ops/verify.js          # verify a candidate
node ops/promote.js clarvoyance_v247.html [--dry-run] [--push]
node ops/rollback.js pre-v247 [--dry-run] [--push]
```
