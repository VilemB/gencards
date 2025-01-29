import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <p className="text-4xl font-extrabold text-[var(--primary)] sm:text-5xl">
            404
          </p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-[var(--neutral-200)] sm:pl-6">
              <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight sm:text-5xl">
                Page not found
              </h1>
              <p className="mt-2 text-base text-[var(--text-secondary)]">
                Please check the URL in the address bar and try again.
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link href="/" className="btn-primary">
                Go back home
              </Link>
              <Link href="/contact" className="btn-secondary">
                Contact support
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
