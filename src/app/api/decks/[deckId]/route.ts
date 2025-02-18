import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deck from "@/models/Deck";
import mongoose from "mongoose";

// GET /api/decks/[deckId]
export async function GET(
  req: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    await connectToDatabase();
    const { deckId } = await context.params;

    // Validate if deckId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(deckId)) {
      return new NextResponse("Invalid deck ID", { status: 400 });
    }

    const deck = await Deck.findById(deckId).populate({
      path: "parentDeckId",
      select: "title parentDeckId description topic",
      populate: {
        path: "parentDeckId",
        select: "title parentDeckId description topic",
        populate: {
          path: "parentDeckId",
          select: "title parentDeckId description topic",
        },
      },
    });

    if (!deck) {
      return new NextResponse("Deck not found", { status: 404 });
    }

    // Check if user has access to this deck
    if (!deck.isPublic && (!session || session.user.id !== deck.userId)) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error("[DECK_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE /api/decks/[deckId]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await connectToDatabase();
    const { deckId } = await context.params;

    // Validate if deckId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(deckId)) {
      return new NextResponse("Invalid deck ID", { status: 400 });
    }

    const deck = await Deck.findById(deckId);
    if (!deck) {
      return new NextResponse("Deck not found", { status: 404 });
    }

    // Check if user owns this deck
    if (session.user.id !== deck.userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Find and delete all child decks
    await Deck.deleteMany({
      parentDeckId: deckId,
      userId: session.user.id,
    });

    // Delete the deck itself
    await deck.deleteOne();

    // If this deck has a parent, check if the parent has other children
    if (deck.parentDeckId) {
      const siblingCount = await Deck.countDocuments({
        parentDeckId: deck.parentDeckId,
      });

      // If this was the last child, update parent's hasChildren flag
      if (siblingCount === 0) {
        await Deck.findByIdAndUpdate(deck.parentDeckId, {
          hasChildren: false,
        });
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DECK_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/decks/[deckId]
export async function PATCH(
  req: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();
    const { deckId } = await context.params;

    // Validate if deckId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(deckId)) {
      return new NextResponse("Invalid deck ID", { status: 400 });
    }

    const deck = await Deck.findById(deckId);
    if (!deck) {
      return new NextResponse("Deck not found", { status: 404 });
    }

    // Check if user owns this deck
    if (session.user.id !== deck.userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Update deck
    const updatedDeck = await Deck.findByIdAndUpdate(
      deckId,
      { ...body },
      { new: true }
    );

    return NextResponse.json(updatedDeck);
  } catch (error) {
    console.error("[DECK_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
