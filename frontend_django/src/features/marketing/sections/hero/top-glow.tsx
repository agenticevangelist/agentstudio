"use client";

import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Button, type ButtonProps } from "@/shared/ui/button";
import { Section } from "@/shared/ui/section";
import { Mockup } from "@/shared/ui/mockup";
import Glow from "@/shared/ui/glow";
import Github from "@/features/marketing/logos/github";
import Screenshot from "@/shared/ui/screenshot";

interface HeroButtonProps {
  href: string;
  text: string;
  variant?: ButtonProps["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface HeroProps {
  title?: string;
  description?: string;
  buttons?: HeroButtonProps[] | false;
  mockup?: ReactNode | false;
  showGlow?: boolean;
  className?: string;
}

export default function Hero({
  title = "Give your big idea the design it deserves",
  description = "Professionally designed blocks and templates built with React, Shadcn/ui and Tailwind that will help your product stand out.",
  buttons = [
    {
      href: "https://www.launchuicomponents.com/",
      text: "Get Started",
      variant: "default",
    },
    {
      href: "https://www.launchuicomponents.com/",
      text: "Github",

      icon: <Github className="mr-2 size-4" />,
    },
  ],
  mockup = (
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
  showGlow = true,
  className,
}: HeroProps) {
  return (
    <Section className={cn("relative w-full overflow-hidden", className)}>
      <div className="max-w-container relative mx-auto flex flex-col gap-12 sm:gap-24">
        <div className="relative z-10 flex flex-col items-center gap-6 pt-16 text-center sm:gap-12">
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground inline-block bg-linear-to-r bg-clip-text text-4xl leading-tight font-semibold text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight">
            {title}
          </h1>
          <p className="text-md animate-appear text-muted-foreground max-w-[550px] font-medium opacity-0 delay-100 sm:text-xl">
            {description}
          </p>
          {buttons !== false && buttons.length > 0 && (
            <div className="animate-appear relative z-10 flex justify-center gap-4 opacity-0 delay-300">
              {buttons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.variant || "default"}
                  size="lg"
                  asChild
                >
                  <a href={button.href}>
                    {button.icon}
                    {button.text}
                    {button.iconRight}
                  </a>
                </Button>
              ))}
            </div>
          )}
          {mockup !== false && (
            <div className="relative w-full pt-12">
              <div className="animate-appear w-full opacity-0 delay-700">
                {mockup}
              </div>
            </div>
          )}
        </div>
      </div>
      {showGlow && (
        <div className="absolute inset-0 overflow-hidden">
          <Glow
            variant="above"
            className="animate-appear-zoom opacity-0 delay-1000"
          />
        </div>
      )}
    </Section>
  );
}
