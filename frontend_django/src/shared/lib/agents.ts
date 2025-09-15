import { apiFetch, getBaseApiUrl, getCookie } from "./api";

export type Agent = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  purpose: string;
  memory: Record<string, any>;
  suggested_task_prompts: any[];
  suggested_job_prompts: any[];
  is_public: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function listAgents(): Promise<Agent[]> {
  return await apiFetch("/api/agents/", { method: "GET" });
}

export async function createAgent(input: { name: string; description?: string; purpose?: string; systemPrompt?: string; memory?: Record<string, any> }): Promise<Agent> {
  return await apiFetch("/api/agents/", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getAgent(id: string): Promise<Agent> {
  return await apiFetch(`/api/agents/${id}`, { method: "GET" });
}

export async function updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
  return await apiFetch(`/api/agents/${id}` , {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteAgent(id: string): Promise<{ success: boolean }> {
  return await apiFetch(`/api/agents/${id}`, { method: "DELETE" });
}

export async function finalizeSetup(params: {
  agentId: string;
  connections: Array<{
    toolkitSlug: string;
    connectedAccountId: string;
    authConfigId?: string;
    enabledToolSlugs: string[];
  }>;
}): Promise<{ ok: boolean }> {
  return await apiFetch(`/api/agents/finalize-setup`, {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function uploadAgentKnowledge(agentId: string, data: {
  files?: File[];
  title?: string;
  tags?: string[];
  text_docs?: Array<{ title?: string; content: string; tags?: string[] }>;
}): Promise<any> {
  const base = getBaseApiUrl();
  const token = getCookie("auth-token");
  const form = new FormData();
  (data.files || []).forEach((f) => form.append("files", f));
  if (data.title) form.append("title", data.title);
  if (data.tags) form.append("tags", JSON.stringify(data.tags));
  if (data.text_docs && data.text_docs.length) form.append("text_docs", JSON.stringify(data.text_docs));
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Token ${token}`;
  const resp = await fetch(`${base}/api/agents/${agentId}/knowledge/upload`, {
    method: "POST",
    headers,
    body: form,
  });
  const text = await resp.text();
  let json: any;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!resp.ok) {
    const msg = (json && (json.error || json.message)) || `HTTP ${resp.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json;
}
