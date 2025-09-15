"use client"

import React from "react"
import { cn } from "@/shared/lib/utils"
import { CircularLoader } from "@/features/chat/prompt-kit/loader"
import { ChevronRight } from "lucide-react"

export type ToolEvent = {
  event: string
  name?: string
  run_id?: string
  tags?: string[]
  metadata?: Record<string, any>
  data?: { input?: any; output?: any; error?: any }
}

export type ContentBlock =
  | { kind: "text"; text: string }
  | { kind: "tool"; ev: ToolEvent }
  | {
      kind: "toolAgg"
      name: string
      run_id: string
      start?: ToolEvent
      end?: ToolEvent
      error?: ToolEvent
      input?: any
      output?: any
    }

export function splitAssistantContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const textBuf: string[] = []
  const pushText = () => {
    if (textBuf.length) {
      blocks.push({ kind: "text", text: textBuf.join("\n") })
      textBuf.length = 0
    }
  }
  const lines = (content || "").split(/\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      textBuf.push(line)
      continue
    }
    try {
      const obj = JSON.parse(trimmed)
      if (obj && typeof obj === "object" && typeof obj.event === "string" && obj.event.startsWith("on_tool_")) {
        pushText()
        blocks.push({ kind: "tool", ev: obj as ToolEvent })
        continue
      }
    } catch (_) {
      // not a JSON line; treat as text
    }
    textBuf.push(line)
  }
  pushText()
  return blocks
}

// Aggregated version: merge on_tool_start/on_tool_end/on_tool_error by run_id into a single block
export function splitAssistantContentAggregated(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const textBuf: string[] = []
  const pushText = () => {
    if (textBuf.length) {
      blocks.push({ kind: "text", text: textBuf.join("\n") })
      textBuf.length = 0
    }
  }
  const seen: Record<string, number> = {}
  const lines = (content || "").split(/\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      textBuf.push(line)
      continue
    }
    let parsed: any = null
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      parsed = null
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.event === "string" &&
      parsed.event.startsWith("on_tool_") &&
      parsed.run_id
    ) {
      pushText()
      const key: string = parsed.run_id
      let idx = seen[key]
      if (idx === undefined) {
        idx = blocks.length
        seen[key] = idx
        blocks.push({
          kind: "toolAgg",
          name: parsed.name || "tool",
          run_id: parsed.run_id,
          start: undefined,
          end: undefined,
          error: undefined,
          input: undefined,
          output: undefined,
        })
      }
      const blk = blocks[idx] as Extract<ContentBlock, { kind: "toolAgg" }>
      const phase: string = (parsed.event as string).replace("on_tool_", "")
      if (phase === "start") {
        blk.start = parsed
        blk.input = parsed.data?.input
      } else if (phase === "end") {
        blk.end = parsed
        blk.output = parsed.data?.output
        if (blk.input === undefined) blk.input = parsed.data?.input
      } else if (phase === "error") {
        blk.error = parsed
      }
      continue
    }
    textBuf.push(line)
  }
  pushText()
  return blocks
}

function Icon({ ev }: { ev: ToolEvent }) {
  const e = ev.event
  if (e.endsWith("start")) return <span className="text-blue-600">▶</span>
  if (e.endsWith("end")) return <span className="text-green-600">✓</span>
  if (e.endsWith("error")) return <span className="text-red-600">✗</span>
  return <span>•</span>
}

function PrettyJSON({ value, minimal = false }: { value: any; minimal?: boolean }) {
  try {
    const s = JSON.stringify(value, null, 2)
    return (
      <pre
        className={cn(
          "whitespace-pre-wrap break-words text-xs leading-snug",
          minimal ? undefined : "rounded-md bg-muted p-2"
        )}
      >
        {s}
      </pre>
    )
  } catch {
    return null
  }
}

export function FunctionCallEventItem({ ev, className }: { ev: ToolEvent; className?: string }) {
  const phase = ev.event.replace("on_tool_", "")
  const name = ev.name || "tool"
  const hasDetails = ev.data && (ev.data.input != null || ev.data.output != null || ev.data.error != null)

  return (
    <div className={cn("rounded-md border bg-background p-2 text-sm", className)}>
      <div className="flex items-center gap-2">
        <Icon ev={ev} />
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground text-xs">{phase}</div>
      </div>
      {hasDetails && (
        <details className="mt-1">
          <summary className="cursor-pointer select-none text-xs text-muted-foreground">details</summary>
          <div className="mt-2 space-y-2">
            {ev.data?.input !== undefined && (
              <div>
                <div className="text-xs font-medium">input</div>
                <PrettyJSON value={ev.data?.input} />
              </div>
            )}
            {ev.data?.output !== undefined && (
              <div>
                <div className="text-xs font-medium">output</div>
                <PrettyJSON value={ev.data?.output} />
              </div>
            )}
            {ev.data?.error !== undefined && (
              <div>
                <div className="text-xs font-medium">error</div>
                <PrettyJSON value={ev.data?.error} />
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

export function FunctionCallEventList({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-2">
      {blocks
        .filter((b) => b.kind === "tool")
        .map((b, idx) => (
          <FunctionCallEventItem key={idx} ev={(b as any).ev} />
        ))}
    </div>
  )
}

export function FunctionCallCard({ block, compact = false }: { block: Extract<ContentBlock, { kind: "toolAgg" }>; compact?: boolean }) {
  const isRunning = !!block.start && !block.end && !block.error
  const isError = !!block.error
  const isDone = !!block.end && !isError
  const input = block.input
  const output = block.output
  const [open, setOpen] = React.useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center text-left hover:bg-accent/40 rounded-md",
          compact ? "gap-1 px-1 py-1" : "gap-2 px-2 py-2"
        )}
        aria-expanded={open}
      >
        <span className={cn(compact ? "h-2 w-2" : "h-3 w-3", "rounded-full", isError ? "bg-red-600" : isRunning ? "bg-blue-500" : "bg-green-600")} />
        <div className={cn("min-w-0 flex-1 truncate font-medium", compact ? "text-sm" : undefined)}>{block.name}</div>
        <ChevronRight className={cn(compact ? "h-3 w-3" : "h-4 w-4", "text-muted-foreground transition-transform", open ? "-rotate-90" : "rotate-90")} />
      </button>
      {open && (
        <div className="pl-2">
          
          <div className={cn("ml-1 border-l-2 border-dashed border-muted-foreground/30", compact ? "pl-3 space-y-2" : "pl-4 space-y-3")}>
            <div>
              <div className={cn("font-medium mb-1", compact ? "text-[10px]" : "text-xs")}>Input</div>
              <div className="max-h-48 overflow-auto text-foreground/60">
                <PrettyJSON value={input} minimal />
              </div>
            </div>
            <div>
              <div className={cn("font-medium mb-1", compact ? "text-[10px]" : "text-xs")}>Output</div>
              <div className="max-h-48 overflow-auto text-foreground/60">
                <PrettyJSON value={output} minimal />
              </div>
            </div>
            {isError && (
              <div>
                <div className={cn("font-medium mb-1 text-red-600", compact ? "text-[10px]" : "text-xs")}>error</div>
                <div className="max-h-48 overflow-auto text-foreground/60">
                  <PrettyJSON value={block.error?.data?.error ?? block.error} minimal />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



