# Architecture and invariants

Anumitra is a TypeScript modular monolith with separate API and background worker processes. React/Vite is built and served from Express at the same origin. PostgreSQL is the source of truth. Private bytes are outside public assets. Fonts and Lucide icons are bundled. No runtime internet, paid inference or cloud account is needed.

```mermaid
flowchart LR
  Browser[React operational workspaces] -->|Session cookie + CSRF| API[Express API]
  API --> Domain[Scoped workflow commands]
  Domain -->|One transaction| PG[(PostgreSQL)]
  API --> Private[Private randomized document storage]
  PG --> Outbox[Committed notification intents]
  Outbox --> Worker[Separate pg-boss worker]
  Worker -->|Recheck revision + scope| PG
  Worker --> Inbox[Persistent in-app inbox]
  Worker --> Mailpit[Local Mailpit SMTP sink]
  API -->|Scoped revision SSE| Browser
```

```mermaid
erDiagram
  Region ||--o{ Institution : contains
  Institution ||--o{ Application : submits
  User ||--o{ Grant : holds
  Workflow ||--o{ Application : pins
  Application ||--o{ Snapshot : freezes
  Application ||--o{ StageAttempt : retains
  Application ||--o{ Deficiency : raises
  Deficiency ||--o{ Response : receives
  DocumentVersion ||--o{ Response : supports
  Application ||--o{ Document : owns
  Document ||--o{ DocumentVersion : versions
  DocumentVersion ||--o{ DocumentReview : verifies
  Application ||--o{ Visit : schedules
  Visit ||--o{ Reservation : reserves
  Application ||--o{ Recommendation : recommends
  Application ||--o| Decision : authorizes
  Decision ||--o{ Obligation : conditions
  Application ||--o{ Audit : records
  Application ||--o{ Outbox : queues
  Outbox ||--o{ DeliveryAttempt : attempts
```

```mermaid
flowchart TD
  D[Draft + private evidence] --> S[Submission snapshot]
  S --> R[Configured scrutiny / EVC / distinct SAC or SHC]
  R -->|Reason + checklist item| F[Deficiency round]
  F --> E[Evidence-linked response]
  E --> V[Targeted re-scrutiny]
  V --> R
  R --> N[Committee recommendation where applicable]
  N --> A[Explicit authority decision]
  R --> A
  A --> O[Open obligations after conditional decision]
  O --> H[Evidence submission]
  H --> Q[Human acceptance or reasoned return]
```

Commands lock the application row, bind idempotency to actor and grants, validate expected version and allowlisted guards, preserve state/attempts, write audit and notification intent atomically. Replay can return the original result after ownership changes, while changes to grants invalidate its binding. Contradictory commands cannot both commit. Idempotency records contain transition IDs/state only, not private evidence bytes.

EVC participants take transaction-scoped advisory locks in sorted user order before checking overlapping active reservations. Every scheduling/reschedule path uses the same locks. Positive intervals are database constrained. Scheduling, reporting, recommendation and decision are separate.

The outbox is the business source of notification intent. pg-boss is its durable transport. A crash after enqueue but before acknowledging the job ID can enqueue again; row locking, terminal-state checks, deterministic keys and unique inbox records avoid reapplying business intent. SMTP acceptance cannot be exactly-once: the committed ATTEMPTED marker is explicitly treated as AMBIGUOUS on worker restart. The authorized retry UI records the reason.

Business time is persisted per current demo run. Security timestamps, queue leases and retry delays use real time. New demo runs preserve historical rows and private files while excluding old runs from active queries and superseding old jobs. Production rejects demo mode.
