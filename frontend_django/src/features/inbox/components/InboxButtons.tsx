"use client";

import { INBOX_PARAM } from "@/features/inbox/constants";
import { useQueryParams } from "@/shared/hooks/useQueryParams";

export function InboxButtons() {
  const { getSearchParam, updateQueryParams } = useQueryParams();
  const selected = (getSearchParam(INBOX_PARAM) || "interrupted");
  const setSel = (v: string) => updateQueryParams([INBOX_PARAM], [v]);
  return (
    <div className="flex gap-2">
      <button
        className={`px-3 py-1 rounded-md text-sm border ${selected === "interrupted" ? "bg-primary text-primary-foreground" : "bg-background"}`}
        onClick={() => setSel("interrupted")}
      >Interrupted</button>
      <button
        className={`px-3 py-1 rounded-md text-sm border ${selected === "resolved" ? "bg-primary text-primary-foreground" : "bg-background"}`}
        onClick={() => setSel("resolved")}
      >Resolved</button>
      <button
        className={`px-3 py-1 rounded-md text-sm border ${selected === "all" ? "bg-primary text-primary-foreground" : "bg-background"}`}
        onClick={() => setSel("all")}
      >All</button>
    </div>
  );
}
