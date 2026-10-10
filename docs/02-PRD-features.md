# GATE — Features (v2)

## Scope: 5 screens, 6 systems
Auth · Setup · Quest · Alarm · Safe Travels / Clock · Missions · Stats · Alerts · Persistence · Trips

## Priority legend
**P0** demo-critical · **P1** polish that scores · **P2** only if everything else is done

---

## F1. Setup screen (P0)
| Field | Input | Notes |
|---|---|---|
| Departure | Time picker **or** "in X h Y m" toggle | Duration mode avoids timezone confusion. If picked time ≤ now, roll to tomorrow and show "Departs tomorrow 06:10" |
| Gate | Text, e.g. B14 | Optional "TBA" allowed |
| Walk to gate | 2 / 5 / 10 / 15 min | Default 10 |
| Vibe | Wired / Tired / Hungry | Seeds starting stats |
| Demo Mode | Triple-tap wordmark | returnBy = now + 60 s |

**Live preview:** "Safe time: 4h 22m" (red + warning if < 10 min or negative).
**START tap must:** arm audio, request Wake Lock, save state.
**Validation:** safe time ≤ 0 → block START, "You need to head to the gate now."

**Accept:** one-handed, ≤ 4 taps to start, rejects impossible inputs.

## F2. Quest screen (P0)

### Countdown
`RETURN TO GATE IN 03:42:17` in huge monospace amber digits in a "board" strip with a thin top and bottom rule. Digits change instantly (no easing). No depleting progress bar.

### Stats (real behavior)
| Stat | Start | Drain | Restored by |
|---|---|---|---|
| 🔋 Battery | Real device battery if API available, else 70 | real value, or −0.15/min | Charging missions (manual boost if no API) |
| 🍔 Hunger | 70 (Hungry vibe: 30) | −0.3/min | Food missions |
| 🧠 Sanity | 70 (Wired: 40, Tired: 50) | −0.4/min | Walk, explore, rest missions |

Clamp 0–100. Stat bars: segmented cells (10 blocks), like a board display. Low stat blinks with a hard 1s on/off step. Below 25 the mission engine prioritizes it.

