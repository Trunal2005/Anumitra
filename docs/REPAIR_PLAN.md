# Submission repair plan — 23 October 2026

Baseline: 08758db7c45a687dd753fef678537e231ca75c14, clean main. Preserve this revision's historical TEST_REPORT and screenshots. New evidence belongs under docs/evidence/repair/ and TEST_REPORT_REPAIR.md. No destructive tests against the normal demo database/storage.

| Finding | Revalidation at baseline | Priority | Repair and regression |
|---|---|---|---|
| 1 grant scope / assignment / delegation | Confirmed source: official scope omits institution, assignment checks only region | Blocker | Shared intersected grant predicates, explicit global/delegation, validated shapes; authenticated in/out-scope reads, exports, files, SSE and assignment |
| 2 rejected response intervals | Confirmed source: rejection changes state without closing/opening attempts | Blocker | Central attempt transition, unique open interval; two-rejection timed journey and ageing |
| 3 effective document | Confirmed source: latest-only scan/display/validation | Blocker | Shared accepted-effective selection plus latest-submitted state; pending/no-expiry/rejected/accepted renewal scenarios |
| 4 completed transport retry | Confirmed source: QUEUED retains jobId; completed job ignored | Blocker | Retry generations clear linkage, preserve attempts; actual pg-boss SMTP failure/retry |
| 5 escalation / reminder revision | Confirmed source: broadcast to viewers, title-only escalation, app.version identity | Mandatory | Stable deadline revisions, designated recipient hierarchy, persisted escalation/audit; repeated scans, grace, reassignment/resolution |
| 6 negative outcomes | Confirmed source: any historical recommendation counts; rejection requires favourable evidence | Blocker | Current-attempt recommendations, reviewed vs favourable guards, explicit human adverse referral; negative route and authority denial |
| 7 deadline windows / overdue report | Confirmed source: uniform days, application-only overdue | Mandatory | Versioned stage/response/EVC policies, shared deadline subjects, consolidated subject counts incl post-decision conditions |
| 8 orphan upload bytes | Confirmed source: final write precedes transactional state/ownership checks without cleanup | High | Prevalidate, private staging, safe compensation and age-bounded dry-run reconciliation; filesystem rollback/concurrency tests |
| 9 policy lifecycle races | Confirmed source: validate proposed config but publish stored, checks outside transaction | High | Locked saved config/hash/revision lifecycle, audited saves; unsaved/concurrent/stale lifecycle tests |
| 10 calendar validation | Confirmed source: shape-only date parsing | High | Actual calendar roundtrip, leap-year and IST boundary tests before storage |
| 11 setup privileges/readiness | Confirmed source: Compose uses init owner; native script rotates password | High | Shared provisioning, no implicit rotation, doctor heartbeat/SMTP distinction, secret exclusions, disposable clean/restart verification |
| 12 reproducible evidence / CI | Confirmed source: tests fixed to normal demo ports/credentials, no CI | Mandatory | Guarded disposable PostgreSQL/storage/credentials/ports, actual worker/browser regressions, CI and new timestamped evidence |

Execution: isolated baseline probes → authorization + additive invariants → attempts/negative paths → effective documents/storage → deadlines/escalation/retry → shared reports/policy lifecycle → setup/doctor/CI → cross-role UI and final gates. No new paid services, redesign, invented statutory policy or project license. Source-supported concerns become reproduced/fixed only with recorded regression evidence.

## Execution and review status

Baseline disposable probes are retained in evidence/repair/baseline-probes.json: institution-bound official scope widened to an empty filter; a rejected response left the wrong open interval; pending renewal hid an expired accepted document; and an actual completed pg-boss job could strand the old manual retry transition. Calendar probes confirmed impossible-date normalization. Other initial findings were source-supported until the targeted regressions ran.

Final regression groups now exercise authenticated bounded/mixed grants, exports/private IDs/SSE, timed repeated responses and concurrency/replay, negative referral/recommendation/decision separation, accepted-effective renewal including rejection/no-expiry, actual rollback/concurrent bytes, publication/migration/retirement races, explicit escalation grace/acknowledgement/closure, post-decision report reconciliation, completed-job retry, real SMTP acceptance with failed database acknowledgement, conservative worker restart, immutable review/missing-acceptance cleanup and appointment cancellation. Current counts/revision and finite coverage are in TEST_REPORT_REPAIR, not inferred from test definitions.

Final review caught and repaired a second-order expiry bug: invalidating all document reminders after a rejected replacement would incorrectly resolve the still-effective expired document. The strengthened assertion checks the original queued intent IDs and open escalation remain active. Acceptance closes only work actually resolved. Original TEST_REPORT/screenshots remain historical; current images/logs are under evidence/repair. Migration 006 preserves legacy retry bounds and retires pending legacy broadcast deadline identities without deleting history.

A populated backup was restored and migrated separately before applying the same additive migration to the normal demo. Existing case/snapshot/decision/audit/document records and all 326 referenced private file hashes were verified unchanged; stage interval invariants were checked. Local credentials were preserved, and API/worker readiness is verified separately. Docker/hosted CI/statutory configuration limits remain explicit.

Continuation closed on code freeze 0d6faa2: 31/31 backend tests passed, all four unchanged browser journeys passed on a sequential rerun, clean-copy install/build/migrate/seed passed, and a separate restore verified 157 private files. The initial full command's browser timing failure remains recorded; no assertions were weakened. No normal-demo migration/seed/reset ran during continuation. Final documentation/evidence is committed locally; pushing and deployment are outside this continuation's handoff.
