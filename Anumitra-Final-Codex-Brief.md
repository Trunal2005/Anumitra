You are the lead full-stack engineer, workflow architect, product designer and verification engineer for Anumitra.

Build the complete SIH26262 application in this repository. Implement it, run it, inspect it, test it and fix failures.

Do not stop after a plan, scaffolding, attractive screenshots or a frontend-only dashboard.

PRODUCT
Name: Anumitra
Tagline: Every approval. Every obligation. Accounted for.
Descriptor: Approval and Compliance Orchestration.

Problem statement:
Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System.

Use the same product name consistently in navigation, page titles, reports, generated demonstration documents, README and walkthrough.

Build a simple original SVG wordmark using connected workflow nodes and the supplied orange/gold palette.

This is an independent student prototype. Do not imply official AICTE deployment, endorsement or integration that has not occurred.

The attached Anumitra-Final-Codex-Brief.md is the detailed implementation specification. Its appendix preserves my original visual reference. This prompt states the execution contract.

==================================================
0. COMPLETION CONTRACT
==================================================

A beautiful frontend with an unfinished backend is incomplete.

A working backend with a generic dark dashboard that ignores my design reference is also incomplete.

The project must pass BOTH:

1. Every mandatory PS capability.
2. The supplied design-system acceptance checks.

Do not call an action functional because a button exists. Demonstrate the database change, permission check, resulting task, audit event and visible outcome.

Do not hide incomplete behavior behind:

- Mock API success responses.
- Random dashboard numbers.
- Browser-only workflow state.
- Fake “live” indicators.
- Hardcoded charts.
- Decorative buttons.
- TODO handlers.
- Tests that were written but never executed.

Preserve existing user changes. Inspect and reuse sound existing code rather than restarting or switching frameworks unnecessarily.

Keep implementation progress and blockers recorded so work can resume accurately after context limits.

==================================================
1. ZERO-PAID-SERVICE REQUIREMENT
==================================================

The required application must need no:

- Paid API key.
- Credit card.
- Expiring free trial.
- Paid AI inference.
- Paid SMS or WhatsApp service.
- Paid email provider.
- Managed database account.
- Cloud storage subscription.
- Paid hosting.
- Required GPU or large local model.

Use local open-source components.

Do not sign up for services, provision cloud resources or add compulsory configuration for paid providers.

Locally generated passwords, session secrets and cryptographic secrets are allowed. Generate them securely and exclude them from Git.

After installing dependencies and building initially, the application must operate locally without internet access.

Bundle fonts, icons and other assets. No runtime Google Fonts request, CDN script, external texture dependency or analytics beacon.

Use actual in-app notifications and SMTP messages captured by local Mailpit.

Mailpit capture is a real local email demonstration. Do not falsely claim external Gmail delivery.

The supplied PS does not require AI. Complete the workflow system without an LLM. Do not rename deterministic rules “machine learning.”

Do not send real external messages or deploy publicly without explicit authorization.

Local implementation, migrations, fictional seed data and verification are authorized.

==================================================
2. INSPECT FIRST, THEN BUILD
==================================================

Inspect:

- AGENTS.md and applicable repository instructions.
- Git status and existing user changes.
- Package manifests and lockfiles.
- Existing source and component architecture.
- Runtime/database/container availability.
- Current styling tokens and libraries.

If a suitable implementation exists, extend it.

For an empty repository use:

Frontend:
React, TypeScript, Vite, Tailwind CSS, accessible shadcn/ui components, React Router, TanStack Query, validated forms and Lucide.

Backend:
Node.js, Express, shared request/response validation and OpenAPI documentation.

Database:
PostgreSQL with Prisma migrations.

Background work:
A separate worker process using pg-boss.

Documents:
Private persistent local storage behind authenticated application endpoints.

Email:
Local Mailpit.

Keep one modular codebase with separate API and worker processes.

Do not introduce Redis, Kafka, Kubernetes, microservices or a vector database merely to make the architecture sound advanced.

Verify compatible stable package versions using primary documentation. Commit a lockfile.

