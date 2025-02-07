import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { studyDate } = await req.json();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const today = new Date(studyDate);
    today.setHours(0, 0, 0, 0);

    const lastStudyDate = user.lastStudyDate
      ? new Date(user.lastStudyDate)
      : null;
    if (lastStudyDate) {
      lastStudyDate.setHours(0, 0, 0, 0);
    }

    // Calculate if streak should be incremented, maintained, or reset
    let newStreak = user.streak || 0;

    if (!lastStudyDate) {
      // First time studying
      newStreak = 1;
    } else {
      const diffDays = Math.floor(
        (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        // Already studied today, maintain streak
        newStreak = user.streak || 1;
      } else if (diffDays === 1) {
        // Studied consecutive days, increment streak
        newStreak = (user.streak || 0) + 1;
      } else {
        // Missed a day, reset streak
        newStreak = 1;
      }
    }

    // Update user's streak and last study date
    await User.findByIdAndUpdate(session.user.id, {
      streak: newStreak,
      lastStudyDate: today,
    });

    return NextResponse.json({ streak: newStreak });
  } catch (error) {
    console.error("[STREAK_POST]", error);
    return NextResponse.json(
      { message: "Error updating streak" },
      { status: 500 }
    );
  }
}
