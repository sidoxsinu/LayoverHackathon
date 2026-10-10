---
trigger: always_on
---

# GATE Project — Agent Rules

## Living Walkthrough Document

A file `docs/WALKTHROUGH.md` exists in this project and must be kept up to date.

### When to update it:
- After completing any milestone or feature (update the "Current State" status table)
- When a bug or error is discovered (add to "Error Log" with symptom, cause, fix)
- When a hardcoded value or demo hack is introduced (add to "Hardcoded Values & Demo Hacks")
- When a significant architecture decision is made (add to "Architecture Decisions Log")
- When a feature is intentionally cut or deferred (note it in the state table as ⬜ with a comment)

### Status legend to use:
⬜ Not started · 🔄 In progress · ✅ Done · ⚠️ Done with caveats · ❌ Broken

### Hardcoded values must always include:
- File + function where the value lives
- Why it was hardcoded (time pressure, demo requirement, API limitation, etc.)
- Whether it should be fixed post-hackathon (Yes / No / Acceptable behavior)

### Do not:
- Mark a feature ✅ if it has known bugs or caveats — use ⚠️ and document the caveat
- Skip the error log when a bug is found and fixed — the log helps during judge Q&A
- Remove entries from the hardcoded table even if the hack is "small"

---

# GATE: Coding Rules (read fully before writing any code)

## Continuous Documentation
- **MANDATORY**: You MUST update all relevant documentation (`.md` files in `docs/`, `WALKTHROUGH.md`, PRDs, etc.) at the end of every prompt to reflect any architectural, state, or feature changes made during your turn.
- Never leave docs outdated. If you change a stack component (e.g., Vite to Next.js), add a feature, or fix a bug, the corresponding `.md` files must be updated in the same response.

## UI & Design Direction
**Aesthetic**: Airport signage, departure boards, boarding passes, luggage tags. Flat, dense, typographic, confident.

**Banned Elements (DO NOT USE)**:
- Gradients, radial orbs, glows, glass or blur effects, drop shadows.
- Emojis anywhere in the UI (use text codes like FOOD, MOVE, REST, PLUG, or simple geometric SVG shapes).
- Lucide or any stock icon set, sparkle icons, animated arrows.
- Fonts: Inter, Geist, Space Grotesk.
- Dot grids, bento grids, rows of 3 equal cards, colored left-stripe cards.
- Purple, rainbow colors, neon colors, basic pastels, pure #FFFFFF backgrounds.
- Large soft corner radius (max 2px, or fully square).
- Hover animations (this is a mobile phone UI), checkmark bullets, terminal windows.
- Em dashes (—) and "it's not X, it's Y" phrasing in any copy, filler marketing text.

**System Constraints**:
- **Fonts**: "Barlow Condensed" (headings, labels, countdown) and "IBM Plex Mono" (numbers, times, gate). Load via Google Fonts. Uppercase, tight tracking for labels.
- **Palette**: ink #101010, panel #181816, line #34322C, paper #E6E1D3, amber #F2A900, signal green #3F9B5B, alarm red #C8201A, muted text #8C887C.
- **Surfaces**: 1px solid borders, no depth fills. Dividers are rules, not boxes.
- **Motion**: Functional only (hard steps, instantly swapping text). No easing or entrance animations.
- **Copy**: Short, literal, airport voice (e.g., "RETURN TO GATE IN", "SAFE TIME 4H 22M", "COMPLETE").

## Mission
Build GATE, a mobile-first layover companion web app.
Judged on a LIVE DEMO. Reliability beats features. If it can't be demoed, don't build it.

## Before coding
1. Read `docs/00-QUICKREF.md`, then `02-PRD-features.md` and `03-PRD-technical.md`. These are the source of truth.
2. Reply with a 5-line plan and the P0 task list. Wait for my "go".
3. If anything is ambiguous or conflicts with the docs, ask. Do not guess.

## Stack (fixed)
React + Vite (JavaScript, not TypeScript) + Tailwind v4 (`@tailwindcss/vite`, theme in `index.css` via `@theme`, NO `tailwind.config.js`).
No router, no state library, no UI kit, no animation library. Do not add any dependency without asking.

