from django.utils import timezone
from django.db.models import Q
from django.db import transaction
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .models import InboxItem
from chat.models import Message, Run
from agents.services import graph_factory
from .serializers import InboxItemSerializer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from authx.permissions import IsAuthenticatedSimple
from rest_framework.authentication import SessionAuthentication, TokenAuthentication


@api_view(["GET"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def inbox_list(request):
    """List inbox items for the current user.
    Filters: status, agent_id, correlation_id.
    """
    user = getattr(request, "user", None)
    if not user or not getattr(user, "id", None):
        return Response({"error": "Unauthorized"}, status=401)
    user_id = str(user.id)

    qs = InboxItem.objects.filter(user_id=user_id)
    status_f = request.query_params.get("status")
    if status_f:
        qs = qs.filter(status=status_f)
    agent_id = request.query_params.get("agent_id")
    if agent_id:
        qs = qs.filter(agent_id=agent_id)
    correlation_id = request.query_params.get("correlation_id")
    if correlation_id:
        qs = qs.filter(correlation_id=correlation_id)

    qs = qs.order_by("-created_at")[:200]
    data = InboxItemSerializer(qs, many=True).data
    return Response(data)


@api_view(["POST"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def inbox_mark_read(request, id: str):
    try:
        item = InboxItem.objects.get(id=id)
    except InboxItem.DoesNotExist:
        return Response({"error": "not found"}, status=404)
    item.read_at = timezone.now()
    item.status = "read"
    item.save(update_fields=["read_at", "status", "updated_at"])
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(f"inbox_{item.user_id}", {"type": "inbox_item_updated", "id": str(item.id), "status": "read"})
    except Exception:
        pass
    return Response({"ok": True})


@api_view(["POST"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def inbox_respond(request, id: str):
    """Resume the ambient run using HITL response.
    Body: { "type": "accept|edit|ignore|response", "args": {...} }
    """
    try:
        item = InboxItem.objects.get(id=id)
    except InboxItem.DoesNotExist:
        return Response({"error": "not found"}, status=404)
    # Ownership check
    user = getattr(request, "user", None)
    if not user or not getattr(user, "id", None) or str(item.user_id) != str(user.id):
        return Response({"error": "Forbidden"}, status=403)

    rtype = request.data.get("type", "")
    args = request.data.get("args", {})
    if rtype not in ("accept", "edit", "ignore", "response"):
        return Response({"error": "invalid type"}, status=400)

    # Resume ambient graph using DB checkpointer
    thread = item.thread
    run: Run | None = item.run
    if thread and run:
        result = graph_factory.resume_ambient(str(thread.id), str(run.id), {"type": rtype, "args": args})
        content = result.get("message", "") or "(no output)"
        with transaction.atomic():
            seq = Message.objects.filter(thread=thread).count()
            Message.objects.create(thread=thread, role="assistant", content=content, sequence=seq)
            run.status = "succeeded"
            run.save(update_fields=["status"])
            # Create a new job_result inbox item for completion
            InboxItem.objects.create(
                user_id=item.user_id,
                agent=item.agent,
                thread=thread,
                run=run,
                correlation_id=item.correlation_id,
                title="Job result after HITL",
                body_json={"summary": content},
                item_type="job_result",
                status="new",
            )
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(f"thread_{thread.id}", {"type": "run_status", "status": "succeeded"})
            async_to_sync(channel_layer.group_send)(f"inbox_{item.user_id}", {"type": "inbox_item_new", "thread_id": str(thread.id)})
        except Exception:
            pass

    # Mark original action request as read
    item.status = "read"
    item.read_at = timezone.now()
    item.save(update_fields=["status", "read_at", "updated_at"])
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(f"inbox_{item.user_id}", {"type": "inbox_item_updated", "id": str(item.id), "status": "read"})
    except Exception:
        pass
    return Response({"ok": True, "thread_id": str(thread.id) if thread else None, "run_id": str(run.id) if run else None})


@api_view(["DELETE"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticatedSimple])
def inbox_delete(request, id: str):
    """DELETE /api/inbox/<id> — delete an inbox item owned by the user."""
    try:
        item = InboxItem.objects.get(id=id)
    except InboxItem.DoesNotExist:
        return Response({"error": "not found"}, status=404)
    user = getattr(request, "user", None)
    if not user or not getattr(user, "id", None) or str(item.user_id) != str(user.id):
        return Response({"error": "Forbidden"}, status=403)
    item.delete()
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(f"inbox_{item.user_id}", {"type": "inbox_item_deleted", "id": str(id)})
    except Exception:
        pass
    return Response({"ok": True})
