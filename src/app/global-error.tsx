"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
          <div className="max-w-max mx-auto text-center">
            <main>
              <p className="text-4xl font-extrabold text-[var(--primary)] sm:text-5xl mb-4">
                500
              </p>
              <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight sm:text-5xl">
                Application Error
              </h1>
              <p className="mt-4 text-base text-[var(--text-secondary)]">
                Sorry, something went wrong at the application level.
              </p>
              <div className="mt-10 flex justify-center space-x-3">
                <button onClick={reset} className="btn-primary">
                  Try again
                </button>
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
