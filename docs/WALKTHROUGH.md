# GATE — Project Walkthrough & Live State Log
## Running document: updated after every significant change
**Hackathon:** LAYOVER @ TinkerSpace Calicut · Oct 10–11, 2026

---

## How to Use This Document

This file is the **single source of truth** for where the project stands right now.
- **Before coding:** read the "Current State" and "Known Issues" sections.
- **After every milestone:** update the state table, known issues, and add a log entry.
- **During judging prep:** check the "Hardcoded / Demo Hacks" section — these must be called out honestly in Q&A.

---

## Current State

| Area | Status | Notes |
|------|--------|-------|
| Project scaffold | ✅ Done | Next.js (App Router) + Tailwind v4 in `gate-next/` |
| Tailwind v4 + theme | ✅ Done | All tokens in `globals.css @theme` |
| `time.ts` (core math) | ✅ Done | nextOccurrence, schedule, demoSchedule, phaseFor, fmt |
| `useNow` hook | ✅ Done | Derives from Date.now(), visibilitychange sync |
| `alarm.ts` (audio arm + fire) | ✅ Done | MP3 primary (/alarm.mp3), oscillator fallback, vibration, wake lock |
| Auth screen UI | ✅ Done | Dedicated first screen, Guest mode restored, Presentation pass complete |
| Setup screen UI | ✅ Done | Time/duration toggle, gate, walk, vibe, trip selector, live safe-time preview |
| Demo Mode (triple-tap) | ✅ Done | Triple-tap wordmark or START DEMO; 60s countdown |
| Vercel deploy + HTTPS | ✅ Done | Deployed on https://gate-next-cyan.vercel.app |
| Quest screen (countdown) | ✅ Done | RETURN TO GATE IN strip, amber mono digits |
| Stat bars (drain loop) | ✅ Done | 10-block segmented, 30s drain interval, blink <25 |
| Mission card + engine | ✅ Done | pickMission, paper card, COMPLETE flash, SKIP |
| Alert ladder (3 stages) | ✅ Done | Heads-up banner (15min/20s demo), urgent red banner (5min/10s demo), alarm screen |
| Persistence (localStorage) | ✅ Done | Save on state change, restore on mount, straight-to-alarm if returnBy passed |
| Safe Travels screen | ✅ Done | Rotated stamp, survived time, missions, XP, rank |
| Layover Passport card | ✅ Done | Replaced with /passport route and Supabase integration |
| Trips (F7 saved departures) | ✅ Done | /trips departure board table, Setup integration, offline cache, RLS |
| Migration 0002_trips.sql | ✅ Done | Written to supabase/migrations/0002_trips.sql (manual run in SQL Editor) |
| Mission log (collapsible) | ✅ Done | Collapsible DONE/SKIP list with XP per entry |
| Battery API hook | ✅ Done | useBattery.ts — null on iOS/Firefox, manual stat fallback |
| AI missions (Gemini proxy) | ✅ Done | /api/setup hits Gemini for custom missions based on precise location |
| Precise Geolocation | ✅ Done | Uses Nominatim API for reverse geocoding to exact neighborhood/amenity |
| Location Override Modal | ✅ Done | Custom styled popup to confirm manual location changes |
| Supabase Auth + Postgres | ✅ Done | Google sign in mandatory for passport, idempotent offline queueing, RLS enabled |
| App Flow Audit | ✅ Done | Conforms to strict PRD state machine; warning.mp3 duplication fixed; Nominatim limits respected |
| Gate arrival completion | ✅ Done | Replaces mission slot with "ENJOY YOUR JOURNEY" airport signage card; prevents further tasks; allows direct safe return |


**Status legend:** ⬜ Not started · 🔄 In progress · ✅ Done · ⚠️ Done with caveats · ❌ Broken

---

## Known Issues & Drawbacks

> Update this section as you discover problems. Be honest — these help during Q&A prep.

