"use client";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

export function Step1Form({
  name,
  purpose,
  loading,
  onNameChange,
  onPurposeChange,
  onSubmit,
}: {
  name: string;
  purpose: string;
  loading: boolean;
  onNameChange: (v: string) => void;
  onPurposeChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4 max-w-xl"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <p id="name-help" className="text-xs text-muted-foreground">A short, memorable name for your agent.</p>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          aria-describedby="name-help"
          placeholder="e.g., GitHub Triage Agent"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose</Label>
        <p id="purpose-help" className="text-xs text-muted-foreground">What this agent should do. This helps suggest toolkits and defaults.</p>
        <Textarea
          id="purpose"
          value={purpose}
          onChange={(e) => onPurposeChange(e.target.value)}
          required
          aria-describedby="purpose-help"
          placeholder="e.g., Triage GitHub issues, label them, and summarize daily activity"
          rows={5}
        />
      </div>
      {/* No visible submit button; users can press Enter to submit. */}
    </form>
  );
}


