"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import Logo from "@/shared/components/Logo";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";

interface NavbarLink {
  text: string;
  href: string;
}

interface NavbarActionProps {
  text: string;
  href: string;
  variant?: ButtonVariant;
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
  className?: string;
}

export default function Navbar({
  logo = <Logo />,
  name = "Agent Studio",
  homeUrl = "/",
  mobileLinks = [
    { text: "Getting Started", href: "/" },
    { text: "Components", href: "/" },
    { text: "Documentation", href: "/" },
  ],
  actions = [
    { text: "Sign in", href: "/login", isButton: false },
    { text: "Get Started", href: "/signup", isButton: true, variant: "default" },
  ],
  className,
}: NavbarProps) {
  return (
    <header className={cn("sticky top-0 z-50 -mb-4 px-4 pb-4", className)}>
      <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg"></div>
      <div className="max-w-container relative mx-auto">
        <div className="flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href={homeUrl} className="flex items-center gap-2 text-xl font-bold">
              {logo}
              <span>{name}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {actions.map((action, index) =>
              action.isButton ? (
                <Button key={index} variant={action.variant || "default"} asChild>
                  <Link href={action.href}>
                    {action.icon}
                    {action.text}
                    {action.iconRight}
                  </Link>
                </Button>
              ) : (
                <Link key={index} href={action.href} className="hidden text-sm md:block">
                  {action.text}
                </Link>
              ),
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                  <Menu className="size-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="grid gap-6 text-lg font-medium p-4">
                  <Link href={homeUrl} className="flex items-center gap-2 text-xl font-bold">
                    <span>{name}</span>
                  </Link>
                  {mobileLinks.map((link, index) => (
                    <Link key={index} href={link.href} className="text-muted-foreground hover:text-foreground">
                      {link.text}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}


