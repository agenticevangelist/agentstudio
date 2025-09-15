"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// Removed Card wrappers for simpler layout
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { toast } from "sonner";
import { ApiKeyForm } from "@/features/agents/components/new/ApiKeyForm";
import { ToolkitItem } from "@/features/agents/components/new/ToolkitItem";
// Removed Stepper UI
import { useUser } from "@/shared/hooks/useUser";
import KnowledgeUpload, { getAutoKnowledgeTitle } from "@/features/agents/components/new/KnowledgeUpload";
import { createAgent as createAgentReq, finalizeSetup as finalizeSetupReq, uploadAgentKnowledge } from "@/shared/lib/agents";
import { initiateOAuth as initiateOAuthReq, waitOAuth as waitOAuthReq, createConnectedAccount as createConnectedAccountReq } from "@/shared/lib/connections";
import { getToolkitDetails as getToolkitDetailsReq, listComposioToolsByToolkit as listComposioToolsByToolkitReq, listAllToolkits, ToolkitSummary } from "@/shared/lib/toolkits";
import { listConnectedAccounts } from "@/shared/lib/connections";
import { Search, LoaderCircle } from "lucide-react";
import { motion } from "motion/react";


type ToolkitAuthField = { name: string; type: string; displayName?: string; description?: string };
type ToolkitAuthDetails = {
  mode: string;
  required?: boolean;
  fields?: {
    authConfigCreation?: { required: ToolkitAuthField[]; optional: ToolkitAuthField[] };
    connectedAccountInitiation?: { required: ToolkitAuthField[]; optional: ToolkitAuthField[] };
  };
};

type ToolkitPlanItem = {
  slug: string;
  name?: string;
  description?: string;
};

type CreatedAgent = {
  id: string;
  name: string;
  purpose: string;
  is_public: boolean;
  memory?: { toolkit_plan?: ToolkitPlanItem[] };
};

type ToolSummary = { name: string; description?: string; function?: { name: string } };

