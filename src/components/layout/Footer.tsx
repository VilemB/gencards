"use client";

import Link from "next/link";
import { Github, Twitter } from "lucide-react";

const navigation = {
  product: [
    { name: "Features", href: "/features" },
    { name: "Community", href: "/community" },
  ],
  support: [
    { name: "Documentation", href: "/docs" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
  social: [
    {
      name: "GitHub",
      href: "https://github.com/VilemB",
      icon: Github,
    },
    {
      name: "X (Twitter)",
      href: "https://twitter.com/barnetvilem",
      icon: Twitter,
    },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--neutral-200)] bg-[var(--background)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            {/* Brand section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="GenCards" className="h-8 w-auto" />
              </div>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                Transform your study experience with AI-powered flashcards for
                smarter learning.
              </p>
              <div className="flex space-x-4">
                {navigation.social.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    aria-label={item.name}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Navigation sections */}
            <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Product
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {navigation.product.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Support
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {navigation.support.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Legal
                </h3>
                <ul className="mt-4 space-y-3">
                  {navigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-12 pt-8 border-t border-[var(--neutral-200)]">
            <p className="text-sm text-[var(--text-secondary)]">
              © {new Date().getFullYear()} GenCards. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
