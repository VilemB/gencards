import DeckClient from "./DeckClient";
import { getDeck } from "@/lib/api/decks";
import { notFound } from "next/navigation";
import { Deck, PopulatedDeck } from "@/types/deck";
import { Document, Types } from "mongoose";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{
    deckId: string;
  }>;
}

interface DeckDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  parentDeckId?: DeckDocument;
  userId: string;
  description: string;
  topic: string;
  isPublic: boolean;
  cardCount: number;
  cards: Array<{
    _id: Types.ObjectId;
    front: string;
    back: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  path: string;
  level: number;
  hasChildren: boolean;
}

function convertPopulatedDeck(
  doc: DeckDocument | null | undefined
): PopulatedDeck | undefined {
  if (!doc) return undefined;
  return {
    _id: doc._id.toString(),
    title: doc.title,
    parentDeckId: doc.parentDeckId
      ? convertPopulatedDeck(doc.parentDeckId)
      : undefined,
  };
}

interface CardPreviewProps {
  question: string;
  onClick: () => void;
  index: number;
}

function CardPreview({ question, onClick, index }: CardPreviewProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        "bg-card hover:bg-accent transition-colors",
        "border border-border rounded-xl",
        "shadow-sm hover:shadow-md"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div
        onClick={onClick}
        className={cn(
          "p-6 cursor-pointer",
          "transition-all duration-200",
          "hover:translate-y-[-2px]"
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
          <div
            dangerouslySetInnerHTML={{ __html: question }}
            className="line-clamp-3"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span>Click to preview (Space to flip)</span>
        </div>
      </div>
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-[2px]",
          "bg-gradient-to-r from-primary/40 via-primary to-primary/40",
          "transform scale-x-0 group-hover:scale-x-100",
          "transition-transform duration-200"
        )}
      />
    </div>
  );
}

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const deckDoc = (await getDeck(deckId)) as DeckDocument;

  if (!deckDoc) {
    notFound();
  }

  // Convert Mongoose document to plain object and ensure dates are strings
  const deck: Deck = {
    _id: deckDoc._id.toString(),
    userId: deckDoc.userId,
    title: deckDoc.title,
    description: deckDoc.description,
    topic: deckDoc.topic,
    isPublic: deckDoc.isPublic,
    cardCount: deckDoc.cardCount,
    cards: deckDoc.cards.map((card) => ({
      _id: card._id.toString(),
      front: card.front,
      back: card.back,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    })),
    createdAt: deckDoc.createdAt.toISOString(),
    updatedAt: deckDoc.updatedAt.toISOString(),
    parentDeckId: deckDoc.parentDeckId
      ? convertPopulatedDeck(deckDoc.parentDeckId)
      : undefined,
    path: deckDoc.path,
    level: deckDoc.level,
    hasChildren: deckDoc.hasChildren,
  };

  return <DeckClient deckId={deckId} deck={deck} />;
}
