# dev-crew

**Run your AI coding agent like a tech lead running a small dev team.**

One strong model plans, decides, reviews and integrates. Cheaper models build in parallel. The skill is designed to keep code quality high, spend fewer tokens on routine work, and produce honest reports about what is actually verified. See [EVAL.md](EVAL.md) for measured results.

```
            ┌──────────────┐
  you  ───▶ │  Lead model  │  plan · decisions · review · integrate · report
            └──────┬───────┘
          ┌────────┴────────┐
   ┌──────▼──────┐   ┌──────▼──────┐
   │   Builder   │   │ Specialist  │
   │ (mid-tier)  │   │ (small/fast)│
   └─────────────┘   └─────────────┘
   features needing    spec'd units, scripts,
   design judgment     docs, restyles, alignment
```

## Why

Handing a whole project to one agent tends to cause these problems:
- Expensive models spend effort on boilerplate.
- Parallel agents overwrite each other's files.
- "All tests pass" gets reported when nobody re-ran anything.
- Policies get invented ad hoc.
- Global config gets changed without anyone asking.

`dev-crew` encodes the habits that fix this:
- Write binding decisions first.
- Split work by disjoint file sets.
- Brief each agent like a contractor.
- Verify before relaying.
- Report what was *not* checked.

These habits came from building a real-time web app end to end with one lead model and two cheaper subagents.

## What's inside

```
.claude-plugin/              plugin + marketplace manifests (the version lives here)
skills/dev-crew/
  SKILL.md                   core (~1.2k words): roles, workflow, safety, quality, token economy, terse comms
  references/                loaded only when needed
    brief-template.md        the brief every subagent gets
    ui-ux.md                 design defaults when the user gives no direction
    root-causes.md           symptom → cause → fix table from real integration bugs
    solo-mode.md             tools without subagents; where to put the skill in other tools
  examples/                  a worked decisions file, briefs, and reports
CHANGELOG.md                 what changed in each version
EVAL.md                      A/B evaluation: method and results
```

## Install

### Claude Code (plugin with auto-update, recommended)
```
/plugin marketplace add divlabco/dev-crew
/plugin install dev-crew@dev-crew
```
Turn on auto-update once: run `/plugin`, open **Marketplaces**, select `dev-crew` and enable auto-update. Claude Code then checks for new versions at startup. To update by hand, run `/plugin marketplace update dev-crew`.

### Claude Code (plain skill, manual updates)
```bash
git clone https://github.com/divlabco/dev-crew ~/dev-crew
cp -r ~/dev-crew/skills/dev-crew ~/.claude/skills/
# to update: cd ~/dev-crew && git pull, then copy again
```

Then ask something like *"Implement this plan as a team: use Sonnet and Haiku"*. The skill triggers from its description.

### Other AI coding tools
The content is plain Markdown and model-agnostic.
1. Put the `skills/dev-crew/SKILL.md` body, without the frontmatter, where your tool reads persistent instructions: `AGENTS.md` (Codex CLI), `GEMINI.md` (Gemini CLI), a Cursor rule, or `.github/copilot-instructions.md`.
2. Keep `skills/dev-crew/references/` and `skills/dev-crew/examples/` in the repo so the tool can open them.

Conventions change often, so check your tool's docs. If your tool can't spawn subagents, follow `skills/dev-crew/references/solo-mode.md`.

## Usage tips
- Give the lead the full spec. Let it ask its blocking questions before any code is written.
- Keep `docs/decisions.md` in your repo. It doubles as onboarding documentation.
- Treat every "not verified" line in a report as your manual test checklist.

## Contributing
Issues and pull requests are welcome, especially:
- New rows for `skills/dev-crew/references/root-causes.md`
- Install notes for more tools
- Translations
- Eval runs on other models

## Releasing a new version (maintainers)
1. Edit the files and add an entry to `CHANGELOG.md`.
2. Bump `version` in `.claude-plugin/plugin.json`. Installed copies update only when this number changes.
3. Commit, tag (`git tag v0.2.0`) and run `git push --follow-tags`.

## License
MIT © 2026 Burin Supeewee (Divlab). See [LICENSE](LICENSE). ภาษาไทย: [README.th.md](README.th.md)
