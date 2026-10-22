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
const PdfPreview = React.lazy(() => import("./PdfPreview.tsx"));
let csrf = "";
async function api(url: string, options: RequestInit = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch("/api" + url, {
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      "X-CSRF-Token": csrf,
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed");
  if (data.csrf) csrf = data.csrf;
  return data;
}
const post = (url: string, data: unknown) =>
  api(url, { method: "POST", body: JSON.stringify(data) });
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
function useData(key: string, url: string, enabled = true) {
  return useQuery<any>({
    queryKey: [key, url],
    queryFn: () => api(url),
    enabled,
  });
}
const date = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not assigned";
const label = (s: string) =>
  s
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
  return (
    <label className="field">
      <span>{title}</span>
      {children}
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
  ["/overview", "Overview", LayoutDashboard],
  ["/applications", "Applications", FolderOpen],
  ["/evc", "EVC scheduling", CalendarDays],
  ["/committees", "Committee work", Users],
  ["/compliance", "Undertakings", FileCheck2],
  ["/documents", "Document registry", FileText],
  ["/alerts", "Alerts & delivery", Bell],
  ["/reports", "Reports & audit", Activity],
  ["/rules", "Rules & policy", GitBranch],
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
    events.addEventListener("ready", () => setConnected("Live"));
    events.addEventListener("refresh", (e) => {
      setConnected("Live");
      const d = JSON.parse((e as MessageEvent).data);
      const next = d.revision + ":" + d.count;
      if (revision && next !== revision)
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
            <Badge active={connected === "Live"}>
              <span className="tiny-dot" />
              {connected}
            </Badge>
            <button
              className="icon-button ghost"
              aria-label={
                refresh ? "Pause live refresh" : "Resume live refresh"
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
            <button
              className="icon-button ghost"
              aria-label={
                motion ? "Pause decorative motion" : "Resume decorative motion"
              }
              onClick={() => setMotion(!motion)}
            >
              {motion ? <Sparkles size={16} /> : <Play size={16} />}
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
            <Route path="/" element={<Overview user={user} />} />
            <Route path="/overview" element={<Overview user={user} />} />
            <Route path="/applications" element={<Register user={user} />} />
            <Route path="/applications/new" element={<Wizard />} />
            <Route
              path="/applications/:id"
              element={<ApplicationWorkspace user={user} />}
            />
            <Route path="/evc" element={<Evc user={user} />} />
            <Route
              path="/committees"
              element={<Register user={user} committee />}
            />
            <Route path="/compliance" element={<Compliance user={user} />} />
            <Route path="/documents" element={<Documents user={user} />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
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
function Overview({ user }: { user: any }) {
  const { data: d, isPending, error } = useData("dashboard", "/dashboard");
  const recent = useData("recent", "/applications?limit=5");
  const options = useData("options", "/options");
  if (isPending) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  const metrics = [
    [
      "Open applications",
      d.open,
      FolderOpen,
      "/applications?open=true",
      "Awaiting the next action",
    ],
    [
      "Overdue cases",
      d.overdue,
      Clock,
      "/applications?overdue=true",
      "Requires scoped follow-up",
    ],
    ["EVC in progress", d.evc, Users, "/evc", "From scheduling to report"],
    [
      "Open undertakings",
      d.obligations,
      FileCheck2,
      "/compliance",
      "Evidence is not acceptance",
    ],
  ] as const;
  return (
    <>
      <Heading
        eyebrow="A CLEARER VIEW. A BETTER NEXT STEP."
        title={`Welcome, ${user.name.split(" ")[0]}.`}
        accent="Let’s move work forward."
      >
        <Badge>
          DEMO ·{" "}
          {new Date(d.now).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}
        </Badge>
      </Heading>
      <div className="overview-banner panel">
        <div>
          <Badge active>CONNECTED APPROVAL WORKSPACE</Badge>
          <h2>
            From pending <span className="gradient">to accounted for.</span>
          </h2>
          <p>
            Every case has a stage. Every action has an owner.
            <br />
            Your authorized work, brought into focus.
          </p>
          <Link className="primary" to="/applications">
            Explore applications <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="mini-orb">
          <div className="orbit outer" />
          <div className="orbit inner" />
          <img src="/brand.svg" alt="" />
        </div>
        <div className="banner-footnote">
          Local database · Human decisions · Traceable evidence
        </div>
      </div>
      <div className="metric-grid">
        {metrics.map(([title, value, Icon, url, hint], i) => (
          <Link
            to={url}
            className={"metric panel " + (i === 0 ? "emphasis" : "")}
            key={title}
          >
            <div className="metric-top">
              <span>{title}</span>
              <ArrowUpRight size={16} />
            </div>
            <strong className="metric-number">
              {String(value).padStart(2, "0")}
            </strong>
            <p>{hint}</p>
            <Icon className="watermark" />
            <span className="corner" />
          </Link>
        ))}
      </div>
      <div className="metric-grid three">
        {[
          ["Upcoming deadlines", d.upcoming, "/applications?upcoming=true"],
          [
            "Pending evidence verification",
            d.pendingEvidence,
            "/documents?review=PENDING",
          ],
          [
            "Expiring / expired documents",
            d.documents,
            "/documents?validity=ATTENTION",
          ],
        ].map(([title, value, url]) => (
          <Link className="panel metric" to={String(url)} key={String(title)}>
            <div className="metric-top">
              <span>{title}</span>
              <ArrowUpRight size={16} />
            </div>
            <strong className="metric-number">{value}</strong>
            <p>Persisted records · seven-day attention window</p>
          </Link>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel>
          <div className="section-heading">
            <div>
              <p className="eyebrow">APPLICATION MOVEMENT</p>
              <h2>Where work stands</h2>
            </div>
            <GitBranch className="orange" size={20} />
          </div>
          <p className="muted">
            Persisted stage counts · select a stage to inspect its cases.
          </p>
          <div className="stage-bars">
            {Object.entries(d.counts).map(([stage, count]: [string, any]) => (
              <Link key={stage} to={"/applications?state=" + stage}>
                <span>{label(stage)}</span>
                <div className="bar-track">
                  <div
                    style={{
                      width: `${Math.max(3, (count / Math.max(...(Object.values(d.counts) as number[]))) * 100)}%`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR NEXT ACTION</p>
              <h2>Keep the journey moving</h2>
            </div>
            <Activity size={20} className="orange" />
          </div>
          <div className="next-step">
            <span className="step-circle">01</span>
            <div>
              <strong>Review your work queue</strong>
              <p>
                Open the case brief to see what is blocking progress and which
                evidence is required.
              </p>
              <Link to="/applications">
                View authorized cases <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <div className="next-step">
            <span className="step-circle">02</span>
            <div>
              <strong>Check approaching deadlines</strong>
              <p>
                Business clock: {date(d.now)} IST. Deadline policies are
                labelled demo assumptions.
              </p>
              <Link to="/alerts">
                Open alerts <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <div className="scope-note">
            <ShieldCheck size={18} />
            <span>
              Counts use your institution, region and assignment grants.
            </span>
          </div>
        </Panel>
      </div>
      <Panel>
        <div className="section-heading">
          <div>
            <p className="eyebrow">RECENTLY UPDATED</p>
            <h2>Applications in focus</h2>
          </div>
          <Link to="/applications" className="text-link">
            View register <ArrowRight size={16} />
          </Link>
        </div>
        <ApplicationTable
          items={recent.data?.items ?? []}
          users={options.data?.users ?? []}
        />
      </Panel>
      <p className="freshness">
        Database snapshot {date(d.updatedAt)} IST · {d.total} authorized
        applications
      </p>
      <div className="dashboard-grid">
        <Panel>
          <p className="eyebrow">OWNERSHIP, NOT BLAME</p>
          <h2>Workload distribution</h2>
          <div className="stage-bars">
            {d.workload.map(([owner, count]: [string, number]) => (
              <Link
                key={owner}
                to={
                  owner === "Unassigned"
                    ? "/applications"
                    : "/applications?owner=" + owner
                }
              >
                <span>
                  {options.data?.users.find((u: any) => u.id === owner)?.name ??
                    (owner === user.id
                      ? "You"
                      : owner === "Unassigned"
                        ? "Unassigned"
                        : "Assigned official")}
                </span>
                <div className="bar-track">
                  <div
                    style={{
                      width: `${(count / Math.max(1, d.total)) * 100}%`,
                    }}
                  />
                </div>
                <strong>{count}</strong>
              </Link>
            ))}
          </div>
          <p className="fine-print">
            Each assigned-owner count drills into its matching filtered
            register.
          </p>
        </Panel>
        <Panel>
          <p className="eyebrow">
            SEPARATE CLOCKS FOR DIFFERENT RESPONSIBILITIES
          </p>
          <h2>Case ageing</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Total days</th>
                  <th>Institution wait</th>
                  <th>Official stage</th>
                </tr>
              </thead>
              <tbody>
                {d.ageing.map((x: any) => (
                  <tr key={x.id}>
                    <td>
                      <Link
                        className="orange mono"
                        to={"/applications/" + x.id}
                      >
                        {x.reference}
                      </Link>
                    </td>
                    <td>{x.totalDays.toFixed(1)}</td>
                    <td>{x.institutionDays.toFixed(1)}</td>
                    <td>{x.officialDays.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="fine-print">
            Recorded stage intervals; unrecorded historical intervals are not
            inferred. Total age alone does not attribute delay to an officer.
          </p>
        </Panel>
      </div>
    </>
  );
}
function ApplicationTable({
  items,
  users = [],
}: {
  items: any[];
  users?: any[];
}) {
  if (!items.length) return <Empty />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Application / institution</th>
            <th>Category</th>
            <th>Current stage</th>
            <th>Due · IST</th>
            <th>Owner</th>
            <th>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((x) => (
            <tr key={x.id}>
              <td>
                <Link className="mono orange" to={"/applications/" + x.id}>
                  {x.reference}
                </Link>
                <small>{x.institution.name}</small>
              </td>
              <td>
                {label(x.category)}
                <small>{x.cycle}</small>
              </td>
              <td>
                <Badge
                  active={["SCRUTINY", "EVC", "RESCRUTINY"].includes(x.state)}
                >
                  {label(x.state)}
                </Badge>
              </td>
              <td className="mono">{date(x.dueAt)}</td>
              <td>
                {users.find((u) => u.id === x.ownerId)?.name ??
                  (x.ownerId ? "Assigned" : "Unassigned")}
              </td>
              <td>
                <Link
                  to={"/applications/" + x.id}
                  className="icon-button ghost"
                  aria-label={"Open " + x.reference}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Register({
  user,
  committee = false,
}: {
  user: any;
  committee?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const q = useQueryClient();
  const options = useData("options", "/options");
  const query = new URLSearchParams(params);
  if (committee && !query.has("state"))
    query.set(
      "state",
      user.grants.find((g: any) => g.committee)?.committee ?? "SAC",
    );
  const data = useData("register", "/applications?" + query.toString());
  function filter(k: string, v: string) {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    next.delete("page");
    setParams(next);
  }
  return (
    <>
      <Heading
        eyebrow={
          committee
            ? "RECOMMENDATIONS REQUIRE HUMAN OVERSIGHT"
            : "A SINGLE REGISTER. A TRACEABLE JOURNEY."
        }
        title={committee ? "Committee" : "Application"}
        accent={committee ? "work." : "register."}
      >
        {user.grants.some((g: any) => g.role === "INSTITUTION") && (
          <Link to="/applications/new" className="primary">
            <Plus size={18} />
            New application
          </Link>
        )}
      </Heading>
      <Panel>
        <form
          className="filters"
          onSubmit={(e) => {
            e.preventDefault();
            filter("q", search);
          }}
        >
          <Field title="Search reference or institution">
            <div className="search-input">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find an application…"
              />
            </div>
          </Field>
          <Field title="Stage">
            <select
              value={query.get("state") ?? ""}
              onChange={(e) => filter("state", e.target.value)}
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
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field title="Region">
            <select
              value={params.get("region") ?? ""}
              onChange={(e) => filter("region", e.target.value)}
            >
              <option value="">Authorized regions</option>
              {options.data?.regions.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field title="Category">
            <select
              value={params.get("category") ?? ""}
              onChange={(e) => filter("category", e.target.value)}
            >
              <option value="">All categories</option>
              {["NEW_INSTITUTION", "EXTENSION", "CHANGE"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <button className="secondary" type="submit">
            Search
          </button>
        </form>
        <details className="advanced">
          <summary>More filters & sorting</summary>
          <div className="filters">
            {[
              ["institution", "Institution", options.data?.institutions ?? []],
              ["owner", "Owner", options.data?.users ?? []],
            ].map(([key, title, items]: any) => (
              <Field title={title} key={key}>
                <select
                  value={params.get(key) ?? ""}
                  onChange={(e) => filter(key, e.target.value)}
                >
                  <option value="">All authorized</option>
                  {items.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
            <Field title="Cycle">
              <input
                placeholder="2026-27"
                value={params.get("cycle") ?? ""}
                onChange={(e) => filter("cycle", e.target.value)}
              />
            </Field>
            {["from", "to"].map((k) => (
              <Field
                title={k === "from" ? "Created from" : "Created through"}
                key={k}
              >
                <input
                  type="date"
                  value={params.get(k) ?? ""}
                  onChange={(e) => filter(k, e.target.value)}
                />
              </Field>
            ))}
            <Field title="Sort">
              <select
                value={params.get("sort") ?? "updatedAt"}
                onChange={(e) => filter("sort", e.target.value)}
              >
                {["updatedAt", "createdAt", "reference", "dueAt", "state"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </Field>
            <Field title="Direction">
              <select
                value={params.get("direction") ?? "desc"}
                onChange={(e) => filter("direction", e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </Field>
            <button
              className="ghost"
              type="button"
              onClick={() => {
                setParams({});
                setSearch("");
              }}
            >
              Clear filters
            </button>
          </div>
        </details>
        {params.get("overdue") && <Badge active>Overdue work only</Badge>}
        {data.isPending ? (
          <Loading />
        ) : data.error ? (
          <ErrorBox error={data.error} />
        ) : (
          <>
            <ApplicationTable
              items={data.data.items}
              users={options.data?.users}
            />
            <div className="pagination">
              <span>
                {data.data.total} matching records · page {data.data.page}
              </span>
              <button
                className="ghost"
                disabled={data.data.page <= 1}
                onClick={() => {
                  const n = new URLSearchParams(params);
                  n.set("page", String(data.data.page - 1));
                  setParams(n);
                }}
              >
                Previous
              </button>
              <button
                className="secondary"
                disabled={data.data.page * data.data.limit >= data.data.total}
                onClick={() => {
                  const n = new URLSearchParams(params);
                  n.set("page", String(data.data.page + 1));
                  setParams(n);
                }}
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </Panel>
    </>
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
  const [tab, setTab] = useState("evidence");
  const [message, setMessage] = useState("");
  const [retryKey, setRetryKey] = useState("");
  const [retryBody, setRetryBody] = useState("");
  const r = data.data;
  const versions =
    r?.documents.flatMap((d: any) =>
      d.versions
        .slice(0, 1)
        .map((v: any) => ({ ...v, title: d.title, kind: d.kind })),
    ) ?? [];
  const version = versions.find((v: any) => v.id === selected) ?? versions[0];
  const effectiveCmd = r?.allowedActions.includes(cmd)
    ? cmd
    : (r?.allowedActions[0] ?? "");
  async function execute(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body = {
        command: effectiveCmd,
        expectedVersion: r.version,
        reason,
        ...(["raise-deficiency", "return-with-reason"].includes(effectiveCmd)
          ? { item }
          : {}),
        ...(["submit-response", "verify-response"].includes(effectiveCmd)
          ? {
              deficiencyId:
                deficiencyId ||
                r.deficiencies.find((x: any) => x.state !== "ACCEPTED")?.id,
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
          ? { condition, dueAt: new Date(dueAt).toISOString() }
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
      <Heading eyebrow={r.reference} title={r.institution.name} accent="">
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
      <div className="context-strip panel">
        <div>
          <small>CURRENT STAGE</small>
          <Badge active>{label(r.state)}</Badge>
        </div>
        <div>
          <small>RESPONSIBLE OWNER</small>
          <strong>
            {options.data?.users.find((u: any) => u.id === r.ownerId)?.name ??
              (r.ownerId === user.id ? "You" : "Assigned official")}
          </strong>
        </div>
        <div>
          <small>DEADLINE · IST</small>
          <strong className="mono">{date(r.dueAt)}</strong>
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
          <h2>Every step, visible.</h2>
          <div className="timeline">
            {["DRAFT", ...config.stages].map((s: string, i: number) => (
              <div
                key={s}
                className={
                  "timeline-node " +
                  (r.state === s ||
                  (r.state === "RESCRUTINY" && s === "SCRUTINY")
                    ? "current"
                    : "")
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
                  {d.responses.map((x: any) => (
                    <blockquote key={x.id}>
                      {x.text}
                      <small className="mono">
                        Evidence {x.documentVersionId}
                      </small>
                    </blockquote>
                  ))}
                </div>
              ))
            ) : (
              <Empty>No deficiencies have been raised.</Empty>
            )
          ) : (
            <div className="audit-list">
              {r.history.map((h: any) => (
                <article key={h.id}>
                  <span className="audit-dot" />
                  <div>
                    <strong>{label(h.action)}</strong>
                    <p>{h.reason}</p>
                    <small>
                      {date(h.createdAt)} IST · {h.visibility}
                    </small>
                    <code>
                      {h.fromState ?? "—"} → {h.toState}
                    </code>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
        <div className="action-column">
          <Panel className="active-module">
            <div className="section-heading">
              <div>
                <p className="eyebrow">CLEAR CONTEXT. CONFIDENT ACTION.</p>
                <h2>What happens next?</h2>
              </div>
              <Workflow size={23} className="orange" />
            </div>
            <div className="case-brief">
              <strong>Why blocked?</strong>
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
                  Evidence guards are satisfied. The authorized next actor may
                  proceed.
                </p>
              )}
              <strong>Who acts next?</strong>
              <p>
                {r.brief.whoNext === user.id
                  ? "You are assigned."
                  : r.state === "AWAITING_RESPONSE"
                    ? "Institution representative"
                    : (r.brief.ownerName ??
                      "Unassigned — scoped coordinator must assign an eligible official")}
              </p>
              <strong>What is due?</strong>
              <p>{date(r.dueAt)} IST</p>
            </div>
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
                    <input
                      value={item}
                      onChange={(e) => setItem(e.target.value)}
                      required
                    />
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
                        .filter((d: any) => d.state !== "ACCEPTED")
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
                      onChange={(e) => setOutcome(e.target.value)}
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
                      <Field title="Condition due (your browser timezone)">
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
function Evc({ user }: { user: any }) {
  const visits = useData("visits", "/visits");
  const queue = useData("evcQueue", "/applications?state=EVC&limit=100");
  const options = useData("options", "/options");
  const q = useQueryClient();
  const [application, setApplication] = useState("");
  const [visitId, setVisitId] = useState("");
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState<Record<string, string>>({});
  const coordinator = user.grants.some((g: any) =>
    ["SUPERVISOR", "BUREAU"].includes(g.role),
  );
  const committee = user.grants.some(
    (g: any) => g.role === "COMMITTEE" && g.committee === "EVC",
  );
  async function act(id: string, op: string) {
    setBusy(true);
    try {
      await post(`/visits/${id}/${op}`, { reason: reason[id] ?? "" });
      q.invalidateQueries();
      setError(null);
      setMessage("Visit action persisted with history.");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="VISITS WITH A CLEAR NEXT STEP"
        title="Expert visits."
        accent="Coordinated."
      />
      <div className="metric-grid three">
        <Panel>
          <CalendarDays className="orange" />
          <h3>Awaiting scheduling</h3>
          <strong className="metric-number">
            {queue.data?.items.filter(
              (a: any) =>
                !visits.data?.some((v: any) => v.applicationId === a.id),
            ).length ?? "—"}
          </strong>
        </Panel>
        <Panel>
          <Clock className="orange" />
          <h3>Proposed / confirmed</h3>
          <strong className="metric-number">
            {visits.data?.filter((v: any) =>
              ["PROPOSED", "CONFIRMED", "RESCHEDULED"].includes(v.state),
            ).length ?? "—"}
          </strong>
        </Panel>
        <Panel>
          <FileCheck2 className="orange" />
          <h3>Report review pending</h3>
          <strong className="metric-number">
            {visits.data?.filter((v: any) => v.state === "REPORT_PENDING")
              .length ?? "—"}
          </strong>
        </Panel>
      </div>
      <div className="dashboard-grid">
        <Panel>
          <div className="section-heading">
            <div>
              <p className="eyebrow">ELIGIBLE AFTER PRECEDING STAGES</p>
              <h2>EVC queue</h2>
            </div>
            <Users className="orange" />
          </div>
          <p className="muted">
            New-institution cases are explicitly labelled. Scheduling does not
            complete the stage.
          </p>
          {queue.isPending ? (
            <Loading />
          ) : queue.data?.items.length ? (
            queue.data.items.map((a: any) => (
              <div className="queue-row" key={a.id}>
                <Link to={"/applications/" + a.id}>
                  <strong className="mono orange">{a.reference}</strong>
                  <small>{a.institution.name}</small>
                </Link>
                <Badge>{label(a.category)}</Badge>
                {coordinator && (
                  <button
                    className="ghost"
                    onClick={() => {
                      setApplication(a.id);
                      setVisitId("");
                    }}
                  >
                    Schedule <ArrowRight size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel>
          <p className="eyebrow">ALL TIMES SHOWN IN IST</p>
          <h2>
            {coordinator
              ? "Schedule a visit"
              : committee
                ? "Declare your availability"
                : "EVC coordination"}
          </h2>
          <p className="muted">
            One assigned eligible member is a demo quorum assumption.
            Availability and overlapping reservations are checked on the server.
          </p>
          {coordinator ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                const f = new FormData(e.currentTarget);
                try {
                  await post(
                    `/applications/${application || queue.data.items[0]?.id}/visits`,
                    {
                      mode: f.get("mode"),
                      startAt: new Date(String(f.get("startAt"))).toISOString(),
                      endAt: new Date(String(f.get("endAt"))).toISOString(),
                      participants: f.getAll("participants"),
                      metadata: f.get("metadata"),
                      reason: f.get("reason"),
                      ...(visitId ? { visitId } : {}),
                    },
                  );
                  q.invalidateQueries();
                  setError(null);
                  setMessage(
                    "Reservation persisted. Confirm the visit as the next step.",
                  );
                } catch (e) {
                  setError(e);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field title="Eligible application">
                <select
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                >
                  <option value="">First eligible case</option>
                  {queue.data?.items.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.reference} · {a.institution.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field title="Visit mode">
                <select name="mode">
                  {["PHYSICAL", "ONLINE", "HYBRID"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <div className="form-grid">
                <Field title="Start (browser timezone)">
                  <input type="datetime-local" name="startAt" required />
                </Field>
                <Field title="End (browser timezone)">
                  <input type="datetime-local" name="endAt" required />
                </Field>
              </div>
              <fieldset>
                <legend>Assigned EVC participants</legend>
                {options.data?.users
                  .filter((u: any) =>
                    u.grants.some(
                      (g: any) =>
                        g.role === "COMMITTEE" && g.committee === "EVC",
                    ),
                  )
                  .map((u: any) => (
                    <label className="check-label" key={u.id}>
                      <input type="checkbox" name="participants" value={u.id} />
                      {u.name}
                    </label>
                  ))}
              </fieldset>
              <Field title="Venue / meeting metadata">
                <input name="metadata" required minLength={3} />
              </Field>
              <Field title="Scheduling / rescheduling reason">
                <textarea name="reason" required minLength={5} />
              </Field>
              {visitId && <Badge>Rescheduling {visitId.slice(0, 8)}</Badge>}
              <button className="primary" disabled={busy}>
                {busy
                  ? "Saving…"
                  : visitId
                    ? "Save reasoned reschedule"
                    : "Propose visit"}
              </button>
            </form>
          ) : committee ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                try {
                  await post("/availability", {
                    startAt: new Date(String(f.get("startAt"))).toISOString(),
                    endAt: new Date(String(f.get("endAt"))).toISOString(),
                  });
                  setMessage("Availability stored.");
                  setError(null);
                } catch (e) {
                  setError(e);
                }
              }}
            >
              <Field title="Available from (browser timezone)">
                <input type="datetime-local" name="startAt" required />
              </Field>
              <Field title="Available through (browser timezone)">
                <input type="datetime-local" name="endAt" required />
              </Field>
              <button className="secondary">Save availability</button>
            </form>
          ) : (
            <div className="scope-note">
              <Shield size={20} />
              Your grants provide a scoped view. Coordinators manage
              appointments; assigned members submit reports.
            </div>
          )}
          <ErrorBox error={error} />
          {message && (
            <p role="status" className="success">
              {message}
            </p>
          )}
        </Panel>
      </div>
      <Panel>
        <div className="section-heading">
          <div>
            <p className="eyebrow">AGENDA & REPORTS</p>
            <h2>The visit lifecycle</h2>
          </div>
          <Badge>PROPOSE → CONFIRM → REPORT → REVIEW</Badge>
        </div>
        {visits.isPending ? (
          <Loading />
        ) : visits.data?.length ? (
          visits.data.map((v: any) => (
            <div className="visit-card" key={v.id}>
              <div className="section-heading">
                <div>
                  <Link
                    className="mono orange"
                    to={"/applications/" + v.applicationId}
                  >
                    {v.application.reference}
                  </Link>
                  <h3>{v.application.institution.name}</h3>
                </div>
                <Badge active>{v.state}</Badge>
              </div>
              <div className="form-grid">
                <p>
                  <CalendarDays size={16} /> {date(v.startAt)} — {date(v.endAt)}{" "}
                  IST
                </p>
                <p>
                  {v.mode} · {v.metadata}
                </p>
              </div>
              <p className="muted">
                {v.reservations.filter((r: any) => r.active).length} active
                participant(s) · {v.reason}
              </p>
              {v.report && <blockquote>{v.report}</blockquote>}
              {(coordinator || committee) &&
                !["COMPLETED", "CANCELLED"].includes(v.state) && (
                  <>
                    <Field
                      title={
                        v.state === "CONFIRMED"
                          ? "Report / reason"
                          : "Recorded reason"
                      }
                    >
                      <textarea
                        value={reason[v.id] ?? ""}
                        onChange={(e) =>
                          setReason({ ...reason, [v.id]: e.target.value })
                        }
                      />
                    </Field>
                    <div className="button-row">
                      {coordinator &&
                        ["PROPOSED", "RESCHEDULED"].includes(v.state) && (
                          <button
                            className="secondary stable"
                            disabled={busy}
                            onClick={() => act(v.id, "confirm")}
                          >
                            Confirm visit
                          </button>
                        )}
                      {committee &&
                        v.state === "CONFIRMED" &&
                        v.reservations.some(
                          (r: any) => r.userId === user.id && r.active,
                        ) && (
                          <button
                            className="secondary stable"
                            disabled={busy}
                            onClick={() => act(v.id, "report")}
                          >
                            Submit report
                          </button>
                        )}
                      {coordinator && v.state === "REPORT_PENDING" && (
                        <button
                          className="primary stable"
                          disabled={busy}
                          onClick={() => act(v.id, "complete")}
                        >
                          Accept completion report
                        </button>
                      )}
                      {coordinator && (
                        <button
                          className="ghost"
                          onClick={() => {
                            setApplication(v.applicationId);
                            setVisitId(v.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Reschedule
                        </button>
                      )}
                      {coordinator && (
                        <button
                          className="ghost"
                          disabled={busy}
                          onClick={() => act(v.id, "cancel")}
                        >
                          Cancel appointment
                        </button>
                      )}
                    </div>
                  </>
                )}
              <details>
                <summary>Previous appointment dates</summary>
                <pre>{JSON.stringify(v.history, null, 2)}</pre>
              </details>
            </div>
          ))
        ) : (
          <Empty>No visits scheduled in your scope.</Empty>
        )}
      </Panel>
    </>
  );
}
function Compliance({ user }: { user: any }) {
  const data = useData("obligations", "/obligations");
  return (
    <>
      <Heading
        eyebrow="APPROVAL IS ONLY PART OF THE JOURNEY"
        title="Every condition."
        accent="Still in view."
      />
      <p className="intro-note">
        Conditional decisions can coexist with open undertakings. Uploading
        evidence never closes an obligation automatically.
      </p>
      {data.isPending ? (
        <Loading />
      ) : data.error ? (
        <ErrorBox error={data.error} />
      ) : data.data.length ? (
        <div className="obligation-grid">
          {data.data.map((o: any) => (
            <ObligationCard o={o} user={user} key={o.id} />
          ))}
        </div>
      ) : (
        <Panel>
          <Empty>No undertakings in your authorized scope.</Empty>
        </Panel>
      )}
    </>
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
  const allowed = [
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
                  ? { dueAt: new Date(due).toISOString() }
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
            <Field title="Revised due (browser timezone)">
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
function Documents({ user }: { user: any }) {
  const [params, setParams] = useSearchParams();
  const data = useData("documents", "/documents");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<unknown>();
  const [reason, setReason] = useState<Record<string, string>>({});
  const q = useQueryClient();
  const reviewer = user.grants.some((g: any) =>
    ["REVIEWER", "SUPERVISOR", "BUREAU"].includes(g.role),
  );
  const opts = useData("options", "/options");
  const now = opts.data?.now ?? new Date().toISOString();
  async function review(id: string, outcome: string) {
    try {
      await post("/documents/" + id + "/review", {
        outcome,
        reason: reason[id] ?? "",
      });
      setError(null);
      q.invalidateQueries();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <>
      <Heading
        eyebrow="PRIVATE EVIDENCE. VISIBLE LINEAGE."
        title="Document"
        accent="registry."
      />
      <Panel>
        <div className="form-grid">
          <Field title="Verification filter">
            <select
              value={params.get("review") ?? ""}
              onChange={(e) => {
                const n = new URLSearchParams(params);
                e.target.value
                  ? n.set("review", e.target.value)
                  : n.delete("review");
                setParams(n);
              }}
            >
              <option value="">All review states</option>
              {["PENDING", "ACCEPTED", "REJECTED"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field title="Validity filter">
            <select
              value={params.get("validity") ?? ""}
              onChange={(e) => {
                const n = new URLSearchParams(params);
                e.target.value
                  ? n.set("validity", e.target.value)
                  : n.delete("validity");
                setParams(n);
              }}
            >
              <option value="">All validity states</option>
              <option value="ATTENTION">
                Expiring or expired within seven-day window
              </option>
            </select>
          </Field>
        </div>
        <Field title="Search title or reference">
          <div className="search-input">
            <Search size={18} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search authorized documents…"
            />
          </div>
        </Field>
        <ErrorBox error={error} />
        {data.isPending ? (
          <Loading />
        ) : data.error ? (
          <ErrorBox error={data.error} />
        ) : (
          data.data
            .filter(
              (d: any) =>
                (!params.get("review") ||
                  d.versions[0]?.reviewState === params.get("review")) &&
                (!params.get("validity") ||
                  ["EXPIRED", "EXPIRING"].includes(d.compliance?.status)),
            )
            .filter((d: any) =>
              (d.title + " " + d.application.reference)
                .toLowerCase()
                .includes(filter.toLowerCase()),
            )
            .map((d: any) => {
              const v = d.versions[0];
              const validity = d.compliance?.status ?? "NO_ACCEPTED_VERSION";
              return (
                <div className="document-card" key={d.id}>
                  <div className="section-heading">
                    <div>
                      <Link
                        className="mono orange"
                        to={"/applications/" + d.applicationId}
                      >
                        {d.application.reference}
                      </Link>
                      <h2>{d.title}</h2>
                      <p>{d.application.institution.name}</p>
                    </div>
                    <FileText className="orange" />
                  </div>
                  <div className="button-row">
                    <Badge active={validity !== "CURRENT"}>{validity}</Badge>
                    <Badge>{v?.reviewState ?? "No file"}</Badge>
                    <Badge>{v?.scanState}</Badge>
                    <span className="mono">
                      Effective v{d.compliance?.effective?.number ?? "—"} ·
                      valid through {date(d.compliance?.effective?.validUntil)}{" "}
                      IST
                    </span>
                  </div>
                  <div className="lineage-row">
                    <span>
                      Newest submission v{v?.number} · {v?.mime}
                      {d.compliance?.renewalPending
                        ? " · Renewal pending verification"
                        : ""}
                    </span>
                    <a
                      href={`/api/documents/${v?.id}/content`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Preview <ArrowUpRight size={16} />
                    </a>
                    <a href={`/api/documents/${v?.id}/content?download=true`}>
                      Download
                    </a>
                  </div>
                  <details>
                    <summary>
                      Versions & verification history ({d.versions.length})
                    </summary>
                    {d.versions.map((x: any, i: number) => (
                      <div key={x.id} className="version-row">
                        <strong>
                          v{x.number} ·{" "}
                          {x.id === d.compliance?.effective?.id
                            ? "Effective"
                            : i === 0
                              ? "Newest submission"
                              : "History"}{" "}
                          · {x.reviewState}
                        </strong>
                        <code>{x.hash}</code>
                        <small>
                          {date(x.createdAt)} · {x.reviews.length} review(s)
                        </small>
                        {!user.grants.some(
                          (g: any) => g.role === "INSTITUTION",
                        ) && (
                          <a
                            href={`/api/documents/${x.id}/content?download=true`}
                          >
                            Download version
                          </a>
                        )}
                        {x.reviews.map((r: any) => (
                          <p key={r.id}>
                            {r.outcome}: {r.reason}
                          </p>
                        ))}
                      </div>
                    ))}
                  </details>
                  {reviewer && v?.reviewState === "PENDING" && (
                    <div className="review-renewal">
                      <Field title="Verification reason">
                        <textarea
                          value={reason[v.id] ?? ""}
                          onChange={(e) =>
                            setReason({ ...reason, [v.id]: e.target.value })
                          }
                        />
                      </Field>
                      <div className="button-row">
                        <button
                          className="secondary stable"
                          onClick={() => review(v.id, "ACCEPTED")}
                        >
                          Accept evidence
                        </button>
                        <button
                          className="ghost stable"
                          onClick={() => review(v.id, "REJECTED")}
                        >
                          Return evidence
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="fine-print">
                    Expiry triggers follow-up. It does not automatically revoke
                    approval.
                  </p>
                </div>
              );
            })
        )}
      </Panel>
    </>
  );
}
function Alerts() {
  const data = useData("alerts", "/alerts");
  const q = useQueryClient();
  const [tab, setTab] = useState("inbox");
  const [error, setError] = useState<unknown>();
  return (
    <>
      <Heading
        eyebrow="EVERY FOLLOW-UP HAS A RECORD"
        title="Alerts &"
        accent="delivery."
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
          <details>
            <summary>
              Designated escalation events ({data.data.escalations.length})
            </summary>
            {data.data.escalations.map((event: any) => (
              <div className="notification" key={event.id}>
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
        title="Reports &"
        accent="audit trail."
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
            <div className="audit-list">
              {audits.data?.map((h: any) => (
                <article key={h.id}>
                  <span className="audit-dot" />
                  <div>
                    <strong>{label(h.action)}</strong>
                    <p>{h.reason}</p>
                    <small>
                      {date(h.createdAt)} · actor {h.actorId} · {h.visibility}
                    </small>
                    <code>
                      Policy {h.policyId ?? "System"} · correlation{" "}
                      {h.correlationId}
                    </code>
                  </div>
                </article>
              ))}
            </div>
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
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(data.data.rows[0]).map((k) => (
                        <th key={k}>{label(k)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.rows.map((r: any, i: number) => (
                      <tr key={i}>
                        {Object.values(r).map((v: any, j: number) => (
                          <td key={j}>{String(v ?? "—")}</td>
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
              {data.data?.total ?? 0} report rows within authorized scope
            </p>
          </>
        )}
      </Panel>
    </>
  );
}
function Rules({ user }: { user: any }) {
  const data = useData("rules", "/rules");
  const q = useQueryClient();
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [stages, setStages] = useState("SCRUTINY, EVC, AUTHORITY");
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
  const publisher = user.grants.some((g: any) => g.role === "BUREAU");
  const rule =
    data.data?.rules.find((r: any) => r.id === selected) ?? data.data?.rules[0];
  const config = () => ({
    stages: stages
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
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
    setStages(r.config.stages.join(", "));
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
        if (operation === "create") setSelected(r.id);
      }
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (rule && !selected) choose(rule);
  }, [rule?.id]);
  return (
    <>
      <Heading
        eyebrow="CONFIGURABLE ROUTES. FIXED ACCOUNTABILITY."
        title="Rules &"
        accent="policy versions."
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
          <h2>Preview the path. Preserve the past.</h2>
          <p className="muted">
            Published routes are immutable. Draft a new version to change
            stages. Publication requires a separate bureau grant and never
            grants decision authority.
          </p>
          <Field title="Route name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={rule?.name ?? "Name this route"}
            />
          </Field>
          <Field title="Ordered stages (comma separated)">
            <input value={stages} onChange={(e) => setStages(e.target.value)} />
          </Field>
          <p className="fine-print">
            Allowed: SCRUTINY, EVC, SAC, SHC, AUTHORITY. Exactly one AUTHORITY
            stage must end an acyclic route.
          </p>
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
            <input value={source} onChange={(e) => setSource(e.target.value)} />
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
              Stage windows and designated escalation hierarchy · DEMO calendar
              days
            </summary>
            <p className="muted">
              Blank windows use the default deadline. Overdue work remains
              visible during escalation grace. No statutory holiday calendar is
              implemented.
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
                      if (e.target.value) next[stage] = Number(e.target.value);
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
                    ...(entity === "applications" ? {} : { entity }),
                  },
                ),
              );
            }}
          >
            <Field title="Import format">
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
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
                  onClick={async () => {
                    const r = await action(
                      entity === "applications"
                        ? "/integrations/import"
                        : "/integrations/master",
                      {
                        format,
                        content,
                        preview: false,
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
