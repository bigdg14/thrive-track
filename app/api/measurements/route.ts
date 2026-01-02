import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating a measurement
const createMeasurementSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  weight: z.number().positive().optional(),
  bodyFatPercent: z.number().min(0).max(100).optional(),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  biceps: z.number().positive().optional(),
  thighs: z.number().positive().optional(),
  calves: z.number().positive().optional(),
  shoulders: z.number().positive().optional(),
  neck: z.number().positive().optional(),
  notes: z.string().optional(),
});

// GET /api/measurements - Get all measurements for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "100");

    const measurements = await prisma.bodyMeasurement.findMany({
      where: {
        userId: session.user.id,
        ...(startDate && { date: { gte: new Date(startDate) } }),
        ...(endDate && { date: { lte: new Date(endDate) } }),
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json({ measurements });
  } catch (error) {
    console.error("Error fetching measurements:", error);
    return NextResponse.json(
      { error: "Failed to fetch measurements" },
      { status: 500 }
    );
  }
}

// POST /api/measurements - Create a new measurement
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMeasurementSchema.parse(body);

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId: session.user.id,
        ...validatedData,
      },
    });

    return NextResponse.json({ measurement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating measurement:", error);
    return NextResponse.json(
      { error: "Failed to create measurement" },
      { status: 500 }
    );
  }
}
