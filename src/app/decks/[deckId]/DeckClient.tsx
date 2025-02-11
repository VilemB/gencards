"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Edit, Share, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import { DeckBreadcrumb } from "@/components/DeckBreadcrumb";

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
    <div className="container mx-auto px-4 py-8">
      <DeckBreadcrumb path={deck.path} parentDeckId={deck.parentDeckId} />
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            {deck.title}
          </h1>
          <p className="text-[var(--text-secondary)] mb-4">
            {deck.description}
          </p>
          <div className="flex gap-2 text-sm text-[var(--text-secondary)]">
            <span>{deck.cardCount} cards</span>
            <span>•</span>
            <span>{deck.isPublic ? "Public" : "Private"}</span>
            <span>•</span>
            <span>{deck.topic}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/decks/${deckId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          {deck.cards.length > 0 && (
            <Button onClick={() => router.push(`/decks/${deckId}/study`)}>
              <Play className="h-4 w-4 mr-2" />
              Study
            </Button>
          )}
        </div>
      </div>

      {deck.cards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)] mb-4">
            This deck has no cards yet.
          </p>
          {isOwner && (
            <Button onClick={() => router.push(`/decks/${deckId}/cards/new`)}>
              Add Cards
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deck.cards.map((card, index) => (
            <div
              key={card._id}
              className="p-4 border border-[var(--border)] rounded-lg cursor-pointer hover:border-[var(--primary)] transition-colors"
              onClick={() => handleCardClick(index)}
            >
              <div className="font-medium mb-2">{card.front}</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Click to preview
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCard !== null && deck.cards[selectedCard] && (
        <Modal
          isOpen={selectedCard !== null}
          onClose={handleClosePreview}
          title={`Card ${selectedCard + 1} of ${deck.cards.length}`}
          description={
            <div>
              <div
                className="min-h-[200px] p-4 border border-[var(--border)] rounded-lg mb-4 cursor-pointer"
                onClick={handleFlipCard}
              >
                {isCardFlipped
                  ? deck.cards[selectedCard].back
                  : deck.cards[selectedCard].front}
              </div>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousCard}
                  disabled={selectedCard === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextCard}
                  disabled={selectedCard === deck.cards.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          }
          onConfirm={handleClosePreview}
          confirmText="Close"
          cancelText="Cancel"
        />
      )}

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
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        isDestructive={true}
        isLoading={isDeleting}
      />

      <Toast
        show={showShareToast}
        onClose={() => setShowShareToast(false)}
        title="Link copied!"
        description="The deck URL has been copied to your clipboard."
      />
    </div>
  );
}
