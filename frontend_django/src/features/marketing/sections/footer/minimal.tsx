import { cn } from "@/shared/lib/utils";

import { ModeToggle } from "@/shared/ui/mode-toggle";
import { Footer, FooterBottom } from "@/shared/ui/footer";

interface FooterLink {
  text: string;
  href: string;
}

interface FooterProps {
  copyright?: string;
  links?: FooterLink[];
  showModeToggle?: boolean;
  className?: string;
}

export default function FooterSection({
  copyright = "© 2025 Company Name. All rights reserved",
  links = [
    { text: "Sign in", href: "#" },
    { text: "Sign up", href: "#" },
    { text: "Privacy Policy", href: "#" },
    { text: "Terms of Service", href: "#" },
  ],
  showModeToggle = true,
  className,
}: FooterProps) {
  return (
    <footer className={cn("bg-background w-full px-4", className)}>
      <div className="max-w-container mx-auto">
        <Footer className="pt-0">
          <FooterBottom className="mt-0 flex flex-col items-center gap-4 sm:flex-col md:flex-row">
            <div>{copyright}</div>
            <div className="flex items-center gap-4">
              {links.slice(0, 2).map((link, index) => (
                <a key={index} href={link.href}>
                  {link.text}
                </a>
              ))}
              {links.length > 2 && "|"}
              {links.slice(2).map((link, index) => (
                <a key={index} href={link.href}>
                  {link.text}
                </a>
              ))}
              {showModeToggle && <ModeToggle />}
            </div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  );
}
