# GATE — Repository Cleanup Plan & Audit Report
**Hackathon:** LAYOVER @ TinkerSpace Calicut · Oct 10–11, 2026
**Baseline Commit:** `a99926240975dfe2d09329b59ea567691fe4f509`
**Date:** 2026-10-11

---

## 1. Executive Summary & Safety Invariants

This report defines the complete cleanup and repository restructuring plan for hackathon judging.
In accordance with non-negotiable safety rules:
1. **Zero functional or logic change:** Core time math (`time.ts`), alarm audio/vibration (`alarm.ts`), alert ladder thresholds, and state machine are 100% untouched.
2. **Zero dependency changes:** `package.json` dependencies, devDependencies, and `package-lock.json` remain byte-identical.
3. **No moving of deployment roots:** `gate-next/`, `gate-next/src/`, `gate-next/public/`, and `gate-next/supabase/migrations/` stay in place.
4. **Removal only with proof:** Every removed file, dead script, or unused symbol is cataloged with concrete evidence (repo search, tsc/knip analysis, test status).
5. **No rewritten history:** Git commits are clean, incremental, and descriptive on the `main` branch.

---

## 2. Baseline Status (Phase 0)

- **Starting Commit:** `a99926240975dfe2d09329b59ea567691fe4f509`
- **Working Tree:** Clean (0 uncommitted changes).
- **`npm ci` Status:** Exit code 0 (371 packages installed and verified in 38s).
- **`npm run build` Status:** Exit code 0 (Compiled with Next.js Turbopack in 413ms, TypeScript finished in 1114ms, 11 static pages generated).
- **Route Table (Baseline):**
  - `○ /` (Static)
  - `○ /_not-found` (Static)
  - `ƒ /api/setup` (Dynamic)
  - `ƒ /api/venue-missions` (Dynamic)
  - `ƒ /api/verify` (Dynamic)
  - `ƒ /auth/callback` (Dynamic)
  - `○ /passport` (Static)
  - `○ /passport/print` (Static)
  - `○ /trips` (Static)
- **Playwright Test Suite:** 61 passed across 6 test suites (`tests/main.spec.ts`, `tests/onboarding.spec.ts`, `tests/passport.spec.ts`, `tests/rank.spec.ts`, `tests/venue.spec.ts`, `tests/venueMissions.spec.ts`) in 37.1s.
- **Smoke Baseline HTTP Statuses (Production build on port 3005):**
  - `GET /`: `200 OK`
  - `GET /passport`: `200 OK`
  - `GET /passport/print`: `200 OK`
  - `GET /trips`: `200 OK`
  - `GET /_not-found` (via `/non-existent-page`): `404 Not Found`
  - `POST /api/setup` (empty payload): `400 Bad Request` (expected validation)
  - `POST /api/setup` (valid payload): `200 OK`
  - `POST /api/venue-missions` (empty payload): `400 Bad Request` (expected validation)
  - `POST /api/venue-missions` (valid payload): `200 OK`
  - `POST /api/verify`: `401 Unauthorized` (expected auth check)
  - `GET /auth/callback`: `307 Temporary Redirect` (redirects to `/`)
- **Large Files Check:** Zero files over 1 MB. Largest files are 6 demo photos (~864 KB to 919 KB each).

---

## 3. Secret Scan Findings

A thorough scan of working tree and git log identified keys that were previously committed during early prototyping:
1. `GEMINI_API_KEY`: Commits `04010f8` and `27b6760` contained a Google Gemini API key string (`AIzaSy...`).
2. `GROQ_API_KEY`: Commits `d770ddd` and `a999262` contained a Groq key (`gsk_...`).
3. **Working Tree Remediation**:
   - `gate-next/.env.example`: Sanitized to placeholder strings (`gsk_your_groq_api_key_here`, `AIzaSy_your_gemini_api_key_here`).
   - `README.md` and `gate-next/README.md`: Sanitized to placeholder strings.
   - `gate-next/src/app/api/venue-missions/route.ts`: Removed hardcoded key fallback comparison string.
   - **Action Item for User**: As instructed by the judging prep guidelines, rotate the Gemini and Groq API keys after the hackathon.

---

## 4. Move Map (Repository Restructuring)

All file moves will be executed using `git mv` to preserve git history.

