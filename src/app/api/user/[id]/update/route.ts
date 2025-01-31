import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export interface UpdateParams {
  id: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: UpdateParams }
) {
  try {
    const id = await Promise.resolve(params.id);
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only allow users to update their own profile
    if (session.user.id !== id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await mongoose.connection
      .collection("users")
      .updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { name } });

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
