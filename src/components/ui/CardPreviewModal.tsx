import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export interface CardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCard: number;
  totalCards: number;
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
  onPrevious: () => void;
  onNext: () => void;
  shortcuts?: {
    flip: string;
    next: string;
    previous: string;
    close: string;
  };
}

export function CardPreviewModal({
  isOpen,
  onClose,
  currentCard,
  totalCards,
  front,
  back,
  isFlipped,
  onFlip,
  onPrevious,
  onNext,
  shortcuts,
}: CardPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Clean up fullscreen on close
  useEffect(() => {
    if (!isOpen && document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isOpen]);

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
          <div className="fixed inset-0 bg-[var(--background)]/80 backdrop-blur-sm" />
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
              <Dialog.Panel
                className={cn(
                  "w-full transform overflow-hidden transition-all",
                  "bg-[var(--foreground)] shadow-2xl border border-[var(--neutral-200)]",
                  "rounded-2xl",
                  isFullscreen
                    ? "max-w-none h-screen rounded-none"
                    : "max-w-4xl"
                )}
              >
                <div
                  className={cn(
                    "relative flex flex-col",
                    isFullscreen ? "h-screen" : "min-h-[80vh]"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Dialog.Title className="text-lg font-medium text-[var(--text-primary)]">
                        Card {currentCard + 1} of {totalCards}
                      </Dialog.Title>
                      <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]/30" />
                      <div className="text-sm text-[var(--text-secondary)] font-medium">
                        {isFlipped ? "Answer" : "Question"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        title={
                          isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                        }
                      >
                        <Maximize2 className="h-5 w-5" />
                      </Button>
                      <button
                        onClick={onClose}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg p-2 hover:bg-[var(--neutral-100)]"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 p-8 flex items-center justify-center bg-gradient-to-b from-[var(--neutral-50)]/50 to-transparent">
                    <div
                      className={cn(
                        "w-full max-w-2xl mx-auto rounded-xl cursor-pointer",
                        "transition-all duration-300 ease-in-out transform",
                        "hover:shadow-lg hover:-translate-y-1",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      )}
                      onClick={onFlip}
                      role="button"
                      tabIndex={0}
                      aria-label={`Card content. Press ${
                        shortcuts?.flip || "Space"
                      } to flip`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onFlip();
                        }
                      }}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={isFlipped ? "back" : "front"}
                          initial={{ rotateX: -90, opacity: 0 }}
                          animate={{ rotateX: 0, opacity: 1 }}
                          exit={{ rotateX: 90, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                          className={cn(
                            "prose prose-lg max-w-none",
                            "p-8 rounded-xl",
                            "bg-[var(--foreground)] backdrop-blur-sm",
                            "border border-[var(--neutral-200)]",
                            "shadow-[0_0_30px_rgba(0,0,0,0.05)]"
                          )}
                          dangerouslySetInnerHTML={{
                            __html: isFlipped ? back : front,
                          }}
                        />
                      </AnimatePresence>
                      {shortcuts?.flip && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-center mt-6 text-sm text-[var(--text-secondary)]"
                        >
                          Press {shortcuts.flip} to flip
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between p-6 border-t border-[var(--neutral-200)] bg-[var(--neutral-50)]/50 backdrop-blur-sm">
                    <Button
                      variant="ghost"
                      onClick={onPrevious}
                      disabled={currentCard === 0}
                      className={cn(
                        "gap-2",
                        "hover:bg-[var(--neutral-100)]",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      aria-label="Previous card"
                    >
                      {shortcuts?.previous && (
                        <kbd className="ml-2 text-xs bg-[var(--neutral-100)] px-2 py-1 rounded border border-[var(--neutral-200)]">
                          {shortcuts.previous}
                        </kbd>
                      )}
                      Previous
                    </Button>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        {[...Array(totalCards)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "rounded-full transition-all duration-300",
                              i === currentCard
                                ? "w-6 h-1.5 bg-[var(--primary)]"
                                : "w-1.5 h-1.5 bg-[var(--neutral-300)]"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={onNext}
                      disabled={currentCard === totalCards - 1}
                      className={cn(
                        "gap-2",
                        "hover:bg-[var(--neutral-100)]",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      aria-label="Next card"
                    >
                      Next
                      {shortcuts?.next && (
                        <kbd className="ml-2 text-xs bg-[var(--neutral-100)] px-2 py-1 rounded border border-[var(--neutral-200)]">
                          {shortcuts.next}
                        </kbd>
                      )}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
