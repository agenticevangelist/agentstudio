

from __future__ import annotations
from typing import Any, Dict, List, Optional
import os

from langgraph.graph import StateGraph
from langgraph.graph import add_messages
from langgraph.prebuilt import ToolNode
from langchain_core.messages import (
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
    BaseMessage,
)
from langchain_openai import ChatOpenAI
from langgraph.types import interrupt, Command
import logging
# module logger
logger = logging.getLogger(__name__)
from agents.services.checkpointer import DjangoCheckpointer
from agents.services.knowledge import KNOWLEDGE_TOOLS
from typing_extensions import TypedDict, Annotated
from langgraph.prebuilt import tools_condition
from langchain_core.tools import tool
from asgiref.sync import sync_to_async
from django.utils import timezone
from chat.models import Message as _MsgModel, Run as _RunModel, Thread as _ThreadModel
from inbox.models import InboxItem as _InboxModel



# ---- Minimal State schema (list of messages) ----
class State(TypedDict):
    """Graph state: ensure messages flow between nodes via add_messages reducer.
    We persist JSON-serializable dict messages and convert to LC BaseMessage only at model call.
    """
    messages: Annotated[List[Any], add_messages]


# ---- Tools: bind generic knowledge tools ----
TOOLS: List[Any] = [*KNOWLEDGE_TOOLS]


def _as_lc_message(m: Any) -> BaseMessage:
    """Convert our stored message format into a LangChain BaseMessage."""
    if isinstance(m, BaseMessage):
        return m
    if isinstance(m, dict):
        role = m.get("role") or m.get("type")
        content = m.get("content", "")
        if role == "system":
            return SystemMessage(content=content)
        if role == "assistant":
            return AIMessage(content=content)
        if role == "tool":
            # Tool messages may have 'tool_call_id'; ensure content is string
            tcid = m.get("tool_call_id", "")
            text = content if isinstance(content, str) else str(content)
            return ToolMessage(content=text, tool_call_id=tcid)
        # default -> user
        return HumanMessage(content=content)
    # Fallback
    return HumanMessage(content=str(m))


def _build_llm():
    # Prefer real OpenAI if key is present, else fallback to local echo model.
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return _EchoLLM()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    temperature = float(os.getenv("OPENAI_TEMPERATURE", "0"))
    return ChatOpenAI(model=model, temperature=temperature)
# ---- HITL tool: allow assistant to request human review or mark complete ----
@tool("request_human", return_direct=False)
def request_human(reason: str = "", title: str = "Needs Review") -> Dict[str, Any]:
    """Ask for human review and pause the run. Persists run.status=waiting_human and creates an InboxItem.
    Args: reason (string), title (string)
    """
    try:
        # These are injected via config by callers
        import contextvars  # not used here; rely on DB lookup via recent Run
        # Best-effort: pick the most recent running run for this thread
        run = _RunModel.objects.filter(status="running").order_by("-started_at").first()
        if not run:
            return {"error": "No active run to mark waiting_human"}
        run.status = "waiting_human"
        run.finished_at = None
        run.completed_at = None
        run.save(update_fields=["status", "finished_at", "completed_at"])
        thread = run.thread
        agent = run.agent
        # Create a user-visible inbox item
        _InboxModel.objects.create(
            user_id=agent.user_id if agent else thread.user_id,
            agent=agent,
            thread=thread,
            run=run,
            correlation_id=run.correlation_id,
            title=title or "Needs Review",
            body_json={"reason": reason or "Assistant requested human review."},
            item_type="human_action_request",
            status="new",
        )
        return {"status": "waiting_human"}
    except Exception as e:
        return {"error": str(e)}

# Ensure tool is bound globally
TOOLS.append(request_human)



