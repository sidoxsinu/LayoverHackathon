# GATE — Demo Script (v2)

> Judges are tired. Do not explain the app. Make them feel the problem, feel the safety, then feel the alarm.

---

## Pre-demo setup (5 min before)
1. Open the **deployed HTTPS URL** on the phone (not localhost). Volume max, silent switch off, Do Not Disturb off.
2. Ensure the demo account has 2 or 3 real trips added by hand in `/trips` (never seeded in code).
3. Set phone auto-lock to Never / longest. Plug in power bank.
4. Triple-tap the wordmark: **DEMO** chip appears. Pre-fill gate **A12**, walk **2 min**, vibe **Tired**.
5. **Do not press START yet.** Press it when you begin the pitch (alarm fires 60 s later).
6. Backup: same flow open on a laptop; a 30 s screen recording of the full demo on the phone.

> Never lock the phone: browsers suspend tabs, and Wake Lock keeps the screen on only while the tab is visible.

---

## 2-minute pitch

### **[0:00–0:20] Hook** (phone in hand, facing you)
> "You land in Dubai. Your connection is in six hours. You are exhausted, but terrified of dozing off and missing your flight. So you sit at the gate for six hours, doing nothing. Every traveler has lived this."

24: ### **[0:20–0:35] Setup, Dynamic Location & Trips** (show Setup screen)
25: > "GATE automatically pinpoints your exact building - right now it detected our venue, **TinkerSpace, Calicut** with building-level GPS precision.
26: > First-time travelers get an interactive spotlight tour and context tips explaining Safe Time. Tap SKIP TOUR in one click - it never gets in your way.
27: > Notice the WAITING FOR selector: whether you are waiting for a flight, train, or bus, GATE adapts all terminology.
28: > Setup takes 10 seconds. GATE calculates the last safe moment to wander."
29: *(Demo beat: Venue is TinkerSpace, Calicut. Tap START LAYOVER / START WAIT)*
30: 
31: ### **[0:35–1:05] Quest, Venue Missions & Photo Proof** (show countdown, stats, mission)
32: > "This countdown tracks the last safe moment you can wander freely. The moment you tap START, GATE begins instantly with zero lag. In the background, a single Groq call generates venue-grounded quests specific to TinkerSpace - like spotting a maker project or tech gear.
33: > Notice the 'AT TINKERSPACE' badge on venue-relevant missions!
34: > Hungry? It suggests food. Twenty minutes left? It never suggests a sit-down meal. Finish a mission and your survival stats recover."
35: 
36: *(Photo proof beat: Tap COMPLETE, pick a demo photo, tap USE PHOTO (+20 XP))*
37: > "Missions ask for photo proof. Snap your coffee, charger, or tech project to earn bonus XP. All photos are compressed client-side on canvas, and personal EXIF metadata is stripped automatically."
38: > "Stats restored. +20 Proof XP awarded."

### **[1:05–1:20] Ladder** (banner and chime appear around here; Demo thresholds 20 s / 10 s)
> "As time runs out, it escalates: first a heads-up chime at 15 minutes, then an urgent warning at 5 minutes with warning audio and vibration."

### **[1:20–1:45] Alarm** (go silent when the screen turns red. Count three. Let the room react.)
> "And then it takes over. Hard-stepping alarm, maximum volume, zero snooze. One button."

*Tap I'M AT THE GATE. Show Safe Travels, rank level stamp (e.g. LEVEL 1 OF 10), and "?" button.*
*(Tap "?" or "WHAT IS THIS?" on Passport: show the full 10-tier Rank Ladder scaling up to Apex Voyager).*
*(Tap "PRINT PASSPORT": show print preview / PDF generation).*
> "Every minute spent surviving builds your rank across 10 progressive tiers from Gate Rookie to Apex Voyager. You can print or save your official boarding passport and layover certificate with one click."

### **[1:45–2:00] Close**
> "GATE makes your layover structured, purposeful, and impossible to mess up. Built tonight, running live on a public URL with zero-dependency offline safety. Scan the QR to try it."

---

## Booth version (90 s walk-up)
- Press START at the moment a judge approaches; lead with the problem.
- One-liner: *"A video game for your layover, where the game ends when your flight boards."*
- QR code to the live URL, phone propped up, laptop showing the repo/DevTools.
- Do not apologize; do not recite the stack.

---

## How to Prove Dynamic Location Live to Judges

When a judge asks: *"Is the location hardcoded?"*, use any of these **4 instant proofs**:

1. **The In-App Override (10 seconds, zero tools needed)**:
   - On the **Setup screen**, tap the **LOCATION** input box.
   - Type any airport in the world (e.g. `Terminal 3, Dubai` or `Changi Airport, Singapore`).
   - Tap **APPLY** and confirm.
   - Point out that the badge updates from `[AUTO]` to `[MANUAL]`, and the backend `/api/setup` immediately re-generates local missions for that exact place.

2. **The Status Badges**:
   - Point to the badge above the location field:
     - `[AUTO]` = Active real-world GPS permission granted; resolved via OpenStreetMap Nominatim.
     - `[MANUAL]` = Custom user override applied.
     - `[DEFAULT]` = Fallback when GPS permissions are denied.

