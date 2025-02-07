"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        {/* Error Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--error)] to-red-700 p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Something Went Wrong
                </h1>
                <p className="text-white/80">
                  We encountered an error while processing your request
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>
          </div>
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "30px 30px",
              }}
            />
          </div>
        </div>

        {/* Error Details */}
        <div className="bg-[var(--neutral-50)] rounded-xl p-6 mt-6">
          <div className="space-y-6">
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-[var(--error)] font-mono text-sm break-all">
                {error.message || "An unexpected error occurred"}
                {error.digest && (
                  <span className="block mt-1 text-xs opacity-75">
                    Error ID: {error.digest}
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-4">
              <p className="text-[var(--text-secondary)]">
                Don&apos;t worry! You can try these options:
              </p>
              <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2">
                <li>Refresh the page and try again</li>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Contact support if the problem persists</li>
              </ul>
              <Button
                onClick={() => reset()}
                className="w-full py-3 gap-2 bg-[var(--error)] hover:bg-red-700"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
