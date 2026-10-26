# API use

Default origin: `http://127.0.0.1:3000`. Requests are same-origin; no CORS wildcard. Every mutation requires the session CSRF value in `X-CSRF-Token`. Use `GET /api/session` first, retain its HttpOnly cookie and CSRF, then `POST /api/login` with local credentials. Login rotates the session and CSRF; use the new value. Sessions expire after eight hours. Password/grant changes invalidate other security versions. Recovery tokens expire after 15 minutes and are single-use.

Core routes:

| Endpoint | Contract |
|---|---|
| `GET /session`, `POST /login`, `/logout`, `/password`, `/recovery`, `/recovery/reset` | Authentication and local Mailpit recovery |
| `GET /options` | Scoped institutions, eligible assignees, published workflow versions |
| `GET/POST /applications` | Scoped paginated register / owned institution draft |
| `PUT /applications/:id/draft` | Editable draft only; cannot change institution/policy pin |
| `GET /applications/:id` | Case, evidence, attempts, public/internal-filtered audit, allowed actions/blockers |
| `POST /applications/:id/commands` | Allowlisted transition, expectedVersion, reason/evidence and required Idempotency-Key |
| `POST /applications/:id/notes` | Scoped INTERNAL observation |
| `POST /applications/:id/documents` | Multipart file + title/kind/documentId/validUntil/issuer; 10 MB max |
| `GET /documents`, `/documents/:versionId/content` | Scoped metadata and authenticated current/authorized historic bytes |
| `POST /documents/:versionId/review` | Human acceptance/rejection with reason; uploads never inherit acceptance |
| `GET /visits`, `POST /applications/:id/visits`, `/visits/:id/:operation` | Scheduling and separate confirm/report/complete commands |
| `POST /availability` | Committee member’s declared time interval |
| `GET /obligations`, `POST /obligations/:id/commands` | Expected revision; submit/accept/return/extend/waive |
| `GET /dashboard`, `/events`, `/alerts`, `/audits` | Scoped counts, revision SSE, inbox/delivery attempts and immutable history |
| `POST /alerts/:id/read`, `/deliveries/:id/retry` | Own inbox read / authorized reasoned retry |
| `GET/POST /rules`, `POST /rules/:id/:operation` | Draft, validate/simulate/compare, save, publish, retire |
| `POST /applications/:id/migrate-policy` | Explicit bureau authorization, expected version, reason; preserve prior/current stages and deadlines |
| `GET /reports/:kind?format=csv|pdf` | Pendency, evc, compliance, validity, overdue, regions |
| `GET /applications/:id/notice` | Deterministic authorized case-summary PDF |
| `GET /admin`, `POST /admin/users`, `/admin/grants`, `/admin/clock`, `/admin/reset` | Explicit technical/bureau permissions; demo server checks for clock/reset |
| `POST /integrations/import`, `/integrations/master`, `GET /integrations/export` | JSON/CSV preview, mapping/replay and local draft/master/metadata exchange |

All paths above have `/api` prefix. Rejected stages, missing evidence, overlaps, stale versions and changed idempotency payloads return conflict/validation errors. Cross-scope IDs return unavailable/404. No generic status PATCH exists. Role names in policy configuration cannot grant authority.

Register/report query parameters: q, state, region, institution, category, cycle, owner, from, to, overdue, open; paging page/limit (max 100), sort (createdAt/updatedAt/reference/dueAt/state), direction. Report queries share application scope/filter logic. Each report’s rows have a stated subject grain (application, visit queue, obligation, document or region).

Workflow command body example:

```json
{"command":"raise-deficiency","expectedVersion":3,"reason":"Renewed lease evidence is required for review","item":"LEASE"}
```

Send a unique `Idempotency-Key`; identical retries by the same actor and unchanged grants return the original committed result. Reusing the key with a different payload is rejected.

Application-import fields: externalId, institutionId, workflowId, category, cycle, contact, programme, intake. Unlisted fields (including status/decision) are rejected. The local adapter creates drafts, never a government approval. Master import takes entity `institutions` (id/name/regionId) or `documentMetadata` (externalId/applicationId/kind/title). Metadata remains pending private file upload. Existing master scope cannot be overwritten silently. Synchronization attempts and preview results are logged.

Document scanner contract: versions expose scanState; no local malware engine is installed, so state is NOT_SCANNED. File header/content allowlisting and sandboxed streaming are separate defenses, not proof of document authenticity.


## Institution-master review contract — 26 October 2026

Institution preview/commit now requires the [reviewed local contract](INTEGRATION_CONTRACT.md). Preview returns a persisted `reviewId` bound to the actor, intersected grants, normalized payload and current-master snapshot. Commit must send that ID with the same content; conflicts reject the complete batch and existing masters are never overwritten or retired. Provenance is explicitly FICTIONAL_SIMULATION or UNVERIFIED_LOCAL. `GET /api/integrations/simulator/institutions?cursor=0` provides the two-page fictional local fixture to authorized global admin/bureau accounts; it is not an official sandbox or external API. Existing application draft and document-metadata adapters remain local.

Scoped application details now include `brief.next` (role, task, due, assignee). Post-decision document follow-up uses accepted expiry or the configured first-review deadline rather than the old application deadline. Scoped history may include correlated escalation context, labelled current where applicable; institutional projections omit structured recipient identities. Machine report JSON retains typed enums/booleans; human labels apply to UI/CSV/PDF.
