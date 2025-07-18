// components/shared/Sidebar.tsx
"use client";

import type { User } from "@supabase/supabase-js";
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
  X,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Link Configurations ---
const managementLinks = [
  { name: "Connect", href: "/dashboards/connect", icon: Link2 },
  { name: "Pages", href: "/dashboards/pages", icon: FileText },
  { name: "Store", href: "/dashboards/backup", icon: Store },
  { name: "Rollback", href: "/dashboards/rollback", icon: RotateCcw },
  { name: "Logs", href: "/dashboards/logs", icon: ShieldCheck },
];
const supportLinks = [
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
];

// --- NEW PROPS INTERFACE ---
interface SidebarProps {
  user: User | null;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  user,
  isCollapsed,
  isMobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const NavLink = ({
    link,
  }: {
    link: { name: string; href: string; icon: React.ElementType };
  }) => (
    <Link
      href={link.href}
      onClick={onClose} // Close mobile menu on link click
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-black transition-all hover:bg-slate-700 hover:text-white",
        { "bg-slate-700/80 text-white": pathname === link.href },
        { "justify-center": isCollapsed }
      )}
      title={isCollapsed ? link.name : ""}
    >
      <link.icon className="h-5 w-5 shrink-0" />
      <span
        className={cn("overflow-hidden transition-all", { "w-0": isCollapsed })}
      >
        {link.name}
      </span>
    </Link>
  );

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center border-b border-slate-700 px-4 lg:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-white"
        >
          <Archive className="h-6 w-6 text-indigo-400" />
          <span
            className={cn("transition-opacity duration-200 text-black", {
              "opacity-0 w-0": isCollapsed,
            })}
          >
            HubSpot Sync
          </span>
        </Link>
        {/* Use onClose prop for the X button */}
        <button
          onClick={onClose}
          className="ml-auto lg:hidden text-zinc-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>
      <nav className="flex-1 space-y-4 p-2 lg:p-4">
        <div>
          <h2
            className={cn(
              "px-3 mb-2 text-xs font-semibold tracking-wider text-black uppercase",
              { "text-center": isCollapsed }
            )}
          >
            {isCollapsed ? "M" : "Manage"}
          </h2>
          <div className="space-y-1">
            {managementLinks.map((link) => (
              <NavLink key={link.href} link={link} />
            ))}
          </div>
        </div>
        <div>
          <h2
            className={cn(
              "px-3 mb-2 text-xs font-semibold tracking-wider text-zinc-400 uppercase",
              { "text-center": isCollapsed }
            )}
          >
            {isCollapsed ? "S" : "Support"}
          </h2>
          <div className="space-y-1">
            {supportLinks.map((link) => (
              <NavLink key={link.href} link={link} />
            ))}
          </div>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* HAMBURGER BUTTON HAS BEEN REMOVED FROM HERE */}

      {/* Mobile Sidebar (Slide-in) */}
      <AnimatePresence>
        {/* Use isMobileOpen prop from layout */}
        {isMobileOpen && (
          <>
            {/* Use onClose prop for the overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-slate-900 shadow-2xl"
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

      {/* Desktop Sidebar (Collapsible) */}
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-10 lg:flex lg:flex-col bg-slate-100 text-black transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:w-14" : "lg:w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
