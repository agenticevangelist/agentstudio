from django.http import HttpRequest, StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.utils.timezone import now
import json
from typing import Any, Dict, Generator, List
import asyncio
import threading
import queue
import uuid

from .models import Thread, Message, Run
from agents.models import Agent
from agents.services import graph_factory
from common.http import require_user
from rest_framework.authtoken.models import Token


def _json(request: HttpRequest) -> Dict[str, Any]:
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return {}


def _auth_user_id(request: HttpRequest) -> str:
    """Resolve user id from Django session, DRF token, or explicit body field."""
    # Session user
    if getattr(request, "user", None) and getattr(request.user, "id", None):
        return str(request.user.id)
    # Token auth (Authorization: Token <key>)
    authz = request.headers.get("Authorization") or request.headers.get("authorization") or ""
    if authz.lower().startswith("token "):
        key = authz.split(" ", 1)[1].strip()
        try:
            token = Token.objects.select_related("user").get(key=key)
            if token.user and token.user.id:
                return str(token.user.id)
        except Token.DoesNotExist:
            pass
    # Back-compat helper (session only)
    user = require_user(request)
    if isinstance(user, dict) and user.get("id"):
        return str(user["id"])
    data = _json(request)
    uid = data.get("user_id") or data.get("userId")
    if uid:
        return str(uid)
    raise ValueError("Missing user_id")


@csrf_exempt
def interactive_stream(request: HttpRequest):
    """Stream interactive chat response from LangGraph.
    Body: { text: str, thread_id?: str, user_id?: str }
    Response: text/plain chunked assistant deltas
    Also persists the assistant message at the end if a thread_id is provided (and user message assumed persisted separately).
    """
    cid = str(uuid.uuid4())[:8]
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    data = _json(request)
    
    try:
        user_id = _auth_user_id(request)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    text = (data.get("text") or "").strip()
    thread_id = data.get("thread_id") or data.get("threadId")

    if not text:
        return JsonResponse({"error": "Missing text"}, status=400)

    # Fallback: create a thread if not provided
    if not thread_id:
        with transaction.atomic():
            # Default to last created agent for this user if available
            last_agent = Agent.objects.filter(user_id=user_id).order_by("-created_at").first()
            if not last_agent:
                # Create a minimal default agent for this user so chat can proceed
                last_agent = Agent.objects.create(user_id=user_id, name="My Agent", description="", purpose="")
            thread = Thread.objects.create(user_id=user_id, title=text[:80], agent=last_agent)
            thread_id = str(thread.id)
    
    try:
        thr = thread if 'thread' in locals() else Thread.objects.get(id=thread_id)
    except Thread.DoesNotExist:
        return JsonResponse({"error": "Invalid thread_id"}, status=400)

    # Ensure we have a Run for this thread so LangGraph checkpointer can persist state
    try:
        run = (
            Run.objects.filter(thread=thr)
            .order_by("-started_at")
            .first()
        )
        if not run or run.status in ("failed",):
            with transaction.atomic():
                run = Run.objects.create(thread=thr, status="running")
    except Exception as e:

        return JsonResponse({"error": f"Failed to create run: {e}"}, status=500)
    

    def generate() -> Generator[bytes, None, None]:
        """Bridge async token stream to sync HTTP streaming response."""
        acc: List[str] = []
        q: "queue.Queue[bytes | None]" = queue.Queue()

        # Safe JSON serializer for tool events (do not reshape; just coerce non-serializable values)
        def _json_default(o):  # type: ignore[override]
            try:
                return str(o)
            except Exception:
                return None

        def _runner() -> None:
            async def _work():
                try:
                    # Set current agent context for tools
                    try:
                        from agents.services.knowledge import set_current_agent_id
                        current_agent_id = None
                        try:
                            current_agent_id = str(thr.agent_id) if getattr(thr, "agent_id", None) else None
                        except Exception:
                            current_agent_id = None
                        set_current_agent_id(current_agent_id)
                    except Exception:
                        pass
                    # Use agent-aware streaming so tools are bound per agent.toolkits
                    agent_id_for_tools = str(getattr(thr, "agent_id", "")) or None
                    # Debug-only: no mutation/pairing; emit raw events
                    if agent_id_for_tools:
                        agen_stream = graph_factory.stream_interactive_async_with_agent  # type: ignore[attr-defined]
                        async for ev in agen_stream(
                            thread_id=thread_id,
                            text=text,
                            user_id=user_id,
                            agent_id=agent_id_for_tools,
                        ):
                            if isinstance(ev, dict):
                                # Convert model stream events to message_delta like the non-agent path
                                if ev.get("event") == "on_chat_model_stream":
                                    data = ev.get("data", {}) or {}
                                    chunk = data.get("chunk")
                                    if chunk and getattr(chunk, "content", None):
                                        q.put(str(chunk.content).encode("utf-8"))
                                        continue
                                if ev.get("type") == "message_delta":
                                    delta = ev.get("delta") or ""
                                    if delta:
                                        q.put(delta.encode("utf-8"))
                                    continue
                                if ev.get("event") in ("on_tool_start", "on_tool_end", "on_tool_error"):
                                    try:
                                        # Emit raw event line for frontend debugging
                                        try:
                                            import logging as _logging
                                            _logging.getLogger(__name__).info("tool_event: %s", {k: ev.get(k) for k in ("event","name","run_id","id")} )
                                        except Exception:
                                            pass
                                        q.put((json.dumps(ev, default=_json_default, ensure_ascii=False) + "\n").encode("utf-8"))
                                    except Exception:
                                        pass
                                    continue
                    else:
                        async for ev in graph_factory.stream_interactive_async(
                            thread_id, text, user_id,
                        ):
                            if isinstance(ev, dict):
                                if ev.get("type") == "message_delta":
                                    delta = ev.get("delta") or ""
                                    if delta:
                                        q.put(delta.encode("utf-8"))
                                    continue
                                if ev.get("event") in ("on_tool_start", "on_tool_end", "on_tool_error"):
                                    try:
                                        try:
                                            import logging as _logging
                                            _logging.getLogger(__name__).info("tool_event: %s", {k: ev.get(k) for k in ("event","name","run_id","id")} )
                                        except Exception:
                                            pass
                                        q.put((json.dumps(ev, default=_json_default, ensure_ascii=False) + "\n").encode("utf-8"))
                                    except Exception:
                                        pass
                                    continue
                except Exception as e:
                    
                    q.put(f"\n[error] {e}\n".encode("utf-8"))
                finally:
                    q.put(None)

            # Run the async stream on its own event loop
            asyncio.run(_work())

        t = threading.Thread(target=_runner, daemon=True)
        t.start()

        while True:
            chunk = q.get()
            if chunk is None:
                break
            try:
                s = chunk.decode("utf-8")
                acc.append(s)
                
            except Exception:
                pass
            yield chunk

        # Persist assistant message at end
        try:
            content = "".join(acc)
            
            if content:
                with transaction.atomic():
                    thr2 = Thread.objects.get(id=thread_id)
                    seq = (Message.objects.filter(thread=thr2).count() or 0) + 1
                    # Ensure assistant content is JSON-safe text
                    try:
                        persist_text = str(content)
                    except Exception:
                        persist_text = ""
                    Message.objects.create(thread=thr2, role="assistant", content=persist_text, sequence=seq)
                # Best-effort: attempt smart title update after assistant reply
                try:
                    _maybe_update_title(thread_id)
                except Exception as _e:
                    # Do not break streaming if title update fails
                    pass
           
        except Exception as e:
            
            yield f"\n[error] {e}\n".encode("utf-8")

    
    return StreamingHttpResponse(generate(), content_type="text/plain; charset=utf-8")


