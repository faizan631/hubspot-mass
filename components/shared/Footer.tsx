import Link from "next/link";
import { Youtube, Linkedin } from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import { cn } from "@/lib/utils";

interface FooterProps {
  isSidebarCollapsed: boolean;
}

export default function Footer({ isSidebarCollapsed }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        // The fix is here: added `lg:w-auto` to reset width on large screens
        "fixed bottom-0 right-0 z-30 border-t bg-background px-4 py-3 transition-all duration-300 ease-in-out w-full lg:w-auto",
        isSidebarCollapsed ? "lg:left-[70px]" : "lg:left-64"
      )}
    >
      <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:justify-between">
        {/* Copyright */}
        <p className="text-sm text-muted-foreground text-center md:text-left">
          © {currentYear} HubSpot Sync. All Rights Reserved.
        </p>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-4 text-sm text-muted-foreground">
          <Link
            href="https://www.smuves.com/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary"
          >
            Terms of Service
          </Link>
          <Link
            href="https://www.smuves.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary"
          >
            Privacy Policy
          </Link>
        </nav>

        {/* Social Icons */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href="https://www.youtube.com/@SmuvesHQ"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
          >
            <Youtube className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
          </Link>
          <Link
            href="https://www.linkedin.com/company/smuves"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <Linkedin className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
          </Link>
          <Link
            href="https://www.tiktok.com/@smuveshq"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <FaTiktok className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