| Old Path | New Path | Reason |
|---|---|---|
| `gate-next/AGENTS.md` | `AGENTS.md` | Target structure: AGENTS.md lives at repo root alongside GEMINI.md |
| `docs/00-QUICKREF.md` | `docs/prd/00-QUICKREF.md` | Reorganize into structured PRD specifications folder |
| `docs/01-PRD-overview.md` | `docs/prd/01-PRD-overview.md` | PRD specifications folder |
| `docs/02-PRD-features.md` | `docs/prd/02-PRD-features.md` | PRD specifications folder |
| `docs/03-PRD-technical.md` | `docs/prd/03-PRD-technical.md` | PRD specifications folder |
| `docs/04-PRD-ux-design.md` | `docs/prd/04-PRD-ux-design.md` | PRD specifications folder |
| `docs/05-PRD-demo-script.md` | `docs/demo/05-PRD-demo-script.md` | Dedicated judging & demo folder |
| `docs/06-PRD-build-plan.md` | `docs/prd/06-PRD-build-plan.md` | PRD specifications folder |
| `docs/TEST-LOG.md` | `docs/logs/TEST-LOG.md` | Live logs & milestone tracking folder |
| `docs/WALKTHROUGH.md` | `docs/logs/WALKTHROUGH.md` | Live logs & milestone tracking folder |
| `gate-next/docs/TEST-LOG.md` | `docs/archive/TEST-LOG-early-snapshot.md` | Superseded early duplicate log |
| `gate-next/docs/WALKTHROUGH.md` | `docs/archive/WALKTHROUGH-early-snapshot.md` | Superseded early duplicate walkthrough |
| `supabase/migrations/0003_proofs.sql` | `docs/archive/supabase-root-0003_proofs.sql` | Root duplicate of canonical `gate-next/supabase/migrations/0003_proofs.sql` |
| `gate-next/scripts/verify-proofs.mjs` | `tools/verify-proofs.mjs` | Centralized tools directory |

### New Files to Create
- `docs/README.md`: Central documentation index with one-line summaries and suggested reading order.
- `docs/engineering/ARCHITECTURE.md`: Technical deep dive into system architecture and zero-network alarm path.
- `docs/engineering/DATABASE-AND-RLS.md`: Supabase migrations, table schemas, and mathematical RLS proof.
- `docs/engineering/ALARM-DESIGN.md`: Audio arming, WebAudio oscillator fallback, Wake Lock, and alert ladder.
- `docs/engineering/API-ROUTES.md`: Serverless API route contracts, inputs, outputs, rate limits, and timeouts.
- `docs/engineering/TESTING.md`: Automated testing strategy, Playwright test suite breakdown, and CI/CD verification.
- `docs/demo/JUDGE-GUIDE.md`: Dedicated judge rubric mapping, travel connection rationale, and 60-second demo script.
- `tools/capture-screenshots.mjs`: Automated Playwright screenshot capture script generating judge graphics at 390x844.

---

## 5. References Requiring Updates

| File | Reference Before | Updated Reference |
|---|---|---|
| `GEMINI.md` | `docs/WALKTHROUGH.md` | `docs/logs/WALKTHROUGH.md` |
| `GEMINI.md` | `docs/00-QUICKREF.md`, `02-PRD-features.md`, `03-PRD-technical.md` | `docs/prd/00-QUICKREF.md`, `docs/prd/02-PRD-features.md`, `docs/prd/03-PRD-technical.md` |
| `GEMINI.md` | `docs/06` | `docs/prd/06-PRD-build-plan.md` |
| `docs/logs/WALKTHROUGH.md` | `docs/05-PRD-demo-script.md` | `docs/demo/05-PRD-demo-script.md` |
| `docs/prd/06-PRD-build-plan.md` | `docs/03-PRD-technical.md` | `docs/prd/03-PRD-technical.md` |
| `docs/prd/06-PRD-build-plan.md` | `docs/02-PRD-features.md` | `docs/prd/02-PRD-features.md` |
| `AGENTS.md` | `gate-next/AGENTS.md` | Stays at root as canonical `AGENTS.md` |
| `gate-next/README.md` | Full duplicate content | Short pointer to root README with local Next.js commands |

---

## 6. Safe Removals Table (Proof Protocol)

