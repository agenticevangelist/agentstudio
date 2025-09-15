import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Button, type ButtonProps } from "@/shared/ui/button";
import { Section } from "@/shared/ui/section";

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
  className?: string;
}

export default function Hero({
  title = "Title",
  description = "Description",
  buttons = [
    {
      href: "#",
      text: "Primary button",
      variant: "default",
    },
    {
      href: "#",
      text: "Secondary button",
      variant: "outline",
    },
  ],
  className,
}: HeroProps) {
  return (
    <Section
      className={cn("w-full overflow-hidden pb-0 sm:pb-0 md:pb-0", className)}
    >
      <div className="max-w-container mx-auto flex flex-col gap-12 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          <h1 className="text-4xl font-semibold sm:text-6xl md:text-8xl">
            {title}
          </h1>
          <p className="text-md text-muted-foreground max-w-[550px] font-medium sm:text-xl">
            {description}
          </p>
          {buttons !== false && buttons.length > 0 && (
            <div className="flex justify-center gap-4">
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
        </div>
      </div>
    </Section>
  );
}
