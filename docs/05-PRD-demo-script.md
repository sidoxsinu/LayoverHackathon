# GATE — Demo Script (v2)

> Judges are tired. Don't explain the app. Make them feel the problem, then feel the alarm.

## Pre-demo setup (5 min before)
1. Open the **deployed HTTPS URL** on the phone (not localhost). Volume max, silent switch off, Do Not Disturb off.
2. Set auto-lock to Never / longest. Plug in power bank.
3. Triple-tap the wordmark → **Demo Mode** chip appears. Pre-fill gate **B14**, walk **2 min**, vibe **Tired**.
4. **Do not press START yet.** Press it when you begin the pitch (alarm fires 60 s later).
5. Backup: same flow open on a laptop; a 30 s screen recording of the full demo on the phone.

> Never lock the phone: browsers suspend tabs, and Wake Lock keeps the screen on only while the tab is visible.

## 2-minute pitch
**[0:00–0:20] Hook** (phone in hand, facing you)
> "You land in Dubai. Your connection is in six hours. You're exhausted, but terrified of dozing off and missing your flight. So you sit at the gate for six hours, doing nothing. Every traveler has lived this."

**[0:20–0:35] Setup** — tap START (setup already filled)
> "Setup is ten seconds: flight time, gate, walk time. GATE calculates the last safe moment to be away from your gate."

**[0:35–1:05] Quest** — show countdown, stats, mission
> "This countdown isn't to your flight, it's to the last moment you're free. While it runs, GATE gives you missions that fit the time you have left. Hungry? It sends you to eat. Twenty minutes left? It never suggests a meal. Finish a mission and your survival stats recover."

*Tap Complete. Let the stat bar animate.*
> "Hunger restored."

**[1:05–1:20] Ladder** — banner and chime appear around here (Demo thresholds 20 s / 10 s)
> "As time runs out, it escalates: first a nudge, then a warning —"

**[1:20–1:45] Alarm** — go silent when the screen turns red. Count three. Let the room react.
> "— and then it takes over. No snooze. One button."

*Tap I'M AT THE GATE. Show Safe Travels and the Passport card.*

**[1:45–2:00] Close**
> "GATE makes your layover structured, a little fun, and impossible to mess up. Built tonight, running live on a public URL. Scan the QR to try it."

## Booth version (90 s walk-up)
- Press START at the moment a judge approaches; lead with the problem.
- One-liner: *"A video game for your layover, where the game ends when your flight boards."*
- QR code to the live URL, phone propped up, laptop showing the repo.
- Don't show setup; don't apologize; don't recite the stack.

## Q&A
| Question | Answer |
|---|---|
| Why not just an alarm? | "An alarm gives a deadline. GATE fills the time before it with missions sized to your remaining time, and warns you in stages." |
| Does it work if I lock my phone? | "Web apps can't ring from a locked screen, so GATE keeps the screen awake and escalates visually, with sound and vibration. A native build with notifications is the next step." |
| What if AI/network fails? | "The alarm path has no network or AI dependency; missions are built in." |
| What was hard? | "Reliability: time math across midnight, timestamp-based clocks so throttled tabs don't drift, and unlocking audio on the first tap." |
| Business model? | Only if asked: airline or airport app partnership, lounge tie-ins. |

## Risk table
| Risk | Mitigation |
|---|---|
| Alarm doesn't fire | Demo Mode rehearsed 3×; hidden "Fire alarm now" via long-press on the gate label |
| No sound | Volume check; oscillator fallback; speaker next to phone if needed |
| Phone sleeps | Wake Lock + auto-lock off |
| App crashes | State restores from localStorage; laptop backup; screen recording |
| Judge interrupts | Keep talking about missions; the alarm will land |
| Wi-Fi down | Fully offline after first load (no network calls) |
