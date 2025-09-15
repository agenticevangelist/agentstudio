"use client";

import { Card } from "@/shared/ui/card";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { chatApi } from "@/shared/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AgentListItemProps {
  agent: any;
}

function colorFromString(input: string): string {
  const palette = [
    "#22c55e", // emerald-500
    "#f97316", // orange-500
    "#10b981", // green-500
    "#06b6d4", // cyan-500
    "#8b5cf6", // violet-500
    "#eab308", // yellow-500
    "#ef4444", // red-500
  ];
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = input.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}

function getInitials(name?: string): string {
  if (!name) return "AI";
  const parts = String(name).trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "A";
  const b = parts[1]?.[0] ?? "I";
  return (a + b).toUpperCase();
}

function slugify(name?: string): string {
  if (!name) return "agent";
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export function AgentListItem({ agent }: AgentListItemProps) {
  const router = useRouter();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const name: string = agent?.name ?? "Untitled";
  const handle = agent?.slug ? String(agent.slug) : slugify(name);
  const description: string | undefined = agent?.purpose;
  const capabilities: string[] = Array.isArray(agent?.capabilities) ? agent.capabilities : [];
  const ownerName: string | undefined = agent?.owner?.name ?? agent?.owner_name;

  const bg = colorFromString(name);

  async function handleStartChat() {
    if (isStartingChat) return;
    try {
      setIsStartingChat(true);
      const created = await chatApi.createSession(name || "Chat", String(agent?.id));
      router.push(`/workspace/chat?session=${created.id}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setIsStartingChat(false);
    }
  }

  return (
    <Card className="border-border/60 hover:border-border transition-colors p-3 sm:p-4">
      <div className="flex gap-3">
        <Avatar className="size-12 sm:size-14 rounded-xl" style={{ backgroundColor: bg }}>
          <AvatarFallback className="text-black text-xs font-semibold rounded-xl">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium truncate">{name}</div>
            <div className="text-[11px] text-muted-foreground truncate">@ {handle}</div>
          </div>
          {description && (
            <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {ownerName && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="size-4">
                    <AvatarFallback className="text-[9px]">
                      {getInitials(ownerName)[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="truncate">{ownerName}</div>
                </div>
              )}
              <div className="flex items-center gap-1">
                <div className="inline-flex h-4 w-4 items-center justify-center rounded border">+</div>
                <div>{capabilities.length}</div>
              </div>
            </div>
            <Button size="sm" onClick={handleStartChat} disabled={isStartingChat}>
              {isStartingChat ? "Starting…" : "Chat"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}


