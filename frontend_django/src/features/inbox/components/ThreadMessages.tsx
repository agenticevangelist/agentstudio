"use client";

import { ThreadMessageItem } from "@/features/inbox/components/ThreadMessageItem";

export type ThreadMessage = { id: string; role: string; content: string; createdAt: string };

export function ThreadMessages({
  messages,
  authorName,
  formatWhen,
}: {
  messages: ThreadMessage[];
  authorName: string;
  formatWhen: (iso?: string) => string;
}) {
  if (!messages || messages.length === 0) {
    return <div className="text-sm text-muted-foreground">No messages yet.</div>;
  }
  return (
    <div className="flex flex-col min-h-full">
      {messages.map((m, idx) => (
        <ThreadMessageItem
          key={m.id}
          id={m.id}
          role={m.role}
          content={m.content}
          authorName={authorName}
          when={formatWhen(m.createdAt)}
          defaultOpen={idx === messages.length - 1}
        />
      ))}
    </div>
  );
}

export default ThreadMessages;


