"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle, Plus, Book, Globe2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DECK_TOPICS } from "@/lib/constants";

interface CreateDeckForm {
  title: string;
  description: string;
  topic: string;
  isPublic: boolean;
}

export default function CreateDeckPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreateDeckForm>({
    title: "",
    description: "",
    topic: "Languages",
    isPublic: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create deck");
      }

      const deck = await response.json();
      router.push(`/decks/${deck._id}`);
    } catch (err) {
      console.error("Error creating deck:", err);
      setError(err instanceof Error ? err.message : "Failed to create deck");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-8 mb-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Create New Deck</h1>
                <p className="text-white/80">
                  Create a new flashcard deck to start learning
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Plus className="h-8 w-8" />
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

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-[var(--neutral-50)] rounded-xl p-6 space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Deck Title
              </label>
              <input
                type="text"
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="e.g., Spanish Vocabulary, Math Formulas"
                required
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[120px]"
                placeholder="Describe what this deck is about..."
                required
                disabled={isLoading}
              />
            </div>

            {/* Topic */}
            <div>
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Topic
              </label>
              <div className="relative">
                <select
                  id="topic"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
                  disabled={isLoading}
                >
                  {DECK_TOPICS.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <Book className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {DECK_TOPICS.find((t) => t.id === form.topic)?.description}
              </p>
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--background)]">
              <div className="p-3 bg-[var(--neutral-100)] rounded-lg">
                {form.isPublic ? (
                  <Globe2 className="h-6 w-6 text-[var(--primary)]" />
                ) : (
                  <Lock className="h-6 w-6 text-[var(--text-secondary)]" />
                )}
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) =>
                      setForm({ ...form, isPublic: e.target.checked })
                    }
                    className="rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    disabled={isLoading}
                  />
                  <span className="font-medium text-[var(--text-primary)]">
                    Share with Community
                  </span>
                </label>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Make this deck available to other users
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[var(--error)] bg-red-50 px-4 py-3 rounded-lg">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Deck
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
