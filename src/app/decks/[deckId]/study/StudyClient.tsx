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
  accuracy: number;
  streak: number;
  completedAt: Date;
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
  const [analytics, setAnalytics] = useState<StudyAnalytics>({
    totalCards: 0,
    correctCards: 0,
    incorrectCards: 0,
    studyTime: 0,
    averageTimePerCard: 0,
    accuracy: 0,
    streak: 0,
    completedAt: new Date(),
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleCompletion = useCallback(
    async (finalGoodCount?: number) => {
      if (!deck || !studyStartTime) return;

      // First set session complete to stop the timer
      setIsSessionComplete(true);
      setIsAnalyzing(true);

      // Add artificial delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Get the final elapsed time from the timer state
      const [minutes, seconds] = elapsedTime.split(":").map(Number);
      const totalTimeInSeconds = minutes * 60 + seconds;

      // Use passed count or fallback to state
      const correctCards = finalGoodCount ?? goodCards.length;
      const totalCards = deck.cards.length;
      const accuracy = (correctCards / totalCards) * 100;

      const analyticsData: StudyAnalytics = {
        totalCards,
        correctCards,
        incorrectCards: totalCards - correctCards,
        studyTime: totalTimeInSeconds,
        averageTimePerCard:
          totalCards > 0 ? Math.round(totalTimeInSeconds / totalCards) : 0,
        accuracy,
        streak: 0, // Will be updated from API response
        completedAt: new Date(),
      };

      setAnalytics(analyticsData);

      // Save study analytics
      try {
        const analyticsResponse = await fetch(`/api/decks/${deckId}/study`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(analyticsData),
        });

        if (!analyticsResponse.ok) {
          console.error("Failed to save study analytics");
        }
      } catch (error) {
        console.error("Error saving study analytics:", error);
      }

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

      setIsAnalyzing(false);
    },
    [deck, studyStartTime, goodCards, elapsedTime, deckId]
  );

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const handleNext = useCallback(() => {
    if (!deck) return;
    if (currentCardIndex < deck.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
      setCardStartTime(new Date());
    }
  }, [currentCardIndex, deck]);

  const handlePrevious = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  }, [currentCardIndex]);

  const handleScore = useCallback(
    async (score: "good" | "wrong") => {
      if (!deck || !cardStartTime) return;
      const cardId = deck.cards[currentCardIndex]._id;
      const isLastCard = currentCardIndex === deck.cards.length - 1;

      // Update the score first
      if (score === "good") {
        setGoodCards((prev) => {
          const uniqueCards = new Set(prev);
          uniqueCards.add(cardId);
          const newCards = Array.from(uniqueCards);
          // Use the latest state value for completion
          if (isLastCard) {
            setTimeout(() => handleCompletion(newCards.length));
          }
          return newCards;
        });
      } else {
        setGoodCards((prev) => {
          const uniqueCards = new Set(prev);
          uniqueCards.delete(cardId);
          const newCards = Array.from(uniqueCards);
          // Use the latest state value for completion
          if (isLastCard) {
            setTimeout(() => handleCompletion(newCards.length));
          }
          return newCards;
        });
      }

      // If not the last card, proceed to next after a delay
      if (!isLastCard) {
        // First reset the card to front face
        setIsFlipped(false);
        // Wait for the flip animation to complete before moving to next card
        setTimeout(() => {
          handleNext();
        }, 300); // Half of the flip animation duration
      }
    },
    [cardStartTime, currentCardIndex, deck, handleNext, handleCompletion]
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
  // Fix progress calculation to start from 0%
  const progress = (currentCardIndex / deck.cards.length) * 100;

  if (isSessionComplete) {
    if (isAnalyzing) {
      return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center">
          <div className="text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--primary)] mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Analyzing Your Study Session
              </h2>
              <p className="text-[var(--text-secondary)]">
                Crunching the numbers to give you detailed insights...
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[var(--background)] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Completion Header with animation */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-8 mb-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="animate-fade-in">
                  <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
                  <p className="text-white/80">Here&apos;s how you did</p>
                </div>
                <div className="text-right animate-fade-in-delayed">
                  <div className="text-2xl font-bold mb-1">{elapsedTime}</div>
                  <p className="text-white/80">Total Time</p>
                </div>
              </div>
            </div>
            {/* Keep existing decorative background */}
          </div>

          {/* Analytics Grid with animations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-[var(--neutral-50)] rounded-xl p-6 transform transition-all duration-300 hover:scale-105 animate-slide-up">
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
                  <span
                    className={`font-medium ${
                      analytics.accuracy >= 80
                        ? "text-green-500"
                        : analytics.accuracy >= 60
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {analytics.accuracy.toFixed(1)}%
                  </span>
                </div>
                {/* Add accuracy bar */}
                <div className="w-full bg-[var(--neutral-200)] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      analytics.accuracy >= 80
                        ? "bg-green-500"
                        : analytics.accuracy >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${analytics.accuracy}%`,
                    }}
                  />
                </div>
                {/* Add performance message */}
                <p className="text-sm text-[var(--text-secondary)]">
                  {analytics.accuracy >= 80
                    ? "Excellent! Keep up the great work! 🌟"
                    : analytics.accuracy >= 60
                    ? "Good progress! Room for improvement. 💪"
                    : "Keep practicing! You'll get better! 📚"}
                </p>
              </div>
            </div>

            <div className="bg-[var(--neutral-50)] rounded-xl p-6 transform transition-all duration-300 hover:scale-105 animate-slide-up-delayed">
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
                {/* Add time distribution bar */}
                <div className="w-full bg-[var(--neutral-200)] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[var(--primary)] h-full rounded-full transition-all duration-1000"
                    style={{
                      width: "100%",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-[var(--neutral-50)] rounded-xl p-6 transform transition-all duration-300 hover:scale-105 animate-slide-up-more-delayed">
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
                {/* Add streak visualization */}
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                        i < analytics.streak % 8
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--neutral-200)]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons with animations */}
          <div className="flex gap-4 animate-fade-in-up">
            <Button
              variant="outline"
              onClick={() => router.push(`/decks/${deckId}`)}
              className="transition-transform hover:scale-105"
            >
              Back to Deck
            </Button>
            <Button
              onClick={() => router.push("/decks")}
              className="transition-transform hover:scale-105"
            >
              Study Another Deck
            </Button>
          </div>
        </div>

        {/* Add animations */}
        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
          }
          .animate-fade-in-delayed {
            animation: fadeIn 0.5s ease-out 0.2s forwards;
            opacity: 0;
          }
          .animate-slide-up {
            animation: slideUp 0.5s ease-out forwards;
          }
          .animate-slide-up-delayed {
            animation: slideUp 0.5s ease-out 0.2s forwards;
            opacity: 0;
          }
          .animate-slide-up-more-delayed {
            animation: slideUp 0.5s ease-out 0.4s forwards;
            opacity: 0;
          }
          .animate-fade-in-up {
            animation: slideUp 0.5s ease-out 0.6s forwards;
            opacity: 0;
          }
        `}</style>
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
            className="relative w-full aspect-[3/2] perspective-1000 cursor-pointer group"
          >
            <div
              className={`absolute inset-0 transition-transform duration-500 preserve-3d ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden">
                <div className="h-full flex flex-col items-center justify-center p-8 bg-[var(--neutral-50)] rounded-xl border border-[var(--neutral-200)] hover:bg-[var(--neutral-100)] transition-colors">
                  <p className="text-2xl text-[var(--text-primary)] text-center">
                    {currentCard.front}
                  </p>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <kbd className="px-3 py-1 text-sm font-mono bg-[var(--neutral-100)] rounded-lg text-[var(--text-secondary)]">
                      space to flip
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 rotate-y-180 backface-hidden">
                <div className="h-full flex flex-col items-center justify-center p-8 bg-[var(--neutral-50)] rounded-xl border border-[var(--neutral-200)] hover:bg-[var(--neutral-100)] transition-colors">
                  <p className="text-2xl text-[var(--text-primary)] text-center">
                    {currentCard.back}
                  </p>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <kbd className="px-3 py-1 text-sm font-mono bg-[var(--neutral-100)] rounded-lg text-[var(--text-secondary)]">
                      space to flip
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-6">
            {/* Navigation Controls */}
            <div className="flex items-center justify-between w-full max-w-2xl">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentCardIndex === 0}
                className="group relative px-6"
              >
                <span className="flex items-center gap-2">
                  ← Previous
                  <kbd className="hidden group-hover:inline-block absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                    ←
                  </kbd>
                </span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleFlip}
                className="group relative px-6"
              >
                <span className="flex items-center gap-2">
                  {isFlipped ? "Show Front" : "Show Back"}
                  <kbd className="hidden group-hover:inline-block absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                    space
                  </kbd>
                </span>
              </Button>
              {!isFlipped && (
                <Button
                  variant="ghost"
                  onClick={handleNext}
                  disabled={currentCardIndex === deck.cards.length - 1}
                  className="group relative px-6"
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

            {/* Scoring Controls */}
            {isFlipped && (
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleScore("wrong")}
                  className="w-[160px] h-12 group relative hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <span className="flex items-center gap-2">
                    Wrong
                    <kbd className="hidden group-hover:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded">
                      W
                    </kbd>
                  </span>
                </Button>
                <Button
                  onClick={() => handleScore("good")}
                  className="w-[160px] h-12 group relative hover:bg-green-600"
                >
                  <span className="flex items-center gap-2">
                    Good
                    <kbd className="hidden group-hover:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-mono bg-[var(--neutral-100)] rounded-lg">
                      G
                    </kbd>
                  </span>
                </Button>
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Help */}
          <div className="text-center space-y-3 text-sm text-[var(--text-secondary)] bg-[var(--neutral-50)] rounded-xl p-6 mt-8 max-w-2xl mx-auto">
            <p className="font-medium text-[var(--text-primary)] mb-4">
              Keyboard Shortcuts
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--neutral-100)] transition-colors">
                <span>Flip card</span>
                <kbd className="px-3 py-1 text-sm font-mono bg-[var(--neutral-100)] rounded-lg">
                  space
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--neutral-100)] transition-colors">
                <span>Previous card</span>
                <kbd className="px-3 py-1 text-sm font-mono bg-[var(--neutral-100)] rounded-lg">
                  ←
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--neutral-100)] transition-colors">
                <span>Next card</span>
                <kbd className="px-3 py-1 text-sm font-mono bg-[var(--neutral-100)] rounded-lg">
                  →
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--neutral-100)] transition-colors">
                <span>Mark as Good</span>
                <kbd className="px-3 py-1 text-sm font-mono bg-[var(--neutral-100)] rounded-lg">
                  G
                </kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--neutral-100)] transition-colors">
                <span>Mark as Wrong</span>
                <kbd className="px-3 py-1 text-sm font-mono bg-[var(--neutral-100)] rounded-lg">
                  W
                </kbd>
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
