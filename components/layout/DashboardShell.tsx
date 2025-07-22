"use client";

import { useState, useEffect, useCallback } from "react"; // Added useCallback for best practice
import type { User } from "@supabase/supabase-js";
import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";
// 1. REMOVE the import for the old loader. No longer needed.
// import TopLoader from "@/components/shared/TopLoader";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import Footer from "@/components/shared/Footer"; // Assuming you have a footer

const inter = Inter({ subsets: ["latin"] });

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  // Memoize functions to prevent re-renders
  const toggleSidebar = useCallback(
    () => setSidebarCollapsed((prev) => !prev),
    []
  );
  const toggleMobileSidebar = useCallback(
    () => setMobileMenuOpen((prev) => !prev),
    []
  );
  const closeMobileSidebar = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className={`${inter.className} bg-background flex min-h-screen`}>
      {/* 2. REMOVE the old <TopLoader /> component from here. */}

      {isClient && (
        <Sidebar
          user={user}
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileSidebar}
        />
      )}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-64"
        )}
      >
        <Navbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-24 bg-slate-50 dark:bg-slate-900/50">
          {children}
        </main>
      </div>
      {isClient && <Footer isSidebarCollapsed={isSidebarCollapsed} />}
    </div>
  );
}
