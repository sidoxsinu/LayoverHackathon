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
const KEY = 'gate.v2';
export const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
export const save = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
export const clear = () => localStorage.removeItem(KEY);
```
Call `save(state)` in an effect on state change. On boot: `load()`; if `returnByMs <= Date.now()` and screen is `quest`, set screen to `alarm`.

## AI missions (P2)
`api/missions.js` (Vercel function) calls Gemini with the key from `process.env.GEMINI_API_KEY` and model name from `process.env.GEMINI_MODEL` (check current model name in AI Studio). Prompt: return JSON array of 6 missions with the same shape as above. Client: `Promise.race([fetch('/api/missions', ...), timeout(3000)])`, validate every field, merge into the pool, else ignore. Never needed for the alarm.

## Deploy
```bash
npm run build && npx vercel --prod
```
Open on a real phone over HTTPS, press START in Demo Mode, and verify: sound, vibration (Android), screen stays on, alarm fires with screen on and tab foregrounded.

## Test checklist
- [ ] Alarm fires within 1 s of returnBy
- [ ] Refresh mid-session restores
- [ ] Departure past midnight
- [ ] Safe time ≤ 0 is blocked
- [ ] Audio blocked → fallback works
- [ ] Background tab 60 s then return → ladder catches up
- [ ] Mission never exceeds remaining time
