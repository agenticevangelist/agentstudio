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
        "A modern template for SaaS businesses and marketing websites. Designed to showcase your product and drive conversions.",
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
        "A sleek template for AI products and applications. Perfect for showcasing advanced capabilities and innovative features.",
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
        "A comprehensive template for developer tools and platforms. Built to highlight technical features and developer experience.",
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
        "An engaging template for mobile app marketing. Designed to showcase app features and increase user acquisition.",
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
        "A responsive calendar block built with modern tools. Perfect for scheduling, time management and productivity apps.",
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
        "An interactive chat interface built with modern tools. Ideal for AI assistants, support tools and messaging platforms.",
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
    {
      title: "Calendar App",
      description:
        "A responsive calendar block built with modern tools. Perfect for scheduling, time management and productivity apps.",
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
        "An interactive chat interface built with modern tools. Ideal for AI assistants, support tools and messaging platforms.",
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
        <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
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
