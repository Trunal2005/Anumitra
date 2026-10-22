import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  writeFile,
  access,
  rename,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import PDFDocument from "pdfkit";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../../../packages/db/index.ts";
import {
  type Actor,
  DomainError,
  actions,
  audit,
  can,
  clock,
  command,
  csvCell,
  dateOnlyEnd,
  ensure,
  getApp,
  hash,
  hasRole,
  notify,
  runId,
  scope,
} from "../../../packages/domain/engine.ts";
import {
  commandSchema,
  draftSchema,
  loginSchema,
  workflowSchema,
} from "../../../packages/contracts/index.ts";
import { schedule, visitCommand } from "../../../packages/domain/visits.ts";
import { transport } from "../../../packages/domain/mail.ts";
import { openapi } from "./openapi.ts";
import { readiness } from "../../../packages/domain/readiness.ts";
import { retryDelivery } from "../../../packages/domain/delivery.ts";
import { ruleOperation } from "../../../packages/domain/rules.ts";
import { grantRole } from "../../../packages/domain/grants.ts";
import { invalidateDeadline } from "../../../packages/domain/invalidation.ts";
import {
  eligible,
  grantMatches,
  officialScope,
} from "../../../packages/domain/permissions.ts";
import { documentCompliance } from "../../../packages/domain/documents.ts";
import { deadlineSubjects } from "../../../packages/domain/deadlines.ts";
import { ageing } from "../../../packages/domain/ageing.ts";
declare module "express-session" {
  interface SessionData {
    userId: string;
    securityVersion: number;
    csrf: string;
  }
}
const app = express();
const port = Number(process.env.PORT ?? 3000);
const integrationMode = z
  .enum(["DISCONNECTED", "LOCAL_ADAPTER", "LIVE_AUTHORIZED"])
  .parse(process.env.INTEGRATION_MODE ?? "LOCAL_ADAPTER");
