## Sequence Flows

### Chat Message to Tool Call

1. UI sends user message -> API persists message + run event.
2. API enqueues Celery task -> Worker plans steps.
3. Worker invokes Composio tool -> emits tool_start.
4. Provider responds -> emits tool_end with payload.
5. Worker synthesizes agent reply -> streams tokens.
6. Final output persisted -> run completes.

### Retry on Transient Error

1. Tool call fails with retriable code.
2. Worker retries with exponential backoff and idempotency key.
3. Duplicate detection short‑circuits if provider already executed.
4. Events reflect retry attempt count for UI transparency.


