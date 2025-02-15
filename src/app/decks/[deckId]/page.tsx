import DeckClient from "./DeckClient";
import { getDeck } from "@/lib/api/decks";
import { notFound } from "next/navigation";
import { Deck, PopulatedDeck } from "@/types/deck";
import { Document, Types } from "mongoose";

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
