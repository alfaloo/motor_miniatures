"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, Car } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Collection", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Settings", href: "/settings" },
];

interface NavbarProps {
  username: string;
}

export function Navbar({ username }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground mr-6">
          <Car className="h-5 w-5 text-blue-500" />
          Motor Miniatures
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                pathname === link.href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Avatar dropdown (desktop) */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  {username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                <DropdownMenuItem
                  className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-secondary"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background border-border w-64">
                <nav className="flex flex-col gap-1 mt-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        pathname === link.href
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t border-border mt-4 pt-4">
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-red-400 hover:text-red-300 hover:bg-secondary transition-colors"
                    >
                      Log Out
                    </button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
