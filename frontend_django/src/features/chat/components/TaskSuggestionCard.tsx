"use client"

import Image from "next/image"
import React from "react"

export type SuggestedIntegration = { toolkit_slug: string; tool_slugs: string[]; icon_url?: string }
export type SuggestedItem = { prompt: string; integrations: SuggestedIntegration[] }

// You can optionally centralize SVG overrides here later
const ICON_OVERRIDES: Record<string, string> = {}
const resolveIcon = (toolkitSlug?: string, fallback?: string) => {
  if (!toolkitSlug) return fallback
  const key = toolkitSlug.toLowerCase()
  return ICON_OVERRIDES[key] || fallback
}

export function TaskSuggestionCard({ item, onClick }: { item: SuggestedItem; onClick?: () => void }) {
  // Deduplicate by toolkit slug; keep insertion order
  const iconMap = new Map(
    (item.integrations || []).map((i) => [i.toolkit_slug, resolveIcon(i.toolkit_slug, i.icon_url)])
  )
  const icons = Array.from(iconMap.entries())
  const visible = icons.slice(0, 3)
  const overflow = Math.max(0, icons.length - visible.length)
  const tooltip = icons.map(([slug]) => slug).filter(Boolean).join(", ")

  return (
    <div className="group h-full overflow-hidden rounded-md border border-muted/60 transition-colors hover:border-primary/30">
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full items-center gap-3 p-3 text-left hover:bg-accent/50"
      >
        <div className="flex -space-x-1" title={tooltip}>
          {visible.map(([slug, icon]) => (
            <Image
              key={slug as string}
              src={icon as string}
              alt={slug as string}
              width={18}
              height={18}
              sizes="18px"
              unoptimized
              className="h-[18px] w-[18px] rounded object-contain border border-border bg-background"
              style={{ imageRendering: "auto" }}
            />
          ))}
          {overflow > 0 && (
            <div
              className="ml-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border bg-muted text-[10px] text-foreground/80"
              aria-label={`and ${overflow} more`}
            >
              +{overflow}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[13px] leading-snug text-foreground">{item.prompt}</div>
        </div>
      </button>
    </div>
  )
}
