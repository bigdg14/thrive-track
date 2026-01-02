import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ChevronLeft,
  Calendar,
  Clock,
  TrendingUp,
  Dumbbell,
  Award,
  Trash2
} from "lucide-react"
import { format } from "date-fns"
import { formatWeight } from "@/lib/utils"

async function getWorkout(id: string, userId: string) {
  const workout = await prisma.workout.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      workoutExercises: {
        include: {
          exercise: true,
          workoutSets: {
            orderBy: { setNumber: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  })

  return workout
}

async function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  async function deleteWorkout() {
    "use server"
    const session = await auth()
    if (!session?.user?.id) return

    await prisma.workout.delete({
      where: { id: workoutId, userId: session.user.id },
    })

    redirect("/workouts/history")
  }

  return (
    <form action={deleteWorkout}>
      <Button variant="destructive" size="sm" className="gap-2">
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
    </form>
  )
}

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const workout = await getWorkout(id, session.user.id)

  if (!workout) {
    notFound()
  }

  // Calculate total sets and volume per exercise
  const exerciseStats = workout.workoutExercises.map((we) => {
    const totalVolume = we.workoutSets.reduce((sum, set) => {
      if (set.reps && set.weight) {
        return sum + (set.reps * set.weight)
      }
      return sum
    }, 0)

    const maxWeight = Math.max(...we.workoutSets.map((s) => s.weight || 0))

    return {
      ...we,
      totalVolume,
      maxWeight,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/workouts/history">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Workout Details</h1>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(workout.startedAt), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <DeleteWorkoutButton workoutId={workout.id} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workout.duration} min</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workout.totalVolume ? Math.round(workout.totalVolume).toLocaleString() : 0} kg
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exercises</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workout.workoutExercises.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workout.workoutExercises.reduce((sum, we) => sum + we.workoutSets.length, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workout Notes */}
        {workout.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workout Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{workout.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Exercises */}
        <div className="space-y-4">
          {exerciseStats.map((we, index) => (
            <Card key={we.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </span>
                      {we.exercise.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {we.workoutSets.length} set{we.workoutSets.length !== 1 ? "s" : ""} •
                      {we.totalVolume > 0 && (
                        <> Total: {Math.round(we.totalVolume).toLocaleString()} kg • </>
                      )}
                      Max: {we.maxWeight} kg
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    {we.exercise.muscleGroups.slice(0, 2).map((muscle) => (
                      <Badge key={muscle} variant="secondary">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                    <div>Set</div>
                    <div className="text-right">Reps</div>
                    <div className="text-right">Weight</div>
                    <div className="text-right">Volume</div>
                  </div>

                  {/* Sets */}
                  {we.workoutSets.map((set) => (
                    <div key={set.id} className="grid grid-cols-4 gap-4 text-sm">
                      <div className="font-semibold">{set.setNumber}</div>
                      <div className="text-right">{set.reps || "-"}</div>
                      <div className="text-right">{set.weight ? `${set.weight} kg` : "-"}</div>
                      <div className="text-right">
                        {set.reps && set.weight ? `${(set.reps * set.weight).toLocaleString()} kg` : "-"}
                      </div>
                    </div>
                  ))}

                  {/* Exercise Notes */}
                  {we.notes && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-sm text-muted-foreground italic">{we.notes}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Muscle Groups Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Muscle Groups Worked</CardTitle>
            <CardDescription>Breakdown of muscles trained</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {Array.from(
                new Set(workout.workoutExercises.flatMap((we) => we.exercise.muscleGroups))
              ).map((muscle) => (
                <Badge key={muscle} variant="secondary" className="text-sm">
                  {muscle}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