# ---- Node: call_model (real OpenAI chat model) ----
def call_model(state: State) -> Dict[str, List[Dict[str, Any]]]:
    """Call a real LLM and append its AIMessage to state.
    If tools are later added and tool_calls are produced, routing will send us to ToolNode.
    """
    # DEBUG: inspect incoming state
    try:
        msgs = state.get("messages") or []
        last = msgs[-1] if msgs else None
        last_role = (last.get("role") if isinstance(last, dict) else getattr(last, "type", None)) if last else None
        last_content = (last.get("content") if isinstance(last, dict) else getattr(last, "content", "")) if last else ""
        logger.debug("call_model: messages.count=%s last.role=%s last.content.len=%s", len(msgs), last_role, len(str(last_content)))
    except Exception:
        logger.exception("call_model: failed to log state")
    messages_in: List[BaseMessage] = []
    for m in state.get("messages", []) or []:
        messages_in.append(_as_lc_message(m))
    # Strict guard: do not call model with empty messages; raise and let caller handle.
    if not messages_in:
        raise ValueError("Empty messages passed to model")

    llm = _build_llm()
    if TOOLS:
        llm = llm.bind_tools(TOOLS)
    # DEBUG: model type and prompt size
    try:
        logger.debug("call_model: llm=%s prompt.messages=%s", type(llm).__name__, len(messages_in))
    except Exception:
        logger.debug("call_model: failed to log llm info")
    ai: AIMessage = llm.invoke(messages_in)
    # Persist JSON-safe dict, not LC object, to keep checkpointer serialization clean
    # Serialize AIMessage to JSON-safe dict using minimal fields (avoid raw LC objects like ToolMessage)
    out: Dict[str, Any] = {"role": "assistant", "content": getattr(ai, "content", "")}
    # DEBUG: model output
    try:
        content = out.get("content") or ""
        logger.debug("call_model: ai.content.len=%s preview=%s", len(str(content)), str(content)[:120].replace("\n", "\\n"))
    except Exception:
        logger.debug("call_model: failed to log ai output")
    # Preserve tool_calls if present (future-proof for tools routing)
    tool_calls = getattr(ai, "tool_calls", None)
    if tool_calls:
        try:
            import json as _jsonlib
            _jsonlib.dumps(tool_calls)
            out["tool_calls"] = tool_calls
        except Exception:
            # Best-effort: coerce to simple list of {name, arguments}
            simple: List[Dict[str, Any]] = []
            for tc in list(tool_calls or []):
                name = getattr(tc, "name", None) or (tc.get("name") if isinstance(tc, dict) else None)
                args = getattr(tc, "args", None) or (tc.get("args") if isinstance(tc, dict) else None)
                simple.append({"name": name, "args": args})
            out["tool_calls"] = simple
    return {"messages": [out]}


# ---- Build a simple ReAct-like graph ----
_builder = StateGraph(State)
_builder.add_node(call_model)
_builder.add_node("tools", ToolNode(TOOLS))
_builder.add_edge("__start__", "call_model")


def _route_model_output(state: State) -> str:
    # Delegate to built-in condition that inspects last model output
    try:
        return tools_condition(state)
    except Exception:
        return "__end__"


_builder.add_conditional_edges("call_model", _route_model_output)
_builder.add_edge("tools", "call_model")
# Enable short-term memory via LangGraph checkpointer; state persists per thread
graph = _builder.compile(name="Minimal ReAct Graph", checkpointer=DjangoCheckpointer())


def run_ambient(agent_id: str, payload: Dict[str, Any], correlation_id: str, user_id: Optional[str]) -> Dict[str, Any]:
    """Ambient entrypoint that requests human review first (HITL).
    Returns an interrupt envelope aligned with for_chat ambient examples.
    """
    request = {
        "action_request": {"action": "Review Payload", "args": payload or {}},
        "config": {
            "allow_ignore": True,
            "allow_respond": True,
            "allow_edit": True,
            "allow_accept": True,
        },
        "description": "Review incoming ambient job payload.",
    }
    return {"status": "waiting_human", "interrupt_request": request, "correlation_id": correlation_id}


# ===== Ambient workflow with true interrupt + checkpointer =====

def _ambient_hitl_node(state: State) -> Command[str]:
    """Prepare HITL request and pause for human via interrupt([...]).
    On resume, returns a Command to proceed to completion node with user response folded into messages.
    """
    # Build request envelope from current state payload summary (last user message)
    last_user = ""
    for m in state.get("messages", []) or []:
        if isinstance(m, dict) and m.get("role") == "user":
            last_user = m.get("content", "")
        elif isinstance(m, BaseMessage) and isinstance(m, HumanMessage):
            last_user = m.content
    request = {
        "action_request": {"action": "Review Payload", "args": {}},
        "config": {"allow_ignore": True, "allow_respond": True, "allow_edit": True, "allow_accept": True},
        "description": last_user,
    }
    human_response = interrupt([request])[0]
    # After resume, fold the response into messages and proceed
    rtype = human_response.get("type")
    rargs = human_response.get("args", {})
    summary = f"HITL response: {rtype} {rargs}"
    update = {"messages": [HumanMessage(content=summary)]}
    return Command(goto="ambient_complete", update=update)


