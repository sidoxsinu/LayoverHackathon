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

## Security Check (RLS)
Row Level Security (RLS) is enabled on all tables (`profiles`, `layovers`, `mission_log`, `trips`). The policies explicitly use `auth.uid() = user_id`, meaning it is mathematically impossible for a user to read, update, or delete any rows belonging to another user. Furthermore, the `layovers` table verifies that any assigned `trip_id` must belong to the active authenticated user (`trips.user_id = auth.uid()`), preventing cross-user data tampering.
