import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./button";

interface CardPreviewModalProps {
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
}: CardPreviewModalProps) {
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[var(--background)] shadow-xl transition-all">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--neutral-200)]">
                  <Dialog.Title className="text-lg font-semibold text-[var(--text-primary)]">
                    Card {currentCard + 1} of {totalCards}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-full p-1 hover:bg-[var(--neutral-100)]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div
                    className="relative w-full aspect-[3/2] perspective-1000 cursor-pointer"
                    onClick={onFlip}
                  >
                    <motion.div
                      className="w-full h-full preserve-3d"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{
                        duration: 0.6,
                        type: "spring",
                        stiffness: 100,
                      }}
                    >
                      {/* Front */}
                      <div
                        className={`absolute w-full h-full backface-hidden ${
                          isFlipped ? "invisible" : "visible"
                        }`}
                      >
                        <div className="h-full flex flex-col items-center justify-center bg-[var(--neutral-50)] rounded-xl p-8 border border-[var(--neutral-200)]">
                          <div
                            className="prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: front }}
                          />
                          <button
                            className="absolute bottom-4 right-4 btn-ghost rounded-full p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--neutral-100)]"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFlip();
                            }}
                          ></button>
                        </div>
                      </div>

                      {/* Back */}
                      <div
                        className={`absolute w-full h-full backface-hidden rotate-y-180 ${
                          isFlipped ? "visible" : "invisible"
                        }`}
                      >
                        <div className="h-full flex flex-col items-center justify-center bg-[var(--neutral-50)] rounded-xl p-8 border border-[var(--neutral-200)]">
                          <div
                            className="prose prose-lg max-w-none"
                            dangerouslySetInnerHTML={{ __html: back }}
                          />
                          <button
                            className="absolute bottom-4 right-4 btn-ghost rounded-full p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--neutral-100)]"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFlip();
                            }}
                          ></button>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="text-center text-sm text-[var(--text-secondary)] mt-4">
                    Click card to flip
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[var(--neutral-50)] border-t border-[var(--neutral-200)]">
                  <div className="flex justify-between gap-4">
                    <Button
                      variant="outline"
                      onClick={onPrevious}
                      disabled={currentCard === 0}
                      className="flex-1 gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onNext}
                      disabled={currentCard === totalCards - 1}
                      className="flex-1 gap-2"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
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
