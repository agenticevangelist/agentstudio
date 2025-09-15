import * as React from "react";
import Glow from "@/shared/ui/glow";

function RisingSmallIllustration() {
  return (
    <div
      data-slot="rising-small-illustration"
      className="relative w-full pt-[20%]"
    >
      <div className="border-brand bg-background/50 absolute top-0 -left-[50%] z-10 w-[200%] overflow-hidden rounded-[100%] border-4 pt-[100%] shadow-[0px_0px_12px_var(--brand),_0px_0px_64px_var(--brand-foreground),0px_0px_12px_var(--brand)_inset]">
        <div
          className="animate-pulse-hover bg-brand-foreground/50 absolute top-0 -left-[50%] h-[200%] w-[200%] rounded-[100%]"
          style={{
            maskImage:
              "radial-gradient(140% 95%, transparent 0%, transparent 35%, black 55%)",
          }}
        />
        <div
          className="animate-pulse-hover bg-brand/50 absolute top-0 -left-[50%] h-[200%] w-[200%] rounded-[100%]"
          style={{
            maskImage:
              "radial-gradient(140% 110%, transparent 0%, transparent 35%, black 55%)",
          }}
        />
        <div
          className="animate-pulse-hover bg-brand absolute -top-[5%] -left-[50%] h-[200%] w-[200%] rounded-[100%] dark:bg-white"
          style={{
            maskImage:
              "radial-gradient(140% 120%, transparent 0%, transparent 38%, black 43%)",
          }}
        />
      </div>
      <Glow variant="center" />
    </div>
  );
}

export default RisingSmallIllustration;
