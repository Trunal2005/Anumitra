# Permissions

All regulatory reads use `scope()` and all changes additionally check command-specific grants. No grant means deny. Scope applies to records, counts, exports, documents, inbox and live invalidation. Direct-ID denial uses unavailable/404. Multiple explicit grants are supported.

| Grant | Read scope | Permitted actions |
|---|---|---|
| INSTITUTION | Own institution | Draft, upload/renew, submit, answer deficiency, submit obligation evidence |
| REVIEWER | Assigned cases within region/bureau | Scrutiny, private internal observation, document/response verification, guarded stage completion |
| SUPERVISOR | Explicit region/bureau | Assignment, scrutiny oversight, EVC coordination/report completion, evidence/compliance review, retry |
| BUREAU | Explicit bureau/region or explicit global | Supervision, policy publication/retirement, explicit grants to other users, local adapter |
| COMMITTEE | Assigned stage or visit participant | Own EVC/SAC/SHC recommendation and stage completion, assigned EVC report, own availability |
| AUTHORITY | Explicit region/bureau or explicit global | Final decision, condition extension/waiver |
| AUDITOR | Explicit scope | Read-only history and reports |
| ADMIN | Technical metadata only | Template drafts, local adapter draft imports, demo controls; no regulatory reads or decisions by default |

Institution-visible history excludes INTERNAL observations. Standard notices omit internal observations. Historical document bytes are reviewer-only; institution users can download current versions. Review and decision snapshots reference exact versions. Grant updates increment the security version, invalidating sessions and SSE. SSE rechecks stored sessions, security versions and current grants every three seconds. No normal application endpoint edits audit, snapshot or decision rows; database triggers additionally reject changes.

An explicitly global BUREAU or AUTHORITY grant is deliberately broad. Do not create it for operational use without a real authorization process. Technical administrators cannot publish policies or self-grant authority. Proposed software roles are not statutory appointments.
