"use client";

import { SessionProvider } from "next-auth/react";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-full flex flex-col">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </SessionProvider>
  );
}
