# Product gaps and verification — 26 October 2026 (IST)

Entry checkout: `679b12b07d0479779964d35e090ffc3aa3d705c6`, clean local `main`. Its 79 implementation/configuration hashes matched the earlier report's tested source `9ad109d664a891f2657f95ce54a8f3bd5e9808b8`. The documentation cleanup did not establish a new passing dependency audit.

Implementation checkpoint for this improvement: `041b641a00f6e6899132d02b97d830a5b53314ce`. The final passing source is `54206f21b8e69f2e946c9421800cada99aa466f7`; see the final complete-run result below. This earlier checkpoint is retained for failure attribution. Raw new runs are separated under [product-2026-10-26](evidence/product-2026-10-26/). Earlier reports and evidence remain unchanged.

## Reproduced defects

- In the retained isolated fictional demo, a bureau user bounded to `I01` received HTTP 200 for an institution-master preview outside that grant; expected 403. The old master loop also lacked a batch-wide transaction and explicit persisted review/provenance binding. [Baseline response](evidence/product-2026-10-26/baseline/baseline-import-scope.json).
- The actual validity report showed 17 raw `NO_ACCEPTED_VERSION` cells and 58 bare boolean cells. [Captured screen](evidence/product-2026-10-26/baseline/inspect-reports.png).
- An already CONDITIONAL case's next-actor panel displayed its historical mixed-role owner and stale application due date, with generic permission guidance, rather than its remaining compliance step. [Captured case](evidence/product-2026-10-26/baseline/inspect-applications.png).
- Resolution audit rows from separate subject revisions/levels displayed the same action/reason without enough subject context. They represent legitimate distinct events and must not be deleted or merged.
- The existing browser journey covered one deficiency item. The server supported multiple items, but the original UI exposed a single-line item and its default response selector did not distinguish OPEN items from RESPONDED items.
- Public [CI run 40225073084](https://github.com/Trunal2005/Anumitra/actions/runs/40225073084) on entry SHA 679b12b completed the full isolated gate successfully, then failed its audit step on high-severity Zod advisory [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Local `npm audit --json` reproduced it. This is distinguished from the successful older runs.

## Implemented repair scope

- Shared human-facing report headings/values for UI, CSV and PDF; raw machine JSON remains compatible. Document cards distinguish latest submitted review from accepted effective evidence. Tables retain status columns and keyboard-focusable horizontal scrolling.
- Scoped next-step guidance identifies institutional response, visit coordination/report/review, assigned stage actors and post-decision condition review. Terminal decisions no longer present an old application owner/deadline as a pending decision.
- Case and global audit rows resolve escalation context only within already authorised application history. New rows retain subject/revision/level metadata; older rows with event correlation IDs can be enriched without rewriting audit history. Institutional views omit structured recipient lists and names; legacy reason text is retained. Current event status/recipients are explicitly labelled current; they are not presented as a fabricated historical snapshot.
- Institution master imports enforce intersected grants and validate the whole batch. Preview persists actor, grant, input and master-snapshot bindings; commit requires that review ID and an unchanged snapshot. Atomic conflicts, duplicate IDs, changed input, actor mismatch and silent overwrites are rejected. Retries of an applied review are idempotent. Sync/audit record declared provenance and normalized-row SHA-256.
- The documented [local contract simulator](INTEGRATION_CONTRACT.md) provides two fictional cursor pages, explicit SANDBOX/local status and checksums. It is not an authorised external AICTE contract. No official institutions or real cases/documents were imported; unverified manual files cannot acquire official provenance.
- The existing browser workflow now accepts one checklist item per line, uses only state-appropriate target deficiencies and exercises two items with repeated rejection. It also adds rejected-renewal then later accepted-version checks.
- Only Zod was pinned forward, from 4.1.12 to patched 4.6.7, with its lockfile. No force upgrade, service dependency, schema migration or paid component was introduced.
- `verify.mjs --evidence-dir=docs/evidence/...` writes new results to a separate dated folder, retaining historical outputs.

## Early checks and retained failures

`npm run typecheck`, `npm run format:check` and authored-file whitespace checks passed before the full gate. The four newly added backend regressions passed in [targeted-1](evidence/product-2026-10-26/targeted-1/verification.json), with 14 unrelated tests explicitly skipped by the requested name pattern. That targeted manifest records its exact working-tree hashes and entry HEAD; it is not relabelled as the later complete gate.

The new full invocation is `npm run verify:isolated -- --evidence-dir=docs/evidence/product-2026-10-26/full-1`. It includes fresh isolated migrations/fictional data, TypeScript/production build, all backend scenarios, API restart preservation and all Chromium journeys. Its failed result is recorded below; it is not the final passing run.

### First complete run: FAILED, retained

[full-1/verification.json](evidence/product-2026-10-26/full-1/verification.json) records source `041b641a00f6e6899132d02b97d830a5b53314ce`. TypeScript/build, 35/35 backend tests (no skips) and API restart preservation passed. Chromium passed 3/5 journeys; the full command exited 1. The raw output, manifest and browser results remain unchanged.

The extended cross-role journey reached its conditional decision, undertaking acceptance and pending renewal, then timed out at the deliberate-retry SMTP poll: the intent remained QUEUED within the remaining test budget and subsequently reached SMTP_ACCEPTED. Its shared business-clock advancement also exposed the whole seed/backend fixture namespace to the worker. The setup repair gives the story a separate test-only run namespace, retaining all old rows and restoring the prior clock/run afterward. It does not remove the real worker/SMTP assertion, extend the 180-second timeout or alter normal demo data.

The new UI check used a broad `/Welcome/` heading matcher that also matched the unauthenticated “Welcome back” heading. It could navigate to Reports before the login request completed, leaving the Report selector unavailable until the 45-second test timeout. The setup now waits for the actual POST /api/login response (200) and the precise authenticated `h1` heading. It creates its own real API fixtures in an isolated run instead of relying on a preceding journey's records. Timeouts and expected UI states are unchanged. Sanitized [page contexts and selector timings](evidence/product-2026-10-26/full-1/failures/) are retained; raw authenticated Playwright traces remain private/ignored because they can contain login request data.

## Remaining boundaries

B2 historical missing waiting intervals remain unknown. F3 does not exhaust every report PDF/filter combination. Official numeric policy applicability, statutory appointments, holidays and eligibility remain unverified DEMO settings. Public source access/reuse terms did not permit a verified real institution import in this review. No authorised live AICTE connector, malware/authenticity scanner, production security certification, national-scale benchmark, measured manual-effort gain or selection probability is claimed. Local Compose remains unexecuted. Source discovery/access limits are in [POLICY_REGISTER](POLICY_REGISTER.md).

Normal-demo reset, bootstrap, seed, migration, upload cleanup and credential overwrite were not run. The stopped existing PostgreSQL cluster was started to support isolated tests. Tests use their own marked database, private storage, API port and SMTP capture; services are checked individually before normal-demo handoff.

### Browser setup rerun: FAILED, retained

`node scripts/verify.mjs --existing --browser-only --skip-build '--browser-grep=cross-role|readable reports' --evidence-dir=docs/evidence/product-2026-10-26/browser-setup-2` reused only the marked disposable target. The namespaced cross-role story reached SMTP_ACCEPTED, then hit the existing 10-second screenshot limit while capturing the entire live notification page. Evidence capture now scrolls to the exercised delivery and takes the visible viewport with animations disabled; the delivery assertion and timeouts remain unchanged. The other test exposed strict locator ambiguity: `getByLabel("Report")` matched both the select and “Scrollable report table”. It now uses the exact label. This rerun is not a full passing gate.

The full-1 case snapshot also reproduced a post-decision guidance gap: after undertaking acceptance, a pending renewal still displayed no pending application transition. The next-step helper now shows the authorized evidence reviewer and identifies the existing accepted expiry explicitly, or the configured DEMO first-review deadline where no accepted version exists. Expired/rejected renewal returns the next action to the institution. Added backend and real-browser assertions cover this follow-up.


### Second complete run: FAILED, retained

[full-2/verification.json](evidence/product-2026-10-26/full-2/verification.json) records source `a86e275a6ba83962535a18cdc6ab33ea4983ae8d`. Build/typecheck, 35/35 backend tests (329.614 seconds, no skips) and restart preservation passed. Chromium passed 3/5; both remaining failures were the new exact-label selector, not the business states: `getByLabel("Report", {exact:true})` includes wrapping option text under Playwright's label-text lookup. The accessible snapshot confirms a combobox named exactly “Report”. Both calls now use `getByRole("combobox", {name:"Report", exact:true})`, which cannot match the report table region. No assertion or timeout was removed or extended. The workflow passed the real SMTP retry, rejected-v2 expiry and accepted-v3 current-state assertions before reaching that selector. The raw failed run and sanitized accessible context are retained.


### Targeted semantic-selector run: FAILED, retained

[browser-selector-3](evidence/product-2026-10-26/browser-selector-3/verification.json) passed the complete cross-role journey (24.5 seconds). The other test reached the validity report and exposed two further facts: the header role query failed, and browser cells still used raw `String(...)` despite the shared formatter being imported and used for exports. The captured real UI/trace confirms raw enums/booleans remained. Browser cells now call `reportValue(key, value)`; the original exact column-header assertion is retained; see the subsequent accessibility diagnosis. Cell assertions still require human labels and forbid raw boolean/NO_ACCEPTED_VERSION values. This failed attempt is retained, not represented as success.


### Header accessibility diagnosis

The product-only rebuild in `browser-product-4` still failed the column-header assertion. The actual `browser-header-diagnosis/browser.txt` accessibility tree then showed the precise cause: Chromium exposed every heading as `cell`, not `columnheader`; this was not a case mismatch. It also confirmed readable “Accepted”, “No accepted version”, “Renewal pending” and “No renewal pending” values. Report `<th>` elements now explicitly declare `scope="col"`. The exact semantic column-header assertion is retained; diagnostic logging is removed from the final test. No timeout was increased. All raw failed diagnostic attempts remain separate evidence.


## Final complete run — PASSED

**Exact tested source: `54206f21b8e69f2e946c9421800cada99aa466f7`**, descended from entry 679b12b without history rewriting. [Manifest](evidence/product-2026-10-26/full-3/verification.json), [full raw output](evidence/product-2026-10-26/full-3/full-run.txt), [backend TAP](evidence/product-2026-10-26/full-3/backend.tap) and [browser output](evidence/product-2026-10-26/full-3/browser.txt) identify the same run. It ran from 2026-10-26T13:37:37.725Z to 2026-10-26T13:42:54.906Z (UTC). No concurrent install/build process ran. All mutations used the marked disposable target and private test storage; no normal-demo reset, bootstrap, migration or seed was run.

| Command / check | Actual result |
|---|---|
| `npm run verify:isolated -- --evidence-dir=docs/evidence/product-2026-10-26/full-3` | Exit 0; PASSED |
| Isolated migrations / synthetic fixtures | Six migrations on fresh disposable database; fictional seed; restricted API/worker roles |
| `tsc --noEmit`, PDF assets and Vite production build inside gate | Passed; existing >500 kB chunk warning remains |
| Complete backend / operations / repair suite | **35 passed, 0 failed, 0 skipped**, 215.226 seconds |
| API restart | All case IDs, versions and workflow policy pins preserved |
| Chromium, one worker | **5 passed**, approximately 1.6 minutes; cross-role journey 53.8 seconds; product journey 8.3 seconds |
| `npm run format:check` | Passed; [raw output](evidence/product-2026-10-26/format-check.txt) |
| `npm audit --json` | Exit 0, zero advisories at retrieval; [raw output](evidence/product-2026-10-26/dependency-audit.json) |
| Authored-file whitespace / outgoing private-value checks | Passed; private credentials/traces, normal databases/uploads and build/dependency files remain excluded |
| Local Compose / official network contract / malware scanning | Not run / not available; no success claimed |

Implementation/config/test manifest SHA-256: `9884f9294f392db86b58081964646b84da0ae520c45bdcd76b3594dffaf72f41`. Documentation/evidence changes after this source commit are excluded by the manifest's explicit file list and do not change those source hashes. A subsequent published documentation commit must be checked against this digest rather than relabelling an untested application revision.

The browser story now covers two-item repeated responses, EVC scheduling/report/completion, committee recommendation, explicit human conditional decision, undertaking verification, pending and rejected renewal preserving accepted expiry, later v3 acceptance, designated escalation and real local SMTP retry. The fifth journey separately checks readable report cells/column semantics, focus/mobile overflow, contextual history, next-role guidance, real simulator review/commit and unauthorized access. Screenshots in full-3 were visually inspected; finite checks do not establish complete WCAG conformance or every export/policy permutation.

[Public entry CI](https://github.com/Trunal2005/Anumitra/actions/runs/40225073084) is recorded as failed on its Zod audit, not successful. Publication CI is checked separately after push and must be identified by its own SHA/run URL; this pre-publication report does not infer hosted success from the local gate. No real institution directory/reuse permission or authorized AICTE contract was established; [contract](INTEGRATION_CONTRACT.md) and [policy recheck](POLICY_REGISTER.md) state the exact simulator/provenance/access boundaries.


## Native handoff

Existing PostgreSQL on 127.0.0.1:55432 was reused. Only stopped API, worker and Mailpit were started, with hidden process windows and ignored logs; no normal reset/bootstrap/migration/seed was executed. `npm run doctor -- --strict` exited 0: API, database, schema, storage, worker and SMTP all ready; integration LOCAL_ADAPTER. [Doctor](evidence/product-2026-10-26/native-doctor.txt) and [health](evidence/product-2026-10-26/native-health.json) are retained. Application `http://127.0.0.1:3000/` and Mailpit `http://127.0.0.1:8025/` each returned HTTP 200.

The request to open a visible in-app browser timed out attaching its webview; the application panel fallback reported queued. No visible desktop page opening is claimed. Actual authenticated UI behavior and desktop/mobile screenshots were verified through Chromium in the complete gate. The localhost services remain available independently of this desktop-display limitation.
