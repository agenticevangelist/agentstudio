import * as React from "react";
import Glow from "@/shared/ui/glow";
import { Mockup, MockupFrame } from "@/shared/ui/mockup";
import Screenshot from "@/shared/ui/screenshot";

function MockupMobileIllustration() {
  return (
    <div
      data-slot="mockup-mobile-illustration"
      className="relative h-full w-full"
    >
      <MockupFrame
        size="small"
        className="absolute top-0 left-[50%] w-full max-w-[366px] -translate-x-[50%] translate-y-0 rounded-[56px] transition-all duration-1000 ease-in-out group-hover:-translate-y-8"
      >
        <Mockup type="mobile">
          <Screenshot
            srcLight="/img/suggestions-mobile.png"
            srcDark="/img/suggestions-mobile.png"
            alt="Launch UI app screenshot"
            width={350}
            height={765}
          />
        </Mockup>
      </MockupFrame>
      <Glow
        variant="bottom"
        className="translate-y-20 scale-x-[1.2] opacity-70 transition-all duration-1000 group-hover:translate-y-8 group-hover:opacity-100"
      />
    </div>
  );
}

export default MockupMobileIllustration;
