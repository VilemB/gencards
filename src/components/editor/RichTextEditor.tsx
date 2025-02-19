"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  className,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:pointer-events-none before:h-0",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "prose dark:prose-invert prose-sm focus:outline-none",
          "prose-p:my-0 prose-headings:mb-3 prose-headings:mt-0",
          "prose-blockquote:my-0 prose-ul:my-0 prose-ol:my-0",
          "min-h-[120px] max-h-[300px] overflow-y-auto px-3 py-2",
          "selection:bg-primary/20",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // Check if content has any formatting
      const hasFormatting =
        editor.isActive("bold") ||
        editor.isActive("italic") ||
        editor.isActive("bulletList") ||
        editor.isActive("orderedList") ||
        editor.isActive("codeBlock") ||
        editor.isActive("blockquote");

      // If no formatting, just return the plain text
      if (!hasFormatting && !editor.getText().includes("\n")) {
        onChange(editor.getText());
      } else {
        onChange(editor.getHTML());
      }
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({
    isActive,
    onClick,
    children,
    disabled,
  }: {
    isActive?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-8 w-8",
        "hover:bg-muted hover:text-foreground",
        "active:bg-muted",
        "focus-visible:ring-1 focus-visible:ring-offset-0",
        isActive && "bg-muted text-foreground"
      )}
      disabled={disabled}
    >
      {children}
    </Button>
  );

  return (
    <div className="relative flex flex-col rounded-md border bg-card text-card-foreground">
      <div className="flex items-center gap-1 border-b p-1">
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="mx-1 h-4 w-[1px] bg-border" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="mx-1 h-4 w-[1px] bg-border" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      <div className="min-h-[120px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
