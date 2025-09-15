from django.db import models
import uuid


class InboxItem(models.Model):
    STATUS_CHOICES = (
        ("new", "new"),
        ("read", "read"),
        ("archived", "archived"),
    )

    ITEM_TYPE_CHOICES = (
        ("job_result", "job_result"),
        ("human_action_request", "human_action_request"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    agent = models.ForeignKey('agents.Agent', on_delete=models.SET_NULL, null=True, blank=True, related_name='inbox_items')
    thread = models.ForeignKey('chat.Thread', on_delete=models.SET_NULL, null=True, blank=True, related_name='inbox_items')
    run = models.ForeignKey('chat.Run', on_delete=models.SET_NULL, null=True, blank=True, related_name='inbox_items')

    # Correlate to external trigger/job
    correlation_id = models.CharField(max_length=200, blank=True, default="")

    # Presentation
    title = models.CharField(max_length=255, blank=True, default="")
    body_json = models.JSONField(default=dict, blank=True)
    item_type = models.CharField(max_length=32, choices=ITEM_TYPE_CHOICES, default="job_result")
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="new")
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inbox_items'
        indexes = [
            models.Index(fields=["user_id"], name="inbox_user_idx"),
            models.Index(fields=["status"], name="inbox_status_idx"),
            models.Index(fields=["correlation_id"], name="inbox_corr_idx"),
        ]
