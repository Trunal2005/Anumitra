# Anumitra

**Every approval. Every obligation. Accounted for.**

Approval and Compliance Orchestration · SIH26262: Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System.

Independent student prototype. Fictional records, demonstration policy values and a functioning local adapter. No official AICTE deployment, endorsement or live integration. No paid API, service, inference, hosting or account is required.

## Run locally on this Windows workspace

Prerequisites: Node 20.19+ (or supported Node 22), PostgreSQL 18 binaries and local Mailpit. PostgreSQL binaries here are at `C:/Program Files/PostgreSQL/18/bin`. The downloaded Mailpit executable is in ignored `.local/mailpit.exe`.

```powershell
npm ci
npm run bootstrap
```

Bootstrap creates an isolated password-protected PostgreSQL cluster on **127.0.0.1:55432**, applies migrations, generates 20 fictional institutions and 120 applications, bundles the frontend, separates runtime/migration credentials, and starts Mailpit if the executable is available. Existing demo data is preserved. It never resets an existing database.

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

The API, PostgreSQL and Mailpit must be running for tests. Browser tests use Chromium; first install it with `npx playwright install chromium`. Tests intentionally create fictional records and audit history; they do not destroy/reset the database. Browser verification is headless Chromium, not mocked workflow APIs.

See [demo guide](docs/DEMO_GUIDE.md), [requirements and coverage](docs/REQUIREMENTS.md), [test report](docs/TEST_REPORT.md), [implementation status](docs/IMPLEMENTATION_STATUS.md), [architecture](docs/ARCHITECTURE.md), [permissions](docs/PERMISSIONS.md), [policy register](docs/POLICY_REGISTER.md), [design fidelity](docs/DESIGN_FIDELITY.md), [zero-cost operations](docs/ZERO_COST_SETUP.md), [API contract](docs/API.md), and [security/limitations](docs/SECURITY_AND_LIMITATIONS.md).
