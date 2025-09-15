import os
import sys


def main():
    try:
        from composio import Composio
        from composio_langchain import LangchainProvider
    except Exception as e:
        print("[ERR] composio/composio_langchain not available:", e, flush=True)
        sys.exit(1)

    toolkit = (sys.argv[1] if len(sys.argv) > 1 else os.getenv("TOOLKIT", "GITHUB")).upper()
    user_id = os.getenv("COMPOSIO_USER_ID", "default")

    print(f"[DEBUG] starting fetch user_id={user_id} toolkit={toolkit}", flush=True)
    c = Composio()

    try:
        tools = c.tools.get(user_id=user_id, toolkits=[toolkit])
        print("[DEBUG] fetched", len(tools), "tools", flush=True)
    except Exception as e:
        print("[ERR] failed to fetch tools:", e, flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()


