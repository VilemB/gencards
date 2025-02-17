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

async function getDeckChain(deckId: string | null): Promise<string[]> {
  if (!deckId) return [];

  const deck = await Deck.findById(deckId).populate({
    path: "parentDeckId",
    select: "title parentDeckId",
    populate: {
      path: "parentDeckId",
      select: "title parentDeckId",
    },
  });

  if (!deck) return [];

  const chain = [];
  let currentDeck = deck;
  while (currentDeck) {
    chain.unshift(currentDeck.title);
    currentDeck = currentDeck.parentDeckId;
  }
  return chain;
}

async function getExistingCards(
  deckId: string | null
): Promise<Array<{ front: string; back: string }>> {
  if (!deckId) return [];

  const deck = await Deck.findById(deckId);
  if (!deck) return [];

  return deck.cards;
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
      deckId = null,
    } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Please provide a topic" },
        { status: 400 }
      );
    }

    // Get deck chain for context
    const deckChain = await getDeckChain(deckId);
    const existingCards = await getExistingCards(deckId);

    // Split the topic to extract deck context and specific topic
    const [deckContext, specificTopic] = topic
      .split(" - ")
      .map((t: string) => t.trim());

    // Validate the context matches the deck's topic if adding to existing deck
    if (deckId) {
      const deck = await Deck.findById(deckId);
      if (deck && deck.topic.toLowerCase() !== deckContext.toLowerCase()) {
        return NextResponse.json(
          {
            error: `Cards must be in the same context as the deck (${deck.topic})`,
          },
          { status: 400 }
        );
      }
    }

    let promptInstructions = "";
    if (responseType === "simple") {
      promptInstructions = `Create ${count} concise flashcards about "${specificTopic}" STRICTLY in ${deckContext} language/context only.
Each flashcard should follow these guidelines:
- Front: A single word or very short phrase about ${specificTopic} in ${deckContext} ONLY
- Back: A direct, simple answer without additional explanation
- Keep both question and answer as brief as possible
- No HTML formatting needed
- Focus on core concepts only
- IMPORTANT: You MUST ONLY create content related to ${deckContext}. DO NOT include content from any other language or context
- IMPORTANT: DO NOT create cards that are too similar to the existing cards listed below
- IMPORTANT: If this is a language deck, all content MUST be in ${deckContext} language or about ${deckContext} language`;
    } else {
      promptInstructions = `Create ${count} detailed flashcards about "${specificTopic}" STRICTLY in ${deckContext} language/context only.
Each flashcard should follow these guidelines:
- Front: A clear, concise question or key term about ${specificTopic} in ${deckContext} ONLY
- Back: A comprehensive explanation with examples and context
- Content should be accurate and educational
- Use appropriate HTML formatting with <p>, <ul>, <li> tags for structure
- Ensure progressive difficulty from basic to advanced concepts
- Include real-world examples where relevant
- IMPORTANT: You MUST ONLY create content related to ${deckContext}. DO NOT include content from any other language or context
- IMPORTANT: DO NOT create cards that are too similar to the existing cards listed below
- IMPORTANT: If this is a language deck, all content MUST be in ${deckContext} language or about ${deckContext} language`;
    }

    // Add deck chain context if available
    const deckChainContext =
      deckChain.length > 0
        ? `\nThis flashcard set is part of the following deck hierarchy (from root to current): ${deckChain.join(
            " → "
          )}`
        : "";

    // Add existing cards to avoid duplicates
    const existingCardsContext =
      existingCards.length > 0
        ? `\n\nExisting cards in this deck (DO NOT create similar ones):\n${existingCards
            .map((card) => `- Front: "${card.front}"\n  Back: "${card.back}"`)
            .join("\n")}`
        : "";

    const prompt = `${promptInstructions}${deckChainContext}${existingCardsContext}

IMPORTANT: Your task is to create flashcards ONLY for ${deckContext}. If you're asked to generate content for any other context, you must refuse.

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
          content: `You are an expert educator specializing in ${deckContext}. Your task is to create educational flashcards about ${specificTopic}, but ONLY in the context of ${deckContext}.

IMPORTANT: You must NEVER generate content for any other context besides ${deckContext}. If the request seems to mix contexts, focus ONLY on ${deckContext}.

Adapt your response based on the subject matter:
- For Languages: Include native script, pronunciation, and cultural context ONLY for ${deckContext} language
- For Sciences: Include precise definitions, formulas, and real-world applications in the field of ${deckContext}
- For History/Literature: Include dates, key figures, and contextual significance specific to ${deckContext}
- For Mathematics: Include formulas, step-by-step solutions, and practical examples in ${deckContext}
- For Arts: Include terminology, techniques, and visual descriptions related to ${deckContext}
- For Other Subjects: Focus on core concepts and practical applications in ${deckContext}

General guidelines:
- Ensure accuracy and educational value
- Progress from fundamental to advanced concepts
- Include relevant examples and applications
- Use clear, concise language
- Maintain proper formatting with HTML tags when needed
- Avoid creating cards similar to existing ones
- Consider the full deck hierarchy context when creating new cards
- NEVER mix content from different contexts or languages

Your responses must be well-structured and in valid JSON format.`,
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
      // Clean the response text by removing markdown code block syntax
      const cleanedResponse = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsedResponse = JSON.parse(cleanedResponse);
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
