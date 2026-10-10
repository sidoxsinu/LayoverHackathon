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
