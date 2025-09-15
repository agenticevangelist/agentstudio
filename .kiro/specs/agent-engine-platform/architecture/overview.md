## Architecture Overview

The Agent Engine Platform is a service‑oriented web system composed of a Django backend and a Next.js frontend. Realtime is enabled via Django Channels (ASGI), and asynchronous workloads are executed by Celery workers backed by Redis. Postgres serves as the system of record. External tool execution is orchestrated through Composio, providing standardized adapters to third‑party APIs.

The platform adheres to an event‑driven, append‑only model for conversational artifacts and run telemetry. This enables high‑fidelity audit trails, idempotent retries, and time‑travel debugging of agent behavior.

### Component Topology

1. API Service (Django + DRF): exposes REST contracts for agents, runs, messages, connections, and toolkits. Handles authentication, authorization, request validation, and persistence.
2. Realtime Gateway (Channels): maintains WebSocket sessions for chat and run streams. Publishes incremental tokens, tool call envelopes, and state transitions.
3. Worker Pool (Celery): executes long‑running or IO‑heavy tasks, including tool calls, summarization, retrieval, and post‑processing. Provides backpressure isolation from the API.
4. Data Plane (Postgres): hosts normalized tables for users, agents, runs, messages, jobs, events, tool invocations, and connection metadata. Enforces referential integrity and indexes for access patterns.
5. Cache/Queue (Redis): supplies Channels layers and Celery broker/result backends. Enables fan‑out for realtime updates and durable task dispatch.
6. UI (Next.js): renders operator and end‑user experiences, consuming REST for CRUD and WebSockets for live streams.

### Data Flow (Happy Path)

1. The UI initiates a run by POSTing an input message to the API. The API persists the message and creates a run envelope.
2. The API enqueues a Celery job to process the run. The job reads context, plans steps, and issues tool calls via Composio.
3. Intermediate events (tokens, tool_start/tool_end, function outputs) are appended to the event log and published to the WebSocket topic for the run room.
4. On completion, the worker persists the final message/output, marks the run terminal state, and emits a completion event.

### Consistency and Concurrency

The system uses Postgres transactional semantics for write paths and treats the event stream as the source of truth for run progression. Concurrency conflicts on mutable aggregates (e.g., run status) are handled with compare‑and‑set updates and idempotency keys attached to retriable operations. WebSocket consumers reconcile local UI state against authoritative server events.

### Idempotency and Retries

Every tool invocation and run step carries a deterministic idempotency key derived from the run id and step index. Celery tasks are retried on transient failures with exponential backoff and capped attempts. Duplicate submissions are detected and short‑circuited at the API and worker layers.

### Scaling Model

API and Realtime scale horizontally behind a load balancer. Celery workers scale independently based on queue depth and execution time distributions. Redis and Postgres scale vertically first, then with read replicas (Postgres) or cluster tiers (Redis) as needed. WebSocket shard keys are derived from room identifiers to balance connections across instances.

### Failure Modes and Degradation

If Redis is unavailable, realtime falls back to in‑memory channels for local development only; in production, connections are rejected with a clear status to prevent silent data loss. If the worker pool is saturated, the API still accepts runs but communicates queueing state via events; the UI surfaces expected delay. If a tool provider degrades, the run transitions to a recoverable error with operator‑actionable metadata.

### Observability

Structured logs include correlation ids linking HTTP requests, Celery tasks, and WebSocket events. Metrics cover request latency percentiles, task runtimes, queue depths, WebSocket session counts, and error rates by tool provider. Tracing spans capture run lifecycles end‑to‑end. Alerts map to SLOs with actionable runbooks.

### Service Levels

Interactive API p95 latency targets sub‑300 ms under nominal load. WebSocket message delivery aims for p99 under 150 ms within a region. Background task SLOs are defined per queue class (e.g., standard within 2 minutes p95, priority within 15 seconds p95). Error budgets drive on‑call policies and release gates.



