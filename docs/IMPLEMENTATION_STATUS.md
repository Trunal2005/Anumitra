# Implementation status • 22 October 2026

Anumitra is a running local TypeScript application covering SIH26262 groups A–F: real PostgreSQL persistence, authenticated/scoped workspaces, immutable evidence, scrutiny/deficiency/re-scrutiny, five configured routes, separate committees/decisions, obligations, validity, durable jobs, Mailpit, dashboards, reports, policy lifecycle and local adapters. Source is in apps/, packages/, scripts/ and tests/; actual screenshots are in docs/evidence/.

Executed: three migrations, deterministic seed/new-run reset, 17 passing backend/operations tests, two passing Chromium journeys, typecheck, production build, formatting, scope/concurrency guards, worker restart/enqueue-before-ack recovery, ambiguous SMTP handling, 324-byte-version backup/restore verification, production-demo refusal and zero-advisory dependency audit. TEST_REPORT states exact finite coverage, timings and verification limits.

The active demo was recreated with 120 fictional cases across four regions and 20 participating institutions. Historical runs/tests/bytes remain private; browser tests may add a case. Passwords are in ignored .local/demo-credentials.json. Runtime and migration credentials are separate ignored files. API and worker were started for handoff.

URLs: application http://127.0.0.1:3000; Mailpit http://127.0.0.1:8025; PostgreSQL loopback port 55432. On a later session: npm run bootstrap, then npm start and npm run worker in separate terminals. Stop an existing worker first; a PostgreSQL advisory lock prevents duplicate coordinators. npm run demo:reset creates a new namespace and preserves prior history; production refuses demo mode.

Genuine blockers/limits:

- Docker engine is stopped. Native PostgreSQL/Mailpit is verified; Compose is supplied but unverified.
- Current primary policy/addendum verification is incomplete (addendum HTTP 403). Deadlines/quorum/eligibility remain labelled demo assumptions.
- No authorized official AICTE endpoint/access exists. LOCAL_ADAPTER works; LIVE_AUTHORIZED is refused without an installed adapter.
- No malware scanner is configured. NOT_SCANNED is explicit; authenticity, encryption at rest and privileged-owner tamper proofing are not claimed.
- Constrained ordered acyclic routes and calendar-day demo policies are implemented, rather than arbitrary BPMN or a verified statutory business calendar. No production-scale/human-effort benchmark or exhaustive test of every branch is claimed.

Preserve this implementation and append migrations when continuing; do not reset history or substitute frontend mock persistence. README contains exact restart/test commands and required documentation links.
