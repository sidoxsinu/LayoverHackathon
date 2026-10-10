# GATE — UX & Design (v2)

> A tired, anxious traveler in a loud airport must understand this in 5 seconds. Bigger, darker, clearer.

## Colors
| Token | Hex | Use |
|---|---|---|
| bg | #0A0A0F | Page |
| surface / elevated / border | #13131F / #1C1C2E / #2A2A40 | Cards, inputs, dividers |
| safe | #22C55E | > 3 h |
| caution | #EAB308 | 1–3 h |
| warning | #F97316 | 15 min–1 h, urgent stage |
| danger | #EF4444 | < 15 min |
| alarm | #DC2626 ↔ #7F1D1D | Alarm pulse |
| text | #F8FAFC · #94A3B8 · #64748B | Primary, secondary, muted |

## Type
JetBrains Mono 800 for countdown (`text-6xl`); Inter 400/600/700/900 for everything else. Minimum 16 px, touch targets ≥ 48 px.

## Layout
Portrait, `max-w-sm` centered, `min-h-dvh`, `pb-[env(safe-area-inset-bottom)]`. One primary action per screen at the bottom.

## Screen 1: Setup
```
   ✈️  GATE
   Layover survival mode
 ┌──────────────────────┐
 │ Departs  [18:45] [in X h] │
 │ Gate     [ B14 ]          │
 │ Walk     [2][5][10*][15]  │
 │ Vibe  [⚡Wired][😴Tired][🍔Hungry] │
 └──────────────────────┘
   SAFE TIME  4h 22m
 [      START SURVIVAL →     ]
```
Subtle dot-grid background (`radial-gradient`). Triple-tap wordmark = Demo Mode (tiny "DEMO" chip appears).

## Screen 2: Quest
```
 GATE B14                  XP 80
 RETURN TO GATE IN
   03:42:17        (color-coded)
 ▓▓▓▓▓▓▓▓░░░░ progress
 🔋 ▓▓▓▓▓▓▓░ 78%
 🍔 ▓▓▓░░░░░ 35%  ← pulses < 25
 🧠 ▓▓▓▓▓░░░ 62%
 ┌ MISSION ─────────────┐
 │ 🍽️ HUNGER · ~45 min   │
 │ Find a sit-down…      │
 │ [✅ Complete]  [Skip] │
 └──────────────────────┘
 Log ▾  ✅ Terminal loop  ⏭️ Souvenir
```
Heads-up banner slides in at the top (yellow). Urgent stage tints the whole screen orange and swaps the mission card for "Walk to gate now".

## Screen 3: Alarm
```
        🚨
   GET TO YOUR
      GATE
       B14
 Departs in 37 min.
 Walk now.
 [  I'M AT THE GATE ✅  ]
```
`animate-alarm` background, white text, `text-5xl font-black`, gate `text-7xl`. No animation on mount, no back/close, text from real timestamps.

## Screen 4: Safe Travels + Passport
Dark, calm, ✈️ drifting up. Card (rounded, border-dashed, stamp-style):
```
 LAYOVER PASSPORT
 Survived  3h 12m
 Missions  4   XP 160
 Rank      Gate Guardian
 "Made it with 0 panic."
```
Ranks by XP: 0 Wanderer · 80 Survivor · 160 Gate Guardian · 240+ Layover Legend. Button: "Start new layover".

## Micro-interactions (each < 10 lines, CSS only)
- [ ] Timer color via `transition-colors duration-1000`
- [ ] Stat bars `transition-[width] duration-700`
- [ ] Mission card slide-up via `@keyframes` on key change
- [ ] Green flash overlay 800 ms on Complete
- [ ] Low-stat bar pulse (`animate-pulse`)
- [ ] Alarm: instant mount, no easing

## Accessibility
Every alert is visual + audio + (where supported) haptic. Contrast AA on dark. Alarm text never below 40 px.
