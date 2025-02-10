import { NextResponse } from "next/server";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!openai.apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const { topic, count = 5 } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Please provide a topic" },
        { status: 400 }
      );
    }

    const prompt = `Generate ${count} flashcards for studying ${topic}. Each flashcard should have a front (question/term) and back (answer/definition). Format the output as a JSON array of objects with 'front' and 'back' properties. The content should be in HTML format with <p> tags. Make the cards engaging and educational.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",

          content:
            "You are a helpful AI that generates educational flashcards. Your responses should be in valid JSON format.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message?.content || "";
    const cards = JSON.parse(responseText);

    return NextResponse.json({ cards });
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
