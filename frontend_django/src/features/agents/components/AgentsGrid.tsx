"use client";

import { AgentListItem } from "./AgentListItem";
import { Card } from "@/shared/ui/card";

interface AgentsGridProps {
  agents: any[];
  isLoading?: boolean;
  showSkeleton?: boolean;
}

export function AgentsGrid({ agents, isLoading, showSkeleton }: AgentsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {!showSkeleton && agents.map((agent) => (
        <AgentListItem key={agent.id} agent={agent} />
      ))}

      {(showSkeleton || isLoading) &&
        Array.from({ length: 6 }).map((_, i) => (
          <Card key={`s-${i}`} className="border-border/60">
            <div className="p-3 sm:p-4 flex gap-3">
              <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted animate-pulse" />
              <div className="min-w-0 flex-1 flex flex-col gap-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </Card>
        ))}
    </div>
  );
}


