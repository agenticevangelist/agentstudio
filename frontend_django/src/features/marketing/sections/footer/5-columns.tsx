import * as React from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

import {
  Footer,
  FooterColumn,
  FooterBottom,
  FooterContent,
} from "@/shared/ui/footer";

import { SocialIcons } from "@/features/marketing/sections/footer/socials";

interface FooterLink {
  text: string;
  href: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

interface SocialLink {
  icon: React.ElementType<React.SVGProps<SVGSVGElement>>;
  href: string;
  label: string;
}

interface FooterProps {
  logo?: React.ReactNode;
  name?: string;
  columns?: FooterColumnProps[];
  copyright?: string;
  socials?: SocialLink[];
  className?: string;
}

export default function FooterSection({
  logo,
  name = "OctaSpace",
  columns = [
    {
      title: "Product",
      links: [
        { text: "Features", href: "#" },
        { text: "Pricing", href: "#" },
        { text: "Documentation", href: "#" },
        { text: "API", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "Guides", href: "#" },
        { text: "Examples", href: "#" },
        { text: "Webinars", href: "#" },
        { text: "Case Studies", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { text: "About", href: "#" },
        { text: "Blog", href: "#" },
        { text: "Careers", href: "#" },
        { text: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { text: "Privacy Policy", href: "#" },
        { text: "Terms of Service", href: "#" },
        { text: "Cookie Policy", href: "#" },
      ],
    },
  ],
  copyright = "© 2025 OctaSpace. All rights reserved.",
  socials = [
    { icon: SocialIcons.x, href: "https://x.com/octaspace", label: "X" },
    { icon: SocialIcons.github, href: "https://github.com/octaspace", label: "GitHub" },
    { icon: SocialIcons.reddit, href: "https://reddit.com/r/octaspace", label: "Reddit" },
    { icon: SocialIcons.telegram, href: "https://t.me/octaspace", label: "Telegram" },
    { icon: SocialIcons.discord, href: "https://discord.gg/octaspace", label: "Discord" },
    { icon: SocialIcons.medium, href: "https://medium.com/@octaspace", label: "Medium" },
    { icon: SocialIcons.youtube, href: "https://youtube.com/@octaspace", label: "YouTube" },
    { icon: SocialIcons.instagram, href: "https://instagram.com/octaspace", label: "Instagram" },
  ],
  className,
}: FooterProps) {
  return (
    <footer className={cn("bg-background w-full px-4 py-10", className)}>
      <div className="max-w-container mx-auto">
        <Footer className="pt-8">
          <FooterContent className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {columns.map((column, index) => (
              <FooterColumn key={index}>
                <h3 className="text-md pt-1 font-semibold">{column.title}</h3>
                {column.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.href}
                    className="text-muted-foreground text-sm hover:text-foreground transition block mt-2"
                  >
                    {link.text}
                  </a>
                ))}
              </FooterColumn>
            ))}
          </FooterContent>

          {/* Bottom: Logo + Socials + Copyright */}
          <FooterBottom className="mt-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              {logo}
              <h3 className="text-xl font-bold">{name}</h3>
            </div>

            <div className="flex gap-3 mt-2 md:mt-0">
              {socials.map((social, index) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    <span className="sr-only">{social.label}</span>
                    <Icon className="h-6 w-auto sm:h-6 sm:w-auto" />
                  </Link>
                );
              })}
            </div>

            <div className="text-sm text-muted mt-2 md:mt-0">{copyright}</div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  );
}
