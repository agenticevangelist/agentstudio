import { ReactNode } from "react";
import {
  BlocksIcon,
  EclipseIcon,
  FastForwardIcon,
  MonitorSmartphoneIcon,
  RocketIcon,
  ScanFaceIcon,
} from "lucide-react";

import {
  Item,
  ItemIcon,
  ItemTitle,
  ItemDescription,
} from "@/shared/ui/item";
import { Section } from "@/shared/ui/section";

interface ItemProps {
  title: string;
  description: string;
  icon: ReactNode;
}

interface ItemsProps {
  title?: string;
  items?: ItemProps[] | false;
  className?: string;
}

export default function Items({
  title = "Everything you need. Nothing you don't.",
  items = [
    {
      title: "Accessibility first",
      description: "Fully WCAG 2.0 compliant, made with best a11y practices",
      icon: <ScanFaceIcon className="size-8 stroke-1" />,
    },
    {
      title: "Responsive design",
      description: "Looks and works great on any device and screen size",
      icon: <MonitorSmartphoneIcon className="size-8 stroke-1" />,
    },
    {
      title: "Light and dark mode",
      description:
        "Seamless switching between color schemes, 6 themes included",
      icon: <EclipseIcon className="size-8 stroke-1" />,
    },
    {
      title: "Easy to customize",
      description: "Flexible options to match your product or brand",
      icon: <BlocksIcon className="size-8 stroke-1" />,
    },
    {
      title: "Top-level performance",
      description: "Made for lightning-fast load times and smooth interactions",
      icon: <FastForwardIcon className="size-8 stroke-1" />,
    },
    {
      title: "Production ready",
      description: "Thoroughly tested and launch-prepared",
      icon: <RocketIcon className="size-8 stroke-1" />,
    },
  ],
  className,
}: ItemsProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 sm:gap-20">
        <h2 className="max-w-[560px] text-center text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          {title}
        </h2>
        {items !== false && items.length > 0 && (
          <div className="grid auto-rows-fr grid-cols-1 gap-0 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
            {items.map((item, index) => (
              <Item key={index} className="flex-row items-center">
                <ItemIcon className="glass-4 self-center rounded-lg p-4">
                  {item.icon}
                </ItemIcon>
                <div className="flex flex-col gap-2">
                  <ItemTitle>{item.title}</ItemTitle>
                  <ItemDescription>{item.description}</ItemDescription>
                </div>
              </Item>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
