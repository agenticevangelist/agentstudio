from typing import Any, Dict, List

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.request import Request
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from django.conf import settings

from .models import Agent, AgentKnowledge, Job
from .serializers import AgentSerializer, AgentKnowledgeSerializer, JobSerializer
from agents.services.agent_setup import (
    finalize_setup as finalize_setup_service,
    FinalizeSetupError,
)
from authx.permissions import IsAuthenticatedSimple
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
import uuid
from agents.services.knowledge import ingest_text_documents, ingest_document_files
from agents.services.agent_service import plan_and_persist_toolkits
from connections.services.composio_service import ComposioService
from connections.models import ConnectedIntegration


class AgentViewSet(viewsets.ModelViewSet):
    serializer_class = AgentSerializer
    authentication_classes = [SessionAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticatedSimple]

    def _current_user(self) -> Dict[str, Any]:
        # Use UUID primary key from custom accounts.User
        user = getattr(self.request, "user", None)
        if not user or not getattr(user, "id", None):
            raise PermissionDenied("Unauthorized")
        return {"id": str(user.id)}

    def get_queryset(self):
        user = self._current_user()
        return Agent.objects.filter(user_id=user["id"]).order_by("-created_at")

    def perform_create(self, serializer):
        user = self._current_user()
        instance: Agent = serializer.save(user_id=user["id"])  # enforce ownership
        # Compute and persist toolkit plan (best-effort)
        plan_and_persist_toolkits(instance)


# Create your views here.


