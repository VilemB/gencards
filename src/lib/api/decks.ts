import Deck from "@/models/Deck";
import { connectToDatabase } from "@/lib/mongodb";
import { Document } from "mongoose";

interface IDeck extends Document {
  userId: string;
  title: string;
  description: string;
  topic: string;
  isPublic: boolean;
  cardCount: number;
  cards: Array<{
    front: string;
    back: string;
  }>;
  parentDeckId?: string | null;
  path: string;
  level: number;
  hasChildren: boolean;
}

export async function getDeck(deckId: string): Promise<IDeck | null> {
  try {
    await connectToDatabase();
    const deck = await Deck.findById(deckId);
    return deck;
  } catch (error) {
    console.error("Error fetching deck:", error);
    return null;
  }
}
