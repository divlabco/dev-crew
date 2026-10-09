# Without subagents

## Solo mode
Use this when your tool can't spawn agents.
1. Follow the same phases one at a time.
2. Before each task, write the brief to yourself using the template.
3. After it, write the ≤15-line report: what changed, which checks passed, and what is NOT verified.
4. Keep `docs/decisions.md` and the status log. They prevent drift across long sessions and context resets.

## Manual crew
Use this when your tool can't pick a model per task.
1. Open separate sessions, or separate tools, on cheaper models.
2. Paste one brief into each session.
3. Give them disjoint file sets, and don't let them commit.
4. You stay the lead: merge the work, re-run the checks, and report.

## Where to put the skill in other tools
- **Claude Code:** `~/.claude/skills/dev-crew/`
- **Other tools:** paste the `SKILL.md` body into the tool's persistent instructions file, for example `AGENTS.md`, `GEMINI.md`, a Cursor rule, or `.github/copilot-instructions.md`.

Include `references/` as extra files the tool can read. Check your tool's current docs, because these conventions change often.
