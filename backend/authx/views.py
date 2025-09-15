import json
from typing import Any, Dict, Optional

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token


def _json_body(request: HttpRequest) -> Dict[str, Any]:
    try:
        if request.content_type and "application/json" in request.content_type:
            return json.loads(request.body or b"{}") or {}
        return {}
    except Exception:
        return {}


def _bearer_token(request: HttpRequest) -> Optional[str]:
    authz = request.headers.get("Authorization") or request.headers.get("authorization") or ""
    if authz.lower().startswith("bearer "):
        return authz.split(" ", 1)[1].strip()
    return None


@csrf_exempt
def login_view(request: HttpRequest):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    body = _json_body(request)
    username_or_email = body.get("email") or body.get("username")
    password = body.get("password")
    if not username_or_email or not password:
        return JsonResponse({"error": "email/username and password are required"}, status=400)
    # Try username first, then email lookup
    User = get_user_model()
    user = authenticate(request, username=username_or_email, password=password)
    if not user:
        try:
            user_obj = User.objects.get(email=username_or_email)
            user = authenticate(request, username=user_obj.username, password=password)
        except User.DoesNotExist:
            user = None
    if not user:
        return JsonResponse({"error": "Invalid credentials"}, status=401)
    login(request, user)
    token, _ = Token.objects.get_or_create(user=user)
    return JsonResponse({
        "user": {"id": user.id, "email": user.email, "username": user.username},
        "session": True,
        "token": token.key,
    })


@csrf_exempt
def signup_view(request: HttpRequest):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    body = _json_body(request)
    email = body.get("email")
    password = body.get("password")
    User = get_user_model()
    username = body.get("username") or (email.split("@")[0] if email else None)
    if not email or not password or not username:
        return JsonResponse({"error": "email, username, and password are required"}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({"error": "username already taken"}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "email already registered"}, status=400)
    user = User.objects.create_user(username=username, email=email, password=password)
    return JsonResponse({
        "user": {"id": user.id, "email": user.email, "username": user.username},
    }, status=201)


@csrf_exempt
def logout_view(request: HttpRequest):
    if request.method not in ("POST", "DELETE"):
        return JsonResponse({"error": "Method not allowed"}, status=405)
    logout(request)
    return JsonResponse({"ok": True})


def me_view(request: HttpRequest):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    # Support token auth via Authorization: Token <key>
    authz = request.headers.get("Authorization") or request.headers.get("authorization") or ""
    user = None
    if authz.lower().startswith("token "):
        key = authz.split(" ", 1)[1].strip()
        try:
            token = Token.objects.select_related("user").get(key=key)
            user = token.user
        except Token.DoesNotExist:
            user = None
    if not user and getattr(request, "user", None) and request.user.is_authenticated:
        user = request.user
    data = None
    if user:
        data = {"id": user.id, "email": user.email, "username": user.username}
    return JsonResponse({"user": data})
