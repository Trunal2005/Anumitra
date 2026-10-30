import React, {
  useState,
  useEffect,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  FileCheck2,
  FileText,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  CalendarDays,
  TriangleAlert,
  Workflow,
} from "lucide-react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./styles.css";
import "./operations.css";
import ActionDesk from "./ActionDesk.tsx";
import PublicReferences from "./PublicReferences.tsx";
import ReviewQueue from "./ReviewQueue.tsx";
import CommitteeAgenda from "./CommitteeAgenda.tsx";
import ComplianceLedger from "./ComplianceLedger.tsx";
import EvidenceRegister from "./EvidenceRegister.tsx";
import EvcPlanner from "./EvcPlanner.tsx";
import { Status, Origin } from "./workspace-ui.tsx";
import {
  readable,
  reportHeading,
  reportValue,
} from "../../../packages/contracts/presentation.ts";
const PdfPreview = React.lazy(() => import("./PdfPreview.tsx"));
import { api, post, client, useData, date, label } from "./data.ts";
function Brand() {
  return (
    <Link to="/" className="brand">
      <img src="/brand.svg" alt="" />
      <span>
        Anumitra<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
function Badge({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <span className={"badge " + (active ? "active" : "")}>{children}</span>
  );
}
function Empty({
  children = "No records in your current scope.",
}: {
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <FolderOpen size={30} />
      <p>{children}</p>
    </div>
  );
}
function ErrorBox({ error }: { error: unknown }) {
  return error ? (
    <div role="alert" className="error">
      <TriangleAlert size={16} />
      {error instanceof Error ? error.message : String(error)}
    </div>
  ) : null;
}
function Loading() {
  return (
    <div role="status" className="skeleton">
      Loading authorized records…
    </div>
  );
}
function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={"panel " + className}>{children}</section>;
}
function Heading({
  eyebrow,
  title,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>
          {title} <span className="gradient">{accent}</span>
        </h1>
      </div>
      {children}
    </div>
  );
}
function Field({ title, children }: { title: string; children: ReactNode }) {
  const labelId = React.useId();
  const nodes = React.Children.toArray(children);
  const helpIds = nodes.flatMap((child, index) =>
    React.isValidElement(child) && child.type === "small"
      ? [labelId + "-help-" + index]
      : [],
  );
  return (
    <label className="field">
      <span id={labelId}>{title}</span>
      {nodes.map((child, index) => {
        if (!React.isValidElement(child)) return child;
        const element = child as React.ReactElement<Record<string, unknown>>;
        if (child.type === "small")
          return React.cloneElement(element, {
            id: labelId + "-help-" + index,
          });
        if (
          typeof child.type === "string" &&
          ["input", "select", "textarea"].includes(child.type)
        )
          return React.cloneElement(element, {
            ...(element.props["aria-label"] || element.props["aria-labelledby"]
              ? {}
              : { "aria-labelledby": labelId }),
            ...(helpIds.length
              ? {
                  "aria-describedby": [
                    element.props["aria-describedby"],
                    ...helpIds,
                  ]
                    .filter(Boolean)
                    .join(" "),
                }
              : {}),
          });
        return child;
      })}
    </label>
  );
}

function Orb() {
  return (
    <div
      className="orb-scene"
      aria-label="Illustration of connected approval stages"
    >
      <div className="orb-halo" />
      <div className="orb">
        <img src="/brand.svg" alt="" />
        <span>CONNECTED BY DESIGN</span>
        <div className="orbit outer" />
        <div className="orbit inner" />
      </div>
      <div className="float-card float-a">
        <span className="mini-icon">
          <ShieldCheck />
        </span>
        <div>
          <strong>Evidence, accounted for.</strong>
          <small>Private versions. Human verification.</small>
        </div>
        <Check size={17} />
      </div>
      <div className="float-card float-b">
        <GitBranch size={18} />
        <div>
          <strong>One connected journey</strong>
          <small>Scrutiny → EVC → Decision</small>
        </div>
      </div>
      <div className="float-card float-c">
        <Clock size={18} />
        <div>
          <strong>Nothing falls through.</strong>
          <small>Obligations stay in view.</small>
        </div>
      </div>
      <div className="illustration-label">
        WORKFLOW ILLUSTRATION · NO LIVE DATA
      </div>
    </div>
  );
}
function Welcome({
  onLogin,
  motion,
  setMotion,
}: {
  onLogin: () => void;
  motion: boolean;
  setMotion: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("institution.a@anumitra.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState(
    new URLSearchParams(location.search).has("recovery") ? "reset" : "login",
  );
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === "login") {
        await post("/login", { email, password });
        onLogin();
      } else if (mode === "recover") {
        const r = await post("/recovery", { email });
        setMessage(r.message);
      } else {
        await post("/recovery/reset", {
          token: new URLSearchParams(location.search).get("recovery"),
          password,
        });
        setMessage("Password updated. Sign in with your new password.");
        setMode("login");
      }
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="welcome">
      <div className="grid-backdrop" />
      <header className="welcome-nav">
        <Brand />
        <span className="nav-descriptor">
          APPROVAL & COMPLIANCE ORCHESTRATION
        </span>
        <button
          className="ghost icon-button"
          onClick={() => setMotion(!motion)}
          aria-label={motion ? "Pause motion" : "Enable motion"}
        >
          {motion ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </header>
      <main className="hero">
        <div className="hero-copy">
          <Badge>
            <span className="tiny-dot" />
            INDEPENDENT STUDENT PROTOTYPE · SIH26262
          </Badge>
          <h1>
            Every approval.
            <br />
            Every obligation.
            <br />
            <span className="gradient">Accounted for.</span>
          </h1>
          <p className="hero-description">
            A clearer path from application to accountability. Bring your
            approval workflows, evidence and deadlines into one connected
            workspace.
          </p>
          <div className="hero-features">
            <span>
              <GitBranch size={16} /> Guided workflows
            </span>
            <span>
              <ShieldCheck size={16} /> Traceable decisions
            </span>
            <span>
              <Bell size={16} /> Timely follow-up
            </span>
          </div>
          <Panel className="login-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">YOUR WORK STARTS HERE</p>
                <h2>
                  {mode === "login"
                    ? "Welcome back"
                    : mode === "recover"
                      ? "Recover access"
                      : "Choose a new password"}
                </h2>
              </div>
              <ArrowUpRight size={24} />
            </div>
            <form onSubmit={submit}>
              {mode !== "reset" && (
                <Field title="Email address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </Field>
              )}
              {mode !== "recover" && (
                <Field
                  title={
                    mode === "reset"
                      ? "New password (12+ characters)"
                      : "Password"
                  }
                >
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === "reset" ? 12 : 1}
                    autoComplete={
                      mode === "reset" ? "new-password" : "current-password"
                    }
                  />
                </Field>
              )}
              <ErrorBox error={error} />
              {message && <p role="status">{message}</p>}
              <button className="primary full" disabled={pending}>
                {pending
                  ? "Working…"
                  : mode === "login"
                    ? "Enter your workspace"
                    : mode === "recover"
                      ? "Send to local Mailpit"
                      : "Reset password"}
                <ArrowRight size={18} />
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "recover" : "login");
                  setMessage("");
                  setError(null);
                }}
              >
                {mode === "login" ? "Forgot your password?" : "Back to sign in"}
              </button>
            </form>
            <p className="fine-print">
              Local demo credentials are in{" "}
              <code>.local/demo-credentials.json</code>. No external email
              delivery.
            </p>
          </Panel>
        </div>
        <Orb />
      </main>
      <footer className="welcome-footer">
        <span>
          <Shield size={15} /> Human oversight. Clear accountability.
        </span>
        <span>
          Built for SIH26262 · No official AICTE endorsement or integration
        </span>
      </footer>
    </div>
  );
}
const nav = [
  ["/overview", "Action desk", LayoutDashboard],
  ["/applications", "Applications", FolderOpen],
  ["/evc", "EVC planner", CalendarDays],
  ["/committees", "Committee agenda", Users],
  ["/compliance", "Compliance ledger", FileCheck2],
  ["/documents", "Evidence review", FileText],
  ["/alerts", "Alerts & delivery", Bell],
  ["/reports", "Reports & audit", Activity],
  ["/references", "Public references", BookOpen],
  ["/rules", "Workflow policies", GitBranch],
  ["/admin", "Administration", Settings2],
] as const;
function App() {
  const q = useQueryClient();
  const session = useData("session", "/session");
  const [motion, setMotion] = useState(
    localStorage.getItem("motion") !== "paused",
  );
  const [connected, setConnected] = useState("Connecting");
  const [refresh, setRefresh] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    document.documentElement.dataset.motion = motion ? "on" : "off";
    localStorage.setItem("motion", motion ? "on" : "paused");
  }, [motion]);
  useEffect(() => {
    if (!session.data?.user || !refresh) {
      setConnected("Paused");
      return;
    }
    let revision = "";
    const events = new EventSource("/api/events");
    events.addEventListener("ready", () => setConnected("Updates connected"));
    events.addEventListener("refresh", (e) => {
      setConnected("Updates connected");
      const d = JSON.parse((e as MessageEvent).data);
      const next = d.revision + ":" + d.count;
      if (next !== revision)
        q.invalidateQueries({
          predicate: (x) =>
            !["session", "options"].includes(String(x.queryKey[0])),
        });
      revision = next;
    });
    events.addEventListener("expired", () => {
      q.clear();
      q.invalidateQueries();
      events.close();
    });
    events.onerror = () => setConnected("Reconnecting");
    const fallback = setInterval(() => {
      if (events.readyState !== EventSource.OPEN)
        q.invalidateQueries({ predicate: (x) => x.queryKey[0] !== "session" });
    }, 15000);
    return () => {
      events.close();
      clearInterval(fallback);
    };
  }, [session.data?.user?.id, refresh]);
  if (session.isPending) return <Loading />;
  if (session.error)
    return (
      <main className="boot-error">
        <h1>Anumitra needs its local API</h1>
        <ErrorBox error={session.error} />
        <button onClick={() => session.refetch()}>Retry connection</button>
      </main>
    );
  if (!session.data?.user)
    return (
      <Welcome
        motion={motion}
        setMotion={setMotion}
        onLogin={() => {
          q.clear();
          navigate("/overview");
          q.invalidateQueries();
        }}
      />
    );
  const user = session.data.user;
  const role = user.grants.map((g: any) => label(g.role)).join(" · ");
  const isAdmin = user.grants.some((g: any) =>
    ["ADMIN", "BUREAU"].includes(g.role),
  );
  const navContent = (
    <>
      <Brand />
      <p className="sidebar-label">WORKSPACE</p>
      <nav aria-label="Main navigation">
        {nav
          .filter(([url]) => url !== "/admin" || isAdmin)
          .map(([url, name, Icon]) => (
            <NavLink key={url} to={url} onClick={() => setDrawer(false)}>
              <Icon size={19} />
              {name}
              <ChevronRight size={14} />
            </NavLink>
          ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="prototype">
          <Shield size={20} />
          <div>
            <strong>Prototype environment</strong>
            <small>Local adapter · Demo policies</small>
          </div>
        </div>
        <Link to="/profile" className="user-card">
          <div className="avatar">
            {user.name
              .split(" ")
              .map((x: string) => x[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <strong>{user.name}</strong>
            <small>{role}</small>
          </div>
        </Link>
        <button
          className="ghost"
          onClick={async () => {
            await post("/logout", {});
            q.clear();
            navigate("/");
            q.invalidateQueries();
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        Skip to workspace
      </a>
      <aside className="sidebar">{navContent}</aside>
      <div className="app-body">
        <header className="topbar">
          <Dialog.Root open={drawer} onOpenChange={setDrawer}>
            <Dialog.Trigger asChild>
              <button
                className="mobile-menu icon-button"
                aria-label="Open navigation"
              >
                <Menu />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="dialog-overlay" />
              <Dialog.Content className="mobile-drawer">
                <Dialog.Title className="sr-only">
                  Workspace navigation
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Choose a workspace
                </Dialog.Description>
                <Dialog.Close
                  className="drawer-close icon-button"
                  aria-label="Close navigation"
                >
                  <X />
                </Dialog.Close>
                {navContent}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <span>
              {nav.find(([url]) => location.pathname.startsWith(url))?.[1] ??
                "Account"}
            </span>
          </div>
          <div className="topbar-actions">
            <Badge active={connected === "Updates connected"}>
              <span className="tiny-dot" />
              {connected}
            </Badge>
            <button
              className="icon-button ghost"
              aria-label={
                refresh ? "Pause record updates" : "Resume record updates"
              }
              onClick={() => setRefresh(!refresh)}
            >
              {refresh ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              className="icon-button ghost"
              aria-label="Refresh records"
              onClick={() => q.invalidateQueries()}
            >
              <RefreshCw size={16} />
            </button>
            <Link
              to="/alerts"
              className="icon-button ghost"
              aria-label="Notification inbox"
            >
              <Bell size={18} />
            </Link>
            <div className="top-avatar">{user.name[0]}</div>
          </div>
        </header>
        <main id="main" className="workspace">
          <Routes>
            <Route path="/" element={<ActionDesk user={user} />} />
            <Route path="/overview" element={<ActionDesk user={user} />} />
            <Route path="/applications" element={<ReviewQueue user={user} />} />
            <Route path="/applications/new" element={<Wizard />} />
            <Route
              path="/applications/:id"
              element={<ApplicationWorkspace user={user} />}
            />
            <Route path="/evc" element={<EvcPlanner user={user} />} />
            <Route path="/committees" element={<CommitteeAgenda />} />
            <Route
              path="/compliance"
              element={<ComplianceLedger user={user} Review={ObligationCard} />}
            />
            <Route path="/documents" element={<EvidenceRegister />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/references" element={<PublicReferences />} />
            <Route path="/rules" element={<Rules user={user} />} />
            <Route path="/admin" element={<Admin user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route
              path="*"
              element={
                <Empty>
                  Workspace not found. <Link to="/overview">Open overview</Link>
                </Empty>
              }
            />
          </Routes>
        </main>
        <footer className="workspace-footer">
          <span>ANUMITRA · SIH26262</span>
          <span>Independent prototype. Demonstration rules. Asia/Kolkata.</span>
        </footer>
      </div>
    </div>
  );
}
function Wizard() {
  const options = useData("options", "/options");
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState("");
  const [form, setForm] = useState({
    institutionId: "",
    workflowId: "",
    category: "NEW_INSTITUTION",
    cycle: "2026-27",
    contact: "",
    programme: "",
    intake: 60,
  });
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  async function save(e: FormEvent) {
    e.preventDefault();
    if (step !== 3) return;
    setPending(true);
    try {
      const payload = {
        institutionId: form.institutionId || options.data.institutions[0]?.id,
        workflowId: form.workflowId || options.data.workflows[0]?.id,
        category: form.category,
        cycle: form.cycle,
        data: {
          contact: form.contact,
          programme: form.programme,
          intake: Number(form.intake),
        },
      };
      const r = await api(
        draftId ? `/applications/${draftId}/draft` : "/applications",
        { method: draftId ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setDraftId(r.id);
      navigate("/applications/" + r.id);
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="INSTITUTION WORKSPACE"
        title="Start with the details."
        accent="Build a clear case."
      />
      <div className="wizard-layout">
        <Panel>
          <div className="timeline">
            {[
              "Institution & route",
              "Programme & contact",
              "Review & save draft",
            ].map((x, i) => (
              <div
                className={"timeline-node " + (step === i + 1 ? "current" : "")}
                key={x}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{x}</strong>
              </div>
            ))}
          </div>
          <p className="muted">
            Saving creates a persistent draft. Add private evidence and submit
            from the application workspace.
          </p>
        </Panel>
        <Panel>
          <form onSubmit={save}>
            {step === 1 ? (
              <>
                <h2>Choose the governing workflow</h2>
                <p className="muted">
                  These routes use demonstration policy values. Published
                  versions remain pinned to your case.
                </p>
                <Field title="Institution">
                  <select
                    value={
                      form.institutionId ||
                      options.data?.institutions[0]?.id ||
                      ""
                    }
                    onChange={(e) => set("institutionId", e.target.value)}
                  >
                    {options.data?.institutions.map((x: any) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field title="Workflow route">
                  <select
                    value={
                      form.workflowId || options.data?.workflows[0]?.id || ""
                    }
                    onChange={(e) => set("workflowId", e.target.value)}
                  >
                    {options.data?.workflows.map((x: any) => (
                      <option key={x.id} value={x.id}>
                        {x.name} · v{x.version}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field title="Category">
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    {["NEW_INSTITUTION", "EXTENSION", "CHANGE"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field title="Academic cycle">
                  <input
                    required
                    value={form.cycle}
                    onChange={(e) => set("cycle", e.target.value)}
                  />
                </Field>
              </>
            ) : step === 2 ? (
              <>
                <h2>Programme and contact</h2>
                <Field title="Contact email">
                  <input
                    type="email"
                    required
                    value={form.contact}
                    onChange={(e) => set("contact", e.target.value)}
                  />
                </Field>
                <Field title="Programme">
                  <input
                    required
                    minLength={3}
                    value={form.programme}
                    onChange={(e) => set("programme", e.target.value)}
                  />
                </Field>
                <Field title="Proposed intake">
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    required
                    value={form.intake}
                    onChange={(e) => set("intake", e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <>
                <h2>Ready to save your draft</h2>
                <dl>
                  {Object.entries(form)
                    .filter(([k]) => !k.endsWith("Id"))
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt>{label(k)}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                </dl>
                <p className="scope-note">
                  This saves a draft. Submission requires evidence and a
                  separate explicit action.
                </p>
              </>
            )}
            <ErrorBox error={error} />
            <div className="button-row">
              {step > 1 && (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  key="continue"
                  type="button"
                  className="primary"
                  onClick={() => {
                    if (
                      step === 2 &&
                      (!form.contact.includes("@") || form.programme.length < 3)
                    ) {
                      setError(
                        new Error("Enter a valid contact and programme."),
                      );
                      return;
                    }
                    setError(null);
                    setStep(step + 1);
                  }}
                >
                  Continue <ArrowRight size={17} />
                </button>
              ) : (
                <button className="primary" disabled={pending}>
                  {pending ? "Saving…" : "Save persistent draft"}
                  <Check size={17} />
                </button>
              )}
            </div>
          </form>
        </Panel>
      </div>
    </>
  );
}
function UploadForm({
  appId,
  documents = [],
  onDone,
}: {
  appId: string;
  documents?: any[];
  onDone: () => void;
}) {
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);
  return (
    <form
      className="upload-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        for (const [k, v] of [...data.entries()])
          if (typeof v === "string" && !v) data.delete(k);
        setPending(true);
        try {
          await api(`/applications/${appId}/documents`, {
            method: "POST",
            body: data,
          });
          form.reset();
          setError(null);
          onDone();
        } catch (e) {
          setError(e);
        } finally {
          setPending(false);
        }
      }}
    >
      <h3>Add private evidence</h3>
      <Field title="Document title">
        <input
          name="title"
          required
          minLength={3}
          placeholder="Campus lease renewal"
        />
      </Field>
      <div className="form-grid">
        <Field title="Type">
          <select name="kind">
            {["LEASE", "AFFIDAVIT", "COMPLIANCE", "OTHER"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field title="Renew existing document">
          <select name="documentId">
            <option value="">Create a document</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </Field>
        <Field title="Valid through (IST)">
          <input type="date" name="validUntil" />
        </Field>
        <Field title="Issuer (if supplied)">
          <input name="issuer" />
        </Field>
      </div>
      <Field title="File · PDF / PNG / JPEG · up to 10 MB">
        <input
          name="file"
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          required
        />
      </Field>
      <ErrorBox error={error} />
      <button className="secondary" disabled={pending}>
        {pending ? "Uploading…" : "Upload new immutable version"}
        <Plus size={16} />
      </button>
      <p className="fine-print">
        Private authenticated storage. NOT_SCANNED: no malware scanner is
        configured. Upload does not mean accepted evidence.
      </p>
    </form>
  );
}
function ApplicationWorkspace({ user }: { user: any }) {
  const { id } = useParams();
  const [routeParams] = useSearchParams();
  const [humanConfirmed, setHumanConfirmed] = useState(false);
  const q = useQueryClient();
  const data = useData("application", "/applications/" + id);
  const options = useData("options", "/options");
  const [selected, setSelected] = useState("");
  const [cmd, setCmd] = useState("");
  const [reason, setReason] = useState("");
  const [item, setItem] = useState("LEASE");
  const [deficiencyId, setDeficiencyId] = useState("");
  const [outcome, setOutcome] = useState("ACCEPTED");
  const [ownerId, setOwnerId] = useState("");
  const [condition, setCondition] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);
  const [tab, setTab] = useState(
    routeParams.get("tab") === "deficiencies" ? "deficiencies" : "evidence",
  );
  const [message, setMessage] = useState("");
  const [retryKey, setRetryKey] = useState("");
  const [retryBody, setRetryBody] = useState("");
  const r = data.data;
  useEffect(() => {
    setHumanConfirmed(false);
  }, [id, r?.version, cmd, outcome]);
  useEffect(() => {
    if (routeParams.get("deficiency")) {
      setDeficiencyId(routeParams.get("deficiency")!);
      setCmd("submit-response");
    }
    if (
      ["evidence", "deficiencies", "history"].includes(
        routeParams.get("tab") ?? "",
      )
    )
      setTab(routeParams.get("tab")!);
  }, [id, routeParams.toString()]);
  const commandTitle = (command: string) =>
    ({
      submit: "Submit application",
      "submit-response": "Respond to deficiency",
      "verify-response": "Review submitted response",
      "review-document": "Accept / return evidence",
      "raise-deficiency": "Request correction",
      "return-with-reason": "Return with reason",
      "complete-stage": ["EVC", "SAC", "SHC"].includes(r?.state)
        ? "Complete committee stage"
        : "Complete scrutiny",
      "record-recommendation": "Record recommendation",
      "record-authorized-decision": "Record human decision",
      "refer-adverse": "Refer adverse finding",
      assign: "Assign eligible officer",
    })[command] ?? label(command);

  const versions =
    r?.documents.flatMap((d: any) =>
      d.versions
        .slice(0, 1)
        .map((v: any) => ({ ...v, title: d.title, kind: d.kind })),
    ) ?? [];
  const version = versions.find((v: any) => v.id === selected) ?? versions[0];
  const effectiveCmd = r?.allowedActions.includes(cmd)
    ? cmd
    : ([
        "submit-response",
        "submit",
        "record-authorized-decision",
        "verify-response",
        ...(r?.documents.some(
          (d: any) => d.versions[0]?.reviewState === "PENDING",
        )
          ? ["review-document"]
          : []),
        "record-recommendation",
        "complete-stage",
        "assign",
      ].find((c) => r?.allowedActions.includes(c)) ?? "");
  async function execute(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (effectiveCmd === "record-authorized-decision" && !humanConfirmed)
        throw new Error(
          "Confirm that a competent human reviewed this decision packet.",
        );
      const body = {
        command: effectiveCmd,
        expectedVersion: r.version,
        reason,
        ...(["raise-deficiency", "return-with-reason"].includes(effectiveCmd)
          ? {
              items: item
                .split(/\r?\n/)
                .map((x) => x.trim())
                .filter(Boolean),
            }
          : {}),
        ...(["submit-response", "verify-response"].includes(effectiveCmd)
          ? {
              deficiencyId:
                deficiencyId ||
                r.deficiencies.find(
                  (x: any) =>
                    x.state ===
                    (effectiveCmd === "submit-response" ? "OPEN" : "RESPONDED"),
                )?.id,
            }
          : {}),
        ...(["review-document", "submit-response"].includes(effectiveCmd)
          ? { documentVersionId: version?.id }
          : {}),
        ...(effectiveCmd === "assign"
          ? { ownerId: ownerId || options.data?.users[0]?.id }
          : {}),
        ...([
          "review-document",
          "verify-response",
          "record-recommendation",
          "record-authorized-decision",
        ].includes(effectiveCmd)
          ? { outcome }
          : {}),
        ...(outcome === "CONDITIONAL" &&
        effectiveCmd === "record-authorized-decision"
          ? { condition, dueAt: new Date(dueAt + "+05:30").toISOString() }
          : {}),
      };
      const encoded = JSON.stringify(body);
      const key = encoded === retryBody ? retryKey : crypto.randomUUID();
      setRetryBody(encoded);
      setRetryKey(key);
      await api(`/applications/${id}/commands`, {
        method: "POST",
        body: encoded,
        headers: { "Idempotency-Key": key },
      });
      setReason("");
      setMessage(
        "Action committed. State, audit and notification intent saved together.",
      );
      q.invalidateQueries();
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  }
  if (data.isPending) return <Loading />;
  if (data.error) return <ErrorBox error={data.error} />;
  const config = r.workflow.config;
  const institution = user.grants.some((g: any) => g.role === "INSTITUTION");
  return (
    <>
      <div className="case-breadcrumb">
        <Link to="/applications">Applications</Link>
        <ChevronRight size={14} />
        <span className="mono">{r.reference}</span>
      </div>
      <Heading eyebrow="Case review" title={r.reference} accent="">
        <a
          className="secondary"
          href={`/api/applications/${id}/notice`}
          target="_blank"
          rel="noreferrer"
        >
          <ArrowDownToLine size={17} />
          Case summary
        </a>
      </Heading>
      <p className="case-identity">
        {r.institution.name} · {label(r.category)} · {r.cycle}{" "}
        <Origin kind={r.recordOrigin ?? "UNCLASSIFIED"} />
      </p>
      <div className="context-strip panel">
        <div>
          <small>CURRENT STAGE</small>
          <Status value={r.state} />
        </div>
        <div>
          <small>NEXT RESPONSIBILITY</small>
          <strong>{r.brief.next.assignee ?? r.brief.next.role}</strong>
          {r.brief.ownerName && <small>Case owner: {r.brief.ownerName}</small>}
        </div>
        <div>
          <small>DEADLINE · IST</small>
          <strong className="mono">
            {r.brief.next.due ? date(r.brief.next.due) : "No current deadline"}
          </strong>
        </div>
        <div>
          <small>GOVERNING POLICY</small>
          <strong>
            {r.workflow.name} · v{r.workflow.version}
          </strong>
        </div>
        <div>
          <small>RECORD REVISION</small>
          <strong className="mono">{String(r.version).padStart(3, "0")}</strong>
        </div>
      </div>
      <div className="review-grid">
        <Panel className="workflow-rail">
          <p className="eyebrow">THE APPROVAL JOURNEY</p>
          <h2>Approval stages</h2>
          <div className="timeline">
            {["DRAFT", ...config.stages].map((s: string, i: number) => (
              <div
                key={s}
                className={
                  "timeline-node " +
                  (r.state === s ||
                  (r.state === "RESCRUTINY" && s === "SCRUTINY")
                    ? "current"
                    : (i === 0 && r.state !== "DRAFT") ||
                        (i > 0 && i - 1 < r.stageIndex) ||
                        ["APPROVED", "REJECTED", "CONDITIONAL"].includes(
                          r.state,
                        )
                      ? "completed"
                      : "pending")
                }
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{label(s)}</strong>
                  <small>
                    {i === 0
                      ? "Institution prepares evidence"
                      : s === "AUTHORITY"
                        ? "Explicit authorized decision"
                        : s === "SAC" || s === "SHC"
                          ? "Separate committee recommendation"
                          : "Human verification"}
                  </small>
                </div>
              </div>
            ))}
          </div>
          <div className="scope-note">
            <ShieldCheck size={18} />
            <p>
              Submission and decision snapshots retain exact evidence versions.
            </p>
          </div>
          <details>
            <summary>Stage attempts ({r.attempts.length})</summary>
            {r.attempts.map((t: any) => (
              <p key={t.id}>
                <strong>{t.stage}</strong>
                <br />
                {t.state} · {date(t.startedAt)}
              </p>
            ))}
          </details>
        </Panel>
        <Panel className="evidence-panel">
          <div className="tabs">
            <button
              className={tab === "evidence" ? "selected" : ""}
              onClick={() => setTab("evidence")}
            >
              Evidence ({versions.length})
            </button>
            <button
              className={tab === "deficiencies" ? "selected" : ""}
              onClick={() => setTab("deficiencies")}
            >
              Deficiencies ({r.deficiencies.length})
            </button>
            <button
              className={tab === "history" ? "selected" : ""}
              onClick={() => setTab("history")}
            >
              History
            </button>
          </div>
          {r.state === "AUTHORITY" && (
            <section className="decision-packet">
              <h2>Decision-ready packet</h2>
              <p>
                {r.institution.name} · {r.category} · {r.cycle} ·{" "}
                {r.data.programme} · Proposed intake {r.data.intake}
              </p>
              <h3>Recorded recommendations / adverse findings</h3>
              {r.recommendations.length ? (
                r.recommendations.map((rec: any) => (
                  <div className="packet-finding" key={rec.id}>
                    <Status value={rec.outcome} />
                    <strong>{label(rec.stage)}</strong>
                    <p>{rec.reason}</p>
                    <small>
                      Attempt {rec.attemptId ?? "Not recorded"} ·{" "}
                      {date(rec.createdAt)} IST
                    </small>
                  </div>
                ))
              ) : (
                <p>
                  No recommendation recorded. This route may be scrutiny-only;
                  no committee record is invented.
                </p>
              )}
              <h3>Reviewed evidence</h3>
              {versions.map((v: any) => (
                <p key={v.id}>
                  {v.title} · v{v.number} · {label(v.reviewState)}
                </p>
              ))}
              <h3>Unresolved findings</h3>
              {r.blockingReasons.length ? (
                <ul>
                  {r.blockingReasons.map((b: string) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p>
                  Positive evidence checks are clear. Only an authorized human
                  can record the final outcome.
                </p>
              )}
              <p>
                Proposed condition:{" "}
                {condition ||
                  "Not entered; required for a conditional decision."}
              </p>
              <a
                className="task-link"
                href={`/api/applications/${id}/notice`}
                target="_blank"
                rel="noreferrer"
              >
                Review case summary
              </a>
            </section>
          )}
          {tab === "evidence" ? (
            <>
              <div className="section-heading">
                <h2>Document workspace</h2>
                <FileText className="orange" size={20} />
              </div>
              {versions.length ? (
                <>
                  <Field title="Current document version">
                    <select
                      value={version?.id ?? ""}
                      onChange={(e) => setSelected(e.target.value)}
                    >
                      {versions.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.title} · v{v.number} · {v.reviewState}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="document-toolbar">
                    <Badge>{version.reviewState}</Badge>
                    <span className="mono">
                      v{version.number} · {(version.size / 1024).toFixed(1)} KB
                    </span>
                    <a
                      href={`/api/documents/${version.id}/content?download=true`}
                      className="icon-button ghost"
                      aria-label="Download selected evidence"
                    >
                      <ArrowDownToLine size={17} />
                    </a>
                  </div>
                  {version.mime === "application/pdf" ? (
                    <React.Suspense fallback={<Loading />}>
                      <PdfPreview
                        url={`/api/documents/${version.id}/content`}
                      />
                    </React.Suspense>
                  ) : (
                    <img
                      className="document-preview"
                      alt="Submitted private evidence"
                      src={`/api/documents/${version.id}/content`}
                    />
                  )}
                  <p className="fine-print">
                    {version.scanState} · Hash establishes byte correspondence,
                    not authenticity.
                  </p>
                  <details>
                    <summary>Document version lineage</summary>
                    {r.documents.flatMap((d: any) =>
                      d.versions.map((v: any, i: number) => (
                        <div className="lineage-row" key={v.id}>
                          <span>
                            {d.title} · v{v.number} ·{" "}
                            {i === 0 ? "Current" : "Superseded"}
                          </span>
                          <a
                            href={`/api/documents/${v.id}/content?download=true`}
                          >
                            Download
                          </a>
                        </div>
                      )),
                    )}
                  </details>
                </>
              ) : (
                <Empty>
                  No evidence yet. Upload a private document to continue.
                </Empty>
              )}
              {institution &&
                [
                  "DRAFT",
                  "AWAITING_RESPONSE",
                  "CONDITIONAL",
                  "APPROVED",
                ].includes(r.state) && (
                  <UploadForm
                    appId={r.id}
                    documents={r.documents}
                    onDone={() => q.invalidateQueries()}
                  />
                )}
              <div className="checklist">
                <h3>Evidence checklist</h3>
                {versions.map((v: any) => (
                  <div key={v.id}>
                    {v.reviewState === "ACCEPTED" ? (
                      <CheckCheck size={17} />
                    ) : (
                      <Clock size={17} />
                    )}
                    <span>{v.title}</span>
                    <strong>{label(v.reviewState)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : tab === "deficiencies" ? (
            r.deficiencies.length ? (
              r.deficiencies.map((d: any) => (
                <div className="deficiency" key={d.id}>
                  <Badge active>
                    ROUND {d.round} · {d.state}
                  </Badge>
                  <h3>{d.item}</h3>
                  <p>{d.reason}</p>
                  {d.responses.map((x: any) => {
                    const linked = r.documents
                      .flatMap((doc: any) =>
                        doc.versions.map((v: any) => ({
                          ...v,
                          title: doc.title,
                        })),
                      )
                      .find((v: any) => v.id === x.documentVersionId);
                    return (
                      <blockquote key={x.id}>
                        <p>{x.text}</p>
                        <small>Submitted {date(x.createdAt)} IST</small>
                        <small>
                          Evidence:{" "}
                          {linked
                            ? `${linked.title} · v${linked.number}`
                            : x.documentVersionId}
                        </small>
                        <Status value={x.reviewOutcome ?? "PENDING"}>
                          {x.reviewOutcome
                            ? `Official review: ${label(x.reviewOutcome)}`
                            : "Awaiting official review"}
                        </Status>
                        {x.reviewedAt && (
                          <small>
                            Reviewed {date(x.reviewedAt)} IST · reason retained
                            in case history
                          </small>
                        )}
                        {linked && (
                          <a
                            className="task-link"
                            href={`/api/documents/${linked.id}/content`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Inspect exact response evidence
                          </a>
                        )}
                      </blockquote>
                    );
                  })}
                  {r.allowedActions.some((c: string) =>
                    ["submit-response", "verify-response"].includes(c),
                  ) &&
                    ["OPEN", "RESPONDED"].includes(d.state) && (
                      <button
                        className="secondary"
                        onClick={() => {
                          setDeficiencyId(d.id);
                          setCmd(
                            d.state === "OPEN"
                              ? "submit-response"
                              : "verify-response",
                          );
                        }}
                      >
                        {d.state === "OPEN"
                          ? "Respond to this item"
                          : "Review this response"}
                      </button>
                    )}
                </div>
              ))
            ) : (
              <Empty>No deficiencies have been raised.</Empty>
            )
          ) : (
            <HistoryRows rows={r.history} />
          )}
        </Panel>
        <div className="action-column">
          <Panel className="active-module">
            <div className="section-heading">
              <div>
                <h2>What happens next?</h2>
              </div>
              <Workflow size={23} className="orange" />
            </div>
            <div className="case-brief">
              <strong>Next step</strong>
              <p>{r.brief.next.task}</p>
              <strong>Who acts next?</strong>
              <p>
                {r.brief.next.assignee
                  ? `${r.brief.next.assignee} · ${r.brief.next.role}`
                  : r.brief.next.role}
              </p>
              <strong>What is due?</strong>
              <p>
                {r.brief.next.due
                  ? `${date(r.brief.next.due)} IST`
                  : "No application deadline pending; consult the undertaking and document ledgers for follow-up."}
              </p>
              {!["APPROVED", "REJECTED", "CONDITIONAL"].includes(r.state) && (
                <>
                  <strong>Selected action checks</strong>
                  {(
                    r.commandBlockingReasons?.[effectiveCmd]?.[outcome] ??
                    r.blockingReasons
                  ).length ? (
                    <ul>
                      {(
                        r.commandBlockingReasons?.[effectiveCmd]?.[outcome] ??
                        r.blockingReasons
                      ).map((b: string) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      No additional evidence blockers reported. Server
                      authorisation and stage checks still apply.
                    </p>
                  )}
                </>
              )}
            </div>
            <details className="route-explanation">
              <summary>Why this route / deadline?</summary>
              <p>
                {r.workflow.name} v{r.workflow.version}:{" "}
                {config.stages.map((stage: string) => label(stage)).join(" → ")}
              </p>
              <p>
                Category {label(r.category)} · Academic year {r.cycle}. This
                case is pinned to the recorded policy version.
              </p>
              <p>Source: {r.workflow.source}</p>
              <p>
                Verification: DEMO / applicability unverified. Effective policy
                period: not recorded. Calendar days; Asia/Kolkata. The recorded
                subject deadline above is authoritative for this prototype;
                policy migration never silently changes an existing due date.
              </p>
              <Link
                className="task-link"
                to={"/rules?selected=" + r.workflowId}
              >
                Inspect governing policy
              </Link>
            </details>
            <span className="corner" />
          </Panel>
          <Panel>
            <h2>Authorized action</h2>
            {message && (
              <p className="success" role="status">
                <Check size={16} />
                {message}
              </p>
            )}
            {r.allowedActions.length ? (
              <form onSubmit={execute}>
                <div className="task-actions" aria-label="Eligible case tasks">
                  {r.allowedActions
                    .filter((c: string) => c !== "assign")
                    .map((c: string) => (
                      <button
                        type="button"
                        key={c}
                        className={effectiveCmd === c ? "selected" : ""}
                        onClick={() => {
                          setCmd(c);
                          setOutcome(
                            c === "record-authorized-decision"
                              ? "APPROVED"
                              : "ACCEPTED",
                          );
                          setHumanConfirmed(false);
                          setError(null);
                          setMessage("");
                        }}
                      >
                        {commandTitle(c)}
                      </button>
                    ))}
                </div>
                <p className="fine-print">
                  Selected task: {commandTitle(effectiveCmd)}. Advanced eligible
                  actions remain available below.
                </p>
                <Field title="Action">
                  <select
                    value={effectiveCmd}
                    onChange={(e) => {
                      setCmd(e.target.value);
                      setOutcome(
                        e.target.value === "record-authorized-decision"
                          ? "APPROVED"
                          : "ACCEPTED",
                      );
                      setError(null);
                      setMessage("");
                    }}
                  >
                    {r.allowedActions.map((c: string) => (
                      <option key={c} value={c}>
                        {label(c.replaceAll("-", " "))}
                      </option>
                    ))}
                  </select>
                </Field>
                {effectiveCmd === "assign" && (
                  <Field title="Assign to">
                    <select
                      value={ownerId}
                      onChange={(e) => setOwnerId(e.target.value)}
                    >
                      <option value="">Select eligible user</option>
                      {r.assignees?.map((u: any) => (
                        <option value={u.id} key={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                {["raise-deficiency", "return-with-reason"].includes(
                  effectiveCmd,
                ) && (
                  <Field title="Checklist item">
                    <textarea
                      value={item}
                      onChange={(e) => setItem(e.target.value)}
                      required
                      placeholder="One distinct checklist item per line (up to 20)"
                    />
                    <small>
                      One distinct item per line; every item receives its own
                      evidence response and review.
                    </small>
                  </Field>
                )}
                {["submit-response", "verify-response"].includes(
                  effectiveCmd,
                ) && (
                  <Field title="Target deficiency">
                    <select
                      value={deficiencyId}
                      onChange={(e) => setDeficiencyId(e.target.value)}
                    >
                      <option value="">First unresolved deficiency</option>
                      {r.deficiencies
                        .filter(
                          (d: any) =>
                            d.state ===
                            (effectiveCmd === "submit-response"
                              ? "OPEN"
                              : "RESPONDED"),
                        )
                        .map((d: any) => (
                          <option key={d.id} value={d.id}>
                            Round {d.round} · {d.item} ({d.state})
                          </option>
                        ))}
                    </select>
                  </Field>
                )}
                {[
                  "review-document",
                  "verify-response",
                  "record-recommendation",
                  "record-authorized-decision",
                ].includes(effectiveCmd) && (
                  <Field title="Outcome">
                    <select
                      value={outcome}
                      onChange={(e) => {
                        setOutcome(e.target.value);
                        setHumanConfirmed(false);
                      }}
                    >
                      {(effectiveCmd === "record-authorized-decision"
                        ? ["APPROVED", "CONDITIONAL", "REJECTED"]
                        : ["ACCEPTED", "REJECTED"]
                      ).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                )}
                {outcome === "CONDITIONAL" &&
                  effectiveCmd === "record-authorized-decision" && (
                    <>
                      <Field title="Condition / undertaking">
                        <textarea
                          value={condition}
                          onChange={(e) => setCondition(e.target.value)}
                          required
                        />
                      </Field>
                      <Field title="Condition due (IST)">
                        <input
                          type="datetime-local"
                          value={dueAt}
                          onChange={(e) => setDueAt(e.target.value)}
                          required
                        />
                      </Field>
                    </>
                  )}
                {effectiveCmd !== "submit" && (
                  <Field title="Reason / response (recorded in history)">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      minLength={5}
                      required
                      placeholder="Explain the evidence and the authorized action…"
                    />
                  </Field>
                )}
                {["review-document", "submit-response"].includes(
                  effectiveCmd,
                ) && (
                  <p className="fine-print">
                    Uses selected evidence:{" "}
                    {version?.title ?? "No document selected"} v
                    {version?.number}
                  </p>
                )}
                {effectiveCmd === "record-authorized-decision" && (
                  <label className="human-confirmation">
                    <input
                      type="checkbox"
                      checked={humanConfirmed}
                      onChange={(e) => setHumanConfirmed(e.target.checked)}
                    />
                    I confirm that I reviewed the packet and am recording this
                    human authority decision.
                  </label>
                )}
                <ErrorBox error={error} />
                <button className="primary full stable" disabled={pending}>
                  {pending
                    ? "Committing…"
                    : "Commit " + label(effectiveCmd.replaceAll("-", " "))}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <Empty>
                No transition actions are available to your current grants.
              </Empty>
            )}
          </Panel>
          {!institution && (
            <InternalNote id={r.id} onDone={() => q.invalidateQueries()} />
          )}
          {user.grants.some((g: any) => g.role === "BUREAU") && (
            <PolicyMigration
              record={r}
              workflows={options.data?.workflows ?? []}
              onDone={() => q.invalidateQueries()}
            />
          )}
        </div>
      </div>
    </>
  );
}
function PolicyMigration({
  record,
  workflows,
  onDone,
}: {
  record: any;
  workflows: any[];
  onDone: () => void;
}) {
  const [error, setError] = useState<unknown>();
  return (
    <Panel>
      <details>
        <summary>Authorized policy migration</summary>
        <p className="fine-print">
          Preserves completed/current stages, original snapshots and deadlines.
          Requires a reason and the current record revision.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await post(`/applications/${record.id}/migrate-policy`, {
                workflowId: f.get("workflowId"),
                reason: f.get("reason"),
                expectedVersion: record.version,
              });
              setError(null);
              onDone();
            } catch (e) {
              setError(e);
            }
          }}
        >
          <Field title="Target published version">
            <select name="workflowId">
              {workflows
                .filter((w) => w.id !== record.workflowId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} v{w.version}
                  </option>
                ))}
            </select>
          </Field>
          <Field title="Migration reason">
            <textarea name="reason" required minLength={10} />
          </Field>
          <ErrorBox error={error} />
          <button className="secondary stable">Migrate with guards</button>
        </form>
      </details>
    </Panel>
  );
}
function InternalNote({ id, onDone }: { id: string; onDone: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<unknown>();
  return (
    <Panel>
      <details>
        <summary>Internal observation</summary>
        <p className="fine-print">
          Hidden from institution communication and summaries.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await post(`/applications/${id}/notes`, { reason: text });
              setText("");
              setError(null);
              onDone();
            } catch (e) {
              setError(e);
            }
          }}
        >
          <Field title="Internal note">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              minLength={5}
            />
          </Field>
          <ErrorBox error={error} />
          <button className="secondary">Record observation</button>
        </form>
      </details>
    </Panel>
  );
}
function ObligationCard({ o, user }: { o: any; user: any }) {
  const q = useQueryClient();
  const [command, setCommand] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const app = useData("obligationApp", "/applications/" + o.applicationId);
  const institution = user.grants.some((g: any) => g.role === "INSTITUTION");
  const reviewer = user.grants.some((g: any) =>
    ["REVIEWER", "SUPERVISOR", "BUREAU"].includes(g.role),
  );
  const authority = user.grants.some((g: any) => g.role === "AUTHORITY");
  const allowed: string[] = o.allowedActions ?? [
    ...(institution && ["OPEN", "RETURNED"].includes(o.state)
      ? ["submit"]
      : []),
    ...(reviewer && o.state === "SUBMITTED" ? ["accept", "return"] : []),
    ...(authority && !["ACCEPTED", "WAIVED"].includes(o.state)
      ? ["extend", "waive"]
      : []),
  ];
  const effective = allowed.includes(command) ? command : allowed[0];
  return (
    <Panel className="obligation-card">
      <div className="section-heading">
        <Link to={"/applications/" + o.applicationId} className="mono orange">
          {o.application.reference}
        </Link>
        <Badge active>{o.state}</Badge>
      </div>
      <h2>{o.condition}</h2>
      <p className="muted">{o.application.institution.name}</p>
      <dl>
        <div>
          <dt>Original due</dt>
          <dd>{date(o.originalDueAt)} IST</dd>
        </div>
        <div>
          <dt>Current deadline</dt>
          <dd>{date(o.dueAt)} IST</dd>
        </div>
        <div>
          <dt>Source / authority</dt>
          <dd>{o.source}</dd>
        </div>
        <div>
          <dt>Required evidence</dt>
          <dd>{o.requiredEvidence}</dd>
        </div>
      </dl>
      <details>
        <summary>Evidence & deadline revision history</summary>
        <pre>
          {JSON.stringify(
            { evidence: o.evidence, dateRevisions: o.revisions },
            null,
            2,
          )}
        </pre>
      </details>
      {allowed.length > 0 && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await post("/obligations/" + o.id + "/commands", {
                command: effective,
                reason,
                expectedRevision: o.revision,
                ...(effective === "submit"
                  ? {
                      documentVersionId:
                        evidence || app.data?.documents[0]?.versions[0]?.id,
                    }
                  : {}),
                ...(effective === "extend"
                  ? { dueAt: new Date(due + "+05:30").toISOString() }
                  : {}),
              });
              setReason("");
              setError(null);
              q.invalidateQueries();
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field title="Authorized action">
            <select
              value={effective}
              onChange={(e) => setCommand(e.target.value)}
            >
              {allowed.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          {effective === "submit" && (
            <Field title="Private case evidence">
              <select
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              >
                <option value="">Select current evidence</option>
                {app.data?.documents.flatMap((d: any) =>
                  d.versions.slice(0, 1).map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {d.title} v{v.number}
                    </option>
                  )),
                )}
              </select>
            </Field>
          )}
          {effective === "extend" && (
            <Field title="Revised due (IST)">
              <input
                type="datetime-local"
                required
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </Field>
          )}
          <Field title="Evidence explanation / review reason">
            <textarea
              required
              minLength={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <ErrorBox error={error} />
          <button className="primary stable" disabled={busy}>
            {busy ? "Saving…" : "Record " + effective}
          </button>
        </form>
      )}
      {institution && app.data && (
        <details>
          <summary>Upload obligation evidence</summary>
          <UploadForm
            appId={o.applicationId}
            documents={app.data.documents}
            onDone={() => q.invalidateQueries()}
          />
        </details>
      )}
    </Panel>
  );
}
function Alerts() {
  const [alertParams] = useSearchParams();
  const highlighted = React.useRef("");
  const data = useData("alerts", "/alerts");
  const q = useQueryClient();
  const [tab, setTab] = useState("inbox");
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    const id = alertParams.get("event");
    if (
      id &&
      highlighted.current !== id &&
      data.data?.escalations?.some((e: any) => e.id === id)
    ) {
      const target = document.getElementById("escalation-" + id);
      if (target) {
        target.focus();
        target.scrollIntoView({ block: "center" });
        highlighted.current = id;
      }
    }
  }, [alertParams.toString(), data.data?.escalations?.length]);
  return (
    <>
      <Heading
        eyebrow="EVERY FOLLOW-UP HAS A RECORD"
        title="Alerts & delivery"
        accent=""
      />
      <Panel>
        <div className="tabs">
          <button
            className={tab === "inbox" ? "selected" : ""}
            onClick={() => setTab("inbox")}
          >
            Notification inbox
          </button>
          <button
            className={tab === "deliveries" ? "selected" : ""}
            onClick={() => setTab("deliveries")}
          >
            SMTP & attempt history
          </button>
        </div>
        <p className="muted">
          SMTP accepted means captured by local Mailpit. It does not mean
          external delivery. Ambiguous attempts need an authorized review before
          retry.
        </p>
        <ErrorBox error={error} />
        {!!data.data?.escalations?.length && (
          <details open={alertParams.has("event") ? true : undefined}>
            <summary>
              Designated escalation events ({data.data.escalations.length})
            </summary>
            {data.data.escalations.map((event: any) => (
              <div
                className={
                  "notification " +
                  (alertParams.get("event") === event.id
                    ? "selected-escalation"
                    : "")
                }
                id={"escalation-" + event.id}
                tabIndex={-1}
                key={event.id}
              >
                <div>
                  <Link to={"/applications/" + event.applicationId}>
                    Level {event.level} · {event.recipientRole} · {event.state}
                  </Link>
                  <p>
                    {event.subjectType} · due {date(event.dueAt)} IST ·{" "}
                    {event.recipientIds.length
                      ? (event.recipientNames?.join(", ") ??
                        `${event.recipientIds.length} designated recipient(s)`)
                      : "Unassigned: no eligible designated official"}
                  </p>
                  <small>{event.reason}</small>
                  {["OPEN", "UNASSIGNED"].includes(event.state) && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          await post(
                            "/escalations/" + event.id + "/acknowledge",
                            {
                              reason: new FormData(e.currentTarget).get(
                                "reason",
                              ),
                              expectedState: event.state,
                            },
                          );
                          setError(null);
                          q.invalidateQueries();
                        } catch (error) {
                          setError(error);
                        }
                      }}
                    >
                      <input
                        name="reason"
                        aria-label="Escalation acknowledgement reason"
                        required
                        minLength={5}
                      />
                      <button className="secondary">
                        Acknowledge escalation
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </details>
        )}
        {data.isPending ? (
          <Loading />
        ) : data.error ? (
          <ErrorBox error={data.error} />
        ) : tab === "inbox" ? (
          data.data.inbox.length ? (
            data.data.inbox.map((n: any) => (
              <div
                className={"notification " + (n.read ? "read" : "")}
                key={n.id}
              >
                <span className="mini-icon">
                  <Bell size={18} />
                </span>
                <div>
                  <Link to={"/applications/" + n.applicationId}>{n.title}</Link>
                  <small>
                    {date(n.createdAt)} IST · {n.read ? "Read" : "Unread"}
                  </small>
                </div>
                {!n.read && (
                  <button
                    className="ghost icon-button"
                    aria-label="Mark notification read"
                    onClick={async () => {
                      await post("/alerts/" + n.id + "/read", {});
                      q.invalidateQueries();
                    }}
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <Empty>Your notification inbox is clear.</Empty>
          )
        ) : data.data.deliveries.length ? (
          data.data.deliveries.map((d: any) => (
            <details className="delivery" key={d.id}>
              <summary>
                <Badge active>{d.state}</Badge>
                <span>{d.title}</span>
                <span className="mono">{d.attempts} attempt(s)</span>
              </summary>
              {d.deliveries.map((a: any) => (
                <div className="attempt" key={a.id}>
                  <strong>{a.state}</strong>
                  <small>{date(a.createdAt)}</small>
                  <p>{a.detail}</p>
                </div>
              ))}
              {["FAILED", "EXHAUSTED", "AMBIGUOUS"].includes(d.state) && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await post("/deliveries/" + d.id + "/retry", {
                        reason: new FormData(e.currentTarget).get("reason"),
                        expectedGeneration: d.generation,
                        acknowledgeDuplicate:
                          new FormData(e.currentTarget).get(
                            "acknowledgeDuplicate",
                          ) === "on",
                      });
                      setError(null);
                      q.invalidateQueries();
                    } catch (e) {
                      setError(e);
                    }
                  }}
                >
                  <Field title="Authorized retry reason">
                    <input name="reason" required minLength={5} />
                  </Field>
                  {d.state === "AMBIGUOUS" && (
                    <label>
                      <input
                        type="checkbox"
                        name="acknowledgeDuplicate"
                        required
                      />{" "}
                      I understand SMTP may already have accepted this message;
                      retry can send a duplicate.
                    </label>
                  )}
                  <button className="secondary">Request retry</button>
                </form>
              )}
            </details>
          ))
        ) : (
          <Empty>No delivery intents in this scope.</Empty>
        )}
      </Panel>
    </>
  );
}
function Reports() {
  const [kind, setKind] = useState("pendency");
  const [region, setRegion] = useState("");
  const [state, setState] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const params = new URLSearchParams({
    ...(region ? { region } : {}),
    ...(state ? { state } : {}),
  });
  const data = useData("report", `/reports/${kind}?${params}`);
  const audits = useData("audits", "/audits", showAudit);
  const options = useData("options", "/options");
  return (
    <>
      <Heading
        eyebrow="EVIDENCE YOU CAN TAKE WITH YOU"
        title="Reports & audit"
        accent=""
      />
      <Panel>
        <div className="tabs">
          <button
            className={!showAudit ? "selected" : ""}
            onClick={() => setShowAudit(false)}
          >
            Consolidated reports
          </button>
          <button
            className={showAudit ? "selected" : ""}
            onClick={() => setShowAudit(true)}
          >
            Action history
          </button>
        </div>
        {showAudit ? (
          audits.isPending ? (
            <Loading />
          ) : (
            <HistoryRows rows={audits.data ?? []} />
          )
        ) : (
          <>
            <div className="filters">
              <Field title="Report">
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  {[
                    "pendency",
                    "evc",
                    "compliance",
                    "validity",
                    "overdue",
                    "regions",
                  ].map((s) => (
                    <option value={s} key={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field title="Region">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="">Authorized scope</option>
                  {options.data?.regions.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field title="Stage">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">All</option>
                  {[
                    "DRAFT",
                    "SCRUTINY",
                    "EVC",
                    "SAC",
                    "SHC",
                    "AUTHORITY",
                    "CONDITIONAL",
                    "APPROVED",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <a
                className="secondary"
                href={`/api/reports/${kind}?${params}&format=csv`}
              >
                <ArrowDownToLine size={16} />
                CSV
              </a>
              <a
                className="secondary"
                href={`/api/reports/${kind}?${params}&format=pdf`}
                target="_blank"
                rel="noreferrer"
              >
                <FileText size={16} />
                Print / PDF
              </a>
            </div>
            <p className="fine-print">
              Same application filters and scope as the register. Business
              clock: {date(data.data?.clock)} IST. CSV formula prefixes are
              neutralized.
            </p>
            {data.isPending ? (
              <Loading />
            ) : data.error ? (
              <ErrorBox error={data.error} />
            ) : data.data?.rows.length ? (
              <div
                className="table-scroll"
                role="region"
                aria-label="Scrollable report table"
                tabIndex={0}
              >
                <table className="report-table">
                  <thead>
                    <tr>
                      {Object.keys(data.data.rows[0]).map((k) => (
                        <th key={k} scope="col">
                          {reportHeading(k)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.rows.map((r: any, i: number) => (
                      <tr key={i}>
                        {Object.entries(r).map(([key, v], j: number) => (
                          <td key={j}>{reportValue(key, v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty />
            )}
            <p className="freshness">
              {data.data?.total ?? 0} {data.data?.countUnit ?? "report rows"}{" "}
              within authorized scope
            </p>
          </>
        )}
      </Panel>
    </>
  );
}
function HistoryRows({ rows }: { rows: any[] }) {
  return (
    <div className="audit-list">
      {rows.map((h) => (
        <article key={h.id}>
          <span className="audit-dot" />
          <div>
            <strong>{label(h.action)}</strong>
            <p>{h.reason}</p>
            <small>
              {date(h.createdAt)} IST · {label(h.visibility)}
            </small>
            {h.escalation ? (
              <div className="escalation-context">
                <p>
                  <strong>{readable(h.escalation.subjectType)}</strong> ·{" "}
                  {h.escalation.subjectId} · Level {h.escalation.level}
                </p>
                <p>
                  Designated role: {readable(h.escalation.recipientRole)}.
                  Current recipients:{" "}
                  {h.escalation.recipients.length
                    ? h.escalation.recipients.join(", ")
                    : `${h.escalation.recipientCount} designated recipient(s)`}
                  .
                </p>
                <p>
                  Current event status: {readable(h.escalation.currentStatus)} ·
                  due {date(h.escalation.due)} IST
                </p>
                <p>{h.escalation.resolutionReason}</p>
                <small>
                  Separate rows retain distinct deadline subjects, revisions and
                  escalation levels.
                </small>
              </div>
            ) : h.action.startsWith("escalation-") ? (
              <p className="muted">
                Legacy entry: subject context was not captured in this row.
                Separate subjects or escalation levels can resolve together.
              </p>
            ) : null}
            {h.fromState || h.toState ? (
              <code>
                {h.fromState ? readable(h.fromState) : "Initial state"} →{" "}
                {h.toState ? readable(h.toState) : "No stage change"}
              </code>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
function Rules({ user }: { user: any }) {
  const data = useData("rules", "/rules");
  const [policyParams] = useSearchParams();
  const q = useQueryClient();
  const [selected, setSelected] = useState(policyParams.get("selected") ?? "");
  const [name, setName] = useState("");
  const [stages, setStages] = useState<string[]>([
    "SCRUTINY",
    "EVC",
    "AUTHORITY",
  ]);
  const [addStage, setAddStage] = useState("SCRUTINY");
  const [simEvidence, setSimEvidence] = useState(false);
  const [simDeficiency, setSimDeficiency] = useState(false);
  const [simVisit, setSimVisit] = useState(false);
  const [simRecommendation, setSimRecommendation] = useState(false);
  const [days, setDays] = useState(14);
  const [reminders, setReminders] = useState(3);
  const [source, setSource] = useState("DEMO: unverified calendar-day policy");
  const [requiredEvidence, setRequiredEvidence] = useState("");
  const [categories, setCategories] = useState(
    "NEW_INSTITUTION, EXTENSION, CHANGE",
  );
  const [escalationDays, setEscalationDays] = useState(0);
  const [windows, setWindows] = useState<Record<string, number>>({});
  const [levels, setLevels] = useState<any[]>([
    { afterDays: 0, role: "SUPERVISOR" },
    { afterDays: 7, role: "BUREAU" },
    { afterDays: 14, role: "AUTHORITY" },
  ]);
  const [simulation, setSimulation] = useState<any>();
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const editor = user.grants.some((g: any) =>
    ["ADMIN", "BUREAU"].includes(g.role),
  );
  const publisher = user.grants.some(
    (g: any) => g.role === "BUREAU" && g.global,
  );
  const rule =
    data.data?.rules.find((r: any) => r.id === selected) ?? data.data?.rules[0];
  const config = () => ({
    stages,
    deadlineDays: Number(days),
    reminderDays: Number(reminders),
    label: "DEMO policy; calendar days in Asia/Kolkata",
    requiredEvidence: requiredEvidence
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    applicability: categories
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    escalationDays: Number(escalationDays),
    windows,
    escalationLevels: levels,
    adverseReferral: "AUTHORITY_REVIEW",
    recipients: ["INSTITUTION", "ASSIGNEE"],
    calendar: "CALENDAR_DAYS",
    timezone: "Asia/Kolkata",
  });
  function choose(r: any) {
    setSelected(r.id);
    setName(r.name);
    setStages([...r.config.stages]);
    setDays(r.config.deadlineDays);
    setReminders(r.config.reminderDays);
    setSource(r.source);
    setRequiredEvidence((r.config.requiredEvidence ?? []).join(", "));
    setCategories(
      (
        r.config.applicability ?? ["NEW_INSTITUTION", "EXTENSION", "CHANGE"]
      ).join(", "),
    );
    setEscalationDays(r.config.escalationDays ?? 0);
    setWindows(r.config.windows ?? {});
    setLevels(
      r.config.escalationLevels ?? [
        { afterDays: r.config.escalationDays ?? 0, role: "SUPERVISOR" },
        { afterDays: 7, role: "BUREAU" },
      ],
    );
    setSimulation(null);
    setMessage("");
  }
  async function operate(operation: string) {
    setBusy(true);
    try {
      const r =
        operation === "create"
          ? await post("/rules", {
              name: name || "Demonstration custom route",
              config: config(),
              source,
            })
          : await post(`/rules/${rule.id}/${operation}`, {
              ...(operation === "simulate"
                ? {
                    scenario: {
                      category: "NEW_INSTITUTION",
                      evidence: simEvidence
                        ? [{ kind: "LEASE", reviewState: "ACCEPTED" }]
                        : [],
                      openDeficiencies: simDeficiency ? 1 : 0,
                      completedVisit: simVisit,
                      recommendationRecorded: simRecommendation,
                    },
                  }
                : {}),
              expectedRevision: rule.revision,
              expectedHash: rule.contentHash,
              ...(operation === "save" ||
              operation === "simulate" ||
              operation === "publish"
                ? { config: config() }
                : {}),
            });
      if (operation === "simulate") setSimulation(r);
      else {
        setMessage(
          `Rule ${operation} committed. Existing cases remain pinned.`,
        );
        q.invalidateQueries();
        if (operation === "create") choose(r);
      }
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (rule && (!name || !selected)) choose(rule);
  }, [rule?.id]);
  return (
    <>
      <Heading
        eyebrow="CONFIGURABLE ROUTES. FIXED ACCOUNTABILITY."
        title="Workflow policies"
        accent=""
      />
      <div className="rules-grid">
        <Panel>
          <div className="section-heading">
            <h2>Workflow library</h2>
            <GitBranch className="orange" />
          </div>
          {data.isPending ? (
            <Loading />
          ) : (
            data.data?.rules.map((r: any) => (
              <button
                key={r.id}
                onClick={() => choose(r)}
                className={
                  "rule-card " + (rule?.id === r.id ? "active-module" : "")
                }
              >
                <div>
                  <strong>{r.name}</strong>
                  <small>
                    Version {r.version} · {r.state}
                  </small>
                </div>
                <ChevronRight size={18} />
              </button>
            ))
          )}
        </Panel>
        <Panel>
          <p className="eyebrow">
            STRUCTURED CONFIGURATION · NO EXECUTABLE CODE
          </p>
          <h2>Selected policy and route</h2>
          <p className="muted">
            Published routes are immutable. Draft a new version to change
            stages. Publication requires a separate bureau grant and never
            grants decision authority.
          </p>
          <div className="policy-provenance">
            <Status value={rule?.state ?? "DRAFT"} />
            <p>
              Version {rule?.version ?? "not recorded"} · Source:{" "}
              {rule?.source ?? source}
            </p>
            <p>
              Verification: DEMO / unverified applicability. Academic year and
              effective period: not recorded on this policy; each case records
              its own year. Existing cases remain pinned.
            </p>
            <p>
              Applicable categories:{" "}
              {(rule?.config.applicability ?? [])
                .map((c: string) => label(c))
                .join(", ") || "Not recorded"}
            </p>
            {rule?.state !== "DRAFT" && (
              <strong>
                Read-only published/retired version. Create the next draft
                before editing.
              </strong>
            )}
          </div>
          <fieldset
            className="policy-fields"
            disabled={!editor || rule?.state !== "DRAFT"}
          >
            <Field title="Route name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={rule?.name ?? "Name this route"}
              />
            </Field>
            <section
              className="visual-route-editor"
              aria-label="Ordered policy stages"
            >
              <h3>Ordered review stages</h3>
              <ol>
                {stages.map((stage, index) => (
                  <li key={stage}>
                    <span className="stage-number">{index + 1}</span>
                    <strong>{label(stage)}</strong>
                    <label>
                      Stage window · DEMO days
                      <input
                        type="number"
                        aria-label={label(stage) + " stage window"}
                        min={1}
                        max={365}
                        value={
                          windows[stage === "EVC" ? "EVC_SCHEDULING" : stage] ??
                          days
                        }
                        onChange={(e) =>
                          setWindows({
                            ...windows,
                            [stage === "EVC" ? "EVC_SCHEDULING" : stage]:
                              Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <div className="stage-move">
                      <button
                        type="button"
                        className="secondary"
                        aria-label={"Move " + label(stage) + " earlier"}
                        disabled={stage === "AUTHORITY" || index === 0}
                        onClick={() =>
                          setStages((prev) => {
                            const next = [...prev];
                            [next[index - 1], next[index]] = [
                              next[index],
                              next[index - 1],
                            ];
                            return next;
                          })
                        }
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        aria-label={"Move " + label(stage) + " later"}
                        disabled={
                          stage === "AUTHORITY" || index >= stages.length - 2
                        }
                        onClick={() =>
                          setStages((prev) => {
                            const next = [...prev];
                            [next[index + 1], next[index]] = [
                              next[index],
                              next[index + 1],
                            ];
                            return next;
                          })
                        }
                      >
                        ↓
                      </button>
                      {stage !== "AUTHORITY" && (
                        <button
                          type="button"
                          className="ghost"
                          aria-label={"Remove " + label(stage) + " stage"}
                          onClick={() =>
                            setStages(stages.filter((s) => s !== stage))
                          }
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {stage === "AUTHORITY" && (
                      <small>
                        Final competent-human decision; fixed last stage
                      </small>
                    )}
                  </li>
                ))}
              </ol>
              <div className="button-row">
                <label className="field">
                  Add eligible stage
                  <select
                    value={addStage}
                    onChange={(e) => setAddStage(e.target.value)}
                  >
                    {["SCRUTINY", "EVC", "SAC", "SHC"].map((stage) => (
                      <option
                        key={stage}
                        disabled={stages.includes(stage)}
                        value={stage}
                      >
                        {label(stage)}
                        {stages.includes(stage) ? " (already included)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="secondary"
                  disabled={stages.includes(addStage)}
                  onClick={() =>
                    setStages([...stages.slice(0, -1), addStage, "AUTHORITY"])
                  }
                >
                  Add stage before authority
                </button>
              </div>
              <p className="fine-print">
                Duplicate stages and cycles are rejected. EVC report windows can
                be configured separately below.
              </p>
            </section>
            <div className="form-grid">
              <Field title="Demo deadline · calendar days">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                />
              </Field>
              <Field title="Advance reminder · days">
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={reminders}
                  onChange={(e) => setReminders(Number(e.target.value))}
                />
              </Field>
            </div>
            <Field title="Policy provenance / source">
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </Field>
            <Field title="Applicable categories (comma separated)">
              <input
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
              />
            </Field>
            <Field title="Required evidence types (comma separated; blank = any evidence)">
              <input
                value={requiredEvidence}
                onChange={(e) => setRequiredEvidence(e.target.value)}
                placeholder="LEASE, AFFIDAVIT"
              />
            </Field>
            <Field title="Escalation delay after due date · calendar days">
              <input
                type="number"
                min={0}
                max={365}
                value={escalationDays}
                onChange={(e) => setEscalationDays(Number(e.target.value))}
              />
            </Field>
            <details>
              <summary>
                Stage windows and designated escalation hierarchy · DEMO
                calendar days
              </summary>
              <p className="muted">
                Blank windows use the default deadline. Overdue work remains
                visible during escalation grace. No statutory holiday calendar
                is implemented.
              </p>
              <div className="filters">
                {[
                  "SCRUTINY",
                  "RESCRUTINY",
                  "RESPONSE",
                  "EVC_SCHEDULING",
                  "EVC_REPORT",
                  "SAC",
                  "SHC",
                  "AUTHORITY",
                  "DOCUMENT_REVIEW",
                ].map((stage) => (
                  <Field key={stage} title={label(stage) + " days"}>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={windows[stage] ?? ""}
                      placeholder={String(days)}
                      onChange={(e) => {
                        const next = { ...windows };
                        if (e.target.value)
                          next[stage] = Number(e.target.value);
                        else delete next[stage];
                        setWindows(next);
                      }}
                    />
                  </Field>
                ))}
              </div>
              {levels.map((level, index) => (
                <div className="filters" key={index}>
                  <Field title={"Level " + (index + 1) + " · days overdue"}>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={level.afterDays}
                      onChange={(e) =>
                        setLevels(
                          levels.map((x, i) =>
                            i === index
                              ? { ...x, afterDays: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field title="Designated role">
                    <select
                      value={level.role}
                      onChange={(e) =>
                        setLevels(
                          levels.map((x, i) =>
                            i === index ? { ...x, role: e.target.value } : x,
                          ),
                        )
                      }
                    >
                      {["SUPERVISOR", "BUREAU", "AUTHORITY"].map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              ))}
            </details>
          </fieldset>
          <section className="policy-scenario">
            <h3>Evaluate a fictional scenario</h3>
            <p className="fine-print">
              Simulation changes no case, policy publication or deadline. Toggle
              the actual guard inputs.
            </p>
            <label>
              <input
                type="checkbox"
                checked={simEvidence}
                onChange={(e) => setSimEvidence(e.target.checked)}
              />
              Accepted lease evidence present
            </label>
            <label>
              <input
                type="checkbox"
                checked={simDeficiency}
                onChange={(e) => setSimDeficiency(e.target.checked)}
              />
              Open deficiency remains
            </label>
            <label>
              <input
                type="checkbox"
                checked={simVisit}
                onChange={(e) => setSimVisit(e.target.checked)}
              />
              EVC completion report accepted
            </label>
            <label>
              <input
                type="checkbox"
                checked={simRecommendation}
                onChange={(e) => setSimRecommendation(e.target.checked)}
              />
              Current-attempt recommendation recorded
            </label>
          </section>
          <ErrorBox error={error} />
          {message && (
            <p role="status" className="success">
              {message}
            </p>
          )}
          <div className="button-row">
            <button
              className="secondary"
              disabled={!rule || busy}
              onClick={() => operate("simulate")}
            >
              Validate & simulate <Play size={15} />
            </button>
            {editor && (
              <button
                className="primary"
                disabled={busy}
                onClick={() => operate("create")}
              >
                Create next draft <Plus size={15} />
              </button>
            )}
            {editor && rule?.state === "DRAFT" && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => operate("save")}
              >
                Save selected draft
              </button>
            )}
            {publisher && rule?.state === "DRAFT" && (
              <button
                className="secondary stable"
                disabled={busy}
                onClick={() => operate("publish")}
              >
                Publish selected draft
              </button>
            )}
            {publisher && rule?.state === "PUBLISHED" && (
              <button
                className="ghost stable"
                disabled={busy}
                onClick={() => operate("retire")}
              >
                Retire selected version
              </button>
            )}
          </div>
          {simulation && (
            <div className="simulation">
              <Badge active>VALIDATED ROUTE</Badge>
              <div className="timeline">
                {simulation.route.map((s: string, i: number) => (
                  <div className="timeline-node" key={s}>
                    <span>{i + 1}</span>
                    <strong>{label(s)}</strong>
                  </div>
                ))}
              </div>
              <p>{simulation.authority}</p>
              {simulation.evaluation && (
                <div className="simulation-results">
                  <h3>Evaluated guards</h3>
                  <p>{simulation.evaluation.explanation}</p>
                  <h4>Submission</h4>
                  {simulation.evaluation.submissionBlockers.length ? (
                    <ul>
                      {simulation.evaluation.submissionBlockers.map(
                        (b: string) => (
                          <li key={b}>{b}</li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p>Configured submission checks clear for this scenario.</p>
                  )}
                  {simulation.evaluation.steps.map((step: any) => (
                    <div key={step.stage}>
                      <h4>
                        {label(step.stage)} <Status value={step.state} />
                      </h4>
                      <p>
                        Configured DEMO window: {step.windowDays} calendar days.
                        Illustrative due {date(step.illustrativeDue)} IST.
                      </p>
                      {step.blockers.length ? (
                        <ul>
                          {step.blockers.map((b: string) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>
                          Explicit authorized human action is still required.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <details open>
                <summary>Compare stored and proposed version</summary>
                <div className="form-grid">
                  <pre>
                    {JSON.stringify(simulation.comparison.previous, null, 2)}
                  </pre>
                  <pre>
                    {JSON.stringify(simulation.comparison.proposed, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </Panel>
      </div>
      <Panel>
        <div className="section-heading">
          <div>
            <p className="eyebrow">PROVENANCE, NOT ASSUMPTION</p>
            <h2>Policy source register</h2>
          </div>
          <BookOpen className="orange" />
        </div>
        {data.data?.sources.map((s: any) => (
          <div className="source-row" key={s.id}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title}
              <ArrowUpRight size={16} />
            </a>
            <Badge>{s.status}</Badge>
            <p>{s.applicability}</p>
            <small>Retrieved {date(s.retrievedAt)}</small>
          </div>
        ))}
      </Panel>
    </>
  );
}
function Admin({ user }: { user: any }) {
  const data = useData("admin", "/admin");
  const options = useData("options", "/options");
  const q = useQueryClient();
  const [days, setDays] = useState(1);
  const [content, setContent] = useState("[]");
  const [format, setFormat] = useState("json");
  const [entity, setEntity] = useState("applications");
  const [preview, setPreview] = useState<any>();
  const [masterSource, setMasterSource] = useState<any>();
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const isAdmin = user.grants.some((g: any) => g.role === "ADMIN");
  const bureau = user.grants.some((g: any) => g.role === "BUREAU");
  async function action(url: string, payload: unknown) {
    try {
      const result = await post(url, payload);
      setError(null);
      q.invalidateQueries();
      return result;
    } catch (e) {
      setError(e);
    }
  }
  return (
    <>
      <Heading
        eyebrow="OPERATIONS WITHOUT HIDDEN AUTHORITY"
        title="Administration &"
        accent="local adapters."
      />
      <ErrorBox error={data.error ?? error} />
      <Panel>
        <h2>Create a technical user</h2>
        <p className="muted">
          New users start without grants. Only a separate bureau actor can grant
          regulatory access.
        </p>
        <form
          className="filters"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const r = await action("/admin/users", {
              name: f.get("name"),
              email: f.get("email"),
            });
            if (r)
              setMessage(
                `Created ${r.email}. Copy the one-time initial password: ${r.initialPassword}. No grants assigned.`,
              );
          }}
        >
          <Field title="User display name">
            <input name="name" minLength={3} required />
          </Field>
          <Field title="User email">
            <input name="email" type="email" required />
          </Field>
          <button className="secondary">Create user without grants</button>
        </form>
      </Panel>
      <div className="dashboard-grid">
        <Panel>
          <p className="eyebrow">HONEST INTEGRATION STATUS</p>
          <h2>Local adapter</h2>
          <Badge active>{data.data?.integrationMode ?? "Loading"}</Badge>
          <p>
            No live official AICTE connection is configured. Local import
            creates draft records and cannot overwrite decisions or bypass
            submission guards.
          </p>
          <a
            className="secondary"
            href="/api/integrations/export"
            target="_blank"
            rel="noreferrer"
          >
            Export authorized JSON <ArrowDownToLine size={16} />
          </a>
          <p className="scope-note">
            Institution imports record source, version, retrieval date and a
            checksum of normalized rows. Review the preview before commit.
            Existing and missing masters are never overwritten or deleted by
            this adapter.
          </p>
          <button
            className="secondary"
            type="button"
            onClick={async () => {
              try {
                const first = await api("/integrations/simulator/institutions");
                const second = first.nextCursor
                  ? await api(
                      "/integrations/simulator/institutions?cursor=" +
                        first.nextCursor,
                    )
                  : { records: [] };
                setEntity("institutions");
                setFormat("json");
                setContent(
                  JSON.stringify(
                    [...first.records, ...second.records],
                    null,
                    2,
                  ),
                );
                setMasterSource(first.source);
                setPreview(null);
                setError(null);
              } catch (e) {
                setError(e);
              }
            }}
          >
            Load fictional simulator sample
          </button>
          <p className="muted">
            {masterSource
              ? "FICTIONAL SIMULATION: local contract fixture, not an AICTE master list"
              : "UNVERIFIED LOCAL: no official source or approval provenance asserted"}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setPreview(
                await action(
                  entity === "applications"
                    ? "/integrations/import"
                    : "/integrations/master",
                  {
                    format,
                    content,
                    preview: true,
                    ...(entity === "institutions"
                      ? { provenance: masterSource }
                      : {}),
                    ...(entity === "applications" ? {} : { entity }),
                  },
                ),
              );
            }}
          >
            <Field title="Import format">
              <select
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value);
                  setPreview(null);
                  setMasterSource(undefined);
                }}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </Field>
            <Field title="Adapter entity">
              <select
                value={entity}
                onChange={(e) => {
                  setEntity(e.target.value);
                  setMasterSource(undefined);
                  setPreview(null);
                }}
              >
                <option value="applications">Application drafts</option>
                <option value="institutions">Institution master data</option>
                <option value="documentMetadata">
                  Pending document metadata
                </option>
              </select>
            </Field>
            <Field title="Local records">
              <textarea
                className="mono tall"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setMasterSource(undefined);
                  setPreview(null);
                }}
              />
            </Field>
            <p className="fine-print">
              Fields: externalId, institutionId, workflowId, category, cycle,
              contact, programme, intake.
            </p>
            <button className="secondary">Validate preview</button>
            {preview && (
              <>
                <pre>{JSON.stringify(preview, null, 2)}</pre>
                <button
                  type="button"
                  className="primary stable"
                  disabled={
                    entity === "institutions" &&
                    (!preview.reviewId ||
                      preview.results.some(
                        (r: any) => r.state === "CONFLICT_REVIEW_REQUIRED",
                      ))
                  }
                  onClick={async () => {
                    const r = await action(
                      entity === "applications"
                        ? "/integrations/import"
                        : "/integrations/master",
                      {
                        format,
                        content,
                        preview: false,
                        ...(entity === "institutions"
                          ? {
                              provenance: masterSource,
                              reviewId: preview.reviewId,
                            }
                          : {}),
                        ...(entity === "applications" ? {} : { entity }),
                      },
                    );
                    if (r) {
                      setPreview(r);
                      setMessage(
                        "Import completed; drafts still require institution submission.",
                      );
                    }
                  }}
                >
                  Commit validated import
                </button>
              </>
            )}
          </form>
          <details>
            <summary>Available institution and workflow IDs</summary>
            <pre>
              {JSON.stringify(
                {
                  institutions: options.data?.institutions.map((x: any) => ({
                    id: x.id,
                    name: x.name,
                  })),
                  workflows: options.data?.workflows.map((x: any) => ({
                    id: x.id,
                    name: x.name,
                  })),
                },
                null,
                2,
              )}
            </pre>
          </details>
        </Panel>
        <Panel>
          <p className="eyebrow">ISOLATED BUSINESS TIME</p>
          <h2>Demonstration controls</h2>
          <p>
            Business time: <strong>{date(data.data?.clock?.now)} IST</strong>
          </p>
          <p className="mono wrap">Run: {data.data?.clock?.runId}</p>
          <p className="muted">
            Advancing this clock triggers the separate worker’s durable deadline
            scanner. Authentication and queue leases use real time.
          </p>
          {isAdmin && data.data?.demo && (
            <>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const r = await action("/admin/clock", { days });
                  if (r)
                    setMessage(
                      "Business clock advanced. The worker will scan persisted deadlines.",
                    );
                }}
              >
                <Field title="Advance calendar days">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  />
                </Field>
                <button className="primary">
                  Advance demo time <Clock size={16} />
                </button>
              </form>
              <details>
                <summary>Start a fresh isolated demo run</summary>
                <p>
                  Preserves previous history, creates 120 fictional cases and
                  supersedes previous-run reminders. Type NEW_DEMO_RUN.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const r = await action("/admin/reset", {
                      confirm: new FormData(e.currentTarget).get("confirm"),
                    });
                    if (r)
                      setMessage(
                        "New run created; historical records preserved.",
                      );
                  }}
                >
                  <Field title="Confirmation text">
                    <input name="confirm" required pattern="NEW_DEMO_RUN" />
                  </Field>
                  <button className="secondary stable">
                    Create new demo run
                  </button>
                </form>
              </details>
            </>
          )}
          {message && (
            <p role="status" className="success">
              {message}
            </p>
          )}
          <div className="scope-note">
            <ShieldCheck size={22} />
            <p>
              Technical administration does not imply regulatory decision or
              policy-publication authority.
            </p>
          </div>
        </Panel>
      </div>
      {bureau && (
        <Panel>
          <h2>Explicit role grants</h2>
          <p className="muted">
            Self-grants are denied. A grant change invalidates the recipient’s
            existing sessions.
          </p>
          <form
            className="filters"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const body: any = Object.fromEntries(
                [...f].filter(([, v]) => !!v),
              );
              body.global = f.get("global") === "on";
              const r = await action("/admin/grants", body);
              if (r) setMessage("Grant saved; previous sessions invalidated.");
            }}
          >
            <Field title="User">
              <select name="userId">
                {data.data?.users
                  .filter((u: any) => u.id !== user.id)
                  .map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field title="Role">
              <select name="role">
                {[
                  "REVIEWER",
                  "SUPERVISOR",
                  "COMMITTEE",
                  "AUTHORITY",
                  "AUDITOR",
                  "ADMIN",
                  "INSTITUTION",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field title="Region restriction">
              <select name="regionId">
                <option value="">None</option>
                {options.data?.regions.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Institution restriction (required for institution role)">
              <select name="institutionId">
                <option value="">None</option>
                {options.data?.institutions.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field title="Committee stage">
              <select name="committee">
                <option value="">None</option>
                {["EVC", "SAC", "SHC"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <label>
              <input name="global" type="checkbox" /> Explicit global scope
              (leave region and institution blank)
            </label>
            <button className="secondary stable">Grant role</button>
          </form>
        </Panel>
      )}
      <Panel>
        <h2>Synchronization history</h2>
        {data.data?.syncs.length ? (
          data.data.syncs.map((s: any) => (
            <details key={s.id}>
              <summary>
                {date(s.createdAt)} · {s.preview ? "Preview" : "Commit"} ·{" "}
                {s.mode}
              </summary>
              <pre>{JSON.stringify(s.result, null, 2)}</pre>
            </details>
          ))
        ) : (
          <Empty>No local imports have run.</Empty>
        )}
      </Panel>
    </>
  );
}
function Profile({ user }: { user: any }) {
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  return (
    <>
      <Heading
        eyebrow="YOUR LOCAL ACCOUNT"
        title="Profile &"
        accent="security."
      />
      <div className="dashboard-grid">
        <Panel>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          {user.grants.map((g: any) => (
            <div className="scope-note" key={g.id}>
              <ShieldCheck size={20} />
              <span>
                {g.role} ·{" "}
                {g.regionId ??
                  g.institutionId ??
                  g.committee ??
                  "Explicit global grant"}
              </span>
            </div>
          ))}
        </Panel>
        <Panel>
          <h2>Change password</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await post("/password", {
                  current: f.get("current"),
                  password: f.get("password"),
                });
                setMessage("Password changed. Other sessions are invalidated.");
                setError(null);
              } catch (e) {
                setError(e);
              }
            }}
          >
            <Field title="Current password">
              <input
                type="password"
                name="current"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field title="New password (12+ characters)">
              <input
                type="password"
                name="password"
                autoComplete="new-password"
                required
                minLength={12}
              />
            </Field>
            <ErrorBox error={error} />
            {message && <p role="status">{message}</p>}
            <button className="primary stable">Change password</button>
          </form>
        </Panel>
      </div>
    </>
  );
}
function Gallery() {
  if (!import.meta.env.DEV)
    return <Empty>Component gallery is available in development only.</Empty>;
  return (
    <>
      <Heading
        eyebrow="DEVELOPMENT COMPONENT GALLERY"
        title="Material &"
        accent="motion."
      />
      <Orb />
      <Panel>
        <div className="button-row">
          <button className="primary">Primary</button>
          <button className="secondary">Secondary</button>
          <Badge active>Active</Badge>
          <Badge>Pending</Badge>
        </div>
        <Field title="Labelled input">
          <input placeholder="Visible instruction" />
        </Field>
        <div className="timeline">
          <div className="timeline-node current">
            <span>01</span>
            <strong>Active stage</strong>
          </div>
        </div>
      </Panel>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
