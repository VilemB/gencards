import "dotenv/config";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deck from "@/models/Deck";

interface DeckQuery {
  userId?: string | { $ne: string };
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get query params
    const { searchParams } = new URL(req.url);
    const ownership = searchParams.get("ownership"); // "my" | "others" | null
    const topic = searchParams.get("topic");
    const search = searchParams.get("search");

    // Build query
    const query: DeckQuery = {};

    // Handle ownership filter
    if (ownership === "my") {
      query.userId = session.user.id;
    } else if (ownership === "others") {
      query.userId = { $ne: session.user.id };
    }

    // Handle topic filter
    if (topic) {
      query.topic = { $regex: `^${topic}$`, $options: "i" };
    }

    // Handle search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const decks = await Deck.find(query)
      .select(
        "title description topic cardCount userId createdAt parentDeckId hasChildren"
      )
      .populate({
        path: "parentDeckId",
        select: "title parentDeckId",
        populate: {
          path: "parentDeckId",
          select: "title parentDeckId",
        },
      })
      .sort({ createdAt: -1 });

    // Get unique topics
    const topics = (await Deck.distinct("topic"))
      .map((topic) => topic.charAt(0).toUpperCase() + topic.slice(1))
      .sort();

    return NextResponse.json({ decks, topics });
  } catch (error) {
    console.error("Error fetching decks:", error);
    return NextResponse.json(
      { message: "Error fetching decks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, description, topic, isPublic, parentDeckId } =
      await req.json();

    // Validate required fields
    if (!title || !description || !topic) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Capitalize the first letter of the topic
    const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);

    // If parentDeckId is provided, verify it exists and update its hasChildren flag
    if (parentDeckId) {
      const parentDeck = await Deck.findById(parentDeckId);
      if (!parentDeck) {
        return NextResponse.json(
          { message: "Parent deck not found" },
          { status: 404 }
        );
      }

      // Update parent deck's hasChildren flag
      if (!parentDeck.hasChildren) {
        parentDeck.hasChildren = true;
        await parentDeck.save();
      }
    }

    const deck = await Deck.create({
      userId: session.user.id,
      title,
      description,
      topic: capitalizedTopic,
      isPublic: isPublic || false,
      cardCount: 0,
      parentDeckId: parentDeckId || null,
      hasChildren: false,
    });

    return NextResponse.json(deck);
  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json(
      { message: "Error creating deck" },
      { status: 500 }
    );
  }
}
