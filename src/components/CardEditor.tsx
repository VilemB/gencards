import { forwardRef, useState } from "react";
import { X, GripVertical } from "lucide-react";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

export interface CardEditorProps {
  id: string;
  front: string;
  back: string;
  index: number;
  isDragging?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps;
  onRemove: (index: number) => void;
  onChange: (index: number, field: "front" | "back", value: string) => void;
}

export const CardEditor = forwardRef<HTMLDivElement, CardEditorProps>(
  (
    {
      id,
      front,
      back,
      index,
      isDragging = false,
      dragHandleProps,
      onRemove,
      onChange,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <motion.div
        ref={ref}
        initial={false}
        animate={{
          scale: isDragging ? 1.02 : 1,
          boxShadow: isDragging
            ? "0 10px 25px -5px rgba(0,0,0,0.1)"
            : isFocused
            ? "0 4px 12px rgba(0,0,0,0.1)"
            : "0 1px 3px rgba(0,0,0,0.1)",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={cn(
          "relative rounded-lg p-6",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-50",
          "bg-card hover:bg-accent/50 transition-colors",
          "dark:hover:bg-accent/10"
        )}
        role="group"
        aria-label={`Card ${index + 1}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className={cn(
                "group/handle p-2 -m-2 rounded-md",
                "cursor-grab active:cursor-grabbing",
                "text-muted-foreground hover:text-foreground",
                "transition-all duration-200",
                "hover:bg-muted focus:bg-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary"
              )}
              role="button"
              tabIndex={0}
              aria-label="Drag to reorder"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // Add haptic feedback if supported
                  if (window.navigator.vibrate) {
                    window.navigator.vibrate(50);
                  }
                }
              }}
            >
              <GripVertical className="h-4 w-4" />
              <span className="sr-only">Drag to reorder</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className={cn(
              "p-2 -m-2 rounded-md",
              "text-muted-foreground hover:text-foreground",
              "transition-all duration-200",
              "hover:bg-muted focus:bg-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary"
            )}
            aria-label="Remove card"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove card</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pr-16">
          <div className="space-y-2">
            <label
              htmlFor={`front-${id}`}
              className="block text-sm font-medium text-card-foreground"
            >
              Front
            </label>
            <RichTextEditor
              content={front}
              onChange={(content) => onChange(index, "front", content)}
              placeholder="Enter card front"
              className="min-h-[120px] max-h-[300px]"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`back-${id}`}
              className="block text-sm font-medium text-card-foreground"
            >
              Back
            </label>
            <RichTextEditor
              content={back}
              onChange={(content) => onChange(index, "back", content)}
              placeholder="Enter card back"
              className="min-h-[120px] max-h-[300px]"
            />
          </div>
        </div>

        {/* Visual feedback for dragging state */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none" />
        )}
      </motion.div>
    );
  }
);

CardEditor.displayName = "CardEditor";
