from __future__ import annotations
from typing import Any, Dict, List, Optional
import os

from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import JsonOutputParser


class _Integration(BaseModel):
    toolkit_slug: str
    tool_slugs: List[str] = Field(default_factory=list)
    icon_url: Optional[str] = None


class _SuggestionItem(BaseModel):
    prompt: str
    integrations: List[_Integration] = Field(default_factory=list)


class _Suggestions(BaseModel):
    tasks: List[_SuggestionItem] = Field(default_factory=list)
    jobs: List[_SuggestionItem] = Field(default_factory=list)


class SuggestionGenerator:
    def __init__(self, model: Optional[str] = None):
        self.model_name = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        # ChatOpenAI uses OPENAI_API_KEY from env
        self.llm = ChatOpenAI(model=self.model_name, temperature=0)
        self.parser = JsonOutputParser(pydantic_object=_Suggestions)

    def generate(
        self,
        *,
        agent: Dict[str, Any],
        toolkit_plan: List[Dict[str, Any]],
        connected_toolkits: List[Dict[str, Any]],
        connected_tools: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        system = (
            "You propose practical, high-impact suggestions for an agent based on its purpose and the available "
            "integrations and tools. Only use toolkits and tools that are provided in the context (connected or planned).\n"
            "Each suggestion must contain a clear, complete prompt that a typical user would type. Prompts must be natural "
            "and concise, without tool or toolkit names. Output strictly valid JSON matching the schema."
        )

        connected_toolkit_slugs = sorted({(str(t.get("slug", ""))).lower() for t in connected_toolkits})
        planned_toolkit_slugs = sorted({(str((t.get("slug") or t))).lower() for t in toolkit_plan})
        all_toolkit_slugs = sorted(set(connected_toolkit_slugs) | set(planned_toolkit_slugs))

        tools_by_toolkit: Dict[str, List[str]] = {}
        for t in connected_tools:
            k = str(t.get("toolkit", "")).lower()
            s = str(t.get("slug", ""))
            if not k or not s:
                continue
            tools_by_toolkit.setdefault(k, []).append(s)

        icon_map = {str(t.get("slug", "")).lower(): t.get("icon_url") for t in connected_toolkits}

        human = (
            f"Agent name: {agent.get('name','')}\n"
            f"Purpose: {agent.get('purpose','')}\n"
            f"Connected toolkits: {', '.join(connected_toolkit_slugs) or 'none'}\n"
            f"Planned toolkits: {', '.join(planned_toolkit_slugs) or 'none'}\n"
            f"Tools by toolkit: {tools_by_toolkit}\n"
            f"Toolkit icons (slug->icon_url): {icon_map}\n"
            f"All toolkits usable (prefer connected): {', '.join(all_toolkit_slugs) or 'none'}\n"
            "Produce up to 4 tasks and 4 jobs. For each, provide a single-line, self-contained prompt. "
            "Integrations metadata should include toolkit_slug and concrete tool_slugs (if any) and icon_url when available."
        )

        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system),
            HumanMessagePromptTemplate.from_template("{input}")
        ])

        chain = prompt | self.llm | self.parser
        result = chain.invoke({"input": human})
        # parser may return a plain dict depending on runtime versions
        if isinstance(result, dict):
            return result
        try:
            return result.model_dump()
        except Exception:
            # last resort: coerce to dict
            return dict(result)
