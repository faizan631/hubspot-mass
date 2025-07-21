// app/dashboard/layout.tsx
"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";
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
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false); // <-- NEW STATE

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);
  const toggleMobileSidebar = () => setMobileMenuOpen(!isMobileMenuOpen); // <-- NEW HANDLER

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background`}>
        <div className="flex min-h-screen">
          <Sidebar
            user={user}
            isCollapsed={isSidebarCollapsed}
            isMobileOpen={isMobileMenuOpen} // <-- PASS STATE
            onClose={() => setMobileMenuOpen(false)} // <-- PASS HANDLER
          />

          <main
            className={cn(
              "flex-1 transition-all duration-300 ease-in-out",
              isSidebarCollapsed ? "lg:ml-14" : "lg:ml-64"
            )}
          >
            {/* PASS MOBILE TOGGLE HANDLER TO NAVBAR */}
            <Navbar
              onToggleSidebar={toggleSidebar}
              onToggleMobileSidebar={toggleMobileSidebar}
            />
            <div className="p-4 sm:p-6 lg:p-8 bg-gray-50">{children}</div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}