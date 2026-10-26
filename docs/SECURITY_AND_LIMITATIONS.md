# Security and limitations

Implemented and exercised: bcrypt password hashing; PostgreSQL-backed sessions; logout/expiry/security-version checks; HttpOnly/SameSite cookies; CSRF tokens and origin checks; login/recovery throttling; input validation and parameterized database queries; scoped command/read/export/download checks; private randomized evidence keys; bounded uploads with type/header checks; active PDF token rejection; CSP sandbox/nosniff on preview; safe CSV formula prefixes; immutable snapshots/decisions/audits; row-lock/version/idempotency concurrency; EVC participant locking; restricted runtime role separated from migration owner; local-only SMTP capture.

HTTPS production cookies require Secure. Native verified mode uses HTTP loopback and development cookies. Do not expose the development setup to a public network. Production refuses DEMO_MODE=true; no production identity provisioning or official deployment is claimed.

Important limits:

- Primary APH and 2026–27 addendum access succeeded on the repair recheck; the earlier HTTP 403 is historical. Applicability, timelines, EVC quorum and demonstration eligibility remain unverified demo configuration. They are not official rules.
- No authorized live AICTE integration exists. JSON/CSV local adapters work; official integration is blocked by absent authorized endpoint/access, not simulated as success.
- Native PostgreSQL/Mailpit is the verified local route. Local Compose deployment remains unverified; the earlier engine-unavailable check is historical. Hosted CI service containers passed for source 9ad109d, which does not verify the application's Compose bootstrap/privilege/restart path.
- No malware scanner or document authenticity verification is installed. NOT_SCANNED is visible. Header/token validation is not a complete malware analysis engine. No encryption-at-rest or tamper-proof audit claim is made. Host database owners can alter schema/triggers, and host operators can access private bytes/secrets.
- Worker coordination is intentionally single-coordinator per database, protected by a PostgreSQL session advisory lock. No national-scale availability/performance claim is made. SMTP acceptance can be ambiguous after a crash; those records require explicit authorized review/retry.
- Rules support constrained acyclic ordered routes, explicit human deficiency loops, fixed permission guards, category/evidence requirements and calendar-day demonstration deadlines. Arbitrary executable rules, general BPMN graphs and statutory business-day calendars are not implemented or claimed.
- This is a prototype permission model. It does not constitute a statutory committee or replace human scrutiny, inspections, appointments or decisions.
- Automated scenario results are not user research or proof of reduced manual effort. No baseline human task study, selection guarantee, machine-learning accuracy or external email delivery is claimed.

Audit rows are protected from ordinary API mutation and the runtime role cannot edit/delete them. This is append-only application behavior, not cryptographic or privileged-owner tamper proofing. Passwords, database credentials, private files and backups are excluded from Git.


Repair controls: each scope dimension intersects within a grant and separate grants form a union. Global official access and global delegation are explicit. Mixed-role history/file access is evaluated per case. Stage attempts have a partial unique active index and range exclusion constraint. Published policy writes use saved revision/hash checks under row locks. Upload compensation retains uncertain bytes and markers for investigation; reconciliation never hides missing referenced files.

Delivery uses independent retry generations and retained attempt history. SMTP acceptance followed by a database acknowledgement failure is AMBIGUOUS; operator retry explicitly acknowledges potential duplicates. A stale/completed pg-boss ID cannot hold a new manual generation. Escalations have persisted recipients/level/policy/state and closure audit; arbitrary recipient override and automatic legal penalties are not implemented.

The worker has a separate non-superuser account: it reads source records and writes queue/notification/escalation/heartbeat/audit data. It cannot insert decisions or update application state. A narrow Application.updatedAt update privilege permits PostgreSQL row locking. API and migration identities remain separate. Host owners still control credentials/files/schema; no hardened operating-system service isolation or privileged-owner tamper proofing is claimed.

Verification covers synthetic scenarios and selected real browser journeys. Missing/failed/cancelled transport states are reconciled in source; finite tests do not establish every crash ordering or arbitrary multi-node resilience. A clean native dependency install/database preparation and repeat startup are tested separately from the still-unexecuted container path. No human comparison study exists, so no reduced-follow-up percentage is claimed.


Each immutable document version receives one official review decision. Review corrections require a new version; API runtime grants also prohibit rewriting/deleting DocumentReview rows. Rejecting a replacement does not resolve prior effective-expiry reminders. Appointment cancellation is a reasoned administrative coordinator action; it does not cancel a regulatory application or decide its outcome. Hosted CI is restricted to public repositories, preventing implicit billed private-repository runner usage; local verification requires no cloud account.

## Product review — 26 October 2026

A reproduced institution-master preview scope gap is repaired: each imported master now intersects the caller's institution, region and bureau constraints, and the entire batch commits atomically only after an actor/grant/input/snapshot-bound persisted preview. Conflicting existing records are not overwritten, duplicate IDs and unknown regions are rejected, and source provenance remains FICTIONAL_SIMULATION or UNVERIFIED_LOCAL. The local simulator is not an official sandbox. No public-directory reuse terms, approval-workflow API contract or government credentials were verified in the current source recheck.

Zod 4.1.12 was affected by high-severity advisory GHSA-mrhx-c7xc-m3w5 in the reproduced dependency audit. The dependency and lockfile now pin patched 4.6.7. The public CI job on 679b12b passed its workflow tests but failed the audit step; it must not be described as a wholly successful job. Current execution and any later CI result are recorded separately in [the dated product report](TEST_REPORT_2026-10-26.md). Earlier zero-advisory results remain dated historical evidence, not a guarantee about newly disclosed advisories.

Human-readable reports and richer scoped history do not create authenticity verification, statutory authority, cryptographic immutability or production certification. Normal data and secrets are preserved; all new regression mutations use isolated test state.
