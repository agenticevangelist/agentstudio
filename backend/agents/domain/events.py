from dataclasses import dataclass
from typing import Any


@dataclass
class AgentEvent:
    type: str
    payload: dict[str, Any]
