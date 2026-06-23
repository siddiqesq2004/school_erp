School ERP — Project Summary

Overview

- Purpose: A lightweight School Enterprise Resource Planning (ERP) system to manage core school operations: student information (SIS), academics, attendance, exams, fees, payroll, transport (with GPS), library services, accounts/finance, communications, and a Management Information System (MIS) dashboard.
- Audience: School administrators, teachers, staff, and developers.

Key Functions (What the project does)

- Authentication & Multi-school support
  - Register a school and an admin account.
  - Login, session via JWT.

- Student Information System (SIS)
  - Manage student records, classes, and sections.
  - Student profiles, guardians, admissions.

- Academic Management
  - Create classes, subjects, exam schedules, and store marks.
  - Timetable, lesson plans, homework submission tracking.

- Attendance
  - Mark student and staff attendance; daily and monthly reports.

- Exams & Results
  - Create exams and subjects, enter marks, generate analyses.

- Fees & Payments
  - Define fee structures, assign fees to students, record payments and summaries.

- Payroll & HR
  - Staff profiles, salary structures, leaves, payroll runs and exports.

- Transport & GPS (Phase 8)
  - Manage vehicles, routes, stops, student allocations.
  - Record GPS locations and query latest positions for vehicles.

- Library Services (Phase 8)
  - Catalog books, issue/return flow, inventory and issue records.

- Accounts & Finance (Phase 8)
  - Account heads, ledger entries, summary reports (debit/credit snapshots).

- Communications
  - Circulars, logs, and integration points for WhatsApp and push notifications (simulation mode available).

- MIS Dashboard (Phase 8)
  - Consolidated KPIs: students, staff, vehicles, routes, books, fees, and finance pulse.

Tech Stack (what we used)

- Backend
  - Node.js + Express (TypeScript)
  - Prisma ORM with SQLite (local dev DB)
  - Authentication: JWT
  - Validation: Zod

- Frontend
  - React (TypeScript) + Vite
  - React Router for routes
  - Zustand for lightweight state store
  - Tailwind CSS for styling
  - UI icons: lucide-react
  - Charts: recharts
  - Maps: leaflet + react-leaflet

- Tooling
  - TypeScript, ESLint (frontend config), Prettier (optional)
  - Concurrently to run frontend and backend dev servers
  - Prisma CLI for schema and client generation

How to run locally (quick)

- Install dependencies from repository root (uses workspaces):

```bash
npm install
```

- Start both dev servers concurrently:

```bash
npm run dev
```

- Backend runs by default on: `http://localhost:5000`
- Frontend (Vite) runs on a local port (e.g. `http://localhost:5176`) — check terminal output.

API notes

- Backend base path: `/api`
- Example endpoints used by frontend:
  - `POST /api/auth/login` — login
  - `GET /api/library/books` — list books
  - `POST /api/library/books` — add a book (requires Authorization header `Bearer <token>`)
  - `POST /api/library/issues` — issue a book
  - `POST /api/library/issues/return` — return a book
  - `GET /api/mis/overview` — MIS KPIs
  - `GET /health` — health check

Current Phase Status (simple)

- Completed: Phases 1 through 12 (development-stage features implemented for all modules)
  - Phase 1..8: Core SIS, academics, attendance, exams, fees, payroll, communications, transport, library, accounts, MIS.
  - Phase 9..12 (completed): Admissions, Government Reports/UDISE, LMS (Courses, Quizzes), Hostel, Canteen POS, Sports, Health, Multi-branch, Support Portal.
  - Regional Focus (completed): Tamil Nadu Samacheer Kalvi integration, Aided Grants, and Tamil templates.

- What remains / recommended next work
  - End-to-end testing and QA across all modules (frontend + backend).
  - Fill out missing or incomplete UI flows (polish UX, handle edge cases and validation messages).
  - Implement migrations for production DB (switch from SQLite to Postgres or MySQL) and add backup strategies.
  - CI/CD pipelines and deployment scripts (staging/production environments).
  - Role-based feature toggles and finer permission checks where required.
  - Mobile-responsive testing and potential native/hybrid app planning.
  - Documentation: developer docs (API spec, deployment guide), user guides for admins/teachers.
  - Monitoring & logging, scheduled backups, and security hardening (rate limiting, helmet, CORS policies tightening).

Notes & Current Assumptions

- The app is in a developer-stage monorepo. Many features are implemented but still require testing and polish.
- By "completed" we mean code for Phase 8 features (backend + frontend pages) have been added; some integration issues (e.g., DB schema push) have been resolved during dev.
- The repo uses SQLite for local development; for production choose a more robust DB and run `prisma migrate` accordingly.

If you want this converted to a prettier README or split into separate `docs/` pages (Architecture, API reference, Runbook), tell me which sections to expand and I’ll create them.
