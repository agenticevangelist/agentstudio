import { cn } from "@/shared/lib/utils";
import { Button } from "./button";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

// Pricing panel styling
const pricingColumnVariants = cva(
  "max-w-container relative flex flex-col gap-4 overflow-hidden rounded-2xl p-6 shadow-md",
  {
    variants: {
      variant: {
        default: "glass-1 to-transparent dark:glass-2",
        glow: "glass-2 to-transparent dark:glass-3",
        "glow-brand": "glass-3 from-card/100 to-card/100 dark:glass-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface PricingColumnProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pricingColumnVariants> {
  name: string;
  description: string;
  price: number;
  priceNote?: string; // e.g., "/hr"
  cta: {
    variant: "outline" | "default";
    label: string;
    href: string;
  };
  features?: string[];
  icon?: React.ReactNode;
}

export function PricingColumn({
  name,
  icon,
  description,
  price,
  priceNote = "",
  cta,
  features,
  variant,
  className,
  ...props
}: PricingColumnProps) {
  return (
    <div className={cn(pricingColumnVariants({ variant, className }))} {...props}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-bold">
            {icon && <div className="text-muted-foreground flex items-center gap-2">{icon}</div>}
            {name}
          </h2>
          <p className="text-muted-foreground max-w-[220px] text-sm">{description}</p>
        </div>

        {/* Price + note with "from" */}
        <div className="flex flex-col items-start gap-1">
  <span className="text-sm text-muted-foreground">From</span>
  <div className="flex items-baseline gap-2">
    <span className="text-muted-foreground text-2xl font-bold">$</span>
    <span className="text-3xl font-bold">{price}</span>
    {priceNote && (
      <span className="text-sm text-muted-foreground">{priceNote}</span>
    )}
  </div>
</div>

        <Button variant={cta.variant} size="lg" asChild>
          <Link href={cta.href}>{cta.label}</Link>
        </Button>


      </div>
    </div>
  );
}

export { pricingColumnVariants };
