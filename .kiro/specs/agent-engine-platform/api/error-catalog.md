## Error Catalog

auth.invalid_credentials: 401 when auth fails.
auth.csrf_violation: 403 on missing/invalid CSRF token.
auth.forbidden: 403 when caller lacks permission.
validation.failed: 422 with field errors.
conflict.idempotency: 409 duplicate idempotency key.
rate_limited: 429 with retry_after.
provider.unavailable: 503 transient upstream.
internal.error: 500 unexpected failure with correlation id.


