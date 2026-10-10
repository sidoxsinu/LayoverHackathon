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
| `alarm.ts` (audio arm + fire) | ✅ Done | WAV primary, oscillator fallback, vibration, wake lock |
| Setup screen UI | ✅ Done | Time/duration toggle, gate, walk, vibe, live safe-time preview |
| Demo Mode (triple-tap) | ✅ Done | Triple-tap wordmark or START DEMO; 60s countdown |
| Vercel deploy + HTTPS | ⬜ Not started | Next step |
| Quest screen (countdown) | ✅ Done | RETURN TO GATE IN strip, amber mono digits |
| Stat bars (drain loop) | ✅ Done | 10-block segmented, 30s drain interval, blink <25 |
| Mission card + engine | ✅ Done | pickMission, paper card, COMPLETE flash, SKIP |
| Alert ladder (3 stages) | ✅ Done | Heads-up banner (15min/20s demo), urgent red banner (5min/10s demo), alarm screen |
| Persistence (localStorage) | ✅ Done | Save on state change, restore on mount, straight-to-alarm if returnBy passed |
| Safe Travels screen | ✅ Done | Rotated stamp, survived time, missions, XP, rank |
| Layover Passport card | ⬜ Not started | P1 — rank shown in Safe Travels as text |
| Mission log (collapsible) | ✅ Done | Collapsible DONE/SKIP list with XP per entry |
| Battery API hook | ✅ Done | useBattery.ts — null on iOS/Firefox, manual stat fallback |
| AI missions (Gemini proxy) | ⬜ Not started | P2 — skipped per instructions |

**Status legend:** ⬜ Not started · 🔄 In progress · ✅ Done · ⚠️ Done with caveats · ❌ Broken

---

## Known Issues & Drawbacks

> Update this section as you discover problems. Be honest — these help during Q&A prep.

- **alarm.wav is a generated 880Hz beep** — functional but not a polished alarm sound. Replace with a proper MP3 before judging if possible.
- **useNow returns 0 on initial server render** — harmless (client hydration is instant), but means stats calculations use 0 briefly on hydration.
- **MissionCard generates a random M-XX code on each render** — should be stored in mission state to be stable. Cosmetic only.

---

## Hardcoded Values & Demo Hacks

> These are intentional shortcuts taken for the hackathon build. Document them so you can explain them confidently to judges if asked.

| Location | What's hardcoded / hacked | Why | Should be fixed later? |
|----------|--------------------------|-----|------------------------|
| `lib/time.ts` `demoSchedule()` | `returnByMs = now + 60_000` (60-second alarm) | Demo Mode needs a predictable, short alarm window for the pitch | Yes — real usage reads from departure input |
| `lib/missions.ts` | All 10 missions are static strings | No time to build a full mission CMS overnight | Yes — AI-generated missions are P2 |
| `lib/alarm.ts` `arm()` | Audio is pre-played and paused on START to bypass autoplay policy | iOS/Android block audio that doesn't originate from a user gesture | No — this is the correct production pattern |
| Setup screen | "in X h Y m" mode is a toggle, not auto-detected from locale/timezone | Timezone detection adds complexity | Yes |
| Stat drain | Drain rates are magic numbers tuned for a 4-hour demo | Not validated against real user feel | Yes |
| Battery stat | Falls back to a hardcoded `70%` start if `navigator.getBattery()` is unsupported (iOS, Firefox) | Battery API is Chromium-only | No — fallback is acceptable behavior |
| Alert ladder thresholds | Demo Mode compresses thresholds to `20s / 10s`; real mode uses `15min / 5min` | Required for the 60-second demo window | No — intentional dual-mode |
| `public/alarm.wav` | Programmatically generated 880Hz beep | No licensed alarm sound available | Yes — replace with a proper sound |
| `components/MissionCard.tsx` | Random M-XX mission number generated on render | Cosmetic; mission ID not stored in state | Yes — store mission number |
| `components/SafeTravels.tsx` | Rank thresholds (50/150/300/500 XP) | Quick mapping; not playtested | Yes |

---

## Error Log

> Record every bug found and whether it was fixed. Include the symptom, cause, fix.

| # | Symptom | Cause | Fix | Fixed? |
|---|---------|-------|-----|--------|
| 1 | Next.js build error: `Expected 1 arguments, but got 0` for `useRef` | TypeScript strict mode requires explicit `undefined` for `useRef` without initial value | Changed to `useRef<T | undefined>(undefined)` | Yes |
| 2 | Next.js build error: `unstable Date.now() in Client Component` | `useState(Date.now())` called during prerender | Changed to `useState(0)` with `setNow(Date.now())` in useEffect | Yes |
| 3 | Viewport metadata warning | Next.js 16 moved `viewport` out of `metadata` export | Added separate `export const viewport = {...}` | Yes |

---

## Build Log

> Add one entry per completed milestone. Include timestamp and what works/doesn't.

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
- [ ] Gate pre-filled: **B14**, Walk: **2 min**, Vibe: **Tired**
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
