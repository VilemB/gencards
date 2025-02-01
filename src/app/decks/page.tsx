"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Deck {
  _id: string;
  title: string;
  description: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadDecks() {
      try {
        const response = await fetch("/api/decks");
        if (response.ok) {
          const data = await response.json();
          setDecks(data);
        }
      } catch (error) {
        console.error("Error loading decks:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDecks();
  }, []);

  const filteredDecks = decks.filter((deck) =>
    deck.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            My Decks
          </h1>
          <Button asChild>
            <Link href="/decks/create" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Deck
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search decks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--neutral-200)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>

          {/* Decks List */}
          {filteredDecks.length > 0 ? (
            <div className="grid gap-4">
              {filteredDecks.map((deck) => (
                <div
                  key={deck._id}
                  className="flex items-center justify-between p-4 bg-[var(--neutral-50)] rounded-lg hover:bg-[var(--neutral-100)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Link href={`/decks/${deck._id}`}>
                      <h3 className="font-medium text-[var(--text-primary)] truncate">
                        {deck.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] truncate">
                        {deck.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                        <span>{deck.cardCount} cards</span>
                        <span>•</span>
                        <span>
                          Updated{" "}
                          {new Date(deck.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" asChild>
                      <Link href={`/decks/${deck._id}/study`}>Study</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href={`/decks/${deck._id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {searchQuery ? (
                <>
                  <p className="text-[var(--text-secondary)] mb-2">
                    No decks found matching &quot;{searchQuery}&quot;
                  </p>
                  <Button variant="ghost" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-[var(--text-secondary)] mb-4">
                    You haven&apos;t created any decks yet
                  </p>
                  <Button asChild>
                    <Link href="/decks/create">Create Your First Deck</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
