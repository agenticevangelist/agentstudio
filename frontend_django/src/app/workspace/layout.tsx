"use client"

import { AppSidebar } from "@/features/dashboard/components/sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/shared/ui/sidebar";
import { HeaderBreadcrumbs } from "@/features/dashboard/components/HeaderBreadcrumbs";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* Left Main Sidebar */}
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <div className="flex z-9999 absolute  w-full bg-card/90 backdrop-blur-md items-center gap-2 border-b px-4 py-2">
          <SidebarTrigger />
          <HeaderBreadcrumbs />
          <div className="ml-auto flex items-center gap-1" />
        </div>

        {/* Main content */}
        <div className="flex-1 min-h-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

