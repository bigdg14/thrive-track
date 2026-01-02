import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating a goal
const createGoalSchema = z.object({
  goalType: z.enum(["weight", "strength", "consistency", "body_composition"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetValue: z.number().positive("Target value must be positive"),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  deadline: z.string().optional().transform(str => str ? new Date(str) : undefined),
  exerciseId: z.string().optional(), // For strength goals
});

// GET /api/goals - Get all goals for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";
    const goalType = searchParams.get("goalType");

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        ...(status !== "all" && { status }),
        ...(goalType && { goalType }),
      },
      orderBy: [
        { status: "asc" }, // active goals first
        { deadline: "asc" }, // then by deadline
        { createdAt: "desc" }, // then by most recent
      ],
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createGoalSchema.parse(body);

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        goalType: validatedData.goalType,
        title: validatedData.title,
        description: validatedData.description,
        targetValue: validatedData.targetValue,
        currentValue: validatedData.currentValue,
        unit: validatedData.unit,
        deadline: validatedData.deadline,
        exerciseId: validatedData.exerciseId,
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
