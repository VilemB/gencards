import "dotenv/config";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deck from "@/models/Deck";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const decks = await Deck.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(decks);
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

    const { title, description, topic, isPublic } = await req.json();

    // Validate required fields
    if (!title || !description || !topic) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const deck = await Deck.create({
      userId: session.user.id,
      title,
      description,
      topic,
      isPublic: isPublic || false,
      cardCount: 0,
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
