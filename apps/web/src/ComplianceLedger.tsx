import { type ComponentType, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useData, date } from "./data.ts";
import { urgency } from "../../../packages/contracts/urgency.ts";
import {
  Blank,
  Due,
  Failure,
  PageTitle,
  Status,
  TableRegion,
} from "./workspace-ui.tsx";
// The same verified undertaking action form is mounted for the selected ledger row.
export default function ComplianceLedger({
  user,
  Review,
}: {
  user: any;
  Review: ComponentType<{ o: any; user: any }>;
}) {
  const list = useData("obligations", "/obligations");
  const options = useData("options", "/options");
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const view = params.get("view") ?? "all";
  const now = new Date(options.data?.now ?? new Date());
  const closed = (o: any) => ["ACCEPTED", "WAIVED"].includes(o.state);
  const rows = (list.data ?? []).filter(
    (o: any) =>
      (o.condition + o.application.reference + o.application.institution.name)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (view !== "closed" || closed(o)) &&
      (view !== "review" || o.state === "SUBMITTED") &&
      (view !== "overdue" || (!closed(o) && +new Date(o.dueAt) < +now)) &&
      (view !== "soon" ||
        (!closed(o) &&
          +new Date(o.dueAt) >= +now &&
          +new Date(o.dueAt) <= +now + 7 * 86400000)),
  );
  const selected =
    rows.find((o: any) => o.id === params.get("selected")) ?? rows[0];
  return (
    <>
      <PageTitle
        title="Compliance ledger"
        description="Decision-linked conditions, original deadlines and separate evidence submission and acceptance."
      />
      <section className="ops-surface">
        <div className="queue-tabs">
          {[
            ["all", "All conditions"],
            ["soon", "Due soon"],
            ["overdue", "Overdue"],
            ["review", "Submitted for review"],
            ["closed", "Closed"],
          ].map(([key, title]) => (
            <button
              key={key}
              className={view === key ? "selected" : ""}
              onClick={() => setParams(key === "all" ? {} : { view: key })}
            >
              {title}
            </button>
          ))}
        </div>
        <div className="queue-toolbar">
          <label className="field ledger-search">
            Find a condition
            <input
              placeholder="Search condition, reference or institution"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <span className="fine-print">
            {rows.length} conditions · one decision may create follow-up work
          </span>
        </div>
        <Failure error={list.error} />
        {list.isPending ? (
          <p role="status">Loading scoped conditions…</p>
        ) : rows.length ? (
          <TableRegion label="Decision-linked compliance conditions">
            <table className="ops-table">
              <thead>
                <tr>
                  {[
                    "Condition / decision",
                    "Responsible institution",
                    "Original / current due",
                    "Evidence / review",
                    "Next action",
                    "Escalation",
                    "",
                  ].map((h, i) => (
                    <th scope="col" key={i}>
                      {h || "Review condition"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((o: any) => (
                  <tr
                    key={o.id}
                    className={o.id === selected?.id ? "selected" : ""}
                  >
                    <td>
                      <strong>{o.condition}</strong>
                      <small>
                        <Link
                          className="task-link"
                          to={"/applications/" + o.applicationId}
                        >
                          {o.application.reference}
                        </Link>
                      </small>
                      <small>Decision {o.decisionId}</small>
                    </td>
                    <td>{o.application.institution.name}</td>
                    <td>
                      <Due
                        due={o.dueAt}
                        urgency={
                          closed(o)
                            ? { key: "CLOSED", label: "Closed" }
                            : urgency(o.dueAt, now)
                        }
                      />
                      {o.originalDueAt !== o.dueAt && (
                        <small>Originally {date(o.originalDueAt)} IST</small>
                      )}
                    </td>
                    <td>
                      <Status value={o.state} />
                      <small>
                        {o.state === "SUBMITTED"
                          ? "Submitted evidence still requires authorized acceptance."
                          : closed(o)
                            ? "Closed with recorded evidence/history."
                            : "Institution evidence required."}
                      </small>
                    </td>
                    <td>
                      {closed(o)
                        ? "No open compliance action"
                        : o.state === "SUBMITTED"
                          ? "Authorized reviewer to verify"
                          : "Institution to submit evidence"}
                    </td>
                    <td>
                      <Status value={o.escalationState ?? "NONE"}>
                        {o.escalationState ?? "No recorded event"}
                      </Status>
                    </td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() => {
                          const p = new URLSearchParams(params);
                          p.set("selected", o.id);
                          setParams(p);
                        }}
                      >
                        Review condition
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableRegion>
        ) : (
          <Blank>
            No conditions match this view. Closed conditions remain available in
            the Closed view.
          </Blank>
        )}
      </section>
      {selected && (
        <div className="ledger-selected" aria-label="Selected condition">
          <Review key={selected.id} o={selected} user={user} />
        </div>
      )}
    </>
  );
}
