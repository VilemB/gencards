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
  ChevronLeft,
  ChevronRight,
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
import { motion, AnimatePresence } from "framer-motion";
import { GenerateCardsModal } from "@/components/ui/GenerateCardsModal";

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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generationCount, setGenerationCount] = useState(5);
  const [createNewDeck, setCreateNewDeck] = useState(false);

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

  const handlePreviewClose = () => {
    setIsPreviewMode(false);
    setCurrentPreviewIndex(0);
    setIsCardFlipped(false);
  };

  const nextPreviewCard = () => {
    if (currentPreviewIndex < cards.length - 1) {
      setCurrentPreviewIndex(currentPreviewIndex + 1);
      setIsCardFlipped(false);
    }
  };

  const previousPreviewCard = () => {
    if (currentPreviewIndex > 0) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
      setIsCardFlipped(false);
    }
  };

  const handleAIAssist = async () => {
    if (!topic) {
      setError("Please enter a topic before using AI assist");
      return;
    }

    setIsGenerating(true);
    setError("");
    setShowGenerateModal(false);

    try {
      const response = await fetch("/api/decks/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          count: generationCount,
          createNewDeck,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate flashcards");
      }

      const data = await response.json();

      if (createNewDeck) {
        // Redirect to the new deck
        router.push(`/decks/${data.deckId}`);
        return;
      }

      // Add generated cards to existing cards
      const newCards = data.cards.map(
        (card: { front: string; back: string }) => ({
          id: `new-${cards.length + Math.random()}`,
          front: card.front,
          back: card.back,
        })
      );

      setCards([...cards, ...newCards]);
    } catch (err) {
      console.error("Error generating flashcards:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate flashcards"
      );
    } finally {
      setIsGenerating(false);
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

  if (isPreviewMode) {
    const currentCard =
      cards.length > 0
        ? cards[currentPreviewIndex]
        : {
            front: "<p>This is a test card front</p>",
            back: "<p>This is a test card back</p>",
          };
    const progress =
      cards.length > 0 ? ((currentPreviewIndex + 1) / cards.length) * 100 : 100;

    return (
      <div className="fixed inset-0 z-50 bg-[var(--background)]">
        {/* Header */}
        <header className="border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/80 backdrop-blur-sm sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between gap-4">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {cards.length > 0 ? "Preview Cards" : "Preview Example Card"}
              </h1>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handlePreviewClose}
              >
                <X className="h-4 w-4" />
                Exit Preview
              </Button>
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

        {/* Card Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-transparent to-[var(--neutral-50)]/20 min-h-[calc(100vh-4.25rem)]">
          <div className="w-full max-w-3xl">
            {/* Card */}
            <div
              className="relative w-full aspect-[3/2] cursor-pointer perspective-1000"
              onClick={() => setIsCardFlipped(!isCardFlipped)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isCardFlipped ? "back" : "front"}
                  initial={{ rotateY: isCardFlipped ? -180 : 0, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isCardFlipped ? 0 : 180, opacity: 0 }}
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
                        __html: isCardFlipped
                          ? currentCard.back
                          : currentCard.front,
                      }}
                    />
                  </div>
                  <div className="text-center text-sm text-[var(--text-secondary)] mt-4">
                    Click to flip
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={previousPreviewCard}
                disabled={currentPreviewIndex === 0}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm text-[var(--text-secondary)]">
                {cards.length > 0
                  ? `${currentPreviewIndex + 1} / ${cards.length}`
                  : "Example Card"}
              </div>
              <Button
                variant="outline"
                onClick={nextPreviewCard}
                disabled={
                  cards.length === 0 || currentPreviewIndex === cards.length - 1
                }
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
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
                onClick={() => setIsPreviewMode(true)}
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
                  onClick={() => setShowGenerateModal(true)}
                  disabled={isGenerating || !topic}
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
                      AI Generate
                    </>
                  )}
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

      {/* Generate Cards Modal */}
      <GenerateCardsModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Cards with AI"
        description="Let AI help you create high-quality flashcards for your deck."
      >
        <div className="space-y-4 py-4">
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createNewDeck"
              checked={createNewDeck}
              onChange={(e) => setCreateNewDeck(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
            />
            <label
              htmlFor="createNewDeck"
              className="text-sm text-[var(--text-primary)]"
            >
              Create as new deck
            </label>
          </div>

          <div className="bg-[var(--neutral-50)] rounded-lg p-4 text-sm text-[var(--text-secondary)]">
            <p>
              The AI will generate {generationCount} flashcard
              {generationCount !== 1 ? "s" : ""} about{" "}
              <strong>{topic || "[Topic]"}</strong>
            </p>
            {createNewDeck ? (
              <p className="mt-2">
                A new deck will be created with these cards.
              </p>
            ) : (
              <p className="mt-2">
                The cards will be added to your current deck.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAIAssist}
            disabled={isGenerating || !topic}
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
  );
}
