"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { X, FileText, FileArchive, FileType, Image, FileSpreadsheet, File } from "lucide-react";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const num = bytes / Math.pow(1024, idx);
  return `${num < 10 ? num.toFixed(1) : Math.round(num)} ${units[idx]}`;
}

function getIconForFile(file: File) {
  const type = file.type;
  const name = file.name.toLowerCase();
  if (type.startsWith("image/")) return Image;
  if (type === "application/pdf" || name.endsWith(".pdf")) return FileText;
  if (name.endsWith(".csv")) return FileSpreadsheet;
  if (name.endsWith(".md") || name.endsWith(".txt")) return FileText;
  if (name.endsWith(".zip")) return FileArchive;
  if (name.endsWith(".doc") || name.endsWith(".docx")) return FileType;
  return File;
}

export function getAutoKnowledgeTitle(files: File[]): string | undefined {
  if (!files || files.length === 0) return undefined;
  if (files.length === 1) {
    const f = files[0].name.replace(/\.[^.]+$/, "");
    return f;
  }
  const first = files[0].name.replace(/\.[^.]+$/, "");
  return `${first} +${files.length - 1} more`;
}

export default function KnowledgeUpload({
  files,
  setFiles,
  disabled,
}: {
  files: File[];
  setFiles: (next: File[]) => void;
  disabled?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const totalSize = useMemo(() => files.reduce((a, f) => a + (f.size || 0), 0), [files]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) setFiles([...(files || []), ...dropped]);
  }, [files, setFiles, disabled]);

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const picked = Array.from(e.target.files || []);
    if (picked.length) setFiles([...(files || []), ...picked]);
    e.currentTarget.value = "";
  }, [files, setFiles, disabled]);

  const removeAt = useCallback((idx: number) => {
    const next = [...files];
    next.splice(idx, 1);
    setFiles(next);
  }, [files, setFiles]);

  return (
    <div className="space-y-2">
      <Label>Knowledge (optional)</Label>
      <div
        className={cn(
          "rounded-md border border-dashed p-4 transition-colors",
          isDragging ? "bg-muted/50" : "bg-background",
          disabled ? "opacity-60" : "cursor-pointer"
        )}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={onDrop}
        onClick={() => { if (!disabled) inputRef.current?.click(); }}
        role="button"
        aria-label="Upload knowledge files"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-md bg-muted p-2" aria-hidden="true">
            <File className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Drag and drop files here</div>
            <div className="text-xs text-muted-foreground">or click to browse. Supported: .pdf, .docx, .txt, .md, .csv, .zip</div>
          </div>
          <Button variant="outline" size="sm" type="button" disabled={disabled} onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>Browse</Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.csv,.zip"
          className="hidden"
          onChange={onPick}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{files.length} file{files.length > 1 ? "s" : ""} selected</span>
            <span>Total {formatBytes(totalSize)}</span>
          </div>
          <ul className="divide-y rounded-md border">
            {files.map((file, idx) => {
              const Icon = getIconForFile(file);
              const isImage = file.type.startsWith("image/");
              const objectUrl = isImage ? URL.createObjectURL(file) : undefined;
              return (
                <li key={`${file.name}-${idx}`} className="p-3 flex items-start gap-3">
                  <div className="mt-0.5">
                    {isImage ? (
                      <img src={objectUrl} alt={file.name} className="h-10 w-10 rounded object-cover border" onLoad={() => { if (objectUrl) URL.revokeObjectURL(objectUrl); }} />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted inline-flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" title={file.name}>{file.name}</div>
                    <div className="text-xs text-muted-foreground">{file.type || "Unknown"} • {formatBytes(file.size)}</div>
                  </div>
                  <Button variant="ghost" size="icon" type="button" aria-label={`Remove ${file.name}`} onClick={() => removeAt(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}


