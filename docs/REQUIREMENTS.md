# Anumitra • SIH26262 implementation contract

Source: https://www.sih.gov.in/sih2026PS, PS 26262, retrieved 2026-10-22.
Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System.

All groups are mandatory. Demonstration deadlines and eligibility are not official policy.

| ID | Requirement | Implementation target | Verification target | Status |
|---|---|---|---|---|
| A1 | Configurable routes, immutable submissions, automatic routing | domain/engine, applications API / wizard+timeline | Five complete route families; snapshots preserved | Implemented; tests pass |
| A2 | Deficiency, reasoned return, targeted re-scrutiny | deficiency rounds/responses / case panels | Persisted scrutiny→response→verification journey | Implemented; test passes |
| A3 | Recommendations, separate authority decisions, notices | engine, PDF API / action+summary | Authority denial, committee separation, conditional decision | Implemented; selected paths tested |
| B1 | Scoped dashboards, counts, drilldowns, filters, ageing/workload | dashboard + register / overview+reports | Institution/region/committee denials; counts/open/upcoming/export reconcile | Implemented; tests pass |
| B2 | Live scoped updates and audit | SSE + immutable audits / live badge+history | Revoked-session SSE expiration; internal history privacy | Implemented; tests pass |
| C1 | EVC eligibility/new-institution queue, availability, scheduling/conflicts/reports | visit reservations / queue+agenda | Concurrent overlap denial; five-route lifecycle | Implemented; tests pass |
| C2 | EVC reminders and delayed escalation | current stage/visit revision scanner / alerts | Durable scans and recovery; statutory values unverified | Implemented; selected paths tested |
| D1 | Decision-linked ledger, evidence, review, extensions/waivers | obligations API / undertaking workspace | Uploaded vs accepted; condition survives decision | Implemented; core test passes; extension/waiver not exhaustively browser-tested |
| D2 | Upcoming/overdue conditions and escalation | revision-aware worker / alerts | Stale obligation revisions suppressed | Implemented; test passes |
| E1 | Private immutable files, validity, renewal/version review | document API/storage / registry+lineage | A/B direct-ID denial; new version pending; historic reviewer-only bytes | Implemented; test passes |
| E2 | Expiry follow-up and reminders without automatic revocation | date boundary + latest-version scanner / alerts | IST date-only boundary, stale suppression | Implemented; selected paths tested |
| F1 | Durable jobs, SMTP, attempts/retries/exhaustion | outbox + pg-boss / inbox+delivery history | Local SMTP accepted; loopback failure exhausts; restart/enqueue-before-ack proof | Implemented; tests and recovery probe pass |
| F2 | Six reports, safe CSV, PDF, alert/action audit | reports API / reports+audit | Same-scope totals; formula-safe CSV; real report generators | Implemented; reconciliation passes |
| X1 | Authentication/recovery/grants/CSRF/sessions | API middleware / sign-in+profile+admin | Actual Mailpit one-time recovery, session/role invalidation, CSRF and no-admin-authority | Implemented; tests pass |
| X2 | Draft/save/validate/simulate/diff/publish/retire/policy migration | constrained rules / policy workspace | Immutable publication and simulation; case pins retained | Implemented; selected paths tested; migration/retirement not exhaustively browser-tested |
| X3 | JSON/CSV preview/import/export, mappings and sync logs | local integrations / admin | Idempotent draft/master/metadata adapter; no status bypass | Local adapter tested; live official access blocked |
| X4 | Exact palette/fonts/ten signatures/responsive/motion | web / all workspaces | Five real flagship captures; four required widths, keyboard dialog, computed tokens, reduced motion | Implemented; two browser journeys pass; no blanket accessibility certification |
| X5 | Demo clock/reset, persistence/recovery, zero-cost operations | scripts + admin | New run executed; production demo refused; 324 files restored; credentials excluded | Native verified; Compose blocked by stopped engine |

Detailed evidence and uncovered requirements are recorded in TEST_REPORT and IMPLEMENTATION_STATUS. No status implies unexecuted verification.

PS bullet mapping: A automatic routing/movement/return/routine correspondence → A1–A3; B consolidated regional views/ageing/workloads/approaching deadlines/role views/audit → B1–B2+C2+F1; C eligible EVC queue/new-institution timing/reminders → C1–C2; D conditions/deadlines/evidence/verification/escalation → D1–D2; E validity/renewal notices/renewal verification/overdue → E1–E2; F configurable alerts/scoped escalation/six report families/complete history → F1–F2. X rows cover the cross-cutting requirements in the supplied engineering brief.

Source verification and operational blockers are separate from software behavior. No official processing period, statutory committee appointment, live government connection, real external email delivery, manual-effort improvement or national-scale performance is asserted.
