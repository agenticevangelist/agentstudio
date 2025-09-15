"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InboxList } from "@/features/inbox/components/InboxList";
import { InboxDetail } from "@/features/inbox/components/InboxDetail";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "@/features/inbox/constants";
import { type InboxItem } from "@/shared/lib/inbox";
import { SidebarInput } from "@/shared/ui/sidebar";

export function InboxDoubleSidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [selected, setSelected] = React.useState<InboxItem | null>(null);

  const threadId = searchParams?.get(VIEW_STATE_THREAD_QUERY_PARAM) || null;

  const onSelect = React.useCallback((it: InboxItem) => {
    setSelected(it);
    const sp = new URLSearchParams(searchParams?.toString() || "");
    sp.set(VIEW_STATE_THREAD_QUERY_PARAM, it.id);
    router.push(`${pathname}?${sp.toString()}`);
  }, [searchParams, router, pathname]);

  React.useEffect(() => {
    if (!threadId) setSelected(null);
  }, [threadId]);

  return (
    <div className="flex h-full w-full pt-11 overflow-hidden">
      {/* Secondary inbox panel (acts as the second sidebar within the main layout) */}
      <div className="hidden md:flex flex-[0_0_22rem] shrink-0 border-r flex-col min-h-0">
        <div className="gap-2 border-b p-3">
          <div>
            <SidebarInput placeholder="Search..." />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          <InboxList onSelect={onSelect} />
        </div>
      </div>

      {/* Main content area for thread detail */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {threadId ? (
          <div className="h-full overflow-hidden">
            <InboxDetail
              item={selected}
              onResolved={() => {
                const sp = new URLSearchParams(searchParams?.toString() || "");
                sp.delete(VIEW_STATE_THREAD_QUERY_PARAM);
                router.push(`${pathname}?${sp.toString()}`);
              }}
            />
          </div>
        ) : (
          <div className="h-full pt-12 overflow-y-auto">
            <div className="p-6 text-sm text-muted-foreground">Select a conversation from the list.</div>
          </div>
        )}
      </div>
    </div>
  );
}


