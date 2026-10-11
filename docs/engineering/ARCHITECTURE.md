# GATE — System Architecture

**Last Verified:** 2026-10-11 · **Commit:** `98bad9e`

---

## 1. Architectural Philosophy

GATE is an airport-signage-inspired, mobile-first layover companion web app built under a strict reliability invariant:
> **The alarm path must never depend on the network, database, authentication, camera, or AI.**

If every cloud service suffers an outage, the traveler's alarm clock, audio escalation, and local quest loop continue operating without delay or disruption.

---

## 2. Dual-Engine Model: Alarm Path vs Data Path

```mermaid
graph TD
    subgraph ALARM_PATH ["ALARM PATH (100% Offline & Synchronous)"]
        A[User Tap START] -->|User Gesture| B[arm Audio Element]
        B --> C[Request Screen Wake Lock]
        C --> D[Timestamp Clock Date.now]
        D --> E[Alert Ladder Evaluation]
        E -->|safeMinutes <= 15| F[Heads-up Chime]
        E -->|safeMinutes <= 5| G[Urgent Vibration & Warning]
        E -->|safeMinutes <= 0| H[FULL ALARM TAKEOVER]
        H --> I[Solid Red Strobe + WebAudio Oscillator Fallback]
    end

    subgraph DATA_PATH ["DATA PATH (Asynchronous & Non-Blocking)"]
        A -.->|Background Fetch| J[POST /api/venue-missions]
        J -.->|Groq LLM 12s Timeout| K[Parse & Sanitize Missions]
        K -.->|Merge into Pool| L[Next Mission Pick]
        A -.->|On Finish| M[Safe Travels Screen]
        M -.->|Optional Auth| N[(Supabase Postgres)]
        M -.->|Photo Attachments| O[(Supabase Storage)]
    end
```

### Invariants:
1. **Zero-Blocking START**: The client START click handler records epoch milliseconds directly from `Date.now()`, arms the audio context synchronously, and transitions to the quest screen in $< 16$ms. It never `await`s the network.
2. **Deterministic Stat Calculations**: Mission stat boosts (+20 to +30 hunger/sanity/battery) and XP rewards (`MISSION_XP = 40`, `PROOF_BONUS_XP = 20`) are computed deterministically in application code via `deriveStatEffect(tag)`, never derived from AI output.
3. **Emergency Unmount**: If the alert ladder reaches `urgent` ($\le 5$ min) or `alarm` ($\le 0$ min), all non-essential UI (onboarding tours, context tips, photo modals) unmounts immediately. The alarm layer has `z-index: 100`, superseding every other interface surface.

---

## 3. Screen State Machine

```mermaid
stateDiagram-v2
    [*] --> AUTH : Fresh Browser Session
    AUTH --> SETUP : Continue as Guest / Google Sign In
    SETUP --> QUEST : START (Safe Time > 0)
    QUEST --> ALARM : safeMinutes <= 0 (Latched)
    QUEST --> SAFE_TRAVELS : Final Destination Task Complete
    ALARM --> SAFE_TRAVELS : Tap "I'M AT THE GATE"
    SAFE_TRAVELS --> SETUP : START NEW LAYOVER
    SAFE_TRAVELS --> PASSPORT : View Full Passport
    SETUP --> TRIPS : Manage Upcoming Departures
    TRIPS --> SETUP : Select Departure to Use
```

---

## 4. Time Math & Clock Resiliency

- All time in GATE is represented as **epoch milliseconds** (`number`). Date objects are never stored in session state.
- **Throttling Immunity**: Browsers throttle background tab `setInterval` timers down to 1 tick per minute. To prevent time drift, the `useNow` hook derives current time strictly from `Date.now()` on every render and synchronizes on document `visibilitychange`.
- **Midnight Rollover**: If the user enters a departure time earlier than the current local time, `nextOccurrence()` automatically rolls the schedule to tomorrow's date.
