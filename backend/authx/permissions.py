from rest_framework.permissions import BasePermission


class IsAuthenticatedSimple(BasePermission):
    """Grants access if DRF authentication set request.user."""

    def has_permission(self, request, view) -> bool:
        return bool(getattr(request, "user", None) and getattr(request.user, "id", None))
