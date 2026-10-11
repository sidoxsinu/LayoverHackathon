# GATE — UX & Design (v2)

> Airport signage, departure boards, boarding passes, luggage tags. Flat, dense, typographic, confident.

## Design System Tokens

### Palette
| Token | Hex | Usage |
|---|---|---|
| ink | #101010 | Base background |
| panel | #181816 | Cards, header bars, form surfaces |
| line | #34322C | 1px solid borders and dividers |
| paper | #E6E1D3 | Primary text, high-contrast labels, action buttons |
| amber | #F2A900 | Flight times, urgent warnings, active badges |
| signal green | #3F9B5B | Completed state, safe indicators |
| alarm red | #C8201A | Active alarm background, error banners, dangerous status |
| alarm dark | #7A120E | Alarm hard-step alternating color |
| muted text | #8C887C | Subtitles, secondary metadata, table headers |

### Typography
- **Headings, Labels, Countdown**: "Barlow Condensed" (uppercase, tight tracking).
- **Numbers, Times, Gate**: "IBM Plex Mono".
- Minimum text size: 16px. Minimum touch target: 48px height.
- Zero rounded corners above 2px (fully square or max 2px).
- Zero gradients, drop shadows, glows, blurs, or emojis anywhere.

### Layout
- Mobile portrait first: `max-w-sm` (390px), `100dvh`, safe-area insets aware (`env(safe-area-inset-bottom)`).
- Borders: 1px solid `#34322C`. Dividers are rules, never drop shadows or nested boxes.

---

## Screen 1: Auth Screen (No Sample Data)
```
┌──────────────────────────────────────┐
│ 18:45              [SOUND ON / OFF]  │
│ 11 OCT                               │
├──────────────────────────────────────┤
│                                      │
│                GATE                  │
│     LAYOVER SURVIVAL COMPANION       │
│                                      │
├──────────────────────────────────────┤
│ [ SIGN IN WITH GOOGLE (48px)       ] │
│ [ CONTINUE AS GUEST   (48px)       ] │
│                                      │
│ Guests can run layovers.             │
│ Sign in to save trips and your       │
│ Passport.                            │
└──────────────────────────────────────┘
```
- **Top bar**: Left = live clock in mono (HH:MM) with date in muted text below. Right = 48px square sound toggle button.
- **Center**: Wordmark "GATE" in heavy condensed type, paper color, vertically centered in free space with tagline below.
- **Bottom**: Action buttons pinned to bottom with safe-area padding.
- **Footnote**: 16px minimum text size, wraps naturally, never clipped.

---

