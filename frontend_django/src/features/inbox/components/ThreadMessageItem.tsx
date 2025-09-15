"use client";

import { useState, useMemo } from "react";
import { Card } from "@/shared/ui/card";
import { MessageAvatar, MessageContent } from "@/features/chat/prompt-kit/message";
import { FunctionCallCard, splitAssistantContentAggregated } from "@/features/chat/components/FunctionCall";
import EventMessageCard from "./EventMessageCard";
import EventSeedDivider from "./EventSeedDivider";

export function ThreadMessageItem({
  id,
  role,
  content,
  authorName,
  when,
  defaultOpen = true,
}: {
  id: string;
  role: string;
  content: string;
  authorName: string;
  when: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  const isUser = role === "user";
  const bubbleFrom = isUser ? "You" : authorName;
  const initial = (bubbleFrom || "").slice(0, 1).toUpperCase();
  const preview = useMemo(() => {
    const firstLine = (content || "").split(/\n|\r/)[0]
    // If the first line is a tool event JSON, try to parse the name for a nicer preview
    try {
      const obj = JSON.parse(firstLine.trim());
      if (obj && typeof obj === "object" && typeof obj.event === "string" && obj.event.startsWith("on_tool_")) {
        return (obj.name || "tool").toString();
      }
    } catch {}
    return firstLine.slice(0, 140)
  }, [content]);

  const fallback = (
    <div className="bg-muted rounded-full h-full w-full flex items-center justify-center text-[10px] font-medium">
      {initial}
    </div>
  );

  // Detect seed event format
  const isSeed = (() => {
    const t = (content || "").trim();
    if (!t.startsWith("{")) return false;
    try {
      const obj = JSON.parse(t);
      return obj && obj.type === "ambient_seed";
    } catch {
      return false;
    }
  })();

  // If this is the ambient seed event, render a dedicated divider instead of a user message container
  if (isSeed) {
    return <EventSeedDivider content={content} />;
  }

  return (
    <Card key={id} className={`py-0 gap-0 shadow-none border-none ${isUser ? "bg-transparent" : "bg-card/40"}`}>
      <div
        className="px-4 py-2 flex items-center gap-3 border-b cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        role="button"
        aria-expanded={open}
      >
        <MessageAvatar src="" alt={bubbleFrom} fallback={fallback} className="h-7 w-7" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{bubbleFrom}</div>
          <div className="text-[11px] text-muted-foreground truncate">
            {open ? (isUser ? "from you" : "to you") : preview}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-[11px] text-muted-foreground">{when}</div>
        </div>
      </div>
      {open ? (
        <div className="px-3 py-2 border-b">
          {/* For non-seed event messages that are still the event card, keep compact card */}
          {content.startsWith("Ambient event received.") ? (
            <EventMessageCard content={content} />
          ) : role === "assistant" ? (
            <div className="flex flex-col gap-2">
              {splitAssistantContentAggregated(content).map((block, i) => {
                if (block.kind === "toolAgg") {
                  return <FunctionCallCard key={i} block={block} compact />
                }
                if (block.kind === "text" && block.text.trim()) {
                  return (
                    <MessageContent
                      key={i}
                      markdown
                      className="prose prose-sm rounded-md px-3 py-1.5 text-foreground"
                    >
                      {block.text}
                    </MessageContent>
                  );
                }
                return null;
              })}
            </div>
          ) : (
            <MessageContent markdown className="prose prose-sm rounded-md  px-3 py-1.5 text-foreground">
              {content}
            </MessageContent>
          )}
        </div>
      ) : null}
    </Card>
  );
}

export default ThreadMessageItem;


