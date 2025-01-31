import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteUser } from "@/lib/auth";

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const [session, userId] = await Promise.all([
      getServerSession(authOptions),
      context.params.id,
    ]);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only allow users to delete their own account
    if (session.user.id !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await deleteUser(userId);

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
