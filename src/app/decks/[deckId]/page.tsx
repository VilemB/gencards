import DeckClient from "./DeckClient";
import { getDeck } from "@/lib/api/decks";
import { notFound } from "next/navigation";
import { Deck } from "@/types/deck";

interface Props {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const deckDoc = await getDeck(deckId);

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
    parentDeckId: deckDoc.parentDeckId?.toString() || undefined,
    path: deckDoc.path,
    level: deckDoc.level,
    hasChildren: deckDoc.hasChildren,
  };

  return <DeckClient deckId={deckId} deck={deck} />;
}
