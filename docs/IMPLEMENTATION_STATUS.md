# Implementation status — repair, 23 October 2026

The existing architecture and orange/gold design are retained. Current changes add shared intersected grant scope/assignment/delegation, central stage intervals with database non-overlap constraints, current-attempt negative recommendations and human adverse decisions, effective-document renewal semantics, staged uploads/cleanup, stage-specific deadlines, persisted designated escalation/acknowledgement, retry generations, locked policy publication, shared overdue subjects, separate restricted worker credentials, readiness and isolated verification/CI.

Use [TEST_REPORT_REPAIR](TEST_REPORT_REPAIR.md) for the final source identity and actual executed results; [REQUIREMENTS](REQUIREMENTS.md) maps every A–F bullet. The historical execution below belongs to the original reviewed checkpoint and must not be substituted for the repair results.

Final continuation checks on source 0d6faa2: 31 backend/operations/repair tests passed; all four unchanged browser journeys passed on a sequential rerun; typecheck, build, formatting and zero-advisory audit passed. Clean-copy installation/database preparation and a separate 157-file restore passed. The first full command failed one browser timing assertion during concurrent clean-copy work; that trace and its limits remain in the dated report. This is a local verification checkpoint, not hosted CI or production certification.

Published existing policies and case pins remain unchanged; new fictional seeds demonstrate different stage windows and escalation levels. Existing credentials, institutional records, private files and old audit evidence are preserved. Legacy missing waiting time remains unknown rather than fabricated. Docker execution, hosted CI and official deployment are not claimed. Primary policy sources became accessible on recheck, but configured numeric values remain DEMO. No paid service, AI feature, licence, production certification or reduction percentage was introduced.

## Historical implementation status — original checkpoint

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
