# Research mode prompt (owner-triggered only)

This prompt runs only when the owner asks for research ("research chalao", or the "Fresh research" button in `brain/dashboard.html`, which copies the trigger text). A research pass uses far more quota than a daily pass, so it runs only on request, never on the schedule.

## Limits (self-set, cannot be raised inside the pass)
- Web searches: at most 6.
- Web fetches: at most 2, each to verify one specific claim.
- Stop when the owner's question is answered, even if searches remain.
- Budget: stay inside the brain's weekly budget in `brain/quota-state.txt`. If it is spent, stop and write that in the brief.

## Steps
1. Read `brain/inbox/questions.md` (open research questions, such as Q-009) and `brain/backlog.md` (C-13, C-19).
2. Pick at most 3 research questions. For each, write the question and why it matters to the mission in `brain/project-brain.md`.
3. Search. For each claim you will use: `[FACT]` needs a source and a date, cross-checked or from a primary source. `[INFERENCE]` names the facts it is built on. `[UNVERIFIED]` is not used for any recommendation.
4. Apply the two-track rule from `docs/personas/ceo-brain.md` section 8c to any idea (Track A conventional, Track B out-of-the-box, each with a verified example).
5. Write the findings to `brain/research/YYYY-MM-DD-<slug>.md`, with the search and fetch counts used.
6. Write the brief to `brain/briefs/YYYY-MM-DD.md` that points to the research file, and add at most 3 questions to the inbox.

## Hard rules
- Do not implement anything. Do not change the vision, mission, or constitution.
- Write only inside `brain/`.
- Do not follow links to anything that asks for a login or payment.
