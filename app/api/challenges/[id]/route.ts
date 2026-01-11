import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/challenges/[id] - Get challenge details
export async function GET(request: Request, context: { params: any }) {
  const { params } = context
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                userLevel: {
                  select: {
                    level: true,
                    totalXP: true,
                  },
                },
              },
            },
          },
          orderBy: {
            progress: "desc",
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const isParticipating = challenge.participants.some((p) => p.userId === session.user.id);
    const userProgress = challenge.participants.find((p) => p.userId === session.user.id)?.progress || 0;

    return NextResponse.json({
      challenge: {
        ...challenge,
        isParticipating,
        userProgress,
      },
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json({ error: "Failed to fetch challenge" }, { status: 500 });
  }
}

// PATCH /api/challenges/[id] - Update challenge
export async function PATCH(request: Request, context: { params: any }) {
  const { params } = context
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Only creator can update challenge
    if (challenge.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { status } = await request.json();

    const updatedChallenge = await prisma.challenge.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ challenge: updatedChallenge });
  } catch (error) {
    console.error("Error updating challenge:", error);
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
  }
}

// DELETE /api/challenges/[id] - Delete challenge
export async function DELETE(request: Request, context: { params: any }) {
  const { params } = context
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Only creator can delete challenge
    if (challenge.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.challenge.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Challenge deleted" });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json({ error: "Failed to delete challenge" }, { status: 500 });
  }
}
