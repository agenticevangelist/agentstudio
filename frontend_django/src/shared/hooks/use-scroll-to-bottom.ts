"use client";

import * as React from "react";

type ScrollFlag = ScrollBehavior | false;

export function useScrollToBottom() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);

  const [isAtBottom, setIsAtBottom] = React.useState(false);
  const [scrollFlag, setScrollFlag] = React.useState<ScrollFlag>(false);

  // Execute pending scroll requests by scrolling the container itself
  React.useEffect(() => {
    if (scrollFlag) {
      const el = containerRef.current;
      if (el) {
        try {
          el.scrollTo({ top: el.scrollHeight, behavior: scrollFlag });
        } catch {
          // Fallback without smooth behavior
          el.scrollTop = el.scrollHeight;
        }
      }
      setScrollFlag(false);
    }
  }, [scrollFlag]);

  // Track whether the user is at the bottom
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = () => {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      setIsAtBottom(nearBottom);
    };
    handle();
    el.addEventListener("scroll", handle, { passive: true });
    return () => el.removeEventListener("scroll", handle);
  }, [containerRef]);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    setScrollFlag(behavior);
  }, []);

  return { containerRef, endRef, isAtBottom, scrollToBottom } as const;
}


