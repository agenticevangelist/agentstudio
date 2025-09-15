from django.db import models

class UserProfile(models.Model):
    """
    Minimal profile row keyed by Supabase Auth user id.
    We don't store passwords here; identity is Supabase-only.
    """
    id = models.UUIDField(primary_key=True, editable=False)
    email = models.EmailField(db_index=True)
    display_name = models.CharField(max_length=120, blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "authx_user_profiles"
        indexes = [
            models.Index(fields=["email"], name="authx_profile_email_idx"),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.email} ({self.id})"
