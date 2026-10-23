# Anumitra demonstration: 5-7 minute operator guide

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
