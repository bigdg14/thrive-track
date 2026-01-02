import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const settingsSchema = z.object({
  unitsPreference: z.enum(["metric", "imperial"]).optional(),
  notificationSettings: z.object({
    workoutReminders: z.boolean(),
    achievementAlerts: z.boolean(),
    weeklyReports: z.boolean(),
  }).optional(),
})

// GET - Fetch user settings
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        unitsPreference: true,
        notificationSettings: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Ensure notificationSettings has default values if not set
    const defaultNotificationSettings = {
      workoutReminders: true,
      achievementAlerts: true,
      weeklyReports: false,
    }

    let notificationSettings = defaultNotificationSettings
    if (user.notificationSettings && typeof user.notificationSettings === 'object') {
      notificationSettings = {
        ...defaultNotificationSettings,
        ...(user.notificationSettings as object),
      }
    }

    return NextResponse.json({
      settings: {
        unitsPreference: user.unitsPreference,
        notificationSettings,
      },
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update user settings
export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = settingsSchema.parse(body)

    // Build update data object, only including fields that are provided
    const updateData: any = {}
    if (validatedData.unitsPreference !== undefined) {
      updateData.unitsPreference = validatedData.unitsPreference
    }
    if (validatedData.notificationSettings !== undefined) {
      updateData.notificationSettings = validatedData.notificationSettings
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        unitsPreference: true,
        notificationSettings: true,
      },
    })

    return NextResponse.json({
      message: "Settings updated successfully",
      settings: user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
