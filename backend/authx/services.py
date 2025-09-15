import os
import uuid
from typing import Any, Dict, Optional, Tuple

import httpx
from django.utils import timezone
from .models import UserProfile

SUPABASE_URL = os.getenv("SUPABASE_PROJECT_URL") or os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

class AuthError(Exception):
    pass

class SupabaseAuthService:
    def __init__(self):
        raise AuthError("Supabase authentication is disabled")

    def _admin_headers(self) -> Dict[str, str]:
        raise AuthError("Supabase authentication is disabled")

    def _anon_headers(self, bearer: Optional[str] = None) -> Dict[str, str]:
        raise AuthError("Supabase authentication is disabled")

    def login(self, email: str, password: str) -> Dict[str, Any]:
        raise AuthError("Supabase authentication is disabled")

    def signup(self, email: str, password: str, name: Optional[str] = None) -> Dict[str, Any]:
        raise AuthError("Supabase authentication is disabled")

    def logout(self, access_token: str) -> None:
        raise AuthError("Supabase authentication is disabled")

    def _upsert_profile(self, user: Dict[str, Any]) -> None:
        return
