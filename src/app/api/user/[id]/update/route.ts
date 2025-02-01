import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export interface UpdateParams {
  id: string;
}

interface UserPreferences {
  showStreak: boolean;
  cardsPerDay: number;
  theme: "light" | "dark" | "system";
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only allow users to update their own profile
    if (session.user.id !== id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, preferences } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Update user with preferences
    const updateData: { name: string; preferences?: UserPreferences } = {
      name,
    };
    if (preferences) {
      updateData.preferences = preferences;
    }

    const result = await mongoose.connection
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
