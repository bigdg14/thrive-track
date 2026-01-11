import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateLevel } from "@/lib/badges";

// GET /api/gamification/leaderboard - Get leaderboard data
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "xp"; // xp, workouts, streak, prs
    const limit = parseInt(searchParams.get("limit") || "50");

    let orderBy: any = {};

    switch (type) {
      case "xp":
        orderBy = { totalXP: "desc" };
        break;
      case "workouts":
        orderBy = { workoutCount: "desc" };
        break;
      case "streak":
        orderBy = { streakDays: "desc" };
        break;
      case "prs":
        orderBy = { prCount: "desc" };
        break;
      default:
        orderBy = { totalXP: "desc" };
    }

    // Get top users
    const topUsers = await prisma.userLevel.findMany({
      take: limit,
      orderBy,
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

    // Get current user's rank
    const userLevel = await prisma.userLevel.findUnique({
      where: { userId: session.user.id },
    });

    let userRank = 0;
    if (userLevel) {
      const getValue = (ul: any) => {
        switch (type) {
          case "xp": return ul.totalXP;
          case "workouts": return ul.workoutCount;
          case "streak": return ul.streakDays;
          case "prs": return ul.prCount;
          default: return ul.totalXP;
        }
      };

      const userValue = getValue(userLevel);
      userRank = await prisma.userLevel.count({
        where: {
          [type === "xp" ? "totalXP" : type === "workouts" ? "workoutCount" : type === "streak" ? "streakDays" : "prCount"]: {
            gt: userValue,
          },
        },
      }) + 1;
    }

    // Format leaderboard data
    const leaderboard = topUsers.map((ul, index) => ({
      rank: index + 1,
      userId: ul.user.id,
      name: ul.user.name,
      image: ul.user.image,
      level: calculateLevel(ul.totalXP),
      totalXP: ul.totalXP,
      workoutCount: ul.workoutCount,
      streakDays: ul.streakDays,
      prCount: ul.prCount,
      longestStreak: ul.longestStreak,
      isCurrentUser: ul.user.id === session.user.id,
    }));

    return NextResponse.json({
      leaderboard,
      userRank,
      type,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
