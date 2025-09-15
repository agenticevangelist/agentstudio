import * as React from "react";
import { cn } from "@/shared/lib/utils";
import Glow from "@/shared/ui/glow";
import { Mockup, MockupFrame } from "@/shared/ui/mockup";
import Screenshot from "@/shared/ui/screenshot";

function MockupResponsiveBottomIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      data-slot="mockup-responsive-bottom-illustration"
      className={cn("h-full w-full", className)}
    >
      <div className="relative h-full w-full">
        <div className="absolute right-0 bottom-0 w-full min-w-[640px] translate-y-0 transition-all duration-1000 ease-in-out group-hover:translate-y-4">
          <MockupFrame size="small">
            <Mockup type="responsive">
              <Screenshot
                srcLight="/app-light.png"
                srcDark="/app-dark.png"
                alt="Launch UI app screenshot"
                width={1340}
                height={820}
              />
            </Mockup>
          </MockupFrame>
          <Glow
            variant="top"
            className="translate-y-4 opacity-40 transition-all duration-1000 group-hover:translate-y-16 group-hover:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}

export default MockupResponsiveBottomIllustration;