Do not mix ORM and queue examples from incompatible major versions.

Serve the built frontend from the application origin in the default local demonstration setup.

Provide a Compose-compatible setup with persistent volumes and health checks. Support a free container option such as Podman and document a native alternative where practical.

If a prerequisite is unavailable, report it accurately and attempt a suitable local alternative. Do not silently substitute an in-memory database.

==================================================
3. POLICY SOURCES AND REQUIREMENT TRACEABILITY
==================================================

Research the relevant official sources before describing a configuration as an official rule:

- https://www.sih.gov.in/sih2026PS
- https://www.aicte.gov.in/
- https://www.aicte.gov.in/sites/default/files/approval/APH%20Final.pdf
- https://cdnbbsr.s3waas.gov.in/s35938b4d054136e5d59ada6ec9c295d7a/uploads/2025/03/2025031399.pdf
- https://aicte.gov.in/downloads/aph/Final%20Addendum%202026-27_V2.pdf

Follow applicable amendments, errata and revised calendars linked by AICTE.

Create a policy register containing:

- Source title and URL.
- Retrieval date.
- Clause/page.
- Applicability.
- Effective period.
- Superseding amendment.
- Verification status.

Do not invent official deadlines, committee eligibility rules or clause references.

If a source is inaccessible, record that limitation and continue with clearly labelled demonstration configuration.

Unverified policy values must be distinguished from incomplete software.

Create a requirement traceability matrix mapping every PS requirement to:

- Domain implementation.
- API.
- UI.
- Acceptance test.
- Current status.
- Evidence.

All six PS sections below are mandatory.

==================================================
4. USERS, PERMISSIONS AND AUTHORITY
==================================================

Implement actual local authentication, logout, session expiry, password change and local recovery through Mailpit.

Use maintained authentication/session components, secure password hashing, server-backed sessions, appropriate cookies, CSRF protection and login throttling.

Proposed application roles:

- Institution representative.
- Reviewing officer.
- Regional officer/supervisor.
- Bureau officer/supervisor.
- Committee member/coordinator.
- Competent authority.
- Auditor.
- Platform administrator.

These are software roles, not invented statutory appointments.

Support multiple explicit grants where necessary.

Enforce role plus institution, region, bureau, assignment and committee scope on every backend operation.

Apply the same authorization to:

- Lists and searches.
- Individual records.
- Counts.
- Mutations.
- Document previews/downloads.
- Notifications.
- Live updates.
- Reports and exports.

Deny by default.

A technical administrator must not automatically gain regulatory decision authority.

Separate internal observations from institution-visible communication. Prevent leaks through summaries and notifications.

Demo account switching must authenticate as isolated seeded users and remain unavailable outside demo mode.

==================================================
5. PS SECTION A — WORKFLOW AUTOMATION
==================================================

Implement a persistent, configurable, versioned workflow engine.

A status dropdown is not a workflow engine.

Support the processing combinations named in the PS:

- Only Scrutiny.
- Scrutiny + EVC.
- Only EVC.
- EVC with applicable SAC/SHC routing.
- Other configured combinations.

SAC and SHC are distinct stage types. Do not force every application through both.

A workflow definition contains:

- Applicability conditions.
- Stages.
- Outcomes.
- Permitted actors.
- Required evidence.
- Transition guards.
- Deadline policies.
- Escalation rules.
- Source references.

Use an allowlisted configuration schema. Never execute arbitrary code from a workflow definition.

Implement:

- Saved drafts.
- Submission validation.
- Frozen submission snapshots.
- Automatic routing.
- Assignment.
- Scrutiny.
- Deficiency recording.
- Authorized returns and clarifications.
- Resubmission.
- Targeted re-scrutiny.
- EVC where required.
- Separate applicable committee paths.
- Recommendations.
- Authorized decisions.
- Conditional decisions and resulting obligations.

Preserve stage attempts and deficiency rounds.

Resubmission links responses and new document versions to the relevant deficiencies. It must not erase the original review or indiscriminately reset previously accepted items.

