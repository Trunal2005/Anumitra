# Anumitra demonstration: 5-7 minute operator guide

## Current operational walkthrough — 30 October 2026

Use the specialised screens in this order, with fictional evidence in an isolated rehearsal. The current continuous evaluator test is `tests/browser/operations.spec.ts` (test name starts `continuous evaluator walkthrough`). It uses one page/context throughout, separate role sign-ins and the real guarded mutation endpoints. It restores the isolated run/clock after completion; it does not reset the normal demo. Generated video and simple-English subtitle notes belong outside the checkout.

1. **Institution → My action desk:** find OPEN deficiency subjects or start a fictional Scrutiny + EVC draft. Save, upload synthetic evidence and submit explicitly.
2. **Reviewer → My review desk / case:** raise two checklist items; institution responds to both. Reject one, resubmit that item, then verify both separately. Accept the exact document version and complete scrutiny.
3. **Supervisor → EVC planner:** select the eligible case; inspect actual declared availability and reservations. Propose a nonconflicting IST slot and confirm. Use only the isolated test clock to move beyond the visit. Member submits the report; supervisor separately accepts completion.
4. **Member → Committee agenda:** consider the same case, inspect evidence/current-attempt blockers, record a reasoned recommendation, then complete the stage. No meeting/quorum/appointment is inferred.
5. **Authority → decision packet:** review evidence, recommendation, findings and proposed condition. Enter a reason, acknowledge the human confirmation checkbox and commit a conditional decision. Recommendation and decision are separate records.
6. **Institution / supervisor → Compliance ledger:** select the linked condition, submit evidence, then sign in as authorized reviewer and accept it. SUBMITTED differs from ACCEPTED. Original due dates/history remain visible.
7. **Institution / supervisor → Evidence review:** submit a future-dated replacement, compare latest versus effective version, then reject it. Accepted v1's recorded expiry remains effective.
8. **Supervisor → Alerts / Reports:** inspect designated escalation subjects and matching overdue report rows. Task counts can exceed distinct case counts.
9. **Public references:** show the historical 2025–26 year, a field-level publisher/page link and pending team human review status. These profiles contribute zero operational cases.
10. **Bureau → Workflow policies:** published versions are read-only. Clone a new draft, use keyboard Move controls, inspect source/applicability/pinning and run blocked/ready fictional scenarios. Simulation issues no decision and changes no case.

Before presenting, use `npm run doctor -- --strict`. Application: http://127.0.0.1:3000 ; local Mailpit: http://127.0.0.1:8025 . Credentials remain in ignored `.local/demo-credentials.json`; never project that file. Do not advertise a live AICTE feed, verified numerical statutory policy, malware scanning or production readiness.

## Historical operator schedule — 26 October 2026

Use one new **clearly fictional** `Scrutiny + EVC` application for the entire story. Do not reset the normal demo, alter its published policies, or use actual institutional documents. The repeatable browser scenario in `tests/browser/ui.spec.ts` creates a fresh fictional case in isolated storage; it temporarily uses its own test-only run namespace and restores the prior isolated clock/run afterward. References are unique to avoid overwriting earlier runs, while the ordered actions and expected transitions are fixed. Old screenshot/page tours are not substitutes for this workflow.

To exercise the story on a fresh isolated target, use `npm run test:browser -- --journey-only --evidence-dir=docs/evidence/product-demo-2026-10-26`. Choose a new evidence-folder name on a later attempt to retain earlier output. This command starts only isolated test services and uses synthetic PDFs. It does not bootstrap, migrate, seed or reset the normal demo. Retrieve passwords locally from the ignored credentials file for the chosen instance; do not project it. These accounts are fictional prototype roles, not statutory appointments.

