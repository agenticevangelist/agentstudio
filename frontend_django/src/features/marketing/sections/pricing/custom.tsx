import { cn } from "@/shared/lib/utils";
import { Section } from "@/shared/ui/section";
import { PricingColumn, PricingColumnProps } from "@/shared/ui/pricing-column";
import Glow from "@/shared/ui/glow"; // import the glow component

interface PricingProps {
  title?: string | false;
  description?: string | false;
  plans?: PricingColumnProps[] | false;
  className?: string;
}

export default function Pricing({
  title = "Build your dream landing page, today.",
  description = "Simple, transparent pricing for everyone.",
  plans = [
    {
      name: "Free",
      description: "Perfect for starting out",
      price: 0,
      priceNote: "",
      features: [],
      cta: { variant: "outline", label: "Get started", href: "/docs/getting-started/introduction" },

      className: "",
    },
    {
      name: "Pro",
      description: "For early-stage founders",
      price: 99,
      priceNote: "",
      features: [],
      cta: { variant: "outline", label: "Get all-access", href: "https://www.launchuicomponents.com/" },
      variant: "glow-brand",
      className: "",
    },
    {
      name: "Pro Team",
      description: "For teams and agencies",
      price: 499,
      priceNote: "",
      features: [],
      cta: { variant: "outline", label: "Get all-access for team", href: "https://www.launchuicomponents.com/" },

      className: "",
    },
  ],
  className = "",
}: PricingProps) {
  return (
    <Section className={cn(className, "relative overflow-hidden")}>
      {/* Glow behind the pricing cards */}
      <Glow variant="center" className="absolute top-2/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] opacity-20" />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 relative z-10">
        {(title || description) && (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            {title && (
              <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground max-w-[600px] sm:text-md">
                {description}
              </p>
            )}
          </div>
        )}

        {plans !== false && plans.length > 0 && (
          <div className="max-w-container mx-auto grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PricingColumn
                key={plan.name}
                name={plan.name}
                description={plan.description}
                price={plan.price}
                priceNote={plan.priceNote || ""}
                features={plan.features || []}
                cta={plan.cta}
                variant={plan.variant}
                className={plan.className}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
