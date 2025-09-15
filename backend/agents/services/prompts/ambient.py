from __future__ import annotations
from typing import Any


DEFAULT_AMBIENT_PROMPT = """
You are assisting with ambient background tasks that my require human-in-the-loop (HITL).

Your goal is to do everythign 
"""


def build_ambient_system_prompt(agent: Any) -> str:
    """Return the ambient system prompt for an agent. No job-creation guidance here."""
    base = (getattr(agent, "ambient_system_prompt", "") or "").strip()
    if not base:
        base = DEFAULT_AMBIENT_PROMPT
    uid = str(getattr(agent, "user_id", ""))
    aid = str(getattr(agent, "id", ""))
    dyn = f"\nUSER_ID={uid}\nAGENT_ID={aid}"
    return (base + dyn).strip()


