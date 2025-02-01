"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2, Plus, Book, Trophy, Flame } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Deck {
  _id: string;
  title: string;
  description: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [recentDecks, setRecentDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDecks() {
      try {
        const response = await fetch("/api/decks");
        if (response.ok) {
          const decks = await response.json();
          setRecentDecks(decks.slice(0, 3)); // Get 3 most recent decks
        }
      } catch (error) {
        console.error("Error loading decks:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDecks();
  }, []);

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Welcome back, {session?.user?.name}!
          </h1>
          <Button asChild>
            <Link href="/decks/create" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Deck
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                <Book className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Total Decks
              </h2>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {recentDecks.length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                <Trophy className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Cards Mastered
              </h2>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">0</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[var(--primary-light)] rounded-lg">
                <Flame className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Study Streak
              </h2>
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              0 days
            </p>
          </div>
        </div>

        {/* Recent Decks */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Recent Decks
            </h2>
            <Button variant="ghost" asChild>
              <Link href="/decks">View All</Link>
            </Button>
          </div>

          {recentDecks.length > 0 ? (
            <div className="grid gap-4">
              {recentDecks.map((deck) => (
                <Link
                  key={deck._id}
                  href={`/decks/${deck._id}`}
                  className="block bg-[var(--neutral-50)] rounded-lg p-4 hover:bg-[var(--neutral-100)] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {deck.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {deck.description || "No description"}
                      </p>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {deck.cardCount} cards
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)] mb-4">
                You haven&apos;t created any decks yet
              </p>
              <Button asChild>
                <Link href="/decks/create">Create Your First Deck</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
