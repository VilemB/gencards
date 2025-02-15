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
import { AIGenerateModal } from "@/components/AIGenerateModal";

interface Card {
  front: string;
  back: string;
}

interface CreateCardsClientProps {
  deckId: string;
  deckTitle: string;
}

export default function CreateCardsClient({
  deckId,
  deckTitle,
}: CreateCardsClientProps) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([{ front: "", back: "" }]);
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

  const handleGenerateCards = async (
    topic: string,
    count: number,
    createNewDeck: boolean
  ) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/decks/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          count,
          createNewDeck,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate cards");
      }

      const data = await response.json();

      if (createNewDeck) {
        // If a new deck was created, redirect to it
        router.push(`/decks/${data.deckId}`);
        router.refresh();
        return;
      }

      // Validate the response data
      if (!data.cards || !Array.isArray(data.cards)) {
        throw new Error("Invalid response format from AI generation");
      }

      // Validate each card has required properties
      const validCards = data.cards.every(
        (card: Partial<Card>) =>
          typeof card.front === "string" &&
          typeof card.back === "string" &&
          card.front.trim() !== "" &&
          card.back.trim() !== ""
      );

      if (!validCards) {
        throw new Error("Generated cards are missing required content");
      }

      // Replace existing cards with generated ones
      setCards(data.cards);
      setShowAIModal(false);
      toast.success(`Generated ${data.cards.length} cards successfully`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate cards"
      );
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
          deckTitle={deckTitle}
        />
      </div>
    </div>
  );
}
