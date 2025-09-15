import { ReactNode } from "react";

import {
  Tile,
  TileVisual,
  TileTitle,
  TileDescription,
  TileContent,
  TileLink,
} from "@/shared/ui/tile";
import { Section } from "@/shared/ui/section";
import GlobeIllustration from "@/features/marketing/illustrations/globe";
import PipelineIllustration from "@/features/marketing/illustrations/pipeline";
import CodeEditorIllustration from "@/features/marketing/illustrations/code-editor";
import MockupMobileIllustration from "@/features/marketing/illustrations/mockup-mobile";
import TilesIllustration from "@/features/marketing/illustrations/tiles";

interface TileProps {
  title: string;
  description: ReactNode;
  visual: ReactNode;
  size?: string;
}

interface BentoGridProps {
  title?: string;
  description?: string;
  tiles?: TileProps[] | false;
  className?: string;
}

export default function BentoGrid({
  title = "Give your team a superpower",
  description = "Spin up helpful agents in minutes. They handle the steps — you approve the outcomes.",
  tiles = [
    {
      title: "Agents that run on triggers",
      description: (
        <p className="max-w-[460px]">
          Kick off work from emails, webhooks, messages, or a schedule. Agents
          listen for events and handle the steps in the background — no babysitting.
        </p>
      ),
      visual: (
        <div className="min-h-[160px] grow items-center self-center">
          <PipelineIllustration />
        </div>
      ),
      size: "col-span-12 md:col-span-5",
    },
    {
      title: "Chat for quick asks, inbox for background jobs",
      description: (
        <>
          <p className="max-w-[320px] lg:max-w-[460px]">
            Ask in plain language. Get drafts, answers, and next steps fast.
          </p>
          <p>Approve to send, post, or file — all from one place.</p>
        </>
      ),
      visual: (
        <div className="min-h-[240px] w-full grow items-center self-center p-4 lg:px-12">
          <CodeEditorIllustration />
        </div>
      ),
      size: "col-span-12 md:col-span-7",
    },
    {
      title: "Smart suggestions",
      description: (
        <p>
          Agents learn your routines and suggest helpful jobs — you approve what sticks.
        </p>
      ),
      visual: (
        <div className="min-h-[300px] w-full py-12">
          <MockupMobileIllustration />
        </div>
      ),
      size: "col-span-12 md:col-span-6 lg:col-span-4",
    },
    {
      title: "Fast and smooth",
      description:
        "Snappy by default, even on heavy tasks.",
      visual: (
        <div className="-mt-12 -mb-20 [&_svg]:h-[420px] [&_svg]:w-[420px]">
          <GlobeIllustration />
        </div>
      ),
      size: "col-span-12 md:col-span-6 lg:col-span-4",
    },
    {
      title: "Connect your tools",
      description: (
        <p className="max-w-[460px]">
          Works with email, docs, chat, code, calendars, and hundreds more.
        </p>
      ),
      visual: (
        <div className="-mr-32 -ml-40">
          <TilesIllustration />
        </div>
      ),
      size: "col-span-12 md:col-span-6 lg:col-span-4",
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
            {tiles.map((tile, index) => (
              <Tile key={index} className={tile.size}>
                <TileLink />
                <TileContent>
                  <TileTitle>{tile.title}</TileTitle>
                  <TileDescription>{tile.description}</TileDescription>
                </TileContent>
                <TileVisual>{tile.visual}</TileVisual>
              </Tile>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