Use explicit transition commands rather than arbitrary status updates.

For each command:

1. Authenticate and authorize.
2. Check current state and expected version.
3. Evaluate guards.
4. Validate evidence and reason.
5. Persist state changes.
6. Append audit history.
7. Persist job/notification intent.
8. Commit atomically.

Implement idempotency keys bound to actor, scope and request payload.

Identical retries return the original result. Reusing a key with changed input is rejected.

Concurrent contradictory actions cannot both commit.

Expose permitted actions and blocking reasons to the UI.

Committee recommendations and final authorized decisions are separate.

Generate standardized notices, correspondence and case summaries using deterministic templates and authorized records.

==================================================
6. PS SECTION B — DASHBOARDS AND PENDENCY
==================================================

Create scoped dashboards for institutions, reviewing officers, regional/bureau supervisors and committees.

Include:

- Open applications.
- Current tasks.
- Stage-wise pendency.
- Upcoming deadlines.
- Overdue cases.
- EVC scheduling status.
- Outstanding undertakings.
- Pending evidence verification.
- Expiring documents.
- Workload distribution.

All metrics and charts must come from persisted data.

Every count must drill into its matching filtered records and reconcile with those records.

Implement server-side pagination, sorting and filtering by institution, application reference, cycle, category, region, stage, owner, status and date range.

Distinguish:

- Time awaiting institution response.
- Time assigned to an official.
- Total application age.

Do not imply an officer caused all elapsed waiting time.

Implement scoped live updates with SSE or a suitable equivalent, reconnection and fallback refresh.

Show actual freshness/connection state. A “live” badge must reflect a functioning connection.

Preserve draft input, focus and review position during refresh.

==================================================
7. PS SECTION C — EVC SCHEDULING
==================================================

Implement eligibility queues after required preceding stages.

Include visible new-institution cases.

Track:

- Awaiting scheduling.
- Proposed.
- Confirmed.
- Rescheduled.
- Report pending.
- Completed.

Implement participant assignments, availability, visit mode, timezone-aware start/end times, venue/meeting metadata, confirmation, rescheduling reasons, reports and completion review.

Support physical, online and hybrid labels where configured.

Validate prerequisites and booking conflicts on the backend.

Prevent simultaneous overlapping reservations from both succeeding using database protection or a correctly locked equivalent.

Quorum, appointment and eligibility policies must be sourced or clearly labelled demo assumptions.

Do not claim the system independently constitutes statutory committees.

Generate reminders and escalation for unscheduled, upcoming and delayed EVC work.

Scheduling a visit does not complete it.

Reports, recommendations and decisions remain separate.

No paid calendar, map or video-conferencing API is required.

==================================================
8. PS SECTION D — UNDERTAKINGS AND COMPLIANCE
==================================================

Maintain a persistent obligation ledger linked to institution, application and relevant decision.

Store:

- Condition.
- Source/authority.
- Owner.
- Original due date.
- Date revisions.
- Required evidence.
- Reviewer.
- Current state.

Implement upcoming reminders, evidence submission, review, acceptance, reasoned return and overdue escalation.

Submitted evidence is not automatically accepted compliance.

A conditional decision can coexist with open obligations.

Finishing an application workflow must not delete its outstanding conditions.

Extensions, waivers and closure require explicit permission and recorded reasons where the configured procedure allows them.

Preserve original deadlines and invalidate obsolete reminders.

==================================================
9. PS SECTION E — LEASE/DOCUMENT VALIDITY
==================================================

Maintain document metadata, immutable versions, validity dates and review records separately.

Distinguish:

- Submitted.
- Pending review.
- Accepted/rejected.
- Current.
- Expiring.
- Expired.
- Superseded.

Implement advance reminders, renewal submission, official verification, overdue tracking and escalation.

Expiry must trigger the configured follow-up, not an invented automatic rejection or revocation.

A renewed upload does not inherit acceptance automatically.

Keep earlier versions private and accessible to authorized reviewers.

A review or decision references the exact evidence version used.

