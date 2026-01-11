"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Calendar, Plus, Trash2, Dumbbell } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Exercise {
  exerciseId: string;
  exerciseName?: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

interface Workout {
  dayNumber: number;
  workoutName: string;
  exercises: Exercise[];
}

export default function CreateProgramPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    durationWeeks: 4,
  });
  const [workouts, setWorkouts] = useState<Workout[]>([
    {
      dayNumber: 1,
      workoutName: "Day 1 - Full Body",
      exercises: [],
    },
  ]);

  // Fetch exercises on mount
  useState(() => {
    fetch("/api/exercises")
      .then((res) => res.json())
      .then((data) => setExercises(data.exercises || []))
      .catch((err) => console.error("Failed to load exercises:", err));
  });

  const addWorkout = () => {
    const nextDay = workouts.length + 1;
    if (nextDay > 7) {
      toast.error("Maximum 7 workouts per week");
      return;
    }
    setWorkouts([
      ...workouts,
      {
        dayNumber: nextDay,
        workoutName: `Day ${nextDay}`,
        exercises: [],
      },
    ]);
  };

  const removeWorkout = (index: number) => {
    const updated = workouts.filter((_, i) => i !== index);
    // Renumber days
    const renumbered = updated.map((w, i) => ({ ...w, dayNumber: i + 1 }));
    setWorkouts(renumbered);
  };

  const updateWorkout = (index: number, field: keyof Workout, value: any) => {
    const updated = [...workouts];
    updated[index] = { ...updated[index], [field]: value };
    setWorkouts(updated);
  };

  const addExerciseToWorkout = (workoutIndex: number) => {
    const updated = [...workouts];
    updated[workoutIndex].exercises.push({
      exerciseId: "",
      sets: 3,
      reps: 10,
    });
    setWorkouts(updated);
  };

  const removeExerciseFromWorkout = (workoutIndex: number, exerciseIndex: number) => {
    const updated = [...workouts];
    updated[workoutIndex].exercises = updated[workoutIndex].exercises.filter(
      (_, i) => i !== exerciseIndex
    );
    setWorkouts(updated);
  };

  const updateExercise = (
    workoutIndex: number,
    exerciseIndex: number,
    field: keyof Exercise,
    value: any
  ) => {
    const updated = [...workouts];
    updated[workoutIndex].exercises[exerciseIndex] = {
      ...updated[workoutIndex].exercises[exerciseIndex],
      [field]: value,
    };
    setWorkouts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Validate
      if (!formData.name.trim()) {
        toast.error("Program name is required");
        setIsCreating(false);
        return;
      }

      if (workouts.length === 0) {
        toast.error("Add at least one workout");
        setIsCreating(false);
        return;
      }

      // Check all exercises have exercise selected
      for (const workout of workouts) {
        if (workout.exercises.length === 0) {
          toast.error(`${workout.workoutName} needs at least one exercise`);
          setIsCreating(false);
          return;
        }
        for (const exercise of workout.exercises) {
          if (!exercise.exerciseId) {
            toast.error(`Select an exercise for all entries in ${workout.workoutName}`);
            setIsCreating(false);
            return;
          }
        }
      }

      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          workouts: workouts.map((w) => ({
            dayNumber: w.dayNumber,
            workoutName: w.workoutName,
            exercises: w.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              sets: e.sets,
              reps: e.reps,
              weight: e.weight,
              notes: e.notes,
            })),
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create program");
      }

      const data = await res.json();
      toast.success("Program created successfully!");
      router.push(`/programs/${data.program.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create program");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/programs">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Create Program</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
              <CardDescription>Basic information about your workout program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., 12-Week Strength Builder"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your program..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="durationWeeks">Duration (weeks) *</Label>
                  <Input
                    id="durationWeeks"
                    type="number"
                    min="1"
                    max="52"
                    value={formData.durationWeeks}
                    onChange={(e) =>
                      setFormData({ ...formData, durationWeeks: parseInt(e.target.value) || 1 })
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workouts */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Workouts</CardTitle>
                  <CardDescription>Add workouts for each day of the week</CardDescription>
                </div>
                <Button type="button" size="sm" onClick={addWorkout}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Workout
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {workouts.map((workout, workoutIndex) => (
                <div key={workoutIndex} className="p-4 border border-border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <Label>Workout Name</Label>
                      <Input
                        placeholder={`Day ${workout.dayNumber}`}
                        value={workout.workoutName}
                        onChange={(e) =>
                          updateWorkout(workoutIndex, "workoutName", e.target.value)
                        }
                      />
                    </div>
                    {workouts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWorkout(workoutIndex)}
                        className="ml-2"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {/* Exercises */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Exercises</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addExerciseToWorkout(workoutIndex)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Exercise
                      </Button>
                    </div>

                    {workout.exercises.map((exercise, exerciseIndex) => (
                      <div
                        key={exerciseIndex}
                        className="grid grid-cols-12 gap-2 items-end p-3 bg-secondary/50 rounded"
                      >
                        <div className="col-span-5 space-y-1">
                          <Label className="text-xs">Exercise</Label>
                          <Select
                            value={exercise.exerciseId}
                            onValueChange={(value) =>
                              updateExercise(workoutIndex, exerciseIndex, "exerciseId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select exercise" />
                            </SelectTrigger>
                            <SelectContent>
                              {exercises.map((ex) => (
                                <SelectItem key={ex.id} value={ex.id}>
                                  <div className="flex items-center gap-2">
                                    <Dumbbell className="w-3 h-3" />
                                    {ex.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Sets</Label>
                          <Input
                            type="number"
                            min="1"
                            value={exercise.sets}
                            onChange={(e) =>
                              updateExercise(
                                workoutIndex,
                                exerciseIndex,
                                "sets",
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Reps</Label>
                          <Input
                            type="number"
                            min="1"
                            value={exercise.reps}
                            onChange={(e) =>
                              updateExercise(
                                workoutIndex,
                                exerciseIndex,
                                "reps",
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Weight (kg)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={exercise.weight || ""}
                            onChange={(e) =>
                              updateExercise(
                                workoutIndex,
                                exerciseIndex,
                                "weight",
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )
                            }
                            placeholder="Optional"
                          />
                        </div>

                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExerciseFromWorkout(workoutIndex, exerciseIndex)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {workout.exercises.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No exercises added yet. Click "Add Exercise" to get started.
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {workouts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No workouts added yet. Click "Add Workout" to get started.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Link href="/programs" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isCreating} className="flex-1">
              {isCreating ? "Creating..." : "Create Program"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
