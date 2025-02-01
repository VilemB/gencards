"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Predefined topics for decks
export const DECK_TOPICS = [
  {
    id: "languages",
    name: "Languages",
    description: "Vocabulary, grammar, and language learning",
  },
  {
    id: "science-math",
    name: "Science & Math",
    description: "Physics, chemistry, mathematics",
  },
  { id: "biology", name: "Biology", description: "Anatomy, genetics, ecology" },
  {
    id: "history",
    name: "History",
    description: "World history, civilizations, events",
  },
  {
    id: "computer-science",
    name: "Computer Science",
    description: "Programming, algorithms, tech concepts",
  },
  {
    id: "arts",
    name: "Arts & Literature",
    description: "Art history, literature, music",
  },
  {
    id: "business",
    name: "Business",
    description: "Economics, management, finance",
  },
  { id: "other", name: "Other", description: "Other topics" },
] as const;

export type DeckTopic = (typeof DECK_TOPICS)[number]["id"];

export default function CreateDeckPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    topic: "" as DeckTopic,
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

      const data = await response.json();
      router.push(`/decks/${data.deckId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deck");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Plus className="h-6 w-6 text-[var(--primary)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Create New Deck
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Spanish Vocabulary"
                  disabled={isLoading}
                  required
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
                  placeholder="Add a description for your deck..."
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
                  onChange={(e) =>
                    setForm({ ...form, topic: e.target.value as DeckTopic })
                  }
                  className="input w-full"
                  disabled={isLoading}
                  required
                >
                  <option value="">Select a topic</option>
                  {DECK_TOPICS.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {DECK_TOPICS.find((t) => t.id === form.topic)?.description ||
                    "Choose a topic to help others find your deck"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={form.isPublic}
                  onChange={(e) =>
                    setForm({ ...form, isPublic: e.target.checked })
                  }
                  className="rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label
                  htmlFor="isPublic"
                  className="text-sm text-[var(--text-secondary)]"
                >
                  Share this deck with the community
                </label>
              </div>

              {error && (
                <p className="text-sm text-[var(--error)] flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Deck
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
