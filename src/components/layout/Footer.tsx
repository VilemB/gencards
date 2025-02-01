"use client";

import Link from "next/link";
import { Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto pt-8 border-t border-[var(--neutral-200)] bg-[var(--neutral-50)]/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center py-6 gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GenCards" className="h-8 w-auto" />
            <div>
              <p className="text-sm text-[var(--text-secondary)]">
                © {new Date().getFullYear()} GenCards.
                <span className="hidden sm:inline"> All rights reserved.</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/yourusername/gencards"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Github className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
