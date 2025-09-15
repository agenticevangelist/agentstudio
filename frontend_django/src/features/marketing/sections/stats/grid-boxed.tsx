import { cn } from "@/shared/lib/utils";

import { Section } from "@/shared/ui/section";

interface StatItemProps {
  label?: string;
  value: string | number;
  suffix?: string;
  description?: string;
}

interface StatsProps {
  title?: string;
  description?: string;
  items?: StatItemProps[] | false;
  className?: string;
}

export default function StatsGridBoxed({
  title = "A proven solution for good design",
  description = "Thousands of designers and developers have already used Launch UI to create beautiful and functional websites and products.",
  items = [
    {
      label: "used by",
      value:
        Math.round(
          (1000 +
            1000 +
            1000) /
            100,
        ) / 10,
      suffix: "k",
      description: "designers and developers",
    },
    {
      label: "used by",
      value: Math.round(1000 / 100) / 10,
      suffix: "k",
      description: "designers on Figma Community",
    },
    {
      label: "over",
      value: 1000,
      description: "clones and forks of the template on Github",
    },
    {
      label: "already",
      value: Math.round(1000 / 100) / 10,
      suffix: "k",
      description: "installations with shadcn/ui CLI",
    },
  ],
  className,
}: StatsProps) {
  return (
    <Section className={cn("w-full overflow-hidden", className)}>
      <div className="max-w-container mx-auto flex flex-col gap-8 md:flex-row md:gap-20">
        <div className="flex flex-col gap-8">
          <h2 className="max-w-[500px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
            {title}
          </h2>
          <p className="text-md text-muted-foreground max-w-[540px] font-medium text-pretty sm:text-xl">
            {description}
          </p>
        </div>
        {items !== false && items.length > 0 && (
          <div className="grid grid-cols-2 gap-4 md:p-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="glass-2 flex flex-col items-start gap-3 rounded-xl p-4 text-left shadow-xl md:px-8 md:py-6 lg:px-12 lg:py-8"
              >
                {item.label && (
                  <div className="text-muted-foreground text-sm font-semibold">
                    {item.label}
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <div className="from-foreground to-foreground dark:to-brand bg-linear-to-r bg-clip-text text-4xl font-medium text-transparent drop-shadow-[2px_1px_24px_var(--brand-foreground)] transition-all duration-300 sm:text-5xl lg:text-6xl">
                    {item.value}
                  </div>
                  {item.suffix && (
                    <div className="text-brand text-2xl font-semibold">
                      {item.suffix}
                    </div>
                  )}
                </div>
                {item.description && (
                  <div className="text-muted-foreground text-sm font-semibold text-pretty">
                    {item.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