Store files outside public assets with randomized storage keys.

Validate type, content and size. Prevent traversal and unsafe inline execution.

Use authenticated, scope-checked preview/download endpoints.

Hashes may establish correspondence to earlier bytes; they do not prove authenticity.

If malware scanning is available through a free local component, record its result. Otherwise show an honest NOT_SCANNED state.

Do not advertise encryption or document authentication that was not implemented.

==================================================
10. PS SECTION F — ALERTS, ESCALATION AND REPORTS
==================================================

Use a real separate worker and durable jobs.

Reminders must work with the browser closed and survive process restart.

Implement:

- In-app notification inbox.
- SMTP capture through Mailpit.
- Configurable reminders.
- Escalation hierarchy.
- Retry/backoff.
- Attempt histories.
- Exhausted-job visibility.
- Authorized retry.

Persist business changes and queue intent atomically using verified transactional enqueueing or a correct outbox relay.

Before sending, re-check subject revision, deadline, state and recipient scope.

Supersede stale reminders after renewal, extension, closure or reassignment.

Use deterministic logical-notification uniqueness.

Do not claim exactly-once external email delivery. Represent ambiguous outcomes honestly.

Track queued, attempted, SMTP-accepted, failed and exhausted states separately.

Default Mailpit configuration must not relay real external messages.

Deadline policies define triggering event, calendar semantics, timezone, reminder levels and escalation.

Store instants in UTC and display Asia/Kolkata by default.

Handle date-only expiry boundaries explicitly.

Do not invent official seven-day or thirty-day processing periods.

Create reports for:

- Application pendency.
- EVC status.
- Undertaking compliance.
- Document validity.
- Overdue cases.
- Regional processing performance.

Report filters and scope must match dashboard/list queries.

Implement safe CSV and readable print/PDF output. Prevent spreadsheet-formula injection.

==================================================
11. RULE VERSIONING, AUDIT AND INTEGRATION
==================================================

Create a usable workflow/rules editor with:

- Draft.
- Validation.
- Preview.
- Simulation.
- Version comparison.
- Publish.
- Retire.

A structured editor is sufficient. Do not build a general-purpose BPMN designer at the expense of the project.

Published versions are immutable.

Existing cases remain pinned to their governing version unless explicitly migrated with authorization, guards and recorded reasons.

Reject broken references, ambiguous automatic paths and unsafe cycles.

Configuration publishing must not let an administrator grant themselves regulatory authority.

Audit records include:

- Actor and effective scope.
- Action.
- Subject.
- Transition.
- Reason.
- Evidence references.
- Policy version.
- Timestamp.
- Correlation ID.

Record worker actions as system events.

No audit edits through normal application APIs.

Do not call an ordinary database audit table tamper-proof.

Implement integration interfaces for institution records, external application references/status and document metadata.

Provide functioning local JSON/CSV import/export, validation preview, external-ID mapping, idempotent synchronization and sync logs.

Imports cannot bypass workflow rules or overwrite verified decisions.

Use explicit integration modes:

- DISCONNECTED.
- LOCAL_ADAPTER.
- LIVE_AUTHORIZED.

Never invent live AICTE endpoints, restricted database access or a successful government integration.

A working local adapter must be labelled accurately.

==================================================
12. DATA MODEL AND PERSISTENCE
==================================================

Model the necessary distinctions between:

- Institutions/regions.
- Users/memberships/scoped grants.
- Applications/submission snapshots.
- Workflow/checklist versions.
- Workflow/stage/task instances.
- Deficiency rounds/responses.
- Committees/assignments/schedules/reports.
- Recommendations/decisions.
- Obligations/compliance submissions.
- Documents/versions/reviews.
- Deadlines/revisions.
- Notifications/attempts.
- Queue/outbox records.
- Audits.
- Policy sources.
- External mappings/sync runs.

Use sensible normalization, foreign keys, required fields, uniqueness constraints and useful indexes.

Use database-level protection for races and duplicate logical actions.

Use migrations rather than destructive schema resets.

