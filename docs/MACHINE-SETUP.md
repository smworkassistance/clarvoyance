# Machine Setup — everything a NEW laptop needs that git does not carry

Git carries the code, docs, tasks and process (`CLAUDE.md`, `docs/*`, `ops/*`, `tasks.json`).
It does **not** carry anything registered against *this Windows user account* — MCP servers,
the Chrome debug profile, or any token typed into a website. This file is the checklist that
closes that gap. Keep it current: whenever a new local-machine step is added anywhere in this
project, add it here too, in the same commit.

## 1. Get the code
```
git clone https://github.com/smworkassistance/clarvoyance.git
cd clarvoyance
```
Everything in `CLAUDE.md` / `docs/` / `ops/` / `tasks.json` is now present and current as of the
last push — no separate transfer needed for any of that.

## 2. Runtime tools (confirmed present on the current machine 2026-09-28 — install the same on a new one)
| Tool | Version seen | Check with |
|---|---|---|
| Node.js | v24.2.0 | `node --version` |
| git | 2.54.0 | `git --version` |
| GitHub CLI (`gh`) | 2.100.0 | `gh --version`, then `gh auth login` once |
| Python | 3.12.10 | `python --version` — used only for the odd one-off scratch script during a session, never by anything committed to the repo; not a hard requirement to run/build/test the app itself |
| PowerShell | Windows PowerShell **5.1** (not PowerShell 7/Core) — some command syntax in this project (e.g. `--%` stop-parsing token) is written specifically for 5.1's quirks | built into Windows |

**QA test suite (`qa/`)** — `qa/package.json`/`package-lock.json` are in git, but `node_modules` and
the downloaded browser binaries are not (by design — see `.gitignore`):
```
cd qa
npm install                        # restores Playwright (@playwright/test) + pglite from package-lock.json
npx playwright install chromium    # downloads the actual browser binary — a SEPARATE step npm install does not do
```
Only `chromium-android` runs by default; `webkit-iphone` only runs in CI or with `QA_WEBKIT=1` set, so a normal dev machine does not need the WebKit binary.

**Android app build** — happens on GitHub Actions (`.github/workflows/android-build.yml`), not on this
laptop, so no local Android SDK/JDK install is needed for that.

## 3. MCP servers to (re)register on this machine
These live in `C:\Users\<user>\.claude.json` (user scope) — machine-local, not in git.

**Chrome DevTools** (drives a real signed-in Chrome for live QA):
```
claude mcp add chrome-devtools --scope user -- npx chrome-devtools-mcp@latest --browserUrl=http://127.0.0.1:9222
```

**Cloudflare Observability** (read Worker logs/deploy status directly — no more guessing whether
a paste actually deployed):
```
claude mcp add --transport http --scope user cloudflare-observability https://observability.mcp.cloudflare.com/mcp
```
Then, in a fresh Claude Code session (server lists load at session start — `/mcp` in an
already-running session won't show a server added after it started), run `/mcp` and authorize
via the browser prompt.

**Supabase** (read-only project access — needs a Personal Access Token, generated fresh per
machine, see §5). The exact command below was re-tested directly in Windows PowerShell 5.1
and works — if it errors with "invalid header format", the near-certain cause is the token (or
the quote characters) getting mangled by copy/paste from a chat window turning straight quotes
into curly ones, or a stray line-break landing inside the token. Fix: stage the token in its own
variable first, trim it, then build the command from that variable — this avoids re-typing/pasting
the whole long command in one shot:
```powershell
$sb = Read-Host "Paste the Supabase token"
$sb = $sb.Trim()
claude mcp add --transport http --scope user supabase "https://mcp.supabase.com/mcp?project_ref=unvwjuceuyruqdnmvxlc&read_only=true" --header "Authorization: Bearer $sb"
```
(Confirmed working: the identical command shape, run directly in this project's own PowerShell 5.1
session with a placeholder token, added the header correctly with zero errors.)

**Microsoft Clarity** — already added the same way (`clarity`, via `npx @microsoft/clarity-mcp-server --clarity_api_token=...`); the token is a long-lived Clarity data-export token from the Clarity dashboard (Settings → Data Export). Re-add the same way if it's ever missing from `claude mcp list`.

Check what's actually registered any time: `claude mcp list`.

## 4. Chrome debug profile (for Chrome DevTools MCP / live QA)
Since Chrome 136, `--remote-debugging-port` is silently ignored on the default profile. Launch a
dedicated one:
```
chrome.exe --remote-debugging-port=9222 --user-data-dir="C:\Users\<user>\ChromeDebugProfile"
```
Sign into Google manually, once, inside that profile — it then stays signed in and CDP can drive
it. (Full detail: `CLAUDE.md` → "Browser Testing Setup".)

## 5. Where to get each token/secret (generated fresh per machine — never copy a token between machines; revoke old ones you're not using)
| Secret | Where to generate | Notes |
|---|---|---|
| Supabase Personal Access Token | `supabase.com/dashboard/account/tokens` → Generate new token | **Resource access:** Project → select this project only (not Organization). **Expires in:** pick the longest option offered (a 7-day token means re-doing this every week) — revoke it from the same page any time you want to kill it early. **Permissions:** open the Preset dropdown first — if a "Read-only" preset exists, use it and skip the rest of this row. If not, expand **Project** and **Database** and turn on their *view/read* toggles only; leave Application services / Infrastructure and delivery / Account and organization on "No access" unless a specific MCP call needs them (the MCP's own `read_only=true` blocks every write either way, so this token scope is a second, not the only, safety layer). |
| Clarity data-export token | `clarity.microsoft.com` → this project → Settings → Data Export | Long-lived by default. |
| Cloudflare Observability | no token — OAuth login via `/mcp` | — |
| ADMIN_TOKEN (Clarvoyance admin.html) | given to the owner directly, stored by admin.html itself (`localStorage.clv_admin_token`, prompted on first use) | Not a Claude-side setup step; only relevant if the owner is using admin.html on the new machine. |

## 6. What this deliberately does NOT cover
- Claude's own per-project memory (`.claude/projects/<encoded-path>/memory/*.md`) is local-app
  state, not project data — it's a convenience cache of things Claude has been told, not a source
  of truth. Anything load-bearing belongs in `docs/` (git), not there. If it's missing on a new
  machine, Claude rebuilds working knowledge from `CLAUDE.md`/`docs/*` in the first session, same
  as any fresh clone.
- Global cross-project preferences (the four-hat protocol etc.) currently live as a file inside
  this repo (`CLAUDE md instructions for all projects _STABLE.md`) as a stopgap so they survive a
  laptop change — the real fix (one shared home for every project) is part of the Starter Kit
  work, not yet built.
