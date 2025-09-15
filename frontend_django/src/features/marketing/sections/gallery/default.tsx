import * as React from "react";
import { cn } from "@/shared/lib/utils";

import { Section } from "@/shared/ui/section";
import { GalleryItem } from "@/shared/ui/gallery-item";
import Screenshot from "@/shared/ui/screenshot";

interface GalleryItemProps {
  title: string;
  description: string;
  link?: {
    text?: string;
    url: string;
    icon?: React.ReactNode;
  };
  visual: React.ReactNode;
}

interface GalleryProps {
  title?: string;
  description?: string;
  items?: GalleryItemProps[];
  className?: string;
}

export default function Gallery({
  title = "What's inside?",
  description = "Hundreds of components, blocks and templates, all created with React, Shadcn/ui and Tailwind that will help you make your product look special.",
  items = [
    {
      title: "Saturn",
      description:
        "A modern and clean template for SaaS businesses and marketing websites. Designed to showcase your product and convert visitors into customers.",
      link: {
        text: "View Template",
        url: "/templates/saturn",
      },
      visual: (
        <Screenshot
          srcLight="/app-light.png"
          srcDark="/app-dark.png"
          alt="Stripe Subscriptions Starter"
          width={500}
          height={300}
        />
      ),
    },
    {
      title: "Neptune",
      description:
        "A template for groundbreaking AI products and applications. Perfect for showcasing AI capabilities and demonstrating complex features.",
      link: {
        text: "View Template",
        url: "/templates/neptune",
      },
      visual: (
        <Screenshot
          srcLight="/app-mail-light.png"
          srcDark="/app-mail-dark.png"
          alt="Next.js Starter"
          width={500}
          height={300}
        />
      ),
    },
    {
      title: "Luna",
      description:
        "A comprehensive template for developer-focused projects. Perfect for showcasing developer features and building trust with potential customers.",
      link: {
        text: "View Template",
        url: "/templates/luna",
      },
      visual: (
        <Screenshot
          srcLight="/app-settings-light.png"
          srcDark="/app-settings-dark.png"
          alt="AI Chatbot"
          width={500}
          height={300}
        />
      ),
    },
    {
      title: "Pluto",
      description:
        "A sleek and engaging template designed for mobile app marketing. Perfect for showcasing app features and driving downloads.",
      link: {
        text: "View Template",
        url: "/templates/pluto",
      },
      visual: (
        <Screenshot
          srcLight="/app-tasks-light.png"
          srcDark="/app-tasks-dark.png"
          alt="LangChain + Next.js Starter"
          width={500}
          height={300}
        />
      ),
    },
    {
      title: "Calendar App",
      description:
        "Responsive, customizable calendar block made with shadcn/ui, tailwind and react. Perfect for scheduling apps, time management tools, CRMs, and productivity platforms.",
      link: {
        text: "View Template",
        url: "/templates/calendar",
      },
      visual: (
        <Screenshot
          srcLight="/app-light.png"
          srcDark="/app-dark.png"
          alt="Flutter User Management"
          width={500}
          height={300}
        />
      ),
    },
    {
      title: "AI Chat App",
      description:
        "Interactive chat block made with shadcn/ui, tailwind and react. A great starting point for building AI assistants, customer support tools, messaging platforms, and virtual agents.",
      link: {
        text: "View Template",
        url: "/templates/chat",
      },
      visual: (
        <Screenshot
          srcLight="/app-mail-light.png"
          srcDark="/app-mail-dark.png"
          alt="Expo React Native Starter"
          width={500}
          height={300}
        />
      ),
    },
  ],
  className,
}: GalleryProps) {
  return (
    <Section className={cn("w-full", className)}>
      <div className="max-w-container mx-auto flex flex-col items-start gap-6 sm:gap-12">
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-center text-3xl font-semibold text-balance sm:text-5xl">
            {title}
          </h2>
          <p className="text-md text-muted-foreground max-w-[840px] font-medium text-balance sm:text-xl">
            {description}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-6 lg:grid-cols-3">
          {items.map((item, index) => (
            <GalleryItem
              key={index}
              title={item.title}
              description={item.description}
              link={item.link}
              visual={item.visual}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
