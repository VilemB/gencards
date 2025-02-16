import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";

interface GenerateCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  responseType: "simple" | "complex";
  onResponseTypeChange: (type: "simple" | "complex") => void;
}

export function GenerateCardsModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  responseType,
  onResponseTypeChange,
}: GenerateCardsModalProps) {
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

                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
