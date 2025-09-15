import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Plus, ArrowUpRight } from "lucide-react";

function Slide({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="slide"
      className={cn(
        "glass-3 group text-card-foreground relative flex flex-col overflow-hidden rounded-xl shadow-xl transition-all",
        className,
      )}
      {...props}
    />
  );
}

function SlideTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="slide-title"
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function SlideDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="slide-description"
      className={cn("text-muted-foreground text-sm text-balance", className)}
      {...props}
    />
  );
}

function SlideContent({
  className,
  isExpanded,
  ...props
}: React.ComponentProps<"div"> & { isExpanded?: boolean }) {
  return (
    <div
      data-slot="slide-content"
      className={cn(
        "flex flex-col gap-2 p-6 transition-opacity duration-300",
        isExpanded ? "opacity-0" : "opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function SlideVisual({
  className,
  isExpanded,
  ...props
}: React.ComponentProps<"div"> & { isExpanded?: boolean }) {
  return (
    <div
      data-slot="slide-visual"
      className={cn(
        "flex items-center transition-opacity duration-300",
        isExpanded ? "opacity-0" : "opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function SlideExpandedContent({
  className,
  isExpanded,
  ...props
}: React.ComponentProps<"p"> & { isExpanded?: boolean }) {
  return (
    <p
      data-slot="slide-expanded-content"
      className={cn(
        "text-muted-foreground absolute inset-6 text-lg text-balance transition-opacity duration-300",
        isExpanded ? "opacity-100" : "opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SlideButton({
  className,
  isExpanded,
  icon = "more",
  ...props
}: React.ComponentProps<"button"> & {
  isExpanded?: boolean;
  icon?: "link" | "more";
}) {
  return (
    <button
      data-slot="slide-button"
      {...props}
      className={cn(
        "bg-accent/50 pointer-events-none absolute right-6 bottom-6 z-10 block rounded-full p-4",
        className,
      )}
    >
      {icon === "link" ? (
        <ArrowUpRight className="size-4" />
      ) : (
        <Plus
          className={cn(
            "size-4 transition-all",
            isExpanded ? "rotate-45" : "group-hover:rotate-90",
          )}
        />
      )}
    </button>
  );
}

export {
  Slide,
  SlideTitle,
  SlideDescription,
  SlideContent,
  SlideVisual,
  SlideButton,
  SlideExpandedContent,
};