def _ambient_complete_node(state: State) -> Dict[str, List[AIMessage]]:
    """Finish ambient flow using ambient prompt and ambient tool policy (knowledge + request_human + composio)."""
    # Resolve agent from the latest running Run (best-effort)
    agent = None
    try:
        latest_run = _RunModel.objects.filter(status="running").order_by("-started_at").first()
        if latest_run and getattr(latest_run, "thread", None) and getattr(latest_run.thread, "agent", None):
            agent = latest_run.thread.agent
    except Exception:
        agent = None

    # Build ambient tools (no job-creation tools)
    all_tools: List[Any] = []
    try:
        from agents.services.tools import list_ambient_tools  # local import to avoid circulars
        agent_tools = build_tools_for_agent(agent) if agent is not None else []
        all_tools = list_ambient_tools(agent, agent_tools)
    except Exception:
        all_tools = [*TOOLS]

    # Build ambient system prompt
    combined_prompt = "Ambient job"
    try:
        from agents.services.prompts.ambient import build_ambient_system_prompt  # type: ignore
        if agent is not None:
            combined_prompt = build_ambient_system_prompt(agent)
    except Exception:
        pass

    # Prepare messages and prepend system prompt
    messages_in: List[BaseMessage] = []
    for m in state.get("messages", []) or []:
        messages_in.append(_as_lc_message(m))
    if not messages_in or not isinstance(messages_in[0], SystemMessage):
        messages_in = [SystemMessage(content=combined_prompt)] + messages_in
    if not messages_in:
        messages_in = [HumanMessage(content="Proceed to complete the ambient task based on prior HITL context.")]

    llm = _build_llm().bind_tools(all_tools) if all_tools else _build_llm()
    ai: AIMessage = llm.invoke(messages_in)
    return {"messages": [ai]}


# Build ambient graph and compile with DB checkpointer
_ambient_builder = StateGraph(State)
_ambient_builder.add_node("ambient_hitl", _ambient_hitl_node)
_ambient_builder.add_node("ambient_complete", _ambient_complete_node)
_ambient_builder.add_edge("__start__", "ambient_hitl")
_ambient_builder.add_edge("ambient_hitl", "ambient_complete")
ambient_graph = _ambient_builder.compile(name="Ambient HITL Graph", checkpointer=DjangoCheckpointer())


