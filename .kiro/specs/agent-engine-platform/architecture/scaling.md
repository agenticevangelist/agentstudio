## Scaling Strategy

Horizontal scale the API and Realtime tiers behind a layer‑4/7 load balancer. Use sticky sessions for WebSockets if required by the Channels backend. Workers scale independently; autoscale based on queue depth p95, oldest task age, and runtime distributions.

Capacity planning uses historical p95s and seasonality. Apply HPA‑like rules: add 1 worker per N queued tasks or when CPU exceeds threshold for sustained intervals. Apply circuit breakers around tool providers to avoid cascading failures.


