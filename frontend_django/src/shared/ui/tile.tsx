import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { ArrowUpRight } from "lucide-react";

function Tile({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tile"
      className={cn(
        "glass-1 hover:glass-2 group text-card-foreground relative flex flex-col gap-6 overflow-hidden rounded-xl p-6 shadow-xl transition-all",
        className,
      )}
      {...props}
    />
  );
}

function TileTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="tile-title"
      className={cn(
        "text-2xl leading-none font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function TileDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tile-description"
      className={cn(
        "text-md text-muted-foreground flex flex-col gap-2 text-balance",
        className,
      )}
      {...props}
    />
  );
}

function TileContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tile-content"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TileVisual({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tile-visual"
      className={cn("flex grow items-end justify-center", className)}
      {...props}
    />
  );
}

function TileLink({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      data-slot="tile-link"
      className={cn(
        "bg-accent/50 absolute top-4 right-4 block rounded-full p-4 opacity-0 transition-opacity group-hover:opacity-100",
        className,
      )}
      {...props}
    >
      <ArrowUpRight className="size-4" />
    </a>
  );
}

export { Tile, TileVisual, TileTitle, TileDescription, TileContent, TileLink };
