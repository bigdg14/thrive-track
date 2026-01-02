import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating a nutrition log
const createNutritionLogSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodName: z.string().min(1, "Food name is required"),
  servingSize: z.string().optional(),
  calories: z.number().int().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
});

// GET /api/nutrition/logs - Get nutrition logs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const mealType = searchParams.get("mealType");

    let dateFilter = {};
    if (date) {
      // Get logs for specific date
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      dateFilter = { date: { gte: startOfDay, lte: endOfDay } };
    } else if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    const logs = await prisma.nutritionLog.findMany({
      where: {
        userId: session.user.id,
        ...dateFilter,
        ...(mealType && { mealType }),
      },
      orderBy: [
        { date: "desc" },
        { createdAt: "asc" },
      ],
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching nutrition logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch nutrition logs" },
      { status: 500 }
    );
  }
}

// POST /api/nutrition/logs - Create a new nutrition log
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createNutritionLogSchema.parse(body);

    const log = await prisma.nutritionLog.create({
      data: {
        userId: session.user.id,
        ...validatedData,
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating nutrition log:", error);
    return NextResponse.json(
      { error: "Failed to create nutrition log" },
      { status: 500 }
    );
  }
}
