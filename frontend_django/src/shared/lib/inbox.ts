import { apiFetch } from "@/shared/lib/api";

export type InboxItem = {
  id: string;
  user_id: string;
  agent?: { id: string; name?: string } | string | null;
  thread?: { id: string; title?: string } | string | null;
  run?: { id: string } | string | null;
  correlation_id?: string | null;
  title: string;
  description?: string | null;
  status: "waiting_human" | "resolved" | string;
  action_request?: any;
  config?: any;
  response_type?: string | null;
  response?: any;
  created_at?: string;
  updated_at?: string;
};

function normalizeItem(raw: InboxItem): InboxItem {
  const normalized: InboxItem = { ...raw };
  // Normalize thread field: accept string UUID or object
  const t: any = (raw as any).thread;
  if (t && typeof t === "string") {
    (normalized as any).thread = { id: t } as any;
  }
  // Normalize run field
  const r: any = (raw as any).run;
  if (r && typeof r === "string") {
    (normalized as any).run = { id: r } as any;
  }
  // Normalize agent field
  const a: any = (raw as any).agent;
  if (a && typeof a === "string") {
    (normalized as any).agent = { id: a } as any;
  }
  return normalized;
}

export async function listInbox(params: { user_id: string; status?: string; agent_id?: string; correlation_id?: string }) {
  const q = new URLSearchParams();
  q.set("user_id", params.user_id);
  if (params.status) q.set("status", params.status);
  if (params.agent_id) q.set("agent_id", params.agent_id);
  if (params.correlation_id) q.set("correlation_id", params.correlation_id);
  const data = await apiFetch(`/api/inbox/?${q.toString()}`, { method: "GET" }) as InboxItem[];
  return Array.isArray(data) ? data.map(normalizeItem) : [];
}

export async function respondInbox(id: string, payload: { type: string; args: any }) {
  return apiFetch(`/api/inbox/${id}/respond`, { method: "POST", body: JSON.stringify(payload) });
}

export async function deleteInbox(id: string) {
  return apiFetch(`/api/inbox/${id}`, { method: "DELETE" });
}
