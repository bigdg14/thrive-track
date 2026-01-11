import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/challenges/[id]/join - Join a challenge
export async function POST(request: Request, context: { params: any }) {
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

    // Check if challenge is active and not ended
    if (challenge.status !== "active") {
      return NextResponse.json({ error: "Challenge is not active" }, { status: 400 });
    }

    if (new Date() > challenge.endDate) {
      return NextResponse.json({ error: "Challenge has ended" }, { status: 400 });
    }

    // Check if already participating
    const existingParticipant = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ error: "Already participating" }, { status: 400 });
    }

    // Join challenge
    const participant = await prisma.challengeParticipant.create({
      data: {
        challengeId: params.id,
        userId: session.user.id,
      },
    });

    // Create activity feed entry
    await prisma.activityFeed.create({
      data: {
        userId: session.user.id,
        activityType: "challenge_joined",
        content: { description: `Joined challenge: ${challenge.name}`, challengeId: challenge.id },
      },
    });

    return NextResponse.json({ participant, message: "Successfully joined challenge" });
  } catch (error) {
    console.error("Error joining challenge:", error);
    return NextResponse.json({ error: "Failed to join challenge" }, { status: 500 });
  }
}

// DELETE /api/challenges/[id]/join - Leave a challenge
export async function DELETE(request: Request, context: { params: any }) {
  const { params } = context
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const participant = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Not participating in this challenge" }, { status: 404 });
    }

    await prisma.challengeParticipant.delete({
      where: {
        challengeId_userId: {
          challengeId: params.id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ message: "Left challenge" });
  } catch (error) {
    console.error("Error leaving challenge:", error);
    return NextResponse.json({ error: "Failed to leave challenge" }, { status: 500 });
  }
}
