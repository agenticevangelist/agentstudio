from __future__ import annotations
from typing import Any, Optional
from django.db.models import QuerySet

from ..models import Agent


class AgentsRepo:
    def list_for_user(self, user_id: str) -> QuerySet[Agent]:
        return Agent.objects.filter(user_id=user_id).order_by("-created_at")

    def get_for_user(self, user_id: str, agent_id: str) -> Optional[Agent]:
        try:
            return Agent.objects.get(id=agent_id, user_id=user_id)
        except Agent.DoesNotExist:
            return None

    def create(self, user_id: str, data: dict[str, Any]) -> Agent:
        return Agent.objects.create(user_id=user_id, **data)

    def update(self, agent: Agent, patch: dict[str, Any]) -> Agent:
        for k, v in patch.items():
            setattr(agent, k, v)
        agent.save()
        return agent

    def delete(self, agent: Agent) -> None:
        agent.delete()
