"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/shared/ui/sidebar";
import { Plus } from "lucide-react";
import { chatApi } from "@/shared/lib/api";

type SessionItem = { id: string; title: string; createdAt: string };

function NavChatHistoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams?.get("session") || null;

  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await chatApi.listSessions();
        if (!cancelled) setItems(res.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true };
  }, []);

  const onNewChat = async () => {
    try {
      const created = await chatApi.createSession("New chat");
      const sp = new URLSearchParams(searchParams?.toString());
      sp.set("session", created.id);
      router.push(`/workspace/chat?${sp.toString()}`);
      // Optimistically add to list
      setItems(prev => [{ id: created.id, title: created.title, createdAt: created.createdAt }, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Chat History</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={onNewChat} title="Start a new chat">
            <Plus />
            <span>New Chat</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {loading && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <span>Loading…</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        {items.map((it) => (
          <SidebarMenuItem key={it.id}>
            <SidebarMenuButton
              isActive={activeId === it.id}
              onClick={() => {
                const sp = new URLSearchParams(searchParams?.toString());
                sp.set("session", it.id);
                router.push(`/workspace/chat?${sp.toString()}`);
              }}
              title={it.title || "Untitled"}
            >
              <span className="truncate">{it.title || "Untitled"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {!loading && items.length === 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <span className="text-muted-foreground">No chats yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function NavChatHistory() {
  return (
    <Suspense fallback={null}>
      <NavChatHistoryInner />
    </Suspense>
  );
}
