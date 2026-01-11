import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/challenges - Get challenges
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "active"; // active, completed, my-challenges

    let whereClause: any = {};

    if (filter === "active") {
      whereClause = {
        endDate: { gte: new Date() },
        status: "active",
      };
    } else if (filter === "completed") {
      whereClause = {
        status: "completed",
      };
    } else if (filter === "my-challenges") {
      whereClause = {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      };
    }

    const challenges = await prisma.challenge.findMany({
      where: whereClause,
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
              },
            },
          },
          orderBy: {
            progress: "desc",
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Check if user is participating in each challenge
    const challengesWithParticipation = challenges.map((challenge) => ({
      ...challenge,
      isParticipating: challenge.participants.some((p) => p.userId === session.user.id),
      userProgress: challenge.participants.find((p) => p.userId === session.user.id)?.progress || 0,
    }));

    return NextResponse.json({ challenges: challengesWithParticipation });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}

// POST /api/challenges - Create a new challenge
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      description,
      challengeType,
      goal,
      startDate,
      endDate,
      visibility,
      rules,
    } = await request.json();

    if (!name || !challengeType || !goal || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.create({
      data: {
        name,
        description: description || "",
        challengeType,
        goal,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        visibility: visibility || "public",
        rules: rules || {},
        creatorId: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Automatically join creator as participant
    await prisma.challengeParticipant.create({
      data: {
        challengeId: challenge.id,
        userId: session.user.id,
      },
    });

    // Create activity feed entry
    await prisma.activityFeed.create({
      data: {
        userId: session.user.id,
        activityType: "challenge_created",
        content: { description: `Created challenge: ${name}`, challengeId: challenge.id },
      },
    });

    return NextResponse.json({ challenge });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}
