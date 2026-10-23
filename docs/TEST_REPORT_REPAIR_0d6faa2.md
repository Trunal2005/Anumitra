# Historical repair verification — source 0d6faa2, 23 October 2026 (IST)

Anumitra / SIH26262, independent local prototype. Historical checkpoint superseded by TEST_REPORT_REPAIR.md. Original screenshots and this report are also retained by commit 5e9fbfac1602fa2747731a73f97c38b4e655ed53; current root captures may be refreshed by later runs. This report supersedes neither historical results nor regulatory policy verification. The original TEST_REPORT and its screenshots remain unchanged.

## Source and environment

Code freeze: `0d6faa22898c62565cfef30a3e84106c1135256b` on main. This includes the initial-SSE refresh fix, fresh locked renewal-review check, controlled browser regression and removal of migration credentials from runtime child environments. The subsequent handoff commit contains documentation/evidence only. The per-file SHA-256 manifest and source digest in evidence/repair/browser-only-verification-0d6faa2.json identify the tested implementation independently of documentation commits. No application/source edits occurred during these final checks.

Executed environment: Windows, Node 20.19.4, native PostgreSQL 18.6, local Mailpit, Chromium. API test port 3100; isolated SMTP 1125 and inbox 8125. Fresh test database: `anumitra_test_1792720602431`, with separate restricted API/worker roles, generated fictional credentials and private storage under ignored .local/test-runs. Test data is retained. No normal-demo migrations, seeds, reset or private-file cleanup ran in this continuation.

The interrupted native PostgreSQL cluster was stopped at resumption. Starting that existing cluster completed PostgreSQL crash recovery; no cluster recreation or credential overwrite occurred. API, worker and normal Mailpit were then restarted without bootstrap. Read-only native checks verified the stored demo password, 116 active cases with no ineligible/unassigned owners, and strict API/database/schema/storage/worker/SMTP readiness.

## Executed final gates

| Command | Actual result | Evidence |
|---|---|---|
| `npm run typecheck` | PASS, exit 0 | evidence/repair/typecheck.txt |
| `npm run format:check` | PASS, exit 0 | evidence/repair/format.txt |
| `npm audit --json` | PASS, zero vulnerabilities | evidence/repair/dependency-audit.json |
| `npm run verify:isolated` | Fresh six-migration database, fictional seed, TypeScript and Vite build PASS; backend/operations/repair 31/31 PASS, zero skipped; API restart preserved case IDs, versions and policy pins. Overall command FAILED on one browser timing assertion: 3/4 journeys passed. | evidence/repair/backend-0d6faa2.tap, full-run-0d6faa2.txt, full-verification-0d6faa2.json |
| `npm run verify:isolated -- --existing --browser-only --skip-build` | PASS, exit 0; all 4 journeys, no skipped tests; 2.5 minutes total, cross-role 1.8 minutes, controlled SSE 12.9 seconds | evidence/repair/browser-only-0d6faa2.txt, browser-final-run.txt, verification.json |
| `node scripts/verify-clean-checkout.mjs` | PASS: Git-visible clean copy, npm ci, Prisma generation, production build, fresh six-migration seed, second migrate/seed, safe refusal of existing .env without private cluster/password | evidence/repair/clean-checkout.json, clean-checkout-run.txt, clean-source.json |
| `node scripts/in-test.mjs scripts/verify-persistence.mjs` | PASS, exit 0; 157 private files verified, application/audit/version counts match in separate retained restore database | evidence/repair/restore.json, restore-run.txt |
| `npm run doctor -- --strict` and read-only native check | PASS, ready; existing local password still matches | evidence/repair/doctor.txt, normal-readiness.json |
| `git diff --check` and `git diff --cached --check` | PASS after text-log whitespace normalization | evidence/repair/whitespace.txt |
| Local-value and credential-pattern scans | No findings in Git-visible files or 195 historical blobs; no secret values printed | evidence/repair/secret-scan.json, history-secret-scan.json |

The first full browser run's upload returned HTTP 201 in approximately 352 ms, but its document-selector assertion missed the five-second window while the clean-copy install/build ran concurrently. The later failure snapshot contains the selector. All four unchanged journeys passed on a sequential rerun; draft submission took 5.2 seconds overall. Contention is a plausible contributor, not a proved performance diagnosis. Assertions/timeouts were not relaxed, and the original failure remains in browser-upload-timing-0d6faa2.txt. No automatic retry setting hides this result. The backend run took 209.830 seconds; it was not repeated because no source changed and only browser execution failed. Combined results and source comparisons are in evidence/repair/final-gates.json.

