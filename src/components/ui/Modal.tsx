import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  onConfirm?: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  confirmText,
  onConfirm,
  isDestructive = false,
  isLoading = false,
  children,
}: ModalProps) {
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
                    {description && (
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {children}

                {onConfirm && (
                  <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={onConfirm}
                      className={cn(
                        "gap-2",
                        isDestructive && "bg-red-600 hover:bg-red-700"
                      )}
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {confirmText || "Confirm"}
                    </Button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
