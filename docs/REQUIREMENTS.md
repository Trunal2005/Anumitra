# Anumitra — SIH26262 acceptance matrix

Current repair mapping, 23 October 2026. Primary requirement: [SIH2026 entry 26262](https://www.sih.gov.in/sih2026PS), A–F and Regulatory Safeguard, rechecked during repair. These are prototype capabilities, not verified statutory policy values. Execution status is reported separately in [TEST_REPORT_REPAIR](TEST_REPORT_REPAIR.md); source/test mappings below are not claims that every combination was browser-tested.

| PS bullet | Implementation / user interaction | Current regression or evidence |
|---|---|---|
| A1 route families and combinations | Constrained published Workflow.config, pinned case; Rules editor and institution wizard | operations: all five route families; policy migration regression |
| A2 authorised automatic progression | Locked command guards move to the configured next stage and select a fully eligible active actor | five-route operations; cross-role browser EVC completion |
| A3 reasoned return/revert | Multiple checklist items per deficiency round; evidence-linked responses and explicit accept/reject | timed two-rejection regression, replay/concurrency tests; browser repeated response |
| A4 routine communications/case summaries | Transactional outbox plus scoped PDF case summary; internal observations excluded | notification/SMTP and notice privacy integration checks |
| B1 cross-region/stage/institution/officer views | Shared grant scope, overview, register, committee queue, scoped reports and filters | authenticated bounded officials; multi-grant scope and successful in-scope reads |
| B2 ageing/workload/bottlenecks | Disjoint stage attempts, institutional vs official duration, stage counts and unassigned workload | exact 3 institutional / 4 official days in controlled cycle; report reconciliation |
| B3 approaching/exceeded timelines | Shared deadline subjects in dashboard, drilldown, reports, scanner and delivery validation | upcoming/stale tests; escalation grace remains visibly overdue |
| B4 role-based dashboards | Institution, assigned reviewer, regional supervisor, bureau, committee, authority and auditor scopes | direct-ID/export denial; responsive browser workspace |
| B5 full movement/observation/action/decision audit | Append-only audit, immutable submissions/decisions and response review history | immutable-write denial, internal/public privacy, attempt and snapshot assertions |
| C1 EVC eligibility queue | Applicable route reaches EVC after prior guards; explicit NEW_INSTITUTION category | five-route operation and full browser scheduling |
| C2 scheduling/completion timelines | Availability plus participant locks/reservations; distinct proposed scheduling and confirmed report deadlines | overlapping scheduling denial, reschedule history, browser report/acceptance |
| C3 EVC reminders/escalation | Visit deadline revision and configured designated escalation hierarchy | shared VISIT subjects and scanner; finite selected paths, not every calendar permutation |
| D1 time-bound undertaking ledger | Human conditional Decision creates a linked Obligation with condition/evidence/due dates | conditional-decision integration and browser journey |
| D2 notify institution and accept evidence submission | Explicit institution recipient; private evidence-linked submit action | browser undertaking submission; durable notifications |
| D3 authorised evidence verification | Submit differs from accept/return; reviewer/authority guards | browser authorised acceptance; direct integration denials |
| D4 overdue undertaking follow-up | Revisioned due dates, authority-only extension/waiver, persisted escalation/closure | stale revision suppression; post-decision multi-subject report and waiver invalidation |
| E1 effective validity dates | Highest accepted version is effective; latest submitted version is shown separately | expired accepted v1 with future pending v2 remains expired |
| E2 advance renewal notices | Configured reminder horizon; date-only expiry at IST end of day | leap/invalid-calendar tests; delivery current-subject recheck |
| E3 submission versus verification | Immutable version/review history, renewal pending badge, authorised effective switch | no-expiry/rejected/accepted renewal regression; real browser renewal |
| E4 expired/non-submitted renewal escalation | Expired effective version remains monitored; no accepted evidence explicitly flagged | inbox/outbox/escalation subjects, overdue report and browser expired-state capture |
| F1 configurable notifications | Versioned stage/response/EVC windows, recipients, reminder lead and overdue grace/hierarchy | schema/policy editor; saved hash publication; scanner deduplication |
| F2 designated escalation | Escalation model stores subject/revision/policy/level/due/recipients/state; reasoned acknowledgement and automatic eligibility rerouting | grace/deduplication/acknowledgement/closure regression; visible browser events |
| F3 six consolidated reports | Pendency, EVC, compliance, validity, overdue subjects and regional processing; shared scoped CSV/PDF | report scope/reconciliation; multiple subjects per conditional case; CSV formula protection |
| F4 complete follow-up history | Audit plus immutable DeliveryAttempt generations, local inbox and uncertain SMTP state | actual pg-boss failed/completed retry; uncertainty/restart regressions; browser deliberate retry |
| Safeguard: human oversight | Explicit grants, recommendations distinct from decisions; no automatic final grant/rejection/waiver/revocation | denied pre-authority decision, negative referral/recommendation and separate final rejection |
| Secure storage/confidentiality | Auth/CSRF/sessions, intersected dimensions, private scoped bytes, safe upload staging and compensation | foreign-ID denial, DB rollback/file checks, concurrent versions, mixed-grant visibility/SSE |
| Policy provenance/versioning | DEMO labels, immutable publication, revision/hash locks and audited compatible migration | save/publish/retire races; old pins retained; POLICY_REGISTER |
| Authorised integration where feasible | LOCAL_ADAPTER draft/master/metadata preview/import/export with mappings and audit | idempotent preview/import; no authorised live endpoint is claimed |
| Restart/zero-cost operation | Separate API/worker/owner privileges; native setup, readiness, CI definition and isolated verification | clean-copy install/build, API restart, worker recovery, separate restore hashes |

Limits: statutory clauses, calendars, composition and processing values require independent policy-owner approval. No live AICTE integration, antivirus, official committee appointment, scale benchmark or measured manual-effort reduction is asserted. Compose and hosted CI execution remain unverified on this host. Historical missing waiting durations cannot be recreated; additive migration repairs current interval consistency without inventing history.
