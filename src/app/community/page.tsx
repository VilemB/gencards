"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Filter, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Deck {
  _id: string;
  title: string;
  description: string;
  topic: string;
  cardCount: number;
  userId: string;
  createdAt: string;
}

export default function CommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const currentTopic = searchParams.get("topic");

  useEffect(() => {
    async function loadPublicDecks() {
      try {
        const url = currentTopic
          ? `/api/decks/public?topic=${encodeURIComponent(currentTopic)}`
          : "/api/decks/public";

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
  }, [currentTopic]);

  const handleTopicChange = (topic: string | null) => {
    if (topic) {
      router.push(`/community?topic=${encodeURIComponent(topic)}`);
    } else {
      router.push("/community");
    }
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
              Community Decks
            </h1>
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
                    <p className="text-[var(--text-secondary)] mt-1">
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
                ? `No public decks found for topic "${currentTopic}"`
                : "No public decks found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
