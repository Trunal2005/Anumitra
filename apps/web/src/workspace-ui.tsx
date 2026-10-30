import { type ReactNode, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, X, Inbox, AlertCircle } from "lucide-react";
import { readable } from "../../../packages/contracts/presentation.ts";
import { date } from "./data.ts";
export function Status({
  value,
  children,
}: {
  value?: string;
  children?: ReactNode;
}) {
  const state = (value ?? "").toUpperCase();
  const tone = /OVERDUE|EXPIRED|REJECTED|RETURNED|AMBIGUOUS|FAILED/.test(state)
    ? "red"
    : /ACCEPTED|APPROVED|CURRENT|COMPLETED|CLOSED|SMTP_ACCEPTED/.test(state)
      ? "green"
      : /PENDING|RESPONSE|DUE_SOON|TODAY|CONDITIONAL|PROPOSED/.test(state)
        ? "amber"
        : "blue";
  return (
    <span className={"status-pill " + tone}>
      {children ?? readable(value ?? "Not recorded")}
    </span>
  );
}
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="ops-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Blank({ children }: { children: ReactNode }) {
  return (
    <div className="ops-empty">
      <Inbox size={24} />
      <p>{children}</p>
    </div>
  );
}
export function Failure({ error }: { error: unknown }) {
  return error ? (
    <div className="error" role="alert">
      <AlertCircle size={18} />
      {error instanceof Error ? error.message : String(error)}
    </div>
  ) : null;
}
export function TableRegion({
  children,
  label = "Operational records",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div
      className="ops-table-scroll"
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
export function Due({
  due,
  urgency,
  label,
}: {
  due?: string | null;
  urgency?: any;
  label?: string | null;
}) {
  return (
    <div className="due-cell">
      {urgency && <Status value={urgency.key}>{urgency.label}</Status>}
      <small>{due ? date(due) + " IST" : "No deadline recorded"}</small>
      {label && <small>{label}</small>}
    </div>
  );
}
export function Origin({ kind }: { kind: string }) {
  return (
    <span className="origin-tag">
      {kind === "FICTIONAL_DEMO"
        ? "Fictional workflow"
        : kind === "AUTHORIZED_PILOT"
          ? "Authorized pilot"
          : "Provenance not recorded"}
    </span>
  );
}
export function CaseLink({ record }: { record: any }) {
  return (
    <Link className="case-link" to={"/applications/" + record.id}>
      <strong>{record.reference}</strong>
      <span>{record.institution?.name ?? record.institution}</span>
    </Link>
  );
}
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="ops-overlay" />
        <Dialog.Content
          className="ops-drawer app-shell"
          onOpenAutoFocus={() => {
            returnFocus.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
            else document.getElementById("main")?.focus();
          }}
        >
          <div className="drawer-title">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close details">
              <X size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Selected record details and authorized actions. Close to return to
            the list.
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function SelectedPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, [title]);
  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label={title}
      className="selected-panel"
    >
      <h2>{title}</h2>
      {children}
    </section>
  );
}
export function SourceLink({
  url,
  children = "View source",
}: {
  url: string;
  children?: ReactNode;
}) {
  return (
    <a className="source-link" href={url} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
