import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/auth";

export interface RouteParams {
  params: {
    id: string | Promise<string>;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const id = await params.id;
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
