"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, MessageSquare, Plus, GalleryVerticalEnd, Inbox } from "lucide-react";
import Logo from "@/shared/components/Logo";
import { NavMain } from "@/shared/components/navigation/nav-main";
import { NavChatHistory } from "@/features/chat/components/NavChatHistory";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
} from "@/shared/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Main",
      url: "#",
      items: [
        { title: "Chat", url: "/workspace/chat", icon: MessageSquare },
        { title: "Agents", url: "/workspace/agents", icon: Bot },
        { title: "Create Agent", url: "/workspace/agents/new", icon: Plus },
        { title: "Inbox", url: "/workspace/inbox", icon: Inbox },
      ],
    },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
                  {/* Wrapped to avoid sidebar button's [&>svg]:size-4 rule */}
                  <Logo className="size-7" />
                </div>

                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Agent Studio</span>
                  <span className="">v0.1.0 Alpha</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavChatHistory />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}


