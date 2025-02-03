"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";

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

export default function EditDeckClient({ deckId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [cards, setCards] = useState<{ front: string; back: string }[]>([]);

  useEffect(() => {
    async function loadDeck() {
      try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) {
          throw new Error("Failed to load deck");
        }
        const data = await response.json();
        setDeck(data);

        // Initialize form state
        setTitle(data.title);
        setDescription(data.description);
        setTopic(data.topic);
        setIsPublic(data.isPublic);
        setCards(
          data.cards.map((card: Card) => ({
            front: card.front,
            back: card.back,
          }))
        );
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

  const handleAddCard = () => {
    setCards([...cards, { front: "", back: "" }]);
  };

  const handleRemoveCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleCardChange = (
    index: number,
    field: "front" | "back",
    value: string
  ) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      // Validate required fields
      if (!title || !description || !topic) {
        throw new Error("Please fill in all required fields");
      }

      // Validate that any existing cards have content
      if (cards.some((card) => !card.front || !card.back)) {
        throw new Error("Please fill in all card fields");
      }

      const response = await fetch(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          topic,
          isPublic,
          cards,
          cardCount: cards.length,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update deck");
      }

      setShowSuccessToast(true);
      router.push(`/decks/${deckId}`);
    } catch (err) {
      console.error("Error updating deck:", err);
      setError(err instanceof Error ? err.message : "Failed to update deck");
    } finally {
      setIsSaving(false);
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

  // Check if user is the owner
  if (session?.user?.id !== deck.userId) {
    router.push(`/decks/${deckId}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Edit Deck
            </h1>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDiscardModal(true)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>

          {/* Deck Details */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                placeholder="Enter deck title"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                placeholder="Enter deck description"
                required
              />
            </div>

            <div>
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-[var(--text-primary)] mb-1"
              >
                Topic
              </label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                placeholder="Enter deck topic"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              <label
                htmlFor="isPublic"
                className="text-sm text-[var(--text-primary)]"
              >
                Make this deck public
              </label>
            </div>
          </div>

          {/* Cards Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Cards
              </h2>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCard}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Card
              </Button>
            </div>

            <div className="space-y-4">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="relative bg-[var(--neutral-50)] rounded-lg p-4"
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveCard(index)}
                    className="absolute top-2 right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={`front-${index}`}
                        className="block text-sm font-medium text-[var(--text-primary)] mb-1"
                      >
                        Front
                      </label>
                      <textarea
                        id={`front-${index}`}
                        value={card.front}
                        onChange={(e) =>
                          handleCardChange(index, "front", e.target.value)
                        }
                        rows={3}
                        className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                        placeholder="Enter card front"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`back-${index}`}
                        className="block text-sm font-medium text-[var(--text-primary)] mb-1"
                      >
                        Back
                      </label>
                      <textarea
                        id={`back-${index}`}
                        value={card.back}
                        onChange={(e) =>
                          handleCardChange(index, "back", e.target.value)
                        }
                        rows={3}
                        className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                        placeholder="Enter card back"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              {cards.length === 0 && (
                <div className="text-center py-8 bg-[var(--neutral-50)] rounded-lg">
                  <p className="text-[var(--text-secondary)]">
                    No cards yet. Click &quot;Add Card&quot; to create your
                    first card.
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </form>
      </div>

      {/* Discard Changes Modal */}
      <Modal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        title="Discard Changes"
        description="Are you sure you want to discard your changes? This action cannot be undone."
        confirmText="Discard"
        onConfirm={() => router.push(`/decks/${deckId}`)}
      />

      {/* Success Toast */}
      {showSuccessToast && (
        <Toast
          message="Changes saved successfully!"
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
}
