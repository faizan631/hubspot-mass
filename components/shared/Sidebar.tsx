"use client";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  FileText,
  Archive,
  RotateCcw,
  ShieldCheck,
  HelpCircle,
  LogOut,
  X,
  Menu,
  Settings,
  User as UserIcon,
  MoreHorizontal,
  ChevronUp,
  Bell,
  AppWindow,
} from "lucide-react";
import clsx from "clsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/auth/actions"; // We'll create this file

// --- Link Configurations (no changes here) ---
const managementLinks = [
  { name: "Connect", href: "/dashboards/connect", icon: Link2 },
  { name: "Pages", href: "/dashboards/pages", icon: FileText },
  { name: "Backup", href: "/dashboards/backup", icon: Archive },
  { name: "Rollback", href: "/dashboards/rollback", icon: RotateCcw },
  { name: "Logs", href: "/dashboards/logs", icon: ShieldCheck },
];
const supportLinks = [
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
];

// --- The New User Profile Dropdown Component ---
function UserProfile({ user }: { user: User }) {
  // Get user's name from metadata or fallback to email
  const userName = user.user_metadata?.full_name || user.email;
  // Get initials for the avatar fallback
  const initials = (userName?.match(/\b\w/g) || [])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function truncateWords(text: string, wordLimit: number) {
    const words = text.split(" ");
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(" ") + "...";
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-zinc-700/50 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-yellow-500 text-black font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 font-medium text-sm text-zinc-200 truncate">
            {userName}
          </span>
          <ChevronUp className="h-4 w-4 text-zinc-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="w-64 mb-2 bg-white/95 backdrop-blur-sm"
      >
        <DropdownMenuLabel className="flex items-start gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-yellow-500 text-black font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold !truncate text-base text-zinc-900">
              {truncateWords(userName, 10)}
            </p>
            <p className="text-xs text-zinc-500">View profile</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="w-4 h-4 mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <AppWindow className="w-4 h-4 mr-2" /> Apps and integrations
        </DropdownMenuItem>
        <DropdownMenuItem className="flex justify-between">
          <span>
            <MoreHorizontal className="w-4 h-4 mr-2 inline" /> More
          </span>
          <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            14
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction} className="w-full">
          <button
            type="submit"
            className="w-full flex items-center gap-2 text-sm px-2 py-1.5 hover:bg-zinc-100 text-zinc-700 rounded-md"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Sidebar({ user }: { user: User | null }) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const NavLink = ({
    link,
    onClick,
  }: {
    link: { name: string; href: string; icon: React.ElementType };
    onClick: () => void;
  }) => (
    <Link href={link.href} onClick={onClick}>
      <motion.div
        className={clsx(
          "flex items-center p-3 my-1 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors relative",
          { "text-white bg-zinc-700/50": pathname === link.href }
        )}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <link.icon className="w-5 h-5 mr-4 shrink-0" />
        <span>{link.name}</span>
        {pathname === link.href && (
          <motion.div
            className="absolute left-0 top-0 h-full w-1 bg-indigo-500 rounded-r-full"
            layoutId="active-indicator"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );

  const SidebarContent = () => (
    <>
      <div className="flex scrollbar items-center justify-between p-4 border-b border-zinc-700">
        <h1 className="text-xl font-bold text-white">HubSpot Sync</h1>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden text-zinc-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-6 scrollbar overflow-y-auto">
        <div>
          <h2 className="px-3 mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            Manage
          </h2>
          {managementLinks.map((link) => (
            <NavLink
              key={link.href}
              link={link}
              onClick={() => setMobileMenuOpen(false)}
            />
          ))}
        </div>
        <div>
          <h2 className="px-3 mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            Support
          </h2>
          {supportLinks.map((link) => (
            <NavLink
              key={link.href}
              link={link}
              onClick={() => setMobileMenuOpen(false)}
            />
          ))}
        </div>
      </nav>

      {/* --- NEW BOTTOM SECTION --- */}
      {user && (
        <div className="p-2 border-t border-zinc-700">
          <div className="flex items-center justify-around p-2">
            <button className="p-2 rounded-md hover:bg-zinc-700/50">
              <Bell className="w-5 h-5 text-zinc-400" />
            </button>
            <button className="p-2 rounded-md hover:bg-zinc-700/50">
              <RotateCcw className="w-5 h-5 text-zinc-400" />
            </button>
            <button className="p-2 rounded-md hover:bg-zinc-700/50">
              <AppWindow className="w-5 h-5 text-zinc-400" />
            </button>
            <button className="p-2 rounded-md hover:bg-zinc-700/50">
              <HelpCircle className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          <UserProfile user={user} />
        </div>
      )}
    </>
  );

  // The return part with AnimatePresence and mobile/desktop logic stays the same
  return (
    <>
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 rounded-md text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 h-full w-72 bg-zinc-900 shadow-2xl z-50 flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:h-screen lg:fixed lg:top-0 lg:left-0 bg-zinc-900 text-white">
        <SidebarContent />
      </aside>
    </>
  );
}
