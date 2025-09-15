"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { PromptSuggestion } from "@/features/chat/prompt-kit/prompt-suggestion"
import { Card } from "@/shared/ui/card"
import { JobSuggestionCard } from "@/features/chat/components/JobSuggestionCard"
import { TaskSuggestionCard } from "@/features/chat/components/TaskSuggestionCard"
import { getAgent } from "@/shared/lib/agents"

type SuggestedIntegration = { toolkit_slug: string; tool_slugs: string[]; icon_url?: string }
type SuggestedItem = { prompt: string; integrations: SuggestedIntegration[] }

export function Greeting({ onSelect, prompt, visible = true, agentId }: { onSelect?: (text: string) => void; prompt?: string; visible?: boolean; agentId?: string }) {
  const [mounted, setMounted] = useState(false)
  const [taskSuggestions, setTaskSuggestions] = useState<SuggestedItem[]>([])
  const [jobSuggestions, setJobSuggestions] = useState<SuggestedItem[]>([])
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  // Load suggestions from the selected agent (persisted by backend on finalize)
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!agentId) return
      try {
        const a = await getAgent(agentId)
        if (cancelled || !a) return
        const normalizeIntegrations = (val: any): any[] => {
          if (!val) return []
          if (Array.isArray(val)) return val
          if (typeof val === "object") return [val]
          return []
        }
        const mapItem = (x: any): SuggestedItem => {
          const ints = normalizeIntegrations(x?.integrations)
          return {
            prompt: String(x?.prompt || "").trim(),
            integrations: ints.map((i: any) => ({
              toolkit_slug: String(i?.toolkit_slug || i?.toolkit || "").toLowerCase(),
              tool_slugs: Array.isArray(i?.tool_slugs) ? i.tool_slugs : [],
              icon_url: i?.icon_url,
            })),
          }
        }
        const tasks = Array.isArray((a as any).suggested_task_prompts) ? (a as any).suggested_task_prompts.map(mapItem) : []
        const jobs = Array.isArray((a as any).suggested_job_prompts) ? (a as any).suggested_job_prompts.map(mapItem) : []
        setTaskSuggestions(tasks)
        setJobSuggestions(jobs)
      } catch (e) {
        // swallow
      }
    }
    load()
    return () => { cancelled = true }
  }, [agentId])

  // Prefer higher-res SVGs for well-known toolkits where possible
  const ICON_OVERRIDES: Record<string, string> = {
    gmail: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/gmail.svg",
    google_gmail: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/gmail.svg",
  }
  const resolveIcon = (toolkitSlug?: string, fallback?: string) => {
    if (!toolkitSlug) return fallback
    const key = toolkitSlug.toLowerCase()
    return ICON_OVERRIDES[key] || fallback
  }

  const SuggestionRow = ({ items }: { items: SuggestedItem[] }) => {
    if (!items || items.length === 0) return null
    return (
      <div className="mt-3 grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2">
        {items.map((s, idx) => (
          <div
            key={idx}
            className={
              "transition-all duration-500 " +
              (mounted && visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")
            }
            style={{ transitionDelay: `${220 + idx * 50}ms` }}
          >
            <TaskSuggestionCard item={s} onClick={() => onSelect?.(s.prompt)} />
          </div>
        ))}
      </div>
    )
  }

  // Jobs: horizontal, bigger cards, now using a dedicated component
  const JobRow = ({ items }: { items: SuggestedItem[] }) => {
    if (!items || items.length === 0) return null
    return (
      <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none]">
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>
        {items.map((s, idx) => (
          <div
            key={idx}
            className={
              "snap-start first:ml-0 last:mr-0 transition-all duration-500 " +
              (mounted && visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")
            }
            style={{ transitionDelay: `${260 + idx * 70}ms` }}
          >
            <JobSuggestionCard item={s} onClick={() => onSelect?.(s.prompt)} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto md:mt-20 px-8 w-full flex flex-col justify-center select-none">
      <div
        className={
          "text-2xl font-semibold transition-all duration-500 " +
          (mounted && visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")
        }
        style={{ transitionDelay: "200ms" }}
      >
        Hello there!
      </div>
      <div
        className={
          "text-2xl text-muted-foreground transition-all duration-500 " +
          (mounted && visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")
        }
        style={{ transitionDelay: "320ms" }}
      >
        How can I help you today?
      </div>

      {/* Suggested tasks */}
      {taskSuggestions?.length > 0 && (
        <div className={"mt-6 transition-all duration-500 " + (mounted && visible ? "opacity-100" : "opacity-0")}>
          <div className="text-xs font-medium text-muted-foreground mb-2">Proposed tasks</div>
          <SuggestionRow items={taskSuggestions.slice(0, 4)} />
        </div>
      )}

      {/* Suggested jobs */}
      {jobSuggestions?.length > 0 && (
        <div className={"mt-6 transition-all duration-500 " + (mounted && visible ? "opacity-100" : "opacity-0")}>
          <div className="mb-2 flex items-center gap-2">
            <div className="text-xs font-semibold text-foreground">Proposed jobs</div>
            <div className="h-px flex-1 bg-border" />
          </div>
          <JobRow items={jobSuggestions.slice(0, 8)} />
        </div>
      )}
    </div>
  )
}
