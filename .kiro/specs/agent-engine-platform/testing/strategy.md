## Testing Strategy

### Test Pyramid and Scope

Unit tests validate pure functions and domain services with exhaustive edge cases. Component tests target React units with simulated props and events. API tests assert contracts, auth boundaries, and error semantics. Integration tests exercise WebSocket flows, Celery orchestration, and DB interactions end‑to‑end.

### Coverage and Quality Gates

Backends target 80% line coverage, 90% on core services. Frontend aims for critical path coverage on workspace, chat, and runs. CI enforces minimum thresholds, failing builds on regressions. Contract tests prevent breaking API changes by pinning schemas.

### Determinism and Flake Control

Time and randomness are stubbed. Network calls are mocked with recorded cassettes for stability. Flaky tests are quarantined with owner assignment and SLAs for remediation. CI retries idempotent steps with jitter to reduce false negatives.

### Tooling and Environments

Backend uses pytest with factory_boy and pytest‑django; frontend uses Vitest/RTL. A lightweight compose profile can spin up Postgres and Redis locally for integration runs. Smoke tests run post‑deploy against the live environment.



