from typing import Optional, Tuple

from rest_framework.authentication import BaseAuthentication


class SupabaseBearerAuthentication(BaseAuthentication):
    """Deprecated: no-op authentication class for backwards compatibility."""

    def authenticate(self, request) -> Optional[Tuple[object, str]]:
        return None
