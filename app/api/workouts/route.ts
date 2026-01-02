import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const workoutSetSchema = z.object({
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive().nullable(),
  weight: z.number().positive().nullable(),
  duration: z.number().int().positive().nullable(),
  distance: z.number().positive().nullable(),
  completedAt: z.coerce.date().nullable(),
})

const workoutExerciseSchema = z.object({
  exerciseId: z.string(),
  notes: z.string().optional(),
  sets: z.array(workoutSetSchema),
})

const createWorkoutSchema = z.object({
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date(),
  duration: z.number().int().positive(),
  notes: z.string().optional(),
  totalVolume: z.number().optional(),
  exercises: z.array(workoutExerciseSchema),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createWorkoutSchema.parse(body)

    // Create workout with exercises and sets
    const workout = await prisma.workout.create({
      data: {
        userId: session.user.id,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        duration: data.duration,
        notes: data.notes || null,
        totalVolume: data.totalVolume || null,
        workoutExercises: {
          create: data.exercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            order: index,
            notes: ex.notes || null,
            workoutSets: {
              create: ex.sets.map((set) => ({
                setNumber: set.setNumber,
                reps: set.reps,
                weight: set.weight,
                duration: set.duration,
                distance: set.distance,
                completedAt: set.completedAt,
              })),
            },
          })),
        },
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

    // Check for new personal records
    for (const workoutExercise of workout.workoutExercises) {
      const exerciseId = workoutExercise.exerciseId

      // Find max weight for this exercise
      const maxWeightSet = workoutExercise.workoutSets
        .filter((s) => s.weight !== null)
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))[0]

      if (maxWeightSet?.weight) {
        // Check if this is a PR
        const existingPR = await prisma.personalRecord.findFirst({
          where: {
            userId: session.user.id,
            exerciseId,
            recordType: "max_weight",
          },
          orderBy: { value: "desc" },
        })

        if (!existingPR || maxWeightSet.weight > existingPR.value) {
          // New PR!
          await prisma.personalRecord.create({
            data: {
              userId: session.user.id,
              exerciseId,
              recordType: "max_weight",
              value: maxWeightSet.weight,
              metadata: {
                reps: maxWeightSet.reps,
                workoutId: workout.id,
              },
              achievedAt: new Date(),
            },
          })
        }
      }

      // Check for max reps at any weight
      const maxRepsSet = workoutExercise.workoutSets
        .filter((s) => s.reps !== null)
        .sort((a, b) => (b.reps || 0) - (a.reps || 0))[0]

      if (maxRepsSet?.reps) {
        const existingPR = await prisma.personalRecord.findFirst({
          where: {
            userId: session.user.id,
            exerciseId,
            recordType: "max_reps",
          },
          orderBy: { value: "desc" },
        })

        if (!existingPR || maxRepsSet.reps > existingPR.value) {
          await prisma.personalRecord.create({
            data: {
              userId: session.user.id,
              exerciseId,
              recordType: "max_reps",
              value: maxRepsSet.reps,
              metadata: {
                weight: maxRepsSet.weight,
                workoutId: workout.id,
              },
              achievedAt: new Date(),
            },
          })
        }
      }
    }

    return NextResponse.json({ workout }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating workout:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = parseInt(searchParams.get("skip") || "0")

    const workouts = await prisma.workout.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: limit,
      skip,
      include: {
        workoutExercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                muscleGroups: true,
              },
            },
            workoutSets: true,
          },
          orderBy: { order: "asc" },
        },
      },
    })

    const total = await prisma.workout.count({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ workouts, total })
  } catch (error) {
    console.error("Error fetching workouts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
