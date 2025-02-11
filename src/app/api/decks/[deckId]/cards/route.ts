import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Deck from "@/models/Deck";
import dbConnect from "@/lib/mongodb";

interface Card {
  front: string;
  back: string;
}

type RouteParams = {
  params: {
    deckId: string;
  };
};

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const [session, body] = await Promise.all([
      getServerSession(authOptions),
      request.json(),
      dbConnect(),
    ]);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deck = await Deck.findById(context.params.deckId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Verify ownership
    if (deck.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate cards array
    if (!Array.isArray(body.cards) || body.cards.length === 0) {
      return NextResponse.json(
        { error: "Invalid cards data" },
        { status: 400 }
      );
    }

    // Validate each card has front and back
    const isValid = body.cards.every(
      (card: Card) =>
        typeof card.front === "string" &&
        typeof card.back === "string" &&
        card.front.trim() &&
        card.back.trim()
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "All cards must have front and back content" },
        { status: 400 }
      );
    }

    // Add cards to deck
    deck.cards.push(...body.cards);
    deck.cardCount = deck.cards.length;
    await deck.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
