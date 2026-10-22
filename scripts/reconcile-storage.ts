import "dotenv/config";
import { db } from "../packages/db/index.ts";
import { readdir, stat, access, unlink } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(process.env.STORAGE_PATH ?? "storage/private");
const referenced = new Set(
  (await db.documentVersion.findMany({ select: { storageKey: true } })).map(
    (x) => x.storageKey,
  ),
);
const missing = [];
for (const key of referenced)
  try {
    await access(path.join(root, key));
  } catch {
    missing.push(key);
  }
const candidates = [];
const threshold = Date.now() - 24 * 3600000;
for (const name of await readdir(root)) {
  if (!/^[a-f0-9-]{36}$/.test(name) || referenced.has(name)) continue;
  const entry = path.join(root, name);
  const info = await stat(entry);
  let pending = false;
  try {
    await access(path.join(root, ".staging", name + ".pending"));
    pending = true;
  } catch {}
  if (info.isFile() && info.mtimeMs < threshold && !pending)
    candidates.push(name);
}
const apply = process.argv.includes("--apply");
if (apply) {
  if (missing.length)
    throw new Error(
      "Missing referenced bytes: no cleanup is allowed until corruption is investigated",
    );
  for (const key of candidates) {
    if (await db.documentVersion.count({ where: { storageKey: key } }))
      continue;
    try {
      await access(path.join(root, ".staging", key + ".pending"));
      continue;
    } catch {}
    await unlink(path.join(root, key));
  }
}
console.log(
  JSON.stringify(
    {
      mode: apply ? "APPLY" : "DRY_RUN",
      minimumAgeHours: 24,
      missingReferencedKeys: missing,
      unreferencedOldKeys: candidates,
      pendingWritesNeverDeleted: true,
      pendingMarkers: await readdir(path.join(root, ".staging")).catch(
        () => [],
      ),
    },
    null,
    2,
  ),
);
await db.$disconnect();
