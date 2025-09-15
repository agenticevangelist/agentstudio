from __future__ import annotations
from typing import Iterable, Optional, List
import logging
import os

from ..domain.contracts import AgentContext

from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import JsonOutputParser


class _PlannedToolkits(BaseModel):
    toolkits: List[str]


class ToolkitPlanner:
    """LangChain/OpenAI-based planner that identifies Composio toolkit slugs from a goal."""

    def __init__(self, model: Optional[str] = None):
        self.model_name = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.llm = ChatOpenAI(model=self.model_name, temperature=0)
        self.parser = JsonOutputParser(pydantic_object=_PlannedToolkits)

    def plan(self, goal: str, ctx: Optional[AgentContext] = None) -> Iterable[dict]:
        logger = logging.getLogger(__name__)
        model_name = getattr(self.llm, "model_name", getattr(self.llm, "model", "unknown"))
        logger.info("ToolkitPlanner.plan: start goal=%r model=%s", goal, model_name)
        system = (
            "You are an expert AI software architect. Identify the Composio toolkit slugs needed "
            "to satisfy an agent's purpose. Return only valid, existing Composio toolkit slugs."
        )
        human = (
            f"Purpose: {goal}\n"
            "Return JSON of the form {\"toolkits\": [\"GMAIL\", \"REDDIT\", ...]} with only valid slugs."
        )
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system),
            HumanMessagePromptTemplate.from_template("{input}")
        ])
        logger.debug("ToolkitPlanner.plan: prompt_human=%s", human)
        chain = prompt | self.llm | self.parser
        try:
            raw = chain.invoke({"input": human})
        except Exception:
            logger.exception("ToolkitPlanner.plan: LLM chain invocation failed")
            raise
        logger.info("ToolkitPlanner.plan: raw_output=%s", raw)
        # JsonOutputParser may return a pydantic model or a dict; normalize
        if isinstance(raw, _PlannedToolkits):
            toolkits = raw.toolkits
        elif isinstance(raw, dict):
            toolkits = raw.get("toolkits") or []
        else:
            toolkits = []
        # Ensure list[str]
        out: List[str] = []
        for s in (toolkits or []):
            try:
                val = str(s).strip()
                if val:
                    out.append(val)
            except Exception:
                continue
        logger.info("ToolkitPlanner.plan: normalized_slugs=%s", out)
        return [{"slug": s} for s in out]
