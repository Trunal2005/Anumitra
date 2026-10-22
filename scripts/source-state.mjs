import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
export function sourceState() {
  const files = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .stdout.trim()
    .split(/\r?\n/)
    .filter(
      (file) =>
        /^(apps|packages|scripts|tests|\.github)\//.test(file) ||
        /^(package(-lock)?\.json|.*config\.[a-z]+|compose\.yaml|Dockerfile|\.dockerignore|\.gitignore|\.env.example)$/.test(
          file,
        ),
    )
    .sort();
  const entries = files.map((file) => ({
    file,
    sha256: createHash("sha256").update(readFileSync(file)).digest("hex"),
  }));
  return {
    gitHead: spawnSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).stdout.trim(),
    sourceDigest: createHash("sha256")
      .update(JSON.stringify(entries))
      .digest("hex"),
    files: entries,
  };
}
