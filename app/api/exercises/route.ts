import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const muscleGroup = searchParams.get("muscleGroup")
    const equipment = searchParams.get("equipment")
    const difficulty = searchParams.get("difficulty")
    const exerciseType = searchParams.get("type")

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (muscleGroup) {
      where.OR = [
        { muscleGroups: { has: muscleGroup } },
        { secondaryMuscles: { has: muscleGroup } },
      ]
    }

    if (equipment) {
      where.equipment = { has: equipment }
    }

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (exerciseType) {
      where.exerciseType = exerciseType
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        muscleGroups: true,
        secondaryMuscles: true,
        equipment: true,
        difficulty: true,
        exerciseType: true,
        gifUrl: true,
      },
    })

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error("Error fetching exercises:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
