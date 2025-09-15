import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Section } from "@/shared/ui/section";
import { Button, type ButtonProps } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";

interface CTAButtonProps {
  href: string;
  text: string;
  variant?: ButtonProps["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface CTAProps {
  badgeText?: string;
  title?: string;
  description?: string;
  buttons?: CTAButtonProps[] | false;
  className?: string;
}

export default function CTA({
  badgeText = "You dont have a job, your agent does",
  title = "Easiest way to build AI agents",
  description = "What are you waiting for? Time to build your first agent!",
  buttons = [
    {
      href: "/signup",
      text: "Get Started",
      variant: "default",
    },

  ],
  className,
}: CTAProps) {
  return (
    <Section className={cn("w-full overflow-hidden pt-0 md:pt-0", className)}>
      <div className="max-w-container relative mx-auto flex flex-col items-center gap-6 px-8 py-12 text-center sm:gap-8 md:py-24">
        <Badge variant="outline">
          <span className="text-muted-foreground">{badgeText}</span>
        </Badge>
        <h2 className="text-3xl font-semibold sm:text-5xl">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
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
        <div className="fade-top-lg pointer-events-none absolute inset-0 rounded-2xl shadow-[0_-16px_128px_0_var(--brand-foreground)_inset,0_-16px_32px_0_var(--brand)_inset]"></div>
      </div>
    </Section>
  );
}
