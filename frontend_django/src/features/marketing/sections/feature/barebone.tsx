import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Section } from "@/shared/ui/section";

interface FeatureProps {
  title?: string;
  description?: string;
  visual?: ReactNode;
  className?: string;
}

export default function Feature({
  title = "Title",
  description = "Description",
  visual = null,
  className,
}: FeatureProps) {
  return (
    <Section
      className={cn("fade-bottom relative pb-0 sm:pb-0 md:pb-0", className)}
    >
      <div className="relative">
        <div className="max-w-container mx-auto flex flex-col gap-8 sm:gap-24">
          <div className="flex flex-col items-center gap-4 text-center sm:gap-8">
            <h1 className="from-foreground to-foreground dark:to-muted-foreground inline-block max-w-[840px] bg-linear-to-r bg-clip-text text-3xl font-semibold text-transparent drop-shadow-2xl sm:text-7xl sm:leading-tight">
              {title}
            </h1>
            <p className="text-md text-muted-foreground max-w-[600px] font-medium sm:text-xl">
              {description}
            </p>
          </div>
          <div className="w-full">{visual}</div>
        </div>
      </div>
    </Section>
  );
}
