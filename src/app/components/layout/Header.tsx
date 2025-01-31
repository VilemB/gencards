"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Menu as MenuIcon,
  X,
  Home,
  Library,
  Plus,
  Users,
  User,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";

// Public navigation items
const publicNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Community", href: "/community", icon: Users },
];

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
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-[var(--neutral-200)]"
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
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center gap-3 rounded-lg bg-[var(--primary-light)] px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-light)]/80 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2">
                      <div className="h-7 w-7 rounded-md bg-[var(--primary)] flex items-center justify-center text-white font-medium">
                        {session.user?.name?.[0] || "U"}
                      </div>
                      <span>{session.user?.name?.split(" ")[0]}</span>
                    </Menu.Button>
                    <Transition
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-[var(--neutral-200)] focus:outline-none">
                        <Menu.Item>
                          <Link
                            href="/profile"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--neutral-100)] hover:text-[var(--text-primary)]"
                          >
                            <User className="h-4 w-4" />
                            Your Profile
                          </Link>
                        </Menu.Item>
                        <Menu.Item>
                          <button
                            onClick={() => signOut()}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--error)] hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign out
                          </button>
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/auth/signin" className="btn-primary">
                      Sign in
                    </Link>
                    <Link href="/auth/signup" className="btn-secondary">
                      Sign up
                    </Link>
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
                  <Link
                    href="/auth/signin"
                    className="btn-primary w-full justify-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="btn-secondary w-full justify-center"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
