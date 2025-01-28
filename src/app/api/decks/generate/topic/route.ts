import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Flashcard {
  front: string;
  back: string;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { message: "Topic is required" },
        { status: 400 }
      );
    }

    // Generate flashcards using OpenAI
    const prompt = `Create 10 comprehensive flashcards about "${topic}". Each flashcard should have a question on the front and a detailed answer on the back. Format the output as a JSON array of objects with "front" and "back" properties. Make the questions challenging and thought-provoking, and ensure the answers are detailed and accurate.`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a knowledgeable tutor creating educational flashcards. Provide accurate, concise, and well-structured information.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("Failed to generate flashcards");
    }

    const flashcards: Flashcard[] = JSON.parse(response).flashcards;

    // Save to database
    const client = await MongoClient.connect(process.env.MONGODB_URI!);
    const db = client.db();
    const decksCollection = db.collection("decks");
    const cardsCollection = db.collection("cards");

    // Create deck
    const deck = await decksCollection.insertOne({
      title: `${topic} - AI Generated`,
      description: `Automatically generated flashcards about ${topic}`,
      userId: new ObjectId(session.user.id),
      cardCount: flashcards.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create cards
    const cards = flashcards.map((card) => ({
      deckId: deck.insertedId,
      userId: new ObjectId(session.user.id),
      front: card.front,
      back: card.back,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await cardsCollection.insertMany(cards);
    await client.close();

    return NextResponse.json(
      {
        message: "Flashcards generated successfully",
        deckId: deck.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      { message: "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
