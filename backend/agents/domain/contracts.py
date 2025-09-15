from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Protocol, Iterable, Optional


@dataclass
class AgentContext:
    user_id: str
    agent_id: Optional[str] = None
    config: dict[str, Any] | None = None
    state: dict[str, Any] | None = None


@dataclass
class AgentResult:
    ok: bool
    data: dict[str, Any] | None = None
    error: str | None = None


class BaseAgent(Protocol):
    """Minimal agent interface.
    Implementations: creator agent, chat agent, etc.
    """

    def setup(self, ctx: AgentContext) -> None: ...

    def handle(self, ctx: AgentContext, payload: dict[str, Any]) -> AgentResult: ...


class Planner(Protocol):
    def plan(self, goal: str, ctx: AgentContext) -> Iterable[dict[str, Any]]: ...


class LLMClient(Protocol):
    def generate(self, prompt: str, **kwargs: Any) -> str: ...

    def stream(self, prompt: str, **kwargs: Any) -> Iterable[str]: ...


class ToolkitProvider(Protocol):
    def get_details(self, slug: str) -> dict[str, Any]: ...

    def list_tools(self, slug: str) -> list[dict[str, Any]]: ...

    def initiate_oauth(self, slug: str, user_id: str, callback_url: str) -> dict[str, Any]: ...

    def connection_status(self, connection_request_id: str) -> dict[str, Any]: ...

    def create_connected_account(self, slug: str, user_id: str, credentials: dict[str, str], auth_scheme: str) -> dict[str, Any]: ...
