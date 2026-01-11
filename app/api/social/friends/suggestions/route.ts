import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ suggestions: [] });

    // gather user ids already connected or pending
    const relations = await prisma.friendship.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }],
      },
      select: { userId: true, friendId: true },
    });

    const excludeIds = new Set<string>([userId]);
    relations.forEach((r) => {
      excludeIds.add(r.userId);
      excludeIds.add(r.friendId);
    });

    const suggestions = await prisma.user.findMany({
      where: { id: { notIn: Array.from(excludeIds) } },
      select: { id: true, name: true, image: true, email: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
