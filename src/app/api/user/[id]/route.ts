import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/auth";

export interface RouteParams {
  id: string | string[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const userId = await Promise.resolve(params.id);

    // Handle array case (should not happen, but TypeScript requires it)
    const id = Array.isArray(userId) ? userId[0] : userId;

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only allow users to access their own profile unless they're admin
    if (session.user.id !== id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
