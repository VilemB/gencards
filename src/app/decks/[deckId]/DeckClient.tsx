"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Edit,
  Share,
  Trash2,
  Play,
  Book,
  Users,
  Lock,
  Eye,
  Plus,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { DeckBreadcrumb } from "@/components/DeckBreadcrumb";
import { motion } from "framer-motion";
import { Deck } from "@/types/deck";
import { CardPreviewModal } from "@/components/ui/CardPreviewModal";
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateCardsModal } from "@/components/ui/GenerateCardsModal";
import { toast } from "sonner";

interface Props {
  deckId: string;
  deck: Deck;
}

interface CardPreviewProps {
  question: string;
  onClick: () => void;
  index: number;
}

function CardPreview({ question, onClick, index }: CardPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden",
        "bg-card hover:bg-accent/50 transition-colors",
        "border border-border rounded-xl",
        "shadow-sm hover:shadow-md"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div
        onClick={onClick}
        className={cn(
          "p-6 cursor-pointer",
          "transition-all duration-200",
          "hover:translate-y-[-2px]"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
          <div
            dangerouslySetInnerHTML={{ __html: question }}
            className="line-clamp-3"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>Click to preview (Space to flip)</span>
        </div>
      </div>
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-[2px]",
          "bg-gradient-to-r from-primary/40 via-primary to-primary/40",
          "transform scale-x-0 group-hover:scale-x-100",
          "transition-transform duration-200"
        )}
      />
    </motion.div>
  );
}

