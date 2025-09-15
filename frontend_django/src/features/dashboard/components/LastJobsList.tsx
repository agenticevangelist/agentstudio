"use client";

import * as React from "react";

export function LastJobsList() {
  const items = [
    { id: "job_01", name: "Crawl sitemap", status: "success", time: "2m ago" },
    { id: "job_02", name: "Daily digest", status: "running", time: "just now" },
    { id: "job_03", name: "Sync CRM", status: "failed", time: "1h ago" },
  ];
  const badge = (s: string) => {
    const map: Record<string, string> = {
      success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
      running: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      failed: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    };
    return map[s] || "bg-muted text-muted-foreground";
  };
  return (
    <div className="space-y-1">
      {items.map((it) => (
        <div key={it.id} className="flex items-center justify-between rounded-md border p-2 text-xs">
          <div className="truncate pr-2">
            <div className="font-medium text-sm truncate">{it.name}</div>
            <div className="text-muted-foreground">{it.time}</div>
          </div>
          <span className={`px-2 py-0.5 rounded ${badge(it.status)}`}>{it.status}</span>
        </div>
      ))}
    </div>
  );
}
