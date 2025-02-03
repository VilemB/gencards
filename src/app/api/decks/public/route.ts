import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Deck from "@/models/Deck";

interface DeckQuery {
  isPublic: boolean;
  topic?: string;
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    // Get topic from query params
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");

    // Build query
    const query: DeckQuery = { isPublic: true };
    if (topic) {
      query.topic = topic;
    }

    // Fetch public decks
    const decks = await Deck.find(query)
      .select("title description topic cardCount userId createdAt")
      .sort({ createdAt: -1 });

    // Get unique topics for filtering
    const topics = await Deck.distinct("topic", { isPublic: true });

    return NextResponse.json({ decks, topics });
  } catch (error) {
    console.error("[PUBLIC_DECKS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
