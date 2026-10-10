# GATE — Build Plan (v2)
**Window:** Oct 10, 6 PM → Oct 11, 6 AM · Judging 7 AM
**Rule:** the demo path first, polish second, AI last. **Feature freeze 2 AM. No code after 4 AM.**

## Team split (2 people; solo: do blocks in order)
- **Dev A:** time/clock, alarm, persistence, deploy
- **Dev B:** UI, missions, stats, passport, copy

## Timeline
| Time | Goal | Tasks | Checkpoint |
|---|---|---|---|
| 6:00–6:30 | Scaffold | Next.js + Tailwind v4 `@theme`, fonts, folder structure, `alarm.mp3` in `public/` | Dark page renders |
| 6:30–7:30 | **Clock + alarm** | `time.js`, `useNow`, `alarm.js`, `GateAlarm`, Demo Mode, START arms audio | Press START → alarm in 60 s with sound |
| 7:30–8:00 | **Deploy to Vercel** | `npx vercel --prod`, open on a real phone | Alarm + Wake Lock verified on HTTPS |
| 8:00–9:30 | Quest | `Countdown`, `StatBar`, drain loop, `missions.js` + `pickMission`, `MissionCard` complete/skip | Full loop works, missions fit time |
| 9:30–10:30 | Setup screen | Inputs, duration mode, live safe-time preview, validation, vibe seeding | Impossible inputs blocked |
| 10:30–11:30 | Alert ladder + persistence | Heads-up/urgent stages, localStorage restore, alarm latch | Refresh and background tests pass |
| 11:30–12:30 | Safe Travels + Passport | End card, ranks, reset | Screenshot-worthy card |
| 12:30–1:30 | Polish | Micro-interactions, mission log, mobile layout, battery hook | Feels like a product |
| 1:30–2:00 | Stretch (pick one) | Vibration tuning / AI proxy / PWA manifest | Optional |
| **2:00** | **FREEZE** | Redeploy, tag the commit | Production URL final |
| 2:00–3:00 | Bug hunt | Edge-case checklist (03), 3 full Demo Mode runs on the phone | Zero known bugs |
| 3:00–4:00 | Ship materials | README (what/run/screenshots), QR code, booth sign, backup recording | Booth kit ready |
| 4:00–6:00 | Rest | Sleep. Run the script once out loud on waking. | Charged phone, power bank |

## Cut lines
| Behind at | Cut |
|---|---|
| 11:30 PM | Passport, mission log, AI |
| 1:00 AM | Battery API (manual stat), micro-interactions |
| Always keep | Clock, alarm, Demo Mode, missions, stats |

## Stretch menu (choose one, 30–45 min)
| Option | Impact |
|---|---|
| Gemini proxy missions with ✨ badge | Tech depth |
| PWA manifest + add-to-home-screen | Feels native |
| Mission mini-timers | Richer quest |
| Airport flavor text (DXB/DOH/SIN) | Travel tie-in; verify facts |

## Definition of Done
- [ ] Public HTTPS URL + QR code
- [ ] Demo Mode alarm fires at 60 s on the demo phone, three times in a row
- [ ] Works offline after first load
- [ ] Passport card looks good in a screenshot
- [ ] README with screenshots

## Kickoff prompt for an AI coding agent
> Build "GATE", a mobile-first Next.js + Tailwind v4 web app. Follow `docs/03-PRD-technical.md` exactly: epoch-ms time model, `useNow`, `alarm.js`, `pickMission`, localStorage persistence. Screens: Setup, Quest, Alarm, Safe Travels. Implement Demo Mode (triple-tap wordmark → returnBy = now + 60 s). Start with P0 items from `docs/02-PRD-features.md`, commit after each checkpoint, and ask before adding dependencies.

## Emergency scenarios
| Situation | Action |
|---|---|
| Audio fails on the demo phone | Use another phone/laptop for sound, or tap-to-alarm fallback |
| Gemini flaky | Delete AI code; hardcoded missions are enough |
| App crashes live | Reopen; state restores; keep composure |
| Judges arrive early | Press START when they arrive; the 60 s alarm clock begins |

## Realistic scoring
| Criterion | Max | Target |
|---|---|---|
| What was built | 20 | 16–19 |
| Creativity | 10 | 8–9 |
| Travel connection | 10 | 9–10 |
| Execution | 5 | 4 |
| Demo | 5 | 4–5 |
| **Total** | **50** | **41–47** |
