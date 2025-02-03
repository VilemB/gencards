"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Edit, Share, Trash2, Play } from "lucide-react";
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                {deck.title}
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">
                {deck.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isOwner ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share className="h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/decks/${deck._id}/edit`)}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteModal(true)}
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <Button variant="ghost" onClick={handleShare} className="gap-2">
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button asChild className="gap-2">
              <Link href={`/decks/${deck._id}/study`}>
                <Play className="h-4 w-4" />
                Study Now
              </Link>
            </Button>
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
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

        {/* Cards Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Cards
          </h2>
          <div className="grid gap-4">
            {deck.cards?.length > 0 ? (
              deck.cards.map((card) => (
                <div
                  key={card._id}
                  className="bg-[var(--neutral-50)] rounded-lg p-4 hover:bg-[var(--neutral-100)] transition-colors"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)] mb-1">
                        Front
                      </h3>
                      <p className="text-[var(--text-secondary)]">
                        {card.front}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)] mb-1">
                        Back
                      </h3>
                      <p className="text-[var(--text-secondary)]">
                        {card.back}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
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
      </div>

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
    </div>
  );
}