function toTitleCase(input: string | undefined | null): string {
  if (!input) return "";
  return String(input)
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export function CreateAgentWizard() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [agent, setAgent] = useState<CreatedAgent | null>(null);
  const { user: me } = useUser();
  const [createLoading, setCreateLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const autoFinalizeAttemptedRef = useRef(false);

  // Knowledge upload state
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeUploading, setKnowledgeUploading] = useState(false);

  const [toolkitDetails, setToolkitDetails] = useState<Record<string, { authConfigDetails?: ToolkitAuthDetails[] }>>({});
  const [connectedToolkits, setConnectedToolkits] = useState<Record<string, boolean | "loading">>({});
  const [toolkitTools, setToolkitTools] = useState<Record<string, ToolSummary[]>>({});
  const [connectionData, setConnectionData] = useState<Record<string, { connectedAccountId: string; authConfigId: string }>>({});
  const [allToolkits, setAllToolkits] = useState<ToolkitSummary[]>([]);
  const [connectionsByToolkit, setConnectionsByToolkit] = useState<Record<string, Array<{ id: string; label: string }>>>({});
  const [selectedToolkits, setSelectedToolkits] = useState<Set<string>>(new Set());
  const [toolkitSearch, setToolkitSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchLoading, setSearchLoading] = useState(false);
  const suggestedSlugs: string[] = [
    "gmail",
    "googlecalendar",
    "googlesheets",
    "googledrive",
    "github",
    "gitlab",
    "slack",
    "notion",
    "linear",
    "jira",
    "confluence",
    "trello",
    "airtable",
    "hubspot",
    "stripe",
    "shopify",
    "discord",
    "twilio",
    "dropbox",
    "zendesk",
    "asana",
  ];

  const [showApiKeyFor, setShowApiKeyFor] = useState<string | null>(null);
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({});

  // Connections helpers
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  const toolkitPlan = useMemo(() => agent?.memory?.toolkit_plan || [], [agent]);
  const purposeMaxChars = 600;
  const purposeCharsUsed = purpose.length;
  const systemPromptMaxChars = 1000;
  const systemPromptCharsUsed = systemPrompt.length;

  const fetchToolkitDetails = useCallback(async (slug: string) => {
    try {
      const details = await getToolkitDetailsReq(slug);
      setToolkitDetails(prev => ({ ...prev, [slug.toLowerCase()]: details as any }));
    } catch (e) {
      // ignore
    }
  }, []);

  const fetchToolsForToolkit = useCallback(async (slug: string) => {
    try {
      const tools = await listComposioToolsByToolkitReq(slug);
      // Normalize shape: accept either array or envelope { items, ... }
      const arr = Array.isArray(tools) ? tools : ((tools as any)?.items ?? []);
      setToolkitTools(prev => ({ ...prev, [slug.toLowerCase()]: (Array.isArray(arr) ? arr : []) as ToolSummary[] }));
    } catch (e) {
      setToolkitTools(prev => ({ ...prev, [slug.toLowerCase()]: [] }));
    }
  }, []);

  const ensureConnectionsFor = useCallback(async (slug: string) => {
    const key = slug.toLowerCase();
    if (connectionsByToolkit[key] && connectionsByToolkit[key].length) return;
    try {
      const conns = await listConnectedAccounts(slug);
      const tk = (allToolkits || []).find((x) => x.slug.toLowerCase() === key);
      setConnectionsByToolkit(prev => ({
        ...prev,
        [key]: (conns || []).map((c) => ({ id: c.connectedAccountId, label: `${toTitleCase(tk?.name || key)} • ${c.connectedAccountId.slice(0, 6)}…` })),
      }));
    } catch {}
  }, [connectionsByToolkit, allToolkits]);

  useEffect(() => {
    // Prefill from ?suggest= base64url payload
    try {
      const params = new URLSearchParams(window.location.search);
      const suggest = params.get("suggest");
      if (suggest) {
        const pad = (s: string) => s + "===".slice((s.length + 3) % 4);
        const b64 = suggest.replaceAll('-', '+').replaceAll('_', '/');
        const json = decodeURIComponent(escape(window.atob(pad(b64))));
        const obj = JSON.parse(json || "{}");
        const n = String(obj?.name || "");
        const p = String(obj?.purpose || "");
        const sp = String(obj?.systemPrompt || "");
        const tk: string[] = Array.isArray(obj?.toolkitSlugs) ? obj.toolkitSlugs.map((x: any) => String(x || "").toLowerCase()).filter(Boolean) : [];
        if (n) setName(n);
        if (p) setPurpose(p);
        if (sp) setSystemPrompt(sp);
        if (tk.length) {
          const next = new Set<string>(tk.map((s) => s.toLowerCase()));
          setSelectedToolkits(next);
        }
      }
    } catch {}
    // Load toolkits list only; defer connections fetch until a toolkit is selected or explicitly needed
    async function loadToolkits() {
      try {
        const tks = await listAllToolkits();
        setAllToolkits(tks);
      } catch {}
    }
    loadToolkits();
  }, []);

  useEffect(() => {
    setSearchLoading(true);
    const t = setTimeout(() => setSearchLoading(false), 250);
    return () => clearTimeout(t);
  }, [toolkitSearch]);

  // Expose readiness + primary action to breadcrumb via window
  useEffect(() => {
    function computeReady() {
      const atLeastOneSelected = selectedToolkits.size > 0;
      const allSelectedConnected = atLeastOneSelected && Array.from(selectedToolkits).every((s) => connectedToolkits[s] === true);
      if (!agent) return !!name && !!purpose && atLeastOneSelected && !createLoading;
      return allSelectedConnected && !finalizeLoading;
    }
    const ctrl = {
      getReady: () => computeReady(),
      trigger: () => {
        if (!agent) {
          if (!knowledgeTitle && knowledgeFiles.length) {
            setKnowledgeTitle(getAutoKnowledgeTitle(knowledgeFiles) || "");
          }
          handleCreateAgent();
        } else {
          handleFinish();
        }
      },
    };
    (window as any).__createAgentWizardCtrl = ctrl;
    return () => { if ((window as any).__createAgentWizardCtrl === ctrl) { delete (window as any).__createAgentWizardCtrl; } };
  }, [agent, name, purpose, selectedToolkits, connectedToolkits, createLoading, finalizeLoading, knowledgeFiles, knowledgeTitle]);

  // Auto-finalize once agent exists and all selected toolkits are connected
  useEffect(() => {
    if (!agent) {
      autoFinalizeAttemptedRef.current = false;
      return;
    }
    if (finalizeLoading) return;
    const atLeastOneSelected = selectedToolkits.size > 0;
    const allSelectedConnected = atLeastOneSelected && Array.from(selectedToolkits).every((s) => connectedToolkits[s] === true);
    if (allSelectedConnected && !autoFinalizeAttemptedRef.current) {
      autoFinalizeAttemptedRef.current = true;
      handleFinish();
    }
  }, [agent, selectedToolkits, connectedToolkits, finalizeLoading]);

  // No client-side polling; callback endpoint waits and closes popup on success.

  async function handleCreateAgent() {
    if (!name.trim() || !purpose.trim()) return;
    try {
      setCreateLoading(true);
      const a = await createAgentReq({ name, purpose, systemPrompt: systemPrompt.trim() || undefined });
      setAgent(a as unknown as CreatedAgent);
      setStep(2);
      toast.success("Agent created");
      // If user selected knowledge upfront, upload immediately
      try {
        if (knowledgeFiles.length) {
          setKnowledgeUploading(true);
          await uploadAgentKnowledge((a as any).id, {
            files: knowledgeFiles,
            title: knowledgeTitle || undefined,
          });
          toast.success("Knowledge uploaded");
        }
      } catch (e: any) {
        toast.error(e?.message || "Failed to upload knowledge");
      } finally {
        setKnowledgeUploading(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create agent");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleConnect(slug: string) {
    const normalized = slug.toLowerCase();

    // Ensure we have up-to-date auth details for this toolkit before proceeding
    let details = toolkitDetails[normalized];
    try {
      if (!details || !details.authConfigDetails || details.authConfigDetails.length === 0) {
        const fresh = await getToolkitDetailsReq(slug);
        details = fresh as any;
        setToolkitDetails(prev => ({ ...prev, [normalized]: details as any }));
      }
    } catch (e) {
      // If fetching details failed, do not optimistically connect
      setConnectedToolkits(prev => ({ ...prev, [normalized]: false }));
      toast.error(`Failed to load auth details for ${slug}. Please try again.`);
      return;
    }

    const auths: ToolkitAuthDetails[] = (details?.authConfigDetails || []) as ToolkitAuthDetails[];
    const hasOAuth = !!auths?.find(d => d.mode === "OAUTH2");
    const hasApiKey = !!auths?.find(d => d.mode === "API_KEY");

    try {
      if (hasOAuth) {
        // Only show loading state for OAuth redirect flow
        setConnectedToolkits(prev => ({ ...prev, [normalized]: "loading" }));
        const callbackUrl = `${window.location.origin}/callback`;
        const { redirectUrl, connectionRequestId } = await initiateOAuthReq({ toolkitSlug: slug, userId: me?.id as string, callbackUrl } as any);
        let popup: Window | null = null;
        if (redirectUrl) {
          popup = window.open(redirectUrl, "oauthPopup", "width=600,height=700");
        }
        // Wait server-side on the same endpoint
        const result = await waitOAuthReq({ connectionRequestId, userId: me?.id as string });
        const connected = (result as any).connectedAccount;
        if (!connected?.id) throw new Error("Connection did not complete");
        setConnectedToolkits(prev => ({ ...prev, [normalized]: true }));
        setConnectionData(prev => ({
          ...prev,
          [normalized]: {
            connectedAccountId: connected.id,
            authConfigId: connected?.authConfig?.id,
          },
        }));
        await fetchToolsForToolkit(normalized);
        toast.success(`${slug} connected`);
        try { popup && popup.close(); } catch {}
        return;
      }

      if (hasApiKey) {
        // Do not mark as loading; reveal fields and wait for user to submit
        setConnectedToolkits(prev => ({ ...prev, [normalized]: false }));
        setShowApiKeyFor(normalized);
        return;
      }

      // No auth modes detected; do not auto-connect. Ask user to retry and avoid false "Connected" state.
      setConnectedToolkits(prev => ({ ...prev, [normalized]: false }));
      toast.error(`No auth configuration available for ${slug}. Please retry in a moment or check backend configuration.`);
      return;
    } catch (e: any) {
      setConnectedToolkits(prev => ({ ...prev, [normalized]: false }));
      toast.error(e?.message || `Failed to connect ${slug}`);
    }
  }

  const apiKeyRequiredFields = useMemo(() => {
    if (!showApiKeyFor) return [] as ToolkitAuthField[];
    const details = toolkitDetails[showApiKeyFor];
    const api = (details?.authConfigDetails || []).find(d => d.mode === "API_KEY");
    const reqA = api?.fields?.authConfigCreation?.required || [];
    const reqB = api?.fields?.connectedAccountInitiation?.required || [];
    const merged = [...reqA, ...reqB];
    const byName = new Map<string, ToolkitAuthField>();
    for (const f of merged) byName.set(f.name, f);
    return Array.from(byName.values());
  }, [showApiKeyFor, toolkitDetails]);

  async function submitApiKey() {
    if (!showApiKeyFor) return;
    const slug = showApiKeyFor;
    try {
      setApiKeyLoading(true);
      const result = await createConnectedAccountReq({
        toolkitSlug: slug,
        userId: me?.id as string,
        credentials: apiKeyValues,
        authScheme: "API_KEY",
      } as any);
      setConnectedToolkits(prev => ({ ...prev, [slug]: true }));
      setConnectionData(prev => ({
        ...prev,
        [slug]: {
          connectedAccountId: (result as any).connectedAccount.id,
          authConfigId: (result as any).authConfigId,
        },
      }));
      await fetchToolsForToolkit(slug);
      setShowApiKeyFor(null);
      setApiKeyValues({});
      toast.success(`${slug} connected`);
    } catch (e: any) {
      setConnectedToolkits(prev => ({ ...prev, [slug]: false }));
      toast.error(e?.message || "Failed to connect via API key");
    } finally {
      setApiKeyLoading(false);
    }
  }

  async function handleFinish() {
    if (!agent) return;
    const connections = Object.entries(connectionData).map(([toolkitSlug, data]) => {
      const value = toolkitTools[toolkitSlug];
      const list = Array.isArray(value) ? value : ((value as any)?.items ?? []);
      const safeList = Array.isArray(list) ? list : [];
      return ({
        toolkitSlug,
        ...data,
        enabledToolSlugs: safeList
          .map((t: any) => (t?.function?.name || t?.name))
          .filter(Boolean) as string[],
      });
    });
    try {
      setFinalizeLoading(true);
      await finalizeSetupReq({ agentId: agent.id, connections } as any);
      toast.success("Agent setup complete");
      window.location.href = "/workspace/agents";
    } catch (e: any) {
      toast.error(e?.message || "Failed to finalize setup");
    } finally {
      setFinalizeLoading(false);
    }
  }

  return (
    <div className="h-screen w-full flex overflow-hidden ">
    
      {/* Left panel (70%) */}
      <div className="flex-1 basis-[70%] pt-[60px] px-4 pb-4 overflow-auto min-h-0">
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">Create agent</h1>
            <p className="text-sm text-muted-foreground">Define the basics, then connect integrations. You can edit everything later.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!agent) {
                handleCreateAgent();
              }
            }}
            className="space-y-8"
          >
            <div className="space-y-3">
              <Label htmlFor="name">Name</Label>
              <p id="name-help" className="text-xs text-muted-foreground">A short, memorable name for your agent.</p>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-describedby="name-help"
                placeholder="e.g., GitHub Triage Agent"
              />
            </div>
            <div className="h-px bg-border my-6" />
            <div className="space-y-3">
              <Label htmlFor="purpose">Purpose</Label>
              <p id="purpose-help" className="text-xs text-muted-foreground">What this agent should do. This helps suggest toolkits and defaults.</p>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                aria-describedby="purpose-help"
                placeholder="e.g., Triage GitHub issues, label them, and summarize daily activity"
                rows={5}
                maxLength={purposeMaxChars}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Tip: mention platforms (e.g., GitHub, Slack) to get smarter integration suggestions.
                </span>
                <span aria-live="polite">{purposeCharsUsed}/{purposeMaxChars}</span>
              </div>
            </div>
            <div className="h-px bg-border my-6" />
            <div className="space-y-3">
              <Label htmlFor="systemPrompt">System Prompt (optional)</Label>
              <p id="system-prompt-help" className="text-xs text-muted-foreground">Custom instructions that define the agent's behavior, tone, and approach. This overrides default behavior.</p>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                aria-describedby="system-prompt-help"
                placeholder="e.g., You are a helpful assistant that always responds in a professional tone. When analyzing issues, provide clear action items and prioritize by impact."
                rows={4}
                maxLength={systemPromptMaxChars}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Leave empty to use default system behavior.
                </span>
                <span aria-live="polite">{systemPromptCharsUsed}/{systemPromptMaxChars}</span>
              </div>
            </div>
            <div className="h-px bg-border my-6" />
            <KnowledgeUpload files={knowledgeFiles} setFiles={setKnowledgeFiles} disabled={createLoading || knowledgeUploading} />
          </form>
          <div className="pt-2 flex items-center justify-between">
            <div>
              {agent && (
                <Button variant="ghost" type="button" onClick={() => setStep(1)}>
                  Back to basics
                </Button>
              )}
            </div>
            
          </div>
        </div>
      </div>
      {/* Right panel (30%) with left border only */}
      <div className="basis-[30%] pt-[60px] shrink-0 border-l px-4 pb-4 overflow-auto min-h-0">
        <h3 className="text-base font-medium mb-3">Integrations</h3>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Select at least one toolkit. You can reuse an existing connection or create a new one.</p>
          <div className="relative">
            <Input id="toolkit-search" placeholder="Search toolkits" value={toolkitSearch} onChange={(e) => setToolkitSearch(e.target.value)} className="pl-8" />
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              {searchLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </span>
          </div>

          {/* Category filter dropdown */}
          <div>
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {(() => {
                  const catCounts = new Map<string, { name: string; count: number }>();
                  (allToolkits || []).forEach((tk) => {
                    const cats = tk.meta?.categories || [];
                    if (!cats.length) {
                      const key = "uncategorized";
                      catCounts.set(key, { name: "Uncategorized", count: (catCounts.get(key)?.count || 0) + 1 });
                    } else {
                      cats.forEach((c) => {
                        const key = c.id || c.name;
                        catCounts.set(key, { name: c.name, count: (catCounts.get(key)?.count || 0) + 1 });
                      });
                    }
                  });
                  const entries = [["all", { name: "All", count: allToolkits.length }], ...Array.from(catCounts.entries())] as Array<[string, { name: string; count: number }]>;
                  return entries
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([id, { name, count }]) => (
                      <SelectItem key={id} value={id}>
                        {toTitleCase(name)} ({count})
                      </SelectItem>
                    ));
                })()}
              </SelectContent>
            </Select>
          </div>

          {/* Selected section (priority) */}
          {selectedToolkits.size > 0 && (
            <div>
              <div className="text-xs font-medium mb-3">Selected ({selectedToolkits.size})</div>
              <div className="space-y-1">
                {Array.from(selectedToolkits).map((slug) => {
                  const tk = (allToolkits || []).find((x) => x.slug.toLowerCase() === slug);
                  if (!tk) return null;
                  const existing = connectionsByToolkit[slug] || [];
              const status = connectedToolkits[slug];
              return (
                    <motion.div
                      key={slug}
                      className="rounded-lg border bg-card p-3 shadow-sm"
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      transition={{ duration: 0.12, ease: "easeOut" }}
                      layout
                    >
                      <div className="flex items-center gap-2 mb-3 relative">
                        <span className={`absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full border ${connectionData[slug]?.connectedAccountId ? 'bg-green-500 border-green-600' : 'bg-yellow-400 border-yellow-500'}`} aria-hidden="true" />
                        {tk.meta?.logo && (
                          <img src={tk.meta.logo} alt="" className="h-5 w-5 rounded-sm border object-contain" />
                        )}
                        <div className="text-sm font-medium flex-1">{toTitleCase(tk.name || slug)}</div>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            const next = new Set(selectedToolkits);
                            next.delete(slug);
                            setSelectedToolkits(next);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      
                      {/* Connection actions (hidden when API key fields are visible) */}
                      {showApiKeyFor !== slug && (
                        <div className="space-y-2">
                          {existing.length > 0 ? (
                            <div>
                              <Select onValueChange={(id) => {
                                if (id === "__NEW__") {
                                  // For new connection, only show loading for OAuth in handleConnect
                                  setConnectedToolkits((prev) => ({ ...prev, [slug]: false }));
                                  setConnectionData((prev) => ({ ...prev, [slug]: { connectedAccountId: "", authConfigId: "" } }));
                                  handleConnect(slug);
                                  return;
                                }
                                setConnectedToolkits((prev) => ({ ...prev, [slug]: true }));
                                setConnectionData((prev) => ({ ...prev, [slug]: { connectedAccountId: id, authConfigId: "" } }));
                              }}>
                                <SelectTrigger className="h-8 " disabled={status === "loading"}>
                                  <span className="inline-flex items-center gap-2">
                                    {status === "loading" && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                                    <span>{status === "loading" ? "Connecting..." : (connectionData[slug]?.connectedAccountId ? "Connected" : "Connect")}</span>
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  {existing.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                                  ))}
                                  <SelectItem key="__NEW__" value="__NEW__">+ New connection</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConnect(slug)}
                              disabled={status === "loading"}
                              className="h-7 text-xs"
                            >
                              <span className="inline-flex items-center gap-2">
                                {status === "loading" && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                                <span>{status === "loading" ? "Connecting..." : (connectionData[slug]?.connectedAccountId ? "Connected" : "Connect")}</span>
                              </span>
                            </Button>
                          )}
                        </div>
                      )}

                  {showApiKeyFor === slug && (
                          <div className="mt-2">
                    <ApiKeyForm
                      fields={apiKeyRequiredFields}
                      values={apiKeyValues}
                      onChange={setApiKeyValues}
                      onSubmit={submitApiKey}
                      onCancel={() => { setShowApiKeyFor(null); setApiKeyValues({}); }}
                      loading={apiKeyLoading}
                    />
                          </div>
                        )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggested section (hidden when searching) */}
          {(() => {
            if (toolkitSearch.trim().length > 0) return null;
            const suggested = suggestedSlugs
              .map((s) => (allToolkits || []).find((x) => x.slug.toLowerCase() === s))
              .filter(Boolean) as ToolkitSummary[];
            if (!suggested.length) return null;
            return (
              <div>
                <div className="text-xs font-medium mb-2">Suggested</div>
                <div className="grid grid-cols-2 gap-2">
                  {suggested.map((tk) => {
                    const slug = tk.slug.toLowerCase();
                    if (selectedToolkits.has(slug)) return null;
                    return (
                      <motion.button
                        key={slug}
                        type="button"
                        className="rounded-md border p-2 text-left hover:bg-muted transition-colors"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.995 }}
                        onClick={() => {
                          const next = new Set(selectedToolkits);
                          if (next.has(slug)) next.delete(slug); else next.add(slug);
                          setSelectedToolkits(next);
                          ensureConnectionsFor(slug);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {tk.meta?.logo && (
                            <img src={tk.meta.logo} alt="" className="h-5 w-5 rounded-sm border object-contain" />
                          )}
                          <span className="text-sm truncate">{toTitleCase(tk.name || slug)}</span>
                        </div>
                      </motion.button>
              );
            })}
          </div>
              </div>
            );
          })()}

          {/* Category groups */}
          <div className="space-y-5">
            {(() => {
              const filtered = (allToolkits || []).filter((tk: ToolkitSummary) => {
                if (!toolkitSearch.trim()) return true;
                const q = toolkitSearch.toLowerCase();
                return (tk.name || tk.slug).toLowerCase().includes(q) || (tk.description || "").toLowerCase().includes(q);
              });
              const categoryFiltered = filtered.filter((tk) => {
                if (activeCategory === "all") return true;
                const cats = tk.meta?.categories || [{ id: "uncategorized", name: "Uncategorized" } as { id: string; name: string }];
                return !!(cats as { id: string; name: string }[]).find((c) => (c.id || c.name) === activeCategory);
              });
              const groups: Record<string, ToolkitSummary[]> = {};
              for (const tk of categoryFiltered) {
                const cats = tk.meta?.categories || [{ id: "uncategorized", name: "Uncategorized" } as { id: string; name: string }];
                for (const c of cats as { id: string; name: string }[]) {
                  const key = c.id || c.name || "uncategorized";
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(tk);
                }
              }
              const entries = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
              return entries.map(([key, items]) => (
                <div key={key} className="space-y-2">
                  <div className="text-xs font-medium capitalize">{toTitleCase(items[0]?.meta?.categories?.find((c: { id: string; name: string }) => (c.id || c.name) === key)?.name || key.replaceAll('-', ' '))}</div>
                  {/* Compact grid of icon + name */}
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((tk) => {
                      const slug = tk.slug.toLowerCase();
                      if (selectedToolkits.has(slug)) return null; // skip already selected, shown above
                      return (
                        <motion.button
                          key={slug}
                          type="button"
                          className="rounded-md border p-2 text-left hover:bg-muted transition-colors"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => {
                            const next = new Set(selectedToolkits);
                            if (next.has(slug)) next.delete(slug); else next.add(slug);
                            setSelectedToolkits(next);
                            ensureConnectionsFor(slug);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {tk.meta?.logo && (
                              <img src={tk.meta.logo} alt="" className="h-5 w-5 rounded-sm border object-contain" />
                            )}
                            <span className="text-sm truncate">{toTitleCase(tk.name || slug)}</span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
