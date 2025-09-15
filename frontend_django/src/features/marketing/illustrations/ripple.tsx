import * as React from "react";
import LaunchUI from "@/features/marketing/logos/launch-ui";
import { Beam } from "@/shared/ui/beam";
import Glow from "@/shared/ui/glow";

function RippleIllustration() {
  const totalCircles = 12;

  const generateNestedCircles = (index: number = 0): React.ReactNode => {
    if (index === totalCircles) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-full">
          <div className="from-brand-foreground/5 to-brand-foreground/20 dark:from-brand-foreground/20 dark:to-brand-foreground/0 flex h-full w-full rounded-full bg-linear-to-b p-2">
            <div className="glass-5 border-brand-foreground/40 dark:border-border/10 flex h-full w-full items-center justify-center rounded-full p-2.5 shadow-md">
              <Beam tone="brand">
                <div className="relative z-10">
                  <LaunchUI className="text-foreground size-16" />
                </div>
              </Beam>
            </div>
          </div>
        </div>
      );
    }

    const opacity = (0.5 * index) / totalCircles;

    return (
      <div
        className="relative flex h-full w-full items-center justify-center rounded-full border p-2 transition-all duration-1000 ease-in-out group-hover:scale-[1.01]"
        style={{
          borderColor: `color-mix(in oklab, var(--primary) ${opacity * 100}%, transparent)`,
        }}
      >
        {generateNestedCircles(index + 1)}
      </div>
    );
  };

  return (
    <div
      data-slot="ripple-illustration"
      className="relative h-[386px] w-[386px]"
    >
      <div className="relative z-10 h-full w-full">
        {generateNestedCircles()}
      </div>
      <Glow
        variant="center"
        className="opacity-30 transition-all duration-300 group-hover:opacity-40"
      />
    </div>
  );
}

export default RippleIllustration;
