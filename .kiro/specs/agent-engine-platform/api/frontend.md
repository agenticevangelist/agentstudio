## Frontend API Usage

### Data Access Layer

The UI uses a thin API client that standardizes headers, auth propagation, and error normalization. TanStack Query manages request lifecycles, caching, background refresh, and de‑duplication. Query keys are namespaced by resource and parameters to avoid accidental collisions.

### Realtime Synchronization

WebSocket sessions are established per workspace and per run. Incoming events are normalized to a unified shape and reduced into UI state machines. The client performs optimistic updates for low‑latency interactions, then reconciles with authoritative server events to resolve divergence.

### Caching and Invalidation

CRUD mutations invalidate targeted query keys and schedule background refetches. Long‑lived views subscribe to incremental server events that splice updates into caches without full refetch when possible.

### Error Handling and Recovery

Transient failures are retried with jittered backoff. Authentication failures trigger a session repair flow. WebSocket disconnects attempt fast reconnects, then fall back to exponential intervals with user feedback.



