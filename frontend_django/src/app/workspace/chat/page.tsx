"use client"

import { useEffect, useMemo, useRef, useState, useId } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { chatApi, getBaseApiUrl, getCookie } from "@/shared/lib/api"
import { listAgents } from "@/shared/lib/agents"
import { useScrollToBottom } from "@/shared/hooks/use-scroll-to-bottom"
import {
  Message as MessageComponent,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageAvatar,
} from "@/features/chat/prompt-kit/message"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/features/chat/prompt-kit/prompt-input"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import { Component, ComponentDone } from "@/shared/ui/ai-loader"
import { Greeting } from "@/features/chat/components/Greeting"
import { Copy, MoreHorizontal, Pencil, Plus, Trash, Play, ChevronDown } from "lucide-react"
import { WaveLoader, CircularLoader } from "@/features/chat/prompt-kit/loader"
import { FunctionCallCard, splitAssistantContentAggregated } from "@/features/chat/components/FunctionCall"
// Loader used inside the assistant avatar while generating
function AvatarLoader() {
  return (
    <div className="flex items-center justify-center">
      <Component />
    </div>
  )
}

// Interactive wrapper for assistant avatar using Framer Motion + goo filter
function InteractiveAssistantAvatar({ isLoading, text }: { isLoading: boolean; text?: string }) {
  // step 1: idle (only avatar). step 2: particle emerges (play button)
  const [step, setStep] = useState<1 | 2>(1)
  const filterId = useId()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFetchingTTS, setIsFetchingTTS] = useState(false)

  // Variants for the separate element (emerging play button)
  const iconVariants = {
    // Start near the top edge of the avatar center
    hidden: { x: 0, y: -12, opacity: 0, scale: 0.6, filter: "blur(6px)" },
    // Land centered directly above: move up exactly 32px (avatar radius 16 + button radius 16)
    visible: { x: 0, y: -32, opacity: 1, scale: 1, filter: "blur(0px)" },
  }

  // Close handlers when open
  useEffect(() => {
    if (step !== 2) return
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) {
        // stop any ongoing playback
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          setIsPlaying(false)
        }
        setStep(1)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          setIsPlaying(false)
        }
        setStep(1)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [step])

  // Revoke object URL on change/unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const handlePlay = async () => {
    if (!text || !text.trim()) return
    try {
      // If already playing, stop and reset (acts as Stop)
      if (audioRef.current && isPlaying) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        setIsPlaying(false)
        return
      }
      setIsFetchingTTS(true)
      const base = getBaseApiUrl()
      const token = getCookie("auth-token")
      const res = await fetch(`${base}/api/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error("TTS request failed")
      const blob = await res.blob()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      if (!audioRef.current) {
        audioRef.current = new Audio()
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false)
          setStep(1)
        })
      }
      audioRef.current.src = url
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (e) {
      console.error(e)
      setIsPlaying(false)
    }
    finally {
      setIsFetchingTTS(false)
    }
  }

  return (
    <div className="sticky bottom-3 self-end z-10">
      <div className="relative h-8 w-8">
        {/* Gooey filter (scoped) */}
        <svg aria-hidden="true" className="absolute -z-10 h-0 w-0">
          <defs>
            <filter id={filterId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -12" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* Filtered wrapper (goo always ON) for avatar + action bubble */}
        <div ref={wrapperRef} style={{ filter: `url(#${filterId})` }} className="relative h-8 w-8">
          {/* Avatar (click source) */}
          <button
            type="button"
            onClick={() => setStep((s) => (s === 1 ? 2 : 1))}
            className="absolute inset-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Assistant actions"
          >
            <MessageAvatar
              src=""
              alt="Assistant"
              fallback={null}
              className="h-8 w-8"
            />
          </button>

          {/* Separate element: emerges from avatar and becomes the Play button */}
          <AnimatePresence>
            {step === 2 && (
              <motion.button
                key="play"
                type="button"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={iconVariants}
                transition={{ duration: 0.75, type: "spring", bounce: 0.15 }}
                className={cn(
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20",
                  // match avatar size (h-8 w-8)
                  "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-ring/20 transition-colors hover:bg-primary/90"
                )}
                aria-label={isPlaying ? "Stop" : isFetchingTTS ? "Loading" : "Play"}
                onClick={handlePlay}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isFetchingTTS ? "spinner" : isPlaying ? "wave" : "play"}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                  >
                    {isFetchingTTS ? (
                      <CircularLoader size="sm" />
                    ) : isPlaying ? (
                      <WaveLoader size="md" />
                    ) : (
                      <Play size={14} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Unfiltered overlay for loader state to avoid jitter while keeping goo on avatar */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <AvatarLoaderState isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

function AvatarDone() {
  return (
    <div className="flex items-center justify-center">
      <ComponentDone />
    </div>
  )
}

function AvatarLoaderState({ isLoading }: { isLoading: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-[2000ms] ease-in-out",
          isLoading ? "opacity-100" : "opacity-0"
        )}
      >
        <Component />
      </div>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-[2000ms] ease-in-out",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      >
        <ComponentDone />
      </div>
    </div>
  )
}

type UIRole = "user" | "assistant"
type UIMessage = { id: number; role: UIRole; content: string }

function nowIso() {
  return new Date().toISOString()
}

function ChatPageInner() {
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const { containerRef, endRef, isAtBottom, scrollToBottom } = useScrollToBottom()

  // Sessions and auth handled via Django token in cookies; no TRPC

  // Load session if provided in URL (from Django)
  const urlSessionId = searchParams?.get("session") || null
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!urlSessionId) return
      try {
        const s = await chatApi.getSession(urlSessionId)
        if (cancelled) return
        setSessionId(s.id)
        setAgentId((s as any).agentId || null)
        const ui = (s.messages || []).map((m: any, idx: number) => ({ id: idx + 1, role: m.role as UIRole, content: m.content }))
        setMessages(ui)
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [urlSessionId])

  // Load agents and default to last-created
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    let cancelled = false
    async function loadAgents() {
      try {
        const items = await listAgents()
        if (cancelled) return
        const arr = (items || []).map(a => ({ id: a.id, name: a.name }))
        setAgents(arr)
        if (!agentId && arr.length > 0) setAgentId(arr[0].id)
      } catch {}
    }
    loadAgents()
    return () => { cancelled = true }
  }, [])

  // Toolkits no longer required on the client for Django-backed chat

  // Persistence: explicitly write user and assistant messages like the reference implementation.

  // No sessions list here; global app sidebar will handle session navigation

  const handleSubmit = async () => {
    const trimmed = prompt.trim()
    if (!trimmed || isLoading) return

    // Ensure we have auth token (best-effort)
    const token = getCookie("sb-access-token")
    if (!token) console.warn("No auth token found; requests may fail")

    setPrompt("")
    setIsLoading(true)

    const userMsg: UIMessage = { id: messages.length + 1, role: "user", content: trimmed }
    const assistantPlaceholder: UIMessage = { id: messages.length + 2, role: "assistant", content: "" }
    const next = [...messages, userMsg, assistantPlaceholder]
    setMessages(next)

    try {
      // Ensure session exists via Django
      let sId = sessionId
      if (!sId) {
        const title = trimmed.slice(0, 80)
        const created = await chatApi.createSession(title, agentId || undefined)
        sId = created.id
        setSessionId(sId)
        setAgentId((created as any).agentId || agentId)
        const sp = new URLSearchParams(searchParams?.toString())
        sp.set("session", sId)
        router.replace(`/workspace/chat?${sp.toString()}`)
      }

      // Persist user message via Django
      await chatApi.appendMessage(sId!, "user", trimmed)

      // Stream assistant response from Django
      const res = await chatApi.streamInteractive(trimmed, sId!)
      if (!res.body) throw new Error(`No stream body`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      let toolBuf = ""
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          // Accumulate for JSON lines (tool events) and process per-line
          toolBuf += chunk
          for (;;) {
            const nl = toolBuf.indexOf("\n")
            if (nl < 0) break
            const line = toolBuf.slice(0, nl)
            toolBuf = toolBuf.slice(nl + 1)
            const trimmed = line.trim()
            if (!trimmed) continue
            try {
              const obj = JSON.parse(trimmed)
              if (obj && typeof obj === "object" && typeof obj.event === "string" && obj.event.startsWith("on_tool_")) {
                // Show the raw JSON line as-is (no transformation)
                setMessages((prev) => {
                  const updated = [...prev]
                  const idx = updated.findIndex((m, i) => m.role === "assistant" && i === updated.length - 1)
                  if (idx !== -1) {
                    const prefix = updated[idx].content ? updated[idx].content + "\n" : ""
                    updated[idx] = { ...updated[idx], content: `${prefix}${trimmed}` }
                  }
                  return updated
                })
                continue
              }
            } catch {
              // line is not JSON; ignore for tool events
            }
          }
          // Treat remaining non-JSON text as assistant content delta
          acc += chunk
          setMessages((prev) => {
            const updated = [...prev]
            const lastIdx = updated.findIndex((m, i) => m.role === "assistant" && i === updated.length - 1)
            if (lastIdx !== -1) updated[lastIdx] = { ...updated[lastIdx], content: acc }
            return updated
          })
        }
      }

      // Backend persists assistant at end of stream; no client-side duplicate write
      // Auto-scroll to bottom after stream completes
      scrollToBottom("smooth")
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-scroll when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("smooth")
    }
  }, [messages.length, scrollToBottom])

  // Removed right-side agent sidebar; approvals/todos/files panel omitted

  return (
    <main className="flex min-h-screen flex-col overflow-hidden">
      {/* Center column: chat */}
      <div className="mx-auto w-full max-w-3xl flex min-h-screen flex-col">
        <div className="relative flex-1">
          <div ref={containerRef} className="absolute inset-0 overflow-y-auto">
            <div className="space-y-6 px-5 py-15 pb-24">
          {messages.length === 0 && !isLoading && (
            <Greeting
            visible={(prompt?.trim().length ?? 0) === 0}
            {...(agentId ? { agentId } : {})}
            onSelect={(text) => {
              setPrompt(text)
            }}
          />
          )}
          {messages
            .filter((m: UIMessage) => m.role === "user" || m.role === "assistant")
            .map((message: UIMessage, index: number, arr: UIMessage[]) => {
              const isAssistant = message.role === "assistant"
              const isLastMessage = index === arr.length - 1
              const showAssistantLoader = isAssistant && isLastMessage && isLoading

              return (
                <MessageComponent
                  key={message.id}
                  className={cn(
                    "mx-auto w-full max-w-3xl gap-3 px-6",
                    isAssistant ? "justify-start items-end" : "justify-end"
                  )}
                >
                  {isAssistant ? (
                    <>
                      <InteractiveAssistantAvatar
                        isLoading={showAssistantLoader}
                        text={message.content}
                      />
                      <div className="group flex w-full flex-col gap-2">
                        {splitAssistantContentAggregated(message.content).map((block, i) => {
                          if (block.kind === "toolAgg") {
                            return <FunctionCallCard key={i} block={block} />
                          }
                          if (block.kind === "text" && block.text.trim()) {
                            return (
                              <MessageContent
                                key={i}
                                className="text-foreground prose flex-1 rounded-lg bg-transparent p-0"
                                markdown
                              >
                                {block.text}
                              </MessageContent>
                            )
                          }
                          return null
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="group flex flex-col items-end gap-1">
                      <MessageContent className="bg-muted text-primary max-w-[85%] px-5 py-2.5 sm:max-w-[75%]">
                        {message.content}
                      </MessageContent>
                      <MessageActions className={cn("flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100")}>
                        <MessageAction tooltip="Edit" delayDuration={100}>
                          <Button variant="ghost" size="icon">
                            <Pencil />
                          </Button>
                        </MessageAction>
                        <MessageAction tooltip="Delete" delayDuration={100}>
                          <Button variant="ghost" size="icon">
                            <Trash />
                          </Button>
                        </MessageAction>
                        <MessageAction tooltip="Copy" delayDuration={100}>
                          <Button variant="ghost" size="icon">
                            <Copy />
                          </Button>
                        </MessageAction>
                      </MessageActions>
                    </div>
                  )}
                </MessageComponent>
              )
            })}
              <div ref={endRef} className="h-px w-full shrink-0" aria-hidden="true" />
            </div>
            <div className="pointer-events-none fixed right-6 bottom-24 z-10">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "pointer-events-auto h-10 w-10 rounded-full shadow-sm transition-all duration-150 ease-out",
                  !isAtBottom
                    ? "translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none translate-y-4 scale-95 opacity-0"
                )}
                onClick={() => scrollToBottom("smooth")}
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Input inside the same centered container */}
        <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
          <PromptInput
            isLoading={isLoading}
            value={prompt}
            onValueChange={setPrompt}
            onSubmit={handleSubmit}
            className="border-input bg-popover relative z-10 w-full border p-0 pt-1 shadow-xs"
          >
            <div className="flex flex-col">
              <PromptInputTextarea
                placeholder="Ask anything"
                className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
              />

              <PromptInputActions className="mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3">
                <div className="flex items-center gap-2">
                  <PromptInputAction tooltip="Add a new action">
                    <Button variant="outline" size="icon" className="size-9 ">
                      <Plus size={18} />
                    </Button>
                  </PromptInputAction>

                  <PromptInputAction tooltip="More actions">
                    <Button variant="outline" size="icon" className="size-9">
                      <MoreHorizontal size={18} />
                    </Button>
                  </PromptInputAction>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" className="px-4">Send</Button>
                </div>
              </PromptInputActions>
            </div>
          </PromptInput>
        </div>
      </div>
    </main>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center"><div className="text-sm text-muted-foreground">Loading…</div></main>}>
      <ChatPageInner />
    </Suspense>
  )
}
 
