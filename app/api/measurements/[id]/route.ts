import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for updating a measurement
const updateMeasurementSchema = z.object({
  date: z.string().transform(str => new Date(str)).optional(),
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

// GET /api/measurements/[id] - Get a specific measurement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const measurement = await prisma.bodyMeasurement.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!measurement) {
      return NextResponse.json({ error: "Measurement not found" }, { status: 404 });
    }

    return NextResponse.json({ measurement });
  } catch (error) {
    console.error("Error fetching measurement:", error);
    return NextResponse.json(
      { error: "Failed to fetch measurement" },
      { status: 500 }
    );
  }
}

// PATCH /api/measurements/[id] - Update a measurement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the measurement belongs to the user
    const existingMeasurement = await prisma.bodyMeasurement.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingMeasurement) {
      return NextResponse.json({ error: "Measurement not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateMeasurementSchema.parse(body);

    const measurement = await prisma.bodyMeasurement.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({ measurement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating measurement:", error);
    return NextResponse.json(
      { error: "Failed to update measurement" },
      { status: 500 }
    );
  }
}

// DELETE /api/measurements/[id] - Delete a measurement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the measurement belongs to the user
    const existingMeasurement = await prisma.bodyMeasurement.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingMeasurement) {
      return NextResponse.json({ error: "Measurement not found" }, { status: 404 });
    }

    await prisma.bodyMeasurement.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting measurement:", error);
    return NextResponse.json(
      { error: "Failed to delete measurement" },
      { status: 500 }
    );
  }
}
