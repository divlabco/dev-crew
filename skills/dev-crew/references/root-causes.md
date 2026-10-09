# Common root causes

These came from real multi-agent builds. Check them first when "it doesn't work".

| Symptom | Likely cause | Check / fix |
|---|---|---|
| Feature works in tests, not in the running app | A long-running worker (queue, scheduler, websocket server) is still on old code | Restart it after any backend change |
| A whole page's JS is dead, globals undefined | A config object passes `key: undefined`, which overrides a library default and throws early in the entry file | Read the console; only spread optional keys when they are set |
| Clicking does nothing, server log shows no request | The UI is in a state with no handler (time already expired, wrong page), or automation clicks aren't delivered | Read the server log; attach a test event listener before blaming the app |
| Countdowns disagree between screens or jump | Server time is stamped at render (stale by latency) and re-renders reset the timer | Use one clock-sync module (lowest-RTT sample, slewed); keep timers outside re-render scope |
| Text breaks one letter per line | A layout tuned for a big screen is opened on a small one, or `break-all` is set | Collapse columns at breakpoints; wrap at word boundaries; scale the font |
| Requests fail with 429 for a whole group | A per-IP rate limit, with everyone behind one NAT | Raise and make configurable the limits on shared-network endpoints |
| Something "already done" happens again | An endpoint isn't idempotent under concurrency | Use a DB unique constraint and a row lock, and return the original result on duplicates |
| Secrets leak to clients | One DTO is shared between server and client views | Use separate public DTOs, plus tests asserting forbidden keys are absent |
