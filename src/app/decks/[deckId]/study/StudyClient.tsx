"use client";

import { useEffect, useState } from "react";
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

export default function StudyClient({ deckId }: Props) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [studyStartTime, setStudyStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [goodCards, setGoodCards] = useState<string[]>([]);
  const [badCards, setBadCards] = useState<string[]>([]);

  useEffect(() => {
    async function loadDeck() {
      try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) {
          throw new Error("Failed to load deck");
        }
        const data = await response.json();
        setDeck(data);
        setStudyStartTime(new Date());
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

  const handleNext = () => {
    if (!deck) return;
    if (currentCardIndex < deck.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else {
      handleCompletion();
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleScore = (score: "good" | "bad") => {
    if (!deck) return;
    const cardId = deck.cards[currentCardIndex]._id;
    if (score === "good") {
      setGoodCards([...goodCards, cardId]);
    } else {
      setBadCards([...badCards, cardId]);
    }
    handleNext();
  };

  const handleCompletion = async () => {
    setIsSessionComplete(true);

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

      if (!response.ok) {
        console.error("Failed to update streak");
      }
    } catch (error) {
      console.error("Error updating streak:", error);
    }
  };

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
        {!isSessionComplete ? (
          <div className="space-y-8">
            {/* Card */}
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
                className="w-[100px]"
              >
                Previous
              </Button>
              <div className="flex-1 flex justify-center">
                <Button variant="ghost" onClick={handleFlip}>
                  Click or press Space to flip
                </Button>
              </div>
              {isFlipped ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleScore("bad")}
                    className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                  >
                    Need Review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleScore("good")}
                    className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                  >
                    Got It
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="w-[100px]"
                >
                  Skip
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-[var(--neutral-50)] rounded-xl">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Study Session Complete!
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              Great job! You&apos;ve completed studying all cards in this deck.
            </p>
            <div className="max-w-sm mx-auto grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[var(--background)] rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">
                  {goodCards.length}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Got It</p>
              </div>
              <div className="bg-[var(--background)] rounded-lg p-4">
                <p className="text-2xl font-bold text-red-600">
                  {badCards.length}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Need Review
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push("/decks")}>
                Back to Decks
              </Button>
              <Button onClick={() => router.push(`/decks/${deck._id}`)}>
                View Deck
              </Button>
            </div>
          </div>
        )}
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