Provide backup/restore instructions covering both database records and private document bytes.

Never put backups into the public website or Git.

==================================================
13. EXACT UI DESIGN SYSTEM
==================================================

My visual reference is mandatory.

Do not replace it with a blue government portal, a purple SaaS dashboard or default shadcn dark mode.

Create docs/DESIGN_FIDELITY.md mapping each rule to tokens, components, screens and screenshot evidence.

EXACT COLORS

Background: #030304
Surface: #0F1115
Foreground: #FFFFFF
Muted: #94A3B8
Border: #1E293B
Primary: #F7931A
Secondary: #EA580C
Gold: #FFD600

Use the exact gradients:

- #EA580C → #F7931A
- #F7931A → #FFD600

Do not substitute unrelated amber, flat yellow or neon colors.

TYPOGRAPHY

- Space Grotesk: headings, weights 400/500/600/700.
- Inter: body, weights 400/500/600.
- JetBrains Mono: IDs, figures and technical labels.

Define font-heading, font-body and font-mono.

Use supported local font loading. Do not assume the reference's fontImport helper exists.

GEOMETRY

- Cards: 12–16px radius, normally 16px.
- Thin 1px white/10 borders.
- Buttons: pill-shaped.
- Inputs: 48px high, translucent black, lower-edge border treatment.
- Minimum useful interactive target: 44px.
- Hover borders: orange at 50% opacity.
- Keyboard focus: visible full-orange treatment.

REQUIRED SIGNATURE EFFECTS

Implement all of the following:

1. Orange-to-gold gradient headline endings.
2. Central CSS/SVG orb with counter-rotating orbital rings.
3. Staggered floating glass context cards.
4. Orange corner accents on module/workflow cards.
5. Low-opacity Lucide watermark icons.
6. Orange/gold vertical workflow timeline with numbered nodes.
7. Asymmetric emphasis for the active workflow/module.
8. Glass panels over a subtle fading grid.
9. Ambient orange radial lighting and restrained gold glow.
10. Connection-aware glowing badges and motion controls.

The reference's pricing-card emphasis maps to active module/workflow emphasis.

It does not create subscription pricing or financial features.

Do not imply blockchain merely because the timeline is visually inspired by it.

EXACT EFFECT VALUES

Primary glow:
0 0 20px -5px rgba(234,88,12,0.5)

Strong glow:
0 0 30px -5px rgba(247,147,26,0.6)

Gold glow:
0 0 20px rgba(255,214,0,0.3)

Panel elevation:
0 0 50px -10px rgba(247,147,26,0.1)

Glass:
black/40 or white/5 with appropriate backdrop blur.

Grid:
50px squares, 1px rgba(30,41,59,0.5) lines and a radial fading mask.

Ambient lighting:
5–10% opacity, 120–150px blur.

Float:
8-second ease-in-out, up to 20px decorative vertical movement.

Orbit:
10-second forward outer ring.
15-second reverse inner ring.

Micro-interactions:
200–300ms.

Decorative card hover:
Up to 4px lift with orange border/glow.

Noncritical primary CTA:
Restrained scale up to 1.05.

Critical review/approval/rejection controls must remain spatially stable.

PAGE COMPOSITION

Welcome/sign-in:
A polished split hero with brand/value statement and CTA on the left, orbital illustration and glass cards on the right.

Use:
- 1280px content container.
- Responsive 40–72px display heading.
- 16–18px body.
- 32–48px major gaps.
- Generous reference-style section spacing.
- Fading grid and orange radial lighting.

Build the orb with CSS/SVG. Do not require a paid asset or heavy 3D engine.

Do not expose confidential counts to unauthenticated users.

Illustrative hero cards must read as illustration, or use a clearly isolated public demo dataset.

Authenticated application:
Carry the SAME visual language through every page:

- Dark surface sidebar.
- Orange active navigation accent.
- Translucent top bar.
- Mono IDs/data.
- Orange/gold emphasis.
- Corner-accent summary cards.
- Watermark icons.
- Thin borders.
- Controlled glow.

