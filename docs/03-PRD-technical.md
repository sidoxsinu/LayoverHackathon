# GATE — Technical (v2)

## Stack
| Layer | Choice | Why |
|---|---|---|
| App | Next.js (App Router, JS/TS) | Requested full-stack |
| Styling | Tailwind v4 | Theme in CSS |
| State | `useReducer` + localStorage | No libraries |
| Database | Supabase (Postgres) | RLS, idempotent sync, Auth |
| Animation | CSS only | No extra dependency |
| Audio | `<audio>` file + WebAudio fallback | Reliable on iOS and Android |
| Platform APIs | Wake Lock, Vibration, Battery (all optional, feature-detected) | Alarm reliability |
| AI (P2) | Gemini/Groq via Vercel serverless proxy | Key stays server-side |
| Hosting | Vercel | HTTPS required for Wake Lock/audio testing |

## Setup
```bash
npx create-next-app@latest gate-next --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
```
`src/index.css`
```css
@import "tailwindcss";
@theme {
  --color-gate-ink: #101010;
  --color-gate-panel: #181816;
  --color-gate-line: #34322C;
  --color-gate-paper: #E6E1D3;
  --color-gate-amber: #F2A900;
  --color-gate-green: #3F9B5B;
  --color-gate-red: #C8201A;
  --color-gate-red-dark: #7A120E;
  --color-gate-muted: #8C887C;
  --font-sans: "Barlow Condensed", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
  --animate-alarm: alarm 0.6s steps(1) infinite;
  @keyframes alarm { 0%,100% { background-color: var(--color-gate-red); } 50% { background-color: var(--color-gate-red-dark); } }
}
html, body, #root { height: 100%; background: var(--color-gate-ink); color: var(--color-gate-paper); }
```
Add Barlow Condensed + IBM Plex Mono `<link>` tags in `index.html`, plus `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. Put a licensed alarm sound at `public/alarm.mp3`.

## Structure
```
src/
  app/page.tsx            # reducer, screen switch, alarm latch
  app/layout.tsx
  app/globals.css
  components/ GateAlarm.tsx, SetupScreen, Quest, Countdown, StatBar, MissionCard, MissionLog, SafeTravels, Passport
  hooks/ useNow.ts, useBattery.ts
  lib/ time.ts, missions.ts, alarm.ts, storage.ts, ai.ts (P2)
```

## Time model (`lib/time.js`)
```js
const MIN = 60_000;
export const BUFFER_MIN = 30, MARGIN_MIN = 5;

export function nextOccurrence(hhmm, now = Date.now()) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(now); d.setHours(h, m, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}
export function schedule({ departureMs, walkMin }) {
  return { departureMs, returnByMs: departureMs - (BUFFER_MIN + walkMin + MARGIN_MIN) * MIN };
}
export function demoSchedule(walkMin, now = Date.now()) {
  const returnByMs = now + 60_000;
  return { returnByMs, departureMs: returnByMs + (BUFFER_MIN + walkMin + MARGIN_MIN) * MIN };
}
export function phaseFor(msLeft, demo = false) {
  const [urgent, heads] = demo ? [10_000, 20_000] : [5 * MIN, 15 * MIN];
  if (msLeft <= 0) return 'alarm';
  if (msLeft <= urgent) return 'urgent';
  if (msLeft <= heads) return 'headsup';
  return 'free';
}
export const fmt = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const p = n => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s % 3600 / 60))}:${p(s % 60)}`;
};
```

## Clock (`hooks/useNow.js`)
Always derive from `Date.now()`; never count ticks (throttled tabs drift).
```js
import { useEffect, useState } from 'react';
export function useNow(ms = 500) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [ms]);
  return now;
}
```
In `app/page.tsx`: `const phase = phaseFor(state.returnByMs - now, state.demo)`; effect: when `phase === 'alarm'` and screen is `quest`, dispatch `ALARM` (latch; never reverse).

