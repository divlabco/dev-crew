# Example briefs

## Specialist (small model): fully specified units

```
Project: /app (Laravel 13, PHP 8.5, Pest). Read docs/decisions.md — it is the spec.
Write small pure PHP classes with Pest unit tests. strict_types, final classes, typed signatures.

1. app/Domain/Scoring/ScoreCalculator.php — calculate(bool $correct, int $points,
   int $timeLimitSeconds, int $responseTimeMs, bool $late): int, exactly per decisions.md.
   Tests: instant = points; at limit = half; beyond limit clamps; negative clamps to full;
   wrong = 0; late = 0; rounding with points=1 and 999.
2. app/Domain/Session/JoinCodeGenerator.php — 6 chars from ABCDEFGHJKMNPQRSTUVWXYZ23456789.
   Tests: length, alphabet, 1000 samples contain no 0/O/1/I/L.

Only touch: app/Domain/Scoring, app/Domain/Session, tests/Unit/Domain. Do NOT commit.
Must pass: pest tests/Unit/Domain, pint, phpstan app/Domain.
Report (≤15 lines): files, results, any decision you made that the spec didn't cover.
```

Why it works: every signature, formula and test case is given, so the agent has nothing to decide.

## Builder (mid model): a feature that needs judgment

```
Project: /app (Laravel 13, Livewire 3, Reverb, Pest; pgsql+redis running — don't start/stop).
Read: docs/decisions.md, plan §5.3–5.6, CLAUDE.md, docs/implementation-status.md (M1, M2).
Reuse (don't rewrite): ScoreCalculator, JoinCodeGenerator, ParticipantToken, SessionStatus; Quiz models + QuizPolicy.

Task: M3 live session — migrations with snapshot tables; one transition helper
(lockForUpdate + canTransitionTo, 409 on illegal); SubmitAnswer (transaction, server time,
idempotent duplicate); participant API with X-Participant-Token; host API with policy;
private channels + auth; host, projector and participant pages.
Tests (write first): full lifecycle; illegal transition 409; late 422; duplicate adds no score;
answer key absent from participant JSON before reveal; cross-session token denied.

Only touch: app/, routes/, database/, resources/, tests/Feature/Session. Don't touch: loadtest/ (another agent).
Must pass: composer check (pint + phpstan + pest), npm run build.
Git: commit in logical steps by specific paths; message ends with <trailer>.
Append the M3 entry, including the exact API contract, to docs/implementation-status.md.
Report (≤15 lines): files, test counts, deviations, open issues, what you did NOT verify.
```

## Alignment task (small model)

```
loadtest/ scripts were written against an assumed API (assumptions listed in loadtest/lib/api.js).
The real contract is in docs/implementation-status.md (M3). Update ONLY loadtest/ to match:
paths, field names, headers, status codes. Replace the assumptions header with "verified against"
plus any remaining gaps. Validate syntax. Do not commit. Report each change and unresolved gaps.
```
