from __future__ import annotations

from typing import Any, Dict, List
import logging

from agents.models import Agent
from agents.services.planner import ToolkitPlanner
from connections.services.composio_service import ComposioService


logger = logging.getLogger(__name__)


def plan_toolkits_for_agent(agent: Agent) -> List[Dict[str, Any]]:
    """Generate a toolkit plan for an `Agent` using the LLM-based planner and
    enrich each planned slug with metadata from Composio when available.

    Returns a list of dicts like {"slug": "GMAIL", ...metadata }.
    """
    planner = ToolkitPlanner()
    planned = list(planner.plan(agent.purpose, None))
    planned_slugs: List[str] = [str(p.get("slug") or "").upper() for p in planned if p.get("slug")]
    details: List[Dict[str, Any]] = []
    svc = ComposioService()
    for slug in planned_slugs:
        try:
            meta = svc.get_toolkit_details(slug)
            if isinstance(meta, dict):
                meta.setdefault("slug", slug)
                details.append(meta)
            else:
                details.append({"slug": slug})
        except Exception:
            logger.debug("plan_toolkits_for_agent: failed to fetch toolkit details for slug=%s", slug, exc_info=True)
            details.append({"slug": slug})
    return details


def persist_toolkit_plan(agent: Agent, details: List[Dict[str, Any]]) -> None:
    """Persist the toolkit plan under `agent.memory["toolkit_plan"]`."""
    mem = agent.memory or {}
    mem["toolkit_plan"] = details or []
    agent.memory = mem
    agent.save()


def plan_and_persist_toolkits(agent: Agent) -> None:
    """High-level helper to compute and save the toolkit plan for an agent.

    Any failures will be swallowed and result in an empty plan to avoid
    making agent creation fail due to non-critical planning issues.
    """
    try:
        details = plan_toolkits_for_agent(agent)
        persist_toolkit_plan(agent, details)
    except Exception:
        logger.exception("plan_and_persist_toolkits: planning failed; persisting empty plan")
        persist_toolkit_plan(agent, [])


