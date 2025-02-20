import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./button";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  responseType: "simple" | "complex";
  onResponseTypeChange: (type: "simple" | "complex") => void;
  onGenerate: (
    topic: string,
    count: number,
    createNewDeck: boolean,
    responseType: "simple" | "complex"
  ) => Promise<void>;
  isLoading: boolean;
  deckTitle?: string;
  children?: React.ReactNode;
}

export function GenerateCardsModal({
  isOpen,
  onClose,
  title,
  description,
  responseType,
  onResponseTypeChange,
  onGenerate,
  isLoading,
  deckTitle,
}: Props) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [createNewDeck, setCreateNewDeck] = useState(false);

  const handleGenerate = async () => {
    await onGenerate(topic, count, createNewDeck, responseType);
    setTopic("");
    setCount(5);
    setCreateNewDeck(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      <div className="space-y-4 py-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            What do you want to learn about?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., animals, verbs, food, numbers..."
            className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
          />
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Specify what kind of {deckTitle} content you want to learn
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Number of Cards
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={count}
            onChange={(e) =>
              setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))
            }
            className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
          />
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Choose between 1-20 cards to generate
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Response Type
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={responseType === "simple" ? "default" : "outline"}
              onClick={() => onResponseTypeChange("simple")}
              className={cn(
                "flex-1",
                responseType === "simple" && "bg-[var(--primary)]"
              )}
            >
              Simple
            </Button>
            <Button
              type="button"
              variant={responseType === "complex" ? "default" : "outline"}
              onClick={() => onResponseTypeChange("complex")}
              className={cn(
                "flex-1",
                responseType === "complex" && "bg-[var(--primary)]"
              )}
            >
              Detailed
            </Button>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {responseType === "simple"
              ? "Generate concise, straightforward cards"
              : "Generate detailed cards with examples and context"}
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
            The AI will generate {count} flashcard{count !== 1 ? "s" : ""} about{" "}
            <strong>
              {deckTitle} - {topic || "[Topic]"}
            </strong>
          </p>
          {createNewDeck ? (
            <p className="mt-2">A new deck will be created with these cards.</p>
          ) : (
            <p className="mt-2">
              The cards will be added to your current deck.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !topic || !deckTitle}
          className="gap-2"
        >
          {isLoading ? (
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
    </Modal>
  );
}
