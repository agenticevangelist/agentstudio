"use client"

import React, { createContext, useContext, useState, useMemo, ReactNode } from "react"

type AgentSidebarContextValue = {
  content: ReactNode | null
  setContent: (node: ReactNode | null) => void
}

const AgentSidebarContext = createContext<AgentSidebarContextValue | null>(null)

export function AgentSidebarProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<ReactNode | null>(null)
  const value = useMemo(() => ({ content, setContent }), [content])
  return (
    <AgentSidebarContext.Provider value={value}>{children}</AgentSidebarContext.Provider>
  )
}

export function useAgentSidebar() {
  const ctx = useContext(AgentSidebarContext)
  if (!ctx) throw new Error("useAgentSidebar must be used within AgentSidebarProvider")
  return ctx
}
