## Security and Compliance

### Authentication and Authorization

Session and token auth are supported. CSRF protections apply to browser clients. Authorization is enforced at the object level: resource ownership and explicit grants. Scoped access for Connections ensures agents call tools only with the minimum privileges required. Admin capabilities are guarded by explicit staff roles and audited.

### Secrets Management

Secrets are injected via environment variables and managed per environment. Rotation follows runbooks with zero‑downtime rollouts. Secrets never land in logs or error payloads. Access to production secrets is restricted and monitored.

### Data Protection

All traffic uses TLS in transit. Postgres stores data at rest with least‑privilege DB roles. Logs redact sensitive fields, including tokens, keys, and PII. Append‑only streams provide immutable audit trails for runs and tool invocations.

### Third‑Party Integrations

Composio connections are created with minimal scopes and can be revoked individually. Provider rate limits and error codes are surfaced to operators. Webhooks, if enabled, are verified with shared secrets and timestamps.

### Compliance Posture

While not formally certified, controls align with common SOC2 principles: access control, change management, and monitoring. Data residency and retention are configurable by environment. Incident response is documented with clear RACI and escalation paths.



