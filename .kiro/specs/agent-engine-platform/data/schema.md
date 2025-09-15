## Data Schema

### Entities and Relationships

Users own Agents. Agents own Runs. Runs contain Messages and Events. Jobs are background executions linked to Runs and may emit Events. Connections grant scoped access to external providers and are referenced by Agents at invocation time. Toolkits describe available tools and their contracts.

Cardinalities: User 1..N Agent, Agent 1..N Run, Run 1..N Message, Run 1..N Event, Run 0..N Job. Connections are many‑to‑one to User and may be attached to many Agents via linking tables where needed.

### Storage Strategy

Immutable streams (Messages, Events) are append‑only with created_at indexes for time‑ordered retrieval. Aggregate tables (Run, Agent) track current state with status fields and version counters for optimistic concurrency. JSONB columns capture tool payloads where schema varies by provider, with extracted columns for hot predicates.

### Migration Policy

Schema changes are forward‑only and additive. Destructive operations require a two‑step deprecation (write‑shadow, read‑shadow, then drop). Data backfills are executed via Celery with idempotent batches and progress markers. Every migration includes rollback notes and safety checks for production.



