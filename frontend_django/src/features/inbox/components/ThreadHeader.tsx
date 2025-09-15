"use client";

import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

export function ThreadHeader({
  subject,
  status,
  fromName,
  when,
  onClose,
  onReply,
  onForward,
}: {
  subject: string;
  status: string;
  fromName: string;
  when: string;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
}) {
  const initial = (fromName || "").slice(0, 1).toUpperCase();
  return (
    <div className="px-4 py-2 border-b bg-card/50 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center gap-3">
        <Avatar className="size-7">
          <AvatarFallback className="text-[10px] font-medium">{initial}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold truncate">{subject}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground border px-1.5 py-0.5 rounded hidden sm:inline">{status}</span>
        <span className="text-xs text-muted-foreground truncate">{fromName}</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{when}</span>
          
        </div>
      </div>
    </div>
  );
}

export default ThreadHeader;