3. **Chrome DevTools Sensors ("Live Teleport")**:
   - Open DevTools (`Cmd+Opt+I` or `F12`) $\to$ **More tools** $\to$ **Sensors**.
   - Under **Location**, pick **San Francisco**, **London**, or **Tokyo** (or custom coordinates like Cochin Airport `10.1518, 76.3930`).
   - Refresh the page: the app reads the new sensor coordinates live and resolves to `SAN FRANCISCO` or `KOCHI (COK)`.

4. **Network Tab Inspection**:
   - Open DevTools **Network Tab**, filter for `setup`.
   - Show the judge the real request payload: `{"lat": 11.2784, "lon": 75.8442}`.
   - Show the live response with building-level reverse geocoding: `{"airport": "TINKERSPACE, CALICUT", ...}`.

---

## The `# ENV` Fallback Demonstration (The Reliability Flex)

To prove to judges that GATE has **bulletproof offline architecture** and cannot crash on stage, show them what happens when you comment out (`#`) the environment variables in `gate-next/.env.local`:

```bash
# -----------------------------------------------------------------------------
# Live Demonstration: Comment out all keys to demonstrate graceful fallbacks
# -----------------------------------------------------------------------------
# GEMINI_API_KEY=AIzaSy...
# NEXT_PUBLIC_SUPABASE_URL=https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### What to show the judge:

1. **Hashtag Gemini (`# GEMINI_API_KEY`)**:
   - Save `.env.local` with `# GEMINI_API_KEY`.
   - Reload the app and trigger Setup.
   - **Result**: The app logs `GEMINI_API_KEY missing, returning building-level location directly`. It instantly falls back to `TINKERSPACE, CALICUT` and populates the 17 built-in algorithmic missions.
   - **Talking point**: *"Even if Google Gemini suffers a total outage or the API quota runs out, the traveler is never stranded. The offline mission engine seamlessly takes over."*

2. **Hashtag Supabase (`# NEXT_PUBLIC_SUPABASE_URL` & `# NEXT_PUBLIC_SUPABASE_ANON_KEY`)**:
   - Save `.env.local` with `# NEXT_PUBLIC_SUPABASE_...`.
   - Reload the app.
   - **Result**: The app automatically drops into **Guest Mode**. The traveler can run their entire layover, drain stats, upload photos to IndexedDB (`gate_proofs_db`), trigger the alarm, and print their local Safe Travels passport card without a database.
   - **Talking point**: *"If our database or cloud backend goes down, guests can still run full layovers with local persistence. Safety never depends on external servers."*

3. **Airplane Mode / Wi-Fi Disconnect**:
   - Disconnect Wi-Fi on the phone or enable Airplane Mode.
   - Open `/trips`: It renders cached flights with the banner `OFFLINE, SHOWING SAVED TRIPS`.
   - Run Quest: The countdown, audio arming, alarm audio (`/Alarm.mp3` or WebAudio oscillator), and vibration run 100% locally with zero network calls.

---

## Q&A Defense

| Question | Answer |
|---|---|
| Why not just a phone alarm? | "A standard alarm is just a deadline. GATE structures the hours before it with missions sized to your available time, and warns you in progressive stages." |
| Does it work if I lock my phone? | "Web apps cannot ring from a locked screen, so GATE keeps the screen awake and escalates visually, with sound and vibration. A native build with notifications is the next step." |
| How does photo proof work? | "Proof is captured via camera or gallery and processed client-side. EXIF and location metadata are stripped on canvas, images are compressed under 1 MB, and offline photos are queued in IndexedDB." |
| What if AI or network fails? | "The alarm path has zero network or AI dependency. By design, if you comment out `#` every API key in `.env.local`, missions, offline photos, and cached departures fall back seamlessly to local storage." |
| How do venue missions work? | "One call at start, validated, with local fallbacks. We make exactly one non-blocking Groq API call when the user starts, validated strictly server and client side, with code-derived stats. If the call is slow or fails, the quest runs on 17 local fallbacks with zero user disruption." |
| How do you get building-level location? | "We query OpenStreetMap Nominatim with `zoom=18` and `extratags=1`, extracting specific building, leisure, and venue tags, combined with a 500m venue proximity safety net." |
| How does the Leaderboard prevent cheating? | "Rankings are server-computed in PostgreSQL with an anti-farming duration cap (max 1 mission per 3 minutes of layover duration, 60 XP max per layover). Handles are strictly opt-in, case-insensitive, with a 1-hour modification cooldown and zero PII exposure." |
| What was hard? | "Reliability: time math across midnight, timestamp-based clocks so throttled tabs do not drift, and unlocking audio on the first tap." |
| Business model? | Only if asked: airline or airport app partnership, duty-free/lounge tie-ins. |

---

## Risk Table

| Risk | Mitigation |
|---|---|
| Alarm does not fire | Demo Mode rehearsed 3x; hidden "Fire alarm now" in draggable DEV overlay |
| No sound | Volume check; oscillator fallback; speaker next to phone if needed |
| Phone sleeps | Wake Lock + auto-lock off |
| App crashes | State restores from localStorage (`gate.v3`); laptop backup; screen recording |
| Judge interrupts | Keep talking about missions; the alarm will land |
| Wi-Fi down | Fully offline after first load (zero network dependencies) |