def start_ambient(thread_id: str, run_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Start ambient graph execution; if it interrupts, return waiting_human with request envelope.
    Uses DB-backed checkpointer keyed by thread_id/run_id.
    """
    input_state: State = {"messages": [
        {"role": "system", "content": "Ambient job"},
        {"role": "user", "content": str(payload)},
    ]}
    cfg = {"configurable": {"thread_id": thread_id, "run_id": run_id}}
    for chunk in ambient_graph.stream(input_state, config=cfg):
        # Detect interrupt signal (for_chat examples emit "__interrupt__")
        if "__interrupt__" in chunk:
            req_list = chunk.get("__interrupt__") or []
            req = req_list[0] if isinstance(req_list, list) and req_list else {}
            return {"status": "waiting_human", "interrupt_request": req}
    # If no interrupt, collect last AI message content
    final: State = ambient_graph.get_state(config=cfg).values  # type: ignore[attr-defined]
    msgs = final.get("messages", [])
    text = ""
    if msgs:
        last = msgs[-1]
        text = last.content if isinstance(last, AIMessage) else last.get("content", "")
    return {"status": "succeeded", "message": text}


def resume_ambient(thread_id: str, run_id: str, human_response: Dict[str, Any]) -> Dict[str, Any]:
    """Resume ambient graph after HITL with provided response.
    Returns final assistant message text.
    """
    cfg = {"configurable": {"thread_id": thread_id, "run_id": run_id}}
    cmd = Command(resume=[human_response])
    for _ in ambient_graph.stream(cmd, config=cfg):
        pass
    final: State = ambient_graph.get_state(config=cfg).values  # type: ignore[attr-defined]
    msgs = final.get("messages", [])
    text = ""
    if msgs:
        last = msgs[-1]
        text = last.content if isinstance(last, AIMessage) else last.get("content", "")
    return {"status": "succeeded", "message": text}


def complete_after_hitl(action_request: Dict[str, Any], response_type: str, response_args: Dict[str, Any]) -> str:
    """Produce a simple assistant message after HITL decision.
    This mirrors resuming the graph post-interrupt; for now we synthesize a message.
    """
    action = (action_request or {}).get("action") or "Action"
    if response_type == "accept":
        return f"Confirmed: {action} accepted."
    if response_type == "edit":
        return f"Updated: {action} with edits {response_args}."
    if response_type == "response":
        return f"Acknowledged: {action} user response {response_args}."
    if response_type == "ignore":
        return f"Ignored: {action}."
    # Fallback using echo graph on the args
    out: State = graph.invoke({"messages": [{"role": "user", "content": str(response_args)}]})
    msgs = out.get("messages", [])
    return msgs[-1].content if msgs else ""


async def stream_interactive_async(thread_id: str, text: str, user_id: str, run_id: Optional[str] = None):
    """Async token-level streaming using LangGraph astream_events.
    Emits events: {type: 'run_status'|'message_delta'}
    """
    # Build LC messages (optionally include system context later)
    # Strict input validation
    if not (text or "").strip():
        raise ValueError("Empty text")
    # Let LangGraph memory (checkpointer) handle prior context; supply only the new turn.
    # Pass JSON-safe dict; conversion to LC happens inside call_model
    input_state: State = {"messages": [{"role": "user", "content": text}]}
    # DEBUG: entry params
    try:
        logger.debug("stream_interactive_async: start thread_id=%s run_id=%s user_id=%s text.len=%s", thread_id, run_id, user_id, len(text))
    except Exception:
        logger.debug("stream_interactive_async: failed to log start")
    yield {"type": "run_status", "status": "running"}
    # Stream graph events (passes through chat model stream events from call_model)
    cfg_conf: Dict[str, Any] = {"thread_id": thread_id, "user_id": user_id}
    if run_id:
        cfg_conf["run_id"] = run_id
    config = {"configurable": cfg_conf}
    try:
        logger.debug("stream_interactive_async: config=%s", config)
    except Exception:
        logger.debug("stream_interactive_async: failed to log config")
    events = graph.astream_events(input_state, version="v1", config=config)
    async for event in events:
        # Event types include: on_chat_model_start, on_chat_model_stream, on_chat_model_end, on_tool_start/end/error
        try:
            logger.debug("stream_interactive_async: event=%s", event.get("event"))
        except Exception:
            logger.debug("stream_interactive_async: failed to log event type")
        ev = event.get("event")
        if ev in ("on_tool_start", "on_tool_end", "on_tool_error"):
            # Stream raw tool events as-is; frontend will render them later
            try:
                yield event
            except Exception:
                pass
            continue
        if event.get("event") == "on_chat_model_stream":
            data = event.get("data", {}) or {}
            chunk = data.get("chunk")
            if chunk and getattr(chunk, "content", None):
                try:
                    logger.debug("stream_interactive_async: delta.len=%s preview=%s", len(str(chunk.content)), str(chunk.content)[:80].replace("\n", "\\n"))
                except Exception:
                    logger.debug("stream_interactive_async: failed to log delta")
                yield {"type": "message_delta", "delta": chunk.content}
            else:
                try:
                    logger.debug("stream_interactive_async: empty or no-content chunk: %r", chunk)
                except Exception:
                    logger.debug("stream_interactive_async: failed to log empty chunk")
    try:
        logger.debug("stream_interactive_async: end")
    except Exception:
        logger.debug("stream_interactive_async: failed to log end")
    yield {"type": "run_status", "status": "end"}


# ===== Composio tools binding for an Agent =====

def get_connected_toolkit_slugs(agent: Any) -> List[str]:
    """Return connected toolkit slugs for the agent from `agent.toolkits` when present.
    Falls back to memory.connections only if the column is empty.
    """
    # Prefer explicit column
    try:
        tk = getattr(agent, "toolkits", None) or []
        out: List[str] = []
        for item in tk:
            val = item.get("slug") if isinstance(item, dict) else item
            if val:
                v = str(val).upper()
                if v not in out:
                    out.append(v)
        if out:
            return out
    except Exception:
        logger.debug("get_connected_toolkit_slugs: failed to read agent.toolkits", exc_info=True)
    # Fallback to memory payload shape
    slugs: List[str] = []
    try:
        mem = getattr(agent, "memory", None) or {}
        conns = mem.get("connections") or []
        for c in conns:
            raw = c.get("toolkitSlug") or c.get("slug") or c.get("toolkit") or ""
            if isinstance(raw, dict):
                raw = raw.get("slug") or raw.get("id") or raw.get("name") or ""
            s = str(raw).strip()
            if s:
                s = s.upper()
                if s not in slugs:
                    slugs.append(s)
        if slugs:
            pass
    except Exception:
        logger.debug("get_connected_toolkit_slugs: failed to parse memory.connections", exc_info=True)
    return slugs


def build_tools_for_agent(agent: Any) -> List[Any]:
    """Fetch Composio tools for the agent's connected toolkits and return LC tools.
    Requires composio SDK and composio_langchain provider to be installed/configured.
    """
    try:
        from composio import Composio
        from composio_langchain import LangchainProvider
    except Exception:
        logger.debug("Composio or composio_langchain not installed; skipping agent tool binding")
        return []

    slugs = get_connected_toolkit_slugs(agent)
    if not slugs:
        return []

    try:
        composio = Composio(provider=LangchainProvider())
        uid = str(getattr(agent, "user_id", "default"))
        logger.debug("agent_tools: fetching tools user_id=%s toolkits=%s", uid, slugs)
        tools = composio.tools.get(user_id=uid, toolkits=slugs)
        logger.debug("agent_tools: fetched %s tools", len(tools) if hasattr(tools, "__len__") else "?")
        return tools  # These are LC-compatible tools
    except Exception:
        logger.exception("build_tools_for_agent: failed to fetch tools for %s", slugs)
        return []


def build_graph_with_agent_tools(agent: Any, channel: str = "chat") -> Any:
    """Return a compiled LangGraph where the model is bound with the agent's tools.
    channel: "chat" or "ambient" controls which prompt/tools policy to use.
    Falls back to knowledge tools if Composio tools are unavailable.
    """
    agent_tools = build_tools_for_agent(agent)
    if (channel or "chat").lower() == "ambient":
        # Ambient: knowledge + request_human + composio (no job-creation tools)
        from agents.services.tools import list_ambient_tools  # local import avoids circular
        all_tools: List[Any] = list_ambient_tools(agent, agent_tools)
    else:
        # Chat: knowledge + job tools + composio (no request_human)
        from agents.services.tools import list_chat_tools  # local import avoids circular
        all_tools = list_chat_tools(agent, agent_tools, include_job_tools=True)

    # Build a graph like the minimal ReAct one, but binding tools list
    builder = StateGraph(State)
    def _call_model_with_tools(state: State) -> Dict[str, List[Dict[str, Any]]]:
        try:
            messages_in: List[BaseMessage] = []
            for m in state.get("messages", []) or []:
                messages_in.append(_as_lc_message(m))
            # Prepend channel-specific system prompt
            if (channel or "chat").lower() == "ambient":
                from agents.services.prompts.ambient import build_ambient_system_prompt  # type: ignore
                combined_prompt = build_ambient_system_prompt(agent)
            else:
                from agents.services.prompts.chat import build_chat_system_prompt  # local import avoids circular
                combined_prompt = build_chat_system_prompt(agent)
            # Only prepend if not already present at the start
            if not messages_in or not isinstance(messages_in[0], SystemMessage):
                messages_in = [SystemMessage(content=combined_prompt)] + messages_in
            if not messages_in:
                raise ValueError("Empty messages passed to model")
            # Use full conversation history as-is (no trimming)
            # Single concise debug line about prompt/tools
            try:
                prompt_preview = (combined_prompt or "")[:120].replace("\n", " ")
                tool_names = []
                for t in all_tools:
                    try:
                        tool_names.append(getattr(t, "name", None) or getattr(t, "__name__", None) or str(t))
                    except Exception:
                        tool_names.append("<tool>")
                logger.info("agent_graph(channel=%s): agent=%s tools=%s prompt_preview=\"%s\"", (channel or "chat"), str(getattr(agent, "id", "")), tool_names, prompt_preview)
            except Exception:
                pass
            llm = _build_llm().bind_tools(all_tools) if all_tools else _build_llm()
            ai: AIMessage = llm.invoke(messages_in)
            out = {"messages": [{"role": "assistant", "content": getattr(ai, "content", ""), "tool_calls": getattr(ai, "tool_calls", None)}]}
            # Quiet success
            return out
        except Exception as e:
            logger.exception("agent_tools: model invoke failed: %s", e)
            # Surface a minimal error message back into the stream path
            return {"messages": [{"role": "assistant", "content": f"[error] {e}"}]} 

    builder.add_node(_call_model_with_tools)
    builder.add_node("tools", ToolNode(all_tools))
    # When addressing nodes in edges, use the node name string, not the function object
    builder.add_edge("__start__", "_call_model_with_tools")
    builder.add_conditional_edges("_call_model_with_tools", _route_model_output)
    builder.add_edge("tools", "_call_model_with_tools")
    return builder.compile(name="Agent Graph", checkpointer=DjangoCheckpointer())


def build_job_tools() -> List[Any]:
    """Expose job-creation tools for reuse (chat channel only)."""
    from connections.models import ConnectedIntegration
    from connections.services.composio_service import ComposioService
    from agents.models import Job as _JobModel
    from chat.models import Thread as _ThreadModel
    from langchain_core.tools import tool

    @tool("toolkits_connected", return_direct=False)
    def toolkits_connected(user_id: str) -> Dict[str, Any]:
        """List toolkit slugs the user has connected accounts for. Args: user_id (UUID string)."""
        try:
            qs = ConnectedIntegration.objects.filter(user_id=str(user_id))
            slugs = sorted({x.toolkit_slug.upper() for x in qs})
            return {"items": slugs}
        except Exception as e:
            return {"error": str(e)}

    @tool("list_triggers", return_direct=False)
    def list_triggers(toolkit_slug: str) -> Dict[str, Any]:
        """List triggers for a toolkit. Args: toolkit_slug (string)."""
        try:
            svc = ComposioService()
            items = svc.list_triggers(toolkit_slug)
            return {"items": items}
        except Exception as e:
            return {"error": str(e)}

    @tool("create_job", return_direct=False)
    def create_job(
        agent_id: str,
        user_id: str,
        toolkit_slug: str,
        trigger_slug: str,
        connected_account_id: str,
        title: str,
        description: str,
        trigger_config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Create a Job for an agent using Composio. Args: agent_id, user_id, toolkit_slug, trigger_slug, connected_account_id, title, description, trigger_config (payload only). Returns: { id, thread_id }"""
        try:
            job = _JobModel.objects.create(
                agent_id=agent_id,
                title=title or "Ambient Job",
                description=description or "",
                status="active",
                toolkit_slug=toolkit_slug,
                trigger_slug=trigger_slug,
                connected_account_id=connected_account_id,
                trigger_config=trigger_config or {},  # payload only
                created_by_user_id=user_id,
            )
            if not job.thread_id:
                thread = _ThreadModel.objects.create(user_id=job.agent.user_id, agent=job.agent, title=job.title or "Ambient Job")
                job.thread = thread
                job.save(update_fields=["thread"])
            # Register subscription for composio using explicit args and payload-only config
            try:
                svc = ComposioService()
                sub = svc.register_subscription(toolkit_slug, trigger_slug, connected_account_id, trigger_config or {})
                if sub.get("id"):
                    # store subscription_id alongside payload
                    cfg = dict(job.trigger_config or {})
                    cfg["subscription_id"] = sub["id"]
                    job.trigger_config = cfg
                    job.save(update_fields=["trigger_config"]) 
            except Exception:
                # best-effort; do not fail job creation if subscription registration fails
                pass
            return {"id": str(job.id), "thread_id": str(job.thread_id) if job.thread_id else None}
        except Exception as e:
            return {"error": str(e)}

    return [toolkits_connected, list_triggers, create_job]


# ---- Agent-aware streaming using agent-bound tools ----
async def stream_interactive_async_with_agent(thread_id: str, text: str, user_id: str, agent_id: str):
    """Async token-level streaming using an agent-bound graph.
    Mirrors stream_interactive_async but binds tools using agent.toolkits.
    """
    # Import here to avoid circulars at module import time
    try:
        from agents.models import Agent as _AgentModel  # type: ignore
        from asgiref.sync import sync_to_async
        agent = await sync_to_async(_AgentModel.objects.get)(id=agent_id)
    except Exception as e:
        logger.error("stream_interactive_async_with_agent: failed to load agent %s: %s", agent_id, e)
        # Fallback to global graph
        async for ev in graph.astream_events({"messages": [{"role": "user", "content": text}]}, version="v1", config={"configurable": {"thread_id": thread_id, "user_id": user_id}}):
            yield ev
        return

    agent_graph = build_graph_with_agent_tools(agent)
    input_state: State = {"messages": [{"role": "user", "content": text}]}
    config = {"configurable": {"thread_id": thread_id, "user_id": user_id}}
    # Quiet start; keep logs minimal
    try:
        async for ev in agent_graph.astream_events(input_state, version="v1", config=config):
            yield ev
    except Exception as e:
        logger.exception("stream_interactive_async_with_agent: graph streaming failed: %s", e)
        # yield an error event compatible with caller handling
        yield {"type": "message_delta", "delta": f"\n[error] {e}\n"}

