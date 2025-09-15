"use client";

import React from "react";
import { listInbox, type InboxItem } from "@/shared/lib/inbox";
import { useUser } from "@/shared/hooks/useUser";

export type ThreadsContextType = {
  loading: boolean;
  items: InboxItem[];
  reload: (opts?: { status?: string; offset?: number; limit?: number }) => Promise<void>;
  clear: () => void;
};

const ThreadsContext = React.createContext<ThreadsContextType | undefined>(undefined);

export function ThreadsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<InboxItem[]>([]);

  const reload = React.useCallback(async (opts?: { status?: string; offset?: number; limit?: number }) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Backend supports status; offset/limit not yet exposed, so filter client-side for now
      const resp = await listInbox({ user_id: user.id, status: opts?.status });
      setItems(resp || []);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const clear = React.useCallback(() => setItems([]), []);

  const value: ThreadsContextType = { loading, items, reload, clear };
  return <ThreadsContext.Provider value={value}>{children}</ThreadsContext.Provider>;
}

export function useThreads() {
  const ctx = React.useContext(ThreadsContext);
  if (!ctx) throw new Error("useThreads must be used within ThreadsProvider");
  return ctx;
}
