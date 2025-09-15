import time
from typing import Any, Dict, Optional
from typing import Union
import httpx
from django.conf import settings
from jose import jwt
from jose.utils import base64url_decode
import httpx
from django.http import HttpRequest


_JWKS_CACHE: Dict[str, Any] = {
    "jwks": None,
    "fetched_at": 0.0,
}


def _get_jwks_url() -> str:
    return ""


def _get_anon_key() -> str:
    return ""

def _get_jwt_secret() -> str:
    return ""


def fetch_jwks(force: bool = False) -> Optional[Dict[str, Any]]:
    return None


def fetch_supabase_user(token: str) -> Optional[Dict[str, Any]]:
    # Deprecated
    return None
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            data = resp.json()
            _JWKS_CACHE["jwks"] = data
            _JWKS_CACHE["fetched_at"] = now
            return data
    except Exception:
        return _JWKS_CACHE.get("jwks")


def get_bearer_token(request: Union[HttpRequest, Any]) -> str:
    """
    Extract a Bearer token from an incoming Django or DRF request.
    Returns "" if not present.
    """
    try:
        headers = getattr(request, "headers", {}) or {}
        # Some servers normalize case; check both
        authz = headers.get("Authorization") or headers.get("authorization") or ""
        if isinstance(authz, (list, tuple)):
            authz = authz[0] if authz else ""
        authz = str(authz)
        if authz.lower().startswith("bearer "):
            return authz.split(" ", 1)[1].strip()
        return ""
    except Exception:
        return ""


def require_user(request: Union[HttpRequest, Any]) -> Optional[Dict[str, Any]]:
    """
    Resolve the current user via Supabase given an incoming request.
    Returns a user dict with at least an "id" field, or None if unauthorized.
    """
    token = get_bearer_token(request)
    user = fetch_supabase_user(token)
    if not user or not user.get("id"):
        return None
    return user


def _get_rsa_key(token: str) -> Optional[Dict[str, Any]]:
    return None


def verify_supabase_jwt(token: str) -> Optional[Dict[str, Any]]:
    # Deprecated
    return None
