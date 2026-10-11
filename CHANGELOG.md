# Changelog


## 0.3.0 — 2026-10-11
- Light mode by default: a mid-tier lead, or a job under ~10 files, works alone and skips the decisions file and briefs. Crew mode is only for a strongest-tier lead on large work.
- Spawn threshold: delegate only work worth ~3× the ~50k-token spawn cost; batch small tasks.
- Ships `crew-specialist` (Haiku) and `crew-builder` (Sonnet) agents with lean tool sets and pinned models.
- Delegated diffs are reviewed in scoped form (`--stat`, interfaces, risky logic).
## 0.2.1 — 2026-10-11
- Delegate down, never sideways: a mid-tier lead skips the Builder and sends spec'd work to the Specialist.
- The lead must read every delegated diff before accepting it, not just the report.
- Added a full-build evaluation with hidden acceptance tests (`evals/full-build/`, results in `EVAL.md`).

## 0.2.0 — 2026-10-09
- Packaged as a Claude Code plugin with its own marketplace, so installs can auto-update. The skill moved to `skills/dev-crew/`.
- Added a "Talking to the user (terse by default)" section to `SKILL.md`. It cuts conversation tokens with one-line progress updates, no narration of tool calls, batched questions, no echoed content and short final reports.

## 0.1.0 — 2026-10-09
- First public version.
- Core `SKILL.md`: the lead, builder and specialist roles, a 7-step workflow, safety rules, code quality rules and token economy.
- On-demand references: brief template, UI/UX defaults, common root causes, solo mode and other tools.
- Worked examples: a decisions file, briefs and reports.
- Results of an A/B evaluation are in `EVAL.md`.