### Mission card
Paper-colored (#E6E1D3) card with ink text, a dashed tear line separating the action buttons, a mission code in the corner (e.g. M-03). Buttons are square, uppercase text. Action buttons: **COMPLETE**, **SKIP**. Complete: stat boost + XP + "COMPLETE" flash + next mission after 1.5 s. Skip: new mission, no penalty.

### Mission engine rules
1. Eligible if `minsLeft` in mission's `when` range and `mission.mins ≤ minsLeft − 5`.
2. Prefer missions for the **lowest stat**.
3. Don't repeat the last 3.
4. If nothing fits, show "Head to your gate" mission.

### Log (P1)
Collapsible list: COMPLETED, SKIPPED, with XP total. No emojis.

## F3. Alert ladder (P0 for final alarm, P1 for earlier steps)
| Stage | Trigger | Effect |
|---|---|---|
| Heads-up | ≤ 15 min | Top banner "START WRAPPING UP", soft chime |
| Urgent | ≤ 5 min | Amber theme, vibration, "WALK TO GATE NOW" |
| ALARM | ≤ 0 | Solid red #C8201A that hard-steps to #7A120E every 0.6s using steps(), white condensed type at max size, gate number in mono at 40vw max. |

**Alarm rules:** latches (never auto-returns to quest), no back/close, single button **I AM AT THE GATE**, mounts instantly with no animation. Visual + sound + vibration together.
Demo Mode compresses thresholds to 20 s / 10 s.

## F4. Safe Travels + Layover Passport (P1)
Ink background, a plain stamp-style bordered block with the stats set in mono, rotated -3deg. *LAYOVER PASSPORT: Survived 3h 12m, 4 missions, 340 XP, Rank: Gate Guardian*. Designed to screenshot. "START NEW LAYOVER" resets. No emojis.

## F5. Persistence (P0)
Save `{departureMs, returnByMs, gate, vibe, stats, log, xp, screen}` in localStorage on change. On load: restore; if now ≥ returnBy and screen ≠ safe → go straight to alarm.

## F6. AI missions (P2)
At START, one request for 6 witty missions (JSON). 3 s timeout, validate shape, else hardcoded. Badge "AI" on AI missions. Never on the alarm path.

## F7. Trips (P1) — Saved Upcoming Departures
Upcoming flight departures management for signed-in users. Completely isolated from the offline alarm engine.

### Acceptance Criteria
1. **Access Control & Lockdown**:
   - Signed-in only. Guests see "SIGN IN TO SAVE TRIPS" and a back button.
   - Links appear only in SETUP and SAFE TRAVELS headers (`TRIPS` / `PASSPORT` / `SIGN OUT`). Hidden on QUEST and ALARM.
   - Navigating to `/trips` redirects to `/` if active screen is `quest` or `alarm`.
2. **Departure Board Table**:
   - Header row in muted uppercase: `DEPARTS` / `TRIP` / `STATUS`.
   - Rows at 390px:
     - Left: Date and time in mono amber (e.g. `11 OCT` over `18:45`).
     - Middle: Trip name over muted location, flight number, and gate.
     - Right: Status label (`IN 3D`, `IN 5H`, `TODAY`, `PAST`).
   - Upcoming trips sorted ascending by departure time.
   - Past trips hidden behind `SHOW PAST (n)` toggle and dimmed when expanded.
   - Tapping a row selects it and reveals three square 48px buttons: `USE`, `EDIT`, `DELETE`.
   - Delete triggers confirmation popup in airport signage modal style.
3. **Empty State**:
   - Plain text: `NO TRIPS SAVED. ADD YOUR NEXT DEPARTURE.` with square `ADD TRIP` button. No fake or placeholder cards.
4. **Add / Edit Form**:
   - Full screen layout matching airport signage theme.
   - Inputs: NAME (required, 1–60 chars), LOCATION (max 60), FLIGHT NO (max 12), GATE (max 8, TBA allowed), DEPARTURE DATE and TIME (native inputs, dark scheme), WALK TO GATE segmented 2/5/10/15 (default 10).
   - Label: `TIMES USE YOUR DEVICE TIME ZONE.`
   - Validation: required fields, departure must be in the future on create, trimmed and length-limited, single error line in alarm red.
   - Save performs idempotent upsert with client-generated UUID (`crypto.randomUUID()`).
5. **Offline & Cache**:
   - Reads cached in `localStorage` key `gate.trips.v1.{userId}`.
   - When offline, list renders from cache with muted line: `OFFLINE, SHOWING SAVED TRIPS`.
   - Writes require network connectivity; offline attempts display clear error line without silent queues.
   - Cache cleared on sign-out.
6. **Setup Integration**:
   - Signed-in user with at least one upcoming trip sees native square 48px `TRIP` select dropdown above departure fields.
   - Options: `MANUAL ENTRY`, followed by upcoming trips formatted as `11 OCT 18:45 / NAME`.
   - Auto-preselects nearest upcoming trip departing within next 24 hours; otherwise `MANUAL ENTRY`.
   - Selecting a trip populates departure (absolute `departureMs`), gate, and walk time. All fields remain editable without altering saved trip.
   - Displays muted label: `FROM TRIP: NAME`. Location shown as label only; never triggers mission regeneration.
   - START stores `tripId` and `tripName` in layover state and `layovers` table (`trip_id`, `trip_name`).
   - Guests and users with no trips see manual entry only.
7. **Graceful Degradation**:
   - If trips table does not exist in DB or query fails, dropdown is hidden and displays single muted line: `TRIPS UNAVAILABLE`. App remains 100% functional.

## Out of scope
Maps, lounge data, push notifications, native app, multi-leg flights, social feeds.

## Guest Statement
Guests can run full layovers with complete countdown, missions, alarm, and local persistence. Sign in with Google is required only to save upcoming trips and access the multi-session Layover Passport.

## Edge cases
| Case | Behavior |
|---|---|
| Departure passed / safe time ≤ 0 | Block START with message |
| Past midnight | Roll to next day, show date in preview |
| Refresh mid-session | Restore from storage |
| Tab backgrounded then returns | Clock recomputes from timestamps; ladder catches up instantly |
| Audio blocked | Oscillator fallback + vibration + visual |
| Battery API missing (iOS/Firefox) | Manual battery stat |
| Trips table missing or unmigrated | Hide dropdown, show TRIPS UNAVAILABLE, app runs manual entry normally |
| Offline on /trips | Read from local cache with warning; block writes with error line |

