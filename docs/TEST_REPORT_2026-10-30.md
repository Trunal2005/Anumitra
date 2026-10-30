# Anumitra operational iteration verification — 30 October 2026

Status: implementation verification in progress. No complete passing gate is claimed for the current uncommitted source.

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

The final complete isolated gate, exact source/digest, finite accessibility measurements, normal readiness/preservation checks, before/after links and remaining limits will be appended after execution. See [implementation checklist](OPERATIONS_ITERATION_2026-10-30.md) and [public source inventory](PUBLIC_REFERENCE_INVENTORY.md).
