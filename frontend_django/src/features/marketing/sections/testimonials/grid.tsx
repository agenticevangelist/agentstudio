import { Section } from "@/shared/ui/section";
import GPXOverlay from "@/features/marketing/logos/gpxoverlay";
import Catalog from "@/features/marketing/logos/catalog";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

interface TestimonialProps {
  name: string;
  role: string;
  text: string;
  image: string;
  Logo?: React.ComponentType;
}

interface TestimonialsProps {
  items?: TestimonialProps[];
  className?: string;
}

export default function TestimonialsGrid({
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
  ],
  className,
}: TestimonialsProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto">
        <div className="grid gap-20 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.name} className="flex flex-col gap-4 md:gap-6">
              {item.Logo && (
                <div className="h-8">
                  <item.Logo />
                </div>
              )}
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
          ))}
        </div>
      </div>
    </Section>
  );
}
