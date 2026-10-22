import "dotenv/config";
import { db } from "../packages/db/index.ts";
import { access, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const rows = await db.documentVersion.findMany({ include: { document: true } });
const directory = path.resolve(process.env.STORAGE_PATH ?? "storage/private");
const byHash = new Map<string, Buffer>();
const missing = [];
let checked = 0;
for (const v of rows) {
  try {
    const bytes = await readFile(path.join(directory, v.storageKey));
    if (createHash("sha256").update(bytes).digest("hex") !== v.hash)
      throw new Error("Hash mismatch " + v.id);
    byHash.set(v.hash, bytes);
    checked++;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") missing.push(v);
    else throw e;
  }
}
let repaired = 0;
for (const v of missing) {
  if (
    process.argv.includes("--repair-test-fixtures") &&
    process.env.DEMO_MODE === "true" &&
    v.document.title === "Operation evidence" &&
    byHash.has(v.hash)
  ) {
    await writeFile(path.join(directory, v.storageKey), byHash.get(v.hash)!, {
      flag: "wx",
    });
    repaired++;
  } else throw new Error("Missing private bytes: " + v.id);
}
console.log(
  JSON.stringify({
    checked,
    repairedExactTestFixtures: repaired,
    total: rows.length,
  }),
);
await db.$disconnect();
