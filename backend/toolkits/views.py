from django.http import JsonResponse, HttpRequest
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
import json
import os

from connections.services.composio_service import ComposioService
from authx.utils import require_user
from django.core.cache import cache


@require_GET
def list_toolkits(request: HttpRequest):
    """GET /api/toolkits/ — List available Composio toolkits."""
    try:
        svc = ComposioService()
        data = svc.list_toolkits()
        return JsonResponse({"items": data}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_GET
def list_toolkits_cache(request: HttpRequest):
    """GET /api/toolkits/cache — Return cached toolkits from backend/toolkits_cache.json.

    This avoids SDK round-trips and enables instant search/filters on the frontend.
    """
    try:
        base_dir = os.path.dirname(os.path.dirname(__file__))  # backend/
        cache_path = os.path.join(base_dir, "toolkits_cache.json")
        with open(cache_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        items = data.get("items") if isinstance(data, dict) else data
        if not isinstance(items, list):
            items = []
        return JsonResponse({"items": items}, status=200)
    except FileNotFoundError:
        return JsonResponse({"items": []}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_GET
def list_tools(request: HttpRequest):
    """GET /api/tools — List available tools for the user by toolkits/search.

    Query params:
      - toolkits: comma-separated toolkit slugs
      - search: search string
      - userId: optional (fallback); prefer authenticated user
    """
    try:
        svc = ComposioService()
        toolkits_q = request.GET.get('toolkits')
        toolkits = [t for t in (toolkits_q or '').split(',') if t]
        search = request.GET.get('search') or None
        user_id = getattr(getattr(request, 'user', None), 'id', None) or request.GET.get('userId') or 'default'
        items = svc.list_tools(user_id=user_id, toolkits=toolkits or None, search=search)
        return JsonResponse({"items": items}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_GET
def get_toolkit_details(request: HttpRequest, slug: str):
    """GET /api/toolkits/{slug}/ — Toolkit auth and metadata details."""
    try:
        svc = ComposioService()
        details = svc.get_toolkit_details(slug)
        return JsonResponse(details, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# Wizard-focused endpoints (relocated from agents app)
@require_GET
def wizard_toolkit_details(request: HttpRequest, slug: str):
    """GET /api/toolkits/<slug>/details — minimal details for wizard UI."""
    try:
        cache_key = f"wizard_toolkit_details:{str(slug or '').upper()}"
        cached = cache.get(cache_key)
        if cached is not None:
            return JsonResponse(cached)
        svc = ComposioService()
        data = svc.get_toolkit_details(str(slug or "").upper())
        payload = {
            "authConfigDetails": data.get("authConfigDetails", []),
            "name": data.get("name") or slug,
            "slug": data.get("slug") or slug,
        }
        cache.set(cache_key, payload, timeout=300)
        return JsonResponse(payload)
    except Exception as e:
        # Fallback to API_KEY with no fields
        return JsonResponse({
            "authConfigDetails": [{
                "mode": "API_KEY",
                "fields": {
                    "authConfigCreation": {"required": [], "optional": []},
                    "connectedAccountInitiation": {"required": [], "optional": []},
                },
            }],
            "name": slug,
            "slug": slug,
        })


@require_GET
def wizard_toolkit_tools(request: HttpRequest, slug: str):
    """GET /api/toolkits/<slug>/tools — minimal tools list for wizard UI."""
    user = require_user(request)
    if not user:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    try:
        # Simple pagination
        try:
            page = max(1, int(request.GET.get("page", 1)))
        except Exception:
            page = 1
        try:
            page_size = max(1, min(100, int(request.GET.get("page_size", 50))))
        except Exception:
            page_size = 50

        svc = ComposioService()
        tools = svc.list_tools(user_id=str(user["id"]), toolkits=[str(slug or "").upper()]) or []
        # Cache per user+slug for the unpaginated list, then slice
        cache_key = f"wizard_toolkit_tools:{user['id']}:{str(slug or '').upper()}"
        cache.set(cache_key, tools, timeout=300)

        start = (page - 1) * page_size
        end = start + page_size
        page_items = tools[start:end]

        out = [{
            "name": t.get("name") or t.get("slug"),
            "description": t.get("description"),
            "function": {"name": t.get("slug")},
        } for t in page_items]
        return JsonResponse({
            "items": out,
            "page": page,
            "page_size": page_size,
            "total": len(tools),
        })
    except Exception:
        return JsonResponse({"items": [], "page": 1, "page_size": 0, "total": 0})
