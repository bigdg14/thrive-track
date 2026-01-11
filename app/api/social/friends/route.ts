import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/social/friends - send a friend request (by email)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.id === session.user.id) {
      return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
    }

    // Prevent duplicate requests or existing friendships (either direction)
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: target.id },
          { userId: target.id, friendId: session.user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Friend request or relation already exists" }, { status: 409 });
    }

    const fr = await prisma.friendship.create({
      data: {
        userId: session.user.id,
        friendId: target.id,
        status: "pending",
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        friend: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ friendship: fr });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}

// GET /api/social/friends?type=incoming|outgoing|friends - list friend requests or friends
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "friends";

    if (type === "incoming") {
      const incoming = await prisma.friendship.findMany({
        where: { friendId: session.user.id, status: "pending" },
        include: { user: { select: { id: true, name: true, image: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ incoming });
    }

    if (type === "outgoing") {
      const outgoing = await prisma.friendship.findMany({
        where: { userId: session.user.id, status: "pending" },
        include: { friend: { select: { id: true, name: true, image: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ outgoing });
    }

    // friends: include accepted from either side
    const accepted = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: session.user.id, status: "accepted" },
          { friendId: session.user.id, status: "accepted" },
        ],
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        friend: { select: { id: true, name: true, image: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // normalize to a single friend object
    const friends = accepted.map((f) => {
      if (f.userId === session.user.id) return { id: f.friend.id, name: f.friend.name, image: f.friend.image, friendshipId: f.id };
      return { id: f.user.id, name: f.user.name, image: f.user.image, friendshipId: f.id };
    });

    return NextResponse.json({ friends });
  } catch (error) {
    console.error("Error listing friends:", error);
    return NextResponse.json({ error: "Failed to list friends" }, { status: 500 });
  }
}

// PATCH /api/social/friends/:id - respond to a friend request (accept/decline/block)
export async function PATCH(request: Request, { params }: { params: { id?: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const payload = await request.json();
    const action = payload.action || payload.status;
    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    const fr = await prisma.friendship.findUnique({ where: { id } });
    if (!fr) return NextResponse.json({ error: "Friend request not found" }, { status: 404 });

    // Only recipient can respond
    if (fr.friendId !== session.user.id) {
      return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    }

    if (action === "accept") {
      // update original to accepted
      await prisma.friendship.update({ where: { id }, data: { status: "accepted" } });

      // create reciprocal accepted relationship if not exists
      await prisma.friendship.upsert({
        where: { userId_friendId: { userId: session.user.id, friendId: fr.userId } } as any,
        update: { status: "accepted" },
        create: { userId: session.user.id, friendId: fr.userId, status: "accepted" },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "decline") {
      await prisma.friendship.update({ where: { id }, data: { status: "declined" } });
      return NextResponse.json({ success: true });
    }

    if (action === "block") {
      await prisma.friendship.update({ where: { id }, data: { status: "blocked" } });
      // optionally create reciprocal blocked record
      await prisma.friendship.upsert({
        where: { userId_friendId: { userId: session.user.id, friendId: fr.userId } } as any,
        update: { status: "blocked" },
        create: { userId: session.user.id, friendId: fr.userId, status: "blocked" },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error responding to friend request:", error);
    return NextResponse.json({ error: "Failed to respond to request" }, { status: 500 });
  }
}
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
