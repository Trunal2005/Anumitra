import type { Express } from "express";
import { z } from "zod";
import {
  commandSchema,
  draftSchema,
  loginSchema,
  workflowSchema,
} from "../../../packages/contracts/index.ts";
export function openapi(app: Express, origin: string) {
  const paths: Record<string, any> = {};
  for (const layer of app.router.stack) {
    const route = layer.route as unknown as {
      path: string;
      methods: Record<string, boolean>;
    };
    if (
      !route ||
      typeof route.path !== "string" ||
      !route.path.startsWith("/api/")
    )
      continue;
    const path = route.path.replace(/:([A-Za-z]+)/g, "{$1}");
    const params = [...path.matchAll(/\{(\w+)\}/g)].map((x) => ({
      name: x[1],
      in: "path",
      required: true,
      schema: { type: "string" },
    }));
    for (const method of Object.keys(route.methods)) {
      if (!route.methods[method]) continue;
      const write = !["get", "head"].includes(method);
      const schema =
        path === "/api/login"
          ? loginSchema
          : path.endsWith("/commands") && path.includes("/applications/")
            ? commandSchema
            : path === "/api/applications" && method === "post"
              ? draftSchema
              : path.endsWith("/draft")
                ? draftSchema
                : null;
      const operation: any = {
        summary: `${method.toUpperCase()} ${path}`,
        parameters: [
          ...params,
          ...(path.endsWith("/commands") && path.includes("/applications/")
            ? [
                {
                  name: "Idempotency-Key",
                  in: "header",
                  required: true,
                  schema: { type: "string", maxLength: 150 },
                },
              ]
            : []),
        ],
        security: write
          ? [{ sessionCookie: [], csrfToken: [] }]
          : [{ sessionCookie: [] }],
        responses: {
          "200": { description: "Authorized scoped result" },
          "201": { description: "Persistent record created" },
          "400": { description: "Input or guard validation failed" },
          "401": { description: "Session missing or invalidated" },
          "403": { description: "Permission, origin or CSRF rejected" },
          "404": { description: "Unavailable or out of scope" },
          "409": {
            description: "Version, transition, idempotency or booking conflict",
          },
        },
      };
      if (schema)
        operation.requestBody = {
          required: true,
          content: { "application/json": { schema: z.toJSONSchema(schema) } },
        };
      else if (write)
        operation.requestBody = {
          required: true,
          description:
            "See docs/API.md and endpoint validator for operation-specific fields.",
          content: { "application/json": { schema: { type: "object" } } },
        };
      if (path.endsWith("/documents") && method === "post")
        operation.requestBody = {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file", "title", "kind"],
                properties: {
                  file: { type: "string", format: "binary" },
                  title: { type: "string" },
                  kind: { enum: ["LEASE", "AFFIDAVIT", "COMPLIANCE", "OTHER"] },
                  documentId: { type: "string" },
                  validUntil: { type: "string", format: "date" },
                  issuer: { type: "string" },
                },
              },
            },
          },
        };
      (paths[path] ??= {})[method] = operation;
    }
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "Anumitra local approval/compliance API",
      version: "1.0.0",
      description:
        "Independent student prototype. Same-origin sessions, scoped grants, demo policies, local Mailpit and LOCAL_ADAPTER only.",
    },
    servers: [{ url: origin }],
    paths,
    components: {
      securitySchemes: {
        sessionCookie: { type: "apiKey", in: "cookie", name: "anumitra.sid" },
        csrfToken: { type: "apiKey", in: "header", name: "X-CSRF-Token" },
      },
      schemas: {
        Command: z.toJSONSchema(commandSchema),
        Draft: z.toJSONSchema(draftSchema),
        Workflow: z.toJSONSchema(workflowSchema),
      },
    },
  };
}
