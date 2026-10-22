import net from "node:net";
import { mkdir, access } from "node:fs/promises";
import { constants } from "node:fs";
import { db } from "../db/index.ts";
export async function tcp(host: string, port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(1000, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}
export async function readiness() {
  let database = false,
    schema = false,
    storage = false,
    worker = false;
  try {
    await db.$queryRaw`SELECT 1`;
    database = true;
    const table = await db.$queryRaw<
      { ready: boolean }[]
    >`SELECT to_regclass('public."Escalation"') IS NOT NULL AS ready`;
    schema = table[0].ready;
    if (schema) {
      const heartbeat = await db.workerHeartbeat.findUnique({
        where: { id: "notification" },
      });
      worker =
        !!heartbeat &&
        ["READY", "SCANNING"].includes(heartbeat.status) &&
        Date.now() - +heartbeat.updatedAt < 15000;
    }
  } catch {}
  try {
    const directory = process.env.STORAGE_PATH ?? "storage/private";
    await mkdir(directory, { recursive: true });
    await access(directory, constants.W_OK);
    storage = true;
  } catch {}
  const host = process.env.SMTP_HOST ?? "127.0.0.1";
  const smtp =
    ["127.0.0.1", "localhost", "mailpit"].includes(host) &&
    (await tcp(host, Number(process.env.SMTP_PORT ?? 1025)));
  const dataAvailable = database && schema && storage;
  return {
    product: "Anumitra",
    status: !dataAvailable
      ? "unavailable"
      : worker && smtp
        ? "ready"
        : "degraded",
    dataAvailable,
    checks: { database, schema, storage, worker, smtp },
    integration: process.env.INTEGRATION_MODE ?? "LOCAL_ADAPTER",
  };
}
