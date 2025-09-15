from typing import Any, Dict, Iterator, List, Optional
import json
from django.db import transaction
from asgiref.sync import sync_to_async

from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    PendingWrite,
    get_checkpoint_id,
    get_checkpoint_metadata,
)

from chat.models import GraphCheckpoint, Thread, Run


class DjangoCheckpointer(BaseCheckpointSaver):
    """Django-backed checkpointer aligned with langgraph-checkpoint v2.1.1.

    Keys by thread_id and optional checkpoint_id. Relies on BaseCheckpointSaver.serde
    for encoding/decoding complex values, but stores Checkpoint dicts directly in JSON.
    """

    def __init__(self, namespace: str = "default") -> None:
        super().__init__()
        self.namespace = namespace

    # ---- sync API ----
    def get_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        cfg = (config or {}).get("configurable", {})
        thread_id = cfg.get("thread_id")
        if not thread_id:
            return None
        cid = get_checkpoint_id(config)
        qs = GraphCheckpoint.objects.filter(thread_id=thread_id)
        if cid:
            qs = qs.filter(checkpoint_id=cid)
        obj = qs.order_by("-created_at").first()
        if not obj:
            return None
        # Deserialize checkpoint state via BaseCheckpointSaver.serde
        try:
            # Avoid json.dumps on complex LC message types (e.g., ToolMessage)
            raw_bytes = self.serde.dumps(obj.state) if obj.state else b"{}"
            checkpoint: Checkpoint = self.serde.loads(raw_bytes)
        except Exception:
            # Fallback to raw dict if serde fails
            checkpoint = obj.state or {}
        metadata: CheckpointMetadata = obj.metadata or {}
        pending_writes: List[PendingWrite] = [tuple(w) for w in (obj.writes or [])]  # type: ignore[list-item]
        parent_cfg: Optional[RunnableConfig] = None
        return CheckpointTuple(config=config, checkpoint=checkpoint, metadata=metadata, parent_config=parent_cfg, pending_writes=pending_writes)

    def list(
        self,
        config: Optional[RunnableConfig],
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> Iterator[CheckpointTuple]:
        cfg = (config or {}).get("configurable", {}) if config else {}
        thread_id = cfg.get("thread_id")
        qs = GraphCheckpoint.objects.all()
        if thread_id:
            qs = qs.filter(thread_id=thread_id)
        if before:
            bid = get_checkpoint_id(before)
            if bid:
                qs = qs.filter(checkpoint_id__lt=bid)
        qs = qs.order_by("-created_at")
        if limit:
            qs = qs[:limit]
        for obj in qs:
            # Deserialize each checkpoint entry
            try:
                raw_bytes = self.serde.dumps(obj.state) if obj.state else b"{}"
                chk: Checkpoint = self.serde.loads(raw_bytes)
            except Exception:
                chk = obj.state or {}
            md: CheckpointMetadata = obj.metadata or {}
            pw: List[PendingWrite] = [tuple(w) for w in (obj.writes or [])]  # type: ignore[list-item]
            yield CheckpointTuple(config={"configurable": {"thread_id": str(obj.thread_id)}}, checkpoint=chk, metadata=md, parent_config=None, pending_writes=pw)

    @transaction.atomic
    def put(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: Dict[str, Any],
    ) -> RunnableConfig:
        cfg = (config or {}).get("configurable", {})
        thread_id = cfg.get("thread_id")
        if not thread_id:
            raise ValueError("thread_id is required in config.configurable")
        thread = Thread.objects.get(id=thread_id)
        # Maintain backward compatibility with schema requiring Run FK
        last_run = Run.objects.filter(thread=thread).order_by("-started_at").first()
        if last_run is None:
            last_run = Run.objects.create(thread=thread, status="pending")

        # Normalize metadata using helper
        metadata = get_checkpoint_metadata(config, metadata)

        GraphCheckpoint.objects.create(
            thread=thread,
            run=last_run,
            checkpoint_ns=self.namespace,
            checkpoint_id=str(checkpoint.get("id") or ""),
            parent_id=str(checkpoint.get("parents", {}).get(self.namespace, "")) if isinstance(checkpoint.get("parents"), dict) else str(checkpoint.get("parent_id") or ""),
            state=json.loads(self.serde.dumps(checkpoint).decode("utf-8")) if checkpoint else {},
            metadata=metadata or {},
            writes=[],
        )
        # Return config unchanged; engine tracks versions separately
        return config

    @transaction.atomic
    def put_writes(
        self,
        config: RunnableConfig,
        writes: List[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        cfg = (config or {}).get("configurable", {})
        thread_id = cfg.get("thread_id")
        if not thread_id:
            return
        obj = GraphCheckpoint.objects.filter(thread_id=thread_id).order_by("-created_at").first()
        if not obj:
            return
        existing: List[List[Any]] = obj.writes or []
        # Store as 3-tuples [task_id, channel, value], JSON-serializable via serde
        serialized: List[List[Any]] = []
        for (ch, val) in writes:
            try:
                payload = json.loads(self.serde.dumps(val).decode("utf-8"))
            except Exception:
                # Fallback: string repr to avoid DB write failures
                try:
                    payload = str(val)
                except Exception:
                    payload = None
            serialized.append([task_id, ch, payload])
        merged = existing + serialized
        obj.writes = merged
        obj.save(update_fields=["writes"])

    def delete_thread(self, thread_id: str) -> None:
        GraphCheckpoint.objects.filter(thread_id=thread_id).delete()

    # ---- async API ----
    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        return await sync_to_async(self.get_tuple, thread_sensitive=True)(config)

    async def alist(
        self,
        config: Optional[RunnableConfig],
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ):
        items = await sync_to_async(lambda: list(self.list(config, filter=filter, before=before, limit=limit)), thread_sensitive=True)()
        for x in items:
            yield x

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: Dict[str, Any],
    ) -> RunnableConfig:
        return await sync_to_async(self.put, thread_sensitive=True)(config, checkpoint, metadata, new_versions)

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: List[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        return await sync_to_async(self.put_writes, thread_sensitive=True)(config, writes, task_id, task_path)

    async def adelete_thread(self, thread_id: str) -> None:
        await sync_to_async(self.delete_thread, thread_sensitive=True)(thread_id)
