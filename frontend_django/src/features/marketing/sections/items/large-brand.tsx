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
  title = "Do more in less time.",
  items = [
    {
      title: "Automate the busywork",
      description: "Tell it the outcome — your agent handles the steps.",
      icon: <FastForwardIcon className="text-brand size-8 stroke-1" />,
    },
    {
      title: "Connect your apps",
      description: "Plug into email, docs, chat, code, and more.",
      icon: <BlocksIcon className="text-brand size-8 stroke-1" />,
    },
    {
      title: "Remembers what matters",
      description: "Agents keep context and pick up where they left off.",
      icon: <EclipseIcon className="text-brand size-8 stroke-1" />,
    },
    {
      title: "Safe by default",
      description: "You stay in control with clear approvals.",
      icon: <ScanFaceIcon className="text-brand size-8 stroke-1" />,
    },
    {
      title: "One workspace",
      description: "Chat, review, and track results together.",
      icon: <MonitorSmartphoneIcon className="text-brand size-8 stroke-1" />,
    },
    {
      title: "Ready when you are",
      description: "Start fast. Scale when it works.",
      icon: <RocketIcon className="text-brand size-8 stroke-1" />,
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
