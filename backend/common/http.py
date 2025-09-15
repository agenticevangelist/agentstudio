from typing import Any, Dict, Optional
import json
from django.http import HttpRequest
from rest_framework.authtoken.models import Token


def json_body(request: HttpRequest) -> Dict[str, Any]:
    """Safely parse JSON body for application/json requests."""
    try:
        if request.content_type and "application/json" in request.content_type:
            return json.loads(request.body or b"{}") or {}
        return {}
    except Exception:
        return {}


def require_user(request: HttpRequest) -> Optional[Dict[str, Any]]:
    """Return current user from session or Token header.

    Supports:
    - Django session auth (request.user)
    - Token header: "Authorization: Token <key>"
    """
    # Prefer session user if authenticated
    user = getattr(request, "user", None)
    if not (user and getattr(user, "is_authenticated", False)):
        # Fallback to DRF token header (not using DRF view here, so parse manually)
        authz = request.headers.get("Authorization") or request.headers.get("authorization") or ""
        if authz.lower().startswith("token "):
            key = authz.split(" ", 1)[1].strip()
            try:
                token = Token.objects.select_related("user").get(key=key)
                user = token.user
            except Token.DoesNotExist:
                user = None
    if not user:
        return None
    return {
        "id": str(user.id),
        "email": getattr(user, "email", "") or "",
        "username": getattr(user, "username", "") or "",
    }
