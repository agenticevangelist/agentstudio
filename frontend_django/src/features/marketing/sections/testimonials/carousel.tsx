import { cn } from "@/shared/lib/utils";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import { Section } from "@/shared/ui/section";
import GPXOverlay from "@/features/marketing/logos/gpxoverlay";
import Catalog from "@/features/marketing/logos/catalog";
import CoreOS from "@/features/marketing/logos/coreos";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

interface TestimonialProps {
  name: string;
  role: string;
  text: string;
  image: string;
  Logo: React.ComponentType;
}

interface TestimonialsProps {
  items?: TestimonialProps[];
  className?: string;
}

export default function TestimonialsCarousel({
  items = [
    {
      name: "Marcin Zaremski",
      role: "Indie Hacker",
      text: "I love that I don't need to think about the design because Launch UI perfectly solves it for me. If you value flexibility over written-in-stone components, I can highly recommend it.",
      image: "/avatars/marcin.jpg",
      Logo: GPXOverlay,
    },
    {
      name: "Marcus Rodriguez",
      role: "Tech Lead",
      text: "What stands out about Launch UI is its flexibility. We've built everything from dashboards to marketing sites using these components, and they adapt beautifully to every context.",
      image: "/avatars/marcus.jpg",
      Logo: Catalog,
    },
    {
      name: "Darius Flynn",
      role: "Web Developer",
      text: "I've used many UI libraries over the years, but Launch UI strikes the perfect balance between flexibility and structure. It's become an essential part of my toolkit.",
      image: "/avatars/darius.jpg",
      Logo: CoreOS,
    },
  ],
  className,
}: TestimonialsProps) {
  return (
    <Section className={cn("w-full overflow-hidden px-4 md:px-16", className)}>
      <div className="max-w-container mx-auto">
        <Carousel className="mx-auto w-full max-w-[640px]">
          <div className="overflow-hidden">
            <CarouselContent>
              {items.map((item) => (
                <CarouselItem key={item.name}>
                  <div className="flex flex-col gap-8 p-8">
                    <div className="h-8">
                      <item.Logo />
                    </div>
                    <p className="text-muted-foreground leading-relaxed italic md:text-xl">
                      &ldquo;{item.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-4">
                      <Avatar className="size-10">
                        <AvatarImage src={item.image} />
                        <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-muted-foreground text-sm">
                          {item.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>
          <div className="mt-12 flex justify-start gap-4">
            <CarouselPrevious className="static md:absolute" />
            <CarouselNext className="static md:absolute" />
          </div>
        </Carousel>
      </div>
    </Section>
  );
}
