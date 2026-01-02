import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for starting a program
const startProgramSchema = z.object({
  programId: z.string().min(1),
});

// Validation schema for updating progress
const updateProgressSchema = z.object({
  currentWeek: z.number().int().positive().optional(),
  currentDay: z.number().int().min(1).max(7).optional(),
  status: z.enum(["active", "completed", "paused"]).optional(),
});

// GET /api/programs/user - Get user's active programs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";

    const userPrograms = await prisma.userProgram.findMany({
      where: {
        userId: session.user.id,
        ...(status !== "all" && { status }),
      },
      include: {
        program: {
          include: {
            programWorkouts: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ userPrograms });
  } catch (error) {
    console.error("Error fetching user programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch user programs" },
      { status: 500 }
    );
  }
}

// POST /api/programs/user - Start a new program
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = startProgramSchema.parse(body);

    // Verify the program exists
    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: validatedData.programId,
        OR: [
          { isSystemProgram: true },
          { createdBy: session.user.id },
        ],
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    // Check if user already has an active instance of this program
    const existingUserProgram = await prisma.userProgram.findFirst({
      where: {
        userId: session.user.id,
        programId: validatedData.programId,
        status: "active",
      },
    });

    if (existingUserProgram) {
      return NextResponse.json(
        { error: "You already have an active instance of this program" },
        { status: 400 }
      );
    }

    const userProgram = await prisma.userProgram.create({
      data: {
        userId: session.user.id,
        programId: validatedData.programId,
        startedAt: new Date(),
      },
      include: {
        program: {
          include: {
            programWorkouts: true,
          },
        },
      },
    });

    return NextResponse.json({ userProgram }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error starting program:", error);
    return NextResponse.json(
      { error: "Failed to start program" },
      { status: 500 }
    );
  }
}
