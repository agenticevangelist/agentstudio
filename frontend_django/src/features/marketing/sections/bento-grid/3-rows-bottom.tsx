import { ReactNode } from "react";
import { MousePointerClick, Shield, TextCursor, Wrench } from "lucide-react";

import {
  Tile,
  TileVisual,
  TileTitle,
  TileDescription,
  TileContent,
  TileLink,
} from "@/shared/ui/tile";  
import { Section } from "@/shared/ui/section";
import RippleIllustration from "@/features/marketing/illustrations/ripple";
import ChatIllustration from "@/features/marketing/illustrations/chat";
import MockupBrowserIllustration from "@/features/marketing/illustrations/mockup-browser";
import MockupResponsiveBottomIllustration from "@/features/marketing/illustrations/mockup-responsive-bottom";
import RadarSmallIllustration from "@/features/marketing/illustrations/radar-small";

interface TileProps {
  title: string;
  description: ReactNode;
  visual: ReactNode;
  icon?: ReactNode;
  size?: string;
  contentClassName?: string;
}

interface BentoGridProps {
  title?: string;
  description?: string;
  tiles?: TileProps[] | false;
  className?: string;
}

export default function BentoGrid({
  title = "Build a website that is hard to forget.",
  description = "Build a top-notch landing page even if you don't have the time for it. Create an irresistible offer that speaks professionalism and hi-end design.",
  tiles = [
    {
      title: "The code is yours",
      description: (
        <>
          <p className="max-w-[320px] lg:max-w-[460px]">
            With Launch UI, the code is yours forever. You can use it as a
            starting point for your own projects and customize it to your needs.
          </p>
          <p>Never bother about subscriptions and lock-ins.</p>
        </>
      ),
      visual: (
        <div className="min-h-[240px] grow basis-0 sm:p-4 md:min-h-[320px] md:py-12 lg:min-h-[360px]">
          <MockupBrowserIllustration />
        </div>
      ),
      icon: <Wrench className="text-muted-foreground size-8 stroke-1" />,
      size: "col-span-12 md:flex-row",
      contentClassName: "grow basis-0 md:justify-end",
    },
    {
      title: "Data-agnostic",
      description: (
        <>
          <p>
            All the data is separate from components so you can edit it in
            seconds or make it dynamic.
          </p>
          <p>Easily connect to a CMS of your choice.</p>
        </>
      ),
      visual: (
        <div className="w-full sm:p-4 md:p-8">
          <ChatIllustration />
        </div>
      ),
      icon: <TextCursor className="text-muted-foreground size-8 stroke-1" />,
      size: "col-span-12 md:col-span-6 lg:col-span-5",
    },
    {
      title: "Integrate website and product",
      description: (
        <>
          <p className="max-w-[460px]">
            Integrate your landing page directly in the product and forget about
            multiple codebases and unnecessary APIs.
          </p>
          <p>No extra dependencies, no extra maintenance.</p>
        </>
      ),
      visual: (
        <div className="-mx-32 pt-8">
          <RippleIllustration />
        </div>
      ),
      icon: (
        <MousePointerClick className="text-muted-foreground size-8 stroke-1" />
      ),
      size: "col-span-12 md:col-span-6 lg:col-span-7",
    },
    {
      title: "Top-level performance",
      description:
        "Made for static sites while avoiding heavy assets, your website will feel snappy and load instantly.",
      visual: (
        <div className="h-full min-h-[240px] grow sm:p-4 md:min-h-[320px] lg:px-12">
          <MockupResponsiveBottomIllustration />
        </div>
      ),
      icon: <Wrench className="text-muted-foreground size-8 stroke-1" />,
      size: "col-span-12 md:col-span-6 lg:col-span-6",
    },
    {
      title: "Made for search engines",
      description: (
        <p className="max-w-[460px]">
          Unlike the bloated no-code solutions, Launch UI is built to be
          perfectly optimized for search engines.
        </p>
      ),
      visual: (
        <div className="relative min-h-[240px]">
          <RadarSmallIllustration className="absolute top-1/2 left-1/2 -mt-24 h-[512px] w-[512px] -translate-x-1/2 -translate-y-1/2" />
        </div>
      ),
      icon: <Shield className="text-muted-foreground size-8 stroke-1" />,
      size: "col-span-12 md:col-span-6 lg:col-span-6",
    },
  ],
  className,
}: BentoGridProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 sm:gap-12">
        <h2 className="text-center text-3xl font-semibold text-balance sm:text-5xl">
          {title}
        </h2>
        <p className="text-md text-muted-foreground max-w-[840px] text-center font-medium text-balance sm:text-xl">
          {description}
        </p>
        {tiles !== false && tiles.length > 0 && (
          <div className="grid grid-cols-12 gap-4">
            {tiles.map((tile, index) => {
              // Determine the right order of elements based on the index/position
              if (index === 0) {
                return (
                  <Tile key={index} className={tile.size}>
                    <TileLink />
                    <TileContent className={tile.contentClassName}>
                      {tile.icon}
                      <TileTitle>{tile.title}</TileTitle>
                      <TileDescription>{tile.description}</TileDescription>
                    </TileContent>
                    <TileVisual>{tile.visual}</TileVisual>
                  </Tile>
                );
              } else if (index === 3) {
                return (
                  <Tile key={index} className={tile.size}>
                    <TileVisual>{tile.visual}</TileVisual>
                    <TileContent>
                      {tile.icon}
                      <TileTitle>{tile.title}</TileTitle>
                      <TileDescription>{tile.description}</TileDescription>
                    </TileContent>
                  </Tile>
                );
              } else {
                return (
                  <Tile key={index} className={tile.size}>
                    <TileLink />
                    <TileVisual>{tile.visual}</TileVisual>
                    <TileContent>
                      {tile.icon}
                      <TileTitle>{tile.title}</TileTitle>
                      <TileDescription>{tile.description}</TileDescription>
                    </TileContent>
                  </Tile>
                );
              }
            })}
          </div>
        )}
      </div>
    </Section>
  );
}
