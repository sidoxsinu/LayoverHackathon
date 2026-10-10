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
```
┌──────────────────────────────────────┐
│ [TRIPS]    [PASSPORT]     [SIGN OUT] │
├──────────────────────────────────────┤
│ GATE                                 │
│ SETUP DEPARTURE                      │
│                                      │
│ TRIP SELECTOR (Signed-in)            │
│ [ 11 OCT 18:45 / FLIGHT TO TOKYO   ▾]│
│ FROM TRIP: FLIGHT TO TOKYO           │
│ TRIP LOCATION: DOH TERMINAL 1        │
│                                      │
│ DEPARTURE TIME                       │
│ [ 18:45 ]                            │
│                                      │
│ GATE                                 │
│ [ TBA ]                              │
│                                      │
│ WALK TO GATE                         │
│ [ 2 MIN ] [ 5 MIN ] [ 10 MIN*] [15]  │
│                                      │
│ VIBE                                 │
│ [ WIRED ] [ TIRED ] [ HUNGRY ]       │
├──────────────────────────────────────┤
│ SAFE TIME: 4H 22M                    │
│ [ START SURVIVAL (48px)            ] │
└──────────────────────────────────────┘
```
- **Trip Dropdown**: Square 48px native `<select>`. Lists "MANUAL ENTRY" followed by upcoming trips. Preselects nearest upcoming trip within 24 hours.
- Selecting fills departure, gate, walk time; fields remain editable without mutating saved trip.
- Shows muted line "FROM TRIP: NAME". Trip location displayed as static text; does not re-run AI or Nominatim geocoding.
- If trips table is unmigrated or fails: dropdown is hidden and displays single muted line "TRIPS UNAVAILABLE".

---

## Screen 3: Trips Route (`/trips`)
Departure-board table displaying real user trips only. Signed-in only.
```
┌──────────────────────────────────────┐
│ < BACK                    [+ ADD TRIP│
├──────────────────────────────────────┤
│ DEPARTS       TRIP            STATUS │
├──────────────────────────────────────┤
│ 11 OCT        FLIGHT TO TYO     IN 3D│
│ 18:45         DOH · QR812 · TBA      │
├──────────────────────────────────────┤
│ [ USE (48px) ] [ EDIT ] [ DELETE ]   │
├──────────────────────────────────────┤
│ 12 OCT        FLIGHT TO LHR     IN 4D│
│ 06:10         LHR · BA118 · A12      │
├──────────────────────────────────────┤
│ [SHOW PAST (2) ▾]                    │
└──────────────────────────────────────┘
```
- **Header**: DEPARTS / TRIP / STATUS in muted uppercase.
- **Row**: Left = date & time in mono amber (11 OCT over 18:45); middle = name over muted location, flight, gate; right = status (IN 3D, IN 5H, TODAY, PAST).
- **Row selection**: Tapping a row reveals three 48px square buttons: `USE` (loads trip into Setup and navigates to `/`), `EDIT`, and `DELETE`.
- **Empty state**: Plain text "NO TRIPS SAVED. ADD YOUR NEXT DEPARTURE." with 48px `ADD TRIP` button.
- **Offline indicator**: Muted line "OFFLINE, SHOWING SAVED TRIPS" when reading from cache.

### Delete Confirmation Popup
```
┌──────────────────────────────────────┐
│ DELETE TRIP                          │
│ DELETE "FLIGHT TO TYO"?              │
│ THIS ACTION CANNOT BE UNDONE.        │
│                                      │
│ [ CONFIRM DELETE (48px red)        ] │
│ [ CANCEL (48px panel)              ] │
└──────────────────────────────────────┘
```
- Flat panel surface with 1px border in `#34322C`. No blur or modal backdrop animations.

### Add / Edit Trip Form (Full Screen)
- Inputs: NAME (required, 1 to 60 characters), LOCATION (max 60), FLIGHT NO (max 12), GATE (max 8, TBA allowed), DEPARTURE DATE and TIME (native inputs with dark color scheme), WALK TO GATE segmented 2/5/10/15 (default 10).
- Label: `TIMES USE YOUR DEVICE TIME ZONE.`
- Validation error: One line in alarm red (`#C8201A`).
- Save button: 48px tall, idempotent upsert with client-generated UUID.

---

## Screen 4: Quest Screen
```
┌──────────────────────────────────────┐
│ GATE A12                      XP 120 │
├──────────────────────────────────────┤
│ RETURN TO GATE IN                    │
│ 03:42:17                             │
├──────────────────────────────────────┤
│ BATTERY [████████░░] 78%             │
│ HUNGER  [███░░░░░░░] 35%             │
│ SANITY  [██████░░░░] 62%             │
├──────────────────────────────────────┤
│ MISSION M-04 · MOVE                  │
│ EXPLORE TERMINAL SHOP WINDOWS        │
│ +40 XP · +20 PROOF                   │
│                                      │
│ [ COMPLETE (48px) ]  [ SKIP (48px) ] │
└──────────────────────────────────────┘
```
- Countdown in mono amber. Digits update cleanly without easing or blur.
- Stats in segmented blocks (10 blocks).
- Paper-colored mission card with dashed tear-line.
- When photo proof is enabled, card displays `+20 PROOF`.
- If 5 minutes or less remain or phase is urgent, card displays muted warning: `PROOF OFF, LESS THAN 5 MIN LEFT` and COMPLETE bypasses proof.

### Proof Screen Modal (`ProofModal.tsx`)
```
┌──────────────────────────────────────┐
│ MISSION PROOF               [CANCEL] │
├──────────────────────────────────────┤
│ EXPLORE TERMINAL SHOP WINDOWS        │
│                                      │
│ REQUIRED PROOF:                      │
│ PHOTO OF THE STORE WINDOW DISPLAY    │
│                                      │
│ NO FACES, ID OR BOARDING PASS.       │
│ (GUEST PHOTOS ARE NOT SAVED)         │
│                                      │
│ [ PHOTO PREVIEW BOX (WHEN CHOSEN)  ] │
│ 1280x960 PX · 280 KB (JPEG 70%)      │
├──────────────────────────────────────┤
│ [ TAKE PHOTO (48px)                ] │
│ [ UPLOAD PHOTO (48px)              ] │
│ [ SKIP PROOF (48px)                ] │
│ (OR: [USE PHOTO (+20 XP)] / [RETAKE])│
└──────────────────────────────────────┘
```
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
