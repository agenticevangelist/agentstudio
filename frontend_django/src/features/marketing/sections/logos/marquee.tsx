import { ReactNode } from "react";

import Logo from "@/shared/ui/logo";
import { Section } from "@/shared/ui/section";
import Catalog from "@/features/marketing/logos/catalog";
import PictelAI from "@/features/marketing/logos/pictelai";
import CoreOS from "@/features/marketing/logos/coreos";
import EasyTax from "@/features/marketing/logos/easytax";
import Peregrin from "@/features/marketing/logos/peregrin";
import LeapYear from "@/features/marketing/logos/leapyear";
import Marquee from "@/shared/ui/marquee";

interface LogosProps {
  title?: string;
  logos?: ReactNode[] | false;
  duration?: string;
  gap?: string;
  pauseOnHover?: boolean;
  showGradients?: boolean;
  className?: string;
}

export default function Logos({
  title = "Trusted by world's leading companies",
  logos = [
    <Logo
      key="catalog"
      image={Catalog}
      name="Catalog"
      width={171}
      height={54}
      showName={false}
    />,
    <Logo
      key="pictelai"
      image={PictelAI}
      name="PictelAI"
      width={185}
      height={54}
      showName={false}
    />,
    <Logo
      key="coreos"
      image={CoreOS}
      name="CoreOS"
      width={165}
      height={54}
      showName={false}
    />,
    <Logo
      key="easytax"
      image={EasyTax}
      name="EasyTax"
      width={180}
      height={54}
      showName={false}
    />,
    <Logo
      key="peregrin"
      image={Peregrin}
      name="Peregrin"
      width={185}
      height={54}
      showName={false}
    />,
    <Logo
      key="leapyear"
      image={LeapYear}
      name="LeapYear"
      width={185}
      height={54}
      showName={false}
    />,
  ],
  duration = "20s",
  gap = "3rem",
  pauseOnHover = true,
  showGradients = true,
  className,
}: LogosProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 text-center">
        <h2 className="text-md text-muted-foreground font-semibold">{title}</h2>
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Marquee
            pauseOnHover={pauseOnHover}
            className={`[--duration:${duration}] [--gap:${gap}]`}
          >
            {logos}
          </Marquee>
          {showGradients && (
            <>
              <div className="from-background pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-linear-to-r sm:block" />
              <div className="from-background pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-linear-to-l sm:block" />
            </>
          )}
        </div>
      </div>
    </Section>
  );
}
