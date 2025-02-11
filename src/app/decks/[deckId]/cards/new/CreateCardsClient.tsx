"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardContainer } from "@/components/ui/Card";
import { toast } from "sonner";
import { DeckBreadcrumb } from "@/components/DeckBreadcrumb";

interface CreateCardsClientProps {
  deckId: string;
  deckTitle: string;
}

export default function CreateCardsClient({
  deckId,
  deckTitle,
}: CreateCardsClientProps) {
  const router = useRouter();
  const [cards, setCards] = useState([{ front: "", back: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCard = () => {
    setCards([...cards, { front: "", back: "" }]);
  };

  const handleRemoveCard = (index: number) => {
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
  };

  const handleCardChange = (
    index: number,
    field: "front" | "back",
    value: string
  ) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    setCards(newCards);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all cards have both front and back content
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cards }),
      });

      if (!response.ok) {
        throw new Error("Failed to create cards");
      }

      toast.success("Cards created successfully");
      router.push(`/decks/${deckId}`);
      router.refresh();
    } catch {
      toast.error("Failed to create cards");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <DeckBreadcrumb
        deckId={deckId}
        deckTitle={deckTitle}
        currentPage="Add Cards"
      />

      <h1 className="text-2xl font-bold mb-6">Add Cards to {deckTitle}</h1>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {cards.map((card, index) => (
            <CardContainer key={index} className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Card {index + 1}</h3>
                {cards.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveCard(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Front
                  </label>
                  <Textarea
                    value={card.front}
                    onChange={(e) =>
                      handleCardChange(index, "front", e.target.value)
                    }
                    placeholder="Enter the front content of the card"
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Back</label>
                  <Textarea
                    value={card.back}
                    onChange={(e) =>
                      handleCardChange(index, "back", e.target.value)
                    }
                    placeholder="Enter the back content of the card"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </CardContainer>
          ))}
        </div>

        <div className="mt-6 space-x-4">
          <Button type="button" variant="outline" onClick={handleAddCard}>
            Add Another Card
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Cards"}
          </Button>
        </div>
      </form>
    </div>
  );
}
