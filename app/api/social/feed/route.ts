import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/social/feed - Get activity feed
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feedType = searchParams.get("type") || "friends"; // friends, personal, global
    const limit = parseInt(searchParams.get("limit") || "50");

    let whereClause: any = {};

    if (feedType === "personal") {
      // Only user's own activities
      whereClause.userId = session.user.id;
    } else if (feedType === "friends") {
      // Get user's friends
      const friendships = await prisma.friendship.findMany({
        where: {
          userId: session.user.id,
          status: "accepted",
        },
        select: {
          friendId: true,
        },
      });

      const friendIds = friendships.map((f) => f.friendId);
      friendIds.push(session.user.id); // Include own activities

      whereClause.userId = { in: friendIds };
    }
    // If global, no filter (show all)

    const activities = await prisma.activityFeed.findMany({
      where: whereClause,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    return NextResponse.json({ error: "Failed to fetch activity feed" }, { status: 500 });
  }
}

// POST /api/social/feed - Create activity feed entry
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activityType, description, metadata, visibility } = await request.json();

    if (!activityType || !description) {
      return NextResponse.json(
        { error: "Activity type and description are required" },
        { status: 400 }
      );
    }

    const activity = await prisma.activityFeed.create({
      data: {
        userId: session.user.id,
        activityType,
        content: { description, ...(metadata || {}) },
        visibility: visibility || "friends",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
