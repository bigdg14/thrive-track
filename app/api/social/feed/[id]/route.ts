import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(request: Request, context: { params: any }) {
  const { params } = context;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    const activity = await prisma.activityFeed.findUnique({ where: { id } });
    if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (activity.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.activityFeed.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
