# Decisions (binding for all implementers)

> Example from a live-quiz web app (Laravel + PostgreSQL + WebSockets), lightly generalized.
> Use it as a model for the level of detail. Every agent reads this file before starting.

## Stack
- Laravel (latest stable, verified at install), PHP 8.x, Livewire 3, Tailwind + DaisyUI, Pest, Pint, Larastan level 6
- PostgreSQL + Redis via `docker-compose.yml`; Reverb for websockets
- Tests run on a real Postgres test DB (`app_test`), never SQLite, because constraint tests need the real engine

## Scope this round
M1 scaffold, M2 quiz authoring, M3 live session. No public library and no reports beyond the leaderboard.

## Scoring (pure function `ScoreCalculator`)
```
if !correct or late: 0
ratio = clamp(response_ms / (time_limit_s*1000), 0, 1)
score = round(points * (1 - 0.5 * ratio))     // 50%..100%
```
`response_ms` is measured with server time only. Client timestamps are ignored.

## Answer policy
- The first answer is the only one that counts.
- There is a unique index on (question, participant).
- A duplicate returns 200 with the original result and adds no score.
- A late answer returns 422 `deadline_passed`.

## State machine
```
lobby → question_open → question_closed → showing_result → (question_open | finished)
any non-terminal → cancelled
```
- Every transition takes a row lock and checks the expected state. An illegal transition returns 409.
- Every transition increments `event_seq`.

## Security invariants
- The answer key is never sent to participants before `showing_result`. A separate public DTO enforces this, and tests assert the forbidden keys are absent.
- Participant tokens are 40 random characters. They are returned once and stored only as a sha256 hash.

## Real-time
- Each event carries `{session_id, type, seq, at}`.
- If a client sees a gap in `seq` or reconnects, it calls `GET /state`.
- Count updates are throttled to at most one per second.

## Conventions
- UI strings live in `lang/<locale>`.
- Progress log: `docs/implementation-status.md`. Append after every task.
