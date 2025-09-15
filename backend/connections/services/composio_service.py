import os
import logging
import json
from typing import Any, Dict, List, Optional

from django.conf import settings

from composio import Composio
from composio.types import auth_scheme as composio_auth_scheme


# In-memory cache of connection request objects keyed by id.
_CONNECTION_REQUEST_CACHE: Dict[str, Any] = {}


class ComposioService:
    def __init__(self):
        api_key = getattr(settings, 'COMPOSIO_API_KEY', None) or os.getenv('COMPOSIO_API_KEY')
        if not api_key:
            raise RuntimeError('COMPOSIO_API_KEY is not configured')
        # The Python client picks API key from env; ensure it's set
        os.environ['COMPOSIO_API_KEY'] = api_key
        self.client = Composio()
        self.logger = logging.getLogger(__name__)

    # ---- Toolkit discovery ----
    def list_toolkits(self) -> List[Dict[str, Any]]:
        # SDK likely supports .toolkits.list(); if not, derive from providers
        try:
            # Prefer native list if available
            if hasattr(self.client.toolkits, 'list'):
                items = self.client.toolkits.list()
                # Normalize to list of dicts
                return [self._serialize_toolkit(x) for x in items]
        except Exception:
            pass
        # Fallback: infer from tools.get with no filters (may be heavy)
        try:
            # Get sample tools and group by toolkit
            tools = self.client.tools.get(user_id="default")
            seen = {}
            for t in tools:
                slug = getattr(t, 'toolkit', None) or getattr(t, 'toolkit_slug', None)
                name = slug
                if slug and slug not in seen:
                    seen[slug] = {"slug": slug, "name": name}
            return list(seen.values())
        except Exception:
            return []

    def get_toolkit_details(self, slug: str) -> Dict[str, Any]:
        """Return comprehensive toolkit details compatible with connection wizard.

        Resilient across Composio SDK versions where `toolkits` resource may not
        expose a uniform API. We try multiple strategies to obtain the toolkit
        object; if none succeed, we proceed with `tk=None` and derive details
        from tools and auth field endpoints.
        """
        slug_norm = str(slug or "").upper()
        tk = None
        # Attempt to retrieve toolkit object using whichever method is available (noisy logs removed)
        try:
            if hasattr(self.client.toolkits, 'get'):
                tk = self.client.toolkits.get(slug=slug_norm)  # type: ignore[attr-defined]
            elif hasattr(self.client.toolkits, 'retrieve'):
                tk = self.client.toolkits.retrieve(slug_norm)  # type: ignore[attr-defined]
            elif hasattr(self.client.toolkits, 'list'):
                items = self.client.toolkits.list()  # type: ignore[attr-defined]
                for it in items:
                    s = getattr(it, 'slug', None) or getattr(it, 'id', None) or ''
                    if str(s).lower() == str(slug).lower():
                        tk = it
                        break
        except Exception:
            tk = None
        # Log RAW toolkit object from SDK (for debugging vs extracted)
        def _safe_json(obj: Any) -> str:
            try:
                # Try pydantic-like serialization first
                if hasattr(obj, 'model_dump'):
                    return json.dumps(obj.model_dump(), default=str)
                if hasattr(obj, 'dict'):
                    return json.dumps(obj.dict(), default=str)
                if hasattr(obj, '__dict__'):
                    return json.dumps(obj.__dict__, default=str)
                return json.dumps(obj, default=str)
            except Exception:
                try:
                    return str(obj)
                except Exception:
                    return '<unserializable>'

        try:
            self.logger.info("=== COMPOSIO TOOLKIT RAW (%s) ===\n%s", slug_norm, _safe_json(tk))
        except Exception:
            self.logger.info("=== COMPOSIO TOOLKIT RAW (%s) === <unavailable>", slug_norm)

        # Extract auth details fields as used by frontend wizard
        auth_details: List[Dict[str, Any]] = []

        # 1) Prefer RAW from SDK object if available (as per docs)
        try:
            raw_auth = None
            if tk is not None:
                raw_auth = getattr(tk, 'auth_config_details', None)
                if raw_auth is None and isinstance(tk, dict):
                    raw_auth = tk.get('auth_config_details')
            if raw_auth:
                def _map_fields(section: Any) -> Dict[str, List[Dict[str, Any]]]:
                    if section is None:
                        return {"required": [], "optional": []}
                    # section expected shape: { required: [...], optional: [...] }
                    if isinstance(section, dict):
                        req = section.get('required') or []
                        opt = section.get('optional') or []
                    else:
                        req = getattr(section, 'required', [])
                        opt = getattr(section, 'optional', [])

                    def _map_item(x: Any) -> Dict[str, Any]:
                        if isinstance(x, dict):
                            return {
                                "name": x.get('name'),
                                "type": x.get('type'),
                                "displayName": x.get('display_name') or x.get('title'),
                                "description": x.get('description'),
                            }
                        return {
                            "name": getattr(x, 'name', None),
                            "type": getattr(x, 'type', None) or getattr(x, 'json_type', None),
                            "displayName": getattr(x, 'display_name', None) or getattr(x, 'title', None),
                            "description": getattr(x, 'description', None),
                        }

                    return {
                        "required": [_map_item(x) for x in req],
                        "optional": [_map_item(x) for x in opt],
                    }

                for entry in raw_auth:
                    mode = entry.get('mode') if isinstance(entry, dict) else getattr(entry, 'mode', None)
                    fields = entry.get('fields') if isinstance(entry, dict) else getattr(entry, 'fields', None)
                    if not mode or not fields:
                        continue
                    acc = fields.get('auth_config_creation') if isinstance(fields, dict) else getattr(fields, 'auth_config_creation', None)
                    cai = fields.get('connected_account_initiation') if isinstance(fields, dict) else getattr(fields, 'connected_account_initiation', None)
                    auth_details.append({
                        "mode": str(mode).upper(),
                        "fields": {
                            "authConfigCreation": _map_fields(acc),
                            "connectedAccountInitiation": _map_fields(cai),
                        },
                    })
        except Exception as e:
            self.logger.debug("raw auth_config_details mapping failed for %s: %s", slug_norm, e)

        # 2) If RAW not present, query specific endpoints per scheme
        if not auth_details:
            supported = ["OAUTH2", "API_KEY", "BEARER_TOKEN", "BASIC", "NO_AUTH"]
            for mode in supported:
                try:
                    create_fields = self.client.toolkits.get_auth_config_creation_fields(toolkit=slug_norm, auth_scheme=mode)
                except Exception as e:
                    self.logger.debug("creation fields fetch failed for %s/%s: %s", slug_norm, mode, e)
                    create_fields = None
                try:
                    init_fields = self.client.toolkits.get_connected_account_initiation_fields(toolkit=slug_norm, auth_scheme=mode)
                except Exception as e:
                    self.logger.debug("initiation fields fetch failed for %s/%s: %s", slug_norm, mode, e)
                    init_fields = None

                if create_fields is not None or init_fields is not None:
                    auth_details.append({
                        "mode": mode,
                        "fields": {
                            "authConfigCreation": _serialize_fields(create_fields) if create_fields is not None else {"required": [], "optional": []},
                            "connectedAccountInitiation": _serialize_fields(init_fields) if init_fields is not None else {"required": [], "optional": []},
                        },
                    })

        # Try to fetch tools for this toolkit
        tools: List[Dict[str, Any]] = []
        try:
            tools = self.list_tools(user_id="default", toolkits=[slug])  # includes schema via _serialize_tool
        except Exception:
            tools = []

        # Normalize common metadata fields
        icon = (
            getattr(tk, 'icon', None)
            or getattr(tk, 'icon_url', None)
            or getattr(tk, 'logo', None)
            or getattr(tk, 'logo_url', None)
            or getattr(getattr(tk, 'meta', None), 'logo', None)
        )
        description = (
            getattr(tk, 'description', None)
            or getattr(getattr(tk, 'meta', None), 'description', None)
        )
        provider = (
            getattr(tk, 'provider', None)
            or getattr(getattr(tk, 'meta', None), 'provider', None)
        )

        result = {
            "slug": slug_norm,
            "name": getattr(tk, 'name', None) or slug,
            "description": description,
            "icon_url": icon,
            "provider": provider,
            "tools": tools,
            "authConfigDetails": auth_details,
        }
        # Log EXTRACTED normalized data clearly separated
        try:
            self.logger.info("=== COMPOSIO TOOLKIT EXTRACTED (%s) ===\n%s", slug_norm, json.dumps(result, default=str))
        except Exception:
            self.logger.info("=== COMPOSIO TOOLKIT EXTRACTED (%s) === (non-serializable)", slug_norm)
        return result

    # ---- Triggers ----
    def list_triggers(self, toolkit_slug: str) -> List[Dict[str, Any]]:
        """Return triggers via composio.triggers.list(toolkit_slugs=[slug]). No fallbacks, no filtering, no transformation."""
        slug = str(toolkit_slug or "").lower()
        return self.client.triggers.list(toolkit_slugs=[slug])

    def get_trigger_schema(self, toolkit_slug: str, trigger_slug: str) -> Dict[str, Any]:
        tk = str(toolkit_slug or "").upper()
        tr = str(trigger_slug or "").upper()
        try:
            trig = None
            if hasattr(self.client.triggers, 'get_type'):
                trig = self.client.triggers.get_type(slug=tr)
            elif hasattr(self.client.triggers, 'get'):
                trig = self.client.triggers.get(slug=tr)
        except Exception:
            trig = None
        schema = getattr(trig, 'schema', None) or getattr(trig, 'trigger_config_schema', None)
        sample = getattr(trig, 'example', None) or getattr(trig, 'sample_payload', None)
        return {
            "toolkit": tk,
            "slug": tr,
            "name": getattr(trig, 'name', None) or tr,
            "description": getattr(trig, 'description', None),
            "payload_schema": schema,
            "sample_payload": sample,
        }

    def register_subscription(self, toolkit_slug: str, trigger_slug: str, connected_account_id: str, trigger_config: Dict[str, Any]) -> Dict[str, Any]:
        try:
            sub = self.client.triggers.create(
                slug=str(trigger_slug).upper(),
                connected_account_id=connected_account_id,
                trigger_config=trigger_config,
            )
            return {"id": getattr(sub, 'id', None)}
        except Exception as e:
            self.logger.exception("register_subscription failed: %s", e)
            raise

    def unregister_subscription(self, trigger_id: str) -> bool:
        try:
            self.client.triggers.delete(trigger_id=trigger_id)
            return True
        except Exception as e:
            self.logger.exception("unregister_subscription failed: %s", e)
            return False

    # ---- Auth Config and Connections ----
    def create_auth_config(self, toolkit_slug: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Create an auth config.

        payload examples:
          - {"type": "use_composio_managed_auth"}
          - {"type": "use_custom_auth", "authScheme": "API_KEY", "credentials": {...}}
        """
        toolkit_norm = str(toolkit_slug or "")
        # Build options payload per local examples (composio core SDK)
        typ = payload.get("type")
        if typ not in ("use_composio_managed_auth", "use_custom_auth"):
            raise ValueError(f"Unsupported auth config type: {typ}")

        options: Dict[str, Any] = {"type": typ}
        if payload.get("name"):
            options["name"] = payload["name"]
        if typ == "use_custom_auth":
            # examples use snake_case 'auth_scheme'
            auth_scheme_val = payload.get("auth_scheme") or payload.get("authScheme")
            if not auth_scheme_val:
                raise ValueError("auth_scheme/authScheme is required for use_custom_auth")
            options["auth_scheme"] = str(auth_scheme_val)
            if payload.get("credentials"):
                options["credentials"] = payload["credentials"]

        self.logger.debug("Creating auth config via composio.auth_configs.create toolkit=%s options=%s", toolkit_norm, options)
        cfg = self.client.auth_configs.create(toolkit=toolkit_norm, options=options)
        # cfg likely is a pydantic/dataclass-like; expose id
        return {"id": getattr(cfg, 'id', None), "raw": cfg}

    def initiate_connected_account(
        self,
        user_id: str,
        auth_config_id: str,
        config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # Use composio core SDK initiate; API key flows use auth_scheme helper
        cb = (config or {}).get("callbackUrl") or (config or {}).get("callback_url")
        config_obj = None
        # If credentials + authScheme provided for custom flow
        creds = (config or {}).get("credentials")
        scheme = (config or {}).get("auth_scheme") or (config or {}).get("authScheme")
        if creds and scheme:
            key = str(scheme).lower()
            # Map e.g., API_KEY -> api_key
            key = key.lower()
            if hasattr(composio_auth_scheme, key):
                config_obj = getattr(composio_auth_scheme, key)(options=creds)
            else:
                raise ValueError(f"Unsupported auth scheme for initiation: {scheme}")

        req = self.client.connected_accounts.initiate(
            user_id=user_id,
            auth_config_id=auth_config_id,
            callback_url=cb,
            config=config_obj,
        )
        redirect_url = getattr(req, 'redirect_url', None) or getattr(req, 'redirectUrl', None) or ""
        req_id = getattr(req, 'id', None)
        if req_id:
            # Cache the request object for subsequent wait calls
            _CONNECTION_REQUEST_CACHE[str(req_id)] = req
        return {"id": req_id, "redirectUrl": redirect_url, "raw": req}

    def wait_for_connection(self, connection_request_id: str):
        """Wait on a connection request returned by initiate().

        This strictly follows the SDK example: the object returned by initiate()
        exposes wait_for_connection(). We expect the ID we receive here to be
        that request ID; we do not try to reinterpret connected account IDs.
        """
        # Retrieve the original request object from cache
        req = _CONNECTION_REQUEST_CACHE.get(str(connection_request_id))
        if req is None:
            raise ValueError("Unknown connectionRequestId; initiate must be called on the same server instance before waiting.")
        if not hasattr(req, "wait_for_connection"):
            raise ValueError("Cached object does not support waiting; ensure ID came from initiate().")
        acc = req.wait_for_connection()
        return self.get_connected_account(getattr(acc, 'id', None))

    def get_connected_account(self, account_id: str):
        """Retrieve a connected account by ID and enrich with toolkit slug.

        Toolkit slug is resolved from the account's auth config via
        auth_configs.get(...).toolkit.
        """
        acc = self.client.connected_accounts.get(account_id)
        data = _serialize_connected_account(acc)
        ac_id = data.get('authConfig', {}).get('id')
        tk_slug = None
        if ac_id:
            ac = self.client.auth_configs.get(ac_id)
            # toolkit may be an object with 'slug' attr or a plain string
            tk_obj_or_str = getattr(ac, 'toolkit', None) or getattr(ac, 'toolkit_slug', None)
            if tk_obj_or_str is not None:
                if hasattr(tk_obj_or_str, 'slug'):
                    tk_slug = getattr(tk_obj_or_str, 'slug', None)
                elif isinstance(tk_obj_or_str, str):
                    tk_slug = tk_obj_or_str
        if tk_slug:
            data['toolkit'] = {"slug": str(tk_slug)}
        return data

    # ---- Tools ----
    def list_tools(self, user_id: str, toolkits: Optional[List[str]] = None, search: Optional[str] = None):
        # Debug both API shapes and return the longer list
        tk_list = [str(t).upper() for t in toolkits] if toolkits else None
        try:
            print("[DEBUG] list_tools start user=", user_id, "toolkits=", tk_list, flush=True)
        except Exception:
            pass

        get_items: List[Any] = []
        list_items: List[Any] = []

        # Attempt get()
        try:
            res_get = self.client.tools.get(user_id=user_id, toolkits=tk_list, search=search)
            get_items = self._normalize_tools_result(res_get)
            try:
                print("[DEBUG] composio.tools.get type=", type(res_get).__name__, "count=", len(get_items), flush=True)
            except Exception:
                pass
        except Exception as e:
            self.logger.info("composio:list_tools get() failed: %s", e)

        # Attempt list() once (some SDKs page by default to 20)
        try:
            # Try with a larger per_page if the SDK accepts it; ignore if not
            try:
                res_list = self.client.tools.list(user_id=user_id, toolkits=tk_list, search=search, per_page=250)  # type: ignore[attr-defined]
            except Exception:
                res_list = self.client.tools.list(user_id=user_id, toolkits=tk_list, search=search)  # type: ignore[attr-defined]
            list_items = self._normalize_tools_result(res_list)
            try:
                print("[DEBUG] composio.tools.list type=", type(res_list).__name__, "count=", len(list_items), flush=True)
            except Exception:
                pass
            # Also emit bare prints to ensure visibility regardless of logging config
            try:
                print("[DEBUG] composio.tools.list type=", type(res_list).__name__, "count=", len(list_items))
            except Exception:
                pass
        except Exception as e:
            self.logger.info("composio:list_tools list() failed: %s", e)

        # Choose the larger set, merge uniquely by (slug or name)
        combined: Dict[str, Any] = {}
        for src in (get_items or []):
            key = getattr(src, 'slug', None) or getattr(src, 'name', None) or getattr(src, 'id', None) or str(src)
            combined[str(key)] = src
        for src in (list_items or []):
            key = getattr(src, 'slug', None) or getattr(src, 'name', None) or getattr(src, 'id', None) or str(src)
            combined.setdefault(str(key), src)

        items = list(combined.values())
        try:
            print("[DEBUG] list_tools final_count=", len(items), flush=True)
        except Exception:
            pass
        return [_serialize_tool(t) for t in items]

    def _normalize_tools_result(self, res: Any) -> List[Any]:
        try:
            if isinstance(res, dict):
                if 'items' in res and isinstance(res['items'], list):
                    return res['items']
                return []
            if hasattr(res, 'items') and isinstance(getattr(res, 'items'), list):
                return getattr(res, 'items')
            if isinstance(res, list):
                return res
            # iterable
            try:
                return list(res)
            except Exception:
                return []
        except Exception:
            return []

    def execute_tool(self, user_id: str, tool_slug: str, arguments: Dict[str, Any]):
        resp = self.client.tools.execute(user_id=user_id, slug=tool_slug, arguments=arguments)
        return _serialize_tool_execution(resp)


def _serialize_toolkit(tk: Any) -> Dict[str, Any]:
    return {
        "slug": getattr(tk, 'slug', None) or getattr(tk, 'id', None),
        "name": getattr(tk, 'name', None) or getattr(tk, 'slug', None),
    }


def _serialize_fields(fields: Any) -> Dict[str, List[Dict[str, Any]]]:
    items = getattr(fields, 'fields', None) or fields or []
    required: List[Dict[str, Any]] = []
    optional: List[Dict[str, Any]] = []
    for f in items:
        rec = {
            "name": getattr(f, 'name', None),
            "type": getattr(f, 'type', None) or getattr(f, 'json_type', None),
            "displayName": getattr(f, 'display_name', None) or getattr(f, 'title', None),
            "description": getattr(f, 'description', None),
        }
        if getattr(f, 'required', False):
            required.append(rec)
        else:
            optional.append(rec)
    return {"required": required, "optional": optional}


def _serialize_connected_account(acc: Any) -> Dict[str, Any]:
    raw_status = getattr(acc, 'status', None)
    # status may be an enum-like object with a 'value', or a plain string
    if raw_status is not None and hasattr(raw_status, 'value'):
        raw_status = getattr(raw_status, 'value', None)
    status_str = str(raw_status) if raw_status is not None else None
    return {
        "id": getattr(acc, 'id', None),
        "status": status_str,
        "authConfig": {"id": getattr(getattr(acc, 'auth_config', None), 'id', None)} if getattr(acc, 'auth_config', None) else None,
    }


def _serialize_tool(t: Any) -> Dict[str, Any]:
    # Handle both object-like and dict-like items and multiple SDK field variants
    if isinstance(t, str):
        # Some SDKs may return raw slug strings in lists
        return {"slug": t, "name": t, "toolkit": None, "description": None, "schema": None}
    if isinstance(t, dict):
        slug = t.get('slug') or t.get('name') or t.get('id')
        name = t.get('name') or t.get('slug') or t.get('id')
        toolkit = (
            t.get('toolkit')
            or t.get('toolkit_slug')
            or t.get('toolkitSlug')
            or (t.get('meta') or {}).get('toolkit')
        )
        return {
            "slug": slug,
            "name": name,
            "toolkit": toolkit,
            "description": t.get('description'),
            "schema": t.get('schema'),
        }
    slug = getattr(t, 'slug', None) or getattr(t, 'name', None) or getattr(t, 'id', None)
    name = getattr(t, 'name', None) or getattr(t, 'slug', None) or getattr(t, 'id', None)
    toolkit = (
        getattr(t, 'toolkit', None)
        or getattr(t, 'toolkit_slug', None)
        or getattr(t, 'toolkitSlug', None)
        or getattr(getattr(t, 'meta', None), 'toolkit', None)
    )
    return {
        "slug": slug,
        "name": name,
        "toolkit": toolkit,
        "description": getattr(t, 'description', None),
        "schema": getattr(t, 'schema', None),
    }


def _serialize_tool_execution(r: Any) -> Dict[str, Any]:
    return {
        "status": getattr(r, 'status', None) or 'ok',
        "data": getattr(r, 'data', None) or getattr(r, 'response', None) or r,
    }
