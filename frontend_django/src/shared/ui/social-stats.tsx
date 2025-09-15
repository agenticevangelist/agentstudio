import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { StarIcon, Terminal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import Figma from "@/features/marketing/logos/figma";
import Github from "@/features/marketing/logos/github";

export function SocialStats() {
  const avatars = [
    {
      name: "Marcin Zaremski",
      image: "/avatars/marcin.jpg",
    },
    {
      name: "Paulina Szalasz",
      image: "/avatars/paulina.jpg",
    },
    {
      name: "Mikolaj Dobrucki",
      image: "/avatars/mikolaj.jpg",
    },
  ];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            data-slot="social-stats"
            className="hover:bg-foreground/10 flex items-center rounded-md p-2"
          >
            {avatars.map((avatar) => (
              <Avatar key={avatar.name} className="-mr-2 size-8 shadow-md">
                <AvatarImage src={avatar.image} />
                <AvatarFallback>{avatar.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            <div className="ml-4 flex flex-col gap-1">
              <div className="flex gap-1">
                <StarIcon className="fill-foreground size-3" />
                <StarIcon className="fill-foreground size-3" />
                <StarIcon className="fill-foreground size-3" />
                <StarIcon className="fill-foreground size-3" />
                <StarIcon className="fill-foreground size-3" />
              </div>
              <p className="text-muted-foreground text-left text-xs font-medium">
                Used by 1000 designers and developers
              </p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="flex w-64 flex-col gap-2 p-4 text-xs">
          <div className="flex">
            <p className="flex grow items-center gap-0.5">
              <Figma className="mr-2 size-3" /> Figma users
            </p>
            <p className="text-muted-foreground">1000</p>
          </div>
          <div className="flex">
            <p className="flex grow items-center gap-0.5">
              <Github className="mr-2 size-3" /> Github clones
              <span className="text-muted-foreground italic">unique</span>
            </p>
            <p className="text-muted-foreground">1000</p>
          </div>
          <div className="flex">
            <p className="flex grow items-center gap-0.5">
              <Terminal className="mr-2 size-3" /> CLI installations
              <span className="text-muted-foreground italic">unique</span>
            </p>
            <p className="text-muted-foreground">1000</p>
          </div>
          <p className="text-muted-foreground pt-4 text-xs">
            Data updated 1000
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
