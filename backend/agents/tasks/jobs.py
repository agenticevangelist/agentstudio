from __future__ import annotations
from celery import shared_task
from typing import Any, Dict, Optional
from django.utils import timezone
from django.db import transaction
import logging

from agents.services import graph_factory
from agents.models import Agent, Job
from chat.models import Thread, Message, Run
from inbox.models import InboxItem


logger = logging.getLogger(__name__)

@shared_task
def ambient_run_task(agent_id: str, payload: Dict[str, Any], correlation_id: str, user_id: Optional[str], thread_id: Optional[str] = None, job_id: Optional[str] = None):
    """Run an ambient job through the graph and persist effects.
    - If waiting_human: create InboxItem and a Run with status waiting_human.
    - If succeeded: append an assistant Message and mark Run succeeded.
    """
    agent = Agent.objects.get(id=agent_id)
    if thread_id:
        thread = Thread.objects.get(id=thread_id)
        # Mark existing thread as ambient if not already
        if getattr(thread, "is_ambient", False) is False:
            thread.is_ambient = True
            thread.save(update_fields=["is_ambient", "updated_at"])  # updated_at exists on model
    else:
        thread = Thread.objects.create(
            user_id=agent.user_id,
            agent=agent,
            title="Ambient Job",
            is_ambient=True,
        )

    # 1) Create Run
    with transaction.atomic():
        run = Run.objects.create(
            thread=thread,
            agent=agent,
            status="running",
            correlation_id=correlation_id,
            created_by_user_id=user_id,
        )

    # 2) Drive ambient execution using agent-bound graph with seeded context
    import json as _json
    # Build agent-aware graph with ambient prompt/tools policy, but same HITL/checkpointer plumbing
    agent_graph = graph_factory.build_graph_with_agent_tools(agent, channel="ambient")
    # Load job for description/context by parsing from correlation_id pattern: "job-<uuid>-<...>"
    job = None
    if isinstance(correlation_id, str) and correlation_id.startswith("job-"):
        try:
            parts = correlation_id.split("-")
            # correlation_id like job-<uuid>-<rest>; UUID itself contains hyphens (5 parts)
            # Reconstruct UUID from parts[1:6]
            if len(parts) >= 7:
                candidate_uuid = "-".join(parts[1:6])
            elif len(parts) >= 6:
                candidate_uuid = "-".join(parts[1:6])
            else:
                candidate_uuid = parts[1]
            job = Job.objects.get(id=candidate_uuid)
        except Exception:
            job = None

    print("job description", job)
    job_desc = (getattr(job, "description", "") or "").strip()
    # Seed a concise user message: event type + payload + job goal
    payload_str = ""
    try:
        payload_str = _json.dumps(payload, ensure_ascii=False)[:4000]
    except Exception:
        payload_str = str(payload)[:4000]
    # Prefer structured seed payload for robust UI parsing
    seed_obj = {
        "type": "ambient_seed",
        "correlationId": correlation_id,
        "payload": payload,
        "jobGoal": job_desc,
    }
    seed_text = _json.dumps(seed_obj, ensure_ascii=False)
    # Persist the seed user message so the full context is visible in the thread
    with transaction.atomic():
        seq = Message.objects.filter(thread=thread).count()
        Message.objects.create(thread=thread, role="user", content=seed_text, sequence=seq)
        try:
            logger.info("ambient_run_task: saved seed user message seq=%s preview=%s", seq, seed_text[:120].replace("\n", " "))
        except Exception:
            pass

    # Include run_id so downstream tools/telemetry can correlate. Stream events like chat UI and accumulate raw output
    config = {"configurable": {"thread_id": str(thread.id), "user_id": str(user_id or agent.user_id), "run_id": str(run.id)}}
    import asyncio as _asyncio
    def _json_default(o):
        try:
            return str(o)
        except Exception:
            return None
    assistant_text = ""
    try:
        async def _collect():
            nonlocal assistant_text
            input_state = {"messages": [{"role": "user", "content": seed_text}]}
            async for ev in agent_graph.astream_events(input_state, version="v1", config=config):
                if isinstance(ev, dict):
                    if ev.get("event") == "on_chat_model_stream":
                        data = ev.get("data", {}) or {}
                        chunk = data.get("chunk")
                        if chunk and getattr(chunk, "content", None):
                            assistant_text += str(chunk.content)
                            continue
                    if ev.get("type") == "message_delta":
                        delta = ev.get("delta") or ""
                        if delta:
                            assistant_text += str(delta)
                        continue
                    if ev.get("event") in ("on_tool_start", "on_tool_end", "on_tool_error"):
                        import json as _json3
                        try:
                            assistant_text += _json3.dumps(ev, default=_json_default, ensure_ascii=False) + "\n"
                        except Exception:
                            pass
                        continue
        _asyncio.run(_collect())
    except Exception as e:
        # Fallback: produce an error message and mark as failed
        error_text = f"Graph execution failed: {e}"
        with transaction.atomic():
            seq = Message.objects.filter(thread=thread).count()
            Message.objects.create(thread=thread, role="assistant", content=f"[error] {error_text}", sequence=seq)
            run.status = "failed"
            run.completed_at = timezone.now()
            run.finished_at = run.completed_at
            run.error = error_text
            run.save(update_fields=["status", "completed_at", "finished_at", "error"])
            InboxItem.objects.create(
                user_id=agent.user_id,
                agent=agent,
                thread=thread,
                run=run,
                correlation_id=correlation_id,
                title="Job failed",
                body_json={"error": error_text},
                item_type="job_result",
                status="new",
            )
        return {"status": "failed", "thread_id": str(thread.id), "run_id": str(run.id)}

    # 3) Persist a single assistant message exactly like chat UI (assistant text + JSON tool event lines)
    if not (assistant_text or "").strip():
        assistant_text = ""
    with transaction.atomic():
        seq = Message.objects.filter(thread=thread).count()
        Message.objects.create(thread=thread, role="assistant", content=str(assistant_text), sequence=seq)

    # 4) If graph requested human review, respect waiting_human and do not mark as completed
    try:
        run.refresh_from_db()
    except Exception:
        pass
    if getattr(run, "status", "") == "waiting_human":
        # Tool already created a human_action_request InboxItem.
        return {"status": "waiting_human", "thread_id": str(thread.id), "run_id": str(run.id)}

    # 5) Create informational inbox item for success

    with transaction.atomic():
        seq = Message.objects.filter(thread=thread).count()
        Message.objects.create(thread=thread, role="assistant", content=assistant_text, sequence=seq)
        run.status = "succeeded"
        run.completed_at = timezone.now()
        run.finished_at = run.completed_at
        run.save(update_fields=["status", "completed_at", "finished_at"])
        InboxItem.objects.create(
            user_id=agent.user_id,
            agent=agent,
            thread=thread,
            run=run,
            correlation_id=correlation_id,
            title="Job completed",
            body_json={"summary": assistant_text[:1000]},
            item_type="job_result",
            status="new",
        )
    return {"status": "succeeded", "thread_id": str(thread.id), "run_id": str(run.id)}


