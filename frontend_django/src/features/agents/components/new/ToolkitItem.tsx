"use client";

import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

type ToolSummary = { name: string; description?: string; function?: { name: string } };

export function ToolkitItem({
  slug,
  name,
  description,
  status,
  tools,
  onConnect,
  existingConnections,
  onSelectExistingConnection,
  children,
}: {
  slug: string;
  name: string;
  description?: string;
  status?: boolean | "loading";
  tools: ToolSummary[];
  onConnect: () => void;
  existingConnections?: Array<{ id: string; label: string }>;
  onSelectExistingConnection?: (id: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">{description || slug}</div>
        </div>
        <div className="flex items-center gap-2">
          {status === true && <span className="text-xs text-green-600">Connected</span>}
          {status === "loading" && <span className="text-xs">Connecting...</span>}
          {status === false && <span className="text-xs text-red-600">Failed</span>}
          {status !== true && (
            <Button size="sm" onClick={(e) => { e.stopPropagation(); onConnect(); }} disabled={status === "loading"}>Connect</Button>
          )}
        </div>
      </div>

      {existingConnections && existingConnections.length > 0 && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <Label className="text-xs">Use existing connection</Label>
          <div className="mt-1">
            <Select onValueChange={(v) => onSelectExistingConnection && onSelectExistingConnection(v)}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select a connection" />
              </SelectTrigger>
              <SelectContent>
                {existingConnections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {children}

      {tools.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-medium mb-2">Tools enabled ({tools.length})</div>
          <div className="flex flex-wrap gap-2">
            {tools.map((t, idx) => (
              <span key={t.function?.name ?? `${t.name}-${idx}`} className="text-[10px] rounded border px-2 py-1">
                {t.function?.name || t.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


