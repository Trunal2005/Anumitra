# Security and limitations

Implemented and exercised: bcrypt password hashing; PostgreSQL-backed sessions; logout/expiry/security-version checks; HttpOnly/SameSite cookies; CSRF tokens and origin checks; login/recovery throttling; input validation and parameterized database queries; scoped command/read/export/download checks; private randomized evidence keys; bounded uploads with type/header checks; active PDF token rejection; CSP sandbox/nosniff on preview; safe CSV formula prefixes; immutable snapshots/decisions/audits; row-lock/version/idempotency concurrency; EVC participant locking; restricted runtime role separated from migration owner; local-only SMTP capture.

HTTPS production cookies require Secure. Native verified mode uses HTTP loopback and development cookies. Do not expose the development setup to a public network. Production refuses DEMO_MODE=true; no production identity provisioning or official deployment is claimed.

Important limits:

- Official policy source access is incomplete, including HTTP 403 for the 2026–27 addendum. Timelines, EVC quorum and demonstration eligibility are explicitly unverified demo configuration. They are not official rules.
- No authorized live AICTE integration exists. JSON/CSV local adapters work; official integration is blocked by absent authorized endpoint/access, not simulated as success.
- Docker’s engine is unavailable on this host. Native PostgreSQL/Mailpit is the verified route; Compose is supplied but unverified. Container runtime-role hardening needs the same operational setup as native before use beyond demo.
- No malware scanner or document authenticity verification is installed. NOT_SCANNED is visible. Header/token validation is not a complete malware analysis engine. No encryption-at-rest or tamper-proof audit claim is made. Host database owners can alter schema/triggers, and host operators can access private bytes/secrets.
- Worker coordination is intentionally single-coordinator per database, protected by a PostgreSQL session advisory lock. No national-scale availability/performance claim is made. SMTP acceptance can be ambiguous after a crash; those records require explicit authorized review/retry.
- Rules support constrained acyclic ordered routes, explicit human deficiency loops, fixed permission guards, category/evidence requirements and calendar-day demonstration deadlines. Arbitrary executable rules, general BPMN graphs and statutory business-day calendars are not implemented or claimed.
- This is a prototype permission model. It does not constitute a statutory committee or replace human scrutiny, inspections, appointments or decisions.
- Automated scenario results are not user research or proof of reduced manual effort. No baseline human task study, selection guarantee, machine-learning accuracy or external email delivery is claimed.

Audit rows are protected from ordinary API mutation and the runtime role cannot edit/delete them. This is append-only application behavior, not cryptographic or privileged-owner tamper proofing. Passwords, database credentials, private files and backups are excluded from Git.
