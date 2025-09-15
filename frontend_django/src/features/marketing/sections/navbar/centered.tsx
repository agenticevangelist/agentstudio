"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

import Navigation from "@/shared/ui/navigation";
import { Button, type ButtonProps } from "@/shared/ui/button";
import {
  Navbar as NavbarComponent,
  NavbarLeft,
  NavbarRight,
} from "@/shared/ui/navbar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import Logo from "@/shared/components/Logo";
//

interface NavbarLink {
  text: string;
  href: string;
}

interface NavbarActionProps {
  text: string;
  href: string;
  variant?: ButtonProps["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
  isButton?: boolean;
}

interface NavbarProps {
  logo?: ReactNode;
  name?: string;
  homeUrl?: string;
  mobileLinks?: NavbarLink[];
  actions?: NavbarActionProps[];
  showNavigation?: boolean;
  customNavigation?: ReactNode;
  className?: string;
}

export default function Navbar({
  logo = <Logo />,
  name = "Agent Studio",
  homeUrl = "/",
  mobileLinks = [
    { text: "Home", href: "/" },
    { text: "Workspace", href: "/workspace/chat" },
    { text: "Features", href: "#features" },
    { text: "Integrations", href: "#integrations" },
    { text: "FAQ", href: "#faq" },
  ],
  actions = [
    { text: "Sign in", href: "/login", isButton: false },
    { text: "Get Started", href: "/signup", isButton: true, variant: "default" },
  ],
  showNavigation = true,
  customNavigation,
  className,
}: NavbarProps) {
  return (
    <>
      <header className={cn("absolute top-0 z-50 w-full p-2 pointer-events-auto", className)}>
        <div className="max-w-container mx-auto">
          <NavbarComponent className="p-2">
            <NavbarLeft className="pointer-events-auto">
              <Link
                href={homeUrl}
                className="flex items-center gap-2 text-xl font-bold"
              >
                {logo}
                {name}
              </Link>
            </NavbarLeft>
            <NavbarRight className="pointer-events-auto">
              {actions.map((action, index) =>
                action.isButton ? (
                  <Button
                    key={index}
                    variant={action.variant || "default"}
                    asChild
                  >
                    <Link href={action.href}>
                      {action.icon}
                      {action.text}
                      {action.iconRight}
                    </Link>
                  </Button>
                ) : (
                  <Link
                    key={index}
                    href={action.href}
                    className="hidden text-sm md:block"
                  >
                    {action.text}
                  </Link>
                ),
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 md:hidden"
                  >
                    <span className="size-5 block" aria-hidden>
                      ≡
                    </span>
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="grid gap-6 text-lg font-medium p-4">
                    <Link
                      href={homeUrl}
                      className="flex items-center gap-2 text-xl font-bold"
                    >
                      <span>{name}</span>
                    </Link>
                    {mobileLinks.map((link, index) => (
                      <Link
                        key={index}
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {link.text}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </NavbarRight>
          </NavbarComponent>
        </div>
      </header>
      {showNavigation && (
        <div className="max-w-container pointer-events-none sticky top-0 z-[60] mx-auto hidden items-center justify-center p-3 md:flex">
          <NavbarComponent className="pointer-events-auto bg-background/30 border-border dark:border-border/15 rounded-xl border p-1 backdrop-blur-lg">
            {customNavigation || <Navigation />}
          </NavbarComponent>
        </div>
      )}
    </>
  );
}