Do not make the welcome page beautiful and then switch to an unrelated flat dashboard.

Use sensible operational density:
16–24px working-area spacing and approximately 24–32px page headings.

Do not place 96px section padding inside a document review panel.

FLAGSHIP APPLICATION WORKSPACE

Provide:

- Context header.
- Current owner/stage/deadline.
- Allowed actions and blockers.
- Workflow/timeline rail.
- Document preview and checklist.
- Deficiency/review panel.
- Reasoned action controls.
- Accessible history.

Use a three-column layout where practical and collapse to two panes or stacked content as width decreases.

REQUIRED WORKSPACES

1. Welcome/sign-in/recovery/profile.
2. Role-specific overview.
3. Institution application wizard.
4. My Work/application register.
5. Scrutiny/re-scrutiny application workspace.
6. EVC queue/calendar/conflicts/reports.
7. Distinct configured SHC/SAC work.
8. Undertaking/compliance evidence review.
9. Lease/document registry/version lineage.
10. Alerts/escalation/delivery history.
11. Reports/audit.
12. Rules/policy/version simulation.
13. Administration/integration status.
14. Development-only component gallery.

INTERACTION QUALITY

All CTAs and controls must work.

Provide proper skeletons, empty states, inline validation, server errors, conflict messages and retry states.

Preserve unsaved input during refresh.

Use pulsing “live” indicators only when a connection is actually live.

Show reconnecting, stale or disconnected states honestly.

Honor prefers-reduced-motion.

Provide a motion pause control for persistent ornamental animations.

Provide refresh/pause controls where needed for automatically updating information.

No flashing or strobing.

ACCESSIBILITY CORRECTIONS

Keep the original gradients and shapes, but use readable button labels.

White on #F7931A is approximately 2.30:1. Use dark #030304 labels on the original gradient or another contrast-tested treatment.

Normal text needs at least 4.5:1 contrast; qualifying large text needs 3:1.

Do not use white/30 placeholder text as the only instruction.

Use visible labels, table headers, semantic landmarks, proper headings, accessible dialogs and visible keyboard focus.

Use explicit labels/icons so pending, completed, overdue and rejected remain distinguishable without introducing a competing brand palette.

RESPONSIVE VERIFICATION

Inspect at:

- 1440×900.
- 1280×800.
- 768px width.
- 390px width.

Scale the hero orb approximately from 450px to 300px.

Reposition floating cards without covering text.

Use an accessible mobile navigation drawer.

Scroll tables within their containers.

Stack review panes logically.

Use readable light styling for printed/exported reports.

VISUAL COMPLETION GATE

Capture actual screenshots of:

- Welcome.
- Overview.
- Application review.
- EVC.
- Rules editor.

Check computed colors/fonts and all ten signature effects.

Inspect contrast, keyboard access, reduced motion and responsive behavior.

Fix deviations.

Record necessary accessibility/density exceptions in DESIGN_FIDELITY.md.

A token file alone does not prove visual fidelity.

Do not fabricate screenshots or claim pixel-identical reproduction when the reference is a written design system.

==================================================
14. DEMO DATA AND PROOF SCENARIOS
==================================================

Create deterministic fictional data:

- Approximately 20 institutions.
- Four labelled demo regions.
- Approximately 100–150 applications.
- Multiple routes and failure cases.

Generate clearly labelled demo documents locally.

Provide isolated accounts for institution A/B, regional scopes, committee assignments, authority, supervisor, auditor and technical administration.

Seed:

- Scrutiny-only.
- Scrutiny + EVC.
- Only EVC.
- Applicable separate committee paths.
- Deficiency/resubmission.
- Unscheduled EVC.
- Conflicting appointment.
- Conditional decision with open undertaking.
- Expired lease.
- Unverified renewal.
- Overdue task.
- Failed email attempt.
- Superseded reminder.
- Old policy version.
- Inaccessible unrelated institution record.

Implement a persistent, isolated business demo clock.

Do not change the operating-system clock or authentication timestamps.

