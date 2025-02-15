"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2, Plus, Book, Trophy, Flame, ArrowRight } from "lucide-react";
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

interface UserPreferences {
  showStreak: boolean;
  cardsPerDay: number;
  theme: "light" | "dark" | "system";
}

interface UserData {
  name: string;
  email: string;
  streak: number;
  lastStudyDate: string | null;
  preferences?: UserPreferences;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [recentDecks, setRecentDecks] = useState<Deck[]>([]);
  const [totalDecks, setTotalDecks] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Load user data
        if (session?.user?.id) {
          const userResponse = await fetch(`/api/user/${session.user.id}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUserData(userData);
          }
        }

        // Load decks created by the user
        const decksResponse = await fetch("/api/decks?ownership=my");
        if (decksResponse.ok) {
          const data = await decksResponse.json();
          setRecentDecks(data.decks.slice(0, 3)); // Get 3 most recent decks
          setTotalDecks(data.decks.length); // Set total number of decks
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [session]);

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
        {/* Welcome Header with Gradient */}
        <div className="header-gradient">
          <div className="header-content">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2 animate-fade-in">
                  Welcome back, {userData?.name || session?.user?.name}!
                </h1>
                <p className="text-white/80 animate-fade-in-delayed">
                  Ready to continue your learning journey?
                </p>
              </div>
              <Button
                asChild
                className="bg-white/90 hover:bg-white text-[var(--primary)] border-0 shadow-md animate-slide-up"
              >
                <Link href="/decks/create" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Deck
                </Link>
              </Button>
            </div>
          </div>
          {/* Decorative background pattern */}
          <div className="header-pattern" />
        </div>

        {/* Stats Grid */}
        <div
          className={`grid gap-6 ${
            userData?.preferences?.showStreak
              ? "md:grid-cols-3"
              : "md:grid-cols-2"
          } mb-8 animate-slide-up-delayed`}
        >
          {/* Total Decks */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[var(--primary-light)] rounded-lg">
                <Book className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Total Decks
              </h2>
            </div>
            <p className="text-4xl font-bold text-[var(--text-primary)]">
              {totalDecks}
            </p>
          </div>

          {/* Cards Mastered */}
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[var(--primary-light)] rounded-lg">
                <Trophy className="h-5 w-5 text-[var(--primary)]" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Cards Mastered
              </h2>
            </div>
            <p className="text-4xl font-bold text-[var(--text-primary)]">0</p>
          </div>

          {/* Study Streak */}
          {userData?.preferences?.showStreak && (
            <div className="stat-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[var(--primary-light)] rounded-lg">
                  <Flame className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Study Streak
                </h2>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-[var(--text-primary)]">
                  {userData?.streak || 0}
                </p>
                <p className="text-[var(--text-secondary)]">
                  {userData?.streak === 1 ? "day" : "days"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Decks */}
        <div className="card animate-fade-in-up">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Recent Decks
            </h2>
            <Button variant="ghost" asChild className="gap-2">
              <Link href="/decks">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {recentDecks.length > 0 ? (
            <div className="grid gap-4">
              {recentDecks.map((deck) => (
                <Link
                  key={deck._id}
                  href={`/decks/${deck._id}`}
                  className="group relative overflow-hidden bg-[var(--background)] rounded-lg p-6 hover:bg-[var(--neutral-100)] transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {deck.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {deck.description}
                      </p>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {deck.cardCount} cards
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-[var(--primary)] opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
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
