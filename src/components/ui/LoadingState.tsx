import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export function LoadingState({
  title = "Loading",
  message = "Please wait while we prepare your content",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)] mb-4" />
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">{message}</p>
      </div>
    </div>
  );
}