Business scans use demo time; queue polling/leases use real time.

Advancing demo time must trigger actual backend processing.

Reset creates a new demo run and invalidates old jobs/events.

Never reset production data.

Add an evidence-linked deterministic case brief and a clear:

“Why blocked?”
“Who acts next?”
“What is due?”
“Which evidence is missing?”

Do not disguise this as AI.

==================================================
15. IMPLEMENTATION ORDER
==================================================

Complete all phases:

1. Repository inspection, PS mapping, policy register, architecture, permissions and local infrastructure.

2. Authentication, persistence, scoped records and the flagship UI.
   Complete submission → scrutiny → deficiency → response → re-scrutiny → valid next stage.

3. All route types, EVC, separate committees, recommendations and authorized decisions.

4. Undertakings, evidence review, validity/renewals, durable alerts and escalation.

5. Live dashboards, reports, rule versioning/simulation, integration adapters and full visual fidelity.

6. Negative/security/concurrency tests, browser inspection, measurements, demo guide and handoff.

Build design tokens and components during Phase 2. Do not postpone the visual system until the project is almost finished.

Phases define order, not permission to omit mandatory scope.

==================================================
16. VERIFICATION
==================================================

Use real PostgreSQL integration tests and real backend behavior.

Do not mock the workflow backend in end-to-end journeys.

Verify:

- Clean setup and restart persistence.
- Institution/region/committee isolation.
- Document, report, summary and live-event access controls.
- Valid routes and rejected stage skipping.
- Preserved return reasons and evidence history.
- Targeted re-scrutiny.
- Frozen submission/decision snapshots.
- Idempotent retries and changed-payload rejection.
- Conflicting concurrent actions.
- Authority separation.
- Recommendation versus decision.
- Open obligations after conditional decisions.
- Uploaded versus accepted evidence.
- Private old document versions.
- Date/timezone boundaries.
- Stale reminder suppression.
- Worker downtime/recovery.
- Email retries/exhaustion/ambiguous outcomes.
- EVC eligibility and concurrent conflicts.
- In-flight policy version preservation.
- Invalid configuration rejection.
- Matching dashboard/list/export totals.
- Safe imports and duplicate synchronization.
- Unsafe files/paths/CSV payloads.
- Demo clock/reset isolation.
- Session/role changes invalidating cached/live access.
- Configuration publishing not expanding authority.
- No paid credential or runtime internet requirement.
- Exact design tokens/fonts/signature effects.
- Keyboard, contrast, reduced motion and responsive layouts.

Run type checks, relevant linting, integration tests, browser tests and the production build.

Inspect real screens and fix console, network and layout failures.

Report actual measurements with workload, hardware and method.

Do not invent test passes, latency figures, accuracy, time savings or user feedback.

Any claim of reduced manual effort needs a stated baseline and measured task comparison.

==================================================
17. HANDOFF AND DEFINITION OF DONE
==================================================

Deliver:

- Complete source.
- Migrations.
- Reproducible seed/reset.
- Lockfile.
- Secret-free .env.example.
- Compose/native instructions.
- One-command local bootstrap after prerequisites.

Required documentation:

- README.
- Requirements-to-test matrix.
- Policy register.
- Architecture and ER/workflow diagrams.
- Permissions.
- OpenAPI/API instructions.
- Design fidelity.
- Zero-cost setup.
- Security and limitations.
- Actual test report.
- Demo guide.
- Implementation status.

The demo guide must state:

- Which account/role to use.
- What to click.
- Expected result.
- Evidence shown.
- Corresponding PS requirement.

Include English and short Hinglish explanations useful for our professor/jury.

Final handoff must give exact commands, local URLs, demo-credential delivery, actual test results, coverage and limitations.

Every mandatory requirement must be working with evidence or explicitly reported as blocked.

Live official integration and a functioning local adapter must be reported separately.

Start with repository inspection, create the concise implementation plan, then immediately build.

Continue until the complete authorized application is implemented and verified.

Do not conclude with “the foundation is ready” while required functionality remains unfinished.