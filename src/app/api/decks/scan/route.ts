import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Deck from "@/models/Deck";
import { connectToDatabase } from "@/lib/mongodb";
import sharp from "sharp";

// Initialize OpenAI with API key check
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Maximum dimensions for image processing
const MAX_IMAGE_SIZE = 1024;

async function compressImage(buffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Resize if larger than MAX_IMAGE_SIZE while maintaining aspect ratio
    if (metadata.width && metadata.height) {
      const maxDimension = Math.max(metadata.width, metadata.height);
      if (maxDimension > MAX_IMAGE_SIZE) {
        const resizeFactor = MAX_IMAGE_SIZE / maxDimension;
        const newWidth = Math.round(metadata.width * resizeFactor);
        const newHeight = Math.round(metadata.height * resizeFactor);
        image.resize(newWidth, newHeight);
      }
    }

    // Compress image
    return await image.jpeg({ quality: 80, progressive: true }).toBuffer();
  } catch (error) {
    console.error("Image compression failed:", error);
    return buffer; // Return original buffer if compression fails
  }
}

async function generateFlashcards(terms: string[], topic: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Create high-quality, detailed flashcards about ${topic}. For each term:
1. Provide a clear, accurate definition or explanation
2. Include relevant context and examples where appropriate
3. Focus on key concepts and their significance
Format: JSON array with front/back properties. Ensure each card is informative and academically sound.`,
      },
      {
        role: "user",
        content: `Create detailed flashcards for these terms about ${topic}:\n${terms.join(
          "\n"
        )}\nEnsure information is accurate and well-explained.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const content = response.choices[0].message?.content;
  if (!content) throw new Error("No content in response");

  return JSON.parse(content.replace(/```json\n?|```\n?/g, "").trim());
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

    if (!image || !mode || !deckId || !deckTopic) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Process and compress image
    const bytes = await image.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);
    const compressedBuffer = await compressImage(originalBuffer);
    const base64Image = compressedBuffer.toString("base64");

    // Get deck and verify ownership
    const deck = await Deck.findById(deckId);
    if (!deck)
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    if (deck.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // General-purpose enhanced prompts
    const systemPrompt =
      mode === "extract"
        ? `Extract key terms and their detailed explanations from this document about ${deckTopic}. For each term:
- Provide clear, complete explanations
- Include relevant context and examples
- Maintain accuracy and depth
Format: JSON array with front/back properties. Ensure each entry is complete and well-explained.`
        : `Extract important terms from this document about ${deckTopic} that would benefit from detailed explanation. Focus on:
- Key concepts and terminology
- Important examples and instances
- Significant elements and components
Format: JSON array of strings. Extract terms that are central to understanding ${deckTopic}.`;

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
                  ? `Extract key terms and their complete explanations from this ${deckTopic} document. Focus on accuracy and clarity.`
                  : `Identify important terms from this ${deckTopic} document that need detailed explanation.`,
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
      max_tokens: 4000,
      temperature: 0.3,
    });

    const content = response.choices[0].message?.content;
    if (!content) throw new Error("No content in response");

    const extractedData = JSON.parse(
      content.replace(/```json\n?|```\n?/g, "").trim()
    );

    if (mode === "extract") {
      if (!Array.isArray(extractedData)) {
        throw new Error("Invalid response format - not an array");
      }

      const cards = extractedData
        .filter((item) => {
          const isValid =
            item.front &&
            (item.back || item.definition) &&
            typeof item.front === "string" &&
            typeof (item.back || item.definition) === "string";

          if (isValid) {
            const back = item.back || item.definition;
            return (
              back.length > 20 &&
              !back.includes("undefined") &&
              !back.includes("unknown") &&
              back.toLowerCase() !== item.front.toLowerCase()
            );
          }
          return false;
        })
        .map((item) => ({
          front: item.front.trim(),
          back: (item.back || item.definition).trim(),
        }));

      if (cards.length === 0) {
        throw new Error("No valid cards could be extracted");
      }

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
        skipped: extractedData.length - cards.length,
      });
    } else {
      if (!Array.isArray(extractedData)) {
        throw new Error("Invalid response format");
      }

      const cards = await generateFlashcards(extractedData, deckTopic);

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
