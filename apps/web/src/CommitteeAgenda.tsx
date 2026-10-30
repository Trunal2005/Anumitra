import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api, useData, date } from "./data.ts";
import { readable } from "../../../packages/contracts/presentation.ts";
import {
  Blank,
  CaseLink,
  Due,
  Failure,
  PageTitle,
  SelectedPanel,
  Status,
  TableRegion,
} from "./workspace-ui.tsx";
export default function CommitteeAgenda() {
  const query = useData("committeeAgenda", "/committee-agenda");
  const [params, setParams] = useSearchParams();
  const [outcome, setOutcome] = useState("ACCEPTED");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const q = useQueryClient();
  const items = query.data?.items ?? [];
  const selected =
    items.find((r: any) => r.id === params.get("selected")) ?? items[0];
  const detail = useData(
    "agendaCase",
    "/applications/" + (selected?.id ?? ""),
    !!selected,
  );
  const record = detail.data;
  async function act(command: string) {
    if (!record) return;
    setBusy(true);
    try {
      await api(`/applications/${record.id}/commands`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          command,
          expectedVersion: record.version,
          reason,
          ...(command === "record-recommendation" ? { outcome } : {}),
        }),
      });
      setReason("");
      setError(null);
      q.invalidateQueries();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Committee agenda"
        description="Assigned-case consideration, report readiness and recommendations for the current stage attempt."
      />
      <div className="workspace-disclosure">
        {query.data?.meetingModel ?? "No meeting/session records are inferred."}{" "}
        Final decisions remain with the competent authority.
      </div>
      <Failure error={query.error} />
      <div className="ops-split agenda-layout">
        <section className="ops-surface">
          <div className="surface-heading">
            <h2>Assigned cases · {items.length}</h2>
            <span className="fine-print">
              Current scoped assignment or active visit participation
            </span>
          </div>
          {query.isPending ? (
            <p role="status">Loading assigned agenda…</p>
          ) : items.length ? (
            <TableRegion label="Assigned committee cases">
              <table className="ops-table">
                <thead>
                  <tr>
                    {[
                      "Case",
                      "Readiness",
                      "Recommendation",
                      "Due / action",
                    ].map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((r: any) => (
                    <tr
                      key={r.id}
                      className={r.id === selected?.id ? "selected" : ""}
                    >
                      <td>
                        <CaseLink record={r} />
                        <Status value={r.state} />
                      </td>
                      <td>
                        {
                          r.evidence.filter(
                            (d: any) => d.reviewState === "ACCEPTED",
                          ).length
                        }
                        /{r.evidence.length} latest versions accepted
                        <small>
                          {r.visits.length
                            ? r.visits
                                .map((v: any) => readable(v.state))
                                .join(", ")
                            : "No visit record"}
                        </small>
                        <small>
                          {r.blockers.length
                            ? r.blockers.length + " recorded blockers"
                            : "Evidence checks clear"}
                        </small>
                      </td>
                      <td>
                        <Status
                          value={
                            r.currentRecommendations.length
                              ? "ACCEPTED"
                              : "PENDING"
                          }
                        >
                          {r.currentRecommendations.length
                            ? "Recorded this attempt"
                            : "Not recorded this attempt"}
                        </Status>
                        <small>Attempt {r.attemptId ?? "not recorded"}</small>
                      </td>
                      <td>
                        <Due due={r.dueAt} urgency={r.urgency} />
                        <button
                          className="secondary"
                          onClick={() => setParams({ selected: r.id })}
                        >
                          Consider case
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableRegion>
          ) : (
            <Blank>
              No assigned cases or active visit participation in your scope.
            </Blank>
          )}
        </section>
        {selected && (
          <SelectedPanel title={"Consider " + selected.reference}>
            <CaseLink record={selected} />
            <dl className="detail-facts">
              <div>
                <dt>Pinned policy</dt>
                <dd>
                  {selected.workflow.name} v{selected.workflow.version}
                </dd>
              </div>
              <div>
                <dt>Current responsibility</dt>
                <dd>{selected.ownerName ?? selected.next.role}</dd>
              </div>
              <div>
                <dt>Current stage attempt</dt>
                <dd>{selected.attemptId ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Visit / report context</dt>
                <dd>
                  {selected.visits.length
                    ? selected.visits
                        .map(
                          (v: any) =>
                            readable(v.state) +
                            (v.hasReport
                              ? " · report submitted"
                              : " · report absent"),
                        )
                        .join("; ")
                    : "No stored visit context"}
                </dd>
              </div>
            </dl>
            <h3>Evidence available for consideration</h3>
            {selected.evidence.map((d: any) => (
              <div className="agenda-evidence" key={d.id}>
                <span>
                  <strong>{d.title}</strong>
                  <small>
                    Latest v{d.submittedVersion ?? "not submitted"} ·{" "}
                    {readable(d.reviewState)}
                  </small>
                </span>
                {d.submittedId && (
                  <a
                    className="task-link"
                    href={`/api/documents/${d.submittedId}/content`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open evidence
                  </a>
                )}
              </div>
            ))}
            <div className="blocker-box">
              <h3>Current blockers</h3>
              {selected.blockers.length ? (
                <ul>
                  {selected.blockers.map((b: string) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  No evidence blockers reported. A separate current-attempt
                  recommendation and guarded stage completion are still
                  required.
                </p>
              )}
            </div>
            {record?.allowedActions.includes("record-recommendation") && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act("record-recommendation");
                }}
              >
                <h3>Record a recommendation</h3>
                <label className="field">
                  Recommendation outcome
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                  >
                    <option value="ACCEPTED">Recommend acceptance</option>
                    <option value="REJECTED">
                      Record adverse recommendation
                    </option>
                  </select>
                </label>
                <label className="field">
                  Recommendation / completion reason
                  <textarea
                    required
                    minLength={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <div className="button-row">
                  <button className="primary" disabled={busy}>
                    Record recommendation
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    disabled={
                      busy ||
                      reason.trim().length < 5 ||
                      !selected.currentRecommendations.length ||
                      !!selected.blockers.length
                    }
                    onClick={() => void act("complete-stage")}
                  >
                    Complete committee stage
                  </button>
                </div>
              </form>
            )}
            <Failure error={error ?? detail.error} />
            <div className="button-row">
              <Link className="secondary" to={"/applications/" + selected.id}>
                Open case review
              </Link>
              {selected.visits.length > 0 && (
                <Link
                  className="secondary"
                  to={"/evc?visit=" + selected.visits[0].id}
                >
                  Visit / report actions
                </Link>
              )}
            </div>
            <details>
              <summary>
                Previous recommendations and attempt context (
                {selected.recommendations.length})
              </summary>
              {selected.recommendations.map((r: any) => (
                <article className="recommendation-history" key={r.id}>
                  <Status value={r.outcome} />
                  <p>{r.reason}</p>
                  <small>
                    {r.actorName} · {readable(r.stage)} · attempt{" "}
                    {r.attemptId ?? "not recorded"} · {date(r.createdAt)} IST
                  </small>
                  <small>
                    Evidence-version snapshot at recommendation: not stored. The
                    final decision packet retains its exact reviewed versions.
                  </small>
                </article>
              ))}
            </details>
          </SelectedPanel>
        )}
      </div>
    </>
  );
}
