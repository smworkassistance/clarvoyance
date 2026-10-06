# Charger audio — decisions (owner, 2026-10-06)

Status: decisions recorded. Not built yet (waits for the v268 verify and promote).

## Decisions
1. **Each charger gets its own pre-created audio** (one per charger, per language).
2. **Languages at launch:** Hindi, English, Hinglish.
3. **Voice:** generated with AI (TTS), not recorded by the owner.
4. **Generated once.** The audio is created in a batch and cached. It is only regenerated when the charger text changes (an update), not on every use.
5. **Language setting:** the user's language is saved in the profile. Audio plays in that language, and falls back to English if that language is missing.
6. **Storage:** public bucket `charger-audio`, path `charger_id/lang.mp3`.
7. **Playback:** the same audio bar used in goals and the story.

## Open (to decide later)
- XP for charger audio: same as autosuggestion (5 XP × 5 listens), or free?
- Whether the TTS voice for each language is checked by the owner before the batch runs.

## Related
- Language approach and sequencing: see the discussion in this session (build the language setting now, add more languages later based on user data).

## Revised decisions (owner, 2026-10-06, later in the day)

Audio is of two kinds, and they are never mixed in one file:
- **Instruction** (kaise karna hai): one per screen/section, played once to learn the practice.
- **Affirmation** (repeat karne wala): only on charger containers, predecided, with XP on listens.

### Scopes (pre-created, no user content)
| Where | Instruction | Affirmation |
|---|---|---|
| Chargers | one per container (6-7 containers, each holds several chargers) | one per container |
| Tools: physical tools | one | — |
| Tools: mental reset | one | — |
| Tools: overall section | one | — |
| Non-Negotiables | one | — |
| Self tab overall | one | — |
| Self tab sections | one per section | — |
| Goals tab | one | — |

Personal goal and story autosuggestion (recorded by the user) stays as it is.

### Design rules
- **Two colours:** instruction bar = calm teal/blue, affirmation bar = warm gold. Same bar shape for both, so the user learns the difference by colour.
- **Icons:** replace emoji (🎙, ▶, 🔁, 🗑) with one consistent line-icon set (Lucide or Phosphor, both free and open-source). Inline SVG, so no extra download.
- **No autoplay.** Instruction shows a clear "Listen" button; the user taps it.
- **Language follows the user's language setting** (Hindi, English, Hinglish). Fallback to English.
- **Admin:** a single list of scopes with text, generate per language, preview, and "regenerate only if text changed".

### Scale
About 22 instruction scopes plus 7 affirmation scopes, times 3 languages, is roughly 90 short audio files. Text is the source of truth; audio is generated from it and cached. Cost stays in the range of a few dollars one-time.

### Open
- Confirm the list of Self-tab sections (count) before generating.

## Final scope list (owner, 2026-10-06, latest)

Correction: a charger container has **one audio only** (predecided affirmation-style). Instruction and affirmation are not split for chargers.

| Scope | Count | Audio |
|---|---|---|
| Charger containers | 6-7 | one each (predecided affirmation) |
| Tools: physical | 1 | instruction |
| Tools: mental reset | 1 | instruction |
| Tools: overall section | 1 | instruction |
| Non-Negotiables | 1 | instruction |
| Self tab: overall | 1 | instruction |
| Self tab: sections | 10 (6 accordion + 4 overlays) | instruction each |
| Goals tab | 1 | instruction |

Total: ~23 scopes × 3 languages (Hindi, English, Hinglish) ≈ 69 short files.
Personal goal and story audio (user-recorded) is unchanged.

### Listen button
- No autoplay. A "Listen" button with a soft, inspiring animation (gentle pulse or breathing ring), so the user is drawn to hear it again.

### Who makes the audio
- Owner's choice: **admin "Generate" button** (uses Google Cloud TTS free tier, around 1M characters/month free, our total is far below that), **or** owner uploads mp3 files by hand. Both are supported by the same admin screen.
- Free-tier check: confirm which voices are covered by the free tier before the first batch.

## Owner answers (2026-10-06, T-120)
- **XP on instruction listens: yes, same rule as affirmations.** Instruction listens earn XP the same way affirmation listens do. Open detail: the per-scope listen cap for charger affirmations is still unconfirmed (goal/story rule is 5 XP, max 5 listens).
- **Self tab: all 10 sections get an instruction audio** — 6 accordion (My Personal Space, Peak State, Slow, Soft & Swift, Non-Doing Timer, Walk & Talk, Protect Yourself) plus 4 overlays (Revise & Repeat, My Foundation, True View Chart, Pure Abundance). Note from the code: "Revise & Repeat" in the Self tab is a shortcut that jumps to the Revise tab, so its audio will explain that shortcut, not a practice of its own.
- **Still owner-only:** confirm the Google Cloud free-tier numbers on the billing page before the first batch (T-120 item 3), and the TTS key (T-121, BLOCKED).

