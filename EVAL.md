# Evaluation (v0.1.0)

A small A/B test. Treat it as a sanity check, not a benchmark.

## Method
- **Task:** plan a realistic MVP, "LinkBox" (a team URL shortener with Node/TypeScript, React, Postgres and Redis). The spec has 4 deliberately undecided points and a 2,000 req/s redirect requirement.
- **Lead model:** Claude Sonnet, playing the lead. The lead produces `decisions.md`, `plan.md`, full briefs for the first 3 tasks, and the message to the user. No code is written and no agents are spawned.
- **Conditions:**
  - **A (skill):** told to read `SKILL.md` first and follow it. 2 runs.
  - **B (baseline):** same prompt, with the same three roles described in one sentence, but no skill. 2 runs.
- **Scoring:** 9 rubric items checked in the briefs and the user message, by keyword search plus a manual read. The grader was the author's lead model, not blind.

## Results

| Rubric item | A1 | A2 | B1 | B2 |
|---|:-:|:-:|:-:|:-:|
| File ownership / don't-touch boundaries | ✓ | ✓ | ✓ | ✓ |
| Concrete "done when" checks | ✓ | ✓ | ✓ | ✓ |
| Safety: stay in repo, ask before global config or data loss | ✓ | ✓ | – | – |
| Report must state what was NOT verified | ✓ | ✓ | – | – |
| Report length cap | ✓ | ✓ | – | – |
| Tests written first | ✓ | ✓ | – | – |
| Git rules (commit by path / who commits) | ✓ | ✓ | – | – |
| User message states unverified items and that outward actions need a yes | ✓ | ✓ | – | – |
| UI direction when none was given | ✓ | ✓ | ✓ | – |
| **Score** | **9/9** | **9/9** | **3/9** | **2/9** |

| Cost (planning phase) | A1 | A2 | B1 | B2 |
|---|--:|--:|--:|--:|
| Lead tokens | 64.0k | 68.9k | 54.0k | 50.1k |
| Brief words (3 briefs) | 1,230 | 1,623 | 927 | 821 |

Averages: A scored **9.0/9** and used **66.5k tokens**. B scored **2.5/9** and used **52.1k tokens**, so the skill cost about 14k more lead tokens (+28%) in this phase.

Skill size:
- The first draft's core file was a single 1,449-word file.
- v0.1.0's core file is **1,087 words (−25%)**, even after adding the safety rules.
- About 1,990 words of references and examples load only when they are needed.

Both A runs loaded only the references whose triggers applied.

## What this shows
- The skill reliably adds the guardrails a baseline lead forgets: safety boundaries, honest "not verified" reporting, tests-first, and git rules.
- Both runs with and without the skill produced competent technical designs. The skill improves **process quality**, not raw architecture.
- Planning costs more tokens with the skill, because the briefs are fuller.

## What this does NOT show
- **Downstream savings.** We expect tighter briefs and capped reports to save builder and specialist tokens and rework during implementation. That was not measured here.
- **Code quality of the built result.** Nothing was implemented.
- **Statistical significance.** n=2 per condition, one task, one lead model, and a non-blind grader.
- **Other tools or models.**

## Reproduce
1. Put the spec in a file, then run the same prompt with and without "read SKILL.md first".
2. Record the token usage for each run.
3. Grade the briefs and the user message against the rubric above.

PRs with more runs, more tasks, end-to-end builds or other models are welcome.
