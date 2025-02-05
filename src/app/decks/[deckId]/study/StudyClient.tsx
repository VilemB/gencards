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
  const [studyStartTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState("00:00");

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
  }, [studyStartTime]);

  const handleNext = () => {
    if (currentCardIndex < (deck?.cards.length || 0) - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 200);
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

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "Enter") {
      handleFlip();
    } else if (e.code === "ArrowRight") {
      handleNext();
    } else if (e.code === "ArrowLeft") {
      handlePrevious();
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
      <header className="border-b border-[var(--neutral-200)]">
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
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Timer className="h-4 w-4" />
              {elapsedTime}
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
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          {/* Card */}
          <div
            className="relative w-full aspect-[3/2] cursor-pointer"
            onClick={handleFlip}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isFlipped ? "back" : "front"}
                initial={{ rotateY: isFlipped ? -180 : 0, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: isFlipped ? 0 : 180, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-[var(--neutral-50)] rounded-xl p-8 flex flex-col backface-hidden"
                style={{ perspective: 2000 }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className="prose prose-neutral max-w-none w-full"
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
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="text-red-500">
                <ThumbsDown className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="text-green-500">
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
        </div>
      </div>

      {/* Exit Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Exit Study Session"
        description="Are you sure you want to exit? Your progress will not be saved."
        confirmText="Exit"
        onConfirm={() => router.push(`/decks/${deckId}`)}
      />
    </div>
  );
}
