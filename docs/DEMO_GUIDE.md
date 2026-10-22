# Jury demonstration guide

Start API, worker, PostgreSQL and Mailpit as in README. Copy the local demo password from `.local/demo-credentials.json`; do not display the secrets file on a public recording. All seeded names/documents are fictional.

| Scenario / PS | Account and clicks | Expected evidence | Hinglish |
|---|---|---|---|
| A: persistent application | institution.a → Applications → New application → Only Scrutiny → details → save | Database draft, application reference, revision and create audit | Pehle draft save hota hai; submit alag action hai. |
| A/E: evidence + submission | Same case → Add private evidence → PDF → upload → Commit Submit | Immutable version, frozen submission, assigned scrutiny stage, audit and outbox | Upload verification nahi hai; officer alag se verify karega. |
| A: deficiency | Sign out; reviewer.north → case → Raise deficiency → checklist LEASE + reason | Returned attempt, deficiency round, reason, institution-visible notice | Reason aur purana evidence history mein rehta hai. |
| A: response | institution.a → same case → renew existing document → upload → Submit response → selected deficiency + document | New pending version, response linked to deficiency, re-scrutiny | Sirf deficient item ka response link hota hai. |
| A: verification | reviewer.north → Verify response ACCEPTED → Review document ACCEPTED → Complete stage | Guarded move to authority; attempts/history retained | Jab tak evidence verify nahi hota, next stage block hai. |
| A/D: human decision | authority → case → Record authorized decision CONDITIONAL → reason + undertaking + future due | Decision evidence snapshot; open obligation remains | Approval ke baad bhi undertaking track hoti rahegi. |
| D: evidence vs compliance | institution.a → Undertakings → upload/select evidence → Submit; supervisor.north → Accept/Return | SUBMITTED is distinct from ACCEPTED; review reason and revision | Submission compliance closure nahi hai. |
| B: scoped overview | supervisor.north → Overview → stage/count/workload links | Persisted counts reconcile with filtered register; ageing separates waits | Dashboard ka har count actual records se aata hai. |
| C: EVC conflict | supervisor.north → EVC scheduling → eligible new-institution case → declared-available EVC member and future dates | Proposed visit and reservation; overlapping case rejected | Same member ki overlapping booking server reject karta hai. |
| C/A: visit lifecycle | Supervisor confirms → admin advances demo business clock beyond visit → committee.evc submits report → supervisor reviews completion | Visit report separate from recommendation; complete stage only after recommendation | Schedule, report, recommendation aur final decision alag hain. |
| A: SAC vs SHC | Choose EVC + SAC or EVC + SHC route; after EVC use committee.sac or committee.shc | Only configured distinct committee appears; authority still decides | Har case dono committees se force nahi hota. |
| E: renewal | Institution → case → renew document; supervisor → Document registry → verify pending renewal | New version is pending; old authorized versions retained; expiry does not revoke approval | Naya upload purani acceptance inherit nahi karta. |
| F: notifications | admin → advance demo clock; supervisor → Alerts & delivery; open Mailpit port 8025 | Persisted deadline intents, inbox, SMTP attempt/acceptance and exhaustion | Mail local Mailpit mein capture hoti hai; Gmail delivery ka claim nahi hai. |
| F: reports/audit | Any scoped role → Reports & audit → type/filters → CSV or Print/PDF | Same scope/filters; readable demo report; immutable action chronology | Export aur dashboard ka scope same hai. |
| Configuration | admin → Rules → select route → edit → Validate/simulate → Create draft; bureau → publish | Diff and validated route; old cases retain original workflow ID/version | Rule change se purane cases chupke migrate nahi hote. |
| Integration | admin/bureau → Administration → local JSON/CSV preview → commit; repeat same external ID | Preview, draft/master/metadata creation, unchanged replay, sync logs | Yeh local adapter hai, live government integration nahi. |
| Isolation | institution.b tries institution.a case URL; admin attempts decision | Unavailable/denied; no regulatory authority from technical role | Sirf UI hide nahi; backend bhi access deny karta hai. |

For a fresh repeatable demonstration, admin → Administration → fresh demo run → type NEW_DEMO_RUN. This creates a separate run and preserves historical data. It is server-disabled outside demo mode. The worker must be running for alerts with the browser closed.

Proof scenarios are executable in `npm test`; Chromium journeys in `npm run test:browser`; real screenshots in `docs/evidence`. See TEST_REPORT for what was actually executed and limits. Background checks may add fictional cases; a new demo run restores the standard active workload of 120.
