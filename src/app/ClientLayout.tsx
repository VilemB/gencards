"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--background)",
              color: "var(--text-primary)",
              border: "1px solid var(--neutral-200)",
            },
            success: {
              iconTheme: {
                primary: "var(--primary)",
                secondary: "white",
              },
            },
          }}
        />
      </div>
    </SessionProvider>
  );
}
