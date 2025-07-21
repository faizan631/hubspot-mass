// app/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Inter } from "next/font/google";
import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer"; // 1. IMPORT THE FOOTER
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Note: The <Toaster /> component should ideally be in your root layout (app/layout.tsx)
// to ensure it's available everywhere, but it can stay here if you prefer.

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

  // --- HTML & BODY TAGS REMOVED ---
  // These should only be in your root app/layout.tsx file.
  return (
    <div className={`${inter.className} flex min-h-screen bg-background`}>
      <Sidebar
        user={user}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* 2. ADDED `flex flex-col` TO THE MAIN ELEMENT */}
      <main
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "lg:ml-[70px]" : "lg:ml-64"
        )}
      >
        <Navbar
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />

        {/* 3. ADDED `flex-grow` TO THE CONTENT WRAPPER */}
        <div className="flex-grow p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900/50">
          {children}
        </div>

        {/* 4. ADDED THE FOOTER COMPONENT */}
        <Footer />
      </main>
    </div>
  );
}
