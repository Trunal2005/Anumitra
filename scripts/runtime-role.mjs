import pg from "pg";
import PgBoss from "pg-boss";
export async function provisionRuntime(ownerUrl, runtimeUrl) {
  const u = new URL(runtimeUrl);
  const name = decodeURIComponent(u.username);
  if (!/^[a-z][a-z0-9_]{1,62}$/.test(name))
    throw new Error("Invalid runtime role identifier");
  const database = u.pathname.slice(1);
  if (!/^[a-z][a-z0-9_]+$/.test(database))
    throw new Error("Invalid database name");
  const c = new pg.Client({ connectionString: ownerUrl });
  await c.connect();
  const role = '"' + name + '"';
  if (
    !(await c.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [name])).rowCount
  ) {
    const password = decodeURIComponent(u.password).replaceAll("'", "''");
    await c.query(
      `CREATE ROLE ${role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '${password}'`,
    );
  }
  await c.query(`GRANT CONNECT ON DATABASE "${database}" TO ${role}`);
  await c.query("CREATE SCHEMA IF NOT EXISTS pgboss");
  // Queue DDL belongs to setup; services only operate the installed queue.
  const queue = new PgBoss(ownerUrl);
  queue.on("error", () => {});
  await queue.start();
  await queue.createQueue("notification");
  await queue.stop({ graceful: true });
  await c.query(
    "CREATE TABLE IF NOT EXISTS public.session (sid varchar PRIMARY KEY, sess json NOT NULL, expire timestamp(6) NOT NULL)",
  );
  await c.query(
    "CREATE INDEX IF NOT EXISTS session_expire_idx ON public.session(expire)",
  );
  await c.query(`GRANT USAGE ON SCHEMA public,pgboss TO ${role}`);
  await c.query(`GRANT CREATE ON SCHEMA pgboss TO ${role}`);
  await c.query(
    `GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public,pgboss TO ${role}`,
  );
  await c.query(
    `GRANT USAGE,SELECT,UPDATE ON ALL SEQUENCES IN SCHEMA public,pgboss TO ${role}`,
  );
  await c.query(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgboss TO ${role}`);
  await c.query(
    `REVOKE UPDATE,DELETE ON "Audit","Snapshot","Decision","DocumentVersion","DocumentReview","DeliveryAttempt" FROM ${role}`,
  );
  await c.query(
    `GRANT UPDATE("reviewState","scanState") ON "DocumentVersion" TO ${role}`,
  );
  await c.end();
  const verify = new pg.Client({ connectionString: runtimeUrl });
  await verify.connect();
  const result = await verify.query(
    "SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user",
  );
  await verify.end();
  if (Object.values(result.rows[0]).some(Boolean))
    throw new Error("Runtime account is privileged; refuse service startup");
  return result.rows[0];
}
