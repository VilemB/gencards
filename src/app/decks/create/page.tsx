"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Book } from "lucide-react";
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
  const [selectedParentDeckId, setSelectedParentDeckId] = useState<
    string | null
  >(parentDeckId);
  const [parentDeck, setParentDeck] = useState<Deck | null>(null);
  const [availableParentDecks, setAvailableParentDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadParentDeck() {
      if (!selectedParentDeckId) return;

      try {
        const response = await fetch(`/api/decks/${selectedParentDeckId}`);
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
  }, [selectedParentDeckId]);

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
          parentDeckId: selectedParentDeckId,
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Create New Deck
          </h1>
          <p className="text-[var(--text-secondary)] mt-2">
            Create a new flashcard deck to start learning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Deck Selection */}
          <div>
            <label
              htmlFor="parentDeck"
              className="block text-sm font-medium text-[var(--text-primary)]"
            >
              Parent Deck (Optional)
            </label>
            <div className="mt-1">
              <select
                id="parentDeck"
                value={selectedParentDeckId || ""}
                onChange={(e) =>
                  setSelectedParentDeckId(e.target.value || null)
                }
                className="block w-full rounded-md border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="">None (Root Level Deck)</option>
                {availableParentDecks.map((deck) => (
                  <option key={deck._id} value={deck._id}>
                    {deck.title}
                  </option>
                ))}
              </select>
            </div>
            {selectedParentDeckId && parentDeck && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                This deck will be a subdeck of &quot;{parentDeck.title}&quot;
              </p>
            )}
          </div>

          {/* Rest of the form fields */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-[var(--text-primary)]"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
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
