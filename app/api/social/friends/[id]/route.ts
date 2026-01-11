import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/social/friends/[id] - Accept/reject friend request
export async function PATCH(request: Request, context: { params: any }) {
  const { params } = context
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (!action || !["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Find the friendship request
    const friendship = await prisma.friendship.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    // Verify the current user is the recipient
    if (friendship.friendId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "accept") {
      // Update friendship to accepted
      const updatedFriendship = await prisma.friendship.update({
        where: { id: params.id },
        data: { status: "accepted" },
      });

      // Create reciprocal friendship
      await prisma.friendship.create({
        data: {
          userId: session.user.id,
          friendId: friendship.userId,
          status: "accepted",
        },
      });

      // Create activity feed entry
      await prisma.activityFeed.create({
        data: {
          userId: session.user.id,
          activityType: "friend_accepted",
          content: { description: `Now friends with ${friendship.user.name}`, friendId: friendship.userId },
        },
      });

      return NextResponse.json({ friendship: updatedFriendship, message: "Friend request accepted" });
    } else {
      // Delete the friendship request
      await prisma.friendship.delete({
        where: { id: params.id },
      });

      return NextResponse.json({ message: "Friend request rejected" });
    }
  } catch (error) {
    console.error("Error updating friend request:", error);
    return NextResponse.json({ error: "Failed to update friend request" }, { status: 500 });
  }
}

// DELETE /api/social/friends/[id] - Remove friend
export async function DELETE(request: Request, context: { params: any }) {
  const { params } = context
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: params.id },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Friendship not found" }, { status: 404 });
    }

    // Verify the current user owns this friendship
    if (friendship.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete both directions of the friendship
    await prisma.$transaction([
      prisma.friendship.delete({
        where: { id: params.id },
      }),
      prisma.friendship.deleteMany({
        where: {
          userId: friendship.friendId,
          friendId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }
}
