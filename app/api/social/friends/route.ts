import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/social/friends - Get user's friends
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "accepted"; // pending, accepted, blocked

    const friendships = await prisma.friendship.findMany({
      where: {
        userId: session.user.id,
        status,
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            userLevel: {
              select: {
                level: true,
                totalXP: true,
                streakDays: true,
                workoutCount: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Also get pending requests received
    const pendingRequests = await prisma.friendship.findMany({
      where: {
        friendId: session.user.id,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            userLevel: {
              select: {
                level: true,
                totalXP: true,
                streakDays: true,
                workoutCount: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      friends: friendships,
      pendingRequests,
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}

// POST /api/social/friends - Send friend request
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }

    if (friendId === session.user.id) {
      return NextResponse.json({ error: "Cannot add yourself as a friend" }, { status: 400 });
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId: session.user.id,
          friendId,
        },
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: "Friend request already exists" }, { status: 400 });
    }

    // Create friendship
    const friendship = await prisma.friendship.create({
      data: {
        userId: session.user.id,
        friendId,
        status: "pending",
      },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Create activity feed entry
    await prisma.activityFeed.create({
      data: {
        userId: session.user.id,
        activityType: "friend_request_sent",
        content: { description: `Sent friend request to ${friendship.friend.name}`, friendId },
      },
    });

    return NextResponse.json({ friendship });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}
