"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Card {
  _id: string;
  front: string;
  back: string;
}

interface Deck {
  _id: string;
  title: string;
  description: string;
  cards: Card[];
}

interface Props {
  deckId: string;
}

interface StudyAnalytics {
  totalCards: number;
  correctCards: number;
  incorrectCards: number;
  studyTime: number;
  averageTimePerCard: number;
  streak: number;
}

export default function StudyClient({ deckId }: Props) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [studyStartTime, setStudyStartTime] = useState<Date | null>(null);
  const [cardStartTime, setCardStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [goodCards, setGoodCards] = useState<string[]>([]);
  const [badCards, setBadCards] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<StudyAnalytics>({
    totalCards: 0,
    correctCards: 0,
    incorrectCards: 0,
    studyTime: 0,
    averageTimePerCard: 0,
    streak: 0,
  });

  const handleCompletion = useCallback(async () => {
    if (!deck || !studyStartTime) return;
    setIsSessionComplete(true);

    // Calculate analytics
    const endTime = new Date();
    const totalTime = Math.floor(
      (endTime.getTime() - studyStartTime.getTime()) / 1000
    );
    const totalCards = deck.cards.length;
    const correctCards = goodCards.length;
    const incorrectCards = badCards.length;

    setAnalytics({
      totalCards,
      correctCards,
      incorrectCards,
      studyTime: totalTime,
      averageTimePerCard: Math.round(totalTime / totalCards),
      streak: 0, // Will be updated from API response
    });

    // Update study streak
    try {
      const response = await fetch("/api/user/streak", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studyDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics((prev) => ({ ...prev, streak: data.streak }));
      }
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  }, [deck, studyStartTime, goodCards, badCards]);

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleNext = useCallback(() => {
    if (!deck) return;
    if (currentCardIndex < deck.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setCardStartTime(new Date());
    } else {
      handleCompletion();
    }
  }, [currentCardIndex, deck, handleCompletion]);

  const handlePrevious = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
      setCardStartTime(new Date());
    }
  }, [currentCardIndex]);

  const handleScore = useCallback(
    (score: "good" | "wrong") => {
      if (!deck || !cardStartTime) return;
      const cardId = deck.cards[currentCardIndex]._id;
      if (score === "good") {
        setGoodCards([...goodCards, cardId]);
      } else {
        setBadCards([...badCards, cardId]);
      }
      handleNext();
    },
    [cardStartTime, currentCardIndex, deck, goodCards, badCards, handleNext]
  );

  useEffect(() => {
    async function loadDeck() {
      try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) {
          throw new Error("Failed to load deck");
        }
        const data = await response.json();
        setDeck(data);
        const startTime = new Date();
        setStudyStartTime(startTime);
        setCardStartTime(startTime);
      } catch (err) {
        console.error("Error loading deck:", err);
        setError("Failed to load deck");
      } finally {
        setIsLoading(false);
      }
    }

    if (deckId) {
      loadDeck();
    }
  }, [deckId]);

  useEffect(() => {
    if (!studyStartTime || isSessionComplete) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - studyStartTime.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [studyStartTime, isSessionComplete]);

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (isSessionComplete) return;

      const shortcut = {
        key: e.code,
        isFlippedRequired: ["Digit1", "KeyG", "Digit2", "KeyW"].includes(
          e.code
        ),
        action: () => {
          switch (e.code) {
            case "Space":
              handleFlip();
              break;
            case "ArrowLeft":
              handlePrevious();
              break;
            case "ArrowRight":
              if (isFlipped) handleNext();
              break;
            case "Digit1":
            case "KeyG":
              handleScore("good");
              break;
            case "Digit2":
            case "KeyW":
              handleScore("wrong");
              break;
          }
        },
      };

      // Only prevent default for navigation keys
      if (["Space", "ArrowLeft", "ArrowRight"].includes(shortcut.key)) {
        e.preventDefault();
      }

      // Only execute if card is flipped when required
      if (
        !shortcut.isFlippedRequired ||
        (shortcut.isFlippedRequired && isFlipped)
      ) {
        shortcut.action();
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    isFlipped,
    isSessionComplete,
    handleFlip,
    handlePrevious,
    handleNext,
    handleScore,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            {error || "Deck not found"}
          </h1>
          <Button onClick={() => router.push("/decks")}>Go Back</Button>
        </div>
      </div>
    );
  }

  const currentCard = deck.cards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / deck.cards.length) * 100;

  if (isSessionComplete) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Completion Header */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-8 mb-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
                  <p className="text-white/80">Here&apos;s how you did</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-1">{elapsedTime}</div>
                  <p className="text-white/80">Total Time</p>
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

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-[var(--neutral-50)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Performance
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Correct</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {analytics.correctCards} / {analytics.totalCards}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Accuracy</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {Math.round(
                      (analytics.correctCards / analytics.totalCards) * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--neutral-50)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Time
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">
                    Total Time
                  </span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {Math.floor(analytics.studyTime / 60)}m{" "}
                    {analytics.studyTime % 60}s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">
                    Avg. per Card
                  </span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {analytics.averageTimePerCard}s
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--neutral-50)] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Streak
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">
                    Current Streak
                  </span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {analytics.streak} days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/decks/${deckId}`)}
            >
              Back to Deck
            </Button>
            <Button onClick={() => router.push("/decks")}>
              Study Another Deck
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-8 mb-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{deck.title}</h1>
                <p className="text-white/80">Study Session</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold mb-1">{elapsedTime}</div>
                <p className="text-white/80">Time Elapsed</p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-white/80">
              <span>
                Card {currentCardIndex + 1} of {deck.cards.length}
              </span>
              <span>{Math.round(progress)}% Complete</span>
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

        {/* Study Card */}
        <div className="space-y-8">
          <div
            onClick={handleFlip}
            className="relative w-full aspect-[3/2] perspective-1000 cursor-pointer"
          >
            <div
              className={`absolute inset-0 transition-transform duration-500 preserve-3d ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden">
                <div className="h-full flex items-center justify-center p-8 bg-[var(--neutral-50)] rounded-xl border border-[var(--neutral-200)] hover:bg-[var(--neutral-100)] transition-colors">
                  <p className="text-xl text-[var(--text-primary)] text-center">
                    {currentCard.front}
                  </p>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 rotate-y-180 backface-hidden">
                <div className="h-full flex items-center justify-center p-8 bg-[var(--neutral-50)] rounded-xl border border-[var(--neutral-200)] hover:bg-[var(--neutral-100)] transition-colors">
                  <p className="text-xl text-[var(--text-primary)] text-center">
                    {currentCard.back}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentCardIndex === 0}
              className="w-[120px] group relative"
            >
              <span className="flex items-center gap-2">
                ← Previous
                <kbd className="hidden group-hover:inline-block absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                  ←
                </kbd>
              </span>
            </Button>
            <div className="flex-1 flex justify-center">
              <Button
                variant="ghost"
                onClick={handleFlip}
                className="group relative"
              >
                <span className="flex items-center gap-2">
                  {isFlipped ? "Show Front" : "Show Back"}
                  <kbd className="hidden group-hover:inline-block absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                    space
                  </kbd>
                </span>
              </Button>
            </div>
            {isFlipped ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleScore("wrong")}
                  className="w-[120px] group relative"
                >
                  <span className="flex items-center gap-2">
                    Wrong
                    <kbd className="hidden group-hover:inline-block absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                      2
                    </kbd>
                  </span>
                </Button>
                <Button
                  onClick={() => handleScore("good")}
                  className="w-[120px] group relative"
                >
                  <span className="flex items-center gap-2">
                    Good
                    <kbd className="hidden group-hover:inline-block absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                      1
                    </kbd>
                  </span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentCardIndex === deck.cards.length - 1}
                className="w-[120px] group relative"
              >
                <span className="flex items-center gap-2">
                  Next →
                  <kbd className="hidden group-hover:inline-block absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                    →
                  </kbd>
                </span>
              </Button>
            )}
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="text-center space-y-2 text-sm text-[var(--text-secondary)] bg-[var(--neutral-50)] rounded-lg p-4 mt-8">
            <p className="font-medium text-[var(--text-primary)]">
              Keyboard Shortcuts
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                  space
                </kbd>
                <span>Flip card</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                  ←
                </kbd>
                <span>Previous card</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                  →
                </kbd>
                <span>Next card</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                  1
                </kbd>
                <span>Mark as Good</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                  2
                </kbd>
                <span>Mark as Wrong</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add global styles for 3D transforms */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
