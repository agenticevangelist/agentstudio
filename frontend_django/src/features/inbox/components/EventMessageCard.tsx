"use client";

import { useMemo, useState } from "react";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Copy, ChevronUp, ChevronDown, CircleDot } from "lucide-react";

type ParsedEvent = {
  correlationId?: string;
  payloadRaw?: string;
  payloadObj?: any;
  jobGoal?: string;
  instructions?: string;
};

function tryParseJSON(text: string | undefined) {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function parseAmbientSeed(content: string): ParsedEvent {
  const lines = (content || "").split(/\r?\n/);
  const out: ParsedEvent = {};
  let i = 0;
  // Expect first line to be the label
  // Find correlation id line
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith("correlationid:")) {
      out.correlationId = line.split(":").slice(1).join(":").trim();
      i++;
      break;
    }
  }
  // Find payload line
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith("payload:")) {
      const raw = line.split(":").slice(1).join(":").trim();
      out.payloadRaw = raw;
      out.payloadObj = tryParseJSON(raw);
      i++;
      break;
    }
  }
  // Find job goal line (optional)
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith("job goal:")) {
      out.jobGoal = line.split(":").slice(1).join(":").trim();
      i++;
      break;
    }
  }
  // Remaining non-empty lines considered instructions
  const rest = lines.slice(i).join("\n").trim();
  if (rest) out.instructions = rest;
  return out;
}

function PrettyJSON({ value }: { value: any }) {
  const text = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value ?? "");
    }
  }, [value]);
  return (
    <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-2 text-xs leading-snug">{text}</pre>
  );
}

export function EventMessageCard({ content, className }: { content: string; className?: string }) {
  const [open, setOpen] = useState(true);
  const parsed = useMemo(() => parseAmbientSeed(content), [content]);
  const payload = parsed.payloadObj ?? parsed.payloadRaw;
  const summary = useMemo(() => {
    const p: any = parsed.payloadObj || {};
    const action = p.action || p.event || p.type || "Event";
    const subject = p.subject || p.resource || p.target || p.name || p.title || p.repository_name || p.repo || p.id || "";
    const actor = p.actor || p.user || p.sender || p.by || "";
    const parts = [String(action).trim(), String(subject || "").trim(), actor ? `by ${actor}` : ""].filter(Boolean);
    return parts.join(" · ") || "Ambient event";
  }, [parsed.payloadObj]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(typeof payload === "string" ? payload : JSON.stringify(payload, null, 2));
    } catch {}
  };
  // Prepare compact key chips from primitive fields
  const chips = useMemo(() => {
    const p: any = parsed.payloadObj || {};
    const preferred = ["action","event","type","status","resource","target","subject","name","title","id"];
    const entries: {k: string, v: string}[] = [];
    const push = (k: string, v: any) => {
      if (v === undefined || v === null) return;
      if (typeof v === "object") return;
      const s = String(v);
      if (!s) return;
      entries.push({ k, v: s });
    };
    preferred.forEach((k) => push(k, p[k]));
    // fill up to 6 chips with other primitive fields
    if (entries.length < 6) {
      Object.keys(p).some((k) => { if (preferred.includes(k)) return false; push(k, p[k]); return entries.length >= 6; });
    }
    return entries.slice(0, 6);
  }, [parsed.payloadObj]);

  return (
    <Card className={cn("border bg-background", className)}>
      <div className="flex items-center gap-2 px-3 py-2">
        <CircleDot className="h-4 w-4 text-blue-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">{summary}</div>
          {parsed.correlationId ? (
            <div className="text-[11px] text-muted-foreground truncate">{parsed.correlationId}</div>
          ) : null}
        </div>
        {payload !== undefined ? (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCopy} title="Copy payload">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen((v) => !v)} aria-expanded={open} title={open ? "Hide details" : "Show details"}>
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          {/* Quick facts grid if recognizable */}
          {parsed.payloadObj ? (
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c, i) => (
                <div key={i} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] text-foreground">
                  <span className="text-muted-foreground">{c.k}:</span>
                  <span className="max-w-[12rem] truncate" title={c.v}>{c.v}</span>
                </div>
              ))}
              {/* show +N if many fields */}
              {(() => {
                const p = parsed.payloadObj as any;
                const total = p ? Object.keys(p).length : 0;
                const shown = chips.length;
                const more = Math.max(0, total - shown);
                return more > 0 ? (
                  <div className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">+{more} more</div>
                ) : null;
              })()}
            </div>
          ) : null}

          {payload !== undefined ? (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Payload</div>
              <div className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                {parsed.payloadObj ? <PrettyJSON value={parsed.payloadObj} /> : <pre className="whitespace-pre-wrap break-words">{String(parsed.payloadRaw)}</pre>}
              </div>
            </div>
          ) : null}
          {parsed.jobGoal ? (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Job goal</div>
              <div className="text-sm text-foreground">{parsed.jobGoal}</div>
            </div>
          ) : null}
          {parsed.instructions ? (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Instructions</div>
              <div className="text-sm whitespace-pre-wrap">{parsed.instructions}</div>
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

export default EventMessageCard;


