"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWorkoutStore } from "@/lib/stores/workout-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Dumbbell,
  Plus,
  X,
  Check,
  Clock,
  Play,
  Pause,
  ChevronLeft,
  Save,
  Search,
  Trash2,
  Timer
} from "lucide-react"
import { toast } from "sonner"
import { formatDuration } from "@/lib/utils"

type Exercise = {
  id: string
  name: string
  muscleGroups: string[]
  difficulty: string
  gifUrl: string | null
}

export default function ActiveWorkoutPage() {
  const router = useRouter()
  const {
    startedAt,
    exercises,
    currentExerciseIndex,
    notes,
    isResting,
    restDuration,
    restTimeRemaining,
    startWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    removeSet,
    setCurrentExercise,
    setNotes,
    startRestTimer,
    pauseRestTimer,
    resumeRestTimer,
    stopRestTimer,
    finishWorkout,
    cancelWorkout,
  } = useWorkoutStore()

  const [showExerciseDialog, setShowExerciseDialog] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isFinishing, setIsFinishing] = useState(false)
  const [workoutDuration, setWorkoutDuration] = useState(0)

  // Start workout on mount if not started
  useEffect(() => {
    if (!startedAt) {
      startWorkout()
    }
  }, [])

  // Update workout duration every second
  useEffect(() => {
    if (!startedAt) return

    const interval = setInterval(() => {
      const duration = Math.floor((new Date().getTime() - new Date(startedAt).getTime()) / 1000)
      setWorkoutDuration(duration)
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt])

  // Fetch exercises for selection
  useEffect(() => {
    async function fetchExercises() {
      try {
        const response = await fetch("/api/exercises")
        if (!response.ok) throw new Error("Failed to fetch exercises")
        const data = await response.json()
        setAvailableExercises(data.exercises)
      } catch (error) {
        console.error("Error fetching exercises:", error)
        toast.error("Failed to load exercises")
      }
    }
    fetchExercises()
  }, [])

  const filteredExercises = availableExercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddExercise = (exercise: Exercise) => {
    addExercise(exercise)
    setShowExerciseDialog(false)
    setSearchQuery("")
    toast.success(`${exercise.name} added to workout`)
  }

  const handleFinishWorkout = async () => {
    if (exercises.length === 0) {
      toast.error("Add at least one exercise to finish workout")
      return
    }

    const hasCompletedSets = exercises.some((ex) => ex.sets.length > 0)
    if (!hasCompletedSets) {
      toast.error("Complete at least one set to finish workout")
      return
    }

    setIsFinishing(true)
    try {
      await finishWorkout()
      toast.success("Workout saved successfully!", {
        description: "Great job! Check your progress in workout history.",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Error finishing workout:", error)
      toast.error("Failed to save workout. Please try again.")
    } finally {
      setIsFinishing(false)
    }
  }

  const handleCancelWorkout = () => {
    if (confirm("Are you sure you want to cancel this workout? All progress will be lost.")) {
      cancelWorkout()
      router.push("/dashboard")
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const currentExercise = exercises[currentExerciseIndex]

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={handleCancelWorkout}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Active Workout</h1>
                {startedAt && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatTime(workoutDuration)}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={handleFinishWorkout} disabled={isFinishing} className="gap-2">
              <Save className="w-4 h-4" />
              Finish
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Rest Timer */}
        {isResting && (
          <Card className="bg-primary/10 border-primary">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 56}
                      strokeDashoffset={2 * Math.PI * 56 * (1 - restTimeRemaining / restDuration)}
                      className="text-primary transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{formatTime(restTimeRemaining)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={pauseRestTimer} size="sm">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="outline" onClick={stopRestTimer} size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Skip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Exercise Button */}
        <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" size="lg">
              <Plus className="w-5 h-5" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Exercise</DialogTitle>
              <DialogDescription>Search and select an exercise to add to your workout</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => handleAddExercise(exercise)}
                    className="w-full p-3 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{exercise.name}</p>
                      <Badge variant="secondary">{exercise.difficulty}</Badge>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {exercise.muscleGroups.slice(0, 3).map((muscle) => (
                        <Badge key={muscle} variant="outline" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Exercise List */}
        {exercises.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium mb-1">No exercises yet</p>
                <p className="text-sm">Add an exercise to start your workout</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {exercises.map((workoutExercise, index) => (
              <Card key={workoutExercise.id} className={index === currentExerciseIndex ? "ring-2 ring-primary" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{workoutExercise.exercise.name}</CardTitle>
                      <CardDescription>
                        {workoutExercise.sets.length} set{workoutExercise.sets.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExercise(workoutExercise.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Sets Table */}
                  {workoutExercise.sets.length > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                        <div className="col-span-1">Set</div>
                        <div className="col-span-4">Reps</div>
                        <div className="col-span-5">Weight (kg)</div>
                        <div className="col-span-2"></div>
                      </div>
                      {workoutExercise.sets.map((set) => (
                        <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-1 text-center font-medium">{set.setNumber}</div>
                          <div className="col-span-4">
                            <Input
                              type="number"
                              placeholder="0"
                              value={set.reps || ""}
                              onChange={(e) =>
                                updateSet(workoutExercise.id, set.id, {
                                  reps: e.target.value ? parseInt(e.target.value) : null,
                                })
                              }
                              className="text-center"
                            />
                          </div>
                          <div className="col-span-5">
                            <Input
                              type="number"
                              step="0.5"
                              placeholder="0"
                              value={set.weight || ""}
                              onChange={(e) =>
                                updateSet(workoutExercise.id, set.id, {
                                  weight: e.target.value ? parseFloat(e.target.value) : null,
                                })
                              }
                              className="text-center"
                            />
                          </div>
                          <div className="col-span-2 flex gap-1">
                            {set.completedAt && (
                              <Check className="w-4 h-4 text-accent" />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeSet(workoutExercise.id, set.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addSet(workoutExercise.id)}
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Set
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        startRestTimer(90)
                        setCurrentExercise(index)
                      }}
                      disabled={isResting}
                    >
                      <Timer className="w-4 h-4 mr-2" />
                      Rest 90s
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        startRestTimer(120)
                        setCurrentExercise(index)
                      }}
                      disabled={isResting}
                    >
                      <Timer className="w-4 h-4 mr-2" />
                      Rest 2m
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
