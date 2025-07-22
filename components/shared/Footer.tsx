import Link from "next/link";
import { cn } from "@/lib/utils";

interface FooterProps {
  isSidebarCollapsed: boolean;
}

export default function Footer({ isSidebarCollapsed }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "fixed bottom-0 w-full border-t bg-background z-20",
        "flex flex-row items-center justify-center px-4 py-4 text-center gap-5"
      )}
    >
      <p className="text-sm text-muted-foreground mb-2">
        © {currentYear} HubSpot Sync. All Rights Reserved.
      </p>
      <nav className="flex flex-row justify-center gap-4 mb-2">
        <Link
          href="https://www.smuves.com/terms-of-use"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          Terms of Service
        </Link>
        <Link
          href="https://www.smuves.com/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          Privacy Policy
        </Link>
      </nav>
    </footer>
  );
}
