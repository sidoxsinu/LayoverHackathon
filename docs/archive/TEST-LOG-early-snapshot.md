# Test Log

## Iteration 1
- **Status:** FAIL (Massive timezone flakiness and race conditions)
- **Root Cause:** Playwright's UTC time mocking conflicted heavily with the browser's IST host timezone on macOS, breaking cross-midnight bounding logic.
- **Fix:** Switched tests to use "DURATION" inputs instead of "TIME" inputs, making them completely immune to timezones. Added explicit waits for state transitions. 

## Iteration 2
- **Status:** FAIL (Stats drain failing)
- **Root Cause 1:** `startedMs` was dropped during the `START` action reducer merge, meaning elapsed time was never calculated.
- **Root Cause 2:** The drain logic checked `state.screen === 'QUEST'` instead of the actual lowercase `'quest'`.
- **Root Cause 3:** `currentStats` was computed correctly in the component body, but the original undrained `state.stats` was accidentally passed to `<QuestScreen>`.
- **Fix:** Added `startedMs: now` to reducer, fixed casing to `quest`, and passed `currentStats` to `<QuestScreen>`. Fixed strict mode selector violations in the test assertions.

## Iteration 3
- **Status:** PASS
- All 10 core flow, alarm, demo mode, background, and stats tests pass reliably.

## Iteration 5 (Trip Memories sheet & lightbox layering, portal isolation, hit-testing, and scroll lock)
- **Status:** PASS
- **Trip Memories Sheet & Lightbox:** 8 tests pass in `tests/passport.spec.ts` (hit-testing confirms passport header covered, sheet computed background `#101010` opacity 1, inert page behind, body scroll locked & restored, singular "1 PHOTO" / plural "3 PHOTOS", Lightbox close returns to sheet, 360x640 and 390x844 zero horizontal scroll).
- **Core Regression:** All 10 E2E tests pass in `tests/main.spec.ts`.
- **Rank Boundaries:** All 12 unit tests pass in `tests/rank.spec.ts`.
- **Verification Audit:** 42/42 checks pass in `scripts/verify-proofs.mjs`.
- **Production Build:** `npm run build` succeeds with zero errors.
