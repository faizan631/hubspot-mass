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
  LayoutDashboard,
  ClipboardEdit,
  BarChart2,
  ListFilter,
  Youtube,
  Linkedin,
} from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user?: User | null;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
};

// --- Link configurations ---
const coreLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bulk Edits", href: "/dashboard/backup", icon: ClipboardEdit },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart2 },
  { name: "Pages", href: "/dashboard/pages", icon: FileText },
];
const dataLinks = [
  { name: "Connect", href: "/dashboard/connect", icon: Link2 },
  { name: "Fields", href: "/dashboard/fields", icon: ListFilter },
  { name: "Rollback", href: "/dashboard/rollback", icon: RotateCcw },
  { name: "Logs", href: "/dashboard/logs", icon: ShieldCheck },
];
const supportLinks = [
  { name: "Help", href: "/dashboard/help", icon: HelpCircle },
];

// --- NavLink component ---
const NavLink = ({
  link,
  pathname,
  isCollapsed,
  onClick,
}: {
  link: { name: string; href: string; icon: React.ElementType };
  pathname: string;
  isCollapsed: boolean;
  onClick: () => void;
}) => (
  <Link
    href={link.href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition-all group",
      pathname === link.href ||
        (link.href !== "/dashboard" && pathname.startsWith(link.href))
        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
        : "hover:bg-indigo-100 hover:text-indigo-700 text-slate-700",
      isCollapsed && "justify-center"
    )}
    title={isCollapsed ? link.name : ""}
  >
    <link.icon
      className={cn(
        "h-5 ml-2 w-5 shrink-0 transition-transform group-hover:scale-110",
        (pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href))) &&
          "text-white"
      )}
    />
    <span
      className={cn(
        "overflow-hidden transition-all duration-300",
        isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
      )}
    >
      {link.name}
    </span>
  </Link>
);

// --- SidebarContent component ---
const SidebarContent = ({
  isCollapsed,
  onClose,
  pathname,
}: {
  isCollapsed: boolean;
  onClose: () => void;
  pathname: string;
}) => (
  <>
    <div className="flex !pl-5 h-16 items-center justify-between border-b border-slate-200 px-4">
      <Link
        href="/"
        className="flex items-center gap-2 text-indigo-700 font-semibold"
      >
        <Archive className="h-6 w-6 text-indigo-500" />
        <span
          className={cn(
            "transition-opacity duration-200",
            isCollapsed && "opacity-0 w-0"
          )}
        >
          HubSpot Sync
        </span>
      </Link>
      <button
        onClick={onClose}
        className="ml-auto text-slate-400 hover:text-red-500 lg:hidden"
      >
        <X size={24} />
      </button>
    </div>
    <nav className="flex-1 space-y-6 py-4 pl-2 mr-3">
      <div>
        {!isCollapsed && (
          <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Core
          </h2>
        )}
        <div className="space-y-1">
          {coreLinks.map((link) => (
            <NavLink
              key={link.href}
              link={link}
              pathname={pathname}
              isCollapsed={isCollapsed}
              onClick={onClose}
            />
          ))}
        </div>
      </div>

      <div>
        {!isCollapsed && (
          <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Data
          </h2>
        )}
        <div className="space-y-1">
          {dataLinks.map((link) => (
            <NavLink
              key={link.href}
              link={link}
              pathname={pathname}
              isCollapsed={isCollapsed}
              onClick={onClose}
            />
          ))}
        </div>
      </div>

      <div>
        {!isCollapsed && (
          <h2 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Support
          </h2>
        )}
        <div className="space-y-1">
          {supportLinks.map((link) => (
            <NavLink
              key={link.href}
              link={link}
              pathname={pathname}
              isCollapsed={isCollapsed}
              onClick={onClose}
            />
          ))}
        </div>
      </div>
    </nav>

    
    {!isCollapsed && (
      <div className="mt-auto border-t border-slate-200 p-4">
        <div className="flex items-center justify-start gap-4 pl-2">
          <Link
            href="https://www.youtube.com/@SmuvesHQ"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
          >
            <Youtube className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
          </Link>

          <Link
            href="https://www.linkedin.com/company/smuves"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
          </Link>

          <Link
            href="https://www.tiktok.com/@smuveshq"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <FaTiktok className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
          </Link>
        </div>
      </div>
    )}
  </>
);

// --- Main Sidebar component ---
export default function Sidebar({
  user,
  isCollapsed,
  isMobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col rounded-r-2xl bg-white shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <SidebarContent
                isCollapsed={false}
                onClose={onClose}
                pathname={pathname}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-10 lg:flex lg:flex-col transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:w-[70px]" : "lg:w-64"
        )}
      >
        <div className="flex h-full pl-1 flex-col bg-white/60 backdrop-blur-lg border-r border-slate-200 shadow-md rounded-tr-2xl rounded-br-2xl">
          <SidebarContent
            isCollapsed={isCollapsed}
            onClose={onClose}
            pathname={pathname}
          />
        </div>
      </aside>
    </>
  );
}
