import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Deck from "@/models/Deck";
import dbConnect from "@/lib/dbConnect";

interface Card {
  front: string;
  back: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const deck = await Deck.findById(params.deckId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Verify ownership
    if (deck.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cards } = await request.json();

    // Validate cards array
    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: "Invalid cards data" },
        { status: 400 }
      );
    }

    // Validate each card has front and back
    const isValid = cards.every(
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
    deck.cards.push(...cards);
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
