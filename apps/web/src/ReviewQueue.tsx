import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { useData } from "./data.ts";
import { readable } from "../../../packages/contracts/presentation.ts";
import {
  Blank,
  CaseLink,
  Due,
  Failure,
  Origin,
  PageTitle,
  Status,
  TableRegion,
} from "./workspace-ui.tsx";

export default function ReviewQueue({ user }: { user: any }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const options = useData("options", "/options");
  const result = useData("reviewQueue", "/review-queue?" + params.toString());
  const view = params.get("view") ?? "all";
  const institution = user.grants.some((g: any) => g.role === "INSTITUTION");
  const coordinator = user.grants.some((g: any) =>
    ["SUPERVISOR", "BUREAU"].includes(g.role),
  );
  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== "page") p.delete("page");
    setParams(p);
  };
  const page = result.data?.page ?? 1,
    limit = result.data?.limit ?? 15,
    total = result.data?.total ?? 0;
  return (
    <>
      <PageTitle
        title={institution ? "My applications" : "Review queue"}
        description="Case-level work, current stage age and the next authorized step."
        action={
          institution ? (
            <Link className="primary" to="/applications/new">
              <Plus size={16} />
              New application
            </Link>
          ) : null
        }
      />
      <section className="ops-surface">
        <div className="queue-tabs">
          <button
            className={view === "all" ? "selected" : ""}
            onClick={() => update("view", "")}
          >
            All cases
          </button>
          {!institution && (
            <button
              className={view === "mine" ? "selected" : ""}
              onClick={() => update("view", "mine")}
            >
              My queue
            </button>
          )}
          <button
            className={view === "due-soon" ? "selected" : ""}
            onClick={() => update("view", "due-soon")}
          >
            Due soon
          </button>
          <button
            className={view === "overdue" ? "selected" : ""}
            onClick={() => update("view", "overdue")}
          >
            Overdue
          </button>
          {coordinator && (
            <button
              className={view === "unassigned" ? "selected" : ""}
              onClick={() => update("view", "unassigned")}
            >
              Unassigned
            </button>
          )}
        </div>
        <div className="queue-toolbar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update("q", search);
            }}
            className="queue-search"
          >
            <label className="sr-only" htmlFor="queue-search">
              Search reference or institution
            </label>
            <Search size={17} />
            <input
              id="queue-search"
              placeholder="Search reference or institution"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="secondary" type="submit">
              Search
            </button>
          </form>
          <label className="compact-field">
            Stage
            <select
              aria-label="Stage"
              value={params.get("state") ?? ""}
              onChange={(e) => update("state", e.target.value)}
            >
              <option value="">All stages</option>
              {[
                "DRAFT",
                "SCRUTINY",
                "AWAITING_RESPONSE",
                "RESCRUTINY",
                "EVC",
                "SAC",
                "SHC",
                "AUTHORITY",
                "APPROVED",
                "CONDITIONAL",
                "REJECTED",
              ].map((s) => (
                <option key={s} value={s}>
                  {readable(s)}
                </option>
              ))}
            </select>
          </label>
          {!institution && (
            <label className="compact-field">
              Region
              <select
                aria-label="Region"
                value={params.get("region") ?? ""}
                onChange={(e) => update("region", e.target.value)}
              >
                <option value="">Authorized regions</option>
                {options.data?.regions.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="compact-field">
            Sort
            <select
              value={params.get("sort") ?? "priority"}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="priority">Urgency first</option>
              <option value="age">Stage age</option>
              <option value="reference">Reference</option>
              <option value="due">Earliest deadline</option>
              <option value="stage">Stage</option>
            </select>
          </label>
          <label className="compact-field">
            Order
            <select
              value={params.get("direction") ?? "asc"}
              onChange={(e) => update("direction", e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
          <label className="compact-field">
            Data source
            <select
              value={params.get("origin") ?? ""}
              onChange={(e) => update("origin", e.target.value)}
            >
              <option value="">All operational origins</option>
              <option value="FICTIONAL_DEMO">Fictional workflow</option>
              <option value="UNCLASSIFIED">Provenance not recorded</option>
              <option value="AUTHORIZED_PILOT">Authorized pilot</option>
            </select>
          </label>
        </div>
        <div className="applied-filters" aria-label="Applied filters">
          {[...params.entries()]
            .filter(
              ([k]) => !["page", "limit", "sort", "direction"].includes(k),
            )
            .map(([k, v]) => (
              <button key={k} onClick={() => update(k, "")}>
                {readable(k)}: {readable(v)}
                <X size={13} />
              </button>
            ))}
          {params.size > 0 && (
            <button
              className="clear-filters"
              onClick={() => {
                setSearch("");
                setParams({});
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        <Failure error={result.error} />
        {result.isPending ? (
          <p role="status" className="loading-row">
            Loading authorized queue…
          </p>
        ) : result.data?.items.length ? (
          <TableRegion label="Application review queue">
            <table className="ops-table queue-table">
              <thead>
                <tr>
                  {[
                    "Application / institution",
                    "Category / year",
                    "Stage / age",
                    "Next required action",
                    "Deadline subject",
                    "Responsible role / owner",
                  ].map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.items.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <CaseLink record={r} />
                      <Origin kind={r.recordOrigin} />
                    </td>
                    <td>
                      {readable(r.category)}
                      <small>{r.cycle}</small>
                    </td>
                    <td>
                      <Status value={r.state} />
                      <small>
                        Stage age:{" "}
                        {r.ageDays === null
                          ? "Not recorded"
                          : Math.floor(r.ageDays) + "d"}
                      </small>
                    </td>
                    <td>
                      {r.next.task}
                      <small>
                        Policy: {r.workflow.name} v{r.workflow.version}
                      </small>
                    </td>
                    <td>
                      <Due
                        due={r.dueAt}
                        urgency={r.urgency}
                        label={r.deadlineLabel}
                      />
                    </td>
                    <td>
                      {r.next.assignee ?? r.next.role}
                      <small>
                        {r.ownerName
                          ? r.next.role
                          : "No named eligible assignee"}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableRegion>
        ) : (
          <Blank>No matching cases in your authorized scope.</Blank>
        )}
        <div className="queue-pagination">
          <span>
            {total
              ? `${(page - 1) * limit + 1}–${Math.min(page * limit, total)}`
              : "0"}{" "}
            of {total} distinct cases · public reference profiles excluded
          </span>
          <label>
            Rows
            <select
              value={params.get("limit") ?? "15"}
              onChange={(e) => update("limit", e.target.value)}
            >
              {[10, 15, 25, 50].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            className="secondary"
            disabled={page <= 1}
            onClick={() => update("page", String(page - 1))}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            className="secondary"
            disabled={page * limit >= total}
            onClick={() => update("page", String(page + 1))}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </section>
    </>
  );
}
