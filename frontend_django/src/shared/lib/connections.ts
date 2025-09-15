import { apiFetch } from "./api";

export async function initiateOAuth(params: { toolkitSlug: string; userId: string; callbackUrl: string }): Promise<{ redirectUrl: string; connectionRequestId: string }> {
  return await apiFetch("/api/connections/oauth/initiate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function waitOAuth(params: { connectionRequestId: string; userId: string }): Promise<{ connectedAccount: { id: string; authConfig?: { id: string } } }> {
  return await apiFetch("/api/connections/oauth/initiate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function createConnectedAccount(params: { toolkitSlug: string; userId: string; credentials: Record<string, string>; authScheme: string }): Promise<{ connectedAccount: { id: string; toolkit: { slug: string }; authConfig?: { id: string } }; authConfigId?: string }>{
  // Backend endpoint is /api/connections (see backend/connections/urls.py)
  return await apiFetch("/api/connections", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export type ConnectedAccount = { connectedAccountId: string; authConfigId?: string; toolkitSlug: string; status?: string };
export async function listConnectedAccounts(toolkit?: string): Promise<ConnectedAccount[]> {
  const qs = toolkit ? `?toolkit=${encodeURIComponent(toolkit)}` : "";
  const resp = await apiFetch(`/api/connections/list${qs}`, { method: "GET" });
  const items = (resp && (resp as any).items) || [];
  return Array.isArray(items) ? (items as ConnectedAccount[]) : [];
}
