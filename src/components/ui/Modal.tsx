import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  isDestructive = false,
  isLoading = false,
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
                  <div className="flex items-center gap-3">
                    {isDestructive && (
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                    )}
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold text-[var(--text-primary)]"
                    >
                      {title}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="text-[var(--text-secondary)] mb-6">
                  {description}
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {cancelText}
                  </Button>
                  <Button
                    type="button"
                    variant={isDestructive ? "destructive" : "default"}
                    onClick={onConfirm}
                    disabled={isLoading}
                  >
                    {confirmText}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
