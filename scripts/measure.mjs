import { cpus, totalmem, platform, release } from "node:os";
import { readFileSync, writeFileSync } from "node:fs";
const credentials = JSON.parse(
  readFileSync(".local/demo-credentials.json", "utf8"),
);
let cookie = "",
  csrf = "";
const base = "http://127.0.0.1:3000/api";
async function request(url, body) {
  const r = await fetch(base + url, {
    method: body ? "POST" : "GET",
    headers: {
      Cookie: cookie,
      "X-CSRF-Token": csrf,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (r.headers.get("set-cookie"))
    cookie = r.headers.get("set-cookie").split(";")[0];
  const data = await r.json();
  if (data.csrf) csrf = data.csrf;
  if (!r.ok) throw new Error(data.error);
  return data;
}
await request("/session");
await request("/login", {
  email: "supervisor.north@anumitra.test",
  password: credentials.password,
});
const output = {
  executedAt: new Date(),
  hardware: {
    cpu: cpus()[0].model,
    logicalCpus: cpus().length,
    memoryGiB: Number((totalmem() / 2 ** 30).toFixed(1)),
    platform: platform(),
    release: release(),
    node: process.version,
  },
  method:
    "One loopback client; 3 warm-ups then 20 sequential reads per endpoint; includes HTTP and JSON parse; other local test records remain; no national-scale or user-effort extrapolation.",
  workload: {},
  results: [],
};
const d = await request("/dashboard");
output.workload = {
  authorizedApplications: d.total,
  scope: "North supervisor",
  clock: d.now,
};
for (const endpoint of ["/dashboard", "/applications?limit=15"]) {
  for (let i = 0; i < 3; i++) await request(endpoint);
  const times = [];
  for (let i = 0; i < 20; i++) {
    const before = performance.now();
    await request(endpoint);
    times.push(performance.now() - before);
  }
  times.sort((a, b) => a - b);
  output.results.push({
    endpoint,
    samples: times.length,
    p50Milliseconds: Number(times[9].toFixed(2)),
    p95Milliseconds: Number(times[18].toFixed(2)),
    maxMilliseconds: Number(times.at(-1).toFixed(2)),
  });
}
const schema = await request("/openapi.json");
output.openapiPaths = Object.keys(schema.paths).length;
writeFileSync(
  "docs/evidence/measurements.json",
  JSON.stringify(output, null, 2),
);
console.log(JSON.stringify(output, null, 2));
