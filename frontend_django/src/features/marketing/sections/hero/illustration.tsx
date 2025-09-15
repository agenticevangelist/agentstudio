import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/ui/button";
import { Section } from "@/shared/ui/section";
import { Input } from "@/shared/ui/input";
import RisingIllustration from "@/features/marketing/illustrations/rising-small";

interface HeroProps {
  title?: string;
  description?: string;
  form?: ReactNode | false;
  illustration?: ReactNode | false;
  className?: string;
}

export default function Hero({
  title = "Give your big idea the design it deserves",
  description = "Professionally designed blocks and templates built with React, Shadcn/ui and Tailwind that will help your product stand out.",
  form = (
    <>
      <form className="flex w-full max-w-[420px] gap-2">
        <Input
          type="email"
          placeholder="Email address"
          className="border-border/10 bg-foreground/10 grow"
        />
        <Button variant="default" size="lg" asChild>
          <a href="https://www.launchuicomponents.com/">Get Started</a>
        </Button>
      </form>
      <p className="text-muted-foreground text-xs">
        Free and open source forever.
      </p>
    </>
  ),
  className,
  illustration = <RisingIllustration />,
}: HeroProps) {
  return (
    <Section
      className={cn(
        "fade-bottom w-full overflow-hidden pb-0 sm:pb-0 md:pb-0",
        className,
      )}
    >
      <div className="max-w-container mx-auto flex flex-col gap-12 sm:gap-24">
        <div className="flex flex-col items-center gap-6 pt-16 text-center sm:gap-12">
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground inline-block bg-linear-to-r bg-clip-text text-4xl leading-tight font-semibold text-balance text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight">
            {title}
          </h1>
          <p className="text-md animate-appear text-muted-foreground max-w-[840px] font-medium text-balance opacity-0 delay-100 sm:text-xl">
            {description}
          </p>
          {form !== false && (
            <div className="animate-appear relative z-10 flex flex-col items-center justify-center gap-4 self-stretch opacity-0 delay-300">
              {form}
            </div>
          )}
          {illustration !== false && (
            <div className="relative w-full pt-12">{illustration}</div>
          )}
        </div>
      </div>
    </Section>
  );
}
