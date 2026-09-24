# INFRA PLAN — why the delivery system is built the way it is

Written 2026-09-25. Companion to `docs/PROCESS.md` (the rules) and `ops/README.md` (how to reuse it elsewhere).

## 1. The problem this solves

Real incident (2026-09-24): the owner wrote a long multi-task instruction, went to sleep expecting finished work, and woke to *partial*
delivery — only the tasks that happened to be `QUEUED` were run, five decided items were never built, and nothing forced the agent to
continue. Three fears were named: (a) "something other than what I asked got built", (b) "the existing app broke", (c) "work stopped half way".
Root causes: no mechanism that stops the agent early-stopping; "done" was self-declared; scope was informal prose; verification was ad-hoc.

## 2. Requirements

| # | Requirement |
|---|-------------|
| R1 | Once a batch starts, it runs to completion or to an explicit, recorded blocker — a stuck task must not stop the rest. |
| R2 | "Done" is decided by an objective check, not by the agent's opinion. |
| R3 | Scope is frozen before the run; nothing else gets built. |
| R4 | The existing product cannot be broken silently; there is always a one-command way back. |
| R5 | Everything is recorded in the repo (tasks, decisions, evidence, rollbacks). |
| R6 | Requirements are gathered once, up front, with defaults — no endless clarification. |
| R7 | Low risk to the owner's machine/accounts/data: least privilege, no secrets in chat, tests never write to production. |
| R8 | Reusable for other projects, not just Clarvoyance. |
| R9 | Small: understandable, no heavy framework the owner must learn. |

## 3. What the industry does (researched) and what we took

