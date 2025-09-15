import { ReactNode } from "react";

import { Section } from "@/shared/ui/section";
import { Button, type ButtonProps } from "@/shared/ui/button";

interface CTAButtonProps {
  href: string;
  text: string;
  variant?: ButtonProps["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface CTAProps {
  title?: string;
  buttons?: CTAButtonProps[] | false;
  className?: string;
}

export default function CTA({
  title = "Title",
  buttons = [
    {
      href: "#",
      text: "Button",
      variant: "default",
    },
  ],
  className,
}: CTAProps) {
  return (
    <Section className={`relative overflow-hidden ${className || ""}`}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
        <h2 className="text-3xl font-semibold sm:text-5xl">{title}</h2>
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
    </Section>
  );
}
