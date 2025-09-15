from __future__ import annotations
from typing import Any

from ..domain.contracts import BaseAgent, AgentContext, AgentResult, LLMClient, ToolkitProvider


class CreatorAgent(BaseAgent):
    def __init__(self, llm: LLMClient, toolkits: ToolkitProvider):
        self.llm = llm
        self.toolkits = toolkits

    def setup(self, ctx: AgentContext) -> None:
        # no-op for now
        return None

    def handle(self, ctx: AgentContext, payload: dict[str, Any]) -> AgentResult:
        # Stub: echo a suggested toolkit plan based on purpose
        purpose = (payload.get("purpose") or "").lower()
        plan = []
        if "github" in purpose:
            plan.append({"slug": "github", "name": "GitHub", "description": "Interact with GitHub repositories"})
        return AgentResult(ok=True, data={"toolkit_plan": plan})
