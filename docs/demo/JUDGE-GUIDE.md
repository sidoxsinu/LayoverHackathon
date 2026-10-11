# GATE — Judge's Quick Evaluation Guide

**Hackathon:** LAYOVER @ TinkerSpace Calicut · Oct 10–11, 2026

---

## 1. Judging Rubric Alignment (50 Marks Total)

| Rubric Criterion | Marks | What Was Built & Demonstrated | Where to Inspect in Repository |
|---|---|---|---|
| **What Was Built** | **20** | Full Next.js 16 App Router application: 5 primary screens (Auth, Setup, Quest, Alarm, Safe Travels), 2 dedicated routes (`/passport`, `/passport/print`), full upcoming departures CRUD (`/trips`), Row Level Security with Postgres, 10-tier rank progression, spotlight onboarding tour, and automated photo canvas compression. | `gate-next/src/app/`, `gate-next/src/components/`, `gate-next/supabase/migrations/` |
| **Creativity & Idea** | **10** | Reimagining the anxious purgatory of transit waiting time as a retro departure-board survival quest. Draining stats (battery, hunger, energy) restored exclusively through physical real-world micro-missions. Physical paper passport certificates and authentic luggage tag aesthetics. | `gate-next/src/components/QuestScreen.tsx`, `gate-next/src/app/passport/print/page.tsx` |
| **Travel Connection** | **10** | **Travel is genuinely core to the system, not an accessory.** Built specifically around the transit waiting envelope: departure time minus walk time minus 30-minute safe buffer. Adapts dynamically to 4 transit modalities (`FLIGHT`, `TRAIN`, `BUS`, `OTHER`) with building-level geocoding. | `gate-next/src/lib/time.ts`, `gate-next/src/lib/labels.ts`, `docs/prd/02-PRD-features.md` |
| **Execution** | **5** | Pixel-perfect airport signage design system: Barlow Condensed + IBM Plex Mono, 0 emojis, 0 gradients, 0 blur, 0 shadows. Epoch-millisecond timestamp math immune to throttled background tabs. 61 automated Playwright tests pass 100%. | `gate-next/src/app/globals.css`, `gate-next/tests/`, `docs/logs/TEST-LOG.md` |
| **Demo & Experience** | **5** | Instant 60-second Demo Mode (triple-tap GATE wordmark). High-volume audio escalation with WebAudio dual-oscillator fallback, hardware vibration, and screen wake lock. Bulletproof `# ENV` offline degradation. | `gate-next/src/lib/alarm.ts`, `docs/demo/05-PRD-demo-script.md` |

---

## 2. Why Travel Connection is Core to the Build

GATE is not a generic to-do list with an airport skin. Every single system is derived directly from the physical realities of travel:
1. **The Transit Envelope**: When waiting at an airport gate, train platform, or bus bay, you cannot leave the secure concourse, but you cannot sit frozen in fear for 4 hours. GATE computes the exact boundary of wander freedom: $\text{safeMinutes} = \text{departure} - (\text{walk} + 30\text{m buffer}) - \text{now}$.
2. **Contextual Side-Quests**: Missions never suggest a 60-minute sit-down meal when you have 15 minutes left. They dynamically suggest refilling water bottles, spotting departure board gates, locating AC power pillars, or finding quiet seating.
3. **The Multi-Modal Transit Engine**: Seamlessly transitions vocabulary across international airports (`GATE`, `FLIGHT`), railway networks (`PLATFORM`, `TRAIN`), interstate bus terminals (`BUS STOP OR BAY`, `BUS`), and travel meetups (`MEETING POINT`, `EVENT`).

---

## 3. How to Test the App in 60 Seconds

1. Open **[https://gate-next-cyan.vercel.app](https://gate-next-cyan.vercel.app)** on a mobile phone (or desktop at 390px).
2. Tap **CONTINUE AS GUEST**.
3. **Triple-tap the wordmark "GATE"**: An amber `[DEMO]` badge appears.
4. Tap **START LAYOVER**:
   - Audio context unlocks immediately.
   - 60-second countdown begins with live stats drain.
   - At 20 seconds remaining: Top amber heads-up banner appears (`START WRAPPING UP`).
   - At 10 seconds remaining: Urgent warning triggers with audio alert and vibration (`WALK TO GATE NOW`).
   - At 0 seconds remaining: Full-screen red alarm takeover latches with maximum volume.
5. Tap **"I AM AT THE GATE"**: View the Safe Travels completion card with stamped level rank and print options.