| Source | Idea | Decision |
|---|---|---|
| [Anthropic — Effective harnesses for long-running agents](https://anthropic.com/engineering/effective-harnesses-for-long-running-agents) and the [autonomous-coding quickstart](https://github.com/anthropics/claude-quickstarts/tree/main/autonomous-coding) | Feature list as **JSON** (LLMs rewrite Markdown carelessly), `passes` flag only set after an end-to-end check, **one feature at a time**, progress file, init script, commit per feature | **Adopted as the pattern**: `tasks.json` (source of truth) + generated `TASKS.md`; DONE only via the CLI which demands verify + evidence. Their Python app not used (it builds new apps). |
| [Claude Code hooks](https://code.claude.com/docs/en/hooks) — Stop hook | A hook can block the agent from stopping and feed it a reason | **Adopted**: `.claude/hooks/stop-guard.js`, active only during a declared run, with time/iteration caps and no effect in normal chat. Installed in project settings (a [known bug](https://github.com/anthropics/claude-code/issues/10412) affects plugin-installed Stop hooks). |
| [Ralph Wiggum plugin](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) (Anthropic) | Re-feed the same prompt until the agent says "complete" | **Reference only.** Completion is *self-declared* — the exact failure we had. Ours exits on task-table state + verify, not on a phrase. |
| [Superpowers — verification-before-completion](https://github.com/obra/superpowers) | "Evidence before claims" | **Adopted as a rule** (PROCESS §2) and enforced by code (`--evidence` + verify freshness). Plugin not installed (its full 7-phase, test-first workflow is too heavy for a single-file app; an [open issue](https://github.com/obra/superpowers/issues/2286) notes it never checks where evidence came from — hence a script decides). |
| [GitHub Spec Kit](https://github.com/github/spec-kit) | Constitution → spec → clarify → plan → tasks; acceptance criteria per story | **Idea adopted**: `PROCESS.md` = constitution, BRIEF = spec+clarify, BATCH contract = plan+tasks. Tool not installed (Python/uv; heavier than needed). |
| [Playwright](https://playwright.dev/mcp/introduction) (Microsoft) | Real Chromium/**WebKit**, device emulation, screenshot comparison | **Adopted** as the test engine (`qa/`). WebKit closes the "Chrome ≠ iPhone Safari" gap of our earlier ad-hoc Chrome checks. Browsers installed *inside* `qa/.browsers` (gitignored). |
| claude-task-master, BMAD-METHOD | Task/agile frameworks | **Rejected** — need AI API keys / far more process than needed (R9). |
| Feature flags / dark launch, canary, ratchet tests, additive DB migrations, tagged rollback (general engineering practice) | Decouple deploy from release; only ever add tests; never break rollbackability | **Adopted** (PROCESS §5). |
| Git worktrees / parallel agents | Isolation for parallel work | **Not used now** — our tasks are mostly sequential; recorded as a future option. |

## 4. Architecture

```
            OWNER                                   CLAUDE (accountable)
   brief / approve / activate                 clarify once -> freeze -> run -> verify -> promote(dark) -> report
        |                                            |
        v                                            v
  docs/templates/BRIEF.md  --->  docs/batches/Bn.md (frozen contract, scope hash in tasks.json)
                                                     |
   .claude/hooks/stop-guard.js  <-- reads tasks.json |   ops/tasks.js  (state machine: deps, freeze, stale, DONE gating)
   (blocks early stop while runnable tasks remain)   |          |
                                                     v          v
                                    ops/verify.js -----> qa/ (Playwright: Chromium-Android + WebKit-iPhone,
                                    scripts parse, version<->SW consistency,   network-isolated, visual guard)
                                    writes ops/.state/last-verify.json (file hashes!)
                                                     |
                             ops/promote.js  ---- tag pre-vN, copy candidate -> live entry, bump SW cache
                             ops/rollback.js ---- restore from tag, bump SW cache to a NEW name
   records: tasks.json -> TASKS.md (generated) · docs/DECISIONS.md · docs/RUNLOG.md · CLAUDE.md (version history)
```

Key design choices:
- **Objective completion.** `verify-ok` compares the SHA-256 of the files at verify time with the files now; any edit after verification voids "done".
- **Frozen scope by hash.** `run start` recomputes the scope hash; if tasks/acceptance changed since freeze, the run refuses.
- **The hook can never trap a session.** No active run ⇒ no effect. Time box, iteration cap, and any hook error ⇒ allow stop. Owner can end a run with `run finish`.
- **Test isolation.** Analytics blocked; every Supabase/Storage write answered by the test harness — verify runs never touch production data.
- **Config split.** Everything project-specific: `ops/adk.config.json` + `qa/app-map.json`. Scripts are generic.

## 5. Failure modes considered

| Failure | Mitigation |
|---|---|
| Agent stops early | Stop hook + state machine; run ends only when tasks are DONE/BLOCKED. |
| Agent claims done wrongly | DONE requires fresh full verify + evidence; verify hashes bind it to bytes. |
| Scope creep / different thing built | Frozen contract; `PROPOSED` for new ideas; scope-hash check at run start. |
| Existing feature breaks | Regression suite on two engines; visual guard; dark launch; additive DB. |
| Bad release reaches users | Dark flag OFF by default; `rollback.js` (bumps SW cache so phones actually update). |
| Flaky test blocks work | One retry; a real regression fails both attempts; known-noise allow-list is explicit in `qa/app-map.json` (never a blanket ignore). |
| Test run pollutes prod/analytics | Network isolation in `qa/tests/harness.js`. |
| Stale instructions executed | 24 h staleness rule enforced at `run start`. |
| Lost context between sessions | All state in files; `docs/RUNLOG.md` + memory; `node ops/tasks.js run status`. |
| Supply-chain risk from third-party tools | Only Anthropic/Microsoft/official-marketplace sources considered; versions pinned (`@playwright/test` 1.55.0); nothing installed outside the repo. |

## 6. Known limits (honest)

- Real-device behaviour (iPhone hardware, mobile networks, real Bunny uploads from a phone) cannot be proven by emulation — such items are reported *not verified*.
- Design taste needs the owner's eyes; the system produces screenshots, it does not judge beauty.
- Human-only steps (running SQL, deploying Workers, creating accounts/keys) stay `BLOCKED` with the exact action unless the owner later grants scoped tokens (Phase 2 below).
- The visual guard covers stable regions only; dynamic screens are covered functionally, not pixel-wise.

## 7. Roadmap

| Phase | Item | Status |
|---|---|---|
| 1 | tasks engine, verify gate, Stop hook, promote/rollback, docs, Playwright suite | this document's delivery |
| 2 (optional) | Scoped tokens: Cloudflare Workers-edit token → Claude deploys Workers; Supabase token → Claude runs *additive* migrations. Both via untracked env file. | needs owner decision |
| 2 | Supabase read-only MCP for verification of DB state | needs owner's token (`--read-only --project-ref=…`) |
| 3 | GitHub Actions running `verify` on every push (second gate independent of the agent) | optional |
| 3 | More ratchet tests per fixed bug; Community/authenticated flows behind a test account | grows over time |
