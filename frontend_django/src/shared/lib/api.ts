export function getBaseApiUrl() {
  return (
    process.env.NEXT_PUBLIC_DJANGO_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000"
  );
}

export function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const base = getBaseApiUrl();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
  // Prefer DRF token if present
  const token = getCookie("auth-token");
  if (token) headers["Authorization"] = `Token ${token}`;
  // Always send credentials for session auth
  (init as any).credentials = "include";

  const resp = await fetch(`${base}${path}`, { ...init, headers });
  const text = await resp.text();
  let json: any;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!resp.ok) {
    const msg = (json && (json.error || json.message)) || `HTTP ${resp.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json;
}

// Streaming helper: returns the Response for caller to read body.getReader()
export async function apiStream(path: string, body: any): Promise<Response> {
  const base = getBaseApiUrl();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getCookie("auth-token");
  if (token) headers["Authorization"] = `Token ${token}`;
  const resp = await fetch(`${base}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {}),
    credentials: "include",
  });
  if (!resp.ok) {
    const text = await resp.text();
    let message = text;
    try { const j = JSON.parse(text); message = j.error || j.message || text; } catch {}
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return resp;
}

// Chat API (Django)
export const chatApi = {
  listSessions: () => apiFetch(`/api/chat/sessions`, { method: "GET" }) as Promise<{ items: { id: string; title: string; createdAt: string; agentId?: string | null }[] }>,
  createSession: (title: string, agentId?: string) => apiFetch(`/api/chat/sessions`, { method: "POST", body: JSON.stringify({ title, agentId }) }) as Promise<{ id: string; title: string; createdAt: string; agentId?: string | null }>,
  getSession: (id: string) => apiFetch(`/api/chat/sessions/${id}`, { method: "GET" }) as Promise<{ id: string; title: string; agentId?: string | null; messages: { id: string; role: string; content: string; createdAt: string }[] }>,
  appendMessage: (id: string, role: string, content: string) => apiFetch(`/api/chat/sessions/${id}`, { method: "POST", body: JSON.stringify({ role, content }) }) as Promise<{ id: string; role: string; content: string; createdAt: string }>,
  updateSessionAgent: (id: string, agentId: string) => apiFetch(`/api/chat/sessions/${id}`, { method: "PATCH", body: JSON.stringify({ agentId }) }) as Promise<{ id: string; agentId: string }>,
  streamInteractive: (text: string, threadId?: string) => apiStream(`/api/chat/interactive/stream`, { text, thread_id: threadId }),
};
