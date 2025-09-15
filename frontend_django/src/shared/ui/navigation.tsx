"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/shared/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";
import Logo from "@/shared/components/Logo";
import { ReactNode, useEffect, useState } from "react";

interface ComponentItem {
  title: string;
  href: string;
  description: string;
}

interface MenuItem {
  title: string;
  href?: string;
  isLink?: boolean;
  content?: ReactNode;
}

interface NavigationProps {
  menuItems?: MenuItem[];
  components?: ComponentItem[];
  logo?: ReactNode;
  logoTitle?: string;
  logoDescription?: string;
  logoHref?: string;
  introItems?: {
    title: string;
    href: string;
    description: string;
  }[];
}

export default function Navigation({
  menuItems = [
    { title: "Home", isLink: true, href: "/" },
    { title: "Workspace", isLink: true, href: "/workspace/chat" },
    { title: "Features", isLink: true, href: "#features" },
    { title: "Integrations", isLink: true, href: "#integrations" },
    { title: "FAQ", isLink: true, href: "#faq" },
    // "Contact" replaced at render-time with GitHub star button
  ],
  components = [
    {
      title: "Alert Dialog",
      href: "/docs/primitives/alert-dialog",
      description:
        "A modal dialog that interrupts the user with important content and expects a response.",
    },
    {
      title: "Hover Card",
      href: "/docs/primitives/hover-card",
      description:
        "For sighted users to preview content available behind a link.",
    },
    {
      title: "Progress",
      href: "/docs/primitives/progress",
      description:
        "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
    },
    {
      title: "Scroll-area",
      href: "/docs/primitives/scroll-area",
      description: "Visually or semantically separates content.",
    },
    {
      title: "Tabs",
      href: "/docs/primitives/tabs",
      description:
        "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
    },
    {
      title: "Tooltip",
      href: "/docs/primitives/tooltip",
      description:
        "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
    },
  ],
  logo = <Logo />,
  logoTitle = "Agent Studio",
  logoDescription = "Build, orchestrate, and control AI agents.",
  logoHref = "/",
  introItems = [
    {
      title: "Features",
      href: "#features",
      description: "What you can do with Agent Studio.",
    },
    {
      title: "Integrations",
      href: "#integrations",
      description: "800+ integrations, 5,000+ tools.",
    },
    {
      title: "FAQ",
      href: "#faq",
      description: "Common questions answered.",
    },
  ],
}: NavigationProps) {
  const repo = "agenticevangelist/agentstudio";
  const computedMenuItems: MenuItem[] = [
    ...menuItems.filter((i) => i.title !== "Contact"),
    { title: "GitHub", isLink: false, content: <GitHubStarLink repo={repo} /> },
  ];
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {computedMenuItems.map((item, index) => (
          <NavigationMenuItem key={index}>
            {item.content && !item.href && !item.isLink ? (
              item.content
            ) : item.isLink ? (
              <Link href={item.href || ""} legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  {item.title}
                </NavigationMenuLink>
              </Link>
            ) : (
              <>
                <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  {item.content === "default" ? (
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="from-muted/30 to-muted/10 flex h-full w-full flex-col justify-end rounded-md bg-linear-to-b p-6 no-underline outline-hidden select-none focus:shadow-md"
                            href={logoHref}
                          >
                            {logo}
                            <div className="mt-4 mb-2 text-lg font-medium">
                              {logoTitle}
                            </div>
                            <p className="text-muted-foreground text-sm leading-tight">
                              {logoDescription}
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      {introItems.map((intro, i) => (
                        <ListItem key={i} href={intro.href} title={intro.title}>
                          {intro.description}
                        </ListItem>
                      ))}
                    </ul>
                  ) : item.content === "components" ? (
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {components.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </ul>
                  ) : (
                    item.content
                  )}
                </NavigationMenuContent>
              </>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({
  className,
  title,
  children,
  ...props
}: React.ComponentProps<"a"> & { title: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          data-slot="list-item"
          className={cn(
            "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline outline-hidden transition-colors select-none",
            className,
          )}
          {...props}
        >
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
}

function GitHubStarLink({ repo }: { repo: string }) {
  const [stars, setStars] = useState<number | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const run = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          signal: controller.signal,
          headers: { Accept: "application/vnd.github+json" },
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      } catch (_) {}
    };
    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [repo]);

  const href = `https://github.com/${repo}`;
  return (
    <Link href={href} target="_blank" rel="noreferrer noopener" legacyBehavior passHref>
      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
        <span className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="currentColor">
            <path fillRule="evenodd" d="M12 .5C5.73.5.98 5.24.98 11.52c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53 0-.26-.01-1.13-.01-2.06-3.05.66-3.69-1.29-3.69-1.29-.5-1.27-1.22-1.6-1.22-1.6-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.67 2.57 1.19 3.2.91.1-.71.38-1.19.69-1.47-2.44-.28-5-1.22-5-5.43 0-1.2.43-2.17 1.13-2.94-.11-.28-.49-1.41.11-2.93 0 0 .93-.3 3.05 1.12.88-.24 1.82-.36 2.75-.36.93 0 1.86.12 2.74.36 2.12-1.42 3.05-1.12 3.05-1.12.6 1.52.22 2.65.11 2.93.7.77 1.13 1.75 1.13 2.94 0 4.22-2.57 5.14-5.01 5.41.4.35.74 1.03.74 2.08 0 1.5-.01 2.7-.01 3.07 0 .29.2.63.75.52 4.36-1.45 7.5-5.57 7.5-10.43C23.02 5.24 18.27.5 12 .5z" clipRule="evenodd" />
          </svg>
          {stars !== null && (
            <span className="text-xs bg-muted px-1.5 py-0.5 tabular-nums">
              {Intl.NumberFormat("en", { notation: "compact" }).format(stars)}
            </span>
          )}
        </span>
      </NavigationMenuLink>
    </Link>
  );
}
