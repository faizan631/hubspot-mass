//app/layout:

import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import ProgressBar from "@/components/shared/ProgressBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HubSpot Sheets Sync",
  description:
    "Connect Google Sheets to HubSpot content and sync data seamlessly",
};

// This is the Root Layout. It MUST have <html> and <body>.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children} {/* <== Your DashboardLayout will be rendered here */}
          <Toaster />
          <ProgressBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
