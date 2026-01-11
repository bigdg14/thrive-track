import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Unified friends API
// POST: send request (body: { email?: string, friendId?: string })
// GET: ?type=incoming|outgoing|friends  OR ?status=accepted
// PATCH: /:id with { action: 'accept'|'decline'|'block' }

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { email, friendId } = body;

    let target = null;
    if (friendId) {
      target = await prisma.user.findUnique({ where: { id: friendId } });
    } else if (email) {
      target = await prisma.user.findUnique({ where: { email } });
    } else {
      return NextResponse.json({ error: "friendId or email is required" }, { status: 400 });
    }

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.id === session.user.id) return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: session.user.id, friendId: target.id },
          { userId: target.id, friendId: session.user.id },
        ],
      },
    });

    if (existing) return NextResponse.json({ error: "Friend request or relation already exists" }, { status: 409 });

    const friendship = await prisma.friendship.create({
      data: { userId: session.user.id, friendId: target.id, status: "pending" },
      include: { friend: { select: { id: true, name: true, email: true, image: true } } },
    });

    await prisma.activityFeed.create({
      data: {
        userId: session.user.id,
        activityType: "friend_request_sent",
        content: { description: `Sent friend request to ${friendship.friend.name}`, friendId: target.id },
      },
    });

    return NextResponse.json({ friendship });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    if (type === "incoming") {
      const incoming = await prisma.friendship.findMany({
        where: { friendId: session.user.id, status: "pending" },
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ incoming });
    }

    if (type === "outgoing") {
      const outgoing = await prisma.friendship.findMany({
        where: { userId: session.user.id, status: "pending" },
        include: { friend: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ outgoing });
    }

    if (status) {
      const friendships = await prisma.friendship.findMany({
        where: { userId: session.user.id, status },
        include: { friend: { select: { id: true, name: true, email: true, image: true, userLevel: true } } },
        orderBy: { createdAt: "desc" },
      });

      const pendingRequests = await prisma.friendship.findMany({
        where: { friendId: session.user.id, status: "pending" },
        include: { user: { select: { id: true, name: true, email: true, image: true, userLevel: true } } },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ friends: friendships, pendingRequests });
    }

    const accepted = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: session.user.id, status: "accepted" },
          { friendId: session.user.id, status: "accepted" },
        ],
      },
      include: { user: { select: { id: true, name: true, image: true } }, friend: { select: { id: true, name: true, image: true } } },
      orderBy: { updatedAt: "desc" },
    });

    const friends = accepted.map((f) => (f.userId === session.user.id ? { id: f.friend.id, name: f.friend.name, image: f.friend.image, friendshipId: f.id } : { id: f.user.id, name: f.user.name, image: f.user.image, friendshipId: f.id }));

    return NextResponse.json({ friends });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to list friends" }, { status: 500 });
  }
}


