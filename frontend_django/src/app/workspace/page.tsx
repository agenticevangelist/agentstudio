"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAgents } from "@/shared/lib/agents";


export default function AppHome() {
  const { data: agents } = useQuery({ queryKey: ["agents"], queryFn: () => listAgents() });
  const [agentId, setAgentId] = useState<string | undefined>(undefined);

  const agentOptions = useMemo(
    () => (agents || []).map((a) => ({ id: a.id, name: a.name })),
    [agents]
  );

  useEffect(() => {
    if (!agentId && agentOptions.length > 0) {
      setAgentId(agentOptions[0].id);
    }
  }, [agentOptions, agentId]);

  return (
    <div className="relative h-full w-full min-h-0">
      <div className="absolute left-3 top-3 z-10 w-full bg-background/90 backdrop-blur-[1px]  max-w-xs">

      </div>
      <div className="absolute inset-0">

      </div>
    </div>
  );
}


