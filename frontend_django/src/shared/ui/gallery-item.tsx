import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface GalleryItemProps extends React.ComponentProps<"div"> {
  title: string;
  description?: string;
  link?: {
    text?: string;
    url: string;
    icon?: React.ReactNode;
  };
  visual: React.ReactNode;
}

function GalleryItem({
  className,
  title,
  description,
  link,
  visual,
  ...props
}: GalleryItemProps) {
  return (
    <div
      data-slot="gallery-item"
      className={cn(
        "glass-3 group text-card-foreground relative flex flex-col overflow-hidden rounded-xl shadow-xl transition-all",
        className,
      )}
      {...props}
    >
      <div className="flex w-full p-2" data-slot="gallery-item-visual">
        <div className="flex min-h-[120px] w-full items-center overflow-hidden rounded-lg">
          <div className="relative h-full w-full origin-center object-cover transition-transform duration-300 group-hover:scale-[1.05]">
            {visual}
            {link ? (
              <Link
                href={link.url}
                className="absolute inset-0 z-10 flex items-center justify-center"
              />
            ) : (
              visual
            )}
          </div>
        </div>
      </div>
      <div
        data-slot="gallery-item-content"
        className="flex grow flex-col gap-2 p-4 pt-2"
      >
        {link ? (
          <Link href={link.url} className="flex w-full items-center gap-1">
            <h3
              data-slot="gallery-item-title"
              className={cn(
                "grow text-sm font-semibold tracking-tight",
                description && "text-lg",
              )}
            >
              {title}
            </h3>
            {link && !link.text && (
              <ArrowUpRight className="text-brand size-4" />
            )}
          </Link>
        ) : (
          <h3
            data-slot="gallery-item-title"
            className={cn(
              "text-sm font-semibold tracking-tight",
              description && "text-lg",
            )}
          >
            {title}
          </h3>
        )}
        {description && (
          <p
            data-slot="gallery-item-description"
            className="text-muted-foreground grow text-sm text-balance"
          >
            {description}
          </p>
        )}
        {link && link.text && (
          <Link
            href={link.url}
            className="text-brand mt-2 flex items-center gap-1 text-sm font-medium hover:underline"
          >
            {link.text}
            {link.icon || <ArrowUpRight className="size-4" />}
          </Link>
        )}
      </div>
    </div>
  );
}

export { GalleryItem };
