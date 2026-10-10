# Test Log

## Iteration 2

**Test 15: Grep src for banned items** - FAIL
  - **Symptom**: Found banned items in source
  - **Root Cause**: Used banned tailwind classes or fonts
**Test 16: Build succeeds** - PASS

## Iteration 2

**Test 15: Grep src for banned items** - FAIL
  - **Symptom**: Found banned items in source
  - **Root Cause**: Used banned tailwind classes or fonts
**Test 16: Build succeeds** - PASS

## Iteration 3

**Test 15: Grep src for banned items** - PASS
**Test 16: Build succeeds** - PASS

## Iteration 5 (Trip Memories sheet & lightbox layering, portal isolation, hit-testing, and scroll lock)

- **Passport & Trip Memories E2E Tests (`tests/passport.spec.ts`)**: PASS (8/8 tests pass: hit-testing confirms passport header covered, sheet computed background `#101010` opacity 1, inert page behind, body scroll locked & restored, singular "1 PHOTO" / plural "3 PHOTOS", Lightbox close returns to sheet, 360x640 and 390x844 zero horizontal scroll).
- **Core Regression E2E Tests (`tests/main.spec.ts`)**: PASS (10/10 tests pass).
- **Rank System Unit Tests (`tests/rank.spec.ts`)**: PASS (12/12 boundary tests pass).
- **Banned UI & Storage Proofs Audit (`scripts/verify-proofs.mjs`)**: PASS (42/42 checks pass: 0 emojis, 0 gradients, 0 shadows, 0 blur, 0 rounded corners > 2px, 0 em dashes).
- **Production Build (`npm run build`)**: PASS (0 errors, optimized static routes).

