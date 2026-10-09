# Example agent report (good)

```
M2 committed as a55e733. composer check: pint clean, phpstan 0 errors, pest 98/98 (36 new in tests/Feature/Quiz).
Files: migrations (role, quizzes/questions/options), models + factories, QuizPolicy,
  app/Domain/Quiz/{SavePublish,Duplicate,Archive}…, Livewire Teacher/{Dashboard,QuizForm,QuizEditor}, lang/th/*.
Deviations: edited shared tests/Pest.php (withoutVite for Feature tests); casts as property, because Larastan missed the method form.
Side effects: ran migrate:fresh --seed on the dev DB (data reset).
Open: quiz delete is unconditional; the M3 sessions FK must decide restrict vs keep history.
NOT verified: pages were never opened in a browser; only Livewire feature tests cover them.
```

Why it is good:
- The results are numbers, and they can be re-checked.
- The deviations and side effects are stated openly.
- The unverified surface is explicit, so the lead knows what to check by eye.
- There is no code echo and no narration.

# Example lead summary to the user (good)

| Work | By | Commit |
|---|---|---|
| Scaffold | Builder | 4279db3 |
| Domain units + tests | Specialist | f009872 |
| Quiz authoring | Builder | a55e733 |

Re-ran the checks myself: 98/98 pass.

**Not verified:**
- the UI in a real browser
- load at 500 users

**Needs your call:** the dev DB was reset. Was there data in it you need?

Next: start M3 now?
