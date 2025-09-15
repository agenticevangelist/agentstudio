from __future__ import annotations
from typing import Any, Iterable, List

from langgraph.prebuilt import ToolNode

from .knowledge import KNOWLEDGE_TOOLS
from .graph_factory import request_human  # reuse the existing tool implementation


def list_chat_tools(agent: Any, composio_tools: Iterable[Any], include_job_tools: bool = True) -> List[Any]:
    """Chat tool policy: knowledge + optional job tools + composio tools. (No request_human)"""
    tools: List[Any] = [*KNOWLEDGE_TOOLS]
    if include_job_tools:
        tools.extend(_job_tools_lazy())
    if composio_tools:
        tools.extend(list(composio_tools))
    return tools


def list_ambient_tools(agent: Any, composio_tools: Iterable[Any]) -> List[Any]:
    """Ambient policy: knowledge + request_human + composio tools. No job creation tools."""
    tools: List[Any] = [*KNOWLEDGE_TOOLS, request_human]
    if composio_tools:
        tools.extend(list(composio_tools))
    return tools


def _job_tools_lazy() -> List[Any]:
    """Import and return the job-creation tools defined in graph_factory without duplication."""
    from .graph_factory import build_job_tools
    return build_job_tools()


