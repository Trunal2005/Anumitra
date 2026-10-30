# Local institution-master contract

Reviewed 26 October 2026. This is an Anumitra contract simulator, **not an AICTE API specification, official sandbox or approval feed**. No authorised endpoint, credentials or applicable reuse agreement has been supplied or verified. No public institution dataset was imported in this improvement.

## Explicit states and provenance

The application remains `LOCAL_ADAPTER` (or explicitly `DISCONNECTED`). `LIVE_AUTHORIZED` still refuses startup because no authorised connector is installed. The local simulator response says `SANDBOX`, `LOCAL_CONTRACT_SIMULATOR` and `liveAuthorized: false`; this describes a local fictional contract fixture, not a government sandbox.

`GET /api/integrations/simulator/institutions` requires a global administrator or bureau grant. It returns one fictional institution per page, a `nextCursor`, a SHA-256 `pageChecksum` of normalized JSON records, a contract identifier and declared source metadata. Cursor `0` returns `SIM-INSTITUTE-001` in `R1`; cursor `1` returns `SIM-INSTITUTE-002` in `R2` and terminates pagination. Other cursors are rejected. This endpoint does not fetch any external URL or change masters.

Each fixture explicitly names itself fictional. It carries source ID `anumitra-local-contract-simulator`, source version `1` and retrieval/reference date `2026-10-26T00:00:00.000Z`. That is the fixture's declared provenance, not a claim of external retrieval. No lease documents, approval decisions, committee actions or application histories are imported as real data.

## Review before commit

Use Administration → Local adapter → **Load fictional simulator sample**. Inspect the fictional disclosure and records, then **Validate preview**. Institution master requests use `POST /api/integrations/master`:

```json
{
  "entity": "institutions",
  "format": "json",
  "content": "[{\"id\":\"SIM-INSTITUTE-001\",\"name\":\"Fictional Simulator Institute North\",\"regionId\":\"R1\"}]",
  "preview": true,
  "provenance": {
    "classification": "FICTIONAL_SIMULATION",
    "sourceId": "anumitra-local-contract-simulator",
    "sourceVersion": "1",
    "retrievedAt": "2026-10-26T00:00:00.000Z"
  }
}
```

The response contains a persisted `reviewId`, per-ID status and provenance. Preview writes a sync review record, not an institution. A commit sends the same payload with `preview: false` and that `reviewId`. Session/CSRF/origin checks apply. The review belongs to its actor and grant snapshot. Changing input or grants requires a new preview. Changing existing masters after preview invalidates it. Replaying the same completed review is idempotent and returns `UNCHANGED`.

The full batch is validated and committed in one database transaction under a master-import advisory lock. IDs are trimmed and allowlisted; duplicate IDs, unknown regions, scope violations and unexpected record fields are rejected. All non-null grant dimensions intersect for each master. A bounded bureau cannot create masters outside its institution/region/bureau scope. The server computes the normalized record checksum; it does not accept a caller's checksum as proof of authenticity.

Existing changed names or regions produce `CONFLICT_REVIEW_REQUIRED`. No part of that batch commits. The operator must resolve changes through a separately reviewed process; automatic master updates, retirement, deletion, scope rewrites and inference from missing rows are deliberately unsupported. There is no ordinary master-editor endpoint silently changing institutional scope. Imported masters cannot grant access or create a regulatory decision.

`SyncRun.result` and the import audit retain source classification, ID, version, declared retrieval date, normalized-content checksum, external IDs, review ID, outcomes and the create-only update/retirement policy. No new database table or normal-demo migration is required. A manually supplied file without provenance is labelled `UNVERIFIED_LOCAL`, never official. `PUBLIC_AICTE` and claims of official approval are not accepted source classifications by this local contract.

## Future authorised connector boundary

Before adding an external connector, obtain a documented authorised endpoint and contract, permission/reuse terms, credential handling, data minimization, retention periods and policy-owner review. Map official identifiers and region semantics explicitly. Use approved cursors, bounded retries/backoff, source-file checksums and update/version metadata. Review changed/retired entries before applying them, preserve external ID mappings and audit, and test conflicts and scope changes. Never import a final statutory decision or bypass institution submission, scrutiny, committee work or competent-authority action.

Current simulation tests cover local cursor handling, reviewed preview/commit, input changes, actor/scope denial, duplicate IDs, atomic conflicts, provenance persistence and replay. They do **not** verify an official network contract, external authentication, real data retention agreement, live retries or permission to reuse an AICTE directory. See [policy-source recheck](POLICY_REGISTER.md) and the dated product-verification report.

## Historical public references — 30 October iteration

Three read-only institution-hosted 2025–26 factual profiles are separate from this fictional local contract simulator and all operational cases. They do not constitute an authorized workflow/master/status feed. Field-level source/page/date/checksum details and pending team human sign-off are in PUBLIC_REFERENCE_INVENTORY. No live AICTE endpoint, credentials or contract was installed. Document-metadata batches now use one locked atomic transaction with fresh actor/state/payload checks; see the 30 October test report for reproduced risks and executed regressions.
