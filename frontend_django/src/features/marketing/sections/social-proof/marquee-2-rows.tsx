import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Section } from "@/shared/ui/section";
import SocialProofItem from "@/shared/ui/social-proof-item";
import Marquee from "@/shared/ui/marquee";

interface SocialProofItemProps {
  name: string;
  username: string;
  text: ReactNode;
  image: string;
  url?: string;
}

interface SocialProofProps {
  title?: string;
  description?: string;
  items?: SocialProofItemProps[] | false;
  className?: string;
}

export default function SocialProof({
  title = "Loved by designers and developers across the planet",
  description = "These are some dummy testimonials from made-up names displayed to preview the social proof components in action.",
  items = [
    {
      name: "Fabrizio Fernandez",
      username: "fab3304",
      text: (
        <>
          Playing around with <span className="text-brand">@launchui</span>{" "}
          suddenly made me feeling inspired to launch that side project.
        </>
      ),
      image: "/avatars/fabrizio.jpg",
      url: "https://twitter.com/mikolajdobrucki",
    },
    {
      name: "Darius Flynn",
      username: "flynnn",
      text: (
        <>
          Exploring <span className="text-brand">@launchui</span>
          &apos;s sleek UI. It&apos;s like a dark mode enthusiast&apos;s
          playground.
        </>
      ),
      image: "/avatars/darius.jpg",
      url: "https://twitter.com/mikolajdobrucki",
    },
    {
      name: "Felix B.",
      username: "felixbs",
      text: (
        <>
          Digging into <span className="text-brand">@launchui</span>. Those
          shadows are giving me serious design envy.
        </>
      ),
      image: "/avatars/felix.jpg",
      url: "https://twitter.com/mikolajdobrucki",
    },
    {
      name: "Olivia Blackwood",
      username: "olivia1992",
      text: (
        <>
          <span className="text-brand">@launchui</span> is not messing around
          with its component library game.
        </>
      ),
      image: "/avatars/olivia.jpg",
      url: "https://twitter.com/mikolajdobrucki",
    },
    {
      name: "Esme Rothschild",
      username: "EmeRothArt",
      text: (
        <>
          <span className="text-brand">@launchui</span> is slick. That globe
          graphic though. Making me feel like I&apos;m building websites for a
          sci-fi movie.
        </>
      ),
      image: "/avatars/esme.jpg",
      url: "https://twitter.com/mikolajdobrucki",
    },
    {
      name: "Kai Nakamura",
      username: "KaiNakWaves",
      text: (
        <>
          Just made my first website with{" "}
          <span className="text-brand">@launchui</span>. Its flexibility is
          speaking my language. No drama, just seamless integration.
        </>
      ),
      image: "/avatars/kai.jpg",
      url: "https://twitter.com/mikolajdobrucki",
    },
  ],
  className,
}: SocialProofProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const halfLength = Math.ceil(items.length / 2);
  const firstRow = items.slice(0, halfLength);
  const secondRow = items.slice(halfLength);

  return (
    <Section className={cn("w-full overflow-hidden px-0", className)}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
          <h2 className="max-w-[720px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
            {title}
          </h2>
          <p className="text-md text-muted-foreground max-w-[600px] font-medium sm:text-xl">
            {description}
          </p>
        </div>
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Marquee pauseOnHover className="[--duration:20s]">
            {firstRow.map((item) => (
              <SocialProofItem key={item.username} {...item} />
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:20s]">
            {secondRow.map((item) => (
              <SocialProofItem key={item.username} {...item} />
            ))}
          </Marquee>
          <div className="from-background pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-linear-to-r sm:block"></div>
          <div className="from-background pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-linear-to-l sm:block"></div>
        </div>
      </div>
    </Section>
  );
}
