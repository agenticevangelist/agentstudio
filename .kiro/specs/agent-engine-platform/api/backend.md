## Backend API

### Resource Model

Core resources include `Agent`, `Run`, `Message`, `Job`, `Event`, `Connection`, and `Toolkit`. Each resource exposes CRUD where applicable and action endpoints for domain operations (e.g., trigger run, resume, cancel). Identifiers are opaque UUIDs. Timestamps are RFC 3339 with timezone.

### Contracts and Schemas

Requests and responses are documented with JSON Schemas and share common envelopes: `{ data, meta, error }`. Pagination uses cursor semantics with `next` and `prev` tokens. Partial updates use PATCH with JSON Merge Patch semantics. Idempotency keys may be supplied via `Idempotency-Key` to deduplicate unsafe operations.

### Authentication and Authorization

Session and token auth are supported. CSRF is enforced for browser‑initiated unsafe methods. Authorization is role‑ and ownership‑based: callers may only operate on resources they own or are explicitly granted to via connection scopes.

### Errors and Problem Details

Errors follow RFC 7807 problem details: `type`, `title`, `status`, `detail`, `instance`, with `code` and `fields` extensions for machine parsing. 4xx codes represent validation, authentication, authorization, or idempotency violations; 5xx codes represent transient or unknown errors with correlation ids.

### Versioning and Compatibility

APIs are versioned under `/api/v1/`. Backward‑compatible changes are additive. Breaking changes are introduced under a new prefix. Deprecations include a `Sunset` header and deprecation notices in responses for at least one minor cycle.

### Realtime Protocols

WebSockets expose two primary channels: chat rooms and run rooms. Messages include `event`, `ts`, `room`, and `payload` fields. Subtypes cover `token`, `tool_start`, `tool_end`, `status`, and `final`. Heartbeats keep sessions alive; missed heartbeats prompt reconnect hints.



