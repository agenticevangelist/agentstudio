import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import { Section } from "@/shared/ui/section";
import SocialProofItem from "@/shared/ui/social-proof-item";

interface SocialProofItemProps {
  name: string;
  username: string;
  text: ReactNode;
  image?: string;
  url?: string;
}

interface SocialProofProps {
  title?: string;
  description?: string;
  items?: SocialProofItemProps[] | false;
  className?: string;
}

export default function SocialProof({
  title = "Title",
  description = "Description",
  items = [{ name: "Name", username: "username", text: "Text" }],
  className,
}: SocialProofProps) {
  return (
    <Section className={cn("px-0", className)}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
          <h2 className="max-w-[720px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
            {title}
          </h2>
          <p className="text-md text-muted-foreground max-w-[600px] font-medium sm:text-xl">
            {description}
          </p>
        </div>
        {items !== false && items.length > 0 && (
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
            {items.map((item) => (
              <SocialProofItem key={item.username} {...item} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
