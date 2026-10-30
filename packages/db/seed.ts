import "dotenv/config";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import bcrypt from "bcryptjs";
import PDFDocument from "pdfkit";
import { db } from "./index.ts";
const routes = [
  ["SCRUTINY", "AUTHORITY"],
  ["SCRUTINY", "EVC", "AUTHORITY"],
  ["EVC", "AUTHORITY"],
  ["EVC", "SAC", "AUTHORITY"],
  ["EVC", "SHC", "AUTHORITY"],
];
export async function seedRun() {
  if (process.env.DEMO_MODE !== "true")
    throw new Error("Demo seeding disabled outside demo mode");
  const runId = randomUUID();
  const now = new Date("2026-10-22T09:00:00Z");
  const localState = process.env.LOCAL_STATE_PATH ?? ".local";
  const passwordPath = path.resolve(localState, "demo-credentials.json");
  await mkdir(localState, { recursive: true });
  let password: string;
  try {
    password = JSON.parse(await readFile(passwordPath, "utf8")).password;
  } catch {
    password = randomBytes(12).toString("base64url") + "aA9!";
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const accounts = [
    ["institution.a", "Institution A", "INSTITUTION", "I01", "R1", null],
    ["institution.b", "Institution B", "INSTITUTION", "I02", "R2", null],
    ["reviewer.north", "North reviewing officer", "REVIEWER", null, "R1", null],
    ["reviewer.south", "South reviewing officer", "REVIEWER", null, "R2", null],
    [
      "supervisor.north",
      "North regional supervisor",
      "SUPERVISOR",
      null,
      "R1",
      null,
    ],
    [
      "supervisor.south",
      "South regional supervisor",
      "SUPERVISOR",
      null,
      "R2",
      null,
    ],
    ["bureau", "Approval bureau supervisor", "BUREAU", null, null, null],
    ["committee.evc", "EVC member", "COMMITTEE", null, null, "EVC"],
    ["committee.sac", "SAC member", "COMMITTEE", null, null, "SAC"],
    ["committee.shc", "SHC member", "COMMITTEE", null, null, "SHC"],
    ["authority", "Competent authority", "AUTHORITY", null, null, null],
    ["auditor", "Read-only auditor", "AUDITOR", null, null, null],
    ["admin", "Technical administrator", "ADMIN", null, null, null],
  ];
  for (let i = 1; i <= 4; i++)
    await db.region.upsert({
      where: { id: `R${i}` },
      create: {
        id: `R${i}`,
        name: `Demo ${["North", "South", "East", "West"][i - 1]}`,
      },
      update: {},
    });
  for (let i = 1; i <= 20; i++) {
    const id = `I${String(i).padStart(2, "0")}`;
    await db.institution.upsert({
      where: { id },
      create: {
        id,
        name: `Demo ${["Sahyadri", "Narmada", "Aravali", "Konkan", "Vindhya"][Math.floor((i - 1) / 4)]} Institute ${i}`,
        regionId: `R${((i - 1) % 4) + 1}`,
      },
      update: {},
    });
  }
  const users: Record<string, string> = {};
  for (const [
    prefix,
    name,
    role,
    institutionId,
    regionId,
    committee,
  ] of accounts) {
    const email = `${prefix}@anumitra.test`;
    let u = await db.user.findUnique({ where: { email } });
    if (!u)
      u = await db.user.create({
        data: {
          email,
          name: name!,
          passwordHash,
          grants: {
            create: {
              role: role!,
              institutionId,
              regionId,
              committee,
              global: !institutionId && !regionId,
              canDelegateGlobal: prefix === "bureau",
            },
          },
        },
      });
    users[prefix!] = u.id;
  }
  for (const key of ["committee.evc", "committee.sac", "committee.shc"])
    if (!(await db.availability.count({ where: { userId: users[key] } })))
      await db.availability.create({
        data: {
          userId: users[key],
          startAt: new Date("2026-01-01"),
          endAt: new Date("2030-01-01"),
        },
      });
  const workflows = [];
  for (let i = 0; i < routes.length; i++) {
    const name = [
      "Only Scrutiny",
      "Scrutiny + EVC",
      "Only EVC",
      "EVC + SAC",
      "EVC + SHC",
    ][i];
    const wf = await db.workflow.upsert({
      where: { name_version: { name, version: 1 } },
      create: {
        name,
        version: 1,
        state: "PUBLISHED",
        config: {
          stages: routes[i],
          deadlineDays: 14,
          reminderDays: 3,
          adverseReferral: "AUTHORITY_REVIEW",
          windows: {
            SCRUTINY: 14,
            RESCRUTINY: 7,
            RESPONSE: 10,
            EVC_SCHEDULING: 14,
            EVC_REPORT: 7,
            SAC: 7,
            SHC: 7,
            AUTHORITY: 7,
            DOCUMENT_REVIEW: 7,
          },
          escalationLevels: [
            { afterDays: 0, role: "SUPERVISOR" },
            { afterDays: 7, role: "BUREAU" },
            { afterDays: 14, role: "AUTHORITY" },
          ],
          label: "DEMO policy; calendar days in Asia/Kolkata",
        },
      },
      update: {},
    });
    workflows.push(wf);
  }
  const old = await db.workflow.upsert({
    where: { name_version: { name: "Only Scrutiny", version: 0 } },
    create: {
      name: "Only Scrutiny",
      version: 0,
      state: "RETIRED",
      config: {
        stages: routes[0],
        deadlineDays: 10,
        reminderDays: 2,
        label: "DEMO prior policy",
      },
    },
    update: {},
  });
  const storage = path.resolve(process.env.STORAGE_PATH ?? "storage/private");
  await mkdir(storage, { recursive: true });
  const pdf = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve) => {
    pdf.on("data", (chunk) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
  });
  pdf.fontSize(28).text("ANUMITRA • DEMONSTRATION");
  pdf
    .moveDown()
    .fontSize(14)
    .text(
      "Fictional evidence document\nNot issued by AICTE. Not a real lease or approval.\nUse only to demonstrate workflow, private storage, validity and human verification.",
    );
  pdf.end();
  const bytes = await done;
  const ids = [];
  for (let i = 0; i < 120; i++) {
    const institutionId = `I${String((i % 20) + 1).padStart(2, "0")}`;
    const region = ((i % 20) % 4) + 1;
    const routeIndex = i % 5;
    const wf = i === 119 ? old : workflows[routeIndex];
    const config = wf.config as { stages: string[] };
    let state =
      i < 5
        ? "DRAFT"
        : i === 5
          ? "AWAITING_RESPONSE"
          : i === 6
            ? "RESCRUTINY"
            : i === 20
              ? "CONDITIONAL"
              : i % 11 === 0
                ? "AUTHORITY"
                : config.stages[
                    Math.min(
                      Math.floor(i / 5) % config.stages.length,
                      config.stages.length - 1,
                    )
                  ];
    const stageIndex = [
      "AWAITING_RESPONSE",
      "RESCRUTINY",
      "DRAFT",
      "CONDITIONAL",
    ].includes(state)
      ? 0
      : config.stages.indexOf(state);
    const owner =
      state === "AUTHORITY"
        ? users.authority
        : state === "EVC"
          ? users["committee.evc"]
          : state === "SAC"
            ? users["committee.sac"]
            : state === "SHC"
              ? users["committee.shc"]
              : region === 1
                ? users["reviewer.north"]
                : region === 2
                  ? users["reviewer.south"]
                  : users.bureau;
    const app = await db.application.create({
      data: {
        reference: `AN-${runId.slice(0, 4).toUpperCase()}-${String(i + 1).padStart(4, "0")}`,
        institutionId,
        workflowId: wf.id,
        runId,
        category:
          i % 3 === 0
            ? "NEW_INSTITUTION"
            : i % 3 === 1
              ? "EXTENSION"
              : "CHANGE",
        state,
        stageIndex,
        ownerId: owner,
        data: {
          contact: `demo${i + 1}@institution.test`,
          provenance: {
            kind: "FICTIONAL_DEMO",
            source: "bundled synthetic fixture",
          },
          programme: "Computer Engineering",
          intake: 60,
        },
        createdAt: new Date(+now - (i % 35) * 86400000),
        dueAt: new Date(+now + ((i % 17) - 7) * 86400000),
      },
    });
    ids.push(app.id);
    const key = randomUUID();
    await writeFile(path.join(storage, key), bytes, { flag: "wx" });
    const document = await db.document.create({
      data: {
        applicationId: app.id,
        title: "Demonstration campus lease",
        kind: "LEASE",
      },
    });
    const v = await db.documentVersion.create({
      data: {
        documentId: document.id,
        number: 1,
        storageKey: key,
        mime: "application/pdf",
        size: bytes.length,
        hash: createHash("sha256").update(bytes).digest("hex"),
        reviewState: i < 7 ? "PENDING" : "ACCEPTED",
        validUntil: new Date(+now + ((i % 28) - 5) * 86400000),
      },
    });
    if (state !== "DRAFT") {
      await db.snapshot.create({
        data: {
          applicationId: app.id,
          revision: 1,
          kind: "SUBMISSION",
          content: { data: app.data, evidence: [v.id], workflowId: wf.id },
        },
      });
      if (!["APPROVED", "CONDITIONAL", "REJECTED"].includes(state))
        await db.stageAttempt.create({
          data: {
            applicationId: app.id,
            stage: state,
            stageIndex,
            ownerId: owner,
            startedAt: app.createdAt,
          },
        });
    }
    if (i === 5 || i === 6) {
      const d = await db.deficiency.create({
        data: {
          applicationId: app.id,
          round: 1,
          item: "LEASE",
          reason: "Demonstration: provide the renewed lease evidence",
          state: i === 6 ? "RESPONDED" : "OPEN",
        },
      });
      if (i === 6)
        await db.response.create({
          data: {
            deficiencyId: d.id,
            text: "Demonstration evidence response",
            documentVersionId: v.id,
          },
        });
    }
    if (i === 20) {
      const d = await db.decision.create({
        data: {
          applicationId: app.id,
          actorId: users.authority,
          outcome: "CONDITIONAL",
          reason: "Demo conditional approval; undertaking remains open",
          snapshot: { evidence: [v.id], workflowId: wf.id },
        },
      });
      await db.obligation.create({
        data: {
          applicationId: app.id,
          decisionId: d.id,
          condition: "Submit a verified campus safety undertaking",
          source: `DEMO decision ${d.id}`,
          ownerId: users["institution.a"],
          requiredEvidence: "Safety undertaking document",
          originalDueAt: new Date(+now + 86400000),
          dueAt: new Date(+now + 86400000),
        },
      });
    }
    await db.audit.create({
      data: {
        applicationId: app.id,
        actorId: "SYSTEM",
        scope: [],
        action: "demo-seed",
        reason: "Deterministic fictional scenario",
        toState: state,
        visibility: "PUBLIC",
        policyId: wf.id,
        correlationId: runId,
        createdAt: now,
      },
    });
  }
  const sources = [
    [
      "sih",
      "SIH26262 original PS",
      "https://www.sih.gov.in/sih2026PS",
      "VERIFIED_SCOPE",
    ],
    [
      "aicte",
      "AICTE approval policy",
      "https://www.aicte.gov.in/",
      "ACCESS_LIMITED",
    ],
    [
      "aph",
      "APH primary URL",
      "https://www.aicte.gov.in/sites/default/files/approval/APH%20Final.pdf",
      "ACCESS_LIMITED",
    ],
    [
      "copy",
      "APH 2024-27 government copy",
      "https://cdnbbsr.s3waas.gov.in/s35938b4d054136e5d59ada6ec9c295d7a/uploads/2025/03/2025031399.pdf",
      "RETRIEVED_NOT_ENCODED",
    ],
    [
      "addendum",
      "2026-27 V2 addendum",
      "https://aicte.gov.in/downloads/aph/Final%20Addendum%202026-27_V2.pdf",
      "HTTP_403",
    ],
  ];
  for (const [id, title, url, status] of sources)
    await db.policySource.upsert({
      where: { id },
      create: {
        id,
        title,
        url,
        status,
        retrievedAt: now,
        applicability: "Source register only. No statutory timeline encoded.",
      },
      update: {},
    });
  const exampleEvc = await db.application.findFirst({
    where: { runId, state: "EVC", institution: { regionId: "R1" } },
  });
  if (exampleEvc) {
    const startAt = new Date(+now + 2 * 86400000),
      endAt = new Date(+startAt + 3600000);
    const visit = await db.visit.create({
      data: {
        applicationId: exampleEvc.id,
        state: "CONFIRMED",
        mode: "ONLINE",
        startAt,
        endAt,
        metadata:
          "Fictional local committee meeting; no external meeting service",
        reason: "Seeded conflict demonstration appointment",
      },
    });
    await db.reservation.create({
      data: {
        visitId: visit.id,
        userId: users["committee.evc"],
        startAt,
        endAt,
      },
    });
  }
  const renewalDoc = await db.document.findFirstOrThrow({
    where: { applicationId: ids[0] },
  });
  const renewalKey = randomUUID();
  await writeFile(path.join(storage, renewalKey), bytes, { flag: "wx" });
  await db.documentVersion.create({
    data: {
      documentId: renewalDoc.id,
      number: 2,
      storageKey: renewalKey,
      mime: "application/pdf",
      size: bytes.length,
      hash: createHash("sha256").update(bytes).digest("hex"),
      reviewState: "PENDING",
      validUntil: new Date("2027-12-31T18:29:59.999Z"),
    },
  });
  const fixture = await db.application.findUniqueOrThrow({
    where: { id: ids[20] },
  });
  for (const state of ["EXHAUSTED", "SUPERSEDED"]) {
    const outbox = await db.outbox.create({
      data: {
        applicationId: fixture.id,
        recipientId: users["institution.a"],
        logicalKey: `${runId}:fixture:${state}`,
        revision: fixture.version,
        subjectId: fixture.id,
        runId,
        title: `DEMO SEEDED ${state} delivery scenario`,
        state,
        attempts: state === "EXHAUSTED" ? 4 : 0,
      },
    });
    if (state === "EXHAUSTED")
      await db.deliveryAttempt.create({
        data: {
          outboxId: outbox.id,
          state: "EXHAUSTED",
          detail:
            "Explicitly seeded fictional SMTP failure fixture; not a measured delivery attempt",
        },
      });
  }
  await db.demoClock.upsert({
    where: { id: "current" },
    create: { id: "current", runId, now },
    update: { runId, now },
  });
  await db.outbox.updateMany({
    where: { runId: { not: runId }, state: { in: ["QUEUED", "FAILED"] } },
    data: { state: "SUPERSEDED" },
  });
  await writeFile(
    passwordPath,
    JSON.stringify(
      {
        notice: "Local demo only. Keep out of Git.",
        password,
        accounts: accounts.map(([prefix, name, role]) => ({
          email: `${prefix}@anumitra.test`,
          name,
          role,
        })),
        runId,
        examples: ids.slice(0, 12),
      },
      null,
      2,
    ),
  );
  return { runId, applications: 120, institutions: 20 };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    if (await db.demoClock.count())
      console.log(
        "Existing demo preserved. Use authorized new-run action to reset.",
      );
    else console.log(await seedRun());
  } finally {
    await db.$disconnect();
  }
}