@csrf_exempt
@api_view(["POST"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def finalize_setup_view(request: Request):
    """
    POST /api/agents/finalize-setup
    Body: { agentId: str, connections: [{ toolkitSlug, connectedAccountId, authConfigId, enabledToolSlugs: [str] }] }
    Saves connections under agent.memory.connections.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    user = getattr(request, "user", None)
    if not user or not getattr(user, "id", None):
        return JsonResponse({"error": "Unauthorized"}, status=401)
    body = request.data
    agent_id = body.get("agentId")
    connections = body.get("connections") or []
    try:
        # Use our authenticated user's UUID directly
        result = finalize_setup_service(str(user.id), str(agent_id or ""), connections)
        return JsonResponse(result)
    except Agent.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    except FinalizeSetupError as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def ambient_test_view(request: Request, agent_id: str):
    """
    POST /api/agents/<agent_id>/ambient-test
    Body: { payload: any, threadId?: str, correlationId?: str }
    Enqueues a Celery ambient run using `ambient_run_task`.
    """
    from agents.tasks import ambient_run_task
    try:
        agent = Agent.objects.get(id=agent_id)
    except Agent.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    # Ownership check
    user = getattr(request, "user", None)
    if not user or not getattr(user, "id", None) or str(agent.user_id) != str(user.id):
        return JsonResponse({"error": "Forbidden"}, status=403)

    body = request.data or {}
    payload = body.get("payload") or {}
    thread_id = body.get("threadId") or None
    correlation_id = body.get("correlationId") or f"ambient-{uuid.uuid4()}"

    # Dispatch task (job_id unknown in this test endpoint)
    ambient_run_task.delay(str(agent.id), payload, correlation_id, str(user.id), thread_id, None)
    return JsonResponse({
        "ok": True,
        "agent_id": str(agent.id),
        "correlation_id": correlation_id,
        "queued": True,
    })


# ===== Jobs API =====
@csrf_exempt
@api_view(["GET", "POST"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def jobs_collection(request: Request, agent_id: str):
    """GET list jobs for agent; POST create job and ensure thread.
    POST body should validate against trigger schema at higher layers; we trust here.
    """
    try:
        agent = Agent.objects.get(id=agent_id)
    except Agent.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    user = getattr(request, "user", None)
    if not user or not getattr(user, "id", None) or str(agent.user_id) != str(user.id):
        return JsonResponse({"error": "Forbidden"}, status=403)

    if request.method == "GET":
        qs = Job.objects.filter(agent=agent).order_by("-created_at")
        return JsonResponse({"items": JobSerializer(qs, many=True).data})

    # POST create
    payload = request.data or {}
    data = dict(payload)
    data["agent"] = str(agent.id)
    data["created_by_user_id"] = str(user.id)
    # Expect explicit meta and payload-only trigger_config
    toolkit_slug = (payload.get("toolkit_slug") or payload.get("toolkitSlug") or "").strip()
    trigger_slug = (payload.get("trigger_slug") or payload.get("triggerSlug") or "").strip()
    connected_account_id = (payload.get("connected_account_id") or payload.get("connectedAccountId") or "").strip()
    trig_cfg = payload.get("trigger_config") or {}
    if not (toolkit_slug and trigger_slug and connected_account_id):
        return JsonResponse({"error": "toolkit_slug, trigger_slug, connected_account_id are required"}, status=400)
    # Ownership validation for connected account
    found = ConnectedIntegration.objects.filter(user_id=str(user.id), connected_account_id=str(connected_account_id)).exists()
    if not found:
        return JsonResponse({"error": "connected_account_id does not belong to user"}, status=403)
    # Ensure serializer only receives payload in trigger_config
    data["trigger_config"] = trig_cfg or {}
    ser = JobSerializer(data=data)
    if not ser.is_valid():
        return JsonResponse({"error": ser.errors}, status=400)
    job = ser.save()
    # Ensure thread exists
    from chat.models import Thread
    if not job.thread:
        job.thread = Thread.objects.create(
            user_id=agent.user_id,
            agent=agent,
            title=job.title or "Ambient Job",
            is_ambient=True,
        )
        job.save(update_fields=["thread"])
    # Register subscription using explicit args and payload-only config
    try:
        svc = ComposioService()
        sub = svc.register_subscription(toolkit_slug, trigger_slug, connected_account_id, job.trigger_config or {})
        if sub.get("id"):
            cfg = dict(job.trigger_config or {})
            cfg["subscription_id"] = sub["id"]
            job.trigger_config = cfg
            job.toolkit_slug = toolkit_slug
            job.trigger_slug = trigger_slug
            job.connected_account_id = connected_account_id
            job.save(update_fields=["trigger_config", "toolkit_slug", "trigger_slug", "connected_account_id"]) 
    except Exception:
        pass
    return JsonResponse(JobSerializer(job).data, status=201)


@csrf_exempt
@api_view(["GET", "DELETE", "POST"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def job_detail(request: Request, id: str):
    """GET details; DELETE remove; POST /toggle in body { action: toggle }"""
    try:
        job = Job.objects.get(id=id)
    except Job.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    user = getattr(request, "user", None)
    if not user or not getattr(user, "id", None) or str(job.agent.user_id) != str(user.id):
        return JsonResponse({"error": "Forbidden"}, status=403)

    if request.method == "GET":
        return JsonResponse(JobSerializer(job).data)

    if request.method == "DELETE":
        # Unregister subscription if present
        cfg = job.trigger_config or {}
        sub_id = cfg.get("subscription_id")
        if sub_id:
            try:
                svc = ComposioService()
                svc.unregister_subscription(sub_id)
            except Exception:
                pass
        job.delete()
        return JsonResponse({"ok": True})

    # POST with action
    action = (request.data or {}).get("action")
    if action == "toggle":
        new_status = "paused" if job.status == "active" else "active"
        # On pause, unregister if a subscription exists
        if new_status == "paused":
            cfg = job.trigger_config or {}
            sub_id = cfg.get("subscription_id")
            if sub_id:
                try:
                    svc = ComposioService()
                    if svc.unregister_subscription(sub_id):
                        cfg.pop("subscription_id", None)
                        job.trigger_config = cfg
                except Exception:
                    pass
        job.status = new_status
        job.save(update_fields=["status", "trigger_config", "updated_at"])
        return JsonResponse(JobSerializer(job).data)
    return JsonResponse({"error": "Unsupported action"}, status=400)


@csrf_exempt
@api_view(["POST"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def upload_knowledge_view(request: Request, agent_id: str):
    """
    POST /api/agents/<agent_id>/knowledge/upload
    Accepts multipart form-data with either:
    - file: zip containing nodes.csv and relationships.csv
    - nodes: CSV
    - relationships: CSV
    - or text_docs: JSON array of { title, content, tags? }
    Persists an AgentKnowledge row with summary counts.
    """
    # Ownership check
    try:
        agent = Agent.objects.get(id=agent_id)
    except Agent.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)
    user = getattr(request, "user", None)
    if not user or not getattr(user, "id", None) or str(agent.user_id) != str(user.id):
        return JsonResponse({"error": "Forbidden"}, status=403)

    # Accept multiple generic document files under key 'files'
    summary = {"nodes": 0, "relationships": 0, "documents": 0}
    try:
        file_list = request.FILES.getlist("files")  # type: ignore[attr-defined]
    except Exception:
        file_list = []
    if file_list:
        try:
            res = ingest_document_files(str(agent.id), [(f.name, f.read()) for f in file_list])
            summary["documents"] += int(res.get("documents", 0))
        except Exception as e:
            return JsonResponse({"error": f"Document ingestion failed: {e}"}, status=400)

    # Optional: plain text docs
    text_docs_raw = request.data.get("text_docs")
    if text_docs_raw:
        try:
            import json
            arr = json.loads(text_docs_raw) if isinstance(text_docs_raw, str) else text_docs_raw
            docs: List = []
            for item in arr or []:
                title = (item.get("title") or "Untitled").strip()
                content = (item.get("content") or "").strip()
                tags = item.get("tags") or []
                if content:
                    docs.append((title, content, tags))
            if docs:
                res2 = ingest_text_documents(str(agent.id), docs)
                summary["documents"] += int(res2.get("documents", 0))
        except Exception as e:
            return JsonResponse({"error": f"Text ingestion failed: {e}"}, status=400)

    # Persist summary record
    ak = AgentKnowledge.objects.create(
        agent=agent,
        title=(request.data.get("title") or "").strip(),
        tags=request.data.get("tags") or [],
        nodes_count=summary["nodes"],
        relationships_count=summary["relationships"],
        documents_count=summary["documents"],
    )
    return JsonResponse(AgentKnowledgeSerializer(ak).data)

@csrf_exempt
@api_view(["POST"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def test_agent_view(request: Request):
    """POST /api/agents/test
    This endpoint is used to test the agent functionality.
    """
    return JsonResponse({"message": "Test successful!"}, status=200)