export default function DeckClient({ deckId, deck: initialDeck }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [deck, setDeck] = useState<Deck | null>(initialDeck);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationCount, setGenerationCount] = useState(5);
  const [generationTopic, setGenerationTopic] = useState("");
  const [responseType, setResponseType] = useState<"simple" | "complex">(
    "complex"
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete deck");
      }

      router.push("/decks");
    } catch (err) {
      console.error("Error deleting deck:", err);
      setError("Failed to delete deck");
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  const handleCardClick = (index: number) => {
    setSelectedCard(index);
    setIsCardFlipped(false);
  };

  const handleClosePreview = () => {
    setSelectedCard(null);
    setIsCardFlipped(false);
  };

  const handleFlipCard = () => {
    setIsCardFlipped(!isCardFlipped);
  };

  const handleNextCard = () => {
    if (deck && selectedCard !== null && selectedCard < deck.cards.length - 1) {
      setSelectedCard(selectedCard + 1);
      setIsCardFlipped(false);
    }
  };

  const handlePreviousCard = () => {
    if (selectedCard !== null && selectedCard > 0) {
      setSelectedCard(selectedCard - 1);
      setIsCardFlipped(false);
    }
  };

  const handleAIAssist = async () => {
    if (!deck?.topic) {
      toast.error("No topic found for this deck");
      return;
    }

    if (!generationTopic) {
      toast.error("Please enter what you want to learn about");
      return;
    }

    setIsGenerating(true);
    setShowGenerateModal(false);

    const loadingToast = toast.loading(
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Generating your flashcards...</span>
      </div>
    );

    try {
      const response = await fetch("/api/decks/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: `${deck.topic} - ${generationTopic}`,
          count: generationCount,
          createNewDeck: false,
          responseType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate flashcards");
      }

      const data = await response.json();
      toast.dismiss(loadingToast);

      // Add the new cards to the deck
      const updatedCards = [...(deck?.cards || []), ...data.cards];

      // Save the changes
      const saveResponse = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...deck,
          cards: updatedCards,
          cardCount: updatedCards.length,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save changes");
      }

      // Show success message
      toast.success(`Generated ${data.cards.length} new flashcards!`);

      // Reload the deck
      const deckResponse = await fetch(`/api/decks/${deckId}`);
      if (!deckResponse.ok) {
        throw new Error("Failed to reload deck");
      }
      const updatedDeck = await deckResponse.json();
      setDeck(updatedDeck);
    } catch (err) {
      console.error("Error generating flashcards:", err);
      toast.dismiss(loadingToast);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate flashcards"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcuts
  useHotkeys("ctrl+f", (e) => {
    e.preventDefault();
    setIsSearchOpen(true);
  });

  useHotkeys("esc", () => {
    if (isSearchOpen) setIsSearchOpen(false);
    if (selectedCard !== null) handleClosePreview();
  });

  useHotkeys("space", (e) => {
    e.preventDefault();
    if (selectedCard !== null) handleFlipCard();
  });

  useHotkeys("left", () => {
    if (selectedCard !== null) handlePreviousCard();
  });

  useHotkeys("right", () => {
    if (selectedCard !== null) handleNextCard();
  });

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-7xl mx-auto">
        <Skeleton className="h-48 w-full rounded-2xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--background)] to-[var(--neutral-50)]">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            {error || "Deck not found"}
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            We couldn&apos;t find the deck you&apos;re looking for. It may have
            been deleted or you may not have permission to view it.
          </p>
          <Button
            onClick={() => router.push("/decks")}
            size="lg"
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Decks
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === deck.userId;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="header-gradient"
        >
          <div className="header-content">
            <DeckBreadcrumb
              deckId={deck._id}
              deckTitle={deck.title}
              currentPage=""
              path={deck.path}
              parentDeckId={
                typeof deck.parentDeckId === "string"
                  ? deck.parentDeckId
                  : deck.parentDeckId?._id
              }
            />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-3 text-white animate-fade-in">
                  {deck.title}
                </h1>
                <p className="text-white/90 text-lg mb-6 max-w-2xl animate-fade-in-delayed">
                  {deck.description}
                </p>
                <div className="flex flex-wrap gap-3 animate-slide-up">
                  <div className="glass-card">
                    <Book className="h-4 w-4 text-white/80" />
                    <span className="text-white/90">
                      {deck.cardCount} cards
                    </span>
                  </div>
                  <div className="glass-card">
                    {deck.isPublic ? (
                      <Users className="h-4 w-4 text-white/80" />
                    ) : (
                      <Lock className="h-4 w-4 text-white/80" />
                    )}
                    <span className="text-white/90">
                      {deck.isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                  <div className="glass-card">
                    <Book className="h-4 w-4 text-white/80" />
                    <span className="text-white/90">{deck.topic}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-6 md:mt-0 animate-slide-up-delayed">
                {isOwner && (
                  <div className="flex flex-row gap-2 w-full">
                    <Button
                      variant="outline"
                      onClick={() => setShowGenerateModal(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-1/2"
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      AI Generate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/decks/create?parentDeckId=${deckId}&topic=${deck?.topic}`
                        )
                      }
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-1/2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subdeck
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/decks/${deckId}/edit`)}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-1/2"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-1/2"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
                <div className="flex flex-row gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-1/2"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  {deck.cards.length > 0 && (
                    <Button
                      onClick={() => router.push(`/decks/${deckId}/study`)}
                      className="bg-white hover:bg-white/90 text-[var(--primary)] font-medium shadow-md animate-fade-in-up w-1/2"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Study Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Decorative background pattern */}
          <div className="header-pattern" />
        </motion.div>

        {/* Search Bar (appears when ctrl+f is pressed) */}
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-4 z-50 mb-4"
          >
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards... (ESC to close)"
                className="w-full px-4 py-3 rounded-lg bg-[var(--foreground)] shadow-lg border border-[var(--neutral-200)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
                autoFocus
              />
            </div>
          </motion.div>
        )}

        {/* Empty State with Enhanced Animation */}
        {deck.cards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="relative z-10 text-center py-20 px-4">
              <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Book className="h-10 w-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                No Cards Yet
              </h2>
              <p className="text-[var(--text-secondary)] text-lg mb-8 max-w-md mx-auto">
                This deck doesn&apos;t have any cards yet.{" "}
                {isOwner &&
                  "Start by adding some cards to begin your learning journey!"}
              </p>
              {isOwner && (
                <Button
                  onClick={() => router.push(`/decks/${deckId}/cards/new`)}
                  size="lg"
                  className="bg-blue-500 hover:bg-blue-600 text-white gap-2 shadow-lg"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Card
                </Button>
              )}
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
            <div className="absolute -left-6 -top-6 w-24 h-24 blur-2xl bg-blue-500/20 rounded-full" />
            <div className="absolute -right-6 -bottom-6 w-24 h-24 blur-2xl bg-indigo-500/20 rounded-full" />
            <motion.div
              className="absolute inset-0 opacity-30"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundImage:
                  "radial-gradient(circle at center, rgba(59, 130, 246, 0.8) 0%, transparent 70%)",
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
          >
            {deck.cards
              .filter((card) =>
                searchQuery
                  ? card.front
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    card.back.toLowerCase().includes(searchQuery.toLowerCase())
                  : true
              )
              .map((card, index) => (
                <CardPreview
                  key={card._id}
                  question={card.front}
                  onClick={() => handleCardClick(index)}
                  index={index}
                />
              ))}
          </motion.div>
        )}

        {/* Enhanced Card Preview Modal */}
        {selectedCard !== null && deck?.cards[selectedCard] && (
          <CardPreviewModal
            isOpen={selectedCard !== null}
            onClose={handleClosePreview}
            currentCard={selectedCard}
            totalCards={deck.cards.length}
            front={deck.cards[selectedCard].front}
            back={deck.cards[selectedCard].back}
            isFlipped={isCardFlipped}
            onFlip={handleFlipCard}
            onPrevious={handlePreviousCard}
            onNext={handleNextCard}
            shortcuts={{
              flip: "Space",
              next: "→",
              previous: "←",
              close: "Esc",
            }}
          />
        )}

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Deck"
          description={
            <p className="text-[var(--text-secondary)]">
              Are you sure you want to delete this deck? This action cannot be
              undone.
            </p>
          }
          onConfirm={handleDelete}
          confirmText={isDeleting ? "Deleting..." : "Delete Deck"}
          isDestructive={true}
          isLoading={isDeleting}
        />

        {/* Share Toast */}
        {showShareToast && (
          <Toast
            message="Link copied to clipboard!"
            onClose={() => setShowShareToast(false)}
          />
        )}

        {/* Generate Cards Modal */}
        <GenerateCardsModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          title="Generate Cards with AI"
          description="Let AI help you create high-quality flashcards for your deck."
          responseType={responseType}
          onResponseTypeChange={setResponseType}
        >
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                What do you want to learn about?
              </label>
              <input
                type="text"
                value={generationTopic}
                onChange={(e) => setGenerationTopic(e.target.value)}
                placeholder="e.g., animals, verbs, food, numbers..."
                className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
              />
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Specify what kind of {deck?.topic} content you want to learn
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Number of Cards
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={generationCount}
                onChange={(e) =>
                  setGenerationCount(
                    Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
                className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
              />
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Choose between 1-20 cards to generate
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowGenerateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAIAssist}
              disabled={isGenerating || !generationTopic}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Cards
                </>
              )}
            </Button>
          </div>
        </GenerateCardsModal>
      </div>
    </div>
  );
}
