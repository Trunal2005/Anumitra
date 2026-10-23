# Zero-cost setup and recovery

Only local open-source Node, PostgreSQL, pg-boss and Mailpit are required. No GPU or AI model. Initial dependency, font, browser and optional container-image downloads need internet; built operation uses local files/services exclusively. No analytics, runtime font CDN or external messaging relay exists.

Native setup is the executed route on this Windows host. `npm ci` then `npm run bootstrap`; set `PG_BIN` if PostgreSQL binaries are elsewhere. Install Mailpit from https://github.com/axllent/mailpit/releases and place its executable at `.local/mailpit.exe`, or start your installed Mailpit manually bound to loopback SMTP 1025 / HTTP 8025. No SMTP relay option is enabled. An external SMTP host is rejected by application code.

The ignored `.env` holds only runtime configuration. `.local/migration.env` separately holds the migration-owner URL. `.local/pg-password` is used for initial cluster creation. Restrict these files with host account permissions. Runtime role `anumitra_app` cannot own/alter public schema, update/delete audit/snapshot/decision records, or change immutable document bytes. Queue setup DDL runs with the owner; its pg-boss schema grants are limited to queue operation; regulatory public tables remain migration-owner controlled.

`npm run db:migrate` uses the separate owner credential. After adding tables, run `npm run db:harden` while API/worker are stopped to apply grants; this preserves an existing runtime password and reapplies grants for additive tables; restart both. `npm run db:generate` must run while Windows processes using the Prisma DLL are stopped if the engine version changes. Do not upgrade to a prerelease based on the CLI banner.

Container alternative (prepared, not executed here because Docker engine is stopped): use free Podman with Compose support or a suitable Docker engine. Set distinct random hex `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `WORKER_DB_PASSWORD` and `SESSION_SECRET` in your shell, then `podman compose up --build`. The supplied Compose file defines PostgreSQL persistence, private evidence, Mailpit capture, application/worker and readiness. A one-shot bootstrap uses the owner for migrations/seed/queue installation; API and worker receive only the separate restricted runtime URL. This configuration is source-reviewed, not container-executed. No paid desktop-container license is required by this project.

## Back up and restore

Stop API/worker writes first for a consistent database-plus-files snapshot. Run:

```powershell
node scripts/backup.mjs
node scripts/restore-check.mjs
```

Backups are restricted to private ignored `.local/backups`, never web assets. The first command uses `pg_dump -Fc` and copies private bytes. The second creates a new randomly named isolated restore database, restores the latest snapshot and checks SHA-256 for every version. It never drops or overwrites the original database. Its result is in `docs/evidence/restore-check.json` when actually executed. Retained restore databases may be removed manually after review.

For recovery into a new instance: restore the custom dump with `pg_restore --exit-on-error` to a **fresh** database; copy `private-documents` into the new instance’s private storage root; set its own secrets/runtime grants; then start API/worker. Preserve IDs, storage keys and bytes together. Backups include sensitive institutional records in real use; protect them with filesystem/volume security and retention procedures. Encryption at rest is not implemented by application code.

Native database shutdown (after stopping API/worker):

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D .local/db -m fast -w stop
```

Restart it with `npm run bootstrap`. That command preserves seeded data. An authorized demo admin can create a new run through Administration; old run history/bytes remain private, and old reminder intents become obsolete. Production refuses demo controls.

## Isolated repair verification

Run the complete gate sequentially, without a concurrent install/build or clean-copy check against this checkout. The harness builds first, then runs backend tests and browser journeys, recording the exact source HEAD/hashes in docs/evidence/repair/verification.json. A separate browser-only pass is not a complete gate. Fresh migrations and seeds target only the new marked test database; the normal demo is refused.

`npm run verify:isolated` creates a new `anumitra_test_<timestamp>` database with its own restricted runtime role, private storage, random fictional-account password, API 3100 and Mailpit SMTP 1125 / HTTP 8125. The normal 3000/1025/8025 demo and its clock/credentials are not used. Existing ports must be available. Install Chromium with `npx playwright install chromium`. Provide local owner configuration in ignored `.local/migration.env`, or `MIGRATION_DATABASE_URL` on CI. No reset/drop cleanup runs; disposable data remains under `.local/test-runs` for investigation.

`npm test` runs backend/operations/repair tests with the same isolation. `npm run test:browser` provisions a new isolated browser target. Direct test-file execution against the normal `.env` is deliberately refused. `node scripts/verify-clean-checkout.mjs` copies only Git-visible source into a new private directory, runs npm ci/generate/build and fresh/second migration-seed checks. `node scripts/in-test.mjs scripts/verify-persistence.mjs` verifies a backup/restore and every private-file hash in another retained test database.

`npm run doctor -- --strict` requires API, database/schema, storage, fresh worker and SMTP. Default doctor distinguishes available approval data from degraded delivery. Public health never exposes connection strings or passwords. `npm run storage:reconcile` is dry-run; `-- --apply` only considers unreferenced UUID files older than 24 hours, never pending markers, and refuses cleanup if referenced files are missing.

For an already managed local PostgreSQL installation, prepare a new database and owner/runtime credentials, run `npm ci`, `npm run db:generate`, `npm run db:migrate`, seed only a fresh demo, and provision the runtime grants before starting services. An existing .env without the native private cluster/password intentionally stops native bootstrap with an actionable message instead of replacing credentials.

Native hardening preserves existing API credentials and creates/preserves a separate worker URL in ignored .env. Compose uses WORKER_DB_PASSWORD for the worker. Its account reads monitored source records and writes queue, notification, escalation, heartbeat and append-only audit data; it cannot insert Decision or update Application.state. Application.updatedAt privilege permits PostgreSQL row locking. Migration-owner credentials are absent from both Compose service environments.
