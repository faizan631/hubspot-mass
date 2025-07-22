// app/components/layout/DashboardShell.tsx  <-- CREATE THIS NEW FILE

"use client";

import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import { Inter } from "next/font/google";
import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import CustomProgressBar from "@/components/shared/ProgressBar";
import { cn } from "@/lib/utils";
import type { Theme } from "@/app/actions/userActions";

const inter = Inter({ subsets: ["latin"] });

// This component RECEIVES data as props. It handles all the interactive UI.
export default function DashboardShell({
  children,
  user,
  initialTheme,
}: {
  children: React.ReactNode;
  user: User | null;
  initialTheme: Theme;
}) {
  const { setTheme } = useTheme();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ This is the magic! It applies the theme passed down from the
  // server component as soon as the component mounts.
  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme);
    }
  }, [initialTheme, setTheme]);

  // All your state management functions are here now.
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
    <div className={`${inter.className} flex min-h-screen bg-background`}>
      {isClient && (
        <Sidebar
          user={user} // Use the user from props
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
        <CustomProgressBar />
        <Navbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />
        <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-24 bg-slate-50 dark:bg-slate-900/50">
          {children}
        </main>
        {isClient && <Footer isSidebarCollapsed={isSidebarCollapsed} />}
      </div>
    </div>
  );
}