| Path / Symbol | Kind | Evidence of Zero Usage | Status / Commit |
|---|---|---|---|
| `.DS_Store` | Generated OS file | Tracked binary macOS file. Untrack and add to `.gitignore`. | Removable |
| `gate-next/test-results.json` | Generated test artifact | Generated Playwright output. 0 imports. Add to `.gitignore`. | Removable |
| `gate-next/dom.html` | Scratch file | 0 imports. Static HTML debug dump. | Removable |
| `gate-next/patch_api.js` | Scratch script | 0 imports. Ad-hoc regex script used during development. | Removable |
| `gate-next/patch_card.js` | Scratch script | 0 imports. Ad-hoc regex script used during development. | Removable |
| `gate-next/patch_effect.js` | Scratch script | 0 imports. Ad-hoc regex script used during development. | Removable |
| `gate-next/patch_missions.js` | Scratch script | 0 imports. Ad-hoc regex script used during development. | Removable |
| `gate-next/patch_page.js` | Scratch script | 0 imports. Ad-hoc regex script used during development. | Removable |
| `gate-next/patch_page_restore.js` | Scratch script | 0 imports. Ad-hoc regex script used during development. | Removable |
| `gate-next/patch_page_revert.js` | Scratch script | 0 imports. Ad-hoc regex script used during development. | Removable |
| `gate-next/patch_playwright_api.js` | Scratch script | 0 imports. Ad-hoc regex script used during development. | Removable |
| `gate-next/patch_setup.js` | Scratch script | 0 imports. Ad-hoc regex script used during development. | Removable |
| `gate-next/update_missions.js` | Scratch script | 0 imports. Ad-hoc script to write missions. | Removable |
| `update_page.py` | Scratch script | 0 imports. Ad-hoc python script. | Removable |
| `gate-next/tests/runner.js` | Obsolete test runner | 0 imports in package.json or tests. Replaced by `playwright test`. | Removable |
| `gate-next/tests/e2e.mjs` | Obsolete test script | 0 imports in package.json or tests. Replaced by `tests/*.spec.ts`. | Removable |
| `gate-next/src/components/SetupHeader.tsx` | Unused component | 0 imports across entire repo. SetupScreen renders inline header. Confirmed by `knip`. | Removable |
| `gate-next/src/lib/venueMissions.ts:3` (`MISSION_XP`, `PROOF_BONUS_XP`) | Unused import | Imported from `./rank` but never referenced in `venueMissions.ts`. Confirmed by ESLint. | Removable |
| `gate-next/tests/main.spec.ts:5` (`getOffsetTimeStr`) | Unused test import | Imported but unused in test suite. Confirmed by ESLint. | Removable |
| `gate-next/tests/venue.spec.ts:46` (`apiCalled`) | Unused variable | Declared but unused in test suite. Confirmed by ESLint. | Removable |
| `gate-next/tests/venueMissions.spec.ts:3` (`VALID_MISSION_TAGS`, `WAIT_LABELS`) | Unused test import | Imported but unused in test suite. Confirmed by ESLint. | Removable |

---

## 7. Items Kept as Uncertain / Decision Needed

- `demo_images/` at root: 100% duplicate of `gate-next/public/demo_images/`. **Kept** because the user explicitly stated they will copy these images to their mobile phone during the live presentation.
- `gate-next/src/components/DebugOverlay.tsx`: Appears unused in production code, but docs explicitly note it is toggled via `?dev=1` for live judge demonstrations. **Kept intact**.
- `gate-next/src/components/ui/countdown-vapor-digits.tsx`: Knip flagged default export as unused, but `VaporCountdown` named export is actively imported and used by `Countdown.tsx`. **Kept intact**.
- `gate-next/src/lib/passport.ts:25` (`formatPhotoCount`): Helper function in passport lib. **Kept intact** for backward compatibility.
- `gate-next/src/lib/trips.ts` (`clearAllTripsCaches`): Exported cache helper. **Kept intact** for cache maintenance.

---

## 8. Batch Execution Sequence

- **Batch 1:** Untrack and delete generated files (`.DS_Store`, `test-results.json`) and scratch patch scripts. Run `npm run build` and `npm run test:e2e`. Commit.
- **Batch 2:** Remove unused `SetupHeader.tsx` and dead imports. Run `npm run build` and `npm run test:e2e`. Commit.
- **Batch 3:** Execute directory structure moves (`git mv`) to `docs/prd/`, `docs/demo/`, `docs/logs/`, `docs/archive/`, `tools/`. Run `npm run build` and `npm run test:e2e`. Commit.
- **Batch 4:** Add engineering docs (`docs/engineering/`), central `docs/README.md`, update references in `GEMINI.md` and docs. Run `npm run build` and `npm run test:e2e`. Commit.
- **Batch 5:** Create `tools/capture-screenshots.mjs`, capture real screenshots at 390x844, generate `docs/assets/hero.png`. Commit.
- **Batch 6:** Overhaul root `README.md` for judges with diagrams, rubric tables, screenshot gallery, and clear quick start. Commit.
- **Batch 7:** Verification phase (fresh clone test, link validation script, stale path checks, diff audit). Final report.
