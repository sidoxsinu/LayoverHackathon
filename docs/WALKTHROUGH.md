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
| Project scaffold | ⬜ Not started | |
| Tailwind v4 + theme | ⬜ Not started | |
| `time.js` (core math) | ⬜ Not started | |
| `useNow` hook | ⬜ Not started | |
| `alarm.js` (audio arm + fire) | ⬜ Not started | |
| Setup screen UI | ⬜ Not started | |
| Demo Mode (triple-tap) | ⬜ Not started | |
| Vercel deploy + HTTPS | ⬜ Not started | |
| Quest screen (countdown) | ⬜ Not started | |
| Stat bars (drain loop) | ⬜ Not started | |
| Mission card + engine | ⬜ Not started | |
| Alert ladder (3 stages) | ⬜ Not started | |
| Persistence (localStorage) | ⬜ Not started | |
| Safe Travels screen | ⬜ Not started | |
| Layover Passport card | ⬜ Not started | |
| Mission log (collapsible) | ⬜ Not started | |
| Battery API hook | ⬜ Not started | |
| AI missions (Gemini proxy) | ⬜ Not started | |

**Status legend:** ⬜ Not started · 🔄 In progress · ✅ Done · ⚠️ Done with caveats · ❌ Broken

---

## Known Issues & Drawbacks

> Update this section as you discover problems. Be honest — these help during Q&A prep.

*(None yet — project not started)*

---

## Hardcoded Values & Demo Hacks

> These are intentional shortcuts taken for the hackathon build. Document them so you can explain them confidently to judges if asked.

| Location | What's hardcoded / hacked | Why | Should be fixed later? |
|----------|--------------------------|-----|------------------------|
| `lib/time.js` `demoSchedule()` | `returnByMs = now + 60_000` (60-second alarm) | Demo Mode needs a predictable, short alarm window for the pitch | Yes — real usage reads from departure input |
| `lib/missions.js` | All 10 missions are static strings | No time to build a full mission CMS overnight | Yes — AI-generated missions are P2 |
| `lib/alarm.js` `arm()` | Audio is pre-played and paused on START to bypass autoplay policy | iOS/Android block audio that doesn't originate from a user gesture | No — this is the correct production pattern |
| Setup screen | "in X h Y m" mode is a toggle, not auto-detected from locale/timezone | Timezone detection adds complexity | Yes |
| Stat drain | Drain rates are magic numbers (`hunger -0.3/min`, `sanity -0.4/min`) tuned for a 4-hour demo | Not validated against real user feel | Yes |
| Battery stat | Falls back to a hardcoded `70%` start if `navigator.getBattery()` is unsupported (iOS, Firefox) | Battery API is Chromium-only | No — fallback is acceptable behavior |
| Alert ladder thresholds | Demo Mode compresses thresholds to `20s / 10s`; real mode uses `15min / 5min` | Required for the 60-second demo window | No — intentional dual-mode |
| Passport ranks | XP → rank mapping is hardcoded: 0=Wanderer, 80=Survivor, 160=Gate Guardian, 240+=Layover Legend | Simple to implement without a DB | Yes — could be expanded |
| Gemini model name | `gemini-2.0-flash` (verify in AI Studio before using) | Model names change | Yes — move to env var |

---

## Error Log

> Record every bug found and whether it was fixed. Include the symptom, cause, and fix.

*(None yet)*

---

## Build Log

> Add one entry per completed milestone. Include timestamp and what works/doesn't.

---

### Entry template
```
## [HH:MM] — Milestone name
**What was done:** ...
**What works:** ...
**What doesn't yet:** ...
**Immediate next step:** ...
```

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

*(Entries will appear here as the build progresses)*

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
