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
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { DeckBreadcrumb } from "@/components/DeckBreadcrumb";
import { motion } from "framer-motion";
import { Deck, Card } from "@/types/deck";
import { CardPreviewModal } from "@/components/ui/CardPreviewModal";
import { useHotkeys } from "react-hotkeys-hook";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateCardsModal } from "@/components/ui/GenerateCardsModal";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  deckId: string;
  deck: Deck;
}

interface CardPreviewProps {
  question: string;
  onClick: () => void;
  index: number;
}

function CardPreview({
  question,
  onClick,
  index,
  card,
  isDragging,
}: CardPreviewProps & { card: Card; isDragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card._id,
  });

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative overflow-hidden cursor-grab active:cursor-grabbing",
        "bg-card hover:bg-accent/50 transition-colors",
        "border border-border rounded-xl",
        "shadow-sm hover:shadow-md",
        isDragging && "opacity-50"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        transform: CSS.Transform.toString(transform),
      }}
    >
      <div
        onClick={onClick}
        className={cn(
          "p-6",
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

// Droppable Subdeck Component
const DroppableSubdeck = ({
  subdeck,
  isDragging,
}: {
  subdeck: Deck;
  isDragging: boolean;
}) => {
  const { setNodeRef } = useDroppable({
    id: `subdeck-${subdeck._id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative p-6 rounded-xl bg-[var(--neutral-50)] border-2 border-transparent transition-all",
        isDragging &&
          "border-dashed border-[var(--primary)] bg-[var(--primary-50)]"
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        <FolderOpen className="h-5 w-5 text-[var(--primary)]" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {subdeck.title}
        </h3>
      </div>
      <p className="text-[var(--text-secondary)] text-sm mb-4">
        {subdeck.description}
      </p>
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <Book className="h-4 w-4" />
        <span>{subdeck.cardCount} cards</span>
      </div>
    </div>
  );
};

// Delete Drop Zone Component
const DeleteDropZone = ({ isDragging }: { isDragging: boolean }) => {
  const { setNodeRef } = useDroppable({ id: "delete-zone" });

  if (!isDragging) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2"
    >
      <div
        ref={setNodeRef}
        className={cn(
          "p-4 rounded-lg bg-red-100 border-2 border-dashed border-red-400 flex items-center gap-2",
          "transition-all duration-200"
        )}
      >
        <Trash2 className="h-5 w-5 text-red-500" />
        <span className="text-red-600 font-medium">Drop to delete</span>
      </div>
    </motion.div>
  );
};

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
  const [responseType, setResponseType] = useState<"simple" | "complex">(
    "complex"
  );
  const [subdecks, setSubdecks] = useState<Deck[]>([]);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    async function loadSubdecks() {
      try {
        const response = await fetch(`/api/decks/${deckId}/subdecks`);
        if (!response.ok) throw new Error("Failed to load subdecks");
        const data = await response.json();
        setSubdecks(data.subdecks);
      } catch (err) {
        console.error("Error loading subdecks:", err);
      }
    }
    loadSubdecks();
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

  const handleAIAssist = async (
    topic: string,
    count: number,
    createNewDeck: boolean,
    responseType: "simple" | "complex"
  ) => {
    if (!deck?.topic) {
      toast.error("No topic found for this deck");
      return;
    }

    setIsGenerating(true);

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
          topic: `${deck.topic} - ${topic}`,
          count,
          createNewDeck,
          responseType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate flashcards");
      }

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (createNewDeck) {
        toast.success("New deck created successfully!");
        router.push(`/decks/${data.deckId}`);
        return;
      }

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
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate flashcards"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = deck?.cards.find((card) => card._id === event.active.id);
    if (card) {
      setActiveCard(card);
      setIsDragging(true);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);

    if (overId === "delete-zone") {
      // Handle card deletion
      try {
        const response = await fetch(
          `/api/decks/${deckId}/cards/${active.id}`,
          {
            method: "DELETE",
          }
        );
        if (!response.ok) throw new Error("Failed to delete card");

        // Update local state
        setDeck((prev) =>
          prev
            ? {
                ...prev,
                cards: prev.cards.filter((card) => card._id !== active.id),
                cardCount: prev.cardCount - 1,
              }
            : null
        );

        toast.success("Card deleted successfully");
      } catch (error) {
        console.error("Failed to delete card:", error);
        toast.error("Failed to delete card");
      }
    } else if (overId.startsWith("subdeck-")) {
      const subdeckId = overId.substring(8); // Remove "subdeck-" prefix
      // Handle moving card to subdeck
      try {
        const response = await fetch(`/api/decks/${subdeckId}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: active.id,
            sourceDeckId: deckId,
          }),
        });
        if (!response.ok) throw new Error("Failed to move card");

        // Update local state
        setDeck((prev) =>
          prev
            ? {
                ...prev,
                cards: prev.cards.filter((card) => card._id !== active.id),
                cardCount: prev.cardCount - 1,
              }
            : null
        );

        toast.success("Card moved to subdeck");
      } catch (error) {
        console.error("Failed to move card:", error);
        toast.error("Failed to move card");
      }
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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

          {/* Subdecks Section */}
          {subdecks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Subdecks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subdecks.map((subdeck) => (
                  <DroppableSubdeck
                    key={subdeck._id}
                    subdeck={subdeck}
                    isDragging={isDragging}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Cards Section with Drag and Drop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deck?.cards
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
                  card={card}
                  isDragging={isDragging}
                />
              ))}
          </div>

          {/* Delete Drop Zone */}
          <DeleteDropZone isDragging={isDragging} />

          {/* Drag Overlay */}
          <DragOverlay>
            {activeCard && (
              <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
                <div className="text-[var(--text-primary)]">
                  {activeCard.front}
                </div>
              </div>
            )}
          </DragOverlay>

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
          ) : null}

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
            onGenerate={handleAIAssist}
            isLoading={isGenerating}
            deckTitle={deck?.topic}
          />
        </div>
      </div>
    </DndContext>
  );
}
