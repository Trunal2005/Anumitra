import { Suspense, lazy, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { post, useData, date } from "./data.ts";
import { readable } from "../../../packages/contracts/presentation.ts";
import {
  Blank,
  Failure,
  PageTitle,
  Status,
  TableRegion,
} from "./workspace-ui.tsx";
const PdfPreview = lazy(() => import("./PdfPreview.tsx"));
function VersionPane({ title, version }: { title: string; version: any }) {
  return (
    <section className="evidence-version">
      <div className="surface-heading">
        <div>
          <h3>{title}</h3>
          <p>
            {version
              ? `v${version.number} · ${readable(version.reviewState)}`
              : "No accepted version"}
          </p>
        </div>
        {version && (
          <a
            className="task-link"
            href={`/api/documents/${version.id}/content?download=true`}
          >
            Download
          </a>
        )}
      </div>
      {version ? (
        <>
          <p className="fine-print">
            Valid through{" "}
            {version.validUntil
              ? date(version.validUntil) + " IST"
              : "no expiry recorded"}{" "}
            · Uploaded {date(version.createdAt)} IST
          </p>
          {version.mime === "application/pdf" ? (
            <Suspense fallback={<p role="status">Loading private preview…</p>}>
              <PdfPreview url={`/api/documents/${version.id}/content`} />
            </Suspense>
          ) : (
            <img
              className="document-preview"
              alt="Submitted private evidence"
              src={`/api/documents/${version.id}/content`}
            />
          )}
        </>
      ) : (
        <Blank>
          There is no accepted effective version. A submitted file is not
          acceptance.
        </Blank>
      )}
    </section>
  );
}
export default function EvidenceRegister() {
  const list = useData("documents", "/documents");
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [preview, setPreview] = useState(false);
  const q = useQueryClient();
  const rows = (list.data ?? []).filter(
    (d: any) =>
      (d.title + d.application.reference + d.application.institution.name)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!params.get("validity") ||
        d.compliance.status === params.get("validity")) &&
      (!params.get("review") ||
        d.compliance.submitted?.reviewState === params.get("review")),
  );
  const selected =
    rows.find((d: any) => d.id === params.get("selected")) ?? rows[0];
  const submitted = selected?.compliance.submitted,
    effective = selected?.compliance.effective;
  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    value ? p.set(key, value) : p.delete(key);
    setParams(p);
  };
  async function review(outcome: string) {
    if (!submitted) return;
    setBusy(true);
    try {
      await post(`/documents/${submitted.id}/review`, { outcome, reason });
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
        title="Evidence review"
        description="Compare the accepted effective file with the latest submission. Renewals require a separate official review."
      />
      <div className="evidence-workspace">
        <section className="ops-surface">
          <div className="queue-toolbar">
            <label className="field evidence-search">
              Find evidence
              <input
                placeholder="Search authorized documents…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="compact-field">
              Verification filter
              <select
                value={params.get("review") ?? ""}
                onChange={(e) => update("review", e.target.value)}
              >
                <option value="">All review states</option>
                {["PENDING", "ACCEPTED", "REJECTED"].map((s) => (
                  <option value={s} key={s}>
                    {readable(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="compact-field">
              Validity filter
              <select
                value={params.get("validity") ?? ""}
                onChange={(e) => update("validity", e.target.value)}
              >
                <option value="">All validity states</option>
                {[
                  "CURRENT",
                  "EXPIRED",
                  "EXPIRING",
                  "NO_ACCEPTED_VERSION",
                  "NO_EXPIRY_RECORDED",
                ].map((s) => (
                  <option value={s} key={s}>
                    {readable(s)}
                  </option>
                ))}
              </select>
            </label>
            <span className="fine-print">
              {rows.length} private documents · scoped workflow records
            </span>
          </div>
          <Failure error={list.error} />
          {list.isPending ? (
            <p role="status">Loading evidence register…</p>
          ) : rows.length ? (
            <TableRegion label="Private evidence register">
              <table className="ops-table">
                <thead>
                  <tr>
                    {[
                      "Document / institution",
                      "Case",
                      "Accepted effective",
                      "Latest submission",
                      "Effective expiry",
                      "Next action",
                    ].map((h) => (
                      <th scope="col" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d: any) => (
                    <tr
                      key={d.id}
                      className={d.id === selected?.id ? "selected" : ""}
                    >
                      <td>
                        <button
                          className="record-selector"
                          onClick={() => {
                            update("selected", d.id);
                            setReason("");
                            setError(null);
                            setPreview(false);
                          }}
                        >
                          {d.title}
                        </button>
                        <small>{d.application.institution.name}</small>
                      </td>
                      <td>
                        <Link
                          className="task-link"
                          to={"/applications/" + d.applicationId}
                        >
                          {d.application.reference}
                        </Link>
                        <small>{readable(d.kind)}</small>
                      </td>
                      <td>
                        {d.compliance.effective
                          ? "v" + d.compliance.effective.number
                          : "No accepted version"}
                        <small>Highest accepted version</small>
                      </td>
                      <td>
                        {d.compliance.submitted
                          ? "v" + d.compliance.submitted.number
                          : "No submitted file"}
                        <small>
                          {d.compliance.submitted
                            ? readable(d.compliance.submitted.reviewState)
                            : "Private bytes still required"}
                        </small>
                      </td>
                      <td>
                        <Status value={d.compliance.status} />
                        <small>
                          {d.compliance.effective?.validUntil
                            ? date(d.compliance.effective.validUntil) + " IST"
                            : "No accepted expiry recorded"}
                        </small>
                      </td>
                      <td>
                        {d.compliance.submitted?.reviewState === "PENDING"
                          ? "Authorized evidence verification"
                          : d.compliance.status === "EXPIRED"
                            ? "Institution renewal"
                            : "Monitor recorded validity"}
                        <button
                          className="secondary"
                          onClick={() => {
                            update("selected", d.id);
                            setPreview(false);
                          }}
                        >
                          Inspect document
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableRegion>
          ) : (
            <Blank>No documents match the selected filters.</Blank>
          )}
        </section>
        {selected && (
          <section
            className="ops-surface document-card selected-document"
            aria-label={"Selected document " + selected.title}
          >
            <div className="surface-heading">
              <div>
                <h2>{selected.title}</h2>
                <Link
                  className="task-link"
                  to={"/applications/" + selected.applicationId}
                >
                  {selected.application.reference} ·{" "}
                  {selected.application.institution.name}
                </Link>
              </div>
              <div className="button-row">
                <Status value={selected.compliance.status} />
                <Status value={submitted?.reviewState ?? "NOT_SUBMITTED"}>
                  Latest submission:{" "}
                  {submitted ? readable(submitted.reviewState) : "No file"}
                </Status>
              </div>
            </div>
            <div className="version-comparison">
              <div>
                <span>Accepted effective evidence</span>
                <strong>Effective v{effective?.number ?? "—"}</strong>
                <small>
                  {effective
                    ? "Accepted · " +
                      (effective.validUntil
                        ? date(effective.validUntil) + " IST"
                        : "No expiry recorded")
                    : "No accepted version"}
                </small>
              </div>
              <div>
                <span>Latest submitted evidence</span>
                <strong>
                  {submitted ? "v" + submitted.number : "No file submitted"}
                </strong>
                <small>
                  {selected.compliance.renewalPending
                    ? "Renewal pending verification"
                    : submitted?.reviewState === "REJECTED"
                      ? "Replacement rejected; accepted expiry remains in force"
                      : submitted
                        ? readable(submitted.reviewState)
                        : "Metadata only; bytes still required"}
                </small>
              </div>
            </div>
            <p className="meaning-note">
              Effective evidence is the highest accepted version. A pending or
              rejected replacement does not change its expiry. Expiry triggers
              follow-up; it does not revoke approval automatically.
            </p>
            <div className="button-row">
              <button
                className="secondary"
                onClick={() => setPreview(!preview)}
                aria-expanded={preview}
              >
                {preview ? "Hide comparison" : "Preview / compare files"}
              </button>
              {submitted && (
                <a
                  className="task-link"
                  href={`/api/documents/${submitted.id}/content`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open latest file
                </a>
              )}
              <span className="fine-print">
                {submitted?.scanState ?? "NO_FILE"} · Hash/file-type checks do
                not establish authenticity.
              </span>
            </div>
            {preview && (
              <div className="compare-previews">
                <VersionPane
                  title="Accepted effective version"
                  version={effective}
                />
                <VersionPane
                  title="Latest submitted version"
                  version={submitted}
                />
              </div>
            )}
            {selected.canReview && submitted?.reviewState === "PENDING" && (
              <form
                className="evidence-review-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void review("ACCEPTED");
                }}
              >
                <label className="field">
                  Verification reason
                  <textarea
                    required
                    minLength={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <div className="button-row">
                  <button className="primary" disabled={busy}>
                    Accept evidence
                  </button>
                  <button
                    className="secondary"
                    type="button"
                    disabled={busy || reason.trim().length < 5}
                    onClick={() => void review("REJECTED")}
                  >
                    Return evidence
                  </button>
                </div>
              </form>
            )}
            {selected.canUpload && (
              <Link
                className="task-link"
                to={"/applications/" + selected.applicationId}
              >
                Upload renewal / corrected evidence in case workspace
              </Link>
            )}
            <Failure error={error} />
            <details>
              <summary>
                Versions &amp; verification history ({selected.versions.length})
              </summary>
              {selected.versions.map((v: any) => (
                <div className="version-history-row" key={v.id}>
                  <strong>
                    v{v.number} ·{" "}
                    {v.id === effective?.id
                      ? "Effective"
                      : v.id === submitted?.id
                        ? "Latest submission"
                        : "Historical"}
                  </strong>
                  <Status value={v.reviewState} />
                  <span>{date(v.createdAt)} IST</span>
                  <a
                    className="task-link"
                    href={`/api/documents/${v.id}/content?download=true`}
                  >
                    Download version
                  </a>
                  <small>SHA-256: {v.hash}</small>
                  {v.reviews.map((r: any) => (
                    <p key={r.id}>
                      {readable(r.outcome)} · {r.reason} · {date(r.createdAt)}{" "}
                      IST
                    </p>
                  ))}
                </div>
              ))}
            </details>
          </section>
        )}
      </div>
    </>
  );
}
