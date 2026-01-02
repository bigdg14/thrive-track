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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, Target, TrendingUp, Calendar, Trophy, Trash2, Check, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Goal {
  id: string;
  goalType: string;
  title: string;
  description: string | null;
  targetValue: number;
  currentValue: number | null;
  unit: string | null;
  deadline: string | null;
  status: string;
  achievedAt: string | null;
  createdAt: string;
}

export default function GoalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Form state
  const [goalType, setGoalType] = useState("weight");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchGoals();
    }
  }, [status, router]);

  const fetchGoals = async (statusFilter?: string) => {
    try {
      const url = statusFilter
        ? `/api/goals?status=${statusFilter}`
        : "/api/goals?status=all";
      const response = await fetch(url);
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !targetValue) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalType,
          title,
          description: description || undefined,
          targetValue: parseFloat(targetValue),
          currentValue: currentValue ? parseFloat(currentValue) : undefined,
          unit,
          deadline: deadline || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to create goal");

      toast.success("Goal created successfully!");
      setIsDialogOpen(false);
      resetForm();
      fetchGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal");
    }
  };

  const handleMarkAsAchieved = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "achieved" }),
      });

      if (!response.ok) throw new Error("Failed to update goal");

      toast.success("Congratulations! Goal achieved! 🎉");
      fetchGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete goal");

      toast.success("Goal deleted");
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const resetForm = () => {
    setGoalType("weight");
    setTitle("");
    setDescription("");
    setTargetValue("");
    setCurrentValue("");
    setUnit("kg");
    setDeadline("");
  };

  const calculateProgress = (goal: Goal): number => {
    if (!goal.currentValue) return 0;
    return Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
  };

  const getGoalTypeColor = (type: string) => {
    switch (type) {
      case "weight":
        return "bg-blue-500";
      case "strength":
        return "bg-red-500";
      case "consistency":
        return "bg-green-500";
      case "body_composition":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-600">Active</Badge>;
      case "achieved":
        return <Badge className="bg-green-600">Achieved</Badge>;
      case "abandoned":
        return <Badge variant="secondary">Abandoned</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const achievedGoals = goals.filter((g) => g.status === "achieved");
  const allGoals = goals;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading goals...</p>
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
                <Target className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Goals</h1>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Plus className="mr-2 h-4 w-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Goal</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Set a new fitness goal to track your progress
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <Label htmlFor="goalType" className="text-gray-300">Goal Type</Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="weight">Weight Goal</SelectItem>
                      <SelectItem value="strength">Strength Goal</SelectItem>
                      <SelectItem value="consistency">Consistency Goal</SelectItem>
                      <SelectItem value="body_composition">Body Composition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title" className="text-gray-300">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Lose 10kg, Bench 100kg"
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    className="bg-zinc-800 border-zinc-700 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetValue" className="text-gray-300">Target Value *</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      step="0.1"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="100"
                      className="bg-zinc-800 border-zinc-700 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit" className="text-gray-300">Unit</Label>
                    <Input
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="kg, lbs, %"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentValue" className="text-gray-300">Current Value</Label>
                  <Input
                    id="currentValue"
                    type="number"
                    step="0.1"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="Optional"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="deadline" className="text-gray-300">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Create Goal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
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
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <Target className="mr-2 h-4 w-4" />
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{activeGoals.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <Trophy className="mr-2 h-4 w-4" />
                Achieved Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{achievedGoals.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Total Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{allGoals.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Goals List with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="active" className="data-[state=active]:bg-zinc-800">
              Active ({activeGoals.length})
            </TabsTrigger>
            <TabsTrigger value="achieved" className="data-[state=active]:bg-zinc-800">
              Achieved ({achievedGoals.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800">
              All ({allGoals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeGoals.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-12 text-center">
                  <Target className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4">No active goals yet</p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeGoals.map((goal) => (
                  <Card key={goal.id} className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getGoalTypeColor(goal.goalType)}`} />
                            <CardTitle className="text-white text-lg">{goal.title}</CardTitle>
                          </div>
                          {goal.description && (
                            <CardDescription className="text-gray-400">
                              {goal.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsAchieved(goal.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {goal.currentValue !== null && (
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-white font-medium">
                                {goal.currentValue} / {goal.targetValue} {goal.unit}
                              </span>
                            </div>
                            <Progress value={calculateProgress(goal)} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              {calculateProgress(goal)}% complete
                            </p>
                          </div>
                        )}

                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center text-gray-400">
                            <Calendar className="mr-2 h-4 w-4" />
                            {goal.deadline
                              ? `Due ${format(new Date(goal.deadline), "MMM d, yyyy")}`
                              : "No deadline"}
                          </div>
                          {getStatusBadge(goal.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achieved" className="mt-6">
            {achievedGoals.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-12 text-center">
                  <Trophy className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400">No achieved goals yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {achievedGoals.map((goal) => (
                  <Card key={goal.id} className="bg-zinc-900 border-zinc-800 border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-green-500" />
                            {goal.title}
                          </CardTitle>
                          {goal.description && (
                            <CardDescription className="text-gray-400 mt-1">
                              {goal.description}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>Target: {goal.targetValue} {goal.unit}</span>
                        {goal.achievedAt && (
                          <span>Achieved: {format(new Date(goal.achievedAt), "MMM d, yyyy")}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {allGoals.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-12 text-center">
                  <Target className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4">No goals yet</p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {allGoals.map((goal) => (
                  <Card key={goal.id} className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getGoalTypeColor(goal.goalType)}`} />
                            <CardTitle className="text-white text-lg">{goal.title}</CardTitle>
                          </div>
                          {goal.description && (
                            <CardDescription className="text-gray-400">
                              {goal.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {goal.status === "active" && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsAchieved(goal.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex gap-4 text-sm">
                          {getStatusBadge(goal.status)}
                          <span className="text-gray-400">
                            Target: {goal.targetValue} {goal.unit}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
