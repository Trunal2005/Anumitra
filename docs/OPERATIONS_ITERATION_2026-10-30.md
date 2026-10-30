# Operational product iteration — 29–30 October 2026

Entry: clean local main at `22afb3a4c89c7e3ad658296632a98a1eb8880b48`; the prior source manifest identified tested implementation `54206f2`. Entry hosted run 40333810654 completed successfully. Normal PostgreSQL/API/worker/Mailpit were already running and were preserved during development. No normal bootstrap, migration, seed, reset or private-upload cleanup was run.

## Implemented checklist

- Role-specific Action desks derive task subjects, responsibility, priority, provenance counts and drilldowns from intersected backend scope. Priority uses recorded deadlines, IST day, known age and stable IDs; it is not AI/risk prediction. Unknown stage durations are null/Not recorded.
- Review queue adds compact filters/chips, clear filters, server pagination and ordering, earliest deadline subject, stage age, next action and eligible owner context. Active workload and stage/region counts have matching queue links.
- Evidence-first case review uses a compact stage rail, evidence/deficiency/history tabs, exact response version links and separate authorized task controls. Authority packets show findings/recommendations, reviewed evidence and blockers, with explicit human confirmation. Case pins and immutable snapshots remain in the existing engine.
- Committee agenda is a distinct assigned-case workspace with current-attempt recommendation state, report/evidence readiness, previous attempt history and separate recommendation/completion controls. No meetings, attendees or statutory appointments are fabricated. A recommendation-time evidence-version snapshot is not stored and is labelled accordingly.
- EVC planner provides an IST week calendar and accessible agenda, real availability/busy intervals, eligible queue, proposal/confirmation, report submission/completion review and a focus-managed appointment drawer. Per-case coordination/participant permissions remain explicit. Cancellation/rescheduling use the original locked service.
- Compliance ledger keeps open/submitted/closed conditions traceable, original/current due dates, evidence state, escalation state and the original authorized review/extension/waiver form for one selected row.
- Evidence register separates effective and latest submission, allows selected-file comparison with private PDF.js previews, retains review/version history and exposes only record-authorized review/upload controls. Pending/rejected replacements preserve accepted expiry.
- Workflow policies use a constrained visual ordered list with keyboard movement and a fixed final authority stage. Published/retired forms are read-only. Clone-to-draft/save/publication retain revision/hash controls. Simulation evaluates actual constrained policy/scenario guards without changing cases; hypothetical dates are labelled DEMO windows.
- Public references are a separate read-only historical collection with field-level source/provenance. See PUBLIC_REFERENCE_INVENTORY. New fictional drafts and fresh isolated seeds receive server-side provenance; legacy records are not silently relabelled. No authorized pilot feed is installed.
- Metadata batches now use one transaction, ordered case/mapping locks and fresh permission/state/hash checks after locking. No batch partial commit or silent conflicting replay is accepted.
- Authenticated UI uses charcoal navigation, light neutral canvas, white surfaces and restrained orange/amber actions. Public landing/brand remain unchanged. Old generic operational screens were removed. Record-update connectivity is labelled explicitly, not as live AICTE data.

## Reproductions and checks to date

Before screenshots and `metadata-reproduction.json` are in `evidence/operations-2026-10-29/before`. On the entry source: a failed two-row batch committed one mapping; conflicting payloads both returned 200; a stale editable-state check permitted import after a case entered SCRUTINY. Reproductions used only the retained marked isolated target.

`targeted-1` retains the initial lock-observer test failure. PostgreSQL activity statistics requested inside the lock-holding transaction needed snapshot refresh for reliable polling. The barrier now clears the activity-statistics snapshot; status assertions and timeouts remain unchanged. `targeted-2` passed all six new regressions; 18 unrelated repair scenarios were explicitly skipped by the name filter. These targeted results are not a complete gate and record their own working-source hashes.

`browser-1` preserves the failed first full browser attempt: the new private build root exposed an Express absolute-path dotfile restriction on deep SPA links. The fallback now resolves the fixed index file relative to its trusted web root; private-file access was not broadened. A walkthrough exact-label selector was also corrected to the named combobox. `browser-2` retains subsequent diagnostic results, including a broad test exhausting its overall budget; responsive checks are being separated into an independent test with the same assertions/timeouts. Full browser and final isolated-gate results will be recorded after execution, against an exact committed source. Old reports/evidence remain intact. Test frontend output now stays inside each disposable target, rather than overwriting the normal demo's built assets.

## Boundaries

Numerical policy remains DEMO. Historical missing intervals remain unknown. Public facts are historical and team human sign-off is pending; full-PDF redistribution permission and an authorized AICTE workflow contract are not established. No real college is given fictional operational visits, leases or compliance findings. No malware/authenticity scanning, Docker/Compose execution, formal GIGW/WCAG certification, production readiness, national-scale benchmark or measured efficiency gain is claimed.

Accessibility design benchmarks: [GIGW](https://guidelines.india.gov.in/) and [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html). Automated keyboard/focus, sampled contrast, narrow-layout and enlargement checks are finite verification, not certification. Broad report/filter permutations remain a coverage boundary.