| Approximate speaking time | Exact account / navigation | Action and expected result |
|---|---|---|
| 0:00–0:30 | `institution.a@anumitra.test` → Applications → New application | Show the independent prototype/DEMO disclosure. Choose `Scrutiny + EVC`, fictional contact/programme and cycle; save a draft. |
| 0:30–1:00 | Same account → case workspace | Upload `Journey lease`, a synthetic PDF whose text explicitly says it is fictional. Use the displayed business date as the initial expiry. Submit explicitly: `DRAFT → SCRUTINY`. The policy version and submission snapshot remain pinned. |
| 1:00–1:30 | `reviewer.north@anumitra.test` → same reference → Authorized action | Choose Raise deficiency. Enter two separate checklist lines, `Fictional lease clarification` and `Fictional programme clarification`, and a reason. Commit: two items in one round, `AWAITING_RESPONSE`. |
| 1:30–2:20 | Institution, then reviewer → same case | Institution responds to each OPEN item using evidence. Only after the open items are answered does the case enter `RESCRUTINY`. Reviewer rejects the lease response: it returns to OPEN and the case to institutional waiting, retaining the programme response. Institution resubmits that OPEN lease item; demonstrate a repeated rejection if time permits, then acceptance. Reviewer separately accepts the still-RESPONDED programme item. Both items and every review remain in history. |
| 2:20–2:40 | Reviewer → evidence/action panel | Accept the current synthetic document version and complete scrutiny only after every item is ACCEPTED. Route advances to EVC; blockers and the next authorised role remain visible. |
| 2:40–3:30 | `supervisor.north@anumitra.test` → EVC scheduling, then `committee.evc@anumitra.test` | Choose a later declared-available slot that does not overlap a reservation; propose and confirm it. In the isolated rehearsal, use the technical demo clock only to move past the appointment. Member submits the report. Supervisor separately accepts completion. Member records the current-stage recommendation and completes EVC. These are distinct actions. |
| 3:30–4:00 | `authority@anumitra.test` → same case | Record CONDITIONAL with an explicit reason, fictional undertaking and future due date. Show the decision snapshot and linked condition. The committee recommendation did not grant approval. |
| 4:00–4:30 | Institution → Undertakings; supervisor → Undertakings | Institution submits existing case evidence and explanation. State becomes SUBMITTED. Supervisor reviews and accepts it. Authority-only extension/waiver is a separate action; authority alone does not act as the evidence-reviewer role. |
| 4:30–5:20 | Institution → same case; supervisor → Document registry | Upload a future-dated replacement. Show latest submitted versus accepted effective evidence: accepted v1 remains expired while v2 is pending. Return v2 with a reason; expiry remains. Institution uploads corrected v3, which is still pending until accepted. |
| 5:20–6:10 | Supervisor → Alerts & delivery, Reports & audit | Let the isolated worker scan. Inspect designated subject/level/role/status, overdue reports and separate deadline-subject counts. Acknowledge an event with a reason if required. Local SMTP means Mailpit capture only. After authorised v3 acceptance, only the superseded document-expiry work closes. Distinct escalation-history rows remain visible with subject/revision/level context. |
| 6:10–6:45 | Same case → History, then Reports & audit → Action history | Show retained response/review/decision history and contextual escalation rows. A terminal application does not show an old owner as the next decision maker. Check an out-of-scope reference is denied. Finish with policy, integration, scanner and production limits. |

This speaking schedule is an estimate, not a measured human study or proof of efficiency gains. The browser journey also tests a controlled ambiguous-delivery fixture in the isolated target; that is separate from the operator story and must not be presented as a new live crash reproduction. See the dated product verification report for what actually passed on which source revision.

### Optional adapter demonstration

Use `admin@anumitra.test` → Administration → Load fictional simulator sample → Validate preview. Show `FICTIONAL_SIMULATION`, declared source/version/date, normalized-row checksum and persisted review ID. Explicitly commit only in an isolated rehearsal. Show that changed masters need manual reconciliation, duplicates/out-of-scope rows are denied, and no applications or regulatory decisions are imported. This is a local simulator, not a real AICTE master list or official sandbox. Details: [INTEGRATION_CONTRACT](INTEGRATION_CONTRACT.md).

## Earlier operator outline and additional notes

Use a synthetic local instance. The cross-role story is exercised by the third Chromium journey in tests/browser/ui.spec.ts; its measured automation duration belongs to TEST_REPORT_REPAIR. The speaking schedule below is an estimate, not a measured human study. No normal demo reset is required.

