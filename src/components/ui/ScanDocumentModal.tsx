import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Loader2, Upload, FileText, List, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import type { FileWithPath } from "react-dropzone";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: "extract" | "generate" | null;
  deckId: string;
  deckTopic: string;
  onSuccess?: () => void;
}

export function ScanDocumentModal({
  isOpen,
  onClose,
  mode,
  deckId,
  deckTopic,
  onSuccess,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploadedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setError(null);
    },
  });

  const handleProcess = async () => {
    if (!uploadedFile || !mode) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("mode", mode);
      formData.append("deckId", deckId);
      formData.append("deckTopic", deckTopic);

      const response = await fetch("/api/decks/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to process document");
      }

      const result = await response.json();

      if (mode === "extract") {
        toast.success(`Extracted ${result.data.length} term-definition pairs`);
      } else {
        toast.success(`Extracted ${result.data.length} terms for generation`);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error processing document:", error);
      setError("Failed to process the document. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getTitle = () => {
    if (mode === "extract") return "Scan Document for Terms & Definitions";
    if (mode === "generate") return "Extract Terms for Generation";
    return "Scan Document";
  };

  const getDescription = () => {
    if (mode === "extract") {
      return "Upload a document containing terms and their definitions. We'll extract and create flashcards automatically.";
    }
    if (mode === "generate") {
      return "Upload a list of terms, and we'll generate detailed flashcards for each term.";
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "extract" ? (
              <FileText className="h-5 w-5" />
            ) : (
              <List className="h-5 w-5" />
            )}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-sm text-muted-foreground">
            {getDescription()}
          </div>

          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />

            {previewImage ? (
              <div className="relative w-full aspect-[3/2]">
                <Image
                  src={previewImage}
                  alt="Document preview"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Drop your document here or click to upload
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={!previewImage || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Document"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
