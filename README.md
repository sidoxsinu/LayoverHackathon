# GATE — Layover Companion

A Next.js (App Router) mobile-first web app for navigating airport layovers. Built for the LAYOVER hackathon.

## Stack
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 (no external UI libraries)
- **Database & Auth:** Supabase (PostgreSQL + Google OAuth)
- **AI Integration:** Google Gemini API

## Setup Instructions

### 1. Database & Authentication (Supabase)

1. Create a new project on [Supabase](https://supabase.com).
2. Go to the SQL Editor and run the migration files provided in `gate-next/supabase/migrations/`:
   ```bash
   # Run 0001 (initial tables, profiles, layovers, mission log)
   cat gate-next/supabase/migrations/0001_init.sql

   # Run 0002 (trips table, triggers, and layovers trip integration)
   cat gate-next/supabase/migrations/0002_trips.sql

   # Run 0003 (proofs storage bucket, mission_log proof columns, and RLS policies)
   cat gate-next/supabase/migrations/0003_proofs.sql
   ```
   *Note: Migration 0003 creates the private `proofs` Storage bucket with 1MB size limit and strict user-folder RLS policies.*
3. Enable Google Auth in Supabase:
   - Go to **Authentication > Providers** and enable Google.
   - You will need a Google Cloud OAuth Client ID and Secret (see below).

### 2. Google Cloud OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (or select an existing one).
3. Go to **APIs & Services > Credentials** and create an **OAuth 2.0 Client ID** (Web application).
4. Configure the **Authorized Redirect URIs**:
   - For local development: `http://localhost:3000/auth/callback`
   - For production (replace with your Vercel URL): `https://gate-next-cyan.vercel.app/auth/callback`
   - **Also add the Supabase Auth URL:** `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/auth/v1/callback`
5. Copy the **Client ID** and **Client Secret** into the Supabase Google Provider settings.

### 3. Environment Variables

Create a `.env.local` file in the `gate-next` directory (copy from `.env.example`):

```bash
# Gemini API Key for AI Mission Generation
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here

# Supabase Auth & Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

*Note: The app will run in "Guest Mode" if the Supabase keys are missing or invalid.*

### 4. Vercel Deployment

1. Connect your repository to Vercel (Root Directory: `gate-next`).
2. In the Vercel project settings, add the Environment Variables (`GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Deploy!

## Testing
Run the complete automated Playwright test suite (38/38 tests covering core flow, alert ladder, missions, resilience, edge cases, rank boundaries, photo memories, onboarding tour, and print route):
```bash
cd gate-next
npm run test:e2e
# or
npx playwright test
```

## Core Features & Architecture

### 1. First-Time Onboarding Tour & Context InfoTips
- **Spotlight Tour**: Sequential 4-box flat ink dimming (`rgba(16, 16, 16, 0.8)`) with 2px amber target framing. Automatically introduces new users to Setup, Quest, Safe Travels, and Passport screens. Can be skipped anytime in one tap.
- **Replay**: Tap "HOW IT WORKS" on Setup or Passport at any time to replay the tour.
- **Alarm Isolation**: The tour automatically unmounts immediately if the alert ladder enters urgent or alarm phase. The alarm layer has `z-index: 100`, strictly above the tour (`z-index: 70`).
- **Context InfoTips**: Flat `?` buttons beside critical inputs (Safe Time, Walk Time, Vibe, Stats, Proof, Scheduled Trips) that explain airport concepts without clutter.

### 2. Rank & Level Progression Model
- **Centralized XP constants**: `MISSION_XP = 40`, `PROOF_BONUS_XP = 20`.
- **Dynamic Rank Derivation**: Ranks are derived dynamically from total XP and never stored as a database enum or state variable.
- **10 Progressive Tiers**:
  1. Level 1: `GATE ROOKIE` (0 XP) - "JUST LANDED. YOUR FIRST LAYOVER."
  2. Level 2: `TERMINAL NOMAD` (50 XP) - "YOU KNOW HOW TO FILL AN AIRPORT HOUR."
  3. Level 3: `CONCOURSE RUNNER` (150 XP) - "YOU OWN THE CONCOURSE."
  4. Level 4: `GATE GUARDIAN` (300 XP) - "YOU NEVER MISS A BOARDING CALL."
  5. Level 5: `TRANSIT LEGEND` (500 XP) - "THE TERMINAL KNOWS YOUR NAME."
  6. Level 6: `TARMAC VETERAN` (1000 XP) - "STORMS AND DELAYS CANNOT SHAKE YOU."
  7. Level 7: `AIRSPACE NAVIGATOR` (1800 XP) - "EVERY SHORTCUT AND CONCOURSE MAPPED."
  8. Level 8: `FLIGHT COMMANDER` (3000 XP) - "MASTER OF MULTI-LEG CONNECTIONS."
  9. Level 9: `STRATOSPHERE ELITE` (4600 XP) - "THE GLOBAL AIR NETWORK IS YOUR BACKYARD."
  10. Level 10: `APEX VOYAGER` (6500 XP) - "TOP RANK. AN IMMORTAL OF GLOBAL TRANSIT."
- **Rank Explainer Sheet**: Tap "WHAT IS THIS?" on Passport or "?" on Safe Travels to open the departure-board ladder showing reached, current, and locked tiers with calculated missions to next rank (with and without proof).

### 3. Printable Passport & Layover Certificate (`/passport/print`)
- Standalone print-optimized document supporting full passport history or single layover certificate (`/passport/print?layover=<id>`).
- Airport typography, paper `#E6E1D3` background, A4/Letter margin settings (`@page { margin: 12mm; }`), and `page-break-inside: avoid;` to prevent clipped cards.
- Compatible with browser "Save as PDF" and physical printers.

## Security Check (RLS)
Row Level Security (RLS) is enabled on all tables (`profiles`, `layovers`, `mission_log`, `trips`). The policies explicitly use `auth.uid() = user_id`, meaning it is mathematically impossible for a user to read, update, or delete any rows belonging to another user. Furthermore, the `layovers` table verifies that any assigned `trip_id` must belong to the active authenticated user (`trips.user_id = auth.uid()`), preventing cross-user data tampering.

