import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating a workout program
const createProgramSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  description: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  durationWeeks: z.number().int().positive(),
  workouts: z.array(z.object({
    dayNumber: z.number().int().min(1).max(7),
    workoutName: z.string().min(1),
    exercises: z.array(z.object({
      exerciseId: z.string(),
      sets: z.number().int().positive(),
      reps: z.number().int().positive(),
      weight: z.number().optional(),
      notes: z.string().optional(),
    })),
  })),
});

// GET /api/programs - Get all programs (system + user's custom programs)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    const onlyMine = searchParams.get("onlyMine") === "true";

    const programs = await prisma.workoutProgram.findMany({
      where: {
        OR: [
          { isSystemProgram: true },
          ...(onlyMine ? [{ createdBy: session.user.id }] : [{ createdBy: session.user.id }]),
        ],
        ...(difficulty && { difficulty }),
      },
      include: {
        programWorkouts: {
          orderBy: { dayNumber: "asc" },
        },
      },
      orderBy: [
        { isSystemProgram: "desc" }, // System programs first
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}

// POST /api/programs - Create a custom workout program
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createProgramSchema.parse(body);

    // Create program with workouts in a transaction
    const program = await prisma.workoutProgram.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        difficulty: validatedData.difficulty,
        durationWeeks: validatedData.durationWeeks,
        isSystemProgram: false,
        createdBy: session.user.id,
        programWorkouts: {
          create: validatedData.workouts.map(workout => ({
            dayNumber: workout.dayNumber,
            workoutName: workout.workoutName,
            exercises: workout.exercises,
          })),
        },
      },
      include: {
        programWorkouts: true,
      },
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating program:", error);
    return NextResponse.json(
      { error: "Failed to create program" },
      { status: 500 }
    );
  }
}
