import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "./button";
import { GenerateCardsModal } from "./GenerateCardsModal";
import { toast } from "sonner";

interface Props {
  deckId: string;
  deckTopic: string;
  onSuccess?: () => void;
  variant?: "default" | "outline";
  className?: string;
}

export function GenerateButton({
  deckId,
  deckTopic,
  onSuccess,
  variant = "default",
  className,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [responseType, setResponseType] = useState<"simple" | "complex">(
    "simple"
  );
  const [deckChain, setDeckChain] = useState<string[]>([]);

  // Add effect to load deck chain
  const loadDeckChain = async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}`);
      if (response.ok) {
        const deck = await response.json();
        const chain: string[] = [];

        // Build chain from populated parentDeckId
        let currentDeck = deck;
        while (currentDeck?.parentDeckId) {
          chain.unshift(currentDeck.parentDeckId.topic);
          currentDeck = currentDeck.parentDeckId;
        }
        chain.push(deckTopic);
        setDeckChain(chain);
      }
    } catch (error) {
      console.error("Error loading deck chain:", error);
    }
  };

  const handleGenerate = async (
    topic: string,
    count: number,
    createNewDeck: boolean,
    responseType: "simple" | "complex"
  ) => {
    setIsGenerating(true);

    const loadingToast = toast.loading(
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Generating your flashcards...</span>
      </div>
    );

    try {
      const rootTopic = deckChain[0] || deckTopic;
      const contextPath =
        deckChain.length > 1
          ? `${deckChain.join(" > ")} > ${topic}`
          : `${deckTopic} > ${topic}`;

      // Build a focused, context-aware prompt
      const promptContext = {
        mainTopic: rootTopic,
        subtopic: topic,
        instructions: `Create ${count} flashcards for ${topic} in the context of ${contextPath}. Each card should be a concrete, practical example - not theory or definitions. ${
          responseType === "complex"
            ? "Include relevant details and context where helpful."
            : "Keep responses focused and concise."
        }`,
        format: responseType === "simple" ? "basic" : "detailed",
      };

      const response = await fetch("/api/decks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `${deckTopic} - ${topic}`,
          promptContext,
          count,
          createNewDeck,
          deckId: createNewDeck ? null : deckId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate flashcards");
      }

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (createNewDeck) {
        toast.success("New deck created successfully!");
        window.location.href = `/decks/${data.deckId}`;
        return;
      }

      toast.success(`Generated ${data.cards.length} new flashcards!`);
      onSuccess?.();
      setShowModal(false);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate flashcards"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await loadDeckChain();
          setShowModal(true);
        }}
        className={className}
        disabled={isGenerating}
        type="button"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generate
          </>
        )}
      </Button>

      <GenerateCardsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Generate Cards with AI"
        description={
          deckChain.length > 1
            ? `Generate cards for ${deckTopic} in the context of ${deckChain
                .slice(0, -1)
                .join(" > ")}`
            : "Let AI help you create high-quality flashcards for your deck."
        }
        responseType={responseType}
        onResponseTypeChange={setResponseType}
        onGenerate={handleGenerate}
        isLoading={isGenerating}
        deckTitle={deckTopic}
      />
    </>
  );
}
