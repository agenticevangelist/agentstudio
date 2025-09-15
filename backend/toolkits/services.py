from typing import Any, Dict, List, Optional

from connections.services.composio_service import ComposioService


class ToolkitService:
    def __init__(self) -> None:
        self._svc = ComposioService()

    def list_toolkits(self) -> List[Dict[str, Any]]:
        return self._svc.list_toolkits() or []

    def get_toolkit_details_raw(self, slug: str) -> Dict[str, Any]:
        # Composio slugs are typically uppercase
        return self._svc.get_toolkit_details((slug or "").upper()) or {}

    def get_toolkit_details_for_wizard(self, slug: str) -> Dict[str, Any]:
        data = self.get_toolkit_details_raw(slug)
        return {
            "authConfigDetails": data.get("authConfigDetails", []),
            "name": data.get("name") or slug,
            "slug": data.get("slug") or slug,
        }

    def list_tools(self, user_id: str, toolkits: Optional[List[str]] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        tks = [(t or "").upper() for t in (toolkits or [])]
        return self._svc.list_tools(user_id=user_id, toolkits=tks or None, search=search) or []

    def list_tools_for_wizard(self, user_id: str, slug: str) -> List[Dict[str, Any]]:
        tools = self.list_tools(user_id=user_id, toolkits=[slug])
        return [
            {
                "name": t.get("name") or t.get("slug"),
                "description": t.get("description"),
                "function": {"name": t.get("slug")},
            }
            for t in tools
        ]
