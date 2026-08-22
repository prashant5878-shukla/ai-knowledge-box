# Visual reference screenshots

Not a regression/CI suite — these Playwright tests exist purely to capture what the UI
actually looks like, so redesign work has a real screenshot to work from instead of
guessing. Network calls are mocked (`fixtures.ts`) so screenshots are deterministic and
don't depend on a live Gemini key or mutate real saved items.

Run:

```bash
npx playwright test
```

Screenshots land in `tests/visual/screenshots/` (gitignored — regenerate instead of
committing images). Re-run after a redesign to get an updated "after" set.
