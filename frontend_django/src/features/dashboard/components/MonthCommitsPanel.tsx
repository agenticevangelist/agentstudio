"use client";

import * as React from "react";
import { Pin } from "lucide-react";
import { CommitsGrid } from "@/features/dashboard/components/commits-grid";
import { createWheelSound } from "@/shared/lib/audio/wheelSound";

export function MonthCommitsPanel() {
  // Create a large window of months to emulate infinity, centered so index BASE is current month (offset 0)
  const BASE = 300;
  const RANGE = 600; // ~50 years both directions
  const months = React.useMemo(() => Array.from({ length: RANGE }, (_, i) => i - BASE), []); // -BASE..(RANGE-BASE-1)
  const [selectedIdx, setSelectedIdx] = React.useState(BASE); // default to 0-offset in the middle
  const offset = months[selectedIdx];

  // Horizontal scroller refs/measurements
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const itemRef = React.useRef<HTMLDivElement | null>(null);
  const scrollEndTimer = React.useRef<number | null>(null);
  const isSnappingRef = React.useRef<boolean>(false);
  const EDGE_FADE_PX = 24; // should match mask stops
  const PEEK_TOTAL = 64; // total space to reveal neighbors
  const itemsRef = React.useRef<Array<HTMLDivElement | null>>([]);
  const [isVisible, setIsVisible] = React.useState(true);
  // For speed-aware sound cadence
  const lastScrollLeftRef = React.useRef<number>(0);
  const lastScrollAtRef = React.useRef<number>(0);
  const lastSoundIdxRef = React.useRef<number | null>(null);
  const lastSoundAtRef = React.useRef<number>(0);
  // Drag-to-scroll disabled per UX: scroller acts neutral
  // Unified volume control for wheel sound (0.0 - 1.0)
  const WHEEL_VOLUME = 0.05;
  const SOUND_ENABLED = true;

  // Unified sound object
  const wheelSoundRef = React.useRef<ReturnType<typeof createWheelSound> | null>(null);
  React.useEffect(() => {
    wheelSoundRef.current = createWheelSound({ src: "/audio/wheel.mp3", volume: WHEEL_VOLUME, enabled: SOUND_ENABLED });
    return () => {
      wheelSoundRef.current?.dispose();
      wheelSoundRef.current = null;
    };
  }, []);

  const playWheel = React.useCallback(() => {
    if (!SOUND_ENABLED) return;
    const snd = wheelSoundRef.current;
    if (!snd) return;
    snd.setVolume(WHEEL_VOLUME);
    snd.play();
  }, [SOUND_ENABLED, WHEEL_VOLUME]);

  const scrollToIndex = React.useCallback((i: number, smooth = true) => {
    const el = scrollerRef.current;
    const child = itemsRef.current[i] ?? null;
    if (!el || !child) return;
    const rect = child.getBoundingClientRect();
    const left = (child as HTMLDivElement).offsetLeft;
    const width = rect.width;
    const target = left + width / 2 - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: smooth ? "smooth" : "auto" });
  }, []);

  const goToToday = React.useCallback(() => {
    const idx = BASE; // offset 0 is centered at BASE
    setSelectedIdx(idx);
    playWheel();
    isSnappingRef.current = true;
    scrollToIndex(idx, true);
    window.setTimeout(() => (isSnappingRef.current = false), 120);
  }, [BASE, playWheel, scrollToIndex]);

  // Drag handlers removed

  // Restore persisted month offset on mount; then snap
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("month_scroller_offset");
      if (raw != null) {
        const val = parseInt(raw, 10);
        if (!Number.isNaN(val)) {
          const idx = BASE + val;
          if (idx >= 0 && idx < months.length) {
            setSelectedIdx(idx);
            setTimeout(() => scrollToIndex(idx, false), 0);
            return;
          }
        }
      }
    } catch {}
    scrollToIndex(selectedIdx, false);
  }, [months.length, scrollToIndex]);

  // Persist selected month offset whenever it changes
  React.useEffect(() => {
    try {
      const off = months[selectedIdx];
      localStorage.setItem("month_scroller_offset", String(off));
    } catch {}
  }, [months, selectedIdx]);

  // Visibility observer to avoid handling scroll while hidden
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          scrollToIndex(selectedIdx, false);
        }
      },
      { root: null, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scrollToIndex, selectedIdx]);

  // Resize observer to recenter on layout changes (e.g., sidebar collapse/expand)
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new (window as any).ResizeObserver(() => scrollToIndex(selectedIdx, false));
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollToIndex, selectedIdx]);

  // Debounced snapping and speed-aware mid-scroll ticks
  const onScroll = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !isVisible) return;
    if (isSnappingRef.current) return;

    const now = performance.now();
    const dx = Math.abs(el.scrollLeft - lastScrollLeftRef.current);
    const dt = Math.max(1, now - lastScrollAtRef.current);
    lastScrollLeftRef.current = el.scrollLeft;
    lastScrollAtRef.current = now;

    // Velocity-based cadence: faster scrolls allow more frequent sounds
    const v = dx / dt; // px/ms
    const minInterval = (() => {
      if (v > 1.2) return 30;
      if (v > 0.6) return 60;
      return 90;
    })();

    // Determine nearest index to center now
    const containerCenter = el.scrollLeft + el.clientWidth / 2;
    let nearest = selectedIdx;
    let best = Infinity;
    for (let i = 0; i < itemsRef.current.length; i++) {
      const child = itemsRef.current[i];
      if (!child) continue;
      const left = (child as HTMLDivElement).offsetLeft;
      const rect = child.getBoundingClientRect();
      const center = left + rect.width / 2;
      const d = Math.abs(center - containerCenter);
      if (d < best) {
        best = d;
        nearest = i;
      }
    }

    // Play mid-scroll tick when crossing into a new nearest, rate-limited by speed
    if (
      nearest !== lastSoundIdxRef.current &&
      now - lastSoundAtRef.current > minInterval
    ) {
      playWheel();
      lastSoundIdxRef.current = nearest;
      lastSoundAtRef.current = now;
    }

    window.clearTimeout(scrollEndTimer.current ?? undefined);
    scrollEndTimer.current = window.setTimeout(() => {
      // On settle, snap to the current nearest and play stick click if changed
      if (nearest !== selectedIdx) {
        setSelectedIdx(nearest);
        playWheel();
      }
      isSnappingRef.current = true;
      // Slight animation when sticking to nearest after scroll
      scrollToIndex(nearest, true);
      // brief mute of onScroll caused by programmatic snap
      window.setTimeout(() => {
        isSnappingRef.current = false;
      }, minInterval);
    }, 80);
  }, [isVisible, playWheel, scrollToIndex, selectedIdx]);

  // Click -> snap immediately
  const onClickItem = React.useCallback(
    (i: number) => {
      setSelectedIdx(i);
      playWheel();
      isSnappingRef.current = true;
      // Slight animation on click snapping
      scrollToIndex(i, true);
      window.setTimeout(() => (isSnappingRef.current = false), 80);
    },
    [playWheel, scrollToIndex]
  );

  // Rebase when near edges
  React.useEffect(() => {
    const threshold = 50;
    if (selectedIdx < threshold || selectedIdx > months.length - threshold) {
      const currentOffset = months[selectedIdx];
      const newIdx = BASE + currentOffset;
      setSelectedIdx(newIdx);
      setTimeout(() => scrollToIndex(newIdx, false), 0);
    }
  }, [months, selectedIdx, scrollToIndex]);

  // Render
  const target = new Date();
  target.setMonth(target.getMonth() + offset);
  const monthName = target.toLocaleString("default", { month: "short" });
  const year = target.getFullYear();

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-center px-1">
        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={goToToday}
            aria-label="Go to current month"
            className="p-0.5 rounded hover:bg-muted/30 text-muted-foreground cursor-pointer active:scale-95 transition-transform"
          >
            <Pin className="w-3 h-3" strokeWidth={2} />
          </button>
          <span>Showing {monthName} {year}</span>
        </div>
      </div>

      {/* Horizontal scroller at 50% width, centered */}
      <div className=" mx-auto self-center">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="h-[40px] relative overflow-x-auto overflow-y-hidden no-scrollbar select-none"
          style={{ maskImage: `linear-gradient(to right, transparent ${EDGE_FADE_PX}px, black ${EDGE_FADE_PX}px, black calc(100% - ${EDGE_FADE_PX}px), transparent calc(100% - ${EDGE_FADE_PX}px))` }}
        >
          <div ref={itemRef} className="h-0" />
          <div className="flex items-center select-none gap-8 py-1">
            {months.map((m, i) => (
              <div
                key={i}
                ref={(el) => {
                  itemsRef.current[i] = el;
                }}
                className={`text-[10px] leading-3 text-center px-0 ${i === selectedIdx ? "font-medium" : "opacity-70"}`}
                style={{
                  paddingLeft: i === 0 ? `${PEEK_TOTAL / 2}px` : undefined,
                  paddingRight: i === months.length - 1 ? `${PEEK_TOTAL / 2}px` : undefined,
                }}
              >
                {labelForMonthOffset(m)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commits grid seeded by selected month */}
      {(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + offset);
        const seed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return <CommitsGrid cols={10} rows={3} seed={seed} />;
      })()}
    </div>
  );
}

function labelForMonthOffset(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const m = d.toLocaleString("default", { month: "short" });
  return `${m}`;
}
