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
