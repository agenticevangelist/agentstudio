"use client";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type Field = { name: string; type: string; displayName?: string; description?: string };

export function ApiKeyForm({
  fields,
  values,
  loading,
  onChange,
  onSubmit,
  onCancel,
}: {
  fields: Field[];
  values: Record<string, string>;
  loading: boolean;
  onChange: (v: Record<string, string>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="text-sm font-medium">Enter API credentials</div>
      {fields.length === 0 && (
        <div className="text-xs text-muted-foreground">No fields required by toolkit metadata.</div>
      )}
      {fields.map((f, idx) => (
        <div key={`${f.name}-${idx}`} className="space-y-1">
          <Label htmlFor={`api-${f.name}`}>{f.displayName || f.name}</Label>
          <Input
            id={`api-${f.name}`}
            value={values[f.name] || ""}
            onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
          />
          {f.description && <div className="text-[10px] text-muted-foreground">{f.description}</div>}
        </div>
      ))}
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save & Connect"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}


