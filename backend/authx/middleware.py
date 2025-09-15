from typing import Optional
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpRequest


class SupabaseJWTMiddleware(MiddlewareMixin):
    """Deprecated: no-op middleware retained for backwards compatibility."""

    def process_request(self, request: HttpRequest):
        return None
