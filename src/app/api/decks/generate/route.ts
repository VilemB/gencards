import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deck from "@/models/Deck";
import Card from "@/models/Card";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Flashcard {
  front: string;
  back: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { topic, count = 5, createNewDeck = false } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Please provide a topic" },
        { status: 400 }
      );
    }

    const prompt = `Create ${count} high-quality flashcards about "${topic}". 
Each flashcard should follow these guidelines:
- Front: A clear, concise question or key term
- Back: A comprehensive but focused explanation or definition
- Content should be accurate and educational
- Use appropriate HTML formatting with <p>, <ul>, <li> tags for structure
- Ensure progressive difficulty from basic to advanced concepts
- Include real-world examples where relevant

Format the output as a JSON object with a "flashcards" array containing objects with "front" and "back" properties.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educator creating comprehensive flashcards. Your responses should be accurate, well-structured, and in valid JSON format.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0].message?.content;
    if (!responseText) {
      throw new Error("No response from AI model");
    }

    const { flashcards } = JSON.parse(responseText);

    // If createNewDeck is true, create a new deck with these cards
    if (createNewDeck) {
      await connectToDatabase();

      // Create deck
      const deck = await Deck.create({
        title: `${topic} - AI Generated`,
        description: `Automatically generated flashcards about ${topic}`,
        topic: topic.charAt(0).toUpperCase() + topic.slice(1),
        userId: session.user.id,
        cardCount: flashcards.length,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create cards
      const cards = flashcards.map((card: Flashcard) => ({
        deckId: deck._id,
        userId: session.user.id,
        front: card.front,
        back: card.back,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await Card.insertMany(cards);

      return NextResponse.json({
        message: "Deck created successfully",
        deckId: deck._id,
        cards: flashcards,
      });
    }

    // Otherwise just return the generated cards
    return NextResponse.json({ cards: flashcards });
  } catch (error: Error | unknown) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate flashcards",
      },
      { status: 500 }
    );
  }
}