## Alarm (`lib/alarm.js`)
```js
let audio, ctx, wakeLock, loop, vib;
const el = () => (audio ||= Object.assign(new Audio('/alarm.mp3'), { loop: true, preload: 'auto' }));

export async function arm() {            // call inside the START click handler
  try { await el().play(); el().pause(); el().currentTime = 0; } catch {}
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  await ctx.resume().catch(() => {});
  await lockScreen();
}
export async function lockScreen() {
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch {}
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') lockScreen();   // lock is released when hidden
});

function beep(f, t, d = 0.25) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
  g.gain.setValueAtTime(0.6, ctx.currentTime + t);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
  o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + d);
}
export const chime = () => ctx && beep(660, 0, 0.4);

export function startAlarm() {
  el().play().catch(() => {                     // fallback if audio file is blocked
    const burst = () => [0, 0.35, 0.7].forEach(t => beep(880, t));
    burst(); loop = setInterval(burst, 1500);
  });
  const buzz = () => navigator.vibrate?.([500, 200, 500]);
  buzz(); vib = setInterval(buzz, 1500);
}
export function stopAlarm() {
  audio?.pause(); clearInterval(loop); clearInterval(vib); navigator.vibrate?.(0);
  wakeLock?.release?.();
}
```
Reliability notes: iOS Safari has no Vibration API (visual + audio carry it); the iOS silent switch may mute WebAudio, hence the `<audio>` element primary; Wake Lock needs HTTPS; the page must stay in the foreground.

## Missions (`lib/missions.js`)
Shape: `{ id, icon, type, text, mins, need, boost, when: [minMinsLeft, maxMinsLeft] }` where `need` ∈ `hunger | sanity | battery`.
```js
export const MISSIONS = [
  { id:'meal',  icon:'FOOD', type:'HUNGER',  text:'Find a sit-down restaurant and eat a real meal. You have time.', mins:45, need:'hunger',  boost:60, when:[150,9999] },
  { id:'souv',  icon:'MOVE', type:'EXPLORE', text:'Find the most overpriced useless souvenir. Do not buy. Take a photo.', mins:15, need:'sanity', boost:30, when:[90,9999] },
  { id:'quiet', icon:'REST', type:'REST',    text:'Find the quietest corner. Sit. Do nothing for 10 minutes.', mins:15, need:'sanity', boost:35, when:[60,9999] },
  { id:'loop',  icon:'MOVE', type:'MOVE',    text:'Walk one full terminal loop. Count the gates.', mins:20, need:'sanity', boost:45, when:[60,9999] },
  { id:'plug',  icon:'PLUG', type:'BATTERY', text:'Find an outlet. Plug in. You are a phone now.', mins:20, need:'battery', boost:25, when:[30,9999] },
  { id:'coffee',icon:'FOOD', type:'COMFORT', text:'Get a coffee or tea. Sit somewhere new.', mins:15, need:'hunger', boost:20, when:[40,180] },
  { id:'snack', icon:'FOOD', type:'SUPPLY',  text:'Buy one snack for the flight. Something new if possible.', mins:10, need:'hunger', boost:30, when:[20,60] },
  { id:'wash',  icon:'REST', type:'PREP',    text:'Freshen up. Wash your face. New person.', mins:5, need:'sanity', boost:20, when:[10,60] },
  { id:'pack',  icon:'PREP', type:'PREP',    text:'Pack your bag. Passport and boarding pass in hand.', mins:5, need:'battery', boost:0, when:[0,30] },
  { id:'go',    icon:'MOVE', type:'FINAL',   text:'Head to your gate now. You survived.', mins:5, need:'sanity', boost:0, when:[0,15] },
];
export function pickMission({ minsLeft, stats, recent = [] }) {
  const fits = MISSIONS.filter(m => minsLeft >= m.when[0] && minsLeft <= m.when[1] && m.mins <= minsLeft - 5 && !recent.includes(m.id));
  const pool = fits.length ? fits : MISSIONS.filter(m => m.id === 'go');
  const lowest = Object.entries(stats).sort((a, b) => a[1] - b[1])[0][0];
  const targeted = pool.filter(m => m.need === lowest);
  const from = targeted.length ? targeted : pool;
  return from[Math.floor(Math.random() * from.length)];
}
```
Stat drain: every 30 s apply `hunger −0.15, sanity −0.2` (and battery −0.075 if no Battery API). XP: +40 per completed mission, +10 per skip-free streak (keep simple: 40 only).

## Battery (`hooks/useBattery.js`)
```js
import { useEffect, useState } from 'react';
export function useBattery() {
  const [pct, setPct] = useState(null);
  useEffect(() => {
    let b; const upd = () => setPct(Math.round(b.level * 100));
    navigator.getBattery?.().then(x => { b = x; upd(); b.addEventListener('levelchange', upd); });
    return () => b?.removeEventListener('levelchange', upd);
  }, []);
  return pct;   // null => unsupported, use manual stat
}
```

