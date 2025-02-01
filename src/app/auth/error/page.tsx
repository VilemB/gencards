"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  return (
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4 text-[var(--error)]">
        <AlertCircle className="h-6 w-6" />
        <h1 className="text-xl font-semibold">Authentication Error</h1>
      </div>
      <p className="text-[var(--text-secondary)] mb-6">
        {error || "An error occurred during authentication. Please try again."}
      </p>
      <div className="flex gap-3">
        <Link href="/auth/signin" className="btn-primary flex-1 justify-center">
          Try Again
        </Link>
        <Link href="/" className="btn-secondary flex-1 justify-center">
          Go Home
        </Link>
      </div>
    </div>
  );
}
export default function AuthError() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading error information…</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
