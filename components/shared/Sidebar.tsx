'use client'

import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Archive,
  ShieldCheck,
  // HelpCircle, // <-- REMOVED ICON IMPORT
  X,
  LayoutDashboard,
  ClipboardEdit,
  BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- NEW CORE LINKS --- (Paths updated to singular 'dashboard')
const coreLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Bulk Edits', href: '/dashboard/backup', icon: ClipboardEdit },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart2 },
  // { name: "Pages", href: "/dashboard/pages", icon: FileText },
]

// --- DATA MANAGEMENT LINKS ---
const dataLinks = [
  // { name: "Connect", href: "/dashboard/integrations", icon: Link2 },
  // { name: "Fields", href: "/dashboard/fields", icon: ListFilter }, // <-- 2. ADDED THE NEW LINK
  // { name: "Rollback", href: "/dashboard/rollback", icon: RotateCcw },
  { name: 'Logs', href: '/dashboard/logs', icon: ShieldCheck },
]

// --- SUPPORT LINKS (REMOVED) ---
// const supportLinks = [{ name: 'Help', href: '/dashboard/help', icon: HelpCircle }]

interface SidebarProps {
  user: User | null
  isCollapsed: boolean
  isMobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ user, isCollapsed, isMobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  console.log(user)
  const NavLink = ({ link }: { link: { name: string; href: string; icon: React.ElementType } }) => (
    <Link
      href={link.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition-all group',
        // Logic for active link highlighting
        pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
          ? 'bg-[linear-gradient(to_right,_#66A9EA,_#76E8A2)] text-white shadow-md'
          : 'hover:bg-[linear-gradient(to_right,_#66A9EA22,_#76E8A222)] hover:text-[#66A9EA]',
        isCollapsed && 'justify-center'
      )}
      title={isCollapsed ? link.name : ''}
    >
      <link.icon
        className={cn(
          'h-5 ml-2 w-5 shrink-0 transition-transform group-hover:scale-110',
          (pathname === link.href ||
            (link.href !== '/dashboard' && pathname.startsWith(link.href))) &&
            'text-foreground'
        )}
      />
      <span
        className={cn(
          'overflow-hidden transition-all duration-300',
          isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
        )}
      >
        {link.name}
      </span>
    </Link>
  )

  const SidebarContent = () => (
    <>
      <div className="flex !pl-5 h-16 items-center justify-between border-b px-4">
        <Link
          href="/"
          className="flex items-center gap-6 pt-4 pb-4 font-semibold bg-gradient-to-r from-[#66A9EA] to-[#76E8A2] bg-clip-text text-transparent"
        >
          <Archive className="h-6 w-6 text-green-500" />
          <span className={cn('transition-opacity duration-200', isCollapsed && 'opacity-0 w-0')}>
            Smuves
          </span>
        </Link>
        <button
          onClick={onClose}
          className="ml-auto text-secondary-foreground hover:text-red-500 lg:hidden"
        >
          <X size={24} />
        </button>
      </div>
      <nav className="flex-1 space-y-6 py-4 pl-2 mr-3">
        {/* Render Core Links */}
        <div>
          <h2
            className={cn(
              'mb-2 px-2 text-xs font-bold uppercase tracking-wider text-primary',
              isCollapsed && 'text-center'
            )}
          >
            {isCollapsed ? 'C' : 'Core'}
          </h2>
          <div className="space-y-1">
            {coreLinks.map(link => (
              <NavLink key={link.href} link={link} />
            ))}
          </div>
        </div>

        {/* Render Data Links */}
        <div>
          <h2
            className={cn(
              'mb-2 px-2 text-xs font-bold uppercase tracking-wider text-primary',
              isCollapsed && 'text-center'
            )}
          >
            {isCollapsed ? 'D' : 'Data'}
          </h2>
          <div className="space-y-1">
            {dataLinks.map(link => (
              <NavLink key={link.href} link={link} />
            ))}
          </div>
        </div>

        {/* --- RENDER SUPPORT LINKS (REMOVED) --- */}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile Sidebar */}
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
              className="fixed top-0 left-0 z-50 flex h-full w-64 flex-col rounded-r-2xl bg-background shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:fixed lg:inset-y-0 overflow-y-auto lg:left-0 lg:z-10 lg:flex lg:flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-[70px]' : 'lg:w-64'
        )}
      >
        <div className="flex h-full pl-1 flex-col bg-background/60 backdrop-blur-lg border-slate-200 shadow-md">
          <SidebarContent />
        </div>
      </aside>
    </>
  )
}
