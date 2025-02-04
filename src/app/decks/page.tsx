import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import DecksContent from "./DecksContent";

export default function DecksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <DecksContent />
    </Suspense>
  );
}
