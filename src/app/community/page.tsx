"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Loader2, BookOpen, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DECK_TOPICS } from "@/lib/constants";

interface Deck {
  _id: string;
  title: string;
  description: string;
  topic: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    name: string;
    image?: string;
  };
}

export default function CommunityPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [showTopics, setShowTopics] = useState(false);

  useEffect(() => {
    async function loadPublicDecks() {
      try {
        const response = await fetch("/api/decks/public");
        if (response.ok) {
          const data = await response.json();
          setDecks(data);
        }
      } catch (error) {
        console.error("Error loading public decks:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicDecks();
  }, []);

  const filteredDecks = decks.filter((deck) => {
    const matchesSearch = deck.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTopic = !selectedTopic || deck.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Community Decks
            </h1>
            <p className="text-[var(--text-secondary)]">
              Explore and study decks shared by the community
            </p>
          </div>
          <Button asChild>
            <Link href="/decks/create" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Share Your Deck
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search decks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-black w-full pl-10 pr-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowTopics(!showTopics)}
              >
                <Filter className="h-4 w-4" />
                {selectedTopic
                  ? DECK_TOPICS.find((t) => t.id === selectedTopic)?.name
                  : "All Topics"}
              </Button>
              {showTopics && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-[var(--neutral-200)] py-2 z-10">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-[var(--neutral-50)] text-sm"
                    onClick={() => {
                      setSelectedTopic("");
                      setShowTopics(false);
                    }}
                  >
                    All Topics
                  </button>
                  {DECK_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      className="w-full px-4 py-2 text-left hover:bg-[var(--neutral-50)] text-sm"
                      onClick={() => {
                        setSelectedTopic(topic.id);
                        setShowTopics(false);
                      }}
                    >
                      {topic.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Decks Grid */}
          {filteredDecks.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDecks.map((deck) => (
                <Link
                  key={deck._id}
                  href={`/decks/${deck._id}`}
                  className="block bg-[var(--neutral-50)] rounded-lg p-4 hover:bg-[var(--neutral-100)] transition-colors"
                >
                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-[var(--primary-light)] text-[var(--primary)] mb-2">
                    {DECK_TOPICS.find((t) => t.id === deck.topic)?.name}
                  </span>
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {deck.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {deck.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between mt-4 text-sm text-[var(--text-secondary)]">
                    <span>{deck.cardCount} cards</span>
                    <span>by {deck.author.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {searchQuery || selectedTopic ? (
                <>
                  <p className="text-[var(--text-secondary)] mb-2">
                    No decks found with the current filters
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTopic("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <p className="text-[var(--text-secondary)]">
                  No public decks available yet. Be the first to share one!
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
