import { Section } from "@/shared/ui/section";
import GPXOverlay from "@/features/marketing/logos/gpxoverlay";

interface TestimonialProps {
  text: string;
  Logo: React.ComponentType;
}

interface TestimonialsProps {
  items?: TestimonialProps[];
  className?: string;
}

export default function TestimonialsDefault({
  items = [
    {
      text: "I love that I don't need to think about the design because Launch UI perfectly solves it for me. If you value flexibility over written-in-stone components, I can highly recommend it.",
      Logo: GPXOverlay,
    },
  ],
  className,
}: TestimonialsProps) {
  return (
    <Section className={className}>
      <div className="mx-auto max-w-[720px]">
        {items.map((testimonial, index) => (
          <div
            key={index}
            className="mb-16 flex flex-col items-center gap-8 text-center last:mb-0"
          >
            <p className="text-muted-foreground leading-relaxed italic md:text-xl">
              &ldquo;{testimonial.text}&rdquo;
            </p>
            <div className="h-8">
              <testimonial.Logo />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
