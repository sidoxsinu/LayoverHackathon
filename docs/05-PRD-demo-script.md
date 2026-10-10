# GATE — Demo Script (v2)

> Judges are tired. Do not explain the app. Make them feel the problem, then feel the alarm.

## Pre-demo setup (5 min before)
1. Open the **deployed HTTPS URL** on the phone (not localhost). Volume max, silent switch off, Do Not Disturb off.
2. Ensure the demo account has 2 or 3 real trips added by hand in `/trips` (never seeded in code).
3. Set auto-lock to Never / longest. Plug in power bank.
4. Triple-tap the wordmark: **DEMO** chip appears. Pre-fill gate **A12**, walk **2 min**, vibe **Tired**.
5. **Do not press START yet.** Press it when you begin the pitch (alarm fires 60 s later).
6. Backup: same flow open on a laptop; a 30 s screen recording of the full demo on the phone.

> Never lock the phone: browsers suspend tabs, and Wake Lock keeps the screen on only while the tab is visible.

## 2-minute pitch
**[0:00–0:20] Hook** (phone in hand, facing you)
> "You land in Dubai. Your connection is in six hours. You are exhausted, but terrified of dozing off and missing your flight. So you sit at the gate for six hours, doing nothing. Every traveler has lived this."

**[0:20–0:35] Setup & Trips** (show Setup with upcoming trip selected)
> "Plan it ahead, GATE picks it up when you land."

*(Optional 10-second beat: open /trips showing departure-board table, tap USE to populate Setup instantly).*
> "Setup takes seconds: select your saved trip or enter flight time. GATE calculates the last safe moment to wander."
*(Tap START)*

**[0:35–1:05] Quest** (show countdown, stats, mission)
> "This countdown tracks the last safe moment you can wander freely. While it runs, GATE gives you survival missions sized to your remaining time. Hungry? It suggests food. Twenty minutes left? It never suggests a sit-down meal. Finish a mission and your survival stats recover."

*(Optional 10-second photo proof beat: Tap COMPLETE, take/upload a quick photo or preview, tap USE PHOTO (+20 XP).)*
> "Missions ask for photo proof. Snap your coffee or the gate sign to earn bonus XP."

*Tap Complete. Let the stat bar update.*
> "Hunger restored."

**[1:05–1:20] Ladder** (banner and chime appear around here; Demo thresholds 20 s / 10 s)
> "As time runs out, it escalates: first a heads-up nudge, then an urgent warning:"

**[1:20–1:45] Alarm** (go silent when the screen turns red. Count three. Let the room react.)
> "And then it takes over. No snooze. One button."

*Tap I'M AT THE GATE. Show Safe Travels, photo thumbnails, and the Passport card.*

**[1:45–2:00] Close**
> "GATE makes your layover structured, purposeful, and impossible to mess up. Built tonight, running live on a public URL. Scan the QR to try it."

## Booth version (90 s walk-up)
- Press START at the moment a judge approaches; lead with the problem.
- One-liner: *"A video game for your layover, where the game ends when your flight boards."*
- QR code to the live URL, phone propped up, laptop showing the repo.
- Do not apologize; do not recite the stack.

## Q&A
| Question | Answer |
|---|---|
| Why not just a phone alarm? | "A standard alarm is just a deadline. GATE structures the hours before it with missions sized to your available time, and warns you in progressive stages." |
| Does it work if I lock my phone? | "Web apps cannot ring from a locked screen, so GATE keeps the screen awake and escalates visually, with sound and vibration. A native build with notifications is the next step." |
| How does photo proof work? | "Proof is captured and stored; automatic checking is a pluggable step, currently a placeholder. EXIF and location data are stripped client-side on canvas, and images are stored with strict user-isolated RLS." |
| What if AI or network fails? | "The alarm path has zero network or AI dependency; missions, offline photos, and cached departures fall back seamlessly to local storage." |
| What was hard? | "Reliability: time math across midnight, timestamp-based clocks so throttled tabs do not drift, and unlocking audio on the first tap." |
| Business model? | Only if asked: airline or airport app partnership, lounge tie-ins. |

## Risk table
| Risk | Mitigation |
|---|---|
| Alarm does not fire | Demo Mode rehearsed 3x; hidden "Fire alarm now" via long-press on gate label |
| No sound | Volume check; oscillator fallback; speaker next to phone if needed |
| Phone sleeps | Wake Lock + auto-lock off |
| App crashes | State restores from localStorage; laptop backup; screen recording |
| Judge interrupts | Keep talking about missions; the alarm will land |
| Wi-Fi down | Fully offline after first load (no network calls) |