ensure(
  integrationMode !== "LIVE_AUTHORIZED",
  "No live authorized adapter is installed. Select LOCAL_ADAPTER or DISCONNECTED.",
  500,
);
const origin = process.env.APP_ORIGIN ?? `http://127.0.0.1:${port}`;
ensure(
  (process.env.SESSION_SECRET?.length ?? 0) >= 32,
  "Generate SESSION_SECRET with at least 32 characters",
  500,
);
ensure(
  process.env.NODE_ENV !== "production" || process.env.DEMO_MODE !== "true",
  "Production cannot enable demo mode",
  500,
);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "blob:", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(express.json({ limit: "1mb" }));
const Store = connectPgSimple(session);
app.use(
  session({
    store: new Store({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 3600000,
    },
    name: "anumitra.sid",
  }),
);
app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api", (req, res, next) => {
  if (!req.session.csrf) req.session.csrf = randomBytes(24).toString("hex");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (
      req.headers.origin &&
      req.headers.origin !== origin &&
      !(
        process.env.NODE_ENV !== "production" &&
        req.headers.origin === "http://127.0.0.1:5173"
      )
    )
      return res.status(403).json({ error: "Origin rejected" });
    if (req.headers["x-csrf-token"] !== req.session.csrf)
      return res.status(403).json({ error: "CSRF token missing or stale" });
  }
  next();
});
async function actor(req: Request) {
  ensure(req.session.userId, "Sign in required", 401);
  const a = await db.user.findUnique({
    where: { id: req.session.userId },
    include: { grants: true },
  });
  ensure(
    a && a.active && a.securityVersion === req.session.securityVersion,
    "Session expired. Sign in again.",
    401,
  );
  return a;
}
const safeUser = (a: Actor) => ({
  id: a.id,
  name: a.name,
  email: a.email,
  grants: a.grants,
});
app.get("/api/health", async (_req, res) => {
  const result = await readiness();
  res.status(result.dataAvailable ? 200 : 503).json(result);
});
app.get("/api/session", async (req, res) => {
  let user = null;
  try {
    user = safeUser(await actor(req));
  } catch {}
  res.json({
    csrf: req.session.csrf,
    user,
    demo: process.env.DEMO_MODE === "true",
  });
});
const throttle = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.post("/api/login", throttle, async (req, res) => {
  const c = loginSchema.parse(req.body);
  const a = await db.user.findUnique({
    where: { email: c.email.toLowerCase() },
    include: { grants: true },
  });
  ensure(
    a && (await bcrypt.compare(c.password, a.passwordHash)),
    "Invalid credentials",
    401,
  );
  await new Promise<void>((resolve, reject) =>
    req.session.regenerate((e) => (e ? reject(e) : resolve())),
  );
  req.session.userId = a.id;
  req.session.securityVersion = a.securityVersion;
  req.session.csrf = randomBytes(24).toString("hex");
  await new Promise<void>((resolve, reject) =>
    req.session.save((e) => (e ? reject(e) : resolve())),
  );
  res.json({ user: safeUser(a), csrf: req.session.csrf });
});
app.post("/api/logout", async (req, res) => {
  await new Promise<void>((resolve, reject) =>
    req.session.destroy((e) => (e ? reject(e) : resolve())),
  );
  res.clearCookie("anumitra.sid");
  res.json({ ok: true });
});
app.post("/api/password", throttle, async (req, res) => {
  const a = await actor(req);
  const c = z
    .object({ current: z.string(), password: z.string().min(12).max(200) })
    .parse(req.body);
  ensure(
    await bcrypt.compare(c.current, a.passwordHash),
    "Current password incorrect",
    403,
  );
  await db.user.update({
    where: { id: a.id },
    data: {
      passwordHash: await bcrypt.hash(c.password, 12),
      securityVersion: { increment: 1 },
    },
  });
  req.session.securityVersion = a.securityVersion + 1;
  res.json({ ok: true });
});
app.post("/api/recovery", throttle, async (req, res) => {
  const email = z.string().email().parse(req.body.email);
  const u = await db.user.findUnique({ where: { email } });
  if (u) {
    const token = randomBytes(32).toString("hex");
    await db.recovery.create({
      data: {
        id: hash(token),
        userId: u.id,
        expiresAt: new Date(Date.now() + 15 * 60000),
      },
    });
    await transport().sendMail({
      from: "noreply@anumitra.test",
      to: u.email,
      subject: "Anumitra local password recovery",
      text: `Local-only recovery. Open ${origin}/?recovery=${token} within 15 minutes.`,
    });
  }
  res.json({
    message:
      "If this local account exists, a recovery message was sent to Mailpit.",
  });
});
app.post("/api/recovery/reset", throttle, async (req, res) => {
  const c = z
    .object({
      token: z.string().length(64),
      password: z.string().min(12).max(200),
    })
    .parse(req.body);
  const passwordHash = await bcrypt.hash(c.password, 12);
  await db.$transaction(async (tx) => {
    const r = await tx.recovery.findUnique({ where: { id: hash(c.token) } });
    ensure(
      r && !r.used && r.expiresAt > new Date(),
      "Recovery link expired",
      400,
    );
    const claimed = await tx.recovery.updateMany({
      where: { id: r.id, used: false },
      data: { used: true },
    });
    ensure(claimed.count === 1, "Link already used");
    await tx.user.update({
      where: { id: r.userId },
      data: { passwordHash, securityVersion: { increment: 1 } },
    });
  });
  res.json({ ok: true });
});
function filters(req: Request, a: Actor): Prisma.ApplicationWhereInput {
  const q = z
    .object({
      q: z.string().max(100).optional(),
      state: z.string().max(40).optional(),
      region: z.string().max(40).optional(),
      institution: z.string().max(100).optional(),
      category: z.string().max(40).optional(),
      cycle: z.string().max(20).optional(),
      owner: z.string().max(100).optional(),
      from: z.iso.date().optional(),
      to: z.iso.date().optional(),
      overdue: z.string().optional(),
    })
    .parse(req.query);
  return {
    AND: [
      scope(a),
      ...(q.q
        ? [
            {
              OR: [
                { reference: { contains: q.q, mode: "insensitive" as const } },
                {
                  institution: {
                    name: { contains: q.q, mode: "insensitive" as const },
                  },
                },
              ],
            },
          ]
        : []),
    ],
    ...(q.state ? { state: q.state } : {}),
    ...(q.region ? { institution: { regionId: q.region } } : {}),
    ...(q.institution ? { institutionId: q.institution } : {}),
    ...(q.category ? { category: q.category } : {}),
    ...(q.cycle ? { cycle: q.cycle } : {}),
    ...(q.owner ? { ownerId: q.owner === "UNASSIGNED" ? null : q.owner } : {}),
    ...(q.from || q.to
      ? {
          createdAt: {
            ...(q.from ? { gte: new Date(q.from) } : {}),
            ...(q.to ? { lte: dateOnlyEnd(q.to) } : {}),
          },
        }
      : {}),
  };
}
async function scopedFilter(req: Request, a: Actor) {
  const now = await clock();
  return {
    ...filters(req, a),
    ...(req.query.open === "true"
      ? { state: { notIn: ["APPROVED", "REJECTED", "CONDITIONAL"] } }
      : {}),
    runId: await runId(),
    ...(req.query.upcoming === "true"
      ? {
          dueAt: { gte: now, lte: new Date(+now + 7 * 86400000) },
          state: { notIn: ["DRAFT", "APPROVED", "REJECTED", "CONDITIONAL"] },
        }
      : {}),
    ...(req.query.overdue === "true"
      ? {
          id: {
            in: (
              await deadlineSubjects(
                { AND: [filters(req, a), { runId: await runId() }] },
                now,
              )
            )
              .filter((s) => s.due < now)
              .map((s) => s.applicationId),
          },
        }
      : {}),
  };
}
app.get("/api/options", async (req, res) => {
  const a = await actor(req);
  const globalMasterView = a.grants.some(
    (g) =>
      ["ADMIN", "BUREAU", "AUTHORITY", "AUDITOR", "SUPERVISOR"].includes(
        g.role,
      ) &&
      g.global &&
      !g.regionId &&
      !g.institutionId,
  );
  const institutions = await db.institution.findMany({
    where: globalMasterView
      ? {}
      : {
          OR: [
            {
              id: {
                in: a.grants
                  .filter((g) => g.institutionId)
                  .map((g) => g.institutionId!),
              },
            },
            {
              applications: {
                some: { AND: [scope(a), { runId: await runId() }] },
              },
            },
          ],
        },
  });
  const users = hasRole(a, "SUPERVISOR", "BUREAU", "ADMIN")
    ? await db.user.findMany({
        where: hasRole(a, "ADMIN", "BUREAU")
          ? {}
          : {
              grants: {
                some: {
                  OR: [
                    {
                      regionId: {
                        in: a.grants.flatMap((g) =>
                          g.regionId ? [g.regionId] : [],
                        ),
                      },
                    },
                    { role: "COMMITTEE", regionId: null },
                  ],
                },
              },
            },
        select: { id: true, name: true, email: true, grants: true },
      })
    : [];
  res.json({
    institutions,
    users,
    regions: await db.region.findMany(),
    workflows: await db.workflow.findMany({ where: { state: "PUBLISHED" } }),
    now: await clock(),
  });
});
app.get("/api/applications", async (req, res) => {
  const a = await actor(req);
  const where = await scopedFilter(req, a);
  const page = z.coerce.number().int().min(1).default(1).parse(req.query.page);
  const limit = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(15)
    .parse(req.query.limit);
  const sort = z
    .enum(["createdAt", "updatedAt", "reference", "dueAt", "state"])
    .default("updatedAt")
    .parse(req.query.sort);
  const direction = z
    .enum(["asc", "desc"])
    .default("desc")
    .parse(req.query.direction);
  const [items, total] = await Promise.all([
    db.application.findMany({
      where,
      include: { institution: true, workflow: true },
      orderBy: { [sort]: direction },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.application.count({ where }),
  ]);
  res.json({ items, total, page, limit });
});
app.get("/api/dashboard", async (req, res) => {
  const a = await actor(req);
  const where = await scopedFilter(req, a);
  const now = await clock();
  const list = await db.application.findMany({
    where,
    include: {
      attempts: true,
      obligations: true,
      documents: {
        include: { versions: { orderBy: { number: "desc" } } },
      },
    },
  });
  const counts = list.reduce<Record<string, number>>(
    (m, x) => ((m[x.state] = (m[x.state] ?? 0) + 1), m),
    {},
  );
  const subjects = await deadlineSubjects(where, now);
  const overdue = subjects.filter((s) => s.due < now);
  res.json({
    total: list.length,
    open: list.filter(
      (x) => !["APPROVED", "CONDITIONAL", "REJECTED"].includes(x.state),
    ).length,
    overdue: new Set(overdue.map((s) => s.applicationId)).size,
    overdueSubjects: overdue.length,
    overdueCountUnit:
      "distinct cases; report lists individual deadline subjects",
    evc: counts.EVC ?? 0,
    obligations: list
      .flatMap((x) => x.obligations)
      .filter((x) => !["ACCEPTED", "WAIVED"].includes(x.state)).length,
    documents: list
      .flatMap((x) => x.documents)
      .filter((d) =>
        ["EXPIRED", "EXPIRING"].includes(
          documentCompliance(d.versions, now).status,
        ),
      ).length,
    pendingEvidence: list
      .flatMap((x) => x.documents)
      .filter((d) => d.versions[0]?.reviewState === "PENDING").length,
    upcoming: list.filter(
      (x) =>
        x.dueAt &&
        +x.dueAt >= +now &&
        +x.dueAt <= +now + 7 * 86400000 &&
        !["DRAFT", "APPROVED", "CONDITIONAL", "REJECTED"].includes(x.state),
    ).length,
    counts,
    workload: Object.entries(
      list.reduce<Record<string, number>>(
        (m, x) => (
          (m[x.ownerId ?? "Unassigned"] =
            (m[x.ownerId ?? "Unassigned"] ?? 0) + 1),
          m
        ),
        {},
      ),
    ),
    now,
    updatedAt: new Date(),
    ageing: list
      .slice(0, 10)
      .map((x) => ({ id: x.id, reference: x.reference, ...ageing(x, now) })),
  });
});
app.post("/api/applications", async (req, res) => {
  const a = await actor(req);
  const c = draftSchema.parse(req.body);
  ensure(
    a.grants.some(
      (g) => g.role === "INSTITUTION" && g.institutionId === c.institutionId,
    ),
    "Own institution draft permission required",
    403,
  );
  const wf = await db.workflow.findUnique({ where: { id: c.workflowId } });
  ensure(wf?.state === "PUBLISHED", "Select a published workflow", 400);
  const created = await db.$transaction(async (tx) => {
    const record = await tx.application.create({
      data: {
        ...c,
        reference: `AN-${randomUUID().slice(0, 8).toUpperCase()}`,
        runId: await runId(tx),
      },
    });
    await audit(
      tx,
      a,
      record,
      "create-draft",
      "Institution saved a draft",
      undefined,
      "PUBLIC",
    );
    return record;
  });
  res.status(201).json(created);
});
app.put("/api/applications/:id/draft", async (req, res) => {
  const a = await actor(req);
  const c = draftSchema.parse(req.body);
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${req.params.id} FOR UPDATE`;
    const record = await getApp(a, String(req.params.id), tx);
    ensure(
      record.state === "DRAFT" && can(a, record, ["INSTITUTION"]),
      "Draft editing unavailable",
      403,
    );
    ensure(
      c.institutionId === record.institutionId &&
        c.workflowId === record.workflowId,
      "Draft scope and governing workflow cannot be changed",
    );
    const r = await tx.application.update({
      where: { id: record.id },
      data: {
        data: c.data,
        category: c.category,
        cycle: c.cycle,
        version: { increment: 1 },
      },
    });
    await audit(tx, a, r, "save-draft", "Draft edited", record.state, "PUBLIC");
    return r;
  });
  res.json(result);
});
app.get("/api/applications/:id", async (req, res) => {
  const a = await actor(req);
  const record = await getApp(a, String(req.params.id));
  const history = await db.audit.findMany({
    where: {
      applicationId: record.id,
      ...(record.institutionView ? { visibility: "PUBLIC" } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    ...record,
    ...actions(a, record),
    assignees: can(a, record, ["SUPERVISOR", "BUREAU"])
      ? (
          await db.user.findMany({
            where: { active: true },
            include: { grants: true },
          })
        )
          .filter((user) => eligible(user, record))
          .map((user) => ({ id: user.id, name: user.name }))
      : [],
    history,
    brief: {
      whyBlocked: actions(a, record).blockingReasons,
      whoNext: record.ownerId ?? "Scoped coordinator to assign",
      ownerName: record.ownerId
        ? (
            await db.user.findUnique({
              where: { id: record.ownerId },
              select: { name: true },
            })
          )?.name
        : null,
      due: record.dueAt,
      governingVersion: record.workflow.version,
    },
  });
});
app.post("/api/applications/:id/commands", async (req, res) =>
  res.json(
    await command(
      await actor(req),
      String(req.params.id),
      req.body,
      String(req.headers["idempotency-key"] ?? ""),
    ),
  ),
);
app.post("/api/applications/:id/notes", async (req, res) => {
  const a = await actor(req);
  const record = await getApp(a, String(req.params.id));
  ensure(
    can(a, record, [
      "REVIEWER",
      "SUPERVISOR",
      "BUREAU",
      "COMMITTEE",
      "AUTHORITY",
    ]),
    "Internal notes permission required",
    403,
  );
  const reason = z.string().min(5).max(4000).parse(req.body.reason);
  await db.$transaction((tx) =>
    audit(tx, a, record, "internal-observation", reason),
  );
  res.json({ ok: true });
});
app.post("/api/applications/:id/visits", async (req, res) =>
  res
    .status(201)
    .json(await schedule(await actor(req), String(req.params.id), req.body)),
);
app.post("/api/visits/:id/:operation", async (req, res) =>
  res.json(
    await visitCommand(
      await actor(req),
      String(req.params.id),
      String(req.params.operation),
      req.body.reason,
    ),
  ),
);
app.get("/api/visits", async (req, res) => {
  const a = await actor(req);
  res.json(
    await db.visit.findMany({
      where: { application: { ...scope(a), runId: await runId() } },
      include: {
        application: { include: { institution: true } },
        reservations: true,
      },
      orderBy: { startAt: "asc" },
    }),
  );
});
app.post("/api/availability", async (req, res) => {
  const a = await actor(req);
  ensure(hasRole(a, "COMMITTEE"), "Committee grant required", 403);
  const c = z
    .object({ startAt: z.iso.datetime(), endAt: z.iso.datetime() })
    .parse(req.body);
  ensure(new Date(c.startAt) < new Date(c.endAt), "Invalid time range", 400);
  res.json(
    await db.availability.create({
      data: {
        userId: a.id,
        startAt: new Date(c.startAt),
        endAt: new Date(c.endAt),
      },
    }),
  );
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 10 },
});
app.post(
  "/api/applications/:id/documents",
  upload.single("file"),
  async (req, res) => {
    const a = await actor(req);
    const id = String(req.params.id);
    const record = await getApp(a, id);
    ensure(
      can(a, record, ["INSTITUTION"]),
      "Institution upload grant required",
      403,
    );
    ensure(req.file, "Choose a PDF, PNG or JPEG file", 400);
    const bytes = req.file.buffer;
    const mime =
      bytes.subarray(0, 5).toString() === "%PDF-"
        ? "application/pdf"
        : bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            ? "image/jpeg"
            : null;
    ensure(
      mime && mime === req.file.mimetype,
      "File content/type mismatch",
      400,
    );
    if (mime === "application/pdf")
      ensure(
        !/\/(JavaScript|JS|Launch|EmbeddedFile|OpenAction)\b/.test(
          bytes.toString("latin1"),
        ),
        "Active PDF content is not allowed",
        400,
      );
    const metadata = z
      .object({
        title: z.string().min(3).max(200),
        kind: z.enum(["LEASE", "AFFIDAVIT", "COMPLIANCE", "OTHER"]),
        documentId: z.string().optional(),
        validUntil: z.string().optional(),
        issuer: z.string().max(200).optional(),
      })
      .parse(req.body);
    const validUntil = metadata.validUntil
      ? dateOnlyEnd(metadata.validUntil)
      : null;
    ensure(
      ["DRAFT", "AWAITING_RESPONSE", "CONDITIONAL", "APPROVED"].includes(
        record.state,
      ),
      "Uploads require an editable or post-decision evidence stage",
    );
    ensure(
      !metadata.documentId ||
        record.documents.some((d) => d.id === metadata.documentId),
      "Document does not belong to this case",
      404,
    );
    const storageKey = randomUUID();
    const storage = path.resolve(process.env.STORAGE_PATH ?? "storage/private");
    await mkdir(storage, { recursive: true });
    const staging = path.join(storage, ".staging");
    await mkdir(staging, { recursive: true });
    const stagedFile = path.join(staging, storageKey);
    const finalFile = path.join(storage, storageKey);
    const marker = path.join(staging, storageKey + ".pending");
    await writeFile(marker, "pending private evidence transaction", {
      flag: "wx",
    });
    await writeFile(stagedFile, bytes, { flag: "wx" });
    let result;
    try {
      result = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${id} FOR UPDATE`;
        const fresh = await getApp(a, id, tx);
        ensure(
          ["DRAFT", "AWAITING_RESPONSE", "CONDITIONAL", "APPROVED"].includes(
            fresh.state,
          ),
          "Uploads require draft, returned case or post-decision evidence",
        );
        let doc = metadata.documentId
          ? await tx.document.findFirst({
              where: { id: metadata.documentId, applicationId: id },
            })
          : null;
        ensure(
          !metadata.documentId || doc,
          "Document does not belong to this case",
          404,
        );
        if (!doc)
          doc = await tx.document.create({
            data: {
              applicationId: id,
              title: metadata.title,
              kind: metadata.kind,
            },
          });
        const number =
          1 +
          (await tx.documentVersion.count({ where: { documentId: doc.id } }));
        await rename(stagedFile, finalFile);
        const v = await tx.documentVersion.create({
          data: {
            documentId: doc.id,
            number,
            storageKey,
            mime: mime!,
            size: bytes.length,
            hash: createHash("sha256").update(bytes).digest("hex"),
            issuer: metadata.issuer,
            validUntil,
            createdAt: await clock(tx),
          },
        });
        await invalidateDeadline(
          tx,
          id,
          "DOCUMENT_REVIEW",
          doc.id,
          "New submission revises its missing-acceptance review deadline; existing effective expiry remains monitored",
        );
        const updated = await tx.application.update({
          where: { id },
          data: { version: { increment: 1 } },
        });
        await audit(
          tx,
          a,
          updated,
          "upload-document",
          `Version ${number}: ${metadata.title}`,
          fresh.state,
          "PUBLIC",
          [v.id],
        );
        await notify(
          tx,
          updated,
          `${fresh.reference}: evidence awaiting verification`,
          `${doc.id}:v${number}`,
        );
        return v;
      });
    } catch (error) {
      let referenced: boolean | null = null;
      try {
        referenced = !!(await db.documentVersion.count({
          where: { storageKey },
        }));
      } catch {}
      if (referenced === false)
        await unlink(finalFile).catch((e) => {
          if (e.code !== "ENOENT") throw e;
        });
      await unlink(stagedFile).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      });
      if (referenced !== null) await unlink(marker).catch(() => {});
      throw error;
    }
    await unlink(marker).catch(() => {});
    res.status(201).json(result);
  },
);
app.get("/api/documents/:id/content", async (req, res) => {
  const a = await actor(req);
  const v = await db.documentVersion.findUnique({
    where: { id: String(req.params.id) },
    include: {
      document: {
        include: { versions: { orderBy: { number: "desc" } } },
      },
    },
  });
  ensure(v, "Document unavailable", 404);
  const record = await getApp(a, v.document.applicationId);
  ensure(
    !record.institutionView ||
      v.document.versions[0]?.id === v.id ||
      v.document.versions.find((x) => x.reviewState === "ACCEPTED")?.id ===
        v.id,
    "Earlier versions are reviewer-only",
    403,
  );
  const storage = path.resolve(process.env.STORAGE_PATH ?? "storage/private");
  ensure(/^[a-f0-9-]{36}$/.test(v.storageKey), "Invalid storage key", 500);
  const bytes = await readFile(path.join(storage, v.storageKey));
  res.set({
    "Content-Type": v.mime,
    "Content-Disposition": `${req.query.download === "true" ? "attachment" : "inline"}; filename="Anumitra-${v.id}.${v.mime === "application/pdf" ? "pdf" : v.mime === "image/png" ? "png" : "jpg"}"`,
    "Content-Security-Policy": "sandbox; default-src 'none'",
    "X-Content-Type-Options": "nosniff",
  });
  res.send(bytes);
});
app.get("/api/documents", async (req, res) => {
  const a = await actor(req);
  const now = await clock();
  const docs = await db.document.findMany({
    where: { application: { ...scope(a), runId: await runId() } },
    include: {
      application: { include: { institution: true } },
      versions: { orderBy: { number: "desc" }, include: { reviews: true } },
    },
  });
  const officialIds = new Set(
    (
      await db.application.findMany({
        where: { ...officialScope(a), runId: await runId() },
        select: { id: true },
      })
    ).map((x) => x.id),
  );
  res.json(
    docs.map((d) => {
      const compliance = documentCompliance(d.versions, now);
      const institutionOnly = !officialIds.has(d.applicationId);
      return {
        ...d,
        compliance,
        versions: institutionOnly
          ? d.versions.filter(
              (v) =>
                v.id === compliance.submitted?.id ||
                v.id === compliance.effective?.id,
            )
          : d.versions,
      };
    }),
  );
});
app.post("/api/documents/:id/review", async (req, res) => {
  const a = await actor(req);
  const c = z
    .object({
      outcome: z.enum(["ACCEPTED", "REJECTED"]),
      reason: z.string().min(5),
    })
    .parse(req.body);
  await db.$transaction(async (tx) => {
    const v = await tx.documentVersion.findUniqueOrThrow({
      where: { id: String(req.params.id) },
      include: { document: true },
    });
    await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${v.document.applicationId} FOR UPDATE`;
    const record = await getApp(a, v.document.applicationId, tx);
    ensure(
      can(a, record, ["REVIEWER", "SUPERVISOR", "BUREAU"]),
      "Verification grant required",
      403,
    );
    ensure(
      record.documents.find((d) => d.id === v.documentId)?.versions[0]?.id ===
        v.id,
      "Superseded version cannot become current",
    );
    ensure(
      v.reviewState === "PENDING",
      "This immutable version already has a review decision; upload a new version for another verification",
    );
    await tx.documentReview.create({
      data: { versionId: v.id, actorId: a.id, ...c },
    });
    await tx.documentVersion.update({
      where: { id: v.id },
      data: { reviewState: c.outcome },
    });
    if (c.outcome === "ACCEPTED") {
      const previous = record.documents.find((d) => d.id === v.documentId)!
        .compliance.effective;
      if (previous)
        await invalidateDeadline(
          tx,
          record.id,
          "DOCUMENT",
          previous.id,
          "Authorized accepted renewal replaced the previous effective version",
        );
      await invalidateDeadline(
        tx,
        record.id,
        "DOCUMENT_REVIEW",
        v.documentId,
        "Accepted renewal resolves the missing-acceptance review deadline",
      );
    }
    const updated = await tx.application.update({
      where: { id: record.id },
      data: { version: { increment: 1 } },
    });
    await audit(
      tx,
      a,
      updated,
      "review-renewal",
      c.reason,
      record.state,
      "PUBLIC",
      [v.id],
    );
  });
  res.json({ ok: true });
});
app.get("/api/obligations", async (req, res) => {
  const a = await actor(req);
  res.json(
    await db.obligation.findMany({
      where: { application: { ...scope(a), runId: await runId() } },
      include: { application: { include: { institution: true } } },
      orderBy: { dueAt: "asc" },
    }),
  );
});
app.post("/api/obligations/:id/commands", async (req, res) => {
  const a = await actor(req);
  const c = z
    .object({
      command: z.enum(["submit", "accept", "return", "extend", "waive"]),
      reason: z.string().min(5),
      documentVersionId: z.string().optional(),
      dueAt: z.iso.datetime().optional(),
      expectedRevision: z.number().int(),
    })
    .parse(req.body);
  const result = await db.$transaction(async (tx) => {
    const o = await tx.obligation.findUnique({
      where: { id: String(req.params.id) },
    });
    ensure(o, "Obligation unavailable", 404);
    await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${o.applicationId} FOR UPDATE`;
    const record = await getApp(a, o.applicationId, tx);
    const current = await tx.obligation.findUniqueOrThrow({
      where: { id: o.id },
    });
    ensure(current.revision === c.expectedRevision, "Obligation changed");
    let state = current.state;
    let dueAt = current.dueAt;
    let evidence = current.evidence as any[];
    let revisions = current.revisions as any[];
    if (c.command === "submit") {
      ensure(
        can(a, record, ["INSTITUTION"]) && ["OPEN", "RETURNED"].includes(state),
        "Institution evidence submission unavailable",
        403,
      );
      ensure(
        record.documents.some((d) =>
          d.versions.some((v) => v.id === c.documentVersionId),
        ),
        "Choose evidence from this case",
      );
      evidence = [
        ...evidence,
        {
          versionId: c.documentVersionId,
          text: c.reason,
          at: (await clock(tx)).toISOString(),
        },
      ];
      state = "SUBMITTED";
    }
    if (["accept", "return"].includes(c.command)) {
      ensure(
        can(a, record, ["REVIEWER", "SUPERVISOR", "BUREAU"]),
        "Reviewer permission required",
        403,
      );
      ensure(state === "SUBMITTED", "Only submitted evidence can be reviewed");
      state = c.command === "accept" ? "ACCEPTED" : "RETURNED";
    }
    if (["extend", "waive"].includes(c.command)) {
      ensure(can(a, record, ["AUTHORITY"]), "Authority grant required", 403);
      ensure(
        !["ACCEPTED", "WAIVED"].includes(state),
        "Closed condition cannot change",
      );
      if (c.command === "extend") {
        ensure(
          c.dueAt && new Date(c.dueAt) > current.dueAt,
          "Extension must be later",
        );
        revisions = [
          ...revisions,
          {
            from: current.dueAt.toISOString(),
            to: c.dueAt,
            actorId: a.id,
            reason: c.reason,
          },
        ];
        dueAt = new Date(c.dueAt!);
      } else state = "WAIVED";
    }
    await tx.application.update({
      where: { id: record.id },
      data: { version: { increment: 1 } },
    });
    const updated = await tx.obligation.update({
      where: { id: o.id },
      data: {
        state,
        dueAt,
        evidence,
        revisions,
        revision: { increment: 1 },
        ...(["accept", "return"].includes(c.command)
          ? { reviewerId: a.id }
          : {}),
      },
    });
    await invalidateDeadline(
      tx,
      record.id,
      "OBLIGATION",
      o.id,
      `Obligation ${c.command}; previous deadline revision superseded`,
    );
    await audit(
      tx,
      a,
      record,
      `obligation-${c.command}`,
      c.reason,
      record.state,
      "PUBLIC",
      c.documentVersionId ? [c.documentVersionId] : [],
    );
    await notify(
      tx,
      record,
      `${record.reference}: obligation ${c.command}`,
      `${o.id}:${updated.revision}`,
      "OBLIGATION",
      o.id,
      updated.revision,
    );
    return updated;
  });
  res.json(result);
});
app.post("/api/applications/:id/migrate-policy", async (req, res) => {
  const a = await actor(req);
  const c = z
    .object({
      workflowId: z.string(),
      expectedVersion: z.number().int(),
      reason: z.string().min(10).max(4000),
    })
    .parse(req.body);
  const result = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${req.params.id} FOR UPDATE`;
    const record = await getApp(a, String(req.params.id), tx);
    ensure(
      can(a, record, ["BUREAU"]),
      "Explicit bureau migration permission required",
      403,
    );
    ensure(record.version === c.expectedVersion, "Record revision changed");
    ensure(
      !["APPROVED", "REJECTED", "CONDITIONAL"].includes(record.state),
      "Decided cases cannot migrate",
    );
    await tx.$queryRaw`SELECT id FROM "Workflow" WHERE id=${c.workflowId} FOR SHARE`;
    const target = await tx.workflow.findUnique({
      where: { id: c.workflowId },
    });
    ensure(target?.state === "PUBLISHED", "Target must be published");
    const before = workflowSchema.parse(record.workflow.config),
      after = workflowSchema.parse(target.config);
    ensure(
      JSON.stringify(before.stages.slice(0, record.stageIndex + 1)) ===
        JSON.stringify(after.stages.slice(0, record.stageIndex + 1)),
      "Migration must preserve all completed and current stages",
    );
    ensure(
      !after.applicability ||
        after.applicability.includes(record.category as any),
      "Category is not applicable",
    );
    ensure(
      !after.requiredEvidence?.some(
        (k) => !record.documents.some((d) => d.kind === k && d.versions.length),
      ),
      "Target evidence requirements are missing",
    );
    const updated = await tx.application.update({
      where: { id: record.id },
      data: {
        workflowId: target.id,
        version: { increment: 1 },
        deadlineRevision: { increment: 1 },
      },
    });
    await invalidateDeadline(
      tx,
      record.id,
      "APPLICATION",
      record.id,
      "Authorized policy migration; due time preserved, policy/deadline revision changed",
    );
    for (const document of record.documents) {
      await invalidateDeadline(
        tx,
        record.id,
        "DOCUMENT_REVIEW",
        document.id,
        "Authorized policy migration superseded prior-policy reminder work",
      );
      for (const version of document.versions)
        await invalidateDeadline(
          tx,
          record.id,
          "DOCUMENT",
          version.id,
          "Authorized policy migration superseded prior-policy reminder work",
        );
    }
    for (const obligation of record.obligations)
      await invalidateDeadline(
        tx,
        record.id,
        "OBLIGATION",
        obligation.id,
        "Authorized policy migration superseded prior-policy reminder work",
      );
    for (const visit of record.visits)
      await invalidateDeadline(
        tx,
        record.id,
        "VISIT",
        visit.id,
        "Authorized policy migration superseded prior-policy reminder work",
      );
    await audit(
      tx,
      a,
      updated,
      "migrate-policy",
      `${c.reason}; from ${record.workflowId} to ${target.id}; deadlines preserved`,
      record.state,
      "PUBLIC",
    );
    await notify(
      tx,
      updated,
      `${record.reference}: authorized policy migration`,
      `${record.id}:v${updated.version}`,
    );
    return updated;
  });
  res.json(result);
});
app.get("/api/rules", async (req, res) => {
  await actor(req);
  res.json({
    rules: (
      await db.workflow.findMany({
        orderBy: [{ name: "asc" }, { version: "desc" }],
      })
    ).map((rule) => ({
      ...rule,
      contentHash: hash(workflowSchema.parse(rule.config)),
    })),
    sources: await db.policySource.findMany(),
  });
});
app.post("/api/rules", async (req, res) => {
  const a = await actor(req);
  ensure(hasRole(a, "ADMIN", "BUREAU"), "Template editing grant required", 403);
  const c = z
    .object({
      name: z.string().min(3).max(100),
      config: workflowSchema,
      source: z.string().min(5).max(1000),
    })
    .parse(req.body);
  const r = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`policy-name:${c.name}`}))`;
    const version =
      (
        await tx.workflow.aggregate({
          where: { name: c.name },
          _max: { version: true },
        })
      )._max.version ?? 0;
    const rule = await tx.workflow.create({
      data: { ...c, version: version + 1 },
    });
    await audit(
      tx,
      a,
      null,
      "rule-draft",
      `${rule.id}: ${c.name} v${version + 1}`,
    );
    return rule;
  });
  res.status(201).json(r);
});
app.post("/api/rules/:id/:operation", async (req, res) => {
  const a = await actor(req);
  res.json(
    await ruleOperation(
      a,
      String(req.params.id),
      String(req.params.operation),
      req.body,
    ),
  );
});
app.get("/api/alerts", async (req, res) => {
  const a = await actor(req);
  const application = { ...scope(a), runId: await runId() };
  const eventCaseIds = (
    await db.application.findMany({ where: application, select: { id: true } })
  ).map((x) => x.id);
  const events = await db.escalation.findMany({
    where: { applicationId: { in: eventCaseIds } },
    orderBy: { createdAt: "desc" },
  });
  const recipients = await db.user.findMany({
    where: { id: { in: events.flatMap((e) => e.recipientIds as string[]) } },
    select: { id: true, name: true },
  });
  res.json({
    escalations: events.map((e) => ({
      ...e,
      recipientNames: (e.recipientIds as string[]).map(
        (id) =>
          recipients.find((u) => u.id === id)?.name ?? "Unavailable official",
      ),
    })),
    inbox: await db.notification.findMany({
      where: {
        userId: a.id,
        applicationId: {
          in: (
            await db.application.findMany({
              where: application,
              select: { id: true },
            })
          ).map((x) => x.id),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    deliveries: await db.outbox.findMany({
      where: {
        application,
        ...(!hasRole(a, "SUPERVISOR", "BUREAU") ? { recipientId: a.id } : {}),
      },
      include: { deliveries: { orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  });
});
app.post("/api/alerts/:id/read", async (req, res) => {
  const a = await actor(req);
  await db.notification.updateMany({
    where: { id: String(req.params.id), userId: a.id },
    data: { read: true },
  });
  res.json({ ok: true });
});
app.post("/api/escalations/:id/acknowledge", async (req, res) => {
  const a = await actor(req);
  const c = z
    .object({ reason: z.string().min(5), expectedState: z.string() })
    .parse(req.body);
  const result = await db.$transaction(async (tx) => {
    const initial = await tx.escalation.findUniqueOrThrow({
      where: { id: String(req.params.id) },
    });
    await tx.$queryRaw`SELECT id FROM "Application" WHERE id=${initial.applicationId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "Escalation" WHERE id=${initial.id} FOR UPDATE`;
    const event = await tx.escalation.findUniqueOrThrow({
      where: { id: initial.id },
    });
    const record = await getApp(a, event.applicationId, tx);
    ensure(
      can(a, record, ["SUPERVISOR", "BUREAU"]) ||
        (event.recipientIds as string[]).includes(a.id),
      "Designated recipient or scoped coordinator required",
      403,
    );
    ensure(
      event.state === c.expectedState &&
        ["OPEN", "UNASSIGNED"].includes(event.state),
      "Escalation changed or is already acknowledged/resolved",
    );
    const updated = await tx.escalation.update({
      where: { id: event.id },
      data: { state: "ACKNOWLEDGED", reason: c.reason },
    });
    await audit(
      tx,
      a,
      record,
      "escalation-acknowledged",
      `Level ${event.level}: ${c.reason}`,
      record.state,
      "PUBLIC",
    );
    return updated;
  });
  res.json(result);
});
app.post("/api/deliveries/:id/retry", async (req, res) => {
  const a = await actor(req);
  res.json(await retryDelivery(a, String(req.params.id), req.body));
});
app.get("/api/audits", async (req, res) => {
  const a = await actor(req);
  const ids = (
    await db.application.findMany({
      where: { ...scope(a), runId: await runId() },
      select: { id: true },
    })
  ).map((x) => x.id);
  const officialIds = (
    await db.application.findMany({
      where: { ...officialScope(a), runId: await runId() },
      select: { id: true },
    })
  ).map((x) => x.id);
  res.json(
    await db.audit.findMany({
      where: {
        OR: [
          { applicationId: { in: ids } },
          ...(a.grants.some(
            (g) => g.global && ["ADMIN", "BUREAU", "AUDITOR"].includes(g.role),
          )
            ? [{ applicationId: null }]
            : []),
        ],
        AND: [
          {
            OR: [
              { visibility: "PUBLIC" },
              { applicationId: { in: officialIds } },
              ...(a.grants.some(
                (g) =>
                  g.global && ["ADMIN", "BUREAU", "AUDITOR"].includes(g.role),
              )
                ? [{ applicationId: null }]
                : []),
            ],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
  );
});
app.get("/api/events", async (req, res) => {
  const a = await actor(req);
  const sessionId = req.sessionID;
  res.set({
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });
  res.flushHeaders();
  res.write("event: ready\ndata: {}\n\n");
  let stopped = false;
  let busy = false;
  const timer = setInterval(async () => {
    if (stopped || busy) return;
    busy = true;
    try {
      const stored = await new Promise<session.SessionData | null>(
        (resolve, reject) =>
          req.sessionStore.get(sessionId, (e, s) =>
            e ? reject(e) : resolve(s ?? null),
          ),
      );
      const fresh = await db.user.findUnique({
        where: { id: a.id },
        include: { grants: true },
      });
      if (
        !stored ||
        !fresh ||
        !fresh.active ||
        fresh.securityVersion !== stored.securityVersion ||
        hash(fresh.grants) !== hash(a.grants)
      ) {
        res.write("event: expired\ndata: {}\n\n");
        res.end();
        return;
      }
      const where = { ...scope(fresh), runId: await runId() };
      const revisions = await db.application.aggregate({
        where,
        _sum: { version: true },
        _count: true,
      });
      const inboxRevision = await db.notification.count({
        where: {
          userId: a.id,
          applicationId: {
            in: (
              await db.application.findMany({ where, select: { id: true } })
            ).map((x) => x.id),
          },
        },
      });
      const demoRevision = (await clock()).toISOString();
      res.write(
        `event: refresh\ndata: ${JSON.stringify({ revision: `${revisions._sum.version}:${inboxRevision}:${demoRevision}`, count: revisions._count, at: new Date() })}\n\n`,
      );
    } catch {
      res.end();
    } finally {
      busy = false;
    }
  }, 3000);
  req.on("close", () => {
    stopped = true;
    clearInterval(timer);
  });
});
app.get("/api/reports/:kind", async (req, res) => {
  const a = await actor(req);
  const kind = z
    .enum(["pendency", "evc", "compliance", "validity", "overdue", "regions"])
    .parse(req.params.kind);
  const awaitedNow = await clock();
  const where: Prisma.ApplicationWhereInput = await scopedFilter(req, a);
  const apps = await db.application.findMany({
    where,
    include: {
      institution: true,
      visits: true,
      obligations: true,
      attempts: true,
      documents: {
        include: { versions: { orderBy: { number: "desc" } } },
      },
    },
    orderBy: { reference: "asc" },
  });
  const overdueSubjects =
    kind === "overdue" ? await deadlineSubjects(where, awaitedNow) : [];
  const rows: Record<string, unknown>[] =
    kind === "overdue"
      ? overdueSubjects
          .filter((s) => s.due < awaitedNow)
          .map((s) => ({
            reference: s.reference,
            subjectType: s.type,
            subjectId: s.id,
            deadlineRevision: s.revision,
            region: s.regionId,
            institution: s.institutionId,
            owner: s.ownerId ?? "Unassigned",
            status: s.status,
            description: s.label,
            due: s.due.toISOString(),
            policyVersion: s.policyId,
            demoPolicy: true,
            asOf: awaitedNow.toISOString(),
          }))
      : kind === "compliance"
        ? apps.flatMap((x) =>
            x.obligations.map((o) => ({
              reference: x.reference,
              institution: x.institution.name,
              condition: o.condition,
              state: o.state,
              due: o.dueAt.toISOString(),
              originalDue: o.originalDueAt.toISOString(),
            })),
          )
        : kind === "validity"
          ? apps.flatMap((x) =>
              x.documents.map((d) => ({
                reference: x.reference,
                title: d.title,
                submittedVersion: d.versions[0]?.number,
                submittedReview: d.versions[0]?.reviewState,
                effectiveVersion:
                  documentCompliance(d.versions, awaitedNow).effective
                    ?.number ?? null,
                validity: documentCompliance(d.versions, awaitedNow).status,
                renewalPending: documentCompliance(d.versions, awaitedNow)
                  .renewalPending,
                expires:
                  documentCompliance(
                    d.versions,
                    awaitedNow,
                  ).effective?.validUntil?.toISOString() ?? null,
              })),
            )
          : kind === "evc"
            ? apps
                .filter((x) => x.state === "EVC" || x.visits.length)
                .map((x) => ({
                  reference: x.reference,
                  institution: x.institution.name,
                  state: x.visits.at(-1)?.state ?? "AWAITING_SCHEDULING",
                  start: x.visits.at(-1)?.startAt.toISOString(),
                }))
            : kind === "regions"
              ? Object.entries(
                  apps.reduce<Record<string, number>>(
                    (m, x) => (
                      (m[x.institution.regionId] =
                        (m[x.institution.regionId] ?? 0) + 1),
                      m
                    ),
                    {},
                  ),
                ).map(([region, cases]) => {
                  const group = apps.filter(
                    (x) => x.institution.regionId === region,
                  );
                  return {
                    region,
                    cases,
                    open: group.filter(
                      (x) =>
                        !["APPROVED", "REJECTED", "CONDITIONAL"].includes(
                          x.state,
                        ),
                    ).length,
                    meanInstitutionWaitDays: Number(
                      (
                        group.reduce(
                          (n, x) => n + ageing(x, awaitedNow).institutionDays,
                          0,
                        ) / cases
                      ).toFixed(2),
                    ),
                    meanOfficialStageDays: Number(
                      (
                        group.reduce(
                          (n, x) => n + ageing(x, awaitedNow).officialDays,
                          0,
                        ) / cases
                      ).toFixed(2),
                    ),
                  };
                })
              : apps.map((x) => ({
                  reference: x.reference,
                  institution: x.institution.name,
                  region: x.institution.regionId,
                  category: x.category,
                  state: x.state,
                  owner: x.ownerId ?? "Unassigned",
                  due: x.dueAt?.toISOString(),
                  ageDays: Math.max(
                    0,
                    Math.floor((+awaitedNow - +x.createdAt) / 86400000),
                  ),
                }));
  if (req.query.format === "csv") {
    const keys = Object.keys(rows[0] ?? { reference: "" });
    res
      .type("text/csv")
      .attachment(`Anumitra-${kind}.csv`)
      .send(
        [
          keys.map(csvCell).join(","),
          ...rows.map((r) => keys.map((k) => csvCell(r[k])).join(",")),
        ].join("\r\n"),
      );
    return;
  }
  if (req.query.format === "pdf") {
    res.type("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Anumitra-${kind}.pdf"`,
    );
    const pdf = new PDFDocument({ margin: 45 });
    pdf.pipe(res);
    pdf.fontSize(20).text(`Anumitra | ${kind}`);
    pdf
      .fontSize(10)
      .text(
        `Independent student prototype • DEMO CONFIGURATION\nBusiness clock: ${(await clock()).toISOString()}\nScope: ${a.grants.map((g) => g.role + ":" + (g.regionId ?? g.institutionId ?? "explicit global")).join(", ")}\n`,
      );
    for (const r of rows)
      pdf.moveDown().text(
        Object.entries(r)
          .map(([k, v]) => `${k}: ${v ?? "—"}`)
          .join("\n"),
      );
    pdf.end();
    return;
  }
  res.json({
    kind,
    total: rows.length,
    countUnit:
      kind === "overdue"
        ? "deadline subjects"
        : kind === "validity"
          ? "documents"
          : kind === "compliance"
            ? "undertakings"
            : "cases",
    filters: req.query,
    demoPolicy: true,
    rows,
    clock: awaitedNow,
  });
});
app.get("/api/applications/:id/notice", async (req, res) => {
  const a = await actor(req);
  const r = await getApp(a, String(req.params.id));
  res.type("application/pdf");
  const pdf = new PDFDocument({ margin: 50 });
  pdf.pipe(res);
  pdf.fontSize(24).text("Anumitra");
  pdf
    .fontSize(12)
    .text("DEMONSTRATION CASE SUMMARY • Not an official approval notice")
    .moveDown();
  pdf.text(
    `${r.reference}\n${r.institution.name}\n${r.category} | ${r.cycle}\nCurrent stage: ${r.state}\nWorkflow: ${r.workflow.name} v${r.workflow.version}\nDue: ${r.dueAt?.toISOString() ?? "Not assigned"}`,
  );
  for (const d of r.deficiencies)
    pdf
      .moveDown()
      .text(
        `Deficiency round ${d.round}: ${d.item}\n${d.reason}\nState: ${d.state}`,
      );
  for (const d of r.decisions)
    pdf.moveDown().text(`Decision: ${d.outcome}\n${d.reason}`);
  for (const d of r.documents)
    pdf
      .moveDown()
      .text(
        `Evidence: ${d.title} v${d.versions[0]?.number} (${d.versions[0]?.id})`,
      );
  pdf.end();
});
app.get("/api/admin", async (req, res) => {
  const a = await actor(req);
  ensure(
    hasRole(a, "ADMIN", "BUREAU"),
    "Administration permission required",
    403,
  );
  res.json({
    integrationMode,
    liveOfficialIntegration: false,
    clock: await db.demoClock.findUnique({ where: { id: "current" } }),
    users: await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        grants: true,
        securityVersion: true,
      },
    }),
    syncs: await db.syncRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    demo: process.env.DEMO_MODE === "true",
  });
});
app.post("/api/admin/users", async (req, res) => {
  const a = await actor(req);
  ensure(
    hasRole(a, "ADMIN", "BUREAU"),
    "Technical user management required",
    403,
  );
  const c = z
    .object({
      name: z.string().min(3).max(100),
      email: z.string().email().max(200),
    })
    .strict()
    .parse(req.body);
  const initialPassword = randomBytes(18).toString("base64url") + "aA9!";
  const created = await db.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        ...c,
        email: c.email.toLowerCase(),
        passwordHash: await bcrypt.hash(initialPassword, 12),
      },
    });
    await audit(tx, a, null, "create-user", `Created ${u.id} with no grants`);
    return { id: u.id, name: u.name, email: u.email };
  });
  res.status(201).json({
    ...created,
    initialPassword,
    notice: "Copy once; no grants assigned. A bureau actor must grant access.",
  });
});
app.post("/api/admin/grants", async (req, res) => {
  const a = await actor(req);
  res.json(await grantRole(a, req.body));
});
app.post("/api/admin/clock", async (req, res) => {
  const a = await actor(req);
  ensure(
    process.env.DEMO_MODE === "true" && hasRole(a, "ADMIN"),
    "Demo admin required",
    403,
  );
  const days = z.number().int().min(1).max(365).parse(req.body.days);
  const now = await clock();
  const r = await db.$transaction(async (tx) => {
    const c = await tx.demoClock.update({
      where: { id: "current" },
      data: { now: new Date(+now + days * 86400000) },
    });
    await audit(
      tx,
      a,
      null,
      "advance-demo-clock",
      `${days} days; authentication and queue clocks remain real`,
    );
    return c;
  });
  res.json(r);
});
app.post("/api/admin/reset", async (req, res) => {
  const a = await actor(req);
  ensure(
    process.env.DEMO_MODE === "true" && hasRole(a, "ADMIN"),
    "Demo admin required",
    403,
  );
  ensure(req.body.confirm === "NEW_DEMO_RUN", "Type NEW_DEMO_RUN", 400);
  const { seedRun } = await import("../../../packages/db/seed.ts");
  res.json(await seedRun());
});
app.post("/api/integrations/import", async (req, res) => {
  ensure(
    integrationMode === "LOCAL_ADAPTER",
    "Integration adapter is disconnected",
    503,
  );
  const a = await actor(req);
  ensure(
    hasRole(a, "ADMIN", "BUREAU"),
    "Local adapter permission required",
    403,
  );
  const c = z
    .object({
      format: z.enum(["json", "csv"]),
      content: z.string().max(500000),
      preview: z.boolean(),
    })
    .parse(req.body);
  const rows =
    c.format === "json"
      ? JSON.parse(c.content)
      : parse(c.content, { columns: true, skip_empty_lines: true });
  const schema = z
    .array(
      z
        .object({
          externalId: z.string().min(1).max(100),
          institutionId: z.string(),
          workflowId: z.string(),
          category: z.enum(["NEW_INSTITUTION", "EXTENSION", "CHANGE"]),
          cycle: z.string().regex(/^\d{4}-\d{2}$/),
          contact: z.string().email(),
          programme: z.string().min(3),
          intake: z.coerce.number().int().min(1).max(2000),
        })
        .strict(),
    )
    .max(200);
  const validated = schema.parse(rows);
  ensure(
    new Set(validated.map((x) => x.externalId)).size === validated.length,
    "Duplicate external IDs in batch",
    400,
  );
  const results = [];
  for (const row of validated) {
    const targetInstitution = await db.institution.findUnique({
      where: { id: row.institutionId },
    });
    ensure(
      targetInstitution &&
        a.grants.some(
          (g) =>
            ((g.role === "ADMIN" && g.global) || g.role === "BUREAU") &&
            grantMatches(g, {
              institutionId: row.institutionId,
              institution: targetInstitution,
              bureau: "APPROVAL",
            }),
        ),
      "Import target exceeds explicit bureau scope",
      403,
    );
    ensure(
      await db.institution.count({ where: { id: row.institutionId } }),
      "Unknown institution",
      400,
    );
    ensure(
      await db.workflow.count({
        where: { id: row.workflowId, state: "PUBLISHED" },
      }),
      "Unknown published workflow",
      400,
    );
    const existing = await db.externalMapping.findUnique({
      where: {
        source_externalId: {
          source: "LOCAL_ADAPTER",
          externalId: row.externalId,
        },
      },
    });
    if (existing) {
      ensure(
        existing.payloadHash === hash(row),
        "External ID input changed; use audited application commands",
      );
      results.push({
        externalId: row.externalId,
        state: "UNCHANGED",
        applicationId: existing.applicationId,
      });
      continue;
    }
    if (c.preview) {
      results.push({ externalId: row.externalId, state: "VALID_DRAFT" });
      continue;
    }
    const created = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`import:${row.externalId}`}))`;
      const replay = await tx.externalMapping.findUnique({
        where: {
          source_externalId: {
            source: "LOCAL_ADAPTER",
            externalId: row.externalId,
          },
        },
      });
      if (replay) {
        ensure(replay.payloadHash === hash(row), "External ID changed");
        return { id: replay.applicationId };
      }
      const record = await tx.application.create({
        data: {
          reference: `AN-${randomUUID().slice(0, 8).toUpperCase()}`,
          institutionId: row.institutionId,
          workflowId: row.workflowId,
          category: row.category,
          cycle: row.cycle,
          data: {
            contact: row.contact,
            programme: row.programme,
            intake: row.intake,
          },
          runId: await runId(tx),
        },
      });
      await tx.externalMapping.create({
        data: {
          source: "LOCAL_ADAPTER",
          externalId: row.externalId,
          applicationId: record.id,
          payloadHash: hash(row),
        },
      });
      await audit(
        tx,
        a,
        record,
        "local-import",
        "Local adapter created a draft; submission guards still apply",
        undefined,
        "PUBLIC",
      );
      return record;
    });
    results.push({
      externalId: row.externalId,
      state: "IMPORTED_DRAFT",
      applicationId: created.id,
    });
  }
  await db.syncRun.create({
    data: { actorId: a.id, preview: c.preview, result: results },
  });
  res.json({ mode: "LOCAL_ADAPTER", preview: c.preview, results });
});
app.get("/api/integrations/export", async (req, res) => {
  const a = await actor(req);
  res.json({
    mode: "LOCAL_ADAPTER",
    applications: await db.application.findMany({
      where: { ...scope(a), runId: await runId() },
      select: {
        reference: true,
        institutionId: true,
        state: true,
        category: true,
        cycle: true,
        version: true,
      },
    }),
  });
});
app.post("/api/integrations/master", async (req, res) => {
  ensure(
    integrationMode === "LOCAL_ADAPTER",
    "Integration adapter is disconnected",
    503,
  );
  const a = await actor(req);
  const c = z
    .object({
      entity: z.enum(["institutions", "documentMetadata"]),
      format: z.enum(["json", "csv"]),
      content: z.string().max(500000),
      preview: z.boolean(),
    })
    .parse(req.body);
  const rows =
    c.format === "json"
      ? JSON.parse(c.content)
      : parse(c.content, { columns: true, skip_empty_lines: true });
  const results: any[] = [];
  if (c.entity === "institutions") {
    ensure(
      hasRole(a, "ADMIN", "BUREAU"),
      "Master-data import permission required",
      403,
    );
    const records = z
      .array(
        z
          .object({
            id: z.string().min(2).max(100),
            name: z.string().min(3).max(200),
            regionId: z.string(),
          })
          .strict(),
      )
      .max(200)
      .parse(rows);
    for (const r of records) {
      ensure(
        await db.region.count({ where: { id: r.regionId } }),
        "Unknown region",
        400,
      );
      const old = await db.institution.findUnique({ where: { id: r.id } });
      ensure(
        !old || (old.name === r.name && old.regionId === r.regionId),
        "Existing master scope cannot be silently overwritten",
      );
      if (!c.preview && !old)
        await db.$transaction(async (tx) => {
          await tx.institution.create({ data: r });
          await audit(
            tx,
            a,
            null,
            "local-institution-import",
            `External institution ID ${r.id}`,
          );
        });
      results.push({
        externalId: r.id,
        state: old
          ? "UNCHANGED"
          : c.preview
            ? "VALID_MASTER"
            : "IMPORTED_MASTER",
      });
    }
  } else {
    const records = z
      .array(
        z
          .object({
            externalId: z.string().min(1).max(100),
            applicationId: z.string(),
            kind: z.enum(["LEASE", "AFFIDAVIT", "COMPLIANCE", "OTHER"]),
            title: z.string().min(3).max(200),
          })
          .strict(),
      )
      .max(200)
      .parse(rows);
    for (const r of records) {
      const appRecord = await getApp(a, r.applicationId);
      ensure(
        can(a, appRecord, ["INSTITUTION", "BUREAU"]),
        "Document metadata import permission required",
        403,
      );
      ensure(
        ["DRAFT", "AWAITING_RESPONSE"].includes(appRecord.state),
        "Metadata imports cannot rewrite reviewed or decided evidence",
      );
      const existing = await db.externalMapping.findUnique({
        where: {
          source_externalId: {
            source: "LOCAL_DOCUMENT_METADATA",
            externalId: r.externalId,
          },
        },
      });
      ensure(
        !existing || existing.payloadHash === hash(r),
        "External metadata ID changed",
      );
      if (!c.preview && !existing)
        await db.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${`metadata:${r.externalId}`}))`;
          const replay = await tx.externalMapping.findUnique({
            where: {
              source_externalId: {
                source: "LOCAL_DOCUMENT_METADATA",
                externalId: r.externalId,
              },
            },
          });
          if (replay) return;
          const doc = await tx.document.create({
            data: {
              applicationId: r.applicationId,
              title: r.title,
              kind: r.kind,
            },
          });
          await tx.externalMapping.create({
            data: {
              source: "LOCAL_DOCUMENT_METADATA",
              externalId: r.externalId,
              applicationId: r.applicationId,
              payloadHash: hash(r),
            },
          });
          await audit(
            tx,
            a,
            appRecord,
            "local-document-metadata-import",
            `Pending document ${doc.id}; private bytes still required`,
            appRecord.state,
            "PUBLIC",
          );
        });
      results.push({
        externalId: r.externalId,
        state: existing
          ? "UNCHANGED"
          : c.preview
            ? "VALID_METADATA"
            : "IMPORTED_PENDING_BYTES",
      });
    }
  }
  await db.syncRun.create({
    data: { actorId: a.id, preview: c.preview, result: results },
  });
  res.json({
    mode: "LOCAL_ADAPTER",
    entity: c.entity,
    preview: c.preview,
    results,
  });
});
app.get("/api/openapi.json", (_req, res) => res.json(openapi(app, origin)));
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Unknown API endpoint" }),
);
app.use(express.static(path.resolve("dist/web")));
app.get("/{*path}", (_req, res) =>
  res.sendFile(path.resolve("dist/web/index.html")),
);
app.use((e: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  const status =
    e instanceof DomainError
      ? e.status
      : e instanceof z.ZodError ||
          e instanceof SyntaxError ||
          e instanceof multer.MulterError
        ? 400
        : 500;
  if (status === 500) console.error(e);
  res.status(status).json({
    error:
      e instanceof z.ZodError
        ? e.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")
        : status === 500
          ? "Server operation failed; inspect local API log."
          : e instanceof Error
            ? e.message
            : "Request rejected",
  });
});
const server = app.listen(port, process.env.HOST ?? "127.0.0.1", () =>
  console.log(`Anumitra: ${origin}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await db.$disconnect();
      process.exit(0);
    }),
  );