## Persistence (`lib/storage.js`)
```js
const KEY = 'gate.v3';
export const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
export const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
export const clear = () => localStorage.removeItem(KEY);
```
Call `save(state)` in an effect on state change. On boot: `load()`; if `returnByMs <= Date.now()` and screen is `quest`, set screen to `alarm`.

## Database Schema & Migrations (Supabase Postgres)

### Migration `0001_init.sql`
Creates `profiles`, `layovers`, and `mission_log` tables with RLS enabled (`user_id = auth.uid()`).

### Migration `0002_trips.sql`
Adds upcoming departures tracking with strict multi-tenant isolation:
1. **`trips` Table**:
   - `id uuid primary key` (client-generated via `crypto.randomUUID()`)
   - `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`
   - `name text not null check (char_length(name) >= 1 and char_length(name) <= 60)`
   - `location text check (location is null or char_length(location) <= 60)`
   - `flight_no text check (flight_no is null or char_length(flight_no) <= 12)`
   - `gate text check (gate is null or char_length(gate) <= 8)`
   - `departure_at timestamptz not null`
   - `walk_min int not null default 10 check (walk_min in (2, 5, 10, 15))`
   - `created_at timestamptz not null default now()`
   - `updated_at timestamptz not null default now()`
   - Index on `(user_id, departure_at)`
2. **50-Trip Hard Limit Trigger**:
   - `check_trip_limit_trigger` prevents a single user from inserting more than 50 trips (`RAISE EXCEPTION 'TRIP LIMIT EXCEEDED (MAX 50)'`).
3. **Row-Level Security (RLS)**:
   - SELECT, INSERT, UPDATE, DELETE policies on `trips` strictly require `auth.uid() = user_id`, with `WITH CHECK (auth.uid() = user_id)` on INSERT and UPDATE.
4. **Layovers Integration**:
   - `layovers` alters table to add `trip_id uuid null references trips(id) on delete set null` and `trip_name text null`.
   - Layovers INSERT and UPDATE RLS policies enforce:
     ```sql
     trip_id is null or exists (
       select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()
     )
     ```
     This prevents user B from linking their layover to user A's trip.

### Client Cache & Offline Handling (`lib/trips.ts`)
- **Cache Key**: `gate.trips.v1.{userId}` in `localStorage`.
- **Reads**: Always caches successful queries. If offline or query fails while cached data exists, returns cached trips with status notice: `OFFLINE, SHOWING SAVED TRIPS`.
- **Writes**: Client creates a UUID before sending upsert request (`upsert({ ... }, { onConflict: 'id' })`). Idempotent: repeating the save never creates duplicate rows. Writes fail fast if offline with a clear one-line error in alarm red (no silent queues).
- **Cache Invalidation**: Cleared immediately on user sign-out via `clearTripCache(userId)`.

### Trip ID Data Flow
1. User selects trip in Setup dropdown -> `trip.id` and `trip.name` set in Setup local state.
2. Form fields auto-fill (`departureMs = new Date(trip.departure_at).getTime()`, `gate`, `walkMin`).
3. Form fields remain fully editable by the user without modifying the underlying saved trip.
4. When START is clicked, `tripId` and `tripName` are dispatched to `AppState` (`START` action).
5. State is written to `gate.v3` localStorage and subsequently synced to Supabase `layovers` table (`trip_id`, `trip_name`).
6. Passport screen renders `trip_name` badge alongside the layover history card.

### Timezone Limitation
Native `<input type="date">` and `<input type="time">` interpret input according to the user's local device clock and convert to UTC ISO strings (`new Date(dateTimeStr).toISOString()`). The UI explicitly surfaces:
`TIMES USE YOUR DEVICE TIME ZONE.`
Departures are scheduled as absolute epoch milliseconds, ensuring time math remains identical regardless of local device timezone shifts.

### Migration `0003_proofs.sql`
Adds mission photo proof tracking, cloud storage, and security policies:
1. **`mission_log` Alterations**:
   - `proof_path text null` (path in storage bucket)
   - `proof_status text not null default 'none' check (proof_status in ('none', 'unverified', 'pending', 'verified', 'rejected'))`
   - `proof_checked_at timestamptz null`
   - `proof_note text null`
   - `proof_xp integer not null default 0`
2. **Private Storage Bucket `proofs`**:
   - `id: 'proofs'`, `public: false`, `file_size_limit: 1048576` (1 MB), `allowed_mime_types: array['image/jpeg']`.
3. **Storage Row-Level Security (RLS)**:
   - SELECT, INSERT, UPDATE, DELETE policies on `storage.objects` for bucket `proofs`:
     ```sql
     bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text
     ```
   - Path format: `{user_id}/{layover_id}/{log_id}.jpg`.
   - Prevents any user from reading, uploading to, modifying, or deleting another user's proofs.
