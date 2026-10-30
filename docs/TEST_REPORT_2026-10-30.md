# Anumitra operational iteration verification — 30 October 2026

Status: **complete isolated gate PASSED** on source `14002e4e79b0d865f3c6715419c9ba61c405e44c`.

Implementation digest: `7cc274f15698a1294e25358642e957315b32ebb85289548c811164a275c67eac`. The manifest in `evidence/operations-2026-10-30/full-3/verification.json` hashes every implementation/config/test source file. Later documentation/evidence-only commits preserve that digest.

| Executed check | Actual result |
|---|---|
| `npm run verify:isolated -- --evidence-dir=docs/evidence/operations-2026-10-30/full-3` | Exit 0; 41/41 backend cases, zero skipped/cancelled, five operational and five retained Chromium journeys passed sequentially |
| TypeScript and isolated Vite build | Passed within that complete gate; isolated build emitted the large-chunk warning |
| API restart before browsers and between browser files | All case IDs, versions and policy pins preserved; worker/database/storage retained |
| `npm run format:check` | Passed after the paged-desk change; raw output in format-check-paged-desk.txt |
| `npm audit --json` | Exit 0, zero advisories at retrieval on 30 October; dependency manifests unchanged |
| `npm run build` for normal `dist/web` | Exit 0; normal production build passed separately after the isolated gate |
| `node --import tsx scripts/doctor.ts --strict` | Exit 0; API/database/schema/storage/worker/SMTP ready; LOCAL_ADAPTER |
| Read-only normal Chromium smoke | Nine authenticated operational pages and a scoped case loaded; all page APIs 200, no page errors |
| Normal preservation checks | All 334 applications, 326 evidence-version metadata records, 15 users, clock and credential fingerprints match baseline; all 326 private files match stored hashes |

The recorded service/test phase ran from 2026-10-30T09:36:39.770Z to 2026-10-30T09:45:44.573Z. Backend TAP duration: 274.3 seconds; operational browser group: 2.7 minutes; retained browser group: 1.6 minutes. Provisioning, typecheck and build preceded that recorded service/test interval. These are measured fixture runs, not an efficiency or national-scale benchmark.

The paged worklist was exercised against **322 real scoped isolated tasks**: first 25, next 25 and return to the first page, with exact task IDs matched to the real API. It is not a mocked task dataset. See `task-pagination.json`.

Accessibility checks cover keyboard navigation, drawer focus/return, visual stage movement, table keyboard focus, widths 768/390/320 and 200% **CSS** enlargement. Five sampled contrast ratios were 14.19, 5.03, 11.00, 5.75 and 16.24. CSS enlargement is not a native browser-zoom certification; these finite checks do not establish formal GIGW/WCAG compliance.

The actual single-page/context evaluator journey passed and retained its real UI recording, English milestone subtitles and a separate paced explanation with offline English narration outside the repository. No paid API/service was used. Raw source video remains unmodified; the narrated derivative adjusts playback pacing and adds a caption area below the app image. Videos are not committed.

Use the [seven-screen before/after gallery](OPERATIONS_VISUAL_REVIEW_2026-10-30.md), [field-level public-source inventory](PUBLIC_REFERENCE_INVENTORY.md) and [acceptance matrix](REQUIREMENTS.md). The three historical 2025–26 profiles do not establish 2026–27 approval; team human sign-off remains pending.

The normal services are available at http://127.0.0.1:3000 and http://127.0.0.1:8025. Existing startup commands/prerequisites are in the root README; no normal migration, seed, reset or storage cleanup was performed.

Hosted CI for this publication has not been asserted from these local results. Check the exact published SHA in GitHub Actions. Official policy applicability, local Compose, live AICTE integration, malware/authenticity scanning, exhaustive report permutations, missing historical intervals and broader security/accessibility assurance remain unverified/partial/missing as classified in REQUIREMENTS. No production-readiness or selection-probability claim is made.

The following sections preserve diagnostic history; their failures are not replaced by the passing run.

Entry: clean main `22afb3a4c89c7e3ad658296632a98a1eb8880b48`. Earlier 26 October results remain in their dated report. Normal demo records, credentials and private files are preserved; all development mutations use marked isolated targets and storage. No normal bootstrap/migration/seed/reset was run.

## Retained diagnostic attempts

