"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    topic: string,
    count: number,
    createNewDeck: boolean
  ) => Promise<void>;
  isLoading: boolean;
  deckTitle?: string;
}

export function AIGenerateModal({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
  deckTitle,
}: AIGenerateModalProps) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [createNewDeck, setCreateNewDeck] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }
    await onGenerate(topic, count, createNewDeck);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-white">
            Generate Cards with AI
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-white/70 mb-6">
          Let AI help you create high-quality flashcards for your deck.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-white/70"
            >
              What do you want to learn about?
            </label>
            <input
              id="topic"
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-md text-white"
              placeholder="e.g., animals, verbs, food, numbers..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
            />
            {deckTitle && (
              <p className="text-sm text-white/50">
                Specify what kind of {deckTitle} content you want to learn
              </p>
            )}
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
            <p className="text-sm text-white/50">
              Choose between 1-20 cards to generate
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="createNewDeck"
              checked={createNewDeck}
              onChange={(e) => setCreateNewDeck(e.target.checked)}
              className="rounded border-white/10 bg-black/20"
              disabled={isLoading}
            />
            <label htmlFor="createNewDeck" className="text-sm text-white/70">
              Create as new deck
            </label>
          </div>

          <div className="bg-black/20 rounded-lg p-4 text-white/70">
            <p>
              The AI will generate {count} flashcards about {topic || "[Topic]"}
            </p>
            <p className="text-sm mt-1">
              {createNewDeck
                ? "A new deck will be created with these cards."
                : "The cards will be added to your current deck."}
            </p>
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
            <Button
              type="submit"
              disabled={!topic || isLoading}
              className="bg-blue-600 hover:bg-blue-500"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Cards
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
