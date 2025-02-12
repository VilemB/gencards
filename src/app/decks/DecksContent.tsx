"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Users, Book, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { LoadingState } from "@/components/ui/LoadingState";
import { DeckCard } from "@/components/DeckCard";
import { Deck } from "@/types/deck";

interface DecksContentProps {
  mode?: "personal" | "community";
}

function organizeDecksHierarchy(decks: Deck[]) {
  // Sort decks by path to ensure parents come before children
  return decks.sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    return 0;
  });
}

export default function DecksContent({ mode = "personal" }: DecksContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );

  const currentTopic = searchParams.get("topic");
  const currentOwnership = searchParams.get("ownership") || "all";
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    async function loadDecks() {
      try {
        const params = new URLSearchParams();
        if (currentTopic) params.set("topic", currentTopic);
        if (currentOwnership !== "all")
          params.set("ownership", currentOwnership);
        if (debouncedSearch) params.set("search", debouncedSearch);

        const url = `/api/decks${
          params.toString() ? `?${params.toString()}` : ""
        }`;
        if (mode === "community") {
          params.set("public", "true");
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            mode === "community"
              ? "Failed to load community decks"
              : "Failed to load decks"
          );
        }

        const data = await response.json();
        setDecks(data.decks);
        setTopics(data.topics);
      } catch (err) {
        console.error("Error loading decks:", err);
        setError(
          mode === "community"
            ? "Failed to load community decks"
            : "Failed to load decks"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDecks();
  }, [currentTopic, currentOwnership, debouncedSearch, mode]);

  const handleTopicChange = (topic: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (topic) {
      params.set("topic", topic);
    } else {
      params.delete("topic");
    }
    router.push(
      `${mode === "community" ? "/community" : "/decks"}?${params.toString()}`
    );
  };

  const handleOwnershipChange = (ownership: string) => {
    const params = new URLSearchParams(searchParams);
    if (ownership !== "all") {
      params.set("ownership", ownership);
    } else {
      params.delete("ownership");
    }
    router.push(
      `${mode === "community" ? "/community" : "/decks"}?${params.toString()}`
    );
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(
      `${mode === "community" ? "/community" : "/decks"}?${params.toString()}`
    );
  };

  const organizedDecks = organizeDecksHierarchy(decks);

  if (isLoading) {
    return (
      <LoadingState
        title={
          mode === "community" ? "Loading Community Decks" : "Loading Decks"
        }
        message={
          mode === "community"
            ? "Please wait while we load the community flashcard decks"
            : "Please wait while we load your flashcard decks"
        }
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            {error}
          </h1>
          <Button onClick={() => router.refresh()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-8 mb-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {mode === "community" ? "Community Decks" : "Your Decks"}
                </h1>
                <p className="text-white/80">
                  {mode === "community"
                    ? "Discover and learn from decks shared by the community"
                    : "Manage and study your flashcard collections"}
                </p>
              </div>
              {mode === "personal" ? (
                <Button
                  asChild
                  className="bg-white text-[var(--primary)] hover:bg-white/90"
                >
                  <Link href="/decks/create" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Deck
                  </Link>
                </Button>
              ) : (
                <div className="p-3 bg-white/10 rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Book className="h-5 w-5" />
                  <h3 className="font-medium">Total Decks</h3>
                </div>
                <p className="text-2xl font-bold">{decks.length}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="h-5 w-5" />
                  <h3 className="font-medium">Topics</h3>
                </div>
                <p className="text-2xl font-bold">{topics.length}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {mode === "community" ? (
                    <Users className="h-5 w-5" />
                  ) : (
                    <Clock className="h-5 w-5" />
                  )}
                  <h3 className="font-medium">
                    {mode === "community" ? "Contributors" : "Total Cards"}
                  </h3>
                </div>
                <p className="text-2xl font-bold">
                  {mode === "community"
                    ? new Set(decks.map((deck) => deck.userId)).size
                    : decks.reduce((sum, deck) => sum + deck.cardCount, 0)}
                </p>
              </div>
            </div>
          </div>
          {/* Decorative background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "30px 30px",
              }}
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Search className="h-4 w-4" />
              <span className="text-sm font-medium">
                Search by title or description
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search decks..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--neutral-50)] border border-[var(--neutral-200)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Book className="h-4 w-4" />
              <span className="text-sm font-medium">Filter by topic</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!currentTopic ? "secondary" : "ghost"}
                onClick={() => handleTopicChange(null)}
                className="text-sm"
              >
                All Topics
              </Button>
              {topics.map((topic) => (
                <Button
                  key={topic}
                  variant={currentTopic === topic ? "secondary" : "ghost"}
                  onClick={() => handleTopicChange(topic)}
                  className="text-sm"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Filter by creator</span>
              <span className="text-xs text-[var(--text-secondary)] opacity-75">
                {mode === "community"
                  ? "• See decks created by you or others in the community"
                  : "• See your decks or decks shared by others"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={currentOwnership === "all" ? "secondary" : "ghost"}
                onClick={() => handleOwnershipChange("all")}
                className="text-sm"
              >
                Everyone
              </Button>
              <Button
                variant={currentOwnership === "my" ? "secondary" : "ghost"}
                onClick={() => handleOwnershipChange("my")}
                className="text-sm"
              >
                By Me
              </Button>
              <Button
                variant={currentOwnership === "others" ? "secondary" : "ghost"}
                onClick={() => handleOwnershipChange("others")}
                className="text-sm"
              >
                By Others
              </Button>
            </div>
          </div>
        </div>

        {/* Decks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {organizedDecks.map((deck) => (
            <DeckCard
              key={deck._id}
              deck={deck}
              showActions={true}
              onDelete={
                mode === "personal"
                  ? () => {
                      // Implement delete functionality
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
