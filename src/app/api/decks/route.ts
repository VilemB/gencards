import "dotenv/config";
import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI!);
    const db = client.db();
    const decksCollection = db.collection("decks");

    const decks = await decksCollection
      .find({ userId: new ObjectId(session.user.id) })
      .sort({ createdAt: -1 })
      .toArray();

    await client.close();

    return NextResponse.json(decks);
  } catch (error) {
    console.error("Error fetching decks:", error);
    return NextResponse.json(
      { message: "Internal server error" },
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

    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    const client = await MongoClient.connect(process.env.MONGODB_URI!);
    const db = client.db();
    const decksCollection = db.collection("decks");

    const result = await decksCollection.insertOne({
      title,
      description,
      userId: new ObjectId(session.user.id),
      cardCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await client.close();

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
