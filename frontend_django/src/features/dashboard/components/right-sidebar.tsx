"use client";

import * as React from "react";
import { SidebarOptInForm } from "@/features/dashboard/components/SidebarOptInForm";
import { GalleryVerticalEnd } from "lucide-react";
import { useAgentSidebar } from "@/features/dashboard/components/AgentSidebarContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
// import { Button } from "@/shared/ui/button";
import { MonthCommitsPanel } from "@/features/dashboard/components/MonthCommitsPanel";
import { LastJobsList } from "@/features/dashboard/components/LastJobsList";
import { DailyGreeting } from "@/features/dashboard/components/DailyGreeting";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/ui/sidebar";

// Right sidebar is context-driven. If no content is provided, we show a small placeholder.

export function RightAppSidebar() {
  // Read contextual content provided by pages (e.g., chat) via AgentSidebarProvider
  const { content } = useAgentSidebar();
  return (
    <Sidebar collapsible="icon" variant="sidebar" side="right">
      <SidebarHeader>

      </SidebarHeader>
      <SidebarContent>
        {/* Play a welcome greeting once per day */}
        <DailyGreeting />
        {/* Tabs: Activity (default) and Agent Settings */}
        <Tabs defaultValue="activity" className="w-full group-data-[collapsible=icon]:hidden">
          <TabsList className="grid grid-cols-2 mx-2">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Agent Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-2">
            <div className="px-2 space-y-3">
              <MonthCommitsPanel />
              <h3 className="text-xs font-semibold text-muted-foreground">Last Job Executions</h3>
              <LastJobsList />
              {/* Optional contextual content from provider */}
              {content ? <div className="pt-2">{content}</div> : null}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-2">
            <div className="px-2 space-y-2">
              <div className="text-xs text-muted-foreground">Agent settings (mock)</div>
              <div className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span>Model</span>
                  <span className="text-muted-foreground">gpt-4o-mini</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>Temperature</span>
                  <span className="text-muted-foreground">0.6</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>Tools</span>
                  <span className="text-muted-foreground">local + composio (mock)</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-1"><SidebarOptInForm /></div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

