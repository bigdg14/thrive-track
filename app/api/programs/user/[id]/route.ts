import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for updating progress
const updateProgressSchema = z.object({
  currentWeek: z.number().int().positive().optional(),
  currentDay: z.number().int().min(1).max(7).optional(),
  status: z.enum(["active", "completed", "paused"]).optional(),
});

// PATCH /api/programs/user/[id] - Update program progress
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user program belongs to the user
    const existingUserProgram = await prisma.userProgram.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingUserProgram) {
      return NextResponse.json({ error: "User program not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateProgressSchema.parse(body);

    // If marking as completed, set completedAt timestamp
    const updateData: any = { ...validatedData };
    if (validatedData.status === "completed" && !existingUserProgram.completedAt) {
      updateData.completedAt = new Date();
    }

    const userProgram = await prisma.userProgram.update({
      where: { id: params.id },
      data: updateData,
      include: {
        program: {
          include: {
            programWorkouts: true,
          },
        },
      },
    });

    return NextResponse.json({ userProgram });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating user program:", error);
    return NextResponse.json(
      { error: "Failed to update user program" },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/user/[id] - Remove a user program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user program belongs to the user
    const existingUserProgram = await prisma.userProgram.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingUserProgram) {
      return NextResponse.json({ error: "User program not found" }, { status: 404 });
    }

    await prisma.userProgram.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user program:", error);
    return NextResponse.json(
      { error: "Failed to delete user program" },
      { status: 500 }
    );
  }
}
