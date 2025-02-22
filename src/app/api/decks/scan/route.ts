import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@clerk/nextjs/server";
import Deck from "@/models/Deck";
import { connectToDatabase } from "@/lib/mongodb";

const openai = new OpenAI();

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const formData = await req.formData();
    const image = formData.get("image") as File;
    const mode = formData.get("mode") as "extract" | "generate";
    const deckId = formData.get("deckId") as string;

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
    const deck = await Deck.findById(deckId).populate("parent");
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Prepare the prompt based on mode
    const systemPrompt =
      mode === "extract"
        ? "You are an expert at extracting terms and their definitions from educational documents. Extract all terms and their definitions, maintaining the exact relationship between them as shown in the document. Format your response as a JSON array of objects with 'term' and 'definition' properties."
        : "You are an expert at identifying important terms from educational documents. Extract all relevant terms that would benefit from having flashcards created for them. Format your response as a JSON array of strings containing just the terms.";

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
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
                  ? "Extract all terms and their definitions from this document. Ensure you maintain the exact relationships between terms and definitions as shown."
                  : "Extract all important terms from this document that would benefit from having flashcards created for them.",
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

    let extractedData;
    try {
      extractedData = JSON.parse(content);
    } catch (error) {
      console.error(
        "Failed to parse OpenAI response:",
        content,
        "error:",
        error
      );
      throw new Error("Failed to parse extracted content");
    }

    return NextResponse.json({ data: extractedData });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
