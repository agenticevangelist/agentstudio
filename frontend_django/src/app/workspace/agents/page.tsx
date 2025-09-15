"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { useQuery } from "@tanstack/react-query";
import { listAgents } from "@/shared/lib/agents";
import { AgentsGrid } from "@/features/agents/components/AgentsGrid";

export default function AgentsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["agents"],
    queryFn: () => listAgents(),
    enabled: mounted,
    staleTime: 30_000,
  });

  return (
    <div className="space-y-4 pt-14 px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Your Agents</h2>
        <Button asChild><Link href="/workspace/agents/new">New Agent</Link></Button>
      </div>

      {!mounted ? null : (
        <>
          {isError && <p className="text-destructive">Failed to load agents.</p>}
          {(data as any[]).length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">No agents yet.</p>
          ) : (
            <AgentsGrid agents={(data as any[]) || []} isLoading={isLoading} showSkeleton={isLoading} />
          )}
        </>
      )}
    </div>
  );
}