# ---- Smart title generation (best-effort) ----
from langchain_core.messages import HumanMessage


def _clean_title(s: str) -> str:
    s = (s or "").strip().strip('"\'')
    # Remove trailing punctuation
    while s and s[-1] in ",.;:!?":
        s = s[:-1]
    # Limit to 8 words
    words = [w for w in s.split() if w]
    return " ".join(words[:8])


def _generate_title(u0: str, ulast: str, alast: str) -> str:
    # If no model available (e.g., no API key), bail out quietly
    try:
        llm = graph_factory._build_llm()  # type: ignore[attr-defined]
    except Exception:
        return ""
    prompt = (
        "You are titling a chat. Produce a concise, human-friendly title (max 8 words).\n"
        "No punctuation, no quotes, no PII. Focus on the user's goal/topic.\n\n"
        f"First user message: \"{u0[:400]}\"\n"
        f"Latest user message: \"{ulast[:400]}\"\n"
        f"Latest assistant reply (excerpt): \"{alast[:400]}\"\n\n"
        "Title:"
    )
    try:
        ai = llm.invoke([HumanMessage(content=prompt)])  # type: ignore[attr-defined]
        title = getattr(ai, "content", "")
        return _clean_title(title)
    except Exception:
        return ""


def _maybe_update_title(thread_id: str) -> None:
    try:
        thr = Thread.objects.get(id=thread_id)
    except Thread.DoesNotExist:
        return
    msgs = list(Message.objects.filter(thread=thr).order_by("sequence", "created_at"))
    if len(msgs) < 3:
        return
    current = (thr.title or "").strip()
    # Skip if title already informative enough
    if len(current) >= 12 and not current.lower().startswith(("new chat", "untitled")):
        return
    # Collect context
    u0 = next((m.content for m in msgs if m.role == "user"), "")
    ulast = next((m.content for m in reversed(msgs) if m.role == "user"), "")
    alast = next((m.content for m in reversed(msgs) if m.role == "assistant"), "")
    if not (u0 and (ulast or alast)):
        return
    title = _generate_title(u0, ulast, alast)
    cleaned = _clean_title(title)
    if not cleaned:
        return
    if cleaned.lower() == current.lower():
        return
    try:
        thr.title = cleaned[:80]
        thr.save(update_fields=["title"])
    except Exception:
        pass