- **useNow returns 0 on initial server render** — harmless (client hydration is instant), but means stats calculations use 0 briefly on hydration.
- **MissionCard generates a random M-XX code on each render** — should be stored in mission state to be stable. Cosmetic only.
- **Offline Save Queueing** — `SafeTravels` pushes to a local queue. If the user never connects to the internet and closes the tab, the layover is lost until they return to the app online.
- **Device Time Zone limitation** — Trip departure dates and times use native inputs locked to the device's local timezone. Labeled clearly: "TIMES USE YOUR DEVICE TIME ZONE".
- **50-trip cap per user** — A database trigger hard-caps trips to 50 per user to prevent abuse.

---

## Hardcoded Values & Demo Hacks

> These are intentional shortcuts taken for the hackathon build. Document them so you can explain them confidently to judges if asked.

| Location | What's hardcoded / hacked | Why | Should be fixed later? |
|----------|--------------------------|-----|------------------------|
| `lib/time.ts` `demoSchedule()` | `returnByMs = now + 60_000` (60-second alarm) | Demo Mode needs a predictable, short alarm window for the pitch | Yes — real usage reads from departure input |
| `src/app/api/setup/route.ts` | `GEMINI_API_KEY` read from `.env.local` | Secure server-side call for mission generation | No — standard pattern |
| `lib/missions.ts` | All 10 missions are static strings | Fallback missions if Gemini AI is unavailable or rate limited | Yes — AI-generated missions are mostly handled now via API |
| `lib/alarm.ts` `arm()` | Audio is pre-played and paused on START to bypass autoplay policy | iOS/Android block audio that doesn't originate from a user gesture | No — this is the correct production pattern |
| Setup screen | "in X h Y m" mode is a toggle, not auto-detected from locale/timezone | Timezone detection adds complexity | Yes |
| Stat drain | Drain rates are magic numbers tuned for a 4-hour demo | Not validated against real user feel | Yes |
| Battery stat | Falls back to a hardcoded `70%` start if `navigator.getBattery()` is unsupported (iOS, Firefox) | Battery API is Chromium-only | No — fallback is acceptable behavior |
| Alert ladder thresholds | Demo Mode compresses thresholds to `20s / 10s`; real mode uses `15min / 5min` | Required for the 60-second demo window | No — intentional dual-mode |
| `public/alarm.mp3` | Bundled MP3 alarm sound with WebAudio oscillator fallback | Standalone client playback without network dependencies | Acceptable behavior |
| `components/MissionCard.tsx` | Random M-XX mission number generated on render | Cosmetic; mission ID not stored in state | Yes — store mission number |
| `components/SafeTravels.tsx` | Rank thresholds (50/150/300/500 XP) | Quick mapping; not playtested | Yes |
| `lib/sync.ts` | Online check uses `navigator.onLine` | Simple check for demo purposes | Yes — should verify actual fetch success |
| `supabase/migrations/0002_trips.sql` | 50 trips cap per user trigger | Protection against DB spam during hackathon | Acceptable behavior |
| `src/app/trips/page.tsx` | Native date/time pickers use device local timezone | Timezone lookup library would add dependencies and complexity | Acceptable behavior |


---

## Error Log

> Record every bug found and whether it was fixed. Include the symptom, cause, fix.

