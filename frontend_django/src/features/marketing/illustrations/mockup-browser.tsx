import * as React from "react";
import { Link } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import Glow from "@/shared/ui/glow";
import { Mockup } from "@/shared/ui/mockup";
import Screenshot from "@/shared/ui/screenshot";

function MockupBrowserIllustration({ className }: { className?: string }) {
  return (
    <div
      data-slot="mockup-browser-illustration"
      className={cn("h-full w-full", className)}
    >
      <div className="relative h-full w-full">
        <div className="absolute top-0 left-[50%] z-10 w-full -translate-x-[50%] translate-y-0 transition-all duration-1000 ease-in-out group-hover:-translate-y-4">
          <Mockup
            type="responsive"
            className="min-w-[640px] flex-col rounded-[12px]"
          >
            <div className="border-border/70 bg-muted/50 relative flex h-10 items-center gap-2 border-b px-4 py-2 dark:border-b-0">
              <div className="flex gap-2">
                <div className="bg-accent dark:bg-foreground/10 size-3 rounded-full"></div>
                <div className="bg-accent dark:bg-foreground/10 size-3 rounded-full"></div>
                <div className="bg-accent dark:bg-foreground/10 size-3 rounded-full"></div>
              </div>
              <div className="from-foreground/5 to-foreground/2 dark:from-foreground/10 dark:to-foreground/5 text-muted-foreground border-border/10 absolute top-1.5 left-1/2 flex min-w-[240px] -translate-x-1/2 items-center justify-center gap-2 rounded-md border-b bg-linear-to-t px-3 py-1.5 text-center text-xs">
                <Link className="size-3" />
                <p>marketplace.octa.space</p>
              </div>
            </div>
            <Screenshot
              srcLight="/img/marketplace1.png"
              srcDark="/img/marketplace1.png"
              alt="Launch UI app screenshot"
              width={1340}
              height={820}
            />
          </Mockup>
        </div>
        <Glow
          variant="center"
          className="translate-y-0 scale-x-200 opacity-20 transition-all duration-1000 group-hover:-translate-y-12 group-hover:opacity-30"
        />
      </div>
    </div>
  );
}

export default MockupBrowserIllustration;
