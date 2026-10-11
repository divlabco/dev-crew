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

# Full-build evaluation (v0.2.0)

v0.1.0 only measured planning. This run builds working software end to end and grades it with hidden tests.

## Method
- **Tasks:** two specs in [`evals/full-build/`](evals/full-build/).
  - *Small:* LinkBox milestone 1 (CRUD, redirects, a React page, SQLite). 30 hidden checks.
  - *Large:* the LinkBox MVP (auth, teams and roles, tags, search and paging, expiry, stats, CSV, rate limit). 82 hidden checks.
- **Conditions:** the same prompt for both. A loads the plugin and adds "Use the dev-crew skill."; B does not. Each run is headless, `--model sonnet`, has no other plugins or MCP servers, is unattended, and offers `sonnet` (builder) and `haiku` (specialist) as subagent models.
- **Models:** the `sonnet` alias resolved to Sonnet 5.5 and `haiku` to Haiku 4.5.
- **Runs:** 3 per condition per task, 12 in total.
- **Grading:** `npm install/build/test`, then black-box HTTP tests the agent never saw, plus a restart test. We also checked whether global git or npm config changed.

## Results

| Task | Cond. | Hidden checks passed | Cost (avg) | Lead+sub tokens (avg) | Wall time (median) | Subagents |
|---|---|---|--:|--:|--:|---|
| Small | A (dev-crew) | 90/90 | $0.50 | 686k | 126 s | 0, 0, 1 |
| Small | B (baseline) | 90/90 | $0.41 | 434k | 112 s | 0, 0, 0 |
| Large | A (dev-crew) | 246/246 | $1.20 | 1.54M | 194 s | 1, 2, 1 |
| Large | B (baseline) | 245/246* | $0.66 | 0.71M | 192 s | 0, 0, 0 |

\* LB2's own `npm test` failed once under the grader. It passed 8/8 when re-run alone, so it was a flaky check under parallel load, not a wrong "tests pass" claim.

No run changed global config or wrote outside its repo.

## What this shows
- **Correctness:** there was no measurable difference. Sonnet 5.5 hits the ceiling on both tasks with or without the skill.
- **Cost:** the skill costs more, about +20% on the small task and +80% on the large one. The extra comes from briefs, a decisions file, and verifying subagent output. In these runs it did not save tokens, because every subagent ran on Sonnet, the same tier as the lead. The Haiku specialist was never used.
- **Delegation judgment:** on the small task the lead mostly chose to work alone, which is the intended behavior. On the large one it delegated the frontend each time.
- **Reports:** all A reports had explicit "Not verified", "Decisions" and "Who built what" sections. The B reports were shorter, though they also mentioned the untested UI.
- **A gap found:** in one A run the lead relayed the frontend subagent's work after reading only its report, not its code, and said so. The skill's "verify before relaying" rule should require at least a diff read and a build or test run on delegated work.

## Limits
- There are only 3 runs per cell, and both tasks were too easy for the lead to separate the conditions on correctness. The frontend was never exercised in a browser.
- A harder task, or a weaker lead model, is needed to test whether the skill improves quality.

## Re-run with v0.2.1 (large task, A only, 3 runs)
v0.2.1 adds "delegate down, never sideways" and "read every delegated diff".

| Run | Hidden checks | Cost | Subagents | Haiku tokens |
|---|---|--:|---|--:|
| VA1 | 82/82 | $0.98 | 0 | – |
| VA2 | 82/82 | $1.39 | 3 | 51k ($0.06) |
| VA3 | 82/82 | $1.20 | 0 | – |

- **Cost:** the average was $1.19, against $1.20 for v0.2.0 and $0.66 for the baseline, so there was no saving.
- **Delegation:** the Specialist was used for the first time (VA2), and the lead no longer delegates sideways to Sonnet. The overhead remains even when nothing is delegated (VA1, VA3). It comes from the decisions file and the extra process, not from the subagents.

VA2's first grading pass produced no output and was re-run; the result above is from the re-run.

## v0.3.0 (light mode, spawn threshold, crew agents) — large task, 3 runs each

| Lead | Condition | Hidden checks | Avg cost | Lead model share | Subagents |
|---|---|---|--:|--:|---|
| Sonnet 5.5 | v0.3.0 | 246/246 | $0.73 | 100% | 0, 0, 0 |
| Sonnet 5.5 | baseline (earlier) | 245/246 | $0.66 | 100% | 0, 0, 0 |
| Opus 5.5 | v0.3.0 | 246/246 | $2.09 | 52% (Opus $1.09 + Sonnet builders $1.00) | 2, 2, 2 |
| Opus 5.5 | baseline | 246/246 | $1.78 | 100% | 0, 0, 0 |

- **Sonnet lead:** light mode works. The overhead fell from +80% (v0.2.x) to about +10%, and correctness held.
- **Opus lead:** crew mode moved half the spend to Sonnet builders, but the total was still about 17% above Opus working alone. Two builders plus the lead's own review cost more than the Opus tokens they saved. The Haiku specialist was never used.
- **Correctness:** there is still no difference. Every condition hits the ceiling on this task.
- **Grader issues:**
  - OB1 first scored 11/79 because the grader's random port collided with a local service. A re-grade gave 82/82, and the graders now pick a free port.
  - The OA3 process did not exit after finishing (it waited on a background agent), so its project was graded manually: 82/82.
