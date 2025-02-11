import Deck from "@/models/Deck";
import { connectToDatabase } from "@/lib/mongodb";

export async function getDeck(deckId: string): Promise<typeof Deck | null> {
  try {
    await connectToDatabase();
    const deck = await Deck.findById(deckId);
    return deck;
  } catch (error) {
    console.error("Error fetching deck:", error);
    return null;
  }
}
