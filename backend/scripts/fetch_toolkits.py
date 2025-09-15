#!/usr/bin/env python3
"""
Fetch and cache all Composio toolkits to a JSON file.

Usage:
  python backend/scripts/fetch_toolkits.py --out backend/toolkits_cache.json

Env:
  COMPOSIO_API_KEY must be set.
"""

import argparse
import json
import os
import sys
from typing import Any, Dict, List


def serialize_toolkit(obj: Any) -> Dict[str, Any]:
  # Attempt multiple common shapes (pydantic/dataclass/dict)
  try:
    if hasattr(obj, "model_dump"):
      return obj.model_dump()
    if hasattr(obj, "dict"):
      return obj.dict()
    if isinstance(obj, dict):
      return obj
    if hasattr(obj, "__dict__"):
      return dict(obj.__dict__)
  except Exception:
    pass
  # Fallback minimal
  return {
    "slug": getattr(obj, "slug", None) or getattr(obj, "id", None),
    "name": getattr(obj, "name", None) or getattr(obj, "slug", None),
  }


def fetch_toolkits() -> List[Dict[str, Any]]:
  try:
    from composio import Composio  # type: ignore
  except Exception as e:
    print(f"Error: composio SDK not installed: {e}", file=sys.stderr)
    sys.exit(1)

  api_key = os.getenv("COMPOSIO_API_KEY")
  if not api_key:
    print("Error: COMPOSIO_API_KEY must be set in the environment", file=sys.stderr)
    sys.exit(1)

  client = Composio()

  # Prefer a list() API if available
  try:
    if hasattr(client.toolkits, "list"):
      items = client.toolkits.list()  # type: ignore[attr-defined]
      return [serialize_toolkit(it) for it in items]
  except Exception:
    pass

  # Fallback: try get() style that returns an iterator or list
  try:
    if hasattr(client.toolkits, "get"):
      items = client.toolkits.get()  # type: ignore[attr-defined]
      # Some SDKs return list-like; others may return a dict with items
      if isinstance(items, list):
        return [serialize_toolkit(it) for it in items]
      if isinstance(items, dict) and "items" in items:
        return [serialize_toolkit(it) for it in items["items"]]
      # If it's a generator/iterable
      try:
        return [serialize_toolkit(it) for it in list(items)]  # type: ignore[arg-type]
      except Exception:
        pass
  except Exception:
    pass

  # Last resort: derive from tools.get()
  try:
    tools = client.tools.get(user_id="default")
    seen: Dict[str, Dict[str, Any]] = {}
    for t in tools:
      slug = getattr(t, "toolkit", None) or getattr(t, "toolkit_slug", None)
      if slug and slug not in seen:
        seen[str(slug)] = {"slug": str(slug), "name": str(slug)}
    return list(seen.values())
  except Exception:
    return []


def main() -> None:
  parser = argparse.ArgumentParser(description="Fetch and cache Composio toolkits")
  parser.add_argument("--out", "-o", default="backend/toolkits_cache.json", help="Output JSON file path")
  args = parser.parse_args()

  toolkits = fetch_toolkits()
  out_path = args.out
  os.makedirs(os.path.dirname(out_path), exist_ok=True)
  with open(out_path, "w", encoding="utf-8") as f:
    json.dump({"items": toolkits}, f, ensure_ascii=False, indent=2)
  print(f"Saved {len(toolkits)} toolkits to {out_path}")


if __name__ == "__main__":
  main()


