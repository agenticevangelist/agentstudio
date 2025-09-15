from django.db import models
import uuid


class Agent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    purpose = models.TextField(blank=True, default="")
    system_prompt = models.TextField(blank=True, default="")
    model_name = models.CharField(max_length=200, blank=True, default="")
    memory = models.JSONField(default=dict, blank=True)
    agent_state = models.JSONField(default=dict, blank=True)
    toolkits = models.JSONField(default=list, blank=True)
    suggested_task_prompts = models.JSONField(default=list, blank=True)
    suggested_job_prompts = models.JSONField(default=list, blank=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agents"
        indexes = [
            models.Index(fields=["user_id"], name="agent_user_idx"),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"Agent({self.id}) {self.name}"


class AgentKnowledge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey("agents.Agent", on_delete=models.CASCADE, related_name="knowledge")
    title = models.CharField(max_length=255, blank=True, default="")
    tags = models.JSONField(default=list, blank=True)
    nodes_count = models.IntegerField(default=0)
    relationships_count = models.IntegerField(default=0)
    documents_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "agent_knowledge"
        indexes = [
            models.Index(fields=["agent"], name="agent_knowledge_agent_idx"),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"AgentKnowledge({self.id}) agent={self.agent_id} title={self.title}"


class Job(models.Model):
    STATUS_CHOICES = (
        ("active", "active"),
        ("paused", "paused"),
    )


    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey("agents.Agent", on_delete=models.CASCADE, related_name="jobs")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="active")
    # Composio metadata
    toolkit_slug = models.CharField(max_length=64, blank=True, default="")
    trigger_slug = models.CharField(max_length=128, blank=True, default="")
    connected_account_id = models.CharField(max_length=128, blank=True, default="")
    # Payload-only configuration for the trigger
    trigger_config = models.JSONField(default=dict, blank=True)
    thread = models.ForeignKey("chat.Thread", on_delete=models.SET_NULL, null=True, blank=True, related_name="jobs")
    created_by_user_id = models.UUIDField()
    last_run_at = models.DateTimeField(null=True, blank=True)
    next_run_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "agent_jobs"
        indexes = [
            models.Index(fields=["agent", "status"], name="job_agent_status_idx"),
            models.Index(fields=["toolkit_slug"], name="job_toolkit_idx"),
            models.Index(fields=["connected_account_id"], name="job_connected_account_idx"),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"Job({self.id}) agent={self.agent_id} title={self.title}"
