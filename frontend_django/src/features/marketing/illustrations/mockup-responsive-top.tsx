import * as React from "react";
import { cn } from "@/shared/lib/utils";
import Glow from "@/shared/ui/glow";
import { Mockup, MockupFrame } from "@/shared/ui/mockup";
import Screenshot from "@/shared/ui/screenshot";

function MockupResponsiveTopIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      data-slot="mockup-responsive-top-illustration"
      className={cn("h-full w-full", className)}
    >
      <div className="relative h-full w-full">
        <MockupFrame
          size="small"
          className="absolute top-0 left-0 w-full min-w-[680px] translate-y-0 transition-all duration-1000 ease-in-out group-hover:-translate-y-4"
        >
          <Mockup type="responsive">
            <Screenshot
              srcLight="/img/render2.png"
              srcDark="/img/render2.png"
              alt="Launch UI app screenshot"
              width={1340}
              height={820}
            />
          </Mockup>
        </MockupFrame>
        <Glow
          variant="bottom"
          className="translate-y-20 transition-all duration-1000 group-hover:translate-y-8"
        />
      </div>
    </div>
  );
}

export default MockupResponsiveTopIllustration;
