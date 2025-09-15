from django.db import models


class ConnectedIntegration(models.Model):
    """Minimal record linking a user (Supabase) to a Composio connected account.

    We store the Supabase user UUID in `user_id` instead of a Django FK because
    authentication is handled outside Django's user model.
    Composio manages tokens; we persist identifiers and minimal metadata.
    """

    user_id = models.CharField(max_length=64, db_index=True, null=True, blank=True)
    toolkit_slug = models.CharField(max_length=100, db_index=True)
    connected_account_id = models.CharField(max_length=128, unique=True)
    auth_config_id = models.CharField(max_length=128, db_index=True)
    status = models.CharField(max_length=64, db_index=True)
    metadata = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["user_id", "toolkit_slug"]),
        ]
        constraints = []

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.user_id}:{self.toolkit_slug}:{self.connected_account_id}"
