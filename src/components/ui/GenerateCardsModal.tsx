import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./button";
import { Loader2, Sparkles, ChevronRight } from "lucide-react";
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
  deckChain?: { title: string; topic: string }[];
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
  deckChain = [],
}: Props) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [createNewDeck, setCreateNewDeck] = useState(false);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onGenerate(topic, count, createNewDeck, responseType);
    setTopic("");
    setCount(5);
    setCreateNewDeck(false);
  };

  // Get the current context description based on the deck chain
  const getContextDescription = () => {
    if (deckChain.length === 0) {
      return "Cards will be generated as a new top-level deck";
    }

    const lastDeck = deckChain[deckChain.length - 1];
    const parentDeck = deckChain[deckChain.length - 2];

    if (parentDeck) {
      return `Cards will be generated for ${lastDeck.topic} within the context of ${parentDeck.topic}`;
    }

    return `Cards will be generated specifically for ${lastDeck.topic}`;
  };

  // Get appropriate placeholder examples based on the context
  const getPlaceholderExamples = () => {
    const currentTopic = deckChain[deckChain.length - 1]?.topic.toLowerCase();

    if (!currentTopic)
      return "e.g., basic concepts, key terms, important examples...";

    // Add specific examples for different topics
    const examples: Record<string, string> = {
      food: "e.g., banchan (side dishes), street food, soups, rice dishes...",
      philosophy: "e.g., stoicism, ethics, metaphysics, epistemology...",
      language: "e.g., greetings, daily phrases, business terms...",
      mathematics: "e.g., geometry, algebra, calculus concepts...",
      history: "e.g., ancient civilizations, medieval period, modern era...",
      science:
        "e.g., physics laws, chemical reactions, biological processes...",
    };

    // Find the most relevant example based on the topic
    const matchingExample = Object.entries(examples).find(([key]) =>
      currentTopic.includes(key)
    );

    return (
      matchingExample?.[1] || "e.g., specific terms, concepts, or examples..."
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4 py-4">
        {/* Dynamic Context Path Indicator */}
        {deckChain.length > 0 && (
          <div className="bg-[var(--neutral-50)] rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
              <span className="font-medium text-[var(--text-primary)]">
                Current Context:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {deckChain.map((deck, index) => (
                  <div key={deck.title} className="flex items-center gap-1.5">
                    <span className="text-[var(--primary)]">{deck.title}</span>
                    {index < deckChain.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-[var(--text-secondary)]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {getContextDescription()}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            What would you like to learn about
            {deckTitle ? ` in ${deckTitle}` : ""}?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={getPlaceholderExamples()}
            className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
          />
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Enter a specific category or theme to study
          </p>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-3">
            <label className="block text-sm font-medium text-[var(--text-primary)]">
              Number of Cards
            </label>
            <div className="bg-[var(--primary)] text-white px-2 py-1 rounded text-sm min-w-[40px] text-center">
              {count}
            </div>
          </div>
          <div className="relative pt-2 pb-6">
            <div className="absolute left-0 right-0 h-2 bg-[var(--neutral-100)] rounded-full">
              <div
                className="absolute h-full bg-[var(--primary)] rounded-full transition-all"
                style={{ width: `${(count / 20) * 100}%` }}
              />
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="absolute w-full h-2 opacity-0 cursor-pointer"
            />
            <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-1">
              <span className="text-xs text-[var(--text-secondary)]">1</span>
              <span className="text-xs text-[var(--text-secondary)]">10</span>
              <span className="text-xs text-[var(--text-secondary)]">20</span>
            </div>
            <div
              className="absolute top-0 transition-all pointer-events-none"
              style={{ left: `calc(${(count / 20) * 100}% - 12px)` }}
            >
              <div className="h-6 w-6 rounded-full border-2 border-[var(--primary)] bg-white" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Card Detail Level
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={responseType === "simple" ? "default" : "outline"}
              onClick={() => onResponseTypeChange("simple")}
              className={cn(
                "relative overflow-hidden transition-all",
                responseType === "simple" && "bg-[var(--primary)]"
              )}
            >
              <span className="relative z-10">Simple</span>
              {responseType === "simple" && (
                <div className="absolute inset-0 bg-[var(--primary)] opacity-10" />
              )}
            </Button>
            <Button
              type="button"
              variant={responseType === "complex" ? "default" : "outline"}
              onClick={() => onResponseTypeChange("complex")}
              className={cn(
                "relative overflow-hidden transition-all",
                responseType === "complex" && "bg-[var(--primary)]"
              )}
            >
              <span className="relative z-10">Detailed</span>
              {responseType === "complex" && (
                <div className="absolute inset-0 bg-[var(--primary)] opacity-10" />
              )}
            </Button>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {responseType === "simple"
              ? "Basic cards with essential information"
              : "Detailed cards with examples and context"}
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
            Create as new subdeck
          </label>
        </div>
      </form>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !topic || !deckTitle}
          className="gap-2 min-w-[140px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate {count} {count === 1 ? "Card" : "Cards"}
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
