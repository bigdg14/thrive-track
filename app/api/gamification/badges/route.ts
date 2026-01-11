import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BADGES, checkBadgeEligibility } from "@/lib/badges";

// GET /api/gamification/badges - Get user's badges
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's earned badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: session.user.id },
      orderBy: { earnedAt: "desc" },
    });

    // Get user stats for checking eligibility
    const userLevel = await prisma.userLevel.findUnique({
      where: { userId: session.user.id },
    });

    const goalCount = await prisma.goal.count({
      where: {
        userId: session.user.id,
        status: "completed",
      },
    });

    const friendCount = await prisma.friendship.count({
      where: {
        userId: session.user.id,
        status: "accepted",
      },
    });

    const stats = {
      workoutCount: userLevel?.workoutCount || 0,
      streakDays: userLevel?.streakDays || 0,
      prCount: userLevel?.prCount || 0,
      goalCount,
      friendCount,
    };

    // Check which badges are available but not yet earned
    const earnedBadgeIds = new Set(userBadges.map((b) => b.badgeId));
    const availableBadges = BADGES.filter(
      (badge) => !earnedBadgeIds.has(badge.id) && checkBadgeEligibility(badge, stats)
    );

    // Get all badges with earned status
    const allBadges = BADGES.map((badge) => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id),
      earnedAt: userBadges.find((b) => b.badgeId === badge.id)?.earnedAt,
    }));

    return NextResponse.json({
      earnedBadges: userBadges,
      availableBadges,
      allBadges,
      stats,
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}

// POST /api/gamification/badges - Award a badge to user
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { badgeId } = await request.json();

    if (!badgeId) {
      return NextResponse.json({ error: "Badge ID is required" }, { status: 400 });
    }

    // Find badge definition
    const badge = BADGES.find((b) => b.id === badgeId);
    if (!badge) {
      return NextResponse.json({ error: "Invalid badge ID" }, { status: 400 });
    }

    // Check if already earned
    const existingBadge = await prisma.userBadge.findFirst({
      where: {
        userId: session.user.id,
        badgeId,
      },
    });

    if (existingBadge) {
      return NextResponse.json({ error: "Badge already earned" }, { status: 400 });
    }

    // Verify eligibility
    const userLevel = await prisma.userLevel.findUnique({
      where: { userId: session.user.id },
    });

    const goalCount = await prisma.goal.count({
      where: {
        userId: session.user.id,
        status: "completed",
      },
    });

    const friendCount = await prisma.friendship.count({
      where: {
        userId: session.user.id,
        status: "accepted",
      },
    });

    const stats = {
      workoutCount: userLevel?.workoutCount || 0,
      streakDays: userLevel?.streakDays || 0,
      prCount: userLevel?.prCount || 0,
      goalCount,
      friendCount,
    };

    if (!checkBadgeEligibility(badge, stats)) {
      return NextResponse.json({ error: "Not eligible for this badge" }, { status: 400 });
    }

    // Award badge and XP
    const [userBadge, updatedLevel] = await prisma.$transaction([
      prisma.userBadge.create({
        data: {
          userId: session.user.id,
          badgeId,
        },
      }),
      prisma.userLevel.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          currentXP: badge.xpReward,
          totalXP: badge.xpReward,
        },
        update: {
          currentXP: { increment: badge.xpReward },
          totalXP: { increment: badge.xpReward },
        },
      }),
    ]);

    return NextResponse.json({
      userBadge,
      xpEarned: badge.xpReward,
      newTotalXP: updatedLevel.totalXP,
    });
  } catch (error) {
    console.error("Error awarding badge:", error);
    return NextResponse.json({ error: "Failed to award badge" }, { status: 500 });
  }
}
