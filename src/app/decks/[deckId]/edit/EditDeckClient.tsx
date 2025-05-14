"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  X,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Book,
  Globe2,
  Lock,
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
import { motion, AnimatePresence } from "framer-motion";
import { GenerateButton } from "@/components/ui/GenerateButton";
import { cn } from "@/lib/utils";
import { CardEditor } from "@/components/CardEditor";

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
  parentDeckId: string | null;
  path: string;
  level: number;
  hasChildren: boolean;
}

interface Props {
  deckId: string;
}

interface CardForm {
  id: string;
  front: string;
  back: string;
}

const DECK_TOPICS = [
  {
    id: "Languages",
    name: "Languages",
    description: "Vocabulary, grammar, and language learning materials",
  },
  {
    id: "Science",
    name: "Science",
    description: "Physics, chemistry, biology, and other scientific topics",
  },
  {
    id: "Mathematics",
    name: "Mathematics",
    description: "Algebra, calculus, geometry, and mathematical concepts",
  },
  {
    id: "History",
    name: "History",
    description: "Historical events, dates, and cultural studies",
  },
  {
    id: "Geography",
    name: "Geography",
    description: "Countries, capitals, landmarks, and geographical features",
  },
  {
    id: "Literature",
    name: "Literature",
    description: "Books, authors, literary terms, and analysis",
  },
  {
    id: "Arts",
    name: "Arts",
    description: "Visual arts, music, theater, and creative studies",
  },
  {
    id: "Technology",
    name: "Technology",
    description: "Programming, computer science, and tech concepts",
  },
  {
    id: "Business",
    name: "Business",
    description: "Economics, management, and business principles",
  },
  { id: "Other", name: "Other", description: "Other educational topics" },
];

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
  const [parentDeckId, setParentDeckId] = useState<string | null>(null);
  const [availableParentDecks, setAvailableParentDecks] = useState<Deck[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [cards, setCards] = useState<CardForm[]>([]);

  useEffect(() => {
    async function loadParentDecks() {
      try {
        const response = await fetch("/api/decks?ownership=my");
        if (!response.ok) {
          throw new Error("Failed to load decks");
        }
        const data = await response.json();
        // Filter out current deck and its children to prevent circular references
        const filteredDecks = data.decks.filter(
          (d: Deck) => d._id !== deckId && (!d.path || !d.path.includes(deckId))
        );
        setAvailableParentDecks(filteredDecks);
      } catch (err) {
        console.error("Error loading parent decks:", err);
      }
    }

    loadParentDecks();
  }, [deckId]);

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
        setParentDeckId(data.parentDeckId);
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

    // Add haptic feedback if supported
    if (window.navigator.vibrate) {
      window.navigator.vibrate([50, 50]);
    }

    setCards(items);
  };

  const handleAddCard = () => {
    setCards([{ id: `new-${Date.now()}`, front: "", back: "" }, ...cards]);
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
          parentDeckId,
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
                  className="absolute inset-0 bg-[var(--foreground)] rounded-xl shadow-lg p-8 flex flex-col backface-hidden"
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
                className="gap-2 bg-[var(--foreground)]/10 hover:bg-[var(--foreground)]/20 border-[var(--foreground)]/20"
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
                className="gap-2 bg-[var(--foreground)]/10 hover:bg-[var(--foreground)]/20 border-[var(--foreground)]/20"
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
          <div className="header-gradient">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Edit Deck</h1>
                  <p className="text-white/80">
                    Update your flashcard deck details and cards
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPreviewMode(true)}
                    className="gap-2 bg-white/10 hover:bg-white/20 border-white/20"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
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

          {/* Deck Details */}
          <div className="bg-[var(--neutral-50)] rounded-xl p-6 space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Deck Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="e.g., Spanish Vocabulary, Math Formulas"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] min-h-[120px]"
                placeholder="Describe what this deck is about..."
                required
              />
            </div>

            {/* Topic */}
            <div>
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Topic
              </label>
              <div className="relative">
                <select
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] appearance-none"
                >
                  {/* Include current topic if it's not in DECK_TOPICS */}
                  {topic && !DECK_TOPICS.find((t) => t.id === topic) && (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  )}
                  {DECK_TOPICS.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <Book className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-secondary)]" />
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {DECK_TOPICS.find((t) => t.id === topic)?.description ||
                  "Custom topic"}
              </p>
            </div>

            {/* Parent Deck */}
            <div>
              <label
                htmlFor="parentDeck"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                Parent Deck (Optional)
              </label>
              <select
                id="parentDeck"
                value={parentDeckId || ""}
                onChange={(e) => setParentDeckId(e.target.value || null)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">No Parent (Top-Level Deck)</option>
                {availableParentDecks.map((deck) => (
                  <option key={deck._id} value={deck._id}>
                    {"  ".repeat(deck.level || 0)}
                    {deck.title}
                    {deck.level > 0 && " (Subdeck)"}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Select a parent deck to create a subdeck
              </p>
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-[var(--background)]">
              <div className="p-3 bg-[var(--neutral-100)] rounded-lg">
                {isPublic ? (
                  <Globe2 className="h-6 w-6 text-[var(--primary)]" />
                ) : (
                  <Lock className="h-6 w-6 text-[var(--text-secondary)]" />
                )}
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="font-medium text-[var(--text-primary)]">
                    Share with Community
                  </span>
                </label>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Make this deck available to other users
                </p>
              </div>
            </div>
          </div>

          {/* Cards Section */}
          <div className="bg-[var(--neutral-50)] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Cards
              </h2>
              <div className="flex items-center gap-2">
                <GenerateButton
                  deckId={deckId}
                  deckTopic={topic}
                  onSuccess={async () => {
                    // Reload the deck after successful generation
                    const response = await fetch(`/api/decks/${deckId}`);
                    if (response.ok) {
                      const data = await response.json();
                      setDeck(data);
                      setCards(
                        data.cards.map((card: Card) => ({
                          id: card._id,
                          front: card.front,
                          back: card.back,
                        }))
                      );
                    }
                  }}
                  variant="outline"
                  className="gap-2"
                />
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
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn(
                      "space-y-4 transition-colors duration-200",
                      snapshot.isDraggingOver &&
                        "bg-[var(--neutral-100)] rounded-lg p-4"
                    )}
                  >
                    {cards.map((card, index) => (
                      <Draggable
                        key={card.id}
                        draggableId={card.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <CardEditor
                            id={card.id}
                            front={card.front}
                            back={card.back}
                            index={index}
                            isDragging={snapshot.isDragging}
                            dragHandleProps={
                              provided.dragHandleProps || undefined
                            }
                            onRemove={handleRemoveCard}
                            onChange={handleCardChange}
                            {...provided.draggableProps}
                            ref={provided.innerRef}
                          />
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
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDiscardModal(true)}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="flex-1 gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>

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
    </div>
  );
}