| # | Symptom | Cause | Fix | Fixed? |
|---|---------|-------|-----|--------|
| 1 | Next.js build error: `Expected 1 arguments, but got 0` for `useRef` | TypeScript strict mode requires explicit `undefined` for `useRef` without initial value | Changed to `useRef<T | undefined>(undefined)` | Yes |
| 2 | Next.js build error: `unstable Date.now() in Client Component` | `useState(Date.now())` called during prerender | Changed to `useState(0)` with `setNow(Date.now())` in useEffect | Yes |
| 3 | Viewport metadata warning | Next.js 16 moved `viewport` out of `metadata` export | Added separate `export const viewport = {...}` | Yes |
| 4 | Supabase Save duplicates | Clicking safe travels twice re-queued layovers | added `layoverId` via `crypto.randomUUID()` to `AppState` | Yes |
| 5 | Type error on `npm run build` | Added `layoverId` to state but `Omit` in `START` payload didn't exclude it | Added `layoverId` to `Omit` list in `page.tsx` | Yes |
| 6 | Type error on `npm run build` for `logId` | `logId` missing from `SavedState` | Added `logId?: string` to `storage.ts` and mapped it in `page.tsx` | Yes |
| 7 | First screen skips AUTH straight to SETUP | (1) `restored.screen === 'auth'` converted to `'setup'` in `page.tsx`; (2) existing `gate.v2` in localStorage had `'setup'`; (3) active Supabase session in browser auto-skips in `AuthScreen` | Versioned storage to `gate.v3`, prevented blank auth state saves, restored AUTH for unauthenticated users, fixed `/alarm.mp3` casing | Yes |

---

## Build Log

> Add one entry per completed milestone. Include timestamp and what works/doesn't.

---

## [02:20] — Gate Arrival & Journey Completion Card
**What was done:**
1. Modified `lib/missions.ts` and `app/page.tsx` so completing the "Start walking toward your gate now" objective (`id: 'go'`) halts mission progression and sets `mission: null` instead of looping or assigning any other task.
2. In `components/MissionCard.tsx`, added detection for gate objective completion (`log.some(l => l.id === 'go' && l.status === 'completed')`).
3. Replaced the task slot with a dedicated airport signage paper card displaying:
   - Header strip: `GATE REACHED / FINAL` · `GATE {gate || 'TBA'}`
   - Title: `ENJOY YOUR JOURNEY` in Barlow Condensed, heavy uppercase
   - Instruction: `ALL OBJECTIVES COMPLETED · STAND BY AT GATE FOR BOARDING ANNOUNCEMENT.`
   - Flight summary strip: `STATUS: READY TO BOARD` · `TOTAL SCORE: +{xp} XP`
   - Primary action button: `CONFIRM AT GATE [SAFE RETURN]` linking to safe layover completion.