## Non-negotiables
- Time is stored as epoch milliseconds. Never store Date objects. Derive everything from `Date.now()`, never count ticks.
- The alarm path must have zero network or AI dependency. Trips never touch the alarm path.
- No sample, placeholder, seeded or fake data anywhere (UI, code, DB, in-app text). Empty states are plain text. Input placeholders show format only.
- Audio is armed inside the START click handler (autoplay policy). Wake Lock, Vibration and Battery APIs are feature-detected and optional.
- Demo Mode (triple-tap wordmark → returnBy = now + 60 s) must always work. Demo Mode ignores trips.
- Alarm screen: instant mount, no animation, no dismiss except "I'M AT THE GATE", text computed from real timestamps.
- Mobile portrait first (`max-w-sm`, 48px touch targets, 16px+ text, `100dvh`).
- Every state change persists to localStorage; refresh must restore the session.

## APP FLOW & Routes
Routes: `/` (AUTH, SETUP, QUEST, ALARM, SAFE TRAVELS) · `/passport` · `/trips`.

1. AUTH (fresh session)
- Wordmark GATE vertically centered in free space.
- No sample or seeded departure board rows.
- Footnote (16px minimum): "Guests can run layovers. Sign in to save trips and your Passport."
- SIGN IN WITH GOOGLE or CONTINUE AS GUEST.

2. SETUP
- Header links for signed-in users: TRIPS / PASSPORT / SIGN OUT.
- If signed in with upcoming trips: TRIP dropdown (native select, square, 48px) above departure fields. Options: "MANUAL ENTRY", then upcoming trips as "11 OCT 18:45 / NAME". Preselects nearest upcoming trip departing within next 24 hours.
- Selecting a trip fills departure (absolute departureMs passed straight into schedule()), gate, and walk time. Fields stay editable and edits never change saved trip. Displays "FROM TRIP: NAME" and label "TRIP LOCATION: ...".
- If trips table does not exist or request fails: show muted line "TRIPS UNAVAILABLE" and continue manual flow.
- START blocked if safe time <= 0. Passes tripId and tripName into state and saves to `layovers.trip_id` and `trip_name`.

3. QUEST
- Countdown, draining stats, single mission card. Hidden from trips links.

4. ALARM
- Immediate alarm screen takeover, zero network/auth/trip dependency.

5. SAFE TRAVELS
- Header links for signed-in users: TRIPS / PASSPORT / SIGN OUT.
- Layover saved with trip_id and trip_name.

6. /PASSPORT
- Signed in only. Past layover cards show trip_name when present.

7. /TRIPS
- Signed-in only. Redirects to `/` if stored screen is quest or alarm.
- Guests see "SIGN IN TO SAVE TRIPS" and back button.
- Departure-board table (DEPARTS / TRIP / STATUS) sorted ascending for upcoming trips. Past trips behind "SHOW PAST (n)" toggle.
- Selected row reveals square 48px buttons: USE, EDIT, DELETE (with popup confirmation).
- Full screen ADD/EDIT form with device time zone label, validation, and idempotent client-generated UUID upsert.
- Cached in `gate.trips.v1.{userId}`. Cache cleared on sign-out. Offline displays "OFFLINE, SHOWING SAVED TRIPS". Writes require connection. If table missing, shows "TRIPS UNAVAILABLE".

## Priorities
P0 clock + alarm + Demo Mode → deploy → quest (stats, missions) → setup validation → P1 alert ladder + passport + trips → P2 AI.
Finish and verify each P0 item before starting the next.

## Code style
- Small files, one component per file, hooks in `hooks/`, pure logic in `lib/`.
- Plain readable code, meaningful names, no abstractions "for later", no unused code or comments restating code.
- Handle errors and edge cases listed in `02-PRD-features.md` (midnight rollover, safe time ≤ 0, blocked audio).
- No secrets in the client bundle. AI calls only via a serverless proxy, with a 3 s timeout and hardcoded fallback.

## Workflow
- Work in small steps; after each, tell me what to test on the phone in one or two lines.
- Commit after each checkpoint with a clear message.
- When a bug appears: state the root cause in one sentence, then fix. Don't rewrite unrelated code.
- Phases: BUILD (P0 only, in docs/06 order) until I say "freeze". After "freeze": bug fixes only, no new features, no refactors.
- Output complete, runnable files. No "rest of the code here" placeholders.

## Definition of done (per task)
Works on a real phone over HTTPS, matches the PRD acceptance criteria, no console errors, committed.

