# GATE — Web Application (`gate-next`)

This directory contains the Next.js (App Router) mobile-first web application for **GATE**, built for the **LAYOVER** hackathon at TinkerSpace Calicut.

> [!NOTE]
> For the complete project documentation, architecture diagrams, judging guide, and live demo steps, see the root [README.md](../README.md).

---

## Local Development Commands

All commands should be executed from within this directory (`gate-next/`):

```bash
# 1. Install dependencies
npm ci

# 2. Run local development server (http://localhost:3000)
npm run dev

# 3. Compile optimized production build (Turbopack)
npm run build

# 4. Start local production server
npm start

# 5. Run static lint check
npm run lint

# 6. Execute full automated Playwright test suite (61 tests)
npm run test:e2e
```

---

## Database Migrations

SQL migrations for Supabase are located in `supabase/migrations/`:
1. `0001_init.sql` — Profiles, layovers, and mission logs with Row Level Security.
2. `0002_trips.sql` — Upcoming departures table, 50-trip cap trigger, and foreign key relations.
3. `0003_proofs.sql` — Private storage bucket `proofs`, photo verification columns, and RLS storage policies.