4. **Storage Cascading Limitation**:
   - Note: PostgreSQL foreign key constraints on `public.layovers` cannot automatically cascade delete files in Supabase's `storage.objects` table across schemas.
   - Storage cleanup is implemented programmatically in `lib/proof.ts` via `deleteProof` and `deleteLayoverProofs`.

### Client Image Pipeline (`lib/proof.ts`)
- **Input Validation**: Accepts `image/jpeg`, `image/png`, `image/webp` (and decodeable `image/heic`). Rejects files over 10 MB.
- **Canvas Stripping & Resizing**: Decodes onto an HTML5 canvas, resizes maintaining aspect ratio so the longest side is ≤ 1280px, and re-encodes using `canvas.toBlob(resolve, 'image/jpeg', 0.7)`. This guarantees total destruction of EXIF, GPS location tags, and device fingerprints.
- **Payload Limits**: Rejects output blobs over 1 MB (target ~300 KB). Explicitly zeroes canvas dimensions and revokes object URLs.

### IndexedDB Offline Retry Queue (`lib/proof.ts`)
- **Database**: `gate_proofs_db`, store `pending_proofs`, key `logId`. Zero external dependencies.
- **Capacity**: Strict maximum of 10 items. When queue reaches 10, oldest entries are evicted to prevent storage exhaustion.
- **Retry Mechanism**: Automatically retries queued items on app mount and window `'online'` events.
- **Sign-Out Eviction**: `clearPendingProofs()` purges all queued blobs on user sign-out.

### Verifier Contract & Architecture (`lib/verify.ts` and `api/verify/route.ts`)
- **Route**: `POST /api/verify` (requires authenticated user session or bearer token).
- **Input Schema**:
  ```json
  {
    "missionId": "string",
    "missionTitle": "string",
    "proofHint": "string",
    "imagePath": "string",
    "location": "string (optional)"
  }
  ```
- **Output Schema**:
  ```json
  {
    "status": "none | unverified | pending | verified | rejected",
    "confidence": "number (optional)",
    "note": "string (optional)"
  }
  ```
- **Execution**: Non-blocking client call with 5-second timeout (`AbortSignal.timeout(5000)`). Network failure or timeout leaves status as `'unverified'` without throwing or blocking mission progression.
- **Status Badges**:
  - `none`: no display
  - `unverified`: `PROOF SAVED, NOT CHECKED`
  - `pending`: `CHECKING`
  - `verified`: `VERIFIED`
  - `rejected`: `NOT ACCEPTED`
  - Strict UI invariant: Never display `VERIFIED` unless status is strictly `'verified'`.
- **Proof Bonus XP**: Constant `PROOF_BONUS_XP = 20`. Under current placeholder stage, attaching a photo awards +20 XP stored per row in `proof_xp`. Once real AI vision checking is active, the bonus condition moves to status `'verified'` only.

## Rank and XP Architecture (`lib/rank.ts`)
- **Constants**:
  - `MISSION_XP = 40` (earned on mission completion)
  - `PROOF_BONUS_XP = 20` (earned when valid photo proof is attached)
- **Rank Tiers**:
  1. Level 1: `GATE ROOKIE` (0 XP) - "JUST LANDED. YOUR FIRST LAYOVER."
  2. Level 2: `TERMINAL NOMAD` (50 XP) - "YOU KNOW HOW TO FILL AN AIRPORT HOUR."
  3. Level 3: `CONCOURSE RUNNER` (150 XP) - "YOU OWN THE CONCOURSE."
  4. Level 4: `GATE GUARDIAN` (300 XP) - "YOU NEVER MISS A BOARDING CALL."
  5. Level 5: `TRANSIT LEGEND` (500 XP) - "TOP RANK. THE TERMINAL KNOWS YOUR NAME."
- **Invariants**:
  - Rank is never stored in DB or session state. Derived dynamically from total XP at render time.
  - Total XP = sum of completed mission XP (40 per mission) + proof XP (20 per photo).
  - Negative XP, `NaN`, and `undefined` are guarded and clamped to 0 (`GATE ROOKIE`).
  - Estimates to next rank: `missionsToNext` = `Math.ceil(xpToNext / 40)` (without proof) and `Math.ceil(xpToNext / 60)` (with proof).

