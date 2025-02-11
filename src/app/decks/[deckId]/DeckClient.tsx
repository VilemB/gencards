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
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { DeckBreadcrumb } from "@/components/DeckBreadcrumb";
import { motion, AnimatePresence } from "framer-motion";

interface Card {
  _id: string;
  front: string;
  back: string;
  createdAt: string;
  updatedAt: string;
}

interface Deck {
  _id: string;
  userId: string;
  title: string;
  description: string;
  topic: string;
  isPublic: boolean;
  cardCount: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
  parentDeckId?: string;
  path?: string;
}

interface Props {
  deckId: string;
}

export default function DeckClient({ deckId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[var(--background)] to-[var(--neutral-50)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[var(--primary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] animate-pulse">
            Loading deck...
          </p>
        </div>
      </div>
    );
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
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-8 mb-8">
          <div className="relative z-10">
            <DeckBreadcrumb path={deck.path} parentDeckId={deck.parentDeckId} />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-3 text-white">
                  {deck.title}
                </h1>
                <p className="text-white/90 text-lg mb-6 max-w-2xl">
                  {deck.description}
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                    <Book className="h-4 w-4 text-white/80" />
                    <span className="text-white/90">
                      {deck.cardCount} cards
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                    {deck.isPublic ? (
                      <Users className="h-4 w-4 text-white/80" />
                    ) : (
                      <Lock className="h-4 w-4 text-white/80" />
                    )}
                    <span className="text-white/90">
                      {deck.isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                    <Book className="h-4 w-4 text-white/80" />
                    <span className="text-white/90">{deck.topic}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-6 md:mt-0">
                {isOwner && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/decks/${deckId}/edit`)}
                      className="bg-white/10 border-white/10 hover:bg-white/20 text-white gap-2 backdrop-blur-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-white/10 border-white/10 hover:bg-white/20 text-white gap-2 backdrop-blur-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="bg-white/10 border-white/10 hover:bg-white/20 text-white gap-2 backdrop-blur-sm"
                >
                  <Share className="h-4 w-4" />
                  Share
                </Button>
                {deck.cards.length > 0 && (
                  <Button
                    onClick={() => router.push(`/decks/${deckId}/study`)}
                    className="bg-white hover:bg-white/90 text-blue-600 gap-2 shadow-lg"
                  >
                    <Play className="h-4 w-4" />
                    Study Now
                  </Button>
                )}
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
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-transparent to-indigo-700/30" />
        </div>

        {/* Empty State */}
        {deck.cards.length === 0 ? (
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
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
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {deck.cards.map((card, index) => (
              <motion.div
                key={card._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => handleCardClick(index)}
                >
                  <div
                    className="prose prose-sm max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: card.front }}
                  />
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Eye className="h-4 w-4" />
                    <span>Click to preview</span>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Card Preview Modal */}
        {selectedCard !== null && deck.cards[selectedCard] && (
          <Modal
            isOpen={selectedCard !== null}
            onClose={handleClosePreview}
            title={`Card ${selectedCard + 1} of ${deck.cards.length}`}
            description={
              <div>
                <div
                  className="min-h-[200px] p-6 bg-[var(--neutral-50)] rounded-xl mb-6 cursor-pointer select-none"
                  onClick={handleFlipCard}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isCardFlipped ? "back" : "front"}
                      initial={{ rotateX: -90, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 1 }}
                      exit={{ rotateX: 90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: isCardFlipped
                          ? deck.cards[selectedCard].back
                          : deck.cards[selectedCard].front,
                      }}
                    />
                  </AnimatePresence>
                  <div className="text-center text-sm text-[var(--text-secondary)] mt-4">
                    Click to flip
                  </div>
                </div>
                <div className="flex justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={handlePreviousCard}
                    disabled={selectedCard === 0}
                    className="flex-1 gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextCard}
                    disabled={selectedCard === deck.cards.length - 1}
                    className="flex-1 gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            }
            onConfirm={handleClosePreview}
            confirmText="Close Preview"
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
      </div>
    </div>
  );
}
