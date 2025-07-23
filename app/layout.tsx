// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import ProgressBar from "@/components/shared/ProgressBar";
import { getUserData } from "@/lib/actions/user"; // adjust the import if needed

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HubSpot Sheets Sync",
  description:
    "Connect Google Sheets to HubSpot content and sync data seamlessly",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = await getUserData(); // 🔑 Fetch user theme from DB

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme={theme}>
          {children}
          <Toaster />
          <ProgressBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
