"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Menu,
  LogOut,
  PanelLeftClose,
  Globe,
  User,
  CreditCard,
  Settings,
  Gift,
  Paintbrush,
  Sun,
  Moon,
  Laptop,
  AlertCircle,
  FileText,
  ListChecks,
  LayoutList,
  BookOpen,
  Tags,
  Database,
  Users,
  Plug,
  ArrowRightLeft,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

function getTitleFromPathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "Dashboard";
  const lastPart = parts[parts.length - 1];
  return lastPart.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

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
  const { setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="flex shrink-0 lg:hidden"
        onClick={onToggleMobileSidebar}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle mobile menu</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden shrink-0 lg:flex"
        onClick={onToggleSidebar}
      >
        <PanelLeftClose className="h-6 w-6" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <div className="flex-1">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center justify-end gap-2 md:gap-4">
        <div className="relative hidden w-full max-w-sm md:block">
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-secondary pl-8"
          />
        </div>

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>English</DropdownMenuItem>
            <DropdownMenuItem>اردو (Urdu)</DropdownMenuItem>
            <DropdownMenuItem>Español</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
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
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <Link href="/dashboard/profile">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
            </Link>

            <Link href="/dashboard/billing">
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Upgrade Plan</span>
              </DropdownMenuItem>
            </Link>

            <Link href="/dashboard/referrals">
              <DropdownMenuItem>
                <Gift className="mr-2 h-4 w-4" />
                <span>Referrals</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  Soon
                </Badge>
              </DropdownMenuItem>
            </Link>

            {/* Settings Submenu (MODIFIED) */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {/* --- 1. INTEGRATIONS IS NOW A LINK --- */}
                <Link href="/dashboard/connect">
                  <DropdownMenuItem>
                    <Plug className="mr-2 h-4 w-4" />
                    <span>Integrations</span>
                  </DropdownMenuItem>
                </Link>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ListChecks className="mr-2 h-4 w-4" />
                    <span>Fields</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <Link href="/dashboard/pages">
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Pages
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Redirects
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <LayoutList className="mr-2 h-4 w-4" />
                      Blogs <Badge className="ml-auto text-xs">Soon</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Posts
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="mr-2 h-4 w-4" />
                      Authors <Badge className="ml-auto text-xs">Soon</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Tags className="mr-2 h-4 w-4" />
                      Tags <Badge className="ml-auto text-xs">Soon</Badge>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Database className="mr-2 h-4 w-4" />
                      HubDB Tables{" "}
                      <Badge className="ml-auto text-xs">Soon</Badge>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* --- 2. LOGS MOVED HERE --- */}
                <Link href="/dashboard/logs">
                  <DropdownMenuItem>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    <span>Logs</span>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {/* --- END OF SETTINGS MODIFICATION --- */}

            <DropdownMenuSeparator />

            {/* Theme Switcher */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Paintbrush className="mr-2 h-4 w-4" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

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
