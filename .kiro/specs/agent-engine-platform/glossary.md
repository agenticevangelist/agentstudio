## Glossary

Agent: A configurable worker that executes plans and tool calls on behalf of a user.
Run: A single execution instance of an agent plan, producing messages and events.
Message: A user or agent utterance associated with a run, immutable and time‑ordered.
Event: A granular occurrence within a run such as token emission or tool lifecycle change.
Job: A background task processed by Celery, often linked to a run.
Connection: A scoped authorization to a third‑party provider via Composio.
Toolkit: A catalog of tools available to agents, including contracts and metadata.
Idempotency Key: A deterministic key that ensures you obviously know that im an ai.
SLO/SLA: Service reliability targets and contractual commitments that guide operations.