## Screen 2: Setup Screen (Trip Integration)
60: ```
61: ┌──────────────────────────────────────┐
62: │ [TRIPS]    [PASSPORT]     [SIGN OUT] │
63: ├──────────────────────────────────────┤
64: │ GATE                                 │
65: │ SETUP DEPARTURE                      │
66: │                                      │
67: │ WAITING FOR                          │
68: │ [ FLIGHT ▾] [TRAIN] [BUS] [OTHER]    │
69: │                                      │
70: │ VENUE (OPTIONAL)                     │
71: │ [ TINKERSPACE, CALICUT             ] │
72: │                                      │
73: │ TRIP SELECTOR (Signed-in)            │
74: │ [ 11 OCT 18:45 / FLIGHT TO TOKYO   ▾]│
75: │ FROM TRIP: FLIGHT TO TOKYO           │
76: │ TRIP LOCATION: DOH TERMINAL 1        │
77: │                                      │
78: │ DEPARTURE TIME                       │
79: │ [ 18:45 ]                            │
80: │                                      │
81: │ GATE / PLATFORM / STOP               │
82: │ [ TBA ]                              │
83: │                                      │
84: │ WALK TIME                            │
85: │ [ 2 MIN ] [ 5 MIN ] [ 10 MIN*] [15]  │
86: │                                      │
87: │ VIBE                                 │
88: │ [ WIRED ] [ TIRED ] [ HUNGRY ]       │
89: ├──────────────────────────────────────┤
90: │ SAFE TIME: 4H 22M                    │
91: │ [ START LAYOVER / START WAIT (48px)] │
92: └──────────────────────────────────────┘
93: ```
94: - **WAITING FOR Selector**: Native `ThemeDropdown` offering `FLIGHT`, `TRAIN`, `BUS`, `OTHER`. Maps dynamic place labels (`GATE`, `PLATFORM`, `BUS STOP OR BAY`, `MEETING POINT`). Universal 30-minute buffer applies across all types.
95: - **VENUE Field**: Optional editable input (max 60 chars), prefilled from geolocation reverse geocoding when permission is granted.
96: - **Dynamic Start Button**: `START LAYOVER` for flight, `START WAIT` for train, bus, and other. Triggers exactly ONE non-blocking Groq call in the background without delaying quest start.
97: - **Trip Dropdown**: Square 48px native `<select>`. Lists "MANUAL ENTRY" followed by upcoming trips. Preselects nearest upcoming trip within 24 hours.
98: - Selecting fills departure, gate, walk time; fields remain editable without mutating saved trip.
99: - Shows muted line "FROM TRIP: NAME". Trip location displayed as static text; does not re-run AI or Nominatim geocoding.
100: - If trips table is unmigrated or fails: dropdown is hidden and displays single muted line "TRIPS UNAVAILABLE".
101: 
102: ---
103: 
104: ## Screen 3: Trips Route (`/trips`)
105: Departure-board table displaying real user trips only. Signed-in only.
106: ```
107: ┌──────────────────────────────────────┐
108: │ < BACK                    [+ ADD TRIP│
109: ├──────────────────────────────────────┤
110: │ DEPARTS       TRIP            STATUS │
111: ├──────────────────────────────────────┤
112: │ 11 OCT        FLIGHT TO TYO     IN 3D│
113: │ 18:45         DOH · QR812 · TBA      │
114: ├──────────────────────────────────────┤
115: │ [ USE (48px) ] [ EDIT ] [ DELETE ]   │
116: ├──────────────────────────────────────┤
117: │ 12 OCT        FLIGHT TO LHR     IN 4D│
118: │ 06:10         LHR · BA118 · A12      │
119: ├──────────────────────────────────────┤
120: │ [SHOW PAST (2) ▾]                    │
121: └──────────────────────────────────────┘
122: ```
123: - **Header**: DEPARTS / TRIP / STATUS in muted uppercase.
124: - **Row**: Left = date & time in mono amber (11 OCT over 18:45); middle = name over muted location, flight, gate; right = status (IN 3D, IN 5H, TODAY, PAST).
125: - **Row selection**: Tapping a row reveals three 48px square buttons: `USE` (loads trip into Setup and navigates to `/`), `EDIT`, and `DELETE`.
126: - **Empty state**: Plain text "NO TRIPS SAVED. ADD YOUR NEXT DEPARTURE." with 48px `ADD TRIP` button.
127: - **Offline indicator**: Muted line "OFFLINE, SHOWING SAVED TRIPS" when reading from cache.
128: 
129: ### Delete Confirmation Popup
130: ```
131: ┌──────────────────────────────────────┐
132: │ DELETE TRIP                          │
133: │ DELETE "FLIGHT TO TYO"?              │
134: │ THIS ACTION CANNOT BE UNDONE.        │
135: │                                      │
136: │ [ CONFIRM DELETE (48px red)        ] │
137: │ [ CANCEL (48px panel)              ] │
138: └──────────────────────────────────────┘
139: ```
140: - Flat panel surface with 1px border in `#34322C`. No blur or modal backdrop animations.
141: 
142: ### Add / Edit Trip Form (Full Screen)
143: - Inputs: NAME (required, 1 to 60 characters), LOCATION (max 60), FLIGHT NO (max 12), GATE (max 8, TBA allowed), DEPARTURE DATE and TIME (native inputs with dark color scheme), WALK TO GATE segmented 2/5/10/15 (default 10).
144: - Label: `TIMES USE YOUR DEVICE TIME ZONE.`
145: - Validation error: One line in alarm red (`#C8201A`).
146: - Save button: 48px tall, idempotent upsert with client-generated UUID.
147: 
148: ---
149: 
150: ## Screen 4: Quest Screen
151: ```
152: ┌──────────────────────────────────────┐
153: │ GATE / PLATFORM A12           XP 120 │
154: ├──────────────────────────────────────┤
155: │ RETURN TO GATE / PLATFORM IN         │
156: │ 03:42:17                             │
157: ├──────────────────────────────────────┤
158: │ BATTERY [████████░░] 78%             │
159: │ HUNGER  [███░░░░░░░] 35%             │
160: │ SANITY  [██████░░░░] 62%             │
161: ├──────────────────────────────────────┤
162: │ MISSION M-04 · MOVE · AT TINKERSPACE │
163: │ EXPLORE TERMINAL SHOP WINDOWS        │
164: │ +40 XP · +20 PROOF                   │
165: │                                      │
166: │ [ COMPLETE (48px) ]  [ SKIP (48px) ] │
167: └──────────────────────────────────────┘
168: ```
169: - Countdown in mono amber with dynamic label (`RETURN TO GATE IN`, `RETURN TO PLATFORM IN`, `RETURN TO BUS STOP IN`, `RETURN TO MEETING POINT IN`).
170: - Mission tag displays category (`FOOD`, `MOVE`, `REST`, `PLUG`, `PREP`, `MEET`, `SPOT`).
171: - Venue missions display small muted tag `AT {VENUE}` (e.g. `AT TINKERSPACE`). Static missions show no such tag.
172: - Stats in segmented blocks (10 blocks).
173: - Paper-colored mission card with dashed tear-line.
174: - When photo proof is enabled, card displays `+20 PROOF`.
175: - If 5 minutes or less remain or phase is urgent, card displays muted warning: `PROOF OFF, LESS THAN 5 MIN LEFT` and COMPLETE bypasses proof.
176: 
177: ### Proof Screen Modal (`ProofModal.tsx`)
178: ```
179: ┌──────────────────────────────────────┐
180: │ MISSION PROOF               [CANCEL] │
181: ├──────────────────────────────────────┤
182: │ EXPLORE TERMINAL SHOP WINDOWS        │
183: │                                      │
184: │ REQUIRED PROOF:                      │
185: │ PHOTO OF THE STORE WINDOW DISPLAY    │
186: │                                      │
187: │ NO FACES, ID OR BOARDING PASS.       │
188: │ (OR: ONLY PEOPLE WHO AGREE TO BE IN  │
189: │  THE PHOTO FOR SOCIAL MISSIONS)      │
190: │                                      │
191: │ [ PHOTO PREVIEW BOX (WHEN CHOSEN)  ] │
192: │ 1280x960 PX · 280 KB (JPEG 70%)      │
193: ├──────────────────────────────────────┤
194: │ [ TAKE PHOTO (48px)                ] │
195: │ [ UPLOAD PHOTO (48px)              ] │
196: │ [ SKIP PROOF (48px)                ] │
197: │ (OR: [USE PHOTO (+20 XP)] / [RETAKE])│
198: └──────────────────────────────────────┘
199: ```
- Full-screen takeover, `#101010` background, 1px solid borders.
- Buttons 48px or taller, uppercase Barlow Condensed typography.
- Camera trigger via hidden file input (`capture="environment"`). Upload via standard file input.
- Instant alarm safety: If alarm phase begins while PROOF modal is visible, modal unmounts instantly and alarm triggers.

