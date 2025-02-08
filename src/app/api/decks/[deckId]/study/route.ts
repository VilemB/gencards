import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

interface StudyAnalytics {
  totalCards: number;
  correctCards: number;
  incorrectCards: number;
  studyTime: number;
  averageTimePerCard: number;
  accuracy: number;
  completedAt: Date;
}

// POST /api/decks/[deckId]/study
export async function POST(
  req: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { deckId } = await context.params;

    // Validate if deckId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(deckId)) {
      return NextResponse.json({ message: "Invalid deck ID" }, { status: 400 });
    }

    const analytics: StudyAnalytics = await req.json();

    // Store analytics in MongoDB
    const result = await mongoose.connection
      .collection("studyAnalytics")
      .insertOne({
        userId: new mongoose.Types.ObjectId(session.user.id),
        deckId: new mongoose.Types.ObjectId(deckId),
        ...analytics,
        createdAt: new Date(),
      });

    return NextResponse.json({
      message: "Study analytics saved successfully",
      analyticsId: result.insertedId,
    });
  } catch (error) {
    console.error("[STUDY_ANALYTICS_POST]", error);
    return NextResponse.json(
      { message: "Error saving study analytics" },
      { status: 500 }
    );
  }
}
