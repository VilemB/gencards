import "dotenv/config";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const decks = await mongoose.connection
      .collection("decks")
      .find({ userId: new mongoose.Types.ObjectId(session.user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    // Ensure we always return an array, even if empty
    return NextResponse.json(Array.isArray(decks) ? decks : []);
  } catch (error) {
    console.error("Error fetching decks:", error);
    // Return empty array instead of error to prevent map issues
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const result = await mongoose.connection.collection("decks").insertOne({
      title,
      description,
      userId: new mongoose.Types.ObjectId(session.user.id),
      cardCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Deck created successfully", deckId: result.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
