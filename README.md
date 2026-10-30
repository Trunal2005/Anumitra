# Anumitra

**Every approval. Every obligation. Accounted for.**

Approval and Compliance Orchestration · SIH26262: Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System.

Independent student prototype. Fictional records, demonstration policy values and a functioning local adapter. No official AICTE deployment, endorsement or live integration. No paid API, service, inference, hosting or account is required.

Start with the setup commands below. The [documentation index](docs/README.md) separates implementation guides, current verification and historical reports. Requirements are maintained in [the A–F matrix](docs/REQUIREMENTS.md); the old AI build prompt is no longer part of the project tree.

## Operational iteration — 30 October 2026

The authenticated application now uses a compact charcoal navigation, light canvas and white operational surfaces. Role-specific Action desks, a server-paginated Review queue, evidence-first case review, an EVC week/agenda planner, a distinct Committee agenda, a Compliance ledger, split Evidence review and a constrained visual policy editor expose the existing guarded workflow. Public welcome branding is preserved. Record-update connectivity is labelled **Updates connected**, without implying a live AICTE feed.

Three separate read-only **2025–26 public reference profiles** retain field-level publisher/page links, dates, extraction method and checksums. They do not create operational cases or establish 2026–27 approval. Team human sign-off is pending. See [public-source inventory](docs/PUBLIC_REFERENCE_INVENTORY.md). Fictional drafts, unclassified legacy records and authorized-pilot tags remain distinguishable; no pilot feed is configured.

Metadata imports now use an atomic locked batch with fresh permission/state/payload checks. The entry source reproduced partial commit, stale editable-state and concurrent conflicting-payload defects; the repair and retained failed attempts are described in [the operational report](docs/OPERATIONS_ITERATION_2026-10-30.md).

The complete sequential `npm run verify:isolated -- --evidence-dir=docs/evidence/operations-2026-10-30/full-3` gate passed on source **`14002e4e79b0d865f3c6715419c9ba61c405e44c`**: **41 backend tests with no skips, all ten Chromium journeys, and both API restart preservation checks**. TypeScript and the isolated frontend build passed in that gate. Formatting and dependency audit passed (zero advisories at retrieval). The normal production build, strict readiness and read-only browser checks also passed, preserving existing records, credentials and private bytes. See the [dated report](docs/TEST_REPORT_2026-10-30.md), [before/after gallery](docs/OPERATIONS_VISUAL_REVIEW_2026-10-30.md) and [A–F coverage](docs/REQUIREMENTS.md). Earlier failures are retained with their original manifests. Documentation/evidence commits after the tested source do not change its implementation digest. Hosted status must be checked for each published SHA in [GitHub Actions](https://github.com/Trunal2005/Anumitra/actions); local success does not establish a hosted result.

Partial coverage remains for historical missing waiting intervals (B2), exhaustive report/export/filter combinations (F3) and authorized external integration. Official numerical policy, local Compose and complete accessibility/security assurance remain unverified; malware/authenticity scanning and an authorized live connector are missing. No measured efficiency gain, production readiness or selection probability is claimed. No project licence has been selected.

## Run locally on this Windows workspace

For a fresh installation only, prerequisites are Node 20.19+ (or supported Node 22), PostgreSQL 18 binaries and local Mailpit. PostgreSQL binaries here are at `C:/Program Files/PostgreSQL/18/bin`. The downloaded Mailpit executable is in ignored `.local/mailpit.exe`.

```powershell
npm ci
npm run bootstrap
```

Bootstrap creates an isolated password-protected PostgreSQL cluster on **127.0.0.1:55432**, applies migrations, generates 20 fictional institutions and 120 applications, bundles the frontend, separates runtime/migration credentials, and starts Mailpit if the executable is available. Existing demo data is preserved. It never resets an existing database.

After updating source, run `npm run build` before restarting the API. This iteration adds no schema migration. For this existing workspace, a restart does not require bootstrap, migrations or seeding. If PostgreSQL is stopped, start the existing cluster with `& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D .local/db -l .local/postgres.log -o '-p 55432 -h 127.0.0.1' -w start`. Start local Mailpit with `.local/mailpit.exe --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025 --database .local/mailpit.db`, then start API and worker below. Check for existing processes before starting duplicates.

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
| `apps/web` | Specialised React operational workspaces, light authenticated canvas, preserved public branding and local fonts |
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
