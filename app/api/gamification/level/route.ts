import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateLevel, xpForNextLevel, XP_REWARDS } from "@/lib/badges";

// GET /api/gamification/level - Get user's level and XP
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user level
    let userLevel = await prisma.userLevel.findUnique({
      where: { userId: session.user.id },
    });

    if (!userLevel) {
      userLevel = await prisma.userLevel.create({
        data: {
          userId: session.user.id,
        },
      });
    }

    const currentLevel = calculateLevel(userLevel.totalXP);
    const xpNeeded = xpForNextLevel(currentLevel);
    const xpProgress = userLevel.totalXP - (currentLevel > 1 ? xpForNextLevel(currentLevel - 1) : 0);
    const xpRequired = xpNeeded - (currentLevel > 1 ? xpForNextLevel(currentLevel - 1) : 0);

    return NextResponse.json({
      level: currentLevel,
      currentXP: userLevel.currentXP,
      totalXP: userLevel.totalXP,
      xpForNextLevel: xpNeeded,
      xpProgress,
      xpRequired,
      workoutCount: userLevel.workoutCount,
      prCount: userLevel.prCount,
      streakDays: userLevel.streakDays,
      longestStreak: userLevel.longestStreak,
      lastWorkoutDate: userLevel.lastWorkoutDate,
    });
  } catch (error) {
    console.error("Error fetching level:", error);
    return NextResponse.json({ error: "Failed to fetch level" }, { status: 500 });
  }
}

// PATCH /api/gamification/level - Add XP and update stats
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, metadata } = await request.json();

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // Determine XP reward based on action
    let xpReward = 0;
    let updateData: any = {};

    switch (action) {
      case "WORKOUT_COMPLETE":
        xpReward = XP_REWARDS.WORKOUT_COMPLETE;
        updateData.workoutCount = { increment: 1 };
        updateData.lastWorkoutDate = new Date();

        // Check and update streak
        const userLevel = await prisma.userLevel.findUnique({
          where: { userId: session.user.id },
        });

        if (userLevel?.lastWorkoutDate) {
          const lastWorkout = new Date(userLevel.lastWorkoutDate);
          const today = new Date();
          const daysDiff = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            // Continue streak
            updateData.streakDays = { increment: 1 };
            const newStreak = (userLevel.streakDays || 0) + 1;
            if (newStreak > (userLevel.longestStreak || 0)) {
              updateData.longestStreak = newStreak;
            }
          } else if (daysDiff > 1) {
            // Reset streak
            updateData.streakDays = 1;
          }
          // Same day workout doesn't affect streak
        } else {
          // First workout
          updateData.streakDays = 1;
          updateData.longestStreak = 1;
        }
        break;

      case "PR_SET":
        xpReward = XP_REWARDS.PR_SET;
        updateData.prCount = { increment: 1 };
        break;

      case "GOAL_COMPLETED":
        xpReward = XP_REWARDS.GOAL_COMPLETED;
        break;

      case "STREAK_MILESTONE":
        xpReward = XP_REWARDS.STREAK_MILESTONE;
        break;

      case "FRIEND_ADDED":
        xpReward = XP_REWARDS.FRIEND_ADDED;
        break;

      case "CHALLENGE_COMPLETED":
        xpReward = XP_REWARDS.CHALLENGE_COMPLETED;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update user level with XP and stats
    const updatedLevel = await prisma.userLevel.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        currentXP: xpReward,
        totalXP: xpReward,
        ...updateData,
      },
      update: {
        currentXP: { increment: xpReward },
        totalXP: { increment: xpReward },
        ...updateData,
      },
    });

    const oldLevel = calculateLevel(updatedLevel.totalXP - xpReward);
    const newLevel = calculateLevel(updatedLevel.totalXP);
    const leveledUp = newLevel > oldLevel;

    // Create activity feed entry
    await prisma.activityFeed.create({
      data: {
        userId: session.user.id,
        activityType: action.toLowerCase(),
        content: { description: `${action.replace(/_/g, " ")}${metadata?.description ? `: ${metadata.description}` : ""}`, ...(metadata || {}) },
      },
    });

    return NextResponse.json({
      xpEarned: xpReward,
      totalXP: updatedLevel.totalXP,
      currentLevel: newLevel,
      leveledUp,
      previousLevel: oldLevel,
      xpForNextLevel: xpForNextLevel(newLevel),
      streakDays: updatedLevel.streakDays,
      workoutCount: updatedLevel.workoutCount,
      prCount: updatedLevel.prCount,
    });
  } catch (error) {
    console.error("Error updating level:", error);
    return NextResponse.json({ error: "Failed to update level" }, { status: 500 });
  }
}
