import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import {
  Loader2,
  Upload,
  FileText,
  List,
  AlertCircle,
  Languages,
  Info,
} from "lucide-react";
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

// Languages grouped by regions/families with ISO codes
const LANGUAGES = {
  common: [
    { code: "en", name: "English", native: "English" },
    { code: "es", name: "Spanish", native: "Español" },
    { code: "fr", name: "French", native: "Français" },
    { code: "de", name: "German", native: "Deutsch" },
  ],
  slavic: [
    { code: "cs", name: "Czech", native: "Čeština" },
    { code: "pl", name: "Polish", native: "Polski" },
    { code: "ru", name: "Russian", native: "Русский" },
    { code: "uk", name: "Ukrainian", native: "Українська" },
  ],
  asian: [
    { code: "ja", name: "Japanese", native: "日本語" },
    { code: "ko", name: "Korean", native: "한국어" },
    { code: "zh", name: "Chinese", native: "中文" },
  ],
  other: [
    { code: "it", name: "Italian", native: "Italiano" },
    { code: "pt", name: "Portuguese", native: "Português" },
    { code: "sv", name: "Swedish", native: "Svenska" },
  ],
};

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
  const [inputLanguage, setInputLanguage] = useState("en");
  const [outputLanguage, setOutputLanguage] = useState("en");

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

  // Flatten language list for finding names
  const allLanguages = Object.values(LANGUAGES).flat();
  const getLanguageDisplay = (code: string) => {
    const lang = allLanguages.find((l) => l.code === code);
    return lang ? `${lang.name} (${lang.native})` : code;
  };

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
      formData.append("inputLanguage", inputLanguage);
      formData.append("outputLanguage", outputLanguage);

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

  const renderLanguageOptions = (languages: typeof LANGUAGES.common) => {
    return languages.map((lang) => (
      <option key={lang.code} value={lang.code}>
        {lang.name} ({lang.native})
      </option>
    ));
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
            {mode === "extract"
              ? "Scan Document for Terms & Definitions"
              : "Extract Terms for Generation"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "extract"
              ? "Upload a document containing terms and their definitions. We'll extract and create flashcards automatically."
              : "Upload a list of terms, and we'll generate detailed flashcards for each term."}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Selection Section */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Languages className="h-4 w-4" />
              Language Settings
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Document Language
                </label>
                <select
                  value={inputLanguage}
                  onChange={(e) => setInputLanguage(e.target.value)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-sm",
                    "bg-background text-black",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <optgroup label="Common Languages">
                    {renderLanguageOptions(LANGUAGES.common)}
                  </optgroup>
                  <optgroup label="Slavic Languages">
                    {renderLanguageOptions(LANGUAGES.slavic)}
                  </optgroup>
                  <optgroup label="Asian Languages">
                    {renderLanguageOptions(LANGUAGES.asian)}
                  </optgroup>
                  <optgroup label="Other Languages">
                    {renderLanguageOptions(LANGUAGES.other)}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Output Language
                </label>
                <select
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-sm",
                    "bg-background text-black",
                    "focus:outline-none focus:ring-2 focus:ring-primary",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <optgroup label="Common Languages">
                    {renderLanguageOptions(LANGUAGES.common)}
                  </optgroup>
                  <optgroup label="Slavic Languages">
                    {renderLanguageOptions(LANGUAGES.slavic)}
                  </optgroup>
                  <optgroup label="Asian Languages">
                    {renderLanguageOptions(LANGUAGES.asian)}
                  </optgroup>
                  <optgroup label="Other Languages">
                    {renderLanguageOptions(LANGUAGES.other)}
                  </optgroup>
                </select>
              </div>
            </div>

            {inputLanguage !== outputLanguage && (
              <div className="flex items-start gap-2 text-sm bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 p-3 rounded-md">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Translation Mode</p>
                  <p className="mt-1 text-blue-600 dark:text-blue-400">
                    Content will be translated from{" "}
                    {getLanguageDisplay(inputLanguage)} to{" "}
                    {getLanguageDisplay(outputLanguage)}. Technical terms will
                    be preserved when appropriate.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Document Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Upload className="h-4 w-4" />
              Document Upload
            </div>

            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50",
                previewImage && "border-primary/50 bg-muted/50"
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
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={!previewImage || isProcessing}
              className="min-w-[100px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
