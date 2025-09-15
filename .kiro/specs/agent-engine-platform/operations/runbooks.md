## Operations Runbooks

### Deploy

Promote via Render Blueprint. Verify migrations apply cleanly; observe error rates and latency for 15 minutes. Rollback by redeploying previous commit; database rollbacks follow documented migration rollback notes.

### Scale Workers

Trigger horizontal scale when queue depth p95 exceeds threshold for 5 minutes or task runtime p95 degrades beyond SLO. Prefer adding small increments to avoid thundering herds. Rebalance shard keys if WS instances skew.

### Clear Stuck Tasks

Identify tasks with exceeded max runtime. Revoke via Celery control, purge dead letter queues, and requeue idempotent tasks. Investigate provider rate limits or network egress issues.

### Rotate Secrets

Generate new credentials, update environment variables for backend and worker, and trigger rolling restarts. For Composio connections, rotate per provider and re‑authorize where scopes changed.

### Incident Playbooks

WebSocket outage: check Redis health, Channels workers, and LB stickiness. Task saturation: increase workers, shed non‑priority queues, and communicate ETAs via UI banners. Database pool exhaustion: raise pool size modestly and identify N+1 offenders in hot queries.



