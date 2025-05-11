import Link from "next/link";
import { ArrowRight, Sparkles, FileText, Users } from "lucide-react";

const features = [
  {
    name: "AI-Powered Generation",
    description:
      "Create comprehensive flashcard sets instantly using our advanced AI technology.",
    icon: Sparkles,
  },
  {
    name: "Document Import",
    description:
      "Upload PDFs and documents to automatically generate relevant flashcard sets.",
    icon: FileText,
  },
  {
    name: "Community Library",
    description:
      "Access and share flashcard sets with a growing community of learners.",
    icon: Users,
  },
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero section */}
      <div className="relative bg-gradient-to-b from-[var(--primary-light)]/30 pb-8">
        <div className="mx-auto max-w-7xl pb-12 pt-10 sm:pb-16 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-32">
          <div className="px-6 lg:px-0 lg:pt-4">
            <div className="mx-auto max-w-2xl">
              <div className="max-w-lg">
                <div className="mt-16 sm:mt-24 lg:mt-0">
                  <div className="inline-flex space-x-6">
                    <span className="rounded-full bg-[var(--primary-light)] px-3 py-1 text-sm font-semibold leading-6 text-[var(--primary)] ring-1 ring-inset ring-[var(--primary)]/20">
                      What&apos;s new
                    </span>
                    <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-[var(--text-secondary)]">
                      <span>Just shipped v1.0</span>
                      <ArrowRight className="h-5 w-5 text-[var(--text-secondary)]" />
                    </span>
                  </div>
                </div>
                <h1 className="mt-10 heading-1">
                  AI-Powered Flashcards for Smarter Learning
                </h1>
                <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">
                  Transform your study experience with GenCards. Our AI-powered
                  platform creates intelligent flashcards from your documents
                  and study materials, making learning more efficient and
                  effective.
                </p>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20">
                    Still in development
                  </span>
                </div>
                <div className="mt-10 flex items-center gap-x-6">
                  <Link href="/auth/signup" className="btn-primary">
                    Get started
                  </Link>
                  <Link
                    href="/features"
                    className="text-sm font-semibold leading-6 text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="flex-1 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base font-semibold leading-7 text-[var(--primary)]">
              Learn faster
            </h2>
            <p className="mt-2 heading-2">
              Everything you need to accelerate your learning
            </p>
            <p className="mt-6 text-lg leading-8 text-[var(--text-secondary)]">
              GenCards combines the power of AI with proven learning techniques
              to help you master any subject more effectively.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-[var(--text-primary)]">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]">
                      <feature.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-[var(--text-secondary)]">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
