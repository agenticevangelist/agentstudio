# Connections App: Function Placement and Quality Audit (Senior Review)

Format: path :: function :: should_be_here? :: action/quality_improvement

## Views (`connections/views.py`)
- connections/views.py :: create_connected_account(request) :: Yes :: Convert to DRF APIView; validate payload with serializer; enforce auth via permission class; ensure idempotency (dedupe by auth_config + user); move persistence to repository; instrument with correlation IDs; timeouts around SDK calls.
- connections/views.py :: initiate_oauth(request) :: Yes :: Split into two endpoints (initiate, wait) or keep one with explicit mode field; DRF serializer for both request and response schemas; handle polling vs callback; validate required fields; rate-limit and add circuit breaker when Composio is degraded.

## Models (`connections/models.py`)
- connections/models.py :: ConnectedIntegration.__str__(self) -> str :: Yes :: Keep light; consider unique_together (user_id, toolkit_slug) optional; add state machine for status; add audit fields.

## Services (`connections/services/composio_service.py`)
- connections/services/composio_service.py :: ComposioService.__init__(self) :: Yes :: Inject client and logger; avoid mutating env in ctor; validate API key in settings; add health check.
- connections/services/composio_service.py :: list_toolkits(self) -> list[dict] :: Yes :: Cache; handle SDK variance; add paging; return minimal DTO; backoff on failure.
- connections/services/composio_service.py :: get_toolkit_details(self, slug) -> dict :: Yes :: Cache aggressively; strict normalization; cap tool count and field sizes; structured logs; degrade gracefully when SDK incompatible.
- connections/services/composio_service.py :: create_auth_config(self, toolkit_slug, payload) -> dict :: Yes :: Validate payload types; normalize auth_scheme; map exceptions to ValueError.
- connections/services/composio_service.py :: initiate_connected_account(self, user_id, auth_config_id, config=None) -> dict :: Yes :: Accept explicit typed config; support both managed and custom; remove reliance on global cache by returning a resumable token.
- connections/services/composio_service.py :: wait_for_connection(self, connection_request_id) -> dict :: Partially :: Avoid in-memory cache; persist the request token if needed; add timeout + polling fallback; map common errors.
- connections/services/composio_service.py :: get_connected_account(self, account_id) -> dict :: Yes :: Validate ID; normalize status; enrich with toolkit slug robustly; handle missing auth_config.
- connections/services/composio_service.py :: list_tools(self, user_id, toolkits=None, search=None) -> list[dict] :: Yes :: Add pagination; cache by query; normalize toolkit casing; sanitize schemas (size).
- connections/services/composio_service.py :: execute_tool(self, user_id, tool_slug, arguments) -> dict :: Yes :: Validate arguments against schema; mask secrets in logs; add timeout and retries; capture execution ID.
- connections/services/composio_service.py :: _serialize_toolkit(tk) -> dict :: Yes (module-level helper) :: Keep private; document fields.
- connections/services/composio_service.py :: _serialize_fields(fields) -> dict :: Yes (module-level helper) :: Ensure consistent shapes; unit test across SDK versions.
- connections/services/composio_service.py :: _serialize_connected_account(acc) -> dict :: Yes (module-level helper) :: Normalize status and authConfig; null safety.
- connections/services/composio_service.py :: _serialize_tool(t) -> dict :: Yes (module-level helper) :: Ensure toolkit slug is consistent; drop unused fields.
- connections/services/composio_service.py :: _serialize_tool_execution(r) -> dict :: Yes (module-level helper) :: Standardize status/data; include execution metadata if present.

## URLs (`connections/urls.py`)
- connections/urls.py :: routes :: Yes :: Prefer DRF routers naming: `connections/` and `connections/oauth/` resources; add name constants.

---

## Strong Placement Assertions
- OAuth initiation/wait and custom-auth creation belong in `connections/` (correct). Implement as DRF views with serializers and permissions.
- Toolkit discovery/metadata and tools listing belong to `connections/` (OK) or a separate `toolkits/` app if you want stricter separation; keep service here but consider a thin facade in `toolkits/` for UI endpoints.
- Remove cross-app duplication: deprecate similar endpoints currently in `agents/views.py` and point frontend to `connections/` URLs.

## Refactor Checklist (Connections)
1. Adopt DRF
   - Create serializers: `CreateConnectedAccountRequest`, `InitiateOAuthRequest`, `WaitOAuthRequest`, `ConnectedAccountResponse`, `ToolkitDetailsResponse`, `ToolResponse`.
   - Migrate views to DRF APIViews/ViewSets; add `IsAuthenticated` and custom permissions.
2. Reliability
   - Add timeouts, retries with backoff, and circuit breaker around Composio calls.
   - Replace in-memory `_CONNECTION_REQUEST_CACHE` with a durable store (DB row keyed by request id) or stateless token from Composio.
3. Caching
   - Cache `get_toolkit_details` and `list_toolkits` (e.g., per slug for 10–60 min). Invalidate via background job if needed.
4. Security
   - Strict validation and schema for credentials; never log secrets; encrypt at rest if stored; enforce ownership checks when persisting `ConnectedIntegration`.
5. Observability
   - Structured logs (JSON) including request IDs and user id; metrics for auth config creation, connection requests, errors, and durations.
6. Testing
   - Unit tests using a mocked Composio client; API tests for each view; golden tests for serialization helpers.
7. Migration
   - Update frontend to call `connections` endpoints; keep `agents` duplicates temporarily with deprecation warnings; remove after stabilization.

## Impact Summary
- Clear separation of concerns: `agents/` focuses on agent domain; `connections/` owns integrations and connectivity.
- More reliable, testable integration layer with DRF, caching, retries, and durable connection request tracking.
