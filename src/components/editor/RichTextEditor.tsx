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

interface Props {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-[var(--text-secondary)] before:float-left before:pointer-events-none",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral max-w-none focus:outline-none min-h-[100px] px-3 py-2",
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

  return (
    <div className="border border-[var(--neutral-200)] rounded-lg overflow-hidden bg-[var(--background)]">
      <div className="border-b border-[var(--neutral-200)] p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-[var(--neutral-100)]" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-[var(--neutral-100)]" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={
            editor.isActive("bulletList") ? "bg-[var(--neutral-100)]" : ""
          }
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={
            editor.isActive("orderedList") ? "bg-[var(--neutral-100)]" : ""
          }
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={
            editor.isActive("codeBlock") ? "bg-[var(--neutral-100)]" : ""
          }
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={
            editor.isActive("blockquote") ? "bg-[var(--neutral-100)]" : ""
          }
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
