import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for nutrition targets
const nutritionTargetsSchema = z.object({
  dailyCalories: z.number().int().positive(),
  proteinTarget: z.number().positive(),
  carbsTarget: z.number().positive(),
  fatTarget: z.number().positive(),
});

// GET /api/nutrition/targets - Get user's nutrition targets
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targets = await prisma.nutritionTarget.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ targets });
  } catch (error) {
    console.error("Error fetching nutrition targets:", error);
    return NextResponse.json(
      { error: "Failed to fetch nutrition targets" },
      { status: 500 }
    );
  }
}

// POST /api/nutrition/targets - Create or update nutrition targets
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = nutritionTargetsSchema.parse(body);

    const targets = await prisma.nutritionTarget.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        ...validatedData,
      },
      update: validatedData,
    });

    return NextResponse.json({ targets });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error setting nutrition targets:", error);
    return NextResponse.json(
      { error: "Failed to set nutrition targets" },
      { status: 500 }
    );
  }
}
