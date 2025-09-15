from typing import Any, Dict, List
import logging

from agents.models import Agent
from agents.services.suggestions import SuggestionGenerator
from connections.services.composio_service import ComposioService


class FinalizeSetupError(Exception):
    pass


def finalize_setup(user_id: str, agent_id: str, connections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Persist connections for an agent under memory.connections with ownership enforcement.

    Args:
        user_id: The authenticated user's id (UUID as string)
        agent_id: Target agent UUID string
        connections: List of connection dicts

    Returns:
        A dict payload suitable for API response, e.g. {"ok": True}

    Raises:
        Agent.DoesNotExist: if the agent is not found for this user
        FinalizeSetupError: for other validation or persistence errors
    """
    if not agent_id:
        raise FinalizeSetupError("agentId is required")

    try:
        agent = Agent.objects.get(id=agent_id, user_id=user_id)
    except Agent.DoesNotExist:
        raise

    # Debug: log incoming payload shape (sanitized)
    try:
        sample = (connections or [])[:3]
        redacted: List[Dict[str, Any]] = []
        for item in sample:
            try:
                redacted.append({
                    "keys": list(item.keys()),
                    "toolkitSlug": item.get("toolkitSlug"),
                    "slug": item.get("slug"),
                    "toolkit": (item.get("toolkit") if isinstance(item.get("toolkit"), str) else (item.get("toolkit") or {}).get("slug")),
                    "has_enabledToolSlugs": bool(item.get("enabledToolSlugs")),
                })
            except Exception:
                redacted.append({"error": "inspect_failed"})
        logging.getLogger(__name__).info("finalize_setup payload debug: count=%s sample=%s", len(connections or []), redacted)
    except Exception:
        logging.getLogger(__name__).debug("finalize_setup payload debug logging failed", exc_info=True)

    try:
        memory = agent.memory or {}
        memory["connections"] = connections or []
        agent.memory = memory

        # Derive connected toolkit slugs for quick access on the model
        # Accept flexible shapes: {toolkitSlug}, {slug}, {toolkit: "gmail"}, {toolkit: {slug: "gmail"}}
        slugs: List[str] = []
        for c in connections or []:
            raw = c.get("toolkitSlug") or c.get("slug") or c.get("toolkit") or ""
            if isinstance(raw, dict):
                raw = raw.get("slug") or raw.get("id") or raw.get("name") or ""
            slug = str(raw).strip()
            if slug:
                slugs.append(slug.lower())
        # Deduplicate while preserving order
        seen: set[str] = set()
        dedup = []
        for s in slugs:
            if s not in seen:
                seen.add(s)
                dedup.append(s)
        # Store as list of objects with slug to match future extensibility
        agent.toolkits = [{"slug": s} for s in dedup]

        # Persist only changed fields for clarity
        agent.save(update_fields=["memory", "toolkits", "updated_at"])

        # Best-effort: generate suggestions using current toolkit plan and connections
        try:
            logging.getLogger(__name__).info("suggestions: start generation for agent=%s", agent.id)
            # Simplify: do not depend on agent.memory at all for suggestions
            toolkit_plan: List[Dict[str, Any]] = []
            logging.getLogger(__name__).info("suggestions: toolkit_plan count=%s (memory ignored)", len(toolkit_plan))
            # Enrich connected toolkits with icons/metadata
            svc = ComposioService()
            connected_toolkits: List[Dict[str, Any]] = []
            for t in (agent.toolkits or []):
                slug = (t.get("slug") or "").upper()
                if not slug:
                    continue
                try:
                    meta = svc.get_toolkit_details(slug)
                except Exception:
                    meta = {"slug": slug}
                connected_toolkits.append({
                    "slug": (meta.get("slug") or slug).lower(),
                    "icon_url": meta.get("icon_url"),
                    "name": meta.get("name") or slug,
                })
            logging.getLogger(__name__).info("suggestions: connected_toolkits count=%s slugs=%s", len(connected_toolkits), [x.get("slug") for x in connected_toolkits])

            # Collect connected tools for those toolkits for this user
            connected_tools: List[Dict[str, Any]] = []
            try:
                slugs = [str(t.get("slug") or "").upper() for t in (agent.toolkits or []) if t.get("slug")]
                if slugs:
                    tools = svc.list_tools(user_id=str(user_id), toolkits=slugs)
                    try:
                        logging.getLogger(__name__).info(
                            "suggestions: sample tools (serialized)=%s",
                            [{
                                "slug": x.get("slug"),
                                "name": x.get("name"),
                                "toolkit": x.get("toolkit"),
                            } for x in (tools or [])[:3]]
                        )
                    except Exception:
                        pass
                    # Normalize expected fields
                    for tool in tools or []:
                        connected_tools.append({
                            "slug": tool.get("slug"),
                            "name": tool.get("name"),
                            "toolkit": (tool.get("toolkit") or "").lower(),
                            "description": tool.get("description"),
                        })
            except Exception:
                connected_tools = []
            logging.getLogger(__name__).info("suggestions: connected_tools count=%s by_toolkit=%s", len(connected_tools), {
                k: len([t for t in connected_tools if t.get("toolkit") == k]) for k in sorted({t.get("toolkit") for t in connected_tools})
            })

            generator = SuggestionGenerator()
            payload = generator.generate(
                agent={"name": agent.name, "purpose": agent.purpose},
                toolkit_plan=toolkit_plan,
                connected_toolkits=connected_toolkits,
                connected_tools=connected_tools,
            )
            try:
                logging.getLogger(__name__).info("suggestions: raw response tasks=%s jobs=%s", len(payload.get("tasks") or []), len(payload.get("jobs") or []))
            except Exception:
                pass
            # Persist suggestions on dedicated fields
            agent.suggested_task_prompts = payload.get("tasks") or []
            agent.suggested_job_prompts = payload.get("jobs") or []
            agent.save(update_fields=["suggested_task_prompts", "suggested_job_prompts", "updated_at"])
            if not agent.suggested_task_prompts and not agent.suggested_job_prompts:
                logging.getLogger(__name__).warning("suggestions: EMPTY result for agent=%s (check OPENAI/Composio config and inputs)", agent.id)
        except Exception:
            # Do not fail finalize if suggestions generation fails
            logging.getLogger(__name__).error("finalize_setup: suggestion generation failed", exc_info=True)
        try:
            logging.getLogger(__name__).info("finalize_setup saved toolkits: %s", [t.get("slug") for t in (agent.toolkits or [])])
        except Exception:
            pass
        return {"ok": True}
    except Exception as e:
        raise FinalizeSetupError(str(e))
