import { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

import Logo from "@/shared/ui/logo";
import { Section } from "@/shared/ui/section";
import Catalog from "@/features/marketing/logos/catalog";
import PictelAI from "@/features/marketing/logos/pictelai";
import CoreOS from "@/features/marketing/logos/coreos";
import EasyTax from "@/features/marketing/logos/easytax";
import Peregrin from "@/features/marketing/logos/peregrin";
import LeapYear from "@/features/marketing/logos/leapyear";

interface LogoItemProps {
  logo: ReactNode;
}

interface LogosProps {
  title?: string;
  logoItems?: LogoItemProps[];
  className?: string;
}

export default function Logos({
  title = "Trusted by world's leading companies",
  logoItems = [
    {
      logo: (
        <Logo
          image={Catalog}
          name="Catalog"
          width={171}
          height={54}
          showName={false}
        />
      ),
    },
    {
      logo: (
        <Logo
          image={PictelAI}
          name="PictelAI"
          width={185}
          height={54}
          showName={false}
        />
      ),
    },
    {
      logo: (
        <Logo
          image={CoreOS}
          name="CoreOS"
          width={165}
          height={54}
          showName={false}
        />
      ),
    },
    {
      logo: (
        <Logo
          image={EasyTax}
          name="EasyTax"
          width={180}
          height={54}
          showName={false}
        />
      ),
    },
    {
      logo: (
        <Logo
          image={Peregrin}
          name="Peregrin"
          width={185}
          height={54}
          showName={false}
        />
      ),
    },
    {
      logo: (
        <Logo
          image={LeapYear}
          name="LeapYear"
          width={185}
          height={54}
          showName={false}
        />
      ),
    },
  ],
  className,
}: LogosProps) {
  return (
    <Section className={cn(className)}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 text-center">
        <h2 className="text-md text-muted-foreground font-semibold">{title}</h2>
        <div className="bg-border dark:bg-border/20 relative grid w-full auto-rows-fr grid-cols-2 gap-[1px] text-center md:grid-cols-3">
          {logoItems.map((item, index) => (
            <div
              key={index}
              className="bg-background flex aspect-2/1 items-center justify-center p-6"
            >
              {item.logo}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
