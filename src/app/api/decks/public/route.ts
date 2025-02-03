import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Deck from "@/models/Deck";

interface DeckQuery {
  isPublic: boolean;
  topic?: { $regex: string; $options: string };
  $or?: Array<
    | {
        title: { $regex: string; $options: string };
      }
    | {
        description: { $regex: string; $options: string };
      }
  >;
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    // Get query params
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");
    const search = searchParams.get("search");

    // Build query
    const query: DeckQuery = { isPublic: true };
    if (topic) {
      // Case-insensitive topic matching
      query.topic = { $regex: `^${topic}$`, $options: "i" };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Fetch public decks
    const decks = await Deck.find(query)
      .select("title description topic cardCount userId createdAt")
      .sort({ createdAt: -1 });

    // Get unique topics and ensure they're capitalized
    const topics = (await Deck.distinct("topic", { isPublic: true }))
      .map((topic) => topic.charAt(0).toUpperCase() + topic.slice(1))
      .sort();

    return NextResponse.json({ decks, topics });
  } catch (error) {
    console.error("[PUBLIC_DECKS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
