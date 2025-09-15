import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Section } from "@/shared/ui/section";
import RadarIllustration from "@/features/marketing/illustrations/radar";

interface FeatureIllustrationTopProps {
  title?: string;
  description?: string;
  visual?: ReactNode;
  className?: string;
}

export default function FeatureIllustrationTop({
  title = "You can change anything. But you don't have to.",
  description = "Get the full control of the code of your website. Change it or just use the defaults. Customize it in seconds with CSS variables.",
  visual = <RadarIllustration />,
  className,
}: FeatureIllustrationTopProps) {
  return (
    <Section className={cn("relative w-full overflow-hidden", className)}>
      <div className="relative">
        <div className="max-w-container mx-auto flex flex-col gap-8 sm:gap-24">
          <div className="overflow-visable w-full">{visual}</div>
          <div className="flex flex-col items-center gap-4 text-center sm:gap-8">
            <h1 className="from-foreground to-foreground dark:to-muted-foreground inline-block max-w-[920px] bg-linear-to-r bg-clip-text text-3xl font-semibold text-balance text-transparent drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight">
              {title}
            </h1>
            <p className="text-md text-muted-foreground max-w-[620px] font-medium text-balance sm:text-xl">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
