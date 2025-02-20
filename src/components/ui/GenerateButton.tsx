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
      const promptContext = {
        mainTopic: deckTopic,
        subtopic: topic,
        instructions: `Generate ${count} flashcards about ${topic}. Each card should be a direct example of ${topic} in the context of ${deckTopic}, not explanations about ${topic}. For language decks, provide actual ${topic} in that language, not definitions or grammar explanations.`,
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
        onClick={() => setShowModal(true)}
        className={className}
        disabled={isGenerating}
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
        description="Let AI help you create high-quality flashcards for your deck."
        responseType={responseType}
        onResponseTypeChange={setResponseType}
        onGenerate={handleGenerate}
        isLoading={isGenerating}
        deckTitle={deckTopic}
      />
    </>
  );
}
