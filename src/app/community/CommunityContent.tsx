"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, Play, Search, Users, Book, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { LoadingState } from "@/components/ui/LoadingState";

interface Deck {
  _id: string;
  title: string;
  description: string;
  topic: string;
  cardCount: number;
  userId: string;
  createdAt: string;
}

export default function CommunityContent() {
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
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    async function loadPublicDecks() {
      try {
        const params = new URLSearchParams();
        if (currentTopic) params.set("topic", currentTopic);
        if (debouncedSearch) params.set("search", debouncedSearch);

        const url = `/api/decks/public${
          params.toString() ? `?${params.toString()}` : ""
        }`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to load public decks");
        }

        const data = await response.json();
        setDecks(data.decks);
        setTopics(data.topics);
      } catch (err) {
        console.error("Error loading public decks:", err);
        setError("Failed to load public decks");
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicDecks();
  }, [currentTopic, debouncedSearch]);

  const handleTopicChange = (topic: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (topic) {
      params.set("topic", topic);
    } else {
      params.delete("topic");
    }
    router.push(`/community?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`/community?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <LoadingState
        title="Loading Community Decks"
        message="Please wait while we load the community flashcard decks"
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
                <h1 className="text-3xl font-bold mb-2">Community Decks</h1>
                <p className="text-white/80">
                  Discover and learn from decks shared by the community
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <Users className="h-8 w-8" />
              </div>
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
                  <Users className="h-5 w-5" />
                  <h3 className="font-medium">Contributors</h3>
                </div>
                <p className="text-2xl font-bold">
                  {new Set(decks.map((deck) => deck.userId)).size}
                </p>
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

        {/* Search and Filters */}
        <div className="bg-[var(--neutral-50)] rounded-xl p-6 mb-8">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search decks by title or description..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Topic Filter */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                Filter by Topic
              </h3>
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
                    className="rounded-lg"
                  >
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Decks Grid */}
        {decks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <div
                key={deck._id}
                className="group relative overflow-hidden bg-[var(--neutral-50)] rounded-xl hover:bg-[var(--neutral-100)] transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Link
                      href={`/decks/${deck._id}/edit`}
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
                      className="inline-flex items-center justify-center rounded-lg w-8 h-8 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--neutral-200)] transition-colors"
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
                <div className="absolute inset-0 bg-[var(--primary)] opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[var(--neutral-50)] rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] mb-4">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-[var(--text-secondary)]">
              {currentTopic
                ? `No public decks found for topic "${currentTopic}"`
                : searchQuery
                ? `No decks found matching "${searchQuery}"`
                : "No public decks found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
