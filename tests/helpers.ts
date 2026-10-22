import "./safety.ts";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
export const credentials = JSON.parse(
  await readFile(
    process.env.LOCAL_STATE_PATH + "/demo-credentials.json",
    "utf8",
  ),
);
export class Client {
  cookie = "";
  csrf = "";
  user: any;
  async request(url: string, method = "GET", body?: any, key?: string) {
    const response = await fetch(process.env.TEST_API_ORIGIN + "/api" + url, {
      method,
      headers: {
        Cookie: this.cookie,
        "X-CSRF-Token": this.csrf,
        ...(body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body:
        body instanceof FormData
          ? body
          : body === undefined
            ? undefined
            : JSON.stringify(body),
    });
    const cookie = response.headers.get("set-cookie");
    if (cookie) this.cookie = cookie.split(";")[0];
    const data = response.headers.get("content-type")?.includes("json")
      ? await response.json()
      : await response.text();
    if (data.csrf) this.csrf = data.csrf;
    return { status: response.status, data };
  }
  async ok(url: string, method = "GET", body?: any, key?: string) {
    const result = await this.request(url, method, body, key);
    assert.ok(
      result.status < 300,
      `${method} ${url}: ${result.status} ${JSON.stringify(result.data)}`,
    );
    return result.data;
  }
  async login(prefix: string) {
    await this.ok("/session");
    const result = await this.ok("/login", "POST", {
      email: prefix.includes("@") ? prefix : prefix + "@anumitra.test",
      password: credentials.password,
    });
    this.user = result.user;
    return this;
  }
  async command(id: string, command: string, extra: any = {}) {
    const current = await this.ok("/applications/" + id);
    return this.ok(
      `/applications/${id}/commands`,
      "POST",
      {
        command,
        expectedVersion: current.version,
        reason: "Fictional controlled repair regression evidence",
        ...extra,
      },
      randomUUID(),
    );
  }
  async create(route = "Only Scrutiny") {
    const options = await this.ok("/options");
    return this.ok("/applications", "POST", {
      institutionId: "I01",
      workflowId: options.workflows.find((w: any) => w.name === route).id,
      category: "NEW_INSTITUTION",
      cycle: "2026-27",
      data: {
        contact: "repair@fiction.test",
        programme: "Engineering",
        intake: 60,
      },
    });
  }
  async upload(id: string, documentId?: string, date?: string) {
    return this.ok(
      `/applications/${id}/documents`,
      "POST",
      uploadForm(documentId, date),
    );
  }
}
export function uploadForm(documentId?: string, date?: string) {
  const form = new FormData();
  form.set("title", "Fictional repair evidence");
  form.set("kind", "LEASE");
  if (date) form.set("validUntil", date);
  if (documentId) form.set("documentId", documentId);
  form.set(
    "file",
    new Blob([Buffer.from("%PDF-1.4\n% fictional repair evidence\n%%EOF")], {
      type: "application/pdf",
    }),
    "repair.pdf",
  );
  return form;
}
