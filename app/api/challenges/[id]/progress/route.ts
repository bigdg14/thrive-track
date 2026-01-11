import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/challenges/[id]/progress - Update challenge progress
export async function PATCH(request: Request, context: { params: any }) {
  const { params } = context
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { progress } = await request.json();

    if (typeof progress !== "number" || progress < 0) {
      return NextResponse.json({ error: "Invalid progress value" }, { status: 400 });
    }

    const participant = await prisma.challengeParticipant.findUnique({
      where: {
        challengeId_userId: {
          challengeId: params.id,
          userId: session.user.id,
        },
      },
      include: {
        challenge: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Not participating in this challenge" }, { status: 404 });
    }

    const previousProgress = participant.progress;
    const goalReached = progress >= participant.challenge.goal && previousProgress < participant.challenge.goal;

    // Update progress
    const updatedParticipant = await prisma.challengeParticipant.update({
      where: {
        challengeId_userId: {
          challengeId: params.id,
          userId: session.user.id,
        },
      },
      data: {
        progress,
        ...(goalReached && { completedAt: new Date() }),
      },
    });

    // If goal reached, create activity and award XP
    if (goalReached) {
      await prisma.activityFeed.create({
        data: {
          userId: session.user.id,
          activityType: "challenge_completed",
          content: { description: `Completed challenge: ${participant.challenge.name}`, challengeId: participant.challenge.id },
        },
      });

      // Award XP via gamification endpoint
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gamification/level`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHALLENGE_COMPLETED",
          metadata: { challengeId: participant.challenge.id },
        }),
      });
    }

    return NextResponse.json({
      participant: updatedParticipant,
      goalReached,
    });
  } catch (error) {
    console.error("Error updating challenge progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
