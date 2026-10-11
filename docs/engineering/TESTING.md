# GATE — Automated Testing & Quality Assurance

**Last Verified:** 2026-10-11 · **Commit:** `83f76bc`

---

## 1. Testing Philosophy

Because GATE is judged on a live hackathon demonstration where software reliability beats vanity metrics, automated testing is mandatory for every commit.

The automated test suite runs via **Playwright** against a headless Chromium browser configured for mobile portrait emulation (`390x844`, touch enabled, safe area insets).

---

## 2. Test Execution

All test commands run from the `gate-next/` directory:

```bash
# Run full E2E and unit test suite
npm run test:e2e

# Run with interactive UI inspector
npx playwright test --ui

# Run specific test file
npx playwright test tests/rank.spec.ts
```

---

## 3. Test Suite Breakdown (72 Tests Total)

| Suite File | Tests | Coverage Scope |
|---|---|---|
| `tests/main.spec.ts` | 10 | Core setup validation, Demo Mode 60s alarm, normal alert ladder, stats drain loop, mission complete/skip, localStorage restore, audio blocked oscillator fallback, background tab simulation |
| `tests/onboarding.spec.ts` | 6 | First-time onboarding spotlight tour, 4-rectangle flat dimming, urgent phase auto-unmount, InfoTip popovers, outside-click and escape dismiss |
| `tests/passport.spec.ts` | 8 | Empty passport state, 160 XP rank evaluation, layover cards, Trip Memories sheet, photo lightbox, body scroll locking, zero horizontal overflow at 390px and 360px |
| `tests/rank.spec.ts` | 20 | Complete unit tests for all 10 rank tiers: boundary values (0, 49, 50, 149, 150, 160, 299, 300, 499, 500, 999, 1000, 1800, 3000, 4600, 6500, 10000 XP), negative inputs, NaN, and undefined guarding |
| `tests/venue.spec.ts` | 5 | Transit waiting type selector, dynamic place labels (GATE, PLATFORM, BUS STOP, MEETING POINT), custom venue persistence, zero-blocking START, graceful offline fallback |
| `tests/venueMissions.spec.ts` | 12 | Prompt injection sanitization, tag-derived stat boosts (+20 to +30), JSON validation, title clamping, deduplication, 12h localStorage caching, SPOT/MEET offline fallbacks |
| `tests/leaderboard.spec.ts` | 11 | Opt-in membership flow, departure board rendering, top-3 amber highlight, YOU tag, anti-farming duration cap, outside-cutoff separator, empty/error fallbacks, offline caching, active quest/alarm redirect, zero PII audit |

---

## 4. SQL Verification Test Suite (`supabase/tests/leaderboard_tests.sql`)

Includes 8 verified PostgreSQL test queries:
1. Handle uniqueness across case variations (`LOWER(handle)`).
2. Reserved and inappropriate word rejection (`is_handle_blocked`).
3. Multi-tenant RLS isolation on `leaderboard_members`.
4. Anon privilege revocation.
5. Zero user identifier leakage in RPC results.
6. Exclusion of hidden accounts.
7. Anti-farming duration capping formula.
8. 1-hour handle change cooldown trigger verification.

---

## 5. Design System Compliance Grep

In addition to functional tests, GATE enforces strict automated audits to guarantee no banned UI elements exist in source code:
- **Zero Emojis**: Enforced via regex grep; pure alphanumeric codes only (`FOOD`, `MOVE`, `REST`, `PLUG`, `PREP`, `MEET`, `SPOT`).
- **Zero Gradients & Shadows**: Rejects `linear-gradient`, `radial-gradient`, `box-shadow`, `drop-shadow`.
- **Zero Glassmorphism / Blur**: Rejects `backdrop-blur`, `filter: blur`.
- **Zero Rounded Corners $> 2$px**: Max border radius is 2px or square (`rounded-none`, `rounded-[2px]`).
- **Zero Em Dashes**: Pure hyphens only; em dashes (`—`) are banned from all UI strings.