def _compute_next_run_from_config(cfg: Dict[str, Any]) -> Optional[timezone.datetime]:
    """Return next run time based on simple schedule config. Supports:
    - interval_seconds: int
    Falls back to 24h if invalid.
    """
    try:
        interval = int((cfg or {}).get("schedule", {}).get("interval_seconds") or (cfg or {}).get("interval_seconds") or 0)
    except Exception:
        interval = 0
    if interval <= 0:
        interval = 24 * 3600
    return timezone.now() + timezone.timedelta(seconds=interval)


@shared_task
def enqueue_scheduled_jobs():
    """Scan for active scheduled jobs due now and enqueue ambient runs.
    Supports interval_seconds schedule; updates last_run_at and next_run_at.
    """
    now = timezone.now()
    qs = Job.objects.filter(status="active", trigger_type="schedule").order_by("next_run_at")
    due = qs.filter(next_run_at__lte=now) if qs.exists() else Job.objects.none()
    for job in due:
        try:
            agent = job.agent
            payload = (job.trigger_config or {}).get("payload") or {}
            corr = f"job-{job.id}-{int(now.timestamp())}"
            # Ensure thread exists
            if not job.thread_id:
                thread = Thread.objects.create(
                    user_id=agent.user_id,
                    agent=agent,
                    title=job.title or "Scheduled Job",
                    is_ambient=True,
                )
                job.thread = thread
            # Update schedule before enqueue to avoid double-firing
            job.last_run_at = now
            job.next_run_at = _compute_next_run_from_config(job.trigger_config or {})
            job.save(update_fields=["thread", "last_run_at", "next_run_at", "updated_at"])
            # Enqueue
            ambient_run_task.delay(str(agent.id), payload, corr, str(agent.user_id), str(job.thread_id) if job.thread_id else None, str(job.id))
        except Exception:
            # Best-effort: continue processing other jobs
            continue
