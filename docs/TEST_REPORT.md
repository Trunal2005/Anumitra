# Executed verification • 22 October 2026

Native Windows loopback setup: Node 20.19.4, PostgreSQL 18, Prisma 6.19.3, separate pg-boss worker, Mailpit 1.27.8 and Chromium 141 via Playwright 1.56.1. Workflow APIs use real PostgreSQL, not mocks.

| Check | Actual result / evidence |
|---|---|
| Prisma generation and three additive migrations | Passed on real PostgreSQL |
| TypeScript / production build | Passed; Vite 6.4.5, local bundled fonts/icons |
| Prettier / Git whitespace | Passed |
| Backend + operations | **17 passed, 0 failed**, 34.135 seconds; evidence/backend-tests.tap |
| Chromium journeys | **2 passed, 0 failed**; real forms and API; evidence/browser-tests.txt |
| Responsive/motion | 1440×900, 1280×800, 768×800, 390×800; overview document overflow absent; mobile dialog opened/closed; reduced motion disabled animation |
| UI errors and input | No page JS errors in exercised journey; unsaved review text preserved through refresh |
| Private-byte check | 324 versions matched SHA-256 in final backup; no repair needed |
| Backup/restore | Separate anumitra_restore_033b4ce7c2 database; all 324 files matched; evidence/restore-check.json |
| Worker recovery | Browser closed, enqueue-before-ack recovery, one inbox record and one SMTP acceptance; evidence/worker-recovery.json |
| Ambiguous SMTP | Prior ATTEMPTED marker recovered as AMBIGUOUS rather than false success |
| Production demo guard | Startup with production + demo refused; evidence/production-guard.json |
| Dependencies | Final npm audit: zero advisories; not a security certification |
| Secret exclusion | Git ignores .env, .local credentials/migration owner URL and storage/private |

The 17 backend/operations tests cover: actual local password recovery and one-time tokens; SSE/session invalidation; ungranted technical-user creation; master/metadata import previews; cycle/unknown-stage rejection; CSRF/auth denial; institution/region/assignment/committee/admin scope denials; dashboard/list/report/open/upcoming reconciliation; persistent scrutiny/deficiency/response/re-scrutiny/conditional-decision/compliance journey; frozen snapshots; identical retry replay and changed-payload rejection; contradictory transition race; internal-note privacy; concurrent EVC conflict; visit prerequisites and five complete route families; committee recommendation/authority separation; immutable published rules; unsafe upload rejection; local import replay; stale reminder suppression; real SMTP acceptance/failure exhaustion; logical reminder uniqueness; database audit immutability.

Browser journeys exercise login, overview, application review, EVC, rule simulation, mobile navigation, computed colors/fonts, reduced motion, refresh-input preservation, institution wizard, private evidence upload and actual submission. Screenshots are real rendered pages in evidence/. No pixel-identical or comprehensive accessibility certification claim is made.

The final visual gate additionally found a blank plugin-based PDF frame. It was replaced with locally bundled PDF.js canvas rendering and accessible extracted text; the final browser test asserts rendered page pixels/text before capture. The updated two-test browser run passed in 22.4 seconds. Dependency audit remained at zero advisories after adding the Node-compatible pinned renderer.

During verification, an advisory-lock query type, ownership-change retry, wizard default-submit behavior, mobile hidden-header overflow and disappearing success message were found and fixed before passing runs. An initial recovery probe exposed duplicate relay enqueueing/backlog; the relay now avoids re-enqueueing acknowledged queued work, reconciles failed/missing transport jobs and uses bounded parallel processing. The recorded recovery probe uses explicit priority 100: **1,034 ms demonstrates restart correctness, not a general alert-lateness SLA**. Prior uncertain acceptance becomes AMBIGUOUS.

Five early operations fixtures lacked copied bytes. The fixture now writes the actual PDF before metadata; exact matching fictional copies were repaired. Final complete storage/restore checks needed no repair. No failure was counted as a pass.

## Measurements

Intel Core i7-12650H, 16 logical CPUs, 15.7 GiB RAM, Windows 10.0.26300. Active 120-case seed; North supervisor scope 30 cases. One loopback client, three warmups and 20 sequential reads per endpoint; HTTP + JSON parsing included. See evidence/measurements.json.

| Endpoint | Median | p95 | Maximum |
|---|---|---|---|
| GET /api/dashboard | 26.02 ms | 32.58 ms | 34.27 ms |
| GET /api/applications?limit=15 | 17.06 ms | 24.56 ms | 26.79 ms |

No national-scale throughput, hard real-time deadline guarantee, human-effort improvement, ML accuracy or selection likelihood is inferred. A human baseline/task comparison has not been conducted.

## Limits

Compose/Podman was not run because Docker’s engine is stopped. Detailed current official policy is unverified where sources are inaccessible. No live government integration, malware scanning, production penetration certification or assistive-technology/user study is claimed. Extension/waiver, policy migration/retirement and all possible calendar branches are implemented but have not each received an exhaustive browser/concurrency matrix. The finite test suite does not prove every possible scenario.
