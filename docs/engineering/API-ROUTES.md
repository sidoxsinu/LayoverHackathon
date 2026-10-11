# GATE — Serverless API Routes Contract

**Last Verified:** 2026-10-11 · **Commit:** `98bad9e`

---

## 1. Overview

All API endpoints are implemented as Next.js App Router route handlers in `gate-next/src/app/api/` and `src/app/auth/`.
All API keys remain strictly server-side in `.env.local` and are never bundled into client JavaScript.

---

## 2. API Endpoints

### 1. `POST /api/venue-missions`
Generates 8 venue-grounded side-quests based on the traveler's physical location and transit wait type.

- **Trigger:** Initiated exactly **ONCE** in the background upon tapping START.
- **Client Behavior:** Non-blocking. START handler never awaits this route.
- **Request Body:**
  ```json
  {
    "venue": "TinkerSpace, Calicut",
    "osmCategory": "coworking",
    "city": "Calicut",
    "waitType": "flight",
    "safeMinutes": 120,
    "vibe": "Tired",
    "localHour": 14
  }
  ```
- **Validation & Clamping:**
  - `venue`: string, max 60 characters, sanitized against control chars and prompt injection instructions.
  - `waitType`: strictly `'flight' | 'train' | 'bus' | 'other'`.
  - `safeMinutes`: integer clamped to range `[5, 720]`.
  - `localHour`: integer clamped to `[0, 23]`.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "venueKnown": true,
    "venueSummary": "Makerspace and technology hub in Calicut",
    "missions": [
      {
        "tag": "SPOT",
        "title": "FIND THE MOST TECH-LOOKING OBJECT AND PHOTOGRAPH IT",
        "mins": 5,
        "proof": "photo",
        "proofHint": "PHOTO OF THE OBJECT, NO SCREENS WITH PERSONAL DATA",
        "social": false
      }
    ]
  }
  ```
- **Protections:**
  - In-memory per-IP rate limiter: hard cap of **5 calls per 10 minutes** (`429 Too Many Requests`).
  - Abort timeout: `AbortSignal.timeout(12000)` (12-second hard cancellation).
  - Client cooldown: max 1 call per layover, min 60s cooldown.
  - Client cache: 12-hour localStorage cache (`gate.venuemp.{venueHash}`).

---

### 2. `POST /api/setup`
Reverse geocodes device coordinates to concise, building-level venue names via OpenStreetMap Nominatim.

- **Trigger:** Location permission granted on Setup screen.
- **Request Body:**
  ```json
  {
    "lat": 11.2784487,
    "lon": 75.8442351
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "airport": "TINKERSPACE, CALICUT",
    "osmCategory": "coworking",
    "city": "Calicut",
    "missions": []
  }
  ```
- **Performance:** Pure Nominatim lookup executed in $< 500$ms with 500m venue proximity snapping.

---

### 3. `POST /api/verify`
Serverless verification endpoint for photo proof checking.

- **Trigger:** Photo attachment on quest completion.
- **Request Body:**
  ```json
  {
    "photoPath": "userId/layoverId/logId.jpg",
    "missionTag": "FOOD",
    "missionTitle": "REFUEL WITH A REAL MEAL"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "unverified",
    "note": "VERIFICATION NOT ENABLED"
  }
  ```
- **Reliability:** 5-second client abort timeout. If unreachable, proof gracefully defaults to `PROOF SAVED, NOT CHECKED` without blocking XP progression.

---

### 4. `GET /auth/callback`
OAuth callback handler exchanging the Google OAuth authentication code for a persistent Supabase session cookie.

- **Response:** `307 Temporary Redirect` navigating back to `/` or requested redirect path.
