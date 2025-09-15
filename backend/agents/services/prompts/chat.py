from __future__ import annotations
from typing import Any



DEFAULT_CHAT_PROMPT = """
You are an expert AI agent that helps the user achieve their goals efficiently.

Operating Principles:
- Be concise, correct, and helpful. Prefer clarity over verbosity.
- Ask clarification question only when necessary. In most cases, figure our everything yourself.
- When unsure or missing context, state assumptions explicitly and proceed safely.

Tool Use:
- Jobs are background automations associated with an agent/thread.
- To create a Job:
  1) Discover available user toolkits with toolkits_connected(user_id).
  2) List triggers with list_triggers(toolkit_slug).
  3) Propose a JobDraft {title, description, trigger_config} and confirm with the user.
  3.1) You already have the user_id and agent_id from the system prompt.
  4) Call create_job(agent_id, user_id, toolkit_slug, trigger_slug, connected_account_id, title, description, trigger_config).
  - trigger_config should contain only the trigger-specific payload based on the list triggers result that you have got.

Knowledge:
- You may search and summarize the user's knowledge via knowledge tools.
- Cite the source (title or identifier) where helpful; avoid leaking internal IDs.

Style:
- Professional, friendly, and direct. Use active voice. Avoid filler words.

Safety and Compliance:
- Do not fabricate facts or tool results. If unknown, say so and propose next steps.
"""


def build_chat_system_prompt(agent: Any) -> str:
    """Return the chat system prompt for an agent with defaults and dynamic IDs.

    Precedence:
    1) If agent.system_prompt is provided, start with that.
    2) Otherwise, start with DEFAULT_CHAT_PROMPT.
    Always append USER_ID/AGENT_ID for downstream tool context.
    """
    base_custom = (getattr(agent, "system_prompt", "") or "").strip()
    base = base_custom if base_custom else DEFAULT_CHAT_PROMPT
    uid = str(getattr(agent, "user_id", ""))
    aid = str(getattr(agent, "id", ""))
    # Derive connected toolkit slugs from agent.toolkits first
    toolkit_slugs: list[str] = []
    try:
        for t in (getattr(agent, "toolkits", None) or []):
            s = str((t.get("slug") if isinstance(t, dict) else t) or "").strip()
            if s and s.upper() not in [x.upper() for x in toolkit_slugs]:
                toolkit_slugs.append(s)
    except Exception:
        toolkit_slugs = []
    # Best-effort: fetch connected accounts for these toolkits
    accounts_by_toolkit: dict[str, list[str]] = {}
    try:
        from connections.models import ConnectedIntegration  # local import to avoid circular
        qs = ConnectedIntegration.objects.filter(user_id=uid)
        for ci in qs:
            tk = str(getattr(ci, "toolkit_slug", "") or "").strip()
            ca = str(getattr(ci, "connected_account_id", "") or "").strip()
            if not tk or not ca:
                continue
            if tk.lower() not in [x.lower() for x in (toolkit_slugs or [])]:
                toolkit_slugs.append(tk)
            accounts_by_toolkit.setdefault(tk, [])
            if ca not in accounts_by_toolkit[tk]:
                accounts_by_toolkit[tk].append(ca)
    except Exception:
        accounts_by_toolkit = {}

    # Serialize dynamic context
    try:
        import json as _json
        toolkits_line = f"\nCONNECTED_TOOLKITS={','.join([s.upper() for s in toolkit_slugs])}" if toolkit_slugs else ""
        accounts_line = f"\nCONNECTED_ACCOUNTS={_json.dumps(accounts_by_toolkit)}" if accounts_by_toolkit else ""
    except Exception:
        toolkits_line = ""
        accounts_line = ""

    dyn = f"\nUSER_ID={uid}\nAGENT_ID={aid}{toolkits_line}{accounts_line}"
    return (base + dyn).strip()