4. Updated `QuestScreen.tsx` to reflect arrival state: the bottom action button updates to `I AM AT THE GATE (SAFE RETURN)` in signal green, and the urgent banner reflects `AT GATE · STANDING BY`.
**What works:** Airport signage aesthetic strictly maintained (zero emojis, flat 1px borders, #E6E1D3 / #101010 palette, Barlow & IBM Plex fonts). Prevents further tasks from generating after reaching the gate. `npm run build` passes cleanly.

---

## [01:30] — Mandatory Auth & Precise Location Override
**What was done:** 
1. Re-architected `page.tsx` to force a strict authentication block. "Continue as Guest" was removed; all users must log in via Google to bypass the black `CONNECTING...` / `AuthScreen`.
2. Replaced the generic Gemini coordinate guesser with OpenStreetMap's Nominatim reverse geocoding API to pull exact amenities, streets, and neighborhoods for the user's location.
3. Overhauled the Setup screen to merge auto-location text with a manual override text box. Editing the box reveals an "APPLY" button that triggers a custom, flat-styled `window.confirm` alternative modal. Confirming re-fetches Gemini AI missions for that exact string without relying on GPS.
**What works:** Mandatory auth gating is mathematically locked. Precise location pulls accurate strings. The custom override modal strictly adheres to the airport aesthetic constraints (no rounded corners, solid borders, #181816 backgrounds).

---

## [20:10] — PRD UI Update
**What was done:** Updated features and technical PRD to reflect the new airport signage, flat typographic design direction. Banned emojis, gradients, rounded corners.
**What works:** PRDs reflect accurate design target.
**What doesn't yet:** Code has not been updated yet.
**Immediate next step:** Implement the new UI direction in the codebase.

## [20:25] — Convert to Next.js & Scaffold Clock/Alarm
**What was done:** Switched from Vite to Next.js in `gate-next`. Scaffolded `time.ts`, `useNow.ts`, `alarm.ts`, `GateAlarm.tsx` and the Demo trigger in `page.tsx`.
**What works:** Next.js compiles and Demo Mode + Wake Lock + Audio works.
**What doesn't yet:** Quest and Setup screens are pending.
**Immediate next step:** Build the rest of the application screens in Next.js.

## [20:45] — Full P0 Build Complete
**What was done:** Built the entire GATE app in one pass:
- `lib/missions.ts` — all 10 missions + pickMission engine + startStats
- `lib/storage.ts` — localStorage save/load/clear
- `hooks/useBattery.ts` — Battery API with null fallback
- `components/SetupScreen.tsx` — time/duration input, gate, walk, vibe, live safe time preview
- `components/Countdown.tsx` — amber board strip, hard-step digits
- `components/StatBar.tsx` — 10-block segmented bars, green/amber/red, blink <25
- `components/MissionCard.tsx` — paper card, tear line, COMPLETE flash, SKIP
- `components/MissionLog.tsx` — collapsible DONE/SKIP log with XP
- `components/QuestScreen.tsx` — all alert banners, stat drain, full quest loop
- `components/SafeTravels.tsx` — rotated stamp, survived/missions/XP/rank
- `app/page.tsx` — full reducer, persistence, alarm latch, drain loop, Demo Mode
**What works:** `npm run build` passes with 0 errors.
**What doesn't yet:** Not tested on a real phone; audio/wake lock/vibration need HTTPS to verify; Vercel deploy pending.
**Immediate next step:** Deploy to Vercel and test alarm on a real phone.

## [22:30] — AI Geolocation Integration
**What was done:** Switched from repetitive AI calls in `page.tsx` to a single fetch in `SetupScreen.tsx`. It requests `navigator.geolocation`, hits `/api/setup`, and generates 5 airport-specific missions via Gemini API + returns the nearest airport name. Merges these with default absurd missions in `pickMission()`.
**What works:** Location fetching, single AI generation, graceful fallback to `UNKNOWN AIRPORT` + defaults if AI or location fails, uneditable location display in UI.
**What doesn't yet:** Geolocation might prompt for permission. Vercel deployment pending.
**Immediate next step:** Deploy to Vercel.

## [22:35] — Energy Renaming & Adjustable StatBar
**What was done:** Renamed 'sanity' to 'energy' across all TS/TSX files and state interfaces. Updated the `StatBar` component to accept an `onChange` prop and passed it down to `StatRow`, making the individual stat blocks clickable (setting the value to `(index + 1) * 10`). Wired this up in `page.tsx` via a new `SET_STAT` action.
**What works:** Clicking any block on the stat bars correctly updates the state in increments of 10. `sanity` is gone, `energy` is the new stat. Mission boosts correctly support negative values, and doing active/moving tasks when energy is high now successfully drains energy. Eating also restores a bit of energy.
**What doesn't yet:** Same deployment pending status.
**Immediate next step:** Deploy to Vercel and test.

## [22:50] — Demo & Debug Overlay
**What was done:** Created a `DebugOverlay.tsx` floating DEV button at the bottom right of the screen. When clicked, it opens a quick-access menu with useful debug/demo tools: Trigger Alarm (sets return time to now + 10s), Fast Forward (-1 Hour), Fill Stats, Drain Stats, and Hard Reset (clears localStorage and reloads).
**Why:** To make testing edges cases (like alarm audio, low battery behavior, and safe travels states) possible without waiting hours.
**Styling:** Follows the strict design guidelines (no radius, no shadows, uses Barlow and IBM Plex Mono).

## [22:58] — Silence Alarm & Custom Audio
**What was done:** 
1. Added a `SILENCE ALARM` button to the `GateAlarm` screen. This allows the user to stop the loud audio and vibration while walking to the gate without dismissing the screen or losing the wake lock.
2. Updated the audio source in `alarm.ts` to use `/Alarm.mp3` instead of the old `alarm.wav`.
**Why:** To improve user experience when the alarm triggers in a public terminal, and to utilize the custom audio file provided.

## [23:02] — Alarm Audio Race Condition Fix
**What was done:** Added an `isPlaying` flag to `alarm.ts` to prevent the `arm()` function from accidentally pausing the audio if `startAlarm()` has already begun playback. 
**Why:** Because `arm()` is asynchronous (it awaits `play()`), if the alarm triggers while `arm()` is still resolving, it would immediately call `pause()`, resulting in the audio playing for only a single millisecond before going silent.

## [23:04] — Warning Phase Audio
**What was done:** Configured the application to play `warning.mp3` once when the countdown timer hits the "urgent" phase (under 5 minutes left in real time, or under 10 seconds in demo mode).
**Why:** User requested a specific sound to play when the timer is about to end as a heads-up before the final alarm triggers.

## [23:06] — Silence Button Fix
**What was done:** Updated the `silenceAlarm()` function to explicitly pause the newly added `warning.mp3` audio in addition to the main `Alarm.mp3`.
**Why:** If the warning audio was triggered right before the main alarm, pressing "SILENCE ALARM" would only silence the main alarm but leave the warning audio playing. Now it kills all active audio tracks instantly.

## [23:07] — Browser Audio Unlock Fix
**What was done:** Wired up the `arm()` function to the `START LAYOVER` button in the Setup screen (`page.tsx`). 
**Why:** Browsers strictly block any audio playback that didn't originate from a direct user gesture. By making sure `arm()` fires exactly when the user clicks "START LAYOVER", the audio engine successfully initializes and pre-authorizes background playback for later.

## [23:08] — DEV Overlay Tweaks
**What was done:** Added `+1 MIN` and `-1 MIN` buttons to the DEV menu for fine-grained timer manipulation. Removed the behavior that automatically closed the menu when clicking any debug button.
**Why:** Makes it easier to quickly skip ahead to test the `urgent` (warning) phase and the `alarm` phase in real-time without the menu closing repeatedly.

## [23:12] — Global Mute Toggle
**What was done:** Added a `GlobalMuteButton` component fixed to the top right of every screen. Wired it deep into the `alarm.ts` engine so it forcefully silences and blocks all audio tracks, chimes, and vibrations when toggled ON.
**Why:** User requested a permanent, accessible way to ensure their device stays completely silent at all times if they are in a quiet zone.

## [23:14] — Audio Unlock "Blip" Fix
**What was done:** Set the `volume` of the audio tracks to `0` during the `arm()` initialization sequence that fires when clicking "START LAYOVER", and then restored the volume immediately after.
**Why:** When clicking start, the browser unlocks the audio by playing and instantly pausing it. This was causing a tiny, split-second audio "blip" to be heard by the user. Lowering the volume to 0 makes the unlock sequence completely silent.

## [23:18] — Inline Mute Layout
**What was done:** Refactored the `GlobalMuteButton` to remove its absolute/fixed positioning. It is now properly injected directly into the Flexbox header layout of the Setup, Quest, Alarm, and Safe Travels screens. 
**Why:** The button was overlapping text on narrow screens. It now respects standard DOM flow and has proper spacing alongside other header elements.

## [23:25] — Audio Lifecycle Fix
**What was done:** Updated the application logic to forcefully stop `warning.mp3` if the user gets extra time (dev tools) or if the timer crosses zero while the warning is still playing. Added `stopWarning()` to the `startAlarm()` sequence to prevent the two audio tracks from ever overlapping.
**Why:** The user noticed some audio was not playing or stopping correctly. This ensures the warning audio strictly respects the bounds of the "urgent" timer phase.

## [23:30] — Rebrand Airport to Location & Audio Synchronization
**What was done:** 
1. Replaced all occurrences of "AIRPORT" labels with "LOCATION" across the UI (`SetupScreen.tsx`, default fallbacks to `UNKNOWN LOCATION`, prompt updated to identify cities/locations/airports).
2. Hardened audio phase lifecycle logic in `page.tsx`:
   - Timer low (`urgent` phase, < 5m or < 10s demo): Plays `warning.mp3`.
   - Timer ends (`alarm` phase, <= 0s): Immediately terminates warning track and triggers the continuous `Alarm.mp3` and screen latch.
   - Timer ok (`headsup` / `free` phases or timer extended via `+1 MIN`): Automatically stops `warning.mp3` and resets trigger latch refs so audio can re-fire when the threshold is reached again.
   - Leaving quest screen immediately cuts warning audio.

## [23:41] — Fallback Location: TinkerSpace Calicut
**What was done:** Set the default location fallback in both `SetupScreen.tsx` and the `/api/setup` route to `TINKERSPACE CALICUT` whenever geolocation is unavailable, denied, or during network errors.
**Why:** Tailored directly for the hackathon venue and demo environment.

## [23:50] — Vapor Countdown Integration for Timer
**What was done:** 
1. Added `countdown-vapor-digits.tsx` in `components/ui/` with zero external dependencies (pure Canvas 2D + curl-noise sublimation physics).
2. Connected `VaporCountdown` to `Countdown.tsx` preserving exact airport signage colors (`#F2A900` amber and `#C8201A` red), layout borders, and background tokens without modifying any other screens or elements.
3. Added the `--color-ns-muted` variable to Tailwind v4 `globals.css`.

## [23:55] — Vapor Countdown Animation Fix & Resizing
**What was done:**
1. Modified `Countdown.tsx` to accept the stable `returnByMs` timestamp instead of a constantly updating `msLeft` delta.
2. Increased the font size of the timer digits significantly (`clamp(4rem, 15vw, 6rem)`) inside `countdown-vapor-digits.tsx`.
3. Added the "HOURS", "MINUTES", "SECONDS" labels back below the timer digits (by removing `labels={null}`) and increased the text size of the "RETURN TO GATE IN" label.
**Why:** 
- The `msLeft` prop was causing the absolute `targetDate` calculated in `Countdown` to jitter by a few milliseconds on every React render (due to discrepancies with `Date.now()`). This constantly changed the `targetKey` in `VaporCountdown`, forcing its internal animation loop to reset and sleep, which made the timer look static except for rare flickers. Now the stable key allows the sublimation animation to play beautifully every second.
- The user requested labels and larger font sizes to match the design aesthetic closely.

## [01:55] — APP FLOW Source of Truth Audit & First Screen Diagnosis
**What was investigated:**
- Investigated user report: "my first page is still setup page".
- Identified that `gate-next/src/app/page.tsx` forcibly mutated `restored.screen === 'auth'` to `'setup'` on line 265, existing localStorage held `{ screen: 'setup' }`, and active Supabase user sessions auto-skip `AuthScreen`.
- Audited code against APP FLOW requirements:
  1. **AUTH**: Refreshing on AUTH was converted to SETUP.
  2. **SAFE TRAVELS**: `NEW_LAYOVER` returned to `DEFAULT_STATE` (AUTH) instead of SETUP.
  3. **/PASSPORT**: Redirected unauthenticated users to `/` instead of displaying "SIGN IN TO USE PASSPORT".
  4. **SETUP**: Fallback location on geolocation failure showed `UNKNOWN LOCATION` instead of `TINKERSPACE CALICUT`.

## [02:05] — Full Codebase Audit & Production Hardening
**Fixes Applied:**
1. **AUTH Flow & Cache Isolation**: Versioned storage key from `gate.v2` to `gate.v3` in `lib/storage.ts`. Prevented initial saving of blank `auth` or empty `setup` state. On mount, unauthenticated visits with no active layover stay strictly on `AUTH`. Active layovers (`quest`, `alarm`, `safe`) restore properly.
2. **Case Sensitivity**: Fixed `/Alarm.mp3` vs `alarm.mp3` casing mismatch in `lib/alarm.ts` to prevent 404s on Linux Vercel deployments.
3. **Dev Overlay Security**: Hidden `DebugOverlay` in production unless `process.env.NODE_ENV !== 'production'` or `?dev=1` query param is present.
4. **Server Route Robustness & Fallback**: Added 3-second `AbortSignal.timeout(3000)` to both Nominatim and Gemini fetches in `api/setup/route.ts`. Ensured reliable fallback to `TINKERSPACE CALICUT`. Removed obsolete `/api/init` route and updated env docs from `GROQ_API_KEY` to `GEMINI_API_KEY`.
5. **Database RLS & Schema**: Added `with check` to RLS update policies in `0001_init.sql`, and mapped frontend `completed` status to `done` in `lib/sync.ts`.
6. **Mobile Performance**: Added visibility listener to `countdown-vapor-digits.tsx` to sleep rAF loop when document is hidden.
7. **Clean Build**: Verified `npm run build` succeeds with zero errors or warnings.

## [02:10] — GlobalMuteButton Theme-Matched Airport Signage Icon
**What was done:**
- Replaced text labels (`MUTE` / `ON`) in [GlobalMuteButton.tsx](file:///Users/sinanm/Documents/TinkerHub/LayoverHackathon/gate-next/src/components/GlobalMuteButton.tsx) with custom, geometric SVG airport signage sound icons.
- **Sound ON**: Geometric speaker cone (`M3 7H7L12 3V17L7 13H3V7Z`) with dual concentric crisp broadcast sound waves (`#E6E1D3` paper).
- **Sound MUTED**: Geometric speaker cone with a square-capped diagonal "X" cancellation mark (`#8C887C` muted on `#181816` panel background).
- Zero changes to component state, volume/mute toggle logic, or global audio behavior.
- Added accessible `aria-label` and `title` attributes.

## [02:30] — Trips Management & Sample Data Purge
**What was done:**
1. **Sample Data Removed**: Purged all fake, sample, or seeded departure board rows and tokens (`SAMPLE`, `B14`, `C07`, `A02`) from the codebase, UI, and components.
2. **Auth Screen**: Redesigned to signage minimalism: live clock and sound toggle top bar, centered GATE wordmark and tagline, pinned Google and Guest buttons, and high-visibility 16px footnote: "Guests can run layovers. Sign in to save trips and your Passport."
3. **Database Migration `0002_trips.sql`**: Created trips table with client-generated UUID primary key, 50-trip limit trigger, updated_at trigger, full RLS CRUD isolation, plus `trip_id` and `trip_name` in `layovers` with cross-user injection security check.
4. **`/trips` Route**: Implemented departure-board table matching airport signage standards. Shows upcoming trips sorted ascending (DEPARTS / TRIP / STATUS), dimmed past trips toggle, USE / EDIT / DELETE actions with airport-styled confirmation popup, and full-screen ADD/EDIT form with device timezone notification and validation.
5. **Offline & Caching**: Added localStorage caching (`gate.trips.v1.{userId}`) with offline read banner "OFFLINE, SHOWING SAVED TRIPS" and clear write error messaging. Cache cleared on sign-out.
6. **Setup Screen Integration**: Added square 48px TRIP dropdown for signed-in users with upcoming trips. Auto-preselects nearest flight within 24h. Auto-fills departure, gate, walk min. Fields remain editable without modifying saved trip. "TRIPS UNAVAILABLE" graceful fallback when unmigrated.
7. **Alarm Path Isolation**: Confirmed trips data never touches the alarm audio or countdown loop.

## [03:13] — Draggable Floating DEV Widget
**What was done:**
- Updated [DebugOverlay.tsx](file:///Users/sinanm/Documents/TinkerHub/LayoverHackathon/gate-next/src/components/DebugOverlay.tsx) to make the DEV button freely movable/draggable anywhere on screen across mouse and mobile touch pointers.
- Added pointer capture API (`setPointerCapture`) with viewport boundary clamping (`Math.max(8, Math.min(newPos, maxPos))`).
- Distinguishes click/tap from drag (movement threshold > 4px prevents accidental menu toggle on drag).
- Popover menu dynamically positions relative to button location (flips above/below, aligns left/right to prevent off-screen overflow).
- Uses `touch-action: none` and `cursor: grab / grabbing` with airport signage styling intact (square 48px target, 2px radius, `#F2A900` amber).

## [03:16] — Final Report Audio Feedback (Camera Shutter)
**What was done:**
- Integrated `/camerashutter.mp3` in [SafeTravels.tsx](file:///Users/sinanm/Documents/TinkerHub/LayoverHackathon/gate-next/src/components/SafeTravels.tsx) to play once upon mounting when printing the final report (survived time, missions completed, XP, and rank).
- Wrapped with a dedicated single-play ref (`shutterPlayedRef`) to prevent duplicate triggering.
- Completely isolated from `alarm.ts` and core math, maintaining strict alarm path independence.



---

## Architecture Decisions Log

> Record every significant "why did we do it this way?" decision.

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| No router (plain screen state in `useReducer`) | Fewer deps, faster setup, no hash-routing edge cases for a hackathon | No browser back button support; deep-linking is impossible |
| Epoch ms everywhere in state, never `Date` objects | `Date` is not JSON-serializable; localStorage would corrupt timer on refresh | Must always format for display with `fmt()` utility |
| `<audio>` element as primary alarm, WebAudio oscillator as fallback | iOS silent switch can mute WebAudio; `<audio>` respects the ringer | `alarm.mp3` must be included in `public/` — don't forget the file |
| Tailwind v4 with `@theme` in CSS, no config file | v4 changed the config API; using v3-style config with the v4 Vite plugin silently ignores custom tokens | Less documentation online for v4 patterns yet |
| Deploy to Vercel at hour 1.5 (not end of night) | Wake Lock and audio need HTTPS; late discovery kills demo reliability | Adds deploy friction early, but saves pain later |
| Stats drain on real time intervals, not on mission events only | Makes the game feel alive; creates urgency that missions need to address | Drain rates are magic numbers that need tuning |
| Trips require authentication (Google sign-in) | Multi-tenant trips must be securely tied to a user across sessions/devices; guest mode is single-session and local only | Guests cannot save trips table entries |
| No offline write queue for trips | Silently queueing departures risks silent failure or stale data at the airport; failing fast with a visible error line ensures reliability | User must have network to create or edit trips |
| Device time zone for trip departures | Date/time pickers operate in device local time; avoiding complex IANA timezone lookups keeps time math simple and robust | Users must enter departure time matching their device clock |

---

## Pre-Judging Checklist

Run this at **6:45 AM**, 15 minutes before judges start.

### Demo phone
- [ ] Deployed HTTPS URL opens correctly
- [ ] Volume: maximum
- [ ] Silent switch / Do Not Disturb: OFF
- [ ] Auto-lock: Never (or longest available)
- [ ] Power bank plugged in
- [ ] Demo Mode triggered: triple-tap wordmark → "DEMO" chip appears
- [ ] Gate pre-filled: **A12**, Walk: **2 min**, Vibe: **Tired**
- [ ] **Do NOT press START** until the pitch begins

### Alarm verification (do 3 times)
- [ ] Run 1: START → alarm fires at 60s with sound ✅/❌
- [ ] Run 2: START → alarm fires at 60s with sound ✅/❌
- [ ] Run 3: START → alarm fires at 60s with sound ✅/❌

### Backup
- [ ] Same flow open on laptop browser
- [ ] Screen recording of full demo flow saved to phone camera roll
- [ ] QR code printed or on second phone

### Booth setup
- [ ] Phone propped and visible
- [ ] Laptop open to repo/README (not code editor)
- [ ] `npm run preview` or Vercel URL confirmed working