Before presenting, run `npm run doctor -- --strict`, keep API/worker/PostgreSQL/Mailpit running, and check the visible DEMO business clock. Normal application port is 3000; Mailpit is 8025. Read the password locally from ignored `.local/demo-credentials.json`; never project or commit it. Accounts end in `@anumitra.test`: institution.a, reviewer.north, supervisor.north, committee.evc, authority, admin and bureau. Test credentials live separately in their private test directory. Every institution/recipient/document is fictional.

| Speaking time | Real interaction | Verify/explain |
|---|---|---|
| 0:00-0:20 | Show disclosure and scoped overview | Independent prototype, local adapter, DEMO numeric policies, human decisions |
| 0:20-1:05 | Institution creates Scrutiny + EVC case, fills details, saves, uploads a fictional lease PDF, submits | Persistent draft versus immutable submission; private PDF.js preview |
| 1:05-2:00 | Reviewer raises clarification with reason; institution responds; reviewer rejects twice, then accepts third response | New institutional waiting interval after each rejection; exact response/evidence/review history |
| 2:00-2:20 | Reviewer accepts document and completes scrutiny | Guarded automatic routing; eligible assignment or visible unassigned queue |
| 2:20-3:15 | Supervisor schedules non-overlapping future EVC with available member and confirms; admin advances DEMO clock past end; EVC member reports; supervisor accepts completion | Scheduling, report review and recommendation are separate; business time differs from auth/retry time |
| 3:15-3:45 | EVC member recommends and completes stage; authority records conditional decision with future undertaking due date | Recommendation is not an approval; human decision freezes evidence and creates a condition |
| 3:45-4:25 | Institution submits undertaking evidence; supervisor verifies acceptance with reason | SUBMITTED differs from ACCEPTED; history remains after approval |
| 4:25-5:05 | Institution renews lease with future expiry; supervisor filters document registry to the case | Expired accepted v1 remains effective while future-dated v2 is pending |
| 5:05-5:45 | Let worker scan; open designated escalation events, acknowledge with reason; inspect local inbox, SMTP history and Mailpit | Named officials/role/level or UNASSIGNED; local capture only, no automatic legal penalty |
| 5:45-6:15 | Supervisor accepts renewal | Effective v2 becomes current; resolved deadline work closes; historic evidence remains |
| 6:15-6:45 | Show overdue/validity reports, filters, CSV/PDF and case audit | Distinct case versus subject counts; post-decision compliance remains monitored |
| 6:45-7:00 | Show denied cross-institution URL and limitations | Backend scope; no official integration, statutory appointment, antivirus or scale claim |

Use a lease expiry on/before the displayed business date, followed by a future renewal date. Advance only the clearly labelled demo clock. Avoid the fictional seed's booked EVC slot; choose a later declared-available slot or show the conflict guard. If no eligible official exists, use a scoped coordinator's eligible-assignee action; never invent statutory authority.

Configuration can be shown separately: save a next draft, simulate, then bureau publishes the saved revision/hash. Old case pins remain unchanged. Existing published numeric policies are preserved and may differ from new seed windows. Adverse scrutiny referral requires a pinned DEMO policy explicitly enabling AUTHORITY_REVIEW, then a separate human final decision.

Retry recovery is a separate controlled failure demonstration in the disposable test instance: actual SMTP failure with a completed pg-boss job, new retry generation, then Mailpit acceptance. A post-SMTP database acknowledgement failure produces AMBIGUOUS; deliberate retry requires duplicate-risk acknowledgement. The browser journey uses a labelled synthetic ambiguous fixture for the disclosure form. Do not present that fixture alone as a real crash reproduction; the backend regression supplies that evidence.

Fallback: retain current repair screenshots and raw logs. If doctor shows the worker missing, restart it once and inspect its private log; do not reset a database/case. SMTP failure is degraded delivery while approval data remains available. Container setup is unverified on this host. A fallback screenshot is historical evidence, not a new live execution.

No manual-versus-app human task study has been conducted. There are no participants, manual baseline timings or justified improvement percentages.
