# Zero-cost setup and recovery

Only local open-source Node, PostgreSQL, pg-boss and Mailpit are required. No GPU or AI model. Initial dependency, font, browser and optional container-image downloads need internet; built operation uses local files/services exclusively. No analytics, runtime font CDN or external messaging relay exists.

Native setup is the executed route on this Windows host. `npm ci` then `npm run bootstrap`; set `PG_BIN` if PostgreSQL binaries are elsewhere. Install Mailpit from https://github.com/axllent/mailpit/releases and place its executable at `.local/mailpit.exe`, or start your installed Mailpit manually bound to loopback SMTP 1025 / HTTP 8025. No SMTP relay option is enabled. An external SMTP host is rejected by application code.

The ignored `.env` holds only runtime configuration. `.local/migration.env` separately holds the migration-owner URL. `.local/pg-password` is used for initial cluster creation. Restrict these files with host account permissions. Runtime role `anumitra_app` cannot own/alter public schema, update/delete audit/snapshot/decision records, or change immutable document bytes. Its pg-boss schema has the DDL privileges needed by the queue; regulatory public tables remain migration-owner controlled.

`npm run db:migrate` uses the separate owner credential. After adding tables, run `npm run db:harden` while API/worker are stopped to apply grants; this rotates the runtime password, so restart both. `npm run db:generate` must run while Windows processes using the Prisma DLL are stopped if the engine version changes. Do not upgrade to a prerelease based on the CLI banner.

Container alternative (prepared, not executed here because Docker engine is stopped): use free Podman with Compose support or a suitable Docker engine. Set `POSTGRES_PASSWORD` and `SESSION_SECRET` in your shell, then `podman compose up --build`. The supplied Compose file defines PostgreSQL persistence, private evidence, Mailpit capture, application/worker and readiness. Container path has not received the native role-hardening verification; use separate runtime/migration roles before operational use. No paid desktop-container license is required by this project.

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
