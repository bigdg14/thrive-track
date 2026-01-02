"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Trash2, Apple, Loader2, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface NutritionLog {
  id: string;
  date: string;
  mealType: string;
  foodName: string;
  servingSize?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

interface FoodSearchResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface NutritionTarget {
  dailyCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

export default function NutritionLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [targets, setTargets] = useState<NutritionTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [isTargetsDialogOpen, setIsTargetsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Food search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);

  // Log form state
  const [mealType, setMealType] = useState("breakfast");
  const [foodName, setFoodName] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  // Target form state
  const [dailyCalories, setDailyCalories] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [carbsTarget, setCarbsTarget] = useState("");
  const [fatTarget, setFatTarget] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchLogs();
      fetchTargets();
    }
  }, [status, router, selectedDate]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/nutrition/logs?date=${selectedDate}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load nutrition logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchTargets = async () => {
    try {
      const response = await fetch("/api/nutrition/targets");
      const data = await response.json();
      if (data.targets) {
        setTargets(data.targets);
        setDailyCalories(data.targets.dailyCalories.toString());
        setProteinTarget(data.targets.proteinTarget.toString());
        setCarbsTarget(data.targets.carbsTarget.toString());
        setFatTarget(data.targets.fatTarget.toString());
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
    }
  };

  const handleSearchFood = async () => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      toast.error("Please enter at least 2 characters");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/nutrition/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.foods || []);

      if (data.foods.length === 0) {
        toast.info("No foods found. Try a different search.");
      }
    } catch (error) {
      console.error("Error searching foods:", error);
      toast.error("Failed to search foods");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = (food: FoodSearchResult) => {
    setSelectedFood(food);
    setFoodName(food.name);
    setServingSize(food.servingSize);
    setCalories(food.calories.toString());
    setProtein(food.protein.toString());
    setCarbs(food.carbs.toString());
    setFat(food.fat.toString());
    setSearchResults([]);
    setSearchQuery("");
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!foodName || !calories || !protein || !carbs || !fat) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/nutrition/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          mealType,
          foodName,
          servingSize: servingSize || undefined,
          calories: parseInt(calories),
          protein: parseFloat(protein),
          carbs: parseFloat(carbs),
          fat: parseFloat(fat),
        }),
      });

      if (!response.ok) throw new Error("Failed to create log");

      toast.success("Food logged successfully!");
      setIsLogDialogOpen(false);
      resetLogForm();
      fetchLogs();
    } catch (error) {
      console.error("Error creating log:", error);
      toast.error("Failed to log food");
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;

    try {
      const response = await fetch(`/api/nutrition/logs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete log");

      toast.success("Log deleted");
      fetchLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Failed to delete log");
    }
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/nutrition/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyCalories: parseInt(dailyCalories),
          proteinTarget: parseFloat(proteinTarget),
          carbsTarget: parseFloat(carbsTarget),
          fatTarget: parseFloat(fatTarget),
        }),
      });

      if (!response.ok) throw new Error("Failed to save targets");

      toast.success("Nutrition targets updated!");
      setIsTargetsDialogOpen(false);
      fetchTargets();
    } catch (error) {
      console.error("Error saving targets:", error);
      toast.error("Failed to save targets");
    }
  };

  const resetLogForm = () => {
    setMealType("breakfast");
    setFoodName("");
    setServingSize("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setSelectedFood(null);
  };

  // Calculate daily totals
  const dailyTotals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const getPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Group logs by meal type
  const logsByMeal = {
    breakfast: logs.filter(l => l.mealType === "breakfast"),
    lunch: logs.filter(l => l.mealType === "lunch"),
    dinner: logs.filter(l => l.mealType === "dinner"),
    snack: logs.filter(l => l.mealType === "snack"),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading nutrition data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Apple className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Nutrition Tracking</h1>
              </div>
            </div>

            <div className="flex gap-2">
            <Dialog open={isTargetsDialogOpen} onOpenChange={setIsTargetsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                  Set Targets
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Set Nutrition Targets</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Set your daily calorie and macro targets
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveTargets} className="space-y-4">
                  <div>
                    <Label htmlFor="dailyCalories" className="text-gray-300">Daily Calories</Label>
                    <Input
                      id="dailyCalories"
                      type="number"
                      value={dailyCalories}
                      onChange={(e) => setDailyCalories(e.target.value)}
                      placeholder="2000"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="proteinTarget" className="text-gray-300">Protein (g)</Label>
                      <Input
                        id="proteinTarget"
                        type="number"
                        step="0.1"
                        value={proteinTarget}
                        onChange={(e) => setProteinTarget(e.target.value)}
                        placeholder="150"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="carbsTarget" className="text-gray-300">Carbs (g)</Label>
                      <Input
                        id="carbsTarget"
                        type="number"
                        step="0.1"
                        value={carbsTarget}
                        onChange={(e) => setCarbsTarget(e.target.value)}
                        placeholder="200"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="fatTarget" className="text-gray-300">Fat (g)</Label>
                      <Input
                        id="fatTarget"
                        type="number"
                        step="0.1"
                        value={fatTarget}
                        onChange={(e) => setFatTarget(e.target.value)}
                        placeholder="65"
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Save Targets
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTargetsDialogOpen(false)}
                      className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  <Plus className="mr-2 h-4 w-4" />
                  Log Food
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Log Food</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Search for food or enter manually
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateLog} className="space-y-4">
                  {/* Food Search */}
                  <div>
                    <Label className="text-gray-300">Search Food Database</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for food..."
                        className="bg-zinc-800 border-zinc-700 text-white"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchFood())}
                      />
                      <Button
                        type="button"
                        onClick={handleSearchFood}
                        disabled={searching}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-1 bg-zinc-800 rounded-md p-2">
                        {searchResults.map((food) => (
                          <button
                            key={food.id}
                            type="button"
                            onClick={() => handleSelectFood(food)}
                            className="w-full text-left p-2 hover:bg-zinc-700 rounded text-sm text-white"
                          >
                            <div className="font-medium">{food.name}</div>
                            <div className="text-xs text-gray-400">
                              {food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-800 pt-4">
                    <Label className="text-gray-300 mb-2 block">Or enter manually</Label>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="mealType" className="text-gray-300">Meal Type</Label>
                        <Select value={mealType} onValueChange={setMealType}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="breakfast">Breakfast</SelectItem>
                            <SelectItem value="lunch">Lunch</SelectItem>
                            <SelectItem value="dinner">Dinner</SelectItem>
                            <SelectItem value="snack">Snack</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="foodName" className="text-gray-300">Food Name *</Label>
                        <Input
                          id="foodName"
                          value={foodName}
                          onChange={(e) => setFoodName(e.target.value)}
                          placeholder="e.g., Chicken breast"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="servingSize" className="text-gray-300">Serving Size</Label>
                      <Input
                        id="servingSize"
                        value={servingSize}
                        onChange={(e) => setServingSize(e.target.value)}
                        placeholder="e.g., 100g, 1 cup"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="calories" className="text-gray-300">Calories *</Label>
                        <Input
                          id="calories"
                          type="number"
                          value={calories}
                          onChange={(e) => setCalories(e.target.value)}
                          placeholder="250"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="protein" className="text-gray-300">Protein (g) *</Label>
                        <Input
                          id="protein"
                          type="number"
                          step="0.1"
                          value={protein}
                          onChange={(e) => setProtein(e.target.value)}
                          placeholder="30"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="carbs" className="text-gray-300">Carbs (g) *</Label>
                        <Input
                          id="carbs"
                          type="number"
                          step="0.1"
                          value={carbs}
                          onChange={(e) => setCarbs(e.target.value)}
                          placeholder="10"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="fat" className="text-gray-300">Fat (g) *</Label>
                        <Input
                          id="fat"
                          type="number"
                          step="0.1"
                          value={fat}
                          onChange={(e) => setFat(e.target.value)}
                          placeholder="5"
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Log Food
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsLogDialogOpen(false);
                        resetLogForm();
                      }}
                      className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Date Selector */}
        <div className="mb-6">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white max-w-xs"
          />
        </div>

        {/* Macro Summary */}
        {targets && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Calories</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {dailyTotals.calories} / {targets.dailyCalories}
                </p>
                <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${getPercentage(dailyTotals.calories, targets.dailyCalories)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getPercentage(dailyTotals.calories, targets.dailyCalories)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Protein</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {Math.round(dailyTotals.protein)}g / {targets.proteinTarget}g
                </p>
                <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${getPercentage(dailyTotals.protein, targets.proteinTarget)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getPercentage(dailyTotals.protein, targets.proteinTarget)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Carbs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {Math.round(dailyTotals.carbs)}g / {targets.carbsTarget}g
                </p>
                <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${getPercentage(dailyTotals.carbs, targets.carbsTarget)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getPercentage(dailyTotals.carbs, targets.carbsTarget)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Fat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {Math.round(dailyTotals.fat)}g / {targets.fatTarget}g
                </p>
                <div className="w-full bg-zinc-800 rounded-full h-2 mt-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${getPercentage(dailyTotals.fat, targets.fatTarget)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {getPercentage(dailyTotals.fat, targets.fatTarget)}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!targets && (
          <Card className="bg-zinc-900 border-zinc-800 mb-8">
            <CardContent className="p-6 text-center">
              <Apple className="mx-auto h-8 w-8 text-gray-600 mb-2" />
              <p className="text-gray-400 mb-4">Set your nutrition targets to track your progress</p>
              <Button
                onClick={() => setIsTargetsDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Set Targets
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Meals */}
        <div className="space-y-6">
          {(["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => (
            <Card key={meal} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white capitalize">{meal}</CardTitle>
              </CardHeader>
              <CardContent>
                {logsByMeal[meal].length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No {meal} logged yet</p>
                ) : (
                  <div className="space-y-2">
                    {logsByMeal[meal].map((log) => (
                      <div key={log.id} className="flex justify-between items-center bg-zinc-800 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white font-medium">{log.foodName}</p>
                          {log.servingSize && (
                            <p className="text-xs text-gray-400">{log.servingSize}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {log.calories} cal | P: {log.protein}g | C: {log.carbs}g | F: {log.fat}g
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {logs.length === 0 && (
          <Card className="bg-zinc-900 border-zinc-800 mt-6">
            <CardContent className="p-12 text-center">
              <Apple className="mx-auto h-12 w-12 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">No meals logged for this day</p>
              <Button
                onClick={() => setIsLogDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Log Your First Meal
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
