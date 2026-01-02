import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/programs/[id] - Get a specific program
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const program = await prisma.workoutProgram.findFirst({
      where: {
        id: params.id,
        OR: [
          { isSystemProgram: true },
          { createdBy: session.user.id },
        ],
      },
      include: {
        programWorkouts: {
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({ program });
  } catch (error) {
    console.error("Error fetching program:", error);
    return NextResponse.json(
      { error: "Failed to fetch program" },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/[id] - Delete a custom program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the program belongs to the user and is not a system program
    const existingProgram = await prisma.workoutProgram.findFirst({
      where: {
        id: params.id,
        createdBy: session.user.id,
        isSystemProgram: false,
      },
    });

    if (!existingProgram) {
      return NextResponse.json(
        { error: "Program not found or cannot be deleted" },
        { status: 404 }
      );
    }

    await prisma.workoutProgram.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting program:", error);
    return NextResponse.json(
      { error: "Failed to delete program" },
      { status: 500 }
    );
  }
}
