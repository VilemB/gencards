"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  User,
  Mail,
  Calendar,
  BookOpen,
  Trophy,
  Star,
  Clock,
} from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";

interface UserStats {
  totalDecks: number;
  totalCards: number;
  averageScore: number;
  studyTime: number;
  streak: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<UserStats>({
    totalDecks: 0,
    totalCards: 0,
    averageScore: 0,
    studyTime: 0,
    streak: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      if (!session?.user?.id) return;

      try {
        const response = await fetch(`/api/user/${session.user.id}/stats`);
        if (!response.ok) {
          throw new Error("Failed to load user statistics");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error loading stats:", err);
        setError("Failed to load user statistics");
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [session?.user?.id]);

  if (status === "loading" || isLoading) {
    return (
      <LoadingState
        title="Loading Profile"
        message="Please wait while we load your profile data"
      />
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-8 mb-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
                <p className="text-white/80">
                  View your learning journey and achievements
                </p>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <User className="h-8 w-8" />
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

        {/* User Info */}
        <div className="bg-[var(--neutral-50)] rounded-xl p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
                  <User className="h-12 w-12 text-[var(--primary)]" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {session.user.name}
              </h2>
              <div className="flex items-center gap-4 text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{session.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Decks */}
          <div className="bg-[var(--neutral-50)] rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary-light)] rounded-lg">
                <BookOpen className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-sm">
                  Total Decks
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.totalDecks}
                </p>
              </div>
            </div>
          </div>

          {/* Total Cards */}
          <div className="bg-[var(--neutral-50)] rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary-light)] rounded-lg">
                <Star className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-sm">
                  Total Cards
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.totalCards}
                </p>
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-[var(--neutral-50)] rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary-light)] rounded-lg">
                <Trophy className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-sm">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {stats.averageScore}%
                </p>
              </div>
            </div>
          </div>

          {/* Study Time */}
          <div className="md:col-span-2 lg:col-span-3 bg-[var(--neutral-50)] rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--primary-light)] rounded-lg">
                <Clock className="h-6 w-6 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-sm">
                  Total Study Time
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {Math.floor(stats.studyTime / 60)} hours{" "}
                  {stats.studyTime % 60} minutes
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-[var(--error)] bg-red-50 px-4 py-3 rounded-lg">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
