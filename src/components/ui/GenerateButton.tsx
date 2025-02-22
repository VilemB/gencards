import { useState } from "react";
import { Loader2, Sparkles, FileText, List, ChevronDown } from "lucide-react";
import { Button } from "./button";
import { GenerateCardsModal } from "./GenerateCardsModal";
import { ScanDocumentModal } from "./ScanDocumentModal";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

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
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanMode, setScanMode] = useState<"extract" | "generate" | null>(null);
  const [responseType, setResponseType] = useState<"simple" | "complex">(
    "simple"
  );
  const [deckChain, setDeckChain] = useState<
    { title: string; topic: string }[]
  >([]);

  const loadDeckChain = async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}`);
      if (response.ok) {
        const deck = await response.json();
        const chain: { title: string; topic: string }[] = [];

        // Build chain from populated parentDeckId
        let currentDeck = deck;
        while (currentDeck?.parentDeckId) {
          chain.unshift({
            title: currentDeck.parentDeckId.title,
            topic:
              currentDeck.parentDeckId.topic || currentDeck.parentDeckId.title,
          });
          currentDeck = currentDeck.parentDeckId;
        }

        // Add current deck to chain
        chain.push({
          title: deck.title,
          topic: deck.topic || deck.title,
        });

        setDeckChain(chain);
      }
    } catch (error) {
      console.error("Error loading deck chain:", error);
    }
  };

  // Generate a context-aware description based on the deck chain
  const getModalDescription = () => {
    if (deckChain.length === 0) {
      return "Let AI help you create high-quality flashcards for your deck.";
    }

    const lastDeck = deckChain[deckChain.length - 1];
    const parentDeck = deckChain[deckChain.length - 2];

    // Safely access topic with fallback to title
    const lastTopic = lastDeck?.topic || lastDeck?.title || deckTopic;
    const parentTopic = parentDeck?.topic || parentDeck?.title;

    // Special handling for known topics
    const lastTopicLower = lastTopic.toLowerCase();
    if (lastTopicLower.includes("korean")) {
      return "Generate Korean vocabulary and phrases with proper romanization, translations, and usage examples.";
    }

    if (lastTopicLower.includes("language")) {
      return "Create language learning flashcards with translations, pronunciation guides, and contextual usage.";
    }

    if (lastTopicLower.includes("math")) {
      return "Generate mathematics flashcards with clear explanations, formulas, and step-by-step examples.";
    }

    if (lastTopicLower.includes("science")) {
      return "Create science flashcards with definitions, explanations, and real-world applications.";
    }

    if (lastTopicLower.includes("history")) {
      return "Generate history flashcards with key events, dates, figures, and their significance.";
    }

    // Context-based descriptions
    if (parentTopic) {
      return `Generate flashcards about ${lastTopic} in the context of ${parentTopic}. AI will ensure all content is relevant and properly connected to the parent topic.`;
    }

    return `Create high-quality flashcards specifically focused on ${lastTopic}. AI will generate accurate and relevant content for your study needs.`;
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
      const rootTopic = deckChain[0]?.topic || deckTopic;
      const contextPath =
        deckChain.length > 1
          ? `${deckChain.map((d) => d.topic).join(" > ")} > ${topic}`
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
      setShowGenerateModal(false);
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
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
                Generate Cards
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={async () => {
              await loadDeckChain();
              setShowGenerateModal(true);
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            <span>AI Generate</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setScanMode("extract");
              setShowScanModal(true);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>Scan Document</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setScanMode("generate");
              setShowScanModal(true);
            }}
          >
            <List className="h-4 w-4 mr-2" />
            <span>Extract Terms</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <GenerateCardsModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate Cards with AI"
        description={getModalDescription()}
        responseType={responseType}
        onResponseTypeChange={setResponseType}
        onGenerate={handleGenerate}
        isLoading={isGenerating}
        deckTitle={deckTopic}
        deckChain={deckChain}
      />

      <ScanDocumentModal
        isOpen={showScanModal}
        onClose={() => {
          setShowScanModal(false);
          setScanMode(null);
        }}
        mode={scanMode}
        deckId={deckId}
        deckTopic={deckTopic}
        onSuccess={onSuccess}
      />
    </>
  );
}
