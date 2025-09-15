"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import { Section } from "@/shared/ui/section";
import {
  Slide,
  SlideContent,
  SlideTitle,
  SlideDescription,
  SlideVisual,
  SlideButton,
  SlideExpandedContent,
} from "@/shared/ui/slide";
import Glow from "@/shared/ui/glow";
import Screenshot from "@/shared/ui/screenshot";
interface SlideProps {
  tagline: string;
  title: string;
  description: string;
  image: React.ReactNode;
}

interface CarouselSmallProps {
  title?: string;
  description?: string;
  slides?: SlideProps[];
  className?: string;
}

export default function CarouselSmall({
  title = "What you can do with Agent Studio",
  description = "A quick tour of the highlights — from smart suggestions to powerful automations you can approve in one click.",
  slides = [
    {
      tagline: "Approvals",
      title: "Your way",
      description:
        "Approve with one click — or just reply in plain text. When you provide feedback, the agent tailors results to it.",
      image: (
        <Screenshot
          srcLight="/img/inbox.png"
          srcDark="/img/inbox.png"
          alt="Flexible approvals"
          width={900}
          height={600}
        />
      ),
    },
    {
      tagline: "Tailor in chat",
      title: "Jobs that learn",
      description:
        "Chat with agents to fine‑tune what a job does. When you provide feedback, the job is tailored and gets better.",
      image: (
        <Screenshot
          srcLight="/app-mail-light.png"
          srcDark="/app-mail-dark.png"
          alt="Tailored jobs that learn"
          width={900}
          height={600}
        />
      ),
    },
    {
      tagline: "Reliability",
      title: "Always on schedule",
      description:
        "Recurring jobs run when they should — even if you’re away. When you provide feedback, timing and details are tailored.",
      image: (
        <Screenshot
          srcLight="/app-settings-light.png"
          srcDark="/app-settings-dark.png"
          alt="Reliable schedules"
          width={900}
          height={600}
        />
      ),
    },
    {
      tagline: "Clarity",
      title: "See what happened",
      description:
        "Every job has a trail — what ran, when, and why — with links and a place to leave feedback that tailors the next run.",
      image: (
        <Screenshot
          srcLight="/app-tasks-light.png"
          srcDark="/app-tasks-dark.png"
          alt="Audit trail"
          width={900}
          height={600}
        />
      ),
    },
    {
      tagline: "Personalization",
      title: "Tuned to your style",
      description:
        "Agents learn from your approvals and edits — when you provide feedback, tone, timing, and channels are tailored to you.",
      image: (
        <Screenshot
          srcLight="/mobile-light.png"
          srcDark="/mobile-dark.png"
          alt="Personalized results"
          width={900}
          height={600}
        />
      ),
    },
  ],
  className,
}: CarouselSmallProps) {
  const [expandedSlides, setExpandedSlides] = React.useState<boolean[]>(
    new Array(slides.length).fill(false),
  );

  const toggleSlide = (index: number) => {
    setExpandedSlides((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  return (
    <Section className={cn("w-full overflow-hidden", className)}>
      <div className="max-w-container mx-auto flex flex-col items-start gap-6 sm:gap-12">
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-center text-3xl font-semibold text-balance sm:text-5xl">
            {title}
          </h2>
          <p className="text-md text-muted-foreground max-w-[720px] font-medium text-balance sm:text-xl">
            {description}
          </p>
        </div>
        <Carousel
          opts={{
            align: "start",
            startIndex: 0,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {slides.map((slide, index) => (
              <CarouselItem
                key={index}
                className="flex basis-4/5 pl-4 sm:basis-2/3 lg:basis-5/12 xl:basis-1/3"
              >
                <Slide
                  className="grow cursor-pointer"
                  onClick={() => toggleSlide(index)}
                >
                  {/* Text first, larger sizes */}
                  <SlideContent isExpanded={expandedSlides[index]}>
                    <SlideTitle className="text-balance text-2xl sm:text-3xl">
                      {slide.title}
                    </SlideTitle>
                    <SlideDescription className="text-base sm:text-lg">
                      {slide.tagline}
                    </SlideDescription>
                  </SlideContent>
                  {/* Keep visual and Glow as-is to preserve card size */}
                  <SlideVisual
                    className="fade-bottom-lg min-h-[300px] items-end overflow-hidden"
                    isExpanded={expandedSlides[index]}
                  >
                    <Glow
                      variant="center"
                      className="scale-[2.5] opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                    />
                  </SlideVisual>
                  <SlideButton isExpanded={expandedSlides[index]} />
                  <SlideExpandedContent isExpanded={expandedSlides[index]}>
                    {slide.description}
                  </SlideExpandedContent>
                </Slide>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-12 flex justify-start gap-4">
            <CarouselPrevious className="static" />
            <CarouselNext className="static" />
          </div>
        </Carousel>
      </div>
    </Section>
  );
}
