"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, GitBranch, Book, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Deck {
  _id: string;
  title: string;
  level: number;
  path: string;
}

const DECK_TOPICS = [
  {
    id: "Languages",
    name: "Languages",
    description: "Vocabulary, grammar, and language learning materials",
  },
  {
    id: "Science",
    name: "Science",
    description: "Physics, chemistry, biology, and other scientific topics",
  },
  {
    id: "Mathematics",
    name: "Mathematics",
    description: "Algebra, calculus, geometry, and mathematical concepts",
  },
  {
    id: "History",
    name: "History",
    description: "Historical events, dates, and cultural studies",
  },
  {
    id: "Geography",
    name: "Geography",
    description: "Countries, capitals, landmarks, and geographical features",
  },
  {
    id: "Literature",
    name: "Literature",
    description: "Books, authors, literary terms, and analysis",
  },
  {
    id: "Arts",
    name: "Arts",
    description: "Visual arts, music, theater, and creative studies",
  },
  {
    id: "Technology",
    name: "Technology",
    description: "Programming, computer science, and tech concepts",
  },
  {
    id: "Business",
    name: "Business",
    description: "Economics, management, and business principles",
  },
  { id: "Other", name: "Other", description: "Other educational topics" },
];

export default function CreateDeckPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const parentDeckId = searchParams.get("parentDeckId");
  const initialTopic = searchParams.get("topic") || "Languages";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState(initialTopic);
  const [isPublic, setIsPublic] = useState(false);
  const [parentDeck, setParentDeck] = useState<Deck | null>(null);
  const [availableParentDecks, setAvailableParentDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParentDeck() {
      if (!parentDeckId) return;

      try {
        const response = await fetch(`/api/decks/${parentDeckId}`);
        if (!response.ok) {
          throw new Error("Failed to load parent deck");
        }
        const data = await response.json();
        setParentDeck(data);
      } catch (err) {
        console.error("Error loading parent deck:", err);
      }
    }

    loadParentDeck();
  }, [parentDeckId]);

  useEffect(() => {
    async function loadParentDecks() {
      try {
        const response = await fetch("/api/decks?ownership=my");
        if (!response.ok) {
          throw new Error("Failed to load decks");
        }
        const data = await response.json();
        setAvailableParentDecks(data.decks);
      } catch (err) {
        console.error("Error loading parent decks:", err);
      }
    }

    loadParentDecks();
  }, []);

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
        body: JSON.stringify({
          title,
          description,
          topic,
          isPublic,
          parentDeckId: parentDeckId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create deck");
      }

      const data = await response.json();
      router.push(`/decks/${data._id}`);
    } catch (err) {
      console.error("Error creating deck:", err);
      setError(err instanceof Error ? err.message : "Failed to create deck");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

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
            {parentDeck && (
              <div className="flex items-center gap-2 text-[var(--text-secondary)] bg-[var(--background)] p-3 rounded-lg">
                <GitBranch className="h-4 w-4" />
                <span>Creating subdeck under:</span>
                <span className="font-medium text-[var(--primary)]">
                  {parentDeck.title}
                </span>
              </div>
            )}

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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="e.g., Spanish Vocabulary, Math Formulas"
                required
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[120px]"
                placeholder="Describe what this deck is about..."
                required
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
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
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
                {DECK_TOPICS.find((t) => t.id === topic)?.description}
              </p>
            </div>

            {/* Parent Deck */}
            <div>
              <label
                htmlFor="parentDeck"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Parent Deck (Optional)
              </label>
              <select
                id="parentDeck"
                value={parentDeckId || ""}
                onChange={(e) => setParentDeckId(e.target.value || null)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">No Parent (Top-Level Deck)</option>
                {availableParentDecks.map((deck) => (
                  <option key={deck._id} value={deck._id}>
                    {"  ".repeat(deck.level || 0)}
                    {deck.title}
                    {deck.level > 0 && " (Subdeck)"}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Select a parent deck to create a subdeck
              </p>
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--background)]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label
                  htmlFor="isPublic"
                  className="font-medium text-[var(--text-primary)]"
                >
                  Share with Community
                </label>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Make this deck available to other users
              </p>
            </div>
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 p-4 rounded-lg text-sm">
              {error}
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
