# AI models — where each one is used, what it costs, what to mix (T-089 / T-099)

Written 2026-10-02. Numbers marked **measured** come from real calls through Gemini; numbers
marked **listed** come from public price pages/aggregators (they disagree with each other a
little — re-check on the provider's own page before switching anything).

## 1. Measured: explicit prompt caching works (T-089)

Real chat prompt = ~10.3k static tokens (frameworks, rules, tools, JSON format; identical for
every user and persona) + ~150 tokens per-user. Gemini 2.5 Flash, 12 calls, 2 users x 2 personas:

| | uncached | cached |
|---|---|---|
| cache hits | - | **12 / 12**, 10,341 tokens each, shared across users |
| cost / message | Rs 0.28-0.32 | **Rs 0.055** |
| saving | | **~80%** |
| reply JSON valid | 12/12 | 12/12 |

Cache window economics: creation ~Rs 0.27 + storage ~Rs 0.015/min. A 10-minute window costs
~Rs 0.42 and saves ~Rs 0.22 per message => **breaks even at 2 messages per window**; every
extra message in the window (any user) is pure saving. Lone messages lose ~Rs 0.18, chat
sessions are bursts, so net positive. Implemented in `workers/gemini-proxy-worker.js`
(tested live end to end: create / hit / fallback when prompt too small / hardening) and
`clarvoyance_v259.html` (flag `clv_gemini_cache`, default off).

## 2. Every AI call in the product (client = via proxy `cold-frog-d555`; Guides = admin-relay worker)

| # | Call | When | Prompt / output | What matters | Today | Suggested tier |
|---|---|---|---|---|---|---|
| 1 | Clar chat reply | every user message | 10.5k in / ~100 out | empathy, persona, safety, JSON | 2.5 Flash | **A** (keep) + cache |
| 2 | Fortune reading | once/day/user | ~6k+ in / 500 out | tone, using real data | 2.5 Flash | **A**, cache its static part too |
| 3 | Pulse weekly reflection | weekly | ~3k in / ~400 out | grounded in numbers | 2.5 Flash | **B** |
| 4 | Monthly summary compression | monthly | small | plain summarising | 2.5 Flash | **C** |
| 5 | Video topic/query writer | daily/user | ~1k in / 200 out | useful search words | 2.5 Flash | **C** |
| 6 | Dream-desire extraction | when goal text changes | ~1k in / 1.2k out | structured extraction | 2.5 Flash | **B/C** |
| 7 | Desire variant (new search angle) | rare | small | creative query | 2.5 Flash | **C** |
| 8 | Global search "Ask Clar" | on demand | small | short intent answer | 2.5 Flash | **B** |
| 9 | Book summary + quotes | on tap, cached | small | factual, no fake quotes | 2.5 Flash | **A/B** (hallucination risk) |
| 10 | Wikiquote topic picker | daily/user | small | pick from fixed vocabulary | 2.5 Flash | **C** |
| 11 | Guides: generate post | cron, shared | ~3k in / ~800 out | grounded in sources | proxy default = **2.5 Flash-Lite** (no `_model` sent) | **B** |
| 12 | Guides: verifier (supported / safe / on-philosophy) | cron | similar | safety judgement | same | **A or B, never weaker than generator** |
| 13 | Guides: translation, scope guard | cron / on create | small | language quality / rules | same | **C** (translation) / **B** (guard) |
| 14 | admin Consultant / Sandbox | rare, owner only | big | reasoning | 2.5 Flash | **A** |

Tier A = user-facing, emotional or safety-critical. B = needs judgement, not warmth.
C = mechanical (translate, extract, rewrite). Rule of thumb for "mix": **warmth and safety =
A; anything the user never reads word-for-word = B/C**.

Silent cost per active user per day is dominated by #2 (Fortune), then #5/#10 — moving #3-#10
to B/C and caching #2 is the second biggest lever after caching #1.

## 3. Model market (listed prices, $/1M tokens in / out) — verify before switching

- Gemini 2.5 Flash 0.30/2.50 (what we use). 2.5 Flash-Lite 0.10/0.40 (cheapest Gemini today).
- Newer Gemini: 3.1 Flash-Lite 0.25/1.50; 3.5 Flash-Lite 0.30/2.50; 3 Flash 0.50/3.00;
  3.5 Flash 1.50/9.00; 3.1 Pro 2.00/12.00. => **the newer "Lite" models are NOT cheaper than
  2.5 Flash on output**, so migrating forward costs more, not less. The cheap 2.5 Flash-Lite
  is the one Google is retiring.
- **Retirement is unclear:** Google's API page showed 16 Oct 2026 for 2.5 Pro/Flash/Flash-Lite,
  then removed the date ("no shutdown date announced", "not deprecated, access limiting" as of
  18 Sep); Google Cloud lists 20 Oct. Treat as "could vanish with short notice".
  Mitigation built: proxy `MODEL_ALIAS` env var swaps a model for all callers at once.
- Other providers (aggregator prices, quality for Hinglish UNVERIFIED): Mistral Small 4
  0.15/0.60 with 90% cache discount; DeepSeek V3.2 0.28/0.42; GPT-5 mini ~0.15-0.25 in;
  Claude Haiku 4.5 1.00/5.00; Qwen3.7 Flash 0.03/0.13; Groq Llama 3.1 8B 0.05/0.08;
  Cloudflare Workers AI: Gemma 4 26B 0.10/0.30, 10,000 free neurons/day, and a dedicated
  Indic translation model (indictrans2, 22 Indian languages) — a natural fit for tier C
  translation and already on our Cloudflare account.
- Batch API = 50% off (Gemini) — right for Guides/nightly generation because it is async.

## 4. Plan (T-099)

1. **Routing layer (done in proxy, r2):** `_tier` A/B/C and `MODEL_ALIAS`/`MODEL_TIERS` env
   vars, so models can be changed without redeploying the app. Clients still send `_model`
   today; moving call sites to `_tier` is a small client change in a later version.
2. **Eval harness, not opinions:** for each call site keep ~20 real-style inputs; run them on
   candidate models (2.5 Flash-Lite, Gemma 4 on Cloudflare, Mistral Small, DeepSeek, GPT-5 mini,
   3.x Flash-Lite); score JSON validity, length, tone, language (Hindi/Hinglish/English), no
   fabricated facts/quotes; choose the cheapest that passes. Chat stays on the best model until
   a candidate matches it in a blind read.
3. **Cache more than chat:** Fortune static prompt, Guides generator/verifier system prompts.
4. **Batch API** for Guides cron and the planned nightly charger generation (T-094).
5. **Cost visibility first (T-088):** log `usageMetadata` per call site so every number above
   becomes measured, not estimated.
6. Fallback chain in the proxy (primary model errors -> secondary) so a retirement or outage
   degrades instead of breaking chat.

## 5. Security note found while doing this
The old proxy source has the Gemini key hard-coded and answers any caller (any model, any size).
`workers/gemini-proxy-worker.js` reads the key from a secret and adds model-name, body-size and
output-token limits. The key was also pasted into a chat session, so **rotate it** (create a new
key in Google AI Studio, store as secret `GEMINI_API_KEY`, delete the old one). Remaining gap:
no per-IP/per-user rate limit (needs KV or Durable Objects) — tracked in T-099.
