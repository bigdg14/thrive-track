import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const profileSchema = z.object({
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  primaryGoals: z.array(
    z.enum(["weight_loss", "muscle_gain", "strength", "endurance", "general_fitness"])
  ).optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  age: z.number().int().positive().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  activityLevel: z.enum(["sedentary", "lightly_active", "active", "very_active"]).optional(),
  unitsPreference: z.enum(["metric", "imperial"]).optional(),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        fitnessLevel: true,
        primaryGoals: true,
        height: true,
        weight: true,
        age: true,
        gender: true,
        activityLevel: true,
        unitsPreference: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = profileSchema.parse(body)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        fitnessLevel: true,
        primaryGoals: true,
        height: true,
        weight: true,
        age: true,
        gender: true,
        activityLevel: true,
        unitsPreference: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
