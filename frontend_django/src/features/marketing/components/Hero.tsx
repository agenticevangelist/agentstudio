"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/features/chat/prompt-kit/prompt-input";
import { ProgressiveBlur } from "./progressive-blur";
import RisingIllustration from "@/features/marketing/illustrations/rising-small";
// Brand icons (install: npm i react-icons)
// @ts-ignore - types shim added for dev convenience
import {
  SiGmail,
  SiGooglecalendar,
  SiGooglesheets,
  SiGoogledrive,
  SiGithub,
  SiGitlab,
  SiSlack,
  SiNotion,
  SiLinear,
  SiJira,
  SiConfluence,
  SiTrello,
  SiAirtable,
  SiHubspot,
  SiStripe,
  SiShopify,
  SiDiscord,
  SiTwilio,
  SiDropbox,
  SiZendesk,
  SiAsana,
} from "react-icons/si";

export function Hero() {
  const [text, setText] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    const payload = { prompt: text };
    try {
      // Call suggest API
      const res = await fetch("/api/agents/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const suggestObj = {
        name: String(data?.name || "").trim(),
        purpose: String(data?.purpose || text).trim(),
        systemPrompt: String(data?.systemPrompt || "").trim(),
        toolkitSlugs: Array.isArray(data?.toolkitSlugs) ? data.toolkitSlugs : [],
      };

      // Base64url encode the suggestion to keep URL compact and safe
      const jsonStr = JSON.stringify(suggestObj);
      const b64 = typeof window !== 'undefined' ?
        window.btoa(unescape(encodeURIComponent(jsonStr))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'') :
        Buffer.from(jsonStr, 'utf-8').toString('base64').replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');

      // Gate by auth: if accessing /workspace will redirect to /login via middleware when not logged in,
      // include next param to preserve the suggestion
      const target = `/workspace/agents/new?suggest=${b64}`;
      // We go directly; middleware will bounce to /login if needed and we can enhance login to honor next
      router.push(target);
    } catch (e) {
      // As a fallback, still route to creation without suggestion
      router.push("/workspace/agents/new");
    }
  };

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center py-12 sm:py-20">
      <div className="w-full text-center space-y-6">
        <div className="relative mx-auto inline-flex items-center justify-center rounded-full px-3 py-1 text-xs sm:text-sm text-foreground isolate before:content-[''] before:absolute before:inset-0 before:rounded-full before:border before:border-foreground/50 before:[mask-image:linear-gradient(to_bottom,black,transparent)]">
          <span aria-hidden className="absolute inset-[2px] rounded-full bg-gradient-to-b from-foreground/10 to-transparent dark:from-white/10 dark:to-transparent" />
          <span aria-hidden className="absolute inset-[6px] rounded-full " />
          <span className="relative z-10 font-medium">Agent Studio</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
        Connect apps.
        </h1>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
        Orchestrate jobs.
        </h1>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
        Stay in control.
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
          Create, autonomous AI agents that work, while you dont!
        </p>
        <div className="mt-4 sm:mt-6 mx-auto w-full max-w-2xl">
          <PromptInput
            isLoading={false}
            value={text}
            onValueChange={setText}
            onSubmit={handleSubmit}
            className="border-input bg-popover relative z-10 w-full border p-0 pt-1 shadow-xs"
          >
            <div className="flex flex-col">
              <PromptInputTextarea
                placeholder="What do you want your agent to do?"
                className="min-h-[44px] pt-3 pl-4 text-base leading-[1.3] sm:text-base md:text-base"
              />
              <PromptInputActions className="mt-5 flex w-full items-center justify-between gap-2 px-3 pb-3">
                <div className="flex items-center gap-2">
                  <PromptInputAction tooltip="">
                    <span className="sr-only">Spacer</span>
                  </PromptInputAction>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={handleSubmit} className="px-4">
                    Create Agent
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </PromptInputActions>
            </div>
          </PromptInput>
        </div>

        {/* Capabilities note */}
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Remember: you have access to 800+ integrations with 5,000+ tools.
        </p>
        <IntegrationsSlider />
        <RisingIllustration />
        {/* Integrations marquee */}
      </div>
      
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 sm:h-56 lg:h-64 overflow-hidden z-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0) 100%)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 35%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0) 100%)",
          }}
        >


        </div>
        
      </div>
      
    </section>
  );
}

const INTEGRATIONS = [
  { id: "gmail", label: "Gmail", Icon: SiGmail },
  { id: "googlecalendar", label: "Google Calendar", Icon: SiGooglecalendar },
  { id: "googlesheets", label: "Google Sheets", Icon: SiGooglesheets },
  { id: "googledrive", label: "Google Drive", Icon: SiGoogledrive },
  { id: "github", label: "GitHub", Icon: SiGithub },
  { id: "gitlab", label: "GitLab", Icon: SiGitlab },
  { id: "slack", label: "Slack", Icon: SiSlack },
  { id: "notion", label: "Notion", Icon: SiNotion },
  { id: "linear", label: "Linear", Icon: SiLinear },
  { id: "jira", label: "Jira", Icon: SiJira },
  { id: "confluence", label: "Confluence", Icon: SiConfluence },
  { id: "trello", label: "Trello", Icon: SiTrello },
  { id: "airtable", label: "Airtable", Icon: SiAirtable },
  { id: "hubspot", label: "HubSpot", Icon: SiHubspot },
  { id: "stripe", label: "Stripe", Icon: SiStripe },
  { id: "shopify", label: "Shopify", Icon: SiShopify },
  { id: "discord", label: "Discord", Icon: SiDiscord },
  { id: "twilio", label: "Twilio", Icon: SiTwilio },
  { id: "dropbox", label: "Dropbox", Icon: SiDropbox },
  { id: "zendesk", label: "Zendesk", Icon: SiZendesk },
  { id: "asana", label: "Asana", Icon: SiAsana },
];

function IntegrationsSlider() {
  const gapPx = 26;
  const speedPxPerSec = 60;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const groupWidthRef = useRef(0);

  useEffect(() => {
    const measure = () => {
      if (groupRef.current) groupWidthRef.current = groupRef.current.offsetWidth + gapPx;
    };
    measure();
    window.addEventListener("resize", measure);
    let raf = 0;
    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      offsetRef.current -= speedPxPerSec * dt;
      const limit = groupWidthRef.current || 0;
      if (limit > 0 && -offsetRef.current >= limit) {
        offsetRef.current += limit;
      }
      const track = trackRef.current;
      if (track) track.style.transform = `translateX(${offsetRef.current}px)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const renderGroup = (ref?: React.Ref<HTMLDivElement>) => (
    <div ref={ref} className="flex items-center" style={{ gap: `${gapPx}px` }}>
      {INTEGRATIONS.map(({ id, label, Icon }) => (
        <div key={id} className="flex w-28 sm:w-32 items-center justify-center text-white">
          <Icon aria-label={label} className="h-6 w-6 sm:h-8 sm:w-8 " />
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-6 sm:mt-8 relative h-16 sm:h-20 w-full overflow-hidden">
      <div
        ref={trackRef}
        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center will-change-transform"
        style={{ gap: `${gapPx}px` }}
      >
        {renderGroup(groupRef)}
        {renderGroup()}
      </div>

      {/* Progressive blur/fade sides using layered mask + blur */}
      <ProgressiveBlur className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-32" direction="left" blurIntensity={1} />
      <ProgressiveBlur className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-32" direction="right" blurIntensity={1} />
    </div>
  );
}