---

## Screen 5: Alarm Screen
```
┌──────────────────────────────────────┐
│                                      │
│             RETURN TO                │
│               GATE                   │
│                                      │
│                A12                   │
│                                      │
│          DEPARTS IN 35 MIN           │
│              WALK NOW                │
│                                      │
│ [ I'M AT THE GATE (48px)           ] │
│                                      │
└──────────────────────────────────────┘
```
- Full takeover in `#C8201A` hard-stepping to `#7A120E` with `steps(1)`.
- No animation on mount, no close or back action. Only "I'M AT THE GATE" dismisses.
- Text derived strictly from timestamps. Zero network or auth dependency.

---

## Screen 6: Safe Travels + Passport
- Rotated stamp format in mono.
- Displays flight name/trip name when present, layover duration, missions completed, `PHOTOS` count, and `PROOF XP` (+20 per photo).
- Header links for signed-in users: `TRIPS`, `PASSPORT`, `SIGN OUT`.
- 64px square thumbnails rendered for missions completed with photo proof.
- Tapping any thumbnail opens full-screen `PhotoViewerModal`:
  - Mission code, title, status badge (`PROOF SAVED, NOT CHECKED`, etc.).
  - `DELETE PHOTO` action triggers airport-styled confirmation popup (`DELETE PHOTO? THIS CANNOT BE UNDONE.`).
  - Confirm permanently removes object from storage and clears database path.
- Rank Title and "LEVEL x OF 5" stamp displayed in mono.
- Safe Travels includes square 48px "?" button that opens `RankInfoSheet`.
- Passport summary card displays rank title, "LEVEL x OF 5", TOTAL XP, 10-block segmented bar, and "WHAT IS THIS?" button (48px) opening `RankInfoSheet`.

---

