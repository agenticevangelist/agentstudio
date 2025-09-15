from __future__ import annotations
from typing import Callable, Dict, Union

from django.conf import settings
from django.utils.module_loading import import_string

from ..domain.contracts import BaseAgent, LLMClient, ToolkitProvider
from ..domain.enums import AgentType


Factory = Callable[[LLMClient, ToolkitProvider], BaseAgent]


class AgentsRegistry:
    """Registry for agent types with lazy instantiation.

    - Configuration is sourced from Django settings via `AGENTS_REGISTRY` as a
      mapping of agent type (enum value or string) to a dotted class path.
    - Agents are instantiated lazily on first access and cached thereafter.
    - New agent types can be registered at runtime via `register()`.
    """

    def __init__(self, llm: LLMClient, toolkits: ToolkitProvider):
        self._llm = llm
        self._toolkits = toolkits
        self._factories: Dict[AgentType, Factory] = {}
        self._instances: Dict[AgentType, BaseAgent] = {}
        self._load_from_settings()

    def _load_from_settings(self) -> None:
        mapping = getattr(settings, "AGENTS_REGISTRY", {}) or {}
        for key, dotted_path in mapping.items():
            agent_type = self._coerce_agent_type(key)
            self._factories[agent_type] = self._factory_from_dotted(dotted_path)

    def _factory_from_dotted(self, dotted: str) -> Factory:
        cls = import_string(dotted)

        def _factory(llm: LLMClient, toolkits: ToolkitProvider) -> BaseAgent:
            return cls(llm, toolkits)

        return _factory

    def _coerce_agent_type(self, value: Union[str, AgentType]) -> AgentType:
        if isinstance(value, AgentType):
            return value
        return AgentType(value)

    def register(self, agent_type: Union[str, AgentType], impl: Union[str, Factory, type]) -> None:
        """Register or override an agent type implementation.

        `impl` may be:
        - a dotted class path string
        - a class with signature `__init__(llm, toolkits)`
        - a factory callable `(llm, toolkits) -> BaseAgent`
        """
        atype = self._coerce_agent_type(agent_type)

        if isinstance(impl, str):
            factory = self._factory_from_dotted(impl)
        elif isinstance(impl, type):  # class
            def factory(llm: LLMClient, toolkits: ToolkitProvider) -> BaseAgent:
                return impl(llm, toolkits)
        else:  # assume callable factory
            factory = impl  # type: ignore[assignment]

        self._factories[atype] = factory  # type: ignore[arg-type]
        # Invalidate existing instance so next `get` uses the new impl
        self._instances.pop(atype, None)

    def get(self, agent_type: Union[str, AgentType]) -> BaseAgent:
        atype = self._coerce_agent_type(agent_type)
        if atype in self._instances:
            return self._instances[atype]

        factory = self._factories.get(atype)
        if not factory:
            raise KeyError(f"Agent type not registered: {atype}")

        instance = factory(self._llm, self._toolkits)
        self._instances[atype] = instance
        return instance
