import * as React from "react";
import { cn } from "@/shared/lib/utils";
import type { JSX } from "react";

import Glow from "@/shared/ui/glow";
import LaunchUI from "@/features/marketing/logos/launch-ui";
import TailwindLogo from "@/features/marketing/logos/tailwind";
import ReactLogo from "@/features/marketing/logos/react";
import TypeScriptLogo from "@/features/marketing/logos/typescript";
import ShadcnLogo from "@/features/marketing/logos/shadcn-ui";

function RadarSmallIllustration({ className }: { className?: string }) {
  const totalCircles = 4;
  const totalSegments = 12;

  const createCircles = (index: number = 0): JSX.Element | null => {
    const opacity = (50 * index) / totalCircles;

    if (index === totalCircles) return null;

    const decrementPerStep = 80 / totalCircles;
    const size = 80 - index * decrementPerStep; // Dynamically calculate size reduction

    return (
      <>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[100%] border p-4 opacity-40"
          style={{
            borderColor: `color-mix(in oklab, var(--brand) ${opacity + 50}%, transparent)`,
            boxShadow: `inset 0px 0px 128px color-mix(in oklab, var(--brand-foreground) ${opacity + 30}%, transparent)`,
            width: `${20 + size}%`,
            height: `${20 + size}%`,
          }}
        ></div>
        {createCircles(index + 1)}
      </>
    );
  };

  const createSegments = (index: number = 0): JSX.Element | null => {
    if (index === totalSegments) return null;

    return (
      <>
        <div
          className="bg-brand-foreground/10 absolute top-1/2 left-0 h-[1px] w-full"
          style={{
            transform: `rotate(${index * (360 / totalSegments)}deg)`,
          }}
        ></div>
        {createSegments(index + 1)}
      </>
    );
  };

  return (
    <div
      data-slot="radar-small-illustration"
      className={cn(
        "relative mb-8 flex h-full w-full items-end sm:mb-0",
        className,
      )}
    >
      <div className="relative flex aspect-1/1 h-full w-full items-end">
        <div className="relative aspect-1/1 h-full w-full p-6">
          {createSegments()}
          <div className="dark:border-background relative h-full w-full rounded-full">
            {createCircles()}
            <div
              className="group-hover:animate-spin-slow absolute inset-[0] h-full w-full rounded-full opacity-0 group-hover:opacity-40"
              style={{
                background:
                  "conic-gradient(transparent, transparent, transparent, transparent, var(--brand-foreground))",
              }}
            ></div>
          </div>
        </div>
        <div className="bg-brand absolute top-[20%] right-[20%] size-7 rounded-full opacity-40 shadow-[0_0_12px_4px_var(--brand-foreground)] group-hover:animate-ping group-hover:opacity-100 dark:opacity-50" />
        <div className="absolute top-[20%] right-[20%] flex size-7 items-center justify-center rounded-full bg-white/90 dark:bg-white/10">
          <ReactLogo className="size-4" />
        </div>
        <div className="bg-brand absolute top-[20%] left-[20%] size-7 rounded-full opacity-40 shadow-[0_0_12px_4px_var(--brand-foreground)] group-hover:animate-ping group-hover:opacity-100 dark:opacity-50" />
        <div className="absolute top-[20%] left-[20%] flex size-7 items-center justify-center rounded-full bg-white/90 dark:bg-white/10">
          <TailwindLogo className="size-4" />
        </div>
        <div className="bg-brand absolute bottom-[20%] left-[30%] size-7 rounded-full opacity-40 shadow-[0_0_12px_4px_var(--brand-foreground)] group-hover:animate-ping group-hover:opacity-100 dark:opacity-50" />
        <div className="absolute bottom-[20%] left-[30%] flex size-7 items-center justify-center rounded-full bg-white/90 dark:bg-white/10">
          <TypeScriptLogo className="size-4" />
        </div>
        <div className="bg-brand absolute right-[25%] bottom-[40%] size-7 rounded-full opacity-40 shadow-[0_0_12px_4px_var(--brand-foreground)] group-hover:animate-ping group-hover:opacity-100 dark:opacity-50" />
        <div className="absolute right-[25%] bottom-[40%] flex size-7 items-center justify-center rounded-full bg-white/90 dark:bg-white/10">
          <ShadcnLogo className="size-4" />
        </div>
        <Glow
          variant="center"
          className="opacity-20 transition-all duration-300 group-hover:opacity-30"
        />
      </div>
      <div className="glass-5 border-brand/30 dark:border-brand/20 absolute top-1/2 left-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full p-2.5 shadow-md backdrop-blur-md">
        <LaunchUI className="size-10" />
      </div>
    </div>
  );
}

export default RadarSmallIllustration;
