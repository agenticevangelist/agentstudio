import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Section } from "@/shared/ui/section";
import RisingIllustration from "@/features/marketing/illustrations/rising-large";

interface FeatureIllustrationBottomProps {
  title?: string;
  description?: string;
  visual?: ReactNode;
  className?: string;
}

export default function FeatureIllustrationBottom({
  title = "You can change anything. But you don't have to.",
  description = "Get the full control of the code of your website. Change it or just use the defaults. Customize it in seconds with CSS variables.",
  visual = <RisingIllustration />,
  className,
}: FeatureIllustrationBottomProps) {
  return (
    <Section
      className={cn(
        "fade-bottom relative mb-12 w-full overflow-hidden pb-0 sm:mb-24 sm:pb-0 md:mb-32 md:pb-0",
        className,
      )}
    >
      <div className="relative">
        <div className="max-w-container mx-auto flex flex-col gap-8 sm:gap-24">
          <div className="flex flex-col items-center gap-4 text-center sm:gap-12">
            <h1 className="from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block max-w-[920px] bg-linear-to-r bg-clip-text text-3xl font-semibold text-balance text-transparent drop-shadow-2xl sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight">
              {title}
            </h1>
            <p className="text-md text-muted-foreground relative z-10 max-w-[620px] font-medium text-balance sm:text-xl">
              {description}
            </p>
          </div>
          <div className="w-full">{visual}</div>
        </div>
      </div>
    </Section>
  );
}
