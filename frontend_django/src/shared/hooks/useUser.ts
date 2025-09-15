"use client";

import { useEffect, useState } from "react";
import { apiFetch, getCookie } from "@/shared/lib/api";

export type AppUser = {
  id: string;
  email?: string;
  username?: string;
} | null;

export function useUser() {
  const [user, setUser] = useState<AppUser | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Session-based auth: ask backend who am I
    let cancelled = false;
    (async () => {
      try {
        const resp = await apiFetch("/api/auth/me", { method: "GET" });
        if (!cancelled) {
          setUser((resp?.user as AppUser) ?? null);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load user");
          setUser(null);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { user, loading, error };
}

export async function logoutClient() {
  try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch {}
}
