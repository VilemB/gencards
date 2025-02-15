"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardContainer } from "@/components/ui/Card";
import { toast } from "sonner";
import { DeckBreadcrumb } from "@/components/DeckBreadcrumb";
import { Eye, Loader2, Plus, Sparkles } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

interface CreateCardsClientProps {
  deckId: string;
  deckTitle: string;
}

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (topic: string, count: number) => Promise<void>;
  isLoading: boolean;
}

function AIGenerateModal({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
}: AIGenerateModalProps) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onGenerate(topic, count);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#1a1a1a] p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-white mb-4">
          Generate Cards with AI
        </h2>
        <p className="text-white/70 mb-6">
          Enter a topic and the number of cards you want to generate.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-white/70"
            >
              Topic
            </label>
            <input
              id="topic"
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white"
              placeholder="e.g. Basic Verbs in Portuguese"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="count"
              className="block text-sm font-medium text-white/70"
            >
              Number of Cards
            </label>
            <input
              id="count"
              type="number"
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!topic || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateCardsClient({
  deckId,
  deckTitle,
}: CreateCardsClientProps) {
  const router = useRouter();
  const [cards, setCards] = useState([{ front: "", back: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const handleAddCard = useCallback(() => {
    setCards([...cards, { front: "", back: "" }]);
  }, [cards]);

  const handleRemoveCard = useCallback(
    (index: number) => {
      const newCards = cards.filter((_, i) => i !== index);
      setCards(newCards);
    },
    [cards]
  );

  const handleCardChange = useCallback(
    (index: number, field: "front" | "back", value: string) => {
      const newCards = [...cards];
      newCards[index][field] = value;
      setCards(newCards);
    },
    [cards]
  );

  const handleGenerateCards = async (topic: string, count: number) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          count,
          deckTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cards");
      }

      const data = await response.json();
      setCards(data.cards);
      setShowAIModal(false);
      toast.success(`Generated ${count} cards successfully`);
    } catch {
      toast.error("Failed to generate cards");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = cards.every(
      (card) => card.front.trim() && card.back.trim()
    );
    if (!isValid) {
      toast.error("Please fill in both front and back content for all cards");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards }),
      });

      if (!response.ok) throw new Error("Failed to create cards");

      toast.success("Cards created successfully");
      router.push(`/decks/${deckId}`);
      router.refresh();
    } catch {
      toast.error("Failed to create cards");
    } finally {
      setIsSubmitting(false);
    }
  };

  useHotkeys("ctrl+n", handleAddCard, [handleAddCard]);

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="container mx-auto p-6 max-w-4xl">
        <DeckBreadcrumb
          deckId={deckId}
          deckTitle={deckTitle}
          currentPage="Add Cards"
        />

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">{deckTitle}</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {cards.map((card, index) => (
              <CardContainer
                key={index}
                className={`p-6 ${
                  previewMode
                    ? "bg-black/40 hover:bg-black/50"
                    : "bg-black/20 hover:bg-black/30"
                } rounded-lg border border-white/10 transition-colors`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">
                    Card {index + 1}
                  </h3>
                  {cards.length > 1 && !previewMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCard(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Front
                    </label>
                    {previewMode ? (
                      <div className="min-h-[150px] p-4 bg-black/20 rounded-lg text-white whitespace-pre-wrap">
                        {card.front || "No content"}
                      </div>
                    ) : (
                      <Textarea
                        value={card.front}
                        onChange={(e) =>
                          handleCardChange(index, "front", e.target.value)
                        }
                        placeholder="Enter the front content of the card"
                        className="min-h-[150px] bg-black/20 border-white/10 text-white placeholder:text-white/30"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Back
                    </label>
                    {previewMode ? (
                      <div className="min-h-[150px] p-4 bg-black/20 rounded-lg text-white whitespace-pre-wrap">
                        {card.back || "No content"}
                      </div>
                    ) : (
                      <Textarea
                        value={card.back}
                        onChange={(e) =>
                          handleCardChange(index, "back", e.target.value)
                        }
                        placeholder="Enter the back content of the card"
                        className="min-h-[150px] bg-black/20 border-white/10 text-white placeholder:text-white/30"
                      />
                    )}
                  </div>
                </div>
              </CardContainer>
            ))}
          </div>

          <div className="flex justify-between items-center mt-8">
            {!previewMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddCard}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Card (Ctrl+N)
              </Button>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 ml-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Cards"
              )}
            </Button>
          </div>
        </form>

        <AIGenerateModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onGenerate={handleGenerateCards}
          isLoading={isGenerating}
        />
      </div>
    </div>
  );
}
