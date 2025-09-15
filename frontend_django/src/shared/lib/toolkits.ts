import { apiFetch } from "./api";

export type ToolkitAuthField = { name: string; type: string; displayName?: string; description?: string };
export type ToolkitAuthDetails = {
  mode: string;
  required?: boolean;
  fields?: {
    authConfigCreation?: { required: ToolkitAuthField[]; optional: ToolkitAuthField[] };
    connectedAccountInitiation?: { required: ToolkitAuthField[]; optional: ToolkitAuthField[] };
  };
};

export async function getToolkitDetails(slug: string): Promise<{ authConfigDetails?: ToolkitAuthDetails[] }> {
  // Canonical endpoint lives under /api/toolkits
  return await apiFetch(`/api/toolkits/${encodeURIComponent(slug)}/details`, { method: "GET" });
}

export type ToolSummary = { name: string; description?: string; function?: { name: string } };
export async function listComposioToolsByToolkit(slug: string): Promise<ToolSummary[]> {
  // Canonical endpoint lives under /api/toolkits and returns a paginated envelope
  const resp = await apiFetch(`/api/toolkits/${encodeURIComponent(slug)}/tools`, { method: "GET" });
  if (Array.isArray(resp)) return resp as ToolSummary[];
  const items = (resp && (resp as any).items) || [];
  return Array.isArray(items) ? (items as ToolSummary[]) : [];
}

export type ToolkitSummary = {
  slug: string;
  name?: string;
  description?: string;
  meta?: {
    categories?: Array<{ id: string; name: string }>;
    logo?: string;
  };
};
export async function listAllToolkits(): Promise<ToolkitSummary[]> {
  const resp = await apiFetch(`/api/toolkits/cache`, { method: "GET" });
  const items = (resp && (resp as any).items) || [];
  return Array.isArray(items) ? (items as ToolkitSummary[]) : [];
}
