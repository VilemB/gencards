import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deck from "@/models/Deck";
import Card from "@/models/Card";
import {
  getSystemPrompt,
  isDuplicate,
  Card as CardType,
} from "@/lib/prompts/flashcards";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getDeckChain(
  deckId: string | null
): Promise<{ titles: string[]; topics: string[]; fullPath: string }> {
  if (!deckId) return { titles: [], topics: [], fullPath: "" };

  const deck = await Deck.findById(deckId).populate({
    path: "parentDeckId",
    select: "title topic parentDeckId path",
    populate: {
      path: "parentDeckId",
      select: "title topic parentDeckId path",
    },
  });

  if (!deck) return { titles: [], topics: [], fullPath: "" };

  const titles: string[] = [];
  const topics: string[] = [];
  let currentDeck = deck;

  while (currentDeck) {
    titles.unshift(currentDeck.title);
    topics.unshift(currentDeck.topic || currentDeck.title);
    currentDeck = currentDeck.parentDeckId;
  }

  return {
    titles,
    topics,
    fullPath: deck.path || titles.join(" > "),
  };
}

async function getExistingCards(
  deckId: string | null
): Promise<Array<{ front: string; back: string }>> {
  if (!deckId) return [];

  const deck = await Deck.findById(deckId);
  if (!deck) return [];

  return deck.cards;
}

async function validateGeneratedCards(
  newCards: CardType[],
  existingCards: CardType[]
): Promise<{
  validCards: CardType[];
  duplicates: Array<{
    card: CardType;
    similarTo: CardType;
    similarity: number;
  }>;
}> {
  console.log("Validating cards:", {
    newCardsCount: newCards.length,
    existingCardsCount: existingCards.length,
  });

  const validCards: CardType[] = [];
  const duplicates: Array<{
    card: CardType;
    similarTo: CardType;
    similarity: number;
  }> = [];

  // First validate against existing cards
  for (const newCard of newCards) {
    if (existingCards.length > 0) {
      const {
        isDuplicate: isDup,
        similarCard,
        similarity,
      } = isDuplicate(newCard, existingCards);
      if (isDup && similarCard && similarity) {
        duplicates.push({ card: newCard, similarTo: similarCard, similarity });
        continue;
      }
    }

    // Then check against cards we've already validated
    if (validCards.length > 0) {
      const {
        isDuplicate: isInternalDup,
        similarCard: internalSimilar,
        similarity: internalSimilarity,
      } = isDuplicate(newCard, validCards);
      if (isInternalDup && internalSimilar && internalSimilarity) {
        duplicates.push({
          card: newCard,
          similarTo: internalSimilar,
          similarity: internalSimilarity,
        });
      } else {
        validCards.push(newCard);
      }
    } else {
      validCards.push(newCard);
    }
  }

  console.log("Validation results:", {
    validCardsCount: validCards.length,
    duplicatesCount: duplicates.length,
  });

  return { validCards, duplicates };
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
    const {
      titles: deckChainTitles,
      topics: deckChainTopics,
      fullPath,
    } = await getDeckChain(deckId);
    const existingCards = await getExistingCards(deckId);

    // Extract context from promptContext
    const { mainTopic, subtopic, instructions, format } = promptContext;

    // Use the full deck chain for context
    const systemPrompt = getSystemPrompt({
      mainTopic: deckChainTopics[0] || mainTopic,
      subtopic,
      deckChain: deckChainTitles,
      deckTopics: deckChainTopics,
      fullPath,
      existingCards,
      format,
    });

    // Enhance the user prompt with explicit context requirements
    const contextPath =
      deckChainTopics.length > 0
        ? `${deckChainTopics.join(" > ")} > ${topic}`
        : topic;

    const userPrompt = `Generate ${count} flashcards for "${topic}" that STRICTLY follow this context path: ${contextPath}.
Each card MUST be directly related to ${
      deckChainTitles[deckChainTitles.length - 1]
    } and its parent categories.
${instructions}`;

    console.log("Generating cards with context:", {
      deckChain: deckChainTitles,
      topics: deckChainTopics,
      fullPath,
      subtopic: topic,
      contextPath,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message?.content;
    if (!responseText) {
      throw new Error("No response from AI model");
    }

    let parsedResponse;
    try {
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

    // Validate generated cards for duplicates
    const { validCards, duplicates } = await validateGeneratedCards(
      parsedResponse.flashcards,
      existingCards
    );

    // Only consider it an error if we have duplicates against existing cards
    // when there are existing cards to check against
    const tooManyDuplicates =
      existingCards.length > 0 &&
      duplicates.length > parsedResponse.flashcards.length / 2;

    if (tooManyDuplicates) {
      return NextResponse.json(
        {
          error: "Too many duplicate cards generated",
          duplicates,
          validCards,
        },
        { status: 422 }
      );
    }

    // If createNewDeck is true, create a new deck with the valid cards
    if (createNewDeck) {
      await connectToDatabase();

      const deck = await Deck.create({
        title: `${topic} - AI Generated`,
        description: `Automatically generated flashcards about ${topic}`,
        topic: topic.charAt(0).toUpperCase() + topic.slice(1),
        userId: session.user.id,
        cardCount: validCards.length,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create cards
      const cards = validCards.map((card) => ({
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
        cards: validCards,
        duplicatesRemoved: duplicates.length,
      });
    }

    // Otherwise update existing deck with the valid cards
    if (deckId) {
      await connectToDatabase();

      const deck = await Deck.findById(deckId);
      if (!deck) {
        throw new Error("Deck not found");
      }

      // Add new valid cards to the deck
      deck.cards.push(...validCards);
      deck.cardCount = deck.cards.length;
      await deck.save();

      return NextResponse.json({
        cards: validCards,
        duplicatesRemoved: duplicates.length,
        message:
          duplicates.length > 0
            ? `${duplicates.length} duplicate cards were filtered out`
            : undefined,
      });
    }

    return NextResponse.json({ cards: validCards });
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
