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
47: ```bash
48: # Groq API Key for Single-Call Venue Mission Generation
49: GROQ_API_KEY=gsk_your_groq_api_key_here
50: GROQ_MODEL=llama-3.3-70b-versatile
51: 
52: # Supabase Auth & Database
53: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
54: NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
55: ```
56: 
57: *Note: The app will run in "Guest Mode" if the Supabase keys are missing or invalid. If GROQ_API_KEY is missing, the app operates seamlessly on 17 static offline fallback missions.*
58: 
59: ### 4. Vercel Deployment
60: 
61: 1. Connect your repository to Vercel (Root Directory: `gate-next`).
62: 2. In the Vercel project settings, add the Environment Variables (`GROQ_API_KEY`, `GROQ_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
63: 3. Deploy!
64: 
65: ## Testing
66: Run the complete automated Playwright test suite (61/61 tests covering core flow, alert ladder, missions, resilience, edge cases, rank boundaries, photo memories, onboarding tour, print route, and venue missions):
67: ```bash
68: cd gate-next
69: npm run test:e2e
70: # or
71: npx playwright test
72: ```
73: 
74: ## Core Features & Architecture
75: 
76: ### 1. First-Time Onboarding Tour & Context InfoTips
77: - **Spotlight Tour**: Sequential 4-box flat ink dimming (`rgba(16, 16, 16, 0.8)`) with 2px amber target framing. Automatically introduces new users to Setup, Quest, Safe Travels, and Passport screens. Can be skipped anytime in one tap.
78: - **Replay**: Tap "HOW IT WORKS" on Setup or Passport at any time to replay the tour.
79: - **Alarm Isolation**: The tour automatically unmounts immediately if the alert ladder enters urgent or alarm phase. The alarm layer has `z-index: 100`, strictly above the tour (`z-index: 70`).
80: - **Context InfoTips**: Flat `?` buttons beside critical inputs (Safe Time, Walk Time, Vibe, Stats, Proof, Scheduled Trips) that explain airport concepts without clutter.
81: 
82: ### 2. Rank & Level Progression Model
83: - **Centralized XP constants**: `MISSION_XP = 40`, `PROOF_BONUS_XP = 20`.
84: - **Dynamic Rank Derivation**: Ranks are derived dynamically from total XP and never stored as a database enum or state variable.
85: - **10 Progressive Tiers**:
86:   1. Level 1: `GATE ROOKIE` (0 XP) - "JUST LANDED. YOUR FIRST LAYOVER."
87:   2. Level 2: `TERMINAL NOMAD` (50 XP) - "YOU KNOW HOW TO FILL AN AIRPORT HOUR."
88:   3. Level 3: `CONCOURSE RUNNER` (150 XP) - "YOU OWN THE CONCOURSE."
89:   4. Level 4: `GATE GUARDIAN` (300 XP) - "YOU NEVER MISS A BOARDING CALL."
90:   5. Level 5: `TRANSIT LEGEND` (500 XP) - "THE TERMINAL KNOWS YOUR NAME."
91:   6. Level 6: `TARMAC VETERAN` (1000 XP) - "STORMS AND DELAYS CANNOT SHAKE YOU."
92:   7. Level 7: `AIRSPACE NAVIGATOR` (1800 XP) - "EVERY SHORTCUT AND CONCOURSE MAPPED."
93:   8. Level 8: `FLIGHT COMMANDER` (3000 XP) - "MASTER OF MULTI-LEG CONNECTIONS."
94:   9. Level 9: `STRATOSPHERE ELITE` (4600 XP) - "THE GLOBAL AIR NETWORK IS YOUR BACKYARD."
95:   10. Level 10: `APEX VOYAGER` (6500 XP) - "TOP RANK. AN IMMORTAL OF GLOBAL TRANSIT."
96: - **Rank Explainer Sheet**: Tap "WHAT IS THIS?" on Passport or "?" on Safe Travels to open the departure-board ladder showing reached, current, and locked tiers with calculated missions to next rank (with and without proof).
97: 
98: ### 3. Printable Passport & Layover Certificate (`/passport/print`)
99: - Standalone print-optimized document supporting full passport history or single layover certificate (`/passport/print?layover=<id>`).
100: - Airport typography, paper `#E6E1D3` background, A4/Letter margin settings (`@page { margin: 12mm; }`), and `page-break-inside: avoid;` to prevent clipped cards.
101: - Compatible with browser "Save as PDF" and physical printers.
102: 
103: ### 4. Transit Waiting Types & Dynamic Place Labels
104: - Universal support across transit hubs: `FLIGHT`, `TRAIN`, `BUS`, and `OTHER`.
105: - Dynamic signage vocabulary (`DEPARTURE`/`GATE`, `DEPARTURE`/`PLATFORM`, `DEPARTURE`/`BUS STOP OR BAY`, `STARTS AT`/`MEETING POINT`).
106: - Universal 30-minute safe buffer ensures rock-solid alarm reliability across all wait modalities.
107: - Editable custom venue field (max 60 characters), prefilled from geolocation.
108: 
109: ### 5. Venue-Relevant Missions (Single Groq Call & Zero-Blocking Invariant)
110: - **Single Outbound Call**: Tapping START initiates exactly ONE background Groq LLM call per layover (`POST /api/venue-missions`). The client START handler never awaits this call.
111: - **Instant Fallback**: The quest begins instantly on 17 static fallback missions. If Groq succeeds, venue missions are seamlessly folded into the pool; if it fails, is rate limited (5/10min), or times out (12s), the quest continues uninterrupted.
112: - **Deterministic Stats & Anti-Injection**: Stat boosts and XP are calculated purely in application code via `deriveStatEffect(tag)`. Prompt injection defense strips instructions, URLs, and emojis.
113: - **Client Caching**: 12-hour localStorage cache per venue hash (`gate.venuemp.{venueHash}`) prevents repeated API calls for frequent transit hubs.
114: 
115: ## Security Check (RLS)
116: Row Level Security (RLS) is enabled on all tables (`profiles`, `layovers`, `mission_log`, `trips`). The policies explicitly use `auth.uid() = user_id`, meaning it is mathematically impossible for a user to read, update, or delete any rows belonging to another user. Furthermore, the `layovers` table verifies that any assigned `trip_id` must belong to the active authenticated user (`trips.user_id = auth.uid()`), preventing cross-user data tampering.

