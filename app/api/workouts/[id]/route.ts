import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const workout = await prisma.workout.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            workoutSets: {
              orderBy: { setNumber: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("Error fetching workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const workout = await prisma.workout.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Delete workout (cascade will handle exercises and sets)
    await prisma.workout.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Verify ownership
    const existingWorkout = await prisma.workout.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 })
    }

    // Update workout
    const workout = await prisma.workout.update({
      where: { id: params.id },
      data: {
        notes: body.notes,
        difficultyRating: body.difficultyRating,
      },
      include: {
        workoutExercises: {
          include: {
            exercise: true,
            workoutSets: true,
          },
        },
      },
    })

    return NextResponse.json({ workout })
  } catch (error) {
    console.error("Error updating workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