## Free tier + admin/text decisions (owner, 2026-10-07)
- **WaveNet free tier: 4M characters/month** — owner checked the Quotas page in the Google console. (Public secondary sources say 1M; the owner's own console reading is the one we use. Re-check before any paid usage.)
- **Text:** stored in a database table (`audio_scopes`), editable from admin at any time. Changing text marks that audio "needs regenerate", and the old audio stays until the new one is made.
- **Structure stays in our hands:** speed, pitch, voice and language are set in admin. Audio can come from TTS (generate) or from an mp3 the owner uploads.
- **Text writing (proposal, to confirm):** admin can ask Gemini for a draft, but the owner reviews and edits before saving. Drafts must follow the voice and tone rules in `docs/voice-tone-and-glossary.md` (no guaranteed outcomes).
- **Voice (proposal, to confirm):** one default voice per language for all users. Per-user voice choice multiplies files by the number of voices, so it is not planned for v270.
- **Languages:** admin keeps a languages list (code, name, voice or "upload only", fallback). Adding a language means adding its text (manual or AI draft) and then generating or uploading its audio.
- **Storage estimate:** mono 32 kbps MP3, about 120 KB per 30 seconds. About 70 files for 3 languages is roughly 10 MB. Each extra language adds about 3-4 MB. Egress is the number to watch (see discussion).

## Language mapping (owner, 2026-10-06)
- **Hinglish uses the Hindi voice.** Hinglish is spoken as Hindi, so there is no separate Hinglish voice. Text can still be written in Hinglish; the voice is Hindi (hi-IN).
- Charger section gets **one overall instruction** in addition to the per-container affirmations.
- Free tier check: pending. Owner to confirm on the Google Cloud billing page before the first batch. Secondary sources say Chirp 3 HD has 1M characters/month free and supports hi-IN; the official pricing page could not be read in full.

## Voice choice (owner, 2026-10-06, after console screenshot)
- Owner's console screenshot: Chirp 3 HD = 0 to 1M characters free, then $30 per 1M. WaveNet = 0 to 4M characters free, then $4 per 1M.
- **Decision: WaveNet is the default voice.** It is cheaper, has a larger free tier (4M/month, far above our ~50-100k characters), and has Hindi (hi-IN) voices.
- Hindi WaveNet voices found: hi-IN-Wavenet-E (female), hi-IN-Wavenet-F (male) (source: Twilio changelog citing Google voices; confirm in the Google voice list before batch).
- en-IN WaveNet: not confirmed by search. To check in the Google voice list.
- Chirp 3 HD is kept as an option only if a quality sample of WaveNet is not good enough.
- Batch rule: listen to one sample per language (Hindi, English, Hinglish-as-Hindi) before generating all.

## Build order decided (owner, 2026-10-07): finalise first
- **AI draft is kept, but the owner's own prompt is what generates it.** Each text stores the exact prompt used, the model, the date and the draft, so the source of every text stays visible. The owner can also type or paste text directly.
- **One text at a time, hand-finalised.** Flow: write or draft text → generate English and Hindi audio → preview both in admin → mark **Finalised**. Only finalised text is shown to users. Finalising is a manual click.
- **Voice:** one fixed voice per language for now (user choice is out).
- **Languages:** admin language list holds all languages; at launch only English (en-IN) and Hindi (hi-IN) are active. The app's language selector and audio file lookup both follow the active language list. Hinglish is added later as a language entry that uses the Hindi voice.
- **Cost:** only generate audio for finalised scopes, and only when the text changes.

### Scope for the first candidate (v270, finalise-first slice)
1. Languages table (en, hi active) and the app language selector that reads it.
2. `audio_scopes` table: key, kind, text per language, prompt, model, draft flag, text hash, finalised flag.
3. Admin: text editor with AI draft (uses the owner's prompt), per-language Generate and Preview, Finalise button.
4. Playback in the app: Listen button in the right language, teal bar for instructions, gold for affirmations.
Not in this slice: the full list of 23 scopes, mp3 upload, extra languages.

## Scope map (which version builds what) — 2026-10-07
Text status: all scopes are **TEXT PENDING** (no text written or finalised yet). Each row is finalised one at a time by the owner.

| # | Scope | Audio | Version | Text status |
|---|---|---|---|---|
| 1 | Charger containers (6-7, each has its own predecided affirmation) | affirmation | v270 (after the finalise-first slice works) | pending. Source of the affirmation text not decided yet |
| 2 | Chargers section overall | instruction | v270 | pending |
| 3 | Tools: physical | instruction | v271 | pending |
| 4 | Tools: mental reset | instruction | v271 | pending |
| 5 | Tools: overall section | instruction | v271 | pending |
| 6 | Non-Negotiables | instruction | v271 | pending |
| 7 | Self tab: overall | instruction | v271 | pending |
| 8 | Self: My Personal Space | instruction | v271 | pending |
| 9 | Self: Peak State | instruction | v271 | pending |
| 10 | Self: Slow, Soft & Swift | instruction | v271 | pending |
| 11 | Self: Non-Doing Timer | instruction | v271 | pending |
| 12 | Self: Walk & Talk | instruction | v271 | pending |
| 13 | Self: Protect Yourself | instruction | v271 | pending |
| 14 | Self: Revise & Repeat (shortcut, explains the jump) | instruction | v271 | pending |
| 15 | Self: My Foundation | instruction | v271 | pending |
| 16 | Self: True View Chart | instruction | v271 | pending |
| 17 | Self: Pure Abundance | instruction | v271 | pending |
| 18 | Goals tab | instruction | v271 | pending |

Open for the owner: (a) the charger container names and their affirmation text; (b) which scope to finalise first (suggest one Self-tab instruction, the simplest to test end-to-end).
