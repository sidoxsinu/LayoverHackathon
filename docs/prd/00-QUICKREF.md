# GATE — Quick Reference (v2)
**Never miss your connection. Don't waste it either.**

## What it is
A layover companion: enter your flight → get time-fitted survival missions → an escalating alert ladder ends in an unmissable GATE ALARM → "Safe travels" + shareable Layover Passport card.

## Screens & Routes
- **Screens (in `/` SPA flow)**:
  1. **Auth** — live clock, sound toggle, wordmark, guest start or sign-in
  2. **Setup** — departure, gate, walk time, vibe, trip selector (signed-in) → START
  3. **Quest** — countdown, 3 draining stats, active mission card, photo proof flow (camera + upload)
  4. **Alarm** — full-red takeover, sound, vibration, gate number
  5. **Safe Travels** — Layover Passport card, return to gate, photo proof gallery
- **Dedicated Routes**:
  - `/passport` — saved layover history & photo proofs (signed-in only)
  - `/passport/print` — printable A4/Letter completion passport certificate & stats
  - `/trips` — departure board table of upcoming trips, add/edit/delete (signed-in only)
  - `/leaderboard` — opt-in global & venue departure board with anti-farming protection
- **Guest Statement**: Guests can run layovers. Sign in to save trips, cloud photo proofs, and your Passport.

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
Next.js (App Router, React + Node integrated) + Tailwind v4 (`@tailwindcss/vite`, theme in `globals.css` via `@theme`). No router, no state library, no UI kits, no animation library.

## Priorities
P0 clock + alarm → P0 deploy to HTTPS + test on a real phone → P0 quest → P0 Demo Mode → P1 alert ladder, passport, trips → P2 AI missions.

## Demo (60 s alarm)
Triple-tap the GATE wordmark = **Demo Mode** (returnBy = now + 60 s). Tap START as you begin your pitch. Alarm lands at ~1:20.

## Colors & Fonts
- `ink #101010` · `panel #181816` · `line #34322C` · `paper #E6E1D3` · `amber #F2A900` · `signal green #3F9B5B` · `alarm red #C8201A` · `muted text #8C887C`
- Fonts: `Barlow Condensed` (headings, labels, countdown) and `IBM Plex Mono` (numbers, times, gate).

## Files
| # | File | Use |
|---|---|---|
| 01 | Overview | Pitch, problem, what changed in v2 |
| 02 | Features | Scope, P0/P1/P2, acceptance criteria |
| 03 | Technical | Setup, structure, copy-paste code |
| 04 | UX Design | Tokens, screens, micro-interactions |
| 05 | Demo Script | 2-min pitch, booth, Q&A, fallbacks |
| 06 | Build Plan | Timed plan, cut lines, kickoff prompt |

