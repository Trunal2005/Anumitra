import pg from "pg";
export async function provisionWorker(ownerUrl, workerUrl) {
  const url = new URL(workerUrl),
    name = decodeURIComponent(url.username),
    database = url.pathname.slice(1);
  if (
    !/^[a-z][a-z0-9_]{1,62}$/.test(name) ||
    !/^[a-z][a-z0-9_]+$/.test(database)
  )
    throw new Error("Invalid worker role/database identifier");
  const role = '"' + name + '"';
  const owner = new pg.Client({ connectionString: ownerUrl });
  await owner.connect();
  try {
    if (
      !(await owner.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [name]))
        .rowCount
    )
      await owner.query(
        `CREATE ROLE ${role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${decodeURIComponent(url.password).replaceAll("'", "''")}'`,
      );
    await owner.query(`GRANT CONNECT ON DATABASE "${database}" TO ${role}`);
    await owner.query(`GRANT USAGE ON SCHEMA public,pgboss TO ${role}`);
    await owner.query(
      `GRANT SELECT ON ALL TABLES IN SCHEMA public,pgboss TO ${role}`,
    );
    await owner.query(
      `GRANT INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA pgboss TO ${role}`,
    );
    await owner.query(
      `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgboss TO ${role}`,
    );
    await owner.query(
      `GRANT USAGE,SELECT,UPDATE ON ALL SEQUENCES IN SCHEMA public,pgboss TO ${role}`,
    );
    await owner.query(
      `GRANT INSERT ON "Outbox","Notification","DeliveryAttempt","Audit","Escalation","WorkerHeartbeat" TO ${role}`,
    );
    await owner.query(
      `GRANT UPDATE ON "Outbox","Notification","Escalation","WorkerHeartbeat" TO ${role}`,
    );
    await owner.query(`GRANT UPDATE("updatedAt") ON "Application" TO ${role}`); // Required for SELECT FOR UPDATE; state/decision writes remain forbidden.
  } finally {
    await owner.end();
  }
  const verify = new pg.Client({ connectionString: workerUrl });
  await verify.connect();
  try {
    const row = (
      await verify.query(
        `SELECT rolsuper,rolcreatedb,rolcreaterole,has_table_privilege(current_user,'"Decision"','INSERT') AS can_insert_decision,has_column_privilege(current_user,'"Application"','state','UPDATE') AS can_update_state FROM pg_roles WHERE rolname=current_user`,
      )
    ).rows[0];
    if (Object.values(row).some(Boolean))
      throw new Error("Worker role has excessive privileges");
    return row;
  } finally {
    await verify.end();
  }
}
