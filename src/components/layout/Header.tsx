"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Disclosure } from "@headlessui/react";
import {
  Menu as MenuIcon,
  X,
  Home,
  Library,
  Plus,
  Users,
  LogOut,
  Settings,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

// Public navigation items
const publicNavigation = [{ name: "Home", href: "/", icon: Home }];

// Protected navigation items (only for authenticated users)
const protectedNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "My Decks", href: "/decks", icon: Library },
  { name: "Create", href: "/decks/create", icon: Plus },
  { name: "Community", href: "/community", icon: Users },
];

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Choose navigation items based on auth status
  const navigation = session ? protectedNavigation : publicNavigation;

  return (
    <Disclosure
      as="nav"
      className="sticky top-0 z-40 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/80 backdrop-blur-sm"
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between items-center">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Link
                    href={session ? "/dashboard" : "/"}
                    className="block py-2"
                  >
                    <img
                      src="/logo-text.png"
                      alt="GenCards"
                      className="h-7 w-auto"
                    />
                  </Link>
                </div>
                <div className="hidden sm:ml-10 sm:flex sm:space-x-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2
                        ${
                          pathname === item.href
                            ? "text-[var(--primary)] bg-[var(--primary-light)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--neutral-100)]"
                        }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:flex sm:items-center sm:gap-2">
                {session ? (
                  <>
                    <Button
                      variant="ghost"
                      asChild
                      className="gap-2 hidden md:flex"
                    >
                      <Link href="/settings">
                        <Settings className="h-5 w-5" />
                        Settings
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => signOut()}
                      className="gap-2"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button asChild>
                      <Link href="/auth/signin">Sign in</Link>
                    </Button>
                    <Button variant="secondary" asChild>
                      <Link href="/auth/signup">Sign up</Link>
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--neutral-100)] hover:text-[var(--text-primary)]">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <X className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-3 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-base font-medium rounded-lg
                    ${
                      pathname === item.href
                        ? "text-[var(--primary)] bg-[var(--primary-light)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--neutral-100)]"
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            {!session && (
              <div className="border-t border-[var(--neutral-200)] px-4 py-4">
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/auth/signin">Sign in</Link>
                  </Button>
                  <Button variant="secondary" asChild>
                    <Link href="/auth/signup">Sign up</Link>
                  </Button>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
