# GATE — Quick Reference (v2)
**Never miss your connection. Don't waste it either.**

## What it is
A layover companion: enter your flight → get time-fitted survival missions → an escalating alert ladder ends in an unmissable GATE ALARM → "Safe travels" + shareable Layover Passport card.

## 4 screens
1. **Setup** — departure (time *or* "in X h"), gate, walk time, vibe → START
2. **Quest** — countdown, 3 draining stats, one mission card
3. **Alarm** — full-red takeover, sound, vibration, gate number
4. **Safe Travels** — Layover Passport card (screenshot-able)

## Core math (all in epoch ms, never Date objects in state)
```
returnBy = departure − (30 boarding + walkMin + 5 margin)
safeTime = returnBy − now
```

## Alert ladder
| Time to returnBy | Behaviour |
|---|---|
| > 15 min | Normal quest mode |
| ≤ 15 min | Heads-up banner + soft chime |
| ≤ 5 min | Orange screen, vibration, "Start walking" |
| ≤ 0 | Full alarm: red, loud, vibrating, one button |

## Mission rule
Mission shown only if `mission.mins ≤ minsLeft − 5`, and it targets your **lowest stat**.

## Stack
Next.js (React + Node integrated) + Tailwind v4. **No** framer-motion, no extra UI kits, no animation library.

## Priorities
P0 clock + alarm → P0 deploy to HTTPS + test on a real phone → P0 quest → P0 Demo Mode → P1 ladder, passport → P2 AI.

## Demo (60 s alarm)
Triple-tap the GATE wordmark = **Demo Mode** (returnBy = now + 60 s). Tap START as you begin your pitch. Alarm lands at ~1:20.

## Colors
`bg #0A0A0F` · `surface #13131F` · `safe #22C55E` · `caution #EAB308` · `warning #F97316` · `danger #EF4444` · `alarm #DC2626 ↔ #7F1D1D`

## Files
| # | File | Use |
|---|---|---|
| 01 | Overview | Pitch, problem, what changed in v2 |
| 02 | Features | Scope, P0/P1/P2, acceptance criteria |
| 03 | Technical | Setup, structure, copy-paste code |
| 04 | UX Design | Tokens, screens, micro-interactions |
| 05 | Demo Script | 2-min pitch, booth, Q&A, fallbacks |
| 06 | Build Plan | Timed plan, cut lines, kickoff prompt |