@csrf_exempt
def sessions(request: HttpRequest):
    """GET: list sessions (threads) for current user
       POST: create session { title: str, agent_id?: str }
    """
    try:
        user_id = _auth_user_id(request)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    if request.method == "GET":
        # Exclude ambient threads from chat history sidebar
        try:
            items = Thread.objects.filter(user_id=user_id, is_ambient=False).order_by("-created_at")
        except Exception:
            # Back-compat if old DB without is_ambient
            items = Thread.objects.filter(user_id=user_id).order_by("-created_at")
        return JsonResponse({
            "items": [
                {"id": str(t.id), "title": t.title, "createdAt": t.created_at.isoformat(), "agentId": str(t.agent_id) if t.agent_id else None}
                for t in items
            ]
        })

    if request.method == "POST":
        data = _json(request)
        title = (data.get("title") or "").strip() or "New chat"
        # Optional explicit agent, else default to last created
        agent_id = (data.get("agent_id") or data.get("agentId") or "").strip() or None
        agent = None
        if agent_id:
            try:
                agent = Agent.objects.get(id=agent_id, user_id=user_id)
            except Agent.DoesNotExist:
                agent = None
        if not agent:
            agent = Agent.objects.filter(user_id=user_id).order_by("-created_at").first()
        with transaction.atomic():
            t = Thread.objects.create(user_id=user_id, title=title, agent=agent, is_ambient=False)
        return JsonResponse({"id": str(t.id), "title": t.title, "createdAt": t.created_at.isoformat(), "agentId": str(agent.id) if agent else None})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def session_detail(request: HttpRequest, session_id: str):
    """GET: return session with messages
       POST: append a message { role: "user"|"assistant"|..., content: str }
    """
    try:
        user_id = _auth_user_id(request)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

    try:
        t = Thread.objects.get(id=session_id, user_id=user_id)
    except Thread.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)

    if request.method == "GET":
        msgs = Message.objects.filter(thread=t).order_by("sequence", "created_at")
        return JsonResponse({
            "id": str(t.id),
            "title": t.title,
            "agentId": str(t.agent_id) if t.agent_id else None,
            "messages": [
                {"id": str(m.id), "role": m.role, "content": m.content, "createdAt": m.created_at.isoformat()}
                for m in msgs
            ],
        })

    if request.method == "POST":
        data = _json(request)
        role = (data.get("role") or data.get("message", {}).get("role") or "user").strip()
        content = (data.get("content") or data.get("message", {}).get("content") or "").strip()
        if not content:
            return JsonResponse({"error": "Missing content"}, status=400)
        with transaction.atomic():
            seq = (Message.objects.filter(thread=t).count() or 0) + 1
            m = Message.objects.create(thread=t, role=role, content=content, sequence=seq)
        return JsonResponse({"id": str(m.id), "role": m.role, "content": m.content, "createdAt": m.created_at.isoformat()})

    if request.method == "PATCH":
        data = _json(request)
        new_agent_id = (data.get("agent_id") or data.get("agentId") or "").strip() or None
        if not new_agent_id:
            return JsonResponse({"error": "Missing agent_id"}, status=400)
        try:
            ag = Agent.objects.get(id=new_agent_id, user_id=user_id)
        except Agent.DoesNotExist:
            return JsonResponse({"error": "Agent not found"}, status=404)
        t.agent = ag
        t.save(update_fields=["agent"])
        return JsonResponse({"id": str(t.id), "agentId": str(ag.id)})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def tts(request: HttpRequest):
    """Stub TTS endpoint; kept for UI compatibility."""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    return JsonResponse({"ok": True, "message": "tts stub"})
