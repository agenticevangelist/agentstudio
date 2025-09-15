## Architectural Decisions (ADRs)

### ADR‑001: Django + DRF for Backend
Context: Need a productive, batteries‑included framework with mature auth, admin, ORM, and serialization.
Decision: Use Django 4.2 with DRF. Standardize on class‑based views, serializers, and viewsets.
Alternatives: FastAPI (lighter, async‑first), Flask (minimal), Node/Express (ecosystem shift).
Consequences: Faster delivery, shared conventions, easy admin tooling; less async pervasiveness vs FastAPI.

### ADR‑002: Channels for Realtime
Context: Realtime chat and run streaming require WebSockets.
Decision: Use Django Channels (ASGI) to remain in Python and reuse auth/middleware.
Alternatives: Socket.io (Node), server‑sent events, polling.
Consequences: Unified stack, Redis dependency for scale, WS semantics over HTTP.

### ADR‑003: Celery for Background Jobs
Context: Tool calls and long operations must not block requests.
Decision: Adopt Celery with Redis broker/result backend.
Alternatives: RQ, Dramatiq, in‑process threads.
Consequences: Mature ecosystem, robust retry/backoff; operational overhead for workers.

### ADR‑004: Postgres as Source of Truth
Context: Durable, relational state with transactional integrity.
Decision: Use Postgres for all primary data; allow SQLite for local only.
Alternatives: MySQL, document stores.
Consequences: Strong consistency, powerful SQL; requires schema migrations coordination.

### ADR‑005: Composio for Tool Orchestration
Context: Broad third‑party tool access without building bespoke connectors.
Decision: Integrate Composio SDKs for connections and tool invocation.
Alternatives: Build custom adapters, use Zapier/Make.
Consequences: Faster integration surface, vendor dependency, scoped permissions management.

### ADR‑006: Event Model for Auditability
Context: Need traceable runs, messages, and tool calls.
Decision: Append‑only events with immutable records; derive views for UI.
Alternatives: Mutate‑in‑place models only.
Consequences: Clear audit trail, easier retries; more storage and indexing.

### ADR‑007: Next.js 15 + React 19 Frontend
Context: Modern SSR/ISR, strong DX, rich UI primitives.
Decision: Use Next.js with Tailwind and Radix UI.
Alternatives: Remix, Nuxt, SPA only.
Consequences: Great developer speed; Node build/runtime in deployment topology.

### ADR‑008: Render as Reference Deployment
Context: Provide an easy, reproducible deployment path.
Decision: Ship `render.yaml` with web, worker, and frontend services.
Alternatives: Docker Compose, K8s from day one.
Consequences: Lower setup time; less control vs bespoke infra.


