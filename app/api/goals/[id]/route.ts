import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for updating a goal
const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  deadline: z.string().optional().transform(str => str ? new Date(str) : undefined),
  status: z.enum(["active", "achieved", "abandoned"]).optional(),
});

// GET /api/goals/[id] - Get a specific goal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

// PATCH /api/goals/[id] - Update a goal
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the goal belongs to the user
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateGoalSchema.parse(body);

    // If marking as achieved, set achievedAt timestamp
    const updateData: any = { ...validatedData };
    if (validatedData.status === "achieved" && !existingGoal.achievedAt) {
      updateData.achievedAt = new Date();
    }

    const goal = await prisma.goal.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ goal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the goal belongs to the user
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    await prisma.goal.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
