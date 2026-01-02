import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for updating a nutrition log
const updateNutritionLogSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  foodName: z.string().min(1).optional(),
  servingSize: z.string().optional(),
  calories: z.number().int().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
});

// DELETE /api/nutrition/logs/[id] - Delete a nutrition log
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the log belongs to the user
    const existingLog = await prisma.nutritionLog.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingLog) {
      return NextResponse.json({ error: "Nutrition log not found" }, { status: 404 });
    }

    await prisma.nutritionLog.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting nutrition log:", error);
    return NextResponse.json(
      { error: "Failed to delete nutrition log" },
      { status: 500 }
    );
  }
}

// PATCH /api/nutrition/logs/[id] - Update a nutrition log
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the log belongs to the user
    const existingLog = await prisma.nutritionLog.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingLog) {
      return NextResponse.json({ error: "Nutrition log not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateNutritionLogSchema.parse(body);

    const log = await prisma.nutritionLog.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({ log });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating nutrition log:", error);
    return NextResponse.json(
      { error: "Failed to update nutrition log" },
      { status: 500 }
    );
  }
}
