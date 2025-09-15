"use client";

import { useEffect, useMemo, useState } from "react";
import { type InboxItem } from "@/shared/lib/inbox";
import { chatApi } from "@/shared/lib/api";
import ThreadHeader from "@/features/inbox/components/ThreadHeader";
import ThreadMessages, { type ThreadMessage } from "@/features/inbox/components/ThreadMessages";
import ThreadComposer from "@/features/inbox/components/ThreadComposer";
import { useScrollToBottom } from "@/shared/hooks/use-scroll-to-bottom";
import { DotsLoader } from "@/features/chat/prompt-kit/loader";

function formatWhen(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "2-digit" });
}

export function InboxDetail({ item, onResolved }: { item: InboxItem | null; onResolved: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasFirstChunk, setHasFirstChunk] = useState(false);

  const { containerRef, endRef, isAtBottom, scrollToBottom } = useScrollToBottom();

  const threadId = useMemo(() => {
    const t = item?.thread as any;
    if (!t) return null;
    if (typeof t === "string") return t;
    return t.id || null;
  }, [item?.thread]);

  const agentName = useMemo(() => {
    const a = item?.agent as any;
    if (!a) return undefined;
    if (typeof a === "string") return undefined;
    return a.name as string | undefined;
  }, [item?.agent]);

  const threadTitle = useMemo(() => {
    const t = item?.thread as any;
    if (!t) return undefined;
    if (typeof t === "string") return undefined;
    return (t.title as string | undefined) || undefined;
  }, [item?.thread]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!threadId) return;
      setLoading(true);
      setError(null);
      try {
        const session = await chatApi.getSession(threadId);
        if (!cancelled) {
          setMessages((session.messages || []) as ThreadMessage[]);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load thread");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setMessages([]);
    if (threadId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages.length, scrollToBottom]);

  if (!item) return <div className="p-8 text-sm text-muted-foreground">Select an inbox item.</div>;

  async function send() {
    const content = text.trim();
    if (!content || !threadId) return;
    setText("");
    const optimisticUser: ThreadMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    const placeholderId = `assist-${Date.now()}`;
    setMessages((prev) => [...prev, { id: placeholderId, role: "assistant", content: "", createdAt: new Date().toISOString() }]);
    setIsStreaming(true);
    setHasFirstChunk(false);

    try {
      const resp = await chatApi.streamInteractive(content, threadId);
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream reader");
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        const chunk = decoder.decode(value);
        if (!chunk) continue;
        if (!hasFirstChunk) setHasFirstChunk(true);
        setMessages((prev) =>
          prev.map((m) => (m.id === placeholderId ? { ...m, content: (m.content || "") + chunk } : m))
        );
        // keep view stuck to bottom as chunks arrive
        scrollToBottom("smooth");
      }
      try {
        const session = await chatApi.getSession(threadId);
        setMessages((session.messages || []) as ThreadMessage[]);
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to send message");
    }
    finally {
      setIsStreaming(false);
    }
  }

  const headerWhen = formatWhen(item.updated_at || item.created_at);
  const subject = item.title || threadTitle || "(no subject)";
  const from = agentName || "Agent";

  return (
    <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] h-full">
        <ThreadHeader
          subject={subject}
          status={item.status}
          fromName={from}
          when={headerWhen}
          onClose={onResolved}
          onReply={() => { /* no-op for now, focus in composer */ }}
          onForward={() => { /* reserved for future */ }}
        />

        <div className="min-h-0 overflow-y-auto" ref={containerRef}>
          {!threadId ? (
            <div className="text-sm text-muted-foreground">No thread attached to this inbox item.</div>
          ) : loading && messages.length === 0 ? (
            <div className="text-sm">Loading thread…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : (
            <div className="flex flex-col min-h-full">
              <ThreadMessages messages={messages} authorName={from} formatWhen={formatWhen} />
              {isStreaming && !hasFirstChunk ? (
                <div className="px-3 py-2">
                  <div className="inline-flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
                    <DotsLoader size="sm" />
                    <span>Assistant is thinking…</span>
                  </div>
                </div>
              ) : null}
              <div ref={endRef} className="h-px w-full shrink-0" aria-hidden="true" />
            </div>
          )}
        </div>

        <ThreadComposer
          value={text}
          onChange={setText}
          onSend={send}
          disabled={!threadId || text.trim().length === 0}
          onClose={onResolved}
        />
    </div>
  );
}