## Spotlight Tour Architecture (`components/Tour.tsx`, `lib/tour.ts`)
- **Storage**: `gate.tour.v1` in `localStorage`.
  - Schema: `{ setupSeen: boolean, questSeen: boolean, safeTravelsSeen: boolean, passportSeen: boolean }`.
  - Replay button "HOW IT WORKS" resets target screen's seen state and remounts tour.
- **Visual Dimming Engine**:
  - Four absolutely positioned solid panels (`rgba(16, 16, 16, 0.8)`) surround the target bounding box (top, bottom, left, right).
  - Target framed with 2px solid amber border with 4px padding. Zero blur, box-shadow, or backdrop-filter.
  - Auto-scrolls target into view with safety margin. Re-measures on window resize, scroll, and orientation change.
  - Centered fallback: If element with `data-tour="id"` is missing from DOM, card renders centered without frame.
- **Alarm Safety Invariant**:
  - Tour immediately unmounts if `phase === 'urgent'` or `phase === 'alarm'`.
  - Alarm layer has `z-index: 100`, strictly above Tour layer (`z-index: 70`).
  - Tour never calls `arm()` or triggers WebAudio. Audio arming remains exclusive to user's START tap.
  - Safe time <= 15 min guard on Quest screen displays "TOUR SKIPPED, LESS THAN 15 MIN LEFT" without marking seen.
  - Demo Mode (triple-tap wordmark) never triggers tour.

## Context InfoTips (`components/InfoTip.tsx`)
- 48px square touch button labeled `?`.
- Single-active listener: broadcasts `gate:infotip-opened` so opening one tip closes any other open tip.
- Closes on click outside, Escape key, or close button tap.
- Targets: Safe Time, Walk Time, Vibe, Stats, Proof, Scheduled Trips, and Passport empty state.

## Printable Passport Route (`/passport/print`, `lib/passport.ts`)
- Standalone print-optimized route (`/passport/print` or `/passport/print?layover=<id>`).
- Print CSS:
  - `@page { size: auto; margin: 12mm; }`
  - `-webkit-print-color-adjust: exact; print-color-adjust: exact;`
  - Solid paper `#E6E1D3` background, `#101010` ink text, 1px solid borders.
  - Cards enforce `break-inside: avoid; page-break-inside: avoid;`.
- Render Layout:
  - Header: `GATE LAYOVER PASSPORT`, traveler name, print date, square rank stamp with `LEVEL x OF 5`.
  - Summary metrics: TOTAL XP (with mission/proof split), SURVIVED count, MISSIONS count, PHOTOS count, LONGEST layover.
  - Rank ladder strip showing all 5 ranks with `REACHED`, `CURRENT`, and `LOCKED` states.
  - Layover cards with mission logs, flight/gate details, and photo frames.
  - Empty state: "NO LAYOVERS TO PRINT." with disabled print button.
  - Screen guidance: "THE BROWSER PRINT DIALOG DOUBLES AS 'SAVE AS PDF'."

## Test checklist
- [ ] Alarm fires within 1 s of returnBy
- [ ] Refresh mid-session restores
- [ ] Departure past midnight
- [ ] Safe time <= 0 is blocked
- [ ] Audio blocked -> fallback works
- [ ] Background tab 60 s then return -> ladder catches up
- [ ] Mission never exceeds remaining time
- [ ] Trips RLS blocks cross-user reads/writes
- [ ] Trips offline fallback displays cached departures
- [ ] Unmigrated trips table gracefully falls back to "TRIPS UNAVAILABLE"
- [ ] Photo proof compression resizes 4000px image to <= 1280px and strips EXIF
- [ ] Storage RLS blocks cross-user proof folder access
- [ ] Mission complete with <= 5 min left bypasses camera with "PROOF OFF, LESS THAN 5 MIN LEFT"
- [ ] Alarm trigger while proof modal is open closes modal immediately
- [ ] Offline proofs queue in IndexedDB and upload when back online
- [ ] Placeholder verifier returns "unverified" with badge "PROOF SAVED, NOT CHECKED"
- [ ] Guest photo proof stays in memory only and shows "GUEST PHOTOS ARE NOT SAVED"
- [ ] Rank derives purely from XP (160 XP = level 3 Concourse Runner, 140 XP to Gate Guardian)
- [ ] Tour dismisses instantly on urgent or alarm phase
- [ ] Quest screen with <= 15 min left skips tour with "TOUR SKIPPED, LESS THAN 15 MIN LEFT"
- [ ] InfoTips close on click outside or Escape
- [ ] Printable passport prints single layover or full history with page-break-inside avoid

