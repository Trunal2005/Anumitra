# Prototype audit and verification — 23 October 2026 (IST)

Audited source: **9ad109d664a891f2657f95ce54a8f3bd5e9808b8**, clean main at entry, matching the prior manifest. No new application defect was reproduced in the exercised paths. Application, tests, dependencies, schema, policy values and visual design remain unchanged. This audit updates documentation/classification and records fresh execution; it does not claim complete regulatory or production readiness.

Source digest: `8ab13929135abb6c076b208ee604acbace3ededfcb543056559e34b7d742a542`. The documentation publication commit is checked against this same implementation digest. [verification.json](evidence/repair/verification.json) records the exact source revision, hashes, full invocation arguments, isolated target and timestamps.

## PS A–F outcome

The [requirement-by-requirement matrix](REQUIREMENTS.md) classifies every A–F row and cross-cutting claim using Verified working, Partially verified, Unverified or Missing, with code/API/UI and execution evidence. A, D and E have working demonstrated prototype paths. B, C and F have working core paths with explicit partial verification: legacy missing waiting durations cannot be reconstructed; dedicated overdue VISIT-to-SMTP recipient coverage is incomplete; not every report PDF/filter combination was exercised. These are bounded coverage/data limitations, not a claim that those endpoints are absent.

The primary SIH listing returned HTTP 403 on this audit's direct retrieval. The review uses the supplied full engineering brief/A–F groups and retained PS mapping; it does not assert a newly verified official statement revision. Numeric policy applicability, appointments, deadlines and quorum remain DEMO.

## Executed checks on the audited source

| Check / command | Result and evidence |
|---|---|
| `npm run typecheck` | PASS, exit 0; [output](evidence/audit-2026-10-23/typecheck.txt) |
| `npm run format:check` | PASS, exit 0; [output](evidence/audit-2026-10-23/format.txt) |
| `npm run verify:isolated` | PASS, exit 0 in one sequential invocation; fresh six-migration/fictional-seed isolated target, TypeScript and production build, **31/31 backend tests**, API restart preservation and **4/4 Chromium journeys**, no skips; [full output](evidence/audit-2026-10-23/full-run.txt), [TAP](evidence/repair/backend.tap), [browser](evidence/repair/browser.txt) |
| `node --import tsx docs/evidence/audit-2026-10-23/obligation-ui-probe.mjs` | PASS supplemental real UI/API exercise, using only the retained isolated database; [source-guarded reproduction script](evidence/audit-2026-10-23/obligation-ui-probe.mjs), [results](evidence/audit-2026-10-23/undertaking-ui.json), [extension capture](evidence/audit-2026-10-23/undertaking-extension.png) |
| `npm audit --json` | PASS, zero vulnerabilities; [JSON](evidence/audit-2026-10-23/dependency-audit.json) |
| `npm run doctor -- --strict` | PASS against existing normal demo; API/database/schema/storage/worker/SMTP ready; [output](evidence/audit-2026-10-23/doctor.txt) |
| Git whitespace and known-credential/key scans | Checked before publication; credentials, storage, backups and runtime service logs excluded |

Native backend duration: 209.204 seconds. Browser journeys: 2.8 minutes total, including repeated response/EVC/conditional-decision/undertaking/renewal/escalation/retry and controlled first-SSE-event regression. The successful build retains a non-fatal warning about chunks above 500 kB. No concurrent install/build was run during the complete gate. The disposable database is named in verification.json; its private files and credentials remain isolated under ignored .local/test-runs.

The supplemental exercise proved authority UI extension/waiver, 403 supervisor denial, 409 non-later/closed-condition rejection, exact IST deadline rendering, original deadline preservation, revision history and both human actions in audit. Its initial probe incorrectly expected 400 for a conflict guard. That test-setup assumption was corrected to the inspected 409 contract with exact error assertions; [initial failed output](evidence/audit-2026-10-23/probe-status-assumption.txt) is retained. No application assertion or production guard was weakened. The extension capture was visually inspected.

A repeat initially found its previously consumed OPEN fixture already waived; [that output](evidence/audit-2026-10-23/probe-reused-fixture.txt) is retained. The published probe now creates its own new fictional condition through authenticated institution/reviewer/authority commands, then performs extension/waiver through the UI. That exact retained script passed; its SHA-256 and application source digest are in undertaking-ui.json. It refuses an unmarked database or mismatched implementation, requires a free test API port, and stops only its own API child. This supplemental evidence script is separate from the unchanged main test suite.

## Native services and preservation

The pre-existing project PostgreSQL (55432), API (3000), single worker and Mailpit (SMTP 1025 / HTTP 8025) were identified and healthy. They were reused. No normal-demo reset, seed, migration, storage cleanup, credential overwrite or process termination ran. Full-suite and supplemental mutations used only fictional records in the marked disposable database. The supplemental API child was owned and stopped by its probe; the normal worker was not duplicated. Final HTTP/browser and strict-doctor checks are performed after the ordinary push; no deployment is involved.

## Hosted CI and historical evidence

Hosted CI is now directly verified for the audited source 9ad109d: [successful run 39942039627](https://github.com/Trunal2005/Anumitra/actions/runs/39942039627), including dependency installation, format check, full isolated gate and audit. [Retained job/step metadata](evidence/audit-2026-10-23/ci-9ad109d.json) records the exact SHA. This does not assert a CI outcome for a later documentation-only commit, nor does it verify the project's local Compose deployment path.

The [previous successful 3c01372 report](TEST_REPORT_REPAIR_3c01372.md), [manifest](evidence/repair/verification-3c01372.json), [TAP](evidence/repair/backend-3c01372.tap), [browser output](evidence/repair/browser-3c01372.txt) and original commit 9ad109d preserve the earlier gate/captures. The failed 0d6faa2 full run, its browser-only rerun, the earlier SSE failure and all prior reports remain historical. No old failure is presented as a pass. Previous clean-copy/restore/normal-upgrade evidence is not relabelled as a new check in this audit.

## Remaining limits

Local Compose execution remains unverified. Official numeric policies and statutory appointments need qualified policy-owner review. No authorised live AICTE adapter, antivirus/authenticity scanner, exactly-once SMTP, full accessibility, scale benchmark, production certification or selection-probability claim is made. Local JSON/CSV adapters, bounded file checks and explicit NOT_SCANNED status remain honest prototype capabilities. No paid service/inference, new licence or deployment was added.
