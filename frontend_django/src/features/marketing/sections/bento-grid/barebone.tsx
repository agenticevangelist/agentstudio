import { ReactNode } from "react";

import {
  Tile,
  TileVisual,
  TileTitle,
  TileDescription,
  TileContent,
} from "@/shared/ui/tile";
import { Section } from "@/shared/ui/section";

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
  title = "Section title",
  description,
  tiles = [
    {
      title: "Tile title",
      description: "Tile description",
      visual: <></>, // Empty placeholder for illustration
      size: "col-span-12",
    },
    // Add more default tiles here if needed
  ],
  className,
}: BentoGridProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 sm:gap-12">
        <h2 className="text-3xl font-semibold sm:text-5xl">{title}</h2>
        {description && (
          <p className="text-md text-muted-foreground max-w-[720px] text-center font-medium text-balance sm:text-xl">
            {description}
          </p>
        )}
        {tiles !== false && tiles.length > 0 && (
          <div className="grid grid-cols-12 gap-4">
            {tiles.map((tile, index) => (
              <Tile key={index} className={tile.size}>
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
