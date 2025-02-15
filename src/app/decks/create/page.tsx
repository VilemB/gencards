"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Plus,
  Layers,
  FileText,
  Tag,
  Globe,
  Lock,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    icon: "🗣️",
  },
  {
    id: "Science",
    name: "Science",
    description: "Physics, chemistry, biology, and other scientific topics",
    icon: "🔬",
  },
  {
    id: "Mathematics",
    name: "Mathematics",
    description: "Algebra, calculus, geometry, and mathematical concepts",
    icon: "📐",
  },
  {
    id: "History",
    name: "History",
    description: "Historical events, dates, and cultural studies",
    icon: "📜",
  },
  {
    id: "Geography",
    name: "Geography",
    description: "Countries, capitals, landmarks, and geographical features",
    icon: "🌍",
  },
  {
    id: "Literature",
    name: "Literature",
    description: "Books, authors, literary terms, and analysis",
    icon: "📚",
  },
  {
    id: "Arts",
    name: "Arts",
    description: "Visual arts, music, theater, and creative studies",
    icon: "🎨",
  },
  {
    id: "Technology",
    name: "Technology",
    description: "Programming, computer science, and tech concepts",
    icon: "💻",
  },
  {
    id: "Business",
    name: "Business",
    description: "Economics, management, and business principles",
    icon: "💼",
  },
  {
    id: "Other",
    name: "Other",
    description: "Other educational topics",
    icon: "📌",
  },
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Gradient */}
        <div className="header-gradient mb-12">
          <div className="header-content">
            <div className="flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="mb-4 -ml-4 text-white/80 hover:text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-3xl font-bold mb-2 animate-fade-in">
                  Create New Deck
                </h1>
                <p className="text-white/90 animate-fade-in-delayed">
                  Create a new flashcard deck to start learning
                </p>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 animate-slide-up">
                <Plus className="h-8 w-8" />
              </div>
            </div>
          </div>
          <div className="header-pattern" />
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Parent Deck Selection */}
          <div className="bg-[var(--foreground)] rounded-xl border border-[var(--neutral-200)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                  <Layers className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Parent Deck
                </h2>
              </div>
            </div>
            <div className="p-6">
              <select
                id="parentDeck"
                value={selectedParentDeckId || ""}
                onChange={(e) =>
                  setSelectedParentDeckId(e.target.value || null)
                }
                className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
              >
                <option value="">None (Root Level Deck)</option>
                {availableParentDecks.map((deck) => (
                  <option key={deck._id} value={deck._id}>
                    {deck.title}
                  </option>
                ))}
              </select>
              {selectedParentDeckId && parentDeck && (
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  This deck will be a subdeck of &quot;{parentDeck.title}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-[var(--foreground)] rounded-xl border border-[var(--neutral-200)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                  <FileText className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Basic Information
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  placeholder="Enter deck title..."
                  required
                />
              </div>

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
                  className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[120px] transition-all"
                  placeholder="Describe what this deck is about..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Topic Selection */}
          <div className="bg-[var(--foreground)] rounded-xl border border-[var(--neutral-200)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                  <Tag className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Topic
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {DECK_TOPICS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTopic(t.id)}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-lg border transition-all text-center group hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/50",
                      topic === t.id
                        ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                        : "border-[var(--neutral-200)]"
                    )}
                  >
                    <span className="text-2xl mb-2">{t.icon}</span>
                    <span className="font-medium text-sm">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-[var(--foreground)] rounded-xl border border-[var(--neutral-200)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                  {isPublic ? (
                    <Globe className="h-5 w-5 text-[var(--primary)]" />
                  ) : (
                    <Lock className="h-5 w-5 text-[var(--primary)]" />
                  )}
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Visibility
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)]">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Globe className="h-5 w-5 text-[var(--text-secondary)]" />
                  ) : (
                    <Lock className="h-5 w-5 text-[var(--text-secondary)]" />
                  )}
                  <div>
                    <span className="text-[var(--text-primary)] font-medium">
                      {isPublic ? "Public" : "Private"}
                    </span>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {isPublic
                        ? "Anyone can view this deck"
                        : "Only you can view this deck"}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--neutral-200)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-light)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-500/5 p-4 rounded-lg">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[200px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Deck
                </>
              )}
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
