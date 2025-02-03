"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle } from "lucide-react";
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Create New Deck
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Create a new flashcard deck to start learning
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Deck Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Spanish Vocabulary, Math Formulas"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="input w-full min-h-[100px]"
                  placeholder="Describe what this deck is about..."
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Topic
                </label>
                <select
                  id="topic"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="input w-full"
                  disabled={isLoading}
                >
                  {DECK_TOPICS.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {DECK_TOPICS.find((t) => t.id === form.topic)?.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={form.isPublic}
                  onChange={(e) =>
                    setForm({ ...form, isPublic: e.target.checked })
                  }
                  className="rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  disabled={isLoading}
                />
                <div>
                  <label
                    htmlFor="isPublic"
                    className="font-medium text-[var(--text-primary)]"
                  >
                    Share with Community
                  </label>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Make this deck available to other users
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-[var(--error)] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
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
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Deck
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
