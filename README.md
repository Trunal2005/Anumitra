# Anumitra

**Every approval. Every obligation. Accounted for.**

Approval and Compliance Orchestration · SIH26262: Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System.

Independent student prototype. Fictional records, demonstration policy values and a functioning local adapter. No official AICTE deployment, endorsement or live integration. No paid API, service, inference, hosting or account is required.

## Correctness repair checkpoint

The existing React/Express/PostgreSQL application includes the October 2026 submission audit repairs. It is an independent local prototype, not production-ready. Implemented areas include authentication, intersected role scope, private evidence and PDF preview, repeated deficiency/response cycles, five route families, EVC/committee recommendations, human decisions, undertakings, effective-document renewal, designated escalation events, durable retries, six reports and versioned demo policies.

Use [current audit verification](docs/TEST_REPORT_REPAIR.md), [readiness](docs/SUBMISSION_READINESS.md), [classified A–F coverage](docs/REQUIREMENTS.md) and [limitations](docs/SECURITY_AND_LIMITATIONS.md). The original reports remain historical evidence. Local Compose execution remains unverified. Hosted CI passed for audited source 9ad109d in [run 39942039627](https://github.com/Trunal2005/Anumitra/actions/runs/39942039627). Official numeric configuration, authorised live integration and antivirus protection are not claimed. No project licence has been selected.

The complete `npm run verify:isolated` gate passed again on audited source `9ad109d664a891f2657f95ce54a8f3bd5e9808b8`: 31 backend tests, API restart preservation and all four browser journeys in one sequential invocation. Supplemental actual UI checks verified authority-only extension/waiver and audit history. No new runtime defect was reproduced; application source and orange/gold design were preserved. Partial coverage is explicit in the matrix. Earlier full-run failures remain historical.

## Run locally on this Windows workspace

Prerequisites: Node 20.19+ (or supported Node 22), PostgreSQL 18 binaries and local Mailpit. PostgreSQL binaries here are at `C:/Program Files/PostgreSQL/18/bin`. The downloaded Mailpit executable is in ignored `.local/mailpit.exe`.

```powershell
npm ci
npm run bootstrap
```

Bootstrap creates an isolated password-protected PostgreSQL cluster on **127.0.0.1:55432**, applies migrations, generates 20 fictional institutions and 120 applications, bundles the frontend, separates runtime/migration credentials, and starts Mailpit if the executable is available. Existing demo data is preserved. It never resets an existing database.

For this already upgraded workspace, a restart does not require bootstrap, migrations or seeding. If PostgreSQL is stopped, start the existing cluster with `& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D .local/db -l .local/postgres.log -o '-p 55432 -h 127.0.0.1' -w start`. Start local Mailpit with `.local/mailpit.exe --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025 --database .local/mailpit.db`, then start API and worker below. Check for existing processes before starting duplicates.

Start these in two terminals:

```powershell
npm start
```

```powershell
npm run worker
```

- Application: http://127.0.0.1:3000
- Local SMTP inbox: http://127.0.0.1:8025
- API readiness: http://127.0.0.1:3000/api/health
- API description: http://127.0.0.1:3000/api/openapi.json

Passwords are securely generated and saved only in **`.local/demo-credentials.json`**. Open that local file to copy the password. Account examples: `institution.a@anumitra.test`, `reviewer.north@anumitra.test`, `supervisor.north@anumitra.test`, `committee.evc@anumitra.test`, `committee.sac@anumitra.test`, `committee.shc@anumitra.test`, `authority@anumitra.test`, `bureau@anumitra.test`, `auditor@anumitra.test`, `admin@anumitra.test`. They are isolated users with distinct grants; switching requires sign-out/sign-in.

For source reload with API, Vite and worker together:

```powershell
npm run dev
```

Use http://127.0.0.1:5173 for Vite. Stop any existing worker before starting `dev`; the worker enforces one coordinator per database. Built same-origin mode at port 3000 is the default verified demonstration.

## Source and checks

| Location | Purpose |
|---|---|
| `apps/web` | React operational UI, exact dark orange/gold tokens, local fonts |
| `apps/web/src/PdfPreview.tsx` | Authenticated PDF.js canvas preview, page navigation and accessible extracted text |
| `apps/api` | Authenticated Express API, private storage, scoped SSE and reports |
| `apps/worker` | Separate durable pg-boss notification coordinator |
| `packages/domain` | Transactional workflows, grants, scheduling, reminders and ageing |
| `packages/contracts` | Shared allowlisted validation schemas |
| `packages/db` | Prisma schema, additive SQL migrations, fictional seed |
| `tests` | Real PostgreSQL/API scenarios and Chromium journeys |
| `docs/evidence` | Actual screenshots and measured verification artifacts |

```powershell
npm run typecheck
npm run build
npm test
npm run test:browser
npm run format:check
npm audit
```

Tests provision their own disposable database, storage, credentials, API (3100) and Mailpit (1125/8125), using the configured local migration owner. The normal demo is refused as a test target. Install Chromium with `npx playwright install chromium`. Run `npm run verify:isolated` for the complete real-API/browser verification; no reset/drop cleanup runs.

See [demo guide](docs/DEMO_GUIDE.md), [requirements and coverage](docs/REQUIREMENTS.md), [test report](docs/TEST_REPORT.md), [implementation status](docs/IMPLEMENTATION_STATUS.md), [architecture](docs/ARCHITECTURE.md), [permissions](docs/PERMISSIONS.md), [policy register](docs/POLICY_REGISTER.md), [design fidelity](docs/DESIGN_FIDELITY.md), [zero-cost operations](docs/ZERO_COST_SETUP.md), [API contract](docs/API.md), and [security/limitations](docs/SECURITY_AND_LIMITATIONS.md).
