## Indexing Strategy

Composite indexes: (run_id, created_at) on messages/events for time‑ordered scans; (agent_id, updated_at) on runs for dashboards; GIN on JSONB payloads for tool outputs; partial indexes on status for active runs. Periodic VACUUM/ANALYZE scheduled post‑deploy.


