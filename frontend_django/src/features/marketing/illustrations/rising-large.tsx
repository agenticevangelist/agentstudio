import * as React from "react";
import Glow from "@/shared/ui/glow";

function RisingLargeIllustration() {
  return (
    <div
      data-slot="rising-large-illustration"
      className="group relative w-full pt-[50%]"
    >
      <div className="border-brand bg-background/50 absolute top-0 left-0 z-10 w-full overflow-hidden rounded-[100%] border-4 pt-[100%] shadow-[0px_0px_12px_var(--brand),_0px_0px_64px_var(--brand-foreground),0px_0px_12px_var(--brand)_inset]">
        <div
          className="bg-brand-foreground/50 absolute top-0 left-0 h-full w-full rounded-[100%]"
          style={{
            maskImage:
              "radial-gradient(140% 95%, transparent 0%, transparent 35%, black 55%)",
          }}
        />
        <div
          className="bg-brand/50 absolute top-0 left-0 h-full w-full translate-y-[-1rem] rounded-[100%] opacity-80 transition-all duration-1000 ease-in-out group-hover:translate-y-0 group-hover:opacity-100"
          style={{
            maskImage:
              "radial-gradient(140% 110%, transparent 0%, transparent 35%, black 55%)",
          }}
        />
        <div
          className="bg-brand absolute top-0 left-0 h-full w-full translate-y-[-1rem] rounded-[100%] opacity-80 transition-all duration-1000 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 dark:bg-white"
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

export default RisingLargeIllustration;
