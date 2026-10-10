# GATE — Features (v2)

## Scope: 4 screens, 5 systems
Setup · Quest · Alarm · Safe Travels / Clock · Missions · Stats · Alerts · Persistence

## Priority legend
**P0** demo-critical · **P1** polish that scores · **P2** only if everything else is done

---

## F1. Setup screen (P0)
| Field | Input | Notes |
|---|---|---|
| Departure | Time picker **or** "in X h Y m" toggle | Duration mode avoids timezone confusion. If picked time ≤ now, roll to tomorrow and show "Departs tomorrow 06:10" |
| Gate | Text, e.g. B14 | Optional "TBA" allowed |
| Walk to gate | 2 / 5 / 10 / 15 min | Default 10 |
| Vibe | Wired / Tired / Hungry | Seeds starting stats |
| Demo Mode | Triple-tap wordmark | returnBy = now + 60 s |

**Live preview:** "Safe time: 4h 22m" (red + warning if < 10 min or negative).
**START tap must:** arm audio, request Wake Lock, save state.
**Validation:** safe time ≤ 0 → block START, "You need to head to the gate now."

**Accept:** one-handed, ≤ 4 taps to start, rejects impossible inputs.

## F2. Quest screen (P0)

### Countdown
`RETURN TO GATE IN 03:42:17` in huge monospace amber digits in a "board" strip with a thin top and bottom rule. Digits change instantly (no easing). No depleting progress bar.

### Stats (real behavior)
| Stat | Start | Drain | Restored by |
|---|---|---|---|
| 🔋 Battery | Real device battery if API available, else 70 | real value, or −0.15/min | Charging missions (manual boost if no API) |
| 🍔 Hunger | 70 (Hungry vibe: 30) | −0.3/min | Food missions |
| 🧠 Sanity | 70 (Wired: 40, Tired: 50) | −0.4/min | Walk, explore, rest missions |

Clamp 0–100. Stat bars: segmented cells (10 blocks), like a board display. Low stat blinks with a hard 1s on/off step. Below 25 the mission engine prioritizes it.

### Mission card
Paper-colored (#E6E1D3) card with ink text, a dashed tear line separating the action buttons, a mission code in the corner (e.g. M-03). Buttons are square, uppercase text. Action buttons: **COMPLETE**, **SKIP**. Complete: stat boost + XP + "COMPLETE" flash + next mission after 1.5 s. Skip: new mission, no penalty.

### Mission engine rules
1. Eligible if `minsLeft` in mission's `when` range and `mission.mins ≤ minsLeft − 5`.
2. Prefer missions for the **lowest stat**.
3. Don't repeat the last 3.
4. If nothing fits, show "Head to your gate" mission.

### Log (P1)
Collapsible list: COMPLETED, SKIPPED, with XP total. No emojis.

## F3. Alert ladder (P0 for final alarm, P1 for earlier steps)
| Stage | Trigger | Effect |
|---|---|---|
| Heads-up | ≤ 15 min | Top banner "START WRAPPING UP", soft chime |
| Urgent | ≤ 5 min | Amber theme, vibration, "WALK TO GATE NOW" |
| ALARM | ≤ 0 | Solid red #C8201A that hard-steps to #7A120E every 0.6s using steps(), white condensed type at max size, gate number in mono at 40vw max. |

**Alarm rules:** latches (never auto-returns to quest), no back/close, single button **I AM AT THE GATE**, mounts instantly with no animation. Visual + sound + vibration together.
Demo Mode compresses thresholds to 20 s / 10 s.

## F4. Safe Travels + Layover Passport (P1)
Ink background, a plain stamp-style bordered block with the stats set in mono, rotated -3deg. *LAYOVER PASSPORT: Survived 3h 12m, 4 missions, 340 XP, Rank: Gate Guardian*. Designed to screenshot. "START NEW LAYOVER" resets. No emojis.

## F5. Persistence (P0)
Save `{departureMs, returnByMs, gate, vibe, stats, log, xp, screen}` in localStorage on change. On load: restore; if now ≥ returnBy and screen ≠ safe → go straight to alarm.

## F6. AI missions (P2)
At START, one request for 6 witty missions (JSON). 3 s timeout, validate shape, else hardcoded. Badge "AI" on AI missions. Never on the alarm path.

## Out of scope
Accounts, maps, lounge data, push notifications, native app, multi-flight, social feeds.

## Edge cases
| Case | Behavior |
|---|---|
| Departure passed / safe time ≤ 0 | Block START with message |
| Past midnight | Roll to next day, show date in preview |
| Refresh mid-session | Restore from storage |
| Tab backgrounded then returns | Clock recomputes from timestamps; ladder catches up instantly |
| Audio blocked | Oscillator fallback + vibration + visual |
| Battery API missing (iOS/Firefox) | Manual battery stat |
