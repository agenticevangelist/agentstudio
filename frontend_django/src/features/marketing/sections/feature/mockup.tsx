import { cn } from "@/shared/lib/utils";
import { ReactNode } from "react";

import Glow from "@/shared/ui/glow";
import { Mockup } from "@/shared/ui/mockup";
import { Section } from "@/shared/ui/section";
import Screenshot from "@/shared/ui/screenshot";

interface FeatureMockupProps {
  title?: string;
  description?: string;
  visual?: ReactNode;
  className?: string;
}

export default function FeatureMockup({
  title = "You can change anything. But you don't have to.",
  description = "Get the full control of the code of your website. Change it or just use the defaults. Customize it in seconds with CSS variables.",
  visual = (
    <Mockup>
      <Screenshot
        srcLight="/app-light.png"
        srcDark="/app-dark.png"
        alt="Launch UI app screenshot"
        width={1248}
        height={765}
      />
    </Mockup>
  ),
  className,
}: FeatureMockupProps) {
  return (
    <Section
      className={cn(
        "fade-bottom relative w-full overflow-hidden pb-0 sm:pb-0 md:pb-0",
        className,
      )}
    >
      <div className="relative">
        <div className="max-w-container mx-auto flex flex-col items-center gap-8 sm:gap-24">
          <div className="flex flex-col items-center gap-4 text-center sm:gap-8">
            <h1 className="from-foreground to-foreground dark:to-muted-foreground inline-block max-w-[920px] bg-linear-to-r bg-clip-text text-3xl font-semibold text-balance text-transparent drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight">
              {title}
            </h1>
            <p className="text-md text-muted-foreground max-w-[620px] font-medium text-balance sm:text-xl">
              {description}
            </p>
          </div>
          <div className="relative w-full">
            {visual}
            <Glow variant="top" />
          </div>
        </div>
      </div>
    </Section>
  );
}
