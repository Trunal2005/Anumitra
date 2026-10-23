# Submission readiness — repair review, 23 October 2026

Anumitra is an independent SIH26262 student prototype. Submission readiness means a reproducible synthetic demonstration, scoped access, correct tested workflows and traceable human decisions. It does not mean official approval, production certification or guaranteed selection.

The twelve reviewed findings and their regression mapping are in [REPAIR_PLAN](REPAIR_PLAN.md). Current execution results, revision, failures and environmental limits belong to [TEST_REPORT_REPAIR](TEST_REPORT_REPAIR.md); the original TEST_REPORT is historical evidence.

The complete isolated gate passed on source 3c01372a7002c496b4c9eeb3fe3bc8123d88c547: 31 backend tests, API restart preservation and all four browser journeys in one sequential invocation. The upload test now waits for the committed version and refreshed application response, retaining its five-second UI assertion. The original failure remains historical.

Supported primary environment: Windows, Node 20.19.4, native PostgreSQL 18, local Mailpit and Chromium. Install dependencies, generate Prisma, apply additive migrations with the migration account, provision the restricted runtime account, build, then start API and worker separately. See README and ZERO_COST_SETUP. Tests provision their own database, credentials, ports and storage; they refuse the normal demo.

External limitations remain explicit:

- Docker engine unavailable on the development host. The revised Compose bootstrap separates owner/runtime accounts, but container execution and restart persistence are unverified.
- CI workflow is supplied; local execution is evidence. A hosted Actions run is not claimed until actually observed.
- The APH and 2026–27 addendum were accessible on recheck. Applicability, statutory deadlines, required composition, calendars and appointments still need a qualified policy owner. Every configured numeric rule remains DEMO.
- No authorised live AICTE adapter or government credentials exist. The local adapter creates drafts and keeps mappings/sync history.
- Upload header/token checks do not provide antivirus or authenticity verification. Files retain NOT_SCANNED status.
- No national-scale, complete accessibility, exactly-once SMTP or measured manual-effort-reduction claim is made.

No paid service, inference, trial credit, compulsory cloud account, deployment or new project licence was added. Operational data, credentials, backups and test service logs stay ignored.