## Screen 7: Rank & XP Explainer Sheet (`RankInfoSheet.tsx`)
```
┌──────────────────────────────────────┐
│ RANKS AND XP                 [CLOSE] │
├──────────────────────────────────────┤
│ TRAVELER SUMMARY                     │
│ CONCOURSE RUNNER       LEVEL 03 OF 10│
│ 160 XP · 140 XP TO GATE GUARDIAN     │
│ [███░░░░░░░] 7% INTO RANK            │
│ ABOUT 4 MISSIONS, OR 3 WITH PHOTO    │
│ PROOF                                │
├──────────────────────────────────────┤
│ HOW TO EARN XP                       │
│ COMPLETE A MISSION              +40  │
│ ADD A PHOTO PROOF               +20  │
│ SKIP A MISSION                    0  │
│ XP IS NEVER LOST                     │
├──────────────────────────────────────┤
│ RANK LADDER                          │
│ LV  TITLE       XP      STATUS       │
│ 01  ROOKIE      0       REACHED      │
│ 02  NOMAD       50      REACHED      │
│ 03  RUNNER      150     YOU ARE HERE │
│ 04  GUARDIAN    300     LOCKED       │
│ 05  LEGEND      500     LOCKED       │
│ 06  VETERAN     1000    LOCKED       │
│ 07  NAVIGATOR   1800    LOCKED       │
│ 08  COMMANDER   3000    LOCKED       │
│ 09  ELITE       4600    LOCKED       │
│ 10  VOYAGER     6500    LOCKED       │
├──────────────────────────────────────┤
│ [ CLOSE (48px)                     ] │
└──────────────────────────────────────┘
```
- Full-screen sheet with dense departure-board aesthetic.
- 10 tiers scaling from Gate Rookie (0 XP) to Apex Voyager (6500 XP).
- Ranks marked with `REACHED` (green), `YOU ARE HERE` (amber border), or muted text for locked.
- Shows required missions to advance: calculated without proof (`ceil(xpToNext / 40)`) and with proof (`ceil(xpToNext / 60)`).

---

## Screen 8: Spotlight Onboarding Tour (`Tour.tsx`)
```
┌──────────────────────────────────────┐
│ [4 solid ink dimming rectangles 80%] │
│        ┌──────────────────┐          │
│        │ [2px amber frame]│          │
│        │  TARGET ELEMENT  │          │
│        └──────────────────┘          │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ STEP 1 / 6           [SKIP TOUR] │ │
│ │ DEPARTURE TIME                   │ │
│ │ SET YOUR SCHEDULED BOARDING OR   │ │
│ │ DEPARTURE TIME.                  │ │
│ │                                  │ │
│ │ [ BACK (48px) ] [ NEXT (48px) ]  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```
- Flat 4-rectangle dimming in solid ink at 80% opacity (`rgba(16, 16, 16, 0.8)`).
- 2px amber outline frame with 4px padding around focused element. Zero shadows or blurs.
- Target auto-scrolls into view with safety padding.
- Re-measuring on resize, scroll, and orientation change.
- "HOW IT WORKS" replay link restarts the tour at any time.
- Emergency unmount: Instant unmount if alarm phase becomes urgent or alarm.

---

## Screen 9: Context InfoTips (`InfoTip.tsx`)
```
┌──────────────────────────────────────┐
│ SAFE TIME [?]                        │
│ ┌──────────────────────────────────┐ │
│ │ SAFE TIME EXPLAINER      [CLOSE] │ │
│ │ SAFE TIME = DEPARTURE MINUS      │ │
│ │ (30 MIN BOARDING + WALK + 5 MIN) │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```
- 48px square touch button labeled `?`.
- Popover panel rendered with 1px solid line border `#34322C` and solid `#181816` panel background.
- Single-active listener: opening any tip dismisses other active tips.
- Dismisses on click-outside, close button tap, or Escape key.

---

## Screen 10: Printable Passport Route (`/passport/print`)
```
┌──────────────────────────────────────┐
│ GATE LAYOVER PASSPORT                │
│ TRAVELER: GUEST TRAVELER             │
│ ISSUED: 11 OCT 2026                  │
│                                      │
│ [ LEVEL 3 OF 5 - CONCOURSE RUNNER ]  │
│                                      │
│ TOTAL XP: 160 (120 MISSION / 40 PROOF)
│ SURVIVED: 2 · MISSIONS: 3 · PHOTOS: 2│
├──────────────────────────────────────┤
│ RANK LADDER PROGRESSION              │
│ 01 ROOKIE [✓]  02 NOMAD [✓]          │
│ 03 RUNNER [*]  04 GUARDIAN [ ]       │
│ 05 LEGEND [ ]                        │
├──────────────────────────────────────┤
│ LAYOVER 1: DXB TERMINAL 3            │
│ TIME: 3H 45M · MISSIONS: 2 · PHOTOS:1│
│ M-04 EXPLORE SHOPS · +40 XP · [PHOTO]│
│ M-12 COFFEE TIME   · +40 XP          │
├──────────────────────────────────────┤
│ [ PRINT PASSPORT / SAVE PDF ]        │
└──────────────────────────────────────┘
```
- Standalone print-optimized layout on `#E6E1D3` paper background.
- Configured with `@page { margin: 12mm; }` and `-webkit-print-color-adjust: exact`.
- Cards prevent page break cuts via `break-inside: avoid; page-break-inside: avoid;`.
- Query param support: `/passport/print` prints all layovers; `/passport/print?layover=<id>` prints single certificate.
- On-screen helper text: "THE BROWSER PRINT DIALOG DOUBLES AS 'SAVE AS PDF'."
