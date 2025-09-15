import { Nfc, Bot, Clapperboard } from "lucide-react";
import * as React from "react";
import LaunchUI from "@/features/marketing/logos/launch-ui";
import { Beam } from "@/shared/ui/beam";
import Glow from "@/shared/ui/glow";

function PipelineIllustration() {
  return (
    <div
      data-slot="pipeline-illustration"
      className="relative flex w-full flex-col gap-4 p-4 text-xs"
    >
      <div className="flex items-center justify-around">
        <div className="border-border dark:border-border/5 dark:inset-shadow-lg inset-shadow-brand/10 flex items-center justify-center rounded-full border p-2 lg:p-3">
          <div className="border-border dark:border-border/15 dark:inset-shadow-lg inset-shadow-brand/20 flex items-center justify-center rounded-full border p-2 lg:p-3">
            <div className="glass-4 relative z-10 flex size-8 items-center justify-center rounded-full shadow-md backdrop-blur-lg transition-all duration-1000 ease-in-out group-hover:scale-95 sm:size-12 lg:size-16">
              <Nfc className="size-6 stroke-1 sm:size-8" />
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="border-border dark:border-border/5 dark:inset-shadow-lg inset-shadow-brand/10 flex items-center justify-center rounded-full border p-3 lg:p-4">
            <div className="border-border dark:border-border/15 dark:inset-shadow-lg inset-shadow-brand/20 flex items-center justify-center rounded-full border p-3 lg:p-4">
              <div className="glass-4 relative z-10 flex size-12 items-center justify-center rounded-full shadow-md backdrop-blur-lg transition-all duration-1000 ease-in-out group-hover:scale-105 sm:size-20 lg:size-24">
                <Beam tone="brandLight">
                  <div className="relative z-10">
                    <Bot className="size-6 sm:size-8" />
                  </div>
                </Beam>
              </div>
            </div>
          </div>
          <div className="from-brand-foreground/30 dark:from-brand-foreground/70 via-brand-foreground/10 to-brand-foreground/0 absolute top-[50%] left-0 size-24 -translate-y-12 rounded-full bg-radial from-20% via-50% to-80%" />
          <div className="absolute top-[50%] left-5 z-1 size-8 -translate-y-4 rounded-full bg-radial from-white/50 from-20% to-white/0 to-60% lg:left-6" />
          <div className="from-brand-foreground/30 dark:from-brand-foreground/70 via-brand-foreground/10 to-brand-foreground/0 absolute top-[50%] right-0 size-24 -translate-y-12 rounded-full bg-radial from-20% via-50% to-80%" />
          <div className="absolute top-[50%] right-5 z-1 size-8 -translate-y-4 rounded-full bg-radial from-white/50 from-20% to-white/0 to-60% lg:right-6" />
        </div>
        <div className="border-border dark:border-border/5 dark:inset-shadow-lg inset-shadow-brand/10 flex items-center justify-center rounded-full border p-2 lg:p-3">
          <div className="border-border dark:border-border/15 dark:inset-shadow-lg inset-shadow-brand/20 flex items-center justify-center rounded-full border p-2 lg:p-3">
            <div className="glass-4 relative z-10 flex size-8 items-center justify-center rounded-full shadow-md backdrop-blur-lg transition-all duration-1000 ease-in-out group-hover:scale-95 sm:size-12 lg:size-16">
              <Clapperboard className="size-6 stroke-1 sm:size-8" />
            </div>
          </div>
        </div>
        <div className="group-hover:animate-impulse absolute top-[50%] left-0 opacity-0">
          <div className="from-brand-foreground/50 via-brand-foreground/10 to-brand-foreground/0 absolute top-[50%] -left-12 size-24 -translate-y-12 rounded-full bg-radial from-20% via-50% to-80%" />
          <div className="absolute top-[50%] -left-4 z-1 size-8 -translate-y-4 rounded-full bg-radial from-white/70 from-20% to-white/0 to-60%" />
        </div>
      </div>
      <Glow
        variant="center"
        className="opacity-20 transition-all duration-300 group-hover:opacity-30"
      />
      <div className="via-foreground/10 dark:via-border/30 absolute top-[calc(50%-1px)] left-0 h-0.5 w-full bg-linear-to-r from-transparent to-transparent"></div>
    </div>
  );
}

export default PipelineIllustration;
