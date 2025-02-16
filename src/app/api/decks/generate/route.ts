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

    const {
      topic,
      count = 5,
      createNewDeck = false,
      responseType = "complex",
    } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Please provide a topic" },
        { status: 400 }
      );
    }

    let promptInstructions = "";
    if (responseType === "simple") {
      promptInstructions = `Create ${count} concise flashcards about "${topic}".
Each flashcard should follow these guidelines:
- Front: A single word or very short phrase
- Back: A direct, simple answer without additional explanation
- Keep both question and answer as brief as possible
- No HTML formatting needed
- Focus on core concepts only`;
    } else {
      promptInstructions = `Create ${count} detailed flashcards about "${topic}".
Each flashcard should follow these guidelines:
- Front: A clear, concise question or key term
- Back: A comprehensive explanation with examples and context
- Content should be accurate and educational
- Use appropriate HTML formatting with <p>, <ul>, <li> tags for structure
- Ensure progressive difficulty from basic to advanced concepts
- Include real-world examples where relevant`;
    }

    const prompt = `${promptInstructions}

Return the response in this exact JSON format:
{
  "flashcards": [
    {
      "front": "question or term",
      "back": "answer or definition"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educator creating flashcards. Your responses should be accurate, well-structured, and in valid JSON format.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message?.content;
    if (!responseText) {
      throw new Error("No response from AI model");
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (err) {
      console.error("Failed to parse AI response:", responseText, err);
      throw new Error("Invalid JSON response from AI model");
    }

    if (
      !parsedResponse.flashcards ||
      !Array.isArray(parsedResponse.flashcards)
    ) {
      throw new Error("Invalid response format from AI model");
    }

    // If createNewDeck is true, create a new deck with these cards
    if (createNewDeck) {
      await connectToDatabase();

      // Create deck
      const deck = await Deck.create({
        title: `${topic} - AI Generated`,
        description: `Automatically generated flashcards about ${topic}`,
        topic: topic.charAt(0).toUpperCase() + topic.slice(1),
        userId: session.user.id,
        cardCount: parsedResponse.flashcards.length,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create cards
      const cards = parsedResponse.flashcards.map((card: Flashcard) => ({
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
        cards: parsedResponse.flashcards,
      });
    }

    // Otherwise just return the generated cards
    return NextResponse.json({ cards: parsedResponse.flashcards });
  } catch (error: unknown) {
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
