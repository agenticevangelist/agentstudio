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

interface GallerySection {
  title: string;
  description: string;
  items: GalleryItemProps[];
}

interface GallerySectionsProps {
  title?: string;
  description?: string;
  sections?: GallerySection[];
  className?: string;
}

export default function GallerySections({
  title = "What's inside?",
  description = "Hundreds of components, blocks and templates, all created with React, Shadcn/ui and Tailwind that will help you make your product look special.",
  sections = [
    {
      title: "Blocks",
      description:
        "Building blocks for creating beautiful user interfaces across various sections of your website.",
      items: [
        {
          title: "Hero",
          description: "5 sections",
          link: {
            url: "#hero",
          },
          visual: (
            <Screenshot
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="Hero Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Bento Grid",
          description: "5 sections",
          link: {
            url: "#bento-grid",
          },
          visual: (
            <Screenshot
              srcLight="/app-mail-light.png"
              srcDark="/app-mail-dark.png"
              alt="Bento Grid Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Feature",
          description: "6 sections",
          link: {
            url: "#feature",
          },
          visual: (
            <Screenshot
              srcLight="/app-settings-light.png"
              srcDark="/app-settings-dark.png"
              alt="Feature Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Social Proof",
          description: "6 sections",
          link: {
            url: "#social-proof",
          },
          visual: (
            <Screenshot
              srcLight="/app-tasks-light.png"
              srcDark="/app-tasks-dark.png"
              alt="Social Proof Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "FAQ",
          description: "5 sections",
          link: {
            url: "#faq",
          },
          visual: (
            <Screenshot
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="FAQ Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Navbar",
          description: "5 sections",
          link: {
            url: "#navbar",
          },
          visual: (
            <Screenshot
              srcLight="/app-tasks-light.png"
              srcDark="/app-tasks-dark.png"
              alt="Navbar Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Logos",
          description: "5 sections",
          link: {
            url: "#logos",
          },
          visual: (
            <Screenshot
              srcLight="/app-settings-light.png"
              srcDark="/app-settings-dark.png"
              alt="Logos Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Items",
          description: "4 sections",
          link: {
            url: "#items",
          },
          visual: (
            <Screenshot
              srcLight="/app-tasks-light.png"
              srcDark="/app-tasks-dark.png"
              alt="Items Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Carousel",
          description: "4 sections",
          link: {
            url: "#carousel",
          },
          visual: (
            <Screenshot
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="Carousel Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Stats",
          description: "3 sections",
          link: {
            url: "#stats",
          },
          visual: (
            <Screenshot
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="Stats Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Testimonials",
          description: "3 sections",
          link: {
            url: "#testimonials",
          },
          visual: (
            <Screenshot
              srcLight="/app-settings-light.png"
              srcDark="/app-settings-dark.png"
              alt="Testimonials Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "CTA",
          description: "3 sections",
          link: {
            url: "#cta",
          },
          visual: (
            <Screenshot
              srcLight="/app-tasks-light.png"
              srcDark="/app-tasks-dark.png"
              alt="CTA Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Footer",
          description: "3 sections",
          link: {
            url: "#footer",
          },
          visual: (
            <Screenshot
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="Footer Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Pricing",
          description: "3 sections",
          link: {
            url: "#pricing",
          },
          visual: (
            <Screenshot
              srcLight="/app-settings-light.png"
              srcDark="/app-settings-dark.png"
              alt="Pricing Sections"
              width={500}
              height={300}
            />
          ),
        },
        {
          title: "Tabs",
          description: "3 sections",
          link: {
            url: "#tabs",
          },
          visual: (
            <Screenshot
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="Tabs Sections"
              width={500}
              height={300}
            />
          ),
        },
      ],
    },
    {
      title: "Website Templates",
      description:
        "Complete website templates ready to be customized for your business needs.",
      items: [
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
              alt="Saturn SaaS Template"
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
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="Neptune AI Template"
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
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="Luna Developer Template"
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
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="Pluto Mobile App Template"
              width={500}
              height={300}
            />
          ),
        },
      ],
    },
    {
      title: "App Templates",
      description:
        "Ready-to-use app interface templates that you can integrate with your backend.",
      items: [
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
              alt="Calendar App Template"
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
              srcLight="/app-light.png"
              srcDark="/app-dark.png"
              alt="AI Chat App Template"
              width={500}
              height={300}
            />
          ),
        },
      ],
    },
  ],
  className,
}: GallerySectionsProps) {
  return (
    <Section className={cn("w-full", className)}>
      <div className="max-w-container mx-auto flex flex-col items-start gap-12 sm:gap-16">
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-center text-3xl font-semibold text-balance sm:text-5xl">
            {title}
          </h2>
          <p className="text-md text-muted-foreground max-w-[840px] font-medium text-balance sm:text-xl">
            {description}
          </p>
        </div>

        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="w-full">
            <div className="mb-8 flex flex-col gap-2">
              <h3 className="text-2xl font-semibold">{section.title}</h3>
              <p className="text-muted-foreground font-medium text-balance">
                {section.description}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {section.items.map((item, itemIndex) => (
                <GalleryItem
                  key={itemIndex}
                  title={item.title}
                  description={item.description}
                  link={item.link}
                  visual={item.visual}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
