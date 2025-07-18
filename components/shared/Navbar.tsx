// components/shared/Navbar.tsx
"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";
import { Search, LogOut, PanelLeftClose, Globe, Menu } from "lucide-react"; // Import Menu icon

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getTitleFromPathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "Dashboard";
  const lastPart = parts[parts.length - 1];
  return lastPart.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// NEW PROPS INTERFACE
interface NavbarProps {
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
}

export default function Navbar({
  onToggleSidebar,
  onToggleMobileSidebar,
}: NavbarProps) {
  const pathname = usePathname();
  const pageTitle = getTitleFromPathname(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      {/* Mobile Hamburger Menu Button (NEW) */}
      <Button
        variant="ghost"
        size="icon"
        className="flex shrink-0 lg:hidden" // Show only on small screens
        onClick={onToggleMobileSidebar}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle mobile menu</span>
      </Button>

      {/* Desktop Sidebar Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden shrink-0 lg:flex" // Show only on large screens
        onClick={onToggleSidebar}
      >
        <PanelLeftClose className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Right-side actions */}
      <div className="flex items-center justify-end gap-2 md:gap-4">
        <div className="relative hidden w-full max-w-sm md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-secondary pl-8"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Globe className="h-5 w-5" />
              <span className="sr-only">Change language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>English</DropdownMenuItem>
            <DropdownMenuItem>اردو (Urdu)</DropdownMenuItem>
            <DropdownMenuItem>Español</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/profile">
              <DropdownMenuItem>Profile</DropdownMenuItem>
            </Link>
            <Link href="/dashboard/settings">
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </Link>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
              className="text-red-500 focus:text-red-500 focus:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
