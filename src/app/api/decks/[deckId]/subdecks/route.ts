import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Deck from "@/models/Deck";

export async function GET(
  request: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { deckId } = await context.params;

    // Find all decks that have this deck as their parent
    const subdecks = await Deck.find({ parentDeckId: deckId })
      .select("title description topic cardCount userId createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({ subdecks });
  } catch (error) {
    console.error("[SUBDECKS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch subdecks" },
      { status: 500 }
    );
  }
}