## Exercised repaired behavior

The 31 backend tests include the original 17 integration/operations scenarios and 14 repair groups. Their raw TAP names and assertions cover:

- Institution-bounded officials, intersected institution/region/bureau restrictions, multiple-grant union, bounded delegation, assignment, exports, private IDs, mixed-role internal visibility and scoped SSE.
- Two rejected deficiency responses with disjoint institutional/official intervals, exact controlled ageing, replay/concurrency guards and immutable evidence snapshots.
- Expired accepted evidence with pending, rejected, missing-expiry and accepted replacements; one successful concurrent review and one conflict; accepted-only deadline retirement; missing-acceptance cleanup and immutable reviews.
- Invalid/foreign/forbidden uploads, a real database rollback after file movement, compensation and concurrent versions without orphan committed bytes.
- Saved revision/hash publication, stale lifecycle denial, compatible policy migration, retained prior pins and due times, retirement and publication races.
- Actual pg-boss completed failed-job retry with a new generation, one logical inbox entry, retained attempts and exhausted-generation reset. A real Mailpit acceptance followed by injected database acknowledgement failure becomes AMBIGUOUS; deliberate retry requires duplicate-risk acknowledgement. Worker restart preserves uncertainty.
- Current-attempt recommendations and deliberate adverse referral followed by a separate human rejection; no historical favourable recommendation bypass.
- Overdue visibility during escalation grace, designated eligible recipients, deduplication, acknowledgement/rerouting/closure, shared post-decision document/undertaking reports and waiver invalidation.
- Reasoned EVC appointment cancellation, reservation release, reminder closure and restored scheduling monitoring; actual-calendar/leap-year/IST date validation.

Browser journeys cover the responsive real-API workspace/PDF preview; institution draft/upload/submit forms; a cross-role two-rejection/EVC/conditional-decision/undertaking/renewal/escalation/retry story; and a controlled first-event SSE regression. The latter delays only EventSource refresh callbacks, commits real API evidence, then requires the stale OPEN compliance snapshot to refresh to SUBMITTED. The browser retry disclosure uses an explicitly synthetic ambiguous fixture; the real SMTP acknowledgement-failure reproduction is in the backend suite.

Actual mobile overview and desktop renewal screenshots were visually inspected. The latter shows EXPIRED accepted effective v1 alongside pending submitted v2. Existing orange/gold CSS and typography remain. This is selected visual verification, not a complete accessibility audit.

## Preserved upgrade and historical evidence

The earlier restored-copy upgrade and already completed normal additive upgrade are recorded separately in populated-upgrade.json and demo-upgrade.json: 334 cases, 308 snapshots, 28 decisions, 326 document versions and 1,591 original audit rows preserved, all 326 private-file hashes verified, zero invalid active stage-interval counts. Migrations have not changed since those checks. They were not rerun on the normal demo in this continuation. The prior isolated restore verified 149 private files; the final separate restore above verified 157 after the complete backend and browser scenarios.

Baseline probes, targeted TAP runs, the earlier 6de38ed SSE failure and intermediate builds remain historical. A targeted run with skips is not substituted for the final complete 31-test backend suite. Raw UTC timestamps correspond to the 23 October IST session.

Staging exposed trailing spaces from captured command output. Public .txt logs were normalized to LF, with trailing horizontal whitespace/blank lines removed; results were unchanged. Original bytes remain in an ignored private backup, with original/published hashes in text-log-normalization.json. Historical committed evidence outside evidence/repair was not modified.

## Remaining limits and unavailable checks

Docker Desktop's Linux-engine named pipe was unavailable in the recorded check; Compose execution/privilege/restart testing remains unverified. Hosted Actions has not been run or observed. Native clean-copy, migration, worker and browser results do not imply container or hosted-CI success.

APH and addendum access was rechecked during repair, but every configured numeric deadline, grace period, quorum and eligibility setting remains DEMO and needs qualified policy-owner verification. No authorised live AICTE integration, statutory appointment, antivirus/authenticity verification, exactly-once SMTP, national-scale performance, full accessibility or measured manual-effort reduction is claimed. The initial browser timing failure remains a finite reliability limitation. No paid API/service/inference, project licence or deployment was added.
