"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Timer,
  ArrowLeft,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [studyStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [cardScores, setCardScores] = useState<
    Record<string, "good" | "bad" | null>
  >({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    async function loadDeck() {
      try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) {
          throw new Error("Failed to load deck");
        }
        const data = await response.json();
        setDeck(data);
      } catch (err) {
        console.error("Error loading deck:", err);
        setError("Failed to load deck");
      } finally {
        setIsLoading(false);
      }
    }

    loadDeck();
  }, [deckId]);

  // Update elapsed time every second
  useEffect(() => {
    if (isSessionComplete) return; // Don't update if session is complete

    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor(
        (now.getTime() - studyStartTime.getTime()) / 1000
      );
      const minutes = Math.floor(diff / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (diff % 60).toString().padStart(2, "0");
      setElapsedTime(`${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [studyStartTime, isSessionComplete]);

  const handleNext = () => {
    if (currentCardIndex < (deck?.cards.length || 0) - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 200);
    } else {
      // Show completion modal or redirect to results
      handleCompletion();
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
      }, 200);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleScore = (score: "good" | "bad") => {
    if (!deck) return;
    const cardId = deck.cards[currentCardIndex]._id;
    setCardScores((prev) => ({ ...prev, [cardId]: score }));
    // Auto-advance to next card after scoring
    setTimeout(handleNext, 300);
  };

  const handleCompletion = async () => {
    // Stop the timer by setting session complete
    setIsSessionComplete(true);

    // Calculate final time
    const now = new Date();
    const diff = Math.floor((now.getTime() - studyStartTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (diff % 60).toString().padStart(2, "0");
    setElapsedTime(`${minutes}:${seconds}`);

    try {
      // Update user's study streak
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
        console.error("Failed to update study streak");
      }
    } catch (error) {
      console.error("Error updating study streak:", error);
    }

    // Show completion modal
    setShowCompletionModal(true);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      handleFlip();
    } else if (e.code === "ArrowRight" || e.code === "KeyN") {
      handleNext();
    } else if (e.code === "ArrowLeft" || e.code === "KeyP") {
      handlePrevious();
    } else if (e.code === "KeyG") {
      handleScore("good");
    } else if (e.code === "KeyB") {
      handleScore("bad");
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentCardIndex, isFlipped]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
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
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExitModal(true)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-[var(--text-primary)]">
                  {deck.title}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Card {currentCardIndex + 1} of {deck.cards.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKeyboardShortcuts(true)}
                className="hidden sm:flex"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Timer className="h-4 w-4" />
                {elapsedTime}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-[var(--neutral-100)]">
        <motion.div
          className="h-full bg-[var(--primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-transparent to-[var(--neutral-50)]/20">
        <div className="w-full max-w-3xl">
          {/* Card */}
          <div
            className="relative w-full aspect-[3/2] cursor-pointer perspective-1000"
            onClick={handleFlip}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFlipped ? "back" : "front"}
                initial={{ rotateY: isFlipped ? -180 : 0, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 0 : 180, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-0 bg-white rounded-xl shadow-lg p-8 flex flex-col backface-hidden"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className="prose prose-lg max-w-none w-full text-center"
                    dangerouslySetInnerHTML={{
                      __html: isFlipped ? currentCard.back : currentCard.front,
                    }}
                  />
                </div>
                <div className="text-center text-sm text-[var(--text-secondary)] mt-4">
                  Click to flip or press Space
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentCardIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFlipped(false)}
                className="hover:bg-[var(--neutral-100)]"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleScore("bad")}
                className={`hover:bg-red-50 hover:text-red-600 ${
                  cardScores[currentCard._id] === "bad"
                    ? "bg-red-50 text-red-600"
                    : ""
                }`}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleScore("good")}
                className={`hover:bg-green-50 hover:text-green-600 ${
                  cardScores[currentCard._id] === "good"
                    ? "bg-green-50 text-green-600"
                    : ""
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentCardIndex === deck.cards.length - 1}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Stats */}
          <div className="mt-8 flex justify-center gap-8 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>
                Good:{" "}
                {Object.values(cardScores).filter((s) => s === "good").length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>
                Need Review:{" "}
                {Object.values(cardScores).filter((s) => s === "bad").length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--neutral-300)]" />
              <span>
                Remaining: {deck.cards.length - Object.keys(cardScores).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <Modal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        title="Keyboard Shortcuts"
        description={
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Flip Card</span>
              <kbd className="px-2 py-1 bg-[var(--neutral-100)] rounded">
                Space
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Next Card</span>
              <kbd className="px-2 py-1 bg-[var(--neutral-100)] rounded">
                → or N
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Previous Card</span>
              <kbd className="px-2 py-1 bg-[var(--neutral-100)] rounded">
                ← or P
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Mark as Good</span>
              <kbd className="px-2 py-1 bg-[var(--neutral-100)] rounded">G</kbd>
            </div>
            <div className="flex justify-between">
              <span>Mark for Review</span>
              <kbd className="px-2 py-1 bg-[var(--neutral-100)] rounded">B</kbd>
            </div>
          </div>
        }
        confirmText="Got it"
        onConfirm={() => setShowKeyboardShortcuts(false)}
      />

      {/* Exit Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Study Session"
        description="Are you sure you want to exit? Your progress will not be saved."
        confirmText="Exit"
        onConfirm={() => router.push(`/decks/${deckId}`)}
      />

      {/* Completion Modal */}
      <Modal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        title="Study Session Complete!"
        description={
          <div className="space-y-4">
            <p>
              Great job! You&apos;ve completed studying all cards in this deck.
            </p>
            <div className="grid grid-cols-2 gap-4 bg-[var(--neutral-50)] p-4 rounded-lg">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Time
                </p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">
                  {elapsedTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Cards Studied
                </p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">
                  {deck.cards.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Good Cards
                </p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">
                  {
                    Object.values(cardScores).filter(
                      (score) => score === "good"
                    ).length
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Need Review
                </p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">
                  {
                    Object.values(cardScores).filter((score) => score === "bad")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        }
        confirmText="Return to Deck"
        onConfirm={() => router.push(`/decks/${deckId}`)}
      />
    </div>
  );
}
