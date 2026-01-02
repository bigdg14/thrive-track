import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// USDA FoodData Central API
// Get a free API key at: https://fdc.nal.usda.gov/api-key-signup.html
const USDA_API_KEY = process.env.USDA_API_KEY || "DEMO_KEY";
const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1";

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
  servingSize?: number;
  servingSizeUnit?: string;
}

interface SimplifiedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

function simplifyFoodData(food: USDAFood): SimplifiedFood {
  const nutrients = food.foodNutrients;

  // Find key nutrients by nutrient ID
  // 1008: Energy (calories), 1003: Protein, 1005: Carbs, 1004: Fat
  const calories = nutrients.find(n => n.nutrientId === 1008)?.value || 0;
  const protein = nutrients.find(n => n.nutrientId === 1003)?.value || 0;
  const carbs = nutrients.find(n => n.nutrientId === 1005)?.value || 0;
  const fat = nutrients.find(n => n.nutrientId === 1004)?.value || 0;

  const servingSize = food.servingSize && food.servingSizeUnit
    ? `${food.servingSize} ${food.servingSizeUnit}`
    : "100g";

  return {
    id: food.fdcId.toString(),
    name: food.description,
    calories: Math.round(calories),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    servingSize,
  };
}

// GET /api/nutrition/search - Search for foods
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const pageSize = parseInt(searchParams.get("pageSize") || "25");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search USDA FoodData Central
    const searchUrl = `${USDA_API_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=Foundation,SR Legacy`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      console.error("USDA API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to search food database" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Simplify the response
    const foods: SimplifiedFood[] = (data.foods || []).map(simplifyFoodData);

    return NextResponse.json({
      foods,
      totalResults: data.totalHits || 0,
    });
  } catch (error) {
    console.error("Error searching foods:", error);
    return NextResponse.json(
      { error: "Failed to search foods" },
      { status: 500 }
    );
  }
}

// GET /api/nutrition/search/[id] - Get detailed food info by FDC ID
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fdcId } = body;

    if (!fdcId) {
      return NextResponse.json(
        { error: "Food ID is required" },
        { status: 400 }
      );
    }

    // Get detailed food info from USDA
    const detailUrl = `${USDA_API_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`;

    const response = await fetch(detailUrl);

    if (!response.ok) {
      console.error("USDA API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch food details" },
        { status: response.status }
      );
    }

    const food: USDAFood = await response.json();
    const simplified = simplifyFoodData(food);

    return NextResponse.json({ food: simplified });
  } catch (error) {
    console.error("Error fetching food details:", error);
    return NextResponse.json(
      { error: "Failed to fetch food details" },
      { status: 500 }
    );
  }
}
