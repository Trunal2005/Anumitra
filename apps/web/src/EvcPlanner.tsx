import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { post, useData, date } from "./data.ts";
import { urgency } from "../../../packages/contracts/urgency.ts";
import { readable } from "../../../packages/contracts/presentation.ts";
import {
  Blank,
  Drawer,
  Due,
  Failure,
  PageTitle,
  Status,
  TableRegion,
} from "./workspace-ui.tsx";
const iso = (s: string) => new Date(s + "+05:30").toISOString();
const local = (s: string) =>
  new Date(+new Date(s) + 19800000).toISOString().slice(0, 16);
function weekStart(s: string) {
  const d = new Date(
    new Date(+new Date(s) + 19800000).toISOString().slice(0, 10) + "T00:00:00Z",
  );
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}
export default function EvcPlanner({ user }: { user: any }) {
  const data = useData("evcPlanner", "/evc-planner");
  const q = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState("week");
  const [week, setWeek] = useState<string>();
  const [application, setApplication] = useState(
    params.get("application") ?? "",
  );
  const [reschedule, setReschedule] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const coordinator = user.grants.some((g: any) =>
    ["SUPERVISOR", "BUREAU"].includes(g.role),
  );
  const member = user.grants.some(
    (g: any) => g.role === "COMMITTEE" && g.committee === "EVC",
  );
  const queue = data.data?.queue ?? [];
  const visits = data.data?.visits ?? [];
  const selected = visits.find((v: any) => v.id === params.get("visit"));
  const schedulable = queue.filter((r: any) =>
    r.allowedActions.includes("assign"),
  );
  const appId = application || schedulable[0]?.id;
  const now = new Date(data.data?.now ?? new Date());
  const monday = weekStart(week ?? now.toISOString());
  const days = Array.from(
    { length: 7 },
    (_, i) => new Date(+monday + i * 86400000),
  );
  const eligible = (data.data?.participants ?? []).filter((p: any) =>
    p.applicationIds.includes(appId),
  );
  const conflicts =
    start && end
      ? (data.data?.reservations ?? []).filter(
          (r: any) =>
            participants.includes(r.userId) &&
            +new Date(r.startAt) < +new Date(iso(end)) &&
            +new Date(r.endAt) > +new Date(iso(start)) &&
            r.visitId !== reschedule,
        )
      : [];
  async function act(operation: string) {
    if (!selected) return;
    setBusy(true);
    try {
      await post(`/visits/${selected.id}/${operation}`, { reason });
      q.invalidateQueries();
      setError(null);
      setMessage(
        "Visit " +
          operation +
          " recorded with reservation and deadline history.",
      );
      setReason("");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const open = (id: string) => {
    const p = new URLSearchParams(params);
    p.set("visit", id);
    setParams(p);
    setReason("");
  };
  const card = (v: any) => (
    <button className="appointment-mini" key={v.id} onClick={() => open(v.id)}>
      <strong>{v.application.reference}</strong>
      <span>{v.metadata}</span>
      <small>{date(v.startAt)} IST</small>
      <Status value={v.state} />
    </button>
  );
  return (
    <>
      <PageTitle
        title="EVC planner"
        description="Eligible cases, stored availability and appointment/report deadlines. Times are shown in Asia/Kolkata."
      />
      <div className="workspace-disclosure">
        {data.data?.appointmentBasis ?? "Local prototype visit reservations"}.
        Scheduling, reporting, recommendation and final human decision remain
        separate.
      </div>
      <Failure error={data.error} />
      <div className="planner-grid">
        <section className="ops-surface planner-calendar">
          <div className="planner-toolbar">
            <div className="segmented">
              <button
                className={view === "week" ? "selected" : ""}
                onClick={() => setView("week")}
              >
                <CalendarDays size={16} />
                Week
              </button>
              <button
                className={view === "agenda" ? "selected" : ""}
                onClick={() => setView("agenda")}
              >
                <List size={16} />
                Accessible agenda
              </button>
            </div>
            {view === "week" && (
              <div className="button-row">
                <button
                  className="secondary"
                  aria-label="Previous week"
                  onClick={() =>
                    setWeek(new Date(+monday - 7 * 86400000).toISOString())
                  }
                >
                  <ChevronLeft size={16} />
                </button>
                <strong>
                  {monday.toLocaleDateString("en-IN", {
                    timeZone: "UTC",
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  –{" "}
                  {days[6].toLocaleDateString("en-IN", {
                    timeZone: "UTC",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
                <button
                  className="secondary"
                  aria-label="Next week"
                  onClick={() =>
                    setWeek(new Date(+monday + 7 * 86400000).toISOString())
                  }
                >
                  <ChevronRight size={16} />
                </button>
                <button className="ghost" onClick={() => setWeek(undefined)}>
                  This week
                </button>
              </div>
            )}
          </div>
          {data.isPending ? (
            <p role="status">Loading scoped appointments…</p>
          ) : view === "week" ? (
            <div
              className="calendar-scroll"
              role="region"
              aria-label="Expert visit week calendar"
              tabIndex={0}
            >
              <div className="week-grid">
                {days.map((day) => {
                  const key = day.toISOString().slice(0, 10);
                  const appointments = visits.filter(
                    (v: any) => local(v.startAt).slice(0, 10) === key,
                  );
                  return (
                    <section className="week-day" key={key}>
                      <h2>
                        {day.toLocaleDateString("en-IN", {
                          timeZone: "UTC",
                          weekday: "short",
                        })}
                        <strong>{day.getUTCDate()}</strong>
                      </h2>
                      {appointments.length ? (
                        appointments.map(card)
                      ) : (
                        <p className="fine-print">No stored appointment</p>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>
          ) : visits.length ? (
            <TableRegion label="Expert visit appointment agenda">
              <table className="ops-table">
                <thead>
                  <tr>
                    {[
                      "Case / venue",
                      "Appointment · IST",
                      "Status / report",
                      "Participants",
                      "",
                    ].map((h, i) => (
                      <th scope="col" key={i}>
                        {h || "View appointment"}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v: any) => (
                    <tr key={v.id}>
                      <td>
                        <Link
                          className="task-link"
                          to={"/applications/" + v.applicationId}
                        >
                          {v.application.reference}
                        </Link>
                        <small>{v.application.institution.name}</small>
                        <small>{v.metadata}</small>
                      </td>
                      <td>
                        {date(v.startAt)}
                        <small>Until {date(v.endAt)}</small>
                      </td>
                      <td>
                        <Status value={v.state} />
                        <small>
                          Report:{" "}
                          {v.report
                            ? "Submitted; completion status above"
                            : "Not submitted"}
                        </small>
                        <small>
                          Report due{" "}
                          {v.reportDueAt ? date(v.reportDueAt) : "Not recorded"}
                        </small>
                      </td>
                      <td>
                        {v.participantNames.join(", ") ||
                          "No active participants"}
                      </td>
                      <td>
                        <button
                          className="secondary"
                          onClick={() => open(v.id)}
                        >
                          View appointment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableRegion>
          ) : (
            <Blank>No stored visits in your authorized scope.</Blank>
          )}
        </section>
        <section className="ops-surface scheduling-backlog">
          <h2>Eligible queue</h2>
          <p className="fine-print">
            {queue.length} EVC-stage cases. Cancelled visits do not clear the
            scheduling backlog.
          </p>
          {queue.length ? (
            queue.map((a: any) => {
              const active = visits.filter(
                (v: any) => v.applicationId === a.id && v.state !== "CANCELLED",
              );
              return (
                <div className="eligible-case" key={a.id}>
                  <Link className="case-link" to={"/applications/" + a.id}>
                    <strong>{a.reference}</strong>
                    <span>{a.institution.name}</span>
                  </Link>
                  <Status value={a.category} />
                  <Due
                    due={a.next.due ?? a.dueAt}
                    urgency={urgency(a.next.due ?? a.dueAt, now)}
                    label={
                      active.length
                        ? active.map((v: any) => readable(v.state)).join(", ")
                        : "Scheduling deadline"
                    }
                  />
                  {coordinator && a.allowedActions.includes("assign") && (
                    <button
                      className="secondary"
                      onClick={() => {
                        setApplication(a.id);
                        setReschedule("");
                        setParticipants([]);
                        formRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }}
                    >
                      Schedule
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <Blank>No EVC-stage cases await coordination.</Blank>
          )}
        </section>
      </div>
      {coordinator && (
        <section className="ops-surface">
          <div className="surface-heading">
            <div>
              <h2>
                {reschedule ? "Reschedule appointment" : "Schedule a visit"}
              </h2>
              <p>
                One eligible available member is a DEMO assumption, not a
                statutory quorum.
              </p>
            </div>
          </div>
          <form
            ref={formRef}
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const f = new FormData(e.currentTarget);
              try {
                const visit = await post(`/applications/${appId}/visits`, {
                  mode: f.get("mode"),
                  startAt: iso(start),
                  endAt: iso(end),
                  participants,
                  metadata: f.get("metadata"),
                  reason: f.get("reason"),
                  ...(reschedule ? { visitId: reschedule } : {}),
                });
                q.invalidateQueries();
                setError(null);
                setMessage(
                  "Reservation saved. Confirm the proposed visit separately.",
                );
                setWeek(iso(start));
                open(visit.id);
              } catch (e) {
                setError(e);
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="planner-form-grid">
              <label className="field">
                Application
                <select
                  value={appId ?? ""}
                  onChange={(e) => {
                    setApplication(e.target.value);
                    setParticipants([]);
                  }}
                  required
                >
                  {schedulable.map((a: any) => (
                    <option value={a.id} key={a.id}>
                      {a.reference} · {a.institution.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Mode
                <select name="mode">
                  <option>PHYSICAL</option>
                  <option>ONLINE</option>
                  <option>HYBRID</option>
                </select>
              </label>
              <label className="field">
                Start (IST)
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                End (IST)
                <input
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </label>
            </div>
            <fieldset className="participant-selector">
              <legend>Eligible participants and recorded availability</legend>
              {eligible.length ? (
                eligible.map((p: any) => (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      aria-label={p.name}
                      checked={participants.includes(p.id)}
                      onChange={(e) =>
                        setParticipants(
                          e.target.checked
                            ? [...participants, p.id]
                            : participants.filter((id) => id !== p.id),
                        )
                      }
                    />
                    <span>
                      {p.name}
                      <small>
                        {data.data.availability
                          .filter((a: any) => a.userId === p.id)
                          .map(
                            (a: any) =>
                              date(a.startAt) + " – " + date(a.endAt) + " IST",
                          )
                          .join("; ") || "No availability declared"}
                      </small>
                    </span>
                  </label>
                ))
              ) : (
                <p>No eligible active EVC participant found for this case.</p>
              )}
            </fieldset>
            {!!conflicts.length && (
              <div className="error" role="alert">
                Scheduling conflict: {conflicts.length} overlapping active
                reservation(s). Choose another time or participant. The server
                rechecks availability and locks reservations.
              </div>
            )}
            <div className="form-grid">
              <label className="field">
                Venue / meeting metadata
                <input name="metadata" required minLength={3} />
              </label>
              <label className="field">
                Scheduling / rescheduling reason
                <input name="reason" required minLength={5} />
              </label>
            </div>
            <button
              className="primary"
              disabled={busy || !appId || !participants.length}
            >
              {busy ? "Saving…" : "Propose visit"}
            </button>
            {reschedule && (
              <button
                className="ghost"
                type="button"
                onClick={() => setReschedule("")}
              >
                Cancel rescheduling
              </button>
            )}
          </form>
        </section>
      )}
      {member && (
        <section className="ops-surface">
          <h2>Declare your availability</h2>
          <form
            className="availability-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await post("/availability", {
                  startAt: iso(String(f.get("start"))),
                  endAt: iso(String(f.get("end"))),
                });
                q.invalidateQueries();
                setError(null);
                setMessage("Availability recorded.");
              } catch (e) {
                setError(e);
              }
            }}
          >
            <label className="field">
              Available from (IST)
              <input name="start" type="datetime-local" required />
            </label>
            <label className="field">
              Available until (IST)
              <input name="end" type="datetime-local" required />
            </label>
            <button className="secondary">Save availability</button>
          </form>
        </section>
      )}
      <Failure error={error} />
      {message && (
        <p className="success" role="status">
          {message}
        </p>
      )}
      <Drawer
        open={!!selected}
        onClose={() => {
          const p = new URLSearchParams(params);
          p.delete("visit");
          setParams(p);
        }}
        title="Expert visit details"
      >
        {selected && (
          <div className="visit-card">
            <Link
              className="case-link"
              to={"/applications/" + selected.applicationId}
            >
              <strong>{selected.application.reference}</strong>
              <span>{selected.application.institution.name}</span>
            </Link>
            <h3>{selected.metadata}</h3>
            <Status value={selected.state} />
            <dl className="detail-facts">
              <div>
                <dt>Appointment</dt>
                <dd>
                  {date(selected.startAt)} – {date(selected.endAt)} IST
                </dd>
              </div>
              <div>
                <dt>Report due</dt>
                <dd>
                  {selected.reportDueAt
                    ? date(selected.reportDueAt) + " IST"
                    : "Not recorded"}
                </dd>
              </div>
              <div>
                <dt>Active participants</dt>
                <dd>{selected.participantNames.join(", ") || "None"}</dd>
              </div>
              <div>
                <dt>Mode / recorded reason</dt>
                <dd>
                  {selected.mode} · {selected.reason}
                </dd>
              </div>
            </dl>
            {selected.report && (
              <blockquote>
                <strong>Submitted report</strong>
                <p>{selected.report}</p>
              </blockquote>
            )}
            {(selected.canCoordinate || selected.canReport) &&
              !["COMPLETED", "CANCELLED"].includes(selected.state) && (
                <>
                  <label className="field">
                    {selected.canReport && selected.state === "CONFIRMED"
                      ? "Report / reason"
                      : "Recorded reason"}
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      minLength={5}
                    />
                  </label>
                  <div className="button-row">
                    {selected.canCoordinate &&
                      ["PROPOSED", "RESCHEDULED"].includes(selected.state) && (
                        <button
                          className="secondary"
                          disabled={busy || reason.trim().length < 5}
                          onClick={() => void act("confirm")}
                        >
                          Confirm visit
                        </button>
                      )}
                    {selected.canReport &&
                      selected.state === "CONFIRMED" &&
                      selected.reservations.some(
                        (r: any) => r.userId === user.id && r.active,
                      ) && (
                        <button
                          className="primary"
                          disabled={busy || reason.trim().length < 5}
                          onClick={() => void act("report")}
                        >
                          Submit report
                        </button>
                      )}
                    {selected.canCoordinate &&
                      selected.state === "REPORT_PENDING" && (
                        <button
                          className="primary"
                          disabled={busy || reason.trim().length < 5}
                          onClick={() => void act("complete")}
                        >
                          Accept completion report
                        </button>
                      )}
                    {selected.canCoordinate && (
                      <>
                        <button
                          className="secondary"
                          onClick={() => {
                            setApplication(selected.applicationId);
                            setReschedule(selected.id);
                            setStart(local(selected.startAt));
                            setEnd(local(selected.endAt));
                            setParticipants(
                              selected.reservations
                                .filter((r: any) => r.active)
                                .map((r: any) => r.userId),
                            );
                            const p = new URLSearchParams(params);
                            p.delete("visit");
                            setParams(p);
                            formRef.current?.scrollIntoView({
                              behavior: "smooth",
                            });
                          }}
                        >
                          Reschedule
                        </button>
                        <button
                          className="ghost"
                          disabled={busy || reason.trim().length < 5}
                          onClick={() => void act("cancel")}
                        >
                          Cancel appointment
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            <Failure error={error} />
            <p className="fine-print">
              Report submission, completion acceptance and committee
              recommendation are separate recorded actions.
            </p>
            <details>
              <summary>Previous appointment dates</summary>
              {selected.history.length ? (
                selected.history.map((h: any, i: number) => (
                  <p key={i}>
                    {date(h.startAt)} – {date(h.endAt)} IST · {h.reason}
                  </p>
                ))
              ) : (
                <p>No previous appointment dates recorded.</p>
              )}
            </details>
          </div>
        )}
      </Drawer>
    </>
  );
}
