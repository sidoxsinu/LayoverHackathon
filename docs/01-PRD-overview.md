# GATE — Overview (v2)
**Hackathon:** LAYOVER @ TinkerSpace Calicut · **Date:** Oct 10, 2026 · **Version:** 2.0

## Pitch
> GATE turns the most wasted time in travel into a quest you want to play, and guarantees you never miss your flight.

## Problem
A layover is too short to leave the airport, too long to sit through, and too stressful to relax in. People sit at the gate for hours, tired and hungry, afraid to move or sleep.

## Solution
1. **Setup (10 s):** departure, gate, walk time.
2. **Quest:** missions sized to the time you actually have; stats that drain and need restoring.
3. **Escalating alerts → GATE ALARM:** the app gets louder as your return time approaches, then takes over the screen.
4. **Layover Passport:** a shareable end card (time survived, missions, XP).

## Product principles
1. Safety first: the alarm path has zero dependencies (no network, no AI).
2. Five-second comprehension for a tired traveler.
3. Mobile-first, portrait, one-handed.
4. Everything in scope must be buildable and tested by 3 AM.

## Audit of v1: what was wrong and what v2 changes
| # | Issue in v1 | Impact | v2 fix |
|---|---|---|---|
| 1 | Demo set departure = now+3 min with 30 min buffer + walk, so the deadline was **already in the past** | Alarm fires instantly, demo breaks | **Demo Mode**: returnBy = now + 60 s, departure derived |
| 2 | Demo said "lock your phone face-down" | Browsers throttle timers, block audio and suspend tabs when locked; alarm would not fire | Screen Wake Lock, keep-screen-on notice, timestamp-based clock, phone stays unlocked in demo |
| 3 | Audio created at alarm time | Autoplay policy blocks it; iOS silent switch can mute Web Audio | Audio **armed on the START tap**; `<audio>` file primary, oscillator fallback, vibration as backup |
| 4 | Alarm text "departs in 28 min" while math gave 32+ | Inconsistent copy | Text computed from real timestamps |
| 5 | Stats were manual/visual only | Felt fake | Stats **drain with real time**; mission engine targets the lowest stat |
| 6 | Missions chosen by time pool only | Could suggest a 45-min meal with 20 min left | **Fit rule**: mission must fit remaining time |
| 7 | Single alarm, no warning | Less drama, less safety | **Alert ladder** (15 min, 5 min, 0) |
| 8 | Tailwind v3 `tailwind.config.js` with the v4 Vite plugin | Config silently ignored, custom colors missing | Tailwind v4 `@theme` in CSS |
| 9 | `VITE_GEMINI_API_KEY` in client bundle | Key leaks publicly; extra latency on critical path | AI is P2, behind a serverless proxy, pre-generated at START with timeout |
| 10 | `Date` objects in state/localStorage | Not serializable; refresh breaks timer | Store epoch ms |
| 11 | HH:MM only, no midnight/timezone handling | Wrong after midnight or across timezones | Roll to next occurrence; "in X h Y m" input mode |
| 12 | `localhost` phone testing, deploy at hour 9 | Wake Lock, audio and vibration need HTTPS; late discovery | **Deploy by hour 2**, test on real phone |
| 13 | Heavy deps (framer-motion, lucide, AI SDK) | More failure points | CSS transitions, emoji icons |
| 14 | Score target 47–50 | Overconfident | Realistic 42–47, driven by demo and reliability |

## Judging fit
| Criterion | Max | How GATE earns it |
|---|---|---|
| What was built | 20 | Real clock, fit-aware mission engine, draining stats, alert ladder, alarm, passport |
| Creativity | 10 | Layover as a survival game with a hard safety backbone |
| Travel connection | 10 | Directly solves the layover problem |
| Execution | 5 | Dark, mobile-first, reliable, deployed on a public URL |
| Demo | 5 | Alarm fires live in the judge's face |
