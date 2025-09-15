import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Section } from "@/shared/ui/section";
import { Button } from "@/shared/ui/button";
import Glow from "@/shared/ui/glow";
import { Input } from "@/shared/ui/input";

interface CTAProps {
  title?: string;
  description?: string;
  form?: ReactNode | false;
  showGlow?: boolean;
  className?: string;
}

export default function CTA({
  title = "Start building",
  description = "Get started with Launch UI and build your landing page in no time",
  form = (
    <>
      <form className="flex w-full max-w-[420px] gap-2">
        <Input
          type="email"
          placeholder="Email address"
          className="border-border/10 bg-foreground/10 grow"
        />
        <Button variant="default" size="lg" asChild>
          <a href="#">Get Started</a>
        </Button>
      </form>
      <p className="text-muted-foreground text-xs">
        14-days trials. No credit card required.
      </p>
    </>
  ),
  showGlow = true,
  className,
}: CTAProps) {
  return (
    <Section className={cn("relative w-full overflow-hidden", className)}>
      <div className="max-w-container relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-10">
        <h2 className="text-3xl font-semibold sm:text-5xl">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
        {form !== false && (
          <div className="relative z-1 flex flex-col items-center gap-4 self-stretch">
            {form}
          </div>
        )}
        {showGlow && (
          <Glow
            variant="center"
            className="scale-y-[50%] opacity-60 sm:scale-y-[35%] md:scale-y-[45%]"
          />
        )}
      </div>
    </Section>
  );
}
