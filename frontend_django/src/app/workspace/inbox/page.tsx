"use client";

import React, { Suspense } from "react";
import { InboxDoubleSidebar } from "@/features/inbox/components/InboxDoubleSidebar";

export default function InboxPage() {
  return (
    <div className="h-screen overflow-hidden">
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
        <InboxDoubleSidebar />
      </Suspense>
    </div>
  );
}
