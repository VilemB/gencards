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
      promptContext,
      count = 5,
      createNewDeck = false,
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

    // Extract context from promptContext
    const { mainTopic, subtopic, instructions, format } = promptContext;

    const systemPrompt = `You are an expert educator specializing in ${mainTopic}. Your task is to create educational flashcards that are DIRECT EXAMPLES of ${subtopic} in ${mainTopic}.

Key Requirements:
1. Each card must be a DIRECT EXAMPLE, not an explanation or definition
2. Stay strictly within the context of ${mainTopic}
3. Never mix content from different contexts

Context-Specific Guidelines:
- For Languages (e.g., Korean, Spanish):
  * Front: The actual word/phrase in the target language
  * Back: Translation + pronunciation (if relevant)
  * Example for "verbs": Front: "먹다" Back: "to eat (meokda)"
  * NO grammar explanations or definitions about verbs

- For Sciences:
  * Front: Specific example/instance
  * Back: Explanation/application
  * Example for "elements": Front: "Fe" Back: "Iron - Used in hemoglobin"
  * NO general definitions about what elements are

- For Mathematics:
  * Front: Specific problem/equation
  * Back: Solution/result
  * Example for "equations": Front: "2x + 5 = 15" Back: "x = 5"
  * NO explanations about what equations are

- For History:
  * Front: Specific event/date
  * Back: Significance/outcome
  * Example for "battles": Front: "Battle of Hastings 1066" Back: "Norman Conquest of England"
  * NO general descriptions about battles

Quality Standards:
- Each card must be a concrete example
- No theoretical explanations unless specifically requested
- Keep responses clear and concise
- Use appropriate formatting
- Avoid duplicating existing cards
- Consider the full context hierarchy

Format your response as valid JSON:
{
  "flashcards": [
    {
      "front": "actual example",
      "back": "meaning/translation/result"
    }
  ]
}`;

    const userPrompt = `${instructions}

Context:
- Main Topic: ${mainTopic}
- Subtopic: ${subtopic}
- Format: ${format}
- Deck Chain: ${deckChain.join(" > ")}

${
  existingCards.length > 0
    ? `Existing cards (avoid duplicates):
${existingCards
  .map((card) => `- Front: "${card.front}" Back: "${card.back}"`)
  .join("\n")}`
    : ""
}

Create ${count} flashcards that are DIRECT EXAMPLES of ${subtopic} in ${mainTopic}.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
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
    if (deckId) {
      await connectToDatabase();

      // Update existing deck with new cards
      const deck = await Deck.findById(deckId);
      if (!deck) {
        throw new Error("Deck not found");
      }

      // Add new cards to the deck
      const newCards = parsedResponse.flashcards.map((card: Flashcard) => ({
        front: card.front,
        back: card.back,
      }));

      deck.cards.push(...newCards);
      deck.cardCount = deck.cards.length;
      await deck.save();
    }

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
