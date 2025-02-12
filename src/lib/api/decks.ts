import Deck from "@/models/Deck";
import { connectToDatabase } from "@/lib/mongodb";
import { Document, Types } from "mongoose";

interface ICard {
  _id: Types.ObjectId;
  front: string;
  back: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IDeck extends Document {
  _id: Types.ObjectId;
  userId: string;
  title: string;
  description: string;
  topic: string;
  isPublic: boolean;
  cardCount: number;
  cards: ICard[];
  createdAt: Date;
  updatedAt: Date;
  parentDeckId?: Types.ObjectId | null;
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
