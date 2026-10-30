import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, ExternalLink } from "lucide-react";
import { useData } from "./data.ts";
import {
  Blank,
  Failure,
  PageTitle,
  SourceLink,
  Status,
  TableRegion,
} from "./workspace-ui.tsx";
export default function PublicReferences() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const result = useData(
    "publicReferences",
    "/reference/institutions?" + new URLSearchParams({ q: search, year }),
  );
  const profiles = result.data?.profiles ?? [];
  const profile =
    profiles.find((p: any) => p.id === params.get("selected")) ?? profiles[0];
  return (
    <>
      <PageTitle
        title="Public institution references"
        description="Read-only published facts, clearly separated from fictional workflow records and any authorized pilot data."
      />
      <div className="reference-notice">
        <BookOpen size={22} />
        <div>
          <strong>Historical reference collection · 2025–26</strong>
          <p>
            These letters do not establish current-year approval. No operational
            application, EVC visit, lease expiry or compliance finding is
            inferred. Public profiles are excluded from all operational counts.
          </p>
        </div>
        <Status value="PENDING">Team human sign-off pending</Status>
      </div>
      <div className="reference-layout">
        <section className="ops-surface">
          <h2>Institution inventory</h2>
          <label className="field">
            Find a public reference
            <input
              placeholder="Institution name or permanent ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="field">
            Historical academic year
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">All published years in collection</option>
              <option value="2025-26">2025–26</option>
              <option value="2026-27">2026–27 (no verified entries)</option>
            </select>
          </label>
          <p className="fine-print">
            {profiles.length} public profiles · no operational master import
          </p>
          <Failure error={result.error} />
          {result.isPending ? (
            <p role="status">Loading source-linked references…</p>
          ) : profiles.length ? (
            profiles.map((p: any) => (
              <button
                className={
                  "reference-choice " + (profile?.id === p.id ? "selected" : "")
                }
                key={p.id}
                onClick={() => setParams({ selected: p.id })}
              >
                <strong>{p.name}</strong>
                <span>Historical year {p.academicYear}</span>
                <small>
                  {p.facts.find((f: any) => f.key === "permanentId")?.value}
                </small>
              </button>
            ))
          ) : (
            <Blank>
              No source-reviewed profile for this filter. Missing entries are
              not manufactured.
            </Blank>
          )}
        </section>
        {profile && (
          <section className="ops-surface">
            <div className="surface-heading">
              <div>
                <h2>{profile.name}</h2>
                <p>
                  Historical academic year {profile.academicYear} ·
                  PUBLIC_REFERENCE · read-only
                </p>
              </div>
              <SourceLink url={profile.identityUrl}>
                Publisher identity page
              </SourceLink>
            </div>
            <p className="meaning-note">{profile.warning}</p>
            <p className="fine-print">{profile.coverage}</p>
            <TableRegion label="Field-level public reference provenance">
              <table className="ops-table reference-facts">
                <thead>
                  <tr>
                    {[
                      "Published fact",
                      "Value for this year",
                      "Source / provenance",
                    ].map((h) => (
                      <th scope="col" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profile.facts.map((f: any) => (
                    <tr key={f.key}>
                      <th scope="row">{f.label}</th>
                      <td>{f.value}</td>
                      <td>
                        <SourceLink url={f.source.url + "#page=1"}>
                          View source · page 1
                        </SourceLink>
                        <small>{f.source.publisher}</small>
                        <small>
                          Document date: {f.source.documentDate} · Year:{" "}
                          {f.source.academicYear}
                        </small>
                        <small>
                          Retrieved {f.source.retrievedOn} · {f.source.location}
                        </small>
                        <details>
                          <summary>Extraction and review details</summary>
                          <p>{f.source.extractionMethod}</p>
                          <p>
                            Source comparison: text and rendered page checked.
                            Human review: team sign-off pending.
                          </p>
                          <p className="checksum">
                            Retrieved-file SHA-256: {f.source.sha256}
                          </p>
                          <p>{f.source.redistribution}</p>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableRegion>
            <p className="fine-print">
              This collection grants no permissions and creates no approval
              decisions or compliance findings. The local fictional simulator
              remains a separate adapter; no live AICTE contract is installed.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
