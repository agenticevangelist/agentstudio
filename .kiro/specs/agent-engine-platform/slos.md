## SLOs, SLAs, and Error Budgets

### Availability and Latency

API availability target is 99.9% monthly. p95 request latency under nominal load is ≤ 300 ms; p99 ≤ 800 ms. WebSocket message delivery p99 is ≤ 150 ms intra‑region. Background task completion SLOs: standard queue p95 ≤ 2 minutes, priority queue p95 ≤ 15 seconds.

### Error Budgets

Availability budget is 43 minutes per month. Latency violations accrue budget debits proportional to overage duration and magnitude. When budget is exhausted, releases freeze and the focus shifts to reliability work until burn rate stabilizes.

### Monitoring and Alerts

Golden signals (latency, traffic, errors, saturation) are monitored with alert thresholds tuned to avoid alert fatigue. All alerts include runbooks and ownership. Synthetic checks validate API, auth flows, and WebSocket connectivity from multiple regions.


