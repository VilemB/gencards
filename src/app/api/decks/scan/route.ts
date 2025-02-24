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

async function generateFlashcards(
  terms: string[],
  topic: string,
  outputLanguage: string
) {
  const systemPrompt = `You are a language expert and educator creating flashcards in ${outputLanguage}. Your task:

1. For each term, create a detailed, accurate flashcard that:
   - Preserves the original term if it's a proper noun or technical term
   - Provides a clear, comprehensive explanation in ${outputLanguage}
   - Includes relevant context and examples where appropriate
   - Maintains academic accuracy and depth

2. Format Requirements:
   - Keep special characters and diacritics intact
   - For Slavic languages, preserve case-specific grammar
   - Include pronunciation guides where helpful
   - Maintain any subject-specific formatting

3. Quality Standards:
   - Explanations must be complete and accurate
   - Include relevant cultural or contextual information
   - Ensure proper grammar and natural language flow
   - Technical terms should be precise and well-defined

Format your response as a JSON array of objects with 'front' and 'back' properties.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `Create detailed flashcards for these terms about ${topic}. Each card should have a clear, accurate explanation in ${outputLanguage}:

${terms.join("\n")}

Ensure each explanation is thorough and academically sound.`,
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
    const inputLanguage = formData.get("inputLanguage") as string;
    const outputLanguage = formData.get("outputLanguage") as string;

    if (
      !image ||
      !mode ||
      !deckId ||
      !deckTopic ||
      !inputLanguage ||
      !outputLanguage
    ) {
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

    // Enhanced language-aware prompts with specific handling for different language families
    const getLanguageSpecificInstructions = (lang: string) => {
      const langInstructions: Record<string, string> = {
        cs: `
- Preserve Czech diacritical marks (háčky a čárky)
- Maintain proper declension and conjugation
- Include gender for nouns (m., ž., s.)
- Note aspect pairs for verbs where relevant`,
        ru: `
- Preserve Russian Cyrillic characters
- Note stress marks where helpful
- Include gender and animacy for nouns
- Note aspect pairs for verbs`,
        ja: `
- Include kanji with furigana readings
- Note pitch accent where relevant
- Include common collocations
- Preserve proper Japanese formatting`,
        ko: `
- Include Hangul with romanization
- Note honorific levels where relevant
- Include particle usage
- Preserve Korean-specific formatting`,
      };

      return langInstructions[lang] || "";
    };

    const systemPrompt =
      mode === "extract"
        ? `You are analyzing a document in ${inputLanguage} about ${deckTopic}. Your task:

1. Document Analysis:
   - Carefully read and understand the content
   - Identify key terms and their explanations
   - Focus on terms directly related to ${deckTopic}

2. Extraction Rules:
   - Extract terms in their original ${inputLanguage} form
   - ${
     inputLanguage === outputLanguage
       ? "Use the actual explanation from the document"
       : `Translate explanations to ${outputLanguage} while preserving accuracy`
   }
   - Only include terms with clear, complete explanations
   - Maintain proper formatting and special characters

3. Language-Specific Requirements:
   ${getLanguageSpecificInstructions(inputLanguage)}
   ${
     inputLanguage !== outputLanguage
       ? getLanguageSpecificInstructions(outputLanguage)
       : ""
   }

4. Quality Standards:
   - Ensure each term is relevant to ${deckTopic}
   - Verify explanations are complete and accurate
   - Maintain academic rigor and precision
   - Preserve technical terminology

Format: JSON array with front/back properties.
Do NOT include:
- Terms without clear explanations
- Irrelevant or tangential content
- Incomplete or ambiguous definitions`
        : `You are analyzing a document in ${inputLanguage} about ${deckTopic}. Your task:

1. Content Analysis:
   - Understand the document's focus on ${deckTopic}
   - Identify key terms and concepts
   - Evaluate term relevance and importance

2. Term Selection Rules:
   - Extract terms in original ${inputLanguage} form
   - Focus on terms central to ${deckTopic}
   - Include terms that need detailed explanation
   - Maintain proper formatting and special characters

3. Language-Specific Requirements:
   ${getLanguageSpecificInstructions(inputLanguage)}

4. Quality Standards:
   - Ensure each term is significant
   - Verify term relevance to topic
   - Maintain academic precision
   - Preserve technical terminology

Format: JSON array of strings.
Do NOT include:
- Generic or common words
- Irrelevant terms
- Partial or incomplete concepts`;

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
                  ? `Analyze this document about ${deckTopic} and extract relevant terms with their explanations. ${
                      inputLanguage !== outputLanguage
                        ? `Extract terms in ${inputLanguage} and provide explanations in ${outputLanguage}.`
                        : ""
                    }`
                  : `Analyze this document about ${deckTopic} and identify key terms that need detailed explanation.`,
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

      const cards = await generateFlashcards(
        extractedData,
        deckTopic,
        outputLanguage
      );

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
