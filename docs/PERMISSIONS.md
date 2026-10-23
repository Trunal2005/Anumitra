# Permissions

All regulatory reads use `scope()` and all changes additionally check command-specific grants. No grant means deny. Scope applies to records, counts, exports, documents, inbox and live invalidation. Direct-ID denial uses unavailable/404. Multiple explicit grants are supported.

| Grant | Read scope | Permitted actions |
|---|---|---|
| INSTITUTION | Own institution | Draft, upload/renew, submit, answer deficiency, submit obligation evidence |
| REVIEWER | Assigned cases intersecting every configured institution/region/bureau restriction | Scrutiny, private internal observation, document/response verification, guarded stage completion |
| SUPERVISOR | Intersection of configured institution/region/bureau restrictions, or explicit global | Assignment, scrutiny oversight, EVC coordination/report completion, evidence/compliance review, retry |
| BUREAU | Intersection of configured institution/region/bureau restrictions, or explicit global | Supervision, bounded delegation, local adapter; shared policy publication/retirement requires global scope |
| COMMITTEE | Assigned stage or visit participant | Own EVC/SAC/SHC recommendation and stage completion, assigned EVC report, own availability |
| AUTHORITY | Intersection of configured institution/region/bureau restrictions, or explicit global | Final decision, condition extension/waiver |
| AUDITOR | Explicit scope | Read-only history and reports |
| ADMIN | Technical metadata only | Template drafts, local adapter draft imports, demo controls; no regulatory reads or decisions by default |

Institution-visible history excludes INTERNAL observations. Standard notices omit internal observations. Scoped officials can download historical document bytes; institution users can download the newest submitted and accepted effective versions. Review and decision snapshots reference exact versions. Grant updates increment the security version, invalidating sessions and SSE. SSE rechecks stored sessions, security versions and current grants every three seconds. No normal application endpoint edits audit, snapshot or decision rows; database triggers additionally reject changes.

An explicitly global BUREAU or AUTHORITY grant is deliberately broad. Do not create it for operational use without a real authorization process. Technical administrators cannot publish policies or self-grant authority. Proposed software roles are not statutory appointments.


## Repair invariants

Every grant intersects institution, region and bureau restrictions. Distinct valid grants form a union. An institution-only official grant never becomes global. Global official access requires global=true; legacy fully unscoped designated global roles are explicitly backfilled by the additive migration. ADMIN grants give technical access, not regulatory case reads.

An institution role needs an institution reference. Committee roles need EVC/SAC/SHC and bounded or explicit global eligibility, plus actual stage assignment/visit participation for case reads. Active status is checked for sessions, recipients and assignments. Scoped bureau delegation must retain every boundary of its authorising grant and cannot grant authority, bureau, admin or global delegation. The seeded global bureau has separate canDelegateGlobal permission; self-grants remain denied. Publishing/retiring shared global policy requires an explicit global bureau grant.

Assignees must match all dimensions, active status and the current stage role. No eligible actor means ownerId=null and a visible unassigned queue; coordinators can assign only eligible actors. Assignment does not renew the deadline identity. An institution may download the newest submitted version and the accepted effective version; other historical bytes remain scoped official evidence.

Recipients are selected by configured responsibility (institution, actual assignee, designated supervisor/bureau/authority), then rechecked against read scope. Being an auditor or merely being able to read does not subscribe a user to every alert. Escalation records name a level, role, recipients or UNASSIGNED, policy, due time and resolution. A designated recipient/scoped coordinator may acknowledge with a reason. Eligibility changes reroute automatically with audit; arbitrary operator recipient override is not supported.
