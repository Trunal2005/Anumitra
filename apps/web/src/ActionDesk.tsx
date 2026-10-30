import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  Clock3,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { useData, date } from "./data.ts";
import { readable } from "../../../packages/contracts/presentation.ts";
import {
  Blank,
  Due,
  Failure,
  Origin,
  PageTitle,
  Status,
  TableRegion,
} from "./workspace-ui.tsx";

const roleCopy: Record<
  string,
  { title: string; description: string; groups: string[] }
> = {
  INSTITUTION: {
    title: "My action desk",
    description:
      "Respond to review findings, meet decision conditions and keep evidence current.",
    groups: ["DEFICIENCY", "UNDERTAKING", "RENEWAL", "DRAFT"],
  },
  REVIEWER: {
    title: "My review desk",
    description:
      "Assigned evidence, returned responses and stage checks requiring your review.",
    groups: ["RESPONSE", "EVIDENCE", "STAGE"],
  },
  SUPERVISOR: {
    title: "Regional action desk",
    description:
      "Exceptions, unassigned work, expert visits and compliance evidence in your authorized scope.",
    groups: [
      "UNASSIGNED",
      "EXCEPTION",
      "ESCALATION",
      "EVC_SCHEDULING",
      "VISIT_REVIEW",
      "COMPLIANCE_REVIEW",
    ],
  },
  BUREAU: {
    title: "Bureau action desk",
    description:
      "Cross-region exceptions and accountable follow-up within your grants.",
    groups: [
      "EXCEPTION",
      "UNASSIGNED",
      "ESCALATION",
      "EVC_SCHEDULING",
      "COMPLIANCE_REVIEW",
    ],
  },
  COMMITTEE: {
    title: "Committee action desk",
    description:
      "Assigned cases, visit reports and current-attempt recommendations.",
    groups: ["VISIT_REPORT", "COMMITTEE"],
  },
  AUTHORITY: {
    title: "Authority action desk",
    description:
      "Review decision packets, adverse findings and unresolved evidence before a human decision.",
    groups: ["DECISION", "ESCALATION"],
  },
  AUDITOR: {
    title: "Audit action desk",
    description:
      "Read scoped case histories and reconcile reports. No regulatory actions are assigned to this role.",
    groups: [],
  },
  ADMIN: {
    title: "Administration desk",
    description:
      "Technical configuration and reference information. Technical access does not grant regulatory authority.",
    groups: [],
  },
};
export default function ActionDesk({ user }: { user: any }) {
  const { data, isPending, error } = useData("actionDesk", "/action-desk");
  const [kind, setKind] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);
  const section = useRef<HTMLElement>(null);
  const roles: string[] = user.grants.map((g: any) => g.role);
  const role =
    [
      "BUREAU",
      "SUPERVISOR",
      "AUTHORITY",
      "COMMITTEE",
      "REVIEWER",
      "INSTITUTION",
      "AUDITOR",
      "ADMIN",
    ].find((r) => roles.includes(r)) ?? "AUDITOR";
  const copy = roleCopy[role];
  const rows = (data?.tasks ?? []).filter(
    (t: any) =>
      (kind === "all" || t.kind === kind) &&
      (priority === "all" || t.urgency.key === priority),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 25));
  const currentPage = Math.min(page, pages);
  const visibleRows = rows.slice((currentPage - 1) * 25, currentPage * 25);
  useEffect(() => {
    setPage(1);
  }, [kind, priority]);
  useEffect(() => {
    section.current?.querySelector(".ops-table-scroll")?.scrollTo({ top: 0 });
  }, [currentPage, kind, priority]);
  return (
    <>
      <PageTitle
        title={copy.title}
        description={copy.description}
        action={
          roles.includes("INSTITUTION") ? (
            <Link className="primary" to="/applications/new">
              <Plus size={16} />
              New application
            </Link>
          ) : (
            <Link
              className="secondary"
              to={role === "COMMITTEE" ? "/committees" : "/applications"}
            >
              Open {role === "COMMITTEE" ? "agenda" : "review queue"}
              <ArrowRight size={16} />
            </Link>
          )
        }
      />
      <div className="workspace-disclosure">
        <ShieldCheck size={17} />
        <span>
          <strong>Independent prototype</strong> · Local records only. Numeric
          deadlines are DEMO policies; public references are a separate
          collection.
        </span>
        <span>As of {data?.now ? date(data.now) + " IST" : "loading"}</span>
      </div>
      <div className="desk-metrics">
        <div>
          <ListChecks />
          <span>
            Follow-up tasks<strong>{data?.totalTasks ?? "—"}</strong>
          </span>
        </div>
        <div className="danger-metric">
          <Clock3 />
          <span>
            Overdue tasks<strong>{data?.overdueTasks ?? "—"}</strong>
          </span>
        </div>
        <div>
          <span>
            Cases needing attention<strong>{data?.distinctCases ?? "—"}</strong>
          </span>
        </div>
        <div>
          <span>
            Cases in authorized scope
            <strong>{data?.totalScopedCases ?? "—"}</strong>
          </span>
        </div>
      </div>
      <div className="desk-layout">
        <section ref={section} className="ops-surface desk-main">
          <div className="surface-heading">
            <div>
              <h2>Priority worklist</h2>
              <p>
                Each row is a task, not necessarily a different application.
              </p>
            </div>
            <label className="compact-field">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="all">All priorities</option>
                {[
                  "OVERDUE",
                  "TODAY",
                  "DUE_SOON",
                  "NO_DEADLINE",
                  "SCHEDULED",
                ].map((p) => (
                  <option key={p} value={p}>
                    {readable(p)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="queue-tabs" aria-label="Task categories">
            <button
              className={kind === "all" ? "selected" : ""}
              onClick={() => setKind("all")}
            >
              All tasks <span>{data?.totalTasks ?? 0}</span>
            </button>
            {(data?.sections ?? []).map((s: any) => (
              <button
                key={s.kind}
                className={kind === s.kind ? "selected" : ""}
                onClick={() => setKind(s.kind)}
              >
                {readable(s.kind)} <span>{s.count}</span>
              </button>
            ))}
          </div>
          <Failure error={error} />
          {isPending ? (
            <p role="status" className="loading-row">
              Loading scoped tasks…
            </p>
          ) : rows.length ? (
            <TableRegion label="Priority action tasks">
              <table className="ops-table">
                <thead>
                  <tr>
                    {[
                      "Case / institution",
                      "Required action",
                      "Responsibility",
                      "Deadline / urgency",
                      "",
                    ].map((t, i) => (
                      <th scope="col" key={i}>
                        {t || "Open task"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((t: any) => (
                    <tr key={t.id} data-task-id={t.id}>
                      <td>
                        <Link
                          to={"/applications/" + t.applicationId}
                          className="case-link"
                        >
                          <strong>{t.reference}</strong>
                          <span>{t.institution}</span>
                        </Link>
                        <Origin kind={t.recordOrigin} />
                      </td>
                      <td>
                        <strong>{t.title}</strong>
                        <small>{t.reason}</small>
                      </td>
                      <td>
                        {t.responsiblePerson ?? t.responsibleRole}
                        <small>
                          {t.responsiblePerson
                            ? t.responsibleRole
                            : "Scoped role"}
                        </small>
                        <small>
                          Case age:{" "}
                          {t.ageDays === null
                            ? "Not recorded"
                            : Math.floor(t.ageDays) + "d"}
                        </small>
                      </td>
                      <td>
                        <Due due={t.dueAt} urgency={t.urgency} />
                      </td>
                      <td>
                        <Link className="task-link" to={t.href}>
                          Open task
                          <ArrowRight size={15} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableRegion>
          ) : (
            <Blank>
              No matching tasks. You can still inspect authorized cases and
              reports.
            </Blank>
          )}
          {!!rows.length && (
            <div className="desk-task-pagination" aria-label="Task pagination">
              <span>
                Tasks {(currentPage - 1) * 25 + 1}–
                {Math.min(currentPage * 25, rows.length)} of {rows.length}{" "}
                matching tasks
              </span>
              <button
                className="secondary"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous tasks
              </button>
              <span>
                Page {currentPage} of {pages}
              </span>
              <button
                className="secondary"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next tasks
              </button>
            </div>
          )}
          <details className="priority-explanation">
            <summary>How is this work prioritised?</summary>
            <p>{data?.priorityRule}</p>
            <p>{data?.countNote}</p>
          </details>
        </section>
        <aside className="desk-aside">
          <section className="ops-surface">
            <h2>{readable(role)} focus</h2>
            {copy.groups.map((g) => (
              <button
                className="focus-row"
                key={g}
                onClick={() => {
                  setKind(g);
                  setPriority("all");
                }}
              >
                <span>{readable(g)}</span>
                <strong>
                  {data?.sections.find((s: any) => s.kind === g)?.count ?? 0}
                </strong>
                <ArrowRight size={15} />
              </button>
            ))}
            {!copy.groups.length && (
              <p>
                Use the read-only reports and public reference collection.
                Regulatory actions remain guarded by explicit role grants.
              </p>
            )}
          </section>
          <section className="ops-surface">
            <h2>Record provenance</h2>
            {Object.entries(data?.origins ?? {}).map(([key, count]) => (
              <div className="focus-row" key={key}>
                <Origin kind={key} />
                <strong>{String(count)}</strong>
              </div>
            ))}
            <p className="fine-print">
              Unclassified records have no stored provenance tag. No authorized
              pilot feed is configured.
            </p>
            <Link className="task-link" to="/references">
              Explore public references
              <ArrowRight size={15} />
            </Link>
          </section>
          {role === "AUTHORITY" && (
            <section className="ops-surface">
              <Status value="PENDING">Human oversight required</Status>
              <p>
                Recommendations and alerts never issue a final decision. Review
                the packet and record an explicit reason.
              </p>
            </section>
          )}
        </aside>
      </div>
      {data &&
        ["SUPERVISOR", "BUREAU", "REVIEWER", "AUTHORITY"].includes(role) && (
          <div className="performance-grid">
            <section className="ops-surface">
              <h2>Stage-by-region backlog</h2>
              <p className="fine-print">
                Open cases, not deadline subjects. Select a row to open the
                matching scoped queue.
              </p>
              <TableRegion label="Scoped stage and region backlog">
                <table className="ops-table">
                  <thead>
                    <tr>
                      {[
                        "Region / stage",
                        "Cases",
                        "Oldest known stage age",
                        "Unknown stage ages",
                      ].map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.backlog.map((r: any) => (
                      <tr key={r.regionId + r.stage}>
                        <td>
                          <Link
                            className="task-link"
                            to={
                              "/applications?" +
                              new URLSearchParams({
                                region: r.regionId,
                                state: r.stage,
                              })
                            }
                          >
                            {r.region} · {readable(r.stage)}
                          </Link>
                        </td>
                        <td>{r.count}</td>
                        <td>
                          {r.oldestKnownDays === null
                            ? "Not recorded"
                            : Math.floor(r.oldestKnownDays) + "d"}
                        </td>
                        <td>{r.unknownAges}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableRegion>
            </section>
            <section className="ops-surface">
              <h2>Assigned case workload</h2>
              <p className="fine-print">
                Active cases grouped by the current eligible owner. Unknown
                ownership stays explicit.
              </p>
              <TableRegion label="Authorized assignee workload">
                <table className="ops-table">
                  <thead>
                    <tr>
                      <th scope="col">Responsible owner</th>
                      <th scope="col">Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.workload.map((r: any) => (
                      <tr key={r.ownerId ?? "UNASSIGNED"}>
                        <td>
                          <Link
                            className="task-link"
                            to={
                              r.ownerId
                                ? "/applications?owner=" +
                                  encodeURIComponent(r.ownerId)
                                : "/applications?view=unassigned"
                            }
                          >
                            {r.ownerName}
                          </Link>
                        </td>
                        <td>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableRegion>
            </section>
          </div>
        )}
    </>
  );
}
