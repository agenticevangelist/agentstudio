from django.db import models
import uuid


class Thread(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    # Optional: link to an Agent configuration
    agent = models.ForeignKey('agents.Agent', on_delete=models.SET_NULL, null=True, blank=True, related_name='threads')
    title = models.CharField(max_length=255, blank=True, default="")
    # True when the thread was created by an ambient job/run and should not
    # appear in the main chat history sidebar by default.
    is_ambient = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_threads'
        indexes = [
            models.Index(fields=["user_id"], name="chat_thread_user_idx"),
        ]


class GraphCheckpoint(models.Model):
    """Persisted LangGraph checkpoint for a given thread/run.
    Stores opaque checkpoint data to enable resume after interrupt.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='checkpoints')
    run = models.ForeignKey('Run', on_delete=models.CASCADE, related_name='checkpoints')
    # Namespacing from LangGraph (superstep namespace) if used
    checkpoint_ns = models.CharField(max_length=128, blank=True, default="default")
    checkpoint_id = models.CharField(max_length=128)
    parent_id = models.CharField(max_length=128, blank=True, default="")
    # Opaque JSON blobs
    writes = models.JSONField(default=list)
    state = models.JSONField(default=dict)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_graph_checkpoints'
        indexes = [
            models.Index(fields=["thread", "created_at"], name="graph_ckpt_thread_idx"),
            models.Index(fields=["run", "created_at"], name="graph_ckpt_run_idx"),
            models.Index(fields=["checkpoint_id"], name="graph_ckpt_id_idx"),
        ]


class Message(models.Model):
    ROLE_CHOICES = (
        ("user", "user"),
        ("assistant", "assistant"),
        ("system", "system"),
        ("tool", "tool"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField(blank=True, default="")
    events_json = models.JSONField(default=dict, blank=True)
    # Tool call linkage for ReAct-style events
    tool_name = models.CharField(max_length=200, blank=True, default="")
    tool_call_id = models.CharField(max_length=200, blank=True, default="")
    sequence = models.IntegerField(default=0)  # ordering within thread
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_messages'
        indexes = [
            models.Index(fields=["thread", "sequence"], name="chat_msg_thread_seq_idx"),
        ]


class Run(models.Model):
    STATUS_CHOICES = (
        ("pending", "pending"),
        ("running", "running"),
        ("waiting_human", "waiting_human"),
        ("succeeded", "succeeded"),
        ("failed", "failed"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='runs')
    agent = models.ForeignKey('agents.Agent', on_delete=models.SET_NULL, null=True, blank=True, related_name='runs')
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="pending")
    correlation_id = models.CharField(max_length=200, blank=True, default="")  # tie to ambient jobs
    created_by_user_id = models.UUIDField(null=True, blank=True)  # interactive initiator
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    error = models.TextField(blank=True, default="")
    # LangGraph checkpoint linkage (for pause/resume). These are filled after the first checkpoint is created
    checkpoint_ns = models.CharField(max_length=128, null=True, blank=True)
    checkpoint_id = models.CharField(max_length=128, null=True, blank=True)

    class Meta:
        db_table = 'chat_runs'
        indexes = [
            models.Index(fields=["thread"], name="chat_run_thread_idx"),
            models.Index(fields=["correlation_id"], name="chat_run_corr_idx"),
        ]
