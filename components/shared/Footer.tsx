// components/shared/Footer.tsx
import Link from 'next/link'
import { Youtube, Linkedin } from 'lucide-react'
import { FaTiktok } from 'react-icons/fa' // 1. Import FaTiktok from react-icons

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        {/* Copyright Information */}
        <div className="text-center sm:text-left">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Smuves. All Rights Reserved.
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
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

        {/* --- UPDATED SOCIAL MEDIA ICONS --- */}
        <div className="flex items-center gap-4">
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
            {/* 2. Replaced the old icon with the new one from react-icons */}
            <FaTiktok className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
          </Link>
        </div>
      </div>
    </footer>
  )
}
