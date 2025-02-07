"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Edit, Share, Trash2, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import Link from "next/link";

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

  const isOwner = session?.user?.id === deck.userId;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with gradient background */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] p-8 mb-8 text-white">
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{deck.title}</h1>
                <p className="text-white/80">{deck.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {isOwner ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={handleShare}
                      className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none"
                    >
                      <Share className="h-4 w-4" />
                      Share
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/decks/${deck._id}/edit`)}
                      className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteModal(true)}
                      className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={handleShare}
                    className="gap-2 bg-white/10 hover:bg-white/20 text-white border-none"
                  >
                    <Share className="h-4 w-4" />
                    Share
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                asChild
                className="bg-white text-[var(--primary)] hover:bg-white/90"
              >
                <Link href={`/decks/${deck._id}/study`} className="gap-2">
                  <Play className="h-4 w-4" />
                  Study Now
                </Link>
              </Button>
              <div className="flex items-center gap-4 text-sm text-white/80">
                <span>{deck.cardCount} cards</span>
                <span>•</span>
                <span>
                  Created{" "}
                  {new Date(deck.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
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

        {/* Cards Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Cards
            </h2>
            {isOwner && deck.cards.length === 0 && (
              <Button asChild>
                <Link href={`/decks/${deck._id}/edit`}>Add Cards</Link>
              </Button>
            )}
          </div>

          {deck.cards?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deck.cards.map((card, index) => (
                <div
                  key={card._id}
                  onClick={() => handleCardClick(index)}
                  className="group relative overflow-hidden bg-[var(--neutral-50)] rounded-lg p-6 hover:bg-[var(--neutral-100)] transition-all duration-200 cursor-pointer hover:shadow-lg"
                >
                  <div className="mb-4">
                    <h3 className="font-medium text-[var(--text-primary)] mb-1">
                      Front
                    </h3>
                    <p className="text-[var(--text-secondary)] line-clamp-2">
                      {card.front}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)] mb-1">
                      Back
                    </h3>
                    <p className="text-[var(--text-secondary)] line-clamp-2">
                      {card.back}
                    </p>
                  </div>
                  <div className="absolute inset-0 bg-[var(--primary)] opacity-0 group-hover:opacity-5 transition-opacity duration-200" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[var(--neutral-50)] rounded-lg">
              <p className="text-[var(--text-secondary)] mb-4">
                This deck doesn&apos;t have any cards yet
              </p>
              {isOwner && (
                <Button asChild>
                  <Link href={`/decks/${deck._id}/edit`}>Add Cards</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Preview Modal */}
      {selectedCard !== null && deck.cards[selectedCard] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[var(--background)] rounded-xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--neutral-200)]">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Card {selectedCard + 1} of {deck.cards.length}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClosePreview}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Card Preview */}
            <div className="p-8">
              <div
                className="relative w-full aspect-[3/2] perspective-1000"
                onClick={handleFlipCard}
              >
                <div
                  className={`absolute inset-0 transition-transform duration-500 preserve-3d cursor-pointer ${
                    isCardFlipped ? "rotate-y-180" : ""
                  }`}
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden">
                    <div className="h-full flex items-center justify-center p-6 bg-[var(--neutral-50)] rounded-xl border border-[var(--neutral-200)]">
                      <p className="text-lg text-[var(--text-primary)] text-center">
                        {deck.cards[selectedCard].front}
                      </p>
                    </div>
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 rotate-y-180 backface-hidden">
                    <div className="h-full flex items-center justify-center p-6 bg-[var(--neutral-50)] rounded-xl border border-[var(--neutral-200)]">
                      <p className="text-lg text-[var(--text-primary)] text-center">
                        {deck.cards[selectedCard].back}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--neutral-200)]">
              <Button
                variant="outline"
                onClick={handlePreviousCard}
                disabled={selectedCard === 0}
                className="gap-2"
              >
                Previous
              </Button>
              <div className="flex-1 flex justify-center">
                <Button variant="ghost" onClick={handleFlipCard}>
                  Click or press Space to flip
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleNextCard}
                disabled={selectedCard === deck.cards.length - 1}
                className="gap-2"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Deck"
        description="Are you sure you want to delete this deck? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
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
