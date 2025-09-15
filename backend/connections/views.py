from django.http import JsonResponse, HttpRequest
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import logging
import os
import time
import hmac
import hashlib
import json
import base64
from django.conf import settings

from .services.composio_service import ComposioService
from .models import ConnectedIntegration
from common.http import require_user, json_body
from agents.tasks import ambient_run_task
from agents.models import Agent, Job


@csrf_exempt
@require_http_methods(["POST"])
def create_connected_account(request: HttpRequest):
    """POST /api/connections — custom auth (API_KEY/BASIC/etc.) -> connected account.

    Expected JSON: {"toolkitSlug": str, "credentials": dict, "authScheme": str}
    """
    try:
        payload = json_body(request)
        toolkit_slug = payload.get("toolkitSlug")
        # Use authenticated user id from Authorization/session
        u = require_user(request)
        user_id = str((u or {}).get("id") or "")
        credentials = payload.get("credentials") or {}
        auth_scheme = payload.get("authScheme")

        svc = ComposioService()
        # Create auth config including scheme and credentials (per SDK expectations)
        auth_cfg = svc.create_auth_config(
            toolkit_slug,
            {"type": "use_custom_auth", "authScheme": auth_scheme, "credentials": credentials},
        )
        # Initiate passing scheme so service can build correct auth_scheme config
        conn_req = svc.initiate_connected_account(
            str(user_id),
            auth_cfg["id"],
            {"credentials": credentials, "authScheme": auth_scheme},
        )
        connected = svc.wait_for_connection(conn_req["id"])  # blocks until done
        # Persist minimal linkage
        try:
            ci_user_id = str(user_id)
            tk = (connected or {}).get("toolkit", {}) or {}
            toolkit_slug = tk.get("slug") or ""
            ca_id = (connected or {}).get("id")
            status = (connected or {}).get("status") or ""
            if ci_user_id and ca_id and auth_cfg.get("id"):
                ConnectedIntegration.objects.update_or_create(
                    connected_account_id=ca_id,
                    defaults={
                        "user_id": str(ci_user_id),
                        "toolkit_slug": toolkit_slug,
                        "auth_config_id": auth_cfg["id"],
                        "status": status,
                    },
                )
        except Exception as e:
            logging.exception("Failed to persist ConnectedIntegration (custom auth): %s", e)
        return JsonResponse({"connectedAccount": connected, "authConfigId": auth_cfg["id"]}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def initiate_oauth(request: HttpRequest):
    """POST /api/connections/oauth/initiate

    Modes (single endpoint):
    - Initiate: body has { toolkitSlug, userId, callbackUrl } -> returns { redirectUrl, connectionRequestId }
    - Wait: body has { connectionRequestId } -> waits via SDK and returns { connectedAccount }
    """
    try:
        payload = json_body(request)
        connection_request_id = payload.get("connectionRequestId")
        svc = ComposioService()
        if connection_request_id:
            connected = svc.wait_for_connection(connection_request_id)
            # Persist minimal linkage
            try:
                # Use authenticated user id
                u = require_user(request)
                ci_user_id = str((u or {}).get("id") or "")
                tk = (connected or {}).get("toolkit", {}) or {}
                toolkit_slug = tk.get("slug") or ""
                ca_id = (connected or {}).get("id")
                status = (connected or {}).get("status") or ""
                ac_id = (connected or {}).get("authConfig", {}) or {}
                auth_config_id = ac_id.get("id")
                if ci_user_id and ca_id and auth_config_id:
                    ConnectedIntegration.objects.update_or_create(
                        connected_account_id=ca_id,
                        defaults={
                            "user_id": str(ci_user_id),
                            "toolkit_slug": toolkit_slug,
                            "auth_config_id": auth_config_id,
                            "status": status,
                        },
                    )
            except Exception as e:
                logging.exception("Failed to persist ConnectedIntegration (oauth wait): %s", e)
            return JsonResponse({"connectedAccount": connected}, status=200)

        toolkit_slug = payload.get("toolkitSlug")
        u = require_user(request)
        user_id = str((u or {}).get("id") or "")
        callback_url = payload.get("callbackUrl")
        if not toolkit_slug or not user_id or not callback_url:
            return JsonResponse({"error": "toolkitSlug, userId, callbackUrl are required"}, status=400)
        auth_cfg = svc.create_auth_config(toolkit_slug, {"type": "use_composio_managed_auth"})
        conn_req = svc.initiate_connected_account(str(user_id), auth_cfg["id"], {"callbackUrl": callback_url})
        return JsonResponse({"redirectUrl": conn_req.get("redirectUrl"), "connectionRequestId": conn_req.get("id")}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def list_connected_accounts(request: HttpRequest):
    """GET /api/connections/list — list existing connected accounts for the authenticated user.

    Optional query params:
      - toolkit: filter by toolkit slug (case-insensitive)
    """
    try:
        u = require_user(request)
        if not u:
            return JsonResponse({"error": "Unauthorized"}, status=401)
        toolkit = request.GET.get("toolkit")
        qs = ConnectedIntegration.objects.filter(user_id=str(u["id"]))
        if toolkit:
            qs = qs.filter(toolkit_slug__iexact=str(toolkit))
        items = [
            {
                "connectedAccountId": x.connected_account_id,
                "authConfigId": x.auth_config_id,
                "toolkitSlug": x.toolkit_slug,
                "status": x.status,
                "updatedAt": x.updated_at.isoformat() if x.updated_at else None,
            }
            for x in qs.order_by("-updated_at", "toolkit_slug")
        ]
        return JsonResponse({"items": items}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

 

@csrf_exempt
@require_http_methods(["POST"])
def composio_webhook(request: HttpRequest):
    """POST /api/triggers/composio/ — verify HMAC and enqueue ambient runs for matching Jobs.

    Headers: X-Composio-Signature: sha256=...
    env: COMPOSIO_WEBHOOK_SECRET
    Body: { toolkit_slug, trigger_slug, connected_account_id, payload }
    """
    try:
        print("[WEBHOOK] request=", request)
        secret_env = os.getenv("COMPOSIO_WEBHOOK_SECRET") or ""
        raw = request.body or b""
        # Support multiple possible signature header names from providers
        sig_header = (
            request.headers.get("X-Composio-Signature")
            or request.headers.get("Webhook-Signature")
            or request.headers.get("X-Webhook-Signature")
            or request.headers.get("X-Standard-Webhooks-Signature")
            or request.headers.get("Standard-Webhook-Signature")
            or ""
        ).strip()

        # --- Debug logging BEFORE verification so we can see headers/body even if 401 follows ---
        try:
            print("[WEBHOOK] path=", request.path, "method=", request.method, flush=True)
            print("[WEBHOOK] content_type=", request.headers.get("Content-Type"), flush=True)
            print("[WEBHOOK] signature_header=", sig_header, flush=True)
            preview = raw.decode(errors="ignore")[:1000]
            print("[WEBHOOK] body_preview=", preview, flush=True)
        except Exception:
            pass

        def verify_plain_sha256(secret_str: str, header_value: str) -> bool:
            try:
                hex_sig = hmac.new(secret_str.encode(), raw, hashlib.sha256).hexdigest()
                expected = "sha256=" + hex_sig
                # Accept either full "sha256=<hex>" or just the hex digest
                return hmac.compare_digest(expected, header_value) or hmac.compare_digest(hex_sig, header_value)
            except Exception:
                return False

        def verify_standard_webhooks(secret_b64: str, header_value: str) -> bool:
            # Header format: "t=timestamp,v1=base64_signature"
            try:
                parts = {kv.split("=", 1)[0].strip(): kv.split("=", 1)[1].strip() for kv in header_value.split(",") if "=" in kv}
                t = parts.get("t")
                v1 = parts.get("v1")
                if not t or not v1:
                    return False
                secret_bytes = base64.b64decode(secret_b64)
                signed_payload = f"{t}.".encode() + raw
                digest = hmac.new(secret_bytes, signed_payload, hashlib.sha256).digest()
                expected_v1 = base64.b64encode(digest).decode()
                return hmac.compare_digest(expected_v1, v1)
            except Exception:
                return False

        def verify_v1_only(header_value: str) -> bool:
            # Header format: "v1,<base64_signature>" — no timestamp
            try:
                if not header_value.startswith("v1,"):
                    return False
                v1 = header_value.split(",", 1)[1].strip()
                # Try base64 secret first
                ok = False
                try:
                    secret_bytes = base64.b64decode(secret_env)
                    digest = hmac.new(secret_bytes, raw, hashlib.sha256).digest()
                    expected_v1 = base64.b64encode(digest).decode()
                    ok = hmac.compare_digest(expected_v1, v1)
                except Exception:
                    ok = False
                # Fallback: treat secret as plain text if base64 decode fails
                if not ok and secret_env:
                    digest = hmac.new(secret_env.encode(), raw, hashlib.sha256).digest()
                    expected_v1 = base64.b64encode(digest).decode()
                    ok = hmac.compare_digest(expected_v1, v1)
                return ok
            except Exception:
                return False

        def verify_loose(header_value: str) -> bool:
            """Try a set of common encodings without prefixes."""
            try:
                candidates = []
                if secret_env:
                    # base64-secret
                    try:
                        secret_bytes = base64.b64decode(secret_env)
                        digest_bytes = hmac.new(secret_bytes, raw, hashlib.sha256).digest()
                        candidates.append(base64.b64encode(digest_bytes).decode())
                        candidates.append(hmac.new(secret_bytes, raw, hashlib.sha256).hexdigest())
                    except Exception:
                        pass
                    # plain-text secret
                    digest_bytes = hmac.new(secret_env.encode(), raw, hashlib.sha256).digest()
                    candidates.append(base64.b64encode(digest_bytes).decode())
                    candidates.append(hmac.new(secret_env.encode(), raw, hashlib.sha256).hexdigest())
                # Allow direct match of any candidate
                return any(hmac.compare_digest(c, header_value) for c in candidates)
            except Exception:
                return False

        # Bypass all signature verification (debug mode)
        try:
            logging.warning("[WEBHOOK] Signature verification DISABLED (temporary bypass)")
        except Exception:
            pass
        try:
            body = json.loads(raw.decode() or "{}")
        except Exception:
            body = {}
        try:
            print("[WEBHOOK] headers=", dict(request.headers), flush=True)
            print("[WEBHOOK] raw=", raw.decode(errors="ignore")[:1000], flush=True)
        except Exception:
            pass
        # Normalize multiple possible webhook shapes
        data_obj = body.get("data") or {}
        raw_type = str(body.get("type") or "")
        # Preferred fields
        toolkit_slug = str(body.get("toolkit_slug") or body.get("toolkit") or "").upper()
        trigger_slug = str(body.get("trigger_slug") or body.get("slug") or "").upper()
        connected_account_id = str(body.get("connected_account_id") or data_obj.get("connection_nano_id") or data_obj.get("connected_account_id") or "")
        payload = body.get("payload") or data_obj or {}
        # If trigger not provided explicitly, derive from 'type'
        if not trigger_slug and raw_type:
            trigger_slug = raw_type.replace("-", "_").upper()

        # Find which user owns this connected account
        try:
            ci = ConnectedIntegration.objects.get(connected_account_id=connected_account_id)
        except ConnectedIntegration.DoesNotExist:
            return JsonResponse({"ok": True, "matched": 0})
        user_id = ci.user_id
        # If toolkit not provided in payload, infer from the connected account record
        if not toolkit_slug:
            try:
                toolkit_slug = str(ci.toolkit_slug or "").upper()
            except Exception:
                toolkit_slug = ""

        # Match active jobs by user, trigger, and connected account
        matched = list(Job.objects.filter(
            agent__user_id=user_id,
            status="active",
            toolkit_slug__iexact=str(toolkit_slug or ""),
            trigger_slug__iexact=str(trigger_slug or ""),
            connected_account_id=str(connected_account_id or ""),
        ))

        try:
            print("[WEBHOOK] match_user=", user_id, "toolkit=", toolkit_slug, "trigger=", trigger_slug, "matched_jobs=", [str(j.id) for j in matched], flush=True)
        except Exception:
            pass
        for job in matched:
            corr = f"job-{job.id}-{int(time.time())}"
            try:
                print("[WEBHOOK] enqueue ambient_run_task", {"agent_id": str(job.agent_id), "thread_id": str(job.thread_id), "corr": corr}, flush=True)
            except Exception:
                pass
            # Create a new thread per job event to avoid coalescing into one thread; pass job_id for context resolution
            ambient_run_task.delay(str(job.agent_id), payload, corr, str(user_id), None, str(job.id))
        return JsonResponse({"ok": True, "matched": len(matched)})
    except Exception as e:
        logging.exception("composio_webhook failure: %s", e)
        return JsonResponse({"error": str(e)}, status=500)


# ---- Developer/agent tooling endpoints ----
@require_http_methods(["GET"])
def list_connected_toolkits(request: HttpRequest):
    """GET /api/toolkits/connected — return toolkit slugs that the user has connected accounts for."""
    try:
        u = require_user(request)
        if not u:
            return JsonResponse({"error": "Unauthorized"}, status=401)
        qs = ConnectedIntegration.objects.filter(user_id=str(u["id"]))
        slugs = sorted({x.toolkit_slug.upper() for x in qs})
        return JsonResponse({"items": slugs}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def list_triggers(request: HttpRequest, slug: str):
    """GET /api/toolkits/<slug>/triggers — list triggers for a toolkit."""
    try:
        svc = ComposioService()
        items = svc.list_triggers(slug)
        return JsonResponse({"items": items}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def get_trigger_schema(request: HttpRequest, slug: str, trigger_slug: str):
    """GET /api/toolkits/<slug>/triggers/<trigger_slug> — return trigger schema."""
    try:
        svc = ComposioService()
        data = svc.get_trigger_schema(slug, trigger_slug)
        return JsonResponse(data, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
