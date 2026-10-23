# Repair verification — 23 October 2026 (IST)

Anumitra / SIH26262 is an independent local prototype. The complete isolated gate now passes in one sequential invocation. Earlier failed and split-run results remain historical evidence.

## Verified source and complete gate

Exact source commit: `3c01372a7002c496b4c9eeb3fe3bc8123d88c547`, based on the preserved `5e9fbfa` checkpoint. Its change is confined to tests/browser/ui.spec.ts. Application code, dependencies, schema, policy values and orange/gold UI are unchanged by this continuation. The publication commit adds documentation/evidence only; its source digest is checked against the tested manifest.

Source digest: `8ab13929135abb6c076b208ee604acbace3ededfcb543056559e34b7d742a542`. [verification.json](evidence/repair/verification.json) records HEAD, per-file hashes, empty command arguments, isolated target, checks and UTC timestamps. [sequential-gates.json](evidence/repair/sequential-gates.json) summarizes this same full run.

| Executed command | Actual result |
|---|---|
| `npm run typecheck` | PASS, exit 0; [output](evidence/repair/sequential-typecheck.txt) |
| `npm run format:check` | PASS, exit 0; [output](evidence/repair/sequential-format.txt) |
| `npm run verify:isolated` | PASS, exit 0; fresh isolated database with six migrations/fictional seed, TypeScript and production build, **31/31 backend/operations/repair tests**, API restart preservation and **4/4 browser journeys**, all in the same invocation, no skips |
| `npm audit --json` | PASS, exit 0; zero vulnerabilities; [output](evidence/repair/sequential-audit.json) |
| `git diff --check` / staged whitespace check | PASS after whitespace-only normalization of the new text logs |

Full output: [sequential-full-run.txt](evidence/repair/sequential-full-run.txt). Raw results: [backend.tap](evidence/repair/backend.tap), [browser.txt](evidence/repair/browser.txt). Backend duration: 138.268 seconds. Browser duration: 3.0 minutes; draft/upload/submit 6.4 seconds, cross-role 2.4 minutes, controlled first-event SSE regression 5.0 seconds. Vite built successfully in 28.01 seconds and emitted a non-fatal warning about chunks above 500 kB; no bundle optimization was undertaken.

Executed environment: Windows, Node 20.19.4, native PostgreSQL 18.6, local Mailpit and Chromium. Disposable target: `anumitra_test_1792751932630`, own restricted API/worker roles, random fictional credentials and private .local/test-runs storage. Test API 3100, SMTP 1125, inbox 8125. The harness finishes its own build before backend/browser execution; no separate install/build or clean-copy process ran concurrently. The normal demo API/worker were left running without restart. No normal-demo reset, seed, migration, credential overwrite or private-file cleanup ran.

## Exact failure and synchronization repair

The failed selector was `page.getByLabel('Current document version')`, at line 175 of the original browser spec. Its five-second `toBeVisible()` assertion started immediately after clicking Upload new immutable version. A Playwright click resolves after the browser action; it does not await the async form handler's upload and subsequent query refresh.

UploadForm awaits POST /api/applications/:id/documents, then calls onDone to invalidate the application query. ApplicationWorkspace renders the selector only when that query's documents contain a version. The failed run recorded HTTP 201, and its later snapshot contained the selector. The assertion raced the upload/read/render sequence. Concurrent clean-copy work may have contributed to latency; that hardware contribution is not proved, and the selector was not renamed.

The test now registers both response listeners **before** clicking. It asserts HTTP 201 for this application's exact upload URL, then waits for a real HTTP 200 application read whose documents contain the newly returned version ID. Old or unrelated reads cannot satisfy that barrier. It then runs the original five-second visibility assertion and additionally checks the selector's value equals that exact ID. No assertion timeout, test timeout or retry setting was increased; no fixed sleeps, forced reloads, direct cache updates or mocked API responses were added.

The full gate retains the controlled first-SSE-event regression and cross-role journey: repeated rejected responses, EVC scheduling/report/recommendation, separate human conditional decision, undertaking submission/review, pending effective-document renewal, escalation and deliberate ambiguous-delivery retry disclosure. Backend scope/export/private-file, interval/ageing, concurrent review, renewal, rollback, policy race/migration, actual pg-boss/SMTP ambiguity/restart and cancellation/reservation regressions remain.

## Historical evidence

The unsuccessful full command is preserved unchanged in [full-run-0d6faa2.txt](evidence/repair/full-run-0d6faa2.txt), [browser-upload-timing-0d6faa2.txt](evidence/repair/browser-upload-timing-0d6faa2.txt) and [full-verification-0d6faa2.json](evidence/repair/full-verification-0d6faa2.json). It failed despite 31 backend and 3 browser passes. The subsequent browser-only run passed four, but was never a passing complete gate.

Previous outputs were copied before refreshing latest paths: [backend-0d6faa2.tap](evidence/repair/backend-0d6faa2.tap), [browser-only-0d6faa2.txt](evidence/repair/browser-only-0d6faa2.txt), [browser-only-verification-0d6faa2.json](evidence/repair/browser-only-verification-0d6faa2.json). The [historical report](TEST_REPORT_REPAIR_0d6faa2.md) and commit 5e9fbfac1602fa2747731a73f97c38b4e655ed53 retain the previous checkpoint and screenshots.

Clean-copy installation/migrate/seed and 157-file isolated restore results belong to source 0d6faa2; they were not rerun or relabelled as checks of this test-only change. Earlier populated-copy and normal additive upgrade evidence remains preserved. None of those normal migrations was repeated. Current tests provision only their separate marked database and private storage. New public text logs have trailing whitespace normalized; original bytes are retained privately.

## Limits

Docker/Compose execution and hosted CI have not been verified in this continuation. Publishing may trigger the supplied public-repository CI workflow; no hosted outcome is claimed here. All numeric deadlines, grace periods, quorum and eligibility values remain DEMO and need qualified policy-owner verification.

No authorised live AICTE integration, malware/authenticity scanning, exactly-once SMTP, full accessibility, national-scale performance, production readiness or selection-probability claim is made. Selected browser captures and synthetic scenarios are not a human-effort study. No paid service/inference, software licence or deployment was added.
