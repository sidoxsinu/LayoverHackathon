# GATE — Documentation Index

Welcome to the comprehensive documentation suite for **GATE**, built for the **LAYOVER** hackathon at TinkerSpace Calicut (Oct 10–11, 2026).

---

## Suggested Reading Order for Evaluators & Judges

1. **[Judge's Quick Evaluation Guide](demo/JUDGE-GUIDE.md)** — Rubric breakdown, travel connection core rationale, and 60-second live test steps.
2. **[Demo Pitch & Presentation Script](demo/05-PRD-demo-script.md)** — 2-minute pitch, dynamic location proof, and `# ENV` offline reliability flex.
3. **[System Architecture](engineering/ARCHITECTURE.md)** — Dual-engine model: zero-network alarm path vs asynchronous data path.
4. **[Product Requirements & Features](prd/02-PRD-features.md)** — Detailed specification of all 5 screens and 10 core systems.
5. **[Alarm Design & Alert Ladder](engineering/ALARM-DESIGN.md)** — Audio arming, WebAudio oscillator fallback, and stage transitions.
6. **[Database & Row Level Security](engineering/DATABASE-AND-RLS.md)** — PostgreSQL schema, mathematical RLS proof, and anti-abuse triggers.
7. **[Serverless API Routes](engineering/API-ROUTES.md)** — Endpoint contracts, rate limiting, and prompt injection defenses.
8. **[Automated Testing](engineering/TESTING.md)** — Playwright test suite (61 tests) and design system grep compliance.
9. **[Project Walkthrough & Live Log](logs/WALKTHROUGH.md)** — Chronological engineering log, decisions, and known trade-offs.

---

## Documentation Directory Map

### 1. Product Requirements (`docs/prd/`)
- **[00-QUICKREF.md](prd/00-QUICKREF.md)** — One-page summary of design tokens, constraints, and non-negotiable rules.
- **[01-PRD-overview.md](prd/01-PRD-overview.md)** — Mission statement, user persona, problem analysis, and core value proposition.
- **[02-PRD-features.md](prd/02-PRD-features.md)** — Comprehensive feature requirements, edge case table, and guest mode statement.
- **[03-PRD-technical.md](prd/03-PRD-technical.md)** — Technical requirements, time model, audio engine, and test checklists.
- **[04-PRD-ux-design.md](prd/04-PRD-ux-design.md)** — Complete ASCII screen mockups, component hierarchy, and design tokens.
- **[06-PRD-build-plan.md](prd/06-PRD-build-plan.md)** — Hackathon timeline, team split, emergency scenarios, and definition of done.

### 2. Engineering Deep Dives (`docs/engineering/`)
- **[ARCHITECTURE.md](engineering/ARCHITECTURE.md)** — High-level architecture, screen state machine, and data flow.
- **[DATABASE-AND-RLS.md](engineering/DATABASE-AND-RLS.md)** — Database entity-relationship diagram, SQL migrations, and RLS policies.
- **[ALARM-DESIGN.md](engineering/ALARM-DESIGN.md)** — Autoplay bypass, audio arming, WebAudio synthesis, and alert ladder timeline.
- **[API-ROUTES.md](engineering/API-ROUTES.md)** — Serverless API routes contracts, schemas, rate limits, and caching.
- **[TESTING.md](engineering/TESTING.md)** — Test suite architecture, 61 automated tests, and design system audits.

### 3. Demo & Judging (`docs/demo/`)
- **[JUDGE-GUIDE.md](demo/JUDGE-GUIDE.md)** — Judging rubric mapping, mark distributions, and travel connection justification.
- **[05-PRD-demo-script.md](demo/05-PRD-demo-script.md)** — Step-by-step 2-minute demo pitch, DevTools sensor teleportation, and `# ENV` offline demo.

### 4. Logs & Walkthroughs (`docs/logs/`)
- **[WALKTHROUGH.md](logs/WALKTHROUGH.md)** — Single source of truth: status table, error logs, hardcoded hack explanations, and build logs.
- **[TEST-LOG.md](logs/TEST-LOG.md)** — Iteration-by-iteration automated test results and regression tracking.

### 5. Historical Archive (`docs/archive/`)
- Contains early snapshots and duplicates archived to preserve complete hackathon development history.

---
*Last verified against commit `83f76bc` on Oct 11, 2026.*
