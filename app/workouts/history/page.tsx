import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, Dumbbell, Clock, TrendingUp, Activity } from "lucide-react"
import { formatDistanceToNow, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"

async function getWorkoutHistory(userId: string) {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [workouts, monthStats] = await Promise.all([
    // Get all workouts
    prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 30,
      include: {
        workoutExercises: {
          include: {
            exercise: {
              select: {
                name: true,
                muscleGroups: true,
              },
            },
            workoutSets: true,
          },
        },
      },
    }),
    // Get this month's workouts for calendar
    prisma.workout.findMany({
      where: {
        userId,
        startedAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        startedAt: true,
      },
    }),
  ])

  // Calculate stats
  const totalWorkouts = workouts.length
  const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0)
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0)
  const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0

  // Create calendar data
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const workoutDates = monthStats.map((w) => new Date(w.startedAt))

  return {
    workouts,
    stats: {
      totalWorkouts,
      totalVolume,
      totalDuration,
      avgDuration,
    },
    calendar: {
      days: calendarDays,
      workoutDates,
    },
  }
}

export default async function WorkoutHistoryPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const data = await getWorkoutHistory(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Workout History</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalWorkouts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(data.stats.totalVolume).toLocaleString()} kg</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(data.stats.totalDuration / 60)} hrs</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.avgDuration} min</div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
            <CardDescription>
              {format(startOfMonth(new Date()), "MMMM yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              {/* Calendar days */}
              {data.calendar.days.map((day, index) => {
                const hasWorkout = data.calendar.workoutDates.some((date) => isSameDay(date, day))
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={index}
                    className={`aspect-square p-2 rounded-lg flex items-center justify-center text-sm ${
                      hasWorkout
                        ? "bg-primary text-primary-foreground font-semibold"
                        : isToday
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted/50"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Workout List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <CardDescription>Your training history</CardDescription>
          </CardHeader>
          <CardContent>
            {data.workouts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium mb-1">No workouts yet</p>
                <p className="text-sm">Start your first workout to see it here!</p>
                <Link href="/workouts/active">
                  <Button className="mt-4">Start Workout</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.workouts.map((workout) => (
                  <Link key={workout.id} href={`/workouts/${workout.id}`}>
                    <div className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-lg">
                            {format(new Date(workout.startedAt), "EEEE, MMMM d")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(workout.startedAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          {workout.duration && (
                            <Badge variant="secondary" className="mb-1">
                              {workout.duration} min
                            </Badge>
                          )}
                          {workout.totalVolume && (
                            <p className="text-sm text-muted-foreground">
                              {Math.round(workout.totalVolume).toLocaleString()} kg
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Exercises */}
                      <div className="space-y-2">
                        {workout.workoutExercises.map((we) => (
                          <div key={we.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{we.exercise.name}</span>
                              <div className="flex gap-1">
                                {we.exercise.muscleGroups.slice(0, 2).map((muscle) => (
                                  <Badge key={muscle} variant="outline" className="text-xs">
                                    {muscle}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <span className="text-muted-foreground">
                              {we.workoutSets.length} set{we.workoutSets.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                      </div>

                      {workout.notes && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm text-muted-foreground italic">{workout.notes}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
