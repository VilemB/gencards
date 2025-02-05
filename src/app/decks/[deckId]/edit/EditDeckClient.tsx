"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  X,
  AlertTriangle,
  GripVertical,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { Toast } from "@/components/ui/Toast";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import RichTextEditor from "@/components/editor/RichTextEditor";

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

interface CardForm {
  id: string;
  front: string;
  back: string;
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
  const [showPreview, setShowPreview] = useState(false);
  const [currentPreviewCard, setCurrentPreviewCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [cards, setCards] = useState<CardForm[]>([]);

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
            id: card._id,
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(cards);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCards(items);
  };

  const handleAddCard = () => {
    setCards([...cards, { id: `new-${cards.length}`, front: "", back: "" }]);
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
          cards: cards.map(({ front, back }) => ({ front, back })),
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

  const togglePreview = () => {
    setShowPreview(!showPreview);
    setCurrentPreviewCard(0);
    setIsFlipped(false);
  };

  const nextPreviewCard = () => {
    if (currentPreviewCard < cards.length - 1) {
      setCurrentPreviewCard(currentPreviewCard + 1);
      setIsFlipped(false);
    }
  };

  const previousPreviewCard = () => {
    if (currentPreviewCard > 0) {
      setCurrentPreviewCard(currentPreviewCard - 1);
      setIsFlipped(false);
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

  if (showPreview) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Preview Cards
            </h1>
            <Button onClick={togglePreview} variant="outline" className="gap-2">
              <EyeOff className="h-4 w-4" />
              Exit Preview
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div
              className={`relative w-full max-w-2xl aspect-[3/2] cursor-pointer transition-transform duration-700 transform-gpu ${
                isFlipped ? "rotate-y-180" : ""
              }`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`absolute inset-0 backface-hidden bg-[var(--neutral-50)] rounded-xl p-8 flex flex-col ${
                  isFlipped ? "rotate-y-180 invisible" : ""
                }`}
              >
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className="prose prose-neutral max-w-none w-full"
                    dangerouslySetInnerHTML={{
                      __html: cards[currentPreviewCard]?.front || "",
                    }}
                  />
                </div>
              </div>
              <div
                className={`absolute inset-0 backface-hidden bg-[var(--neutral-50)] rounded-xl p-8 flex flex-col rotate-y-180 ${
                  isFlipped ? "visible" : "invisible"
                }`}
              >
                <div className="flex-1 flex items-center justify-center">
                  <div
                    className="prose prose-neutral max-w-none w-full"
                    dangerouslySetInnerHTML={{
                      __html: cards[currentPreviewCard]?.back || "",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-8">
              <Button
                onClick={previousPreviewCard}
                disabled={currentPreviewCard === 0}
              >
                Previous
              </Button>
              <span className="text-[var(--text-secondary)]">
                {currentPreviewCard + 1} / {cards.length}
              </span>
              <Button
                onClick={nextPreviewCard}
                disabled={currentPreviewCard === cards.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
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
                onClick={togglePreview}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
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
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement AI assistance
                  }}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Assist
                </Button>
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
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="cards">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {cards.map((card, index) => (
                      <Draggable
                        key={card.id}
                        draggableId={card.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="relative bg-[var(--neutral-50)] rounded-lg p-4"
                          >
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCard(index)}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 pr-16">
                              <div>
                                <label
                                  htmlFor={`front-${index}`}
                                  className="block text-sm font-medium text-[var(--text-primary)] mb-1"
                                >
                                  Front
                                </label>
                                <RichTextEditor
                                  content={card.front}
                                  onChange={(content) =>
                                    handleCardChange(index, "front", content)
                                  }
                                  placeholder="Enter card front"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`back-${index}`}
                                  className="block text-sm font-medium text-[var(--text-primary)] mb-1"
                                >
                                  Back
                                </label>
                                <RichTextEditor
                                  content={card.back}
                                  onChange={(content) =>
                                    handleCardChange(index, "back", content)
                                  }
                                  placeholder="Enter card back"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {cards.length === 0 && (
              <div className="text-center py-8 bg-[var(--neutral-50)] rounded-lg">
                <p className="text-[var(--text-secondary)]">
                  No cards yet. Click &quot;Add Card&quot; to create your first
                  card.
                </p>
              </div>
            )}
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
