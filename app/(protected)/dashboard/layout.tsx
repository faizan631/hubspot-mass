"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Inter } from "next/font/google";
import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const toggleMobileSidebar = () => setMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className={`${inter.className} flex min-h-screen bg-background`}>
      <Sidebar
        user={user}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main
        className={cn(
          "flex-1 flex-col pb-12",
          "transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-64"
        )}
      >
        <Navbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />

        <div className="flex-grow p-4 sm:p-6 lg:p-8 pb-20 bg-slate-50 dark:bg-slate-900/50">
          {children}
        </div>

        <Footer isSidebarCollapsed={isSidebarCollapsed} />
      </main>
    </div>
  );
}
