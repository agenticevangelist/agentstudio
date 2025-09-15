"use client";

import { Suspense } from "react";
import { CreateAgentWizard } from "@/features/agents/components/new/CreateAgentWizard";

export default function NewAgentPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
      <CreateAgentWizard />
    </Suspense>
  );
}


