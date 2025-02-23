import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Deck from "@/models/Deck";
import { connectToDatabase } from "@/lib/mongodb";

// Initialize OpenAI with API key check
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateFlashcards(terms: string[], topic: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an expert at creating detailed flashcards about ${topic}. For each term, create a comprehensive yet concise explanation that would be suitable for a flashcard. Format your response as a JSON array of objects with 'front' and 'back' properties.`,
      },
      {
        role: "user",
        content: `Create flashcards for the following terms related to ${topic}:\n${terms.join(
          "\n"
        )}`,
      },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0].message?.content;
  if (!content) {
    throw new Error("No content in response");
  }

  // Clean and parse the response
  const cleanedContent = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleanedContent);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const formData = await req.formData();
    const image = formData.get("image") as File;
    const mode = formData.get("mode") as "extract" | "generate";
    const deckId = formData.get("deckId") as string;
    const deckTopic = formData.get("deckTopic") as string;

    console.log("Processing request:", { mode, deckId, deckTopic });

    if (!image || !mode || !deckId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Get deck context
    const deck = await Deck.findById(deckId).populate("parentDeckId");
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Verify deck ownership
    if (deck.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prepare the prompt based on mode
    const systemPrompt =
      mode === "extract"
        ? `You are an expert at extracting terms and their definitions from educational documents about ${deckTopic}. Extract all terms and their definitions, maintaining the exact relationship between them as shown in the document. Format your response as a JSON array of objects with 'front' and 'definition' properties. Ensure all content is relevant to ${deckTopic}.`
        : `You are an expert at identifying important terms from educational documents about ${deckTopic}. Extract all relevant terms that would benefit from having flashcards created for them. Format your response as a JSON array of strings containing just the terms. Only extract terms relevant to ${deckTopic}.`;

    console.log("Calling OpenAI with prompt:", systemPrompt);

    try {
      // Call OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  mode === "extract"
                    ? `Extract all terms and their definitions from this document about ${deckTopic}. Ensure you maintain the exact relationships between terms and definitions as shown.`
                    : `Extract all important terms from this document that would benefit from having flashcards created for them about ${deckTopic}.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content in response");
      }

      console.log("OpenAI response:", content);

      let extractedData;
      try {
        // Clean the content by removing markdown code block syntax
        const cleanedContent = content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        extractedData = JSON.parse(cleanedContent);

        // If mode is extract, validate the format
        if (mode === "extract") {
          if (
            !Array.isArray(extractedData) ||
            !extractedData.every((item) => item.term && item.definition)
          ) {
            throw new Error("Invalid response format");
          }

          // Convert extracted term-definition pairs to cards
          const cards = extractedData.map((item) => ({
            front: item.term,
            back: item.definition,
          }));

          // Update the deck with new cards
          await Deck.findByIdAndUpdate(
            deckId,
            {
              $push: { cards: { $each: cards } },
              $inc: { cardCount: cards.length },
            },
            { new: true }
          );

          return NextResponse.json({
            data: cards,
            message: `Added ${cards.length} cards to your deck`,
          });
        } else {
          // For generate mode, ensure we have an array of strings
          if (!Array.isArray(extractedData)) {
            throw new Error("Invalid response format");
          }

          // Generate detailed flashcards for the extracted terms
          const cards = await generateFlashcards(extractedData, deckTopic);

          // Update the deck with new cards
          await Deck.findByIdAndUpdate(
            deckId,
            {
              $push: { cards: { $each: cards } },
              $inc: { cardCount: cards.length },
            },
            { new: true }
          );

          return NextResponse.json({
            data: cards,
            message: `Generated ${cards.length} cards for your deck`,
          });
        }
      } catch (error) {
        console.error("Failed to parse OpenAI response:", content, error);
        throw new Error("Failed to parse extracted content");
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(
        `OpenAI API error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process document",
      },
      { status: 500 }
    );
  }
}
