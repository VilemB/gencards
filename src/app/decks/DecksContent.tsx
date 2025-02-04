"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Filter, Play, Search, Plus, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";

interface Deck {
  _id: string;
  title: string;
  description: string;
  topic: string;
  cardCount: number;
  userId: string;
  createdAt: string;
}

export default function DecksContent() {
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
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to load decks");
        }

        const data = await response.json();
        setDecks(data.decks);
        setTopics(data.topics);
      } catch (err) {
        console.error("Error loading decks:", err);
        setError("Failed to load decks");
      } finally {
        setIsLoading(false);
      }
    }

    loadDecks();
  }, [currentTopic, currentOwnership, debouncedSearch]);

  const handleTopicChange = (topic: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (topic) {
      params.set("topic", topic);
    } else {
      params.delete("topic");
    }
    router.push(`/decks?${params.toString()}`);
  };

  const handleOwnershipChange = (ownership: string) => {
    const params = new URLSearchParams(searchParams);
    if (ownership !== "all") {
      params.set("ownership", ownership);
    } else {
      params.delete("ownership");
    }
    router.push(`/decks?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`/decks?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
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
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Your Decks
            </h1>
            <Button asChild>
              <Link href="/decks/create" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Deck
              </Link>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search decks..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Ownership Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={currentOwnership === "all" ? "default" : "outline"}
                onClick={() => handleOwnershipChange("all")}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                All Decks
              </Button>
              <Button
                variant={currentOwnership === "my" ? "default" : "outline"}
                onClick={() => handleOwnershipChange("my")}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                By You
              </Button>
              <Button
                variant={currentOwnership === "others" ? "default" : "outline"}
                onClick={() => handleOwnershipChange("others")}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                By Others
              </Button>
            </div>

            {/* Topic Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!currentTopic ? "default" : "outline"}
                onClick={() => handleTopicChange(null)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                All Topics
              </Button>
              {topics.map((topic) => (
                <Button
                  key={topic}
                  variant={currentTopic === topic ? "default" : "outline"}
                  onClick={() => handleTopicChange(topic)}
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Decks Grid */}
        {decks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <div
                key={deck._id}
                className="bg-[var(--neutral-50)] rounded-lg p-6 hover:bg-[var(--neutral-100)] transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <Link
                    href={`/decks/${deck._id}`}
                    className="flex-1 group/title"
                  >
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] group-hover/title:text-[var(--primary)] transition-colors">
                      {deck.title}
                    </h2>
                    <p className="text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {deck.description}
                    </p>
                  </Link>
                  <Link
                    href={`/decks/${deck._id}/study`}
                    className={`
                      inline-flex items-center justify-center rounded-lg
                      w-8 h-8 text-[var(--text-secondary)]
                      hover:text-[var(--primary)] hover:bg-[var(--neutral-200)]
                      transition-colors
                    `}
                  >
                    <Play className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                  <span>{deck.cardCount} cards</span>
                  <span>•</span>
                  <span>{deck.topic}</span>
                  <span>•</span>
                  <span>
                    {new Date(deck.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--text-secondary)]">
              {currentTopic
                ? `No decks found for topic "${currentTopic}"`
                : searchQuery
                ? `No decks found matching "${searchQuery}"`
                : currentOwnership === "my"
                ? "You haven't created any decks yet"
                : currentOwnership === "others"
                ? "No decks from others found"
                : "No decks found"}
            </p>
            {currentOwnership === "my" && !searchQuery && !currentTopic && (
              <Button asChild className="mt-4">
                <Link href="/decks/create">Create Your First Deck</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
