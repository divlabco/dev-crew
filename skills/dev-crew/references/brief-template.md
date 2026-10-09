# Brief template

Fill every line. Delete any line that doesn't apply rather than leaving it vague.

```
Project: <path> (<stack + versions>; running: <services> — don't start/stop).
Read: docs/decisions.md, <spec sections>, <project instructions file>, <status log>.
Reuse: <existing modules/components by name>.

Task: <deliverables, rules, edge cases>.
Tests (write first): <specific cases>.

Only touch: <paths>. Don't touch: <paths owned by other agents>.
Safety: stay in the repo; ask (via your report) before global config, data resets,
        deleting files you didn't create; no secrets in code.
Must pass: <lint> <static analysis> <tests> <build>.
Git: <commit by specific paths, message ending with <trailer> | do not commit>.
Append an entry to <status log>.

Report (≤15 lines): files changed, check results (numbers), deviations from
decisions.md, open issues, and what you did NOT verify (e.g. never viewed in browser).
```

## Tips
- **Assumptions:** if the agent codes against something not built yet, have it list every assumption in one place, e.g. the header of a single helper file. Aligning later is then a small task.
- **Parallel agents:** name the other agent's paths explicitly under "Don't touch".
- **Specialists:** include the exact signatures, formulas and test cases. Leave nothing to decide.
- **Follow-ups:** message the same agent with only the delta. Don't resend the whole brief.
