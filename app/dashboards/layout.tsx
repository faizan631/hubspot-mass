import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/shared/Sidebar";
import Navbar from "@/components/shared/Navbar";
import { createClient } from "@/lib/supabase/server"; // <-- 1. IMPORT SUPABASE

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HubSpot Sheets Sync",
  description:
    "Connect Google Sheets to HubSpot content and sync data seamlessly",
};

// 2. MAKE THE LAYOUT ASYNC
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 3. FETCH THE USER
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 dark:bg-zinc-900`}>
        <div className="flex min-h-screen">
          {/* 4. PASS THE USER TO THE SIDEBAR */}
          <Sidebar user={user} />

          <main className="flex-1 lg:ml-72">
            <Navbar />
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
