'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import Sidebar from '@/components/shared/Sidebar'
import Navbar from '@/components/shared/Navbar'
import TopLoader from '@/components/shared/TopLoader'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()
  }, [])

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed)
  const toggleMobileSidebar = () => setMobileMenuOpen(!isMobileMenuOpen)

  return (
    <>
      <TopLoader />
      <div className={`${inter.className} bg-background flex min-h-screen`}>
        {/* ✅ Directly render Sidebar, no ClientOnly */}
        <Sidebar
          user={user}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
        <main
          className={cn(
            'flex-1 transition-all duration-300 ease-in-out',
            isSidebarCollapsed ? 'lg:ml-[70px]' : 'lg:ml-64'
          )}
        >
          <Navbar
            isCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            onToggleMobileSidebar={toggleMobileSidebar}
          />
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
        <Toaster />
      </div>
    </>
  )
}