- `evidence/operations-2026-10-29/before`: seven actual baseline screens and three confirmed metadata races.
- `targeted-1`: initial lock-observer statistics-snapshot failure. `targeted-2`: all six new regressions passed; 18 unrelated scenarios explicitly skipped by the name filter.
- `browser-1`: seven failures, principally deep SPA fallback rejection of the private `.local` build path. Fixed by resolving the fixed index relative to its trusted web root, without allowing arbitrary private files.
- `browser-2`: role/policy/responsive checks exhausted a broad scenario's budget; exact-label lookups missed wrapped selects. The runner reached its unchanged 600-second cap after four reported outcomes, so remaining journeys were not completed. This is not a passing seven-journey run.
- `browser-3`: three failures. Operational assertions completed but context cleanup exceeded the broad scenario budget; mobile backlog grid expanded to 675px on a 390px viewport; a textarea helper was included in its accessible name. Tests were separated, grid children constrained and form labels/helpers associated explicitly.
- `browser-4`: two targeted failures. Reference-page grid still overflowed at 390px. The continuous journey reached reviewed deficiencies but a session response from a destroyed document caused a protocol-body error during role switching. It now waits for the current rendered signed-in/login state.
- Each verification JSON records its own working-source manifest. None is relabelled as a later source result. Private Playwright traces and credentials stay ignored.

- `browser-5`: TypeScript and build passed, then isolated API readiness failed while the local PostgreSQL cluster was stopped after the interruption. No browser test ran. The existing cluster completed standard crash recovery without initialization, migrations, seeding or file cleanup. A read-only fingerprint check matched all 334 normal applications, 326 evidence versions, users, clock and credentials.
- `browser-6`: the continuous guarded workflow passed in one page/context; responsive pages at 768/390/320 and all five sampled contrast ratios passed. The 200% CSS enlargement assertion still failed because the header extended to 1481px on a 1440px viewport. The measured container-based header fix keeps the document at 1440px. Its final suite proof is pending below.

The full browser gate now runs the two independent test files sequentially with a persistence-checked API restart between them. Their combined role switches would otherwise consume a shared 30-attempt/15-minute in-memory login bucket. The production limiter and business/security assertions remain intact; no spoofed IP, reset endpoint, increased limit or database reset was introduced. Worker, database and private storage persist across both files. All ten journeys must pass for the overall gate to pass.

The final result and source manifest appear above; diagnostic runs remain bound to their original source records. See [implementation checklist](OPERATIONS_ITERATION_2026-10-30.md) and [public source inventory](PUBLIC_REFERENCE_INVENTORY.md).

## First complete gate — retained failure

Source `c1eb46355145c110a9edd39cf35c38a4ee4c857a`; command `npm run verify:isolated -- --evidence-dir=docs/evidence/operations-2026-10-30/full-1`.

TypeScript/build and all 41 backend tests passed without skips. All five new operational journeys passed, including 200% CSS enlargement, five contrast pairs and the continuous actual-browser recording. Four of five legacy journeys passed. The remaining journey's exact `getByText("No application transition pending")` matched both the new compact responsibility header and the existing action panel. The expected text/state was present twice; the assertion now targets `.context-strip`, retaining exact text and visibility checks. No timeout or business/security assertion was weakened. `full-1` remains FAILED with its original source manifest and raw output. A complete rerun is required for the changed test source.

## Second complete gate — retained failure

Source `9890e9d0504f44c9ddca49db9a6018f3cc2a2b5e`; `full-2`. All 41 backend cases passed again. Four new browser journeys passed, including the continuous workflow. The responsive scenario failed while capturing a full-page Action desk image, not on a workflow or geometry assertion. Earlier captures measured 1280 × 84,531 and 390 × 76,415 pixels: the unbounded real worklist made capture work excessive. The repaired desk pages 25 tasks at a time, preserves full scoped counts/filtering, and contains the table in an accessible scroll region. Pagination receives real-API next/previous assertions. Responsive evidence uses bounded viewport captures with animations disabled. No timeout increase or business/security assertion relaxation was introduced. The default gate stopped before the legacy browser group; `full-2` remains FAILED.

## Media and publication checks

The narrated MP4 is 2 minutes 39 seconds with offline Microsoft David English speech and captions below the actual app image. The original 103.36-second one-page recording and its subtitles remain unchanged outside Git. Sample frames at 30, 90 and 145 seconds were visually inspected; AAC audio decoded without errors and is non-silent. Full-page capture moments in the original automation can briefly resize the recorded view; the raw recording is retained for audit. Media metadata/provenance is in walkthrough-media-summary.json; video/audio files are not committed.

GitHub main was fetched after the passing gate. The three implementation/repair commits were a safe fast-forward from the reviewed entry main; no reset, force-push, branch deletion or unrelated-history integration was used. A final documentation/evidence-only publication commit preserves the tested implementation digest. The exact published SHA is reported in the handoff and checked against remote main.
