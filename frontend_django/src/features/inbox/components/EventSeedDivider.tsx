"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

function tryParseJSON(text: string | undefined) {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function parseAmbientSeed(content: string) {
  const obj = tryParseJSON(content || "");
  const out: { correlationId?: string; payloadObj?: any; jobId?: string; jobGoal?: string } = {};
  if (obj && typeof obj === "object" && (obj as any).type === "ambient_seed") {
    out.correlationId = (obj as any).correlationId;
    out.payloadObj = (obj as any).payload;
    out.jobGoal = (obj as any).jobGoal;
  }
  if (out.correlationId && out.correlationId.startsWith("job-")) {
    const parts = out.correlationId.split("-");
    if (parts.length >= 6) {
      out.jobId = [parts[1], parts[2], parts[3], parts[4], parts[5]].join("-");
    } else if (parts.length >= 2) {
      out.jobId = parts[1];
    }
  }
  return out;
}

export default function EventSeedDivider({ content, className }: { content: string; className?: string }) {
  const [open, setOpen] = useState(true);
  const { correlationId, payloadObj, jobId, jobGoal } = useMemo(() => parseAmbientSeed(content), [content]);
  return (
    <div className={cn("my-3 flex flex-col items-center gap-2", className)}>
      <div className="relative w-full">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-dashed" />
        </div>
        <div className="relative flex justify-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:text-foreground border shadow-sm"
            aria-expanded={open}
            title={open ? "Hide event details" : "Show event details"}
          >
            <span className="mr-1">Ambient event</span>
            {open ? <ChevronUp className="inline h-3 w-3" /> : <ChevronDown className="inline h-3 w-3" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="w-full max-w-2xl rounded-md border bg-background p-3">
          <div className="space-y-1 mb-2">
            {jobId ? (
              <div className="text-[11px] text-muted-foreground">
                <span className="mr-1">Job:</span>
                <span className="font-mono text-foreground" title={jobId}>{jobId}</span>
              </div>
            ) : null}
            <div className="text-[11px] text-muted-foreground">
              <span className="mr-1">Correlation:</span>
              <span className="font-mono text-foreground break-all" title={correlationId || "unknown"}>{correlationId || "unknown"}</span>
            </div>
            {jobGoal ? (
              <div className="text-[11px] text-muted-foreground">
                <span className="mr-1">Goal:</span>
                <span className="text-foreground" title={jobGoal}>{jobGoal}</span>
              </div>
            ) : null}
          </div>
          <div className="text-[11px] text-muted-foreground mb-1">Payload</div>
          <div className="max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(payloadObj ?? {}, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
