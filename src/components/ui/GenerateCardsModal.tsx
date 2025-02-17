import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GenerateCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  responseType: "simple" | "complex";
  onResponseTypeChange: (type: "simple" | "complex") => void;
  onGenerate: (
    topic: string,
    count: number,
    createNewDeck: boolean,
    responseType: "simple" | "complex"
  ) => Promise<void>;
  isLoading?: boolean;
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
  isLoading = false,
  deckTitle,
  children,
}: GenerateCardsModalProps) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [createNewDeck, setCreateNewDeck] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      toast.error("Please enter what you want to learn about");
      return;
    }
    try {
      await onGenerate(topic, count, createNewDeck, responseType);
      setTopic("");
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[var(--background)] p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-[var(--text-primary)]"
                    >
                      {title}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {description}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="flex gap-2 p-1">
                    <button
                      onClick={() => onResponseTypeChange("simple")}
                      className={`px-6 py-2 text-sm font-medium transition-all duration-200 border-2 ${
                        responseType === "simple"
                          ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--neutral-100)]"
                      }`}
                    >
                      Simple
                    </button>
                    <div className="w-px bg-[var(--neutral-200)]" />
                    <button
                      onClick={() => onResponseTypeChange("complex")}
                      className={`px-6 py-2 text-sm font-medium transition-all duration-200 border-2 ${
                        responseType === "complex"
                          ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--neutral-100)]"
                      }`}
                    >
                      Detailed
                    </button>
                  </div>
                </div>

                {children || (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="topic"
                        className="block text-sm font-medium text-[var(--text-primary)]"
                      >
                        What do you want to learn about?
                      </label>
                      <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., animals, verbs, food, numbers..."
                        className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                        disabled={isLoading}
                      />
                      {deckTitle && (
                        <p className="text-sm text-[var(--text-secondary)]">
                          Specify what kind of {deckTitle} content you want to
                          learn
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="count"
                        className="block text-sm font-medium text-[var(--text-primary)]"
                      >
                        Number of Cards
                      </label>
                      <input
                        id="count"
                        type="number"
                        min="1"
                        max="20"
                        value={count}
                        onChange={(e) =>
                          setCount(
                            Math.min(
                              20,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="block w-full rounded-lg border border-[var(--neutral-200)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] sm:text-sm"
                        disabled={isLoading}
                      />
                      <p className="text-sm text-[var(--text-secondary)]">
                        Choose between 1-20 cards to generate
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="createNewDeck"
                        checked={createNewDeck}
                        onChange={(e) => setCreateNewDeck(e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--neutral-200)] text-[var(--primary)] focus:ring-[var(--primary)]"
                        disabled={isLoading}
                      />
                      <label
                        htmlFor="createNewDeck"
                        className="text-sm text-[var(--text-primary)]"
                      >
                        Create as new deck
                      </label>
                    </div>

                    <div className="bg-[var(--neutral-50)] rounded-lg p-4">
                      <p className="text-[var(--text-primary)]">
                        The AI will generate {count} flashcard
                        {count !== 1 ? "s" : ""} about{" "}
                        <strong>{topic || "[Topic]"}</strong>
                      </p>
                      <p className="text-sm mt-1 text-[var(--text-secondary)]">
                        {createNewDeck
                          ? "A new deck will be created with these cards."
                          : "The cards will be added to your current deck."}
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
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
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
