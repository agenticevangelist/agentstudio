"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { listAgents } from "@/shared/lib/agents";
import { chatApi } from "@/shared/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";

function ChatBreadcrumbsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [sessionTitle, setSessionTitle] = useState<string>("");

  // When on chat page, load agents and sync with session/URL
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listAgents();
        if (cancelled) return;
        const arr = (items || []).map(a => ({ id: a.id, name: a.name }));
        setAgents(arr);
        const urlAgent = (searchParams?.get("agent") || "").trim();
        const sessionId = (searchParams?.get("session") || "").trim();
        if (sessionId) {
          try {
            const s = await chatApi.getSession(sessionId);
            const sid = ((s as any).agentId as string | null) || null;
            if (sid) {
              setSelectedAgentId(sid);
            }
            const t = (s as any).title as string | undefined;
            if (t) {
              setSessionTitle(t);
            }
          } catch {}
        }
        if (urlAgent) {
          setSelectedAgentId(urlAgent);
          return;
        }
        if (arr.length > 0) setSelectedAgentId(arr[0].id);
      } catch {}
    })();
    return () => { cancelled = true };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parts = [
      { key: "chat", node: <span className="text-muted-foreground">Chat</span> },
      { key: "title", node: <span className="font-medium">{sessionTitle || "New chat"}</span> },
      { key: "agent", node: (
        <Select value={selectedAgentId} onValueChange={async (newId) => {
          setSelectedAgentId(newId);
          const sp = new URLSearchParams(searchParams?.toString());
          if (newId) sp.set("agent", newId); else sp.delete("agent");
          router.replace(`${pathname}?${sp.toString()}`);
          const sessionId = (searchParams?.get("session") || "").trim();
          if (sessionId && newId) {
            try { await chatApi.updateSessionAgent(sessionId, newId); } catch {}
          }
        }}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map(a => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )},
  ];
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {parts.map((p, i) => (
        <div key={p.key} className="flex items-center gap-1">
          {i !== 0 && <ChevronRight className="size-4 text-muted-foreground" />}
          {p.node}
        </div>
      ))}
    </nav>
  );
}

export function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/workspace/chat");
  const isAgents = pathname === "/workspace/agents" || pathname?.startsWith("/workspace/agents/");
  const isCreateAgent = pathname === "/workspace/agents/new";
  const [createReady, setCreateReady] = useState(false);

  // Keep the Create Agent button in sync with the wizard's readiness
  useEffect(() => {
    if (!isCreateAgent) return;
    let cancelled = false;
    function update() {
      try {
        const ready = !!(window as any).__createAgentWizardCtrl?.getReady?.();
        if (!cancelled) setCreateReady(ready);
      } catch {}
    }
    update();
    const id = setInterval(update, 300);
    window.addEventListener("visibilitychange", update);
    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("visibilitychange", update);
    };
  }, [isCreateAgent]);

  if (isAgents) {
    const parts = [
      { key: "agents", label: <span className="font-medium">Agents</span> },
    ];
    return (
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm w-full">
        <div className="flex items-center gap-1">
          {parts.map((p, i) => (
            <div key={p.key} className="flex items-center gap-1">
              {i !== 0 && <ChevronRight className="size-4 text-muted-foreground" />}
              {p.label}
            </div>
          ))}
        </div>
        {isCreateAgent && (
          <div className="ml-auto">
            <Button
              size="sm"
              onClick={() => {
                try { (window as any).__createAgentWizardCtrl?.trigger(); } catch {}
              }}
              disabled={!createReady}
            >
              Create agent
            </Button>
          </div>
        )}
      </nav>
    );
  }

  if (isChat) {
    return (
      <Suspense fallback={<nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">Loading...</nav>}>
        <ChatBreadcrumbsInner />
      </Suspense>
    );
  }

  return <div className="text-sm font-medium">Agent Studio</div>;
}
