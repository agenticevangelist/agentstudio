## Rollback Procedure

1. Freeze deploys. 2. Identify bad release. 3. Redeploy prior commit via Render. 4. If schema changed, apply documented rollback migration or enable compatibility toggles. 5. Verify health checks, then unfreeze. Post‑mortem within 48 hours.


