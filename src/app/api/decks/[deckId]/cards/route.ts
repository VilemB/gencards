import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deck from "@/models/Deck";
import { Types } from "mongoose";

interface DeckCard {
  _id: Types.ObjectId;
  front: string;
  back: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const [session, body, resolvedParams] = await Promise.all([
      getServerSession(authOptions),
      request.json(),
      params,
      connectToDatabase(),
    ]);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetDeck = await Deck.findById(resolvedParams.deckId);
    if (!targetDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Verify ownership of target deck
    if (targetDeck.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle card movement between decks
    if (body.cardId && body.sourceDeckId) {
      const sourceDeck = await Deck.findById(body.sourceDeckId);
      if (!sourceDeck) {
        return NextResponse.json(
          { error: "Source deck not found" },
          { status: 404 }
        );
      }

      // Verify ownership of source deck
      if (sourceDeck.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Find the card to move
      const cardToMove = sourceDeck.cards.find(
        (card: DeckCard) => card._id.toString() === body.cardId
      );

      if (!cardToMove) {
        return NextResponse.json(
          { error: "Card not found in source deck" },
          { status: 404 }
        );
      }

      // Remove card from source deck
      sourceDeck.cards = sourceDeck.cards.filter(
        (card: DeckCard) => card._id.toString() !== body.cardId
      );
      sourceDeck.cardCount = sourceDeck.cards.length;

      // Add card to target deck
      targetDeck.cards.push(cardToMove);
      targetDeck.cardCount = targetDeck.cards.length;

      // Save both decks
      await Promise.all([sourceDeck.save(), targetDeck.save()]);

      return NextResponse.json({ success: true });
    }

    // Handle regular card creation
    if (!Array.isArray(body.cards) || body.cards.length === 0) {
      return NextResponse.json(
        { error: "Invalid cards data" },
        { status: 400 }
      );
    }

    // Validate each card has front and back
    const isValid = body.cards.every(
      (card: DeckCard) =>
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
    targetDeck.cards.push(...body.cards);
    targetDeck.cardCount = targetDeck.cards.length;
    await targetDeck.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling cards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ deckId: string; cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { deckId, cardId } = await params;

    const deck = await Deck.findById(deckId);
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Verify ownership
    if (deck.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove card from deck
    deck.cards = deck.cards.filter(
      (card: DeckCard) => card._id.toString() !== cardId
    );
    deck.cardCount = deck.cards.length;
    await deck.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
