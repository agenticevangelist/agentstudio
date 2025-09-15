"use client";

import { useEffect, useState } from "react";
import { listInbox, deleteInbox, type InboxItem } from "@/shared/lib/inbox";
import { Button } from "@/shared/ui/button";
import { Trash } from "lucide-react";
import { INBOX_PARAM } from "@/features/inbox/constants";
import { useQueryParams } from "@/shared/hooks/useQueryParams";
import { useUser } from "@/shared/hooks/useUser";

export function InboxList({ onSelect }: { onSelect: (it: InboxItem) => void }) {
  const { user } = useUser();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { getSearchParam } = useQueryParams();

  useEffect(() => {
    if (!user || !user?.id) return;
    // Always list all by default; no category tabs
    const status = undefined;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await listInbox({ user_id: user.id, status });
        if (!cancelled) setItems(resp || []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load inbox");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, getSearchParam(INBOX_PARAM)]);

  if (!user) return <div className="p-4 text-sm text-muted-foreground">Sign in to view Inbox.</div>;
  if (loading && !items) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  function formatWhen(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "2-digit" });
  }

  return (
    <div className="divide-y">
      {(items || []).map((it) => {
        const agentObj: any = (it as any).agent;
        const sender = (agentObj && (agentObj.name || agentObj.title)) || "Agent";
        const when = formatWhen(it.updated_at || it.created_at);
        const subject = it.title || "Action Required";
        const teaser = (it as any).body_json?.summary || it.description || "";
        const isUnread = it.status === "new";
        const statusBadge = it.status === "read" ? "Read" : it.status === "new" ? "New" : it.status === "archived" ? "Archived" : it.status;
        return (
          <div key={it.id} className="w-full p-3 hover:bg-muted/50">
            <div className="flex items-start gap-2">
              <button className="flex-1 text-left" onClick={() => onSelect(it)} aria-label={`Open inbox item ${subject}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{sender}</span>
                  {isUnread ? <span className="ml-1 h-2 w-2 rounded-full bg-blue-500" aria-label="unread" /> : null}
                  <span className="ml-auto text-xs text-muted-foreground">{when}</span>
                </div>
                <div className={`mt-0.5 text-sm font-semibold ${isUnread ? "text-foreground" : "text-foreground/90"}`}>{subject}</div>
                {teaser ? (
                  <div className={`mt-0.5 text-xs line-clamp-2 whitespace-pre-wrap ${isUnread ? "text-foreground/80" : "text-muted-foreground"}`}>{teaser}</div>
                ) : null}
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <span>{statusBadge}</span>
                  {/* Run status badges if present in body_json */}
                  {((it as any).body_json?.state || (it as any).body_json?.status) ? (
                    <span className={
                      ((it as any).body_json?.state || (it as any).body_json?.status) === "succeeded" ? "text-green-500" :
                      ((it as any).body_json?.state || (it as any).body_json?.status) === "failed" ? "text-red-500" :
                      "text-yellow-500"
                    }>
                      {((it as any).body_json?.state || (it as any).body_json?.status)}
                    </span>
                  ) : null}
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete inbox item"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await deleteInbox(it.id);
                    setItems((prev) => (prev || []).filter((x) => x.id !== it.id));
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
      {items && items.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">No pending items.</div>
      ) : null}
    </div>
  );
}
