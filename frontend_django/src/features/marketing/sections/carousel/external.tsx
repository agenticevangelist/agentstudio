"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import Link from "next/link";

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
} from "@/shared/ui/slide";
import Glow from "@/shared/ui/glow";
import Screenshot from "@/shared/ui/screenshot";

interface SlideProps {
  tagline: string;
  title: string;
  image: React.ReactNode;
  href: string;
}

interface CarouselExternalProps {
  title?: string;
  description?: string;
  slides?: SlideProps[];
  className?: string;
}

export default function CarouselExternal({
  title = "Recently built with Launch UI",
  description = "Dozens of designers and developers have already built their websites with Launch UI.",
  slides = [
    {
      tagline: "www.brine.co",
      title: "Brine",
      image: (
        <Screenshot
          srcLight="/brine.png"
          alt="Brine website"
          width={900}
          height={600}
        />
      ),
      href: "https://www.brine.co/",
    },
    {
      tagline: "www.persite.com",
      title: "Persite",
      image: (
        <Screenshot
          srcLight="/persite.png"
          alt="Persite website"
          width={900}
          height={600}
        />
      ),
      href: "https://mzaremski.com/persite",
    },
    {
      tagline: "www.smigli.com",
      title: "Smigli",
      image: (
        <Screenshot
          srcLight="/smigli.png"
          alt="Smigli website"
          width={900}
          height={600}
        />
      ),
      href: "https://landing.smigli.com/",
    },
    {
      tagline: "www.gramsite.com",
      title: "Gramsite",
      image: (
        <Screenshot
          srcLight="/gramsite.png"
          alt="Gramsite website"
          width={900}
          height={600}
        />
      ),
      href: "https://www.gramsite.com/",
    },
  ],
  className,
}: CarouselExternalProps) {
  return (
    <Section className={cn("w-full overflow-hidden", className)}>
      <div className="max-w-container mx-auto flex flex-col items-start gap-6 sm:gap-12">
        <div className="flex flex-col items-start gap-4">
          <h2 className="text-center text-3xl font-semibold text-balance sm:text-5xl">
            {title}
          </h2>
          <p className="text-md text-muted-foreground font-medium text-balance sm:text-xl">
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
              <CarouselItem key={index} className="flex basis-2/3 pl-4">
                <Slide className="bg-background/100 grow">
                  <Link href={slide.href} target="_blank">
                    <SlideVisual className="fade-bottom-lg min-h-[250px] items-start overflow-hidden md:min-h-[500px]">
                      <div className="h-full max-h-[250px] w-full opacity-50 grayscale invert transition-transform duration-300 group-hover:scale-[1.1] group-hover:opacity-100 md:max-h-[500px] dark:opacity-70 dark:invert-0">
                        {slide.image}
                      </div>
                      <Glow
                        variant="center"
                        className="scale-[2.5] opacity-20 transition-opacity duration-300 group-hover:opacity-30"
                      />
                    </SlideVisual>
                    <SlideButton icon="link" />
                    <SlideContent>
                      <SlideDescription>{slide.tagline}</SlideDescription>
                      <SlideTitle className="text-balance">
                        {slide.title}
                      </SlideTitle>
                    </SlideContent>
                  </Link>
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
